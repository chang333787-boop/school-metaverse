// 🧪 매트 판 이음매 바둑판 시험(zz — 메뉴에 없음 · ?town=zz_grid) — 판 250×150(마루 위 검은 테두리 · 교사 10-13 확정) · 칸 1~10 × 가~바(25×25cm = 실제 125×125m)
//   엔진 시험만: 판 크기·칸 주소(선 자리)·큰길(이음매 50·100·150·200 · 가로 75 — 넓게 · 인도·가로수)·작은길(나머지 칸 선)·학교 = 가5 — 아이들 마을이 아님
//   실제 판의 검은 테이프는 모두 같은 굵기 → 테이프 폭은 쓰지 않고 큰길·작은길은 계획대로 + ✨ 어림 기록(아이들이 "큰길은 여기"로 바꿀 수 있게)
const BIG = '판 이음매 자리라서 큰길(넓게 · 인도·가로수)로 어림했어요 — 테이프는 다 같은 굵기예요. "큰길은 여기"라고 바꿀 수 있어요';
const SMALL = '좁은 동네 길로 어림했어요 — 테이프는 다 같은 굵기예요';
export const TOWN = {
  id: 'zz_grid', title: '바둑판 시험', en: 'Grid Test', scale: 500,
  mat: { w: 250, h: 150 }, school: [100, 0, 125, 25],
  grid: { xs: [25, 50, 75, 100, 125, 150, 175, 200, 225], ys: [25, 50, 75, 100, 125], cols: 'num', rows: 'hangul', order: 'rowcol' },
  base: 'now',
  layers: {
    now: {
      name: '시험', en: 'Test',
      roads: [
        ...[50, 100, 150, 200].map((x, i) => ({ id: 'B' + i, pts: [[x, 0], [x, 150]], w: 4.8, trees: true, ai: BIG })), { id: 'BH', pts: [[0, 75], [250, 75]], w: 4.8, trees: true, ai: BIG },
        ...[25, 75, 125, 175, 225].map((x, i) => ({ id: 'v' + i, pts: [[x, 0], [x, 150]], w: 2.4, ai: SMALL })),
        ...[25, 50, 100, 125].map((y, i) => ({ id: 'h' + i, pts: [[0, y], [250, y]], w: 2.4, ai: SMALL })),
      ],
    },
    rules: {   // 채우기 규칙 시험(교사 10-13) — 아이들 마을이 아님
      name: '규칙 시험', en: 'Rule Test', from: 'now',
      blocks: [
        ...[0, 1, 2].flatMap(i => [0, 1].map(j => ({ id: 'a' + i + j, x: 82 + i * 7, y: 34 + j * 14, w: 3, d: 1, h: 6, c: 'red' }))),   // 나4 아파트 6동(판을 끝으로 세움)
        { id: 'm1', x: 37, y: 70, w: 4, d: 4, h: 4, c: 'yellow' },   // 다2 랜드마크(4cm)
        { id: 'v1', x: 187, y: 98, w: 3, d: 3, h: 3, c: 'red' },     // 라8 빌라(3cm)
        { id: 'l1', x: 87, y: 112, w: 6, d: 3, h: 1, c: 'red' },     // 마4 눕힌 판(넓은 연립)
        { id: 's1', x: 112, y: 112, w: 6, d: 1, h: 3, c: 'red' },    // 마5 옆으로 세운 판(길쭉한 5층)
        { id: 'w1', x: 137, y: 98, w: 6, d: 3, h: 1, c: 'yellow' },  // 라6 눕힌 노랑(마트)
      ],
      zones: [
        { id: 'p1', k: 'live', cell: '나4', note: '아파트' }, { id: 'p2', k: 'live', cell: '다6', dens: 'dense', type: 'apt', note: '빽빽하게 아파트' },
        { id: 'p3', k: 'work', cell: '나7', note: '가게' }, { id: 'p4', k: 'live', cell: '라3', part: 'left', dens: 'sparse', type: 'house', note: '듬성듬성 주택' }, { id: 'p5', k: 'work', cell: '라3', part: 'right', note: '가게' },
        { id: 'p6', k: 'green', cell: '마9', note: '공원' }, { id: 'p7', k: 'green', type: 'fields', cell: '바1', c: 'yellow', note: '논밭' }, { id: 'p8', k: 'green', type: 'forest', cell: '가1', note: '숲' },
      ],
      nature: [{ id: 'rv', k: 'water', cells: ['바6', '마6', '라7', '다8', '나9', '나10'], name: '강', en: 'River' }],   // 강 = 칸 주소 차례(시험)
    },
    kids: {   // 종이 소품·칸 이름표 시험(교사 10-13 인쇄지·아이 손글씨 이름표) — 아이들 마을이 아님 · 종류마다 하나씩
      name: '소품·이름표 시험', en: 'Props & Labels Test', from: 'rules',
      blocks: [
        ...[[30, 32], [38, 32], [30, 42]].map(([x, y], i) => ({ id: 'ea' + i, x, y, w: 3, d: 1, h: 6, c: i % 2 ? 'orange' : 'red' })), { id: 'eg0', x: 44, y: 36, w: 3, d: 1, h: 6, c: 'green' }, { id: 'eg1', x: 37, y: 45, w: 1, d: 3, h: 6, c: 'green' },   // 나2 '자연친화 도시'(세운 아파트 사이 세운 초록 판)
        ...[[6, 56], [18, 58], [8, 68]].map(([x, y], i) => ({ id: 'nh' + i, x, y, w: 3, d: 3, h: 3, c: 'red' })), { id: 'ng0', x: 15, y: 66, w: 3, d: 1, h: 6, c: 'green' },   // 다1 '자연 도시'(3cm 집 사이 세운 초록 판)
        { id: 'un', x: 237, y: 62, w: 2, d: 2, h: 2, c: 'navy', name: '로봇 연구소' },   // 도감에 없는 이름(✨)
      ],
      props: [
        { k: 'bridge', x: 137, y: 124 }, { k: 'bridge', x: 163, y: 101 }, { k: 'bridge', x: 188, y: 64 },   // 작은길 위 다리 둘(🧱) · 길 없는 곳 걷는 다리 하나
        { k: 'streetlight', x: 53, y: 30 }, { k: 'signal', x: 53, y: 72 }, { k: 'busstop', x: 104, y: 40 }, { k: 'schoolzone', x: 127, y: 28 },
        { k: 'pavilion', x: 60, y: 110 }, { k: 'bench', x: 66, y: 116 }, { k: 'scarecrow', x: 12, y: 135 }, { k: 'greenhouse', x: 37, y: 137, along: 'ew' }, { k: 'tiller', x: 20, y: 118 }, { k: 'drone', x: 26, y: 126 },
        { k: 'trailhead', x: 15, y: 20 }, { k: 'spring', x: 6, y: 8 }, { k: 'firesign', x: 20, y: 8 }, { k: 'fishing', x: 190, y: 70 },
        { k: 'signpost', x: 70, y: 54, to: ['강', '정자', '하늘 정원'] },
        { k: 'card', name: '분수', x: 80, y: 104 }, { k: 'card', name: '동상', x: 62, y: 88 }, { k: 'card', name: '화장실', x: 70, y: 132 }, { k: 'card', name: '우주 정거장', x: 230, y: 132 }, { k: 'card', name: '카페', x: 232, y: 112 },
        { k: 'crosswalk', x: 100, y: 60 }, { k: 'trail', pts: [[30, 80], [45, 85], [40, 97]] }, { k: 'parking', x: 112, y: 88, w: 5, d: 3 },
      ],
      areas: [
        { id: 'ar1', cell: '나2', t: '자연친화 도시', style: ['rooftop', 'vines', 'woods', 'trail', 'flowers', 'bigtree'], ai: '아파트 3동 + 옥상 정원 + 덩굴 벽 + 단지 안 숲길·꽃길 + 초록 판 = 큰 나무' },
        { id: 'ar2', cell: '다1', t: '자연 도시', style: ['woods', 'flowers', 'bigtree'] },
        { id: 'ar3', cell: '라9', t: '시장 골목', style: ['flowers', 'solar'], fill: { k: 'work', type: 'shop', dens: 'dense' }, ai: '블록이 없는 칸이라 가게를 빽빽하게 + 지붕 태양광 + 꽃' },
        { id: 'ar4', cell: '마10', t: '도토리 숲', style: ['woods', 'trail'] },
      ],
    },
  },
};
