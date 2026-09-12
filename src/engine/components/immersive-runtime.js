// Serialized into the standalone deck. Keep all browser dependencies inside.
function initImmersiveCharts() {
  const roots = [...document.querySelectorAll('.immersive-chart')];
  if (!roots.length) return;
  const exporting = document.documentElement.classList.contains('gamma-export') || new URLSearchParams(location.search).has('print-pdf');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width:900px)');
  const states = new Map();
  let current = null, frame = 0, gl = null, program = null, buffer = null, failed = false;
  let width = 1, height = 1, ratio = 1, vertices = [], lineCount = 0, pointCount = 0;
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  const fr = document.documentElement.lang.startsWith('fr');
  const format = (v, f = '') => {
    if (f === 'currency_m') return (v < 0 ? '-' : '') + '$' + Math.abs(v) / 1e6 + 'M';
    if (f === 'currency_k') return (v < 0 ? '-' : '') + '$' + Math.abs(v) / 1e3 + 'K';
    return String(v) + (f === 'percent' ? '%' : '');
  };
  const text = (tag, value, className) => {
    const el = document.createElement(tag); el.textContent = value;
    if (className) el.className = className;
    return el;
  };
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const rgb = css => {
    const probe = document.createElement('span');
    probe.style.color = css; document.body.append(probe);
    const value = getComputedStyle(probe).color.match(/[\d.]+/g)?.slice(0, 3).map(v => Number(v) / 255) || [1, 1, 1];
    probe.remove(); return value;
  };
  function palette(state) {
    const css = getComputedStyle(document.documentElement);
    const fallback = ['--gamma-primary', '--gamma-secondary', '--gamma-accent', '--gamma-text', '--gamma-muted'].map(key => css.getPropertyValue(key));
    const config = (chartConfigSets[activeChartTheme] || []).find(entry => entry.id === state.root.dataset.spatialChart)?.config;
    return state.model.series.map((_, i) => rgb(config?.series?.[i]?.itemStyle?.color || fallback[i % fallback.length]));
  }
  function point(model, p) {
    const n = (key, size) => ((p[key] - model.ranges[key][0]) / (model.ranges[key][1] - model.ranges[key][0]) - .5) * size;
    return [n('x', 2.8), n('y', 1.8), n('z', 1.8)];
  }
  function project(p, state) {
    const [x, y, z] = p, c = Math.cos(state.yaw), s = Math.sin(state.yaw);
    const xx = x * c + z * s, zz = -x * s + z * c;
    const zoom=state.zoom*Math.min(1,width/height/1.25);
    return [(xx * zoom / (width / height) + 1) * width / 2,
      (1 - (y * Math.cos(state.pitch) - zz * Math.sin(state.pitch)) * zoom - .10) * height / 2,
      y * Math.sin(state.pitch) + zz * Math.cos(state.pitch)];
  }
  function initGPU() {
    if (gl || failed) return Boolean(gl);
    try {
      gl = canvas.getContext('webgl', { preserveDrawingBuffer:true, alpha: true, antialias: true, powerPreference: 'low-power' });
      if (!gl) throw new Error('WebGL unavailable');
      const shader = (type, source) => {
        const result = gl.createShader(type); gl.shaderSource(result, source); gl.compileShader(result);
        if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) { gl.deleteShader(result); throw new Error('Shader compilation failed'); }
        return result;
      };
      const vs = shader(gl.VERTEX_SHADER, `
        attribute vec3 a_position; attribute vec3 a_color; attribute float a_id;
        uniform vec4 u_camera; uniform float u_selected; uniform float u_dpr; uniform float u_stride; uniform float u_focus;
        varying vec3 v_color;
        void main() {
          float c=cos(u_camera.x),s=sin(u_camera.x),cp=cos(u_camera.y),sp=sin(u_camera.y);
          float x=a_position.x*c+a_position.z*s,z=-a_position.x*s+a_position.z*c;
          gl_Position=vec4(x*u_camera.z/u_camera.w,(a_position.y*cp-z*sp)*u_camera.z+0.10,-(a_position.y*sp+z*cp)/12.0,1.0);
          float selected=step(0.0,a_id)*(1.0-step(0.1,abs(mod(a_id,u_stride)-mod(u_selected,u_stride))));
          v_color=a_color*mix(0.86+selected*0.14,0.30+selected*0.70,u_focus);
          gl_PointSize=(11.0+selected*7.0)*u_dpr;
        }`);
      const fs = shader(gl.FRAGMENT_SHADER, `
        precision mediump float; varying vec3 v_color; uniform float u_points;
        void main() {
          if(u_points>0.5 && distance(gl_PointCoord,vec2(0.5))>0.5) discard;
          gl_FragColor=vec4(v_color,1.0);
        }`);
      program = gl.createProgram(); gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);
      gl.deleteShader(vs); gl.deleteShader(fs);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Shader link failed');
      buffer = gl.createBuffer(); gl.useProgram(program); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      for (const [name, size, offset] of [['a_position', 3, 0], ['a_color', 3, 12], ['a_id', 1, 24]]) {
        const location = gl.getAttribLocation(program, name);
        gl.enableVertexAttribArray(location); gl.vertexAttribPointer(location, size, gl.FLOAT, false, 28, offset);
      }
      gl.enable(gl.DEPTH_TEST); gl.clearColor(0, 0, 0, 0);
      return true;
    } catch (_) {
      if (gl) { if (buffer) gl.deleteBuffer(buffer); if (program) gl.deleteProgram(program); gl.getExtension('WEBGL_lose_context')?.loseContext(); }
      gl = null; failed = true; return false;
    }
  }
  function geometry(state) {
    vertices = [];
    const colors = palette(state); state.colors = colors;
    const muted = rgb(getComputedStyle(document.documentElement).getPropertyValue('--gamma-muted')).map(v => v * .55);
    const vertex = (p, color, id = -2) => vertices.push(...p, ...color, id);
    const line = (a, b) => { vertex(a, muted); vertex(b, muted); };
    const model = state.model;
    const chartConfig = (chartConfigSets[activeChartTheme] || []).find(entry => entry.id === state.root.dataset.spatialChart)?.config;
    const floor = model.kind === 'bar' ? point(model, { x: 0, y: 0, z: 0 })[1] : -.9;
    for (let i = 0; i <= 4; i++) {
      const x = -1.4 + i * .7, z = -.9 + i * .45, y = -.9 + i * .45;
      line([x, floor, -.9], [x, floor, .9]); line([-1.4, floor, z], [1.4, floor, z]);
      if(model.kind==='scatter') line([-1.4, y, -.9], [-1.33, y, -.9]);
    }
    line([-1.4, -.9, -.9], [-1.4, .9, -.9]);
    state.positions = model.points.map(p => point(model, p));
    if(model.kind==='bar') {
      model.points.forEach((p,id)=>{
        const next=model.points.findIndex(q=>q.x===p.x && q.series===p.series+1);
        if(next<0)return;
        const color=colors[(p.series+1)%colors.length];
        vertex(state.positions[id],color,id);vertex(state.positions[next],color,next);
      });
    } else {
      state.positions.forEach((p,id)=>{
        vertex(p,muted,id);vertex([p[0],floor,p[2]],muted,id);
        const r=.05;
        line([p[0]-r,floor,p[2]],[p[0]+r,floor,p[2]]);
        line([p[0],floor,p[2]-r],[p[0],floor,p[2]+r]);
      });
    }
    lineCount = vertices.length / 7;
    model.points.forEach((p, id) => {
      const center = state.positions[id];
      const override = chartConfig?.series?.[p.series]?.data?.[p.index]?.itemStyle?.color;
      const color = override ? rgb(override) : colors[p.series % colors.length];
      if (model.kind === 'scatter') { vertex(center, color, id); return; }
      const halfX = Math.min(.24, 1 / model.categories.length), halfZ = Math.min(.22, .65 / model.series.length);
      const [x, y, z] = center, lo = Math.min(floor, y), hi = Math.max(floor, y);
      const corners = [[x-halfX,lo,z-halfZ],[x+halfX,lo,z-halfZ],[x+halfX,hi,z-halfZ],[x-halfX,hi,z-halfZ],
        [x-halfX,lo,z+halfZ],[x+halfX,lo,z+halfZ],[x+halfX,hi,z+halfZ],[x-halfX,hi,z+halfZ]];
      [[0,1,2,3,.65],[4,5,6,7,1],[0,4,7,3,.78],[1,5,6,2,.84],[3,2,6,7,1],[0,1,5,4,.55]].forEach(([a,b,c,d,shade]) => {
        [a,b,c,a,c,d].forEach(i => vertex(corners[i], color.map(v => v * shade), id));
      });
    });
    pointCount = vertices.length / 7 - lineCount;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    const labels = state.root.querySelector('.spatial-labels'); labels.replaceChildren(); state.labels = [];
    const label = (value, position, title = false, axis = -1) => {
      const el = text('span', value, title ? 'axis-title' : ''); labels.append(el); state.labels.push({ el, position, axis });
    };
    model.axes.forEach((name, i) => label(name, [[0,-1.3,1.08],[-1.63,1.16,.9],[1.9,-1.1,0]][i], true, i));
    for (let i = 0; i <= 4; i++) {
      const v = model.ranges.y[0] + (model.ranges.y[1] - model.ranges.y[0]) * i / 4;
      label(format(Number(v.toPrecision(6)), model.formats[1]), [-1.64, -.9 + i * .45, .9]);
    }
    if (model.kind === 'bar') {
      model.categories.forEach((name, i) => label(name, [point(model, {x:i,y:0,z:0})[0], -1.06, 1]));
      model.series.forEach((name, i) => label(name, [1.68, -1.03, point(model, {x:0,y:0,z:i})[2]]));
    } else {
      for (let i = 0; i <= 2; i++) {
        label(format(model.ranges.x[0] + (model.ranges.x[1]-model.ranges.x[0])*i/2, model.formats[0]), [-1.4+i*1.4,-1.04,1]);
        label(format(model.ranges.z[0] + (model.ranges.z[1]-model.ranges.z[0])*i/2, model.formats[2]), [1.58,-1.04,-.9+i*.9]);
      }
    }
    state.root.querySelectorAll('.spatial-legend i').forEach((el,i) => el.style.backgroundColor = 'rgb('+colors[i % colors.length].map(v=>Math.round(v*255)).join(',')+')');
  }
  function render(now = performance.now()) {
    frame = 0;
    if (!current || !gl || (document.hidden && !window.__gammaBroadcastActive) || Reveal.isOverview() || current.root.dataset.immersiveView !== 'spatial') return;
    const state = current;
    if(state.motion) {
      const progress=clamp((now-state.motion.start)/state.motion.duration,0,1), ease=1-Math.pow(1-progress,4);
      for(const key of ['yaw','pitch','zoom']) state[key]=state.motion.from[key]+(state.motion.to[key]-state.motion.from[key])*ease;
      if(progress===1)state.motion=null;
    }
    state.root.dataset.spatialMoving=String(Boolean(state.motion));
    gl.viewport(0, 0, canvas.width, canvas.height); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniform4f(gl.getUniformLocation(program, 'u_camera'), state.yaw, state.pitch, state.zoom*Math.min(1,width/height/1.25), width / height);
    gl.uniform1f(gl.getUniformLocation(program, 'u_selected'), state.selected);
    gl.uniform1f(gl.getUniformLocation(program, 'u_stride'), state.model.kind==='bar'?state.model.categories.length:state.model.points.length);
    gl.uniform1f(gl.getUniformLocation(program, 'u_focus'), state.focused?1:0);
    gl.uniform1f(gl.getUniformLocation(program, 'u_dpr'), ratio);
    gl.uniform1f(gl.getUniformLocation(program, 'u_points'), 0);
    gl.drawArrays(gl.LINES, 0, lineCount);
    gl.uniform1f(gl.getUniformLocation(program, 'u_points'), state.model.kind === 'scatter' ? 1 : 0);
    gl.drawArrays(state.model.kind === 'scatter' ? gl.POINTS : gl.TRIANGLES, lineCount, pointCount);
    state.labels.forEach(({el, position, axis}) => {
      const [x,y] = project(position, state);
      const maxWidth = el.classList.contains('axis-title') ? Math.min(200,width*.5) : state.model.kind === 'bar' ? Math.max(50,width/state.model.categories.length-12) : 130;
      const estimatedWidth=Math.min(maxWidth,el.textContent.length*7+8);
      const mobileDepthTitle = mobile.matches && state.model.kind === 'scatter' && axis === 2;
      // On a phone the projected depth title shares the lower-right corner
      // with its percentage ticks. Give that title an uncluttered viewport edge.
      el.style.left=(mobileDepthTitle ? width-estimatedWidth/2-10 : clamp(x,estimatedWidth/2+2,width-estimatedWidth/2-2))+'px';
      el.style.top=(mobileDepthTitle ? 18 : axis===0 ? height-12 : clamp(y,10,height-10))+'px';
      el.style.maxWidth = maxWidth+'px';
      el.style.overflow='hidden'; el.style.textOverflow='ellipsis';
      el.hidden = axis!==0 && (x < 12 || x > width - 12 || y < 8 || y > height - 8);
    });
    if (mobile.matches && state.model.kind === 'scatter') {
      const placed = [];
      state.labels.filter(({el}) => !el.hidden && !el.classList.contains('axis-title') && /%$/.test(el.textContent)).reverse().forEach(label => {
        const rect = label.el.getBoundingClientRect();
        const overlaps = other => Math.max(rect.left, other.left) < Math.min(rect.right, other.right) && Math.max(rect.top, other.top) < Math.min(rect.bottom, other.bottom);
        if (placed.some(overlaps)) label.el.hidden = true; else placed.push(rect);
      });
    }
    const selected = project(state.positions[state.selected], state);
    state.marker.style.left=selected[0]+'px'; state.marker.style.top=selected[1]+'px';
    state.root.dataset.spatialCamera = [state.yaw,state.pitch,state.zoom].map(v=>v.toFixed(3)).join(',');
    state.root.dataset.spatialFrames = String(Number(state.root.dataset.spatialFrames || 0) + 1);
    if(state.motion)request();
  }
  function request() { if (!frame && current && (!document.hidden || window.__gammaBroadcastActive)) frame = (window.__gammaFrame || requestAnimationFrame)(render); }
  function resize() {
    if (!current) return;
    const viewport = current.root.querySelector('.spatial-viewport');
    width = Math.max(1, viewport.clientWidth); height = Math.max(1, viewport.clientHeight);
    // Use the actual stage scale, supersample projection lines on ordinary
    // external displays, and still bound allocation on a 4K stage.
    const bounds = viewport.getBoundingClientRect();
    ratio = Math.min(2.25, Math.max(1.5, devicePixelRatio * bounds.width / width), Math.sqrt(4e6 / (width * height)));
    canvas.width = Math.max(1, Math.round(width * ratio)); canvas.height = Math.max(1, Math.round(height * ratio));
    request();
  }
  const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize);
  function readout(state) {
    const p = state.model.points[state.selected], model = state.model;
    state.root.querySelector('.spatial-selection').value = String(state.selected);
    const out = state.root.querySelector('.spatial-readout'); out.replaceChildren();
    const story=state.root.querySelector('.spatial-story');story.replaceChildren(text('b',p.name));
    if(model.kind==='bar' && model.series.length>1) {
      const first=model.points.find(q=>q.x===p.x && q.series===0);
      const last=model.points.find(q=>q.x===p.x && q.series===model.series.length-1);
      const change=last.y-first.y;
      const percent=first.y!==0 ? change/Math.abs(first.y)*100 : NaN;
      const changeText=Number.isFinite(percent) ? (percent>0?'+':'')+percent.toFixed(1)+'%' : (change>0?'+':'')+format(change,model.formats[1]);
      story.append(text('strong',changeText),text('small',model.series[0]+' → '+model.series.at(-1)),text('small',format(first.y,model.formats[1])+' → '+format(last.y,model.formats[1])));
    }
    (model.kind === 'bar' ? [1] : [0,1,2]).forEach(i => {
      out.append(text('strong', format(p['xyz'[i]], model.formats[i])), text('small', model.axes[i]));
    });
    out.append(text('small', p.name + ' · ' + model.series[p.series])); request();
  }
  function view(state, mode) {
    state.motion=null;
    state.root.dataset.spatialMoving='false';
    if (mode === 'spatial' && (exporting || failed || !initGPU())) mode = 'flat';
    state.root.dataset.immersiveView = mode;
    state.root.querySelectorAll('.spatial-views button').forEach(btn => btn.setAttribute('aria-pressed', String(btn.dataset.spatialAction === mode)));
    state.root.querySelector('[data-spatial-action="spatial"]').disabled = failed || exporting;
    if (mode === 'spatial') {
      current = state; state.root.querySelector('.spatial-viewport').prepend(canvas);
      geometry(state); resize();
    } else {
      if (current === state) { current = null; (window.__gammaCancelFrame || cancelAnimationFrame)(frame); frame = 0; }
      if (mode === 'flat') (window.__gammaFrame || requestAnimationFrame)(() => { initCharts(state.root); resizeChartsWithin(state.root); });
    }
    if (!failed) state.root.querySelector('.spatial-status').textContent = mode === 'spatial'
      ? (fr ? 'Choisissez une observation pour suivre sa trajectoire.' : 'Select an observation to follow it through the data.')
      : mode === 'flat' && state.model.kind === 'scatter'
        ? 'X / Y projection · third axis available in Values'
        : 'Values from the source data';
    if (failed) state.root.querySelector('.spatial-status').textContent = '3D unavailable · explore the 2D chart or exact values.';
  }
  function activate() {
    if(current){current.motion=null;current.root.dataset.spatialMoving='false';}
    (window.__gammaCancelFrame || cancelAnimationFrame)(frame); frame = 0; current = null; observer?.disconnect();
    const state = states.get(Reveal.getCurrentSlide()?.querySelector('.immersive-chart'));
    const mobileMode=Boolean(state && mobile.matches && !exporting);
    if (document.body.classList.contains('gamma-immersive-mobile') !== mobileMode) {
      document.body.classList.toggle('gamma-immersive-mobile', mobileMode); Reveal.layout();
    }
    if (!state || exporting) return;
    observer?.observe(state.root.querySelector('.spatial-body'));
    view(state, state.started ? state.root.dataset.immersiveView : reduced.matches ? 'flat' : 'spatial');
    if(!state.started && !reduced.matches && current===state) {
      state.yaw=-.9;state.pitch=.2;state.zoom=.53;
      moveCamera(state,{yaw:-.48,pitch:.42,zoom:.62},950);
    }
    state.started = true;
  }
  function moveCamera(state,to,duration=650) {
    state.motion=reduced.matches?null:{from:{yaw:state.yaw,pitch:state.pitch,zoom:state.zoom},to,start:performance.now(),duration};
    if(reduced.matches)Object.assign(state,to);
    state.root.dataset.spatialMoving=String(Boolean(state.motion)); request();
  }
  function camera(state, action) {
    state.motion=null;
    state.root.dataset.spatialMoving='false';
    const shots={reset:{yaw:-.48,pitch:.42,zoom:.62},profile:{yaw:-.85,pitch:.12,zoom:.68},plan:{yaw:-.18,pitch:.96,zoom:.62}};
    state.root.querySelectorAll('.spatial-shots button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.spatialAction===action)));
    if(shots[action]) { state.focused=false;moveCamera(state,shots[action]);return; }
    if (action === 'left') state.yaw -= .12;
    if (action === 'right') state.yaw += .12;
    if (action === 'up') state.pitch += .08;
    if (action === 'down') state.pitch -= .08;
    if (action === 'zoom-in') state.zoom *= 1.08;
    if (action === 'zoom-out') state.zoom /= 1.08;
    state.yaw = clamp(state.yaw, -1.1, 1.1); state.pitch = clamp(state.pitch, .08, 1);
    state.zoom = clamp(state.zoom, .4, 1.1); request();
  }
  roots.forEach(root => {
    const model = JSON.parse(root.querySelector('.spatial-model').textContent);
    const marker = text('div','','spatial-marker'); root.querySelector('.spatial-viewport').append(marker);
    const state = { root, model, marker, yaw:-.48, pitch:.42, zoom:.62, selected:0, started:false, motion:null, focused:false };
    states.set(root, state); readout(state);
    root.querySelectorAll('.spatial-views button').forEach(btn => btn.setAttribute('aria-pressed', String(btn.dataset.spatialAction === 'flat')));
    root.querySelector('.spatial-selection').addEventListener('change', e => { state.selected = Number(e.target.value);state.focused=true; readout(state); });
    root.querySelector('[data-spatial-action="reset"]').setAttribute('aria-pressed','true');
    root.addEventListener('click', e => {
      const action = e.target.closest('[data-spatial-action]')?.dataset.spatialAction;
      if (!action) return;
      e.stopPropagation();
      if (['spatial','flat','data'].includes(action)) view(state, action); else camera(state, action);
    });
    root.addEventListener('keydown', e => {
      // Native form controls keep their arrow keys; Reveal must not navigate.
      if (e.target.matches('select')) { e.stopPropagation(); return; }
      const action = { ArrowLeft:'left', ArrowRight:'right', ArrowUp:'up', ArrowDown:'down', '+':'zoom-in', '=':'zoom-in', '-':'zoom-out', Home:'reset' }[e.key];
      if (action && e.target.closest('.spatial-viewport')) { e.preventDefault(); e.stopPropagation(); camera(state, action); }
    });
    const viewport = root.querySelector('.spatial-viewport');
    let drag = null;
    viewport.addEventListener('pointerdown', e => {
      if (!e.isPrimary || e.button !== 0) return;
      state.motion=null;
      state.root.dataset.spatialMoving='false';
      e.stopPropagation(); viewport.focus({preventScroll:true}); viewport.setPointerCapture(e.pointerId);
      drag = {id:e.pointerId, x:e.clientX, y:e.clientY, moved:false};
    });
    viewport.addEventListener('pointermove', e => {
      if (!drag || drag.id !== e.pointerId) return;
      const dx=e.clientX-drag.x, dy=e.clientY-drag.y;
      if (Math.abs(dx)+Math.abs(dy)>2) drag.moved=true;
      if(drag.moved)root.querySelectorAll('.spatial-shots button').forEach(button=>button.setAttribute('aria-pressed','false'));
      state.yaw=clamp(state.yaw+dx*.006,-1.1,1.1); state.pitch=clamp(state.pitch+dy*.006,.08,1);
      drag.x=e.clientX; drag.y=e.clientY; request();
    });
    viewport.addEventListener('pointerup', e => {
      if (!drag || drag.id !== e.pointerId) return;
      if (!drag.moved && current === state) {
        const rect=viewport.getBoundingClientRect(), x=(e.clientX-rect.left)*width/rect.width, y=(e.clientY-rect.top)*height/rect.height;
        const hits=state.positions.map((p,i)=>{
          const q=project(p,state);
          let d=Math.hypot(q[0]-x,q[1]-y);
          if(model.kind==='bar') {
            const base=project([p[0],point(model,{x:0,y:0,z:0})[1],p[2]],state);
            const dx=q[0]-base[0],dy=q[1]-base[1],length=dx*dx+dy*dy;
            const t=length ? clamp(((x-base[0])*dx+(y-base[1])*dy)/length,0,1) : 0;
            d=Math.hypot(x-base[0]-dx*t,y-base[1]-dy*t);
          }
          return {i,d,depth:q[2]};
        }).filter(p=>p.d<(model.kind==='bar'?16:24)).sort((a,b)=>b.depth-a.depth);
        if (hits.length) { state.selected=hits[0].i;state.focused=true; readout(state); }
      }
      drag=null; viewport.releasePointerCapture(e.pointerId);
    });
    viewport.addEventListener('pointercancel', () => { drag=null; });
    viewport.addEventListener('lostpointercapture', () => { drag=null; });
    // Do not let touch orbit gestures advance the deck.
    viewport.addEventListener('touchstart', e => e.stopPropagation(), {passive:true});
    viewport.addEventListener('touchmove', e => e.stopPropagation(), {passive:true});
    const colors=palette(state);
    root.querySelectorAll('.spatial-legend i').forEach((el,i)=>el.style.backgroundColor='rgb('+colors[i].map(v=>Math.round(v*255)).join(',')+')');
    if (exporting) root.querySelector('.spatial-toolbar').hidden = true;
  });
  canvas.addEventListener('webglcontextlost', e => {
    e.preventDefault(); failed=true; gl=null; program=null; buffer=null;
    for (const state of states.values()) if (state.root.dataset.immersiveView === 'spatial') view(state,'flat');
  });
  canvas.addEventListener('webglcontextrestored', () => {
    failed=false; states.forEach(state => { state.root.querySelector('[data-spatial-action="spatial"]').disabled=false; });
  });
  Reveal.on('slidechanged', activate);
  Reveal.on('overviewshown', () => { (window.__gammaCancelFrame || cancelAnimationFrame)(frame); frame=0; });
  Reveal.on('overviewhidden', activate);
  Reveal.on('resize', resize);
  window.addEventListener('resize', resize);
  mobile.addEventListener('change', activate);
  window.addEventListener('gamma:theme-changed', () => {
    states.forEach(state => {
      const colors=palette(state);
      state.root.querySelectorAll('.spatial-legend i').forEach((el,i)=>el.style.backgroundColor='rgb('+colors[i].map(v=>Math.round(v*255)).join(',')+')');
    });
    if (current && gl) { geometry(current); request(); }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && !window.__gammaBroadcastActive) { (window.__gammaCancelFrame || cancelAnimationFrame)(frame); frame=0; } else request(); });
  reduced.addEventListener('change', () => { if (reduced.matches && current) view(current,'flat'); });
  const printViews = new Map();
  window.addEventListener('beforeprint', () => {
    states.forEach(state => { printViews.set(state, state.root.dataset.immersiveView); view(state, 'flat'); });
    initCharts(document); resizeChartsWithin(document);
  });
  window.addEventListener('afterprint', () => {
    printViews.forEach((mode, state) => { state.root.dataset.immersiveView=mode; });
    printViews.clear(); activate();
  });
  window.addEventListener('pagehide', e => {
    (window.__gammaCancelFrame || cancelAnimationFrame)(frame); frame=0;
    if (!e.persisted && gl) { gl.deleteBuffer(buffer); gl.deleteProgram(program); gl.getExtension('WEBGL_lose_context')?.loseContext(); }
  });
  window.addEventListener('pageshow', e => { if (e.persisted) activate(); });
  activate();
}

export function immersiveJS() { return initImmersiveCharts.toString(); }
