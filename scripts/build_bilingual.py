#!/usr/bin/env python3
"""Build two self-contained language editions from one verified fact set."""
import copy
import json
import os
import pathlib
import re
import shutil
import urllib.parse as up
from build import ROOT, AS_OF
from make_nobel_en import date_display

def cjk(s):
    return bool(re.search(r'[\u3400-\u9fff]', str(s)))

def save(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + '\n')

def translations():
    result = {}
    for file in sorted((ROOT / 'data/translations').glob('*.en.json')):
        rows = json.loads(file.read_text())
        if not isinstance(rows, list):
            continue
        for row in rows:
            if row['id'] in result:
                raise ValueError('Duplicate English translation: ' + row['id'])
            result[row['id']] = row
    return result

def link_asset(source, target):
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists():
        if source.stat().st_ino == target.stat().st_ino and source.stat().st_dev == target.stat().st_dev:
            return
        target.unlink()
    try:
        os.link(source, target)
    except OSError:
        shutil.copyfile(source, target)

def english_record(p, translation):
    o = copy.deepcopy(p)
    o.pop('name_zh', None)
    o['name'] = translation.get('name_en') or p['name_en']
    o['name_en'] = o['name']
    for field in ['biography', 'contributions', 'fields', 'notes']:
        if field not in translation:
            raise ValueError('Missing translated ' + field + ': ' + p['id'])
        o[field] = copy.deepcopy(translation[field])
    if p.get('notes') and not o['notes']:
        raise ValueError('Historical notes omitted from English: ' + p['id'])
    o['birth']['display'] = translation.get('birth_display') or date_display(p['birth'])
    if p.get('death'):
        o['death']['display'] = translation.get('death_display') or date_display(p['death'])
    o['editorial_basis'] = translation.get('editorial_basis', 'English rendering of the source-checked Chinese record, with dates and factual metadata shared between editions.')
    translated_sources = {s['url']: s for s in translation.get('sources', [])}
    o['sources'] = [copy.deepcopy(translated_sources.get(s['url']) or s) for s in p['sources']]
    for s in o['sources']:
        if cjk(s.get('title', '')):
            s['title_original'] = s['title']
            s['title'] = 'Biographical source for ' + o['name'] + ' — ' + up.urlparse(s['url']).netloc
    portrait = o.get('portrait')
    if portrait:
        kind = portrait['kind']
        portrait.pop('alt_zh', None)
        portrait['alt'] = translation.get('portrait_alt') or ('Related historical document for ' if kind == 'context_image' else 'Portrait of ') + o['name']
        note = portrait.get('depiction_note_en') or translation.get('portrait_note') or 'See the original image record for its creator, date and description.'
        if kind == 'context_image':
            portrait['alt'] = 'Related historical document for ' + o['name'] + '; not a portrait'
            if not re.search(r'not (?:a |an? )?portrait|not .*likeness|no .*portrait|document|manuscript|title.page|front.page', note, re.I):
                note = 'This is a related historical document, not a portrait of the subject. ' + note
        elif kind == 'posthumous_depiction' and not re.search(r'posthumous|later|traditional|imagined|not .*lifetime|not .*contemporary|statue|bust|memorial', note, re.I):
            note = 'This later or traditional representation is not an authenticated likeness made during the subject\'s lifetime. ' + note
        portrait['depiction_note'] = note
        artist = portrait.get('artist', '')
        for original, translated in [
            ('作者未明确；英文维基百科非自由历史肖像', 'Creator not identified; non-free historical portrait hosted by English Wikipedia'),
            ('摄影者未明确；英文维基百科非自由历史肖像', 'Photographer not identified; non-free historical portrait hosted by English Wikipedia'),
            ('摄影者未注明', 'Photographer not identified'),
            ('摄影者未明确', 'Photographer not identified'),
            ('不詳', 'Unknown'),
            ('不详', 'Unknown'),
        ]:
            artist = artist.replace(original, translated)
        if artist != portrait.get('artist', ''):
            portrait['artist_original'] = portrait['artist']
            portrait['artist'] = artist.replace('；', '; ')
        if cjk(portrait.get('description', '')):
            portrait['description_original'] = portrait.pop('description')
        if cjk(portrait.get('license', '')):
            portrait['license_original'] = portrait['license']
            portrait['license'] = 'Copyrighted or republication permission unverified; consult the original record'
        if cjk(portrait.get('credit', '')):
            portrait['credit_original'] = portrait['credit']
            portrait['credit'] = 'Original credit is retained in the source record.'
        # Creators' names and original-language legal attributions are preserved,
        # rather than silently replaced with invented Romanizations.
    for field in ['editorial_basis', 'biography', 'birth']:
        if field != 'birth' and cjk(o.get(field, '')):
            raise ValueError('Chinese prose in English field ' + field + ': ' + p['id'])
    return o

def status(p, lang):
    if p.get('death'):
        return p['death']['display']
    if lang == 'en':
        return {'alive': 'Living (as of ' + AS_OF + ')', 'unknown': 'Death date or whereabouts uncertain', 'deceased': 'Death date unknown'}[p['death_status']]
    return {'alive': '在世（截至' + AS_OF + '）', 'unknown': '下落／死亡时间不详', 'deceased': '逝世日期不详'}[p['death_status']]

def dossier(p):
    portrait = p['portrait']
    lines = ['# ' + p['name'], '', '**Born:** ' + p['birth']['display'], '', '**Died / status:** ' + status(p, 'en'), '',
             '**Fields:** ' + ', '.join(p['fields']), '', '![' + portrait['alt'] + '](../' + portrait['local_path'] + ')', '',
             portrait['depiction_note'], '', '## Biography', '', p['biography'], '', '## Major contributions to physics', '']
    lines.extend('- ' + c for c in p['contributions'])
    if p.get('nobel_physics_years'):
        lines += ['', '**Nobel Prize in Physics:** ' + ', '.join(map(str, p['nobel_physics_years']))]
    if p['notes']:
        lines += ['', '## Historical and source notes', ''] + ['- ' + n for n in p['notes']]
    source_page = portrait.get('source_page') or portrait.get('commons_page')
    license = portrait['license']
    if portrait.get('license_url', '').startswith('http'):
        license = '[' + license + '](' + portrait['license_url'] + ')'
    lines += ['', '## Image source and rights', '', '- Source: [Original image record](' + source_page + ')',
              '- Creator / attribution: ' + (portrait.get('artist') or 'See the original image record'),
              '- License or rights statement: ' + license,
              '- Local image: [' + pathlib.Path(portrait['local_path']).name + '](../' + portrait['local_path'] + ')']
    if portrait.get('credit'):
        lines.append('- Credit: ' + portrait['credit'])
    if portrait.get('rights_status') == 'permission_required':
        lines.append('- Republication: permission for use on a public website has not been verified. Confirm permission with the rightsholder or replace the image before publication.')
    lines += ['', '## Sources', ''] + ['- [' + s['title'] + '](' + s['url'] + ')' for s in p['sources']]
    lines += ['', 'Record reviewed: ' + AS_OF + '.', '']
    return '\n'.join(lines)

def edition(lang, people, metadata):
    directory = ROOT / lang
    for name in ['people', 'portraits', 'data', 'docs']:
        (directory / name).mkdir(parents=True, exist_ok=True)
    for old in (directory / 'people').glob('*.md'):
        old.unlink()
    used = set()
    for p in people:
        portrait = p['portrait']
        asset = portrait['local_path']
        used.add(asset)
        link_asset(ROOT / asset, directory / asset)
        path = directory / p['source_file']
        if lang == 'en':
            path.write_text(dossier(p))
        else:
            shutil.copyfile(ROOT / p['source_file'], path)
    for old in (directory / 'portraits').iterdir():
        if old.is_file() and str(old.relative_to(directory)) not in used:
            old.unlink()
    localized = copy.deepcopy(metadata)
    localized.update({'schema_version': '2.0.0', 'language': 'en' if lang == 'en' else 'zh-CN', 'title': 'Physics Pioneers Archive' if lang == 'en' else '物理学先驱档案', 'people': people, 'count': len(people)})
    save(directory / 'data/physicists.json', localized)
    save(directory / 'data/timeline.json', [{k: p.get(k) for k in ['id', 'order', 'name', 'name_en', 'birth', 'death', 'death_status', 'fields', 'source_file']} | {'portrait': p['portrait']['local_path']} for p in people])
    if lang == 'zh':
        shutil.copyfile(ROOT / 'INDEX.md', directory / 'INDEX.md')
        shutil.copyfile(ROOT / 'docs/IMAGE_CREDITS.md', directory / 'docs/IMAGE_CREDITS.md')
        (directory / 'README.md').write_text('# 物理学先驱档案 · 中文版\n\n共' + str(len(people)) + '位人物，按出生时间排序。\n\n- [人物时间目录](INDEX.md)\n- [完整数据](data/physicists.json)\n- [图片来源与许可](docs/IMAGE_CREDITS.md)\n- [复核报告](docs/AUDIT_REPORT.md)\n- [待补与限制](docs/OPEN_ITEMS.md)\n- [对照资料库](docs/REFERENCE_SITES.md)\n\n本目录包含本版人物档案和本地配图，可单独复制使用。编辑源数据和构建脚本位于项目根目录。\n')
    else:
        rows = ['# Physics Pioneers Archive — chronological index', '', 'Reviewed: ' + AS_OF + '. Records: ' + str(len(people)) + '.', '',
                'Ordered by birth date. Approximate dates, historical calendars and source conflicts are explained in each record. This is an expandable archive, not an exhaustive list of every contributor.', '',
                '| No. | Born | Died / status | Person | Fields |', '| ---: | --- | --- | --- | --- |']
        credits = ['# Image sources and rights', '', 'Rights statements follow the original image records. Attribution and regional conditions must be checked before republication.', '',
                   '| Person | Image | Creator / attribution | License / rights | Website republication | Source |', '| --- | --- | --- | --- | --- | --- |']
        for p in people:
            rows.append('| ' + str(p['order']) + ' | ' + p['birth']['display'] + ' | ' + status(p, 'en') + ' | [' + p['name'] + '](' + p['source_file'] + ') | ' + ', '.join(p['fields']) + ' |')
            image = p['portrait']
            esc = lambda s: str(s).replace('|', '\\|').replace('\n', ' ')
            credits.append('| ' + ' | '.join([esc(p['name']), '[Local file](../' + image['local_path'] + ')', esc(image.get('artist') or 'See source'), esc(image['license']), 'Permission unverified' if image.get('rights_status') == 'permission_required' else 'Follow source license', '[Source](' + (image.get('source_page') or image['commons_page']) + ')']) + ' |')
        (directory / 'INDEX.md').write_text('\n'.join(rows) + '\n')
        (directory / 'docs/IMAGE_CREDITS.md').write_text('\n'.join(credits) + '\n')
        (directory / 'README.md').write_text('# Physics Pioneers Archive · English edition\n\n' + str(len(people)) + ' individual records, ordered by birth date.\n\n- [Chronological index](INDEX.md)\n- [Complete data](data/physicists.json)\n- [Image sources and rights](docs/IMAGE_CREDITS.md)\n- [Audit report](docs/AUDIT_REPORT.md)\n- [Open items and limitations](docs/OPEN_ITEMS.md)\n- [Reference directories](docs/REFERENCE_SITES.md)\n\nThis directory includes the English records and local image files and can be copied independently. Editable source data and build scripts are maintained in the project root. Both language editions use the same stable identifiers, dates and images. Original-script creator names and legal attributions are preserved where required.\n')

def main():
    canonical = json.loads((ROOT / 'data/physicists.json').read_text())
    missing_assets = [p['id'] for p in canonical['people'] if not p.get('portrait') or not (ROOT / p['portrait']['local_path']).is_file()]
    if missing_assets:
        raise ValueError('Edition output left untouched: missing source images for ' + ', '.join(missing_assets))
    en = translations()
    missing = [p['id'] for p in canonical['people'] if p['id'] not in en]
    if missing:
        raise ValueError('Missing English records (' + str(len(missing)) + '): ' + ', '.join(missing))
    chinese, english = [], []
    for p in canonical['people']:
        z = copy.deepcopy(p)
        z['name'] = z['name_zh']
        chinese.append(z)
        english.append(english_record(p, en[p['id']]))
    metadata = {k: v for k, v in canonical.items() if k != 'people'}
    edition('zh', chinese, metadata)
    edition('en', english, metadata)
    print('Built self-contained Chinese and English editions:', len(chinese), len(english))

if __name__ == '__main__':
    main()
