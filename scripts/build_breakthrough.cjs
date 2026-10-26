#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'data/breakthrough');
const core=require('../website/design-review/breakthrough.js');
const estimator=require('../website/design-review/person-estimates.js');
const ctx={};
vm.runInNewContext(fs.readFileSync(path.join(root,'website/dist/data/archive.js'),'utf8'),ctx);
vm.runInNewContext(fs.readFileSync(path.join(root,'website/dist/core.js'),'utf8'),ctx);
const archive=ctx.PHYSICS_ARCHIVE,asOfYear=Number(archive.asOf.slice(0,4));
const readOptional=(name,fallback)=>fs.existsSync(path.join(dir,name))?JSON.parse(fs.readFileSync(path.join(dir,name),'utf8')):fallback;
const files=fs.readdirSync(dir).filter(f=>/^events-.*\.json$/.test(f)).sort();
if(!files.length)throw Error('No reviewed breakthrough source files');
const events=files.flatMap(f=>JSON.parse(fs.readFileSync(path.join(dir,f),'utf8')))
  .sort((a,b)=>(core.spanOf(a)?.[0]??Infinity)-(core.spanOf(b)?.[0]??Infinity)||a.id.localeCompare(b.id));
const byEvent=new Map(events.map(e=>[e.id,e]));
const patches=readOptional('existing-source-patches.json',[]);
for(const patch of patches){
  const event=byEvent.get(patch.eventId);
  if(!event)throw Error('Publisher-source patch has no event: '+patch.eventId);
  const urls=new Set(event.sources.map(s=>s.url));
  for(const source of patch.sources||[])if(!urls.has(source.url)){event.sources.push(source);urls.add(source.url);}
  if(patch.publisherCollection)event.publisherCollections=[...(event.publisherCollections||[]),patch.publisherCollection];
}
const journalSources=readOptional('journal-sources.json',[]);
const fields=new Set(ctx.ArchiveCore.domains.map(d=>d.id));
for(const e of events){
  if(!fields.has(e.field))throw Error('Unknown research field: '+e.id);
  if(e.weight>=4&&new Set(e.sources.map(s=>s.url)).size<2)throw Error('High-weight event requires independent supporting sources: '+e.id);
  if(!['reviewed','provisional'].includes(e.status))throw Error('Invalid review status: '+e.id);
}
const verifiedAnchors=core.createAnchors(events);
const estimates=estimator.createEstimates(archive.people,events,{asOfYear});
const anchors={...estimates.anchors,...verifiedAnchors};
const unanchored=archive.people.filter(p=>!anchors[p.id]);
if(unanchored.length)throw Error('All profiles require a contribution-year position: '+unanchored.map(p=>p.id).join(', '));
const options={asOfYear,personIds:new Set(archive.people.map(p=>p.id)),estimatedContributions:estimates.records};
const result=core.calculate(events,options);
const counts={events:events.length,dated:events.filter(e=>core.spanOf(e)).length,
  indexDated:events.filter(e=>core.spanOf(e)&&e.indexEligible!==false).length,
  linkedPeople:Object.keys(verifiedAnchors).length,estimatedPeople:estimates.records.length,
  navigablePeople:Object.keys(anchors).length,totalPeople:archive.people.length};
const data={asOf:archive.asOf,methodVersion:'2.0',counts,files,events,anchors,
  estimatedContributions:estimates.records,journalSources,...result};
const outputDir=path.join(root,'website/design-review/data');fs.mkdirSync(outputDir,{recursive:true});
function writeJSON(file,value){const tmp=file+'.tmp';fs.writeFileSync(tmp,JSON.stringify(value,null,2)+'\n');fs.renameSync(tmp,file);}
const annual={asOf:data.asOf,methodVersion:data.methodVersion,counts,kernel:data.kernel,components:result.components,series:data.series};
writeJSON(path.join(dir,'yearly-index.json'),annual);
writeJSON(path.join(dir,'contribution-estimates.json'),{asOf:archive.asOf,...estimates});
writeJSON(path.join(dir,'coverage.json'),{asOf:archive.asOf,counts,unanchored:[],calibration:estimates.calibration,coverage:estimates.coverage});
const dataTmp=path.join(outputDir,'breakthrough-data.js.tmp');
fs.writeFileSync(dataTmp,'globalThis.BREAKTHROUGH_ARCHIVE = '+JSON.stringify(data)+';\n');
fs.renameSync(dataTmp,path.join(outputDir,'breakthrough-data.js'));
writeJSON(path.join(outputDir,'yearly-index.json'),annual);
writeJSON(path.join(outputDir,'events.json'),events);
const alternative=core.calculate(events,{...options,weightMap:{1:1,2:2,4:3,8:4}});
const paired=result.series.map((p,i)=>[p,alternative.series[i]]).filter(([p])=>p.year>=1800&&p.year<=asOfYear-5);
const mean=a=>a.reduce((s,x)=>s+x,0)/Math.max(1,a.length);
const xs=paired.map(([p])=>p.value),ys=paired.map(([,p])=>p.value),mx=mean(xs),my=mean(ys);
const corr=xs.reduce((s,x,i)=>s+(x-mx)*(ys[i]-my),0)/Math.sqrt(xs.reduce((s,x)=>s+(x-mx)**2,0)*ys.reduce((s,y)=>s+(y-my)**2,0));
function peaks(series){
  const selected=[];
  for(const p of series.filter(p=>p.year>=1800&&p.year<=asOfYear-5).sort((a,b)=>b.value-a.value)){
    if(selected.every(q=>Math.abs(q.year-p.year)>15))selected.push({year:p.year,value:p.value});
    if(selected.length===6)break;
  }
  return selected;
}
const primaryPeaks=peaks(result.series),alternativePeaks=peaks(alternative.series);
writeJSON(path.join(dir,'sensitivity.json'),{asOf:archive.asOf,methodVersion:'2.0',primaryWeights:[1,2,4,8],alternativeWeights:[1,2,3,4],
  comparisonYears:[1800,asOfYear-5],annualPearsonCorrelation:Number.isFinite(corr)?corr:null,primaryPeaks,alternativePeaks,
  peaksWithinTenYears:primaryPeaks.filter(p=>alternativePeaks.some(q=>Math.abs(q.year-p.year)<=10)).length,
  estimatesKeptFixed:true,note:'Tests source-event weight sensitivity with residual estimates fixed. Does not establish historical completeness or objective importance.'});
console.log(JSON.stringify({...counts,years:result.series.length,from:result.minYear,to:result.maxYear,
  estimatedShare:estimates.coverage.estimatedShareOfCombinedWeight,peak:Math.max(...result.series.map(y=>y.value))}));
