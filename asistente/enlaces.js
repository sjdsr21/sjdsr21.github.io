// Solo las fichas del catálogo local pueden originar enlaces. El modelo devuelve
// IDs, nunca destinos: ni su texto ni una URL propuesta por él se convierten en HTML.
export function enlaceFicha(ficha){
 const match=/^(producto|trabajo):([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(ficha?.id||'');
 if(!match||ficha.tipo!==match[1])return null;
 return match[1]==='producto'
  ?'index.html?pieza='+encodeURIComponent(match[2])
  :'trabajo.html?id='+encodeURIComponent(match[2]);
}
