#!/usr/bin/env python3
"""Validate delivered dossiers, sorting, coverage, image bytes and local links."""
import datetime
import hashlib
import json
import pathlib
import re
from build import ROOT, birth_key

def main():
    data = json.loads((ROOT / 'data/physicists.json').read_text())
    people = data['people']
    errors, warnings = [], []
    def check(ok, message):
        if not ok:
            errors.append(message)
    check(data['count'] == len(people), 'people count differs from metadata')
    check(people == sorted(people, key=birth_key), 'chronology is not ascending')
    check(len(set(p['id'] for p in people)) == len(people), 'duplicate id')
    check(len(set(p['wikipedia_title'] for p in people)) == len(people), 'duplicate English Wikipedia identity')
    qids = {}
    for p in people:
        prefix = p['id'] + ': '
        check(len(p.get('biography', '')) >= 40, prefix + 'biography too short')
        check(len(p.get('contributions', [])) >= 2, prefix + 'fewer than two contribution summaries')
        check(bool(p.get('fields')), prefix + 'no fields')
        check(bool(p.get('sources')), prefix + 'no sources')
        check(p.get('death_status') in ['alive', 'deceased', 'unknown'], prefix + 'invalid death status')
        check(not (p.get('death') and p['death_status'] == 'alive'), prefix + 'death date contradicts alive')
        for key in ['birth', 'death']:
            d = p.get(key)
            if d:
                check(bool(d.get('display')), prefix + key + ' has no display form')
                check(d.get('precision') in ['day', 'month', 'year', 'approximate'], prefix + key + ' precision invalid')
                date = d.get('date', '')
                check(bool(re.fullmatch(r'-?\d{4}(?:-\d{2})?(?:-\d{2})?', date)), prefix + key + ' date syntax invalid: ' + date)
                if re.fullmatch(r'\d{4}-\d{2}-\d{2}', date):
                    try:
                        datetime.date.fromisoformat(date)
                    except ValueError:
                        errors.append(prefix + key + ' invalid calendar date: ' + date)
        if p.get('death'):
            check(birth_key({'birth': p['death'], 'name_en': ''})[:3] >= birth_key(p)[:3], prefix + 'death before birth')
        for s in p['sources']:
            check(bool(s.get('title')), prefix + 'source without title')
            check(s.get('url', '').startswith(('https://', 'http://')), prefix + 'invalid source URL')
        qid = p.get('wikidata_id')
        if qid:
            if qid in qids:
                errors.append(prefix + 'same Wikidata id as ' + qids[qid])
            qids[qid] = p['id']
        path = ROOT / p['source_file']
        check(path.is_file(), prefix + 'dossier missing')
        portrait = p.get('portrait')
        check(bool(portrait), prefix + 'image missing')
        if portrait:
            image = ROOT / portrait['local_path']
            check(image.is_file(), prefix + 'image file missing')
            check(bool(portrait.get('license')), prefix + 'image license/status missing')
            check(bool(portrait.get('source_page') or portrait.get('commons_page')), prefix + 'image source missing')
            check(portrait.get('original_url', '').startswith(('https://', 'http://')), prefix + 'image original URL is not a public source')
            for field in ['artist', 'credit', 'description', 'license']:
                check(not re.search(r'\.mw-parser-output|@media\s|<style\b|<script\b', portrait.get(field, ''), re.I), prefix + 'stylesheet or script in image ' + field)
            license_url = portrait.get('license_url', '')
            if license_url:
                check(license_url.startswith(('http://', 'https://')), prefix + 'invalid licence statement URL')
                check('upload.wikimedia.org/' not in license_url and 'thumb.wikimedia.org/' not in license_url, prefix + 'licence link incorrectly points to image bytes')
            if portrait.get('asset_source_path'):
                check(not pathlib.Path(portrait['asset_source_path']).is_absolute() and not portrait['asset_source_path'].startswith('file:'), prefix + 'image source cache path is not portable')
            check(portrait.get('kind') in ['portrait', 'posthumous_depiction', 'context_image'], prefix + 'invalid image kind')
            if image.exists():
                check(hashlib.sha256(image.read_bytes()).hexdigest() == portrait['sha256'], prefix + 'image hash mismatch')
                try:
                    from PIL import Image
                    with Image.open(image) as im:
                        im.verify()
                except ImportError:
                    pass
                except Exception as exc:
                    if image.suffix.lower() != '.svg':
                        errors.append(prefix + 'image decode failed: ' + str(exc))
            if portrait.get('rights_status') == 'permission_required':
                warnings.append(prefix + '图片已存档，网站再发布授权尚未确认')
            if portrait.get('kind') == 'context_image':
                warnings.append(prefix + '配图为相关资料图，非本人肖像')
        if path.exists():
            text = path.read_text()
            check('## 生平简介' in text and '## 对物理的主要贡献' in text, prefix + 'required dossier section missing')
            for link in re.findall(r'\]\(([^)]+)\)', text):
                if link.startswith('../portraits/'):
                    check((path.parent / link).is_file(), prefix + 'broken local portrait link')
    official = json.loads((ROOT / 'data/raw/nobel-laureates.json').read_text())['laureates']
    expected = {p['id'] for p in official if any(n['category']['en'] == 'Physics' and n['awardYear'] <= '2026' for n in p['nobelPrizes'])}
    actual = {p['nobel_id'] for p in people if p.get('nobel_id')}
    check(expected == actual, 'Nobel official cohort incomplete or contains unexpected ids')
    check(len(list((ROOT / 'people').glob('*.md'))) == len(people), 'dossier count mismatch')
    timeline = json.loads((ROOT / 'data/timeline.json').read_text())
    check([p['id'] for p in timeline] == [p['id'] for p in people], 'timeline differs from full records')
    report = {'passed': not errors, 'people_checked': len(people), 'nobel_people_checked': len(actual),
              'images_checked': sum(bool(p.get('portrait')) for p in people), 'errors': errors, 'notes': warnings}
    (ROOT / 'data/validation-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({k: v for k, v in report.items() if k != 'notes'}, ensure_ascii=False, indent=2))
    print('Source/image notes:', len(warnings))
    raise SystemExit(0 if not errors else 1)

if __name__ == '__main__':
    main()
