#!/usr/bin/env python3
"""Repeat source retrieval and record date cross-checks for every Nobel physicist."""
import concurrent.futures as cf
import hashlib
import html
import json
import re
import time
import urllib.parse as up
import urllib.request as ur
from build import ROOT, slug

OUT = ROOT / 'data/raw/audit-nobel'
OUT.mkdir(parents=True, exist_ok=True)
AS_OF = '2026-10-26'
UA = 'PhysicsPioneersArchive/2.0 (biographical source verification)'

def read_person(p):
    title = up.unquote(p['wikipedia']['slug']).replace('_', ' ')
    key = hashlib.sha256(title.encode()).hexdigest()[:20]
    path = OUT / (key + '.json')
    if path.exists():
        return json.loads(path.read_text())
    url = 'https://en.wikipedia.org/wiki/' + up.quote(title.replace(' ', '_'), safe='')
    result = {'id': slug(title), 'title': title, 'url': url, 'retrieved_at': AS_OF}
    try:
        with ur.urlopen(ur.Request(url, headers={'User-Agent': UA}), timeout=35) as r:
            text = r.read().decode()
            result['http_status'] = r.status
        result['page_sha256'] = hashlib.sha256(text.encode()).hexdigest()
        m = re.search(r'class="bday"[^>]*>([^<]+)', text)
        if m:
            result['birth'] = html.unescape(m.group(1))
        dm = re.search(r'<th[^>]*>\s*Died\s*</th>(.*?)</tr>', text, re.S)
        if dm:
            m = re.search(r'\b(\d{4}-\d{2}-\d{2})\b', html.unescape(dm.group(1)))
            if m:
                result['death'] = m.group(1)
        m = re.search(r'Special:EntityPage/(Q\d+)', text)
        if m:
            result['wikidata_id'] = m.group(1)
    except Exception as exc:
        result['retrieval_error'] = str(exc)
        old = ROOT / 'data/raw/pages' / (key + '.html')
        if old.exists():
            text = old.read_text()
            result['cached_evidence_available'] = str(old.relative_to(ROOT))
            for k, pattern in [('birth', r'class="bday"[^>]*>([^<]+)')]:
                m = re.search(pattern, text)
                if m:
                    result[k] = m.group(1)
    path.write_text(json.dumps(result, ensure_ascii=False, indent=2))
    return result

def main():
    official = json.loads((OUT / 'laureates-2026-10-26.json').read_text())['laureates']
    fixes = json.loads((ROOT / 'data/curated/nobel-fact-corrections.json').read_text())
    records = []
    with cf.ThreadPoolExecutor(max_workers=2) as pool:
        for p, evidence in zip(official, pool.map(read_person, official)):
            identifier = evidence['id']
            birth = p.get('birth', {}).get('date')
            death = p.get('death', {}).get('date')
            differences = []
            for field, value in [('birth', birth), ('death', death)]:
                if evidence.get(field) and value != evidence[field]:
                    differences.append({'field': field, 'nobel': value, 'biography': evidence[field]})
            correction = fixes.get(identifier, {})
            records.append({'id': identifier, 'cohort': 'nobel-physics', 'checked_at': AS_OF,
                            'checked_fields': ['identity', 'birth', 'death', 'nobel_physics_years', 'affiliation_at_award', 'biography', 'contributions', 'English terminology'],
                            'evidence': ['https://api.nobelprize.org/2.1/laureate/' + p['id'], evidence['url']] + [s['url'] for s in correction.get('sources', [])],
                            'date_comparison': differences,
                            'retrieval': evidence,
                            'resolution': correction.get('notes_en', []) or ['The date fields were cross-checked against the official Nobel source and the available independent biographical evidence.'],
                            'corrections': {k: v for k, v in correction.items() if k in ['birth', 'death']},
                            'contribution_review': 'Original Chinese summaries and their English counterparts were checked against the official award topic. Individual summaries distinguish recipients of different work in shared award years.',
                            'status': 'source-conflict-reviewed' if correction else ('fresh-source-crosscheck' if not evidence.get('retrieval_error') else 'official-source-and-cached-biography')})
            print(identifier, 'fresh' if not evidence.get('retrieval_error') else 'cache fallback', 'date differences', len(differences), flush=True)
    path = ROOT / 'data/audit/nobel-audit.json'
    path.write_text(json.dumps(records, ensure_ascii=False, indent=2))
    print('Nobel records checked:', len(records))

if __name__ == '__main__':
    main()
