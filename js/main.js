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

// ---------- TV keep-awake (layered) ----------
// Layer 3: subtle full-screen pixel motion via CSS class.
try{
  if(typeof ENABLE_TV_PIXEL_MOTION_GUARD!=='undefined' && ENABLE_TV_PIXEL_MOTION_GUARD){
    document.body.classList.add('tv-keepalive');
  }
}catch(e){}

// Layer 1: Screen Wake Lock API. Best-effort, silent on unsupported/denied.
let _wakeLock=null;
function _tryWakeLock(){
  try{
    if(typeof ENABLE_TV_WAKE_LOCK==='undefined' || !ENABLE_TV_WAKE_LOCK) return;
    if(navigator && navigator.wakeLock && typeof navigator.wakeLock.request==='function'){
      const p=navigator.wakeLock.request('screen');
      if(p && typeof p.then==='function'){
        p.then(function(lock){
          _wakeLock=lock;
          try{ lock.addEventListener('release',function(){ _wakeLock=null; }); }catch(e){}
        }).catch(function(){ /* silent */ });
      }
    }
  }catch(e){ /* silent */ }
}
_tryWakeLock();
document.addEventListener('visibilitychange',function(){
  if(document.visibilityState==='visible' && !_wakeLock) _tryWakeLock();
});

// Layer 2: Active-media keepalive. Captures a tiny canvas as a MediaStream and plays it muted.
// Browsers treat pages with active playback as in-use. No sound, no controls, near-invisible.
(function _startMediaKeepalive(){
  try{
    if(typeof ENABLE_TV_MEDIA_KEEPALIVE==='undefined' || !ENABLE_TV_MEDIA_KEEPALIVE) return;
    const canvas=document.createElement('canvas');
    canvas.width=2; canvas.height=2;
    const ctx=canvas.getContext && canvas.getContext('2d');
    if(!ctx || typeof canvas.captureStream!=='function') return;
    let tick=0;
    setInterval(function(){
      try{
        ctx.fillStyle=(tick++ & 1) ? '#000' : '#010101';
        ctx.fillRect(0,0,2,2);
      }catch(e){}
    },500);
    const stream=canvas.captureStream(2);
    if(!stream) return;
    const video=document.createElement('video');
    video.muted=true;
    video.defaultMuted=true;
    video.playsInline=true;
    video.loop=true;
    video.autoplay=true;
    video.setAttribute('muted','');
    video.setAttribute('playsinline','');
    video.setAttribute('autoplay','');
    video.setAttribute('aria-hidden','true');
    video.style.cssText='position:fixed;left:0;top:0;width:2px;height:2px;opacity:0.01;pointer-events:none;z-index:0';
    try{ video.srcObject=stream; }catch(e){ return; }
    document.body.appendChild(video);
    const p=video.play();
    if(p && typeof p.catch==='function') p.catch(function(){ /* autoplay blocked — silent */ });
    // If the browser ever pauses the element, try to resume on visibility return.
    document.addEventListener('visibilitychange',function(){
      if(document.visibilityState==='visible' && video.paused){
        try{ const r=video.play(); if(r && r.catch) r.catch(function(){}); }catch(e){}
      }
    });
  }catch(e){ /* silent */ }
})();

// Layer 4: Activity timer. Updates a hidden off-screen element every 20s — no synthetic input.
(function _startActivityTimer(){
  try{
    if(typeof ENABLE_TV_ACTIVITY_TIMER==='undefined' || !ENABLE_TV_ACTIVITY_TIMER) return;
    const el=document.createElement('div');
    el.id='tv-activity';
    el.setAttribute('aria-hidden','true');
    el.style.cssText='position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0;pointer-events:none';
    document.body.appendChild(el);
    setInterval(function(){
      try{ el.textContent=String(Date.now()); }catch(e){}
    },20000);
  }catch(e){ /* silent */ }
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
