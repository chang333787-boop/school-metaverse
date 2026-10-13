// 🧪 매트 판 이음매 바둑판 시험(zz — 메뉴에 없음 · ?town=zz_grid) — 판 250×140(마루 위 검은 테두리) · 칸 1~10 × 가~마(25×25cm = 실제 125×125m · 맨 아래 '마' 줄 40cm)
//   엔진 시험만: 판 크기·칸 주소(선 자리)·큰길 테이프(이음매 50·100·150·200 · 가로 75)·작은길(판 가운데 25·75·125·175·225 · 가로 25·50·100)·학교 = 가5 — 아이들 마을이 아님
export const TOWN = {
  id: 'zz_grid', title: '바둑판 시험', en: 'Grid Test', scale: 500,
  mat: { w: 250, h: 140 }, school: [100, 0, 125, 25],
  grid: { xs: [25, 50, 75, 100, 125, 150, 175, 200, 225], ys: [25, 50, 75, 100], cols: 'num', rows: 'hangul', order: 'rowcol' },
  base: 'now',
  layers: {
    now: {
      name: '시험', en: 'Test',
      roads: [
        ...[50, 100, 150, 200].map((x, i) => ({ id: 'B' + i, pts: [[x, 0], [x, 140]], w: 4.8 })), { id: 'BH', pts: [[0, 75], [250, 75]], w: 4.8 },
        ...[25, 75, 125, 175, 225].map((x, i) => ({ id: 'v' + i, pts: [[x, 0], [x, 140]], w: 2.4 })),
        ...[25, 50, 100].map((y, i) => ({ id: 'h' + i, pts: [[0, y], [250, y]], w: 2.4 })),
      ],
    },
    rules: {   // 채우기 규칙 시험(교사 10-13) — 아이들 마을이 아님
      name: '규칙 시험', en: 'Rule Test', from: 'now',
      blocks: [
        ...[0, 1, 2].flatMap(i => [0, 1].map(j => ({ id: 'a' + i + j, x: 82 + i * 7, y: 34 + j * 14, w: 3, d: 1, h: 6, c: 'red' }))),   // 나4 아파트 6동(판을 끝으로 세움)
        { id: 'm1', x: 37, y: 70, w: 4, d: 4, h: 4, c: 'yellow' },   // 다2 랜드마크(4cm)
        { id: 'v1', x: 187, y: 98, w: 3, d: 3, h: 3, c: 'red' },     // 라8 빌라(3cm)
        { id: 'l1', x: 87, y: 126, w: 6, d: 3, h: 1, c: 'red' },     // 마4 눕힌 판(넓은 연립)
        { id: 's1', x: 112, y: 126, w: 6, d: 1, h: 3, c: 'red' },    // 마5 옆으로 세운 판(길쭉한 5층)
        { id: 'w1', x: 137, y: 98, w: 6, d: 3, h: 1, c: 'yellow' },  // 라6 눕힌 노랑(마트)
      ],
      zones: [
        { id: 'p1', k: 'live', cell: '나4', note: '아파트' }, { id: 'p2', k: 'live', cell: '다6', dens: 'dense', type: 'apt', note: '빽빽하게 아파트' },
        { id: 'p3', k: 'work', cell: '나7', note: '가게' }, { id: 'p4', k: 'live', cell: '라3', part: 'left', dens: 'sparse', type: 'house', note: '듬성듬성 주택' }, { id: 'p5', k: 'work', cell: '라3', part: 'right', note: '가게' },
        { id: 'p6', k: 'green', cell: '마9', note: '공원' },
      ],
    },
  },
};
