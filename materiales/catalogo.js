'use strict';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalized=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
let data, category='maderas', selection=[], lastFocus;
const params=new URLSearchParams(location.search);
const publicURL=()=>{
  const u=new URL(location.href);u.search='';u.hash='';u.searchParams.set('familia',category);
  if(selection.length)u.searchParams.set('seleccion',selection.join(','));
  return u.href;
};
function updateURL(){history.replaceState(null,'',publicURL());}
function image(e){return e.image?`<img src="${esc(e.image.src)}" alt="${esc(e.name)}: ${esc(e.imageKind)}" width="${e.image.width}" height="${e.image.height}" loading="lazy">`:`<div class="card-guide"><span>ACABADOS AGO</span><strong>${esc(e.name)}</strong></div>`;}
function identity(e){return [e.brand,e.code,e.finish].filter(Boolean).join(' · ')||e.family;}
function picker(e,extra=''){let chosen=selection.includes(e.id);return `<button type="button" class="pick ${extra}" data-pick="${esc(e.id)}" aria-pressed="${chosen}" aria-label="${chosen?'Quitar':'Seleccionar'} ${esc(e.name)}">${chosen?'Seleccionado':'Elegir'}</button>`;}
function renderCategories(){
  $('#categories').innerHTML=data.categories.map(e=>`<button type="button" data-category="${e.id}" aria-current="${e.id===category}">${esc(e.name)}<small>${data.records.filter(x=>x.category===e.id).length}</small></button>`).join('');
}
function fillFilters(){
  const all=data.records.filter(e=>e.category===category);
  for(const key of ['brand','supplier']){
    const values=[...new Set(all.map(e=>e[key]).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
    $('#'+key).innerHTML=`<option value="">${key==='brand'?'Todas las marcas':'Todos los proveedores'}</option>`+values.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');
    $('#'+key).disabled=!values.length;
  }
}
function filtered(){
  const q=normalized($('#search').value.trim());
  return data.records.filter(e=>e.category===category&&(!$('#brand').value||e.brand===$('#brand').value)&&(!$('#supplier').value||e.supplier===$('#supplier').value)&&(!$('#market').value||($('#market').value==='internacional'?e.international:!e.international))&&(!q||normalized([e.name,e.code,e.brand,e.supplier,e.family,e.finish,e.description].join(' ')).includes(q)));
}
function render(){
  const cat=data.categories.find(e=>e.id===category), list=filtered();
  $('#section-title').textContent=cat.name;$('#section-intro').textContent=cat.intro;$('#category-note').textContent=cat.note;
  $('#section-index').textContent=String(data.categories.indexOf(cat)+1).padStart(2,'0')+' / '+cat.name.toLocaleUpperCase('es');
  $('#result-count').textContent=list.length+' '+(list.length===1?'referencia':'referencias');
  $('#empty').hidden=!!list.length;
  $('#grid').innerHTML=list.map(e=>`<article class="card"><button type="button" class="card-open" data-detail="${esc(e.id)}" aria-label="Ver ficha de ${esc(e.name)}"><div class="card-image">${image(e)}</div><span class="image-kind">${esc(e.imageKind)}</span><h3>${esc(e.name)}</h3><p class="identity">${esc(identity(e))}</p><p class="desc">${esc(e.description)}</p></button>${picker(e)}<div class="card-bottom"><span class="market-label">${e.international?'Colección internacional':e.supplier?esc(e.supplier):e.category==='maderas'?'Madera del taller':e.category==='acabados'?'Acabado del taller':e.brand?'Catálogo de marca':'Referencia por consultar'}</span><button type="button" data-detail="${esc(e.id)}">Ver ficha ↗</button></div></article>`).join('');
  updateBar();
}
function updateBar(){
  $('#selection-bar').hidden=!selection.length;$('#selection-count').textContent=selection.length+' de 4 opciones';$('#compare').disabled=!selection.length;
  document.querySelectorAll('[data-pick]').forEach(b=>{const e=data.records.find(e=>e.id===b.dataset.pick),yes=selection.includes(e.id);b.setAttribute('aria-pressed',String(yes));b.setAttribute('aria-label',(yes?'Quitar':'Seleccionar')+' '+e.name);b.textContent=yes?'Seleccionado':'Elegir';});
}
function pick(id){
  if(selection.includes(id))selection=selection.filter(e=>e!==id);
  else if(selection.length<4)selection.push(id);
  else{announce('Puedes comparar hasta cuatro opciones. Quita una para elegir otra.');return;}
  updateBar();updateURL();if($('#comparison').open)renderComparison();
}
function announce(text){$('#message').textContent=text;}
function openDialog(d){lastFocus=document.activeElement;d.showModal();}
function details(id,initial=false){
  const e=data.records.find(e=>e.id===id);if(!e)return;
  $('#detail-content').innerHTML=`<div class="detail-layout"><div class="detail-visual">${image(e)}<p class="credit">${esc(e.imageNote)}</p>${e.workURL?`<a class="text-link" href="${esc(e.workURL)}">Ver el trabajo de AGO ↗</a>`:''}</div><div class="detail-copy"><p class="eyebrow">${esc(data.categories.find(c=>c.id===e.category).name)}</p><h2>${esc(e.name)}</h2><p>${esc(identity(e))}</p><p>${esc(e.description)}</p><h3>PARA QUÉ CONSIDERARLO</h3><p>${esc(e.use)}</p><h3>QUÉ CONVIENE REVISAR</h3><p>${esc(e.care)}</p><h3>PROVEEDOR Y DISPONIBILIDAD</h3><p>${esc(e.supplier?e.supplier+'. ':'')}${esc(e.supplierNote||e.availability)}</p><p class="credit">${esc(e.market)}</p><div class="links">${e.sourceLinks.map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)} ↗</a>`).join('')}</div>${picker(e,'pick-detail')} <button type="button" data-share-card="${esc(e.id)}">Copiar enlace de esta ficha</button><p id="detail-share-status" aria-live="polite"></p></div></div>`;
  if(!$('#detail').open)openDialog($('#detail'));
}
function renderComparison(){
  $('#comparison-content').innerHTML=selection.map(id=>data.records.find(e=>e.id===id)).map(e=>`<article>${image(e)}<h3>${esc(e.name)}</h3><p>${esc(identity(e))}</p><p>${esc(e.description)}</p><strong>Qué revisar</strong><p>${esc(e.care)}</p><p>${esc(e.supplier||e.market)}</p><button type="button" data-pick="${esc(e.id)}" aria-label="Quitar ${esc(e.name)}">Quitar</button></article>`).join('');
  $('#compare-share').disabled=!selection.length;
}
async function copy(url,status){
  try{await navigator.clipboard.writeText(url);status.textContent='Enlace copiado. Puedes pegarlo para compartir.';}
  catch{if($('#detail').open)$('#detail').close();if($('#comparison').open)$('#comparison').close();$('#copy-url').value=url;openDialog($('#copy-fallback'));$('#copy-url').select();}
}
function selectCategory(id,scroll=true){
  if(!data.categories.some(c=>c.id===id))return;category=id;$('#filters').reset();fillFilters();renderCategories();render();updateURL();
  if(scroll)$('#catalogo').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
}
document.addEventListener('click',ev=>{
  const pickButton=ev.target.closest('[data-pick]');if(pickButton){pick(pickButton.dataset.pick);return;}
  const detail=ev.target.closest('[data-detail]');if(detail){details(detail.dataset.detail);return;}
  const cat=ev.target.closest('[data-category]');if(cat){selectCategory(cat.dataset.category);return;}
  const close=ev.target.closest('[data-close]');if(close){close.closest('dialog').close();return;}
  const card=ev.target.closest('[data-share-card]');if(card){const e=data.records.find(x=>x.id===card.dataset.shareCard);const u=new URL(location.href);u.search='';u.hash='';u.searchParams.set('familia',e.category);u.searchParams.set('ficha',e.id);copy(u.href,$('#detail-share-status'));}
});
document.querySelectorAll('dialog').forEach(d=>{d.addEventListener('close',()=>lastFocus?.focus());d.addEventListener('click',ev=>{if(ev.target===d){const r=d.getBoundingClientRect();if(ev.clientX<r.left||ev.clientX>r.right||ev.clientY<r.top||ev.clientY>r.bottom)d.close();}});});
$('#filters').addEventListener('submit',e=>e.preventDefault());$('#search').addEventListener('input',()=>render());for(const key of ['brand','supplier','market'])$('#'+key).addEventListener('change',()=>render());
$('#reset').addEventListener('click',()=>{$('#filters').reset();render();});
$('#clear').addEventListener('click',()=>{selection=[];updateBar();updateURL();announce('Selección vacía.');});
$('#compare').addEventListener('click',()=>{renderComparison();$('#share-status').textContent='';openDialog($('#comparison'));});
$('#share').addEventListener('click',()=>copy(publicURL(),$('#message')));$('#compare-share').addEventListener('click',()=>copy(publicURL(),$('#share-status')));
fetch('catalogo.json').then(r=>{if(!r.ok)throw Error('No se pudo cargar el catálogo.');return r.json();}).then(d=>{
  data=d;
  const cat=params.get('familia');if(data.categories.some(e=>e.id===cat))category=cat;
  selection=[...new Set((params.get('seleccion')||'').split(','))].filter(id=>data.records.some(e=>e.id===id)).slice(0,4);
  fillFilters();renderCategories();render();
  if(params.has('ficha'))details(params.get('ficha'),true);
  else if(selection.length){renderComparison();openDialog($('#comparison'));}
}).catch(()=>{$('#section-intro').textContent='No pudimos cargar las muestras. Recarga la página o abre la guía PDF.';$('#result-count').textContent='';});
