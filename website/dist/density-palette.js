/* ROOT TColor::CreateGradientColorTable: piecewise-linear RGB stops. */
(function(root){
  'use strict';
  const stops=[0,.25,1],colors=[[.9,.9,.9],[.15,.15,.15],[1,0,0]];
  function rgb(value){
    if(!Number.isFinite(value))throw new TypeError('Density coordinate must be finite');
    const v=Math.max(0,Math.min(1,value)),i=v<=stops[1]?0:1,t=(v-stops[i])/(stops[i+1]-stops[i]);
    return colors[i].map((c,j)=>Math.round(255*(c+(colors[i+1][j]-c)*t)));
  }
  const color=value=>'rgb('+rgb(value).join(',')+')';
  const api={stops,colors,rgb,color};root.DensityPalette=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
