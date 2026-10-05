// Part assignments come from the saved SketchUp component persistent IDs.
// The GLB geometry, original material and original UVs remain untouched.
export function counterPart(mesh,config){
  if(mesh.userData.region!=='counter')return null;
  return config.counterParts?.[mesh.userData.persistentIds?.at(-1)]||null;
}
export function resolveCounterFinish(mesh,finish,palette){
  if(finish?.trimFinish&&['front','left','backsplash'].includes(mesh.userData.counterPart)){
    return palette.find(f=>f.id===finish.trimFinish)||finish;
  }
  return finish;
}

// Rectangular tiles run along the length of each surface. Coordinates in metres
// keep the 15 x 30 cm reference pattern consistent across separate components.
export function ceramicUV(x,y,z,nx,ny,nz,size){
  const left=1.8255041794501716,front=-2.074253921225379,top=.94;
  if(ny>=nx&&ny>=nz)return [(front-z)/size[0],(x-left)/size[1]];
  if(nx>=nz)return [(y-top)/size[0],(front-z)/size[1]];
  return [(y-top)/size[0],(x-left)/size[1]];
}
