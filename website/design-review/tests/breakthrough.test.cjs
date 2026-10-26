'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const core=require('../breakthrough.js');
function event(id,year,weight=2,extra={}){return {id,year,weight,precision:'year',type:'discovery',title:{zh:id,en:id},rationale:{zh:'独立事件',en:'Independent event'},dateNote:{zh:'',en:''},people:['p'],sources:[{title:'Evidence',url:'https://example.org/evidence'}],...extra};}
const at=(r,y)=>r.series.find(p=>p.year===y);
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);
test('a single event conserves its full weight under the fixed kernel',()=>{const r=core.calculate([event('a',1950,8)],{asOfYear:1960});close(at(r,1950).raw,8);close(at(r,1950).value,8*6/36);const isolated=r.series.filter(p=>p.year>=1945&&p.year<=1955);close(isolated.reduce((a,p)=>a+p.value,0),8);});
test('adding a distinct result or raising importance never lowers any annual value',()=>{const base=[event('a',1940),event('b',1950)],a=core.calculate(base,{asOfYear:1970}),b=core.calculate([...base,event('c',1950,4)],{asOfYear:1970}),c=core.calculate([event('a',1940),event('b',1950,8)],{asOfYear:1970});a.series.forEach((p,i)=>{assert.ok(b.series[i].value>=p.value);assert.ok(c.series[i].value>=p.value);});});
test('coauthors change participant density, never the breakthrough value',()=>{const a=core.calculate([event('a',1950)],{asOfYear:1960}),b=core.calculate([event('a',1950,2,{people:['p','q','r']})],{asOfYear:1960});close(at(a,1950).value,at(b,1950).value);assert.equal(at(b,1950).people,3);close(at(b,1950).density,3/11);});
test('one person appearing in several events is counted once per density window',()=>{const r=core.calculate([event('a',1950),event('b',1951)],{asOfYear:1960});assert.equal(at(r,1950).people,1);close(at(r,1950).raw,2);});
test('source date intervals distribute rather than multiply importance',()=>{const r=core.calculate([event('range',null,4,{precision:'range',dateRange:[1940,1943]})],{asOfYear:1960});close(r.series.reduce((a,p)=>a+p.raw,0),4);for(let y=1940;y<=1943;y++)close(at(r,y).raw,1);});
test('BCE and CE remain adjacent without a fabricated historical year zero',()=>{const r=core.calculate([event('range',null,4,{precision:'range',dateRange:[-2,2]})],{asOfYear:3});assert.deepEqual(r.series.filter(p=>p.year>=-2).map(p=>p.year),[-2,-1,1,2,3]);close(r.series.reduce((a,p)=>a+p.raw,0),4);});
test('undated events stay in the catalog but do not acquire a made-up year',()=>{const r=core.calculate([event('dated',1950),event('unknown',null,8,{precision:'unknown'})],{asOfYear:1960});close(r.series.reduce((a,p)=>a+p.raw,0),2);assert.equal(core.createAnchors([event('unknown',null,8,{precision:'unknown'})]).p,undefined);});
test('compressed display uses a mean density, not a time-bin sum',()=>{assert.deepEqual(core.summarize([{year:1,value:2,density:1,uncertain:0},{year:2,value:4,density:3,uncertain:2}],1,2),{value:3,density:2,uncertain:1});});
test('new earlier/later data automatically extends dates and creates contribution anchors',()=>{const a=core.calculate([event('a',100)],{asOfYear:2026});const b=core.calculate([event('a',100),event('earlier',-400),event('later',2025,4,{people:['new']})],{asOfYear:2026});assert.equal(a.minYear,100);assert.equal(b.minYear,-400);assert.equal(core.createAnchors([event('later',2025,4,{people:['new']})]).new.year,2025);});
test('duplicate IDs, fake participants and future dates are rejected',()=>{assert.throws(()=>core.calculate([event('same',1950),event('same',1951)]),/Duplicate/);assert.throws(()=>core.calculate([event('a',1950)],{personIds:new Set(['q'])}),/Unknown participant/);assert.throws(()=>core.calculate([event('future',2027)],{asOfYear:2026}),/cutoff/);});
test('historical ideas explicitly excluded from the index cannot inflate the density',()=>{const r=core.calculate([event('idea',-400,8,{indexEligible:false}),event('test',1950,2)],{asOfYear:1960});close(r.series.reduce((a,p)=>a+p.raw,0),2);assert.equal(core.createAnchors([event('idea',-400,8,{indexEligible:false})]).p.year,-400);});
test('sensitivity weights do not mutate or relax the source grading scheme',()=>{const e=event('a',1950,8),a=core.calculate([e],{asOfYear:1960,weightMap:{8:4}});close(at(a,1950).raw,4);assert.equal(e.weight,8);assert.throws(()=>core.calculate([event('invalid',1950,3)]),/Invalid importance/);});
test('excluded historical records still define annual coverage, with an explicit zero score',()=>{const r=core.calculate([event('idea',-450,8,{indexEligible:false}),event('physics',1950,2)],{asOfYear:1960});assert.equal(r.minYear,-450);close(at(r,-450).raw,0);close(at(r,-450).value,0);});

const estimate=(personId,year,contributionFactor,range=[year,year])=>({personId,year,contributionFactor,range,estimated:true});
test('early overview uses a wider continuous bandwidth without relocating exact raw dates',()=>{
  const r=core.calculate([event('early',1000,8)],{asOfYear:2026});
  const legacy=core.calculate([event('early',1000,8)],{asOfYear:2026,historicalAdaptive:false});
  close(at(r,1000).raw,8);close(at(r,1001).raw,0);
  assert.ok(at(r,980).value>0);close(at(legacy,980)?.value??0,0);
  assert.ok(at(r,1000).value<at(legacy,1000).value);
  close(r.series.reduce((sum,p)=>sum+p.value,0),8);
  close(core.radiusAt(500),50);close(core.radiusAt(1500),20);close(core.radiusAt(1800),5);
  assert.ok(Math.abs(core.radiusAt(1499.999)-core.radiusAt(1500.001))<0.001);
});
test('adaptive interval kernels conserve importance across BCE and CE',()=>{
  const r=core.calculate([event('ancient',null,4,{precision:'range',dateRange:[-2,2]})],{asOfYear:200});
  assert.ok(!r.series.some(p=>p.year===0));
  close(r.series.reduce((sum,p)=>sum+p.raw,0),4);
  close(r.series.reduce((sum,p)=>sum+p.value,0),4);
});
test('a new early result cannot lower the density at any existing calendar year',()=>{
  const a=core.calculate([event('a',1000,4)],{asOfYear:2026});
  const b=core.calculate([event('earlier',500,8),event('a',1000,4)],{asOfYear:2026});
  const m=new Map(b.series.map(p=>[p.year,p.value]));
  for(const p of a.series)assert.ok(m.get(p.year)>=p.value-1e-12);
});
test('estimated contribution is independent, mass-conserving and does not become a source event',()=>{
  const events=[event('observed',1950,4)],input=estimate('q',1960,0.6,[1955,1965]);
  const r=core.calculate(events,{asOfYear:1980,estimatedContributions:[input],personIds:new Set(['p','q'])});
  close(r.series.reduce((sum,p)=>sum+p.rawObserved,0),4);
  close(r.series.reduce((sum,p)=>sum+p.rawEstimated,0),0.6);
  close(r.series.reduce((sum,p)=>sum+p.estimated,0),0.6);
  for(const p of r.series){close(p.value,p.observed+p.estimated);close(p.raw,p.rawObserved+p.rawEstimated);}
  assert.equal(events.length,1);assert.equal(input.contributionFactor,0.6);
});
test('raising an estimated factor cannot decrease any annual index',()=>{
  const opts={asOfYear:2026,estimatedContributions:[estimate('q',1000,0.3,[980,1020])]};
  const a=core.calculate([],opts),b=core.calculate([],{...opts,estimatedContributions:[estimate('q',1000,0.8,[980,1020])]});
  for(let i=0;i<a.series.length;i++)assert.ok(b.series[i].value>=a.series[i].value-1e-12);
});
test('wide date ranges contribute a window fraction, not a person every year',()=>{
  const r=core.calculate([],{asOfYear:2000,estimatedContributions:[estimate('q',1950,0.5,[1940,1960])]});
  close(at(r,1950).people,11/21);close(at(r,1950).density,1/21);
  close(at(r,1930)?.people??0,0);
});
test('source overlap de-duplicates conservatively without assuming independent event dates',()=>{
  const events=[event('a',null,2,{precision:'range',dateRange:[1940,1960]}),event('b',null,2,{precision:'range',dateRange:[1945,1965]})];
  const r=core.calculate(events,{asOfYear:2000});close(at(r,1950).people,11/21);
  const exact=core.calculate([...events,event('c',1950)],{asOfYear:2000});close(at(exact,1950).people,1);
});
test('dated historical people remain in the color density even when a claim is not scored',()=>{
  const r=core.calculate([event('idea',1950,8,{indexEligible:false})],{asOfYear:1960});
  close(at(r,1950).value,0);close(at(r,1950).people,1);close(at(r,1950).density,1/11);
});
test('duplicate, overlapping, future and invalid estimated contributors are rejected',()=>{
  assert.throws(()=>core.calculate([],{asOfYear:2000,estimatedContributions:[estimate('q',1950,0.5),estimate('q',1960,0.5)]}),/Duplicate estimated/);
  assert.throws(()=>core.calculate([event('a',1950)],{asOfYear:2000,estimatedContributions:[estimate('p',1950,0.5)]}),/already has a dated scored/);
  assert.throws(()=>core.calculate([],{asOfYear:2000,estimatedContributions:[estimate('q',2001,0.5)]}),/cutoff/);
  assert.throws(()=>core.calculate([],{estimatedContributions:[estimate('q',1950,-0.5)]}),/factor/);
  assert.throws(()=>core.calculate([],{estimatedContributions:[estimate('q',1950,0.5)],personIds:new Set(['p'])}),/Unknown estimated/);
  assert.throws(()=>core.calculate([],{estimatedContributions:[estimate('q',1950,0.5,[1960,1970])]}),/range/);
});
test('sub-year screen pixels use the nearest calendar sample rather than shifting a year early',()=>{const s=[{year:1926,value:4,density:2,uncertain:0},{year:1927,value:8,density:4,uncertain:0}];assert.equal(core.samplePixel(s,1926.1,1926.3).value,4);assert.equal(core.samplePixel(s,1925.9,1927.1).value,6);});
test('small positive historical densities remain distinguishable from a true zero',()=>{assert.equal(core.formatIndex(0),'0');assert.equal(core.formatIndex(.003913),'3.9×10⁻³');assert.equal(core.formatIndex(1.25),'1.25');});
