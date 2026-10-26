'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..'),dist=path.join(root,'website/dist');

test('the project entry opens the built website and preserves URL query and fragment',()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),redirects=[];
  const location={search:'?source=entry-check',hash:'#lang=en&year=1964&person=peter-higgs',replace:url=>redirects.push(url)};
  for(const [,script] of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))vm.runInNewContext(script,{location});
  assert.deepEqual(redirects,['website/dist/index.html'+location.search+location.hash]);
});

test('the independent distribution loads the current timeline and every entry resource from its own package',()=>{
  const html=fs.readFileSync(path.join(dist,'index.html'),'utf8');
  assert.match(html,/id="people-list"/);assert.match(html,/id="axis-wrap"/);
  assert.doesNotMatch(html,/design-review|\.\.\/dist\//);
  const refs=[...html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="([^"]+)"/gi)].map(m=>m[1]);
  assert.ok(refs.includes('app.js'));assert.ok(refs.includes('styles.css'));
  assert.ok(refs.includes('data/archive.js'));assert.ok(refs.includes('data/breakthrough-data.js'));
  assert.doesNotMatch(fs.readFileSync(path.join(dist,'app.js'),'utf8'),/design-review|\.\.\/dist\//);
  for(const ref of refs){
    assert.doesNotMatch(ref,/^(?:[a-z]+:|\/)/i,ref);
    const file=path.resolve(dist,decodeURIComponent(ref.split(/[?#]/)[0]));
    assert.ok(file.startsWith(dist+path.sep),ref);
    assert.ok(fs.statSync(file).isFile(),ref);
  }
});

test('the distribution includes all portraits, annual data and bilingual maintenance documents',()=>{
  const ctx={};vm.runInNewContext(fs.readFileSync(path.join(dist,'data/archive.js'),'utf8'),ctx);
  assert.equal(ctx.PHYSICS_ARCHIVE.people.length,ctx.PHYSICS_ARCHIVE.count);
  for(const p of ctx.PHYSICS_ARCHIVE.people){
    const file=path.resolve(dist,p.portrait.path);
    assert.ok(file.startsWith(dist+path.sep),p.id);
    assert.ok(fs.statSync(file).isFile(),p.id);
  }
  for(const name of ['events.json','yearly-index.json','method.zh.md','method.en.md'])assert.ok(fs.statSync(path.join(dist,'data',name)).isFile(),name);
  const annual=JSON.parse(fs.readFileSync(path.join(dist,'data/yearly-index.json'),'utf8'));
  assert.equal(annual.methodVersion,'3.0');
  assert.equal(annual.counts.totalPeople,ctx.PHYSICS_ARCHIVE.count);
});
