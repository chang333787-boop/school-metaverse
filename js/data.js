// ============================================================
// 학교 배치 데이터 — 정림초 2026 배치도 + 위성사진 실측 반영 (v0.3)
// 좌표계: x=동서(동쪽+), z=남북(남쪽+), 단위=미터
// 건물 구조(배치도 그대로):
//   앞동(남쪽 긴 동, 1층) — 교실 남향, 복도는 북쪽
//   북쪽 날개 3개 — 서관(위에만 2층), 급식동(검은 지붕, 위성), 동관
//   2층은 서관 위에만: 6학년|5학년|소담실|계단 (1층 도서실 옆 계단으로)
// span: 방이 차지하는 x 구간(월드 좌표)
// 캐릭터 키≈1.7m 기준. 층고 3.4m, 체육관 처마 8m
// ============================================================

export const SCHOOL = {
  name: '정림초등학교',
  tagline: 'v0.3 · 배치도 날개동 구조 반영',

  building: {
    floorHeight: 3.4,
    wallColor: 0xf0d98c,          // 교문 사진: 노란 외벽
    roofColor: 0x3e8e5e,          // 위성 사진: 초록 지붕

    // 앞동: x -40~40 (길이 80m 실측), z -36(북)~-24(남 정면), 복도 북측
    front: {
      x: [-40, 40], z: [-36, -24], corridorDepth: 3.6,
      rooms: [                     // 서→동 (배치도 1층 아랫줄)
        { name: '원무실',   type: 'office',    span: [-40, -34.5] },
        { name: '유치원',   type: 'classroom', span: [-34.5, -26.5] },
        { name: '사랑반',   type: 'classroom', span: [-26.5, -19.5] },
        { name: '돌봄교실', type: 'classroom', span: [-19.5, -12.5] },
        { name: '행정실',   type: 'office',    span: [-12.5, -8] },
        { name: '교장실',   type: 'office',    span: [-8, -3.5] },
        { name: '교무실',   type: 'office',    span: [-3.5, 2] },
        { name: '현관',     type: 'hall',      span: [2, 6] },
        { name: '화장실',   type: 'toilet',    span: [6, 11] },
        { name: '컴퓨터실', type: 'computer',  span: [11, 21] },
        { name: '1학년',    type: 'classroom', span: [21, 30.5] },
        { name: '3학년',    type: 'classroom', span: [30.5, 40] },
      ],
    },

    // 북쪽 날개들 — 방 문은 남쪽(앞동 복도)으로 남
    wings: [
      { id: 'west', x: [-40, -16], z: [-46, -36], twoStory: true,
        rooms: [                   // 배치도 1층 윗줄 서쪽
          { name: '보건실', type: 'nurse',     span: [-40, -35] },
          { name: '나래반', type: 'classroom', span: [-35, -30.5] },
          { name: '문서고', type: 'storage',   span: [-30.5, -27] },
          { name: '도서실', type: 'library',   span: [-27, -22] },
          { name: '계단',   type: 'stair',     span: [-22, -16] },
        ] },
      { id: 'kitchen', x: [-14, 2], z: [-52, -36], wallHeight: 4.5, roofColor: 0x4a4e54,
        rooms: [                   // 위성: 북쪽으로 돌출한 검은 지붕 동
          { name: '급식실', type: 'cafeteria', span: [-14, 2], door: 2.6 },
        ] },
      { id: 'east', x: [6, 40], z: [-46, -36],
        rooms: [                   // 배치도 1층 윗줄 동쪽
          { name: '2학년',   type: 'classroom', span: [6, 14] },
          { name: '4학년',   type: 'classroom', span: [14, 22] },
          { name: '과학실',  type: 'science',   span: [22, 31] },
          { name: '과학창고', type: 'storage',  span: [31, 36] },
          { name: '창고',    type: 'storage',   span: [36, 40] },
        ] },
    ],

    // 2층: 서관 위에만 (배치도 2층: 6학년|5학년|소담실|계단)
    upper: {
      corridorDepth: 3.4,          // 남쪽 복도
      rooms: [
        { name: '6학년', type: 'classroom', span: [-40, -33] },
        { name: '5학년', type: 'classroom', span: [-33, -26.5] },
        { name: '소담실', type: 'office',    span: [-26.5, -22] },
      ],
    },
  },

  // 예지 보고 + 위성: 체육관은 북서쪽 별동
  gym:        { center: [-56, -52], width: 30, depth: 20, wallHeight: 8 },
  field:      { center: [6, 8],     width: 96, depth: 64 },  // 흙 운동장
  garden:     { center: [32, -57],  width: 36, depth: 14 },  // 위성: 북동쪽 큰 밭 전체
  playground: { center: [-52, 28] },
  shelter:    { center: [-36, 40], length: 20 },             // 무지개 지붕 쉼터
  bigTree:    [46, 34],                                      // 운동장 남동 큰나무
  flagPole:   [-8, -20],
  gate:       [30, 44.5],                                    // 정문 남동쪽
  bounds:     { x: 82, zMin: -70, zMax: 46 },
};
