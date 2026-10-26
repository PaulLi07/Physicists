#!/usr/bin/env python3
"""Low-concurrency, resumable public-source portrait/identity harvest.

Wikipedia HTML is cached when REST is throttled. Commons metadata is batched.
Portrait bytes are downloaded from the returned Wikimedia thumbnail URL;
neither drawings nor fabricated substitute faces are generated.
"""
import concurrent.futures as cf
import hashlib
import html
import json
import pathlib
import re
import time
import urllib.parse as up
from enrich import ROOT, CACHE, UA, clean, inputs
import urllib.request as ur

PAGES = ROOT / 'data/raw/pages'
PAGES.mkdir(exist_ok=True)
OVERRIDES = {}
for override_file in sorted((ROOT / 'data/curated').glob('portrait-overrides*.json')):
    OVERRIDES.update(json.loads(override_file.read_text()))
for manual in OVERRIDES.values():
    file_url = manual.get('external_image_url', '')
    marker = '/data/raw/sourced-portraits/'
    if file_url.startswith('file:') and marker in file_url:
        relative = 'data/raw/sourced-portraits/' + up.unquote(file_url.split(marker, 1)[1])
        manual['local_asset_path'] = relative
        manual['external_image_url'] = (ROOT / relative).as_uri()

def override(title, obj):
    manual = OVERRIDES.get(title)
    if manual:
        # A person may be assigned a different photo with the same extension.
        # Refresh the manual match; the asset filename below includes image identity.
        obj.pop('portrait', None)
        if manual.get('commons_file') != obj.get('commons_file') or manual.get('external_image_url'):
            obj.pop('imageinfo', None)
        obj.update({k: v for k, v in manual.items() if k in ['commons_file', 'external_image_url', 'source_url', 'kind', 'depiction_note', 'depiction_note_en', 'license', 'rights_status', 'artist', 'credit', 'tested_download_url', 'verified_license_url', 'local_asset_path']})
        if obj.get('kind') == 'photograph':
            obj['kind'] = 'portrait'
        if obj.get('portrait'):
            for k in ['kind', 'depiction_note', 'rights_status']:
                if manual.get(k):
                    obj['portrait'][k] = 'portrait' if k == 'kind' and manual[k] == 'photograph' else manual[k]
    return obj

def get(url, binary=False, tries=2):
    for attempt in range(tries):
        try:
            with ur.urlopen(ur.Request(url, headers={'User-Agent': UA}), timeout=35) as response:
                result = response.read()
            return result if binary else json.loads(result)
        except Exception:
            if attempt + 1 == tries:
                raise
            time.sleep(2)

def identity(p):
    title = up.unquote(p['wikipedia_title']).replace('_', ' ')
    key = hashlib.sha256(title.encode()).hexdigest()[:20]
    path = CACHE / (key + '.identity.json')
    if path.exists():
        obj = json.loads(path.read_text())
        final_path = CACHE / (key + '.json')
        if final_path.exists():
            obj.update(json.loads(final_path.read_text()))
        page = PAGES / (key + '.html')
        if page.exists():
            text = page.read_text()
            m = re.search(r'<a\b[^>]*href="https://zh\.wikipedia\.org/wiki/([^"]+)"[^>]*>', text)
            if m:
                obj['name_zh'] = up.unquote(html.unescape(m.group(1))).replace('_', ' ')
        return title, override(title, obj)
    old_path = CACHE / (key + '.json')
    result = json.loads(old_path.read_text()) if old_path.exists() else {}
    result.update({'requested_title': title, 'key': key})
    try:
        url = 'https://en.wikipedia.org/wiki/' + up.quote(title.replace(' ', '_'), safe='')
        page = PAGES / (key + '.html')
        if not page.exists():
            # Reuse matching cache files produced by the parallel researchers.
            reused = False
            for other in [pathlib.Path('/tmp/modern_html') / (title.replace(' ', '_') + '.html')]:
                if other.exists():
                    page.write_bytes(other.read_bytes()); reused = True; break
            if not reused:
                page.write_bytes(get(url, binary=True))
        text = page.read_text()
        result['wikipedia_url'] = url
        m = re.search(r'<a\b[^>]*href="https://zh\.wikipedia\.org/wiki/([^"]+)"[^>]*>', text)
        if m:
            result['name_zh'] = up.unquote(html.unescape(m.group(1))).replace('_', ' ')
        m = re.search(r'Special:EntityPage/(Q\d+)', text)
        if m:
            result['wikidata_id'] = m.group(1)
        box = re.search(r'<table[^>]*class="[^"]*infobox[^>]*>.*?</table>', text, re.S)
        if not box:
            raise ValueError('No person infobox: ' + title)
        box = box.group()
        m = re.search(r'class="bday"[^>]*>([^<]+)', box)
        if m:
            result['html_birth_date'] = m.group(1)
        # The ISO death date may be in a hidden span in the Died row.
        dm = re.search(r'<th[^>]*>\s*Died\s*</th>(.*?)</tr>', box, re.S)
        if dm:
            iso = re.search(r'\b(\d{4}-\d{2}-\d{2})\b', html.unescape(dm.group(1)))
            if iso:
                result['html_death_date'] = iso.group(1)
        image = re.search(r'<img\b[^>]*src="([^"]+)"[^>]*>', box)
        if image:
            src = html.unescape(image.group(1))
            if src.startswith('//'):
                src = 'https:' + src
            result['article_image_url'] = src
            if '/wikipedia/commons/' in src:
                parts = up.urlparse(src).path.split('/')
                result['commons_file'] = up.unquote(parts[-2] if '/thumb/' in src else parts[-1])
            elif '/wikipedia/en/' in src:
                result['local_wikipedia_file'] = up.unquote(up.urlparse(src).path.split('/')[-2])
        # A brief source excerpt is retained for audit, never used as authored prose.
        content = text.split('mw-parser-output', 1)[-1]
        paragraphs = [clean(x) for x in re.findall(r'<p\b[^>]*>(.*?)</p>', content, re.S)]
        result['source_extract'] = ' '.join(' '.join(x for x in paragraphs if len(x) > 60).split()[:180])
        if not result.get('commons_file') and result.get('wikidata_id'):
            entity_path = CACHE / (result['wikidata_id'] + '.entity.json')
            if entity_path.exists():
                entity = json.loads(entity_path.read_text())['entities'][result['wikidata_id']]
                images = entity.get('claims', {}).get('P18', [])
                if images:
                    result['commons_file'] = images[0]['mainsnak']['datavalue']['value']
    except Exception as exc:
        result['identity_error'] = str(exc)
    path.write_text(json.dumps(result, ensure_ascii=False, indent=2))
    return title, override(title, result)

def metadata_batch(files):
    query = {'action': 'query', 'format': 'json', 'titles': '|'.join('File:' + f for f in files),
             'prop': 'imageinfo', 'iiprop': 'url|extmetadata|mime|size', 'iiurlwidth': 500}
    key = hashlib.sha256('|'.join(files).encode()).hexdigest()[:20]
    path = CACHE / (key + '.commonsbatch.json')
    if not path.exists():
        path.write_text(json.dumps(get('https://commons.wikimedia.org/w/api.php?' + up.urlencode(query)), ensure_ascii=False, indent=2))
    obj = json.loads(path.read_text())
    return {p['title'].removeprefix('File:').replace('_', ' '): p.get('imageinfo', [{}])[0] for p in obj.get('query', {}).get('pages', {}).values()}

def portrait(pair):
    title, result = pair
    if result.get('portrait', {}).get('local_path') and (ROOT / result['portrait']['local_path']).exists():
        return title, result
    ii = result.get('imageinfo', {})
    if result.get('external_image_url'):
        ii = {'url': result['external_image_url'], 'descriptionurl': result['source_url'],
              'extmetadata': {k: {'value': v} for k, v in {'Artist': result.get('artist', ''),
                  'Credit': result.get('credit', ''), 'LicenseShortName': result.get('license', '版权所有；再发布授权未确认'),
                  'LicenseUrl': result.get('verified_license_url', '')}.items()}}
        result['commons_file'] = up.unquote(up.urlparse(result['external_image_url']).path.split('/')[-1])
    if not ii.get('url') and result.get('commons_file'):
        try:
            f = result['commons_file']
            source_url = 'https://commons.wikimedia.org/wiki/File:' + up.quote(f.replace(' ', '_'), safe='')
            path = CACHE / (hashlib.sha256(f.encode()).hexdigest()[:20] + '.commons.html')
            if not path.exists():
                path.write_bytes(get(source_url, binary=True))
            text = html.unescape(path.read_text())
            full = re.search(r'<div class="fullImageLink"[^>]*>\s*<a href="([^"]+)"[^>]*>\s*<img[^>]*src="([^"]+)"', text)
            if not full:
                raise ValueError('No downloadable full image on Commons page')
            def span(name):
                m = re.search(r'<span[^>]*class="[^"]*licensetpl_' + name + r'[^\"]*"[^>]*>(.*?)</span>', text, re.S)
                return clean(m.group(1)) if m else ''
            def cell(name):
                m = re.search(r'<td[^>]*id="fileinfotpl_' + name + r'"[^>]*>.*?</td>\s*<td[^>]*>(.*?)</td>', text, re.S)
                return clean(m.group(1)) if m else ''
            ii = {'url': full.group(1), 'thumburl': full.group(2), 'descriptionurl': source_url,
                  'extmetadata': {k: {'value': v} for k, v in {
                      'Artist': cell('aut'), 'Credit': cell('src'), 'LicenseShortName': span('short'),
                      'UsageTerms': span('long'), 'AttributionRequired': span('attr_req'),
                      'LicenseUrl': span('link'), 'ImageDescription': cell('desc')}.items()}}
            # licensetpl_link may contain a link rather than its URL as text.
            m = re.search(r'<span[^>]*class="licensetpl_link"[^>]*>.*?href="([^"]+)"', text, re.S)
            if m:
                ii['extmetadata']['LicenseUrl'] = {'value': m.group(1)}
            result['imageinfo'] = ii
        except Exception as exc:
            result['portrait_error'] = str(exc)
    if not ii.get('url'):
        result.setdefault('portrait_error', 'Commons image metadata unavailable')
        return title, result
    meta = ii.get('extmetadata', {})
    val = lambda k: clean(meta.get(k, {}).get('value', ''))
    urls = [result.get('tested_download_url'), ii.get('thumburl'), result.get('article_image_url'), ii['url']]
    error = None
    for url in dict.fromkeys(u for u in urls if u):
        try:
            extension = up.urlparse(url).path.split('.')[-1].lower()
            if extension not in ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'tif', 'tiff']:
                extension = 'jpg'
            image_identity = result.get('commons_file') or up.urlparse(ii['url']).path
            asset_key = hashlib.sha256(image_identity.encode()).hexdigest()[:10]
            local = 'portraits/' + result['key'] + '-' + asset_key + '.' + extension
            target = ROOT / local
            if not target.exists():
                target.write_bytes(get(url, binary=True))
            b = target.read_bytes()
            if not (b.startswith(b'\xff\xd8') or b.startswith(b'\x89PNG') or b.startswith(b'GIF8') or b.startswith(b'RIFF') or b'<?xml' in b[:200] or b'<svg' in b[:200] or b[:2] in [b'II', b'MM']):
                target.unlink()
                raise ValueError('Response is not an image')
            result['portrait'] = {
                'local_path': local, 'file_name': result['commons_file'],
                'commons_page': ii.get('descriptionurl') if 'commons.wikimedia.org/' in ii.get('descriptionurl', '') else None,
                'source_page': ii.get('descriptionurl'), 'original_url': result.get('source_url') if ii['url'].startswith('file:') else ii['url'],
                'download_url': result.get('local_asset_path', url) if url.startswith('file:') else url,
                'asset_source_path': result.get('local_asset_path'),
                'artist': result.get('artist', val('Artist')), 'credit': result.get('credit', val('Credit')),
                'license': result.get('license', val('LicenseShortName')), 'license_url': result.get('verified_license_url', val('LicenseUrl')),
                'attribution_required': val('AttributionRequired'), 'usage_terms': val('UsageTerms'),
                'description': val('ImageDescription')[:1600],
                'mime': ii.get('thumbmime', ii.get('mime')), 'sha256': hashlib.sha256(b).hexdigest(),
                'retrieved_at': '2026-10-26',
                'kind': 'portrait' if result.get('kind') == 'photograph' else result.get('kind', 'portrait'),
                'depiction_note': result.get('depiction_note', ''),
                'depiction_note_en': result.get('depiction_note_en', ''),
                'rights_status': result.get('rights_status', 'source_license_recorded'),
            }
            result.pop('portrait_error', None)
            return title, result
        except Exception as exc:
            error = str(exc)
    result['portrait_error'] = error
    return title, result

def main():
    result = {}
    people = inputs()
    with cf.ThreadPoolExecutor(max_workers=3) as pool:
        for n, (title, obj) in enumerate(pool.map(identity, people), 1):
            result[title] = obj
            print(f'identity {n}/{len(people)} {title}: ' + obj.get('identity_error', 'OK'), flush=True)
    files = sorted(set(p['commons_file'] for p in result.values() if p.get('commons_file') and not p.get('portrait') and not p.get('imageinfo')))
    meta = {}
    for start in range(0, len(files), 15):
        try:
            meta.update(metadata_batch(files[start:start + 15]))
            print('Commons metadata', start + 1, '-', min(start + 15, len(files)), flush=True)
        except Exception as exc:
            print('Commons metadata ERROR', str(exc), flush=True)
    for obj in result.values():
        obj['imageinfo'] = meta.get(obj.get('commons_file', '').replace('_', ' '), obj.get('imageinfo', {}))
    # Batched Wikidata Chinese names: no large claim downloads needed.
    ids = sorted(set(o['wikidata_id'] for o in result.values() if o.get('wikidata_id') and not o.get('name_zh')))
    labels = {}
    for start in range(0, len(ids), 40):
        qids = ids[start:start + 40]
        key = hashlib.sha256('|'.join(qids).encode()).hexdigest()[:20]
        path = CACHE / (key + '.labels.json')
        try:
            if not path.exists():
                query = {'action': 'wbgetentities', 'format': 'json', 'ids': '|'.join(qids), 'props': 'labels', 'languages': 'zh-cn|zh-hans|zh|en'}
                path.write_text(json.dumps(get('https://www.wikidata.org/w/api.php?' + up.urlencode(query)), ensure_ascii=False, indent=2))
            for qid, entity in json.loads(path.read_text()).get('entities', {}).items():
                labs = entity.get('labels', {})
                labels[qid] = next((labs[k]['value'] for k in ['zh-cn', 'zh-hans', 'zh'] if k in labs), None)
        except Exception as exc:
            print('Wikidata labels ERROR', exc, flush=True)
    for obj in result.values():
        obj['name_zh'] = labels.get(obj.get('wikidata_id')) or obj.get('name_zh')
    with cf.ThreadPoolExecutor(max_workers=3) as pool:
        for n, (title, obj) in enumerate(pool.map(portrait, result.items()), 1):
            result[title] = obj
            path = CACHE / (obj['key'] + '.json')
            path.write_text(json.dumps(obj, ensure_ascii=False, indent=2))
            print(f'portrait {n}/{len(result)} {title}: ' + obj.get('portrait_error', 'OK'), flush=True)
    (ROOT / 'data/enrichment.json').write_text(json.dumps(result, ensure_ascii=False, indent=2))
    errors = {t: {k: v for k, v in o.items() if k.endswith('_error')} for t, o in result.items() if not o.get('portrait')}
    (ROOT / 'data/enrichment-errors.json').write_text(json.dumps(errors, ensure_ascii=False, indent=2))
    print('DONE', len(result), 'missing portraits', len(errors), flush=True)

if __name__ == '__main__':
    main()
