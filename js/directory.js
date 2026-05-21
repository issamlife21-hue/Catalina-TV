const DEFAULT_DIRECTORY=[
  {
    num:'310', street:'Golden Shore',
    entries:[
      {name:'TI Capital', floorType:'named', floorArea:'Penthouse'},
      {name:'Available Suites', floorType:'range', floorFrom:1, floorTo:3}
    ]
  },
  {
    num:'320', street:'Golden Shore',
    entries:[
      {name:'Catalina Express HQ', floorType:'single', floorNum:2},
      {name:'Available Suites', floorType:'custom', floorCustom:'Floors 1, 3 – 5'}
    ]
  },
  {
    num:'330', street:'Golden Shore',
    entries:[
      {name:'Lobby & Conference Center', floorType:'named', floorArea:'Ground'},
      {name:'SeaLevel Creative Space', floorType:'named', floorArea:'Lower Level'},
      {name:'Available Suites', floorType:'range', floorFrom:2, floorTo:5}
    ]
  },
  {
    num:'340', street:'Golden Shore',
    entries:[
      {name:'Waterfront Restaurant', floorType:'named', floorArea:'Ground'},
      {name:'Marina Deck Access', floorType:'named', floorArea:'Level P'},
      {name:'Available Suites', floorType:'range', floorFrom:2, floorTo:5}
    ]
  }
];

function loadDirectory(){
  return DEFAULT_DIRECTORY.map(b=>({...b, entries:b.entries.map(e=>({...e}))}));
}

function normalizeBuilding(b){
  return {
    num: (b.num||'').toString(),
    street: (b.street||'').toString(),
    entries: Array.isArray(b.entries) ? b.entries.map(normalizeEntry) : []
  };
}

function normalizeEntry(e){
  const out={
    name: (e.name||'').toString(),
    floorType: e.floorType||'single'
  };
  switch(out.floorType){
    case 'single': out.floorNum=parseInt(e.floorNum,10)||1; break;
    case 'range':  out.floorFrom=parseInt(e.floorFrom,10)||1; out.floorTo=parseInt(e.floorTo,10)||1; break;
    case 'named':  out.floorArea=(e.floorArea||'Ground').toString(); break;
    case 'custom': out.floorCustom=(e.floorCustom||'').toString(); break;
  }
  return out;
}

function formatFloor(entry){
  switch(entry.floorType){
    case 'single': return `Floor ${entry.floorNum}`;
    case 'range':  return `Floors ${entry.floorFrom} – ${entry.floorTo}`;
    case 'named':  return entry.floorArea||'';
    case 'custom': return entry.floorCustom||'';
    default: return '';
  }
}

// ---------- Live Google Sheet sync ----------
const SHEET_CSV_URL='https://docs.google.com/spreadsheets/d/17Uze4Qz_0cXsnj4KS4cFmabK67F_jGG0PR_vtnegrK4/export?format=csv&gid=0';
const SHEET_REFRESH_MS=10*60*1000;
const SHEET_CACHE_KEY='catalina-directory-sheet-cache-v1';
const BUILDING_HEADER_RE=/^\s*(\d{3})\s+GOLDEN\s+SHORE\s*$/i;
const VACANT_RE=/^\s*VACANT\s+OFFICES/i;
const DIR_FAIL_DELAYS=[30000,60000,120000];

let _liveDirectory=null;
let _liveSyncStarted=false;
let _dirFailCount=0;
let _dirFailTimer=null;

function parseSheetCSV(text){
  const rows=parseCSV(text);
  const buildings=new Map();
  const active=new Map();
  for(const row of rows){
    if(row.some(cell=>VACANT_RE.test(cell||''))) break;
    let foundHeader=false;
    for(let c=0;c<row.length;c++){
      const m=BUILDING_HEADER_RE.exec(row[c]||'');
      if(m){
        foundHeader=true;
        const num=m[1];
        active.set(c,num);
        if(!buildings.has(num)) buildings.set(num,{num,street:'Golden Shore',entries:[]});
      }
    }
    if(foundHeader) continue;
    if(row.some(cell=>/^\s*TENANT\s*$/i.test(cell||''))) continue;
    for(const [c,num] of active){
      const name=(row[c]||'').trim();
      const suite=(row[c+1]||'').trim();
      if(!name||!suite) continue;
      buildings.get(num).entries.push({name, floorType:'custom', floorCustom:suite});
    }
  }
  return Array.from(buildings.values());
}

function getEffectiveDirectory(){
  if(_liveDirectory) return _liveDirectory;
  try{
    const raw=localStorage.getItem(SHEET_CACHE_KEY);
    if(raw){
      const parsed=JSON.parse(raw);
      if(Array.isArray(parsed)&&parsed.length) return parsed.map(normalizeBuilding);
    }
  }catch(e){}
  return loadDirectory();
}

async function fetchDirectoryFromSheet(){
  try{
    const res=await fetchWithTimeout(SHEET_CSV_URL,15000);
    if(!res.ok) throw new Error('http '+res.status);
    const text=await res.text();
    const parsed=parseSheetCSV(text);
    if(!parsed.length) throw new Error('no buildings parsed');
    _liveDirectory=parsed.map(normalizeBuilding);
    try{localStorage.setItem(SHEET_CACHE_KEY,JSON.stringify(_liveDirectory));}catch(e){}
    try{ renderDirectory(); }catch(e){ console.warn('[directory] render error:',e); }
    _dirFailCount=0;
    if(_dirFailTimer){ clearTimeout(_dirFailTimer); _dirFailTimer=null; }
  }catch(err){
    console.warn('[directory] live sheet fetch failed; using cache/fallback:',err);
    const delay=DIR_FAIL_DELAYS[Math.min(_dirFailCount,DIR_FAIL_DELAYS.length-1)];
    _dirFailCount++;
    if(_dirFailTimer) clearTimeout(_dirFailTimer);
    _dirFailTimer=setTimeout(fetchDirectoryFromSheet,delay);
  }
}

function startDirectoryLiveSync(){
  if(_liveSyncStarted) return;
  _liveSyncStarted=true;
  fetchDirectoryFromSheet();
  setInterval(fetchDirectoryFromSheet,SHEET_REFRESH_MS);
}

function renderDirectory(){
  startDirectoryLiveSync();
  const grid=document.getElementById('dir-grid');
  if(!grid) return;
  const directory=getEffectiveDirectory();
  grid.innerHTML='';
  directory.forEach(building=>{
    const card=document.createElement('div');
    card.className='db';

    const head=document.createElement('div');
    head.className='db-head';
    const num=document.createElement('div');
    num.className='db-num';
    num.textContent=building.num;
    head.append(num);
    card.appendChild(head);

    building.entries.forEach(entry=>{
      if(!entry.name) return;
      const dt=document.createElement('div');
      dt.className='dt';
      const dtn=document.createElement('span');
      dtn.className='dt-n';
      dtn.textContent=entry.name;
      const dtf=document.createElement('span');
      dtf.className='dt-f';
      dtf.textContent=formatFloor(entry);
      dt.append(dtn,dtf);
      card.appendChild(dt);
    });

    grid.appendChild(card);
  });
}
