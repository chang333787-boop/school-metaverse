# 새 이야기 · 새 방탈출 더하기 (EP-1 · 10-03)

지금 있는 것은 **연습 게임**이에요 — 이야기 `무지개 편지`, 방탈출 `사라진 타임캡슐 열쇠`.
새 에피소드는 **글 파일 하나 + 목록 한 줄**로 더해요(코드 수정 없음). 목록에 둘 이상 보이면 게임을 시작할 때 고르는 창이 떠요.

| | 목록 파일 | 견본(복사해서 시작) | 주소로 바로 열기 |
|---|---|---|---|
| 이야기 | `v2/games/story_episodes.js` | `v2/games/story_sample.js` | `v2/?game=story&ep=<id>` |
| 방탈출 | `v2/games/escape_episodes.js` | `v2/games/escape_story.js` | `v2/?game=escape&ep=<id>` |

목록 한 줄: `{ id: 'snowday', title: '눈 오는 날', icon: '⛄', file: 'story_snowday.js', hidden: true }`
- `id` 영어 소문자·숫자·`_` · `file` 같은 폴더의 글 파일 · `practice: true` = [연습] 표시 · `hidden: true` = 목록엔 안 보이고 주소로만(만드는 중)
- 기록(최고 시간)은 에피소드마다 따로 저장돼요.
- 글 파일은 매번 새로 읽어요(캐시 번호 필요 없음 — 새로고침만).

## 이야기 글 파일(`steps`) — 위에서 아래로 한 칸씩 진행
```js
export const WHO = { '나': '✏️', '보건선생님': '🩹' };          // 말하는 이 → 그림
export const STORY = {
  title: '…', chapters: ['', '1장 · …'],
  start: { at: 'grade4', h: 270 },                                  // 시작 자리 · 바라보는 방위(0 북 90 동 180 남 270 서)
  steps: [
    { say: [['이야기', '…'], ['보건선생님', '…']] },                   // 대화(여러 줄)
    { chapter: 1 },                                                  // 장 바꾸기(배너)
    { goal: '보건실로 가요', go: 'nurse', label: '보건실' },            // 그곳에 닿으면 다음
    { talk: '보건선생님', goal: '말 걸기', say: [[…]] },               // 그 사람 앞에서 E → 대화
    { ask: ['나', '어떻게 할까?'], choices: ['🏃 A', '🤔 B'], set: 'how', reply: [[[…]], [[…]]] },   // 선택(글 안 {how} = 고른 보기)
    { if: { how: 0 }, then: [ …steps ], else: [ …steps ] },          // 고른 것에 따라 갈림
    { collect: ['library', [-23.5, -40.5]], n: 2, item: '상자', icon: '📦' },   // 여러 곳 줍기
    { note: '쪽지 글' }, { toast: '알림 글' }, { wait: 1 },
    { world: [{ op: 'light', room: '과학실', on: false }] },          // 세상 바꾸기(map_api §12.7 op — 사람 옮기기·불·문·칠판 글씨…)
    { end: { title: '끝!', body: '…' } },
  ],
};
```
자리 쓰는 법: 구역 id(`grade4`·`nurse`·`library`·`gym`… — `SD2.map.zones`) · `'lm:표지점'` · `'npc:사람 이름'` · `[x, z]` · `[x, y, z]`

## 방탈출 글 파일 — `escape_story.js` 형식 그대로
방 순서(`rooms[]`)마다 `zone`(구역 이름) · `puzzle`(`color`·`book`·`uv`·`projector`·`stealth` 중 하나) · `teacher` · `key` · 쪽지·칠판 글·힌트·`enter`/`solved` 장면.
새 수수께끼 **종류**가 필요하면 `escape.js`(`PUZ`)에 코드가 필요해요.

## 글 규칙(공개 저장소)
- 실제 학생 이름을 대사에 쓰지 않아요 — 학생은 '나' 또는 이름 없는 역할('반 친구'·'1학년 동생'), 선생님은 직함으로.
- 실제 학교에 대한 사실을 지어내지 않아요. 4학년 눈높이 · 무섭지 않게.
