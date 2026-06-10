// ─── PHOTO FALLBACK (used if Backgrounds sheet is unreachable) ───────────────
const BASE = 'https://b3250884.smushcdn.com/3250884/wp-content/uploads/2026/03/';
const Q    = '?lossy=2&strip=1&webp=1';

const PHOTOS = [
  'TheWaterfrontAtCatalinaLanding_Exterior-00.jpg',
  'TheWaterfrontAtCatalinaLanding_Exteriors-1.jpg',
  'TheWaterfrontAtCatalinaLanding_Exteriors-3.jpg',
  'TheWaterfrontAtCatalinaLanding_Exteriors-4.jpg',
  'TheWaterfrontAtCatalinaLanding_Exteriors-5.jpg',
  'TheWaterfrontAtCatalinaLanding_Exteriors-6.jpg',
  'TheWaterfrontAtCatalinaLanding_Patio-05.jpg',
  'TheWaterfrontAtCatalinaLanding_Patio-11.jpg',
].map(f => BASE + f + Q).concat([
  'https://waterfrontcatalinalanding.com/wp-content/uploads/2023/05/Aerial-4-web.jpeg',
  'https://waterfrontcatalinalanding.com/wp-content/uploads/2023/05/BuildingPhoto-42-web.jpeg',
  'https://waterfrontcatalinalanding.com/wp-content/uploads/2023/05/Cover-web.jpeg',
  'https://waterfrontcatalinalanding.com/wp-content/uploads/2023/05/BuildingPhoto-40-2-scaled.jpg',
  'https://waterfrontcatalinalanding.com/wp-content/uploads/2023/05/BuildingPhoto-2-web-1.jpeg',
  'https://waterfrontcatalinalanding.com/wp-content/uploads/2023/05/BuildingPhoto-1-web.jpeg',
  'https://waterfrontcatalinalanding.com/wp-content/uploads/2023/05/BuildingPhoto-3-web.jpeg',
  'https://waterfrontcatalinalanding.com/wp-content/uploads/2023/05/Aerial-2-web.jpeg',
  'https://waterfrontcatalinalanding.com/wp-content/uploads/2023/05/Aerial-9-web.jpeg',
]);

// ─── GOOGLE SHEET ─────────────────────────────────────────────────────────────
const SHEET_ID           = '17Uze4Qz_0cXsnj4KS4cFmabK67F_jGG0PR_vtnegrK4';
const BG_SHEET_GID       = '589321751';    // Backgrounds tab
const EVENTS_SHEET_GID   = '871114333';    // Events tab
const SETTINGS_SHEET_GID = '2028632494';   // Settings tab

// Per-building Directory tabs (one tab per building)
const DIRECTORY_GIDS = {
  '310': '1627497967',
  '320': '702701545',
  '330': '1856569291',
  '340': '1644683988',
};

// Aliases
const EVENTS_SHEET_ID = SHEET_ID;
const BG_SHEET_ID     = SHEET_ID;

// ─── PANEL CONFIG ─────────────────────────────────────────────────────────────
const MODES = ['pw', 'pdir', 'pevt', 'pphoto'];
const DURS  = [10000, 15000, 12000, 12000];
const DAYS  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// ─── BUILDINGS ────────────────────────────────────────────────────────────────
const BUILDINGS = ['310', '320', '330', '340'];

// ─── WEATHER CODES ────────────────────────────────────────────────────────────
const WX_COND = {
  0:'Clear', 1:'Mostly Clear', 2:'Partly Cloudy', 3:'Overcast',
  45:'Fog', 48:'Freezing Fog',
  51:'Light Drizzle', 53:'Drizzle', 55:'Heavy Drizzle',
  61:'Light Rain', 63:'Moderate Rain', 65:'Heavy Rain',
  71:'Light Snow', 73:'Moderate Snow', 75:'Heavy Snow',
  80:'Showers', 81:'Rain Showers', 82:'Heavy Showers',
  95:'Thunderstorm', 96:'Thunderstorm', 99:'Severe Storm'
};
const WX_SHORT = {
  0:'Clear', 1:'Mostly Clear', 2:'Pt. Cloudy', 3:'Overcast',
  45:'Fog', 48:'Fog',
  51:'Drizzle', 53:'Drizzle', 55:'Rain',
  61:'Rain', 63:'Rain', 65:'Rain',
  71:'Snow', 73:'Snow', 75:'Snow',
  80:'Showers', 81:'Showers', 82:'Showers',
  95:'Storm', 96:'Storm', 99:'Storm'
};

// ─── UTILITIES ────────────────────────────────────────────────────────────────
function fetchWithTimeout(url, ms) {
  ms = ms || 15000;
  try {
    const ctrl = new AbortController();
    const tid  = setTimeout(() => { try { ctrl.abort(); } catch(e){} }, ms);
    return fetch(url, { cache: 'no-store', signal: ctrl.signal })
      .finally(() => clearTimeout(tid));
  } catch(e) {
    return fetch(url, { cache: 'no-store' });
  }
}

function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i+1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if      (c === '"')  inQuotes = true;
      else if (c === ',')  { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); field = ''; rows.push(row); row = []; }
      else if (c === '\r') {}
      else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}
