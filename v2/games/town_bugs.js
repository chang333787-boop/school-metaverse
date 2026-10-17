// 🔍 곤충 관찰(GAME-19 · 잡지 않고 돋보기로 보기만 — 생명 존중): 놀이 코드와 떼어 둔 자료·그림(물고기·별자리 도감과 같은 결)
//   우리나라에서 흔히 보는 곤충 — 실제 사실만(지어낸 이야기 X) · 사는 곳(hab) = 마을에 이미 있는 꽃·큰 나무·들판·물가 · 계절(sea)·때(time: day·night·any)가 맞을 때만 나와요
//   그림 = 캔버스에 한 번 그림(작은 그림 = 마을에 떠 있는 모습 · 큰 그림 = 돋보기 창) — 매 프레임 X
export const BUGS_V = 1;
export const BUGS = [
  { id: 'cabbagewhite', hab: 'flower', sea: 'spring', time: 'day', draw: 'butterfly', c: ['#f6f4ea', '#3a3a3a'], t: ['배추흰나비', 'Cabbage white'], line: ['하얀 날개에 검은 점 — 배추·무 잎에 알을 낳아요', 'White wings with black spots — lays eggs on cabbage and radish leaves'] },
  { id: 'ladybird', hab: 'flower', sea: 'spring', time: 'day', draw: 'ladybird', c: ['#e2382b', '#1d1d1d'], t: ['칠성무당벌레', 'Seven-spot ladybird'], line: ['빨간 등에 검은 점이 일곱 개 — 진딧물을 잡아먹어요', 'Seven black spots on a red back — it eats aphids'] },
  { id: 'honeybee', hab: 'flower', sea: 'spring', time: 'day', draw: 'bee', c: ['#e9b23a', '#3a2a1a'], t: ['꿀벌', 'Honeybee'], line: ['꽃에서 꿀과 꽃가루를 모아요 — 쏘일 수 있으니 가만히 보기만 해요', 'Gathers nectar and pollen — it can sting, so just watch quietly'] },
  { id: 'swallowtail', hab: 'flower', sea: 'summer', time: 'day', draw: 'butterfly', c: ['#f2d24a', '#1d1d1d'], t: ['호랑나비', 'Asian swallowtail'], line: ['노란 날개에 검은 줄무늬 — 귤나무·산초나무에 알을 낳아요', 'Yellow wings with black stripes — lays eggs on citrus and prickly-ash trees'] },
  { id: 'cicada', hab: 'tree', sea: 'summer', time: 'day', draw: 'cicada', c: ['#4b5a3a', '#cfe3e8'], t: ['참매미', 'Robust cicada'], line: ['나무에서 "맴맴" — 우는 것은 수컷이에요', '"Maem-maem" from the trees — only the males sing'] },
  { id: 'rhino', hab: 'tree', sea: 'summer', time: 'night', draw: 'beetle', c: ['#5a3420', '#2a160c'], t: ['장수풍뎅이', 'Rhinoceros beetle'], line: ['수컷 머리에 긴 뿔 — 밤에 참나무 진을 먹으러 와요', 'The male has a long horn — comes at night to drink oak sap'] },
  { id: 'strider', hab: 'water', sea: 'summer', time: 'day', draw: 'strider', c: ['#5a4a3a', '#2a2018'], t: ['소금쟁이', 'Water strider'], line: ['긴 다리로 물 위를 미끄러지듯 걸어요', 'Glides across the water on long legs'] },
  { id: 'scarlet', hab: 'water', sea: 'autumn', time: 'day', draw: 'dragonfly', c: ['#e0402e', '#cfe6f0'], t: ['고추잠자리', 'Scarlet skimmer'], line: ['수컷은 몸이 고추처럼 빨개요 — 물가에서 작은 벌레를 잡아먹어요', 'Males are red like chili peppers — they catch small insects by the water'] },
  { id: 'grasshopper', hab: 'field', sea: 'autumn', time: 'day', draw: 'hopper', c: ['#7fae3a', '#4d7a22'], t: ['벼메뚜기', 'Rice grasshopper'], line: ['논·풀밭에 살아요 — 긴 뒷다리로 폴짝 뛰어요', 'Lives in rice fields and grass — jumps with long back legs'] },
  { id: 'cricket', hab: 'field', sea: 'autumn', time: 'night', draw: 'cricket', c: ['#3a2a1e', '#1e140c'], t: ['왕귀뚜라미', 'Field cricket'], line: ['가을밤 "귀뚤귀뚤" — 수컷이 날개를 비벼 소리를 내요', '"Chirp chirp" on autumn nights — males rub their wings to sing'] },
  { id: 'mantisegg', hab: 'tree', sea: 'winter', time: 'any', draw: 'ootheca', c: ['#d8c49a', '#8a6a40'], t: ['사마귀 알집', 'Mantis egg case'], line: ['나뭇가지에 붙은 거품 같은 집 — 봄이 되면 새끼 사마귀가 나와요', 'A foamy case on a twig — baby mantises come out in spring'] },
  { id: 'ladywinter', hab: 'flower', sea: 'winter', time: 'any', draw: 'cluster', c: ['#e2382b', '#1d1d1d'], t: ['겨울나는 무당벌레', 'Ladybirds in winter'], line: ['여럿이 모여 돌 틈·나무껍질 밑에서 겨울을 나요', 'They huddle together under bark or between stones for the winter'] },
];
const HAB = { flower: ['꽃밭', 'flowers'], tree: ['큰 나무', 'big trees'], water: ['개울·연못가', 'streams and ponds'], field: ['논·풀밭', 'rice fields and grass'] };
const SEAK = { spring: ['🌸 봄', '🌸 Spring'], summer: ['☀️ 여름', '☀️ Summer'], autumn: ['🍁 가을', '🍁 Autumn'], winter: ['❄️ 겨울', '❄️ Winter'] };
const TIMEK = { day: [' 낮', ' day'], night: [' 밤', ' night'], any: ['', ''] };
for (const b of BUGS) { b.icon = '🔍'; b.hint = [SEAK[b.sea][0] + TIMEK[b.time][0] + ' ' + HAB[b.hab][0], SEAK[b.sea][1] + TIMEK[b.time][1] + ', ' + HAB[b.hab][1]]; }   // 도감 빈 칸 귀띔
export const HABITATS = Object.keys(HAB);
export const habName = (h, en) => HAB[h] ? HAB[h][en ? 1 : 0] : h;
// 지금(계절·때) 이 사는 곳에 나오는 곤충 — 여럿이면 자리 번호로 고름(자리마다 다른 친구)
export function bugAt(hab, sea, night, k) { const L = BUGS.filter(b => b.hab === hab && b.sea === sea && (b.time === 'any' || (b.time === 'night') === !!night)); return L.length ? L[(k >>> 0) % L.length] : null; }

// 그림: 128×128 캔버스(가운데 = 몸) · 위에서 본 모습(나비·잠자리 날개 펼침) — 단순한 낮은 다각형 느낌(실사 X)
export function drawBug(cv, b) { const g = cv.getContext('2d'), W = cv.width, k = W / 128; g.clearRect(0, 0, W, W); g.save(); g.scale(k, k); g.translate(64, 64); g.lineJoin = 'round'; g.lineCap = 'round';
  const [c0, c1] = b.c, ell = (x, y, rx, ry, r, f, s) => { g.beginPath(); g.ellipse(x, y, rx, ry, r || 0, 0, 7); if (f) { g.fillStyle = f; g.fill(); } if (s) { g.strokeStyle = s; g.lineWidth = 2.5; g.stroke(); } };
  const legs = (n, len, col, y0 = -6, dy = 8) => { g.strokeStyle = col; g.lineWidth = 2.6; for (let i = 0; i < n; i++) for (const sx of [-1, 1]) { const y = y0 + i * dy; g.beginPath(); g.moveTo(sx * 6, y); g.lineTo(sx * (6 + len * 0.6), y - 4 + i * 3); g.lineTo(sx * (6 + len), y + 2 + i * 5); g.stroke(); } };
  const ant = (len, col) => { g.strokeStyle = col; g.lineWidth = 2; for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * 2, -22); g.quadraticCurveTo(sx * 8, -22 - len * 0.6, sx * 12, -22 - len); g.stroke(); } };
  switch (b.draw) {
    case 'butterfly': { ant(18, c1); for (const sx of [-1, 1]) { ell(sx * 22, -10, 22, 17, sx * -0.35, c0, c1); ell(sx * 17, 15, 14, 12, sx * 0.4, c0, c1); }
      if (b.id === 'swallowtail') { g.strokeStyle = c1; g.lineWidth = 4; for (const sx of [-1, 1]) for (const t of [0.3, 0.6, 0.85]) { g.beginPath(); g.moveTo(sx * 8, -18 + t * 10); g.lineTo(sx * (10 + t * 30), -26 + t * 12); g.stroke(); } for (const sx of [-1, 1]) ell(sx * 22, 24, 3, 3, 0, '#3a6ad8'); }
      else for (const sx of [-1, 1]) { ell(sx * 26, -12, 4.5, 4.5, 0, c1); ell(sx * 38, -20, 5, 4, 0, c1); }
      ell(0, 0, 4.5, 22, 0, '#2a2a2a'); break; }
    case 'ladybird': { legs(3, 12, '#1d1d1d'); ell(0, -20, 9, 7, 0, '#1d1d1d'); ell(0, 2, 22, 24, 0, c0, '#1d1d1d'); g.strokeStyle = '#1d1d1d'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(0, -20); g.lineTo(0, 25); g.stroke();
      for (const [x, y, r] of [[0, -14, 5], [-11, -6, 5], [11, -6, 5], [-12, 10, 5.5], [12, 10, 5.5], [-6, 19, 4], [6, 19, 4]]) ell(x, y, r, r, 0, c1); ell(-6, -22, 2.5, 2, 0, '#fff'); ell(6, -22, 2.5, 2, 0, '#fff'); break; }
    case 'cluster': { for (const [x, y, s] of [[-18, -12, 0.55], [14, -16, 0.5], [-4, 6, 0.6], [20, 12, 0.5], [-22, 18, 0.48]]) { g.save(); g.translate(x, y); g.scale(s, s); ell(0, -18, 9, 7, 0, '#1d1d1d'); ell(0, 2, 20, 22, 0, c0, '#1d1d1d'); for (const [a, c] of [[-9, -4], [9, -4], [-9, 10], [9, 10], [0, -10]]) ell(a, c, 4.5, 4.5, 0, c1); g.restore(); } break; }
    case 'bee': { ant(12, '#2a1a0a'); for (const sx of [-1, 1]) { ell(sx * 16, -8, 16, 9, sx * -0.5, 'rgba(230,245,255,.85)', '#8aa'); ell(sx * 12, 4, 10, 6, sx * -0.2, 'rgba(230,245,255,.8)', '#8aa'); } legs(3, 10, '#2a1a0a');
      ell(0, -18, 8, 7, 0, '#2a1a0a'); ell(0, 8, 13, 20, 0, c0, '#2a1a0a'); g.fillStyle = c1; for (const y of [2, 12, 22]) { g.fillRect(-12, y - 2.5, 24, 5); } break; }
    case 'cicada': { legs(3, 10, '#2a2a1a'); for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * 6, -8); g.quadraticCurveTo(sx * 30, 4, sx * 14, 40); g.quadraticCurveTo(sx * 6, 20, sx * 4, -8); g.fillStyle = 'rgba(214,234,240,.75)'; g.fill(); g.strokeStyle = '#6a7a6a'; g.lineWidth = 2; g.stroke(); }
      ell(0, -2, 12, 20, 0, c0, '#2a2a1a'); ell(0, -22, 14, 7, 0, c0, '#2a2a1a'); ell(-12, -22, 4, 4, 0, '#8a3a2a'); ell(12, -22, 4, 4, 0, '#8a3a2a'); g.strokeStyle = '#2a2a1a'; g.lineWidth = 1.5; for (const y of [-6, 2, 10]) { g.beginPath(); g.moveTo(-8, y); g.lineTo(8, y); g.stroke(); } break; }
    case 'beetle': { legs(3, 18, c1, -4, 10); ell(0, -22, 10, 8, 0, c1); g.fillStyle = c1; g.beginPath(); g.moveTo(-4, -26); g.quadraticCurveTo(0, -56, 6, -46); g.quadraticCurveTo(10, -42, 4, -26); g.fill(); g.beginPath(); g.moveTo(-6, -46); g.lineTo(0, -52); g.lineTo(-2, -44); g.fill();
      ell(0, -10, 16, 10, 0, c0, c1); ell(0, 14, 20, 24, 0, c0, c1); g.strokeStyle = c1; g.lineWidth = 2.5; g.beginPath(); g.moveTo(0, -10); g.lineTo(0, 37); g.stroke(); ell(-7, 6, 4, 9, 0.3, 'rgba(255,255,255,.18)'); break; }
    case 'strider': { g.strokeStyle = c1; g.lineWidth = 2.4; for (const [sx, a, l] of [[-1, -0.9, 30], [1, -0.9, 30], [-1, 0.5, 52], [1, 0.5, 52], [-1, 1.0, 46], [1, 1.0, 46]]) { g.beginPath(); g.moveTo(sx * 3, 0); g.lineTo(sx * Math.cos(a) * l, Math.sin(a) * l * 0.9); g.stroke(); }
      g.strokeStyle = 'rgba(120,170,210,.6)'; g.lineWidth = 2; for (const [x, y] of [[-46, 24], [46, 24], [-40, 44], [40, 44], [-24, -26], [24, -26]]) { g.beginPath(); g.ellipse(x, y, 7, 3, 0, 0, 7); g.stroke(); } ell(0, 0, 4.5, 20, 0, c0, c1); ell(0, -20, 4, 5, 0, c1); break; }
    case 'dragonfly': { for (const sx of [-1, 1]) for (const y of [-12, 0]) ell(sx * 26, y, 25, 6.5, sx * (y ? 0.12 : -0.08), 'rgba(214,234,244,.75)', '#7a9aaa'); ell(0, -20, 8, 7, 0, c0); ell(-5, -22, 4, 4, 0, '#7a2a1a'); ell(5, -22, 4, 4, 0, '#7a2a1a');
      ell(0, -8, 5.5, 9, 0, c0); g.fillStyle = c0; g.beginPath(); g.moveTo(-3.5, 0); g.lineTo(3.5, 0); g.lineTo(2, 50); g.lineTo(-2, 50); g.closePath(); g.fill(); break; }
    case 'hopper': { g.save(); g.rotate(-0.15); ell(0, 0, 9, 30, 0, c0, c1); ell(0, -28, 8, 9, 0, c0, c1); ell(-5, -30, 2.5, 3, 0, '#2a2a1a'); ell(5, -30, 2.5, 3, 0, '#2a2a1a'); ant(14, c1); g.strokeStyle = c1; g.lineWidth = 3;
      for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * 6, 8); g.lineTo(sx * 18, -6); g.lineTo(sx * 14, 36); g.stroke(); g.lineWidth = 2.2; g.beginPath(); g.moveTo(sx * 6, -14); g.lineTo(sx * 14, -18); g.lineTo(sx * 16, -10); g.stroke(); g.lineWidth = 3; } g.restore(); break; }
    case 'cricket': { g.strokeStyle = c1; g.lineWidth = 1.6; for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * 3, -24); g.quadraticCurveTo(sx * 20, -50, sx * 36, -54); g.stroke(); } legs(2, 14, c1, -6, 10); g.lineWidth = 3.5; for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * 8, 10); g.lineTo(sx * 22, 0); g.lineTo(sx * 20, 34); g.stroke(); }
      ell(0, 6, 13, 24, 0, c0, c1); ell(0, -20, 11, 9, 0, c1); g.strokeStyle = '#5a4430'; g.lineWidth = 1.5; for (const y of [-2, 6, 14, 22]) { g.beginPath(); g.moveTo(-10, y); g.quadraticCurveTo(0, y + 4, 10, y); g.stroke(); } break; }
    case 'ootheca': { g.strokeStyle = '#6a4a2a'; g.lineWidth = 7; g.beginPath(); g.moveTo(-60, 30); g.quadraticCurveTo(0, 10, 60, -26); g.stroke(); ell(-2, 10, 22, 14, -0.45, c0, c1); g.strokeStyle = 'rgba(138,106,64,.7)'; g.lineWidth = 1.6; for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(-14 + i * 5, 20 - i * 2); g.lineTo(-4 + i * 5, -2 - i * 2); g.stroke(); } break; }
  }
  g.restore(); }
