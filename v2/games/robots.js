// 🤖 로봇인 척(RB-1 · 10-04 사용자 '너만의 창의적인 게임' 제안 ① → '1 괜찮네')
//   구조 = 🕵️ CCTV 반장(하늘에서 보기 — 모두 보임 · 몇 명) vs 🤖 스파이 여럿(3인칭 · 로봇과 똑같은 몸 · 로봇 속도 · 달리기·점프 없음)
//   참고: SpyParty(스파이 = AI 손님 흉내 + 미션 · 저격수 = 한 발 · 손님을 쏘면 짐 · 시간이 끝나면 저격수 승) · Hidden in Plain Sight(똑같은 NPC 무리 속 사람 찾기 · 한 발)
//     → 우리 판: 📸 확인 = 스파이 수 + 1번 · 진짜 로봇을 찍으면 한 번 날아감 · 미션을 하면 반장에게 '📡 ○○실에서 신호'(1.5초 뒤 · 방 이름만)
//   로봇 규칙(아이들이 흉내 낼 것): 늘 같은 빠르기 · 물건 앞에 가서 멈추고 삐빅 스캔(2~3.5초) · 다음 물건으로 똑바로 · 복도 한가운데서 멈추지 않음
//   한 판 = 준비 3초 + 놀이 50초 + 결과 5초 · 모두 한 번씩 반장(차례) · 혼자 = 🕵️ 반장(스파이 봇과) 또는 🤖 스파이(반장 봇 + 스파이 봇 친구와)
//   로봇 = 판마다 씨앗(판 시작 시각 t0)으로 길·멈춤이 정해져 모든 화면에서 같게 움직임(네트워크 0) · 스파이만 상태를 보냄(숨바꼭질과 같은 식)
export const meta = { id: 'robots', title: '로봇인 척', api: 1 };
import { createStandings } from '../js/standings.js?v=1';   // RANK-1: 친구 대결 경기 순위표(판마다 · 📊 칩 · B)

export const BAL = {
  robots: 16, v: 3.2,                  // 로봇 수 · 로봇 빠르기(m/s — 스파이도 같게: speed(v / 4.2) — 2.8이면 미션 셋을 도는 데 시간만으로 54% 짐)
  count: 3, play: 50, end: 5,          // 준비 · 놀이 · 결과(초)
  scan: 2.5, dwell0: 2, dwell1: 3.5,   // 미션 스캔(초) · 로봇이 물건 앞에서 멈추는 시간
  same: 0.25, mBias: 1.8,              // 같은 방 다른 물건으로 갈 확률 · 미션 방 가중(그 방이 조금 붐비게)
  missions: 3, needK: 2, needC: 1,     // 스파이 한 명의 미션 수 · 팀 목표 = needK × 스파이 + needC
  shotsC: 1, delay: 1.5, near: 1.4,    // 📸 = 스파이 + shotsC · 신호 늦게(초) · 미션 자리 반경
  minGap: 8, tour: 50,                 // 한 스파이의 미션끼리 최소 거리 · 처음 자리 → 미션 셋을 도는 길 상한(m)
};

// ---------- 씨앗 난수(모든 화면이 같은 수) ----------
export function mulberry32(a) { a >>>= 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const hdg = (dx, dz) => (Math.abs(dx) + Math.abs(dz) < 1e-6 ? 0 : (Math.atan2(dx, -dz) * 180 / Math.PI + 360) % 360);

// 경기장 = 1층 실내(계단·체육관·버스·조리실·창고·준비실·문서고·당직실·영양사실·악기실 빼고) · x ≤ AX1(서쪽 반 — 로봇 16대가 방마다 한두 대)
export const AX1 = 16.5;
const NOZ = /계단|체육관|버스|조리실|창고|준비실|문서고|당직실|영양사실|악기실/;
//   방은 통째로만(동관 2학년처럼 경계에 걸친 방은 뺌) · 본관 복도만 x로 자름(고깔)
export const arenaOf = (ax1 = AX1) => (z, x, y) => { if (y >= 0.6 || y <= -0.6 || x > ax1) return false; if (!z) return false; return z.floor === 1 && !!z.indoor && !NOZ.test(z.label) && (z.id === 'corridor-main' || z.x1 <= ax1 + 0.5); };
export const arenaPred = arenaOf(AX1);

// 신호 구역(넷 · 방 이름 대신 — 방 단위면 후보가 평균 2대뿐이라 반장이 93% 이김(시뮬레이션))
export const AREAS = [   // 색 이름은 글자로(🟦 같은 네모 이모지는 윈도 10에서 깨질 수 있음)
  { n: '보건실 쪽', c: 0x3b82f6, css: '#3b82f6', cn: '파랑' }, { n: '도서실 쪽', c: 0x22c55e, css: '#22c55e', cn: '초록' },
  { n: '교무실 쪽', c: 0xf59e0b, css: '#f59e0b', cn: '노랑' }, { n: '급식실 쪽', c: 0xef4444, css: '#ef4444', cn: '빨강' }];
const AREA_Z = { 'west-door': 0, 'kinder-office': 0, nurse: 0, narae: 0, 'west-lobby': 0, kinder: 0, library: 1, sarang: 1, care: 1,
  admin: 2, principal: 2, teachers: 2, entrance: 2, 'entrance-vestibule': 2, cafeteria: 3, 'link-corridor': 3, 'center-lobby': 3 };

// 팀 목표(⭐)·놀이 시간 = 스파이 수별 표(시뮬레이션 400판씩 — 미션 셋씩 · 로봇 16 · 반장 봇 대 스파이 봇이 50%에 가깝게)
//   스파이 1 → ⭐3·50초(45%) · 2 → ⭐5·46초(56%) · 3 → ⭐8·50초(51%) · 4 → ⭐11·54초(≈50%) · 5 → ⭐13·50초(49%) · 6 → ⭐16·52초(≈48%) · 7 → ⭐18·50초(48%)
//   시뮬레이션에서 크게 듣는 손잡이 = ⭐ 목표(1개에 ±25%)·시간(4초에 ±7%) · 📸 한 번 더·신호 0.5초는 거의 안 들음 · 신호에 방 이름 = 스파이 0~6%(너무 셈 — 그래서 구역 넷)
const GOAL = [0, 3, 5, 8, 11, 13, 16, 18], PLAY = [0, 50, 46, 50, 54, 50, 52, 50];
// ⚖️ 따라잡기(+ = 스파이 도움 · − = 반장 도움): +1 = 5초 더(≈+8%) · +2 = ⭐ 목표 −1(≈+25%) · −1 = 4초 덜(≈−7%) · −2 = 8초 덜(≈−15%)
export const goalOf = (S, lvl = 0) => Math.max(S, (GOAL[Math.min(S, 7)] || Math.round(S * 2.6)) - (lvl >= 2 ? 1 : 0));
export const shotsOf = S => S + 1;
export const playOf = (S, lvl = 0) => (PLAY[Math.min(S, 7)] || 50) + (lvl === 1 ? 5 : lvl === -1 ? -4 : lvl <= -2 ? -8 : 0);
export const lvlCfg = lvl => ({ play: null, lvl });
export const LVL_T = { '-2': '반장 도움 2단계(시간 8초 덜)', '-1': '반장 도움 1단계(시간 4초 덜)', '0': '', '1': '스파이 도움 1단계(시간 5초 더)', '2': '스파이 도움 2단계(⭐ 목표 1개 덜)' };

// =====================================================================================
// 무리(로봇 길·멈춤 · 미션 자리) — 시뮬레이션·놀이 공용
// =====================================================================================
export function createCrowd(nav, cfg) {
  const N = nav.raw, n = N.count, E = N.e, Y = N.y, MASK = N.mask, X = i => N.X(i), Z = i => N.Z(i);
  let inA = new Uint8Array(n), list = new Int32Array(0);
  function setArena(pred, ax1 = AX1) {   // 숨바꼭질과 같은 식: 구역 조건 → 구역 없는 문턱 칸(이웃이 경기장이면 · 3번) → 가장 큰 이어진 덩어리
    inA = new Uint8Array(n); const L = [];
    for (let i = 0; i < n; i++) { if (MASK[i]) continue; if (!pred(nav.zoneOf(i), X(i), Y[i], Z(i))) continue; inA[i] = 1; L.push(i); }
    for (let pass = 0; pass < 3; pass++) { const add = []; for (let i = 0; i < n; i++) { if (inA[i] || MASK[i] || nav.zoneOf(i) || Y[i] >= 0.6 || Y[i] < -0.6 || X(i) > ax1) continue;
        for (let d = 0; d < 4; d++) { const j = E[i * 4 + d]; if (j >= 0 && inA[j]) { add.push(i); break; } } }
      for (const i of add) { inA[i] = 1; L.push(i); } if (!add.length) break; }
    const comp = new Int32Array(n).fill(-1); let best = -1, bestN = 0, cid = 0; const st = [];
    for (const s0 of L) { if (comp[s0] >= 0) continue; let cnt = 0; st.push(s0); comp[s0] = cid;
      while (st.length) { const c = st.pop(); cnt++; for (let d = 0; d < 4; d++) { const j = E[c * 4 + d]; if (j >= 0 && inA[j] && comp[j] < 0 && Math.abs(Y[j] - Y[c]) < 0.6) { comp[j] = cid; st.push(j); } } }
      if (cnt > bestN) { bestN = cnt; best = cid; } cid++; }
    for (let k = L.length - 1; k >= 0; k--) if (comp[L[k]] !== best) { inA[L[k]] = 0; L.splice(k, 1); }
    list = Int32Array.from(L); return { cells: list.length };
  }
  const snapA = (x, y, z, r = 1.5) => { const i = nav.snap(x, y, z, r); return i >= 0 && inA[i] ? i : -1; };
  // ---------- 물건(로봇이 가서 스캔하는 곳) ----------
  //   ① 상호작용 지점(칠판·책·우유…) 먼저 ② 가구·벽 바로 앞 칸(여유 0 — 문 1.5m 안은 뺌)으로 채움 · 방마다 넓이/8㎡개(2~6) · 복도·로비는 12m마다(4까지) · 멀리 떨어진 것부터
  const PO = [], ZL = [], ZM = new Map(), DXs = [1, -1, 0, 0], DZs = [0, 0, 1, -1];
  function setPois(L) {
    const S9 = N.S || 0.3, byZ = new Map(), CLR = N.clr, zid = i => { const z = nav.zoneOf(i); return z ? z.id : null; };
    const zOf = id => { let a = byZ.get(id); if (!a) byZ.set(id, a = { zn: null, cells: 0, hot: [], edge: [] }); return a; };
    // 문 근처(다른 구역 칸에서 5칸 안) 표시
    const door = new Uint8Array(n), q = []; for (const i of list) { const zi = zid(i); for (let d = 0; d < 4; d++) { const j = E[i * 4 + d]; if (j >= 0 && !MASK[j] && zid(j) !== zi) { door[i] = 1; q.push(i); break; } } }
    for (let h = 0; h < q.length; h++) { const v = q[h]; if (door[v] >= 6) continue; for (let d = 0; d < 4; d++) { const j = E[v * 4 + d]; if (j >= 0 && inA[j] && !door[j]) { door[j] = door[v] + 1; q.push(j); } } }
    for (const i of list) { const zn = nav.zoneOf(i); if (!zn) continue; const a = zOf(zn.id); a.zn = zn; a.cells++;
      if (CLR && CLR[i] === 0 && !door[i]) { let bd = -1; for (let d = 0; d < 4; d++) { const j = E[i * 4 + d]; if (j < 0 || MASK[j]) { bd = d; break; } } if (bd >= 0) a.edge.push({ c: i, d: bd }); } }
    for (const p of L) { const s = p.stand; if (!s) continue; const c = snapA(s[0], s[1], s[2], 1.0); if (c < 0) continue; const zn = nav.zoneOf(c); if (!zn) continue; zOf(zn.id).hot.push({ c, p }); }
    for (const [id, a] of byZ) { if (!a.zn) continue;
      const corr = /corridor|hall/.test(a.zn.kind), area = a.cells * S9 * S9, len = Math.max(a.zn.x1 - a.zn.x0, a.zn.z1 - a.zn.z0);
      const want = corr ? Math.min(4, Math.max(1, Math.round(len / 12))) : Math.min(6, Math.max(2, Math.round(area / 8)));
      const C = [...a.hot.map(h => ({ c: h.c, p: h.p })), ...a.edge.map(e => ({ c: e.c, d: e.d }))]; if (!C.length) continue;
      const pick = []; const far = (qq) => { let d = 1e9; for (const r of pick) d = Math.min(d, Math.hypot(X(qq.c) - X(r.c), Z(qq.c) - Z(r.c))); return d; };
      for (const h of C) { if (!h.p || pick.length >= want) break; if (far(h) >= 1.8) pick.push(h); }   // 상호작용 지점 먼저(1.8m 떨어지게)
      while (pick.length < Math.min(want, C.length)) { let b = null, bd = -1; for (const qq of C) { if (pick.includes(qq)) continue; const d = far(qq); if (d > bd) { bd = d; b = qq; } } if (!b || bd < 1.8) break; pick.push(b); }
      const zi = ZL.length; ZM.set(id, zi); ZL.push({ id, label: a.zn.label, kind: a.zn.kind, pois: [], x0: a.zn.x0, x1: a.zn.x1, z0: a.zn.z0, z1: a.zn.z1, corr });
      for (const h of pick) { const c = h.c, tx = h.p ? h.p.x : X(c) + DXs[h.d] * 0.6, tz = h.p ? h.p.z : Z(c) + DZs[h.d] * 0.6;
        ZL[zi].pois.push(PO.length); PO.push({ id: h.p ? h.p.id : 'e' + c, label: h.p ? h.p.label : a.zn.label, x: tx, z: tz, cell: c, sx: X(c), sy: Y[c], sz: Z(c), zi, hot: !!h.p }); } }
    return { pois: PO.length, zones: ZL.length };
  }
  // ---------- 길(경기장 안 · 같은 쌍은 한 번만) ----------
  const PC = new Map();
  function route(a, b) {
    const k = a * 262144 + b; let r = PC.get(k); if (r !== undefined) return r;
    const q = N.path(a, b, { maxExp: 24000, bad: i => !inA[i] }); r = null;
    if (q.ok && q.pts.length >= 2) { const pts = q.pts.map(p => [p[0], p[1], p[2]]), cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][2] - pts[i - 1][2])); r = { pts, cum, L: cum[cum.length - 1] }; }
    PC.set(k, r); return r;
  }
  function routeXZ(c0, p) { return c0 === PO[p].cell ? null : route(c0, PO[p].cell); }
  // ---------- 스파이 판: 처음 자리(로봇처럼 물건 앞) + 미션 M개(서로 다른 방 · 복도·로비 아님 · minGap 넘게 · 스파이끼리 겹치지 않게)
  //   처음 자리 → 가까운 미션 차례로 도는 길(직선 × 1.3)이 tour m 안(50초 안에 숨을 틈이 남게 — 흩어져 있으면 시간만으로 54% 짐)
  function plan(seed, S, M) {
    const rng = mulberry32((seed * 7 + 12345) >>> 0), used = new Set(), out = [], rooms = ZL.map((z, i) => i).filter(i => !ZL[i].corr), d2 = (a, b) => Math.hypot(PO[a].sx - PO[b].sx, PO[a].sz - PO[b].sz);
    for (let s = 0; s < S; s++) { let best = null;
      for (let g = 0; g < 400 && !best; g++) {
        const st = Math.floor(rng() * PO.length), L = []; let h = 0;
        if (g < 350 && out.some(o => d2(o.st, st) < 2)) continue;   // UX-8(10-05 교사 편의성): 친구 스파이와 같은 자리에서 시작하지 않게(350번째부터는 예전 대체 길 — best가 비지 않게)
        while (L.length < M && h++ < 60) { const zi = rooms[Math.floor(rng() * rooms.length)], P = ZL[zi].pois, p = P[Math.floor(rng() * P.length)];
          if (used.has(p) || d2(st, p) < 6 || L.some(q => PO[q].zi === zi || d2(q, p) < cfg.minGap)) continue; L.push(p); }   // 출발 자리 바로 옆 미션 없음(RB-2)
        if (L.length < M) continue;
        let cur = st, len = 0; const rest = L.slice(); while (rest.length) { rest.sort((a, b) => d2(cur, a) - d2(cur, b)); len += d2(cur, rest[0]) * 1.3; cur = rest.shift(); }
        if (len <= cfg.tour || g > 300) best = { st, ms: L }; }
      for (const p of best.ms) used.add(p); out.push(best); }
    return out;
  }
  const missions = (seed, S, M) => plan(seed, S, M).map(q => q.ms);
  function weights(ms) { const w = new Float64Array(ZL.length).fill(1); for (const L of ms) for (const p of L) w[PO[p].zi] = cfg.mBias; return w; }
  function pickPoi(rng, cur, wz) {
    const cz = cur >= 0 ? PO[cur].zi : -1;
    if (cur >= 0 && rng() < cfg.same && ZL[cz].pois.length > 1) { const L = ZL[cz].pois.filter(q => q !== cur); return L[Math.floor(rng() * L.length)]; }
    let tot = 0; for (let z = 0; z < ZL.length; z++) if (z !== cz) tot += wz[z];
    let u = rng() * tot, zz = -1; for (let z = 0; z < ZL.length; z++) { if (z === cz) continue; zz = z; u -= wz[z]; if (u <= 0) break; }
    const L = ZL[zz].pois; return L[Math.floor(rng() * L.length)];
  }
  // ---------- 로봇 = 다리(leg) 줄: { p 물건, t0 걷기 시작, t1 도착, t2 떠남, rt 길 } · 시각 t의 자리는 계산으로만(보낼 것 없음) ----------
  function robot(k, seed, wz, p0) {
    const rng = mulberry32((seed ^ Math.imul(k + 1, 0x9E3779B1)) >>> 0);
    const start = p0 != null ? p0 : Math.floor(rng() * PO.length);
    return { k, rng, wz, legs: [{ p: start, t0: -99, t1: -99, t2: 0.2 + rng() * 3.3, rt: null, boot: true }], li: 0 };   // 첫 다리 = 켜지는 중(스캔 안 함 — 스파이도 처음엔 가만히 서 있으므로)
  }
  // UX-8(10-05 교사 편의성): 로봇 무리 — 스파이 출발 자리(avoid = POI 번호) 1.5m 안에서 시작하는 로봇은 다른 물건으로(몸이 겹쳐 시작하던 것) · 씨앗·계획에서만 정해져 모든 화면이 같음
  function startRobots(seed, wz, avoid) { const L = []; for (let k = 0; k < cfg.robots; k++) { let r = robot(k, seed, wz), p = r.legs[0].p, g = 0;
      while (g++ < PO.length && avoid.some(a => Math.hypot(PO[a].sx - PO[p].sx, PO[a].sz - PO[p].sz) < 1.5)) p = (p + 7) % PO.length;
      if (p !== r.legs[0].p) r = robot(k, seed, wz, p); L.push(r); } return L; }
  function extend(r) {
    const last = r.legs[r.legs.length - 1];
    for (let tries = 0; tries < 6; tries++) { const q = pickPoi(r.rng, last.p, r.wz), dw = cfg.dwell0 + r.rng() * (cfg.dwell1 - cfg.dwell0), rt = routeXZ(PO[last.p].cell, q);
      if (!rt) continue; const t0 = last.t2, t1 = t0 + rt.L / cfg.v; r.legs.push({ p: q, t0, t1, t2: t1 + dw, rt }); return; }
    r.legs.push({ p: last.p, t0: last.t2, t1: last.t2, t2: last.t2 + 3, rt: null });
  }
  function along(rt, s, o) {   // 길 위 s m 지점
    const C = rt.cum, P = rt.pts; let i = 1; while (i < C.length - 1 && C[i] < s) i++;
    const a = P[i - 1], b = P[i], seg = C[i] - C[i - 1], u = seg > 1e-6 ? Math.max(0, Math.min(1, (s - C[i - 1]) / seg)) : 1;
    o.x = a[0] + (b[0] - a[0]) * u; o.y = a[1] + (b[1] - a[1]) * u; o.z = a[2] + (b[2] - a[2]) * u; o.h = hdg(b[0] - a[0], b[2] - a[2]); return o;
  }
  function at(r, t, o) {   // o = { x, y, z, h, scan, mv, p }
    while (r.legs[r.legs.length - 1].t2 < t + 1) extend(r);
    if (r.li >= r.legs.length || r.legs[r.li].t0 > t) r.li = 0;
    while (r.li < r.legs.length - 1 && r.legs[r.li].t2 <= t) r.li++;
    const L = r.legs[r.li], P = PO[L.p];
    if (L.rt && t < L.t1) { along(L.rt, Math.max(0, (t - L.t0) * cfg.v), o); o.scan = false; o.mv = true; }
    else { o.x = P.sx; o.y = P.sy; o.z = P.sz; o.h = L.boot ? r.h0 ?? (r.h0 = Math.floor(r.rng() * 4) * 90) : hdg(P.x - P.sx, P.z - P.sz); o.scan = !L.boot && t > L.t1 + 0.25 && t < L.t2 - 0.15; o.mv = false; }
    o.p = L.p; return o;
  }
  const zoneAtXZ = (x, y, z) => { const c = nav.snap(x, y, z, 1.2); const zn = c >= 0 ? nav.zoneOf(c) : null; return zn ? (ZM.has(zn.id) ? ZM.get(zn.id) : -1 - 0) : -1; };
  // 구역 색(신호 단위): 방 = AREA_Z 표 · 본관 복도 = x로 나눔
  const areaOf = (x, y, z) => { const c = nav.snap(x, y, z, 1.2), zn = c >= 0 ? nav.zoneOf(c) : null; if (!zn) return -1; if (zn.id === 'corridor-main') return x < -24 ? 0 : x < -7 ? 1 : 2; const a = AREA_Z[zn.id]; return a == null ? -1 : a; };
  return { setArena, snapA, setPois, route, routeXZ, plan, missions, weights, pickPoi, robot, startRobots, at, along, zoneAtXZ, areaOf, hdg, get PO() { return PO; }, get ZL() { return ZL; }, inA: () => inA, list: () => list, X, Z, Y };
}

// =====================================================================================
// 🕵️ 반장 봇 머리(사람 흉내) — 시뮬레이션·혼자 놀이 공용
//   신호가 오면(반응 1초 뒤) 그 방에 있는 것(+ 2초 안에 나간 것) = 후보 · 확률을 나눠 점수에 더함
//   사람 기억: 표시(❓ — 신호마다 위 3개 · 모두 6개까지)한 것은 끝까지 기억 · 나머지는 반감기 8초로 흐려짐
//   이상한 움직임(복도 한가운데 멈춤·물건 없는 곳에서 스캔·뒤돌기)을 보면(25% — 신호 방 근처면 50%) +0.35
//   쏘기: 점수 1.1 이상이고 둘째보다 0.3 앞서면 · 스파이가 한 개만 남았으면 0.3 이상 · 마지막 4초엔 아무나 1등
// =====================================================================================
export function createGuardBot(cfg, rng = Math.random) {
  const S = new Map(), cleared = new Set(); let tags = [];
  const rec = e => { let r = S.get(e); if (!r) S.set(e, r = { sig: [], an: 0 }); return r; };
  return {
    signal(t, cands) {   // cands = [{ e, w }]
      const L = cands.filter(c => !cleared.has(c.e)); const tot = L.reduce((s, c) => s + c.w, 0); if (!tot) return;
      L.sort((a, b) => b.w - a.w || a.e - b.e);
      L.forEach((c, i) => { const r = rec(c.e); r.sig.push({ t, p: c.w / tot }); if (i < 3 && !tags.includes(c.e)) tags.push(c.e); });
      if (tags.length > 6) tags = tags.slice(-6);
    },
    anomaly(e, t, near) { if (cleared.has(e)) return false; if (rng() < (near ? 0.5 : 0.25)) { rec(e).an += 1; if (!tags.includes(e)) { tags.push(e); if (tags.length > 6) tags.shift(); } return true; } return false; },
    score(e, t) { const r = S.get(e); if (!r || cleared.has(e)) return 0; const tg = tags.includes(e); let s = 0; for (const q of r.sig) s += q.p * (tg ? 1 : Math.pow(0.5, (t - q.t) / 8)); return s + 0.35 * r.an; },
    clear(e) { cleared.add(e); tags = tags.filter(q => q !== e); },
    decide(t, need, left) {   // need = 스파이 팀에 남은 미션 수 · left = 남은 시간
      let b = -1, bs = 0, s2 = 0; for (const e of S.keys()) { const s = this.score(e, t); if (s > bs) { s2 = bs; bs = s; b = e; } else if (s > s2) s2 = s; }
      if (b < 0) return -1;
      if (bs >= 1.1 && bs - s2 >= 0.3) return b;
      if (need <= 1 && bs >= 0.3) return b;
      if (left < 4 && need <= 2 && bs > 0) return b;
      return -1;
    },
    get tags() { return tags.slice(); }, get cleared() { return cleared; }, suspect(e, t) { return this.score(e, t); },
  };
}

// =====================================================================================
// 시뮬레이션(개발용 — 놀이에서는 안 부름): simulate(SD2.map, {바꿀 값}, 판 수, { spies, auto, decoy, cover, lam })
//   스파이 봇(사람 흉내): auto = 자동 걷기(로봇과 똑같이) 비율 · 아니면 손으로 → 멈칫(초당 lam) = 이상한 움직임 · decoy = 미션 전에 아무 물건 들르기 · cover = 방에 로봇이 1대도 없으면 잠깐 기다림
// =====================================================================================
export async function simulate(map, over = {}, rounds = 100, o = {}) {
  const cfg = { ...BAL, ...over }, nav = await map.nav(), C = createCrowd(nav, cfg), ax1 = o.ax1 || AX1; C.setArena(arenaOf(ax1), ax1); C.setPois(map.pois({ src: 'hot' }));
  if (o.list) return C.ZL.map(z => z.label + (z.corr ? '(복도)' : '') + ':' + z.pois.length + '(' + z.pois.filter(i => C.PO[i].hot).length + ')').join(' | ');
  const PO = C.PO, ZL = C.ZL, Sn = o.spies || 1, K = cfg.robots, DT = 0.1, rng = Math.random;
  const pAuto = o.auto ?? 0.6, pDecoy = o.decoy ?? 0.35, lam = o.lam ?? 0.12, pCover = o.cover ?? 0.3;
  const res = { spyWin: 0, caught: 0, wrong: 0, done: 0, firstCatch: [], end: [], sig: 0, cand: 0, n: 0 };
  for (let rd = 0; rd < rounds; rd++) {
    const seed = Math.floor(rng() * 1e9), PL = C.plan(seed, Sn, cfg.missions), ms = PL.map(q => q.ms), wz = C.weights(ms), need = o.lvl != null ? goalOf(Sn, o.lvl) : cfg.needK * Sn + cfg.needC, shots0 = o.lvl != null ? shotsOf(Sn) : Math.max(0, Sn + cfg.shotsC);
    if (o.lvl != null) cfg.play = playOf(Sn, o.lvl); const ZONE = (o.room || cfg.room) ? C.zoneAtXZ : C.areaOf;
    const R = C.startRobots(seed, wz, PL.map(q => q.st));   // 놀이와 같게(UX-8)
    const srng = mulberry32(seed + 999), G = createGuardBot(cfg, rng);
    const SP = []; for (let s = 0; s < Sn; s++) { const p0 = PL[s].st; SP.push({ s, e: K + s, alive: true, x: PO[p0].sx, y: PO[p0].sy, z: PO[p0].sz, p: p0, todo: ms[s].slice(), st: 'wait', T: 0.3 + srng() * 2.5, rt: null, d: 0, manual: false, tgt: -1, mis: false, stopT: 0, hz: [] }); }
    let done = 0, shots = shots0, t = 0, end = null, sigQ = [], decT = 1e9; const recent = [];
    const o1 = {}, ents = () => { const L = []; for (const r of R) { C.at(r, t, o1); L.push({ e: r.k, x: o1.x, y: o1.y, z: o1.z, scan: o1.scan }); } for (const s of SP) if (s.alive) L.push({ e: s.e, x: s.x, y: s.y, z: s.z, scan: s.st === 'scan' }); return L; };
    const hist = [];   // 0.5초마다 [e → 구역]
    for (; t < cfg.play && end == null; t += DT) {
      // 스파이 봇
      for (const s of SP) { if (!s.alive) continue;
        if (s.st === 'wait' || s.st === 'dwell') { if ((s.T -= DT) > 0) continue;
          if (!s.todo.length) { s.st = 'dwell'; s.T = 99; continue; }
          // 다음: 미션(가까운 것) 또는 들르기
          const near = s.todo.slice().sort((a, b) => Math.hypot(PO[a].sx - s.x, PO[a].sz - s.z) - Math.hypot(PO[b].sx - s.x, PO[b].sz - s.z))[0];
          const dec = !s.lastDecoy && !s.covered && rng() < pDecoy;
          s.tgt = dec ? C.pickPoi(rng, s.p, wz) : near; s.mis = !dec; s.lastDecoy = dec; s.manual = rng() > pAuto;
          const c0 = nav.snap(s.x, s.y, s.z, 1.2); s.rt = c0 >= 0 ? C.routeXZ(c0, s.tgt) : null; s.d = 0; s.st = 'walk'; if (!s.rt) { s.st = 'arrive'; } }
        if (s.st === 'walk') {
          if (s.manual && s.stopT > 0) { s.stopT -= DT; continue; }
          if (s.manual && rng() < lam * DT) { s.stopT = 0.8 + rng() * 0.8; const zi = ZONE(s.x, s.y, s.z); G.anomaly(s.e, t, recent.some(q => q.z === zi && t - q.t < 8)); continue; }
          s.d += cfg.v * (s.manual ? 0.93 : 1) * DT; if (s.d >= s.rt.L) { s.d = s.rt.L; s.st = 'arrive'; } C.along(s.rt, s.d, o1); s.x = o1.x; s.y = o1.y; s.z = o1.z; }
        if (s.st === 'arrive') { s.p = s.tgt; const P = PO[s.tgt]; s.x = P.sx; s.y = P.sy; s.z = P.sz;
          if (s.mis && pCover > 0 && !s.covered) { // 방에 다른 로봇이 없으면 잠깐(최대 5초) 기다리며 다른 물건 스캔하는 척
            let cnt = 0; for (const r of R) { C.at(r, t, o1); if (C.zoneAtXZ(o1.x, o1.y, o1.z) === P.zi) cnt++; }
            if (cnt === 0 && rng() < pCover) { s.st = 'dwell'; s.T = 2 + rng() * 3; s.covered = true; continue; } }
          s.covered = false; s.st = s.mis ? 'scan' : 'dwell'; s.T = s.mis ? cfg.scan : cfg.dwell0 + rng() * (cfg.dwell1 - cfg.dwell0); }
        if (s.st === 'scan') { if ((s.T -= DT) > 0) continue; s.todo = s.todo.filter(q => q !== s.tgt); done++; const P = PO[s.tgt]; sigQ.push({ t: t + cfg.delay, z: ZONE(P.sx, P.sy, P.sz), e: s.e }); s.st = 'dwell'; s.T = 0; if (done >= need) { end = 'spy'; break; } } }
      if (end) break;
      if (Math.round(t * 10) % 5 === 0) { const L = ents(), m = new Map(); for (const q of L) m.set(q.e, ZONE(q.x, q.y, q.z)); hist.push({ t, m }); if (hist.length > 8) hist.shift(); }
      // 신호 도착 → 반장 봇 후보
      while (sigQ.length && sigQ[0].t <= t) { const q = sigQ.shift(), L = ents(), past = hist.find(h => h.t >= t - 2.2), cands = [];
        for (const x of L) { const zi = ZONE(x.x, x.y, x.z); if (zi === q.z) cands.push({ e: x.e, w: x.scan ? 0.8 : 0.7 }); else if (past && past.m.get(x.e) === q.z) cands.push({ e: x.e, w: 0.5 }); }
        res.sig++; res.cand += cands.length; G.signal(t, cands); recent.push({ t, z: q.z }); decT = Math.min(decT, t + 1.0); }
      // 반장 결정(신호 1초 뒤부터 · 0.5초마다)
      if (shots > 0 && t >= decT) { decT = t + 0.5; const e = G.decide(t, need - done, cfg.play - t);
        if (e >= 0) { shots--; const sp = SP.find(s => s.e === e && s.alive);
          if (sp) { sp.alive = false; res.caught++; if (res.firstCatch.length < 1e6 && !SP.some(s => s.e !== e && !s.alive)) res.firstCatch.push(t); if (!SP.some(s => s.alive)) end = 'guard'; } else res.wrong++;
          G.clear(e); } }
    }
    if (!end) end = 'guard';
    if (end === 'spy') res.spyWin++; res.done += done; res.end.push(t); res.n++;
  }
  const med = a => { const b = a.slice().sort((x, y) => x - y); return b.length ? Math.round(b[b.length >> 1] * 10) / 10 : null; };
  return { rounds: res.n, spyWin: Math.round(res.spyWin / res.n * 100) + '%', caughtPer: Math.round(res.caught / res.n * 100) / 100, wrongPer: Math.round(res.wrong / res.n * 100) / 100, missions: Math.round(res.done / res.n * 10) / 10,
    candPerSignal: Math.round(res.cand / Math.max(1, res.sig) * 10) / 10, medEnd: med(res.end), medFirstCatch: med(res.firstCatch), pois: PO.length, zones: ZL.length };
}

// =====================================================================================
// 놀이
// =====================================================================================
const MDB = 'https://class-rpg-6f409-default-rtdb.asia-southeast1.firebasedatabase.app/metaverse/match/';
const START = [12.5, -32.8];   // 반장 몸(숨김 · 움직이지 않음)이 서 있는 곳
const SMAX = 7, MINT = 0x4cc9b0, RED = 0xe84848, RS = 1.15;   // RS = 로봇 크기(하늘에서 잘 보이게 — 모두 같게)
const RS_TOP = 1.55;   // UX-1(10-05 교사 편의성): 하늘 보기(반장·구경)에서만 더 크게 — 몸 꼭대기 = 1.425×RS + 흔들림 0.045가 topview CUT_H 2.3m 밑이어야 함(cutOn이 로봇 재질도 잘라서 1.6이면 안테나가 잘림)
const seedOf = (t0, seq) => ((Math.floor(t0 / 7) ^ Math.imul(seq + 1, 2654435761)) >>> 0) % 1000000000;

export default async function start(map, params = {}) {
  const THREE = map.three, NETM = params.mode === 'net';
  let dead = false;
  map.player.freeze(true);
  const ban0 = map.hud.banner('로봇인 척 준비 중…', 30);
  const nav = await map.nav();
  if (dead || map.gone) return {};
  ban0.remove();
  const cfg = { ...BAL }, rng = Math.random;
  const C = createCrowd(nav, cfg); C.setArena(arenaPred); C.setPois(map.pois({ src: 'hot' }));
  const PO = C.PO, K = cfg.robots, NA = K + SMAX, inA = C.inA(), NX = nav.raw.X, NZ = nav.raw.Z, NY = nav.raw.y;
  const coarse = (() => { try { return matchMedia('(pointer: coarse)').matches || document.body.classList.contains('touch'); } catch (e) { return false; } })();
  const fmt = s => Math.floor(s / 60) + ':' + String(Math.max(0, Math.floor(s % 60))).padStart(2, '0');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const hotOff = map.interact.enable(() => true, false);   // 학교 E 지점(앉기·물 마시기…)은 끄고 E = 삐빅 스캔
  const startCell = C.snapA(START[0], 0, START[1], 3), SX = startCell >= 0 ? NX(startCell) : START[0], SY = startCell >= 0 ? NY[startCell] : 0, SZ = startCell >= 0 ? NZ(startCell) : START[1];

  // ---------- 경기장 경계 = 주황 고깔(복도 끝·바깥문·빠진 방 문턱) ----------
  {
    const L = C.list(), E = nav.raw.e, pts = [];
    for (let k = 0; k < L.length; k++) { const i = L[k]; for (let d = 0; d < 4; d++) { const j = E[i * 4 + d]; if (j < 0 || inA[j] || nav.raw.mask[j] || Math.abs(NY[j] - NY[i]) > 0.6) continue;
      const x = (NX(i) + NX(j)) / 2, z = (NZ(i) + NZ(j)) / 2; if (!pts.some(p => Math.abs(p[0] - x) < 1.1 && Math.abs(p[2] - z) < 1.1)) pts.push([x, NY[i], z]); } }
    const cones = map.mk.many('cone', Math.max(1, Math.min(pts.length, 160)), { color: 0xff7a1a, glow: true });
    for (let k = 0; k < Math.min(pts.length, 160); k++) cones.set(k, pts[k][0], pts[k][1] + 0.02, pts[k][2], 0.7);
  }

  // ---------- 모양: 장난감 로봇(숨바꼭질과 같은 몸 · 모두 같은 민트 조끼) + 스캔 빛(바닥 부채꼴) ----------
  const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(0, 0, 0, 'YXZ'), _v = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color(), _n = new THREE.Vector3(), _nm = new THREE.Matrix3();
  const ZERO = new THREE.Matrix4().makeScale(0, 0, 0), GEOS = [], MATS = [];
  const SPH = new THREE.SphereGeometry(1, 14, 10), SPHS = new THREE.SphereGeometry(1, 8, 6), CYL = new THREE.CylinderGeometry(1, 1, 1, 12, 1);
  function bake(parts) {
    const pos = [], nor = [], cl = [];
    for (const [geo, p, sc, hex, r] of parts) {
      const g = geo.index ? geo.toNonIndexed() : geo, Pa = g.attributes.position, Na = g.attributes.normal;
      _m4.compose(_v.set(p[0], p[1], p[2]), _q.setFromEuler(_e.set(...(r || [0, 0, 0]))), _s.set(sc[0], sc[1], sc[2])); _nm.getNormalMatrix(_m4); _c.set(hex);
      for (let i = 0; i < Pa.count; i++) { _v.fromBufferAttribute(Pa, i).applyMatrix4(_m4); pos.push(_v.x, _v.y, _v.z); _n.fromBufferAttribute(Na, i).applyMatrix3(_nm).normalize(); nor.push(_n.x, _n.y, _n.z); cl.push(_c.r, _c.g, _c.b); }
      if (g !== geo) g.dispose();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3));
    GEOS.push(g); return g;
  }
  const lamV = (emi = 0x1a1a1a) => { const m = new THREE.MeshLambertMaterial({ vertexColors: true, emissive: emi }); MATS.push(m); return m; };
  function inst(geo, mat, n) { const m = new THREE.InstancedMesh(geo, mat, n); m.frustumCulled = false; for (let i = 0; i < n; i++) { m.setMatrixAt(i, ZERO); m.setColorAt(i, _c.set(0xffffff)); } map.add(m); return m; }
  const TB = 0xd6dee8;
  const bodyGeo = bake([
    [CYL, [0, 0.37, 0], [0.15, 0.1, 0.13], 0x5a6270], [SPH, [0, 0.55, 0], [0.19, 0.2, 0.16], TB],
    [SPH, [0, 1.0, 0], [0.3, 0.28, 0.28], TB], [SPHS, [0, 1.0, 0.13], [0.23, 0.17, 0.16], 0x243249],
    [SPHS, [-0.085, 1.02, 0.28], [0.045, 0.058, 0.02], 0x9ff4ff], [SPHS, [0.085, 1.02, 0.28], [0.045, 0.058, 0.02], 0x9ff4ff], [SPHS, [0, 0.935, 0.283], [0.06, 0.016, 0.012], 0x9ff4ff],
    [SPHS, [-0.3, 1.0, 0], [0.045, 0.08, 0.08], 0xb0bac5], [SPHS, [0.3, 1.0, 0], [0.045, 0.08, 0.08], 0xb0bac5],
    [CYL, [0, 1.33, -0.02], [0.012, 0.1, 0.012], 0x9aa3ad], [SPHS, [0, 1.39, -0.02], [0.035, 0.035, 0.035], 0xffd23c]]);
  const bibGeo = bake([[SPH, [0, 0.555, 0], [0.205, 0.17, 0.175], 0xffffff], [SPHS, [0, 1.1, -0.01], [0.31, 0.2, 0.3], 0xffffff], [CYL, [0, 1.14, 0.2], [0.19, 0.025, 0.13], 0xffffff]]);
  const legGeo = bake([[CYL, [0, -0.15, 0], [0.068, 0.26, 0.068], 0x5a6270], [SPHS, [0, -0.3, 0.04], [0.085, 0.055, 0.12], 0xf6f6f2]]);
  const armGeo = bake([[SPHS, [0, -0.12, 0], [0.058, 0.14, 0.058], TB], [SPHS, [0, -0.25, 0], [0.052, 0.052, 0.052], 0xeef2f6]]);
  [SPH, SPHS, CYL].forEach(g => g.dispose());
  const M = { body: inst(bodyGeo, lamV(0x262626), NA), bib: inst(bibGeo, lamV(0x202020), NA), leg: inst(legGeo, lamV(), NA * 2), arm: inst(armGeo, lamV(0x202020), NA * 2) };
  const scanGeo = new THREE.CircleGeometry(1.25, 12, Math.PI / 2 - 0.45, 0.9).rotateX(-Math.PI / 2); GEOS.push(scanGeo);
  const scanMat = new THREE.MeshBasicMaterial({ color: 0x7df9ff, transparent: true, opacity: 0.4, depthWrite: false, side: THREE.DoubleSide, fog: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }); MATS.push(scanMat);
  const SCAN = new THREE.InstancedMesh(scanGeo, scanMat, NA); SCAN.frustumCulled = false; SCAN.renderOrder = 2; for (let i = 0; i < NA; i++) SCAN.setMatrixAt(i, ZERO); map.add(SCAN);
  // 고른 로봇 고리(반장) · 표(❓ 의심 · ✓ 진짜 로봇 · ! 잡힌 스파이) · 이름표
  const ringGeo = new THREE.RingGeometry(0.5, 0.68, 28).rotateX(-Math.PI / 2); GEOS.push(ringGeo);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xffd23c, transparent: true, opacity: 0.95, depthTest: false, depthWrite: false, side: THREE.DoubleSide, fog: false }); MATS.push(ringMat);
  const RING = new THREE.Mesh(ringGeo, ringMat); RING.renderOrder = 6; RING.visible = false; map.add(RING);
  const hovMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75, depthTest: false, depthWrite: false, side: THREE.DoubleSide, fog: false }); MATS.push(hovMat);
  const HRING = new THREE.Mesh(ringGeo, hovMat); HRING.renderOrder = 6; HRING.visible = false; map.add(HRING);   // 마우스를 올린 로봇(RB-2 — 누를 수 있다는 표시)
  // UX-2(10-05 교사 편의성): 스파이가 미션 자리 가까이 오면 다이아몬드·빛기둥(몸 높이에서 카메라를 가림) 대신 바닥 노란 고리 = 여기 서요
  const mrMat = new THREE.MeshBasicMaterial({ color: 0xffd23c, transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide, fog: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }); MATS.push(mrMat);
  const MRING = new THREE.Mesh(ringGeo, mrMat); MRING.renderOrder = 3; MRING.visible = false; map.add(MRING);
  // UX-3: 결과·잡힘 = 스파이 발밑 빨간 고리(하늘에서 작은 점이라 안 보이던 것 · 화면 지름 ≥40px) — 한 메시(드로우콜 +1)
  const rvMat = new THREE.MeshBasicMaterial({ color: RED, transparent: true, opacity: 0.95, depthTest: false, depthWrite: false, side: THREE.DoubleSide, fog: false }); MATS.push(rvMat);
  const RVR = new THREE.InstancedMesh(ringGeo, rvMat, SMAX); RVR.renderOrder = 6; RVR.frustumCulled = false; for (let i = 0; i < SMAX; i++) RVR.setMatrixAt(i, ZERO); map.add(RVR);
  let hov = -1, hovXY = null;
  const onHover = e => { if (e.pointerType !== 'mouse') return; hovXY = [e.clientX, e.clientY]; };
  addEventListener('pointermove', onHover);
  const TEX = new Map();
  function texOf(key, draw) { let t = TEX.get(key); if (t) return t; const c = document.createElement('canvas'); c.width = 256; c.height = 64; draw(c.getContext('2d')); t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; TEX.set(key, t); return t; }
  const badge = (txt, bg) => texOf('b' + txt + bg, g => { g.fillStyle = bg; g.beginPath(); g.roundRect(4, 6, 248, 52, 22); g.fill(); g.fillStyle = '#fff'; g.font = '800 32px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt.slice(0, 9), 128, 34); });
  const SPR = [];   // 이 프레임에 쓸 스프라이트(필요한 만큼 늘림 · 남는 건 숨김)
  let sprN = 0, sprMpp = 0;   // sprMpp = 하늘 보기에서 화면 1px = 몇 m(UX-1 — 고리를 화면 크기로) · 3인칭 = 0
  function spr(tex, x, y, z, w = 1.3) {   // 3인칭(스파이) 머리 위 표
    let s = SPR[sprN]; if (!s) { s = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false, depthTest: false })); s.renderOrder = 7; map.add(s); SPR.push(s); MATS.push(s.material); }
    sprN++; if (s.material.map !== tex) { s.material.map = tex; s.material.needsUpdate = true; } s.scale.set(w, w * 0.25, 1); s.position.set(x, y, z); s.visible = true; return s;
  }
  // UX-1(10-05 교사 편의성): 하늘 보기(반장·구경)의 표(❓ 의심 · ✓ 로봇 · 📸 이름 · 🤝)는 글자 판(DOM) — 늘 13px 글자 · 방 이름표(DOM)보다 위라 가려지지 않음
  //   (스프라이트를 화면 크기로 키워도 방 이름표가 그 위를 덮어 읽히지 않았음 — 시험 사진) · 프레임마다 transform만 바꿈(쓸 때만 글자)
  const tagBox = document.createElement('div'); tagBox.className = 'rb-tags'; document.body.appendChild(tagBox);
  const TAGS = []; let tagN = 0;
  function tag(txt, bg, x, y, z, rpx) {
    let t = TAGS[tagN]; if (!t) { t = { el: document.createElement('div'), txt: '', bg: '', on: false, px: 0, py: 0 }; t.el.className = 'rb-tag'; tagBox.appendChild(t.el); TAGS.push(t); } tagN++;
    _v.set(x, y, z).project(map.camera); if (_v.z > 1) { if (t.on) { t.on = false; t.el.style.display = 'none'; } return; }
    if (t.txt !== txt || t.bg !== bg) { t.txt = txt; t.bg = bg; t.el.textContent = txt; t.el.style.background = bg; }
    const px = Math.round((_v.x + 1) / 2 * innerWidth), py = Math.round((1 - _v.y) / 2 * innerHeight - rpx - 3);   // 로봇 바로 위(몸을 덮지 않게)
    if (t.px !== px || t.py !== py) { t.px = px; t.py = py; t.el.style.transform = 'translate(' + px + 'px,' + py + 'px) translate(-50%,-100%)'; } if (!t.on) { t.on = true; t.el.style.display = ''; }
  }
  function bdg(q, RSv, txt, bg, w) { if (sprMpp) tag(txt, bg, q.x, q.y + 1.2 * RSv, q.z, 0.33 * RSv / sprMpp); else spr(badge(txt, bg), q.x, q.y + 1.72 * RSv, q.z, w); }   // 하늘 보기 = 글자 판 · 3인칭 = 스프라이트
  function tagsEnd() { for (let i = tagN; i < TAGS.length; i++) if (TAGS[i].on) { TAGS[i].on = false; TAGS[i].el.style.display = 'none'; } }
  // 신호 구역 바닥 칠(반장·구경만) — 방마다 판 하나(보통은 숨김)
  const AREA_PL = [], AREA_C = [], AREA_NM = ['nurse', 'library', 'teachers', 'cafeteria'];   // AREA_C[a] = 그 구역에서 가장 큰 방 판 가운데(UX-5 — 신호 이름표 자리)
  {   // UX-5: 바탕이 늘 보이므로 구역마다 한 메시(방 판들을 합침 — 드로우콜 +4만 · 예전 = 방마다 판 하나 ≈20)
    const RECT = [[], [], [], []];
    const add = (a, x0, x1, z0, z1, room) => { RECT[a].push([x0, x1, z0, z1]);
      const ar = (x1 - x0) * (z1 - z0) + (room ? 1e4 : 0) + (room === AREA_NM[a] ? 1e6 : 0); if (!AREA_C[a] || ar > AREA_C[a].ar) AREA_C[a] = { x: (x0 + x1) / 2, z: (z0 + z1) / 2, ar }; };   // 구역 이름의 방(보건실·도서실·교무실·급식실) → 가장 큰 방 → 복도 조각
    for (const z of C.ZL) { if (z.id === 'corridor-main') continue; const a = AREA_Z[z.id]; if (a != null) add(a, z.x0, z.x1, z.z0, z.z1, z.id); }
    const cm = C.ZL.find(z => z.id === 'corridor-main'); if (cm) { add(0, cm.x0, -24, cm.z0, cm.z1); add(1, -24, -7, cm.z0, cm.z1); add(2, -7, AX1, cm.z0, cm.z1); }
    for (let a = 0; a < 4; a++) { if (!RECT[a].length) continue; const pos = [], Y9 = 0.09;
      for (const [x0, x1, z0, z1] of RECT[a]) pos.push(x0, Y9, z0, x0, Y9, z1, x1, Y9, z1, x0, Y9, z0, x1, Y9, z1, x1, Y9, z0);   // 위를 보는 두 세모
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); GEOS.push(g);
      const m = new THREE.MeshBasicMaterial({ color: AREAS[a].c, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide, fog: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }); MATS.push(m);
      const o = new THREE.Mesh(g, m); o.visible = false; o.renderOrder = 1; map.add(o); AREA_PL.push({ a, o, m }); }
  }
  let areaT = 0, areaA = -1, areaMk = false;
  // UX-5(10-05 교사 편의성): 반장·구경 = 신호 구역 넷을 늘 옅게(A_BASE) 칠해 둠 → 신호가 오면 그 구역만 진하게 깜빡(3.2초) → 조금 진하게(4.8초) → 다시 바탕
  //   바탕 0.07은 하늘 보기에서 거의 안 보여(시험 사진) 0.12 · 남김 0.22 · 깜빡 0.3~0.5
  const A_BASE = 0.12;
  function areaBase(on) { for (const p of AREA_PL) { p.o.visible = on; p.m.opacity = A_BASE; } }
  function areaFlash(a) { areaA = a; areaT = 8; for (const p of AREA_PL) { p.o.visible = true; p.m.opacity = A_BASE; } }

  // ---------- 상태 ----------
  //   R = 한 판 { seq, t0(시계 ms), lvl, seed, guard: {kind, pid, name}, spies: [{kind, pid, name}], round, rounds }
  //   E[e] = 그릴 몸(로봇 0..K-1 · 스파이 K..K+S-1): { x, y, z, h(목표), hr(그린 방향), scan, walk, ox, oz }
  //   SP[s] = 스파이 { s, e, kind, pid, name, alive, ms(미션 물건 3), done(Set), x, y, z, h, scan, ... }
  let topRole = null;   // 지금 열린 하늘 보기가 누구 것인지(반장 = 로봇 누르기 · 구경 = 보기만)
  let R = null, ROB = [], SP = [], E = [], ME = { role: null, s: -1 }, phase = 'off', T = 0, shots = 0, done = 0, playT = 50, finT = null, res = null, matchEnd = false, tNow = -9;
  let sel = -1, sus = new Set(), okR = new Set(), sigLog = [], sigQ = [], beacons = [], GB = null, gbHist = [], gbRecent = [], gbDecT = 1e9, gbShotT = 0;
  // RANK-1(10-05 교사 '여러 판에 걸쳐 하는 것은 그 판 안에서 순위 비교'): 경기 순위표(친구 대결만) — 모두 한 번 반장 + 나머지 판은 스파이
  //   줄 = 사람(pid) { m: ⭐ 미션 · sv: 안 들킨 판 · sr: 스파이 판 · g: 📸 찾은 스파이 · gw: 반장으로 이긴 판 · gr: 반장 판 }
  //   점수 = 🤖 ⭐ 하나 10 + 안 들키면 10 · 🕵️ 찾은 스파이 한 명 20 + 반장이 이기면 20
  //   (시뮬레이션 lvl 0 · 판마다 스파이 1/2/3/4/5/7명: 반장 한 판 ≈ 19/26/35/41/40/58점 · 스파이 한 판 ≈ 30/28/31/32/32/31점 → 반장 판 = 스파이 판의 0.6~1.9배 · 한 경기 합의 20~40%)
  const RK = !NETM ? null : createStandings(map, {
    id: 'rb', title: '로봇인 척', unit: '점', rule: '점수 = 🤖 스파이일 때 ⭐ 하나 10 + 안 들키면 10 · 🕵️ 반장일 때 찾은 스파이 한 명 20 + 반장이 이기면 20',
    init: () => ({ m: 0, sv: 0, sr: 0, g: 0, gw: 0, gr: 0 }), pts: r => r.m * 10 + r.sv * 10 + r.g * 20 + r.gw * 20,
    tie: (a, b) => b.m - a.m || b.g - a.g, me: () => NM.pid,
    cols: [{ h: '🕵️ 반장일 때', f: r => r.gr ? '📸 ' + r.g + '명 찾음' + (r.gw ? '<br>🏆 이김' : '') : turnOf(r.id) === 'now' ? '🕵️ 지금 반장' : '<span style="color:#8a97a8">⏳ 아직</span>' },
      { h: '🤖 스파이일 때', f: r => r.sr ? '⭐ ' + r.m + '개<br>안 들킴 ' + r.sv + '/' + r.sr + '판' : '<span style="color:#8a97a8">-</span>' }],
    progress: () => (R && R.rounds ? (R.round + 1) + '판 / ' + R.rounds + '판' : ''),
    turns: () => { const P = NM.D.p || {}, ids = Object.keys(P).filter(id => P[id] && typeof P[id].tm === 'number').sort((a, b) => (P[a].tm === 99 ? 99 : P[a].tm % 100) - (P[b].tm === 99 ? 99 : P[b].tm % 100));
      if (!ids.length) return '';
      return '🕵️ 반장 차례: ' + ids.map(id => { const t = turnOf(id), nm = id === NM.pid ? '<b>나</b>' : esc(P[id].n); return t === 'done' ? '✔' + nm : t === 'now' ? '<b style="color:#c2410c">▶' + nm + '</b>' : t === 'late' ? '⏳' + nm : nm; }).join(' · ')
        + '<br><span style="font-size:12px">✔ 했어요 · ▶ 지금 · 모두 한 번씩 반장</span>'; },
    foot: (L) => { const d = L.filter(q => q.r.g).sort((a, b) => b.r.g - a.r.g || b.r.gw - a.r.gw)[0], a = L.filter(q => q.r.m).sort((x, y) => y.r.m - x.r.m || y.r.sv - x.r.sv)[0];
      return '🕵️ 명탐정 ' + (d ? '<b>' + esc(d.r.n) + '</b>(스파이 ' + d.r.g + '명)' : '-') + ' · 🤖 연기왕 ' + (a ? '<b>' + esc(a.r.n) + '</b>(⭐ ' + a.r.m + '개)' : '-'); },
  });
  function turnOf(id) { const p = (NM.D.p || {})[id]; if (!p || typeof p.tm !== 'number') return ''; if (p.tm === 99) return 'late'; if (p.tm % 1000 >= 100) return 'now'; return p.tm >= 1000 ? 'done' : ''; }
  const clock = () => (NETM ? sNow() : Date.now());
  let pauseAt = 0, quitOpen = false;   // QA-1(10-10): 혼자 = 멈춤(P)·'그만할까요?' 창 동안 시계·로봇·반장 눈길 모두 멈춤(숨바꼭질과 같게)
  const o1 = {};
  let chipK = {}; const chip = (k, t, o) => { if (chipK[k] === t) return; chipK[k] = t; map.hud.chip(k, t, o); };

  // ---------- 화면 조각 ----------
  const css = document.createElement('style'); css.textContent = `
.rb-btn{position:fixed;z-index:24;display:none;flex-direction:column;align-items:center;justify-content:center;font:800 12px/1.1 system-ui,-apple-system,"Malgun Gothic",sans-serif;color:#fff;border:3px solid rgba(255,255,255,.92);box-shadow:0 3px 0 rgba(0,0,0,.2);touch-action:none;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;cursor:pointer}
.rb-btn b{font-size:28px;line-height:1}
.rb-gp{position:fixed;left:50%;bottom:calc(76px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:24;display:none;gap:10px;align-items:center;padding:8px 10px;border-radius:16px;background:rgba(18,28,48,.86);color:#fff;font:800 14px/1.2 system-ui,-apple-system,"Malgun Gothic",sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.3)}
.rb-gp button{font:inherit;border:0;border-radius:12px;padding:10px 14px;min-height:44px;cursor:pointer;color:#1d3557;background:#e8edf3}
.rb-gp button.shot{background:#ffd23c;font-size:16px}
.rb-gp button:disabled{opacity:.45;cursor:default}
.rb-gp .t{max-width:210px;font-size:13px;opacity:.9}
.rb-log{position:fixed;left:calc(12px + env(safe-area-inset-left));top:120px;z-index:23;display:none;min-width:150px;max-width:230px;padding:8px 10px;border-radius:12px;background:rgba(18,28,48,.82);color:#fff;font:700 13px/1.45 system-ui,-apple-system,"Malgun Gothic",sans-serif;pointer-events:none}
.rb-log i{display:inline-block;width:11px;height:11px;border-radius:50%;margin-right:5px;vertical-align:-1px}
.rb-log .new{animation:rbnew 1s ease 2}
@keyframes rbnew{50%{background:rgba(255,210,60,.35)}}
.rb-meter{position:fixed;left:50%;top:calc(96px + env(safe-area-inset-top));transform:translateX(-50%);z-index:23;display:none;padding:5px 10px;border-radius:10px;background:rgba(18,28,48,.8);color:#fff;font:800 13px/1 system-ui,-apple-system,"Malgun Gothic",sans-serif;pointer-events:none}
.rb-meter u{display:inline-block;width:120px;height:9px;margin-left:7px;border-radius:5px;background:rgba(255,255,255,.25);overflow:hidden;vertical-align:0;text-decoration:none}
.rb-meter u s{display:block;height:100%;width:0;background:#5fd068;transition:width .25s}
.rb-how{position:fixed;inset:0;z-index:45;display:flex;align-items:center;justify-content:center;background:rgba(10,20,40,.55);font-family:system-ui,-apple-system,"Malgun Gothic",sans-serif}
.rb-how .bx{width:min(560px,92vw);max-height:90vh;overflow:auto;box-sizing:border-box;padding:16px 18px;border-radius:18px;background:#fffdf6;color:#1d3557;border:3px solid #1d3557;box-shadow:0 10px 30px rgba(0,0,0,.35)}
.rb-how h3{margin:0 0 10px;font-size:22px}
.rb-how .st{display:flex;gap:12px;align-items:center;margin:8px 0;padding:8px 10px;border-radius:12px;background:#eef4ff;font-size:17px;line-height:1.4}
.rb-how .st b.n{flex:none;width:46px;height:46px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;font-size:28px;box-shadow:0 1px 4px rgba(0,0,0,.15)}
.rb-how .tip{margin-top:8px;padding:8px 10px;border-radius:10px;background:#fff3bf;font-size:15px;font-weight:700}
.rb-how button{display:block;margin:12px 0 0 auto;font:inherit;font-size:18px;font-weight:900;border:0;border-radius:12px;padding:10px 22px;min-height:44px;background:#1d3557;color:#fff;cursor:pointer}
.rb-how .auto{margin-top:10px;text-align:right;font-size:14px;color:#5a6b80;font-weight:700}
body.small .rb-how .bx{padding:10px 12px}
body.small .rb-how h3{font-size:17px;margin-bottom:4px}
body.small .rb-how .st{font-size:14px;margin:4px 0;padding:5px 8px}
body.small .rb-how .st b.n{width:34px;height:34px;font-size:20px}
body.small .rb-log{top:calc(88px + env(safe-area-inset-top));font-size:12px;max-width:170px;min-width:0;padding:6px 8px}
body.rb-spy #tJump,body.rb-spy #tAct{display:none!important}
body.rb-spy .rb-btn.scan{right:calc(18px + env(safe-area-inset-right));bottom:calc(18px + env(safe-area-inset-bottom));width:78px;height:78px}
body.small.rb-spy .rb-btn.scan{right:calc(12px + env(safe-area-inset-right));bottom:calc(12px + env(safe-area-inset-bottom));width:70px;height:70px}
body.small .rb-gp{bottom:calc(64px + env(safe-area-inset-bottom));padding:6px}
body.small .rb-gp .t{display:none}
.rb-btn.scan.hot{background:#ffd23c!important;color:#1d3557;animation:rbhot .9s ease-in-out infinite}
@keyframes rbhot{50%{transform:scale(1.1)}}
.rb-btn.scan.dim{opacity:.55}
.rb-log .lg{margin-top:2px;font-size:12px;opacity:.95}
.rb-log .lg div{display:inline-block;margin-right:8px;white-space:nowrap}
.rb-tags{position:fixed;inset:0;z-index:17;pointer-events:none;overflow:hidden}
.rb-tag{position:absolute;left:0;top:0;white-space:nowrap;font:800 13px/1 system-ui,-apple-system,"Malgun Gothic",sans-serif;color:#fff;padding:5px 9px;border-radius:999px;border:2px solid rgba(255,255,255,.9);box-shadow:0 2px 6px rgba(0,0,0,.3)}
body.small .rb-tag{font-size:12px;padding:4px 7px}
body.small .rb-how button{position:sticky;bottom:0;margin-top:6px;box-shadow:0 -6px 10px #fffdf6}
body.small .rb-how .tip{font-size:13px;margin-top:4px;padding:6px 8px}
body.small.rb-spy .rb-meter{left:calc(12px + env(safe-area-inset-left));top:calc(88px + env(safe-area-inset-top));transform:none;font-size:12px}
body.small .rb-meter u{width:70px}
body.rb-top #tv-bar button.go{display:none}
body.rb-top #tv-lb .lb:not(.mk){opacity:.6}
`; document.head.appendChild(css);   // UX-9 📡 단추 할 일 표시 · UX-13 휴대폰 눈길 막대 = 왼쪽 위(알림 자리 피함) · UX-12 반장 화면 '🚶 걸어 다니기'(= 그만하기) 숨김 — 그만하기는 ■ 칩·Esc · UX-14 방 이름표 옅게(로봇 서는 곳이 보이게)
  const scanBtn = document.createElement('div'); scanBtn.className = 'rb-btn scan';   // 터치 = 점프 단추 자리(로봇은 점프 없음 — 스파이 판 동안 점프·✋ 숨김)
  scanBtn.style.cssText = 'right:calc(22px + env(safe-area-inset-right));bottom:calc(' + (coarse ? 24 : 96) + 'px + env(safe-area-inset-bottom));width:80px;height:80px;border-radius:50%;background:rgba(47,135,200,.92)';
  scanBtn.innerHTML = '<b>📡</b><span>' + (coarse ? '스캔' : '스캔 E') + '</span>';
  scanBtn.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); scanStart(); });
  document.body.appendChild(scanBtn);
  const gp = document.createElement('div'); gp.className = 'rb-gp ttl-keep';
  gp.innerHTML = '<span class="t"></span><button data-g="sus" type="button">❓ 의심' + (coarse ? '' : ' R') + '</button><button data-g="shot" class="shot" type="button">📸 확인' + (coarse ? '' : ' F') + '</button>';
  gp.addEventListener('pointerdown', e => { e.stopPropagation(); }); gp.addEventListener('click', e => { e.stopPropagation(); const b = e.target.closest('[data-g]'); if (!b) return; if (b.dataset.g === 'sus') toggleSus(); else shoot(); });
  document.body.appendChild(gp);
  const logEl = document.createElement('div'); logEl.className = 'rb-log'; document.body.appendChild(logEl);
  const meterEl = document.createElement('div'); meterEl.className = 'rb-meter'; meterEl.innerHTML = '📹 반장 눈길<u><s></s></u>'; document.body.appendChild(meterEl);
  let cardEl = null, cardT = 0;
  function card(html, sec = 3, pos) {   // pos 'bottom' = 아래(UX-3 — 하늘 보기 결과: 지도 가운데·빨간 고리를 덮지 않게)
    if (!cardEl) { cardEl = document.createElement('div'); cardEl.className = 'rb-card ttl-keep'; cardEl.style.cssText = 'position:fixed;left:50%;top:20%;transform:translateX(-50%);z-index:30;max-width:min(540px,92vw);box-sizing:border-box;padding:10px 16px;border-radius:14px;background:rgba(18,28,48,.9);color:#fff;font:700 clamp(14px,2.6vw,18px)/1.5 system-ui,-apple-system,"Malgun Gothic",sans-serif;text-align:center;pointer-events:none;box-shadow:0 6px 20px rgba(0,0,0,.3)'; document.body.appendChild(cardEl); }
    if (pos === 'bottom') { cardEl.style.top = 'auto'; cardEl.style.bottom = 'calc(84px + env(safe-area-inset-bottom))'; } else { cardEl.style.top = '20%'; cardEl.style.bottom = 'auto'; }
    cardEl.innerHTML = html; cardEl.style.display = ''; clearTimeout(cardT); cardT = setTimeout(() => { if (cardEl) cardEl.style.display = 'none'; }, sec * 1000);
  }
  function paintGP() {
    if (ME.role !== 'guard' || phase !== 'play') { gp.style.display = 'none'; return; } gp.style.display = 'flex';
    const sb = gp.querySelector('[data-g=shot]'), qb = gp.querySelector('[data-g=sus]'), t = gp.querySelector('.t'), ok = sel >= 0 && !okR.has(sel) && !isCaught(sel);
    sb.disabled = !ok || shots <= 0; qb.disabled = !ok; sb.lastChild && (sb.textContent = '📸 확인' + (coarse ? '' : ' F') + ' · ' + shots);
    t.textContent = shots <= 0 ? '📸를 다 썼어요 — 시간까지 버텨요' : sel >= 0 ? (okR.has(sel) ? '✓ 진짜 로봇이었어요' : '고른 로봇 — 스파이 같으면 📸') : '로봇을 눌러 고르기';
  }
  let logH = '';   // UX-7: 글이 바뀔 때만 다시 그림(1초에 한 번쯤)
  function paintLog() {
    if (!(ME.role === 'guard' || ME.role === 'watch') || phase === 'off') { logEl.style.display = 'none'; return; } logEl.style.display = 'block';
    const small = document.body.classList.contains('small');
    // UX-7(10-05 교사 편의성): 시각 = '방금 / n초 전'(⏱ 칩은 남은 시간이라 '0:10'이 거꾸로 읽히던 것) · UX-5: 빈 칸 = 색-구역 범례(휴대폰도)
    const leg = '<div class="lg">' + AREAS.map(A => '<div><i style="background:' + A.css + '"></i>' + (small ? A.n : A.cn + ' = ' + A.n) + '</div>').join('') + '</div>';
    const h = '<div style="font-weight:900">📡 신호 ' + sigLog.length + '번</div>' + (sigLog.length ? sigLog.slice(small ? -3 : -6).reverse().map((q, i) => { const ago = Math.max(0, Math.round(tNow - q.t)); return '<div' + (i === 0 && ago < 3 ? ' class="new"' : '') + '><i style="background:' + AREAS[q.a].css + '"></i>' + (ago < 3 ? '방금' : ago + '초 전') + ' ' + AREAS[q.a].cn + ' · ' + AREAS[q.a].n + '</div>'; }).join('')
      : '<div style="opacity:.8">' + (small ? '바닥 색 = 신호 구역' : '아직 없어요 — 미션을 하면 그 바닥 색 구역이 깜빡여요') + '</div>' + leg);
    if (h !== logH) { logH = h; logEl.innerHTML = h; }
  }
  const isCaught = e => e >= K && SP[e - K] && !SP[e - K].alive;

  // ---------- 하는 법(RB-2 · 10-05 교사 '딱 보고 어떻게 하는 거지 싶었어') — 그림 세 줄 + 시작 단추(혼자) · 친구 대결은 준비 시간 동안(처음 맡는 역할만) ----------
  const seenHow = new Set(); let howEl = null;
  function howHtml(role, S, T, shots) {
    const st = (i, t) => '<div class="st"><b class="n">' + i + '</b><span>' + t + '</span></div>';
    return role === 'guard'
      ? '<h3>🕵️ CCTV 반장 하는 법</h3>' + st('🤖', '로봇 ' + K + '대 중 <b>' + S + '대</b>는 로봇인 척하는 <b>친구(스파이)</b>예요') + st('📡', '스파이가 미션을 하면 그 <b>구역(바닥 색 넷)이 깜빡여요</b> — 그 구역 로봇을 지켜봐요')
        + st('👆', '수상한 로봇을 <b>눌러 고르고 📸 확인</b>' + (coarse ? '' : '(F)') + ' — 기회 <b>' + shots + '번</b> · 진짜 로봇을 찍으면 <b>기회 1번이 없어져요</b>')
        + '<div class="tip">❓ 의심' + (coarse ? '' : '(R)') + ' = 표시만 해 둬요(기회 안 써요)<br>🔎 수상한 로봇 = 갑자기 멈칫 · 두리번거림 · 아무것도 없는 데서 서 있기 · 갑자기 뒤돌기<br>스파이 팀이 ⭐ ' + T + '개를 모으기 전에 모두 찾으면 승리!</div>'
      : '<h3>🤖 스파이 하는 법</h3>' + st('🕵️', '반장이 하늘에서 <b>CCTV로 지켜봐요</b> — 너는 로봇 옷을 입은 스파이') + st('✨', '<b>노란 빛기둥 3곳</b> = 내 미션 → 그 앞에서 <b>' + (coarse ? '📡 스캔 단추' : 'E') + '</b>(2.5초 가만히)')
        + st('🚶', '들키지 않게 <b>로봇처럼</b>: 같은 빠르기로 똑바로 · 물건 앞에서만 멈추고 스캔 · 두리번 ✗')
        + '<div class="tip">팀 ⭐ ' + T + '개를 모으면 스파이 승리! · 지금 할 일은 화면 위 줄에 나와요<br>🤖 미션이 아닌 물건 앞에서 ' + (coarse ? '📡' : 'E') + ' = 로봇인 척 스캔(속이기)' + (NETM ? '' : ' · 📹 반장 눈길 막대가 빨개지면 위험!') + '</div>';
  }
  function howTo(role, S, T, shots, wait) {   // wait = 혼자(▶ 시작을 누를 때까지) · 아니면 준비 시간 동안만 띄움
    howClose(); seenHow.add(role); document.exitPointerLock?.();
    howEl = document.createElement('div'); howEl.className = 'rb-how ttl-keep';
    howEl.innerHTML = '<div class="bx">' + howHtml(role, S, T, shots) + (wait ? '<button type="button">▶ 시작!</button>' : '<div class="auto">⏱ 곧 시작해요 — 읽어 보세요</div>') + '</div>';
    for (const t of ['keydown', 'keyup']) howEl.addEventListener(t, e => e.stopPropagation());
    document.body.appendChild(howEl);
    if (!wait) return Promise.resolve();
    return new Promise(res => { const go = () => { removeEventListener('keydown', kk, true); howClose(); res(); }, kk = e => { if (e.code === 'Enter' || e.code === 'Space' || e.code === 'NumpadEnter') { e.preventDefault(); e.stopPropagation(); go(); } };
      howEl.querySelector('button').addEventListener('click', e => { e.stopPropagation(); go(); }); addEventListener('keydown', kk, true); });
  }
  function howClose() { if (howEl) { howEl.remove(); howEl = null; } }
  // 지금 할 일(화면 위 목표 줄 · 바뀔 때만)
  let coachK = '';
  function nearMission() { const q = SP[ME.s]; if (!q) return -1; for (let i = 0; i < q.ms.length; i++) if (!q.done.has(i) && Math.hypot(PO[q.ms[i]].sx - q.x, PO[q.ms[i]].sz - q.z) < cfg.near) return i; return -1; }
  function coach() {
    let t = '';
    if (phase === 'count') t = ME.role === 'guard' ? '🕵️ 곧 시작 — 로봇들이 움직이기 시작하면 잘 지켜봐요' : ME.role === 'spy' ? '🤖 곧 시작 — 미니맵 별·노란 빛기둥 = 내 미션 자리' : '👀 구경 — 다음 판부터 같이 해요';
    else if (phase === 'play') {
      if (ME.role === 'guard') {   // UX-6(10-05 교사 편의성): 새 신호(4초 안)가 고른 로봇보다 먼저
        const last = sigLog[sigLog.length - 1], fresh = last && tNow - last.t < 4, hasSel = sel >= 0 && !okR.has(sel) && !isCaught(sel);
        if (shots <= 0) t = '📸를 다 썼어요 — 시간이 끝날 때까지 버티면 반장 승리';
        else if (fresh) t = '📡 ' + AREAS[last.a].cn + ' 구역(' + AREAS[last.a].n + ') 신호! ' + (hasSel ? '고른 로봇이 거기 있으면 📸 확인' + (coarse ? '' : '(F)') : '그 구역에서 수상한 로봇을 눌러요');
        else if (hasSel) t = '📸 이 로봇이 스파이 같으면 확인' + (coarse ? '' : '(F)') + ' — 남은 기회 ' + shots + '번';
        else if (last && tNow - last.t < 8) t = '📡 ' + AREAS[last.a].cn + ' 구역(' + AREAS[last.a].n + ')에서 신호! 그 구역에서 수상한 로봇을 눌러요';
        else t = '👀 로봇을 지켜봐요 — 멈칫·두리번·뒤돌기 하는 로봇이 스파이일 수 있어요'; }
      else if (ME.role === 'spy') { const q = SP[ME.s], ni0 = q && q.alive && scanT <= 0 ? nearMission() : -1;
        if (!q || !q.alive) t = '📸 들켰어요 — 하늘에서 친구들을 응원해요';
        else if (scanT > 0) t = scanMis >= 0 ? '📡 미션 스캔 중 — 가만히! (2.5초)' : '📡 로봇인 척 삐빅(미션 아님) — 가만히!';   // UX-10
        else if (ni0 >= 0) t = '📡 ' + (ni0 + 1) + ' ' + C.ZL[PO[q.ms[ni0]].zi].label + ' 미션 자리예요! ' + (coarse ? '📡 단추' : 'E') + '를 눌러 스캔(2.5초 가만히)';
        else if (q.done.size >= q.ms.length) t = '🎉 내 미션 끝! 로봇처럼 돌아다니며 버텨요 (팀 ⭐ ' + done + '/' + T + ')';
        else { let d = 1e9, ni = -1; q.ms.forEach((p, i) => { if (q.done.has(i)) return; const dd = Math.hypot(PO[p].sx - q.x, PO[p].sz - q.z); if (dd < d) { d = dd; ni = i; } });   // UX-4: 갈 곳(번호·방)을 맨 앞에 — 휴대폰 말줄임에도 남게 · 번호 = 🎯 칩·미니맵 별과 같은 번호
          t = '🎯 ' + (ni + 1) + ' ' + C.ZL[PO[q.ms[ni]].zi].label + ' 빛기둥까지 ' + Math.round(d) + 'm — 똑바로 걷고 물건 앞에서만 멈춰요'; } }
      else if (ME.caught) t = SP.some(s => s.alive) ? '📸 들켰어요 — 🤝 친구 스파이가 ⭐ ' + done + '/' + T + ' 모으는지 지켜봐요' : '📸 들켰어요 — 결과를 기다려요';   // UX-11
      else t = '👀 구경 중 — 다음 판부터 같이 해요';
    } else if (phase === 'res') t = res ? (res.spyWin ? '🤖 스파이 팀 승리!' : '🕵️ 반장 승리!') : '🏁 끝';
    if (t !== coachK) { coachK = t; map.hud.goal(t); }
  }

  // ---------- 한 판 꾸리기 ----------
  function beginRound(r) {
    endRoundUI(); R = r; phase = 'count'; finT = null; res = null; chipK = {}; done = 0; tNow = -cfg.count;
    const S = r.spies.length; T = goalOf(S, r.lvl || 0); shots = shotsOf(S); playT = playOf(S, r.lvl || 0);
    const PL = C.plan(r.seed, S, cfg.missions), wz = C.weights(PL.map(q => q.ms));
    ROB = C.startRobots(r.seed, wz, PL.map(q => q.st));   // UX-8: 스파이 출발 자리 1.5m 안 로봇은 다른 물건에서
    E = []; for (let e = 0; e < K + S; e++) E.push({ x: 0, y: 0, z: 0, h: 0, hr: null, scan: false, walk: 0, ox: null, oz: null });
    SP = r.spies.map((q, s) => { const P = PO[PL[s].st]; return { s, e: K + s, kind: q.kind, pid: q.pid || null, name: q.name, alive: true, ms: PL[s].ms.slice(), done: new Set(), x: P.sx, y: P.sy, z: P.sz, h: C.hdg(P.x - P.sx, P.z - P.sz), scan: false, mis: 0, b: null, net: null, nts: 0, nt: 0, nvx: 0, nvz: 0, st0: PL[s].st }; });
    sel = -1; sus = new Set(); okR = new Set(); sigLog = []; sigQ = []; GB = null; gbHist = []; gbRecent = []; gbDecT = 1e9; gbShotT = 0;
    const meS = SP.find(q => q.kind === 'me'); ME = { role: r.guard.kind === 'me' ? 'guard' : meS ? 'spy' : 'watch', s: meS ? meS.s : -1 };
    if (!NETM || NM.host) { if (r.guard.kind === 'bot') GB = createGuardBot(cfg, rng); for (const q of SP) if (q.kind === 'bot') sbInit(q); }
    map.player.freeze(true); map.player.run(false); map.player.jump(false);
    if (ME.role === 'spy') { const q = SP[ME.s]; map.player.show(false);
      // UX-8: 첫 화면 = 가장 가까운 미션으로 가는 길 쪽(예전 = 물건 쪽 → 벽·선생님 뒤통수) · 몸 방향(q.h)은 그대로
      let nm = -1, nd = 1e9; for (const p of q.ms) { const d9 = Math.hypot(PO[p].sx - q.x, PO[p].sz - q.z); if (d9 < nd) { nd = d9; nm = p; } }
      const rt = nm >= 0 ? C.routeXZ(PO[q.st0].cell, nm) : null; let hc = q.h; if (rt) { C.along(rt, Math.min(3, rt.L), o1); hc = C.hdg(o1.x - q.x, o1.z - q.z); }
      map.player.teleport([q.x, q.y, q.z], { h: hc }); map.player.speed(cfg.v / 4.2); if (map.top.on) map.top.exit(); map.minimap.show({}); scanBtn.style.display = 'flex'; helpSet(true); document.body.classList.add('rb-spy');   // UX-9: 📡 단추는 데스크톱에도(E와 같음 · 할 일이 있으면 노랗게)
      for (let i = 0; i < q.ms.length; i++) { const P = PO[q.ms[i]]; beacons.push(map.mk.marker(P.sx, P.sy, P.sz, { color: 0xffd23c })); } paintMarks(); }
    else { map.player.show(false); map.player.teleport([SX, SY, SZ], { h: 0 }); scanBtn.style.display = 'none'; map.minimap.hide(); areaBase(true); document.body.classList.add('rb-top');   // UX-5 구역 바탕 · UX-12/14
      if (!map.top.on || topRole !== ME.role) { topRole = ME.role; map.top.enter({ floor: 1, at: [-12, -35], d: coarse ? 36 : 30, top: true, me: false, pop: false, floors: false, floorKeys: false, helpTop: coarse ? 124 : 104, onTap: guardTap, onExit: askQuit,   // UX-13: 도움말 = 알림 밑 · 들켜서 구경하던 하늘 보기(누르기 없음)를 그대로 쓰면 다음 판 반장이 로봇을 못 골랐음 → 역할이 바뀌면 다시 엶
        help: ME.role === 'guard' ? (coarse ? '로봇을 톡 = 고르기 → 📸 확인 · 끌기 = 옮기기 · 두 손가락 = 확대' : '로봇 클릭 = 고르기 → 📸 확인(F) · ❓ 의심 표시(R) · 끌기·WASD = 옮기기 · 휠 = 확대') : '구경 중 — 다음 판부터 같이 해요 · 끌기 = 옮기기 · ' + (coarse ? '두 손가락 = 확대' : '휠 = 확대') }); } }
    const gN = r.guard.kind === 'me' ? '나' : r.guard.kind === 'bot' ? '🤖 반장 봇' : r.guard.name;
    map.hud.goal(ME.role === 'guard' ? '🕵️ CCTV 반장 — 로봇 ' + K + '대 속 스파이 ' + S + '명 찾기!' : ME.role === 'spy' ? '🤖 스파이 — 로봇처럼 걷고 미션 자리에서 ' + (coarse ? '📡' : 'E') + ' 스캔!' : '👀 구경 — 다음 판부터 같이 해요');
    const lt = LVL_T[String(r.lvl || 0)];
    card('<div style="font-size:1.25em">' + (ME.role === 'guard' ? '🕵️ 이번 판은 <b>내가 CCTV 반장</b>!' : ME.role === 'spy' ? '🤖 너는 <b>로봇인 척하는 스파이</b>!' : '🕵️ 이번 판 CCTV 반장: <b>' + esc(gN) + '</b>') + '</div>'
      + (r.rounds ? '<div style="opacity:.8;font-size:.85em">' + (r.round + 1) + ' / ' + r.rounds + '판</div>' : '')
      + (lt ? '<div style="color:#ffd23c;font-size:.85em">⚖️ 따라잡기 — ' + lt + '</div>' : ''), 2.5);   // 규칙은 하는 법 창·화면 위 '지금 할 일' 줄이 맡음(RB-2)
    chip('rb-role', ME.role === 'guard' ? '🕵️ 반장' : ME.role === 'spy' ? '🤖 스파이' : '👀 구경');
    coachK = ''; if (NETM && (ME.role === 'guard' || ME.role === 'spy') && !seenHow.has(ME.role)) howTo(ME.role, S, T, shots, false);   // 친구 대결: 처음 맡는 역할이면 준비 시간 동안 하는 법
    paintLog(); paintGP();
  }
  // 아래 안내 줄(#help): 스파이일 때만 '로봇 조작'으로(달리기·점프 없음 · E = 스캔) — 판이 끝나면 원래 글
  const helpEl = document.getElementById('help'); let help0 = null;
  function helpSet(on) { if (!helpEl) return; if (on) { if (help0 == null) help0 = helpEl.textContent; helpEl.textContent = coarse ? '🤖 로봇 조작: 조이스틱 = 걷기(늘 같은 빠르기) · 📡 = 스캔' : '🤖 로봇 조작: WASD = 걷기(늘 같은 빠르기 · 달리기·점프 없음) · 마우스 = 둘러보기 · E = 📡 스캔 · Tab = 마우스 보이기'; }
    else if (help0 != null) { helpEl.textContent = help0; help0 = null; } }
  function endRoundUI() {
    helpSet(false); document.body.classList.remove('rb-spy'); clearScan(); for (const b of beacons) b.remove(); beacons = []; map.minimap.setMarks([]); scanBtn.style.display = 'none'; gp.style.display = 'none'; meterEl.style.display = 'none'; logEl.style.display = 'none';
    map.player.speed(1); map.player.run(true); map.player.jump(true); map.player.show(true); RING.visible = false; MRING.visible = false; for (const p of AREA_PL) p.o.visible = false; areaT = 0;
    for (const s of SPR) s.visible = false; tagN = 0; tagsEnd(); hideBodies();
    document.body.classList.remove('rb-top'); scanBtn.classList.remove('hot', 'dim'); scanBtn.style.background = 'rgba(47,135,200,.92)'; scanPct = -1; logH = ''; if (areaMk && map.top.on) map.top.marks([]); areaMk = false;   // UX-5·7·9·12
  }
  function hideBodies() { for (let j = 0; j < NA; j++) { M.body.setMatrixAt(j, ZERO); M.bib.setMatrixAt(j, ZERO); M.leg.setMatrixAt(j * 2, ZERO); M.leg.setMatrixAt(j * 2 + 1, ZERO); M.arm.setMatrixAt(j * 2, ZERO); M.arm.setMatrixAt(j * 2 + 1, ZERO); SCAN.setMatrixAt(j, ZERO); }
    for (let s = 0; s < SMAX; s++) RVR.setMatrixAt(s, ZERO);
    M.body.instanceMatrix.needsUpdate = M.bib.instanceMatrix.needsUpdate = M.leg.instanceMatrix.needsUpdate = M.arm.instanceMatrix.needsUpdate = SCAN.instanceMatrix.needsUpdate = RVR.instanceMatrix.needsUpdate = true; }
  function paintMarks() {   // 스파이 미니맵: 내 미션(남은 것) + 친구 스파이
    if (ME.role !== 'spy') return; const q = SP[ME.s], L = [];
    q.ms.forEach((p, i) => { if (!q.done.has(i)) L.push({ x: PO[p].sx, z: PO[p].sz, color: '#ffd23c', shape: 'star', label: (i + 1) + ' ' + C.ZL[PO[p].zi].label }); });
    map.minimap.setMarks(L);
    const ms = q.ms.map((p, i) => (q.done.has(i) ? '✅' : (i + 1) + '') + ' ' + C.ZL[PO[p].zi].label).join(' · ');
    chip('rb-mis', '🎯 미션 ' + q.done.size + '/' + q.ms.length + ' · ' + ms);   // UX-4: 휴대폰 짧은 글 = '🎯 0/3'(예전 '🎯 1' = 번호만 남음)
  }

  // ---------- 🤖 스파이(나): E = 삐빅 스캔(2.5초 · 그동안 멈춤) — 물건 앞에서만 · 내 미션 자리면 미션 ----------
  let scanT = 0, scanMis = -1, scanH = 0;
  function thingAt(x, y, z) {   // 가까운 물건(로봇이 스캔하는 곳 1.3m 안) 또는 가구·벽 바로 앞 칸 → 볼 방향
    let best = null, bd = 1.3; for (const P of PO) { const d = Math.hypot(P.sx - x, P.sz - z); if (d < bd && Math.abs(P.sy - y) < 1) { bd = d; best = P; } }
    if (best) return { h: C.hdg(best.x - x, best.z - z) };
    const c = nav.snap(x, y, z, 0.5), CL = nav.raw.clr; if (c < 0 || !CL || CL[c] > 1) return null;
    const Ee = nav.raw.e, DXs = [1, -1, 0, 0], DZs = [0, 0, 1, -1];
    for (const cc of [c, ...[0, 1, 2, 3].map(d => Ee[c * 4 + d]).filter(j => j >= 0)]) for (let d = 0; d < 4; d++) { const j = Ee[cc * 4 + d]; if (j < 0 || nav.raw.mask[j]) return { h: C.hdg(DXs[d], DZs[d]) }; }
    return null;
  }
  function scanStart() {
    if (ME.role !== 'spy' || phase !== 'play' || scanT > 0) return; const q = SP[ME.s]; if (!q || !q.alive) return;
    const p = map.player.get(), nm = nearMission(), th = nm >= 0 ? { h: 0 } : thingAt(p.x, p.y, p.z);   // UX-17: 미션 자리(1.4m)면 '물건 앞'(1.3m) 검사 없이 — 위 줄 '미션 자리예요!'와 같게(방향은 아래 scanH = 미션 물건 쪽)
    if (!th) { map.hud.toast('🤖 로봇은 물건 앞에서만 스캔해요 — 책상·칠판·책장·벽 바로 앞으로', 2.2); return; }
    scanMis = -1; q.ms.forEach((m, i) => { if (!q.done.has(i) && scanMis < 0 && Math.hypot(PO[m].sx - p.x, PO[m].sz - p.z) < cfg.near) scanMis = i; });
    scanT = cfg.scan; scanH = scanMis >= 0 ? C.hdg(PO[q.ms[scanMis]].x - p.x, PO[q.ms[scanMis]].z - p.z) : th.h; q.h = scanH; q.scan = true;
    map.player.freeze(true); map.tone(1320, 0, 0.06, 'square', 0.04); map.tone(1568, 0.09, 0.06, 'square', 0.04);
    chip('rb-scan', '📡 ▯▯▯▯▯' + (scanMis >= 0 ? ' 미션 스캔' : ' 삐빅')); scanPct = -1; paintScan();
  }
  function clearScan() { if (scanT > 0 || chipK['rb-scan']) { scanT = 0; chip('rb-scan', null); const q = SP[ME.s]; if (q) q.scan = false; if (ME.role === 'spy' && phase === 'play' && q && q.alive) map.player.freeze(false); } }
  function scanTick(dt) {
    if (scanT <= 0) return; const q = SP[ME.s]; if (!q || !q.alive || phase !== 'play') { clearScan(); return; }
    q.scan = true; q.h = scanH;
    if ((scanT -= dt) > 0) { const n5 = Math.ceil((1 - scanT / cfg.scan) * 5); chip('rb-scan', '📡 ' + '▮'.repeat(n5) + '▯'.repeat(5 - n5) + (scanMis >= 0 ? ' 미션 스캔' : ' 삐빅'));   // UX-9: 막대를 앞에 — 휴대폰 짧은 글 = '📡 ▮▮▮▯▯'
      if (Math.round((1 - scanT / cfg.scan) * 10) !== scanPct) paintScan(); return; }
    const mi = scanMis; clearScan(); paintScan();
    if (mi >= 0 && !q.done.has(mi)) emit({ k: 'mi', by: q.s, n: mi });
    else if (mi < 0 && fakeTold < 2) { fakeTold++; map.hud.toast('🤖 로봇처럼 삐빅 — 잘 속였어요! ⭐ 미션은 노란 빛기둥 앞에서', 2.2); }   // UX-10: 가짜 스캔이 무엇인지(놀이마다 두 번만 — 일부러 속이는 아이를 귀찮게 하지 않게)
  }
  // UX-2(10-05 교사 편의성): 미션 자리 2.2m 안 = 그 다이아몬드·빛기둥을 땅 밑으로(미니맵 별은 그대로) · 4m 안 가장 가까운 미션 = 바닥 노란 고리
  function beaconTick() {
    const q = SP[ME.s]; if (!q || phase !== 'play') { MRING.visible = false; return; }
    let bi = -1, bd = 4;
    for (let i = 0; i < q.ms.length; i++) { if (q.done.has(i)) continue; const b = beacons[i], P = PO[q.ms[i]]; if (!b || !b.set) continue;
      const d = Math.hypot(P.sx - q.x, P.sz - q.z), near = d < 2.2; if (b._near !== near) { b._near = near; b.set(P.sx, near ? P.sy - 60 : P.sy, P.sz); }   // 땅 밑에 숨김
      if (d < bd) { bd = d; bi = i; } }
    if (bi >= 0 && q.alive) { const P = PO[q.ms[bi]]; MRING.position.set(P.sx, P.sy + 0.07, P.sz); MRING.visible = true; } else MRING.visible = false;
  }
  // UX-9(10-05 교사 편의성): 📡 단추 = 할 일 표시(✋처럼) — 미션 자리면 노랗게 '미션!' · 물건 앞이 아니면 흐리게 · 스캔 중 = 둘레가 차오름
  let scanPct = -1, fakeTold = 0;
  function paintScan() {
    const q = SP[ME.s], on = ME.role === 'spy' && phase === 'play' && q && q.alive;
    const hot = on && scanT <= 0 && nearMission() >= 0, dim = on && scanT <= 0 && !hot && !thingAt(q.x, q.y, q.z), pct = on && scanT > 0 ? Math.round((1 - scanT / cfg.scan) * 10) : -1;
    scanBtn.classList.toggle('hot', !!hot); scanBtn.classList.toggle('dim', !!dim);
    if (pct !== scanPct) { scanPct = pct; scanBtn.style.background = pct >= 0 ? 'conic-gradient(#ffd23c ' + pct * 10 + '%, rgba(47,135,200,.92) 0)' : 'rgba(47,135,200,.92)'; }
    const lb = hot ? (coarse ? '미션!' : '미션! E') : on && scanT > 0 ? '가만히…' : (coarse ? '스캔' : '스캔 E'); if (scanBtn.lastChild.textContent !== lb) scanBtn.lastChild.textContent = lb;
  }
  const keyH = e => { if (e.repeat) return; const t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    if (ME.role === 'spy' && e.code === 'KeyE') { e.preventDefault(); scanStart(); }
    else if (ME.role === 'guard' && e.code === 'KeyF') { e.preventDefault(); shoot(); }
    else if (ME.role === 'guard' && e.code === 'KeyR') { e.preventDefault(); toggleSus(); } };
  addEventListener('keydown', keyH);
  // 내 몸 자리·방향(움직이는 쪽 · 스캔하면 물건 쪽) — 화면 밖 = 마지막 자리로
  let mvH = 0, arT = 0, arOut = 0, arSafe = null, stopT = 0, lastMoveH = null, revT = 0, spyAnT = 0;
  function meTick(dt) {
    const q = SP[ME.s]; if (!q) return; const p = map.player.get(), dx = p.x - q.x, dz = p.z - q.z, sp = Math.hypot(dx, dz) / Math.max(dt, 1e-3);
    q.x = p.x; q.y = p.y; q.z = p.z; q.sp = sp;
    if (!q.scan && sp > 0.6) { const nh = C.hdg(dx, dz);
      // 사람다운 움직임(반장 봇이 보는 것): 갑자기 뒤돌기(140°↑ · 1.2초 안)
      if (lastMoveH != null) { let d = Math.abs(nh - lastMoveH) % 360; if (d > 180) d = 360 - d; if (d > 140 && revT <= 0 && GB) { revT = 3; gbAnomaly(q.e, '갑자기 뒤돌았어요'); } }
      q.h = nh; lastMoveH = nh; }
    revT -= dt;
    // 멈칫: 물건 없는 곳에서 1.3초 · 물건 앞이라도 스캔 없이 4초(로봇은 처음 켜질 때 말고는 멈추면 늘 스캔) — 반장 봇이 보는 '사람 티'
    if (phase === 'play' && q.alive && !q.scan) { if (sp < 0.3) { stopT += dt; if (spyAnT <= 0 && GB && ((stopT > 1.3 && !thingAt(q.x, q.y, q.z)) || (stopT > 4 && tNow > 4))) { spyAnT = 4; gbAnomaly(q.e, stopT > 1.3 && !thingAt(q.x, q.y, q.z) ? '아무것도 없는 데서 멈췄어요' : '스캔 없이 오래 서 있었어요'); } } else stopT = 0; }
    spyAnT -= dt;
    if (phase === 'play' && (arT -= dt) <= 0) { arT = 0.2; const ci = nav.snap(p.x, p.y, p.z, 1.2), ok = ci >= 0 && inA[ci];
      if (ok) { arOut = 0; arSafe = [p.x, p.y, p.z]; } else if ((arOut += 0.2) > 0.4 && arSafe) { arOut = 0; map.player.teleport(arSafe); map.hud.toast('🚧 로봇인 척은 고깔 안(1층 서쪽)에서만 해요', 2); } }
  }

  // ---------- 🕵️ 반장(나): 로봇 누르기 → ❓ / 📸 ----------
  function guardTap(pt) {
    if (ME.role !== 'guard' || phase !== 'play' || pt.sx == null) return;
    const cam = map.camera, W = innerWidth, H = innerHeight, lim = coarse ? 46 : 34; let b = -1, bd = lim * lim;
    for (let e = 0; e < E.length; e++) { if (isCaught(e)) continue; const q = E[e]; _v.set(q.x, q.y + 0.75 * (map.top.on ? RS_TOP : RS), q.z).project(cam); if (_v.z > 1) continue;
      const sx = (_v.x + 1) / 2 * W, sy = (1 - _v.y) / 2 * H, d = (sx - pt.sx) ** 2 + (sy - pt.sy) ** 2; if (d < bd) { bd = d; b = e; } }
    sel = b; if (b >= 0) map.tone(988, 0, 0.05, 'sine', 0.04); paintGP();
  }
  function toggleSus() { if (ME.role !== 'guard' || sel < 0 || okR.has(sel)) return; if (sus.has(sel)) sus.delete(sel); else sus.add(sel); paintGP();
    map.hud.toast(sus.has(sel) ? '❓ 표시했어요 — 기회는 그대로예요' : '❓ 표시를 지웠어요', 1.4); }   // UX-15: ❓가 무엇을 했는지
  let shotWait = 0;
  function shoot() {
    if (ME.role !== 'guard' || phase !== 'play' || sel < 0 || shots <= 0 || okR.has(sel) || isCaught(sel) || performance.now() < shotWait) return;
    shotWait = performance.now() + (NETM ? 900 : 300);   // 친구 대결: 서버에서 돌아올 때까지 두 번 누르기 막음
    const e = sel, hit = e >= K && SP[e - K] && SP[e - K].alive; emit({ k: 'sh', by: 0, who: e, n: hit ? 1 : 0 });
  }
  function flash() { const d = document.createElement('div'); d.className = 'ttl-keep'; d.style.cssText = 'position:fixed;inset:0;z-index:35;background:#fff;opacity:.85;pointer-events:none;transition:opacity .45s'; document.body.appendChild(d); requestAnimationFrame(() => requestAnimationFrame(() => { d.style.opacity = '0'; })); setTimeout(() => d.remove(), 600); }

  // ---------- 사건(친구 대결 = Firebase ev · 혼자 = 바로) ----------
  //   친구 대결은 내 사건도 서버에서 돌아온 뒤에 적용(모든 화면이 서버가 받은 같은 순서로 · 판 시각 = 서버 시각 e.t) — 마지막 미션과 마지막 📸가 거의 같이 나도 모두 같은 결과
  function emit(e) { if (NETM && NM.on) { netEmit(e); if (e.k === 'sh') flash(); } else onEv(e); }
  let banH = null;   // 맞힘 배너(UX-3 — 결과 카드가 뜨면 걷음)
  function onEv(e) {
    if (!R) return;
    const et = NETM && e.t ? (e.t - R.t0) / 1000 - cfg.count : tNow;   // 그 사건의 판 시각
    if (et > playT + 0.05 || (finT != null && et > finT + 0.05)) return;   // 시간이 끝난 뒤·판이 끝난 뒤 사건은 버림(모든 화면이 같은 서버 시각으로)
    if (e.k === 'mi') {   // ⭐ 미션(잡히기 전에 끝낸 스캔이면 잡힌 뒤에 도착해도 셈)
      const q = SP[e.by]; if (!q || q.done.has(e.n)) return; q.done.add(e.n); q.mis++; done++;
      const P = PO[q.ms[e.n]], a = C.areaOf(P.sx, P.sy, P.sz);
      if (q.kind === 'me') { map.hud.banner('⭐ 미션 성공!', 1.4); map.tone(784, 0, 0.1, 'sine', 0.08); map.tone(1046, 0.1, 0.16, 'sine', 0.08); const b = beacons[e.n]; if (b) { b.remove(); beacons[e.n] = { remove() {} }; } paintMarks();
        map.hud.toast('📡 반장 화면에 ' + (AREAS[a] ? AREAS[a].cn + '(' + AREAS[a].n + ')' : '') + ' 신호가 가요 — 자연스럽게 다음 물건으로!', 2.6); }
      else if (ME.role === 'spy') map.hud.toast('⭐ 친구 스파이 미션 성공! (' + done + '/' + T + ')', 1.8);
      if (a >= 0) sigQ.push({ t: Math.max(tNow, et + cfg.delay), a });
      if (done >= T && finT == null) finT = Math.max(0, et);
    } else if (e.k === 'sh') {   // 📸 확인
      if (shots <= 0) return; shots--; const tgt = e.who, hit = tgt >= K && SP[tgt - K] && SP[tgt - K].alive;
      if ((ME.role === 'guard' && !NETM) || ME.role === 'watch') flash();
      map.tone(1760, 0, 0.04, 'square', 0.05);
      if (hit) { const q = SP[tgt - K]; q.alive = false; q.scan = false;
        if (q.kind === 'me') { clearScan(); map.player.freeze(true); scanBtn.style.display = 'none'; for (const b of beacons) b.remove(); beacons = []; MRING.visible = false; map.minimap.setMarks([]); banH = map.hud.banner('📸 들켰어요!', 2); map.tone(523, 0, 0.25, 'sine', 0.15); map.tone(392, 0.22, 0.4, 'sine', 0.15);
          setTimeout(() => { if (!dead && R && phase === 'play' && ME.role === 'spy') { ME.role = 'watch'; ME.caught = true; helpSet(false); document.body.classList.remove('rb-spy'); map.minimap.hide(); chip('rb-mis', null); areaBase(true); document.body.classList.add('rb-top'); topRole = 'watch';   // UX-11: 들킨 뒤 = 구경(친구 스파이 🤝 표시 · 혼자면 '스파이 봇을 응원')
            map.top.enter({ floor: 1, at: [-12, -35], d: coarse ? 36 : 30, top: true, me: false, pop: false, floors: false, floorKeys: false, helpTop: coarse ? 124 : 104, onExit: askQuit, help: NETM ? '들켰어요 — 하늘에서 친구들을 응원해요(어느 로봇인지 말하면 안 돼요!)' : '들켰어요 — 하늘에서 🤝 스파이 봇을 응원해요 · 끌기 = 옮기기 · ' + (coarse ? '두 손가락 = 확대' : '휠 = 확대') }); chip('rb-role', '👀 구경'); paintLog(); } }, 1600); }
        else { banH = map.hud.banner(ME.role === 'spy' ? '📸 친구 스파이(' + (q.kind === 'bot' ? '스파이 봇' : q.name) + ')가 들켰어요!' : '📸 스파이 ' + (q.kind === 'bot' ? '봇' : q.name) + ' 찾았다!', 1.8); if (ME.role === 'guard') map.tone(1046, 0.1, 0.2, 'sine', 0.1); }   // UX-18: 스파이 화면은 스파이 말투로
        if (sel === tgt) sel = -1; sus.delete(tgt);
        if (!SP.some(q => q.alive) && finT == null) finT = Math.max(0, et);
      } else { okR.add(tgt); sus.delete(tgt);
        map.hud.toast(ME.role === 'guard' ? '🤖 삐빅 — 진짜 로봇이었어요 (📸 ' + shots + '번 남음)' : '📸 반장이 진짜 로봇을 찍었어요! (남은 📸 ' + shots + ')', 2.2); }
      paintGP();
    }
  }
  // 신호 도착(반장·구경 화면 · 반장 봇 머리)
  function sigTick() {
    while (sigQ.length && sigQ[0].t <= tNow) { const q = sigQ.shift();
      sigLog.push({ t: Math.max(0, tNow), a: q.a });
      if (ME.role === 'guard' || ME.role === 'watch') { areaFlash(q.a); map.hud.toast('📡 ' + AREAS[q.a].cn + ' — ' + AREAS[q.a].n + '에서 신호!', 2.2); map.tone(659, 0, 0.08, 'square', 0.05); map.tone(988, 0.1, 0.12, 'square', 0.05); paintLog();
        if (map.top.on && AREA_C[q.a]) { map.top.marks([{ x: AREA_C[q.a].x, y: 0.5, z: AREA_C[q.a].z, t: '📡 ' + AREAS[q.a].cn + ' 신호!' }]); areaMk = true; } }   // UX-5: 지도 위 그 구역에 노란 이름표(6초)
      if (GB) gbSignal(q.a); }
  }

  // ---------- 🤖 스파이 봇(사람 흉내 — 시뮬레이션과 같은 머리) ----------
  //   자동 걷기 60% · 손으로 걸으면 가끔 멈칫(초당 0.12번 · 0.8~1.6초 · 두리번 = 반장이 볼 수 있는 티) · 미션 전 35%는 아무 물건 들르기 · 방에 로봇이 없으면 30%는 잠깐 기다림
  function sbInit(q) { q.b = { st: 'wait', T: 0.3 + rng() * 2.5, rt: null, d: 0, manual: false, tgt: -1, mis: -1, stopT: 0, lastDecoy: false, covered: false, wob: 0 }; }
  function sbTick(q, dt) {
    const B = q.b; if (!B || !q.alive) return; q.scan = false;
    if (B.st === 'wait' || B.st === 'dwell') { if (B.st === 'dwell' && B.scanning) q.scan = true; if ((B.T -= dt) > 0) return; B.scanning = false;
      const todo = q.ms.map((p, i) => i).filter(i => !q.done.has(i)); if (!todo.length) { B.st = 'dwell'; B.T = 2 + rng() * 2; B.scanning = false; B.tgt = C.pickPoi(rng, B.tgt >= 0 ? B.tgt : q.st0, wzNow()); return sbGo(q, B.tgt, -1); }
      const near = todo.sort((a, b) => Math.hypot(PO[q.ms[a]].sx - q.x, PO[q.ms[a]].sz - q.z) - Math.hypot(PO[q.ms[b]].sx - q.x, PO[q.ms[b]].sz - q.z))[0];
      const dec = !B.lastDecoy && !B.covered && rng() < 0.35; B.lastDecoy = dec;
      return sbGo(q, dec ? C.pickPoi(rng, B.tgt >= 0 ? B.tgt : q.st0, wzNow()) : q.ms[near], dec ? -1 : near); }
    if (B.st === 'walk') {
      if (B.stopT > 0) { B.stopT -= dt; B.wob += dt; q.h = (B.h0 + Math.sin(B.wob * 5) * 38 + 360) % 360; return; }
      if (B.manual && rng() < 0.12 * dt) { B.stopT = 0.8 + rng() * 0.8; B.wob = 0; B.h0 = q.h; if (GB) gbAnomaly(q.e); return; }
      B.d += cfg.v * (B.manual ? 0.93 : 1) * dt; if (B.d >= B.rt.L) { B.d = B.rt.L; B.st = 'arrive'; } C.along(B.rt, B.d, o1); q.x = o1.x; q.y = o1.y; q.z = o1.z; q.h = o1.h; }
    if (B.st === 'arrive') { const P = PO[B.tgt]; q.x = P.sx; q.y = P.sy; q.z = P.sz; q.h = C.hdg(P.x - P.sx, P.z - P.sz);
      if (B.mis >= 0 && !B.covered) { let cnt = 0; for (const r of ROB) { C.at(r, tNow, o1); if (Math.hypot(o1.x - P.sx, o1.z - P.sz) < 6) cnt++; } if (cnt === 0 && rng() < 0.3) { B.st = 'dwell'; B.T = 2 + rng() * 2.5; B.scanning = true; B.covered = true; return; } }
      B.covered = false; B.st = B.mis >= 0 ? 'scan' : 'dwell'; B.T = B.mis >= 0 ? cfg.scan : cfg.dwell0 + rng() * (cfg.dwell1 - cfg.dwell0); B.scanning = true; }
    if (B.st === 'scan') { q.scan = true; if ((B.T -= dt) > 0) return; const mi = B.mis; B.st = 'dwell'; B.T = 0.2; B.scanning = false; q.scan = false; if (mi >= 0 && !q.done.has(mi)) emit({ k: 'mi', by: q.s, n: mi }); }
  }
  function sbGo(q, p, mi) { const B = q.b; B.tgt = p; B.mis = mi; B.manual = rng() > 0.6; const c0 = nav.snap(q.x, q.y, q.z, 1.2); B.rt = c0 >= 0 ? C.routeXZ(c0, p) : null; B.d = 0; B.st = B.rt ? 'walk' : 'arrive'; }
  let WZ = null; const wzNow = () => WZ || (WZ = C.weights(SP.map(q => q.ms)));

  // ---------- 🕵️ 반장 봇(혼자 스파이 놀이) ----------
  const ents = () => { const L = []; for (let k = 0; k < K; k++) L.push({ e: k, x: E[k].x, y: E[k].y, z: E[k].z, scan: E[k].scan }); for (const q of SP) if (q.alive) L.push({ e: q.e, x: q.x, y: q.y, z: q.z, scan: q.scan }); return L; };
  function gbSample() { const m = new Map(); for (const x of ents()) m.set(x.e, C.areaOf(x.x, x.y, x.z)); gbHist.push({ t: tNow, m }); if (gbHist.length > 8) gbHist.shift(); }
  function gbSignal(a) { const past = gbHist.find(h => h.t >= tNow - 2.2), cands = [];
    for (const x of ents()) { const ai = C.areaOf(x.x, x.y, x.z); if (ai === a) cands.push({ e: x.e, w: x.scan ? 0.8 : 0.7 }); else if (past && past.m.get(x.e) === a) cands.push({ e: x.e, w: 0.5 }); }
    GB.signal(tNow, cands); gbRecent.push({ t: tNow, a }); gbDecT = Math.min(gbDecT, tNow + 1.0); }
  let anTold = 0;
  function gbAnomaly(e, why) { if (!GB) return; const q = E[e]; const a = q ? C.areaOf(q.x, q.y, q.z) : -1; const hit = GB.anomaly(e, tNow, gbRecent.some(r => r.a === a && tNow - r.t < 8));
    if (hit && why && ME.role === 'spy' && SP[ME.s] && e === SP[ME.s].e && performance.now() > anTold) { anTold = performance.now() + 4000; map.hud.toast('👀 반장 봇이 수상하게 봤어요 — ' + why, 2.4); } }   // UX-10(10-05 교사 편의성): 무엇이 '사람 티'였는지(혼자 놀이 · 반장 봇 판단은 그대로)
  let gbT = 0;
  function gbTick(dt) {
    if ((gbT -= dt) <= 0) { gbT = 0.5; gbSample(); }
    if (shots > 0 && tNow >= gbDecT && tNow >= gbShotT) { gbDecT = tNow + 0.5; const e = GB.decide(tNow, T - done, playT - tNow);
      if (e >= 0) { gbShotT = tNow + 1.2; const hit = e >= K && SP[e - K] && SP[e - K].alive; GB.clear(e); emit({ k: 'sh', by: 0, who: e, n: hit ? 1 : 0 }); } }
    if (ME.role === 'spy' && SP[ME.s] && SP[ME.s].alive) { const v = Math.min(1, GB.suspect(SP[ME.s].e, tNow) / 1.1); meterEl.style.display = 'block'; const b = meterEl.querySelector('s'); b.style.width = Math.round(v * 100) + '%'; b.style.background = v > 0.75 ? '#e85d5d' : v > 0.4 ? '#f2b84c' : '#5fd068'; }
    else meterEl.style.display = 'none';
  }

  // ---------- 매 프레임 ----------
  function tick(dt) {
    if (!R) return;
    if (!NETM) { const hold = quitOpen || !!(window.__pause && window.__pause.on);   // 멈춘 동안은 아무것도 안 감 · 돌아오면 시계를 그만큼 밂(로봇 자리 = 시각의 함수라 그대로 이어짐)
      if (hold) { if (!pauseAt) pauseAt = Date.now(); return; }
      if (pauseAt) { R.t0 += Date.now() - pauseAt; pauseAt = 0; } }
    const t = (clock() - R.t0) / 1000 - cfg.count; tNow = t;
    const endAt = finT != null ? finT : playT, p = t < 0 ? 'count' : t < endAt ? 'play' : 'res';
    if (p !== phase) setPhase(p);
    const tt = Math.max(0, Math.min(t, endAt));
    for (let k = 0; k < K; k++) { C.at(ROB[k], tt, o1); const q = E[k]; q.x = o1.x; q.y = o1.y; q.z = o1.z; q.h = o1.h; q.scan = p === 'play' && o1.scan; }
    if (ME.role === 'spy') { meTick(dt); scanTick(dt); }
    const host = !NETM || NM.host;
    if (p === 'play') { if (host) for (const q of SP) if (q.kind === 'bot') { if (!q.b) sbInit(q); sbTick(q, dt); } if (GB && host) gbTick(dt); }
    for (const q of SP) if (q.kind === 'remote') netActor(q, dt);
    for (const q of SP) { const b = E[q.e]; b.x = q.x; b.y = q.y; b.z = q.z; b.h = q.h; b.scan = p === 'play' && q.alive && q.scan; }
    if (p === 'play') sigTick();
    if (areaT > 0) { areaT -= dt; const o = areaT <= 0 ? A_BASE : areaT > 4.8 ? 0.3 + 0.2 * (0.5 + 0.5 * Math.sin(areaT * 9)) : 0.22; for (const pl of AREA_PL) if (pl.a === areaA) pl.m.opacity = o;   // UX-5: 깜빡(3.2초) → 남김(4.8초) → 바탕(숨기지 않음)
      if (areaT < 2 && areaMk) { areaMk = false; if (map.top.on) map.top.marks([]); } }
    draw(dt);
    if ((uiT -= dt) <= 0) { uiT = 0.2;
      chip('rb-time', p === 'count' ? '⏱ 준비 ' + Math.ceil(-t) : p === 'play' ? '⏱ ' + fmt(Math.max(0, playT - t)) : '🏁 끝');
      chip('rb-score', '⭐ ' + (ME.role === 'spy' ? '우리 팀 ' : '스파이 팀 ') + done + '/' + T + ' · 📸 ' + shots + (SP.length > 1 ? ' · 🤖 남은 스파이 ' + SP.filter(q => q.alive).length : ''));   // UX-18: 누구 점수인지(휴대폰 짧은 글은 그대로 '⭐ 0/5')
      if (ME.role === 'guard') paintGP(); if (ME.role === 'spy') { beaconTick(); paintScan(); } if (ME.role === 'guard' || ME.role === 'watch') paintLog(); coach(); }
    if (NETM && NM.on) { netSend(dt); hostRun(t, endAt); if ((NM.lagT = (NM.lagT || 0) - dt) <= 0) { NM.lagT = 1; chip('rb-net', NM.lag >= 450 ? '📶 인터넷이 느려요(' + NM.lag + 'ms)' : null); } }
    else if (p === 'res' && t > endAt + cfg.end && !matchEnd) { matchEnd = true; soloEnd(); }
  }
  let uiT = 0;
  function setPhase(p) {
    const was = phase; phase = p; if (p !== 'count') howClose();
    if (p === 'play') { if (ME.role === 'spy') { map.player.freeze(false); map.hud.banner('🤖 시작! 로봇처럼…', 1.3); } else if (ME.role === 'guard') map.hud.banner('📹 CCTV 켜짐!', 1.2); map.tone(784, 0, 0.14, 'square', 0.05); paintGP(); paintLog(); }
    else if (p === 'res') roundResult(was);
  }
  // 몸 그리기(행렬만) — 모든 몸이 같은 모양 · 방향은 같은 빠르기로 돌림(로봇·스파이가 꺾이는 모양이 같게) · 잡힌 스파이·결과 = 빨간 조끼 + 이름표
  function draw(dt) {
    sprN = 0; tagN = 0; const reveal = phase === 'res', meE = ME.role === 'spy' ? SP[ME.s].e : -1, cam = map.camera;
    // UX-1(10-05 교사 편의성): 하늘 보기 = 로봇 RS_TOP · 표·고리 = 화면 크기(sprMpp) — 그리기만(동기화 없음) · 스파이 3인칭은 그대로
    const topV = map.top.on, RSv = topV ? RS_TOP : RS, st9 = topV ? map.top.state : null; sprMpp = st9 ? 2 * st9.d * Math.tan(cam.fov * Math.PI / 360) / innerHeight : 0;
    // 내 로봇: 1인칭(V)이거나 카메라가 몸에 붙으면(벽 앞 · 1.2m 안 — UX-2: 0.75면 몸이 카메라 near에 잘려 조각나 보임) 안 그림 — 엔진이 내 캐릭터를 숨기는 것과 같게
    const meHide = meE >= 0 && E[meE] && (map.player.first || Math.hypot(cam.position.x - E[meE].x, cam.position.z - E[meE].z) < 1.2);
    for (let j = 0; j < NA; j++) {
      const q = E[j]; if (!q || phase === 'off' || (j === meE && meHide)) { M.body.setMatrixAt(j, ZERO); M.bib.setMatrixAt(j, ZERO); M.leg.setMatrixAt(j * 2, ZERO); M.leg.setMatrixAt(j * 2 + 1, ZERO); M.arm.setMatrixAt(j * 2, ZERO); M.arm.setMatrixAt(j * 2 + 1, ZERO); SCAN.setMatrixAt(j, ZERO); continue; }
      if (q.ox == null) { q.ox = q.x; q.oz = q.z; } const mv = Math.hypot(q.x - q.ox, q.z - q.oz); q.walk += Math.min(mv, 0.5) * 5.5; q.ox = q.x; q.oz = q.z;
      if (q.hr == null) q.hr = q.h; let dh = q.h - q.hr; while (dh > 180) dh -= 360; while (dh < -180) dh += 360; const st = 640 * dt; q.hr = (q.hr + Math.max(-st, Math.min(st, dh)) + 360) % 360;
      const yaw = Math.PI - q.hr * Math.PI / 180, sy = Math.sin(yaw), cy = Math.cos(yaw), moving = mv > 0.004;
      const bob = moving ? Math.abs(Math.sin(q.walk)) * 0.035 : 0, y0 = q.y + 0.01 + bob, sp = j >= K ? SP[j - K] : null, caught = sp && !sp.alive;
      _q.setFromEuler(_e.set(0, yaw, caught ? 0.25 : 0)); _s.set(RSv, RSv, RSv); _v.set(q.x, y0, q.z); M.body.setMatrixAt(j, _m4.compose(_v, _q, _s)); M.bib.setMatrixAt(j, _m4);
      M.bib.setColorAt(j, _c.set(sp && (caught || reveal) ? RED : MINT));
      const sw = moving ? Math.sin(q.walk) * 0.7 : 0;
      for (let s = 0; s < 2; s++) { const side = s ? 1 : -1;
        { const ox = 0.085 * side * RSv, oy = 0.34 * RSv; _v.set(q.x + ox * cy, y0 + oy, q.z - ox * sy); _q.setFromEuler(_e.set(sw * side, yaw, 0)); M.leg.setMatrixAt(j * 2 + s, _m4.compose(_v, _q, _s)); }
        const up = q.scan && s === 1, ox = 0.21 * side * RSv, oy = 0.7 * RSv; _v.set(q.x + ox * cy, y0 + oy, q.z - ox * sy); _q.setFromEuler(_e.set(up ? -1.45 + Math.sin(q.walk * 0 + tNow * 9) * 0.08 : caught ? -2.6 : -sw * side * 0.8, yaw, 0.12 * side)); M.arm.setMatrixAt(j * 2 + s, _m4.compose(_v, _q, _s)); }
      if (q.scan) { _q.setFromEuler(_e.set(0, yaw, 0)); _v.set(q.x, q.y + 0.07, q.z); _s.set(1, 1, 1); SCAN.setMatrixAt(j, _m4.compose(_v, _q, _s)); } else SCAN.setMatrixAt(j, ZERO);
      // 표: 반장 = ❓·✓ · 모두 = 잡힌 스파이 이름 · 결과 = 스파이 이름 · 스파이 = 친구 스파이 이름(🤝)
      if (sp && (caught || reveal) && j !== meE) bdg(q, RSv, (caught ? '📸 ' : '🤖 ') + (sp.kind === 'bot' ? '스파이 봇' : sp.name), 'rgba(232,72,72,.94)');   // 내 머리 위 이름표는 3인칭 카메라를 가려서 안 그림
      else if ((ME.role === 'spy' || ME.caught) && sp && sp.alive && j !== meE) bdg(q, RSv, '🤝 ' + (sp.kind === 'bot' ? '스파이 봇' : sp.name), 'rgba(59,130,246,.9)');
      else if (ME.role === 'guard' && okR.has(j)) bdg(q, RSv, '✓ 로봇', 'rgba(47,158,68,.92)', 1.0);
      else if (ME.role === 'guard' && sus.has(j)) bdg(q, RSv, '❓ 의심', 'rgba(235,140,0,.95)', 0.9);
    }
    for (let i = sprN; i < SPR.length; i++) SPR[i].visible = false; tagsEnd();
    if (ME.role === 'guard' && sel >= 0 && E[sel] && phase === 'play') { RING.visible = true; RING.position.set(E[sel].x, E[sel].y + 0.1, E[sel].z); RING.scale.setScalar(Math.max(RSv, 15 * sprMpp / 0.68) * (1 + Math.sin(tNow * 6) * 0.06)); } else RING.visible = false;   // UX-1: 고른·올림 고리 지름 ≥30px
    hov = -1; if (ME.role === 'guard' && phase === 'play' && hovXY && map.top.on) { const cam = map.camera, W = innerWidth, H = innerHeight; let bd = 34 * 34;
      for (let e = 0; e < E.length; e++) { if (isCaught(e)) continue; const q = E[e]; _v.set(q.x, q.y + 0.75 * RSv, q.z).project(cam); if (_v.z > 1) continue; const d = ((_v.x + 1) / 2 * W - hovXY[0]) ** 2 + ((1 - _v.y) / 2 * H - hovXY[1]) ** 2; if (d < bd) { bd = d; hov = e; } } }
    if (hov >= 0 && hov !== sel) { HRING.visible = true; HRING.position.set(E[hov].x, E[hov].y + 0.09, E[hov].z); HRING.scale.setScalar(Math.max(RSv, 15 * sprMpp / 0.68)); } else HRING.visible = false;
    if (MRING.visible) MRING.scale.setScalar(1.1 + Math.sin(tNow * 5) * 0.08);   // UX-2 미션 자리 고리 맥박
    for (let s = 0; s < SMAX; s++) { const q = SP[s]; if (q && phase !== 'off' && (reveal || !q.alive)) { _v.set(q.x, q.y + 0.1, q.z); _q.identity(); _s.setScalar(Math.max(RSv * 1.3, 20 * sprMpp / 0.68) * (1 + 0.12 * Math.sin(tNow * 8))); RVR.setMatrixAt(s, _m4.compose(_v, _q, _s)); } else RVR.setMatrixAt(s, ZERO); }   // UX-3 스파이 공개 고리
    RVR.instanceMatrix.needsUpdate = true;
    { const pad = document.getElementById('tv-pad'); if (pad) { const c9 = hov >= 0 ? 'pointer' : ''; if (pad.style.cursor !== c9) pad.style.cursor = c9; } }
    M.body.instanceMatrix.needsUpdate = M.bib.instanceMatrix.needsUpdate = M.leg.instanceMatrix.needsUpdate = M.arm.instanceMatrix.needsUpdate = SCAN.instanceMatrix.needsUpdate = true; M.bib.instanceColor.needsUpdate = true;
  }

  // ---------- 판 결과 ----------
  function roundResult() {
    if (banH) { banH.remove(); banH = null; } map.hud.toast('', 0.01);   // UX-3(10-05 교사 편의성): 맞힘 배너·알림을 걷고 결과만(휴대폰에서 카드와 겹치던 것)
    clearScan(); map.player.freeze(true); gp.style.display = 'none'; scanBtn.style.display = 'none'; meterEl.style.display = 'none'; RING.visible = false; MRING.visible = false;
    const spyWin = done >= T, caught = SP.filter(q => !q.alive).length, me = SP[ME.s];
    if (RK && NM.on && R) RK.round(R.seq, R.round, (row) => {   // RANK-1: 이 판 기록(판마다 한 번)
      for (const q of SP) if (q.kind !== 'bot' && q.pid) { const r = row(q.pid, q.name); r.m += q.mis; r.sr++; if (q.alive) r.sv++; }
      if (R.guard.kind !== 'bot' && R.guard.pid) { const r = row(R.guard.pid, R.guard.name); r.gr++; r.g += caught; if (!spyWin) r.gw++; } });
    const why = spyWin ? '스파이 팀이 ⭐ ' + done + '/' + T + '개를 모았어요' : !SP.some(q => q.alive) ? '스파이를 모두 찾았어요' : '시간 안에 ⭐ ' + T + '개를 못 모았어요(' + done + '개)';
    res = { spyWin, side: spyWin ? 's' : 'g', why, caught, total: SP.length, myMis: me ? me.mis : 0, meOut: !!me && !me.alive };   // hostRun은 res.side만 읽음 · 나머지 = 혼자 끝 메뉴(UX-3)
    const head = ME.role === 'guard' ? (spyWin ? '😮 스파이 팀 승리' : '🎉 반장 승리!') : me ? (spyWin ? '🎉 스파이 팀 승리!' : '💥 반장 승리') : (spyWin ? '🤖 스파이 팀 승리' : '🕵️ 반장 승리');
    const who = SP.map(q => (q.kind === 'me' ? '나' : q.kind === 'bot' ? '스파이 봇' : q.name) + (q.alive ? ' 끝까지 숨음' : ' 📸 들킴') + ' ⭐' + q.mis).join(' · ');   // UX-18: 앞 글자 대신 말로
    card('<div style="font-size:1.3em">' + head + '</div>' + esc(why) + '<br><span style="font-size:.88em">빨간 고리·조끼 = 스파이 — ' + esc(who) + '</span>' + (RK && NM.on ? RK.strip() : ''), cfg.end, map.top.on ? 'bottom' : 'top');   // 하늘 보기 = 아래(❓/📸 판이 숨어 비어 있음)
    if (map.top.on) { const s0 = SP.find(q => q.alive) || SP[0], st9 = map.top.state; if (s0 && st9) { const off = (document.body.classList.contains('small') ? 0.24 : 0.1) * 2 * st9.d * Math.tan(map.camera.fov * Math.PI / 360); map.top.look(s0.x + Math.sin(st9.yaw) * off, s0.z + Math.cos(st9.yaw) * off); } }   // 놓친 스파이 쪽으로 카메라가 부드럽게 — 화면 위쪽에 오게(아래 결과 카드에 가리지 않게 · 휴대폰은 카드가 커서 더 위로)
    if ((ME.role === 'guard' && !spyWin) || (ME.role === 'spy' && spyWin)) { map.tone(523, 0, 0.15, 'sine', 0.1); map.tone(659, 0.15, 0.15, 'sine', 0.1); map.tone(784, 0.3, 0.3, 'sine', 0.1); }
    if (!NETM) { if (ME.role === 'guard') { const b = map.store.get('bestCatch', 0); if (caught > b) map.store.set('bestCatch', caught); } else if (me) { const b = map.store.get('bestMis', 0); if (me.mis > b) map.store.set('bestMis', me.mis); } }
  }
  const myName = () => (NETM ? NM.name : '나');

  // ---------- 혼자(봇) ----------
  async function soloAsk() {
    let role = params.role === 'guard' || params.role === 'spy' ? params.role : null;
    if (!role) { const i = await map.hud.ask('🤖 로봇인 척 — 혼자 연습\n로봇 ' + K + '대 속에 로봇인 척하는 스파이가 숨어 있어요 · 한 판 ' + (cfg.count + playOf(2) + cfg.end) + '초 · 친구와 하려면 👥 함께하기 방의 🏠 대기실에서 방장이 🤖 로봇인 척을 골라요',
      ['🕵️ CCTV 반장 — 하늘에서 보며 스파이 봇 둘 찾기(📸 3번)', '🤖 스파이 — 로봇처럼 걸으며 미션(반장 봇이 지켜봐요)']);
      if (i < 0 || dead) return; role = i === 1 ? 'spy' : 'guard'; }
    await howTo(role, 2, goalOf(2), shotsOf(2), true); if (dead) return;
    soloRound(role);
  }
  function soloRound(role) {
    matchEnd = false; WZ = null;
    const t0 = Date.now() + cfg.count * 1000 * 0 + 300, seed = Math.floor(Math.random() * 1e9);
    const spies = role === 'guard' ? [{ kind: 'bot', name: '스파이 봇 1' }, { kind: 'bot', name: '스파이 봇 2' }] : [{ kind: 'me', name: '나' }, { kind: 'bot', name: '스파이 봇' }];
    beginRound({ seq: 1, t0, lvl: 0, seed, guard: role === 'guard' ? { kind: 'me', name: '나' } : { kind: 'bot', name: '반장 봇' }, spies });
  }
  async function soloEnd() {
    const role = ME.role === 'guard' ? 'guard' : 'spy';
    const head = !res ? '끝' : role === 'guard' ? (res.spyWin ? '😮 스파이 팀 승리' : '🎉 반장 승리!') + '\n' + res.why + '\n🕵️ 찾은 스파이 ' + res.caught + '/' + res.total + '명 · 내 최고 ' + map.store.get('bestCatch', 0) + '명'
      : (res.spyWin ? '🎉 스파이 팀 승리!' : '💥 반장 승리') + '\n' + res.why + '\n🤖 내 미션 ⭐ ' + res.myMis + '개' + (res.meOut ? ' · 📸 들켰어요' : ' · 끝까지 안 들켰어요') + ' · 내 최고 ⭐ ' + map.store.get('bestMis', 0) + '개';   // UX-3: 왜 이겼는지·내 기록(ask = 줄바꿈 됨)
    const i = await map.hud.ask(head, ['🔄 다시 하기', role === 'guard' ? '🤖 스파이 해 보기' : '🕵️ 반장 해 보기', '🏠 그만하기']);
    if (dead) return; if (i === 0) soloRound(role); else if (i === 1) { const r2 = role === 'guard' ? 'spy' : 'guard'; if (!seenHow.has(r2)) { await howTo(r2, 2, goalOf(2), shotsOf(2), true); if (dead) return; } soloRound(r2); } else map.quit();
  }
  async function askQuit() { if (quitOpen || document.querySelector('.hudAsk')) return;   // QA-1: Esc를 두 번 눌러도 창은 하나(두 창이 얼림 상태를 엇갈려 되돌려 계속 얼어 있던 것) · 결과 창 위에도 안 겹침
    quitOpen = true; const i = await map.hud.ask('로봇인 척을 그만할까요?' + (NETM ? '' : '\n(고르는 동안 멈춰 있어요)'), ['▶ 계속하기', '🏠 그만하기']); quitOpen = false; if (i === 1) map.quit(); }

  // =====================================================================================
  // 👥 친구 대결 — Firebase match/c<번호>(물총·숨바꼭질과 같은 자리 · m.arena = 'rb' + 따라잡기 단계로 구별)
  //   m { st: lobby|play|end, host, arena 'rb0', time = 판 수, goal = 판 번호, seq, t0 = 준비 시작 시계(서버 ms) } — 로봇 씨앗 = t0·seq(규칙에 새 칸 없이)
  //   p/<pid> { n, tm = 차례 + 100(이번 판 반장) + 1000(반장을 해 봄) · 99 = 늦게 옴, on } · s/<pid> = [x, y, z, h, 표(1 스캔), 신호, ts, 왕복]
  //   ev/<id> { k mi(미션 · by 스파이 자리 · n 몇 번째)|sh(📸 · who 몸 번호 · n 1 = 스파이), q = 판 seq } — 📸 판정 = 반장 화면 · 미션 = 그 스파이 화면
  // =====================================================================================
  const roomLed = () => { const mp = window.SM_MP; return !!(NETM && mp && mp.roomGame && mp.roomGame() === 'robots_vs'); };   // ROOM-2: 방장이 🏠 대기실에서 고른 방 놀이
  const roomBack = (t, html, ms) => { const mp = window.SM_MP; if (!roomLed()) return false; if (mp.setLast) mp.setLast({ t, html }); setTimeout(() => { if (!dead) map.quit(); }, ms); return true; };   // 결과를 대기실로 넘기고 ms 뒤 모두 같이 나감
  const NM = { on: false, room: null, pid: null, name: '', host: false, es: null, D: {}, seen: new Set(), off: 0, seq: -1, st: null, sendT: 0, busyS: 0, offs: [],
    ui: null, beat: 0, beatN: 0, lastSend: 0, claim: false, seenAt: {}, lvl: 0, streak: [], adv: false, lag: 0 };
  const nreq = (path, method = 'GET', data) => fetch(MDB + NM.room + path + '.json', { method, body: data == null ? undefined : JSON.stringify(data), keepalive: true }).then(r => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))));
  const sNow = () => Date.now() + NM.off;
  const ctlMatch = (seq, st) => { const mp = window.SM_MP, N = mp && mp.net(); if (N && N.ctl) N.ctl('match', { seq, st }); };
  const r2 = v => Math.round(v * 100) / 100;
  const isRB = m => !!m && /^rb/.test(m.arena || '');
  const busyMsg = m => (/^hs/.test(m.arena || '') ? '🙈 지금 이 방은 숨바꼭질 대작전 중이에요' : /^gd/.test(m.arena || '') ? '🧭 지금 이 방은 길잡이 중이에요' : '💦 지금 이 방은 물총 친구 대결 중이에요') + ' — 끝나면 다시 와요';
  function applyEvt(root, type, path, d) {
    const set = (r, p, v) => {
      if (!p.length) return v && typeof v === 'object' ? v : {};
      let o = r; for (let i = 0; i < p.length - 1; i++) { if (!o[p[i]] || typeof o[p[i]] !== 'object') { if (v === null) return r; o[p[i]] = {}; } o = o[p[i]]; }
      if (v === null) delete o[p[p.length - 1]]; else o[p[p.length - 1]] = v; return r;
    };
    if (type === 'put') return set(root, path, d);
    if (d && typeof d === 'object') for (const k in d) root = set(root, [...path, ...k.split('/').filter(Boolean)], d[k]);
    return root;
  }
  async function netEnter() {
    const mp = window.SM_MP; if (!mp || !mp.room()) { map.hud.toast('👥 함께하기 방에 먼저 들어가요', 3); map.quit(); return; }
    const N = mp.net();
    NM.on = true; NM.room = mp.room(); NM.pid = (N && N.id) || ('p' + Math.random().toString(36).slice(2, 10)); NM.name = (N && N.name) || '친구';
    NM.D = {}; NM.seen.clear(); NM.seq = -1; NM.st = null; NM.seenAt = {};
    if (N && N.hide) N.hide(true);
    lobbyDraw('불러오는 중…');
    let D0 = null;
    try {
      D0 = (await nreq('')) || {};
      const P = D0.p || {}, m = D0.m, live = m && m.st !== 'end' && P[m.host] && Object.keys(P).length;   /* QA-1(10-10): 끝난 경기(st end)는 진행 중이 아님 — 앞 방 놀이 자료가 남아(새로고침한 친구의 옛 자리가 방장으로 넘겨받음) 다음 놀이가 '지금 ○○ 중'이라며 못 들어가던 것 */
      if (live && !isRB(m)) { map.hud.toast(busyMsg(m), 4); NM.on = false; if (N && N.hide) N.hide(false); lobbyHide(); map.quit(); return; }
      const t1 = Date.now(), r = await nreq('/p/' + NM.pid, 'PUT', { n: NM.name, tm: 99, on: { '.sv': 'timestamp' } }), t2 = Date.now();
      NM.off = r.on - (t1 + t2) / 2;
      if (!live) { const sq = ((m && m.seq) || 0) + 1; await nreq('/m', 'PUT', { st: 'lobby', host: NM.pid, arena: 'rb0', time: 0, goal: 0, seq: sq, t0: 0 }); ctlMatch(sq, 'rlobby'); }
    } catch (e) { map.hud.toast('😥 친구 대결에 들어가지 못했어요 — 인터넷·방을 확인해 주세요', 4); NM.on = false; if (N && N.hide) N.hide(false); lobbyHide(); map.quit(); return; }
    if (dead || !NM.on) return;
    if (D0 && D0.ev) for (const id in D0.ev) NM.seen.add(id);
    NM.es = new EventSource(MDB + NM.room + '.json');
    const on = type => e => { let msg; try { msg = JSON.parse(e.data); } catch (er) { return; } if (!msg) return; NM.D = applyEvt(NM.D, type, (msg.path || '/').split('/').filter(Boolean), msg.data); netSync(); };
    NM.es.addEventListener('put', on('put')); NM.es.addEventListener('patch', on('patch'));
    addEventListener('pagehide', netBye); addEventListener('sm-room', netRoomGone);
    clearInterval(NM.beat); NM.beat = setInterval(() => { if (NM.on && performance.now() - NM.lastSend > 2500) netSendNow(); }, 1500);
  }
  function netRoomGone(e) { if (!e.detail && NM.on && !dead) { map.hud.toast('🚪 방이 닫혀서 로봇인 척을 마쳤어요', 3); map.quit(); } }
  function netBye() { if (!NM.on) return; fetch(MDB + NM.room + '/p/' + NM.pid + '.json', { method: 'DELETE', keepalive: true }).catch(() => {}); fetch(MDB + NM.room + '/s/' + NM.pid + '.json', { method: 'DELETE', keepalive: true }).catch(() => {}); }
  function netLeave() {
    if (!NM.on) return;
    const P = NM.D.p || {}, rest = Object.keys(P).filter(id => id !== NM.pid).sort((a, b) => (P[a].on || 0) - (P[b].on || 0));
    if (!rest.length) nreq('', 'DELETE').catch(() => {});
    else { netBye(); if (NM.host) nreq('/m/host', 'PUT', rest[0]).catch(() => {}); }
    if (NM.es) NM.es.close(); NM.es = null; NM.on = false; clearInterval(NM.beat); removeEventListener('pagehide', netBye); removeEventListener('sm-room', netRoomGone);
    const mp = window.SM_MP, N = mp && mp.net(); if (N && N.hide) N.hide(false);
    lobbyHide(); if (RK) RK.hide();
  }
  function toLobbyUI() { if (R) { R = null; endRoundUI(); phase = 'off'; } if (RK) RK.hide(); if (map.top.on) map.top.exit(); map.hud.goal(null); for (const k of ['rb-time', 'rb-score', 'rb-role', 'rb-net', 'rb-mis', 'rb-scan']) map.hud.chip(k, null); chipK = {}; }
  function netSync() {
    const D = NM.D, m = D.m; if (!m || !NM.on) return;
    if (!isRB(m)) return;
    NM.host = m.host === NM.pid;
    const S = D.s || {}, now = performance.now();
    for (const id in S) if (S[id] !== NM.seenAt[id + '#']) { NM.seenAt[id + '#'] = S[id]; NM.seenAt[id] = now; }
    if (m.st === 'play' && m.seq !== NM.seq) roundFromNet(m);
    if (m.st !== NM.st) { const was = NM.st; NM.st = m.st; if (m.st === 'lobby') { toLobbyUI(); lobbyShow(); } else if (m.st === 'end' && was === 'play') finalBoard(); else if (m.st === 'play') lobbyHide(); }
    if (R) for (const q of SP) if (q.kind === 'remote') { const v = S[q.pid]; if (v) netSet(q, v); }
    const Ev = D.ev || {}, nw = [];
    for (const id in Ev) { if (NM.seen.has(id)) continue; const e = Ev[id]; if (!e || typeof e.t !== 'number') continue; NM.seen.add(id); if (e.q === NM.seq) nw.push(e); }
    nw.sort((a, b) => a.t - b.t).forEach(onEv);
    hostCheck(m);
    if (NM.ui) lobbyDraw();
  }
  // 판 자리: 반장 = tm%1000 ≥ 100 · 스파이 = 나머지(tm ≠ 99 · 차례순 · 7명까지)
  function slotsFrom(P) {
    const ids = Object.keys(P).filter(id => P[id] && typeof P[id].tm === 'number' && P[id].tm !== 99), ord = id => P[id].tm % 100;
    const mk = id => ({ kind: id === NM.pid ? 'me' : 'remote', pid: id, name: String(P[id].n || '친구').slice(0, 8) });
    const g = ids.filter(id => P[id].tm % 1000 >= 100).sort((a, b) => ord(a) - ord(b))[0];
    const spies = ids.filter(id => id !== g).sort((a, b) => ord(a) - ord(b)).slice(0, SMAX).map(mk);
    return { guard: g ? mk(g) : { kind: 'remote', pid: null, name: '반장' }, spies };
  }
  function roundFromNet(m) {
    NM.seq = m.seq; const lvl = +String(m.arena).slice(2) || 0; NM.lvl = lvl;
    const sl = slotsFrom(NM.D.p || {}); if (!sl.spies.length) return;
    lobbyHide(); WZ = null; if (RK) RK.start(NM.room + '#' + (m.seq - (m.goal || 0)));   // RANK-1: 경기 번호 = seq − goal
    beginRound({ seq: m.seq, t0: m.t0, lvl, seed: seedOf(m.t0, m.seq), guard: sl.guard, spies: sl.spies, round: m.goal, rounds: m.time });
    const Ev = NM.D.ev || {};   // 늦게 들어옴: 이미 난 사건(시간 순)
    Object.keys(Ev).filter(id => Ev[id] && Ev[id].q === m.seq && !NM.seen.has(id)).sort((a, b) => (Ev[a].t || 0) - (Ev[b].t || 0)).forEach(id => { NM.seen.add(id); onEv(Ev[id]); });
  }
  function hostCheck(m) {
    const P = NM.D.p || {}, now = performance.now(); if (!P[NM.pid]) return;
    const quiet = (id, ms) => NM.seenAt[id] && now - NM.seenAt[id] > ms;
    if (m.host !== NM.pid && (!P[m.host] || quiet(m.host, 30000))) {
      const first = Object.keys(P).filter(id => id === NM.pid || !quiet(id, 30000)).sort((a, b) => (P[a].on || 0) - (P[b].on || 0))[0];
      if (first === NM.pid && !NM.claim) { NM.claim = true; nreq('/m/host', 'PUT', NM.pid).catch(() => {}).finally(() => { NM.claim = false; }); }
    }
    if (NM.host && m.st === 'play') for (const id in P) if (id !== NM.pid && quiet(id, 90000)) { nreq('/p/' + id, 'DELETE').catch(() => {}); delete NM.seenAt[id]; }
  }
  // 친구 스파이 몸: 서버 시각으로 앞질러 그리되(숨바꼭질 NET-LAG) 로봇 빠르기 가까이로만 따라감(1.4배 · 4m 넘게 벌어지면 바로) — 끊겨 움직이면 반장에게 '사람 티'가 나므로
  function netSet(a, v) {
    if (v === a.net) return; const ts = v[6] || 0, p = a.net, pts = a.nts || 0;
    if (p && ts && pts && ts <= pts) return;
    if (p && ts && pts && (v[0] - p[0]) ** 2 + (v[2] - p[2]) ** 2 < 64) { const g = Math.max(0.04, Math.min(1, (ts - pts) / 1000)); let vx = (v[0] - p[0]) / g, vz = (v[2] - p[2]) / g; const sp = Math.hypot(vx, vz), cap = cfg.v * 1.15; if (sp > cap) { vx *= cap / sp; vz *= cap / sp; } a.nvx = vx; a.nvz = vz; }
    else { a.nvx = 0; a.nvz = 0; }
    a.net = v; a.nts = ts; a.nt = performance.now();
  }
  function netActor(a, dt) {
    const v = a.net; if (!v || !a.alive) return;
    const up = (v[7] || 0) / 2000, age = Math.max(0, Math.min(0.5, a.nts ? (sNow() - a.nts) / 1000 + up : (performance.now() - a.nt) / 1000)), tx = v[0] + (a.nvx || 0) * age, tz = v[2] + (a.nvz || 0) * age;
    const dx = tx - a.x, dz = tz - a.z, d = Math.hypot(dx, dz), stp = cfg.v * 1.4 * dt;
    if (d > 4) { a.x = tx; a.z = tz; } else if (d > stp) { a.x += dx / d * stp; a.z += dz / d * stp; } else { a.x = tx; a.z = tz; }
    a.y += (v[1] - a.y) * Math.min(1, dt * 12); a.h = v[3]; a.scan = !!((v[4] | 0) & 1);
  }
  function netEmit(e) { const id = 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); const o = { k: e.k, q: NM.seq, t: { '.sv': 'timestamp' } }; for (const k of ['by', 'who', 'n']) if (typeof e[k] === 'number') o[k] = e[k];
    nreq('/ev/' + id, 'PUT', o).catch(() => { map.hud.toast('😥 보내지 못했어요 — 인터넷을 확인해 주세요', 2.5); }); }   // 내 사건도 서버에서 돌아올 때 적용(netSync)
  function netSendNow() { netSend(0, true); }
  const NF = () => (NM.lag && NM.lag >= 300 ? 1 : 2);
  function netSend(dt, beat) {
    NM.sendT -= dt;
    const busy = R && ME.role === 'spy' && (phase === 'play' || phase === 'count');
    if ((NM.sendT <= 0 || beat) && NM.busyS < NF()) {
      NM.sendT = busy ? 0.1 : 2; NM.busyS++; const t1 = NM.lastSend = performance.now(), w1 = Date.now(), q = SP[ME.s], p = map.player.get();
      const h = q ? q.h : p.h;
      nreq('/s/' + NM.pid, 'PUT', [r2(p.x), r2(p.y), r2(p.z), Math.round(h), (q && q.scan ? 1 : 0) | (q && !q.alive ? 2 : 0), (NM.beatN = (NM.beatN + 1) % 100), { '.sv': 'timestamp' }, Math.min(5000, NM.lag || 0)])
        .then(r => { const rtt = performance.now() - t1; NM.lag = Math.round(NM.lag ? NM.lag * 0.7 + rtt * 0.3 : rtt);
          if (r && typeof r[6] === 'number') { NM.offs.push([rtt, r[6] - (w1 + rtt / 2)]); if (NM.offs.length > 24) NM.offs.shift(); let b = NM.offs[0]; for (const o of NM.offs) if (o[0] < b[0]) b = o; NM.off = b[1]; } })
        .catch(() => {}).finally(() => { NM.busyS--; });
    }
  }
  // 방장: 판 끝 → 다음 반장(아직 안 해 본 사람 · 차례순) → 다 했으면 경기 끝 · 같은 편이 두 판 연속 이기면 진 편 도움 한 단계
  function hostRun(t, endAt) {
    if (!NM.host || !R || NM.adv) return; const m = NM.D.m; if (!m || m.st !== 'play' || m.seq !== R.seq) return;
    if (t < endAt + cfg.end || NM.advSeq === R.seq) return;   // 한 판은 한 번만 넘김(PATCH 응답이 서버 소식보다 먼저 오면 같은 판을 또 넘기며 따라잡기가 두 번 쌓이던 것)
    NM.adv = true; NM.advSeq = R.seq;
    const side = res ? res.side : (done >= T ? 's' : 'g');
    NM.streak.push(side); if (NM.streak.length >= 2) { const [x, y] = NM.streak.slice(-2); if (x === y) { NM.lvl = Math.max(-2, Math.min(2, NM.lvl + (x === 'g' ? 1 : -1))); NM.streak = []; } }
    const P = NM.D.p || {}, rounds = m.time || 1, next = (m.goal || 0) + 1;
    if (next >= rounds) { nreq('/m', 'PATCH', { st: 'end' }).catch(() => { NM.advSeq = null; }).finally(() => { NM.adv = false; setTimeout(() => { if (NM.on && NM.host && NM.D.m && NM.D.m.st === 'end') nreq('/m/st', 'PUT', 'lobby').catch(() => {}); }, 9000); }); ctlMatch(m.seq, 'end'); return; }
    const ids = Object.keys(P).filter(id => P[id] && typeof P[id].tm === 'number');
    const was = id => P[id].tm >= 1000 || P[id].tm % 1000 >= 100, ordOf = id => (P[id].tm === 99 ? 50 + ids.indexOf(id) : P[id].tm % 100);
    const fresh = ids.filter(id => !was(id)).sort((a, b) => ordOf(a) - ordOf(b));
    if (!fresh.length || ids.length < 2) { nreq('/m', 'PATCH', { st: 'end' }).catch(() => { NM.advSeq = null; }).finally(() => { NM.adv = false; }); return; }
    const g = fresh[0], up = { 'm/seq': m.seq + 1, 'm/goal': next, 'm/t0': Math.round(sNow() + 4500), 'm/arena': 'rb' + NM.lvl };   // 판마다 준비 ≈7.5초(새 반장이 하는 법을 읽게)
    for (const id of ids) up['p/' + id + '/tm'] = ordOf(id) % 100 + (id === g ? 100 : 0) + (was(id) ? 1000 : 0);
    nreq('', 'PATCH', up).catch(() => { NM.advSeq = null; }).finally(() => { NM.adv = false; });
    nreq('/ev', 'DELETE').catch(() => {});
  }
  async function hostStart() {
    const m = NM.D.m || {}, P = NM.D.p || {}, ids = Object.keys(P).filter(id => P[id]).sort((a, b) => (P[a].on || 0) - (P[b].on || 0));
    if (ids.length < 2) { map.hud.toast('🤖 로봇인 척은 2명부터 — 혼자면 🎮 → 로봇인 척', 3); return; }
    NM.lvl = 0; NM.streak = [];
    const rounds = Math.min(8, ids.length);
    const up = { 'm/st': 'play', 'm/seq': (m.seq || 0) + 1, 'm/goal': 0, 'm/time': rounds, 'm/t0': Math.round(sNow() + 7000), 'm/arena': 'rb0' };   // 첫 판 준비 ≈10초(하는 법 읽기)
    ids.forEach((id, k) => { up['p/' + id + '/tm'] = k + (k === 0 ? 100 : 0); });
    await nreq('/ev', 'DELETE'); await nreq('', 'PATCH', up); ctlMatch((m.seq || 0) + 1, 'rcount');
  }
  // ---------- 대기실 · 끝 화면 ----------
  function lobbyShow() { map.player.freeze(true); lobbyDraw(); }
  function lobbyHide() { if (NM.ui) { NM.ui.remove(); NM.ui = null; } }
  function lobbyDraw(msg) {
    if (!NM.ui) { NM.ui = document.createElement('div'); NM.ui.className = 'wg-lobby rb-lobby ttl-keep';
      NM.ui.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:40;width:min(470px,94vw);max-height:90vh;overflow:auto;box-sizing:border-box;pointer-events:auto;background:#fffdf6;color:#1d3557;border:3px solid #1d3557;border-radius:16px;padding:14px 16px;box-shadow:0 8px 30px rgba(0,0,0,.35);font:600 15px/1.45 system-ui,-apple-system,"Malgun Gothic",sans-serif';
      for (const t of ['keydown', 'keyup']) NM.ui.addEventListener(t, e => e.stopPropagation());
      NM.ui.addEventListener('click', lobbyClick); document.body.appendChild(NM.ui); document.exitPointerLock?.(); }
    const D = NM.D, m = D.m, P = D.p || {};
    if (!m || !isRB(m)) { NM.ui.innerHTML = '<b>🤖 로봇인 척 — 친구와</b><div style="margin-top:6px">' + (msg || '불러오는 중…') + '</div>'; return; }
    const bt = (a, t, on, x = '') => '<button data-w="' + a + '" style="font:inherit;font-weight:800;border:0;border-radius:9px;padding:6px 11px;cursor:pointer;' + (on ? 'background:#1d3557;color:#fff' : 'background:#e8edf3;color:#1d3557') + x + '">' + t + '</button>';
    const ids = Object.keys(P).filter(id => P[id]).sort((a, b) => (P[a].on || 0) - (P[b].on || 0)), hostN = NM.host ? '나' : P[m.host] ? esc(P[m.host].n) : '방장';
    const S = Math.max(1, Math.min(SMAX, ids.length - 1));
    let h = '<div style="font-weight:900;font-size:18px">🤖 로봇인 척 — 친구와</div>'
      + '<div style="margin-top:6px;font-size:14px;color:#1d3557;background:#eef4ff;border-radius:9px;padding:6px 8px">🕵️ <b>반장</b>: 색으로 깜빡인 구역에서 수상한 로봇을 골라 📸<br>🤖 <b>스파이</b>: 노란 빛기둥에서 E(스캔) · 로봇처럼 똑바로 걷기</div>'
      + '<div style="margin-top:6px;font-size:13px;color:#4a5b70">🕵️ CCTV 반장 1명 = 하늘에서 봐요 · 🤖 나머지 = 스파이(로봇 ' + K + '대와 똑같은 몸)<br>모두 한 번씩 반장(' + Math.min(8, ids.length) + '판) · 한 판 ' + (cfg.count + playOf(S) + cfg.end) + '초 안팎 · 스파이 ' + S + '명이면 팀 ⭐ ' + goalOf(S) + '개 vs 📸 ' + shotsOf(S) + '번</div>'
      + '<div style="margin-top:8px;padding:7px 9px;border-radius:9px;background:#eef4ff">👥 ' + ids.map(id => (id === NM.pid ? '<b>⭐ ' + esc(NM.name) + '(나)</b>' : esc(P[id].n)) + net1(id)).join(' · ') + '</div>'
      + (ids.length > 8 ? '<div style="margin-top:4px;font-size:12px">8명까지 — 나머지는 구경하다 다음 경기에 들어와요</div>' : '')
      + (ids.some(id => netMs(id) >= 450) ? '<div style="margin-top:4px;font-size:12px;color:#b4232c">🔴 인터넷이 느린 친구가 있어요 — 그 친구 로봇이 끊겨 보이면 반장에게 들킬 수 있어요(와이파이 가까이 · 다른 탭 닫기)</div>' : '');
    if (!NM.lastBoard && RK && !NM.lbTry && m.st !== 'play') { NM.lbTry = true; NM.lastBoard = RK.last(NM.room + '#' + (m.seq - (m.goal || 0))); }   // 대기실에서 새로고침해도 지난 표(이 탭에 있으면)
    const fb = NM.lastBoard; if (fb) h += fb;   // RANK-1: 지난 경기 순위표(표 상자째 — standings.js lobby())
    if (m.st === 'play') h += '<div style="margin-top:8px;font-weight:800">⏳ 경기 중이에요 — 다음 판부터 같이 해요</div>';
    else if (roomLed()) h += '<div style="margin-top:10px;font-weight:800;color:#2b5a96">🏠 방장이 ▶ 시작했어요 — 친구들이 다 들어오면 곧 3·2·1</div>';
    else if (NM.host) h += '<div style="display:flex;gap:6px;justify-content:flex-end;align-items:center;margin-top:10px">' + (ids.length < 2 ? '<span style="font-size:13px;color:#b4232c">친구가 한 명 더 있어야 해요</span>' : '') + bt('start', '▶ 시작!', true, ';font-size:17px;padding:8px 18px') + '</div>';
    else h += '<div style="margin-top:10px">방장 ⭐' + hostN + '이(가) ▶ 시작을 누르면 모두 같이 시작해요</div>';
    h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px"><span style="font-size:12px;color:#5a6b80">방 ' + esc(NM.room.slice(1)) + '</span>' + bt('leave', '🚪 나가기') + '</div>';
    if (NM.ui.dataset.h !== h) { NM.ui.dataset.h = h; NM.ui.innerHTML = h; }
  }
  function netMs(id) { const v = (NM.D.s || {})[id]; return id === NM.pid ? NM.lag || 0 : v && v[7] || 0; }
  function net1(id) { const ms = netMs(id); return ms ? ' <span style="font-size:11px;color:#5a6b80" title="왕복 ' + ms + 'ms">' + (ms < 250 ? '🟢' : ms < 450 ? '🟡' : '🔴') + '</span>' : ''; }
  async function lobbyClick(e) {
    e.stopPropagation(); const b = e.target.closest('[data-w]'); if (!b || !NM.on) return; const w = b.dataset.w;
    try { if (w === 'start' && NM.host) await hostStart(); else if (w === 'leave') map.quit(); }
    catch (er) { map.hud.toast('저장하지 못했어요 — 인터넷을 확인해 주세요', 2.5); }
  }
  function finalBoard() {
    toLobbyUI();
    // RANK-1: 끝 카드 = 🥇🥈🥉 + 명탐정·연기왕 · 대기실 = 지난 경기 순위표
    RK.end(); NM.lastBoard = RK.lobby();
    card('<div style="font-size:1.35em">🏁 경기 끝!</div>' + RK.podium() + '<div style="margin-top:6px;font-size:.85em">' + RK.awards() + '</div>', 6);
    map.tone(523, 0, 0.15, 'sine', 0.1); map.tone(659, 0.15, 0.15, 'sine', 0.1); map.tone(784, 0.3, 0.3, 'sine', 0.1);
    if (!roomBack('🤖 로봇인 척', NM.lastBoard, 6500)) setTimeout(() => { if (NM.on && !dead) lobbyShow(); }, 2500);
  }

  // ---------- 시작 ----------
  if (NETM) netEnter(); else soloAsk();
  return {
    tick,
    stop() { dead = true; removeEventListener('keydown', keyH); removeEventListener('pointermove', onHover); howClose(); if (RK) RK.stop(); helpSet(false); document.body.classList.remove('rb-spy', 'rb-top'); MRING.visible = false; clearScan(); for (const b of beacons) b.remove(); beacons = []; scanBtn.remove(); gp.remove(); logEl.remove(); meterEl.remove(); tagBox.remove(); css.remove(); if (cardEl) { cardEl.remove(); cardEl = null; } clearTimeout(cardT);
      hotOff.remove(); map.player.speed(1); map.player.show(true); map.player.jump(true); map.player.run(true); netLeave();
      for (const t of TEX.values()) t.dispose(); for (const g of GEOS) g.dispose(); for (const m of MATS) m.dispose(); },
    get state() { return R ? { phase, t: +tNow.toFixed(1), role: ME.role, lvl: R.lvl || 0, T, done, shots, playT, sel, signals: sigLog.length, host: NETM ? NM.host : true,
      spies: SP.map(q => ({ s: q.s, e: q.e, kind: q.kind, name: q.name, alive: q.alive, mis: q.mis, x: +q.x.toFixed(1), z: +q.z.toFixed(1), ms: q.ms.map(p => ({ x: +PO[p].sx.toFixed(2), z: +PO[p].sz.toFixed(2), room: C.ZL[PO[p].zi].label })), done: [...q.done] })), res } : { phase: 'lobby', host: NM.host }; },
    get net() { return { on: NM.on, host: NM.host, room: NM.room, seq: NM.seq, lvl: NM.lvl, lag: NM.lag, st: NM.st }; },
    get crowd() { return C; }, robotAt: (k) => { const q = E[k]; return q ? { x: q.x, y: q.y, z: q.z, scan: q.scan } : null; },
    select: e => { sel = e; paintGP(); }, shoot, scan: scanStart,
    netStart: () => (NM.host ? hostStart() : null),
  };
}
