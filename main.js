/* Mobile Frameworks Lab — cinematic scroll experience
   GSAP + ScrollTrigger. One master timeline (0 → 100) scrubbed against #scroll-space.

   0 ─ 22   Scene 1  hand + phone → camera zooms into the screen
   22 ─ 42  Scene 2  the portal (parallax between pillars / doors / city)
   42 ─ 80  Scene 3  gates swing open, camera is pushed through
   76 ─ 100 Scene 4  the plaza, three towers
*/
(() => {
'use strict';
gsap.registerPlugin(ScrollTrigger);

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const params = new URLSearchParams(location.search);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse  = matchMedia('(pointer: coarse)').matches;

/* ------------------------------------------------------------------ *
 *  Constants: phone screen size (px) & stage design size
 * ------------------------------------------------------------------ */
const SW = 282, SH = 602;           // phone screen, portrait
const IMG_W = 1024, IMG_H = 571;    // gate image

/* ------------------------------------------------------------------ *
 *  Procedural cyberpunk skyline (SVG) — used behind the gates & in the plaza
 * ------------------------------------------------------------------ */
function rng(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

function winPattern(id, R, color, cw, ch, cols, rows, p){
  let r = '';
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++)
    if (R() < p) r += `<rect x="${(i*cw+cw*.2).toFixed(1)}" y="${(j*ch+ch*.22).toFixed(1)}" width="${(cw*.6).toFixed(1)}" height="${(ch*.5).toFixed(1)}" fill="${color}" opacity="${(.4+R()*.6).toFixed(2)}"/>`;
  return `<pattern id="${id}" width="${cols*cw}" height="${rows*ch}" patternUnits="userSpaceOnUse">${r}</pattern>`;
}

function skylineSVG(pfx, o){
  const R = rng(o.seed), {X0,Y0,W,H,HOR} = o;
  let defs = `
    <linearGradient id="${pfx}sky" gradientUnits="userSpaceOnUse" x1="0" y1="${Y0}" x2="0" y2="${HOR}">
      ${(o.sky||[]).map(([f,c])=>`<stop offset="${f}" stop-color="${c}"/>`).join('')}
    </linearGradient>
    <linearGradient id="${pfx}haze" gradientUnits="userSpaceOnUse" x1="0" y1="${HOR-260}" x2="0" y2="${HOR}">
      <stop offset="0" stop-color="${o.haze||'#9b7fd6'}" stop-opacity="0"/><stop offset="1" stop-color="${o.haze||'#9b7fd6'}" stop-opacity=".5"/>
    </linearGradient>
    <radialGradient id="${pfx}glow"><stop offset="0" stop-color="#ff6fe0" stop-opacity=".55"/><stop offset=".5" stop-color="#6a7bff" stop-opacity=".18"/><stop offset="1" stop-color="#6a7bff" stop-opacity="0"/></radialGradient>
    ${winPattern(pfx+'w1',R,'#7fe9ff',3.4,5,16,14,.24)}
    ${winPattern(pfx+'w2',R,'#ffb766',3.4,5,16,14,.2)}
    ${winPattern(pfx+'w3',R,'#ff7bf2',3.4,5,16,14,.16)}`;
  let b = '';
  if (o.sky){
    b += `<rect x="${X0}" y="${Y0}" width="${W}" height="${H}" fill="url(#${pfx}sky)"/>`;
    for (let i = 0; i < 110; i++) b += `<circle cx="${(X0+R()*W).toFixed(0)}" cy="${(Y0+R()*(HOR-Y0)*.7).toFixed(0)}" r="${(.5+R()*1.1).toFixed(1)}" fill="#fff" opacity="${(.2+R()*.7).toFixed(2)}"/>`;
    b += `<ellipse cx="${X0+W/2}" cy="${HOR-60}" rx="${W*.3}" ry="260" fill="url(#${pfx}glow)"/>`;
  }
  if (o.photo){
    defs += `
    <linearGradient id="${pfx}hf" gradientUnits="userSpaceOnUse" x1="257" y1="0" x2="766" y2="0"><stop offset="0" stop-color="#000"/><stop offset=".14" stop-color="#fff"/><stop offset=".86" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>
    <linearGradient id="${pfx}vf" gradientUnits="userSpaceOnUse" x1="0" y1="-10" x2="0" y2="214"><stop offset="0" stop-color="#000"/><stop offset=".16" stop-color="#fff"/><stop offset=".6" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>
    <mask id="${pfx}mh" maskUnits="userSpaceOnUse" x="257" y="-520" width="509" height="740"><rect x="257" y="-520" width="509" height="740" fill="url(#${pfx}hf)"/></mask>
    <mask id="${pfx}mv" maskUnits="userSpaceOnUse" x="-700" y="-520" width="2424" height="740"><rect x="-700" y="-520" width="2424" height="740" fill="url(#${pfx}vf)"/></mask>`;
    b += `<g mask="url(#${pfx}mh)"><g mask="url(#${pfx}mv)"><image href="Gemini_Generated_Image_dlj23adlj23adlj2.jpeg" x="0" y="0" width="1024" height="571" preserveAspectRatio="none"/></g></g>`;
  }
  if (o.streaks){
    defs += `<linearGradient id="${pfx}st1"><stop offset="0" stop-color="#35e0ff" stop-opacity="0"/><stop offset=".7" stop-color="#35e0ff"/><stop offset="1" stop-color="#fff"/></linearGradient>
             <linearGradient id="${pfx}st2"><stop offset="0" stop-color="#ffb347" stop-opacity="0"/><stop offset=".7" stop-color="#ffb347"/><stop offset="1" stop-color="#fff"/></linearGradient>`;
  }
  const edges = ['#35e0ff','#ff3df0','#ffb347'];
  o.layers.forEach((L, li) => {
    let x = X0 - 60;
    while (x < X0 + W + 60){
      const w = L.wmin + R()*(L.wmax-L.wmin), h = L.hmin + R()*(L.hmax-L.hmin), y = HOR - h;
      const k = 1 + Math.floor(R()*3);
      b += `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${w.toFixed(0)}" height="${(h+4).toFixed(0)}" fill="${L.fill}"/>`;
      if (L.win) b += `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" fill="url(#${pfx}w${k})" opacity="${L.win}"/>`;
      if (R() < .45){ const w2 = w*(.45+R()*.3), h2 = 12+R()*h*.18;
        b += `<rect x="${(x+(w-w2)/2).toFixed(0)}" y="${(y-h2).toFixed(0)}" width="${w2.toFixed(0)}" height="${h2.toFixed(0)}" fill="${L.fill}"/>`;
        if (L.edge && R()<.6) b += `<rect x="${(x+(w-w2)/2).toFixed(0)}" y="${(y-h2).toFixed(0)}" width="${w2.toFixed(0)}" height="1.4" fill="${edges[k-1]}" opacity=".8"/>`; }
      if (R() < .28) b += `<path d="M${(x+w/2).toFixed(0)} ${y.toFixed(0)}v${-(14+R()*34).toFixed(0)}" stroke="${L.fill}" stroke-width="1.6"/><circle cx="${(x+w/2).toFixed(0)}" cy="${(y-12).toFixed(0)}" r="1.8" fill="#ff4d6d" class="blink"/>`;
      if (L.edge) b += `<path d="M${x.toFixed(0)} ${HOR} V${y.toFixed(0)} H${(x+w).toFixed(0)} V${HOR}" fill="none" stroke="${edges[(k+li)%3]}" stroke-opacity="${L.edge}" stroke-width="1.3"/>`;
      x += w + R()*L.gap;
    }
    b += `<rect x="${X0}" y="${HOR-260}" width="${W}" height="260" fill="url(#${pfx}haze)" opacity="${L.haze ?? .6}"/>`;
  });
  if (o.streaks){
    [['M-500 330 C-100 230 300 380 700 270 S1300 150 1700 190','1',0,8],['M1700 300 C1300 360 900 250 500 330 S-200 280 -600 360','2',-3,10],['M-400 250 C0 330 500 190 900 250 S1500 330 1800 240','1',-6,12]].forEach(([d,k,dl,du]) => {
      b += `<path class="streak" d="${d}" fill="none" stroke="url(#${pfx}st${k})" stroke-width="2.2" stroke-linecap="round" pathLength="1000" style="animation-duration:${du}s;animation-delay:${dl}s"/>`; });
  }
  (o.heroes||[]).forEach(hh => {
    const x = hh.x, w = hh.w, y = HOR - hh.h;
    b += `<rect x="${x}" y="${y}" width="${w}" height="${hh.h+4}" fill="#0b0f36"/>
          <rect x="${x}" y="${y}" width="${w}" height="${hh.h}" fill="url(#${pfx}w${hh.k})" opacity=".9"/>
          <path d="M${x} ${HOR} V${y} H${x+w} V${HOR}" fill="none" stroke="${hh.c}" stroke-width="2.2" stroke-opacity=".95"/>
          <path d="M${x+w*.5} ${y} v-60" stroke="${hh.c}" stroke-width="2"/><circle cx="${x+w*.5}" cy="${y-62}" r="3" fill="${hh.c}" class="blink"/>`;
  });
  return `<svg class="${o.cls||'city-svg'}" viewBox="${X0} ${Y0} ${W} ${H}" ${o.size?`width="${W}" height="${H}" style="left:${X0}px;top:${Y0}px"`:''} ${o.pa?`preserveAspectRatio="${o.pa}"`:''} aria-hidden="true"><defs>${defs}</defs>${b}</svg>`;
}

/* ------------------------------------------------------------------ *
 *  Gate stage — built twice: once inside the phone, once full-screen
 * ------------------------------------------------------------------ */
// door top profile (left half, stage px); right half is mirrored about x=511.5
const CURVE = [[243,132],[262,142],[300,160],[350,178],[400,191],[450,200],[487,203],[511.5,203]];
const mir = p => [1023 - p[0], p[1]];
const poly = pts => `polygon(${pts.map(p => p[0].toFixed(1)+'px '+p[1].toFixed(1)+'px').join(',')})`;
const doorL = poly([...CURVE, [511.5,506], [243,506]]);
const doorR = poly([...CURVE.map(mir), [511.5,506], [780,506]]);
const leftC = [[257,146],[262,147],[300,165],[350,183],[400,196],[450,205],[487,208],[511.5,208]];
const skyK  = poly([[257,-5],[766,-5], ...leftC.map(mir), ...leftC.slice().reverse()]);

function stageHTML(id){
  const city = skylineSVG(id, {
    seed: 11, X0: -700, Y0: -520, W: 2424, H: 1226, HOR: 506, size: true, cls: 'city-svg', photo: true, streaks: true,
    sky: [[0,'#0c1342'],[.45,'#2c3586'],[.8,'#7a78bd'],[1,'#b79bd8']],
    haze: '#a58bd6',
    layers: [
      {wmin:26,wmax:60, hmin:90, hmax:250, fill:'#262e8a', win:.45, edge:.45, gap:5,  haze:.7},
      {wmin:34,wmax:80, hmin:80, hmax:260, fill:'#161c5c', win:.7,  edge:.65, gap:12, haze:.5},
      {wmin:44,wmax:100,hmin:50, hmax:190, fill:'#0a0d2d', win:.85, edge:.9,  gap:34, haze:.3}
    ]
  });
  return `
  <div class="st-city"><div class="mx" data-d="9">${city}</div></div>
  <div class="st-spill"></div>
  <div class="st-near"><div class="mx" data-d="3">
    <div class="lyr lyr-sky" style="clip-path:${skyK}"></div>
    <div class="lyr lyr-frame"></div>
    <div class="doors">
      <div class="door door-l" style="clip-path:${doorL}"></div>
      <div class="door door-r" style="clip-path:${doorR}"></div>
    </div>
    <div class="lamp" style="left:178px;top:252px"></div>
    <div class="lamp" style="left:846px;top:252px"></div>
  </div></div>`;
}

const worldEl = $('#world');
const worldStage = document.createElement('div');
worldStage.className = 'stage'; worldStage.innerHTML = stageHTML('w');
worldEl.appendChild(worldStage);
const phoneStage = $('#phoneStage');
phoneStage.classList.add('stage'); phoneStage.innerHTML = stageHTML('p');

const W = {
  stage: worldStage,
  city:  $('.st-city', worldStage), spill: $('.st-spill', worldStage), near: $('.st-near', worldStage),
  sky:   $('.lyr-sky', worldStage), frame: $('.lyr-frame', worldStage),
  doors: $('.doors', worldStage), dl: $('.door-l', worldStage), dr: $('.door-r', worldStage)
};

/* Debug helper: ?debug shows the door / sky clip regions */
if (params.has('debug')){
  const st = document.createElement('style');
  st.textContent = `.door-l{outline:0;background-color:rgba(255,0,0,.35);background-blend-mode:multiply}.door-r{background-color:rgba(0,255,0,.35);background-blend-mode:multiply}.lyr-sky{background-color:rgba(0,0,255,.35);background-blend-mode:multiply}`;
  document.head.appendChild(st);
}

/* ------------------------------------------------------------------ *
 *  Phone home screen icons
 * ------------------------------------------------------------------ */
{
  const g = ['#7cf,#a6f','#fa7,#f68','#7f9,#3bc','#ff7,#fb4','#f9c,#c7f','#9cf,#58f','#fc8,#f77','#8fd,#4c9'];
  $('#icons').innerHTML = Array.from({length:12},(_,i)=> i===5 ? '<i class="lab"></i>' : `<i style="background:linear-gradient(135deg,${g[i%g.length]})"></i>`).join('');
}

/* ------------------------------------------------------------------ *
 *  Scene 4 — plaza: skyline layers, trails, towers
 * ------------------------------------------------------------------ */
$('#pl-far .mx').innerHTML = skylineSVG('pf', {
  seed: 5, X0: 0, Y0: 0, W: 1920, H: 900, HOR: 900, cls: 'sk', pa: 'xMidYMax slice', haze: '#d68bd9',
  layers: [{wmin:36,wmax:84, hmin:240,hmax:620, fill:'#1a1f6a', win:.18, edge:.2, gap:8, haze:.9}]
});
$('#pl-mid .mx').innerHTML = skylineSVG('pm', {
  seed: 9, X0: 0, Y0: 0, W: 1920, H: 900, HOR: 900, cls: 'sk', pa: 'xMidYMax slice', haze: '#8a68c8',
  layers: [{wmin:50,wmax:120, hmin:200,hmax:520, fill:'#0b0e3a', win:.26, edge:.3, gap:30, haze:.7}]
});

{
  const box = $('#pl-trails'); const cols = ['#35e0ff','#ff3df0','#ffb347','#7fe9ff','#ff7bf2','#ffd27a'];
  for (let i = 0; i < 7; i++){
    const d = document.createElement('div'); d.className = 'trail';
    d.style.cssText = `top:${10 + Math.random()*46}%;width:${90+Math.random()*180}px;--c:${cols[i%cols.length]}`;
    box.appendChild(d);
    if (!reduced) gsap.fromTo(d, {x: () => -400}, {x: () => innerWidth + 400, duration: 5 + Math.random()*7, delay: Math.random()*6, repeat: -1, ease: 'none', repeatRefresh: true});
  }
}

const PILLARS = [
  { n:'01', t:'Orbit - Core Platform Engineering', acc:'#35e0ff', cls:'t1',
    short:'One stop shop for all mobile development.',
    lead:'We provide the basic capabilities to create, build test and distribute a mobile application.',
    list:['Core components and patterns, SDKs management ','Build pipelines','Testing framework and device farm', 'Release and distribution management'],
    tags:['Kotlin','Swift','Appium','BrowserStack','GitHub Actions','MacStadium'],
    ct:.07, path:'M30 600 V300 H50 V230 H72 V160 H128 V230 H150 V300 H170 V600 Z', extra:'<path class="tw-edge" d="M100 160 V52" fill="none" stroke-width="2"/><path class="tw-edge" d="M82 90 H118 M88 118 H112" fill="none" stroke-width="1.6"/>', beacon:[100,48] },
  { n:'02', t:'Phylax - Mobile Security', acc:'#ff3df0', cls:'t2',
    short:'A multi-layered approach to mobile security.',
    lead:'Our comprehensive solution for mobile security.',
    list:['Malware and threat detection, Jailbreak/Root detection, RASP','Device Binding and Trust services','Device Integrity Score','Mobile Security patterns and advisory'],
    tags:['GoLang','Cryptomathic MASC','Kotlin','Swift','Frida','Burp Suite'],
    ct:.0, path:'M45 600 V250 L75 140 L100 40 L125 140 L155 250 V600 Z', extra:'<path class="tw-edge" d="M100 40 V0" fill="none" stroke-width="2"/><path class="tw-edge" d="M62 200 L138 200 M52 232 L148 232" fill="none" stroke-width="1.6"/><path class="tw-edge" d="M100 70 L116 100 L100 130 L84 100 Z" fill="none" stroke-width="1.6"/>', beacon:[100,-2] },
  { n:'03', t:'Analytics', acc:'#ffb347', cls:'t3',
    short:'Data-driven insights for better decision making.',
    lead:'We provide the tools and expertise to collect and analyze data from our mobile and web applications.',
    list:['Journey tagging','A/B testing',' Cookie consent Management'],
    tags:['Tealium','Adobe Target','TagMaker','JavaScript'],
    ct:.1, path:'M25 600 V210 L175 130 V600 Z', extra:'<path class="tw-edge" d="M140 150 V96" fill="none" stroke-width="2"/><circle class="tw-edge" cx="140" cy="86" r="12" fill="none" stroke-width="1.8"/><path class="tw-edge" d="M25 330 H175 M25 450 H175" fill="none" stroke-width="1.4"/>', beacon:[140,72] }
];

function towerSVG(p, idx){
  const R = rng(100 + idx*17), id = 'tw' + idx;
  const pat = (k, cw, ch, cols, rows, pr) => winPattern(`${id}p${k}`, R, p.acc, cw, ch, cols, rows, pr);
  let fl = '';
  for (let i = 0; i < 26; i++){
    fl += `<rect class="fl" x="${(30 + R()*140).toFixed(0)}" y="${(160 + R()*430).toFixed(0)}" width="4" height="5" fill="#fff" style="animation-duration:${(1.6+R()*3).toFixed(1)}s;animation-delay:${(-R()*4).toFixed(1)}s"/>`;
  }
  return `<svg viewBox="0 0 200 600" preserveAspectRatio="none" aria-hidden="true" style="--acc:${p.acc}">
    <defs>
      <linearGradient id="${id}g" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stop-color="${p.acc}" stop-opacity=".75"/><stop offset=".28" stop-color="#1b2788" stop-opacity=".97"/><stop offset="1" stop-color="#0a0e3a"/>
      </linearGradient>
      <linearGradient id="${id}s" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${p.acc}" stop-opacity="0"/><stop offset=".5" stop-color="${p.acc}" stop-opacity=".35"/><stop offset="1" stop-color="${p.acc}" stop-opacity="0"/></linearGradient>
      <clipPath id="${id}c"><path d="${p.path}"/></clipPath>
      ${pat(1,5,7,8,10,.42)}${pat(2,4.2,6,10,12,.3)}
    </defs>
    <path d="${p.path}" fill="url(#${id}g)"/>
    <g clip-path="url(#${id}c)">
      <rect class="win" width="200" height="600" fill="url(#${id}p1)" opacity="0"/>
      <rect class="win" width="200" height="600" fill="url(#${id}p2)" opacity="0"/>
      <g class="win" opacity="0">${fl}</g>
      <rect class="scan" width="200" height="140" fill="url(#${id}s)"/>
    </g>
    <path class="tw-edge" d="${p.path}" fill="none" stroke-width="2.8" stroke-linejoin="round"/>
    ${p.extra}
    <circle class="beacon" cx="${p.beacon[0]}" cy="${p.beacon[1]}" r="4" fill="${p.acc}"/>
  </svg>`;
}

$('#towers').innerHTML = PILLARS.map((p,i)=>`
  <button class="tower ${p.cls}" data-i="${i}" style="--acc:${p.acc};--ct:${p.ct}" aria-label="Open pillar ${p.n}: ${p.t}">
    <span class="tip"><b>${p.n}</b><span class="tip-t">${p.t}</span>
      <span class="tip-x"><span><span class="tip-d">${p.short}</span><span class="tip-c">Explore pillar →</span></span></span></span>
    <span class="beam"></span>
    <span class="tw-inner">${towerSVG(p,i)}</span>
    <span class="pad"></span>
  </button>`).join('');

/* pillar dialog */
const dlg = $('#pillar');
$$('.tower').forEach(btn => btn.addEventListener('click', () => {
  const p = PILLARS[+btn.dataset.i];
  dlg.style.setProperty('--acc', p.acc);
  $('#pl-num').textContent = `Pillar ${p.n}`;
  $('#pl-title').textContent = p.t;
  $('#pl-lead').textContent = p.lead;
  $('#pl-list').innerHTML = p.list.map(x => `<li>${x}</li>`).join('');
  $('#pl-tags').innerHTML = p.tags.map(x => `<span>${x}</span>`).join('');
  dlg.showModal();
  if (!reduced) gsap.fromTo($('.pd-body', dlg), {y:30, opacity:0, scale:.96}, {y:0, opacity:1, scale:1, duration:.6, ease:'power3.out'});
}));
dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });

/* ------------------------------------------------------------------ *
 *  Layout (re-computed on every ScrollTrigger refresh)
 * ------------------------------------------------------------------ */
let VW, VH, land, ps, sEnd, kEnd, kBase, kPhone;
function applyLayout(){
  VW = innerWidth; VH = innerHeight; land = VW >= VH;
  ps    = Math.min(VH * .5 / 620, VW * .8 / 300);                         // phone resting scale
  sEnd  = (land ? Math.max(VW / SH, VH / SW) : Math.max(VW / SW, VH / SH)) * 1.02; // screen covers viewport
  kPhone = land ? SH / IMG_W : SW / 560;                                  // stage scale inside the phone
  kEnd  = kPhone * sEnd;                                                  // same stage scale at full screen
  kBase = land ? Math.max(VW / IMG_W, VH / IMG_H) * 1.03 : kEnd;          // settled scale of the gate
  gsap.set(phoneStage, { xPercent:-50, yPercent:-50, rotation: land ? 90 : 0, scale: kPhone });
}
applyLayout();
gsap.set(worldStage, { xPercent:-50, yPercent:-50 });
ScrollTrigger.addEventListener('refreshInit', applyLayout);

/* ------------------------------------------------------------------ *
 *  Sparkle canvas (ambient bokeh + magical burst)
 * ------------------------------------------------------------------ */
const cv = $('#sparks'), cx = cv.getContext('2d');
let DPR = 1, sparkOn = !reduced;
function sizeCanvas(){ DPR = Math.min(devicePixelRatio || 1, 2); cv.width = innerWidth * DPR; cv.height = innerHeight * DPR; cx.setTransform(DPR,0,0,DPR,0,0); }
sizeCanvas();
function sprite(size, stops){
  const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d');
  const gr = g.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);
  stops.forEach(([o,col]) => gr.addColorStop(o,col)); g.fillStyle = gr; g.fillRect(0,0,size,size); return c;
}
const spGold  = sprite(64, [[0,'rgba(255,255,255,1)'],[.18,'rgba(255,236,170,.95)'],[.5,'rgba(255,190,110,.28)'],[1,'rgba(255,170,90,0)']]);
const spCyan  = sprite(64, [[0,'rgba(255,255,255,1)'],[.2,'rgba(170,240,255,.9)'],[.55,'rgba(120,180,255,.25)'],[1,'rgba(120,180,255,0)']]);
const spBokeh = sprite(128,[[0,'rgba(255,255,255,.55)'],[.7,'rgba(255,255,255,.22)'],[.92,'rgba(255,255,255,.5)'],[1,'rgba(255,255,255,0)']]);
const bokeh = Array.from({length: coarse ? 12 : 24}, () => ({x:Math.random(), y:Math.random(), r:14+Math.random()*52, a:.15+Math.random()*.45, vx:(Math.random()-.5)*.00004, vy:-.00002-Math.random()*.00005, ph:Math.random()*6.28}));
const sparks = [];
function burst(x, y, n, spd = 5){
  for (let i = 0; i < n; i++){
    const a = Math.random()*Math.PI*2, s = (.3 + Math.random()) * spd;
    sparks.push({x, y, vx:Math.cos(a)*s, vy:Math.sin(a)*s - 1.2, life:1, dec:.006 + Math.random()*.013, size:6 + Math.random()*13, sp: Math.random()<.7 ? spGold : spCyan, tw:Math.random()*6});
  }
}
let last = performance.now();
gsap.ticker.add((time) => {
  if (!sparkOn){ if (cv.dataset.clear !== '1'){ cx.clearRect(0,0,VW,VH); cv.dataset.clear = '1'; } return; }
  cv.dataset.clear = '0';
  const now = performance.now(), dt = Math.min(now - last, 50) / 16.7; last = now;
  cx.clearRect(0,0,VW,VH);
  cx.globalCompositeOperation = 'source-over';
  for (const b of bokeh){
    b.x += b.vx * dt * 16; b.y += b.vy * dt * 16; if (b.y < -.1) { b.y = 1.1; b.x = Math.random(); }
    cx.globalAlpha = b.a * (.6 + .4*Math.sin(time*.6 + b.ph));
    const r = b.r * (VH/900 + .4); cx.drawImage(spBokeh, b.x*VW - r, b.y*VH - r, r*2, r*2);
  }
  // trickle around the phone while it rests in the hand
  if (cv.dataset.trickle === '1' && Math.random() < .35){
    const r = $('#phone').getBoundingClientRect(); const a = Math.random()*6.28;
    burst(r.left + r.width/2 + Math.cos(a)*r.width*.7, r.top + r.height/2 + Math.sin(a)*r.height*.55, 1, .5);
  }
  cx.globalCompositeOperation = 'lighter';
  for (let i = sparks.length - 1; i >= 0; i--){
    const s = sparks[i]; s.x += s.vx*dt; s.y += s.vy*dt; s.vy += .05*dt; s.vx *= .985; s.life -= s.dec*dt;
    if (s.life <= 0){ sparks.splice(i,1); continue; }
    cx.globalAlpha = Math.min(1, s.life*1.6) * (.65 + .35*Math.sin(time*14 + s.tw));
    const z = s.size * (.4 + s.life*.6); cx.drawImage(s.sp, s.x - z/2, s.y - z/2, z, z);
  }
  cx.globalAlpha = 1;
});

/* ------------------------------------------------------------------ *
 *  Master scroll timeline
 * ------------------------------------------------------------------ */
const holder = $('#holder'), phone = $('#phone');
gsap.set('#world', { autoAlpha: 0 });
gsap.set('#plaza', { autoAlpha: 0 });

const tl = gsap.timeline({
  defaults: { ease: 'none' },
  scrollTrigger: {
    trigger: '#scroll-space', start: 'top top', end: 'bottom bottom',
    scrub: reduced ? true : 1.8, invalidateOnRefresh: true,
    onUpdate: self => onProgress(tl.time())
  }
});

/* ---- Scene 1 : zoom into the screen ---- */
tl.fromTo(holder, { scale: () => ps }, { scale: () => sEnd, ease: 'power2.inOut', duration: 22 }, 0)
  .to(phone,  { rotation: () => land ? -90 : 0, ease: 'power2.inOut', duration: 18 }, 3)
  .to('.hand-part', { autoAlpha: 0, duration: 5, ease: 'power1.in' }, 0)
  .to('#cap1', { autoAlpha: 0, y: -30, duration: 4, ease: 'power1.in' }, 0.5)
  .to('#bg1', { opacity: 0, duration: 9 }, 12)
  .to('.home-ui', { opacity: 0, scale: 1.25, duration: 5, ease: 'power1.in' }, 8.5)
  .fromTo(phoneStage, { opacity: 0 }, { opacity: 1, duration: 7, ease: 'power1.inOut' }, 13)
  .to('.glare', { opacity: 0, duration: 6 }, 10)
  .set(holder, { autoAlpha: 0 }, 22)
  .set('#world', { autoAlpha: 1 }, 22);

/* ---- Scene 2 : portal parallax ---- */
tl.fromTo(W.stage, { scale: () => kEnd }, { scale: () => kBase, ease: 'power2.out', duration: 9 }, 22)
  .fromTo(W.near, { scale: 1 }, { scale: 1.1, duration: 28 }, 22)
  .fromTo(W.city, { scale: 1 }, { scale: 1.04, duration: 28 }, 22);

/* ---- Scene 3 : gates open, push through ---- */
tl.to(W.sky,  { opacity: 0, duration: 8, ease: 'power1.inOut' }, 43)
  .to(W.dl,   { rotationY: -86, duration: 26, ease: 'power2.inOut' }, 42)
  .to(W.dr,   { rotationY:  86, duration: 26, ease: 'power2.inOut' }, 42)
  .to(W.doors,{ opacity: 0, duration: 5, ease: 'power1.in' }, 66)
  .to(W.spill,{ opacity: 1, duration: 16, ease: 'power1.in' }, 44)
  .to(W.near, { scale: 3.2, duration: 32, ease: 'power2.in' }, 50)
  .to(W.city, { scale: 1.55, duration: 32, ease: 'power1.in' }, 50)
  .to(W.frame,{ opacity: 0, duration: 8, ease: 'power1.in' }, 74)
  .to(W.spill,{ opacity: 0, duration: 10 }, 72)
  .to('#world',{ autoAlpha: 0, duration: 10, ease: 'power1.inOut' }, 79);

/* ---- Scene 4 : the plaza ---- */
tl.fromTo('#plaza', { autoAlpha: 0 }, { autoAlpha: 1, duration: 10, ease: 'power1.inOut' }, 76);
[['#pl-sky',.9,28],['#pl-far',.78,30],['#pl-mid',.6,32],['#pl-towers',.5,34],['#pl-floor',.45,32],['#pl-fog',.6,30],['#pl-glow',.6,30]]
  .forEach(([s, from, d]) => tl.fromTo(s, { scale: from }, { scale: 1, duration: d, ease: 'power3.out' }, 76));
tl.fromTo('.tower', { opacity: 0 }, { opacity: 1, duration: 8, stagger: 2, ease: 'power1.out' }, 80)
  .to('.tower .win', { opacity: 1, duration: 8, stagger: 1.2, ease: 'power1.in' }, 84)
  .fromTo('.tower .tip', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 4, stagger: 1.5, ease: 'power2.out' }, 92);

/* ---- Captions ---- */
const capIn  = (id, t, dur = 4) => tl.fromTo(id, { autoAlpha: 0, y: 36 }, { autoAlpha: 1, y: 0, duration: dur, ease: 'power2.out' }, t);
const capOut = (id, t, dur = 3) => tl.to(id, { autoAlpha: 0, y: -26, duration: dur, ease: 'power1.in' }, t);
capIn('#cap2', 24);  capOut('#cap2', 39);
capIn('#cap3', 46);  capOut('#cap3', 67);
capIn('#cap4', 90, 5);
tl.fromTo('#scrim', { opacity: 0 }, { opacity: 1, duration: 4 }, 22)
  .to('#scrim', { opacity: 0, duration: 3 }, 72)
  .to('#scrim', { opacity: 1, duration: 4 }, 90);

/* ---- Flash as we pass through the gates ---- */
const flash = document.createElement('div');
flash.id = 'flash';
flash.style.cssText = 'position:absolute;inset:0;z-index:15;pointer-events:none;opacity:0;mix-blend-mode:screen;background:radial-gradient(circle at 50% 62%,rgba(190,245,255,.95),rgba(255,120,230,.45) 40%,transparent 72%)';
$('#viewport').appendChild(flash);
tl.to(flash, { opacity: .55, duration: 6, ease: 'power2.in' }, 68).to(flash, { opacity: 0, duration: 10, ease: 'power2.out' }, 74);

tl.to({}, { duration: .01 }, 99.99);    // total length = 100

/* ------------------------------------------------------------------ *
 *  Progress-driven UI state
 * ------------------------------------------------------------------ */
const chapterEls = $$('.chapters li');
let chap = -1, idle = null, idleOff = false;
function onProgress(t){
  const c = t < 22 ? 0 : t < 42 ? 1 : t < 80 ? 2 : 3;
  if (c !== chap){ chap = c; chapterEls.forEach((el,i) => el.classList.toggle('on', i === c)); }
  document.body.classList.toggle('dark', t > 12);
  document.body.classList.toggle('live', t > 92);
  sparkOn = !reduced && t < 14;
  if (t > .3 && !idleOff && idle){ idleOff = true; idle.pause(); gsap.to('#floater', { y: 0, rotation: 0, duration: .5, overwrite: 'auto' }); cv.dataset.trickle = '0'; }
  else if (t <= .3 && idleOff && idle){ idleOff = false; idle.resume(); cv.dataset.trickle = '1'; }
  gsap.to('#hint', { opacity: t < .5 && !document.body.classList.contains('intro') ? 1 : 0, duration: .4, overwrite: 'auto' });
}

/* ------------------------------------------------------------------ *
 *  Mouse parallax (world + plaza layers)
 * ------------------------------------------------------------------ */
if (!coarse && !reduced){
  const items = $$('#world .mx, #plaza .mx').map(el => ({
    d: +el.dataset.d, qx: gsap.quickTo(el, 'x', { duration: 1.4, ease: 'power3.out' }), qy: gsap.quickTo(el, 'y', { duration: 1.4, ease: 'power3.out' })
  }));
  addEventListener('pointermove', e => {
    const nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5;
    items.forEach(it => { it.qx(-nx * it.d * 2); it.qy(-ny * it.d); });
  }, { passive: true });
}

/* ------------------------------------------------------------------ *
 *  Intro: the hand opens, the phone drops, sparkles
 * ------------------------------------------------------------------ */
const og = (_, el) => `${el.dataset.ox} ${el.dataset.oy}`;
const OPEN  = [-15, -6, 3, 13], CLOSED = [9, 4, -2, -7], CURL = [11, 5, -2, -9];

gsap.set('.fb, .ff, .thumb, .thumb-f', { svgOrigin: og });
gsap.set('.fb',      { scaleY: .42, rotation: i => CLOSED[i] });
gsap.set('#th-b',    { scaleY: .5, rotation: 4 });
gsap.set('.ff, #th-f', { opacity: 0 });
gsap.set('#floater', { opacity: 0, y: 90 });

function dropFrom(){ return -((VH / 2 + 330 * ps) / ps) - 60; }
gsap.set('#phone-drop', { y: dropFrom, rotation: -16, transformOrigin: '50% 50%' });
gsap.set('#cap1', { autoAlpha: 0, y: 30 });

function startIdle(){
  if (reduced) return;
  idle = gsap.timeline({ repeat: -1, yoyo: true, defaults: { ease: 'sine.inOut' } })
    .to('#floater', { y: -12, rotation: 1.2, duration: 3 });
  cv.dataset.trickle = '1';
}

function phoneCenter(){ const r = phone.getBoundingClientRect(); return [r.left + r.width/2, r.top + r.height/2]; }

function buildIntro(){
  const t = gsap.timeline({ onComplete(){
    document.body.classList.remove('intro'); ScrollTrigger.refresh(); startIdle();
    onProgress(tl.time()); gsap.to('#hint', { opacity: tl.time() < .5 ? 1 : 0, duration: 1 });
  }});
  t.to('#floater', { opacity: 1, y: 0, duration: 1.4, ease: 'power3.out' }, .2)
   // the hand opens
   .to('.fb',   { scaleY: 1, rotation: i => OPEN[i], duration: 1.5, ease: 'back.out(1.5)', stagger: .09 }, .7)
   .to('#th-b', { scaleY: 1, rotation: 36, duration: 1.4, ease: 'back.out(1.6)' }, 1.0)
   // the phone drops
   .to('#phone-drop', { y: 0, rotation: 0, duration: 1.05, ease: 'power3.in' }, 2.3)
   .call(() => { const [x, y] = phoneCenter(); burst(x, y + 120*ps, 60, 6); burst(x, y + 120*ps, 20, 3); }, null, 3.34)
   .to('#floater', { y: 26, duration: .14, ease: 'power2.out' }, 3.34)
   .to('#floater', { y: 0, duration: 1.1, ease: 'elastic.out(1,.4)' }, 3.48)
   .to('#phone-drop', { y: 10, duration: .14, ease: 'power2.out' }, 3.34)
   .to('#phone-drop', { y: 0, duration: .9, ease: 'elastic.out(1,.35)' }, 3.48)
   // the fingers close around it
   .to('.fb, #th-b', { opacity: 0, duration: .3 }, 3.5)
   .fromTo('.ff',  { opacity: 0, scaleY: .92, rotation: i => OPEN[i] }, { opacity: 1, scaleY: .5, rotation: i => CURL[i], duration: .9, ease: 'power3.out', stagger: .05 }, 3.5)
   .fromTo('#th-f',{ opacity: 0, scaleY: .92, rotation: 36 }, { opacity: 1, scaleY: .62, rotation: 6, duration: .9, ease: 'power3.out' }, 3.62)
   // screen wakes
   .to('.screen-off', { opacity: 0, duration: .8, ease: 'power1.out' }, 4.0)
   .call(() => { const [x, y] = phoneCenter(); burst(x, y, 24, 2.5); }, null, 4.0)
   .to('#cap1', { autoAlpha: 1, y: 0, duration: 1.2, ease: 'power3.out' }, 4.2);
  return t;
}

/* ------------------------------------------------------------------ *
 *  Boot
 * ------------------------------------------------------------------ */
$('#replay').addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
addEventListener('resize', () => { sizeCanvas(); });

const ready = Promise.race([
  Promise.all([ new Promise(r => { const i = new Image(); i.onload = i.onerror = r; i.src = 'Gemini_Generated_Image_dlj23adlj23adlj2.jpeg'; }),
                document.fonts ? document.fonts.ready : 1 ]),
  new Promise(r => setTimeout(r, 2500))
]);

ready.then(() => {
  const intro = buildIntro();
  window.__tl = tl;
  if (params.has('p')){                       // debug: drive the timeline directly (no scrolling)
    intro.progress(1); tl.scrollTrigger.kill(); const v = parseFloat(params.get('p'));
    document.body.classList.remove('intro'); tl.time(v); onProgress(v); return;
  }
  if (params.has('skip') || params.has('t')){
    intro.progress(1);
    if (params.has('t')){
      const p = parseFloat(params.get('t')) / 100;
      requestAnimationFrame(() => { scrollTo(0, p * (document.documentElement.scrollHeight - innerHeight)); });
    }
  }
});
})();
