// 🌱 우리 반 텃밭(GAME-10 · 스타듀 '심고 → 물 주고 → 거두기' 결): 놀이 코드와 떼어 둔 자료·틀
//   자리 = 학교 동쪽 넓힌 텃밭의 '아직 안 심은 검은 비닐 두둑'(world.js GARDEN-2 bare — 실제 학교 텃밭 · 새 땅 X)
//   씨앗 = 그 계절 둘(학교에서 나눠 줌 · 공짜) · 날마다 물을 주면 하루 자람(비 오는 날 = 저절로) · 물을 못 줘도 시들지 않음(그날만 안 자람 · 벌 X) · 겨울엔 텃밭도 쉼(새로 심기 X — 심어 둔 것은 그대로 자람)
//   상태 = 놀이 상태 S.farm[칸] = { c: 작물, d: 심은 날, g: 자란 날, w: 마지막 물 준 날 } · 그림은 바뀔 때만(매 프레임 X)
export const FARM_V = 1;
export const FARM_MAX = 6;   // 칸 수 상한(한 화면 삼각형 예산 — 작물 그림 = 인스턴스 둘)

// 작물: [이름, 영어, 자라는 날, 거두는 수, 잎 색, 열매 색, 키(m), 꼴] · 꼴 = leafy(잎채소 — 겹잎 덩이) · root(뿌리 — 낮은 잎 + 흙 위 열매) · tall(키 큰 — 두 층 잎 + 달린 열매)
export const CROPS = {
  '🥔': ['감자', 'Potato', 3, 4, 0x5c9a48, 0xc9a26a, 0.32, 'root'],
  '🥕': ['당근', 'Carrot', 3, 4, 0x6fb84e, 0xee7a2a, 0.30, 'root'],
  '🍅': ['방울토마토', 'Cherry tomato', 3, 5, 0x4f8f3e, 0xe2412f, 0.62, 'tall'],
  '🥒': ['오이', 'Cucumber', 3, 4, 0x5aa043, 0x3c7a2a, 0.58, 'tall'],
  '🌽': ['옥수수', 'Corn', 3, 3, 0x6aa84f, 0xf2c531, 0.85, 'tall'],
  '🥬': ['배추', 'Cabbage', 3, 3, 0x6fb34f, 0xc8e69a, 0.36, 'leafy'],
  '🍠': ['고구마', 'Sweet potato', 3, 4, 0x4f8a3e, 0xa8456a, 0.26, 'root'],
  '🍓': ['딸기', 'Strawberry', 3, 4, 0x4f9a40, 0xe0304a, 0.2, 'root'],   /* REWARD-1 딸기 모종(농사 5레벨 보상 · 계절 씨앗 표 SEEDS엔 없음 — 받은 아이만 고르기 칸에) */
};
// 계절마다 심는 씨앗(우리나라 학교 텃밭 어림 · ✨ 놀이용) · '지금' = 여름(놀이 계절 seaPlay — 부르는 쪽이 넘김)
export const SEEDS = { spring: ['🥔', '🥕'], summer: ['🍅', '🥒', '🌽'], autumn: ['🥬', '🍠'], winter: [] };
export const seedsOf = s => SEEDS[s] || SEEDS.autumn;

// 칸 하나의 지금 모습: 'empty' | 'water'(오늘 물 아직) | 'grow'(오늘 물 줌 · 자라는 중) | 'ripe'
export function plotState(P, day) { if (!P || !P.c) return 'empty'; const C = CROPS[P.c]; if (!C) return 'empty'; if (P.g >= C[2]) return 'ripe'; return P.w === day ? 'grow' : 'water'; }
// 잠들 때(새 날 = day): 어제 물 줬거나 비가 왔으면 하루 자람 → 자란 칸 수
export function farmGrow(S, day, rain) { let n = 0; for (const P of S.farm || []) { if (!P || !P.c || !CROPS[P.c]) continue; if (P.g >= CROPS[P.c][2]) continue; if (rain || P.w === day - 1) { P.g++; n++; } } return n; }
// 작물 그림 자리(두둑 a~b · rz · 윗면 y): 포기마다 [x, z, 잎 크기, 열매 수] — 자란 날에 따라 커짐
export function plantSpots(bed, P, day) { const st = plotState(P, day); if (st === 'empty') return []; const C = CROPS[P.c], k = Math.min(1, (P.g + (st === 'ripe' ? 1 : 0.35)) / (C[2] + 1)), out = [];
  const [a, b, rz] = bed, n = Math.max(3, Math.min(8, Math.floor((b - a - 0.4) / 0.8)));
  for (let i = 0; i < n; i++) { const x = a + 0.4 + (b - a - 0.8) * (n === 1 ? 0.5 : i / (n - 1)), z = rz + (i % 2 ? 0.22 : -0.22); out.push([x, z, k, st === 'ripe' ? 1 : 0]); }
  return out; }
