// 비행 시험 무대(단계 3 팀 F) — ?scene=fly&diff=easy|normal&time=clear|day|sunset · ?boat=1 = 고기잡이배 시험 · ?snd=1 = 바람 소리(기본 끔)
// 바다 장소(places/sea.js)를 무대 그릇(core/stage.js)으로 짓고 투슬리스 위에 히컵 · 관문 코스 · 화면 아래 꼬리 쪽지(코스 중간에 바람에 날아감)
// 봇은 sense()만 읽음(화면에 보이는 것: 내 자리·속도·방향 · 갈매기가 도는 다음 관문 둘 · 쪽지에 보이는 꼬리 자리 · 날개가 다 올라갔는지 · 떨어졌는지 · 투슬리스와의 거리)
import * as THREE from 'three';
import { createEnv, U } from '../look/kit.js?v=14';
import { createStageHost } from '../core/stage.js?v=14';
import { loadModel } from '../look/models.js?v=14';
import { createDragonRig } from '../look/dragon_rig.js?v=14';
import { createHumanRig } from '../look/human_rig.js?v=14';
import { createFlight, createFlightCam } from '../play/flight.js?v=14';
import { createBoat } from '../play/boat.js?v=14';
import { buildPlace } from '../places/sea.js?v=14';

const Q = new URLSearchParams(location.search);
const NOTE_BLOW = 6;                                   // 이 관문을 지나면 쪽지가 바람에 날아감(12개 중 가운데)

export async function buildFlightTest(scene, camera, rng, opt = {}) {
  const diff = opt.diff === 'easy' ? 'easy' : opt.diff === 'hard' ? 'hard' : 'normal';
  const boatMode = Q.get('boat') === '1', liftMode = Q.get('lift') === '1';
  const env = createEnv(scene, camera);
  const host = createStageHost({ gfx: opt.gfx, scene, camera });
  const ui = makeUI(diff, boatMode);
  let place = null, F = null, C = null, boat = null, t = 0, last = performance.now(), benchUntil = 0, benchT = 0, noteGone = false, noteGate = -1;
  let started = false, wait = 0;                        // 첫 입력에 출발(아무 키) · 3초 지나면 저절로(?hold=1 이면 입력만 — 같은 판 시험)
  const fx = makeFx(scene);

  const ready = (async () => {
    place = await host.load('sea', (ctx) => buildPlace(Object.assign(ctx, { env, rng, opt: { time: opt.time || 'clear' } })));
    const hic = await loadModel('assets/models/hiccup.glb?v=14');
    const rider = { root: hic.root, rig: createHumanRig(hic.bones, hic.root) };
    scene.add(hic.root);
    if (boatMode) {
      boat = createBoat({ path: place.lists.boatPath, mode: diff, rider });
      place.group.add(boat.root); place.group.add(boat.foam);
      boat.on('stroke', (e) => { if (e.kind === 'beat') fx.oars(boat.root, boat.state.yaw, 1); else if (e.kind === 'start') fx.oars(boat.root, boat.state.yaw, 0.6); });
      boat.on('arrive', () => ui.banner('낚시 자리에 닿았어요! ' + fmt(boat.state.arriveT)));
      C = makeBoatCam(camera);
      return;
    }
    const tl = await loadModel('assets/models/toothless.glb?v=14');
    scene.add(tl.root);
    /* ?lift=1 — 5장 첫 들림 엔진 시험: 바다 위 가짜 땅(높이 2m) + 앞쪽 호수(반지름 26m) + 타원 돌벽(경계) — 보이는 땅은 없음(엔진·봇 시험용) */
    const LK = { x: -60, z: -470, r: 26, y: 0.4 }, world = liftMode ? { ground: (x, z) => (Math.hypot(x - LK.x, z - LK.z) < LK.r ? -5 : 2), lake: LK, pillars: [], bounds: { x: -60, z: -490, rx: 48, rz: 40 }, ceil: 12 } : place.fly;
    F = createFlight({ world, mode: diff, dragon: { root: tl.root, rig: createDragonRig(tl.bones, tl.root) }, rider, rng });
    if (liftMode) { F.setOpts({ liftOnly: true }); F.place(-60, 3, -520, 0, 0); F.setOpts({ liftOnly: true }); }
    else { const a = place.anchors.spawn_air; F.place(a.x, a.y, a.z, a.yaw); F.setGates(place.lists.course); }
    C = createFlightCam(camera);
    F.on('graze', () => { fx.streak(1); C.kickFov(4); sound('graze'); });
    F.on('tail', (e) => { if (e.match) { fx.streak(0.7); C.kickFov(2.5); } });
    F.on('flap', (e) => { if (e.kind === 'top') C.kickFov(1.2); });
    F.on('splash', () => fx.splash(F.state.x, F.waterAt(F.state.x, F.state.z), F.state.z));
    F.on('gate', (e) => { if (e.matched) { fx.streak(0.6); C.kickFov(2); } });
    F.on('fall', () => ui.fall(true)); F.on('regrab', () => ui.fall(false));
    F.on('done', (e) => ui.banner(liftMode ? '첨벙! 발이 ' + e.t.toFixed(1) + '초 떴어요' : '다 지났어요! ' + fmt(e.t)));
    ui.note(place.lists.course, 0);
  })();

  /* 바람 소리(?snd=1 일 때만 · 기본 끔 — design §8) — 파일 없이 잡음으로 짧게 */
  let AC = null, NB = null;
  function sound(kind) {
    if (Q.get('snd') !== '1') return;
    try {
      if (!AC) { AC = new AudioContext(); NB = AC.createBuffer(1, AC.sampleRate, AC.sampleRate); const d = NB.getChannelData(0); let s = 7; for (let i = 0; i < d.length; i++) { s = (s * 16807) % 2147483647; d[i] = (s / 2147483647) * 2 - 1; } }
      const src = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(), n = AC.currentTime;
      src.buffer = NB; f.type = 'bandpass'; f.frequency.setValueAtTime(500, n); f.frequency.exponentialRampToValueAtTime(1800, n + 0.35); f.Q.value = 0.8;
      g.gain.setValueAtTime(0.0001, n); g.gain.exponentialRampToValueAtTime(kind === 'graze' ? 0.5 : 0.25, n + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, n + 0.7);
      src.connect(f); f.connect(g); g.connect(AC.destination); src.start(n); src.stop(n + 0.75);
    } catch (e) { /* 소리 못 냄 = 그대로 */ }
  }

  return {
    env, ready, host,
    get place() { return place; }, get flight() { return F; }, get boat() { return boat; },
    step(dt, I) {
      t += dt; U.uTime.value = t;
      if (!place || !C) return;
      if (!started) { wait += dt; if (I.heldList().length || (wait > 3 && Q.get('hold') !== '1')) started = true; else { place.step(dt, t); return; } }
      if (boat) { boat.step(dt, I, t); place.step(dt, t); return; }
      F.step(dt, I);
      place.gateMark(F.state.gates);
      place.step(dt, t);
      if (F.state.gates !== noteGate) {
        noteGate = F.state.gates;
        if (!noteGone && noteGate >= NOTE_BLOW) { noteGone = true; ui.blow(); }
        else if (!noteGone) ui.note(place.lists.course, noteGate);
        ui.gates(noteGate, place.lists.course.length);
      }
    },
    draw(a) {
      const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now;
      if (!place || !C) { env.follow(); return; }
      if (boat) { boat.draw(a, dt); if (now > benchUntil) C.update(dt, boat); else place.benchPath(benchT); }
      else {
        F.draw(a, dt);
        if (now > benchUntil) C.update(dt, F); else place.benchPath(benchT);
        ui.tick(F, t);
      }
      if (F) fx.gust(F.state.gustX, F.state.gustZ);
      place.draw(a); env.follow(); fx.draw(dt, camera, F ? F.pose.speed : 0);
    },
    benchPath(tt) { benchT = tt; benchUntil = performance.now() + 250; },
    snapshot() {
      if (boat) { const s = boat.state; return { t: +s.t.toFixed(3), s: +s.s.toFixed(3), lat: +s.lat.toFixed(3), speed: +s.speed.toFixed(3), strokes: s.strokes, perfect: s.perfect, offbeat: s.offbeat, tangles: s.tangles, waves: s.wavesHit, arrived: s.arrived, arriveT: +s.arriveT.toFixed(3) }; }
      if (!F) return { loading: true };
      const s = F.state;
      return { t: +s.t.toFixed(3), x: +s.x.toFixed(3), y: +s.y.toFixed(3), z: +s.z.toFixed(3), yaw: +s.yaw.toFixed(4), speed: +(s.speed + s.boost).toFixed(3), gates: s.gates, done: s.done, doneT: +s.doneT.toFixed(3),
        tail: s.tail, falls: s.falls, regrabs: s.regrabs, splashes: s.splashes, grazes: s.grazes, crashes: s.crashes, bumps: s.bumps, perfect: s.perfect, early: s.early, matched: s.matched, misses: s.misses };
    },
    /* 봇이 읽는 것 — 화면에 보이는 것만 */
    sense() {
      if (boat) {
        const s = boat.state; let nw = null;
        for (const h of boat.hazards) if (h.s > s.s - 1) { nw = { ds: +(h.s - s.s).toFixed(2), lat: +h.lat.toFixed(2) }; break; }
        return { mode: 'boat', t: +s.t.toFixed(3), left: +(s.total - s.s).toFixed(2), lat: +s.lat.toFixed(2), speed: +s.speed.toFixed(2), oar: s.phase, ready: boat.ready(), wave: nw, arrived: s.arrived };
      }
      if (!F) return null;
      const s = F.state, gs = F.gates(), nx = [];
      for (let i = s.gates; i < Math.min(gs.length, s.gates + 2); i++) { const g = gs[i]; nx.push({ x: g.x, y: g.y, z: g.z, r: +F.gateR(g).toFixed(2) }); }
      return {
        mode: 'fly', diff, t: +t.toFixed(3),
        x: +s.x.toFixed(2), y: +s.y.toFixed(2), z: +s.z.toFixed(2), vx: +s.vx.toFixed(2), vy: +s.vy.toFixed(2), vz: +s.vz.toFixed(2),
        speed: +(s.speed + s.boost).toFixed(2), yaw: +s.yaw.toFixed(3), pitch: +s.pitch.toFixed(3), tail: s.tail,
        gate: s.gates, gateN: gs.length, next: nx,
        note: noteGone ? null : gs.slice(s.gates, s.gates + 4).map((g) => g.tail),
        wingsUp: F.wingsUp(), fallen: s.fallen, grab: s.grab, dragonDist: s.fallen ? +s.riderDist.toFixed(2) : 0, done: s.done,
      };
    },
  };
}

const fmt = (s) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');

/* ── 화면 글·쪽지(DOM) ── 종이 색 · 잉크 갈색 · 손그림 흔들림(고정 난수) */
function makeUI(diff, boatMode) {
  const css = document.createElement('style');
  css.textContent = `
  .fl-tag{position:fixed;left:14px;top:12px;z-index:20;display:flex;align-items:center;gap:10px;background:#f4ead2;color:#2b2118;border:2px solid #2b2118;border-radius:8px;padding:6px 12px;font:600 17px/1.3 "Noto Sans KR","Apple SD Gothic Neo",sans-serif;box-shadow:2px 3px 0 rgba(43,33,24,.35)}
  .fl-tag canvas{width:56px;height:28px;display:block;border-left:2px solid rgba(43,33,24,.25);padding-left:6px}
  .fl-note{position:fixed;left:14px;bottom:14px;z-index:20;width:264px;height:134px;transform-origin:30% 0;animation:flFlut 2.6s ease-in-out infinite;filter:drop-shadow(3px 5px 0 rgba(43,33,24,.3))}
  .fl-note canvas{width:264px;height:134px;display:block}
  @media (max-width:700px){.fl-note{width:198px;height:101px}.fl-note canvas{width:198px;height:101px}}
  .fl-note.blow{animation:flBlow 1.9s ease-in forwards}
  @keyframes flFlut{0%,100%{transform:rotate(-1.2deg)}50%{transform:rotate(1.4deg) translateY(-2px)}}
  .fl-note.gust{animation:flGust .45s ease-in-out infinite}
  @keyframes flGust{0%,100%{transform:rotate(-4deg) translateY(-3px)}50%{transform:rotate(3deg) translate(4px,-8px) skewX(-4deg)}}
  @keyframes flBlow{0%{transform:rotate(0)}15%{transform:rotate(-8deg) translate(-10px,-14px)}100%{transform:rotate(620deg) translate(260px,-560px) scale(.5);opacity:0}}
  .fl-fall{position:fixed;left:50%;top:38%;z-index:21;transform:translate(-50%,-50%);background:#f4ead2;border:3px solid #2b2118;border-radius:12px;padding:10px 18px;font:700 22px/1.3 "Noto Sans KR",sans-serif;color:#2b2118;display:none}
  .fl-fall b{display:inline-block;border:2px solid #2b2118;border-radius:6px;padding:0 14px;margin-left:8px;background:#fff8e6}
  .fl-fall.on{display:block}.fl-fall.hot b{background:#ffd46a}
  .fl-ban{position:fixed;left:50%;top:18%;z-index:21;transform:translateX(-50%);background:#f4ead2;border:3px solid #2b2118;border-radius:12px;padding:10px 22px;font:700 24px/1.3 "Noto Sans KR",sans-serif;color:#2b2118;display:none}
  .fl-ban.on{display:block}`;
  document.head.appendChild(css);
  const tag = document.createElement('div'); tag.className = 'fl-tag'; document.body.appendChild(tag);
  const tagT = document.createElement('span'); tag.appendChild(tagT);
  const finC = document.createElement('canvas'); finC.width = 112; finC.height = 56; if (!boatMode) tag.appendChild(finC);   // 지금 꼬리 자리(보이는 짝 — 뼈 fin이 생기기 전에도)
  let finK = -1;
  const drawFin = (k) => { const x = finC.getContext('2d'); x.clearRect(0, 0, 112, 56); x.strokeStyle = x.fillStyle = '#3b2a1c'; x.lineCap = x.lineJoin = 'round'; fin(x, 50, 28, k === 0 ? 1 : k); x.font = '700 26px "Noto Sans KR",sans-serif'; x.fillText(k === 0 ? '' : diff === 'easy' ? (k === 1 ? '' : '펴') : String(k), 82, 38); };
  const fall = document.createElement('div'); fall.className = 'fl-fall'; fall.innerHTML = diff === 'easy' ? '투슬리스가 잡으러 가요!' : '가까워지면 <b>Space</b>'; document.body.appendChild(fall);
  const ban = document.createElement('div'); ban.className = 'fl-ban'; document.body.appendChild(ban);
  const box = document.createElement('div'); box.className = 'fl-note'; const cv = document.createElement('canvas'); cv.width = 660; cv.height = 336; box.appendChild(cv);
  if (!boatMode) document.body.appendChild(box);
  tagT.textContent = boatMode ? '노 박자 — Space' : '관문 0 / 12';
  let lastTxt = '', tickN = 0;
  const api = {
    gates(i, n) { tagT.textContent = '관문 ' + i + ' / ' + n; },
    banner(s) { ban.textContent = s; ban.classList.add('on'); setTimeout(() => ban.classList.remove('on'), 4000); },
    fall(on) { fall.classList.toggle('on', on); },
    blow() { box.classList.add('blow'); setTimeout(() => { box.style.display = 'none'; }, 2000); },
    tick(F, t) {
      if ((tickN++ & 7) !== 0) return;                 // 화면 글은 7~8프레임에 한 번만
      const s = F.state; if (s.fallen) fall.classList.toggle('hot', s.grab);
      const txt = F.gates().length ? '관문 ' + s.gates + ' / ' + F.gates().length + '   ' + fmt(s.done ? s.doneT : s.t) : '첫 들림 ' + s.liftT.toFixed(1) + '초';
      if (txt !== lastTxt) { tagT.textContent = txt; lastTxt = txt; }
      const k = diff === 'easy' ? (s.spread ? s.tail : 1) : s.tail; if (k !== finK) { finK = k; drawFin(k); }
      box.classList.toggle('gust', Math.hypot(s.gustX, s.gustZ) > 0.9);
    },
    note(course, cur) { drawNote(cv, course, cur, diff); },
  };
  return api;
}

/* 꼬리 쪽지 — 다음 관문 넷: 두 돌기둥 틈 + 도는 쪽 화살표 + 꼬리날개 자리 그림(1~4) · 쉬움 = 꼬리 펴기(Space) 그림 */
function drawNote(cv, course, cur, diff) {
  const x = cv.getContext('2d'), W = cv.width, H = cv.height;
  let sd = 4242 + cur * 7; const r = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
  const jit = (v, k = 2) => v + (r() - 0.5) * k;
  x.clearRect(0, 0, W, H);
  /* 찢은 종이 */
  x.fillStyle = '#efe2c0'; x.beginPath(); x.moveTo(8, 12);
  for (let i = 1; i <= 16; i++) x.lineTo(i / 16 * (W - 16) + 8, jit(10, 8));
  for (let i = 1; i <= 8; i++) x.lineTo(jit(W - 8, 8), i / 8 * (H - 20) + 10);
  for (let i = 15; i >= 0; i--) x.lineTo(i / 16 * (W - 16) + 8, jit(H - 10, 9));
  for (let i = 7; i >= 1; i--) x.lineTo(jit(8, 8), i / 8 * (H - 20) + 10);
  x.closePath(); x.fill();
  x.strokeStyle = 'rgba(120,90,50,.18)'; x.lineWidth = 2; for (let i = 0; i < 5; i++) { x.beginPath(); x.moveTo(30, 70 + i * 52); x.lineTo(W - 30, jit(70 + i * 52, 4)); x.stroke(); }   // 공책 줄
  const ink = '#3b2a1c';
  x.strokeStyle = ink; x.fillStyle = ink; x.lineCap = 'round'; x.lineJoin = 'round';
  x.font = '700 30px "Noto Sans KR","Apple SD Gothic Neo",sans-serif'; x.fillText('꼬리 쪽지', 26, 46);
  const n = Math.min(4, course.length - cur);
  for (let k = 0; k < n; k++) {
    const g = course[cur + k], p = cur + k > 0 ? course[cur + k - 1] : null, nx = course[cur + k + 1];
    const cx = 92 + k * 152, cy = 150;
    /* 돌기둥 둘(틈) */
    x.lineWidth = 4;
    for (const s of [-1, 1]) { x.beginPath(); x.moveTo(cx + s * 34, cy + 44); x.quadraticCurveTo(jit(cx + s * 40, 6), cy, cx + s * 30, cy - 46); x.quadraticCurveTo(cx + s * 22, cy - 52, cx + s * 18, cy - 44); x.quadraticCurveTo(jit(cx + s * 22, 4), cy, cx + s * 18, cy + 44); x.stroke(); }
    if (g.arch) { x.beginPath(); x.moveTo(cx - 30, cy - 44); x.quadraticCurveTo(cx, cy - 74, cx + 30, cy - 44); x.stroke(); }
    /* 도는 쪽 화살표 */
    const yin = p ? Math.atan2(g.x - p.x, g.z - p.z) : 0, yout = nx ? Math.atan2(nx.x - g.x, nx.z - g.z) : yin, turn = Math.atan2(Math.sin(yout - yin), Math.cos(yout - yin));
    const bend = Math.max(-1, Math.min(1, -turn / 1.2)) * 26;   // 왼쪽으로 돎 = 그림에서 왼쪽으로 휨
    x.lineWidth = 3.5; x.beginPath(); x.moveTo(cx, cy + 40); x.quadraticCurveTo(cx, cy - 10, cx + bend, cy - 36); x.stroke();
    const ang = Math.atan2(-26, bend * 0.9); x.beginPath(); x.moveTo(cx + bend, cy - 36); x.lineTo(cx + bend - Math.cos(ang - 0.5) * 12, cy - 36 - Math.sin(ang - 0.5) * 12); x.moveTo(cx + bend, cy - 36); x.lineTo(cx + bend - Math.cos(ang + 0.5) * 12, cy - 36 - Math.sin(ang + 0.5) * 12); x.stroke();
    /* 꼬리 자리 */
    const ty = cy + 92;
    if (diff === 'easy') {
      if (g.tail === 1) { x.lineWidth = 4; x.beginPath(); x.moveTo(cx, ty + 22); x.lineTo(cx, ty - 18); x.moveTo(cx - 10, ty - 6); x.lineTo(cx, ty - 18); x.lineTo(cx + 10, ty - 6); x.stroke(); }
      else { x.lineWidth = 3; x.strokeRect(jit(cx - 46, 2), ty - 14, 92, 30); x.font = '700 20px "Noto Sans KR",sans-serif'; x.fillText('Space', cx - 30, ty + 8); }
    } else {
      fin(x, cx - 18, ty, g.tail);
      x.font = '700 34px "Noto Sans KR",sans-serif'; x.fillText(String(g.tail), cx + 20, ty + 13);
    }
    if (k === 0) { x.lineWidth = 3; x.beginPath(); for (let i = 0; i <= 26; i++) { const a = i / 26 * Math.PI * 2.08 - 1.2; x.lineTo(cx + Math.cos(a) * jit(66, 5), cy + 22 + Math.sin(a) * jit(104, 5)); } x.stroke(); }
  }
}
/* 꼬리날개 그림 — 꼬리 끝(가로 막대) + 부채꼴 날개: 1 곧게 · 2 왼쪽으로 꺾음 · 3 오른쪽 · 4 아래로 활짝(브레이크) */
function fin(x, cx, cy, k) {
  const a = k === 2 ? -0.55 : k === 3 ? 0.55 : 0, open = k === 4 ? 1.5 : 1;
  x.save(); x.translate(cx, cy); x.lineWidth = 3;
  x.beginPath(); x.moveTo(-26, 0); x.lineTo(0, 0); x.stroke();
  x.rotate(a + (k === 4 ? Math.PI / 2 : 0));
  x.beginPath(); x.moveTo(0, 0);
  for (let i = 0; i <= 6; i++) { const t = (i / 6 - 0.5) * open; x.lineTo(Math.cos(t) * 20, Math.sin(t) * 20); }
  x.closePath(); x.globalAlpha = 0.25; x.fill(); x.globalAlpha = 1; x.stroke();
  for (let i = 1; i < 6; i++) { const t = (i / 6 - 0.5) * open; x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(t) * 18, Math.sin(t) * 18); x.stroke(); }
  x.restore();
}

/* ── 효과: 물보라·노 물보라(점 묶음 하나) · 스침 바람결(선 묶음 하나) — 그리기 둘 · 매 프레임 new X ── */
function makeFx(scene) {
  const NP = 64, pp = new Float32Array(NP * 3), pv = new Float32Array(NP * 3);
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
  const dc = document.createElement('canvas'); dc.width = dc.height = 32; { const c = dc.getContext('2d'), g = c.createRadialGradient(16, 16, 0, 16, 16, 15); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.6, 'rgba(255,255,255,.6)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 32, 32); }
  const dt0 = new THREE.CanvasTexture(dc);
  const pm = new THREE.PointsMaterial({ map: dt0, color: 0xf2f8f8, size: 1.1, transparent: true, depthWrite: false, opacity: 0 });
  const pts = new THREE.Points(pg, pm); pts.frustumCulled = false; pts.renderOrder = 960; scene.add(pts);
  const NS = 26, sp = new Float32Array(NS * 6), sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const sm = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false });
  const lines = new THREE.LineSegments(sg, sm); lines.frustumCulled = false; lines.renderOrder = 961; scene.add(lines);
  const so = new Float32Array(NS * 3); let sd = 99; const r = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
  for (let i = 0; i < NS; i++) { so[i * 3] = (r() - 0.5) * 2; so[i * 3 + 1] = (r() - 0.5) * 1.3; so[i * 3 + 2] = r(); }
  let pT = 9, sT = 0, sK = 0, pDur = 1.4, gX = 0, gZ = 0, gPh = 0;
  const fwd = new THREE.Vector3(), rt = new THREE.Vector3(), up = new THREE.Vector3();
  return {
    splash(x, y, z) {
      for (let i = 0; i < NP; i++) { const a = r() * 6.283, s = 2 + r() * 6; pp[i * 3] = x; pp[i * 3 + 1] = y + 0.3; pp[i * 3 + 2] = z; pv[i * 3] = Math.cos(a) * s; pv[i * 3 + 1] = 5 + r() * 9; pv[i * 3 + 2] = Math.sin(a) * s; }
      pT = 0; pDur = 1.4; pm.size = 1.1; pg.attributes.position.needsUpdate = true;
    },
    /* 노 박자 물보라 — 두 노 끝(배 기준 좌우 2.6m · 조금 뒤)에서 작게 */
    oars(obj, yw, k) {
      const cx = Math.cos(yw), sx = Math.sin(yw);
      for (let i = 0; i < NP; i++) {
        const sd = i < NP / 2 ? 1 : -1, lx = sd * 2.6, lz = 0.9, a = r() * 6.283, s = (0.6 + r() * 1.4) * k;
        pp[i * 3] = obj.position.x + lx * cx + lz * sx; pp[i * 3 + 1] = 0.2; pp[i * 3 + 2] = obj.position.z - lx * sx + lz * cx;
        pv[i * 3] = Math.cos(a) * s; pv[i * 3 + 1] = (1.5 + r() * 2.5) * k; pv[i * 3 + 2] = Math.sin(a) * s;
      }
      pT = 0; pDur = 0.7; pm.size = 0.35; pg.attributes.position.needsUpdate = true;
    },
    streak(k) { sT = 0.7; sK = Math.max(sK, k); },
    gust(gx, gz) { gX = gx; gZ = gz; },
    draw(dt, cam, speed) {
      if (pT < pDur) {
        pT += dt; for (let i = 0; i < NP; i++) { pv[i * 3 + 1] -= 18 * dt; pp[i * 3] += pv[i * 3] * dt; pp[i * 3 + 1] += pv[i * 3 + 1] * dt; pp[i * 3 + 2] += pv[i * 3 + 2] * dt; }
        pg.attributes.position.needsUpdate = true; pm.opacity = Math.max(0, 1 - pT / pDur) * 0.9;
      } else pm.opacity = 0;
      pts.visible = pm.opacity > 0.01;
      if (sT > 0) {
        sT -= dt; const k = Math.max(0, sT / 0.7) * sK; sm.opacity = k * 0.55;
        cam.getWorldDirection(fwd); rt.crossVectors(fwd, cam.up).normalize(); up.crossVectors(rt, fwd);
        for (let i = 0; i < NS; i++) {
          const ox = so[i * 3] * 4.5, oy = so[i * 3 + 1] * 3, d = 4 + ((so[i * 3 + 2] + sT * 3) % 1) * 12, L = 1.5 + speed * 0.08;
          const bx = cam.position.x + fwd.x * d + rt.x * ox + up.x * oy, by = cam.position.y + fwd.y * d + rt.y * ox + up.y * oy, bz = cam.position.z + fwd.z * d + rt.z * ox + up.z * oy;
          sp[i * 6] = bx; sp[i * 6 + 1] = by; sp[i * 6 + 2] = bz; sp[i * 6 + 3] = bx - fwd.x * L; sp[i * 6 + 4] = by - fwd.y * L; sp[i * 6 + 5] = bz - fwd.z * L;
        }
        sg.attributes.position.needsUpdate = true;
      } else if (Math.hypot(gX, gZ) > 0.6) {                 // 돌풍: 바람 부는 쪽으로 흐르는 옅은 결(보이는 짝)
        const gk = Math.hypot(gX, gZ), ux = gX / gk, uz = gZ / gk; gPh += dt * gk * 0.5; sm.opacity = Math.min(0.32, (gk - 0.6) * 0.18); sK = 0;
        for (let i = 0; i < NS; i++) {
          const a = so[i * 3] * 9, b = so[i * 3 + 1] * 4, c = ((so[i * 3 + 2] + gPh) % 1) * 24 - 12, L = 2.5 + gk;
          const bx = cam.position.x + a * uz + c * ux, by = cam.position.y - 2 + b, bz = cam.position.z - a * ux + c * uz;
          sp[i * 6] = bx; sp[i * 6 + 1] = by; sp[i * 6 + 2] = bz; sp[i * 6 + 3] = bx - ux * L; sp[i * 6 + 4] = by; sp[i * 6 + 5] = bz - uz * L;
        }
        sg.attributes.position.needsUpdate = true;
      } else { sm.opacity = 0; sK = 0; }
      lines.visible = sm.opacity > 0.01;
    },
  };
}

/* 배 카메라 — 배 뒤(고물 쪽) 위에서 앞을 봄 · 흔들림 적게 */
function makeBoatCam(camera) {
  const C = { x: 0, y: 0, z: 0, init: false };
  C.update = (dt, b) => {
    const r = b.root, yaw = b.state.yaw, tx = r.position.x - Math.sin(yaw) * 8.5, tz = r.position.z - Math.cos(yaw) * 8.5, ty = 4.2;
    if (!C.init) { C.x = tx; C.y = ty; C.z = tz; C.init = true; }
    const k = 1 - Math.exp(-dt * 3); C.x += (tx - C.x) * k; C.y += (ty - C.y) * k; C.z += (tz - C.z) * k;
    camera.position.set(C.x, C.y, C.z); camera.lookAt(r.position.x + Math.sin(yaw) * 8, 0.8, r.position.z + Math.cos(yaw) * 8);
    if (camera.fov !== 60) { camera.fov = 60; camera.updateProjectionMatrix(); }
  };
  return C;
}
