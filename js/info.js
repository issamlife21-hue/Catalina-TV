const DEFAULT_INFO={
  logoName:'Catalina Landing',
  logoSub:'310 – 340 Golden Shore · Long Beach, CA',
  demoTag:'Preview · TI Capital · Catalina Landing',
  dirFoot:'Leasing Inquiries · NRE Commercial · (424) 477-3816',
  evtFoot:'Post an Event · TI Capital Management · lobby@ticapital.com',
  photoTitle:'The Waterfront at Catalina Landing',
  photoSub:'Long Beach, California'
};

const INFO_FIELDS=[
  ['logoName','Logo · Main Title','Building name shown top-left'],
  ['logoSub','Logo · Subtitle','Address line under the logo'],
  ['demoTag','Top-Center Tag','Small badge at the very top of the screen'],
  ['dirFoot','Directory Footer','Leasing line below the directory cards'],
  ['evtFoot','Events Footer','Contact line below the event cards'],
  ['photoTitle','Property Panel · Title','Main title on the Property photo panel'],
  ['photoSub','Property Panel · Subtitle','Subtitle line under the property title']
];

function loadInfo(){
  try{
    const raw=localStorage.getItem('catalina-info-v1');
    if(raw){
      const parsed=JSON.parse(raw);
      if(parsed&&typeof parsed==='object') return {...DEFAULT_INFO,...parsed};
    }
  }catch(e){}
  return {...DEFAULT_INFO};
}

function saveInfo(info){
  try{localStorage.setItem('catalina-info-v1',JSON.stringify(info));}catch(e){}
}

function applyInfo(){
  const info=loadInfo();
  const set=(id,val)=>{const el=document.getElementById(id);if(el) el.textContent=val;};
  set('logo-name',info.logoName);
  set('logo-sub',info.logoSub);
  set('demo-tag',info.demoTag);
  set('dir-foot',info.dirFoot);
  set('evt-foot',info.evtFoot);
  set('photo-title',info.photoTitle);
  set('photo-sub',info.photoSub);
}

function buildInfoEditorForm(){
  const wrap=document.getElementById('info-editor-grid');
  const info=loadInfo();
  wrap.innerHTML='';
  INFO_FIELDS.forEach(([key,label,hint])=>{
    const block=document.createElement('div');
    block.className='ied-row';
    const lab=document.createElement('label');
    lab.className='eed-label';
    lab.textContent=label;
    block.appendChild(lab);
    const input=document.createElement('input');
    input.type='text';
    input.className='eed-input';
    input.dataset.field=key;
    input.value=info[key]||'';
    block.appendChild(input);
    const note=document.createElement('div');
    note.className='ied-hint';
    note.textContent=hint;
    block.appendChild(note);
    wrap.appendChild(block);
  });
}

function openInfoEditor(){
  buildInfoEditorForm();
  document.getElementById('info-editor').classList.add('open');
  document.body.classList.add('modal-open');
}

function closeInfoEditor(){
  document.getElementById('info-editor').classList.remove('open');
  document.body.classList.remove('modal-open');
}

function saveInfoEditor(){
  const info={};
  document.querySelectorAll('#info-editor-grid [data-field]').forEach(inp=>{
    info[inp.dataset.field]=inp.value.trim();
  });
  saveInfo(info);
  applyInfo();
  closeInfoEditor();
}

function resetInfoToDefault(){
  if(!confirm('Reset all building info to defaults? This cannot be undone.')) return;
  try{localStorage.removeItem('catalina-info-v1');}catch(e){}
  applyInfo();
  buildInfoEditorForm();
}

function initInfoEditor(){
  document.getElementById('edit-info-btn').addEventListener('click',e=>{
    e.stopPropagation();
    document.getElementById('settings-menu').classList.remove('open');
    document.getElementById('settings-btn').setAttribute('aria-expanded','false');
    openInfoEditor();
  });
  document.getElementById('ied-cancel').addEventListener('click',closeInfoEditor);
  document.getElementById('ied-close').addEventListener('click',closeInfoEditor);
  document.getElementById('ied-save').addEventListener('click',saveInfoEditor);
  document.getElementById('ied-reset').addEventListener('click',resetInfoToDefault);
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&document.getElementById('info-editor').classList.contains('open')){
      closeInfoEditor();
    }
  });
}
