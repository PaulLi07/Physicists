#!/usr/bin/env python3
"""Generate the reviewed English Nobel cohort from aligned editorial maps."""
import json
import html
from build import ROOT, nobel_people, read_lines

MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

def date_display(date):
    if not date:
        return None
    text = date['date']
    bce = text.startswith('-')
    pieces = text.lstrip('-').split('-')
    year = str(int(pieces[0])) + (' BCE' if bce else '')
    if len(pieces) == 3:
        value = str(int(pieces[2])) + ' ' + MONTHS[int(pieces[1]) - 1] + ' ' + year
    elif len(pieces) == 2:
        value = MONTHS[int(pieces[1]) - 1] + ' ' + year
    else:
        value = year
    return ('c. ' if date['precision'] == 'approximate' else '') + value

def join(items):
    return ', '.join(items[:-1]) + ' and ' + items[-1] if len(items) > 1 else items[0]

def running_field(field):
    if field.startswith(('X-', 'CP ', 'Earth ', 'Galactic ')):
        return field
    return field[0].lower() + field[1:]

def main():
    years = {y: {'fields': fs.split(';'), 'contributions': cs.split(';')} for y, fs, cs in read_lines('data/translations/nobel-research.en.txt')}
    individual = {i: {'fields': fs.split(';') if fs else [], 'contributions': cs.split(';') if cs else []} for i, fs, cs in read_lines('data/translations/nobel-individual.en.txt')}
    facts = json.loads((ROOT / 'data/raw/nobel-laureates.json').read_text())['laureates']
    raw = {p['id']: p for p in facts}
    fixes = json.loads((ROOT / 'data/curated/nobel-fact-corrections.json').read_text())
    people = nobel_people(json.loads((ROOT / 'data/enrichment.json').read_text()))
    result = []
    for p in people:
        source = raw[p['nobel_id']]
        prizes = [n for n in source['nobelPrizes'] if n['category']['en'] == 'Physics']
        edit = individual.get(p['nobel_id']) or years[prizes[0]['awardYear']]
        fields, contributions = edit['fields'], edit['contributions']
        name = p['name_en']
        location = html.unescape(source.get('birth', {}).get('place', {}).get('locationString', {}).get('en', ''))
        affiliations = list(dict.fromkeys(html.unescape(a['name']['en']) for n in prizes for a in n.get('affiliations', [])))
        bio = name + (' was born in ' + location + ' and conducted research in ' if location else ' conducted research in ') + join([running_field(f) for f in fields]) + '. '
        if affiliations:
            bio += 'Nobel records list ' + join(affiliations) + ' as the affiliation' + ('s' if len(affiliations) > 1 else '') + ' at the time of the award' + ('s' if len(prizes) > 1 else '') + '. '
        bio += 'They ' + contributions[0][0].lower() + contributions[0][1:] + '. '
        bio += 'They were awarded the Nobel Prize in Physics in ' + join([n['awardYear'] for n in prizes]) + '.'
        notes = fixes.get(p['id'], {}).get('notes_en', [])
        if not notes and p['notes']:
            raise ValueError('Untranslated Nobel notes: ' + p['id'])
        result.append({'id': p['id'], 'name_en': name, 'biography': bio,
                       'contributions': contributions, 'fields': fields,
                       'birth_display': date_display(p['birth']), 'death_display': date_display(p['death']),
                       'notes': notes, 'portrait_alt': 'Portrait of ' + name,
                       'portrait_note': 'For the photographer or artist, date and type of image, consult the original image record.',
                       'sources': p['sources'],
                       'editorial_basis': 'Original English rendering of the source-checked Chinese record. Nobel data supplies award affiliations; documented institutional or archival corrections take precedence for disputed dates.'})
    path = ROOT / 'data/translations/nobel.en.json'
    path.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print('English Nobel profiles:', len(result))

if __name__ == '__main__':
    main()
