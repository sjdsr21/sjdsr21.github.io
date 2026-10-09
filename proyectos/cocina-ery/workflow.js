import {STORAGE_KEY,loadNotebook,decodeCombination,encodeCombination,createHistory} from './combination-state.js?v=20261009-panel';
export function createWorkflow({palette,snapshot,appearance,apply,defaultCombination,announce,onFavorites}){
  const $=id=>document.getElementById(id);let storage,book;
  try{storage=window.localStorage;book=loadNotebook(palette,storage);}catch{book={current:null,saved:[],favorites:[],available:false};}
  let history,timer;
  function status(text){$('save-status').textContent=text;}
  function persist(){
    clearTimeout(timer);
    try{if(!storage)throw Error();storage.setItem(STORAGE_KEY,JSON.stringify({version:1,current:snapshot(),saved:book.saved,favorites:book.favorites}));status('Guardado en este navegador');return true;}
    catch{status('Para conservarla, usa Compartir. El guardado local no está disponible.');return false;}
  }
  function schedule(){clearTimeout(timer);timer=setTimeout(persist,350);}
  function controls(){$('undo').disabled=!history?.canUndo;$('redo').disabled=!history?.canRedo;}
  function renderOptions(){
    const select=$('saved-combinations'),previous=select.value,current=JSON.stringify(appearance());
    const entries=[{name:'Propuesta de Santiago',state:defaultCombination},...book.saved];
    select.replaceChildren(new Option('Combinación sin guardar',''));
    entries.forEach((entry,i)=>select.add(new Option(entry.name,String(i))));
    const match=entries.findIndex(entry=>JSON.stringify(withoutCamera(entry.state))===current);
    select.value=previous!==''&&entries[Number(previous)]&&JSON.stringify(withoutCamera(entries[Number(previous)].state))===current?previous:match<0?'':String(match);
  }
  function withoutCamera(state){const {camera,...value}=state;return value;}
  function changed(group=null){if(!history)return;$('combination-feedback').textContent='';history.record(appearance(),group);controls();renderOptions();schedule();}
  function restore(){
    let chosen=book.current||defaultCombination,message=book.current?'Recuperamos tu última combinación.':'Propuesta de Santiago abierta.';
    if(location.hash.startsWith('#c=')){
      try{chosen=decodeCombination(location.hash.slice(3),palette);message='Combinación del enlace abierta.';}
      catch(error){message=error.message;$('restore-note').hidden=false;$('restore-note').textContent=message;}
      // Once consumed, the link must not override subsequent saved changes on reload.
      window.history.replaceState(null,'',location.pathname+location.search);
    }
    if(chosen)apply(chosen,{camera:true});history=createHistory(appearance());controls();renderOptions();onFavorites(book.favorites);
    if(message)announce(message);persist();
  }
  function undoRedo(kind){const next=history?.[kind]();if(next){apply(next);controls();renderOptions();persist();announce(kind==='undo'?'Cambio deshecho.':'Cambio rehecho.');}}
  $('undo').addEventListener('click',()=>undoRedo('undo'));$('redo').addEventListener('click',()=>undoRedo('redo'));
  document.addEventListener('keydown',event=>{
    if(!(event.ctrlKey||event.metaKey)||event.altKey||event.target.closest('input,textarea,[contenteditable="true"]'))return;
    const key=event.key.toLowerCase();if(key==='z'||key==='y'){event.preventDefault();undoRedo(key==='y'||event.shiftKey?'redo':'undo');}
  });
  $('saved-combinations').addEventListener('change',event=>{
    if(event.target.value==='')return;
    const index=Number(event.target.value),entry=index===0?{name:'Propuesta de Santiago',state:defaultCombination}:book.saved[index-1];
    if(entry){apply(entry.state);changed();announce(entry.name+'. Se conserva el ángulo actual.');}
  });
  const saveDialog=$('save-combination-dialog');
  function nameNote(){
    const name=$('combination-name').value.trim();
    $('combination-name-note').textContent=name==='Propuesta de Santiago'?'Elige otro nombre para conservar la propuesta inicial.':book.saved.some(e=>e.name===name)?'Ya existe una combinación con este nombre. Al guardar se actualizará.':'Se guardará en este navegador.';
  }
  $('save-combination').addEventListener('click',()=>{
    let n=1;while(book.saved.some(e=>e.name==='Mi combinación '+n))n++;
    $('combination-name').value='Mi combinación '+n;nameNote();saveDialog.showModal();$('combination-name').select();
  });
  $('combination-name').addEventListener('input',nameNote);
  $('cancel-combination').addEventListener('click',()=>saveDialog.close());
  $('save-combination-form').addEventListener('submit',event=>{
    event.preventDefault();const name=$('combination-name').value.trim();
    if(!name||name==='Propuesta de Santiago'){nameNote();$('combination-name').focus();return;}
    const previous=[...book.saved],index=book.saved.findIndex(e=>e.name===name),entry={name,state:snapshot()};
    if(index<0)book.saved.push(entry);else book.saved[index]=entry;
    if(!persist()){book.saved=previous;$('combination-name-note').textContent='No se pudo guardar. Usa Compartir para conservar esta combinación.';return;}
    renderOptions();$('saved-combinations').value=String(book.saved.findIndex(e=>e.name===name)+1);saveDialog.close();$('combination-feedback').textContent='Guardado exitosamente';announce('Combinación '+name+' guardada exitosamente.');
  });
  const dialog=$('share-dialog');
  $('share').addEventListener('click',()=>{
    const url=new URL(location.protocol==='file:'?'https://prototipoago.com/proyectos/cocina-ery/':location.href);url.hash='c='+encodeCombination(snapshot());
    $('share-link').value=url.href;$('share-feedback').textContent='El enlace abre estos acabados y esta vista. Puedes enviarlo por WhatsApp.';
    $('native-share').hidden=!navigator.share;dialog.showModal();
  });
  $('close-share').addEventListener('click',()=>dialog.close());
  $('copy-link').addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText($('share-link').value);$('share-feedback').textContent='Enlace copiado. Ya puedes pegarlo en tu mensaje.';}
    catch{$('share-link').focus();$('share-link').select();$('share-feedback').textContent='Selecciona y copia este enlace para enviarlo.';}
  });
  $('native-share').addEventListener('click',async()=>{
    try{await navigator.share({title:'Mi combinación · Cocina Ery',text:'Esta es mi combinación de acabados para la cocina.',url:$('share-link').value});}
    catch(error){if(error.name!=='AbortError')$('share-feedback').textContent='Puedes usar Copiar enlace para compartirla.';}
  });
  window.addEventListener('pagehide',persist);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)persist();});
  return {restore,resetDefault(){apply(defaultCombination,{camera:true});$('saved-combinations').value='0';changed();persist();announce('Propuesta de Santiago restaurada.');},changed,persist:schedule,endGroup:()=>history?.endGroup(),get favorites(){return [...book.favorites];},toggleFavorite(id){
    if(!palette.some(f=>f.id===id))return;book.favorites=book.favorites.includes(id)?book.favorites.filter(f=>f!==id):[...book.favorites,id];onFavorites(book.favorites);persist();
  },diagnostics:()=>({undo:!!history?.canUndo,redo:!!history?.canRedo,saved:book.saved.map(o=>o.name),favorites:[...book.favorites]})};
}
