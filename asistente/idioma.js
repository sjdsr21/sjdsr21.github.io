export let language='es';
try{language=(new URLSearchParams(location.search).get('lang')||localStorage.getItem('idioma'))==='en'?'en':'es';}catch{}
export const greetingES='¡Hola! ¿Qué pieza tienes en mente, o qué problema necesitas solucionar en tu espacio?';
export const greetingEN='Hi! What piece do you have in mind, or what problem do you need to solve in your space?';
const english={
[greetingES]:greetingEN,
'Puedes enviar hasta 5 mensajes cada 10 minutos y 20 en 24 horas por dispositivo.':'You can send up to 5 messages every 10 minutes and 20 in 24 hours per device.',
'Asistente IA':'AI assistant','Conversación':'Conversation','Cerrar chatbot':'Close chatbot','Establece':'Get in','contacto':'touch','compartir esta conversación':'share this conversation',
'Escribe tu mensaje':'Write your message','Adjuntar foto o croquis':'Attach a photo or sketch','Enviar mensaje':'Send message','Asistente con IA · Privacidad':'AI assistant · Privacy','Ocultar información de privacidad':'Hide privacy information','Borrar conversación':'Delete conversation',
'Tu idea':'Your idea','Pieza':'Piece','Uso':'Use','Ubicación':'Location','Medidas':'Dimensions','Capacidad deseada':'Capacity needed','Materiales':'Materials','Estilo y acabado':'Style and finish','Instalación':'Installation','Entrega':'Delivery','Fecha deseada':'Preferred date','Presupuesto orientativo':'Approximate budget','Referencia visual · por confirmar':'Visual reference · to be confirmed','Por definir':'To be decided',
'Escribiendo…':'Typing…','Preparando imagen…':'Preparing image…','Quitar imagen':'Remove image','Consultar con nosotros':'Contact us','Precios por variante':'Prices by option','Prototipos':'Prototypes','Exhibición':'Exhibition','Encargos a medida':'Custom commissions','Habla con nosotros':'Talk to us','Entrega y envíos':'Delivery and shipping','Pago del catálogo':'Catalogue payments','Garantía':'Warranty',
'Puedes corregir cualquier detalle escribiéndolo en el chat. Las medidas y la viabilidad se revisan antes de la propuesta.':'You can correct any detail in the chat. Dimensions and feasibility are reviewed before the proposal.',
'Se guardan los últimos 200 mensajes en este navegador durante 7 días desde el último mensaje.':'The last 200 messages are saved in this browser for 7 days after your last message.',
'Este navegador no permite guardar la conversación. Podrás continuar mientras esta página permanezca abierta.':'This browser cannot save the conversation. You can continue while this page stays open.',
'«Establece contacto · compartir esta conversación» guarda el chat para el taller durante 90 días y abre WhatsApp con el resumen preparado. Allí puedes revisarlo y pulsar Enviar.':'“Get in touch · share this conversation” saves the chat for the workshop for 90 days and opens WhatsApp with a prepared summary. You can review it there and press Send.',
'Los mensajes e imágenes que envías se procesan mediante OpenRouter y su proveedor de modelo. Las imágenes se reducen y se eliminan sus metadatos antes del envío; no se guardan en el historial. Evita enviar información sensible. Al contactar puedes elegir compartir la conversación y la ficha con el taller, que se conservan hasta 90 días. También puedes contactar sin compartirlas. Santiago confirma stock, encargos y entrega.':'Messages and images you send are processed by OpenRouter and its model provider. Images are resized and their metadata removed before sending; they are not saved in the history. Avoid sharing sensitive information. When contacting us, you can choose to share the conversation and project brief with the workshop for up to 90 days, or contact us without sharing them. Santiago confirms availability, commissions and delivery.',
'El envío anterior quedó sin respuesta. Vuelve a enviar tu mensaje para continuar.':'Your previous message did not receive a reply. Send it again to continue.',
'La conexión no está disponible. Inténtalo más tarde.':'The connection is unavailable. Please try again later.','No se pudo consultar':'We could not process your request.','La respuesta llegó vacía. Inténtalo de nuevo.':'The response was empty. Please try again.','La respuesta está tardando. Inténtalo de nuevo.':'The response is taking too long. Please try again.','No se pudo conectar. Inténtalo de nuevo.':'Could not connect. Please try again.',
'No podemos responder ahora. Puedes explorar las fichas o contactarnos por otra vía.':'We cannot reply right now. You can explore the catalogue or contact us another way.','No pudimos completar la consulta. Intenta de nuevo o contáctanos por otra vía.':'We could not complete your request. Please try again or contact us another way.','Has enviado varias consultas. Espera un minuto.':'You have sent several requests. Please wait a minute.',
'Preparando el resumen para WhatsApp…':'Preparing the summary for WhatsApp…','Conversación compartida. Revisa el resumen y pulsa Enviar en WhatsApp.':'Conversation shared. Review the summary and press Send in WhatsApp.','No se pudo guardar el historial. WhatsApp incluye el resumen para que puedas continuar.':'The history could not be saved. WhatsApp includes the summary so you can continue.',
'No se pudo borrar la copia guardada. Puedes eliminar los datos de este sitio desde tu navegador.':'The saved copy could not be deleted. You can remove this site’s data in your browser.',
'Esta imagen es una referencia para mi idea.':'This image is a reference for my idea.','No pudimos cargar la información del taller. Intenta recargar el chat.':'We could not load the workshop information. Please reload the chat.',
'Elige una imagen JPG, PNG o WebP.':'Choose a JPG, PNG or WebP image.','La imagen debe pesar menos de 10 MB.':'The image must be smaller than 10 MB.','La imagen es demasiado compleja. Recórtala e inténtalo de nuevo.':'The image is too complex. Crop it and try again.',
'Trabajo realizado; un encargo similar se cotiza por separado.':'Completed project; a similar commission is quoted separately.',
'¿Compartir lo conversado con Anorak?':'Share your conversation with Anorak?',
'Vas a abrir WhatsApp.':'You are about to open WhatsApp.','Vas a abrir tu aplicación de correo.':'You are about to open your email app.','Vas a abrir Instagram.':'You are about to open Instagram.',
'Puedes compartir con el taller la información que discutiste con Anorak (asistente IA) sobre tu proyecto: la conversación y el resumen de tu idea, para que no tengas que explicarlo de nuevo.':'You can share the information you discussed with Anorak (AI assistant) about your project with the workshop: your conversation and idea summary, so you do not have to explain it again.',
'Solo el taller podrá consultar esta información durante 90 días. Las imágenes originales no se incluyen. También puedes abrir el contacto sin compartir nada.':'Only the workshop can access this information, for 90 days. Original images are not included. You can also open the contact without sharing anything.',
'Continuar con el taller':'Continue with the workshop','Compartir conversación con el taller':'Share conversation with the workshop','Compartir y continuar':'Share and continue','Continuar sin compartir':'Continue without sharing','Cancelar':'Cancel',
'Podemos compartir esta conversación y los detalles de tu idea para que no tengas que explicarlos de nuevo. Solo el taller podrá consultarlos, durante 90 días. Las imágenes originales no se incluyen.':'We can share this conversation and your project details so you do not have to explain them again. Only the workshop can access them, for 90 days. Original images are not included.'
};
export function t(value){
 if(language!=='en'||typeof value!=='string')return value;
 const key=value.trim();if(english[key])return value.replace(key,english[key]);
 return value.replace(/^Tu idea · (\d+) detalles$/,'Your idea · $1 details').replace(/^Desde \$(.+) · Ver variantes$/,'From $$$1 · View options').replace(/^Ver (.+) en Prototipos$/,'View $1 in Prototypes').replace(/^Ver (.+) en Exhibición$/,'View $1 in Exhibition').replace(/^Referencia visual: (.+) \(imagen no guardada\)$/,'Visual reference: $1 (image not saved)').replace(/^Referencia: /,'Reference: ');
}
const sources=new WeakMap();
function translated(node,key,current,write){
 let records=sources.get(node);if(!records){records={};sources.set(node,records);}
 let record=records[key];if(!record||current!==record.rendered)record={source:current};
 const value=t(record.source);if(value!==current)write(value);record.rendered=value;records[key]=record;
}
let observer;
export function translateUI(root=document.body){
 observer?.disconnect();
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;
 while(node=walker.nextNode()){
  if(node.parentElement?.closest('script,style,.burbuja,#idea-datos dd,#adjunto span'))continue;
  const text=node;translated(text,'text',text.nodeValue,v=>text.nodeValue=v);
 }
 for(const element of [root,...root.querySelectorAll('[aria-label],[title]')]){
  for(const key of ['aria-label','title'])if(element.hasAttribute(key))translated(element,key,element.getAttribute(key),v=>element.setAttribute(key,v));
 }
 observer?.observe(document.body,{childList:true,subtree:true,characterData:true});
}
export function setLanguage(value,root=document.body){language=value==='en'?'en':'es';document.documentElement.lang=language;translateUI(root);}
export function installLanguageUI(){setLanguage(language);observer=new MutationObserver(records=>{if(records.some(r=>!r.target.parentElement?.closest('.burbuja')))translateUI();});observer.observe(document.body,{childList:true,subtree:true,characterData:true});}
