import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {ROOMS,roomById,polygon,snap,footprint,legal,findPosition,validateDesign} from 'ago-geometry';

const DATA=JSON.parse(document.getElementById('ago-data').textContent);
const $=id=>document.getElementById(id), clone=v=>JSON.parse(JSON.stringify(v));
const defs=new Map(DATA.furniture.map(x=>[x.id,x])), finishes=new Map(DATA.finishes.map(x=>[x.id,x]));
const stage=$('stage'), templates=new Map(), textures=new Map(), instanceObjects=new Map();
const storageKey='ago-space-demo-v1';
let state,selected=null,mode='move',view='iso',drag=null,history=[],future=[],busy=false;
const scene=new THREE.Scene();scene.background=new THREE.Color('#111110');
const camera=new THREE.OrthographicCamera(-5,5,5,-5,.05,100);
let renderer, controls, roomGroup, gridGroup, floorMesh,wallMeshes=[];
const furniGroup=new THREE.Group(); scene.add(furniGroup);
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),floorPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
const ring=new THREE.LineSegments(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:'#d99672',depthTest:false}));ring.renderOrder=10;ring.visible=false;scene.add(ring);
let dirty=true, wallVisibilityDirty=true;
function notice(message,error=false){$('notice').textContent=message;$('notice').classList.toggle('error',error);}
function requestRender(){dirty=true;}
function setBusy(value){busy=value;document.querySelectorAll('.furni-card').forEach(b=>b.disabled=value);}
function updateUndo(){ $('undo').disabled=!history.length;$('redo').disabled=!future.length; }
function persist(){try{localStorage.setItem(storageKey,JSON.stringify(state));}catch{} updateUndo();$('item-count').textContent=state.items.length+' muebles';}
function commit(before){if(JSON.stringify(before)!==JSON.stringify(state)){history.push(before);if(history.length>40)history.shift();future=[];}persist();updateList();updateInspector();requestRender();}
function baseMaterial(color='#d1ab76'){return new THREE.MeshStandardMaterial({color,roughness:.78,metalness:0});}
function box(root,w,h,d,x,y,z,zone,mat){const g=new THREE.BoxGeometry(w,h,d);const m=new THREE.Mesh(g,mat||baseMaterial());m.position.set(x,y,z);m.userData.zone=zone;m.castShadow=true;m.receiveShadow=true;root.add(m);return m;}
function basicModel(def){
 const root=new THREE.Group(),leg=baseMaterial('#252521'),wood=baseMaterial('#c69a6e'),white=baseMaterial('#ded9ce'),top=baseMaterial('#b3835f');
 if(def.id==='base'){
  box(root,.60,.72,.58,0,.48,0,'body',white);box(root,.63,.035,.63,0,.8825,0,'top',top);
  box(root,.025,.66,.015,-.151,.49,.300,'body',white);box(root,.285,.66,.025,.148,.49,.300,'body',white);
  box(root,.285,.66,.025,-.148,.49,.300,'body',white);
  for(const x of [-.22,.22])for(const z of [-.22,.22])box(root,.045,.14,.045,x,.07,z,null,leg);
  for(const x of [-.04,.04])box(root,.015,.14,.022,x,.62,.322,null,leg);
 }else if(def.id==='upper'){
  box(root,.60,.70,.35,0,.35,0,'body',white);for(const x of [-.151,.151])box(root,.293,.68,.02,x,.35,.183,'body',white);
  for(const x of [-.045,.045])box(root,.015,.11,.022,x,.11,.205,null,leg);
 }else if(def.id==='cabinet'){
  for(const x of [-.39,.39])box(root,.02,1.80,.40,x,.90,0,'body',wood);
  box(root,.76,1.80,.015,0,.90,-.192,'body',wood);
  for(const y of [.01,.45,.90,1.35,1.79])box(root,.78,.02,.40,0,y,0,'body',wood);
 }else if(def.id==='coffee'){
  for(const x of [-.57,.57])box(root,.04,.82,.52,x,.52,0,'body',white);
  box(root,1.10,.80,.025,0,.52,-.247,'body',white);
  box(root,1.14,.025,.52,0,.15,0,'body',white);box(root,1.14,.02,.50,0,.57,0,'body',white);
  box(root,1.20,.03,.55,0,.935,0,'top',top);box(root,.022,.76,.52,0,.535,0,'body',white);
  for(const x of [-.44,.44])for(const z of [-.18,.18])box(root,.04,.14,.04,x,.07,z,null,leg);
 }else if(def.id==='table'){
  box(root,1.40,.04,.75,0,.73,0,'top',wood);
  for(const x of [-.58,.58])for(const z of [-.28,.28])box(root,.055,.71,.055,x,.355,z,'body',leg);
 }else if(def.id==='chair'){
  box(root,.45,.035,.45,0,.435,0,'body',wood);box(root,.43,.29,.035,0,.685,-.22,'body',wood);
  for(const x of [-.18,.18])for(const z of [-.18,.18])box(root,.04,z<0?.83:.42,.04,x,z<0?.415:.21,z,'body',wood);
 }
 return root;
}
function projectUV(mesh,size){
 if(!mesh.userData.originalGeometry)mesh.userData.originalGeometry=mesh.geometry;
 const original=mesh.userData.originalGeometry;
 if(mesh.geometry!==original)mesh.geometry.dispose();
 const geo=original.clone(),pos=geo.getAttribute('position'),nor=geo.getAttribute('normal'),uv=new Float32Array(pos.count*2),v=new THREE.Vector3();
 const w=size?.[0]||1,h=size?.[1]||1;
 for(let i=0;i<pos.count;i++){
  v.fromBufferAttribute(pos,i);if(mesh.userData.uvMatrix)v.applyMatrix4(mesh.userData.uvMatrix);else v.add(mesh.position);
  const ax=Math.abs(nor.getX(i)),ay=Math.abs(nor.getY(i)),az=Math.abs(nor.getZ(i));
  if(ay>=ax&&ay>=az){uv[2*i]=v.x/w;uv[2*i+1]=v.z/h;}
  else if(ax>=az){uv[2*i]=v.z/w;uv[2*i+1]=v.y/h;}
  else{uv[2*i]=v.x/w;uv[2*i+1]=v.y/h;}
 }
 geo.setAttribute('uv',new THREE.BufferAttribute(uv,2));mesh.geometry=geo;
}
function finishMaterial(id){
 const f=finishes.get(id);if(!f)return null;
 const mat=new THREE.MeshStandardMaterial({color:f.image?'#ffffff':f.color,roughness:f.roughness||.8,side:THREE.DoubleSide});
 if(f.image){
  let texture=textures.get(id);
  if(!texture){texture=new THREE.TextureLoader().load(f.image,requestRender,undefined,()=>notice('No se pudo mostrar ese acabado.',true));texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());textures.set(id,texture);}
  mat.map=texture;
 }
 return mat;
}
function applyZone(root,zone,id){root.traverse(mesh=>{
 if(!mesh.isMesh||mesh.userData.zone!==zone)return;
 if(!mesh.userData.originalMaterial)mesh.userData.originalMaterial=mesh.material;
 if(mesh.material!==mesh.userData.originalMaterial)mesh.material.dispose();
 if(id==='original'){
  mesh.material=mesh.userData.originalMaterial;
  if(mesh.userData.originalGeometry&&mesh.geometry!==mesh.userData.originalGeometry){mesh.geometry.dispose();mesh.geometry=mesh.userData.originalGeometry;}
 }else{
  const f=finishes.get(id);mesh.material=finishMaterial(id);if(f?.image)projectUV(mesh,f.size);
 }
});requestRender();}
async function importedModel(def){
 const bytes=Uint8Array.from(atob(DATA.models[def.id]),c=>c.charCodeAt(0));
 const gltf=await new GLTFLoader().parseAsync(bytes.buffer,'');const model=gltf.scene;
 model.updateMatrixWorld(true);
 const bounds=new THREE.Box3().setFromObject(model),dim=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
 def.width=dim.x;def.depth=dim.z;def.height=dim.y;
 const root=new THREE.Group();
 model.traverse(mesh=>{
  if(!mesh.isMesh)return;
  const materialIndex=gltf.parser.associations.get(mesh.material)?.materials;
  const geometry=mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);geometry.translate(-center.x,-bounds.min.y,-center.z);
  const m=new THREE.Mesh(geometry,mesh.material);m.castShadow=true;m.receiveShadow=true;
  m.userData.zone=def.materialZones[String(materialIndex)]||null;root.add(m);
 });
 return root;
}
function instantiate(item){
 const def=defs.get(item.type),root=templates.get(item.type).clone(true);
 root.traverse(mesh=>{if(mesh.isMesh){mesh.material=mesh.material.clone();mesh.userData.itemId=item.id;}});
 root.position.set(item.x,def.lift||0,item.z);root.rotation.y=item.rotation*Math.PI/2;
 for(const [zone,id] of Object.entries(item.finishes))applyZone(root,zone,id);
 furniGroup.add(root);instanceObjects.set(item.id,root);return root;
}
function clearInstances(){
 furniGroup.traverse(m=>{if(!m.isMesh)return;if(m.userData.originalMaterial)m.userData.originalMaterial.dispose();m.material.dispose();if(m.userData.originalGeometry&&m.geometry!==m.userData.originalGeometry)m.geometry.dispose();});
 furniGroup.clear();instanceObjects.clear();
}
function rebuildInstances(){clearInstances();for(const item of state.items)instantiate(item);updateList();updateInspector();requestRender();}
function roomMaterial(id){return finishMaterial(id)||baseMaterial('#d7d1c2');}
function disposeRoom(){if(roomGroup){roomGroup.traverse(m=>{m.geometry?.dispose();m.material?.dispose();});scene.remove(roomGroup);}wallMeshes=[];}
function buildRoom(){
 disposeRoom();roomGroup=new THREE.Group();scene.add(roomGroup);const r=roomById(state.room),poly=polygon(r);
 const shape=new THREE.Shape();poly.forEach((p,i)=>i?shape.lineTo(p[0],-p[1]):shape.moveTo(p[0],-p[1]));shape.closePath();
 const geometry=new THREE.ShapeGeometry(shape);geometry.rotateX(-Math.PI/2);geometry.computeVertexNormals();
 floorMesh=new THREE.Mesh(geometry,roomMaterial(state.floor));floorMesh.position.y=-.009;floorMesh.userData.zone='floor';floorMesh.receiveShadow=true;projectUV(floorMesh,finishes.get(state.floor)?.size);roomGroup.add(floorMesh);
 const slab=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.10,bevelEnabled:false}),baseMaterial('#39372e'));slab.rotation.x=-Math.PI/2;slab.position.y=-.115;roomGroup.add(slab);
 const points=[];
 for(let x=-r.width/2;x<=r.width/2+.001;x+=.5){const maxz=r.notch!==undefined&&x>r.notch+.001?r.notch:r.depth/2;points.push(x,.004,-r.depth/2,x,.004,maxz);}
 for(let z=-r.depth/2;z<=r.depth/2+.001;z+=.5){const maxx=r.notch!==undefined&&z>r.notch+.001?r.notch:r.width/2;points.push(-r.width/2,.004,z,maxx,.004,z);}
 gridGroup=new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(points,3)),new THREE.LineBasicMaterial({color:'#504a40',transparent:true,opacity:.2}));gridGroup.visible=$('grid-visible').checked;roomGroup.add(gridGroup);
 poly.forEach((a,i)=>{const b=poly[(i+1)%poly.length],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);
  const wall=new THREE.Mesh(new THREE.BoxGeometry(len,2.6,.07),roomMaterial(state.wall));wall.position.set((a[0]+b[0])/2,1.3,(a[1]+b[1])/2);wall.rotation.y=-Math.atan2(dz,dx);wall.userData.outward=new THREE.Vector3(dz/len,0,-dx/len);wall.receiveShadow=true;roomGroup.add(wall);wallMeshes.push(wall);
 });
 $('room-name').textContent=r.name;$('room-size').textContent=`${r.width} × ${r.depth} m · ${r.area} m²`;
 document.querySelectorAll('[data-room]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.room===state.room)));
 $('floor-finish').value=state.floor;$('wall-finish').value=state.wall;wallVisibilityDirty=true;requestRender();
}
function updateWalls(){const dir=new THREE.Vector3().subVectors(camera.position,controls.target);for(const wall of wallMeshes)wall.visible=view!=='plan'&&wall.userData.outward.dot(dir)<-.01;wallVisibilityDirty=false;}
function fitCamera(reset=true){
 const r=roomById(state.room),aspect=stage.clientWidth/stage.clientHeight,extent=Math.max(r.width,r.depth),span=Math.max(extent*.96,extent*.74/aspect);
 camera.left=-span*aspect;camera.right=span*aspect;camera.top=span;camera.bottom=-span;
 if(reset){camera.zoom=1;controls.target.set(0,view==='plan'?0:.55,0);if(view==='plan')camera.position.set(0,15,.001);else camera.position.set(9,9,11);}
 camera.updateProjectionMatrix();controls.update();wallVisibilityDirty=true;requestRender();
}
function updateRing(valid=true){
 const item=state.items.find(x=>x.id===selected);ring.visible=!!item;if(!item)return;
 const box=footprint(item,defs.get(item.type)),y=(defs.get(item.type).lift||0)+.018,pad=.035;
 const p=[[box.x0-pad,y,box.z0-pad],[box.x1+pad,y,box.z0-pad],[box.x1+pad,y,box.z1+pad],[box.x0-pad,y,box.z1+pad]],verts=[];
 for(let i=0;i<4;i++)verts.push(...p[i],...p[(i+1)%4]);ring.geometry.dispose();ring.geometry=new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(verts,3));ring.material.color.set(valid?'#d99672':'#ed7373');
}
function pick(clientX,clientY){const rect=stage.getBoundingClientRect();pointer.set((clientX-rect.left)/rect.width*2-1,-(clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);return raycaster.intersectObjects(furniGroup.children,true).find(hit=>hit.object.userData.itemId);}
function onFloor(clientX,clientY){const rect=stage.getBoundingClientRect();pointer.set((clientX-rect.left)/rect.width*2-1,-(clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);return raycaster.ray.intersectPlane(floorPlane,new THREE.Vector3());}
function select(id){selected=id;updateInspector();updateList();updateFinishOptions();updateRing();requestRender();}
function updateInspector(){
 const item=state.items.find(x=>x.id===selected);$('inspector-content').hidden=!item;$('inspector-empty').hidden=!!item;if(!item){ring.visible=false;return;}
 const def=defs.get(item.type),cm=v=>Math.round(v*1000)/10;
 $('selected-name').textContent=def.name;$('selected-size').textContent=`${cm(def.width)} × ${cm(def.depth)} × ${cm(def.height)} cm`+(def.lift?' · elevado a 150 cm':'');$('selected-origin').textContent=def.model?'AGO':'Básico';updateRing();
}
function updateList(){
 const list=$('object-list');list.replaceChildren();
 state.items.forEach((item,index)=>{const b=document.createElement('button');b.className='object-row';b.setAttribute('aria-pressed',String(item.id===selected));const dot=document.createElement('span');dot.className='list-dot';const n=document.createElement('span');n.textContent=defs.get(item.type).name;const num=document.createElement('span');num.className='number';num.textContent=String(index+1).padStart(2,'0');b.append(dot,n,num);b.onclick=()=>select(item.id);list.append(b);});
 if(!state.items.length){const p=document.createElement('small');p.textContent='Añade el primer mueble.';list.append(p);}
 $('item-count').textContent=state.items.length+' muebles';
}
function tab(id){for(const name of ['room','furniture','finish']){$('tab-'+name).setAttribute('aria-selected',String(name===id));$('panel-'+name).hidden=name!==id;}if(id==='finish')updateFinishOptions();}
function activeFinishTarget(){const value=$('finish-target').value;if(value==='floor'||value==='wall')return{environment:value};const item=state.items.find(x=>x.id===selected);return item?{item,zone:value}:null;}
function updateFinishOptions(){
 const old=$('finish-target').value,el=$('finish-target');el.replaceChildren();const item=state.items.find(x=>x.id===selected);
 if(item){const def=defs.get(item.type);for(const zone of def.zones){const option=new Option(def.name+' · '+(DATA.zoneNames[zone]||zone),zone);el.add(option);}}
 el.add(new Option('Piso de la sala','floor'));el.add(new Option('Paredes de la sala','wall'));
 const allowed=Array.from(el.options).some(o=>o.value===old);el.value=allowed?old:item?defs.get(item.type).zones[0]:'floor';renderSwatches();
}
function renderSwatches(){
 const target=activeFinishTarget();if(!target)return;const environment=target.environment;
 const chosen=environment?state[environment]:(target.item.finishes[target.zone]||'original');
 $('selected-finish').textContent=finishes.get(chosen)?.name||'Original';$('swatches').replaceChildren();
 for(const f of DATA.finishes){if(environment&&f.id==='original')continue;if(environment==='wall'&&f.image)continue;
  const b=document.createElement('button');b.className='swatch-button';b.setAttribute('aria-pressed',String(f.id===chosen));
  const sample=document.createElement('span');sample.className='swatch';sample.style.background=f.image?`url("${f.image}") center/cover`:f.color||'linear-gradient(135deg,#cfaf83,#574933)';sample.setAttribute('aria-hidden','true');const name=document.createElement('span');name.textContent=f.name;b.append(sample,name);b.onclick=()=>setFinish(f.id);$('swatches').append(b);
 }
 $('finish-caption').textContent=finishes.get(chosen)?.note||'Acabados orientativos de la biblioteca de Cocina Ery. Puedes recuperar el acabado original de cada pieza.';
}
function setFinish(id){
 if(busy||drag)return;const target=activeFinishTarget();if(!target)return;const before=clone(state);
 if(target.environment){state[target.environment]=id;buildRoom();}else{target.item.finishes[target.zone]=id;applyZone(instanceObjects.get(target.item.id),target.zone,id);}commit(before);renderSwatches();notice('Acabado aplicado.');
}
function setMode(value){mode=value;$('move-mode').setAttribute('aria-pressed',String(value==='move'));$('look-mode').setAttribute('aria-pressed',String(value==='look'));$('gesture-tip').textContent=value==='move'?'Arrastra un mueble para moverlo · pasos de 10 cm':'Arrastra para girar la vista · rueda para acercar';controls.mouseButtons.LEFT=value==='look'?THREE.MOUSE.ROTATE:null;controls.touches.ONE=value==='look'?THREE.TOUCH.ROTATE:undefined;controls.enableRotate=value==='look'&&view!=='plan';requestRender();}
function moveSelected(dx,dz){
 if(busy||drag)return;const item=state.items.find(x=>x.id===selected);if(!item)return;const candidate={...item,x:snap(item.x+dx),z:snap(item.z+dz)};
 if(!legal(candidate,state.items,roomById(state.room),defs)){notice('Ese lugar está ocupado o fuera de la sala.',true);return;}
 const before=clone(state);item.x=candidate.x;item.z=candidate.z;instanceObjects.get(item.id).position.set(item.x,defs.get(item.type).lift||0,item.z);commit(before);notice('Mueble desplazado 10 cm.');
}
function rotateSelected(){
 const item=state.items.find(x=>x.id===selected);if(!item||busy||drag)return;const candidate={...item,rotation:(item.rotation+1)%4};
 if(!legal(candidate,state.items,roomById(state.room),defs)){notice('Necesita más espacio para girar aquí.',true);return;}
 const before=clone(state);item.rotation=candidate.rotation;instanceObjects.get(item.id).rotation.y=item.rotation*Math.PI/2;commit(before);notice('Mueble girado.');
}
function newId(){return 'm-'+crypto.randomUUID();}
function addFurniture(type,duplicate=null){
 if(busy||drag)return;if(state.items.length>=60){notice('La demo admite hasta 60 muebles.',true);return;}
 const candidate={id:newId(),type,x:0,z:0,rotation:duplicate?.rotation||0,finishes:clone(duplicate?.finishes||{})};
 const placed=findPosition(candidate,state.items,roomById(state.room),defs,duplicate?{x:duplicate.x+.7,z:duplicate.z}:undefined);
 if(!placed){notice('No queda un lugar libre para ese mueble.',true);return;}
 const before=clone(state);state.items.push(placed);instantiate(placed);select(placed.id);commit(before);notice(defs.get(type).name+' añadido.');
}
function changeRoom(id){
 if(id===state.room||busy||drag)return;const before=clone(state),r=roomById(id);state.room=id;const placed=[];
 for(const item of state.items){let p=item;if(!legal(p,placed,r,defs))p=findPosition(item,placed,r,defs,{x:item.x,z:item.z});if(!p){state=before;notice('Los muebles no caben en esa sala. Retira alguno primero.',true);return;}placed.push(p);}
 state.items=placed;buildRoom();rebuildInstances();fitCamera();commit(before);notice('Sala cambiada. Conservamos tus muebles y acabados.');
}
function makeRoomCards(){const wrap=$('room-grid');for(const r of ROOMS){const b=document.createElement('button');b.className='room-card';b.dataset.room=r.id;b.setAttribute('aria-pressed',String(r.id==='square'));
 const points=polygon(r).map(([x,z])=>`${45+x*10},${32+z*7}`).join(' ');b.innerHTML=`<svg viewBox="0 0 90 65" aria-hidden="true"><polygon points="${points}" fill="#a79579" fill-opacity=".15" stroke="#d0b799" stroke-width="1.5"/></svg>`;const name=document.createElement('span');name.textContent=r.name;const size=document.createElement('small');size.textContent=`${r.width} × ${r.depth} m`;b.append(name,size);b.onclick=()=>changeRoom(r.id);wrap.append(b);}}
function makeThumbnails(){
 const thumb=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});thumb.setSize(180,110);thumb.setPixelRatio(1);thumb.outputColorSpace=THREE.SRGBColorSpace;thumb.toneMapping=THREE.ACESFilmicToneMapping;thumb.toneMappingExposure=1.25;
 const s=new THREE.Scene();s.background=new THREE.Color('#20201c');s.add(new THREE.HemisphereLight('#fff6e5','#b2a68d',2));const light=new THREE.DirectionalLight('#ffffff',2.2);light.position.set(3,6,5);s.add(light);const cam=new THREE.OrthographicCamera();
 for(const def of DATA.furniture){const obj=templates.get(def.id).clone(true);s.add(obj);const bounds=new THREE.Box3().setFromObject(obj),center=bounds.getCenter(new THREE.Vector3());const span=Math.max(def.width/1.55,def.height,def.depth)*.76+.08;cam.left=-span*180/110;cam.right=span*180/110;cam.top=span;cam.bottom=-span;cam.near=.01;cam.far=50;cam.position.copy(center).add(new THREE.Vector3(3,2.4,4));cam.lookAt(center);cam.updateProjectionMatrix();thumb.render(s,cam);$('thumb-'+def.id).src=thumb.domElement.toDataURL('image/png');s.remove(obj);}
 thumb.dispose();thumb.forceContextLoss();
}
function makeCatalog(){for(const def of DATA.furniture){const b=document.createElement('button');b.className='furni-card';b.disabled=true;b.setAttribute('aria-label','Añadir '+def.name);const img=document.createElement('img');img.id='thumb-'+def.id;img.alt='';const name=document.createElement('span');name.className='name';name.textContent=def.name;const origin=document.createElement('span');origin.className='origin';origin.textContent=def.model?'AGO · '+def.origin:'Básico';b.append(img,name,origin);b.onclick=()=>addFurniture(def.id);$('catalog').append(b);}}
function defaultState(){return{schema:'ago-space-demo-v1',room:'square',title:'Mi espacio',floor:'concrete',wall:'cream',items:[
 {id:'starter-console',type:'console',x:-.7,z:-1.6,rotation:0,finishes:{}},
 {id:'starter-table',type:'table',x:.5,z:.5,rotation:0,finishes:{top:'oak'}},
 {id:'starter-chair',type:'chair',x:-.6,z:.5,rotation:1,finishes:{body:'oak'}},
 {id:'starter-coffee',type:'coffee',x:1.6,z:-.6,rotation:1,finishes:{body:'cream',top:'terracotta'}}
 ]};}
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);}
function fileName(){return (state.title.trim()||'Mi espacio').replace(/[<>:"/\\|?*\x00-\x1f]/g,'-').slice(0,60);}
function screenshot(){
 const was=ring.visible;ring.visible=false;renderer.render(scene,camera);renderer.domElement.toBlob(blob=>{ring.visible=was;requestRender();if(blob)download(blob,fileName()+' - Vista.png');else notice('No se pudo guardar la imagen.',true);},'image/png');
}
function restore(raw,keepSelection=false){const old=selected;state=validateDesign(raw,defs,finishes);selected=keepSelection&&state.items.some(i=>i.id===old)?old:null;buildRoom();rebuildInstances();fitCamera();$('design-name').value=state.title;updateFinishOptions();persist();}
function wire(){
 for(const name of ['room','furniture','finish'])$('tab-'+name).onclick=()=>tab(name);
 document.querySelectorAll('[role=tab]').forEach((b,i,arr)=>b.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();const next=arr[(i+(e.key==='ArrowRight'?1:2))%3];next.click();next.focus();}}));
 $('finish-target').onchange=renderSwatches;$('rotate').onclick=rotateSelected;$('open-finish').onclick=()=>{if(selected){$('finish-target').value=defs.get(state.items.find(x=>x.id===selected).type).zones[0];tab('finish');}};
 $('duplicate').onclick=()=>{const item=state.items.find(x=>x.id===selected);if(item)addFurniture(item.type,item);};
 $('remove').onclick=()=>{if(!selected||busy||drag)return;const before=clone(state);state.items=state.items.filter(x=>x.id!==selected);select(null);rebuildInstances();commit(before);notice('Mueble retirado. Puedes deshacer.');};
 document.querySelectorAll('[data-move]').forEach(b=>b.onclick=()=>{const[dx,dz]=b.dataset.move.split(',').map(Number);moveSelected(dx*.1,dz*.1);});
 $('move-mode').onclick=()=>setMode('move');$('look-mode').onclick=()=>setMode('look');
 $('iso').onclick=()=>{view='iso';$('iso').setAttribute('aria-pressed','true');$('plan').setAttribute('aria-pressed','false');controls.minPolarAngle=.2;controls.maxPolarAngle=Math.PI/2-.10;setMode(mode);fitCamera();};
 $('plan').onclick=()=>{view='plan';$('iso').setAttribute('aria-pressed','false');$('plan').setAttribute('aria-pressed','true');controls.minPolarAngle=0;controls.maxPolarAngle=Math.PI/2;setMode(mode);fitCamera();};$('fit').onclick=()=>fitCamera();
 const hist=redo=>{if(busy||drag)return;const source=redo?future:history,dest=redo?history:future;if(!source.length)return;dest.push(clone(state));restore(source.pop(),true);updateUndo();notice(redo?'Cambio rehecho.':'Cambio deshecho.');};$('undo').onclick=()=>hist(false);$('redo').onclick=()=>hist(true);
 for(const which of ['floor','wall']){$(which+'-finish').onchange=()=>{const before=clone(state);state[which]=$(which+'-finish').value;buildRoom();commit(before);renderSwatches();notice('Ambiente actualizado.');};}
 $('grid-visible').onchange=()=>{gridGroup.visible=$('grid-visible').checked;requestRender();};
 $('save-open').onclick=()=>{if(drag)return;$('design-name').value=state.title;$('save-dialog').showModal();};$('close-save').onclick=()=>$('save-dialog').close();
 $('design-name').onchange=()=>{const before=clone(state);state.title=$('design-name').value.trim()||'Mi espacio';commit(before);};
 $('download-design').onclick=()=>{state.title=$('design-name').value.trim()||'Mi espacio';persist();download(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),fileName()+' - Espacio.json');notice('Espacio guardado. Puedes volver a abrirlo en esta demo.');};$('download-image').onclick=screenshot;
 $('load-design').onclick=()=>$('import-design').click();$('import-design').onchange=async()=>{const f=$('import-design').files[0];if(!f)return;try{if(f.size>150000)throw Error('Ese archivo es demasiado grande para un espacio de esta demo.');const raw=JSON.parse(await f.text()),validated=validateDesign(raw,defs,finishes),before=clone(state);restore(validated);commit(before);$('save-dialog').close();notice('Espacio recuperado.');}catch(e){notice(e.message||'No se pudo abrir ese espacio.',true);}finally{$('import-design').value='';}};
 $('new-design').onclick=()=>{const before=clone(state);restore({...defaultState(),items:[]});commit(before);$('save-dialog').close();tab('room');notice('Sala vacía. Puedes deshacer para recuperar la composición.');};
 // Capture selection before OrbitControls handles the pointer.
 stage.addEventListener('pointerdown',e=>{
  if(busy||e.target!==renderer.domElement||mode!=='move'||e.button!==0)return;
  const hit=pick(e.clientX,e.clientY);if(!hit){select(null);return;}
  const item=state.items.find(x=>x.id===hit.object.userData.itemId);select(item.id);const p=onFloor(e.clientX,e.clientY);if(!p)return;
  drag={id:item.id,before:clone(state),pointerId:e.pointerId,x:item.x,z:item.z,offsetX:p.x-item.x,offsetZ:p.z-item.z,moved:false};controls.enabled=false;stage.setPointerCapture(e.pointerId);stage.focus({preventScroll:true});
 },true);
 stage.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.pointerId)return;const p=onFloor(e.clientX,e.clientY);if(!p)return;const item=state.items.find(x=>x.id===drag.id);item.x=snap(p.x-drag.offsetX);item.z=snap(p.z-drag.offsetZ);drag.moved=drag.moved||item.x!==drag.x||item.z!==drag.z;instanceObjects.get(item.id).position.set(item.x,defs.get(item.type).lift||0,item.z);updateRing(legal(item,state.items,roomById(state.room),defs));requestRender();});
 const finishDrag=e=>{if(!drag||e.pointerId!==drag.pointerId)return;const d=drag;drag=null;const item=state.items.find(x=>x.id===d.id);controls.enabled=true;if(e.type==='pointercancel'||!legal(item,state.items,roomById(state.room),defs)){item.x=d.x;item.z=d.z;instanceObjects.get(item.id).position.set(item.x,defs.get(item.type).lift||0,item.z);notice('Ese lugar está ocupado o fuera de la sala.',true);}else if(d.moved)notice('Mueble colocado.');updateRing();commit(d.before);};stage.addEventListener('pointerup',finishDrag);stage.addEventListener('pointercancel',finishDrag);
 stage.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();const map={ArrowLeft:[-.1,0],ArrowRight:[.1,0],ArrowUp:[0,-.1],ArrowDown:[0,.1]};moveSelected(...map[e.key]);}if(e.key.toLowerCase()==='r'){e.preventDefault();rotateSelected();}if(e.key==='Escape')select(null);});
}
async function init(){
 try{
  renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;stage.prepend(renderer.domElement);
  controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=false;controls.minZoom=.5;controls.maxZoom=3.5;controls.minPolarAngle=.2;controls.maxPolarAngle=Math.PI/2-.1;controls.enablePan=true;controls.addEventListener('change',()=>{wallVisibilityDirty=true;requestRender();});
  scene.add(new THREE.HemisphereLight('#fff4dd','#b1a896',2.4));const light=new THREE.DirectionalLight('#ffffff',3);light.position.set(3,8,4);light.castShadow=true;light.shadow.mapSize.set(1024,1024);light.shadow.camera.left=light.shadow.camera.bottom=-5;light.shadow.camera.right=light.shadow.camera.top=5;light.shadow.normalBias=.015;light.shadow.bias=-.0002;scene.add(light);
  makeCatalog();makeRoomCards();setBusy(true);
  await Promise.all(DATA.furniture.map(async def=>{const model=def.model?await importedModel(def):basicModel(def);model.updateMatrixWorld(true);const dim=new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());def.width=dim.x;def.depth=dim.z;def.height=dim.y;templates.set(def.id,model);}));
  for(const which of ['floor','wall'])for(const f of DATA.finishes){if(f.id==='original'||which==='wall'&&f.image)continue;$(which+'-finish').add(new Option(f.name,f.id));}
  state=defaultState();try{const saved=localStorage.getItem(storageKey);if(saved)state=validateDesign(JSON.parse(saved),defs,finishes);}catch{notice('Abrimos la composición inicial.');}
  validateDesign(state,defs,finishes);buildRoom();rebuildInstances();fitCamera();makeThumbnails();wire();setMode('move');updateFinishOptions();persist();setBusy(false);$('loader').hidden=true;
  const resize=new ResizeObserver(()=>{renderer.setSize(stage.clientWidth,stage.clientHeight);fitCamera(false);});resize.observe(stage);renderer.setSize(stage.clientWidth,stage.clientHeight);fitCamera();
  function frame(){requestAnimationFrame(frame);if(wallVisibilityDirty)updateWalls();if(dirty){renderer.render(scene,camera);dirty=false;}}frame();
  Object.defineProperty(window,'agoDemo',{value:Object.freeze({snapshot:()=>clone(state),dimensions:()=>DATA.furniture.map(d=>({id:d.id,width:d.width,depth:d.depth,height:d.height})),valid:()=>{try{validateDesign(state,defs,finishes);return true;}catch{return false;}},project:(x,y,z)=>{const p=new THREE.Vector3(x,y,z).project(camera),r=stage.getBoundingClientRect();return{x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2};}})});
 }catch(e){console.error(e);$('loader').innerHTML='<span>No pudimos abrir el visor 3D en este navegador.</span>';notice('Prueba la demo en un navegador con gráficos 3D disponibles.',true);}
}
init();
