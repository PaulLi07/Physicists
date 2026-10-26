const test=require('node:test');
const assert=require('node:assert/strict');
const {createScrollMap}=require('../scroll-sync.js');

test('scrolling and year scrubbing are continuous inverses',()=>{
  const map=createScrollMap([{year:-624,offset:40},{year:1500,offset:2200},{year:1800,offset:6000},{year:1900,offset:22000},{year:1974,offset:40000}],39500);
  for(let offset=0;offset<=39500;offset+=37){const year=map.yearForOffset(offset);assert.ok(Math.abs(map.offsetForYear(year)-offset)<1e-7);}
  for(let year=-624;year<=1974;year+=.17){const offset=map.offsetForYear(year);assert.ok(Math.abs(map.yearForOffset(offset)-year)<1e-7);}
});

test('same-year contributors share a year anchor without losing list scroll range',()=>{
  const map=createScrollMap([{year:1900,offset:38},{year:1931,offset:108},{year:1931,offset:178},{year:1931,offset:248},{year:1974,offset:318}],280);
  assert.equal(map.anchors.length,3);assert.equal(map.offsetForYear(1900),0);assert.equal(map.offsetForYear(1974),280);
  assert.ok(map.offsetForYear(1931.1)>map.offsetForYear(1931));
});

test('new bounds and changed row heights need no source changes',()=>{
  const map=createScrollMap([{year:-2500,offset:40},{year:1900,offset:400},{year:2055,offset:1000}],800);
  assert.equal(map.minYear,-2500);assert.equal(map.maxYear,2055);assert.equal(map.offsetForYear(2055),800);
  const expanded=createScrollMap([{year:-2500,offset:40},{year:1900,offset:520},{year:2055,offset:1120}],920);
  assert.ok(Math.abs(expanded.yearForOffset(expanded.offsetForYear(1931))-1931)<1e-7);
});

test('empty and non-scrollable results stay finite',()=>{
  const empty=createScrollMap([],0);assert.equal(empty.yearForOffset(0),0);
  const one=createScrollMap([{year:1931,offset:0}],0);assert.equal(one.yearForOffset(0),1931);assert.equal(one.offsetForYear(1931),0);
});

test('invalid geometry fails explicitly',()=>{
  assert.throws(()=>createScrollMap([{year:1900,offset:100},{year:1931,offset:80}],200));
  assert.throws(()=>createScrollMap([{year:NaN,offset:0}],0));
});
