// ============================================================
// 학교 배치 데이터 — 내일 행정실 도면 받으면 이 파일만 수정하면 됨
// 좌표계: x=동서(동쪽+), z=남북(남쪽+), 단위=미터
// span: 본관 내부에서 방이 차지하는 x 구간(건물 중심 기준 로컬)
// ============================================================

export const SCHOOL = {
  name: '우리초등학교',            // TODO: 실제 학교 이름
  tagline: '뼈대 버전 v0.1 · 도면/사진 반영 전',

  building: {
    center: [0, -30],
    width: 64,
    depth: 12,
    corridorDepth: 3.4,           // 남쪽(정면) 복도 폭
    floorHeight: 3.4,
    wallColor: 0xf4ead6,
    roofColor: 0xb96a4b,
    floors: [
      { label: '1층', rooms: [
        { name: '급식실',    type: 'cafeteria', span: [-24, -13], door: 2.4 },
        { name: '교무실',    type: 'office',    span: [-13, -6] },
        { name: '행정실',    type: 'office',    span: [-6, -3] },
        { name: '현관',      type: 'hall',      span: [-3, 3] },
        { name: '보건실',    type: 'nurse',     span: [3, 8] },
        { name: '1학년 1반', type: 'classroom', span: [8, 16] },
        { name: '1학년 2반', type: 'classroom', span: [16, 24] },
      ]},
      { label: '2층', rooms: [
        { name: '도서실',    type: 'library',   span: [-24, -16] },
        { name: '과학실',    type: 'science',   span: [-16, -9] },
        { name: '음악실',    type: 'music',     span: [-9, -3] },
        { name: '방송실',    type: 'broadcast', span: [-3, 3] },
        { name: '2학년 1반', type: 'classroom', span: [3, 10] },
        { name: '2학년 2반', type: 'classroom', span: [10, 17] },
        { name: '컴퓨터실',  type: 'computer',  span: [17, 24] },
      ]},
    ],
  },

  gym:        { center: [-55, -25], width: 26, depth: 18, wallHeight: 6.5 },
  field:      { center: [0, 6],     width: 80, depth: 44 },
  garden:     { center: [46, -29.5] },
  playground: { center: [52, 2] },
  flagPole:   [-8, -20],
  gate:       [0, 44.5],
  bounds:     { x: 82, zMin: -46, zMax: 46 },
};
