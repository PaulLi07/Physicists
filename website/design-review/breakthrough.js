/* Auditable annual event ledger. Historical dates have no year zero. */
(function(root){
  'use strict';
  const weights=Object.freeze([1,2,4,8,16]);
  const serial=y=>y<0?y+1:y;
  const calendar=n=>n<=0?n-1:n;
  const validYear=y=>Number.isInteger(y)&&y!==0&&y>=-10000&&y<=10000;
  const estimatedEvent=e=>(e.assessment?.basis??e.assessmentBasis)==='editorial-estimate';
  function scoreOf(e){
    const score=e.score!==undefined?e.score:e.weight;
    if(!weights.includes(score))throw Error('Invalid importance score: '+e.id);
    if(e.weight!==undefined&&e.weight!==score)throw Error('Score and weight must agree: '+e.id);
    return score;
  }
  function checkedRange(start,end,id){
    if(!validYear(start)||!validYear(end)||end<start)throw Error('Invalid date range: '+id);
    return [start,end];
  }
  function spanOf(e){
    if(e.dateModel!==undefined&&e.dateModel!==null){
      const d=e.dateModel;
      if(!['point','uncertain-range','sustained'].includes(d.kind))throw Error('Invalid date model: '+e.id);
      const span=checkedRange(d.start,d.end,e.id);
      if(d.kind==='point'&&d.start!==d.end)throw Error('Point event requires one year: '+e.id);
      return span;
    }
    if(e.precision==='unknown')return null;
    if(e.dateRange){
      if(!Array.isArray(e.dateRange)||e.dateRange.length!==2)throw Error('Invalid date range: '+e.id);
      return checkedRange(e.dateRange[0],e.dateRange[1],e.id);
    }
    if(!validYear(e.year))throw Error('Invalid event year: '+e.id);
    return [e.year,e.year];
  }
  // Each allocation is part of ONE event budget, never a full score per year.
  function allocationsOf(e){
    const span=spanOf(e);if(!span)return [];
    const d=e.dateModel,allocations=d?.allocations;
    if(allocations===undefined)return [{start:span[0],end:span[1],fraction:1}];
    if(d.kind!=='sustained'||!Array.isArray(allocations)||!allocations.length)throw Error('Invalid sustained allocations: '+e.id);
    let total=0,lastEnd=-Infinity;
    const sorted=allocations.map(a=>{
      if(!a||typeof a!=='object')throw Error('Invalid sustained allocation: '+e.id);
      checkedRange(a.start,a.end,e.id);
      if(a.start<span[0]||a.end>span[1])throw Error('Allocation outside event range: '+e.id);
      if(!Number.isFinite(a.fraction)||a.fraction<=0||a.fraction>1)throw Error('Invalid allocation fraction: '+e.id);
      total+=a.fraction;return {start:a.start,end:a.end,fraction:a.fraction};
    }).sort((a,b)=>a.start-b.start);
    for(const a of sorted){
      if(serial(a.start)<=lastEnd)throw Error('Overlapping sustained allocations: '+e.id);
      lastEnd=serial(a.end);
    }
    if(Math.abs(total-1)>1e-9)throw Error('Allocation fractions must sum to one: '+e.id);
    return sorted.map(a=>({...a,fraction:a.fraction/total}));
  }
  function validate(events,personIds,options={}){
    if(!Array.isArray(events))throw Error('Events must be an array');
    const ids=new Set();
    for(const e of events){
      if(!e||!e.id||ids.has(e.id))throw Error('Duplicate or missing event ID: '+e?.id);ids.add(e.id);
      scoreOf(e);
      if(!e.dateModel&&!['year','range','approximate','unknown'].includes(e.precision))throw Error('Invalid date precision: '+e.id);
      if(!['theory','discovery','method'].includes(e.type))throw Error('Invalid event type: '+e.id);
      if(!Array.isArray(e.people)||new Set(e.people).size!==e.people.length||e.people.some(id=>typeof id!=='string'||!id))throw Error('Duplicate or invalid event participant: '+e.id);
      if(personIds&&e.people.some(id=>!personIds.has(id)))throw Error('Unknown participant: '+e.id);
      if(!e.sources?.length||e.sources.some(s=>!/^https?:\/\//.test(s.url||'')||!s.title))throw Error('Missing source: '+e.id);
      for(const lang of ['zh','en'])if(!e.title?.[lang]||!e.rationale?.[lang]||typeof e.dateNote?.[lang]!=='string')throw Error('Missing bilingual event evidence: '+e.id);
      const span=spanOf(e);allocationsOf(e);
      if(options.asOfYear!==undefined){
        if(!validYear(options.asOfYear))throw Error('Invalid index cutoff');
        if(span&&span[1]>options.asOfYear)throw Error('Event extends beyond the review cutoff: '+e.id);
      }
    }
    return true;
  }
  // The radius is only for querying nearby records, never for dating a result.
  function radiusAt(year){if(!Number.isFinite(year))throw Error('Invalid neighborhood year');return 5;}
  function kernelAt(year){radiusAt(year);return [[0,1]];}
  function estimateSpan(record){
    if(!validYear(record.year))throw Error('Invalid navigation estimate year: '+record.personId);
    const span=record.range??[record.year,record.year];
    if(!Array.isArray(span)||span.length!==2||!span.every(validYear)||span[1]<span[0]||record.year<span[0]||record.year>span[1])throw Error('Invalid navigation estimate range: '+record.personId);
    return span;
  }
  function calculate(events,options={}){
    const asOfYear=options.asOfYear??new Date().getUTCFullYear();
    if(!validYear(asOfYear))throw Error('Invalid index cutoff');
    validate(events,options.personIds,{asOfYear});
    if(options.weightMap&&Object.values(options.weightMap).some(w=>!Number.isFinite(w)||w<=0))throw Error('Invalid sensitivity weight map');
    if(options.estimatedContributions!==undefined&&(!Array.isArray(options.estimatedContributions)||options.estimatedContributions.length))throw Error('Personal residual scores are not supported; use scored events and navigationEstimates');
    if(options.navigationEstimates!==undefined&&!Array.isArray(options.navigationEstimates))throw Error('Navigation estimates must be an array');
    const seenNavigation=new Set();
    const navigation=(options.navigationEstimates??[]).map(record=>{
      if(!record||typeof record.personId!=='string'||!record.personId)throw Error('Navigation estimates require a person ID');
      if(seenNavigation.has(record.personId))throw Error('Duplicate navigation estimate: '+record.personId);
      if(options.personIds&&!options.personIds.has(record.personId))throw Error('Unknown navigation participant: '+record.personId);
      const span=estimateSpan(record);
      if(span[1]>asOfYear)throw Error('Navigation estimate extends beyond the review cutoff');
      seenNavigation.add(record.personId);return {record,span};
    });
    const allDated=events.map(e=>({e,span:spanOf(e)})).filter(x=>x.span);
    const dated=allDated.filter(x=>x.e.indexEligible!==false);
    const bounds=[...allDated.map(x=>x.span[0]),...navigation.map(x=>x.span[0])];
    const minYear=bounds.length?Math.min(...bounds):asOfYear;
    const start=serial(minYear),end=serial(asOfYear);
    const rawObserved=new Map(),rawEstimated=new Map(),rawUncertain=new Map();
    const participantSpans=allDated.map(({e})=>({people:e.people,parts:allocationsOf(e).map(a=>({lo:serial(a.start),hi:serial(a.end),fraction:a.fraction}))}));
    const add=(map,year,value)=>map.set(year,(map.get(year)||0)+value);
    const adjustedScore=e=>options.weightMap?.[scoreOf(e)]??scoreOf(e);
    for(const {e} of dated){
      const map=estimatedEvent(e)?rawEstimated:rawObserved;
      const uncertain=estimatedEvent(e)||(e.dateModel?e.dateModel.kind==='uncertain-range'||e.precision==='approximate':e.precision!=='year');
      for(const a of allocationsOf(e)){
        const lo=serial(a.start),hi=serial(a.end),share=adjustedScore(e)*a.fraction/(hi-lo+1);
        for(let n=lo;n<=hi;n++){add(map,n,share);if(uncertain)add(rawUncertain,n,share);}
      }
    }
    for(const {record,span} of navigation)participantSpans.push({parts:[{lo:serial(span[0]),hi:serial(span[1]),fraction:1}],people:[record.personId]});
    const series=[];
    for(let n=start;n<=end;n++){
      const personShares=new Map();
      for(const record of participantSpans){
        let share=0;
        for(const part of record.parts){
          const overlap=Math.max(0,Math.min(n+5,part.hi)-Math.max(n-5,part.lo)+1);
          share+=part.fraction*overlap/(part.hi-part.lo+1);
        }
        if(!share)continue;
        for(const id of record.people)personShares.set(id,Math.max(personShares.get(id)||0,share));
      }
      let people=0;for(const share of personShares.values())people+=share;
      const observed=rawObserved.get(n)||0,estimated=rawEstimated.get(n)||0;
      series.push({year:calendar(n),raw:observed+estimated,value:observed+estimated,
        rawObserved:observed,rawEstimated:estimated,observed,estimated,
        uncertain:rawUncertain.get(n)||0,people,density:people/11,
        bandwidth:0,provisional:false});
    }
    const observed=dated.filter(({e})=>!estimatedEvent(e)),estimated=dated.filter(({e})=>estimatedEvent(e));
    const kernel={name:'annual-event-ledger',radius:0,minRadius:0,maxRadius:0,
      normalization:'one-total-budget-per-event',densityWindow:11,
      densityPopulation:'all-dated-events-and-navigation-estimates',densityDeduplication:'maximum-source-overlap-per-person'};
    const components={scoredEvents:dated.length,observedEvents:observed.length,estimatedEvents:estimated.length,
      estimatedPeople:new Set(estimated.flatMap(({e})=>e.people)).size,navigationEstimatedPeople:navigation.length,
      observedWeight:observed.reduce((sum,{e})=>sum+adjustedScore(e),0),estimatedWeight:estimated.reduce((sum,{e})=>sum+adjustedScore(e),0)};
    return {minYear,maxYear:asOfYear,kernel,components,series};
  }
  function createAnchors(events){
    const candidates=new Map();
    for(const e of events){const span=spanOf(e);if(!span)continue;
      const year=calendar(Math.round((serial(span[0])+serial(span[1]))/2)),score=scoreOf(e);
      const precision=e.dateModel?(e.dateModel.kind==='point'?(e.precision==='approximate'?'approximate':'year'):e.dateModel.kind==='sustained'?'range':e.precision==='range'?'range':'approximate'):e.precision;
      for(const id of e.people){const old=candidates.get(id);const candidate={year,eventId:e.id,weight:score,score,precision,dateRange:span[0]===span[1]?null:span,
          estimated:e.sourceEstimate===true||estimatedEvent(e)};
        const confidence=precision==='year'?2:precision==='range'?1:0;
        const oldConfidence=old?(old.precision==='year'?2:old.precision==='range'?1:0):-1;
        if(!old||confidence>oldConfidence||(confidence===oldConfidence&&(score>old.score||(score===old.score&&year<old.year))))candidates.set(id,candidate);
      }
    }
    return Object.fromEntries(candidates);
  }
  function summarize(series,from,to){
    const selected=series.filter(p=>p.year>=from&&p.year<=to);
    if(!selected.length)return {value:0,density:0,uncertain:0};
    const out={value:0,density:0,uncertain:0};for(const p of selected)for(const key of Object.keys(out))out[key]+=p[key]/selected.length;return out;
  }
  function samplePixel(series,from,to){
    if(!Number.isFinite(from)||!Number.isFinite(to)||to<from)throw Error('Invalid pixel calendar range');
    // Annual values occupy unit-width cells centered on historical years.
    // Collapse the mathematical -1..1 interpolation to one historical step:
    // there is no extra zero-year cell. Overlap-weighted averaging means an
    // integer pixel boundary cannot double-count a whole neighboring year.
    const position=y=>y<=-1?y+1:y>=1?y:(y+1)/2;
    const lo=position(from),hi=position(to),out={value:0,density:0,uncertain:0};
    if(hi===lo){
      const nearest=calendar(Math.round(lo)),point=series.find(p=>p.year===nearest);
      if(point)for(const key of Object.keys(out))out[key]=point[key];
      return out;
    }
    for(const p of series){
      const n=serial(p.year),overlap=Math.max(0,Math.min(hi,n+.5)-Math.max(lo,n-.5));
      if(overlap)for(const key of Object.keys(out))out[key]+=p[key]*overlap/(hi-lo);
    }
    return out;
  }
  const importanceColors=Object.freeze({1:'#414146',2:'#704047',4:'#a63843',8:'#c72b3b',16:'#df2434'});
  function importanceColor(score){
    if(!weights.includes(score))throw Error('Invalid importance color score');
    return importanceColors[score];
  }
  // A declared nonlinear DISPLAY transform; stored annual values stay linear.
  function asinhScale(value,max,width=1,knee=1){
    if(![value,max,width,knee].every(Number.isFinite)||value<0||max<0||width<0||knee<=0)throw Error('Invalid asinh display scale');
    if(!max||!width)return 0;
    return Math.asinh(Math.min(value,max)/knee)/Math.asinh(max/knee)*width;
  }
  function formatIndex(value){
    if(!Number.isFinite(value)||value<0)throw Error('Invalid index display value');
    if(value===0)return '0';
    if(value>=.01)return value.toFixed(2);
    const [mantissa,exponent]=value.toExponential(1).split('e');
    const superscripts={'-':'⁻','+':'','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
    return mantissa+'×10'+String(Number(exponent)).split('').map(c=>superscripts[c]).join('');
  }
  const api={validate,calculate,createAnchors,summarize,samplePixel,formatIndex,spanOf,serial,calendar,weights,radiusAt,kernelAt,estimateSpan,scoreOf,importanceColor,asinhScale};
  root.BreakthroughCore=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
