// Capture the rendered scene immediately, before the WebGL drawing buffer is cleared.
export async function downloadView({renderer,composer,viewOptions,viewer,finishes,composerPixelRatio=renderer.getPixelRatio()}){
  await document.fonts.ready;
  const width=1600,height=Math.round(width*viewer.clientHeight/viewer.clientWidth),canvas=document.createElement('canvas');
  canvas.width=width;canvas.height=height+190+Math.ceil(finishes.length/2)*32;const ctx=canvas.getContext('2d');
  const ratio=renderer.getPixelRatio(),size=renderer.getSize({set(x,y){this.x=x;this.y=y;return this;}});
  ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
  try{
    renderer.setPixelRatio(1);renderer.setSize(width,height,false);composer.setPixelRatio(1);composer.setSize(width,height);
    viewOptions.update();composer.render();ctx.drawImage(renderer.domElement,0,110,width,height);
  }finally{
    renderer.setPixelRatio(ratio);renderer.setSize(size.x,size.y,false);composer.setPixelRatio(composerPixelRatio);composer.setSize(size.x,size.y);
  }
  ctx.fillStyle='#151515';ctx.font='700 30px Poppins';ctx.textAlign='right';ctx.fillText('prototipo',190,45);ctx.fillText('ago',190,74);
  ctx.textAlign='left';ctx.font='700 32px Roboto';ctx.fillText('Cocina Ery',240,58);ctx.font='20px Roboto';ctx.fillStyle='#646464';ctx.fillText('Selección de acabados',240,87);
  ctx.strokeStyle='#dedede';ctx.beginPath();ctx.moveTo(40,105);ctx.lineTo(width-40,105);ctx.stroke();
  const top=height+140;ctx.fillStyle='#252525';ctx.font='22px Roboto';
  finishes.forEach((text,i)=>ctx.fillText(text,40+(i%2)*770,top+Math.floor(i/2)*32,730));
  ctx.font='17px Roboto';ctx.fillStyle='#646464';ctx.fillText('prototipoago.com · Colores orientativos. Confirmar con una muestra del proveedor.',40,canvas.height-20);
  const blob=await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(Error('No se pudo crear la imagen.')),'image/png'));
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Cocina-Ery-'+new Date().toISOString().slice(0,10)+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
