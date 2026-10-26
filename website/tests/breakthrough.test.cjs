'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const core=require('../src/breakthrough.js');
function event(id,year,weight=2,extra={}){return {id,year,weight,precision:'year',type:'discovery',title:{zh:id,en:id},rationale:{zh:'独立事件',en:'Independent event'},dateNote:{zh:'',en:''},people:['p'],sources:[{title:'Evidence',url:'https://example.org/evidence'}],...extra};}
const point=(year)=>({basis:'documented',kind:'point',start:year,end:year});
const at=(r,y)=>r.series.find(p=>p.year===y);
const sum=(r,key='value')=>r.series.reduce((total,p)=>total+p[key],0);
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);

test('exact ancient and modern events keep their full budget in their actual year',()=>{
  for(const year of [-300,1000,1687,1964,2012]){
    const r=core.calculate([event('a',year,16,{score:16,dateModel:point(year)})],{asOfYear:2026});
    close(at(r,year).value,16);close(at(r,year+1).value,0);close(sum(r),16);
    assert.equal(r.minYear,year);assert.ok(r.series.every(p=>p.raw===p.value));
  }
});
test('mechanism and experimental discovery are independent dated events, not a person or award year',()=>{
  const r=core.calculate([event('mechanism',1964,8,{dateModel:point(1964)}),event('discovery',2012,8,{dateModel:point(2012)})],{asOfYear:2026});
  close(at(r,1964).value,8);close(at(r,2012).value,8);close(at(r,2013).value,0);close(sum(r),16);
});
test('adding a distinct result or raising importance never lowers any annual value',()=>{
  const base=[event('a',1940),event('b',1950)],a=core.calculate(base,{asOfYear:1970}),b=core.calculate([...base,event('c',1950,4)],{asOfYear:1970}),c=core.calculate([event('a',1940),event('b',1950,8)],{asOfYear:1970});
  a.series.forEach((p,i)=>{assert.ok(b.series[i].value>=p.value);assert.ok(c.series[i].value>=p.value);});
});
test('coauthors change participant density, never the event budget',()=>{
  const a=core.calculate([event('a',1950)],{asOfYear:1960}),b=core.calculate([event('a',1950,2,{people:['p','q','r']})],{asOfYear:1960});
  close(at(a,1950).value,at(b,1950).value);assert.equal(at(b,1950).people,3);close(at(b,1950).density,3/11);
});
test('one person appearing in several events is counted once per density window',()=>{
  const r=core.calculate([event('a',1950),event('b',1951)],{asOfYear:1960});assert.equal(at(r,1950).people,1);close(at(r,1950).raw,2);
});
test('uncertain intervals split one importance budget and preserve explicit dating uncertainty',()=>{
  const r=core.calculate([event('range',1940,4,{dateModel:{kind:'uncertain-range',start:1940,end:1943}})],{asOfYear:1960});
  close(sum(r),4);close(sum(r,'uncertain'),4);for(let y=1940;y<=1943;y++)close(at(r,y).raw,1);
});
test('sustained work has one budget across researched phases, including gaps',()=>{
  const e=event('observations',1601,16,{dateModel:{kind:'sustained',start:1576,end:1601,allocations:[{start:1576,end:1585,fraction:.25},{start:1592,end:1601,fraction:.75}]}});
  const r=core.calculate([e],{asOfYear:1602});close(sum(r),16);close(at(r,1576).value,.4);close(at(r,1592).value,1.2);close(at(r,1586).value,0);close(at(r,1602).value,0);close(sum(r,'uncertain'),0);
});
test('sustained work without phase evidence distributes a single budget across its interval',()=>{
  const r=core.calculate([event('sustained',1600,8,{dateModel:{kind:'sustained',start:1597,end:1600}})],{asOfYear:1601});close(sum(r),8);for(let y=1597;y<=1600;y++)close(at(r,y).value,2);
});
test('legacy date intervals remain supported without multiplying importance',()=>{
  const r=core.calculate([event('range',null,4,{precision:'range',dateRange:[1940,1943]})],{asOfYear:1960});close(sum(r),4);for(let y=1940;y<=1943;y++)close(at(r,y).raw,1);
});
test('dateModel overrides obsolete legacy date fields and does not mutate source evidence',()=>{
  const e=event('a',2013,8,{dateModel:point(2012)}),before=JSON.stringify(e),r=core.calculate([e],{asOfYear:2026});
  assert.deepEqual(core.spanOf(e),[2012,2012]);close(at(r,2012).value,8);close(at(r,2013).value,0);assert.equal(JSON.stringify(e),before);
});
test('BCE and CE remain adjacent without a historical year zero',()=>{
  const r=core.calculate([event('range',null,4,{dateModel:{kind:'uncertain-range',start:-2,end:2}})],{asOfYear:3});
  assert.deepEqual(r.series.map(p=>p.year),[-2,-1,1,2,3]);close(sum(r),4);for(const y of [-2,-1,1,2])close(at(r,y).value,1);
});
test('BCE/CE sustained phases use inclusive historical years and preserve one total budget',()=>{
  const r=core.calculate([event('phases',1,8,{dateModel:{kind:'sustained',start:-2,end:2,allocations:[{start:-2,end:-1,fraction:.25},{start:1,end:2,fraction:.75}]}})],{asOfYear:3});
  close(sum(r),8);close(at(r,-1).value,1);close(at(r,1).value,3);assert.ok(!r.series.some(p=>p.year===0));
});
test('undated events remain catalogued but receive no invented completion year',()=>{
  const r=core.calculate([event('dated',1950),event('unknown',null,8,{precision:'unknown'})],{asOfYear:1960});close(sum(r),2);assert.equal(core.createAnchors([event('unknown',null,8,{precision:'unknown'})]).p,undefined);
});
test('editorially assessed real contributions use the same ledger, with independent provenance',()=>{
  const r=core.calculate([event('paper',1950,4),event('historical-work',1000,8,{assessment:{basis:'editorial-estimate'},dateModel:point(1000),people:['q']})],{asOfYear:2026});
  close(sum(r,'rawObserved'),4);close(sum(r,'rawEstimated'),8);close(sum(r,'estimated'),8);close(at(r,1000).value,8);
  assert.equal(r.components.observedEvents,1);assert.equal(r.components.estimatedEvents,1);assert.equal(r.components.estimatedPeople,1);
  for(const p of r.series){close(p.value,p.observed+p.estimated);close(p.raw,p.rawObserved+p.rawEstimated);}
});
test('assessmentBasis legacy alias is recognized for editorial source estimates',()=>{
  const r=core.calculate([event('estimate',1600,4,{assessmentBasis:'editorial-estimate'})],{asOfYear:1601});close(sum(r,'rawEstimated'),4);close(sum(r,'rawObserved'),0);
});
test('personal residual factors cannot silently enter the v3 index',()=>{
  assert.throws(()=>core.calculate([],{estimatedContributions:[{personId:'p',year:1950,range:[1940,1960],contributionFactor:.5,estimated:true}]}),/Personal residual/);
  assert.doesNotThrow(()=>core.calculate([],{asOfYear:2026,estimatedContributions:[]}));
});
test('navigation estimates affect only density and coverage, even if a legacy factor is present',()=>{
  const r=core.calculate([],{asOfYear:2000,navigationEstimates:[{personId:'q',year:1950,range:[1940,1960],contributionFactor:10000,estimated:true}]});
  close(sum(r),0);close(sum(r,'rawEstimated'),0);close(at(r,1950).people,11/21);close(at(r,1950).density,1/21);assert.equal(r.minYear,1940);
});
test('navigation and dated-source overlap deduplicates per person',()=>{
  const r=core.calculate([event('a',1950)],{asOfYear:1960,navigationEstimates:[{personId:'p',year:1950,range:[1940,1960]}]});close(at(r,1950).people,1);close(sum(r),2);
});
test('sustained contributor density follows phase budgets and leaves long work gaps empty',()=>{
  const e=event('phased-data',1601,16,{dateModel:{kind:'sustained',start:1576,end:1601,allocations:[{start:1576,end:1580,fraction:.25},{start:1597,end:1601,fraction:.75}]}});
  const r=core.calculate([e],{asOfYear:1605});close(at(r,1578).people,.25);close(at(r,1599).people,.75);close(at(r,1588).people,0);
  const withSecond=core.calculate([e,event('another-result',1599,2)],{asOfYear:1605});close(at(withSecond,1599).people,1);
});
test('source overlap takes a maximum rather than assuming independent event dates',()=>{
  const events=[event('a',null,2,{precision:'range',dateRange:[1940,1960]}),event('b',null,2,{precision:'range',dateRange:[1945,1965]})];
  const r=core.calculate(events,{asOfYear:2000});close(at(r,1950).people,11/21);
  const exact=core.calculate([...events,event('c',1950)],{asOfYear:2000});close(at(exact,1950).people,1);
});
test('excluded historical records define coverage and density with no contribution score',()=>{
  const r=core.calculate([event('idea',-450,8,{indexEligible:false}),event('physics',1950,2)],{asOfYear:1960});
  assert.equal(r.minYear,-450);close(at(r,-450).raw,0);close(at(r,-450).value,0);close(at(r,-450).people,1);close(sum(r),2);
});
test('new earlier or later records extend dates and anchors without source-code changes',()=>{
  const a=core.calculate([event('a',100)],{asOfYear:2026}),b=core.calculate([event('a',100),event('earlier',-400),event('later',2025,4,{people:['new']})],{asOfYear:2026});
  assert.equal(a.minYear,100);assert.equal(b.minYear,-400);assert.equal(core.createAnchors([event('later',2025,4,{people:['new']})]).new.year,2025);
});
test('anchor selection favors exact dating, then score, then earlier completion',()=>{
  const events=[event('approximate',1500,16,{precision:'approximate'}),event('major',1600,8),event('later',1605,8),event('lesser',1550,4)];
  assert.equal(core.createAnchors(events).p.eventId,'major');assert.equal(core.createAnchors(events).p.year,1600);
  const uncertain=event('uncertain',1900,16,{dateModel:{kind:'uncertain-range',start:1890,end:1910},sourceEstimate:true});
  assert.equal(core.createAnchors([uncertain]).p.estimated,true);assert.equal(core.createAnchors([uncertain]).p.year,1900);
  assert.equal(core.createAnchors([event('editorial',1000,8,{assessment:{basis:'editorial-estimate'}})]).p.estimated,true);
});
test('score supports the fixed five grades, mirrors weight, and allows score-only records',()=>{
  for(const score of [1,2,4,8,16])assert.equal(core.scoreOf({id:'a',score,weight:score}),score);
  const e=event('score-only',1950,undefined,{score:16});delete e.weight;close(at(core.calculate([e],{asOfYear:1951}),1950).value,16);
  assert.throws(()=>core.scoreOf({id:'a',score:8,weight:4}),/agree/);assert.throws(()=>core.scoreOf({id:'a',weight:3}),/importance/);assert.throws(()=>core.scoreOf({id:'a',score:null,weight:2}),/importance/);
});
test('an approximate historical point stays approximate after dateModel migration',()=>{
  const e=event('early-euclid-optics',-300,8,{precision:'approximate',dateModel:{kind:'point',basis:'source-approximation',start:-300,end:-300}});
  const a=core.createAnchors([e]).p;assert.equal(a.year,-300);assert.equal(a.precision,'approximate');
  close(at(core.calculate([e],{asOfYear:1}),-300).uncertain,8);
  assert.equal(core.createAnchors([e,event('dated-lower-score',-250,2)]).p.eventId,'dated-lower-score');
  const uncertain=event('one-year-estimate',-300,8,{precision:'approximate',dateModel:{kind:'uncertain-range',start:-300,end:-300},sourceEstimate:true});
  assert.equal(core.createAnchors([uncertain]).p.precision,'approximate');assert.equal(core.createAnchors([uncertain]).p.estimated,true);
});
test('sensitivity remaps score budgets without changing source grades or chronology',()=>{
  const e=event('a',1950,16,{score:16}),r=core.calculate([e],{asOfYear:1960,weightMap:{16:10}});close(at(r,1950).raw,10);assert.equal(e.score,16);assert.equal(e.weight,16);
  assert.throws(()=>core.calculate([e],{asOfYear:1960,weightMap:{16:0}}),/sensitivity/);
});
test('duplicate IDs, participants, invalid importance and future completion are rejected',()=>{
  assert.throws(()=>core.calculate([event('same',1950),event('same',1951)]),/Duplicate/);
  assert.throws(()=>core.calculate([event('a',1950)],{personIds:new Set(['q'])}),/Unknown participant/);
  assert.throws(()=>core.calculate([event('future',2027)],{asOfYear:2026}),/cutoff/);
  assert.throws(()=>core.validate([event('future',2027)],undefined,{asOfYear:2026}),/cutoff/);
  assert.throws(()=>core.calculate([event('invalid',1950,3)]),/importance/);
});
test('invalid point dates, future periods, zero years and unbalanced allocations are rejected',()=>{
  const check=(dateModel,pattern)=>assert.throws(()=>core.calculate([event('bad',1950,8,{dateModel})],{asOfYear:2026}),pattern);
  check({kind:'point',start:1950,end:1951},/one year/);
  check({kind:'point',start:0,end:0},/date range/);
  check({kind:'uncertain-range',start:2020,end:2027},/cutoff/);
  check({kind:'sustained',start:1900,end:1910,allocations:[{start:1900,end:1905,fraction:.5}]},/sum to one/);
  check({kind:'sustained',start:1900,end:1910,allocations:[{start:1900,end:1905,fraction:.5},{start:1905,end:1910,fraction:.5}]},/Overlapping/);
  check({kind:'sustained',start:1900,end:1910,allocations:[{start:1899,end:1910,fraction:1}]},/outside/);
  check({kind:'uncertain-range',start:1900,end:1910,allocations:[{start:1900,end:1910,fraction:1}]},/Invalid sustained/);
});
test('navigation estimates validate identity, range and cutoff without requiring a score',()=>{
  const n={personId:'q',year:1950,range:[1940,1960]};
  assert.throws(()=>core.calculate([],{asOfYear:2000,navigationEstimates:[n,n]}),/Duplicate navigation/);
  assert.throws(()=>core.calculate([],{asOfYear:2000,navigationEstimates:[{...n,year:2001,range:[2001,2001]}]}),/cutoff/);
  assert.throws(()=>core.calculate([],{navigationEstimates:[n],personIds:new Set(['p'])}),/Unknown navigation/);
  assert.throws(()=>core.calculate([],{navigationEstimates:[{...n,range:[1960,1970]}]}),/range/);
});
test('an empty ledger has one explicit zero year and no provisional kernel tails',()=>{
  const r=core.calculate([],{asOfYear:2026});assert.deepEqual(r.series.map(p=>p.year),[2026]);close(sum(r),0);assert.equal(r.series[0].provisional,false);assert.equal(r.kernel.name,'annual-event-ledger');assert.deepEqual(core.kernelAt(500),[[0,1]]);assert.equal(core.radiusAt(500),5);
});
test('compressed display averages annual data without inflating the total by bin width',()=>{
  assert.deepEqual(core.summarize([{year:1,value:2,density:1,uncertain:0},{year:2,value:4,density:3,uncertain:2}],1,2),{value:3,density:2,uncertain:1});
});
test('sub-year screen pixels sample the nearest year without shifting event dates',()=>{
  const s=[{year:1926,value:4,density:2,uncertain:0},{year:1927,value:8,density:4,uncertain:0}];assert.equal(core.samplePixel(s,1926.1,1926.3).value,4);assert.equal(core.samplePixel(s,1925.9,1927.1).value,6);
});
test('pixel overlap is weighted without duplicating full years at shared integer boundaries',()=>{
  const s=[{year:10,value:0,density:0,uncertain:0},{year:11,value:8,density:4,uncertain:0},{year:12,value:0,density:0,uncertain:0}];
  close(core.samplePixel(s,10,11).value,4);close(core.samplePixel(s,11,12).value,4);
  close(core.samplePixel(s,10.5,11.5).value,8);close(core.samplePixel(s,9.5,12.5).value*3,8);
  close(core.samplePixel(s,9.5,10.5).value+core.samplePixel(s,10.5,11.5).value+core.samplePixel(s,11.5,12.5).value,8);
});
test('pixel sampling across BCE/CE has no zero cell and combines adjacent historical years',()=>{
  const s=[{year:-1,value:4,density:2,uncertain:0},{year:1,value:8,density:4,uncertain:0}];
  close(core.samplePixel(s,-1,1).value,6);close(core.samplePixel(s,-.2,.2).value,6);close(core.samplePixel(s,0,0).value,8);
});
test('importance text colors depend only on fixed event grade, never annual density or totals',()=>{
  assert.deepEqual([1,2,4,8,16].map(core.importanceColor),['#414146','#704047','#a63843','#c72b3b','#df2434']);assert.throws(()=>core.importanceColor(0),/color/);
});
test('asinh display transform is monotone, zero anchored, bounded, and preserves source values',()=>{
  const values=[0,.01,.1,1,4,16],mapped=values.map(v=>core.asinhScale(v,16,100));
  close(mapped[0],0);close(mapped.at(-1),100);for(let i=1;i<mapped.length;i++)assert.ok(mapped[i]>mapped[i-1]);
  assert.ok(core.asinhScale(.1,16,100)>.1/16*100);close(core.asinhScale(50,16,100),100);close(core.asinhScale(0,0,100),0);assert.deepEqual(values,[0,.01,.1,1,4,16]);assert.throws(()=>core.asinhScale(1,16,100,0),/scale/);
});
test('small positive historical contributions remain distinct from a true zero in formatting',()=>{
  assert.equal(core.formatIndex(0),'0');assert.equal(core.formatIndex(.003913),'3.9×10⁻³');assert.equal(core.formatIndex(1.25),'1.25');
});
