TABS=document.querySelectorAll('.tab');

let _cursorTimer;
function activateCursor(){
  document.body.classList.add('cursor-active');
  clearTimeout(_cursorTimer);
  _cursorTimer=setTimeout(()=>document.body.classList.remove('cursor-active'),3000);
}
document.addEventListener('mousemove',activateCursor);
document.addEventListener('mousedown',activateCursor);

initPasscode();
initSettings();
applyInfo();

renderEvents();
renderDirectory();
initInfoEditor();

tick();
setInterval(tick,1000);

initBackground();

loadWeather();

goMode(0);

// ---------- TV debug overlay (?debug=1) ----------
(function initTvDebug(){
  try{
    if(!/[?&]debug=1\b/.test(location.search||'')) return;
    const el=document.getElementById('tv-debug');
    if(!el) return;
    function paint(){
      const w=window.innerWidth||document.documentElement.clientWidth||0;
      const h=window.innerHeight||document.documentElement.clientHeight||0;
      const dpr=window.devicePixelRatio||1;
      const ua=(navigator.userAgent||'').slice(0,140);
      el.textContent='viewport '+w+'x'+h+' · dpr '+dpr+' · '+ua;
    }
    el.style.display='block';
    paint();
    window.addEventListener('resize',paint);
  }catch(e){}
})();

// ---------- 24/7 lifecycle hardening ----------
const PAGE_LOADED_AT=Date.now();

function _safe(fn){ try{ if(typeof fn==='function') fn(); }catch(e){ console.warn('[lifecycle]',e); } }

function _nudgeAllSyncs(){
  _safe(typeof fetchEventsFromSheet==='function'?fetchEventsFromSheet:null);
  _safe(typeof fetchBackgroundsFromSheet==='function'?fetchBackgroundsFromSheet:null);
  _safe(typeof fetchDirectoryFromSheet==='function'?fetchDirectoryFromSheet:null);
  _safe(typeof loadWeather==='function'?loadWeather:null);
}

window.addEventListener('online',()=>{
  console.info('[lifecycle] online; refreshing data');
  _nudgeAllSyncs();
});

let _lastVisibleRefreshAt=Date.now();
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible'){
    if(Date.now()-_lastVisibleRefreshAt>5*60*1000){
      _lastVisibleRefreshAt=Date.now();
      _nudgeAllSyncs();
    }
  }
});

// Mode rotation watchdog: if no mode change in 2x the longest panel duration, force advance.
setInterval(()=>{
  try{
    if(typeof curMode==='undefined'||typeof DURS==='undefined') return;
    const maxDur=Math.max.apply(null,DURS);
    const stuckThreshold=maxDur*2+5000;
    const elapsed=Date.now()-(typeof _lastModeChangeAt==='number'?_lastModeChangeAt:0);
    if(elapsed>stuckThreshold){
      console.warn('[watchdog] mode rotation stuck for',elapsed,'ms; forcing next');
      goMode((curMode+1)%MODES.length);
    }
  }catch(e){ console.warn('[watchdog] error:',e); }
},10000);

// Controlled daily reload at ~3am local, only after >=6h uptime.
(function scheduleDailyReload(){
  try{
    const minUptime=6*60*60*1000;
    const now=new Date();
    const next=new Date(now);
    next.setHours(3,0,0,0);
    while(next-now<minUptime) next.setDate(next.getDate()+1);
    const ms=next-now;
    setTimeout(()=>{ try{ location.reload(); }catch(e){} },ms);
    console.info('[lifecycle] daily reload scheduled in',Math.round(ms/60000),'min');
  }catch(e){ console.warn('[lifecycle] reload schedule error:',e); }
})();
