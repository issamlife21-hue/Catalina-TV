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

// Layer 2: Active-media keepalive — mimics a real media playback so TV firmware
// (LG OLED burn-in protection etc.) and browser idle heuristics keep the page alive.
// Video: 64x64 canvas capture at 10 fps with subtle color drift (canvas is NOT in DOM).
// Audio: silent AudioContext oscillator routed only into the MediaStream (never to speakers).
// MediaSession: marks the page as actively playing media (same signal YouTube uses).
// Visible footprint: a 4x4 px hidden <video> at the very top-left, opacity 0.01.
(function _startMediaKeepalive(){
  try{
    if(typeof ENABLE_TV_MEDIA_KEEPALIVE==='undefined' || !ENABLE_TV_MEDIA_KEEPALIVE) return;

    // ── Canvas video source ──
    const canvas=document.createElement('canvas');
    canvas.width=64; canvas.height=64;
    const ctx=canvas.getContext && canvas.getContext('2d');
    if(!ctx || typeof canvas.captureStream!=='function') return;
    let frame=0;
    setInterval(function(){
      try{
        frame++;
        const t=frame*0.05;
        const r=Math.max(0,Math.min(15,(Math.sin(t)*3+5)|0));
        const g=Math.max(0,Math.min(15,(Math.sin(t+2)*3+5)|0));
        const b=Math.max(0,Math.min(15,(Math.sin(t+4)*3+5)|0));
        ctx.fillStyle='rgb('+r+','+g+','+b+')';
        ctx.fillRect(0,0,64,64);
      }catch(e){}
    },100);
    const stream=canvas.captureStream(10);
    if(!stream) return;

    // ── Silent audio track via AudioContext, merged into the same MediaStream ──
    let audioCtx=null;
    try{
      const AC=window.AudioContext || window.webkitAudioContext;
      if(AC){
        audioCtx=new AC();
        const osc=audioCtx.createOscillator();
        const gain=audioCtx.createGain();
        gain.gain.value=0.0001;
        osc.frequency.value=20;
        const dest=audioCtx.createMediaStreamDestination();
        osc.connect(gain);
        gain.connect(dest);
        // Intentionally NOT connecting gain to audioCtx.destination — keeps speakers fully silent.
        osc.start();
        const at=dest.stream.getAudioTracks();
        for(let i=0;i<at.length;i++){ try{ stream.addTrack(at[i]); }catch(e){} }
        if(audioCtx.state==='suspended'){
          const resume=function(){ try{ audioCtx.resume(); }catch(e){} };
          resume();
          document.addEventListener('click',resume,{once:true});
          document.addEventListener('keydown',resume,{once:true});
          document.addEventListener('touchstart',resume,{once:true});
          document.addEventListener('mousedown',resume,{once:true});
        }
      }
    }catch(e){ /* audio unsupported — proceed video-only */ }

    // ── Hidden video element bound to the stream ──
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
    video.style.cssText='position:fixed;left:0;top:0;width:4px;height:4px;opacity:0.01;pointer-events:none;z-index:0';
    try{ video.srcObject=stream; }catch(e){ return; }
    document.body.appendChild(video);
    const p=video.play();
    if(p && typeof p.catch==='function') p.catch(function(){});

    // ── Watchdog: if the browser ever pauses the element, resume it ──
    setInterval(function(){
      try{
        if(video.paused){
          const r=video.play();
          if(r && typeof r.catch==='function') r.catch(function(){});
        }
        if(audioCtx && audioCtx.state==='suspended'){
          try{ audioCtx.resume(); }catch(e){}
        }
      }catch(e){}
    },5000);
    document.addEventListener('visibilitychange',function(){
      if(document.visibilityState==='visible'){
        try{ if(video.paused){ const r=video.play(); if(r && r.catch) r.catch(function(){}); } }catch(e){}
        try{ if(audioCtx && audioCtx.state==='suspended') audioCtx.resume(); }catch(e){}
      }
    });

    // ── MediaSession: the same signal YouTube uses to declare "media is playing" ──
    try{
      if(navigator && 'mediaSession' in navigator){
        if(typeof window.MediaMetadata!=='undefined'){
          navigator.mediaSession.metadata=new window.MediaMetadata({
            title:'Catalina TV Lobby Display',
            artist:'Catalina Landing',
            album:'Live Display'
          });
        }
        try{ navigator.mediaSession.playbackState='playing'; }catch(e){}
      }
    }catch(e){}
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
