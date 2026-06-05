// ─── BOOTSTRAP ────────────────────────────────────────────────────────────────
TABS = document.querySelectorAll('.tab');

// Auto-hide cursor after 3s of no movement
let _cursorTimer;
function activateCursor() {
  document.body.classList.add('cursor-active');
  clearTimeout(_cursorTimer);
  _cursorTimer = setTimeout(() => document.body.classList.remove('cursor-active'), 3000);
}
document.addEventListener('mousemove', activateCursor);
document.addEventListener('mousedown', activateCursor);

// ─── INIT ALL MODULES ─────────────────────────────────────────────────────────
initPasscode();
initSettings();
applyInfo();

renderDirectory();
renderEvents();
initInfoEditor();
initDarkHours();

tick();
setInterval(tick, 1000);

initBackground();
loadWeather();
goMode(0);

// Register Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

// ─── LIFECYCLE HARDENING ──────────────────────────────────────────────────────
function _safe(fn) {
  try { if (typeof fn === 'function') fn(); } catch(e) { console.warn('[lifecycle]', e); }
}

function _nudgeAllSyncs() {
  _safe(fetchEventsFromSheet);
  _safe(fetchBackgroundsFromSheet);
  _safe(fetchDirectoryFromSheet);
  _safe(loadWeather);
  _safe(fetchDarkHoursSettings);
}

// Refresh all data when WiFi comes back
window.addEventListener('online', () => {
  console.info('[lifecycle] online — refreshing data');
  _nudgeAllSyncs();
});

// Refresh data if TV was asleep and wakes up
let _lastVisibleRefreshAt = Date.now();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    if (Date.now() - _lastVisibleRefreshAt > 5 * 60 * 1000) {
      _lastVisibleRefreshAt = Date.now();
      _nudgeAllSyncs();
    }
  }
});

// Watchdog — if panel rotation gets stuck, force-advance
setInterval(() => {
  try {
    if (typeof curMode === 'undefined' || typeof DURS === 'undefined') return;
    const maxDur  = Math.max(...DURS);
    const elapsed = Date.now() - (typeof _lastModeChangeAt === 'number' ? _lastModeChangeAt : 0);
    if (elapsed > maxDur * 2 + 5000) {
      console.warn('[watchdog] rotation stuck — forcing next panel');
      goMode((curMode + 1) % MODES.length);
    }
  } catch(e) { console.warn('[watchdog] error:', e); }
}, 10000);

// Daily silent reload at 3am (only after ≥6h uptime) to clear memory drift
(function scheduleDailyReload() {
  try {
    const minUptime = 6 * 60 * 60 * 1000;
    const now  = new Date();
    const next = new Date(now);
    next.setHours(3, 0, 0, 0);
    while (next - now < minUptime) next.setDate(next.getDate() + 1);
    const ms = next - now;
    setTimeout(() => { try { location.reload(); } catch(e) {} }, ms);
    console.info('[lifecycle] daily reload in', Math.round(ms / 60000), 'min');
  } catch(e) { console.warn('[lifecycle] reload schedule error:', e); }
})();
