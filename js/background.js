// ─── BACKGROUND SLIDESHOW ─────────────────────────────────────────────────────
let bgIdx      = 0;
let bgCurLane  = 0;
let bgEl       = null;
const bgSlides = [];

const BG_SHEET_URL     = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${BG_SHEET_GID}`;
const BG_REFRESH_MS    = 10 * 60 * 1000;
const BG_CACHE_KEY     = 'catalina-backgrounds-v2';
const BG_FAIL_DELAYS   = [30000, 60000, 120000];

let _livePhotos    = null;
let _bgSyncStarted = false;
let _bgFailCount   = 0;
let _bgFailTimer   = null;

function parseBackgroundsCSV(text) {
  const rows = parseCSV(text);
  if (rows.length < 2) return [];

  const header   = rows[0].map(c => (c || '').trim().toLowerCase());
  const urlIdx   = header.indexOf('url');
  const activeIdx = header.indexOf('active');
  if (urlIdx < 0) return [];

  const out = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const url = (row[urlIdx] || '').trim();
    if (!/^https?:\/\//i.test(url)) continue;
    if (activeIdx >= 0) {
      const active = (row[activeIdx] || '').trim().toUpperCase();
      if (active === 'FALSE' || active === '0' || active === 'NO' || active === 'OFF') continue;
    }
    out.push(url);
  }
  return out;
}

function getEffectivePhotos() {
  if (_livePhotos && _livePhotos.length) return _livePhotos;
  try {
    const raw = localStorage.getItem(BG_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch(e) {}
  return PHOTOS;
}

async function fetchBackgroundsFromSheet() {
  if (!BG_SHEET_GID) return;
  try {
    const res  = await fetchWithTimeout(BG_SHEET_URL, 15000);
    if (!res.ok) throw new Error('http ' + res.status);
    const text = await res.text();
    const parsed = parseBackgroundsCSV(text);
    if (!parsed.length) throw new Error('no photos parsed');
    _livePhotos = parsed;
    try { localStorage.setItem(BG_CACHE_KEY, JSON.stringify(parsed)); } catch(e) {}
    _bgFailCount = 0;
    if (_bgFailTimer) { clearTimeout(_bgFailTimer); _bgFailTimer = null; }
  } catch(err) {
    console.warn('[background] fetch failed; using cache/fallback:', err);
    const delay = BG_FAIL_DELAYS[Math.min(_bgFailCount, BG_FAIL_DELAYS.length - 1)];
    _bgFailCount++;
    if (_bgFailTimer) clearTimeout(_bgFailTimer);
    _bgFailTimer = setTimeout(fetchBackgroundsFromSheet, delay);
  }
}

function startBackgroundsLiveSync() {
  if (_bgSyncStarted) return;
  _bgSyncStarted = true;
  fetchBackgroundsFromSheet();
  setInterval(fetchBackgroundsFromSheet, BG_REFRESH_MS);
}

function preloadBg(url) {
  const img = new Image();
  img.src = url;
}

function initBackground() {
  bgEl = document.getElementById('bg');
  for (let i = 0; i < 2; i++) {
    const d = document.createElement('div');
    d.className = 'bgs';
    bgEl.appendChild(d);
    bgSlides.push(d);
  }
  const photos = getEffectivePhotos();
  bgSlides[0].style.backgroundImage = `url('${photos[0]}')`;
  bgSlides[0].classList.add('on');
  preloadBg(photos[1 % photos.length]);
  startBackgroundsLiveSync();
  setInterval(advanceBackground, 9000);
}

function advanceBackground() {
  const photos   = getEffectivePhotos();
  const nextIdx  = (bgIdx + 1) % photos.length;
  const nextLane = 1 - bgCurLane;
  const cur      = bgSlides[bgCurLane];
  const next     = bgSlides[nextLane];

  next.style.backgroundImage = `url('${photos[nextIdx]}')`;
  bgEl.appendChild(next);
  next.style.animation = 'none';
  void next.offsetWidth;
  next.style.animation = 'kb 18s ease-in-out forwards';
  cur.classList.remove('on');
  next.classList.add('on');

  bgIdx     = nextIdx;
  bgCurLane = nextLane;
  preloadBg(photos[(nextIdx + 1) % photos.length]);
}
