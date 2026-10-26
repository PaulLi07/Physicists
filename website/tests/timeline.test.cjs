'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {createTimeline,niceStep}=require('../src/timeline.js');
const box={};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../dist/data/archive.js'),'utf8'),box);
const people=Array.from(box.PHYSICS_ARCHIVE.people);
const opts={top:24,bottom:504,minTickGap:34};

function verifyScale(model,records){
  assert.ok(model.domainMin<model.domainMax);
  assert.ok(model.segments.length>=1);
  assert.equal(model.segments[0].top,opts.top);
  assert.equal(model.segments.at(-1).bottom,opts.bottom);
  assert.equal(model.segments[0].from,model.domainMin);
  assert.equal(model.segments.at(-1).to,model.domainMax);
  for(let i=0;i<model.segments.length;i++){
    const segment=model.segments[i];
    assert.ok(segment.from<segment.to);
    assert.ok(segment.top<segment.bottom);
    if(i){assert.equal(segment.from,model.segments[i-1].to);assert.equal(segment.top,model.segments[i-1].bottom);}
  }
  for(const record of records){
    const p=model.scaleYear(record.sortYear);
    assert.ok(p>=opts.top&&p<=opts.bottom);
    assert.ok(Math.abs(model.yearAt(p)-record.sortYear)<1e-7);
  }
  let previous=-Infinity;
  for(let i=0;i<=2000;i++){
    const year=model.domainMin+(model.domainMax-model.domainMin)*i/2000;
    const pixel=model.scaleYear(year);
    assert.ok(pixel>previous);
    assert.ok(Math.abs(model.yearAt(pixel)-year)<1e-7);
    previous=pixel;
  }
  assert.equal(model.segments.reduce((sum,s)=>sum+s.count,0),records.length);
}

test('The actual archive generates continuous invertible segments for every person',()=>{
  const model=createTimeline(people,opts);
  assert.ok(people.length>0);
  assert.equal(model.minYear,Math.min(...people.map(p=>p.sortYear)));
  assert.equal(model.maxYear,Math.max(...people.map(p=>p.sortYear)));
  assert.equal(Array.from(model.yearCounts.values()).reduce((a,b)=>a+b,0),people.length);
  const expectedCounts=new Map();
  people.forEach(person=>expectedCounts.set(person.sortYear,(expectedCounts.get(person.sortYear)||0)+1));
  assert.equal(model.maxYearCount,Math.max(...expectedCounts.values()));
  verifyScale(model,people);
});

test('Earlier and future additions expand the domain without changing the model source',()=>{
  const changed=[...people,{id:'new-early',sortYear:-2500},{id:'new-future',sortYear:2055}];
  const model=createTimeline(changed,opts);
  assert.equal(model.minYear,Math.min(...people.map(p=>p.sortYear),-2500));
  assert.equal(model.maxYear,Math.max(...people.map(p=>p.sortYear),2055));
  assert.ok(model.domainMin<=-2500);assert.ok(model.domainMax>=2055);
  assert.equal(model.yearCounts.get(-2500),people.filter(p=>p.sortYear===-2500).length+1);
  assert.equal(model.yearCounts.get(2055),people.filter(p=>p.sortYear===2055).length+1);
  verifyScale(model,changed);
});

test('Calendar tick labels are unique, ordered and separated, with no historical year zero',()=>{
  for(const input of [people,[{sortYear:-2500},{sortYear:2055}],[{sortYear:-1},{sortYear:1}],[{sortYear:1}],[]]){
    const model=createTimeline(input,opts);
    assert.equal(new Set(model.ticks.map(t=>t.year)).size,model.ticks.length);
    assert.ok(model.ticks.every(t=>t.year!==0&&t.year>=model.domainMin&&t.year<=model.domainMax));
    assert.ok(model.minorTicks.every(t=>t.year!==0));
    for(let i=1;i<model.ticks.length;i++)assert.ok(model.ticks[i].y-model.ticks[i-1].y>=opts.minTickGap-1e-7);
    for(const tick of model.ticks)assert.ok(Math.abs(tick.y-model.scaleYear(tick.year))<1e-7);
  }
});

test('A single person or one shared birth year gets a finite centered scale',()=>{
  for(const input of [[{sortYear:1931}],Array.from({length:25},()=>({sortYear:1931}))]){
    const model=createTimeline(input,opts);
    assert.equal(model.segments.length,1);
    assert.ok(model.domainMin<1931&&model.domainMax>1931);
    assert.equal(model.yearCounts.get(1931),input.length);
    assert.equal(model.maxYearCount,input.length);
    verifyScale(model,input);
  }
});

test('Empty, sparse, reverse-ordered and BCE-only data remain valid',()=>{
  for(const input of [[],[{sortYear:-3000},{sortYear:-2700}],people.slice().reverse(),[{sortYear:2055},{sortYear:2054}]]){
    const model=createTimeline(input,opts);
    verifyScale(model,input);
  }
  const empty=createTimeline([],opts);
  assert.equal(empty.minYear,null);assert.equal(empty.maxYear,null);
  assert.equal(empty.maxYearCount,0);
});

test('Chart size and segment preferences adapt without mutating source records',()=>{
  const before=JSON.stringify(people);
  const model=createTimeline(people,{top:0,bottom:120,minTickGap:30,maxSegments:2});
  assert.ok(model.segments.length<=2);
  assert.equal(model.scaleYear(model.domainMin),0);
  assert.equal(model.scaleYear(model.domainMax),120);
  assert.equal(JSON.stringify(people),before);
  assert.equal(model.yearAt(-200),model.domainMin);
  assert.equal(model.yearAt(900),model.domainMax);
  assert.equal(model.scaleYear(model.domainMin-100),0);
  assert.equal(model.scaleYear(model.domainMax+100),120);
});

test('Invalid source years and impossible dimensions fail explicitly',()=>{
  assert.throws(()=>createTimeline([{sortYear:NaN}]),/Invalid birth year/);
  assert.throws(()=>createTimeline([{sortYear:Infinity}]),/Invalid birth year/);
  assert.throws(()=>createTimeline([{sortYear:1931}],{top:50,bottom:20}),/bottom/);
  assert.throws(()=>createTimeline(people,{minTickGap:0}),/minTickGap/);
  assert.throws(()=>createTimeline(people,{maxSegments:0}),/maxSegments/);
  assert.throws(()=>niceStep(0),/positive/);
});
test('exact event bounds do not imply unobserved future years',()=>{const {createTimeline}=require('../src/timeline.js');const m=createTimeline([{sortYear:-500},{sortYear:1905},{sortYear:2026}],{exactBounds:true});assert.equal(m.domainMin,-500);assert.equal(m.domainMax,2026);assert.equal(m.ticks.at(-1).year,2026);});
