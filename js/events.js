// ─── DEFAULT EVENTS (fallback if sheet unreachable) ───────────────────────────
// These match the sheet structure exactly: no frequency, ranked order
const DEFAULT_EVENTS = [
  {
    name: 'Sunset Networking Social',
    date: 'Every Friday', time: '5:00 PM',
    desc: 'Tenants and guests gather on the marina deck for drinks, conversation, and harbor views.',
    loc:  'Marina Deck · 340 Golden Shore',
    rank: 1
  },
  {
    name: 'Waterfront Lunch & Learn',
    date: 'First Tuesday', time: '12:00 PM',
    desc: 'A monthly speaker series with local business leaders and community guests.',
    loc:  'Conference Center · 330 Golden Shore',
    rank: 2
  }
];

// ─── SHEET SYNC ───────────────────────────────────────────────────────────────
// Sheet columns (Events tab):
//   Title | Date | Time | Location | Description | Rank | Active | Notes
// Notes column is internal only — never shown on screen.

const EVT_SHEET_URL   = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${EVENTS_SHEET_GID}`;
const EVT_REFRESH_MS  = 10 * 60 * 1000;
const EVT_CACHE_KEY   = 'catalina-events-v2';
const EVT_FAIL_DELAYS = [30000, 60000, 120000];

let _liveEvents     = null;
let _evtSyncStarted = false;
let _evtFailCount   = 0;
let _evtFailTimer   = null;

function parseEventsCSV(text) {
  const rows = parseCSV(text);
  if (rows.length < 2) return [];

  // Read by header name — resilient to column reordering
  const header = rows[0].map(c => (c || '').trim().toLowerCase());
  const idx = {
    title:  header.indexOf('title'),
    date:   header.indexOf('date'),
    time:   header.indexOf('time'),
    loc:    header.indexOf('location'),
    desc:   header.indexOf('description'),
    rank:   header.indexOf('rank'),
    active: header.indexOf('active'),
    // Notes intentionally not read — internal use only
  };

  if (idx.title < 0) return [];

  const out = [];
  for (let i = 1; i < rows.length; i++) {
    const row   = rows[i];
    const title = (row[idx.title] || '').trim();
    if (!title) continue;

    // Skip inactive rows
    if (idx.active >= 0) {
      const v = (row[idx.active] || '').trim().toUpperCase();
      if (v !== 'TRUE' && v !== 'YES' && v !== '1' && v !== 'ON') continue;
    }

    const rankVal = idx.rank >= 0 ? parseInt(row[idx.rank] || '99', 10) : 99;

    out.push({
      name: title,
      date: idx.date >= 0 ? (row[idx.date] || '').trim() : '',
      time: idx.time >= 0 ? (row[idx.time] || '').trim() : '',
      loc:  idx.loc  >= 0 ? (row[idx.loc]  || '').trim() : '',
      desc: idx.desc >= 0 ? (row[idx.desc] || '').trim() : '',
      rank: isNaN(rankVal) ? 99 : rankVal,
    });
  }

  // Sort by rank ascending (1 = top), then cap at 3 cards
  out.sort((a, b) => a.rank - b.rank);
  return out.slice(0, 3);
}

function getEffectiveEvents() {
  if (Array.isArray(_liveEvents)) return _liveEvents;
  try {
    const raw = localStorage.getItem(EVT_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch(e) {}
  return DEFAULT_EVENTS;
}

function eventsPageEnabled() {
  try { return localStorage.getItem('catalina-events-enabled') !== 'false'; } catch(e) { return true; }
}

function shouldSkipEventsPanel() {
  if (!eventsPageEnabled()) return true;
  return getEffectiveEvents().length === 0;
}

async function fetchEventsFromSheet() {
  if (!EVENTS_SHEET_GID) return;
  try {
    const res  = await fetchWithTimeout(EVT_SHEET_URL, 15000);
    if (!res.ok) throw new Error('http ' + res.status);
    const text = await res.text();
    _liveEvents = parseEventsCSV(text);
    try { localStorage.setItem(EVT_CACHE_KEY, JSON.stringify(_liveEvents)); } catch(e) {}
    try { renderEvents(); } catch(e) { console.warn('[events] render error:', e); }
    _evtFailCount = 0;
    if (_evtFailTimer) { clearTimeout(_evtFailTimer); _evtFailTimer = null; }
  } catch(err) {
    console.warn('[events] fetch failed; using cache/fallback:', err);
    const delay = EVT_FAIL_DELAYS[Math.min(_evtFailCount, EVT_FAIL_DELAYS.length - 1)];
    _evtFailCount++;
    if (_evtFailTimer) clearTimeout(_evtFailTimer);
    _evtFailTimer = setTimeout(fetchEventsFromSheet, delay);
  }
}

function startEventsLiveSync() {
  if (_evtSyncStarted) return;
  _evtSyncStarted = true;
  fetchEventsFromSheet();
  setInterval(fetchEventsFromSheet, EVT_REFRESH_MS);
}

// ─── RENDER ───────────────────────────────────────────────────────────────────
// Card layout: Title → Date · Time → Description → Location
function renderEvents() {
  startEventsLiveSync();
  const grid = document.getElementById('evt-grid');
  if (!grid) return;

  const events = getEffectiveEvents();
  grid.innerHTML    = '';
  grid.dataset.count = events.length;

  if (events.length === 0) {
    const empty = document.createElement('div');
    empty.className   = 'ec-empty';
    empty.textContent = 'No upcoming events';
    grid.appendChild(empty);
    return;
  }

  events.forEach(ev => {
    const card = document.createElement('div');
    card.className = 'ec';

    // Date · Time — combined on one line, skip blanks
    const metaParts = [ev.date, ev.time].filter(Boolean);
    const metaText  = metaParts.join(' · ');

    const name = document.createElement('div'); name.className = 'ec-name'; name.textContent = ev.name;
    const meta = document.createElement('div'); meta.className = 'ec-meta'; meta.textContent = metaText;
    const desc = document.createElement('div'); desc.className = 'ec-desc'; desc.textContent = ev.desc;
    const loc  = document.createElement('div'); loc.className  = 'ec-loc';  loc.textContent  = ev.loc;

    card.append(name, meta, desc, loc);
    grid.appendChild(card);
  });
}
