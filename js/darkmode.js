// ─── DARK HOURS SCHEDULER ─────────────────────────────────────────────────────
// Reads from the Sheet Settings tab.
// Keys (case-insensitive): SLEEP = when screen goes dark, START = when it wakes
// Times are in 24h format (e.g. 20:00, 6:00) — Los Angeles timezone.
// Checks every minute. Smooth 2-second fade in/out.

const DARK_SETTINGS_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SETTINGS_SHEET_GID}`;
const DARK_REFRESH_MS   = 30 * 60 * 1000; // re-fetch settings every 30 min
const DARK_CHECK_MS     = 60 * 1000;       // check time every minute
const DARK_CACHE_KEY    = 'catalina-dark-hours-v1';

let _darkSleep = null; // e.g. "20:00" — screen goes dark
let _darkStart = null; // e.g. "06:00" — screen wakes up
let _isDark    = false;

// ─── PARSE SETTINGS CSV ───────────────────────────────────────────────────────
// Sheet format (Settings tab):
//   Key   | Value
//   SLEEP | 20:00   ← screen goes dark
//   START | 06:00   ← screen wakes up
function parseSettingsCSV(text) {
  const rows = parseCSV(text);
  if (rows.length < 2) return {};
  const header = rows[0].map(c => (c || '').trim().toLowerCase());
  const keyIdx = header.indexOf('key');
  const valIdx = header.indexOf('value');
  if (keyIdx < 0 || valIdx < 0) return {};
  const out = {};
  for (let i = 1; i < rows.length; i++) {
    const k = (rows[i][keyIdx] || '').trim().toLowerCase(); // normalize to lowercase
    const v = (rows[i][valIdx] || '').trim();
    if (k) out[k] = v;
  }
  return out;
}

async function fetchDarkHoursSettings() {
  try {
    const res  = await fetchWithTimeout(DARK_SETTINGS_URL, 15000);
    if (!res.ok) throw new Error('http ' + res.status);
    const text = await res.text();
    const data = parseSettingsCSV(text);

    // Accepts SLEEP / sleep (screen goes dark)
    if (data.sleep) _darkSleep = data.sleep;
    // Accepts START / start (screen wakes up)
    if (data.start) _darkStart = data.start;

    try {
      localStorage.setItem(DARK_CACHE_KEY, JSON.stringify({ sleep: _darkSleep, start: _darkStart }));
    } catch(e) {}

  } catch(err) {
    // Load from cache on failure
    try {
      const raw = localStorage.getItem(DARK_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.sleep) _darkSleep = parsed.sleep;
        if (parsed.start) _darkStart = parsed.start;
      }
    } catch(e) {}
  }
}

// ─── TIME HELPERS ─────────────────────────────────────────────────────────────
function parseHHMM(str) {
  if (!str) return null;
  const parts = str.split(':');
  if (parts.length < 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

function isInDarkHours() {
  if (!_darkSleep || !_darkStart) return false;

  // Use Los Angeles local time
  const now = new Date();
  const laTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  const cur   = laTime.getHours() * 60 + laTime.getMinutes();

  const sleepMin = parseHHMM(_darkSleep);
  const startMin = parseHHMM(_darkStart);
  if (sleepMin === null || startMin === null) return false;

  // Handles overnight: e.g. SLEEP=20:00, START=06:00
  if (sleepMin > startMin) return cur >= sleepMin || cur < startMin;
  return cur >= sleepMin && cur < startMin;
}

// ─── BLACKOUT OVERLAY ─────────────────────────────────────────────────────────
function applyDarkState() {
  const shouldBeDark = isInDarkHours();
  if (shouldBeDark === _isDark) return;
  _isDark = shouldBeDark;

  let overlay = document.getElementById('dark-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'dark-overlay';
    overlay.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'width:100%', 'height:100%',
      'background:#000', 'z-index:9000', 'pointer-events:none',
      'transition:opacity 2s ease', 'opacity:0'
    ].join(';');
    document.body.appendChild(overlay);
  }

  overlay.style.opacity       = _isDark ? '1' : '0';
  overlay.style.pointerEvents = _isDark ? 'all' : 'none';
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
function initDarkHours() {
  fetchDarkHoursSettings();
  setInterval(fetchDarkHoursSettings, DARK_REFRESH_MS);
  setInterval(applyDarkState, DARK_CHECK_MS);
  applyDarkState(); // check immediately on load
}
