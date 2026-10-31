// 2장 아빠의 원정 · 숲의 자국(design §2 · reference #4) — 큰 회관 회의(횃불 지키기)[걸으며 듣기] → 안개 숲 추적(손그림 지도 · 단서 · 꼬리날개 조각)[길 찾기]
// → 묶인 나이트 퓨리(숨이 고를 때만 밧줄 끊기 · 찌르는 동작 없음)[다가가 기다리기] → 와! 덮쳐 울부짖고 비틀대며 날아감 → 저녁 집(말이 겹쳐 '싫어요'가 묻힘)
// 대사는 우리 말로 새로(저작권) · "바이킹은 겁나도 간다"는 10장에서 히컵이 되돌려 줌
import * as THREE from 'three';
import { wait, until, sayAll } from './runner.js?v=17';
import { holdItem, dropItem, makePuffs } from './fx.js?v=17';
import { toon } from '../look/kit.js?v=17';
import { tlSense } from './ch4.js?v=17';

/* ① 회의 동안 횃불 지키기 — 꺼져 가는 횃불에 기름(F 짧게) · 끝에 넷 이상 켜져 있으면 · 쉬움 = 탁자 가까이 가서 듣기만 */
const MEETING = [
  ['stoick', '얼음이 얼기 전에, 마지막으로 둥지를 찾으러 간다.', ['ship']],
  ['stoick', '배에 탈 사람?'],
  ['villager', '저는… 생선을 말려야 해서.', ['cod']],
  ['villager', '오늘은 양털 깎는 날인데…'],
  ['stoick', '바이킹은 겁나도 간다.'],
  ['villager', '…가겠습니다!'],
  ['gobber', '그럼 이 녀석은 내가 맡지. 드래곤 훈련이나 시켜.', ['hammer']],
  ['stoick', '…좋아. 내일부터다.'],
];
function* meeting(G, C) {
  const P = G.player, pl = G.place, T = pl.lists.torches || [];
  const tb = pl.anchors.table_main || { x: 0, z: 0 };
  const S = G.person('stoick', { x: tb.x, z: tb.z + 2.2, yaw: Math.PI }, {}), Gb = G.person('gobber', { x: tb.x - 2.4, z: tb.z + 1, yaw: 2.2 }, {});
  const V = [G.person('villager1', { x: tb.x + 2.2, z: tb.z - 1.6, yaw: -0.6 }), G.person('villager2', { x: tb.x - 1.8, z: tb.z - 2.0, yaw: 0.5 }), G.person('villager3', { x: tb.x + 2.8, z: tb.z + 1.2, yaw: -2 })];
  S.pose = { talk: 1 };
  C.torches = T; const life = T.map(() => 1), dying = T.map(() => false);
  for (const t of T) t.set && t.set(1);
  holdItem(P, G.diff === 'easy' ? null : 'oil');
  C.lit = T.length;
  G.useSpots = [];
  const easy = G.diff === 'easy';
  if (easy) { G.hud.goal('회의를 들으러 탁자 가까이'); yield* until(() => G.dist(P.W, tb) < 7); }
  let li = 0, next = 0, killT = easy ? 1e9 : 1.5, kk = 0;
  while (li < MEETING.length || G.hud.busy()) {
    const dt = yield;
    /* 말 — 가까이 있어야 들림(쉬움) · 보통은 어디서나 들림 */
    if (!G.hud.busy() && li < MEETING.length && (!easy || G.dist(P.W, tb) < 9)) { const m = MEETING[li++]; G.hud.say(m[0], m[1], m[2] || []); S.pose = { talk: m[0] === 'stoick' ? 1 : 0, point: li === 5 ? 1 : 0 }; }
    /* 횃불이 하나씩 꺼져 감(12초) — 한 번에 하나 · 다시 붙이거나 꺼지면 3~5초 뒤 다음 것 · 씨앗 순서 */
    killT -= dt;
    if (killT <= 0 && !dying.some((v) => v)) { let k = (kk++ * 7 + 3) % T.length; for (let q = 0; q < T.length && life[k] <= 0; q++) k = (k + 1) % T.length; dying[k] = true; killT = 1e9; }
    let lit = 0; G.useSpots.length = 0;
    for (let i = 0; i < T.length; i++) {
      if (dying[i]) { life[i] = Math.max(0, life[i] - dt / 10); if (life[i] <= 0) { dying[i] = false; killT = 2 + G.rng(); } }   /* 10초에 꺼짐 · 다음은 2~3초 뒤 → 손을 놓으면 회의 끝(30초) 전에 둘이 꺼짐 */
      T[i].set && T[i].set(life[i]);
      if (life[i] > 0.05) lit++;
      if (dying[i] || life[i] <= 0) G.useSpots.push({ x: T[i].x, y: T[i].y - 1.5, z: T[i].z });
      if (P.fTap && (dying[i] || life[i] <= 0) && Math.hypot(P.W.x - T[i].x, P.W.z - T[i].z) < 2.8) { life[i] = 1; dying[i] = false; killT = 2.5 + G.rng() * 1.5; G.hud.say('hiccup', '기름 조금… 됐다.', [], { secs: 1 }); }
    }
    C.lit = lit; C.life = life;
    if (!easy && lit <= T.length - 2) { G.hud.clearSay(); yield* sayAll(G, [['stoick', '어두워서 얼굴이 안 보이는군. 불부터 켜라!']]); return 'retry'; }
  }
  G.hud.goal('');
  yield* sayAll(G, [['hiccup', '(…훈련? 싫은데. 그보다 숲에 떨어진 그 드래곤!)']]);
  holdItem(P, null);
  return true;
}
function meetSense(G, C) {
  const T = C.torches || [], out = [];
  for (let i = 0; i < T.length; i++) if (G.vis(T[i].x, T[i].y, T[i].z, 60)) out.push({ i, x: +T[i].x.toFixed(1), z: +T[i].z.toFixed(1), level: +(C.life ? C.life[i] : 1).toFixed(2) });
  return { torches: out, lit: C.lit, table: G.place.anchors.table_main || null };
}

/* ② 안개 숲 추적 — 손그림 지도(내 위치 X) · 부러진 나무·파인 땅·그을음 · 찢긴 꼬리날개 조각 줍기 · 떨어진 곳 찾기 */
function* track(G, C) {
  const P = G.player, pl = G.place, A = pl.anchors;
  const sk = pl.mapSketch ? pl.mapSketch() : { bounds: { x0: -60, z0: -60, x1: 60, z1: 60 }, landmarks: [] };
  const crash = A.crash || { x: 0, z: 0 }, fin = A.fin || crash;
  const guess = { x: crash.x + 9, z: crash.z - 7, r: 22 };            // 레이븐 포인트 너머 — 히컵의 짐작(딱 맞지 않음)
  G.map.draw(sk, guess, { start: A.spawn ? { x: A.spawn.x, z: A.spawn.z, label: '마을 길' } : null });
  C.cleanup = () => G.map.hide();
  C.clues = pl.lists.clues || []; C.crash = crash; C.fin = fin; C.guess = guess;
  C.finObj = pl.finObj || dropItem(pl.group, 'fin', fin.x, pl.height(fin.x, fin.z, 0), fin.z, 0.6);
  yield* sayAll(G, [['hiccup', '분명 맞혔어. 지도로 보면… 이쯤인데.', ['map']]]);
  C.got = false;
  while (true) {
    yield;
    G.useSpots = C.got ? [] : [{ x: fin.x, y: pl.height(fin.x, fin.z, 0), z: fin.z }];
    if (!C.got && P.fTap && G.near(fin, 2.2)) { C.got = true; C.finObj.removeFromParent(); G.inv.finPiece = 1; G.hud.banner('찢긴 꼬리날개 조각을 주웠다', 'fin', 3); G.hud.say('hiccup', '볼라 끈에 찢긴 거야. 가까이 있어.', ['fin']); }
    if (G.near(crash, C.got ? 9 : 6)) {
      if (!C.got) { if (!C.warned) { C.warned = true; G.hud.say('hiccup', '저기다… 아까 뭔가 떨어져 있었는데.', ['fin']); } }
      else { G.map.hide(); return true; }
    }
  }
}
function trackSense(G, C) {
  const vis = [];
  for (let i = 0; i < (C.clues || []).length; i++) { const c = C.clues[i]; if (G.near(c, 28) && G.vis(c.x, 0.5 + G.place.height(c.x, c.z, 0), c.z, 30)) vis.push({ i, kind: c.kind, x: +c.x.toFixed(1), z: +c.z.toFixed(1) }); }
  const f = C.fin, cr = C.crash;
  const H = (q) => G.place.height(q.x, q.z, G.player.W.y);
  return { clues: vis, fin: f && !C.got && G.near(f, 25) && G.vis(f.x, H(f) + 0.3, f.z, 26) ? { x: f.x, z: f.z } : null, got: !!C.got,
    crash: cr && G.near(cr, 30) && G.vis(cr.x, H(cr) + 1, cr.z, 32) ? { x: cr.x, z: cr.z } : null, guess: C.guess, stuck: false };
}

/* ③ 묶인 나이트 퓨리 — 밧줄 넷을 하나씩 · 숨이 고를 때(동공 둥긂)만 끊김 · 버둥일 때 끊으면 한 줄이 되감김(쉬움 = 안 끊길 뿐) */
const ROPES = [[1.3, 2.1], [-1.7, 0.3], [1.7, -0.6], [-0.5, -3.1]];   // 투슬리스 몸 기준(옆 x · 앞 z)
function* tied(G, C) {
  const P = G.player, pl = G.place, cr = pl.anchors.crash || { x: 0, z: 0, yaw: 0 };
  const T = G.dragon('nightfury', cr, { mind: { fear: 0.8, anger: 0.4 }, noCollide: true }); C.T = T; T.solid = true;
  if (G.dist(P.W, cr) > 16) G.putPlayer(pl.anchors.crash_in || { x: cr.x - Math.sin(cr.yaw || 0) * 9, z: cr.z - Math.cos(cr.yaw || 0) * 9, yaw: cr.yaw || 0 });   // 이 차례부터 바로 시작했을 때만(숲 추적에서 이어지면 그 자리)
  T.mind.lock = 'tied'; T.stay();
  yield* until(() => T.root);
  holdItem(P, 'knife');
  const cy = Math.cos(cr.yaw || 0), sy = Math.sin(cr.yaw || 0);
  const pegs = ROPES.map(([x, z]) => { const wx = cr.x + x * cy + z * sy, wz = cr.z - x * sy + z * cy; return { x: wx + (x > 0 ? 0.9 : -0.9) * cy, z: wz - (x > 0 ? 0.9 : -0.9) * sy, bx: wx, bz: wz, cut: false }; });
  /* 밧줄 — 몸에서 땅 말뚝까지 굽은 관 */
  const ropeMat = toon({ color: 0xb08a5a });
  for (const p of pegs) {
    const y0 = pl.height(p.x, p.z, 0), y1 = pl.height(p.bx, p.bz, 0) + 0.9;
    const cu = new THREE.QuadraticBezierCurve3(new THREE.Vector3(p.bx, y1, p.bz), new THREE.Vector3((p.x + p.bx) / 2, y1 + 0.2, (p.z + p.bz) / 2), new THREE.Vector3(p.x, y0 + 0.1, p.z));
    p.mesh = new THREE.Mesh(new THREE.TubeGeometry(cu, 10, 0.045, 5), ropeMat); pl.group.add(p.mesh);
    p.peg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.5, 6), toon({ color: 0x6a4a2e })); p.peg.position.set(p.x, y0 + 0.2, p.z); pl.group.add(p.peg);
  }
  C.pegs = pegs;
  C.cleanup = () => { for (const p of pegs) { p.mesh.removeFromParent(); p.mesh.geometry.dispose(); p.peg.removeFromParent(); p.peg.geometry.dispose(); } };
  /* 숨 박자: 버둥(2~4초) ↔ 숨 고름(보통 1.6~2.6초 · 쉬움 3초) — 뛰어오면 바로 버둥 */
  let phase = 'struggle', pt = 0, plen = 2.5, said = 0, n = 0;
  const easy = G.diff === 'easy';
  while (true) {
    const dt = yield;
    pt += dt;
    const d = G.dist(P.W, T);
    if (P.W.speed > 2.5 && d < 7 && phase === 'calm') { phase = 'struggle'; pt = 0; plen = 2 + G.rng(); }
    if (pt > plen) { phase = phase === 'calm' ? 'struggle' : 'calm'; pt = 0; plen = phase === 'calm' ? (easy ? 3 : 1.8 + G.rng()) : 1.5 + G.rng() * 1.3; }
    C.phase = phase;
    T.pose = { lie: 0.55, struggle: phase === 'struggle' ? 1 : 0, pupil: phase === 'calm' ? 0.95 : 0.08, ear: phase === 'calm' ? 0 : -0.8, teeth: phase === 'struggle' ? 0.6 : 0, jaw: phase === 'struggle' ? 0.25 + Math.sin(G.t * 9) * 0.1 : 0, fold: 1 };
    if (said === 0 && d < 4.5) { said = 1; G.hud.say('hiccup', '할 수 있어…', [], { secs: 1.4 }); G.hud.say('hiccup', '해야 돼…', [], { secs: 1.4 }); G.hud.say('hiccup', '…해야… 돼…', [], { secs: 1.6 }); }
    G.useSpots = pegs.filter((p) => !p.cut).map((p) => ({ x: p.x, y: pl.height(p.x, p.z, 0), z: p.z }));
    if (P.fTap) {
      let best = null, bd = 1.8; for (const p of pegs) { if (p.cut) continue; const q = Math.hypot(P.W.x - p.x, P.W.z - p.z); if (q < bd) { bd = q; best = p; } }
      if (best) {
        if (phase === 'calm') { best.cut = true; best.mesh.visible = false; n++; G.sfx.play('pluck'); G.hud.say('hiccup', ['하나.', '둘…', '셋…', '마지막…'][n - 1], [], { secs: 1 }); }
        else if (!easy) { const back = pegs.filter((p) => p.cut).pop(); if (back) { back.cut = false; back.mesh.visible = true; n--; } G.hud.say('hiccup', '으앗, 버둥대서 또 감겼다!', ['rope'], { secs: 1.6 }); }
        else G.hud.say('hiccup', '지금은 버둥대… 숨이 고를 때.', [], { secs: 1.6 });
      }
    }
    if (n >= pegs.length) break;
  }
  /* 와! — 일어나(예고 2초 · 소리 낮게) → 덮쳐 울부짖음 → 비틀대며 날아감 → 기절(화면 어둡게) · 쉬움 = 휙 날아가 버림만 */
  P.lock = true; holdItem(P, null);
  T.pose = { lie: 0, crouch: 0.9, pupil: 0.1, teeth: 1, ear: -1 }; T.faceTo(P.W.x, P.W.z);
  if (!easy) {
    yield* wait(2);
    T.pose = { pounce: 1, jaw: 1, teeth: 1, pupil: 0.05 }; T.goTo(P.W.x + (T.x - P.W.x) * 0.25, P.W.z + (T.z - P.W.z) * 0.25, 9, 0.3);
    P.pose = { cower: 1 }; G.hud.say('toothless', '크아아아…!', [], { secs: 1.6 }); G.sfx.play('roar');
    yield* wait(1.8);
  }
  T.pose = { flapRate: 1, fold: 0, crouch: 0.2 }; T.face = null; T.goTo(T.x - Math.sin(cr.yaw || 0) * 40, T.z - Math.cos(cr.yaw || 0) * 40, 7, 1);
  const puffs = makePuffs(pl.group, 40, 0xb0a890); puffs.burst(T.x, T.y + 0.5, T.z, 24, 3, 2); G.sfx.play('flap');
  for (let k = 0; k < 90; k++) { const dt = yield; puffs.step(dt); if (T.root) T.rigY = Math.min(4, (T.rigY || 0) + dt * (2 + Math.sin(G.t * 7) * 2)); }
  T.show(false);
  if (!easy) { G.hud.veil.show('', ''); yield* wait(1.4); G.hud.veil.hide(); }
  P.lock = false; P.pose = null;
  yield* sayAll(G, [['hiccup', '…왜 날 안 죽였지?']]);
  return true;
}
function tiedSense(G, C) {
  const pegs = (C.pegs || []).filter((p) => !p.cut && G.vis(p.x, G.place.height(p.x, p.z, G.player.W.y) + 0.3, p.z, 30)).map((p) => ({ x: +p.x.toFixed(2), z: +p.z.toFixed(2) }));
  return { pegs, left: (C.pegs || []).filter((p) => !p.cut).length, tl: tlSense(G, C.T) };
}

/* 저녁 집(이음) — 둘의 말이 겹쳐 '싫어요'가 묻힘 */
function* home(G, C) {
  const P = G.player, pl = G.place, h = pl.anchors.house_hiccup || { x: 0, z: 0, yaw: 0 };
  const S = G.person('stoick', { x: h.x + Math.sin(h.yaw || 0) * 3, z: h.z + Math.cos(h.yaw || 0) * 3, yaw: (h.yaw || 0) + Math.PI });
  S.faceTo(P.W.x, P.W.z); S.pose = { talk: 1 };
  G.hud.goal('');
  yield* sayAll(G, [
    ['hiccup', '아빠, 드릴 말씀이—'], ['stoick', '히컵, 나도 할 말이—'],
    ['hiccup', '저 드래곤이랑 못 싸우겠…'], ['stoick', '너 드래곤 훈련 받게 됐다!'],
    ['hiccup', '…싫어요.', [], { secs: 1.2 }], ['stoick', '잘됐지? 내일 아침이다. 다녀오마.', ['ship']],
  ]);
  G.hud.banner('주머니에 꼬리날개 조각 · 3장: 다시 가 보기', 'fin', 4);
  yield* wait(2.5);
  return true;
}

export const chapter = {
  id: 2, title: '2장 · 아빠의 원정 · 숲의 자국', sub: '큰 회관 → 안개 숲 → 저녁 집',
  steps: [
    { id: '2-1', verb: 'listen', place: 'hall', time: 'overcast', at: 'door', goal: '회의 동안 횃불을 지켜라', limit: 150,
      hints: { 1: '꺼져 가는 횃불이 있어.', 2: '횃불 가까이 가서 F 짧게(기름).' }, run: meeting, sense: meetSense },
    { id: '2-2', verb: 'track', place: 'forest', time: 'fog', at: 'spawn', goal: '떨어진 드래곤을 찾아라', limit: 300,
      hints: { 1: '부러진 나무를 따라가 볼까?', 2: '지도의 큰 바위·개울과 땅을 맞대 보자.' }, run: track, sense: trackSense },
    { id: '2-3', verb: 'approach', howtoVerb: 'cut2', place: 'forest', time: 'fog', goal: '밧줄을 끊어라', limit: 150,
      hints: { 1: '버둥댈 때는 안 돼…', 2: '눈이 둥글어지고 숨이 고를 때 F 짧게.' }, run: tied, sense: tiedSense },
    { id: '2-4', place: 'village', time: 'sunset', at: 'house_hiccup', run: home },
  ],
};
