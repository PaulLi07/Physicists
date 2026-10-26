"""Normalize rendered source metadata without changing the archived source."""
import html
import re
import urllib.parse as up


def clean_text(value):
    value = re.sub(r'<(style|script)\b[^>]*>.*?</\1\s*>', '', value or '', flags=re.I | re.S)
    value = html.unescape(re.sub(r'<[^>]+>', '', value))
    # Some old source caches already flattened <style> into visible text. In
    # these templates the stylesheet is a prefix before the creator's name.
    css = re.search(r'\.mw-parser-output|@media\s|html\.skin-theme', value)
    if css:
        end = value.rfind('}')
        prefix = value[:css.start()]
        suffix = value[end + 1:] if end >= css.start() else ''
        # Descriptions may have been truncated inside a stylesheet. Keep the
        # usable prose prefix rather than exposing an incomplete CSS selector.
        if re.search(r'\.mw-|@media|\{|\}', suffix):
            suffix = ''
        value = prefix + ' ' + suffix
    value = value.replace('Unknown authorUnknown author', 'Unknown author')
    return re.sub(r'\s+', ' ', value).strip()


def clean_license_url(value, source_page):
    value = html.unescape(value or '').strip()
    if value.startswith('/'):
        value = up.urljoin('https://commons.wikimedia.org/', value)
    if not value.startswith(('http://', 'https://')):
        return ''
    parsed = up.urlparse(value)
    if (parsed.hostname in ['upload.wikimedia.org', 'thumb.wikimedia.org']
            or re.search(r'\.(?:jpe?g|png|gif|svg|webp|tiff?)$', parsed.path, re.I)
            or 'action=edit' in parsed.query):
        # The source description contains the recorded rights statement; an
        # image download or edit form is not a licence statement.
        return source_page if source_page.startswith(('http://', 'https://')) else ''
    return value


def clean_creator(value):
    value = clean_text(value)
    # Creator tables carry catalogue headings and machine-readable date labels
    # as well as the creator's name. Those details remain in the source cache.
    value = re.split(r'\s+(?:Description|Alternative names|Work location)\s+', value, maxsplit=1)[0]
    if 'QS:' in value:
        value = re.sub(r'\([^()]*QS:[^()]*\)', '', value)
    value = value.replace('UnknownUnknown', 'Unknown')
    return re.sub(r'\s+', ' ', value).strip()
