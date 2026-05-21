const DAYS_FULL=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS_FULL=['January','February','March','April','May','June','July','August','September','October','November','December'];
const FREQ_TYPES=[
  ['daily','Daily'],
  ['weekly','Weekly'],
  ['monthly','Monthly'],
  ['today','Today'],
  ['custom','Custom Date']
];

const DEFAULT_EVENTS=[
  {
    freqType:'weekly', dayOfWeek:'Friday',
    hour:5, minute:'00', ampm:'PM',
    name:'Sunset Networking Social',
    desc:'Tenants and guests gather on the marina deck for drinks, conversation, and harbor views.',
    loc:'Marina Deck · 340 Golden Shore'
  },
  {
    freqType:'monthly', dayOfWeek:'Tuesday',
    hour:12, minute:'00', ampm:'PM',
    name:'Waterfront Lunch & Learn',
    desc:'Monthly speaker series featuring industry leaders. Open to all tenants. Lunch provided.',
    loc:'Conference Center · 330 Golden Shore'
  },
  {
    freqType:'custom',
    customYear:new Date().getFullYear(), customMonth:6, customDay:15,
    hour:5, minute:'00', ampm:'PM',
    name:'Add Events & Announcements',
    desc:'Contact building management to post tenant events, community updates, and announcements.',
    loc:'Catalina Landing · Long Beach'
  }
];

function loadEvents(){
  try{
    const raw=localStorage.getItem('catalina-events-v2');
    if(raw){
      const parsed=JSON.parse(raw);
      if(Array.isArray(parsed)&&parsed.length===3) return parsed.map(e=>normalizeEvent(e));
    }
  }catch(e){}
  return DEFAULT_EVENTS.map(e=>({...e}));
}

function normalizeEvent(ev){
  return {
    freqType: ev.freqType||'weekly',
    dayOfWeek: ev.dayOfWeek||'Friday',
    customYear: parseInt(ev.customYear,10)||new Date().getFullYear(),
    customMonth: parseInt(ev.customMonth,10)||1,
    customDay: parseInt(ev.customDay,10)||1,
    hour: parseInt(ev.hour,10)||12,
    minute: ev.minute==='30'?'30':'00',
    ampm: ev.ampm==='AM'?'AM':'PM',
    name: ev.name||'',
    desc: ev.desc||'',
    loc: ev.loc||'',
    savedDate: ev.savedDate||null
  };
}

function todayDateString(){
  const t=new Date();
  return `${t.getFullYear()}-${t.getMonth()+1}-${t.getDate()}`;
}

function isEventExpired(ev){
  if(ev.freqType==='today'){
    if(!ev.savedDate) return false;
    return ev.savedDate!==todayDateString();
  }
  if(ev.freqType==='custom'){
    const today=new Date();
    today.setHours(0,0,0,0);
    const evDate=new Date(ev.customYear,(ev.customMonth||1)-1,ev.customDay||1);
    return evDate<today;
  }
  return false;
}

function saveEvents(events){
  try{localStorage.setItem('catalina-events-v2',JSON.stringify(events));}catch(e){}
}

function loadFreqFilters(){
  try{
    const raw=localStorage.getItem('catalina-freq-filters');
    if(raw){
      const p=JSON.parse(raw);
      if(p&&typeof p==='object'){
        return {weekly:p.weekly!==false,daily:p.daily!==false,monthly:p.monthly!==false};
      }
    }
  }catch(e){}
  return {weekly:true,daily:true,monthly:true};
}

function saveFreqFilters(filters){
  try{localStorage.setItem('catalina-freq-filters',JSON.stringify(filters));}catch(e){}
}

function eventsPageEnabled(){
  try{return localStorage.getItem('catalina-events-enabled')!=='false';}catch(e){return true;}
}

function getFilteredEvents(){
  const events=loadEvents();
  const f=loadFreqFilters();
  return events.filter(ev=>{
    if(isEventExpired(ev)) return false;
    const t=(ev.freqType||'').toLowerCase();
    if(t==='weekly') return f.weekly!==false;
    if(t==='daily') return f.daily!==false;
    if(t==='monthly') return f.monthly!==false;
    return true;
  });
}

function shouldSkipEventsPanel(){
  if(!eventsPageEnabled()) return true;
  return getEffectiveEventsForRender().events.length===0;
}

function formatTime(ev){
  return `${ev.hour}:${ev.minute} ${ev.ampm}`;
}

function formatEventFreq(ev){
  switch(ev.freqType){
    case 'daily': return 'Daily';
    case 'weekly': return 'Weekly';
    case 'monthly': return 'Monthly';
    case 'today': return 'Today';
    case 'custom': return 'Upcoming';
    default: return '';
  }
}

function formatEventDate(ev){
  const time=formatTime(ev);
  switch(ev.freqType){
    case 'daily': return `Every Day · ${time}`;
    case 'weekly': return `Every ${ev.dayOfWeek} · ${time}`;
    case 'monthly': return `Monthly · ${ev.dayOfWeek} · ${time}`;
    case 'today': return `Today · ${time}`;
    case 'custom': return `${MONTHS_FULL[(ev.customMonth||1)-1]} ${ev.customDay}, ${ev.customYear} · ${time}`;
    default: return time;
  }
}

function renderEvents(){
  startEventsLiveSync();
  const grid=document.getElementById('evt-grid');
  if(!grid) return;
  const {source,events}=getEffectiveEventsForRender();
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
    const metaText=source==='sheet'
      ? [ev.frequency,ev.date,ev.time].filter(Boolean).join(' · ')
      : [formatEventFreq(ev),formatEventDate(ev)].filter(Boolean).join(' · ');
    const name=document.createElement('div');name.className='ec-name';name.textContent=ev.name;
    const meta=document.createElement('div');meta.className='ec-meta';meta.textContent=metaText;
    const desc=document.createElement('div');desc.className='ec-desc';desc.textContent=ev.desc;
    const loc=document.createElement('div');loc.className='ec-loc';loc.textContent=ev.loc;
    card.append(name,meta,desc,loc);
    grid.appendChild(card);
  });
}

function range(a,b){
  const r=[];
  for(let i=a;i<=b;i++) r.push(i);
  return r;
}

function createSelect(field,options,selected){
  const sel=document.createElement('select');
  sel.className='eed-select';
  sel.dataset.field=field;
  options.forEach(([value,label])=>{
    const opt=document.createElement('option');
    opt.value=value;
    opt.textContent=label;
    if(String(value)===String(selected)) opt.selected=true;
    sel.appendChild(opt);
  });
  return sel;
}

function appendLabel(parent,text){
  const lab=document.createElement('label');
  lab.className='eed-label';
  lab.textContent=text;
  parent.appendChild(lab);
}

function buildDateFields(ev){
  const wrap=document.createElement('div');
  wrap.className='eed-date-fields';

  const wd=document.createElement('div');
  wd.className='eed-date-variant eed-date-weekday';
  appendLabel(wd,'Day of Week');
  wd.appendChild(createSelect('dayOfWeek',DAYS_FULL.map(d=>[d,d]),ev.dayOfWeek||'Friday'));
  wrap.appendChild(wd);

  const cu=document.createElement('div');
  cu.className='eed-date-variant eed-date-custom';
  appendLabel(cu,'Date');
  const cuRow=document.createElement('div');
  cuRow.className='eed-row';
  const thisYear=new Date().getFullYear();
  cuRow.appendChild(createSelect('customYear',range(thisYear,thisYear+5).map(n=>[String(n),String(n)]),String(ev.customYear||thisYear)));
  cuRow.appendChild(createSelect('customMonth',MONTHS_FULL.map((m,j)=>[String(j+1),m]),String(ev.customMonth||1)));
  cuRow.appendChild(createSelect('customDay',range(1,31).map(n=>[String(n),String(n)]),String(ev.customDay||1)));
  cu.appendChild(cuRow);
  wrap.appendChild(cu);

  const da=document.createElement('div');
  da.className='eed-date-variant eed-date-daily';
  const daNote=document.createElement('div');
  daNote.className='eed-date-note';
  daNote.textContent='Repeats every day at the time below.';
  da.appendChild(daNote);
  wrap.appendChild(da);

  const td=document.createElement('div');
  td.className='eed-date-variant eed-date-today';
  const tdNote=document.createElement('div');
  tdNote.className='eed-date-note';
  tdNote.textContent='Happens today at the time below.';
  td.appendChild(tdNote);
  wrap.appendChild(td);

  return wrap;
}

function buildEventBlock(ev,i){
  const block=document.createElement('div');
  block.className='eed-block';
  block.dataset.freqType=ev.freqType||'weekly';
  block.dataset.index=i;

  const title=document.createElement('div');
  title.className='eed-title';
  title.textContent=`Event ${i+1}`;
  block.appendChild(title);

  appendLabel(block,'Frequency');
  const freqSelect=createSelect('freqType',FREQ_TYPES,ev.freqType||'weekly');
  freqSelect.addEventListener('change',e=>{
    block.dataset.freqType=e.target.value;
  });
  block.appendChild(freqSelect);

  block.appendChild(buildDateFields(ev));

  appendLabel(block,'Time');
  const timeRow=document.createElement('div');
  timeRow.className='eed-row';
  timeRow.appendChild(createSelect('hour',range(1,12).map(n=>[String(n),String(n)]),String(ev.hour||12)));
  timeRow.appendChild(createSelect('minute',[['00',':00'],['30',':30']],ev.minute||'00'));
  timeRow.appendChild(createSelect('ampm',[['AM','AM'],['PM','PM']],ev.ampm||'PM'));
  block.appendChild(timeRow);

  appendLabel(block,'Name');
  const nameInp=document.createElement('input');
  nameInp.type='text';nameInp.className='eed-input';nameInp.dataset.field='name';nameInp.value=ev.name||'';
  nameInp.placeholder='Event title';
  block.appendChild(nameInp);

  appendLabel(block,'Description');
  const descInp=document.createElement('textarea');
  descInp.className='eed-input eed-textarea';descInp.dataset.field='desc';descInp.rows=3;descInp.value=ev.desc||'';
  descInp.placeholder='Short description for the card';
  block.appendChild(descInp);

  appendLabel(block,'Location');
  const locInp=document.createElement('input');
  locInp.type='text';locInp.className='eed-input';locInp.dataset.field='loc';locInp.value=ev.loc||'';
  locInp.placeholder='Where it happens';
  block.appendChild(locInp);

  const clear=document.createElement('button');
  clear.type='button';clear.className='eed-clear';
  clear.textContent='Clear this event';
  clear.addEventListener('click',()=>{
    block.querySelectorAll('input[data-field], textarea[data-field]').forEach(inp=>{inp.value='';});
    const nameField=block.querySelector('input[data-field="name"]');
    if(nameField) nameField.focus();
  });
  block.appendChild(clear);

  return block;
}

function buildEditorForm(){
  const wrap=document.getElementById('evt-editor-grid');
  const events=loadEvents();
  wrap.innerHTML='';
  events.forEach((ev,i)=>{
    wrap.appendChild(buildEventBlock(ev,i));
  });
}

function openEventEditor(){
  buildEditorForm();
  document.getElementById('evt-editor').classList.add('open');
  document.body.classList.add('modal-open');
}

function closeEventEditor(){
  document.getElementById('evt-editor').classList.remove('open');
  document.body.classList.remove('modal-open');
}

function saveEventEditor(){
  const events=[];
  document.querySelectorAll('#evt-editor-grid .eed-block').forEach(block=>{
    const ev={};
    block.querySelectorAll('[data-field]').forEach(inp=>{
      const f=inp.dataset.field;
      let val=inp.value;
      if(typeof val==='string') val=val.trim();
      ev[f]=val;
    });
    if(ev.freqType==='today') ev.savedDate=todayDateString();
    events.push(normalizeEvent(ev));
  });
  saveEvents(events);
  renderEvents();
  closeEventEditor();
  if(typeof curMode!=='undefined'&&curMode===2&&shouldSkipEventsPanel()&&typeof goMode==='function'){
    goMode(getNextMode(2));
  }
}

function resetEventsToDefault(){
  if(!confirm('Reset all events to the original defaults? This cannot be undone.')) return;
  try{localStorage.removeItem('catalina-events-v2');}catch(e){}
  renderEvents();
  buildEditorForm();
}

function initEventEditor(){
  const openBtn=document.getElementById('edit-events-btn');
  if(openBtn) openBtn.addEventListener('click',e=>{
    e.stopPropagation();
    document.getElementById('settings-menu').classList.remove('open');
    document.getElementById('settings-btn').setAttribute('aria-expanded','false');
    openEventEditor();
  });
  document.getElementById('eed-cancel').addEventListener('click',closeEventEditor);
  document.getElementById('eed-close').addEventListener('click',closeEventEditor);
  document.getElementById('eed-save').addEventListener('click',saveEventEditor);
  document.getElementById('eed-reset').addEventListener('click',resetEventsToDefault);
  document.getElementById('eed-backdrop').addEventListener('click',closeEventEditor);
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&document.getElementById('evt-editor').classList.contains('open')){
      closeEventEditor();
    }
  });
}

// ---------- Live Google Sheet sync (Events tab) ----------
const EVT_SHEET_REFRESH_MS=10*60*1000;
const EVT_SHEET_CACHE_KEY='catalina-events-sheet-cache-v1';
let _liveEvents=null;
let _evtSyncStarted=false;

function evtParseCSV(text){
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

function parseEventsCSV(text){
  const rows=evtParseCSV(text);
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

function getEffectiveEventsForRender(){
  let sheet=_liveEvents;
  if(sheet===null) sheet=readCachedSheetEvents();
  if(Array.isArray(sheet)) return {source:'sheet', events:sheet};
  return {source:'local', events:getFilteredEvents()};
}

async function fetchEventsFromSheet(){
  if(typeof EVENTS_SHEET_GID==='undefined'||!EVENTS_SHEET_GID) return;
  const url=`https://docs.google.com/spreadsheets/d/${EVENTS_SHEET_ID}/export?format=csv&gid=${EVENTS_SHEET_GID}`;
  try{
    const res=await fetch(url,{cache:'no-store'});
    if(!res.ok) throw new Error('http '+res.status);
    const text=await res.text();
    const parsed=parseEventsCSV(text);
    _liveEvents=parsed;
    try{localStorage.setItem(EVT_SHEET_CACHE_KEY,JSON.stringify(parsed));}catch(e){}
    renderEvents();
  }catch(err){
    console.warn('[events] live sheet fetch failed; using cache/fallback:',err);
  }
}

function startEventsLiveSync(){
  if(_evtSyncStarted) return;
  _evtSyncStarted=true;
  fetchEventsFromSheet();
  setInterval(fetchEventsFromSheet,EVT_SHEET_REFRESH_MS);
}
