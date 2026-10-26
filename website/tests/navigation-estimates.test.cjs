'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createEstimates}=require('../../scripts/lib/navigation-estimates.cjs');
function person(id,birth,death=null,extra={}){return {id,sortYear:birth,birth:{date:String(birth),precision:'year'},death:death===null?null:{date:String(death),precision:'year'},deathStatus:death===null?'alive':'deceased',fields:{zh:['量子物理'],en:['Quantum physics']},contributions:{zh:['研究微观体系'],en:['Studied microscopic systems']},biography:{zh:'',en:''},notes:{zh:[],en:[]},sources:{zh:[{title:'Biography',url:'https://example.org/'+id}],en:[]},...extra};}
function event(id,year,people,weight=2,extra={}){return {id,year,precision:year===null?'unknown':'year',people,weight,field:'quantum',...extra};}
const serial=y=>y<0?y+1:y;
test('every unanchored profile receives one separate estimate without mutating inputs',()=>{
  const people=[person('covered',1900,1980),person('uncovered',1910,1990)],events=[event('one',1930,['covered'])],snapshot=JSON.stringify({people,events});
  const r=createEstimates(people,events,{asOfYear:2026});assert.equal(r.records.length,1);assert.equal(r.records[0].personId,'uncovered');assert.equal(r.anchors.uncovered.eventId,null);assert.equal(r.records[0].verifiedEvent,false);assert.equal(r.coverage.fullyAnchoredPeople,2);assert.equal(JSON.stringify({people,events}),snapshot);
});
test('a shared verified discovery never creates another personal contribution',()=>{
  const people=[person('a',1900,1980),person('b',1902,1982)],events=[event('shared',1930,['a','b'],4)];
  const r=createEstimates(people,events,{asOfYear:2026});assert.equal(r.records.length,0);assert.equal(r.coverage.verifiedScoredPeople,2);
});
test('a shared undated event has one budget split over participants, not full weight per person',()=>{
  const people=['a','b','c'].map((id,i)=>person(id,1900+i,1980+i)),events=[event('shared',null,['a','b','c'],4)];
  const r=createEstimates(people,events,{asOfYear:2026}),sum=r.records.reduce((s,x)=>s+x.contributionFactor,0);assert.ok(Math.abs(sum-.75)<1e-12);assert.ok(r.records.every(x=>x.sharedBudgetId==='shared'&&x.contributionFactor<1));
});
test('estimated ranges stay within documented lifetimes and never use birth as contribution year',()=>{
  const p=person('young',1900,1914),r=createEstimates([p],[],{asOfYear:2026}).records[0];assert.ok(r.year>1900&&r.year<=1914);assert.ok(r.range[0]>1900&&r.range[1]<=1914);assert.ok(r.year>=r.range[0]&&r.year<=r.range[1]);
});
test('an unresolved death uses the last-known activity bound rather than assuming living',()=>{
  const p=person('missing',1906,null,{deathStatus:'unknown',biography:{zh:'1938年失踪，此后经历未有定论。',en:'Disappeared in 1938.'}}),r=createEstimates([p],[],{asOfYear:2026}).records[0];assert.ok(r.year<=1938);assert.ok(r.range[1]<=1938);assert.equal(r.biographicalBounds.kind,'last-known-activity');
});
test('modern profiles never receive a contribution after the data cutoff',()=>{
  const p=person('living',2000),r=createEstimates([p],[],{asOfYear:2026}).records[0];assert.ok(r.year<=2026);assert.ok(r.range[1]<=2026);
});
test('historical years cross directly from 1 BCE to 1 CE without a year zero',()=>{
  const p=person('ancient',-30,30),r=createEstimates([p],[],{asOfYear:2026}).records[0];assert.notEqual(r.year,0);assert.ok(r.range.every(y=>y!==0));assert.ok(serial(r.range[0])>serial(-30));assert.ok(serial(r.range[1])<=serial(30));
});
test('calibration learns contribution ages and can absorb new profiles without source edits',()=>{
  const people=Array.from({length:8},(_,i)=>person('known'+i,1900+i,1980+i)),events=people.map((p,i)=>event('e'+i,1930+i,[p.id],4));people.push(person('new',1910,1990));
  const r=createEstimates(people,events,{asOfYear:2026});assert.equal(r.records[0].year,1940);assert.equal(r.records[0].calibration.sampleSize,8);assert.equal(r.records[0].calibration.scope,'era-and-field');assert.ok(r.records[0].contributionFactor<=.75);
});
test('a year mentioned in a contribution is only an estimate clue, not a fabricated publication',()=>{
  const p=person('clue',1900,1980,{contributions:{zh:['1933年提出一个物理模型'],en:['Proposed a physical model in 1933']}}),r=createEstimates([p],[],{asOfYear:2026}).records[0];assert.equal(r.year,1933);assert.equal(r.yearBasis,'unverified-profile-year-clue');assert.equal(r.verifiedEvent,false);assert.ok(r.range[0]<1933&&r.range[1]>1933);assert.equal(r.evidencePeopleSource[0].url,'https://example.org/clue');
});
test('excluded philosophical claims are not republished as verified discoveries',()=>{
  const p=person('historical',-460,-370),e=event('excluded',-430,['historical'],8,{indexEligible:false}),r=createEstimates([p],[e],{asOfYear:2026});assert.equal(r.coverage.datedNavigationPeople,1);assert.equal(r.coverage.verifiedScoredPeople,0);assert.ok(r.records[0].contributionFactor<=.15);assert.deepEqual(r.records[0].excludedEventsNotRecounted,['excluded']);assert.equal(r.records[0].contributionBasis,'general-historical-context-residual');assert.equal(r.records[0].verifiedEvent,false);
});
test('duplicate people/events and nonexistent contributors are rejected',()=>{
  const p=person('a',1900,1980);assert.throws(()=>createEstimates([p,p],[]),/Duplicate/);assert.throws(()=>createEstimates([p],[event('e',1930,['a']),event('e',1931,['a'])]),/Duplicate/);assert.throws(()=>createEstimates([p],[event('e',1930,['unknown'])]),/Unknown/);
});
test('any real scored association suppresses residual scoring even when another anchor has priority',()=>{
  const p=person('a',1900,1980),events=[event('old-idea',1940,['a'],8,{indexEligible:false}),event('actual',null,['a'],1,{precision:'range',dateRange:[1930,1931]})];
  const r=createEstimates([p],events,{asOfYear:2026});assert.equal(r.records.length,0);assert.equal(r.coverage.verifiedScoredPeople,1);
});
test('estimated mass is reported separately from verified event mass',()=>{
  const people=[person('verified',1900,1980),person('residual',1910,1990)],events=[event('real',1930,['verified'],4)],r=createEstimates(people,events,{asOfYear:2026});assert.equal(r.coverage.verifiedTotalWeight,4);assert.equal(r.coverage.estimatedTotalFactor,r.records[0].contributionFactor);assert.ok(Math.abs(r.coverage.estimatedToVerifiedWeightRatio-r.records[0].contributionFactor/4)<.0001);assert.ok(r.coverage.estimatedShareOfCombinedWeight<.2);
});
test('future events cannot silently suppress estimates at the current review date',()=>{
  assert.throws(()=>createEstimates([person('a',1900,1980)],[event('future',2030,['a'])],{asOfYear:2026}),/cutoff/);
});
