function applyTheme(theme){
  document.body.classList.toggle('light',theme==='light');
  document.querySelectorAll('[data-theme]').forEach(opt=>{
    opt.classList.toggle('active',opt.dataset.theme===theme);
  });
  try{localStorage.setItem('catalina-theme',theme);}catch(e){}
}

function applyCorner(corner){
  document.body.classList.toggle('rounded',corner==='round');
  document.querySelectorAll('[data-corner]').forEach(opt=>{
    opt.classList.toggle('active',opt.dataset.corner===corner);
  });
  try{localStorage.setItem('catalina-corner',corner);}catch(e){}
}

function applyWeatherIcons(state){
  const hide=state==='hide';
  document.body.classList.toggle('no-weather-icons',hide);
  document.querySelectorAll('[data-icons]').forEach(opt=>{
    opt.classList.toggle('active',opt.dataset.icons===state);
  });
  try{localStorage.setItem('catalina-icons',state);}catch(e){}
}

function applyEventsVisibility(state){
  const visible=state==='show';
  document.body.classList.toggle('events-hidden',!visible);
  document.querySelectorAll('[data-events-visible]').forEach(opt=>{
    opt.classList.toggle('active',opt.dataset.eventsVisible===state);
  });
  try{localStorage.setItem('catalina-events-enabled',visible?'true':'false');}catch(e){}
  if(!visible&&typeof curMode!=='undefined'&&curMode===2&&typeof goMode==='function'){
    goMode(getNextMode(2));
  }
}

function applyFreqFilter(freq,enabled){
  const filters=loadFreqFilters();
  filters[freq]=enabled;
  saveFreqFilters(filters);
  refreshFreqChips();
  if(typeof renderEvents==='function') renderEvents();
  if(typeof curMode!=='undefined'&&curMode===2&&typeof shouldSkipEventsPanel==='function'&&shouldSkipEventsPanel()&&typeof goMode==='function'){
    goMode(getNextMode(2));
  }
}

function refreshFreqChips(){
  const filters=loadFreqFilters();
  document.querySelectorAll('[data-freq]').forEach(chip=>{
    chip.classList.toggle('active',filters[chip.dataset.freq]!==false);
  });
}

function initSettings(){
  const btn=document.getElementById('settings-btn');
  const menu=document.getElementById('settings-menu');
  const read=k=>{try{return localStorage.getItem(k);}catch(e){return null;}};

  applyTheme(read('catalina-theme')||'dark');
  applyCorner(read('catalina-corner')||'default');
  applyWeatherIcons(read('catalina-icons')==='hide'?'hide':'show');
  applyEventsVisibility(read('catalina-events-enabled')==='false'?'hide':'show');
  refreshFreqChips();

  btn.addEventListener('click',e=>{
    e.stopPropagation();
    const open=menu.classList.toggle('open');
    btn.setAttribute('aria-expanded',open?'true':'false');
  });

  document.querySelectorAll('[data-theme]').forEach(opt=>{
    opt.addEventListener('click',e=>{e.stopPropagation();applyTheme(opt.dataset.theme);});
  });
  document.querySelectorAll('[data-corner]').forEach(opt=>{
    opt.addEventListener('click',e=>{e.stopPropagation();applyCorner(opt.dataset.corner);});
  });
  document.querySelectorAll('[data-icons]').forEach(opt=>{
    opt.addEventListener('click',e=>{e.stopPropagation();applyWeatherIcons(opt.dataset.icons);});
  });
  document.querySelectorAll('[data-events-visible]').forEach(opt=>{
    opt.addEventListener('click',e=>{e.stopPropagation();applyEventsVisibility(opt.dataset.eventsVisible);});
  });
  document.querySelectorAll('[data-freq]').forEach(chip=>{
    chip.addEventListener('click',e=>{
      e.stopPropagation();
      const filters=loadFreqFilters();
      applyFreqFilter(chip.dataset.freq,filters[chip.dataset.freq]===false);
    });
  });

  document.addEventListener('click',e=>{
    if(!menu.contains(e.target)&&!btn.contains(e.target)){
      menu.classList.remove('open');
      btn.setAttribute('aria-expanded','false');
    }
  });
}
