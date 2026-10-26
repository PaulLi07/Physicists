#!/usr/bin/env python3
"""Check all bilingual record pairs, dates, terminology fields and local assets."""
import hashlib
import json
import re
from build import ROOT, birth_key

def cjk(text):
    return bool(re.search(r'[\u3400-\u9fff]', str(text)))

def main():
    zh = json.loads((ROOT / 'zh/data/physicists.json').read_text())
    en = json.loads((ROOT / 'en/data/physicists.json').read_text())
    errors, notes, rows = [], [], []
    def check(ok, message):
        if not ok:
            errors.append(message)
    check(zh['count'] == en['count'] == len(zh['people']) == len(en['people']), 'Edition counts differ')
    check([p['id'] for p in zh['people']] == [p['id'] for p in en['people']], 'Stable IDs or chronological orders differ')
    zmap = {p['id']: p for p in zh['people']}
    for p in en['people']:
        key = p['id']
        z = zmap.get(key)
        if not z:
            errors.append(key + ': missing Chinese counterpart')
            continue
        before = len(errors)
        for field in ['order', 'sort_year', 'death_status', 'wikidata_id', 'nobel_id', 'nobel_physics_years']:
            check(z.get(field) == p.get(field), key + ': factual metadata differs: ' + field)
        for field in ['birth', 'death']:
            a, b = z.get(field), p.get(field)
            check(bool(a) == bool(b), key + ': date presence differs: ' + field)
            if a and b:
                check(a['date'] == b['date'] and a['precision'] == b['precision'], key + ': canonical date/precision differs: ' + field)
                check(not cjk(b['display']), key + ': untranslated date display')
                if b['precision'] == 'approximate':
                    check(bool(re.search(r'c\.|circa|approximately|about|around|uncertain|after|before|possibly|between|estimated|disputed|sources differ|\bor\b', b['display'], re.I)), key + ': approximate date shown as exact')
                if a['date'].startswith('-'):
                    check(bool(re.search(r'BCE|BC\b', b['display'])), key + ': BCE era missing from English date')
        for field in ['name', 'name_en', 'biography', 'editorial_basis']:
            check(bool(p.get(field)), key + ': empty English field: ' + field)
            check(not cjk(p.get(field, '')), key + ': untranslated Chinese prose: ' + field)
        visible_text = [p.get(k, '') for k in ['name', 'biography']] + p['contributions'] + p['fields'] + p['notes']
        check(not any(re.search(r'&(?:[A-Za-z][A-Za-z0-9]+|#\d+|#x[0-9a-fA-F]+);', t) for t in visible_text), key + ': escaped HTML entity in English prose')
        for field in ['contributions', 'fields', 'notes']:
            check(len(z.get(field, [])) == len(p.get(field, [])), key + ': list length differs: ' + field)
            for text in p.get(field, []):
                check(not cjk(text), key + ': Chinese text in English ' + field)
        check(len(p['biography']) >= 60, key + ': English biography too short')
        check(len(p['contributions']) >= 2, key + ': missing English contributions')
        check({s['url'] for s in z['sources']} == {s['url'] for s in p['sources']}, key + ': source evidence differs between editions')
        for s in p['sources']:
            check(not cjk(s['title']), key + ': untranslated source label')
        portrait = p.get('portrait')
        check(bool(portrait), key + ': image missing')
        if portrait:
            for field in ['local_path', 'sha256', 'kind', 'rights_status']:
                check(z['portrait'].get(field) == portrait.get(field), key + ': image metadata differs: ' + field)
            for field in ['alt', 'depiction_note', 'license']:
                check(bool(portrait.get(field)), key + ': English image field empty: ' + field)
                check(not cjk(portrait.get(field, '')), key + ': untranslated English image field: ' + field)
            for field in ['artist', 'credit', 'depiction_note', 'license']:
                value = portrait.get(field, '')
                check(not re.search(r'\.mw-parser-output|@media\s|Unknown authorUnknown author|<style\b|<script\b', value, re.I), key + ': rendered template code in image ' + field)
            check(not re.search(r'不[詳详]|摄影者未|作者未', portrait.get('artist', '')), key + ': untranslated descriptive creator label')
            if portrait['kind'] == 'context_image':
                check('not a portrait' in portrait['alt'].lower(), key + ': document mislabelled as portrait')
            for lang in ['zh', 'en']:
                image = ROOT / lang / portrait['local_path']
                check(image.is_file(), key + ': missing ' + lang + ' image file')
                if image.exists():
                    check(hashlib.sha256(image.read_bytes()).hexdigest() == portrait['sha256'], key + ': ' + lang + ' image hash mismatch')
        for lang in ['zh', 'en']:
            file = ROOT / lang / p['source_file']
            check(file.is_file(), key + ': missing ' + lang + ' dossier')
            if file.is_file():
                text = file.read_text()
                check(('## Biography' if lang == 'en' else '## 生平简介') in text, key + ': required section absent')
                for target in re.findall(r'\]\((\.\./portraits/[^)]+)\)', text):
                    check((file.parent / target).is_file(), key + ': broken local image link')
                if lang == 'en':
                    check(not re.search(r'\bTODO\b|TRANSLATION_PENDING|\[INSERT|PLACEHOLDER', text), key + ': unfinished English placeholder')
        rows.append({'id': key, 'checks': ['identity', 'chronology', 'canonical_dates', 'date_precision', 'translated_prose', 'contribution_and_note_alignment', 'source_alignment', 'portrait_type', 'image_hashes', 'local_links'], 'passed': len(errors) == before})
    for lang, data in [('zh', zh), ('en', en)]:
        check(data['people'] == sorted(data['people'], key=birth_key), lang + ': chronology invalid')
        check(len(list((ROOT / lang / 'people').glob('*.md'))) == data['count'], lang + ': dossier count mismatch')
        check(len(list((ROOT / lang / 'portraits').iterdir())) == data['count'], lang + ': image file count mismatch')
        directory = ROOT / lang
        documentation = [directory / 'README.md', directory / 'INDEX.md'] + list((directory / 'docs').glob('*.md'))
        for file in documentation:
            check(file.is_file(), lang + ': missing edition document: ' + file.name)
            if not file.is_file():
                continue
            for target in re.findall(r'\]\(([^\n]+?)\)', file.read_text()):
                if target.startswith(('https:', 'http:', 'mailto:', '#')):
                    continue
                target = target.split('#', 1)[0].strip('<>')
                check((file.parent / target).exists(), lang + ': broken document link: ' + file.name + ' -> ' + target)
    report = {'passed': not errors, 'records_per_language': en['count'], 'paired_records_checked': len(rows), 'errors': errors, 'notes': notes,
              'method': 'All record pairs and asset hashes checked. Original-script creator names and original legal metadata are intentionally preserved outside the translated prose fields. Semantic English peer review is recorded separately.', 'records': rows}
    path = ROOT / 'data/audit/bilingual-validation.json'
    path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    for lang in ['zh', 'en']:
        (ROOT / lang / 'data/validation-report.json').write_text(json.dumps({k: v for k, v in report.items() if k != 'records'}, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({k: v for k, v in report.items() if k not in ['records', 'notes', 'method']}, ensure_ascii=False, indent=2))
    raise SystemExit(0 if not errors else 1)

if __name__ == '__main__':
    main()
