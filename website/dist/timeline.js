/*
 * Data-adaptive chronology overview. sortYear is the supplied calendar anchor.
 * Each marked segment is linear; the complete overview is not a uniform scale.
 * No historical limits, ticks, contributor counts or person IDs are fixed here.
 */
(function(root){
  'use strict';

  function niceStep(value){
    if(!Number.isFinite(value)||value<=0)throw new RangeError('niceStep requires a positive finite number');
    const power=10**Math.floor(Math.log10(value));
    const ratio=value/power;
    const factor=[1,2,2.5,5,10].find(n=>n>=ratio-1e-12);
    return Number((factor*power).toPrecision(14));
  }

  function lowerBound(values,value,start=0,end=values.length){
    while(start<end){const middle=(start+end)>>1;if(values[middle]<value)start=middle+1;else end=middle;}
    return start;
  }

  function calendarSteps(span){
    const result=[];
    for(let exponent=Math.ceil(Math.log10(Math.max(span,1)));exponent>=0;exponent--){
      for(const factor of [5,2.5,2,1]){
        const step=factor*10**exponent;
        if(Number.isInteger(step)&&step>=1)result.push(step);
      }
    }
    return Array.from(new Set(result)).sort((a,b)=>b-a);
  }

  function splitCandidate(segment,years){
    const count=segment.end-segment.start;
    if(count<4)return null;
    const middle=(segment.start+segment.end-1)/2;
    const median=(years[Math.floor(middle)]+years[Math.ceil(middle)])/2;
    for(const step of calendarSteps(segment.to-segment.from)){
      const center=Math.round(median/step)*step;
      const candidates=[center,center-step,center+step].sort((a,b)=>Math.abs(a-median)-Math.abs(b-median));
      for(const cut of candidates){
        if(cut<=segment.from||cut>=segment.to)continue;
        const index=lowerBound(years,cut,segment.start,segment.end);
        const share=(index-segment.start)/count;
        if(share>=.30&&share<=.70)return {cut,index};
      }
    }
    return null;
  }

  function createTimeline(people,options={}){
    if(!Array.isArray(people))throw new TypeError('Timeline data must be an array');
    const top=options.top??20,bottom=options.bottom??520;
    const minTickGap=options.minTickGap??28;
    const maxSegments=options.maxSegments??4;
    if(!Number.isFinite(top)||!Number.isFinite(bottom)||bottom<=top)throw new RangeError('Timeline bottom must be greater than top');
    if(!Number.isFinite(minTickGap)||minTickGap<=0)throw new RangeError('minTickGap must be positive');
    if(!Number.isInteger(maxSegments)||maxSegments<1||maxSegments>12)throw new RangeError('maxSegments must be an integer from 1 to 12');
    const years=people.map((person,index)=>{
      if(!person||!Number.isFinite(person.sortYear))throw new TypeError('Invalid birth year at record '+index);
      return person.sortYear;
    }).sort((a,b)=>a-b);
    const yearCounts=new Map();
    years.forEach(year=>yearCounts.set(year,(yearCounts.get(year)||0)+1));
    const minYear=years.length?years[0]:null,maxYear=years.length?years[years.length-1]:null;
    let rawMin=minYear??0,rawMax=maxYear??1;
    if(rawMin===rawMax){
      const padding=Math.max(1,niceStep(Math.max(Math.abs(rawMin),1)*.005));
      rawMin-=padding;rawMax+=padding;
    }
    const boundsStep=Math.max(1,niceStep((rawMax-rawMin)/40));
    const domainMin=options.exactBounds?rawMin:Math.floor(rawMin/boundsStep)*boundsStep;
    const domainMax=options.exactBounds?rawMax:Math.ceil(rawMax/boundsStep)*boundsStep;
    const definitions=[{from:domainMin,to:domainMax,start:0,end:years.length}];
    const height=bottom-top;
    const desiredSegments=years.length<8?1:Math.min(maxSegments,yearCounts.size,Math.max(1,Math.floor(height/Math.max(60,minTickGap*2.5))));
    while(definitions.length<desiredSegments){
      const candidates=definitions.map((segment,index)=>({segment,index,split:splitCandidate(segment,years)}))
        .filter(item=>item.split)
        .sort((a,b)=>(b.segment.end-b.segment.start)-(a.segment.end-a.segment.start)||a.segment.from-b.segment.from);
      if(!candidates.length)break;
      const {segment,index,split}=candidates[0];
      definitions.splice(index,1,
        {from:segment.from,to:split.cut,start:segment.start,end:split.index},
        {from:split.cut,to:segment.to,start:split.index,end:segment.end});
    }
    let pixel=top;
    const segments=definitions.map((segment,index)=>{
      const count=segment.end-segment.start;
      // Half the space is shared equally, half follows record counts. This
      // preserves old sparse history while making dense recent periods usable.
      const share=.5/definitions.length+.5*(years.length?count/years.length:1/definitions.length);
      const next=index===definitions.length-1?bottom:pixel+height*share;
      const result={from:segment.from,to:segment.to,top:pixel,bottom:next,count};
      pixel=next;return result;
    });
    function scaleYear(year){
      if(!Number.isFinite(year))throw new TypeError('Year must be finite');
      const value=Math.max(domainMin,Math.min(domainMax,year));
      const segment=segments.find(s=>value<=s.to)||segments[segments.length-1];
      return segment.top+(value-segment.from)/(segment.to-segment.from)*(segment.bottom-segment.top);
    }
    function yearAt(position){
      if(!Number.isFinite(position))throw new TypeError('Position must be finite');
      const value=Math.max(top,Math.min(bottom,position));
      const segment=segments.find(s=>value<=s.bottom)||segments[segments.length-1];
      return segment.from+(value-segment.top)/(segment.bottom-segment.top)*(segment.to-segment.from);
    }
    const candidates=new Map(),minorCandidates=new Map();
    function addTick(year,major,priority){
      // Mathematical interpolation crosses zero, but historical labels do not
      // introduce a year zero. A nearby 1 CE tick is used when it fits.
      if(year===0)year=1;
      if(year<domainMin||year>domainMax)return;
      const old=candidates.get(year);
      if(!old||priority>old.priority)candidates.set(year,{year,y:scaleYear(year),major,priority});
    }
    addTick(domainMin,true,4);addTick(domainMax,true,4);
    for(const segment of segments){
      addTick(segment.from,true,3);addTick(segment.to,true,3);
      const intervals=Math.max(1,Math.floor((segment.bottom-segment.top)/minTickGap));
      const step=Math.max(1,niceStep((segment.to-segment.from)/intervals));
      const labelSteps=Array.from(new Set([step,Math.max(1,niceStep(step/2))]));
      for(let level=0;level<labelSteps.length;level++){
        const labelStep=labelSteps[level];
        for(let year=Math.ceil(segment.from/labelStep)*labelStep;year<=segment.to+labelStep*1e-9;year+=labelStep){
          if(!Number.isInteger(year))continue;
          addTick(year,false,level===0?1:.5);
        }
      }
      const minorStep=Math.max(1,niceStep((segment.to-segment.from)/Math.max(1,Math.floor((segment.bottom-segment.top)/8))));
      for(let year=Math.ceil(segment.from/minorStep)*minorStep;year<=segment.to+minorStep*1e-9;year+=minorStep){
        if(year!==0&&Number.isInteger(year))minorCandidates.set(year,{year,y:scaleYear(year),major:false});
      }
    }
    const ticks=[];
    const effectiveGap=Math.min(minTickGap,height/2);
    for(const candidate of Array.from(candidates.values()).sort((a,b)=>b.priority-a.priority||a.y-b.y)){
      if(ticks.every(tick=>Math.abs(candidate.y-tick.y)>=effectiveGap-1e-8)){
        const {priority,...tick}=candidate;ticks.push(tick);
      }
    }
    ticks.sort((a,b)=>a.y-b.y);
    const tickYears=new Set(ticks.map(tick=>tick.year));
    const minorTicks=Array.from(minorCandidates.values()).filter(tick=>!tickYears.has(tick.year)&&ticks.every(label=>Math.abs(label.y-tick.y)>4)).sort((a,b)=>a.y-b.y);
    return {
      minYear,maxYear,domainMin,domainMax,segments,ticks,minorTicks,
      scaleYear,yearAt,yearCounts,maxYearCount:Math.max(0,...yearCounts.values()),
      scaleType:'piecewise-linear',
      allocation:'Half equal segment space; half proportional to record count. Linear within each marked segment.'
    };
  }
  const api={createTimeline,niceStep};
  root.ReviewTimeline=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
