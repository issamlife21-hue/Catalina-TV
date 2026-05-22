const BASE='https://b3250884.smushcdn.com/3250884/wp-content/uploads/2026/03/';
const Q='?lossy=2&strip=1&webp=1';
const PHOTOS=[
  'TheWaterfrontAtCatalinaLanding_Exterior-00.jpg',
  'TheWaterfrontAtCatalinaLanding_Exteriors-1.jpg',
  'TheWaterfrontAtCatalinaLanding_Exteriors-2.jpg',
  'TheWaterfrontAtCatalinaLanding_Exteriors-3.jpg',
  'TheWaterfrontAtCatalinaLanding_Exteriors-4.jpg',
  'TheWaterfrontAtCatalinaLanding_Exteriors-5.jpg',
  'TheWaterfrontAtCatalinaLanding_Exteriors-6.jpg',
  'TheWaterfrontAtCatalinaLanding_Exteriors-7.jpg',
  'TheWaterfrontAtCatalinaLanding_Exteriors-9.jpg',
  'TheWaterfrontAtCatalinaLanding_Exteriors-11.jpg',
  'TheWaterfrontAtCatalinaLanding_Exteriors-13.jpg',
  'TheWaterfrontAtCatalinaLanding_Patio-01.jpg',
  'TheWaterfrontAtCatalinaLanding_Patio-02.jpg',
  'TheWaterfrontAtCatalinaLanding_Patio-05.jpg',
  'TheWaterfrontAtCatalinaLanding_Patio-07.jpg',
  'TheWaterfrontAtCatalinaLanding_Patio-09.jpg',
  'TheWaterfrontAtCatalinaLanding_Patio-11.jpg',
  'TheWaterfrontAtCatalinaLanding_Patio-13.jpg',
  'TheWaterfrontAtCatalinaLanding_SeaFloor-8.jpg',
].map(f=>BASE+f+Q);

PHOTOS.push(
  'https://waterfrontcatalinalanding.com/wp-content/uploads/2023/05/Aerial-4-web.jpeg',
  'https://waterfrontcatalinalanding.com/wp-content/uploads/2023/05/BuildingPhoto-42-web.jpeg'
);

// Same Google Sheet as the tenant directory; "Backgrounds" and "Events" tabs.
// Leave a GID blank to disable live sync for that tab and use the local fallback.
const BG_SHEET_ID='17Uze4Qz_0cXsnj4KS4cFmabK67F_jGG0PR_vtnegrK4';
const BG_SHEET_GID='589321751';
const EVENTS_SHEET_ID=BG_SHEET_ID;
const EVENTS_SHEET_GID='871114333';

// TV browser keep-awake layers — each can be flipped off independently.
// These are the always-on layers safe for commercial displays.
const ENABLE_TV_WAKE_LOCK=true;
const ENABLE_TV_MEDIA_KEEPALIVE=true;
const ENABLE_TV_PIXEL_MOTION_GUARD=true;
const ENABLE_TV_ACTIVITY_TIMER=true;

// ─────────────────────────────────────────────────────────────────────────────
// OPTIONAL LG OLED TEST WORKAROUND
// Plays a tiny real WebM video, looped + muted, to engage the TV's hardware
// video-decode pipeline. Use only on consumer LG OLEDs that aggressively dim
// the screen for "burn-in protection". NOT REQUIRED for commercial displays.
// To remove on commercial deploys: set ENABLE_LG_OLED_TEST_KEEPALIVE=false
// (and optionally delete assets/media/tv-keepalive.webm).
// ─────────────────────────────────────────────────────────────────────────────
const ENABLE_LG_OLED_TEST_KEEPALIVE=true;
const LG_OLED_KEEPALIVE_VIDEO_PATH='assets/media/tv-keepalive.webm';

const WX_COND={0:'Clear',1:'Mostly Clear',2:'Partly Cloudy',3:'Overcast',45:'Fog',48:'Freezing Fog',51:'Light Drizzle',53:'Drizzle',55:'Heavy Drizzle',61:'Light Rain',63:'Moderate Rain',65:'Heavy Rain',71:'Light Snow',73:'Moderate Snow',75:'Heavy Snow',80:'Showers',81:'Rain Showers',82:'Heavy Showers',95:'Thunderstorm',96:'Thunderstorm',99:'Severe Storm'};
const WX_SHORT={0:'Clear',1:'Mostly Clear',2:'Pt. Cloudy',3:'Overcast',45:'Fog',48:'Fog',51:'Drizzle',53:'Drizzle',55:'Rain',61:'Rain',63:'Rain',65:'Rain',71:'Snow',73:'Snow',75:'Snow',80:'Showers',81:'Showers',82:'Showers',95:'Storm',96:'Storm',99:'Storm'};
const DAYS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MODES=['pw','pdir','pevt','pphoto'];
const DURS=[10000,15000,12000,12000];

function fetchWithTimeout(url,ms){
  const timeout=ms||15000;
  try{
    const ctrl=new AbortController();
    const tid=setTimeout(()=>{ try{ctrl.abort();}catch(e){} },timeout);
    return fetch(url,{cache:'no-store',signal:ctrl.signal}).finally(()=>clearTimeout(tid));
  }catch(e){
    return fetch(url,{cache:'no-store'});
  }
}

function parseCSV(text){
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
