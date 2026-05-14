let curMode=0,modeTimer=null;
let TABS=null;

function getNextMode(current){
  let next=(current+1)%MODES.length;
  if(next===2&&typeof shouldSkipEventsPanel==='function'&&shouldSkipEventsPanel()){
    next=(next+1)%MODES.length;
  }
  return next;
}

function goMode(i){
  clearTimeout(modeTimer);
  curMode=i;
  MODES.forEach((id,j)=>document.getElementById(id).classList.toggle('on',j===i));
  TABS.forEach((t,j)=>t.classList.toggle('on',j===i));
  document.getElementById('vig').classList.toggle('photo-mode',i===3);
  const dur=DURS[i];
  modeTimer=setTimeout(()=>goMode(getNextMode(curMode)),dur);
}
