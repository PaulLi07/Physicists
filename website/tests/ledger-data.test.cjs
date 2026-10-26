'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const core=require('../src/breakthrough.js');
const root=path.resolve(__dirname,'../..');
const ctx={};
vm.runInNewContext(fs.readFileSync(path.join(root,'website/dist/data/archive.js'),'utf8'),ctx);
vm.runInNewContext(fs.readFileSync(path.join(root,'website/dist/data/breakthrough-data.js'),'utf8'),ctx);
const data=JSON.parse(JSON.stringify(ctx.BREAKTHROUGH_ARCHIVE));
const people=JSON.parse(JSON.stringify(ctx.PHYSICS_ARCHIVE.people));
const byId=new Map(data.events.map(e=>[e.id,e]));
const eligible=data.events.filter(e=>e.indexEligible!==false&&core.spanOf(e));

test('the shipped corpus uses v3 assessments and has one complete navigation entry per profile',()=>{
  assert.equal(data.methodVersion,'3.0');
  assert.equal(data.counts.navigablePeople,people.length);
  assert.equal(Object.keys(data.anchors).length,people.length);
  assert.equal(data.estimatedContributions.length,0);
  for(const p of people)assert.ok(Number.isInteger(data.anchors[p.id].year)&&data.anchors[p.id].year!==0,p.id);
  for(const e of data.events){assert.equal(e.assessment.version,'3.0',e.id);assert.ok(e.eventFamilyId,e.id);assert.equal(e.score,e.weight,e.id);}
});

test('all yearly values conserve the shipped scored-event budgets without historical smoothing',()=>{
  const budget=eligible.reduce((s,e)=>s+e.score,0),total=data.series.reduce((s,p)=>s+p.value,0);
  assert.ok(Math.abs(total-budget)<1e-8,{total,budget});
  for(const p of data.series){
    assert.equal(p.raw,p.value);assert.equal(p.bandwidth,0);assert.notEqual(p.year,0);
    assert.ok(Math.abs(p.observed+p.estimated-p.value)<1e-12);
  }
  assert.equal(data.kernel.name,'annual-event-ledger');
});

test('Higgs theory and discovery remain independently dated, with no award-year transfer',()=>{
  const theory=byId.get('higgs-mechanism'),discovery=byId.get('higgs-boson-discovery');
  assert.deepEqual(core.spanOf(theory),[1964,1964]);assert.deepEqual(core.spanOf(discovery),[2012,2012]);
  assert.notEqual(theory.eventFamilyId,discovery.eventFamilyId);
  assert.equal(theory.score,8);assert.equal(discovery.score,8);
  const result=core.calculate([theory,discovery],{asOfYear:2026});
  assert.deepEqual(result.series.filter(p=>p.value).map(p=>[p.year,p.value]),[[1964,8],[2012,8]]);
});

test('historical anchor assessments retain Tycho, Kepler and Newton as distinct scientific contributions',()=>{
  const brahe=byId.get('historical-brahe-planetary-observation-dataset');
  assert.equal(brahe.score,8);assert.equal(brahe.dateModel.kind,'sustained');
  assert.deepEqual(core.spanOf(brahe),[1576,1597]);
  const result=core.calculate([brahe],{asOfYear:1600});
  assert.ok(Math.abs(result.series.reduce((s,p)=>s+p.value,0)-8)<1e-10);
  assert.equal(result.series.find(p=>p.year===1598).value,0);
  assert.equal(byId.get('early-kepler-planetary-laws').score,8);
  assert.deepEqual(core.spanOf(byId.get('early-kepler-third-law')),[1618,1618]);
  assert.equal(byId.get('early-kepler-third-law').timelineDates.published,1619);
  assert.equal(byId.get('early-newton-principia').score,16);
  const copernicus=byId.get('early-copernicus-revolutions');
  assert.deepEqual(core.spanOf(copernicus),[1502,1514]);
  assert.equal(copernicus.timelineDates.published,1543);
  assert.equal(copernicus.score,8);
});

test('every original event has an explicit assessment rather than inheriting an unreviewed weight',()=>{
  const names=['events-early.json','events-1801-1929.json','events-1930-present.json','events-journal-milestones.json'];
  const source=names.flatMap(n=>JSON.parse(fs.readFileSync(path.join(root,'data/breakthrough',n),'utf8')));
  const patches=JSON.parse(fs.readFileSync(path.join(root,'data/breakthrough/event-assessments.json'),'utf8'));
  const assessed=new Set(patches.map(p=>p.eventId));
  assert.equal(assessed.size,source.length);
  for(const e of source){assert.ok(assessed.has(e.id),e.id);assert.ok(byId.get(e.id).sourceDate,e.id);}
});

test('retired source events never coexist with a replacement scoring budget',()=>{
  for(const e of data.events)for(const id of e.supersedes||[]){
    if(!byId.has(id))continue;
    assert.equal(byId.get(id).indexEligible,false,id);
    assert.equal(byId.get(id).supersededBy,e.id,id);
  }
  const personIds=new Set(people.map(p=>p.id));
  assert.equal(core.validate(data.events,personIds,{asOfYear:Number(data.asOf.slice(0,4))}),true);
});

test('every retired personal estimate is traced to a named contribution or an explicitly represented school',()=>{
  const coverage=JSON.parse(fs.readFileSync(path.join(root,'data/breakthrough/editorial-coverage.json'),'utf8'));
  assert.equal(coverage.coverage.length,coverage.legacyEstimatedPeople);
  assert.equal(new Set(coverage.coverage.map(c=>c.personId)).size,coverage.legacyEstimatedPeople);
  for(const row of coverage.coverage){
    assert.ok(row.eventIds.length,row.personId);
    for(const id of row.eventIds){
      const e=byId.get(id);assert.ok(e,id);
      assert.ok(e.people.includes(row.personId)||(e.representedBy||[]).includes(row.personId),row.personId);
    }
  }
  const mohist=byId.get('early-mohist-optics');
  assert.equal(mohist.people.includes('mozi'),false);
  assert.ok(mohist.representedBy.includes('mozi'));
});

test('public editorial descriptions contain the science and dates rather than scoring instructions',()=>{
  for(const e of data.events.filter(e=>e.assessment.basis==='editorial-estimate')){
    assert.doesNotMatch(e.dateNote.zh,/总分|预算|年龄校准/,e.id);
    assert.doesNotMatch(e.rationale.zh,/本版评分|高等级锚点|本项评价/,e.id);
  }
  const diffraction=byId.get('early-grimaldi-diffraction');
  if(diffraction){
    assert.ok(core.spanOf(diffraction)[1]<=1663);
    assert.equal(diffraction.timelineDates.published,1665);
  }
});
