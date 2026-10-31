// 5장 꼬리날개(design §2 · reference #11·#12) — ① 망루 밤 고버 무용담 동안 바람 속 횃불 지키기[걸으며 듣기] ② 대장간: 가죽 자르기 · 바람 시험 · 방패 덧대기[박자]
// ③ 코브: 뱀장어에 질겁 · 꼬리 살피기(첫 치유)[다가가] ④ 꼬리날개 달고 첫 들림 → 첨벙[관문 비행] ⑤ 훈련 3일 지플백(불꽃 머리에 물 · 다른 길 뱀장어)[던지기 · 쉬움 X]
// 와! = 첫 들림에 발이 땅에서 떨어지는 3초 · 변화 = 갈색 가죽 꼬리날개 · 대장간 벽 설계도 · 덧댄 방패 · 사이 레벨 1(부르면 오는 거리)
import * as THREE from 'three';
import { wait, until, sayAll } from './runner.js?v=15';
import { holdItem, dropItem, makePuffs } from './fx.js?v=15';
import { toon, flameMesh, glowSprite } from '../look/kit.js?v=15';
import { tlSense } from './ch4.js?v=15';
import { flySense } from './flysense.js?v=15';

const WARN = { easy: 3, normal: 2.5, hard: 2 };
const TAU = Math.PI * 2;

/* ① 망루 — 바람이 한 횃불 쪽으로 불어옴(2초 전 눈발 줄이 먼저 · 불꽃이 기욺) · 바람 쪽에 서서 몸으로 막거나, 꺼지면 F로 다시 붙임 · 이야기 끝에 둘 이상 */
const STORY = [
  ['gobber', '그때 나이트메어가 내 팔을 꿀꺽! 딱 한 마리였지.', ['hammer']],
  ['gobber', '아니, 두 마리. 가만, 다섯 마리였나?'],
  ['gobber', '다리는 그롱클이 가져갔어. 맛은 없었을 거다.'],
  ['hiccup', '…아저씨, 그 얘기 매번 숫자가 늘어요.'],
  ['gobber', '중요한 건 이거야. 날개나 꼬리를 노려라.'],
  ['gobber', '못 나는 드래곤은 못 돌아오거든.'],
  ['hiccup', '…못 나는 드래곤. 꼬리…!', ['fin']],
];
function* tower(G, C) {
  const P = G.player, pl = G.place, top = pl.anchors.tower_top || { x: 0, z: 0, y: 0, yaw: 0 };
  const Gb = G.person('gobber', { x: top.x + Math.sin((top.yaw || 0) + 2.4) * 1.4, z: top.z + Math.cos((top.yaw || 0) + 2.4) * 1.4, y: top.y, yaw: (top.yaw || 0) - 1 }, { noCollide: true });
  const easy = G.diff === 'easy';
  const TR = [0, 1, 2].map((i) => { const a = (top.yaw || 0) + i * TAU / 3 + 0.5, x = top.x + Math.sin(a) * 2.2, z = top.z + Math.cos(a) * 2.2, y = pl.height(x, z, top.y ?? 0) + 1.3; const f = flameMesh(0.9), g = glowSprite(0xffa040, 3, 0.55); f.position.set(x, y, z); g.position.set(x, y + 0.4, z); pl.group.add(f, g); return { x, y, z, a, f, g, lit: true, life: 1 }; });
  const puffs = makePuffs(pl.group, 160, 0xdde4ea);
  C.TR = TR; C.cleanup = () => { for (const t of TR) { t.f.removeFromParent(); t.g.removeFromParent(); } };
  holdItem(P, easy ? null : 'torch');
  let li = 0, gust = null, gt = easy ? 1e9 : 3.5, kk = 0;
  while (li < STORY.length || G.hud.busy()) {
    const dt = yield; puffs.step(dt);
    if (!G.hud.busy() && li < STORY.length && (!easy || G.near(top, 7))) { const m = STORY[li++]; G.hud.say(m[0], m[1], m[2] || []); Gb.pose = { talk: m[0] === 'gobber' ? 1 : 0, hammer: li === 1 ? 1 : 0 }; }
    /* 바람 — 2초 예고(눈발 줄이 그 횃불 쪽으로 흘러감 · 불꽃이 먼저 기욺) → 불어옴 */
    gt -= dt;
    if (!gust && gt <= 0) { let k = (kk++ * 2 + 1) % 3; for (let q = 0; q < 3 && !TR[k].lit; q++) k = (k + 1) % 3; gust = { k, t: 0, from: TR[k].a }; }
    if (gust) {
      gust.t += dt; const t = TR[gust.k], sx = top.x + Math.sin(gust.from) * 7, sz = top.z + Math.cos(gust.from) * 7;
      if ((gust.t * 30 | 0) % 2 === 0) { puffs.burst(sx + (t.x - sx) * (gust.t / 2.4), t.y + 0.3, sz + (t.z - sz) * (gust.t / 2.4), 2, 0.6, 0.3); }
      t.f.rotation.z = Math.min(1, gust.t / 2) * 0.7;
      if (gust.t > (easy ? 3 : WARN[G.diff])) {
        /* 막았나 — 횃불과 바람 쪽 사이(바깥쪽 1.4m 안) */
        const bx = t.x + Math.sin(gust.from) * 0.9, bz = t.z + Math.cos(gust.from) * 0.9, shield = Math.hypot(P.W.x - bx, P.W.z - bz) < 1.1;
        if (!shield) { t.lit = false; G.hud.say('hiccup', '앗, 꺼졌다!', [], { secs: 1 }); } else G.hud.say('hiccup', '막았다!', [], { secs: 0.9 });
        t.f.rotation.z = 0; gust = null; gt = 3.8 + G.rng() * 2;
      }
    }
    C.gust = gust ? { k: gust.k, x: +(TR[gust.k].x + Math.sin(gust.from) * 0.9).toFixed(2), z: +(TR[gust.k].z + Math.cos(gust.from) * 0.9).toFixed(2), t: +gust.t.toFixed(2) } : null;
    /* 다시 붙이기 */
    G.useSpots = TR.filter((t) => !t.lit).map((t) => ({ x: t.x, y: t.y - 1.3, z: t.z }));
    if (P.fTap) for (const t of TR) if (!t.lit && Math.hypot(P.W.x - t.x, P.W.z - t.z) < 1.8) { t.lit = true; break; }
    for (const t of TR) { t.f.visible = t.lit; t.g.visible = t.lit; }
    C.lit = TR.filter((t) => t.lit).length;
  }
  if (C.lit < 2) { yield* sayAll(G, [['gobber', '깜깜해서 무슨 얘기를 했는지도 모르겠군. 다시!']]); return 'retry'; }
  holdItem(P, null);
  return true;
}
function towerSense(G, C) { return { torches: (C.TR || []).map((t) => ({ x: +t.x.toFixed(2), z: +t.z.toFixed(2), lit: t.lit })), gust: C.gust, lit: C.lit, top: G.place.anchors.tower_top || null }; }

/* ② 대장간 — 자르기 · 바람 시험 · 망치(방패 덧대기 = 1장 그을린 조각 · #11 · #31) */
function* forge(G, C) {
  const P = G.player, pl = G.place, A = pl.anchors, bench = A.forge_bench || A.forge_anvil || { x: 0, z: 0 };
  const Gb = G.person('gobber', A.forge_anvil || { x: bench.x + 2, z: bench.z, yaw: 0 }); Gb.pose = { hammer: 1 };
  G.hud.goal('작업대로');
  G.useSpots = [{ x: bench.x, y: 0, z: bench.z }];
  yield* until(() => P.fTap && G.near(bench, 2.6));
  G.useSpots = []; P.lock = true;
  C.stage = 'cut'; G.hud.goal('꼬리날개 만들기'); G.hud.howto('rhythm', 6);
  yield* G.bench.cut(G.input, G.diff === 'easy');
  C.stage = 'wind';
  yield* G.bench.wind(G.input, G.diff === 'easy', G);
  C.stage = 'hammer';
  G.hud.say('gobber', '그 그을린 조각, 방패에 덧대 봐라. 덜 다칠 거다.', ['shield']);
  yield* G.bench.hammer(G.input, G.diff === 'easy', G.diff === 'easy' ? 3 : 4);
  G.bench.hide(); P.lock = false; C.stage = 'done';
  G.inv.finNew = 1; G.inv.shield = 'patched';
  G.hud.banner('새 꼬리날개 · 덧댄 방패 · 벽에 내 설계도', 'finNew', 4);
  yield* sayAll(G, [['gobber', '그게 뭐냐? …뭐, 멋지긴 하다.']]);
  return true;
}

/* ③ 코브 — 바구니 속 뱀장어에 투슬리스가 질겁(책 '싫어함') → 뱀장어를 치우면 먹음 → 꼬리 살피기: 만지면 움찔 → 손을 떼고 숨이 고르면 다시(첫 치유) */
function* eelTail(G, C) {
  const P = G.player, pl = G.place, A = pl.anchors, sand = A.sand || A.floor || { x: 0, z: 0 };
  const T = G.castBy.tl || G.dragon('nightfury', A.rest_rock || sand, { keep: 'tl', mind: { fear: 0.25, trust: 0.55, hunger: 0.8, curious: 0.5 } }); C.T = T; T.solid = true;
  yield* until(() => T.root);
  const bk = { x: sand.x + 2, z: sand.z + 1.5 }; C.bk = bk;
  const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.35, 0.45, 12), toon({ color: 0x9a7a4a })); basket.position.set(bk.x, pl.height(bk.x, bk.z, 0) + 0.22, bk.z); pl.group.add(basket);
  const eel = dropItem(pl.group, 'eel', bk.x, pl.height(bk.x, bk.z, 0) + 0.5, bk.z, 0.4);
  C.cleanup = () => { basket.removeFromParent(); basket.geometry.dispose(); eel.removeFromParent(); };
  T.mind.lock = 'idle'; T.goTo(bk.x + 3, bk.z + 1, 2, 0.5);
  yield* until(() => T.arrived(), 6);
  T.faceTo(bk.x, bk.z); T.mind.event('offer', 'eel'); T.pose = { crouch: 0.8, teeth: 1, ear: -1, tailCurl: 1 };
  T.goTo(bk.x + 9, bk.z + 4, 4, 0.5);
  yield* sayAll(G, [['hiccup', '어? 왜 그래? …아, 뱀장어!', ['eel']]]);
  G.book.note('nightfury', 'hates', '칼 · 뱀장어(보기만 해도 질겁)');
  G.hud.goal('바구니에서 뱀장어 치우기');
  C.stage = 'eel';
  G.useSpots = [{ x: bk.x, y: 0, z: bk.z }];
  yield* until(() => P.fTap && G.near(bk, 2));
  eel.removeFromParent(); holdItem(P, 'eel');
  G.hud.say('hiccup', '이건 멀리 치워야지.', ['eel']); C.stage = 'carry';
  G.useSpots = [];
  yield* until(() => G.dist(P.W, bk) > 12 && P.fTap);
  holdItem(P, null); G.inv.eel = (G.inv.eel || 0) + 1;
  T.pose = {}; T.mind.fear = 0.2; T.mind.lock = 'idle'; T.goTo(bk.x + 1.2, bk.z + 0.6, 2, 0.4);
  G.hud.say('hiccup', '이제 먹어.', ['cod']);
  yield* until(() => T.arrived(), 8);
  T.faceTo(bk.x, bk.z); T.pose = { headUp: -0.7, jaw: 0.4 };
  /* 꼬리 살피기 — 뒤로 돌아가 F 길게 · 움찔(꼬리 휘두름 예고 0.5초)에 손을 떼야 · 세 번 */
  C.stage = 'tail'; G.hud.goal('다친 꼬리 살피기');
  const tailPt = () => ({ x: T.x - Math.sin(T.yaw) * 3.4, z: T.z - Math.cos(T.yaw) * 3.4 });
  let touches = 0, touchT = 0, flinch = 0, calm = 1, knocked = 0;
  while (touches < 3) {
    const dt = yield;
    const tp = tailPt(); C.tail = tp; G.useSpots = [{ x: tp.x, y: 0, z: tp.z }];
    const at = Math.hypot(P.W.x - tp.x, P.W.z - tp.z) < 1.6, touching = at && P.reach;
    if (flinch > 0) { flinch -= dt; T.pose = { headUp: -0.7, jaw: 0.4, tailCurl: 0.6, ear: -0.6 }; if (touching && flinch < 0.5) { knocked++; flinch = 0; P.lock = true; P.pose = { stumble: 1 }; C.down = 1.2; G.hud.say('hiccup', '아얏! 꼬리에 맞았다.', [], { secs: 1.2 }); calm = 0; } if (flinch <= 0) calm = 0; }
    else if (touching) { touchT += dt; if (touchT > 0.9) { if (calm > 0.7) { touches++; touchT = 0; G.hud.say('hiccup', ['살살…', '괜찮아…', '거의 다 됐어.'][touches - 1], [], { secs: 1 }); flinch = 1.3; } else { flinch = 1.3; touchT = 0; } } }
    else touchT = Math.max(0, touchT - dt);
    if (!touching && flinch <= 0) calm = Math.min(1, calm + dt * 0.8);
    T.rig && (T.pose.pupil = flinch > 0 ? 0.2 : calm);
    C.flinch = flinch > 0; C.calm = +calm.toFixed(2); C.touches = touches;
    if (C.down > 0) { C.down -= dt; if (C.down <= 0) { P.lock = false; P.pose = null; } }
    if (knocked >= 3) { yield* sayAll(G, [['hiccup', '…아프게 했나 봐. 천천히 다시.']]); return 'retry'; }
  }
  G.useSpots = []; T.pose = {};
  G.hud.banner('첫 치유 — 다친 꼬리를 살폈다', 'heart', 3.5);
  G.book.note('nightfury', 'other', '다친 곳을 만지면 움찔 · 기다리면 맡겨 줌');
  return true;
}
function eelSense(G, C) { return { stage: C.stage, basketAt: C.bk || null, tail: C.tail || null, flinch: !!C.flinch, calm: C.calm, touches: C.touches || 0, tl: tlSense(G, C.T) }; }

/* ④ 첫 들림 — 먹는 틈에 꼬리날개를 달고(F) · 투슬리스가 떠오름 · 손으로 꼬리날개를 좌우로 돌려(A/D) 돌벽 피하기 → 호수에 첨벙 */
function* lift(G, C) {
  const P = G.player, pl = G.place, A = pl.anchors;
  const T = G.castBy.tl || G.dragon('nightfury', A.sand || A.floor || { x: 0, z: 0 }, { keep: 'tl', mind: { fear: 0.2, trust: 0.6 } }); C.T = T; T.solid = true;
  yield* until(() => T.root);
  T.mind.lock = 'idle'; T.stay(); T.pose = { headUp: -0.6, jaw: 0.3 };
  G.hud.goal('먹는 틈에 꼬리날개 달기');
  let tp; do { tp = { x: T.x - Math.sin(T.yaw) * 3.4, z: T.z - Math.cos(T.yaw) * 3.4 }; G.useSpots = [{ x: tp.x, y: 0, z: tp.z }]; C.tail = tp; } while (!(P.fTap && Math.hypot(P.W.x - tp.x, P.W.z - tp.z) < 1.8) && (yield, true));
  G.useSpots = []; C.tail = null;
  G.hud.say('hiccup', '…됐다. 가만히 있어 봐…', ['finNew']);
  yield* wait(1.2);
  /* 날기 — flight.js(팀 F) liftOnly · 없으면 간단한 들림(앞으로 저절로 · A/D 꼬리) */
  const mod = yield* awaitP(import('../play/flight.js?v=15').catch(() => null));
  const lake = pl.lake || { x: (A.lake || T).x, z: (A.lake || T).z, r: 12, y: 0 }, fly = pl.fly || { ground: (x, z) => pl.height(x, z, 0), pillars: [], ceil: 40, bounds: { x: lake.x, z: lake.z, r: 40 } };
  let F = null, cam = null, splash = false, crash = false;
  if (mod && mod.createFlight) {
    F = mod.createFlight({ world: Object.assign({ lake }, fly), mode: G.diff, dragon: { root: T.root, rig: T.rig }, rider: { root: P.root, rig: P.rig, tail: true }, rng: G.rng });
    const toLake = Math.atan2(lake.x - T.x, lake.z - T.z), side = Math.sin(G.t * 1.7) > 0 ? 1 : -1;   // 호수를 옆에 두고 떠오름 → 꼬리로 돌아야 첨벙(가만히 = 돌벽)
    F.setOpts({ liftOnly: true }); F.place(T.x, T.y + 1, T.z, toLake + side * 1.45, 0); F.setOpts({ liftOnly: true });
    F.on('done', () => { splash = true; }); F.on('splash', () => { if (F.state.liftT > 2) splash = true; }); F.on('crash', () => { crash = true; }); F.on('fall', () => { crash = true; });
    cam = mod.createFlightCam ? mod.createFlightCam(G.camera) : null;
  } else F = simpleLift(G, T, fly, lake, () => { splash = true; }, () => { crash = true; });
  T.manual = true; P.cam = 'fly'; P.hidden = false;
  G.camDraw = (a, dt) => { F.draw(a, dt); if (cam) { if (cam.update) cam.update(dt, F); else cam.draw(a, dt, F); } };
  C.cleanup = () => { T.manual = false; P.cam = 'follow'; G.camDraw = null; F.dispose && F.dispose(); };
  G.hud.goal('꼬리날개로 돌벽 피하기'); G.hud.howto(G.diff === 'easy' ? 'flyEasy' : 'fly', 6);
  G.hud.say('hiccup', '뜬다…! 발이, 땅에서…!', [], { secs: 2.4 });
  C.F = F;
  while (!splash && !crash) { const dt = yield; F.step(dt, G.input); }
  T.manual = false; P.cam = 'follow'; G.camDraw = null;
  if (crash) { T.place(A.sand ? A.sand.x : T.x, A.sand ? A.sand.z : T.z); G.putPlayer(A.sand || { x: T.x + 3, z: T.z }); yield* sayAll(G, [['hiccup', '쿵… 벽이다. 다시 해 보자.']]); return 'retry'; }
  T.place(lake.x + 2, lake.z + lake.r * 0.6); G.putPlayer({ x: lake.x - 1, z: lake.z + lake.r * 0.7 + 1, yaw: 0 });
  const puffs = makePuffs(pl.group, 80); puffs.burst(lake.x, (lake.y || 0) + 0.2, lake.z, 40, 4, 5); G.sfx.play('splash');
  for (let k = 0; k < 60; k++) puffs.step(yield);
  yield* sayAll(G, [['hiccup', '첨벙… 그래도 날았어! 우리 둘이!']]);
  G.inv.bond = Math.max(G.inv.bond || 0, 1);
  G.hud.banner('사이 레벨 1 — 부르면 오는 거리', 'heart', 4);
  return true;
}
function* awaitP(p) { let v, done = false; p.then((x) => { v = x; done = true; }, () => { done = true; }); while (!done) yield; return v; }
/* flight.js가 오기 전 자리표시 들림 — 앞으로 저절로 원을 그리며 돎 · A/D가 꼬리 · 6초 안 벽에 안 닿으면 호수로 */
function simpleLift(G, T, fly, lake, onSplash, onCrash) {
  const b = fly.bounds || { x: lake.x, z: lake.z, r: 30 }, R = b.r || Math.min(b.rx || 30, b.rz || 30);
  const S = { x: T.x, z: T.z, y: T.y, yaw: T.yaw, t: 0, px: T.x, pz: T.z, py: T.y, pyaw: T.yaw };
  const F = { state: S };
  F.step = (dt, I) => {
    S.t += dt; S.px = S.x; S.pz = S.z; S.py = S.y; S.pyaw = S.yaw;
    const steer = I.axis('left', 'right'), drift = Math.sin(S.t * 0.9) * 0.55;   // 바람에 저절로 휨 → 손으로 바로잡아야
    S.yaw += (-steer * 1.3 + drift) * dt; S.x += Math.sin(S.yaw) * 7 * dt; S.z += Math.cos(S.yaw) * 7 * dt; S.y = Math.min(S.y + dt * 2.5, (fly.ground ? fly.ground(S.x, S.z) : 0) + 4);
    if (Math.hypot(S.x - b.x, S.z - b.z) > R - 3) onCrash();
    if (S.t > 7) { const d = Math.hypot(S.x - lake.x, S.z - lake.z); if (d < lake.r + 8 || S.t > 14) onSplash(); }
  };
  F.draw = (a) => { if (T.root) { T.root.position.set(S.px + (S.x - S.px) * a, S.py + (S.y - S.py) * a, S.pz + (S.z - S.pz) * a); T.root.rotation.y = S.yaw; T.rig.flapRate = 1; T.rig.fold = 0; T.rig.update(1 / 60); }
    const P = G.player; if (P.root) { P.root.position.set(T.root.position.x - Math.sin(S.yaw) * 3.6, T.root.position.y + 0.4, T.root.position.z - Math.cos(S.yaw) * 3.6); P.root.rotation.y = S.yaw; }
    G.camera.position.set(T.root.position.x - Math.sin(S.yaw) * 12, T.root.position.y + 5, T.root.position.z - Math.cos(S.yaw) * 12); G.camera.lookAt(T.root.position); };
  F.sense = () => ({ x: S.x, z: S.z, yaw: S.yaw, wall: R - Math.hypot(S.x - b.x, S.z - b.z), toC: Math.atan2(b.x - S.x, b.z - S.z) });
  return F;
}

/* ⑤ 훈련 3일 지플백 — 초록 김 = 가스 머리 · 입가 불티 = 불꽃 머리 · 물통(F 길게 겨눔 → 놓아 던짐)을 불꽃 머리에 · 다른 길: 조끼 속 뱀장어로 우리까지 몰기 */
function* zipple(G, C) {
  const P = G.player, pl = G.place, c = pl.anchors.center || { x: 0, z: 0 };
  const Z = G.dragon('zippleback', { x: c.x, z: c.z + 6, yaw: Math.PI }, { mind: { fear: 0.2, anger: 0.4 }, noCollide: true }); Z.solid = true; Z.radius = 1.8; Z.mind.lock = 'watch'; C.Z = Z;
  const cage = (pl.lists.cages || [])[0] || { x: c.x, z: c.z + 20, open() {} }; cage.open && cage.open(1); C.cage = cage;
  const barrels = pl.lists.barrels && pl.lists.barrels.length ? pl.lists.barrels : [{ x: c.x - 6, y: 0, z: c.z - 4 }];
  const Tw = [G.person('ruffnut', { x: c.x + 5, z: c.z - 6, yaw: -0.3 }), G.person('tuffnut', { x: c.x + 6.5, z: c.z - 5, yaw: -0.6 })];
  const gas = makePuffs(pl.group, 240, 0x9ac87a), steam = makePuffs(pl.group, 80, 0xf0f4f4), sparks = makePuffs(pl.group, 60, 0xffa040);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.6, 0.85, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x2b2118, transparent: true, opacity: 0.6, depthWrite: false })); ring.visible = false; pl.group.add(ring);
  const water = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), toon({ color: 0x7fb0c8 })); water.visible = false; pl.group.add(water);
  C.cleanup = () => { ring.removeFromParent(); ring.geometry.dispose(); water.removeFromParent(); water.geometry.dispose(); cage.open && cage.open(0); };
  yield* sayAll(G, [['gobber', '지플백! 머리 둘 중 하나는 가스, 하나는 불꽃이다!'], ['fishlegs', '은신 11 곱하기 2…!']]);
  let heads = [{ side: -1, spark: true, wet: 0 }, { side: 1, spark: false, wet: 0 }], swapT = 7, boom = 0, knocks = 0, aim = null, throwB = null, held = 'none', gasT = 0, done = false;
  const hasEel = (G.inv.eel || 0) > 0 || true;                   // 4장에서 낚은 뱀장어 · 없어도 조끼 속에 하나(영화)
  while (!done) {
    const dt = yield; gas.step(dt); steam.step(dt); sparks.step(dt);
    /* 머리 자리 — 몸 앞 좌우 · 가끔 바뀜(어느 쪽인지 정해 주지 않음) */
    swapT -= dt; if (swapT <= 0 && !boom) { swapT = 7 + G.rng() * 3; if (G.rng() < 0.6) { heads[0].spark = !heads[0].spark; heads[1].spark = !heads[1].spark; } }
    const hp = heads.map((h) => ({ x: Z.x + Math.cos(Z.yaw) * h.side * 1.4 + Math.sin(Z.yaw) * 2.6, z: Z.z - Math.sin(Z.yaw) * h.side * 1.4 + Math.cos(Z.yaw) * 2.6, y: Z.y + 2.4 }));
    C.heads = heads.map((h, i) => ({ x: +hp[i].x.toFixed(2), z: +hp[i].z.toFixed(2), cue: h.spark ? 'spark' : 'gas', wet: h.wet > 0 }));
    heads.forEach((h, i) => { if (h.wet > 0) h.wet -= dt; if ((G.t * 20 | 0) % 4 === i) { if (h.spark && h.wet <= 0) sparks.burst(hp[i].x, hp[i].y, hp[i].z, 2, 0.6, 0.6); else if (!h.spark) gas.burst(hp[i].x, hp[i].y - 0.3, hp[i].z, 2, 0.8, 0.1); } });
    /* 가스 → 불꽃(펑) — 6초마다 가스 머리가 뿜고 2.5초 뒤 불꽃 머리가 불티(젖었으면 안 붙음) */
    gasT += dt;
    if (gasT > 6) { gasT = 0; const g = hp[heads.findIndex((h) => !h.spark)]; for (let k = 0; k < 6; k++) gas.burst(g.x + (P.W.x - g.x) * k / 6, 1, g.z + (P.W.z - g.z) * k / 6, 10, 1.2, 0.2); C.cloud = { x: P.W.x, z: P.W.z, t: WARN[G.diff] }; }
    if (C.cloud) { C.cloud.t -= dt; if (C.cloud.t <= 0) { const s = heads.find((h) => h.spark); if (s.wet <= 0) { boom = 0.6; sparks.burst(C.cloud.x, 1, C.cloud.z, 40, 5, 4); G.sfx.play('boom'); if (Math.hypot(P.W.x - C.cloud.x, P.W.z - C.cloud.z) < 3 && !(P.W.rollT > 0)) { knocks++; P.lock = true; P.pose = { stumble: 1 }; C.down = 2; G.hud.say('hiccup', '펑! …눈썹 아직 있나?', [], { secs: 1.4 }); } } else steam.burst(C.cloud.x, 1, C.cloud.z, 14, 1, 1); C.cloud = null; } }
    if (boom > 0) boom -= dt;
    if (C.down > 0) { C.down -= dt; if (C.down <= 0) { P.lock = false; P.pose = null; } }
    if (knocks >= 3) { yield* sayAll(G, [['gobber', '히컵, 그을렸구나! 다시.']]); return 'retry'; }
    /* 물통 — 통 옆에서 F 짧게 = 들기 · F 길게 = 겨누기(쉬움 방향키 · 보통 끌기) → 놓으면 던짐 */
    G.useSpots = held === 'none' ? barrels.map((b) => ({ x: b.x, y: 0, z: b.z })) : [];
    if (held === 'none' && P.fTap) { for (const b of barrels) if (G.near(b, 2)) { held = 'bucket'; holdItem(P, 'bucket'); break; } }
    if (held === 'bucket') {
      P.noReach = true;
      if (G.input.on('use') && P.fT > 0.25) {
        const my = P.C.moveYaw(), fx = Math.sin(my), fz = Math.cos(my), rx = -Math.cos(my), rz = Math.sin(my);   // 화면 기준 앞·오른쪽
        if (!aim) aim = { x: P.W.x + fx * 5, z: P.W.z + fz * 5 };
        P.lock = true; P.aiming = true;
        let ar, af;
        if (G.diff === 'easy') { ar = G.input.axis('left', 'right') * 6 * dt; af = G.input.axis('back', 'fwd') * 6 * dt; }
        else { const lk = G.input.look(); ar = lk.x * 0.03; af = -lk.y * 0.03; }
        aim.x += rx * ar + fx * af; aim.z += rz * ar + fz * af;
        ring.visible = true; ring.position.set(aim.x, pl.height(aim.x, aim.z, 0) + 0.05, aim.z);
      } else if (aim) {                                           // 놓음 = 던짐
        P.lock = false; P.aiming = false; ring.visible = false; P.pose = { throw: 1 };
        throwB = { t: 0, sx: P.W.x, sz: P.W.z, tx: aim.x, tz: aim.z }; water.visible = true; aim = null; held = 'none'; holdItem(P, null); P.noReach = false;
      }
    }
    C.aim = aim ? { x: +aim.x.toFixed(2), z: +aim.z.toFixed(2) } : null; C.held = held; C.camYaw = P.C.moveYaw();
    if (throwB) {
      throwB.t += dt / 0.8; const k = Math.min(1, throwB.t);
      water.position.set(throwB.sx + (throwB.tx - throwB.sx) * k, 1.4 + Math.sin(k * Math.PI) * 2.5 + k * 1.0, throwB.sz + (throwB.tz - throwB.sz) * k);
      if (k >= 1) {
        water.visible = false; P.pose = null; steam.burst(throwB.tx, 2.4, throwB.tz, 16, 1.5, 1.5);
        heads.forEach((h, i) => { if (Math.hypot(hp[i].x - throwB.tx, hp[i].z - throwB.tz) < 1.6) { h.wet = 999; if (h.spark) { G.hud.say('fishlegs', '불꽃 머리가 젖었어! 이제 불이 안 붙어!', [], { secs: 1.8 }); } else G.hud.say('twins', '그건 가스 머리잖아! …아니 내가 맞지!', [], { secs: 1.8 }); } });
        throwB = null;
      }
    }
    /* 끝 — 불꽃 머리가 젖으면 지플백이 물러나 우리로 · 다른 길: 뱀장어를 내밀며(F 짧게) 다가가면 우리까지 물러남 */
    const sparkWet = heads.some((h) => h.spark && h.wet > 0);
    if (sparkWet && !C.retreat) { C.retreat = true; Z.mind.lock = 'idle'; Z.goTo(cage.x, cage.z, 2.4, 1.2); G.hud.say('gobber', '불을 못 붙이니 물러나는군!'); }
    if (!C.retreat && hasEel && held === 'none' && P.fTap && G.near(Z, 6) && !G.useSpots.some((s) => G.near(s, 2))) { holdItem(P, 'eel'); Z.mind.event('offer', 'eel'); Z.mind.lock = 'back'; C.eel = true; G.hud.say('hiccup', '뱀장어다~ 들어가.', ['eel'], { secs: 1.4 }); }
    if (C.eel && !C.retreat) { const dx = Z.x - P.W.x, dz = Z.z - P.W.z, d = Math.hypot(dx, dz) || 1; if (d < 6) Z.goTo(Z.x + (cage.x - Z.x) * 0.3, Z.z + (cage.z - Z.z) * 0.3, 2.6, 0.5); if (Math.hypot(Z.x - cage.x, Z.z - cage.z) < 3) C.retreat = true; }
    if (C.retreat && Math.hypot(Z.x - cage.x, Z.z - cage.z) < 3.5) { cage.open && cage.open(0); done = true; }
  }
  holdItem(P, null);
  G.book.note('zippleback', 'weak', '젖은 머리는 불을 못 붙임 · 뱀장어를 싫어함');
  yield* sayAll(G, [['gobber', '히컵이 또 해냈어!'], ['astrid', '…어떻게 한 거지?']]);
  G.records.rank = '히컵 — 가운데';
  G.hud.banner('훈련장 순위판 — 가운데로', 'shield', 3);
  return true;
}
function zipSense(G, C) {
  const Z = C.Z; return { heads: C.heads && Z && G.vis(Z.x, Z.y + 2, Z.z) ? C.heads : null, held: C.held, aim: C.aim, barrels: (G.place.lists.barrels || []).map((b) => ({ x: b.x, z: b.z })), cloud: C.cloud ? { x: C.cloud.x, z: C.cloud.z } : null, z: Z ? { x: +Z.x.toFixed(1), z: +Z.z.toFixed(1) } : null };
}

export const chapter = {
  id: 5, title: '5장 · 꼬리날개', sub: '망루의 밤 → 대장간 → 숨은 호수 → 훈련장',
  steps: [
    { id: '5-1', verb: 'listen', place: 'village', time: 'night', at: 'tower_top', goal: '고버 아저씨 이야기 동안 횃불 지키기', limit: 150,
      hints: { 1: '눈발이 흘러가는 쪽 횃불이 꺼질 거야.', 2: '바람 오는 쪽에 서서 몸으로 막자 · 꺼지면 F.' }, run: tower, sense: towerSense },
    { id: '5-2', verb: 'rhythm', place: 'village', time: 'night', at: 'forge_front', goal: '작업대로', limit: 200,
      hints: { 1: '모서리에 닿는 순간이야.', 2: '모양을 보고 맞춰 누르자 · 마구 누르면 엉켜.' }, run: forge, sense: (G, C) => ({ stage: C.stage, bench: G.bench.sense(), at: G.place.anchors.forge_bench || G.place.anchors.forge_anvil || null }) },
    { id: '5-3', verb: 'approach', place: 'cove', time: 'day', at: 'gap_in', goal: '투슬리스 먹이기', limit: 200,
      hints: { 1: '투슬리스가 뭘 보고 놀랐을까?', 2: '움찔하면 손을 떼고, 눈이 둥글어지면 다시.' }, run: eelTail, sense: eelSense },
    { id: '5-4', verb: 'fly', place: 'cove', time: 'day', goal: '먹는 틈에 꼬리날개 달기', limit: 120,
      hints: { 1: '꼬리 쪽으로 가서 F.', 2: '벽이 다가오면 반대쪽으로 꼬리를 돌리자.' }, run: lift,
      sense: (G, C) => Object.assign({ tail: C.tail || null, bounds: G.place.fly ? G.place.fly.bounds : null }, C.F && C.F.state ? flySense(C.F) : {}) },
    { id: '5-5', verb: 'throw', place: 'arena', time: 'day', goal: '지플백을 우리로', easy: false, limit: 180,
      bookPage: { title: '훈련 3일 — 지플백', draw: 'zippleback', line: '불꽃 머리에 물을 끼얹으면 불이 안 붙는다. 뱀장어를 싫어한다.' },
      hints: { 1: '입가에 불티가 튀는 쪽이 불꽃 머리.', 2: '물통 옆 F → F를 꾹 눌러 겨누고 놓기.' }, run: zipple, sense: zipSense },
  ],
};
