import {Matrix4} from 'three';
import {SSAOPass} from 'three/addons/postprocessing/SSAOPass.js';

// OrbitControls can round-trip spherical coordinates by a few ulps even when
// update() reports no camera movement. Those changes cannot alter a pixel.
const sameMatrix=(a,b)=>a.elements.every((value,i)=>Math.abs(value-b.elements[i])<1e-10);

// Geometry is static in this configurator. Changing color, hover or lighting
// does not change ambient occlusion. Keep the original 24-sample result until
// camera, projection, size or AO settings change. invalidate() covers future
// edits to the model or mesh visibility.
export class CachedAOPass extends SSAOPass{
  constructor(...args){super(...args);this.cachedView=new Matrix4();this.cachedProjection=new Matrix4();this.dirty=true;this.computations=0;this.reuses=0;}
  invalidate(){this.dirty=true;}
  setSize(width,height){super.setSize(width,height);this.invalidate();}
  render(renderer,writeBuffer,readBuffer){
    const settings=[this.kernelRadius,this.minDistance,this.maxDistance,this.output].join(':');
    this.camera.updateMatrixWorld();
    if(this.dirty||settings!==this.cachedSettings||!sameMatrix(this.cachedView,this.camera.matrixWorld)||!sameMatrix(this.cachedProjection,this.camera.projectionMatrix)||this.output!==SSAOPass.OUTPUT.Default){
      super.render(renderer,writeBuffer,readBuffer);
      this.cachedView.copy(this.camera.matrixWorld);this.cachedProjection.copy(this.camera.projectionMatrix);this.cachedSettings=settings;this.dirty=false;this.computations++;
    }else{
      // The previous default pass leaves the AO texture and multiplicative
      // blend configured. Blend it over this frame's fresh color rendering.
      this._renderPass(renderer,this.copyMaterial,this.renderToScreen?null:readBuffer);this.reuses++;
    }
  }
}
