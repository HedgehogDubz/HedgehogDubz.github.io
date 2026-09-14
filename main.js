import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function initHedgehog() {
  const canvas = document.getElementById('hedgehog-canvas');
  const host = document.getElementById('viewer');
  const loading = document.getElementById('viewer-loading');
  if (!canvas || !host) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x06100d, 0.15);

  const camera = new THREE.PerspectiveCamera(34, 1, 0.01, 100);
  camera.position.set(0.1, 0.25, 6.3);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enablePan = false;
  controls.minDistance = 3.4;
  controls.maxDistance = 9;
  controls.autoRotate = false;

  scene.add(new THREE.HemisphereLight(0x9dffe0, 0x07100d, 2.2));
  const key = new THREE.DirectionalLight(0xffffff, 3.0);
  key.position.set(4, 4, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x39f5b4, 4.5);
  rim.position.set(-4, 0.3, -2);
  scene.add(rim);
  const fill = new THREE.PointLight(0x4effbf, 20, 12, 2);
  fill.position.set(0, -2.5, 2.4);
  scene.add(fill);

  const spinGroup = new THREE.Group();
  const tiltGroup = new THREE.Group();
  spinGroup.add(tiltGroup);
  scene.add(spinGroup);

  // Subtle wireframe orbital rings behind the model.
  const ringMat = new THREE.LineBasicMaterial({ color: 0x39f5b4, transparent: true, opacity: 0.11 });
  [1.75, 2.12].forEach((r, i) => {
    const pts = [];
    for (let j = 0; j <= 120; j++) {
      const a = (j / 120) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r * (i ? 0.82 : 1), 0));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const ring = new THREE.Line(geo, ringMat);
    ring.rotation.x = i ? 1.1 : 0.25;
    ring.rotation.y = i ? 0.3 : 1.0;
    scene.add(ring);
  });

  const material = new THREE.MeshPhysicalMaterial({
    color: 0x2de1a5,
    metalness: 0.12,
    roughness: 0.45,
    clearcoat: 0.35,
    clearcoatRoughness: 0.28,
    emissive: 0x062d21,
    emissiveIntensity: 0.42,
    side: THREE.DoubleSide,
  });

  const loader = new GLTFLoader();
  loader.load(
    'assets/hedgehog.glb',
    (gltf) => {
      const root = gltf.scene;
      root.traverse((obj) => {
        if (obj.isMesh) {
          obj.material = material;
          obj.castShadow = false;
          obj.receiveShadow = false;
        }
      });

      const box = new THREE.Box3().setFromObject(root);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      root.position.copy(center).multiplyScalar(-1);
      const fitScale = 3.55 / maxDim;
      tiltGroup.scale.setScalar(fitScale);
      tiltGroup.add(root);

      // User-requested initial orientation: X begins at exactly +90 degrees.
      tiltGroup.rotation.x = Math.PI / 2;
      tiltGroup.rotation.y = 0;
      tiltGroup.rotation.z = 0;

      host.classList.add('loaded');
      loading?.classList.add('hidden');
    },
    undefined,
    (err) => {
      console.error('Could not load hedgehog mesh:', err);
      if (loading) loading.textContent = 'mesh failed — showing fallback';
    }
  );

  const clock = new THREE.Clock();
  function resize() {
    const rect = host.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  new ResizeObserver(resize).observe(host);
  resize();

  function frame() {
    const dt = Math.min(clock.getDelta(), 0.04);
    if (!reducedMotion) spinGroup.rotation.z += dt * 0.48; // World Z-axis spin.
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  frame();
}

function fitCanvas(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.round(rect.width * dpr));
  const h = Math.max(1, Math.round(rect.height * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  return { w, h, dpr };
}

function line(ctx, points, color, width = 1) {
  if (!points.length) return;
  ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function drawMarket(canvas, t) {
  const { w, h, dpr } = fitCanvas(canvas);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle = '#07100e'; ctx.fillRect(0,0,w,h);
  const grid = 36*dpr;
  ctx.strokeStyle = 'rgba(57,245,180,.055)'; ctx.lineWidth = 1;
  for (let x=0;x<w;x+=grid){ ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke(); }
  for (let y=0;y<h;y+=grid){ ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke(); }

  const pts=[];
  for(let i=0;i<70;i++){
    const x=(i/69)*w;
    const wave=Math.sin(i*.23+t*1.2)*.10+Math.sin(i*.071+t*.7)*.08;
    const jump=(i>42?-.09:0)+(i>55?.07:0);
    const y=h*(.52+wave+jump);
    pts.push([x,y]);
  }
  ctx.shadowColor='rgba(57,245,180,.35)';ctx.shadowBlur=14*dpr;
  line(ctx,pts,'rgba(57,245,180,.92)',2*dpr);
  ctx.shadowBlur=0;
  ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.closePath();
  const grad=ctx.createLinearGradient(0,h*.35,0,h);
  grad.addColorStop(0,'rgba(57,245,180,.15)');grad.addColorStop(1,'rgba(57,245,180,0)');
  ctx.fillStyle=grad;ctx.fill();

  ctx.font=`${9*dpr}px DM Mono, monospace`; ctx.textBaseline='middle';
  for(let i=0;i<5;i++){
    const yy=h*(.18+i*.14);
    const ask = 101.42 + i*.02;
    const bid = 101.38 - i*.02;
    ctx.fillStyle='rgba(255,123,123,.55)'; ctx.fillText(ask.toFixed(2), w-82*dpr, yy);
    ctx.fillStyle='rgba(57,245,180,.65)'; ctx.fillText(bid.toFixed(2), 14*dpr, yy);
  }
  const scanX=((t*.18)%1)*w;
  ctx.fillStyle='rgba(57,245,180,.18)';ctx.fillRect(scanX,0,1*dpr,h);
}

function drawRiver(canvas, t) {
  const { w, h, dpr } = fitCanvas(canvas);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,w,h); ctx.fillStyle='#08100e';ctx.fillRect(0,0,w,h);
  const layers=[3,5,5,2];
  const nodes=[];
  layers.forEach((count,li)=>{
    const x=w*(.13+li*(.74/(layers.length-1)));
    const arr=[];
    for(let i=0;i<count;i++) arr.push([x,h*(.18+(i+.5)*(.64/count))]);
    nodes.push(arr);
  });
  ctx.lineWidth=1*dpr;
  for(let l=0;l<nodes.length-1;l++){
    nodes[l].forEach((a,ai)=>nodes[l+1].forEach((b,bi)=>{
      const pulse=(Math.sin(t*2+l+ai*.8+bi*.45)+1)/2;
      ctx.strokeStyle=`rgba(57,245,180,${.035+pulse*.09})`;
      ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();
    }));
  }
  nodes.flat().forEach((n,i)=>{
    const pulse=(Math.sin(t*2.4+i*.77)+1)/2;
    ctx.beginPath();ctx.arc(n[0],n[1],(4.4+pulse*2.3)*dpr,0,Math.PI*2);
    ctx.fillStyle=`rgba(57,245,180,${.35+pulse*.55})`;
    ctx.shadowColor='rgba(57,245,180,.28)';ctx.shadowBlur=12*dpr;ctx.fill();ctx.shadowBlur=0;
  });
  const epoch = document.querySelector('[data-counter="epoch"]');
  if(epoch) epoch.textContent = String(128 + Math.floor(t*3)%872);
}

function drawBoundary(canvas, t) {
  const { w, h, dpr } = fitCanvas(canvas);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,w,h); ctx.fillStyle='#07100e';ctx.fillRect(0,0,w,h);
  const cols=36, rows=22;
  for(let iy=0;iy<rows;iy++){
    for(let ix=0;ix<cols;ix++){
      const x=ix/(cols-1), y=iy/(rows-1);
      const v=Math.sin(x*6+t*.45)+Math.cos(y*7-t*.35)+Math.sin((x+y)*7+t*.2);
      const alpha=.018+Math.abs(v)*.016;
      ctx.fillStyle=v>0?`rgba(57,245,180,${alpha})`:`rgba(110,150,255,${alpha})`;
      ctx.fillRect(ix*w/cols,iy*h/rows,w/cols+1,h/rows+1);
    }
  }
  const ptsA=[],ptsB=[];
  for(let i=0;i<23;i++){
    const a=i*.81;
    const r=.11+(i%7)*.012;
    ptsA.push([w*(.35+Math.cos(a+t*.12)*r),h*(.48+Math.sin(a)*r*1.25)]);
    ptsB.push([w*(.65+Math.cos(a+1.6-t*.1)*r),h*(.52+Math.sin(a+1.6)*r*1.25)]);
  }
  ptsA.forEach(([x,y])=>{ctx.beginPath();ctx.arc(x,y,2.6*dpr,0,Math.PI*2);ctx.fillStyle='rgba(57,245,180,.88)';ctx.fill();});
  ptsB.forEach(([x,y])=>{ctx.beginPath();ctx.arc(x,y,2.6*dpr,0,Math.PI*2);ctx.fillStyle='rgba(139,170,255,.75)';ctx.fill();});
  const curve=[];
  for(let i=0;i<90;i++){
    const x=i/89;
    const y=.5+Math.sin(x*6+t*.22)*.07+Math.sin(x*15-t*.18)*.025;
    curve.push([x*w,y*h]);
  }
  line(ctx,curve,'rgba(240,255,250,.42)',1.2*dpr);
}

function initProjectVisuals() {
  const canvases=[...document.querySelectorAll('canvas[data-visual]')];
  if(!canvases.length) return;
  const start=performance.now();
  function tick(now){
    const t=(now-start)/1000;
    canvases.forEach(c=>{
      const kind=c.dataset.visual;
      if(kind==='market') drawMarket(c,t);
      if(kind==='river') drawRiver(c,t);
      if(kind==='boundary') drawBoundary(c,t);
    });
    if(!reducedMotion) requestAnimationFrame(tick);
  }
  tick(performance.now());
  if(reducedMotion) window.addEventListener('resize',()=>tick(performance.now()),{passive:true});
}

initHedgehog();
initProjectVisuals();
