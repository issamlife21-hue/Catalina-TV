// ─── PASSCODE ─────────────────────────────────────────────────────────────────
const DEFAULT_PASSCODE = '0000';
let _verifiedThisSession = false;

function loadPasscode() {
  try {
    const v = localStorage.getItem('catalina-passcode-v1');
    if (v && v.length === 4) return v;
  } catch(e) {}
  return DEFAULT_PASSCODE;
}

function savePasscode(code) {
  try { localStorage.setItem('catalina-passcode-v1', code); } catch(e) {}
}

function _updateDots(filled) {
  document.querySelectorAll('#passcode-modal .pc-dot').forEach((d, i) => {
    d.classList.toggle('on', i < filled);
  });
}

function _shake() {
  const shell = document.querySelector('#passcode-modal .pc-shell');
  if (!shell) return;
  shell.classList.remove('shake');
  void shell.offsetWidth;
  shell.classList.add('shake');
}

function openPasscodePrompt(opts) {
  const modal = document.getElementById('passcode-modal');
  const input = document.getElementById('pc-input');
  if (!modal || !input) return;
  document.getElementById('pc-title').textContent = opts.title || 'Enter Passcode';
  document.getElementById('pc-sub').textContent   = opts.sub   || '';
  modal.classList.add('open');
  document.body.classList.add('modal-open');
  input.value = '';
  _updateDots(0);
  setTimeout(() => input.focus(), 50);

  modal._handler = ev => {
    const v = ev.target.value.replace(/\D/g, '').slice(0, 4);
    ev.target.value = v;
    _updateDots(v.length);
    if (v.length === 4) {
      if (opts.verify(v)) {
        closePasscodePrompt();
        if (opts.onSuccess) opts.onSuccess(v);
      } else {
        _shake();
        setTimeout(() => { input.value = ''; _updateDots(0); input.focus(); }, 400);
      }
    }
  };
  input.addEventListener('input', modal._handler);

  modal._key = ev => {
    if (ev.key === 'Escape') {
      closePasscodePrompt();
      if (opts.onCancel) opts.onCancel();
    }
  };
  document.addEventListener('keydown', modal._key);
}

function closePasscodePrompt() {
  const modal = document.getElementById('passcode-modal');
  const input = document.getElementById('pc-input');
  if (!modal) return;
  modal.classList.remove('open');
  document.body.classList.remove('modal-open');
  if (modal._handler) { input.removeEventListener('input', modal._handler); modal._handler = null; }
  if (modal._key)     { document.removeEventListener('keydown', modal._key); modal._key = null; }
}

function requireUnlock(callback) {
  if (_verifiedThisSession) { callback(); return; }
  openPasscodePrompt({
    title: 'Enter Passcode',
    sub:   'Access Settings',
    verify: v => v === loadPasscode(),
    onSuccess: () => { _verifiedThisSession = true; callback(); },
    onCancel:  () => {}
  });
}

function promptChangePasscode() {
  openPasscodePrompt({
    title: 'Current Passcode',
    sub:   'Enter current code to continue',
    verify: v => v === loadPasscode(),
    onSuccess: () => {
      setTimeout(() => {
        openPasscodePrompt({
          title: 'New Passcode',
          sub:   'Choose a new 4-digit code',
          verify: () => true,
          onSuccess: v => { savePasscode(v); _verifiedThisSession = true; }
        });
      }, 200);
    }
  });
}

function initPasscode() {
  const btn = document.getElementById('pc-cancel');
  if (btn) btn.addEventListener('click', e => { e.stopPropagation(); closePasscodePrompt(); });
}
