// ============================================================
// 학교 배치 데이터 — 정림초 2026 배치도 (교사 주석: 복도·문·야외 확정) v0.5
// 좌표계: x=동서(동쪽+), z=남북(남쪽+), 단위=미터
// 구조(확정):
//   앞줄(원무실~3학년): 문은 북쪽 주 복도로. 현관은 남쪽 바깥과 연결
//   서관(보건실~도서실+계단): 주 복도 북쪽에 바로 접함. 위에만 2층
//   급식동: 문은 동쪽 세로복도로. 뒤(북)에 바깥문(시설관리)
//   세로복도: 현관 위(x 5.4~8.4)에서 북쪽으로 → 동관 북측 복도와 연결
//   동관(2·4학년·과학실·창고): 앞줄과의 사이에 야외 마당!
//     동관 복도는 건물 북쪽, 방 문은 북쪽 복도로. 남쪽 창은 마당을 봄
//   바깥문(초록): 주복도 동쪽끝, 원무실 서쪽, 보건실 서쪽, 급식동 뒤, 동관복도 동쪽끝
// 각 실 폭은 배치도 픽셀 실측(전장 80m 환산) 비율 그대로
// ============================================================

export const SCHOOL = {
  name: '정림초등학교',
  tagline: 'v0.5 · 복도·문·마당 구조 확정 반영',

  building: {
    floorHeight: 3.4,
    wallColor: 0xf0d98c,          // 교문 사진: 노란 외벽
    roofColor: 0x3e8e5e,          // 위성 사진: 초록 지붕

    // 앞줄: x -40~40, z -38(북)~-24(남 정면), 복도 북측
    front: {
      x: [-40, 40], z: [-38, -24], corridorDepth: 3.6,
      rooms: [                     // 서→동, 폭은 배치도 비율
        { name: '원무실',   type: 'office',    span: [-40, -34.3] },
        { name: '유치원',   type: 'classroom', span: [-34.3, -25.3] },
        { name: '사랑반',   type: 'classroom', span: [-25.3, -18] },
        { name: '돌봄교실', type: 'daycare',   span: [-18, -10.7] },
        { name: '행정실',   type: 'office',    span: [-10.7, -6.7] },
        { name: '교장실',   type: 'office',    span: [-6.7, -2.7] },
        { name: '교무실',   type: 'office',    span: [-2.7, 4.3] },
        { name: '현관',     type: 'hall',      span: [4.3, 8] },
        { name: '화장실',   type: 'toilet',    span: [8, 16.4] },   // 남|여
        { name: '컴퓨터실', type: 'computer',  span: [16.4, 24.2] },
        { name: '1학년',    type: 'classroom', span: [24.2, 31.6] },
        { name: '3학년',    type: 'classroom', span: [31.6, 40] },
      ],
      westDoor: -29,               // 원무실 서쪽 바깥문(초록) z 위치
      eastDoor: -36.2,             // 주복도 동쪽끝 바깥문(초록) z 위치
    },

    // 주 복도에 바로 접한 날개 = 서관만
    wings: [
      { id: 'west', x: [-40, -12], z: [-50, -38], twoStory: true,
        outDoorZ: -44,             // 보건실 서쪽 바깥문(초록)
        rooms: [
          { name: '보건실', type: 'nurse',     span: [-40, -34.3] },
          { name: '나래반', type: 'classroom', span: [-34.3, -27] },
          { name: '문서고', type: 'storage',   span: [-27, -24.3], innerOnly: true },  // 나래반에서 안으로 들어감
          { name: '도서실', type: 'library',   span: [-24.3, -16.6] },
          { name: '계단',   type: 'stair',     span: [-16.6, -12] },
        ] },
    ],

    // 급식동: 문은 동쪽 세로복도, 뒤쪽(북) 바깥문
    kitchen: { x: [-10.6, 5.4], z: [-56, -38], wallHeight: 4.5, roofColor: 0x4a4e54,
               doorZ: -47, backDoorX: -2.6 },

    // 세로복도 (현관 북쪽 → 동관 복도로)
    linkCorridor: { x: [5.4, 8.4] },

    // 동관: 마당 건너 북쪽, 복도는 건물 북측(z -58~-54.4), 방 문은 북쪽으로
    eastWing: {
      x: [8.4, 39.6], z: [-58, -44.4], corridorDepth: 3.6,
      yardDoor: 20,                // 주복도→마당 문 x 위치
      rooms: [                     // 서→동, 폭은 배치도 비율
        { name: '2학년',   type: 'classroom', span: [8.4, 17.5] },
        { name: '4학년',   type: 'classroom', span: [17.5, 26] },
        { name: '과학실',  type: 'science',   span: [26, 32.8] },
        { name: '과학창고', type: 'storage',  span: [32.8, 36.2] },
        { name: '창고',    type: 'storage',   span: [36.2, 39.6] },
      ],
    },

    // 2층: 서관 위 (6학년|5학년|소담실|계단)
    upper: {
      corridorDepth: 3.4,
      rooms: [
        { name: '6학년', type: 'classroom', span: [-40, -31] },
        { name: '5학년', type: 'classroom', span: [-31, -22] },
        { name: '소담실', type: 'office',    span: [-22, -16.6] },
      ],
    },
  },

  gym:        { center: [-60, -55], width: 30, depth: 20, wallHeight: 8 },
  field:      { center: [6, 8],     width: 96, depth: 64 },
  garden:     { center: [52, -63],  width: 24, depth: 10 },  // 북동쪽 큰 밭
  playground: { center: [-52, 28] },
  shelter:    { center: [-36, 40], length: 20 },
  bigTree:    [46, 34],
  flagPole:   [-8, -20],
  gate:       [30, 44.5],
  bounds:     { x: 82, zMin: -70, zMax: 46 },
};
