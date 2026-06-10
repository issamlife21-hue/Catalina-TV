// ─── DEFAULT DIRECTORY (real tenant data — fallback if sheet unreachable) ─────
const DEFAULT_DIRECTORY = [
  {
    num: '310', street: 'Golden Shore',
    entries: [
      { name: 'Trustees of the CSU',  floorType: 'custom', floorCustom: 'Suite 100 / 300' },
      { name: 'Keesal Young & Logan', floorType: 'custom', floorCustom: 'Suite 200 / 400' },
    ]
  },
  {
    num: '320', street: 'Golden Shore',
    entries: [
      { name: 'Catalina Channel Express',            floorType: 'custom', floorCustom: 'G100 (LL)'  },
      { name: 'CBEM',                                floorType: 'custom', floorCustom: 'Suite 340'  },
      { name: 'National Property Services',          floorType: 'custom', floorCustom: 'Suite 200'  },
      { name: 'Oakwood Holdings Inc.',               floorType: 'custom', floorCustom: 'Suite 130'  },
      { name: 'Rocket Internetworking Inc.',         floorType: 'custom', floorCustom: 'Suite 370'  },
      { name: 'Santa Catalina Island Conservancy',   floorType: 'custom', floorCustom: 'Suite 220'  },
    ]
  },
  {
    num: '330', street: 'Golden Shore',
    entries: [
      { name: 'Barrett Business',        floorType: 'custom', floorCustom: 'Suite 130 / 170' },
      { name: 'Building Management',     floorType: 'custom', floorCustom: 'Suite 200'       },
      { name: 'Envision Family Law',     floorType: 'custom', floorCustom: 'Suite 230'       },
      { name: 'Trustees of the CSU',     floorType: 'custom', floorCustom: 'Suite 300'       },
    ]
  },
  {
    num: '340', street: 'Golden Shore',
    entries: [
      { name: 'Allison Shipping',              floorType: 'custom', floorCustom: 'Suite 200'       },
      { name: 'American Corporate Security',   floorType: 'custom', floorCustom: 'Suite 100'       },
      { name: 'Boyett Petroleum',              floorType: 'custom', floorCustom: 'Suite 205 / 210' },
      { name: 'GSA Homeland Security',         floorType: 'custom', floorCustom: 'Suite 300'       },
      { name: 'Universal Services Organization', floorType: 'custom', floorCustom: 'Suite 400'     },
    ]
  }
];

// ─── NORMALIZATION ────────────────────────────────────────────────────────────
function normalizeEntry(e) {
  const out = { name: (e.name || '').toString(), floorType: e.floorType || 'custom' };
  switch (out.floorType) {
    case 'single': out.floorNum    = parseInt(e.floorNum, 10) || 1; break;
    case 'range':  out.floorFrom   = parseInt(e.floorFrom, 10) || 1;
                   out.floorTo     = parseInt(e.floorTo, 10) || 1; break;
    case 'named':  out.floorArea   = (e.floorArea || 'Ground').toString(); break;
    default:       out.floorCustom = (e.floorCustom || '').toString(); break;
  }
  return out;
}

function normalizeBuilding(b) {
  return {
    num:     (b.num || '').toString(),
    street:  (b.street || '').toString(),
    entries: Array.isArray(b.entries) ? b.entries.map(normalizeEntry) : []
  };
}

function formatFloor(entry) {
  switch (entry.floorType) {
    case 'single': return `Floor ${entry.floorNum}`;
    case 'range':  return `Floors ${entry.floorFrom} – ${entry.floorTo}`;
    case 'named':  return entry.floorArea || '';
    default:       return entry.floorCustom || '';
  }
}

// ─── SHEET SYNC ───────────────────────────────────────────────────────────────
// Each building has its own Directory tab with two columns: tenant | suite.
// Row 1 is the header; data starts at row 2.
function getDirectoryCSVUrl(buildingNum) {
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${DIRECTORY_GIDS[buildingNum]}`;
}
const SHEET_REFRESH_MS = 10 * 60 * 1000;
const SHEET_CACHE_KEY  = 'catalina-directory-v3';
const FAIL_DELAYS      = [30000, 60000, 120000];

let _liveDirectory   = null;
let _syncStarted     = false;
let _failCount       = 0;
let _failTimer       = null;

// Parse a single building's tab (two columns: tenant, suite). Read by header
// name so column order can change without breaking.
function parseDirectoryTab(text, buildingNum) {
  const rows = parseCSV(text);
  const out  = { num: buildingNum, street: 'Golden Shore', entries: [] };
  if (rows.length < 2) return out;

  const header   = rows[0].map(c => (c || '').trim().toLowerCase());
  const nameIdx  = header.indexOf('tenant');
  const suiteIdx = header.indexOf('suite');
  if (nameIdx < 0) return out;

  for (let i = 1; i < rows.length; i++) {
    const row   = rows[i];
    const name  = (row[nameIdx] || '').trim();
    const suite = suiteIdx >= 0 ? (row[suiteIdx] || '').trim() : '';
    if (!name) continue;
    out.entries.push({ name, floorType: 'custom', floorCustom: suite });
  }
  return out;
}

function getEffectiveDirectory() {
  if (_liveDirectory) return _liveDirectory;
  try {
    const raw = localStorage.getItem(SHEET_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed.map(normalizeBuilding);
    }
  } catch(e) {}
  return DEFAULT_DIRECTORY;
}

// Returns only the selected building, or all if none selected
function getDisplayedBuildings() {
  const selected = getSelectedBuilding();
  const all = getEffectiveDirectory();
  if (!selected) return all;
  return all.filter(b => b.num === selected);
}

// Cached/fallback data for a single building, used when its tab fetch fails.
function getCachedBuilding(buildingNum) {
  try {
    const raw = localStorage.getItem(SHEET_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const hit = parsed.find(b => b && b.num === buildingNum);
        if (hit && Array.isArray(hit.entries) && hit.entries.length) return normalizeBuilding(hit);
      }
    }
  } catch(e) {}
  const def = DEFAULT_DIRECTORY.find(b => b.num === buildingNum);
  return def ? normalizeBuilding(def) : { num: buildingNum, street: 'Golden Shore', entries: [] };
}

async function fetchDirectoryFromSheet() {
  const buildings = BUILDINGS; // ['310','320','330','340'] in numeric order
  try {
    const results = await Promise.all(buildings.map(async num => {
      try {
        const res = await fetchWithTimeout(getDirectoryCSVUrl(num), 15000);
        if (!res.ok) throw new Error('http ' + res.status);
        const text   = await res.text();
        const parsed = parseDirectoryTab(text, num);
        if (!parsed.entries.length) throw new Error('no entries parsed for ' + num);
        return normalizeBuilding(parsed);
      } catch(e) {
        console.warn('[directory] tab fetch failed for ' + num + '; using cache/fallback:', e);
        return getCachedBuilding(num);
      }
    }));

    _liveDirectory = results;
    try { localStorage.setItem(SHEET_CACHE_KEY, JSON.stringify(_liveDirectory)); } catch(e) {}
    try { renderDirectory(); } catch(e) { console.warn('[directory] render error:', e); }
    _failCount = 0;
    if (_failTimer) { clearTimeout(_failTimer); _failTimer = null; }
  } catch(err) {
    console.warn('[directory] fetch failed; using cache/fallback:', err);
    const delay = FAIL_DELAYS[Math.min(_failCount, FAIL_DELAYS.length - 1)];
    _failCount++;
    if (_failTimer) clearTimeout(_failTimer);
    _failTimer = setTimeout(fetchDirectoryFromSheet, delay);
  }
}

function startDirectoryLiveSync() {
  if (_syncStarted) return;
  _syncStarted = true;
  fetchDirectoryFromSheet();
  setInterval(fetchDirectoryFromSheet, SHEET_REFRESH_MS);
}

// ─── RENDER ───────────────────────────────────────────────────────────────────
function renderDirectory() {
  startDirectoryLiveSync();
  const grid = document.getElementById('dir-grid');
  if (!grid) return;

  const buildings = getDisplayedBuildings();
  grid.innerHTML  = '';

  // If showing a single building, use full-width single column
  grid.dataset.count = buildings.length;

  buildings.forEach(building => {
    const card = document.createElement('div');
    card.className = 'db';

    const head = document.createElement('div');
    head.className = 'db-head';
    const num = document.createElement('div');
    num.className = 'db-num';
    num.textContent = building.num;
    head.appendChild(num);
    card.appendChild(head);

    building.entries.forEach(entry => {
      if (!entry.name) return;
      const dt  = document.createElement('div');
      dt.className = 'dt';
      const dtn = document.createElement('span');
      dtn.className = 'dt-n';
      dtn.textContent = entry.name;
      const dtf = document.createElement('span');
      dtf.className = 'dt-f';
      dtf.textContent = formatFloor(entry);
      dt.append(dtn, dtf);
      card.appendChild(dt);
    });

    grid.appendChild(card);
  });
}
