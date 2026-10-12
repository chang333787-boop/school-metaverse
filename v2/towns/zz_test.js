// 🧪 마을 세계 시험 자료(zz — 메뉴에 없음 · ?town=zz_test 로만 · 아이들 마을이 아님)
//   엔진 시험용: 선생님이 정한 테이프 자리(큰길·작은길) + 종류마다 블록 하나씩 + 산·강·호수·숲·논밭 + 두 번째 판(개발 전)
//   자료 형식 정본 = docs/systems/town.md (좌표 = 매트 cm · 왼쪽 위 (0,0) · 위 = 북쪽 · 축척 1:500 = 1cm 5m)
export const TOWN = {
  id: 'zz_test', title: '시험 마을', en: 'Test Town', scale: 500,
  mat: { w: 250, h: 140 },
  school: [110.5, 1, 139.5, 31],          // 매트 위 학교 자리(cm) → 실제 학교에 맞춤
  base: 'now',
  ai: [{ t: '시험 자료예요 — 진짜 마을은 아이들 매트 사진으로 지어요' }],
  layers: {
    now: {
      name: '오늘', en: 'Today',
      nature: [
        { id: 'n1', k: 'hill', rect: [8, 96, 42, 132], h: 6, name: '뒷산', en: 'Back Hill' },
        { id: 'n2', k: 'hill', rect: [212, 2, 246, 24], h: 3, name: '작은 언덕', en: 'Little Hill', ai: '사진에서 쌓은 높이가 잘 안 보여 3cm로 어림했어요' },
        { id: 'n3', k: 'water', line: { pts: [[0, 66], [40, 68], [90, 72], [150, 70], [200, 78], [250, 82]], w: 3 }, name: '냇물', en: 'Stream' },
        { id: 'n4', k: 'water', rect: [212, 117, 240, 136], name: '연못', en: 'Pond' },
        { id: 'n5', k: 'forest', rect: [44, 100, 70, 136], sub: 'mixed', name: '숲', en: 'Forest' },
        { id: 'n6', k: 'field', rect: [80, 92, 104, 108], sub: 'rice', name: '논', en: 'Rice Field' },
        { id: 'n7', k: 'field', rect: [148, 92, 170, 108], sub: 'farm', name: '밭', en: 'Farm' },
        { id: 'n8', k: 'field', rect: [180, 40, 198, 56], sub: 'orchard', name: '과수원', en: 'Orchard' },
        { id: 'n9', k: 'field', rect: [150, 116, 172, 136], sub: 'park', name: '공원', en: 'Park' },
      ],
      roads: [
        { id: 'r1', pts: [[75, 0], [75, 140]], w: 4.8, name: '큰길', en: 'Main Road' },
        { id: 'r2', pts: [[175, 0], [175, 140]], w: 4.8 },
        { id: 'r3', pts: [[0, 85], [250, 85]], w: 4.8 },
        { id: 'r4', pts: [[48, 0], [48, 140]], w: 2.4 }, { id: 'r5', pts: [[108, 0], [108, 140]], w: 2.4 },
        { id: 'r6', pts: [[142, 0], [142, 140]], w: 2.4 }, { id: 'r7', pts: [[202, 0], [202, 140]], w: 2.4 },
        { id: 'r8', pts: [[125, 32], [125, 140]], w: 2.4, name: '학교 앞 길', en: 'School Road' },
        { id: 'r9', pts: [[0, 32], [250, 32]], w: 2.4 }, { id: 'r10', pts: [[0, 58], [250, 58]], w: 2.4 }, { id: 'r11', pts: [[0, 112], [250, 112]], w: 2.4 },
      ],
      blocks: [
        { id: 'b1', x: 60, y: 40, w: 2, d: 2, h: 2, c: 'red' }, { id: 'b2', x: 64, y: 44, w: 2, d: 2, h: 2, c: 'orange' },
        { id: 'b3', x: 57, y: 50, w: 6, d: 3, h: 1, c: 'red' }, { id: 'b4', x: 88, y: 40, w: 3, d: 3, h: 6, c: 'orange', ai: '쌓은 칸 수가 가려져 6cm(아파트)로 어림했어요' },
        { id: 'b5', x: 95, y: 64, w: 6, d: 3, h: 1, c: 'yellow', name: '빵집', en: 'Bakery' },
        { id: 'b6', x: 84, y: 64, w: 5, d: 3.5, h: 2, c: 'yellow' },
        { id: 'b7', x: 155, y: 44, w: 4, d: 4, h: 3, c: 'red', name: '소방서', en: 'Fire Station' },
        { id: 'b8', x: 165, y: 44, w: 4, d: 4, h: 2, c: 'navy', name: '경찰서', en: 'Police Station' },
        { id: 'b9', x: 157, y: 66, w: 6, d: 3, h: 3, c: 'white', name: '병원', en: 'Hospital' },
        { id: 'b10', x: 190, y: 66, w: 5, d: 3.5, h: 2, c: 'navy', name: '도서관', en: 'Library' },
        { id: 'b11', x: 190, y: 20, w: 3, d: 3, h: 2, c: 'navy', name: '우체국', en: 'Post Office' },
        { id: 'b12', x: 30, y: 44, w: 2, d: 2, h: 2, c: 'green' }, { id: 'b13', x: 34, y: 48, w: 2, d: 2, h: 2, c: 'green' },
        { id: 'b14', x: 30, y: 20, w: 6, d: 3, h: 1, c: 'green' },
        { id: 'b15', x: 222, y: 64, w: 3, d: 3, h: 3, c: 'yellow', name: '마트', en: 'Mart' },
        { id: 'b16', x: 228, y: 44, w: 2, d: 2, h: 2, c: 'red', home: '시험' },
        { id: 'b17', x: 96, y: 124, w: 6, d: 3, h: 2, c: 'yellow', name: '공장', en: 'Factory', kind: 'factory' },
        { id: 'b18', x: 60, y: 76, w: 2, d: 2, h: 2, c: 'white', z: 0 }, { id: 'b19', x: 60, y: 76, w: 2, d: 2, h: 2, c: 'red', z: 2 },
      ],
      labels: [{ x: 125, y: 137, t: '시험 마을', en: 'Test Town' }],
      // 색종이 구역(엔진 시험 — 종류·밀도마다 하나씩)
      zones: [
        { id: 'z1', k: 'live', rect: [204, 26, 248, 56], dens: 'dense', type: 'apt', note: '빽빽하게 · 아파트' },
        { id: 'z2', k: 'live', rect: [8, 34, 46, 56], dens: 'normal', note: '주택' },
        { id: 'z3', k: 'live', rect: [112, 116, 140, 138], dens: 'sparse', type: 'house', note: '듬성듬성' },
        { id: 'z4', k: 'work', rect: [78, 26, 104, 56], dens: 'dense', note: '가게 많이' },
        { id: 'z5', k: 'green', rect: [178, 116, 200, 138], note: '공원' },
      ],
    },
    fac: {   // 시설 시험 판(아이 요구가 들어오면 이렇게 적힘)
      name: '시설 시험', en: 'Facility Test', from: 'now',
      fac: [
        { k: 'streetlight', rule: 'bigroads', by: '시험', why: '밤에 무서워요' }, { k: 'crosswalk', rule: 'crossings', by: '시험', why: '건너기 무서워요' },
        { k: 'signal', rule: 'bigcross', by: '시험' }, { k: 'streettree', rule: 'bigroads', by: '시험' }, { k: 'bench', rule: 'parks', by: '시험', why: '쉴 곳이 없어요' },
        { k: 'busstop', rule: 'bigroads', by: '시험' }, { k: 'fence', rule: 'houses', by: '시험' }, { k: 'parkedcar', rule: 'shops', by: '시험' }, { k: 'schoolzone', rule: 'school', by: '시험' },
      ],
    },
    before: {
      name: '개발 전', en: 'Before', from: 'now',
      drop: ['b4', 'b17', 'b15', 'n6'],
      nature: [{ id: 'n10', k: 'forest', rect: [80, 116, 112, 136], sub: 'pine', name: '소나무 숲', en: 'Pine Woods' },
               { id: 'n11', k: 'field', rect: [80, 92, 104, 108], sub: 'rice', name: '큰 논', en: 'Big Rice Field' },
               { id: 'n12', k: 'field', rect: [212, 56, 236, 74], sub: 'rice', name: '논', en: 'Rice Field' }],
    },
  },
};
