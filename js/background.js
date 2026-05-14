let bgIdx=0;
const bgSlides=[];
let bgCurLane=0;
let bgEl=null;

function preloadBg(url){
  const img=new Image();
  img.src=url;
}

function initBackground(){
  bgEl=document.getElementById('bg');
  for(let i=0;i<2;i++){
    const d=document.createElement('div');
    d.className='bgs';
    bgEl.appendChild(d);
    bgSlides.push(d);
  }
  bgSlides[0].style.backgroundImage=`url('${PHOTOS[0]}')`;
  bgSlides[0].classList.add('on');
  preloadBg(PHOTOS[1%PHOTOS.length]);
  setInterval(advanceBackground,9000);
}

function advanceBackground(){
  const nextIdx=(bgIdx+1)%PHOTOS.length;
  const nextLane=1-bgCurLane;
  const cur=bgSlides[bgCurLane];
  const next=bgSlides[nextLane];
  next.style.backgroundImage=`url('${PHOTOS[nextIdx]}')`;
  bgEl.appendChild(next);
  next.style.animation='none';
  void next.offsetWidth;
  next.style.animation='kb 18s ease-in-out forwards';
  cur.classList.remove('on');
  next.classList.add('on');
  bgIdx=nextIdx;
  bgCurLane=nextLane;
  preloadBg(PHOTOS[(nextIdx+1)%PHOTOS.length]);
}
