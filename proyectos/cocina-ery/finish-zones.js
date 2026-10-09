// Shared rules for the palette, saved combinations and model picking.
export function allowsFinish(zone,finish){
  if(!finish)return true;
  if(finish.zones&&!finish.zones.includes(zone))return false;
  if(zone==='plinth')return ['Madera','Metal'].includes(finish.family);
  if(zone==='wall')return !finish.texture;
  if(zone==='floor'&&finish.texture)return finish.category==='stone'||['Madera','Concreto','Cerámica'].includes(finish.family);
  return true;
}
export function surfaceRegion(data,config){
  if(data.originalMaterial==='Zocalo plateado')return 'plinth';
  if(data.persistentIds?.includes(config.floor.persistentId)&&data.originalMaterial===config.floor.originalMaterial)return 'floor';
  // The lower ceramic triangles have their own Tile Limestone material.
  if(data.persistentIds?.includes(36724)&&data.originalMaterial==='Formica Beige')return 'wall';
  return data.region||'fixed';
}
export function changesTogether(a,b,matches){
  return a===b||(matches.surfaces&&['counter','table'].includes(a)&&['counter','table'].includes(b));
}
