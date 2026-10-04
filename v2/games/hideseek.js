// 숨바꼭질 대작전(HS-2 · 10-04 사용자 '게임 자체로 가치가 있으니 제대로 기획 · 한 판 60초 넘으면 루즈 · 사람 대 사람으로 밸런스 · 그 게임들 밸런스도 참고')
//   구조 = 🏃 도망자 1명(위에서 봄 — 지도) vs 👀 술래 여럿(3인칭 · 같은 속도) — 정보는 수가 적은 쪽에게(마리오 체이스·팩맨 VS와 같은 원리)
//     ※ 1차(HS-1)는 거꾸로(술래 1 vs 위에서 보는 여럿)였다 — 시뮬레이션: 술래가 2%만 이김 → 구조를 바꿈
//   한 판 = 준비 3초 + 숨기 10초(술래 눈 가림 · 마리오 체이스 10초) + 찾기 40초 + 결과 4초 ≈ 57초 · 모두 한 번씩 도망자(잡은 사람이 다음 도망자 — 팩맨 VS · 아직 안 해 본 사람일 때)
//   🏃 도망자: 하늘에서 보기 따라가기(map.top) · 반지름 14m 안 술래와 술래 눈(빨간 부채꼴)이 보임 · WASD/화살표(화면 위 = W) · 땅 톡 = 그곳으로 달림 · F/👻 3초 투명(다시 15초)
//            · ⭐ 별(찾기 20초 · 술래들에게서 20m 넘게 먼 곳 · 마리오 체이스 슈퍼 스타) = 6초 동안 빠르고(×1.25) 안 잡힘
//   👀 술래: 3인칭 · 🔥 가까워요(도망자 15m 안 — 방향은 모름 · 정확한 거리를 주면 도망자 12%만 버팀) · 📢 누가 보면 '○○실!'(방 이름만 · 1.5초 뒤)
//            · 마지막 10초 = 5초마다 도망자가 있는 방이 반짝 · 닿으면(1m) 잡음 — 판정은 도망자 화면(봇 도망자는 방장)
//   ⚖️ 따라잡기(친구 대결): 같은 편이 두 판 연속 이기면 진 편을 한 단계 도움(-2~+2 — 반짝·🔥 거리·별·투명) — 시뮬레이션 27~50%
//   시뮬레이션(사람 흉내 봇 · 학교 1층 + 앞뜰 고리 · 400판): 도망자 버팀 43% · 잡히는 때 가운데 20초 · 1 vs 3 48% · 1 vs 2 59% · 2 vs 5(6명 이상) 한 명당 잡힘 54%
//     다시 재기: simulate(SD2.map, {바꿀 값}, 판 수, { runners, hunters, start: [12.5, -35.5], pred }) — 개발용(놀이에서는 안 부름)
//   혼자(봇) = 🏃 도망자(술래 봇 4) · 👀 술래(술래 봇 3 + 도망자 봇) · 친구 대결(hideseek_vs) = 함께하기 방 · match/c<번호>(물총과 같은 자리 — m.arena 'hs…'로 구별) · 빈자리 = 술래 봇
//   사람(NPC)은 술래·과녁이 아니다 — 봇은 장난감 로봇(술래 = 빨간 조끼 · 도망자 = 파란 조끼)
export const meta = { id: 'hideseek', title: '숨바꼭질 대작전', api: 1 };
// ===================================================================================================
// 핵심(봇 머리 · 시뮬레이션 공용) — 사람처럼 노는 봇: 반응 지연 · 실수 · 친구에게 외치기 · 🔥 어림
// ===================================================================================================
export const BAL = {
  count: 3, hide: 10, seek: 40, end: 4,     // 준비 · 숨기(술래 눈 가림 · 마리오 체이스 10초) · 찾기 · 결과 — 합 57초
  // 🏃 도망자(위에서 봄)
  R: 14,                                   // 위에서 보이는 반지름(m) — 밖의 술래는 안 보임(시뮬레이션: 10~22m 차이 작음 · 화면이 너무 넓으면 위에서 다 보여 긴장이 없다)
  rWalk: 4.2, rRun: 7.5,                   // 걷기·달리기 = 술래와 같은 속도(마리오 체이스 · 술래 115%로 올려도 시뮬레이션 차이 1%p)
  inv: 3, invCd: 15, invNear: 1.3,         // 👻 투명: 초 · 다시 쓰기 · 이 거리 안이면 보임
  // 👀 술래(3인칭)
  hRun: 7.5, eff: 0.9,                     // eff = 봇·시뮬레이션만(사람은 길을 딱 맞게 못 간다)
  fov: 110, sight: 25, catchR: 1.0,
  meter: 2, meterErr: 0.6, meterEvery: 4, meterUse: 0.6, hotR: 25,   // 📏 2 = 🔥 가까워요(15m · 방향 없음) — 1(거리 어림) = 도망자 5~12%
  stepR: 0,                                // 달리는 발자국(벽 너머) — 0 = 없음(있으면 도망자 0%)
  pingLast: 20, pingEvery: 5, pingR: 6,     // 마지막 20초 = 5초마다 반짝 — 도망자 둘레 6m 동그라미(예전 = 방 이름만 → 바깥 구역이 넓어 안 맞음)
  crouch: 1,                               // 🙇 봇 도망자도 숨을 자리에서 웅크림(사람 아이처럼 — 시뮬레이션 반영)
  stam: 6, stamRe: 0.5,                    // 🏃 힘(HS-3): 달리기 6초 · 안 달리면 초당 0.5 차오름 — 넓힌 둘레(250m 고리)에서 힘이 없으면 도망자가 끝없이 돌아 70~78% 이김 → 44%
  star: 2, starAt: 20, starDur: 6, starBoost: 1.25,   // ⭐ 별(2 = 술래들에게서 20m 넘게 먼 곳 · 1 = 가운데 — 가운데는 술래 출발점이라 도망자 29%로 떨어짐)
  callDelay: 1.5, callEvery: 2,            // 📢 '과학실이야!' — 방 이름만 · 1.5초 뒤 · 2초마다(정확한 자리를 주면 도망자 5%)
  // 사람 흉내(봇·시뮬레이션)
  hReact: 0.35, rReact: 0.5, rMistake: 0.12,
};

export function createCore(nav, see, cfg, rng = Math.random) {
  const N = nav.raw, n = N.count, E = N.e, Y = N.y, MASK = N.mask, S = N.S;
  const X = i => N.X(i), Z = i => N.Z(i);
  const Zs = [], ZI = new Map();   // 경기장 구역 { z, cell, n, corr, exits }
  const exitsOf = c => { const z = nav.zoneOf(c), q = z && ZI.get(z.id); return q ? q.exits : 2; };
  let inA = new Uint8Array(n), list = new Int32Array(0);
  // ---------- 경기장 ----------
  function setArena(pred) {
    inA = new Uint8Array(n); const L = [], zc = new Map();
    for (let i = 0; i < n; i++) { if (MASK[i]) continue; const z = nav.zoneOf(i); if (!pred(z, X(i), Y[i], Z(i))) continue; inA[i] = 1; L.push(i);
      if (z) { let r = zc.get(z.id); if (!r) zc.set(z.id, r = { z, cells: [] }); r.cells.push(i); } }
    // 구역 없는 칸(문턱·구역 사이 틈 — 학교 칸의 0.9%)은 이웃이 경기장이면 경기장(3번 = 0.9m) — 안 그러면 문턱에서 길이 끊기고 고깔이 복도 한가운데 선다
    for (let pass = 0; pass < 3; pass++) { const add = []; for (let i = 0; i < n; i++) { if (inA[i] || MASK[i] || nav.zoneOf(i) || Y[i] >= 0.6 || Y[i] < -0.6) continue;
        for (let d = 0; d < 4; d++) { const j = E[i * 4 + d]; if (j >= 0 && inA[j]) { add.push(i); break; } } }
      for (const i of add) { inA[i] = 1; L.push(i); } if (!add.length) break; }
    // 가장 큰 이어진 덩어리만(울타리·화단에 갇힌 작은 칸 무리는 뺌 — 봇·도망자가 못 나오는 곳이 없게)
    { const comp = new Int32Array(n).fill(-1); let best = -1, bestN = 0, cid = 0; const st = [];
      for (const s0 of L) { if (comp[s0] >= 0 || !inA[s0]) continue; let cnt = 0; st.push(s0); comp[s0] = cid;
        while (st.length) { const c = st.pop(); cnt++; for (let d = 0; d < 4; d++) { const j = E[c * 4 + d]; if (j >= 0 && inA[j] && comp[j] < 0 && Math.abs(Y[j] - Y[c]) < 0.6) { comp[j] = cid; st.push(j); } } }
        if (cnt > bestN) { bestN = cnt; best = cid; } cid++; }
      for (let k = L.length - 1; k >= 0; k--) if (comp[L[k]] !== best) { inA[L[k]] = 0; L.splice(k, 1); } }
    list = Int32Array.from(L); Zs.length = 0;
    for (const r of zc.values()) { if (r.cells.length < 40) continue; let bx = 0, bz = 0; for (const i of r.cells) { bx += X(i); bz += Z(i); } bx /= r.cells.length; bz /= r.cells.length;
      let best = r.cells[0], bd = 1e9; for (const i of r.cells) { const d = (X(i) - bx) ** 2 + (Z(i) - bz) ** 2; if (d < bd) { bd = d; best = i; } }
      // 나가는 문 수 = 다른 구역과 닿은 칸을 2.5m 넘게 떨어진 무리로 나눈 수(교실 앞문·뒷문 = 2 → 빙 돌 수 있음 · 1 = 막다른 방)
      const bc = []; for (const i of r.cells) for (let d = 0; d < 4; d++) { const j = E[i * 4 + d]; if (j >= 0 && inA[j] && !MASK[j]) { const zj = nav.zoneOf(j); if (zj && zj.id !== r.z.id) { bc.push(i); break; } } }
      const cl = []; for (const i of bc) { const x = X(i), z = Z(i); if (!cl.some(c => Math.hypot(c[0] - x, c[1] - z) < 2.5)) cl.push([x, z]); }
      const q = { z: r.z, id: r.z.id, cell: best, n: r.cells.length, corr: /복도|로비|마당|현관|산책로|끝/.test(r.z.label), exits: cl.length };
      Zs.push(q); ZI.set(r.z.id, q); }
    return { cells: list.length, zones: Zs.length, dead: Zs.filter(q => q.exits < 2).map(q => q.z.label) };
  }
  const snapA = (x, y, z, r = 1.5) => { const i = nav.snap(x, y, z, r); return i >= 0 && inA[i] ? i : -1; };
  const randCell = () => list[Math.floor(rng() * list.length)];
  // ---------- 거리 마당(여러 출발점 다익스트라 · 경기장 안만 · 칸 재사용) ----------
  const FB = []; let HK = new Float32Array(1 << 15), HV = new Int32Array(1 << 15), hn = 0;
  const hpush = (v, k) => { if (hn >= HK.length) { const a = new Float32Array(HK.length * 2); a.set(HK); HK = a; const b = new Int32Array(HV.length * 2); b.set(HV); HV = b; }
    let i = hn++; while (i) { const p = (i - 1) >> 1; if (HK[p] <= k) break; HK[i] = HK[p]; HV[i] = HV[p]; i = p; } HK[i] = k; HV[i] = v; };
  let popK = 0;
  const hpop = () => { const v = HV[0]; popK = HK[0]; const k = HK[--hn], vv = HV[hn]; let i = 0;
    for (;;) { let c = 2 * i + 1; if (c >= hn) break; if (c + 1 < hn && HK[c + 1] < HK[c]) c++; if (HK[c] >= k) break; HK[i] = HK[c]; HV[i] = HV[c]; i = c; }
    if (hn) { HK[i] = k; HV[i] = vv; } return v; };
  function field(slot, srcs, maxLen) {
    const B = FB[slot] || (FB[slot] = { D: new Float32Array(n), st: new Uint32Array(n), gen: 0, t: -1, key: '' });
    const g = ++B.gen; hn = 0;
    for (const s of srcs) if (s >= 0) { B.D[s] = 0; B.st[s] = g; hpush(s, 0); }
    while (hn) { const c = hpop(), dc = popK; if (dc > B.D[c]) continue; if (dc > maxLen) break;
      for (let d = 0; d < 4; d++) { const j = E[c * 4 + d]; if (j < 0 || MASK[j] || !inA[j]) continue; const nd = Math.fround(dc + S + Math.abs(Y[j] - Y[c]) * 0.5);   // Float32 칸과 같은 정밀도(올림 반올림 칸이 끝없이 다시 들어가지 않게 — nav.js distField와 같은 함정)
        if (B.st[j] !== g || nd < B.D[j]) { B.st[j] = g; B.D[j] = nd; hpush(j, nd); } } }
    return B;
  }
  const fd = (B, i) => (i >= 0 && B.st[i] === B.gen ? B.D[i] : Infinity);
  // ---------- 움직임(길 따라 · 사람·봇 공용) ----------
  const cellOf = a => { if (a.ci >= 0 && Math.abs(X(a.ci) - a.x) < 0.2 && Math.abs(Z(a.ci) - a.z) < 0.2) return a.ci; const i = nav.snap(a.x, a.y, a.z, 1.5); a.ci = i; return i; };
  function goTo(a, cell) {
    if (cell < 0) return false; const c0 = cellOf(a); if (c0 < 0) return false;
    if (c0 === cell) { a.path = null; return true; }
    const r = N.path(c0, cell, { maxExp: 9000, bad: i => !inA[i] }); if (!r.ok || r.pts.length < 2) return false;
    a.path = r.pts; a.pi = 1; a.goal = cell; return true;
  }
  function move(a, dt, sp) {
    a.vx = a.vz = 0; if (!a.path || a.pi >= a.path.length) { a.path = null; return true; }
    let left = sp * dt; const x0 = a.x, z0 = a.z;
    while (left > 0 && a.pi < a.path.length) { const p = a.path[a.pi], ex = p[0] - a.x, ez = p[2] - a.z, d = Math.hypot(ex, ez);
      if (d <= left) { a.x = p[0]; a.z = p[2]; a.y = p[1]; a.pi++; left -= d; } else { a.x += ex / d * left; a.z += ez / d * left; a.y += (p[1] - a.y) * Math.min(1, dt * 6); left = 0; } }
    const mx = a.x - x0, mz = a.z - z0; a.vx = mx / dt; a.vz = mz / dt; if (mx * mx + mz * mz > 1e-6) a.h = (Math.atan2(mx, -mz) * 180 / Math.PI + 360) % 360;
    if (a.pi >= a.path.length) { a.path = null; return true; } return false;
  }
  const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  const gauss = () => { let u = 0, v = 0; while (!u) u = rng(); while (!v) v = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  // 시야: 술래 눈(1.35) → 도망자 가슴(서 있으면 0.85 — 도망자 몸은 0.8배 · 🙇 웅크리면 0.4) · fov° · range m · 벽·가구(보이는 높이) 가림 = 엔진 see
  //   HS-4(10-04 교사 '기물이 있는데 숨는 역할을 못 함 — 사라지는 게 아니라 그냥 가려져서 사람이면 우연히 놓칠 수 있게'): 웅크리면 책상(0.75)·덤불·차·화단 뒤에서 눈높이 줄이 막힘
  const EYE = { x: 0, y: 0, z: 0, h: 0 }, TO = { x: 0, y: 0, z: 0 };
  const sees = (h, r, fov, range) => { const d = dist(h, r); if (d > range) return false; if (r.inv > 0 && d > cfg.invNear) return false;
    EYE.x = h.x; EYE.y = h.y + 1.35; EYE.z = h.z; EYE.h = h.h || 0; TO.x = r.x; TO.y = r.y + (r.crouch ? 0.4 : 0.85); TO.z = r.z; return see(EYE, TO, fov, range); };

  // ---------- 👀 술래 머리 ----------
  //   알게 되는 것: ① 직접 봄(반응 0.35초) ② 친구가 외침(1초 뒤 · ±2m) ③ 거리계 어림(3초마다 · 오차 = 거리 × 0.35) ④ 달리는 발자국(12m · ±1.5m) ⑤ 마지막 15초 반짝
  //   할 일: 보이면 쫓기(가장 가까운 술래 = 바로 · 나머지 = 앞질러 막기) · 아는 자리로 · 모르면 안 가 본 방부터 · 3초마다 0.6초 둘러보기(360°)
  function huntInit(h) { h.b = { st: 'search', pT: 0, tT: 0, glT: 1 + rng() * 2, seeT: 0, last: null, K: null, mT: rng() * cfg.meterEvery, vis: new Map(), tz: null }; }
  function huntTick(h, W, dt) {
    const B = h.b; B.glT -= dt; if (B.glT < -0.6) B.glT = 2.4 + rng() * 1.6;
    const R = W.A.filter(a => a.role === 'run' && a.alive);
    if ((B.pT -= dt) <= 0) {   // 10Hz 감지
      B.pT = 0.1; let saw = null, sd = 1e9;
      for (const r of R) { const d = dist(h, r); if (d < sd && sees(h, r, B.glT < 0 ? 360 : cfg.fov, cfg.sight)) { saw = r; sd = d; } }
      if (saw) { B.seeT += 0.1; B.last = { x: saw.x, y: saw.y, z: saw.z, t: W.t, r: saw }; W.call(saw, h); } else B.seeT = 0;
      // 발자국
      for (const r of R) if (r.running && dist(h, r) < cfg.stepR) B.K = { x: r.x + gauss() * 1.5, y: r.y, z: r.z + gauss() * 1.5, t: W.t, src: 'step' };
      // 거리계(가장 가까운 도망자)
      if (cfg.meter && (B.mT -= 0.1) <= 0) { B.mT = cfg.meterEvery; let r0 = null, d0 = 1e9; for (const r of R) { const d = dist(h, r); if (d < d0) { d0 = d; r0 = r; } }
        if (r0 && (!B.K || W.t - B.K.t > 2) && rng() < cfg.meterUse) {
          if (cfg.meter === 2) { if (d0 < cfg.hotR) { const a = rng() * 6.283, q = 4 + rng() * 8; B.K = { x: h.x + Math.cos(a) * q, y: h.y, z: h.z + Math.sin(a) * q, t: W.t, src: 'meter' }; } }   // 🔥 가까워요(방향은 모름 — 둘레를 뒤짐)
          else { const e = Math.min(18, Math.max(5, d0 * cfg.meterErr)); B.K = { x: r0.x + gauss() * e, y: r0.y, z: r0.z + gauss() * e, t: W.t, src: 'meter' }; } } }
      // 친구 외침 · 반짝(W.know)
      const k = W.know; if (k && k.t <= W.t && (!B.K || k.t0 > B.K.t)) B.K = { x: k.x, y: k.y, z: k.z, t: k.t0, src: k.src };
    }
    if ((B.tT -= dt) > 0) return;
    const chasing = B.last && W.t - B.last.t < 0.15 && B.seeT >= cfg.hReact;
    B.tT = chasing ? 0.3 : 0.7;
    if (chasing) {
      const r = B.last.r; B.st = 'chase';
      let mine = true; for (const o of W.A) if (o !== h && o.role === 'hunt' && o.alive && o.b && o.b.st === 'chase' && dist(o, r) < dist(h, r) - 0.5) { mine = false; break; }
      let c = -1; if (!mine) { const lx = r.x + r.vx * 1.1, lz = r.z + r.vz * 1.1; c = snapA(lx, r.y, lz, 2.5); }
      if (c < 0) c = snapA(r.x, r.y, r.z, 1.5);
      goTo(h, c); return;
    }
    if (B.last && W.t - B.last.t < 2.5) { B.st = 'go'; if (dist(h, B.last) > 1.5) goTo(h, snapA(B.last.x, B.last.y, B.last.z, 2)); else B.last = null; return; }
    if (B.K && W.t - B.K.t < 7) { B.st = 'go'; if (Math.hypot(h.x - B.K.x, h.z - B.K.z) > 2.2) { if (!goTo(h, snapA(B.K.x, B.K.y, B.K.z, 4))) B.K = null; } else { B.K = null; B.glT = 0; } return; }
    // 찾기: 안 가 본 방(25초 안에 내가 간 곳 · 다른 술래가 가는 곳 제외)
    B.st = 'search'; const ci = cellOf(h), here = ci >= 0 ? nav.zoneOf(ci) : null;
    if (here) { if (!B.vis.has(here.id) || W.t - B.vis.get(here.id) > 3) { if (B.tz && here.id === B.tz.id) B.glT = 0; } B.vis.set(here.id, W.t); }
    if (B.tz && here && here.id === B.tz.id) B.tz = null;
    if (!B.tz || !h.path) {
      let best = null, bs = 1e9; const taken = new Set(W.A.filter(o => o !== h && o.role === 'hunt' && o.b && o.b.tz).map(o => o.b.tz.id));
      for (const q of Zs) { const v = B.vis.get(q.id); if (v != null && W.t - v < 25) continue; if (taken.has(q.id)) continue;
        const s = Math.hypot(X(q.cell) - h.x, Z(q.cell) - h.z) + rng() * 10 + (q.corr ? 6 : 0); if (s < bs) { bs = s; best = q; } }
      if (!best) { B.vis.clear(); return; }
      B.tz = best; if (!goTo(h, best.cell) || !h.path) { B.vis.set(best.id, W.t); B.tz = null; B.tT = 0.05; }
    }
  }
  // ---------- 🏃 도망자 머리(위에서 봄) ----------
  //   반지름 R 안 술래만 앎(벽 너머도 — 위에서 보니까) · 술래의 부채꼴(보고 있는지)도 앎 · 반응 0.5초 · 12%는 덜 좋은 길을 고름(아이 실수)
  //   편함 = 숨을 자리로 걸어가 가만히 · 불안(술래 길 거리 < 14) = 걸어서 비켜남 · 위험(< 8 또는 술래가 봄) = 달려 도망(발자국) · 봤고 7m 안 = 👻
  function runInit(r) { r.b = { tT: rng() * cfg.rReact, mem: new Map(), hide: -1, slot: 1 + 2 * (r.i % 8), pd: new Map(), dPrev: null, goal: -1, goalS: null }; }
  function runTick(r, W, dt) {
    const B = r.b;
    for (const h of W.A) if (h.role === 'hunt' && h.alive && dist(h, r) <= cfg.R) B.mem.set(h.i, { x: h.x, y: h.y, z: h.z, t: W.t, h });
    if ((B.tT -= dt) > 0) return; B.tT = cfg.rReact * (0.8 + rng() * 0.4);
    const K = []; for (const [k, m] of B.mem) { if (W.t - m.t > 2.5) B.mem.delete(k); else K.push(m); }
    if (W.phase === 'hide') { r.mode = 'hide'; if (B.hide < 0) { r.running = true; flight(r, W); } return; }   // 숨는 시간 = 술래가 못 봄 → 달려서 멀리(술래 출발점에서 길 거리 25~55m · 문 둘 방)
    if (W.star && W.star.on && !r.star) {   // ⭐ 별: 술래보다 확실히 먼저 닿으면 먹으러
      const sc = W.star.cell, Mf = field(B.slot + 1, [cellOf(r)], 60), dm = fd(Mf, sc);
      let dh = Infinity; if (K.length) { const Fh = field(B.slot, K.map(m => snapA(m.x, m.y, m.z, 2)).filter(i => i >= 0), 64); dh = fd(Fh, sc); }
      if (dm < 45 && dh > dm * cfg.hRun * cfg.eff / cfg.rRun + 4) { r.running = true; r.mode = 'star'; if (B.goal !== sc || !r.path) { goTo(r, sc); B.goal = sc; } return; } }
    if (!K.length) { calm(r, W, K); return; }
    const srcs = K.map(m => snapA(m.x, m.y, m.z, 2)).filter(i => i >= 0);
    const F = field(B.slot, srcs, 64), me = cellOf(r), dmin = fd(F, me);
    let seen = false; for (const m of K) if (W.t - m.t < 0.2 && sees(m.h, r, m.h.b ? (m.h.b.glT < 0 ? 360 : cfg.fov) : cfg.fov, cfg.sight)) seen = true;
    if (seen && dmin < 7 && r.inv <= 0 && r.invCd <= 0 && W.phase === 'seek') { r.inv = cfg.inv; W.stat(r, 'inv'); }
    let closing = false; for (const m of K) { const p = B.pd.get(m.h.i); if (p != null && fd(F, me) < 1e9) { /* */ } } 
    const dPrev = B.dPrev; B.dPrev = dmin; closing = dPrev != null && dmin < dPrev - 0.5;
    let ne = 99; for (const m of K) ne = Math.min(ne, Math.hypot(m.x - r.x, m.z - r.z));
    const danger = seen || dmin < 8, uneasy = dmin < 12 || ne < 9 || (closing && dmin < cfg.R + 6) || (exitsOf(me) < 2 && dmin < cfg.R + 6);
    r.running = danger || (uneasy && !cfg.stepR); r.mode = danger ? 'danger' : uneasy ? 'uneasy' : 'calm'; if (danger || uneasy) r.crouch = false;
    if (!danger && !uneasy) { if (r.path && B.goal >= 0 && W.t - (B.flT || -9) < 2.5) return; B.goal = -1; calm(r, W, K); return; }   // 막 도망치던 길은 끝까지
    B.hide = -1; B.flT = W.t;
    const M = field(B.slot + 1, [me], 46), rs = cfg.rRun / (cfg.hRun * cfg.eff);   // rs = 내 걸음이 술래보다 몇 배 빠른가
    // 좋은 곳 = 술래보다 먼저 닿고(여유 = 술래 길 거리 − 내 길 거리/rs ≥ 2) · 거기서 술래와 멀고 · 문이 둘
    const score = c => { const dm = fd(M, c), dh = Math.min(64, fd(F, c)), mg = dh - dm / rs; return (mg >= 2 ? 0 : (mg - 2) * 3) + dh * 0.5 + (exitsOf(c) >= 2 ? 3 : -5); };
    const safe = i => !inA[i] || fd(F, i) - fd(M, i) / rs < 0.8;   // 가는 길에 술래가 먼저 닿는 칸 = 막힘(술래 쪽으로 뛰어들지 않게)
    if (B.goal >= 0 && r.path && fd(M, B.goal) > 2) { const g = score(B.goal); if (g > (B.goalS ?? -1e9) - 4) { B.goalS = g; return; } }   // 가던 곳이 아직 괜찮으면 계속(왔다 갔다 안 함)
    const C = []; for (let k = 0; k < 360; k++) { const c = list[Math.floor(rng() * list.length)], dm = fd(M, c); if (dm < 5 || dm > 45) continue; C.push({ c, s: score(c) + rng() * 3 }); }
    if (!C.length) return;
    C.sort((a, b) => b.s - a.s);
    if (rng() < cfg.rMistake) { const q = C[Math.floor(rng() * Math.min(6, C.length))]; if (goTo(r, q.c)) { B.goal = q.c; B.goalS = q.s; } return; }   // 아이 실수
    for (let k = 0; k < Math.min(6, C.length); k++) { const q = C[k], rr = N.path(me, q.c, { maxExp: 9000, bad: safe });
      if (rr.ok && rr.pts.length > 1) { r.path = rr.pts; r.pi = 1; B.goal = q.c; B.goalS = q.s; return; } }
    if (goTo(r, C[0].c)) { B.goal = C[0].c; B.goalS = C[0].s; }
  }
  function flight(r, W) {
    const B = r.b, F = field(B.slot, [snapA(W.H0.x, W.H0.y, W.H0.z, 3)], 70);
    let best = -1, bs = -1e9;
    for (let k = 0; k < 120; k++) { const c = randCell(), d = fd(F, c); if (!(d > 22 && d < 58)) continue; const z = nav.zoneOf(c);
      let s = (exitsOf(c) >= 2 ? 6 : -4) + (z && !/복도|로비|마당|현관/.test(z.label) ? 4 : 0) + rng() * 10 - Math.abs(d - 40) * 0.1;
      for (const o of W.A) if (o !== r && o.role === 'run' && o.b && o.b.hide >= 0) s -= Math.max(0, 10 - Math.hypot(X(c) - X(o.b.hide), Z(c) - Z(o.b.hide)));
      if (s > bs) { bs = s; best = c; } }
    if (best >= 0) { B.hide = best; goTo(r, best); }
  }
  function calm(r, W, K) {
    const B = r.b; r.running = false; r.mode = 'calm';
    if (B.hide >= 0 && (r.path || cellOf(r) === B.hide || Math.hypot(X(B.hide) - r.x, Z(B.hide) - r.z) < 1.5)) { if (!r.path) { B.stay = true; r.crouch = cfg.crouch && W.phase === 'seek'; } return; }   // 숨을 자리에 닿으면 웅크림(사람 아이처럼)
    let best = -1, bs = -1e9;
    for (let k = 0; k < 50; k++) { const c = randCell(), z = nav.zoneOf(c); let md = 30; for (const m of K) md = Math.min(md, Math.hypot(X(c) - m.x, Z(c) - m.z));
      if (W.H0) md = Math.min(md, Math.hypot(X(c) - W.H0.x, Z(c) - W.H0.z) * 0.7);
      let s = md + (z && !/복도|로비|마당|현관/.test(z.label) ? 4 : 0) + (exitsOf(c) >= 2 ? 5 : -6) + rng() * 6;
      for (const o of W.A) if (o !== r && o.role === 'run' && o.alive) s -= Math.max(0, 6 - Math.hypot(X(c) - o.x, Z(c) - o.z));
      if (Math.hypot(X(c) - r.x, Z(c) - r.z) > 45) s -= 20;
      if (s > bs) { bs = s; best = c; } }
    B.hide = best; r.crouch = false; goTo(r, best);
  }
  return { setArena, snapA, randCell, field, fd, cellOf, goTo, move, dist, sees, huntInit, huntTick, runInit, runTick, get list() { return list; }, get zones() { return Zs; }, inA: () => inA };
}

// ===================================================================================================
// 시뮬레이션: 사람처럼 노는 봇끼리 rounds판 → 승률·잡힌 시간·긴장 시간
//   cfg = BAL 덮어쓰기 · o = { mode: 'A'(도망자 1 vs 술래 n) | 'B'(술래 1 vs 숨는 n · 잡히면 술래 편), runners, hunters, arena: 술래 출발 자리 등 }
// ===================================================================================================
export async function simulate(map, over = {}, rounds = 50, o = {}) {
  const cfg = { ...BAL, ...over }, nav = await map.nav(), rng = Math.random;
  const core = createCore(nav, map.see, cfg, rng);
  const ar = core.setArena(o.pred || arenaPred);
  const res = [];
  for (let k = 0; k < rounds; k++) {
    const A = []; const nR = o.runners || 1, nH = o.hunters || 4;
    const start = o.start ? core.snapA(o.start[0], 0, o.start[1], 3) : core.randCell();
    const sx = nav.raw.X(start), sz = nav.raw.Z(start), sy = nav.raw.y[start];
    for (let i = 0; i < nR + nH; i++) { const a = { i, role: i < nR ? 'run' : 'hunt', x: sx + (rng() - 0.5), y: sy, z: sz + (rng() - 0.5), h: 0, vx: 0, vz: 0, alive: true, inv: 0, invCd: 0, ci: -1, path: null, running: false };
      if (a.role === 'run') core.runInit(a); else core.huntInit(a); A.push(a); }
    const W = { A, t: 0, phase: 'hide', know: null, H0: { x: sx, y: sy, z: sz },
      call(r, h) { if (W.know && W.know.src === 'call' && W.know.t0 > W.t - cfg.callEvery) return;   // '과학실이야!' = 방(구역) 이름만 — 방 안 어디쯤인지는 모름
        const z = nav.zoneOf(core.cellOf(r)), jx = z ? (rng() - 0.5) * Math.min(10, z.x1 - z.x0) * 0.7 : 0, jz = z ? (rng() - 0.5) * Math.min(10, z.z1 - z.z0) * 0.7 : 0;
        W.know = { x: r.x + jx, y: r.y, z: r.z + jz, t: W.t + cfg.callDelay, t0: W.t, src: 'call' }; },
      stat(r, k) { S[k] = (S[k] || 0) + 1; } };
    const S = { caught: [], threat: 0, chase: 0, quiet: 0, maxQuiet: 0, inv: 0 };
    const dt = 0.1, T = cfg.hide + cfg.seek; let quietRun = 0, nextPing = cfg.seek - cfg.pingLast;
    for (let t = 0; t < T; t += dt) {
      W.t = t; W.phase = t < cfg.hide ? 'hide' : 'seek'; const ts = t - cfg.hide;
      if (W.phase === 'seek' && cfg.pingLast && ts >= nextPing) { nextPing += cfg.pingEvery; const r = A.find(a => a.role === 'run' && a.alive);   // 반짝 = 그 방(구역)이 빛남 — 방 안 어디쯤인지는 모름
        if (r && cfg.pingR) { const a = rng() * 6.283, q = rng() * cfg.pingR; W.know = { x: r.x + Math.cos(a) * q, y: r.y, z: r.z + Math.sin(a) * q, t: W.t, t0: W.t, src: 'ping' }; }
        else if (r) { const z = nav.zoneOf(core.cellOf(r)), cx = z ? Math.max(z.x0 + 1, Math.min(z.x1 - 1, r.x + (rng() - 0.5) * (z.x1 - z.x0) * 0.6)) : r.x, cz = z ? Math.max(z.z0 + 1, Math.min(z.z1 - 1, r.z + (rng() - 0.5) * (z.z1 - z.z0) * 0.6)) : r.z;
          W.know = { x: cx, y: r.y, z: cz, t: W.t, t0: W.t, src: 'ping' }; } }
      if (cfg.star && W.phase === 'seek' && !W.star && ts >= cfg.starAt) { let c = -1;
        if (cfg.star === 2) { const H = A.filter(q => q.role === 'hunt' && q.alive); for (let k = 0; k < 80 && c < 0; k++) { const q = core.randCell(); if (H.every(h => Math.hypot(nav.raw.X(q) - h.x, nav.raw.Z(q) - h.z) > 20)) c = q; } }   // 술래들에게서 20m 넘게 먼 곳
        if (c < 0) c = core.snapA(o.starAt ? o.starAt[0] : sx, 0, o.starAt ? o.starAt[1] : sz, 3); if (c >= 0) W.star = { on: true, cell: c, x: nav.raw.X(c), z: nav.raw.Z(c) }; }
      for (const a of A) { if (!a.alive) continue;
        if (a.role === 'run') { if (a.inv > 0 && (a.inv -= dt) <= 0) { a.inv = 0; a.invCd = cfg.invCd; } else if (a.invCd > 0) a.invCd -= dt;
          if (a.star > 0 && (a.star -= dt) <= 0) a.star = 0;
          if (W.star && W.star.on && Math.hypot(a.x - W.star.x, a.z - W.star.z) < 1.2) { W.star.on = false; a.star = cfg.starDur; S.star = (S.star || 0) + 1; }
          core.runTick(a, W, dt);
          if (cfg.stam) { if (a.st == null) a.st = cfg.stam; const run = a.running && a.st > 0 && W.phase === 'seek'; if (run) a.st = Math.max(0, a.st - dt); else if (!a.running) a.st = Math.min(cfg.stam, a.st + dt * cfg.stamRe); a.runOK = a.st > 0 || W.phase !== 'seek'; }
          core.move(a, dt, (a.running && a.runOK !== false ? cfg.rRun : cfg.rWalk) * (a.star > 0 ? cfg.starBoost : 1)); }
        else if (W.phase === 'seek') { core.huntTick(a, W, dt);
          if (cfg.dash) { a.dcd = (a.dcd || 0) - dt; a.dt = (a.dt || 0) - dt; if (a.dcd <= 0 && a.b.st === 'chase' && a.b.last && core.dist(a, a.b.last) < 7) { a.dt = cfg.dash; a.dcd = cfg.dashCd; } }
          core.move(a, dt, cfg.hRun * cfg.eff * (a.dt > 0 ? cfg.dashK : 1)); } }
      if (W.phase !== 'seek') continue;
      let near = false, anyChase = false;
      for (const h of A) { if (h.role !== 'hunt' || !h.alive) continue; if (h.b.st === 'chase') anyChase = true;
        for (const r of A) { if (r.role !== 'run' || !r.alive) continue; const d = core.dist(h, r); if (d < 12) near = true;
          if (d <= cfg.catchR && Math.abs(h.y - r.y) < 1.2 && !(r.star > 0)) { r.alive = false; S.caught.push(+ts.toFixed(1)); (S.how || (S.how = [])).push((r.mode || '?') + '/' + h.b.st + '/' + (h.b.K ? h.b.K.src : '-') + '/' + (nav.zoneOf(core.cellOf(r)) || { label: '?' }).label + (r.inv > 0 ? '/inv' : ''));
            if (o.mode === 'B') { const z = { i: A.length, role: 'hunt', x: r.x, y: r.y, z: r.z, h: 0, vx: 0, vz: 0, alive: true, inv: 0, invCd: 0, ci: -1, path: null }; core.huntInit(z); z.b.tT = 2; A.push(z); } } } }
      if (o.trace && k < o.trace && Math.abs(ts * 2 - Math.round(ts * 2)) < 0.05) { const r = A[0], z = nav.zoneOf(core.cellOf(r)); (S.tr || (S.tr = [])).push(ts.toFixed(1) + ' R(' + r.x.toFixed(0) + ',' + r.z.toFixed(0) + ' ' + (z ? z.label : '?') + ' ' + (r.mode || '') + (r.running ? ' run' : '') + (r.inv > 0 ? ' inv' : '') + (r.path ? '' : ' still') + ') ' + A.filter(a => a.role === 'hunt').map(h => h.b.st[0] + Math.round(core.dist(h, r)) + (h.b.K ? '/' + h.b.K.src[0] : '')).join(' ')); }
      if (anyChase) S.chase += dt; if (near) { S.threat += dt; quietRun = 0; } else { quietRun += dt; S.maxQuiet = Math.max(S.maxQuiet, quietRun); }
      if (!A.some(a => a.role === 'run' && a.alive)) break;
    }
    S.left = A.filter(a => a.role === 'run' && a.alive).length; res.push(S);
    if (k % 5 === 4) await new Promise(r => setTimeout(r, 0));
  }
  // 요약
  const nR = o.runners || 1, sum = (f) => res.reduce((s, r) => s + f(r), 0) / res.length;
  const catches = res.flatMap(r => r.caught).sort((a, b) => a - b), med = catches.length ? catches[Math.floor(catches.length / 2)] : null;
  return { arena: ar, rounds, runWin: +(sum(r => r.left > 0 ? 1 : 0) * 100).toFixed(0), allCaught: +(sum(r => r.left === 0 ? 1 : 0) * 100).toFixed(0), caughtPer: +(sum(r => r.caught.length) / nR * 100).toFixed(0),
    medCatch: med, first: +(sum(r => r.caught.length ? r.caught[0] : cfg.seek)).toFixed(1), threat: +(sum(r => r.threat) / cfg.seek * 100).toFixed(0), chase: +(sum(r => r.chase) / cfg.seek * 100).toFixed(0),
    how: (() => { const m = {}; for (const r of res) for (const h of r.how || []) { const k = h.split('/').slice(0, 2).join('/'); m[k] = (m[k] || 0) + 1; } return m; })(), where: (() => { const m = {}; for (const r of res) for (const h of r.how || []) { const k = h.split('/')[3]; m[k] = (m[k] || 0) + 1; } return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 8); })(), src: (() => { const m = {}; for (const r of res) for (const h of r.how || []) { const k = h.split('/')[2]; m[k] = (m[k] || 0) + 1; } return m; })(),
    star: +sum(r => r.star || 0).toFixed(2), maxQuiet: +sum(r => r.maxQuiet).toFixed(1), inv: +sum(r => r.inv || 0).toFixed(2), tr: res.slice(0, o.trace || 0).map(r => (r.tr || []).join('\n') + '\n => caught ' + r.caught.join(',')) };
}

// ===================================================================================================
// 놀이
// ===================================================================================================
const MDB = 'https://class-rpg-6f409-default-rtdb.asia-southeast1.firebasedatabase.app/metaverse/match/';
const START = [12.5, -32.8];   // 술래·도망자가 같이 서는 곳 = 가운데 로비 앞 주 복도(로비 안은 북쪽에 가구가 있어 막힘)
// 바깥 = 본관 둘레 한 바퀴(HS-3 · 10-04 교사 '야외 한 바퀴를 다 돌아 각 문으로 갈 수 있어야 · 서쪽 문이 막혀 있음 · 서쪽 위로 텃밭 사이길까지 둘레를 돌게'):
//   남 앞뜰 산책로·현관 앞 → 서 체육관 앞 마당·서쪽 대지(서관 서쪽 띠 — 측문 밖) → 북 주차장·주차장(북쪽 띠)·뒷길·급식동 뒤·텃밭 길·텃밭(사이길)·텃밭 앞 길
//   → 동 큰 나무 잔디밭·텃밭 동쪽·텃밭 쉼터·동관 뒤뜰·마당 동쪽 입구·본관 동쪽 끝 · 가운데 마당 · 구역 id로(이름이 같은 구역이 있다) · 넓은 구역은 띠만(OUTCLIP x0, z0, x1, z1)
const OUTZ = new Set(['front-walk', 'entrance-porch', 'gym-front-yard', 'gym-front-yard-2', 'west-yard', 'parking', 'parking-north', 'back-lane', 'back-lane-n', 'cafe-back', 'garden-path', 'garden', 'garden-lane', 'big-tree-lawn', 'garden-east', 'garden-deck', 'east-yard', 'court-east', 'main-east', 'court']);
const OUTCLIP = { 'west-yard': [-54, -64, -40, -22], 'parking-north': [-48, -64, -1.3, -56.5], garden: [10, -72, 40.5, -59.5] };
const RINGBOX = [-54, -72, 60, -12.4];   // 구역 없는 땅(문턱·벽돌 보도 — 마당 동쪽 입구 ↔ 본관 동쪽 끝 사이 길 등)은 이 상자 안이면 경기장(가장 큰 덩어리만 남김)
export const arenaPred = (z, x, y, zz) => { if (y >= 0.6 || y <= -0.6) return false;
  if (!z) return x >= RINGBOX[0] && x <= RINGBOX[2] && zz >= RINGBOX[1] && zz <= RINGBOX[3];
  if (z.floor !== 1) return false; if (z.indoor) return !/계단|체육관|버스/.test(z.label); if (!OUTZ.has(z.id)) return false;
  const c = OUTCLIP[z.id]; return !c || (x >= c[0] && x <= c[2] && zz >= c[1] && zz <= c[3]); };
// ⚖️ 따라잡기 단계(+ = 도망자 도움 · − = 술래 도움) — simulate(HS-3 넓힌 둘레 · 1 vs 4)로 잰 도망자 버팀: -2 28% · -1 32% · 0 45% · +1 56% · +2 66%
const LVL = { '-2': { stam: 4, pingLast: 25, hotR: 30, star: 0, invCd: 15, starAt: 20 }, '-1': { stam: 5, pingLast: 25, hotR: 30, star: 2, invCd: 15, starAt: 20 }, '0': { stam: 6, pingLast: 20, hotR: 25, star: 2, invCd: 15, starAt: 20 },
  '1': { stam: 8, pingLast: 15, hotR: 25, star: 2, invCd: 12, starAt: 20 }, '2': { stam: 10, pingLast: 10, hotR: 20, star: 2, invCd: 10, starAt: 15 } };
const LVL_T = { '-2': '술래 도움 2단계', '-1': '술래 도움 1단계', '0': '', '1': '도망자 도움 1단계', '2': '도망자 도움 2단계' };

export default async function start(map, params = {}) {
  const THREE = map.three, NETM = params.mode === 'net';
  let dead = false;
  map.player.freeze(true);
  const ban0 = map.hud.banner('숨바꼭질 준비 중…', 30);
  const nav = await map.nav();
  if (dead || map.gone) return {};
  ban0.remove();
  const cfg = { ...BAL, ...LVL['0'] }, rng = Math.random;
  const core = createCore(nav, map.see, cfg, rng);
  core.setArena(arenaPred);
  const ZS = core.zones, zIdx = id => ZS.findIndex(q => q.id === id);
  const NX = nav.raw.X, NZ = nav.raw.Z, NY = nav.raw.y;
  const coarse = (() => { try { return matchMedia('(pointer: coarse)').matches || document.body.classList.contains('touch'); } catch (e) { return false; } })();
  const fmt = s => Math.floor(s / 60) + ':' + String(Math.max(0, Math.floor(s % 60))).padStart(2, '0');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const startCell = core.snapA(START[0], 0, START[1], 3), SX = NX(startCell), SY = NY[startCell], SZ = NZ(startCell);

  // ---------- 경기장 경계 = 주황 고깔(밖으로 나가면 마지막 자리로) ----------
  {
    const L = core.list, inA = core.inA(), E = nav.raw.e, pts = [];
    for (let k = 0; k < L.length; k++) { const i = L[k]; for (let d = 0; d < 4; d++) { const j = E[i * 4 + d]; if (j < 0 || inA[j] || Math.abs(NY[j] - NY[i]) > 0.6) continue;
      const x = (NX(i) + NX(j)) / 2, z = (NZ(i) + NZ(j)) / 2; if (!pts.some(p => Math.abs(p[0] - x) < 1.3 && Math.abs(p[2] - z) < 1.3)) pts.push([x, NY[i], z]); } }
    const cones = map.mk.many('cone', Math.min(pts.length, 220), { color: 0xff7a1a, glow: true });
    for (let k = 0; k < cones.count; k++) cones.set(k, pts[k][0], pts[k][1] + 0.02, pts[k][2], 0.8);
  }

  // ---------- 모양(장난감 로봇 · 술래 빨강 / 도망자 파랑 조끼) — 부위마다 정점색 한 메시(watergun과 같은 식) ----------
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
  function inst(geo, mat, n) { const m = new THREE.InstancedMesh(geo, mat, n); m.frustumCulled = false; for (let i = 0; i < n; i++) m.setMatrixAt(i, ZERO); m.setColorAt(0, _c.set(0xffffff)); for (let i = 1; i < n; i++) m.setColorAt(i, _c); map.add(m); return m; }
  const TB = 0xd6dee8, NA = 8;
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
  // 술래 눈(도망자 화면만 · 바닥 빨간 부채꼴 110° · 7m)
  const fanGeo = new THREE.CircleGeometry(7, 18, Math.PI / 2 - (55 * Math.PI / 180), 110 * Math.PI / 180).rotateX(-Math.PI / 2); GEOS.push(fanGeo);
  const fanMat = new THREE.MeshBasicMaterial({ color: 0xff4a4a, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide, fog: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }); MATS.push(fanMat);
  const FAN = new THREE.InstancedMesh(fanGeo, fanMat, NA); FAN.frustumCulled = false; FAN.renderOrder = 2; for (let i = 0; i < NA; i++) FAN.setMatrixAt(i, ZERO); map.add(FAN);
  // 이름표(사람만)
  const TAGS = new Array(NA).fill(null);
  function tagFor(i, txt, run) {
    let t = TAGS[i]; if (t && t.userData.txt === txt + run) return t;
    if (!t) { t = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false })); t.scale.set(1.3, 0.33, 1); t.visible = false; map.add(t); TAGS[i] = t; }
    const c = document.createElement('canvas'); c.width = 256; c.height = 64; const g = c.getContext('2d');
    g.fillStyle = run ? 'rgba(59,130,246,.94)' : 'rgba(232,72,72,.94)'; g.beginPath(); g.roundRect(4, 6, 248, 52, 22); g.fill();
    g.fillStyle = '#fff'; g.font = '800 32px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt.slice(0, 8), 128, 34);
    if (t.material.map) t.material.map.dispose(); t.material.map = new THREE.CanvasTexture(c); t.material.map.colorSpace = THREE.SRGBColorSpace; t.material.needsUpdate = true; t.userData.txt = txt + run; return t;
  }
  const star3 = map.mk.many('star', 1, { color: 0xffd23c, glow: true });
  let starMk = null;

  // ---------- 상태 ----------
  //   R = 한 판 { seq, t0(시계 ms), lvl, slots: [{ kind:'me'|'remote'|'bot', pid, name, role }], humans }
  //   ACT = 이번 판 배우(자리 = slots 순서 · 도망자 먼저)
  let R = null, ACT = [], ME = -1, phase = 'off', W = null, starD = null, finT = null, blind = null, res = null, matchEnd = false;
  const LED = new Map();   // 이번 경기 기록: 이름 → { run: [버틴 초], ct: 잡은 수 }
  const led = n => { let r = LED.get(n); if (!r) LED.set(n, r = { run: [], ct: 0 }); return r; };
  let arT = 0, arOut = 0, arSafe = null;
  let invBtnK = '', chipK = {}, uiT = 0, seeT = 0, seeWho = -1, callT = {}, nextPing = 0, hotT = 0;
  const clock = () => (NETM ? sNow() : Date.now());

  // ---------- 기술 단추(👻 투명 · 도망자) ----------
  const btn = document.createElement('div'); btn.className = 'hs-btn';
  btn.style.cssText = 'position:fixed;right:calc(22px + env(safe-area-inset-right));bottom:calc(' + (coarse ? 24 : 96) + 'px + env(safe-area-inset-bottom));width:78px;height:78px;border-radius:50%;z-index:24;display:none;flex-direction:column;align-items:center;justify-content:center;'
    + 'font:800 12px/1.1 system-ui,-apple-system,"Malgun Gothic",sans-serif;color:#fff;background:rgba(124,92,214,.9);border:3px solid rgba(255,255,255,.9);box-shadow:0 3px 0 rgba(0,0,0,.2);touch-action:none;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;cursor:pointer';
  btn.innerHTML = '<b style="font-size:30px;line-height:1">👻</b><span></span>';
  btn.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); useInv(); });
  document.body.appendChild(btn);
  const stamEl = document.createElement('div'); stamEl.className = 'hs-stam';
  stamEl.style.cssText = 'position:fixed;right:calc(22px + env(safe-area-inset-right));bottom:calc(' + ((coarse ? 24 : 96) + 86) + 'px + env(safe-area-inset-bottom));width:78px;z-index:24;display:none;font:800 12px/1 system-ui,-apple-system,"Malgun Gothic",sans-serif;color:#fff;text-align:center;text-shadow:0 1px 2px rgba(0,0,0,.6);pointer-events:none';
  stamEl.innerHTML = '<div>🏃 힘</div><div style="margin-top:3px;height:10px;border-radius:6px;background:rgba(15,25,45,.55);overflow:hidden;box-shadow:0 0 0 2px rgba(255,255,255,.85)"><i style="display:block;height:100%;width:100%;background:#5fd068;transition:width .15s"></i></div>';
  document.body.appendChild(stamEl);
  let stamK = '';
  function paintStam(a) { const k = !a || !a.alive || phase === 'res' ? 'off' : Math.round(a.st / cfg.stam * 20) + (a.tired ? 't' : ''); if (k === stamK) return; stamK = k;
    if (k === 'off') { stamEl.style.display = 'none'; return; } stamEl.style.display = btn.style.display === 'none' ? 'none' : 'block';
    const b = stamEl.querySelector('i'); b.style.width = Math.max(0, Math.min(100, a.st / cfg.stam * 100)) + '%'; b.style.background = a.tired ? '#e85d5d' : a.st < cfg.stam * 0.35 ? '#f2b84c' : '#5fd068'; }
  const paintBtn = () => { const a = ACT[ME]; if (!a) return; const k = a.inv > 0 ? '투명 ' + Math.ceil(a.inv) : a.invCd > 0 ? Math.ceil(a.invCd) + '초' : coarse ? '투명' : '투명 F';
    if (k === invBtnK) return; invBtnK = k; btn.lastChild.textContent = k; btn.style.opacity = a.inv > 0 || a.invCd <= 0 ? '1' : '.55'; };
  const chip = (k, t) => { if (chipK[k] === t) return; chipK[k] = t; map.hud.chip(k, t); };
  const keyF = e => { if (e.repeat) return; const a = ACT[ME]; if (!a || a.role !== 'run') return;
    if (e.code === 'KeyF') { e.preventDefault(); useInv(); } else if (e.code === 'KeyC') { e.preventDefault(); toggleCrouch(); } };
  // 🙇 웅크리기(HS-4): C(누를 때마다 바뀜) · 단추 — 엔진 웅크리기(느리게 기어감 · 몸이 낮아져 가구 뒤에 가려짐 — 사라지는 게 아님)
  const cbtn = document.createElement('div'); cbtn.className = 'hs-btn hs-cbtn';
  cbtn.style.cssText = 'position:fixed;right:calc(108px + env(safe-area-inset-right));bottom:calc(' + ((coarse ? 24 : 96) + 7) + 'px + env(safe-area-inset-bottom));width:64px;height:64px;border-radius:50%;z-index:24;display:none;flex-direction:column;align-items:center;justify-content:center;'
    + 'font:800 11px/1.1 system-ui,-apple-system,"Malgun Gothic",sans-serif;color:#fff;background:rgba(47,158,68,.9);border:3px solid rgba(255,255,255,.9);box-shadow:0 3px 0 rgba(0,0,0,.2);touch-action:none;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;cursor:pointer';
  cbtn.innerHTML = '<b style="font-size:24px;line-height:1">🙇</b><span>' + (coarse ? '웅크리기' : '웅크리기 C') + '</span>';
  cbtn.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); toggleCrouch(); });
  document.body.appendChild(cbtn);
  function toggleCrouch() { const a = ACT[ME]; if (!a || a.role !== 'run' || !a.alive || (phase !== 'hide' && phase !== 'seek')) return; const on = !map.player.crouched(); map.player.setCrouch(on); cbtn.style.outline = on ? '4px solid #ffd23c' : ''; if (on) map.hud.toast('🙇 웅크렸어요 — 책상·덤불·차 뒤에 있으면 술래 눈에 잘 안 띄어요(느려져요)', 2.2); }
  addEventListener('keydown', keyF);
  // 술래 눈 가림(숨는 시간)
  function blindOn(on, txt) {
    if (on && !blind) { blind = document.createElement('div'); blind.className = 'ttl-keep'; blind.style.cssText = 'position:fixed;inset:0;z-index:21;background:radial-gradient(circle,rgba(20,24,40,.93),rgba(6,8,16,.98));display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;font:800 clamp(18px,4vw,30px)/1.4 system-ui,-apple-system,"Malgun Gothic",sans-serif;text-align:center;pointer-events:none'; document.body.appendChild(blind); }
    if (!on && blind) { blind.remove(); blind = null; }
    if (blind && txt != null && blind.dataset.t !== txt) { blind.dataset.t = txt; blind.innerHTML = txt; }
  }

  // 알림 카드(여러 줄 — 배너는 한 줄) · 몇 초 뒤 사라짐
  let cardEl = null, cardT = 0;
  function card(html, sec = 3) {
    if (!cardEl) { cardEl = document.createElement('div'); cardEl.className = 'hs-card ttl-keep'; cardEl.style.cssText = 'position:fixed;left:50%;top:22%;transform:translateX(-50%);z-index:30;max-width:min(520px,92vw);box-sizing:border-box;padding:10px 16px;border-radius:14px;background:rgba(18,28,48,.9);color:#fff;font:700 clamp(14px,2.6vw,18px)/1.5 system-ui,-apple-system,"Malgun Gothic",sans-serif;text-align:center;pointer-events:none;box-shadow:0 6px 20px rgba(0,0,0,.3)'; document.body.appendChild(cardEl); }
    cardEl.innerHTML = html; cardEl.style.display = ''; clearTimeout(cardT); cardT = setTimeout(() => { if (cardEl) cardEl.style.display = 'none'; }, sec * 1000);
  }

  // ---------- 한 판 꾸리기 ----------
  function mkActor(i, s) {
    return { i, kind: s.kind, pid: s.pid || null, name: s.name, role: s.role, x: SX, y: SY, z: SZ, h: 0, vx: 0, vz: 0, alive: true, caughtT: null, inv: 0, invCd: 0, star: 0, running: false, st: null, tired: false, ci: -1, path: null, pi: 0, b: null, walk: 0,
      net: null, nt: 0, nvx: 0, nvz: 0, ox: SX, oz: SZ };
  }
  function applyLvl(l) { Object.assign(cfg, LVL[String(l)] || LVL['0']); }
  // 👥 인원 보정(10-04 '7명까지 하면?' → HS-3 넓힌 둘레에서 다시 잼): 도망자 2명에 술래 5명 이하면 술래 도움 −1(2 vs 5 60→47% · 2 vs 4 65→51%) · 그 밖은 0(1 vs 3 51% · 1 vs 6 41% · 2 vs 6 52%)
  const headBase = slots => { const rc = slots.filter(q => q.role === 'run').length, hc = slots.length - rc; return rc >= 2 && hc <= 5 ? -1 : 0; };
  function beginRound(r) {
    endRoundUI(); R = r; phase = 'count'; finT = null; starD = null; res = null; nextPing = cfg.seek - cfg.pingLast; callT = {}; chipK = {}; invBtnK = '';
    r.base = headBase(r.slots); r.eff = Math.max(-2, Math.min(2, (r.lvl || 0) + r.base)); applyLvl(r.eff); nextPing = cfg.seek - cfg.pingLast;
    ACT = r.slots.map((s, i) => mkActor(i, s)); ME = ACT.findIndex(a => a.kind === 'me');
    // 자리: 주 복도 한 줄 — 도망자 = 가운데 · 술래 = 양옆 1.6m 간격(걷는 칸에 맞춤)
    let kr = 0, kh = 0; for (const a of ACT) { const off = a.role === 'run' ? (kr++ ? 0.9 : 0) : (kh % 2 ? -1 : 1) * 1.6 * (1 + (kh++ >> 1));
      const c = core.snapA(SX + off, SY, SZ, 1.5); a.x = c >= 0 ? NX(c) : SX + off; a.y = c >= 0 ? NY[c] : SY; a.z = c >= 0 ? NZ(c) : SZ;
      a.ox = a.x; a.oz = a.z; a.h = a.role === 'run' ? 0 : (off > 0 ? 270 : 90); if (a.kind === 'bot') { if (a.role === 'run') core.runInit(a); else core.huntInit(a); } }
    W = { A: ACT, t: -3, phase: 'count', know: null, H0: { x: SX, y: SY, z: SZ }, star: null,
      call: (rr, h) => { if (W.know && W.know.src === 'call' && W.know.t0 > W.t - cfg.callEvery) return; const ci = core.cellOf(rr), z = ci >= 0 ? nav.zoneOf(ci) : null; emit({ k: 'see', by: h.i, who: rr.i, n: z ? zIdx(z.id) : -1 }); },
      stat() {} };
    const me = ACT[ME];
    map.player.freeze(true); map.player.speed(1); map.player.invisible(false);
    if (me) { map.player.teleport([me.x, me.y, me.z], { h: me.h }); }
    if (me && me.role === 'run') {
      if (!map.top.on) map.top.enter({ follow: true, playerKeys: true, vision: cfg.R, bar: false, floor: 1, d: 30, floorKeys: false, onTap: walkTo, onExit: askQuit,
        help: coarse ? '땅을 톡 = 그곳으로 달리기 · 🏃 힘이 다하면 걷기 · 🙇 웅크리면 가구 뒤에 가려져요 · 👻 = 3초 투명 · 빨간 부채꼴 = 술래 눈' : 'WASD·방향키 = 걷기 · Shift = 달리기(🏃 힘 6초) · C 🙇 웅크리기(가구 뒤에 가려짐) · 땅 클릭 = 그곳으로 · F 👻 투명 · 빨간 부채꼴 = 술래 눈' });
      btn.style.display = 'flex'; cbtn.style.display = 'flex'; cbtn.style.outline = ''; map.player.crouch(true); map.player.setCrouch(false); map.minimap.hide();
    } else { if (map.top.on) map.top.exit(); btn.style.display = 'none'; cbtn.style.display = 'none'; map.player.setCrouch(null); map.player.crouch(false); map.minimap.show({}); map.minimap.setMarks([]); }
    const runN = ACT.filter(a => a.role === 'run').map(a => a.kind === 'me' ? '나' : a.name).join(' · ');
    map.hud.goal(me ? (me.role === 'run' ? '🏃 도망자 — ' + cfg.seek + '초 버티기!' : '👀 술래 — 도망자(' + runN + ') 잡기!') : '👀 구경 — 다음 판부터 같이 해요');
    const lt = LVL_T[String(r.eff)] + (r.base ? ' (👥 인원 보정 ' + (r.base > 0 ? '+' : '') + r.base + ')' : '');
    card('<div style="font-size:1.25em">' + (me && me.role === 'run' ? '🏃 이번 판은 <b>내가 도망자</b>!' : '🏃 이번 판 도망자: <b>' + esc(runN) + '</b>') + '</div>'
      + (r.rounds ? '<div style="opacity:.8;font-size:.85em">' + (r.round + 1) + ' / ' + r.rounds + '판</div>' : '')
      + (me ? '<div style="opacity:.85;font-size:.85em">' + (me.role === 'run' ? '하늘에서 봐요 · 빨간 부채꼴 = 술래 눈 · 🏃 힘(달리기 6초 — 쉬면 차요) · 🙇 C 웅크려 가구 뒤에 · 👻 F' : '10초 동안 눈 감기 → 찾기 · 🔥 = 가까이 · 마지막 20초 반짝') + '</div>' : '')
      + (lt ? '<div style="color:#ffd23c;font-size:.85em">⚖️ 따라잡기 — ' + lt + '</div>' : ''), 3);
    if (!me) map.player.freeze(false);
    chip('hs-role', me ? (me.role === 'run' ? '🏃 도망자' : '👀 술래') : '👀 구경');
    star3.hide(0); if (starMk) { starMk.remove(); starMk = null; }
    if (map.top.on) map.top.marks([]);
  }
  function endRoundUI() { arSafe = null; clearRoute(); map.player.run(true); map.player.setCrouch(null); map.player.crouch(false); cbtn.style.display = 'none'; cbtn.style.outline = ''; stamEl.style.display = 'none'; stamK = ''; map.player.invisible(false); map.player.speed(1); blindOn(false); if (starMk) { starMk.remove(); starMk = null; } star3.hide(0); for (const t of TAGS) if (t) t.visible = false; hideBodies(); }
  function hideBodies() { for (let j = 0; j < NA; j++) { M.body.setMatrixAt(j, ZERO); M.bib.setMatrixAt(j, ZERO); M.leg.setMatrixAt(j * 2, ZERO); M.leg.setMatrixAt(j * 2 + 1, ZERO); M.arm.setMatrixAt(j * 2, ZERO); M.arm.setMatrixAt(j * 2 + 1, ZERO); FAN.setMatrixAt(j, ZERO); }
    M.body.instanceMatrix.needsUpdate = M.bib.instanceMatrix.needsUpdate = M.leg.instanceMatrix.needsUpdate = M.arm.instanceMatrix.needsUpdate = FAN.instanceMatrix.needsUpdate = true; }
  function setPhase(p) {
    if (p === phase) return; const was = phase; phase = p; W.phase = p === 'hide' ? 'hide' : 'seek';
    const me = ACT[ME];
    if (p === 'hide') {
      if (me && me.role === 'run') { map.player.freeze(false); map.hud.banner('🏃 지금 숨어요! 술래는 눈을 감았어요', 1.8); }
      else if (me) { map.player.freeze(true); }
    } else if (p === 'seek') {
      blindOn(false);
      if (me && me.role === 'hunt') { map.player.freeze(false); map.hud.banner('👀 찾아라!', 1.2); map.tone(784, 0, 0.16, 'square', 0.06); }
      else if (me && me.role === 'run') { map.hud.banner('👀 술래가 찾기 시작했어요!', 1.4); map.tone(523, 0, 0.12, 'square', 0.05); }
    } else if (p === 'res') { roundResult(was); }
  }

  // ---------- 도망자: 땅 톡 = 달려가기(키가 먼저) ----------
  let route = null, ri = 0, routeMk = null, stuckT = 0, lastD = 1e9;
  function clearRoute() { route = null; if (routeMk) { routeMk.remove(); routeMk = null; } map.player.steer(null); }
  function walkTo(pt) {
    const a = ACT[ME]; if (!a || a.role !== 'run' || !a.alive || (phase !== 'hide' && phase !== 'seek')) return;
    const me = map.player.get(); if (Math.hypot(pt.x - me.x, pt.z - me.z) < 1.2) return;   // 내 자리 톡 = 아무것도 안 함
    const to = core.snapA(pt.x, pt.y, pt.z, 2.5), from = core.snapA(me.x, me.y, me.z, 2);
    if (to < 0 || from < 0) { map.hud.toast('거기는 갈 수 없어요'); return; }
    const r = nav.raw.path(from, to, { maxExp: 12000, bad: i => !core.inA()[i] });
    if (!r.ok || r.pts.length < 2) { map.hud.toast('거기는 갈 수 없어요'); return; }
    clearRoute(); route = r.pts; ri = 1; stuckT = 0; lastD = 1e9;
    routeMk = map.mk.trail(route.map(p => [p[0], p[1] + 0.05, p[2]]), { color: 0x3b82f6 });
  }
  function routeTick(dt) {
    if (!route) return; const me = map.player.get();
    while (ri < route.length && Math.hypot(route[ri][0] - me.x, route[ri][2] - me.z) < 0.45) ri++;
    if (ri >= route.length) { clearRoute(); return; }
    const p = route[ri], d = Math.hypot(p[0] - me.x, p[2] - me.z);
    if (d < lastD - 0.05) { lastD = d; stuckT = 0; } else if ((stuckT += dt) > 1.5) { clearRoute(); return; }
    map.player.steer(p[0] - me.x, p[2] - me.z, ACT[ME] && ACT[ME].crouch ? 1.9 : ACT[ME] && ACT[ME].tired ? 4.2 : 7.0, false);   // 힘이 없으면 걸어서 · 웅크리면 기어서
  }
  function useInv() {
    const a = ACT[ME]; if (!a || a.role !== 'run' || !a.alive || phase !== 'seek' || a.inv > 0 || a.invCd > 0) return;
    a.inv = cfg.inv; map.player.invisible(true); map.tone(880, 0, 0.1, 'sine', 0.07); map.tone(1320, 0.08, 0.2, 'sine', 0.06);
  }

  // ---------- 사건(친구 대결 = Firebase ev · 혼자 = 바로) ----------
  function emit(e) { if (NETM && NM.on) netEmit(e); onEv(e); }
  function onEv(e) {
    if (!R || !W) return;
    const a = ACT[e.who], by = ACT[e.by];
    if (e.k === 'ct') {   // 잡힘
      if (!a || !a.alive) return; a.alive = false; a.caughtT = (e.n || 0) / 10; a.inv = 0;
      const byN = by ? (by.kind === 'me' ? '내가' : by.kind === 'bot' ? '🤖 술래 봇이' : by.name + '이(가)') : '술래가';
      const last = !ACT.some(q => q.role === 'run' && q.alive);   // 마지막 도망자면 결과 카드가 바로 뜬다(배너와 겹치지 않게)
      if (a.kind === 'me') { map.player.freeze(true); clearRoute(); map.player.invisible(false); map.player.setCrouch(false); cbtn.style.display = 'none'; if (!last) map.hud.banner('💥 잡혔어요! (' + Math.round(a.caughtT) + '초)', 2); map.tone(784, 0, 0.25, 'sine', 0.2); map.tone(622, 0.22, 0.4, 'sine', 0.2); }
      else { if (!last) map.hud.banner('🎉 ' + byN + ' ' + (a.kind === 'bot' ? '도망 로봇' : a.name) + '을(를) 잡았어요!', 1.8); map.tone(784, 0, 0.1, 'sine', 0.1); map.tone(1046, 0.1, 0.18, 'sine', 0.1); }
      if (by) by.cts = (by.cts || 0) + 1;
      if (!ACT.some(q => q.role === 'run' && q.alive) && finT == null) finT = Math.max(0, W.t);
    } else if (e.k === 'see') {   // 📢 봤어요 — 방 이름만
      const z = ZS[e.n]; if (!z || !a) return;
      const me = ACT[ME];
      if (me && me.role === 'hunt' && (!by || by.kind !== 'me')) map.hud.toast('📢 ' + (by ? (by.kind === 'bot' ? '🤖 봇' : by.name) : '술래') + ': ' + z.z.label + '!', 1.8);
      if (W) { const zz = z.z; const cx = Math.max(zz.x0 + 1, Math.min(zz.x1 - 1, a.x + (rng() - 0.5) * Math.min(10, zz.x1 - zz.x0) * 0.7)), cz = Math.max(zz.z0 + 1, Math.min(zz.z1 - 1, a.z + (rng() - 0.5) * Math.min(10, zz.z1 - zz.z0) * 0.7));
        W.know = { x: cx, y: a.y, z: cz, t: W.t + cfg.callDelay, t0: W.t, src: 'call' }; }
    } else if (e.k === 'st') {   // ⭐ 별 나타남
      const c = e.n; if (c == null || c < 0 || c >= nav.raw.count) return;
      starD = { on: true, cell: c, x: NX(c), y: NY[c], z: NZ(c) }; W.star = starD;
      starMk = map.mk.marker(starD.x, starD.y, starD.z, { color: 0xffd23c });
      if (map.top.on) map.top.marks([{ x: starD.x, y: starD.y + 0.5, z: starD.z, t: '⭐ 별!' }]);
      const me = ACT[ME]; map.hud.toast(me && me.role === 'run' ? '⭐ 별이 나타났어요 — 먹으면 6초 동안 빨라지고 안 잡혀요!' : '⭐ 별이 나타났어요 — 도망자가 먹으면 6초 동안 못 잡아요!', 2.6); map.tone(988, 0, 0.1, 'sine', 0.07); map.tone(1318, 0.1, 0.2, 'sine', 0.07);
    } else if (e.k === 'sp') {   // ⭐ 별 먹음
      if (!starD || !starD.on || !a) return; starD.on = false; star3.hide(0); if (starMk) { starMk.remove(); starMk = null; } if (map.top.on) map.top.marks([]);
      a.star = cfg.starDur;
      if (a.kind === 'me') { map.player.speed(cfg.starBoost); map.hud.banner('⭐ 무적! 6초 동안 빨라요', 1.5); } else map.hud.toast('⭐ 도망자가 별을 먹었어요 — 6초 동안 못 잡아요!', 2);
      map.tone(660, 0, 0.08, 'square', 0.06); map.tone(880, 0.08, 0.08, 'square', 0.06); map.tone(1320, 0.16, 0.2, 'square', 0.06);
    }
  }
  function ping() {   // 마지막 20초: 5초마다 반짝 — 도망자 둘레 6m 동그라미(가운데는 조금 비껴서 · 바닥 노란 고리 + 미니맵 별)
    const me = ACT[ME], L = [];
    for (const a of ACT) { if (a.role !== 'run' || !a.alive) continue;
      const an = rng() * 6.283, q = rng() * cfg.pingR * 0.7, cx = a.x + Math.cos(an) * q, cz = a.z + Math.sin(an) * q, ci = core.snapA(cx, a.y, cz, 3), z = ci >= 0 ? nav.zoneOf(ci) : nav.zoneOf(core.cellOf(a));
      L.push({ x: cx, z: cz, color: '#ffd23c', shape: 'star', blink: true, label: z ? z.label : '' });
      if (W) W.know = { x: cx, y: a.y, z: cz, t: W.t, t0: W.t, src: 'ping' };
      if (me && me.role === 'hunt') { const y = a.y + 0.08, R = cfg.pingR, pts = []; for (let k = 0; k <= 28; k++) { const t = k / 28 * 6.283; pts.push([cx + Math.cos(t) * R, y, cz + Math.sin(t) * R]); }
        const tr = map.mk.trail(pts, { color: 0xffd23c, width: 0.5 }); setTimeout(() => tr.remove(), 2600);
        map.hud.toast('✨ 반짝! 도망자는 ' + (z ? z.label + ' ' : '') + '노란 동그라미 안에!', 2); } }
    if (me && me.role === 'hunt') { map.minimap.setMarks(L); setTimeout(() => { if (!dead) map.minimap.setMarks([]); }, 2600); }
    if (me && me.role === 'run' && L.length) map.hud.toast('✨ 반짝! 술래들에게 내 둘레가 보였어요 — 옮겨요!', 1.8);
    map.tone(1175, 0, 0.08, 'sine', 0.05);
  }

  // ---------- 매 프레임 ----------
  function tick(dt) {
    if (!R || !W) return;
    const t = (clock() - R.t0) / 1000, T1 = cfg.hide + cfg.seek, endAt = finT != null ? cfg.hide + finT : T1;
    W.t = t - cfg.hide;   // 머리 시계 = 찾기 시작부터(숨기 동안 음수)
    const p = t < 0 ? 'count' : t < cfg.hide ? 'hide' : t < endAt ? 'seek' : 'res'; setPhase(p);
    const me = ACT[ME];
    // 나
    if (me) { const pp = map.player.get(); me.vx = (pp.x - me.x) / Math.max(dt, 1e-3); me.vz = (pp.z - me.z) / Math.max(dt, 1e-3); me.x = pp.x; me.y = pp.y; me.z = pp.z; me.h = pp.h; me.running = Math.hypot(me.vx, me.vz) > 5.5; me.crouch = me.role === 'run' && !!map.player.crouched(); }
    // 투명·별 시계(내 것 · 봇)
    for (const a of ACT) { if (a.kind === 'remote') continue;
      if (a.inv > 0 && (a.inv -= dt) <= 0) { a.inv = 0; a.invCd = cfg.invCd; if (a.kind === 'me') { map.player.invisible(false); map.tone(392, 0, 0.15, 'sine', 0.08); } } else if (a.invCd > 0) a.invCd = Math.max(0, a.invCd - dt);
      if (a.star > 0 && (a.star -= dt) <= 0) { a.star = 0; if (a.kind === 'me') map.player.speed(1); } }
    if (me && me.role === 'run') {   // 🏃 힘: 찾기 동안 달리면 줄고 안 달리면 차오름 · 다 쓰면 1.5초어치 찰 때까지 걷기만(숨기 동안은 마음껏)
      if (me.st == null) me.st = cfg.stam;
      if (p === 'seek' && me.alive) { if (me.running || (route && !me.tired)) me.st = Math.max(0, me.st - dt); else me.st = Math.min(cfg.stam, me.st + dt * cfg.stamRe); } else me.st = cfg.stam;
      const tired = me.st <= 0 || (me.tired && me.st < 1.5); if (tired !== me.tired) { me.tired = tired; map.player.run(!tired); if (tired) map.hud.toast('💦 숨이 차요 — 걷거나 숨어서 힘을 모아요', 1.8); }
      routeTick(dt); paintBtn(); paintStam(me); }
    if (me && (p === 'hide' || p === 'seek') && (arT -= dt) <= 0) { arT = 0.2;   // 경기장 밖(계단·체육관·화단 등) = 마지막 자리로
      const ci = nav.snap(me.x, me.y, me.z, 1.2), ok = ci >= 0 && core.inA()[ci];
      if (ok) { arOut = 0; arSafe = [me.x, me.y, me.z]; } else if ((arOut += 0.2) > 0.4 && arSafe) { arOut = 0; clearRoute(); map.player.teleport(arSafe); map.hud.toast('🚧 숨바꼭질은 고깔 안(1층·앞뜰 길)에서만 해요', 2); } }
    // 봇(혼자 · 방장)
    const host = !NETM || NM.host;
    for (const a of ACT) { if (a.kind === 'remote') netActor(a, dt); }
    if (host && (p === 'hide' || p === 'seek')) for (const a of ACT) { if (a.kind !== 'bot' || !a.alive) continue;
      if (!a.b) { a.path = null; a.ci = -1; if (a.role === 'run') core.runInit(a); else core.huntInit(a); }   // 방장이 바뀌면 이어받은 봇에 머리를 새로
      if (a.role === 'run') { core.runTick(a, W, dt);
        if (a.st == null) a.st = cfg.stam; const run = a.running && a.st > 0 && p === 'seek'; if (run) a.st = Math.max(0, a.st - dt); else if (!a.running || p !== 'seek') a.st = Math.min(cfg.stam, a.st + dt * cfg.stamRe);   // 봇도 같은 힘(시뮬레이션과 같은 식)
        core.move(a, dt, (a.running && (a.st > 0 || p !== 'seek') ? cfg.rRun : cfg.rWalk) * (a.star > 0 ? cfg.starBoost : 1)); }
      else if (p === 'seek') { core.huntTick(a, W, dt); core.move(a, dt, cfg.hRun * cfg.eff); } }
    if (!host) for (const a of ACT) if (a.kind === 'bot') netActor(a, dt);
    // 숨기: 술래 눈 가림
    if (me && me.role === 'hunt' && (p === 'count' || p === 'hide')) blindOn(true, p === 'count' ? '👀 술래 준비…' : '🙈 눈 감고 셋 세는 중…<div style="font-size:clamp(48px,12vw,96px);margin-top:10px">' + Math.ceil(cfg.hide - t) + '</div><div style="font-size:clamp(13px,2.4vw,17px);opacity:.75;margin-top:8px">도망자가 숨고 있어요 · 🔥 = 가까이 있다는 뜻 · 마지막 20초엔 반짝!</div>');
    if (p === 'seek') {
      // ⭐ 별(방장·혼자가 자리를 정함)
      if (host && cfg.star && !starD && W.t >= cfg.starAt) { const H = ACT.filter(q => q.role === 'hunt'); let c = -1;
        for (let k = 0; k < 120 && c < 0; k++) { const q = core.randCell(); if (H.every(h => Math.hypot(NX(q) - h.x, NZ(q) - h.z) > 20)) c = q; }
        starD = { on: false, cell: -1 }; if (c >= 0) emit({ k: 'st', n: c }); }
      if (starD && starD.on) { star3.set(0, starD.x, starD.y + 0.9 + Math.sin(t * 3) * 0.12, starD.z, 1.5, t * 2);
        for (const a of ACT) if (a.role === 'run' && a.alive && (a.kind === 'me' || (host && a.kind === 'bot')) && Math.hypot(a.x - starD.x, a.z - starD.z) < 1.3) { emit({ k: 'sp', who: a.i }); break; } }
      // 잡기 판정: 내 도망자 = 내 화면 · 봇 도망자 = 방장
      for (const r of ACT) { if (r.role !== 'run' || !r.alive || r.star > 0) continue; if (!(r.kind === 'me' || (host && r.kind === 'bot'))) continue;
        for (const h of ACT) { if (h.role !== 'hunt') continue; const lim = cfg.catchR + (h.kind === 'remote' ? 0.25 : 0.05);
          if (Math.hypot(h.x - r.x, h.z - r.z) <= lim && Math.abs(h.y - r.y) < 1.3) { emit({ k: 'ct', by: h.i, who: r.i, n: Math.round(Math.max(0, W.t) * 10) }); break; } } }
      // 술래인 나: 봤어요(자동 📢) · 🔥 · 반짝
      if (me && me.role === 'hunt') {
        if ((seeT -= dt) <= 0) { seeT = 0.1; let saw = null;
          for (const r of ACT) { if (r.role !== 'run' || !r.alive) continue; const d = Math.hypot(r.x - me.x, r.z - me.z); if (d > 25 || (r.inv > 0 && d > cfg.invNear)) continue;
            if (map.see({ x: me.x, y: me.y + 1.35, z: me.z, h: me.h }, { x: r.x, y: r.y + (r.crouch ? 0.4 : 0.85), z: r.z }, 100, 25)) { saw = r; break; } }
          if (saw) { if (seeWho === saw.i) { saw.seenT = (saw.seenT || 0) + 0.1; if (saw.seenT >= 0.3 && (callT[saw.i] || -9) < W.t - cfg.callEvery) { callT[saw.i] = W.t; const ci = core.cellOf(saw), z = ci >= 0 ? nav.zoneOf(ci) : null; if (z) emit({ k: 'see', by: me.i, who: saw.i, n: zIdx(z.id) }); } } else { seeWho = saw.i; saw.seenT = 0; } } else seeWho = -1; }
        if ((hotT -= dt) <= 0) { hotT = 0.25; let d0 = 1e9; for (const r of ACT) if (r.role === 'run' && r.alive) d0 = Math.min(d0, Math.hypot(r.x - me.x, r.z - me.z));
          chip('hs-hot', d0 < cfg.hotR ? '🔥 가까이 있어요!' : '❄️ 이 근처엔 없어요'); }
      }
      if (cfg.pingLast && W.t >= nextPing) { nextPing += cfg.pingEvery; ping(); }
    }
    // 그리기 · 시간
    draw(dt);
    if ((uiT -= dt) <= 0) { uiT = 0.2;
      chip('hs-time', p === 'count' ? '⏱ 준비' : p === 'hide' ? '🙈 숨기 ' + Math.ceil(cfg.hide - t) : p === 'seek' ? '⏱ ' + fmt(Math.max(0, T1 - t)) : '🏁 끝');
      if (p !== 'seek' || !(me && me.role === 'hunt')) chip('hs-hot', null); }
    if (NETM && NM.on) { netSend(dt); hostRun(t, endAt); if ((NM.lagT = (NM.lagT || 0) - dt) <= 0) { NM.lagT = 1; chip('hs-net', NM.lag >= 450 ? '📶 인터넷이 느려요(' + NM.lag + 'ms)' : null); } }
    else if (p === 'res' && t > endAt + cfg.end && !matchEnd) { matchEnd = true; soloEnd(); }
  }
  // 몸 그리기(행렬만) — 보이는 규칙: 술래인 나 = 도망자는 투명이면 안 보임(1.3m 안 제외) · 도망자인 나 = 술래는 반지름 R 안만 + 바닥 부채꼴
  function draw(dt) {
    const me = ACT[ME], myRole = me ? me.role : null, mx = me ? me.x : SX, mz = me ? me.z : SZ;
    for (let j = 0; j < NA; j++) {
      const a = ACT[j];
      let vis = !!a && a.kind !== 'me' && phase !== 'off';
      if (vis && a.role === 'run' && !a.alive) vis = false;
      if (vis && myRole === 'hunt' && a.role === 'run' && a.inv > 0 && Math.hypot(a.x - mx, a.z - mz) > cfg.invNear) vis = false;
      if (vis && myRole === 'run' && a.role === 'hunt' && Math.hypot(a.x - mx, a.z - mz) > cfg.R + 1) vis = false;
      const fan = vis && myRole === 'run' && me.alive && a.role === 'hunt' && (phase === 'seek');
      if (!vis) { M.body.setMatrixAt(j, ZERO); M.bib.setMatrixAt(j, ZERO); M.leg.setMatrixAt(j * 2, ZERO); M.leg.setMatrixAt(j * 2 + 1, ZERO); M.arm.setMatrixAt(j * 2, ZERO); M.arm.setMatrixAt(j * 2 + 1, ZERO); FAN.setMatrixAt(j, ZERO); if (TAGS[j]) TAGS[j].visible = false; continue; }
      const mv = Math.hypot(a.x - a.ox, a.z - a.oz); a.walk += mv * 5.5; a.ox = a.x; a.oz = a.z;
      const blink = a.inv > 0 && Math.floor(a.inv * 8) % 2 === 0, yaw = Math.PI - a.h * Math.PI / 180, sy = Math.sin(yaw), cy = Math.cos(yaw);
      // HS-4: 도망자 몸 = 0.8배(키 ≈1.1m) · 🙇 웅크리면 납작(≈0.6m — 책상·덤불·차·화단 뒤면 가려짐) · 다리는 접어 숨기고 팔은 무릎을 안음
      const sc = a.role === 'run' ? 0.8 : 1, cr = !!a.crouch, hy = cr ? 0.55 : 1;
      const bob = cr ? 0 : Math.abs(Math.sin(a.walk)) * 0.035, y0 = a.y + 0.01 + bob;
      if (blink) { M.body.setMatrixAt(j, ZERO); M.bib.setMatrixAt(j, ZERO); } else { _q.setFromEuler(_e.set(0, yaw, 0)); _s.set(sc * (cr ? 1.12 : 1), sc * hy, sc * (cr ? 1.12 : 1)); _v.set(a.x, y0 - (cr ? 0.1 * sc : 0), a.z); M.body.setMatrixAt(j, _m4.compose(_v, _q, _s)); M.bib.setMatrixAt(j, _m4); }
      M.bib.setColorAt(j, _c.set(a.role === 'run' ? (a.star > 0 ? 0xffd23c : 0x3b82f6) : 0xe84848));
      const sw = cr ? 0 : Math.sin(a.walk) * 0.7;
      for (let s = 0; s < 2; s++) { const side = s ? 1 : -1;
        if (blink || cr) M.leg.setMatrixAt(j * 2 + s, ZERO);
        else { const ox = 0.085 * side * sc, oy = 0.34 * sc; _v.set(a.x + ox * cy, y0 + oy, a.z - ox * sy); _q.setFromEuler(_e.set(sw * side, yaw, 0)); _s.set(sc, sc, sc); M.leg.setMatrixAt(j * 2 + s, _m4.compose(_v, _q, _s)); }
        if (blink) { M.arm.setMatrixAt(j * 2 + s, ZERO); continue; }
        const ox = (cr ? 0.19 : 0.21) * side * sc, oy = (cr ? 0.42 : 0.7) * sc; _v.set(a.x + ox * cy, y0 + oy, a.z - ox * sy); _q.setFromEuler(_e.set(cr ? -1.1 : -sw * side * 0.8, yaw, (cr ? 0.35 : 0.12) * side)); _s.set(sc, sc * (cr ? 0.8 : 1), sc); M.arm.setMatrixAt(j * 2 + s, _m4.compose(_v, _q, _s)); }
      if (fan) { _q.setFromEuler(_e.set(0, yaw, 0)); _v.set(a.x, a.y + 0.06, a.z); _s.set(1, 1, 1); FAN.setMatrixAt(j, _m4.compose(_v, _q, _s)); } else FAN.setMatrixAt(j, ZERO);
      const tagOn = a.kind === 'remote' && !blink && !(myRole === 'hunt' && a.role === 'run');   // 술래 화면엔 도망자 이름표 없음(가구 뒤에서 이름표만 둥둥 떠 들키지 않게)
      if (tagOn) { const tg = tagFor(j, a.name, a.role === 'run'); tg.visible = true; tg.position.set(a.x, a.y + (cr ? 0.95 : 1.78) * sc, a.z); } else if (TAGS[j]) TAGS[j].visible = false;
    }
    M.body.instanceMatrix.needsUpdate = M.bib.instanceMatrix.needsUpdate = M.leg.instanceMatrix.needsUpdate = M.arm.instanceMatrix.needsUpdate = FAN.instanceMatrix.needsUpdate = true; M.bib.instanceColor.needsUpdate = true;
  }

  // ---------- 판 결과 ----------
  function roundResult() {
    const rs = ACT.filter(a => a.role === 'run'), lines = [];
    for (const a of rs) { const s = a.alive ? cfg.seek : a.caughtT, nm = a.kind === 'me' ? '나' : a.kind === 'bot' ? '🤖 도망 로봇' : a.name;
      if (a.kind !== 'bot') led(a.kind === 'me' ? myName() : a.name).run.push(Math.round(s));
      lines.push((a.alive ? '🎉 ' + nm + ' 끝까지 도망!' : '💥 ' + nm + ' 잡힘 — ' + Math.round(s) + '초')); }
    for (const a of ACT) if (a.role === 'hunt' && a.cts && a.kind !== 'bot') led(a.kind === 'me' ? myName() : a.name).ct += a.cts;
    // 판 결과 = 도망자 한 명씩: 산 수 > 잡힌 수 = 도망자 승 · 잡힌 수 > 산 수 = 술래 승 · 같으면(2명 중 1:1) 비김 — 2 vs 5 시뮬레이션: 술래 싹쓸이 20% · 도망자 둘 다 17% · 1:1 64%
    const live = rs.filter(a => a.alive).length, cau = rs.length - live, side = live > cau ? 'r' : cau > live ? 'h' : 'd', runWin = side === 'r', me = ACT[ME];
    res = { runWin, side, lines };
    const head = side === 'd' ? '🤝 비겼어요 — ' + live + ' : ' + cau : me ? (me.role === 'run' ? (me.alive ? '🎉 끝까지 숨었어요!' : '💥 다음엔 꼭!') : (runWin ? '😮 도망자가 이겼어요' : '🎉 술래 승리!')) : (runWin ? '🏃 도망자 승리' : '👀 술래 승리');
    card('<div style="font-size:1.3em">' + head + '</div>' + lines.map(esc).join('<br>'), cfg.end);
    if (me && me.role === 'run' && me.alive) { map.tone(523, 0, 0.15, 'sine', 0.1); map.tone(659, 0.15, 0.15, 'sine', 0.1); map.tone(784, 0.3, 0.3, 'sine', 0.1); }
    map.player.freeze(true); map.player.invisible(false); map.player.speed(1); clearRoute(); chip('hs-hot', null);
    if (!NETM) { const k = me && me.role === 'run' ? 'bestHide' : 'bestSeek';
      if (me && me.role === 'run') { const s = me.alive ? cfg.seek : me.caughtT, b = map.store.get(k, 0); if (s > b) map.store.set(k, Math.round(s)); }
      else if (!runWin) { const s = Math.max(...rs.map(a => a.caughtT || 0)), b = map.store.get(k, null); if (b == null || s < b) map.store.set(k, Math.round(s)); } }
  }
  const myName = () => (NETM ? NM.name : '나');

  // ---------- 혼자(봇) ----------
  async function soloAsk() {
    let role = params.role === 'run' || params.role === 'hunt' ? params.role : null;
    if (!role) { const i = await map.hud.ask('🫣 숨바꼭질 대작전 — 혼자 연습\n한 판 ' + (cfg.hide + cfg.seek) + '초 · 친구와 하려면 🎮 → 대결 → 숨바꼭질(친구와)', ['🏃 도망자 — 하늘에서 보며 술래 로봇 넷을 ' + cfg.seek + '초 피하기', '👀 술래 — 로봇 셋과 함께 도망 로봇 잡기']);
      if (i < 0 || dead) return; role = i === 1 ? 'hunt' : 'run'; }
    soloRound(role);
  }
  function soloRound(role) {
    matchEnd = false;
    const slots = role === 'run' ? [{ kind: 'me', role: 'run', name: '나' }, ...[1, 2, 3, 4].map(k => ({ kind: 'bot', role: 'hunt', name: '술래 봇 ' + k }))]
      : [{ kind: 'bot', role: 'run', name: '도망 로봇' }, { kind: 'me', role: 'hunt', name: '나' }, ...[1, 2, 3].map(k => ({ kind: 'bot', role: 'hunt', name: '술래 봇 ' + k }))];
    beginRound({ seq: 1, t0: Date.now() + 3000, lvl: 0, slots });
  }
  async function soloEnd() {
    const me = ACT[ME], role = me ? me.role : 'run';
    const i = await map.hud.ask((res && res.lines.join('\n')) || '끝', ['🔄 다시 하기', role === 'run' ? '👀 술래 해 보기' : '🏃 도망자 해 보기', '🏠 그만하기']);
    if (dead) return; if (i === 0) soloRound(role); else if (i === 1) soloRound(role === 'run' ? 'hunt' : 'run'); else map.quit();
  }
  async function askQuit() {
    const i = await map.hud.ask('숨바꼭질을 그만할까요?', ['▶ 계속하기', '🏠 그만하기']);
    if (i === 1) map.quit();
  }

  // =====================================================================================
  // 👥 친구 대결 — Firebase match/c<번호>(물총과 같은 자리 · m.arena = 'hs' + 따라잡기 단계로 구별)
  //   m { st: lobby|play|end, host, arena 'hs0', time = 이번 경기 판 수, goal = 판 번호, seq, t0 = 준비 시작 시계(서버 ms) }
  //   p/<pid> { n 이름, tm = 차례(0~) + 100(이번 판 도망자) + 1000(도망자를 해 봄) · 99 = 늦게 옴(다음 판부터), on }
  //   s/<pid> = [x, y, z, h, 표(1 투명 · 8 별), 신호] · b/<자리> = 봇 [x, y, z, h, 표] · ev/<id> { k ct|see|st|sp, by, who, n, q = 판 seq }
  //   판을 바꿀 땐 방장이 m과 모든 p.tm을 한 번에 PATCH(자리가 모두에게 같게) · 잡기 = 도망자 화면 · 봇 = 방장 · 방장이 사라지면 가장 먼저 온 사람이 이어받음(물총과 같은 식)
  // =====================================================================================
  const NM = { on: false, room: null, pid: null, name: '', host: false, es: null, D: {}, seen: new Set(), off: 0, seq: -1, st: null, sendT: 0, bT: 0, busyS: 0, busyB: 0, offs: [],
    ui: null, beat: 0, beatN: 0, lastSend: 0, claim: false, seenAt: {}, lvl: 0, streak: [], adv: false, lag: 0 };
  const nreq = (path, method = 'GET', data) => fetch(MDB + NM.room + path + '.json', { method, body: data == null ? undefined : JSON.stringify(data), keepalive: true }).then(r => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))));
  const sNow = () => Date.now() + NM.off;
  const ctlMatch = (seq, st) => { const mp = window.SM_MP, N = mp && mp.net(); if (N && N.ctl) N.ctl('match', { seq, st }); };
  const r2 = v => Math.round(v * 100) / 100;
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
      const P = D0.p || {}, m = D0.m, live = m && P[m.host] && Object.keys(P).length;
      if (live && !/^hs/.test(m.arena || '')) { map.hud.toast((/^rb/.test(m.arena || '') ? '🤖 지금 이 방은 로봇인 척 중이에요' : '💦 지금 이 방은 물총 친구 대결 중이에요') + ' — 끝나면 다시 와요', 4); NM.on = false; if (N && N.hide) N.hide(false); lobbyHide(); map.quit(); return; }
      const t1 = Date.now(), r = await nreq('/p/' + NM.pid, 'PUT', { n: NM.name, tm: 99, on: { '.sv': 'timestamp' } }), t2 = Date.now();
      NM.off = r.on - (t1 + t2) / 2;
      if (!live) { const sq = ((m && m.seq) || 0) + 1; await nreq('/m', 'PUT', { st: 'lobby', host: NM.pid, arena: 'hs0', time: 0, goal: 0, seq: sq, t0: 0 }); ctlMatch(sq, 'hlobby'); }
    } catch (e) { map.hud.toast('😥 친구 대결에 들어가지 못했어요 — 인터넷·방을 확인해 주세요', 4); NM.on = false; if (N && N.hide) N.hide(false); lobbyHide(); map.quit(); return; }
    if (dead || !NM.on) return;
    if (D0 && D0.ev) for (const id in D0.ev) NM.seen.add(id);
    NM.es = new EventSource(MDB + NM.room + '.json');
    const on = type => e => { let msg; try { msg = JSON.parse(e.data); } catch (er) { return; } if (!msg) return; NM.D = applyEvt(NM.D, type, (msg.path || '/').split('/').filter(Boolean), msg.data); netSync(); };
    NM.es.addEventListener('put', on('put')); NM.es.addEventListener('patch', on('patch'));
    addEventListener('pagehide', netBye); addEventListener('sm-room', netRoomGone);
    clearInterval(NM.beat); NM.beat = setInterval(() => { if (NM.on && performance.now() - NM.lastSend > 2500) netSendNow(); }, 1500);
  }
  function netRoomGone(e) { if (!e.detail && NM.on && !dead) { map.hud.toast('🚪 방이 닫혀서 숨바꼭질을 마쳤어요', 3); map.quit(); } }
  function netBye() { if (!NM.on) return; fetch(MDB + NM.room + '/p/' + NM.pid + '.json', { method: 'DELETE', keepalive: true }).catch(() => {}); fetch(MDB + NM.room + '/s/' + NM.pid + '.json', { method: 'DELETE', keepalive: true }).catch(() => {}); }
  function netLeave() {
    if (!NM.on) return;
    const P = NM.D.p || {}, rest = Object.keys(P).filter(id => id !== NM.pid).sort((a, b) => (P[a].on || 0) - (P[b].on || 0));
    if (!rest.length) nreq('', 'DELETE').catch(() => {});
    else { netBye(); if (NM.host) nreq('/m/host', 'PUT', rest[0]).catch(() => {}); }
    if (NM.es) NM.es.close(); NM.es = null; NM.on = false; clearInterval(NM.beat); removeEventListener('pagehide', netBye); removeEventListener('sm-room', netRoomGone);
    const mp = window.SM_MP, N = mp && mp.net(); if (N && N.hide) N.hide(false);
    lobbyHide();
  }
  const isHS = m => !!m && /^hs/.test(m.arena || '');
  function netSync() {
    const D = NM.D, m = D.m; if (!m || !NM.on) return;
    if (!isHS(m)) return;
    NM.host = m.host === NM.pid;
    const S = D.s || {}, now = performance.now();
    for (const id in S) if (S[id] !== NM.seenAt[id + '#']) { NM.seenAt[id + '#'] = S[id]; NM.seenAt[id] = now; }
    if (m.st === 'play' && m.seq !== NM.seq) roundFromNet(m);
    if (m.st !== NM.st) { const was = NM.st; NM.st = m.st; if (m.st === 'lobby') { if (R) { R = null; endRoundUI(); if (map.top.on) map.top.exit(); btn.style.display = 'none'; map.hud.goal(null); for (const k of ['hs-time', 'hs-hot', 'hs-role', 'hs-net']) map.hud.chip(k, null); chipK = {}; } lobbyShow(); } else if (m.st === 'end' && was === 'play') finalBoard(); else if (m.st === 'play') lobbyHide(); }
    if (R) { for (const a of ACT) if (a.kind === 'remote') { const v = S[a.pid]; if (v) netSet(a, v); }
      if (!NM.host && D.b) for (const a of ACT) if (a.kind === 'bot') { const v = D.b[a.i]; if (v) netSet(a, v); } }
    const E = D.ev || {};
    for (const id in E) { if (NM.seen.has(id)) continue; NM.seen.add(id); const e = E[id]; if (e && e.q === NM.seq) onEv(e); }
    hostCheck(m);
    if (NM.ui) lobbyDraw();
  }
  // 판 자리 = 이번 판 p(tm != 99) — 도망자(tm ≥ 100 · 차례순) → 술래(차례순) → 술래 봇(혼자 남은 자리 채움: 도망자 1명이면 술래 4 · 2명이면 5 · 모두 8까지)
  function slotsFrom(P) {
    const ids = Object.keys(P).filter(id => P[id] && typeof P[id].tm === 'number' && P[id].tm !== 99);
    const ord = id => P[id].tm % 100, run = ids.filter(id => P[id].tm % 1000 >= 100).sort((a, b) => ord(a) - ord(b)), hunt = ids.filter(id => P[id].tm % 1000 < 100).sort((a, b) => ord(a) - ord(b));
    const S = [], mk = (id, role) => ({ kind: id === NM.pid ? 'me' : 'remote', pid: id, name: String(P[id].n || '친구').slice(0, 8), role });
    for (const id of run) S.push(mk(id, 'run')); for (const id of hunt) S.push(mk(id, 'hunt'));
    const want = Math.min(8, run.length + (run.length > 1 ? 5 : 4)); let k = 1; while (S.length < want) S.push({ kind: 'bot', role: 'hunt', name: '술래 봇 ' + k++ });
    return S.slice(0, 8);   // 8명까지(9번째부터는 구경 — 그리기 칸 8)
  }
  function roundFromNet(m) {
    NM.seq = m.seq; const lvl = +String(m.arena).slice(2) || 0; NM.lvl = lvl;
    const slots = slotsFrom(NM.D.p || {});
    NM.D.b = {};   // 지난 판 봇 자리는 버림(방장이 새로 보냄)
    lobbyHide();
    beginRound({ seq: m.seq, t0: m.t0, lvl, slots, round: m.goal, rounds: m.time });
    const E = NM.D.ev || {};   // 늦게 들어옴: 이미 난 사건
    for (const id in E) { const e = E[id]; if (!e || e.q !== m.seq || NM.seen.has(id)) continue; NM.seen.add(id); onEv(e); }
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
  // NET-LAG(10-04 교사 '실시간으로 잘될까 — 렉'): 상태마다 서버 시각(ts = 저장된 때)을 붙여, 받는 쪽이 '몇 초 전 자리인지'를 알고 그만큼 앞질러 그린다
  //   (예전 = 받은 때부터만 앞질러 그려 보내는 길·서버 길 시간만큼 늘 뒤처짐) · 늦게 도착한 옛 상태(ts가 더 이른 것)는 버림 · 속도 = 두 상태의 ts 차이로
  //   보내기는 앞 요청을 기다리지 않고 2개까지 겹쳐 보냄(느린 와이파이 왕복 0.5초에도 초당 ≈4~8번) · 보낸 사람의 왕복/2를 더해 '찍힌 때'를 어림
  // 겹쳐 보내기 = 왕복 < 300ms면 2개(+200ms 흉내: 나쁜 10% 차이 1.7 → 0.9m) · 더 느리면 1개(크롬 지연 흉내에선 겹치면 줄이 밀림) · 앞질러 그리기 상한 0.6초(방향을 자주 바꾸므로 더 멀리는 안 함)
  const QS = new URLSearchParams(location.search), NFQ = +(QS.get('nf') || 0), NCAP = +(QS.get('ncap') || 0.6);   // 시험용 ?nf=1|2 · ?ncap=초
  const NF = () => NFQ || (NM.lag && NM.lag >= 300 ? 1 : 2);
  function netSet(a, v) {
    if (v === a.net) return; const ts = (a.kind === 'bot' ? v[5] : v[6]) || 0, p = a.net, pts = a.nts || 0;
    if (p && ts && pts && ts <= pts) return;   // 옛 상태(순서가 뒤바뀌어 도착)
    if (p && ts && pts && (v[0] - p[0]) ** 2 + (v[2] - p[2]) ** 2 < 64) { const g = Math.max(0.04, Math.min(1, (ts - pts) / 1000)); let vx = (v[0] - p[0]) / g, vz = (v[2] - p[2]) / g; const sp = Math.hypot(vx, vz); if (sp > 9.5) { vx *= 9.5 / sp; vz *= 9.5 / sp; } a.nvx = vx; a.nvz = vz; }
    else { a.nvx = 0; a.nvz = 0; }
    a.net = v; a.nts = ts; a.nt = performance.now();
  }
  function netActor(a, dt) {
    const v = a.net; if (!v) return;
    const ts = a.nts, up = (a.kind === 'bot' ? 0 : (v[7] || 0)) / 2000;   // 보낸 사람 왕복/2 = 찍고 서버에 닿기까지
    const age = Math.max(0, Math.min(NCAP, ts ? (sNow() - ts) / 1000 + up : (performance.now() - a.nt) / 1000)), tx = v[0] + (a.nvx || 0) * age, tz = v[2] + (a.nvz || 0) * age;
    if ((tx - a.x) ** 2 + (tz - a.z) ** 2 > 100) { a.x = tx; a.y = v[1]; a.z = tz; }
    else { const k = 1 - Math.exp(-18 * dt); a.x += (tx - a.x) * k; a.y += (v[1] - a.y) * Math.min(1, dt * 12); a.z += (tz - a.z) * k; }
    let dh = v[3] - a.h; while (dh > 180) dh -= 360; while (dh < -180) dh += 360; a.h = (a.h + dh * Math.min(1, dt * 12) + 360) % 360;
    a.vx = a.nvx || 0; a.vz = a.nvz || 0; a.running = Math.hypot(a.vx, a.vz) > 5.5;
    const f = v[4] | 0; a.crouch = !!(f & 16); a.inv = f & 1 ? Math.max(a.inv, 0.5) : 0; a.star = f & 8 ? Math.max(a.star, 0.5) : (a.star > 0 && !(f & 8) ? 0 : a.star);
  }
  function netEmit(e) { const id = 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); NM.seen.add(id); const o = { k: e.k, q: NM.seq, t: { '.sv': 'timestamp' } }; for (const k of ['by', 'who', 'n']) if (typeof e[k] === 'number') o[k] = e[k]; nreq('/ev/' + id, 'PUT', o).catch(() => {}); }
  function netSendNow() { netSend(0, true); }
  function netSend(dt, beat) {
    NM.sendT -= dt; NM.bT -= dt;
    const busy = R && (phase === 'hide' || phase === 'seek' || phase === 'count');
    if ((NM.sendT <= 0 || beat) && NM.busyS < NF()) {   // 2개까지 겹쳐 보냄
      NM.sendT = busy ? 0.1 : 2; NM.busyS++; const t1 = NM.lastSend = performance.now(), w1 = Date.now(), a = ACT[ME], p = map.player.get();
      nreq('/s/' + NM.pid, 'PUT', [r2(p.x), r2(p.y), r2(p.z), Math.round(p.h), (a && a.inv > 0 ? 1 : 0) | (a && a.star > 0 ? 8 : 0) | (a && a.crouch ? 16 : 0), (NM.beatN = (NM.beatN + 1) % 100), { '.sv': 'timestamp' }, Math.min(5000, NM.lag || 0)])
        .then(r => { const rtt = performance.now() - t1; NM.lag = Math.round(NM.lag ? NM.lag * 0.7 + rtt * 0.3 : rtt);
          if (r && typeof r[6] === 'number') { NM.offs.push([rtt, r[6] - (w1 + rtt / 2)]); if (NM.offs.length > 24) NM.offs.shift(); let b = NM.offs[0]; for (const o of NM.offs) if (o[0] < b[0]) b = o; NM.off = b[1]; } })   // 시계 맞추기 = 왕복이 가장 짧았던 것
        .catch(() => {}).finally(() => { NM.busyS--; });
    }
    if (beat) return;
    if (NM.host && busy && NM.bT <= 0 && NM.busyB < NF()) {
      NM.bT = 0.1; NM.busyB++; const b = {};
      for (const a of ACT) if (a.kind === 'bot') b[a.i] = [r2(a.x), r2(a.y), r2(a.z), Math.round(a.h), (a.inv > 0 ? 1 : 0) | (a.star > 0 ? 8 : 0) | (a.crouch ? 16 : 0), { '.sv': 'timestamp' }];
      nreq('/b', 'PUT', b).catch(() => {}).finally(() => { NM.busyB--; });
    }
  }
  // 방장: 판 끝 → 다음 도망자(잡은 사람 — 아직 안 해 봤으면 · 팩맨 VS) → 다 했으면 경기 끝
  function hostRun(t, endAt) {
    if (!NM.host || !R || NM.adv) return; const m = NM.D.m; if (!m || m.st !== 'play' || m.seq !== R.seq) return;
    if (t < endAt + cfg.end || NM.advSeq === R.seq) return;   // 한 판은 한 번만 넘김(PATCH 응답이 서버 소식보다 먼저 오면 같은 판을 또 넘기며 따라잡기가 두 번 쌓이던 것)
    NM.adv = true; NM.advSeq = R.seq;
    const side = res ? res.side : (ACT.some(a => a.role === 'run' && a.alive) ? 'r' : 'h');
    if (side === 'd') NM.streak = []; else NM.streak.push(side); if (NM.streak.length >= 2) { const [x, y] = NM.streak.slice(-2); if (x === y) { NM.lvl = Math.max(-2, Math.min(2, NM.lvl + (x === 'h' ? 1 : -1))); NM.streak = []; } }
    const P = NM.D.p || {}, catcher = (() => { const c = ACT.filter(a => a.role === 'hunt' && a.cts && a.pid).sort((a, b) => b.cts - a.cts)[0]; return c && c.pid; })();
    const rounds = m.time || 1, next = (m.goal || 0) + 1;
    if (next >= rounds) { nreq('/m', 'PATCH', { st: 'end' }).catch(() => { NM.advSeq = null; }).finally(() => { NM.adv = false; setTimeout(() => { if (NM.on && NM.host && NM.D.m && NM.D.m.st === 'end') nreq('/m/st', 'PUT', 'lobby').catch(() => {}); }, 9000); }); ctlMatch(m.seq, 'end'); return; }
    // 다음 도망자: 아직 안 해 본 사람 중 — 잡은 사람 먼저 · 아니면 차례순
    const ids = Object.keys(P).filter(id => P[id] && typeof P[id].tm === 'number');
    const ran = id => P[id].tm >= 1000 || P[id].tm % 1000 >= 100, ordOf = id => (P[id].tm === 99 ? 50 + ids.indexOf(id) : P[id].tm % 100);
    const fresh = ids.filter(id => !ran(id)).sort((a, b) => ordOf(a) - ordOf(b)), rc = ids.length >= 6 ? 2 : 1, pick = [];
    if (catcher && fresh.includes(catcher)) pick.push(catcher);
    for (const id of fresh) if (pick.length < rc && !pick.includes(id)) pick.push(id);
    if (!pick.length) { nreq('/m', 'PATCH', { st: 'end' }).catch(() => { NM.advSeq = null; }).finally(() => { NM.adv = false; }); return; }
    const up = { 'm/seq': m.seq + 1, 'm/goal': next, 'm/t0': Math.round(sNow() + 3000), 'm/arena': 'hs' + NM.lvl };
    for (const id of ids) up['p/' + id + '/tm'] = ordOf(id) % 100 + (pick.includes(id) ? 100 : 0) + (ran(id) ? 1000 : 0);
    nreq('', 'PATCH', up).catch(() => { NM.advSeq = null; }).finally(() => { NM.adv = false; });
    nreq('/ev', 'DELETE').catch(() => {}); nreq('/b', 'DELETE').catch(() => {});
  }
  async function hostStart() {
    const m = NM.D.m || {}, P = NM.D.p || {}, ids = Object.keys(P).filter(id => P[id]).sort((a, b) => (P[a].on || 0) - (P[b].on || 0));
    if (!ids.length) return; NM.lvl = 0; NM.streak = []; LED.clear();
    const rc = ids.length >= 6 ? 2 : 1, rounds = Math.ceil(ids.length / rc);
    const up = { 'm/st': 'play', 'm/seq': (m.seq || 0) + 1, 'm/goal': 0, 'm/time': rounds, 'm/t0': Math.round(sNow() + 3500), 'm/arena': 'hs0' };
    ids.forEach((id, k) => { up['p/' + id + '/tm'] = k + (k < rc ? 100 : 0); });
    await nreq('/ev', 'DELETE'); await nreq('/b', 'DELETE'); await nreq('', 'PATCH', up); ctlMatch((m.seq || 0) + 1, 'hcount');
  }
  // ---------- 대기실 · 끝 화면 ----------
  function lobbyShow() { map.player.freeze(true); lobbyDraw(); }
  function lobbyHide() { if (NM.ui) { NM.ui.remove(); NM.ui = null; } }
  function lobbyDraw(msg) {
    if (!NM.ui) { NM.ui = document.createElement('div'); NM.ui.className = 'wg-lobby hs-lobby ttl-keep';
      NM.ui.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:40;width:min(460px,94vw);max-height:90vh;overflow:auto;box-sizing:border-box;pointer-events:auto;background:#fffdf6;color:#1d3557;border:3px solid #1d3557;border-radius:16px;padding:14px 16px;box-shadow:0 8px 30px rgba(0,0,0,.35);font:600 15px/1.45 system-ui,-apple-system,"Malgun Gothic",sans-serif';
      for (const t of ['keydown', 'keyup']) NM.ui.addEventListener(t, e => e.stopPropagation());
      NM.ui.addEventListener('click', lobbyClick); document.body.appendChild(NM.ui); document.exitPointerLock?.(); }
    const D = NM.D, m = D.m, P = D.p || {};
    if (!m || !isHS(m)) { NM.ui.innerHTML = '<b>🫣 숨바꼭질 대작전 — 친구와</b><div style="margin-top:6px">' + (msg || '불러오는 중…') + '</div>'; return; }
    const bt = (a, t, on, x = '') => '<button data-w="' + a + '" style="font:inherit;font-weight:800;border:0;border-radius:9px;padding:6px 11px;cursor:pointer;' + (on ? 'background:#1d3557;color:#fff' : 'background:#e8edf3;color:#1d3557') + x + '">' + t + '</button>';
    const ids = Object.keys(P).filter(id => P[id]).sort((a, b) => (P[a].on || 0) - (P[b].on || 0)), hostN = NM.host ? '나' : P[m.host] ? esc(P[m.host].n) : '방장';
    const rc = ids.length >= 6 ? 2 : 1, rounds = Math.ceil(ids.length / rc);
    let h = '<div style="font-weight:900;font-size:18px">🫣 숨바꼭질 대작전 — 친구와</div>'
      + '<div style="margin-top:6px;font-size:13px;color:#4a5b70">🏃 도망자 ' + rc + '명 = 하늘에서 봐요(지도) · 👀 술래 = 3인칭 · 빈자리는 술래 봇<br>한 판 ' + (cfg.hide + cfg.seek) + '초(숨기 ' + cfg.hide + ' + 찾기 ' + cfg.seek + ') · 모두 한 번씩 도망자(' + rounds + '판' + (rc > 1 && ids.length % 2 ? ' · 마지막 판은 1명 + 👥 인원 보정' : '') + ')' + (ids.length > 8 ? ' · 8명까지(나머지는 구경하다 차례에 들어와요)' : '') + ' · 잡은 사람이 다음 도망자</div>'
      + '<div style="margin-top:8px;padding:7px 9px;border-radius:9px;background:#eef4ff">👥 ' + ids.map(id => (id === NM.pid ? '<b>⭐ ' + esc(NM.name) + '(나)</b>' : esc(P[id].n)) + net1(id)).join(' · ') + '</div>'
      + (ids.some(id => netMs(id) >= 450) ? '<div style="margin-top:4px;font-size:12px;color:#b4232c">🔴 인터넷이 느린 친구가 있어요 — 친구 몸이 끊겨 보이거나 잡기가 늦을 수 있어요(와이파이 가까이 · 다른 탭 닫기)</div>' : '');
    const fb = NM.lastBoard; if (fb) h += '<div style="margin-top:8px;padding:7px 9px;border-radius:9px;background:#fff3bf;font-size:14px">' + fb + '</div>';
    if (m.st === 'play') h += '<div style="margin-top:8px;font-weight:800">⏳ 경기 중이에요 — 다음 판부터 같이 해요</div>';
    else if (NM.host) h += '<div style="display:flex;gap:6px;justify-content:flex-end;margin-top:10px">' + bt('start', '▶ 시작!', true, ';font-size:17px;padding:8px 18px') + '</div>';
    else h += '<div style="margin-top:10px">방장 ⭐' + hostN + '이(가) ▶ 시작을 누르면 모두 같이 시작해요</div>';
    h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px"><span style="font-size:12px;color:#5a6b80">방 ' + esc(NM.room.slice(1)) + '</span>' + bt('leave', '🚪 나가기') + '</div>';
    if (NM.ui.dataset.h !== h) { NM.ui.dataset.h = h; NM.ui.innerHTML = h; }
  }
  // 📶 왕복 시간(각자 재서 상태 8번째 칸으로 보냄): 🟢 < 250ms · 🟡 < 450 · 🔴 그 이상
  function netMs(id) { const v = (NM.D.s || {})[id]; return id === NM.pid ? NM.lag || 0 : v && v[7] || 0; }
  function net1(id) { const ms = netMs(id); return ms ? ' <span style="font-size:11px;color:#5a6b80" title="왕복 ' + ms + 'ms">' + (ms < 250 ? '🟢' : ms < 450 ? '🟡' : '🔴') + '</span>' : ''; }
  async function lobbyClick(e) {
    e.stopPropagation(); const b = e.target.closest('[data-w]'); if (!b || !NM.on) return; const w = b.dataset.w;
    try { if (w === 'start' && NM.host) await hostStart(); else if (w === 'leave') map.quit(); }
    catch (er) { map.hud.toast('저장하지 못했어요 — 인터넷을 확인해 주세요', 2.5); }
  }
  function finalBoard() {
    if (R) { R = null; endRoundUI(); }
    if (map.top.on) map.top.exit(); btn.style.display = 'none'; map.hud.goal(null); for (const k of ['hs-time', 'hs-hot', 'hs-role', 'hs-net']) map.hud.chip(k, null); chipK = {};
    const L = [...LED.entries()], best = L.filter(([, v]) => v.run.length).sort((a, b) => Math.max(...b[1].run) - Math.max(...a[1].run))[0], ct = L.filter(([, v]) => v.ct).sort((a, b) => b[1].ct - a[1].ct)[0];
    NM.lastBoard = '🏁 지난 경기 — 🏆 도망왕 ' + (best ? esc(best[0]) + ' ' + Math.max(...best[1].run) + '초' : '-') + ' · 👀 술래왕 ' + (ct ? esc(ct[0]) + ' ' + ct[1].ct + '번' : '-')
      + '<br><span style="font-size:13px">' + L.map(([n, v]) => esc(n) + ' ' + (v.run.length ? '🏃' + v.run.join('·') + '초' : '') + (v.ct ? ' 👀' + v.ct : '')).join(' / ') + '</span>';
    card('<div style="font-size:1.35em">🏁 경기 끝!</div>🏆 도망왕 <b>' + (best ? esc(best[0]) + '</b> (' + Math.max(...best[1].run) + '초)' : '-</b>') + '<br>👀 술래왕 <b>' + (ct ? esc(ct[0]) + '</b> (' + ct[1].ct + '번)' : '-</b>'), 6);
    map.tone(523, 0, 0.15, 'sine', 0.1); map.tone(659, 0.15, 0.15, 'sine', 0.1); map.tone(784, 0.3, 0.3, 'sine', 0.1);
    setTimeout(() => { if (NM.on && !dead) lobbyShow(); }, 2500);
  }

  // ---------- 시작 ----------
  if (NETM) netEnter(); else soloAsk();
  return {
    tick,
    stop() { dead = true; removeEventListener('keydown', keyF); clearRoute(); btn.remove(); cbtn.remove(); stamEl.remove(); blindOn(false); if (cardEl) { cardEl.remove(); cardEl = null; } clearTimeout(cardT); map.player.invisible(false); map.player.speed(1); netLeave(); for (const t of TAGS) if (t) { t.material.map && t.material.map.dispose(); t.material.dispose(); }
      for (const g of GEOS) g.dispose(); for (const m of MATS) m.dispose(); },
    get state() { return R ? { phase, t: W && W.t, lvl: R.lvl, base: R.base, eff: R.eff, round: R.round, me: ME, host: NETM ? NM.host : true, actors: ACT.map(a => ({ i: a.i, kind: a.kind, name: a.name, role: a.role, alive: a.alive, x: +a.x.toFixed(1), z: +a.z.toFixed(1), inv: +a.inv.toFixed(1), star: +a.star.toFixed(1), caughtT: a.caughtT })), star: starD, res } : { phase: 'lobby', host: NM.host }; },
    get net() { return { on: NM.on, host: NM.host, room: NM.room, seq: NM.seq, lvl: NM.lvl, lag: NM.lag, st: NM.st }; },
    netStart: () => (NM.host ? hostStart() : null),
  };
}
