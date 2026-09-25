/* Rostro volumétrico, dibujado en una rejilla de píxeles con canal alfa.
   Geometría, luz y gestos locales: no requiere imágenes ni servicios externos. */
export function createAgoFace(canvas,{visible:initialVisible=true,listenToParent=false}={}) {
  const ctx = canvas.getContext('2d', {alpha: true});
  const points = [], triangles = [];
  let W=80,H=96,compact=false,pixelRatio=1;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const gauss = (x,y,cx,cy,sx,sy) => Math.exp(-(((x-cx)/sx)**2+((y-cy)/sy)**2));
  // Secciones anatómicas: cráneo, sien, pómulo, ángulo mandibular y mentón.
  // Los radios frontal y posterior independientes evitan una cabeza ovoide.
  const profile=[
    [-1.12,0,.03,.03],[-1.01,.34,.29,.32],[-.83,.55,.46,.55],
    [-.56,.65,.52,.64],[-.31,.63,.50,.63],[-.05,.66,.49,.57],
    [.19,.63,.47,.48],[.40,.57,.43,.36],[.59,.46,.42,.21],
    [.76,.29,.40,.02],[.86,.18,.32,-.06],[.93,0,.11,-.11]
  ];
  function section(y) {
    const i=Math.max(0,Math.min(profile.length-2,profile.findIndex((p,k)=>k<profile.length-1&&y<=profile[k+1][0])));
    const a=profile[i],b=profile[i+1],f=Math.max(0,Math.min(1,(y-a[0])/(b[0]-a[0])));
    // Hermite con tangentes respecto a la altura: continuidad en las sienes y mandíbula.
    return [1,2,3].map(k=>{
      const prev=profile[Math.max(0,i-1)],next=profile[Math.min(profile.length-1,i+2)];
      const m0=(b[k]-prev[k])/(b[0]-prev[0])*(b[0]-a[0]);
      const m1=(next[k]-a[k])/(next[0]-a[0])*(b[0]-a[0]);
      return (2*f**3-3*f*f+1)*a[k]+(f**3-2*f*f+f)*m0+(-2*f**3+3*f*f)*b[k]+(f**3-f*f)*m1;
    });
  }
  function surface(u,v) {
    const y=-1.12+(v+1)/2*2.05;
    const [width,frontDepth,backDepth]=section(y),cos=Math.cos(u);
    const x=width*Math.sin(u);
    let z=(frontDepth-backDepth)/2+(frontDepth+backDepth)/2*cos;
    if(Math.cos(u)>0) {
      const front=Math.max(0,Math.cos(u))**4;
      let relief=.26*gauss(x,y,0,.09,.105,.13)+.14*gauss(x,y,0,-.12,.075,.25);
      // Alas nasales, filtrum, labios y prominencia de la barbilla.
      relief+=.055*gauss(x,y,.10,.16,.06,.045)+.055*gauss(x,y,-.10,.16,.06,.045);
      relief-=.025*gauss(x,y,0,.31,.06,.08);
      for(const side of [-1,1]) {
        relief-=.12*gauss(x,y,side*.28,-.21,.18,.115);
        relief+=.09*gauss(x,y,side*.29,-.37,.23,.06);
        relief+=.10*gauss(x,y,side*.39,.04,.20,.17);
        relief-=.035*gauss(x,y,side*.47,-.26,.14,.23);
        relief+=.045*gauss(x,y,side*.40,.43,.16,.15);
      }
      relief+=.045*gauss(x,y,0,.405,.22,.038)+.05*gauss(x,y,0,.49,.20,.045);
      relief-=.035*gauss(x,y,0,.58,.22,.05);
      relief+=.13*gauss(x,y,0,.73,.26,.12);
      z+=front*relief;
    }
    return [x,y,z];
  }
  // Una malla continua cubre cada celda: los relieves de la nariz no dejan
  // huecos entre muestras cuando cambia el ángulo de la cabeza.
  function grid(columns,rows,sample) {
    const start=points.length;
    for(let j=0;j<=rows;j++)for(let i=0;i<=columns;i++)points.push(sample(i/columns,j/rows));
    for(let j=0;j<rows;j++)for(let i=0;i<columns;i++) {
      const a=start+j*(columns+1)+i,b=a+1,c=a+columns+1,d=c+1;
      triangles.push([a,c,b],[b,c,d]);
    }
  }
  grid(128,96,(f,g)=>{
    const u=f*Math.PI*2, v=-.999+g*1.998;
    const p=surface(u,v),a=surface(u+.002,v),b=surface(u-.002,v);
    const c=surface(u,Math.min(.999,v+.002)),d=surface(u,Math.max(-.999,v-.002));
    const du=a.map((n,k)=>n-b[k]),dv=c.map((n,k)=>n-d[k]);
    let n=[du[1]*dv[2]-du[2]*dv[1],du[2]*dv[0]-du[0]*dv[2],du[0]*dv[1]-du[1]*dv[0]];
    const length=Math.hypot(...n);n=n.map(x=>x/length);
    // Sombra suave en los relieves hundidos, además de la luz que cambia al girar.
    const [x,y]=p,front=Math.max(0,Math.cos(u))**4;
    let shade=.26*gauss(x,y,0,.23,.15,.08)+.17*gauss(x,y,0,.59,.24,.075);
    shade+=.18*gauss(x,y,0,.86,.34,.12);
    for(const side of [-1,1]) {
      shade+=.24*gauss(x,y,side*.28,-.23,.21,.13);
      shade+=.23*gauss(x,y,side*.40,.25,.20,.18);
    }
    return {p,n,front:Math.cos(u)>.65,occlusion:1-front*shade};
  });
  // Pabellón auricular con hélix, concha y lóbulo, unido a la sien.
  function earSurface(u,r,side) {
    const h=r*Math.cos(u),q=r*Math.sin(u);
    const y=.015+.265*h,z=-.065+q*(.155-.025*h)+.025*h;
    const rim=.031*Math.exp(-(((r-.82)/.18)**2));
    const fold=.018*Math.exp(-(((r-.49)/.19)**2))*(.65-.35*Math.sin(u));
    const bowl=-.015*Math.exp(-((r/.40)**2));
    const lobe=.022*gauss(q,h,0,.72,.58,.28);
    // La raíz sigue la superficie del cráneo. El relieve se desvanece
    // hacia la sien y el lóbulo para evitar un escalón en la unión.
    const [width,fd,bd]=section(y),center=(fd-bd)/2,depth=(fd+bd)/2;
    const skull=width*Math.sqrt(Math.max(0,1-((z-center)/depth)**2));
    const join=Math.max(0,Math.min(1,(q-.20)/.70));
    const attachment=(1-join*join*(3-2*join))*Math.max(0,1-h*h)**1.3;
    const relief=.055+.065*(1-q)/2+rim+fold+bowl+lobe;
    return [side*(skull-.008+attachment*relief),y,z];
  }
  for(const side of [-1,1])grid(64,20,(f,g)=>{
    const u=f*Math.PI*2,r=.002+g*.998;
    const p=earSurface(u,r,side),a=earSurface(u+.002,r,side),b=earSurface(u,r+.002,side);
    const du=a.map((v,k)=>v-p[k]),dr=b.map((v,k)=>v-p[k]);
    let n=[du[1]*dr[2]-du[2]*dr[1],du[2]*dr[0]-du[0]*dr[2],du[0]*dr[1]-du[1]*dr[0]];
    const length=Math.hypot(...n),direction=n[0]*side<0?-1:1;
    n=n.map(v=>v/length*direction);
    return {p,n,ear:r,earFold:.65-.35*Math.sin(u)};
  });
  // El reposo es en tres cuartos; vuelve a ese ángulo después de cada gesto.
  const poses=[[0,-.56,.02],[3,-.56,.02],[5,-.88,.04],[7,-.88,.04],[9,-.56,.02],[12,.20,-.02],[14,.20,-.02],[16,-.56,.02],[19,-.48,-.23],[21,-.48,-.23],[23,-.56,.02],[25,.38,.24],[27,.38,.24],[29,-.56,.02],[31,-.56,.02],[31.55,.48,.30,.65],[32.5,.48,.30,.4],[34,-.56,.02],[38,-.56,.02]];
  function pose(t) {
    t%=38;
    for(let i=1;i<poses.length;i++) if(t<=poses[i][0]) {
      const a=poses[i-1],b=poses[i],f=(t-a[0])/(b[0]-a[0]),s=f*f*(3-2*f);
      return [a[1]+(b[1]-a[1])*s,a[2]+(b[2]-a[2])*s,(a[3]||0)+((b[3]||0)-(a[3]||0))*s];
    }
    return [0,0];
  }
  let palette,visible=initialVisible,frame=0,last=0,elapsed=0;
  let speechStart=-Infinity,speechDuration=0,speechFrom=0;
  let speechReleaseStart=-Infinity,speechReleaseFrom=0;
  let transfer=null,transferTimer=0,finishTransfer=null;
  let nextGlitch=performance.now()+16000+Math.random()*18000,glitchStart=-Infinity,glitchSeed=0;
  const ease=value=>{const f=Math.max(0,Math.min(1,value));return f*f*(3-2*f);};
  const noise=(x,y,seed)=>{const n=Math.sin(x*127.1+y*311.7+seed*74.7)*43758.5453;return n-Math.floor(n);};
  function transferCoverage(){
    if(!transfer)return visible?1:0;
    const progress=Math.min(1,(performance.now()-transfer.start)/transfer.duration);
    return transfer.from+(transfer.to-transfer.from)*ease(progress);
  }
  function teleport(show,{phase}={}) {
    const from=transferCoverage();
    clearTimeout(transferTimer);finishTransfer?.(false);finishTransfer=null;
    if(Number.isFinite(phase))elapsed=phase;
    glitchStart=-Infinity;nextGlitch=performance.now()+16000+Math.random()*18000;
    transfer=null;
    if(reduced.matches){visible=show;canvas.dataset.effect='none';if(!show)ctx.clearRect(0,0,canvas.width,canvas.height);resume();return Promise.resolve(true);}
    visible=true;
    transfer={from,to:show?1:0,start:performance.now(),duration:show?360:260,seed:Math.random()*100};
    const completed=new Promise(resolve=>{finishTransfer=resolve;});
    transferTimer=setTimeout(()=>{
      transfer=null;visible=show;canvas.dataset.effect='none';
      if(!show)ctx.clearRect(0,0,canvas.width,canvas.height);
      const done=finishTransfer;finishTransfer=null;resume();done?.(true);
    },transfer.duration);
    resume();return completed;
  }
  function speechWeight(t) {
    if(speechReleaseStart!==-Infinity)return speechReleaseFrom*(1-ease((t-speechReleaseStart)/.4));
    const phase=t-speechStart;
    if(phase<0||phase>=speechDuration)return 0;
    return (speechFrom+(1-speechFrom)*ease(phase/.35))*ease((speechDuration-phase)/.55);
  }
  function colors() {
    const style=getComputedStyle(document.documentElement);
    palette={light:style.colorScheme==='light'};
    palette.pupil=style.getPropertyValue('--rostro-pupila').trim()||(palette.light?'#c45c0c':'#ff9828');
  }
  function render(t) {
    const now=performance.now();
    if(!reduced.matches&&!transfer&&now>=nextGlitch){glitchStart=now;glitchSeed=Math.random()*100;nextGlitch=now+16000+Math.random()*18000;}
    // Tiempo real: una caída de fotogramas no alarga el corte del holograma.
    const disruption=!reduced.matches&&now-glitchStart<90;
    const effect=reduced.matches?'none':transfer?(transfer.to?'arriving':'leaving'):disruption?'glitch':'none';
    if(canvas.dataset.effect!==effect)canvas.dataset.effect=effect;
    const coverage=transfer&&!reduced.matches?transferCoverage():1;
    const glitch=effect!=='none',seed=transfer?.seed??glitchSeed;
    const glitchFrame=transfer?Math.floor((now-transfer.start)/65):Math.floor((now-glitchStart)/30);
    const speech=reduced.matches?0:speechWeight(t);
    const syllable=Math.max(0,.5+.32*Math.sin(t*12.4)+.18*Math.sin(t*21.7+.4));
    const [baseYaw,basePitch,brow=0]=pose(t);
    const yaw=baseYaw+speech*.022*Math.sin(t*1.8),pitch=basePitch+speech*.020*Math.sin(t*3.5);
    const cy=Math.cos(yaw),sy=Math.sin(yaw),cx=Math.cos(pitch),sx=Math.sin(pitch);
    const motion=speech>.01?'speaking':brow>.1?'alert':baseYaw>.3&&basePitch>.15?'looking-up-right':'idle';if(canvas.dataset.motion!==motion)canvas.dataset.motion=motion;
    const turn=([x,y,z])=>{const xx=x*cy+z*sy,zz=-x*sy+z*cy;return [xx,y*cx-zz*sx,y*sx+zz*cx];};
    const depth=new Float32Array(W*H).fill(-Infinity),brightness=new Float32Array(W*H),kinds=new Uint8Array(W*H);
    const blinkPhase=t%4.9,blink=blinkPhase>4.56?Math.sin((blinkPhase-4.56)/.34*Math.PI):0;
    const glance=Math.sin(t*.57)*.026,breath=Math.sin(t*1.45)*.016;
    const projection=W*(compact?.48:.4125),detail=Math.min(1.8,Math.max(1,48/W));
    const projected=points.map(pt=>{
      let model=pt.p;
      if(speech>0&&pt.front&&pt.p[1]>.30) {
        const jaw=ease((pt.p[1]-.30)/.54);
        model=[pt.p[0],pt.p[1]+jaw*.055*speech*syllable,pt.p[2]];
      }
      const n=turn(pt.n),p=turn(model);
      return {p,n,pt,x:W/2+p[0]*projection,y:H*.53125+(p[1]+breath)*projection};
    });
    for(const triangle of triangles) {
      const a=projected[triangle[0]],b=projected[triangle[1]],c=projected[triangle[2]];
      const area=(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
      if(Math.abs(area)<.000001)continue;
      const x0=Math.max(0,Math.ceil(Math.min(a.x,b.x,c.x))),x1=Math.min(W-1,Math.floor(Math.max(a.x,b.x,c.x)));
      const y0=Math.max(0,Math.ceil(Math.min(a.y,b.y,c.y))),y1=Math.min(H-1,Math.floor(Math.max(a.y,b.y,c.y)));
      for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++) {
        const wb=((x-a.x)*(c.y-a.y)-(y-a.y)*(c.x-a.x))/area;
        const wc=((b.x-a.x)*(y-a.y)-(b.y-a.y)*(x-a.x))/area,wa=1-wb-wc;
        if(wa<-.000001||wb<-.000001||wc<-.000001)continue;
        const z=a.p[2]*wa+b.p[2]*wb+c.p[2]*wc,index=y*W+x;
        if(z<depth[index])continue;
        depth[index]=z;
        let n=a.n.map((v,k)=>v*wa+b.n[k]*wb+c.n[k]*wc);
        const length=Math.hypot(...n);n=n.map(v=>v/length);
        const diffuse=Math.max(0,-.65*n[0]-.47*n[1]+.60*n[2]);
        let light=.085+.92*Math.pow(diffuse,1.25);
        light+=.065*Math.max(0,n[0])*(1-Math.max(0,n[2]));
        light*=(a.pt.occlusion??1)*wa+(b.pt.occlusion??1)*wb+(c.pt.occlusion??1)*wc;
        let kind=0;
        if(a.pt.front||b.pt.front||c.pt.front) {
          const px=a.pt.p[0]*wa+b.pt.p[0]*wb+c.pt.p[0]*wc;
          const py=a.pt.p[1]*wa+b.pt.p[1]*wb+c.pt.p[1]*wc;
          for(const side of [-1,1]) {
            const ex=px-side*.28,ey=py+.205;
            const browY=-.35+.12*brow*(1-Math.min(1,Math.abs(px)/.5));
            light*=1-.26*brow*gauss(px,py,side*.23,browY,.18,.04);
            if((ex/(.145*Math.min(1.15,detail)))**2+(ey/(.066*detail))**2<1) {
              light=.07;
              if(Math.abs(ey+brow*.008)<(.035*(1-blink)+.005+brow*.007)*detail && Math.abs(ex-glance-brow*.015)<.047*Math.min(1.5,detail)) {light=1;kind=1;}
              if(blink>.7 && Math.abs(ey)<.014*detail) {light=palette.light?.07:.85;kind=palette.light?0:1;}
            }
          }
          // La apertura silábica se mezcla con el gesto de reposo, sin reiniciar el giro.
          const mouthY=.445-(.15+.32*(.5+.5*Math.sin(t*.40)))*px*px+Math.sin(t*.68)*.012;
          const mouthHeight=(.016+.014*Math.max(0,Math.sin(t*.8))+.085*speech*syllable)*detail;
          const roundness=1-speech+speech*Math.sqrt(Math.max(0,1-(px/.22)**2));
          if(Math.abs(px)<.22 && Math.abs(py-mouthY)<mouthHeight*roundness)light=.025;
        }
        if(a.pt.ear!==undefined) {
          const r=a.pt.ear*wa+b.pt.ear*wb+c.pt.ear*wc;
          const fold=a.pt.earFold*wa+b.pt.earFold*wb+c.pt.earFold*wc;
          // Relleno local y relieves suaves: la concha conserva forma sin negros profundos.
          light=(.18+.48*light)*(.74+.20*Math.exp(-(((r-.82)/.20)**2))+.08*fold*Math.exp(-(((r-.47)/.14)**2)));
        }
        brightness[index]=Math.min(1,light);kinds[index]=kind;
      }
    }
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const scale=canvas.width/W;
    const strips=Array.from({length:H},(_,y)=>{
      if(!glitch)return 0;
      const value=noise(Math.floor(y/3),glitchFrame,seed);
      return value>.65?Math.round((value-.82)*16):0;
    });
    for(let i=0;i<depth.length;i++) {
      if(depth[i]===-Infinity)continue;
      const l=compact?Math.round(brightness[i]*6)/6:brightness[i];
      const x=i%W,y=Math.floor(i/W);
      if(glitch&&noise(Math.floor(x/2),Math.floor(y/2),seed)>coverage)continue;
      if(disruption&&noise(x,y,seed+glitchFrame)>.93)continue;
      const dx=glitch?strips[y]*scale:0;
      // Cuadrados separados: el espacio entre píxeles queda transparente.
      const size=palette.light?.86:.72;
      if(kinds[i]===1) {ctx.fillStyle=palette.pupil;ctx.globalAlpha=.98;}
      else if(palette.light) {
        // Tonos sólidos y menos espacio vacío: el blanco del fondo no lava los relieves.
        const contrast=Math.max(0,Math.min(1,(l-.10)/.76));
        const tone=6+Math.round(218*Math.pow(contrast,.9));
        ctx.fillStyle=`rgb(${tone+3} ${tone+1} ${tone})`;
        ctx.globalAlpha=.98;
      }
      else {
        ctx.fillStyle='#e5d5c6';
        ctx.globalAlpha=.13+Math.pow(l,1.15)*.84;
      }
      if(compact) {
        // Cuadrados sobre píxeles físicos enteros y huecos visibles, también con zoom fraccional.
        const side=Math.max(1,Math.floor(scale-Math.max(1,Math.round(pixelRatio))));
        ctx.fillRect(Math.round((x+.5)*scale-side/2+dx),Math.round((y+.5)*scale-side/2),side,side);
      } else ctx.fillRect((x+(1-size)/2)*scale+dx,(y+(1-size)/2)*scale,size*scale,size*scale);
    }
    ctx.globalAlpha=1;
  }
  function tick(now) {
    frame=0;if(!visible||document.hidden)return;
    if(!last)last=now;
    const delta=now-last;
    if(delta>=1000/24){elapsed+=Math.min(delta,100)/1000;last=now;render(elapsed);}
    if(!reduced.matches)frame=requestAnimationFrame(tick);
  }
  function resume() {
    if(reduced.matches&&transfer){teleport(transfer.to===1);return;}
    cancelAnimationFrame(frame);frame=0;last=0;
    if(visible&&!document.hidden){render(reduced.matches?0:elapsed);if(!reduced.matches)frame=requestAnimationFrame(tick);}
  }
  function resize() {
    const dpr=Math.min(devicePixelRatio||1,2),r=canvas.getBoundingClientRect();
    if(!r.width)return;
    // Cada celda pequeña ocupa unos tres píxeles CSS: 20 columnas a 60 px,
    // 32 a 96 px y la rejilla original de 80 columnas en la vista ampliada.
    W=Math.max(12,Math.min(80,Math.floor(r.width/12)*4));H=Math.round(W*1.2);compact=W<80;
    canvas.dataset.pixelColumns=String(W);
    canvas.dataset.pixelRows=String(H);
    pixelRatio=Math.round(r.width*dpr)/r.width;
    canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);colors();resume();
  }
  const sizing=new ResizeObserver(resize);sizing.observe(canvas);
  const theming=new MutationObserver(()=>{colors();resume();});
  theming.observe(document.documentElement,{attributes:true,attributeFilter:['style','data-tema']});
  document.addEventListener('visibilitychange',resume);
  window.addEventListener('resize',resize);
  reduced.addEventListener('change',resume);
  function onParentMessage(e) {
    if(!listenToParent)return;
    if(e.origin!==location.origin||e.source!==parent||e.data?.type!=='ago-visibility')return;
    if(e.data.visible===true&&e.data.teleport){teleport(true,{phase:e.data.phase});return;}
    clearTimeout(transferTimer);finishTransfer?.(false);finishTransfer=null;transfer=null;
    visible=e.data.visible===true;
    if(!visible){canvas.dataset.effect='none';ctx.clearRect(0,0,canvas.width,canvas.height);}
    resume();
  }
  window.addEventListener('message',onParentMessage);
  colors();
  return {
    teleport,
    getPhase(){return elapsed;},
    speak(text,{duration}={}){
      speechFrom=speechWeight(elapsed);speechStart=elapsed;
      speechReleaseStart=-Infinity;
      const words=String(text).trim().split(/\s+/).length;
      speechDuration=Number.isFinite(duration)?Math.max(.6,duration):Math.max(2.8,Math.min(12,words*.22));resume();
    },
    stopSpeaking(){speechReleaseFrom=speechWeight(elapsed);speechReleaseStart=elapsed;resume();},
    setVisible(value){visible=value===true;resume();},
    destroy(){clearTimeout(transferTimer);finishTransfer?.(false);cancelAnimationFrame(frame);sizing.disconnect();theming.disconnect();document.removeEventListener('visibilitychange',resume);window.removeEventListener('resize',resize);reduced.removeEventListener('change',resume);window.removeEventListener('message',onParentMessage);}
  };
}
const canvas=document.querySelector('#rostro-ago');
export const agoFace=canvas?createAgoFace(canvas,{visible:window.parent===window,listenToParent:true}):null;
