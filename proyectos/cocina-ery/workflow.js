import {STORAGE_KEY,loadNotebook,decodeCombination,encodeCombination,createHistory} from './combination-state.js';
export function createWorkflow({palette,snapshot,appearance,apply,thumbnail,announce,onFavorites}){
  const $=id=>document.getElementById(id);let storage,book;
  try{storage=window.localStorage;book=loadNotebook(palette,storage);}catch{book={current:null,options:[null,null,null],favorites:[],available:false};}
  let history,timer,busy=false;const letter=i=>'ABC'[i];
  function status(text){$('save-status').textContent=text;}
  function persist(){
    clearTimeout(timer);
    try{if(!storage)throw Error();storage.setItem(STORAGE_KEY,JSON.stringify({version:1,current:snapshot(),options:book.options,favorites:book.favorites}));status('Guardado en este navegador');}
    catch{status('Para conservarla, usa Compartir. El guardado local no está disponible.');}
  }
  function schedule(){clearTimeout(timer);timer=setTimeout(persist,350);}
  function controls(){$('undo').disabled=!history?.canUndo;$('redo').disabled=!history?.canRedo;}
  function renderOptions(){
    for(let i=0;i<3;i++){
      const option=book.options[i],button=$('option-'+i),image=button.querySelector('img');button.disabled=!option;
      image.hidden=!option?.image;if(option?.image)image.src=option.image;else image.removeAttribute('src');
      button.querySelector('.option-empty').hidden=!!option?.image;
      button.setAttribute('aria-pressed',String(!!option&&JSON.stringify(withoutCamera(option.state))===JSON.stringify(appearance())));
      $('save-option-'+i).textContent=option?'Actualizar '+letter(i):'Guardar '+letter(i);
    }
  }
  function withoutCamera(state){const {camera,...value}=state;return value;}
  function changed(group=null){if(!history)return;history.record(appearance(),group);controls();renderOptions();schedule();}
  function restore(){
    let chosen=book.current,message=chosen?'Recuperamos tu última combinación.':'';
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
  for(let i=0;i<3;i++){
    $('option-'+i).addEventListener('click',()=>{if(book.options[i]){apply(book.options[i].state);changed();announce('Mostrando opción '+letter(i)+'. Se conserva el ángulo actual.');}});
    $('save-option-'+i).addEventListener('click',async()=>{
      if(busy)return;busy=true;const button=$('save-option-'+i);button.disabled=true;
      try{
        const image=await thumbnail(),state=snapshot();book.options[i]={state,image};renderOptions();persist();announce('Opción '+letter(i)+' guardada.');
      }catch{announce('No se pudo guardar la miniatura. Espera a que cargue el acabado e inténtalo de nuevo.');}
      finally{busy=false;button.disabled=false;}
    });
  }
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
  return {restore,changed,persist:schedule,endGroup:()=>history?.endGroup(),get favorites(){return [...book.favorites];},toggleFavorite(id){
    if(!palette.some(f=>f.id===id))return;book.favorites=book.favorites.includes(id)?book.favorites.filter(f=>f!==id):[...book.favorites,id];onFavorites(book.favorites);persist();
  },diagnostics:()=>({undo:!!history?.canUndo,redo:!!history?.canRedo,options:book.options.map(o=>!!o),favorites:[...book.favorites]})};
}
