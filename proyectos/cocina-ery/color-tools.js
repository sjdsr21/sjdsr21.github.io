export const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
export function hsvRgb(h,s,v){
  h=((h%360)+360)%360/60;s/=100;v/=100;
  const c=v*s,x=c*(1-Math.abs(h%2-1)),m=v-c;
  const rgb=h<1?[c,x,0]:h<2?[x,c,0]:h<3?[0,c,x]:h<4?[0,x,c]:h<5?[x,0,c]:[c,0,x];
  return rgb.map(n=>Math.round((n+m)*255));
}
export const hsvHex=t=>'#'+hsvRgb(t.h,t.s,t.v).map(n=>n.toString(16).padStart(2,'0')).join('');
export function hexHsv(hex){
  const rgb=hex.replace('#','').match(/../g).map(v=>parseInt(v,16)/255),[r,g,b]=rgb,max=Math.max(...rgb),min=Math.min(...rgb),d=max-min;
  let h=d===0?0:max===r?60*((g-b)/d%6):max===g?60*((b-r)/d+2):60*((r-g)/d+4);
  return {h:(h+360)%360,s:max?d/max*100:0,v:max*100};
}
// The wheel selects hue and saturation; brightness remains an independent control.
export function createColorWheel(onChange){
  const $=id=>document.getElementById(id),canvas=$('color-wheel'),ctx=canvas.getContext('2d'),size=canvas.width,r=size/2-2;
  const image=ctx.createImageData(size,size);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const dx=x-size/2,dy=size/2-y,d=Math.hypot(dx,dy);if(d>r)continue;
    const rgb=hsvRgb(Math.atan2(dy,dx)*180/Math.PI,d/r*100,100),i=(y*size+x)*4;
    image.data.set([...rgb,Math.min(255,Math.max(0,(r-d)*255))],i);
  }
  ctx.putImageData(image,0,0);let state={h:0,s:0,v:100},dragging=false;
  function render(value){
    state={...value};const a=state.h*Math.PI/180;
    $('wheel-marker').style.left=`${50+Math.cos(a)*state.s*.48}%`;
    $('wheel-marker').style.top=`${50-Math.sin(a)*state.s*.48}%`;
    canvas.style.filter=`brightness(${state.v/100})`;
    for(const key of ['h','s','v']){$('color-'+key).value=state[key];$('value-'+key).textContent=Math.round(state[key])+(key==='h'?'°':'%');}
    $('color-hex').value=hsvHex(state).toUpperCase();$('color-preview').style.background=hsvHex(state);
  }
  function emit(next){render(next);onChange({...state});}
  function point(event){
    const b=canvas.getBoundingClientRect(),x=(event.clientX-b.left)/b.width-.5,y=.5-(event.clientY-b.top)/b.height;
    emit({...state,h:(Math.atan2(y,x)*180/Math.PI+360)%360,s:clamp(Math.hypot(x,y)/.48*100,0,100)});
  }
  canvas.addEventListener('pointerdown',e=>{dragging=true;canvas.setPointerCapture(e.pointerId);point(e);});
  canvas.addEventListener('pointermove',e=>{if(dragging)point(e);});
  canvas.addEventListener('pointerup',()=>dragging=false);canvas.addEventListener('pointercancel',()=>dragging=false);
  canvas.addEventListener('keydown',e=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();
    const step=e.shiftKey?10:1;emit({...state,h:(state.h+(e.key==='ArrowRight'?step:e.key==='ArrowLeft'?-step:0)+360)%360,s:clamp(state.s+(e.key==='ArrowUp'?step:e.key==='ArrowDown'?-step:0),0,100)});
  });
  for(const key of ['h','s','v'])$('color-'+key).addEventListener('input',e=>emit({...state,[key]:Number(e.target.value)}));
  $('color-hex').addEventListener('change',e=>{
    let hex=e.target.value.trim();if(!hex.startsWith('#'))hex='#'+hex;
    if(!/^#[0-9a-f]{6}$/i.test(hex)){e.target.setCustomValidity('Escribe seis caracteres, por ejemplo #E8D8B0.');e.target.reportValidity();return;}
    e.target.setCustomValidity('');emit(hexHsv(hex));
  });
  $('color-hex').addEventListener('input',e=>e.target.setCustomValidity(''));
  return {render};
}
