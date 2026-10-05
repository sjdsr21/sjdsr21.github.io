export const normalize=text=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function filterCatalog(palette,{category,zone,query='',tone='all',detail='all',favoritesOnly=false,favorites=[]}){
  const words=normalize(query).trim().split(/\s+/).filter(Boolean);
  return palette.filter(f=>f.category===category&&(!zone||!f.zones||f.zones.includes(zone))&&(!favoritesOnly||favorites.includes(f.id))&&(tone==='all'||f.tone===tone)&&(detail==='all'||f.pattern===detail||f.family===detail)&&words.every(w=>normalize(f.name+' '+(f.family||'')).includes(w)));
}
