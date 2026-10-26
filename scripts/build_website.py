#!/usr/bin/env python3
"""Build the portable static website from the audited bilingual archive.

Python's standard library and Node.js build the archive and achievement ledger
in one staging directory. The published classic scripts also work over file://;
the finished site needs no backend or fetch().
"""
from __future__ import annotations

import collections
import datetime as dt
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import subprocess
import tempfile


ROOT = Path(__file__).resolve().parents[1]
WEBSITE = ROOT / 'website'
SOURCE = WEBSITE / 'src'
OUTPUT = WEBSITE / 'dist'


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def file_hash(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_edition(language: str) -> tuple[dict, Path]:
    path = ROOT / language / 'data/physicists.json'
    data = json.loads(path.read_text(encoding='utf-8'))
    require(data['count'] == len(data['people']), f'{language}: source count mismatch')
    ids = [person['id'] for person in data['people']]
    require(len(ids) == len(set(ids)), f'{language}: duplicate person IDs')
    return data, path


def bilingual_date(chinese: dict | None, english: dict | None, label: str) -> dict | None:
    require(bool(chinese) == bool(english), f'{label}: date presence differs')
    if chinese is None:
        return None
    require(chinese['date'] == english['date'], f'{label}: date value differs')
    require(chinese['precision'] == english['precision'], f'{label}: precision differs')
    require(bool(chinese['display']) and bool(english['display']), f'{label}: empty date display')
    return {
        'date': chinese['date'],
        'precision': chinese['precision'],
        'display': {'zh': chinese['display'], 'en': english['display']},
    }


def archive_data() -> tuple[dict, dict[str, Path], dict]:
    zh, zh_path = load_edition('zh')
    en, en_path = load_edition('en')
    require(zh['as_of'] == en['as_of'], 'Edition review dates differ')
    require([p['id'] for p in zh['people']] == [p['id'] for p in en['people']],
            'Edition IDs or chronological order differ')
    people, assets = [], {}
    verified_assets = {}
    for chinese, english in zip(zh['people'], en['people']):
        identity = chinese['id']
        for field in ['order', 'sort_year', 'death_status', 'nobel_physics_years']:
            require(chinese.get(field) == english.get(field), f'{identity}: {field} differs')
        for language, person in [('zh', chinese), ('en', english)]:
            require(bool(person['biography']) and len(person['contributions']) >= 2,
                    f'{identity}: incomplete {language} biography or contributions')
            require(bool(person['fields']) and bool(person['sources']),
                    f'{identity}: missing {language} fields or sources')
            for source in person['sources']:
                require(bool(source['title']) and source['url'].startswith(('https://', 'http://')),
                        f'{identity}: invalid {language} source')
        require({s['url'] for s in chinese['sources']} == {s['url'] for s in english['sources']},
                f'{identity}: bilingual source URL sets differ')
        zp, ep = chinese['portrait'], english['portrait']
        for field in ['local_path', 'sha256', 'kind', 'rights_status', 'license_url', 'source_page', 'commons_page']:
            require(zp.get(field) == ep.get(field), f'{identity}: portrait {field} differs')
        relative = PurePosixPath(zp['local_path'])
        require(not relative.is_absolute() and '..' not in relative.parts and relative.parts[0] == 'portraits',
                f'{identity}: invalid local portrait path')
        image_path = 'portraits/' + relative.name
        for language in ['zh', 'en']:
            path = ROOT / language / str(relative)
            require(path.is_file(), f'{identity}: missing {language} image')
            stat = path.stat()
            inode = (stat.st_dev, stat.st_ino, stat.st_size)
            if inode not in verified_assets:
                verified_assets[inode] = file_hash(path)
            require(verified_assets[inode] == zp['sha256'], f'{identity}: {language} image hash differs')
        if image_path in assets:
            require(file_hash(assets[image_path]) == zp['sha256'], f'{identity}: colliding image basenames')
        assets[image_path] = ROOT / 'zh' / str(relative)
        people.append({
            'id': identity,
            'order': chinese['order'],
            'sortYear': chinese['sort_year'],
            'names': {'zh': chinese.get('name') or chinese['name_zh'], 'en': english.get('name') or english['name_en']},
            'birth': bilingual_date(chinese['birth'], english['birth'], identity + ' birth'),
            'death': bilingual_date(chinese.get('death'), english.get('death'), identity + ' death'),
            'deathStatus': chinese['death_status'],
            'fields': {'zh': chinese['fields'], 'en': english['fields']},
            'biography': {'zh': chinese['biography'], 'en': english['biography']},
            'contributions': {'zh': chinese['contributions'], 'en': english['contributions']},
            'notes': {'zh': chinese['notes'], 'en': english['notes']},
            'sources': {'zh': chinese['sources'], 'en': english['sources']},
            'nobelYears': chinese['nobel_physics_years'],
            'portrait': {
                'path': image_path,
                'kind': zp['kind'],
                'note': {'zh': zp['depiction_note'], 'en': ep['depiction_note']},
                'alt': {'zh': zp.get('alt_zh') or chinese['name_zh'], 'en': ep['alt']},
                'artist': {'zh': zp.get('artist', ''), 'en': ep.get('artist', '')},
                'credit': {'zh': zp.get('credit', ''), 'en': ep.get('credit', '')},
                'license': {'zh': zp['license'], 'en': ep['license']},
                'licenseUrl': zp.get('license_url', ''),
                'sourceUrl': zp.get('source_page') or zp.get('commons_page', ''),
                'rightsStatus': zp.get('rights_status') or 'source_license_recorded',
            },
        })
        require(people[-1]['portrait']['sourceUrl'].startswith(('https://', 'http://')),
                f'{identity}: image source URL missing')
    require([p['order'] for p in people] == list(range(1, len(people) + 1)), 'Chronological order indices are invalid')
    require([p['sortYear'] for p in people] == sorted(p['sortYear'] for p in people), 'Birth chronology is invalid')
    date_keys = []
    for person in people:
        match = re.fullmatch(r'(-?\d{4})(?:-(\d{2}))?(?:-(\d{2}))?', person['birth']['date'])
        require(bool(match), person['id'] + ': invalid birth-date syntax')
        year, month, day = match.groups()
        date_keys.append((int(year), int(month or 1), int(day or 1)))
    require(date_keys == sorted(date_keys), 'Birth-date chronology is invalid within a year')
    return ({'asOf': zh['as_of'], 'count': len(people), 'people': people}, assets,
            {str(zh_path.relative_to(ROOT)): file_hash(zh_path), str(en_path.relative_to(ROOT)): file_hash(en_path)})


def link_or_copy(source: Path, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    try:
        os.link(source, destination)
    except OSError:
        shutil.copyfile(source, destination)


def main() -> None:
    data, assets, source_hashes = archive_data()
    require((SOURCE / 'index.html').is_file(), 'Missing canonical website/src/index.html')
    WEBSITE.mkdir(parents=True, exist_ok=True)
    staging = Path(tempfile.mkdtemp(prefix='.dist-build-', dir=WEBSITE))
    backup = None
    try:
        static_files = []
        if SOURCE.exists():
            for source in sorted(SOURCE.rglob('*')):
                if not source.is_file():
                    continue
                relative = source.relative_to(SOURCE)
                name = relative.as_posix()
                require(name not in ['data/archive.js', 'build-report.json'] and not name.startswith('portraits/'),
                        'Static source conflicts with generated data: ' + name)
                destination = staging / relative
                destination.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(source, destination)
                static_files.append(name)
        require((staging / 'core.js').is_file(), 'Missing canonical website/src/core.js')
        script = '// Generated from the audited bilingual archive. Rebuild with scripts/build_website.py.\n'
        script += 'globalThis.PHYSICS_ARCHIVE = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/').replace('\u2028', '\\u2028').replace('\u2029', '\\u2029') + ';\n'
        (staging / 'data').mkdir(parents=True, exist_ok=True)
        (staging / 'data/archive.js').write_text(script, encoding='utf-8')
        for relative, source in assets.items():
            link_or_copy(source, staging / relative)
        # Never run against the live output: a failed ledger computation must
        # leave the previous complete site intact.
        subprocess.run([
            'node', str(ROOT / 'scripts/build_breakthrough.cjs'),
            '--archive-dir', str(staging), '--output-dir', str(staging / 'data'),
            '--artifacts-only',
        ], check=True, cwd=ROOT)
        summary_path = staging / 'data/build-summary.json'
        require(summary_path.is_file(), 'Missing breakthrough build summary')
        breakthrough = json.loads(summary_path.read_text(encoding='utf-8'))
        require(breakthrough['counts']['totalPeople'] == data['count'],
                'Breakthrough archive does not match the bilingual people archive')
        require(breakthrough['counts']['navigablePeople'] == data['count'],
                'Breakthrough navigation is incomplete')
        for artifact in ['breakthrough-data.js', 'events.json', 'yearly-index.json',
                         'navigation-estimates.json', 'coverage.json', 'sensitivity.json',
                         'method.zh.md', 'method.en.md']:
            require((staging / 'data' / artifact).is_file(), 'Missing built artifact: ' + artifact)
        report = {
            'builtAt': dt.datetime.now(dt.timezone.utc).isoformat(),
            'asOf': data['asOf'],
            'people': data['count'],
            'languages': ['zh', 'en'],
            'images': len(assets),
            'imageKinds': dict(collections.Counter(p['portrait']['kind'] for p in data['people'])),
            'imagePermissionUnverified': sum(p['portrait']['rightsStatus'] == 'permission_required' for p in data['people']),
            'sourceSha256': source_hashes,
            'dataScriptSha256': file_hash(staging / 'data/archive.js'),
            'staticFiles': static_files,
            'entrypointPresent': (staging / 'index.html').is_file(),
            'entrypoint': 'index.html',
            'sourceDirectory': 'website/src',
            'sourceEntrypointSha256': file_hash(SOURCE / 'index.html'),
            'entrypointSha256': file_hash(staging / 'index.html'),
            'breakthrough': breakthrough,
            'methodVersion': breakthrough['methodVersion'],
            'checks': ['stable IDs and order', 'date values and precision', 'life status', 'source URL alignment',
                       'complete localized text', 'bilingual image hashes', 'portable image paths',
                       'canonical frontend', 'complete achievement ledger', 'complete navigation',
                       'self-contained output'],
        }
        (staging / 'build-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        if OUTPUT.exists():
            backup = Path(tempfile.mkdtemp(prefix='.dist-previous-', dir=WEBSITE))
            backup.rmdir()
            OUTPUT.rename(backup)
        try:
            staging.rename(OUTPUT)
        except Exception:
            if backup is not None:
                backup.rename(OUTPUT)
                backup = None
            raise
        if backup is not None:
            shutil.rmtree(backup)
        print(json.dumps({key: report[key] for key in ['people', 'images', 'imageKinds', 'imagePermissionUnverified', 'entrypointPresent', 'entrypoint', 'methodVersion']}, ensure_ascii=False, indent=2))
        print('Static output:', OUTPUT)
        if not report['entrypointPresent']:
            print('Website data is ready; add the page files in website/src and rebuild to include the entrypoint.')
    finally:
        if staging.exists():
            shutil.rmtree(staging)


if __name__ == '__main__':
    main()
