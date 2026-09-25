import {agoFace} from './rostro.js';
import {enlaceFicha} from './enlaces.js';
import {conversationContext} from './contexto.js';
import {CAMPOS,cleanProject} from './proyecto.js';
import {prepareImage} from './imagenes.js';
import {installContactSharing,canContact,prepareWhatsAppContact} from './contacto.js';
import {MEMORY_KEY,RETENTION_MS,readConversation,saveConversation,forgetConversation} from './memoria.js';
const $=s=>document.querySelector(s), history=[];
const embedded=window.parent!==window, reduced=matchMedia('(prefers-reduced-motion: reduce)');
let data, selected, busy=false;
let chatVisible=!embedded, lastBot=null, typing=null, typingTimer=0;
let messages=[],updatedAt=0,requestController=null,ready=false;
let project=cleanProject(),conversationId=crypto.randomUUID(),pendingImage=null,imageGeneration=0,preparingImage=false;
let ticket,sharing=false;
const greeting='¡Hola! ¿Qué pieza tienes en mente, o qué problema necesitas solucionar en tu espacio?';
function el(tag,text,cls){const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;}
function scrollEnd(){$('#conversacion').scrollTop=$('#conversacion').scrollHeight;}
function characterDelay(char,record){
 const pause=/[.!?…]/.test(char)?230:/[,;:]/.test(char)?110:char==='\n'?180:0;
 return record.delay+pause*Math.sqrt(record.delay/32);
}
function canType(){return chatVisible&&!document.hidden;}
function stopTimer(){clearTimeout(typingTimer);typingTimer=0;}
function finishTyping(){
 stopTimer();if(!typing)return;
 const record=typing;typing=null;
 record.visible.textContent=record.text;record.index=record.chars.length;
 record.bubble.classList.remove('escribiendo');record.bubble.removeAttribute('aria-busy');
 agoFace?.stopSpeaking();
}
function typeNext(){
 typingTimer=0;if(!typing||!canType())return;
 const log=$('#conversacion'),follow=log.scrollHeight-log.scrollTop-log.clientHeight<48;
 const record=typing;
 record.index++;record.visible.textContent=record.chars.slice(0,record.index).join('');
 if(record.index>=record.chars.length)finishTyping();
 else typingTimer=setTimeout(typeNext,characterDelay(record.chars[record.index-1],record));
 if(follow)scrollEnd();
}
function resumeTyping(){
 if(!typing||typingTimer||!canType())return;
 if(reduced.matches){finishTyping();scrollEnd();return;}
 const remaining=typing.chars.slice(typing.index).reduce((sum,char)=>sum+characterDelay(char,typing),0);
 agoFace?.speak(typing.text,{duration:remaining/1000+.6});
 typingTimer=setTimeout(typeNext,80);
}
function startTyping(record){
 finishTyping();typing=record;record.index=0;record.visible.textContent='';
 record.bubble.classList.add('escribiendo');record.bubble.setAttribute('aria-busy','true');
 scrollEnd();resumeTyping();
}
function say(text,user=false,animate=true,rememberBot=animate){
 const bubble=el('div',null,'burbuja'+(user?' usuario':'')),paragraph=el('p');
 bubble.append(paragraph);$('#conversacion').append(bubble);
 if(!user&&rememberBot){
  const full=String(text??''),visible=el('span',null,'texto-progresivo');
  visible.setAttribute('aria-hidden','true');paragraph.append(visible,el('span',full,'sr-only'));
  const chars=Array.from(full),delay=6+26/(1+Math.max(0,chars.length-60)/180);
  lastBot={bubble,visible,text:full,chars,index:0,delay};
  if(animate)startTyping(lastBot);else visible.textContent=full;
 }else paragraph.textContent=text;
 scrollEnd();return bubble;
}
function persist(){
 if(!updatedAt)return;
 const saved=saveConversation({updatedAt,selected,messages,history,project,conversationId,ticket});
 $('#memoria-aviso').textContent=saved?'Se guardan los últimos 200 mensajes en este navegador durante 7 días desde el último mensaje.':'Este navegador no permite guardar la conversación. Podrás continuar mientras esta página permanezca abierta.';
}
function contactState(){return {updatedAt,conversationId,ticket,project,messages,history};}
function renderContact(){
 const visible=!!data&&canContact(contactState());
 $('#contacto-idea').hidden=!visible;$('.chat').classList.toggle('con-contacto',visible);
 $('#contactar-idea').disabled=busy||sharing||preparingImage;
 $('#borrar-conversacion').disabled=sharing;
}
function appendMessage(message,animate=true){
 if(message.role==='user')document.querySelectorAll('.respuestas button').forEach(b=>b.disabled=true);
 messages.push(message);
 const bubble=say(message.content,message.role==='user',animate,message.role==='assistant');
 if(message.imageName){
  if(message.imageURL){const img=el('img',null,'referencia-adjunta');img.src=message.imageURL;img.alt='Referencia: '+message.imageName;bubble.append(img);}
  else bubble.append(el('small','Referencia visual: '+message.imageName+' (imagen no guardada)'));
 }
 if(message.role==='assistant'&&data){references(message.fichas||[],bubble);cards(message.fichas||[],bubble);sections(message.secciones||[],bubble);if(animate)choices(message.opciones||[],bubble);}
 return bubble;
}
function choices(options,bubble){
 const wrap=el('div',null,'respuestas');
 for(const text of options.slice(0,3)){
  const b=el('button',text);b.type='button';b.onclick=()=>{if(!busy&&!preparingImage)ask(text);};wrap.append(b);
 }
 if(wrap.childElementCount)bubble.append(wrap);
}
function renderProject(){
 const rows=Object.entries(project.datos),box=$('#idea-ficha'),content=$('#idea-datos');
 box.hidden=!rows.length&&!project.referencia_visual;content.replaceChildren();
 $('#idea-titulo').textContent='Tu idea'+(rows.length?' · '+rows.length+' detalles':'');
 for(const [key,item] of rows){content.append(el('dt',CAMPOS[key]),el('dd',item.valor));}
 if(project.referencia_visual)content.append(el('dt','Referencia visual · por confirmar'),el('dd',project.referencia_visual));
 if(project.pendientes.length)content.append(el('dt','Por definir'),el('dd',project.pendientes.join(' · ')));
}
function clearImage(){
 imageGeneration++;preparingImage=false;pendingImage=null;$('#archivo-imagen').value='';$('#adjunto').hidden=true;$('#adjunto').replaceChildren();
 $('#enviar').disabled=busy||!data;
}
function clearView(){
 requestController?.abort();requestController=null;busy=false;finishTyping();
 messages=[];history.length=0;selected=undefined;updatedAt=0;lastBot=null;
 project=cleanProject();conversationId=crypto.randomUUID();ticket=undefined;clearImage();renderProject();
 $('#contacto-estado').textContent='';renderContact();
 $('#conversacion').replaceChildren();$('#mensaje').value='';$('#enviar').disabled=!data;
}
function restoreConversation(saved){
 clearView();
 if(!saved){appendMessage({role:'assistant',content:greeting});return;}
 updatedAt=saved.updatedAt;selected=data?.fichas.some(f=>f.id===saved.selected)?saved.selected:undefined;
 project=cleanProject(saved.project);conversationId=/^[a-f0-9-]{36}$/i.test(saved.conversationId||'')?saved.conversationId:crypto.randomUUID();renderProject();
 ticket=saved.ticket;
 history.push(...saved.history);
 for(const [index,stored] of saved.messages.entries()){
  const message=index===0&&stored.role==='assistant'&&stored.content==='¡Hola! ¿Qué estás buscando para tu espacio?'?{...stored,content:greeting}:stored;
  appendMessage(message,false);
 }
 if(messages.at(-1).role==='assistant'){choices(messages.at(-1).opciones||[],lastBot.bubble);startTyping(lastBot);}
 else{
  say('El envío anterior quedó sin respuesta. Vuelve a enviar tu mensaje para continuar.',false,false);
  $('#mensaje').value=messages.at(-1).content;
 }
 scrollEnd();
 renderContact();
}
function expireConversation(){
 if(updatedAt&&Date.now()-updatedAt>=RETENTION_MS){forgetConversation();restoreConversation(null);return true;}
 return false;
}
function photo(src,name){if(typeof src!=='string'||!/^img\/[a-zA-Z0-9_./ -]+\.(webp|png|jpg|jpeg|svg)$/i.test(src)||src.includes('..'))return null;const img=el('img');img.src=src;img.alt=name;img.loading='lazy';return img;}
function references(ids,bubble){
 const wrap=el('div',null,'enlaces');
 for(const id of new Set(ids)){
  const f=data.fichas.find(f=>f.id===id),href=enlaceFicha(f);
  if(!href)continue;
  const a=el('a','Ver '+f.nombre+' en '+(f.tipo==='producto'?'Prototipos':'Exhibición'));
  a.href=href;a.target='_top';wrap.append(a);
 }
 if(wrap.childElementCount)bubble.append(wrap);
}
function cards(ids,bubble){const list=ids.map(id=>data.fichas.find(f=>f.id===id)).filter(Boolean);if(!list.length)return;const wrap=el('div',null,'fichas');for(const f of list){const card=el('details',null,'ficha'),summary=el('summary'),img=photo(f.imagen,f.nombre),label=el('span',f.nombre,'nombre');if(img)summary.append(img);if(f.precios.length)label.append(el('span','Desde $'+Math.min(...f.precios.map(p=>p.usd))+' · Ver variantes','precio'));summary.append(label);card.append(summary);const body=el('div',null,'detalle');body.append(el('p',f.descripcion));const large=photo(f.imagen,f.nombre);if(large)body.append(large);if(f.precios.length){const table=el('table');table.setAttribute('aria-label','Precios por variante');for(const p of f.precios){const tr=el('tr');tr.append(el('td',p.nombre),el('td','$'+p.usd));table.append(tr);}body.append(table);}body.append(el('p',f.plazo||'Trabajo realizado; un encargo similar se cotiza por separado.'));const a=el('a','Consultar con nosotros');a.href=data.whatsapp+'?text='+encodeURIComponent('Hola, me interesa '+f.nombre);a.target='_blank';a.rel='noopener';body.append(a);card.append(body);card.ontoggle=()=>{if(card.open){selected=f.id;persist();}};wrap.append(card);}bubble.append(wrap);}
function sections(ids,bubble){const wrap=el('div',null,'enlaces');for(const id of ids){const s=data.secciones.find(x=>x.id===id);if(!s)continue;const a=el('a',s.nombre);a.href=s.url;a.target='_top';wrap.append(a);}if(wrap.childElementCount)bubble.append(wrap);}
async function ask(q){
 if(busy||sharing||preparingImage||!data)return;
 expireConversation();finishTyping();busy=true;
 const controller=new AbortController();requestController=controller;
 const attachment=pendingImage;clearImage();$('#adjunto-aviso').textContent='';
 appendMessage({role:'user',content:q,imageName:attachment?.name,imageURL:attachment?.url});updatedAt=Date.now();persist();
 renderContact();
 $('#enviar').disabled=true;
 const pending=say('Escribiendo…',false,false);pending.classList.add('espera');
 try{
  if(!window.AGO_CHAT_ENDPOINT)throw Error('La conexión no está disponible. Inténtalo más tarde.');
  const r=await fetch(window.AGO_CHAT_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},
   signal:AbortSignal.any([controller.signal,AbortSignal.timeout(30000)]),
   body:JSON.stringify({message:q,history:conversationContext(history),selected,project,image:attachment?.url,conversationId})});
  const out=await r.json();
  if(controller!==requestController)return;
  if(!r.ok)throw Error(out.error||'No se pudo consultar');
  if(typeof out.texto!=='string'||!out.texto.trim())throw Error('La respuesta llegó vacía. Inténtalo de nuevo.');
  pending.remove();
  project=cleanProject(out.project||project);renderProject();
  ticket=out.ticket||ticket;
  appendMessage({role:'assistant',content:out.texto,fichas:Array.isArray(out.fichas)?out.fichas:[],secciones:Array.isArray(out.secciones)?out.secciones:[],opciones:Array.isArray(out.opciones)?out.opciones:[]});
  history.push({role:'user',content:q},{role:'assistant',content:out.texto});
  updatedAt=Date.now();persist();scrollEnd();
 }catch(e){
  if(controller!==requestController)return;
  pending.remove();appendMessage({role:'assistant',content:e.name==='TimeoutError'?'La respuesta está tardando. Inténtalo de nuevo.':e.message||'No se pudo conectar. Inténtalo de nuevo.'});
  updatedAt=Date.now();persist();
 }finally{if(controller===requestController){requestController=null;busy=false;$('#enviar').disabled=false;renderContact();}}
}

$('#contactar-idea').onclick=async()=>{
 if(busy||sharing||preparingImage||expireConversation()||!canContact(contactState()))return;
 const saved=contactState();sharing=true;renderContact();$('#enviar').disabled=true;
 $('#contacto-estado').textContent='Preparando el resumen para WhatsApp…';
 // Se abre dentro del clic para evitar el bloqueo de ventanas al terminar el guardado.
 let newTab;try{newTab=window.open('about:blank','_blank');if(newTab)newTab.opener=null;}catch{}
 try{
  const result=await prepareWhatsAppContact(saved,window.AGO_CHAT_ENDPOINT);
  try{sessionStorage.setItem('ago-compartir-'+saved.conversationId,'si');}catch{}
  $('#contacto-estado').textContent=result.shared?'Conversación compartida. Revisa el resumen y pulsa Enviar en WhatsApp.':'No se pudo guardar el historial. WhatsApp incluye el resumen para que puedas continuar.';
  if(newTab){if(!newTab.closed)newTab.location.replace(result.url);}else if(window.top!==window)window.top.location.href=result.url;else location.href=result.url;
 }finally{sharing=false;$('#enviar').disabled=!data||busy||preparingImage;renderContact();}
};
document.documentElement.classList.toggle("embedded",embedded);
$('#minimizar').hidden=!embedded;
$('#minimizar').onclick=()=>parent.postMessage({type:'ago-close'},location.origin);
window.addEventListener('keydown',e=>{if(embedded&&e.key==='Escape')parent.postMessage({type:'ago-close'},location.origin);});
window.addEventListener('message',e=>{
 if(e.origin!==location.origin||e.source!==parent)return;
 if(e.data?.type==='ago-focus')$('#mensaje').focus();
 if(e.data?.type==='ago-visibility'){
  const opening=!chatVisible&&e.data.visible===true;
  chatVisible=e.data.visible===true;
  if(!chatVisible)stopTimer();
  else if(opening&&expireConversation())return;
  else if(opening&&lastBot&&!busy&&messages.at(-1)?.role==='assistant')startTyping(lastBot);
  else resumeTyping();
 }
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopTimer();else if(!expireConversation())resumeTyping();});
window.addEventListener('storage',e=>{
 if(!ready||(e.key!==MEMORY_KEY&&e.key!==null))return;
 restoreConversation(readConversation());
});
$('#borrar-conversacion').onclick=()=>{
 const cleared=forgetConversation();restoreConversation(null);$('#mensaje').focus();
 if(!cleared)$('#memoria-aviso').textContent='No se pudo borrar la copia guardada. Puedes eliminar los datos de este sitio desde tu navegador.';
};
$('#cerrar-privacidad').onclick=()=>{
 const details=$('.privacidad');details.open=false;details.querySelector('summary').focus();
};
reduced.addEventListener('change',()=>{if(reduced.matches&&typing){finishTyping();scrollEnd();}});
$('#enviar').disabled=true;
$('#consulta').onsubmit=e=>{e.preventDefault();if(busy||sharing||preparingImage||!data)return;const q=$('#mensaje').value.trim()||(pendingImage?'Esta imagen es una referencia para mi idea.':'');if(q){$('#mensaje').value='';ask(q);}};
$('#adjuntar').onclick=()=>{if(!busy&&!sharing)$('#archivo-imagen').click();};
$('#archivo-imagen').onchange=async()=>{
 const file=$('#archivo-imagen').files[0];if(!file)return;
 const generation=++imageGeneration;preparingImage=true;renderContact();$('#enviar').disabled=true;$('#adjunto-aviso').textContent='Preparando imagen…';
 try{
  const image=await prepareImage(file);if(generation!==imageGeneration)return;
  pendingImage=image;const preview=el('img');preview.src=image.url;preview.alt=image.name;
  const remove=el('button','Quitar imagen');remove.type='button';remove.onclick=clearImage;
  $('#adjunto').replaceChildren(preview,el('span',image.name),remove);$('#adjunto').hidden=false;$('#adjunto-aviso').textContent='';
 }catch(error){if(generation===imageGeneration){pendingImage=null;$('#adjunto').hidden=true;$('#adjunto-aviso').textContent=error.message;}}
 finally{if(generation===imageGeneration){preparingImage=false;$('#enviar').disabled=busy||sharing||!data;renderContact();}}
};
// El panel adopta el tema y los colores de la página que lo contiene.
window.addEventListener('message',e=>{
 if(e.origin!==location.origin||e.source!==parent||e.data?.type!=='chatbot-theme')return;
 for(const name of ['--papel','--tinta','--apagado','--linea','--acento-texto','--rostro-pupila','--curva','--curva-suave']){
  const value=e.data.values?.[name];if(typeof value==='string'&&value)document.documentElement.style.setProperty(name,value);
 }
});
try{const r=await fetch('asistente/conocimiento.json');if(!r.ok)throw Error();data=await r.json();}catch{}
restoreConversation(readConversation());ready=true;
$('#mensaje').disabled=!data;
if(!data)say('No pudimos cargar la información del taller. Intenta recargar el chat.',false,false);
$('#enviar').disabled=!data;
if(chatVisible)$('#mensaje').focus();
installContactSharing(contactState);
