export function createTheme(scene,requestRender){
  document.documentElement.dataset.theme='dark';scene.background.set(0x000000);requestRender();
  return {dark:true};
}
