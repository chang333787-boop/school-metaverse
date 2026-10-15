// 🧪 바다·산지·농촌 물길 부품 시험(zz — 메뉴에 없음 · ?town=zz_coast) — 확장판(14×10 · 350×250)을 흉내 낸 시험 판 · 아이들 마을이 아님
//   왼쪽 위 = 산지(뒷산 · 층층 땅 모양 = 계단식 밭) · 오른쪽 위 = 바다(해변·갯바위 + 아이가 놓을 때만 쓰는 소품 시험: 방파제·항구·등대·어촌) · 가운데 = 학교 다7 · 아래 = 논밭과 물길
//   부품 시험만 — 모양·자리는 Claude가 시험용으로 정함(✨ 아님 · 실제 수업 판 아님)
const BIG = '시험 판 큰길', SMALL = '시험 판 작은길';
export const TOWN = {
  id: 'zz_coast', title: '바다·산지 시험', en: 'Coast Test', scale: 500,
  mat: { w: 350, h: 250 }, school: [150, 50, 175, 75],
  grid: { xs: [25, 50, 75, 100, 125, 150, 175, 200, 225, 250, 275, 300, 325], ys: [25, 50, 75, 100, 125, 150, 175, 200, 225], cols: 'num', rows: 'hangul', order: 'rowcol' },
  base: 'now', fillAround: true, life: true, yards: 'rpg',   // 마당 시험 = RPG 시험 계정(이름 '시험')의 꾸미기
  range: { peaks: [[-35, -50, 66, 95], [-80, 30, 46, 50]], ridges: [{ pts: [[-35, -50, 62], [20, -82, 50], [80, -118, 46]], w: 55 }, { pts: [[-35, -50, 62], [-72, 8, 50], [-90, 70, 42]], w: 55 }] },
  layers: {
    now: {
      name: '시험', en: 'Test',
      roads: [
        { id: 'B0', pts: [[100, 0], [100, 250]], w: 4.8, trees: true, ai: BIG }, { id: 'B1', pts: [[200, 25], [200, 250]], w: 4.8, trees: true, ai: BIG },
        { id: 'BH', pts: [[0, 100], [275, 100]], w: 4.8, trees: true, ai: BIG }, { id: 'BH2', pts: [[50, 175], [350, 175]], w: 4.8, trees: true, ai: BIG },
        { id: 'v0', pts: [[150, 75], [150, 250]], w: 2.4, ai: SMALL }, { id: 'v1', pts: [[250, 100], [250, 250]], w: 2.4, ai: SMALL }, { id: 'v2', pts: [[300, 100], [300, 175]], w: 2.4, ai: SMALL },
        { id: 'h0', pts: [[100, 50], [250, 50]], w: 2.4, ai: SMALL }, { id: 'h1', pts: [[200, 25], [262, 25]], w: 2.4, ai: SMALL }, { id: 'h2', pts: [[100, 225], [350, 225]], w: 2.4, ai: SMALL },
      ],
      nature: [
        { id: 'mt', k: 'hill', poly: [[-30, -30], [90, -30], [90, 30], [70, 80], [30, 90], [-30, 90]], peak: [10, 10], r: 70, h: 12, name: '뒷산', en: 'Back Mountain' },
        { id: 'sea', k: 'sea', poly: [[262, -40], [400, -40], [400, 92], [345, 96], [318, 84], [296, 62], [280, 38], [268, 14]], far: true, shore: 'beach', name: '바다', en: 'Sea' },
        { id: 'ter', k: 'field', sub: 'terrace', poly: [[34, 28], [58, 24], [66, 44], [52, 58], [32, 50]], name: '계단식 밭' },   // 층층 땅 모양 시험(땅 능력)
        { id: 'lake', k: 'water', poly: [[128, 128], [140, 124], [148, 130], [146, 140], [134, 142], [126, 136]], name: '호수' },
        { id: 'river', k: 'water', line: { pts: [[138, 128], [160, 112], [210, 108], [240, 96], [262, 82], [290, 74], [312, 76]], w: 4.4 }, name: '강' },
      ],
      props: [
        { id: 'wf', k: 'wharf', x: 284, y: 48 }, { id: 'bt1', k: 'boat', x: 286, y: 47 }, { id: 'bt2', k: 'boat', x: 287, y: 49 }, { id: 'bt3', k: 'boat', x: 300, y: 30, small: true },
        { id: 'bw', k: 'breakwater', x: 276, y: 28 }, { id: 'lh', k: 'lighthouse', x: 268, y: 8 }, { id: 'rk', k: 'rocks', x: 271, y: 18 }, { id: 'ps', k: 'parasol', x: 296, y: 64 },
      ],
      blocks: [
        { id: 'th', x: 225, y: 140, w: 3, d: 3, h: 3, c: 'red', home: '시험', name: '시험네 집', look: 'white-modern' },   // 마당 시험(RPG 시험 계정)
        { id: 'fm', x: 262, y: 56, w: 3, d: 2, h: 1, c: 'blue', name: '수산물 가게' }, { id: 'gs', x: 254, y: 40, w: 3, d: 2, h: 1, c: 'gray', name: '어구 창고' },
      ],
      areas: [],
    },
  },
};
