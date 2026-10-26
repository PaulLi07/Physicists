#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'data/breakthrough');
const core=require('../website/src/breakthrough.js');
const navigation=require('./lib/navigation-estimates.cjs');
const args=process.argv.slice(2),settings={archiveDir:path.join(root,'website/dist'),outputDir:path.join(root,'website/dist/data')};
for(let i=0;i<args.length;i++){
  const arg=args[i];
  if(arg==='--artifacts-only')continue; // Compatibility flag; every mode is output-only.
  else if(arg==='--archive-dir'||arg==='--output-dir'){
    const value=args[++i];if(!value||value.startsWith('--'))throw Error('Missing directory after '+arg);
    settings[arg==='--archive-dir'?'archiveDir':'outputDir']=path.resolve(value);
  }else throw Error('Unknown option: '+arg);
}
const ctx={};
vm.runInNewContext(fs.readFileSync(path.join(settings.archiveDir,'data/archive.js'),'utf8'),ctx);
vm.runInNewContext(fs.readFileSync(path.join(settings.archiveDir,'core.js'),'utf8'),ctx);
const archive=ctx.PHYSICS_ARCHIVE;
const read=(name,fallback)=>fs.existsSync(path.join(dir,name))?JSON.parse(fs.readFileSync(path.join(dir,name),'utf8')):fallback;
const config=read('index-config.json',{}),asOf=config.reviewedAt||archive.asOf,asOfYear=Number(asOf.slice(0,4));
const files=fs.readdirSync(dir).filter(f=>/^events-.*\.json$/.test(f)).sort();
if(!files.length)throw Error('No breakthrough source files');
const events=files.flatMap(f=>read(f,[]).map(e=>({...e,sourceFile:f})));
const byEvent=new Map(events.map(e=>[e.id,e]));
if(byEvent.size!==events.length)throw Error('Duplicate source event ID');
function mergeSources(event,sources=[]){
  const urls=new Set(event.sources.map(s=>s.url));
  for(const s of sources)if(!urls.has(s.url)){event.sources.push(s);urls.add(s.url);}
}
function applyPatches(patches){
  for(const patch of patches){
    const event=byEvent.get(patch.eventId);
    if(!event)throw Error('Patch has no matching event: '+patch.eventId);
    const {eventId,sources,publisherCollection,...values}=patch;
    if(values.score!==undefined){
      if(values.weight!==undefined&&values.weight!==values.score)throw Error('Patch score/weight mismatch: '+eventId);
      values.weight=values.score;
    }
    Object.assign(event,values);mergeSources(event,sources);
    if(publisherCollection)event.publisherCollections=[...(event.publisherCollections||[]),publisherCollection];
  }
}
for(const e of events){
  core.scoreOf(e);
  e.sourceDate={year:e.year,precision:e.precision,dateRange:e.dateRange||null,yearBasis:e.yearBasis||null};
}
applyPatches(read('existing-source-patches.json',[]));
applyPatches(read('event-assessments.json',[]));
applyPatches(read('editorial-event-patches.json',[]));
for(const e of events)for(const id of e.supersedes||[]){
  const old=byEvent.get(id);
  if(old&&old.id!==e.id){old.indexEligible=false;old.supersededBy=e.id;}
}
for(const e of events){
  e.score=core.scoreOf(e);e.weight=e.score;
  if(!e.assessment||e.assessment.version!=='3.0')throw Error('Missing v3 assessment: '+e.id);
  if(!e.eventFamilyId)throw Error('Missing result family: '+e.id);
  if(e.dateModel){
    const {start,end,kind,basis}=e.dateModel;
    const confidence=e.dateModel.dateConfidence;
    if(confidence)e.dateConfidence=({'editorial-anchor':'estimated','editorial-interval':'estimated','documented-record':'documented'})[confidence]||confidence;
    e.year=start===end?start:null;e.dateRange=start===end?undefined:[start,end];
    e.precision=start===end?(basis==='editorial-interval'?'approximate':e.precision==='approximate'?'approximate':'year'):'range';
    e.yearBasis=basis;e.dateKind=kind;
  }
}
events.sort((a,b)=>(core.spanOf(a)?.[0]??Infinity)-(core.spanOf(b)?.[0]??Infinity)||a.id.localeCompare(b.id));
const personIds=new Set(archive.people.map(p=>p.id)),fields=new Set(ctx.ArchiveCore.domains.map(d=>d.id));
for(const e of events){
  if(!fields.has(e.field))throw Error('Unknown field: '+e.id);
  if(!['reviewed','provisional'].includes(e.status))throw Error('Invalid review status: '+e.id);
}
core.validate(events,personIds);
const eventAnchors=core.createAnchors(events);
// Navigation estimates never enter the score ledger.
const fallback=navigation.createEstimates(archive.people,events,{asOfYear});
const navigationRecords=fallback.records.map(record=>{
  const {contributionFactor,contributionBasis,sharedBudgetId,sharedBudget,sharedParticipants,calibration,...rest}=record;
  const {creditMedian,...ages}=calibration||{};
  return {...rest,method:'navigation-activity-estimate-v3',calibration:ages,purpose:'navigation-only'};
});
const navigationAnchors=Object.fromEntries(Object.entries(fallback.anchors).map(([id,anchor])=>{
  const {weight,score,...rest}=anchor;return [id,rest];
}));
const anchors={...navigationAnchors,...eventAnchors};
const unanchored=archive.people.filter(p=>!anchors[p.id]);
if(unanchored.length)throw Error('Missing navigation years: '+unanchored.map(p=>p.id).join(', '));
const options={asOfYear,personIds,navigationEstimates:navigationRecords};
const result=core.calculate(events,options);
const eligible=events.filter(e=>core.spanOf(e)&&e.indexEligible!==false);
const scoredPeople=new Set(eligible.flatMap(e=>e.people));
const counts={events:events.length,dated:events.filter(e=>core.spanOf(e)).length,indexDated:eligible.length,
  linkedPeople:Object.keys(eventAnchors).length,estimatedEvents:eligible.filter(e=>e.assessment.basis==='editorial-estimate').length,
  estimatedPeople:new Set(eligible.filter(e=>e.assessment.basis==='editorial-estimate').flatMap(e=>e.people)).size,
  navigationOnlyPeople:archive.people.filter(p=>!scoredPeople.has(p.id)).length,
  navigablePeople:Object.keys(anchors).length,totalPeople:archive.people.length};
const journalSources=read('journal-sources.json',[]);
const data={asOf,biographyAsOf:archive.asOf,methodVersion:'3.0',counts,files,events,anchors,
  navigationEstimates:navigationRecords,estimatedContributions:[],journalSources,display:config.display,...result};
const annual={asOf,methodVersion:data.methodVersion,counts,kernel:result.kernel,components:result.components,display:config.display,series:result.series};
const alternative=core.calculate(events,{...options,weightMap:{1:1,2:2,4:4,8:6,16:8}});
function peaks(series){
  const selected=[];
  for(const p of series.slice().sort((a,b)=>b.value-a.value)){
    if(selected.every(q=>Math.abs(core.serial(q.year)-core.serial(p.year))>10))selected.push({year:p.year,value:p.value});
    if(selected.length===8)break;
  }
  return selected;
}
const sensitivity={asOf,methodVersion:'3.0',primaryWeights:[1,2,4,8,16],alternativeWeights:[1,2,4,6,8],
  primaryPeaks:peaks(result.series),alternativePeaks:peaks(alternative.series),
  totalScore:result.series.reduce((s,p)=>s+p.value,0),eligibleEventBudget:eligible.reduce((s,e)=>s+e.score,0),
  note:'Score-scale sensitivity only. Dates and budgets remain explicit; no person residuals or historical smoothing.'};
const navigationData={asOf,purpose:'Directory navigation and contributor-density display only; never added to the breakthrough score.',records:navigationRecords,anchors:navigationAnchors};
const coverage={asOf,counts,unanchored:[],navigationOnly:archive.people.filter(p=>!scoredPeople.has(p.id)).map(p=>({id:p.id,names:p.names})),editorialCoverage:read('editorial-coverage.json',[])};
const summary={asOf,methodVersion:data.methodVersion,counts,years:result.series.length,from:result.minYear,to:result.maxYear,
  totalScore:result.series.reduce((s,p)=>s+p.value,0),peak:Math.max(...result.series.map(p=>p.value))};
const methods=['zh','en'].map(lang=>({name:'method.'+lang+'.md',contents:fs.readFileSync(path.join(root,'docs','physics-breakthrough-index.'+lang+'.md'),'utf8')}));
// Complete all validation and calculation before publishing even a single file.
function writeAtomic(file,contents){
  fs.mkdirSync(path.dirname(file),{recursive:true});const temp=file+'.tmp-'+process.pid;
  try{fs.writeFileSync(temp,contents);fs.renameSync(temp,file);}finally{if(fs.existsSync(temp))fs.unlinkSync(temp);}
}
function writeJSON(file,value){writeAtomic(file,JSON.stringify(value,null,2)+'\n');}
// Source records in data/breakthrough are read-only. Every derived artifact
// belongs to this output directory, including staging builds.
writeJSON(path.join(settings.outputDir,'navigation-estimates.json'),navigationData);
writeJSON(path.join(settings.outputDir,'coverage.json'),coverage);
writeJSON(path.join(settings.outputDir,'sensitivity.json'),sensitivity);
writeJSON(path.join(settings.outputDir,'yearly-index.json'),annual);
writeJSON(path.join(settings.outputDir,'events.json'),events);
for(const method of methods)writeAtomic(path.join(settings.outputDir,method.name),method.contents);
// The browser consumes one complete immutable snapshot; replace it last.
writeAtomic(path.join(settings.outputDir,'breakthrough-data.js'),'globalThis.BREAKTHROUGH_ARCHIVE = '+JSON.stringify(data)+';\n');
writeJSON(path.join(settings.outputDir,'build-summary.json'),summary);
console.log(JSON.stringify(summary));
