(function () {
  'use strict';
  const data = globalThis.PHYSICS_ARCHIVE;
  if (!data || !globalThis.ArchiveCore) {
    document.getElementById('timeline-results').textContent = '档案数据未能加载。请保留完整网站文件夹后重试。 / Archive data could not be loaded. Please keep all website files together.';
    return;
  }
  const core = globalThis.ArchiveCore;
  const $ = id => document.getElementById(id);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const PAGE_SIZE = 36;
  const people = data.people;
  const byId = new Map(people.map(person => [person.id,person]));
  const dictionaries = {
    zh:{skip:'跳到人物时间轴',brand:'物理学先驱',fullBrand:'物理学先驱档案',timeline:'人物时间轴',about:'关于档案',heroTitle:'物理学先驱档案',people:'位人物',spanYears:'古代至现代',twoLanguages:'中英双语档案',featured:'档案选读',explore:'EXPLORE THE ARCHIVE',chronology:'按出生时间，从早到晚',searchLabel:'搜索姓名或研究领域',searchPlaceholder:'搜索姓名或研究领域，如：爱因斯坦、量子力学…',clear:'清空搜索',fieldLabel:'研究领域',allFields:'全部领域',eraLabel:'探索年代',allEras:'全部年代',sidebarNote:'每一段物理史，<br>都由具体的人写就。',reset:'重置筛选',noResults:'没有找到相关人物',noResultsHint:'试试中文名、英文名或更宽泛的研究领域。',loadMore:'显示更多人物',endNote:'已显示全部筛选结果。',dossier:'人物档案',close:'关闭',closeProfile:'关闭档案',backTop:'返回顶部',born:'出生',died:'逝世',status:'状态',living:'在世',unknown:'下落／死亡时间不详',deathUnknown:'逝世日期不详',bio:'生平简介',contributions:'对物理的主要贡献',notes:'史料与日期说明',sources:'参考来源',imageSource:'图像来源与署名',creator:'作者／署名',credit:'来源署名',license:'许可／权利说明',originalImage:'查看图像来源 ↗',rightsTitle:'再发布授权待确认',rightsText:'用于公开网页前，请确认图片授权或替换为许可明确的图像。',context:'资料图 · 非本人肖像',posthumous:'后世或纪念形象',portrait:'肖像或含本人图像',viewProfile:'查看完整档案',nobel:'诺贝尔物理学奖',previous:'← 上一位',next:'下一位 →',originalName:'英文名',reviewed:'档案整理日期',aboutTitle:'关于本档案库',aboutIntro:'这里收录古代自然哲学、经典物理与现代物理的重要贡献者。每份档案都包含生平、主要贡献、图片与可追溯的来源，中文和英文共享同一组事实。',aboutDates:'时间轴按出生时间排列，年代分组仅用于浏览。约年、历法差异、生卒争议及失踪状态保留在日期和史料说明中；名录仍可继续扩充。',aboutImages:'部分图像是后世或纪念形象、归属存疑画像、合影或相关文献与仪器，均明确说明。原始图像的作者、来源及权利条件保留在各人物档案中。',archiveCount:'人物档案',languages:'语言版本',sourceDate:'资料整理于',metaCount:'位人物',of:' / '},
    en:{skip:'Skip to the timeline',brand:'Physics Pioneers',fullBrand:'Physics Pioneers Archive',timeline:'The timeline',about:'About the archive',heroTitle:'Physics Pioneers Archive',people:'people',spanYears:'Antiquity to the present',twoLanguages:'Chinese & English',featured:'Selected lives',explore:'EXPLORE THE ARCHIVE',chronology:'Ordered by birth, earliest first',searchLabel:'Search names or fields',searchPlaceholder:'Search names or fields, e.g. Einstein, quantum mechanics…',clear:'Clear search',fieldLabel:'Field',allFields:'All fields',eraLabel:'Explore the eras',allEras:'All eras',sidebarNote:'A history of physics,<br>written through lives.',reset:'Reset filters',noResults:'No matching people found',noResultsHint:'Try a Chinese or English name, or a broader field of research.',loadMore:'Show more people',endNote:'All matching records are shown.',dossier:'Dossier',close:'Close',closeProfile:'Close dossier',backTop:'Back to top',born:'Born',died:'Died',status:'Status',living:'Living',unknown:'Death date or whereabouts uncertain',deathUnknown:'Death date unknown',bio:'Biography',contributions:'Major contributions to physics',notes:'Historical and source notes',sources:'Sources',imageSource:'Image source and attribution',creator:'Creator / attribution',credit:'Credit',license:'Licence / rights statement',originalImage:'View original image record ↗',rightsTitle:'Republication permission unverified',rightsText:'Confirm permission or replace with a suitably licensed image before publishing on a public website.',context:'Related illustration · not a portrait',posthumous:'Later or commemorative depiction',portrait:'Portrait or image containing the subject',viewProfile:'Read the full dossier',nobel:'Nobel Prize in Physics',previous:'← Previous',next:'Next →',originalName:'Chinese name',reviewed:'Record reviewed',aboutTitle:'About this archive',aboutIntro:'Explore contributors to natural philosophy, classical physics and modern physics. Each dossier includes a biography, major contributions, an image and traceable sources. Both language editions share the same verified facts.',aboutDates:'The timeline is ordered by birth date. Era divisions are browsing aids. Approximate dates, historical calendars, conflicting sources and uncertain life status remain explicit. The archive is open to further additions.',aboutImages:'Some images are later depictions, disputed likenesses, group photographs or related documents and instruments. Their nature is labelled, and original creator, source and rights information is retained in every dossier.',archiveCount:'individual dossiers',languages:'language editions',sourceDate:'Reviewed',metaCount:'people',of:' / '}
  };
  let preferred = 'zh';
  try { preferred = localStorage.getItem('physics-pioneers-language') || 'zh'; } catch (_) { /* Local files may restrict storage. */ }
  const state = {lang:preferred === 'en' ? 'en' : 'zh',query:'',field:'all',era:'all',limit:PAGE_SIZE,person:null};
  let filtered = people;
  let searchTimer;
  let openerId = null;
  let aboutOpener = null;
  function t(key) { return dictionaries[state.lang][key]; }
  function safeLink(url) { return /^https?:\/\//i.test(url || '') ? escape(url) : '#'; }
  function link(url,text,className='') { return '<a class="'+className+'" href="'+safeLink(url)+'" target="_blank" rel="noopener noreferrer">'+escape(text)+'</a>'; }
  function imageType(person) { return t(person.portrait.kind === 'context_image' ? 'context' : person.portrait.kind === 'posthumous_depiction' ? 'posthumous' : 'portrait'); }
  function lifeStatus(person) {
    if (person.death) return person.death.display[state.lang];
    const value = person.deathStatus === 'alive' ? t('living') : person.deathStatus === 'unknown' ? t('unknown') : t('deathUnknown');
    return value + (person.deathStatus === 'alive' ? (state.lang === 'zh' ? '（截至'+data.asOf+'）' : ' (as of '+data.asOf+')') : '');
  }
  function setHash(replace=true) {
    const params = new URLSearchParams();
    params.set('lang',state.lang);
    if (state.query.trim()) params.set('q',state.query.trim());
    if (state.field !== 'all') params.set('field',state.field);
    if (state.era !== 'all') params.set('era',state.era);
    if (state.person) params.set('person',state.person);
    const next = '#'+params.toString();
    if (location.hash === next) return;
    try { history[replace ? 'replaceState' : 'pushState'](state.person && !replace ? {archiveDetail:true} : null,'',next); }
    catch (_) { /* Browsing still works when a file host restricts URL updates. */ }
  }
  function readHash() {
    const params = new URLSearchParams(location.hash.slice(1));
    if (['zh','en'].includes(params.get('lang'))) state.lang = params.get('lang');
    state.query = params.get('q') || '';
    state.field = core.domains.some(item => item.id === params.get('field')) ? params.get('field') : 'all';
    state.era = core.eras.some(item => item.id === params.get('era')) ? params.get('era') : 'all';
    state.person = byId.has(params.get('person')) ? params.get('person') : null;
  }
  function applyLabels() {
    document.documentElement.lang = state.lang === 'zh' ? 'zh-CN' : 'en';
    document.title = state.lang === 'zh' ? '物理学先驱档案 · Physics Pioneers' : 'Physics Pioneers — The Archive';
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const value = t(element.dataset.i18n);
      if (['heroTitle','sidebarNote'].includes(element.dataset.i18n)) element.innerHTML = value;
      else element.textContent = value;
    });
    document.querySelectorAll('[data-lang]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.lang === state.lang)));
    $('search-input').placeholder = t('searchPlaceholder');
    $('clear-search').setAttribute('aria-label',t('clear'));
    $('close-profile').setAttribute('aria-label',t('closeProfile'));
    $('close-about').setAttribute('aria-label',t('close'));
    $('back-to-top').setAttribute('aria-label',t('backTop'));
    $('home-button').setAttribute('aria-label',t('fullBrand'));
    $('era-nav').setAttribute('aria-label',t('eraLabel'));
    document.querySelector('.header-nav').setAttribute('aria-label',state.lang === 'zh' ? '主导航' : 'Main navigation');
    $('hero-description').textContent = state.lang === 'zh' ? '收录'+data.count+'位物理学贡献者的生平、主要贡献与参考资料，按出生时间排列。' : 'Biographies, contributions and sources for '+data.count+' contributors to physics, ordered by birth date.';
    $('total-count').textContent = data.count;
    $('footer-note').textContent = state.lang === 'zh' ? '资料整理于 '+data.asOf+' · 保留原始来源与历史不确定性' : 'Reviewed '+data.asOf+' · Sources and historical uncertainties preserved';
    renderFacets();
  }
  function renderFacets() {
    const domainCounts = new Map(core.domains.map(domain => [domain.id,core.filterPeople(people,{query:state.query,field:domain.id,era:state.era}).length]));
    $('field-select').innerHTML = '<option value="all">'+escape(t('allFields'))+'</option>'+core.domains.map(domain => '<option value="'+domain.id+'">'+escape(domain[state.lang])+' ('+domainCounts.get(domain.id)+')</option>').join('');
    $('field-select').value = state.field;
    const inOtherFilters = core.filterPeople(people,{query:state.query,field:state.field,era:'all'});
    const counts = new Map(core.eras.map(era => [era.id,inOtherFilters.filter(person => core.eraOf(person).id === era.id).length]));
    $('era-nav').innerHTML = '<button class="era-button" type="button" data-era="all" aria-pressed="'+(state.era === 'all')+'"><span>'+escape(t('allEras'))+'</span><span class="era-count">'+inOtherFilters.length+'</span></button>'+core.eras.map(era => '<button class="era-button" type="button" data-era="'+era.id+'" aria-pressed="'+(state.era === era.id)+'"><span>'+escape(era[state.lang])+'<small>'+escape(era.range[state.lang])+'</small></span><span class="era-count">'+counts.get(era.id)+'</span></button>').join('');
    $('era-select').innerHTML = '<option value="all">'+escape(t('allEras'))+' ('+inOtherFilters.length+')</option>'+core.eras.map(era => '<option value="'+era.id+'">'+escape(era[state.lang])+' ('+counts.get(era.id)+')</option>').join('');
    $('era-select').value = state.era;
  }
  function card(person) {
    const lang = state.lang;
    const other = lang === 'zh' ? person.names.en : person.names.zh;
    const label = person.names[lang]+' — '+t('viewProfile');
    return '<article class="person-card"><button type="button" class="card-button" data-person="'+person.id+'" aria-label="'+escape(label)+'"><span class="portrait-frame"><img src="'+escape(person.portrait.path)+'" loading="lazy" decoding="async" alt="'+escape(person.portrait.alt[lang])+'" width="250" height="173">'+(person.portrait.kind !== 'portrait' ? '<span class="portrait-kind">'+escape(imageType(person))+'</span>' : '')+'</span><span class="card-body"><span class="card-date">'+escape(person.birth.display[lang])+'</span><span class="person-name">'+escape(person.names[lang])+'</span><span class="person-other-name" lang="'+(lang === 'zh' ? 'en' : 'zh-CN')+'">'+escape(other)+'</span><span class="person-fields">'+person.fields[lang].slice(0,2).map(field => '<span class="field-tag">'+escape(field)+'</span>').join('')+'</span><span class="person-contribution">'+escape(person.contributions[lang][0])+'</span><span class="card-bottom"><span>'+escape(t('viewProfile'))+'</span><span class="arrow" aria-hidden="true">→</span></span></span></button></article>';
  }
  function renderArchive() {
    filtered = core.filterPeople(people,state);
    const visible = filtered.slice(0,state.limit);
    const shown = visible.length;
    $('results-status').innerHTML = state.lang === 'zh' ? '找到 <strong>'+filtered.length+'</strong> 位人物<span> · 当前显示 '+shown+' 位</span>' : '<strong>'+filtered.length+'</strong> people found<span> · Showing '+shown+'</span>';
    $('clear-search').hidden = !state.query;
    $('reset-filters').hidden = !state.query && state.field === 'all' && state.era === 'all';
    $('empty-state').hidden = filtered.length > 0;
    $('timeline-results').hidden = filtered.length === 0;
    $('timeline-results').innerHTML = core.eras.map(era => {
      const matches = visible.filter(person => core.eraOf(person).id === era.id);
      if (!matches.length) return '';
      return '<section class="era-section" aria-labelledby="era-title-'+era.id+'"><div class="era-section-heading"><h3 id="era-title-'+era.id+'">'+escape(era[state.lang])+'</h3><span>'+escape(era.range[state.lang])+'</span></div><div class="card-grid">'+matches.map(card).join('')+'</div></section>';
    }).join('');
    $('load-more-wrap').hidden = shown >= filtered.length;
    $('load-progress').textContent = state.lang === 'zh' ? '已浏览 '+shown+' / '+filtered.length+' 位人物' : shown+' of '+filtered.length+' people shown';
    $('end-note').hidden = !filtered.length || shown < filtered.length;
    renderFacets();
  }
  function profileMarkup(person) {
    const lang = state.lang;
    const portrait = person.portrait;
    const other = lang === 'zh' ? person.names.en : person.names.zh;
    const sourceList = person.sources[lang].map(source => '<li>'+link(source.url,source.title)+'</li>').join('');
    const selected = filtered.some(p => p.id === person.id) ? filtered : people;
    const index = selected.findIndex(p => p.id === person.id);
    const previous = selected[index - 1];
    const next = selected[index + 1];
    const heading = '<h2 id="profile-name">'+escape(person.names[lang])+'</h2><p class="profile-other-name" lang="'+(lang === 'zh' ? 'en' : 'zh-CN')+'">'+escape(other)+'</p><div class="person-fields">'+person.fields[lang].map(field => '<span class="field-tag">'+escape(field)+'</span>').join('')+'</div><dl class="life-dates"><div><dt>'+escape(t('born'))+'</dt><dd>'+escape(person.birth.display[lang])+'</dd></div><div><dt>'+escape(t(person.death ? 'died' : 'status'))+'</dt><dd>'+escape(lifeStatus(person))+'</dd></div></dl>'+(person.nobelYears.length ? '<p class="nobel-note">'+escape(t('nobel'))+' · '+person.nobelYears.join(', ')+'</p>' : '');
    const imageCredits = '<details class="image-credits"><summary>'+escape(t('imageSource'))+'</summary><dl><div><dt>'+escape(t('creator'))+':</dt><dd>'+escape(portrait.artist[lang] || (lang === 'zh' ? '详见原图来源' : 'See the original image record'))+'</dd></div>'+(portrait.credit[lang] ? '<div><dt>'+escape(t('credit'))+':</dt><dd>'+escape(portrait.credit[lang])+'</dd></div>' : '')+'<div><dt>'+escape(t('license'))+':</dt><dd>'+(portrait.licenseUrl ? link(portrait.licenseUrl,portrait.license[lang]) : escape(portrait.license[lang]))+'</dd></div></dl>'+link(portrait.sourceUrl,t('originalImage'),'image-source-link')+'</details>';
    const visual = '<aside class="profile-visual"><figure class="profile-image"><img src="'+escape(portrait.path)+'" alt="'+escape(portrait.alt[lang])+'"></figure><span class="image-type">'+escape(imageType(person))+'</span><p class="image-caption">'+escape(portrait.note[lang])+'</p>'+imageCredits+(portrait.rightsStatus === 'permission_required' ? '<div class="rights-note"><strong>'+escape(t('rightsTitle'))+'</strong>'+escape(t('rightsText'))+'</div>' : '')+'</aside>';
    const sections = '<section class="profile-section"><h3>'+escape(t('bio'))+'</h3><p>'+escape(person.biography[lang])+'</p></section><section class="profile-section"><h3>'+escape(t('contributions'))+'</h3><ul>'+person.contributions[lang].map(item => '<li>'+escape(item)+'</li>').join('')+'</ul></section>'+(person.notes[lang].length ? '<section class="profile-section historical-notes"><h3>'+escape(t('notes'))+'</h3><ul>'+person.notes[lang].map(item => '<li>'+escape(item)+'</li>').join('')+'</ul></section>' : '')+'<section class="profile-section"><h3>'+escape(t('sources'))+'</h3><ol class="sources-list">'+sourceList+'</ol><p class="review-date">'+escape(t('reviewed'))+': '+data.asOf+'</p></section>';
    return '<div class="profile-layout"><header class="profile-heading">'+heading+'</header>'+visual+'<div class="profile-main">'+sections+'</div></div><nav class="profile-navigation" aria-label="'+(lang === 'zh' ? '浏览相邻档案' : 'Adjacent dossiers')+'"><button type="button" '+(previous ? 'data-adjacent="'+previous.id+'"' : 'disabled')+'><small>'+escape(t('previous'))+'</small>'+escape(previous ? previous.names[lang] : '')+'</button><button type="button" '+(next ? 'data-adjacent="'+next.id+'"' : 'disabled')+'><small>'+escape(t('next'))+'</small>'+escape(next ? next.names[lang] : '')+'</button></nav>';
  }
  function renderProfile(preserveScroll=false) {
    const person = byId.get(state.person);
    if (!person) return;
    const top = preserveScroll ? $('profile-scroll').scrollTop : 0;
    $('profile-content').innerHTML = profileMarkup(person);
    $('profile-scroll').scrollTop = top;
  }
  function showProfile(id, push=true) {
    if (!byId.has(id)) return;
    const wasOpen = $('profile-dialog').open;
    if (!wasOpen) openerId = id;
    state.person = id;
    renderProfile();
    if (!wasOpen) { $('profile-dialog').showModal(); document.body.style.overflow = 'hidden'; }
    if (push) setHash(wasOpen);
    $('close-profile').focus({preventScroll:true});
  }
  function restoreFocus() {
    const button = document.querySelector('.card-button[data-person="'+openerId+'"]');
    if (button) button.focus({preventScroll:true});
    else $('search-input').focus({preventScroll:true});
  }
  function dismissProfile() {
    if ($('profile-dialog').open) $('profile-dialog').close();
    document.body.style.overflow = '';
    restoreFocus();
  }
  function closeProfile() {
    state.person = null;
    setHash();
    dismissProfile();
  }
  function setLanguage(lang) {
    if (state.lang === lang) return;
    state.lang = lang;
    try { localStorage.setItem('physics-pioneers-language',lang); } catch (_) {}
    applyLabels();
    renderArchive();
    if (state.person) renderProfile(true);
    if ($('about-dialog').open) renderAbout();
    setHash();
  }
  function updateFilters() {
    clearTimeout(searchTimer);
    state.limit = PAGE_SIZE;
    renderArchive();
    setHash();
  }
  function resetFilters() {
    state.query = '';state.field = 'all';state.era = 'all';
    $('search-input').value = '';
    updateFilters();
  }
  function renderAbout() {
    $('about-content').innerHTML = '<h2 id="about-title">'+escape(t('aboutTitle'))+'</h2><p>'+escape(t('aboutIntro'))+'</p><div class="about-stats"><div><strong>'+data.count+'</strong><span>'+escape(t('archiveCount'))+'</span></div><div><strong>2</strong><span>'+escape(t('languages'))+'</span></div><div><strong>2600+</strong><span>'+(state.lang === 'zh' ? '年的思想轨迹' : 'years of ideas')+'</span></div></div><p>'+escape(t('aboutDates'))+'</p><p>'+escape(t('aboutImages'))+'</p><p>'+escape(t('sourceDate'))+' '+data.asOf+'.</p>';
  }
  function syncFromHash() {
    const oldLang = state.lang;
    const oldFilters = [state.query,state.field,state.era].join('|');
    readHash();
    if (oldLang !== state.lang) applyLabels();
    if (oldFilters !== [state.query,state.field,state.era].join('|') || oldLang !== state.lang) {
      state.limit = PAGE_SIZE;
      $('search-input').value = state.query;
      renderArchive();
    }
    if (state.person) showProfile(state.person,false);
    else if ($('profile-dialog').open) dismissProfile();
  }
  document.addEventListener('click',event => {
    const langButton = event.target.closest('[data-lang]');
    const personButton = event.target.closest('[data-person]');
    const adjacentButton = event.target.closest('[data-adjacent]');
    const eraButton = event.target.closest('[data-era]');
    if (langButton) setLanguage(langButton.dataset.lang);
    else if (personButton) showProfile(personButton.dataset.person);
    else if (adjacentButton) showProfile(adjacentButton.dataset.adjacent);
    else if (eraButton) {
      state.era = eraButton.dataset.era;
      updateFilters();
      document.querySelector('[data-era="'+state.era+'"]').focus({preventScroll:true});
    }
    else if (event.target.closest('[data-about]')) { aboutOpener=event.target.closest('[data-about]');renderAbout();$('about-dialog').showModal();document.body.style.overflow='hidden'; }
  });
  $('search-input').addEventListener('input',event => {
    state.query = event.target.value;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(updateFilters,110);
  });
  $('search-input').addEventListener('keydown',event => { if (event.key === 'Enter') updateFilters(); });
  $('clear-search').addEventListener('click',() => { state.query='';$('search-input').value='';updateFilters();$('search-input').focus(); });
  $('field-select').addEventListener('change',event => { state.field=event.target.value;updateFilters(); });
  $('era-select').addEventListener('change',event => { state.era=event.target.value;updateFilters(); });
  $('reset-filters').addEventListener('click',resetFilters);
  $('empty-reset').addEventListener('click',resetFilters);
  $('load-more').addEventListener('click',() => {
    const firstNewPerson = filtered[state.limit];
    state.limit += PAGE_SIZE;
    renderArchive();
    if (firstNewPerson) document.querySelector('.card-button[data-person="'+firstNewPerson.id+'"]').focus();
  });
  $('close-profile').addEventListener('click',closeProfile);
  $('profile-dialog').addEventListener('cancel',event => { event.preventDefault();closeProfile(); });
  $('profile-dialog').addEventListener('click',event => {
    if (event.target !== $('profile-dialog')) return;
    const r=$('profile-dialog').getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) closeProfile();
  });
  function closeAbout() { $('about-dialog').close();document.body.style.overflow='';if (aboutOpener) aboutOpener.focus({preventScroll:true}); }
  $('close-about').addEventListener('click',closeAbout);
  $('about-dialog').addEventListener('cancel',event => { event.preventDefault();closeAbout(); });
  $('about-dialog').addEventListener('click',event => {
    if (event.target !== $('about-dialog')) return;
    const r=$('about-dialog').getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) closeAbout();
  });
  $('home-button').addEventListener('click',() => { resetFilters();window.scrollTo({top:0,behavior:'smooth'}); });
  $('timeline-nav').addEventListener('click',event => { event.preventDefault();$('archive').scrollIntoView({behavior:'smooth'}); });
  document.querySelector('.skip-link').addEventListener('click',event => { event.preventDefault();$('search-input').focus();$('archive').scrollIntoView({behavior:'smooth'}); });
  $('back-to-top').addEventListener('click',() => window.scrollTo({top:0,behavior:'smooth'}));
  window.addEventListener('scroll',() => { $('back-to-top').hidden = window.scrollY < 800; },{passive:true});
  window.addEventListener('hashchange',syncFromHash);
  document.addEventListener('keydown',event => {
    if (event.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && !$('profile-dialog').open && !$('about-dialog').open && !event.metaKey && !event.ctrlKey) { event.preventDefault();$('search-input').focus(); }
  });
  readHash();
  $('search-input').value = state.query;
  applyLabels();
  renderArchive();
  if (state.person) showProfile(state.person,false);
})();
