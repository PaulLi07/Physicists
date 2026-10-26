#!/usr/bin/env python3
"""Cache Wikipedia identity, Wikidata dates/labels and Commons portraits.

Uses only Python's standard library. Safe to rerun: successful responses and
downloaded assets are cached. Failures remain visible in enrichment-errors.json.
"""
import concurrent.futures as cf
import hashlib
import html
import json
import pathlib
import re
import time
import urllib.parse as up
import urllib.request as ur

ROOT = pathlib.Path(__file__).resolve().parents[1]
CACHE = ROOT / 'data/raw/enrichment'
CACHE.mkdir(parents=True, exist_ok=True)
UA = 'PhysicsPioneersArchive/1.0 (educational biographical archive; Wikimedia attribution retained)'

def fetch(url, binary=False):
    for attempt in range(4):
        try:
            req = ur.Request(url, headers={'User-Agent': UA})
            with ur.urlopen(req, timeout=45) as response:
                b = response.read()
            return b if binary else json.loads(b)
        except Exception:
            if attempt == 3:
                raise
            time.sleep(1.5 * (attempt + 1))

def clean(s):
    from image_metadata import clean_text
    return clean_text(s)

def cached_json(path, url):
    if path.exists():
        return json.loads(path.read_text())
    obj = fetch(url)
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2))
    return obj

def enrich(person):
    title = up.unquote(person['wikipedia_title']).replace('_', ' ')
    key = hashlib.sha256(title.encode()).hexdigest()[:20]
    outpath = CACHE / (key + '.json')
    old = json.loads(outpath.read_text()) if outpath.exists() else {}
    if old.get('portrait', {}).get('local_path') and old.get('wikidata_checked'):
        return title, old, None
    out = {'requested_title': title}
    errors = []
    try:
        summary = cached_json(CACHE / (key + '.summary.json'),
                              'https://en.wikipedia.org/api/rest_v1/page/summary/' + up.quote(title, safe=''))
        if summary.get('type') == 'disambiguation':
            raise ValueError('Ambiguous Wikipedia title: ' + title)
        out.update({'title': summary.get('title'), 'wikidata_id': summary.get('wikibase_item'),
                    'wikipedia_url': summary.get('content_urls', {}).get('desktop', {}).get('page'),
                    'source_extract': ' '.join(summary.get('extract', '').split()[:180])})
        qid = summary.get('wikibase_item')
        image_title = None
        if qid:
            entity = cached_json(CACHE / (qid + '.entity.json'),
                                 'https://www.wikidata.org/wiki/Special:EntityData/' + qid + '.json')['entities'][qid]
            out['wikidata_checked'] = True
            labels = entity.get('labels', {})
            out['name_zh'] = next((labels[k]['value'] for k in ['zh-cn', 'zh-hans', 'zh'] if k in labels), None)
            claims = entity.get('claims', {})
            for prop, label in [('P569', 'birth'), ('P570', 'death')]:
                statements = [s for s in claims.get(prop, []) if s.get('rank') != 'deprecated' and 'datavalue' in s.get('mainsnak', {})]
                preferred = [s for s in statements if s.get('rank') == 'preferred'] or statements
                if preferred:
                    out[label] = preferred[0]['mainsnak']['datavalue']['value']
            pics = [s for s in claims.get('P18', []) if s.get('rank') != 'deprecated' and 'datavalue' in s.get('mainsnak', {})]
            if pics:
                pics.sort(key=lambda x: x.get('rank') != 'preferred')
                image_title = pics[0]['mainsnak']['datavalue']['value']
        image_url = summary.get('originalimage', {}).get('source', '')
        if not image_title and '/commons/' in image_url:
            image_title = up.unquote(image_url.split('/')[-1])
        if not image_title:
            raise ValueError('No Commons portrait found for ' + title)
        info_url = 'https://commons.wikimedia.org/w/api.php?' + up.urlencode({
            'action': 'query', 'format': 'json', 'titles': 'File:' + image_title,
            'prop': 'imageinfo', 'iiprop': 'url|extmetadata|mime|size', 'iiurlwidth': 560})
        meta = cached_json(CACHE / (key + '.commons.json'), info_url)
        page = next(iter(meta['query']['pages'].values()))
        ii = page.get('imageinfo', [{}])[0]
        if not ii.get('url'):
            raise ValueError('Commons file missing: ' + image_title)
        extmeta = ii.get('extmetadata', {})
        val = lambda k: clean(extmeta.get(k, {}).get('value', ''))
        url = ii.get('thumburl', ii['url'])
        extension = up.urlparse(url).path.split('.')[-1].lower()
        if extension not in ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'tif', 'tiff']:
            extension = 'jpg'
        local = 'portraits/' + key + '.' + extension
        target = ROOT / local
        if not target.exists():
            target.write_bytes(fetch(url, binary=True))
        out['portrait'] = {
            'local_path': local, 'file_name': image_title,
            'commons_page': ii.get('descriptionurl', 'https://commons.wikimedia.org/wiki/File:' + up.quote(image_title)),
            'original_url': ii['url'], 'download_url': url,
            'artist': val('Artist'), 'credit': val('Credit'),
            'license': val('LicenseShortName'), 'license_url': val('LicenseUrl'),
            'attribution_required': val('AttributionRequired'), 'usage_terms': val('UsageTerms'),
            'description': val('ImageDescription')[:1600],
            'mime': ii.get('thumbmime', ii.get('mime')),
            'sha256': hashlib.sha256(target.read_bytes()).hexdigest(),
            'retrieved_at': '2026-10-26',
        }
    except Exception as exc:
        errors.append(str(exc))
        if old.get('portrait'):
            out['portrait'] = old['portrait']
    outpath.write_text(json.dumps(out, ensure_ascii=False, indent=2))
    return title, out, errors or None

def inputs():
    people = []
    nobel = ROOT / 'data/raw/nobel-laureates.json'
    if nobel.exists():
        for p in json.loads(nobel.read_text())['laureates']:
            if p.get('wikipedia', {}).get('slug'):
                people.append({'wikipedia_title': p['wikipedia']['slug']})
    for f in sorted((ROOT / 'data/curated').glob('*.json')):
        a = json.loads(f.read_text())
        if isinstance(a, list):
            people.extend(p for p in a if p.get('wikipedia_title'))
    return list({up.unquote(p['wikipedia_title']).replace('_', ' '): p for p in people}.values())

def main():
    people = inputs()
    result, errors = {}, {}
    with cf.ThreadPoolExecutor(max_workers=5) as pool:
        for i, (title, info, error) in enumerate(pool.map(enrich, people), 1):
            result[title] = info
            if error:
                errors[title] = error
            print(f'{i}/{len(people)} {title}: ' + ('ERROR ' + str(error) if error else 'OK'), flush=True)
    (ROOT / 'data/enrichment.json').write_text(json.dumps(result, ensure_ascii=False, indent=2))
    (ROOT / 'data/enrichment-errors.json').write_text(json.dumps(errors, ensure_ascii=False, indent=2))
    print('DONE', len(people), 'errors', len(errors), flush=True)

if __name__ == '__main__':
    main()
