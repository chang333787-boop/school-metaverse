// 🐝 꽃가루받이 고리(POLLEN-1 · 발전 방향 #36 · 교사 10-17): 놀이 코드와 떼어 둔 규칙(town_res.js와 같은 결)
//   꿀벌을 돌본 날(양봉 일꾼 곁 꿀 뜨기를 BEE_N판 넘게 · 하나라도 땀) → 다음 날 과수원(배)·딸기 거들기 +1 '벌이 꽃가루를 옮겨 줬어요'(사실: 꿀벌이 꽃가루를 옮겨 열매가 맺힘 — 딸기 비닐하우스·배 과수원에서도 벌을 씀) · 아침 한 줄
//   눈에 보이게 = 꽃밭·과수원·비닐하우스·양봉장 가까이 나비 수를 늘림(이미 있는 나비 인스턴스의 count만 — 그리기 0) · 밤·비·눈·겨울엔 나비가 쉼
//   상태 = 놀이 상태 S.bee = { d: 날, n: 그날 판 수 } · S.pol = 꽃가루받이가 잘 된 날 — 매 프레임 일 0(1초 · 일이 끝날 때 · 새 날)
export const POL_V = 1, BEE_N = 2;
export const POL_T = {
  bee: ['🐝 꿀벌을 넉넉히 돌봤어요 — 내일은 벌이 꽃가루를 많이 옮겨서 배·딸기 열매가 더 잘 맺힐 거예요', '🐝 You took good care of the bees — tomorrow they will carry lots of pollen, so pears and strawberries set more fruit'],
  morning: ['🐝 어제 꿀벌을 많이 돌봤어요 — 오늘은 벌이 꽃가루를 옮겨 줘서 과수원·딸기 열매가 더 잘 맺혀요 (거들면 하나 더)', '🐝 You looked after the bees yesterday — today they carry pollen, so orchards and strawberries set more fruit (+1 when you help)'],
  plus: [' 🐝 벌이 꽃가루를 옮겨 줘서 하나 더!', ' 🐝 the bees carried pollen, +1!'],
};
// 마을 쪽이 넘기는 것(A): GAME · map · lang() · night() · wx() · sea() · nfx(n) 나비 수 · places() → [[x, z, r]] 꽃가루받이 자리 · fruit() 배·딸기 일꾼이 있나
export function createPollen(A) { let P9 = [], last = -1;
  const S = () => A.GAME.S, en = () => A.lang() === 'en', active = () => S().pol === S().day;
  function init() { P9 = A.places(); last = -1; }
  // 1초마다: 나비 수(가까이 = 많이 · 꽃가루받이가 잘 된 날·봄 = 가득 · 밤·비·겨울 = 0)
  function sec() { const me = A.map.player.pos(), sea = A.sea(); let n;
    if (A.night() >= 1 || A.wx() !== 'clear' || sea === 'winter') n = 0; else { const nb = P9.some(([x, z, r]) => Math.hypot(x - me.x, z - me.z) < r + 60); n = nb ? (active() || sea === 'spring' ? 10 : 7) : 4; }
    if (n !== last) { last = n; A.nfx(n); } }
  // 꿀 뜨기가 끝날 때(땄으면 · 하루 판 수 셈) → 넉넉히 돌본 그 판에 한 줄
  function bee(ok) { if (!(ok > 0)) return; const d = S().day, B = S().bee && S().bee.d === d ? S().bee : (S().bee = { d, n: 0 }); B.n++; A.GAME.mark(); if (B.n === BEE_N && A.fruit()) setTimeout(() => A.map.hud.toast(POL_T.bee[en() ? 1 : 0], 4), 2800); }
  // 배·딸기 거들기가 끝날 때: 꽃가루받이가 잘 된 날이면 하나 더
  const bonus = (k, ok) => (ok > 0 && (k === 'pear' || k === 'strawberry') && active() ? 1 : 0);
  // 새 날(잠들 때): 어제 넉넉히 돌봤으면 오늘 = 꽃가루받이 날 → 아침 한 줄(배·딸기 일꾼이 있는 마을만)
  function day() { const s = S(); if (s.bee && s.bee.d === s.day - 1 && s.bee.n >= BEE_N && A.fruit()) { s.pol = s.day; A.GAME.mark(); last = -1; return POL_T.morning[en() ? 1 : 0]; } return null; }
  return { init, sec, bee, bonus, day, plus: () => POL_T.plus[en() ? 1 : 0], get active() { return active(); }, get n() { return last; }, get places() { return P9.length; } };
}
