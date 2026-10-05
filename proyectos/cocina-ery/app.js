import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
const $=id=>document.getElementById(id);
const labels={cabinet:'Puertas y muebles inferiores',counter:'Tope de cocina',table:'Mesa auxiliar',pantry:'Despensa',base:'Fórmica existente · color base'};
const originalColors={cabinet:'#fff2cc',counter:'#994c00',table:'#994c00',pantry:'#c46100',base:'#ffe4ca'};
const selection={cabinet:null,counter:null,table:null,pantry:null,base:null};
const matches={pantry:false,upper:false};
let zone='cabinet',category='neutral',palette=[],scene,camera,renderer,composer,controls,config,model,initial,ready=false;
const meshes=[],textureCache=new Map();
let renderFrames=0,framePending=false;
function announce(text){$('announcement').textContent=text;}
function requestRender(){renderFrames=3;if(!framePending){framePending=true;requestAnimationFrame(frame);}}
function frame(){framePending=false;if(!ready)return;const changed=controls.update();composer.render();if(!framePending&&(changed||--renderFrames>0)){framePending=true;requestAnimationFrame(frame);}}
function selectedZone(mesh){const r=mesh.userData.region;if(r==='upper')return matches.upper?'cabinet':'base';if(r==='pantryExisting')return matches.pantry?'pantry':'base';return labels[r]?r:null;}
function textureFor(finish){
  if(!textureCache.has(finish.id)){
    const t=new THREE.TextureLoader().load(finish.texture,requestRender,undefined,()=>announce('No se pudo cargar esa textura. Prueba otro acabado.'));
    t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());textureCache.set(finish.id,t);
  }
  return textureCache.get(finish.id);
}
function projectTexture(mesh,finish){
  const p=mesh.geometry.attributes.position,n=mesh.geometry.attributes.normal,uv=new Float32Array(p.count*2),sx=finish.size[0],sy=finish.size[1];
  for(let i=0;i<p.count;i++){
    const nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i)),nz=Math.abs(n.getZ(i));
    if(ny>=nx&&ny>=nz){uv[i*2]=p.getX(i)/sx;uv[i*2+1]=-p.getZ(i)/sy;}
    else if(nx>=nz){uv[i*2]=-p.getZ(i)/sx;uv[i*2+1]=p.getY(i)/sy;}
    else{uv[i*2]=p.getX(i)/sx;uv[i*2+1]=p.getY(i)/sy;}
  }
  mesh.geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));
}
function applyMaterials(){
  if(!ready)return;
  for(const mesh of meshes){
    const z=selectedZone(mesh),id=z?selection[z]:null,finish=id?palette.find(p=>p.id===id):null;
    const linked=z!=='base'&&(mesh.userData.region==='upper'||mesh.userData.region==='pantryExisting');
    const key=finish?finish.id:linked?'linked-original-'+z:'original';
    if(mesh.userData.applied===key)continue;
    mesh.userData.applied=key;
    if(mesh.material!==mesh.userData.original)mesh.material.dispose();
    if(!finish&&!linked){mesh.material=mesh.userData.original;mesh.geometry.setAttribute('uv',mesh.userData.originalUV.clone());continue;}
    mesh.material=mesh.userData.original.clone();mesh.material.map=null;mesh.material.color.set(finish?.color||originalColors[z]);
    if(finish?.texture){mesh.material.map=textureFor(finish);mesh.material.color.set(0xffffff);projectTexture(mesh,finish);mesh.material.roughness=.62;mesh.material.metalness=0;}
    else mesh.geometry.setAttribute('uv',mesh.userData.originalUV.clone());
    mesh.material.needsUpdate=true;
  }
  requestRender();
}
function paintPalette(){
  const container=$('palette');container.replaceChildren();const surfaces=zone==='counter'||zone==='table';
  for(const key of ['stone','textured'])document.querySelector(`[data-palette="${key}"]`).hidden=!surfaces;
  if(!surfaces&&['stone','textured'].includes(category))category='neutral';
  container.classList.toggle('textures',['stone','textured'].includes(category));
  document.querySelectorAll('[data-palette]').forEach(b=>{const active=b.dataset.palette===category;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  const options=palette.filter(p=>p.category===category);
  $('palette-count').textContent=`${options.length} ${options.length===1?'acabado':'acabados'}`;
  for(const finish of options){
    const b=document.createElement('button');b.className='swatch'+(finish.texture?' texture '+finish.category:'');b.style.setProperty('--swatch',finish.color);
    if(finish.texture){
      const sample=document.createElement('span');sample.className='sample';sample.style.backgroundImage=`url("${finish.texture}")`;sample.setAttribute('aria-hidden','true');
      const name=document.createElement('span');name.className='sample-name';name.textContent=finish.name;b.append(sample,name);
    }
    b.title=finish.name;b.setAttribute('aria-label',finish.name);b.setAttribute('aria-pressed',String(selection[zone]===finish.id));b.dataset.finish=finish.id;
    b.addEventListener('click',()=>setFinish(zone,finish.id));container.append(b);
  }
  updateLabels();
}
function updateLabels(){
  $('palette-title').textContent=labels[zone];$('chosen-name').textContent=palette.find(p=>p.id===selection[zone])?.name||'Acabado original';
  for(const b of document.querySelectorAll('[data-zone]')){
    const active=b.dataset.zone===zone;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));
    const f=palette.find(p=>p.id===selection[b.dataset.zone]),dot=b.querySelector('.preview-dot');dot.style.setProperty('--swatch',f?.color||originalColors[b.dataset.zone]);dot.style.backgroundImage=f?.texture?`url("${f.texture}")`:'';
  }
  document.querySelectorAll('[data-finish]').forEach(b=>b.setAttribute('aria-pressed',String(selection[zone]===b.dataset.finish)));
  const linked=[];if(matches.upper)linked.push('los gabinetes superiores');if(matches.pantry)linked.push('la despensa');
  $('base-note').hidden=zone!=='base';
  $('base-note').textContent=linked.length?`«Unificar» está activo para ${linked.join(' y ')}. Desmarca esa casilla para ver allí el color base.`:'Cambia el color de los cuerpos existentes de los gabinetes superiores y la despensa.';
}
function setFinish(z,id){
  if(!Object.hasOwn(labels,z))throw new Error('Zona desconocida');const f=id===null?null:palette.find(p=>p.id===id);
  if(id!==null&&!f)throw new Error('Acabado desconocido');if(f?.texture&&!['counter','table'].includes(z))throw new Error('Las piedras y los texturizados están disponibles para el tope y la mesa auxiliar.');
  selection[z]=id;applyMaterials();updateLabels();announce(`${labels[z]}: ${f?.name||'acabado original'}`);return readState();
}
function setMatches(pantry,upper){
  if(typeof pantry!=='boolean'||typeof upper!=='boolean')throw new Error('Las casillas requieren valores booleanos.');
  matches.pantry=pantry;matches.upper=upper;$('match-pantry').checked=pantry;$('match-upper').checked=upper;applyMaterials();updateLabels();return readState();
}
function readState(){return {selection:{...selection},matches:{...matches},zone};}
function resetCamera(){if(!ready)return;controls.enableDamping=false;controls.update();camera.position.copy(initial.eye);controls.target.copy(initial.target);camera.up.set(0,1,0);camera.zoom=1;resize();controls.update();controls.enableDamping=true;requestRender();}
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
    {name:'set_kitchen_matching',title:'Unificar acabados',description:'Activar o desactivar la unificación de la despensa y los cuerpos de gabinetes superiores.',inputSchema:{type:'object',properties:{pantry:{type:'boolean'},upper:{type:'boolean'}},required:['pantry','upper'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:input=>{if(!ready)throw new Error('El modelo todavía se está cargando.');return setMatches(input.pantry,input.upper);}}
  ];
  for(const tool of definitions){try{Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}}
}
async function init(){
  try{
    document.querySelectorAll('aside button,aside input,#reset').forEach(b=>b.disabled=true);
    [palette,config]=await Promise.all(['palette','scene'].map(async name=>{const response=await fetch(`assets/${name}.json`);if(!response.ok)throw new Error('No se pudieron cargar los acabados.');return response.json();}));
    renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.NoToneMapping;renderer.shadowMap.enabled=false;
    renderer.domElement.setAttribute('aria-label','Cocina Ery en 3D. Arrastra para girar, usa dos dedos para desplazar y pellizca para acercar.');renderer.domElement.setAttribute('tabindex','0');
    scene=new THREE.Scene();scene.background=new THREE.Color(`rgb(${config.background.join(',')})`);camera=new THREE.PerspectiveCamera(35,1,.03,70);camera.up.set(0,1,0);
    scene.add(new THREE.HemisphereLight(0xffffff,0xb9b7b2,1.5));const key=new THREE.DirectionalLight(0xffffff,1.05);key.position.set(4,7,5);scene.add(key);const fill=new THREE.DirectionalLight(0xffffff,.3);fill.position.set(-5,3,-2);scene.add(fill);
    const loaded=await new GLTFLoader().loadAsync('assets/kitchen.glb');model=loaded.scene;scene.add(model);
    model.traverse(mesh=>{if(!mesh.isMesh)return;mesh.castShadow=false;mesh.receiveShadow=false;mesh.userData.region=mesh.userData.region||mesh.parent?.userData.region||'fixed';mesh.userData.original=mesh.material;mesh.userData.originalUV=mesh.geometry.attributes.uv.clone();mesh.userData.applied='original';meshes.push(mesh);});
    const bounds=new THREE.Box3().setFromObject(model),center=bounds.getCenter(new THREE.Vector3()),eye=new THREE.Vector3().fromArray(config.camera.eye),target=new THREE.Vector3().fromArray(config.camera.target),direction=target.clone().sub(eye).normalize();
    target.copy(eye).addScaledVector(direction,center.clone().sub(eye).dot(direction));let fov=config.camera.fov;if(!config.camera.fov_is_height)fov=THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(fov/2))/config.camera.aspect));
    initial={eye,target,fov:fov*1.08};camera.position.copy(eye);camera.lookAt(target);
    controls=new OrbitControls(camera,renderer.domElement);controls.target.copy(target);controls.enableDamping=true;controls.dampingFactor=.12;controls.minDistance=.4;controls.maxDistance=14;controls.maxPolarAngle=Math.PI*.92;controls.zoomSpeed=.7;controls.panSpeed=.75;controls.addEventListener('change',requestRender);
    composer=new EffectComposer(renderer);composer.renderTarget1.samples=4;composer.renderTarget2.samples=4;composer.addPass(new RenderPass(scene,camera));const ao=new SSAOPass(scene,camera,640,640,24);ao.kernelRadius=.18;ao.minDistance=.001;ao.maxDistance=.09;composer.addPass(ao);composer.addPass(new OutputPass());
    $('viewer').prepend(renderer.domElement);ready=true;resize();composer.render();$('reference').hidden=true;$('load-status').hidden=true;document.querySelectorAll('aside button,aside input,#reset').forEach(b=>b.disabled=false);
    paintPalette();registerTools();new ResizeObserver(resize).observe($('viewer'));
    renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();ready=false;$('reference').hidden=false;$('load-status').hidden=false;$('load-status').textContent='Se interrumpió la vista 3D. Recarga la página para continuar.';});
    renderer.domElement.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','Home'].includes(event.key))return;event.preventDefault();if(event.key==='Home')return resetCamera();if(event.key==='+'||event.key==='-'){zoom(event.key==='+'?.85:1.15);return;}const offset=camera.position.clone().sub(controls.target),sphere=new THREE.Spherical().setFromVector3(offset);if(event.key==='ArrowLeft')sphere.theta-=.1;if(event.key==='ArrowRight')sphere.theta+=.1;if(event.key==='ArrowUp')sphere.phi=Math.max(.1,sphere.phi-.1);if(event.key==='ArrowDown')sphere.phi=Math.min(Math.PI*.92,sphere.phi+.1);camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(sphere));controls.update();requestRender();});
    window.eriDiagnostics=()=>({ready,triangles:meshes.reduce((s,m)=>s+m.geometry.attributes.position.count/3,0),state:readState(),camera:camera.position.toArray(),target:controls.target.toArray(),meshes:meshes.map(m=>({name:m.name,region:m.userData.region,finish:m.userData.applied,color:m.material.color.getHexString(),map:!!m.material.map})),shadows:renderer.shadowMap.enabled,ao:ao.enabled,render:renderer.info.render,bounds:[bounds.min.toArray(),bounds.max.toArray()],projected:center.clone().project(camera).toArray()});
  }catch(error){console.error(error);$('load-status').textContent='No se pudo abrir la vista 3D. Recarga la página o usa un navegador actualizado.';$('reference').hidden=false;}
}
function zoom(factor){if(!ready)return;camera.position.sub(controls.target).multiplyScalar(factor).add(controls.target);controls.update();requestRender();}
document.querySelectorAll('[data-zone]').forEach(b=>b.addEventListener('click',()=>{zone=b.dataset.zone;paintPalette();}));document.querySelectorAll('[data-palette]').forEach(b=>b.addEventListener('click',()=>{category=b.dataset.palette;paintPalette();}));
$('original').addEventListener('click',()=>setFinish(zone,null));$('match-pantry').addEventListener('change',()=>setMatches($('match-pantry').checked,matches.upper));$('match-upper').addEventListener('change',()=>setMatches(matches.pantry,$('match-upper').checked));
$('reset').addEventListener('click',()=>{Object.keys(selection).forEach(k=>selection[k]=null);setMatches(false,false);paintPalette();announce('Se restauraron todos los acabados originales.');});
$('home').addEventListener('click',resetCamera);$('zoom-in').addEventListener('click',()=>zoom(.85));$('zoom-out').addEventListener('click',()=>zoom(1.15));
for(const mode of ['orbit','pan'])$(mode).addEventListener('click',()=>{if(!controls)return;controls.mouseButtons.LEFT=mode==='orbit'?THREE.MOUSE.ROTATE:THREE.MOUSE.PAN;controls.touches.ONE=mode==='orbit'?THREE.TOUCH.ROTATE:THREE.TOUCH.PAN;for(const key of ['orbit','pan']){$(key).classList.toggle('active',key===mode);$(key).setAttribute('aria-pressed',String(key===mode));}$('gesture-help').textContent=mode==='orbit'?'Arrastra para girar · rueda para acercar':'Arrastra para desplazar · rueda para acercar';});
init();
