// 게임 허용 목록(MAP-API-1) — ?game=<id> 는 여기 있는 것만 불러온다. id 규칙 /^[a-z_][a-z0-9_-]{0,31}$/
//   v = 그 게임 파일의 캐시 버스터(게임 파일을 고치면 여기 숫자만 올린다 — 이 파일은 로더가 매번 새로 받는다)
//   dev: true = 개발용(수용 시험) — 수업 화면 목록에는 내보이지 않는다
//   desc = 놀이 고르기 패널(🎮 놀이)에 보이는 한 줄 설명(GAME-FIND-1) — UI 문구만(인물 대사·문항 아님)
export const GAMES = {
  _template: { title: '게임 틀(개발용)', v: 3, dev: true },
  find_place: { title: '장소 찾기', v: 2, desc: '학교 곳곳 5곳을 차례로 찾아가요' },
  watergun: { title: '물총 놀이', v: 2, desc: '운동장에서 물풍선·장난감 불·꽃·로봇에 물을 쏴요(3분)' },
  tour: { title: '우리 학교 견학', v: 3, desc: '스쿨버스에서 내려 선생님·안내판을 찾아가 이야기 듣고 도장 모으기' },   // TOUR-1(09-27) · 글 = tour_data.js(교사 작성 — 버스터 없이 새로고침만)
  shrink: { title: '개미가 된 나', v: 3, desc: '개미만큼 작아져서 책상·교탁·창턱을 올라 과자 부스러기 8개를 모아요' },   // GAME-SHRINK: map.player.scale(1/12)
  escape: { title: '학교 방탈출', v: 3, desc: '방마다 단서를 모아 번호 자물쇠를 풀고, 마지막 방에선 순찰 로봇을 피해 탈출해요(낮·밤)' },
  actions_demo: { title: '행동 사전 예시(개발용)', v: 3, dev: true },   // ENGINE-1: 엔진 동사를 한 번씩 — 글은 자리표시
  fx_demo: { title: '세상 바꾸기 예시(개발용)', v: 2, dev: true },   // NPC-MOVE·WORLD-FX(found2 09-27 · §16): 사람 옮기기·소품·다리·바람·불·문·칠판 그림
  hideseek: { title: '숨바꼭질', v: 3, desc: '술래 로봇을 피해 숨거나(2분) · 숨은 로봇 5개를 찾아요(3분)' },   // GAME-HS: 두 놀이 · 구역 셋(서관 1층 · 운동장+큰 나무 · 급식실+동쪽 복도)
};
