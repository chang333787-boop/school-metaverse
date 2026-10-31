// 6장 하늘을 나는 법(design §2 · reference #13~16) — ① 안장 바느질 + 꼬리날개 무늬[박자] ② 코브 연습 비행(꼬리 자리)[관문 비행] ③ 발견 셋(드래곤 풀 · 턱 긁기 · 빛 점)[다가가]
// ④ 훈련장 한 판: 그롱클·내더·테러를 발견으로 진정[다가가] ⑤ 스토이크 귀환 — 배 고치며 듣기(이음 + 손일) ⑥ 첫 바다 비행 · 쪽지가 바람에 날아감[관문 비행] ⑦ 돌기둥 점심 · 다친 테러 치유[다가가]
// 와! = 쪽지 없이 돌기둥 사이를 빠져나가는 순간 · 변화 = 하늘 지도 · 순위판 1등 · 책 '책이 다 틀렸다' 쪽
import * as THREE from 'three';
import { wait, until, sayAll } from './runner.js?v=14';
import { holdItem, dropItem, makePuffs } from './fx.js?v=14';
import { toon } from '../look/kit.js?v=14';
import { tlSense } from './ch4.js?v=14';

const WARN = { easy: 3, normal: 2.5, hard: 2 };
function* awaitP(p) { let v, done = false; p.then((x) => { v = x; done = true; }, () => { done = true; }); while (!done) yield; return v; }

/* ① 안장 + 무늬 — 바느질 박자 → 모은 물감으로 꼬리날개에 무늬(이 무늬가 비행 내내 보임) */
function* saddle(G, C) {
  const P = G.player, A = G.place.anchors, b = A.forge_bench || A.forge_anvil || { x: 0, z: 0 };
  G.useSpots = [{ x: b.x, y: 0, z: b.z }]; G.hud.goal('작업대로');
  yield* until(() => P.fTap && G.near(b, 2.6));
  G.useSpots = []; P.lock = true; C.stage = 'stitch'; G.hud.goal('안장 만들기');
  yield* G.bench.stitch(G.input, G.diff === 'easy', G.diff === 'easy' ? 5 : 7);
  C.stage = 'paint'; G.hud.goal('꼬리날개에 무늬 그리기'); G.hud.howto('draw', 6);
  G.hud.say('hiccup', '코브 열매랑 숯으로 물감을 만들었어.', ['finNew']);
  const r = yield* G.bench.paint(G.input, [{ c: '#2b2118', n: '숯' }, { c: '#a8402e', n: '열매' }, { c: '#d8b46a', n: '흙' }], G.diff === 'easy' ? 5 : 7);
  G.finArt = r.canvas; G.bench.hide(); P.lock = false; C.stage = 'done';
  G.hud.banner('안장 · 내가 그린 꼬리날개 무늬', 'saddle', 3.5);
  return true;
}

/* 비행 한 판(②·⑥이 같이 씀) — flight.js(팀 F)로 · gates를 차례로 지나면 끝 · 떨어지면 다시 붙기 */
function* flyCourse(G, C, o) {
  const P = G.player, pl = G.place, T = o.T;
  const mod = yield* awaitP(import('../play/flight.js?v=14').catch(() => null));
  if (!mod || !mod.createFlight) { G.hud.say('hiccup', '(비행 엔진 준비 중)', [], { secs: 1 }); yield* wait(1); return 'skip'; }
  const F = mod.createFlight({ world: o.world, mode: G.diff, dragon: { root: T.root, rig: T.rig }, rider: { root: P.root, rig: P.rig } });
  F.setOpts && F.setOpts(o.opts || {}); F.setGates && F.setGates(o.gates);
  const cam = mod.createFlightCam ? mod.createFlightCam(G.camera) : null;
  let ev = { gate: 0, crash: 0, graze: 0, fall: 0 };
  F.on && ['gate', 'crash', 'graze', 'fall', 'regrab', 'splash'].forEach((k) => F.on(k, () => { ev[k] = (ev[k] || 0) + 1; }));
  if (o.start) F.state && Object.assign(F.state, o.start);
  T.manual = true; P.cam = 'fly';
  G.camDraw = (a, dt) => { F.draw(a, dt); if (cam) (cam.draw || cam.update).call(cam, a, dt, F); };
  const prevClean = C.cleanup; C.cleanup = () => { T.manual = false; P.cam = 'follow'; G.camDraw = null; F.dispose && F.dispose(); prevClean && prevClean(); };
  C.F = F; C.ev = ev;
  let t = 0;
  while ((F.state && F.state.gates != null ? F.state.gates : ev.gate) < o.gates.length) {
    const dt = yield; t += dt; F.step(dt, G.input);
    if (o.tick) o.tick(dt, F, ev, t);
    if (o.maxT && t > o.maxT) break;
  }
  T.manual = false; P.cam = 'follow'; G.camDraw = null;
  return { t, ev };
}
function flySense(G, C) { const F = C.F; if (!F) return {}; return { fly: F.sense ? F.sense() : null, gates: C.gatesLeft || null }; }

/* ② 코브 연습 비행 — 바위 틈 셋을 꼬리 자리로 · 끝에 드래곤 풀 덤불로 고꾸라짐(발견 1의 계기) */
function* practice(G, C) {
  const P = G.player, pl = G.place, A = pl.anchors, f = pl.fly || {};
  const T = G.castBy.tl || G.dragon('nightfury', A.sand || A.floor || { x: 0, z: 0 }, { keep: 'tl', mind: { fear: 0.15, trust: 0.7 } }); C.T = T; T.solid = true;
  yield* until(() => T.root);
  T.mind.lock = 'idle'; T.stay();
  G.hud.goal('투슬리스에 올라타기'); G.useSpots = [{ x: T.x, y: 0, z: T.z }];
  yield* until(() => P.fTap && G.near(T, 3.2));
  G.useSpots = []; G.hud.goal('바위 틈 셋 지나기');
  const b = f.bounds || { x: T.x, z: T.z, r: 30 }, R = (b.r || Math.min(b.rx || 30, b.rz || 30)) * 0.55, y = (f.ground ? f.ground(b.x, b.z) : 0) + 9;
  const gates = [0, 1, 2].map((i) => { const a = i * 2.1 + 0.4; return { x: b.x + Math.cos(a) * R, y, z: b.z + Math.sin(a) * R, r: 6, tail: [2, 3, 1][i] }; });
  C.gatesLeft = gates;
  const r = yield* flyCourse(G, C, { T, world: f, gates, opts: { assist: true, ceil: f.ceil } });
  if (r === 'skip') return true;
  T.place((A.nip || A.sand || T).x, (A.nip || A.sand || T).z); G.putPlayer({ x: T.x + 3, z: T.z + 2 });
  yield* sayAll(G, [['hiccup', '으아— 쿵! …풀숲에 처박혔다.']]);
  return true;
}

/* ③ 발견 셋 — 드래곤 풀(뜯어 내밀기) · 턱 밑 긁기(마음 놓였을 때 턱 아래에서 F 길게) · 빛 점(방패에 해를 비춰 F 길게 → 점을 움직이면 쫓아감) */
function* discover(G, C) {
  const P = G.player, pl = G.place, A = pl.anchors;
  const T = G.castBy.tl || G.dragon('nightfury', A.nip || A.sand || { x: 0, z: 0 }, { keep: 'tl', mind: { fear: 0.15, trust: 0.7 } }); C.T = T; T.solid = true;
  yield* until(() => T.root);
  T.mind.lock = null; T.free();
  const nip = A.nip || { x: T.x + 4, z: T.z };
  const found = { nip: false, chin: false, light: false }; C.found = found;
  G.hud.goal('투슬리스가 좋아하는 것 셋 찾기');
  const spot = new THREE.Mesh(new THREE.CircleGeometry(0.35, 16).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xfff4c0, transparent: true, opacity: 0.8, depthWrite: false })); spot.visible = false; pl.group.add(spot);
  C.cleanup = () => { spot.removeFromParent(); spot.geometry.dispose(); };
  let item = null, light = null;
  while (!(found.nip && found.chin && found.light)) {
    const dt = yield;
    const M = T.mind, d = G.dist(P.W, T);
    G.useSpots = [!found.nip && !item ? { x: nip.x, y: 0, z: nip.z } : null, d < 3.5 ? { x: T.x, y: 0, z: T.z } : null].filter(Boolean);
    /* 풀 뜯기 → 내밀기 */
    if (!found.nip && !item && P.fTap && G.near(nip, 2.2)) { item = 'nip'; holdItem(P, 'nip'); }
    else if (item === 'nip' && P.fTap && d < 3.2) { M.event('nip'); holdItem(P, null); item = null; found.nip = true; G.hud.say('hiccup', '뒹군다! 이 풀이 좋은가 봐.', ['nip']); G.book.note('nightfury', 'likes', '생선 · 드래곤 풀(뒹굶)'); }
    /* 턱 밑 긁기 — 머리 앞 2m · 마음 놓였을 때(동공 둥긂) · F 길게 1.2초 */
    const hx = T.x + Math.sin(T.yaw) * 2.6, hz = T.z + Math.cos(T.yaw) * 2.6;
    C.chin = { x: +hx.toFixed(2), z: +hz.toFixed(2) };
    if (!found.chin && P.reach && Math.hypot(P.W.x - hx, P.W.z - hz) < 1.6 && M.sig.pupil > 0.6) { C.chinT = (C.chinT || 0) + dt; if (C.chinT > 1.2) { M.event('chin'); found.chin = true; G.hud.say('hiccup', '털썩…! 턱 밑이구나.', ['hand']); G.book.note('nightfury', 'sign', '동공이 둥글면 마음 놓음 · 턱 밑을 긁으면 털썩'); } } else C.chinT = 0;
    /* 빛 점 — 방패를 들고(F 길게) 해 쪽을 등지면 땅에 빛 점 · 움직이면 쫓아감 */
    if (found.nip && found.chin && !found.light) {
      if (P.item !== 'shield') holdItem(P, 'shield');
      if (P.fLong) {
        light = light || { x: P.W.x + Math.sin(P.W.yaw) * 4, z: P.W.z + Math.cos(P.W.yaw) * 4, run: 0 };
        light.x = P.W.x + Math.sin(P.W.yaw) * 4; light.z = P.W.z + Math.cos(P.W.yaw) * 4;
        spot.visible = true; spot.position.set(light.x, pl.height(light.x, light.z, 0) + 0.04, light.z);
        T.chase = light; if (M.beh !== 'chase') M.event('light');
        if (Math.hypot(T.x - light.x, T.z - light.z) < 1.5) light.run += dt;
        if (light.run > 2) { found.light = true; spot.visible = false; holdItem(P, null); G.hud.say('hiccup', '빛 점을 쫓아다녀! 고양이 같아.'); G.book.note('nightfury', 'other', '빛 점을 쫓아감 · 드래곤 풀 · 턱 밑'); }
      } else spot.visible = false;
      P.noReach = true;
    }
    C.light = light && spot.visible ? { x: +light.x.toFixed(1), z: +light.z.toFixed(1) } : null;
  }
  P.noReach = false;
  G.hud.banner('발견 셋 — 풀 · 턱 밑 · 빛 점', 'book', 3.5);
  yield* wait(1.5);
  return true;
}
function discSense(G, C) { return { found: C.found, nip: G.place.anchors.nip || null, chin: C.chin || null, light: C.light || null, tl: tlSense(G, C.T) }; }

/* ④ 훈련장 한 판 — 그롱클·내더·테러가 한꺼번에 · 공격 뒤 틈에 풀·턱 긁기·빛 점(어느 것을 어디에 쓸지 내가 고름) · 다 진정시키면 관중석이 일어섬 */
function* trio(G, C) {
  const P = G.player, pl = G.place, c = pl.anchors.center || { x: 0, z: 0 };
  G.putPlayer({ x: c.x, z: c.z - 12, yaw: 0 });
  const D = [G.dragon('gronckle', { x: c.x - 8, z: c.z + 6, yaw: 2.6 }, { mind: { fear: 0.2, anger: 0.55 }, noCollide: true }), G.dragon('nadder', { x: c.x + 8, z: c.z + 5, yaw: -2.4 }, { mind: { fear: 0.2, anger: 0.55 }, noCollide: true }), G.dragon('terror', { x: c.x, z: c.z + 10, yaw: Math.PI }, { mind: { fear: 0.4, anger: 0.3 }, noCollide: true })];
  D.forEach((d) => { d.solid = true; d.radius = d.kind === 'terror' ? 0.4 : 1.5; d.mind.lock = 'watch'; d.calm = false; d.next = 2 + D.indexOf(d) * 1.6; });
  C.D = D;
  const As = G.person('astrid', (pl.lists.crowd || [])[3] || { x: c.x + 18, z: c.z, yaw: -1.6 }, { noCollide: true });
  const puffs = makePuffs(pl.group, 80, 0xd9c49a);
  holdItem(P, 'nip'); C.item = 'nip';
  yield* sayAll(G, [['gobber', '오늘은 셋 한꺼번에다!'], ['hiccup', '(풀 · 턱 밑 · 빛 점… 누구한테 뭘 쓸까?)']]);
  let knocks = 0, ball = null;
  const items = ['nip', 'shield', 'cod'];                 // 들 것 셋 — 드래곤에서 떨어져 F 짧게 = 바꾸기 · 가까이(틈 안) F = 쓰기 · 내더 턱 밑 = F 길게
  while (!D.every((d) => d.calm)) {
    const dt = yield; puffs.step(dt);
    for (const d of D) {
      if (d.calm) continue;
      const M = d.mind; d.faceTo(P.W.x, P.W.z);
      d.next -= dt;
      if (d.next <= 0 && M.warnT <= 0 && M.beh !== 'attack' && !M.inGap()) { M.windup(WARN[G.diff]); d.next = 4 + G.rng() * 2.5; }
      if (M.beh === 'attack' && !d.shot) { d.shot = { t: 0, x: P.W.x, z: P.W.z }; }
      if (d.shot) { d.shot.t += dt; if (d.shot.t > 0.5) { puffs.burst(d.shot.x, 0.3, d.shot.z, 12, 2, 2); if (Math.hypot(P.W.x - d.shot.x, P.W.z - d.shot.z) < 1.5 && !(P.W.rollT > 0)) { knocks++; P.lock = true; P.pose = { stumble: 1 }; C.down = G.diff === 'easy' ? 0.6 : 2; } d.shot = null; } }
      /* 진정 — 틈 안에서 맞는 것 · 그롱클 = 풀 · 내더 = 턱 밑(F 길게) · 테러 = 생선(또는 빛 점) */
      const near = G.dist(P.W, d) < (d.kind === 'terror' ? 2 : 3.2), gap = M.inGap() || G.diff === 'easy' && M.beh !== 'attack' && M.warnT <= 0;
      if (near && gap) {
        const ok = (d.kind === 'gronckle' && P.fTap && P.item === 'nip') || (d.kind === 'nadder' && P.reach && (C.chinT = (C.chinT || 0) + dt) > 0.8) || (d.kind === 'terror' && P.fTap && P.item === 'cod');
        if (ok) { d.calm = true; M.lock = d.kind === 'gronckle' ? 'roll' : 'flop'; M.event(d.kind === 'gronckle' ? 'nip' : d.kind === 'nadder' ? 'chin' : 'offer', d.kind === 'terror' ? 'cod' : undefined); G.hud.say('fishlegs', d.kind === 'gronckle' ? '그롱클이 뒹굴어!' : d.kind === 'nadder' ? '내더가 털썩!' : '테러가 받아먹었어!', [], { secs: 1.4 }); C.chinT = 0; }
      }
    }
    if (P.fTap && !D.some((d) => !d.calm && G.dist(P.W, d) < 3.4)) { C.ii = ((C.ii ?? 0) + 1) % items.length; holdItem(P, items[C.ii]); G.hud.say('hiccup', { nip: '드래곤 풀', shield: '방패', cod: '생선' }[items[C.ii]], [items[C.ii]], { secs: 0.8 }); }   // 드래곤에서 떨어져 F = 들 것 바꾸기
    C.item = P.item;
    if (C.down > 0) { C.down -= dt; if (C.down <= 0) { P.lock = false; P.pose = null; } }
    if (knocks >= 4) { yield* sayAll(G, [['gobber', '숨 돌리고 다시!']]); return 'retry'; }
  }
  holdItem(P, null);
  yield* sayAll(G, [['gobber', '셋 다?! 다치게 하지도 않고!'], ['villager', '히컵! 히컵!']]);
  As.pose = { point: 0 };
  G.records.rank = '히컵 — 1등'; G.hud.banner('훈련장 순위판 1등 · 관중석이 일어섰다', 'shield', 4);
  return true;
}
function trioSense(G, C) {
  return { item: C.item, dragons: (C.D || []).map((d) => ({ kind: d.kind, x: +d.x.toFixed(1), z: +d.z.toFixed(1), calm: d.calm, warn: d.mind.warnT > 0, gap: d.mind.inGap(), vis: !!(d.root && G.vis(d.x, d.y + 1, d.z)) })) };
}

/* ⑤ 스토이크 귀환 — 부서진 배를 망치 박자로 고치며 듣기(쉬움 = 걸어가서 듣기만) */
function* homecoming(G, C) {
  const P = G.player, A = G.place.anchors, e = A.dock_end || A.dock_top || { x: 0, z: 0 };
  const S = G.person('stoick', { x: e.x + 1.4, z: e.z + 1, yaw: Math.PI }); S.pose = { talk: 1 };
  G.hud.goal('배 고치는 것 돕기'); G.useSpots = [{ x: e.x, y: 0, z: e.z }];
  yield* until(() => G.near(e, 3.5) && (G.diff === 'easy' || P.fTap));
  G.useSpots = []; S.faceTo(P.W.x, P.W.z);
  G.hud.say('stoick', '둥지는 못 찾았다. 배만 부서졌지.', ['ship']);
  G.hud.say('stoick', '그런데 마을에 소문이 자자하더구나. 네가 훈련장 1등이라고!');
  G.hud.say('hiccup', '(…들키면 안 되는데.)');
  if (G.diff !== 'easy') { P.lock = true; yield* G.bench.hammer(G.input, false, 4, '배 고치기 — 판자가 맞물릴 때(주황·노랑) F'); G.bench.hide(); P.lock = false; }
  else while (G.hud.busy()) yield;
  yield* sayAll(G, [['stoick', '자랑스럽다, 아들. 이제야 바이킹이구나.'], ['hiccup', '…네.']]);
  return true;
}

/* ⑥ 첫 바다 비행 — 화면 아래 꼬리 쪽지 · 중간에 쪽지가 바람에 날아감 → 감으로 · 돌기둥 스치면 가속 · 떨어지면 공중에서 다시 붙기 */
function* seaFlight(G, C) {
  const P = G.player, pl = G.place, A = pl.anchors;
  const T = G.dragon('nightfury', A.lunch || A.spawn_air || { x: 0, z: 0 }, { mind: { fear: 0.1, trust: 0.8 }, noCollide: true }); C.T = T;
  yield* until(() => T.root);
  const gates = (pl.lists.course || []).slice();
  if (!gates.length) return true;
  C.gatesLeft = gates;
  const note = G.note || null;
  G.hud.goal('돌기둥 사이를 빠져나가기');
  const sa = A.spawn_air || { x: gates[0].x, z: gates[0].z - 60, y: 40, yaw: 0 };
  const r = yield* flyCourse(G, C, { T, world: pl.fly, gates, opts: { assist: true, ceil: (pl.fly || {}).ceil, noteGates: true }, start: { x: sa.x, y: sa.y || 40, z: sa.z, yaw: sa.yaw || 0 },
    tick: (dt, F, ev) => { const gi = F.state && F.state.gates != null ? F.state.gates : ev.gate; if (gi === Math.floor(gates.length / 2) && !C.blown) { C.blown = true; G.hud.say('hiccup', '쪽지가…! 날아갔다!', [], { secs: 1.6 }); G.flags.noteGone = true; F.setOpts && F.setOpts({ noteHidden: true }); } } });
  if (r === 'skip') return true;
  G.hud.banner('쪽지 없이 돌기둥 사이를 빠져나왔다 — 하늘 지도가 열렸다', 'map', 4);
  G.records['6-6'] = { t: +(r.t || 0).toFixed(1), grazes: r.ev ? r.ev.graze : 0 };
  return true;
}

/* ⑦ 돌기둥 점심 — 테러가 생선을 낚아챔 → 투슬리스가 그 입 안에 작은 불(다치지 않음) → 책 '입 안은 불에 약함' · 다친 테러: 처진 날개를 보고 천을 감아 줌 */
function* lunch(G, C) {
  const P = G.player, pl = G.place, L = pl.anchors.lunch || { x: 0, z: 0, y: 0 };
  const T = G.dragon('nightfury', { x: L.x + 2, z: L.z + 1, y: L.y, yaw: -2 }, { mind: { fear: 0.1, trust: 0.85 } }); C.T = T; T.mind.lock = 'idle';
  const t1 = G.dragon('terror', { x: L.x - 3, z: L.z + 2.5, y: L.y, yaw: 1 }, { mind: { fear: 0.3, curious: 0.8 } }); t1.mind.lock = 'idle';
  const t2 = G.dragon('terror', { x: L.x - 4.5, z: L.z - 2.5, y: L.y, yaw: 0.6 }, { mind: { fear: 0.85, curious: 0.2 } }); t2.mind.lock = 'idle'; t2.pose = { tailCurl: 1, crouch: 0.7 };
  C.t2 = t2;
  yield* until(() => T.root && t1.root && t2.root);
  holdItem(P, 'cod');
  yield* sayAll(G, [['hiccup', '점심이다. 너 하나, 나 하나…', ['cod']]]);
  t1.goTo(P.W.x + 0.6, P.W.z + 0.4, 3, 0.4); yield* until(() => t1.arrived(), 4);
  holdItem(P, null); t1.goTo(L.x - 2, L.z + 4, 2.5, 0.4); G.hud.say('hiccup', '앗, 내 생선!');
  yield* wait(1.2);
  T.faceTo(t1.x, t1.z); T.pose = { jaw: 0.6 }; yield* wait(0.5);
  const puffs = makePuffs(pl.group, 40, 0x6a6460); puffs.burst(t1.x, t1.y + 0.4, t1.z, 14, 0.8, 1.6); G.sfx.play('pop'); t1.pose = { puff: 1, jaw: 0.5 }; T.pose = {};
  for (let k = 0; k < 40; k++) puffs.step(yield);
  t1.pose = {};
  yield* sayAll(G, [['hiccup', '입 안에 작은 불… 연기 트림만! 다치진 않았네.']]);
  G.book.note('terror', 'weak', '입 안은 불에 약함(투슬리스가 보여 줌)');
  /* 다친 테러 — 겁먹음(꼬리 말림) · 살금살금 · 생선으로 먼저 마음 · 날개가 처진 것을 보고(가까이) 천 감기(F 길게 · 움찔하면 떼기) */
  G.hud.goal('다친 테러 돕기'); holdItem(P, 'cod'); C.stage = 'calm';
  let fed = false, wrapT = 0, flinch = 0;
  while (true) {
    const dt = yield; const d = G.dist(P.W, t2), M = t2.mind;
    if (!fed) {
      if (P.W.speed > 2 && d < 6) { M.fear = Math.min(1, M.fear + dt * 0.8); t2.goTo(t2.x - (P.W.x - t2.x) * 0.3, t2.z - (P.W.z - t2.z) * 0.3, 2, 0.3); }
      if (P.fTap && d < 2.6) { if (M.fear < 0.75 || P.W.low) { fed = true; M.fear = 0.3; holdItem(P, 'cloth'); C.stage = 'wrap'; t2.pose = { crouch: 0.3, tailCurl: 0.3 }; G.hud.say('hiccup', '왼쪽 날개가 처졌구나… 천으로 감아 줄게.', ['cloth']); } else G.hud.say('hiccup', '너무 겁먹었어… 살금살금.', [], { secs: 1.2 }); }
    } else {
      if (flinch > 0) { flinch -= dt; t2.pose = { crouch: 0.8, tailCurl: 0.8 }; if (P.reach && flinch < 0.6) { wrapT = Math.max(0, wrapT - 0.6); G.hud.say('hiccup', '아팠지? 미안.', [], { secs: 0.9 }); flinch = 0; } }
      else if (P.reach && d < 2.2) { wrapT += dt; t2.pose = { crouch: 0.3 }; if (wrapT > 0.9 && wrapT < 0.95 + dt) flinch = 1.1; }
      if (wrapT > 2.4) break;
    }
    C.flinch = flinch > 0; C.fed = fed; C.wrap = +wrapT.toFixed(2);
  }
  holdItem(P, null); t2.pose = {}; t2.mind.fear = 0.1;
  G.hud.banner('치유 — 다친 테러의 날개를 감았다', 'heart', 3.5);
  G.book.note('terror', 'likes', '생선 · 빛 점'); G.book.note('nightfury', 'other', '책이 다 틀렸다 — 보면 처치 X, 보면 관찰!');
  yield* sayAll(G, [['hiccup', '이 책… 다 틀렸어.', ['book']]]);
  return true;
}
function lunchSense(G, C) { const t = C.t2; return { stage: C.stage, terror: t && G.vis(t.x, t.y + 0.3, t.z) ? { x: +t.x.toFixed(2), z: +t.z.toFixed(2), crouch: +(t.rig.crouch || 0).toFixed(2) } : null, flinch: !!C.flinch, fed: !!C.fed, wrap: C.wrap || 0 }; }

export const chapter = {
  id: 6, title: '6장 · 하늘을 나는 법', sub: '대장간 → 숨은 호수 → 훈련장 → 선착장 → 바다 돌기둥',
  steps: [
    { id: '6-1', verb: 'rhythm', place: 'village', time: 'day', at: 'forge_front', goal: '작업대로', limit: 180,
      hints: { 1: '바늘이 구멍 위에 올 때.', 2: 'Space를 바늘 박자에 · 칠할 땐 F를 꾹.' }, run: saddle, sense: (G, C) => ({ stage: C.stage, bench: G.bench.sense(), at: G.place.anchors.forge_bench || G.place.anchors.forge_anvil || null }) },
    { id: '6-2', verb: 'fly', place: 'cove', time: 'day', at: 'gap_in', goal: '투슬리스에 올라타기', limit: 180,
      hints: { 1: '꼬리 자리를 바꾸면 더 날카롭게 돌아.', 2: '틈이 오른쪽이면 3, 왼쪽이면 2.' }, run: practice, sense: (G, C) => Object.assign(flySense(G, C), { tl: tlSense(G, C.T) }) },
    { id: '6-3', verb: 'approach', place: 'cove', time: 'day', goal: '투슬리스가 좋아하는 것 셋 찾기', limit: 200,
      hints: { 1: '푸른 풀 · 턱 밑 · 반짝이는 것…', 2: '풀은 F로 뜯어 내밀기 · 턱 밑은 F 길게 · 방패는 F 길게.' }, run: discover, sense: discSense },
    { id: '6-4', verb: 'approach', place: 'arena', time: 'day', goal: '셋 다 진정시키기', limit: 220,
      hints: { 1: '쏜 뒤 숨 고를 때가 틈이야.', 2: '그롱클 = 풀 · 내더 = 턱 밑(F 길게) · 테러 = 생선 · 빈손 F = 다음 물건.' }, run: trio, sense: trioSense },
    { id: '6-5', place: 'village', time: 'day', at: 'dock_top', run: homecoming, sense: (G) => ({ target: G.place.anchors.dock_end || null, bench: G.bench.sense() }) },
    { id: '6-6', verb: 'fly', place: 'sea', time: 'clear', goal: '돌기둥 사이를 빠져나가기', limit: 240,
      hints: { 1: '쪽지 그림의 꼬리 자리를 보자.', 2: '쪽지가 없어도 틈 쪽으로 몸을 기울이자.' }, run: seaFlight, sense: flySense },
    { id: '6-7', verb: 'approach', place: 'sea', time: 'clear', at: 'lunch', goal: '다친 테러 돕기', limit: 180,
      hints: { 1: '겁먹었어. 살금살금 생선부터.', 2: '움찔하면 손을 떼고 기다렸다가 다시(F 길게).' }, run: lunch, sense: lunchSense },
  ],
};
