import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import {SilhouettePass} from './silhouette-pass.js?v=20261009-materiales';
import {connectProfiles,applyRenderProfile} from './material-profile.js?v=20261009-materiales';
import {allowsFinish,surfaceRegion,changesTogether} from './finish-zones.js?v=20261009-panel';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import {createColorWheel,hsvHex,hexHsv} from './color-tools.js';
import {createViewOptions} from './view-options.js';
import {downloadView} from './capture.js';
import {createWorkflow} from './workflow.js?v=20261009-panel';
import {createModelInteraction} from './model-interaction.js?v=20261009-materiales';
import {filterCatalog} from './catalog.js?v=20261009-panel';
import {counterPart,resolveCounterFinish,counterWoodBand,ceramicUV,isCeramicFloor} from './countertop.js';
import {createTheme} from './theme.js?v=20261009-panel';
import {copySurfaceFinish,validateCombination} from './combination-state.js?v=20261009-panel';
const $=id=>document.getElementById(id);
const labels={cabinet:'Modulares inferiores',upperDoors:'Puertas superiores',counter:'Tope de cocina',table:'Mesa auxiliar',pantry:'Despensa',base:'Fórmica existente · color base',wall:'Pintura de la pared',floor:'Piso',plinth:'Zócalo'};
const originalColors={cabinet:'#aaa599',upperDoors:'#e3cfbe',counter:'#994c00',table:'#994c00',pantry:'#c46100',base:'#ffe4ca',wall:'#ffe4ca',floor:'#b07e51',plinth:'#bfc3c7'};
const selection={cabinet:null,upperDoors:null,counter:'greenlam-sanganer',table:'greenlam-sanganer',pantry:null,base:null,wall:null,floor:null,plinth:null};
const matches={pantry:false,upper:false,surfaces:false};
function syncSurfaces(source){if(matches.surfaces&&['counter','table'].includes(source))copySurfaceFinish(selection,tones,source);}
function canUnify(finish){return !finish?.zones||['counter','table'].every(z=>finish.zones.includes(z));}
const tones={},editorOpen={};let viewOptions,workflow,interaction,theme;
let sampling=false,copiedFinish=null,defaultCombination;
let pickTimer;const filters={query:'',tone:'all',detail:'all',favoritesOnly:false};
const textureReady=new Map();
let zone='cabinet',category='neutral',palette=[],scene,camera,renderer,composer,controls,config,model,initial,ready=false;
const meshes=[],textureCache=new Map();
let renderFrames=0,framePending=false;
function announce(text){$('announcement').textContent=text;}
function requestRender(){renderFrames=3;if(!framePending){framePending=true;requestAnimationFrame(frame);}}
function frame(){framePending=false;if(!ready)return;const changed=controls.update();viewOptions.update();composer.render();if(!framePending&&(changed||--renderFrames>0)){framePending=true;requestAnimationFrame(frame);}}
function selectedZone(mesh){const r=mesh.userData.region;if(r==='upper')return matches.upper?'upperDoors':'base';if(r==='pantryExisting')return matches.pantry?'pantry':'base';return labels[r]?r:null;}
function finishFor(z){return selection[z]==='custom'?{id:'custom',name:'Color personalizado',color:hsvHex(tones[z])}:palette.find(p=>p.id===selection[z]);}
function textureFor(finish){
  if(!textureCache.has(finish.id)){
    let done;textureReady.set(finish.id,new Promise(resolve=>done=resolve));
    const t=new THREE.TextureLoader().load(finish.texture,()=>{done(true);requestRender();},undefined,()=>{done(false);announce('No se pudo cargar esa textura. Prueba otro acabado.');});
    t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());textureCache.set(finish.id,t);
  }
  return textureCache.get(finish.id);
}
function enableTint(material,finish,band=null){
  const uniforms={eriTintEnabled:{value:0},eriTint:{value:new THREE.Vector3(0,0,1)}};
  material.userData.tintUniforms=uniforms;
  material.userData.woodBand=band?{width:band.width,finish:band.finish.id}:null;
  if(band)Object.assign(uniforms,{
    eriWoodMap:{value:textureFor(band.finish)},
    eriWoodSize:{value:new THREE.Vector2(...band.finish.size)},
    eriBand:{value:new THREE.Vector3(band.origin.left,band.origin.front,band.width)}
  });
  material.onBeforeCompile=shader=>{
    Object.assign(shader.uniforms,uniforms);
    if(band){
      shader.vertexShader='varying vec3 eriSurfacePosition;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\neriSurfacePosition=position;');
      shader.fragmentShader='varying vec3 eriSurfacePosition;\nuniform sampler2D eriWoodMap;\nuniform vec2 eriWoodSize;\nuniform vec3 eriBand;\n'+shader.fragmentShader;
    }
    shader.fragmentShader=shader.fragmentShader.replace('void main() {',`uniform float eriTintEnabled;
      uniform vec3 eriTint;
      vec3 eriHSV(vec3 c){vec3 p=abs(fract(c.xxx+vec3(0.,2./3.,1./3.))*6.-3.);return c.z*mix(vec3(1.),clamp(p-1.,0.,1.),c.y);}
      void main() {`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
      ${finish.mapping==='terracotta'?`// Complete the half-grout at the repeat boundary of the generated tile map.
      vec2 tileUV=fract(vMapUv);
      float seamAA=max(fwidth(vMapUv.y),.0001);
      float seamCoverage=1.-smoothstep(.0025-seamAA*.5,.0025+seamAA*.5,min(tileUV.y,1.-tileUV.y));
      if(mod(floor(tileUV.x*4.),2.)<.5)
        diffuseColor.rgb=mix(diffuseColor.rgb,sRGBTransferEOTF(vec4(.86,.84,.80,1.)).rgb,seamCoverage);`:''}
      if(eriTintEnabled>0.5){
        vec3 source=sRGBTransferOETF(vec4(diffuseColor.rgb,1.)).rgb;
        float value=max(source.r,max(source.g,source.b));
        diffuseColor.rgb=sRGBTransferEOTF(vec4(eriHSV(vec3(eriTint.xy,value*eriTint.z)),1.)).rgb;
        }
        ${band?`// These meshes have baked model coordinates in metres. Front and left
        // strips meet with a mitre; no band crosses the cooker gap or the back bridge.
        float fromLeft=eriSurfacePosition.x-eriBand.x;
        float fromFront=eriBand.y-eriSurfacePosition.z;
        float bandDistance=min(fromLeft,fromFront);
        float bandAA=max(fwidth(bandDistance),.00001);
        float woodCoverage=1.-smoothstep(eriBand.z-bandAA*.5,eriBand.z+bandAA*.5,bandDistance);
        vec2 woodUV=fromFront<=fromLeft?vec2(eriSurfacePosition.x,-eriSurfacePosition.z):vec2(-eriSurfacePosition.z,eriSurfacePosition.x);
        // SRGBColorSpace textures are decoded by the GPU, as for the main map.
        vec3 woodColor=texture2D(eriWoodMap,woodUV/eriWoodSize).rgb;
        diffuseColor.rgb=mix(diffuseColor.rgb,woodColor,woodCoverage);`:''}`);
  };
  material.customProgramCacheKey=()=> 'eri-texture-tint-v3-'+(finish.mapping||'plain')+(band?'-wood-band':'');
}
function projectTexture(mesh,finish){
  const p=mesh.geometry.attributes.position,n=mesh.geometry.attributes.normal,uv=new Float32Array(p.count*2),sx=finish.size[0],sy=finish.size[1];
  for(let i=0;i<p.count;i++){
    const nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i)),nz=Math.abs(n.getZ(i));
    if(finish.family==='Cerámica'){uv.set(ceramicUV(p.getX(i),p.getY(i),p.getZ(i),nx,ny,nz,finish.size,mesh.userData.isFloor?config.floor.origin:config.counterOrigin),i*2);continue;}
    if(ny>=nx&&ny>=nz){uv[i*2]=p.getX(i)/sx;uv[i*2+1]=-p.getZ(i)/sy;}
    else if(nx>=nz){uv[i*2]=-p.getZ(i)/sx;uv[i*2+1]=p.getY(i)/sy;}
    else{uv[i*2]=p.getX(i)/sx;uv[i*2+1]=p.getY(i)/sy;}
  }
  mesh.geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));
}
function applyMaterials(){
  if(!ready)return;
  interaction?.clear();
  for(const mesh of meshes){
    const z=selectedZone(mesh),chosen=z?finishFor(z):null,finish=resolveCounterFinish(mesh,chosen,palette);
    const linked=z!=='base'&&(mesh.userData.region==='upper'||mesh.userData.region==='pantryExisting');
    const key=chosen?chosen.id:linked?'linked-original-'+z:'original';
    if(mesh.userData.applied!==key){
      mesh.userData.applied=key;
      mesh.userData.materialFinish=finish?.id||null;
      if(mesh.material!==mesh.userData.original)mesh.material.dispose();
      if(!finish&&!linked){mesh.material=mesh.userData.original;mesh.geometry.setAttribute('uv',mesh.userData.originalUV.clone());continue;}
      mesh.material=mesh.userData.original.clone();mesh.material.map=null;mesh.material.color.set(finish?.color||originalColors[z]);
      mesh.material.metalness=finish?.metalness??(finish?.family==='Metal'?.4:0);
      mesh.material.roughness=finish?.roughness??(finish?.family==='Metal'?.32:.62);
      if(finish?.texture){mesh.material.map=textureFor(finish);mesh.material.color.set(0xffffff);projectTexture(mesh,finish);mesh.material.roughness=finish.roughness??(finish.family==='Metal'?.32:finish.family==='Cerámica'?.82:.62);enableTint(mesh.material,finish,counterWoodBand(mesh,chosen,palette,config));}
      else mesh.geometry.setAttribute('uv',mesh.userData.originalUV.clone());
      applyRenderProfile(mesh.material,finish);
      mesh.material.needsUpdate=true;
    }
    if(finish?.id==='custom')mesh.material.color.set(finish.color);
    if(finish?.texture){
      const u=mesh.material.userData.tintUniforms,t=finish===chosen?tones[z]:null;u.eriTintEnabled.value=t?.enabled?1:0;
      u.eriTint.value.set((t?.h||0)/360,(t?.s||0)/100,(t?.v??100)/100);
    }
  }
  requestRender();
}
function paintEditor(){
  const f=finishFor(zone),custom=f?.id==='custom',texture=!!f?.texture;
  $('tone-tools').hidden=!texture;$('reset-tone').hidden=!tones[zone]?.enabled;
  $('color-editor').hidden=!(custom||(texture&&editorOpen[zone]));
  $('edit-tone').setAttribute('aria-expanded',String(!$('color-editor').hidden));
  $('color-editor-title').textContent=custom?'Color personalizado':'Tono de la textura';
  $('tone-note').textContent=custom?'Arrastra por la rueda o ajusta los controles.':f?.trimFinish?'El ajuste cambia el tono de la cerámica; la madera conserva su color natural.':'El color tiñe el dibujo de la textura. Usa «Restaurar tono» para recuperar sus colores originales.';
  if(tones[zone])wheel.render(tones[zone]);
}
function revealEditor(){
  const mobile=matchMedia('(max-width:800px)').matches;
  openPanel();
  $('color-editor').scrollIntoView({behavior:'instant',block:mobile?'start':'nearest'});
}
const wheel=createColorWheel(value=>{
  if(!ready)return;tones[zone]={...value,enabled:true};syncSurfaces(zone);applyMaterials();updateLabels();paintEditor();workflow?.changed('color-'+zone);
});
function paintPalette(){
  const container=$('palette');container.replaceChildren();const surfaces=['counter','table'].includes(zone);
  const categories=zone==='plinth'?['textured']:zone==='wall'?['neutral','color']:['neutral','color','stone','textured'];
  for(const button of document.querySelectorAll('[data-palette]'))button.hidden=!categories.includes(button.dataset.palette);
  if(!categories.includes(category))category=categories[0];
  container.classList.toggle('textures',['stone','textured'].includes(category));
  document.querySelectorAll('[data-palette]').forEach(b=>{const active=b.dataset.palette===category;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  const details=category==='stone'?[['all','Todos los dibujos'],['Referencias Ery','Fotos de referencia Ery'],['suave','Piedras suaves'],['veteado','Veteadas'],['granulado','Granuladas']]:category==='textured'?[['all','Todas las familias'],...['Laminado Greenlam','Colores provisionales','Cerámica','Madera','Concreto','Tejido','Metal','Cuero'].filter(family=>palette.some(f=>f.family===family&&allowsFinish(zone,f))).map(family=>[family,family])]:[];
  $('filter-detail').hidden=!details.length;
  if(!details.some(d=>d[0]===filters.detail))filters.detail='all';
  $('filter-detail').replaceChildren(...details.map(([value,label])=>{const option=document.createElement('option');option.value=value;option.textContent=label;return option;}));
  $('filter-detail').value=filters.detail;
  const options=filterCatalog(palette,{...filters,category,zone,favorites:workflow?.favorites||[]}).filter(f=>!matches.surfaces||!surfaces||canUnify(f));
  $('catalog-empty').hidden=options.length>0;
  if(['neutral','color'].includes(category)&&!filters.favoritesOnly&&!filters.query){
    const b=document.createElement('button');b.className='swatch custom-swatch';b.dataset.finish='custom';b.title='Elegir color personalizado';b.setAttribute('aria-label','Elegir color personalizado');b.innerHTML='<span class="wheel-icon" aria-hidden="true"></span>';
    b.addEventListener('click',()=>{setFinish(zone,'custom');revealEditor();});container.append(b);
  }
  for(const finish of options){
    const b=document.createElement('button');b.className='swatch'+(finish.texture||finish.family==='Metal'?' texture '+finish.category:'');b.style.setProperty('--swatch',finish.color);
    if(finish.texture||finish.family==='Metal'){
      const sample=document.createElement('span');sample.className='sample';if(finish.texture)sample.style.backgroundImage=`url("${finish.texture}")`;else sample.style.background=`linear-gradient(125deg,${finish.color},${finish.color} 45%,#ffffff55 50%,${finish.color} 60%)`;sample.setAttribute('aria-hidden','true');
      const name=document.createElement('span');name.className='sample-name';name.textContent=finish.name;b.append(sample,name);
      if(finish.trimFinish){const trim=palette.find(p=>p.id===finish.trimFinish);const strip=document.createElement('span');strip.className='trim-sample';strip.style.backgroundImage=`url("${trim.texture}")`;sample.append(strip);}
    }
    b.title=finish.name;b.setAttribute('aria-label',finish.name);b.setAttribute('aria-pressed',String(selection[zone]===finish.id));b.dataset.finish=finish.id;
    b.addEventListener('click',()=>setFinish(zone,finish.id));container.append(b);
  }
  updateLabels();paintEditor();
}
function updateLabels(){
  $('surface-link-note').textContent=canUnify(finishFor('counter'))?'Al activarla, la mesa toma el acabado del tope. Después, ambos cambian juntos.':'Este acabado es exclusivo del tope. Elige otro para unificarlos.';
  $('table-link-label').textContent=matches.surfaces?'Vinculado al tope de cocina':'Un acabado independiente';
  const current=finishFor(zone),favorite=!!current&&(workflow?.favorites||[]).includes(current.id);
  $('favorite-finish').disabled=!current||current.id==='custom';$('favorite-finish').textContent=favorite?'★ Acabado favorito':'☆ Guardar acabado';$('favorite-finish').setAttribute('aria-pressed',String(favorite));
  $('favorite-finish').title=current?.id==='custom'?'Guarda este color libre en una combinación.':'';
  $('palette-title').textContent=labels[zone];$('chosen-name').textContent=(finishFor(zone)?.name||'Acabado original')+(tones[zone]?.enabled&&finishFor(zone)?.texture?' · tono personalizado':'');
  $('finish-description').hidden=!current?.description;$('finish-description').textContent=current?.description||'';
  for(const b of document.querySelectorAll('[data-zone]')){
    const active=b.dataset.zone===zone;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));
    const f=finishFor(b.dataset.zone),dot=b.querySelector('.preview-dot');dot.style.setProperty('--swatch',f?.color||originalColors[b.dataset.zone]);dot.style.backgroundImage=f?.texture?`url("${f.texture}")`:'';
  }
  document.querySelectorAll('[data-finish]').forEach(b=>b.setAttribute('aria-pressed',String(selection[zone]===b.dataset.finish)));
  const linked=[];if(matches.upper)linked.push('los gabinetes superiores');if(matches.pantry)linked.push('la despensa');
  $('base-note').hidden=zone!=='base';
  $('base-note').textContent=linked.length?`«Unificar» está activo para ${linked.join(' y ')}. Desmarca esa casilla para ver allí el color base.`:'Cambia el color de los cuerpos existentes de los gabinetes superiores y la despensa.';
}
function setFinish(z,id,copiedTone){
  if(!Object.hasOwn(labels,z))throw new Error('Zona desconocida');const f=id===null||id==='custom'?null:palette.find(p=>p.id===id);
  if(id!==null&&id!=='custom'&&!f)throw new Error('Acabado desconocido');if(!allowsFinish(z,id==='custom'?{id}:f))throw new Error(z==='wall'?'La pintura de la pared admite colores lisos.':z==='plinth'?'El zócalo admite maderas y acabados metálicos.':'Este acabado no está disponible para esta zona.');
  if(matches.surfaces&&['counter','table'].includes(z)&&!canUnify(f))throw new Error('Desmarca la unificación para usar un acabado exclusivo del tope.');
  if(selection[z]!==id){
    tones[z]={...hexHsv(f?.color||finishFor(z)?.color||originalColors[z]),enabled:false};
    if(f?.texture)tones[z].v=100;
    editorOpen[z]=false;
  }
  if(copiedTone!==undefined){
    tones[z]=copiedTone?{...copiedTone}:{...hexHsv(f?.color||originalColors[z]),enabled:false};
    if(f?.texture&&!copiedTone)tones[z].v=100;
  }
  selection[z]=id;syncSurfaces(z);applyMaterials();updateLabels();paintEditor();workflow?.changed();announce(`${labels[z]}: ${finishFor(z)?.name||'acabado original'}`);return readState();
}
function setMatches(pantry,upper,surfaces=matches.surfaces){
  if(typeof surfaces!=='boolean')throw new Error('La casilla requiere un valor booleano.');
  if(surfaces&&!canUnify(finishFor('counter'))){
    $('match-surfaces').checked=matches.surfaces;
    $('surface-link-note').textContent='Este acabado es exclusivo del tope. Elige otro para unificarlos.';
    announce($('surface-link-note').textContent);return readState();
  }
  matches.surfaces=surfaces;syncSurfaces('counter');$('match-surfaces').checked=surfaces;
  $('surface-link-note').textContent='Al activarla, la mesa toma el acabado del tope. Después, ambos cambian juntos.';
  if(typeof pantry!=='boolean'||typeof upper!=='boolean')throw new Error('Las casillas requieren valores booleanos.');
  matches.pantry=pantry;matches.upper=upper;$('match-pantry').checked=pantry;$('match-upper').checked=upper;applyMaterials();paintPalette();workflow?.changed();return readState();
}
function samplerMessage(text){$('sampler-note').textContent=text;announce(text);}
async function paintCopiedSample(finish,tone,entry){
  const sample=$('copied-finish').querySelector('.copied-sample');sample.style.backgroundColor=finish.color;
  sample.style.backgroundImage=finish.texture?`url("${finish.texture}")`:'';
  if(!finish.texture||!tone?.enabled)return;
  const texture=textureFor(finish);await textureReady.get(finish.id);if(copiedFinish!==entry||!texture.image)return;
  const canvas=document.createElement('canvas');canvas.width=96;canvas.height=96;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(texture.image,0,0,96,96);
  const pixels=ctx.getImageData(0,0,96,96),target=hsvHex({...tone,v:100}).slice(1).match(/../g).map(c=>parseInt(c,16));
  for(let i=0;i<pixels.data.length;i+=4){const v=Math.max(pixels.data[i],pixels.data[i+1],pixels.data[i+2])/255*tone.v/100;for(let c=0;c<3;c++)pixels.data[i+c]=target[c]*v;}
  ctx.putImageData(pixels,0,0);sample.style.backgroundImage=`url("${canvas.toDataURL()}")`;
}
function setSampling(enabled){
  sampling=enabled;$('eyedropper').setAttribute('aria-pressed',String(enabled));interaction?.clear();
  samplerMessage(enabled?'Selecciona en el modelo el acabado que quieres copiar. Esc para cancelar.':copiedFinish?'Selecciona otra pieza y pulsa la muestra para aplicar el acabado.':'Copia un acabado con el cuentagotas y aplícalo a otra pieza.');
}
function copyFinish(source){
  if(!Object.hasOwn(labels,source))throw Error('Zona desconocida.');
  const id=selection[source]||(source==='floor'?'eri-floor-terracotta':source==='plinth'?'plinth-silver':'custom');
  const tone=selection[source]?tones[source]:id==='custom'?{...hexHsv(originalColors[source]),enabled:true}:null;
  const finish=id==='custom'?{id,name:'Color personalizado',color:hsvHex(tone)}:palette.find(f=>f.id===id);
  copiedFinish={id,tone:tone?{...tone}:null,name:finish.name+(tone?.enabled&&finish.texture?' · tono personalizado':''),source};
  paintCopiedSample(finish,tone,copiedFinish).catch(()=>{});
  $('copied-finish').disabled=false;$('copied-name').textContent=copiedFinish.name;
  $('copied-finish').setAttribute('aria-label','Aplicar acabado copiado: '+copiedFinish.name);
  setSampling(false);samplerMessage('Acabado copiado. Selecciona otra pieza y pulsa la muestra para aplicarlo.');return readState();
}
function applyCopiedFinish(){
  if(!copiedFinish)throw Error('Primero copia un acabado con el cuentagotas.');
  setFinish(zone,copiedFinish.id,copiedFinish.tone);paintPalette();interaction.highlight(zone);
  samplerMessage('Acabado aplicado a '+labels[zone].toLowerCase()+'.');return readState();
}
function readState(){return {selection:{...selection},matches:{...matches},tones:structuredClone(tones),view:{...viewOptions?.state},zone,copiedFinish:copiedFinish?structuredClone(copiedFinish):null};}
function appearance(){return {version:1,selection:{...selection},matches:{...matches},tones:structuredClone(tones),view:{...viewOptions.state}};}
function snapshot(){return {...appearance(),camera:{eye:camera.position.toArray(),target:controls.target.toArray()}};}
function applyCombination(value,{camera:restoreCamera=false}={}){
  for(const z of Object.keys(selection)){selection[z]=value.selection[z];delete tones[z];if(value.tones[z])tones[z]={...value.tones[z]};editorOpen[z]=false;}
  Object.assign(matches,value.matches);matches.surfaces=value.matches.surfaces??false;syncSurfaces('counter');$('match-surfaces').checked=matches.surfaces;$('match-pantry').checked=matches.pantry;$('match-upper').checked=matches.upper;
  for(const name of ['shadows','edges','profiles']){if(viewOptions.state[name]!==value.view[name])viewOptions.set(name,value.view[name]);$('show-'+name).checked=value.view[name];}
  applyMaterials();paintPalette();
  if(restoreCamera&&value.camera){controls.enableDamping=false;controls.update();camera.position.fromArray(value.camera.eye);controls.target.fromArray(value.camera.target);controls.update();controls.enableDamping=true;}
  requestRender();
}
async function waitForTextures(){
  const active=[...new Set(meshes.map(m=>m.userData.materialFinish).filter(id=>textureReady.has(id)))];
  if((await Promise.all(active.map(id=>textureReady.get(id)))).some(ok=>!ok))throw Error('Espera a que se carguen las texturas o elige otro acabado.');
}
function openPanel(){document.body.classList.remove('panel-collapsed');$('panel-toggle').setAttribute('aria-expanded','true');$('panel-toggle').innerHTML='Ocultar acabados <span aria-hidden="true">⌄</span>';}
function selectZone(next,fromModel=false){
  zone=next;filters.detail='all';paintPalette();
  if(fromModel){openPanel();$('palette-title').scrollIntoView({block:'start',behavior:'instant'});}
  interaction?.highlight(zone);$('picked-zone').textContent=labels[zone];$('picked-zone').hidden=false;clearTimeout(pickTimer);pickTimer=setTimeout(()=>$('picked-zone').hidden=true,1100);
}
function resetCamera(){if(!ready)return;controls.enableDamping=false;controls.update();camera.position.copy(initial.eye);controls.target.copy(initial.target);camera.up.set(0,1,0);camera.zoom=1;resize();controls.update();controls.enableDamping=true;requestRender();workflow?.persist();}
function resize(){
  if(!renderer)return;const w=$('viewer').clientWidth,h=$('viewer').clientHeight,a=w/h;
  camera.aspect=a;camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(initial.fov/2))*Math.max(1,config.camera.aspect/a)));
  camera.updateProjectionMatrix();renderer.setSize(w,h);composer.setSize(w,h);requestRender();
}
function registerTools(){
  const context=document.modelContext;if(!context?.registerTool)return;const lifecycle=new AbortController();window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
  const definitions=[
    {name:'read_kitchen_finishes',title:'Consultar acabados',description:'Consultar las selecciones, colores, piedras y texturizados disponibles.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute:()=>({...readState(),finishes:palette.map(p=>({id:p.id,name:p.name,category:p.category}))})},
    {name:'set_kitchen_finish',title:'Cambiar acabado',description:'Cambiar el acabado de una zona de la cocina en la vista 3D.',inputSchema:{type:'object',properties:{zone:{type:'string',enum:Object.keys(labels)},finishId:{type:['string','null']}},required:['zone','finishId'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:input=>{if(!ready)throw new Error('El modelo todavía se está cargando.');return setFinish(input.zone,input.finishId);}},
    {name:'set_kitchen_matching',title:'Unificar acabados',description:'Activar o desactivar la unificación de la despensa, los gabinetes superiores y los acabados del tope y la mesa auxiliar.',inputSchema:{type:'object',properties:{pantry:{type:'boolean'},upper:{type:'boolean'},surfaces:{type:'boolean',description:'Vincular los acabados del tope de cocina y la mesa auxiliar.'}},required:['pantry','upper'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:input=>{if(!ready)throw new Error('El modelo todavía se está cargando.');return setMatches(input.pantry,input.upper,input.surfaces??matches.surfaces);}}
    ,{name:'copy_kitchen_finish',title:'Copiar acabado con cuentagotas',description:'Tomar el acabado y el tono de una zona del modelo y guardarlos en la muestra del cuentagotas.',inputSchema:{type:'object',properties:{zone:{type:'string',enum:Object.keys(labels)}},required:['zone'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:input=>copyFinish(input.zone)}
    ,{name:'apply_copied_kitchen_finish',title:'Aplicar acabado copiado',description:'Aplicar la muestra del cuentagotas a la zona indicada.',inputSchema:{type:'object',properties:{zone:{type:'string',enum:Object.keys(labels)}},required:['zone'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:input=>{selectZone(input.zone);return applyCopiedFinish();}}
  ];
  for(const tool of definitions){try{Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}}
}
async function init(){
  try{
    document.querySelectorAll('aside button,aside input,aside select,#reset,#screenshot,#share').forEach(b=>b.disabled=true);
    [palette,config,defaultCombination]=await Promise.all(['palette','scene','default-combination'].map(async name=>{const response=await fetch(`assets/${name}.json?v=20261009-panel`);if(!response.ok)throw new Error('No se pudieron cargar los acabados.');return response.json();}));
    const profilesResponse=await fetch('assets/render-profiles.json?v=20261009-materiales');
    if(!profilesResponse.ok)throw new Error('No se pudieron cargar las propiedades de materiales.');
    connectProfiles(palette,await profilesResponse.json());
    defaultCombination=validateCombination(defaultCombination,palette);
    renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.NoToneMapping;renderer.shadowMap.enabled=false;
    renderer.domElement.setAttribute('aria-label','Cocina Ery en 3D. Arrastra para girar, usa dos dedos para desplazar y pellizca para acercar.');renderer.domElement.setAttribute('aria-describedby','gesture-help');renderer.domElement.setAttribute('tabindex','0');
    scene=new THREE.Scene();scene.background=new THREE.Color(0xffffff);camera=new THREE.PerspectiveCamera(35,1,.03,70);camera.up.set(0,1,0);
    scene.add(new THREE.HemisphereLight(0xffffff,0xb9b7b2,1.5));const key=new THREE.DirectionalLight(0xffffff,1.05);key.position.set(4,7,5);scene.add(key);const fill=new THREE.DirectionalLight(0xffffff,.3);fill.position.set(-5,3,-2);scene.add(fill);
    const loaded=await new GLTFLoader().loadAsync('assets/kitchen.glb?v=20261008-r10');model=loaded.scene;scene.add(model);
    model.traverse(mesh=>{
      if(!mesh.isMesh)return;mesh.castShadow=false;mesh.receiveShadow=false;
      mesh.userData.region=surfaceRegion({...mesh.parent?.userData,...mesh.userData},config);mesh.userData.counterPart=counterPart(mesh,config);
      mesh.userData.isFloor=mesh.userData.region==='floor'||isCeramicFloor(mesh,config);mesh.userData.materialFinish=null;
      if(mesh.userData.isFloor){
        const finish=palette.find(f=>f.id===config.floor.finishId);
        mesh.material=mesh.material.clone();mesh.material.map=textureFor(finish);mesh.material.color.set(0xffffff);mesh.material.roughness=.82;
        projectTexture(mesh,finish);enableTint(mesh.material,finish);mesh.userData.materialFinish=finish.id;
      }
      if(mesh.userData.region==='plinth'){mesh.material=mesh.material.clone();mesh.material.color.set(originalColors.plinth);mesh.material.roughness=.32;mesh.material.metalness=.4;}
      mesh.userData.original=mesh.material;mesh.userData.originalUV=mesh.geometry.attributes.uv.clone();mesh.userData.applied='original';meshes.push(mesh);
    });
    if(!meshes.some(m=>m.userData.isFloor))throw Error('No se encontró la superficie del piso.');
    await waitForTextures();
    const bounds=new THREE.Box3().setFromObject(model),center=bounds.getCenter(new THREE.Vector3()),eye=new THREE.Vector3().fromArray(config.camera.eye),target=new THREE.Vector3().fromArray(config.camera.target),direction=target.clone().sub(eye).normalize();
    target.copy(eye).addScaledVector(direction,center.clone().sub(eye).dot(direction));let fov=config.camera.fov;if(!config.camera.fov_is_height)fov=THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(fov/2))/config.camera.aspect));
    viewOptions=createViewOptions(scene,meshes,camera,renderer,key,bounds,requestRender);
    initial={eye,target,fov:fov*1.08};camera.position.copy(eye);camera.lookAt(target);
    controls=new OrbitControls(camera,renderer.domElement);controls.target.copy(target);controls.enableDamping=true;controls.dampingFactor=.12;controls.minDistance=.4;controls.maxDistance=14;controls.maxPolarAngle=Math.PI*.92;controls.zoomSpeed=.7;controls.panSpeed=.75;controls.addEventListener('change',requestRender);
    composer=new EffectComposer(renderer);composer.renderTarget1.samples=4;composer.renderTarget2.samples=4;composer.addPass(new RenderPass(scene,camera));const ao=new SSAOPass(scene,camera,640,640,24);ao.kernelRadius=.18;ao.minDistance=.001;ao.maxDistance=.09;composer.addPass(ao);const outline=new SilhouettePass(scene,camera);composer.addPass(outline);composer.addPass(new OutputPass());
    $('viewer').prepend(renderer.domElement);theme=createTheme(scene,requestRender);ready=true;resize();composer.render();$('reference').hidden=true;$('load-status').hidden=true;document.querySelectorAll('aside button,aside input,aside select,#reset,#screenshot,#share').forEach(b=>b.disabled=false);
    $('copied-finish').disabled=!copiedFinish;applyMaterials();
    interaction=createModelInteraction({scene,meshes,camera,canvas:renderer.domElement,selectedZone,onPick:z=>sampling?copyFinish(z):selectZone(z,true),requestRender,outline,related:(a,b)=>changesTogether(a,b,matches),isSampling:()=>sampling});
    workflow=createWorkflow({palette,snapshot,appearance,apply:applyCombination,defaultCombination,announce,onFavorites:()=>paintPalette()});workflow.restore();
    controls.addEventListener('start',()=>interaction.clear());controls.addEventListener('end',()=>workflow.persist());controls.addEventListener('change',()=>workflow.persist());
    paintPalette();registerTools();new ResizeObserver(resize).observe($('viewer'));
    renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();ready=false;$('reference').hidden=false;$('load-status').hidden=false;$('load-status').textContent='Se interrumpió la vista 3D. Recarga la página para continuar.';});
    renderer.domElement.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','Home'].includes(event.key))return;event.preventDefault();if(event.key==='Home')return resetCamera();if(event.key==='+'||event.key==='-'){zoom(event.key==='+'?.85:1.15);return;}const offset=camera.position.clone().sub(controls.target),sphere=new THREE.Spherical().setFromVector3(offset);if(event.key==='ArrowLeft')sphere.theta-=.1;if(event.key==='ArrowRight')sphere.theta+=.1;if(event.key==='ArrowUp')sphere.phi=Math.max(.1,sphere.phi-.1);if(event.key==='ArrowDown')sphere.phi=Math.min(Math.PI*.92,sphere.phi+.1);camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(sphere));controls.update();requestRender();});
    window.eriDiagnostics=()=>({ready,triangles:meshes.reduce((s,m)=>s+m.geometry.attributes.position.count/3,0),state:readState(),theme:theme.dark?'dark':'light',background:scene.background.getHexString(),camera:camera.position.toArray(),target:controls.target.toArray(),meshes:meshes.map(m=>({name:m.name,region:m.userData.region,counterPart:m.userData.counterPart,woodBand:m.material.userData.woodBand||null,isFloor:m.userData.isFloor,materialFinish:m.userData.materialFinish,finish:m.userData.applied,color:m.material.color.getHexString(),map:!!m.material.map,mapReady:!!m.material.map?.image?.width,tint:m.material.userData.tintUniforms?.eriTintEnabled.value||0})),view:viewOptions.diagnostics(),workflow:workflow.diagnostics(),highlight:{zone:interaction.highlighted,count:interaction.highlightedCount,method:"visible-silhouette-mask"},shadows:renderer.shadowMap.enabled,ao:ao.enabled,render:renderer.info.render,bounds:[bounds.min.toArray(),bounds.max.toArray()],projected:center.clone().project(camera).toArray()});
  }catch(error){console.error(error);$('load-status').textContent='No se pudo abrir la vista 3D. Recarga la página o usa un navegador actualizado.';$('reference').hidden=false;}
}
function zoom(factor){if(!ready)return;camera.position.sub(controls.target).multiplyScalar(factor).add(controls.target);controls.update();requestRender();}
document.querySelectorAll('[data-zone]').forEach(b=>b.addEventListener('click',()=>selectZone(b.dataset.zone)));document.querySelectorAll('[data-palette]').forEach(b=>b.addEventListener('click',()=>{category=b.dataset.palette;filters.detail='all';paintPalette();}));
$('original').addEventListener('click',()=>setFinish(zone,null));$('match-pantry').addEventListener('change',()=>setMatches($('match-pantry').checked,matches.upper));$('match-upper').addEventListener('change',()=>setMatches(matches.pantry,$('match-upper').checked));
$('match-surfaces').addEventListener('change',()=>setMatches(matches.pantry,matches.upper,$('match-surfaces').checked));
$('reset').addEventListener('click',()=>workflow?.resetDefault());
$('home').addEventListener('click',resetCamera);$('zoom-in').addEventListener('click',()=>zoom(.85));$('zoom-out').addEventListener('click',()=>zoom(1.15));
for(const mode of ['orbit','pan'])$(mode).addEventListener('click',()=>{if(!controls)return;controls.mouseButtons.LEFT=mode==='orbit'?THREE.MOUSE.ROTATE:THREE.MOUSE.PAN;controls.touches.ONE=mode==='orbit'?THREE.TOUCH.ROTATE:THREE.TOUCH.PAN;for(const key of ['orbit','pan']){$(key).classList.toggle('active',key===mode);$(key).setAttribute('aria-pressed',String(key===mode));}$('gesture-help').textContent=mode==='orbit'?'Arrastra para girar · rueda para acercar':'Arrastra para desplazar · rueda para acercar';});
for(const name of ['shadows','edges','profiles'])$('show-'+name).addEventListener('change',e=>{if(ready){viewOptions.set(name,e.target.checked);workflow.changed();}});
$('edit-tone').addEventListener('click',()=>{editorOpen[zone]=!editorOpen[zone];paintEditor();if(editorOpen[zone])revealEditor();});
$('reset-tone').addEventListener('click',()=>{const f=finishFor(zone);tones[zone]={...hexHsv(f.color),v:100,enabled:false};syncSurfaces(zone);applyMaterials();updateLabels();paintEditor();workflow.changed();});
$('screenshot').addEventListener('click',async()=>{
  if(!ready)return;const button=$('screenshot');button.disabled=true;button.querySelector('span').textContent='Preparando imagen…';
  try{
    await waitForTextures();interaction.clear();
    const finishes=Object.keys(labels).map(z=>labels[z]+': '+(finishFor(z)?.name||'Original')+(selection[z]==='custom'?' '+hsvHex(tones[z]).toUpperCase():tones[z]?.enabled?' · tono '+hsvHex(tones[z]).toUpperCase():''));
    if(matches.surfaces)finishes.push('Tope y mesa auxiliar: acabado unificado');
    if(matches.upper)finishes.push('Superiores: iguales a las puertas');if(matches.pantry)finishes.push('Despensa: acabado unificado');
    const floorFinish=palette.find(f=>f.id===config.floor.finishId);
    if(!selection.floor)finishes.push('Piso: terracota rectangular · '+floorFinish.tileSize.map(n=>Number((n*100).toFixed(1)).toLocaleString('es')).join(' × ')+' cm');
    await downloadView({renderer,composer,viewOptions,viewer:$('viewer'),finishes});$('share-feedback').textContent='Imagen descargada. Puedes enviarla para compartir tu selección.';announce($('share-feedback').textContent);
  }catch(error){$('share-feedback').textContent=error.message;announce(error.message);}
  finally{button.disabled=false;button.querySelector('span').textContent='Descargar imagen';if($('share-dialog').open)button.focus();requestRender();}
});
$('filter-detail').addEventListener('change',e=>{filters.detail=e.target.value;paintPalette();});
$('favorite-finish').addEventListener('click',()=>{const f=finishFor(zone);if(f&&f.id!=='custom')workflow.toggleFavorite(f.id);});
$('panel-toggle').addEventListener('click',()=>{const closed=document.body.classList.toggle('panel-collapsed');$('panel-toggle').setAttribute('aria-expanded',String(!closed));$('panel-toggle').innerHTML=(closed?'Editar acabados':'Ocultar acabados')+' <span aria-hidden="true">⌄</span>';});
for(const event of ['pointerup','pointercancel','keyup','change','focusout'])$('color-editor').addEventListener(event,()=>workflow?.endGroup());
$('eyedropper').addEventListener('click',()=>setSampling(!sampling));
$('copied-finish').addEventListener('click',()=>{try{applyCopiedFinish();}catch(error){samplerMessage(error.message);}});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&sampling)setSampling(false);});
init();
