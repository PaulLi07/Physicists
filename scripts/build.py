#!/usr/bin/env python3
"""Build independent Chinese Markdown dossiers and sorted web-ready JSON.

Offline and deterministic; no network requests and no third-party packages.
"""
import hashlib
import html
import json
import pathlib
import re
import unicodedata
import urllib.parse as up
from image_metadata import clean_text, clean_license_url, clean_creator

ROOT = pathlib.Path(__file__).resolve().parents[1]
AS_OF = '2026-10-26'

def load(path):
    return json.loads((ROOT / path).read_text())

def write(path, obj):
    (ROOT / path).write_text(json.dumps(obj, ensure_ascii=False, indent=2) + '\n')

def slug(s):
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')

def date_obj(s):
    if not s:
        return None
    precision = 'day'
    if s.endswith('-00-00'):
        s = s[:4]; precision = 'year'
    elif s.endswith('-00'):
        s = s[:7]; precision = 'month'
    parts = s.split('-')
    display = parts[0] + '年'
    if len(parts) > 1:
        display += str(int(parts[1])) + '月'
    if len(parts) > 2:
        display += str(int(parts[2])) + '日'
    return {'date': s, 'precision': precision, 'display': display}

def birth_key(p):
    b = p['birth']['date']
    m = re.match(r'^(-?\d+)(?:-(\d{2}))?(?:-(\d{2}))?', b)
    if not m:
        raise ValueError('Unsortable birth date: ' + str(b))
    y, mo, d = m.groups()
    return (int(y), int(mo or 1), int(d or 1), p['name_en'])

def read_lines(path):
    for line in (ROOT / path).read_text().splitlines():
        if line.strip() and not line.startswith('#'):
            yield line.strip().split('|')

def summaries(s):
    return [x.strip() for x in s.split('；') if x.strip()]

def nobel_people(enrichment):
    years = {y: {'fields': fs.split('、'), 'contributions': summaries(cs)} for y, fs, cs in read_lines('data/curated/nobel-research.txt')}
    overrides = {i: {'name_zh': name, 'fields': fs.split('、') if fs else [], 'contributions': summaries(cs)} for i, name, fs, cs in read_lines('data/curated/nobel-individual.txt')}
    correction_path = ROOT / 'data/curated/nobel-fact-corrections.json'
    corrections = json.loads(correction_path.read_text()) if correction_path.exists() else {}
    country_zh = {'USA': '美国', 'United States': '美国', 'United Kingdom': '英国', 'Germany': '德国', 'France': '法国', 'Japan': '日本', 'Denmark': '丹麦', 'Netherlands': '荷兰', 'Sweden': '瑞典', 'Switzerland': '瑞士', 'Italy': '意大利', 'Russia': '俄罗斯', 'USSR': '苏联', 'Canada': '加拿大', 'Australia': '澳大利亚', 'Austria': '奥地利', 'Belgium': '比利时', 'Poland': '波兰', 'China': '中国', 'India': '印度', 'Pakistan': '巴基斯坦', 'Norway': '挪威', 'Finland': '芬兰', 'Ireland': '爱尔兰', 'South Africa': '南非', 'Hungary': '匈牙利', 'New Zealand': '新西兰'}
    people = []
    for p in load('data/raw/nobel-laureates.json')['laureates']:
        prizes = [n for n in p['nobelPrizes'] if n['category']['en'] == 'Physics' and n['awardYear'] <= '2026']
        if not prizes:
            continue
        en = html.unescape(p.get('fullName', p['knownName'])['en'])
        title = up.unquote(p['wikipedia']['slug']).replace('_', ' ')
        info = enrichment.get(title, {})
        override = overrides.get(p['id'], {})
        zh = override.get('name_zh') or info.get('name_zh') or p['knownName']['en']
        default = years[prizes[0]['awardYear']]
        fields = override.get('fields') or default['fields']
        contributions = override.get('contributions') or default['contributions']
        place = p.get('birth', {}).get('place', {})
        location = html.unescape(place.get('locationString', {}).get('en', ''))
        affiliations = []
        for n in prizes:
            for a in n.get('affiliations', []):
                name = html.unescape(a.get('name', {}).get('en', ''))
                if name and name not in affiliations:
                    affiliations.append(name)
        bio = zh + ('出生于' + location + '，' if location else '') + '主要从事' + '、'.join(fields) + '研究。'
        if affiliations:
            bio += '诺贝尔奖资料所列获奖时任职机构为' + '、'.join(affiliations) + '。'
        bio += '其代表成果包括' + contributions[0].rstrip('。；') + '，获' + '、'.join(n['awardYear'] + '年' for n in prizes) + '诺贝尔物理学奖。'
        sources = []
        for n in prizes:
            for link in n.get('links', []):
                if link.get('class') == ['laureate facts']:
                    sources.append({'title': link['title'], 'url': link['href'], 'kind': 'official-biography'})
        sources.append({'title': 'Nobel Prize official laureate API, id ' + p['id'], 'url': 'https://api.nobelprize.org/2.1/laureate/' + p['id'], 'kind': 'official-structured-data'})
        sources.append({'title': 'Wikipedia: ' + title, 'url': info.get('wikipedia_url') or p['wikipedia']['english'], 'kind': 'reference-biography'})
        death = date_obj(p.get('death', {}).get('date'))
        notes = []
        # Article infobox is an independent check on recent deaths.
        if info.get('html_death_date') and (not death or death['date'] != info['html_death_date']):
            notes.append('诺贝尔官方数据与人物条目对死亡日期的记载存在差异，须结合两处来源复核。')
            if not death:
                death = date_obj(info['html_death_date'])
        person = {'id': slug(title), 'name_zh': zh, 'name_en': en, 'wikipedia_title': title,
                  'wikidata_id': info.get('wikidata_id') or p.get('wikidata', {}).get('id'),
                  'birth': date_obj(p.get('birth', {}).get('date')), 'death': death,
                  'death_status': 'deceased' if death else 'alive',
                  'biography': bio, 'contributions': contributions, 'fields': fields,
                  'nobel_physics_years': [int(n['awardYear']) for n in prizes],
                  'nobel_id': p['id'],
                  'sources': sources, 'notes': notes, 'cohort': 'nobel-physics',
                  'editorial_basis': '中文原创简述；生卒、出生地、获奖时任职机构据诺贝尔官方结构化资料，贡献参照官方获奖说明及人物条目。'}
        correction = corrections.get(person['id'])
        if correction:
            for field in ['birth', 'death']:
                if field in correction:
                    person[field] = correction[field]
            person['death_status'] = 'deceased' if person.get('death') else person['death_status']
            person['notes'] = correction.get('notes', [])
            person['sources'].extend(s for s in correction.get('sources', []) if s['url'] not in {x['url'] for x in person['sources']})
            person['audit_status'] = 'source-conflict-reviewed'
        else:
            person['audit_status'] = 'official-data-crosschecked'
        people.append(person)
    return people

def main():
    enrichment = load('data/enrichment.json')
    people = nobel_people(enrichment)
    seen = {p['wikipedia_title'].replace('_', ' '): p for p in people}
    for f in sorted((ROOT / 'data/curated').glob('*.json')):
        cohort = json.loads(f.read_text())
        if not isinstance(cohort, list):
            continue
        for p in cohort:
            title = up.unquote(p.get('wikipedia_title', '')).replace('_', ' ')
            if title in seen:
                old = seen[title]
                old['biography'] = p['biography']
                old['sources'].extend(s for s in p['sources'] if s['url'] not in {x['url'] for x in old['sources']})
                old['notes'].extend(p.get('notes', []))
                continue
            p['cohort'] = f.stem
            p['wikipedia_title'] = title
            p.setdefault('death_status', 'deceased' if p.get('death') else 'alive')
            p.setdefault('notes', [])
            p.setdefault('nobel_physics_years', [])
            people.append(p); seen[title] = p
    people.sort(key=birth_key)
    used_ids = set()
    for i, p in enumerate(people, 1):
        if p['id'] in used_ids:
            raise ValueError('Duplicate id: ' + p['id'])
        used_ids.add(p['id'])
        p['order'] = i
        p['sort_year'] = birth_key(p)[0]
        p['reviewed_at'] = AS_OF
        p['notes'] = list(dict.fromkeys(p.get('notes', [])))
        info = enrichment.get(p['wikipedia_title'], {})
        p['wikidata_id'] = p.get('wikidata_id') or info.get('wikidata_id')
        p['portrait'] = info.get('portrait')
        if p['portrait']:
            # Raw metadata remains in enrichment/source caches. Do not publish
            # stylesheet text or image-download links as creator/licence data.
            for field in ['artist', 'credit', 'description', 'license', 'usage_terms']:
                if field in p['portrait']:
                    p['portrait'][field] = clean_text(p['portrait'][field])
            p['portrait']['artist'] = clean_creator(p['portrait'].get('artist', ''))
            p['portrait']['license_url'] = clean_license_url(
                p['portrait'].get('license_url'),
                p['portrait'].get('source_page') or p['portrait'].get('commons_page') or '')
            p['portrait'].setdefault('kind', 'posthumous_depiction' if p['sort_year'] < 1500 else 'portrait')
            if p['portrait']['kind'] == 'photograph':
                p['portrait']['kind'] = 'portrait'
            if p['sort_year'] < 1500 and p['portrait']['kind'] == 'portrait':
                p['portrait']['kind'] = 'posthumous_depiction'
            p['portrait'].setdefault('source_page', p['portrait'].get('commons_page'))
            p['portrait']['alt_zh'] = p['name_zh'] + {'context_image': '的相关资料图', 'posthumous_depiction': '的后世画像或纪念像', 'portrait': '的肖像'}[p['portrait']['kind']]
            if not p['portrait'].get('depiction_note'):
                if p['sort_year'] < 1500:
                    p['portrait']['depiction_note'] = '古代或中世纪人物：此图为后世画像、雕像或传统形象，并非可核实的同时代写生肖像；请结合图片来源判断。'
                else:
                    p['portrait']['depiction_note'] = '肖像的作者、拍摄或创作年代及具体形式见图片来源。'
        p['source_file'] = 'people/' + f'{i:04d}-' + p['id'] + '.md'
    # Generated directory: remove obsolete generated dossiers after ordering changes.
    for f in (ROOT / 'people').glob('*.md'):
        f.unlink()
    index = ['# 物理学先驱档案：按出生时间排序', '',
             f'资料整理日期：{AS_OF}。当前收录 {len(people)} 人；这是开放的历史档案，不是“全部杰出贡献者”的封闭名录。', '',
             '排序以出生日期为准；同日按英文名排序。公元前年份以负数保存，约年与争议见各档案。古代自然哲学、数学物理与天文学贡献者按相关贡献收录。', '',
             '| 序号 | 出生 | 逝世／状态 | 人物 | 研究领域 |', '| ---: | --- | --- | --- | --- |']
    credits = ['# 肖像来源与许可', '', f'整理日期：{AS_OF}。文件许可由所列原始图片页面声明，具体条件与地域限制见来源。', '', '| 人物 | 本地文件 | 作者 | 许可 | 网站发布状态 | 来源 |', '| --- | --- | --- | --- | --- | --- |']
    for p in people:
        death_display = p['death']['display'] if p.get('death') else {'alive': '在世（截至资料整理日）', 'unknown': '下落／死亡时间不详', 'deceased': '逝世日期不详'}.get(p['death_status'], '状态待考')
        life = p['birth']['display'] + ' — ' + death_display
        portrait = p.get('portrait')
        lines = ['# ' + p['name_zh'], '', '**英文名：** ' + p['name_en'], '', '**生卒：** ' + life, '', '**主要领域：** ' + '、'.join(p['fields']), '']
        if portrait:
            lines.extend(['![' + portrait['alt_zh'] + '](../' + portrait['local_path'] + ')', '',
                          portrait['depiction_note'], '', '## 生平简介', '', p['biography'], '', '## 对物理的主要贡献', ''])
        else:
            lines.extend(['肖像：待补充。', '', '## 生平简介', '', p['biography'], '', '## 对物理的主要贡献', ''])
        lines.extend('- ' + x for x in p['contributions'])
        if p.get('nobel_physics_years'):
            lines.extend(['', '**诺贝尔物理学奖：** ' + '、'.join(map(str, p['nobel_physics_years']))])
        if p['notes']:
            lines.extend(['', '## 史料说明', ''] + ['- ' + x for x in p['notes']])
        if portrait:
            lines.extend(['', '## 肖像来源与许可', '',
                          '- 来源：[' + portrait['file_name'] + '](' + portrait['source_page'] + ')',
                          '- 作者／署名：' + (portrait['artist'] or '见原图页面'),
                          '- 许可：' + (('[' + portrait['license'] + '](' + portrait['license_url'] + ')') if portrait.get('license_url', '').startswith('http') else (portrait['license'] or '须查看原图页面确认')),
                          '- 本地文件：[' + pathlib.Path(portrait['local_path']).name + '](../' + portrait['local_path'] + ')'])
            if portrait.get('credit'):
                lines.append('- 原始来源说明：' + portrait['credit'])
            if portrait.get('rights_status') == 'permission_required':
                lines.append('- 授权状态：仅记录来源与本地档案副本；未确认可用于网站再发布，发布前须向权利人核实授权。')
            def esc(s):
                return str(s).replace('|', '\\|').replace('\n', ' ')
            credits.append('| ' + ' | '.join([esc(p['name_zh']), '[' + pathlib.Path(portrait['local_path']).name + '](../' + portrait['local_path'] + ')', esc(portrait['artist'] or '见来源'), esc(portrait['license'] or '见来源'), '需确认授权' if portrait.get('rights_status') == 'permission_required' else '按原图许可', '[图片页面](' + portrait['source_page'] + ')']) + ' |')
        lines.extend(['', '## 资料来源', ''] + ['- [' + s['title'] + '](' + s['url'] + ')' for s in p['sources']] + ['', '资料整理日期：' + AS_OF + '。', ''])
        (ROOT / p['source_file']).write_text('\n'.join(lines))
        index.append('| ' + str(p['order']) + ' | ' + p['birth']['display'] + ' | ' + death_display + ' | [' + p['name_zh'] + '](./' + p['source_file'] + ') | ' + '、'.join(p['fields']) + ' |')
    (ROOT / 'INDEX.md').write_text('\n'.join(index) + '\n')
    (ROOT / 'docs/IMAGE_CREDITS.md').write_text('\n'.join(credits) + '\n')
    write('data/physicists.json', {'schema_version': '1.0.0', 'title': '物理学先驱档案', 'language': 'zh-CN', 'as_of': AS_OF, 'sort': 'birth.date ascending; name_en tie-break', 'count': len(people), 'people': people})
    write('data/timeline.json', [{'order': p['order'], 'id': p['id'], 'name_zh': p['name_zh'], 'name_en': p['name_en'], 'birth': p['birth'], 'death': p['death'], 'death_status': p['death_status'], 'fields': p['fields'], 'portrait': p['portrait']['local_path'] if p['portrait'] else None, 'source_file': p['source_file']} for p in people])
    stats = {'people': len(people), 'images': sum(bool(p['portrait']) for p in people), 'image_kinds': {k: sum(p.get('portrait', {}).get('kind') == k for p in people if p.get('portrait')) for k in ['portrait', 'posthumous_depiction', 'context_image']}, 'nobel_physics_people': sum(bool(p['nobel_physics_years']) for p in people), 'cohorts': {c: sum(p['cohort'] == c for p in people) for c in sorted(set(p['cohort'] for p in people))}, 'missing_portraits': [p['id'] for p in people if not p['portrait']], 'as_of': AS_OF}
    write('data/build-report.json', stats)
    print(json.dumps({k: v for k, v in stats.items() if k != 'missing_portraits'}, ensure_ascii=False, indent=2))
    print('Missing images:', len(stats['missing_portraits']))

if __name__ == '__main__':
    main()
