// Display geometry only. Original image pixels and source records are preserved.
export function sampleGeometry(sample){
 const [x,y,w,h]=sample.crop||[0,0,sample.width,sample.height],rotation=sample.displayRotation===90?90:0;
 return {x,y,w,h,rotation,width:rotation?h:w,height:rotation?w:h,transform:rotation?`translate(${h} 0) rotate(90) translate(${-x} ${-y})`:`translate(${-x} ${-y})`};
}
// Fill media boxes in CSS pixels, avoiding SVG viewport differences between browsers.
function fillCover(host){
 const img=host.querySelector('img[data-cover-sample]');if(!img)return;
 const s=JSON.parse(img.dataset.coverSample),g=sampleGeometry(s),box=host.getBoundingClientRect();
 if(!box.width||!box.height)return;
 // Overdraw one CSS pixel at each edge before clipping. Rotated rasters ending
 // on fractional device pixels otherwise blend with the dark host background.
 const bleed=1,k=Math.max((box.width+2*bleed)/g.width,(box.height+2*bleed)/g.height),cx=(box.width-g.width*k)/2,cy=(box.height-g.height*k)/2;
 img.style.width=s.width+'px';img.style.height=s.height+'px';
 img.style.transform=g.rotation?`matrix(0,${k},${-k},0,${cx+(g.h+g.y)*k},${cy-g.x*k})`:`matrix(${k},0,0,${k},${cx-g.x*k},${cy-g.y*k})`;
}
const coverObserver=new ResizeObserver(entries=>entries.forEach(e=>fillCover(e.target)));
export function observeSampleCovers(root=document){
 coverObserver.disconnect();
 root.querySelectorAll('.is-cover-sample').forEach(host=>{fillCover(host);coverObserver.observe(host);});
}
