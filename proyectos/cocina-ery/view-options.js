import * as THREE from 'three';
import {LineSegments2} from 'three/addons/lines/LineSegments2.js';
import {LineSegmentsGeometry} from 'three/addons/lines/LineSegmentsGeometry.js';
import {LineMaterial} from 'three/addons/lines/LineMaterial.js';

// Weld coincident triangle vertices across material boundaries. Coplanar triangle
// seams are excluded, so edges never expose the GLB triangulation.
export function createViewOptions(scene,meshes,camera,renderer,key,bounds,requestRender){
  const state={shadows:false,edges:false,profiles:false};let candidates=null,edges=null,profiles=null;
  const center=bounds.getCenter(new THREE.Vector3()),radius=bounds.getSize(new THREE.Vector3()).length()/2;
  key.position.copy(center).add(new THREE.Vector3(4,7,5));key.target.position.copy(center);scene.add(key.target);
  key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-radius;key.shadow.camera.right=radius;
  key.shadow.camera.top=radius;key.shadow.camera.bottom=-radius;key.shadow.camera.near=.1;key.shadow.camera.far=22;
  key.shadow.normalBias=.012;key.shadow.bias=-.00015;key.shadow.camera.updateProjectionMatrix();
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
  for(const mesh of meshes){mesh.castShadow=true;mesh.receiveShadow=true;mesh.material.polygonOffset=true;mesh.material.polygonOffsetFactor=1;mesh.material.polygonOffsetUnits=1;}
  function build(){
    if(candidates)return;const map=new Map(),vertex=p=>p.map(v=>Math.round(v*1e5)).join(',');
    for(const mesh of meshes){
      const p=mesh.geometry.attributes.position;
      for(let i=0;i<p.count;i+=3){
        const a=new THREE.Vector3().fromBufferAttribute(p,i),b=new THREE.Vector3().fromBufferAttribute(p,i+1),c=new THREE.Vector3().fromBufferAttribute(p,i+2);
        const n=b.clone().sub(a).cross(c.clone().sub(a)).normalize();if(n.lengthSq()<.5)continue;
        for(const [u,v] of [[a,b],[b,c],[c,a]]){
          const up=u.toArray(),vp=v.toArray(),uk=vertex(up),vk=vertex(vp),id=uk<vk?uk+'|'+vk:vk+'|'+uk;
          if(!map.has(id))map.set(id,{a:up,b:vp,mid:u.clone().add(v).multiplyScalar(.5),normals:[],count:0});
          const entry=map.get(id);entry.count++;if(!entry.normals.some(m=>m.dot(n)>.99999))entry.normals.push(n);
        }
      }
    }
    candidates=[...map.values()].filter(e=>e.count===1||e.normals.some(n=>Math.abs(n.dot(e.normals[0]))<.985));
    const positions=candidates.flatMap(e=>[...e.a,...e.b]);
    const eg=new THREE.BufferGeometry();eg.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    edges=new THREE.LineSegments(eg,new THREE.LineBasicMaterial({color:0x404040,transparent:true,opacity:.65,depthWrite:false}));edges.visible=false;scene.add(edges);
    const pg=new LineSegmentsGeometry();pg.setPositions(positions);
    profiles=new LineSegments2(pg,new LineMaterial({color:0x171717,linewidth:2.4,depthWrite:false,worldUnits:false}));
    profiles.visible=false;profiles.frustumCulled=false;scene.add(profiles);update();
  }
  function update(){
    if(!profiles||!state.profiles)return;
    const array=profiles.geometry.attributes.instanceStart.data.array;let count=0;
    for(const e of candidates){
      const direction=camera.position.clone().sub(e.mid);let front=false,back=false;
      for(const n of e.normals){if(n.dot(direction)>=0)front=true;else back=true;}
      if(e.normals.length===1||(front&&back)){array.set(e.a,count*6);array.set(e.b,count*6+3);count++;}
    }
    profiles.geometry.instanceCount=count;profiles.geometry.attributes.instanceStart.data.needsUpdate=true;
  }
  function set(name,enabled){
    if(!(name in state))throw Error('Opción desconocida');state[name]=!!enabled;
    if(name==='shadows'){
      renderer.shadowMap.enabled=state.shadows;renderer.shadowMap.needsUpdate=true;
      for(const mesh of meshes)mesh.material.needsUpdate=true;
    }else {build();edges.visible=state.edges;profiles.visible=state.profiles;update();}
    requestRender();
  }
  return {set,update,state,diagnostics:()=>({...state,edgeSegments:candidates?.length||0,profileSegments:profiles?.geometry.instanceCount||0})};
}
