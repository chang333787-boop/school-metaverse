// 1장 습격의 밤(design §2 1장 · reference #1~3) — 이음(대장간 · 고버 "넌 들어가 있어") → ① 무기 나르기[길 찾기 · 쉬움 X] → ② 물통 줄 지붕 불[던지기 + 원소 엔진 · 쉬움 X]
// → ③ 종마다 다른 예고 읽고 피하기[피하기] → ④ 양을 채 가는 테러 · 그물 볼라[던지기] → ⑤ 망루 볼라 발사기[쏘기] · 와! = 검은 그림자가 빙글 떨어짐
// → 이어서(이음) 나이트메어가 쫓아옴 → 스토이크가 막음 · 아무도 안 믿음 · '낙서' 공책 → 아침(그을린 지붕 · 덧댄 판자 · 비늘 조각)
// 쉬움 = 해 질 녘(design §6-5) · 깜짝 X(예고 2~3초) · 피·죽음 X · 대사는 모두 우리 말로 새로(저작권) · 실제 학생 이름 X(영화 인물만)
import * as THREE from 'three';
import { wait, until, sayAll } from './runner.js?v=15';
import { holdItem, makePuffs } from './fx.js?v=15';
import { setTime, toon, flameMesh, glowSprite } from '../look/kit.js?v=15';
import { createElements } from '../play/elements.js?v=15';
import { raidSky, makeBreath, makeThrow, makeFlyer, makeStars, makeTrail, prop, ringWalls, ensureVillage, seedVillage } from './fx1.js?v=15';

const WARN = { easy: 3, normal: 2.5, hard: 2 };
const KNOCK = { easy: 0, normal: 2, hard: 2.6 };          // 맞으면 넘어져 있는 초(쉬움 = 안 넘어짐 · design §8)
/* 습격 하늘 — 다섯 실루엣(design §5 #35 · 내더·그롱클·나이트메어·지플백·테러) */
const SKY = [
  { kind: 'nadder', cx: 0, cz: 4, r: 40, h: 21, w: 0.12 }, { kind: 'gronckle', cx: 12, cz: -8, r: 28, h: 17, w: 0.15 },
  { kind: 'nightmare', cx: -8, cz: 10, r: 50, h: 27, w: 0.08 }, { kind: 'zippleback', cx: 6, cz: 2, r: 34, h: 23, w: 0.1 }, { kind: 'terror', cx: -30, cz: -36, r: 14, h: 12, w: 0.32 },
];
/* 쉬움 = 해 질 녘(밤으로 지은 마을 위에 하늘만 노을로) */
function look(G) { if (G.diff === 'easy' && G.env.time !== 'sunset') setTime(G.env, 'sunset', { near: 70, far: 900, hI: 0.7, sunI: 1.4 }); }

/* 걸음마다 같이 도는 것(원소 엔진 · 불 뿜기) — 말풍선을 기다리는 동안에도 돌게 T()로 감쌈 */
function* T(C, g) { let r = g.next(); while (!r.done) { const dt = yield; if (C.tk) C.tk(dt); r = g.next(dt); } return r.value; }
function hookFx(G, C, extra) {
  const E = elems(G), sky = raidSky(G, SKY), br = C.br || (C.br = makeBreath(G.place.group));
  C.tk = (dt) => { E.step(dt); br.step(dt); if (extra) extra(dt); };
  C.drawHook = (a, dt) => { sky.draw(dt); E.draw(G.camera.position); };
  const old = C.cleanup; C.cleanup = () => { br.f.removeFromParent(); br.g.removeFromParent(); old && old(); };
  return { E, sky, br };
}

/* 원소 엔진 — 장소(마을 밤)마다 하나 · 남쪽 집 넷의 지붕 = 칸 넷씩(덧댄 판자 자리 lists.patched 두 점에서 지붕 결을 되짚음) · 바람 = 서 → 동 */
const ROW = [2, 9, 10, 3];                                 // 서 → 동(바람 아래로 번지는 차례)
/* 남쪽 집 넷의 지붕 결(가운데·폭·길이·방향·지붕 높이) — 덧댄 판자 자리 두 점(지붕 위 · 집 좌표 (0.22w, 0.02d)·(-0.18w, -0.28d))에서 되짚음 */
function houseInfo(pl) {
  const by = {}, out = []; for (const p of pl.lists.patched || []) (by[p.house] = by[p.house] || []).push(p);
  for (const h of ROW) {
    const L = by[h]; if (!L || L.length < 2) continue;
    const [a, b] = L, yaw = a.yaw, Xx = Math.cos(yaw), Xz = -Math.sin(yaw), Zx = Math.sin(yaw), Zz = Math.cos(yaw);
    const dx = a.x - b.x, dz = a.z - b.z, dlx = dx * Xx + dz * Xz, dlz = dx * Zx + dz * Zz;
    const w = Math.abs(dlx) / 0.4, d = Math.abs(dlz) / 0.3, sx = Math.sign(dlx) || 1, sz = Math.sign(dlz) || 1;
    const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2;
    out.push({ h, w, d, yaw, Xx, Xz, Zx, Zz, cx: mx - (sx * 0.02 * w * Xx + sz * -0.13 * d * Zx), cz: mz - (sx * 0.02 * w * Xz + sz * -0.13 * d * Zz), y: (a.y + b.y) / 2 + 0.05 });
  }
  return out;
}
const _rc = new THREE.Raycaster(), _ro = new THREE.Vector3(), _rd = new THREE.Vector3(0, -1, 0);
function roofMeshes(G) {                                     // 정적 물건(병합 조각)만 — 사람·드래곤·반투명·인스턴스 X
  const L = []; G.place.group.traverse((o) => { if (o.isMesh && !o.isSkinnedMesh && !o.isInstancedMesh && o.visible !== false && o.material && !o.material.transparent) L.push(o); });
  G.place.group.updateMatrixWorld(true); _rc.camera = G.camera; return L;
}
function roofAt(list, x, z, y0, up = 7, down = 6) {          // (x, z) 위에서 내려 쏴 처음 닿는 면(지붕) 높이 · 없으면 y0
  _ro.set(x, y0 + up, z); _rc.set(_ro, _rd); _rc.near = 0; _rc.far = up + down;
  const h = _rc.intersectObjects(list, false); return h.length ? h[0].point.y : y0;
}
function elems(G) {
  if (G._el && G._el.place === G.place) return G._el;
  const pl = G.place, E = createElements({ group: pl.group, wind: { x: 1, z: 0.12, speed: 1 }, opt: { fall: 4, spread: 0.22, bucket: G.diff === 'hard' ? 0.85 : 1.0 } });   // 손맛 = 흉내(물통 6초에 하나여도 집 하나 이하로 막음 · 가만히 = 60초쯤 둘 잃고 다시)
  E.place = pl; E.houses = {};
  const RM = roofMeshes(G);
  for (const I of houseInfo(pl)) {
    const H = E.houses[I.h] = Object.assign({ ids: [], ground: pl.height(I.cx, I.cz, I.y) }, I);
    H.ridge = roofAt(RM, I.cx, I.cz, I.y + 1, 8, 8); H.y = Math.max(I.y, roofAt(RM, I.cx + 0.24 * I.w * I.Xx, I.cz + 0.24 * I.w * I.Xz, I.y, 8, 6));   // 실제 지붕 면(이층집 = 판자 자리보다 높음)
    for (const [lx, lz] of [[0.24, 0.22], [-0.24, 0.22], [0.24, -0.24], [-0.24, -0.24]]) {
      const x = I.cx + lx * I.w * I.Xx + lz * I.d * I.Zx, z = I.cz + lx * I.w * I.Xz + lz * I.d * I.Zz;
      H.ids.push(E.add({ kind: 'roof', x, y: roofAt(RM, x, z, H.y, 8, 6) + 0.05, z, r: Math.min(1.6, I.w * 0.22), house: I.h }));
    }
  }
  E.link();
  E.lost = () => ROW.filter((h) => E.houses[h] && E.houses[h].ids.filter((i) => E.cells[i].state === 2).length >= 3);
  G._el = E; return E;
}

/* 넘어짐(쉬움은 말만) */
function knock(G, C, line) {
  const P = G.player, k = KNOCK[G.diff] ?? 2;
  if (!k) { G.hud.say('hiccup', '앗 뜨거! …괜찮아, 계속!', [], { secs: 1 }); return false; }
  P.lock = true; P.pose = { stumble: 1 }; C.down = k; G.hud.say('hiccup', line, [], { secs: 1.6 }); return true;
}
function downTick(G, C, dt) { if (C.down > 0) { C.down -= dt; if (C.down <= 0) { G.player.lock = false; G.player.pose = null; } } }

/* ── 이음: 대장간 · 습격이 시작됨 ── */
function* intro(G, C) {
  yield* ensureVillage(G, C);                                 // 늘 같은 마을 배치(설계한 골목·지붕 자리)
  const P = G.player, A = G.place.anchors;
  if (G.book.open && !G.book.draw) G.book.flash(null);       // 오프닝의 그림 한 쪽('처음엔…')을 여기서 닫음
  hookFx(G, C); look(G);
  const f0 = A.forge_front || { x: 16, z: -2 }, Gb = G.person('gobber', { x: f0.x - 3.2, z: f0.z + 1.2, yaw: 1.4 }, { noCollide: true }); C.Gb = Gb;
  yield* T(C, until(() => Gb.root, 5));
  Gb.faceTo(P.W.x, P.W.z); Gb.pose = { talk: 1, point: 0.6 };
  G.sfx.play('roar');
  yield* T(C, sayAll(G, [
    ['gobber', '드래곤이다! 히컵, 넌 들어가 있어!', ['shield']],
    ['hiccup', '(한 마리만 잡으면… 다들 나를 볼 거야.)'],
    ['gobber', '…아, 들어가기 전에! 이 도끼들 좀 날라 다오. 손이 모자라!', ['hammer']],
  ]));
  Gb.walkTo(f0.x - 14, f0.z + 6, 3);
  yield* T(C, wait(0.6));
  return true;
}

/* ── ① 무기 나르기 — 도끼 꾸러미를 들고 바이킹 셋에게 · 골목 셋(불난 수레 · 앉은 드래곤은 막힘) ── */
const VIK = [{ who: 'villager1', x: 2.5, z: -42, yaw: Math.PI, name: '회관 앞' }, { who: 'villager2', x: 4.5, z: 38.5, yaw: 0, name: '남쪽 벼랑 길' }, { who: 'villager3', x: 37.5, z: 6.5, yaw: -1.6, name: '선착장 길' }];
/* 막힌 길: 불난 수레 줄(벽) 둘 · 앉은 그롱클·내더(가까이 가면 예고 → 쏨) — 남쪽 골목 A(h2–h9) = 불 · B(h9–h10) = 그롱클 · C(h10–h3) = 열림 · 대장간 남쪽 = 불 · 큰길 북쪽 = 내더 */
const CARTS = [{ x: -1.9, z: 25.6, yaw: 0.35 }, { x: 31.2, z: 4.6, yaw: 0 }, { x: 31.0, z: 8.4, yaw: 0 }];
const SITTERS = [{ kind: 'gronckle', x: 12.0, z: 24.0, yaw: Math.PI }, { kind: 'nadder', x: 1.5, z: -26, yaw: Math.PI / 2 }];
function* weapons(G, C) {
  yield* ensureVillage(G, C);                                 // 늘 같은 마을 배치(설계한 골목·지붕 자리)
  const P = G.player, pl = G.place, A = pl.anchors;
  const { E } = hookFx(G, C, (dt) => { downTick(G, C, dt); puffs.step(dt); });
  const puffs = makePuffs(pl.group, 60, 0x3a3430);
  look(G);
  const rackAt = A.forge_anvil || { x: 23.6, z: -2.4 };
  const rack = prop(pl.group, 'rack', rackAt.x - 0.8, pl.height(rackAt.x - 0.8, rackAt.z + 1.4, 30), rackAt.z + 1.4, Math.PI / 2);
  /* 막힘 — 수레(원소 칸 cart · 번지지 않음) + 벽 */
  const segs = [], cartObjs = [], cartIds = [];
  for (const c of CARTS) {
    const y = pl.height(c.x, c.z, 30); cartObjs.push(prop(pl.group, 'cart', c.x, y, c.z, c.yaw));
    const id = E.add({ kind: 'cart', x: c.x, y: y + 1.4, z: c.z, r: 1.5, give: 0 }); cartIds.push(id); E.ignite(id, 1); E.cells[id].fuel = 1e6;
    segs.push(...ringWalls(c.x, c.z, 2.0, 8));
  }
  segs.push([-3.3, 24.4, -0.6, 26.9], [31.0, 10.2, 31.0, 12.2]);                                  // 골목 A를 끝까지 막음(수레와 집 벽 사이 틈)
  G.collideAdd(segs);
  const sit = SITTERS.map((s) => { const d = G.dragon(s.kind, { x: s.x, z: s.z, yaw: s.yaw }, { mind: { fear: 0.2, anger: 0.45 }, noCollide: true }); d.solid = true; d.radius = s.kind === 'gronckle' ? 1.6 : 1.3; d.mind.lock = 'watch'; d.cd = 0; return d; });
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8), toon({ color: 0xd8642a, emissive: 0x8a2a08 })); ball.visible = false; pl.group.add(ball);
  C.cleanup = ((old) => () => { G.collideReset(); rack.removeFromParent(); for (const o of cartObjs) o.removeFromParent(); for (const id of cartIds) E.remove(id); ball.removeFromParent(); ball.geometry.dispose(); G.useSpots = []; old && old(); })(C.cleanup);
  /* 바이킹 셋 — 횃불을 들고 손을 흔듦 */
  const V = VIK.map((v) => { const h = G.person(v.who, { x: v.x, z: v.z, yaw: v.yaw }); h.pose = { cheer: 1 }; h.got = false; h.v = v; return h; });   // 횃불을 높이 들고 흔듦(멀리서 보이게)
  yield* T(C, until(() => V.every((h) => h.root), 6));
  V.forEach((h) => holdItem(h, 'torch'));
  /* 횃불 불빛(멀리서도 보이게 · 원인 = 든 횃불) */
  const lights = V.map((h) => { const f = flameMesh(0.55), g = glowSprite(0xffa040, 4, 0.55); pl.group.add(f); pl.group.add(g); return { h, f, g }; });
  const lightStep = () => { for (const L of lights) { const h = L.h, on = !h.got || h.speed > 0.3; L.f.visible = L.g.visible = on; L.f.position.set(h.x + Math.sin(h.yaw - 0.6) * 0.45, h.y + 2.3, h.z + Math.cos(h.yaw - 0.6) * 0.45); L.g.position.copy(L.f.position).y += 0.4; } };
  const oldDraw = C.drawHook; C.drawHook = (a, dt) => { oldDraw(a, dt); lightStep(); };
  C.cleanup = ((old) => () => { for (const L of lights) { L.f.removeFromParent(); L.g.removeFromParent(); } old && old(); })(C.cleanup);
  G.hud.say('gobber', '회관 앞 · 남쪽 벼랑 길 · 선착장 길에 하나씩! 횃불 든 사람들이다!', ['torch'], { secs: 3.5 });
  C.V = V; C.sit = sit; C.rack = { x: rack.position.x, z: rack.position.z };
  /* 지붕 사다리(다른 길) — 가운데 집 북쪽 벽에 기댄 사다리 · F = 올라가 용마루를 넘어 남쪽 벼랑 길로 */
  const lad = ladderOver(G, E.houses[9]); C.lad = lad;
  if (lad) C.cleanup = ((old) => () => { lad.dispose(); old && old(); })(C.cleanup);
  let held = 0, shots = 0, flyB = null;
  C.stage = 'rack';
  G.hud.goal('도끼 가지러 대장간 안으로');
  while (true) {
    const dt = yield; C.tk(dt);
    /* 도끼 꾸러미 */
    if (C.stage === 'rack') {
      G.useSpots = [{ x: rack.position.x, y: rack.position.y, z: rack.position.z }];
      if (P.fTap && G.near(rack.position, 2.4)) { C.stage = 'carry'; held = 3; holdItem(P, 'axe'); rack.visible = false; G.useSpots = []; G.hud.goal('바이킹 셋에게 도끼 날라 주기 (0/3)'); G.hud.say('hiccup', '도끼 셋! 무겁다…', [], { secs: 1.4 }); }
      continue;
    }
    /* 앉은 드래곤 — 가까이 오면 예고(볼 부풂 · 가시 세움) → 쏨 → 맞으면 뒤로 밀림 */
    for (const d of sit) {
      if (!d.root) continue;
      const dd = G.dist(P.W, d), M = d.mind; d.faceTo(P.W.x, P.W.z); d.cd -= dt;
      if (dd < 9 && d.cd <= 0 && M.warnT <= 0 && M.beh !== 'attack' && !d.shot && G.collide.cut(P.W.x, P.W.z, d.x, d.z) >= 1) { M.windup(WARN[G.diff]); d.cd = 4; if (!d.told) { d.told = true; G.hud.say('hiccup', d.kind === 'gronckle' ? '볼이 부푼다… 이 골목은 안 되겠어!' : '가시를 세웠어! 다른 길로!', [], { secs: 1.8 }); } }
      if (M.beh === 'attack' && !d.shot) { d.shot = { t: 0, sx: d.x, sz: d.z, sy: d.y + 1.4, tx: P.W.x, tz: P.W.z, ty: pl.height(P.W.x, P.W.z, P.W.y) }; ball.visible = true; }
      if (d.shot) {
        const s = d.shot; s.t += dt / 0.7; const k = Math.min(1, s.t);
        ball.position.set(s.sx + (s.tx - s.sx) * k, s.sy + (s.ty - s.sy) * k + Math.sin(k * Math.PI) * 2.2, s.sz + (s.tz - s.sz) * k);
        if (k >= 1) {
          ball.visible = false; puffs.burst(s.tx, s.ty + 0.2, s.tz, 18, 2.5, 2.5); G.sfx.play('fire');
          if (Math.hypot(P.W.x - s.tx, P.W.z - s.tz) < 1.8 && !(P.W.rollT > 0)) {
            const ax = P.W.x - d.x, az = P.W.z - d.z, L = Math.hypot(ax, az) || 1; P.W.x += ax / L * 3; P.W.z += az / L * 3;   // 뒤로 밀림
            knock(G, C, '으악! …드래곤 앉은 길은 안 돼.');
          }
          d.shot = null;
        }
      }
    }
    /* 사다리 타기(정해진 길 · 3.4초) */
    if (lad && !C.climb && !C.down && P.fTap && G.near(lad.foot, 1.8)) { C.climb = 0; P.lock = true; G.hud.say('hiccup', '지붕으로 넘어가자!', [], { secs: 1.2 }); }
    if (C.climb != null) {
      C.climb += dt; const q = lad.at(C.climb, P.W); P.pose = q.up ? { reach: 0.6, carry: 0.4 } : { carry: 0.5 };
      if (q.done) { C.climb = null; P.lock = false; P.pose = null; P.W.place(P.W.x, P.W.z, P.W.yaw); G.hud.say('hiccup', '지름길! …발 조심.', [], { secs: 1.2 }); }
      continue;
    }
    /* 건네기 */
    const left = V.filter((h) => !h.got);
    G.useSpots = left.map((h) => ({ x: h.x, y: h.y, z: h.z }));
    for (const h of left) {
      h.faceTo(P.W.x, P.W.z);
      if (P.fTap && G.near(h, 2.6) && held > 0) {
        h.got = true; held--; holdItem(h, 'axe'); h.pose = { cheer: 1 }; G.sfx.play('ok');
        G.hud.say('villager', ['고맙다, 꼬마!', '좋아, 이제 싸워 보자!', '대장간 꼬마가 왔구나!'][3 - held - 1] || '고맙다!', [], { secs: 1.4 });
        G.hud.goal('바이킹 셋에게 도끼 날라 주기 (' + (3 - held) + '/3)');
        const run = h.v; h.walkTo(run.x + Math.sin(run.yaw) * 12, run.z + Math.cos(run.yaw) * 12, 3.4);
        if (!held) holdItem(P, null);
      }
    }
    C.held = held;
    if (held === 0) break;
  }
  yield* T(C, sayAll(G, [['hiccup', '다 날랐다! 이제…'], ['gobber', '히컵! 지붕에 불이다! 물통 줄에 붙어!', ['bucket']]]));
  G.records['1-1'] = { t: +C.t.toFixed(1) };
  return true;
}
function weaponSense(G, C) {
  const P = G.player, vis = (o, h = 1.2) => o && G.vis(o.x, (o.y || 0) + h, o.z);
  return {
    stage: C.stage || '', held: C.held ?? 0, rack: C.stage === 'rack' ? C.rack : null,
    vikings: (C.V || []).map((h, i) => ({ i, h })).filter((o) => !o.h.got).map(({ i, h }) => (vis(h) ? { i, x: +h.x.toFixed(2), z: +h.z.toFixed(2), seen: true } : { i, seen: false })),   // 안 보이는 바이킹은 자리 없이
    sitters: (C.sit || []).filter((d) => vis(d)).map((d) => ({ kind: d.kind, x: +d.x.toFixed(2), z: +d.z.toFixed(2), warn: d.mind.warnT > 0 })),
    down: C.down > 0,
  };
}

/* 지붕 사다리 — 집 하나(남북으로 가로지르는 축)에 기대 놓고, 타면 처마 → 용마루 → 반대쪽 처마 → 땅(걸음마다 자리만 · new X) */
function ladderOver(G, H) {
  if (!H) return null;
  const pl = G.place;
  let ux = H.Xx, uz = H.Xz, ext = H.w / 2; if (Math.abs(H.Zz) > Math.abs(uz)) { ux = H.Zx; uz = H.Zz; ext = H.d / 2; }
  if (Math.abs(uz) < 0.6) return null;                       // 남북으로 넘는 집이 아니면 사다리 없음
  if (uz > 0) { ux = -ux; uz = -uz; }                         // u = 북쪽
  const RM = roofMeshes(G), top = roofAt(RM, H.cx, H.cz, H.y + 1, 8, 8) + 0.1, eave = roofAt(RM, H.cx + ux * (ext - 0.15), H.cz + uz * (ext - 0.15), H.y, 6, 6) + 0.1;
  const P0 = [H.cx + ux * (ext + 1.1), H.cz + uz * (ext + 1.1)], P4 = [H.cx - ux * (ext + 1.6), H.cz - uz * (ext + 1.6)];
  const pts = [[P0[0], pl.height(P0[0], P0[1], H.y), P0[1]], [H.cx + ux * (ext + 0.15), eave, H.cz + uz * (ext + 0.15)], [H.cx, top, H.cz], [H.cx - ux * (ext + 0.15), eave, H.cz - uz * (ext + 0.15)], [P4[0], pl.height(P4[0], P4[1], H.y), P4[1]]];
  const dur = [1.3, 0.8, 0.7, 0.6], T = dur.reduce((a, b) => a + b, 0);
  /* 사다리 그림 — 기둥 둘 + 가로대(한 덩어리) */
  const g = new THREE.Group(), mat = toon({ color: 0x7a5a3a }), a = pts[0], b = pts[1];
  const L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const rail = new THREE.CylinderGeometry(0.045, 0.05, L, 5).translate(0, L / 2, 0), rung = new THREE.CylinderGeometry(0.03, 0.03, 0.62, 4).rotateZ(Math.PI / 2);
  for (const sd of [-0.3, 0.3]) { const m = new THREE.Mesh(rail, mat); m.position.set(sd, 0, 0); g.add(m); }   // 옆 X축 = 땅과 나란(lookAt이 위를 지킴)
  const n = Math.floor(L / 0.36); const rungs = new THREE.InstancedMesh(rung, mat, n); const M = new THREE.Matrix4();
  for (let i = 0; i < n; i++) { M.makeTranslation(0, 0.3 + i * 0.36, 0); rungs.setMatrixAt(i, M); } g.add(rungs);
  g.position.set(a[0], a[1], a[2]);
  const look = new THREE.Vector3(b[0], b[1], b[2]);
  g.lookAt(look); g.rotateX(Math.PI / 2);                    // 기둥 축(Y) = 처마 쪽
  pl.group.add(g);
  const out = { done: false, up: false };
  return {
    foot: { x: a[0], z: a[2] }, to: { x: P4[0], z: P4[1] },
    at(t, W) {
      let k = t, i = 0; while (i < dur.length && k > dur[i]) { k -= dur[i]; i++; }
      if (i >= dur.length) { const e = pts[4]; W.x = e[0]; W.z = e[2]; W.y = e[1]; out.done = true; out.up = false; return out; }
      const f = k / dur[i], p = pts[i], q = pts[i + 1];
      W.x = p[0] + (q[0] - p[0]) * f; W.z = p[2] + (q[2] - p[2]) * f; W.y = p[1] + (q[1] - p[1]) * f + (i === 3 ? Math.sin(f * Math.PI) * 0.5 : 0);
      W.yaw = Math.atan2(-ux, -uz); out.done = false; out.up = i === 0; return out;
    },
    dispose() { g.removeFromParent(); rail.dispose(); rung.dispose(); rungs.dispose(); },
  };
}

/* ── ② 물통 줄 · 지붕 불 — 친구 다섯이 여물통에서 손에서 손으로 · 마지막에 내가 받아 던짐 · 다른 길 = 갈고리로 불붙은 판 끌어내리기 ── */
const ORB = { x: 0, y: 0, z: 0, a: 0 };
const LINE = [[4.4, 10.4], [5.2, 11.8], [6.0, 13.2], [6.8, 14.6], [7.6, 16.0]], TROUGH = { x: 3.4, z: 8.9 }, HAND = { x: 8.3, z: 17.2 };   // 줄 끝 = 줄지은 집 넷 가운데(남쪽 길)
const CREW = ['astrid', 'fishlegs', 'snotlout', 'ruffnut', 'tuffnut'];
function* fire(G, C) {
  yield* ensureVillage(G, C);                                 // 늘 같은 마을 배치(설계한 골목·지붕 자리)
  const P = G.player, pl = G.place;
  const { E, sky, br } = hookFx(G, C, (dt) => { downTick(G, C, dt); });
  look(G);
  P.C.pitch = 0.03;                                          // 지붕 불이 보이게 카메라를 낮춰 올려다봄(끌면 바뀜)
  /* 다시 하기면 지붕을 멀쩡하게(젖음·불·그을음 지움) — 남는 결과는 성공한 판의 것 */
  for (const c of E.cells) if (c.kind === 'roof') { c.state = 0; c.fire = 0; c.heat = 0; c.wet = 0; c.fuel = c.K.fuel; c.burnT = 0; }
  const trough = prop(pl.group, 'trough', TROUGH.x, pl.height(TROUGH.x, TROUGH.z, 25), TROUGH.z, 0.35);
  const crew = CREW.map((w, i) => { const p = G.person(w, { x: LINE[i][0], z: LINE[i][1], yaw: 0.2 }, { noCollide: true }); p.solid = true; p.radius = 0.45; return p; });
  const bucket = makeFlyer(pl.group, 'bucket'); bucket.m.visible = true;
  const T1 = makeThrow(G, {
    item: 'bucket', flyItem: 'water', max: 13, T: 0.6, start: 7,
    landY: (x, z) => { let y = pl.height(x, z, 25), best = 2.6; for (const c of E.cells) { if (c.kind !== 'roof') continue; const d = Math.hypot(c.x - x, c.z - z); if (d < best) { best = d; y = c.y; } } return y; },
    snap: (x, z) => nearestFire(E, x, z, 3),
    onLand: (x, y, z) => { const r = E.water(x, y, z, 2.6); G.sfx.play('splash'); E.puff('steam', x, y + 0.3, z, 4, 1); if (r.out) G.hud.say(['astrid', 'fishlegs', 'snotlout'][T1.thrown % 3], r.out > 1 ? '둘이나 꺼졌어!' : '꺼졌다!', [], { secs: 1 }); else if (!r.hit) G.hud.say('hiccup', '빗나갔다… 지붕 쪽으로!', [], { secs: 1 }); },
  });
  C.T1 = T1;
  /* 갈고리 — 집마다 북쪽 벽에 기대 놓은 긴 장대(다른 길이 있다는 보이는 단서) */
  const hookGeo = new THREE.CylinderGeometry(0.05, 0.06, 1, 6).translate(0, 0.5, 0), hookMat = toon({ color: 0x6a4a30 });
  const hookObjs = [];
  for (const h of ROW) {
    const H = E.houses[h]; if (!H) continue;
    let best = null; for (const [ox, oz, ext] of [[H.Xx, H.Xz, H.w / 2], [-H.Xx, -H.Xz, H.w / 2], [H.Zx, H.Zz, H.d / 2], [-H.Zx, -H.Zz, H.d / 2]]) { const x = H.cx + ox * (ext + 0.25), z = H.cz + oz * (ext + 0.25); if (!best || z < best.z) best = { x, z, ox, oz }; }
    const bx = best.x + best.ox * 1.1, bz = best.z + best.oz * 1.1, by = pl.height(bx, bz, H.y), ty = H.y - 1.2;
    const m = new THREE.Mesh(hookGeo, hookMat); m.position.set(bx, by, bz); const L = Math.hypot(best.x - bx, ty - by, best.z - bz);
    m.scale.set(1, L, 1); m.lookAt(best.x, ty, best.z); m.rotateX(Math.PI / 2); pl.group.add(m); hookObjs.push(m);
  }
  C.cleanup = ((old) => () => { trough.removeFromParent(); bucket.dispose(); T1.dispose(); for (const m of hookObjs) m.removeFromParent(); hookGeo.dispose(); G.useSpots = []; old && old(); })(C.cleanup);
  yield* T(C, until(() => crew.every((p) => p.root), 6));
  crew.forEach((p, i) => { const n = LINE[Math.min(4, i + 1)], q = LINE[Math.max(0, i - 1)]; p.faceTo((n[0] + q[0]) / 2 + 1.2, (n[1] + q[1]) / 2); });
  /* 불씨 — 나이트메어가 내려와 서쪽 끝 집 지붕에 불을 뿜음(원인이 보이게) */
  const dive = (D, house, k0, k1, after) => {
    const H = E.houses[house]; if (!H || !D || !D.root) { if (H) { E.ignite(H.ids[k0], 0.35); E.ignite(H.ids[k1], 0.3); } return; }
    D.hold = true; C.dive = { D, H, t: 0, x0: D.x, y0: D.y, z0: D.z, k0, k1, after };
  };
  G.hud.goal('지붕 불 끄기');
  yield* T(C, sayAll(G, [['fishlegs', '히컵! 줄 끝에서 물통을 받아!', ['bucket']], ['astrid', '연기가 흘러가는 쪽 보이지? 불도 그쪽으로 번질 거야.']]));
  let t = 0, bk = -1.2, ready = false, lines = 0, dived = 0, hookT = 0;
  const per = { normal: 0.42, hard: 0.5 }[G.diff] || 0.36;   // 물통이 한 사람 건너가는 초
  C.stage = 'fire';
  while (true) {
    const dt = yield; t += dt; C.tk(dt); T1.step(dt);
    if (t > 13 && !C.tw) { C.tw = true; G.hud.say('twins', '내가 더 빨리 넘겼거든!', [], { secs: 1.6 }); G.hud.say('twins', '아니거든! 물 다 쏟았잖아!', [], { secs: 1.6 }); }   // 쌍둥이 티격태격(유머 · design §9)
    /* 습격이 이어짐 — 불씨 셋(원인 = 내려와 불 뿜는 드래곤) */
    if (dived === 0 && t > 0.5) { dived = 1; dive(sky.ds[2], ROW[1], 0, 2); }          // 습격은 이어짐: 가운데 집 → 서쪽 끝 집 → 동쪽 집(바람 아래)
    if (dived === 1 && t > 14) { dived = 2; dive(sky.ds[0], ROW[0], 1, 3); }
    if (dived === 2 && t > 28) { dived = 3; dive(sky.ds[3], ROW[2], 0, 2); }
    if (C.dive) {
      const v = C.dive, D = v.D, H = v.H; v.t += dt;
      const k = Math.min(1, v.t / 1.6), s = k * k * (3 - 2 * k), tx = H.cx - 9, ty = H.y + 9, tz = H.cz - 4;
      if (D.root && v.t <= 2.4) { D.root.position.set(v.x0 + (tx - v.x0) * s, v.y0 + (ty - v.y0) * s, v.z0 + (tz - v.z0) * s); D.root.rotation.set(0, Math.atan2(tx - v.x0, tz - v.z0), 0, 'YXZ'); D.rig.flapRate = 0.9; D.rig.jaw = v.t > 1.5 ? 0.8 : 0.1; D.rig.update(dt); }
      if (v.t > 1.6 && !v.fired) { v.fired = true; G.sfx.play('fire'); const c0 = E.cells[H.ids[v.k0]], c1 = E.cells[H.ids[v.k1]]; br.fire(D.root.position.x + 2.2, D.root.position.y - 0.5, D.root.position.z + 1, c0.x, c0.y, c0.z, () => { E.ignite(c0.id, 0.35); E.ignite(c1.id, 0.25); }); }
      if (v.t > 2.4 && D.root) { const o = sky.pos(D, ORB, 0), k2 = Math.min(1, (v.t - 2.4) / 1.8), s2 = k2 * k2 * (3 - 2 * k2); D.root.position.set(tx + (o.x - tx) * s2, ty + (o.y - ty) * s2, tz + (o.z - tz) * s2); D.root.rotation.set(0, Math.atan2(o.x - tx, o.z - tz), 0, 'YXZ'); }   // 고리로 돌아감(튀지 않게)
      if (v.t > 4.2) { D.hold = false; C.dive = null; }
    }
    /* 물통 줄 — 여물통 → 다섯 손 → 줄 끝(받을 때까지 기다림) */
    if (!ready) { bk += dt / per; if (bk >= LINE.length - 1) { bk = LINE.length - 1; ready = true; } }
    const bi = Math.max(0, Math.min(LINE.length - 1, bk)), i0 = Math.floor(bi), f = bi - i0, a = LINE[i0], b = LINE[Math.min(LINE.length - 1, i0 + 1)];
    const bx = bk < 0 ? TROUGH.x : a[0] + (b[0] - a[0]) * f, bz = bk < 0 ? TROUGH.z : a[1] + (b[1] - a[1]) * f;
    bucket.m.position.set(bx + 0.4, pl.height(bx, bz, 25) + 1.15 + Math.sin(f * Math.PI) * 0.25, bz);
    crew.forEach((p, i) => { p.pose = { carry: Math.abs(bi - i) < 0.6 ? 1 : 0.2 }; });
    G.useSpots = ready && !T1.held ? [{ x: HAND.x, y: 0, z: HAND.z }] : [];
    if (ready && !T1.held && P.fTap && Math.hypot(P.W.x - HAND.x, P.W.z - HAND.z) < 2.6) { T1.give(); ready = false; bk = -0.6; lines++; }
    /* 갈고리 — 빈손으로 타는 지붕 처마 밑에서 F 꾹(1초) → 판을 끌어내림(그 칸은 더 안 탐 · 집은 조금 다침) */
    if (!T1.held && !G.input.on('use')) hookT = 0;
    if (!T1.held && P.fLong) {
      const c = nearestFire(E, P.W.x, P.W.z, 3.0, true);
      if (c && c.y - P.W.y < 7.5) { hookT += dt; P.pose = { reach: 1, cower: 0.2 }; if (hookT > 1.0) { E.remove(c.id); E.puff('spark', c.x, c.y, c.z, 14, 2); E.puff('smoke', c.x, c.y, c.z, 6, 1); G.sfx.play('thud'); G.hud.say('hiccup', '판을 끌어내렸다! 불길이 끊겼어.', [], { secs: 1.5 }); hookT = 0; C.hooked = (C.hooked || 0) + 1; } }
    }
    C.ready = ready; C.t2 = t;
    /* 끝 — 불씨가 다 끝나고 타는 칸이 없으면 · 집 둘 넘게 잃으면 다시 */
    const lost = E.lost();
    if (lost.length >= 2) { yield* T(C, sayAll(G, [['gobber', '불이 너무 번졌다! 물통 줄, 처음부터!']])); return 'retry'; }
    if (dived === 3 && !C.dive && t > 34 && E.count(1, (c) => c.kind === 'roof') === 0) break;
  }
  const lost = E.lost(); G.flags.burnt = lost.slice(); G.records['1-2'] = { t: +t.toFixed(1), buckets: lines, hooked: C.hooked || 0, lost: lost.length };
  yield* T(C, sayAll(G, [['gobber', lost.length ? '불은 껐다! …저 집은 새로 지어야겠군.' : '불은 다 껐다! 집 하나 안 잃었어!', ['bucket']], ['hiccup', '(지금이야. 내 발사기…!)']]));
  return true;
}
function nearestFire(E, x, z, r, any) { let best = null, bd = r; for (const c of E.cells) { if (c.kind !== 'roof' || c.state !== 1) continue; const d = Math.hypot(c.x - x, c.z - z); if (d < bd) { bd = d; best = c; } } return any ? best : best ? { x: best.x, z: best.z } : null; }
function fireSense(G, C) {
  const E = G._el; if (!E) return {};
  const fires = [];
  for (const c of E.cells) { if (c.kind !== 'roof' || (c.state !== 1 && c.heat < 0.3) || !G.vis(c.x, c.y, c.z)) continue; fires.push({ x: +c.x.toFixed(2), y: +c.y.toFixed(2), z: +c.z.toFixed(2), on: c.state === 1, fire: +c.fire.toFixed(2), heat: +c.heat.toFixed(2), h: c.house }); }
  return { stage: C.stage || '', ready: !!C.ready, hand: HAND, throw: C.T1 ? C.T1.sense() : null, fires, wind: { x: E.wind.x, z: E.wind.z }, lost: E.lost().length, down: C.down > 0 };
}

/* ── ③ 피하기 — 양 우리 가는 길에 종마다 다른 예고: 내더 가시 세움 · 그롱클 볼 부풂 · 나이트메어 달아오름 · 지플백 초록 김 → 불티 ── */
const ROUTE = [[-8, 13], [-14, 17.5], [-20, 22.5], [-26.5, 13.5], [-29.5, 2], [-26, -10], [-20, -23], [-28, -33], [-36, -40.5], [-43.5, -42]];
const GATE = { x: -43.5, z: -42 };
const STATIONS = [{ kind: 'nadder', x: -24.5, z: 28.5, at: 2 }, { kind: 'gronckle', x: -37, z: 6.5, at: 4 }, { kind: 'nightmare', x: -20.5, z: -12.5, at: 5 }, { kind: 'zippleback', x: -13.5, z: -27, at: 6 }];
function* gauntlet(G, C) {
  yield* ensureVillage(G, C);                                 // 늘 같은 마을 배치(설계한 골목·지붕 자리)
  const P = G.player, pl = G.place;
  const puffs = makePuffs(pl.group, 120, 0x3a3430);
  const { E } = hookFx(G, C, (dt) => { downTick(G, C, dt); puffs.step(dt); });
  look(G);
  const FL = G.person('fishlegs', { x: ROUTE[1][0], z: ROUTE[1][1], yaw: -1 }, { noCollide: true }); C.FL = FL; let gi = 1;
  const S = STATIONS.map((s) => { const d = G.dragon(s.kind, { x: s.x, z: s.z, yaw: 0 }, { mind: { fear: 0.35, anger: 0.5 }, noCollide: true }); d.solid = true; d.radius = s.kind === 'nightmare' ? 2.2 : s.kind === 'zippleback' ? 1.8 : 1.4; d.mind.lock = 'watch'; d.st = s; d.cd = 1; d.told = false; return d; });
  C.S = S;
  /* 쏘는 것(장면마다 한 번 짓고 다시 씀) */
  const spikeGeo = new THREE.ConeGeometry(0.06, 0.7, 4).rotateX(Math.PI / 2), spikeMat = toon({ color: 0xd8c27a });
  const spikes = []; for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(spikeGeo, spikeMat); m.visible = false; pl.group.add(m); spikes.push(m); }
  const lava = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), toon({ color: 0xd8642a, emissive: 0x8a2a08 })); lava.visible = false; pl.group.add(lava);
  const ringF = []; for (let i = 0; i < 6; i++) { const f = flameMesh(2.2); f.visible = false; pl.group.add(f); ringF.push(f); }
  const heat = glowSprite(0xff7a2a, 8, 0.5); heat.visible = false; pl.group.add(heat);
  const sparkHead = glowSprite(0xffc060, 1.6, 0.8); sparkHead.visible = false; pl.group.add(sparkHead);
  C.cleanup = ((old) => () => { for (const m of spikes) m.removeFromParent(); spikeGeo.dispose(); lava.removeFromParent(); lava.geometry.dispose(); for (const f of ringF) f.removeFromParent(); heat.removeFromParent(); sparkHead.removeFromParent(); old && old(); })(C.cleanup);
  yield* T(C, until(() => FL.root && S.every((d) => d.root), 6));
  FL.faceTo(P.W.x, P.W.z); FL.pose = { talk: 1 };
  yield* T(C, sayAll(G, [['fishlegs', '고버 아저씨가 양 우리로 오래! 이쪽으로!'], ['hiccup', '드래곤마다 쏘기 전에 하는 몸짓이 달라… 잘 보자.']]));
  let hits = 0, atk = null, gas = null;
  const onBoom = (g) => { if (!gas || g.id !== gas.id) return; const d = Math.hypot(P.W.x - g.x, P.W.z - g.z); G.sfx.play('boom'); if (d < g.r + 0.6) { hits += knock(G, C, '펑! …눈썹 아직 있나?') ? 1 : 0; } gas = null; };
  E.on('boom', onBoom);
  C.stage = 'go'; G.hud.goal('양 우리까지 가기');
  while (true) {
    const dt = yield; C.tk(dt);
    /* 길잡이 피시레그 — 내가 가까이 오면 다음 굽이로 */
    const g = ROUTE[gi];
    if (FL.arrived() && Math.hypot(P.W.x - FL.x, P.W.z - FL.z) < 8 && gi < ROUTE.length - 1) { gi++; FL.walkTo(ROUTE[gi][0], ROUTE[gi][1], 3.0); }
    if (FL.arrived()) FL.faceTo(P.W.x, P.W.z);
    /* 드래곤 넷 */
    for (const d of S) {
      if (!d.root || d.done) continue;
      const M = d.mind, dd = G.dist(P.W, d), sk = d.st.kind;
      if (gi > d.st.at + 1 && dd > 15) { d.done = true; M.lock = 'idle'; d.faceTo(d.x, d.z - 40); d.pose = { tailCurl: 1, headUp: 0.3, look: 0.6 }; continue; }   // 지나가면 뒤(북쪽 바다)를 돌아봄 = 겁먹은 신호
      d.faceTo(P.W.x, P.W.z); d.cd -= dt;
      if (dd < 13 && G.vis(d.x, d.y + 1.5, d.z) && G.collide.cut(P.W.x, P.W.z, d.x, d.z) >= 1 && d.cd <= 0 && !atk && M.warnT <= 0 && M.beh !== 'attack') {   // 보이는 드래곤만(집 벽에 가리면 안 쏨 · 깜짝 X)
        M.windup(WARN[G.diff]); d.cd = sk === 'nightmare' ? 4.2 : 3.2;
        atk = { d, kind: sk, t: 0, phase: 'warn' };
        if (!d.told) { d.told = true; G.hud.say('fishlegs', { nadder: '내더가 가시를 세웠어! 속도 8!', gronckle: '그롱클 볼이 부풀어! 턱 힘 8!', nightmare: '나이트메어가 달아올라! 화력 15!', zippleback: '초록 김! 그다음은 불티야!' }[sk], [], { secs: 2 }); }
        if (sk === 'zippleback') { gas = { id: E.gas(P.W.x, P.W.y + 0.9, P.W.z, 3.2, 9), x: P.W.x, z: P.W.z }; E.puff('gas', P.W.x, P.W.y + 0.6, P.W.z, 16, 1.5); }
      }
      if (sk === 'nightmare') { const w = M.warnT > 0; heat.visible = w; if (w) { heat.position.set(d.x, d.y + 2, d.z); heat.scale.setScalar(6 + (1 - M.warnT / WARN[G.diff]) * 8); } }
      if (sk === 'zippleback' && M.warnT > 0) { const k = 1 - M.warnT / WARN[G.diff]; sparkHead.visible = k > 0.35; sparkHead.position.set(d.x + Math.sin(d.yaw + 0.5) * 2.4, d.y + 2.6, d.z + Math.cos(d.yaw + 0.5) * 2.4); if (k > 0.35 && (C.t * 20 | 0) % 3 === 0) E.puff('spark', sparkHead.position.x, sparkHead.position.y, sparkHead.position.z, 2, 0.8); }
    }
    /* 쏨 — 예고가 끝나는 순간(마음 엔진 beh = attack) */
    if (atk) {
      const d = atk.d, M = d.mind; atk.t += dt;
      if (atk.phase === 'warn' && M.beh === 'attack') {
        atk.phase = 'fly'; atk.t = 0;
        const tx = P.W.x, tz = P.W.z, lead = atk.kind === 'gronckle' ? 0.9 : 0;
        atk.tx = tx + P.W.vx * lead; atk.tz = tz + P.W.vz * lead; atk.ty = pl.height(atk.tx, atk.tz, P.W.y);
        if (atk.kind === 'nadder') { const ax = atk.tx - d.x, az = atk.tz - d.z, L = Math.hypot(ax, az) || 1; atk.px = -az / L; atk.pz = ax / L; spikes.forEach((m) => { m.visible = true; }); }
        if (atk.kind === 'gronckle') lava.visible = true;
        if (atk.kind === 'nightmare') { heat.visible = false; ringF.forEach((f, i) => { const a = i / 6 * Math.PI * 2; f.visible = true; f.position.set(d.x + Math.cos(a) * 3.5, d.y, d.z + Math.sin(a) * 3.5); }); G.sfx.play('fire'); atk.hit = false; }
        if (atk.kind === 'zippleback') { sparkHead.visible = false; if (gas) E.spark(gas.x, P.W.y + 0.9, gas.z, 3.4); else atk.phase = 'end'; }
      }
      if (atk.phase === 'fly') {
        if (atk.kind === 'nadder') {
          const k = Math.min(1, atk.t / 0.35);
          spikes.forEach((m, i) => { const o = (i - 2) * 1.0, ex = atk.tx + atk.px * o, ez = atk.tz + atk.pz * o; m.position.set(d.x + (ex - d.x) * k, d.y + 2 + (atk.ty + 0.3 - d.y - 2) * k + Math.sin(k * Math.PI) * 0.8, d.z + (ez - d.z) * k); m.lookAt(ex, atk.ty, ez); });
          if (k >= 1) {
            spikes.forEach((m) => { m.visible = false; puffs.burst(m.position.x, m.position.y, m.position.z, 4, 1, 1.5); });
            let hit = false; for (let i = 0; i < 5; i++) { const o = (i - 2) * 1.0; if (Math.hypot(P.W.x - (atk.tx + atk.px * o), P.W.z - (atk.tz + atk.pz * o)) < 1.0) hit = true; }
            if (hit && !(P.W.rollT > 0)) hits += knock(G, C, '아야! …옆으로 굴렀어야 했는데.') ? 1 : 0;
            atk.phase = 'end';
          }
        } else if (atk.kind === 'gronckle') {
          const k = Math.min(1, atk.t / 0.9);
          lava.position.set(d.x + (atk.tx - d.x) * k, d.y + 1.4 + (atk.ty - d.y - 1.4) * k + Math.sin(k * Math.PI) * 3, d.z + (atk.tz - d.z) * k);
          if (k >= 1) { lava.visible = false; puffs.burst(atk.tx, atk.ty + 0.2, atk.tz, 22, 3, 3); G.sfx.play('fire'); if (Math.hypot(P.W.x - atk.tx, P.W.z - atk.tz) < 1.7 && !(P.W.rollT > 0)) hits += knock(G, C, '으윽! 내가 갈 쪽에 떨어졌어…') ? 1 : 0; atk.phase = 'end'; }
        } else if (atk.kind === 'nightmare') {
          ringF.forEach((f, i) => { f.scale.setScalar(2.2 + Math.sin(atk.t * 9 + i) * 0.3); });
          if (!atk.hit && G.dist(P.W, d) < 6.2) { atk.hit = true; hits += knock(G, C, '뜨거워! 달아오를 땐 물러서야 해…') ? 1 : 0; const ax = P.W.x - d.x, az = P.W.z - d.z, L = Math.hypot(ax, az) || 1; P.W.x = d.x + ax / L * 6.8; P.W.z = d.z + az / L * 6.8; }
          if (atk.t > 1.2) { ringF.forEach((f) => { f.visible = false; }); atk.phase = 'end'; }
        } else atk.phase = 'end';
      }
      if (atk.phase === 'end') { M.lock = 'watch'; atk = null; }
    }
    C.hits = hits; C.gi = gi;
    if (hits >= 3) { yield* T(C, sayAll(G, [['fishlegs', '히컵! 숨 돌리고 다시 가 보자.']])); return 'retry'; }
    if (Math.hypot(P.W.x - GATE.x, P.W.z - GATE.z) < 4) break;
  }
  gas = null;
  G.book.note('nightmare', 'other', '습격 때 자꾸 뒤를 돌아봄 — 왜 다들 겁먹은 눈이지?'); G.flags.scaredEyes = true;
  G.records['1-3'] = { t: +C.t.toFixed(1), hits };
  return true;
}
function gauntSense(G, C) {
  const E = G._el, P = G.player;
  const d = (C.S || []).filter((x) => x.root && !x.done && G.vis(x.x, x.y + 1.5, x.z)).map((x) => ({ kind: x.st.kind, x: +x.x.toFixed(2), z: +x.z.toFixed(2), warn: x.mind.warnT > 0, fire: x.mind.beh === 'attack' }));
  let gas = null; if (E) for (const c of E.cells) if (c.kind === 'gas' && c.state === 0 && G.vis(c.x, c.y, c.z)) gas = { x: +c.x.toFixed(2), z: +c.z.toFixed(2), r: c.r };
  return { stage: C.stage || '', guide: C.FL && C.FL.root ? { x: +C.FL.x.toFixed(2), z: +C.FL.z.toFixed(2) } : null, gate: GATE, dragons: d, gas, hits: C.hits || 0, down: C.down > 0, route: ROUTE };
}

/* ── ④ 양 지키기 — 테러가 양을 채 감 → 그물 볼라(F 꾹 겨누기 · 놓으면 던짐) → 기절(손해) = 그을린 비늘 조각 ── */
const PEN = { x: -44, z: -50 }, PILE = { x: -40.8, z: -41.6 }, ESC = { x: -78, z: -60 };
function* sheep(G, C) {
  yield* ensureVillage(G, C);                                 // 늘 같은 마을 배치(설계한 골목·지붕 자리)
  const P = G.player, pl = G.place;
  const { E, sky } = hookFx(G, C, (dt) => { downTick(G, C, dt); });
  look(G);
  const need = G.diff === 'easy' ? 2 : 3;
  const pile = prop(pl.group, 'pile', PILE.x, pl.height(PILE.x, PILE.z, 36) + 0.2, PILE.z, 0.4);
  const flock = []; for (let i = 0; i < 5; i++) { const a = i * 1.3, x = PEN.x + Math.cos(a) * 2.6, z = PEN.z + Math.sin(a) * 2.2; const s = G.person('sheep', { x, z, yaw: a }, { noCollide: true }); s.home = { x, z }; flock.push(s); }
  const ter = []; for (let i = 0; i < need + 1; i++) { const d = G.dragon('terror', { x: ESC.x, z: ESC.z, yaw: 0 }, { noCollide: true, scale: 1.7, mind: { fear: 0.6 } }); d.manual = true; d.st = 'wait'; d.t = 0; ter.push(d); }
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.9, 14).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false })); shadow.visible = false; pl.group.add(shadow);
  let stopped = 0, lost = 0, next = 0, idx = 0;
  const T2 = makeThrow(G, {
    item: 'bola', flyItem: 'bola', max: 15, T: 0.55, start: 7, scale: 1.6,
    landY: (x, z) => { for (const d of ter) if (d.st === 'carry' && Math.hypot(d.x - x, d.z - z) < 3) return d.y; return pl.height(x, z, 36); },
    snap: (x, z) => { let b = null, bd = 6; for (const d of ter) { if (d.st !== 'carry') continue; const px = d.x + d.vx * 0.7, pz = d.z + d.vz * 0.7, q = Math.hypot(px - x, pz - z); if (q < bd) { bd = q; b = { x: px, z: pz }; } } return b; },
    onLand: (x, y, z) => {
      let hit = null; for (const d of ter) if (d.st === 'carry' && Math.hypot(d.x - x, d.z - z) < (G.diff === 'easy' ? 2.6 : 1.9)) hit = d;
      if (!hit) { G.hud.say('hiccup', '빗나갔다! 더 앞쪽으로…', [], { secs: 1.2 }); return; }
      hit.st = 'fall'; hit.t = 0; G.sfx.play('thud'); stopped++; G.hud.goal('양 지키기 (' + stopped + '/' + need + ')');
      G.hud.say('hiccup', '맞았다! 양을 놓쳤어!', [], { secs: 1.2 });
    },
  });
  C.T2 = T2; C.ter = ter; C.flock = flock;
  C.cleanup = ((old) => () => { pile.removeFromParent(); shadow.removeFromParent(); shadow.geometry.dispose(); shadow.material.dispose(); T2.dispose(); G.useSpots = []; old && old(); })(C.cleanup);
  yield* T(C, until(() => flock.every((s) => s.root) && ter.every((d) => d.root), 6));
  flock.forEach((s) => { s.pose = { low: 1 }; });
  const Gb = G.person('gobber', { x: PEN.x + 7, z: PEN.z + 4, yaw: -1 }, { noCollide: true });
  yield* T(C, sayAll(G, [['gobber', '테러가 양을 노린다! 그물 볼라를 써라 — 던지면 날개가 묶여!', ['rope']], ['hiccup', '날아가는 앞쪽에 던져야 해.']]));
  G.hud.goal('양 지키기 (0/' + need + ')'); C.stage = 'guard';
  const sp = { easy: 1.5, normal: 2.2, hard: 2.8 }[G.diff] || 2.2;
  while (stopped < need) {
    const dt = yield; C.tk(dt); T2.step(dt);
    /* 볼라 더미 */
    G.useSpots = !T2.held ? [{ x: PILE.x, y: 0, z: PILE.z }] : [];
    if (!T2.held && P.fTap && G.near(PILE, 2.4)) T2.give();
    /* 테러 차례: 하늘에서 한 바퀴(예고 3초 · 그림자 · 울음) → 양에게 내려옴 → 물고 서쪽 벼랑으로 */
    next -= dt;
    if (next <= 0 && idx < ter.length && !ter.some((d) => d.st === 'circle' || d.st === 'dive' || d.st === 'carry')) { const d = ter[idx++]; d.st = 'circle'; d.t = 0; d.prey = flock.find((s) => !s.taken && !s.gone); next = 5; G.sfx.play('growl'); }
    for (const d of ter) {
      if (!d.root) continue;
      d.t += dt; const R = d.rig; R.fold = 0; R.flapRate = d.st === 'fall' || d.st === 'down' ? 0 : 1; R.tailCurl = d.st === 'flee' ? 1 : 0; R.update(dt);
      const s = d.prey;
      if (d.st === 'wait') { d.root.visible = false; continue; }
      d.root.visible = true;
      let px = d.x, pz = d.z, py = d.y;
      if (d.st === 'circle') { const a = d.t * 1.4; d.x = PEN.x + Math.cos(a) * 8; d.z = PEN.z + Math.sin(a) * 8; d.y = pl.height(PEN.x, PEN.z, 36) + 9; shadow.visible = true; shadow.position.set(d.x, pl.height(d.x, d.z, 36) + 0.05, d.z); if (d.t > WARN[G.diff] || !s) { d.st = s ? 'dive' : 'flee'; d.t = 0; } }
      else if (d.st === 'dive') { const k = Math.min(1, d.t / 1.0); d.x += (s.x - d.x) * k * 0.2; d.z += (s.z - d.z) * k * 0.2; d.y += (s.y + 1.4 - d.y) * Math.min(1, k * 0.25 + 0.05); if (Math.hypot(d.x - s.x, d.z - s.z) < 0.6 && d.y < s.y + 2) { d.st = 'carry'; d.t = 0; s.taken = true; s.manual = true; G.hud.say('hiccup', '양을 채 간다!', [], { secs: 1 }); } }
      else if (d.st === 'carry') { const ax = ESC.x - d.x, az = ESC.z - d.z, L = Math.hypot(ax, az) || 1; d.x += ax / L * sp * dt; d.z += az / L * sp * dt; d.y = pl.height(d.x, d.z, 36) + 2.8 + Math.sin(d.t * 3) * 0.25; if (s.root) { s.x = d.x; s.z = d.z; s.root.position.set(d.x, d.y - 1.25, d.z); } if (L < 3) { d.st = 'flee'; d.t = 0; s.gone = true; if (s.root) s.root.visible = false; lost++; G.hud.say('hiccup', '양 한 마리를 놓쳤다…', [], { secs: 1.4 }); } }
      else if (d.st === 'fall') { d.y = Math.max(pl.height(d.x, d.z, 36) + 0.3, d.y - dt * 7); if (s && s.taken) { s.taken = false; s.free = true; s.manual = false; } if (d.y <= pl.height(d.x, d.z, 36) + 0.35 && d.t > 0.4) { d.st = 'down'; d.t = 0; } }
      else if (d.st === 'down') { if (d.t > 2.4) { d.st = 'flee'; d.t = 0; G.inv.scale = (G.inv.scale || 0) + 1; E.puff('smoke', d.x, d.y + 0.3, d.z, 4, 0.6); G.hud.banner('그을린 비늘 조각 — 재료 상자에(기절시키면 가장 낮은 재료만)', 'shield', 3); } }
      else if (d.st === 'flee') { d.y += dt * 5; d.x += (ESC.x - d.x) * dt * 0.4; d.z += (ESC.z - d.z - 30) * dt * 0.3; if (d.t > 4) { d.st = 'gone'; d.root.visible = false; } }
      if (d.st !== 'gone') { d.root.position.set(d.x, d.y, d.z); const vx = d.x - px, vz = d.z - pz; d.vx = vx / Math.max(1e-4, dt); d.vz = vz / Math.max(1e-4, dt); if (Math.abs(vx) + Math.abs(vz) > 1e-4) d.root.rotation.set(d.st === 'down' ? 1.3 : 0, Math.atan2(vx, vz), 0, 'YXZ'); }
      if (d.st !== 'circle' && d.st !== 'wait' && d.st !== 'gone' && d === ter[idx - 1] && d.st !== 'carry') shadow.visible = false;
    }
    /* 풀려난 양은 우리로 돌아감 */
    for (const s of flock) if (s.free && s.root) { s.free = false; s.place(s.x, s.z); s.walkTo(s.home.x, s.home.z, 1.8); s.pose = { low: 0 }; }
    C.stopped = stopped; C.lost = lost;
    if (lost >= 2) { yield* T(C, sayAll(G, [['gobber', '양을 둘이나 잃었다! 다시 지켜 봐!']])); return 'retry'; }
    if (idx >= ter.length && ter.every((d) => d.st === 'gone' || d.st === 'wait') && stopped < need) { ter.forEach((d) => { d.st = 'wait'; d.t = 0; }); idx = 0; }   // 다 지나갔는데 모자라면 한 번 더
  }
  yield* T(C, sayAll(G, [['gobber', '잘했다! …그런데 어디 가냐, 히컵?'], ['hiccup', '(지금이 기회야. 남쪽 언덕에 숨겨 둔 내 발사기!)']]));
  G.records['1-4'] = { t: +C.t.toFixed(1), lost };
  return true;
}
function sheepSense(G, C) {
  const ts = (C.ter || []).filter((d) => d.root && d.root.visible && (d.st === 'carry' || d.st === 'circle' || d.st === 'dive') && G.vis(d.x, d.y, d.z)).map((d) => ({ x: +d.x.toFixed(2), y: +d.y.toFixed(2), z: +d.z.toFixed(2), vx: +(d.vx || 0).toFixed(2), vz: +(d.vz || 0).toFixed(2), carry: d.st === 'carry' }));
  return { stage: C.stage || '', pile: PILE, throw: C.T2 ? C.T2.sense() : null, terrors: ts, stopped: C.stopped || 0, lost: C.lost || 0, pen: PEN };
}

/* ── ⑤ 망루 볼라 발사기 — 별이 가려지며 빛 꼬리가 지나가는 곳 + (소리 켜짐) 휘파람 · F 꾹 = 겨누기(방향키 · 보통은 끌기도) · 놓으면 쏨 · 기회 셋(쉬움 무한) ── */
const HILL = { x: -20, z: 42, yaw: 0.15 };
function* launcher(G, C) {
  yield* ensureVillage(G, C);                                 // 늘 같은 마을 배치(설계한 골목·지붕 자리)
  const P = G.player, pl = G.place, top = HILL;
  const { sky } = hookFx(G, C, (dt) => { stepFury(dt); });
  look(G);
  const L = { x: top.x, y: pl.height(top.x, top.z, 20) + 1.7, z: top.z }, yaw0 = top.yaw;   // 남쪽 벼랑 언덕에서 바다 쪽
  /* 발사기(나무 틀 + 통) — 카메라 바로 앞 아래에 보임 */
  const gun = new THREE.Group(); gun.position.set(L.x, L.y - 1.2, L.z); pl.group.add(gun);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 2.2, 10).rotateX(Math.PI / 2).translate(0, 0, 0.9), toon({ color: 0x6a4a30 })); tube.position.y = 1.0; gun.add(tube);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 0.5), toon({ color: 0x5a3e28 })); frame.position.y = 0.45; gun.add(frame);
  const stars = makeStars(pl.group), trail = makeTrail(pl.group, 48);
  const bola = makeFlyer(pl.group, 'bola', { scale: 3 });
  /* 나이트 퓨리 — 바다 위 정해진 고리 길(가까운 쪽이 발사기 앞을 가로지름) · 몸은 검어 별을 가림 */
  const fwdx = Math.sin(yaw0), fwdz = Math.cos(yaw0), rtx = -Math.cos(yaw0), rtz = Math.sin(yaw0);
  const LC = { x: L.x + fwdx * 140, y: L.y + 55, z: L.z + fwdz * 140 }, RA = 80, RB = 50;
  const om = { easy: 0.3, normal: 0.42, hard: 0.52 }[G.diff] || 0.42;
  const NF = G.dragon('nightfury', { x: LC.x, z: LC.z, yaw: 0 }, { noCollide: true }); NF.manual = true; C.NF = NF;
  const aim = { yaw: yaw0, pitch: 0.38 }; C.aim = aim;
  let ph = Math.PI * 0.15, ft = 0, hitT = -1, shots = 0, cool = 0, fT = 0, whistled = false;
  const maxShots = G.diff === 'easy' ? 1e9 : 3;
  const fp = { x: 0, y: 0, z: 0 }, bp = { x: 0, y: 0, z: 0 };
  function furyAt(p, out) { out.x = LC.x + rtx * Math.cos(p) * RA + fwdx * Math.sin(p) * RB; out.z = LC.z + rtz * Math.cos(p) * RA + fwdz * Math.sin(p) * RB; out.y = LC.y + Math.sin(p * 2) * 9; return out; }
  function stepFury(dt) {
    ft += dt;
    if (hitT >= 0) {                                         // 맞음 → 빙글빙글 떨어짐(레이븐 포인트 너머 · 먼 구도)
      hitT += dt; fp.x += rtx * dt * 14 + fwdx * dt * 22; fp.z += rtz * dt * 14 + fwdz * dt * 22; fp.y -= dt * (8 + hitT * 6);
      if (NF.root) { NF.root.position.set(fp.x, fp.y, fp.z); NF.root.rotation.set(0.4, hitT * 7, hitT * 5, 'YXZ'); NF.rig.flapRate = 0; NF.rig.fold = 0.6; NF.rig.update(dt); }
      if ((ft * 30 | 0) % 2 === 0) trail.push(fp.x, fp.y, fp.z);
      return;
    }
    ph -= om * dt; furyAt(ph, fp);
    if (NF.root) { const nx = furyAt(ph - 0.05, bp); NF.root.position.set(fp.x, fp.y, fp.z); NF.root.rotation.set(0, Math.atan2(nx.x - fp.x, nx.z - fp.z), 0.5, 'YXZ'); NF.rig.flapRate = 0.6; NF.rig.fold = 0; NF.rig.glide = 0.6; NF.rig.update(dt); }
    if ((ft * 30 | 0) % 2 === 0) trail.push(fp.x, fp.y, fp.z);
    /* 휘파람(소리 짝) — 가까운 쪽으로 들어올 때 한 번 */
    const near = Math.sin(ph) < -0.55; if (near && !whistled) { whistled = true; G.sfx.play('whoosh'); } if (!near) whistled = false;
  }
  C.cleanup = ((old) => () => { gun.removeFromParent(); tube.geometry.dispose(); frame.geometry.dispose(); stars.dispose(); trail.dispose(); bola.dispose(); P.cam = 'follow'; P.hidden = false; G.camDraw = null; reticle.remove(); old && old(); })(C.cleanup);
  /* 조준점(화면 가운데 손그림 동그라미) */
  const reticle = document.createElement('div'); reticle.style.cssText = 'position:fixed;left:50%;top:50%;width:46px;height:46px;margin:-23px 0 0 -23px;z-index:19;pointer-events:none';
  reticle.innerHTML = '<svg viewBox="0 0 46 46" fill="none" stroke="#f4ead2" stroke-width="2.5" stroke-linecap="round"><circle cx="23" cy="23" r="15"/><path d="M23 2 L23 12 M23 34 L23 44 M2 23 L12 23 M34 23 L44 23"/></svg>';
  document.body.appendChild(reticle);
  /* 카메라 = 발사기 뒤 · 조준 방향 */
  P.cam = 'launch'; P.hidden = true; P.lock = true;
  const dir = new THREE.Vector3();
  G.camDraw = (a, dt) => {
    const cp = Math.cos(aim.pitch); dir.set(Math.sin(aim.yaw) * cp, Math.sin(aim.pitch), Math.cos(aim.yaw) * cp);
    G.camera.position.set(L.x - dir.x * 2.4, L.y + 0.6 - dir.y * 2.4, L.z - dir.z * 2.4); G.camera.lookAt(L.x + dir.x * 50, L.y + 0.6 + dir.y * 50, L.z + dir.z * 50);
    gun.rotation.set(0, aim.yaw, 0); tube.rotation.x = -aim.pitch;
    stars.follow(G.camera);
  };
  yield* T(C, until(() => NF.root, 5));
  yield* T(C, sayAll(G, [['hiccup', '내 볼라 발사기… 이번엔 꼭!', ['rope']], ['hiccup', '나이트 퓨리는 안 보여. 별이 가려지고 빛 꼬리가 지나가는 곳을 노려야 해.']]));
  G.hud.goal('나이트 퓨리 맞히기' + (maxShots < 99 ? ' (기회 ' + maxShots + ')' : ''));
  C.stage = 'aim';
  while (true) {
    const dt = yield; C.tk(dt); bola.step(dt);
    /* 조준 — 방향키(쉬움·보통) · 끌기(보통) */
    const lk = G.input.look();
    aim.yaw -= G.input.axis('left', 'right') * dt * 0.9 + (G.diff !== 'easy' ? lk.x * 0.004 : 0);
    aim.pitch = Math.max(0.05, Math.min(1.1, aim.pitch + G.input.axis('back', 'fwd') * dt * 0.7 - (G.diff !== 'easy' ? lk.y * 0.003 : 0)));
    if (cool > 0) cool -= dt;
    /* F 꾹(0.25초) = 겨누기 → 놓으면 쏨 */
    if (G.input.on('use')) fT += dt; else { if (fT > 0.25 && cool <= 0 && hitT < 0 && shots < maxShots) fire(); fT = 0; }
    C.loaded = cool <= 0;
    if (hitT > 0.2 && !C.cheered) { C.cheered = true; G.sfx.play('ok'); G.hud.banner('맞혔다! 검은 그림자가 빙글 떨어졌다', 'rope', 4); }
    if (hitT > 4.5) break;
    if (shots >= maxShots && cool <= 0 && !bola.on && hitT < 0) { yield* T(C, sayAll(G, [['hiccup', '볼라가 다 떨어졌다… 다시 장전!']])); return 'retry'; }
  }
  yield* T(C, sayAll(G, [['hiccup', '맞혔어…! 내가 맞혔다고! 레이븐 포인트 너머로 떨어졌어!']]));
  G.flags.hitFury = true; G.records['1-5'] = { shots, t: +C.t.toFixed(1) };
  P.cam = 'follow'; P.hidden = false; P.lock = false; G.camDraw = null; reticle.remove();
  return true;
  function fire() {
    shots++; cool = 1.2; G.sfx.play('bang');
    const cp = Math.cos(aim.pitch), dx = Math.sin(aim.yaw) * cp, dy = Math.sin(aim.pitch), dz = Math.cos(aim.yaw) * cp, V = 190;
    /* 맞음 판정 — 볼라가 날아가는 1.6초 동안 같은 걸음으로 앞날을 그려 봄(가장 가까운 거리) */
    const R = G.diff === 'easy' ? 14 : G.diff === 'hard' ? 6 : 9;
    let best = 1e9, bt = 0; const q = { x: 0, y: 0, z: 0 };
    for (let k = 1; k <= 72; k++) { const tt = k / 60; furyAt(ph - om * tt, q); const d = Math.hypot(L.x + dx * V * tt - q.x, L.y + dy * V * tt - q.y, L.z + dz * V * tt - q.z); if (d < best) { best = d; bt = tt; } }
    const hit = best < R;
    const end = hit ? bt : 1.2;
    bola.go(L.x + dx * 2, L.y + dy * 2, L.z + dz * 2, L.x + dx * V * end, L.y + dy * V * end, L.z + dz * V * end, end, 0, () => {
      if (hit) { hitT = 0; furyAt(ph, fp); G.sfx.play('roar'); }
      else G.hud.say('hiccup', shots < maxShots ? '빗나갔다… 빛 꼬리가 오는 쪽으로 조금 앞을!' : '빗나갔다…', [], { secs: 1.4 });
    });
    C.lastMiss = hit ? 0 : +best.toFixed(1);
  }
}
function launchSense(G, C) {
  const tr = C.NF && C.NF.root, s = { stage: C.stage || '', aim: C.aim ? { yaw: +C.aim.yaw.toFixed(4), pitch: +C.aim.pitch.toFixed(4) } : null, loaded: !!C.loaded };
  if (tr && G.vis(tr.position.x, tr.position.y, tr.position.z, 900)) s.head = { x: +tr.position.x.toFixed(1), y: +tr.position.y.toFixed(1), z: +tr.position.z.toFixed(1) };   // 빛 꼬리 머리(별이 가려지는 자리)
  s.cam = { x: +G.camera.position.x.toFixed(2), y: +G.camera.position.y.toFixed(2), z: +G.camera.position.z.toFixed(2) };
  return s;
}

/* ── 이어서(이음) — 나이트메어가 쫓아옴(예고 3초) → 스토이크가 막음 → 드래곤들이 양을 물고 달아남 · 아무도 안 믿음 ── */
function* chase(G, C) {
  yield* ensureVillage(G, C);                                 // 늘 같은 마을 배치(설계한 골목·지붕 자리)
  const P = G.player, pl = G.place;
  const { sky } = hookFx(G, C, (dt) => { downTick(G, C, dt); });
  look(G);
  const ax = P.W.x + Math.sin(P.W.yaw) * 14, az = P.W.z + Math.cos(P.W.yaw) * 14;   // 내 앞(먼저 보이게 · 깜짝 X)
  const N = G.dragon('nightmare', { x: ax, z: az, yaw: P.W.yaw + Math.PI }, { noCollide: true, mind: { fear: 0.2, anger: 0.7 } }); N.solid = true; N.radius = 2; N.mind.lock = 'watch';
  const glow = glowSprite(0xff7a2a, 8, 0.45); glow.visible = false; pl.group.add(glow);
  C.cleanup = ((old) => () => { glow.removeFromParent(); old && old(); })(C.cleanup);
  yield* T(C, until(() => N.root, 5));
  yield* T(C, sayAll(G, [['hiccup', '…저기, 나 혼자 맞혔다고요— 어?']]));
  G.hud.goal('피하기'); G.sfx.play('growl');
  N.mind.windup(3); N.faceTo(P.W.x, P.W.z);
  G.hud.say('hiccup', '나이트메어가 달아오른다…!', [], { secs: 2 });
  yield* T(C, until(() => { glow.visible = N.mind.warnT > 0; glow.position.set(N.x, N.y + 2, N.z); return N.mind.beh === 'attack'; }, 6));
  glow.visible = false;
  N.mind.lock = 'idle'; N.goTo(P.W.x, P.W.z, 7, 1.2);
  let hitOnce = false;
  yield* T(C, until(() => { if (!hitOnce && G.dist(P.W, N) < 2.4 && !(P.W.rollT > 0)) { hitOnce = true; knock(G, C, '으악!'); } return N.arrived(); }, 2.5));
  /* 스토이크가 뛰어들어 막음 */
  const S = G.person('stoick', { x: P.W.x - 4, z: P.W.z - 3, yaw: 0 }, { noCollide: true });
  yield* T(C, until(() => S.root, 4)); holdItem(S, 'shield');
  S.walkTo((P.W.x + N.x) / 2, (P.W.z + N.z) / 2, 4.5); S.pose = { cheer: 0.3 };
  yield* T(C, wait(0.8));
  S.faceTo(N.x, N.z); S.pose = { point: 1 }; G.sfx.play('bang');
  N.mind.event('loud'); N.goTo(N.x + (N.x - P.W.x) * 2, N.z + (N.z - P.W.z) * 2, 5, 2);
  yield* T(C, sayAll(G, [['stoick', '물러가라!', ['shield']]]));
  /* 하늘의 드래곤들이 양을 물고 북쪽으로 — 꼬리를 말고 뒤돌아봄(겁먹은 신호) */
  for (const D of sky.ds) { D.sky.scared = true; D.sky.cz -= 0; D.sky.w *= 1.8; }
  C.leaveT = 0;
  const leave = (dt) => { C.leaveT += dt; for (const D of sky.ds) { D.sky.h += dt * 6; D.sky.r += dt * 10; } };
  const oldTk = C.tk; C.tk = (dt) => { oldTk(dt); leave(dt); };
  S.faceTo(P.W.x, P.W.z); S.pose = { talk: 1 };
  P.lock = false; P.pose = null;
  yield* T(C, sayAll(G, [
    ['stoick', '들어가 있으랬지! …드래곤들이 양을 물고 달아난다.'],
    ['hiccup', '아빠, 제가 나이트 퓨리를 맞혔어요! 레이븐 포인트 너머로 떨어졌어요!', ['rope']],
    ['villager', '하하, 또 그 낙서 공책 얘기냐?', ['book']],
    ['stoick', '…집에 가거라, 히컵.'],
  ]));
  holdItem(P, 'book');
  yield* T(C, sayAll(G, [['hiccup', '(진짜로 맞혔어. 아무도 안 믿어도.)', ['book']]]));
  holdItem(P, null);
  seedVillage(G);                                            // 다음 차례(새벽 마을)를 같은 배치로
  return true;
}

/* ── 아침(이음) — 그을린 지붕과 덧댄 새 판자 · 재료 상자에 비늘 조각 · 지도에 '레이븐 포인트 너머' ── */
function* morning(G, C) {
  yield* ensureVillage(G, C);                                 // 늘 같은 마을 배치(설계한 골목·지붕 자리)
  const P = G.player, pl = G.place, A = pl.anchors;
  const HS = houseInfo(pl).slice(0, 3);
  const fix = HS.map((H, i) => G.person(['villager1', 'villager2', 'villager3'][i], { x: H.cx + Math.cos(H.yaw) * (H.w / 2 + 1.6), z: H.cz - Math.sin(H.yaw) * (H.w / 2 + 1.6), yaw: 0 }, { noCollide: true }));
  yield* T(C, until(() => fix.every((h) => h.root), 5));
  fix.forEach((h, i) => { h.faceTo(HS[i].cx, HS[i].cz); h.pose = { hammer: 1 }; holdItem(h, 'hammer'); });
  G.hud.banner('아침 — 그을린 지붕에 새 판자를 덧댔다', 'hammer', 3.5);
  const Gb = G.person('gobber', { x: (A.plaza || P.W).x + 2.5, z: (A.plaza || P.W).z + 1.5, yaw: 0 }, { noCollide: true });
  yield* T(C, until(() => Gb.root, 4)); Gb.faceTo(P.W.x, P.W.z); Gb.pose = { talk: 1 };
  const sc = G.inv.scale || 1; G.inv.scale = sc;
  yield* sayAll(G, [
    ['gobber', '밤새 지붕을 ' + (3 + (G.flags.burnt || []).length * 4) + '개나 고쳤지. …아니, ' + (12 + (G.flags.burnt || []).length * 9) + '개였나?'],
    ['hiccup', '재료 상자에 그을린 비늘 조각이 ' + sc + '개.', ['shield']],
  ]);
  G.hud.banner('지도 — 레이븐 포인트 너머에 ✕', 'map', 3.5); G.flags.ravenX = true;
  holdItem(P, 'book');
  yield* sayAll(G, [['hiccup', '레이븐 포인트 너머… 내가 직접 찾을 거야.', ['map']]]);
  holdItem(P, null);
  return true;
}

export const chapter = {
  id: 1, title: '1장 · 습격의 밤', sub: '대장간 → 불난 지붕 → 양 우리 → 망루',
  steps: [
    { id: '1-0', place: 'village', time: 'night', at: { x: 16, z: -2, yaw: -1.45 }, run: intro, sense: () => ({}) },
    { id: '1-1', verb: 'track', howtoVerb: 'listen', place: 'village', time: 'night', at: 'forge_front', goal: '도끼 가지러 대장간 안으로', easy: false, limit: 200,
      bookPage: { title: '무기 나르기', draw: 'gronckle', line: '대장간 도끼를 바이킹 셋에게 날랐다. 불난 골목과 드래곤이 앉은 골목은 돌아갔다.' },
      hints: { 1: '불난 길은 못 지나가. 다른 골목이나 지붕 사다리로!', 2: '드래곤이 앉은 길도 피하자 · 사다리 앞에서 F · 횃불 든 바이킹 곁에서 F.' }, run: weapons, sense: weaponSense },
    { id: '1-2', verb: 'throw', place: 'village', time: 'night', at: { x: 6.6, z: 12.6, yaw: 0.15 }, goal: '지붕 불 끄기', easy: false, limit: 240,
      bookPage: { title: '지붕 불', draw: 'nightmare', line: '친구들 물통 줄에 끼어 지붕 불을 껐다. 바람 아래 지붕이 먼저 번졌다.' },
      hints: { 1: '연기가 흘러가는 쪽 지붕이 먼저 번져. 그쪽부터!', 2: 'F 꾹 = 겨누기 · 놓으면 던짐 · 빈손으로 처마 밑 F 꾹 = 갈고리.' }, run: fire, sense: fireSense },
    { id: '1-3', verb: 'dodge', place: 'village', time: 'night', at: { x: -6.5, z: 12.5, yaw: -1.0 }, goal: '양 우리까지 가기', limit: 220,
      hints: { 1: '드래곤마다 쏘기 전 몸짓이 달라. 보고 피하자.', 2: '가시 = 옆으로 구르기(Space) · 볼 = 방향 바꾸기 · 달아오름 = 물러서기 · 초록 김 = 빠져나오기.' }, run: gauntlet, sense: gauntSense },
    { id: '1-4', verb: 'throw', place: 'village', time: 'night', at: { x: -40.5, z: -39.6, yaw: -2.6 }, goal: '양 지키기', limit: 220,
      hints: { 1: '테러가 날아가는 앞쪽에 던지자.', 2: '볼라 더미에서 F · F 꾹 겨누고 놓기.' }, run: sheep, sense: sheepSense },
    { id: '1-5', verb: 'throw', place: 'village', time: 'night', at: { x: -20, z: 40, yaw: 0.15 }, goal: '나이트 퓨리 맞히기', limit: 200,
      hints: { 1: '별이 꺼지며 빛 꼬리가 지나가는 길을 보자.', 2: '그 길 위에 조준점을 두고, 빛 꼬리가 오기 조금 전에 놓자(F 꾹 → 놓기).' }, run: launcher, sense: launchSense },
    { id: '1-6', place: 'village', time: 'night', at: { x: -20, z: 39.5, yaw: Math.PI / 2 }, run: chase, sense: () => ({}) },
    { id: '1-7', place: 'village', time: 'dawn', variant: 'charred', at: 'plaza', run: morning, sense: () => ({}) },
  ],
};
