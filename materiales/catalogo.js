import {movePaletteItem,setupPaletteOrdering} from './ordenar.js?v=20261020-catalogo-conjunto-v1';
import {STORAGE_KEY,normalize,cleanIDs,label,selectionURL,browseURL,selectionText,restorePalette,savePalette} from './paleta.js?v=20261020-catalogo-conjunto-v1';
import {setupMaterialViewer} from './visor.js?v=20261020-catalogo-conjunto-v1';
import {exportImage} from './exportar.js?v=20261020-catalogo-conjunto-v1';
import {sampleGeometry,observeSampleCovers} from './muestras.js?v=20261020-catalogo-conjunto-v1';
import {categoryTypes,matchesType,typeLabel,isGlossy,isSatin,navigationHTML,setupNavigation,orderByType,prepareCatalogue,matchesCategory,resolveCategory} from './categorias.js?v=20261020-catalogo-conjunto-v1';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const params=new URLSearchParams(location.search);
let data,category='maderas',family='',selection=[],project='',view='row',pair=[],messageTimer,lastFocus=new Map(),sharedOpening=false,paletteRequested=params.get('paleta')==='1';
const records=()=>selection.map(id=>data.records.find(e=>e.id===id)).filter(Boolean);
const publicURL=()=>{const u=new URL(selectionURL(location.href,category,selection,project));if(family)u.searchParams.set('tipo',family);else u.searchParams.delete('tipo');return u.href;};
const updateURL=()=>history.replaceState(null,'',browseURL(location.href,category,family));
const reference=e=>[e.brand,e.code,e.finish].filter(Boolean).join(' · ');
function image(e,lazy=true,overview=false){
 if(!e.image)return `<div class="card-guide"><span>ACABADOS AGO</span><strong>${esc(e.name)}</strong><small>Guía de acabado · sin fotografía</small></div>`;
 const sample=overview&&e.overview?e.overview:e.image;
 const crop=(overview||sample.surfaceCrop||sample.displayRotation===90)&&sample.crop,product=sample.display==='product',geometry=sampleGeometry({...sample,crop:crop||undefined});
 const cover=overview&&(crop||geometry.rotation),coverSample={...sample,crop:crop||undefined};
 const visual=cover?`<img data-cover-sample="${esc(JSON.stringify(coverSample))}" src="${esc(sample.src)}" alt="${esc(e.name)}" decoding="async" ${lazy?'loading="lazy"':''}>`:crop||geometry.rotation?`<svg viewBox="0 0 ${geometry.width} ${geometry.height}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${esc(e.name)}"><g transform="${geometry.transform}"><image href="${esc(sample.src)}" width="${sample.width}" height="${sample.height}"/></g></svg>`:`<img src="${esc(sample.src)}" alt="${esc(e.name)}" width="${sample.width}" height="${sample.height}" decoding="async" ${sample.srcset?`srcset="${esc(sample.srcset)}" sizes="(max-width:550px) 50vw, (max-width:800px) 33.333vw, (max-width:1100px) 25vw, (min-width:1600px) 16.667vw, 20vw"`:""} ${lazy?'loading="lazy"':''}>`;
 return `<span ${sample.displayFilter?`style="filter:${esc(sample.displayFilter)}"`:""} class="material-surface${cover?' is-cover-sample':''}${isGlossy(e)?' is-glossy':isSatin(e)?' is-satin':''}${product?' is-product':''}">${visual}</span>`;
}
const pickIcon=chosen=>`<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${chosen?'M4 12l5 5L20 5':'M12 3v18M3 12h18'}"/></svg>`;
function picker(e,tile=false){const chosen=selection.includes(e.id);return `<button type="button" class="${tile?'tile-pick':'primary'}" data-pick="${esc(e.id)}" aria-pressed="${chosen}" aria-label="${chosen?'Quitar de':'Añadir a'} la paleta: ${esc(label(e))}"${tile?' title="'+(chosen?'Quitar de':'Añadir a')+' mi paleta"':''}>${tile?pickIcon(chosen):(chosen?'En tu paleta ✓':'Añadir a mi paleta +')}</button>`;}
const categoryNavigation=setupNavigation($('#categories'));
function renderCategories(){if(!$('#categories').children.length)$('#categories').innerHTML=navigationHTML(data.categories,data.records);$('#categories').querySelectorAll('[data-category]').forEach(b=>b.setAttribute('aria-current',String(b.dataset.category===category||(b.dataset.category==='otros'&&data.categories.find(c=>c.id===category)?.parent==='otros'))));$('#categories').querySelectorAll('[data-type]').forEach(b=>b.setAttribute('aria-checked',String(b.dataset.typeCategory===category&&b.dataset.type===family)));}
function fillFilters(){const all=data.records.filter(e=>matchesCategory(e,category));for(const key of ['brand','supplier']){const values=[...new Set(all.flatMap(e=>key==='supplier'?(e.supplierNames?.length?e.supplierNames:[e.supplier]):[e[key]]).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));$('#'+key).innerHTML=`<option value="">${key==='brand'?'Todas':'Todos'}</option>`+values.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');$('#'+key).disabled=!values.length;}}
function renderFamilies(){
  const label=typeLabel(category,family,data.records);
  $('#active-type').hidden=!label;$('#active-type').textContent=label+' ×';
  $('#active-type').setAttribute('aria-label','Quitar filtro '+label);
}
function visualOrder(list){
  return orderByType(category,list);
}
function filtered(){const q=normalize($('#search').value.trim());return visualOrder(data.records.filter(e=>matchesCategory(e,category)&&matchesType(e,family)&&(!$('#brand').value||e.brand===$('#brand').value)&&(!$('#supplier').value||e.supplier===$('#supplier').value||e.supplierNames?.includes($('#supplier').value))&&(!$('#market').value||($('#market').value==='internacional'?e.international:!e.international))&&(!q||normalize([e.name,e.code,e.brand,e.supplier,e.family,e.finish,e.description,e.botanicalName,e.translations?.en?.name,...(e.aliases||[])].join(' ')).includes(q))));}
function updateFilterIcon(){const control=$('.extra-filters'),active=!!($('#brand').value||$('#supplier').value||$('#market').value);control.dataset.activo=active?'1':'0';if(window.PA_ICONO_FILTRO){const svg=control.querySelector('summary svg');svg.outerHTML=window.PA_ICONO_FILTRO(active);}}
function render(){updateFilterIcon();const list=filtered();$('#section-title').textContent=data.categories.find(c=>c.id===category).name;$('#result-count').textContent=list.length+' '+(list.length===1?'muestra':'muestras');$('#empty').hidden=!!list.length;$('#grid').innerHTML=list.map(e=>`<article class="card"><button type="button" class="card-open" data-detail="${esc(e.id)}" aria-label="Ver ${esc(label(e))}"><span class="card-image">${image(e,true,true)}</span><span class="card-label"><strong>${esc(e.name)}</strong><small>${esc(reference(e))}</small></span></button>${picker(e,true)}</article>`).join('');updateBadge();}
function context(){return {surface:'materiales',category,palette:selection.slice(0,60),project:project.slice(0,80),total:selection.length};}
function broadcast(){window.dispatchEvent(new CustomEvent('ago-catalogue-context',{detail:context()}));}
window.AGO_CATALOGUE_CONTEXT=()=>data?context():{surface:'materiales',category:'maderas',palette:[],project:''};
function persist(syncURL=true){let saved=false;try{saved=savePalette(localStorage,selection,project);}catch{}if(!saved)$('#palette-status').textContent='Este navegador no permite guardar tu paleta. Puedes descargar su imagen para conservarla.';if(syncURL)updateURL();broadcast();}
function updateBadge(){
  $('#palette-count').hidden=false;
  $('#palette-count').textContent=selection.length;$('#palette-peek').innerHTML=records().slice(-3).map(e=>e.image?image(e,false,true):'').join('');$('#open-palette').setAttribute('aria-label','Abrir paleta de materiales, '+selection.length+' guardados');
  document.querySelectorAll('[data-pick]').forEach(b=>{const e=data.records.find(e=>e.id===b.dataset.pick);if(!e)return;const chosen=selection.includes(e.id);b.setAttribute('aria-pressed',String(chosen));b.setAttribute('aria-label',(chosen?'Quitar de':'Añadir a')+' la paleta: '+label(e));if(b.classList.contains('tile-pick'))b.innerHTML=pickIcon(chosen);else b.textContent=chosen?'En tu paleta ✓':'Añadir a mi paleta +';});
  observeSampleCovers();
}
function announce(text){clearTimeout(messageTimer);$('#message').textContent=text;messageTimer=setTimeout(()=>{$('#message').textContent='';},3500);}
function pick(id,onlyAdd=false){const e=data.records.find(e=>e.id===id);if(!e)return;if(selection.includes(id)){if(onlyAdd){announce(e.name+' ya está en tu paleta.');return;}selection=selection.filter(x=>x!==id);announce(e.name+' retirado de tu paleta.');}else{selection.push(id);announce(e.name+' añadido a tu paleta.');}updateBadge();persist();if($('#palette').open)renderPalette();}
function openDialog(d){if(d.open)return;lastFocus.set(d,document.activeElement);d.showModal();if(d.id==='palette')$('#open-palette').setAttribute('aria-expanded','true');}
function openPalette(){document.querySelectorAll('dialog[open]').forEach(d=>d.close());renderPalette();openDialog($('#palette'));}
const expandImage=setupMaterialViewer(openDialog);
function details(id){const e=data.records.find(x=>x.id===id);if(!e)return;$('#detail-content').innerHTML=`<div class="detail-layout"><div class="detail-visual">${e.image?`<button class="detail-expand" type="button" data-expand-image="${esc(e.id)}" aria-label="Ampliar imagen de ${esc(e.name)}">${image(e,false)}</button>`:image(e,false)}<p class="credit">${esc(e.imageNote)}${e.overview?' Vista del mosaico: '+esc(e.overviewNote||'Continuidad recreada con IA a partir de esta muestra original.'):''}</p>${e.workURL?`<a class="text-link" href="${esc(e.workURL)}">Ver el trabajo de AGO ↗</a>`:''}</div><div class="detail-copy"><p class="eyebrow">${esc(data.categories.find(c=>c.id===e.category).name)}</p><h2 id="detail-title">${esc(e.name)}</h2>${e.botanicalName?`<p><em>${esc(e.botanicalName)}</em></p>`:""}<p>${esc(reference(e)||e.family)}</p><p>${esc(e.description)}</p><div class="detail-actions">${picker(e)}<button type="button" data-show-palette>Ver mi paleta</button></div><h3>PARA QUÉ CONSIDERARLO</h3><p>${esc(e.use)}</p><h3>QUÉ CONVIENE REVISAR</h3><p>${esc(e.care)}</p><div class="links">${e.sourceLinks.map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)} ↗</a>`).join('')}</div><button type="button" class="text-link" data-share-card="${esc(e.id)}">Copiar enlace de esta muestra ↗</button><p id="detail-status" role="status"></p></div></div>`;openDialog($('#detail'));}
function paletteTile(e,remove=true){return `<article class="palette-tile" role="listitem" aria-posinset="${selection.indexOf(e.id)+1}" aria-setsize="${selection.length}" data-palette-id="${esc(e.id)}"><button class="sample-button" aria-describedby="palette-order-help" type="button" data-detail="${esc(e.id)}" aria-label="Ver ${esc(label(e))}">${image(e,false,true)}<span class="sample-name"><strong>${esc(e.name)}</strong><small>${esc(reference(e)||e.family)}</small></span></button>${remove?`<button type="button" class="remove" data-remove="${esc(e.id)}" aria-label="Quitar de la paleta ${esc(label(e))}">×</button>`:''}</article>`;}
const paletteOrdering=setupPaletteOrdering({root:$('#palette-content'),dialog:$('#palette'),getIDs:()=>selection,getView:()=>view,onMove:movePaletteTo});
function movePaletteTo(id,index,live=false){
  const next=movePaletteItem(selection,id,index);if(next===selection)return false;
  selection=next;if(live)updateBadge();else renderPalette();persist();
  if(!$('#palette-status').textContent)$('#palette-status').textContent=(data.records.find(e=>e.id===id)?.name||'Muestra')+' movida a la posición '+(index+1)+'.';
  return true;
}
function renderPalette(){
  paletteOrdering.cancel();
  const all=records(),n=all.length;$('#palette-empty').hidden=!!n;$('#palette-workspace').hidden=!n;$('#palette-order-help').hidden=n<2||view==='pair';
  if(view==='pair'&&n<2)view='row';
  $('#palette [data-view="pair"]').disabled=n<2;document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));
  $('#pair-tools').hidden=view!=='pair';$('#palette-content').className='palette-grid '+view;$('#palette-content').dataset.reorderable=String(n>1&&view!=='pair');if(view==='pair')$('#palette-content').removeAttribute('role');else $('#palette-content').setAttribute('role','list');
  pair=pair.filter(id=>selection.includes(id));for(const id of selection){if(pair.length>=2)break;if(!pair.includes(id))pair.push(id);}
  for(const [i,key] of ['pair-a','pair-b'].entries()){$('#'+key).innerHTML=all.map(e=>`<option value="${esc(e.id)}">${esc(label(e))}</option>`).join('');$('#'+key).value=pair[i]||'';}
  if(view==='pair')renderPair();else $('#palette-content').innerHTML=all.map(e=>paletteTile(e)).join('');
  $('#palette-status').textContent='';updateBadge();
}
function renderPair(){
  const a=data.records.find(e=>e.id===pair[0]),b=data.records.find(e=>e.id===pair[1]);if(!a||!b)return;
  const canOverlay=!!a.image&&!!b.image;$('#overlay-mode').disabled=!canOverlay;if(!canOverlay)$('#overlay-mode').checked=false;
  if($('#overlay-mode').checked){$('#palette-content').innerHTML=`<div class="overlay-comparison"><div class="overlay-stage"><div class="overlay-media">${image(b,false,true)}</div><div class="overlay-media overlay-top">${image(a,false,true)}</div><span class="overlay-line" aria-hidden="true"></span></div><input class="overlay-range" id="overlay-range" type="range" min="0" max="100" value="50" aria-label="Proporción visible de las dos muestras"><div class="overlay-labels"><span>← ${esc(label(a))}</span><span>${esc(label(b))} →</span></div></div>`;$('#overlay-range').oninput=e=>{const value=e.target.value;$('.overlay-top').style.clipPath=`inset(0 ${100-value}% 0 0)`;$('.overlay-line').style.left=value+'%';};}
  else $('#palette-content').innerHTML=paletteTile(a,false)+paletteTile(b,false);
  observeSampleCovers();
}
async function copy(text,status,title='Copiar selección'){try{await navigator.clipboard.writeText(text);status.textContent='Copiado. Puedes pegarlo para compartir.';}catch{$('#copy-title').textContent=title;$('#copy-text').value=text;openDialog($('#copy-fallback'));$('#copy-text').select();}}
function selectCategory(id,type=''){if(!data.categories.some(c=>c.id===id))return;category=id;family=type;$('#filters').reset();$('#search').value='';fillFilters();renderCategories();renderFamilies();render();updateURL();broadcast();}
function resetFilters(){$('#filters').reset();$('#search').value='';family='';renderCategories();renderFamilies();render();updateURL();broadcast();}
function openAI(addPalette=false){document.querySelectorAll('dialog[open]').forEach(d=>d.close());broadcast();window.dispatchEvent(new CustomEvent('chatbot-open',{detail:{addPalette}}));}
document.addEventListener('click',ev=>{
  const b=ev.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-pick')){pick(b.dataset.pick);return;}
  if(b.hasAttribute('data-remove')){pick(b.dataset.remove);return;}
  if(b.hasAttribute('data-expand-image')){const record=data.records.find(e=>e.id===b.dataset.expandImage);if(record?.image)expandImage(record);return;}
  if(b.hasAttribute('data-detail')){details(b.dataset.detail);return;}
  if(b.hasAttribute('data-type')){selectCategory(b.dataset.typeCategory,b.dataset.type);categoryNavigation.close(true);return;}
  if(b.hasAttribute('data-category')){selectCategory(b.dataset.category);categoryNavigation.open(b.dataset.category);return;}
  if(b.hasAttribute('data-view')){view=b.dataset.view;renderPalette();return;}
  if(b.hasAttribute('data-show-palette')){openPalette();return;}
  if(b.hasAttribute('data-reset')){resetFilters();return;}
  if(b.hasAttribute('data-close')){b.closest('dialog').close();return;}
  if(b.hasAttribute('data-share-card')){const e=data.records.find(x=>x.id===b.dataset.shareCard),u=new URL(location.href);u.search='';u.hash='';u.searchParams.set('familia',e.category);u.searchParams.set('ficha',e.id);copy(u.href,$('#detail-status'),'Enlace de la muestra');}
});
document.querySelectorAll('dialog').forEach(d=>{d.addEventListener('close',()=>{if(d.id==='palette')$('#open-palette').setAttribute('aria-expanded','false');const f=lastFocus.get(d);if(f?.isConnected&&!f.closest('dialog:not([open])'))f.focus();else if(!document.querySelector('dialog[open]'))$('#open-palette').focus();});d.addEventListener('click',ev=>{if(ev.target===d){const r=d.getBoundingClientRect();if(ev.clientX<r.left||ev.clientX>r.right||ev.clientY<r.top||ev.clientY>r.bottom)d.close();}});});
$('#search-form').onsubmit=e=>e.preventDefault();$('#filters').onsubmit=e=>e.preventDefault();$('#search').oninput=()=>render();for(const key of ['brand','supplier','market'])$('#'+key).onchange=()=>render();$('#reset-filters').onclick=resetFilters;
$('#active-type').onclick=()=>{family='';renderCategories();renderFamilies();render();updateURL();broadcast();};
function toggleSearch(open){
 $('#search-form').hidden=!open;
 $('#search-launch')?.setAttribute('aria-expanded',String(open));

 if(open)$('#search').focus();
 else{$('#search').value='';if(data)render();($('#search-launch')||document.querySelector('#cabecera .hamburguesa'))?.focus();}
}

$('#search-launch')?.addEventListener('click',()=>toggleSearch($('#search-form').hidden));
window.addEventListener('ago-catalogue-search',()=>toggleSearch($('#search-form').hidden));
$('#search').onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();toggleSearch(false);}};
$('#open-palette').onclick=openPalette;
$('#palette-image').onclick=async()=>{const b=$('#palette-image');b.disabled=true;$('#palette-status').textContent='Preparando tu imagen…';try{await exportImage(records(),project,publicURL());$('#palette-status').textContent='Imagen descargada. Puedes adjuntarla al conversar sobre tu proyecto.';}catch(e){$('#palette-status').textContent=e.message||'No pudimos descargar la imagen.';}finally{b.disabled=false;}};
$('#palette-send').onclick=()=>{const phone=window.MARCA?.whatsapp;if(!/^[0-9]{10,15}$/.test(phone||'')){$('#palette-status').textContent='Puedes descargar la imagen para compartir tu paleta desde Contacto.';return;}const text=selectionText(records(),project,publicURL());window.open('https://wa.me/'+phone+'?text='+encodeURIComponent(text),'_blank','noopener,noreferrer');$('#palette-status').textContent='WhatsApp abre con tu lista y el enlace. Revisa el mensaje y pulsa Enviar allí.';};
$('#palette-clear').onclick=()=>openDialog($('#confirm-clear'));$('#confirm-empty').onclick=()=>{selection=[];pair=[];persist();updateBadge();renderPalette();$('#confirm-clear').close();announce('Paleta vacía.');};
for(const [i,key] of ['pair-a','pair-b'].entries())$('#'+key).onchange=e=>{const value=e.target.value;const other=1-i;if(value===pair[other])pair[other]=pair[i];pair[i]=value;$('#pair-a').value=pair[0];$('#pair-b').value=pair[1];renderPair();};$('#overlay-mode').onchange=renderPair;
$('#ask-anorak').onclick=()=>openAI();$('#palette-ai').onclick=()=>openAI(true);
window.addEventListener('ago-material-action',e=>{if(!data)return;const {action,id}=e.detail||{};if(!data.records.some(x=>x.id===id))return;if(action==='add')pick(id,true);if(action==='detail')details(id);});
window.addEventListener('ago-open-palette',()=>{paletteRequested=true;if(data)openPalette();});
window.addEventListener('storage',e=>{if(e.key!==STORAGE_KEY||!data)return;let saved;try{saved=restorePalette(localStorage,data.records);}catch{return;}selection=saved.ids;project=saved.project;updateBadge();updateURL();broadcast();if($('#palette').open)renderPalette();});
fetch(new URL('catalogo.json?v=20261020-timber-tonos-v3',import.meta.url)).then(r=>{if(!r.ok)throw Error();return r.json();}).then(async d=>{
  if(['127.0.0.1','localhost','[::1]'].includes(location.hostname)){
    try{const response=await fetch('/_ago/local-materials.json');if(response.ok){const local=await response.json();const ids=new Set(d.records.map(r=>r.id));d.records.push(...(local.records||[]).filter(r=>!ids.has(r.id)));}}catch{}
  }
  data=prepareCatalogue(d);
  for(const record of data.records)for(const key of ['image','overview']){
    const sample=record[key];if(!sample)continue;
    sample.src=new URL(sample.src,import.meta.url).href;
    if(sample.srcset)sample.srcset=sample.srcset.split(',').map(part=>{const [src,size]=part.trim().split(/\s+/);return new URL(src,import.meta.url).href+' '+size;}).join(', ');
  }
  const initial=new URL(location.href);initial.pathname='/materiales';if(initial.searchParams.get('familia')==='maderas')initial.searchParams.delete('familia');
  history.replaceState(null,'',initial.href);
  const resolved=resolveCategory(params.get('familia'),params.get('tipo')||'',data.records.find(r=>r.id===params.get('ficha')));
  if(data.categories.some(e=>e.id===resolved.category))category=resolved.category;
  if(categoryTypes(category,data.records).some(t=>t.value===resolved.type))family=resolved.type;
  let stored={ids:[],project:''};try{stored=restorePalette(localStorage,data.records);}catch{}
  sharedOpening=params.has('seleccion');selection=sharedOpening?cleanIDs(params.get('seleccion').split(','),data.records):stored.ids;
  project=params.has('proyecto')?params.get('proyecto').slice(0,80):sharedOpening?'':stored.project;
  fillFilters();renderCategories();renderFamilies();render();persist(false);if(!params.has('ficha'))updateURL();
  if(paletteRequested)openPalette();else if(params.has('ficha'))details(params.get('ficha'));else if(sharedOpening&&selection.length)openPalette();
}).catch(()=>{$('#result-count').textContent='No pudimos cargar las muestras. Recarga la página e inténtalo otra vez.';});

$('#detail').addEventListener('close',updateURL);
