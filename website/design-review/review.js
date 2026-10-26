(function(){
  'use strict';
  const archive=globalThis.PHYSICS_ARCHIVE,data=globalThis.BREAKTHROUGH_ARCHIVE,core=globalThis.ArchiveCore,index=globalThis.BreakthroughCore;
  const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  if(!archive||!data||!index||!globalThis.DensityPalette||!globalThis.PlotDisplay){$('people-list').textContent='档案或成果数据未生成。请运行 node scripts/build_breakthrough.cjs。';return;}
  const params=new URLSearchParams(location.hash.slice(1));
  const state={lang:params.get('lang')==='en'?'en':'zh',query:params.get('q')||'',field:'all',active:null,dossier:null,insight:null};
  const byId=new Map(archive.people.map(p=>[p.id,p])),eventsById=new Map(data.events.map(e=>[e.id,e]));
  const estimateByPerson=new Map((data.navigationEstimates||[]).map(r=>[r.personId,r]));
  const anchors=data.anchors,people=archive.people.slice().sort((a,b)=>(anchors[a.id]?.year??Infinity)-(anchors[b.id]?.year??Infinity)||a.order-b.order);
  const yearMap=new Map(data.series.map(p=>[p.year,p]));
  const text={
    zh:{skip:'跳到人物列表',brand:'物理学先驱',indexTitle:'物理学突破指数',density:'贡献人物密度',reading:'贡献年代',axisFoot:'贡献年代 · 自适应时间轴',eyebrow:'PHYSICS · HISTORY · PEOPLE',title:'物理学先驱档案',search:'搜索姓名或研究领域',field:'研究领域',contributionYear:'贡献年',person:'人物',noResults:'没有匹配的人物',noResultsHint:'尝试其他姓名或研究领域。',dossier:'人物档案',allFields:'全部领域',read:'查看完整档案',born:'出生',died:'逝世',status:'状态',living:'在世',unknown:'下落／死亡时间不详',deathUnknown:'逝世日期不详',bio:'生平简介',contribution:'主要物理贡献',notes:'史料与日期说明',sources:'参考来源',imageCredits:'图像说明、来源与署名',context:'相关资料图',later:'后世或纪念形象',permission:'再发布授权尚未确认；公开使用前需确认授权或更换图片。',originalImage:'查看原图来源',reviewed:'资料日期',pending:'贡献年代',pendingShort:'—',milestones:'关联成果',yearly:'年度概览',raw:'年度原始值',smoothed:'综合指数',weighted:'突破指数 · asinh',contributorUnit:'人／年',provisional:'暂定',weight:'权重',theory:'理论',discovery:'实验与发现',method:'方法',close:'关闭',methodTitle:'资料与期刊来源',noEvents:'该年没有收录到可确切定年的成果。',nearby:'邻近年代的成果',dateUnknown:'史料未给出确切年代',approx:'约年；按来源所给年份定位',reviewStatus:'评分为本站编辑尺度，每项均保留依据。'},
    en:{skip:'Skip to people',brand:'Physics Pioneers',indexTitle:'Breakthrough index',density:'Contributor density',reading:'Contribution years',axisFoot:'Contribution years · Adaptive timeline',eyebrow:'PHYSICS · HISTORY · PEOPLE',title:'Physics Pioneers Archive',search:'Search names or research fields',field:'Research fields',contributionYear:'Year',person:'Person',noResults:'No matching people',noResultsHint:'Try another name or research field.',dossier:'Dossier',allFields:'All fields',read:'Read full dossier',born:'Born',died:'Died',status:'Status',living:'Living',unknown:'Death date or whereabouts uncertain',deathUnknown:'Death date unknown',bio:'Biography',contribution:'Major contributions to physics',notes:'Historical and source notes',sources:'Sources',imageCredits:'Image, source and attribution',context:'Related illustration',later:'Later or commemorative depiction',permission:'Republication permission is unverified. Confirm permission or replace the image before public use.',originalImage:'Original image record',reviewed:'Data reviewed',pending:'Contribution years',pendingShort:'—',milestones:'Linked milestones',yearly:'Year in physics',raw:'Raw annual value',smoothed:'Historical index',weighted:'Index · asinh',contributorUnit:'people / year',provisional:'Provisional',weight:'Weight',theory:'Theory',discovery:'Experiment & discovery',method:'Method',close:'Close',methodTitle:'Records and journal sources',noEvents:'No reliably dated event is recorded for this year.',nearby:'Nearby milestones',dateUnknown:'No exact date in the historical record',approx:'Approximate year, located at the source estimate',reviewStatus:'Weights are editorial assessments with recorded evidence.'}
  };
  const formatIndex=index.formatIndex;
  const t=k=>text[state.lang][k],pane=$('list-scroll'),workspace=document.querySelector('.workspace'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const imagePath=p=>'../dist/'+p.portrait.path;
  const link=(url,label)=>'<a href="'+((/^https?:\/\//.test(url||'')||/^data\/(?:[a-z-]+\.json|method\.(?:zh|en)\.md)$/.test(url||''))?esc(url):'#')+'" target="_blank" rel="noopener noreferrer">'+esc(label)+'</a>';
  const yearLabel=y=>y<0?(state.lang==='zh'?'前'+Math.abs(y):Math.abs(y)+' BCE'):String(y);
  function eventDate(e){if(!e)return '—';const span=index.spanOf(e);if(!span)return t('dateUnknown');return span[0]===span[1]?yearLabel(span[0])+(e.precision==='approximate'?'†':''):yearLabel(span[0])+'–'+yearLabel(span[1]);}
  function anchorDate(p){const a=anchors[p.id];if(!a)return '—';return (a.estimated||a.precision!=='year'?(state.lang==='zh'?'约':'c. '):'')+yearLabel(a.year);}
  const importanceStyle=e=>'color:'+index.importanceColor(e?.indexEligible===false?1:index.scoreOf(e));
  const byImportance=(a,b)=>index.scoreOf(b)-index.scoreOf(a)||(index.spanOf(a)?.[0]??Infinity)-(index.spanOf(b)?.[0]??Infinity)||a.id.localeCompare(b.id);
  const byYearImportance=(a,b)=>index.scoreOf(b)-index.scoreOf(a)||(Number(index.spanOf(b)?.[0]===index.spanOf(b)?.[1])-Number(index.spanOf(a)?.[0]===index.spanOf(a)?.[1]))||byImportance(a,b);
  function activeRanges(e){const span=index.spanOf(e);return span?(e.dateModel?.allocations||[{start:span[0],end:span[1]}]):[];}
  function nearbyEvents(year){const n=index.serial(year),radius=year<1600?50:10;return data.events.filter(e=>!e.supersededBy&&e.indexEligible!==false&&index.spanOf(e)).map(e=>({e,d:Math.min(...activeRanges(e).map(s=>Math.max(index.serial(s.start)-n,n-index.serial(s.end),0)))})).filter(x=>x.d>0&&x.d<=radius).sort((a,b)=>a.d-b.d||byImportance(a.e,b.e)).slice(0,3).map(x=>x.e);}
  function eventMini(e){return '<button class="event-mini" data-event="'+e.id+'"><span class="event-title" style="'+importanceStyle(e)+'">'+esc(e.title[state.lang])+'</span><span class="event-mini-date">'+esc(eventDate(e))+'</span></button>';}
  function profileContribution(p){const estimate=estimateByPerson.get(p.id),year=anchors[p.id]?.year;if(estimate?.biographicalYearClues?.includes(year)){const term=String(Math.abs(year));const match=p.contributions[state.lang].find(c=>c.includes(term));if(match)return match;}return p.contributions[state.lang][0];}
  function deathDisplay(p){return p.death?p.death.display[state.lang]:p.deathStatus==='alive'?t('living')+' ('+archive.asOf+')':p.deathStatus==='unknown'?t('unknown'):t('deathUnknown');}
  const kindLabel=p=>p.portrait.kind==='context_image'?t('context'):p.portrait.kind==='posthumous_depiction'?t('later'):'';
  const getRow=id=>id?document.getElementById('row-'+id):null;
  const rowYear=row=>row.dataset.navYear!==undefined?Number(row.dataset.navYear):anchors[row.dataset.id]?.year;
  const calendarMin=data.minYear,calendarMax=data.maxYear;
  let filtered=people,rowNodes=[],contentRows=[],datedRows=[],model,scrollMap,cursorYear=data.minYear,geometryDirty=true,syncFrame=0,hoverTimer=0,inputTimer=0,lastHover=null,pointerMode='mouse',seek=null,seekFrame=0,drag=null,dragFrame=0,openerId=null,lastFocused=null,yearCardYear=null;
  const portraitCache=new Map();
  function warmPortraits(bounds){if(!bounds)return;for(const row of contentRows.slice(Math.max(0,bounds[0]-2),bounds[1]+3)){const id=row.dataset.id;if(!id||portraitCache.has(id))continue;const image=new Image();image.decoding='async';image.src=imagePath(byId.get(id));portraitCache.set(id,image);if(portraitCache.size>24)portraitCache.delete(portraitCache.keys().next().value);}}
  // Final-image smoothing only, measured in vertical screen pixels. Set 0 to disable.
  const PLOT_SMOOTHING_SIGMA=1;
  let plot={width:190,height:400,x:54,right:184,bottom:350};
  const previewDuration=220,previewMotions=new Map();
  let previewFrame=0,hoverLockUntil=0,lastPointer=null,lastRowBase=48;
  const rowBase=()=>parseFloat(getComputedStyle($('people-list')).getPropertyValue('--row-height'))||48;
  const rowExtra=()=>parseFloat(getComputedStyle($('people-list')).getPropertyValue('--preview-extra'))||88;
  function balancePreviewRows(){
    const now=performance.now(),base=rowBase();let total=0,running=false;
    for(const [id,motion] of previewMotions){
      const row=getRow(id);if(!row){previewMotions.delete(id);continue;}
      const t=reduced.matches?1:Math.min(1,(now-motion.start)/previewDuration);
      const extra=Math.round(motion.from+(motion.to-motion.from)*(1-(1-t)**3));
      motion.current=extra;row.style.height=(base+extra)+'px';total+=extra;
      if(t<1)running=true;else if(!motion.to){row.style.height='';row.classList.remove('is-closing','preview-above');row.querySelector('.row-preview').innerHTML='';previewMotions.delete(id);}
    }
    $('people-list').style.paddingBottom=(20+rowExtra()-total)+'px';
    geometryDirty=true;previewFrame=running?requestAnimationFrame(balancePreviewRows):0;
  }
  function movePreview(id,target,immediate=false){
    const row=getRow(id);if(!row)return;const old=previewMotions.get(id),current=old?.current||0;
    previewMotions.set(id,{from:immediate?target:current,to:target,current:immediate?target:current,start:performance.now()-(immediate?previewDuration:0)});
    if(!previewFrame)previewFrame=requestAnimationFrame(balancePreviewRows);
  }
  function settlePreviews(){
    if(previewFrame)cancelAnimationFrame(previewFrame);previewFrame=0;
    for(const [id] of previewMotions){const row=getRow(id);if(row){row.style.height='';row.classList.remove('is-closing','preview-above');row.querySelector('.row-preview').innerHTML='';}}
    previewMotions.clear();$('people-list').style.paddingBottom=(20+rowExtra())+'px';geometryDirty=true;
  }
  function eventsAt(year,radius=0){const n=index.serial(year);return data.events.filter(e=>!e.supersededBy&&activeRanges(e).some(s=>index.serial(s.start)<=n+radius&&index.serial(s.end)>=n-radius));}
  function rowMarkup(p){return '<article class="person-row" id="row-'+p.id+'" data-id="'+p.id+'"><button type="button" class="row-heading" data-person="'+p.id+'" aria-label="'+esc(p.names[state.lang])+'" aria-expanded="false" aria-controls="preview-'+p.id+'"><span class="row-year" title="'+esc(eventsById.get(anchors[p.id]?.eventId)?.title[state.lang]||profileContribution(p))+'">'+esc(anchorDate(p))+'</span><span class="row-name">'+esc(p.names[state.lang])+'</span><span class="row-fields" title="'+esc(p.fields[state.lang].join(' · '))+'">'+esc(p.fields[state.lang].slice(0,2).join(' · '))+'</span><span class="row-chevron" aria-hidden="true">›</span></button><div class="row-preview" id="preview-'+p.id+'" aria-hidden="true" inert></div></article>';}
  function activate(id,immediate=false){
    if(state.active===id){if(immediate)settlePreviews();return;}
    const oldId=state.active,old=getRow(oldId);
    if(old){old.classList.remove('is-active');old.classList.add('is-closing');old.querySelector('.row-heading').setAttribute('aria-expanded','false');const detail=old.querySelector('.row-preview');detail.setAttribute('aria-hidden','true');detail.inert=true;movePreview(oldId,0,immediate);}
    state.active=id;lastHover=id;
    if(!id){if(immediate)settlePreviews();return;}
    const p=byId.get(id),row=getRow(id);if(!p||!row)return;
    const e=data.events.filter(e=>!e.supersededBy&&e.indexEligible!==false&&e.people.includes(id)).sort(byImportance)[0]||eventsById.get(anchors[id]?.eventId);
    const detail=row.querySelector('.row-preview');
    detail.innerHTML='<button class="inline-portrait" data-open="'+id+'" aria-label="'+esc(t('read')+' · '+p.names[state.lang])+'"><img src="'+esc(imagePath(p))+'" alt="'+esc(p.portrait.alt[state.lang])+'" decoding="async"></button><div class="inline-info"><p class="inline-dates">'+esc(t('born')+' '+p.birth.display[state.lang])+'<span>·</span>'+esc((p.death?t('died')+' ':'')+deathDisplay(p))+'</p><p class="inline-contribution"'+(e?' style="'+importanceStyle(e)+'"':'')+'>'+esc(e?e.title[state.lang]:profileContribution(p))+'</p><button class="inline-open" data-open="'+id+'">'+esc(t('read'))+' →</button>'+(kindLabel(p)?'<span class="inline-image-note">'+esc(kindLabel(p))+'</span>':'')+'</div>';
    detail.setAttribute('aria-hidden','false');detail.inert=false;row.classList.remove('is-closing');
    const r=row.getBoundingClientRect(),bounds=pane.getBoundingClientRect();row.classList.toggle('preview-above',r.top+rowBase()+rowExtra()>bounds.bottom&&r.top-rowExtra()>=bounds.top+30);
    row.classList.add('is-active');row.querySelector('.row-heading').setAttribute('aria-expanded','true');
    hoverLockUntil=performance.now()+(reduced.matches?0:previewDuration);movePreview(id,rowExtra(),immediate);
  }
  function refreshGeometry(){
    datedRows=contentRows.filter(row=>Number.isFinite(rowYear(row)));
    const points=datedRows.map(row=>({year:rowYear(row),offset:Math.max(0,row.offsetTop-30)}));
    const last=datedRows[datedRows.length-1],max=Math.max(0,Math.min(pane.scrollHeight-pane.clientHeight,last?last.offsetTop-30:0));
    scrollMap=ReviewScroll.createScrollMap(points,max);geometryDirty=false;
    $('axis-wrap').setAttribute('aria-disabled','false');$('axis-wrap').setAttribute('aria-valuemin',calendarMin);$('axis-wrap').setAttribute('aria-valuemax',calendarMax);
  }
  function visibleBounds(){const top=pane.scrollTop+30,bottom=pane.scrollTop+pane.clientHeight;let first=0;while(first<contentRows.length-1&&contentRows[first].offsetTop+contentRows[first].offsetHeight<top)first++;let last=first;while(last<contentRows.length-1&&contentRows[last+1].offsetTop<bottom)last++;return contentRows.length?[first,last]:null;}

  function showYearCard(year){
    if(year===yearCardYear)return;yearCardYear=year;
    const exact=eventsAt(year).filter(e=>e.indexEligible!==false).sort(byYearImportance),events=exact.length?exact.slice(0,3):nearbyEvents(year);
    const label=exact.length?(state.lang==='zh'?'主要成果':'Major milestones'):t('nearby');
    $('year-card').innerHTML='<h2>'+esc(yearLabel(year)+' · '+label)+'</h2>'+(events.length?events.map(eventMini).join(''):'<p class="no-events">'+esc(t('noEvents'))+'</p>');
  }

  function syncReading(override){
    if(geometryDirty||!scrollMap)refreshGeometry();if(!model)return;
    const bounds=visibleBounds();warmPortraits(bounds);
    const visible=bounds?contentRows.slice(bounds[0],bounds[1]+1).map(rowYear).filter(Number.isFinite):[];
    const explicit=override!==undefined;
    const dated=visible.length>0||explicit;
    if(dated){cursorYear=explicit?override:scrollMap.yearForOffset(pane.scrollTop);const y=model.scaleYear(cursorYear);$('axis-thumb').setAttribute('transform','translate(0 '+y+')');$('cursor-line').setAttribute('y1',y);$('cursor-line').setAttribute('y2',y);}
    $('axis-thumb').setAttribute('opacity',dated?'1':'0');$('cursor-line').setAttribute('opacity',dated?'.75':'0');
    let year=Math.floor(cursorYear+1e-7);if(!explicit&&dated){let nearest=null;for(const a of scrollMap.anchors){const distance=Math.abs(a.offset-pane.scrollTop);if(!nearest||distance<nearest.distance)nearest={year:a.year,distance};}if(nearest?.distance<.75)year=nearest.year;}if(year===0)year=1;
    $('axis-year').textContent=dated?yearLabel(year):(filtered.length?t('pendingShort'):'—');$('year-detail').disabled=!dated;$('axis-wrap').setAttribute('aria-valuenow',cursorYear);$('axis-wrap').setAttribute('aria-valuetext',dated?yearLabel(year):t('pending'));
    if(dated)showYearCard(year);else{$('year-card').innerHTML='';yearCardYear=null;}
    $('reading-range').textContent=visible.length?yearLabel(visible[0])+(visible[0]===visible.at(-1)?'':'–'+yearLabel(visible.at(-1))):t('pendingShort');
    if(visible.length){const y0=model.scaleYear(visible[0]),y1=model.scaleYear(visible.at(-1));$('view-band').setAttribute('y',y0-2);$('view-band').setAttribute('height',Math.max(5,y1-y0+4));}else $('view-band').setAttribute('height','0');
  }

  function scheduleSync(refresh=false){geometryDirty||=refresh;if(syncFrame)return;syncFrame=requestAnimationFrame(()=>{syncFrame=0;if(!drag&&!seek)syncReading();});}
  function densityColor(d,max){return DensityPalette.color(max?d/max:0);}
  function renderAxis(preserveYear=false){
    const width=Math.max(140,$('axis-wrap').clientWidth),height=Math.max(235,$('axis-wrap').clientHeight);plot={width,height,x:53,right:width-7,bottom:height-43};
    const calendarPoints=data.events.flatMap(e=>{const s=index.spanOf(e);return s?[{sortYear:s[0]},{sortYear:s[1]}]:[];});
    calendarPoints.push({sortYear:calendarMin},{sortYear:calendarMax},...Object.values(anchors).map(a=>({sortYear:a.year})));model=ReviewTimeline.createTimeline(calendarPoints,{top:12,bottom:plot.bottom,minTickGap:32,exactBounds:true});
    const peak=Math.max(.1,...data.series.map(p=>p.value)),xStep=ReviewTimeline.niceStep(peak/6),max=Math.ceil(peak/xStep)*xStep,maxDensity=Math.max(.01,...data.series.map(p=>p.density)),span=plot.right-plot.x;
    const samples=[];for(let y=12;y<plot.bottom;y++){const end=Math.min(y+1,plot.bottom),year=model.yearAt((y+end)/2),segmentId=model.segments.findIndex(s=>year<=s.to);samples.push({...index.samplePixel(data.series,model.yearAt(y),model.yearAt(end)),y,height:end-y,segmentId});}
    const displaySamples=PlotDisplay.smoothSamples(samples,{sigma:PLOT_SMOOTHING_SIGMA});
    const bars=displaySamples.map(stats=>'<rect class="hist-bin" x="'+plot.x+'" y="'+stats.y+'" width="'+index.asinhScale(stats.value,max,span,data.display?.knee||1)+'" height="'+stats.height+'" fill="'+densityColor(stats.density,maxDensity)+'" stroke="none" shape-rendering="crispEdges"/>').join('');

    const ticks=model.ticks.map(q=>'<line x1="'+(plot.x-4)+'" x2="'+plot.x+'" y1="'+q.y+'" y2="'+q.y+'" stroke="#8d858d" stroke-width=".7"/><text data-year="'+q.year+'" x="'+(plot.x-8)+'" y="'+(q.y+3.2)+'" text-anchor="end" font-size="10.5" fill="#766b78">'+esc(yearLabel(q.year))+'</text>').join('');
    const minors=model.minorTicks.map(q=>'<line x1="'+(plot.x-2)+'" x2="'+plot.x+'" y1="'+q.y+'" y2="'+q.y+'" stroke="#aaa2ac" stroke-width=".65"/>').join('');
    const breaks=model.segments.slice(1).map(s=>'<path d="M'+(plot.x-3)+' '+(s.top-3)+' l6 3 m-6 0 l6 3" stroke="#776f79" stroke-width="1" fill="none"/>').join('');
    const xValues=[0,...[.25,1,4,16,64,256,1024].filter(v=>v<=max)];if(xValues.at(-1)<max/1.8)xValues.push(max);
    let lastTick=-Infinity;const xticks=xValues.map(n=>{const x=plot.x+index.asinhScale(n,max,span,data.display?.knee||1);if(x-lastTick<22)return '';lastTick=x;return '<line x1="'+x+'" x2="'+x+'" y1="'+(height-32)+'" y2="'+(height-28)+'" stroke="#a49aa8" stroke-width=".7"/><text x="'+x+'" y="'+(height-16)+'" text-anchor="middle" font-size="9" fill="#817286">'+n+'</text>';}).join('');
    $('time-axis').setAttribute('viewBox','0 0 '+width+' '+height);$('time-axis').innerHTML='<rect id="view-band" x="'+(plot.x-5)+'" width="'+(span+5)+'" y="12" height="0" rx="3" fill="#29222c08"/>'+bars+'<line x1="'+plot.x+'" x2="'+plot.x+'" y1="12" y2="'+plot.bottom+'" stroke="#9c929f" stroke-width=".75"/>'+ticks+minors+breaks+'<line x1="'+plot.x+'" x2="'+plot.right+'" y1="'+(height-32)+'" y2="'+(height-32)+'" stroke="#b5abb9" stroke-width=".7"/>'+xticks+'<text x="'+((plot.x+plot.right)/2)+'" y="'+(height-2)+'" text-anchor="middle" font-size="8.5" fill="#8a7a90">'+esc(t('weighted'))+'</text><line id="cursor-line" x1="'+(plot.x+7)+'" x2="'+plot.right+'" y1="12" y2="12" stroke="#df2434" stroke-width=".7"/><g id="axis-thumb" pointer-events="none"><circle cx="'+(plot.x+6)+'" cy="0" r="4" fill="#df2434" stroke="#fff" stroke-width="2"/></g>';
    renderDensityLegend(maxDensity);syncReading(preserveYear?(yearCardYear??Math.round(cursorYear)):undefined);
  }
  function renderDensityLegend(max){
    const svg=$('density-scale'),width=Math.max(140,svg.clientWidth),left=10,right=width-10,y=6,h=13,edge=y+h,span=right-left;
    const ticks=PlotDisplay.colorbarTicks(max,{integers:true}).map(tick=>{const x=left+tick.position*span;return '<line class="density-tick" x1="'+x+'" x2="'+x+'" y1="'+edge+'" y2="'+(edge+4)+'" stroke="#555" stroke-width=".7"/><text x="'+x+'" y="35" text-anchor="middle">'+esc(tick.label)+'</text>';}).join('');
    svg.setAttribute('viewBox','0 0 '+width+' 42');svg.setAttribute('aria-label',t('density')+' · 0–'+max.toFixed(1)+' '+t('contributorUnit'));
    svg.innerHTML='<defs><linearGradient id="density-gradient"><stop offset="0%" stop-color="rgb(230,230,230)"/><stop offset="25%" stop-color="rgb(38,38,38)"/><stop offset="100%" stop-color="rgb(255,0,0)"/></linearGradient></defs><rect class="density-ramp" x="'+left+'" y="'+y+'" width="'+span+'" height="'+h+'" fill="url(#density-gradient)" stroke="#777" stroke-width=".5"/>'+ticks;
    $('density-unit').textContent=t('contributorUnit');
  }
  function renderList(preserve=false){
    cancelSeek();clearTimeout(hoverTimer);const oldTop=pane.scrollTop,active=state.active;activate(null,true);lastHover=null;
    filtered=core.filterPeople(people,{query:state.query,field:state.field,era:'all'});
    const groups=new Map();for(const p of filtered){const y=anchors[p.id].year,key=Math.floor(y/100)*100;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(p);}
    const unrestricted=!state.query&&state.field==='all';
    const anchorYears=filtered.map(p=>anchors[p.id]?.year).filter(Number.isFinite),first=anchorYears.length?Math.min(...anchorYears):null,last=anchorYears.length?Math.max(...anchorYears):null;
    function yearRow(year){const e=eventsAt(year).filter(e=>e.indexEligible!==false).sort(byYearImportance)[0];return '<article class="year-row" data-nav-year="'+year+'"><button class="row-heading" data-year-detail="'+year+'"><span class="row-year">'+esc(yearLabel(year))+'</span><span class="row-name"'+(e?' style="'+importanceStyle(e)+'"':'')+'>'+esc(e?e.title[state.lang]:t('yearly'))+'</span><span class="row-fields"></span><span class="row-chevron" aria-hidden="true">↗</span></button></article>';}
    const head=unrestricted&&first!==null&&calendarMin<first?yearRow(calendarMin):'';
    let tail='';if(unrestricted&&last!==null&&calendarMax>last){tail='<section class="period"><h2 class="period-heading"><strong>'+esc(t('yearly'))+'</strong><span class="period-rule"></span></h2>';for(let y=last+1;y<=calendarMax;y++){if(y!==0)tail+=yearRow(y);}tail+='</section>';}
    let html=head;for(const [key,ps] of groups){html+='<section class="period"><h2 class="period-heading"><strong>'+esc(yearLabel(key===0?1:key)+'–'+yearLabel(key+99))+'</strong><span class="period-rule"></span><span>'+ps.length+'</span></h2>'+ps.map(rowMarkup).join('')+'</section>';}
    html+=tail;$('people-list').innerHTML=html;lastRowBase=rowBase();settlePreviews();
    rowNodes=Array.from(document.querySelectorAll('.person-row'));contentRows=Array.from(document.querySelectorAll('.person-row,.year-row'));$('empty').hidden=!!filtered.length;$('clear-query').hidden=!state.query;
    $('result-status').textContent=state.lang==='zh'?filtered.length+' 位人物':filtered.length+(filtered.length===1?' person':' people');pane.scrollTop=preserve?oldTop:0;refreshGeometry();renderAxis();if(preserve&&getRow(active))activate(active);
  }
  function stopDriver(){workspace.dataset.scrollDriver='list';}
  function cancelSeek(){if(seekFrame)cancelAnimationFrame(seekFrame);seekFrame=0;seek=null;if(!drag)stopDriver();}
  function seekYear(year,animate=true){
    cancelSeek();activate(null,true);clearTimeout(hoverTimer);refreshGeometry();const targetYear=Math.max(calendarMin,Math.min(calendarMax,year)),target=scrollMap.offsetForYear(targetYear);
    if(!animate||reduced.matches){pane.scrollTop=target;syncReading(targetYear);return;}
    workspace.dataset.scrollDriver='axis';seek={from:pane.scrollTop,target,targetYear,fromYear:cursorYear,start:performance.now()};
    function step(now){if(!seek)return;const elapsed=Math.min(1,(now-seek.start)/300);pane.scrollTop=seek.from+(seek.target-seek.from)*(1-(1-elapsed)**3);syncReading(seek.fromYear+(seek.targetYear-seek.fromYear)*(1-(1-elapsed)**3));if(elapsed<1)seekFrame=requestAnimationFrame(step);else{const finalYear=seek.targetYear;seek=null;seekFrame=0;stopDriver();syncReading(finalYear);}}seekFrame=requestAnimationFrame(step);
  }
  function pointerYear(event,label=false){if(label){const node=event.target.closest('[data-year]');if(node)return Number(node.dataset.year);}const point=new DOMPoint(event.clientX,event.clientY).matrixTransform($('time-axis').getScreenCTM().inverse());return model.yearAt(point.y-(drag?.grabOffset??0));}
  function applyDrag(){dragFrame=0;if(!drag||drag.phase!=='drag')return;pane.scrollTop=scrollMap.offsetForYear(drag.targetYear);syncReading(drag.targetYear);}
  function beginDrag(event){if(event.button!==0)return;event.preventDefault();cancelSeek();clearTimeout(hoverTimer);activate(null,true);refreshGeometry();const point=new DOMPoint(event.clientX,event.clientY).matrixTransform($('time-axis').getScreenCTM().inverse());const near=Math.abs(point.y-model.scaleYear(cursorYear))<14&&Math.abs(point.x-(plot.x+6))<18;drag={pointerId:event.pointerId,startY:event.clientY,phase:near?'drag':'pressed',grabOffset:near?point.y-model.scaleYear(cursorYear):0,targetYear:cursorYear};drag.targetYear=Math.max(calendarMin,Math.min(calendarMax,pointerYear(event,!near)));workspace.dataset.scrollDriver='axis';$('axis-wrap').classList.add('is-dragging');$('axis-tooltip').hidden=true;$('axis-wrap').setPointerCapture(event.pointerId);if(near)dragFrame=requestAnimationFrame(applyDrag);}
  function moveAxis(event){if(!model)return;if(drag&&drag.pointerId===event.pointerId){event.preventDefault();if(Math.abs(event.clientY-drag.startY)>2)drag.phase='drag';if(drag.phase==='drag'){drag.targetYear=Math.max(calendarMin,Math.min(calendarMax,pointerYear(event)));if(!dragFrame)dragFrame=requestAnimationFrame(applyDrag);}return;}let year=Math.round(pointerYear(event,true));if(year===0)year=1;const p=yearMap.get(year);$('axis-tooltip').textContent=yearLabel(year);$('axis-tooltip').style.top=Math.max(0,Math.min(plot.height-30,event.clientY-$('axis-wrap').getBoundingClientRect().top-12))+'px';$('axis-tooltip').hidden=false;}
  function finishDrag(event){if(!drag||drag.pointerId!==event.pointerId)return;if(dragFrame)cancelAnimationFrame(dragFrame);dragFrame=0;const {phase,pointerId,targetYear}=drag;if(phase==='drag')applyDrag();drag=null;if($('axis-wrap').hasPointerCapture(pointerId))$('axis-wrap').releasePointerCapture(pointerId);$('axis-wrap').classList.remove('is-dragging');stopDriver();if(phase==='pressed')seekYear(targetYear);else syncReading(targetYear);}
  function listTakesControl(){if(drag)return;cancelSeek();clearTimeout(hoverTimer);lastHover=null;}
  function sourceMarkup(p){return p.sources[state.lang].map(s=>'<li>'+link(s.url,s.title)+'</li>').join('');}
  function originalDossierMarkup(p){const lang=state.lang,photo=p.portrait;return '<header class="dossier-heading"><div><h2 id="dossier-name">'+esc(p.names[lang])+'</h2><p class="dossier-fields">'+esc(p.fields[lang].join(' · '))+'</p></div><figure class="dossier-portrait"><img src="'+esc(imagePath(p))+'" alt="'+esc(photo.alt[lang])+'"></figure></header>'+(photo.kind!=='portrait'?'<p class="visible-image-note"><strong>'+esc(kindLabel(p))+'</strong> '+esc(photo.note[lang])+'</p>':'')+(p.nobelYears.length?'<p class="dossier-award">'+(lang==='zh'?'诺贝尔物理学奖':'Nobel Prize in Physics')+' · '+p.nobelYears.join(', ')+'</p>':'')+'<dl class="dossier-dates"><div><dt>'+esc(t('born'))+'</dt><dd>'+esc(p.birth.display[lang])+'</dd></div><div><dt>'+esc(t(p.death?'died':'status'))+'</dt><dd>'+esc(deathDisplay(p))+'</dd></div></dl><section class="dossier-section"><h3>'+esc(t('bio'))+'</h3><p>'+esc(p.biography[lang])+'</p></section><section class="dossier-section"><h3>'+esc(t('contribution'))+'</h3><ul>'+p.contributions[lang].map(c=>'<li>'+esc(c)+'</li>').join('')+'</ul></section>'+(p.notes[lang].length?'<section class="dossier-section dossier-notes"><h3>'+esc(t('notes'))+'</h3><ul>'+p.notes[lang].map(n=>'<li>'+esc(n)+'</li>').join('')+'</ul></section>':'')+'<section class="dossier-section"><h3>'+esc(t('sources'))+'</h3><ol>'+sourceMarkup(p)+'</ol></section><details class="dossier-image"><summary>'+esc(t('imageCredits'))+'</summary><p>'+esc(photo.note[lang])+'</p><p>'+esc(photo.artist[lang]||'')+'</p><p>'+esc(photo.credit[lang]||'')+'</p><p>'+(photo.licenseUrl?link(photo.licenseUrl,photo.license[lang]):esc(photo.license[lang]))+'</p><p>'+link(photo.sourceUrl,t('originalImage'))+'</p>'+(photo.rightsStatus==='permission_required'?'<p class="rights">'+esc(t('permission'))+'</p>':'')+'</details><p class="source-date">'+esc(t('reviewed'))+' '+archive.asOf+'</p>';}
  function eventMarkup(e){return '<article class="event-record" id="event-'+e.id+'"><div class="event-meta">'+esc(eventDate(e)+' · '+t(e.type))+'</div><h3 style="'+importanceStyle(e)+'">'+esc(e.title[state.lang])+'</h3><p>'+esc(e.rationale[state.lang])+'</p>'+(e.dateNote[state.lang]?'<p>'+esc(e.dateNote[state.lang])+'</p>':'')+'<div>'+e.people.map(id=>'<button class="event-person" data-open="'+id+'">'+esc(byId.get(id).names[state.lang])+'</button>').join('')+'</div>'+(e.groups?.length?'<p>'+esc(e.groups.join(' · '))+'</p>':'')+'<ul>'+e.sources.map(s=>'<li>'+link(s.url,s.title)+'</li>').join('')+'</ul></article>';}
  function dossierMarkup(p){const related=data.events.filter(e=>!e.supersededBy&&e.people.includes(p.id)).sort((a,b)=>(index.spanOf(a)?.[0]??Infinity)-(index.spanOf(b)?.[0]??Infinity)||byImportance(a,b));const section=related.length?'<section class="dossier-section"><h3>'+esc(t('milestones'))+'</h3>'+related.map(eventMini).join('')+'</section>':'';return originalDossierMarkup(p).replace('<details class="dossier-image">',section+'<details class="dossier-image">');}
  function openDossier(id){if(!byId.has(id))return;if($('insight').open){$('insight').close();state.insight=null;}clearTimeout(hoverTimer);openerId=id;lastFocused=document.activeElement;state.dossier=id;$('sheet-content').innerHTML=dossierMarkup(byId.get(id));$('sheet-content').scrollTop=0;if(!$('dossier').open)$('dossier').showModal();$('close-dossier').focus();}
  function closeDossier(){$('dossier').close();state.dossier=null;(getRow(openerId)?.querySelector('.row-heading')||(lastFocused?.isConnected?lastFocused:null))?.focus({preventScroll:true});}
  function methodMarkup(){
    const zh=state.lang==='zh',collections=data.journalSources||[];
    return '<h2 id="insight-title">'+esc(t('methodTitle'))+'</h2><div class="method-copy">'+(zh?'<p>成果资料包括原始研究论文、著作、观测手稿、期刊编辑精选及物理学史记录。每项成果按其形成或发现的年代归档，人物完整资料与引用来源保留在档案中。</p><h3>期刊编辑精选</h3>':'<p>Milestone records draw on original papers, books, observational manuscripts, journal selections and histories of physics. Each result is located by its formation or discovery date. Full biographies and references remain in the dossiers.</p><h3>Journal editorial selections</h3>')+'<ul>'+collections.map(c=>'<li>'+link(c.url,c.title)+'</li>').join('')+'</ul><p>'+esc(zh?data.counts.totalPeople+' 位人物 · '+data.counts.events+' 项成果记录':data.counts.totalPeople+' people · '+data.counts.events+' milestone records')+'</p><p>'+link('data/method.'+state.lang+'.md',zh?'计算与维护说明文档':'Calculation and maintenance documentation')+' · '+link('data/yearly-index.json',zh?'逐年数据':'Annual data')+'</p></div>';
  }
  function nearbyPeople(year){
    const n=index.serial(year),radius=index.radiusAt?index.radiusAt(year):5;
    return people.filter(p=>{const a=anchors[p.id];return a&&Math.abs(index.serial(a.year)-n)<=radius;}).sort((a,b)=>Math.abs(anchors[a.id].year-year)-Math.abs(anchors[b.id].year-year)).slice(0,8);
  }
  function peopleMarkup(year){const related=nearbyPeople(year);return related.length?'<section class="dossier-section"><h3>'+esc(state.lang==='zh'?'相关人物':'Related people')+'</h3>'+related.map(p=>'<button class="event-person" data-open="'+p.id+'">'+esc(p.names[state.lang])+'</button>').join('')+'</section>':'';}

  function renderInsight(){const view=state.insight;if(!view)return;let html='';if(view.type==='method'){html=methodMarkup();$('insight-toolbar').textContent=t('indexTitle');}else if(view.type==='event'){const e=eventsById.get(view.id);html='<h2 id="insight-title">'+esc(t('milestones'))+'</h2>'+eventMarkup(e);$('insight-toolbar').textContent=eventDate(e);}else{const year=view.year,exact=eventsAt(year).filter(e=>e.indexEligible!==false).sort(byYearImportance),nearby=nearbyEvents(year);$('insight-toolbar').textContent=state.lang==='zh'?'主要成果':'Major milestones';html='<h2 id="insight-title">'+esc(yearLabel(year)+' · '+t('yearly'))+'</h2>'+(exact.length?exact.map(eventMarkup).join(''):'<p class="insight-lead">'+esc(t('noEvents'))+'</p>')+(nearby.length?'<h3 style="margin-top:25px">'+esc(t('nearby'))+'</h3>'+nearby.map(eventMarkup).join(''):'');} $('insight-content').innerHTML=html;}
  function openInsight(view){state.insight=view;renderInsight();$('insight-content').scrollTop=0;if(!$('insight').open)$('insight').showModal();$('close-insight').focus();}
  function closeInsight(){$('insight').close();state.insight=null;}
  function renderLabels(){document.documentElement.lang=state.lang==='zh'?'zh-CN':'en';document.title=t('title');document.querySelectorAll('[data-label]').forEach(el=>el.textContent=t(el.dataset.label));document.querySelectorAll('[data-language]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.language===state.lang)));$('archive-subtitle').textContent=state.lang==='zh'?people.length+' 位先驱 · '+data.counts.events+' 项物理成果':people.length+' pioneers · '+data.counts.events+' milestones';$('query').placeholder=t('search');$('query').value=state.query;$('clear-query').setAttribute('aria-label',state.lang==='zh'?'清空搜索':'Clear search');$('field').innerHTML='<option value="all">'+esc(t('allFields'))+'</option>'+core.domains.map(d=>'<option value="'+d.id+'">'+esc(d[state.lang])+'</option>').join('');$('field').value=state.field;$('archive-date').textContent=data.asOf.replace(/-/g,'.');$('coverage-status').textContent=state.lang==='zh'?'按主要贡献年代排列': 'Ordered by principal contribution';$('list-scroll').setAttribute('aria-label',state.lang==='zh'?'按贡献年代排列的人物':'People by contribution year');$('axis-wrap').setAttribute('aria-label',state.lang==='zh'?'拖动时间轴定位贡献年代':'Drag the timeline to navigate contribution years');$('year-detail').setAttribute('aria-label',t('yearly'));$('sheet-language').textContent=state.lang==='zh'?'English':'中文';$('close-dossier').setAttribute('aria-label',t('close'));$('close-insight').setAttribute('aria-label',t('close'));yearCardYear=null;}
  function setLanguage(lang){if(lang===state.lang)return;const sheetTop=$('sheet-content').scrollTop;state.lang=lang;renderLabels();renderList(true);if(state.dossier){$('sheet-content').innerHTML=dossierMarkup(byId.get(state.dossier));$('sheet-content').scrollTop=sheetTop;}if(state.insight)renderInsight();}
  document.addEventListener('pointerdown',e=>{pointerMode=e.pointerType;});
  document.addEventListener('keydown',e=>{pointerMode='keyboard';if(e.key==='/'&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)&&!$('dossier').open&&!$('insight').open){e.preventDefault();$('query').focus();}const h=e.target.closest('.row-heading');if(h&&['ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();listTakesControl();const i=filtered.findIndex(p=>p.id===h.dataset.person),p=filtered[i+(e.key==='ArrowDown'?1:-1)];if(p){const el=getRow(p.id).querySelector('.row-heading');el.focus({preventScroll:true});el.scrollIntoView({block:'nearest'});activate(p.id);}}});
  function scheduleHover(){
    clearTimeout(hoverTimer);hoverTimer=setTimeout(()=>{
      if(!lastPointer||drag||seek||$('dossier').open||$('insight').open)return;
      const hit=document.elementFromPoint(lastPointer.x,lastPointer.y),row=hit?.closest('.person-row');
      if(row&&pane.contains(row)&&row.dataset.id!==state.active)activate(row.dataset.id);
    },Math.max(65,hoverLockUntil-performance.now()+20));
  }
  $('people-list').addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||drag||seek)return;pointerMode='mouse';lastPointer={x:e.clientX,y:e.clientY};const row=e.target.closest('.person-row');if(row?.dataset.id===state.active){clearTimeout(hoverTimer);return;}if(!row){clearTimeout(hoverTimer);return;}scheduleHover();});
  $('people-list').addEventListener('focusin',e=>{if(pointerMode==='keyboard'){const h=e.target.closest('.row-heading');if(h)activate(h.dataset.person);}});
  document.querySelector('.archive-body').addEventListener('pointerleave',()=>{clearTimeout(hoverTimer);lastHover=null;if(pointerMode==='keyboard'&&getRow(state.active)?.contains(document.activeElement))return;if(!drag&&!seek)hoverTimer=setTimeout(()=>activate(null),180);});
  document.addEventListener('click',e=>{const language=e.target.closest('[data-language]');if(language){setLanguage(language.dataset.language);return;}const yearEntry=e.target.closest('[data-year-detail]');if(yearEntry){openInsight({type:'year',year:Number(yearEntry.dataset.yearDetail)});return;}const event=e.target.closest('[data-event]');if(event){openInsight({type:'event',id:event.dataset.event});return;}const open=e.target.closest('[data-open]');if(open){openDossier(open.dataset.open);return;}const h=e.target.closest('.row-heading');if(h){if(matchMedia('(hover:none)').matches&&e.detail>0&&state.active!==h.dataset.person)activate(h.dataset.person);else openDossier(h.dataset.person);}});
  pane.addEventListener('scroll',()=>{if(!drag&&!seek)scheduleSync();},{passive:true});pane.addEventListener('wheel',listTakesControl,{passive:true});pane.addEventListener('pointerdown',listTakesControl,{passive:true});pane.addEventListener('touchstart',listTakesControl,{passive:true});
  const layoutObserver=new ResizeObserver(()=>{if(rowBase()!==lastRowBase){clearTimeout(hoverTimer);lastPointer=null;activate(null,true);lastRowBase=rowBase();}scheduleSync(true);});layoutObserver.observe(pane);layoutObserver.observe($('people-list'));
  new ResizeObserver(()=>{if(drag)finishDrag({pointerId:drag.pointerId});requestAnimationFrame(()=>renderAxis(true));}).observe($('axis-wrap'));
  $('axis-wrap').addEventListener('pointerdown',beginDrag);$('axis-wrap').addEventListener('pointermove',moveAxis);$('axis-wrap').addEventListener('pointerup',finishDrag);$('axis-wrap').addEventListener('pointercancel',finishDrag);$('axis-wrap').addEventListener('lostpointercapture',e=>{if(drag)finishDrag(e);});$('axis-wrap').addEventListener('pointerleave',()=>{$('axis-tooltip').hidden=true;});
  $('axis-wrap').addEventListener('wheel',e=>{if(!datedRows.length)return;e.preventDefault();listTakesControl();pane.scrollTop+=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?pane.clientHeight:1);scheduleSync();},{passive:false});
  $('axis-wrap').addEventListener('keydown',e=>{const years=Array.from(new Set([calendarMin,...scrollMap.anchors.map(a=>a.year),calendarMax])).sort((a,b)=>a-b),now=cursorYear;let target;if(e.key==='ArrowDown')target=years.find(y=>y>now)??years.at(-1);else if(e.key==='ArrowUp')target=years.slice().reverse().find(y=>y<now)??years[0];else if(e.key==='Home')target=years[0];else if(e.key==='End')target=years.at(-1);else if(e.key==='PageDown')target=years.find(y=>y>=now+50)??years.at(-1);else if(e.key==='PageUp')target=years.slice().reverse().find(y=>y<=now-50)??years[0];else return;e.preventDefault();seekYear(target);});
  $('query').addEventListener('input',e=>{state.query=e.target.value;clearTimeout(inputTimer);inputTimer=setTimeout(()=>renderList(),100);});$('query').addEventListener('keydown',e=>{if(e.key==='Enter'){clearTimeout(inputTimer);renderList();}});$('field').addEventListener('change',e=>{state.field=e.target.value;clearTimeout(inputTimer);renderList();});$('clear-query').addEventListener('click',()=>{state.query='';$('query').value='';clearTimeout(inputTimer);renderList();$('query').focus();});$('reset-all').addEventListener('click',e=>{e.preventDefault();state.query='';state.field='all';renderLabels();renderList();});
  $('index-method').addEventListener('click',()=>openInsight({type:'method'}));$('year-detail').addEventListener('click',()=>openInsight({type:'year',year:Math.round(cursorYear)||1}));$('close-insight').addEventListener('click',closeInsight);$('insight').addEventListener('cancel',e=>{e.preventDefault();closeInsight();});$('close-dossier').addEventListener('click',closeDossier);$('dossier').addEventListener('cancel',e=>{e.preventDefault();closeDossier();});$('sheet-language').addEventListener('click',()=>setLanguage(state.lang==='zh'?'en':'zh'));
  renderLabels();renderList();if(params.has('year'))requestAnimationFrame(()=>seekYear(Number(params.get('year')),false));if(byId.has(params.get('person')))requestAnimationFrame(()=>openDossier(params.get('person')));
})();
