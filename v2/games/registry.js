// 게임 허용 목록(MAP-API-1) — ?game=<id> 는 여기 있는 것만 불러온다. id 규칙 /^[a-z_][a-z0-9_-]{0,31}$/
//   v = 그 게임 파일의 캐시 버스터(게임 파일을 고치면 여기 숫자만 올린다 — 이 파일은 로더가 매번 새로 받는다)
//   dev: true = 개발용(수용 시험) — 수업 화면 목록에는 내보이지 않는다 · promo: true = 홍보판(루트)에서만 목록에 보임(v2 우리 학교용엔 숨김 — 10-03)
//   desc = 놀이 고르기 패널(🎮 놀이)에 보이는 한 줄 설명(GAME-FIND-1) — UI 문구만(인물 대사·문항 아님)
//   TITLE-1(09-27) 오프닝 놀이 카드(js/title.js — dev 아닌 것은 자동으로 카드가 된다): icon = 카드 그림(이모지) · group = '탐험'|'대결'|'모험'|'이야기'(없으면 '놀이') ·
//     mp: 'together' = 친구와 함께 하는 놀이(카드·🎮 목록에서 '👥 친구와 함께' 칸 · 👥 표) · needRoom = 함께하기 방에 들어가야 시작(없으면 방 고르기 창)
//     short = 카드 한 줄(없으면 desc) · best = 카드에 보일 기록 {k: map.store 키, u: 's'(초 → m:ss) | 'n'(개수) | 단위 글자, lbl} — 여러 개면 앞에서부터 있는 것 하나
export const GAMES = {
  _template: { title: '게임 틀(개발용)', v: 3, dev: true },
  find_place: { title: '장소 찾기', v: 2, desc: '학교 곳곳 5곳을 차례로 찾아가요', icon: '📍', group: '탐험', short: '학교 곳곳 5곳을 빨리 찾아가요', best: { k: 'best', u: 's', lbl: '최고' } },
  watergun: { title: '물총 놀이', v: 10, desc: '혼자 과녁 연습(3분) · 청팀 vs 백팀 봇 팀 대결(운동장·컨테이너 경기장)', icon: '💧', group: '대결', short: '과녁 맞히기 · 청팀 vs 백팀 물총 대결', best: { k: 'best', u: '점', lbl: '최고' } },
  watergun_vs: { title: '물총 친구 대결', v: 10, use: 'watergun', params: { mode: 'net' }, mp: 'together', needRoom: true, desc: '같은 방 친구들과 청팀 vs 백팀 물총 대결 — 대기실에서 팀을 고르고 방장이 ▶ 시작(빈자리는 봇)', icon: '💦', group: '대결', short: '같은 방 친구들과 청팀 vs 백팀(빈자리는 봇)' },
  tour: { title: '우리 학교 견학', v: 20, promo: true, desc: '스쿨버스에서 내려 선생님·안내판을 찾아가 이야기 듣고 도장 모으기', icon: '🚌', group: '탐험', short: '선생님 이야기 듣고 도장 모으기', best: { k: 'stamps', u: 'n', lbl: '도장' } },   // TOUR-1(09-27) · 글 = tour_data.js(교사 작성 — 버스터 없이 새로고침만)
  shrink: { title: '개미가 된 나', v: 5, desc: '개미만큼 작아져 모험하는 스테이지 셋 — 🍪 교실 과자 모으기 · 🔬 과학실 대모험 · 🍽 급식실 대탈출', icon: '🐜', group: '모험', short: '개미만큼 작아져 떠나는 모험 세 판', best: [{ k: 'best3', u: 's', lbl: '3판' }, { k: 'best2', u: 's', lbl: '2판' }, { k: 'best', u: 's', lbl: '1판' }] },   // GAME-SHRINK · G3-SHRINK2(09-27): map.player.scale(1/12) + 세상 바꾸기(§16)
  escape: { title: '학교 방탈출', v: 5, desc: '[연습] 사라진 타임캡슐 열쇠 — 방마다 물건을 써서 수수께끼를 풀고, 마지막 교무실에선 순찰 로봇을 피해요(낮·밤) · 새 방탈출은 escape_episodes.js에 더해요', icon: '🔐', group: '모험', short: '[연습] 타임캡슐 열쇠 찾기 — 새 방탈출은 곧!', best: [{ k: 'best', u: 's', lbl: '최고' }, { k: 'bestNight', u: 's', lbl: '밤' }] },
  actions_demo: { title: '행동 사전 예시(개발용)', v: 3, dev: true },   // ENGINE-1: 엔진 동사를 한 번씩 — 글은 자리표시
  fx_demo: { title: '세상 바꾸기 예시(개발용)', v: 2, dev: true },   // NPC-MOVE·WORLD-FX(found2 09-27 · §16): 사람 옮기기·소품·다리·바람·불·문·칠판 그림
  story: { title: '이야기', v: 14, desc: '[연습] 무지개 편지 — 4학년이 되어 1학년 동생의 그림을 찾고, 6학년 선배의 편지를 따라 함께 놀이 날을 준비해요(약 10분) · 새 이야기는 story_episodes.js에 더해요', icon: '📖', group: '이야기', short: '[연습] 무지개 편지 — 새 이야기는 곧!' },   // G3-STORY(09-27): 이야기 RPG · 글 = story_data.js
  newbook: { title: '신상책을 찾아라', v: 14, use: 'story', params: { set: 'newbook' }, lesson: 'story', cat: 'story', desc: '4학년 이야기 — ✨ AI가 빈칸을 채운 이야기 · ✏️ 우리 반이 쓴 이야기 그대로', icon: '📚', group: '이야기', short: '✨ AI가 채운 이야기 · ✏️ 우리 반 이야기' },
  school2036: { title: '10년 뒤 학교', v: 1, lesson: 'story', cat: 'imagine', link: '../imagine/school2036/', icon: '🌱', group: '상상', short: '2036년, AI와 함께 자란 학교를 걸어 보기' },
  wizard: { title: '마법사 마을', v: 1, lesson: 'story', cat: 'imagine', link: '../imagine/wizard/', icon: '🧙', group: '상상', short: '용 키워 타기 · 구름 고래 · 날씨·변신 마법 — 신기한 일 16가지' },
  memo: { title: '메타버스 메모장', v: 6, mp: 'together', desc: '우리 이야기를 장면으로 나눠 적고(인물·대사·물건 덧붙이기) 학교 곳곳에 장면 깃발을 꽂아요 — 같은 판 친구들 것이 바로 보여요', icon: '📝', group: '이야기', short: '장면 적고 학교에 장면 깃발 꽂기' },
  memo_v3: { title: '메타버스 메모장', v: 6, mp: 'together', use: 'memo', lesson: 'story', cat: 'story', desc: '이야기를 장면으로 나눠 적고 학교 곳곳에 장면 깃발을 꽂아요', icon: '📝', group: '이야기', short: '장면 적고 학교에 장면 깃발 꽂기' },
};
