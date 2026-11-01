# 드래곤 게임 2D판(탑뷰) — 이어받기

**정본**: goal = `docs/dragon/goal_prompt.md`(저작권·수위·크롬북·클릭 금지 선 그대로) · 이야기·대사·장 순서 = `docs/dragon/design.md` §2 · 그림 약속 = `docs/dragon/art2d_contract.md`(v2 탑뷰) · 3D판 이어받기 = `docs/dragon/handoff.md`(3D판은 지우지 않고 그대로 · 메뉴 카드도 그대로).

## 왜 2D판인가 (11-01 교사)
- 3D판을 직접 해 보고: "이동이 이상하고 멀미 남 · 물통·대장간에서 할 일을 모름 · 길 찾기 귀찮음 · 메타버스 하다 이거 하니 분통" → "솔직히 잘 모르겠어 · 2D로" → (옆 스크롤로 시작했다가) **"2D 말고 포켓몬처럼 탑뷰"**.
- 그래서 정한 것: 포켓몬·스타듀밸리처럼 위에서 비스듬히 보는 탑뷰 · 칸 단위가 아니라 **부드러운 8방향 걷기**(조작감 1순위 — 칸 이동은 피하기 놀이에 굼뜸) · 카메라는 돌지도 흔들리지도 않음 · 갈 곳은 늘 ▼(화면 밖이면 가장자리 화살표 + 거리) · 할 일은 차례마다 한 줄.

## 조작 (메타버스와 같은 손 · 키 여섯 묶음 안)
| 키 | 걷기 | 날기 |
|---|---|---|
| 방향키·WASD | 8방향 걷기(4.2m/s) | ←→ 옆으로 · ↑↓ 빠르게·느리게(싸움터는 8방향) |
| Shift 누르고 있기 | 달리기(7.5m/s) | — |
| Space | 점프(0.85m · 0.52초 · 공중 = 피하기 · 내려앉고 0.45초 안에 또 뛰면 낮은 콩 = 피하기 X) | 꾹 = 꼬리 펴기(빨리 꺾임) |
| F | 짧게 = 쓰기·건네기·던지기 / 꾹 = 손 내밀기·살피기 | 쏘기 |
| C | 살금살금 켜고 끄기(1.6m/s · 화면 왼쪽 아래 글) | — |
- 서고 가기 0.08초(가속 30/초 · 멈춤 40/초) · 점프 미리 누름 0.12초 · 벽은 축마다 막아 미끄러지며 비킴 · 낮은 것(통나무)은 점프로 넘음 · 터치 화면이면 버튼 여덟.

## 파일 지도 (`dragon2d/`)
| 갈래 | 파일 | 하는 일 |
|---|---|---|
| 바탕 | `core/view.js`(화면·카메라·고정 걸음 1/60·⚡/🎨 모드·자동 해상도·성능) · `input.js` · `set.js` · `sfx.js`·`music.js`(3D판에서 옮김 · 소리 끔이 기본) | |
| 놀이 | `play/body.js`(히컵 몸) · `world.js`(타일 땅·장소 열하나·막힘·소품) · `actors.js`(배우·마음 엔진) · `flight.js`(바다 위 비행·싸움터) · `fx.js`(원소: 불 번짐·물·김·쏜 것·알갱이) | |
| 그림 | `art/actors.js`(인물 앞·뒤·옆 · 드래곤 · 위에서 본 드래곤 · 대장 — 팀) · `art/scenery.js`(타일 굽기·소품 — 팀) · 보기 판 `gallery.html` · `scenery_view.html` | 약속 = art2d_contract.md |
| 장 | `story/runner.js`(차례·힌트·다시·저장) · `kit.js`(장 손) · `ch0.js`~`ch11.js` · `save.js` | 차례 = `{ id, verb, place, time, goal, at:[x,y], face, limit, hints, run*(G), sense(G) }` |
| 화면 글 | `ui/hud.js`·`art.js`·`book.js`·`title.js`·`ending.js`(3D판에서 옮김 · 하는 법 표만 2D 키로) | |
| 봇 | `bots/bots.js`(손 mkHand · flyBot · 0~6장) · `bots7.js`(7~9장) · `bots10.js`(10~11장) | sense만 읽고 키만 |
| 시험 | `tools/harness/drg2d_story.cjs`(봇) · `drg2d_perf.cjs`(크롬북 흉내) · 캐시 `tools/dragon2d_ver.sh` | |

## 지금 상태
(마감 때 채움)

## 시험(push 전)
```
B1_MAIN=1 zsh tools/ops/b2.sh node tools/harness/drg2d_story.cjs . --dumb=0          # 0~11장 쉬움·보통 봇
B1_MAIN=1 zsh tools/ops/b2.sh node tools/harness/drg2d_story.cjs . --levels=none     # 클릭형 다섯(오래 걸림 → --ch=로 나눠서)
B1_MAIN=1 zsh tools/ops/b2.sh node tools/harness/drg2d_perf.cjs . --sec=15 --cpu=4  # 크롬북 흉내(CrOS UA · 1366×768 · CPU 4×) p95 ≤ 33ms
zsh tools/dragon2d_ver.sh                                                          # dragon2d/ 캐시 번호 한 번에
node tools/harness/check.cjs . --full  ·  PAGE=/ node tools/harness/check.cjs . --full   # v2 17/17 · 홍보판 16/17(그대로)
```
- 교사 실제 크롬북: https://chang333787-boop.github.io/school-metaverse/dragon2d/?bench=1 → 1분 기다림 → '복사' → 채팅에 붙여 넣기.
