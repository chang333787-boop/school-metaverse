// 10장 대장 드래곤(design §2 10장 · reference A #24~27 · 0의 10번) — 안개 · 둥지 섬 · 7~8분 · 쉬움 하늘 둘(대장 수 둘 · 구름 숨어 날개 · 입 안)
// ① [길 찾기] 안개 바다 — 아스트리드의 내더 뒤에 타고 물 위 불빛 띠를 찾아 손짓(방향키) ② [던지기 + 원소] 해변 — 대장 몸 한 곳(눈·날개·입)을 맞히면 맞는 친구가 기술
//    · 가스 + 불 = 펑 · 물통 + 불 = 김 가림막 · 사각에서 소리 → 눈 여섯으로 돌아봄 · 구한 어른이 무기를 내려놓아 무기 더미 ③ [다가가 기다리기] 물속(밝게) — 사슬 셋 중 투슬리스 고리
//    → 10초 안에 스토이크가 끊음 · 서로 구함 ③-2 (이음) 해변 — '바이킹은 겁나도 간다'를 되돌려 줌 ④ [관문 비행] 대장전 — 날개 막에 구멍(play/boss.js 상태 기계)
// ⑤ [관문 비행] 마지막(고정) — 꼬리날개에 불(4초 예고) → 조종이 둔해짐 → 곧장 아래로 → 숨 들이켬 → 입 안으로 쏘기 → 솟구치기 ⑥ (이음 + 걷기) 연기 속 스토이크로 걷기 → 빈 안장 → 날개를 펴 히컵을 보여 줌
// 와! = 입 안으로 쏘고 솟구치는 1초 · 변화 = 둥지 하늘이 맑아짐 · 드래곤들이 흩어짐 · 해변 무기 더미 · 기록 = 걸린 시간 · 안 맞은 횟수 · 친구 조합 수
// 대사는 모두 우리 말로 새로(원문 X) · 피·죽음 X · 깜짝 X(예고 2~3초 · 소리 서서히) · 불·추락은 연기·그림자·먼 구도
import * as THREE from 'three';
import { wait, until, sayAll } from './runner.js?v=16';
import { holdItem, makeItem } from './fx.js?v=16';
import { toon, flameMesh, glowSprite } from '../look/kit.js?v=16';
import { HOWTO, ICONS, PICT, keyCap } from '../ui/art.js?v=16';
import { createBoss, createShots, makeParts, WARN } from '../play/boss.js?v=16';

const TAU = Math.PI * 2;
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const NEED = { rescue: { easy: 2, normal: 4, hard: 5 }, holes: { easy: 4, normal: 5, hard: 6 } };
const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _q = new THREE.Quaternion(), _e = new THREE.Euler(0, 0, 0, 'YXZ');
function* awaitP(p) { let v, done = false; p.then((x) => { v = x; done = true; }, () => { done = true; }); while (!done) yield; return v; }

/* 하는 법 창 — 이 장에서 새로 쓰는 셋(art.js 표에 장이 더함 · 그림 + 낱말 셋) */
const ARR = `<span class="keys">${keyCap('W')}${keyCap('A')}${keyCap('S')}${keyCap('D')}</span>`;
HOWTO.point10 = HOWTO.point10 || [[keyCap('←') + keyCap('→'), ICONS.hand, '손짓으로 방향'], ['', ICONS.torch, '물 위 불빛 찾기'], ['', ICONS.eye, '안 보이면 둘러보기']];
HOWTO.mark10 = HOWTO.mark10 || [[keyCap('F 꾹', true), PICT.aim, '누르는 동안 겨누기'], [ARR, PICT.aim, '눈·날개·입 고르기'], [keyCap('F'), ICONS.bucket, '통 옆 = 물통 들기']];
HOWTO.boss10 = HOWTO.boss10 || [[ARR, ICONS.wind, '몸 기울이기'], [keyCap('Space', true), PICT.wing, '날갯짓 박자'], [keyCap('F'), ICONS.eye, '쏘기 — 날개 막']];
HOWTO.boss10e = HOWTO.boss10e || [[ARR, ICONS.wind, '방향'], [keyCap('Space 꾹', true), ICONS.finNew, '꼬리 펴서 휙'], [keyCap('F'), ICONS.eye, '쏘기 — 날개 막']];
HOWTO.dive10 = HOWTO.dive10 || [[keyCap('S') + keyCap('↓'), PICT.wing, '곧장 아래로'], [keyCap('F'), ICONS.eye, '입이 밝을 때 쏘기'], [keyCap('W') + keyCap('↑'), ICONS.wind, '솟구치기']];

/* 드래곤 등 위 자리(안장) — 가슴·엉덩이 뼈 사이 k · 처음 한 번 셈 */
function seat(D, k = 0, up = 0.3) {
  if (D._seat && D._seat.k === k) return D._seat.p;
  const ch = D.root.getObjectByName('chest'), hp = D.root.getObjectByName('hips');
  D.root.updateMatrixWorld(true);
  const a = new THREE.Vector3(), b = new THREE.Vector3(); if (ch) ch.getWorldPosition(a); if (hp) hp.getWorldPosition(b); else b.copy(a);
  D.root.worldToLocal(a); D.root.worldToLocal(b); a.lerp(b, k); a.y += up;
  D._seat = { k, p: a }; return a;
}
function sitOn(D, H, k, up) { if (!D.root || !H.root) return; const p = seat(D, k, up); _v.copy(p).applyMatrix4(D.root.matrixWorld); H.root.position.copy(_v); H.root.quaternion.copy(D.root.quaternion); }

/* 나는 친구(장이 직접 몰기 — 걸음 엔진·마음 엔진 없이) — 원 그리며 돎 · goTo(x,y,z) · 등에 탄 사람 */
function flyer(G, kind, who, x, y, z, o = {}) {
  const D = G.dragon(kind, { x, z, yaw: 0 }, { noCollide: true, mind: { fear: 0, trust: 0.9 } }); D.manual = true;
  const H = who ? G.person(who, { x, z }, { noCollide: true }) : null; if (H) H.manual = true;
  const F = { D, H, x, y, z, yaw: o.yaw || 0, pitch: 0, roll: 0, speed: o.speed || 15, to: null, circ: o.circ || null, ph: o.ph || 0, carry: null, t: 0, flapK: 0 };
  F.goTo = (tx, ty, tz, sp) => { F.to = { x: tx, y: ty, z: tz, sp: sp || 20 }; };
  F.home = () => { F.to = null; };
  F.step = (dt) => {
    F.t += dt; let tx, ty, tz, sp;
    if (F.to) { tx = F.to.x; ty = F.to.y; tz = F.to.z; sp = F.to.sp; }
    else if (F.circ) { const c = F.circ, a = F.ph + F.t * c.w; tx = c.x + Math.cos(a) * c.r; tz = c.z + Math.sin(a) * c.r; ty = c.y + Math.sin(F.t * 0.4 + F.ph) * 3; sp = F.speed; }
    else return;
    const dx = tx - F.x, dy = ty - F.y, dz = tz - F.z, d = Math.hypot(dx, dz);
    const want = Math.atan2(dx, dz), dyaw = wrap(want - F.yaw), tr = d < 20 ? 2.4 : 1.4;
    F.yaw = wrap(F.yaw + clamp(dyaw, -tr * dt, tr * dt)); F.roll += (clamp(-dyaw, -0.6, 0.6) - F.roll) * Math.min(1, dt * 3);
    const v = F.to ? Math.min(sp, d * 1.2 + 2) : sp;
    F.x += Math.sin(F.yaw) * v * dt; F.z += Math.cos(F.yaw) * v * dt; F.y += clamp(dy, -8, 8) * Math.min(1, dt * 1.5);
    F.pitch += (clamp(dy * 0.03, -0.4, 0.4) - F.pitch) * Math.min(1, dt * 2); F.speedNow = v;
    F.arrived = Math.hypot(dx, dy, dz) < 4;
  };
  F.draw = (dt) => {
    if (!D.root) return;
    D.root.position.set(F.x, F.y - 1.2, F.z); D.root.rotation.set(-F.pitch, F.yaw, F.roll, 'YXZ'); D.root.updateMatrixWorld(true);
    const R = D.rig; R.fold = 0; R.flapRate = F.flapK > 0 ? F.flapK : (F.speedNow > 4 ? 0.7 : 0.9); R.glide = 0.2; R.headUp = 0.1; R.update(dt);
    if (H && H.root) { sitOn(D, H, 0.1, 0.25); H.rig.ride = 1; H.rig.speed = 0; for (const n in H.pose) if (n in H.rig) H.rig[n] = H.pose[n]; H.rig.update(dt); }
    if (F.carry && F.carry.root) { F.carry.root.position.set(F.x, F.y - 3.4, F.z); F.carry.root.rotation.set(0, F.yaw, 0); F.carry.rig.cower = 1; F.carry.rig.update(dt); }
  };
  return F;
}

/* ══════════ ① 안개 바다 — 내더 뒤에 타고 손짓 ══════════ */
function* fogRide(G, C) {
  const P = G.player, pl = G.place, tr = pl.trail, L = pl.lists.lights, st = tr[0], en = tr[tr.length - 1];
  const N = G.dragon('nadder', { x: st[0], z: st[1], yaw: Math.PI }, { noCollide: true }); N.manual = true;
  const As = G.person('astrid', { x: st[0], z: st[1] }, { noCollide: true }); As.manual = true;
  yield* until(() => N.root && As.root && P.root, 20);
  const R = { x: st[0], y: 14, z: st[1], yaw: Math.atan2(tr[4][0] - st[0], tr[4][1] - st[1]), want: 0, roll: 0, lostT: 0, last: null, back: false, wait: false, sp: 13, seenAny: false };
  R.want = R.yaw; C.R = R;
  P.cam = 'ride'; P.hidden = false; P.lock = true;
  const cam = { x: R.x, y: R.y + 4, z: R.z + 12, lx: R.x, ly: R.y, lz: R.z, init: false };
  G.camDraw = (a, dt) => {
    if (!N.root) return;
    N.root.position.set(R.x, R.y - 1.2, R.z); N.root.rotation.set(0, R.yaw, R.roll, 'YXZ'); N.root.updateMatrixWorld(true);
    const NR = N.rig; NR.fold = 0; NR.flapRate = 0.7; NR.glide = 0.3; NR.headUp = 0.05; NR.update(dt);
    sitOn(N, As, 0.0, 0.35); As.rig.ride = 1; As.rig.update(dt);
    if (P.root) { sitOn(N, P, 0.55, 0.3); P.rig.ride = 1; P.rig.point = C.point || 0; P.rig.speed = 0; P.rig.update(dt); }
    const fx = Math.sin(R.yaw), fz = Math.cos(R.yaw), k = cam.init ? 1 - Math.exp(-dt * 4) : 1; cam.init = true;
    cam.x += (R.x - fx * 11 - cam.x) * k; cam.y += (R.y + 4.2 - cam.y) * k; cam.z += (R.z - fz * 11 - cam.z) * k;
    cam.lx += (R.x + fx * 22 - cam.lx) * k; cam.ly += (R.y - 3 - cam.ly) * k; cam.lz += (R.z + fz * 22 - cam.lz) * k;
    G.camera.position.set(cam.x, cam.y, cam.z); G.camera.lookAt(cam.lx, cam.ly, cam.lz);
  };
  C.cleanup = () => { P.cam = 'follow'; G.camDraw = null; P.lock = false; if (P.rig) { P.rig.ride = 0; P.rig.point = 0; } };
  G.hud.say('astrid', '안개 때문에 코앞도 안 보여.', [], { secs: 2.6 });
  G.hud.say('hiccup', '앞배들이 지나간 자리에 불이 떠 있어. 내가 손짓할게!', ['torch'], { secs: 3.4 });
  let t = 0, near = 0;
  const pillars = (pl.fly && pl.fly.pillars) || [];
  while (true) {
    const dt = yield; t += dt;
    const tin = G.input.axis('right', 'left');                 // + = 왼쪽 손짓
    C.point = Math.abs(tin) > 0.1 ? 1 : 0;
    /* 보이는 불빛(안개 60m 안 · 앞쪽) */
    let vis = 0, best = null, bd = 1e9; const fx = Math.sin(R.yaw), fz = Math.cos(R.yaw);
    for (const l of L) { const dx = l.x - R.x, dz = l.z - R.z, d = Math.hypot(dx, dz); if (d > 62) continue; const c = (dx * fx + dz * fz) / (d || 1); if (c < -0.2) continue; vis++; if (d < bd) { bd = d; best = l; } }
    if (vis) { R.lostT = 0; R.last = best; R.seenAny = true; if (R.back) { R.back = false; } }
    else R.lostT += dt;
    if (tin) { R.want = R.yaw + tin * 0.95; R.wait = false; R.back = false; }
    /* 잃으면: 7초 → 아스트리드 '안 보여' · 12초 → 마지막 본 불빛으로 되돌아가 거기서 맴돎(손짓을 기다림) */
    if (R.lostT > 7 && !C.lostSaid) { C.lostSaid = true; G.hud.say('astrid', '불빛이 하나도 안 보여! 어느 쪽이야?', [], { secs: 2.6 }); }
    if (R.lostT < 1) C.lostSaid = false;
    if (R.lostT > 12 && R.last && !R.back && !R.wait) { R.back = true; G.hud.say('astrid', '아까 그 불빛으로 돌아갈게.', [], { secs: 2.2 }); }
    if (R.back && R.last) { R.want = Math.atan2(R.last.x - R.x, R.last.z - R.z); if (Math.hypot(R.last.x - R.x, R.last.z - R.z) < 10) { R.back = false; R.wait = true; } }
    if (R.wait && !tin) R.want = R.yaw + 0.5;                  // 그 자리에서 맴돌며 기다림
    /* 돌기둥 비키기(아스트리드가 알아서) */
    for (const p of pillars) { const dx = p.x - R.x, dz = p.z - R.z, d = Math.hypot(dx, dz); if (d < p.r + 22 && (dx * fx + dz * fz) / (d || 1) > 0.3) { const side = Math.sin(R.yaw) * dz - Math.cos(R.yaw) * dx; R.want = R.yaw + (side > 0 ? 0.8 : -0.8); } }
    const dyaw = wrap(R.want - R.yaw), tr = 0.8;
    R.yaw = wrap(R.yaw + clamp(dyaw, -tr * dt, tr * dt)); R.roll += (clamp(-dyaw * 0.8, -0.5, 0.5) - R.roll) * Math.min(1, dt * 3);
    const sp = R.wait ? 8 : R.sp;
    R.x += Math.sin(R.yaw) * sp * dt; R.z += Math.cos(R.yaw) * sp * dt; R.y = 14 + Math.sin(t * 0.9) * 0.6;
    const de = Math.hypot(en[0] - R.x, en[1] - R.z);
    C.vis = vis; C.de = de;
    if (de < 150 && !C.islandSaid) { C.islandSaid = true; G.hud.say('hiccup', '저기! 섬 그림자야!', [], { secs: 2 }); }
    if (de < 45) break;
  }
  G.hud.banner('안개를 뚫었다 — 둥지 섬 해변', 'map', 3);
  yield* wait(1.2);
  return true;
}
function fogSense(G, C) {
  const R = C.R; if (!R) return {};
  const L = G.place.lists.lights || [], vis = [];
  for (const l of L) { if (Math.hypot(l.x - R.x, l.z - R.z) < 62 && G.vis(l.x, 0.6, l.z, 80)) vis.push({ x: l.x, z: l.z }); }
  return { mode: 'ride', x: +R.x.toFixed(1), z: +R.z.toFixed(1), yaw: +R.yaw.toFixed(3), lights: vis, waitHand: R.wait, lost: +R.lostT.toFixed(1) };
}

/* ══════════ ② 해변 — 대장이 산을 깨고 나옴 → 몸 한 곳을 맞혀 친구 부르기 · 조합 · 물통 김 · 어른 구하기 ══════════ */
function* beachBattle(G, C) {
  const P = G.player, pl = G.place, A = pl.anchors, diff = G.diff, need = NEED.rescue[diff] || 4;
  const B = createBoss({ group: pl.group, diff, scale: 1, sfx: G.sfx, place: pl }); C.B = B;
  const prevClean = C.cleanup; C.cleanup = () => { if (C.cam0) Object.assign(P.C, C.cam0); B.dispose(); if (C.parts) for (const p of C.parts) p.mesh.removeFromParent(); if (C.ring) { C.ring.removeFromParent(); C.ring.geometry.dispose(); } if (C.bola) C.bola.removeFromParent(); prevClean && prevClean(); pl.pile && pl.pile(0); };
  yield* awaitP(B.loaded);
  /* 어른 무리 셋(불난 배 곁) — 무리마다 어른들 · 김 가림막(hidden) */
  const ships = pl.lists.ships || [], adultsAt = pl.lists.adults || [];
  const groups = ships.map((s, i) => ({ i, x: s.x, y: 1, z: s.z - 18, hidden: false, hideT: 0, done: false, fireOut: 0, adults: [] }));
  const kinds = ['villager1', 'villager2', 'villager3', 'gobber'];
  const adults = adultsAt.map((a, k) => { const g = groups.reduce((m, q) => (Math.hypot(q.x - a.x, q.z - a.z) < Math.hypot(m.x - a.x, m.z - a.z) ? q : m), groups[0]); const H = G.person(kinds[k % 4], a, { noCollide: true }); H.pose = { cower: 1 }; H.home = { x: a.x, z: a.z }; H.g = g; g.adults.push(H); return H; });
  for (const g of groups) { g.y = pl.height(g.x, g.z); }
  B.groundTargets = groups;
  /* 대장 나옴(이음 · 먼 구도는 해변에서 올려다봄) — 땅울림 → 바위 둔덕이 깨지고 산비탈에서 솟음 → 해변 앞으로 내려옴 */
  const R0 = A.boss_rise, S0 = A.boss_stand;
  B.mode = 'script'; B.grounded = true; B.x = R0.x; B.z = R0.z; B.y = R0.y - 40; B.yaw = 0;
  const dust = makeParts(pl.group, 70, 0x6a5e56, 10); C.parts = [dust];
  C.drawHook = (a, dt) => B.draw(dt);
  G.putPlayer(A.beach, Math.PI); P.lock = true;
  const C0 = { lift: P.C.lift, dist: P.C.dist, pitch: P.C.pitch }; C.cam0 = C0; P.C.lift = 4.6; P.C.dist = 10; P.C.pitch = 0.02;   // 큰 몸이 화면에 들어오게(올려다봄)
  G.hud.say('hiccup', '땅이… 울린다.', [], { secs: 2 });
  yield* wait(1.6);
  pl.breakRise && pl.breakRise(); G.sfx.play('roar');
  for (let t = 0; t < 3.2;) { const dt = yield; t += dt; B.y = R0.y - 40 + 40 * Math.min(1, t / 3); dust.step(dt, -1); if ((t * 10 | 0) % 3 === 0) dust.burst(R0.x + (t * 37 % 20) - 10, R0.y, R0.z + 10, 3, 8, 6, 2); B.step(dt, P.W); }
  for (let t = 0; t < 3.4;) { const dt = yield; t += dt; const k = t / 3.4, e = k * k * (3 - 2 * k); B.x = R0.x + (S0.x - R0.x) * e; B.z = R0.z + (S0.z - R0.z) * e; B.y = pl.height(B.x, B.z); dust.step(dt, -1); B.step(dt, P.W); }
  B.mode = 'stand'; B.cool = 4;
  /* 친구 넷(하늘에서 돎) */
  const ring = { x: S0.x, y: 34, z: S0.z + 40, r: 52, w: 0.32 };
  const fr = {
    fish: flyer(G, 'gronckle', 'fishlegs', ring.x + 50, 34, ring.z, { circ: ring, ph: 0, speed: 15 }),
    snot: flyer(G, 'nightmare', 'snotlout', ring.x - 50, 36, ring.z, { circ: ring, ph: Math.PI, speed: 15 }),
    twin: flyer(G, 'zippleback', 'ruffnut', ring.x, 38, ring.z + 50, { circ: ring, ph: Math.PI / 2, speed: 15 }),
    astr: flyer(G, 'nadder', 'astrid', ring.x, 32, ring.z - 50, { circ: ring, ph: -Math.PI / 2, speed: 15 }),
  };
  C.fr = fr;
  C.drawHook = (a, dt) => { B.draw(dt); for (const k in fr) fr[k].draw(dt); };
  yield* until(() => Object.values(fr).every((f) => f.D.root && (!f.H || f.H.root)), 20);
  P.lock = false;
  yield* sayAll(G, [['fishlegs', '저렇게 큰 건 책에도 없어!'], ['hiccup', '내가 몸 한 곳을 맞히면 그쪽으로 가 줘. 눈·날개·입!', ['eye']]]);
  G.hud.goal('어른들을 구하기 0/' + need); holdItem(P, 'bola'); C.held = 'bola';
  const RING = new THREE.Mesh(new THREE.RingGeometry(1.2, 1.8, 24), new THREE.MeshBasicMaterial({ color: 0xfff1d6, transparent: true, opacity: 0.9, depthWrite: false, depthTest: false, side: THREE.DoubleSide }));
  RING.renderOrder = 990; RING.visible = false; pl.group.add(RING); C.ring = RING;
  const bola = makeItem('bola'); bola.scale.setScalar(4); bola.visible = false; pl.group.add(bola); C.bola = bola;
  const gasP = makeParts(pl.group, 120, 0x9ac87a, 7), steamP = makeParts(pl.group, 120, 0xeef2f2, 9), boomP = makeParts(pl.group, 90, 0xffb050, 6, true), sparkP = makeParts(pl.group, 50, 0xffd070, 2, true);
  C.parts.push(gasP, steamP, boomP, sparkP);
  /* 상태 */
  let rescued = 0, knocks = 0, combos = 0, aim = null, throwT = null, pending = 0, lastSpot = '';
  const rescuers = [fr.astr, fr.fish];
  C.st = { rescued, need, combos };
  /* 친구가 몸 한 곳으로 — 눈 = 그롱클·스노트(방패 소리 → 어지러움) · 날개 = 나이트메어(몸 불 → 막 그을림 · 움찔) · 입 = 지플백(가스) */
  const spotPos = (spot, o) => {
    if (spot === 'eyeP' && B.bones.pupilL) { B.bones.pupilL.getWorldPosition(_v); o.x = _v.x; o.y = _v.y; o.z = _v.z; }
    else if (spot === 'eye' || spot === 'mouth' || spot === 'eyeP') { o.x = B.mouth.x; o.y = B.mouth.y + (spot !== 'mouth' ? 6 : 0); o.z = B.mouth.z; }
    else if (spot === 'wing') { const m = B.memb[(B.t * 3 | 0) % Math.max(1, B.memb.length)]; if (m) { o.x = m.x; o.y = m.y + 4; o.z = m.z; } }
    else { o.x = B.center.x; o.y = B.center.y + 12; o.z = B.center.z; }
    return o;
  };
  const tmp = { x: 0, y: 0, z: 0 };
  function friendGo(spot) {
    const who = spot === 'eye' ? (fr.fish.res ? fr.snot : fr.fish) : spot === 'wing' ? fr.snot : fr.twin;
    spotPos(spot, tmp); who.goTo(tmp.x + 8, tmp.y + 4, tmp.z + 10, 26); who.job = spot; who.jobT = 0; who.did = false;
    if (spot === 'eye' && who === fr.fish && !fr.snot.job) { fr.snot.goTo(tmp.x - 8, tmp.y + 5, tmp.z + 8, 26); fr.snot.job = 'eye2'; fr.snot.jobT = 0; fr.snot.did = false; }
  }
  function boom(x, y, z) {
    if (C.boomCd > 0) return; C.boomCd = 1; B.gasT = 0;
    boomP.burst(x, y, z, 60, 22, 10, 1.3); sparkP.burst(x, y, z, 30, 26, 12, 1.0); G.sfx.play('boom'); B.stun(5); combos++;
    G.hud.say('hiccup', '가스에 불이 닿았다 — 펑!', [], { secs: 1.6 }); pending += 2;
  }
  B.on('boom', (p) => boom(p.x, p.y, p.z));
  B.on('lost', (g) => { G.hud.say('fishlegs', '김 때문에 못 찾았어! 지금이야!', [], { secs: 1.6 }); pending += 1; });
  B.on('turn', () => { G.hud.say('fishlegs', '사각이 없어! 눈이 여섯 개야!', ['eye'], { secs: 2.2 }); G.book.note('boss', 'sign', '눈이 여섯 — 사각이 없음', false); });
  B.on('fire', (F) => { C.fireAt = { x: F.tx, z: F.tz, t: 0 }; });
  /* 물통 → 불난 배에 = 김 가림막(그 무리를 숨김) */
  const barrels = pl.lists.barrels || [], barrelSpots = barrels.map((b) => ({ x: b.x, y: b.y, z: b.z })), NONE = [];
  while (rescued < need) {
    const dt = yield; const I = G.input;
    if (C.boomCd > 0) C.boomCd -= dt;
    B.step(dt, P.W); gasP.step(dt, -0.4); steamP.step(dt, -1.2); boomP.step(dt, 3); sparkP.step(dt, 6);
    for (const k in fr) { const f = fr[k]; f.step(dt); }
    /* 친구 기술 */
    for (const f of [fr.fish, fr.snot, fr.twin]) {
      if (!f.job) continue; f.jobT += dt;
      if (f.jobT > 1.3 && !f.did) {
        f.did = true;
        if (f.job === 'eye') { B.dizzy(4.5); G.sfx.play('clang'); sparkP.burst(f.x, f.y, f.z, 14, 6, 3, 0.6); G.hud.say('fishlegs', '방패를 쾅쾅! 시끄러우면 못 겨눠!', ['shield'], { secs: 1.8 }); pending += 1; }
        else if (f.job === 'wing') { if (B.gasT > 0) boom(B.mouth.x, B.mouth.y, B.mouth.z); else { B.flinchT = 1.2; G.hud.say('snotlout', '날개 막을 그을려 줬지!', [], { secs: 1.6 }); pending += 1; } sparkP.burst(f.x, f.y - 3, f.z, 30, 10, -2, 0.8); f.flapK = 1; }
        else if (f.job === 'mouth') { B.gas(5.5); for (let q = 0; q < 6; q++) gasP.burst(B.mouth.x + (q - 2.5) * 3, B.mouth.y, B.mouth.z + 4, 10, 4, 1, 4); G.hud.say('twins', '가스 머리, 뿜어! …불꽃 머리는 왜 가만있어?', [], { secs: 2.2 }); }
        else if (f.job === 'eye2') G.sfx.play('clang');
      }
      if (B.gasT > 0 && f.job === 'eye' && f.did && f.jobT < 1.4) boom(B.mouth.x, B.mouth.y, B.mouth.z);       // 그롱클 불덩이도 가스에 닿으면 펑
      if (f.jobT > 3.2) { f.job = null; f.did = false; f.home(); f.flapK = 0; }
    }
    if (B.gasT > 0 && (B.t * 8 | 0) % 2 === 0) gasP.puff(B.mouth.x + Math.sin(B.t * 3) * 4, B.mouth.y + 1, B.mouth.z + 3, 0, 0.6, 0, 1.4);
    /* 구하기(아스트리드 · 피시레그) — 안 구한 어른을 무기 더미 곁으로 */
    if (pending > 0) for (const r of rescuers) {
      if (r.res || r.job) continue;
      const H = adults.find((h) => !h.saved && !h.taken); if (!H) { pending = 0; break; }
      H.taken = true; r.res = { H, stage: 0 }; pending--; r.goTo(H.x, H.y + 5, H.z, 24);
    }
    for (const r of rescuers) {
      const s = r.res; if (!s) continue;
      if (s.stage === 0 && r.arrived) { s.stage = 1; r.carry = s.H; s.H.manual = true; r.goTo(A.weapon_pile.x + 6, A.weapon_pile.y + 6, A.weapon_pile.z + 2, 20); }
      else if (s.stage === 1 && r.arrived) {
        s.H.manual = false; r.carry = null; s.H.place(A.weapon_pile.x + 3 + (rescued % 3), A.weapon_pile.z + 2 + (rescued % 2)); s.H.pose = { carry: 1 }; s.H.saved = true; rescued++; pl.pile && pl.pile(rescued * 2);
        G.hud.goal('어른들을 구하기 ' + rescued + '/' + need); G.hud.say('villager', rescued === 1 ? '…무기를 내려놓겠다. 저 아이들 말이 맞아.' : '나도 내려놓겠네.', ['x'], { secs: 1.8 });
        r.res = null; r.home();
      }
    }
    for (const H of adults) if (H.saved && H.pose.carry && (H.dropT = (H.dropT || 0) + dt) > 1.2) H.pose = { cheer: 0.6 };
    /* 김 가림막 시계 · 불이 다시 붙음 */
    for (const g of groups) { if (g.hideT > 0) { g.hideT -= dt; if ((B.t * 6 | 0) % 2 === 0) steamP.puff(g.x + Math.sin(B.t * 5 + g.i) * 6, g.y + 2, g.z + Math.cos(B.t * 4) * 6, 0, 2, 0, 2.2); if (g.hideT <= 0) g.hidden = false; } if (g.fireOut > 0) { g.fireOut -= dt; if (g.fireOut <= 0) pl.shipFire && pl.shipFire(g.i, true); } }
    /* 대장 불 → 맞으면(구르기로 피함) · 어른 무리는 흩어졌다 돌아옴(다치지 않음) */
    if (C.fireAt) {
      C.fireAt.t += dt; const f = C.fireAt;
      if (f.t > 0.35 && f.t < 1.3 && B.fire) {
        if (Math.hypot(P.W.x - f.x, P.W.z - f.z) < 6.5 && !(P.W.rollT > 0) && !C.hitThis) { C.hitThis = true; if (diff === 'easy') G.hud.say('hiccup', '앗 뜨거! …괜찮아.', [], { secs: 1 }); else { knocks++; P.lock = true; P.pose = { stumble: 1 }; C.down = 2.2; G.hud.say('hiccup', '으악! …마을에서 제일 가벼우니까 멀리도 날아가지.', [], { secs: 1.8 }); } }
        for (const H of adults) if (!H.saved && !H.taken && Math.hypot(H.x - f.x, H.z - f.z) < 12) { H.walkTo(H.home.x + (H.x - f.x) * 1.5, H.home.z + 8); H.pose = { cower: 1 }; H.backT = 4; }
        boomP.puff(f.x + Math.sin(f.t * 40) * 4, 1, f.z + Math.cos(f.t * 30) * 4, 0, 5, 0, 0.8);
      }
      if (f.t > 1.6) { C.fireAt = null; C.hitThis = false; }
    }
    for (const H of adults) if (H.backT > 0) { H.backT -= dt; if (H.backT <= 0 && !H.taken) H.walkTo(H.home.x, H.home.z); }
    if (C.down > 0) { C.down -= dt; if (C.down <= 0) { P.lock = false; P.pose = null; } }
    if (knocks >= 4) { yield* sayAll(G, [['astrid', '히컵, 숨 돌리고 다시!']]); return 'retry'; }
    /* 몸 가까이 못 감(큰 몸) */
    { const dx = P.W.x - B.x, dz = P.W.z - B.z, d = Math.hypot(dx, dz); if (d < 34 && d > 0.1) { P.W.x = B.x + dx / d * 34; P.W.z = B.z + dz / d * 34; } }
    /* 손: 통 옆 F 짧게 = 물통 · F 꾹 = 겨누기(볼라 = 대장 몸 판 · 물통 = 땅 고리) → 놓으면 던짐 */
    G.useSpots = C.held === 'bola' ? barrelSpots : NONE;
    if (P.fTap && !aim && !throwT) { for (const b of barrels) if (G.near(b, 2.4)) { C.held = C.held === 'bucket' ? 'bola' : 'bucket'; holdItem(P, C.held); G.hud.say('hiccup', C.held === 'bucket' ? '물통!' : '볼라!', [C.held === 'bucket' ? 'bucket' : 'rope'], { secs: 0.8 }); break; } }
    P.noReach = true;
    if (I.on('use') && P.fT > 0.25 && !throwT && !(C.down > 0)) {
      const my = P.C.moveYaw(), fx = Math.sin(my), fz = Math.cos(my), rx = -Math.cos(my), rz = Math.sin(my);
      if (!aim) { aim = C.held === 'bucket' ? { kind: 'water', x: P.W.x + fx * 8, z: P.W.z + fz * 8, y: 0 } : { kind: 'mark', u: 0, v: B.center.y }; }
      P.lock = true; P.aiming = true;
      let ar, af;
      if (diff === 'easy') { ar = I.axis('left', 'right') * (aim.kind === 'mark' ? 15 : 9) * dt; af = I.axis('back', 'fwd') * (aim.kind === 'mark' ? 12 : 9) * dt; }
      else { const lk = I.look(); ar = lk.x * (aim.kind === 'mark' ? 0.1 : 0.05); af = -lk.y * (aim.kind === 'mark' ? 0.08 : 0.05); }
      if (aim.kind === 'water') { aim.x += rx * ar + fx * af; aim.z += rz * ar + fz * af; aim.y = pl.height(aim.x, aim.z) + 0.3; RING.position.set(aim.x, aim.y, aim.z); RING.rotation.set(-Math.PI / 2, 0, 0); }
      else { aim.u = clamp(aim.u + ar, -70, 70); aim.v = clamp(aim.v + af, 2, 46); markPos(aim, _w); RING.position.copy(_w); RING.quaternion.copy(G.camera.quaternion); }
      RING.visible = true;
    } else if (aim) {
      P.lock = false; P.aiming = false; RING.visible = false; P.pose = { throw: 1 };
      const tp = aim.kind === 'water' ? { x: aim.x, y: aim.y, z: aim.z } : (markPos(aim, _w), { x: _w.x, y: _w.y, z: _w.z });
      throwT = { t: 0, sx: P.W.x, sy: P.W.y + 1.6, sz: P.W.z, tx: tp.x, ty: tp.y, tz: tp.z, kind: aim.kind, dur: aim.kind === 'water' ? 0.75 : 0.85, spot: aim.kind === 'mark' ? classify(tp.x, tp.y, tp.z) : null };
      bola.visible = true; holdItem(P, null); aim = null;
    }
    C.aim = aim;
    if (throwT) {
      throwT.t += dt / throwT.dur; const k = Math.min(1, throwT.t), T2 = throwT;
      if (T2.spot === 'mouth' || T2.spot === 'eye') { spotPos(T2.spot === 'eye' ? 'eyeP' : 'mouth', tmp); T2.tx += (tmp.x - T2.tx) * 0.2; T2.ty += (tmp.y - T2.ty) * 0.2; T2.tz += (tmp.z - T2.tz) * 0.2; }   // 겨눈 곳을 따라감(머리가 움직여도)
      bola.position.set(T2.sx + (T2.tx - T2.sx) * k, T2.sy + (T2.ty - T2.sy) * k + Math.sin(k * Math.PI) * 5, T2.sz + (T2.tz - T2.sz) * k); bola.rotation.y += dt * 14;
      if (k >= 1) {
        bola.visible = false; P.pose = null;
        if (T2.kind === 'water') {
          steamP.burst(T2.tx, T2.ty + 1, T2.tz, 20, 4, 3, 1.6);
          const g = groups.find((q) => Math.hypot(ships[q.i].x - T2.tx, ships[q.i].z - T2.tz) < 13 || Math.hypot(q.x - T2.tx, q.z - T2.tz) < 9);
          if (g) { pl.shipFire && pl.shipFire(g.i, false); g.fireOut = 14; g.hidden = true; g.hideT = 9; for (let q = 0; q < 5; q++) steamP.burst(g.x + (q - 2) * 4, g.y + 1, g.z, 16, 5, 4, 2.4); G.sfx.play('splash'); G.hud.say('hiccup', '물 + 불 = 김! 아저씨들이 김 속에 숨었어.', ['water'], { secs: 1.8 }); combos += B.act === 'fire' ? 1 : 0; }
          C.held = 'bola'; holdItem(P, 'bola');
        } else {
          const spot = T2.spot; lastSpot = spot || 'miss'; C.lastSpot = lastSpot;
          if (spot === 'tail') B.lookBack();
          else if (spot === 'eye' || spot === 'wing' || spot === 'mouth') { friendGo(spot); G.hud.say('hiccup', { eye: '눈이야! 방패 소리로!', wing: '날개야! 스노트라우트!', mouth: '입이야! 쌍둥이!' }[spot], [], { secs: 1.2 }); }
          else if (spot === 'body' || spot === 'head') G.hud.say('hiccup', '몸통은 너무 단단해. 다른 곳!', [], { secs: 1.2 });
          else G.hud.say('hiccup', '빗나갔다…', [], { secs: 0.9 });
          holdItem(P, 'bola');
        }
        throwT = null;
      }
    }
    C.st = { rescued, need, combos, knocks };
  }
  P.noReach = false; holdItem(P, null); RING.visible = false;
  G.records['10-2'] = { combos, knocks };
  G.hud.banner('구한 어른들이 무기를 내려놓았다 — 해변에 무기 더미', 'x', 3.5);
  yield* sayAll(G, [['astrid', '히컵! 투슬리스가 묶인 배가 가라앉고 있어!'], ['hiccup', '…투슬리스!']]);
  return true;

  /* 겨눔 판: 대장 몸 가운데를 지나 나를 보는 세로 판 · u = 옆(m) · v = 높이(m) */
  function markPos(a, out) {
    const dx = B.center.x - P.W.x, dz = B.center.z - P.W.z, d = Math.hypot(dx, dz) || 1, rx = dz / d, rz = -dx / d;
    out.set(B.center.x + rx * a.u * -1, a.v, B.center.z + rz * a.u * -1); return out;
  }
  /* 맞은 곳 — 겨눔 판에 비춘 자리(u·v)로 고름: 눈(동공 뼈) · 입 · 날개 막 · 꼬리(사각) · 머리·몸(단단함) · 거리/반지름이 가장 작은 곳 */
  function classify(x, y, z) {
    const dx = B.center.x - P.W.x, dz = B.center.z - P.W.z, d = Math.hypot(dx, dz) || 1, rx = dz / d, rz = -dx / d;
    const U = (px, pz) => -((px - B.center.x) * rx + (pz - B.center.z) * rz), au = U(x, z), av = y;
    const b = B.bones; let best = null, bd = 1;
    const chk = (name, px, py, pz, r) => { const q = Math.hypot(U(px, pz) - au, py - av) / r; if (q < bd) { bd = q; best = name; } };
    for (const n of ['pupilL', 'pupilR']) if (b[n]) { b[n].getWorldPosition(_v); chk('eye', _v.x, _v.y, _v.z, 4.5); }
    chk('mouth', B.mouth.x, B.mouth.y, B.mouth.z, 5.5);
    for (const m of B.memb) chk('wing', m.x, m.y, m.z, 6.5);
    const front = (-dx * Math.sin(B.yaw) - dz * Math.cos(B.yaw)) / d > 0.45;          // 내가 대장 앞쪽이면 꼬리는 몸에 가려 안 보임(옆·뒤로 돌아가야 '사각' 시도)
    if (!front) for (const n of ['tail2', 'tail3', 'tail4', 'tail5', 'tail6']) if (b[n]) { b[n].getWorldPosition(_v); chk('tail', _v.x, _v.y, _v.z, 5); }
    if (best) return best;
    for (const n of ['head', 'neck2', 'chest', 'hips']) if (b[n]) { b[n].getWorldPosition(_v); chk(n === 'head' || n === 'neck2' ? 'head' : 'body', _v.x, _v.y, _v.z, 12); }
    return best;
  }
}
function beachSense(G, C) {
  const B = C.B, P = G.player; if (!B || !B.root || !C.st) return { stage: 'intro' };
  const dx = B.center.x - P.W.x, dz = B.center.z - P.W.z, d = Math.hypot(dx, dz) || 1, rx = dz / d, rz = -dx / d;
  const uv = (x, y, z) => ({ u: +(-((x - B.center.x) * rx + (z - B.center.z) * rz)).toFixed(1), v: +y.toFixed(1) });
  const spots = {};
  if (B.bones.pupilL) { B.bones.pupilL.getWorldPosition(_v); spots.eye = uv(_v.x, _v.y, _v.z); }
  spots.mouth = uv(B.mouth.x, B.mouth.y, B.mouth.z);
  let mw = null, md = 1e9; for (const m of B.memb) { const q = uv(m.x, m.y, m.z); const dd = Math.abs(q.u) + Math.abs(q.v - 25); if (dd < md) { md = dd; mw = q; } } if (mw) spots.wing = mw;
  if (B.bones.tail4) { B.bones.tail4.getWorldPosition(_v); spots.tail = uv(_v.x, _v.y, _v.z); }
  return {
    stage: 'fight', held: C.held, aim: C.aim ? (C.aim.kind === 'mark' ? { kind: 'mark', u: +C.aim.u.toFixed(1), v: +C.aim.v.toFixed(1) } : { kind: 'water', x: +C.aim.x.toFixed(1), z: +C.aim.z.toFixed(1) }) : null, spots,
    boss: B.sense(), st: C.st, lastSpot: C.lastSpot || '', camYaw: +G.player.C.moveYaw().toFixed(3), down: C.down > 0,
    barrels: (G.place.lists.barrels || []).map((b) => ({ x: b.x, z: b.z })), ships: (G.place.lists.ships || []).map((s) => ({ x: s.x, z: s.z })),
    fireAt: C.fireAt ? { x: +C.fireAt.x.toFixed(1), z: +C.fireAt.z.toFixed(1) } : null,
  };
}

/* ══════════ ③ 물속 — 사슬 셋 중 투슬리스 고리 · 숨 고를 때 붙잡기 → 스토이크가 와서 끊음 → 서로 구함 ══════════ */
function* underwater(G, C) {
  const P = G.player, pl = G.place, A = pl.anchors;
  const T = G.dragon('nightfury', A.tl, { noCollide: true, mind: { fear: 0.4, trust: 0.95 } }); T.mind.lock = 'idle'; T.stay(); T.solid = true; T.radius = 1.6; C.T = T;
  yield* until(() => T.root && P.root, 20);
  T.place(A.tl.x, A.tl.z, A.tl.yaw);
  P.pose = { low: 0.3 };
  G.hud.goal('투슬리스를 묶은 고리 찾기');
  G.hud.say('hiccup', '(사슬이 셋… 어느 게 투슬리스 거지?)', ['rope'], { secs: 2.6 });
  let grip = 0, struggleT = 0, calm = true, phaseT = 0, wrongSaid = {}, got = false, need = G.diff === 'easy' ? 1.3 : G.diff === 'hard' ? 2.2 : 1.8;
  const ring = { x: 0, y: 0, z: 0 }, US = { x: 0, y: 0, z: 0 }, USL = [US];
  const neck = T.root.getObjectByName('neck1');
  while (!got) {
    const dt = yield; phaseT += dt;
    /* 버둥(2.2초) ↔ 숨 고름(2.6초) — 버둥일 때는 동공이 가늘고 고리가 휙휙 */
    if (calm && phaseT > 3.0) { calm = false; phaseT = 0; } else if (!calm && phaseT > 2.2) { calm = true; phaseT = 0; }
    T.pose = calm ? { lie: 0.4, pupil: 1, struggle: 0, fold: 1 } : { lie: 0.4, struggle: 1, pupil: 0.1, fold: 0.6 };
    if (neck) { neck.getWorldPosition(_v); ring.x = _v.x; ring.y = _v.y - 0.3; ring.z = _v.z; if (!calm) { ring.x += Math.sin(G.t * 9) * 0.5; ring.z += Math.cos(G.t * 7) * 0.5; } pl.chainTo(0, ring.x, ring.y, ring.z); }
    C.ring = ring; C.calm = calm;
    US.x = ring.x; US.z = ring.z; G.useSpots = USL;
    /* 다른 사슬 고리(닻·돛대) — 잡으면 '이건 아니야' */
    const ends = pl.ends;
    for (let i = 1; i < 3; i++) if (P.reach && Math.hypot(P.W.x - ends[i].x, P.W.z - ends[i].z) < 2.2 && !wrongSaid[i]) { wrongSaid[i] = true; G.hud.say('hiccup', i === 1 ? '이건 닻 사슬이야.' : '이건 부러진 돛대야.', [], { secs: 1.4 }); }
    const near = Math.hypot(P.W.x - ring.x, P.W.z - ring.z) < 2.3;
    if (P.reach && near) {
      if (calm) { grip += dt; T.mind.trust = 1; }
      else if (grip > 0) { grip = Math.max(0, grip - dt * 2); if (!C.shook) { C.shook = true; G.hud.say('hiccup', '버둥거릴 땐 놓쳐! 숨 고를 때.', [], { secs: 1.4 }); } }
    } else C.shook = false;
    C.grip = +(grip / need).toFixed(2);
    if (grip >= need) got = true;
  }
  /* 혼자 못 끊음 → 스토이크(10초 안) */
  G.useSpots = [];
  G.hud.goal('고리를 놓지 말기'); G.hud.say('hiccup', '안 끊어져…!', [], { secs: 1.4 });
  const S = G.person('stoick', A.stoick_in, { noCollide: true }); C.S = S;
  yield* until(() => S.root, 10);
  S.walkTo(ring.x + 1.6, ring.z - 1.2, 4.2); S.pose = { low: 0.4 };
  for (let t = 0; t < 8;) { const dt = yield; t += dt; if (S.arrived() || Math.hypot(S.x - ring.x, S.z - ring.z) < 2.4) break; }
  S.faceTo(ring.x, ring.z); S.pose = { hammer: 1 };
  yield* wait(0.8);
  pl.bubbleBurst && pl.bubbleBurst(ring.x, ring.y, ring.z); G.sfx.play('clang');
  pl.chainTo(0, pl.lists.chains[0].x + 1, 0.2, pl.lists.chains[0].z + 2);
  T.pose = { fold: 0.55, struggle: 0, pupil: 1 }; S.pose = { reach: 1 };
  G.hud.say('stoick', '끊었다!', [], { secs: 1.2 });
  yield* wait(1.4);
  G.hud.say('hiccup', '아빠가 와 줬어… 투슬리스가 아빠를 끌어올려!', [], { secs: 2.4 });
  /* 투슬리스가 둘을 데리고 물 위로(위로 떠오름) */
  T.manual = true; S.manual = true;
  const y0 = T.y, rise = { k: 0 };
  C.drawHook = (a, dt) => { const k = rise.k; T.root.position.y = y0 + k * k * 16; T.root.rotation.x = -0.9 * Math.min(1, k * 4); S.root.position.set(T.root.position.x + 1.2, T.root.position.y - 1.6, T.root.position.z); if (P.root) P.root.position.set(T.root.position.x - 1.2, T.root.position.y - 1.2, T.root.position.z); T.rig.flapRate = 0.6; T.rig.fold = 0.3; T.rig.update(dt); S.rig.reach = 1; S.rig.update(dt); };
  for (let t = 0; t < 2.6;) { const dt = yield; t += dt; rise.k = t / 2.6; }
  G.records['10-3'] = { grip: true };
  return true;
}
function underSense(G, C) {
  const T = C.T, pl = G.place;
  const chains = (pl.ends || []).map((e, i) => (i === 0 ? (C.ring ? { x: +C.ring.x.toFixed(2), z: +C.ring.z.toFixed(2), to: 'dragon' } : null) : { x: +e.x.toFixed(2), z: +e.z.toFixed(2), to: i === 1 ? 'anchor' : 'mast' })).filter(Boolean);
  return { chains, calm: !!C.calm, grip: C.grip || 0, tl: T && T.root ? { x: +T.x.toFixed(2), z: +T.z.toFixed(2), pupil: +T.rig.pupil.toFixed(2) } : null };
}

/* ══════════ ③-2 (이음) 해변 — 2장의 한마디를 되돌려 줌 · 스토이크의 사과 ══════════ */
function* reunion(G, C) {
  const P = G.player, pl = G.place, A = pl.anchors, a = A.shore_ship;
  const S = G.person('stoick', { x: a.x + 2.2, z: a.z + 1, yaw: -2.2 }, { noCollide: true });
  const T = G.dragon('nightfury', { x: a.x - 3, z: a.z - 2.5, yaw: 0.8 }, { mind: { fear: 0.05, trust: 1 } }); T.mind.lock = 'idle'; T.stay();
  G.putPlayer({ x: a.x, z: a.z, yaw: 1.2 });
  yield* until(() => S.root && T.root, 20);
  S.faceTo(P.W.x, P.W.z); S.pose = { talk: 0.4 };
  yield* sayAll(G, [
    ['hiccup', '아빠, 회의 때 그러셨잖아요. "바이킹은 겁나도 간다."'],
    ['stoick', '…그래. 겁나도 가는 건 너였구나.'],
    ['stoick', '내가 틀렸다. 넌 내 자랑이야.'],
    ['hiccup', '가자, 투슬리스. 이번엔 같이.', ['saddle']],
  ]);
  S.pose = { point: 1 };
  return true;
}

/* 비행 한 판 준비(④·⑤가 같이 씀) — flight.js(팀 F) + 뒤따르는 카메라 */
function* startFlight(G, C, T, world, start) {
  const P = G.player;
  const mod = yield* awaitP(import('../play/flight.js?v=16').catch(() => null));
  if (!mod || !mod.createFlight) return null;
  const F = mod.createFlight({ world, mode: G.diff, dragon: { root: T.root, rig: T.rig }, rider: { root: P.root, rig: P.rig }, rng: G.rng });
  F.setOpts({ assist: G.diff !== 'hard', ceil: world.ceil, gusts: false });
  F.place(start.x, start.y, start.z, start.yaw || 0);
  const cam = mod.createFlightCam(G.camera, { dist: 12.5, up: 3.4 });
  T.manual = true; P.cam = 'fly';
  return { F, cam };
}

/* ══════════ ④ 대장전 — 날개 막에 구멍 · 구름에 숨기 · 불난 배 위 상승 기류 ══════════ */
function* bossFight(G, C) {
  const P = G.player, pl = G.place, A = pl.anchors, diff = G.diff, need = NEED.holes[diff] || 5;
  const T = G.dragon('nightfury', A.beach, { noCollide: true, mind: { fear: 0, trust: 1 } }); C.T = T;
  const B = createBoss({ group: pl.group, diff, scale: 1, sfx: G.sfx, place: pl }); C.B = B;
  const shots = createShots(pl.group, diff); C.shots = shots;
  yield* until(() => T.root && P.root, 20);
  yield* awaitP(B.loaded);
  const sa = A.spawn_air;
  /* 불난 배 위 상승 기류(불 × 공기) — 비행 엔진 world.updrafts가 읽음 · 날갯짓 없이 솟음 · 보이는 짝 = 연기 기둥·불티 */
  const ships = pl.lists.ships || [], UPS = ships.map(() => ({ x: 0, z: 0, r: 16, top: 170, lift: 7.5 }));
  const updrafts = () => { for (let i = 0; i < ships.length; i++) { UPS[i].x = ships[i].x; UPS[i].z = ships[i].z; } return UPS; };
  const fl = yield* startFlight(G, C, T, Object.assign({}, pl.fly, { updrafts }), { x: sa.x, y: sa.y, z: sa.z, yaw: sa.yaw });
  if (!fl) return true;
  const { F, cam } = fl; C.F = F;
  B.mode = 'fly'; B.circle = { x: pl.mountain.x, z: pl.mountain.z, r: 175, dir: 1 }; B.x = pl.mountain.x + 175; B.z = pl.mountain.z; B.y = 100; B.yaw = 0; B.cool = 5;
  const prevClean = C.cleanup;
  C.cleanup = () => { T.manual = false; P.cam = 'follow'; G.camDraw = null; F.dispose && F.dispose(); B.dispose(); shots.dispose(); prevClean && prevClean(); };
  G.camDraw = (a, dt) => { F.draw(a, dt); cam.update(dt, F); B.draw(dt); };
  const S = F.state;
  let hits = 0, hitCd = 0, gust = 0, gustYaw = 0, sayCd = 0, t = 0;
  const me = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, hidden: false, cloud: null, revealed: false, near: false };
  B.on('hole', (n) => { G.hud.goal('대장 날개에 구멍 ' + n + '/' + need); if (n === 1) G.hud.say('hiccup', '날개 막이 약해! 구멍이 났어!', [], { secs: 1.6 }); if (n === Math.ceil(need / 2)) G.hud.say('astrid', '대장이 낮게 날기 시작했어!', [], { secs: 1.8 }); });
  B.on('gust', (g) => { const dx = S.x - B.x, dz = S.z - B.z, d = Math.hypot(dx, dz); if (d < 120 && (Math.sin(B.yaw) * dx + Math.cos(B.yaw) * dz) / (d || 1) > 0.2) { gust = 1; gustYaw = B.yaw; G.hud.say('hiccup', '날갯바람이다! 꽉 잡아!', [], { secs: 1.2 }); } });
  B.on('found', () => { G.hud.say('fishlegs', '냄새로 찾았어! 거기서 나와!', [], { secs: 1.6 }); });
  B.on('warn', (w) => { if (w.kind === 'fire' && w.aimAtMe && sayCd <= 0) { sayCd = 4; G.hud.say('hiccup', '목이 부푼다 — 불이 온다!', [], { secs: 1.2 }); } });
  G.hud.goal('대장 날개에 구멍 0/' + need); G.hud.howto(diff === 'easy' ? 'boss10e' : 'boss10', 10);
  G.hud.say('hiccup', '날개 막을 노리자. 구름에 숨었다가 쏘고 — 바로 옮겨!', [], { secs: 3 });
  G.book.note('boss', 'weak', '날개 막이 약함 · 소리·냄새로 찾음', false);
  const onHit = (part, h) => { if (part === 'wing') B.addHole(h.memb); else if (sayCd <= 0) { sayCd = 2.5; G.hud.say('hiccup', part === 'mouth' ? '아직 입은 아니야!' : '몸은 너무 단단해 — 날개 막!', [], { secs: 1.2 }); } };
  while (B.holes < need) {
    const dt = yield; t += dt; const I = G.input;
    if (hitCd > 0) hitCd -= dt; if (sayCd > 0) sayCd -= dt;
    /* 날갯바람(옆에서 밂 · 비행 엔진 돌풍 칸을 씀) */
    if (gust > 0) { gust -= dt * 1.2; const k = Math.max(0, gust) * 30; F.push(Math.sin(gustYaw) * k, 0, Math.cos(gustYaw) * k); }
    F.step(dt, I);
    C.lift = S.updraft;
    /* 숨음·드러남 */
    const cloud = pl.inCloud(S.x, S.y, S.z);
    me.x = S.x; me.y = S.y; me.z = S.z; me.vx = S.vx; me.vy = S.vy; me.vz = S.vz; me.hidden = !!cloud; me.cloud = cloud; me.revealed = false;
    me.near = Math.hypot(S.x - B.center.x, S.y - B.center.y, S.z - B.center.z) < 75;
    /* 쏘기(F) — 입에서 앞으로 · 조준 도움 · 구름 속에서 쏘면 자리가 드러남 */
    if (I.tap('use')) {
      const cp = Math.cos(S.pitch), fx = Math.sin(S.yaw) * cp, fy = Math.sin(S.pitch), fz = Math.cos(S.yaw) * cp;
      if (shots.fire(S.x + fx * 4, S.y + 0.6 + fy * 4, S.z + fz * 4, fx, fy, fz, B)) { G.sfx.play('pop'); if (cloud) { me.revealed = true; if (sayCd <= 0) { sayCd = 3; G.hud.say('hiccup', '쏘면 들켜! 옮기자.', [], { secs: 1 }); } } }
      else if (sayCd <= 0) { sayCd = 2; G.hud.say('hiccup', '숨 고르는 중… 조금만!', [], { secs: 0.9 }); }
    }
    shots.step(dt, B, onHit);
    B.step(dt, me);
    /* 맞음: 불 · 꼬리 쓸기 · 몸에 부딪힘 */
    if (hitCd <= 0 && (B.fireHits(S.x, S.y, S.z, 2) || (B.tailK > 1 && B.touch(S.x, S.y, S.z, 2.5, 'tail')))) {
      hitCd = 2.2; S.speed *= 0.7; S.boost = 0; B.fx.smoke.burst(S.x, S.y, S.z, 12, 4, 2, 1);
      if (diff === 'easy') G.hud.say('hiccup', '뜨거워! …괜찮아, 계속!', [], { secs: 1 });
      else { hits++; G.hud.say('hiccup', hits === 1 ? '으앗! 한 번 맞았어.' : '또 맞았어!', [], { secs: 1.2 }); }
    }
    { const c = B.touch(S.x, S.y, S.z, 2); if (c) { const cx = (c.ax + c.bx) / 2, cy = (c.ay + c.by) / 2, cz = (c.az + c.bz) / 2, dx = S.x - cx, dy = S.y - cy, dz = S.z - cz, d = Math.hypot(dx, dy, dz) || 1; S.x += dx / d * 3; S.y += dy / d * 3; S.z += dz / d * 3; S.speed *= 0.85; } }
    /* 불이 구름을 태움(구름째) */
    if (B.fire && B.fire.t > 0.3) for (const c of pl.lists.clouds || []) if (c.burnT <= 0) { const f = B.fire, ex = f.tx - f.ax, ey = f.ty - f.ay, ez = f.tz - f.az, L = Math.hypot(ex, ey, ez) || 1, tt = clamp(((c.x - f.ax) * ex + (c.y - f.ay) * ey + (c.z - f.az) * ez) / (L * L), 0, 1); if (Math.hypot(f.ax + ex * tt - c.x, f.ay + ey * tt - c.y, f.az + ez * tt - c.z) < c.r) pl.burnCloud(c); }
    if (hits >= (diff === 'hard' ? 2 : 3)) { yield* sayAll(G, [['astrid', '히컵, 너무 많이 맞았어! 다시 — 구름 사이로!']]); return 'retry'; }
    C.hits = hits; C.cloud = !!cloud;
  }
  G.records['10-4'] = { hits, fired: shots.fired, t: +t.toFixed(1) };
  G.hud.banner('날개가 너덜너덜 — 대장이 낮고 느리게 난다', 'wind', 3.2);
  yield* wait(1.2);
  return true;
}
function bossSense(G, C) {
  const F = C.F, B = C.B, sh = C.shots; if (!F || !B || !B.root) return { stage: 'wait' };
  const S = F.state, tg = [];
  for (const m of B.memb) if (!m.holed && G.vis(m.x, m.y, m.z, 400)) tg.push({ x: +m.x.toFixed(1), y: +m.y.toFixed(1), z: +m.z.toFixed(1) });
  const cl = []; for (const c of G.place.lists.clouds || []) if (c.burnT <= 0 && Math.hypot(c.x - S.x, c.z - S.z) < 260) cl.push({ x: c.x, y: c.y, z: c.z, r: c.r });
  return {
    mode: 'fly', x: +S.x.toFixed(1), y: +S.y.toFixed(1), z: +S.z.toFixed(1), vx: +S.vx.toFixed(1), vy: +S.vy.toFixed(1), vz: +S.vz.toFixed(1), yaw: +S.yaw.toFixed(3), pitch: +S.pitch.toFixed(3),
    speed: +(S.speed + S.boost).toFixed(1), tail: S.tail, wingsUp: F.wingsUp ? F.wingsUp() : false, fallen: !!S.fallen, grab: S.grab, ground: +G.place.fly.ground(S.x, S.z).toFixed(1),
    boss: B.sense(), targets: tg, clouds: cl, shots: sh.n, cone: sh.cone, hidden: !!C.cloud, hits: C.hits || 0, lift: !!C.lift, ships: (G.place.lists.ships || []).map((s) => ({ x: s.x, z: s.z })),
    bounds: G.place.sky,
  };
}

/* ══════════ ⑤ 마지막 — 꼬리날개 불(4초 예고) → 둔해짐 → 곧장 아래로 → 숨 들이켬 → 입 안으로 → 솟구치기 ══════════ */
function* finale(G, C) {
  const P = G.player, pl = G.place, A = pl.anchors, diff = G.diff;
  const T = G.dragon('nightfury', A.beach, { noCollide: true, mind: { fear: 0, trust: 1 } }); C.T = T;
  const B = createBoss({ group: pl.group, diff, scale: 1, sfx: G.sfx, place: pl }); C.B = B;
  const shots = createShots(pl.group, diff);
  yield* until(() => T.root && P.root, 20);
  yield* awaitP(B.loaded);
  for (let i = 0; i < (NEED.holes[diff] || 5); i++) { const m = B.memb.find((q) => !q.holed && (i % 2 ? q.side === 'L' : q.side === 'R')) || B.memb.find((q) => !q.holed); if (m) B.addHole(m); }
  B.mode = 'script'; B.grounded = false;
  T.manual = true; P.cam = 'fly';
  /* 내가 모는 단순 비행(장이 직접 · 이 차례만) — 꼬리날개 불에 따라 조종이 둔해짐 */
  const M = { x: -60, y: 250, z: 430, yaw: Math.PI, pitch: 0, roll: 0, speed: 26, ctl: 1, ph: 0 };
  const fin = flameMesh(1.2); fin.visible = false; T.root.add(fin); fin.position.set(0.5, 0.95, -4.4);
  const finGlow = glowSprite(0xff8a3a, 3, 0.7); finGlow.visible = false; T.root.add(finGlow); finGlow.position.copy(fin.position);
  const SADDLE = new THREE.Vector3(0, 1.16, -0.05);
  const cam = { x: M.x, y: M.y + 4, z: M.z - 12, lx: M.x, ly: M.y, lz: M.z, init: false, mode: 'follow', k: 0 };
  G.camDraw = (a, dt) => {
    _e.set(-M.pitch, M.yaw, M.roll, 'YXZ'); T.root.quaternion.setFromEuler(_e); T.root.position.set(M.x, M.y - 1.2, M.z);
    const R = T.rig; M.ph += dt * (M.flap ? 1.6 : 0.6) * TAU; R.fold = M.tuck || 0; R.flapRate = M.flap ? 0.7 : 0.15; R.flap = M.ph - dt * (1.6 + R.flapRate * 2.2) * TAU; R.glide = M.flap ? 0 : 0.8; R.headUp = clamp(M.pitch, -0.6, 0.6); R.jaw = M.shoot || 0; R.update(dt);
    if (P.root) { _v.copy(SADDLE).applyQuaternion(T.root.quaternion); P.root.position.set(M.x + _v.x, M.y - 1.2 + _v.y, M.z + _v.z); P.root.quaternion.copy(T.root.quaternion); P.rig.ride = 1; P.rig.speed = 0; P.rig.update(dt); }
    B.draw(dt);
    /* 카메라: 따라감 → 내리꽂을 땐 아래에서 올려다봄(뒤따르는 대장의 입이 보이게) → 솟구칠 땐 다시 따라감 */
    const fx = Math.sin(M.yaw) * Math.cos(M.pitch), fy = Math.sin(M.pitch), fz = Math.cos(M.yaw) * Math.cos(M.pitch);
    let px, py, pz, lx, ly, lz;
    if (cam.mode === 'up') { px = M.x + fx * 26 + Math.sin(M.yaw + 1.57) * 9; py = M.y + fy * 26; pz = M.z + fz * 26 + Math.cos(M.yaw + 1.57) * 9; lx = (M.x + B.x) / 2; ly = (M.y + B.y) / 2; lz = (M.z + B.z) / 2; }
    else if (cam.mode === 'far') { px = cam.px; py = 92; pz = cam.pz; lx = cam.fx; ly = cam.fy; lz = cam.fz; }
    else { px = M.x - fx * 12; py = M.y - fy * 12 + 3.6; pz = M.z - fz * 12; lx = M.x + fx * 20; ly = M.y + fy * 20; lz = M.z + fz * 20; }
    const k = cam.init ? 1 - Math.exp(-dt * (cam.mode === 'up' ? 3 : 5)) : 1; cam.init = true;
    cam.x += (px - cam.x) * k; cam.y += (py - cam.y) * k; cam.z += (pz - cam.z) * k; cam.lx += (lx - cam.lx) * k; cam.ly += (ly - cam.ly) * k; cam.lz += (lz - cam.lz) * k;
    G.camera.position.set(cam.x, cam.y, cam.z); G.camera.lookAt(cam.lx, cam.ly, cam.lz);
  };
  const prevClean = C.cleanup;
  C.cleanup = () => { T.manual = false; P.cam = 'follow'; G.camDraw = null; fin.removeFromParent(); finGlow.removeFromParent(); B.dispose(); shots.dispose(); prevClean && prevClean(); };
  const I = () => G.input;
  /* 대장: 뒤를 따라옴(장이 놓음) */
  const follow = (dt, back, up) => { const fx = Math.sin(M.yaw) * Math.cos(M.pitch), fy = Math.sin(M.pitch), fz = Math.cos(M.yaw) * Math.cos(M.pitch); const tx = M.x - fx * back, ty = M.y - fy * back + up, tz = M.z - fz * back, k = Math.min(1, dt * 2); B.x += (tx - B.x) * k; B.y += (ty - B.y) * k; B.z += (tz - B.z) * k; B.yaw = Math.atan2(M.x - B.x, M.z - B.z); B.pitch = clamp(Math.atan2(M.y - B.y, Math.hypot(M.x - B.x, M.z - B.z)), -1.3, 0.6); };
  B.x = M.x - 70; B.y = M.y + 10; B.z = M.z + 60;
  const fly = (dt, turnK) => { const tin = I().axis('right', 'left'); M.yaw = wrap(M.yaw + tin * 0.9 * turnK * dt); M.roll += (-tin * 0.5 * turnK - M.roll) * Math.min(1, dt * 3); M.x += Math.sin(M.yaw) * Math.cos(M.pitch) * M.speed * dt; M.y += Math.sin(M.pitch) * M.speed * dt; M.z += Math.cos(M.yaw) * Math.cos(M.pitch) * M.speed * dt; };
  C.phase = 'burn'; G.hud.goal('대장을 떼어 내기'); G.hud.howto('dive10', 9);
  G.hud.say('hiccup', '꼬리날개에 불티가…!', ['finNew'], { secs: 2 });
  /* ── A. 꼬리날개 불(4초 예고: 불꽃이 꼬리 끝에서 커짐) → 조종이 점점 둔해짐 ── */
  for (let t = 0; t < 5.5;) {
    const dt = yield; t += dt; const k = Math.min(1, t / 4);
    fin.visible = finGlow.visible = true; fin.scale.setScalar(0.25 + k * 0.85); finGlow.scale.setScalar(1.2 + k * 2);
    M.ctl = 1 - 0.55 * k; M.flap = true; M.pitch += (0 - M.pitch) * Math.min(1, dt * 2); fly(dt, M.ctl); follow(dt, 55, 12); B.step(dt, M);
    if (t > 4 && !C.slowSaid) { C.slowSaid = true; G.hud.say('hiccup', '꼬리가 타서 말을 잘 안 들어!', [], { secs: 1.8 }); }
  }
  let tries = 0;
  /* ── B~D 되풀이: 곧장 아래로 → 입이 밝아질 때 쏘기 → 솟구치기 ── */
  for (;;) {
    tries++;
    C.phase = 'dive'; G.hud.goal('곧장 아래로!'); cam.mode = 'follow';
    let diveT = 0, idle = 0;
    M.y = Math.max(M.y, 250);
    while (diveT < 1.2) {
      const dt = yield; const down = I().on('back'); idle += dt;
      M.pitch += ((down ? -1.35 : 0) - M.pitch) * Math.min(1, dt * (down ? 2.2 : 1.5)); M.flap = !down; M.tuck = down ? 0.6 : 0;
      if (M.pitch < -0.9) diveT += dt; else diveT = Math.max(0, diveT - dt);
      M.speed += ((down ? 46 : 24) - M.speed) * Math.min(1, dt * 0.8); fly(dt, M.ctl); if (M.y < 80) { M.y = 80; }
      follow(dt, 50, 10); B.step(dt, M);
      if (idle > 10 && !C.hint1) { C.hint1 = true; G.hud.say('hiccup', '구름 아래로 곧장! (아래 방향키)', [], { secs: 2 }); }
    }
    C.phase = 'window'; G.hud.goal('입이 밝아질 때 — 쏘기!'); cam.mode = 'up';
    B.begin('fire', 'me'); B.act = 'fire'; B.actT = 0;
    let shot = 0, early = false; const T0 = WARN[diff], win = diff === 'easy' ? 1.7 : diff === 'hard' ? 0.7 : 1.1;
    let tw = 0;
    while (true) {
      const dt = yield; tw += dt;
      const down = I().on('back'); M.pitch += ((down ? -1.35 : -1.1) - M.pitch) * Math.min(1, dt * 2); M.tuck = 0.6; M.flap = false;
      M.speed += (30 - M.speed) * Math.min(1, dt * 0.8); fly(dt, M.ctl * 0.5);
      follow(dt, 38, 6);
      B.inhale = clamp(tw / T0, 0, 1); B.act = ''; B.warn = null;          // 숨 들이켬은 장이 그림(불은 쏘지 않음 — 입 안을 노릴 틈)
      B.jawOpen = B.inhale; B.step(dt, M);
      const open = tw > T0 * 0.82 && tw < T0 * 0.82 + win;
      C.window = open; C.glow = +B.inhale.toFixed(2);
      if (I().tap('use')) { if (open) { shot = 1; break; } else if (tw < T0 * 0.82) { early = true; G.hud.say('hiccup', '아직! 입이 더 밝아질 때.', [], { secs: 1 }); } }
      if (tw > T0 * 0.82 + win) break;
      if (M.y < 70) break;
    }
    if (shot) {
      /* 입 안으로(뒤로 쏘는 빛 덩어리 → 목 안에서 터짐) */
      M.shoot = 0.8; G.sfx.play('pop');
      const bolt = { x: M.x, y: M.y, z: M.z }, tgt = B.mouth;
      for (let t = 0; t < 0.45;) { const dt = yield; t += dt; const k = t / 0.45; bolt.x = M.x + (tgt.x - M.x) * k; bolt.y = M.y + (tgt.y - M.y) * k; bolt.z = M.z + (tgt.z - M.z) * k; B.fx.embers.puff(bolt.x, bolt.y, bolt.z, 0, 0, 0, 0.3); fly(dt, 0.3); follow(dt, 38, 6); B.step(dt, M); }
      M.shoot = 0; B.inhale = 0; B.stun(8); B.fx.embers.burst(B.mouth.x, B.mouth.y, B.mouth.z, 40, 16, 6, 1.2); B.fx.smoke.burst(B.mouth.x, B.mouth.y, B.mouth.z, 30, 8, 3, 2);
      G.sfx.play('boom'); G.hud.say('hiccup', '입 안에 들어갔다!', [], { secs: 1.2 });
      /* 솟구치기 — 땅이 다가옴 · W(↑)를 눌러야 */
      C.phase = 'pull'; G.hud.goal('솟구쳐!'); cam.mode = 'follow';
      let pulled = false, tp = 0;
      while (tp < 3.2) {
        const dt = yield; tp += dt; const up = I().on('fwd');
        if (up) pulled = true;
        M.pitch += ((pulled ? 0.75 : -1.2) - M.pitch) * Math.min(1, dt * (pulled ? 2.6 : 1)); M.flap = pulled; M.tuck = pulled ? 0 : 0.6;
        fly(dt, 0.4); const g = pl.fly.ground(M.x, M.z) + 6; if (M.y < g) M.y = g;
        follow(dt, 30 + tp * 8, 4 - tp * 6); B.step(dt, M);
        if (pulled && M.pitch > 0.45) break;
        if (!pulled && M.y < pl.fly.ground(M.x, M.z) + 22) break;
      }
      if (pulled) break;
      G.hud.say('hiccup', '늦었다! 다시 위로…', [], { secs: 1.4 });
    } else G.hud.say('hiccup', early ? '너무 일렀어. 다시!' : '놓쳤다 — 다시 위로!', [], { secs: 1.4 });
    /* 다시 위로(장이 끌어올림 · 3초) */
    C.phase = 'climb'; cam.mode = 'follow'; B.inhale = 0;
    for (let t = 0; t < 3;) { const dt = yield; t += dt; M.pitch += (0.7 - M.pitch) * Math.min(1, dt * 2); M.flap = true; M.tuck = 0; M.speed += (30 - M.speed) * Math.min(1, dt); M.yaw = wrap(M.yaw + dt * 1.05); fly(dt, 0.6); follow(dt, 60, 14); B.step(dt, M); }
    if (tries >= 6 && diff === 'easy') break;
  }
  /* 와! — 솟구치는 1초 · 그다음 먼 구도: 대장은 날개 구멍 때문에 못 솟고 땅으로(연기·그림자 · 소리 상한) */
  G.hud.goal(''); G.sfx.play('whoosh');
  for (let t = 0; t < 1.1;) { const dt = yield; t += dt; M.pitch += (0.9 - M.pitch) * Math.min(1, dt * 3); M.flap = true; fly(dt, 0.6); B.y -= 30 * dt; B.pitch = -1.1; B.step(dt, M); }
  G.hud.banner('와! 입 안으로 쏘고 솟구쳤다', 'wing', 2.5);
  cam.mode = 'far'; cam.fx = B.x; cam.fy = B.y; cam.fz = B.z; cam.init = false; cam.px = (A.crash || B).x + 140; cam.pz = (A.crash || B).z + 190;
  const smoke = makeParts(pl.group, 120, 0x3a3634, 26); C.smk = smoke;
  for (let t = 0; t < 4.2;) {
    const dt = yield; t += dt; const cr = A.crash || A.boss_stand; B.x += (cr.x - B.x) * Math.min(1, dt * 0.7); B.z += (cr.z - B.z) * Math.min(1, dt * 0.7); B.y = Math.max(pl.fly.ground(B.x, B.z) - 6, B.y - 42 * dt); B.pitch = -1.0; B.step(dt, M); fly(dt, 0.5); M.pitch += (0.3 - M.pitch) * dt;
    cam.fx = B.x; cam.fy = Math.max(B.y, 20); cam.fz = B.z;
    if (B.y <= pl.fly.ground(B.x, B.z) - 5) { if (!C.crash) { C.crash = true; G.sfx.play('boom'); B.root.visible = false; } if ((t * 20 | 0) % 2 === 0) smoke.burst(B.x + Math.sin(t * 7) * 20, pl.fly.ground(B.x, B.z) + 5, B.z + Math.cos(t * 5) * 20, 6, 10, 14, 4); }
    smoke.step(dt, -2);
  }
  G.records['10-5'] = { tries };
  return true;
}
function finaleSense(G, C) { return { phase: C.phase || 'burn', window: !!C.window, glow: C.glow || 0 }; }

/* ══════════ ⑥ (이음 + 걷기) 연기 — 잠깐 스토이크로 걷기 → 빈 안장 → 날개를 펴 히컵을 보여 줌 → '고맙다' · 하늘이 맑아짐 ══════════ */
function* aftermath(G, C) {
  const P = G.player, pl = G.place, A = pl.anchors, cr = A.crash;
  const T = G.dragon('nightfury', cr, { mind: { fear: 0, trust: 1 } }); T.mind.lock = 'idle'; T.stay(); T.solid = true; T.radius = 1.8; C.T = T;
  const S = G.person('stoick', A.stoick_in, { noCollide: true }); S.manual = true; C.S = S; const S0 = A.stoick_in;
  const H = G.person('hiccup', { x: cr.x, z: cr.z }, { noCollide: true }); H.manual = true; C.H = H;
  yield* until(() => T.root && S.root && H.root && P.root, 20);
  T.pose = { fold: 1, lie: 0.5, crouch: 0.6 }; H.root.visible = false;
  P.hidden = true; G.putPlayer(A.stoick_in);
  C.drawHook = (a, dt) => { if (!S.root || !P.W) return; P.W.draw(a, S.root); S.rig.speed = Math.min(1, P.W.speed / 4.2); S.rig.low = 0; for (const n in S.pose) if (n in S.rig) S.rig[n] = S.pose[n]; S.rig.update(dt); };
  const prevClean = C.cleanup; C.cleanup = () => { P.hidden = false; prevClean && prevClean(); };
  G.hud.goal('연기 속에서 찾기');
  G.hud.say('stoick', '히컵! …히컵!', [], { secs: 2 });
  G.useSpots = [{ x: cr.x, y: cr.y, z: cr.z }];
  yield* until(() => Math.hypot(P.W.x - cr.x, P.W.z - cr.z) < 6.8);
  G.useSpots = []; P.lock = true; S.pose = { low: 0.6 }; C.found = true;
  const c0 = { yaw: P.C.yaw, pitch: P.C.pitch, dist: P.C.dist }; P.C.yaw += 0.85; P.C.pitch = 0.5; P.C.dist = 9;   // 비스듬히 내려다봄(투슬리스·히컵·스토이크가 한 화면)
  const pc = C.cleanup; C.cleanup = () => { Object.assign(P.C, c0); pc && pc(); };
  G.hud.goal('');
  yield* sayAll(G, [['stoick', '…안장이 비었구나.']]);
  /* 날개를 펴 보여 줌 — 날개 밑에 히컵(눈을 감고 숨 쉼) */
  { const sx = S0.x - cr.x, sz = S0.z - cr.z, l = Math.hypot(sx, sz) || 1, hx = cr.x + sx / l * 1.4 + sz / l * 3.0, hz = cr.z + sz / l * 1.4 - sx / l * 3.0; H.root.position.set(hx, pl.height(hx, hz) + 0.25, hz); H.root.rotation.set(-Math.PI / 2 * 0.95, Math.atan2(sx, sz), 0, 'YXZ'); H.rig.sit = 0; H.rig.update(0.016); }
  for (let t = 0; t < 2.2;) { const dt = yield; t += dt; T.pose = { fold: Math.max(0, 1 - t / 1.6), lie: 0.5 - t * 0.2, headUp: 0.3 }; if (t > 0.7) H.root.visible = true; }
  S.pose = { pet: 1, low: 0.5 };
  yield* sayAll(G, [['stoick', '살아 있어…! 숨을 쉬어!'], ['stoick', '고맙다. 내 아들을 지켜 줘서.', ['heart']]]);
  /* 하늘이 맑아짐 · 드래곤들이 흩어져 날아감 · 무기 더미 */
  const fl = [];
  for (let k = 0; k < 6; k++) { const f = flyer(G, ['gronckle', 'nadder', 'terror', 'zippleback', 'gronckle', 'nightmare'][k], null, cr.x + Math.cos(k) * 60, 45 + k * 6, cr.z - 80 + Math.sin(k) * 40, { speed: 18 }); f.goTo(cr.x + Math.cos(k * 1.1) * 600, 120 + k * 10, cr.z + Math.sin(k * 1.1) * 600 - 200, 22); fl.push(f); }
  C.fl = fl;
  pl.pile && pl.pile(16);
  for (let t = 0; t < 6.5;) { const dt = yield; t += dt; pl.setClear && pl.setClear(t / 6); for (const f of fl) { f.step(dt); f.draw(dt); } }
  G.hud.banner('둥지 섬 하늘이 맑아졌다 · 드래곤들이 흩어져 날아간다', 'heart', 4);
  G.book.note('boss', 'other', '대장만 나빴다 — 이제 드래곤들은 자유', false);
  const rec = G.records; rec['10'] = { combos: (rec['10-2'] || {}).combos || 0, hits: (rec['10-4'] || {}).hits || 0, t: +((rec['10-4'] || {}).t || 0).toFixed(0) };
  yield* wait(2.5);
  return true;
}
function afterSense(G, C) { const a = G.place.anchors.crash; return { target: a ? { x: a.x, z: a.z } : null, found: !!C.found }; }

export const chapter = {
  id: 10, title: '10장 · 대장 드래곤', sub: '안개 바다 → 둥지 섬 해변 → 물속 → 하늘',
  steps: [
    { id: '10-1', verb: 'track', howtoVerb: 'point10', place: 'nest', time: 'nest', variant: 'fog', goal: '불빛 띠를 따라 손짓하기', limit: 220,
      hints: { 1: '물 위에 떠 있는 불빛을 찾아.', 2: '불빛이 보이는 쪽으로 방향키 — 아스트리드가 따라 돌아.' }, run: fogRide, sense: fogSense },
    { id: '10-2', verb: 'throw', howtoVerb: 'mark10', place: 'nest', time: 'nest', variant: 'beach', at: 'beach', goal: '어른들을 구하기', limit: 330,
      hints: { 1: '눈·날개·입 — 어디를 맞히면 누가 올까?', 2: '입(가스) 다음에 날개(불)를 맞히면 펑! · 통 옆에서 F = 물통 → 불난 배에.' }, run: beachBattle, sense: beachSense },
    { id: '10-3', verb: 'approach', place: 'nest', time: 'nest', variant: 'under', at: 'under_in', goal: '투슬리스를 묶은 고리 찾기', limit: 160,
      hints: { 1: '사슬을 따라가 봐. 어느 게 투슬리스한테 가지?', 2: '투슬리스가 숨 고를 때(눈이 동그랄 때) F를 꾹.' }, run: underwater, sense: underSense },
    { id: '10-3b', place: 'nest', time: 'nest', variant: 'beach', run: reunion },
    { id: '10-4', verb: 'fly', howtoVerb: 'boss10', place: 'nest', time: 'nest', variant: 'beach', goal: '대장 날개에 구멍 내기', limit: 380,
      hints: { 1: '목이 부풀고 입이 밝아지면 옆으로 피해!', 2: '구름에 숨었다가 날개 막을 쏘고(F) — 바로 옮겨. 불난 배 위는 저절로 솟아.' }, run: bossFight, sense: bossSense },
    { id: '10-5', verb: 'fly', howtoVerb: 'dive10', place: 'nest', time: 'nest', variant: 'beach', goal: '대장을 떼어 내기', limit: 220,
      hints: { 1: '아래 방향키로 곧장 내리꽂아.', 2: '입이 가장 밝을 때 F · 그다음 위 방향키로 솟구쳐!' }, run: finale, sense: finaleSense },
    { id: '10-6', place: 'nest', time: 'nest', variant: 'after', at: 'stoick_in', run: aftermath, sense: afterSense },
  ],
};
