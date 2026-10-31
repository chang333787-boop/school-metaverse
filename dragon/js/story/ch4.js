// 4장 생선과 이름(design §2 · reference #8~10) — ① 훈련 2일 내더 미로[숨기 · 쉬움 X] ② 고기잡이배 노 박자 + 낚시[박자] ③ 칼 내려놓기·생선·이름[다가가 기다리기]
// ④ 게워 낸 반 토막[다가가 · 쉬움 X] ⑤ 모래 그림 → 코가 손바닥에[다가가] · 와! = 코가 손에 닿는 순간 → 콧김 뿜고 휙 가 버림
// 대사는 모두 우리 말로 새로(저작권) · 실제 학생 이름 X(영화 인물만) · 깜짝 놀래기 X(예고 먼저)
import { wait, until, sayAll } from './runner.js?v=16';
import { holdItem, dropItem, sandLines, makePuffs } from './fx.js?v=16';
import * as THREE from 'three';
import { boatSense, boatCam } from './flysense.js?v=16';

const TAU = Math.PI * 2;
const ang = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
const WARN = { easy: 3, normal: 2.5, hard: 2 };            // 공격 예고 초(design §8)

/* 투슬리스 감각(봇이 읽음 · 화면에 보이는 것만) */
export function tlSense(G, T) {
  if (!T || !T.root) return null;
  const vis = G.vis(T.x, T.y + 1.2, T.z), P = G.player.W;
  const toMe = Math.atan2(P.x - T.x, P.z - T.z), facingMe = Math.cos(ang(T.yaw, toMe)) > 0.85;
  return vis ? { x: +T.x.toFixed(2), z: +T.z.toFixed(2), yaw: +T.yaw.toFixed(2), pupil: +T.rig.pupil.toFixed(2), facingMe, crouch: +(T.rig.crouch || 0).toFixed(2), teeth: +(T.rig.teeth || 0).toFixed(2), moving: T.speed > 0.4, d: +Math.hypot(P.x - T.x, P.z - T.z).toFixed(2) } : { seen: false };
}

/* ① 내더 미로 — 나무 칸막이 미로 · 내더 눈길(부채꼴 · 벽에 가림 · 코앞 좁은 사각) 밖으로만 · 들키면 가시 예고 → 피하기 */
const MAZE = [   // 훈련장 가운데 기준(m) — 들어온 문(남 -z) → 나갈 문(북 +z)
  [-14, -10, 6, -10], [10, -10, 14, -10], [-8, -4, 14, -4], [-14, 2, 8, 2], [-8, 8, 14, 8], [-2, -10, -2, -4], [4, 2, 4, 8], [-8, 8, -8, 13], [8, -4, 8, 0],
];
const NADDER_PATH = [[0, -7], [11, -7], [11, 5], [-11, 5], [-11, -1], [0, -1], [0, 11], [11, 11], [-11, 11]];

function* naddermaze(G, C) {
  const P = G.player, pl = G.place, c = pl.anchors.center || { x: 0, z: 0 };
  const segs = MAZE.map(([a, b, d, e]) => [c.x + a, c.z + b, c.x + d, c.z + e]);
  pl.setMaze && pl.setMaze(segs);
  G.collideAdd(segs);
  C.cleanup = () => { pl.setMaze && pl.setMaze([]); G.collideReset(); };
  const exit = { x: c.x, z: c.z + 17 };
  C.exit = exit; C.segs = segs;
  G.putPlayer({ x: c.x, z: c.z - 16, yaw: 0 });
  const N = G.dragon('nadder', { x: c.x, z: c.z - 7, yaw: Math.PI / 2 }, { mind: { fear: 0.2, anger: 0.3 }, noCollide: true });
  N.mind.lock = 'idle'; C.N = N;
  let wp = 1, seenT = 0, hits = 0, spikes = null, astrid = false;
  N.goTo(c.x + NADDER_PATH[1][0], c.z + NADDER_PATH[1][1], 2.2, 0.8);
  yield* sayAll(G, [['gobber', '오늘은 데들리 내더! 날래고 눈이 밝다!'], ['fishlegs', '속도 8, 방어 16…!']]);
  const puffs = makePuffs(pl.group, 60, 0xd9c49a); C.puffs = puffs;
  while (true) {
    const dt = yield;
    puffs.step(dt);
    /* 순찰 */
    if (N.arrived() && !N.mind.warnT) { wp = (wp + 1) % NADDER_PATH.length; N.goTo(c.x + NADDER_PATH[wp][0], c.z + NADDER_PATH[wp][1], 2.2, 0.8); }
    /* 눈길 — 부채꼴 55° · 13m · 벽에 가림 · 코앞 좁은 사각 */
    const dx = P.W.x - N.x, dz = P.W.z - N.z, d = Math.hypot(dx, dz), fa = Math.cos(ang(N.yaw, Math.atan2(dx, dz)));
    const blind = fa > 0.985 && d < 5.5;
    const sees = d < 13 && fa > Math.cos(0.96) && !blind && G.collide.cut(N.x, N.z, P.W.x, P.W.z) >= 1;
    C.sees = sees;
    seenT = sees ? seenT + dt * (P.W.low ? 0.6 : 1) : Math.max(0, seenT - dt * 0.5);
    if (seenT > 0.6 && !N.mind.warnT && !spikes) { N.stay(); N.faceTo(P.W.x, P.W.z); N.mind.windup(WARN[G.diff]); C.aim = { x: P.W.x, z: P.W.z }; G.hud.say('fishlegs', '가시를 세웠어! 쏜다!', [], { secs: 1.6 }); }
    if (N.mind.warnT > 0) { N.faceTo(P.W.x, P.W.z); C.aim = { x: P.W.x, z: P.W.z }; }
    if (N.mind.beh === 'attack' && !spikes) {               // 쏨 — 예고 끝에 본 자리로 · 0.35초 뒤 닿음
      spikes = { t: 0, x: P.W.x, z: P.W.z, cut: G.collide.cut(N.x, N.z, P.W.x, P.W.z) < 1 };
    }
    if (spikes) {
      spikes.t += dt;
      if (spikes.t > 0.35 && !spikes.done) {
        spikes.done = true; puffs.burst(spikes.x, pl.height(spikes.x, spikes.z, 0) + 0.2, spikes.z, 14, 2, 2);
        const hit = !spikes.cut && Math.hypot(P.W.x - spikes.x, P.W.z - spikes.z) < 1.3 && !(P.W.rollT > 0) && G.collide.cut(N.x, N.z, P.W.x, P.W.z) >= 1;
        if (hit) { hits++; G.hud.say('hiccup', hits < 3 ? '아야! …방패라도 들 걸.' : '으아, 끝났다…', [], { secs: 1.6 }); P.pose = { stumble: 1 }; P.lock = true; C.down = 1.2; }
        seenT = 0;
      }
      if (spikes.t > 1.4) { spikes = null; N.free(); N.mind.lock = 'idle'; N.face = null; N.goTo(c.x + NADDER_PATH[wp][0], c.z + NADDER_PATH[wp][1], 2.2, 0.8); }
    }
    if (C.down > 0) { C.down -= dt; if (C.down <= 0) { P.pose = null; P.lock = false; } }
    if (hits >= 3) { yield* sayAll(G, [['gobber', '히컵, 나와! 다시 해 보자.']]); return 'retry'; }
    /* 아스트리드가 위에서 떨어짐(웃긴 사고) — 미로 가운데쯤 */
    if (!astrid && P.W.z > c.z + 1) {
      astrid = true;
      const A = G.person('astrid', { x: P.W.x + 1.2, z: P.W.z + 0.8, yaw: Math.PI }, { noCollide: true });
      A.rigY = 2.6; C.A = A; C.aT = 0;
      G.hud.say('astrid', '비켜!', [], { secs: 1.2 }); G.hud.say('hiccup', '으악! …아, 미안.', [], { secs: 1.6 });
      N.faceTo(P.W.x, P.W.z);
    }
    if (C.A) { C.aT += dt; if (C.A.root) C.A.root.position.y = C.A.y + Math.max(0, 2.6 - C.aT * 6); if (C.aT > 1.6 && !C.aGo) { C.aGo = true; C.A.walkTo(exit.x - 2, exit.z, 3.6); N.face = null; } }
    /* 나감 */
    if (Math.hypot(P.W.x - exit.x, P.W.z - exit.z) < 3) { G.hud.say('gobber', '살아 나왔군! 아스트리드가 먼저지만.'); G.records['4-1'] = { hits }; return true; }
  }
}
function mazeSense(G, C) {
  const N = C.N; if (!N || !G.player.W) return {};
  const vis = N.root && G.vis(N.x, N.y + 1.5, N.z);
  return { exit: C.exit, maze: C.segs, nadder: vis ? { x: +N.x.toFixed(2), z: +N.z.toFixed(2), yaw: +N.yaw.toFixed(2), spines: +(N.rig.spines || (N.mind.warnT > 0 ? 1 : 0)).toFixed(2) } : null, seen: !!C.sees };
}

/* ② 고기잡이배 + 낚시 — 노 박자(팀 F boat.js) → 돌기둥 옆에서 찌 박자에 당기고 · 고기가 도는 반대로 버팀 */
function* fishing(G, C) {
  const P = G.player, pl = G.place;
  C.need = G.diff === 'easy' ? 2 : 3; C.got = 0; C.lost = 0; C.state = 'row';
  /* 배 — boat.js가 있으면 노 박자로 돌기둥까지 · 없으면 바로 낚시 자리 */
  let B = null;
  const mod = yield* awaitP(import('../play/boat.js?v=16').catch(() => null));
  if (mod && mod.createBoat && pl.lists.boatPath) {
    B = mod.createBoat({ path: pl.lists.boatPath, mode: G.diff, rider: { root: P.root, rig: P.rig } });
    pl.group.add(B.root); if (B.foam) pl.group.add(B.foam);
    C.boat = B; P.cam = 'boat'; const BC = { init: false };
    G.camDraw = (a, dt) => { B.draw(a, dt); boatCam(G.camera, B, dt, BC); };
    C.cleanup = () => { P.cam = 'follow'; G.camDraw = null; B.root.removeFromParent(); if (B.foam) B.foam.removeFromParent(); B.dispose && B.dispose(); };
    yield* sayAll(G, [['hiccup', '물고기를 잔뜩 잡아 가자. 배고플 테니까.', ['cod']]]);
    G.hud.goal('노를 박자에 맞춰 돌기둥까지');
    let arrived = false; B.on('arrive', () => { arrived = true; });
    B.on('stroke', (e) => { if (e.kind === 'beat') G.sfx.play('splash'); });
    while (!arrived) { const dt = yield; B.step(dt, G.input, G.t); }
    /* 닿음 — 배 위에서 낚시(배 카메라 그대로 · 낚싯대 방향 = 배 옆) */
    P.W.x = B.state.x; P.W.z = B.state.z; P.W.yaw = B.state.yaw + Math.PI / 2; P.W.y = 0.4;
  } else {
    G.putPlayer(pl.anchors.fishing || pl.anchors.dock || { x: 0, z: 0 });
  }
  /* 낚시 — F 짧게 = 던지기 · 찌가 쏙 가라앉는 박자에 F · 고기가 왼쪽으로 당기면 오른쪽(D) 버티기 */
  C.state = 'cast'; G.hud.goal('물고기 ' + C.need + '마리 잡기');
  const bob = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), new THREE.MeshToonMaterial({ color: 0xc8503a })); bob.visible = false; pl.group.add(bob);
  const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]); const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0x2b2118 })); line.frustumCulled = false; pl.group.add(line); line.visible = false;
  const puffs = makePuffs(pl.group, 80);
  const oldClean = C.cleanup; C.cleanup = () => { bob.removeFromParent(); line.removeFromParent(); bob.geometry.dispose(); lineGeo.dispose(); oldClean && oldClean(); };
  const order = ['cod', 'salmon', 'eel', 'cod', 'salmon'];
  let t = 0, biteAt = 0, nib = [], pull = 0, pullDir = 0, fightT = 0, slack = 0, bx = 0, bz = 0, by = 0;
  const rod = () => { const W = P.W; return { x: W.x + Math.sin(W.yaw) * 0.6, y: W.y + 1.6, z: W.z + Math.cos(W.yaw) * 0.6 }; };
  while (C.got < C.need) {
    const dt = yield; t += dt; puffs.step(dt);
    const r = rod();
    if (C.state === 'cast') {
      if (P.fTap) {                                       // 던짐 — 찌가 앞 6m에
        bx = P.W.x + Math.sin(P.W.yaw) * 6; bz = P.W.z + Math.cos(P.W.yaw) * 6; by = 0.05; bob.visible = line.visible = true;
        C.state = 'wait'; t = 0; biteAt = 2.2 + G.rng() * 3; nib = [biteAt - 1.4 - G.rng() * 0.3, biteAt - 0.7]; puffs.burst(bx, 0.1, bz, 8, 1, 1.5);
      }
    } else if (C.state === 'wait') {
      /* 입질(살짝 까딱) 둘 → 쏙(크게 가라앉음 0.5초) — 쏙 박자에만 걸림 */
      const nibble = nib.some((n) => t > n && t < n + 0.18), sink = t > biteAt && t < biteAt + (G.diff === 'easy' ? 0.8 : 0.5);
      by = sink ? -0.35 : nibble ? -0.08 : 0.04 + Math.sin(t * 3) * 0.02;
      C.bob = sink ? 'sink' : nibble ? 'nibble' : 'float';
      if (P.fTap) {
        if (sink) { C.state = 'fight'; fightT = 0; slack = 0; pullDir = G.rng() < 0.5 ? -1 : 1; pull = 0; C.fish = order[(C.got + C.lost) % order.length]; G.hud.say('hiccup', '걸렸다!', [], { secs: 1 }); }
        else { C.state = 'cast'; bob.visible = line.visible = false; C.lost++; G.hud.say('hiccup', '너무 일렀어… 다 도망갔다.', [], { secs: 1.6 }); }
      }
      if (t > biteAt + 1.4) { C.state = 'cast'; bob.visible = line.visible = false; G.hud.say('hiccup', '놓쳤다… 다시.', [], { secs: 1.4 }); }
    } else if (C.state === 'fight') {
      /* 고기가 한쪽으로 당김(줄이 기움 · 물보라) → 반대 키로 버팀 · 1.4~2초마다 방향을 바꿈 */
      fightT += dt; pull += dt;
      if (pull > 1.4 + ((C.got * 7) % 5) * 0.15) { pull = 0; pullDir = -pullDir; }
      const hold = G.input.axis('left', 'right');               // 오른쪽(D) = +1
      const good = hold === -pullDir;
      slack = good ? Math.max(0, slack - dt * 1.5) : slack + dt * (hold === 0 ? 0.8 : 1.6);
      bx += pullDir * dt * 1.2 * (good ? 0.2 : 1); by = -0.1;
      if ((fightT * 10 | 0) % 3 === 0) puffs.burst(bx, 0.1, bz, 2, 0.8, 1.2);
      C.pull = pullDir;
      if (slack > (G.diff === 'easy' ? 2.2 : 1.3)) { C.state = 'cast'; bob.visible = line.visible = false; C.lost++; G.hud.say('hiccup', '줄이 끊어졌다…', [], { secs: 1.4 }); }
      else if (fightT > (G.diff === 'easy' ? 3 : 4.2)) {
        C.got++; C.state = 'cast'; bob.visible = line.visible = false; puffs.burst(bx, 0.3, bz, 18, 2, 3); G.sfx.play('splash');
        const f = C.fish; G.inv[f] = (G.inv[f] || 0) + 1;
        G.hud.say('hiccup', f === 'eel' ? '뱀장어다… 이건 별로겠지?' : f === 'salmon' ? '연어! 통통하다.' : '대구 한 마리!', [f], { secs: 1.6 });
        G.hud.goal('물고기 ' + C.need + '마리 잡기 (' + C.got + ')');
      }
    }
    bob.position.set(bx, by, bz);
    const lp = lineGeo.attributes.position; lp.setXYZ(0, r.x, r.y, r.z); lp.setXYZ(1, bx, by + 0.1, bz); lp.needsUpdate = true;
  }
  G.inv.fishCaught = C.got;
  yield* sayAll(G, [['hiccup', '이만하면 됐어. 코브로 가자.', ['cod', 'salmon']]]);
  return true;
}
/* 생성기 안에서 약속 기다리기 */
function* awaitP(p) { let v, done = false; p.then((x) => { v = x; done = true; }, () => { done = true; }); while (!done) yield; return v; }

/* ③ 칼 내려놓기 · 생선 · 이름 — 칼을 든 채 투슬리스가 나를 볼 때 F 짧게 → 생선 내밀기 → 움직이지 않고 기다림 → 잇몸으로 받고 이빨이 쏙 */
function* nameIt(G, C) {
  const P = G.player, pl = G.place;
  const fish = G.inv.fishCaught ?? 2;
  const T = G.castBy.tl || G.dragon('nightfury', 'rest_rock', { keep: 'tl', mind: { fear: 0.62, trust: 0, hunger: 0.75, curious: 0.25 + fish * 0.05 } });
  yield* until(() => T.root);
  holdItem(P, 'knife'); G.useSpots = [];
  C.T = T; C.stage = 'knife';
  yield* sayAll(G, [['hiccup', '…또 왔어. 이번엔 먹을 것도 있어.', ['cod']]]);
  let offerT = 0;
  while (true) {
    const dt = yield;
    const d = G.dist(P.W, T), M = T.mind;
    G.useSpots = [{ x: T.x, y: T.y, z: T.z }];
    if (G.diff === 'easy') G.hud.mood(T.rig.pupil);
    if (P.mash && d < 14 && !C.startled) {                    /* 연타 = 놀라 물러남(기다림이 핵심) */
      C.startled = 2; M.event('loud'); M.lock = null; if (C.stage === 'come') C.stage = 'fish'; P.pose = null;
      G.hud.say('hiccup', '앗, 너무 서둘렀다… 놀랐나 봐.', [], { secs: 1.6 });
    }
    if (C.startled > 0) { C.startled -= dt; if (C.startled <= 0) C.startled = 0; continue; }
    if (C.stage === 'knife' && P.fTap) {
      if (M.sees) {
        C.stage = 'fish'; holdItem(P, 'cod'); C.knife = dropItem(pl.group, 'knife', P.W.x + Math.sin(P.W.yaw + 1.2) * 0.6, P.W.y, P.W.z + Math.cos(P.W.yaw + 1.2) * 0.6, P.W.yaw);
        M.event('drop'); G.hud.say('hiccup', '봐, 칼 없어. 괜찮아.', [], { secs: 1.8 }); G.book.note('nightfury', 'hates', '칼(내려놓으니 누그러짐)');
      } else G.hud.say('hiccup', '…지금은 날 안 보고 있네.', [], { secs: 1.4 });
    } else if (C.stage === 'fish' && P.fTap && d < 6.5) {
      offerT = 3; P.pose = { reach: 1 }; M.event('offer', 'cod');
      if (M.fear < 0.5) { M.lock = 'come'; C.stage = 'come'; } else G.hud.say('hiccup', '아직은 겁내네… 조금 더 천천히.', [], { secs: 1.6 });
    } else if (C.stage === 'fish' && P.fTap && d >= 6.5) { G.hud.say('hiccup', '여기선 너무 멀어.', [], { secs: 1 });
    } else if (C.stage === 'come') {
      P.pose = { reach: 1 };
      if (P.W.speed > 0.5) { M.lock = null; M.fear = Math.min(1, M.fear + 0.25); C.stage = 'fish'; P.pose = null; G.hud.say('hiccup', '앗, 내가 다가가면 안 되는구나.', [], { secs: 1.8 }); }
      else if (d < 2.0) {                                   // 받아먹기 — 잇몸 → 이빨 쏙
        M.lock = 'watch'; T.stay(); T.faceTo(P.W.x, P.W.z); C.stage = 'eat';
        T.pose = { teeth: 0, jaw: 0.6, headUp: -0.2 }; yield* wait(0.8);
        holdItem(P, null); P.pose = null; T.pose = { teeth: 0, jaw: 0.1 }; yield* wait(0.9);
        T.pose = { teeth: 1, jaw: 0.25 }; yield* wait(0.5);
        G.hud.say('hiccup', '이가 쏙… 들어갔다 나왔어? 이 없는… 투슬리스!', [], { secs: 2.6 });
        G.hud.banner('이름이 생겼다 — 투슬리스', 'heart', 3.5); G.sfx.play('ok');
        G.book.note('nightfury', 'likes', '생선(대구·연어)'); G.flags.named = true;
        T.pose = {}; yield* wait(1.2);
        return true;
      }
    }
    if (offerT > 0) { offerT -= dt; if (offerT <= 0 && C.stage === 'fish') P.pose = null; }
  }
}

/* ④ 게워 낸 반 토막 — 투슬리스가 나를 볼 때 F를 꾹(0.35초 넘게) · 눈을 돌리면 놓아야 함(누른 채면 뱉음) */
const tlKeep = (G, at = 'rest_rock', mind) => G.castBy.tl || G.dragon('nightfury', at, { keep: 'tl', mind: mind || { fear: 0.3, trust: 0.4, hunger: 0.4, curious: 0.5 } });
function* halfFish(G, C) {
  const P = G.player, T = tlKeep(G, { x: G.player.W.x + 3, z: G.player.W.z + 3, yaw: 0 }); C.T = T;
  yield* until(() => T && T.root);
  T.mind.lock = 'watch'; T.stay(); T.faceTo(P.W.x, P.W.z);
  T.pose = { jaw: 0.7, headUp: -0.3 }; yield* wait(0.8); T.pose = {};
  holdItem(P, 'half');
  yield* sayAll(G, [['hiccup', '…나 주는 거야? 반 토막을?', ['cod']]]);
  let chew = 0, held = 0, look = true, lookT = 0, spits = 0, need = 2.6;
  C.look = true;
  while (chew < need) {
    const dt = yield;
    /* 눈길 박자 — 2~3.5초 봄 · 1~2초 딴 데(귀가 먼저 돌아감 0.4초) */
    lookT += dt; const per = look ? 2.4 + (spits % 3) * 0.5 : 1.3;
    C.earTurn = look && lookT > per - 0.4;
    if (lookT > per) { look = !look; lookT = 0; T.faceTo(look ? P.W.x : T.x + 5, look ? P.W.z : T.z + 3); }
    T.pose = { ear: C.earTurn ? -0.4 : 0.4 };
    C.look = look;
    if (P.fLong || G.input.on('use')) held += dt; else held = 0;
    P.noReach = true; P.pose = held > 0 ? { reach: 0.6 } : null;
    if (held > 0.35) {
      if (look) chew += dt; else { spits++; chew = Math.max(0, chew - 1); held = -9; G.hud.say('hiccup', '웩! …안 볼 때 뱉어 버렸다.', [], { secs: 1.6 }); }
    }
    if (!G.input.on('use') && held < 0) held = 0;
    C.chew = chew;
  }
  P.noReach = false; P.pose = null; holdItem(P, null);
  T.pose = { teeth: 0, jaw: 0.35 }; G.hud.say('hiccup', '…으, 먹었다. 너도 웃는 거야?', [], { secs: 2.2 });
  yield* wait(1.6); T.pose = {};
  G.book.note('nightfury', 'other', '먹이를 게워 나눠 줌 = 친해지려는 뜻');
  return true;
}

/* ⑤ 모래 그림 — 투슬리스가 그린 선을 밟지 않고 다가가 · F 길게(고개 돌려 손 내밀기) · 기다리면 코가 손바닥에 */
function ringSegs(cx, cz) {
  const segs = [], rings = [[6.4, 0.3], [4.5, 2.6], [2.7, 4.6]];   // 반지름 · 빈틈 각 — 고리 사이 길 ≈ 1.8m · 빈틈 ≈ 1.6m
  for (const [r, gap] of rings) {
    const n = Math.ceil(TAU * r / 0.6);
    for (let i = 0; i < n; i++) {
      const a0 = i / n * TAU, a1 = (i + 1) / n * TAU, m = (a0 + a1) / 2;
      if (Math.abs(ang(m, gap)) * r < 0.8) continue;
      const w0 = r + Math.sin(a0 * 5 + r) * 0.1, w1 = r + Math.sin(a1 * 5 + r) * 0.1;  // 손으로 그린 듯 흔들
      segs.push([cx + Math.cos(a0) * w0, cz + Math.sin(a0) * w0, cx + Math.cos(a1) * w1, cz + Math.sin(a1) * w1]);
    }
  }
  /* 고리 사이를 막는 짧은 가로선(한쪽으로만 돌게 · 빈틈 바로 옆) */
  const spoke = (a, r0, r1) => segs.push([cx + Math.cos(a) * r0, cz + Math.sin(a) * r0, cx + Math.cos(a) * r1, cz + Math.sin(a) * r1]);
  spoke(0.3 + 0.45, 4.6, 6.3); spoke(2.6 + 0.55, 2.8, 4.4);
  return segs;
}
function* sand(G, C) {
  const P = G.player, pl = G.place, T = tlKeep(G), S = pl.anchors.sand || { x: 0, z: 0 }; C.T = T;
  yield* until(() => T && T.root);
  T.mind.lock = 'idle'; T.goTo(S.x, S.z + 6.2, 2.2, 0.5);
  yield* sayAll(G, [['hiccup', '뭘 하려는 거지…?']]);
  yield* until(() => T.arrived(), 8);
  const segs = ringSegs(S.x, S.z); C.segs = segs; C.S = S;
  const L = sandLines(pl.group, pl, segs); C.cleanup = () => L.mesh.removeFromParent();
  /* 그리기 — 투슬리스가 나뭇가지를 물고 고리를 따라 돎(6초) */
  for (let k = 0; k <= segs.length; k++) {
    const sg = segs[Math.min(k, segs.length - 1)]; T.goTo(sg[2], sg[3], 6, 0.3); L.show(k);
    yield* wait(6 / segs.length);
  }
  T.goTo(S.x, S.z, 2, 0.3); yield* until(() => T.arrived(), 4); T.stay(); T.faceTo(S.x + 1, S.z - 6);
  T.pose = { lie: 0, crouch: 0.2 };
  G.hud.goal('투슬리스 가까이 가기');
  let steps = 0, onLine = false, reachT = 0;
  while (true) {
    const dt = yield;
    const hit = L.hit(P.W.x, P.W.z);
    if (hit && !onLine) {
      steps++; T.faceTo(P.W.x, P.W.z); T.pose = { teeth: 1, jaw: 0.4, ear: -1, crouch: 0.7 }; T.mind.fear = Math.min(1, T.mind.fear + 0.15);
      G.hud.say('toothless', '그르르…', [], { secs: 1.2 }); G.sfx.play('growl');
      if (steps >= (G.diff === 'easy' ? 5 : 3)) { yield* sayAll(G, [['hiccup', '…다 망쳤다. 처음부터 다시.']]); L.mesh.removeFromParent(); return 'retry'; }
    }
    if (!hit && onLine) { T.pose = { crouch: 0.2 }; }
    onLine = hit;
    const d = G.dist(P.W, T);
    G.useSpots = d < 3.2 ? [{ x: T.x, y: T.y, z: T.z }] : [];
    if (G.diff === 'easy') G.hud.mood(T.rig.pupil);
    if (P.reach && d < 3.0 && !hit) { reachT += dt; T.faceTo(P.W.x, P.W.z); T.pose = { crouch: 0, headUp: -0.15, sniff: reachT > 0.6 ? 1 : 0 }; }
    else reachT = Math.max(0, reachT - dt * 2);
    C.reachT = reachT; C.steps = steps;
    if (reachT > (G.diff === 'easy' ? 1.8 : 2.6)) {        // 와! 코가 손바닥에
      const hx = P.W.x + Math.sin(P.W.yaw) * 0.9, hz = P.W.z + Math.cos(P.W.yaw) * 0.9;
      T.goTo(hx + (T.x - hx) * 0.05, hz + (T.z - hz) * 0.05, 0.8, 1.5); T.pose = { headUp: -0.25, sniff: 0, teeth: 0 };
      yield* wait(1.4);
      G.hud.banner('코가 손바닥에 닿았다', 'hand', 3.5); G.sfx.play('purr');
      G.book.note('nightfury', 'sign', '동공이 둥글면 마음 놓음');
      yield* wait(1.6);
      const puffs = makePuffs(pl.group, 40, 0xd9c49a); puffs.burst(T.x, T.y + 0.8, T.z, 18, 1.5, 1.5);
      T.pose = { jaw: 0.3 }; G.hud.say('toothless', '흥!', [], { secs: 1 }); yield* wait(0.5);
      T.pose = {}; T.mind.lock = 'idle'; const g = pl.anchors.rest_rock || { x: S.x + 20, z: S.z }; T.goTo(g.x, g.z, 4.5, 1);   // 휙 가 버림
      yield* wait(1.5);
      yield* sayAll(G, [['hiccup', '…닿았어. 진짜로.']]);
      return true;
    }
  }
}

export const chapter = {
  id: 4, title: '4장 · 생선과 이름', sub: '훈련장 → 바다 돌기둥 → 숨은 호수(코브)',
  steps: [
    { id: '4-1', verb: 'hide', place: 'arena', time: 'day', goal: '내더 눈에 띄지 않고 미로 빠져나가기', easy: false, limit: 150,
      bookPage: { title: '훈련 2일 — 데들리 내더', draw: 'nadder', line: '나무벽 미로에서 내더 눈길을 피해 빠져나왔다. 내더는 날래고 눈이 밝다.' },
      hints: { 1: '벽 뒤에 있으면 내더가 못 봐.', 2: '내더 고개가 다른 데로 돌 때 움직이자.' }, run: naddermaze, sense: mazeSense },
    { id: '4-2', verb: 'rhythm', place: 'sea', time: 'clear', at: 'dock', goal: '노를 박자에 맞춰 돌기둥까지', limit: 240,
      hints: { 1: '찌가 쏙 들어갈 때 당겨야 해.', 2: '고기가 당기는 반대쪽 키를 누르자.' }, run: fishing,
      sense: (G, C) => Object.assign({ state: C.state, bob: C.bob || '', pull: C.pull || 0, got: C.got || 0, need: C.need || 0 }, C.state === 'row' && C.boat ? boatSense(C.boat) : {}) },
    { id: '4-3', verb: 'approach', place: 'cove', time: 'day', at: 'gap_in', goal: '투슬리스에게 가까이 가기', limit: 200,
      hints: { 1: '칼을 든 채로는 겁을 내…', 2: '투슬리스가 날 볼 때 칼을 내려놓자(F 짧게).' }, run: nameIt,
      sense: (G, C) => ({ stage: C.stage, tl: tlSense(G, C.T) }) },
    { id: '4-4', verb: 'approach', place: 'cove', time: 'day', atNew: 'sand', goal: '반 토막을 먹어 보이기', easy: false, limit: 90,
      bookPage: { title: '반 토막', draw: 'nightfury', line: '투슬리스가 생선을 게워 반 토막을 나눠 줬다. 친해지려는 뜻이다.' },
      hints: { 1: '투슬리스가 볼 때만 먹는 척.', 2: '눈을 돌리면 F에서 손을 떼자.' }, howtoVerb: 'approach', run: halfFish,
      sense: (G, C) => ({ look: !!C.look, earTurn: !!C.earTurn, chew: +(C.chew || 0).toFixed(2), tl: tlSense(G, C.T) }) },
    { id: '4-5', verb: 'approach', place: 'cove', time: 'day', atNew: 'gap_in', goal: '투슬리스 가까이 가기', limit: 180, botObst: true,
      hints: { 1: '선을 밟으면 화를 내. 틈을 찾아 돌아가자.', 2: '가까이 가면 고개를 돌리고 손을 내밀자(F 길게).' }, run: sand,
      sense: (G, C) => ({ segs: C.segs || null, center: C.S || null, steps: C.steps || 0, reachT: +(C.reachT || 0).toFixed(2), tl: tlSense(G, C.T) }) },
  ],
};
