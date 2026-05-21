const DEFAULT_EVENTS=[
  {
    name:'Sunset Networking Social',
    frequency:'Weekly', date:'Every Friday', time:'5:00 PM',
    desc:'Tenants and guests gather on the marina deck for drinks, conversation, and harbor views.',
    loc:'Marina Deck · 340 Golden Shore'
  },
  {
    name:'Waterfront Lunch & Learn',
    frequency:'Monthly', date:'Tuesday', time:'12:00 PM',
    desc:'A monthly speaker series with local business leaders and community guests.',
    loc:'Conference Center · 330 Golden Shore'
  },
  {
    name:'Add Events & Announcements',
    frequency:'Announcement', date:'', time:'',
    desc:'Contact building management to post tenant events and community updates.',
    loc:'Catalina Landing · Long Beach'
  }
];

function eventsPageEnabled(){
  try{return localStorage.getItem('catalina-events-enabled')!=='false';}catch(e){return true;}
}

function shouldSkipEventsPanel(){
  if(!eventsPageEnabled()) return true;
  return getEffectiveEvents().length===0;
}

function renderEvents(){
  startEventsLiveSync();
  const grid=document.getElementById('evt-grid');
  if(!grid) return;
  const events=getEffectiveEvents();
  grid.innerHTML='';
  grid.dataset.count=events.length;
  if(events.length===0){
    const empty=document.createElement('div');
    empty.className='ec-empty';
    empty.textContent='No upcoming events';
    grid.appendChild(empty);
    return;
  }
  events.forEach(ev=>{
    const card=document.createElement('div');
    card.className='ec';
    const metaText=[ev.frequency,ev.date,ev.time].filter(Boolean).join(' · ');
    const name=document.createElement('div');name.className='ec-name';name.textContent=ev.name;
    const meta=document.createElement('div');meta.className='ec-meta';meta.textContent=metaText;
    const desc=document.createElement('div');desc.className='ec-desc';desc.textContent=ev.desc;
    const loc=document.createElement('div');loc.className='ec-loc';loc.textContent=ev.loc;
    card.append(name,meta,desc,loc);
    grid.appendChild(card);
  });
}

// ---------- Live Google Sheet sync (Events tab) ----------
const EVT_SHEET_REFRESH_MS=10*60*1000;
const EVT_SHEET_CACHE_KEY='catalina-events-sheet-cache-v1';
const EVT_FAIL_DELAYS=[30000,60000,120000];
let _liveEvents=null;
let _evtSyncStarted=false;
let _evtFailCount=0;
let _evtFailTimer=null;

function parseEventsCSV(text){
  const rows=parseCSV(text);
  if(rows.length<2) return [];
  const header=rows[0].map(c=>(c||'').trim().toLowerCase());
  const idx={
    title:     header.indexOf('title'),
    frequency: header.indexOf('frequency'),
    date:      header.indexOf('date'),
    time:      header.indexOf('time'),
    loc:       header.indexOf('location'),
    desc:      header.indexOf('description'),
    active:    header.indexOf('active'),
    priority:  header.indexOf('priority'),
  };
  if(idx.title<0) return [];
  const out=[];
  for(let i=1;i<rows.length;i++){
    const row=rows[i];
    const title=(row[idx.title]||'').trim();
    if(!title) continue;
    if(idx.active>=0){
      const v=(row[idx.active]||'').trim().toUpperCase();
      if(v!=='TRUE'&&v!=='YES'&&v!=='1'&&v!=='ON') continue;
    }
    out.push({
      name:      title,
      frequency: idx.frequency>=0 ? (row[idx.frequency]||'').trim() : '',
      date:      idx.date>=0      ? (row[idx.date]||'').trim()      : '',
      time:      idx.time>=0      ? (row[idx.time]||'').trim()      : '',
      loc:       idx.loc>=0       ? (row[idx.loc]||'').trim()       : '',
      desc:      idx.desc>=0      ? (row[idx.desc]||'').trim()      : '',
      priority:  idx.priority>=0  ? (row[idx.priority]||'').trim()  : '',
    });
    if(out.length>=3) break;
  }
  return out;
}

function readCachedSheetEvents(){
  try{
    const raw=localStorage.getItem(EVT_SHEET_CACHE_KEY);
    if(raw){
      const parsed=JSON.parse(raw);
      if(Array.isArray(parsed)) return parsed;
    }
  }catch(e){}
  return null;
}

function getEffectiveEvents(){
  if(Array.isArray(_liveEvents)) return _liveEvents;
  const cached=readCachedSheetEvents();
  if(Array.isArray(cached)) return cached;
  return DEFAULT_EVENTS;
}

async function fetchEventsFromSheet(){
  if(typeof EVENTS_SHEET_GID==='undefined'||!EVENTS_SHEET_GID) return;
  const url=`https://docs.google.com/spreadsheets/d/${EVENTS_SHEET_ID}/export?format=csv&gid=${EVENTS_SHEET_GID}`;
  try{
    const res=await fetchWithTimeout(url,15000);
    if(!res.ok) throw new Error('http '+res.status);
    const text=await res.text();
    const parsed=parseEventsCSV(text);
    _liveEvents=parsed;
    try{localStorage.setItem(EVT_SHEET_CACHE_KEY,JSON.stringify(parsed));}catch(e){}
    try{ renderEvents(); }catch(e){ console.warn('[events] render error:',e); }
    _evtFailCount=0;
    if(_evtFailTimer){ clearTimeout(_evtFailTimer); _evtFailTimer=null; }
  }catch(err){
    console.warn('[events] live sheet fetch failed; using cache/fallback:',err);
    const delay=EVT_FAIL_DELAYS[Math.min(_evtFailCount,EVT_FAIL_DELAYS.length-1)];
    _evtFailCount++;
    if(_evtFailTimer) clearTimeout(_evtFailTimer);
    _evtFailTimer=setTimeout(fetchEventsFromSheet,delay);
  }
}

function startEventsLiveSync(){
  if(_evtSyncStarted) return;
  _evtSyncStarted=true;
  fetchEventsFromSheet();
  setInterval(fetchEventsFromSheet,EVT_SHEET_REFRESH_MS);
}
