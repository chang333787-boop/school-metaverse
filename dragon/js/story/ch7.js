// 7장 아빠의 투구(design §2 · reference #17·#18) — ① 오해 대화 + 숫돌 박자[걸으며 듣기] ② 투구 선물(이음) ③ 최종 선발: 아스트리드보다 먼저 그롱클 진정[다가가 + 피하기]
// ④ 원로 지목 · 관중석이 터짐 → '내일 나이트메어' 게시판(이음) ⑤ 몰래 떠날 준비 — 눈길 피해 짐 넷[숨기] ⑥ 코브에 짐 보따리(이음 → 8장이 G.flags.pack을 씀)
// 와! = 관중석이 터지는 순간 → 게시판 앞에서 웃음이 사라짐 · 변화 = 히컵 머리에 투구 · 경기장 자리를 맡는 마을 사람들 · 코브에 짐 보따리
// 대사는 모두 우리 말로 새로(저작권) · 실제 학생 이름 X · 피·죽음 X · 깜짝 X(예고 먼저)
import * as THREE from 'three';
import { wait, until, sayAll } from './runner.js?v=16';
import { holdItem, makeItem, makePuffs } from './fx.js?v=16';
import { toon, flameMesh, glowSprite } from '../look/kit.js?v=16';
import { createGrind, setHelmet, helmetObj, makePack, gazeFan, headMark, crowd, crowdPose, pz } from './fx79.js?v=16';
import { tlSense } from './ch4.js?v=16';

const WARN = { easy: 3, normal: 2.5, hard: 2 };
const ang = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
/* 쉬움 F 표시 그릇 — 매 걸음 같은 배열·같은 점을 다시 씀(new X) */
const SP = [0, 1, 2, 3, 4].map(() => ({ x: 0, y: 0, z: 0 })), SPA = [];
function spot(G, on, x, y, z, add) { if (!add) SPA.length = 0; if (on && SPA.length < SP.length) { const s = SP[SPA.length]; s.x = x; s.y = y; s.z = z; SPA.push(s); } G.useSpots = SPA; }
const NONE = {}, GAP_P = { jaw: 0.25, headUp: -0.3 }, TIRED_P = { jaw: 0.3, headUp: -0.4, crouch: 0.3 }, HIT_P = { crouch: 0.8 }, HAMMER_P = { hammer: 1 };   // 자세 그릇(매 걸음 new X)

/* ① 오해 대화 — 아빠는 훈련장 얘기, 히컵은 들킨 줄 앎(고르기 없음 · 엇갈리는 웃음) · 숫돌이 돌아야 말이 이어짐(서면 아빠가 "듣고 있니?") */
const TALK = [
  ['stoick', '히컵. 잠깐 얘기 좀 하자.'],
  ['hiccup', '(헉… 아빠가 대장간에?)'],
  ['stoick', '…드래곤 얘기다.'],
  ['hiccup', '아, 아빠! 그게요, 제가 다 설명할게요…!'],
  ['stoick', '숨길 것 없다. 다 들었으니까.'],
  ['hiccup', '다… 들으셨어요? 정말 다요?'],
  ['stoick', '그롱클이 데굴데굴! 내더가 털썩!', ['shield']],
  ['hiccup', '…네?'],
  ['stoick', '훈련장 얘기 말이다! 온 마을이 네 얘기뿐이야.'],
  ['hiccup', '아… 훈련장. 하하, 네. 훈련장이요.'],
  ['stoick', '근데 왜 그렇게 땀을 흘리냐?'],
  ['hiccup', '숫돌이… 뜨거워서요.'],
];
function* talk(G, C) {
  const P = G.player, A = G.place.anchors, gr = A.forge_grind || A.forge_anvil, fr = A.forge_front || gr, easy = G.diff === 'easy';
  holdItem(P, 'knife');
  G.hud.goal('숫돌에서 칼 갈기'); G.useSpots = [{ x: gr.x, y: gr.y, z: gr.z }]; C.stage = 'go';
  yield* until(() => G.near(gr, 2.4) && P.fTap);
  G.useSpots = []; P.lock = true; C.stage = 'grind';
  const g = createGrind(G, easy); g.show(); C.g = g; G.hud.howto('rhythm', 8);
  C.cleanup = () => { g.hide(); P.lock = false; };
  /* 아빠가 밖에서 걸어 들어옴(이어지는 차례에서도 남음) */
  const S = G.castBy.stoick || G.person('stoick', { x: fr.x - 9, z: fr.z + 1, yaw: Math.PI / 2 }, { keep: 'stoick' });
  S.walkTo(gr.x - 1.9, gr.z - 1.1, 1.5);
  let li = 0, stopT = 0, nagged = false;
  while (li < TALK.length || G.hud.busy()) {
    const dt = yield; const k0 = g.S.k; g.step(dt, G.input); if (g.S.k !== k0 && G.runner) G.runner.idleT = 0;   // 박자를 맞추는 동안은 '멈춤' 힌트 X
    if (S.arrived()) S.faceTo(P.W.x, P.W.z);
    const run = easy || g.speed() > 0.3;
    if (!run) stopT += dt; else { stopT = 0; nagged = false; }
    if (!G.hud.busy() && li < TALK.length && S.arrived()) {
      if (run) { const l = TALK[li++]; G.hud.say(l[0], l[1], l[2] || []); S.pose = { talk: l[0] === 'stoick' ? 1 : 0 }; }
      else if (stopT > 2.5 && !nagged) { nagged = true; G.hud.say('stoick', li ? '…숫돌이 섰구나. 듣고 있니?' : '…일하는 중이었냐?', [], { secs: 2.2 }); }
    }
    C.li = li;
  }
  g.hide(); P.lock = false; holdItem(P, null); C.stage = 'done';
  return true;
}

/* ② 투구 선물(이음) — 아빠가 내민 것을 받음(F) → 엄마 가슴판의 반쪽 · 쓰면 둘이 같은 무늬 · "기쁜데… 무겁다" */
function* gift(G, C) {
  const P = G.player, A = G.place.anchors, gr = A.forge_grind || A.forge_anvil;
  const S = G.castBy.stoick || G.person('stoick', { x: gr.x - 1.9, z: gr.z - 1.1, yaw: 0 }, { keep: 'stoick' });
  yield* until(() => S.root && P.root);
  if (!G.flags.helmet && P.helmOn) yield* awaitP(setHelmet(G, false));
  S.faceTo(P.W.x, P.W.z); S.pose = { talk: 1 };
  yield* sayAll(G, [['stoick', '그래서 말인데… 너한테 줄 게 있다.']]);
  const hm = helmetObj(G.place.group, 0, 0, 0); if (S.bones && S.bones.handR) { S.bones.handR.add(hm); hm.position.set(0, -0.05, 0.12); hm.rotation.set(0, 0, 0); }
  C.cleanup = () => hm.removeFromParent();
  S.pose = { reach: 1 };
  G.hud.goal('아빠가 내민 것 받기'); G.useSpots = [{ x: S.x, y: S.y, z: S.z }]; C.stage = 'take';
  yield* until(() => P.fTap && G.near(S, 2.8));
  G.useSpots = []; G.hud.goal(''); hm.removeFromParent(); C.stage = 'talk';
  S.pose = { talk: 1 };
  yield* sayAll(G, [['stoick', '네 엄마 것으로 만들었다. 엄마 가슴판의 반쪽이지.', ['heart']], ['stoick', '나머지 반쪽은… 여기, 내 투구에 있고.']]);
  S.pose = { point: 0.6 };
  yield* awaitP(setHelmet(G, true));
  G.sfx.play('ok'); G.hud.banner('투구 — 아빠와 같은 무늬(엄마 가슴판의 반쪽)', 'heart', 4);
  S.pose = { talk: 1 };
  yield* sayAll(G, [['stoick', '잘 어울리는구나. 내일 최종 선발, 기대하마.'], ['hiccup', '…고마워요, 아빠.']]);
  S.pose = {}; S.walkTo(gr.x - 12, gr.z + 1, 1.5);
  yield* sayAll(G, [['hiccup', '(기쁜데… 무겁다.)']]);
  return true;
}

/* ③ 최종 선발 — 그롱클은 '가까운 사람'을 쏨 · 아스트리드는 자기를 쏜 틈에 도끼로 침(셋이면 기절 = 손해 → 다시) · 나는 먼저 진정:
   풀 = 쏜 뒤 숨 고를 때 가까이서 F 짧게 · 방패 = 볼이 부풀 때 F(멀리서) → 조준이 흐려지고 나를 봄 → 여섯 발 다 쓰면 지쳐서 손 내밀기(F 길게)로 */
function* finale(G, C) {
  const P = G.player, pl = G.place, c = pl.anchors.center || { x: 0, z: 0 }, L = pl.lists.crowd || [], easy = G.diff === 'easy';
  const fans = crowd(G, 10); crowdPose(fans, 'cheer', 0);
  const St = G.castBy.stoickRim || (L[10] && G.person('stoick', L[10], { keep: 'stoickRim', noCollide: true }));
  const Fl = G.castBy.fishlegs || (L[19] && G.person('fishlegs', L[19], { keep: 'fishlegs', noCollide: true }));
  const Gb = G.castBy.gobber || G.person('gobber', { x: c.x + 2.2, z: c.z + 17, yaw: Math.PI }, { keep: 'gobber', noCollide: true });
  G.putPlayer({ x: c.x - 9, z: c.z - 11, yaw: 0.35 });
  holdItem(P, 'shield');
  const Gr = G.dragon('gronckle', { x: c.x, z: c.z + 2, yaw: Math.PI }, { mind: { fear: 0.1, anger: 0.5 }, noCollide: true }); Gr.solid = true; Gr.radius = 1.6; Gr.mind.lock = 'watch'; C.Gr = Gr;
  const As = G.person('astrid', { x: c.x + 7, z: c.z - 6, yaw: -0.8 }, { noCollide: true }); C.As = As;
  yield* until(() => Gr.root && As.root);
  holdItem(As, 'axe');
  const lava = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), toon({ color: 0xd8642a, emissive: 0x8a2a08 })); lava.visible = false; pl.group.add(lava);
  const fl = flameMesh(1.3); fl.visible = false; pl.group.add(fl); const gl = glowSprite(0xff8a3a, 4, 0.5); gl.visible = false; pl.group.add(gl);
  const puffs = makePuffs(pl.group, 90, 0x3a3430);
  C.cleanup = () => { lava.removeFromParent(); lava.geometry.dispose(); fl.removeFromParent(); gl.removeFromParent(); puffs.mesh.removeFromParent(); puffs.mesh.geometry.dispose(); };
  if (G.runner && G.runner.fails > 0) yield* sayAll(G, [['gobber', '한 판 더! 시작!', ['shield']]]);   // 다시 할 때는 짧게
  else yield* sayAll(G, [['gobber', '최종 선발! 먼저 눕히는 사람이 이긴다!', ['shield']], ['astrid', '이번엔 내가 이겨.'], ['fishlegs', '그롱클은 가까운 사람을 노려! 쏜 다음엔 숨을 골라!'], ['hiccup', '(눕히는 게 아니라… 진정시키는 거야.)']]);
  const need = { easy: 4, normal: 3, hard: 2 }[G.diff] || 3, GAP = { easy: 3, normal: 2.2, hard: 1.6 }[G.diff] || 2.2;
  const N = ['한 발!', '두 발!', '세 발!', '네 발!', '다섯 발!', '여섯 발! 이제 못 쏴!'];
  let shots = 0, hits = 0, aHits = 0, next = 1.5, hab = 0, blur = false, tgt = null, ball = null, gapT = 0, down = 0, startle = 0, reachT = 0, calm = false;
  const aS = { mode: 'circle', t: 0, ang: Math.atan2(As.x - Gr.x, As.z - Gr.z), swing: 0 };
  while (!calm) {
    const dt = yield; puffs.step(dt); hab = Math.max(0, hab - dt * 0.5); if (startle > 0) startle -= dt;
    const M = Gr.mind, dP = G.dist(P.W, Gr), dA = Math.hypot(As.x - Gr.x, As.z - Gr.z), tired = shots >= 6 && !ball;
    crowdPose(fans, aHits > 0 || shots > 0 ? 'cheer' : 'murmur', G.t);
    /* 쏘기 박자 — 쏠 때는 가까운 사람(방패 소리가 나면 나) */
    if (!tired && !ball && M.warnT <= 0 && M.beh !== 'attack' && gapT <= 0) { next -= dt; if (next <= 0) { M.windup(WARN[G.diff]); tgt = dP <= dA + 0.5 ? 'me' : 'as'; blur = false; } }
    if (M.warnT > 0) { const T = tgt === 'me' ? P.W : As; Gr.faceTo(T.x, T.z); } else if (tired) Gr.faceTo(P.W.x, P.W.z);
    /* 방패 두드리기(멀리서 F) — 볼이 부풀 때만 통함 · 그롱클이 나를 봄 · 연타는 익숙해짐 */
    if (P.fTap && dP >= 3.2 && !down) {
      P.pose = { hammer: 1 }; C.bangT = 0.25; G.sfx.play('bang'); M.event('loud');
      if (M.warnT > 0 && hab < 3) { blur = true; tgt = 'me'; puffs.burst(Gr.x, Gr.y + 1.6, Gr.z, 6, 1, 1); G.hud.say('fishlegs', '조준이 흐려졌어!', [], { secs: 1 }); }
      else hab += 1;
    }
    if (C.bangT > 0) { C.bangT -= dt; if (C.bangT <= 0 && !down) P.pose = null; }
    /* 쏨 — 예고 끝에 본 자리로(흐리면 3m 빗나감) · 0.9초 포물선 */
    if (M.beh === 'attack' && !ball && M.warnT <= 0) {
      const T = tgt === 'me' ? P.W : As, off = blur ? 3.2 : 0, a = G.t * 3.1;
      ball = { t: 0, sx: Gr.x, sz: Gr.z, sy: Gr.y + 1.4, tx: T.x + Math.cos(a) * off, tz: T.z + Math.sin(a) * off, ty: pl.height(T.x, T.z, 9), who: tgt };
      lava.visible = true; shots++; G.hud.say('fishlegs', N[shots - 1], [], { secs: 1.1 }); next = 1.2 + G.rng() * 0.8;
      if (tgt === 'as') { aS.mode = 'dodge'; aS.t = 0; }
    }
    if (ball) {
      ball.t += dt / 0.9; const k = Math.min(1, ball.t);
      lava.position.set(ball.sx + (ball.tx - ball.sx) * k, ball.sy + (ball.ty - ball.sy) * k + Math.sin(k * Math.PI) * 3, ball.sz + (ball.tz - ball.sz) * k);
      if (k >= 1) {
        lava.visible = false; puffs.burst(ball.tx, ball.ty + 0.2, ball.tz, 24, 3, 3); G.sfx.play('fire');
        fl.position.set(ball.tx, ball.ty, ball.tz); gl.position.set(ball.tx, ball.ty + 0.8, ball.tz); fl.visible = gl.visible = true; C.fireT = 2;
        if (ball.who === 'me' && Math.hypot(P.W.x - ball.tx, P.W.z - ball.tz) < 1.6 && !(P.W.rollT > 0)) {
          if (easy) G.hud.say('hiccup', '앗 뜨거!', [], { secs: 0.8 });
          else { hits++; down = 2.2; P.lock = true; P.pose = { stumble: 1 }; G.hud.say('hiccup', hits < 3 ? '으윽… 방패가 무거워.' : '…졌다.', [], { secs: 1.4 }); }
        }
        gapT = GAP; if (ball.who === 'as' || tired) aS.mode = 'lunge';
        ball = null;
      }
    }
    if (C.hitT > 0) { C.hitT -= dt; Gr.pose = HIT_P; } else if (tired) Gr.pose = TIRED_P; else if (gapT > 0) Gr.pose = GAP_P; else Gr.pose = NONE;
    if (gapT > 0) gapT -= dt;
    if (C.fireT > 0) { C.fireT -= dt; if (C.fireT <= 0) fl.visible = gl.visible = false; }
    if (down > 0) { down -= dt; if (down <= 0) { P.lock = false; P.pose = null; } }
    /* 아스트리드 — 둘레를 돌다(6m) · 자기를 쏘면 구르고 · 그 틈에(또는 그롱클이 지치면) 도끼로 침 */
    aS.t += dt;
    if (aS.mode === 'circle') { aS.ang += dt * 0.22; As.walkTo(Gr.x + Math.sin(aS.ang) * 6, Gr.z + Math.cos(aS.ang) * 6, 1.4); As.faceTo(Gr.x, Gr.z); As.pose = NONE; if (tired) { aS.mode = 'lunge'; aS.t = 0; } }
    else if (aS.mode === 'dodge') { pz(As, 'rollDodge', Math.min(1, aS.t / 0.45)); if (aS.t < 0.5) As.walkTo(As.x + Math.cos(aS.ang) * 3, As.z - Math.sin(aS.ang) * 3, 7); else { As.pose = NONE; aS.mode = 'wait'; } }
    else if (aS.mode === 'wait') { As.faceTo(Gr.x, Gr.z); }
    else if (aS.mode === 'lunge') {
      As.walkTo(Gr.x + Math.sin(aS.ang) * 1.9, Gr.z + Math.cos(aS.ang) * 1.9, easy ? 3 : 4.4);
      if (Math.hypot(As.x - Gr.x, As.z - Gr.z) < 2.3) { aS.mode = 'swing'; aS.t = 0; As.faceTo(Gr.x, Gr.z); }
    } else if (aS.mode === 'swing') {
      pz(As, 'throw', aS.t < 0.35 ? 1 : 0);
      if (aS.t > 0.35 && !aS.hit) { aS.hit = true; aHits++; M.event('hit'); C.hitT = 0.6; puffs.burst(Gr.x, Gr.y + 1.2, Gr.z, 10, 1.5, 1.5); G.sfx.play('thud'); G.hud.say('gobber', aHits < need ? '아스트리드가 한 대!' : '쿵!', [], { secs: 1 }); }
      if (aS.t > 0.9) { aS.hit = false; aS.mode = tired ? 'back' : 'circle'; As.pose = NONE; aS.t = 0; }
    } else if (aS.mode === 'back') { As.walkTo(Gr.x + Math.sin(aS.ang) * 4, Gr.z + Math.cos(aS.ang) * 4, 3); if (aS.t > (easy ? 2.2 : 1.1)) { aS.mode = 'lunge'; aS.t = 0; } }
    /* 기절 = 손해 → 다시 */
    if (aHits >= need) {
      Gr.mind.lock = 'flop'; Gr.pose = { lie: 1 }; G.hud.clearSay();
      yield* sayAll(G, [['gobber', '아스트리드가 눕혔다! …기절이구먼.'], ['hiccup', '(기절시키면 아무것도 못 알아내는데… 이번엔 먼저!)']]);
      return 'retry';
    }
    if (hits >= 3) { yield* sayAll(G, [['gobber', '히컵, 숨 고르고 다시!']]); return 'retry'; }
    /* 연타 = 놀라 물러남(기다림이 핵심) */
    if (P.mash && dP < 9 && startle <= 0) { startle = 2; M.event('loud'); Gr.goTo(Gr.x + (Gr.x - P.W.x) / dP * 2.5, Gr.z + (Gr.z - P.W.z) / dP * 2.5, 2, 0.4); G.hud.say('hiccup', '앗, 놀랐나 봐… 차분하게.', [], { secs: 1.4 }); }
    /* 진정 — 쏜 뒤 숨 고를 때(또는 지쳤을 때) 가까이서 풀(F 짧게) · 지쳤으면 손 내밀기(F 길게)도 */
    const open = gapT > 0 || tired || (easy && M.warnT <= 0 && M.beh !== 'attack' && !ball);
    if (dP < 3.4 && (P.reach || P.fTap)) P.W.yaw += ang(P.W.yaw, Math.atan2(Gr.x - P.W.x, Gr.z - P.W.z)) * Math.min(1, dt * 8);   // 내밀 때 몸을 그롱클 쪽으로
    if (dP < 3.2 && startle <= 0) {
      if (P.fTap && !P.mash) {
        if (open) { calm = true; holdItem(P, 'nip'); }
        else G.hud.say('hiccup', '아직… 쏜 다음 숨 고를 때.', [], { secs: 1.2 });
      }
      if (tired && P.reach) { reachT += dt; if (reachT > 1.0) calm = true; } else reachT = Math.max(0, reachT - dt);
    }
    spot(G, open, Gr.x, Gr.y, Gr.z);
    C.shots = shots; C.hits = hits; C.aHits = aHits; C.gap = gapT > 0; C.tired = tired; C.puff = M.warnT > 0; C.blur = blur;
  }
  /* 진정! — 그롱클이 뒹굴고 아스트리드가 멈춤 */
  Gr.mind.lock = 'roll'; Gr.mind.event('nip'); Gr.pose = {}; G.useSpots = [];
  As.walkTo(As.x, As.z, 1); As.pose = {}; As.faceTo(P.W.x, P.W.z);
  G.sfx.play('ok'); G.hud.clearSay();
  yield* sayAll(G, [['gobber', '히컵이 먼저다!'], ['astrid', '…또 너야?']]);
  holdItem(P, null);
  G.records['7-3'] = { hits, shots, astrid: aHits };
  return true;
}
function finSense(G, C) {
  const g = C.Gr, a = C.As; if (!g) return {};
  return { gr: g.root && G.vis(g.x, g.y + 1, g.z) ? { x: +g.x.toFixed(1), z: +g.z.toFixed(1), puff: !!C.puff, gap: !!C.gap, tired: !!C.tired } : null, ast: a && a.root && G.vis(a.x, a.y + 1, a.z) ? { x: +a.x.toFixed(1), z: +a.z.toFixed(1) } : null, shots: C.shots || 0, hits: C.hits || 0, aHits: C.aHits || 0 };
}

/* ④ 원로 지목(이음) — 원로님 앞에 섬 → 고버가 손을 아스트리드 위·내 위로 → 원로가 나를 가리킴 → 관중석이 터짐(와!) → 게시판: '내일 나이트메어' → 웃음이 사라짐 */
function* chosen(G, C) {
  const P = G.player, pl = G.place, c = pl.anchors.center || { x: 0, z: 0 }, L = pl.lists.crowd || [];
  const fans = crowd(G, 10); crowdPose(fans, 'murmur', 0);
  const St = G.castBy.stoickRim || (L[10] && G.person('stoick', L[10], { keep: 'stoickRim', noCollide: true }));
  const Gb = G.castBy.gobber || G.person('gobber', { x: c.x + 2.2, z: c.z + 17, yaw: Math.PI }, { keep: 'gobber', noCollide: true });
  const El = G.person('villager3', { x: c.x, z: c.z + 16.4, yaw: Math.PI }, { noCollide: true });
  const As = G.person('astrid', { x: c.x + 1.4, z: c.z + 12.6, yaw: 0 }, { noCollide: true });
  const Gr = G.dragon('gronckle', { x: c.x - 6, z: c.z - 3, yaw: 1 }, { mind: { fear: 0, anger: 0 }, noCollide: true }); Gr.mind.lock = 'roll';
  const spot = { x: c.x - 1.4, z: c.z + 12.6 }; C.spot = spot;
  yield* until(() => El.root && Gb.root);
  Gb.walkTo(c.x + 0.2, c.z + 14.2, 1.6);
  G.hud.goal('원로님 앞에 서기'); G.useSpots = [{ x: spot.x, y: 9, z: spot.z }]; C.stage = 'go';
  yield* until(() => G.near(spot, 1.6));
  G.useSpots = []; G.hud.goal(''); C.stage = 'pick'; P.lock = true;
  Gb.faceTo(P.W.x, P.W.z);
  yield* sayAll(G, [['gobber', '원로님! 누가 나이트메어를 맡을까요?'], ['gobber', '아스트리드?', [], { name: '' }]]);
  Gb.pose = { point: 1 }; Gb.faceTo(As.x, As.z); El.pose = { talk: 1 };
  yield* sayAll(G, [['villager', '(고개를 젓는다)', [], { name: '마을 원로' }]]);
  Gb.faceTo(P.W.x, P.W.z);
  yield* sayAll(G, [['gobber', '…히컵?']]);
  El.faceTo(P.W.x, P.W.z); El.pose = { point: 1 }; yield* wait(0.8);
  /* 와! — 관중석이 터짐 */
  crowdPose(fans, 'cheer', G.t); if (St) St.pose = { cheer: 1 }; Gb.pose = { cheer: 1 };
  if (P.C) { P.C.pitch = -0.08; P.C.idle = 0; }   // 카메라를 살짝 들어 관중석이 보이게(뺏지 않음 · 끌면 그대로 움직임)
  G.hud.banner('최종 선발 — 히컵!', 'shield', 3.5); G.sfx.play('ok'); G.records.rank = '히컵 — 최종 선발';
  G.hud.say('villager', '히컵! 히컵! 히컵!', [], { name: '마을 사람들', secs: 2.6 }); G.hud.say('astrid', '…다음엔 내가 이겨.');
  let t = 0; while (G.hud.busy()) { t += yield; crowdPose(fans, 'cheer', G.t); }
  /* 고버가 순위판에 붙임 → 읽으러 감 */
  P.lock = false; Gb.pose = {}; if (St) St.pose = {};
  const bd = pl.anchors.board || { x: 6, z: 14 }; Gb.walkTo(bd.x - 2.6, bd.z + 0.4, 1.8);
  if (pl.board) pl.board.setLines(['최종 선발 — 히컵', '', '내일, 마을 모두 앞에서', '몬스트러스 나이트메어를', '무찌른다']);
  G.hud.goal('순위판 보기'); G.useSpots = [{ x: bd.x, y: 9, z: bd.z }]; C.stage = 'board'; C.board = bd;
  while (!G.near(bd, 2.6)) { yield; crowdPose(fans, 'cheer', G.t); }
  G.useSpots = []; G.hud.goal(''); crowdPose(fans, 'still', 0); P.lock = true;
  yield* sayAll(G, [['hiccup', '무찌른다고…? 나이트메어를?'], ['hiccup', '(난 한 번도 무찌른 적이 없는데. 이제… 어떡하지.)']]);
  P.lock = false;
  return true;
}

/* ⑤ 몰래 떠날 준비 — 짐 넷(생선·담요·공책·물통)을 대장간 뒷방 자루에 · 들고 있을 때 마을 사람 눈길(땅의 부채꼴)에 들면 '?' → '!' 들킴 → 그 물건은 제자리로
   빈손이면 괜찮음 · 살금살금(Shift)이면 눈길이 짧아짐 · 고버 아저씨는 망치질하다 가끔 고개를 듦 */
const ITEMS = [
  { k: 'cod', n: '생선', x: 8.6, z: -4.6 },
  { k: 'cloth', n: '담요', x: -2, z: 13 },
  { k: 'book', n: '공책', x: -6.5, z: -2.5 },
  { k: 'bucket', n: '물통', x: 22.5, z: 13 },
];
function* sneak(G, C) {
  const P = G.player, pl = G.place, A = pl.anchors, easy = G.diff === 'easy';
  const sackAt = A.forge_bench || { x: 28, z: 0.8 }, an = A.forge_anvil || { x: 23.7, z: -2.4 }, fr = A.forge_front || { x: 16, z: -2 };
  const sack = makePack(pl.group, sackAt.x - 0.9, pl.height(sackAt.x - 0.9, sackAt.z, 24), sackAt.z, 0.4); sack.scale.setScalar(0.8);
  const stand = new THREE.BoxGeometry(0.7, 0.7, 0.7).translate(0, 0.35, 0), sm = toon({ color: 0x7a5a3a });
  const objs = ITEMS.map((it) => { const g = new THREE.Group(); const b = new THREE.Mesh(stand, sm); g.add(b); const o = makeItem(it.k); o.position.y = 0.85; o.scale.setScalar(1.7); o.rotation.set(0, 0.6, it.k === 'cod' ? Math.PI / 2 : 0); g.add(o); g.position.set(it.x, pl.height(it.x, it.z, 24), it.z); pl.group.add(g); return g; });
  const W = [
    { who: 'villager2', x: 10.8, z: -8.4, a0: -2.7, a1: -0.4, per: 5.5 },
    { who: 'villager1', x: -3.2, z: 2.8, a0: -0.2, a1: 3.6, per: 9 },
    { who: 'villager3', path: [[13, 9.5], [30, 12.5]], sp: 1.15 },
    { who: 'gobber', x: an.x + 0.9, z: an.z + 0.3, anvil: true },
  ];
  for (const w of W) {
    const p = w.path ? w.path[0] : [w.x, w.z];
    w.H = G.person(w.who, { x: p[0], z: p[1], yaw: w.a0 || 0 }, { noCollide: true });
    w.fan = gazeFan(pl.group, pl); w.mark = headMark(pl.group); w.sus = 0; w.yaw = w.a0 || 0; w.t = (W.indexOf(w) * 1.7) % 4; w.leg = 0;
  }
  C.cleanup = () => { sack.removeFromParent(); for (const o of objs) o.removeFromParent(); stand.dispose(); for (const w of W) { w.fan.dispose(); w.mark.dispose(); } };
  const R0 = easy ? 6.5 : 9, HALF = easy ? 0.55 : 0.7;
  const got = [false, false, false, false]; let carry = -1, caught = 0;
  C.W = W; C.got = got; C.objs = objs;
  yield* until(() => W.every((w) => w.H.root));
  yield* sayAll(G, [['hiccup', '(시험이 끝나면… 투슬리스랑 떠나자.)', ['ship']], ['hiccup', '(짐을 챙기자. 들고 가는 걸 들키면 안 돼.)', ['cod', 'book', 'bucket']]]);
  const goalTx = () => (carry >= 0 ? '대장간 뒷방 자루에 넣기 (' : '들키지 않고 짐 넷 모으기 (') + got.filter(Boolean).length + '/4)';
  G.hud.goal(goalTx());
  while (!got.every(Boolean)) {
    const dt = yield;
    /* 눈길 — 둘러보기 · 오가기 · 망치질하다 고개 듦 */
    for (const w of W) {
      w.t += dt; const H = w.H;
      if (w.path) { const [a, b] = w.path; if (H.arrived()) { if ((w.wait = (w.wait || 0) + dt) > 2.2) { w.wait = 0; w.leg = 1 - w.leg; const n = w.leg ? a : b; H.walkTo(n[0], n[1], w.sp); } else H.faceTo(H.x + Math.sin(w.t * 0.9) * 3, H.z + Math.cos(w.t * 0.9) * 3); } w.yaw = H.yaw; }
      else if (w.anvil) { const up = (w.t % 6.5) > 4.6; H.pose = up ? NONE : HAMMER_P; H.faceTo(up ? fr.x : an.x, up ? fr.z : an.z); w.yaw = H.yaw; w.off = !up; }
      else { const k = 0.5 - 0.5 * Math.cos(w.t / w.per * Math.PI * 2), y = w.a0 + (w.a1 - w.a0) * k; H.faceTo(H.x + Math.sin(y) * 4, H.z + Math.cos(y) * 4); w.yaw = H.yaw; }
      const r = w.off ? 0 : R0 * (P.W.low ? 0.55 : 1) * (w.anvil ? 0.75 : 1);
      const dx = P.W.x - H.x, dz = P.W.z - H.z, d = Math.hypot(dx, dz), inCone = r > 0 && d < r && Math.abs(ang(w.yaw, Math.atan2(dx, dz))) < HALF && G.collide.cut(H.x, H.z, P.W.x, P.W.z) >= 1;
      w.sus = carry >= 0 && inCone ? w.sus + dt * (easy ? 1.0 : 1.6) : Math.max(0, w.sus - dt * 0.7);
      w.fan.set(H.x, H.z, w.yaw, Math.max(0.01, r), HALF, w.sus > 0.15 ? 1 : 0, dt); w.fan.show(r > 0);
      w.mark.set(H.x, H.y + 2.6, H.z, w.caughtT > 0 ? 2 : w.sus > 0.15 ? 1 : 0); if (w.caughtT > 0) w.caughtT -= dt;
      if (w.sus >= 1 && carry >= 0) {
        w.sus = 0; w.caughtT = 1.6; caught++; H.faceTo(P.W.x, P.W.z);
        const it = ITEMS[carry]; objs[carry].visible = true; holdItem(P, null); carry = -1; G.hud.goal(goalTx());
        G.hud.clearSay(); G.hud.say(w.who === 'gobber' ? 'gobber' : 'villager', w.who === 'gobber' ? '히컵? 그건 왜 들고 가냐?' : '히컵? 그거 어디 가져가니?', [it.k]);
        G.hud.say('hiccup', ['아, 그냥… 제자리에 둘게요!', '하하… 심부름이요. 아니, 아니에요.', '(들켰다… 다시 조용히.)'][caught % 3]);
      }
    }
    /* 줍기 · 넣기(한 번에 하나) */
    spot(G, false);
    if (carry < 0) { for (let i = 0; i < 4; i++) if (!got[i] && objs[i].visible) { const it = ITEMS[i]; spot(G, true, it.x, objs[i].position.y + 0.6, it.z, true); if (P.fTap && Math.hypot(P.W.x - it.x, P.W.z - it.z) < 1.9) { carry = i; objs[i].visible = false; holdItem(P, it.k); G.hud.goal(goalTx()); G.hud.say('hiccup', it.n + ' 챙겼다. 대장간 뒷방 자루로… 조용히.', [it.k], { secs: 1.8 }); break; } } }
    else { spot(G, true, sackAt.x - 0.9, sack.position.y, sackAt.z, true); if (P.fTap && Math.hypot(P.W.x - (sackAt.x - 0.9), P.W.z - sackAt.z) < 2.3) { got[carry] = true; holdItem(P, null); G.hud.say('hiccup', ITEMS[carry].n + ', 자루에 쏙.', [ITEMS[carry].k], { secs: 1.2 }); carry = -1; G.hud.goal(goalTx()); G.sfx.play('pop'); } }
    C.carry = carry; C.caught = caught;
  }
  G.useSpots = [];
  yield* sayAll(G, [['hiccup', '다 모았다. 해 지기 전에 코브로…', ['ship']]]);
  G.records['7-5'] = { caught };
  return true;
}
function sneakSense(G, C) {
  if (!C.W) return {};
  const me = G.player.W, items = [];
  for (let i = 0; i < ITEMS.length; i++) if (!C.got[i] && C.objs[i].visible && G.vis(ITEMS[i].x, C.objs[i].position.y + 0.8, ITEMS[i].z, 70)) items.push({ i, x: ITEMS[i].x, z: ITEMS[i].z });
  const eyes = C.W.filter((w) => w.H.root && G.vis(w.H.x, w.H.y + 1.6, w.H.z, 70)).map((w) => ({ x: +w.H.x.toFixed(1), z: +w.H.z.toFixed(1), yaw: +w.yaw.toFixed(2), r: w.off ? 0 : (G.diff === 'easy' ? 6.5 : 9) * (w.anvil ? 0.75 : 1), half: G.diff === 'easy' ? 0.55 : 0.7, sus: w.sus > 0.15 }));
  const sk = G.place.anchors.forge_bench || { x: 28, z: 0.8 };
  return { carry: C.carry, items, eyes, sack: { x: sk.x - 0.9, z: sk.z }, got: C.got.filter(Boolean).length, caught: C.caught || 0, low: me.low };
}

/* ⑥ 코브에 짐 보따리(이음) — 쉬는 바위 곁에 내려놓음 → 투슬리스가 킁킁 · "시험이 끝나면 같이 가자" → G.flags.pack(8장 아스트리드가 봄) */
function* stash(G, C) {
  const P = G.player, pl = G.place, A = pl.anchors, rr = A.rest_rock || A.floor || { x: 0, z: 0 };
  const spot = { x: rr.x - 3.2, z: rr.z + 1.6 }; C.spot = spot;
  const T = G.dragon('nightfury', { x: rr.x + 1.5, z: rr.z - 1.5, yaw: -2.2 }, { mind: { fear: 0.05, trust: 0.85 } }); T.mind.lock = 'idle'; C.T = T;
  holdItem(P, 'cloth');
  G.hud.goal('짐을 쉬는 바위 곁에 두기'); G.useSpots = [{ x: spot.x, y: pl.height(spot.x, spot.z, 1), z: spot.z }];
  yield* until(() => P.fTap && G.near(spot, 2.2));
  G.useSpots = []; G.hud.goal(''); holdItem(P, null);
  const pk = makePack(pl.group, spot.x, pl.height(spot.x, spot.z, 1), spot.z, 0.8); C.cleanup = () => pk.removeFromParent();
  G.sfx.play('thud');
  T.mind.lock = null; T.goTo(spot.x + 1.4, spot.z - 0.6, 1.4, 0.5); yield* until(() => T.arrived(), 4);
  T.stay(); T.faceTo(spot.x, spot.z); T.pose = { sniff: 1, headUp: -0.4 }; yield* wait(1.2); T.pose = { tilt: 1 };
  yield* sayAll(G, [['hiccup', '내일 시험이 끝나면… 우리 같이 멀리 가자.'], ['hiccup', '아무도 우리를 못 찾는 데로.']]);
  T.pose = {}; T.faceTo(P.W.x, P.W.z);
  G.flags.pack = true; G.inv.pack = 1;
  G.hud.banner('코브에 짐 보따리 — 떠날 준비', 'ship', 3.5);
  yield* wait(2);
  return true;
}

/* 생성기 안에서 약속 기다리기 */
function* awaitP(p) { let done = false; Promise.resolve(p).then(() => { done = true; }, () => { done = true; }); while (!done) yield; }

export const chapter = {
  id: 7, title: '7장 · 아빠의 투구', sub: '대장간 → 훈련장 → 마을 → 숨은 호수(코브)',
  steps: [
    { id: '7-1', verb: 'listen', howtoVerb: 'rhythm', place: 'village', time: 'day', at: 'forge_front', goal: '숫돌에서 칼 갈기', limit: 100,
      hints: { 1: '숫돌이 돌아야 이야기가 이어져.', 2: '발판이 바닥에 닿을 때 Space.' }, run: talk,
      sense: (G, C) => ({ stage: C.stage || '', at: G.place.anchors.forge_grind || null, bench: G.bench.sense(), li: C.li || 0 }) },
    { id: '7-2', place: 'village', time: 'day', atNew: 'forge_grind', run: gift,
      sense: (G, C) => { const S = G.castBy.stoick; return { stage: C.stage || '', target: S && S.root ? { x: +S.x.toFixed(1), z: +S.z.toFixed(1) } : null }; } },
    { id: '7-3', verb: 'approach', howtoVerb: 'approach', place: 'arena', time: 'day', goal: '아스트리드보다 먼저 그롱클 진정시키기', limit: 120,
      hints: { 1: '그롱클은 가까운 사람을 쏴. 아스트리드보다 가까이.', 2: '쏜 다음 숨 고를 때 가까이서 F(풀) · 볼이 부풀 때 멀리서 F(방패).' }, run: finale, sense: finSense },
    { id: '7-4', place: 'arena', time: 'day', run: chosen,
      sense: (G, C) => ({ stage: C.stage || '', target: C.stage === 'board' ? C.board : C.stage === 'go' ? C.spot : null }) },
    { id: '7-5', verb: 'hide', place: 'village', time: 'sunset', at: 'forge_front', goal: '들키지 않고 짐 모으기', limit: 220,
      hints: { 1: '빈손이면 괜찮아. 들고 갈 때만 눈길(노란 부채꼴)을 피하자.', 2: '살금살금(Shift)이면 눈길이 짧아져 · 고개를 돌릴 때 지나가자.' }, run: sneak, sense: sneakSense },
    { id: '7-6', place: 'cove', time: 'sunset', at: 'gap_in', run: stash,
      sense: (G, C) => ({ target: C.spot || null, tl: tlSense(G, C.T) }) },
  ],
};
