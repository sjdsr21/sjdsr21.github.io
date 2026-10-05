export function createTheme(scene,requestRender){
  const checkbox=document.getElementById('dark-background');
  function apply(dark,persist=false){
    document.documentElement.dataset.theme=dark?'dark':'light';
    checkbox.checked=dark;scene.background.set(dark?0x000000:0xffffff);
    if(persist){try{localStorage.setItem('prototipoago.cocina-ery.theme',dark?'dark':'light');}catch{}}
    requestRender();
  }
  apply(document.documentElement.dataset.theme==='dark');
  checkbox.addEventListener('change',()=>apply(checkbox.checked,true));
  return {get dark(){return checkbox.checked;}};
}
