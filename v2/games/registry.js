// 게임 허용 목록(MAP-API-1) — ?game=<id> 는 여기 있는 것만 불러온다. id 규칙 /^[a-z_][a-z0-9_-]{0,31}$/
//   v = 그 게임 파일의 캐시 버스터(게임 파일을 고치면 여기 숫자만 올린다 — 이 파일은 로더가 매번 새로 받는다)
//   dev: true = 개발용(수용 시험) — 수업 화면 목록에는 내보이지 않는다
//   desc = 놀이 고르기 패널(🎮 놀이)에 보이는 한 줄 설명(GAME-FIND-1) — UI 문구만(인물 대사·문항 아님)
//   TITLE-1(09-27) 오프닝 놀이 카드(js/title.js — dev 아닌 것은 자동으로 카드가 된다): icon = 카드 그림(이모지) · group = '탐험'|'대결'|'모험'|'이야기'(없으면 '놀이') ·
//     short = 카드 한 줄(없으면 desc) · best = 카드에 보일 기록 {k: map.store 키, u: 's'(초 → m:ss) | 'n'(개수) | 단위 글자, lbl} — 여러 개면 앞에서부터 있는 것 하나
export const GAMES = {
  _template: { title: '게임 틀(개발용)', v: 3, dev: true },
  find_place: { title: '장소 찾기', v: 2, desc: '학교 곳곳 5곳을 차례로 찾아가요', icon: '📍', group: '탐험', short: '학교 곳곳 5곳을 빨리 찾아가요', best: { k: 'best', u: 's', lbl: '최고' } },
  watergun: { title: '물총 놀이', v: 5, desc: '혼자 과녁 연습(3분) · 청팀 vs 백팀 봇 팀 대결(운동장·컨테이너 경기장)', icon: '💧', group: '대결', short: '과녁 맞히기 · 청팀 vs 백팀 물총 대결', best: { k: 'best', u: '점', lbl: '최고' } },
  tour: { title: '우리 학교 견학', v: 10, desc: '스쿨버스에서 내려 선생님·안내판을 찾아가 이야기 듣고 도장 모으기', icon: '🚌', group: '탐험', short: '선생님 이야기 듣고 도장 모으기', best: { k: 'stamps', u: 'n', lbl: '도장' } },   // TOUR-1(09-27) · 글 = tour_data.js(교사 작성 — 버스터 없이 새로고침만)
  shrink: { title: '개미가 된 나', v: 5, desc: '개미만큼 작아져 모험하는 스테이지 셋 — 🍪 교실 과자 모으기 · 🔬 과학실 대모험 · 🍽 급식실 대탈출', icon: '🐜', group: '모험', short: '개미만큼 작아져 떠나는 모험 세 판', best: [{ k: 'best3', u: 's', lbl: '3판' }, { k: 'best2', u: 's', lbl: '2판' }, { k: 'best', u: 's', lbl: '1판' }] },   // GAME-SHRINK · G3-SHRINK2(09-27): map.player.scale(1/12) + 세상 바꾸기(§16)
  escape: { title: '학교 방탈출', v: 4, desc: '사라진 타임캡슐 열쇠 — 방마다 물건을 써서 수수께끼를 풀고, 마지막 교무실에선 순찰 로봇을 피해요(낮·밤)', icon: '🔐', group: '모험', short: '수수께끼를 풀어 타임캡슐 열쇠 찾기', best: [{ k: 'best', u: 's', lbl: '최고' }, { k: 'bestNight', u: 's', lbl: '밤' }] },
  actions_demo: { title: '행동 사전 예시(개발용)', v: 3, dev: true },   // ENGINE-1: 엔진 동사를 한 번씩 — 글은 자리표시
  fx_demo: { title: '세상 바꾸기 예시(개발용)', v: 2, dev: true },   // NPC-MOVE·WORLD-FX(found2 09-27 · §16): 사람 옮기기·소품·다리·바람·불·문·칠판 그림
  story: { title: '이야기: 무지개 편지', v: 4, desc: '4학년이 되어 1학년 동생의 그림을 찾고, 6학년 선배의 편지를 따라 함께 놀이 날을 준비해요(약 10분)', icon: '🌈', group: '이야기', short: '동생의 그림을 찾고 무지개 편지를 따라가요' },   // G3-STORY(09-27): 이야기 RPG · 글 = story_data.js
  hideseek: { title: '숨바꼭질', v: 6, desc: '들키면 🏠집까지 달리기! 친구 로봇을 얼음땡으로 구하거나 · 술래가 되어 도망가는 로봇을 잡아요(3라운드)', icon: '🙈', group: '대결', short: '숨고 달리기 · 얼음땡 · 술래 되기(3라운드)' },   // GAME-HS2(09-27): 쫓기기·찜·얼음땡·⚡힘·라운드 셋 · 구역 셋(서관 1층 · 운동장+큰 나무 · 급식실+동쪽 복도)
};
