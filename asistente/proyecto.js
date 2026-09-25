export const CAMPOS={tipo:'Pieza',uso:'Uso',ubicacion:'Ubicación',medidas:'Medidas',capacidad:'Capacidad deseada',materiales:'Materiales',estilo:'Estilo y acabado',instalacion:'Instalación',entrega:'Entrega',fecha:'Fecha deseada',presupuesto:'Presupuesto orientativo'};
const text=(value,max)=>typeof value==='string'?value.trim().slice(0,max):'';
export function cleanProject(value){
 const result={datos:{},pendientes:[],referencia_visual:''};
 for(const campo of Object.keys(CAMPOS)){
  const item=value?.datos?.[campo];
  if(item&&text(item.valor,400)&&text(item.evidencia,300))result.datos[campo]={valor:text(item.valor,400),evidencia:text(item.evidencia,300)};
 }
 result.pendientes=Array.isArray(value?.pendientes)?value.pendientes.map(v=>text(v,160)).filter(Boolean).slice(0,6):[];
 result.referencia_visual=text(value?.referencia_visual,800);return result;
}
export function updateProject(previous,changes,message,pending,visual=''){
 const result=cleanProject(previous);
 for(const change of (Array.isArray(changes)?changes:[]).slice(0,16)){
  const evidence=text(change?.evidencia,300);
  if(!Object.hasOwn(CAMPOS,change?.campo)||!evidence||!message.includes(evidence))continue;
  const value=text(change.valor,400);
  if(value)result.datos[change.campo]={valor:value,evidencia:evidence};else delete result.datos[change.campo];
 }
 if(Array.isArray(pending))result.pendientes=cleanProject({pendientes:pending}).pendientes;
 if(visual)result.referencia_visual=text(visual,800);
 return result;
}
export function projectText(project){
 const p=cleanProject(project);
 return Object.entries(p.datos).map(([key,item])=>CAMPOS[key]+': '+item.valor).join('\n')+
  (p.pendientes.length?'\nPor definir: '+p.pendientes.join('; '):'')+
  (p.referencia_visual?'\nReferencia visual (por confirmar): '+p.referencia_visual:'');
}
