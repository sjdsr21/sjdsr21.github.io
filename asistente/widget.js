(() => {
  if (document.getElementById('ago-chat-widget')) return;
  const host=document.createElement('div');host.id='ago-chat-widget';
  const root=host.attachShadow({mode:'open'});
  const faceModuleURL=new URL('rostro.js',document.currentScript.src).href;
  const sharingModuleURL=new URL('contacto.js',document.currentScript.src).href;
  const configURL=new URL('config.js',document.currentScript.src).href;
  root.innerHTML=`<style>
    :host{position:fixed;right:calc(max(0px, (100vw - var(--ancho,1240px)) / 2) + var(--canal,56px));bottom:max(14px,env(safe-area-inset-bottom));z-index:190;pointer-events:none}
    *{box-sizing:border-box}.launch{display:grid;place-items:center;border:0;background:transparent;box-shadow:none;border-radius:0;width:68px;height:80px;padding:4px;cursor:pointer;pointer-events:auto}.launch:focus-visible{outline:2px solid var(--barra-tinta);outline-offset:3px}.launch canvas{display:block;width:60px;height:72px;pointer-events:none;background:transparent}
    .launch.away{visibility:hidden;pointer-events:none}
    :host([product-open]) .launch{visibility:hidden;pointer-events:none}
    @media(max-width:780px){:host([product-open]) .launch:not(.away){position:fixed;left:var(--product-face-x);top:var(--product-face-y);visibility:visible;pointer-events:auto}}
    .launch canvas{filter:var(--rostro-mini-sombra,drop-shadow(0 0 2px rgba(0,0,0,.85)) drop-shadow(0 0 6px rgba(0,0,0,.7)))}
    .panel{position:absolute;right:0;bottom:94px;width:600px;height:min(584px,calc(100dvh - 136px));border:1px solid #2e2e2e;border-radius:0;overflow:hidden;background:color-mix(in srgb,#000 var(--ventana-opacidad,88%),transparent);-webkit-backdrop-filter:var(--ventana-filtro,saturate(1.1) blur(2px));backdrop-filter:var(--ventana-filtro,saturate(1.1) blur(2px));box-shadow:0 12px 35px #0002;opacity:0;transform:translateX(48px);visibility:hidden;pointer-events:none;transition:transform .32s var(--curva,cubic-bezier(.22,.68,0,1)),opacity .25s ease,visibility 0s .32s}
    .panel.open{opacity:1;transform:translateX(0);visibility:visible;pointer-events:auto;transition-delay:0s}iframe{color-scheme:dark;display:block;width:100%;height:100%;border:0}
    @media(max-width:780px){:host{right:14px;bottom:max(14px,env(safe-area-inset-bottom))}.launch canvas{filter:var(--rostro-mini-sombra,drop-shadow(0 0 2px rgba(0,0,0,.95)) drop-shadow(0 0 8px rgba(0,0,0,.85)))}.panel{bottom:0;width:min(380px,calc(100vw - 28px));height:min(648px,calc(100dvh - 28px - env(safe-area-inset-top) - env(safe-area-inset-bottom)))}}
    @media(prefers-reduced-motion:reduce){.launch,.panel{transition:none}.panel{transform:none}}
  </style><section class="panel" id="chatbot-panel" aria-label="Chatbot" inert><iframe title="Chatbot"></iframe></section><button class="launch" type="button" aria-label="Abrir chatbot" aria-expanded="false" aria-controls="chatbot-panel" title="Chatbot"><canvas width="60" height="72" aria-hidden="true"></canvas></button>`;
  const button=root.querySelector('button'),panel=root.querySelector('.panel'),frame=root.querySelector('iframe');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let opened=false,opener=null,launcherFace=null,generation=0,readyPromise=null,resolveReady=null;
  function theme(){
    const values={'--papel':'#000000','--tinta':'#FFFFFF','--apagado':'#A0A0A0','--linea':'#2E2E2E','--acento-texto':'#D07847'};
    values['--rostro-pupila']='#ff9828';
    const styles=getComputedStyle(document.documentElement);
    values['--tinta']=styles.getPropertyValue('--blanco').trim()||'#FFFFFF';
    for(const name of ['--curva','--curva-suave'])values[name]=styles.getPropertyValue(name).trim();
    frame.contentWindow?.postMessage({type:'chatbot-theme',values},location.origin);
  }
  function visibility(visible,teleport=false){frame.contentWindow?.postMessage({type:'ago-visibility',visible,teleport,phase:launcherFace?.getPhase()},location.origin);}
  function loadFrame(){
    if(!readyPromise){readyPromise=new Promise(resolve=>{resolveReady=resolve;});frame.src='asistente.html';}
    return readyPromise;
  }
  async function toggle(open,restoreFocus=true){
    if(open===opened)return;
    if(open)opener=document.activeElement===host?button:document.activeElement;
    const current=++generation;opened=open;
    button.setAttribute('aria-expanded',String(open));
    button.setAttribute('aria-label',open?'Cerrar chatbot':'Abrir chatbot');
    if(open){
      const loaded=loadFrame();
      await launcherReady;
      if(current!==generation)return;
      await launcherFace?.teleport(false);
      if(current!==generation)return;
      button.classList.add('away');button.inert=true;button.setAttribute('aria-hidden','true');
      await loaded;
      if(current!==generation)return;
      theme();panel.inert=false;panel.classList.add('open');visibility(true,true);
      frame.contentWindow.postMessage({type:'ago-focus',input:matchMedia('(min-width:781px)').matches},location.origin);
    }else{
      visibility(false);panel.inert=true;panel.classList.remove('open');
      if(!reduced.matches)await new Promise(resolve=>setTimeout(resolve,280));
      if(current!==generation)return;
      button.classList.remove('away');button.inert=false;button.removeAttribute('aria-hidden');
      await launcherReady;
      if(current!==generation)return;
      launcherFace?.teleport(true);
      if(restoreFocus)(opener?.isConnected?opener:button).focus();
    }
  }
  button.onclick=()=>toggle(!opened);
  frame.onload=()=>{theme();visibility(false);resolveReady?.();};
  window.addEventListener('chatbot-open',()=>toggle(true));
  window.addEventListener('message',e=>{if(e.origin===location.origin&&e.source===frame.contentWindow&&e.data?.type==='ago-close')toggle(false);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&opened)toggle(false);});
  // Captura antes de los enlaces que abren el chat; sus clics no lo cierran de inmediato.
  document.addEventListener('click',e=>{if(opened&&!e.composedPath().includes(host))toggle(false,false);},true);
  new MutationObserver(theme).observe(document.documentElement,{attributes:true,attributeFilter:['data-tema','class','style']});
  document.body.append(host);
  // Anclar solo la miniatura al precio: el chat conserva su posición en pantalla.
  const product=document.getElementById('pt-panel');
  const price=document.getElementById('pt-pn-precio');
  const productFooter=product?.querySelector('.pt-panel__pie');
  function placeProductFace(){
    const active=product?.classList.contains('abierto');
    host.toggleAttribute('product-open',!!active);
    if(!active||!price||!productFooter)return;
    const amount=price.getBoundingClientRect(),footer=productFooter.getBoundingClientRect();
    host.style.setProperty('--product-face-x',Math.max(8,Math.min(innerWidth-76,amount.left+amount.width/2-34))+'px');
    host.style.setProperty('--product-face-y',Math.max(8,footer.top-84)+'px');
  }
  if(product&&price&&productFooter){
    new MutationObserver(placeProductFace).observe(product,{attributes:true,attributeFilter:['class']});
    const geometry=new ResizeObserver(placeProductFace);
    geometry.observe(productFooter);geometry.observe(price);
    window.addEventListener('resize',placeProductFace);
    placeProductFace();
  }
  const launcherReady=import(faceModuleURL).then(({createAgoFace})=>{launcherFace=createAgoFace(button.querySelector('canvas'));});
  Promise.all([import(sharingModuleURL),import(configURL)]).then(([{installContactSharing}])=>installContactSharing());
})();
