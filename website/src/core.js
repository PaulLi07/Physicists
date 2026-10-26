/* Shared, dependency-free archive filtering. Dates remain source text. */
(function (root) {
  'use strict';
  const eras = [
    {id:'ancient', min:-Infinity, max:1499, zh:'古代与中世纪', en:'Antiquity & Middle Ages', range:{zh:'公元前 — 1499',en:'BCE — 1499'}},
    {id:'scientific', min:1500, max:1699, zh:'科学革命', en:'Scientific Revolution', range:{zh:'1500 — 1699',en:'1500 — 1699'}},
    {id:'enlightenment', min:1700, max:1799, zh:'启蒙与经典物理', en:'The classical foundations', range:{zh:'1700 — 1799',en:'1700 — 1799'}},
    {id:'nineteenth', min:1800, max:1899, zh:'物理学的变革', en:'A century of discovery', range:{zh:'1800 — 1899',en:'1800 — 1899'}},
    {id:'modern', min:1900, max:Infinity, zh:'走向现代', en:'Into the modern era', range:{zh:'1900年及以后',en:'1900 onwards'}}
  ];
  const domains = [
    {id:'history',zh:'自然哲学与科学史',en:'Natural philosophy & history',pattern:/自然哲学|科学史|物理学史|物理史|natural philosophy|history of (?:physics|science)/i},
    {id:'mechanics',zh:'经典力学与流体',en:'Classical mechanics & fluids',pattern:/^力学$|经典力学|流体|弹性|固体力学|天体力学|classical mechanics|fluid|elastic|continuum|celestial mechanics/i},
    {id:'light',zh:'光学与电磁学',en:'Optics & electromagnetism',pattern:/光学|光谱|电磁|电学|磁学|电气|electromag|optic|spectroscop|magnet|electric|photonics/i},
    {id:'heat',zh:'热学与统计物理',en:'Heat & statistical physics',pattern:/热学|热力|低温|统计|therm|statistic|cryogen|heat/i},
    {id:'quantum',zh:'量子、原子与分子',en:'Quantum, atomic & molecular',pattern:/量子|原子|分子|quantum|atomic|molecular/i},
    {id:'matter',zh:'凝聚态与材料',en:'Condensed matter & materials',pattern:/凝聚|固体|半导体|超导|晶体|材料|condensed|solid.state|semiconductor|superconduct|crystal|material|mesoscopic/i},
    {id:'particle',zh:'粒子、核与场论',en:'Particles, nuclei & fields',pattern:/粒子|核物理|核科学|核反应|核结构|核力|场论|加速器|particle|nuclear|field theory|high.energy|accelerator/i},
    {id:'cosmos',zh:'天体、宇宙与引力',en:'Astrophysics, cosmos & gravity',pattern:/天体|宇宙|引力|相对论|astrophys|astronom|cosmolog|gravit|relativ/i},
    {id:'methods',zh:'数学物理与实验方法',en:'Mathematical & experimental',pattern:/数学|计算|实验|仪器|计量|测量|mathemat|computation|experiment|instrument|metrolog|measurement|detector/i}
  ];
  function normalize(value) {
    return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’'`·.,;:()\[\]{}\-–—_/]/g,' ').replace(/\s+/g,' ').trim();
  }
  function eraOf(person) { return eras.find(era => person.sortYear >= era.min && person.sortYear <= era.max); }
  function searchText(person) { return normalize([person.names.zh,person.names.en,...person.fields.zh,...person.fields.en].join(' ')); }
  function filterPeople(people, state) {
    const tokens = normalize(state.query).split(' ').filter(Boolean);
    const domain = domains.find(item => item.id === state.field);
    return people.filter(person => (!state.era || state.era === 'all' || eraOf(person).id === state.era)
      && (!domain || [...person.fields.zh,...person.fields.en].some(field => domain.pattern.test(field)))
      && tokens.every(token => searchText(person).includes(token)));
  }
  const api = Object.freeze({eras,domains,normalize,eraOf,searchText,filterPeople});
  root.ArchiveCore = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(globalThis);
