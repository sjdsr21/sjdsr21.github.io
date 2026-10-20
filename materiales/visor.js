import {sampleGeometry} from './muestras.js?v=20261020-catalogo-conjunto-v1';
// Visor modal sobre la ficha: zoom, desplazamiento y pellizco; vuelve a la misma ficha.
export function setupMaterialViewer(openDialog){
 const dialog=document.querySelector('#material-image');
 const stage=document.querySelector('#material-image-stage');
 const visual=document.querySelector('#material-image-visual');
 const more=document.querySelector('#material-image-more'),less=document.querySelector('#material-image-less');
 const output=document.querySelector('#material-image-scale');
 const points=new Map();let scale=1,x=0,y=0,width=1,height=1,ratio=1,gesture=null,historyKey=null;
 const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
 function draw(){
  x=clamp(x,-Math.max(0,(width*scale-stage.clientWidth)/2),Math.max(0,(width*scale-stage.clientWidth)/2));
  y=clamp(y,-Math.max(0,(height*scale-stage.clientHeight)/2),Math.max(0,(height*scale-stage.clientHeight)/2));
  visual.style.transform=`translate(${x}px,${y}px) scale(${scale})`;
  stage.dataset.zoomed=String(scale>1);output.textContent=Math.round(scale*100)+' %';less.disabled=scale<=1;more.disabled=scale>=4;
 }
 function fit(){width=Math.min(stage.clientWidth,stage.clientHeight*ratio);height=width/ratio;visual.style.width=width+'px';visual.style.height=height+'px';draw();}
 function reset(){scale=1;x=y=0;draw();}
 function zoom(next,cx=0,cy=0){const previous=scale;scale=clamp(next,1,4);x=cx-(cx-x)*scale/previous;y=cy-(cy-y)*scale/previous;draw();}
 function relative(clientX,clientY){const r=stage.getBoundingClientRect();return {x:clientX-r.left-r.width/2,y:clientY-r.top-r.height/2};}
 function begin(){
  const p=[...points.values()];
  if(p.length>=2){const mid=relative((p[0].x+p[1].x)/2,(p[0].y+p[1].y)/2);gesture={kind:'pinch',distance:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y),scale,x,y,mid};}
  else if(p.length)gesture={kind:'drag',point:p[0],x,y};else gesture=null;
 }
 more.onclick=()=>zoom(scale*1.4);less.onclick=()=>zoom(scale/1.4);document.querySelector('#material-image-reset').onclick=reset;
 stage.addEventListener('wheel',e=>{e.preventDefault();const p=relative(e.clientX,e.clientY);zoom(scale*Math.exp(-e.deltaY*.002),p.x,p.y);},{passive:false});
 stage.addEventListener('dblclick',e=>{const p=relative(e.clientX,e.clientY);if(scale>1)reset();else zoom(2,p.x,p.y);});
 stage.addEventListener('pointerdown',e=>{
  if(e.pointerType==='mouse'&&e.button!==0)return;
  e.preventDefault();points.set(e.pointerId,{x:e.clientX,y:e.clientY});stage.setPointerCapture(e.pointerId);stage.dataset.dragging='true';begin();
 });
 stage.addEventListener('pointermove',e=>{
  if(!points.has(e.pointerId))return;points.set(e.pointerId,{x:e.clientX,y:e.clientY});
  const p=[...points.values()];
  if(gesture?.kind==='pinch'&&p.length>=2){
   const mid=relative((p[0].x+p[1].x)/2,(p[0].y+p[1].y)/2);
   scale=clamp(gesture.scale*Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)/Math.max(1,gesture.distance),1,4);
   x=mid.x-(gesture.mid.x-gesture.x)*scale/gesture.scale;y=mid.y-(gesture.mid.y-gesture.y)*scale/gesture.scale;draw();
  }else if(gesture?.kind==='drag'&&scale>1){x=gesture.x+e.clientX-gesture.point.x;y=gesture.y+e.clientY-gesture.point.y;draw();}
 });
 function release(e){points.delete(e.pointerId);stage.dataset.dragging=String(points.size>0);begin();}
 for(const event of ['pointerup','pointercancel','lostpointercapture'])stage.addEventListener(event,release);
 dialog.addEventListener('keydown',e=>{
  if(['+','=','-','0','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){
   e.preventDefault();if(e.key==='+'||e.key==='=')zoom(scale*1.4);else if(e.key==='-')zoom(scale/1.4);else if(e.key==='0')reset();
   else{if(e.key==='ArrowLeft')x+=40;if(e.key==='ArrowRight')x-=40;if(e.key==='ArrowUp')y+=40;if(e.key==='ArrowDown')y-=40;draw();}
  }
 });
 window.addEventListener('resize',()=>{if(dialog.open)fit();});
 window.addEventListener('popstate',()=>{if(dialog.open&&history.state?.agoMaterialImage!==historyKey)dialog.close();});
 dialog.addEventListener('close',()=>{points.clear();gesture=null;stage.dataset.dragging='false';visual.replaceChildren();if(historyKey&&history.state?.agoMaterialImage===historyKey)history.back();historyKey=null;});
 return record=>{
  const sample=record.image,crop=sample.crop,geometry=sampleGeometry(sample);ratio=geometry.width/geometry.height;
  document.querySelector('#material-image-title').textContent=record.name;
  let media;
  if(crop||geometry.rotation){media=document.createElementNS('http://www.w3.org/2000/svg','svg');media.setAttribute('viewBox',`0 0 ${geometry.width} ${geometry.height}`);media.setAttribute('role','img');media.setAttribute('aria-label',record.name);media.setAttribute('preserveAspectRatio','xMidYMid meet');const group=document.createElementNS(media.namespaceURI,'g');group.setAttribute('transform',geometry.transform);const img=document.createElementNS(media.namespaceURI,'image');img.setAttribute('href',sample.src);img.setAttribute('width',sample.width);img.setAttribute('height',sample.height);group.append(img);media.append(group);}
  else{media=document.createElement('img');media.src=sample.src;media.alt=record.name;media.draggable=false;}
  media.style.filter=sample.displayFilter||'';media.style.filter=sample.displayFilter||'';visual.replaceChildren(media);scale=1;x=y=0;
  historyKey=Date.now()+':'+record.id;try{history.pushState({...history.state,agoMaterialImage:historyKey},'');}catch{historyKey=null;}
  openDialog(dialog);fit();document.querySelector('.material-image__back').focus();
 };
}
