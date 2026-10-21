import {normalize} from './paleta.js';

// La navegación pública reorganiza las fichas sin alterar sus identificadores
// ni la clasificación del registro interno que utiliza Ago Escritorio.
const solidPanels=new Set([
  'ecoplaca-wp-10-ranurado','ecoplaca-wp-11-ranurado','ecoplaca-wp-14-ranurado',
  'ecoplaca-pino-tipo-4-ranurado','ecoplaca-pino-tipo-5-ranurado',
  'ecoplaca-saman-solido-ranurado'
]);
const melamineReferences=new Set([
  'elsol-kampala','elsol-carora','elsol-chuao','elsol-coigue',
  'elsol-fresno','elsol-fresno-labrado','elsol-haya','elsol-tanganica'
]);
const otherCategories=['piedras','metales'];

// Tipos visuales de melaminas; la familia técnica del registro se conserva.
const melamineSolidReferences=new Set([
  'ldp-melaminas-velvet-tundra-grey','ldp-melaminas-hg-sand-beige',
  'ldp-melaminas-hg-bianco','ldp-melaminas-hg-light-cappuccino',
  'ldp-melaminas-velvet-dust-gray','ldp-melaminas-hg-black'
]);
const melaminePatternTypes=new Map([
  ['solidos','Colores sólidos'],['colores solidos','Colores sólidos'],
  ['maderas','Maderas'],['piedras y minerales','Piedras y minerales'],
  ['metales','Metales'],['metalizados','Metales'],['textiles','Textiles'],
  ['texturas y relieves','Texturas y relieves']
]);
export function melamineType(record){
  if(melamineReferences.has(record.id)||record.id==='ldp-melaminas-grisly-oak')return 'Maderas';
  if(melamineSolidReferences.has(record.id))return 'Colores sólidos';
  if(record.id==='ldp-melaminas-oro-metalizado')return 'Metales';
  const pattern=normalize(record.pattern);
  if(pattern==='piedras y textiles')return ['masisa-ve-19','masisa-ve-21'].includes(record.id)?'Textiles':'Piedras y minerales';
  return melaminePatternTypes.get(pattern)||'Otros diseños';
}


export function prepareCatalogue(data){
  const categories=data.categories.map(c=>({...c,
    ...(c.id==='tableros'?{name:'Chapas y compuestos',intro:'Chapas, MDF, aglomerados, contrachapados y láminas de PVC.'}:{}),
    ...(otherCategories.includes(c.id)?{parent:'otros'}:{})
  }));
  if(!categories.some(c=>c.id==='melaminas'))categories.splice(categories.findIndex(c=>c.id==='tableros'),0,{
    id:'melaminas',name:'Melaminas',intro:'Diseños melamínicos sobre MDF y MDP.',
    note:'Confirmamos soporte, espesor, formato y disponibilidad al elegir.'
  });
  if(!categories.some(c=>c.id==='revestimientos'))categories.splice(categories.findIndex(c=>c.id==='laminados')+1,0,{id:'revestimientos',name:'Paneles',intro:'Paneles de madera, wall panels, paneles lisos y PVC.'});
  if(!categories.some(c=>c.id==='otros'))categories.push({id:'otros',name:'Otros',intro:'Piedras y metales.'});
  const records=data.records.map(record=>{
    if(record.family==='Alistonados')return {...record,category:'maderas'};
    if(solidPanels.has(record.id))return {...record,category:'revestimientos',family:'Paneles de madera sólida'};
    if(['Wall panels','Flat wall panels','Láminas de PVC','Paneles autoadhesivos','Ranurados'].includes(record.family))return {...record,category:'revestimientos'};
    if(record.family==='Melaminas'||melamineReferences.has(record.id))return {...record,category:'melaminas',family:'Melaminas'};
    if(record.id==='elsol-fenolico-negro')return {...record,family:'Compuestos y chapillados'};
    return record;
  });
  return {...data,categories,records};
}

export function matchesCategory(record,category){
  return category==='otros'?otherCategories.includes(record.category):record.category===category;
}

export function resolveCategory(category,type='',record=null){
  if(record)return {category:record.category,type:''};
  if(category==='acabados')return {category:'otros',type:''};
  if(category==='revestimientos'&&['madera-solida','Paneles de madera sólida'].includes(type))return {category,type:'wall-panels'};
  if(category==='maderas'&&type==='Paneles ranurados de madera sólida')return {category:'revestimientos',type:'wall-panels'};
  if(category==='tableros'&&['Wall panels','Ranurados','Flat wall panels','Láminas de PVC','Paneles autoadhesivos'].includes(type))return {category:'revestimientos',type:['Wall panels','Ranurados'].includes(type)?'wall-panels':['Flat wall panels','Láminas de PVC'].includes(type)?'pvc-liso':type};
  if(category==='tableros'&&type==='Melaminas')return {category:'melaminas',type:''};
  if(category==='tableros'&&type==='Alistonados')return {category:'maderas',type};
  if(category==='tableros')return {category,type:''};
  return {category,type};
}

const definitions={
  maderas:[
    {value:'Madera sólida',label:'Maderas sólidas'},
    {value:'Alistonados',label:'Alistonados'},
    {value:'Machihembrados',label:'Machihembrados'}
  ],
  // Chapas y compuestos se presenta sin subdivisiones.
  tableros:[],
  melaminas:[
    {value:'Colores sólidos',label:'Color sólido'},
    {value:'Maderas',label:'Tipo madera'},
    {value:'Piedras y minerales',label:'Tipo piedra'},
    {value:'Metales',label:'Tipo metálico'},
    {value:'Textiles',label:'Tipo textil'},
    {value:'Texturas y relieves',label:'Texturas y relieves'},
    {value:'Otros diseños',label:'Otros diseños'}
  ],
  revestimientos:[
    {value:'wall-panels',label:'Wall panels y paneles ranurados'},
    {value:'pvc-liso',label:'Paneles lisos y láminas de PVC'},
    {value:'Paneles autoadhesivos',label:'Paneles autoadhesivos'}
  ],
  laminados:[
    {value:'Colores sólidos',label:'Color sólido'},
    {value:'Maderas',label:'Tipo madera'},
    {value:'Piedras y minerales',label:'Tipo piedra'},
    {value:'Metales',label:'Tipo metálico'},
    {value:'Textiles',label:'Tipo textil'},
    {value:'Texturas y relieves',label:'Texturas y relieves'}
  ],
  piedras:[
    {value:'Piedras sinterizadas',label:'Piedras sinterizadas'},
    {value:'Granitos',label:'Granitos'},
    {value:'Cuarzos',label:'Cuarzos'}
  ],
  metales:[
    {value:'Láminas lisas',label:'Láminas lisas'},
    {value:'Perforados',label:'Perforados y microperforados'},
    {value:'Mallas',label:'Mallas'},
    {value:'Rejillas',label:'Rejillas'},
    {value:'Estriados',label:'Láminas estriadas'},
    {value:'Estampados',label:'Paneles estampados'},
    {value:'Perfiles para revestimientos',label:'Perfiles para revestimientos'}
  ]
};

export function isGlossy(record){
  const finish=normalize(record.finish),name=normalize(record.name);
  if(/brillo y mate|gloss\s*\/\s*suede/.test(finish))return false;
  return (record.category==='piedras'&&/\bpulid[oa]\b/.test(finish+' '+name))||/alto brillo|high gloss|gloss|brillante|\blu\b|\bhg\b|\bshg\b/.test(finish+' '+name);
}
export function isSatin(record){
  if(record.category==='acabados'||isGlossy(record))return false;
  return /satinad[oa]|satin|\bsat\b/.test(normalize(record.finish));
}
export function matchesType(record,type){
  if(!type)return true;
  if(record.category==='melaminas')return melamineType(record)===type;
  if(type==='madera-solida')return record.family==='Paneles de madera sólida';
  if(type==='wall-panels')return ['Paneles de madera sólida','Wall panels','Ranurados'].includes(record.family);
  if(type==='pvc-liso')return ['Flat wall panels','Láminas de PVC'].includes(record.family);
  if(type==='soportes')return record.category==='tableros'&&!['Wall panels','Flat wall panels','Láminas de PVC','Paneles autoadhesivos','Perfiles para revestimientos'].includes(record.family);
  if(type==='tonos-calidos')return /bronce|cobre|dorado/.test(normalize(record.name));
  if(type==='tonos-plateados')return !/bronce|cobre|dorado|envejecido/.test(normalize(record.name));
  if(type==='envejecidos')return /envejecido/.test(normalize(record.name));
  if(type.startsWith('material:'))return record.id===type.slice(9);
  return record.family===type;
}
export function categoryTypes(category,records){
  return (definitions[category]||[]).filter(item=>records.some(r=>matchesCategory(r,category)&&matchesType(r,item.value)));
}
export function typeLabel(category,type,records){return categoryTypes(category,records).find(t=>t.value===type)?.label||'';}
// Santiago 15/10, reiterado 20/10: primero bloques completos por tipo.
// La marca solo ordena dentro de cada tipo: todos los sólidos antes de maderas,
// piedras, metales, textiles y relieves. Al editar estas reglas, renovar también
// la versión del import en catalogo.js y su plantilla catalogue-app.js.
// Las referencias de El Sol con marca conocida permanecen en esa marca.
const laminateBrandOrder=new Map(['greenlam','starline','ldp','virgo','century laminates','pertech'].map((brand,index)=>[brand,index]));
function catalogueBrandRank(category,record){
  const brand=normalize(record.brand);
  if(category==='laminados')return laminateBrandOrder.get(brand)??laminateBrandOrder.size;
  if(category==='melaminas'){
    const known=['maxpanel','masisa','agt'].indexOf(brand);
    if(known>=0)return known;
    const suppliers=[record.supplier,...(record.supplierNames||[])].map(normalize);
    if(record.id.startsWith('elsol-')||suppliers.some(s=>s.includes('aserradero el sol')||s.includes('placacentro el sol')))return 3;
    return brand==='ldp'?4:5;
  }
  return 0;
}
// Chapas y compuestos: orden visual solicitado el 20/10; sin submenús.
const boardTypeOrder=['MDF','Compuestos','Contrachapados','Chapas','Chapillas','Enchapillados','Chapillas precompuestas'];
export function boardType(record){
 const name=normalize(record.name),family=normalize(record.family);
 if(/\bmdf\b/.test(name+' '+family))return 'MDF';
 if(name.startsWith('chapilla precompuesta')||family==='chapillas precompuestas')return 'Chapillas precompuestas';
 if(name.startsWith('enchapillado')||family==='enchapillados')return 'Enchapillados';
 if(name.startsWith('chapilla')||family==='chapillas')return 'Chapillas';
 if(name.startsWith('chapa ')||family==='chapas')return 'Chapas';
 if(name.startsWith('contrachapado')||family==='contrachapados')return 'Contrachapados';
 return 'Compuestos';
}
export function orderByType(category,records){
  if(category==='tableros')return records.slice().sort((a,b)=>boardTypeOrder.indexOf(boardType(a))-boardTypeOrder.indexOf(boardType(b)));
  if(category==='otros')return otherCategories.flatMap(id=>orderByType(id,records.filter(r=>r.category===id)));
  if(category==='revestimientos'){const order=['Paneles de madera sólida','Wall panels','Ranurados','Flat wall panels','Láminas de PVC','Paneles autoadhesivos'];return records.slice().sort((a,b)=>order.indexOf(a.family)-order.indexOf(b.family));}
  const group=record=>category==='melaminas'?melamineType(record):record.family;
  const families=[...new Set([...(definitions[category]||[]).map(t=>t.value),...records.map(group)])];
  const rank=new Map(families.map((family,index)=>[family,index]));
  return records.slice().sort((a,b)=>(['laminados','melaminas'].includes(category)?rank.get(group(a))-rank.get(group(b)):0)||catalogueBrandRank(category,a)-catalogueBrandRank(category,b)||rank.get(group(a))-rank.get(group(b)));
}

const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function typeButtons(category,types){
  return `<button type="button" role="menuitemradio" aria-checked="false" data-type="" data-type-category="${category.id}">Ver todos</button>${types.map(type=>`${type.heading?`<p class="dropdown-heading" role="presentation">${escape(type.heading)}</p>`:''}<button type="button" role="menuitemradio" aria-checked="false" data-type="${escape(type.value)}" data-type-category="${category.id}">${escape(type.label)}</button>`).join('')}`;
}
export function navigationHTML(categories,records){
  return categories.filter(c=>!c.parent).map(category=>{
    const types=categoryTypes(category.id,records),children=categories.filter(c=>c.parent===category.id),hasMenu=types.length>0||children.length>0;
    const contents=children.length?children.map(child=>{
      const subtypes=categoryTypes(child.id,records),hasSubmenu=subtypes.length>0;
      return `<button type="button" role="menuitem" class="category-child" data-category="${child.id}" data-parent-category="${category.id}"${hasSubmenu?` aria-haspopup="true" aria-expanded="false" aria-controls="types-${child.id}"`:''}>${escape(child.name)}${hasSubmenu?'<span class="category-chevron" aria-hidden="true">⌄</span>':''}</button>${hasSubmenu?`<div id="types-${child.id}" class="category-submenu" role="menu" aria-label="Tipos de ${escape(child.name)}" hidden>${typeButtons(child,subtypes)}</div>`:''}`;
    }).join(''):typeButtons(category,types);
    const menu=hasMenu?`<div id="types-${category.id}" class="category-dropdown" role="menu" aria-label="Tipos de ${escape(category.name)}" hidden>${contents}</div>`:'';
    return `<div class="category-item"><button type="button" data-category="${category.id}"${hasMenu?` aria-haspopup="true" aria-expanded="false" aria-controls="types-${category.id}"`:''}>${escape(category.name)}${hasMenu?'<span class="category-chevron" aria-hidden="true">⌄</span>':''}</button>${menu}</div>`;
  }).join('');
}

export function setupNavigation(nav){
  let current=null;
  const visibleButtons=menu=>[...menu.querySelectorAll('button')].filter(b=>!b.closest('[hidden]'));
  function close(focus=false){
    const trigger=current;
    nav.querySelectorAll('.category-dropdown,.category-submenu').forEach(menu=>menu.hidden=true);
    nav.querySelectorAll('[aria-expanded]').forEach(button=>button.setAttribute('aria-expanded','false'));
    current=null;
    if(focus&&trigger?.isConnected)trigger.focus();
  }
  function open(id,focus=false,last=false){
    const child=nav.querySelector(`[data-category="${id}"][data-parent-category]`);
    const rootID=child?.dataset.parentCategory||id;
    const trigger=nav.querySelector(`.category-item>button[data-category="${rootID}"]`);
    const menu=document.getElementById('types-'+rootID);
    if(!trigger||!menu){close();return;}
    if(current!==trigger){close();current=trigger;}
    const viewportWidth=document.documentElement.clientWidth||innerWidth,rect=trigger.getBoundingClientRect(),width=Math.min(300,viewportWidth-16);
    menu.style.width=width+'px';
    menu.style.left=Math.max(8,Math.min(rect.left,viewportWidth-width-8))+'px';
    menu.style.top=rect.bottom+'px';
    menu.style.maxHeight=Math.max(100,innerHeight-rect.bottom-18)+'px';
    menu.hidden=false;trigger.setAttribute('aria-expanded','true');
    if(child){
      nav.querySelectorAll('.category-submenu').forEach(submenu=>submenu.hidden=true);
      nav.querySelectorAll('[data-parent-category][aria-expanded]').forEach(button=>button.setAttribute('aria-expanded','false'));
      const submenu=document.getElementById('types-'+id);
      if(submenu){submenu.hidden=false;child.setAttribute('aria-expanded','true');}
      else {close(true);return;}
    }
    if(focus){const buttons=visibleButtons(child?document.getElementById('types-'+id):menu);buttons[last?buttons.length-1:0]?.focus();}
  }
  nav.addEventListener('pointerover',event=>{
    if(!matchMedia('(hover:hover)').matches)return;
    const trigger=event.target.closest('.category-item>button[data-category]');
    if(trigger&&trigger!==current)open(trigger.dataset.category);
  });
  nav.addEventListener('pointerout',event=>{if(event.pointerType==='mouse'&&matchMedia('(hover:hover)').matches&&!nav.contains(event.relatedTarget))close();});
  nav.addEventListener('focusout',event=>{if(!nav.contains(event.relatedTarget))close();});
  nav.addEventListener('keydown',event=>{
    const trigger=event.target.closest('[data-category]');
    if(trigger&&(['ArrowDown','ArrowUp'].includes(event.key)&&!trigger.dataset.parentCategory||event.key==='ArrowRight')&&trigger.hasAttribute('aria-haspopup')){
      event.preventDefault();open(trigger.dataset.category,true,event.key==='ArrowUp');return;
    }
    const submenu=event.target.closest('.category-submenu');
    if(submenu&&event.key==='ArrowLeft'){
      event.preventDefault();submenu.hidden=true;
      const parent=nav.querySelector(`[aria-controls="${submenu.id}"]`);parent.setAttribute('aria-expanded','false');parent.focus();return;
    }
    const menu=event.target.closest('.category-dropdown');
    if(menu&&['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
      event.preventDefault();const buttons=visibleButtons(menu),index=buttons.indexOf(document.activeElement);
      const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length;
      buttons[next]?.focus();
    }
    if(event.key==='Escape'&&current){event.preventDefault();event.stopPropagation();close(true);}
  });
  document.addEventListener('pointerdown',event=>{if(!nav.contains(event.target))close();});
  window.addEventListener('resize',()=>close());
  window.addEventListener('scroll',()=>close(),{passive:true});
  return {open,close};
}
