// ─── BUILDING SELECTOR ────────────────────────────────────────────────────────
const BUILDING_KEY = 'catalina-building-v1';

function getSelectedBuilding() {
  try { return localStorage.getItem(BUILDING_KEY) || ''; } catch(e) { return ''; }
}

function applyBuilding(num) {
  try { localStorage.setItem(BUILDING_KEY, num || ''); } catch(e) {}
  // Update chip UI
  document.querySelectorAll('[data-building]').forEach(c => {
    c.classList.toggle('active', c.dataset.building === num);
  });
  // Re-render directory with filter
  try { renderDirectory(); } catch(e) {}
}

// ─── THEME ────────────────────────────────────────────────────────────────────
function applyTheme(theme) {
  if (!['light','navy','og'].includes(theme)) theme = 'dark';
  document.body.classList.remove('light','navy','og');
  if (theme !== 'dark') document.body.classList.add(theme);
  document.querySelectorAll('[data-theme]').forEach(c => {
    c.classList.toggle('active', c.dataset.theme === theme);
  });
  try { localStorage.setItem('catalina-theme', theme); } catch(e) {}
}

// ─── CORNER STYLE ─────────────────────────────────────────────────────────────
function applyCorner(corner) {
  const isRound = corner === 'round';
  document.body.classList.toggle('rounded', isRound);
  _setSwitch('round', isRound);
  try { localStorage.setItem('catalina-corner', isRound ? 'round' : 'default'); } catch(e) {}
}

// ─── WEATHER ICONS ────────────────────────────────────────────────────────────
function applyWeatherIcons(state) {
  const show = state === 'show';
  document.body.classList.toggle('no-weather-icons', !show);
  _setSwitch('icons', show);
  try { localStorage.setItem('catalina-icons', show ? 'show' : 'hide'); } catch(e) {}
}

// ─── DAYLIGHT MODE ────────────────────────────────────────────────────────────
function applyDaylight(state) {
  const on = state === 'on' || state === true;
  document.body.classList.toggle('daylight', on);
  _setSwitch('daylight', on);
  try { localStorage.setItem('catalina-daylight', on ? 'on' : 'off'); } catch(e) {}
}

// ─── PROPERTY POSITION ───────────────────────────────────────────────────────
function applyPropertyPos(pos) {
  if (!['top','bottom'].includes(pos)) pos = 'center';
  document.body.classList.remove('prop-pos-top','prop-pos-center','prop-pos-bottom');
  document.body.classList.add('prop-pos-' + pos);
  document.querySelectorAll('[data-prop-pos]').forEach(c => {
    c.classList.toggle('active', c.dataset.propPos === pos);
  });
  try { localStorage.setItem('catalina-property-pos', pos); } catch(e) {}
}

// ─── PANEL SOLIDNESS ─────────────────────────────────────────────────────────
function applyPanelSolidness(val) {
  let v = parseFloat(val);
  if (!isFinite(v)) v = 1;
  v = Math.min(1.6, Math.max(0.4, v));
  document.documentElement.style.setProperty('--panel-alpha-mult', String(v));
  const slider = document.getElementById('panel-solidness');
  if (slider && parseFloat(slider.value) !== v) slider.value = String(v);
  try { localStorage.setItem('catalina-panel-solidness', String(v)); } catch(e) {}
}

// ─── EVENTS VISIBILITY ───────────────────────────────────────────────────────
function applyEventsVisibility(state) {
  const visible = state === 'show';
  document.body.classList.toggle('events-hidden', !visible);
  _setSwitch('events', visible);
  try { localStorage.setItem('catalina-events-enabled', visible ? 'true' : 'false'); } catch(e) {}
  if (!visible && typeof curMode !== 'undefined' && curMode === 2) {
    goMode(getNextMode(2));
  }
}

// ─── FULLSCREEN ───────────────────────────────────────────────────────────────
function _updateFullscreenLabel() {
  const lab = document.getElementById('fullscreen-label');
  if (lab) lab.textContent = document.fullscreenElement ? 'Exit Fullscreen' : 'Enter Fullscreen';
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
}

// ─── SWITCH HELPER ────────────────────────────────────────────────────────────
function _setSwitch(key, on) {
  const sw = document.querySelector(`.ios-switch[data-toggle="${key}"]`);
  if (sw) sw.setAttribute('aria-pressed', on ? 'true' : 'false');
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
function initSettings() {
  const btn  = document.getElementById('settings-btn');
  const menu = document.getElementById('settings-menu');
  const read = k => { try { return localStorage.getItem(k); } catch(e) { return null; } };

  // Restore all settings
  applyTheme(read('catalina-theme') || 'dark');
  applyCorner(read('catalina-corner') || 'default');
  applyWeatherIcons(read('catalina-icons') === 'hide' ? 'hide' : 'show');
  applyEventsVisibility(read('catalina-events-enabled') === 'false' ? 'hide' : 'show');
  applyDaylight(read('catalina-daylight') === 'on' ? 'on' : 'off');
  applyPropertyPos(read('catalina-property-pos') || 'center');
  applyPanelSolidness(read('catalina-panel-solidness') || '1');
  _updateFullscreenLabel();

  // Restore building selection
  const savedBuilding = getSelectedBuilding();
  if (savedBuilding) applyBuilding(savedBuilding);

  // Settings gear toggle (passcode protected)
  btn.addEventListener('click', e => {
    e.stopPropagation();
    if (menu.classList.contains('open')) {
      menu.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      return;
    }
    requireUnlock(() => {
      menu.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
    });
  });

  // Building chips
  document.querySelectorAll('[data-building]').forEach(chip => {
    chip.addEventListener('click', e => {
      e.stopPropagation();
      const current = getSelectedBuilding();
      // Clicking active building deselects (shows all)
      applyBuilding(current === chip.dataset.building ? '' : chip.dataset.building);
    });
  });

  // Toggle switches
  document.querySelectorAll('.ios-switch').forEach(sw => {
    sw.addEventListener('click', e => {
      e.stopPropagation();
      const key  = sw.dataset.toggle;
      const isOn = sw.getAttribute('aria-pressed') === 'true';
      if      (key === 'round')   applyCorner(isOn ? 'default' : 'round');
      else if (key === 'icons')   applyWeatherIcons(isOn ? 'hide' : 'show');
      else if (key === 'events')  applyEventsVisibility(isOn ? 'hide' : 'show');
      else if (key === 'daylight') applyDaylight(!isOn);
    });
  });

  // Theme chips
  document.querySelectorAll('[data-theme]').forEach(chip => {
    chip.addEventListener('click', e => { e.stopPropagation(); applyTheme(chip.dataset.theme); });
  });

  // Property position chips
  document.querySelectorAll('[data-prop-pos]').forEach(chip => {
    chip.addEventListener('click', e => { e.stopPropagation(); applyPropertyPos(chip.dataset.propPos); });
  });

  // Panel solidness slider
  const slider = document.getElementById('panel-solidness');
  if (slider) {
    const h = e => { e.stopPropagation(); applyPanelSolidness(e.target.value); };
    slider.addEventListener('input', h);
    slider.addEventListener('change', h);
    slider.addEventListener('click', e => e.stopPropagation());
  }

  // Fullscreen
  const fsBtn = document.getElementById('fullscreen-btn');
  if (fsBtn) fsBtn.addEventListener('click', e => { e.stopPropagation(); toggleFullscreen(); });
  document.addEventListener('fullscreenchange', _updateFullscreenLabel);

  // Passcode change
  const pcBtn = document.getElementById('change-pc-btn');
  if (pcBtn) pcBtn.addEventListener('click', e => { e.stopPropagation(); promptChangePasscode(); });

  // Close on outside click
  document.addEventListener('click', e => {
    if (!menu.contains(e.target) && !btn.contains(e.target)) {
      menu.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
}
