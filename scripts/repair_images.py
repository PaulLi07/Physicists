#!/usr/bin/env python3
"""Refresh selected manual image matches and retry only missing portraits."""
import concurrent.futures as cf
import json
import urllib.parse as up
from harvest import ROOT, CACHE, OVERRIDES, identity, portrait

def main():
    path = ROOT / 'data/enrichment.json'
    result = json.loads(path.read_text())
    selected = [title for title, obj in result.items() if not obj.get('portrait') or title in OVERRIDES]
    def fix(title):
        title, obj = identity({'wikipedia_title': title})
        title, obj = portrait((title, obj))
        (CACHE / (obj['key'] + '.json')).write_text(json.dumps(obj, ensure_ascii=False, indent=2))
        return title, obj
    with cf.ThreadPoolExecutor(max_workers=3) as pool:
        for n, (title, obj) in enumerate(pool.map(fix, selected), 1):
            result[title] = obj
            path.write_text(json.dumps(result, ensure_ascii=False, indent=2))
            print(f'{n}/{len(selected)} {title}: ' + ('OK' if obj.get('portrait') else obj.get('portrait_error', 'ERROR')), flush=True)
    errors = {t: {k: v for k, v in o.items() if k.endswith('_error')} for t, o in result.items() if not o.get('portrait')}
    (ROOT / 'data/enrichment-errors.json').write_text(json.dumps(errors, ensure_ascii=False, indent=2))
    print('Missing images:', len(errors))

if __name__ == '__main__':
    main()
