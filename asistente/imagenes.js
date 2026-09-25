export async function prepareImage(file){
 if(!file||!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Elige una imagen JPG, PNG o WebP.');
 if(file.size>10*1024*1024)throw Error('La imagen debe pesar menos de 10 MB.');
 const bitmap=await createImageBitmap(file),scale=Math.min(1,1200/Math.max(bitmap.width,bitmap.height));
 const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
 const context=canvas.getContext('2d');context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
 let url=canvas.toDataURL('image/jpeg',.8);
 if(url.length>700000)url=canvas.toDataURL('image/jpeg',.5);
 if(url.length>700000)throw Error('La imagen es demasiado compleja. Recórtala e inténtalo de nuevo.');
 return {name:file.name.slice(0,120),url};
}
export function validImageURL(value){
 if(typeof value!=='string'||value.length>700000)return false;
 if(!/^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/]*={0,2}$/.test(value))return false;
 try{const bytes=atob(value.split(',')[1]);return bytes.length>10&&bytes.charCodeAt(0)===255&&bytes.charCodeAt(1)===216&&bytes.charCodeAt(2)===255&&bytes.charCodeAt(bytes.length-2)===255&&bytes.charCodeAt(bytes.length-1)===217;}catch{return false;}
}
