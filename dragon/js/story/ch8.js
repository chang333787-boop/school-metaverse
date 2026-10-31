// 8장 아스트리드와 둥지(design §2 · reference A #19·#20 · 0의 9번) — 노을 분홍·금 → 밤 오로라 → 둥지 검붉은 회색(design §15)
// ① (이음) 짐 보따리 → 아스트리드가 따짐 → 투슬리스가 낚아챔 ② [관문 비행 · 버티기] 화난 비행: 기울면 반대로 · 곤두박질엔 ↑
// ③ [관문 비행] 사과 뒤 노을 구름 위 고요한 비행 → 밤 오로라(구름 탑 사이 · 구름 속 숨기 연습 · 실패 없음 · 목표 넷)
// ④ [시선 피해 숨기 · 비행] 드래곤 떼 속 내 자리(가운데 주머니)에 머묾 · 벗어나면 떼 눈이 뜨임(예고) → 들킴 = 다시 · 부딪히지 않기
// ⑤ [시선 피해 숨기] 둥지: 1장 그 양 · 생선 바구니 · 그롱클 생선 한 마리 → 대장의 그림자와 소리만 · 콧구멍 벌름(짝 신호) 동안 바위 턱에서 멈춤 → 틈으로
// ⑥ [관문 비행] 와! 구름을 뚫고 올라 오로라 아래로 · 약속 — 변화 = 책 둥지 쪽 '대장만 나쁘다' · 하늘 지도 안개 바다
// 대사는 모두 새로 씀(원문 X) · 삼키는 장면 화면 밖 · 깜짝 X(예고 먼저) · 구름·떼·오로라는 G.place.group에 붙였다가 장소와 함께 치움
import * as THREE from 'three';
import { wait, until, sayAll } from './runner.js?v=18';
import { holdItem, makeItem, makePuffs } from './fx.js?v=18';
import { toon, setTime } from '../look/kit.js?v=18';
import { createClouds, towerSpheres, clumpSpheres, deckTop, DECK } from '../look/clouds.js?v=18';
import { createNightSky, blendTime } from '../look/aurora.js?v=18';
import { createFlock } from '../play/flock.js?v=18';
import { createFlight, createFlightCam } from '../play/flight.js?v=18';
import { createRng } from '../core/rng.js?v=18';
import { flySense as fsFlat } from './flysense.js?v=18';
import { HOWTO, ICONS, keyCap } from '../ui/art.js?v=18';

const INK = '#2b2118';
const svg = (b) => `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${b}</svg>`;
/* 이 장에서 더 쓰는 그림(손그림 · 있는 그림 목록에 이름만 더함) */
ICONS.cloud = ICONS.cloud || svg('<path d="M7 23 C2 23 2 16 7 16 C7 10 15 9 17 13 C19 9 27 10 26 16 C30 16 30 23 25 23 Z" fill="#f4ead2"/>');
ICONS.nose = ICONS.nose || svg('<path d="M4 20 C6 10 26 10 28 20 C24 26 8 26 4 20 Z" fill="#5a4a46"/><ellipse cx="11" cy="19" rx="3" ry="2" fill="#1a1412"/><ellipse cx="21" cy="19" rx="3" ry="2" fill="#1a1412"/>');
ICONS.flock = ICONS.flock || svg('<path d="M3 12 L8 9 L13 12 M17 8 L22 5 L27 8 M10 22 L15 19 L20 22"/><circle cx="15" cy="15" r="4" stroke-dasharray="2 2"/>');
ICONS.sheep = ICONS.sheep || svg('<ellipse cx="16" cy="17" rx="10" ry="7" fill="#f4ead2"/><circle cx="26" cy="14" r="3.5" fill="#5a4a46"/><path d="M10 24 L10 28 M20 24 L20 28"/>');
ICONS.fist = ICONS.fist || svg('<path d="M8 12 C8 8 22 8 24 12 L24 20 C24 25 10 25 8 20 Z" fill="#f0c9a8"/><path d="M12 11 L12 16 M16 10 L16 16 M20 11 L20 16"/>');
const ARR2 = `<span class="keys">${keyCap('←')}${keyCap('→')}</span>`, ARR4 = `<span class="keys">${keyCap('←')}${keyCap('↑')}${keyCap('→')}</span>`;
HOWTO.cling8 = [[ARR2, ICONS.wind, '기울면 반대쪽'], [keyCap('↑'), ICONS.fin, '곤두박질엔 ↑ 꾹'], ['', ICONS.hand, '손이 미끄러지지 않게']];
HOWTO.glide8 = [[ARR4, ICONS.wind, '방향 · ↑ 오르기'], ['', ICONS.cloud, '구름 속 = 숨기'], ['', 'wing', '앞으로는 저절로']];
HOWTO.flock8 = [[ARR4, ICONS.flock, '떼 가운데 내 자리'], ['', ICONS.eye, '눈이 뜨이면 안쪽으로'], ['', 'wait', '부딪히지 않기']];
HOWTO.sniff8 = [[keyCap('Shift', true), 'tiptoe', '살금살금(낮게)'], ['', ICONS.nose, '콧구멍 벌름 = 낮게 멈춤'], [`<span class="keys">${keyCap('W')}${keyCap('A')}${keyCap('S')}${keyCap('D')}</span>`, 'rock', '바위 턱 → 틈']];

const WARN = { easy: 3, normal: 2.5, hard: 2 };
const SADDLE = new THREE.Vector3(0, 1.16, -0.05), BACK = new THREE.Vector3(0, 1.1, -0.74);
const _v = new THREE.Vector3(), _q = new THREE.Quaternion(), _e = new THREE.Euler(0, 0, 0, 'YXZ');
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

/* ── 바다 위 하늘(구름 바다 · 구름 탑 · 밤하늘) — 장소마다 한 번 지어 두고 차례마다 보이기만 바꿈(장소가 바뀌면 group째 치워짐) ── */
const C3 = {                                            // ③ 구름 위 길: 출발 · 목표 넷(구름 문 · 큰 구름 속 · 구름 문 · 오로라 아래)
  start: { x: 40, y: 262, z: -360, yaw: 0 },
  gates: [{ x: -30, y: 258, z: -200, r: 12, kind: 'gap' }, { x: 25, y: 240, z: -52, r: 13, kind: 'hide' }, { x: 118, y: 255, z: 86, r: 12, kind: 'gap' }, { x: 70, y: 300, z: 250, r: 16, kind: 'aurora' }],
};
const C6 = {                                            // ⑥ 구름 밑 → 구름 속 → 구름 위 → 오로라 아래
  start: { x: 40, y: 172, z: -390, yaw: 0 },
  gates: [{ x: -14, y: 214, z: -246, r: 14, kind: 'in' }, { x: 22, y: 266, z: -118, r: 14, kind: 'out' }, { x: 44, y: 300, z: 30, r: 16, kind: 'aurora' }],
};
const AUR_AZ = Math.atan2(C3.gates[3].x - C3.start.x, C3.gates[3].z - C3.start.z);
const FLOCK_PATH = [[52, 258, -620], [56, 255, -525], [60, 252, -430], [70, 246, -330], [40, 236, -230], [-20, 222, -150], [-62, 210, -52], [-52, 196, 58], [0, 184, 150], [80, 172, 210], [160, 160, 252], [232, 150, 322], [268, 142, 420]].map(([x, y, z]) => ({ x, y, z }));

function sky(G) {
  const pl = G.place; if (pl.__c8) return pl.__c8;
  const R = createRng(808), sp = [];
  /* 구름 문 둘(③) — 문 양옆에 구름 탑 · 큰 구름 무더기(③ 숨기) */
  const gs = C3.gates;
  [0, 2].forEach((gi) => {
    const g = gs[gi], p = gi ? gs[gi - 1] : C3.start, n = gs[gi + 1];
    const yaw = Math.atan2((n.x - p.x), (n.z - p.z)), rx = -Math.cos(yaw), rz = Math.sin(yaw);
    for (const s of [1, -1]) towerSpheres(sp, g.x + rx * s * 27, g.z + rz * s * 27, 78, 14.5, R);
  });
  clumpSpheres(sp, gs[1].x, gs[1].y - 2, gs[1].z, 22, R, 7);
  /* ⑥ 구름 위로 나온 자리 둘레 탑 둘 */
  towerSpheres(sp, C6.gates[1].x + 46, C6.gates[1].z + 30, 60, 13, R);
  towerSpheres(sp, C6.gates[1].x - 52, C6.gates[1].z + 60, 52, 12, R);
  /* 먼 구름 탑 — 길에서 비켜서 */
  const pts = [C3.start, ...gs];
  const segD = (x, z) => { let d = 1e9; for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], ex = b.x - a.x, ez = b.z - a.z, L = ex * ex + ez * ez; let t = ((x - a.x) * ex + (z - a.z) * ez) / L; t = clamp(t, 0, 1); d = Math.min(d, Math.hypot(x - a.x - ex * t, z - a.z - ez * t)); } return d; };
  for (let k = 0, n = 0; k < 400 && n < 9; k++) {
    const a = R() * Math.PI * 2, d = 160 + R() * 560, x = 40 + Math.cos(a) * d, z = -60 + Math.sin(a) * d;
    if (segD(x, z) < 75) continue;
    towerSpheres(sp, x, z, 30 + R() * 55, 11 + R() * 8, R); n++;
  }
  const CL = createClouds({ group: pl.group, spheres: sp });
  const NS = createNightSky({ group: pl.group, az: AUR_AZ });
  CL.show(false); NS.set(0, true);
  return (pl.__c8 = { CL, NS });
}

/* 걸음(그리기)마다 바탕 — 때 섞기 → 구름 색·격자 → 구름 속 안개 → 밤하늘 */
function envFrame(G, C, dt) {
  const env = G.env;
  if (C.tm) blendTime(env, C.tm.a, C.tm.b, C.tm.k, C.tm.over);
  if (C.fogOver) C.fogOver();
  const SK = C.SK; if (!SK) return;
  const cc = C.cc || ['sunset', 'sunset', 0];
  SK.CL.setColors(cc[0], cc[1], cc[2]);
  SK.CL.follow(G.camera);
  if (C.white > 0) C.white -= dt;
  SK.CL.fog(G.scene, env, G.camera, clamp(C.white || 0, 0, 1));
  SK.NS.follow(G.camera, dt); SK.CL.uni.uAur.value = SK.NS.k;
}
/* 짙은 안개·밤 구름 밑에서는 바다·먼 구름 판을 숨김 — 그 둘은 셰이더 재질이라 안개 색이 밝게 뜸(kit 바다 셰이더 · 메인에 알림) · 빈 화소 = 하늘 아랫색 = 안개 색 */
function hideSea(G, C, on, sea = true) {
  if (!C.seaHide) { C.seaHide = [G.env.sea]; G.place.group.children.forEach((o) => { if (o.isInstancedMesh && o.material && o.material.isShaderMaterial && o.material.uniforms && o.material.uniforms.tint) C.seaHide.push(o); }); }
  for (const o of C.seaHide) o.visible = !on || (!sea && o === G.env.sea);
}
/* 노을(0) → 해 질 녘(0.5) → 밤(1) 구름 색 */
function cloudCols(k, out) { if (k < 0.5) { out[0] = 'sunset'; out[1] = 'dusk'; out[2] = k * 2; } else { out[0] = 'dusk'; out[1] = 'night'; out[2] = (k - 0.5) * 2; } return out; }   // 걸음마다 새 배열 X
function restoreEnv(G, C) {
  const t = (C.st && C.st.time) || 'sunset';
  if (G.place && G.place.setTime) G.place.setTime(t); else setTime(G.env, t);
  if (C.SK) { C.SK.CL.show(false); C.SK.NS.set(0, true); C.SK.NS.follow(G.camera); }
  if (C.seaHide) hideSea(G, C, false);
  G.camera.fov = 60; G.camera.updateProjectionMatrix();
}

/* 탄 사람 자리 — 드래곤 뿌리 + 회전된 안장 자리 */
function seat(T, H, off) { _v.copy(off).applyQuaternion(T.root.quaternion); H.root.position.copy(T.root.position).add(_v); H.root.quaternion.copy(T.root.quaternion); }

/* 화면 가장자리 화살표(다음 목표가 화면 밖일 때만) — 종이 동그라미 + 잉크 화살 */
function makeArrow() {
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;z-index:21;width:46px;height:46px;margin:-23px 0 0 -23px;background:#f4ead2;border:2px solid #2b2118;border-radius:50%;box-shadow:2px 3px 0 rgba(43,33,24,.3);display:none;pointer-events:none';
  el.innerHTML = '<svg viewBox="0 0 46 46" width="42" height="42" style="display:block;margin:0 auto"><path d="M10 23 L34 23 M25 14 L34 23 L25 32" fill="none" stroke="#2b2118" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  document.body.appendChild(el);
  return {
    at(G, p) {
      if (!p) { el.style.display = 'none'; return; }
      const s = G.toScreen(p.x, p.y, p.z), W = innerWidth, H = innerHeight, m = 60;
      if (s.front && s.x > m && s.x < W - m && s.y > m && s.y < H - m) { el.style.display = 'none'; return; }
      let dx = s.x - W / 2, dy = s.y - H / 2; if (!s.front) { dx = -dx; dy = -dy; if (Math.abs(dx) < 1 && Math.abs(dy) < 1) dy = 1; }
      const k = Math.min((W / 2 - m) / Math.max(1e-3, Math.abs(dx)), (H / 2 - m) / Math.max(1e-3, Math.abs(dy)));
      el.style.left = (W / 2 + dx * k) + 'px'; el.style.top = (H / 2 + dy * k) + 'px'; el.style.transform = 'rotate(' + Math.atan2(dy, dx) + 'rad)'; el.style.display = '';
    },
    dispose() { el.remove(); },
  };
}

/* ── 비행 차례 공용(③④⑥) — 비행 엔진(팀 F) + 뒤에 아스트리드 + 구름·밤하늘 바탕 ── */
function worldOf(G, ceil = 360, bounds = { x: 40, z: -40, r: 620 }) {
  const f = G.place.fly || {};
  return { ground: () => -60, water: 0, pillars: f.pillars || [], arches: f.arches || [], ceil, bounds };
}
function* ride(G, C, o) {
  const P = G.player;
  const T = G.dragon('nightfury', { x: o.start.x, z: o.start.z }, { noCollide: true, mind: { fear: 0.1, trust: 0.85 } });
  const As = G.person('astrid', { x: o.start.x, z: o.start.z }, { noCollide: true });
  yield* until(() => T.root && As.root && P.root);
  T.manual = true; As.manual = true; holdItem(P, null);
  const F = createFlight({ world: o.world, mode: G.diff, dragon: { root: T.root, rig: T.rig }, rider: { root: P.root, rig: P.rig }, rng: G.rng });
  F.setOpts(Object.assign({ autoForward: true, tailAuto: true, gusts: false, assist: true, ceil: o.world.ceil }, o.opts || {}));
  F.place(o.start.x, o.start.y, o.start.z, o.start.yaw || 0, 23);
  if (o.gates) F.setGates(o.gates);
  const cam = createFlightCam(G.camera);
  P.cam = 'fly';
  C.F = F; C.T = T; C.As = As;
  G.camDraw = (a, dt) => {
    F.draw(a, dt);
    seat(T, As, BACK); const R = As.rig; R.ride = 1; R.cower = C.asCower || 0; R.point = C.asPoint || 0; R.update(dt);
    cam.update(dt, F); envFrame(G, C, dt);
    if (C.onDraw) C.onDraw(a, dt);
  };
  const prev = C.cleanup;
  C.cleanup = () => { T.manual = false; As.manual = false; P.cam = 'follow'; G.camDraw = null; restoreEnv(G, C); prev && prev(); };
  return F;
}

/* ① (이음) 짐 보따리 → 아스트리드가 따짐 → 투슬리스가 낚아채 나무 위에 → 같이 타기 */
function makePack() {
  const g = new THREE.Group(), geos = [];
  const add = (geo, color, x, y, z, rx = 0, rz = 0) => { geos.push(geo); const m = new THREE.Mesh(geo, toon({ color })); m.position.set(x, y, z); m.rotation.set(rx, 0, rz); g.add(m); };
  add(new THREE.SphereGeometry(0.42, 10, 7).scale(1, 0.75, 0.85), 0x8a6a46, 0, 0.32, 0);
  add(new THREE.CylinderGeometry(0.17, 0.17, 0.9, 9), 0x9a4a3a, 0, 0.66, 0, 0, Math.PI / 2);
  add(new THREE.TorusGeometry(0.43, 0.035, 5, 14), 0x5a3e24, 0, 0.32, 0, Math.PI / 2);
  add(new THREE.CylinderGeometry(0.03, 0.03, 1.2, 5), 0x6a4a2e, 0.35, 0.55, 0.1, 0.3, -0.5);
  g.dispose = () => { g.removeFromParent(); geos.forEach((x) => x.dispose()); };
  return g;
}
function* lift(G, H, to, secs, arcH, upd) {        // 사람 배우를 포물선으로 옮김(장이 직접 · 자세 갱신)
  const fx = H.root.position.x, fy = H.root.position.y, fz = H.root.position.z;
  H.manual = true;
  for (let t = 0; t < secs;) { const dt = yield; t += dt; const k = Math.min(1, t / secs), e = k * k * (3 - 2 * k); H.root.position.set(fx + (to.x - fx) * e, fy + (to.y - fy) * e + Math.sin(Math.PI * k) * arcH, fz + (to.z - fz) * e); if (upd) upd(k); H.rig.update(dt); }
}
/* 멈춰 선 히컵이 볼 곳으로 몸·카메라를 천천히 돌림(이음 장면이 화면 밖에서 일어나지 않게) */
function frameTo(G, p, dt, k = 2.6) {
  if (!p) return; const W = G.player.W, Cm = G.player.C;
  Cm.yaw += wrap(Math.atan2(W.x - p.x, W.z - p.z) - Cm.yaw) * Math.min(1, dt * k); Cm.idle = 0;
  W.yaw += wrap(Math.atan2(p.x - W.x, p.z - W.z) - W.yaw) * Math.min(1, dt * k); W.pyaw = W.yaw;
}
function* talk(G, lines, focus) { for (const l of lines) G.hud.say(l[0], l[1], l[2] || [], l[3] || {}); while (G.hud.busy()) { const dt = yield; frameTo(G, focus && focus(), dt); } }
function* snatch(G, C) {
  const P = G.player, pl = G.place, A = pl.anchors;
  const rr = A.rest_rock || A.sand || A.floor || { x: 0, z: 0 }, sand = A.sand || A.floor || { x: rr.x + 6, z: rr.z };
  const pk = G.flags.pack && G.flags.pack.x != null ? G.flags.pack : { x: rr.x + (sand.x - rr.x) * 0.35, z: rr.z + (sand.z - rr.z) * 0.35 };
  const pack = makePack(); pack.position.set(pk.x, pl.height(pk.x, pk.z, 0), pk.z); pl.group.add(pack);
  C.cleanup = () => pack.dispose();
  const away = Math.atan2(rr.x - sand.x, rr.z - sand.z), hx = rr.x + Math.sin(away) * 4, hz = rr.z + Math.cos(away) * 4;   // 바위 뒤(모래 마당 반대쪽)
  const As = G.person('astrid', { x: pk.x + 1.3, z: pk.z + 0.9, yaw: 0 });
  const T = G.dragon('nightfury', { x: hx, z: hz, yaw: away + Math.PI }, { mind: { fear: 0.2, trust: 0.8 } }); T.mind.lock = 'idle'; T.stay(); T.solid = true;
  yield* until(() => As.root && T.root);
  As.faceTo(P.W.x, P.W.z);
  C.stage = 'walk'; C.target = { x: pk.x, z: pk.z };
  G.hud.goal('짐 보따리 쪽으로'); G.useSpots = [{ x: pk.x, y: 0, z: pk.z }];
  yield* until(() => G.near(pk, 5));
  G.useSpots = []; G.hud.goal(''); P.lock = true; C.stage = 'talk'; As.faceTo(P.W.x, P.W.z); As.pose = { talk: 1 };
  yield* talk(G, [['astrid', '이 짐 뭐야? 어디 가려고?', ['saddle']], ['hiccup', '그, 그게… 설명하자면 길어.'], ['astrid', '요즘 훈련장에서 이상하다 했어. 누구 만나지?']], () => As);
  T.goTo(As.x + Math.sin(away) * 2.4, As.z + Math.cos(away) * 2.4, 3.2, 0.6); T.pose = { crouch: 0.6, ear: -0.7 }; G.sfx.play('growl');
  G.hud.say('hiccup', '투슬리스, 안 돼—!');
  for (let t = 0; t < 4 && !T.arrived();) { const dt = yield; t += dt; frameTo(G, { x: (As.x + T.x) / 2, z: (As.z + T.z) / 2 }, dt); }
  T.faceTo(As.x, As.z); As.pose = { cower: 1 }; As.faceTo(T.x, T.z);
  yield* talk(G, [['astrid', '드… 드래곤?!']], () => ({ x: (As.x + T.x) / 2, z: (As.z + T.z) / 2 }));
  /* 낚아채 나무 위로 — 투슬리스가 옷깃을 물고 껑충 · 아스트리드는 나뭇가지 위에(다치지 않음) · 나무가 멀면 바위 위로 */
  let tr = A.tree_low && Math.hypot(A.tree_low.x - As.x, A.tree_low.z - As.z) < 11 ? A.tree_low : null;
  const ty = tr ? pl.height(tr.x, tr.z, 0) + 4.2 : pl.height(rr.x, rr.z, 0) + 2.6;
  if (!tr) tr = { x: rr.x + (As.x - rr.x) * 0.15, z: rr.z + (As.z - rr.z) * 0.15 };
  T.goTo(tr.x + 1.6, tr.z + 1.2, 4, 0.8); T.pose = { crouch: 0.2, jaw: 0.4 }; As.rig.cower = 1;
  const lifting = lift(G, As, { x: tr.x, y: ty, z: tr.z }, 1.3, 2.2, (k) => { T.rigY = Math.sin(Math.PI * k) * 1.3; });
  for (let r = lifting.next(0); !r.done; ) { const dt = yield; frameTo(G, tr, dt, 4); r = lifting.next(dt); }
  T.rigY = 0; T.pose = { ear: 0.5 }; T.faceTo(tr.x, tr.z);
  yield* talk(G, [['astrid', '내려 줘! 당장!'], ['hiccup', '투슬리스, 그만. …아스트리드, 말로는 안 돼.'], ['hiccup', '보여 줄게. 같이 타.'], ['astrid', '…이상하면 그걸로 끝이야.']], () => tr);
  const dn = { x: T.x + 2.2, z: T.z - 1.2 }; dn.y = pl.height(dn.x, dn.z, 0);
  const down = lift(G, As, dn, 1.0, 0.6);
  for (let r = down.next(0); !r.done; ) { const dt = yield; frameTo(G, T, dt); r = down.next(dt); }
  As.manual = false; As.place(dn.x, dn.z); As.pose = {}; As.faceTo(T.x, T.z);
  T.pose = {}; T.faceTo(P.W.x, P.W.z);
  P.lock = false; C.stage = 'mount'; C.target = { x: T.x, z: T.z };
  G.hud.goal('투슬리스에 올라타기'); G.useSpots = [{ x: T.x, y: 0, z: T.z }];
  yield* until(() => P.fTap && G.near(T, 3.4));
  G.useSpots = []; G.hud.say('hiccup', '꽉 잡아!', [], { secs: 1.2 });
  yield* wait(0.8);
  return true;
}

/* ② 화난 비행 — 투슬리스가 일부러 기울고 곤두박질 · 반대로 잡아 버팀(꽉 잡기 줄) · 대본 길(장이 그림) + 내 손은 기울기만 */
const MAN = {
  easy:   { RT: 1.5, drain: 0.35, dDrain: 0.45, ck: 2, seq: [['roll', 1, 2.2], ['dive', 0, 2.4], ['roll', -1, 2.2], ['roll', 1, 2.2], ['dive', 0, 2.4]] },
  normal: { RT: 1.55, drain: 0.45, dDrain: 0.42, ck: 3, seq: [['roll', 1, 2.2], ['roll', -1, 2.2], ['dive', 0, 2.4], ['roll', 1, 2.4], ['roll', -1, 2.0], ['dive', 0, 2.4]] },
  hard:   { RT: 1.75, drain: 0.5, dDrain: 0.5, ck: 3, seq: [['roll', 1, 2.2], ['roll', -1, 2.2], ['dive', 0, 2.4], ['roll', 1, 2.4], ['roll', -1, 2.4], ['dive', 0, 2.4], ['roll', 1, 2.0]] },
};
const WARN_LINE = { roll: [['astrid', '어, 어… 기울어!'], ['astrid', '으아— 또 기울어!'], ['hiccup', '투슬리스, 왜 그래!'], ['astrid', '내려 줘!']], dive: [['hiccup', '머리를 숙여… 내리꽂는다!'], ['astrid', '바다로 떨어져—!']] };
function clingUI() {
  const box = document.createElement('div');
  box.style.cssText = 'position:fixed;left:14px;bottom:62px;z-index:21;width:236px;height:132px;padding:4px;background:#f4ead2;border:2px solid #2b2118;border-radius:12px 18px 14px 20px / 18px 12px 20px 14px;box-shadow:3px 4px 0 rgba(43,33,24,.35);pointer-events:none';
  const cv = document.createElement('canvas'); cv.width = 456; cv.height = 248; cv.style.cssText = 'width:100%;height:100%;display:block'; box.appendChild(cv); document.body.appendChild(box);
  const x = cv.getContext('2d'); let last = '';
  return {
    draw(tilt, grip, bad) {
      const key = tilt.toFixed(2) + '|' + grip.toFixed(2) + '|' + (bad ? 1 : 0); if (key === last) return; last = key;
      x.clearRect(0, 0, 456, 248); x.strokeStyle = x.fillStyle = INK; x.lineCap = x.lineJoin = 'round';
      /* 뒤에서 본 투슬리스 — 날개 선이 기울기만큼 돎 · 위험 띠(양끝) */
      x.save(); x.translate(150, 100);
      x.lineWidth = 3; x.strokeStyle = 'rgba(168,62,30,.55)'; for (const s of [1, -1]) { x.beginPath(); x.arc(0, 0, 92, -Math.PI / 2 + s * 0.9, -Math.PI / 2 + s * 1.5, s < 0); x.stroke(); }
      x.strokeStyle = INK; x.rotate(tilt);
      x.lineWidth = 5; x.beginPath(); x.moveTo(-96, 6); x.quadraticCurveTo(-50, -22, 0, 0); x.quadraticCurveTo(50, -22, 96, 6); x.stroke();
      x.fillStyle = '#2a2d33'; x.beginPath(); x.ellipse(0, 4, 16, 22, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#8a4a22'; x.beginPath(); x.arc(0, -20, 7, 0, Math.PI * 2); x.fill();
      x.restore();
      /* 꽉 잡기 줄 — 손 그림 + 매듭 줄(남은 만큼) */
      x.font = '700 30px "Noto Sans KR",sans-serif'; x.fillStyle = INK; x.fillText('꽉', 310, 60);
      x.lineWidth = 4; x.strokeStyle = INK; x.strokeRect(300, 80, 140, 140);
      const h = Math.round(132 * clamp(grip, 0, 1)); x.fillStyle = bad ? '#c9603a' : '#b08a5a'; x.fillRect(304, 216 - h, 132, h);
      for (let k = 1; k < 4; k++) { x.beginPath(); x.moveTo(300, 80 + k * 35); x.lineTo(316, 80 + k * 35); x.stroke(); }
    },
    dispose() { box.remove(); },
  };
}
function* angry(G, C) {
  const P = G.player, M = MAN[G.diff] || MAN.normal;
  C.SK = sky(G); C.SK.CL.show(true); C.SK.NS.set(0, true);
  C.tm = { a: 'sunset', b: 'sunset', k: 0 }; C.cc = ['sunset', 'sunset', 0];
  G.hud.howto('cling8', 9);
  const T = G.dragon('nightfury', { x: 40, z: -470 }, { noCollide: true, mind: { fear: 0.2, anger: 0.9 } });
  const As = G.person('astrid', { x: 40, z: -470 }, { noCollide: true });
  yield* until(() => T.root && As.root && P.root);
  T.manual = As.manual = true; P.cam = 'fly'; holdItem(P, null);
  const S = { x: 40, y: 168, z: -470, yaw: 0, pitch: 0, v: 24 }, Pv = { x: 40, y: 168, z: -470, yaw: 0, pitch: 0, roll: 0 };
  const FS = { pose: { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, roll: 0, speed: 24, rx: 0, ry: 0, rz: 0 }, state: { fallen: false }, world: { ground: () => -60 }, waterAt: () => 0, pushOut: (p) => p };
  const cam = createFlightCam(G.camera), ui = clingUI();
  let tilt = 0, tiltV = 0, grip = 1, i = G.flags.c8m || 0, ph = 'gap', pt = 2.2, cur = null, warnK = 0, flap = 0, climb = false, bad = false;
  const dr = { look: 0, ear: 0, headUp: 0 };
  G.camDraw = (a, dt) => {
    const p = FS.pose;
    p.x = Pv.x + (S.x - Pv.x) * a; p.y = Pv.y + (S.y - Pv.y) * a; p.z = Pv.z + (S.z - Pv.z) * a;
    p.yaw = Pv.yaw + wrap(S.yaw - Pv.yaw) * a; p.pitch = Pv.pitch + (S.pitch - Pv.pitch) * a; p.roll = Pv.roll + (tilt - Pv.roll) * a; p.speed = S.v;
    T.root.position.set(p.x, p.y - 1.2, p.z); T.root.rotation.set(-p.pitch, p.yaw, p.roll, 'YXZ');
    const R = T.rig; flap += dt; R.flapRate = climb ? 0.7 : 0.18; R.glide = climb ? 0 : 0.8; R.fold = ph === 'act' && cur && cur[0] === 'dive' ? 0.35 : 0;
    R.look += (dr.look - R.look) * Math.min(1, dt * 5); if ('ear' in R) R.ear += (dr.ear - R.ear) * Math.min(1, dt * 5); if ('headUp' in R) R.headUp += (dr.headUp - R.headUp) * Math.min(1, dt * 4);
    if ('pupil' in R) R.pupil += ((climb ? 1 : 0.25) - R.pupil) * Math.min(1, dt * 2);
    R.update(dt);
    seat(T, P, SADDLE); P.rig.ride = 1; P.rig.cower = 0; P.rig.update(dt);
    seat(T, As, BACK); As.rig.ride = 1; As.rig.cower = climb ? 0 : 0.7; As.rig.update(dt);
    cam.update(dt, FS); envFrame(G, C, dt);
    ui.draw(tilt, grip, bad);
  };
  const prev = C.cleanup;
  C.cleanup = () => { T.manual = As.manual = false; P.cam = 'follow'; G.camDraw = null; ui.dispose(); restoreEnv(G, C); prev && prev(); };
  C.cl = () => ({ mode: 'cling', tilt: +tilt.toFixed(3), tiltV: +tiltV.toFixed(3), grip: +grip.toFixed(2), warn: ph === 'warn' && cur ? cur[0] : '', dir: cur ? cur[1] : 0, warnK: +warnK.toFixed(2), act: ph === 'act' && cur ? cur[0] : '', i, n: M.seq.length });
  G.hud.goal('떨어지지 않게 버티기');
  if (!i) { G.hud.say('astrid', '으아— 내려 줘!'); G.hud.say('hiccup', '투슬리스! 일부러 그러는 거지?!'); }
  let li = 0;
  while (true) {
    const dt = yield, I = G.input;
    Pv.x = S.x; Pv.y = S.y; Pv.z = S.z; Pv.yaw = S.yaw; Pv.pitch = S.pitch; Pv.roll = tilt;
    pt -= dt;
    if (ph === 'gap' && pt <= 0) {
      if (i >= M.seq.length) break;
      cur = M.seq[i]; ph = 'warn'; pt = WARN[G.diff] || 2.5;
      const L = WARN_LINE[cur[0]]; const l = L[li++ % L.length]; G.hud.say(l[0], l[1], [], { secs: 1.6 });
    } else if (ph === 'warn' && pt <= 0) { ph = 'act'; pt = cur[2]; G.sfx.play(cur[0] === 'dive' ? 'whoosh' : 'growl'); }
    else if (ph === 'act' && pt <= 0) { ph = 'gap'; pt = 1.5 + G.rng() * 0.6; i++; if (i === M.ck) G.flags.c8m = i; }   // 중간 자리 하나뿐(뒤에 기울기가 둘 넘게 남는 곳) — 하나씩 다시 해서 깨는 길 X
    warnK = ph === 'warn' ? clamp(1 - pt / (WARN[G.diff] || 2.5), 0, 1) : ph === 'act' ? 1 : 0;
    /* 예고 = 고개를 그쪽으로 돌리고 귀를 눕힘(기울기) · 머리를 숙임(곤두박질) */
    const wk = ph === 'gap' ? 0 : warnK;
    dr.look = cur && cur[0] === 'roll' ? -cur[1] * 0.75 * wk : 0; dr.ear = -wk; dr.headUp = cur && cur[0] === 'dive' ? -0.7 * wk : 0;
    /* 기울기 — 투슬리스가 미는 힘 − 내 손(반대쪽) − 저절로 돌아옴 */
    const m = ph === 'act' && cur[0] === 'roll' ? cur[1] : 0, u = I.axis('right', 'left'), up = I.on('fwd');
    tiltV = M.RT * m - 1.7 * u - 1.2 * tilt; tilt += tiltV * dt;
    const diving = ph === 'act' && cur[0] === 'dive';
    bad = Math.abs(tilt) > 0.9 || (diving && !up);
    if (Math.abs(tilt) > 0.9) grip -= M.drain * (1 + (Math.abs(tilt) - 0.9) * 2) * dt;     // 많이 기울수록 빨리 미끄러짐
    if (diving && !up) grip -= M.dDrain * dt;
    if (!bad && ph !== 'act' && Math.abs(tilt) < 0.45) grip = Math.min(1, grip + 0.06 * dt);   // 쉬는 틈에만 조금 되찾음(연타·누른 채로는 못 버팀)
    if (grip <= 0) { G.hud.sayNow('hiccup', '으악— 손이 미끄러진다!', ['hand'], { secs: 1.4 }); yield* wait(1.2); return 'retry'; }
    /* 길 — 기운 쪽으로 돎 · 곤두박질(↑ = 덜 숙임) · 평소엔 높이를 되찾음 */
    const pT = diving ? (-0.62 + (up ? 0.3 : 0)) : clamp((168 - S.y) * 0.012, -0.2, 0.28);
    S.pitch += (pT - S.pitch) * Math.min(1, dt * 2.4);
    S.yaw = wrap(S.yaw - 0.38 * tilt * dt);
    S.v += ((diving ? 30 : 24) - S.v) * Math.min(1, dt);
    const h = Math.cos(S.pitch) * S.v; S.x += Math.sin(S.yaw) * h * dt; S.z += Math.cos(S.yaw) * h * dt; S.y = Math.max(134, S.y + Math.sin(S.pitch) * S.v * dt);
  }
  /* 사과 → 잔잔해짐 → 구름 속으로 천천히 오름 */
  G.flags.c8m = 0; cur = null; dr.ear = 0.4; dr.look = 0; dr.headUp = 0;
  G.hud.goal('');
  G.hud.say('astrid', '알았어, 알았어! 미안해!');
  G.hud.say('astrid', '납치한 건 너지만… 나도 너무했어. 미안해, 투슬리스.');
  G.sfx.play('purr');
  G.hud.say('hiccup', '…봐. 잔잔해졌지?');
  let t = 0;
  while (true) {
    const dt = yield; t += dt;
    Pv.x = S.x; Pv.y = S.y; Pv.z = S.z; Pv.yaw = S.yaw; Pv.pitch = S.pitch; Pv.roll = tilt;
    tilt += (0 - tilt) * Math.min(1, dt * 2); tiltV = 0;
    if (t > 5.5) climb = true;
    S.pitch += ((climb ? 0.34 : clamp((168 - S.y) * 0.012, -0.2, 0.2)) - S.pitch) * Math.min(1, dt * 1.6);
    const h = Math.cos(S.pitch) * S.v; S.x += Math.sin(S.yaw) * h * dt; S.z += Math.cos(S.yaw) * h * dt; S.y += Math.sin(S.pitch) * S.v * dt;
    if (climb && S.y > deckTop(S.x, S.z) - 6) break;
  }
  return true;
}
function clingSense(G, C) { return C.cl ? C.cl() : {}; }

/* ③ 노을 구름 위 → 밤 오로라 — 목표 넷(구름 문 · 큰 구름 속 = 숨기 연습 · 구름 문 · 오로라 아래) · 실패 없음 */
function* cloudFlight(G, C) {
  C.SK = sky(G); C.SK.CL.show(true); C.SK.NS.set(0, true);
  C.tm = { a: 'sunset', b: 'night', k: 0 }; C.cc = ['sunset', 'sunset', 0]; C.white = 1.3;
  hideSea(G, C, true, false);                                      // 먼 구름 판만(구름 바다가 대신함 · 밤에 밝게 뜸)
  G.hud.howto('glide8', 9);
  const F = yield* ride(G, C, { start: C3.start, gates: C3.gates, world: worldOf(G) });
  const arrow = makeArrow(); const prev = C.cleanup; C.cleanup = () => { arrow.dispose(); prev && prev(); };
  const GOALS = ['구름 탑 사이로 (1/4)', '큰 구름 속으로 (2/4)', '구름 탑 사이로 (3/4)', '오로라 아래 높이 (4/4)'];
  G.hud.goal(GOALS[0]);
  G.hud.say('astrid', '…와.'); G.hud.say('hiccup', '이게 투슬리스랑 나는 하늘이야.'); G.hud.say('astrid', '저기 구름 탑 사이, 지나갈 수 있어?', ['cloud']);
  C.asPoint = 0.8;
  let gi = 0, k = 0, hidT = 0, hidSaid = false;
  C.onDraw = () => { arrow.at(G, C3.gates[F.state.gates] || null); };
  while (F.state.gates < C3.gates.length) {
    const dt = yield; F.step(dt, G.input);
    if (F.state.gates !== gi) {
      gi = F.state.gates; G.sfx.play('whoosh'); C.asPoint = 0;
      if (gi < GOALS.length) G.hud.goal(GOALS[gi]);
      if (gi === 1) { G.hud.say('astrid', '구름 탑 사이를 지나다니…!'); G.hud.say('hiccup', '저 큰 구름 속으로 들어가 볼래?', ['cloud']); }
      if (gi === 2) { G.hud.say('astrid', '(속삭임) 구름 속에선 아무도 우리를 못 봐.', ['cloud']); }
      if (gi === 3) { G.hud.say('hiccup', '위를 봐!'); G.hud.say('astrid', '하늘이… 춤춰.'); }
    }
    /* 해가 지며 밤으로(지난 목표 수를 따라 천천히) · 셋째 목표 즈음 오로라 */
    k += (Math.min(1, gi / 3.2 + 0.08) - k) * Math.min(1, dt * 0.35);
    C.tm.k = k; cloudCols(k, C.cc); C.SK.NS.set(k > 0.55 ? 1 : 0);
    /* 숨기 연습 — 구름 속에 들면 '숨었다' */
    const s = F.state, hid = C.SK.CL.hidden(s.x, s.y, s.z); C.hid = !!hid;
    if (hid) { hidT += dt; if (hidT > 0.6 && !hidSaid) { hidSaid = true; G.hud.banner('구름 속 — 아무도 못 봐요', 'cloud', 2.2); } } else hidT = 0;
  }
  G.hud.banner('구름 위의 밤하늘 — 오로라', 'cloud', 3.5);
  G.records['8-3'] = { t: +F.state.t.toFixed(1) };
  yield* wait(1.2);
  G.hud.veil.show('', '');
  return true;
}
function rideSense(G, C) { const F = C.F; if (!F || !F.state) return {}; return Object.assign(fsFlat(F, { noteGone: true }), { hid: !!C.hid }); }

/* ④ 떼 속에 숨기 — 드래곤 떼가 안개 속 둥지로 · 가운데 주머니(내 자리)에 머묾 · 벗어나면 가까운 드래곤이 돌아보고 눈을 뜸(예고) → 들킴 = 다시(중간 자리부터) */
const FLOCK = { easy: { safe: 11, bump: 1.2, pocket: 11 }, normal: { safe: 7, bump: 1.7, pocket: 8.5 }, hard: { safe: 6, bump: 1.9, pocket: 8.5 } };
const FOG_A = new THREE.Color(0x4a5268), FOG_B = new THREE.Color(0x66524e);
function* flockHide(G, C) {
  const pl = G.place, P = G.player, D = FLOCK[G.diff] || FLOCK.normal, W = WARN[G.diff] || 2.5;
  C.SK = sky(G); C.SK.CL.show(false); C.SK.NS.set(0, true);
  G.hud.howto('flock8', 9);
  let Fl = pl.__c8fl;
  if (!Fl) { Fl = pl.__c8fl = createFlock({ group: pl.group, n: 58, rng: createRng(412), path: FLOCK_PATH, pocket: { r: D.pocket, len: 13 } }); }   // 쉬움 = 주머니가 넓음
  Fl.show(true);
  let s = G.flags.c8s || 0;
  const f0 = Fl.frame(s);
  /* 안개 — 짙은 밤 청회색 → 둥지 검붉은 회색 · 하늘 = 안개 색 */
  let fk = 0;
  C.tm = { a: 'night', b: 'nest', k: 0 };
  C.fogOver = () => { const f = G.scene.fog; f.color.copy(FOG_A).lerp(FOG_B, fk); f.near = 3; f.far = 88 - fk * 14; const su = G.env.sky.material.uniforms; su.top.value.copy(f.color); su.mid.value.copy(f.color); su.bot.value.copy(f.color); };
  hideSea(G, C, true);
  const F = yield* ride(G, C, { start: { x: f0.x, y: f0.y, z: f0.z, yaw: f0.yaw }, world: worldOf(G, 380, { x: 100, z: 0, r: 900 }) });
  const arrow = makeArrow(); const pc = { x: 0, y: 0, z: 0 };
  const prev = C.cleanup; C.cleanup = () => { arrow.dispose(); Fl.show(false); prev && prev(); };
  G.hud.goal('떼 속에 숨어 따라가기');
  if (!s) { G.hud.say('hiccup', '드래곤 떼다! 섞여서 가자.', ['flock']); G.hud.say('astrid', '어디로 가는 거지…?'); }
  else G.hud.say('hiccup', '다시 가운데로…!', ['flock']);
  let expose = 0, bumpCd = 0, warned = 0, said = 0;
  C.onDraw = () => { arrow.at(G, C.off > D.safe * 0.7 ? pc : null); };
  while (true) {
    const dt = yield; F.step(dt, G.input);
    const st = F.state;
    /* 떼 가운데를 길 따라 — 내 앞뒤 자리에 맞춰 당김(옆·위아래만 내 몫) */
    let fr = Fl.frame(s);
    const rx = st.x - fr.x, ry = st.y - fr.y, rz = st.z - fr.z, along = rx * fr.tx + ry * fr.ty + rz * fr.tz;
    const va = st.vx * fr.tx + st.vy * fr.ty + st.vz * fr.tz;
    s = Math.min(Fl.L, s + clamp(va + along * 1.4, 10, 36) * dt);
    fr = Fl.frame(s);
    pc.x = fr.x; pc.y = fr.y; pc.z = fr.z;
    const dx = st.x - fr.x, dy = st.y - fr.y, dz = st.z - fr.z, a2 = dx * fr.tx + dy * fr.ty + dz * fr.tz;
    const lr = dx * fr.rx + dz * fr.rz, lu = dy - a2 * fr.ty, off = Math.hypot(lr, lu); C.off = off;
    fk = s / Fl.L; C.tm.k = fk * 0.7;
    Fl.update(dt, s, st, expose);
    /* 부딪힘 — 놀라 비켜남 + 들킬 뻔 */
    if (bumpCd > 0) bumpCd -= dt;
    const nd = Fl.nearest(st.x, st.y, st.z);
    if (nd < D.bump && bumpCd <= 0) { bumpCd = 1.2; expose = Math.min(0.99, expose + 0.35); Fl.bump(Fl.near, lr, lu); G.sfx.play('growl'); G.hud.say('astrid', '부딪히면 안 돼!', [], { secs: 1.1 }); C.bumps = (C.bumps || 0) + 1; }
    /* 들킴 — 주머니에서 벗어난 만큼 눈이 뜨임(예고 W초) · 돌아오면 다시 감음 */
    if (off > D.safe) { expose += dt / W * (1 + Math.min(1.5, (off - D.safe) / 6)); if (!warned) { warned = 1; G.hud.say('hiccup', '쉿, 눈이 뜨인다… 가운데로!', ['eye'], { secs: 1.6 }); } }
    else { expose = Math.max(0, expose - dt * 0.45); if (expose < 0.05) warned = 0; }
    C.expose = expose;
    if (expose >= 1) {
      Fl.update(0, s, st, 1); G.sfx.play('roar');
      G.hud.sayNow('astrid', '들켰어! 떼가 흩어져…!', ['eye'], { secs: 1.6 });
      yield* wait(1.4); return 'retry';
    }
    /* 중간 자리(셋으로 나눔) — 들키면 거기서 다시 */
    if (s > Fl.L * 0.36 && (G.flags.c8s || 0) < Fl.L * 0.33) { G.flags.c8s = Fl.L * 0.34; if (!said) { said = 1; G.hud.say('astrid', '(속삭임) 아래로 내려가고 있어.'); } }
    if (s > Fl.L * 0.69 && (G.flags.c8s || 0) < Fl.L * 0.66) { G.flags.c8s = Fl.L * 0.67; G.hud.say('hiccup', '안개 속에… 섬이 있어.'); }
    if (s >= Fl.L - 4) break;
  }
  G.flags.c8s = 0;
  G.hud.say('astrid', '연기 나는 섬… 저기가 어디야?'); G.hud.say('hiccup', '둥지야. 드래곤들이 사는 곳.');
  G.records['8-4'] = { bumps: C.bumps || 0 };
  yield* wait(2.4);
  return true;
}
function flockSense(G, C) {
  const F = C.F; if (!F || !F.state || !G.place.__c8fl) return {};
  const s = F.state, Fl = G.place.__c8fl, fr = Fl.F;
  return { mode: 'flock', x: +s.x.toFixed(2), y: +s.y.toFixed(2), z: +s.z.toFixed(2), vx: +s.vx.toFixed(2), vy: +s.vy.toFixed(2), vz: +s.vz.toFixed(2), yaw: +s.yaw.toFixed(3),
    pocket: { x: +fr.x.toFixed(2), y: +fr.y.toFixed(2), z: +fr.z.toFixed(2) }, aim: { x: +(fr.x + fr.tx * 30).toFixed(2), y: +(fr.y + fr.ty * 30).toFixed(2), z: +(fr.z + fr.tz * 30).toFixed(2) },
    off: +(C.off || 0).toFixed(2), expose: +(C.expose || 0).toFixed(2) };
}

/* ⑤ 둥지 — 지켜보기(이음) → 콧구멍이 벌름할 때 바위 턱에서 멈추며 틈으로(도전) · 장소 = nest(팀 D · 'crater') · 없으면 자리표시 */
function nestLayout(pl) {
  const A = pl.anchors || {}, L = pl.lists || {};
  const pit = A.pit || { x: 0, y: 0, z: 0 };
  const lin = A.ledge_in || { x: pit.x - 34, y: 0, z: pit.z - 14 };
  const ex = A.exit || { x: pit.x + 30, y: 0, z: pit.z + 22 };
  const drop = A.drop || { x: pit.x, y: (pit.y || 0) + 30, z: pit.z };
  const boss = Array.isArray(L.boss) ? L.boss[0] : (L.boss || pit);
  let ledges = Array.isArray(L.ledges) && L.ledges.length >= 4 ? L.ledges.map((q) => ({ x: q.x, y: q.y || 0, z: q.z, yaw: q.yaw })) : null;
  if (!ledges) {                                       // 자리표시: 구덩이 둘레 호를 따라 10~11m마다
    ledges = []; const a0 = Math.atan2(lin.x - pit.x, lin.z - pit.z), a1 = Math.atan2(ex.x - pit.x, ex.z - pit.z), da = wrap(a1 - a0), r0 = Math.hypot(lin.x - pit.x, lin.z - pit.z), r1 = Math.hypot(ex.x - pit.x, ex.z - pit.z);
    const len = Math.abs(da) * (r0 + r1) / 2, n = Math.max(4, Math.round(len / 10.5) - 1);
    for (let i = 1; i <= n; i++) { const t = i / (n + 1), a = a0 + da * t, r = r0 + (r1 - r0) * t; ledges.push({ x: pit.x + Math.sin(a) * r, y: 0, z: pit.z + Math.cos(a) * r }); }
  }
  /* 길 — 들어온 턱에서 구덩이 둘레(바닥 고리)를 짧은 쪽으로 돌아 틈까지 ~10m마다(화살표·봇·중간 자리) · 숨을 곳 = 들어온 턱 + 바위 턱 */
  const a0 = Math.atan2(lin.x - pit.x, lin.z - pit.z), a1 = Math.atan2(ex.x - pit.x, ex.z - pit.z), da = wrap(a1 - a0);
  const rr = Math.hypot(lin.x - pit.x, lin.z - pit.z) * 0.97, n = Math.max(2, Math.round(Math.abs(da) * rr / 10));
  const chain = [lin];
  for (let i = 1; i <= n; i++) { const a = a0 + da * i / n; chain.push({ x: pit.x + Math.sin(a) * rr, y: lin.y || 0, z: pit.z + Math.cos(a) * rr }); }
  if (Math.hypot(ex.x - chain[n].x, ex.z - chain[n].z) > 3) chain.push(ex); else chain[n] = ex;
  const hides = [lin, ...ledges];
  const smellR = 0.62 * Math.min(...hides.map((q) => Math.hypot(q.x - pit.x, q.z - pit.z)));
  return { pit, lin, ex, drop, boss, ledges, chain, hides, smellR };
}
/* 자리표시 둥지 소품(팀 D 장소가 없을 때만) — 바위 턱 · 구덩이 · 대장 그림자 등(콧구멍) · 틈 바위 */
function stubNest(G, N) {
  const g = new THREE.Group(), geos = [], pl = G.place; pl.group.add(g);
  const mk = (geo, color, x, y, z, sx = 1, sy = 1, sz = 1) => { geos.push(geo); const m = new THREE.Mesh(geo, toon({ color, flat: true })); m.position.set(x, y, z); m.scale.set(sx, sy, sz); g.add(m); return m; };
  const rock = new THREE.DodecahedronGeometry(1, 0);
  for (const q of N.ledges.concat([N.lin])) { const d = Math.hypot(N.pit.x - q.x, N.pit.z - q.z) || 1; mk(rock, 0x4a3c3a, q.x + (N.pit.x - q.x) / d * 1.5, 0.6, q.z + (N.pit.z - q.z) / d * 1.5, 1.8, 1.2, 1.4); }
  for (const s of [1, -1]) mk(rock, 0x3a302e, N.ex.x + s * 2.6, 2.2, N.ex.z, 1.4, 3.2, 1.6);
  mk(new THREE.CircleGeometry(12, 28).rotateX(-Math.PI / 2), 0x1d1614, N.pit.x, 0.03, N.pit.z);
  const body = mk(new THREE.SphereGeometry(7, 18, 10), 0x2a2226, N.pit.x, -2.5, N.pit.z, 1.5, 0.7, 1.1);
  const nos = [1, -1].map((s) => mk(new THREE.SphereGeometry(0.9, 10, 6), 0x0d0a0a, N.pit.x + s * 1.6, 1.4, N.pit.z - 6.8, 1, 0.55, 0.4));
  return {
    sign(k) { for (const n of nos) n.scale.set(1 + k * 0.7, 0.55 + k * 0.5, 0.4); },
    rise(k) { body.position.y = -2.5 + k * 4; for (const n of nos) n.position.y = 1.4 + k * 4; },
    dispose() { g.removeFromParent(); geos.forEach((x) => x.dispose()); },
  };
}
/* 대장이 냄새를 들이마실 때 — 내 둘레 먼지가 구덩이 쪽으로 빨려 감(콧구멍이 화면 밖이어도 보이는 짝 신호) */
function makeDraft(group) {
  const n = 46, pos = new Float32Array(n * 3), ph = new Float32Array(n);
  for (let i = 0; i < n; i++) { ph[i] = (i * 0.618) % 1; pos[i * 3 + 1] = -99; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const cv = document.createElement('canvas'); cv.width = cv.height = 32; const x = cv.getContext('2d'); x.fillStyle = '#fff'; x.beginPath(); x.ellipse(16, 16, 13, 9, 0.5, 0, Math.PI * 2); x.fill();   // 둥근 먼지 조각(네모 점 X)
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xb8a48c, map: tex, alphaTest: 0.3, size: 0.13, transparent: true, opacity: 0.75, depthWrite: false }));
  m.frustumCulled = false; group.add(m);
  return {
    step(dt, k, px, py, pz, tx, tz) {
      const dx = tx - px, dz = tz - pz, d = Math.hypot(dx, dz) || 1, ux = dx / d, uz = dz / d;
      for (let i = 0; i < n; i++) {
        ph[i] = (ph[i] + dt * (0.25 + k * 0.9)) % 1;
        if (k < 0.05) { pos[i * 3 + 1] = -99; continue; }
        const a = i * 2.399, r = 1.5 + (i % 7) * 0.9, along = (ph[i] - 0.5) * 9;
        pos[i * 3] = px + Math.cos(a) * r * 0.8 + ux * along; pos[i * 3 + 1] = py + 0.2 + (i % 5) * 0.25 + Math.sin(ph[i] * 6.28 + i) * 0.1; pos[i * 3 + 2] = pz + Math.sin(a) * r * 0.8 + uz * along;
      }
      m.material.opacity = 0.2 + 0.6 * k; g.attributes.position.needsUpdate = true;
    },
    dispose() { m.removeFromParent(); g.dispose(); m.material.dispose(); tex.dispose(); },
  };
}
const NEST = { easy: { sniff: 1.5, noise: 1.6 }, normal: { sniff: 1.8, noise: 1.0 }, hard: { sniff: 2.0, noise: 0.8 } };
function* nest(G, C) {
  const P = G.player, pl = G.place, N = nestLayout(pl), Z = NEST[G.diff] || NEST.normal, W = WARN[G.diff] || 2.5;
  const stub = !!pl.stub || !(pl.anchors && pl.anchors.ledge_in);
  const props = stub ? stubNest(G, N) : null;
  const sign = (k) => { if (pl.bossSign) pl.bossSign(k); if (props) props.sign(k); };
  const rest = { easy: 7, normal: 5.5, hard: 4.5 }[G.diff] || 5.5;   // 킁킁 사이 쉼(박자)
  const mist = makePuffs(pl.group, 90, 0x7a6a66), draft = makeDraft(pl.group);
  const Fl = createFlock({ group: pl.group, n: 20, rng: createRng(77) });
  Fl.circle({ x: N.pit.x, y: Math.max((N.pit.y || 0) + 34, (N.lin.y || 0) + 24), z: N.pit.z, r: 44 });
  const items = [], arrow = makeArrow(), nxt = { x: 0, y: 0, z: 0 };
  C.cleanup = () => { arrow.dispose(); if (props) props.dispose(); draft.dispose(); mist.mesh.removeFromParent(); mist.mesh.geometry.dispose(); Fl.dispose(); items.forEach((o) => o.removeFromParent()); sign(0); P.lock = false; };
  /* 처음 자리 · 동무 */
  const ck = clamp(G.flags.c8L || 0, 0, N.chain.length - 2), at0 = N.chain[ck];
  const faceP = Math.atan2(N.pit.x - at0.x, N.pit.z - at0.z);
  G.putPlayer({ x: at0.x, z: at0.z, y: at0.y }, faceP); P.W.low = true;
  const As = G.person('astrid', { x: at0.x - Math.cos(faceP) * 1.4, z: at0.z + Math.sin(faceP) * 1.4, yaw: faceP }, { noCollide: true }); As.pose = { low: 1 };
  const T = G.dragon('nightfury', { x: N.ex.x, z: N.ex.z, yaw: Math.atan2(N.pit.x - N.ex.x, N.pit.z - N.ex.z) }, { noCollide: true, mind: { fear: 0.4, trust: 0.9 } }); T.mind.lock = 'idle'; T.stay(); T.pose = { crouch: 0.8, tailCurl: 0.6, ear: -0.4 };
  yield* until(() => As.root && T.root);
  G.hud.goal('숨어서 지켜보기');
  C.stage = 'watch';
  let t = 0;
  if (!G.flags.c8w) {
    /* (이음) 먹이를 떨어뜨리는 떼 · 1장 그 양 · 생선 바구니 · 그롱클 생선 한 마리 → 대장의 그림자와 소리만(삼키는 장면은 화면 밖) */
    P.lock = true;
    const sheep = G.person('sheep', { x: N.drop.x + 3, z: N.drop.z + 2 }, { noCollide: true });
    const basket = makeItem('bucket'), fish = makeItem('cod'); basket.scale.setScalar(2.2); fish.scale.setScalar(2.4);
    items.push(basket, fish); basket.visible = fish.visible = false; pl.group.add(basket); pl.group.add(fish);
    const gr = G.dragon('gronckle', { x: N.pit.x + 40, z: N.pit.z + 10 }, { noCollide: true, mind: { fear: 0.8 } });
    const fear = [G.dragon('terror', { x: N.ledges[0].x + 3, z: N.ledges[0].z - 2 }, { noCollide: true, mind: { fear: 0.9 } }), G.dragon('nadder', { x: N.pit.x - 16, z: N.pit.z + 14 }, { noCollide: true, mind: { fear: 0.9 } })];
    yield* until(() => sheep.root && gr.root && fear.every((d) => d.root));
    sheep.manual = gr.manual = true; sheep.root.visible = false;
    fear.forEach((d) => { d.mind.lock = 'idle'; d.stay(); d.pose = { tailCurl: 1, crouch: 0.7, ear: -0.8 }; d.faceTo(N.pit.x, N.pit.z); });
    const floorY = (N.pit.y || 0) - 3;
    const drop = (o, t0, x, z) => { const k = t - t0; if (k < 0) { o.visible = false; return; } const y = N.drop.y + 18 - 4.9 * k * k; o.visible = y > floorY; o.position.set(x, y, z); o.rotation.x = k * 2; };
    const gy = Math.max((N.pit.y || 0) + 15, (N.lin.y || 0) + 9), g0 = { x: N.pit.x + 40, y: gy + 14, z: N.pit.z + 10 };   // 구덩이 가장자리 위(턱에서 보이게)
    G.hud.say('hiccup', '(속삭임) 쉿… 여기가 둥지야.');
    let said = 0, eaten = false;
    while (t < 26) {
      const dt = yield; t += dt; Fl.update(dt, 0, null, 0); mist.step(dt); G.runner.idleT = 0;   // 멈춰 지켜보는 동안은 힌트 시계 X
      /* 1장 그 양 */
      if (t > 2.2) { const k = t - 2.2, y = N.drop.y + 18 - 2.45 * k * k; sheep.root.visible = y > floorY; if (sheep.root.visible) { sheep.root.position.set(N.drop.x + 3, y, N.drop.z + 2); sheep.root.rotation.z = k; sheep.rig.cower = 1; sheep.rig.update(dt); } if (said < 1) { said = 1; G.hud.say('hiccup', '저 양… 습격 날 끌려간 그 양이야!', ['sheep']); } }
      drop(basket, 5.6, N.drop.x - 2, N.drop.z - 1);
      if (t > 6 && said < 2) { said = 2; G.hud.say('astrid', '생선 바구니까지… 우리 마을 거잖아.', ['cod']); }
      /* 그롱클 — 생선 한 마리만 물고 와서 떨어뜨림 · 겁먹은 신호 · 대장 그림자가 오르면 구덩이 쪽으로 사라짐(화면 밖) */
      const gk = clamp((t - 9) / 3, 0, 1), ge = gk * gk * (3 - 2 * gk);
      gr.root.position.set(g0.x + (N.pit.x - g0.x) * ge, g0.y + (gy - g0.y) * ge + Math.sin(t * 6) * 0.3, g0.z + (N.pit.z - g0.z) * ge);
      gr.root.rotation.set(0, Math.atan2(N.pit.x - g0.x, N.pit.z - g0.z), 0);
      gr.rig.flapRate = 0.9; gr.rig.tailCurl = t > 13 ? 1 : 0.3; if ('crouch' in gr.rig) gr.rig.crouch = t > 13 ? 0.8 : 0; gr.rig.update(dt);
      if (t > 12.2) { const k = t - 12.2, y = gy - 1 - 4.9 * k * k; fish.visible = y > floorY; fish.position.set(N.pit.x, y, N.pit.z); fish.rotation.z = k * 3; }
      if (t > 12.6 && said < 3) { said = 3; G.hud.say('astrid', '생선… 한 마리뿐이야.', ['cod']); }
      const rk = clamp((t - 14) / 2.5, 0, 1); if (props) props.rise(rk * (1 - clamp((t - 19) / 2, 0, 1))); sign(rk > 0 && t < 19 ? 0.6 + 0.4 * Math.sin(t * 5) : 0);
      if (t > 14 && t < 14.1) { G.sfx.play('roar'); mist.burst(N.pit.x, (N.pit.y || 0) + 2, N.pit.z, 40, 4, 6); }
      if (t > 15.5 && !eaten) { eaten = true; G.sfx.play('boom'); }
      if (t > 15.2) { const k = clamp((t - 15.2) / 1.2, 0, 1); gr.root.position.y = gy - k * 30; gr.root.visible = k < 0.9; }   // 구덩이 안개 속으로(보이지 않게)
      if (t > 17 && said < 4) { said = 4; G.hud.say('hiccup', '…모자라게 가져오면 저렇게 되는구나.'); G.hud.say('astrid', '그래서 마을을 털었던 거야. 저 큰 녀석한테 바치려고.'); }
      if (t > 22 && said < 5) { said = 5; fear.forEach((d) => d.faceTo(P.W.x, P.W.z)); G.hud.say('hiccup', '꼬리를 말고 뒤를 돌아봐. 습격 날 그 눈이야.', ['eye']); G.hud.say('hiccup', '다들 겁먹은 눈이었어. 대장이 무서워서!'); }
    }
    while (G.hud.busy()) { const dt = yield; Fl.update(dt, 0, null, 0); G.runner.idleT = 0; }
    answerFear(G); G.flags.c8w = 1;
    P.lock = false;
  }
  /* 도전 — 콧구멍이 벌름(예고 W초) → 킁킁(sniff초) 동안 멈춤 · 움직이면 소리 · 서 있거나(낮게 X) 구덩이 가까이면 냄새(바위 턱 뒤는 괜찮음) · 뛰면 소리 → 일찍 킁킁 */
  C.stage = 'sneak'; G.hud.goal('들키지 않게 틈으로 빠져나가기'); G.hud.howto('sniff8', 9);
  G.hud.say('astrid', '(속삭임) 저 큰 녀석, 눈은 작아. 냄새랑 소리로 찾아.', ['nose']);
  G.hud.say('hiccup', '(콧구멍이 벌름하면… 낮게 멈추자.)', ['nose']);
  let state = 'rest', st = rest * 0.8, noise = 0, prog = ck, k = 0, shh = 0;
  const hideR = 2.6, pitR = Math.min(11, 0.45 * N.smellR / 0.62);
  const atHide = () => { for (let i = 0; i < N.hides.length; i++) { const q = N.hides[i]; if (Math.hypot(P.W.x - q.x, P.W.z - q.z) < hideR) return i; } return -1; };
  C.ns = () => ({ state, sign: +k.toFixed(2), prog });
  while (true) {
    const dt = yield; Fl.update(dt, 0, null, 0); mist.step(dt);
    st -= dt;
    const loud = P.W.speed > 0.3 && !P.W.low;
    if (loud) noise += dt / Z.noise; else noise = Math.max(0, noise - dt * 0.4);
    if (state === 'rest' && (st <= 0 || noise >= 1)) { state = 'warn'; st = W; noise = 0; if (shh < 3) { shh++; G.hud.say('astrid', '쉿! 콧구멍이 벌름거려…!', ['nose'], { secs: 1.4 }); } As.pose = { low: 1, point: 0.7 }; }
    else if (state === 'warn' && st <= 0) { state = 'sniff'; st = Z.sniff; mist.burst(N.pit.x, (N.pit.y || 0) + 3, N.pit.z, 30, 3, 5); }
    else if (state === 'sniff' && st <= 0) { state = 'rest'; st = rest + G.rng() * 1.5; As.pose = { low: 1 }; }
    k = state === 'warn' ? clamp(1 - st / W, 0, 1) : state === 'sniff' ? 1 : Math.max(0, k - dt * 2);
    sign(k); draft.step(dt, k, P.W.x, P.W.y, P.W.z, N.pit.x, N.pit.z);
    /* 길 진행(다음 길목 3m 안) — 들키면 거기서 다시 · 아스트리드가 뒤따름 */
    const nq0 = N.chain[Math.min(N.chain.length - 1, prog + 1)];
    if (prog < N.chain.length - 1 && Math.hypot(P.W.x - nq0.x, P.W.z - nq0.z) < 3) { prog++; if (prog < N.chain.length - 1) G.flags.c8L = prog; As.walkTo(N.chain[prog - 1].x, N.chain[prog - 1].z, 1.3); }
    const hi = atHide(); C.at = hi;
    const nq = N.chain[Math.min(N.chain.length - 1, prog + 1)]; nxt.x = nq.x; nxt.z = nq.z; nxt.y = pl.height(nq.x, nq.z, nq.y || 0) + 1;
    arrow.at(G, nxt);
    const dp = Math.hypot(P.W.x - N.pit.x, P.W.z - N.pit.z);
    let caught = '';
    if (state === 'sniff' && hi < 0) {
      if (P.W.speed > 0.3) caught = '움직이는 소리를 들었어…!';
      else if (!P.W.low) caught = '서 있어서 냄새가 났어…!';
      else if (dp < N.smellR) caught = '너무 가까워서 냄새가 났어…!';
    } else if (state === 'sniff' && P.W.speed > 0.3) caught = '움직이는 소리를 들었어…!';
    if (dp < pitR) caught = '너무 가까이 갔어…!';
    if (caught) {
      sign(1); if (props) props.rise(0.6); G.sfx.play('roar');
      G.hud.sayNow('hiccup', caught + ' 뒤로!', [], { secs: 1.6 }); P.lock = true;
      yield* wait(1.6); P.lock = false; return 'retry';
    }
    if (G.near(N.ex, 3)) break;
  }
  G.flags.c8L = 0; G.flags.c8w = 0;
  T.pose = { crouch: 0.3 }; T.faceTo(P.W.x, P.W.z);
  G.hud.say('hiccup', '(속삭임) 지금이야, 투슬리스!');
  G.records['8-5'] = { t: +C.t.toFixed(1) };
  yield* wait(1.4);
  return true;
}
/* 1장 연필 글 '왜 다들 겁먹은 눈이지?'에 답 — 1장 팀이 어느 칸에 썼든 찾아서 덧붙임 · 둥지 쪽 */
function answerFear(G) {
  const B = G.book, ans = '대장이 무서워서! 먹이를 못 채우면 잡아먹혀';
  let hit = false;
  for (const sp in B.notes) if (sp !== 'nest') for (const c in B.notes[sp]) { const v = B.notes[sp][c]; if (typeof v === 'string' && /겁먹은/.test(v) && !/대장/.test(v)) { B.note(sp, c, v + ' → ' + ans, false); hit = true; } }
  B.note('nest', 'sign', '둥지 드래곤도 꼬리를 말고 뒤돌아봄(겁먹은 신호)', false);
  B.note('nest', 'weak', '대장은 눈이 작아 냄새·소리로 찾음 · 콧구멍이 벌름', false);
  B.note('nest', 'other', '대장만 나쁘다 — 다들 겁나서 먹이를 날랐다', false);
  B.note('gronckle', 'other', '둥지에선 대장에게 먹이를 바침 · ' + (hit ? '겁먹은 눈의 까닭' : '겁먹은 눈'));
  G.flags.nestTruth = true;
}
function nestSense(G, C) {
  const pl = G.place; if (!pl) return {};
  const N = C.N || (C.N = nestLayout(pl)), ns = C.ns ? C.ns() : { state: '', sign: 0, prog: 0 };
  return { stage: C.stage || '', state: ns.state, sign: ns.sign, prog: ns.prog, at: C.at ?? -1, chain: N.chain.map((q) => ({ x: +q.x.toFixed(2), z: +q.z.toFixed(2) })), hides: N.hides.map((q) => ({ x: +q.x.toFixed(2), z: +q.z.toFixed(2) })), pit: { x: N.pit.x, z: N.pit.z } };
}

/* ⑥ 와! — 구름 밑 어둠에서 구름을 뚫고 올라 오로라 아래로 · 약속(주먹 한 대 + 볼) · 변화 */
function* breakout(G, C) {
  C.SK = sky(G); C.SK.CL.show(true); C.SK.NS.set(0.35, true);
  C.tm = { a: 'night', b: 'night', k: 0 }; C.cc = ['night', 'night', 0];
  hideSea(G, C, true);
  G.hud.howto('glide8', 7);
  const F = yield* ride(G, C, { start: C6.start, gates: C6.gates, world: worldOf(G) });
  const arrow = makeArrow(); const prev = C.cleanup; C.cleanup = () => { arrow.dispose(); prev && prev(); };
  C.onDraw = () => { const g = C6.gates[F.state.gates]; arrow.at(G, g || null); };
  G.hud.goal('구름을 뚫고 위로');
  G.hud.say('astrid', '(헉헉) 빠져나왔어…'); G.hud.say('hiccup', '위로! 구름 위로 가자!', ['cloud']);
  let gi = 0;
  while (F.state.gates < C6.gates.length) {
    const dt = yield; F.step(dt, G.input);
    if (F.state.gates !== gi) {
      gi = F.state.gates;
      if (gi === 2) { C.SK.NS.set(1); G.sfx.play('whoosh'); G.hud.banner('구름 위 — 오로라 아래로', 'cloud', 3); G.hud.say('astrid', '와…!'); }
    }
    const hid = C.SK.CL.hidden(F.state.x, F.state.y, F.state.z); C.hid = !!hid;
  }
  /* 약속 — 둥지 얘기는 아직 아무에게도 X · 주먹 한 대 + 볼(웃음) */
  G.hud.goal('');
  yield* sayAll(G, [['astrid', '어른들한테 말해야 해. 둥지가 어디 있는지.'], ['hiccup', '내일까지만 기다려 줘. 방법을 찾을게.'], ['astrid', '…좋아.'], ['astrid', '(주먹으로 툭) 이건 납치한 값.', ['fist']], ['hiccup', '아야!'], ['astrid', '(볼에 콕) …이건 나머지.'], ['hiccup', '…….']]);
  answerFear(G);
  G.flags.mapFogSea = true; G.flags.promise8 = true;
  G.hud.banner('드래곤 책 · 둥지 쪽 — 대장만 나쁘다 · 하늘 지도에 안개 바다', 'book', 4.5);
  yield* wait(2);
  return true;
}

export const chapter = {
  id: 8, title: '8장 · 아스트리드와 둥지', sub: '숨은 호수 → 노을 구름 위 → 오로라 → 안개 속 둥지',
  steps: [
    { id: '8-1', place: 'cove', time: 'sunset', at: 'gap_in', run: snatch, sense: (G, C) => ({ stage: C.stage || '', target: C.target || null }) },
    { id: '8-2', verb: 'fly', howtoVerb: 'cling8', place: 'sea', time: 'sunset', goal: '떨어지지 않게 버티기', limit: 120,
      hints: { 1: '투슬리스가 기울면 반대쪽 화살표!', 2: '← → 로 수평 맞추기 · 머리를 숙이면 ↑ 꾹.' }, run: angry, sense: clingSense },
    { id: '8-3', verb: 'fly', howtoVerb: 'glide8', place: 'sea', time: 'sunset', goal: '구름 탑 사이로 (1/4)', limit: 160,
      hints: { 1: '화면 끝 화살표 쪽으로 몸을 돌려 봐.', 2: '← → 돌기 · ↑ 오르기 · ↓ 내리기.' }, run: cloudFlight, sense: rideSense },
    { id: '8-4', verb: 'hide', howtoVerb: 'flock8', place: 'sea', time: 'sunset', goal: '떼 속에 숨어 따라가기', limit: 120,
      hints: { 1: '둘레 드래곤 눈이 뜨이면 가운데로.', 2: '떼가 도는 쪽으로 같이 돌고, 같이 내려가.' }, run: flockHide, sense: flockSense },
    { id: '8-5', verb: 'hide', howtoVerb: 'sniff8', place: 'nest', variant: 'crater', time: 'nest', goal: '숨어서 지켜보기', limit: 200,
      hints: { 1: '콧구멍이 벌름하면 낮게 멈춰.', 2: 'Shift로 살금살금 · 킁킁이 끝나면 화살표 쪽으로.' }, run: nest, sense: nestSense },
    { id: '8-6', verb: 'fly', howtoVerb: 'glide8', place: 'sea', time: 'night', goal: '구름을 뚫고 위로', limit: 100,
      hints: { 1: '↑ 를 눌러 위로!', 2: '화살표 쪽 구름으로 들어갔다 나와.' }, run: breakout, sense: rideSense },
  ],
};
