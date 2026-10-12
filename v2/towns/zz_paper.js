// 🧪 종이 판 시험(zz — 메뉴에 없음 · ?town=zz_paper) — 종이 6장(가로 3 × 세로 2 · 90×60cm 가정 · 실측은 10-13 아침) · 30cm 칸 주소 가~라 × 1~9
//   엔진 시험만: 판 크기·칸 주소·이음매 큰길(테이프)·작은길(매직 선 = 폭 wm)·강(색연필 띠)·다리 — 아이들 마을이 아님
export const TOWN = {
  id: 'zz_paper', title: '종이 판 시험', en: 'Paper Board Test', scale: 500,
  mat: { w: 270, h: 120 }, school: [120, 0, 150, 30],
  grid: { cell: 30, cols: 'num', rows: 'hangul', order: 'rowcol' },
  base: 'now',
  layers: {
    now: {
      name: '시험', en: 'Test',
      nature: [{ id: 'w1', k: 'water', line: { pts: [[40, 120], [80, 104], [120, 98], [170, 84], [220, 70], [270, 58]], w: 5 }, name: '강', en: 'River' }],
      roads: [
        { id: 'R1', pts: [[90, 0], [90, 120]], w: 4.8 }, { id: 'R2', pts: [[180, 0], [180, 120]], w: 4.8 }, { id: 'R3', pts: [[0, 60], [270, 60]], w: 4.8 },
        { id: 'r1', pts: [[30, 0], [30, 120]], wm: 9 }, { id: 'r2', pts: [[240, 0], [240, 120]], wm: 9 }, { id: 'r3', pts: [[0, 30], [270, 30]], wm: 9 }, { id: 'r4', pts: [[0, 90], [270, 90]], wm: 9 },
      ],
      blocks: [{ id: 'b1', x: 105, y: 45, w: 4, d: 4, h: 3, c: 'red', name: '소방서' }],
      zones: [{ id: 'z1', k: 'live', rect: [184, 34, 236, 56], dens: 'normal', note: '시험' }],
    },
  },
};
