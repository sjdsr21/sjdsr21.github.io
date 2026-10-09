import * as THREE from 'three';
import {Pass,FullScreenQuad} from 'three/addons/postprocessing/Pass.js';

// One visibility mask for the whole selected surface. No mesh-edge extraction,
// reduced-resolution depth comparison, blur or hidden-object outlines.
export class SilhouettePass extends Pass {
  constructor(scene,camera){
    super();this.scene=scene;this.camera=camera;this.selectedObjects=[];
    this.mask=new THREE.WebGLRenderTarget(1,1,{minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter,depthBuffer:true});
    this.mask.samples=4;
    this.materials=new Map();
    this.composite=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,toneMapped:false,
      uniforms:{tDiffuse:{value:null},mask:{value:this.mask.texture},texel:{value:new THREE.Vector2(1,1)},radius:{value:2},enabled:{value:0},color:{value:new THREE.Color('#e2a379')}},
      vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
      fragmentShader:`uniform sampler2D tDiffuse,mask;uniform vec2 texel;uniform float radius,enabled;uniform vec3 color;varying vec2 vUv;
        void main(){vec4 base=texture2D(tDiffuse,vUv);if(enabled<.5){gl_FragColor=base;return;}
          float center=texture2D(mask,vUv).r;float expanded=center;
          for(int x=-2;x<=2;x++){for(int y=-2;y<=2;y++){
            if(x*x+y*y<=5){expanded=max(expanded,texture2D(mask,vUv+vec2(float(x),float(y))*texel*radius*.5).r);}
          }}
          float edge=clamp(expanded-center,0.,1.);gl_FragColor=vec4(mix(base.rgb,color,edge*.96),base.a);
        }`});
    this.quad=new FullScreenQuad(this.composite);
  }
  setSize(width,height){this.mask.setSize(width,height);this.composite.uniforms.texel.value.set(1/width,1/height);}
  flat(selected,side){
    const key=`${selected}:${side}`;
    if(!this.materials.has(key))this.materials.set(key,new THREE.MeshBasicMaterial({color:selected?0xffffff:0x000000,side,depthTest:true,depthWrite:true,toneMapped:false}));
    return this.materials.get(key);
  }
  render(renderer,writeBuffer,readBuffer){
    const selected=new Set(this.selectedObjects),swapped=[],hidden=[];
    this.composite.uniforms.enabled.value=selected.size?1:0;
    this.composite.uniforms.radius.value=2.2*renderer.getPixelRatio();
    if(selected.size){
      const background=this.scene.background,override=this.scene.overrideMaterial;
      const oldTarget=renderer.getRenderTarget(),shadows=renderer.shadowMap.enabled;
      try{
        this.scene.background=new THREE.Color(0);this.scene.overrideMaterial=null;renderer.shadowMap.enabled=false;
        this.scene.traverse(object=>{
          if(object.isMesh&&!object.isLineSegments2){
            const original=object.material;swapped.push([object,original]);
            object.material=Array.isArray(original)?original.map(m=>this.flat(selected.has(object),m.side)):this.flat(selected.has(object),original.side);
          }else if(object.isLine||object.isPoints||object.isSprite||object.isLineSegments2){hidden.push([object,object.visible]);object.visible=false;}
        });
        renderer.setRenderTarget(this.mask);renderer.clear();renderer.render(this.scene,this.camera);
      }finally{
        for(const [object,material] of swapped)object.material=material;
        for(const [object,visible] of hidden)object.visible=visible;
        this.scene.background=background;this.scene.overrideMaterial=override;renderer.shadowMap.enabled=shadows;renderer.setRenderTarget(oldTarget);
      }
    }
    this.composite.uniforms.tDiffuse.value=readBuffer.texture;
    renderer.setRenderTarget(this.renderToScreen?null:writeBuffer);this.quad.render(renderer);
  }
  dispose(){this.mask.dispose();this.composite.dispose();this.quad.dispose();for(const m of this.materials.values())m.dispose();}
}
