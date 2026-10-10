// 이야기 에피소드 목록(EP-1 · 10-03 교사 '지금 것은 연습 게임 — 앞으로 새로 만들 것을 추가할 수 있게')
//   새 이야기 = ① 글 파일 하나(story_sample.js를 복사해 이름만 바꿔 고치기) ② 아래에 한 줄. 코드는 안 고쳐도 돼요 — 쓰는 법: docs/tasks/new_episode.md
//   id = 영어 소문자·숫자·_ (주소 ?game=story&ep=id) · file = 같은 폴더의 글 파일 이름 · practice = [연습] 표시 · hidden = 목록엔 안 보임(만드는 중 — 주소로만)
//   목록에 둘 이상 보이면 이야기를 시작할 때 고르는 창이 떠요. 하나뿐이면 바로 시작.
export const EPISODES = [
  { id: 'rainbow', title: '무지개 편지', icon: '🌈', practice: true, file: 'story_data.js', legacy: 'rainbow' },   // 연습 게임(예전 코드로 돌아가요 — legacy)
  { id: 'sample', title: '견본: 보건실 심부름', icon: '🩹', file: 'story_sample.js', hidden: true },
  { id: 'newbook_a', set: 'newbook', title: '신상책 보물찾기의 비밀', pick: 'AI가 빈칸을 채운 이야기', icon: '✨', file: 'story_newbook_a.js', hidden: true },
  { id: 'robotpart_a', set: 'robotpart', title: '로봇 부품 소동', pick: 'AI가 다듬은 이야기', icon: '🤖', file: 'story_robotpart_a.js', hidden: true },   // 이야기 판 1번(은규·지원·인우) — STORY-FX 10-06
  { id: 'cricket_a', set: 'cricket', title: '작아진 우리와 곤충 재판', pick: 'AI가 다듬은 이야기', icon: '🦗', file: 'story_cricket_a.js', hidden: true },   // 이야기 판 2번(예지·시아·유은)
  { id: 'world_bee', set: 'world_bee', title: '꿀벌 세계', icon: '🐝', file: 'world_bee.js', hidden: true },          // 세계 판 3번 — WORLD-FX 10-07
  { id: 'world_fruit', set: 'world_fruit', title: '과일 세계', icon: '🍒', file: 'world_fruit.js', hidden: true },    // 세계 판 4번
  { id: 'world_animal', set: 'world_animal', title: '동물 세계', icon: '🐾', file: 'world_animal.js', hidden: true }, // 세계 판 5번
  { id: 'newbook_b', set: 'newbook', title: '신상책', pick: '우리 반이 쓴 이야기 그대로', icon: '✏️', file: 'story_newbook_b.js', hidden: true },               // 새 형식 견본(목록엔 안 보임 · ?game=story&ep=sample)
];
