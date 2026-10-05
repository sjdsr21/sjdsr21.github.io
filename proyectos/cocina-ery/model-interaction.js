import * as THREE from 'three';
export function createModelInteraction({scene,meshes,camera,canvas,selectedZone,onPick,requestRender}){
  const ray=new THREE.Raycaster(),pointer=new THREE.Vector2(),group=new THREE.Group(),active=new Map();
  const material=new THREE.MeshBasicMaterial({color:0xb66937,transparent:true,opacity:.3,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3});
  let timeout,start=null,multi=false,highlighted=null;
  scene.add(group);scene.updateMatrixWorld(true);
  for(const source of meshes){const overlay=new THREE.Mesh(source.geometry,material);overlay.matrixAutoUpdate=false;overlay.matrix.copy(source.matrixWorld);overlay.visible=false;overlay.userData.source=source;group.add(overlay);}
  function clear(){clearTimeout(timeout);highlighted=null;group.visible=false;requestRender();}
  function highlight(zone){
    clearTimeout(timeout);highlighted=zone;group.visible=true;
    group.children.forEach(m=>m.visible=selectedZone(m.userData.source)===zone);
    requestRender();timeout=setTimeout(clear,1100);
  }
  canvas.addEventListener('pointerdown',event=>{
    active.set(event.pointerId,true);if(active.size>1)multi=true;
    if(active.size===1){multi=false;start={x:event.clientX,y:event.clientY,id:event.pointerId,moved:false};}
  });
  canvas.addEventListener('pointermove',event=>{if(start&&Math.hypot(event.clientX-start.x,event.clientY-start.y)>6)start.moved=true;});
  canvas.addEventListener('pointerup',event=>{
    const pick=start&&start.id===event.pointerId&&!start.moved&&!multi&&event.button===0;
    active.delete(event.pointerId);if(active.size===0)start=null;
    if(!pick)return;
    const b=canvas.getBoundingClientRect();pointer.set((event.clientX-b.left)/b.width*2-1,1-(event.clientY-b.top)/b.height*2);
    camera.updateMatrixWorld(true);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(meshes,false)[0];
    if(hit){const z=selectedZone(hit.object);if(z){onPick(z);highlight(z);}}
  });
  canvas.addEventListener('pointercancel',event=>{active.delete(event.pointerId);start=null;multi=true;});
  return {clear,highlight,get highlighted(){return highlighted;},get highlightedCount(){return group.visible?group.children.filter(m=>m.visible).length:0;}};
}
