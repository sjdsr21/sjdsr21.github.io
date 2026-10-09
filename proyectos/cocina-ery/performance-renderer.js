// Keep navigation to one scene render. Restore the full, unchanged compositor
// after the camera (including damping) settles. Export uses that compositor too.
export function createPerformanceRenderer({renderer,composer,scene,camera,requestRender,onSettled=()=>{},pixelRatio=()=>globalThis.devicePixelRatio||1}){
  let width=1,height=1,moving=false,timer=null,previousFrame=0,samples=[],motionScale=1;
  let frames=0,navigationFrames=0,detailFrames=0,lastCalls=0,lastTriangles=0,allocatedRatio=0;
  renderer.info.autoReset=false;
  const detailRatio=()=>Math.min(pixelRatio(),1.7,Math.sqrt(3000000/(width*height)));
  const navigationRatio=()=>Math.min(detailRatio(),1.25,Math.sqrt(1000000/(width*height)))*motionScale;
  function useRatio(ratio){if(Math.abs(renderer.getPixelRatio()-ratio)>.001)renderer.setPixelRatio(ratio);}
  function cameraChanged(){
    if(!moving){moving=true;previousFrame=0;samples=[];}
    clearTimeout(timer);
    timer=setTimeout(()=>{moving=false;previousFrame=0;samples=[];onSettled();requestRender();},180);
  }
  function resize(w,h){
    const nextWidth=Math.max(1,w),nextHeight=Math.max(1,h),sameSize=width===nextWidth&&height===nextHeight;
    width=nextWidth;height=nextHeight;
    const ratio=detailRatio();
    if(sameSize&&allocatedRatio===ratio)return;
    renderer.setSize(width,height);
    composer.setPixelRatio(ratio);composer.setSize(width,height);allocatedRatio=ratio;
    useRatio(moving?navigationRatio():detailRatio());
  }
  function render(timestamp=performance.now()){
    renderer.info.reset();
    if(moving){
      // Timings include GPU back-pressure through RAF, rather than mistaking JS
      // submission time for GPU execution time. Ignore pauses and first frames.
      if(previousFrame&&timestamp-previousFrame<250)samples.push(timestamp-previousFrame);
      previousFrame=timestamp;
      if(samples.length>=12){
        const median=[...samples].sort((a,b)=>a-b)[Math.floor(samples.length/2)];
        if(median>28&&motionScale>.72)motionScale=Math.max(.72,motionScale*.85);
        else if(median<18&&motionScale<1)motionScale=Math.min(1,motionScale/.85);
        samples=[];
      }
      useRatio(navigationRatio());renderer.setRenderTarget(null);renderer.render(scene,camera);navigationFrames++;
    }else{
      useRatio(detailRatio());composer.render();detailFrames++;
    }
    frames++;lastCalls=renderer.info.render.calls;lastTriangles=renderer.info.render.triangles;
  }
  function dispose(){clearTimeout(timer);moving=false;previousFrame=0;samples=[];}
  return {cameraChanged,resize,render,dispose,get moving(){return moving;},get detailPixelRatio(){return detailRatio();},diagnostics:()=>({mode:moving?'navigation':'detail',frames,navigationFrames,detailFrames,pixelRatio:renderer.getPixelRatio(),detailPixelRatio:detailRatio(),motionScale,drawCalls:lastCalls,triangles:lastTriangles})};
}
