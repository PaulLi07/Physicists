/* Source-grounded regression checks; no browser or third-party dependencies. */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const core = require('../src/core.js');
const archiveSource = fs.readFileSync(path.join(root, 'website/dist/data/archive.js'), 'utf8');
const archiveContext = {};
vm.runInNewContext(archiveSource, archiveContext);
const archive = archiveContext.PHYSICS_ARCHIVE;
const people = archive.people;
const byId = new Map(people.map(p => [p.id, p]));
const ids = rows => Array.from(rows, p => p.id);
const find = (query = '', field = 'all', era = 'all') => core.filterPeople(people, {query, field, era});
const contains = (rows, ...expected) => expected.forEach(id => assert.ok(ids(rows).includes(id), `Missing ${id}`));

test('Packaged biographies remain distinct and retain their source birth order', () => {
  assert.equal(people.length, 721);
  assert.equal(byId.size, people.length);
  assert.deepEqual(ids(find()), ids(people));
  assert.equal(people[0].id, 'thales');
  assert.equal(people.at(-1).id, 'konstantin-novoselov');
  assert.ok(people.every((p, i) => !i || p.sortYear >= people[i - 1].sortYear));
});

test('Names are searchable in either language, ignoring case, accents and surrounding whitespace', () => {
  contains(find('爱因斯坦'), 'albert-einstein');
  contains(find('  eINsTeIn  '), 'albert-einstein');
  contains(find('杨振宁'), 'chen-ning-yang');
  contains(find('Chen Ning Yang'), 'chen-ning-yang');
  contains(find('Schrodinger'), 'erwin-schrodinger');
  assert.deepEqual(ids(find('Schrodinger')), ids(find('Schrödinger')));
});

test('Similar surnames do not merge independent records', () => {
  contains(find('Wolfgang Paul'), 'wolfgang-paul', 'wolfgang-pauli');
  contains(find('Bell'), 'john-stewart-bell', 'jocelyn-bell-burnell');
  assert.notEqual(byId.get('wolfgang-paul').birth.date, byId.get('wolfgang-pauli').birth.date);
});

test('Research fields and multiword queries work in both languages', () => {
  contains(find('气体放电'), 'francis-hauksbee');
  contains(find('Quantum field theory'), 'nima-arkani-hamed');
  contains(find('量子场论'), 'nima-arkani-hamed');
  contains(find('condensed matter'), 'shirley-ann-jackson');
  contains(find('Einstein relativity'), 'albert-einstein');
  assert.equal(find('Einstein 气体放电').length, 0);
});

test('No results and markup-like input are inert', () => {
  assert.equal(find('zzzz-physics-no-match-9173').length, 0);
  assert.equal(find('<script>alert(1)</script>').length, 0);
});

test('Era boundaries are inclusive, non-overlapping and cover BCE', () => {
  const boundaries = [[-624, 'ancient'], [1499, 'ancient'], [1500, 'scientific'], [1699, 'scientific'],
    [1700, 'enlightenment'], [1799, 'enlightenment'], [1800, 'nineteenth'], [1899, 'nineteenth'], [1900, 'modern'], [1974, 'modern']];
  for (const [sortYear, expected] of boundaries) assert.equal(core.eraOf({sortYear}).id, expected);
  const joined = core.eras.flatMap(era => ids(find('', 'all', era.id)));
  assert.deepEqual(joined, ids(people));
});

test('Domain, era and name filters combine rather than override one another', () => {
  contains(find('Einstein', 'cosmos', 'nineteenth'), 'albert-einstein');
  assert.equal(find('Einstein', 'cosmos', 'modern').length, 0);
  contains(find('Majorana', 'particle', 'modern'), 'ettore-majorana');
  assert.equal(find('Majorana', 'heat', 'modern').length, 0);
  for (const [domain, person] of [['history', 'thales'], ['mechanics', 'isaac-newton'], ['light', 'michael-faraday'],
    ['heat', 'ludwig-boltzmann'], ['quantum', 'erwin-schrodinger'], ['matter', 'john-bardeen'],
    ['particle', 'georgy-flerov'], ['cosmos', 'edwin-hubble'], ['methods', 'george-green']]) contains(find('', domain), person);
});

test('Source uncertainty, image classification and full bilingual content survive data packaging', () => {
  const zh = JSON.parse(fs.readFileSync(path.join(root, 'zh/data/physicists.json'), 'utf8')).people;
  const en = new Map(JSON.parse(fs.readFileSync(path.join(root, 'en/data/physicists.json'), 'utf8')).people.map(p => [p.id, p]));
  for (const source of zh) {
    const p = byId.get(source.id);
    const english = en.get(source.id);
    assert.equal(p.biography.zh, source.biography, source.id);
    assert.equal(p.biography.en, english.biography, source.id);
    assert.deepEqual(Array.from(p.contributions.zh), source.contributions, source.id);
    assert.deepEqual(Array.from(p.contributions.en), english.contributions, source.id);
    assert.deepEqual(Array.from(p.notes.zh), source.notes, source.id);
    assert.deepEqual(Array.from(p.notes.en), english.notes, source.id);
    assert.deepEqual(Array.from(p.fields.zh), source.fields, source.id);
    assert.deepEqual(Array.from(p.fields.en), english.fields, source.id);
    assert.equal(p.birth.display.zh, source.birth.display, source.id);
    assert.equal(p.birth.display.en, english.birth.display, source.id);
    assert.equal(p.birth.precision, source.birth.precision, source.id);
    assert.equal(p.death?.date ?? null, source.death?.date ?? null, source.id);
    assert.equal(p.death?.display.zh ?? null, source.death?.display ?? null, source.id);
    assert.equal(p.death?.display.en ?? null, english.death?.display ?? null, source.id);
    assert.equal(p.deathStatus, source.death_status, source.id);
    assert.equal(p.portrait.kind, source.portrait.kind, source.id);
    assert.equal(p.portrait.note.zh, source.portrait.depiction_note, source.id);
    assert.equal(p.portrait.note.en, english.portrait.depiction_note, source.id);
    assert.deepEqual(Array.from(p.sources.zh, s => [s.title, s.url]), source.sources.map(s => [s.title, s.url]), source.id);
    assert.deepEqual(Array.from(p.sources.en, s => [s.title, s.url]), english.sources.map(s => [s.title, s.url]), source.id);
  }
  assert.equal(byId.get('ettore-majorana').death, null);
  assert.equal(byId.get('ettore-majorana').deathStatus, 'unknown');
  assert.equal(byId.get('nima-arkani-hamed').deathStatus, 'alive');
  assert.equal(byId.get('francis-hauksbee').portrait.kind, 'context_image');
  assert.equal(byId.get('georgy-flerov').portrait.kind, 'posthumous_depiction');
  assert.equal(byId.get('shirley-ann-jackson').portrait.rightsStatus, 'permission_required');
});
