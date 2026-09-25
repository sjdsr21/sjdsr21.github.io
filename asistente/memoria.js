// Memoria local del navegador. Solo se comparte con el taller al contactar y aceptarlo.
import {HISTORY_LIMIT,conversationContext} from './contexto.js';
import {cleanProject} from './proyecto.js';
export const MEMORY_KEY='ago-chat-conversacion-v1';
export const RETENTION_MS=7*24*60*60*1000;
const MAX_MESSAGES=200;
const validMessage=m=>m&&['user','assistant'].includes(m.role)&&typeof m.content==='string'&&m.content.length<=20000;
const ids=value=>Array.isArray(value)?value.filter(id=>typeof id==='string'&&id.length<=200).slice(0,20):[];

export function forgetConversation(){
 try{localStorage.removeItem(MEMORY_KEY);return true;}catch{return false;}
}

export function readConversation(){
 try{
  const raw=localStorage.getItem(MEMORY_KEY);if(!raw)return null;
  const saved=JSON.parse(raw),now=Date.now();
  if(saved.version!==1||!Number.isFinite(saved.updatedAt)||saved.updatedAt>now+60000||now-saved.updatedAt>=RETENTION_MS||
     !Array.isArray(saved.messages)||!saved.messages.length||saved.messages.length>MAX_MESSAGES||!saved.messages.every(validMessage)||
     !Array.isArray(saved.history)||saved.history.length>HISTORY_LIMIT||!saved.history.every(validMessage)){
   forgetConversation();return null;
  }
  return {
   updatedAt:saved.updatedAt,
   selected:typeof saved.selected==='string'?saved.selected:undefined,
   conversationId:typeof saved.conversationId==='string'?saved.conversationId:undefined,
   ticket:typeof saved.ticket==='string'?saved.ticket.slice(0,100):undefined,
   project:cleanProject(saved.project),
   messages:saved.messages.map(m=>({role:m.role,content:m.content,fichas:ids(m.fichas),secciones:ids(m.secciones),opciones:ids(m.opciones).slice(0,3),imageName:typeof m.imageName==='string'?m.imageName.slice(0,120):undefined})),
   history:conversationContext(saved.history)
  };
 }catch{forgetConversation();return null;}
}

export function saveConversation({updatedAt,selected,messages,history,project,conversationId,ticket}){
 try{
  localStorage.setItem(MEMORY_KEY,JSON.stringify({version:1,updatedAt,selected,conversationId,ticket,project:cleanProject(project),messages:messages.slice(-MAX_MESSAGES).map(({imageURL,...m})=>m),history:conversationContext(history)}));
  return true;
 }catch{return false;}
}
