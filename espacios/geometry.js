export const ROOMS = [
 {id:'small',name:'Pequeño',width:3,depth:3,area:9},
 {id:'square',name:'Cuadrado',width:4,depth:4,area:16},
 {id:'rectangle',name:'Rectangular',width:3,depth:5,area:15},
 {id:'large',name:'Grande',width:5,depth:6,area:30},
 {id:'l',name:'En L',width:5,depth:5,area:21,notch:.5}
];
export const snap = v => Math.round(v * 10) / 10;
export function roomById(id) { return ROOMS.find(r=>r.id===id); }
export function polygon(r) {
 const x=r.width/2,z=r.depth/2;
 return r.notch===undefined?[[-x,-z],[x,-z],[x,z],[-x,z]]:[[-x,-z],[x,-z],[x,r.notch],[r.notch,r.notch],[r.notch,z],[-x,z]];
}
export function footprint(item,def) {
 const odd=item.rotation%2===1, w=odd?def.depth:def.width, d=odd?def.width:def.depth;
 return {x0:item.x-w/2,x1:item.x+w/2,z0:item.z-d/2,z1:item.z+d/2,y0:def.lift||0,y1:(def.lift||0)+def.height};
}
export function insideRoom(box,r) {
 const eps=1e-5;
 if(box.x0 < -r.width/2-eps || box.x1 > r.width/2+eps || box.z0 < -r.depth/2-eps || box.z1 > r.depth/2+eps) return false;
 if(r.notch!==undefined && box.x1 > r.notch+eps && box.z1 > r.notch+eps) return false;
 return true;
}
export function overlap(a,b) {
 const gap=.005;
 return a.x0 < b.x1-gap && a.x1 > b.x0+gap && a.z0 < b.z1-gap && a.z1 > b.z0+gap && a.y0 < b.y1-gap && a.y1 > b.y0+gap;
}
export function legal(item,items,r,defs) {
 const def=defs.get(item.type); if(!def)return false;
 const box=footprint(item,def);
 return insideRoom(box,r) && !items.some(other=>other.id!==item.id && overlap(box,footprint(other,defs.get(other.type))));
}
export function findPosition(item,items,r,defs,origin={x:0,z:0}) {
 const candidates=[];
 for(let x=-r.width/2;x<=r.width/2+.001;x+=.1)for(let z=-r.depth/2;z<=r.depth/2+.001;z+=.1){
  const p={...item,x:snap(x),z:snap(z)}; candidates.push({p,d:(p.x-origin.x)**2+(p.z-origin.z)**2});
 }
 candidates.sort((a,b)=>a.d-b.d);
 return candidates.find(c=>legal(c.p,items,r,defs))?.p || null;
}
export function validateDesign(raw,defs,finishes) {
 if(!raw||raw.schema!=='ago-space-demo-v1'||!roomById(raw.room)||!Array.isArray(raw.items)||raw.items.length>60)throw Error('El archivo no es un espacio válido de esta demo.');
 if(typeof raw.title!=='string'||raw.title.length>60)throw Error('El nombre del espacio no es válido.');
 if(!finishes.has(raw.floor)||!finishes.has(raw.wall))throw Error('El archivo incluye un acabado que no está en esta demo.');
 const items=[], ids=new Set();
 for(const item of raw.items){
  if(!item||!defs.has(item.type)||typeof item.id!=='string'||item.id.length>80||ids.has(item.id)||!Number.isFinite(item.x)||!Number.isFinite(item.z)||Math.abs(item.x)>20||Math.abs(item.z)>20||!Number.isInteger(item.rotation)||item.rotation<0||item.rotation>3)throw Error('El archivo incluye un mueble o posición no válidos.');
  const def=defs.get(item.type),clean={id:item.id,type:item.type,x:snap(item.x),z:snap(item.z),rotation:item.rotation,finishes:{}};
  for(const [zone,finish] of Object.entries(item.finishes||{})){
   if(!def.zones.includes(zone)||!finishes.has(finish))throw Error('El archivo incluye una combinación de acabado no válida.');
   clean.finishes[zone]=finish;
  }
  if(!legal(clean,items,roomById(raw.room),defs))throw Error('Hay muebles superpuestos o fuera de la sala en ese archivo.');
  items.push(clean);ids.add(item.id);
 }
 return {schema:'ago-space-demo-v1',room:raw.room,title:raw.title,floor:raw.floor,wall:raw.wall,items};
}
