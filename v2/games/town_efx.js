// 👀 E 뒤 보이는 변화(EFX-1 · 사용자 10-27 "E 클릭만 하고 딱히 뭐가 변했다 그런 느낌 잘 모르겠는데")
//   E 뒤에 글 한 줄·소리만 있던 자리에 '세상 안에서' 바뀌는 것을 붙여요 — 막대·꾹 X · 컷신 X(그 자리에서) · 숫자 X
//   ① 읽음 표시: 다 읽은 판(표지석·장소 카드·기록판·게시판·물때표·간판) 위에 초록 ✓ 동그라미(점 한 벌 = 그리기 한 번 · 늘 카메라를 봄 · 저장)
//   ② 작은 생물·잎 떼(꽃밭·텃밭 = 나비·벌이 날아옴 · 정자나무 = 잎이 떨어지고 새가 날아감 · 봄 새집 = 어미 새가 나감 · 여름 곤충 호텔 = 벌이 드나듦)
//      생태 보호 구역 세 곳(새집·곤충 호텔·연못)은 '살펴보고 기록' 할 일이라 ✓ 표시도 함께
//      — 인스턴스 한 벌(그리기 한 번 · 24마리까지) · 떠 있을 때만 매 프레임 · 끝나면 숨김
//   ③ 도감 카드: 처음 본 생물 = 그 자리에서 작은 그림 카드가 떠올라 도감(오른쪽 위)으로 날아감 · 창이 떠 있으면 닫힌 뒤에
//   마을 장면에 빛(Light) X — MeshBasic · Points만 · 새 객체는 만들 때만(매 프레임 X)
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
  let dead = false, PTS = null, PG = null, IM = null, nAct = 0, cards = [], log = { read: 0, swarm: 0, card: 0, bug: 0, ant: 0 };
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
    for (const [re, fn] of SWARM) if (re.test(lb)) { swarm(fn({ sea: A.season(), rain: A.wet(), night: A.night() }), h); return; } }
  const offE = map.on ? map.on('interact', onUse) : null;
  ptsBuild();
  return {
    card, swarm: (k, x, z, n) => swarm([[k, n || 1]], { x, z }), markRead,
    tick(dt) { if (dead) return; if (pend.length && !A.panelOpen()) cardFly(pend.shift());
      if (nAct > 0 && IM) { for (let i = 0; i < N; i++) if (U[i].on) uTick(U[i], dt, i); IM.instanceMatrix.needsUpdate = true; if (nAct <= 0) { nAct = 0; IM.visible = false; } }},
    info: () => ({ marks: Object.keys(ST().rd).length, drawn: PG ? PG.drawRange.count : 0, active: nAct, cards: cards.length, pend: pend.length, log: { ...log } }),
    bump: k => { log[k] = (log[k] | 0) + 1; },
    dispose() { dead = true; if (offE) offE(); for (const d of cards) d.remove(); cards = []; for (const m of [PTS, IM]) if (m) { map.remove(m); m.geometry.dispose(); if (m.material.map) m.material.map.dispose(); m.material.dispose(); } PTS = IM = null; }
  };
}
