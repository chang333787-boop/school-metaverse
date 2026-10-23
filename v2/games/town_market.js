// 🧺 장터 값(MKT-2 · 단계 4 「23 장터 값」 · docs/systems/town_phase4.md): 공급 지수 × 수요 지수를 0.85~1.15로 가둬 priceAt에 곱함 — three 없이 자료와 순수 함수만(그리기 0)
//   공급 = 그 물건이 나는 지역의 사흘 쌓인 비(r3 = 오늘·어제·그제) + 제철 + 바다 소금은 맑고 바람 센 어제 · 내가 만든 소금
//   수요 = 그 장터 칸에서 일하는 일꾼 수(길 사람 makeLife는 내 둘레라 쓰지 않음 — 되먹임) · 장날 ×1.2는 원래 자리(priceAt · 창 글)에 그대로
//   먼 곳 ×1.3과 demK(많이 팔면 내려감)는 그 뒤에 그대로 곱함 · 하루 한 번(날 바뀔 때) 셈 · 매 프레임 0
//   S.sim = { v:1, d, r3:{지역:[오늘,어제,그제]}, gust:[어제 바람 센 날?], salt:{d, n(오늘 만든 소금)}, ys(어제 만든 소금) } — 날씨 전선 팀의 town_sim.js가 생기면 r3만 그쪽으로 옮김
export const MK_V = 1;
export const R3REG = ['바다', '산', '들', '강', '시내', '읍내', '관광'];
const FIELD = { 들: 1, 산: 1, 강: 1 };
const h01 = (hashS, s) => (hashS(s) % 1000) / 1000;
/* 그날 그 지역에 온 비 양(0 ~ 1.2) · fc = 예보 이름('맑음'·'구름 조금'·'흐림'·'비'·'눈') · 산은 비가 조금 더(비탈에 구름이 걸림) */
export function rainAmt(fc, reg, day, hashS, id) { if (day < 1) return 0; const h = h01(hashS, 'r3:' + id + ':' + reg + ':' + day);
  if (fc === '비') return +(0.75 + 0.35 * h + (reg === '산' ? 0.1 : 0)).toFixed(2);
  if (fc === '눈') return +(0.4 + 0.2 * h).toFixed(2);
  if (fc === '흐림') return h < 0.3 ? 0.25 : 0;
  return 0; }
/* 날이 바뀔 때(그리고 처음 열 때) 채움 · fcAt(i) = i일 뒤 예보 이름(0 = 오늘 · −1 = 어제) · gustAt(d) = 바람 센 날? */
export function simFill(S, fcAt, hashS, id, gustAt) { const d = S.day; let M = S.sim; if (!M || typeof M !== 'object' || M.v !== 1) M = S.sim = { v: 1, d: -1, r3: {}, salt: { d, n: 0 }, ys: 0 };
  if (M.d === d && M.r3 && M.r3.바다) return M;
  const fc = [fcAt(0), fcAt(-1), fcAt(-2)]; M.r3 = {}; for (const r of R3REG) M.r3[r] = [0, 1, 2].map(i => rainAmt(fc[i], r, d - i, hashS, id));
  M.gy = !!(gustAt && gustAt(d - 1)) && fc[1] !== '비' && fc[1] !== '눈' && fc[1] !== '흐림';   /* 어제가 맑고 바람 센 날 = 염전에 소금이 많이 남 */
  if (!M.salt || typeof M.salt !== 'object') M.salt = { d, n: 0 }; if (M.salt.d !== d) { M.ys = M.salt.d === d - 1 ? M.salt.n | 0 : 0; M.salt = { d, n: 0 }; }
  M.d = d; return M; }
export const r3Sum = (M, reg) => { const a = M && M.r3 && M.r3[reg]; return a ? a[0] + a[1] + a[2] : 0; };
/* 공급(1 = 보통 · 작을수록 덜 들어옴) · e = 물건 · h = 나는 지역 · sea = 제철? */
export function supOf(M, e, h, sea) { if (!h) return 1; const r = r3Sum(M, h); let s = 1;
  if (e === '🧂') s = 1 - 0.1 * r + (M && M.gy ? 0.08 : 0) + Math.min(0.1, 0.025 * ((M && M.ys) | 0));   /* 비 = 염전 일을 쉼 · 맑고 바람 센 어제 + 내가 만든 소금 = 많이 */
  else if (FIELD[h]) s = 1 - 0.05 * r;   /* 비가 이어지면 밭·논에 못 들어감 */
  else if (h === '바다') s = 1 - 0.04 * r;   /* 비바람이면 배가 덜 나감 */
  if (sea) s += 0.06; return Math.max(0.7, Math.min(1.2, s)); }
/* 수요 = 장터 칸 일꾼 수(n) · 1명 = 보통 */
export const demOf = n => 1 + 0.025 * Math.max(0, Math.min(4, (n | 0) - 1));
/* 공급 × 수요를 가둠 · 공급이 적으면 값이 오름(1/공급) */
export const mkK = (sup, dem) => Math.max(0.85, Math.min(1.15, dem / sup));
/* 노점 바구니 소품 몇 개(0~3 · 3 = 가득) */
export const lumpsOf = sup => (sup >= 1.04 ? 3 : sup >= 0.94 ? 2 : sup >= 0.82 ? 1 : 0);
/* 상인이 두 번째로 말할 때 까닭 한 줄(사실 · 지어낸 사건 X) */
export function whyOf(M, e, h, sea, en) { const r = r3Sum(M, h);
  if (e === '🧂') { if (r >= 0.9) return en ? 'It rained for days, so the salt pans were closed. Little salt came in.' : '며칠 비가 와서 염전 일을 쉬었대요. 소금이 적게 들어왔어요.';
    if (M && (M.gy || M.ys)) return en ? 'Sunny, windy weather dries seawater fast — lots of salt came in.' : '맑고 바람 부는 날이라 바닷물이 잘 말랐대요. 소금이 많이 들어왔어요.'; }
  else if (r >= 0.9 && FIELD[h]) return en ? 'It rained for days, so farmers could not get into the fields. Less came in.' : '며칠 비가 와서 밭에 못 들어갔대요. 그래서 적게 들어왔어요.';
  else if (r >= 0.9 && h === '바다') return en ? 'Rainy, rough days — fewer boats went out.' : '비 오는 날이 이어져서 배가 덜 나갔대요.';
  if (sea) return en ? 'It is in season now, so plenty came in.' : '요즘이 제철이라 많이 들어왔어요.';
  return ''; }
