#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'data/breakthrough');
const core=require('../website/design-review/breakthrough.js');
const ctx={};vm.runInNewContext(fs.readFileSync(path.join(root,'website/dist/data/archive.js'),'utf8'),ctx);
const archive=ctx.PHYSICS_ARCHIVE;
vm.runInNewContext(fs.readFileSync(path.join(root,'website/dist/core.js'),'utf8'),ctx);
const files=fs.readdirSync(dir).filter(f=>/^events-.*\.json$/.test(f)).sort();
if(!files.length)throw Error('No reviewed breakthrough source files');
const events=files.flatMap(f=>JSON.parse(fs.readFileSync(path.join(dir,f),'utf8'))).sort((a,b)=>(core.spanOf(a)?.[0]??Infinity)-(core.spanOf(b)?.[0]??Infinity)||a.id.localeCompare(b.id));
const fields=new Set(ctx.ArchiveCore.domains.map(d=>d.id));
for(const e of events){
  if(!fields.has(e.field))throw Error('Unknown research field: '+e.id);
  if(e.weight>=4&&new Set(e.sources.map(s=>s.url)).size<2)throw Error('High-weight event requires independent supporting sources: '+e.id);
  if(!['reviewed','provisional'].includes(e.status))throw Error('Invalid review status: '+e.id);
}
const result=core.calculate(events,{asOfYear:Number(archive.asOf.slice(0,4)),personIds:new Set(archive.people.map(p=>p.id))});
const anchors=core.createAnchors(events),counts={events:events.length,dated:events.filter(e=>core.spanOf(e)).length,indexDated:events.filter(e=>core.spanOf(e)&&e.indexEligible!==false).length,linkedPeople:Object.keys(anchors).length,totalPeople:archive.people.length};
const data={asOf:archive.asOf,methodVersion:'1.0',counts,files,events,anchors,...result};
fs.writeFileSync(path.join(dir,'yearly-index.json'),JSON.stringify({asOf:data.asOf,methodVersion:data.methodVersion,counts,kernel:data.kernel,series:data.series},null,2)+'\n');
fs.mkdirSync(path.join(root,'website/design-review/data'),{recursive:true});
fs.writeFileSync(path.join(root,'website/design-review/data/breakthrough-data.js'),'globalThis.BREAKTHROUGH_ARCHIVE = '+JSON.stringify(data)+';\n');
fs.copyFileSync(path.join(dir,'yearly-index.json'),path.join(root,'website/design-review/data/yearly-index.json'));
fs.writeFileSync(path.join(root,'website/design-review/data/events.json'),JSON.stringify(events,null,2)+'\n');
fs.writeFileSync(path.join(dir,'coverage.json'),JSON.stringify({asOf:archive.asOf,counts,unanchored:archive.people.filter(p=>!anchors[p.id]).map(p=>({id:p.id,name:p.names.zh}))},null,2)+'\n');
const alternative=core.calculate(events,{asOfYear:result.maxYear,weightMap:{1:1,2:2,4:3,8:4}});
const paired=result.series.map((p,i)=>[p,alternative.series[i]]).filter(([p])=>p.year>=1800&&p.year<=result.maxYear-5);
const mean=a=>a.reduce((s,x)=>s+x,0)/Math.max(1,a.length);
const xs=paired.map(([p])=>p.value),ys=paired.map(([,p])=>p.value),mx=mean(xs),my=mean(ys);
const corr=xs.reduce((s,x,i)=>s+(x-mx)*(ys[i]-my),0)/Math.sqrt(xs.reduce((s,x)=>s+(x-mx)**2,0)*ys.reduce((s,y)=>s+(y-my)**2,0));
function peaks(series){const selected=[];for(const p of series.filter(p=>p.year>=1800&&p.year<=result.maxYear-5).sort((a,b)=>b.value-a.value))if(selected.every(q=>Math.abs(q.year-p.year)>15)){selected.push({year:p.year,value:p.value});if(selected.length===6)break;}return selected;}
const primaryPeaks=peaks(result.series),alternativePeaks=peaks(alternative.series);
fs.writeFileSync(path.join(dir,'sensitivity.json'),JSON.stringify({asOf:archive.asOf,primaryWeights:[1,2,4,8],alternativeWeights:[1,2,3,4],comparisonYears:[1800,result.maxYear-5],annualPearsonCorrelation:Number.isFinite(corr)?corr:null,primaryPeaks,alternativePeaks,peaksWithinTenYears:primaryPeaks.filter(p=>alternativePeaks.some(q=>Math.abs(q.year-p.year)<=10)).length,note:'Only tests sensitivity to editorial weights. It does not establish historical completeness or objective importance.'},null,2)+'\n');
console.log(JSON.stringify({...counts,years:result.series.length,from:result.minYear,to:result.maxYear,peak:Math.max(...result.series.map(y=>y.value))}));
