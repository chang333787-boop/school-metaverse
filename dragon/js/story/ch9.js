// 9장 마지막 시험(design §2 · reference #21~23) — ① 마을 모두 앞 나이트메어: 칼·투구를 내려놓고(나를 볼 때 F) 살금살금 손 내밀기[다가가]
// ② 아빠가 망치를 듦(예고 2초) → 철창 쾅 → 몸에 불 → 20초 버티기[피하기] ③ 투슬리스가 그물 지붕을 뚫고 와 아빠를 누름 → 둘 사이에서 손 내밀기 3초[다가가 · 누르고만 있기 X]
// ④ 큰 회관: 둥지 쪽을 보여 줌 · 말로는 안 통함 · 말실수 · '이제 넌 우리 편이 아니다'[걸으며 듣기] ⑤ 선착장: 사슬에 묶여 앞배를 이끎 · 아빠가 한 번 돌아봄(이음)
// ⑥ 아스트리드 '왜 안 죽였어?' · 3장 그림 · 훈련장으로(이음) ⑦ 우리 문을 직접 열고 친구 넷을 드래곤과 이어 줌[다가가] → 와! 다섯 드래곤이 솟아오름
// 슬픈 셋(③ 끝 붙잡힘 · ④ · ⑤)은 합쳐 90초 안 · 의절 말은 '이제 넌 우리 편이 아니다'까지만 · 대사는 모두 우리 말로 새로 · 피 X · 깜짝 X(예고 먼저)
import * as THREE from 'three';
import { wait, until, sayAll } from './runner.js?v=18';
import { holdItem, dropItem, makePuffs } from './fx.js?v=18';
import { toon, flameMesh, glowSprite } from '../look/kit.js?v=18';
import { setHelmet, helmetObj, crowd, crowdPose, pz, seatOn, drawCoveSketch, drawNestPage, chainBits } from './fx79.js?v=18';

const WARN = { easy: 3, normal: 2.5, hard: 2 };
const ang = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const NONE = {}, SIT_P = { sit: 1, cower: 1 }, CARRY_P = { carry: 1 }, TALK_P = { talk: 1 }, REACH_P = { reach: 1 }, PET_P = { pet: 1 };   // 자세 그릇(매 걸음 new X)
/* 쉬움 F 표시 그릇 — 매 걸음 같은 배열·같은 점을 다시 씀(new X) */
const SP = [0, 1, 2, 3, 4].map(() => ({ x: 0, y: 0, z: 0 })), SPA = [];
function spot(G, on, x, y, z, add) { if (!add) SPA.length = 0; if (on && SPA.length < SP.length) { const s = SP[SPA.length]; s.x = x; s.y = y; s.z = z; SPA.push(s); } G.useSpots = SPA; }
function* awaitP(p) { let done = false; Promise.resolve(p).then(() => { done = true; }, () => { done = true; }); while (!done) yield; }
/* 손을 내미는 동안 몸을 드래곤 쪽으로(고개는 돌림 = 자세 함수 away) */
function turnTo(P, x, z, dt) { if (!P.reach) return; P.W.yaw += ang(P.W.yaw, Math.atan2(x - P.W.x, z - P.W.z)) * Math.min(1, dt * 8); }
function* timed(sec, fn) { let t = 0; while (t < sec) { const dt = yield; t += dt; fn && fn(Math.min(1, t / sec), dt); } }

/* 훈련장 사람들(①~③ 같은 장소 · keep) — 관중 열 · 아빠(가장자리 맞은편) · 고버 · 아스트리드 */
function cast9(G) {
  const pl = G.place, L = pl.lists.crowd || [], c = pl.anchors.center || { x: 0, z: 0 };
  const fans = crowd(G, 10);
  const St = G.castBy.stoick9 || G.person('stoick', L[10] || { x: 0, z: -25 }, { keep: 'stoick9', noCollide: true });
  const Gb = G.castBy.gobber9 || G.person('gobber', L[19] || { x: 15, z: 20 }, { keep: 'gobber9', noCollide: true });
  const As = G.castBy.astrid9 || G.person('astrid', L[0] || { x: -8, z: 23 }, { keep: 'astrid9', noCollide: true });
  return { fans, St, Gb, As, c, L, cage: (pl.lists.cages || [])[4] };
}
function nightmare(G, at) {
  const N = G.castBy.nm || G.dragon('nightmare', at, { keep: 'nm', mind: { fear: 0.3, anger: 0.75, curious: 0.1 }, noCollide: true });
  N.radius = 2.2; N.solid = true; N.mind.lock = 'watch'; return N;
}
/* 감각 — 화면에 보이는 것만 */
function dSense(G, D, extra) {
  if (!D || !D.root || D.hidden || !G.vis(D.x, D.y + 1.4 + (D.rigY || 0), D.z)) return null;
  const P = G.player.W, toMe = Math.atan2(P.x - D.x, P.z - D.z);
  const o = { x: +D.x.toFixed(2), z: +D.z.toFixed(2), yaw: +D.yaw.toFixed(2), facingMe: Math.cos(ang(D.yaw, toMe)) > 0.8, pupil: +(D.rig.pupil || 0).toFixed(2), moving: D.speed > 0.4, d: +Math.hypot(P.x - D.x, P.z - D.z).toFixed(2) };
  return extra ? Object.assign(o, extra) : o;
}

/* ① 마을 모두 앞 나이트메어 — 칼(든 채 F 짧게 · 나를 볼 때만) → 투구(같음) → 살금살금 → 고개 돌려 손 내밀기 · 서두르면 물러남 · 연타 = 놀람 */
function* lastTest(G, C) {
  const P = G.player, pl = G.place, K = cast9(G), c = K.c, cg = K.cage, easy = G.diff === 'easy';
  yield* until(() => P.root);
  yield* awaitP(setHelmet(G, true));
  holdItem(P, 'knife');
  G.putPlayer({ x: c.x, z: c.z + 14, yaw: Math.PI });
  const N = nightmare(G, { x: cg.door.x * 0.96, z: cg.door.z * 0.96, yaw: cg.yaw }); C.N = N;
  N.mind.anger = 0.75; N.mind.fear = 0.3; N.show(false);
  yield* until(() => N.root && K.St.root);
  const blz = { blaze: 0.6, crouch: 0.2, sniff: 0, headUp: 0 }; N.pose = blz;
  crowdPose(K.fans, 'cheer', 0);
  yield* timed(1.2, (k) => { cg.open(k); if (k > 0.35) N.show(true); });
  N.goTo(c.x + 3, c.z - 1, 2.2, 0.8);
  yield* sayAll(G, [['villager', '히컵! 히컵! 히컵!', [], { name: '마을 사람들', secs: 2 }], ['gobber', '마을 모두가 보고 있다! 시작!', ['shield']], ['hiccup', '(지금이야… 다들 보고 있어.)']]);
  const WP = [[c.x + 6, c.z - 2], [c.x - 6, c.z - 3], [c.x - 5, c.z + 3], [c.x + 5, c.z + 4]];
  let stage = 'knife', wi = 0, pause = 2.5, startle = 0, hurry = 0, reachT = 0, hintCd = 0, gasp = 0;
  const need = { easy: 1.6, normal: 2.4, hard: 3 }[G.diff] || 2.4;
  G.hud.goal('나이트메어 진정시키기'); C.stage = stage;
  while (true) {
    const dt = yield; const M = N.mind, d = G.dist(P.W, N);
    if (startle > 0) startle -= dt; if (hurry > 0) hurry -= dt; if (hintCd > 0) hintCd -= dt; if (gasp > 0) gasp -= dt;
    crowdPose(K.fans, stage === 'knife' ? 'cheer' : 'murmur', G.t);
    /* 몸 불 = 화 · 다가가면 킁킁 */
    blz.blaze = clamp01(M.anger * 1.3 + (startle > 0 || hurry > 0 ? 0.5 : 0)); blz.crouch = clamp01(M.fear * 0.6 + (hurry > 0 ? 0.4 : 0)); blz.sniff = reachT > 0.4 ? 1 : 0; blz.headUp = reachT > 0.4 ? -0.4 : 0;
    /* 서성임 — 걷다가 멈춰 나를 봄(볼 때 내려놓기) · 진정해 가면 멈춰서 봄 */
    const settle = stage === 'approach' && d < 7 && P.W.low;
    if (settle || reachT > 0) { N.stay(); N.faceTo(P.W.x, P.W.z); }
    else if (N.arrived()) { pause -= dt; N.faceTo(P.W.x, P.W.z); if (pause <= 0) { wi = (wi + 1) % WP.length; N.face = null; N.goTo(WP[wi][0], WP[wi][1], 1.6, 0.8); pause = stage === 'approach' ? 4 : 2.6; } }
    /* 연타 = 놀람 */
    if (P.mash && d < 16 && startle <= 0) { startle = 2; M.event('loud'); reachT = 0; G.hud.say('hiccup', '앗, 놀랐어… 차분하게.', [], { secs: 1.4 }); G.sfx.play('growl'); }
    /* 서두름 = 물러남 */
    if (stage === 'approach' && P.W.speed > 2.6 && d < (easy ? 6 : 10) && hurry <= 0) {
      hurry = 2; M.fear = clamp01(M.fear + 0.2); M.anger = clamp01(M.anger + 0.15); reachT = 0;
      N.goTo(N.x + (N.x - P.W.x) / d * 3, N.z + (N.z - P.W.z) / d * 3, 2.4, 0.5); pause = 2;
      G.hud.say('hiccup', '앗, 너무 서둘렀다…', [], { secs: 1.4 }); G.sfx.play('growl');
    }
    /* 내려놓기 — 든 채 F 짧게 · 나를 볼 때만 */
    if (P.fTap && !P.mash && (stage === 'knife' || stage === 'helmet')) {
      if (M.sees && startle <= 0) {
        if (stage === 'knife') {
          holdItem(P, null); C.knife = dropItem(pl.group, 'knife', P.W.x + Math.sin(P.W.yaw + 1.2) * 0.6, P.W.y, P.W.z + Math.cos(P.W.yaw + 1.2) * 0.6, P.W.yaw);
          M.event('drop'); stage = 'helmet'; gasp = 3; G.hud.say('hiccup', '봐, 칼 없어.', ['knife'], { secs: 1.6 }); G.hud.say('villager', '뭐 하는 거야…?', [], { name: '마을 사람들', secs: 1.6 });
        } else {
          yield* awaitP(setHelmet(G, false));
          C.helm = helmetObj(pl.group, P.W.x + Math.sin(P.W.yaw - 1.2) * 0.7, P.W.y, P.W.z + Math.cos(P.W.yaw - 1.2) * 0.7, P.W.yaw);
          M.event('drop'); stage = 'approach'; G.hud.clearSay();
          G.hud.say('hiccup', '얘들은… 우리가 생각한 그런 게 아니에요.'); G.hud.say('stoick', '히컵…?');
        }
      } else if (hintCd <= 0) { hintCd = 2; G.hud.say('hiccup', '(지금은 날 안 보고 있어…)', [], { secs: 1.3 }); }
    }
    /* 고개 돌려 손 내밀기 — 가까이 · 멈춤 · 화가 가라앉았을 때 */
    if (d < 4.5) turnTo(P, N.x, N.z, dt);
    if (stage === 'approach' && d < 3.6 && P.reach && P.W.speed < 0.4 && M.anger < 0.5 && M.fear < 0.65 && startle <= 0) {
      reachT += dt; M.anger = clamp01(M.anger - dt * 0.15);
      if (reachT > need) break;
    } else reachT = Math.max(0, reachT - dt * 0.6);
    spot(G, stage === 'approach' && d < 5, N.x, N.y, N.z);
    if (G.diff === 'easy') G.hud.mood(N.rig.pupil);
    C.stage = stage; C.reachT = reachT;
  }
  /* 와(조용히) — 코가 손바닥 가까이 · 몸 불이 꺼짐 · 관중석이 숨을 죽임 */
  G.useSpots = []; blz.blaze = 0; blz.crouch = 0; blz.headUp = -0.5; blz.sniff = 1;
  N.goTo(P.W.x + (N.x - P.W.x) * 0.55, P.W.z + (N.z - P.W.z) * 0.55, 0.8, 0.3); crowdPose(K.fans, 'still', 0);
  yield* sayAll(G, [['hiccup', '…봐요. 얘들은 싸우고 싶은 게 아니에요.']]);
  G.records['9-1'] = { reach: +reachT.toFixed(1) };
  return true;
}

/* ② 아빠가 망치를 듦(예고 2초) → 철창 쾅 → 나이트메어 몸에 불 → 20초 버티기(쉬움 = 맞아도 안 넘어짐) · 하늘 끝에서 검은 그림자가 다가옴 */
function* fury(G, C) {
  const P = G.player, pl = G.place, K = cast9(G), c = K.c, St = K.St, easy = G.diff === 'easy';
  const fresh = !G.castBy.nm;
  const N = nightmare(G, { x: c.x + 2, z: c.z + 2, yaw: 0 }); C.N = N; N.show(true);
  yield* until(() => N.root && St.root && P.root);
  if (fresh) { yield* awaitP(setHelmet(G, false)); G.putPlayer({ x: c.x, z: c.z + 8, yaw: Math.PI }); if (K.cage) K.cage.open(1); }
  const fb = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), toon({ color: 0xf08a2a, emissive: 0xa83e0a })); fb.visible = false; pl.group.add(fb);
  const fl = flameMesh(1.6); fl.visible = false; pl.group.add(fl); const gl = glowSprite(0xff8a3a, 5, 0.55); gl.visible = false; pl.group.add(gl);
  const puffs = makePuffs(pl.group, 90, 0x3a3430);
  C.cleanup = () => { fb.removeFromParent(); fb.geometry.dispose(); fl.removeFromParent(); gl.removeFromParent(); puffs.mesh.removeFromParent(); puffs.mesh.geometry.dispose(); };
  const blz = { blaze: 0.2, crouch: 0, jaw: 0, headUp: -0.4, sniff: 0 }; N.pose = blz; N.stay(); N.faceTo(P.W.x, P.W.z);
  /* 예고 2초 — 아빠가 망치를 번쩍 */
  holdItem(St, 'hammer'); St.faceTo(c.x, c.z); St.pose = { cheer: 1 };
  G.hud.say('stoick', '그만! 시험을 멈춰라!', ['hammer'], { secs: 2.2 });
  G.hud.goal('불을 피해 버티기');   /* 첫 2초에도 목표가 보이게(눈높이 9-2 · 전엔 비웠다가 쾅 뒤에 띄움) */
  yield* timed(2, () => { N.faceTo(St.x, St.z); });
  /* 쾅 — 원인 자리(아빠 앞 난간)에 먼지 · 소리 · 나이트메어가 몸에 불 */
  St.pose = { hammer: 1 }; G.sfx.play('bang'); G.sfx.play('clang');
  const rx = St.x + (c.x - St.x) * 0.06, rz = St.z + (c.z - St.z) * 0.06; puffs.burst(rx, St.y + 1.4, rz, 20, 2, 2);
  N.mind.event('loud'); N.mind.anger = 1; blz.blaze = 1; blz.crouch = 0.7; blz.headUp = 0; G.sfx.play('roar');
  crowdPose(K.fans, 'murmur', G.t);
  G.hud.say('hiccup', '앗…!', [], { secs: 1 });
  G.hud.goal('불을 피해 버티기');
  /* 투슬리스 — 하늘 끝에서 다가옴(12초부터 · 20초에 훈련장 위) */
  const T = G.castBy.tl || G.dragon('nightfury', { x: c.x - 150, z: c.z - 170 }, { keep: 'tl', bound: null, noCollide: true, mind: { fear: 0.1, anger: 0.6 } });
  T.show(false); T.mind.lock = 'idle'; T.stay(); C.T = T;
  const flyP = { flapRate: 1, fold: 0, glide: 0.2 };
  const S0 = { x: c.x - 150, y: 70, z: c.z - 170 }, S1 = { x: c.x + 1, y: 34, z: c.z + 2 };
  const GAP = 0.9, need = 20, RAD = 1.8;
  let t = 0, hits = 0, next = 1.0, shot = null, down = 0, fireT = 0, jump = 0, said = 0;
  const flash = { x: 0, z: 0 };
  C.drawHook = () => {
    if (C.jump && C.jump.t < 1 && St.root && St.jumpY != null) St.root.position.y = St.jumpY;
    if (T.flyAt && T.root) { T.root.position.set(T.flyAt.x, T.flyAt.y, T.flyAt.z); T.root.rotation.y = T.flyAt.yaw; }
  };
  while (t < need) {
    const dt = yield; t += dt; puffs.step(dt);
    const M = N.mind, d = G.dist(P.W, N);
    crowdPose(K.fans, 'murmur', G.t);
    /* 나이트메어 — 7~10m 거리를 두고 돎 · 예고(몸이 더 달아오름 + 웅크림 + 입) → 쏨(움직이는 쪽을 조금 앞질러) → 숨 고름 */
    if (!shot && M.warnT <= 0) { if (d > 10) N.goTo(P.W.x + (N.x - P.W.x) / d * 8, P.W.z + (N.z - P.W.z) / d * 8, 2.6, 0.8); else if (d < 6) N.goTo(N.x + (N.x - P.W.x) / d * 3, N.z + (N.z - P.W.z) / d * 3, 2.4, 0.6); }
    N.faceTo(P.W.x, P.W.z);
    if (!shot && M.warnT <= 0 && M.beh !== 'attack') { next -= dt; if (next <= 0) { M.windup(WARN[G.diff]); N.stay(); G.sfx.play('cry_' + N.kind, N); } }
    const warn = M.warnT > 0;
    blz.blaze = warn ? 1 : 0.85; blz.crouch = warn ? 0.85 : 0.5; blz.jaw = warn ? 0.2 + 0.25 * (1 - M.warnT / WARN[G.diff]) : 0;
    if (M.beh === 'attack' && !shot && !warn) {
      const mx = N.x + Math.sin(N.yaw) * 2.6, mz = N.z + Math.cos(N.yaw) * 2.6;
      const ax = P.W.x + P.W.vx * 0.25, az = P.W.z + P.W.vz * 0.25;
      shot = { t: 0, sx: mx, sy: N.y + 2.3, sz: mz, tx: ax, tz: az, ty: pl.height(ax, az, 9) };
      fb.visible = true; blz.jaw = 0.9; G.sfx.play('fire'); next = GAP + 0.6 + G.rng() * 0.6;
    }
    if (shot) {
      shot.t += dt / 0.6; const k = Math.min(1, shot.t);
      fb.position.set(shot.sx + (shot.tx - shot.sx) * k, shot.sy + (shot.ty - shot.sy) * k + Math.sin(k * Math.PI) * 1.2, shot.sz + (shot.tz - shot.sz) * k);
      if (k >= 1) {
        fb.visible = false; puffs.burst(shot.tx, shot.ty + 0.2, shot.tz, 24, 3, 2.6);
        fl.position.set(shot.tx, shot.ty, shot.tz); gl.position.set(shot.tx, shot.ty + 0.9, shot.tz); fl.visible = gl.visible = true; fireT = 1.6; flash.x = shot.tx; flash.z = shot.tz;
        if (Math.hypot(P.W.x - shot.tx, P.W.z - shot.tz) < RAD && !(P.W.rollT > 0)) {
          if (easy) G.hud.say('hiccup', '앗 뜨거!', [], { secs: 0.8 });
          else { hits++; down = 1.6; P.lock = true; P.pose = { stumble: 1 }; G.hud.say('hiccup', hits < 3 ? '아야! …굴러야 해.' : '으아…!', [], { secs: 1.3 }); }
        }
        shot = null;
      }
    }
    if (fireT > 0) { fireT -= dt; if (fireT <= 0) fl.visible = gl.visible = false; }
    if (down > 0) { down -= dt; if (down <= 0) { P.lock = false; P.pose = null; } }
    if (hits >= 3) { yield* sayAll(G, [['gobber', '히컵, 이리 와! …숨 고르고 다시!']]); return 'retry'; }
    /* 아빠 — 6초에 구덩이로 뛰어내림(쉬운 포물선) · 맞은편 벽가에서 소리침 */
    if (t > 6 && !jump) { jump = 1; C.jump = { t: 0, x0: St.x, y0: St.y, z0: St.z, x1: St.x + (c.x - St.x) * 0.22, z1: St.z + (c.z - St.z) * 0.22 }; St.pose = NONE; }
    if (C.jump && C.jump.t < 1) {
      const J = C.jump; J.t = Math.min(1, J.t + dt / 0.9); const y1 = pl.height(J.x1, J.z1, 9);
      St.place(J.x0 + (J.x1 - J.x0) * J.t, J.z0 + (J.z1 - J.z0) * J.t); St.jumpY = J.y0 + (y1 - J.y0) * J.t + Math.sin(J.t * Math.PI) * 1.5;
      if (J.t >= 1) { St.jumpY = null; St.place(J.x1, J.z1); puffs.burst(J.x1, y1 + 0.1, J.z1, 14, 2, 1.5); G.sfx.play('thud'); G.hud.say('stoick', '히컵! 이쪽으로!', [], { secs: 1.6 }); }
    }
    /* 투슬리스 — 12초부터 하늘 끝 검은 그림자(날갯짓) */
    if (t > 12) {
      const k = Math.min(1, (t - 12) / 8), e = k * k * (3 - 2 * k);
      T.show(true); T.pose = flyP;
      const fa = T.flyAt || (T.flyAt = { x: 0, y: 0, z: 0, yaw: Math.atan2(S1.x - S0.x, S1.z - S0.z) });
      fa.x = S0.x + (S1.x - S0.x) * e; fa.y = S0.y + (S1.y - S0.y) * e; fa.z = S0.z + (S1.z - S0.z) * e; T.x = T.px = fa.x; T.z = T.pz = fa.z;
      if (t > 15.5 && !said) { said = 1; G.hud.say('hiccup', '저 그림자…!', [], { secs: 1.4 }); }
    }
    C.t = t; C.hits = hits; C.warn = warn; C.shot = !!shot;
  }
  N.mind.warnT = 0; blz.jaw = 0; fb.visible = false;
  G.records['9-2'] = { hits };
  return true;
}

/* ③ 투슬리스가 그물 지붕을 뚫고 내려옴 → 나이트메어는 우리로 · 아빠가 덤비다 눌림 → 둘 사이에 서서 고개 돌려 손 내밀기 3초(둘이 움직임 → 계속 사이로)
   → 투슬리스가 멈춤 → 몰려온 바이킹들이 투슬리스를 잡음(내 탓 X) · 슬픈 하나 */
function* between(G, C) {
  const P = G.player, pl = G.place, K = cast9(G), c = K.c, St = K.St, easy = G.diff === 'easy';
  const fresh = !G.castBy.tl;
  const N = nightmare(G, { x: c.x + 3, z: c.z - 3, yaw: 0 }); N.show(true);
  const T = G.castBy.tl || G.dragon('nightfury', { x: c.x, z: c.z }, { keep: 'tl', bound: null, noCollide: true, mind: { fear: 0.1, anger: 0.6 } });
  C.T = T; C.St = St;
  yield* until(() => T.root && N.root && St.root && P.root);
  if (fresh) { yield* awaitP(setHelmet(G, false)); G.putPlayer({ x: c.x - 1, z: c.z + 6, yaw: Math.PI }); if (K.cage) K.cage.open(1); }
  if (St.y > 12 || fresh) { St.place(c.x - 3, c.z - 11, 0); }
  N.pose = { blaze: 0.9, crouch: 0.6 };
  const links = chainBits(pl.group, 14), puffs = makePuffs(pl.group, 80, 0xd9c49a);
  const glow = glowSprite(0x7a8cff, 1.2, 0.0); pl.group.add(glow);
  C.cleanup = () => { links.dispose(); puffs.mesh.removeFromParent(); puffs.mesh.geometry.dispose(); glow.removeFromParent(); pl.netHole && pl.netHole(0); };
  /* 내려옴 — 나와 나이트메어 사이(1.3초 · 지붕을 지날 때 고리가 쏟아짐) */
  const LS = { x: P.W.x + (N.x - P.W.x) * 0.45, z: P.W.z + (N.z - P.W.z) * 0.45 }, fy = pl.height(LS.x, LS.z, 9);
  T.show(true); T.stay(); T.place(LS.x, LS.z, Math.atan2(N.x - LS.x, N.z - LS.z)); T.faceTo(N.x, N.z);
  T.pose = { flapRate: 1, fold: 0, glide: 0.3 }; T.flyAt = null;
  let broke = false;
  yield* timed(1.3, (k, dt) => { T.rigY = (1 - k * k) * 24; links.step(dt); if (!broke && T.rigY < 23) { broke = true; links.burst(LS.x, fy + 22, LS.z, fy); pl.netHole && pl.netHole(LS.x, LS.z, 3.4); G.sfx.play('clang'); G.sfx.play('boom'); } });
  T.rigY = 0; puffs.burst(LS.x, fy + 0.2, LS.z, 30, 3, 2.5); G.sfx.play('thud');
  T.pose = { jaw: 1, crouch: 0.4, teeth: 1, pupil: 0.15 }; G.sfx.play('roar');
  G.hud.say('hiccup', '투슬리스!', [], { secs: 1.2 });
  /* 나이트메어는 우리로 · 문이 닫힘 */
  const cg = K.cage; N.pose = { blaze: 0.3, tailCurl: 1, crouch: 0.6 };
  if (cg) { N.goTo(cg.door.x * 0.97, cg.door.z * 0.97, 6, 0.9); let w = 0; while (!N.arrived() && w < 4.5) { const dt = yield; w += dt; links.step(dt); puffs.step(dt); } }
  else yield* timed(1.6, (k, dt) => { links.step(dt); puffs.step(dt); });
  if (cg) { yield* timed(0.8, (k, dt) => { cg.open(1 - k); links.step(dt); if (k > 0.7) N.show(false); }); }   // 우리 안으로 들어가고 문이 닫힘
  /* 아빠가 덤빔 → 투슬리스가 덮쳐 누름 */
  holdItem(St, 'hammer'); St.pose = NONE; St.walkTo(T.x + (St.x - T.x) * 0.2, T.z + (St.z - T.z) * 0.2, 4.2);
  G.hud.say('stoick', '물러서라, 이 녀석!', ['hammer'], { secs: 1.4 });
  yield* timed(0.9, (k, dt) => { links.step(dt); puffs.step(dt); T.faceTo(St.x, St.z); });
  St.target = null; holdItem(St, null); St.pose = SIT_P; puffs.burst(St.x, St.y + 0.2, St.z, 16, 2, 1.5); G.sfx.play('thud');
  let dir = Math.atan2(T.x - St.x, T.z - St.z), SP = { x: St.x, z: St.z };
  const GAPD = 5.2, SN = 2.3, tpose = { pounce: 0.7, teeth: 1, jaw: 0.35, crouch: 0.5, pupil: 0.15, headUp: -0.2 };
  T.pose = tpose; T.solid = true; T.radius = 1.1; T.goTo(SP.x + Math.sin(dir) * GAPD, SP.z + Math.cos(dir) * GAPD, 3, 0.3);
  G.hud.say('hiccup', '안 돼, 투슬리스!', [], { secs: 1.2 });
  G.hud.goal('아빠와 투슬리스 사이에서 손 내밀기');
  /* 도전 — 둘이 2.6초마다 자리를 옮김 · 사이에서 F 길게만 쌓임(벗어나면 천천히 줄어듦) */
  const per = { easy: 4.2, normal: 3.3, hard: 2.6 }[G.diff] || 3.3, need = { easy: 2.0, normal: 3.0, hard: 3.5 }[G.diff] || 3;
  let mt = per, side = 1, prog = 0, charge = 0, nag = 0;
  while (prog < need) {
    const dt = yield; links.step(dt); puffs.step(dt);
    mt -= dt;
    if (mt <= 0) {                                              // 아빠가 뒤로 기어 물러남 → 투슬리스가 따라붙음
      mt = per; side = -side; dir += side * 0.4;
      const px = Math.cos(dir) * side, pzv = -Math.sin(dir) * side, nx = SP.x + px * 1.3 - Math.sin(dir) * 0.5, nz = SP.z + pzv * 1.3 - Math.cos(dir) * 0.5;
      const r = Math.hypot(nx - c.x, nz - c.z); SP = r < 15 ? { x: nx, z: nz } : { x: SP.x + (c.x - SP.x) * 0.2, z: SP.z + (c.z - SP.z) * 0.2 };
      St.walkTo(SP.x, SP.z, 2.2); T.goTo(SP.x + Math.sin(dir) * GAPD, SP.z + Math.cos(dir) * GAPD, 2.8, 0.3);
    }
    St.pose = SIT_P; St.faceTo(T.x, T.z); if (T.arrived()) T.faceTo(St.x, St.z);
    /* 사이 — 아빠→투슬리스 주둥이 선분의 가운데 쪽(12~88%) · 선에서 1.1m 안 */
    const hx = T.x + Math.sin(T.yaw) * SN, hz = T.z + Math.cos(T.yaw) * SN; C.head = C.head || { x: 0, z: 0 }; C.head.x = hx; C.head.z = hz;
    const ex = hx - St.x, ez = hz - St.z, L2 = ex * ex + ez * ez || 1, u = ((P.W.x - St.x) * ex + (P.W.z - St.z) * ez) / L2, pd = Math.abs((P.W.x - St.x) * ez - (P.W.z - St.z) * ex) / Math.sqrt(L2);
    const btw = u > 0.12 && u < 0.88 && pd < 1.1; if (btw) turnTo(P, hx, hz, dt);
    if (btw && P.reach) { prog += dt; nag = 0; } else prog = Math.max(0, prog - dt * 0.35);
    const calmK = prog / need; tpose.pupil = 0.15 + calmK * 0.8; tpose.teeth = 1 - calmK; tpose.jaw = 0.35 * (1 - calmK); tpose.pounce = 0.7 * (1 - calmK);
    charge = Math.min(1, charge + dt * 0.05) * (1 - calmK * 0.9);   // 입 안 빛(겁주는 신호 · 실제로 쏘지 않음)
    glow.material.opacity = 0.15 + charge * 0.5; glow.position.set(T.x + Math.sin(T.yaw) * 2.1, T.y + 1.1, T.z + Math.cos(T.yaw) * 2.1);
    if (!btw) { nag += dt; if (nag > 9) { nag = 0; G.hud.say('stoick', '히컵, 물러서라!', [], { secs: 1.4 }); } }
    spot(G, easy, (St.x + hx) / 2, T.y, (St.z + hz) / 2);
    C.prog = prog; C.btw = btw;
  }
  /* 멈춤 — 동공이 둥글어지고 물러나 앉음 */
  G.useSpots = []; G.hud.goal(''); glow.material.opacity = 0;
  T.pose = { pupil: 1, crouch: 0.2, headUp: -0.2 }; T.goTo(T.x + (T.x - St.x) * 0.3, T.z + (T.z - St.z) * 0.3, 1, 0.3); T.faceTo(P.W.x, P.W.z);
  yield* sayAll(G, [['hiccup', '투슬리스, 됐어. 이제 괜찮아.']]);
  /* 붙잡힘(슬픈 하나 · 12초 안) — 문으로 바이킹 둘이 달려옴 · 투슬리스는 버둥 · 아빠가 일어섬 */
  const gate = pl.anchors.gate || { x: 0, z: 19 };
  const V = [G.person('villager1', { x: gate.x - 1, z: gate.z }, { noCollide: true }), G.person('villager3', { x: gate.x + 1, z: gate.z }, { noCollide: true })];
  V[0].walkTo(T.x - 1.6, T.z + 0.6, 4.4); V[1].walkTo(T.x + 1.6, T.z - 0.6, 4.4);
  G.hud.say('villager', '드래곤을 잡아라!', [], { name: '마을 사람들', secs: 1.4 });
  yield* timed(1.6, (k, dt) => { links.step(dt); });
  T.pose = { struggle: 0.7, crouch: 0.8, pupil: 0.5, tailCurl: 0.6 }; T.stay(); for (const v of V) { v.pose = CARRY_P; v.faceTo(T.x, T.z); }
  St.pose = NONE; St.faceTo(T.x, T.z); { const dx = T.x - St.x, dz = T.z - St.z, L = Math.hypot(dx, dz) || 1; St.walkTo(St.x - dz / L * 2.2, St.z + dx / L * 2.2, 1.2); }   // 일어나 옆으로 비켜섬
  yield* sayAll(G, [['hiccup', '안 돼요! 날 지켜 주러 온 거예요!'], ['stoick', '…가둬라. 배에 싣는다.'], ['hiccup', '아빠…!']]);
  G.records['9-3'] = { t: +C.t || 0 };
  return true;
}

/* ④ 큰 회관 — 아빠를 따라가며 듣기 · 책의 둥지 쪽을 보여 줌(F) · 아빠는 '둥지'만 붙잡음 · 말실수 · 다시 보여 줘도 밀어냄 · '이제 넌 우리 편이 아니다'(슬픈 둘) */
const HALL = [
  ['stoick', '…언제부터였냐.'],
  ['show'],
  ['hiccup', '둥지에 아주 큰 드래곤이 있어요. 다들 겁나서 먹이를 바치는 거예요.', ['book']],
  ['stoick', '둥지…? 둥지에 갔었느냐?'],
  ['hiccup', '그게 아니라요! 대장만 나쁘다고요!'],
  ['stoick', '어떻게 찾았지? 몇 해를 찾아도 못 찾은 곳을.'],
  ['hiccup', '…투슬리스가요. 그 섬은 드래곤만 찾아요.'],
  ['hiccup', '(앗… 말하면 안 되는 거였는데.)'],
  ['stoick', '드래곤만… 찾는다.', [], 'walk'],
  ['show2'],
  ['stoick', '그 드래곤을 배에 묶어라. 내일 아침, 둥지로 간다.', ['ship']],
  ['hiccup', '아빠, 제발… 한 번만 들어 주세요!'],
  ['stoick', '이제 넌 우리 편이 아니다.', [], 'turn'],
];
function* hall(G, C) {
  const P = G.player, pl = G.place, A = pl.anchors, tb = A.table_main || { x: 0, z: -12 }, door = A.door || { x: 0, z: 22 };
  const S = G.person('stoick', { x: tb.x, z: tb.z + 3, yaw: Math.PI }, {}); C.S = S;
  const Vl = G.person('villager1', { x: door.x + 2.4, z: door.z - 3, yaw: Math.PI }, {});
  yield* until(() => S.root && P.root);
  G.putPlayer({ x: tb.x + 1.5, z: tb.z + 9, yaw: Math.PI });
  if (P.helmOn) yield* awaitP(setHelmet(G, false));
  G.hud.sketch(false);
  C.cleanup = () => G.hud.sketch(false);
  G.hud.goal('아빠에게 말하기'); C.stage = 'listen';
  let li = 0, far = 0;
  while (li < HALL.length || G.hud.busy()) {
    const dt = yield; const d = G.dist(P.W, S);
    if (C.pushT > 0) { C.pushT -= dt; if (C.pushT <= 0) G.hud.sketch(false); }
    if (C.path && S.arrived() && C.path.length) { const q = C.path.shift(); S.walkTo(q[0], q[1], 1.3); }   // 화로를 돌아서 문 쪽으로
    if (S.arrived() && C.stage !== 'gone' && !(C.path && C.path.length)) { const fm = C.faceMe || C.pushT > 0; S.faceTo(fm ? P.W.x : S.x + Math.sin(C.away || Math.PI) * 3, fm ? P.W.z : S.z + Math.cos(C.away || Math.PI) * 3); }
    if (G.hud.busy() || li >= HALL.length) continue;
    if (d > 6.5) { far += dt; if (far > 6) { far = 0; G.hud.say('hiccup', '(아빠 곁으로 가야 해…)', [], { secs: 1.4 }); } continue; }
    far = 0;
    const l = HALL[li];
    if (l[0] === 'show' || l[0] === 'show2') {
      C.stage = 'show'; G.hud.goal('책의 둥지 쪽 보여 주기'); G.useSpots = [{ x: S.x, y: S.y, z: S.z }];
      if (P.fTap && d < 3.2 && P.mash) G.hud.say('hiccup', '(차분하게… 한 장씩.)', [], { secs: 1.2 });
      else if (P.fTap && d < 3.2) {
        G.useSpots = []; G.hud.goal(''); C.stage = 'listen';
        drawNestPage(G.hud.sketch(true)); G.sfx.play('pluck');
        if (l[0] === 'show2') { S.faceTo(P.W.x, P.W.z); S.pose = { point: 0 }; C.pushT = 2.4; G.hud.say('stoick', '(책을 밀어낸다)', [], { secs: 1.6 }); }
        li++;
      }
      continue;
    }
    li++;
    G.hud.say(l[0], l[1], l[2] || []); if (G.runner) G.runner.idleT = 0;   // 듣는 동안은 '멈춤' 힌트를 띄우지 않음
    if (l[0] === 'stoick') S.pose = TALK_P;
    if (li === 4) C.faceMe = true;                              // '둥지?'에 돌아섬
    if (l[3] === 'walk') { C.faceMe = false; C.away = 0.001; const fp = A.firepit || { x: 0, z: 3.6 }; C.path = [[fp.x + 4.2, fp.z - 2.5], [fp.x + 4.2, fp.z + 3], [door.x + 1, door.z - 9]]; G.hud.sketch(false); }
    if (l[3] === 'turn') { C.faceMe = false; C.stage = 'gone'; S.faceTo(door.x, door.z + 6); }   // 등을 돌림
  }
  /* 등을 돌리고 나감 */
  S.pose = NONE; C.path = null; S.walkTo(door.x + 1, door.z + 2, 1.5); G.hud.sketch(false);
  yield* timed(2.2);
  G.records['9-4'] = { t: +C.t || 0 };
  return true;
}
function hallSense(G, C) { const S = C.S; return { stage: C.stage || '', target: S && S.root && C.stage !== 'gone' ? { x: +S.x.toFixed(1), z: +S.z.toFixed(1) } : null }; }

/* ⑤ 선착장(이음 · 슬픈 셋) — 사슬에 묶인 투슬리스가 앞배를 이끌고 안개로 · 아빠가 한 번 돌아봄 · 카메라는 그대로(걸을 수 있음) */
function* departure(G, C) {
  const P = G.player, pl = G.place, ships = ['ship1', 'ship2'].map((n) => pl.group.getObjectByName(n)).filter(Boolean);
  const T = G.dragon('nightfury', { x: 90, z: 10 }, { bound: null, noCollide: true, mind: { fear: 0.5, anger: 0.2 } }); T.mind.lock = 'idle'; T.stay();
  const S = G.person('stoick', { x: 86, z: 10 }, { noCollide: true });
  yield* until(() => T.root && S.root && P.root);
  const home = ships.map((s) => ({ x: s.position.x, z: s.position.z }));
  const chainGeo = new THREE.CylinderGeometry(0.05, 0.05, 1, 5).translate(0, 0.5, 0), chain = new THREE.Mesh(chainGeo, toon({ color: 0x48484c })); pl.group.add(chain);
  C.cleanup = () => { ships.forEach((s, i) => { s.position.x = home[i].x; s.position.z = home[i].z; }); chain.removeFromParent(); chainGeo.dispose(); };
  T.pose = { struggle: 0.3, crouch: 0.4, headUp: 0.3, tailCurl: 0.5, pupil: 0.4 };
  let t = 0, look = 0;
  const sh = ships[0], lp = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  const deck = (lz, h, out) => { out.set(0, h, lz).applyAxisAngle(up, sh.rotation.y); out.x += sh.position.x; out.y += sh.position.y; out.z += sh.position.z; return out; };
  C.drawHook = () => {
    if (!sh) return;
    deck(6.2, 1.25, lp); if (T.root) { T.root.position.copy(lp); T.root.rotation.y = sh.rotation.y; }
    deck(-1.5, 1.05, lp); if (S.root) { S.root.position.copy(lp); S.root.rotation.y = sh.rotation.y + C.look * Math.PI * 0.85; }
    if (T.root) { deck(8.6, 1.4, lp); chain.position.copy(lp); const tx = T.root.position.x, ty = T.root.position.y + 1.6, tz = T.root.position.z; const dx = tx - lp.x, dy = ty - lp.y, dz = tz - lp.z, L = Math.hypot(dx, dy, dz) || 1; chain.scale.set(1, L, 1); chain.quaternion.setFromUnitVectors(up, lp.set(dx / L, dy / L, dz / L)); }
  };
  C.look = 0;
  G.hud.goal('');
  yield* sayAll(G, [['hiccup', '(…투슬리스.)']]);
  while (t < 13) {
    const dt = yield; t += dt;
    const v = Math.min(5.5, t * 0.6);                            // 천천히 떠남 → 안개 속으로
    ships.forEach((s, i) => { if (t > i * 1.2) { s.position.x += Math.sin(s.rotation.y) * v * dt; s.position.z += Math.cos(s.rotation.y) * v * dt; } });
    /* 아빠가 한 번 돌아봄(6~8초) */
    look = t > 6 && t < 8.2 ? Math.min(1, (t - 6) / 0.6) * Math.min(1, (8.2 - t) / 0.6) : 0; C.look = look;
    if (t > 6.4 && !C.said) { C.said = true; G.hud.say('stoick', '……', [], { secs: 1.4 }); }
  }
  yield* sayAll(G, [['hiccup', '…다 내 탓이야.']]);
  return true;
}

/* ⑥ 아스트리드 — "왜 안 죽였어?" · 3장 그림을 펼침(F) · "칼을 들었는데, 떨고 있는 건 나만이 아니더라" · "그래서 이제?" → 훈련장으로(따라 걷기) */
function* astrid(G, C) {
  const P = G.player, pl = G.place, A = pl.anchors, pz0 = A.plaza || { x: 0, z: 6 };
  yield* until(() => P.root);
  const ux = pz0.x - P.W.x, uz = pz0.z - P.W.z, ul = Math.hypot(ux, uz) || 1;
  const As = G.person('astrid', { x: P.W.x + ux / ul * 9, z: P.W.z + uz / ul * 9, yaw: Math.atan2(-ux, -uz) }, { noCollide: true }); C.As = As;
  yield* until(() => As.root);
  As.walkTo(P.W.x - 1.6, P.W.z - 0.6, 2.4);
  yield* until(() => As.arrived(), 9);
  As.faceTo(P.W.x, P.W.z);
  yield* sayAll(G, [['astrid', '왜 안 죽였어? 숲에서. 기회가 있었잖아.']]);
  G.hud.goal('공책 그림 보여 주기'); G.useSpots = [{ x: As.x, y: As.y, z: As.z }]; C.stage = 'show';
  yield* until(() => P.fTap && G.near(As, 3.2));
  G.useSpots = []; G.hud.goal(''); C.stage = 'talk';
  drawCoveSketch(G.hud.sketch(true)); C.cleanup = () => G.hud.sketch(false); G.sfx.play('pluck');
  yield* sayAll(G, [['hiccup', '칼을 들었는데, 떨고 있는 건 나만이 아니더라.'], ['astrid', '…그래서 이제?'], ['hiccup', '훈련장으로 가자.']]);
  G.hud.sketch(false);
  /* 따라 걷기 — 아스트리드가 광장 쪽으로 앞장섬(멀어지면 기다림) */
  const dx = pz0.x - As.x, dz = pz0.z - As.z, L = Math.hypot(dx, dz) || 1, go = { x: As.x + dx / L * Math.min(16, L), z: As.z + dz / L * Math.min(16, L) };
  As.walkTo(go.x, go.z, 2.2); G.hud.goal('아스트리드와 훈련장으로'); C.stage = 'follow';
  const start = { x: P.W.x, z: P.W.z };
  while (true) {
    yield;
    const d = G.dist(P.W, As);
    if (d > 8 && As.target) { As.target = null; As.faceTo(P.W.x, P.W.z); }
    else if (d < 5 && !As.target && Math.hypot(As.x - go.x, As.z - go.z) > 1) As.walkTo(go.x, go.z, 2.2);
    if (Math.hypot(P.W.x - start.x, P.W.z - start.z) > 11 && d < 5) break;
  }
  return true;
}

/* ⑦ 우리 문을 직접 열고 친구 넷 — 같은 동사(다가가 기다리기) · 성격마다 수치·사건이 다름 · 앞 친구가 성공하면 뒤 친구 태도가 바뀜 → 와! 다섯 드래곤이 솟아오름 */
const PAIR = [
  { who: 'fishlegs', kind: 'gronckle', cage: 0, goal: '피시레그와 그롱클 이어 주기' },
  { who: 'snotlout', kind: 'nightmare', cage: 1, goal: '스노트라우트와 나이트메어 이어 주기' },
  { who: 'twins', kind: 'zippleback', cage: 2, goal: '쌍둥이와 지플백 이어 주기' },
  { who: 'astrid', kind: 'nadder', cage: 3, goal: '아스트리드와 내더 이어 주기' },
];
const _q = new THREE.Quaternion();
function bendNeck(D, hs, k) {                              // 지플백 머리 하나를 숙임(자세 함수 뒤에 덧돌림)
  if (!D.root) return; D.nb = D.nb || {};
  for (const n of ['neck1', 'head']) { const key = n + hs, b = D.nb[key] || (D.nb[key] = D.root.getObjectByName(key)); if (b && b.userData.ax) b.quaternion.multiply(_q.setFromAxisAngle(b.userData.ax[0], k * (n === 'head' ? 0.35 : 0.55))); }
}
function* friends(G, C) {
  const P = G.player, pl = G.place, c = pl.anchors.center || { x: 0, z: 0 }, gate = pl.anchors.gate || { x: 0, z: 19 }, cages = pl.lists.cages || [], easy = G.diff === 'easy';
  if (P.helmOn) yield* awaitP(setHelmet(G, false));
  const NC = { noCollide: true };   // 친구들은 바위에 걸려 멈추지 않게(대본이 막히지 않게)
  const F = { fishlegs: G.person('fishlegs', { x: c.x - 2, z: c.z + 3, yaw: Math.PI }, NC), snotlout: G.person('snotlout', { x: c.x + 1.5, z: c.z + 3.4, yaw: Math.PI }, NC), ruff: G.person('ruffnut', { x: c.x - 0.6, z: c.z + 1.6, yaw: Math.PI }, NC), tuff: G.person('tuffnut', { x: c.x + 0.6, z: c.z + 1.4, yaw: Math.PI }, NC), astrid: G.person('astrid', { x: c.x + 3, z: c.z + 2, yaw: Math.PI }, NC) };
  for (const k in F) F[k].pose = NONE;
  yield* until(() => P.root && Object.values(F).every((h) => h.root));
  holdItem(F.snotlout, 'hammer');
  const puffs = makePuffs(pl.group, 90, 0x9ac46a), dust = makePuffs(pl.group, 60, 0xd9c49a);
  const D = [], riders = [];
  C.cleanup = () => { puffs.mesh.removeFromParent(); puffs.mesh.geometry.dispose(); dust.mesh.removeFromParent(); dust.mesh.geometry.dispose(); for (const cg of cages) cg.open(0); P.cam = 'follow'; pl.netHole && pl.netHole(0); };
  C.drawHook = (a, dt) => {
    for (const r of riders) seatOn(r.H, r.D, r.back || 0, r.side || 0, dt);
    if (C.zb && C.zb.root) { bendNeck(C.zb, 'A', C.lowA || 0); bendNeck(C.zb, 'B', C.lowB || 0); }
    if (C.tr && C.tr.root && D[0] && D[0].root && (C.perch || Math.hypot(C.tr.x - D[0].x, C.tr.z - D[0].z) < 1.8)) {   // 작은 테러가 그롱클 머리에 올라앉음
      C.perch = true; const r = D[0].root; C.tr.root.position.set(r.position.x + Math.sin(r.rotation.y) * 0.75, r.position.y + 1.55, r.position.z + Math.cos(r.rotation.y) * 0.75); C.tr.root.rotation.y = r.rotation.y;
    }
    if (C.rise) C.rise(dt);
  };
  yield* sayAll(G, [['astrid', '그래서… 훈련장엔 왜?'], ['hiccup', '아빠를 도우려면 우리가 날아야 해.'], ['snotlout', '날아? 뭘 타고?'], ['hiccup', '…드래곤.'], ['fishlegs', '드, 드래곤을 타자고?']]);
  C.pair = 0;
  const openCage = function* (cg, who, goal) {
    G.hud.hint(''); if (G.runner) { G.runner.hintLv = 0; G.runner.idleT = 0; }   // 친구마다 힌트를 처음부터
    G.hud.goal(who + ' 앞 우리 문 열기'); G.useSpots = [{ x: cg.door.x, y: 9, z: cg.door.z }]; C.stage = 'door'; C.door = { x: +(cg.door.x * 0.88).toFixed(1), z: +(cg.door.z * 0.88).toFixed(1) };
    yield* until(() => P.fTap && Math.hypot(P.W.x - cg.door.x, P.W.z - cg.door.z) < 3.4);
    G.useSpots = []; C.door = null; G.sfx.play('clang'); G.hud.goal(goal);
    yield* timed(1.1, (k) => cg.open(k));
  };
  const spawn = (kind, cg, mind) => { const ix = cg.door.x * 0.96, iz = cg.door.z * 0.96; const d = G.dragon(kind, { x: ix, z: iz, yaw: cg.yaw }, { mind, noCollide: true }); d.mind.lock = 'watch'; d.solid = true; d.radius = kind === 'gronckle' ? 1.5 : 1.7; return d; };
  const flee = (d) => { const a = Math.atan2(d.x - P.W.x, d.z - P.W.z), r = Math.min(14, Math.hypot(d.x - c.x, d.z - c.z) + 4); d.goTo(c.x + Math.sin(a) * r * 0.7, c.z + Math.cos(a) * r * 0.7, 4.2, 0.6); dust.burst(d.x, d.y + 0.2, d.z, 12, 2, 1.4); };
  const park = (d, i) => { const a = Math.PI * 0.75 + i * 0.5; d.goTo(c.x + Math.sin(a) * 9, c.z + Math.cos(a) * 9, 1.6, 0.8); };
  let t;
  /* ── 1. 피시레그 + 그롱클: 숫자를 외는 사이 풀을 건넴 → 내가 물러서 있으면 그롱클이 피시레그에게 감 ── */
  {
    const p = PAIR[0], cg = cages[p.cage], Fl = F.fishlegs; G.hud.goal(p.goal); C.fr = [Fl];
    Fl.walkTo(cg.x + (c.x - cg.x) * 0.25, cg.z + (c.z - cg.z) * 0.25, 2.2);
    yield* openCage(cg, '피시레그', p.goal);
    const Gr = spawn('gronckle', cg, { fear: 0.45, anger: 0.2 }); C.dr = Gr; yield* until(() => Gr.root);
    Gr.goTo(cg.x, cg.z, 1.4, 0.6);
    holdItem(P, 'nip'); C.stage = 'give';
    yield* sayAll(G, [['fishlegs', '그, 그롱클… 턱 힘 8… 몸무게는… 으으…']]);
    let given = false, waitT = 0, nag = 0, hurry = 0;
    while (true) {
      const dt = yield; dust.step(dt); if (hurry > 0) hurry -= dt;
      const dG = G.dist(P.W, Gr), dF = G.dist(P.W, Fl);
      if (P.W.speed > 2.6 && dG < 6 && hurry <= 0) { hurry = 3; flee(Gr); G.hud.say('hiccup', '앗, 뛰면 놀라…', [], { secs: 1.2 }); Fl.walkTo(Gr.x + 2, Gr.z + 2, 1.8); waitT = 0; }
      if (!given) {
        spot(G, true, Fl.x, Fl.y, Fl.z);
        if (P.fTap && dF < 2.6) { given = true; holdItem(P, null); holdItem(Fl, 'nip'); Fl.pose = REACH_P; G.hud.say('hiccup', '숫자 말고, 이거. 네가 직접 내밀어 봐.', ['nip']); C.stage = 'back'; G.useSpots = []; G.hud.goal('물러서서 지켜보기'); }
        else if (P.fTap && dG < 3.2) G.hud.say('hiccup', '(내가 하면 안 돼. 피시레그가 직접 해야지.)', [], { secs: 1.6 });
        if ((nag += dt) > 12) { nag = 0; G.hud.say('fishlegs', '방어력… 은신… 히, 히컵!', [], { secs: 1.4 }); }
      } else {
        Fl.faceTo(Gr.x, Gr.z); Fl.pose = REACH_P;
        if (dG > 4.2 && hurry <= 0) waitT += dt; else { waitT = Math.max(0, waitT - dt); if (dG < 3) { Gr.faceTo(P.W.x, P.W.z); if ((nag += dt) > 3) { nag = 0; G.hud.say('hiccup', '(난 물러서자. 피시레그가 직접.)', [], { secs: 1.4 }); } } }
        if (waitT > (easy ? 1.5 : 2.5)) break;
      }
      C.wait = +waitT.toFixed(1);
    }
    Gr.face = null; Gr.goTo(Fl.x + (Gr.x - Fl.x) / Math.max(0.1, G.dist(Gr, Fl)) * 1.8, Fl.z + (Gr.z - Fl.z) / Math.max(0.1, G.dist(Gr, Fl)) * 1.8, 1.2, 0.3);
    yield* until(() => Gr.arrived(), 5);
    Gr.mind.lock = 'roll'; Gr.mind.event('nip'); holdItem(Fl, null); Fl.pose = NONE; G.sfx.play('ok');
    yield* sayAll(G, [['fishlegs', '…날 좋아하나 봐! 몸이 돌처럼 단단해!']]);
    Gr.mind.lock = 'idle'; Fl.manual = true; riders.push({ H: Fl, D: Gr }); D.push(Gr); park(Gr, 0);
    G.hud.banner('피시레그 + 그롱클', 'heart', 2.4);
  }
  /* ── 2. 스노트라우트 + 나이트메어: (피시레그를 보고) 먼저 망치를 내려놓음 → 고함 → 몸에 불 → 내가 사이에서 손 내밀기 ── */
  {
    const p = PAIR[1], cg = cages[p.cage], Sn = F.snotlout; G.hud.goal(p.goal); C.fr = [Sn];
    holdItem(Sn, null); dropItem(pl.group, 'hammer', Sn.x + 0.5, Sn.y, Sn.z + 0.3, 0.4);
    yield* sayAll(G, [['snotlout', '피시레그도 했는데! 나도 해. 망치 따위 필요 없어!', ['hammer']]]);
    Sn.walkTo(cg.x + (c.x - cg.x) * 0.3, cg.z + (c.z - cg.z) * 0.3, 2.2);
    yield* openCage(cg, '스노트라우트', p.goal);
    const Nm = spawn('nightmare', cg, { fear: 0.3, anger: 0.3 }); C.dr = Nm; yield* until(() => Nm.root && Sn.arrived(), 6);
    Nm.goTo(cg.x, cg.z, 1.4, 0.6); yield* until(() => Nm.arrived(), 3);
    Sn.faceTo(Nm.x, Nm.z); Sn.pose = { cheer: 1 };
    yield* sayAll(G, [['snotlout', '나는 스노트라우트다아!']]);
    const np = { blaze: 1, crouch: 0.6, jaw: 0.3 }; Nm.pose = np; Nm.faceTo(Sn.x, Sn.z); G.sfx.play('roar'); Sn.pose = { cower: 1 };
    G.hud.say('hiccup', '쉿! 소리 지르면 안 돼.', [], { secs: 1.4 }); C.stage = 'between';
    let prog = 0, drift = 0; const need = easy ? 1.4 : 2.0;
    while (prog < need) {
      const dt = yield; drift += dt;
      if (drift > 3) { drift = 0; const a = Math.atan2(Sn.x - Nm.x, Sn.z - Nm.z) + (G.rng() - 0.5) * 0.8; Nm.goTo(Nm.x + Math.sin(a) * 0.9, Nm.z + Math.cos(a) * 0.9, 0.8, 0.2); }
      Nm.faceTo(Sn.x, Sn.z);
      const hx = Nm.x + Math.sin(Nm.yaw) * 2.6, hz = Nm.z + Math.cos(Nm.yaw) * 2.6; C.head = C.head || { x: 0, z: 0 }; C.head.x = hx; C.head.z = hz;   // 주둥이
      const ex = Sn.x - hx, ez = Sn.z - hz, L2 = ex * ex + ez * ez || 1, u = ((P.W.x - hx) * ex + (P.W.z - hz) * ez) / L2, pd = Math.abs((P.W.x - hx) * ez - (P.W.z - hz) * ex) / Math.sqrt(L2);
      const btw = u > 0.1 && u < 0.9 && pd < 1.2; if (btw) turnTo(P, hx, hz, dt);
      if (btw && P.reach) prog += dt; else prog = Math.max(0, prog - dt * 0.4);
      np.blaze = 1 - prog / need * 0.9; np.crouch = 0.6 * (1 - prog / need);
      spot(G, easy, (Sn.x + hx) / 2, Nm.y, (Sn.z + hz) / 2);
      C.prog = +prog.toFixed(2); C.btw = btw;
    }
    G.useSpots = []; C.head = null; Nm.pose = { blaze: 0, pupil: 1, headUp: -0.3 };
    yield* sayAll(G, [['hiccup', '이제 너도 손만. 조용히.']]);
    Sn.pose = { reach: 1 }; Nm.goTo(Sn.x + (Nm.x - Sn.x) * 0.45, Sn.z + (Nm.z - Sn.z) * 0.45, 0.8, 0.3); yield* until(() => Nm.arrived(), 4);
    G.sfx.play('ok'); Sn.pose = NONE;
    yield* sayAll(G, [['snotlout', '봤지? 이 몸이 원래 드래곤이랑 잘 맞아.']]);
    Nm.pose = NONE; Nm.mind.lock = 'idle'; Sn.manual = true; riders.push({ H: Sn, D: Nm }); D.push(Nm); park(Nm, 1);
    G.hud.banner('스노트라우트 + 나이트메어', 'heart', 2.4);
  }
  /* ── 3. 쌍둥이 + 지플백: 두 머리가 함께 숙여질 때 "지금!"(F) — 박자가 어긋나면 서로 부딪힘 ── */
  {
    const p = PAIR[2], cg = cages[p.cage], Ru = F.ruff, Tu = F.tuff; G.hud.goal(p.goal); C.fr = [Ru, Tu];
    yield* sayAll(G, [['twins', '우리도! 아니, 내가 먼저!']]);
    const m = { x: cg.x + (c.x - cg.x) * 0.3, z: cg.z + (c.z - cg.z) * 0.3 }; Ru.walkTo(m.x - 1.2, m.z, 2.2); Tu.walkTo(m.x + 1.2, m.z, 2.2);
    yield* openCage(cg, '쌍둥이', p.goal);
    const Zb = spawn('zippleback', cg, { fear: 0.3, anger: 0.25 }); C.dr = Zb; C.zb = Zb; yield* until(() => Zb.root);
    Zb.goTo(cg.x, cg.z, 1.4, 0.6); yield* until(() => Zb.arrived(), 4);
    Ru.faceTo(Zb.x, Zb.z); Tu.faceTo(Zb.x, Zb.z);
    yield* sayAll(G, [['twins', '왼쪽 머리는 내 거! — 아니, 둘 다 내 거!']]);
    C.stage = 'twins';
    const pA = easy ? 2.2 : 2.0, pB = easy ? 2.2 * 1.3 : 2.6, win = easy ? 0.8 : 0.6;
    let tA = 0, tB = 0.9, cool = 0, okN = 0;
    while (okN < 1) {
      const dt = yield; puffs.step(dt); tA += dt; tB += dt; if (cool > 0) cool -= dt;
      const a = (tA % pA) / pA, b = (tB % pB) / pB, lowA = Math.abs(a - 0.5) * pA < win / 2, lowB = Math.abs(b - 0.5) * pB < win / 2;
      C.lowA = cool > 0 ? -0.4 : Math.sin(a * Math.PI) ** 2; C.lowB = cool > 0 ? -0.4 : Math.sin(b * Math.PI) ** 2;
      C.dnA = lowA && cool <= 0; C.dnB = lowB && cool <= 0;
      Ru.pose = lowA ? REACH_P : NONE; Tu.pose = lowB ? REACH_P : NONE;
      const near = Math.hypot(P.W.x - (Ru.x + Tu.x) / 2, P.W.z - (Ru.z + Tu.z) / 2) < 7;
      if (P.fTap && near && cool <= 0) {
        if (C.dnA && C.dnB && !P.mash) { okN++; }
        else { cool = 1.6; puffs.burst(Zb.x, Zb.y + 2.2, Zb.z, 14, 1.2, 1.2); G.hud.say('twins', P.mash ? '시끄러워!' : '아야! 머리 박았다!', [], { secs: 1.2 }); G.sfx.play('pop'); }
      } else if (P.fTap && !near) G.hud.say('hiccup', '(더 가까이 가서 신호를 줘야 해.)', [], { secs: 1.2 });
      spot(G, easy, Zb.x, Zb.y, Zb.z);
    }
    C.lowA = C.lowB = 0.6; G.useSpots = []; G.hud.say('hiccup', '지금!', [], { secs: 0.8 });
    Ru.pose = PET_P; Tu.pose = PET_P; G.sfx.play('ok');
    yield* sayAll(G, [['twins', '…우리 둘이 같은 걸 했어!']]);
    C.zb = null; Ru.pose = Tu.pose = NONE; Ru.manual = Tu.manual = true; riders.push({ H: Ru, D: Zb, side: 0.55 }, { H: Tu, D: Zb, side: -0.55 }); D.push(Zb); park(Zb, 2);
    G.hud.banner('쌍둥이 + 지플백', 'heart', 2.4);
  }
  /* ── 4. 아스트리드 + 내더: 내가 턱 긁기를 보여 줌(살금살금 → 턱 밑 F 길게) → 물러서서 지켜봄 → 아스트리드가 직접 ── */
  {
    const p = PAIR[3], cg = cages[p.cage], As = F.astrid; G.hud.goal(p.goal); C.fr = [As];
    As.walkTo(cg.x + (c.x - cg.x) * 0.45, cg.z + (c.z - cg.z) * 0.45, 2.2);
    yield* sayAll(G, [['astrid', '내 차례야. 어떻게 하는지 보여 줘.']]);
    yield* openCage(cg, '아스트리드', p.goal);
    const Nd = spawn('nadder', cg, { fear: 0.4, anger: 0.2 }); C.dr = Nd; yield* until(() => Nd.root);
    Nd.goTo(cg.x, cg.z, 1.4, 0.6); yield* until(() => Nd.arrived(), 4);
    Nd.mind.lock = 'watch'; Nd.stay(); C.stage = 'demo';
    let chinT = 0, hurry = 0, flop = false, wary = 0.55; const np = { spines: 0, crouch: 0, lie: 0 }; Nd.pose = np;
    while (!flop) {
      const dt = yield; dust.step(dt); if (hurry > 0) hurry -= dt;
      const d = G.dist(P.W, Nd), M = Nd.mind;
      if (d < 7 && (P.W.low || P.W.speed < 0.3)) wary -= dt * (P.reach ? 0.35 : 0.22); else if (d < 5 && P.W.speed > 1.8) wary += dt * 0.3;
      wary = clamp01(wary); M.fear = wary; M.anger = 0; np.crouch = wary * 0.5;
      Nd.faceTo(P.W.x, P.W.z);
      if (P.W.speed > 2.6 && d < 7 && hurry <= 0) { hurry = 2.5; np.spines = 1; wary = clamp01(wary + 0.4); Nd.goTo(Nd.x + (Nd.x - P.W.x) / d * 2.5, Nd.z + (Nd.z - P.W.z) / d * 2.5, 2.6, 0.4); G.hud.say('hiccup', '앗, 가시를 세웠어. 살금살금.', [], { secs: 1.4 }); chinT = 0; }
      if (hurry <= 0) np.spines = Math.max(0, np.spines - dt);
      const hx = Nd.x + Math.sin(Nd.yaw) * 2.3, hz = Nd.z + Math.cos(Nd.yaw) * 2.3; C.chin = C.chin || { x: 0, z: 0 }; C.chin.x = hx; C.chin.z = hz;
      if (Math.hypot(P.W.x - hx, P.W.z - hz) < 1.6) turnTo(P, Nd.x, Nd.z, dt);
      if (P.reach && Math.hypot(P.W.x - hx, P.W.z - hz) < 1.5 && Nd.rig.pupil > 0.55 && hurry <= 0) { chinT += dt; if (chinT > (easy ? 0.8 : 1.2)) flop = true; } else chinT = Math.max(0, chinT - dt);
      spot(G, easy && d < 6, hx, Nd.y, hz);
      if (G.diff === 'easy') G.hud.mood(Nd.rig.pupil);
    }
    np.lie = 1; np.spines = 0; Nd.mind.lock = 'flop'; G.sfx.play('purr'); G.useSpots = [];
    yield* sayAll(G, [['astrid', '턱 밑…? 저렇게?']]);
    G.hud.goal('물러서서 지켜보기'); C.stage = 'back';
    let watchT = 0, ask = 0;
    while (watchT < 3) {
      const dt = yield; const d = G.dist(P.W, Nd);
      const ax = Nd.x + Math.sin(Nd.yaw) * 2.2, az = Nd.z + Math.cos(Nd.yaw) * 2.2;
      if (d > 5.2) { if (!As.target && watchT === 0 && Math.hypot(As.x - ax, As.z - az) > 0.9) As.walkTo(ax, az, 1.3); if (Math.hypot(As.x - ax, As.z - az) < 0.9) { As.target = null; As.faceTo(Nd.x, Nd.z); As.pose = REACH_P; watchT += dt; } }
      else { As.target = null; As.pose = NONE; watchT = 0; if ((ask -= dt) <= 0) { ask = 4; G.hud.say('astrid', '조금만 물러나 줄래?', [], { secs: 1.4 }); } }
      C.wait = +watchT.toFixed(1);
    }
    np.lie = 0.6; As.pose = NONE; G.sfx.play('ok');
    yield* sayAll(G, [['astrid', '…착하다. 너, 착하구나.']]);
    np.lie = 0; Nd.mind.lock = 'idle'; As.manual = true; riders.push({ H: As, D: Nd }); D.push(Nd);
    G.hud.banner('아스트리드 + 내더', 'heart', 2.4);
  }
  /* ── 와! — 여섯째 우리에서 작은 테러도 · 아스트리드 뒤에 타고 · 다섯 드래곤이 솟아오름 ── */
  const cgT = cages[5];
  let Tr = null;
  if (cgT) { yield* timed(0.9, (k) => cgT.open(k)); Tr = G.dragon('terror', { x: cgT.door.x * 0.95, z: cgT.door.z * 0.95, yaw: cgT.yaw }, { mind: { fear: 0.2, curious: 0.9 }, noCollide: true }); Tr.mind.lock = 'idle'; Tr.goTo(D[0].x, D[0].z, 6, 1.4); Tr.pose = { flapRate: 1, fold: 0 }; Tr.rigY = 1.4; C.tr = Tr; G.hud.say('fishlegs', '작은 테러도 따라 나왔어!', [], { secs: 1.6 }); }
  const Nd = D[3];
  G.hud.hint(''); if (G.runner) { G.runner.hintLv = 0; G.runner.idleT = 0; }
  G.hud.goal('아스트리드 뒤에 타기'); C.stage = 'ride'; C.mount = { x: +Nd.x.toFixed(1), z: +Nd.z.toFixed(1) }; G.useSpots = [{ x: Nd.x, y: Nd.y, z: Nd.z }];
  yield* until(() => P.fTap && G.near(Nd, 3.4));
  G.useSpots = []; G.hud.goal(''); C.stage = 'up'; C.mount = null; C.perch = true;
  P.cam = 'ride'; const me = { root: P.root, rig: P.rig };
  riders.push({ H: me, D: Nd, back: 0.85 });
  let rt = 0; const cam = G.camera, cc = new THREE.Vector3(), lk = new THREE.Vector3(), fly = { flapRate: 1, fold: 0, glide: 0.2 };
  for (const d of D) { d.stay(); d.pose = fly; }
  /* 오름은 놀이 시간으로(걸음) · 카메라는 구덩이 바닥 문 쪽에서 무리의 가운데를 올려다봄(함께 조금 오름) */
  const rise = (dt) => { rt += dt; const k = Math.min(1, rt / 4.5), e = k * k * (3 - 2 * k); for (let i = 0; i < D.length; i++) D[i].rigY = e * (16 + i * 1.5) + Math.sin(rt * 2 + i) * 0.3 * e; return e; };
  C.rise = (dt) => {
    let n = 0; lk.set(0, 0, 0); for (const d of D) if (d.root) { lk.add(d.root.position); n++; } if (!n) return; lk.multiplyScalar(1 / n);
    const e = Math.min(1, rt / 4.5);
    cc.set(c.x + (gate.x - c.x) * 0.7, (pl.anchors.center ? pl.anchors.center.y : 9) + 1.7 + e * 8, c.z + (gate.z - c.z) * 0.7);
    if (!C.camSet) { C.camSet = true; cam.position.copy(cc); } else cam.position.lerp(cc, Math.min(1, dt * 2.5));
    cam.lookAt(lk.x, lk.y + 2, lk.z);
  };
  P.hidden = false;
  { let mx = 0, mz = 0, n = 0, rr = 0; for (const d of D) { mx += d.x; mz += d.z; n++; } if (n) { mx /= n; mz /= n; for (const d of D) rr = Math.max(rr, Math.hypot(d.x - mx, d.z - mz)); if (pl.netHole) pl.netHole(mx, mz, rr + 3.5); } }   // 솟아오르는 무리 위 그물에 구멍
  G.sfx.play('whoosh');
  G.hud.say('fishlegs', '와아아—!', [], { secs: 1.4 }); G.hud.say('snotlout', '나는 스노트라우트다아!', [], { secs: 1.6 });
  yield* timed(3, (k, dt) => rise(dt));
  G.hud.banner('다섯 드래곤이 훈련장 위로 솟아올랐다!', 'wing', 4); G.sfx.play('ok');
  yield* timed(2.6, (k, dt) => rise(dt));
  G.flags.friendsFly = true;
  return true;
}
function friendsSense(G, C) {
  const dr = C.dr;
  const o = { stage: C.stage || '', door: C.door || null, mount: C.mount || null, wait: C.wait || 0, prog: C.prog || 0 };
  if (dr && dr.root && G.vis(dr.x, dr.y + 1.2, dr.z)) o.dr = { kind: dr.kind, x: +dr.x.toFixed(2), z: +dr.z.toFixed(2), yaw: +dr.yaw.toFixed(2), pupil: +(dr.rig.pupil || 0).toFixed(2), spines: +(dr.rig.spines || 0).toFixed(2), lie: +(dr.rig.lie || 0).toFixed(2) };
  if (C.stage === 'twins') { o.dnA = !!C.dnA; o.dnB = !!C.dnB; }
  if (C.stage === 'demo' && C.chin) o.chin = { x: +C.chin.x.toFixed(2), z: +C.chin.z.toFixed(2) };
  if (C.stage === 'between' && C.head) o.head = { x: +C.head.x.toFixed(2), z: +C.head.z.toFixed(2) };
  const fr = (C.fr || []).filter((h) => h.root && G.vis(h.x, h.y + 1, h.z));
  if (fr.length) o.fr = { x: +(fr.reduce((a, h) => a + h.x, 0) / fr.length).toFixed(2), z: +(fr.reduce((a, h) => a + h.z, 0) / fr.length).toFixed(2) };
  return o;
}

/* 회관·선착장·사이 감각 */
function btwSense(G, C) { const T = C.T, S = C.St, H = C.head; return { tl: T && T.root && G.vis(T.x, T.y + 1, T.z) ? { x: +(H ? H.x : T.x).toFixed(2), z: +(H ? H.z : T.z).toFixed(2), moving: T.speed > 0.3 } : null, st: S && S.root && G.vis(S.x, S.y + 0.8, S.z) ? { x: +S.x.toFixed(2), z: +S.z.toFixed(2), moving: S.speed > 0.3 } : null, prog: +(C.prog || 0).toFixed(2), btw: !!C.btw }; }

export const chapter = {
  id: 9, title: '9장 · 마지막 시험', sub: '훈련장 → 큰 회관 → 선착장 → 훈련장',
  steps: [
    { id: '9-1', verb: 'approach', place: 'arena', time: 'day', goal: '나이트메어 진정시키기', limit: 120,
      hints: { 1: '칼을 든 채로는 무서워해. 나를 볼 때 내려놓자.', 2: '나를 볼 때 F 짧게(칼 → 투구) · 살금살금(Shift) 다가가 F 길게.' }, run: lastTest,
      sense: (G, C) => ({ stage: C.stage || '', reachT: +(C.reachT || 0).toFixed(2), nm: dSense(G, C.N, { blaze: +((C.N && C.N.rig && C.N.rig.blaze) || 0).toFixed(2) }) }) },
    { id: '9-2', verb: 'dodge', place: 'arena', time: 'day', goal: '불을 피해 버티기', limit: 60,
      hints: { 1: '몸이 달아오르고 입을 벌리면 쏠 거야!', 2: '쏘는 순간 옆으로 구르기(방향키 + Space).' }, run: fury,
      sense: (G, C) => ({ t: +(C.t || 0).toFixed(1), hits: C.hits || 0, nm: dSense(G, C.N, { warn: !!C.warn, shot: !!C.shot }) }) },
    { id: '9-3', verb: 'approach', place: 'arena', time: 'day', goal: '아빠와 투슬리스 사이에서 손 내밀기', limit: 90,
      hints: { 1: '둘 사이에 서야 해. 둘이 움직이면 나도 옮기자.', 2: '사이에 서서 F 길게 — 옮기면 손을 떼고 다시 사이로.' }, run: between, sense: btwSense },
    { id: '9-4', verb: 'listen', howtoVerb: 'tell9', place: 'hall', time: 'overcast', goal: '아빠에게 말하기', limit: 120,
      hints: { 1: '아빠 곁에 있어야 말이 이어져.', 2: '아빠 가까이에서 F로 책을 보여 주자.' }, run: hall, sense: hallSense },
    { id: '9-5', place: 'village', time: 'fog', at: 'dock_end', run: departure, sense: () => ({}) },
    { id: '9-6', place: 'village', time: 'fog', atNew: 'dock_end', run: astrid,
      sense: (G, C) => { const A = C.As; return { stage: C.stage || '', target: A && A.root ? { x: +A.x.toFixed(1), z: +A.z.toFixed(1) } : null }; } },
    { id: '9-7', verb: 'approach', place: 'arena', time: 'overcast', at: 'gate', goal: '친구들과 드래곤 이어 주기', limit: 300,
      hints: { 1: '우리 문 앞에 친구가 서 있어. 문을 열어 주자(F).', 2: '서두르면 달아나 · 사이에서 F 길게 · 두 머리가 함께 숙일 때 F.' }, run: friends, sense: friendsSense },
  ],
};
