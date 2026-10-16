// 🌌 밤하늘 별자리(GAME-8 · 밤에 할 일 + 달력 계절): 놀이 코드와 떼어 둔 자료·틀(도감과 같은 결)
//   계절마다 저녁 하늘에 잘 보이는 별자리 둘(우리나라 기준 · 실제 천문 사실만 — 지어낸 이야기 X) · 그림 = 별 자리(0~1 어림 모양) + 이은 선
//   쓰는 법: SKY_OF(계절) → 그 계절 둘 · drawSky(canvas, 별자리, 씨앗) → 밤하늘 그림(창을 열 때 한 번 · 매 프레임 X)
export const SKY_V = 1;

// s = [x, y, 밝기(1~3), [이름, 영어 이름]?, 색?] · l = 이은 선 [별 번호, 별 번호]
export const STARS = [
  { id: 'dipper', sea: 'spring', icon: '🥄', t: ['북두칠성', 'Big Dipper'], line: ['국자 모양 일곱 별 — 국자 끝 두 별을 따라가면 북극성을 찾을 수 있어요', 'Seven stars in a ladle — follow the two end stars to find the North Star'],
    s: [[0.80, 0.28, 3, ['두베', 'Dubhe']], [0.82, 0.55, 2], [0.62, 0.62, 2], [0.57, 0.40, 1], [0.41, 0.36, 2], [0.26, 0.30, 2], [0.10, 0.42, 2]], l: [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6]] },
  { id: 'leo', sea: 'spring', icon: '🦁', t: ['사자자리', 'Leo'], line: ['거꾸로 된 물음표 모양이 사자의 머리예요 — 가장 밝은 별은 레굴루스', 'A backwards question mark is the lion’s head — its brightest star is Regulus'],
    s: [[0.30, 0.78, 3, ['레굴루스', 'Regulus']], [0.32, 0.58, 1], [0.37, 0.40, 2], [0.31, 0.26, 1], [0.21, 0.20, 1], [0.14, 0.31, 1], [0.68, 0.44, 2], [0.88, 0.56, 2, ['데네볼라', 'Denebola']], [0.66, 0.66, 1]], l: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [2, 6], [6, 7], [7, 8], [8, 0], [6, 8]] },
  { id: 'summer3', sea: 'summer', icon: '🔺', t: ['여름철 대삼각형', 'Summer Triangle'], line: ['직녀성·견우성·데네브를 이은 큰 세모 — 견우와 직녀 이야기의 별이에요', 'Vega, Altair and Deneb make a big triangle — the stars of the Gyeonu and Jiknyeo tale'],
    s: [[0.24, 0.20, 3, ['직녀성', 'Vega']], [0.76, 0.26, 3, ['데네브', 'Deneb']], [0.46, 0.84, 3, ['견우성', 'Altair']]], l: [[0, 1], [1, 2], [2, 0]] },
  { id: 'scorpius', sea: 'summer', icon: '🦂', t: ['전갈자리', 'Scorpius'], line: ['붉은 별 안타레스가 전갈의 심장이에요 — 꼬리가 S자로 휘어요', 'Red Antares is the scorpion’s heart — its tail curls like an S'],
    s: [[0.14, 0.14, 1], [0.18, 0.25, 2], [0.23, 0.36, 1], [0.36, 0.42, 3, ['안타레스', 'Antares'], '#ff7a5a'], [0.43, 0.52, 1], [0.50, 0.63, 1], [0.55, 0.75, 1], [0.63, 0.86, 2], [0.76, 0.89, 1], [0.86, 0.81, 2], [0.88, 0.70, 2]], l: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10]] },
  { id: 'pegasus', sea: 'autumn', icon: '🐴', t: ['페가수스 사각형', 'Great Square of Pegasus'], line: ['가을 하늘의 큰 네모 — 날개 달린 말 페가수스의 몸통이에요', 'The big square of the autumn sky — the body of Pegasus, the winged horse'],
    s: [[0.28, 0.72, 2], [0.30, 0.28, 2], [0.72, 0.26, 3], [0.70, 0.74, 2]], l: [[0, 1], [1, 2], [2, 3], [3, 0]] },
  { id: 'cassio', sea: 'autumn', icon: '👑', t: ['카시오페이아자리', 'Cassiopeia'], line: ['W자 모양 다섯 별 — 북두칠성 반대쪽에서 북극성을 찾을 때 써요', 'Five stars in a W — used to find the North Star from the other side of the Big Dipper'],
    s: [[0.10, 0.38, 2], [0.30, 0.66, 2], [0.50, 0.44, 3], [0.70, 0.64, 2], [0.90, 0.34, 2]], l: [[0, 1], [1, 2], [2, 3], [3, 4]] },
  { id: 'orion', sea: 'winter', icon: '🏹', t: ['오리온자리', 'Orion'], line: ['허리띠 세 별이 나란히 — 붉은 베텔게우스와 푸른 리겔', 'Three belt stars in a row — red Betelgeuse and blue Rigel'],
    s: [[0.28, 0.18, 3, ['베텔게우스', 'Betelgeuse'], '#ff8a5c'], [0.70, 0.24, 2], [0.42, 0.52, 2], [0.50, 0.49, 2], [0.58, 0.46, 2], [0.32, 0.84, 2], [0.70, 0.86, 3, ['리겔', 'Rigel'], '#a8c8ff']], l: [[0, 2], [1, 4], [2, 3], [3, 4], [2, 5], [4, 6], [0, 1]] },
  { id: 'winter3', sea: 'winter', icon: '🔻', t: ['겨울철 대삼각형', 'Winter Triangle'], line: ['베텔게우스·시리우스·프로키온을 이은 세모 — 시리우스는 밤하늘에서 가장 밝은 별이에요', 'Betelgeuse, Sirius and Procyon make a triangle — Sirius is the brightest star in the night sky'],
    s: [[0.30, 0.18, 3, ['베텔게우스', 'Betelgeuse'], '#ff8a5c'], [0.80, 0.44, 3, ['프로키온', 'Procyon']], [0.40, 0.86, 3, ['시리우스', 'Sirius'], '#cfe2ff']], l: [[0, 1], [1, 2], [2, 0]] },
];
const SEA_HINT = { spring: ['🌸 봄 밤 산꼭대기에서', 'Spring night, on the summit'], summer: ['☀️ 여름 밤 산꼭대기에서', 'Summer night, on the summit'], autumn: ['🍁 가을 밤 산꼭대기에서', 'Autumn night, on the summit'], winter: ['❄️ 겨울 밤 산꼭대기에서', 'Winter night, on the summit'] };
for (const st of STARS) st.hint = SEA_HINT[st.sea];   // 도감 빈 칸 귀띔
export const SKY_OF = s => STARS.filter(st => st.sea === (s === 'now' || !SEA_HINT[s] ? 'summer' : s));

// 밤하늘 한 장(어두운 하늘 + 흐린 별 + 별자리 선·별·이름)
export function drawSky(cv, st, seed, font, en) { const g = cv.getContext('2d'), W = cv.width, H = cv.height, k = W / 300;
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#0b1636'); gr.addColorStop(1, '#22305a'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  let a = seed >>> 0; const rnd = () => { a = (a * 1103515245 + 12345) >>> 0; return a / 4294967296; };
  for (let i = 0; i < 70; i++) { g.fillStyle = 'rgba(255,255,255,' + (0.25 + rnd() * 0.45).toFixed(2) + ')'; g.fillRect(rnd() * W, rnd() * H, 1.2 * k, 1.2 * k); }
  const P = q => [W * 0.08 + q[0] * W * 0.84, H * 0.08 + q[1] * H * 0.84];
  g.strokeStyle = 'rgba(150,190,255,.75)'; g.lineWidth = 1.6 * k; g.beginPath(); for (const [i, j] of st.l) { const [x0, y0] = P(st.s[i]), [x1, y1] = P(st.s[j]); g.moveTo(x0, y0); g.lineTo(x1, y1); } g.stroke();
  g.font = '700 ' + (11 * k) + 'px ' + font; g.textAlign = 'left'; g.textBaseline = 'middle';
  for (const q of st.s) { const [x, y] = P(q), r = (1.4 + q[2] * 1.1) * k; g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.arc(x, y, r * 2.4, 0, 7); g.fill(); g.fillStyle = q[4] || '#fffbe8'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); if (q[3]) { g.fillStyle = '#dfe8ff'; g.fillText(q[3][en ? 1 : 0], x + r + 4 * k, y); } } }
