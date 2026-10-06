// 게임 허용 목록(MAP-API-1) — ?game=<id> 는 여기 있는 것만 불러온다. id 규칙 /^[a-z_][a-z0-9_-]{0,31}$/
//   v = 그 게임 파일의 캐시 버스터(게임 파일을 고치면 여기 숫자만 올린다 — 이 파일은 로더가 매번 새로 받는다)
//   dev: true = 개발용(수용 시험) — 수업 화면 목록에는 내보이지 않는다 · promo: true = 홍보판(루트)에서만 목록에 보임(v2 우리 학교용엔 숨김 — 10-03)
//   desc = 놀이 고르기 패널(🎮 놀이)에 보이는 한 줄 설명(GAME-FIND-1) — UI 문구만(인물 대사·문항 아님)
//   TITLE-1(09-27) 오프닝 놀이 카드(js/title.js — dev 아닌 것은 자동으로 카드가 된다): icon = 카드 그림(이모지) · group = '탐험'|'대결'|'모험'|'이야기'(없으면 '놀이') ·
//     mp: 'together' = 친구와 함께 하는 놀이(카드·🎮 목록에서 '👥 친구와 함께' 칸 · 👥 표) · needRoom = 함께하기 방에 들어가야 시작(없으면 방 고르기 창)
//     short = 카드 한 줄(없으면 desc) · best = 카드에 보일 기록 {k: map.store 키, u: 's'(초 → m:ss) | 'n'(개수) | 단위 글자, lbl} — 여러 개면 앞에서부터 있는 것 하나
//   FOLDER-1(10-04 교사 'v2·v3 기능이 많아졌으니 폴더형식으로'): folder = v2 놀이 고르기의 폴더(아래 FOLDERS의 k · 없으면 'look') — 오프닝 메뉴는 폴더 → 그 안의 카드 · 🎮 놀이 목록은 폴더 제목으로 묶음
//     v3(lesson)는 그대로 cat 갈래(이야기·상상의 세계)
//   ROOM-1(10-05 교사 '멀티방을 만들고 그 안에서 모드를 정하는 게 직관적일까?'): room: true = 방 놀이 — 오프닝 메뉴·🎮 목록엔 안 보이고, 함께하기 방을 만든 선생님이 👥 창 '🎮 다 같이 놀이'로 고르면 방 친구 모두 그 대기실로(main.js ROOMS 번호표 — 뒤에만 더함)
export const FOLDERS = [
  { k: 'look', title: '둘러보기', icon: '🗺️', group: '탐험', short: '걸어 다니고 · 찾아가고 · 하늘에서 내려다봐요' },
  { k: 'vs', title: '대결', icon: '💦', group: '대결', short: '물총 · 숨바꼭질 · 로봇인 척 — 혼자 연습 · 친구와 대결' },
  { k: 'story', title: '이야기·방탈출', icon: '📖', group: '이야기', short: '이야기 속 주인공이 되고 수수께끼를 풀어요' },
  { k: 'make', title: '만들기', icon: '🧱', group: '놀이', short: '학교에 블록을 쌓고 가구를 부숴요' },
  { k: 'think', title: '생각 모으기', icon: '📝', group: '상상', short: '이야기 장면 · 새로운 세계를 함께 적어요' },
];
export const GAMES = {
  _template: { title: '게임 틀(개발용)', v: 3, dev: true },
  find_place: { title: '장소 찾기', folder: 'look', v: 2, desc: '학교 곳곳 5곳을 차례로 찾아가요', icon: '📍', group: '탐험', short: '학교 곳곳 5곳을 빨리 찾아가요', best: { k: 'best', u: 's', lbl: '최고' } },
  topview: { title: '하늘에서 보기', folder: 'look', v: 1, desc: '지붕을 벗기고 위에서 학교를 봐요 — 1층·2층 · 끌어서 옮기기·확대·돌리기 · 방 이름·방위표·축척 · 누르면 그곳으로 내려가기', icon: '🗺️', group: '탐험', short: '지붕을 벗기고 위에서 학교 보기 · 1층·2층' },   // TOP-1(10-04 교사 '탑뷰로 학교 보기')
  watergun: { title: '물총 놀이', folder: 'vs', v: 17, desc: '혼자 과녁 연습(3분) · 청팀 vs 백팀 봇 팀 대결(운동장·컨테이너 경기장)', icon: '💧', group: '대결', short: '혼자 연습 — 과녁 맞히기 · 봇과 팀 대결', best: { k: 'best', u: '점', lbl: '최고' } },
  hideseek: { title: '숨바꼭질 대작전', folder: 'vs', v: 11, desc: '🏃 도망자는 하늘에서 지도처럼 보고 · 👀 술래는 3인칭 — 한 판 57초 · 혼자 = 로봇과(도망자 또는 술래) · 👻 투명 · ⭐ 별 · 🔥 가까워요 · 마지막 20초 반짝', icon: '🙈', group: '대결', short: '도망자는 하늘에서 · 술래는 3인칭 — 로봇과 혼자 연습', best: [{ k: 'bestHide', u: 's', lbl: '버틴 최고' }, { k: 'bestSeek', u: 's', lbl: '잡은 최고' }] },   // HS-2(10-04 비대칭 숨바꼭질 다시 설계 — 도망자 1 vs 술래 여럿)
  hideseek_vs: { room: true, title: '숨바꼭질 대작전(친구와)', folder: 'vs', v: 11, use: 'hideseek', params: { mode: 'net' }, mp: 'together', needRoom: true, desc: '같은 방 친구들과 — 모두 한 번씩 🏃 도망자(하늘에서 봄) · 나머지는 👀 술래(3인칭) · 잡은 사람이 다음 도망자 · 빈자리는 술래 봇 · 두 판 연속 한쪽이 이기면 ⚖️ 따라잡기', icon: '🙈', group: '대결', short: '친구와 — 모두 한 번씩 도망자 · 잡은 사람이 다음 도망자' },
  robots: { title: '로봇인 척', folder: 'vs', v: 5, desc: '로봇 16대 속에 로봇인 척하는 스파이가 숨어 있어요 — 🕵️ CCTV 반장은 하늘에서 보며 📸 확인 · 🤖 스파이는 로봇처럼 걸으며 미션(E 스캔) · 혼자 = 반장(스파이 봇 둘) 또는 스파이(반장 봇)', icon: '🤖', group: '대결', short: '로봇 16대 속 스파이 찾기 — 반장·스파이로 혼자 연습', best: [{ k: 'bestCatch', u: 'n', lbl: '찾은 스파이' }, { k: 'bestMis', u: 'n', lbl: '미션' }] },   // RB-1(10-04 '너만의 창의적인 게임' ① 로봇인 척)
  robots_vs: { room: true, title: '로봇인 척(친구와)', folder: 'vs', v: 5, use: 'robots', params: { mode: 'net' }, mp: 'together', needRoom: true, desc: '같은 방 친구들과 — 모두 한 번씩 🕵️ CCTV 반장(하늘에서 봄) · 나머지는 🤖 스파이(로봇과 똑같은 몸) · 팀 ⭐ 미션 vs 📸 확인 · 두 판 연속 한쪽이 이기면 ⚖️ 따라잡기', icon: '🤖', group: '대결', short: '친구와 — 모두 한 번씩 CCTV 반장 · 나머지는 스파이' },
  guide: { title: '길잡이', folder: 'look', v: 4, desc: '운동장 지도 마을에서 보물 찾기 — 🧭 길잡이는 지도(기호·범례·방위표·축척)를 보고 "북쪽으로 2칸!" · 🚶 탐험가는 보물·함정이 안 보여요 · 혼자 = 길잡이 봇이 말해 주거나, 내 말대로 걷는 탐험 로봇', icon: '🧭', group: '탐험', short: '지도 보고 방위·칸 수로 길 알려 주기 — 보물 찾기', best: [{ k: 'bestGuide', u: '점', lbl: '길잡이' }, { k: 'bestExp', u: '점', lbl: '탐험가' }] },   // GUIDE-2(10-05 '길잡이 ㄱ' — 4학년 지도 단원: 방위·기호·범례·축척)
  guide_vs: { room: true, title: '길잡이(친구와)', folder: 'look', v: 4, use: 'guide', params: { mode: 'net' }, mp: 'together', needRoom: true, desc: '둘씩 한 팀 — 🧭 길잡이(지도) · 🚶 탐험가(운동장 지도 마을) · 판마다 역할 바꿈 · 팀마다 보물 자리가 달라요', icon: '🧭', group: '탐험', short: '둘씩 한 팀 — 지도 보고 길 알려 주기' },
  watergun_vs: { room: true, title: '물총 팀 대결(친구와)', folder: 'vs', v: 17, use: 'watergun', params: { mode: 'net' }, mp: 'together', needRoom: true, desc: '같은 방 친구들과 청팀 vs 백팀 물총 대결 — 대기실에서 팀을 고르고 방장이 ▶ 시작(빈자리는 봇)', icon: '💦', group: '대결', short: '같은 방 친구들과 청팀 vs 백팀(빈자리는 봇)' },
  tour: { title: '우리 학교 견학', folder: 'look', v: 33, promo: true, desc: '스쿨버스에서 내려 선생님·안내판을 찾아가 이야기 듣고 도장 모으기', icon: '🚌', group: '탐험', short: '선생님 이야기 듣고 도장 모으기', best: { k: 'stamps', u: 'n', lbl: '도장' } },   // TOUR-1(09-27) · 글 = tour_data.js(교사 작성 — 버스터 없이 새로고침만)
  shrink: { title: '개미가 된 나', folder: 'look', v: 5, desc: '개미만큼 작아져 모험하는 스테이지 셋 — 🍪 교실 과자 모으기 · 🔬 과학실 대모험 · 🍽 급식실 대탈출', icon: '🐜', group: '모험', short: '개미만큼 작아져 떠나는 모험 세 판', best: [{ k: 'best3', u: 's', lbl: '3판' }, { k: 'best2', u: 's', lbl: '2판' }, { k: 'best', u: 's', lbl: '1판' }] },   // GAME-SHRINK · G3-SHRINK2(09-27): map.player.scale(1/12) + 세상 바꾸기(§16)
  escape: { title: '학교 방탈출', folder: 'story', v: 5, desc: '[연습] 사라진 타임캡슐 열쇠 — 방마다 물건을 써서 수수께끼를 풀고, 마지막 교무실에선 순찰 로봇을 피해요(낮·밤) · 새 방탈출은 escape_episodes.js에 더해요', icon: '🔐', group: '모험', short: '[연습] 타임캡슐 열쇠 찾기 — 새 방탈출은 곧!', best: [{ k: 'best', u: 's', lbl: '최고' }, { k: 'bestNight', u: 's', lbl: '밤' }] },
  actions_demo: { title: '행동 사전 예시(개발용)', v: 3, dev: true },   // ENGINE-1: 엔진 동사를 한 번씩 — 글은 자리표시
  fx_demo: { title: '세상 바꾸기 예시(개발용)', v: 2, dev: true },   // NPC-MOVE·WORLD-FX(found2 09-27 · §16): 사람 옮기기·소품·다리·바람·불·문·칠판 그림
  story: { title: '이야기', folder: 'story', v: 16, desc: '[연습] 무지개 편지 — 4학년이 되어 1학년 동생의 그림을 찾고, 6학년 선배의 편지를 따라 함께 놀이 날을 준비해요(약 10분) · 새 이야기는 story_episodes.js에 더해요', icon: '📖', group: '이야기', short: '[연습] 무지개 편지 — 새 이야기는 곧!' },   // G3-STORY(09-27): 이야기 RPG · 글 = story_data.js
  newbook: { title: '신상책을 찾아라', v: 16, use: 'story', params: { set: 'newbook' }, lesson: 'story', cat: 'story', desc: '4학년 이야기 — ✨ AI가 빈칸을 채운 이야기 · ✏️ 우리 반이 쓴 이야기 그대로', icon: '📚', group: '이야기', short: '✨ AI가 채운 이야기 · ✏️ 우리 반 이야기' },
  robotpart: { title: '로봇 부품 소동', folder: 'story', v: 16, use: 'story', params: { set: 'robotpart' }, desc: '4학년 이야기(은규·지원·인우) — 방과 후 로봇코딩실에서 사라진 부품 · 똑같이 생긴 부품 두 개 · 다툼과 화해 · 부품을 끼우면 로봇이 깨어나요', icon: '🤖', group: '이야기', short: '사라진 부품 · 다툼과 화해 · 깨어나는 로봇' },
  cricket: { title: '작아진 우리와 곤충 재판', folder: 'story', v: 16, use: 'story', params: { set: 'cricket' }, desc: '4학년 이야기(예지·시아·유은) — 숲놀이터 해먹의 귀뚜라미 · 개미만 해진 우리 · 사마귀에게 쫓기기 · 곤충 재판소 · 곤충의 한살이', icon: '🦗', group: '이야기', short: '개미만 해진 우리 · 곤충 재판 · 한살이' },
  school2036: { title: '10년 뒤 학교', v: 1, lesson: 'story', cat: 'imagine', link: '../imagine/school2036/', icon: '🌱', group: '상상', short: '2036년, AI와 함께 자란 학교를 걸어 보기' },
  wizard: { title: '마법사 마을', v: 1, lesson: 'story', cat: 'imagine', link: '../imagine/wizard/', icon: '🧙', group: '상상', short: '용 키워 타기 · 구름 고래 · 날씨·변신 마법 — 신기한 일 16가지' },
  blocks_solo: { title: '블록 놀이(혼자)', folder: 'make', v: 8, use: 'blocks', params: { solo: true }, desc: '🏠 나만의 판에서 혼자 블록을 쌓고 가구·나무를 부숴요 — 이 기기에 저장돼요', icon: '🧱', group: '놀이', short: '혼자 블록 쌓기 · 이 기기에 저장' },
  blocks: { title: '블록 놀이(같이)', folder: 'make', v: 8, mp: 'together', desc: '같은 판 친구들과 학교 곳곳에 블록을 놓고 부숴요 — 책상·책장 같은 가구도 🔨로 통째로 퍽! 친구들 블록이 바로 보여요(선생님이 판 잠그기·비우기)', icon: '🧱', group: '놀이', short: '같은 판 친구와 블록 쌓기 · 가구 부수기' },
  memo: { title: '메타버스 메모장', folder: 'think', v: 28, mp: 'together', desc: '우리 이야기를 장면으로 나눠 적고(인물·대사·물건 덧붙이기) 학교 곳곳에 장면 깃발을 꽂아요 — 같은 판 친구들 것이 바로 보여요', icon: '📝', group: '이야기', short: '장면 적고 학교에 장면 깃발 꽂기' },
  memo_world: { title: '세계 만들기', folder: 'think', v: 28, use: 'memo', params: { kind: 'world' }, mp: 'together', desc: '우리가 상상한 새로운 세계를 함께 쌓아요 — 어떤 세계·규칙·사는 존재·장소(새 세계의 어디쯤)·신기한 것·할 일을 카드로 · 선생님이 정리해 Claude에게 넘기면 진짜 세계가 돼요', icon: '🌍', group: '상상', short: '새로운 세계를 함께 상상해 카드로 쌓기' },
  world_v3: { title: '우리가 만드는 세계', v: 28, use: 'memo', params: { kind: 'world' }, mp: 'together', lesson: 'story', cat: 'imagine', desc: '새로운 세계를 함께 상상해요 — 세계·규칙·사는 존재·장소·신기한 것·할 일', icon: '🌍', group: '상상', short: '세계관을 함께 상상해 카드로 쌓기' },
  memo_v3: { title: '메타버스 메모장', v: 28, mp: 'together', use: 'memo', lesson: 'story', cat: 'story', desc: '이야기를 장면으로 나눠 적고 학교 곳곳에 장면 깃발을 꽂아요', icon: '📝', group: '이야기', short: '장면 적고 학교에 장면 깃발 꽂기' },
};
