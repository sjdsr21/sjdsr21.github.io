// Ocho intercambios recientes, con un límite total para mantener las consultas acotadas.
export const HISTORY_LIMIT=16;
const ITEM_LIMIT=1600,CHAR_BUDGET=12000;
export function conversationContext(history){
 if(!Array.isArray(history))return [];
 const recent=history.slice(-HISTORY_LIMIT).filter(m=>m&&['user','assistant'].includes(m.role)&&typeof m.content==='string');
 const result=[];let remaining=CHAR_BUDGET;
 for(let i=recent.length-1;i>=0&&remaining>0;i--){
  const content=recent[i].content.slice(0,Math.min(ITEM_LIMIT,remaining));
  result.unshift({role:recent[i].role,content});remaining-=content.length;
 }
 return result;
}
