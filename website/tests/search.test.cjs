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

test('All 721 people remain distinct and chronologically ordered', () => {
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

/* A small DOM model exercises application state and generated content without
 * claiming to test native dialog focus trapping, CSS layout or browser history.
 * Those are checked in the actual browser by the parent task. */
function harness(initialHash = '') {
  const nodes = new Map(), controls = new Map(), listeners = new Map(), timers = new Map();
  let timerId = 0;
  const html = fs.readFileSync(path.join(root, 'website/src/index.html'), 'utf8');
  const document = {body: null, activeElement: null, documentElement: {lang: 'zh-CN'}};
  class Element {
    constructor(id, tagName = 'BUTTON', dataset = {}, container = null) {
      Object.assign(this, {id, tagName, dataset, container, style: {}, attrs: {}, events: new Map(), open: false,
        hidden: false, value: '', textContent: '', scrollTop: 0, html: ''});
    }
    set innerHTML(value) {
      if (document.activeElement?.container === this.id) document.activeElement = document.body;
      for (const [key, node] of controls) if (node.container === this.id) controls.delete(key);
      this.html = value;
    }
    get innerHTML() { return this.html; }
    setAttribute(k, v) { this.attrs[k] = String(v); }
    getAttribute(k) { return this.attrs[k]; }
    addEventListener(name, fn) { if (!this.events.has(name)) this.events.set(name, []); this.events.get(name).push(fn); }
    focus() { document.activeElement = this; }
    showModal() { this.open = true; }
    close() { this.open = false; }
    scrollIntoView() {}
    getBoundingClientRect() { return {left: 10, top: 10, right: 1000, bottom: 800}; }
    closest(selector) {
      const match = selector.match(/^\[data-([a-z]+)\]$/);
      return match && this.dataset[match[1]] !== undefined ? this : null;
    }
    dispatch(name, event = {}) { for (const fn of this.events.get(name) || []) fn({target: this, preventDefault() {}, ...event}); }
  }
  document.body = new Element('body', 'BODY');
  document.activeElement = document.body;
  for (const match of html.matchAll(/\bid="([^"]+)"/g)) nodes.set(match[1], new Element(match[1], match[1] === 'search-input' ? 'INPUT' : 'BUTTON'));
  const staticClasses = new Map(['header-nav', 'hero-gallery', 'skip-link']
    .filter(name => new RegExp('class="[^"]*\\b' + name + '\\b').test(html))
    .map(name => [name, new Element(name)]));
  function dynamic(selector, all = false) {
    const keyMatch = selector.match(/\[data-(person|era|adjacent)="([^"]+)"\]/);
    const attr = keyMatch?.[1] || (selector.includes('card-button') ? 'person' : null);
    const expected = keyMatch?.[2];
    if (!attr) return all ? [] : null;
    const result = [];
    const containers = selector.includes('featured-person') ? ['featured-portraits'] : attr === 'era' ? ['era-nav'] : ['timeline-results', 'featured-portraits', 'profile-content'];
    for (const id of containers) {
      const container = nodes.get(id);
      if (!container) continue;
      for (const match of container.innerHTML.matchAll(new RegExp('data-' + attr + '="([^"]+)"', 'g'))) {
        if (expected && expected !== match[1]) continue;
        const key = id + ':' + attr + ':' + match[1];
        if (!controls.has(key)) controls.set(key, new Element(key, 'BUTTON', {[attr]: match[1]}, id));
        result.push(controls.get(key));
        if (!all) return result[0];
      }
    }
    return all ? result : null;
  }
  document.getElementById = id => nodes.get(id);
  document.querySelector = selector => staticClasses.get(selector.replace(/^\./, '')) || dynamic(selector);
  document.querySelectorAll = selector => selector.includes('card-button') ? dynamic(selector, true) : [];
  document.addEventListener = (name, fn) => { if (!listeners.has(name)) listeners.set(name, []); listeners.get(name).push(fn); };
  const windowEvents = new Map();
  const location = {hash: initialHash};
  const history = {state: null, replaceState(state, _, hash) { this.state = state; location.hash = hash; }, pushState(state, _, hash) { this.state = state; location.hash = hash; }};
  const context = {document, location, history, URLSearchParams, PHYSICS_ARCHIVE: archive, ArchiveCore: core,
    localStorage: {getItem() {return null;}, setItem() {}},
    setTimeout(fn) {timers.set(++timerId, fn); return timerId;}, clearTimeout(id) {timers.delete(id);},
    scrollY: 0, scrollTo() {}, addEventListener(name, fn) {if (!windowEvents.has(name)) windowEvents.set(name, []); windowEvents.get(name).push(fn);}};
  context.window = context;
  vm.runInNewContext(fs.readFileSync(path.join(root, 'website/src/app.js'), 'utf8'), context);
  function click(element) {
    element.focus(); element.dispatch('click');
    for (const fn of listeners.get('click') || []) fn({target: element, preventDefault() {}});
  }
  return {nodes, document, location, query: value => {nodes.get('search-input').value = value; nodes.get('search-input').dispatch('input'); for (const [id, fn] of timers) {timers.delete(id);fn();}},
    click, clickData: (key, value) => click(dynamic(`[data-${key}="${value}"]`) || new Element('control', 'BUTTON', {[key]: value})),
    changeHash(hash) {location.hash = hash;for (const fn of windowEvents.get('hashchange') || []) fn();},
    lang(lang) {click(new Element('lang-' + lang, 'BUTTON', {lang}));}};
}

test('Deep links restore language, search and the exact profile; unknown death stays unknown', () => {
  const h = harness('#lang=en&q=Majorana&person=ettore-majorana');
  assert.equal(h.document.documentElement.lang, 'en');
  assert.equal(h.nodes.get('search-input').value, 'Majorana');
  assert.equal(h.nodes.get('profile-dialog').open, true);
  assert.match(h.nodes.get('profile-content').innerHTML, /Death date or whereabouts uncertain/);
  assert.doesNotMatch(h.nodes.get('profile-content').innerHTML, /Living \(as of/);
});

test('Language switch preserves current person, query and source caveats', () => {
  const h = harness('#lang=zh&q=Duhem&person=pierre-duhem');
  h.nodes.get('profile-scroll').scrollTop = 123;
  h.lang('en');
  assert.equal(h.nodes.get('profile-dialog').open, true);
  assert.equal(h.nodes.get('profile-scroll').scrollTop, 123);
  assert.match(h.nodes.get('profile-content').innerHTML, /10 June 1861 \(date disputed\)/);
  assert.match(h.nodes.get('profile-content').innerHTML, /Sources disagree between 9 and 10 June/);
  const params = new URLSearchParams(h.location.hash.slice(1));
  assert.equal(params.get('person'), 'pierre-duhem');
  assert.equal(params.get('q'), 'Duhem');
  assert.equal(params.get('lang'), 'en');
});

test('Invalid URL filter values and person IDs safely fall back', () => {
  const h = harness('#lang=xx&field=invalid&era=invalid&person=missing');
  assert.equal(h.nodes.get('profile-dialog').open, false);
  assert.equal(h.nodes.get('field-select').value, 'all');
  assert.equal(h.nodes.get('era-select').value, 'all');
  assert.match(h.nodes.get('results-status').innerHTML, /721/);
});

test('Close, cancellation and hash navigation keep profile state and body scrolling coherent', () => {
  const h = harness();
  h.clickData('person', 'isaac-newton');
  assert.equal(h.nodes.get('profile-dialog').open, true);
  h.nodes.get('profile-dialog').dispatch('cancel');
  assert.equal(h.nodes.get('profile-dialog').open, false);
  assert.equal(h.document.body.style.overflow, '');
  assert.equal(new URLSearchParams(h.location.hash.slice(1)).get('person'), null);
  h.changeHash('#lang=en&person=ettore-majorana');
  assert.equal(h.nodes.get('profile-dialog').open, true);
  h.changeHash('#lang=en');
  assert.equal(h.nodes.get('profile-dialog').open, false);
  assert.equal(h.document.body.style.overflow, '');
});

test('Empty search resets to the full collection and leaves no stale cards', () => {
  const h = harness();
  h.query('zzzz-physics-no-match-9173');
  assert.equal(h.nodes.get('empty-state').hidden, false);
  assert.equal(h.nodes.get('timeline-results').innerHTML, '');
  h.click(h.nodes.get('empty-reset'));
  assert.equal(h.nodes.get('empty-state').hidden, true);
  assert.match(h.nodes.get('results-status').innerHTML, /721/);
  assert.equal(h.nodes.get('search-input').value, '');
});

test('Era selection preserves keyboard focus on the active era control', () => {
  const h = harness();
  h.clickData('era', 'modern');
  assert.equal(h.nodes.get('era-select').value, 'modern');
  assert.equal(h.document.activeElement.dataset.era, 'modern');
});

test('Loading more moves keyboard focus to newly revealed people, including the final page', () => {
  const h = harness();
  h.click(h.nodes.get('load-more'));
  assert.equal(h.document.activeElement.dataset.person, people[36].id);
  while (!h.nodes.get('load-more-wrap').hidden) h.click(h.nodes.get('load-more'));
  assert.equal(h.document.activeElement.dataset.person, people[720].id);
  assert.equal(h.nodes.get('timeline-results').innerHTML.match(/class="person-card"/g).length, 721);
});
