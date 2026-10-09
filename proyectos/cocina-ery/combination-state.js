import {allowsFinish} from './finish-zones.js?v=20261009-panel';
export const ZONES=['cabinet','upperDoors','counter','table','pantry','base','wall','floor','plinth'];
export const STORAGE_KEY='prototipoago.cocina-ery.v2';
const LEGACY_STORAGE_KEY='prototipoago.cocina-ery.v1';
const clone=value=>JSON.parse(JSON.stringify(value));
export function copySurfaceFinish(selection,tones,source='counter'){
  const target=source==='counter'?'table':'counter';selection[target]=selection[source];
  delete tones[target];if(tones[source])tones[target]={...tones[source]};
}
const number=(n,min,max)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
export function validateCombination(value,palette){
  if(!value||value.version!==1||!value.selection||!value.matches||!value.view)throw Error('Esta combinación no es compatible.');
  const result={version:1,selection:{},matches:{},tones:{},view:{}};
  for(const z of ZONES){
    const legacyUpper=z==='upperDoors'&&!Object.hasOwn(value.selection,'upperDoors');
    const legacySurface=['wall','floor','plinth'].includes(z)&&!Object.hasOwn(value.selection,z);
    const id=legacyUpper?value.selection.cabinet:legacySurface?null:value.selection[z],finish=palette.find(f=>f.id===id);
    if(id!==null&&id!=='custom'&&!finish)throw Error('Un acabado del enlace no está disponible.');
    if(!allowsFinish(z,id==='custom'?{id}:finish))throw Error('El acabado no corresponde a esa zona.');
    result.selection[z]=id;
    const t=value.tones?.[legacyUpper?'cabinet':z];
    if(t){
      if(!number(t.h,0,360)||!number(t.s,0,100)||!number(t.v,0,100)||typeof t.enabled!=='boolean')throw Error('El color guardado no es válido.');
      result.tones[z]={h:t.h,s:t.s,v:t.v,enabled:t.enabled};
    }else if(id==='custom')throw Error('Falta el color personalizado.');
  }
  for(const k of ['pantry','upper']){if(typeof value.matches[k]!=='boolean')throw Error('Faltan las opciones de unificación.');result.matches[k]=value.matches[k];}
  if(value.matches.surfaces!==undefined&&typeof value.matches.surfaces!=='boolean')throw Error('La unificación de superficies no es válida.');
  result.matches.surfaces=value.matches.surfaces??false;
  if(result.matches.surfaces){
    const finish=palette.find(f=>f.id===result.selection.counter);
    if(finish?.zones&&!finish.zones.includes('table'))throw Error('Ese acabado no permite unificar la mesa.');
    copySurfaceFinish(result.selection,result.tones);
  }
  for(const k of ['shadows','edges','profiles']){if(typeof value.view[k]!=='boolean')throw Error('Faltan las opciones de visualización.');result.view[k]=value.view[k];}
  if(value.camera){
    const c=value.camera;
    if(![c.eye,c.target].every(v=>Array.isArray(v)&&v.length===3&&v.every(n=>number(n,-100,100))))throw Error('La vista del enlace no es válida.');
    const distance=Math.hypot(...c.eye.map((n,i)=>n-c.target[i]));if(distance<.1||distance>30)throw Error('La vista está fuera de alcance.');
    result.camera={eye:[...c.eye],target:[...c.target]};
  }
  return result;
}
export function encodeCombination(state){return btoa(JSON.stringify(state)).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');}
export function decodeCombination(text,palette){
  if(typeof text!=='string'||text.length>12000||!/^[A-Za-z0-9_-]+$/.test(text))throw Error('El enlace de combinación está incompleto.');
  try{return validateCombination(JSON.parse(atob(text.replaceAll('-','+').replaceAll('_','/'))),palette);}catch(error){throw Error('No se pudo abrir la combinación. '+error.message);}
}
// History contains appearance only. Orbiting the camera never changes undo/redo.
export function createHistory(initial,limit=60){
  let states=[clone(initial)],index=0,lastGroup=null;
  return {
    record(next,group=null){
      if(JSON.stringify(states[index])===JSON.stringify(next))return false;
      if(group&&group===lastGroup&&index>0&&index===states.length-1)states[index]=clone(next);
      else{states=states.slice(0,index+1);states.push(clone(next));if(states.length>limit)states.shift();index=states.length-1;}
      lastGroup=group;return true;
    },
    endGroup(){lastGroup=null;},
    undo(){lastGroup=null;return index>0?clone(states[--index]):null;},
    redo(){lastGroup=null;return index<states.length-1?clone(states[++index]):null;},
    get canUndo(){return index>0;},get canRedo(){return index<states.length-1;}
  };
}
export function loadNotebook(palette,storage){
  const empty={current:null,saved:[],favorites:[],available:true};
  try{
    // Old open tabs can still write v1; they must not overwrite named saves.
    const raw=storage.getItem(STORAGE_KEY)??storage.getItem(LEGACY_STORAGE_KEY);if(!raw)return empty;
    if(raw.length>1000000)return empty;const data=JSON.parse(raw);if(data.version!==1)return empty;
    const safe=value=>{try{return validateCombination(value,palette);}catch{return null;}};
    empty.current=safe(data.current);
    const entries=Array.isArray(data.saved)?data.saved:[0,1,2].map(i=>({...data.options?.[i],name:'Opción '+'ABC'[i]}));
    const names=new Set();
    empty.saved=entries.flatMap(item=>{
      const state=safe(item?.state),name=typeof item?.name==='string'?item.name.trim().slice(0,60):'';
      if(!state||!name||names.has(name))return [];names.add(name);return [{name,state}];
    });
    empty.favorites=Array.isArray(data.favorites)?[...new Set(data.favorites.filter(id=>palette.some(p=>p.id===id)))].slice(0,400):[];
    return empty;
  }catch{return {...empty,available:false};}
}
