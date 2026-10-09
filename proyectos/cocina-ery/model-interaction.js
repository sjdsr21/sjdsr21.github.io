import * as THREE from 'three';
export function createModelInteraction({meshes,camera,canvas,selectedZone,onPick,requestRender,outline,related=(a,b)=>a===b,isSampling=()=>false}){
  const ray=new THREE.Raycaster(),pointer=new THREE.Vector2(),active=new Set();
  let timeout,start=null,multi=false,highlighted=null;
  function cursor(zone=null){canvas.style.cursor=active.size?'grabbing':isSampling()?'crosshair':zone?'pointer':'grab';}
  function clear(){clearTimeout(timeout);highlighted=null;outline.selectedObjects=[];cursor();requestRender();}
  function highlight(zone,persistent=false){
    clearTimeout(timeout);highlighted=zone;
    outline.selectedObjects=meshes.filter(mesh=>isSampling()?selectedZone(mesh)===zone:related(selectedZone(mesh),zone));
    requestRender();if(!persistent)timeout=setTimeout(clear,1100);
  }
  function pickAt(event){
    const b=canvas.getBoundingClientRect();pointer.set((event.clientX-b.left)/b.width*2-1,1-(event.clientY-b.top)/b.height*2);
    camera.updateMatrixWorld(true);ray.setFromCamera(pointer,camera);
    const hit=ray.intersectObjects(meshes,false)[0];return hit?selectedZone(hit.object):null;
  }
  function hover(event){
    const zone=pickAt(event);cursor(zone);
    if(zone!==highlighted){if(zone)highlight(zone,true);else clear();}
  }
  cursor();
  canvas.addEventListener('pointerdown',event=>{
    active.add(event.pointerId);if(active.size>1)multi=true;
    if(active.size===1){multi=false;start={x:event.clientX,y:event.clientY,id:event.pointerId,moved:false};}
    clear();
  });
  canvas.addEventListener('pointermove',event=>{
    if(start&&Math.hypot(event.clientX-start.x,event.clientY-start.y)>6)start.moved=true;
    if(!active.size&&event.pointerType==='mouse'&&!event.buttons)hover(event);
  });
  canvas.addEventListener('pointerup',event=>{
    const pick=start&&start.id===event.pointerId&&!start.moved&&!multi&&event.button===0;
    active.delete(event.pointerId);if(active.size===0)start=null;
    if(pick){const zone=pickAt(event);if(zone){onPick(zone);highlight(zone,event.pointerType==='mouse');}}
    if(!active.size){cursor();if(event.pointerType==='mouse'&&pick)hover(event);}
  });
  canvas.addEventListener('pointercancel',event=>{active.delete(event.pointerId);start=null;multi=true;clear();});
  canvas.addEventListener('pointerleave',clear);
  window.addEventListener('blur',()=>{active.clear();start=null;clear();});
  return {clear,highlight,get highlighted(){return highlighted;},get highlightedCount(){return outline.selectedObjects.length;}};
}
