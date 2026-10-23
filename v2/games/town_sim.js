// 🌦 칸 상태판 + 날씨 전선(SIM-1 · 단계 4 조각 0·1 · 설계 docs/systems/town_phase4.md 「공용 칸 상태」「22 날씨 전선」)
//   SIM = Float32Array(칸 수 × 10) 한 번 · ci(x,z) = cellOf와 같은 경계 배열(XE·YE)의 정수 칸 번호(행 × 열 수 + 열)
//   1초를 125ms 자리 여덟으로 — 엔진마다 자기 자리(0번 자리는 비움: 이미 umbSec·CHEM.sec·RD.sec가 몰려 있음)
//   전선 = 비 오는 날 서쪽에서 들어오는 비 띠 하나(게임 1시간에 약 1열 · 폭 2~3열 · 산 칸은 한 열 먼저·1.5배 길게 · 셋 중 하나 꼴 비그늘 날)
//   + 흐린 날(구름 조금 날은 반쯤 · 1일째도) 오후 산 소나기 · 비 세기 = rainAt(x,z,분) 식 하나(140칸을 돌지 않음)
//   끄기: ?simoff=front,… · SM_PROMO = 모두 꺼짐 · 매 프레임 새 객체 X · 새 Light X
export const SIM_K = 10;   /* 칸마다 열 칸: 0 비 · 1 젖음 · 2 흐르는 물 · 3 꽃 · 4 곤충 · 5 개구리 · 6 물 맑기 · 7 물가 쓰레기 · 8 붐빔 · 9 예비 */
const ss = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };   /* a > b도 됨(거꾸로 줄어듦) */
const rngOf = s => () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

export function createSim(A) {
  /* A = { id, hashS, XE, YE, MXof, MYof, X, Z, mtn(c, r) → 산 칸인가, home = [x, z] 학교 정문, promo } */
  const XE = A.XE, YE = A.YE, nC = XE.length - 1, nR = YE.length - 1, N = nC * nR, SIM = new Float32Array(N * SIM_K);
  const OFF = new Set(((typeof location !== 'undefined' && new URLSearchParams(location.search).get('simoff')) || '').split(',').filter(Boolean));
  const dead = !!A.promo || OFF.has('all');
  const eIdx = (v, L9) => { if (!(v >= L9[0] && v < L9[L9.length - 1])) return -1; let i = 0; while (i < L9.length - 2 && v >= L9[i + 1]) i++; return i; };
  const ci = (x, z) => { const c = eIdx(A.MXof(x), XE), r = eIdx(A.MYof(z), YE); return c < 0 || r < 0 ? -1 : r * nC + c; };
  /* 소수 칸 자리(열 u · 행 v) — 판 밖은 가장자리 칸 폭으로 이어 셈 */
  const frac = (v, L9) => { const n = L9.length - 1; if (v < L9[0]) return (v - L9[0]) / (L9[1] - L9[0]); if (v >= L9[n]) return n + (v - L9[n]) / (L9[n] - L9[n - 1]); let i = 0; while (i < n - 1 && v >= L9[i + 1]) i++; return i + (v - L9[i]) / (L9[i + 1] - L9[i]); };
  const unfrac = (u, L9) => { const n = L9.length - 1; if (u < 0) return L9[0] + u * (L9[1] - L9[0]); if (u >= n) return L9[n] + (u - n) * (L9[n] - L9[n - 1]); const i = Math.floor(u); return L9[i] + (u - i) * (L9[i + 1] - L9[i]); };
  const uOf = x => frac(A.MXof(x), XE), vOf = z => frac(A.MYof(z), YE), xOf = u => A.X(unfrac(u, XE)), zOf = v => A.Z(unfrac(v, YE));
  const MT = new Float32Array(N); for (let r = 0; r < nR; r++) for (let c = 0; c < nC; c++) MT[r * nC + c] = A.mtn(c, r) ? 1 : 0;
  const mAt = (c, r) => (c < 0 || r < 0 || c >= nC || r >= nR ? 0 : MT[r * nC + c]);
  /* 산 무게(0~1): 칸 가운데끼리 이어 부드럽게 · 날카롭게 한 번 */
  const mtnW = (u, v) => { const a = u - 0.5, b = v - 0.5, c = Math.floor(a), r = Math.floor(b), fu = a - c, fv = b - r; const m = (mAt(c, r) * (1 - fu) + mAt(c + 1, r) * fu) * (1 - fv) + (mAt(c, r + 1) * (1 - fu) + mAt(c + 1, r + 1) * fu) * fv; return ss(0.2, 0.8, m); };

  // ── 1초 자리 여덟 ──
  const SL = [[], [], [], [], [], [], [], []], ST = {}; let ph = 0;
  function on(slot, name, fn) { if (dead || OFF.has(name) || !(slot >= 1 && slot <= 7)) return false; SL[slot].push({ name, fn }); ST[name] = ST[name] || { n: 0, sum: 0, max: 0, slot }; return true; }
  function run(k) { const L9 = SL[k]; for (let i = 0; i < L9.length; i++) { const e = L9[i], t0 = performance.now(); try { e.fn(); } catch (er) { console.warn('sim ' + e.name, er); } const ms = performance.now() - t0, s = ST[e.name]; s.n++; s.sum += ms; if (ms > s.max) s.max = ms; } }
  function tick(dt) { if (dead) return; const p0 = ph; ph += Math.min(dt, 0.5); for (let k = 1; k < 8; k++) { const b = k * 0.125; if ((p0 < b && ph >= b) || (ph >= 1 && p0 < b + 1 && ph >= b + 1)) run(k); } if (ph >= 1) ph -= 1; }
  const eng = () => { const o = {}; for (const k in ST) { const s = ST[k]; o[k] = { slot: s.slot, n: s.n, avg: s.n ? +(s.sum / s.n).toFixed(3) : 0, max: +s.max.toFixed(3) }; } return o; };

  // ── 22 날씨 전선: 하루 판(씨앗 = 마을 + 날) ──
  let P = null;
  function day(d, kind, sky) {   /* kind = 그날 예보(rain·snow·clear) · sky = 예보 이름(맑음·구름 조금·흐림·비·눈) */
    if (P && P.d === d && P.kind === kind) return P; const R = rngOf(A.hashS('front:' + A.id + ':' + d)); P = { d, kind, rain: false, sh: null };
    if (dead || OFF.has('front')) return P;
    if (kind === 'rain') { P.rain = true; P.h0 = 7 + R() * 2.5; P.w = 2 + R(); P.sp = 0.9 + R() * 0.2; P.ph = R() * 6.28; P.shadow = R() < 1 / 3; P.stop = 5; let mx = 0; for (let c = 0; c < nC; c++) for (let r = 0; r < nR; r++) if (mAt(c, r)) mx = Math.max(mx, c + 1); P.stop = mx || 5; }
    else if (kind !== 'snow') { const want = sky === '흐림' || d === 1 || (sky === '구름 조금' && R() < 0.8); const M9 = []; for (let r = 0; r < nR; r++) for (let c = 0; c < nC; c++) if (mAt(c, r) && (d === 1 ? mAt(c + 1, r) : !mAt(c + 1, r))) M9.push([c, r]);   /* 1일째 = 산 한가운데(처음 들어온 날 내 동네는 맑게) · 그 밖 = 마을을 보는 앞산 칸(마을에서 보임) */
      if (want && M9.length) { const H0 = A.home || [0, 0]; if (d !== 1) M9.sort((p, q) => Math.hypot(xOf(p[0] + 0.5) - H0[0], zOf(p[1] + 0.5) - H0[1]) - Math.hypot(xOf(q[0] + 0.5) - H0[0], zOf(q[1] + 0.5) - H0[1])); const [c, r] = d === 1 ? M9[Math.floor(R() * M9.length)] : M9[Math.floor(R() * Math.min(2, M9.length))];   /* 앞산 = 학교에서 가까운 산 가장자리 칸 둘 가운데 하나 */ P.sh = { c, r, x: xOf(c + 0.5), z: zOf(r + 0.5), rad: 70 + R() * 20, h: 12.5 + R() * 2.5, dur: 1.1 }; } }
    return P; }
  /* 비 세기 0~1 — u·v = 칸 소수 자리 · h = 시(소수) */
  function rainUV(u, v, x, z, h) { if (!P) return 0; let r = 0;
    if (P.rain) { const m = mtnW(u, v), L = (h - P.h0) * P.sp + 0.3 * Math.sin(v * 1.1 + P.ph), d = L + m - u, len = P.w * (1 + 0.5 * m); r = ss(-0.35, 0.35, d) * (1 - ss(len - 0.35, len + 0.35, d)); if (P.shadow) r *= Math.max(m, 1 - ss(P.stop - 0.4, P.stop + 0.4, u)); }
    if (P.sh) { const s = P.sh, t = h - s.h, k = ss(0, 0.25, t) * (1 - ss(s.dur - 0.25, s.dur, t)); if (k > 0) { const dd = Math.hypot(x - s.x, z - s.z); r = Math.max(r, k * ss(s.rad, s.rad * 0.5, dd)); } }
    return r; }
  const rainAt = (x, z, min) => rainUV(uOf(x), vOf(z), x, z, min / 60);
  /* 오늘 젖은 땅(띠 앞줄이 지나간 곳 · 소나기 자리) */
  function wetUV(u, v, x, z, h) { if (!P) return 0; let w = 0;
    if (P.rain) { const m = mtnW(u, v), L = (h - P.h0) * P.sp + 0.3 * Math.sin(v * 1.1 + P.ph), d = L + m - u; w = ss(-0.35, 0.35, d); if (P.shadow) w *= Math.max(m, 1 - ss(P.stop - 0.4, P.stop + 0.4, u)); }
    if (P.sh && h > P.sh.h + 0.15) { const dd = Math.hypot(x - P.sh.x, z - P.sh.z); w = Math.max(w, ss(P.sh.rad, P.sh.rad * 0.5, dd)); }
    return w; }
  const wetAt = (x, z, min) => wetUV(uOf(x), vOf(z), x, z, min / 60);
  /* 행마다 비 띠 [서쪽 끝 u, 동쪽 끝 u] — 커튼 자리(1초에 한 번 · 행 열 × 0.2열 걸음) */
  const BAND = new Float32Array(nR * 2), WETU = new Float32Array(nR);
  function bands(min) { const h = min / 60; for (let j = 0; j < nR; j++) { const v = j + 0.5, z = zOf(v); let a = 1e9, b = -1e9, wl = -1e9; for (let u = -0.4; u <= nC + 0.4; u += 0.2) { const x = xOf(u); if (rainUV(u, v, x, z, h) > 0.4) { if (u < a) a = u; if (u > b) b = u; } if (wetUV(u, v, x, z, h) > 0.5) wl = u; } BAND[j * 2] = a; BAND[j * 2 + 1] = b; WETU[j] = wl; } }
  /* 10일 흉내(시험·재기 손잡이): 그날 산 칸과 산 아닌 칸이 처음 젖는 시각 · 바뀜 */
  function firstWet(c, r, min0, min1, step) { for (let m = min0; m <= min1; m += step) { if (rainUV(c + 0.5, r + 0.5, xOf(c + 0.5), zOf(r + 0.5), m / 60) > 0.4) return m; } return null; }
  const cell = nm => { const k = typeof nm === 'number' ? nm : -1; return k >= 0 && k < N ? Array.from(SIM.subarray(k * SIM_K, k * SIM_K + SIM_K)) : null; };
  return { SIM, N, nC, nR, ci, on, tick, eng, off: k => dead || OFF.has(k), dead, day, get P() { return P; }, rainAt, wetAt, rainUV, uOf, vOf, xOf, zOf, mtnW, bands, BAND, WETU, firstWet, cell, MT };
}

// ── 비 띠 그림: 먹구름 + 세로 커튼 두 장(행마다) · 소나기 상자 — 인스턴스 메시 하나(그리기 +1 · 비가 없으면 0) ──
export function makeFrontView(T3, F, A) {
  /* A = { tH(x,z), TY, group } */
  const nR = F.nR, MAXI = nR * 3 + 5, cv = document.createElement('canvas'); cv.width = 32; cv.height = 64; { const g = cv.getContext('2d'), R = rngOf(91); g.clearRect(0, 0, 32, 64); for (let i = 0; i < 46; i++) { const x = R() * 32, a = 0.35 + R() * 0.5; g.fillStyle = 'rgba(255,255,255,' + a.toFixed(2) + ')'; g.fillRect(x, 0, 1, 64); } const gr = g.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(0.15, 'rgba(255,255,255,0.6)'); gr.addColorStop(1, 'rgba(255,255,255,0.42)'); g.globalCompositeOperation = 'destination-over'; g.fillStyle = gr; g.fillRect(0, 0, 32, 64); }
  const tex = new T3.CanvasTexture(cv); tex.wrapS = T3.RepeatWrapping; tex.repeat.set(6, 1);
  const mat = new T3.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.62, depthWrite: false, side: T3.DoubleSide, fog: true }), geo = new T3.PlaneGeometry(1, 1);
  const m = new T3.InstancedMesh(geo, mat, MAXI); m.count = 0; m.frustumCulled = false; m.userData.fx = 1; m.renderOrder = 2; m.visible = false; m.setColorAt(0, new T3.Color(0xffffff));
  const O = new T3.Object3D(), CC = new T3.Color(0x6d7a8a), CK = new T3.Color(0x4e5763), HT = new Float32Array(F.nR * F.nC).fill(-1e9); let htRow = 0;
  A.group.add(m);
  /* 행 칸마다 가장 높은 땅(구름 높이) — 한 초에 한 행씩 채움(짓기 멈춤 X) */
  function htStep() { if (htRow >= F.nR * 2) return; const j = htRow >> 1, c0 = (htRow & 1) * Math.ceil(F.nC / 2), c1 = (htRow & 1) ? F.nC : Math.ceil(F.nC / 2); htRow++; for (let c = c0; c < c1; c++) { let mx = A.TY; for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) { const x = F.xOf(c + 0.17 + a * 0.33), z = F.zOf(j + 0.17 + b * 0.33); mx = Math.max(mx, A.tH(x, z)); } HT[j * F.nC + c] = mx; } }   /* 반 행씩(한 초 63번) */
  const topOf = (j, ua, ub) => { let mx = A.TY; for (let c = Math.max(0, Math.floor(ua)); c <= Math.min(F.nC - 1, Math.floor(ub)); c++) mx = Math.max(mx, HT[j * F.nC + c] > -1e8 ? HT[j * F.nC + c] : A.TY + 40); return Math.max(mx + 32, A.TY + 70); };
  let k = 0; const put = (x, y, z, rx, ry, sx, sy, col) => { if (k >= MAXI) return; O.position.set(x, y, z); O.rotation.set(rx, ry, 0); O.scale.set(sx, sy, 1); O.updateMatrix(); m.setMatrixAt(k, O.matrix); m.setColorAt(k, col); k++; };
  function update(inside) { htStep(); k = 0; const bot = A.TY - 3;
    for (let j = 0; j < F.nR; j++) { const ua = F.BAND[j * 2], ub = F.BAND[j * 2 + 1]; if (!(ub > ua - 0.01) || ua > 1e8) continue; const x0 = F.xOf(ua - 0.1), x1 = F.xOf(ub + 0.1), z0 = F.zOf(j), z1 = F.zOf(j + 1), zc = (z0 + z1) / 2, zw = Math.abs(z1 - z0) + 2, top = topOf(j, ua, ub);
      put((x0 + x1) / 2, top, zc, -Math.PI / 2, 0, Math.max(4, x1 - x0), zw, CK);   /* 낮은 먹구름(아래에서 보면 어두운 천장) */
      if (!inside) { put(x1, (top + bot) / 2, zc, 0, Math.PI / 2, zw, top - bot, CC); put(x0, (top + bot) / 2, zc, 0, Math.PI / 2, zw, top - bot, CC); } }
    const P = F.P, h = (A.min ? A.min() : 0) / 60; if (P && P.sh) { const s = P.sh, t = h - s.h; if (t > -0.05 && t < s.dur) { const top = Math.max((HT[s.r * F.nC + s.c] > -1e8 ? HT[s.r * F.nC + s.c] : A.TY + 40) + 32, A.TY + 70), w9 = s.rad * 1.3, hh = top - bot;
        put(s.x, top, s.z, -Math.PI / 2, 0, w9 * 1.1, w9 * 1.1, CK); if (!inside) { put(s.x + w9 / 2, (top + bot) / 2, s.z, 0, Math.PI / 2, w9, hh, CC); put(s.x - w9 / 2, (top + bot) / 2, s.z, 0, Math.PI / 2, w9, hh, CC); put(s.x, (top + bot) / 2, s.z + w9 / 2, 0, 0, w9, hh, CC); put(s.x, (top + bot) / 2, s.z - w9 / 2, 0, 0, w9, hh, CC); } } }
    m.count = k; m.visible = k > 0; if (k) { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; } }
  function hide() { m.count = 0; m.visible = false; }
  function scroll(dt) { if (m.visible) tex.offset.y -= dt * 0.9; }   /* 빗줄기가 흘러내림(uniform 하나 꼴 · 매 프레임 새 객체 X) */
  return { m, update, hide, scroll, get n() { return k; }, dispose() { A.group.remove(m); geo.dispose(); mat.dispose(); tex.dispose(); } };
}

// ── 바람개비 대신 풍향 깃발(높은 곳·정문) — 인스턴스 하나 · 깃발 = 바람이 불어 가는 쪽 ──
export function makeFlags(T3, spots, group) {
  const P = [], I = [], C = []; let n = 0; const push = (x, y, z, c) => { P.push(x, y, z); C.push(c[0], c[1], c[2]); return n++; };
  const pole = [0.62, 0.64, 0.66], red = [0.86, 0.27, 0.23];
  { const r = 0.06, H = 6; for (let a = 0; a < 6; a++) { const a0 = a / 6 * Math.PI * 2, a1 = (a + 1) / 6 * Math.PI * 2, p0 = push(Math.cos(a0) * r, 0, Math.sin(a0) * r, pole), p1 = push(Math.cos(a1) * r, 0, Math.sin(a1) * r, pole), p2 = push(Math.cos(a1) * r, H, Math.sin(a1) * r, pole), p3 = push(Math.cos(a0) * r, H, Math.sin(a0) * r, pole); I.push(p0, p2, p1, p0, p3, p2); } }
  { const a = push(0, 5.9, 0.02, red), b = push(1.6, 5.45, 0.02, red), c = push(0, 5.0, 0.02, red), d = push(0, 5.9, -0.02, red), e = push(1.6, 5.45, -0.02, red), f = push(0, 5.0, -0.02, red); I.push(a, c, b, d, e, f); }
  const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(C, 3)); g.setIndex(I); g.computeVertexNormals();
  const mat = new T3.MeshLambertMaterial({ vertexColors: true, side: T3.DoubleSide }), m = new T3.InstancedMesh(g, mat, Math.max(1, spots.length)), O = new T3.Object3D(); m.count = spots.length; m.frustumCulled = false; m.userData.fx = 1; group.add(m);
  function wind(W) { spots.forEach((s, i) => { O.position.set(s[0], s[1], s[2]); O.rotation.set(0, Math.atan2(-W.z, W.x), 0); O.scale.set(1, 1, 1); O.updateMatrix(); m.setMatrixAt(i, O.matrix); }); m.instanceMatrix.needsUpdate = true; }
  return { m, wind, spots, dispose() { group.remove(m); g.dispose(); mat.dispose(); } };
}

// ── 25 비 피하기: 밖 일꾼 손에 우산(새 사람 X · 자리 그대로 · 인스턴스 하나) ──
export function makeUmbrellas(T3, N, group) {
  const P = [], I = [], C = []; let n = 0; const push = (x, y, z, c) => { P.push(x, y, z); C.push(c[0], c[1], c[2]); return n++; };
  const stick = [0.25, 0.22, 0.2], cloth = [1, 1, 1];
  { const r = 0.018; for (let a = 0; a < 4; a++) { const a0 = a / 4 * Math.PI * 2, a1 = (a + 1) / 4 * Math.PI * 2, p0 = push(Math.cos(a0) * r, 0, Math.sin(a0) * r, stick), p1 = push(Math.cos(a1) * r, 0, Math.sin(a1) * r, stick), p2 = push(Math.cos(a1) * r, 1.3, Math.sin(a1) * r, stick), p3 = push(Math.cos(a0) * r, 1.3, Math.sin(a0) * r, stick); I.push(p0, p2, p1, p0, p3, p2); } }
  { const tip = push(0, 1.52, 0, cloth), K = 8, R = 0.58, base = []; for (let a = 0; a < K; a++) { const t = a / K * Math.PI * 2; base.push(push(Math.cos(t) * R, 1.2, Math.sin(t) * R, cloth)); } for (let a = 0; a < K; a++) { const b0 = base[a], b1 = base[(a + 1) % K]; I.push(tip, b1, b0); I.push(tip, b0, b1); } }
  const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(P, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(C, 3)); g.setIndex(I); g.computeVertexNormals();
  const mat = new T3.MeshLambertMaterial({ vertexColors: true }), m = new T3.InstancedMesh(g, mat, N), O = new T3.Object3D(), COL = [0x2f6fd0, 0xe0453a, 0xf2c230, 0x3cc76a, 0x8a5cc8].map(h => new T3.Color(h)); m.count = 0; m.visible = false; m.frustumCulled = false; m.userData.fx = 1; group.add(m); m.setColorAt(0, COL[0]);
  let k = 0;
  function begin() { k = 0; }
  function add(x, y, z, ry, ci) { if (k >= N) return; O.position.set(x, y, z); O.rotation.set(0, ry, 0); O.updateMatrix(); m.setMatrixAt(k, O.matrix); m.setColorAt(k, COL[ci % COL.length]); k++; }
  function end() { m.count = k; m.visible = k > 0; if (k) { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; } }
  return { m, begin, add, end, get n() { return k; }, dispose() { group.remove(m); g.dispose(); mat.dispose(); } };
}

// ── 젖은 땅(땅·산 재질에 uniform 몇 개 · 행마다 젖은 앞줄 x + 소나기 자리) ──
export function wetChain(m, U, nR) {
  const pv = m.onBeforeCompile, k0 = m.customProgramCacheKey ? m.customProgramCacheKey() : '';
  m.onBeforeCompile = function (sh, r) { if (pv) pv.call(this, sh, r); sh.uniforms.uWetX9 = U.uWetX9; sh.uniforms.uWetZ9 = U.uWetZ9; sh.uniforms.uWetS9 = U.uWetS9; sh.uniforms.uWetK9 = U.uWetK9;
    sh.vertexShader = 'varying vec2 vWXZ9;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n vWXZ9 = (modelMatrix * vec4(transformed, 1.0)).xz;');
    sh.fragmentShader = 'varying vec2 vWXZ9;\nuniform float uWetX9[' + nR + '];\nuniform float uWetZ9[' + (nR + 1) + '];\nuniform vec4 uWetS9;\nuniform float uWetK9;\n' + sh.fragmentShader.replace('#include <tonemapping_fragment>', ' if (uWetK9 > 0.0) { float wx9 = -1e9; for (int i = 0; i < ' + nR + '; i++) { if (vWXZ9.y >= uWetZ9[i] && vWXZ9.y < uWetZ9[i + 1]) wx9 = uWetX9[i]; } float w9 = smoothstep(wx9 + 3.0, wx9 - 3.0, vWXZ9.x); w9 = max(w9, uWetS9.w * smoothstep(uWetS9.z, uWetS9.z * 0.6, distance(vWXZ9, uWetS9.xy))); gl_FragColor.rgb *= 1.0 - 0.3 * uWetK9 * w9; }\n#include <tonemapping_fragment>'); };
  m.customProgramCacheKey = () => k0 + ':wet9'; m.needsUpdate = true; return m;
}
