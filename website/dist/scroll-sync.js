/* Continuous, invertible mapping between birth years and list scroll pixels. */
(function(root){
  'use strict';
  function createScrollMap(points,maxScroll){
    if(!Array.isArray(points)||!Number.isFinite(maxScroll)||maxScroll<0)throw new TypeError('Invalid scroll geometry');
    const unique=new Map();
    for(const p of points){
      if(!Number.isFinite(p.year)||!Number.isFinite(p.offset))throw new TypeError('Invalid year or offset');
      if(!unique.has(p.year))unique.set(p.year,p.offset);
    }
    const raw=Array.from(unique,([year,offset])=>({year,offset})).sort((a,b)=>a.year-b.year);
    for(let i=1;i<raw.length;i++)if(raw[i].offset<=raw[i-1].offset)throw new RangeError('Chronological offsets must increase');
    const minYear=raw[0]?.year??null,maxYear=raw[raw.length-1]?.year??null;
    const span=raw.length>1?raw[raw.length-1].offset-raw[0].offset:0;
    const anchors=raw.map(p=>({year:p.year,offset:span?(p.offset-raw[0].offset)/span*maxScroll:0}));
    function interpolate(value,input,output){
      if(!Number.isFinite(value))throw new TypeError('Position must be finite');
      if(!anchors.length)return 0;
      if(anchors.length===1||maxScroll===0)return anchors[0][output];
      if(value<=anchors[0][input])return anchors[0][output];
      const last=anchors[anchors.length-1];if(value>=last[input])return last[output];
      let lo=1,hi=anchors.length-1;
      while(lo<hi){const m=(lo+hi)>>1;if(anchors[m][input]<value)lo=m+1;else hi=m;}
      const a=anchors[lo-1],b=anchors[lo];
      return a[output]+(value-a[input])/(b[input]-a[input])*(b[output]-a[output]);
    }
    return {anchors,minYear,maxYear,maxScroll,offsetForYear:year=>interpolate(year,'year','offset'),yearForOffset:offset=>interpolate(offset,'offset','year')};
  }
  root.ReviewScroll={createScrollMap};
  if(typeof module!=='undefined'&&module.exports)module.exports=root.ReviewScroll;
})(globalThis);
