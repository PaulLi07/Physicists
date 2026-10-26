'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {smoothSamples,colorbarTicks}=require('../src/plot-display.js');

test('pixel smoothing spreads a narrow display peak without mutating annual inputs or metadata',()=>{
  const samples=Array.from({length:9},(_,i)=>Object.freeze({year:1900+i,value:i===4?16:0,density:i===4?2:0,uncertain:0}));
  Object.freeze(samples);
  const before=JSON.stringify(samples),result=smoothSamples(samples,{sigma:1.5});
  assert.equal(JSON.stringify(samples),before);
  assert.ok(result[4].value>0&&result[4].value<16);
  assert.ok(result[3].value>0&&result[5].value>0);
  for(let i=0;i<samples.length;i++){
    assert.notEqual(result[i],samples[i]);assert.equal(result[i].year,samples[i].year);
    assert.ok(result[i].value>=0&&result[i].value<=16);
  }
});

test('constant profiles remain exactly constant at both plot edges',()=>{
  const samples=Array.from({length:7},()=>({value:3.25,density:.125,uncertain:2}));
  const result=smoothSamples(samples,{sigma:3});
  assert.deepEqual(result,samples);
});

test('zero smoothness gives exact values in fresh objects',()=>{
  const samples=[{value:0,density:.5},{value:8,density:2}];
  const result=smoothSamples(samples,{sigma:0});
  assert.deepEqual(result,samples);assert.notEqual(result,samples);assert.notEqual(result[0],samples[0]);
  assert.equal('uncertain' in result[0],false);
});

test('marked timeline segments do not leak across a scale break',()=>{
  const samples=[0,0,0,8,8,8].map(value=>({value,density:value/4}));
  assert.deepEqual(smoothSamples(samples,{sigma:5,breaks:[3]}),samples);
  const tagged=samples.map((s,i)=>({...s,segmentId:i<3?'early':'modern'}));
  assert.deepEqual(smoothSamples(tagged,{sigma:5}),tagged);
});

test('extreme finite samples stay finite, bounded and nonnegative',()=>{
  const samples=[{value:1e308},{value:0},{value:1e308}];
  const result=smoothSamples(samples,{sigma:1e308});
  for(const p of result)assert.ok(Number.isFinite(p.value)&&p.value>=0&&p.value<=1e308);
  assert.deepEqual(smoothSamples([{value:4}],{sigma:2}),[{value:4}]);
  assert.deepEqual(smoothSamples([]),[]);
});

test('invalid display channels, smoothing values and segment boundaries fail explicitly',()=>{
  for(const sigma of [-1,NaN,Infinity])assert.throws(()=>smoothSamples([{value:1}],{sigma}));
  for(const samples of [[null],[{value:-1}],[{value:Infinity}],[{value:1,density:1},{value:2}]])assert.throws(()=>smoothSamples(samples));
  for(const breaks of [[-1],[2],[.5],'1'])assert.throws(()=>smoothSamples([{value:1}],{breaks}));
});

test('density colorbar places readable actual values at both endpoints and ROOT quarter stop',()=>{
  const ticks=colorbarTicks(8.2);
  assert.deepEqual(ticks.map(t=>t.position),[0,.25,.5,.75,1]);
  assert.equal(ticks[0].value,0);assert.equal(ticks.at(-1).value,8.2);
  assert.ok(Math.abs(ticks[1].value-2.05)<1e-12);
  assert.equal(ticks.at(-1).label,'8.2');
  assert.ok(ticks.every(t=>t.label.length<=4));
});

test('colorbar labels handle tiny or large densities without changing their linear positions',()=>{
  for(const max of [1e-7,.04,.5,1,40,1e6]){
    const ticks=colorbarTicks(max,{count:5});
    assert.equal(ticks.at(-1).value,max);
    assert.equal(new Set(ticks.map(t=>t.label)).size,ticks.length);
    for(let i=1;i<ticks.length;i++)assert.ok(ticks[i].value>ticks[i-1].value);
  }
  assert.deepEqual(colorbarTicks(0),[{position:0,value:0,label:'0'}]);
  assert.throws(()=>colorbarTicks(-1));assert.throws(()=>colorbarTicks(1,{count:1}));
});

test('integer colorbar ticks use actual integer values without rounding fractional tick labels',()=>{
  const ticks=colorbarTicks(8.3,{integers:true});
  assert.deepEqual(ticks.map(t=>t.value),[0,2,4,6,8]);
  assert.deepEqual(ticks.map(t=>t.label),['0','2','4','6','8']);
  for(const t of ticks)assert.equal(t.position,t.value/8.3);
  assert.ok(ticks.at(-1).position<1);
});
