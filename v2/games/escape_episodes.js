// 방탈출 에피소드 목록(EP-1 · 10-03 교사 '지금 것은 연습 게임 — 앞으로 새로 만들 것을 추가할 수 있게')
//   새 방탈출 = ① 글 파일 하나(escape_story.js를 복사해 이름만 바꿔 고치기 — 방 순서·구역·수수께끼 종류·쪽지·힌트) ② 아래에 한 줄. 쓰는 법: docs/tasks/new_episode.md
//   수수께끼 종류는 지금 있는 5가지(color·book·uv·projector·stealth)를 골라 써요 — 새 종류는 escape.js에 코드가 필요해요.
//   id = 영어 소문자·숫자·_ (주소 ?game=escape&ep=id) · file = 같은 폴더의 글 파일 · practice = [연습] 표시 · hidden = 목록엔 안 보임(만드는 중 — 주소로만)
export const EPISODES = [
  { id: 'timecapsule', title: '사라진 타임캡슐 열쇠', icon: '🔑', practice: true, file: 'escape_story.js' },   // 연습 게임
];
