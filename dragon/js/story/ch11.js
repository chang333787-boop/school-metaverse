// 종장 · 함께 사는 버크(design §2 종장 · reference #28 · 완성도 3 = 빼는 차례 1번: '또 하기'는 먹이 주기·낚시·책 채우기 셋만)
// 이음: 깨어남(고버 한 줄 · 첫걸음 비틀 → 투슬리스가 머리로 받침 · 꼬리 끝을 히컵 다리 옆에(말 없음) · 고버 "다리 친구" · 스토이크 "이 낙서가 버크를 바꿨구나")
// → 이음 + 손일: 새 꼬리날개에 무늬 다시 그리기 → 이음: 마을 위를 함께 날기(실패 없음) → 또 하기 ① 먹이 주기[다가가] ② 낚시[박자] ③ 드래곤 책 채우기[다가가] → 끝(G.ending — 엔딩·크레딧은 메인)
// 다리는 고버 한 줄 + 몸짓으로만(design §8) · 대사는 모두 우리 말로 새로 · 실제 학생 이름 X · 마을에 드래곤이 함께 삶(지붕 위 테러 · 광장 그롱클 · 대장간 지플백)
import * as THREE from 'three';
import { wait, until, sayAll } from './runner.js?v=16';
import { holdItem, makePuffs } from './fx.js?v=16';
import { loadModel } from '../look/models.js?v=16';
import { createHumanRig } from '../look/human_rig.js?v=16';
import { glowSprite } from '../look/kit.js?v=16';
import { createElements } from '../play/elements.js?v=16';
import { awaitP, prop, ensureVillage } from './fx1.js?v=16';
import { tlSense } from './ch4.js?v=16';
import { flySense } from './flysense.js?v=16';

const ang = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));

/* 히컵 = 의족 모델로(종장 내내) — 손에 든 것은 새 손에 다시 붙임 */
function* legOn(G) {
  const P = G.player; if (P.leg) return;
  const m = yield* awaitP(loadModel('assets/models/hiccup_leg.glb?v=16').catch(() => null));
  if (!m || P.leg) return;
  const old = P.root; P.root = m.root; P.rig = createHumanRig(m.bones, m.root); P.bones = m.bones; P.leg = true; P.itemObj = null;
  if (old) { m.root.position.copy(old.position); m.root.rotation.copy(old.rotation); if (old.parent) old.parent.add(m.root); old.removeFromParent(); }
  if (P.item) G.hold(P.item);
}
/* 투슬리스(장소가 바뀔 때까지 이어짐) */
const tl = (G, at) => G.castBy.tl || G.dragon('nightfury', at, { keep: 'tl', mind: { fear: 0.05, trust: 0.95, curious: 0.6 } });
/* 마을에 함께 사는 드래곤(장소가 바뀔 때까지) — 지붕 위 테러 · 광장 가장자리 그롱클 · 회관 계단 내더 */
function living(G) {
  if (G._liv === G.place) return; G._liv = G.place;
  const L = [['terror', { x: -22, z: 30, yaw: 1 }, 3], ['gronckle', { x: -34, z: 24, yaw: 1.2 }, 4], ['nadder', { x: 7, z: -40, yaw: 2.6 }, 5]];
  L.forEach(([k, at, w], i) => { const d = G.dragon(k, at, { keep: 'liv' + i, wander: w, wanderPh: i * 2, mind: { fear: 0.1, trust: 0.6 } }); d.mind.lock = 'idle'; d.solid = k !== 'terror'; d.radius = 1.4; });
}

/* ── 이음: 깨어남 → 투슬리스와 나란히 광장까지 ── */
function* wake(G, C) {
  yield* ensureVillage(G, C);                                 // 늘 같은 마을 배치
  const P = G.player, pl = G.place, A = pl.anchors, door = A.house_hiccup || { x: -28.7, z: -30.8, yaw: 5.44 }, plaza = A.plaza || { x: 0, z: 6.5 };
  living(G);
  yield* legOn(G);
  const fwd = { x: Math.sin(door.yaw), z: Math.cos(door.yaw) };
  const T = tl(G, { x: door.x + fwd.x * 5 + fwd.z * 2.5, z: door.z + fwd.z * 5 - fwd.x * 2.5, yaw: door.yaw + Math.PI }); C.T = T; T.mind.lock = 'idle'; T.stay();
  const Gb = G.person('gobber', { x: door.x + fwd.x * 2.4 - fwd.z * 1.8, z: door.z + fwd.z * 2.4 + fwd.x * 1.8, yaw: door.yaw + Math.PI }, { noCollide: true });
  yield* until(() => T.root && Gb.root, 6);
  Gb.faceTo(P.W.x, P.W.z); Gb.pose = { talk: 1 };
  yield* sayAll(G, [['gobber', '깼구나! 큰 불에서 다쳤지만, 이제 괜찮아.']]);
  G.hud.goal('투슬리스와 광장까지'); C.target = { x: plaza.x, z: plaza.z };
  /* 첫걸음 비틀 → 투슬리스가 다가와 머리로 받침 → 그 뒤로는 옆에서 나란히 */
  let walked = 0, stumbled = false, side = 1;
  while (G.dist(P.W, plaza) > 7) {
    const dt = yield;
    if (P.W.speed > 0.5) walked += dt;
    if (!stumbled && walked > 0.35) { stumbled = true; P.pose = { stumble: 1 }; P.lock = true; T.goTo(P.W.x + fwd.z * 1.4, P.W.z - fwd.x * 1.4, 3, 0.4); C.st = 1.4; G.hud.say('hiccup', '어, 어어…', [], { secs: 1 }); }
    if (C.st > 0) { C.st -= dt; T.faceTo(P.W.x, P.W.z); T.pose = { headUp: 0.5, crouch: 0.3 }; if (C.st <= 0) { P.lock = false; P.pose = null; T.pose = {}; G.hud.say('hiccup', '…고마워, 친구.', [], { secs: 1.4 }); } continue; }
    if (stumbled) {                                          // 옆에서 나란히 · 광장 쪽으로 반 걸음 앞서 걸어 길을 알려 줌(1학년 · 글 없이)
      const gx = plaza.x - P.W.x, gz = plaza.z - P.W.z, gl = Math.hypot(gx, gz) || 1, ux = gx / gl, uz = gz / gl;
      const sx = P.W.x + ux * 2.2 - uz * 1.6 * side, sz = P.W.z + uz * 2.2 + ux * 1.6 * side;
      if (Math.hypot(T.x - sx, T.z - sz) > 0.8) T.goTo(sx, sz, Math.max(1.4, P.W.speed + 0.8), 0.3); else T.stay();
      if (P.W.speed < 0.3) T.faceTo(T.x + ux * 5, T.z + uz * 5);
    }
  }
  G.hud.goal('');
  /* 투슬리스가 타 버린 꼬리 끝을 히컵 다리 옆에 대 봄(말 없음) */
  P.lock = true; T.stay(); T.faceTo(T.x + (T.x - P.W.x), T.z + (T.z - P.W.z));
  T.pose = { tailCurl: 0.7, headUp: 0.2 }; yield* wait(2.6);
  T.pose = {}; P.lock = false;
  const Gb2 = G.person('gobber', { x: plaza.x + 3, z: plaza.z - 2, yaw: 0 }, { noCollide: true }), S = G.person('stoick', { x: plaza.x - 3, z: plaza.z - 2.5, yaw: 0 }, { noCollide: true });
  yield* until(() => Gb2.root && S.root, 5);
  Gb2.faceTo(P.W.x, P.W.z); S.faceTo(P.W.x, P.W.z); holdItem(S, 'book');
  Gb2.pose = { talk: 1 };
  yield* sayAll(G, [['gobber', '(막대 다리를 툭) 이제 너랑 나랑 다리 친구다.']]);
  Gb2.pose = {}; S.pose = { talk: 1 };
  yield* sayAll(G, [['stoick', '이 낙서가 버크를 바꿨구나.', ['book']]]);
  G.hud.banner('함께 사는 버크', 'heart', 3.5);
  yield* wait(1.2);
  return true;
}

/* ── 이음 + 손일: 고버가 만든 새 꼬리날개에 무늬 다시 그리기(6장 무늬는 10장에서 탐) ── */
function* repaint(G, C) {
  yield* ensureVillage(G, C);                                 // 늘 같은 마을 배치
  const P = G.player, A = G.place.anchors, b = A.forge_bench || A.forge_anvil || { x: 0, z: 0 };
  living(G); yield* legOn(G);
  const Gb = G.person('gobber', { x: b.x - 2.4, z: b.z - 1.2, yaw: 1 }, { noCollide: true });
  yield* until(() => Gb.root, 5); holdItem(Gb, 'hammer');
  G.useSpots = [{ x: b.x, y: 0, z: b.z }]; G.hud.goal('작업대로'); C.at = b;
  Gb.faceTo(P.W.x, P.W.z); Gb.pose = { talk: 1 };
  G.hud.say('gobber', '새 꼬리날개다. 이번 건 투슬리스 혼자서도 펼 수 있지!', ['finNew']);
  yield* until(() => P.fTap && G.near(b, 2.6));
  G.useSpots = []; P.lock = true; C.stage = 'paint'; G.hud.goal('새 꼬리날개에 무늬 그리기'); G.hud.howto('draw', 6);
  const r = yield* G.bench.paint(G.input, [{ c: '#2b2118', n: '숯' }, { c: '#a8402e', n: '열매' }, { c: '#d8b46a', n: '흙' }, { c: '#3f6a8a', n: '물풀' }], G.diff === 'easy' ? 5 : 7);
  G.finArt = r.canvas; G.bench.hide(); P.lock = false; C.stage = 'done';
  G.hud.banner('새 꼬리날개 · 내가 다시 그린 무늬', 'finNew', 3.5);
  yield* sayAll(G, [['gobber', '멋지다! …6장 무늬보다 낫군. 아니, 비슷한가?']]);
  return true;
}

/* ── 이음: 마을 위를 함께 날기(실패 없음 · 길잡이 테러가 도는 곳 다섯 → 광장) ── */
function* flyOver(G, C) {
  yield* ensureVillage(G, C);                                 // 늘 같은 마을 배치
  const P = G.player, pl = G.place, A = pl.anchors, plaza = A.plaza || { x: 0, z: 6.5 };
  living(G); yield* legOn(G);
  const T = tl(G, { x: plaza.x + 3, z: plaza.z - 3, yaw: Math.PI }); C.T = T; T.solid = true;
  yield* until(() => T.root);
  if (G.dist(T, plaza) > 12) T.place(plaza.x + 3, plaza.z - 3, Math.PI);
  T.mind.lock = 'idle'; T.stay(); T.faceTo(P.W.x, P.W.z);
  G.hud.goal('투슬리스에 올라타기'); G.useSpots = [{ x: T.x, y: 0, z: T.z }];
  yield* until(() => P.fTap && G.near(T, 3.4));
  G.useSpots = [];
  const gy = (x, z) => pl.ground ? pl.ground(x, z) : pl.height(x, z, 20);
  const RING = [-90, -30, 30, 90, 150, 210].map((d) => [5 + Math.cos(d * Math.PI / 180) * 55, -12 + Math.sin(d * Math.PI / 180) * 55, 20]);   // 마을 둘레 둥근 길(부드럽게 돎)
  const GATES = RING.concat([[0, 3, 16]]).map(([x, z, h]) => ({ x, z, y: Math.max(gy(x, z), 0) + h, r: 11 }));
  const world = { ground: (x, z) => gy(x, z), water: 0, pillars: [{ x: -46.4, z: 41, r: 3.5, top: 34 }], ceil: 230, bounds: { x: 10, z: -10, r: 175 } };
  const mod = yield* awaitP(import('../play/flight.js?v=16').catch(() => null));
  if (!mod || !mod.createFlight) return true;
  const F = mod.createFlight({ world, mode: G.diff, dragon: { root: T.root, rig: T.rig }, rider: { root: P.root, rig: P.rig }, rng: G.rng });
  F.setOpts({ assist: true, ceil: world.ceil }); F.setGates(GATES);
  F.place(T.x, gy(T.x, T.z) + 6, T.z, Math.atan2(GATES[0].x - T.x, GATES[0].z - T.z), 16);
  const cam = mod.createFlightCam(G.camera);
  /* 길잡이 = 그 자리를 도는 테러(친구) — 둥근 고리 대신 마을 것으로 */
  const marks = GATES.map((g, i) => { const d = G.dragon('terror', { x: g.x, z: g.z }, { noCollide: true, scale: 1.6 }); d.manual = true; d.g = g; d.ph = i; return d; });
  const ftm = yield* awaitP(import('../stages/flight_test.js?v=16').catch(() => null));
  const ui = ftm && ftm.makeUI ? ftm.makeUI(G.diff, false) : null;
  if (ui) { document.querySelectorAll('.fl-note').forEach((n) => { n.style.display = 'none'; }); ui.gates(0, GATES.length); }
  T.manual = true; P.cam = 'fly'; C.F = F;
  let t = 0, seen = 0;
  const NAMES = ['큰 회관 위', '숲 울타리 쪽', '선착장 길 위', '남쪽 벼랑 위', '망루 쪽', '양 우리 위', '광장'];
  G.camDraw = (a, dt) => {
    F.draw(a, dt); cam.update(dt, F); if (ui && ui.tick) ui.tick(F, t);
    for (const d of marks) { if (!d.root) continue; const k = t * 1.6 + d.ph, g = d.g; d.root.visible = marks.indexOf(d) >= F.state.gates; d.root.position.set(g.x + Math.cos(k) * 4.5, g.y + Math.sin(k * 2) * 0.6, g.z + Math.sin(k) * 4.5); d.root.rotation.set(0, k + Math.PI, -0.4, 'YXZ'); d.rig.fold = 0; d.rig.flapRate = 1; d.rig.update(dt); }
  };
  C.cleanup = () => { T.manual = false; P.cam = 'follow'; G.camDraw = null; ui && ui.dispose(); };
  G.hud.goal('마을 위를 함께 날기'); G.hud.howto(G.diff === 'easy' ? 'flyEasy' : 'fly', 8);
  yield* sayAll(G, [['hiccup', '가자, 투슬리스! 마을 한 바퀴!', ['finNew']]]);
  while (F.state.gates < GATES.length && t < 150) {
    const dt = yield; t += dt; F.step(dt, G.input);
    if (F.state.gates !== seen) { seen = F.state.gates; G.sfx.play('ok'); if (ui) ui.gates(seen, GATES.length); G.hud.banner(NAMES[seen - 1] + ' — 사람들이 손을 흔든다', 'heart', 2.2); }
  }
  /* 광장에 내려앉음 */
  T.manual = false; P.cam = 'follow'; G.camDraw = null; ui && ui.dispose(); ui && (C.cleanup = () => {});
  T.place(plaza.x + 3, plaza.z - 3); G.putPlayer({ x: plaza.x + 1, z: plaza.z, yaw: Math.PI });
  for (const d of marks) { d.manual = false; d.show(false); }
  G.hud.goal('');
  yield* sayAll(G, [['hiccup', '…버크가 이렇게 작았나? 아니, 이렇게 예뻤나.']]);
  return true;
}

/* ── 또 하기 ① 먹이 주기 — 생선 바구니 → 살금살금 다가가 · 나를 볼 때 내밀기(아직 사람이 낯선 드래곤 셋) ── */
function* feed(G, C) {
  yield* ensureVillage(G, C);                                 // 늘 같은 마을 배치
  const P = G.player, pl = G.place, A = pl.anchors, c = A.plaza || { x: 0, z: 6.5 };
  living(G); yield* legOn(G);
  const need = G.diff === 'easy' ? 2 : 3;
  const BK = { x: c.x + 6.5, z: c.z + 3.5 };
  const basket = prop(pl.group, 'basket', BK.x, pl.height(BK.x, BK.z, 23), BK.z);
  const D = [['gronckle', -10, -7], ['terror', 9, -9], ['zippleback', -13, 7.5]].map(([k, x, z]) => { const d = G.dragon(k, { x: c.x + x, z: c.z + z, yaw: 0 }, { mind: { fear: 0.45, trust: 0.15, hunger: 0.8, curious: 0.4 } }); d.solid = true; d.radius = k === 'terror' ? 0.5 : 1.5; d.fed = false; return d; });
  C.D = D; C.BK = BK;
  C.cleanup = () => { basket.removeFromParent(); G.useSpots = []; };
  yield* until(() => D.every((d) => d.root), 6);
  yield* sayAll(G, [['astrid', '새로 온 드래곤들이야. 아직 사람이 낯선가 봐.'], ['hiccup', '배고프겠지. 생선부터!', ['cod']]]);
  G.hud.goal('드래곤 먹이 주기 (0/' + need + ')');
  let fed = 0, has = false, eating = null;
  while (fed < need) {
    const dt = yield;
    G.useSpots = !has ? [{ x: BK.x, y: 0, z: BK.z }] : D.filter((d) => !d.fed && G.dist(P.W, d) < 4).map((d) => ({ x: d.x, y: d.y, z: d.z }));
    if (!has && P.fTap && G.near(BK, 2.4)) { has = true; holdItem(P, 'cod'); continue; }
    if (P.mash) for (const d of D) if (!d.fed && G.dist(P.W, d) < 12) { d.mind.event('loud'); }
    if (eating) {
      const d = eating; d.t = (d.t || 0) + dt;
      if (d.t < 1.2) { d.faceTo(P.W.x, P.W.z); d.pose = { jaw: 0.6, headUp: -0.3 }; }
      else if (d.t < 2.6) { holdItem(P, null); d.pose = d.kind === 'gronckle' ? { roll: 1 } : { lie: 0.6 }; }
      else { d.pose = {}; d.mind.lock = 'idle'; eating = null; }
      continue;
    }
    if (has && P.fTap) {
      const d = D.filter((x) => !x.fed).sort((a, b) => G.dist(P.W, a) - G.dist(P.W, b))[0];
      if (d && G.dist(P.W, d) < 3.6) {
        const toMe = Math.atan2(P.W.x - d.x, P.W.z - d.z), looks = Math.cos(ang(d.yaw, toMe)) > 0.7;
        if (looks && d.mind.fear < (G.diff === 'easy' ? 0.78 : 0.6)) { /* 쉬움 = 조금 겁내도 받아먹음 */ d.fed = true; fed++; has = false; d.mind.event('offer', 'cod'); d.mind.lock = 'watch'; d.stay(); eating = d; d.t = 0; G.sfx.play('ok'); G.hud.goal('드래곤 먹이 주기 (' + fed + '/' + need + ')'); G.book.note(d.kind, 'likes', '생선(살금살금 다가가 내밀면 받아먹음)'); }
        else G.hud.say('hiccup', looks ? '아직 겁내네… 더 천천히.' : '날 보고 있을 때 내밀자.', [], { secs: 1.4 });
      } else if (d) G.hud.say('hiccup', '여기선 너무 멀어.', [], { secs: 1 });
    }
    C.has = has; C.fed = fed;
  }
  holdItem(P, null);
  G.hud.banner('먹이 주기 — 셋 다 받아먹었다', 'cod', 3);
  return true;
}
function feedSense(G, C) {
  const P = G.player;
  return { has: !!C.has, fed: C.fed || 0, basket: C.BK || null, dragons: (C.D || []).filter((d) => !d.fed && d.root && G.vis(d.x, d.y + 1, d.z)).map((d) => { const toMe = Math.atan2(P.W.x - d.x, P.W.z - d.z); return { kind: d.kind, x: +d.x.toFixed(2), z: +d.z.toFixed(2), facingMe: Math.cos(ang(d.yaw, toMe)) > 0.7, pupil: +(d.rig ? d.rig.pupil : 0.5).toFixed(2), moving: d.speed > 0.4 }; }) };
}

/* ── 또 하기 ② 낚시 — 선착장 끝에서 · 찌가 쏙 가라앉는 박자에 F · 고기가 당기는 반대로 버팀(4장과 같은 손) · 투슬리스가 옆에서 기다림 ── */
function* fish(G, C) {
  yield* ensureVillage(G, C);                                 // 늘 같은 마을 배치
  const P = G.player, pl = G.place, A = pl.anchors, e = A.dock_end || { x: 99.4, z: 15, y: 3.1, yaw: Math.PI / 2 };
  living(G); yield* legOn(G);
  const T = tl(G, { x: e.x - 4, z: e.z, y: e.y, yaw: Math.PI / 2 }); C.T = T;
  yield* until(() => T.root, 5); T.mind.lock = 'idle'; T.stay(); T.place(e.x - 4, e.z, Math.PI / 2);   // 앞 차례에서 광장에 있었으면 선착장으로
  C.need = G.diff === 'easy' ? 2 : 3; C.got = 0; C.state = 'cast';
  const bob = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), new THREE.MeshToonMaterial({ color: 0xc8503a })); bob.visible = false; pl.group.add(bob);
  const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]); const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0x2b2118 })); line.frustumCulled = false; line.visible = false; pl.group.add(line);
  const puffs = makePuffs(pl.group, 80);
  C.cleanup = () => { bob.removeFromParent(); bob.geometry.dispose(); bob.material.dispose(); line.removeFromParent(); lineGeo.dispose(); line.material.dispose(); };
  yield* sayAll(G, [['hiccup', '오늘 저녁은 내가 잡는다. 투슬리스 몫까지!', ['salmon']]]);
  G.hud.goal('물고기 ' + C.need + '마리 잡기');
  const order = ['salmon', 'cod', 'eel', 'cod', 'salmon'];
  let t = 0, biteAt = 0, nib = [], pull = 0, pullDir = 0, fightT = 0, slack = 0, bx = 0, bz = 0, by = 0, lost = 0;
  while (C.got < C.need) {
    const dt = yield; t += dt; puffs.step(dt);
    const W = P.W, r = { x: W.x + Math.sin(W.yaw) * 0.6, y: W.y + 1.6, z: W.z + Math.cos(W.yaw) * 0.6 };
    if (C.state === 'cast') {
      if (P.fTap) { bx = W.x + Math.sin(W.yaw) * 6; bz = W.z + Math.cos(W.yaw) * 6; by = 0.05; bob.visible = line.visible = true; C.state = 'wait'; t = 0; biteAt = 2.2 + G.rng() * 3; nib = [biteAt - 1.4 - G.rng() * 0.3, biteAt - 0.7]; puffs.burst(bx, 0.1, bz, 8, 1, 1.5); }
    } else if (C.state === 'wait') {
      const nibble = nib.some((n) => t > n && t < n + 0.18), sink = t > biteAt && t < biteAt + (G.diff === 'easy' ? 0.8 : 0.5);
      by = sink ? -0.35 : nibble ? -0.08 : 0.04 + Math.sin(t * 3) * 0.02; C.bob = sink ? 'sink' : nibble ? 'nibble' : 'float';
      if (P.fTap) {
        if (sink) { C.state = 'fight'; fightT = 0; slack = 0; pullDir = G.rng() < 0.5 ? -1 : 1; pull = 0; C.fish = order[(C.got + lost) % order.length]; G.hud.say('hiccup', '걸렸다!', [], { secs: 1 }); }
        else { C.state = 'cast'; bob.visible = line.visible = false; lost++; G.hud.say('hiccup', '너무 일렀어… 다 도망갔다.', [], { secs: 1.6 }); }
      }
      if (t > biteAt + 1.4) { C.state = 'cast'; bob.visible = line.visible = false; G.hud.say('hiccup', '놓쳤다… 다시.', [], { secs: 1.4 }); }
    } else if (C.state === 'fight') {
      fightT += dt; pull += dt; if (pull > 1.4 + ((C.got * 7) % 5) * 0.15) { pull = 0; pullDir = -pullDir; }
      const hold = G.input.axis('left', 'right'), good = hold === -pullDir;
      slack = good ? Math.max(0, slack - dt * 1.5) : slack + dt * (hold === 0 ? 0.8 : 1.6);
      bx += pullDir * dt * 1.2 * (good ? 0.2 : 1); by = -0.1; if ((fightT * 10 | 0) % 3 === 0) puffs.burst(bx, 0.1, bz, 2, 0.8, 1.2); C.pull = pullDir;
      if (slack > (G.diff === 'easy' ? 2.2 : 1.3)) { C.state = 'cast'; bob.visible = line.visible = false; lost++; G.hud.say('hiccup', '줄이 끊어졌다…', [], { secs: 1.4 }); }
      else if (fightT > (G.diff === 'easy' ? 3 : 4.2)) {
        C.got++; C.state = 'cast'; bob.visible = line.visible = false; puffs.burst(bx, 0.3, bz, 18, 2, 3); G.sfx.play('splash');
        const f = C.fish; G.inv[f] = (G.inv[f] || 0) + 1;
        if (f === 'eel') { T.pose = { crouch: 0.8, tailCurl: 1 }; G.hud.say('hiccup', '뱀장어다! …알았어, 알았어, 놓아줄게.', ['eel'], { secs: 1.8 }); }
        else { T.pose = { jaw: 0.5, headUp: 0.3 }; G.hud.say('hiccup', f === 'salmon' ? '연어! 이건 투슬리스 몫.' : '대구 한 마리!', [f], { secs: 1.6 }); }
        C.poseT = 1.6; G.hud.goal('물고기 ' + C.need + '마리 잡기 (' + C.got + ')');
      }
    }
    if (C.poseT > 0) { C.poseT -= dt; if (C.poseT <= 0) T.pose = {}; }
    bob.position.set(bx, by, bz);
    const lp = lineGeo.attributes.position; lp.setXYZ(0, r.x, r.y, r.z); lp.setXYZ(1, bx, by + 0.1, bz); lp.needsUpdate = true;
  }
  yield* sayAll(G, [['hiccup', '이만하면 됐지? …아, 투슬리스 그건 내 몫이야!', ['cod']]]);
  return true;
}

/* ── 또 하기 ③ 드래곤 책 채우기 — 마을에서 사는 모습을 살금살금 지켜보기(가까이 9m · 멈춰서 · 2.5초) · 너무 다가가거나 뛰면 놀라 멈춤 ── */
const OBS = [
  { kind: 'zippleback', x: 37, z: -4, yaw: -1.6, cell: ['zippleback', 'other', '두 머리가 티격태격 — 가스 머리가 뿜고 불꽃 머리가 붙임(펑)'], name: '대장간 뒤' },
  { kind: 'nightmare', x: -17, z: -13, yaw: 1.2, cell: ['nightmare', 'sign', '몸에 스스로 불을 붙여 젖은 몸을 말림'], name: '서쪽 길' },
  { kind: 'terror', x: 6, z: 14, yaw: 0, cell: ['terror', 'likes', '빛 점을 쫓아다님(고양이처럼)'], name: '광장 남쪽' },
];
function* observe(G, C) {
  yield* ensureVillage(G, C);                                 // 늘 같은 마을 배치
  const P = G.player, pl = G.place;
  living(G); yield* legOn(G);
  const need = G.diff === 'easy' ? 2 : 3;
  const E = createElements({ group: pl.group, wind: { x: 0.6, z: 0.2, speed: 0.4 } }); E.link();
  const spot = new THREE.Mesh(new THREE.CircleGeometry(0.35, 16).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xfff4c0, transparent: true, opacity: 0.8, depthWrite: false })); spot.visible = false; pl.group.add(spot);
  const blaze = glowSprite(0xff7a2a, 7, 0.45); blaze.visible = false; pl.group.add(blaze);
  const D = OBS.map((o) => { const d = G.dragon(o.kind, { x: o.x, z: o.z, yaw: o.yaw }, { mind: { fear: 0.25, trust: 0.4, curious: 0.5 } }); d.solid = true; d.radius = o.kind === 'terror' ? 0.5 : 1.8; d.o = o; d.mind.lock = 'idle'; d.stay(); d.watchT = 0; d.done = false; d.scare = 0; return d; });
  C.D = D; C.drawHook = () => E.draw(G.camera.position);
  C.cleanup = () => { E.dispose(); spot.removeFromParent(); spot.geometry.dispose(); spot.material.dispose(); blaze.removeFromParent(); };
  yield* until(() => D.every((d) => d.root), 6);
  yield* sayAll(G, [['fishlegs', '드래곤 책을 다 채우려면 사는 모습을 직접 봐야 해!', ['book']], ['hiccup', '살금살금 다가가서, 가만히 지켜보자.']]);
  G.hud.goal('드래곤 책 채우기 (0/' + need + ')'); G.book.give && G.book.give();
  let got = 0, t = 0, gasT = 0;
  while (got < need) {
    const dt = yield; t += dt; E.step(dt);
    for (const d of D) {
      if (!d.root) continue;
      const k = d.o.kind, dd = G.dist(P.W, d);
      /* 하는 일(원인이 보이게) — 놀라면 4초 멈춤 */
      if (d.scare > 0) { d.scare -= dt; d.pose = { crouch: 0.6, tailCurl: 0.8 }; if (k === 'nightmare') blaze.visible = false; if (k === 'terror') spot.visible = false; }
      else if (k === 'zippleback') { gasT += dt; d.pose = { tilt: Math.sin(t * 2) * 0.5 }; if (gasT > 3.2) { gasT = 0; const hx = d.x + Math.sin(d.yaw) * 2.6, hz = d.z + Math.cos(d.yaw) * 2.6; E.gas(hx, d.y + 2.2, hz, 1.6, 2.5); setTimeout0(C, 1.3, () => E.spark(hx, d.y + 2.2, hz, 1.5)); } }
      else if (k === 'nightmare') { const on = (t % 6) > 3.2; d.pose = { blaze: on ? 1 : 0 }; blaze.visible = on; blaze.position.set(d.x, d.y + 2, d.z); }
      else if (k === 'terror') { const a = t * 1.3, lx = d.o.x + Math.cos(a) * 3.2, lz = d.o.z + Math.sin(a * 1.4) * 2.4; spot.visible = true; spot.position.set(lx, pl.height(lx, lz, 20) + 0.05, lz); d.goTo(lx, lz, 3.2, 0.4); }
      /* 지켜보기 — 9m 안 · 4m 밖 · 살금살금 · 멈춰서 · 그쪽을 봄 */
      if (d.done) continue;
      if ((dd < 4 || (dd < 9 && P.W.speed > 2.5) || (P.mash && dd < 12)) && d.scare <= 0) { d.scare = 4; d.watchT = 0; G.hud.say('hiccup', '앗, 놀랐나 봐… 조금 떨어져서 보자.', [], { secs: 1.4 }); continue; }
      const toD = Math.atan2(d.x - P.W.x, d.z - P.W.z), looking = Math.cos(ang(P.C.moveYaw(), toD)) > 0.8;
      if (dd < 9 && (P.W.low || G.diff === 'easy') && P.W.speed < 0.3 && looking && d.scare <= 0) d.watchT += dt; else d.watchT = Math.max(0, d.watchT - dt);   // 쉬움 = 멈춰 서서 보기만(살금살금 없이도)
      if (d.watchT > 2.5) { d.done = true; got++; G.book.note(d.o.cell[0], d.o.cell[1], d.o.cell[2]); G.sfx.play('ok'); G.hud.goal('드래곤 책 채우기 (' + got + '/' + need + ')'); }
    }
    stepTimers(C, dt);
    C.got = got;
  }
  G.hud.banner('드래곤 책 — 연필 글이 X 도장을 모두 덮었다', 'book', 4);
  yield* wait(1.2);
  return true;
}
function setTimeout0(C, sec, fn) { (C.timers = C.timers || []).push([sec, fn]); }
function stepTimers(C, dt) { const L = C.timers; if (!L) return; for (let i = L.length - 1; i >= 0; i--) { L[i][0] -= dt; if (L[i][0] <= 0) { const f = L[i][1]; L.splice(i, 1); f(); } } }
function obsSense(G, C) {
  return { got: C.got || 0, targets: (C.D || []).filter((d) => !d.done && d.root && G.vis(d.x, d.y + 1, d.z)).map((d) => ({ kind: d.o.kind, x: +d.x.toFixed(2), z: +d.z.toFixed(2), scared: d.scare > 0, watch: +d.watchT.toFixed(2) })) };
}

/* ── 끝(이음) — 광장에 다 모임 → G.ending(엔딩·크레딧은 메인) ── */
function* finale(G, C) {
  yield* ensureVillage(G, C);                                 // 늘 같은 마을 배치
  const P = G.player, A = G.place.anchors, c = A.plaza || { x: 0, z: 6.5 };
  living(G); yield* legOn(G);
  const T = tl(G, { x: c.x + 2.5, z: c.z - 1, yaw: Math.PI });
  const who = ['stoick', 'gobber', 'astrid', 'fishlegs', 'snotlout', 'ruffnut', 'tuffnut'];
  const ppl = who.map((w, i) => { const a = Math.PI + (i - 3) * 0.32, r = 6 + (i % 2) * 1.2; return G.person(w, { x: c.x + Math.sin(a) * r, z: c.z + Math.cos(a) * r, yaw: a + Math.PI }, { noCollide: true }); });
  yield* until(() => T.root && ppl.every((p) => p.root), 6);
  T.mind.lock = 'idle'; T.stay(); T.place(c.x + 2.5, c.z - 1, Math.PI); T.faceTo(P.W.x, P.W.z);
  ppl.forEach((p, i) => { p.faceTo(P.W.x, P.W.z); p.pose = i === 0 ? { talk: 1 } : i === 2 ? { point: 0.6 } : { cheer: 1 }; });   // 스토이크 손짓 · 아스트리드 가리킴 · 나머지 두 팔 번쩍
  P.lock = true;
  yield* sayAll(G, [['hiccup', '여기는 버크. 눈이 많고, 바람이 세고…'], ['hiccup', '이제는 드래곤이 함께 사는 마을.', ['heart']]]);
  P.lock = false;
  G.records.end = true;
  if (G.ending) { const r = G.ending(); if (r && r.then) yield* awaitP(r); }
  else { G.hud.banner('끝 — 함께 사는 버크', 'heart', 5); yield* wait(4); }
  return true;
}

export const chapter = {
  id: 11, title: '종장 · 함께 사는 버크', sub: '깨어남 → 대장간 → 마을 하늘 → 또 하기',
  steps: [
    { id: '11-0', place: 'village', time: 'clear', at: 'house_hiccup', run: wake, sense: (G, C) => ({ target: C.target || null, tl: tlSense(G, C.T) }) },
    { id: '11-1', place: 'village', time: 'clear', at: 'forge_front', run: repaint, sense: (G, C) => ({ stage: C.stage || '', bench: G.bench.sense(), at: C.at || null }) },
    { id: '11-2', place: 'village', time: 'clear', at: 'plaza', run: flyOver, sense: (G, C) => Object.assign(C.F ? flySense(C.F) : {}, { tl: tlSense(G, C.T) }) },
    { id: '11-3', verb: 'approach', place: 'village', time: 'clear', at: { x: 0, z: 9, yaw: Math.PI * 0.75 }, goal: '드래곤 먹이 주기', limit: 200,
      hints: { 1: '뛰어가면 겁내. 살금살금(Shift).', 2: '바구니에서 생선(F) · 날 볼 때 가까이서 F.' }, run: feed, sense: feedSense },
    { id: '11-4', verb: 'rhythm', howtoVerb: 'fish', place: 'village', time: 'clear', at: 'dock_end', goal: '물고기 잡기', limit: 220,
      hints: { 1: '찌가 쏙 들어갈 때 당겨야 해.', 2: '고기가 당기는 반대쪽 키를 누르자.' }, run: fish, sense: (G, C) => ({ state: C.state, bob: C.bob || '', pull: C.pull || 0, got: C.got || 0, need: C.need || 0 }) },
    { id: '11-5', verb: 'approach', howtoVerb: 'hide', place: 'village', time: 'clear', at: { x: 10, z: -16, yaw: Math.PI / 2 }, goal: '드래곤 책 채우기', limit: 240,
      hints: { 1: '가까이 가면 놀라. 조금 떨어져서 살금살금.', 2: '멈춰 서서 그쪽을 바라보고 기다리자.' }, run: observe, sense: obsSense },
    { id: '11-6', place: 'village', time: 'clear', at: 'plaza', run: finale, sense: () => ({}) },
  ],
};
