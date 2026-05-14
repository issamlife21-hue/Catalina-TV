let bgIdx=0;
const bgSlides=[];

function initBackground(){
  const bgEl=document.getElementById('bg');
  PHOTOS.forEach((url,i)=>{
    const d=document.createElement('div');
    d.className='bgs';
    d.style.backgroundImage=`url('${url}')`;
    if(i===0)d.classList.add('on');
    bgEl.appendChild(d);
    bgSlides.push(d);
  });
  setInterval(()=>{
    bgSlides[bgIdx].classList.remove('on');
    bgIdx=(bgIdx+1)%bgSlides.length;
    const s=bgSlides[bgIdx];
    s.style.animation='none';s.offsetWidth;
    s.style.animation='kb 18s ease-in-out forwards';
    s.classList.add('on');
  },9000);
}
