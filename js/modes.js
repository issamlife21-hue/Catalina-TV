let curMode=0,modeTimer=null;
let TABS=null;
let _lastModeChangeAt=Date.now();

function getNextMode(current){
  let next=(current+1)%MODES.length;
  if(next===2&&typeof shouldSkipEventsPanel==='function'&&shouldSkipEventsPanel()){
    next=(next+1)%MODES.length;
  }
  return next;
}

function goMode(i){
  try{
    if(typeof MODES==='undefined'||!Array.isArray(MODES)) return;
    if(typeof i!=='number'||i<0||i>=MODES.length) i=0;
    clearTimeout(modeTimer);
    curMode=i;
    _lastModeChangeAt=Date.now();
    MODES.forEach((id,j)=>{
      const el=document.getElementById(id);
      if(el&&el.classList) el.classList.toggle('on',j===i);
    });
    if(TABS){
      TABS.forEach((t,j)=>{
        if(t&&t.classList) t.classList.toggle('on',j===i);
      });
    }
    const vig=document.getElementById('vig');
    if(vig&&vig.classList) vig.classList.toggle('photo-mode',i===3);
    const dur=(DURS&&DURS[i])||12000;
    modeTimer=setTimeout(()=>{
      try{ goMode(getNextMode(curMode)); }
      catch(e){ console.warn('[modes] timer goMode error:',e); modeTimer=setTimeout(()=>goMode((curMode+1)%MODES.length),5000); }
    },dur);
  }catch(e){
    console.warn('[modes] goMode error:',e);
    modeTimer=setTimeout(()=>goMode((curMode+1)%MODES.length),5000);
  }
}
