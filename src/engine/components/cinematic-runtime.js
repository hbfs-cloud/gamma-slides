import { formatSpatialValue } from './immersive-data.js';
// Runs inside the standalone presentation; Three is embedded only for this variant.
function initCinematicComparisons() {
  const T=window.GammaThree, roots=[...document.querySelectorAll('.cinema-stage')];
  if(!roots.length)return;
  document.body.classList.add('gamma-cinema-deck');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'), states=new Map();
  let active, renderer, frame=0, printing=false, contextLost=false;
  const format=(v,m)=>formatCinematicValue(v,m.format);
  function fallback(root){root.dataset.cinemaRenderer='svg';const s=states.get(root);if(s){root.querySelector('h2').textContent=s.title;root.querySelector('.cinema-heading p').textContent=s.subtitle;}root.querySelector('[data-cinema-action="split"]').disabled=true;initCharts(root);}
  function palette(s){
    const css=getComputedStyle(s.root),config=(chartConfigSets[activeChartTheme]||[]).find(c=>c.id===s.root.dataset.cinemaChart)?.config;
    return s.model.series.map((_,i)=>new T.Color(config?.series?.[i]?.itemStyle?.color || css.getPropertyValue(i?'--gamma-primary':'--gamma-muted').trim()));
  }
  function recolor(s){const colors=palette(s);s.floor?.material.color.set(getComputedStyle(s.root).getPropertyValue('--gamma-bg').trim()).multiplyScalar(1.4);s.meshes.forEach((mesh,i)=>{const index=i%s.model.labels.length,j=Math.floor(i/s.model.labels.length),color=colors[j].clone().multiplyScalar(.6+.10*index);mesh.material.color.copy(color);});}

  function stop(){cancelAnimationFrame(frame);frame=0;if(active)active.root.dataset.cinemaMoving='false';}
  function project(s,x,y,z=0){const p=new T.Vector3(x,y,z).project(s.camera);return [(p.x+1)*s.w/2,(1-p.y)*s.h/2];}
  function labelAt(el,p){el.style.left=p[0]+'px';el.style.top=p[1]+'px';}
  function layout(s){
    const rect=s.root.getBoundingClientRect();s.w=s.root.clientWidth;s.h=s.root.clientHeight;s.mobile=rect.width<700;
    const viewH=s.mobile?10.0:7.4, aspect=s.w/s.h;
    s.camera.left=-viewH*aspect/2;s.camera.right=viewH*aspect/2;s.camera.top=viewH/2;s.camera.bottom=-viewH/2;
    s.camera.position.set(0,4.8,15);s.camera.lookAt(0,2,0);s.camera.updateProjectionMatrix();s.camera.updateMatrixWorld();
    const pixelRatio=Math.min(devicePixelRatio||1,1.5,Math.sqrt(2e6/(rect.width*rect.height)));
    renderer.setPixelRatio(pixelRatio);renderer.setSize(rect.width,rect.height,false);
    const m=s.model, totalScale=s.mobile?2.45:3.5, max=Math.max(...m.totals), maxValue=Math.max(...m.values.flat());
    s.targets=[];
    m.values.forEach((values,j)=>{
      let bottom=s.mobile?0:-.3;
      values.forEach((v,i)=>{
        const height=v/max*totalScale, x=(j?1:-1)*(s.mobile?.86:1.85), width=s.mobile?.95:1.8;
        const sx=s.mobile?(j?0:-1.42):(j?1.65:-.65);
        const gap=s.mobile?.19:.24,base=bottom+i*gap+(s.mobile?-.1:0);
        const focus=j===1&&i===m.winner, focusScale=focus?1.08:1;
        s.targets.push({total:[x,bottom+height/2,0,width,height,1.15],split:[sx,base+height/2,focus?1.35:0,s.mobile?1.05*focusScale:1.55*focusScale,height,1.15*focusScale]});bottom+=height;
      });
      labelAt(s.root.querySelector(j?'.cinema-after':'.cinema-before'),project(s,(j?1:-1)*(s.mobile?.86:1.85),bottom+.72,0));
    });
    s.labels.forEach((el,i)=>{
      const reverse=m.labels.length-1-i,x=s.mobile?s.w*.82:s.w*.885;
      const y=s.mobile?290+reverse*76:185+reverse*79;
      labelAt(el,[x,y]);
    });
  }

  function draw(s,progress=s.progress){
    s.progress=progress;
    s.meshes.forEach((mesh,i)=>{
      const a=s.targets[i].total,b=s.targets[i].split, v=a.map((n,k)=>n+(b[k]-n)*progress);
      mesh.position.set(...v.slice(0,3));mesh.scale.set(...v.slice(3));mesh.rotation.y=-.38;mesh.visible=v[4]>0;mesh.material.transparent=s.mobile&&i<s.model.labels.length;mesh.material.opacity=s.mobile&&i<s.model.labels.length?.42:1;
    });
    const svg=s.root.querySelector('.cinema-leaders');svg.replaceChildren();
    s.labels.forEach((el,i)=>{
      const mesh=s.meshes[i+s.model.labels.length],p=project(s,mesh.position.x+mesh.scale.x*.55,mesh.position.y,mesh.position.z);
      const path=document.createElementNS('http://www.w3.org/2000/svg','path'),x=parseFloat(el.style.left)-el.offsetWidth/2-9,y=parseFloat(el.style.top)+12;
      path.setAttribute('d','M'+p[0]+','+p[1]+' L'+(x-14)+','+y+' L'+x+','+y);svg.append(path);
    });
    if(!reduced.matches){s.camera.position.x=s.pointer.x*.6;s.camera.position.y=4.8+s.pointer.y*.18;s.camera.lookAt(s.pointer.x*.12,2+s.pointer.y*.05,0);s.camera.updateMatrixWorld();}
    renderer.render(s.scene,s.camera);s.root.dataset.cinemaFrames=String(++s.frames);
  }
  function updateCopy(s,to){
    const root=s.root,fr=document.documentElement.lang.startsWith('fr');
    const change=s.model.totals[1]-s.model.totals[0],delta=s.model.changes[s.model.winner],share=change?delta/change*100:null;
    root.querySelector('h2').textContent=to?(fr?(change>0?'La croissance, ouverte.':'La variation, décomposée.'):(change>0?'Growth, opened up.':'The change, opened up.')):s.title;
    root.querySelector('.cinema-heading p').textContent=to?(s.model.series.join(' → ')+(fr?' · Les mêmes volumes, segment par segment.':' · The same volumes, segment by segment.')):s.subtitle;
    const feature=root.querySelector('.cinema-feature');feature.querySelector('b').textContent=s.model.labels[s.model.winner];feature.querySelector('strong').textContent=(delta>=0?'+':'')+format(delta,s.model);
    feature.querySelector('p').textContent=share===null?(fr?'Des variations qui se compensent.':'Offsetting changes.'):(share.toFixed(1)+(fr?' % de la variation nette.':'% of the net change.'));

  }
  function activate(){
    stop();const root=Reveal.getCurrentSlide()?.querySelector('.cinema-stage');
    document.body.classList.toggle('gamma-cinema-active',!!root);
    if(!root){active=null;return;}
    if(gammaExportMode||printing||contextLost||!T){fallback(root);return;}
    try{
      if(!renderer){
        renderer=new T.WebGLRenderer({preserveDrawingBuffer:true,alpha:true,antialias:true,powerPreference:'low-power'});
        renderer.setClearColor(0,0);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
        renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
        renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();contextLost=true;stop();if(active)fallback(active.root);});
        renderer.domElement.addEventListener('webglcontextrestored',()=>{contextLost=false;states.forEach(s=>{s.environment?.dispose();const p=new T.PMREMGenerator(renderer);s.environment=p.fromScene(s.room,.04);s.scene.environment=s.environment.texture;p.dispose();});activate();});
      }
      let s=states.get(root);
      if(!s){
        const model=JSON.parse(root.querySelector('.cinema-model').textContent),scene=new T.Scene(),camera=new T.OrthographicCamera();
        s={root,model,scene,camera,meshes:[],labels:[],pointer:{x:0,y:0},progress:0,frames:0,title:root.querySelector('h2').textContent,subtitle:root.querySelector('.cinema-heading p').textContent};states.set(root,s);
        const css=getComputedStyle(root),accent=new T.Color(css.getPropertyValue('--gamma-primary').trim()),muted=new T.Color(css.getPropertyValue('--gamma-muted').trim());
        const room=new T.Scene();s.room=room;room.background=new T.Color(0x252525);
        const panelGeometry=new T.PlaneGeometry(1,1),panelMaterial=new T.MeshBasicMaterial({color:0xffffff,side:T.DoubleSide});
        [[-4,3,4,3,9],[5,3,1,2,8],[0,8,0,8,8]].forEach(([x,y,z,w,h])=>{const panel=new T.Mesh(panelGeometry,panelMaterial);panel.position.set(x,y,z);panel.scale.set(w,h,1);panel.lookAt(0,2,0);room.add(panel);});
        const pmrem=new T.PMREMGenerator(renderer);s.environment=pmrem.fromScene(room,.04);scene.environment=s.environment.texture;pmrem.dispose();
        scene.add(new T.HemisphereLight(0xffffff,0x292929,1.3));
        const key=new T.DirectionalLight(0xfff7e6,4.4);key.position.set(-5,9,6);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-9;key.shadow.camera.right=9;key.shadow.camera.top=9;key.shadow.camera.bottom=-9;key.shadow.bias=-.0001;key.shadow.normalBias=.04;key.shadow.radius=3;scene.add(key);
        const rim=new T.DirectionalLight(0xdbe5ff,2.8);rim.position.set(5,5,-5);scene.add(rim);
        const fill=new T.DirectionalLight(0xffc45c,1.1);fill.position.set(0,2,7);scene.add(fill);
        const shape=new T.Shape(),r=.09,x=.475,y=.475;
        shape.moveTo(-x+r,-y);shape.lineTo(x-r,-y);shape.quadraticCurveTo(x,-y,x,-y+r);shape.lineTo(x,y-r);shape.quadraticCurveTo(x,y,x-r,y);shape.lineTo(-x+r,y);shape.quadraticCurveTo(-x,y,-x,y-r);shape.lineTo(-x,-y+r);shape.quadraticCurveTo(-x,-y,-x+r,-y);shape.closePath();
        const geometry=new T.ExtrudeGeometry(shape,{depth:.96,bevelEnabled:true,bevelSegments:5,steps:2,bevelSize:.045,bevelThickness:.035});geometry.translate(0,0,-.48);
        model.values.forEach((values,j)=>values.forEach((v,i)=>{
          const color=(j?accent:muted).clone().multiplyScalar(.55+.12*i);
          const material=new T.MeshPhysicalMaterial({color,metalness:.48,roughness:.24,clearcoat:.32,clearcoatRoughness:.16,envMapIntensity:1.35});
          const mesh=new T.Mesh(geometry,material);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);s.meshes.push(mesh);

        }));
        const floor=new T.Mesh(new T.PlaneGeometry(60,60),new T.MeshLambertMaterial({color:new T.Color(css.getPropertyValue('--gamma-bg').trim()).multiplyScalar(1.4)}));floor.rotation.x=-Math.PI/2;floor.position.y=-.32;floor.receiveShadow=true;scene.add(floor);s.floor=floor;
        model.labels.forEach((name,i)=>{
          const el=document.createElement('div'),b=document.createElement('b'),span=document.createElement('span'),strong=document.createElement('strong');
          b.textContent=name;span.textContent=format(model.values[0][i],model)+' → '+format(model.values[1][i],model);strong.textContent=(model.changes[i]>=0?'+':'')+format(model.changes[i],model);
          el.dataset.winner=String(i===model.winner);el.append(b,span);root.querySelector('.cinema-segment-labels').append(el);s.labels.push(el);
        });
      }
      active=s;root.querySelector('.cinema-canvas').append(renderer.domElement);root.dataset.cinemaRenderer='webgl';root.querySelector('[data-cinema-action="split"]').disabled=false;
      recolor(s);layout(s);updateCopy(s,root.dataset.cinemaMode==='split');draw(s,root.dataset.cinemaMode==='split'?1:0);
    }catch(error){fallback(root);}
  }
  roots.forEach(root=>root.querySelector('dialog').addEventListener('keydown',event=>{event.stopPropagation();if(event.key==='Escape'){event.preventDefault();root.querySelector('dialog').close();}}));
  roots.forEach(root=>root.addEventListener('pointermove',event=>{const s=states.get(root);if(!s||s.root.dataset.cinemaRenderer!=='webgl'||reduced.matches)return;const r=root.getBoundingClientRect();s.pointer.x=(event.clientX-r.left)/r.width*2-1;s.pointer.y=(event.clientY-r.top)/r.height*2-1;draw(s,s.progress);}));
  roots.forEach(root=>root.addEventListener('pointerleave',()=>{const s=states.get(root);if(!s||reduced.matches)return;s.pointer.x=0;s.pointer.y=0;draw(s,s.progress);}));
  roots.forEach(root=>root.addEventListener('click',event=>{
    const button=event.target.closest('[data-cinema-action]');if(!button)return;
    const action=button.dataset.cinemaAction,fr=document.documentElement.lang.startsWith('fr');
    if(action==='values')root.querySelector('dialog').showModal();
    if(action==='close')root.querySelector('dialog').close();
    if(action==='tools'){
      document.body.classList.toggle('cinema-tools-visible');
      if(!document.querySelector('.gamma-studio-toolbar'))initPresenterStudio();
    }
    if(action==='split'&&active?.root===root){
      stop();const s=active,from=s.progress,to=root.dataset.cinemaMode==='total'?1:0;
      root.dataset.cinemaMode=to?'split':'total';
      updateCopy(s,to);
      button.textContent=to?(fr?'Revoir l’ensemble':'See the whole'):(fr?'D’où vient la croissance ?':'What changed?');
      if(reduced.matches){draw(s,to);return;}
      const start=performance.now();root.dataset.cinemaMoving='true';
      function animate(now){if(active!==s||printing)return;const t=Math.min((now-start)/1100,1),ease=t*t*(3-2*t);draw(s,from+(to-from)*ease);if(t<1)frame=requestAnimationFrame(animate);else{frame=0;root.dataset.cinemaMoving='false';}}
      frame=requestAnimationFrame(animate);
    }
  }));
  Reveal.on('slidechanged',activate);
  const resize=new ResizeObserver(()=>{if(active&&!printing&&active.root.dataset.cinemaRenderer==='webgl'){stop();layout(active);draw(active,active.root.dataset.cinemaMode==='split'?1:0);}});roots.forEach(root=>resize.observe(root));
  window.addEventListener('beforeprint',()=>{printing=true;stop();roots.forEach(fallback);});
  window.addEventListener('afterprint',()=>{printing=false;activate();});
  reduced.addEventListener('change',()=>{if(reduced.matches&&active&&active.root.dataset.cinemaRenderer==='webgl'){stop();draw(active,active.root.dataset.cinemaMode==='split'?1:0);}});
  window.addEventListener('gamma:theme-changed',()=>{states.forEach(recolor);if(active&&!contextLost)activate();});
  window.addEventListener('pageshow',event=>{if(event.persisted)activate();});
  window.addEventListener('pagehide',event=>{stop();if(event.persisted)return;renderer?.dispose();states.forEach(s=>{s.environment?.dispose();s.room.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});s.scene.traverse(o=>{o.geometry?.dispose();if(o.material)o.material.dispose();});});});
  activate();
}
export function cinematicJS(){return formatSpatialValue.toString().replace('formatSpatialValue','formatCinematicValue')+'\n'+initCinematicComparisons.toString();}
