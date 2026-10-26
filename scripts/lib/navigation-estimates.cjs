/*
 * Directory-only contribution-year estimates for profiles without a dated event.
 * These estimates support navigation and density only; they never enter breakthrough scores.
 * API: createEstimates(people, events, {asOfYear}) ->
 *      {records, anchors, calibration, coverage}.
 * `anchors` contains estimated anchors only; merge with verified event anchors.
 */
(function(root){
  'use strict';
  const serial=y=>y<0?y+1:y;
  const calendar=n=>n<=0?n-1:n;
  const validYear=y=>Number.isInteger(y)&&y!==0;
  const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  const rounded=v=>Math.round(v*10000)/10000;
  const version='residual-contribution-v1';
  const fieldPatterns=[
    ['history',/自然哲学|科学史|物理史|natural philosophy|history of (?:physics|science)/i],
    ['mechanics',/经典力学|流体|弹性|固体力学|天体力学|classical mechanics|fluid|elastic|continuum|celestial mechanics/i],
    ['light',/光学|光谱|电磁|电学|磁学|electromag|optic|spectroscop|magnet|electric|photonics/i],
    ['heat',/热学|热力|低温|统计|therm|statistic|cryogen|heat/i],
    ['quantum',/量子|原子|分子|quantum|atomic|molecular/i],
    ['matter',/凝聚|固体|半导体|超导|晶体|材料|condensed|solid.state|semiconductor|superconduct|crystal|material|mesoscopic/i],
    ['particle',/粒子|核物理|核科学|核反应|核结构|核力|场论|加速器|particle|nuclear|field theory|high.energy|accelerator/i],
    ['cosmos',/天体|宇宙|引力|相对论|astrophys|astronom|cosmolog|gravit|relativ/i],
    ['methods',/数学|计算|实验|仪器|计量|测量|mathemat|computation|experiment|instrument|metrolog|measurement|detector/i]
  ];
  function quantile(values,p){
    if(!values.length)return null;
    const a=values.slice().sort((x,y)=>x-y),i=(a.length-1)*p,lo=Math.floor(i),hi=Math.ceil(i);
    return a[lo]+(a[hi]-a[lo])*(i-lo);
  }
  function eraOf(year){return year<1500?'pre-1500':year<1800?'1500-1799':year<1900?'1800-1899':'1900-onwards';}
  function fieldsOf(p){
    const values=[...(p.fields?.zh||[]),...(p.fields?.en||[])];
    return fieldPatterns.filter(([,pattern])=>values.some(s=>pattern.test(s))).map(([id])=>id);
  }
  function dateYear(date){
    const match=typeof date==='string'?date.match(/^(-?\d{1,4})(?:-|$)/):null;
    return match&&validYear(Number(match[1]))?Number(match[1]):null;
  }
  function eventSpan(e){
    if(e.precision==='unknown')return null;
    if(e.dateRange&&e.dateRange.length===2&&e.dateRange.every(validYear)&&e.dateRange[0]<=e.dateRange[1])return e.dateRange;
    return validYear(e.year)?[e.year,e.year]:null;
  }
  function disappearanceYear(p){
    if(validYear(p.lastKnownYear))return p.lastKnownYear;
    if(p.deathStatus!=='unknown')return null;
    const text=[p.biography?.zh,p.biography?.en,...(p.notes?.zh||[]),...(p.notes?.en||[])].filter(Boolean).join(' ');
    const years=[];
    for(const pattern of [/(\d{4})年[^。；\n]{0,12}失踪/g,/disappeared\s+(?:in\s+)?(\d{4})/gi])for(const match of text.matchAll(pattern))years.push(Number(match[1]));
    return years.length?Math.min(...years):null;
  }
  function lifeBounds(p,asOfYear){
    const birth=validYear(p.sortYear)?p.sortYear:dateYear(p.birth?.date);
    if(!validYear(birth))throw Error('Cannot estimate a missing birth year: '+p.id);
    const b=serial(birth),asOf=serial(asOfYear),death=dateYear(p.death?.date),lastKnown=disappearanceYear(p);
    // An unknown death is never interpreted as living. The 85-year horizon is
    // an estimation bound, not an invented death date.
    const hi=Math.min(asOf,death===null?Infinity:serial(death),lastKnown===null?Infinity:serial(lastKnown),b+85);
    if(hi<=b)throw Error('No possible contribution interval after birth: '+p.id);
    const lived=hi-b,adultStart=b+Math.min(18,Math.max(1,Math.floor(lived*.5)));
    return {birth,birthSerial:b,lo:adultStart,hi,death,lastKnown,boundKind:lastKnown!==null?'last-known-activity':death!==null?'documented-death':p.deathStatus==='alive'?'as-of-and-career-horizon':'unknown-death-career-horizon'};
  }
  function contributionYearClues(p,bounds){
    const text=[...(p.contributions?.zh||[]),...(p.contributions?.en||[])].join(' '),years=[];
    for(const match of text.matchAll(/(?:公元前\s*)?\b(\d{3,4})\s*(?:年|BCE|BC|CE|AD)?/gi)){
      const full=match[0],year=/公元前|BCE|\bBC\b/i.test(full)?-Number(match[1]):Number(match[1]);
      const nearby=text.slice(Math.max(0,match.index-28),match.index+full.length+28);
      if(/诺贝尔|nobel|获奖|awarded|prize/i.test(nearby))continue;
      if(validYear(year)&&serial(year)>=bounds.lo&&serial(year)<=bounds.hi)years.push(year);
    }
    return Array.from(new Set(years)).sort((a,b)=>a-b);
  }
  function evidenceOf(p){
    const seen=new Set(),sources=[];
    for(const s of [...(p.sources?.zh||[]),...(p.sources?.en||[])])if(/^https?:\/\//.test(s.url||'')&&!seen.has(s.url)){seen.add(s.url);sources.push({title:s.title,url:s.url});}
    return sources;
  }
  function createEstimates(people,events,options={}){
    if(!Array.isArray(people)||!Array.isArray(events))throw new TypeError('Profiles and events must be arrays');
    const asOfYear=options.asOfYear??new Date().getUTCFullYear();if(!validYear(asOfYear))throw Error('Invalid estimate cutoff');
    const byPerson=new Map();for(const p of people){if(!p?.id||byPerson.has(p.id))throw Error('Duplicate or missing profile ID');byPerson.set(p.id,p);}
    const seenEvents=new Set(),dated=new Map(),scoredDated=new Map(),undated=new Map(),excluded=new Map();
    function chooseAnchor(map,id,year,e){
      const confidence=e.precision==='year'?2:e.precision==='range'?1:0,old=map.get(id);
      if(!old||confidence>old.confidence||(confidence===old.confidence&&(e.weight>old.event.weight||(e.weight===old.event.weight&&year<old.year))))map.set(id,{year,event:e,confidence});
    }
    for(const e of events){
      if(!e.id||seenEvents.has(e.id))throw Error('Duplicate or missing event ID: '+e.id);seenEvents.add(e.id);if(!Number.isFinite(e.weight)||e.weight<=0)throw Error('Invalid event weight: '+e.id);
      const span=eventSpan(e),year=span?calendar(Math.round((serial(span[0])+serial(span[1]))/2)):null;
      if(span&&span[1]>asOfYear)throw Error('Event exceeds the estimation cutoff: '+e.id);
      for(const id of new Set(e.people||[])){
        if(!byPerson.has(id))throw Error('Unknown event participant: '+id);
        if(e.indexEligible===false){if(!excluded.has(id))excluded.set(id,[]);excluded.get(id).push(e.id);}
        if(span){
          chooseAnchor(dated,id,year,e);if(e.indexEligible!==false)chooseAnchor(scoredDated,id,year,e);
        }else{if(!undated.has(id))undated.set(id,[]);undated.get(id).push(e);}
      }
    }
    const samples=[];
    for(const [id,a] of scoredDated){
      const p=byPerson.get(id),birth=validYear(p.sortYear)?p.sortYear:dateYear(p.birth?.date),age=serial(a.year)-serial(birth),death=dateYear(p.death?.date);
      if(!validYear(birth)||age<15||age>80||a.year>asOfYear||(death!==null&&a.year>death)||a.event.indexEligible===false)continue;
      samples.push({personId:id,era:eraOf(birth),fields:fieldsOf(p),age,credit:a.event.weight/Math.max(1,new Set(a.event.people).size)});
    }
    const minimum=options.minCalibrationSample??8;if(!Number.isInteger(minimum)||minimum<1)throw Error('Invalid calibration sample size');
    function calibrationFor(p){
      const era=eraOf(validYear(p.sortYear)?p.sortYear:dateYear(p.birth?.date)),fields=fieldsOf(p);
      const candidates=[['era-and-field',samples.filter(s=>s.era===era&&s.fields.some(f=>fields.includes(f)))],['era',samples.filter(s=>s.era===era)],['field',samples.filter(s=>s.fields.some(f=>fields.includes(f)))],['global',samples]];
      const selection=candidates.find(([,s])=>s.length>=minimum)||['fallback',[]],pool=selection[1];
      return {scope:selection[0],era,fields,sampleSize:pool.length,ageMedian:quantile(pool.map(s=>s.age),.5)??40,ageQ25:quantile(pool.map(s=>s.age),.25)??30,ageQ75:quantile(pool.map(s=>s.age),.75)??50,creditMedian:quantile(pool.map(s=>s.credit),.5)??2};
    }
    const records=[],anchors={};
    for(const p of people){
      if(scoredDated.has(p.id))continue;
      const bounds=lifeBounds(p,asOfYear),cal=calibrationFor(p),clues=contributionYearClues(p,bounds);
      const unknown=(undated.get(p.id)||[]).filter(e=>e.indexEligible!==false).sort((a,b)=>b.weight-a.weight||a.id.localeCompare(b.id))[0];
      const candidate=clues.length?serial(clues[Math.floor((clues.length-1)/2)]):bounds.birthSerial+Math.round(cal.ageMedian);
      const center=clamp(candidate,bounds.lo,bounds.hi);
      // Estimates remain broad intervals; a biography year clue does not turn
      // into a newly verified paper date.
      let lo=clues.length?center-5:bounds.birthSerial+Math.floor(cal.ageQ25)-5;
      let hi=clues.length?center+5:bounds.birthSerial+Math.ceil(cal.ageQ75)+5;
      lo=clamp(Math.min(lo,center-5),bounds.lo,bounds.hi);hi=clamp(Math.max(hi,center+5),lo,bounds.hi);
      const historicalOnly=excluded.has(p.id)&&!unknown;
      const totalBudget=unknown?Math.min(.75,.25*unknown.weight):historicalOnly ? .15 :clamp(.25*cal.creditMedian,.15,.75);
      const sharedBy=unknown?Math.max(1,new Set(unknown.people||[]).size):1;
      const factor=unknown?totalBudget/sharedBy:rounded(totalBudget),year=calendar(center),range=[calendar(lo),calendar(hi)];
      const record={id:'estimate-'+p.id,personId:p.id,year,range,contributionFactor:factor,estimated:true,verifiedEvent:false,method:version,calibration:cal,yearBasis:clues.length?'unverified-profile-year-clue':'calibrated-contribution-age',contributionBasis:historicalOnly?'general-historical-context-residual':'uncovered-profile-residual',biographicalYearClues:clues,biographicalBounds:{earliest:calendar(bounds.lo),latest:calendar(bounds.hi),kind:bounds.boundKind},relatedUndatedEvents:(undated.get(p.id)||[]).map(e=>e.id),excludedEventsNotRecounted:excluded.get(p.id)||[],sharedBudgetId:unknown?.id??null,sharedBudget:unknown?totalBudget:null,sharedParticipants:sharedBy,evidencePeopleSource:evidenceOf(p),evidenceRole:'Biographical inputs, not independent evidence of a dated breakthrough'};
      records.push(record);anchors[p.id]={year,eventId:null,estimateId:record.id,weight:factor,precision:'approximate',dateRange:range,estimated:true};
    }
    const estimatedTotalFactor=records.reduce((sum,r)=>sum+r.contributionFactor,0);
    const verifiedTotalWeight=events.filter(e=>eventSpan(e)&&e.indexEligible!==false).reduce((sum,e)=>sum+e.weight,0);
    return {records,anchors,calibration:{methodVersion:version,minimumSample:minimum,sampleCount:samples.length,defaultAge:40,creditFraction:.25,maxPersonalFactor:.75,historicalContextCap:.15},coverage:{totalPeople:people.length,datedNavigationPeople:dated.size,verifiedScoredPeople:scoredDated.size,estimatedPeople:records.length,fullyAnchoredPeople:new Set([...dated.keys(),...records.map(r=>r.personId)]).size,estimatedTotalFactor:rounded(estimatedTotalFactor),verifiedTotalWeight:rounded(verifiedTotalWeight),estimatedToVerifiedWeightRatio:verifiedTotalWeight?rounded(estimatedTotalFactor/verifiedTotalWeight):null,estimatedShareOfCombinedWeight:estimatedTotalFactor+verifiedTotalWeight?rounded(estimatedTotalFactor/(estimatedTotalFactor+verifiedTotalWeight)):0,representedUndatedGroups:new Set(records.map(r=>r.sharedBudgetId).filter(Boolean)).size}};
  }
  const api={createEstimates,quantile};root.PersonEstimates=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
