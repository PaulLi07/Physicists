/* Auditable event density. Historical dates have no year zero. */
(function(root){
  'use strict';
  const weights=[1,2,4,8];
  const serial=y=>y<0?y+1:y;
  const calendar=n=>n<=0?n-1:n;
  function validYear(y){return Number.isInteger(y)&&y!==0&&y>=-10000&&y<=10000;}
  function spanOf(e){
    if(e.precision==='unknown')return null;
    if(e.dateRange){if(!Array.isArray(e.dateRange)||e.dateRange.length!==2||!e.dateRange.every(validYear)||e.dateRange[1]<e.dateRange[0])throw Error('Invalid date range: '+e.id);return e.dateRange;}
    if(!validYear(e.year))throw Error('Invalid event year: '+e.id);
    return [e.year,e.year];
  }
  function validate(events,personIds){
    const ids=new Set();
    for(const e of events){
      if(!e.id||ids.has(e.id))throw Error('Duplicate or missing event ID: '+e.id);ids.add(e.id);
      if(!weights.includes(e.weight))throw Error('Invalid importance weight: '+e.id);
      if(!['year','range','approximate','unknown'].includes(e.precision))throw Error('Invalid date precision: '+e.id);
      if(!['theory','discovery','method'].includes(e.type))throw Error('Invalid event type: '+e.id);
      if(!Array.isArray(e.people)||new Set(e.people).size!==e.people.length)throw Error('Duplicate event participant: '+e.id);
      if(personIds&&e.people.some(id=>!personIds.has(id)))throw Error('Unknown participant: '+e.id);
      if(!e.sources?.length||e.sources.some(s=>!/^https?:\/\//.test(s.url||'')||!s.title))throw Error('Missing source: '+e.id);
      for(const lang of ['zh','en'])if(!e.title?.[lang]||!e.rationale?.[lang]||typeof e.dateNote?.[lang]!=='string')throw Error('Missing bilingual event evidence: '+e.id);
      spanOf(e);
    }
    return true;
  }
  function calculate(events,options={}){
    validate(events,options.personIds);
    if(options.weightMap&&Object.values(options.weightMap).some(w=>!Number.isFinite(w)||w<=0))throw Error('Invalid sensitivity weight map');
    const asOfYear=options.asOfYear??new Date().getUTCFullYear();
    if(!validYear(asOfYear))throw Error('Invalid index cutoff');
    const allDated=events.map(e=>({e,span:spanOf(e)})).filter(x=>x.span);
    const dated=allDated.filter(x=>x.e.indexEligible!==false);
    if(allDated.some(x=>x.span[1]>asOfYear))throw Error('Event extends beyond the review cutoff');
    const minYear=allDated.length?Math.min(...allDated.map(x=>x.span[0])):asOfYear;
    const start=serial(minYear)-5,end=serial(asOfYear);
    const raw=new Map(),uncertain=new Map(),participants=new Map();
    for(const {e,span} of dated){
      const lo=serial(span[0]),hi=serial(span[1]),share=(options.weightMap?.[e.weight]??e.weight)/(hi-lo+1);
      for(let n=lo;n<=hi;n++){
        raw.set(n,(raw.get(n)||0)+share);
        if(e.precision!=='year')uncertain.set(n,(uncertain.get(n)||0)+share);
        if(!participants.has(n))participants.set(n,new Set());e.people.forEach(id=>participants.get(n).add(id));
      }
    }
    const series=[];
    for(let n=start;n<=end;n++){
      let smoothed=0,approximate=0;const people=new Set();
      for(let d=-5;d<=5;d++){
        const k=(6-Math.abs(d))/36;
        smoothed+=k*(raw.get(n-d)||0);approximate+=k*(uncertain.get(n-d)||0);
        participants.get(n-d)?.forEach(id=>people.add(id));
      }
      series.push({year:calendar(n),raw:raw.get(n)||0,value:smoothed,uncertain:approximate,people:people.size,density:people.size/11,provisional:n>end-5});
    }
    return {minYear,maxYear:asOfYear,kernel:{name:'centered-triangular',radius:5,denominator:36},series};
  }
  function createAnchors(events){
    const candidates=new Map();
    for(const e of events){const span=spanOf(e);if(!span)continue;
      const year=calendar(Math.round((serial(span[0])+serial(span[1]))/2));
      for(const id of e.people){const old=candidates.get(id);const candidate={year,eventId:e.id,weight:e.weight,precision:e.precision,dateRange:e.dateRange??null};
        // Prefer reliable dating before importance; deterministic ties use the earliest event.
        const confidence=e.precision==='year'?2:e.precision==='range'?1:0;
        const oldConfidence=old?(old.precision==='year'?2:old.precision==='range'?1:0):-1;
        if(!old||confidence>oldConfidence||(confidence===oldConfidence&&(e.weight>old.weight||(e.weight===old.weight&&year<old.year))))candidates.set(id,candidate);
      }
    }
    return Object.fromEntries(candidates);
  }
  function summarize(series,from,to){
    const selected=series.filter(p=>p.year>=from&&p.year<=to);
    if(!selected.length)return {value:0,density:0,uncertain:0};
    const out={value:0,density:0,uncertain:0};for(const p of selected)for(const key of Object.keys(out))out[key]+=p[key]/selected.length;return out;
  }
  const api={validate,calculate,createAnchors,summarize,spanOf,serial,calendar,weights};
  root.BreakthroughCore=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
