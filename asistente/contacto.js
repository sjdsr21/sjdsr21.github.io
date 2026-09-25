import {readConversation,RETENTION_MS} from './memoria.js';
import {cleanProject,projectText} from './proyecto.js';
export function canContact(saved,now=Date.now()){
 if(!saved?.ticket||!saved?.conversationId||!saved.updatedAt||now-saved.updatedAt>=RETENTION_MS)return false;
 const history=Array.isArray(saved.history)?saved.history:[],user=history.findIndex(m=>m.role==='user');
 return user>=0&&history.slice(user+1).some(m=>m.role==='assistant');
}
export async function shareConversation(saved,channel,endpoint){
 const r=await fetch(new URL('/contacto',endpoint),{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(12000),body:JSON.stringify({id:saved.conversationId,ticket:saved.ticket,consent:true,channel,project:saved.project,messages:saved.messages.slice(-200).map(({role,content,imageName,fichas,secciones})=>({role,content,imageName,fichas,secciones}))})});
 if(!r.ok)throw Error('No se pudo guardar la conversación');
 const result=await r.json();if(result.saved!==true||result.id!==saved.conversationId)throw Error('No se confirmó el guardado');
 return result;
}
export function whatsappMessage(saved,shared,endpoint){
 const project=cleanProject(saved.project),idea=projectText(project).trim();
 const question='Mi consulta: '+(saved.messages.filter(m=>m.role==='user').at(-1)?.content||'Quisiera conversar sobre una idea.');
 const brief=Object.keys(project.datos).length?idea:[question,idea].filter(Boolean).join('\n\n');
 const summary=brief.length>1500?brief.slice(0,1500)+'…\n(Resumen abreviado)':brief;
 const lines=['Hola, quisiera establecer contacto sobre esta idea que conversé con el Asistente IA de Prototipo Ago:',summary];
 if(shared){
  const url=new URL('/admin',endpoint);url.searchParams.set('consulta',saved.conversationId);
  lines.push('Código de consulta: '+saved.conversationId,'Conversación completa para el taller:\n'+url.href);
 }else lines.push('No se pudo guardar la conversación completa; comparto este resumen.');
 return lines.join('\n\n');
}
export async function prepareWhatsAppContact(saved,endpoint){
 let shared=false;
 try{await shareConversation(saved,'whatsapp',endpoint);shared=true;}catch{}
 const url=new URL('https://wa.me/584120152753');url.searchParams.set('text',whatsappMessage(saved,shared,endpoint));
 return {url:url.href,shared};
}
export function contactChannel(href,base=location.href){
 let url;try{url=new URL(href,base);}catch{return null;}
 if(url.protocol==='https:'&&url.hostname==='wa.me'&&url.pathname==='/584120152753')return 'whatsapp';
 if(url.protocol==='mailto:'&&url.pathname.toLowerCase()==='sjdesousar@gmail.com')return 'correo';
 if(url.protocol==='https:'&&url.hostname==='instagram.com'&&url.pathname.replace(/\/$/,'')==='/prototipo_ago')return 'instagram';return null;
}
async function choice(channel){
 const {setLanguage}=await import('./idioma.js');

 const dialog=document.createElement('dialog');dialog.setAttribute('aria-label','Compartir conversación con el taller');
 dialog.style.cssText='max-width:390px;width:calc(100% - 32px);padding:22px;border:1px solid #444;background:#101010;color:#fff;font:14px/1.5 Roboto,Arial,sans-serif';
 dialog.innerHTML='<form method="dialog" style="display:block;padding:0;border:0;background:none"><h2 style="font-size:18px;margin-top:0">¿Compartir lo conversado con Anorak?</h2><p>Puedes compartir con el taller la información que discutiste con Anorak (asistente IA) sobre tu proyecto: la conversación y el resumen de tu idea, para que no tengas que explicarlo de nuevo.</p><p>Solo el taller podrá consultar esta información durante 90 días. Las imágenes originales no se incluyen. También puedes abrir el contacto sin compartir nada.</p><p style="display:grid;gap:8px"><button value="compartir">Compartir y continuar</button><button value="sin">Continuar sin compartir</button><button value="cancelar">Cancelar</button></p></form>';
 dialog.querySelectorAll('button').forEach(b=>b.style.cssText='font:inherit;padding:9px;border:1px solid #70452f;background:transparent;color:#eee;cursor:pointer');
 const next=document.createElement('p');next.textContent=channel==='whatsapp'?'Vas a abrir WhatsApp.':channel==='correo'?'Vas a abrir tu aplicación de correo.':'Vas a abrir Instagram.';dialog.querySelector('h2').after(next);
 document.body.append(dialog);setLanguage(document.documentElement.lang,dialog);dialog.showModal();
 return new Promise(resolve=>dialog.addEventListener('close',()=>{const value=dialog.returnValue;dialog.remove();resolve(value==='compartir'?true:value==='sin'?false:null);},{once:true}));
}
export function installContactSharing(getState=readConversation){
 if(document.documentElement.dataset.agoCompartir)return;document.documentElement.dataset.agoCompartir='1';
 let handling=false;
 document.addEventListener('click',async event=>{
  const a=event.target.closest?.('a[href]');if(!a||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  const channel=contactChannel(a.href),saved=getState();
  if(!channel||!saved?.ticket||!saved?.conversationId||!saved.messages?.some(m=>m.role==='user')||!window.AGO_CHAT_ENDPOINT)return;
  event.preventDefault();if(handling)return;handling=true;
  try{
   const key='ago-compartir-'+saved.conversationId;let previous;try{previous=sessionStorage.getItem(key);}catch{}
   const share=previous==='si'?true:previous==='no'?false:await choice(channel);if(share===null)return;
   try{sessionStorage.setItem(key,share?'si':'no');}catch{}
   let href=a.href;const external=a.target==='_blank',newTab=external?window.open('about:blank','_blank'):null;if(newTab)newTab.opener=null;
   if(share){
    try{
     await shareConversation(saved,channel,window.AGO_CHAT_ENDPOINT);
     if(channel==='whatsapp'){const u=new URL(href);u.searchParams.set('text',(u.searchParams.get('text')||'Hola, quisiera conversar sobre mi idea.')+'\nConsulta del chatbot: '+saved.conversationId);href=u.href;}
     if(channel==='correo'){const u=new URL(href);u.searchParams.set('subject','Consulta del chatbot '+saved.conversationId);href=u.href;}
    }catch{alert('No se pudo compartir la conversación. Abriremos el contacto para que puedas continuar igualmente.');}
   }
   if(newTab)newTab.location.replace(href);else if(window.top!==window)window.top.location.href=href;else location.href=href;
  }finally{handling=false;}
 },true);
}
