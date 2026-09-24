// v2 지도 계약표(MAP-API-1 · 09-24) — 데이터만(import 없음). SCHOOL(layout.js)은 main.js가 주입한다.
// 게임은 구역을 라벨(한국어) 대신 이 id로 부른다. 월드 라벨이 바뀌면 여기 표도 같이 고친다(안 고치면 check()가 '메타 없음'으로 알려 준다).
//   kind: classroom·special·office·corridor·hall·stair·toilet·storage·service·gym·stage·yard·path·field·play·garden
//   bldg: main(본관)·west(서관)·cafe(급식동)·link(가운데)·east(동관)·gym(체육관)·null(바깥)
//   tags: staff = 교직원 공간(보물·술래 기본 제외) · entry = 드나드는 곳 · covered = 지붕 밑 바깥 · kinder = 유치원
//   opts: { indoor, yr:[y0,y1] (높이 띠 — 기본 y±1.2) }
export function makeMeta(SCHOOL) {
  const KINDS = ['classroom', 'special', 'office', 'corridor', 'hall', 'stair', 'toilet', 'storage', 'service', 'gym', 'stage', 'yard', 'path', 'field', 'play', 'garden'];
  const M = (id, kind, bldg, tags = [], opts = {}) => ({ id, kind, bldg, tags, opts });
  const ZONE_META = {
    // 본관
    '현관 앞': M('entrance-porch', 'hall', 'main', ['entry', 'covered'], { indoor: false }),
    '원무실': M('kinder-office', 'office', 'main', ['staff', 'kinder']),
    '유치원': M('kinder', 'classroom', 'main', ['kinder']),
    '사랑반': M('sarang', 'classroom', 'main'),
    '돌봄교실': M('care', 'classroom', 'main'),
    '행정실': M('admin', 'office', 'main', ['staff']),
    '교장실': M('principal', 'office', 'main', ['staff']),
    '교무실': M('teachers', 'office', 'main', ['staff']),
    '현관': M('entrance', 'hall', 'main', ['entry']),
    '화장실': M('toilet-main', 'toilet', 'main'),
    '컴퓨터실': M('computer', 'special', 'main'),
    '1학년': M('grade1', 'classroom', 'main'),
    '3학년': M('grade3', 'classroom', 'main'),
    '본관 복도': M('corridor-main', 'corridor', 'main'),
    // 서관
    '보건실': M('nurse', 'special', 'west'),
    '나래반': M('narae', 'classroom', 'west'),
    '문서고': M('archive', 'storage', 'west', ['staff']),
    '도서실': M('library', 'special', 'west'),
    '계단': M('stair-west', 'stair', 'west', [], { yr: [-0.3, 3.35] }),   // 반층 참(y≈1.2~2.0)까지 '계단'
    '서측 로비': M('west-lobby', 'hall', 'west'),
    '측문': M('west-door', 'hall', 'west', ['entry']),
    '6학년': M('grade6', 'classroom', 'west'),
    '5학년': M('grade5', 'classroom', 'west'),
    '소담실': M('sodam', 'special', 'west'),
    '2층 복도': M('corridor-2f', 'corridor', 'west'),
    // 급식동
    '악기 보관 통로': M('music-passage', 'corridor', 'cafe'),
    '당직실': M('duty', 'office', 'cafe', ['staff']),
    '급식실': M('cafeteria', 'special', 'cafe'),
    '조리실': M('kitchen', 'service', 'cafe', ['staff']),
    '급식 창고': M('cafe-store', 'storage', 'cafe', ['staff']),
    // 가운데
    '가운데 로비': M('center-lobby', 'hall', 'link'),
    '세로복도': M('link-corridor', 'corridor', 'link'),
    // 동관
    '동관 복도': M('corridor-east', 'corridor', 'east'),
    '2학년': M('grade2', 'classroom', 'east'),
    '4학년': M('grade4', 'classroom', 'east'),
    '과학실': M('science', 'special', 'east'),
    '과학준비실': M('science-prep', 'storage', 'east', ['staff']),
    '창고': M('east-store', 'storage', 'east', ['staff']),
    // 체육관
    '체육관': M('gym', 'gym', 'gym'),
    '체육관 무대': M('gym-stage', 'stage', 'gym'),
    '체육관 방송실': M('gym-booth', 'service', 'gym', ['staff']),
    '체육관 준비실': M('gym-prep', 'service', 'gym', ['staff']),
    '체육관 전실': M('gym-lobby', 'hall', 'gym', ['entry']),
    '체육 창고': M('gym-store', 'storage', 'gym', ['staff']),
    '체육관 현관': M('gym-porch', 'hall', 'gym', ['entry', 'covered'], { indoor: false }),
    // 바깥
    '가운데 마당': M('court', 'yard', null),
    '마당 동쪽 입구': M('court-east', 'yard', null),                                        // COURT-3: 전봇대·화분 A(동관 뒤뜰에서 떼어 냄)
    '앞뜰 산책로': M('front-walk', 'path', null),
    '구령대': M('podium', 'stage', null),
    '놀이터': M('playground', 'play', null),
    '유치원 놀이터': M('kinder-playground', 'play', null, ['kinder']),
    '체육관 계단': M('gym-steps', 'stair', null),
    '숲놀이터': M('forest-play', 'play', null),
    '개수대': M('sink', 'yard', null, ['water']),
    '주차장': M('parking', 'yard', null, ['car']),
    '주차장(북쪽)': M('parking-north', 'yard', null, ['car']),
    '뒷길': M('back-lane', 'path', null),
    '텃밭': M('garden', 'garden', null),
    '텃밭 쉼터': M('garden-deck', 'yard', null, ['covered']),
    '동관 뒤뜰': M('east-yard', 'yard', null),
    '운동장': M('field', 'field', null),
    '동쪽 통학로': M('east-path', 'path', null),
  };

  // 게임용 넓은 구역(바깥 빈칸 메우기) — world.zones 끝에 덧붙는다(도달성 게이트도 이 구역까지 본다).
  //   판정은 '가장 좁은 구역'이라 월드 구역(방·놀이터 등)과 겹쳐도 그쪽이 이긴다. 좌표는 되도록 SCHOOL 값에서.
  //   근거 = 길격자의 '구역 없는 칸' 묶음(SD2.map.coverage()) + 위에서 본 촬영. 팻말(글자)은 만들지 않는다 — 게임 HUD 이름일 뿐.
  const T = SCHOOL.terrain, B = SCHOOL.building, G = SCHOOL.gym, YD = T.yard, FD = T.field;
  const X = (x0, x1, z0, z1, y, label, id, kind, bldg = null, tags = [], opts = {}) => ({ x0, x1, z0, z1, y, label, meta: M(id, kind, bldg, tags, opts) });
  const EXTRA_ZONES = [
    X(-42.5, 53.5, SCHOOL.frontYard.walkS, T.fieldZ, (YD + FD) / 2, '앞뜰 잔디 둔덕', 'front-slope', 'yard', null, [], { yr: [FD - 0.4, YD + 1.0] }),
    X(-86, B.front.x[0], -86, T.westZ, YD, '서쪽 대지', 'west-yard', 'yard'),                                   // 체육관 둘레·서관 서쪽(체육관·주차장 구역이 더 좁아 그쪽이 이긴다)
    X(-86, SCHOOL.garden.x[0], -86, SCHOOL.parking.z[0], YD, '북쪽 둘레길', 'north-lane', 'path'),
    X(SCHOOL.garden.x[0], 60, -86, SCHOOL.garden.z[0], YD, '북쪽 둘레길', 'north-lane-e', 'path'),
    X(B.wings[0].x[1], B.kitchen.x[0], B.wings[0].z[0] - 12, B.wings[0].z[0], YD, '뒷길', 'back-lane-n', 'path'),   // 뒷길(서관|급식동 틈)이 북쪽으로 이어지는 칸
    X(B.kitchen.x[0], SCHOOL.garden.x[0], B.wings[0].z[0] - 12, B.kitchen.z[0], YD, '급식동 뒤', 'cafe-back', 'path'),   // 주차장(북쪽) 경계 = 서관 뒤 12m(world.js 주차장 구역과 같은 식)
    X(SCHOOL.parking.x[1], SCHOOL.garden.x[0], SCHOOL.parking.z[0], B.wings[0].z[0] - 12, YD, '노란 창고 옆', 'shed-side', 'yard'),
    X(SCHOOL.garden.x[0] - 5, 60, SCHOOL.garden.z[1], B.eastWing.z[0], YD, '텃밭 앞 길', 'garden-lane', 'path'),
    X(SCHOOL.garden.x[1], 60, SCHOOL.garden.z[0], SCHOOL.garden.z[1], YD, '텃밭 동쪽', 'garden-east', 'yard'),
    X(B.front.x[1], 60, B.front.z[0], T.fieldZ, YD, '본관 동쪽 끝', 'main-east', 'yard'),
    X(SCHOOL.eastFenceX, SCHOOL.eastPath.x[0], T.fieldZ, SCHOOL.gate[1] - 2, FD, '동쪽 통학로', 'east-path-verge', 'path'),   // 초록 철망과 통학로 사이 띠
    X(SCHOOL.eastPath.x[1] + 3, 60, T.fieldZ, 50, FD, '동쪽 가장자리', 'east-strip', 'yard'),
    X(-50.5, T.westX, T.westZ, SCHOOL.southFenceZ, FD, '운동장 서쪽 띠', 'field-west', 'field'),
    X(-50.5, SCHOOL.eastPath.x[0], SCHOOL.southFenceZ, 63.5, FD, '남쪽 마당', 'south-plaza', 'yard'),       // 남변 울타리가 비스듬(정문 z 52.5 → 서끝 63) — 울타리 밖은 학교 밖 칸
    X(SCHOOL.gate[0] - 8, SCHOOL.gate[0] + 8, 44, SCHOOL.gate[1], FD, '정문', 'gate', 'path', null, ['entry']),
    // 체육관 부속동 화장실 두 칸(월드에 '화장실' 팻말이 있는 칸 — 구역만 빠져 있었다)
    X(G.annex.x[0], G.annex.x[1], G.annex.z[0], G.doorZ - 1.4, G.floorY, '체육관 화장실', 'gym-toilet-n', 'toilet', 'gym'),
    X(G.annex.x[0], G.annex.x[1], G.doorZ + 1.4, G.doorZ + 3.6, G.floorY, '체육관 화장실', 'gym-toilet-s', 'toilet', 'gym'),
    // 조리실 쪽 주복도 문 안(당직실과 식당 홀 사이) — 조리실로 들어가는 앞칸
    X(B.kitchen.dutyRoom.x[1], B.kitchen.hallX0, B.kitchen.dutyRoom.z[0], B.kitchen.dutyRoom.z[1], 0, '조리실 앞', 'kitchen-entry', 'service', 'cafe', ['staff']),
    // 서관 2층 계단홀(U자 계단 윗참 — 2층 복도 북쪽). 월드에 '2층 계단' 구역이 생기면 이 줄은 지운다
    X(B.wings[0].rooms.find(r => r.type === 'stair').span[0], B.wings[0].x[1], B.wings[0].z[0], B.wings[0].z[1] - B.upper.corridorDepth, B.floorHeight + 0.3, '2층 계단홀', 'stair-west-2f', 'stair', 'west'),
  ];

  // 출발점(게임이 'spawn:<id>'로 부른다) — 전부 물리 질의로 막힘 없음·높이 확인(SD2.map.check().spawnsBad = 0)
  //   h = 방위°(0 = 북 -z, 90 = 동 +x). floor 2 = 서관 2층
  const SPAWNS = {
    default: { x: 13.4, z: -6, h: 0, label: '운동장(구령대 앞)' },
    gate: { x: SCHOOL.gate[0], z: SCHOOL.gate[1] - 3.5, h: 0, label: '정문 안' },
    'front-walk': { x: 12.5, z: -18.6, h: 0, label: '앞뜰 산책로(현관 앞)' },
    'field-center': { x: 0, z: 14, h: 0, label: '운동장 가운데' },
    'center-lobby': { x: 13.8, z: -36.2, h: 0, label: '가운데 로비' },
    gym: { x: -67, z: -12, h: 0, label: '체육관' },
    'corridor-2f': { x: -25, z: -35.3, h: 270, floor: 2, label: '2층 복도' },
    playground: { x: -38, z: 46, h: 180, label: '놀이터 앞' },
    red: { x: -25, z: 14, h: 90, label: '운동장 서쪽(빨강 팀)' },
    blue: { x: 25, z: 14, h: 270, label: '운동장 동쪽(파랑 팀)' },
    garden: { x: 32.5, z: -56, h: 180, label: '텃밭 앞' },
    'corridor-main': { x: 0, z: -32.8, h: 90, label: '본관 복도' },
  };

  // 표지점(게임 'lm:<id>') — 좌표는 layout.js 값에서. r = 이 반경 안이면 '그 앞'
  const rectC = R => [(R.x[0] + R.x[1]) / 2, (R.z[0] + R.z[1]) / 2];
  const LANDMARKS = [
    { id: 'gate', label: '정문', at: SCHOOL.gate, r: 4 },
    { id: 'bus', label: '셔틀버스', at: SCHOOL.bus, r: 6.5 },
    { id: 'big-tree', label: '큰 나무', at: SCHOOL.bigTree, r: 5 },
    { id: 'flag-pole', label: '게양대', at: SCHOOL.flagPole, r: 3 },
    { id: 'sink', label: '운동장 개수대', at: SCHOOL.sink, r: 3 },
    { id: 'playground', label: '놀이터', at: SCHOOL.playground.center, r: 7 },
    { id: 'garden-deck', label: '텃밭 쉼터', at: SCHOOL.gardenDeck.center, r: 4 },
    { id: 'court-pots', label: '가운데 마당 향나무 화분 길', at: [36.8, -37.45], r: 3 },          // COURT-3: 사발 화분 5개 줄 가운데(world.js 가운데 마당)
    { id: 'court-pole', label: '마당 동쪽 전봇대', at: [48.5, -35.9], r: 2.5 },                    // 마당 동쪽 입구 콘크리트 전봇대(영상 q_107~q_112)
    { id: 'shed', label: '노란 창고', at: SCHOOL.shed.center, r: 6 },
    { id: 'shelter', label: '무지개 쉼터', at: SCHOOL.shelter.center, r: 4, rect: [SCHOOL.shelter.center[0] - SCHOOL.shelter.length / 2, SCHOOL.shelter.center[1] - 2.2, SCHOOL.shelter.center[0] + SCHOOL.shelter.length / 2, SCHOOL.shelter.center[1] + 2.2] },
    { id: 'podium', label: '구령대', at: [(SCHOOL.porch.x[0] + SCHOOL.porch.x[1]) / 2, T.fieldZ - 2.5], r: 3.5 },
    { id: 'forest-play', label: '숲놀이터', at: rectC(SCHOOL.forestPlay), r: 6 },
    { id: 'kinder-playground', label: '유치원 놀이터', at: rectC(SCHOOL.kinderPlayground), r: 5 },
    { id: 'plaza', label: '남쪽 놀이 마당', at: rectC(SCHOOL.plaza), r: 8 },
    { id: 'garden', label: '텃밭', at: rectC(SCHOOL.garden), r: 10 },
    { id: 'parking', label: '주차장', at: rectC(SCHOOL.parking), r: 10 },
  ];
  // 운동장 놀이판(달리기 트랙·공 놀이·무궁화 신호등 게임용) — 운동장 흙 사각형(SCHOOL)에서 계산. 골대·숲놀이터를 피한 여백은 실측(09-24 길격자)
  const FL = { x0: T.westX, x1: SCHOOL.eastFenceX, z0: T.fieldZ, z1: SCHOOL.southFenceZ };
  const PLAY = {
    field: { x: [FL.x0 + 0.5, FL.x1 - 0.4], z: [FL.z0 + 0.2, FL.z1 - 0.5] },                  // 운동장 안(울타리·둔덕 발치 제외)
    ball: { x: [FL.x0 + 4, FL.x1 - 5.2], z: [FL.z0 + 0.9, FL.z1 - 5] },                      // 공이 튕기는 판(골대 앞 여유)
    track: { c: [(FL.x0 + FL.x1) / 2, (FL.z0 + FL.z1) / 2], a: (FL.x1 - FL.x0) / 2 - 9.75, b: (FL.z1 - FL.z0) / 2 - 7.95, half: 1.5, gates: 8 },   // 타원 트랙(폭 ±1.5)
    redlight: { startZ: FL.z1 - 5.5, finish: { x: SCHOOL.porch.x.slice(), z: [FL.z0 + 0.3, FL.z0 + 1.5] } },          // 출발선 · 구령대 앞 결승
    y: T.field,
  };
  return { KINDS, ZONE_META, EXTRA_ZONES, SPAWNS, LANDMARKS, PLAY };
}
