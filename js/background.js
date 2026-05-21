let bgIdx=0;
const bgSlides=[];
let bgCurLane=0;
let bgEl=null;

const BG_SHEET_REFRESH_MS=10*60*1000;
const BG_SHEET_CACHE_KEY='catalina-backgrounds-sheet-cache-v1';
let _livePhotos=null;
let _bgSyncStarted=false;

function bgParseCSV(text){
  const rows=[];
  let row=[];
  let field='';
  let inQuotes=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(inQuotes){
      if(c==='"'){
        if(text[i+1]==='"'){ field+='"'; i++; }
        else inQuotes=false;
      } else field+=c;
    } else {
      if(c==='"') inQuotes=true;
      else if(c===','){ row.push(field); field=''; }
      else if(c==='\n'){ row.push(field); field=''; rows.push(row); row=[]; }
      else if(c==='\r'){ /* skip */ }
      else field+=c;
    }
  }
  if(field.length||row.length){ row.push(field); rows.push(row); }
  return rows;
}

function parseBackgroundsCSV(text){
  const rows=bgParseCSV(text);
  if(rows.length<2) return [];
  const header=rows[0].map(c=>(c||'').trim().toLowerCase());
  const urlIdx=header.indexOf('url');
  const activeIdx=header.indexOf('active');
  if(urlIdx<0) return [];
  const out=[];
  for(let i=1;i<rows.length;i++){
    const row=rows[i];
    const url=(row[urlIdx]||'').trim();
    if(!/^https?:\/\//i.test(url)) continue;
    if(activeIdx>=0){
      const active=(row[activeIdx]||'').trim().toUpperCase();
      if(active==='FALSE'||active==='0'||active==='NO'||active==='OFF') continue;
    }
    out.push(url);
  }
  return out;
}

function getEffectivePhotos(){
  if(_livePhotos&&_livePhotos.length) return _livePhotos;
  try{
    const raw=localStorage.getItem(BG_SHEET_CACHE_KEY);
    if(raw){
      const parsed=JSON.parse(raw);
      if(Array.isArray(parsed)&&parsed.length) return parsed;
    }
  }catch(e){}
  return PHOTOS;
}

async function fetchBackgroundsFromSheet(){
  if(!BG_SHEET_GID) return;
  const url=`https://docs.google.com/spreadsheets/d/${BG_SHEET_ID}/export?format=csv&gid=${BG_SHEET_GID}`;
  try{
    const res=await fetch(url,{cache:'no-store'});
    if(!res.ok) throw new Error('http '+res.status);
    const text=await res.text();
    const parsed=parseBackgroundsCSV(text);
    if(!parsed.length) throw new Error('no photos parsed');
    _livePhotos=parsed;
    try{localStorage.setItem(BG_SHEET_CACHE_KEY,JSON.stringify(parsed));}catch(e){}
    preloadBg(parsed[0]);
    if(parsed.length>1) preloadBg(parsed[1]);
  }catch(err){
    console.warn('[background] live sheet fetch failed; using cache/fallback:',err);
  }
}

function startBackgroundsLiveSync(){
  if(_bgSyncStarted) return;
  _bgSyncStarted=true;
  fetchBackgroundsFromSheet();
  setInterval(fetchBackgroundsFromSheet,BG_SHEET_REFRESH_MS);
}

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
  const photos=getEffectivePhotos();
  bgSlides[0].style.backgroundImage=`url('${photos[0]}')`;
  bgSlides[0].classList.add('on');
  preloadBg(photos[1%photos.length]);
  startBackgroundsLiveSync();
  setInterval(advanceBackground,9000);
}

function advanceBackground(){
  const photos=getEffectivePhotos();
  const nextIdx=(bgIdx+1)%photos.length;
  const nextLane=1-bgCurLane;
  const cur=bgSlides[bgCurLane];
  const next=bgSlides[nextLane];
  next.style.backgroundImage=`url('${photos[nextIdx]}')`;
  bgEl.appendChild(next);
  next.style.animation='none';
  void next.offsetWidth;
  next.style.animation='kb 18s ease-in-out forwards';
  cur.classList.remove('on');
  next.classList.add('on');
  bgIdx=nextIdx;
  bgCurLane=nextLane;
  preloadBg(photos[(nextIdx+1)%photos.length]);
}
