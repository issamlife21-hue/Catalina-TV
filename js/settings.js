function _setSwitch(key,on){
  const sw=document.querySelector(`.ios-switch[data-toggle="${key}"]`);
  if(sw) sw.setAttribute('aria-pressed',on?'true':'false');
}

function applyTheme(theme){
  if(theme!=='light'&&theme!=='navy'&&theme!=='og') theme='dark';
  document.body.classList.remove('light','navy','og');
  if(theme==='light') document.body.classList.add('light');
  else if(theme==='navy') document.body.classList.add('navy');
  else if(theme==='og') document.body.classList.add('og');
  document.querySelectorAll('[data-theme]').forEach(c=>{
    c.classList.toggle('active',c.dataset.theme===theme);
  });
  try{localStorage.setItem('catalina-theme',theme);}catch(e){}
}

function applyCorner(corner){
  const isRound=corner==='round';
  document.body.classList.toggle('rounded',isRound);
  _setSwitch('round',isRound);
  try{localStorage.setItem('catalina-corner',isRound?'round':'default');}catch(e){}
}

function applyWeatherIcons(state){
  const show=state==='show';
  document.body.classList.toggle('no-weather-icons',!show);
  _setSwitch('icons',show);
  try{localStorage.setItem('catalina-icons',show?'show':'hide');}catch(e){}
}

function applyDaylight(state){
  const on=state==='on'||state===true;
  document.body.classList.toggle('daylight',on);
  _setSwitch('daylight',on);
  try{localStorage.setItem('catalina-daylight',on?'on':'off');}catch(e){}
}

function applyPropertyPos(pos){
  if(pos!=='top'&&pos!=='bottom') pos='center';
  document.body.classList.remove('prop-pos-top','prop-pos-center','prop-pos-bottom');
  document.body.classList.add('prop-pos-'+pos);
  document.querySelectorAll('[data-prop-pos]').forEach(c=>{
    c.classList.toggle('active',c.dataset.propPos===pos);
  });
  try{localStorage.setItem('catalina-property-pos',pos);}catch(e){}
}

function applyEventsVisibility(state){
  const visible=state==='show';
  document.body.classList.toggle('events-hidden',!visible);
  _setSwitch('events',visible);
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

function _updateFullscreenLabel(){
  const lab=document.getElementById('fullscreen-label');
  if(!lab) return;
  lab.textContent=document.fullscreenElement?'Exit Fullscreen':'Enter Fullscreen';
}

function toggleFullscreen(){
  if(!document.fullscreenElement){
    const el=document.documentElement;
    if(el.requestFullscreen) el.requestFullscreen().catch(()=>{});
  }else{
    if(document.exitFullscreen) document.exitFullscreen().catch(()=>{});
  }
}

function initSettings(){
  const btn=document.getElementById('settings-btn');
  const menu=document.getElementById('settings-menu');
  const read=k=>{try{return localStorage.getItem(k);}catch(e){return null;}};

  applyTheme(read('catalina-theme')||'dark');
  applyCorner(read('catalina-corner')||'default');
  applyWeatherIcons(read('catalina-icons')==='hide'?'hide':'show');
  applyEventsVisibility(read('catalina-events-enabled')==='false'?'hide':'show');
  applyDaylight(read('catalina-daylight')==='on'?'on':'off');
  applyPropertyPos(read('catalina-property-pos')||'center');
  refreshFreqChips();
  _updateFullscreenLabel();

  btn.addEventListener('click',e=>{
    e.stopPropagation();
    if(menu.classList.contains('open')){
      menu.classList.remove('open');
      btn.setAttribute('aria-expanded','false');
      return;
    }
    requireUnlock(()=>{
      menu.classList.add('open');
      btn.setAttribute('aria-expanded','true');
    });
  });

  document.querySelectorAll('.ios-switch').forEach(sw=>{
    sw.addEventListener('click',e=>{
      e.stopPropagation();
      const key=sw.dataset.toggle;
      const isOn=sw.getAttribute('aria-pressed')==='true';
      if(key==='round') applyCorner(isOn?'default':'round');
      else if(key==='icons') applyWeatherIcons(isOn?'hide':'show');
      else if(key==='events') applyEventsVisibility(isOn?'hide':'show');
      else if(key==='daylight') applyDaylight(!isOn);
    });
  });

  document.querySelectorAll('[data-theme]').forEach(chip=>{
    chip.addEventListener('click',e=>{
      e.stopPropagation();
      applyTheme(chip.dataset.theme);
    });
  });

  document.querySelectorAll('[data-prop-pos]').forEach(chip=>{
    chip.addEventListener('click',e=>{
      e.stopPropagation();
      applyPropertyPos(chip.dataset.propPos);
    });
  });

  document.querySelectorAll('[data-freq]').forEach(chip=>{
    chip.addEventListener('click',e=>{
      e.stopPropagation();
      const filters=loadFreqFilters();
      applyFreqFilter(chip.dataset.freq,filters[chip.dataset.freq]===false);
    });
  });

  const fsBtn=document.getElementById('fullscreen-btn');
  if(fsBtn) fsBtn.addEventListener('click',e=>{e.stopPropagation();toggleFullscreen();});
  document.addEventListener('fullscreenchange',_updateFullscreenLabel);

  const pcBtn=document.getElementById('change-pc-btn');
  if(pcBtn) pcBtn.addEventListener('click',e=>{e.stopPropagation();promptChangePasscode();});

  document.addEventListener('click',e=>{
    if(!menu.contains(e.target)&&!btn.contains(e.target)){
      menu.classList.remove('open');
      btn.setAttribute('aria-expanded','false');
    }
  });
}
