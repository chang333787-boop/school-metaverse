// 종장 · 함께 사는 버크(design §2 종장 · reference #28 · 빼는 차례 1번에서 뺐던 다섯을 팀 J가 '다음 날'로 되살림)
// 이음: 깨어남(고버 한 줄 · 첫걸음 비틀 → 투슬리스가 머리로 받침 · 꼬리 끝을 히컵 다리 옆에(말 없음) · 고버 "다리 친구" · 스토이크 "이 낙서가 버크를 바꿨구나")
// → 이음 + 손일: 새 꼬리날개에 무늬 다시 그리기 → 이음: 마을 위를 함께 날기(실패 없음) → 또 하기 ① 먹이 주기[다가가] ② 낚시[박자] ③ 드래곤 책 채우기[다가가]
// → 다음 날(그날 날씨 하나 · fx11.js) ④ 이웃 둘[보여 주기] ⑤ 다친 야생 드래곤[진정·치유] ⑥ 우박 — 날개 밑[숨기] ⑦ 스콜드런[물 붓기] ⑧ 배 타기[노 박자 → 고기잡이] → 끝(G.ending — 엔딩·크레딧은 메인)
// 다리는 고버 한 줄 + 몸짓으로만(design §8) · 대사는 모두 우리 말로 새로 · 실제 학생 이름 X · 마을에 드래곤이 함께 삶(지붕 위 테러 · 광장 그롱클 · 대장간 지플백)
import * as THREE from 'three';
import { wait, until, sayAll } from './runner.js?v=17';
import { holdItem, makePuffs, dropItem } from './fx.js?v=17';
import { loadModel } from '../look/models.js?v=17';
import { createHumanRig } from '../look/human_rig.js?v=17';
import { glowSprite } from '../look/kit.js?v=17';
import { createElements } from '../play/elements.js?v=17';
import { awaitP, prop, ensureVillage } from './fx1.js?v=17';
import { tlSense } from './ch4.js?v=17';
import { flySense, boatSense, boatCam } from './flysense.js?v=17';
import { SPECIES } from '../play/mind.js?v=17';
import { WX, wxDay, weather, hailBits, dim, paintScauldron } from './fx11.js?v=17';

const ang = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));

/* 히컵 = 의족 모델로(종장 내내) — 손에 든 것은 새 손에 다시 붙임 */
function* legOn(G) {
  const P = G.player; if (P.leg) return;
  const m = yield* awaitP(loadModel('assets/models/hiccup_leg.glb?v=17').catch(() => null));
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
  const f = G.place.anchors.forge_front || { x: 24, z: 4 };   // 눈 오는 날(때 sleet) = 대장간 불가에 모임(design §3-4)
  const L = G.place.time === 'sleet' ? [['terror', { x: f.x + 1.5, z: f.z + 3, yaw: 1 }, 1.2], ['gronckle', { x: f.x - 4, z: f.z + 4.5, yaw: 1.2 }, 1.5], ['nadder', { x: f.x + 5, z: f.z + 6, yaw: 2.6 }, 1.8]]
    : [['terror', { x: -22, z: 30, yaw: 1 }, 3], ['gronckle', { x: -34, z: 24, yaw: 1.2 }, 4], ['nadder', { x: 7, z: -40, yaw: 2.6 }, 5]];
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
  const mod = yield* awaitP(import('../play/flight.js?v=17').catch(() => null));
  if (!mod || !mod.createFlight) return true;
  const F = mod.createFlight({ world, mode: G.diff, dragon: { root: T.root, rig: T.rig }, rider: { root: P.root, rig: P.rig }, rng: G.rng });
  F.setOpts({ assist: true, ceil: world.ceil }); F.setGates(GATES);
  F.place(T.x, gy(T.x, T.z) + 6, T.z, Math.atan2(GATES[0].x - T.x, GATES[0].z - T.z), 16);
  const cam = mod.createFlightCam(G.camera);
  /* 길잡이 = 그 자리를 도는 테러(친구) — 둥근 고리 대신 마을 것으로 */
  const marks = GATES.map((g, i) => { const d = G.dragon('terror', { x: g.x, z: g.z }, { noCollide: true, scale: 1.6 }); d.manual = true; d.g = g; d.ph = i; return d; });
  const ftm = yield* awaitP(import('../stages/flight_test.js?v=17').catch(() => null));
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

/* ════════ 또 하기 넓히기(팀 J · design §2 종장 · §14 빼는 차례 1번에서 뺐던 다섯) — '다음 날' · 그날 날씨 하나(맑음·비·눈·우박) ════════
   ④ 이웃 둘(보여 주기) ⑤ 다친 야생 드래곤(먼저 쏘지 않음) ⑥ 우박 — 날개 밑 ⑦ 스콜드런(책에서 나온 드래곤) ⑧ 배 타기(노 박자 → 돌기둥 고기잡이 한 번) */
const WXK = wxDay(), WXI = WX[WXK], WXT = WXI.time;
/* 자리 고치기 — 벽·바위 밖으로(걷기 충돌과 같은 밀어내기) */
function clearAt(G, x, z, r = 1.2) { const p = { x, z }; if (G.collide) for (let k = 0; k < 3; k++) G.collide.push(p, r); return p; }
function* dayStart(G, C) {
  if (G.place && G.place.name === 'village') { yield* ensureVillage(G, C); living(G); }
  yield* legOn(G);
  C.wx = weather(G, WXK);
  if (G._wxDay !== WXK) { G._wxDay = WXK; G.hud.banner('다음 날 · 오늘 버크 날씨 — ' + WXI.name, WXI.icon, 3.5); yield* sayAll(G, [['hiccup', WXI.line]]); }
}
/* 이름 없는 마을 사람 말(얼굴 = 마을 사람 · 이름표 = 역할) */
const nsay = (G, name, text, icons = []) => G.hud.say('villager', text, icons, { name });

/* ── 또 하기 ④ 이웃 둘 — '같이 사는 게 서툰' 걱정 → 말 고르기 X · 내가 드래곤을 옮기고 진정시키는 걸 보여 줌 ──
   ⓐ 지붕에 앉은 그롱클(지붕이 부서짐) → 풀(F) → 지붕 밑에서 F 꾹(내밀기) → 천천히 이끌어 '드래곤 쉼터'(건초·물통)로 → 이웃이 제 집 옆에도 건초를 깖
   ⓑ 양 우리 곁을 서성이는 내더(양이 놀라 뜀) → 살금살금 다가가 턱 밑 긁기(F) → 털썩 · 양이 가라앉음 → 이웃이 따라 쓰다듬음 */
/* 자리(마을 씨앗 1656844137 배치 · 11-01 광선으로 잰 값): 양 우리 동쪽 집(가운데 -27.9,-43.8 · 땅 35.5)의 서쪽 지붕 비탈 · 그 집 남서쪽 마당 · 우리 문(+z) 쪽 울타리 바깥 3m */
const NB = { roof: { x: -29.8, z: -45.2, y: 40.3 }, nip: { x: -30.5, z: -53.5 }, rest: { x: -23.5, z: -56.5 }, lure: { x: -33.5, z: -47.5 }, nA: { x: -33.2, z: -49.6 }, pace: [[-43.5, -42.3], [-37.5, -44.5]] };
function* neighbors(G, C) {
  yield* dayStart(G, C);
  const P = G.player, pl = G.place, A = pl.anchors, easy = G.diff === 'easy';
  const pen = A.sheep_pen || { x: -44, z: -44 }, PC = { x: -44, z: -50 };
  const gy = (x, z) => (pl.ground ? pl.ground(x, z) : pl.height(x, z, 20));
  const R = NB.rest, NIP = NB.nip, RF = NB.roof, LU = NB.lure;
  const hay = prop(pl.group, 'hay', R.x, gy(R.x, R.z), R.z, 0, 1.4), tr = prop(pl.group, 'trough', R.x + 2.2, gy(R.x + 2.2, R.z + 1), R.z + 1, 0.4);
  const nips = [0, 1, 2, 3, 4].map((i) => { const o = dropItem(pl.group, 'nip', NIP.x + Math.cos(i * 1.3) * 0.45, gy(NIP.x, NIP.z), NIP.z + Math.sin(i * 1.3) * 0.45, i); o.scale.setScalar(2.4); return o; });
  const dust = makePuffs(pl.group, 60, 0x9a8466);
  let hay2 = null;
  C.cleanup = () => { hay.removeFromParent(); tr.removeFromParent(); nips.forEach((o) => o.removeFromParent()); hay2 && hay2.removeFromParent(); G.useSpots = []; };
  /* 이웃 둘 · 그롱클(지붕) · 내더(우리 곁) · 양 넷 */
  const nA = G.person('villager1', { x: NB.nA.x, z: NB.nA.z, yaw: Math.atan2(RF.x - NB.nA.x, RF.z - NB.nA.z) }, { noCollide: true });
  const nB = G.person('villager2', { x: pen.x - 0.9, z: pen.z - 2.6, yaw: 0.35 }, { noCollide: true });   // 우리 문 안쪽
  const gr = G.dragon('gronckle', { x: RF.x, z: RF.z, yaw: Math.atan2(LU.x - RF.x, LU.z - RF.z) }, { noCollide: true, mind: { fear: 0.15, trust: 0.45, hunger: 0.7, curious: 0.5 } });
  const nd = G.dragon('nadder', { x: NB.pace[0][0], z: NB.pace[0][1], yaw: Math.PI / 2 }, { mind: { fear: 0.35, trust: 0.2, curious: 0.4 } });
  nd.solid = true; nd.radius = 1.4;
  const sheep = [0, 1, 2, 3].map((i) => { const a = i * 1.6, x = PC.x + Math.cos(a) * 2.4, z = PC.z + Math.sin(a) * 2; const s = G.person('sheep', { x, z, yaw: a }, { noCollide: true }); s.home = { x, z }; return s; });
  yield* until(() => nA.root && nB.root && gr.root && nd.root && sheep.every((s) => s.root), 6);
  gr.mind.lock = 'idle'; gr.stay(); nd.mind.lock = 'idle';
  const roofY = RF.y || (gy(RF.x, RF.z) + 4.6); gr.rigY = roofY - gr.y;
  nA.faceTo(RF.x, RF.z); nA.pose = { point: 0.7 }; nB.faceTo(nd.x, nd.z); nB.pose = { cower: 0.6 };
  C.gr = gr; C.nd = nd; C.st = { A: 'roof', B: 'pace' };
  yield* sayAll(G, [['villager', '또 내 지붕이야! 저러다 지붕이 다 내려앉겠어.', ['x'], { name: '지붕 집 이웃' }], ['villager', '저 드래곤만 오면 양들이 난리가 나요. 같이 사는 건 아직 어렵네.', ['sheep'], { name: '양 치는 이웃' }],
    ['hiccup', '말보다 보여 드리는 게 빠르겠다.']]);
  nA.pose = { point: 0.7 };
  const need = 2; let done = 0, t = 0, dustT = 0, paceI = 1, lostSaid = false;
  G.hud.goal('이웃 걱정 풀기 (0/' + need + ')');
  while (done < need) {
    const dt = yield; t += dt; dust.step(dt);
    const sA = C.st.A, sB = C.st.B, has = P.item === 'nip';
    G.useSpots = [];
    if (sA !== 'done' && !has) G.useSpots.push({ x: NIP.x, y: 0, z: NIP.z });
    /* 풀 줍기 */
    if (sA !== 'done' && !has && P.fTap && G.near(NIP, 2.4)) { holdItem(P, 'nip'); G.hud.say('hiccup', '드래곤 풀이다. 그롱클이 좋아하지.', ['nip'], { secs: 1.4 }); continue; }
    if (P.mash) { gr.mind.event('loud'); nd.mind.event('loud'); }
    /* ⓐ 그롱클 */
    if (sA === 'roof') {
      gr.rigY = roofY - gr.y + Math.sin(t * 5) * 0.03; gr.pose = { sniff: has && G.near(RF, 10) ? 1 : 0 };
      dustT -= dt; if (dustT <= 0) { dustT = 1.6; dust.burst(RF.x, roofY - 0.2, RF.z, 6, 1.2, 1.2); G.sfx.play('thud'); }
      if (has && P.reach && G.dist(P.W, RF) < (easy ? 10 : 8.5)) { C.st.A = 'hop'; C.hop = 0; G.hud.say('hiccup', '그래, 이리 와. 풀 있어.', ['nip'], { secs: 1.4 }); }
    } else if (sA === 'hop') {
      C.hop += dt; const k = Math.min(1, C.hop / 0.9);
      gr.rigY = (roofY - gr.y) * (1 - k) + Math.sin(k * Math.PI) * 0.8; gr.pose = { flapRate: 1 - k * 0.6 };
      if (C.hop < 0.05) gr.goTo(LU.x + (RF.x - LU.x) * 0.15, LU.z + (RF.z - LU.z) * 0.15, 3, 0.4);
      if (k >= 1) { gr.rigY = 0; gr.pose = {}; C.st.A = 'follow'; G.sfx.play('thud'); }
    } else if (sA === 'follow' || sA === 'lost') {
      const d = G.dist(gr, P.W), lose = easy ? 12 : 9;
      if (sA === 'follow') {
        if (!has || d > lose || P.mash) { C.st.A = 'lost'; gr.stay(); gr.pose = { lie: 0.4 }; if (!lostSaid) { lostSaid = true; G.hud.say('hiccup', '앗, 그롱클이 멈췄다… 너무 빨리 왔나 봐.', [], { secs: 1.8 }); } }
        else if (d > 2.3) { gr.goTo(P.W.x, P.W.z, easy ? 2.6 : 2.0, 1.8); gr.pose = { sniff: 1 }; } else { gr.stay(); gr.faceTo(P.W.x, P.W.z); gr.pose = { sniff: 1 }; }
        if (G.dist(gr, R) < 3.4) {                                  // 쉼터에 닿음 — 건초에 털썩 · 풀을 줌
          C.st.A = 'done'; done++; holdItem(P, null); gr.stay(); gr.faceTo(R.x, R.z); gr.pose = { roll: 1 }; G.sfx.play('ok');
          G.hud.goal('이웃 걱정 풀기 (' + done + '/' + need + ')');
          nA.walkTo(R.x - 2.5, R.z - 2.2, 1.8); nA.pose = {};
          nsay(G, '지붕 집 이웃', '지붕 대신 저기 앉으면 되는구나! 우리 집 옆에도 건초를 깔아 둬야겠어.', ['heart']);
          hay2 = prop(pl.group, 'hay', LU.x + 1, gy(LU.x + 1, LU.z - 2.5), LU.z - 2.5, 0.6, 1.1);   // 보이는 변화 — 이웃이 깐 건초
        }
      } else if (has && P.reach && d < 4.5) { C.st.A = 'follow'; gr.pose = {}; }
    } else if (sA === 'done') { if (nA.arrived()) { nA.faceTo(gr.x, gr.z); nA.pose = { cheer: 0.6 }; } }
    /* ⓑ 내더 */
    const dd = G.dist(P.W, nd), M = nd.mind;
    if (sB !== 'calm') {
      const sneak = P.W.low || easy, jitter = M.fear > 0.7 || (dd < 6 && !sneak && P.W.speed > 2.2);
      if (jitter) { C.st.B = 'jit'; nd.pose = { spines: 1, crouch: 0.5 }; const ax = nd.x - P.W.x, az = nd.z - P.W.z, L = Math.hypot(ax, az) || 1; if (dd < 7) nd.goTo(nd.x + ax / L * 3, nd.z + az / L * 3, 2.4, 0.5); }
      else if (dd < 8 && sneak) { C.st.B = 'watch'; nd.stay(); nd.faceTo(P.W.x, P.W.z); nd.pose = { tilt: Math.sin(t) * 0.4 }; }
      else { C.st.B = 'pace'; nd.pose = {}; const p = NB.pace[paceI]; if (Math.hypot(nd.x - p[0], nd.z - p[1]) < 1) paceI = 1 - paceI; nd.goTo(p[0], p[1], 1.6, 0.6); }
      /* 양 — 내더가 서성이거나 가시를 세우면 우리 안에서 뜀 */
      if ((t * 10 | 0) % 6 === 0) for (const s of sheep) if (s.arrived()) { const a = (t * 2.3 + sheep.indexOf(s) * 1.7) % 6.28; s.walkTo(PC.x + Math.cos(a) * 3.2, PC.z + Math.sin(a) * 2.6, C.st.B === 'jit' ? 3.6 : 2.6); s.pose = {}; }
      if (P.fTap && dd < (easy ? 3.3 : 2.7)) {
        if (M.fear < (easy ? 0.72 : 0.62) && C.st.B !== 'jit') {
          C.st.B = 'calm'; done++; nd.stay(); nd.faceTo(P.W.x, P.W.z); nd.pose = { lie: 1, headUp: -0.2 }; M.event('chin'); G.sfx.play('purr'); G.sfx.play('ok');
          G.hud.goal('이웃 걱정 풀기 (' + done + '/' + need + ')'); G.book.note('nadder', 'likes', '턱 밑 긁기(털썩 누움)', false);
          for (const s of sheep) { s.walkTo(s.home.x, s.home.z, 0.8); s.pose = { low: 1 }; }
          nB.walkTo(nd.x + 1.8, nd.z - 1.4, 1.2); nB.pose = {};
          nsay(G, '양 치는 이웃', '턱 밑을 긁으면 저렇게 순해지네! …다음엔 내가 해 봐야지.', ['hand']);
        } else { M.fear = Math.min(1, M.fear + 0.12); G.hud.say('hiccup', '아직 겁내… 더 천천히(살금살금).', [], { secs: 1.4 }); }
      }
    } else if (nB.arrived()) { nB.faceTo(nd.x, nd.z); nB.pose = { pet: 1 }; }
    C.has = has;
  }
  G.useSpots = [];
  yield* sayAll(G, [['hiccup', '말로 하는 것보다 보여 주는 게 빠르네.', ['heart']]]);
  G.hud.banner('이웃 둘 — 같이 사는 법을 보여 줬다', 'heart', 3);
  yield* wait(1);
  return true;
}
function nbSense(G, C) {
  const vis = (d) => d && d.root && G.vis(d.x, d.y + 1 + (d.rigY || 0), d.z);
  return { st: C.st || {}, has: !!C.has, nip: NB.nip, rest: NB.rest, lure: NB.lure,
    gr: vis(C.gr) ? { x: +C.gr.x.toFixed(2), z: +C.gr.z.toFixed(2), roof: (C.gr.rigY || 0) > 1 } : null,
    nd: vis(C.nd) ? { x: +C.nd.x.toFixed(2), z: +C.nd.z.toFixed(2), spines: (C.nd.pose && C.nd.pose.spines) ? 1 : 0, moving: C.nd.speed > 0.4 } : null };
}

/* ── 또 하기 ⑤ 다친 야생 드래곤 — 먼저 쏘지 않음(design §6-5) · 다쳐서 겁나 위협 자세(예고)만 · 내가 무기(도끼)를 들면 그때만 예고 뒤 쏨
   진정 = 살금살금 → 3.5m 안에서 고개 돌려 손(F 꾹) · 치유 = 다친 곳을 보고 맞는 것(날개 찢김 = 천 · 발 긁힘 = 약초 · 몸이 뜨거움 = 물) → 친구 */
const WOUND = { wing: { item: 'cloth', name: '날개가 찢어졌다', fix: '천으로 날개를 감쌌다' }, leg: { item: 'nip', name: '발을 다쳤다', fix: '약초를 발에 붙였다' }, hot: { item: 'bucket', name: '몸이 너무 뜨겁다', fix: '물을 부어 식혔다' } };
const ITEM_NAME = { cloth: '천', nip: '약초', bucket: '물' };
function* wild(G, C) {
  yield* dayStart(G, C);
  const P = G.player, pl = G.place, A = pl.anchors, easy = G.diff === 'easy';
  const gy = (x, z) => (pl.ground ? pl.ground(x, z) : pl.height(x, z, 20));
  const fg = A.forest_gate || { x: 40, z: -60, yaw: 0 }, fw = { x: Math.sin(fg.yaw), z: Math.cos(fg.yaw) }, rt = { x: fw.z, z: -fw.x };
  const DP = clearAt(G, fg.x - fw.x * 4 + rt.x * 9, fg.z - fw.z * 4 + rt.z * 9, 2.2);           // 문 안쪽 옆 · 다친 드래곤 자리
  const CART = clearAt(G, fg.x - fw.x * 12 - rt.x * 3, fg.z - fw.z * 12 - rt.z * 3, 1.6);      // 약 수레(천·약초·물)
  const AXE = clearAt(G, fg.x - fw.x * 10 + rt.x * 5, fg.z - fw.z * 10 + rt.z * 5, 0.6);       // 누가 두고 간 도끼(길가)
  const keys = Object.keys(WOUND), wk = keys[Math.floor(G.rng() * keys.length) % keys.length], W = WOUND[wk];
  const cart = prop(pl.group, 'cart', CART.x - rt.x * 2.2, gy(CART.x, CART.z), CART.z - rt.z * 2.2, fg.yaw);
  const SL = ['cloth', 'nip', 'bucket'].map((n, i) => { const x = CART.x + fw.x * (i - 1) * 1.9, z = CART.z + fw.z * (i - 1) * 1.9, o = dropItem(pl.group, n, x, gy(x, z), z, i); o.scale.setScalar(2); return { n, x, z, o }; });
  let axeObj = dropItem(pl.group, 'axe', AXE.x, gy(AXE.x, AXE.z), AXE.z, 0.7);
  const D = G.dragon('nightmare', { x: DP.x, z: DP.z, yaw: Math.atan2(-fw.x, -fw.z) }, { mind: { fear: 0.6, trust: 0.05, curious: 0.3, anger: 0.2 } });
  D.solid = true; D.radius = 1.8; C.D = D; C.wk = wk; C.CART = CART; C.SL = SL; C.AXE = AXE;
  { const s = clearAt(G, fg.x - fw.x * 16 + rt.x * 2, fg.z - fw.z * 16 + rt.z * 2, 0.6); G.putPlayer({ x: s.x, z: s.z, yaw: Math.atan2(DP.x - s.x, DP.z - s.z) }); }
  /* 다친 곳 표시(보임) — 날개 찢김 = 붉은 줄 · 발 = 붉은 긁힘 · 뜨거움 = 김 */
  const mk = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xb8402e, fog: true }));
  const steam = makePuffs(pl.group, 50, 0xe8eef0), fire = makePuffs(pl.group, 70, 0xf08a3a);
  C.cleanup = () => { cart.removeFromParent(); SL.forEach((s) => s.o.removeFromParent()); axeObj && axeObj.removeFromParent(); mk.removeFromParent(); mk.geometry.dispose(); mk.material.dispose(); G.useSpots = []; };
  yield* until(() => D.root, 6);
  D.mind.lock = 'watch'; D.stay();
  if (wk === 'wing') { mk.scale.set(0.12, 0.08, 1.6); mk.position.set(1.3, 2.4, -0.2); mk.rotation.set(0, 0.3, 0.5); }
  else if (wk === 'leg') { mk.scale.set(0.35, 0.1, 0.35); mk.position.set(0.7, 0.35, 1.3); }
  else mk.visible = false;
  D.root.add(mk); mk.scale.divideScalar(D.root.scale.x || 1);
  yield* sayAll(G, [['astrid', '숲에서 나온 드래곤이야. 다쳤나 봐 — 사람을 무서워해.'], ['hiccup', '먼저 쏘지는 않아. 겁나서 저러는 거야. 도끼 같은 건 들지 말자.', ['axe']]]);
  G.hud.goal('다친 드래곤 진정시키기'); G.hud.howto('heal11', 8);
  let stage = 'calm', calm = 0, warn = 0, shotT = 0, healT = 0, t = 0;
  C.stage = stage;
  while (true) {
    const dt = yield; t += dt; steam.step(dt); fire.step(dt);
    const M = D.mind, d = G.dist(P.W, D), armed = P.item === 'axe';
    if (wk === 'hot' && stage !== 'friend' && (t * 10 | 0) % 4 === 0) steam.burst(D.x, D.y + 2.2, D.z, 2, 0.6, 1.4);
    if (P.mash && d < 14) M.event('loud');
    G.useSpots = [];
    /* 도끼 줍기·내려놓기 */
    if (!armed && axeObj && P.fTap && G.near(AXE, 2.2) && !P.item) { holdItem(P, 'axe'); axeObj.removeFromParent(); axeObj = null; continue; }
    if (armed && P.fTap) { holdItem(P, null); AXE.x = P.W.x; AXE.z = P.W.z; axeObj = dropItem(pl.group, 'axe', AXE.x, gy(AXE.x, AXE.z), AXE.z, P.W.yaw); M.event('drop'); if (warn > 0) { warn = 0; D.pose = {}; G.hud.say('hiccup', '봐, 도끼 내려놨어.', [], { secs: 1.4 }); } continue; }
    /* 쏘기는 무기를 들었을 때만 — 예고(몸에 불 · 웅크림) → 그래도 들고 있으면 불길 · 밀려남(넘어짐 X · 도끼를 놓침) */
    if (shotT > 0) { shotT -= dt; continue; }
    if (armed && M.sees && d < 20 && warn <= 0) { warn = easy ? 3 : 2.5; G.hud.say('hiccup', '도끼를 보고 화가 났어…!', ['axe'], { secs: 1.4 }); }
    if (warn > 0) {
      D.faceTo(P.W.x, P.W.z); D.pose = { blaze: 1, crouch: 0.8, teeth: 1 };
      warn -= dt;
      if (warn <= 0) {
        if (P.item === 'axe') {
          const ux = (P.W.x - D.x) / (d || 1), uz = (P.W.z - D.z) / (d || 1);
          for (let k = 0; k < 6; k++) fire.burst(D.x + ux * k * d / 6, D.y + 1.6 - k * 0.15, D.z + uz * k * d / 6, 5, 0.8, 1.5);
          G.sfx.play('fire'); holdItem(P, null); AXE.x = P.W.x; AXE.z = P.W.z; axeObj = dropItem(pl.group, 'axe', AXE.x, gy(AXE.x, AXE.z), AXE.z, P.W.yaw);
          const p = clearAt(G, P.W.x + ux * 3, P.W.z + uz * 3, 0.4); P.W.place(p.x, p.z, P.W.yaw); P.pose = { stumble: 1 }; shotT = 1.2; calm = 0; M.fear = Math.min(1, M.fear + 0.3);
          G.hud.say('hiccup', '앗 뜨거…! 도끼를 들어서 그랬구나.', [], { secs: 2 });
        }
        D.pose = {};
      }
      continue;
    }
    if (shotT <= 0 && P.pose && P.pose.stumble) P.pose = null;
    if (stage === 'calm') {
      /* 위협 자세만(예고 · 쏘지 않음) — 가까이·빠르게 오면 겁이 커져 몸을 웅크리고 이빨 */
      const scared = M.fear > 0.55 && d < 9;
      if (d < 18) D.faceTo(P.W.x, P.W.z);                     // 다가오는 사람을 지켜봄(눈을 떼지 않음)
      D.pose = scared ? { crouch: 0.7, teeth: 0.8, tailCurl: 0.6 } : wk === 'wing' ? { tailCurl: 0.3 } : {};
      if (P.reach && P.W.speed < 0.3 && d < 3.8 && M.fear < (easy ? 0.72 : 0.56)) calm += dt; else calm = Math.max(0, calm - dt * 0.5);
      if (P.reach && d < 3.8 && M.fear >= (easy ? 0.72 : 0.56) && (t * 2 | 0) % 6 === 0) G.hud.say('hiccup', '아직 무서워해… 살금살금(Shift) 낮춰서.', [], { secs: 1.2 });
      if (calm > (easy ? 2 : 2.6)) {
        stage = 'heal'; M.trust = 0.85; M.fear = 0.2; D.pose = { headUp: -0.3 }; G.sfx.play('purr');
        G.hud.banner('마음을 놓았다 — 어디를 다쳤는지 보자', 'eye', 3); G.hud.goal('다친 곳 치료하기');
        yield* sayAll(G, [['hiccup', W.name + '… 수레에서 맞는 걸 가져오자.']]);
      }
    } else if (stage === 'heal') {
      D.pose = wk === 'wing' ? { tailCurl: 0.2 } : {}; D.faceTo(P.W.x, P.W.z);
      mk.visible = wk !== 'hot' && ((t * 2.5 | 0) % 2 === 0);
      for (const s of SL) { if (P.item !== s.n) G.useSpots.push({ x: s.x, y: 0, z: s.z }); }
      if (P.fTap) {
        const s = SL.filter((q) => G.near(q, 1.3) && P.item !== q.n).sort((a, b) => G.dist(P.W, a) - G.dist(P.W, b))[0];
        if (s) { holdItem(P, s.n); G.hud.say('hiccup', ITEM_NAME[s.n] + '을(를) 들었다.', [s.n === 'nip' ? 'nip' : s.n], { secs: 1 }); continue; }
        if (d < 2.8 && P.item && P.item !== 'axe') {
          if (P.item === W.item) { stage = 'friend'; healT = 0; holdItem(P, null); mk.visible = false; G.sfx.play('ok'); G.hud.banner(W.fix + ' — 이제 친구', 'heart', 3.5); G.book.note('nightmare', 'other', '다치면 겁나서 위협 자세만 · 무기를 들 때만 쏨'); }
          else { M.fear = Math.min(1, M.fear + 0.15); D.pose = { crouch: 0.5 }; G.hud.say('hiccup', '이게 아닌가 봐… 어디가 아픈지 다시 보자.', [], { secs: 1.8 }); }
        }
      }
    } else if (stage === 'friend') {
      healT += dt;
      if (healT < 2) D.pose = { headUp: 0.6, fold: 0.2 + Math.abs(Math.sin(healT * 4)) * 0.5 };
      else if (healT < 3.5) { D.pose = { jaw: 0.3, headUp: 0.2 }; D.faceTo(P.W.x, P.W.z); }
      else { D.pose = {}; D.goTo(P.W.x + 1.5, P.W.z + 1.5, 1.4, 2.2); yield* sayAll(G, [['hiccup', '먼저 쏘지 않았어. 무서웠을 뿐이야.', ['heart']]]); return true; }
    }
    C.stage = stage; C.calm = calm; C.warn = warn;
  }
}
function wildSense(G, C) {
  const D = C.D, P = G.player, vis = D && D.root && G.vis(D.x, D.y + 1.2, D.z);
  return { stage: C.stage || 'calm', calm: +(C.calm || 0).toFixed(2), item: P.item, axe: C.AXE || null, cart: C.SL ? C.SL.map((s) => ({ n: s.n, x: +s.x.toFixed(2), z: +s.z.toFixed(2) })) : [],
    D: vis ? { x: +D.x.toFixed(2), z: +D.z.toFixed(2), crouch: +(D.rig.crouch || 0).toFixed(2), blaze: +(D.rig.blaze || 0).toFixed(2), pupil: +(D.rig.pupil || 0).toFixed(2), wound: C.stage === 'heal' && G.dist(P.W, D) < 12 ? C.wk : null } : null };
}

/* ── 또 하기 ⑥ 우박 — 하늘이 어두워지고(예고) 투슬리스가 날개를 펴면 그 밑으로 · 쏟아지는 동안 가만히(한 번) ──
   우박 날이 아니어도 이 차례엔 소나기가 한 번 지나감(버크 날씨는 하루에도 바뀜 · 바뀜은 서서히) */
function* hailStep(G, C) {
  yield* dayStart(G, C);
  const P = G.player, pl = G.place, easy = G.diff === 'easy', W = C.wx;
  const bits = hailBits(pl.group, 80);
  C.cleanup = () => { bits.dispose(); dim(G, 0); if (W && W.hail) W.hail.u.uN.value = WXK === 'hail' ? 0.18 : 0; };
  const spot = (k) => { const a = P.W.yaw - Math.PI * (0.55 + 0.25 * (k % 3)), r = easy ? 7 : 11 + (k % 2) * 2; return clearAt(G, P.W.x + Math.sin(a) * r, P.W.z + Math.cos(a) * r, 2); };   // 오른쪽 뒤(앞으로만 걷는 봇이 우연히 닿지 않게)
  const T = tl(G, { x: P.W.x + 6, z: P.W.z, yaw: 0 }); C.T = T;
  yield* until(() => T.root, 6);
  const s0 = spot(0); T.place(s0.x, s0.z, Math.atan2(P.W.x - s0.x, P.W.z - s0.z)); T.mind.lock = 'idle'; T.stay(); T.solid = true; T.radius = 1.4;
  yield* sayAll(G, [['gobber', WXK === 'hail' ? '오늘은 우박 날이다. 큰 게 오면 머리부터 가려!' : '하늘 봐라. 버크 날씨는 하루에도 세 번 바뀐다.', ['cloud']], ['hiccup', '어디 숨을 데가… 아, 투슬리스!']]);
  G.hud.goal('우박이 오면 투슬리스 날개 밑으로');
  const WARN = easy ? 3 : 2.5, LIGHT = easy ? 2 : 1.5, POUR = 4.2, UNDER = easy ? 3.2 : 2.5;
  let ph = 'calm', pt = 0, waves = 0, hits = 0, hitCd = 0;
  C.ph = ph;
  while (true) {
    const dt = yield; pt += dt; bits.step(dt);
    const under = G.dist(P.W, T) < UNDER && T.arrived();
    if (ph === 'calm') {
      dim(G, Math.max(0, 1 - pt / 1.5) * (waves ? 1 : 0)); if (W && W.hail) W.hail.u.uN.value = (WXK === 'hail' ? 0.18 : 0) * Math.min(1, pt);
      if (pt > (waves ? 3.5 : 1.5)) { ph = 'warn'; pt = 0; hits = 0; G.sfx.play('wind'); if (!waves) G.hud.say('hiccup', '하늘이 어두워진다…!', ['cloud'], { secs: 1.6 }); }
    } else if (ph === 'warn' || ph === 'light') {
      const k = Math.min(1, pt / WARN); dim(G, ph === 'warn' ? k : 1);
      if (W && W.hail) W.hail.u.uN.value = ph === 'warn' ? 0.05 + k * 0.12 : 0.35;
      T.stay(); T.faceTo(P.W.x, P.W.z); T.pose = { fold: 1 - Math.min(1, pt / 1.2) * 0.85, crouch: 0.4, headUp: 0.3 };   // 날개를 펴서 지붕처럼
      if (ph === 'light' && (pt * 8 | 0) % 2 === 0) bits.drop(P.W.x + (G.rng() - 0.5) * 16, gyOf(G, P.W.x, P.W.z), P.W.z + (G.rng() - 0.5) * 16);
      if (ph === 'warn' && pt > WARN) { ph = 'light'; pt = 0; }
      else if (ph === 'light' && pt > LIGHT) { ph = 'pour'; pt = 0; G.sfx.play('thud'); }
    } else if (ph === 'pour') {
      dim(G, 1); if (W && W.hail) W.hail.u.uN.value = 1;
      T.pose = { fold: 0.15, crouch: 0.4, headUp: 0.3 };
      for (let k = 0; k < 3; k++) { const x = P.W.x + (G.rng() - 0.5) * 18, z = P.W.z + (G.rng() - 0.5) * 18; bits.drop(x, G.dist({ x, z }, T) < 2.6 ? T.y + 1.8 : gyOf(G, x, z), z); }
      if (under) { P.pose = { low: 0.6 }; } else if (pt > 0.6) { hitCd -= dt; if (hitCd <= 0) { hitCd = 0.9; hits++; P.pose = { stumble: 0.7 }; G.sfx.play('pop'); if (hits === 1) G.hud.say('hiccup', '아야! 아야! 숨을 데!', [], { secs: 1.2 }); } else if (hitCd < 0.5) P.pose = null; }
      if (pt > POUR) {
        waves++; ph = 'calm'; pt = 0; P.pose = null; T.pose = {};
        if (hits === 0) {
          if (W && W.hail) W.hail.u.uN.value = WXK === 'hail' ? 0.18 : 0; dim(G, 0); G.sfx.play('ok');
          T.pose = { tilt: 0.6 }; G.hud.banner('우박 피하기 — 투슬리스 날개 밑에서', 'fin', 3);
          G.book.note('nightfury', 'other', '우박이 오면 날개를 펴서 가려 줌', false);
          yield* sayAll(G, [['hiccup', '고마워, 친구. 우산보다 낫다.', ['heart']]]);
          T.pose = {};
          return true;
        }
        G.hud.say('hiccup', '다음엔 날개 밑으로 먼저 가자…', [], { secs: 1.6 });
        const s = spot(waves); T.goTo(s.x, s.z, 3, 0.6); T.mind.lock = 'idle';
      }
    }
    C.ph = ph; C.hits = hits;
  }
}
const gyOf = (G, x, z) => (G.place.ground ? G.place.ground(x, z) : G.place.height(x, z, 20));
function hailSense(G, C) { const T = C.T, vis = T && T.root && G.vis(T.x, T.y + 1, T.z); return { ph: C.ph || 'calm', dark: C.ph && C.ph !== 'calm', wings: C.ph === 'warn' || C.ph === 'light' || C.ph === 'pour', tl: vis ? { x: +T.x.toFixed(2), z: +T.z.toFixed(2), moving: T.speed > 0.4 } : null }; }

/* ── 또 하기 ⑦ 스콜드런 — 책에서 나온 드래곤(영화 밖 · design §6-2) · 물 밖에 밀려와 몸이 마름 → 겁나면 물줄기로 먼저 경고(맞아도 바닷물 · 다치지 않음)
   물가에서 물(F) → 살금살금 → 날 볼 때 붓기(F) · 쉬움 1번 · 보통 2번 → 책 스콜드런 칸이 내 관찰로 바뀜 */
const SC = { at: { x: 74, z: 31 }, water: { x: 77.5, z: 35 } };
const SC_SPEC = Object.assign({}, SPECIES.nightmare, { space: 3.5, shy: 0.35, temper: 0.2, see: 24, fov: 1.4, likes: {}, hates: { loud: 1 }, warn: 'crouch', gap: 1.2 });
function tagSprite(text) {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 96; const x = cv.getContext('2d');
  x.fillStyle = 'rgba(244,234,210,0.92)'; x.strokeStyle = '#2b2118'; x.lineWidth = 4; x.beginPath(); x.roundRect ? x.roundRect(6, 10, 500, 76, 18) : x.rect(6, 10, 500, 76); x.fill(); x.stroke();
  x.fillStyle = '#2b2118'; x.font = 'bold 34px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 256, 50);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthWrite: false, fog: false })); s.scale.set(4.8, 0.9, 1); s.renderOrder = 970; return s;
}
function* scauldron(G, C) {
  yield* dayStart(G, C);
  const P = G.player, pl = G.place, easy = G.diff === 'easy', need = easy ? 1 : 2;
  const S0 = clearAt(G, SC.at.x, SC.at.z, 2), WS = SC.water;
  const D = G.dragon('nightmare', { x: S0.x, z: S0.z, yaw: Math.atan2(P.W.x - S0.x, P.W.z - S0.z) }, { mind: { fear: 0.45, trust: 0.05, curious: 0.4 } });
  D.solid = true; D.radius = 1.9; C.D = D; C.WS = WS;
  const tag = tagSprite('책에서 나온 드래곤 · 영화 밖'); pl.group.add(tag);
  const water = makePuffs(pl.group, 90, 0xbfe2f0);
  let undo = null;
  C.cleanup = () => { undo && undo(); tag.removeFromParent(); tag.material.map.dispose(); tag.material.dispose(); G.useSpots = []; };
  yield* until(() => D.root, 6);
  undo = paintScauldron(D.root); D.root.scale.multiplyScalar(1.15);
  D.mind.S = SC_SPEC; D.mind.lock = 'watch'; D.stay(); tag.position.set(D.x, D.y + 4.2, D.z);   // 처음 만날 때부터 머리 위 표시
  G.hud.banner('스콜드런 — 책에서 나온 드래곤 · 영화 밖', 'book', 4);
  yield* sayAll(G, [['fishlegs', '스콜드런이다! 책에서만 봤던 드래곤…!', ['book']], ['hiccup', '물 밖에 너무 오래 있었나 봐. 몸이 말라 가.', ['water']]]);
  G.book.give && G.book.give();
  G.hud.goal('스콜드런에게 물 붓기 (0/' + need + ')'); G.hud.howto('water11', 8);
  let full = false, poured = 0, warn = 0, sprayT = 0, endT = -1, t = 0;
  while (true) {
    const dt = yield; t += dt; water.step(dt);
    const M = D.mind, d = G.dist(P.W, D);
    tag.position.set(D.x, D.y + 4.2, D.z);
    if (endT >= 0) {
      endT += dt;
      if (endT < 2.2) { D.pose = { headUp: 0.9, jaw: 0.7 }; if ((endT * 10 | 0) % 2 === 0) water.burst(D.x + Math.sin(D.yaw) * 2.6, D.y + 3, D.z + Math.cos(D.yaw) * 2.6, 6, 1, 4.5); }
      else if (endT < 2.4) { D.pose = {}; D.goTo(SC.at.x + 14, SC.at.z + 10, 2.2, 1); }
      else if (endT > 5.5) { yield* sayAll(G, [['fishlegs', '책엔 "끓는 물"이라던데… 그냥 바닷물이었어. 내가 고쳐 써야지!', ['pencil']]]); return true; }
      continue;
    }
    G.useSpots = !full ? [{ x: WS.x, y: 0, z: WS.z }] : d < 5 ? [{ x: D.x, y: D.y, z: D.z }] : [];
    if (P.mash && d < 14) M.event('loud');
    if (!full && P.fTap && G.near(WS, 2.6)) { full = true; holdItem(P, 'bucket'); water.burst(WS.x, 0.2, WS.z, 8, 0.8, 1.5); G.sfx.play('splash'); G.hud.say('hiccup', '바닷물 한 통!', ['bucket'], { secs: 1 }); continue; }
    /* 겁나면 먼저 물줄기 경고(예고 → 뿜음 · 맞으면 밀려나고 통이 엎질러짐 · 다치지 않음) */
    if (sprayT > 0) { sprayT -= dt; if (sprayT <= 0 && P.pose && P.pose.stumble) P.pose = null; continue; }
    const fast = d < 7 && !P.W.low && P.W.speed > 2.4 && !easy;
    if (warn <= 0 && d < 10 && (M.fear > 0.75 || fast)) { warn = easy ? 2 : 1.5; G.hud.say('hiccup', '목이 부풀었다… 물을 뿜겠어!', [], { secs: 1.2 }); }
    if (warn > 0) {
      warn -= dt; D.faceTo(P.W.x, P.W.z); D.pose = { crouch: 0.6, headUp: 0.5, jaw: 0.3 };
      if (warn <= 0) {
        D.pose = { jaw: 0.8, headUp: 0.2 };
        const ux = (P.W.x - D.x) / (d || 1), uz = (P.W.z - D.z) / (d || 1);
        for (let k = 1; k < 8; k++) water.burst(D.x + ux * k * 1.2, D.y + 2.2 - k * 0.12, D.z + uz * k * 1.2, 5, 0.5, 1.2);
        G.sfx.play('splash');
        if (d < 9) { const p = clearAt(G, P.W.x + ux * 2.2, P.W.z + uz * 2.2, 0.4); P.W.place(p.x, p.z, P.W.yaw); P.pose = { stumble: 0.8 }; if (full) { full = false; } G.hud.say('hiccup', '푸하! 물벼락… 겁을 줬나 봐.', [], { secs: 1.8 }); }
        M.fear = Math.max(0.3, M.fear - 0.2); sprayT = 1;
      }
      continue;
    }
    D.pose = M.fear > 0.5 ? { crouch: 0.4, tailCurl: 0.5, jaw: 0.25 } : { jaw: 0.2 };
    if (d < 16 && (t % 7) < 4.6) D.faceTo(P.W.x, P.W.z); else D.faceTo(D.x + 6, D.z + 5);   // 사람을 보다가 가끔 바다 쪽을 봄(날 볼 때를 기다리기)
    if (full && P.fTap && d < (easy ? 4 : 3.4)) {
      const toMe = Math.atan2(P.W.x - D.x, P.W.z - D.z), looks = Math.cos(ang(D.yaw, toMe)) > 0.7;
      if (looks && M.fear < (easy ? 0.72 : 0.6)) {
        full = false; poured++; holdItem(P, 'bucket'); M.fear = Math.max(0, M.fear - 0.3); M.trust = Math.min(1, M.trust + 0.35);
        for (let k = 0; k < 4; k++) water.burst(D.x + (G.rng() - 0.5) * 2, D.y + 2.4, D.z + (G.rng() - 0.5) * 2, 6, 1.2, 0.6);
        G.sfx.play('splash'); G.hud.goal('스콜드런에게 물 붓기 (' + poured + '/' + need + ')');
        if (poured >= need) {
          endT = 0; holdItem(P, null); G.sfx.play('ok'); D.mind.lock = 'idle';
          G.book.note('scauldron', 'sign', '겁나면 물줄기로 먼저 경고함(맞아도 그냥 바닷물)', false);
          G.book.note('scauldron', 'likes', '몸이 마르면 힘들어함 · 물을 부어 주니 누그러짐');
        } else G.hud.say('hiccup', '좋아하네! 한 통 더.', ['bucket'], { secs: 1.4 });
      } else G.hud.say('hiccup', looks ? '아직 겁내… 더 천천히.' : '날 보고 있을 때 붓자.', [], { secs: 1.4 });
    }
    C.full = full; C.poured = poured; C.warn = warn;
  }
}
function scSense(G, C) {
  const D = C.D, P = G.player, vis = D && D.root && G.vis(D.x, D.y + 1.2, D.z);
  let fm = false; if (vis) { const toMe = Math.atan2(P.W.x - D.x, P.W.z - D.z); fm = Math.cos(ang(D.yaw, toMe)) > 0.7; }
  return { full: !!C.full, poured: C.poured || 0, water: C.WS || null, warn: (C.warn || 0) > 0, sc: vis ? { x: +D.x.toFixed(2), z: +D.z.toFixed(2), facingMe: fm, pupil: +(D.rig.pupil || 0).toFixed(2), crouch: +(D.rig.crouch || 0).toFixed(2) } : null };
}

/* ── 또 하기 ⑧ 배 타기(#19) — 선착장 → 정해진 뱃길 노 박자(4장 ②와 같은 손 · 팀 F boat.js) → 돌기둥 옆에서 고기잡이 한 번 · 비 오는 날은 잘 묾 ── */
function* boatRide(G, C) {
  yield* dayStart(G, C);
  const P = G.player, pl = G.place, easy = G.diff === 'easy';
  C.state = 'row';
  const mod = yield* awaitP(import('../play/boat.js?v=17').catch(() => null));
  if (mod && mod.createBoat && pl.lists.boatPath) {
    const B = mod.createBoat({ path: pl.lists.boatPath, mode: G.diff, rider: { root: P.root, rig: P.rig } });
    pl.group.add(B.root); if (B.foam) pl.group.add(B.foam);
    C.boat = B; P.cam = 'boat'; const BC = { init: false };
    G.camDraw = (a, dt) => { B.draw(a, dt); boatCam(G.camera, B, dt, BC); };
    C.cleanup = () => { P.cam = 'follow'; G.camDraw = null; B.root.removeFromParent(); if (B.foam) B.foam.removeFromParent(); B.dispose && B.dispose(); };
    yield* sayAll(G, [['hiccup', '오늘은 배로 돌기둥까지! 노는 박자가 생명이야.', ['ship']]]);
    G.hud.goal('노를 박자에 맞춰 돌기둥까지'); G.hud.howto('rhythm', 8);
    let arrived = false; B.on('arrive', () => { arrived = true; });
    B.on('stroke', (e) => { if (e.kind === 'beat') G.sfx.play('splash'); });
    while (!arrived) { const dt = yield; B.step(dt, G.input, G.t); }
    P.W.x = B.state.x; P.W.z = B.state.z; P.W.yaw = B.state.yaw + Math.PI / 2; P.W.y = 0.4;
  } else G.putPlayer(pl.anchors.fishing || pl.anchors.dock || { x: 0, z: 0 });
  /* 고기잡이 한 번 — 던지기(F) → 찌가 쏙 들어갈 때 F → 당기는 반대쪽(A·D) */
  C.state = 'cast'; G.hud.goal('돌기둥 옆에서 고기잡이'); G.hud.howto('fish', 8);
  const bob = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), new THREE.MeshToonMaterial({ color: 0xc8503a })); bob.visible = false; pl.group.add(bob);
  const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]); const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0x2b2118 })); line.frustumCulled = false; line.visible = false; pl.group.add(line);
  const puffs = makePuffs(pl.group, 60);
  const old = C.cleanup; C.cleanup = () => { bob.removeFromParent(); bob.geometry.dispose(); bob.material.dispose(); line.removeFromParent(); lineGeo.dispose(); line.material.dispose(); old && old(); };
  const rain = WXK === 'rain';
  let t = 0, biteAt = 0, nib = [], pull = 0, pullDir = 0, fightT = 0, slack = 0, bx = 0, bz = 0, by = 0;
  while (true) {
    const dt = yield; t += dt; puffs.step(dt);
    const W = P.W, r = { x: W.x + Math.sin(W.yaw) * 0.6, y: W.y + 1.6, z: W.z + Math.cos(W.yaw) * 0.6 };
    if (C.state === 'cast') {
      if (P.fTap) { bx = W.x + Math.sin(W.yaw) * 6; bz = W.z + Math.cos(W.yaw) * 6; by = 0.05; bob.visible = line.visible = true; C.state = 'wait'; t = 0; biteAt = rain ? 1.5 + G.rng() * 1.6 : 2.2 + G.rng() * 3; nib = [biteAt - 1.2 - G.rng() * 0.3, biteAt - 0.6]; puffs.burst(bx, 0.1, bz, 8, 1, 1.5); }
    } else if (C.state === 'wait') {
      const nibble = nib.some((n) => t > n && t < n + 0.18), sink = t > biteAt && t < biteAt + (easy ? 0.8 : 0.5);
      by = sink ? -0.35 : nibble ? -0.08 : 0.04 + Math.sin(t * 3) * 0.02; C.bob = sink ? 'sink' : nibble ? 'nibble' : 'float';
      if (P.fTap) {
        if (sink) { C.state = 'fight'; fightT = 0; slack = 0; pullDir = G.rng() < 0.5 ? -1 : 1; pull = 0; G.hud.say('hiccup', '걸렸다!', [], { secs: 1 }); }
        else { C.state = 'cast'; bob.visible = line.visible = false; G.hud.say('hiccup', '너무 일렀어… 다 도망갔다.', [], { secs: 1.6 }); }
      }
      if (t > biteAt + 1.4) { C.state = 'cast'; bob.visible = line.visible = false; G.hud.say('hiccup', '놓쳤다… 다시.', [], { secs: 1.4 }); }
    } else if (C.state === 'fight') {
      fightT += dt; pull += dt; if (pull > 1.5) { pull = 0; pullDir = -pullDir; }
      const hold = G.input.axis('left', 'right'), good = hold === -pullDir;
      slack = good ? Math.max(0, slack - dt * 1.5) : slack + dt * (hold === 0 ? 0.8 : 1.6);
      bx += pullDir * dt * 1.2 * (good ? 0.2 : 1); by = -0.1; if ((fightT * 10 | 0) % 3 === 0) puffs.burst(bx, 0.1, bz, 2, 0.8, 1.2); C.pull = pullDir;
      if (slack > (easy ? 2.2 : 1.3)) { C.state = 'cast'; bob.visible = line.visible = false; G.hud.say('hiccup', '줄이 끊어졌다…', [], { secs: 1.4 }); }
      else if (fightT > (easy ? 3 : 4.2)) {
        bob.visible = line.visible = false; puffs.burst(bx, 0.3, bz, 18, 2, 3); G.sfx.play('splash'); G.inv.salmon = (G.inv.salmon || 0) + 1; C.state = 'done';
        G.hud.banner('돌기둥 고기잡이 — 커다란 연어!', 'salmon', 3);
        yield* sayAll(G, [['hiccup', '배로 나오니까 고기도 크다. 투슬리스가 좋아하겠어!', ['salmon']]]);
        return true;
      }
    }
    bob.position.set(bx, by, bz);
    const lp = lineGeo.attributes.position; lp.setXYZ(0, r.x, r.y, r.z); lp.setXYZ(1, bx, by + 0.1, bz); lp.needsUpdate = true;
  }
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
  id: 11, title: '종장 · 함께 사는 버크', sub: '깨어남 → 대장간 → 마을 하늘 → 또 하기 → 다음 날',
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
    /* 다음 날 — 그날 날씨(맑음·비·눈·우박 중 하나 · ?wx=) · 빼는 차례 1번에서 뺐던 다섯(팀 J) */
    { id: '11-6', verb: 'approach', howtoVerb: 'lead11', place: 'village', time: WXT, at: { x: -32, z: -52.5, yaw: 0.2 }, goal: '이웃 걱정 풀기', limit: 200,
      hints: { 1: '그롱클은 풀을 좋아해. 풀을 들고 지붕 밑에서 F 꾹.', 2: '살금살금 천천히 쉼터까지 · 내더는 살금살금 다가가 턱 밑(F).' }, run: neighbors, sense: nbSense },
    { id: '11-7', verb: 'approach', howtoVerb: 'heal11', place: 'village', time: WXT, at: 'forest_gate', goal: '다친 드래곤 돕기', limit: 110,
      hints: { 1: '도끼는 두고 가자. 살금살금 다가가서 F 꾹(고개 돌려 손).', 2: '다친 곳을 보고 수레에서 맞는 것(천·약초·물)을 가져와 F.' }, run: wild, sense: wildSense },
    { id: '11-8', verb: 'hide', howtoVerb: 'shelter11', place: 'village', time: WXT, at: { x: 2, z: 11, yaw: Math.PI }, goal: '우박 피하기', limit: 80,
      hints: { 1: '하늘이 어두워지면 투슬리스에게!', 2: '날개 밑에 들어가 그칠 때까지 가만히.' }, run: hailStep, sense: hailSense },
    { id: '11-9', verb: 'approach', howtoVerb: 'water11', place: 'village', time: WXT, at: { x: 66, z: 22, yaw: 0.9 }, goal: '스콜드런 돕기', limit: 110,
      hints: { 1: '물가에서 물을 떠(F) 살금살금 가자.', 2: '스콜드런이 날 볼 때 가까이서 F.' }, run: scauldron, sense: scSense },
    { id: '11-10', verb: 'rhythm', place: 'sea', time: WXT, at: 'dock', goal: '배 타고 고기잡이', limit: 150,
      hints: (G, C) => (C.state === 'row' ? { 1: '노가 물에 닿는 박자를 보자.', 2: '노가 물에 닿을 때 Space · 마구 누르면 엉켜.' } : { 1: '찌가 쏙 들어갈 때 당겨야 해.', 2: '고기가 당기는 반대쪽 키를 누르자.' }), run: boatRide,
      sense: (G, C) => Object.assign({ state: C.state, bob: C.bob || '', pull: C.pull || 0 }, C.state === 'row' && C.boat ? boatSense(C.boat) : {}) },
    { id: '11-11', place: 'village', time: 'clear', at: 'plaza', run: finale, sense: () => ({}) },
  ],
};
