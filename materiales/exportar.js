import {sampleGeometry} from './muestras.js?v=20261020-catalogo-conjunto-v1';
function download(blob,name){const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
async function loadImage(e){if(!e.image)return null;const sample=e.overview||e.image,img=new Image();img.src=sample.src;await img.decode();return img;}
function drawSample(ctx,img,e,x,y,w,h){
 const sample=e.overview||e.image,g=sampleGeometry(sample),contain=sample.display==='product';
 const scale=contain?Math.min(w/g.width,h/g.height):Math.max(w/g.width,h/g.height),iw=g.width*scale,ih=g.height*scale;
 ctx.save();ctx.filter=sample.displayFilter||'none';ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();if(contain){ctx.fillStyle='#f3f3f1';ctx.fillRect(x,y,w,h);}ctx.translate(x+(w-iw)/2,y+(h-ih)/2);ctx.scale(scale,scale);if(g.rotation){ctx.translate(g.h,0);ctx.rotate(Math.PI/2);}ctx.drawImage(img,g.x,g.y,g.w,g.h,0,0,g.w,g.h);ctx.restore();
}
function wrap(ctx,text,x,y,width,lineHeight,maxLines=4){
  let line='',lines=0;const words=text.split(/\s+/);
  for(let i=0;i<words.length;i++){const next=line+(line?' ':'')+words[i];if(ctx.measureText(next).width>width&&line){ctx.fillText(line,x,y);y+=lineHeight;lines++;line=words[i];if(lines===maxLines-1){let rest=[line,...words.slice(i+1)].join(' ');while(ctx.measureText(rest+'…').width>width&&rest.length)rest=rest.slice(0,-1);ctx.fillText(rest+'…',x,y);return;}}else line=next;}
  if(line)ctx.fillText(line,x,y);
}
export async function exportImage(records,project,url){
  await document.fonts.ready;
  const credits=records.filter(e=>/CC BY/.test(e.imageNote||''));
  const cols=Math.max(2,Math.min(6,Math.ceil(Math.sqrt(records.length)))),width=1440,tile=width/cols,row=tile+100,top=165,bottom=credits.length?165:100;
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=top+Math.ceil(records.length/cols)*row+bottom;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#000';ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='#F0E6D6';ctx.font='700 27px Poppins';ctx.fillText('prototipo ago',35,49);ctx.font='38px Roboto';ctx.fillText('Paleta de materiales',35,104);ctx.font='18px Roboto';ctx.fillStyle='#aaa';ctx.fillText(project.trim()||'Opciones para mi proyecto',35,140);
  const images=await Promise.all(records.map(loadImage));
  records.forEach((e,i)=>{const x=i%cols*tile,y=top+Math.floor(i/cols)*row,img=images[i];
    ctx.fillStyle='#30251b';ctx.fillRect(x,y,tile,tile);
    if(img)drawSample(ctx,img,e,x,y,tile,tile);
    else{ctx.font='28px Roboto';ctx.fillStyle='#eee';wrap(ctx,e.name,x+22,y+tile/2,tile-44,34);ctx.font='14px Roboto';ctx.fillText('Guía de acabado · sin fotografía',x+22,y+tile-30);}
    ctx.fillStyle='#F0E6D6';ctx.font='18px Roboto';wrap(ctx,(i+1)+'. '+e.name,x+15,y+tile+27,tile-30,22,2);ctx.fillStyle='#aaa';ctx.font='12px Roboto';wrap(ctx,[e.brand,e.code,e.finish].filter(Boolean).join(' · '),x+15,y+tile+69,tile-30,16,2);
  });
  if(credits.length){ctx.fillStyle='#aaa';ctx.font='13px Roboto';wrap(ctx,credits.map(e=>e.name+': '+e.imageNote).join(' '),35,canvas.height-125,width-70,18,2);ctx.fillText('Licencia de la muestra de Puy: creativecommons.org/licenses/by-sa/3.0/',35,canvas.height-82);}
  ctx.fillStyle='#aaa';ctx.font='17px Roboto';ctx.fillText('prototipoago.com/materiales/ · El tono y las existencias se confirman con una muestra.',35,canvas.height-55);
  ctx.font='13px Roboto';ctx.fillText('Compartir la selección completa: usa «Copiar enlace» en tu paleta.',35,canvas.height-27);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('No pudimos crear la imagen. Prueba con una paleta más pequeña.');
  download(blob,'AGO - Paleta de materiales.png');
}
