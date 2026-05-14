const FLOOR_TYPES=[
  ['single','Single Floor'],
  ['range','Range of Floors'],
  ['named','Named Area'],
  ['custom','Custom']
];

const NAMED_AREAS=['Ground','Lower Level','Level P','Mezzanine','Penthouse','Pavilion','Rooftop'];

const DEFAULT_DIRECTORY=[
  {
    num:'310', street:'Golden Shore',
    entries:[
      {name:'TI Capital', floorType:'named', floorArea:'Penthouse'},
      {name:'NRE Commercial', floorType:'single', floorNum:4},
      {name:'Available Suites', floorType:'range', floorFrom:1, floorTo:3}
    ]
  },
  {
    num:'320', street:'Golden Shore',
    entries:[
      {name:'Catalina Express HQ', floorType:'single', floorNum:2},
      {name:'Available Suites', floorType:'custom', floorCustom:'Floors 1, 3 – 5'}
    ]
  },
  {
    num:'330', street:'Golden Shore',
    entries:[
      {name:'Lobby & Conference Center', floorType:'named', floorArea:'Ground'},
      {name:'SeaLevel Creative Space', floorType:'named', floorArea:'Lower Level'},
      {name:'Available Suites', floorType:'range', floorFrom:2, floorTo:5}
    ]
  },
  {
    num:'340', street:'Golden Shore',
    entries:[
      {name:'Waterfront Restaurant', floorType:'named', floorArea:'Ground'},
      {name:'Marina Deck Access', floorType:'named', floorArea:'Level P'},
      {name:'Available Suites', floorType:'range', floorFrom:2, floorTo:5}
    ]
  }
];

function loadDirectory(){
  try{
    const raw=localStorage.getItem('catalina-directory-v1');
    if(raw){
      const parsed=JSON.parse(raw);
      if(Array.isArray(parsed)&&parsed.length===4) return parsed.map(normalizeBuilding);
    }
  }catch(e){}
  return DEFAULT_DIRECTORY.map(b=>({...b, entries:b.entries.map(e=>({...e}))}));
}

function saveDirectory(directory){
  try{localStorage.setItem('catalina-directory-v1',JSON.stringify(directory));}catch(e){}
}

function normalizeBuilding(b){
  return {
    num: (b.num||'').toString(),
    street: (b.street||'').toString(),
    entries: Array.isArray(b.entries) ? b.entries.map(normalizeEntry) : []
  };
}

function normalizeEntry(e){
  const out={
    name: (e.name||'').toString(),
    floorType: e.floorType||'single'
  };
  switch(out.floorType){
    case 'single': out.floorNum=parseInt(e.floorNum,10)||1; break;
    case 'range':  out.floorFrom=parseInt(e.floorFrom,10)||1; out.floorTo=parseInt(e.floorTo,10)||1; break;
    case 'named':  out.floorArea=(e.floorArea||'Ground').toString(); break;
    case 'custom': out.floorCustom=(e.floorCustom||'').toString(); break;
  }
  return out;
}

function formatFloor(entry){
  switch(entry.floorType){
    case 'single': return `Floor ${entry.floorNum}`;
    case 'range':  return `Floors ${entry.floorFrom} – ${entry.floorTo}`;
    case 'named':  return entry.floorArea||'';
    case 'custom': return entry.floorCustom||'';
    default: return '';
  }
}

function renderDirectory(){
  const grid=document.getElementById('dir-grid');
  if(!grid) return;
  const directory=loadDirectory();
  grid.innerHTML='';
  directory.forEach(building=>{
    const card=document.createElement('div');
    card.className='db';

    const wm=document.createElement('div');
    wm.className='db-watermark';
    wm.textContent=building.num;
    card.appendChild(wm);

    const head=document.createElement('div');
    head.className='db-head';
    const num=document.createElement('div');
    num.className='db-num';
    num.textContent=building.num;
    const street=document.createElement('div');
    street.className='db-street';
    street.textContent=building.street;
    head.append(num,street);
    card.appendChild(head);

    building.entries.forEach(entry=>{
      if(!entry.name) return;
      const dt=document.createElement('div');
      dt.className='dt';
      const dtn=document.createElement('span');
      dtn.className='dt-n';
      dtn.textContent=entry.name;
      const dtf=document.createElement('span');
      dtf.className='dt-f';
      dtf.textContent=formatFloor(entry);
      dt.append(dtn,dtf);
      card.appendChild(dt);
    });

    grid.appendChild(card);
  });
}

function buildFloorVariants(entry){
  const wrap=document.createElement('div');
  wrap.className='dir-floor-variants';

  const single=document.createElement('div');
  single.className='dir-floor-variant dir-floor-single';
  appendLabel(single,'Floor #');
  single.appendChild(createSelect('floorNum',range(1,10).map(n=>[String(n),String(n)]),String(entry.floorNum||1)));
  wrap.appendChild(single);

  const rng=document.createElement('div');
  rng.className='dir-floor-variant dir-floor-range';
  const rngRow=document.createElement('div');
  rngRow.className='dir-range-row';
  const fromCol=document.createElement('div');
  appendLabel(fromCol,'From');
  fromCol.appendChild(createSelect('floorFrom',range(1,10).map(n=>[String(n),String(n)]),String(entry.floorFrom||1)));
  const toCol=document.createElement('div');
  appendLabel(toCol,'To');
  toCol.appendChild(createSelect('floorTo',range(1,10).map(n=>[String(n),String(n)]),String(entry.floorTo||5)));
  rngRow.append(fromCol,toCol);
  rng.appendChild(rngRow);
  wrap.appendChild(rng);

  const named=document.createElement('div');
  named.className='dir-floor-variant dir-floor-named';
  appendLabel(named,'Named Area');
  named.appendChild(createSelect('floorArea',NAMED_AREAS.map(a=>[a,a]),entry.floorArea||'Ground'));
  wrap.appendChild(named);

  const custom=document.createElement('div');
  custom.className='dir-floor-variant dir-floor-custom';
  appendLabel(custom,'Custom Text');
  const customInput=document.createElement('input');
  customInput.type='text';
  customInput.className='eed-input';
  customInput.dataset.field='floorCustom';
  customInput.value=entry.floorCustom||'';
  customInput.placeholder='e.g. Floors 1, 3 – 5';
  custom.appendChild(customInput);
  wrap.appendChild(custom);

  return wrap;
}

function buildDirEntryRow(entry){
  const row=document.createElement('div');
  row.className='dir-entry';
  row.dataset.floorType=entry.floorType||'single';

  appendLabel(row,'Name');
  const nameInput=document.createElement('input');
  nameInput.type='text';
  nameInput.className='eed-input';
  nameInput.dataset.field='name';
  nameInput.value=entry.name||'';
  nameInput.placeholder='Tenant or space name';
  row.appendChild(nameInput);

  appendLabel(row,'Location Type');
  const ftSelect=createSelect('floorType',FLOOR_TYPES,entry.floorType||'single');
  ftSelect.addEventListener('change',e=>{row.dataset.floorType=e.target.value;});
  row.appendChild(ftSelect);

  row.appendChild(buildFloorVariants(entry));

  const removeBtn=document.createElement('button');
  removeBtn.type='button';
  removeBtn.className='dir-remove-entry';
  removeBtn.textContent='Remove entry';
  removeBtn.addEventListener('click',()=>{
    const v=row.querySelector('input[data-field="name"]').value.trim();
    if(v&&!confirm(`Remove "${v}"?`)) return;
    row.remove();
  });
  row.appendChild(removeBtn);

  return row;
}

function buildBuildingBlock(building,idx){
  const block=document.createElement('div');
  block.className='eed-block dir-block';
  block.dataset.index=idx;

  const title=document.createElement('div');
  title.className='eed-title';
  title.textContent=`Building ${idx+1}`;
  block.appendChild(title);

  appendLabel(block,'Number');
  const numInput=document.createElement('input');
  numInput.type='text';
  numInput.className='eed-input';
  numInput.dataset.field='num';
  numInput.value=building.num||'';
  numInput.placeholder='e.g. 310';
  block.appendChild(numInput);

  appendLabel(block,'Street');
  const streetInput=document.createElement('input');
  streetInput.type='text';
  streetInput.className='eed-input';
  streetInput.dataset.field='street';
  streetInput.value=building.street||'';
  streetInput.placeholder='e.g. Golden Shore';
  block.appendChild(streetInput);

  appendLabel(block,'Tenants / Spaces');
  const entriesWrap=document.createElement('div');
  entriesWrap.className='dir-entries';
  block.appendChild(entriesWrap);

  building.entries.forEach(entry=>{
    entriesWrap.appendChild(buildDirEntryRow(entry));
  });

  const addBtn=document.createElement('button');
  addBtn.type='button';
  addBtn.className='dir-add-entry';
  addBtn.textContent='+ Add Entry';
  addBtn.addEventListener('click',()=>{
    entriesWrap.appendChild(buildDirEntryRow({name:'',floorType:'single',floorNum:1}));
    const newRow=entriesWrap.lastElementChild;
    const nameField=newRow.querySelector('input[data-field="name"]');
    if(nameField) nameField.focus();
  });
  block.appendChild(addBtn);

  return block;
}

function buildDirectoryEditorForm(){
  const wrap=document.getElementById('dir-editor-grid');
  const directory=loadDirectory();
  wrap.innerHTML='';
  directory.forEach((b,i)=>{
    wrap.appendChild(buildBuildingBlock(b,i));
  });
}

function openDirectoryEditor(){
  buildDirectoryEditorForm();
  document.getElementById('dir-editor').classList.add('open');
  document.body.classList.add('modal-open');
}

function closeDirectoryEditor(){
  document.getElementById('dir-editor').classList.remove('open');
  document.body.classList.remove('modal-open');
}

function saveDirectoryEditor(){
  const dir=[];
  document.querySelectorAll('#dir-editor-grid .dir-block').forEach(block=>{
    const numEl=block.querySelector('input[data-field="num"]');
    const streetEl=block.querySelector('input[data-field="street"]');
    const building={
      num: numEl ? numEl.value.trim() : '',
      street: streetEl ? streetEl.value.trim() : '',
      entries: []
    };
    block.querySelectorAll('.dir-entry').forEach(row=>{
      const entry={floorType: row.dataset.floorType||'single'};
      row.querySelectorAll('[data-field]').forEach(inp=>{
        const f=inp.dataset.field;
        if(f==='floorType') return;
        let val=inp.value;
        if(typeof val==='string') val=val.trim();
        entry[f]=val;
      });
      building.entries.push(normalizeEntry(entry));
    });
    dir.push(building);
  });
  saveDirectory(dir);
  renderDirectory();
  closeDirectoryEditor();
}

function resetDirectoryToDefault(){
  if(!confirm('Reset the directory to the original defaults? This cannot be undone.')) return;
  try{localStorage.removeItem('catalina-directory-v1');}catch(e){}
  renderDirectory();
  buildDirectoryEditorForm();
}

function initDirectoryEditor(){
  document.getElementById('edit-directory-btn').addEventListener('click',e=>{
    e.stopPropagation();
    document.getElementById('settings-menu').classList.remove('open');
    document.getElementById('settings-btn').setAttribute('aria-expanded','false');
    openDirectoryEditor();
  });
  document.getElementById('ded-cancel').addEventListener('click',closeDirectoryEditor);
  document.getElementById('ded-close').addEventListener('click',closeDirectoryEditor);
  document.getElementById('ded-save').addEventListener('click',saveDirectoryEditor);
  document.getElementById('ded-reset').addEventListener('click',resetDirectoryToDefault);
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&document.getElementById('dir-editor').classList.contains('open')){
      closeDirectoryEditor();
    }
  });
}
