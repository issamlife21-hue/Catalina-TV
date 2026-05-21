const DEFAULT_INFO={
  logoName:'The Waterfront',
  logoSub:'at Catalina Landing',
  dirFoot:'Leasing Inquiries · (424) 477-3816',
  evtFoot:'Post an Event · lobby@ticapital.com',
  photoTitle:'The Waterfront at Catalina Landing',
  photoSub:'Long Beach, California'
};

const INFO_FIELDS=[
  ['logoName','Logo · Main Title','Building name shown top-left'],
  ['logoSub','Logo · Subtitle','Address line under the logo'],
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
      if(parsed&&typeof parsed==='object'){
        if(parsed.evtFoot&&parsed.evtFoot.includes('TI Capital Management')){
          parsed.evtFoot=parsed.evtFoot.replace(/\s*·\s*TI Capital Management/g,'').trim();
        }
        if(parsed.dirFoot&&parsed.dirFoot.includes('NRE Commercial')){
          parsed.dirFoot=parsed.dirFoot.replace(/\s*·\s*NRE Commercial/g,'').trim();
        }
        if(parsed.logoSub&&/Golden\s+Shore|Long\s+Beach/i.test(parsed.logoSub)){
          parsed.logoSub='at Catalina Landing';
        }
        if(parsed.logoName==='Catalina Landing'){
          parsed.logoName='The Waterfront';
        }
        delete parsed.demoTag;
        return {...DEFAULT_INFO,...parsed};
      }
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
  setDirFoot(info.dirFoot);
  set('evt-foot',info.evtFoot);
  set('photo-title',info.photoTitle);
  set('photo-sub',info.photoSub);
}

function setDirFoot(val){
  const el=document.getElementById('dir-foot');
  if(!el) return;
  const s=(val||'').toString();
  const phoneRe=/(\(\d{3}\)\s?\d{3}[-\s]?\d{4}|\d{3}[-.\s]\d{3}[-.\s]\d{4})/;
  const m=phoneRe.exec(s);
  el.textContent='';
  if(!m){ el.textContent=s; return; }
  el.appendChild(document.createTextNode(s.slice(0,m.index)));
  const span=document.createElement('span');
  span.id='dir-foot-phone';
  span.textContent=m[0];
  el.appendChild(span);
  el.appendChild(document.createTextNode(s.slice(m.index+m[0].length)));
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
