# 드래곤 게임 — 이어받기 (단계마다 고침)

정본 = `docs/dragon/goal_prompt.md`(교사 10-31 "진행하자"로 승인 · §9 열두 조건이 끝 조건) · 설계 = `docs/dragon/design.md`(v2.1 + §17 단계 3에서 정한 것 · 장 번호는 설계 기준 — goal의 '1~5장' = 설계 '1~6장') · 사실 = `docs/dragon/reference.md` · 팀 약속(장소·모델·비행 계약) = `docs/dragon/stage3_plan.md`.

## 지금 상태 (2026-10-31 밤 · 단계 4 끝까지 잇기 끝 · v2 메뉴 연결)
- ✅ 단계 0 조사 · ✅ 단계 1 설계 v2.1 · ✅ 단계 2 바탕(결 시안 A 확정 — design §17-1) · ✅ 단계 3 수직 조각(2~6장)
- ✅ **단계 4 끝까지 잇기** — 오프닝(장 0) → 1~10장 → 종장(장 11) → 엔딩(요구 39줄 '이 생각은 여기에' · 영화에서 더 볼 장면 셋) 모두 놀 수 있음
  - 팀 A 오프닝·1장 습격의 밤·종장 + 원소 엔진(`play/elements.js`) · 팀 B 7장·9장 · 팀 C 8장 + 구름·오로라·드래곤 떼 · 팀 D 10장 + 둥지 섬(다섯 차림) + 대장 드래곤(모델·상태 기계)
- **v2 메뉴 연결**: `v2/games/registry.js`의 `dragon`(싱글플레이 → 이야기·방탈출 · 다른 페이지 링크) · 홍보판엔 카드가 없음(메뉴 판이 숨겨짐)
- **봇 시험**(`drg_story.cjs` · turbo 4 · 입력만): 0~11장 모든 차례를 쉬움 봇·보통 봇이 깸 · 클릭형 봇 다섯(가만히·F 연타·F 누른 채·Space 연타·W+F 연타)은 도전마다 못 깸(2~6장 메인 135판 · 0·1·11장·7·9장·8장·10장은 팀 시험)
- **시간**(봇 놀이 시간 · design §17-9): 오프닝~6장 쉬움 15.7분 × 1.5 = 23.5분(30분 안 ✓) · 전체 쉬움 37분 · 보통 45분(× 1.5 ≈ 67분 — goal '40~60분'보다 조금 김)
- **크롬북 흉내**(`drg_perf.cjs` · CPU 4× · ⚡): 장소 열(마을 밤·회관·훈련장·숲·코브·바다·둥지 해변·분화구·안개·물속) p95 17.3~18.4ms · 그리기 ≤ 55 · 삼각형 ≤ 23.2만 · 장소 열 번 오가기 힙 +0.0MB · 놀이 중 가장 무거운 자리 = 1장 지붕 불(그리기 92 · 삼각형 28.8만 · 팀 A) · 10장 해변 싸움(71 · 23.8만)
- **40분 쉬지 않는 놀이**(`drg_long.cjs`): design §17-9에 기록
- 아직 실제 크롬북 값 없음(흉내 값) · 선생님께 `?bench=1` 부탁함

## 파일 지도(dragon/js)
| 갈래 | 파일 | 하는 일 |
|---|---|---|
| 바탕 | `core/` gfx·input·loop(`?turbo`)·rng·noise·debug(`DRG` · sense)·**stage**(무대 그릇)·**sfx**(합성 소리 · 기본 끔) | |
| 결 | `look/clouds.js`·`aurora.js`(C) · `look/kit.js`(toon · 때 아홉 · createEnv · flameMesh·glowSprite · SHARED) · `props.js`(마을 소품 · W1) · `nature.js`(숲·바위·물 · W2) · `models.js`·`dragon_rig.js`·`human_rig.js`(M) | |
| 장소 | `places/` village·hall·arena(W1) · forest·cove(W2) · sea(F) · nest(D · beach·fog·under·after·crater) · `_stub.js` | 계약 stage3_plan §2·§3 · 장소마다 제 씨앗(마을 = 1656844137) |
| 놀이 | `play/` walker·collide·**mind**(마음 엔진)·**actors**·flight·boat(F)·**elements**(원소 엔진 · A)·flock(드래곤 떼 · C)·boss(대장 · D) | |
| 화면 글 | `ui/` ending(엔딩·크레딧) · hud(지금 할 일·하는 법·그림 말풍선·힌트·F 표시·배너·덮개·읽어 주기)·art(손그림 얼굴·물건·키)·book(드래곤 책·그리기)·map(손그림 지도)·bench(작업대 박자)·title(첫 화면) | |
| 장 | `story/` runner(차례 생성기·힌트 단계·다시 하기·저장)·ch0(오프닝)~ch11(종장)·fx·fx1(1장)·fx79(7·9장)·flysense·save | |
| 봇 | `bots/story_bots.js`(몸 K · A* 길 찾기 · 2~6장) · `ch0/1/7/8/9/10/11_bots.js`(장마다) · `flight_bot.js`(F) | sense만 읽고 키만 |
| 장면 | `stages/game.js`(본판 · `?ch=&step=&diff=` · `?bench=1`) · place_view(`?scene=place&p=`) · keyframe(`?scene=key&k=1~6`) · flight_test(`?scene=fly`) · walk_test · `scenes/silhouette.js`(`?scene=sil` · M) | |

## 다음 할 일 — 단계 5 장마다 다듬기(1·7~10장·종장 → 완성도 5) · 단계 6 시험(§9)
1. **선생님 크롬북 `?bench=1` 결과**가 오면 design §13 판정에 '실기기 값'으로 적고, 예산을 넘는 장소부터 줄이기(1장 지붕 불 · 10장 해변이 가장 무거움)
2. 팀이 남긴 '메인이 고칠 것'(이 아래 표) — 비행 엔진에 상승 기류(`world.updrafts`)·바깥 힘·쏘기 갈고리 · `art.js` HOWTO에 장마다 런타임으로 넣는 표(cling8·glide8·flock8·sniff8·point10·mark10·boss10·boss10e·dive10) 옮기기 · `dragon_rig` SPEC에 boss · 사람 자세 `lie` · 마을 'charred'는 실제 탄 집만(`G.flags.burnt`) · 바다 셰이더 안개 색(sRGB/선형 · 밤에 바다가 뜸) · 훈련장 그물에 구멍(9장) · 실루엣 장면에 대장
3. 길이: 7-5 짐 모으기 · 9-7 친구 잇기 · 8-5 둥지가 봇 2분 넘음 → 아이 시험으로 줄일지 정하기
4. 소리: 합성 소리가 원인 자리에 걸린 곳 넓히기 · 곡(북·피리·현) · 휘파람(방향) 소리
5. 눈높이 시험(§9-8): 1·3·6학년 역할로 장마다 첫 10초 · 막힌 곳 0 — 화면 사진 + 역할 에이전트
6. 종장 또 하기 넓히기(빼는 차례 1번에서 뺀 것: 스콜드런 · 다친 야생 드래곤 · 날씨 날 · 이웃 둘 · 배 타기)

## 시험(push 전)
```
zsh tools/dragon_ver.sh                                  # dragon/ 캐시 번호 한 번에
B1_MAIN=1 zsh tools/ops/b2.sh node tools/harness/drg_perf.cjs . --sec=12   # 바탕 + 장소 여섯 흉내 표 + 힙
B1_MAIN=1 zsh tools/ops/b2.sh node tools/harness/drg_story.cjs . --dumb=0  # 0~11장 쉬움·보통 봇(약 1시간 · turbo 4)
B1_MAIN=1 zsh tools/ops/b2.sh node tools/harness/drg_story.cjs . --levels=none   # 클릭형 봇 다섯(장마다 · 오래 걸림 → --ch=로 나눠서)
B1_MAIN=1 zsh tools/ops/b2.sh node tools/harness/drg_long.cjs . --min=40   # 40분 쉬지 않는 놀이(CPU 4× · fps·힙)
B1_MAIN=1 zsh tools/ops/b2.sh node tools/harness/drg_fly.cjs .             # 비행·배(F)
node tools/harness/check.cjs . --full  ·  PAGE=/ node tools/harness/check.cjs . --full   # v2 17/17 · 홍보판 16/17
```
- 다른 세션이 main에 자주 push하니 `git pull --rebase` 뒤 push.

## 일하는 법 메모
- **장 하나 더하기**: `story/ch<n>.js`에 `export const chapter = { id, title, sub, steps }` · 차례 = `{ id, verb, place, time, at|atNew, goal, easy, limit, hints:{1,2}, run: function*(G, C), sense(G, C) }` · `run`은 걸음마다 `yield`(dt를 받음) · 끝 = `return true` · 실패 = `return 'retry'`(5초 안에 같은 자리) · 배우는 `G.dragon(kind, at, o)`/`G.person(who, at, o)`(차례가 끝나면 치움 · `keep:'tl'`이면 장소가 바뀔 때까지) · 그 차례 봇 = `bots/story_bots.js`의 `BOTS[id]`.
- **봇 규칙**: `DRG.sense()`만 읽음 · 반응 늦음 쉬움 0.6초 · 보통 0.35초(손·눈 움직임 = 지금 화면 `K.cur`, 무엇을 할지 = 늦은 화면) · 초당 6타 · 동시 키 셋. 화면에 안 보이는 것은 sense에 넣지 않는다(땅 높이로 보이는지 판정).
- **장소 더하기**: stage3_plan §2 계약 · `?scene=place&p=<이름>&time=&marks=1`로 걸어 보기(G = 자유 카메라).
- **모델 다시 짓기**: `tools/dragon_blender/`(M 보고 참고) → gltfpack(`npm install --prefix <임시> gltfpack@0.22.0`).
- **캐시**: `zsh tools/dragon_ver.sh` 한 번이면 dragon/ 전체 `?v=`가 같은 번호. 홍보판·v2는 건드리지 않는다.
- **팀 운영(10-31)**: 팀 넷(M 모델 · F 비행·바다 · W1 마을 · W2 자연)이 각자 worktree → 메인이 맡은 파일만 `git checkout <가지> -- <파일>`로 가져와 합침. 팀 worktree가 origin/main에서 시작되면 단계 3 준비 파일이 없으니 지시문에 '로컬 main 기준'을 적을 것.
- **사용량**: 10-31 밤 기준 주간 20% 안팎 · 깰 때마다 `get_usage` · 80%에서 멈춤.

## 교사에게 물어 둔 것 (답이 오기 전엔 기본값)
- goal §1 교사 결정 다섯(판 2010 · 원작 이름 쓰기 + 비상업 표시 · 제목 「버크의 드래곤 친구」 · 크레딧 '4학년 친구들' · 느낀 점 문장)
- reference 끝 '선생님이 영화로 확인할 것' 열
- **크롬북 `?bench=1`**: https://chang333787-boop.github.io/school-metaverse/dragon/?bench=1 → 1분 기다림 → Shift+Space 한 번 → '복사' → 채팅에 붙여 넣기
