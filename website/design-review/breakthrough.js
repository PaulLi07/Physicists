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
  // Historical overview resolution, not a confidence interval on an exact date.
  // Interpolation is continuous; the discrete triangular kernel is normalized
  // separately at each source year so broadening cannot create or erase mass.
  const bandwidthKnots=[{year:500,radius:50},{year:1500,radius:20},{year:1800,radius:5}];
  function radiusAt(year,adaptive=true){
    if(!Number.isFinite(year))throw Error('Invalid bandwidth year');
    if(!adaptive)return 5;
    if(year<=bandwidthKnots[0].year)return bandwidthKnots[0].radius;
    for(let i=1;i<bandwidthKnots.length;i++){
      const a=bandwidthKnots[i-1],b=bandwidthKnots[i];
      if(year<=b.year)return a.radius+(year-a.year)/(b.year-a.year)*(b.radius-a.radius);
    }
    return bandwidthKnots.at(-1).radius;
  }
  function kernelAt(year,adaptive=true){
    const radius=radiusAt(year,adaptive),support=Math.ceil(radius),parts=[];
    let total=0;
    for(let d=-support;d<=support;d++){
      const mass=Math.max(0,radius+1-Math.abs(d));
      if(mass>0){parts.push([d,mass]);total+=mass;}
    }
    return parts.map(([d,mass])=>[d,mass/total]);
  }
  function estimateSpan(record){
    if(!validYear(record.year))throw Error('Invalid estimated contribution year: '+record.personId);
    const span=record.range??[record.year,record.year];
    if(!Array.isArray(span)||span.length!==2||!span.every(validYear)||span[1]<span[0]||record.year<span[0]||record.year>span[1])throw Error('Invalid estimated contribution range: '+record.personId);
    return span;
  }
  function calculate(events,options={}){
    validate(events,options.personIds);
    if(options.weightMap&&Object.values(options.weightMap).some(w=>!Number.isFinite(w)||w<=0))throw Error('Invalid sensitivity weight map');
    const asOfYear=options.asOfYear??new Date().getUTCFullYear();
    if(!validYear(asOfYear))throw Error('Invalid index cutoff');
    const adaptive=options.historicalAdaptive!==false;
    const allDated=events.map(e=>({e,span:spanOf(e)})).filter(x=>x.span);
    const dated=allDated.filter(x=>x.e.indexEligible!==false);
    if(allDated.some(x=>x.span[1]>asOfYear))throw Error('Event extends beyond the review cutoff');
    const observedPeople=new Set(dated.flatMap(({e})=>e.people));
    const seenEstimates=new Set();
    if(options.estimatedContributions!==undefined&&!Array.isArray(options.estimatedContributions))throw Error('Estimated contributions must be an array');
    const estimates=(options.estimatedContributions??[]).map(record=>{
      if(!record||typeof record.personId!=='string'||!record.personId||record.estimated!==true)throw Error('Estimated contributions require an explicit person ID and estimated flag');
      if(seenEstimates.has(record.personId))throw Error('Duplicate estimated contributor: '+record.personId);
      if(observedPeople.has(record.personId))throw Error('Estimated contributor already has a dated scored event: '+record.personId);
      if(options.personIds&&!options.personIds.has(record.personId))throw Error('Unknown estimated contributor: '+record.personId);
      if(!Number.isFinite(record.contributionFactor)||record.contributionFactor<0)throw Error('Invalid estimated contribution factor: '+record.personId);
      const span=estimateSpan(record);
      if(span[1]>asOfYear)throw Error('Estimated contribution extends beyond the review cutoff');
      seenEstimates.add(record.personId);return {record,span};
    });
    const bounds=[...allDated.map(x=>x.span[0]),...estimates.map(x=>x.span[0])];
    const minYear=bounds.length?Math.min(...bounds):asOfYear;
    const start=serial(minYear)-Math.ceil(radiusAt(minYear,adaptive)),end=serial(asOfYear);
    const rawObserved=new Map(),rawEstimated=new Map(),rawUncertain=new Map();
    const observedSmooth=new Map(),estimatedSmooth=new Map(),uncertainSmooth=new Map();
    const participantSpans=allDated.map(({e,span})=>({lo:serial(span[0]),hi:serial(span[1]),people:e.people}));
    function add(map,year,value){map.set(year,(map.get(year)||0)+value);}
    function distribute(span,weight,map,uncertain){
      const lo=serial(span[0]),hi=serial(span[1]),share=weight/(hi-lo+1);
      for(let n=lo;n<=hi;n++){
        add(map,n,share);if(uncertain)add(rawUncertain,n,share);
      }
    }
    for(const {e,span} of dated){
      distribute(span,options.weightMap?.[e.weight]??e.weight,rawObserved,e.precision!=='year');
    }
    for(const {record,span} of estimates){
      distribute(span,record.contributionFactor,rawEstimated,true);
      participantSpans.push({lo:serial(span[0]),hi:serial(span[1]),people:[record.personId]});
    }
    function smooth(input,output){
      for(const [n,mass] of input){
        for(const [d,k] of kernelAt(calendar(n),adaptive))add(output,n+d,k*mass);
      }
    }
    smooth(rawObserved,observedSmooth);smooth(rawEstimated,estimatedSmooth);smooth(rawUncertain,uncertainSmooth);
    const series=[];
    for(let n=start;n<=end;n++){
      // One person's widest supported overlap is used, rather than assuming
      // independence between multiple uncertain dates. Exact dates remain a
      // conventional distinct-person count inside the fixed 11-year window.
      const personShares=new Map();
      for(const record of participantSpans){
        const overlap=Math.max(0,Math.min(n+5,record.hi)-Math.max(n-5,record.lo)+1);
        if(!overlap)continue;
        const share=overlap/(record.hi-record.lo+1);
        for(const id of record.people)personShares.set(id,Math.max(personShares.get(id)||0,share));
      }
      let people=0;for(const share of personShares.values())people+=share;
      const observed=observedSmooth.get(n)||0,estimated=estimatedSmooth.get(n)||0;
      const rawO=rawObserved.get(n)||0,rawE=rawEstimated.get(n)||0;
      series.push({year:calendar(n),raw:rawO+rawE,value:observed+estimated,
        rawObserved:rawO,rawEstimated:rawE,observed,estimated,
        uncertain:uncertainSmooth.get(n)||0,people,density:people/11,
        bandwidth:radiusAt(calendar(n),adaptive),
        provisional:n>end-Math.ceil(radiusAt(asOfYear,adaptive))});
    }
    const kernel=adaptive?{
      name:'historical-adaptive-triangular',radius:null,minRadius:5,maxRadius:50,
      knots:bandwidthKnots.map(k=>({...k})),normalization:'unit-mass-per-source-year',
      densityWindow:11,densityPopulation:'all-dated-history-and-profile-estimates',densityDeduplication:'maximum-source-overlap-per-person'
    }:{name:'centered-triangular',radius:5,denominator:36,densityWindow:11,densityPopulation:'all-dated-history-and-profile-estimates',densityDeduplication:'maximum-source-overlap-per-person'};
    const components={observedEvents:dated.length,estimatedPeople:estimates.length,observedWeight:dated.reduce((sum,{e})=>sum+(options.weightMap?.[e.weight]??e.weight),0),estimatedWeight:estimates.reduce((sum,{record})=>sum+record.contributionFactor,0)};
    return {minYear,maxYear:asOfYear,kernel,components,series};
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
  function samplePixel(series,from,to){
    if(!Number.isFinite(from)||!Number.isFinite(to)||to<from)throw Error('Invalid pixel calendar range');
    const lo=Math.ceil(from),hi=Math.floor(to);
    if(lo<=hi)return summarize(series,lo,hi);
    const middle=(from+to)/2;
    let nearest=Math.round(middle);if(nearest===0)nearest=middle<0?-1:1;
    return summarize(series,nearest,nearest);
  }
  function formatIndex(value){
    if(!Number.isFinite(value)||value<0)throw Error('Invalid index display value');
    if(value===0)return '0';
    if(value>=.01)return value.toFixed(2);
    const [mantissa,exponent]=value.toExponential(1).split('e');
    const superscripts={'-':'⁻','+':'','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
    return mantissa+'×10'+String(Number(exponent)).split('').map(c=>superscripts[c]).join('');
  }
  const api={validate,calculate,createAnchors,summarize,samplePixel,formatIndex,spanOf,serial,calendar,weights,radiusAt,kernelAt,estimateSpan};
  root.BreakthroughCore=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
