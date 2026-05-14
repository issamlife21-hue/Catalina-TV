let _lastGreeting='';

function getGreeting(hour){
  if(hour>=7&&hour<12) return 'Good Morning';
  if(hour>=12&&hour<17) return 'Good Afternoon';
  if(hour>=17&&hour<22) return 'Good Evening';
  return 'Good Night';
}

function updateGreeting(){
  const el=document.getElementById('greeting');
  if(!el) return;
  const next=getGreeting(new Date().getHours());
  if(next===_lastGreeting) return;
  if(!_lastGreeting){
    el.textContent=next;
    _lastGreeting=next;
    return;
  }
  el.classList.add('fading');
  setTimeout(()=>{
    el.textContent=next;
    el.classList.remove('fading');
  },600);
  _lastGreeting=next;
}

function tick(){
  const n=new Date();
  const h=n.getHours()%12||12;
  const m=String(n.getMinutes()).padStart(2,'0');
  document.getElementById('clk-time').textContent=`${h}:${m}`;
  document.getElementById('clk-date').textContent=n.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
  updateGreeting();
}
