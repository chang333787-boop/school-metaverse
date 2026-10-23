// 🐑 양몰이(HERD-1 · 설계 docs/systems/town_jobs2.md「양몰이」·「짓는 조각 2」 · 사용자 10-23 밤샘 차례표 10줄): 목장 먹이 주기 창(mkFeed)을 갈아 끼운 세상 안 놀이 — 창 X · 걸어서 몬다
//   손동작 = 걷기(천천히 다가가면 떼가 밀림 · 뛰면 1.8배 놀라 흩어짐) · 판정 = 자리·방향(양을 다 우리에 넣고 내가 우리 밖) · 때 맞춰 누르기 X
//   군집 규칙(한 줄씩): 떨어지기 · 나란히 · 모이기 · 나(와 개)에게서 달아나기 · 대장 따르기 · 무리에서 떨어진 한 마리는 더 겁이 많음 → 무리를 먼저 모아야 몰림
//   꼬임 사다리(안에서만 셈 · 화면에 판 번호·별 X): 1 기본 → 2 어린 개(휘파람 H = 내 옆으로) → 3 어미와 새끼(새끼는 어미만 따라감) → 4 고집쟁이 숫양 · 잘한 판(★2+) 셋 = 다음 꼬임(일꾼 말 + 세상 변화)
//   현실 근거: 양은 무리를 지어 움직이고 앞선 양을 따름 · 떨어진 양은 불안해함 · 목장 개는 사람 옆에서 함께 몲 · 길 쪽 틈 = 가축 통과 방지 격자(가축이 못 건너는 쇠살) · 비 = 처마 밑
//   그리기: 그 목장 양·소 = 원래 인스턴스 메시(ANIMAL-1)를 그대로 옮김(+0) · 우리 문·리본·개 갈 자리 = 메시 하나(+1) · 개 = 인스턴스 하나(꼬임 2부터 +1) · 새 Light 0 · 매 프레임 new 0
//   three는 넘겨받은 것(o.T3)만 씀 · 군집 한 걸음(herdStep)은 순수 함수(시험 = node 봇)

// ── 수치(node 봇으로 맞춤: scratchpad/herd_tune.mjs) ──
export const HK = { r: 0.42, R0: 6.5, RUN: 1.8, ISO_R: 1.35, ISO_F: 1.5, ISO_D: 4.0, COH_D: 9, SEP_D: 1.25, ALI_D: 4, LEAD_D: 14,
  wF: 4.2, wC: 1.0, wS: 3.2, wA: 0.55, wL: 0.3, wG: 0.5, wP: 0.4, acc: 3.2, damp: 2.4, vCalm: 0.8, vFear: 2.0, vMax: 3.6, dogR: 6.5, dogRh: 4.2, dogF: 1.5, dogFh: 0.9 };

const F9 = new Float32Array(4);   // 달아나기 모음 [a, b, 가장 큰 놀람, 0]
function flee(a, b, sa, sb, R, str, scat) { const da = a - sa, db = b - sb, d = Math.hypot(da, db); if (d >= R || d < 1e-4) return d; const f = (1 - d / R) * str; let ua = da / d, ub = db / d;
  if (scat) { const c = Math.cos(scat), s = Math.sin(scat), t = ua * c - ub * s; ub = ua * s + ub * c; ua = t; } F9[0] += ua * f; F9[1] += ub * f; if (f > F9[2]) F9[2] = f; return d; }

// 판 모양(G): { W, D, pa0, pa1, pb1(우리 = 뒤 울타리에 붙은 네모 pa0 < a < pa1 · b < pb1), ga0, ga1(문 = b = pb1 줄의 a 구간 · 경첩 = ga0), phi(문 열린 각 0~π/2), barn:[a,b,ha,hb], hay: Float32Array(2k), nh, cow: Float32Array(2k), nc, dusk }
// 양(S): makeFlock(n) · 사람(P): { a, b, run, dog: 0|1, da, db, heel }
export function makeFlock(n) { return { n, A: new Float32Array(8), B: new Float32Array(8), VA: new Float32Array(8), VB: new Float32Array(8), FE: new Float32Array(8), HD: new Float32Array(8), KD: new Int8Array(8), MO: new Int8Array(8).fill(-1), ST: new Float32Array(8), SC: new Float32Array(8), IN: new Uint8Array(8), WT: new Float32Array(8), lead: 0, lost: 0, runQ: 0, runN: 0, ramRun: 0, seed: 1 }; }
const rnd = S => ((S.seed = (S.seed * 1103515245 + 12345) >>> 0) / 4294967296);
// 우리 자리(목장 판 크기에서 · 짓기와 놀이가 같은 값): 뒤 울타리(b = -D/2)에 붙고 서쪽 끝에서 6m 안쪽 · 문 = 앞면 가운데 3.6m
export const penOf = (W, D) => { const PW = Math.min(10, W * 0.2), PD = Math.min(8, D * 0.22), pc = -W / 2 + 6 + PW / 2; return { pa0: pc - PW / 2, pa1: pc + PW / 2, pb1: -D / 2 + PD, ga0: pc - 1.8, ga1: pc + 1.8, pc }; };
export const inPen = (G, a, b, m = 0) => a > G.pa0 + m && a < G.pa1 - m && b < G.pb1 - m;
// 울타리 토막(축 나란한 선분) 밀어내기: 우리 두 면 + (닫혔으면) 문 · 바깥 울타리·축사·건초·소
function seg(S, i, a0, b0, a1, b1, r) { const a = S.A[i], b = S.B[i], ea = a1 - a0, eb = b1 - b0, L2 = ea * ea + eb * eb, t = L2 ? Math.max(0, Math.min(1, ((a - a0) * ea + (b - b0) * eb) / L2)) : 0, qa = a0 + ea * t, qb = b0 + eb * t, da = a - qa, db = b - qb, d = Math.hypot(da, db);
  if (d >= r) return; if (d < 1e-5) { if (ea === 0) S.A[i] = qa + (S.VA[i] > 0 ? -r : r); else S.B[i] = qb + (S.VB[i] > 0 ? -r : r); return; } S.A[i] = qa + da / d * r; S.B[i] = qb + db / d * r;
  const vn = (S.VA[i] * da + S.VB[i] * db) / d; if (vn < 0) { S.VA[i] -= vn * da / d; S.VB[i] -= vn * db / d; } }
export function walls(G, S, i, r) { const W2 = G.W / 2 - 0.15 - r, D2 = G.D / 2 - 0.15 - r; if (S.A[i] < -W2) { S.A[i] = -W2; if (S.VA[i] < 0) S.VA[i] = 0; } else if (S.A[i] > W2) { S.A[i] = W2; if (S.VA[i] > 0) S.VA[i] = 0; } if (S.B[i] < -D2) { S.B[i] = -D2; if (S.VB[i] < 0) S.VB[i] = 0; } else if (S.B[i] > D2) { S.B[i] = D2; if (S.VB[i] > 0) S.VB[i] = 0; }
  const z0 = -G.D / 2; seg(S, i, G.pa0, G.pb1, G.ga0, G.pb1, r); seg(S, i, G.ga1, G.pb1, G.pa1, G.pb1, r); seg(S, i, G.pa1, z0, G.pa1, G.pb1, r); seg(S, i, G.pa0, z0, G.pa0, G.pb1, r); { const L = G.ga1 - G.ga0, ph = G.phi || 0; seg(S, i, G.ga0, G.pb1, G.ga0 + Math.cos(ph) * L, G.pb1 + Math.sin(ph) * L, r); }   /* 문짝(닫힘 = 문 줄 · 열림 = 바깥으로 젖힌 날개 — 실제 우리 문처럼 깔때기) */
  const br = G.barn, ha = br[2] + r, hb = br[3] + r, da = S.A[i] - br[0], db = S.B[i] - br[1]; if (Math.abs(da) < ha && Math.abs(db) < hb) { if (ha - Math.abs(da) < hb - Math.abs(db)) S.A[i] = br[0] + Math.sign(da || 1) * ha; else S.B[i] = br[1] + Math.sign(db || 1) * hb; }
  for (let k = 0; k < G.nh; k++) { const qa = S.A[i] - G.hay[k * 2], qb = S.B[i] - G.hay[k * 2 + 1], d = Math.hypot(qa, qb), R = 0.7 + r; if (d < R && d > 1e-4) { S.A[i] = G.hay[k * 2] + qa / d * R; S.B[i] = G.hay[k * 2 + 1] + qb / d * R; } }
  for (let k = 0; k < G.nc; k++) { const qa = S.A[i] - G.cow[k * 2], qb = S.B[i] - G.cow[k * 2 + 1], d = Math.hypot(qa, qb), R = 0.9 + r; if (d < R && d > 1e-4) { S.A[i] = G.cow[k * 2] + qa / d * R; S.B[i] = G.cow[k * 2 + 1] + qb / d * R; } } }
// 따라갈 자리가 우리 안이고 나는 밖이면 → 문 앞 → 문 안으로 돌아가게(따르기 규칙이 울타리에 막혀 비비지 않게 · 우와 1 '대장만 넣었는데 줄지어 들어감')
const T9 = new Float32Array(2);
function via(G, a, b, ta, tb, inMe) { T9[0] = ta; T9[1] = tb; const inT = inPen(G, ta, tb); if (inT === inMe) return; const gc = (G.ga0 + G.ga1) / 2;
  if (!inMe) { const oa = gc, ob = G.pb1 + 1.3; if (Math.hypot(a - oa, b - ob) < 1.6 || (b < G.pb1 + 0.6 && a > G.ga0 && a < G.ga1)) { T9[0] = gc; T9[1] = G.pb1 - 2.0; } else { T9[0] = oa; T9[1] = ob; } }
  else { T9[0] = gc; T9[1] = G.pb1 + 1.5; } }

// 군집 한 걸음 — 매 프레임 · 쌍 비교 n×n(7마리 = 49) · 새 객체 없음
export function herdStep(G, S, P, dt) { const n = S.n, gc = (G.ga0 + G.ga1) / 2, pRun = !!P.run, L = S.lead;
  if (pRun) { if (S.runQ <= 0) { for (let i = 0; i < n; i++) S.SC[i] = (rnd(S) - 0.5) * 1.6; } S.runQ = 0.6; } else if (S.runQ > 0) S.runQ -= dt;   /* 뛰기 시작할 때마다 양마다 흩어지는 각을 새로 */
  for (let i = 0; i < n; i++) { const a = S.A[i], b = S.B[i], kd = S.KD[i], me = S.IN[i] = inPen(G, a, b) ? 1 : 0;   /* 우리 안 양은 안의 양끼리만 모임(밖의 양에게 끌려 문으로 나오지 않게 — 밖의 양은 안의 양을 따라 문으로 들어옴) */ let ca = 0, cb = 0, cn = 0, sa = 0, sb = 0, aa = 0, ab = 0, an = 0, nb = 0;
    for (let j = 0; j < n; j++) { if (j === i) continue; const da = S.A[j] - a, db = S.B[j] - b, d = Math.hypot(da, db); if (d < HK.ISO_D) nb++;
      if (d < HK.SEP_D && d > 1e-4) { const f = (HK.SEP_D - d) / HK.SEP_D; sa -= da / d * f; sb -= db / d * f; }
      if (d < HK.COH_D && S.KD[j] !== 1 && (!me || inPen(G, S.A[j], S.B[j]))) { ca += S.A[j]; cb += S.B[j]; cn++; } if (d < HK.ALI_D) { aa += S.VA[j]; ab += S.VB[j]; an++; } }
    const iso = nb === 0 && kd !== 1, Rm = kd === 1 ? 0.8 : kd === 2 ? 0.62 : 1, R = HK.R0 * Rm * (pRun ? HK.RUN : 1) * (iso ? HK.ISO_R : 1), str = (pRun ? HK.RUN : 1) * (iso ? HK.ISO_F : 1) * (i === L ? 1.15 : 1);
    F9[0] = F9[1] = F9[2] = 0; const dP = flee(a, b, P.a, P.b, R, str, pRun ? S.SC[i] : 0); if (P.dog) flee(a, b, P.da, P.db, P.heel ? HK.dogRh : HK.dogR, P.heel ? HK.dogFh : HK.dogF, P.heel ? 0 : S.SC[i] * 0.6);
    let fa = F9[0] * HK.wF, fb = F9[1] * HK.wF, fear = F9[2];
    if (kd === 2) {   /* 숫양: 다가오면 돌아서서 버팀(1.2초) → 그다음에야 비킴 · 뛰어오면 계속 버팀 */
      if (dP < R + 0.5) { if (pRun && dP < 7) { S.ST[i] = 0; S.ramRun = 1; } if (S.ST[i] < 1.2) { S.ST[i] += dt; fa = fb = 0; fear = 0; S.VA[i] *= 0.8; S.VB[i] *= 0.8; S.HD[i] = Math.atan2(P.a - a, P.b - b); } else fear = Math.min(fear, 0.45); } else if (dP > R + 1.5) S.ST[i] = 0; }
    if (kd === 1 && S.MO[i] >= 0) { const m = S.MO[i]; via(G, a, b, S.A[m], S.B[m], me); const da = T9[0] - a, db = T9[1] - b, d = Math.hypot(da, db), dm = Math.hypot(S.A[m] - a, S.B[m] - b); if (dm > 5) S.lost += dt;   /* 새끼: 어미만 따라감(멀면 달려감) */
      if (d > 1.2) { const w = dm > 5 ? 2.6 : 1.4; fa += da / d * w; fb += db / d * w; if (dm > 5) fear = Math.max(fear, 0.8); } }
    else { if (cn) { via(G, a, b, ca / cn, cb / cn, me); const da = T9[0] - a, db = T9[1] - b, d = Math.hypot(da, db); if (d > 0.8) { const w = HK.wC * (kd === 2 ? 0.4 : 1) * (1 + Math.min(1, fear)); fa += da / d * w * Math.min(1, d / 3); fb += db / d * w * Math.min(1, d / 3); } }
      if (an) { fa += (aa / an - S.VA[i]) * HK.wA; fb += (ab / an - S.VB[i]) * HK.wA; }
      if (i !== L && kd === 0 && !me) { via(G, a, b, S.A[L], S.B[L], me); const da = T9[0] - a, db = T9[1] - b, d = Math.hypot(da, db); if (d > 2.5 && d < HK.LEAD_D) { fa += da / d * HK.wL; fb += db / d * HK.wL; } }
      if (G.dusk && !me) { via(G, a, b, gc, G.pb1 - 2.5, me); const da = T9[0] - a, db = T9[1] - b, d = Math.hypot(da, db); if (d > 0.5) { fa += da / d * HK.wG; fb += db / d * HK.wG; } }   /* 해 질 녘 = 스스로 우리 쪽 */
      if (!me && fear > 0.08) { const oa = gc, ob = G.pb1 + 1.2, d0 = Math.hypot(a - oa, b - ob); if (d0 < 5.5) { via(G, a, b, gc, G.pb1 - 2.5, me); const da = T9[0] - a, db = T9[1] - b, d = Math.hypot(da, db); if (d > 0.3) { const w = 1.1 * Math.min(1, fear * 2) * (1 - d0 / 6); fa += da / d * w; fb += db / d * w; } } }   /* 문 앞에서 쫓기면 열린 문으로(울타리보다 트인 쪽 · 실제 양몰이의 '입구로 빠짐') */
      if (me) { const da = (G.pa0 + G.pa1) / 2 - a, db = (-G.D / 2 + G.pb1) / 2 - b, d = Math.hypot(da, db); if (d > 1.5) { fa += da / d * HK.wP; fb += db / d * HK.wP; } } }   /* 우리 안 = 안쪽으로 모임(문에서 비켜섬) */
    fa += sa * HK.wS; fb += sb * HK.wS;
    S.FE[i] += (fear - S.FE[i]) * Math.min(1, dt * (fear > S.FE[i] ? 6 : 1.5));
    if (S.FE[i] < 0.04 && !G.dusk && kd !== 1) { if ((S.WT[i] -= dt) < 0) { S.WT[i] = 2 + rnd(S) * 5; const an9 = rnd(S) * 6.2832; S.VA[i] += Math.sin(an9) * 0.35; S.VB[i] += Math.cos(an9) * 0.35; } }   /* 한가하면 풀 뜯으며 가끔 한 걸음 */
    const k = Math.exp(-dt * HK.damp); S.VA[i] = S.VA[i] * k + fa * HK.acc * dt; S.VB[i] = S.VB[i] * k + fb * HK.acc * dt;
    const vm = Math.min(HK.vMax, HK.vCalm + HK.vFear * S.FE[i]) * (kd === 1 ? 1.1 : kd === 2 ? 0.7 : 1), v = Math.hypot(S.VA[i], S.VB[i]); if (v > vm) { S.VA[i] *= vm / v; S.VB[i] *= vm / v; } }
  for (let i = 0; i < n; i++) { S.A[i] += S.VA[i] * dt; S.B[i] += S.VB[i] * dt; const pa = S.A[i] - P.a, pb = S.B[i] - P.b, d = Math.hypot(pa, pb); if (d < 0.75 && d > 1e-4) { S.A[i] = P.a + pa / d * 0.75; S.B[i] = P.b + pb / d * 0.75; }   /* 내 몸을 뚫지 않게 */
    walls(G, S, i, S.KD[i] === 1 ? 0.3 : HK.r); const v = Math.hypot(S.VA[i], S.VB[i]); if (v > 0.15) { const h = Math.atan2(S.VA[i], S.VB[i]); let d = h - S.HD[i]; d -= Math.round(d / 6.2832) * 6.2832; S.HD[i] += d * Math.min(1, dt * 6); } } }

// 개 한 걸음(꼬임 2부터): 어린 개 = 떼 둘레를 제멋대로 돌다 가끔 떼 속으로 뛰어듦(흩어짐) · 휘파람 = 내 옆(왼쪽 1.6m)으로 와서 같이 밂 · 내가 뛰면 다시 제멋대로
export function dogStep(G, S, D, P, dt) { if (P.run && D.heel) { D.runT += dt; if (D.runT > 0.35) { D.heel = 0; D.tq = 0; } } else D.runT = 0;
  let ca = 0, cb = 0, cn = 0; for (let i = 0; i < S.n; i++) if (!S.IN[i]) { ca += S.A[i]; cb += S.B[i]; cn++; } if (cn) { ca /= cn; cb /= cn; } else { ca = D.a; cb = D.b; }
  if (D.heel) { const h = P.h || 0; D.ta = P.a - Math.cos(h) * 1.6; D.tb = P.b + Math.sin(h) * 1.6; }
  else if ((D.tq -= dt) <= 0 || Math.hypot(D.ta - D.a, D.tb - D.b) < 0.8) { D.tq = 2.2 + rnd(S) * 1.6; if (cn && rnd(S) < 0.38) { D.ta = ca; D.tb = cb; D.dash++; } else { const an = rnd(S) * 6.2832, rr = 6 + rnd(S) * 4; D.ta = ca + Math.sin(an) * rr; D.tb = cb + Math.cos(an) * rr; } D.mk = 1; }
  const da = D.ta - D.a, db = D.tb - D.b, d = Math.hypot(da, db), v = D.heel ? Math.min(6, d * 3) : Math.min(5, d * 2.5); if (d > 0.05) { D.a += da / d * v * dt; D.b += db / d * v * dt; D.h = Math.atan2(da, db); } D.v = d > 0.05 ? v : 0;
  const W2 = G.W / 2 - 0.5, D2 = G.D / 2 - 0.5; D.a = Math.max(-W2, Math.min(W2, D.a)); D.b = Math.max(-D2, Math.min(D2, D.b)); }
export const makeDog = () => ({ a: 0, b: 0, ta: 0, tb: 0, tq: 0, h: 0, v: 0, heel: 0, runT: 0, dash: 0, mk: 0 });

// ── 마을에 붙이기(createHerd) ──
//   짓기: town.js 목장 짓기가 reg(HP)로 목장 하나씩 알림(양·소 자리 = 짓기 때 ANIM9·PCOL에 꼬리표) → 다 지은 뒤 built(ROOT)
//   상태 HERD(판 하는 중) = town.js busy·tpPrep·잠·순간이동·자전거·키가 이 on을 봄 · 상태 교차 = tools/harness/town_state.cjs 'herd' 줄
//   판 밖(판이 없어도 세상이 움직임): 비·눈 = 양이 축사 처마 밑으로 걸어감(우와 3) · 갬 = 제자리로 · 몬 양 = 다음 아침까지 우리 안 → 아침에 걸어 나옴 · 퍼펙트 = 문에 리본(그날)
const SAVE0 = () => ({ v: 1, lv: 1, good: 0, n: 0, pen: 0, rib: 0, best: 0 });
const TXT = {
  ask: [['양 {n}마리를 저 우리에 넣어 줄래요?', 'Can you get the {n} sheep into that pen?'], ['우리 개가 아직 어려서 양을 흩뜨려요. 휘파람으로 옆에 불러 주세요.', 'Our young dog scatters the sheep. Whistle to call it to your side.'], ['새끼 양은 엄마 양만 따라가요.', 'Lambs only follow their mother.'], ['숫양은 고집이 세요. 서두르면 버텨요.', 'The ram is stubborn. Rush it and it stands its ground.']],
  rain: ['비가 와서 양들이 처마 밑에 모였어요. ', 'The rain sent the sheep under the eaves. '], dusk: ['해가 지니 양들도 우리로 가고 싶어 해요. ', 'At sunset the sheep want to go in too. '],
  goal: ['🐑 양을 우리에 넣어요 {k}/{n}', '🐑 Get the sheep into the pen {k}/{n}'],
  whK: [' (H = 휘파람)', ' (H = whistle)'], whT: [' (휘파람 단추)', ' (whistle button)'],
  out: ['🐑 우리 밖으로 나와요. 그래야 문을 닫아요', '🐑 Step out of the pen so the gate can close'],
  tip0: ['천천히 걸어서 양 뒤로 가면 양이 앞으로 가요', 'Walk slowly behind the sheep and they move ahead'], left: ['10초 남았어요', '10 seconds left'],
  ok: ['양 {n}마리가 다 들어갔어요({t}초). ', 'All {n} sheep are in ({t}s). '], fail: ['시간이 다 됐어요. 양 {k}마리가 들어갔어요. ', 'Time is up. {k} sheep got in. '], quit: ['양몰이는 다음에 해요. 양들은 제자리로 돌아가요.', 'Herding later, then. The sheep walk back.'],
  nRun: ['다음엔 뛰지 말고 걸어서 밀어 봐요.', 'Next time, walk instead of running.'], nDog: ['다음엔 처음부터 개를 옆에 불러 두어요.', 'Next time, call the dog to your side first.'], nLamb: ['다음엔 엄마 양을 먼저 몰아 봐요. 새끼가 따라와요.', 'Next time, move the mother first. The lambs follow.'],
  nRam: ['다음엔 숫양 앞에서 잠깐 기다려 봐요.', 'Next time, wait a moment in front of the ram.'], nGat: ['다음엔 떨어진 양부터 무리로 모아 봐요.', 'Next time, gather the strays into the flock first.'], nLead: ['다음엔 앞장선 양을 먼저 문으로 밀어 봐요.', 'Next time, push the leading sheep to the gate first.'], rib: ['문에 리본을 달았어요.', 'A ribbon goes on the gate.'],
  rest: ['양들은 오늘 우리에서 쉬어요. 내일 아침에 풀밭으로 나가요.', 'The sheep rest in the pen today. They go out tomorrow morning.'], rel: ['양들을 풀밭으로 내보낼게요. 다 나오면 다시 불러 줘요.', 'I’ll let the sheep out. Call me again when they are out.'],
  pr: ['오늘 몫은 다 받았어요. 내일 아침 6시에 다시 받아요. ', 'Today’s share is done. More tomorrow at 6:00. '],
  up: [['이제 우리 개도 같이 해요. 휘파람을 불면 옆으로 와요.', 'Our dog will help now. Whistle and it comes to your side.'], ['이번 봄에 새끼 양 둘이 태어났어요. 새끼는 엄마만 따라가요.', 'Two lambs were born this spring. They follow only their mother.'], ['양 한 마리가 자라 고집 센 숫양이 됐어요. 천천히 기다려 줘야 움직여요.', 'One sheep grew into a stubborn ram. Be patient and it will move.']],
  upB: [['🐕 목장 개가 같이 일해요', '🐕 The ranch dog joins in'],
    ['🐑 새끼 양이 생겼어요', '🐑 Lambs at the ranch'],
    ['🐏 숫양이 생겼어요', '🐏 A ram at the ranch']],
};
const tx = (k, en, o) => { let t = (Array.isArray(k) ? k : TXT[k])[en ? 1 : 0]; if (o) for (const q in o) t = t.split('{' + q + '}').join(o[q]); return t; };
export function createHerd(o) {
  const T3 = o.T3, map = o.map, PS = [], M4 = new T3.Matrix4(), Q4 = new T3.Quaternion(), V3 = new T3.Vector3(), S3 = new T3.Vector3(), UP = new T3.Vector3(0, 1, 0);
  let root = null, H = null, wb9 = null, jb9 = null, LW = '';   /* LW = 마지막 판이 끝난 까닭(시험 읽기) */   /* H = 지금 판(없으면 null) · wb9 = 터치 휘파람 단추 */
  const SV = () => { const S = o.S(); if (!S.herd || S.herd.v !== 1) S.herd = SAVE0(); return S.herd; };
  // 목장 판 자리 ↔ 세상: 짓기와 같은 LP(x, z, ry)
  const W2L = (P, x, z, out) => { const dx = x - P.x, dz = z - P.z; out[0] = dx * P.c - dz * P.s; out[1] = dx * P.s + dz * P.c; return out; };
  const LX = (P, a, b) => P.x + a * P.c + b * P.s, LZ = (P, a, b) => P.z - a * P.s + b * P.c, L9 = new Float32Array(2);
  // 짓기 알림: HP = { x, z, ry, W, D, bl, hay:[[a,b]], wk:[a,b], an:[{ k:'sheep'|'cow', a, b, h, s }] } → 판·떼·소를 만듦
  function reg(HP) { HP.c = Math.cos(HP.ry); HP.s = Math.sin(HP.ry); const pn = penOf(HP.W, HP.D); HP.pen = pn; HP.sh = HP.an.filter(q => q.k === 'sheep'); HP.cw = HP.an.filter(q => q.k === 'cow');
    HP.G = { W: HP.W, D: HP.D, pa0: pn.pa0, pa1: pn.pa1, pb1: pn.pb1, ga0: pn.ga0, ga1: pn.ga1, phi: 0, barn: [HP.bl[0], HP.bl[1], 6.65, 3.65], hay: new Float32Array(8), nh: Math.min(4, HP.hay.length), cow: new Float32Array(8), nc: 0, dusk: false };
    HP.hay.slice(0, 4).forEach((q, i) => { HP.G.hay[i * 2] = q[0]; HP.G.hay[i * 2 + 1] = q[1]; }); HP.F = makeFlock(Math.min(7, HP.sh.length)); HP.Dg = makeDog(); HP.dogM = null; HP.PM = null; HP.gH = null; HP.phi = 0; HP.phT = 0; HP.dirty = true; HP.ring = null; HP.amb = 'home'; HP.shutAfter = false;
    for (const an of HP.an) { an.home = [an.a, an.b, an.h]; an.pt = new Float32Array(6); an.pn = 0; an.pi = 0; an.v = 0; an.th = an.h; an.y = 0; an.yT = 0; an.yq = 0; an.md = 0; an.walk = false; an.need = false; an.mh = null; an.mi = -1; an.h9 = null; an.sc = an.s; }
    PS.push(HP); }
  // 짓고 난 뒤: 인스턴스 자리·충돌 핸들을 받음 → 문·리본·개 갈 자리 메시 · 저장된 상태(우리 안 · 꼬임 세상 변화) 되살림
  function built(R) { root = R; const sv = SV(), S = o.S(); for (const HP of PS) { if (!HP.sh.length) continue; for (const an of HP.an) { an.y = an.yT = o.ty(LX(HP, an.a, an.b), LZ(HP, an.a, an.b)); an.yq = Math.random() * 0.2; if (an.mh) an.mh.m.frustumCulled = false; }   /* 양이 목장 안을 돌아다님 → 짓기 때 둘레 공보다 넓게 움직임 */
      props(HP); kinds(HP); const wet = o.wx() === 'rain' || o.wx() === 'snow'; if (sv.pen && sv.pen === S.day) { penSpots(HP, false); for (const an of HP.sh) snap(HP, an); HP.amb = 'pen'; } else { if (sv.pen) { sv.pen = 0; o.mark(); } if (wet) { eaveSpots(HP, true); HP.amb = 'eave'; } }
      if (HP.amb !== 'pen') { HP.phi = HP.phT = Math.PI; HP.G.phi = Math.PI; HP.dirty = true; propW(HP); }   /* 빈 우리 = 문을 젖혀 둠(드나들 수 있게 · 닫는 건 양이 들어갔을 때만) */
      gateCol(HP); if (sv.lv >= 2) dogMesh(HP); } }
  function reset() { if (H) stop('reset'); for (const HP of PS) { for (const an of HP.an) if (an.h9) { an.h9.remove(); an.h9 = null; } if (HP.gH) { HP.gH.remove(); HP.gH = null; } if (HP.PM) { HP.PM.geometry.dispose(); HP.PM = null; } if (HP.dogM) { HP.dogM.dispose(); HP.dogM = null; } } PS.length = 0; root = null; }
  // 꼬임이 세상에 남긴 것: 3 = 새끼 둘(대장 양의 새끼) · 4 = 숫양 하나(더 큼)
  function kinds(HP) { const lv = SV().lv, F = HP.F; F.KD.fill(0); F.MO.fill(-1); F.lead = 0; HP.sh.forEach((an, i) => { an.sc = an.s; if (i < F.n) { if (lv >= 3 && (i === 1 || i === 2) && F.n >= 4) { F.KD[i] = 1; F.MO[i] = 0; an.sc = an.s * 0.6; } if (lv >= 4 && i === F.n - 1 && F.n >= 5) { F.KD[i] = 2; an.sc = an.s * 1.25; } } put(HP, an, 0); }); }
  // 양·소 한 마리 그리기(원래 인스턴스 메시의 그 칸만 고침)
  function put(HP, an, dt) { if (!an.mh || an.mi < 0) return; const x = LX(HP, an.a, an.b), z = LZ(HP, an.a, an.b); if ((an.yq -= dt) <= 0) { an.yq = 0.2; an.yT = o.ty(x, z); } an.y += (an.yT - an.y) * (dt > 0 ? Math.min(1, dt * 8) : 1);   /* 땅 높이 = 0.2초마다 재고 사이는 따라감 */
    Q4.setFromAxisAngle(UP, an.h + HP.ry); M4.compose(V3.set(x, an.y, z), Q4, S3.set(an.sc, an.sc, an.sc)); an.mh.m.setMatrixAt(an.mi, M4); an.mh.m.instanceMatrix.needsUpdate = true; }
  const mode = (an, md) => { if (an.md !== md && an.mh) { an.md = md; an.mh.mode(an.mi, md); } };
  // 충돌(판 밖에서 서 있는 동안만): 걷기 시작하면 떼고 · 멈추면 그 자리에 붙임(내가 바로 옆에 있으면 비킬 때까지 기다림)
  function colOff(an) { if (an.h9) { an.h9.remove(); an.h9 = null; } an.need = false; }
  function colOn(HP, an) { colOff(an); const x = LX(HP, an.a, an.b), z = LZ(HP, an.a, an.b), me = map.player.pos(); if (Math.hypot(me.x - x, me.z - z) < 1.3) { an.need = true; return; } const cow = an.k === 'cow', y = an.y, k = an.sc / an.s;
    an.h9 = o.colAdd(o.lowNc(o.col90(x, z, cow ? 0.45 : 0.5 * k, cow ? 1.2 : 0.75 * k, an.h + HP.ry, y - 1, y + (cow ? 1.45 : 1.2 * k)))); }
  function snap(HP, an) { an.walk = false; an.pn = 0; const x = LX(HP, an.a, an.b), z = LZ(HP, an.a, an.b); an.y = an.yT = o.ty(x, z); mode(an, 0); put(HP, an, 0); colOn(HP, an); }
  // 걷기(판 밖 · 소 · 끝난 뒤 돌아가기): 점 셋까지 차례로 · 우리 안팎을 오가면 문 안 → 문 밖을 거침 · 카메라가 멀면 바로 그 자리(아무도 못 봄)
  const Q9 = new Float32Array(6);
  function walkTo(HP, an, ta, tb, th, v) { const G = HP.G, gc = (G.ga0 + G.ga1) / 2, inA = inPen(G, an.a, an.b), inB = inPen(G, ta, tb); let n = 0; if (inA !== inB) { if (inA) { Q9[0] = gc; Q9[1] = G.pb1 - 1.4; Q9[2] = gc; Q9[3] = G.pb1 + 1.6; } else { Q9[0] = gc; Q9[1] = G.pb1 + 1.6; Q9[2] = gc; Q9[3] = G.pb1 - 1.4; } n = 2; }
    Q9[n * 2] = ta; Q9[n * 2 + 1] = tb; n++; for (let k = 0; k < n * 2; k++) an.pt[k] = Q9[k]; an.pn = n; an.pi = 0; an.v = v; an.th = th; an.walk = true; colOff(an);
    const cp = map.camera.position; if (Math.hypot(cp.x - LX(HP, ta, tb), cp.z - LZ(HP, ta, tb)) > 150 && Math.hypot(cp.x - HP.x, cp.z - HP.z) > 150) { an.a = ta; an.b = tb; an.h = th; snap(HP, an); } }
  function walkStep(HP, an, dt) { const ta = an.pt[an.pi * 2], tb = an.pt[an.pi * 2 + 1], da = ta - an.a, db = tb - an.b, d = Math.hypot(da, db);
    if (d < 0.3) { if (++an.pi >= an.pn) { an.h = an.th; snap(HP, an); } return; } const st = Math.min(d, an.v * dt); an.a += da / d * st; an.b += db / d * st; let dh = Math.atan2(da, db) - an.h; dh -= Math.round(dh / 6.2832) * 6.2832; an.h += dh * Math.min(1, dt * 5); mode(an, 1); put(HP, an, dt); }
  // 자리 모음: 처마 밑(축사 앞벽을 따라) · 우리 안(두 줄) · 소 = 축사 옆 오른쪽 울타리 곁
  function eaveSpots(HP, now) { const bl = HP.bl, n = HP.sh.length; HP.sh.forEach((an, i) => { const a = bl[0] - 5 + (n > 1 ? i * 10 / (n - 1) : 5), b = bl[1] + 3.65 + 0.75 + (i % 2) * 0.45; if (now) { an.a = a; an.b = b; an.h = Math.PI; snap(HP, an); } else walkTo(HP, an, a, b, Math.PI, 0.9 + (i % 3) * 0.1); }); }
  function penSpots(HP, walk) { const G = HP.G, n = HP.sh.length, w = G.pa1 - G.pa0 - 2.4, nc = Math.ceil(n / 2); HP.sh.forEach((an, i) => { const r = i % 2, c = (i / 2) | 0, a = G.pa0 + 1.2 + (nc > 1 ? c * w / (nc - 1) : w / 2), b = -G.D / 2 + 1.6 + r * 2.4; if (walk) walkTo(HP, an, a, b, 0, 0.9); else { an.a = a; an.b = b; an.h = (i * 1.7) % 6.28; } }); }
  const cowSpot = (HP, i) => [HP.W / 2 - 2.4 - (i % 2) * 2.4, HP.bl[1] + 9.5 + i * 1.6];
  // 우리 문·리본·개 갈 자리 = 메시 하나(정점 = 세상 자리로 다시 씀 · 바뀔 때만)
  const UB = (() => { const g = new T3.BoxGeometry(1, 1, 1).toNonIndexed(), q = { p: g.attributes.position.array.slice(), n: g.attributes.normal.array.slice() }; g.dispose(); return q; })();
  function tmpl(L) { const P = [], N = [], C = [], c9 = new T3.Color(), col = h => { c9.set(h); c9.convertSRGBToLinear(); return [c9.r, c9.g, c9.b]; }, bx = (u, y, w, su, sy, sw, h) => { const c = col(h); for (let i = 0; i < UB.p.length; i += 3) { P.push(u + UB.p[i] * su, y + UB.p[i + 1] * sy, w + UB.p[i + 2] * sw); N.push(UB.n[i], UB.n[i + 1], UB.n[i + 2]); C.push(c[0], c[1], c[2]); } };
    const wo = 0x8a6440, ra = 0xc8a070, wd = -0.1; bx(0.08, 0.6, wd, 0.12, 1.1, 0.12, wo); bx(L - 0.08, 0.6, wd, 0.1, 1.06, 0.1, wo); bx(L / 2, 0.58, wd, 0.08, 1.0, 0.08, wo); for (const y of [0.36, 0.66, 0.96]) bx(L / 2, y, wd, L - 0.12, 0.08, 0.07, ra);   /* 문짝: 기둥 둘 + 가운데 살 + 가로대 셋(바깥 울타리 가로대 0.5·0.95와 높이를 어긋냄) */
    const ng = P.length / 3; bx(L / 2, 1.06, wd - 0.07, 0.14, 0.14, 0.1, 0xd83a3a); bx(L / 2 - 0.17, 1.08, wd - 0.07, 0.2, 0.13, 0.05, 0xe85a50); bx(L / 2 + 0.17, 1.08, wd - 0.07, 0.2, 0.13, 0.05, 0xe85a50); bx(L / 2 - 0.06, 0.88, wd - 0.07, 0.05, 0.3, 0.03, 0xd83a3a); bx(L / 2 + 0.06, 0.88, wd - 0.07, 0.05, 0.3, 0.03, 0xd83a3a);
    const nr = P.length / 3, rc = col(0xf2c230); for (let k = 0; k < 16; k++) { const a0 = k / 16 * 6.2832, a1 = (k + 1) / 16 * 6.2832, R0 = 0.5, R1 = 0.75; for (const [r, a] of [[R0, a0], [R1, a0], [R1, a1], [R0, a0], [R1, a1], [R0, a1]]) { P.push(Math.sin(a) * r, 0, Math.cos(a) * r); N.push(0, 1, 0); C.push(rc[0], rc[1], rc[2]); } }   /* 개 갈 자리 = 땅 위 노란 고리 */
    return { P: new Float32Array(P), N: new Float32Array(N), C: new Float32Array(C), ng, nr, nt: P.length / 3 }; }
  let TM = null;
  function props(HP) { const G = HP.G, L = G.ga1 - G.ga0; if (!TM || TM.L !== L) { TM = tmpl(L); TM.L = L; } const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.BufferAttribute(new Float32Array(TM.nt * 3), 3)); g.setAttribute('normal', new T3.BufferAttribute(new Float32Array(TM.nt * 3), 3)); g.setAttribute('color', new T3.BufferAttribute(TM.C.slice(), 3));
    HP.gy = o.ty(LX(HP, (G.ga0 + G.ga1) / 2, G.pb1), LZ(HP, (G.ga0 + G.ga1) / 2, G.pb1)); g.boundingSphere = new T3.Sphere(new T3.Vector3(HP.x, HP.gy, HP.z), Math.hypot(HP.W, HP.D) / 2 + 6); const m = new T3.Mesh(g, o.matV()); m.matrixAutoUpdate = false; m.userData.fx = 1; root.add(m); HP.PM = m; HP.dirty = true; propW(HP); }
  function propW(HP) { if (!HP.PM || !HP.dirty) return; HP.dirty = false; const G = HP.G, ph = HP.phi, cf = Math.cos(ph), sf = Math.sin(ph), PA = HP.PM.geometry.attributes.position.array, NA = HP.PM.geometry.attributes.normal.array, rib = SV().rib === o.S().day, hx = LX(HP, G.ga0, G.pb1), hz = LZ(HP, G.ga0, G.pb1);
    for (let v = 0; v < TM.nr; v++) { const i = v * 3; if (v >= TM.ng && !rib) { PA[i] = hx; PA[i + 1] = HP.gy - 2; PA[i + 2] = hz; NA[i] = 0; NA[i + 1] = 1; NA[i + 2] = 0; continue; } const u = TM.P[i], y = TM.P[i + 1], w = TM.P[i + 2], a = G.ga0 + u * cf - w * sf, b = G.pb1 + u * sf + w * cf;
      PA[i] = LX(HP, a, b); PA[i + 1] = HP.gy + y; PA[i + 2] = LZ(HP, a, b); const nu = TM.N[i], nw = TM.N[i + 2], na = nu * cf - nw * sf, nb = nu * sf + nw * cf; NA[i] = na * HP.c + nb * HP.s; NA[i + 1] = TM.N[i + 1]; NA[i + 2] = -na * HP.s + nb * HP.c; }
    const rg = HP.ring; for (let v = TM.nr; v < TM.nt; v++) { const i = v * 3; if (!rg) { PA[i] = hx; PA[i + 1] = HP.gy - 2; PA[i + 2] = hz; } else { PA[i] = rg[0] + TM.P[i]; PA[i + 1] = rg[2]; PA[i + 2] = rg[1] + TM.P[i + 2]; } NA[i] = 0; NA[i + 1] = 1; NA[i + 2] = 0; }
    HP.PM.geometry.attributes.position.needsUpdate = true; HP.PM.geometry.attributes.normal.needsUpdate = true; }
  // 문 충돌: 닫혔으면 문 줄에 막이(사람) · 열리면 뗌
  function gateCol(HP) { const G = HP.G, shut = HP.phi < 0.05; if (shut && !HP.gH) { const gc = (G.ga0 + G.ga1) / 2, x = LX(HP, gc, G.pb1 + 0.1), z = LZ(HP, gc, G.pb1 + 0.1); HP.gH = o.colAdd(o.lowNc(o.col90(x, z, (G.ga1 - G.ga0) / 2, 0.12, HP.ry, HP.gy - 1, HP.gy + 1.15))); } else if (!shut && HP.gH) { HP.gH.remove(); HP.gH = null; } }
  function gateTo(HP, open) { HP.phT = open ? Math.PI : 0; if (open && HP.gH) { HP.gH.remove(); HP.gH = null; } }
  function gateTick(HP, dt) { if (HP.phi === HP.phT) return; const d = HP.phT - HP.phi; HP.phi += Math.sign(d) * Math.min(Math.abs(d), dt * 2.6); if (Math.abs(HP.phi - HP.phT) < 1e-3) { HP.phi = HP.phT; gateCol(HP); } HP.G.phi = HP.phi; HP.dirty = true; }
  // 개(꼬임 2부터 세상에 있음 · 판 밖 = 일꾼 곁에서 두리번)
  function dogMesh(HP) { if (HP.dogM || !root || !o.anm) return; const h = o.anm.mesh('dog', 1); if (!h) return; h.m.frustumCulled = false; h.m.matrixAutoUpdate = false; h.m.userData.fx = 1; root.add(h.m); HP.dogM = h; const D = HP.Dg; D.a = D.ta = HP.wk[0] + 1.4; D.b = D.tb = HP.wk[1] + 1.0; D.h = 0.6; D.v = 0; D.y = D.yT = o.ty(LX(HP, D.a, D.b), LZ(HP, D.a, D.b)); D.yq = 0; dogPut(HP, 0); h.mode(0, 2); }
  function dogPut(HP, dt) { const D = HP.Dg, h = HP.dogM; if (!h) return; const x = LX(HP, D.a, D.b), z = LZ(HP, D.a, D.b); if ((D.yq -= dt) <= 0) { D.yq = 0.2; D.yT = o.ty(x, z); } D.y += (D.yT - D.y) * (dt > 0 ? Math.min(1, dt * 8) : 1); Q4.setFromAxisAngle(UP, D.h + HP.ry); M4.compose(V3.set(x, D.y, z), Q4, S3.set(1.15, 1.15, 1.15)); h.m.setMatrixAt(0, M4); h.m.instanceMatrix.needsUpdate = true; }

  // ── 판 ──
  const near = (x, z) => { let best = null, bd = 60; for (const HP of PS) { if (!HP.sh.length || !HP.PM) continue; const d = Math.hypot(x - HP.x, z - HP.z) - Math.hypot(HP.W, HP.D) / 2; if (d < bd) { bd = d; best = HP; } } return best; };
  const can = w => !!(w && near(w.x, w.z));
  function start(w, force) { if (H) { if (!H.done) stop('quit'); return true; } const HP = near(w.x, w.z), bz = force ? '' : o.busy(); if (!HP || bz) { LW = 'no:' + (bz || 'far'); return false; } const en = o.en(), sv = SV(), st = !!o.stWork(w), pr = !st && o.limit(w), F = HP.F, n = F.n;
    const lv = force && force.lv ? force.lv : st ? 1 : sv.lv, cond = force && force.cond != null ? force.cond : st || sv.n < 3 ? '' : HP.amb === 'eave' ? 'rain' : o.phase() === 'sunset' ? 'dusk' : '';
    if (HP.amb === 'pen' && !force) { if (st) { release(HP); o.bubble(w, tx('rel', en)); } else o.bubble(w, tx('rest', en)); return true; }   /* 몬 양은 다음 아침까지 우리 안(다시 E = 그대로 끝나는 판 X) · 이야기가 기다리면 풀밭으로 내보냄 */
    if (HP.amb === 'pen') sv.pen = 0;
    if (force && force.cond === 'rain') { eaveSpots(HP, true); HP.amb = 'eave'; } else if (force) { for (const an of HP.sh) { if (an.walk || HP.amb !== 'home') { an.a = an.home[0]; an.b = an.home[1]; an.h = an.home[2]; snap(HP, an); } } HP.amb = 'home'; }   /* 시험 판 = 정한 자리에서 */
    kinds(HP); if (lv < 3) { F.KD.fill(0); F.MO.fill(-1); } else if (lv < 4) for (let i = 0; i < n; i++) if (F.KD[i] === 2) F.KD[i] = 0;   /* 이야기 판 = 첫 꼬임(새끼·숫양도 보통 양처럼) */
    for (let i = 0; i < n; i++) { const an = HP.sh[i]; colOff(an); an.walk = false; F.A[i] = an.a; F.B[i] = an.b; F.VA[i] = F.VB[i] = 0; F.FE[i] = 0; F.HD[i] = an.h; F.ST[i] = 0; F.WT[i] = Math.random() * 3; } F.lost = 0; F.runQ = 0; F.ramRun = 0; F.seed = (Date.now() & 0xffff) + 1;
    HP.cw.forEach((an, i) => { const q = cowSpot(HP, i); walkTo(HP, an, q[0], q[1], Math.PI / 2, 1.3); }); HP.G.dusk = cond === 'dusk'; gateTo(HP, true); HP.shutAfter = false;
    const D = HP.Dg, dog = lv >= 2 && !st; if (dog) { dogMesh(HP); D.heel = 0; D.tq = 1.5; D.dash = 0; D.runT = 0; D.ta = D.a; D.tb = D.b; }
    const me = map.player.pos(); W2L(HP, me.x, me.z, L9);
    H = { HP, w, lv, cond, st, pr, dog, t: 0, done: false, end: 0, settle: 0, k: -1, gk: -1, left: false, sp: 0, run: false, runN: 0, runC: 0, runHit: false, whN: 0, whT: -9, p0: map.player.pitch, pT: Math.min(0.78, map.player.pitch + 0.24), P: { a: L9[0], b: L9[1], run: false, dog: dog ? 1 : 0, da: D.a, db: D.b, heel: 0, h: 0 } };
    map.player.freeze(false); o.bubble(w, (cond ? tx(cond, en) : '') + tx(TXT.ask[Math.min(3, lv - 1)], en, { n })); if (sv.n === 0) setTimeout(() => { if (H && !H.done && H.t < 12) o.toast(tx('tip0', o.en()), 4); }, 2600);
    if (dog && o.touch()) whBtn(true); goalSay(); if (o.saw) o.saw(); if (o.hot) o.hot(); o.sfx('go');
    H.h0 = map.player.get().h; H.dh = 0; H.tq = 0;
    return true; }
  function goalSay() { if (!H) return; const en = o.en(), F = H.HP.F; let k = 0; for (let i = 0; i < F.n; i++) if (inPen(H.HP.G, F.A[i], F.B[i], 0.3)) k++; const ins = k === F.n && inPen(H.HP.G, H.P.a, H.P.b, -0.3), key = k * 2 + (ins ? 1 : 0);
    if (key === H.gk) return; if (k > H.k && H.k >= 0) o.tone(300 + k * 45, 0, 0.22, 'triangle', 0.1, 240 + k * 45); H.k = Math.max(H.k, k); H.gk = key; o.goal(ins ? tx('out', en) : tx('goal', en, { k, n: F.n }) + (H.dog ? tx(o.touch() ? 'whT' : 'whK', en) : '')); }   /* 한 마리 들어갈 때마다 '매' 한 음씩 높게(그 일의 소리) */
  function whistle() { if (!H || !H.dog || H.done) return false; const D = H.HP.Dg; o.tone(1500, 0, 0.12, 'sine', 0.16, 2100); o.tone(2100, 0.15, 0.2, 'sine', 0.16, 1500); D.heel = 1; D.runT = 0; H.whN++; H.whT = H.t; return true; }
  function whBtn(on) { if (on) { if (wb9) return; const j = document.getElementById('tJump'), R = j && j.getBoundingClientRect(); wb9 = document.createElement('button'); wb9.className = 'tbtn'; wb9.innerHTML = '<i>📣</i><span>' + (o.en() ? 'whistle' : '휘파람') + '</span>'; wb9.style.cssText = 'display:flex;' + (R && R.width ? 'left:' + R.left + 'px;top:' + R.top + 'px;width:' + R.width + 'px;height:' + R.height + 'px;' : 'right:24px;bottom:150px;width:72px;height:72px;');
      wb9.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); whistle(); }); document.body.appendChild(wb9); if (j) { jb9 = j; j.style.visibility = 'hidden'; } } else { if (wb9) { wb9.remove(); wb9 = null; } if (jb9) { jb9.style.visibility = ''; jb9 = null; } } }   /* 터치: 이 동안 점프 단추 자리 = 휘파람 */
  // 판 끝: ok = 별(0~3 · 안에서만) → 보상(town.js) · 사다리 · 한 줄(무엇이 됐나 + 다음에 해 볼 것)
  function finish(win, okF) { if (!H || H.done) return; LW = (win ? 'win' : 'fail') + '@' + H.t.toFixed(1); const en = o.en(), HP = H.HP, F = HP.F, G = HP.G, sv = SV(), t = Math.round(H.t), lv = H.lv; H.done = true; H.end = 0;
    let k = 0; for (let i = 0; i < F.n; i++) if (inPen(G, F.A[i], F.B[i], 0.3)) k++;
    const s2 = win && H.t <= 45 && H.runN === 0, s3 = win && (lv === 1 ? H.t <= 35 : lv === 2 ? HP.Dg.dash <= 1 : lv === 3 ? F.lost <= 4 : !F.ramRun);
    const ok = okF != null ? okF : win ? 1 + (s2 ? 1 : 0) + (s3 ? 1 : 0) : 0;
    const nx = H.runN > 0 ? 'nRun' : lv >= 2 && HP.Dg.dash > 1 ? 'nDog' : lv >= 3 && F.lost > 4 ? 'nLamb' : lv >= 4 && F.ramRun ? 'nRam' : !win || H.t > 45 ? 'nGat' : ok >= 3 ? 'rib' : 'nLead';
    const rw = o.reward(H.w, ok, { pr: H.pr, st: H.st }) || '';
    sv.n++; if (ok >= 2) sv.good++; if (win && okF == null && (!sv.best || H.t < sv.best)) sv.best = Math.round(H.t);
    let up = 0; if (sv.good >= 3 && sv.lv < 4) { sv.lv++; sv.good = 0; up = sv.lv; }   /* 잘한 판 셋 = 다음 꼬임(연습 판도 셈 · 내려가지 않음) */
    if (win && okF == null) { sv.pen = o.S().day; if (ok >= 3) { sv.rib = o.S().day; HP.dirty = true; } }
    o.mark(); o.toast((H.pr ? tx('pr', en) : '') + (win ? tx('ok', en, { n: F.n, t }) : tx('fail', en, { k })) + tx(nx, en) + rw, 5); o.sfx(win ? 'done' : 'buzz');
    if (win && okF == null) { gateTo(HP, false); H.settle = 2.2; } else { H.settle = 0; home(HP); }
    const w = H.w; if (up) setTimeout(() => { if (!HP.PM) return; o.bubble(w, tx(TXT.up[up - 2], o.en())); o.banner(tx(TXT.upB[up - 2], o.en()), 3.2); if (up === 2) dogMesh(HP); if (!H || H.HP !== HP) kinds(HP); }, 2400);
    if (H.dog) { const D = HP.Dg; D.heel = 0; D.ta = HP.wk[0] + 1.4; D.tb = HP.wk[1] + 1.0; }
    whBtn(false); o.goal(null); if (o.hot) setTimeout(() => o.hot(), 0); }
  // 끝·그만: 양은 걸어서 제자리로(비면 처마 밑) · 소도 제자리로 · 개는 일꾼 곁 · 우리에 들어간 양은 문으로 걸어 나옴
  function home(HP) { const F = HP.F, wet = o.wx() === 'rain' || o.wx() === 'snow'; for (let i = 0; i < F.n; i++) { const an = HP.sh[i]; an.a = F.A[i]; an.b = F.B[i]; an.h = F.HD[i]; } if (wet) { eaveSpots(HP, false); HP.amb = 'eave'; } else { for (const an of HP.sh) walkTo(HP, an, an.home[0], an.home[1], an.home[2], 1.0 + Math.random() * 0.2); HP.amb = 'home'; }
    for (const an of HP.cw) walkTo(HP, an, an.home[0], an.home[1], an.home[2], 1.0); gateTo(HP, true); HP.shutAfter = false; HP.G.dusk = false; const D = HP.Dg; D.heel = 0; D.ta = HP.wk[0] + 1.4; D.tb = HP.wk[1] + 1.0; }
  function stop(why) { if (!H) return; if (!H.done) LW = why + '@' + H.t.toFixed(1); const HP = H.HP, en = o.en(); if (why === 'reset') { whBtn(false); o.goal(null); H = null; return; }
    if (!H.done) { H.done = true; if (why === 'quit' || why === 'away') o.toast(tx('quit', en), 3); home(HP); whBtn(false); o.goal(null); if (o.hot) setTimeout(() => o.hot(), 0); } else if (H.settle > 0) settle(HP); camBack(true); H = null; }
  function settle(HP) { const F = HP.F; for (let i = 0; i < F.n; i++) { const an = HP.sh[i]; an.a = F.A[i]; an.b = F.B[i]; an.h = F.HD[i]; snap(HP, an); } HP.amb = 'pen'; for (const an of HP.cw) walkTo(HP, an, an.home[0], an.home[1], an.home[2], 1.0); if (H) H.settle = 0; }
  function camBack(now) { if (!H) return; const p = map.player.pitch; if (Math.abs(p - H.pT) < 0.12 || !now) map.player.setPitch(now ? H.p0 : p + (H.p0 - p) * 0.08); }
  // 매 프레임(판 · 걷는 양·소 · 문 · 개)
  function tick(dt, paused) { if (!PS.length) return; dt = Math.min(dt, 0.05);
    for (const HP of PS) { if (!HP.sh.length || !HP.PM) continue; gateTick(HP, dt); if (HP.shutAfter) { let busy = false; for (const an of HP.sh) if (an.walk && inPen(HP.G, an.a, an.b, -1.5)) { busy = true; break; } if (!busy) { HP.shutAfter = false; gateTo(HP, false); } } propW(HP);
      if (!H || H.HP !== HP || H.done) for (const an of HP.an) if (an.walk) walkStep(HP, an, dt);
      if (HP.dogM && (!H || H.HP !== HP || H.done)) dogIdle(HP, dt); }
    if (!H) return; if (H.done) { const HP = H.HP; if (H.settle > 0) { H.settle -= dt; H.P.a = 1e4; H.P.b = 1e4; H.P.dog = 0; herdStep(HP.G, HP.F, H.P, dt); for (let i = 0; i < HP.F.n; i++) { const an = HP.sh[i]; an.a = HP.F.A[i]; an.b = HP.F.B[i]; an.h = HP.F.HD[i]; mode(an, Math.hypot(HP.F.VA[i], HP.F.VB[i]) > 0.25 ? 1 : 0); put(HP, an, dt); } if (H.settle <= 0) settle(HP); return; }   /* 문이 닫히는 동안 우리 안 양이 자리 잡음 */
      H.end += dt; camBack(false); if (H.end > 1.2) { camBack(true); H = null; } return; }
    if (paused) return; const HP = H.HP, F = HP.F, G = HP.G, P = H.P, me = map.player.pos(); H.t += dt;
    if (H.t < 1.6) { const p = map.player.pitch; map.player.setPitch(p + (H.pT - p) * Math.min(1, dt * 2.5)); }   /* 시작: 카메라를 부드럽게 조금 들어 올림(시점 변화 · 컷신 X) */
    if (!H.tq && H.t >= 3.3) { H.tq = 1; const cp = map.player.get(); let d0 = cp.h - H.h0; d0 -= Math.round(d0 / 360) * 360; if (Math.abs(d0) < 5 && H.sp < 0.4 && !map.player.input) { let ca = 0, cb = 0; for (let i = 0; i < F.n; i++) { ca += F.A[i]; cb += F.B[i]; } ca /= F.n || 1; cb /= F.n || 1; let dh = Math.atan2(LX(HP, ca, cb) - me.x, -(LZ(HP, ca, cb) - me.z)) * 57.29578 - cp.h; dh -= Math.round(dh / 360) * 360; if (Math.abs(dh) > 25) { H.dh = dh; H.h0 = cp.h; H.tt = H.t; } } }   /* 일꾼 말풍선(3.2초)이 사라진 뒤에도 가만히 있으면 = 양 떼 쪽으로 1.2초 동안 천천히 돌아봄(말풍선이 카메라 앞을 가리지 않게 · 손으로 돌리거나 걸으면 안 함) */
    if (H.dh) { if (map.player.input) H.dh = 0; else { const u = Math.min(1, (H.t - H.tt) / 1.2), e9 = u * u * (3 - 2 * u); map.player.face(H.h0 + H.dh * e9); if (u >= 1) H.dh = 0; } }
    W2L(HP, me.x, me.z, L9); const mv = Math.hypot(L9[0] - P.a, L9[1] - P.b); if (mv > 3) { stop('tp'); return; } H.sp += (mv / Math.max(dt, 1e-3) - H.sp) * Math.min(1, dt * 8); if (mv > 0.01) P.h = Math.atan2(L9[0] - P.a, L9[1] - P.b); P.a = L9[0]; P.b = L9[1];
    const run = H.sp > 5.2; P.run = run; if (run && !H.run) H.runC = 0; H.run = run; if (run) { H.runC += dt; if (H.runC > 0.25 && !H.runHit) { for (let i = 0; i < F.n; i++) if (Math.hypot(F.A[i] - P.a, F.B[i] - P.b) < HK.R0 * HK.RUN && !inPen(G, F.A[i], F.B[i])) { H.runN++; H.runHit = true; break; } } } else H.runHit = false;   /* 뛰어서 양을 놀래킨 번 수(뛰기 한 번 = 한 번) */
    if (Math.abs(P.a) > G.W / 2 + 14 || Math.abs(P.b) > G.D / 2 + 14) { stop('away'); return; }
    G.nc = 0; for (let i = 0; i < HP.cw.length && i < 4; i++) { G.cow[i * 2] = HP.cw[i].a; G.cow[i * 2 + 1] = HP.cw[i].b; G.nc++; } for (const an of HP.cw) if (an.walk) walkStep(HP, an, dt);
    if (H.dog) { const D = HP.Dg; dogStep(G, F, D, P, dt); P.da = D.a; P.db = D.b; P.heel = D.heel; const sh9 = D.mk || (D.heel && H.t - H.whT < 1.4); if (sh9) { const x = LX(HP, D.ta, D.tb), z = LZ(HP, D.ta, D.tb); if (!HP.ring || Math.hypot(HP.ring[0] - x, HP.ring[1] - z) > 0.4) { if (!HP.ring) HP.ring = new Float32Array(3); HP.ring[0] = x; HP.ring[1] = z; HP.ring[2] = o.ty(x, z) + 0.07; HP.dirty = true; } D.mk = 0; } else if (HP.ring && D.heel) { HP.ring = null; HP.dirty = true; }   /* 노란 고리 = 개가 뛰어갈 자리(제멋대로 갈 때 · 부른 뒤 잠깐) — 옆에 붙어 걸을 땐 숨김 */ if (HP.dogM) HP.dogM.mode(0, D.v > 0.3 ? 1 : 2); dogPut(HP, dt); }
    herdStep(G, F, P, dt);
    for (let i = 0; i < F.n; i++) { const an = HP.sh[i]; an.a = F.A[i]; an.b = F.B[i]; an.h = F.HD[i]; mode(an, Math.hypot(F.VA[i], F.VB[i]) > 0.25 ? 1 : 0); put(HP, an, dt); }
    goalSay(); if (!H.st && H.t > 50 && !H.left) { H.left = true; o.toast('⏳ ' + tx('left', o.en()), 2.4); }
    let all = true; for (let i = 0; i < F.n; i++) if (!inPen(G, F.A[i], F.B[i], 0.3)) { all = false; break; }
    if (all && !inPen(G, P.a, P.b, -0.3)) finish(true); else if (!H.st && H.t >= 60) finish(false); }
  function dogIdle(HP, dt) { const D = HP.Dg, da = D.ta - D.a, db = D.tb - D.b, d = Math.hypot(da, db); if (d > 0.2) { const v = Math.min(3, d * 2); D.a += da / d * v * dt; D.b += db / d * v * dt; D.h = Math.atan2(da, db); D.v = v; HP.dogM.mode(0, 1); dogPut(HP, dt); } else if (D.v) { D.v = 0; HP.dogM.mode(0, 2); dogPut(HP, dt); if (HP.ring) { HP.ring = null; HP.dirty = true; } } }
  // 1초마다(판 밖): 비·눈 = 처마 밑으로 · 갬 = 제자리로 · 몬 양 = 다음 아침에 걸어 나옴 · 비켜 주기를 기다리던 충돌 · 리본은 그날만
  function sec() { const sv = SV(), S = o.S(), wet = o.wx() === 'rain' || o.wx() === 'snow'; for (const HP of PS) { if (!HP.sh.length || !HP.PM) continue; for (const an of HP.an) if (an.need && !an.walk) colOn(HP, an); if (sv.rib && sv.rib !== S.day) { sv.rib = 0; HP.dirty = true; o.mark(); } if (sv.pen && S.day > sv.pen && HP.amb !== 'pen') { sv.pen = 0; o.mark(); } if (H && H.HP === HP) continue;
      if (HP.amb === 'pen') { if (!sv.pen || S.day > sv.pen) release(HP); continue; }
      if (wet && HP.amb === 'home') { eaveSpots(HP, false); HP.amb = 'eave'; } else if (!wet && HP.amb === 'eave') { for (const an of HP.sh) walkTo(HP, an, an.home[0], an.home[1], an.home[2], 0.8 + Math.random() * 0.2); HP.amb = 'home'; } } }
  function release(HP) { const sv = SV(), wet = o.wx() === 'rain' || o.wx() === 'snow'; sv.pen = 0; o.mark(); if (wet) { eaveSpots(HP, false); HP.amb = 'eave'; } else { for (const an of HP.sh) walkTo(HP, an, an.home[0], an.home[1], an.home[2], 0.9 + Math.random() * 0.2); HP.amb = 'home'; } gateTo(HP, true); HP.shutAfter = false; }   /* 아침 = 문을 열고 걸어 나옴(빈 우리는 열어 둠) */
  function key(e) { if (!H || H.done) return false; if (e.code === 'Escape') { if (!e.repeat) stop('quit'); return true; } if (e.code === 'KeyH' && H.dog) { if (!e.repeat) whistle(); return true; } return false; }
  // 시험·읽기(하네스 town_herd.cjs · town_state.cjs)
  function info() { const HP = H ? H.HP : PS.find(q => q.sh.length && q.PM); if (!HP) return null; const F = HP.F, G = HP.G, me = map.player.pos(), on = !!H && !H.done; W2L(HP, me.x, me.z, L9); const sh = [];
    for (let i = 0; i < HP.sh.length; i++) { const an = HP.sh[i], a = i < F.n && on ? F.A[i] : an.a, b = i < F.n && on ? F.B[i] : an.b, x = LX(HP, a, b), z = LZ(HP, a, b); sh.push({ a: +a.toFixed(2), b: +b.toFixed(2), x: +x.toFixed(2), z: +z.toFixed(2), in: inPen(G, a, b, 0.3), road: !!(o.onRoad && o.onRoad(x, z)), kd: i < F.n ? F.KD[i] : 0, walk: an.walk, col: !!an.h9 }); }
    return { on, why: LW, done: !!(H && H.done), lv: H ? H.lv : SV().lv, cond: H ? H.cond : '', st: H ? H.st : false, pr: H ? H.pr : false, t: H ? +H.t.toFixed(1) : 0, sv: { ...SV() }, amb: HP.amb, phi: +HP.phi.toFixed(2), gate: !!HP.gH, me: [+L9[0].toFixed(2), +L9[1].toFixed(2)], sp: H ? +H.sp.toFixed(2) : 0, runN: H ? H.runN : 0,
      dog: HP.dogM ? { a: +HP.Dg.a.toFixed(2), b: +HP.Dg.b.toFixed(2), heel: HP.Dg.heel, dash: HP.Dg.dash } : null, G: { W: G.W, D: G.D, pa0: G.pa0, pa1: G.pa1, pb1: G.pb1, ga0: G.ga0, ga1: G.ga1 }, c: HP.c, s: HP.s, x: HP.x, z: HP.z, ry: HP.ry, wk: [+LX(HP, HP.wk[0], HP.wk[1]).toFixed(2), +LZ(HP, HP.wk[0], HP.wk[1]).toFixed(2)], cows: HP.cw.map(an => [+an.a.toFixed(1), +an.b.toFixed(1), an.walk]), sh }; }
  return { reg, built, reset, can, start, stop, finishNow: ok => { if (H && !H.done) finish(ok > 0, ok); }, tick, sec, key, info, whistle, get on() { return !!H && !H.done; }, get busy() { return !!H; }, get pr() { return !!(H && H.pr); }, dispose() { reset(); whBtn(false); } };
}
