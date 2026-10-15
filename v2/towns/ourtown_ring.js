// 🏘 우리 마을 확장 판 둘레 80칸(10-15 · 아이들 판 사진·영상·패들렛 49개를 또래 세션이 읽어 정리 — Claude는 자료로 옮길 뿐 · 사진·영상은 저장소에 넣지 않음)
//   ourtown.js가 불러 씀(블록·이름표·채우기·자연·소품) · 이름은 성 없이 이름만(카드의 성은 뺌) · 근거 노트는 저장소 밖(또래 스크래치)
const B = (cell, at, t, c, o = {}) => ({ cell, at, t, c, ...o });
const P = (cell, f) => { // 칸 + 칸 안 비율 다각형 → 판 cm (ourtown 기준)
  const R = '가나다라마바사아자차'; const r = R.indexOf(cell[0]); const n = +cell.slice(1);
  const x0 = (n - 3) * 25, y0 = (r - 2) * 25; return f.map(([u, v]) => [x0 + u * 25, y0 + v * 25]);
};

// ───────── 블록 (🧱) ─────────
export const RING_BLOCKS = [
  // 가 줄
  B('가1', [0.45, 0.55], 'pl', 'green', { rot: 90 }),
  B('가2', [0.55, 0.30], 'pl', 'navy', { rot: 20, name: '펜션', en: 'Pension', kind: 'shop', look: 'log-lodge', ai: '산 펜션 = 통나무 A자 지붕 산장 + 데크 · 장작(✨ 이름·자리에서)', note: '산 펜션(모두가 쓰는 곳 카드)' }),
  B('가3', [0.52, 0.40], 'pe', 'green'), B('가3', [0.60, 0.48], 'pe', 'green'),
  B('가4', [0.62, 0.38], 'pe', 'green'), B('가4', [0.42, 0.50], 'pl', 'green', { rot: 90 }),
  B('가5', [0.33, 0.25], 'pl', 'green', { rot: -30 }), B('가5', [0.55, 0.40], 'pl', 'green', { rot: -30 }),
  B('가6', [0.55, 0.40], 'pl', 'orange', { rot: -60, ai: '카드 없는 주황 판 = 빌라(색 약속)' }),
  ...[[0.22, 0.25], [0.38, 0.20], [0.55, 0.22], [0.72, 0.25], [0.28, 0.45], [0.45, 0.42], [0.62, 0.45], [0.78, 0.48], [0.32, 0.68], [0.52, 0.70], [0.70, 0.72]]
    .map((a, i) => B('가7', a, 'pe', 'red', { rot: (i * 29) % 90, ai: '카드 없는 빨강 높게 세운 판 11 = 고층 아파트 숲(색 약속)' })),
  B('가7', [0.12, 0.10], 'c2', 'green'),
  ...[[0.25, 0.30, 90], [0.45, 0.12, 0], [0.72, 0.30, 90], [0.72, 0.55, 90], [0.35, 0.72, 30], [0.68, 0.75, -30]]
    .map(([u, v, r]) => B('가8', [u, v], 'pe', 'yellow', { rot: r, ai: "카드 없는 노랑 높게 세운 판 6 'ㄷ'자 = 업무·상가 건물(가운데 마당)" })),
  ...[[0.25, 0.40, 20], [0.45, 0.30, 60], [0.55, 0.55, 10], [0.75, 0.45, 80]].map(([u, v, r], i) => B('가9', [u, v], i % 2 ? 'pl' : 'pe', i % 2 ? 'orange' : 'red', { rot: r, ai: '카드 없는 빨강·주황 = 주택·빌라' })),
  B('가10', [0.40, 0.92], 'c3', 'skyblue', { name: '카페', en: 'Cafe', kind: 'shop', look: 'rooftop-cafe', ai: '옥상 테라스 + 파라솔 둘(✨ 이름에서)' }),
  ...[[0.45, 0.35], [0.55, 0.50], [0.65, 0.40], [0.40, 0.65], [0.75, 0.25]].map((a, i) => B('가11', a, 'pe', i % 2 ? 'orange' : 'red', { rot: 20 + i * 15, ...(i ? {} : { name: '빌라', en: 'Villa' }) })),
  B('가12', [0.15, 0.20], 'c2', 'navy', { name: '수산물 시장', en: 'Fish Market', kind: 'market', look: 'open-market', ai: '모래 위 열린 지붕 어시장(기둥 + 넓은 박공 지붕 + 좌판 두 줄 · 수조 · 얼음 상자 — ✨ 칸 메모 「모래사장 끝 어시장(지붕 · 좌판)」대로 겉만 · 자리·종류 그대로)' }),
  B('가14', [0.35, 0.30], 'c2', 'navy', { kind: 'duckboat', name: '오리배', en: 'Duck Boats', ai: '바다 종이 위 남색 정육면체 = 오리배' }),
  // 나 줄
  B('나1', [0.55, 0.40], 'pl', 'green', { rot: 20 }),
  B('나3', [0.50, 0.45], 'c3', 'red', { home: '예지', name: '예지네 집', en: "Yeji's House", enter: true, look: 'purple-townhouse' }),
  ...[['pe', 0.30, 0.30, 0], ['pl', 0.35, 0.52, 60], ['pe', 0.25, 0.58, 0], ['pl', 0.70, 0.15, 30], ['pe', 0.66, 0.55, 0], ['pl', 0.62, 0.72, 20], ['c3', 0.70, 0.82, 0], ['pl', 0.30, 0.86, -30], ['ps', 0.42, 0.20, 0]]
    .map(([t, u, v, r]) => B('나3', [u, v], t, 'green', { rot: r })),
  B('나4', [0.50, 0.40], 'c3', 'red', { home: '하람', name: '하람이네 집', en: "Haram's House", enter: true, look: 'blue-cottage' }),
  B('나4', [0.30, 0.42], 'pl', 'green', { rot: 90 }), B('나4', [0.72, 0.42], 'pl', 'green', { rot: 90 }),
  B('나6', [0.62, 0.22], 'pl', 'navy', { kind: 'fire', name: '소방서', en: 'Fire Station', ai: '카드 없는 남색 = 모두가 쓰는 곳 → 마을에 없는 소방서' }),
  B('나7', [0.42, 0.45], 'pl', 'navy', { rot: 20, kind: 'post', name: '우체국', en: 'Post Office', ai: '카드 없는 남색 = 모두가 쓰는 곳 → 우체국' }),
  B('나8', [0.45, 0.42], 'pl', 'red', { rot: 80, ai: '카드 없는 빨강 = 단독주택' }),
  B('나9', [0.25, 0.18], 'c3', 'navy', { rot: 30, name: '수산물 직판장', en: 'Seafood Direct Market', kind: 'market' }),
  B('나10', [0.55, 0.80], null, 'skyblue', { w: 6, d: 3, h: 3, name: '박물관', en: 'Museum', kind: 'museum', look: 'gray-louver', pad: '20.1', note: '하늘색 판 3장 쌓음 · 패들렛 20 사진 = 회색 세로 루버 + 큰 유리 1층' }),
  B('나11', [0.78, 0.12], 'ps', 'skyblue', { name: '해산물 식당', en: 'Seafood Restaurant', kind: 'shop', look: 'seafood-deck', ai: '파란 차양 · 수조 · 바다 쪽 나무 데크 테라스(✨ 이름에서)' }), B('나11', [0.78, 0.16], 'ps', 'skyblue'), B('나11', [0.78, 0.20], 'ps', 'skyblue'),
  B('나12', [0.38, 0.30], 'c2', 'skyblue', { kind: 'parasol', name: '파라솔', en: 'Parasols' }), B('나12', [0.38, 0.78], 'c2', 'skyblue', { kind: 'parasol' }),
  B('나13', [0.55, 0.35], 'c2', 'skyblue', { kind: 'duckboat', name: '오리배', en: 'Duck Boats' }),
  // 왼쪽 둘레(1·2열)
  B('다1', [0.35, 0.40], 'pl', 'green', { rot: -30 }), B('다1', [0.45, 0.62], 'pl', 'green', { rot: -30 }),
  B('다2', [0.62, 0.30], null, 'navy', { w: 2, d: 2, h: 8, name: '행정복지센터', en: 'Community Center', kind: 'public', note: '남색 정육면체 3~4개 쌓은 탑 · 산마을 행정복지센터(아7과 별개)' }),
  B('라1', [0.55, 0.42], 'pe', 'green'), B('라1', [0.35, 0.62], 'pl', 'green', { rot: 60 }),
  B('라2', [0.48, 0.42], 'c3', 'red', { home: '유은', name: '유은이네 집', en: "Yueun's House", enter: true, look: 'treehouse' }),
  B('라2', [0.35, 0.22], 'pl', 'green'), B('라2', [0.65, 0.22], 'pl', 'green'), B('라2', [0.25, 0.50], 'pl', 'green', { rot: 90 }), B('라2', [0.70, 0.52], 'pl', 'green', { rot: 90 }),
  B('마1', [0.50, 0.55], 'c3', 'purple', { name: '보드게임 카페', en: 'Board Game Cafe', kind: 'shop', look: 'boardgame-dice', inside: 'board', room: ['1층 음식점', '2층 상점가', '3층 보드게임'], ai: '층마다 다른 창 · 3층 체크무늬 띠 · 옥상 큰 주사위(✨ 이름에서)', floors: ['음식점', '상점가', '보드게임 카페'], note: '카드: 1층 음식점 · 2층 상점가 · 3층 보드게임 카페' }),
  B('마2', [0.38, 0.45], null, 'navy', { w: 6, d: 3, h: 2, rot: 60, kind: 'public', name: '관광 안내소', en: 'Tourist Info', look: 'tour-kiosk', ai: '작은 원형 정자형 안내소 + i 표지 + 그림 지도판(✨) · 카드 없는 남색 판 2~3장 쌓음 → 아쿠아리움·뷔페 동네 입구 관광 안내소' }),
  B('바1', [0.70, 0.45], 'pl', 'navy', { rot: 40, kind: 'market', name: '약초 시장', en: 'Herb Market', by: '유은', note: '패들렛 36 약초시장 바1' }),
  B('바2', [0.45, 0.48], 'pl', 'navy', { kind: 'aquarium', name: '대형 아쿠아리움', en: 'Aquarium', by: '유은', look: 'wave-roof', inside: 'aqua', room: ['수조 위 보트', '아치 수중 터널', '클리오네', '작은 동물 방'], pad: '33', ai: '정면 고래·상어 그림자 판(✨)', note: '패들렛 33 — 수조 위 보트 · 수중 터널 · 곤충·작은 동물 체험' }),
  B('사2', [0.48, 0.35], 'c2', 'navy', { kind: 'shop', name: '뷔페', en: 'Buffet', look: 'pink-buffet', pad: '34.1·34.2', note: '패들렛 34 사2 핑크 뷔페 — 분홍 줄무늬 차양 · 분홍 외관' }),
  // 오른쪽 둘레(13·14열)
  B('마13', [0.18, 0.92], 'c3', 'skyblue', { kind: 'hut', name: '갯벌 쉼터', look: 'mud-shelter', ai: '갯벌 카드 옆 하늘색 블록 = 갯벌 체험 쉼터 · 겉 = 진흙 위 나무 데크 + 정자(✨ 이름의 쉼터대로 — 예전엔 공원 잔디 네모)' }),
  B('바14', [0.55, 0.40], null, 'red', { w: 3, d: 3, h: 3, home: '인우', name: '인우네 집', en: "Inu's House", look: 'black-steel-glass', note: '초록 c3 2 + 빨강 c3 1 + 초록 판 1 붙임 · 패들렛 39(가게 앞 사진 — 집 모양으로만, 간판 글 없음)' }),
  B('사13', [0.65, 0.62], null, 'skyblue', { w: 6, d: 3, h: 3, kind: 'shop', name: '초밥집', en: 'Sushi', look: 'dark-brick-metal-roof', pad: '32.1', ai: '문 앞 천 가림막(노렌 꼴 · 글 없음 ✨)' }),
  B('사14', [0.62, 0.42], 'c3', 'navy', { kind: 'shop', name: '마라탕', en: 'Malatang', look: 'pink-cream', pad: '38.1·38.2', ai: '입구 빨간 등 둘(✨)' }),
  B('아13', [0.62, 0.38], 'pl', 'red', { rot: -30, kind: 'pension', name: '펜션', en: 'Pension', look: 'white-pension-lights', by: '지원', pad: '27.2', note: '카드 칸 글씨 아12 → 판 아13 · 패들렛 27 좀 화려한 거' }),
  B('아14', [0.40, 0.12], null, 'navy', { w: 3, d: 3, h: 10, kind: 'aquadom', name: '어항', en: 'Round Aquarium', by: '지원', note: '패들렛 17 동글동글한 어항 — 원통형 수족관 탑' }),
  // 자 줄
  ...[['pl', 0.13, 0.22, 90], ['pl', 0.13, 0.45, 90], ['c3', 0.18, 0.64, 0], ['pl', 0.40, 0.18, 10], ['c3', 0.75, 0.13, 0], ['c3', 0.75, 0.28, 0], ['pl', 0.72, 0.52, 90], ['pl', 0.32, 0.70, -30], ['pl', 0.52, 0.82, -30], ['c3', 0.70, 0.76, 0], ['c3', 0.80, 0.80, 0]]
    .map(([t, u, v, r]) => B('자1', [u, v], t, 'yellow', { rot: r, ai: "카드 없는 노랑 'ㅁ'자 = 상가(가운데 광장)" })),
  ...[0.2, 0.4, 0.6, 0.8].flatMap((v, j) => [0.2, 0.4, 0.6, 0.8].map((u, i) => B('자2', [u, v], 'ps', (i + j) % 2 ? 'orange' : 'red', { rot: -35, ai: '카드 없는 빨강·주황 16 = 아파트 단지' }))),
  B('자3', [0.52, 0.42], null, 'black', { w: 11, d: 11, h: 3, kind: 'school', name: '학교', en: 'School', flat: true, ai: '검은 종이 = 학교(범례) — 또 하나의 학교' }),
  B('자4', [0.30, 0.35], 'c3', 'yellow', { rot: 20, name: '햄버거', en: 'Burger', kind: 'shop' }), B('자4', [0.70, 0.30], 'pe', 'yellow', { rot: 20, name: '국숫집', en: 'Noodles', kind: 'shop' }), B('자4', [0.65, 0.50], 'c3', 'yellow', { name: '중국집', en: 'Jajangmyeon', kind: 'shop' }),
  B('자5', [0.42, 0.44], 'pl', 'navy', { kind: 'museum', name: '곤충 박물관', en: 'Insect Museum', look: 'insect-dome', ai: '옆 유리 온실 반구(나비 정원) · 지붕 위 큰 무당벌레(✨ 이름에서)' }),
  B('자6', [0.44, 0.32], 'pl', 'yellow', { kind: 'market', name: '산지 식품·용품 상점', en: 'Mountain Goods', note: '카드: 버섯 상점 2 · 약초 상점 4 · 산에서 자라는 특산물 — 산 물건이 팔리는 곳' }),
  B('자7', [0.58, 0.54], 'pl', 'yellow', { rot: 70, kind: 'market', name: '수산물 시장', en: 'Fish Market', note: '카드: 수산물 상점 4 · 바다 특산물 6 — 바다 물건이 팔리는 곳' }),
  B('자8', [0.66, 0.22], 'c2', 'skyblue', { kind: 'shop', ai: '카드 없는 하늘색 = 작은 가게' }),
  B('자9', [0.32, 0.20], null, 'red', { w: 3, d: 3, h: 3, home: '지원', name: '지원이네 집', en: "Jiwon's House", enter: true, look: 'cream-suburban-fountain', room: ['침대', '책상', '방', '주방'], note: '빨강·주황 판 ㅁ자 쌓음 · 카드: 침대·책상 · 마리오(카트?) · 방·주방' }),
  ...[[0.30, 0.40, 90], [0.30, 0.60, 90], [0.45, 0.72, 0], [0.62, 0.72, 0], [0.72, 0.55, 90], [0.72, 0.35, 90]].map(([u, v, r]) => B('자9', [u, v], 'pl', 'green', { rot: r, fence: true })),
  B('자10', [0.45, 0.15], null, 'red', { w: 3, d: 3, h: 3, home: '시아', name: '시아네 집', en: "Sia's House", look: 'white-modern' }),
  ...[[0.33, 0.28, 90], [0.33, 0.48, 90], [0.45, 0.58, 0], [0.60, 0.58, 0], [0.66, 0.42, 90], [0.66, 0.24, 90]].map(([u, v, r]) => B('자10', [u, v], 'pl', 'green', { rot: r, fence: true })),
  B('자10', [0.17, 0.65], 'pl', 'green', { rot: 30 }),
  B('자11', [0.66, 0.47], null, 'red', { w: 3, d: 2, h: 2, look: 'half-timber', note: '패들렛 47 — 유럽 옛 마을' }),
  B('자12', [0.45, 0.48], null, 'skyblue', { w: 6, d: 4, h: 3, rot: -20, kind: 'kidscafe', name: '키즈 카페', en: 'Kids Cafe', by: '지원', look: 'kids-jungle', inside: 'kids', room: ['철골 정글짐', '미끄럼', '그물 다리', '네온'], pad: '28.1', ai: '벽 밖으로 나온 원통 미끄럼틀(✨)', note: '패들렛 28 500평(≈40×40m) — 실내 철골 정글짐' }),
  B('자13', [0.45, 0.29], null, 'skyblue', { w: 6, d: 3, h: 2, kind: 'shop', name: '샤브샤브', en: 'Shabu-shabu', look: 'dark-gray-teal-awning', pad: '35.1' }),
  B('자14', [0.35, 0.15], 'pl', 'navy', { kind: 'shop', name: '카페', en: 'Palace Cafe', look: 'palace-white-gold', pad: '37.1', note: '패들렛 37 궁전 느낌 유럽 중세풍' }),
  // 차 줄
  B('차1', [0.42, 0.56], 'c3', 'navy', { kind: 'shop', name: '카페', en: 'Brick Cafe', look: 'red-brick-cafe', by: '유은', pad: '31.1', note: '패들렛 31 카페 차1(카드는 사진 밖)' }),
  B('차2', [0.25, 0.22], 'pl', 'yellow', { rot: 30, kind: 'shop', ai: '일하는 곳 카드 이름 칸이 빈칸(교사 10-15 확인) — 노랑 = 일하는 곳 → 가게 줄 ✨' }), B('차2', [0.52, 0.40], 'pl', 'yellow', { rot: 15 }), B('차2', [0.30, 0.62], 'pl', 'yellow', { rot: 30 }),
  B('차3', [0.55, 0.42], 'c2', 'white', { kind: 'clinic', name: '의원', en: 'Clinic', ai: '카드 없는 흰 블록 = 병원 약속 → 작은 의원' }), B('차3', [0.50, 0.53], 'c2', 'white'), B('차3', [0.42, 0.68], 'c2', 'white'),
  B('차6', [0.32, 0.38], 'pl', 'navy', { rot: 60, kind: 'terminal', name: '버스 터미널', en: 'Bus Terminal', look: 'terminal-canopy', ai: '긴 처마 승강장(버스 칸 넷 · 번호판) + 작은 시계탑(✨) · 카드 없는 남색 판 = 모두가 쓰는 곳 → 산·바다 물건 장터(자6·자7) 아래 버스 터미널' }),
  B('차6', [0.65, 0.30], 'pl', 'skyblue'), B('차6', [0.72, 0.52], 'pl', 'navy', { rot: -30 }), B('차6', [0.22, 0.62], 'pl', 'navy'),
  B('차8', [0.65, 0.15], null, 'yellow', { w: 6, d: 3, h: 2, kind: 'mart', name: '마트', en: 'Mart', look: 'gray-brick-big-sign', pad: '45.1' }),
  B('차9', [0.65, 0.32], 'pl', 'navy', { kind: 'shop', name: '아이스크림', en: 'Ice Cream', look: 'pink-arch', pad: '48.1', ai: '지붕 위 큰 콘 모형(✨)', note: "카드 '베라' — 상표 대신 '아이스크림'" }),
  B('차10', [0.75, 0.50], 'pl', 'skyblue', { kind: 'shop', name: '편의점', en: 'Convenience Store', ai: '카드 없는 하늘색 = 편의점' }),
  B('차11', [0.50, 0.47], null, 'red', { w: 6, d: 3, h: 2, look: 'half-timber' }),
  B('차12', [0.65, 0.47], 'c3', 'skyblue', { kind: 'shop', name: '빵집', en: 'Bakery', look: 'white-awning-wood', pad: '46.1', ai: '문 앞 칠판 입간판(✨)' }),
  ...Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return B('차13', [+(0.55 + 0.22 * Math.cos(a)).toFixed(2), +(0.55 + 0.22 * Math.sin(a)).toFixed(2)], 'ps', 'skyblue', { rot: Math.round(i * 45 + 90), ...(i ? { part: 'store' } : { kind: 'store', look: 'round-stone', pad: '26.1·26.2', ai: '아이 판 하늘색 판 9장 원 = 둥근(8각) 건물 한 채로 · 지붕 깃발 줄(✨)', name: '도시 상점', en: 'City Store', by: '지원', note: '패들렛 26 옷·키링·모자·인형 · 흰 돌 + 큰 유리 4~5층' }) }); }),
  ...[[0.45, 0.32], [0.55, 0.47], [0.70, 0.58]].map(a => B('차14', a, 'ps', 'red', { rot: -15, ai: '카드 없는 빨강 긴 판 = 연립 주택' })),
];

// ───────── 이름표 칸(🏷 아이 글 그대로 · style·fill·ai = ✨) ─────────
export const RING_AREAS = [
  { cell: '가1', t: '천연기념물 보호소', card: '자연', style: ['woods', 'reserve'], ai: '산자락 숲 속 야생동물 보호소 — 울타리 우리 · 관찰 데크 · 동물 몇(가5 센터와 한 쌍)' },
  { cell: '가2', t: '펜션', card: '모두가 쓰는 곳', style: ['woods'], ai: '산 펜션 — 나무 2층 · 테라스' },
  { cell: '가5', t: '천연기념물 보호 센터', card: '자연', items: ['천연기념물 24', '동물'], style: ['reserve'], ai: '보호 센터 건물 + 동물 우리 · 숲 가장자리' },
  { cell: '가10', t: '카페', card: '일하는 곳', fill: { k: 'work', type: 'shop', dens: 'normal' } },
  { cell: '가11', t: '빌라', card: '사는 곳', fill: { k: 'live', type: 'house', dens: 'dense' } },
  { cell: '가12', t: '수산물 시장', card: '모두가 쓰는 곳', style: ['beach'], ai: '모래사장 끝 어시장(지붕 · 좌판)' },
  { cell: '가14', t: '오리배', card: '놀고 쉬는 곳', ai: '바다 위 오리배 여러 척 + 작은 선착장' },
  { cell: '나1', t: '산림 스키장', card: '자연', by: '유은', style: ['ski', 'waterpark'], ai: '슬로프(사이사이 숲 띠 남김 = 산림 보호) + 리프트 + 아래 워터파크 풀·미끄럼틀 · 계절 따라(패들렛 29 여름 워터파크 · 겨울 스키장)' },
  { cell: '나3', t: '예지 집', card: '사는 곳', style: ['woods'], ai: '예지네 집 = 보라 벽 타운하우스(패들렛 44) · 둘레 숲' },
  { cell: '나4', t: '하람 집', card: '사는 곳', ai: '하람이네 집 = 파란 오두막(패들렛 43) — 글에 나2·가4로 적었지만 카드·판 = 나4' },
  { cell: '나9', t: '수산물 직판장', card: '일하는 곳', fill: { k: 'work', type: 'shop', dens: 'sparse' } },
  { cell: '나10', t: '박물관', card: '모두가 쓰는 곳' },
  { cell: '나11', t: '해산물 식당', card: '모두가 쓰는 곳', fill: { k: 'work', type: 'shop', dens: 'sparse' } },
  { cell: '나12', t: '파라솔', card: '놀고 쉬는 곳', style: ['beach'], ai: '파라솔 둘(아이) + 몇 개 더 ✨' },
  { cell: '나13', t: '오리배', card: '놀고 쉬는 곳' },
  { cell: '다2', t: '행정복지센터', card: '모두가 쓰는 곳' },
  { cell: '라2', t: '유은 집', card: '사는 곳', ai: '유은이네 집 = 큰 나무 위 오두막(패들렛 40)' },
  { cell: '마1', t: '보드게임 카페', card: '놀고 쉬는 곳', items: ['1층 음식점', '2층 상점가', '3층 보드게임 카페'] },
  { cell: '마13', t: '갯벌', card: '자연', ai: '갯벌(마13·바13 갈색 종이) — 진흙 · 물웅덩이 · 게 구멍' },
  { cell: '바14', t: '인우 집', card: '사는 곳' },
  { cell: '사2', t: '뷔페', card: '모두가 쓰는 곳' },
  { cell: '사13', t: '초밥집', card: '모두가 쓰는 곳' },
  { cell: '사14', t: '마라탕', card: '모두가 쓰는 곳', ai: '앞 글자는 아이가 지움' },
  { cell: '아13', t: '펜션', card: '사는 곳', style: ['flowers'], ai: '흰 2층 펜션 여러 동 + 지붕선 반짝이 조명 + 돌담·꽃밭(패들렛 27)' },
  { cell: '아14', t: '어항', card: '모두가 쓰는 곳' },
  { cell: '자4', t: '유명 음식집', card: '일하는 곳', items: ['햄버거', '국수', '짜장면'], fill: { k: 'work', type: 'shop', dens: 'normal' }, sign: 'food' },
  { cell: '자5', t: '곤충 박물관', card: '모두가 쓰는 곳', items: ['곤충 표본 20', '(곤충 …) 6'] },
  { cell: '자6', t: '산지 식품/산지 용품 상점', card: '일하는 곳', items: ['버섯 상점 2', '약초 상점 4', '산에서 자라는 특산물'], fill: { k: 'work', type: 'shop', dens: 'normal' }, ai: '가게 수 = 카드 개수대로(버섯 2 · 약초 4)' },
  { cell: '자7', t: '수산물 시장', card: '일하는 곳', items: ['수산물 상점 4', '바다 특산물 6'], fill: { k: 'work', type: 'shop', dens: 'normal' }, ai: '가게 수 = 카드 개수대로(수산물 4 · 바다 특산물 6)' },
  { cell: '자9', t: '지원 집', card: '사는 곳', items: ['침대·책상', '마리오(카트?)', '방·주방'] },
  { cell: '자10', t: '시아 집', card: '사는 곳' },
  { cell: '자11', t: '집', card: '사는 곳', style: ['half-timber'], fill: { k: 'live', type: 'house', dens: 'normal' }, ai: '유럽 옛 마을 골목(패들렛 47 마을 차11/자11)' },
  { cell: '자12', t: '키즈 카페', card: '놀고 쉬는 곳' },
  { cell: '자13', t: '샤브샤브', card: '그 밖에' },
  { cell: '자14', t: '카페', card: '그 밖에' },
  { cell: '차2', t: '', card: '일하는 곳', fill: { k: 'work', type: 'shop', dens: 'normal' }, ai: '카드 이름 칸 빈칸(교사 확인) — 가게 줄 ✨' },
  { cell: '차8', t: '마트', card: '일하는 곳', fill: { k: 'work', type: 'shop', dens: 'normal' }, style: ['parking'] },
  { cell: '차9', t: '베라', card: '일하는 곳', ai: '아이스크림 가게(상표 이름 대신)' },
  { cell: '차11', t: '집', card: '사는 곳', style: ['half-timber'], fill: { k: 'live', type: 'house', dens: 'normal' } },
  { cell: '차12', t: '빵집', card: '그 밖에' },
  { cell: '차13', t: '상점', card: '모두가 쓰는 곳', ai: '도시 상점(패들렛 26 옷·키링·모자·인형)' },
];

// ───────── 카드 없는 칸 채우기(✨) ─────────
export const RING_FILLS = [
  ...['가3', '가4', '나2', '나5', '다1', '라1'].map(cell => ({ cell, k: 'green', type: 'forest', ai: '초록 종이 = 숲(뒷산 기슭)' })),
  { cell: '가6', k: 'live', type: 'house', dens: 'normal' }, { cell: '가7', k: 'live', type: 'apt', dens: 'dense' }, { cell: '가8', k: 'work', type: 'office', dens: 'normal' }, { cell: '가9', k: 'live', type: 'house', dens: 'normal' },
  { cell: '가13', k: 'green', type: 'beach' },
  { cell: '나6', k: 'work', type: 'office', dens: 'sparse' }, { cell: '나7', k: 'work', type: 'office', dens: 'sparse' }, { cell: '나8', k: 'live', type: 'house', dens: 'normal' },
  { cell: '마2', k: 'work', type: 'shop', dens: 'sparse' }, { cell: '바1', k: 'work', type: 'shop', dens: 'sparse' }, { cell: '바2', k: 'work', type: 'shop', dens: 'sparse', style: ['parking'] },
  { cell: '사1', k: 'green', type: 'park', style: ['parking'], ai: '빈칸 — 아쿠아리움 주차장 + 잔디' }, { cell: '아1', k: 'green', type: 'greenhouses', crop: 'strawberry', ai: '빈칸 — 논밭 옆 들이라 딸기 비닐하우스 단지로(교사 10-15 고장 개연성)' }, { cell: '아2', k: 'green', type: 'orchard', crop: 'pear', ai: '빈칸 — 논밭 옆 들이라 배 과수원으로(종이 봉지 씌운 배 · 교사 10-15 고장 개연성)' },
  { cell: '다13', k: 'green', type: 'flat', ai: '빈칸 — 바다를 막아 만든 간척지(방조제·논·산업 용지 ✨ · 또래 10-16)' }, { cell: '라13', k: 'green', type: 'flat', ai: '빈칸 — 갯벌 옆 평평한 땅 = 염전(교사 10-15 ✨)' },
  { cell: '자1', k: 'work', type: 'shop', dens: 'normal' }, { cell: '자2', k: 'live', type: 'apt', dens: 'dense' }, { cell: '자8', k: 'work', type: 'shop', dens: 'normal' },
  { cell: '차3', k: 'work', type: 'office', dens: 'sparse' }, { cell: '차4', k: 'live', type: 'house', dens: 'normal', ai: '빈칸 — 둘레 맞춰 주택가' }, { cell: '차5', k: 'green', type: 'park', ai: '빈칸 — 학교(자3) 옆 공원' },
  { cell: '차6', k: 'work', type: 'office', dens: 'sparse' }, { cell: '차7', k: 'live', type: 'house', dens: 'normal', ai: '빈칸 — 주택가' }, { cell: '차10', k: 'work', type: 'shop', dens: 'normal' }, { cell: '차14', k: 'live', type: 'house', dens: 'dense' },
];

// ───────── 자연·땅(🧱 종이 + ✨ 이어 붙임) ─────────
export const RING_NATURE = [
  // 초록 종이 = 숲(뒷산 기슭) — 둘레 왼위 열두 칸
  { id: 'rforest', k: 'forest', cells: ['가1', '가2', '가3', '가4', '나1', '나2', '나3', '나4', '나5', '다1', '다2', '라1', '라2'], ai: '초록 종이 = 숲 · 뒷산 기슭(주봉은 둘레 바깥 북서쪽으로)' },
  // 바다: 진보라 = 가14 · 나13 · 나14 · 다14 · 라14 · 마14 + 판 밖 동쪽·북동쪽 수평선까지
  { id: 'sea', k: 'sea', poly: [[275, -110], [440, -110], [440, 75], [275, 75], [275, 0], [250, 0], [250, -25], [275, -25]], far: true, shore: 'beach', name: '바다', en: 'Sea', ai: '보라 종이 칸 + 판 밖 동쪽·북동쪽(✨)' },
  // 모래사장(노란 종이): 가12 · 가13 · 나12 — 'ㄱ'자 해수욕장
  { id: 'beach', k: 'sand', poly: [[226, -50], [275, -50], [275, -25], [250, -25], [250, 0], [227, 0]], name: '해수욕장', en: 'Beach', swim: true, by: '지원·인우', ai: '노란 종이 = 모래사장 · 패들렛 14·15 수영할 수 있는 바다' },
  // 갯벌(갈색 종이): 마13 · 바13
  { id: 'mud', k: 'mudflat', poly: [...P('마13', [[0.1, 0.1], [1, 0.1]]), ...P('바13', [[1, 0.9], [0.1, 0.9]])], name: '갯벌', en: 'Mudflat', ai: '갈색 종이 = 갯벌(마14 바다와 닿음)' },
  // 강 하구: 지금 강 끝(250, 37.5) → 라13 → 라14 바다(✨)
  { id: 'river2', k: 'water', line: { pts: [[250, 37.5], [262.5, 37.5], [278, 37.5]], w: 4.4, widen: 8 }, name: '강 하구', en: 'Estuary', ai: '강이 바다로 가야 해서 라13을 지나 이어 붙임(산·강·바다 법칙)' },
  // 다12 위 연보라 종이 = 동물 쉬는 곳 연못(✨)
  { id: 'apond', k: 'water', poly: P('다12', [[0.3, 0.02], [0.75, 0.02], [0.75, 0.25], [0.3, 0.25]]), smooth: 2, name: '연못', ai: '다12 위 연보라 종이 = 동물 쉬는 곳 물웅덩이' },
];

// ───────── 소품·아이 요구(🙋 패들렛) ─────────
export const RING_PROPS = [
  { k: 'duckboat', near: '가14', n: 4, by: '유은', note: '패들렛 49 오리배 나13/가14 — 흰 오리 머리 페달 보트 + 선착장' },
  { k: 'duckboat', near: '나13', n: 3 },
  { k: 'parasol', near: '나12', n: 6 },
  { k: 'lifeguard', near: '가13', by: '지원·인우', ai: '수영 해변 안전요원 망루 + 부표 줄' },
  { k: 'windturbine', n: 5, on: 'ridge', by: '유은', note: '패들렛 18 풍력 발전기 산에 5개 정도 — 능선 위 · 천천히 돎' },
  { k: 'mushroom', kinds: ['새송이버섯', '팽나무버섯', '독우산광대버섯'], in: ['가3', '가4', '나2', '나5', '다1', '라1', '다4', '라3'], n: 10, by: '유은', note: '패들렛 16 산에 가끔 · 독우산광대버섯 가까이 = "독버섯! 만지거나 먹으면 안 돼요"' },
];

// 아이 요구 시설(기록 🙋 — ourtown fac의 ai:true를 by로 바꿀 것)
export const KID_REQ = [
  { k: 'signal', by: '지원·유은', why: '신호등이 없어서 계속 치인다(지원) · 신호등·횡단보도 넣어 주세요(유은)', rule: 'allcross', cars_obey: true },
  { k: 'crosswalk', by: '유은', rule: 'crossings' },
  { k: 'bikelane', by: '지원', why: '자전거 도로가 있으면 차랑 만날 일이 없을 것', rule: 'bigroads' },
  { k: 'weather', by: '유은', why: '날씨·온도를 알 수 있는 온도계·일기예보를 지도 밑에', ui: 'minimap-under', lapse: -0.6 },
  { k: 'bump', by: '예지·지원', why: '차에 부딪히면 3초 넘어짐 · 사람에게 부딪히면 "괜찮아?" · 사람들이랑 통과됨' },
  { k: 'bikegravity', by: '유은', why: '내리막에 멈춰 있으면 천천히 내려가고 오르막은 다시 올라가지게' },
  { k: 'sitplay', by: '시아', why: '앉거나 놀 수 있는 기능' },
  { k: 'interior', by: '유은', why: '건물 안 구경 + 안에 사람', first: ['유은 집', '하람 집', '예지 집', '지원 집', '아쿠아리움', '키즈 카페', '보드게임 카페'] },
];
