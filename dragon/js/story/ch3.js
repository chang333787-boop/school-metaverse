// 3장 훈련 첫날 · 숨은 호수(design §2 · reference #5·#6·#7) — 선착장 배웅(이음 · 진눈깨비) → ① 그롱클(방패 두드리기 · 여섯 발)[피하기+던지기 · 쉬움 X]
// → ② 코브 가장자리에서 숨어 관찰 · 미끄러지는 투슬리스 스케치[숨기] → ③ 밤 큰 회관 드래곤 책 · 점 여섯 잇기[그리기] · 와! = 내 그림이 X 도장을 덮음
import * as THREE from 'three';
import { wait, until, sayAll } from './runner.js?v=17';
import { holdItem, dropItem, makePuffs } from './fx.js?v=17';
import { toon, flameMesh, glowSprite } from '../look/kit.js?v=17';
import { tlSense } from './ch4.js?v=17';

const WARN = { easy: 3, normal: 2.5, hard: 2 };

/* 이음 — 선착장 배웅(진눈깨비) */
function* farewell(G, C) {
  const P = G.player, pl = G.place, A = pl.anchors, e = A.dock_end || A.dock_top || { x: 0, z: 0 };
  const S = G.person('stoick', { x: e.x + 1.2, z: e.z + 0.8, yaw: (e.yaw || 0) + Math.PI });
  const Gb = G.person('gobber', { x: (A.dock_top || e).x - 1.5, z: (A.dock_top || e).z, yaw: 0 });
  G.hud.goal('아빠 배웅하기');
  yield* until(() => G.dist(P.W, e) < 6, 40);
  S.faceTo(P.W.x, P.W.z); S.pose = { talk: 1 };
  yield* sayAll(G, [['stoick', '다녀오마. 드래곤 훈련, 잘 받아라.', ['ship']], ['hiccup', '…네.']]);
  S.walkTo(e.x + Math.sin(e.yaw || 0) * 12, e.z + Math.cos(e.yaw || 0) * 12, 1.5);
  yield* wait(2.5);
  Gb.faceTo(P.W.x, P.W.z); Gb.pose = { talk: 1, point: 1 };
  yield* sayAll(G, [['gobber', '자, 넌 오늘부터 훈련이다! 훈련장으로!', ['shield']]]);
  return true;
}

/* ① 그롱클 — 볼이 부풀면(예고) 방패를 두드려 조준을 흐림 · 다른 길: 벽 뒤에 숨어 여섯 발 다 쓰게 · 맞으면 방패를 놓침 · 연타는 익숙해짐 */
function* gronckle(G, C) {
  const P = G.player, pl = G.place, c = pl.anchors.center || { x: 0, z: 0 };
  const cover = [[c.x - 6, c.z + 3, c.x - 3, c.z + 3], [c.x + 3, c.z - 2, c.x + 6, c.z - 2], [c.x - 1, c.z - 7, c.x + 2, c.z - 7]];   // 나무 가림막 셋
  pl.setMaze && pl.setMaze(cover); G.collideAdd(cover);
  C.cover = cover;
  G.putPlayer({ x: c.x - 4, z: c.z - 10, yaw: 0.3 });          // 가림막에 안 가린 자리 — 숨으려면 걸어가야
  holdItem(P, 'shield');
  const Gr = G.dragon('gronckle', { x: c.x, z: c.z + 9, yaw: Math.PI }, { mind: { fear: 0.1, anger: 0.5 }, noCollide: true }); Gr.solid = true; Gr.radius = 1.6;
  Gr.mind.lock = 'watch'; C.Gr = Gr;
  const Fl = G.person('fishlegs', (pl.lists.crowd || [])[0] || { x: c.x + 14, z: c.z, yaw: -1.5 }, { noCollide: true });
  const lava = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), toon({ color: 0xd8642a, emissive: 0x8a2a08 })); lava.visible = false; pl.group.add(lava);
  const fl = flameMesh(1.4); fl.visible = false; pl.group.add(fl); const gl = glowSprite(0xff8a3a, 4, 0.5); gl.visible = false; pl.group.add(gl);
  const puffs = makePuffs(pl.group, 80, 0x3a3430);
  C.cleanup = () => { pl.setMaze && pl.setMaze([]); G.collideReset(); lava.removeFromParent(); lava.geometry.dispose(); fl.removeFromParent(); gl.removeFromParent(); };
  yield* sayAll(G, [['gobber', '첫날은 그롱클! 방패가 제일 중요하다!', ['shield']], ['fishlegs', '그롱클은 여섯 발! 여섯 발만 버티면 돼!']]);
  let shots = 0, hits = 0, next = 2.5, hab = 0, blur = 0, ball = null, down = 0, shieldOn = true, shieldAt = null;
  const N = ['한 발!', '두 발!', '세 발!', '네 발!', '다섯 발!', '여섯 발! 이제 못 쏴!'];
  while (true) {
    const dt = yield;
    puffs.step(dt); hab = Math.max(0, hab - dt * 0.5);
    const M = Gr.mind;
    Gr.faceTo(P.W.x, P.W.z);
    /* 공격 박자 */
    if (!ball && M.warnT <= 0 && M.beh !== 'attack' && !M.inGap() && shots < 6) { next -= dt; if (next <= 0) { M.windup(WARN[G.diff]); blur = 0; } }
    C.puff = M.warnT > 0;
    /* 방패 두드리기 — 볼이 부풀 때만 통함 · 연타는 익숙해짐 */
    if (P.fTap && shieldOn && !down) {
      P.pose = { hammer: 1 }; C.bangT = 0.25; G.sfx.play('bang');
      if (M.warnT > 0 && hab < 3) { blur = 1; puffs.burst(Gr.x, Gr.y + 1.6, Gr.z, 6, 1, 1); G.hud.say('fishlegs', '조준이 흐려졌어!', [], { secs: 1 }); }
      else hab += 1;
      M.event('loud');
    }
    if (C.bangT > 0) { C.bangT -= dt; if (C.bangT <= 0 && !down) P.pose = null; }
    /* 쏨 — 예고 끝에 본 자리로(흐리면 3m 빗나감) · 0.9초 포물선 */
    if (M.beh === 'attack' && !ball) {
      const off = blur ? 3.2 : 0, a = G.t * 3.1;
      ball = { t: 0, sx: Gr.x, sz: Gr.z, sy: Gr.y + 1.4, tx: P.W.x + Math.cos(a) * off, tz: P.W.z + Math.sin(a) * off, ty: pl.height(P.W.x, P.W.z, 0) };
      lava.visible = true; shots++; G.hud.say('fishlegs', N[shots - 1], [], { secs: 1.2 }); next = 1.8 + G.rng() * 1.4;
    }
    if (ball) {
      ball.t += dt / 0.9; const k = Math.min(1, ball.t);
      lava.position.set(ball.sx + (ball.tx - ball.sx) * k, ball.sy + (ball.ty - ball.sy) * k + Math.sin(k * Math.PI) * 3, ball.sz + (ball.tz - ball.sz) * k);
      if (k >= 1) {
        lava.visible = false; puffs.burst(ball.tx, ball.ty + 0.2, ball.tz, 26, 3, 3); G.sfx.play('fire');
        fl.position.set(ball.tx, ball.ty, ball.tz); gl.position.set(ball.tx, ball.ty + 0.8, ball.tz); fl.visible = gl.visible = true; C.fireT = 2;   // 땅에 남는 불(원인 = 용암 덩이)
        const safe = G.collide.cut(Gr.x, Gr.z, P.W.x, P.W.z) < 1;                     // 가림막 뒤
        if (!safe && Math.hypot(P.W.x - ball.tx, P.W.z - ball.tz) < 1.6 && !(P.W.rollT > 0)) {
          hits++; down = G.diff === 'easy' ? 0.6 : 3; P.lock = true; P.pose = { stumble: 1 };
          if (G.diff !== 'easy' && shieldOn) { shieldOn = false; holdItem(P, null); shieldAt = { x: P.W.x + 1.5, z: P.W.z - 1 }; C.shieldObj = dropItem(pl.group, 'shield', shieldAt.x, pl.height(shieldAt.x, shieldAt.z, 0), shieldAt.z); }
          G.hud.say('hiccup', hits < 3 ? '으윽… 방패 어디 갔지?' : '…졌다.', [], { secs: 1.5 });
        }
        ball = null;
      }
    }
    if (C.fireT > 0) { C.fireT -= dt; if (C.fireT <= 0) fl.visible = gl.visible = false; }
    if (down > 0) { down -= dt; if (down <= 0) { P.lock = false; P.pose = null; } }
    /* 놓친 방패 줍기 */
    G.useSpots = !shieldOn && shieldAt ? [{ x: shieldAt.x, y: 0, z: shieldAt.z }] : [];
    if (!shieldOn && shieldAt && P.fTap && G.near(shieldAt, 2)) { shieldOn = true; holdItem(P, 'shield'); C.shieldObj.removeFromParent(); shieldAt = null; }
    C.shieldAt = shieldAt; C.shieldOn = shieldOn; C.shots = shots; C.hits = hits;
    if (hits >= 3) { yield* sayAll(G, [['gobber', '히컵, 나와! 숨 고르고 다시!']]); return 'retry'; }
    if (shots >= 6 && !ball) {
      yield* wait(0.8);
      Gr.pose = { crouch: 0.4, jaw: 0.2 }; G.hud.say('gobber', '여섯 발 끝! 히컵이 버텼어!');
      G.book.note('gronckle', 'weak', '여섯 발 쏘면 끝 · 방패 소리에 조준이 흐려짐');
      G.records['3-1'] = { hits };
      yield* wait(1.8); holdItem(P, null);
      return true;
    }
  }
}
function grSense(G, C) {
  const g = C.Gr; if (!g) return {};
  return { gr: g.root && G.vis(g.x, g.y + 1, g.z) ? { x: +g.x.toFixed(1), z: +g.z.toFixed(1), puff: !!C.puff } : null, shots: C.shots || 0, hits: C.hits || 0, shieldOn: C.shieldOn !== false, shieldAt: C.shieldAt || null, cover: C.cover };
}

/* ② 코브 관찰 — 가장자리 바위 뒤에서(살금살금) · 투슬리스가 돌벽을 넘으려다 미끄러질 때 F 꾹 = 스케치 · 올려다보면 숨기 */
function* watch(G, C) {
  const P = G.player, pl = G.place, A = pl.anchors, W = pl.lists.rim_watch || [];
  const cw = A.climb_wall || A.floor || { x: 0, z: 0 }, lake = A.lake_shore || A.lake || A.floor || { x: 5, z: 5 }, rest = A.rest_rock || A.floor || { x: -5, z: 0 };
  const T = G.dragon('nightfury', rest, { mind: { fear: 0.3, curious: 0.2 }, noCollide: false }); C.T = T; T.mind.lock = 'idle';
  yield* until(() => T.root);
  yield* sayAll(G, [['hiccup', '사라졌다… 저 아래 호수?']]);
  G.hud.goal('들키지 말고 투슬리스를 그려라');
  const cv = G.hud.sketch(true), X = cv.getContext('2d'); X.fillStyle = '#efe2c4'; X.fillRect(0, 0, 400, 300);
  C.cleanup = () => G.hud.sketch(false);
  /* 투슬리스 하루: 벽 오르기(미끄러짐 ×2) → 호숫가 → 쉬는 바위 → … · 가끔 올려다봄(귀 먼저 0.8초) */
  const plan = [['climb', cw], ['lake', lake], ['climb', cw], ['rest', rest]];
  let pi = 0, act = null, at = 0, lookT = 5 + G.rng() * 3, looking = 0, prog = 0, spotted = 0, hideT = 0, drawn = 0;
  const need = G.diff === 'easy' ? 3 : 4.2;
  const hiddenAt = () => { if (!P.W.low) return false; for (const w of W) if (Math.hypot(P.W.x - w.x, P.W.z - w.z) < 1.8) return true; return false; };
  T.goTo(plan[0][1].x, plan[0][1].z, 2.2, 1.5); act = 'go';
  while (prog < need) {
    const dt = yield;
    at += dt;
    /* 하루 차례 */
    if (act === 'go' && T.arrived()) { act = plan[pi][0]; at = 0; if (act === 'climb') T.faceTo(cw.x + Math.sin(cw.yaw || 0) * 3, cw.z + Math.cos(cw.yaw || 0) * 3); }
    if (act === 'climb') {                                           // 기어오르다 미끄러짐(4.5초 · 두 번)
      const ph = (at % 2.25) / 2.25; T.rigY = ph < 0.6 ? ph / 0.6 * 2.6 : Math.max(0, 2.6 - (ph - 0.6) / 0.15 * 2.6);
      T.pose = { headUp: 0.8, flapRate: ph < 0.6 ? 0.8 : 0, fold: ph < 0.6 ? 0.3 : 1, crouch: ph > 0.75 ? 0.5 : 0 };
      if (at > 4.5) { T.rigY = 0; T.pose = {}; act = 'go'; pi = (pi + 1) % plan.length; T.goTo(plan[pi][1].x, plan[pi][1].z, 2.2, 1.5); }
    } else if (act === 'lake' || act === 'rest') { T.pose = { headUp: act === 'lake' ? -0.6 : 0 }; if (at > 6) { act = 'go'; pi = (pi + 1) % plan.length; T.goTo(plan[pi][1].x, plan[pi][1].z, 2.2, 1.5); } }
    C.climbing = act === 'climb';
    /* 올려다보기 — 귀가 먼저 쫑긋(0.8초) → 2초 올려다봄 */
    lookT -= dt;
    if (lookT <= 0 && !looking && act !== 'climb') { looking = 2.8; T.pose = { ear: 1, headUp: 0.2 }; }
    if (looking > 0) {
      looking -= dt;
      if (looking < 2) { T.pose = { ear: 1, headUp: 0.9 }; T.faceTo(P.W.x, P.W.z); if (!hiddenAt() && !hideT) { spotted++; hideT = 6; G.hud.say('hiccup', spotted < 3 ? '들켰다! 숨자…' : '…완전히 들켰어.', [], { secs: 1.4 }); T.goTo(rest.x, rest.z, 5, 1.2); act = 'go'; } }
      if (looking <= 0) { looking = 0; T.face = null; T.pose = {}; lookT = 5 + G.rng() * 4; }
    }
    C.lookUp = looking > 0 && looking < 2; C.earUp = looking >= 2;
    if (hideT > 0) { hideT -= dt; if (hideT <= 0) hideT = 0; }
    if (spotted >= 3) { yield* sayAll(G, [['hiccup', '오늘은 틀렸어. 처음부터 조용히…']]); return 'retry'; }
    /* 스케치 — 바위 뒤 + 살금살금 + 미끄러지는 동안 F 꾹 */
    const sk = G.input.on('use') && hiddenAt() && C.climbing && !hideT;
    if (sk) { prog += dt; const k = Math.floor(prog / need * 14); while (drawn < k) { drawn++; sketchLine(X, drawn); } }
    C.prog = prog;
  }
  G.hud.sketch(true);
  yield* sayAll(G, [['hiccup', '꼬리날개가… 한쪽뿐이야!', ['fin']], ['hiccup', '내가 주운 조각이 그 반쪽이구나.', ['fin']]]);
  G.book.note('nightfury', 'weak', '왼 꼬리날개가 없어 못 날아오름', false); G.hud.banner('알아냈다 — 왼 꼬리날개가 없다', 'fin', 3.5);
  yield* wait(2);
  return true;
}
function sketchLine(X, i) {                                       // 연필 선이 한 줄씩 — 몸 → 날개 → 꼬리(오른 날개만 · 왼쪽은 빈 칸)
  const L = [[40, 200, 120, 170], [120, 170, 200, 160], [200, 160, 280, 170], [280, 170, 340, 150], [340, 150, 370, 160], [120, 170, 150, 100], [150, 100, 220, 70], [220, 70, 200, 160],
    [40, 200, 20, 230], [20, 230, 50, 240], [50, 240, 40, 200], [30, 210, 10, 190], [345, 145, 360, 130], [360, 130, 372, 150]];
  const s = L[(i - 1) % L.length]; X.strokeStyle = '#2b2118'; X.lineWidth = 4; X.lineCap = 'round'; X.beginPath(); X.moveTo(s[0], s[1]); X.lineTo(s[2], s[3]); X.stroke();
  if (i === L.length) { X.strokeStyle = '#a83e1e'; X.setLineDash([6, 6]); X.beginPath(); X.arc(28, 235, 20, 0, 6.3); X.stroke(); X.setLineDash([]); X.fillStyle = '#a83e1e'; X.font = 'bold 22px sans-serif'; X.fillText('?', 60, 270); }
}
function watchSense(G, C) {
  const W = G.place.lists.rim_watch || [];
  return { watch: W.map((w) => ({ x: w.x, z: w.z, yaw: w.yaw })), climbing: !!C.climbing && C.T && G.vis(C.T.x, C.T.y + 1, C.T.z), lookUp: !!C.lookUp, earUp: !!C.earUp, prog: +(C.prog || 0).toFixed(2), tl: tlSense(G, C.T) };
}

/* ③ 밤 큰 회관 — 고버가 드래곤 책을 줌 · 쌍둥이·스노트라우트는 나감 · 나이트 퓨리 칸 '알 수 없음'에 내가 그림(점 여섯) */
function* bookNight(G, C) {
  const P = G.player, pl = G.place, b = pl.anchors.table_book || pl.anchors.firepit || { x: 0, z: 0 };
  const Gb = G.person('gobber', { x: b.x + 1.6, z: b.z + 1.2, yaw: -2.4 });
  const Tw = G.person('tuffnut', { x: b.x - 2, z: b.z + 2.2, yaw: 2 }), Sn = G.person('snotlout', { x: b.x - 2.6, z: b.z + 0.6, yaw: 1.6 }), Fl = G.person('fishlegs', { x: b.x + 2.4, z: b.z - 1.2, yaw: -1 });
  G.hud.goal('드래곤 책 받기');
  G.useSpots = [{ x: b.x, y: 0, z: b.z }];
  yield* sayAll(G, [['gobber', '훈련생들! 오늘 밤엔 이걸 읽어 둬라.', ['book']]]);
  yield* until(() => P.fTap && G.near(b, 2.6));
  G.useSpots = []; G.book.give();
  yield* sayAll(G, [['twins', '읽으라고? 글씨를?'], ['snotlout', '난 이미 다 알아. 간다.']]);
  Tw.walkTo((pl.anchors.door || b).x, (pl.anchors.door || b).z, 2.4); Sn.walkTo((pl.anchors.door || b).x + 1, (pl.anchors.door || b).z, 2.4);
  yield* sayAll(G, [['fishlegs', '그롱클은 턱 힘 8! 내더는 속도 8…'], ['hiccup', '나이트 퓨리는… 알 수 없음?', ['book']]]);
  G.hud.goal('알 수 없음 칸에 그려 넣기');
  C.draw = G.book.startDraw(G.diff === 'easy'); G.hud.howto('draw', 8);
  while (!G.book.drawStep(yield, G.input)) { /* 그리는 중 */ }
  yield* wait(0.6);
  G.book.endDraw(); G.book.show('nightfury');
  G.hud.banner('내 그림이 X 도장을 덮었다', 'pencil', 3.5);
  yield* wait(2.4); G.book.close();
  G.records.rank = '히컵 — 맨 아래';
  G.hud.banner('훈련장 순위판에 내 이름(맨 아래)', 'shield', 3);
  yield* wait(1.5);
  return true;
}

export const chapter = {
  id: 3, title: '3장 · 훈련 첫날 · 숨은 호수', sub: '선착장 → 훈련장 → 코브 → 밤 큰 회관',
  steps: [
    { id: '3-0', place: 'village', time: 'sleet', at: 'dock_top', run: farewell, sense: (G) => ({ target: G.place.anchors.dock_end || null }) },
    { id: '3-1', verb: 'dodge', howtoVerb: 'shield3', place: 'arena', time: 'day', goal: '그롱클을 버텨라', easy: false, limit: 120,
      bookPage: { title: '훈련 1일 — 그롱클', draw: 'gronckle', line: '그롱클은 여섯 발을 쏘면 끝. 방패를 두드리면 조준이 흐려진다.' },
      hints: { 1: '볼이 부풀면 쏠 거야!', 2: '볼이 부풀 때 F 짧게(방패 두드리기) · 아니면 가림막 뒤로.' }, run: gronckle, sense: grSense },
    { id: '3-2', verb: 'hide', howtoVerb: 'sketch3', place: 'cove', time: 'day', at: 'rim_start', goal: '들키지 말고 투슬리스를 그려라', limit: 180,
      hints: { 1: '바위 뒤에서 살금살금(Shift).', 2: '벽을 오르다 미끄러질 때 F를 꾹 눌러 그리자.' }, run: watch, sense: watchSense },
    { id: '3-3', verb: 'draw', place: 'hall', time: 'night', at: 'door', goal: '드래곤 책 받기', limit: 150,
      howto: false, hints: (G, C) => (C.draw ? { 1: '빈칸에 내가 본 걸 그리자.', 2: 'F를 누른 채 점을 차례로 이어.' } : { 1: '고버 아저씨가 탁자에 책을 놓았어.', 2: '불가 탁자 곁에서 F 짧게.' }), run: bookNight, sense: (G) => ({ draw: G.book.drawSense(), table: G.place.anchors.table_book || null, have: G.book.have }) },
  ],
};
