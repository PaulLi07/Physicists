/* Pixel-space presentation helpers. Never applied to the annual event ledger. */
(function(root){
  'use strict';
  const channels=['value','density','uncertain'];

  // sigma is in screen samples (normally vertical pixels), not calendar years.
  // Explicit breaks are indices at which a new segment starts. A change in a
  // sample's segmentId creates the same boundary. Edge-local normalization
  // keeps constants constant without borrowing values across marked breaks.
  function smoothSamples(samples,options={}){
    if(!Array.isArray(samples))throw new TypeError('Display samples must be an array');
    const sigma=options.sigma??2.5,breaks=options.breaks??[];
    if(!Number.isFinite(sigma)||sigma<0)throw new RangeError('Display sigma must be finite and nonnegative');
    if(!Array.isArray(breaks)||breaks.some(i=>!Number.isInteger(i)||i<0||i>samples.length))throw new RangeError('Invalid display segment break');
    if(samples.some(s=>!s||typeof s!=='object'||Array.isArray(s)))throw new TypeError('Invalid display sample');
    const fields=channels.filter(key=>key==='value'||samples.some(s=>s[key]!==undefined));
    for(const [i,sample] of samples.entries())for(const key of fields){
      if(!Number.isFinite(sample[key])||sample[key]<0)throw new RangeError('Invalid nonnegative display channel '+key+' at '+i);
    }
    const result=samples.map(s=>({...s}));
    if(!sigma||samples.length<2)return result;
    const cuts=new Set([0,samples.length,...breaks]);
    for(let i=1;i<samples.length;i++)if(samples[i].segmentId!==samples[i-1].segmentId)cuts.add(i);
    const boundaries=Array.from(cuts).sort((a,b)=>a-b);
    const radius=Math.min(samples.length-1,Math.ceil(3*sigma));
    const kernel=Array.from({length:radius+1},(_,d)=>Math.exp(-.5*(d/sigma)**2));
    for(let segment=0;segment<boundaries.length-1;segment++){
      const start=boundaries[segment],end=boundaries[segment+1];
      for(let i=start;i<end;i++){
        const lo=Math.max(start,i-radius),hi=Math.min(end-1,i+radius);
        for(const key of fields){
          let mean=0,total=0,min=Infinity,max=-Infinity;
          for(let j=lo;j<=hi;j++){
            const weight=kernel[Math.abs(j-i)];if(!weight)continue;
            const value=samples[j][key],next=total+weight;
            // Incremental means avoid overflowing sums of large finite values.
            mean+=(value-mean)*(weight/next);total=next;
            min=Math.min(min,value);max=Math.max(max,value);
          }
          result[i][key]=Math.max(min,Math.min(max,mean));
        }
      }
    }
    return result;
  }

  function tickLabel(value,step){
    if(value===0)return '0';
    if(value<.001||value>=10000)return value.toExponential(1).replace(/\.0e/,'e').replace('e+','e');
    const digits=Math.max(0,Math.min(6,Math.ceil(-Math.log10(step))+1));
    return String(Number(value.toFixed(digits)));
  }
  // Positions refer to the linear density coordinate, not the asinh index axis.
  function colorbarTicks(max,options={}){
    if(!Number.isFinite(max)||max<0)throw new RangeError('Colorbar maximum must be finite and nonnegative');
    const count=options.count??5;
    if(!Number.isInteger(count)||count<2||count>21)throw new RangeError('Colorbar tick count must be between 2 and 21');
    if(max===0)return [{position:0,value:0,label:'0'}];
    if(options.integers){
      const target=Math.max(1,max/(count-1)),power=10**Math.floor(Math.log10(target));
      const candidates=[1,2,5,10].map(n=>n*power).filter(n=>Number.isFinite(n)&&n>=1);
      const step=candidates.reduce((a,b)=>Math.abs(Math.log(b/target))<Math.abs(Math.log(a/target))?b:a);
      return Array.from({length:Math.floor(max/step)+1},(_,i)=>{
        const value=i*step;return {position:value/max,value,label:String(value)};
      });
    }
    const step=max/(count-1);
    return Array.from({length:count},(_,i)=>{
      const position=i/(count-1),value=i===count-1?max:max*position;
      return {position,value,label:tickLabel(value,step)};
    });
  }

  const api={smoothSamples,colorbarTicks};
  root.PlotDisplay=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
