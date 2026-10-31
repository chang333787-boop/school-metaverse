# 드래곤 게임 — 이어받기 (단계마다 고침)

정본 = `docs/dragon/goal_prompt.md`(교사 10-31 "진행하자"로 승인 · §9 열두 조건이 끝 조건) · 설계 = `docs/dragon/design.md`(v2.1 + §17 단계 3에서 정한 것 · 장 번호는 설계 기준 — goal의 '1~5장' = 설계 '1~6장') · 사실 = `docs/dragon/reference.md` · 팀 약속(장소·모델·비행 계약) = `docs/dragon/stage3_plan.md`.

## 지금 상태 (2026-10-31 밤 · 단계 3 수직 조각 2~6장 놀 수 있음)
- ✅ 단계 0 조사 · ✅ 단계 1 설계 v2.1 · ✅ 단계 2 바탕(결 시안 A 확정 — design §17-1)
- ✅ **단계 3 수직 조각 = 2~6장**(설계 기준) — 첫 화면(학년 1~6 · 저장 칸 셋 · 장 줄 · 선생님 장 고르기) → 장마다 차례 → 장 끝에 저장·다음 장
  - 2장 회의 횃불(걸으며 듣기) · 안개 숲 추적(손그림 지도 · 단서 · 꼬리날개 조각) · 묶인 나이트 퓨리(숨 고를 때만 밧줄) · 저녁 집
  - 3장 선착장 배웅(진눈깨비) · 그롱클(방패 소리 · 여섯 발) · 코브 숨어 그리기 · 밤 회관 드래곤 책 점 잇기
  - 4장 내더 미로 · 노 박자 배 + 낚시 · 칼 내려놓기·생선·이름 · 반 토막 · 모래 그림 → 코가 손바닥에
  - 5장 망루 바람 속 횃불 · 대장간(자르기·바람 시험·망치) · 뱀장어 질겁·꼬리 살피기(첫 치유) · 첫 들림 → 첨벙 · 지플백(물통·뱀장어)
  - 6장 안장 바느질·꼬리날개 무늬 · 코브 연습 비행 · 발견 셋(풀·턱 밑·빛 점) · 훈련장 셋 진정 · 스토이크 귀환(배 고치기) · 첫 바다 비행(쪽지가 날아감) · 돌기둥 점심(테러 입 안 불·다친 테러 치유)
  - 쉬움에서 빠지는 도전(design §8) = 3①·4①·4④·5⑤ → 책 한 쪽(그림 + 한 줄)
- **봇 시험**(`tools/harness/drg_story.cjs` · `?turbo=8` · 입력만): 2~6장 모든 차례를 쉬움 봇·보통 봇이 깸 · 가만히·F 연타·F 누른 채·Space 연타·W 누른 채 F 연타 봇은 도전을 못 깸(결과 = 아래 표 · 마지막 돌린 값)
- **크롬북 흉내**(`tools/harness/drg_perf.cjs` · CrOS UA · 1366×768 · CPU 4× · ⚡): 장소 여섯 p95 17~19ms · 그리기 ≤ 53 · 삼각형 ≤ 25만 · 장소 열 번 오가기 힙 +0.0MB(마지막 값 = design §17)
- 아직 v2 메뉴에 연결하지 않았다(완성 전) · `noindex` · 홍보판·v2 안 건드림(기준선 v2 17/17 · 홍보판 16/17 그대로)

## 파일 지도(dragon/js)
| 갈래 | 파일 | 하는 일 |
|---|---|---|
| 바탕 | `core/` gfx·input·loop(`?turbo`)·rng·noise·debug(`DRG` · sense)·**stage**(무대 그릇)·**sfx**(합성 소리 · 기본 끔) | |
| 결 | `look/kit.js`(toon · 때 아홉 · createEnv · flameMesh·glowSprite · SHARED) · `props.js`(마을 소품 · W1) · `nature.js`(숲·바위·물 · W2) · `models.js`·`dragon_rig.js`·`human_rig.js`(M) | |
| 장소 | `places/` village·hall·arena(W1) · forest·cove(W2) · sea(F) · `_stub.js`(자리표시) | 계약 stage3_plan §2·§3 |
| 놀이 | `play/` walker·collide(벽 선분 8m 격자)·**mind**(마음 엔진)·**actors**(드래곤·사람 배우)·flight·boat(F) | |
| 화면 글 | `ui/` hud(지금 할 일·하는 법·그림 말풍선·힌트·F 표시·배너·덮개)·art(손그림 얼굴·물건·키)·book(드래곤 책·그리기)·map(손그림 지도)·bench(작업대 박자)·title(첫 화면) | |
| 장 | `story/` runner(차례 생성기·힌트 단계·다시 하기·저장)·ch2~ch6·fx(손에 든 것·모래 선·물보라)·flysense·save | |
| 봇 | `bots/story_bots.js`(차례마다 · A* 길 찾기) · `flight_bot.js`(F) | sense만 읽고 키만 |
| 장면 | `stages/game.js`(본판 · `?ch=&step=&diff=` · `?bench=1`) · place_view(`?scene=place&p=`) · keyframe(`?scene=key&k=1~6`) · flight_test(`?scene=fly`) · walk_test · `scenes/silhouette.js`(`?scene=sil` · M) | |

## 다음 할 일 — 단계 4 끝까지 잇기(설계 1·7~10장 · 오프닝 · 종장 → 완성도 3)
1. **선생님 크롬북 `?bench=1` 받기**(채팅으로 요청함): 결과 줄이 오면 design §13 판정에 '실기기 값'으로 적고 예산을 넘는 장소부터 줄이기
2. 오프닝(30초 직접 몰기) → 1장 습격의 밤(원소 엔진 첫 쓰임: 지붕 불 번짐·물통 줄) — 마을 `variant: 'charred'`는 이미 있음
3. 7~10장 · 종장 — 같은 틀(장소 계약 + 차례 생성기 + 봇)로. 둥지 섬 장소·구름(숨기)·드래곤 떼(인스턴스)·대장 드래곤은 새로
4. 원소 엔진(design §3-2) — 지금은 장마다 규칙을 그 자리에서 씀(17-3 표) → 1장에서 칸 표·이웃 표로 묶기
5. 소리: 합성 소리가 원인 자리에 몇 군데만 걸림 → 장마다 짝 신호와 함께 넓히기 · 곡(북·피리·현)
6. 남은 손질: 4장 칼을 끌어 물에 던지는 덤 길 · 6장 훈련장 셋 보통 봇 40초(사람은 더 걸림 — 실제 아이 시험으로 틈 2.2초 확인) · 숲 부러진 나무 윗동이 납작함(W2 남김) · 마을 rim이 낮은 시선에서 바닥을 띄움(W1 남김)

## 시험(push 전)
```
zsh tools/dragon_ver.sh                                  # dragon/ 캐시 번호 한 번에
B1_MAIN=1 zsh tools/ops/b2.sh node tools/harness/drg_perf.cjs . --sec=12   # 바탕 + 장소 여섯 흉내 표 + 힙
B1_MAIN=1 zsh tools/ops/b2.sh node tools/harness/drg_story.cjs . --dumb=0  # 2~6장 쉬움·보통 봇(약 25분)
B1_MAIN=1 zsh tools/ops/b2.sh node tools/harness/drg_story.cjs . --levels=none   # 클릭형 봇 다섯(약 1시간)
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
