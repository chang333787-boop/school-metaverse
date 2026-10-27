// 👀 E 뒤 보이는 변화(EFX-1 · 사용자 10-27 "E 클릭만 하고 딱히 뭐가 변했다 그런 느낌 잘 모르겠는데")
//   E 뒤에 글 한 줄·소리만 있던 자리에 '세상 안에서' 바뀌는 것을 붙여요 — 막대·꾹 X · 컷신 X(그 자리에서) · 숫자 X
//   ① 읽음 표시: 다 읽은 판(표지석·장소 카드·기록판·게시판·물때표·간판) 위에 초록 ✓ 동그라미(점 한 벌 = 그리기 한 번 · 늘 카메라를 봄 · 저장)
//   ② 작은 생물·잎 떼(꽃밭·텃밭 = 나비·벌이 날아옴 · 정자나무 = 잎이 떨어지고 새가 날아감 · 봄 새집 = 어미 새가 나감 · 여름 곤충 호텔 = 벌이 드나듦)
//      생태 보호 구역 세 곳(새집·곤충 호텔·연못)은 '살펴보고 기록' 할 일이라 ✓ 표시도 함께
//      — 인스턴스 한 벌(그리기 한 번 · 24마리까지) · 떠 있을 때만 매 프레임 · 끝나면 숨김
//   ③ 도감 카드: 처음 본 생물 = 그 자리에서 작은 그림 카드가 떠올라 도감(오른쪽 위)으로 날아감 · 창이 떠 있으면 닫힌 뒤에
//   ④ 가까이 보기(CLOSE-1): 작은 생물 E = 카메라가 낮게 다가가 생물이 화면에 크게 · 그 앞에서 변화 · 걷기 키·E로 돌아옴(모양 = town_close.js)
//   마을 장면에 빛(Light) X — MeshBasic · Points만 · 새 객체는 만들 때만(매 프레임 X)
import { createCloseKit } from './town_close.js?v=1';
export const EFX_V = 1;
const READ_RE = /^(📖|📋|📌|🎉|🏮|🗺 마을 지도|🌊 물때|🔎 간판)|기록판/;   /* 읽는 판 갈래(라벨 앞머리) */
const SWARM = [   /* 라벨 → 떼(계절·비·밤에 따라 · 사실만) — fn(o) = [[갈래, 마리], …] */
  [/꽃밭 들여다보기|Look into the flower bed/, o => o.night || o.rain || o.sea === 'winter' ? [] : o.sea === 'spring' ? [['bfly', 4]] : o.sea === 'summer' ? [['bee', 3], ['bfly', 2]] : [['bee', 2], ['bfly', 2]]],
  [/텃밭 둘러보기|Look around the garden/, o => o.night || o.rain || o.sea === 'winter' ? [] : [['bfly', 2]]],
  [/정자나무 보기|Look at the shade tree/, o => o.night ? [] : o.sea === 'autumn' ? [['leafY', 7], ['bird', 2]] : o.sea === 'winter' ? [['bird', 3]] : [['leafG', 4], ['bird', 2]]],
  [/새집 살펴보기|nest box/, o => !o.night && o.sea === 'spring' ? [['bird', 1]] : []],   /* 봄 = 어미 새가 드나듦(판 글과 같음) · 다른 때 = 빈 새집 */
  [/곤충 호텔 살펴보기|bug hotel/, o => !o.night && !o.rain && o.sea === 'summer' ? [['bee', 2]] : []],   /* 여름 = 작은 벌이 대롱으로 꽃가루를 나름 */
  [/생태 연못 살펴보기|wildlife pond/, () => []],
];
const COL = { bfly: [0xf6f4ea, 0xf2d24a, 0xf6f4ea, 0xe9a0b8], bee: [0xe9b23a], leafY: [0xe8b23a, 0xd9752e, 0xc9a13a], leafG: [0x7fae3a, 0x5f9a3a], bird: [0x6b4f3a, 0x5a4636] };
export function createEfx(A) {
  const T3 = A.T3, map = A.map, S = () => A.GAME.S;
  const ST = () => { const s = S(); if (!s.efx || typeof s.efx !== 'object' || s.efx.v !== EFX_V) s.efx = { v: EFX_V, rd: {} }; if (!s.efx.rd || typeof s.efx.rd !== 'object') s.efx.rd = {}; return s.efx; };
  let dead = false, PTS = null, PG = null, IM = null, nAct = 0, cards = [], log = { read: 0, swarm: 0, card: 0, bug: 0, ant: 0, close: 0, crab: 0, sea: 0 };
  const N = 24, U = [], M4 = new T3.Matrix4(), Q4 = new T3.Quaternion(), V4 = new T3.Vector3(), S4 = new T3.Vector3(), E4 = new T3.Euler(), C4 = new T3.Color(), V5 = new T3.Vector3();
  for (let i = 0; i < N; i++) U.push({ on: false, k: '', t: 0, d: 1, x: 0, y: 0, z: 0, a: 0, b: 0, c: 0, ph: 0, s: 0.2 });
  // ① 읽음 표시 — 점 한 벌(캔버스 ✓ 한 장)
  function badgeTex() { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.fillStyle = '#ffffff'; g.beginPath(); g.arc(32, 32, 30, 0, 6.2832); g.fill(); g.fillStyle = '#2f9a55'; g.beginPath(); g.arc(32, 32, 25, 0, 6.2832); g.fill();
    g.strokeStyle = '#ffffff'; g.lineWidth = 8; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(19, 33); g.lineTo(28, 42); g.lineTo(45, 23); g.stroke(); const t = new T3.CanvasTexture(c); t.colorSpace = T3.SRGBColorSpace; return t; }
  function ptsBuild() { const rd = ST().rd, P9 = Object.values(rd).filter(q => Array.isArray(q) && q.length === 3); if (!PTS) { PG = new T3.BufferGeometry(); PTS = new T3.Points(PG, new T3.PointsMaterial({ map: badgeTex(), size: 0.42, sizeAttenuation: true, transparent: true, alphaTest: 0.35, depthWrite: false })); PTS.userData.fx = 1; PTS.frustumCulled = false; PTS.renderOrder = 3; map.add(PTS); }
    const a = new Float32Array(Math.max(1, P9.length) * 3); P9.forEach((q, i) => { a[i * 3] = q[0]; a[i * 3 + 1] = q[1]; a[i * 3 + 2] = q[2]; }); PG.setAttribute('position', new T3.BufferAttribute(a, 3)); PG.setDrawRange(0, P9.length); PTS.visible = P9.length > 0; }
  const keyOf = h => String(h.label || '').replace(/[0-9:]+/g, '').slice(0, 24) + '@' + Math.round(h.x) + ',' + Math.round(h.z);
  function markRead(h) { const rd = ST().rd, k = keyOf(h); if (rd[k]) return false; const ks = Object.keys(rd); if (ks.length >= 400) delete rd[ks[0]]; rd[k] = [+h.x.toFixed(2), +((h.y || 0) + 2.15).toFixed(2), +h.z.toFixed(2)]; A.GAME.mark(); ptsBuild(); log.read++; if (map.tone) { map.tone(784, 0, 0.09, 'sine', 0.04); map.tone(1046, 0.08, 0.12, 'sine', 0.035); } return true; }
  // ② 떼 — 인스턴스 한 벌(납작한 판 · 날갯짓 = 가로 비율)
  function imBuild() { if (IM) return; const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute([0, 0.05, 0, -0.5, 0.45, 0, -0.42, -0.1, 0, 0, -0.05, 0, -0.32, -0.4, 0, -0.08, -0.12, 0, 0, 0.05, 0, 0.42, -0.1, 0, 0.5, 0.45, 0, 0, -0.05, 0, 0.08, -0.12, 0, 0.32, -0.4, 0], 3));   /* 나비 꼴(앞날개·뒷날개 둘씩) — 잎·새도 같은 꼴 하나(그리기 한 번) */ IM = new T3.InstancedMesh(g, new T3.MeshBasicMaterial({ color: 0xffffff, side: T3.DoubleSide }), N); IM.instanceMatrix.setUsage(T3.DynamicDrawUsage); IM.count = N; IM.userData.fx = 1; IM.frustumCulled = false;
    M4.makeScale(0, 0, 0); for (let i = 0; i < N; i++) { IM.setMatrixAt(i, M4); IM.setColorAt(i, C4.set(0xffffff)); } IM.instanceMatrix.needsUpdate = true; IM.visible = false; map.add(IM);}
  const free = () => U.find(u => !u.on);
  function spawn(k, x, y, z, i) { const u = free(); if (!u) return; imBuild(); const r = (i + 1) * 2.399;
    Object.assign(u, { on: true, k, t: 0, x, y, z, ph: r, a: Math.cos(r), b: Math.sin(r) });
    u.d = k === 'bfly' ? 9 : k === 'bee' ? 7 : k === 'bird' ? 3.2 : 5.5; u.s = k === 'bee' ? 0.17 : k === 'bfly' ? 0.34 : k === 'bird' ? 0.4 : 0.22;
    u.c = k === 'leafY' || k === 'leafG' ? 3.6 + (i % 3) * 0.6 : 0; const cs = COL[k] || [0xffffff]; IM.setColorAt(U.indexOf(u), C4.set(cs[i % cs.length])); if (IM.instanceColor) IM.instanceColor.needsUpdate = true; nAct++; IM.visible = true; }
  function swarm(list, h) { if (!list.length) return false; const x = h.x, z = h.z, y = A.gy ? A.gy(x, z) : h.y || 0; let i = 0; for (const [k, n] of list) for (let j = 0; j < n; j++, i++) spawn(k, x, y, z, i); log.swarm++; return true; }
  function uTick(u, dt, i) { u.t += dt; const p = u.t / u.d; if (p >= 1) { u.on = false; nAct--; M4.makeScale(0, 0, 0); IM.setMatrixAt(i, M4); return; }
    const cp = map.camera.position; let px = u.x, py = u.y, pz = u.z, sx = u.s, sy = u.s, ry = 0, rx = 0, rz = 0; const k = u.k, t = u.t;
    if (k === 'bfly' || k === 'bee') { const fl = Math.min(1, t / 1.6), out = Math.max(0, (t - (u.d - 1.6)) / 1.6), R0 = 7 * (1 - fl) + 9 * out, w = k === 'bee' ? 2.6 : 1.3, rr = 1.1 + 0.5 * Math.sin(t * 0.7 + u.ph);   /* 멀리서 날아와 꽃 둘레를 돌다 떠남 */
      px = u.x + u.a * R0 + Math.cos(t * w + u.ph) * rr; pz = u.z + u.b * R0 + Math.sin(t * w * 0.8 + u.ph) * rr; py = u.y + 0.45 + 0.25 * Math.sin(t * 2.1 + u.ph) + R0 * 0.35; sx = u.s * (0.3 + 0.7 * Math.abs(Math.sin(t * (k === 'bee' ? 26 : 11)))); ry = Math.atan2(cp.x - px, cp.z - pz); }   /* 판이 늘 카메라 쪽(옆에서 보면 선으로만 보이던 것) · 날갯짓 = 가로 비율 */
    else if (k === 'leafY' || k === 'leafG') { const fall = Math.min(1, t / (u.d - 1)); px = u.x + u.a * (1.2 + fall * 1.6) + Math.sin(t * 2.2 + u.ph) * 0.4; pz = u.z + u.b * (1.2 + fall * 1.6); py = u.y + 0.04 + u.c * (1 - fall); rx = t * 2.4 + u.ph; ry = t * 1.3; rz = Math.sin(t * 3 + u.ph); if (fall >= 1) sy = sx = u.s * Math.max(0, 1 - (t - (u.d - 1))); }
    else if (k === 'bird') { const q = t / u.d; px = u.x + u.a * q * 14; pz = u.z + u.b * q * 14; py = u.y + 2.2 + q * 7 + Math.sin(q * 3.1) * 1.5; sx = u.s * (0.35 + 0.65 * Math.abs(Math.sin(t * 13))); ry = Math.atan2(cp.x - px, cp.z - pz); }
    E4.set(rx, ry, rz); Q4.setFromEuler(E4); V4.set(px, py, pz); S4.set(Math.max(0.001, sx), Math.max(0.001, sy), 1); M4.compose(V4, Q4, S4); IM.setMatrixAt(i, M4); }
  // ③ 도감 카드(그 자리 → 오른쪽 위)
  function cardFly(o) { const P = o.at, cam = map.camera; V5.set(P[0], P[1], P[2]).project(cam); let sx = (V5.x * 0.5 + 0.5) * innerWidth, sy = (-V5.y * 0.5 + 0.5) * innerHeight; if (!(V5.z < 1) || sx < 0 || sx > innerWidth || sy < 0 || sy > innerHeight) { sx = innerWidth / 2; sy = innerHeight * 0.55; }
    const d = document.createElement('div'); d.className = 'twn-efxc'; d.style.cssText = 'position:fixed;z-index:60;left:0;top:0;width:96px;padding:6px 6px 4px;background:#fbf7ec;border:3px solid #2b2420;border-radius:8px;box-shadow:0 4px 0 #2b2420;text-align:center;font:800 13px/1.2 system-ui,sans-serif;color:#2b2420;pointer-events:none;transition:transform 1.1s cubic-bezier(.5,-0.3,.6,1),opacity .3s ease 1s;transform:translate(' + (sx - 54) + 'px,' + (sy - 60) + 'px) scale(.3)';
    if (o.draw) { const c = document.createElement('canvas'); c.width = c.height = 84; c.style.cssText = 'display:block;margin:0 auto 3px;width:84px;height:84px;background:#eef4e0;border-radius:50%'; try { o.draw(c); } catch (e) { /* 그림 없음 */ } d.appendChild(c); } else { const e9 = document.createElement('div'); e9.style.cssText = 'font-size:44px;line-height:84px'; e9.textContent = o.icon || '📖'; d.appendChild(e9); }
    const t9 = document.createElement('div'); t9.textContent = o.t || ''; d.appendChild(t9); document.body.appendChild(d); cards.push(d); log.card++;
    if (map.tone) { map.tone(659, 0, 0.1, 'triangle', 0.04); map.tone(988, 0.1, 0.16, 'triangle', 0.04); }
    requestAnimationFrame(() => { d.style.transition = 'transform .35s cubic-bezier(.2,1.4,.5,1)'; d.style.transform = 'translate(' + (sx - 54) + 'px,' + (sy - 150) + 'px) scale(1)';
      setTimeout(() => { if (dead) return; d.style.transition = 'transform .9s cubic-bezier(.6,0,.4,1),opacity .35s ease .7s'; d.style.transform = 'translate(' + (innerWidth - 120) + 'px,8px) scale(.35)'; d.style.opacity = '0'; }, 1300);
      setTimeout(() => { d.remove(); cards = cards.filter(q => q !== d); }, 2500); }); }
  let pend = [];
  function card(o) { pend.push(o); if (pend.length > 4) pend.shift(); }
  // E 알림(map.on('interact')) — 라벨 갈래로 고름(다른 파일 손대지 않고)
  function onUse(h) { if (dead || !h || h.kind !== 'game') return; const lb = String(h.label || ''); if (READ_RE.test(lb)) { setTimeout(() => { if (!dead) markRead(h); }, 120); return; }
    const obs = /새집 살펴보기|곤충 호텔 살펴보기|생태 연못 살펴보기|nest box|bug hotel|wildlife pond/.test(lb); if (obs) setTimeout(() => { if (!dead) markRead(h); }, 120);
    const o9 = { sea: A.season(), rain: A.wet(), night: A.night() };
    if (h.look && /새집 살펴보기|nest box/.test(lb) && !o9.night && o9.sea === 'spring' && closeNest(h, 'nest')) return;   /* CLOSE-1: 봄 새집 = 어미 새가 구멍에서 나와 날아감(가까이) */
    if (h.look && /곤충 호텔 살펴보기|bug hotel/.test(lb) && !o9.night && !o9.rain && o9.sea === 'summer' && closeNest(h, 'hotel')) return;   /* 여름 곤충 호텔 = 벌이 대롱으로 들어감 */
    for (const [re, fn] of SWARM) if (re.test(lb)) { const L9 = fn(o9); if (!/정자나무|shade tree|새집|nest box|곤충 호텔|bug hotel/.test(lb) && closeSwarm(L9, h)) return; swarm(L9, h); return; } }
  const offE = map.on ? map.on('interact', onUse) : null;
  ptsBuild();
  // ④ 가까이 보기(CLOSE-1 · 사용자 10-27 "개미는 잘한 거야?") — 작은 생물 E = 카메라가 그 자리에 낮게 다가감(1.3초 · 컷신 X — 몸은 그 자리)
  //   생물이 화면에 크게(0.4~1.2m) 보이는 동안 변화가 눈앞에서(개미 줄이 먹이 쪽으로 · 나비가 날아와 앉아 꿀을 빪 · 게가 구멍에서 나옴)
  //   걷기 키·조이스틱 = 돌아옴 · E = (설명 창이 아직이면) 창 먼저 → 다시 E = 돌아옴 · 창을 닫으면 생물이 떠난 뒤 저절로 돌아옴 · 순간이동하면 바로 끝
  //   카메라 = main.js 카메라 고리(SD2.camOvr — 평소 자리를 읽고 덮어씀) · 모양 = town_close.js(만들 때만 · 매 프레임 새 객체 X)
  let KIT = null, ANT = null, antFocus = null, HINT = null; const kit = () => KIT || (KIT = createCloseKit(T3)), LING = [];
  const CL = { on: false, ph: '', t: 0, ct: 0, ot: 0, k: '', cam: [0, 0, 0], tgt: [0, 0, 0], o: null, objs: [], shown: true, pOpen: false, pT: -1, endT: -1, hid: false, near0: 0.3, why: '', me: [0, 0, 0] };
  const BP = new T3.Vector3(), BQ = new T3.Quaternion(), P1 = new T3.Vector3(), T1 = new T3.Vector3(), Q1 = new T3.Quaternion(), M5 = new T3.Matrix4(), UPV = new T3.Vector3(0, 1, 0), XV = new T3.Vector3(), YV = new T3.Vector3(), ZV = new T3.Vector3();
  const ANT_N = 18, PEL_T = [3.6, 4.4, 5.1];   /* 가까이 보면 줄에 개미가 더 많이 보임(칸 키트 그림은 10) */
  const ease = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }, IN_T = 1.3, OUT_T = 0.8, clamp01 = x => Math.max(0, Math.min(1, x));
  function camFn(dt) { if (!CL.on) return; const cam = map.camera; BP.copy(cam.position); BQ.copy(cam.quaternion); CL.ct += dt; const k = CL.ph === 'out' ? 1 - ease(CL.ot / OUT_T) : ease(CL.ct / IN_T);
    P1.set(CL.cam[0], CL.cam[1], CL.cam[2]); T1.set(CL.tgt[0], CL.tgt[1], CL.tgt[2]); M5.lookAt(P1, T1, UPV); Q1.setFromRotationMatrix(M5); cam.position.lerpVectors(BP, P1, k); cam.quaternion.slerpQuaternions(BQ, Q1, k); }
  const touchy = () => 'ontouchstart' in window || (navigator.maxTouchPoints | 0) > 0;
  function hint(on) { document.body.classList.toggle('twn-closeon', !!on); if (!document.getElementById('twn-close-css')) { const st9 = document.createElement('style'); st9.id = 'twn-close-css'; st9.textContent = 'body.twn-closeon #hint{visibility:hidden!important}'; document.head.appendChild(st9); }   /* 가까이 보기 중엔 'E …' 안내 숨김(E = 돌아가기) */
    if (!on) { if (HINT) HINT.style.display = 'none'; return; } if (!HINT) { HINT = document.createElement('div'); HINT.className = 'twn-close'; HINT.style.cssText = (touchy() ? 'position:fixed;left:50%;top:96px;transform:translateX(-50%);' : 'position:fixed;left:16px;bottom:74px;') + 'z-index:55;padding:6px 14px;background:#fbf7ec;border:3px solid #2b2420;border-radius:8px;box-shadow:0 3px 0 #2b2420;font:800 15px/1.3 system-ui,sans-serif;color:#2b2420;pointer-events:none;white-space:nowrap'; document.body.appendChild(HINT); }
    const en = A.lang && A.lang() === 'en'; HINT.textContent = '🔍 ' + (touchy() ? (en ? 'Looking closely — move to go back' : '가까이 보기 — 움직이면 돌아가요') : (en ? 'Looking closely — walk keys or E to go back' : '가까이 보기 — 걷기 키나 E로 돌아가요')); HINT.style.display = ''; }
  // 시작: o = { k, at:[x,y,z](생물 자리) · look(카메라가 볼 곳 · 없으면 at) · d(수평 거리 0.4~1.2) · hh(높이) · dir([x,z] 카메라 쪽 · 없으면 나 쪽) · zoom · init(CL) · step(t, dt, lt, CL) · show() · tShow · tail(창 닫은 뒤 몇 초 뒤 돌아옴) · done(why) }
  function close(o) { if (dead || CL.on || !o || !o.at || window.SM_PROMO || !(window.SD2 && SD2.camOvr) || A.panelOpen() || (A.busy && A.busy())) return false;
    const me = map.player.pos(), at = o.at; let dx = o.dir ? o.dir[0] : me.x - at[0], dz = o.dir ? o.dir[1] : me.z - at[2], L = Math.hypot(dx, dz); if (L < 0.05) { const cp = map.camera.position; dx = cp.x - at[0]; dz = cp.z - at[2]; L = Math.hypot(dx, dz) || 1; } dx /= L; dz /= L;
    const d = Math.max(0.4, Math.min(1.2, o.d || 0.6)), hh = o.hh ?? 0.3, lk = o.look || at, gA = map.q.groundAt; let pick = null, rot = 0;
    for (const da of [0, 0.5, -0.5, 1.0, -1.0, 1.6, -1.6, 2.3, -2.3, 3.14]) { const c = Math.cos(da), s = Math.sin(da), ux = dx * c - dz * s, uz = dx * s + dz * c, cx = lk[0] + ux * d, cz = lk[2] + uz * d; let cy = lk[1] + hh; const g = gA ? gA(cx, cz, cy + 0.5) : -1e9; if (cy < g + 0.12) cy = g + 0.12;
      const mx = lk[0] + (cx - lk[0]) * 0.45, my = lk[1] + (cy - lk[1]) * 0.45 + 0.02, mz = lk[2] + (cz - lk[2]) * 0.45; if (!map.q.los || map.q.los([cx, cy, cz], [mx, my, mz])) { pick = [cx, cy, cz]; rot = da; break; } }
    if (!pick) return false;
    Object.assign(CL, { on: true, ph: 'in', t: 0, ct: 0, ot: 0, k: o.k || '', cam: pick, tgt: [lk[0], lk[1], lk[2]], o, objs: [], shown: !o.show, pOpen: false, pT: -1, endT: -1, why: '', me: [me.x, me.y, me.z] });
    try { if (o.init) o.init(CL); } catch (e) { console.error(e); }
    const cam = map.camera; CL.near0 = cam.near; cam.near = 0.06; cam.updateProjectionMatrix(); SD2.camOvr(camFn); map.player.freeze(true); if (o.zoom > 1) map.player.zoom(o.zoom);
    CL.hid = Math.abs(rot) > 0.3 || Math.hypot(me.x - lk[0], me.z - lk[2]) < d + 0.5; if (CL.hid) map.player.show(false);   /* 내 몸이 카메라와 생물 사이에 들면 숨김(1인칭처럼) */ hint(true); log.close++; return true; }
  function doShow() { if (CL.shown || !CL.o) return; CL.shown = true; try { CL.o.show(); } catch (e) { console.error(e); } CL.pOpen = true; }
  function end(why) { if (!CL.on || CL.ph === 'out') return; CL.ph = 'out'; CL.ot = 0; CL.why = why; hint(false); }
  function finish(hard) { if (!CL.on) return; CL.on = false; if (window.SD2 && SD2.camOvr) SD2.camOvr(null); const cam = map.camera; cam.near = CL.near0; cam.updateProjectionMatrix(); map.player.zoom(1); if (!A.panelOpen()) map.player.freeze(false); if (CL.hid) map.player.show(true); hint(false);
    const o = CL.o; CL.o = null; try { if (o && o.done) o.done(CL.why || (hard ? 'jump' : ''), !!hard); } catch (e) { console.error(e); }
    for (const G of CL.objs) { if (G === ANT) continue; if (G.userData.linger && !hard) LING.push({ G, t: 0, vx: G.userData.linger[0], vz: G.userData.linger[1] }); else gone(G); } CL.objs = []; }
  const gone = G => { if (G.parent) G.parent.remove(G); G.traverse(o => { if (o.userData.own && o.geometry) o.geometry.dispose(); }); };
  function closeTick(dt) { CL.t += dt; const o = CL.o; if (!o) return; if (CL.ph === 'in' && CL.t >= IN_T) CL.ph = 'look'; const pO = A.panelOpen();
    if (pO) { if (CL.shown) CL.pOpen = true; } else { if (CL.pOpen && CL.pT < 0) { CL.pT = CL.t; if (o.tail != null) CL.endT = CL.t + o.tail; } if (CL.ph !== 'out') map.player.freeze(true); }
    if (CL.ph !== 'out') { if (!CL.shown && o.tShow != null && CL.t >= o.tShow && !pO) doShow(); if (!pO && CL.t > 0.45 && map.player.input) end('walk'); if (CL.endT >= 0 && CL.t >= CL.endT && !pO) end('auto'); }
    try { if (o.step) o.step(CL.t, dt, CL.pT >= 0 ? CL.t - CL.pT : -1, CL); } catch (e) { console.error(e); end('err'); }
    if (CL.ph === 'out') { CL.ot += dt; if (CL.ot >= OUT_T) finish(false); } }
  function closeKey() { if (!CL.on || CL.ph === 'out' || CL.t < 0.3 || A.panelOpen()) return; if (!CL.shown) { doShow(); return; } end('key'); }
  function onKey(e) { if (!CL.on || CL.ph === 'out' || e.repeat || A.panelOpen()) return; const c = e.code;
    if (c === 'KeyE' || c === 'Escape' || c === 'Enter') { e.preventDefault(); e.stopImmediatePropagation(); closeKey(); return; }
    if (/^(Key[WASD]|Arrow|Space)/.test(c) && CL.t > 0.3) end('walk'); }
  addEventListener('keydown', onKey, true);
  const offT = map.on ? map.on('teleport', () => { if (CL.on) finish(true); }) : null;
  function lingTick(dt) { for (let i = LING.length - 1; i >= 0; i--) { const q = LING[i], G = q.G; q.t += dt; G.position.x += q.vx * dt * (1 + q.t); G.position.z += q.vz * dt * (1 + q.t); G.position.y += dt * (0.8 + q.t * 0.9); flap(G, q.t, true); if (q.t > 2.6) { gone(G); LING.splice(i, 1); } } }
  // 날갯짓(나는 중 = 빠르게 · 앉음 = 천천히 폈다 접었다)
  function flap(G, t, flying) { const u = G.userData, K = kit(); if (!u.wl) return; const kd = u.kind;
    if (kd === 'bee') K.wings(G, flying ? 0.35 * Math.sin(t * 70) : 0.12); else if (kd === 'dragonfly') K.wings(G, 0.06 * Math.sin(t * 80)); else if (kd === 'cicada') K.wings(G, flying ? 1.2 + 0.4 * Math.sin(t * 60) : 0);
    else if (u.bird) K.wings(G, flying ? 0.7 * Math.sin(t * 24) : -0.1); else K.wings(G, flying ? 0.25 + 1.05 * Math.abs(Math.sin(t * 13)) : 0.6 + 0.55 * Math.sin(t * 1.7)); }
  const yawTo = (G, x, z) => { G.rotation.y = Math.atan2(x - G.position.x, z - G.position.z); };
  const camSide = (C, x, z, k) => Math.atan2(C.cam[0] - x, C.cam[2] - z) + (k ?? 1.25);   /* 카메라 쪽에서 옆모습(날개·다리가 보이게) */
  // 나무줄기에 붙은 몸: 머리 = 위 · 등 = 바깥(u)
  function cling(G, u) { ZV.set(0, 1, 0); YV.set(u[0], 0, u[1]).normalize(); XV.crossVectors(YV, ZV); M5.makeBasis(XV, YV, ZV); G.quaternion.setFromRotationMatrix(M5); }

  // ── 🐜 개미 줄(칸 키트 town_cellkit.js) — T = { key, a, b, c(먹이 · 없으면 null), y, t0(그 줄 시계), rt(옮기기 시작), dur, me } ──
  function antDraw(T, tA) { const ax = T.a[0], az = T.a[1], cx = T.c ? T.c[0] : T.b[0], cz = T.c ? T.c[1] : T.b[1], rk = T.c ? ease((tA - T.rt) / T.dur) : 0, ex = T.b[0] + (cx - T.b[0]) * rk, ez = T.b[1] + (cz - T.b[1]) * rk, dx = ex - ax, dz = ez - az, L = Math.hypot(dx, dz) || 1, px = -dz / L, pz = dx / L, ry = Math.atan2(dx, dz);
    for (let j = 0; j < ANT_N; j++) { const u = (tA * 0.1 + j / ANT_N) % 1, ph = u * 9.4 + j, w = Math.sin(ph) * 0.03, back = j % 2 ? 1 - u : u, x = ax + dx * back + px * w, z = az + dz * back + pz * w, turn = Math.atan(Math.cos(ph) * 0.03 * 9.4 / L) * (j % 2 ? -1 : 1);
      M4.compose(V4.set(x, T.y + 0.0015, z), Q4.setFromEuler(E4.set(0, (j % 2 ? ry + Math.PI : ry) + turn, 0)), S4.set(1.3, 1.3, 1.3)); ANT.setMatrixAt(j, M4); }
    ANT.instanceMatrix.needsUpdate = true; }
  function closeAnt(T) { const ax = T.a[0], az = T.a[1], bx = T.b[0], bz = T.b[1], cx = T.c ? T.c[0] : bx, cz = T.c ? T.c[1] : bz, tx = ax * 0.2 + bx * 0.4 + cx * 0.4, tz = az * 0.2 + bz * 0.4 + cz * 0.4, me = map.player.pos();
    let vx = cx - bx, vz = cz - bz; if (Math.hypot(vx, vz) < 0.2) { vx = bx - ax; vz = bz - az; } let nx = -vz, nz = vx; if (nx * (me.x - tx) + nz * (me.z - tz) < 0) { nx = -nx; nz = -nz; }   /* 줄 끝(옛) ↔ 먹이를 옆으로 나란히 보는 쪽(내 쪽) */
    return close({ k: 'ant', at: [tx, T.y, tz], d: 0.86, hh: 0.56, dir: [nx, nz], init: C => { C.endT = 11; if (!ANT) { ANT = kit().antMesh(ANT_N); map.add(ANT); } ANT.count = ANT_N; ANT.visible = true; C.objs.push(ANT); antFocus = T.key; antDraw(T, T.t0); },
      step: t => antDraw(T, T.t0 + t), done: () => { antFocus = null; if (ANT) { ANT.visible = false; ANT.count = 0; } } }); }

  // ── 🔍 곤충 관찰(town.js 곤충 자리 s · 곤충 b) — 그림(스프라이트) 대신 모양 · 날아와 앉음·울음·기어오름 → 창 → 떠남 ──
  const gyV = (x, z) => { const t = A.gy(x, z); return map.q.groundAt ? map.q.groundAt(x, z, t + 2) : t; };   /* 보이는 땅(마당 판·돋운 땅 위 — 지형 높이만 쓰면 판 밑에 묻힘) */
  const standing = f => headY(f) > gyV(f.x, f.z) + 0.15;   /* 땅이 돋아 묻힌 꽃은 건너뜀 */
  function flowerNear(x, z, r) { const F = A.flowers ? A.flowers() : null; if (!F) return null; let best = null, bd = r * r; for (let i = 0; i < F.length; i++) { const f = F[i], dd = (f.x - x) ** 2 + (f.z - z) ** 2; if (dd < bd && standing(f)) { bd = dd; best = f; } } return best; }
  const headY = f => f.y + 0.29 * (f.s || 1) + 0.03 * (f.s || 1);   /* 꽃잎 머리 윗면(town.js 꽃 = 줄기 0.26 + 머리 0.035 × 크기) */
  function closeBug(s, b, show) { if (!s || !b || !s.spr || CL.on) return false; const sp = s.spr.position, dr = b.draw, g = gyV(s.x, s.z), me = map.player.pos();
    let rest = [sp.x, sp.y, sp.z], beh = 'still', from = null, leave = null, d = 0.55, hh = 0.16, trunk = null;
    if (dr === 'butterfly' || dr === 'bee' || dr === 'ladybird') { const f = flowerNear(s.x, s.z, 1.6); rest = f ? [f.x + (dr === 'bee' ? 0.02 : 0), headY(f), f.z] : [s.x, g + 0.005, s.z]; if (dr !== 'ladybird') { from = [sp.x, sp.y, sp.z]; beh = 'land'; leave = 'fly'; } else beh = 'walk'; hh = dr === 'ladybird' ? 0.2 : 0.13; d = dr === 'ladybird' ? 0.42 : 0.48; }
    else if (dr === 'dragonfly') { beh = 'hover'; leave = 'dart'; d = 0.7; hh = 0.08; }
    else if (s.tr && (dr === 'cicada' || dr === 'beetle' || dr === 'ootheca')) { const T9 = s.tr, ux = me.x - T9.x, uz = me.z - T9.z, ul = Math.hypot(ux, uz) || 1, y9 = Math.min(2.2, Math.max(0.6, sp.y - g)), r9 = (0.26 - 0.1 * (y9 / 2.6)) * (T9.s || 1) + 0.006;
      trunk = [ux / ul, uz / ul]; rest = [T9.x + trunk[0] * r9, g + y9, T9.z + trunk[1] * r9]; beh = dr === 'cicada' ? 'sing' : dr === 'beetle' ? 'climb' : 'still'; leave = dr === 'ootheca' ? null : 'fly'; hh = 0.04; d = 0.5; }
    else if (dr === 'hopper' || dr === 'cricket') { rest = [s.x, g + 0.003, s.z]; beh = 'sit'; leave = 'jump'; hh = 0.22; d = 0.5; }
    else if (dr === 'strider') { rest = [s.x, sp.y - (s.yo ?? 0.25) + 0.004, s.z]; beh = 'skate'; leave = 'dart'; hh = 0.3; d = 0.55; }
    else if (dr === 'cluster') { rest = [s.x, g + 0.005, s.z]; hh = 0.2; d = 0.42; }
    let G = null, base = null, landYaw = 0; const L9 = [0, 0];
    const ok = close({ k: 'bug:' + dr, at: rest, d, hh, tShow: beh === 'land' ? 4.2 : 3.4, tail: leave ? 2.4 : 0.5, show,
      init: C => { G = kit().make(dr, b.c); map.add(G); C.objs.push(G); s.cl = true; s.spr.visible = false; base = rest.slice(); G.position.set(...(from || rest)); landYaw = camSide(C, rest[0], rest[2]); G.rotation.y = landYaw; if (trunk) cling(G, trunk); const ux = rest[0] - C.cam[0], uz = rest[2] - C.cam[2], ul = Math.hypot(ux, uz) || 1; L9[0] = ux / ul; L9[1] = uz / ul; },
      step: (t, dt, lt) => { if (!G) return; const P = G.position;
        if (lt >= 0 && leave) { if (!G.userData.lv) { G.userData.lv = 1; base[0] = P.x; base[1] = P.y; base[2] = P.z; } if (leave === 'fly' || leave === 'dart') { const k = lt * (leave === 'dart' ? 2.6 : 1.3); P.set(base[0] + L9[0] * k * 0.7 - L9[1] * k * 0.5, base[1] + (leave === 'dart' ? 0.15 * lt : 0.5 * lt + 0.4 * lt * lt), base[2] + L9[1] * k * 0.7 + L9[0] * k * 0.5); if (trunk && lt < 0.1) { G.quaternion.identity(); G.rotation.y = Math.atan2(L9[0], L9[1]); } flap(G, t, true); }
          else if (leave === 'jump') { const k = Math.min(1, lt / 0.55); P.set(base[0] - L9[1] * 1.1 * k + L9[0] * 0.4 * k, base[1] + Math.sin(k * Math.PI) * 0.35, base[2] + L9[0] * 1.1 * k + L9[1] * 0.4 * k); if (k >= 1) G.visible = false; }
          if (lt > 2.2) G.visible = false; return; }
        switch (beh) {
          case 'land': { const k = ease((t - 0.4) / 2.0); if (k < 1) { const a = from, mid = 0.25 * Math.sin(k * Math.PI); P.set(a[0] + (rest[0] - a[0]) * k + Math.sin(t * 3) * 0.04 * (1 - k), a[1] + (rest[1] - a[1]) * k + mid, a[2] + (rest[2] - a[2]) * k); G.rotation.y = Math.atan2(rest[0] - a[0], rest[2] - a[2]) * (1 - k) + landYaw * k; flap(G, t, true); } else { P.set(rest[0], rest[1], rest[2]); G.rotation.y = landYaw; flap(G, t - 2.4, false); } break; }
          case 'hover': P.set(rest[0] + Math.sin(t * 0.9) * 0.03, rest[1] + Math.sin(t * 2.2) * 0.015, rest[2] + Math.cos(t * 0.7) * 0.03); flap(G, t, true); break;
          case 'sing': { const up9 = Math.min(0.07, Math.max(0, t - 1.3) * 0.045); P.set(base[0], base[1] + up9, base[2]); const on9 = t > 2.9 && ((t - 2.9) % 3.2) < 2.2;   /* 줄기를 몇 걸음 기어오른 뒤 울음 */ G.scale.set(1, 1, on9 ? 1 + 0.035 * Math.sin(t * 46) : 1); if (on9 && map.tone && t > 1.4 && ((t * 2) | 0) !== ((t * 2 - dt * 2) | 0)) map.tone(2900, 0, 0.32, 'sawtooth', 0.008, 2500); break; }   /* 수컷 매미가 배를 떨어 '맴—' */
          case 'climb': P.set(base[0], base[1] + Math.min(0.08, Math.max(0, t - 1.4) * 0.025), base[2]); break;
          case 'walk': { const a = t * 0.6; P.set(rest[0] + Math.cos(a) * 0.035, rest[1], rest[2] + Math.sin(a) * 0.035); G.rotation.y = -a; break; }
          case 'sit': P.y = rest[1] + Math.abs(Math.sin(t * 2.2)) * 0.002; break;
          case 'skate': { const n = Math.floor(t / 1.4), ph = t - n * 1.4, k = 1 - Math.exp(-ph * 5), pa = (n - 1) * 2.1, pb = n * 2.1, ax9 = rest[0] + Math.cos(pa) * 0.1, az9 = rest[2] + Math.sin(pa) * 0.1, bx9 = rest[0] + Math.cos(pb) * 0.1, bz9 = rest[2] + Math.sin(pb) * 0.1; P.set(ax9 + (bx9 - ax9) * k, rest[1], az9 + (bz9 - az9) * k); G.rotation.y = Math.atan2(bx9 - ax9, bz9 - az9); break; }   /* 소금쟁이: 가운데 다리로 물을 밀어 쭉 미끄러짐 */
        } },
      done: (why) => { s.cl = false; const left = !!leave && CL.pT >= 0; s.away = left ? 8.5 : null; if (!left && s.spr) s.spr.visible = true; } });
    if (ok) log.bug++; return ok; }

  // ── 🌼 꽃밭·🌱 텃밭(떼 목록 [[갈래, 마리]]) — 나비·벌이 멀리서 날아와 꽃에 앉아 꿀을 빪 ──
  function closeSwarm(list, h) { if (!list.length) return false; const F = A.flowers ? A.flowers() : [], me = map.player.pos(), pts = [];
    const near = F.filter(f => (f.x - h.x) ** 2 + (f.z - h.z) ** 2 < 36 && standing(f)).sort((a, c) => ((a.x - h.x) ** 2 + (a.z - h.z) ** 2) - ((c.x - h.x) ** 2 + (c.z - h.z) ** 2));
    if (near.length) { const f0 = near[0]; pts.push([f0.x, headY(f0), f0.z]); for (const f of near) { const dd = Math.hypot(f.x - f0.x, f.z - f0.z); if (dd > 0.2 && dd < 0.75) { pts.push([f.x, headY(f), f.z]); break; } } }
    else { const ux = h.x - me.x, uz = h.z - me.z, ul = Math.hypot(ux, uz) || 1, x = me.x + ux / ul * 1.3, z = me.z + uz / ul * 1.3; pts.push([x, gyV(x, z) + 0.01, z], [x + uz / ul * 0.3, gyV(x, z) + 0.01, z - ux / ul * 0.3]); }
    const ks = []; for (const [k, n] of list) for (let i = 0; i < n && ks.length < 3; i++) if (k === 'bfly' || k === 'bee') ks.push(k); if (!ks.length) return false;
    const lk = [0, 0, 0]; for (const p of pts) { lk[0] += p[0] / pts.length; lk[1] += p[1] / pts.length; lk[2] += p[2] / pts.length; }
    const M = []; const sea = A.season();
    const ok = close({ k: 'swarm', at: lk, d: pts.length > 1 ? 0.7 : 0.55, hh: 0.16,
      init: C => { C.endT = 10; ks.forEach((k, i) => { const c = k === 'bee' ? null : (sea === 'summer' && i === 0 ? ['#f2d24a', '#1d1d1d'] : ['#f6f4ea', '#3a3a3a']), G = kit().make(k === 'bee' ? 'bee' : 'butterfly', c), to = pts[i % pts.length].slice(); if (i >= pts.length) { to[0] += 0.05; to[2] -= 0.04; }
        const side = (i % 2 ? 1 : -1), ux = lk[0] - C.cam[0], uz = lk[2] - C.cam[2], ul = Math.hypot(ux, uz) || 1, from = [to[0] + ux / ul * 1.6 + uz / ul * 1.6 * side, to[1] + 0.9, to[2] + uz / ul * 1.6 - ux / ul * 1.6 * side];
        G.position.set(...from); map.add(G); C.objs.push(G); G.userData.linger = [-uz / ul * side * 0.8, ux / ul * side * 0.8]; M.push({ G, from, to, t0: 0.5 + i * 0.7, yaw: camSide(C, to[0], to[2], side * 1.25) }); }); },
      step: t => { for (const q of M) { const k = ease((t - q.t0) / 2.1), G = q.G; if (k < 1) { const mid = 0.3 * Math.sin(k * Math.PI); G.position.set(q.from[0] + (q.to[0] - q.from[0]) * k + Math.sin(t * 3 + q.t0) * 0.05 * (1 - k), q.from[1] + (q.to[1] - q.from[1]) * k + mid, q.from[2] + (q.to[2] - q.from[2]) * k); yawTo(G, q.to[0], q.to[2]); if (k > 0.85) G.rotation.y = q.yaw; flap(G, t, true); }
        else { G.position.set(q.to[0], q.to[1], q.to[2]); G.rotation.y = q.yaw; flap(G, t - q.t0 - 2.1, false); } } } });
    if (ok) log.swarm++; return ok; }

  // ── 🐦 봄 새집 · 🐝 여름 곤충 호텔(아이 동네 생태 보호 구역 · h.look = { at, n(앞쪽), tubes }) ──
  function closeNest(h, kind) { const L = h.look; if (!L || !L.at) return false; const n = L.n || [0, 1];
    if (kind === 'nest') { const at = L.at, sx = n[1], sz = -n[0]; let G = null, W9 = null, ch = 0; const st = [at[0] + n[0] * 2.4 + sx * 1.3, at[1] + 0.8, at[2] + n[1] * 2.4 + sz * 1.3], lip = [at[0] + n[0] * 0.09, at[1] - 0.05, at[2] + n[1] * 0.09], inn = [at[0] - n[0] * 0.13, at[1] - 0.05, at[2] - n[1] * 0.13];
      const ok = close({ k: 'nest', at, look: [at[0] + n[0] * 0.1, at[1] + 0.01, at[2] + n[1] * 0.1], d: 0.48, hh: 0.05, dir: [n[0] * 0.825 - n[1] * 0.565, n[0] * 0.565 + n[1] * 0.825], tail: null,   /* 비스듬히 앞(34°) — 새가 구멍 앞에 앉은 옆모습 */
        init: C => { C.endT = 8.8; G = kit().make('bird', ['#6b4f3a']); W9 = kit().blobs([[0, 0.074, 0.08, 0.005, 0.004, 0.014, 0x7fae3a]]); G.add(W9); G.scale.setScalar(1.2); G.position.set(...st); map.add(G); C.objs.push(G); },   /* 어미 새가 벌레를 물고 옴 */
        step: t => { if (!G) return; const P = G.position, out = Math.atan2(n[0], n[1]);
          if (t < 2.2) { const k = ease(t / 2.2); P.set(st[0] + (lip[0] - st[0]) * k, st[1] + (lip[1] - st[1]) * k + Math.sin(k * Math.PI) * 0.25, st[2] + (lip[2] - st[2]) * k); G.rotation.y = Math.atan2(lip[0] - st[0], lip[2] - st[2]); flap(G, t, true); }
          else if (t < 3.0) { P.set(...lip); G.rotation.y = out + Math.PI; flap(G, t, false); }
          else if (t < 3.5) { const k = ease((t - 3.0) / 0.5); P.set(lip[0] + (inn[0] - lip[0]) * k, lip[1], lip[2] + (inn[2] - lip[2]) * k); flap(G, t, false); }   /* 구멍 속으로(새끼에게 벌레를 줌) */
          else if (t < 4.9) { P.set(...inn); if (W9) W9.visible = false; if (map.tone && ch < 3 && t > 3.7 + ch * 0.28) { map.tone(3400 + ch * 300, 0, 0.07, 'sine', 0.025, 4200); ch++; } }   /* 새끼 새 우는 소리 */
          else if (t < 5.6) { const k = ease((t - 4.9) / 0.7); P.set(inn[0] + (lip[0] - inn[0]) * k, lip[1], inn[2] + (lip[2] - inn[2]) * k); G.rotation.y = out; flap(G, t, false); }
          else { const k = t - 5.6; G.rotation.y = Math.atan2(n[0] - sx * 0.7, n[1] - sz * 0.7); P.set(lip[0] + (n[0] - sx * 0.7) * k * 2.2, lip[1] + k * 0.7, lip[2] + (n[1] - sz * 0.7) * k * 2.2); flap(G, t, true); if (k > 2.6) G.visible = false; } } });
      if (ok) log.swarm++; return ok; }
    const T = (L.tubes || []).slice(0, 2); if (!T.length) return false; const lk = [T.reduce((a, q) => a + q[0], 0) / T.length, T.reduce((a, q) => a + q[1], 0) / T.length, T.reduce((a, q) => a + q[2], 0) / T.length]; const M = [];
    const ok = close({ k: 'hotel', at: lk, d: 0.75, hh: 0.02, dir: n,
      init: C => { C.endT = 6.6; T.forEach((q, i) => { const G = kit().make('bee'); const side = i ? 1 : -1, from = [q[0] + n[0] * 1.4 + n[1] * 1.2 * side, q[1] + 0.4, q[2] + n[1] * 1.4 - n[0] * 1.2 * side]; G.position.set(...from); map.add(G); C.objs.push(G); M.push({ G, q, from, t0: 0.6 + i * 1.6, out: i === 1 }); }); },
      step: t => { for (const m of M) { const G = m.G, q = m.q, k = ease((t - m.t0) / 1.8); if (k < 1) { G.position.set(m.from[0] + (q[0] + n[0] * 0.06 - m.from[0]) * k, m.from[1] + (q[1] - m.from[1]) * k + 0.15 * Math.sin(k * Math.PI), m.from[2] + (q[2] + n[1] * 0.06 - m.from[2]) * k); yawTo(G, q[0], q[2]); flap(G, t, true); }
        else { const k2 = Math.min(1, (t - m.t0 - 1.8) / 0.7); G.position.set(q[0] + n[0] * 0.06 * (1 - k2) - n[0] * 0.07 * k2, q[1], q[2] + n[1] * 0.06 * (1 - k2) - n[1] * 0.07 * k2); G.rotation.y = Math.atan2(-n[0], -n[1]); flap(G, t, k2 < 0.5); if (k2 >= 1) G.visible = false; } } } });   /* 대롱 속으로 꽃가루를 나름(들어가면 안 보임) */
    if (ok) log.swarm++; return ok; }

  // ── 🦀 모래 구멍 게(town_sea4.js) — o = { holes:[[x,y,z]], night, hide(on), show } · 낮 썰물 = 엽낭게가 구멍에서 나와 모래 경단을 뱉음 · 밤 = 달랑게가 쏜살같이 구멍으로 ──
  function closeCrab(o) { if (!o || !o.holes || !o.holes.length || CL.on) return false; const me = map.player.pos(), H = o.holes.slice().sort((a, c) => Math.hypot(a[0] - me.x, a[2] - me.z) - Math.hypot(c[0] - me.x, c[2] - me.z)), hole = H.find(q => Math.hypot(q[0] - me.x, q[2] - me.z) > 0.7) || H[0];
    const N = !!o.night, kd = N ? 'ghost' : 'sand'; let G = null, yaw = 0, ux = 0, uz = 0; const PEL = [];
    const ok = close({ k: 'crab:' + kd, at: hole, look: [hole[0], hole[1] + 0.02, hole[2]], d: 0.5, hh: N ? 0.4 : 0.3, tShow: N ? 3.9 : 5.4, tail: N ? 0.4 : 1.8, show: o.show,
      init: C => { G = kit().make(kd); const cx = C.cam[0] - hole[0], cz = C.cam[2] - hole[2], cl = Math.hypot(cx, cz) || 1; ux = -cz / cl; uz = cx / cl; yaw = Math.atan2(cx, cz) + 0.5; map.add(G); C.objs.push(G); if (o.hide) o.hide(true);
        { const L = []; for (const q of o.holes) if (Math.hypot(q[0] - hole[0], q[2] - hole[2]) < 2.2) L.push([q[0], q[1] + 0.0005, q[2], 0.036, 0.004, 0.036, 0x3e3226]); for (const q of o.pellets || []) if (Math.hypot(q[0] - hole[0], q[2] - hole[2]) < 2.2) L.push([q[0], q[1] + 0.003, q[2], 0.0068, 0.0058, 0.0068, 0xd9c8a0]); if (L.length) { const B9 = kit().blobs(L); map.add(B9); C.objs.push(B9); } }   /* 상자 구멍·경단 대신 둥근 구멍·경단(가까이서 봐도 어색하지 않게) */
        if (N) G.position.set(hole[0] + ux * 0.22, hole[1] + 0.002, hole[2] + uz * 0.22); else G.position.set(hole[0], hole[1] - 0.07, hole[2]); G.rotation.y = yaw; },
      step: (t, dt, lt) => { if (!G) return; const P = G.position, u = G.userData;
        if (N) { if (lt < 0 && t < 2.3) { P.set(hole[0] + ux * 0.22 + Math.sin(t * 2) * 0.01, hole[1] + 0.002, hole[2] + uz * 0.22); G.rotation.y = yaw; }
          else if (t < 2.75) { const k = clamp01((t - 2.3) / 0.35); P.set(hole[0] + ux * 0.22 * (1 - k), hole[1] + 0.002 - Math.max(0, (t - 2.6) / 0.15) * 0.06, hole[2] + uz * 0.22 * (1 - k)); G.rotation.y = Math.atan2(-ux, -uz); }
          else G.visible = false; return; }   /* 달랑게: 한 걸음 다가가면 눈 깜짝할 새 구멍으로 */
        if (lt >= 0) { const k = clamp01(lt / 1.1); P.set(hole[0] + ux * 0.11 * (1 - k), hole[1] + 0.002 - Math.max(0, k - 0.55) * 0.16, hole[2] + uz * 0.11 * (1 - k)); if (k >= 1) G.visible = false; return; }
        const up = clamp01((t - 1.5) / 0.6), out = ease((t - 2.15) / 0.7); P.set(hole[0] + ux * 0.11 * out, hole[1] - 0.07 * (1 - up) + 0.002 * up, hole[2] + uz * 0.11 * out); G.rotation.y = yaw;
        if (t > 2.9) { const s9 = Math.sin((t - 2.9) * 6); if (u.cr) u.cr.rotation.set(-0.5 * Math.max(0, s9), -0.4 * Math.max(0, s9), 0); if (u.cl) u.cl.rotation.set(-0.5 * Math.max(0, -s9), 0.4 * Math.max(0, -s9), 0); }   /* 집게로 젖은 모래를 떠서 입으로 */
        for (let k = 0; k < 3; k++) if (t >= PEL_T[k] && !PEL[k]) { const pg = kit().make('pellet'), a = ux * (0.2 + k * 0.035), b = uz * (0.2 + k * 0.035); pg.position.set(hole[0] + a - uz * 0.05, hole[1] + 0.001, hole[2] + b + ux * 0.05); map.add(pg); CL.objs.push(pg); PEL[k] = pg; } },   /* 걸러 먹고 남은 모래 = 동그란 경단으로 늘어놓음 */
      done: () => { if (o.hide) o.hide(false); } });
    if (ok) log.crab++; return ok; }

  // ── 🔍 갯벌 바다 친구(town_shore.js 그림 자리) · 🔍 바위 웅덩이(town_xp.js) — o = { b(바다 친구), at, hide(on), show } ──
  function closeSea(o) { if (!o || !o.b || !o.at || CL.on) return false; const b = o.b, dr = b.draw; let at = o.at, G = null, yaw = 0, ux = 0, uz = 0;
    { const me = map.player.pos(); if (Math.hypot(me.x - at[0], me.z - at[2]) < 0.6) { const cp = map.camera.position; let fx = me.x - cp.x, fz = me.z - cp.z; const fl = Math.hypot(fx, fz) || 1; fx /= fl; fz /= fl; const x = me.x + fx * 0.85, z = me.z + fz * 0.85; at = [x, gyV(x, z), z]; } }   /* 내 발밑이면 바라보는 쪽 앞에 */
    const ok = close({ k: 'sea:' + dr, at, look: [at[0], at[1] + 0.02, at[2]], d: dr === 'worm' || dr === 'snail' ? 0.42 : 0.46, hh: 0.26, tShow: 4.4, tail: 0.8, show: o.show,
      init: C => { G = kit().make(dr, b.c); const cx = C.cam[0] - at[0], cz = C.cam[2] - at[2], cl = Math.hypot(cx, cz) || 1; ux = -cz / cl; uz = cx / cl; yaw = Math.atan2(cx, cz) + (dr === 'skipper' || dr === 'snail' || dr === 'worm' ? 1.5 : 0.35); G.position.set(at[0], at[1] + 0.002, at[2]); G.rotation.y = yaw; map.add(G); C.objs.push(G); if (o.hide) o.hide(true); },
      step: (t, dt) => { if (!G) return; const P = G.position, u = G.userData, k0 = Math.max(0, t - 1.4);
        if (dr === 'crab') { P.set(at[0] + ux * Math.sin(k0 * 1.1) * 0.09, at[1] + 0.002, at[2] + uz * Math.sin(k0 * 1.1) * 0.09); const s9 = Math.sin(k0 * 5); if (u.cr) u.cr.rotation.x = -0.6 * Math.max(0, s9); if (u.cl) u.cl.rotation.x = -0.6 * Math.max(0, -s9); }   /* 옆으로 걸으며 집게로 펄을 떠 먹음 */
        else if (dr === 'fiddler') { P.set(at[0] + ux * Math.sin(k0 * 0.8) * 0.07, at[1] + 0.002, at[2] + uz * Math.sin(k0 * 0.8) * 0.07); if (u.cr) u.cr.rotation.set(-1.1 * Math.abs(Math.sin(k0 * 2.6)), 0, -0.3 * Math.abs(Math.sin(k0 * 2.6))); }   /* 수컷 농게가 큰 집게를 들었다 내림 */
        else if (dr === 'snail') { const k = Math.min(0.07, k0 * 0.018); P.set(at[0] + Math.sin(yaw) * k, at[1] + 0.002, at[2] + Math.cos(yaw) * k); }
        else if (dr === 'worm') { G.rotation.y = yaw + Math.sin(t * 3) * 0.25; P.y = at[1] + 0.002 - Math.min(0.016, Math.max(0, t - 2.4) * 0.008); }   /* 꿈틀대며 펄 속 굴로 */
        else if (dr === 'skipper') { const k1 = clamp01((t - 2.0) / 0.45), k2 = clamp01((t - 3.1) / 0.45), f = (k1 + k2) * 0.09, up = (Math.sin(k1 * Math.PI) + Math.sin(k2 * Math.PI)) * 0.07; P.set(at[0] + Math.sin(yaw) * f, at[1] + 0.002 + up, at[2] + Math.cos(yaw) * f); } },   /* 말뚝망둥어: 가슴지느러미로 짚고 폴짝 두 번 */
      done: () => { if (o.hide) o.hide(false); } });
    if (ok) log.sea++; return ok; }

  return {
    card, swarm: (k, x, z, n) => swarm([[k, n || 1]], { x, z }), markRead,
    tick(dt) { if (dead) return; if (CL.on) closeTick(dt); if (LING.length) lingTick(dt); if (pend.length && !A.panelOpen()) cardFly(pend.shift());
      if (nAct > 0 && IM) { for (let i = 0; i < N; i++) if (U[i].on) uTick(U[i], dt, i); IM.instanceMatrix.needsUpdate = true; if (nAct <= 0) { nAct = 0; IM.visible = false; } }},
    info: () => ({ marks: Object.keys(ST().rd).length, drawn: PG ? PG.drawRange.count : 0, active: nAct + (CL.on ? CL.objs.length : 0) + LING.length, cards: cards.length, pend: pend.length, close: CL.on ? CL.k : null, log: { ...log } }),
    closeAnt, closeBug, closeCrab, closeSea, closeOn: () => CL.on, closeKey, antOn: k => antFocus === k,
    closeInfo: () => ({ on: CL.on, ph: CL.ph, k: CL.k, t: +CL.t.toFixed(2), cam: CL.cam.map(v => +v.toFixed(3)), tgt: CL.tgt.map(v => +v.toFixed(3)), shown: CL.shown, pOpen: CL.pOpen, pT: CL.pT, why: CL.why, me: CL.me.map(v => +v.toFixed(2)), n: CL.objs.length, ling: LING.length }),
    closeObjs: () => CL.objs.slice(),   /* 시험(town_close1.cjs): 이것만 숨겨 그린 화면과 견줘 생물 픽셀을 셈 */
    bump: k => { log[k] = (log[k] | 0) + 1; },
    dispose() { finish(true); dead = true; if (offE) offE(); if (offT) offT(); removeEventListener('keydown', onKey, true); for (const q of LING) gone(q.G); LING.length = 0; if (ANT) { gone(ANT); ANT.dispose(); ANT = null; } if (KIT) { KIT.dispose(); KIT = null; } if (HINT) { HINT.remove(); HINT = null; } for (const d of cards) d.remove(); cards = []; for (const m of [PTS, IM]) if (m) { map.remove(m); m.geometry.dispose(); if (m.material.map) m.material.map.dispose(); m.material.dispose(); } PTS = IM = null; }
  };
}
