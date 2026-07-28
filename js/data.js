// ============================================================
// 학교 배치 데이터 — 정림초 2026 배치도 + 위성사진(축척 10m) 실측 반영
// 좌표계: x=동서(동쪽+), z=남북(남쪽+), 단위=미터
// span: 본관 내부에서 방이 차지하는 x 구간(건물 중심 기준 로컬)
// 축척 근거(위성 10m 스케일바 판독): 본관 길이≈80m, 운동장≈100×65m,
//   체육관≈30×20m, 정문=남동쪽, 놀이터·무지개쉼터=남서쪽, 큰나무=운동장 남동
// 캐릭터 키≈1.7m 기준. 층고 3.4m(키의 2배), 체육관 처마 8m(키의 약 4.7배)
// 주의: 실제 도서실·급식실·2/4학년·과학실은 뒤쪽 별동 — 지금은 임시 배치.
//   실제 2층은 6학년|5학년|소회의실만 있음(나머지 2층 공간은 홀로 비움)
// ============================================================

export const SCHOOL = {
  name: '정림초등학교',
  tagline: 'v0.2 · 도면·위성 축척 반영',

  building: {
    center: [0, -30],
    width: 80,                    // 위성 실측 ≈80m
    depth: 12,
    corridorDepth: 3.4,           // 남쪽(정면) 복도 폭
    floorHeight: 3.4,
    wallColor: 0xf0d98c,          // 교문 사진: 노란 외벽
    roofColor: 0x3e8e5e,          // 위성 사진: 초록 지붕
    floors: [
      { label: '1층', rooms: [   // 도면 순서(서→동): 유치원이 서쪽 끝
        { name: '유치원',    type: 'classroom', span: [-32, -25.5] },
        { name: '보건실',    type: 'nurse',     span: [-25.5, -21] },
        { name: '돌봄교실',  type: 'classroom', span: [-21, -15.5] },
        { name: '행정실',    type: 'office',    span: [-15.5, -11] },
        { name: '교장실',    type: 'office',    span: [-11, -7] },
        { name: '교무실',    type: 'office',    span: [-7, -3] },
        { name: '현관',      type: 'hall',      span: [-3, 3] },
        { name: '컴퓨터실',  type: 'computer',  span: [3, 10] },
        { name: '1학년',     type: 'classroom', span: [10, 16.5] },
        { name: '3학년',     type: 'classroom', span: [16.5, 23] },
        { name: '급식실',    type: 'cafeteria', span: [23, 32], door: 2.4 },
      ]},
      { label: '2층', rooms: [   // 6학년|5학년|소회의실은 실제 2층 (도면 순서)
        { name: '6학년',     type: 'classroom', span: [-32, -24.5] },
        { name: '5학년',     type: 'classroom', span: [-24.5, -17] },
        { name: '소회의실',  type: 'office',    span: [-17, -13] },
        { name: '도서실',    type: 'library',   span: [-13, -4] },
        { name: '2학년',     type: 'classroom', span: [-4, 3.5] },
        { name: '4학년',     type: 'classroom', span: [3.5, 11] },
        { name: '과학실',    type: 'science',   span: [11, 19] },
        // [19, 32]는 비워서 2층 홀 (실제 2층이 작은 것을 표현)
      ]},
    ],
  },

  // 예지 보고 "체육관은 이렇게 크다" + 위성 실측 ≈30×20
  gym:        { center: [-58, -28], width: 30, depth: 20, wallHeight: 8 },
  field:      { center: [6, 8],     width: 96, depth: 64 },  // 흙 운동장 ≈100×65
  garden:     { center: [60, -32] },
  playground: { center: [-52, 28] },                          // 위성: 남서쪽
  shelter:    { center: [-36, 40], length: 20 },              // 무지개 지붕 쉼터(위성)
  bigTree:    [46, 34],                                       // 운동장 남동 큰나무
  flagPole:   [-8, -20],
  gate:       [30, 44.5],                                     // 위성: 정문은 남동쪽
  bounds:     { x: 82, zMin: -46, zMax: 46 },
};
