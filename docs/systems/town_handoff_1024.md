# 이어받기(10-24 저녁 · 메인 세션 바꿈) — 새 메인 세션은 이 쪽부터 읽어요

**정본 차례** = `docs/systems/town_week_1024.md`의 '★ 이번 주 확정 차례' 표(바닥선) → 그다음 '이어서' 열 줄. 근거는 `docs/systems/town_codex_1024.md`(코덱스 종합 검토)예요.

**⚠️ 10-25 11:50 — 예약 세션(11:01)이 권한 창에서 멈춰 있어 원래 메인 세션(52a18de9)이 다시 맡았어요. 예약 세션이 나중에 풀리면 코드는 고치지 말고 끝내요(겹침 X).**

## 지금 상태(10-25 01:3x · main = 0fcb70e · 주간 54% · 멈춤선 80%(75% 알림 · 78% 새 일 멈춤 · 사용자 10-24 18:05 'ㄱㄱ'))
- 10-24 밤 세션이 올린 것: a8fbd9e 진행 손실 막기·table1b·J 두 단추·보물 지도 단추 · 3e3172e 일 시간(HOURS-1) · 9421124 까망봉·층층골 + 벤치 보상 창 · a675ada 행정복지센터 고장 신고(확정 5) · dfe684f 산불 감시(이어서 ②) · 706cf53 썰물섬(이어서 ①) · 0fcb70e 첫 30분 손맛 다섯(이어서 ④)
- 확정 차례 1~5 ✅ · 이어서 ①②③④ ✅
- 이어서 ③ 빈 건물 ✅(BLDG-1 · 경찰서·병원·동물보호센터 · 자전거 등록 스티커는 아직) · 기다리는 패치 없음
  - scratchpad = /private/tmp/claude-501/-Users-dobuk-Projects-school-metaverse/52a18de9-e78e-4006-be4f-f54f6909d405/scratchpad · 합치기 폴더 = 그 안 `m1`(detached · `git fetch && git checkout --detach origin/main` 뒤 `git add` → `git apply -3`)
  - town_indoor.cjs는 고침 전에도 몇 번째 방부터 몸이 안 움직여 실패(시험 쪽 문제로 보임 · 확인할 것)
- 다음(이어서 남은 것): ⑤ 땅 결 숲·보도 한 종류(town_art3.md) → ⑥ 높은 곳 보기 + 숨은 놀람(town_explore.md 30) → ⑦ 칸 키트 넓히기(학교 둘레 → 시내) → ⑧ 은행·우체국 창구(town_fix.js 창구 꼴) → ⑨ 밀물 구조·길 잃은 동물(town_emerg 사건 표 10·12) → ⑩ 스키 기문(town_explore.md 34)
- 그다음 미룬 것(사용자 10-24 18:05 차례): 도전 사다리·내 최고 기록 → 모든 동작 반응 넓히기 → 빈 건물·직업 나머지 → 가벼운 재미(꾸미기·선물 · 친구 거래·서버 규칙 X) → 탐험 체력(scratchpad 옛 a063b03f…/patches/day_stam.patch + 실패 고치기) → 이웃 일과·먹이·물 연쇄
- 10-25 낮(원래 세션이 다시 맡은 뒤) 올린 것: d5ff0e7 배 칸 시험 · 8c3d4d2 버스 갈아타기 카메라(FIX-BUS9 · town_busx) · d94d47b 땅 결 숲·보도(이어서 ⑤) · 3c99926 높은 곳 보기·숨은 놀람 열셋(이어서 ⑥) · 팀 짓는 중: ⑦ 칸 키트 넓히기(scratchpad/kit2.patch) · ⑧ 은행·우체국(scratchpad/bank1.patch)
- 긴 묶음(10-25 낮): town_cap 통과 · town_state --story = '승급 미션 × 날씨 창 → 비'에서 한 번 몸 멈춤(멈춤 건 곳 rank start 창 + lvReward 창) — 그 칸만 다시 돌리면 통과 · 드문 타이밍(보상 창이 끼어듦) · 다음에 lvReward가 다른 창이 막 닫힌 1초 안이면 미루게 보기 · 소방차 탐 칸은 시험 쪽에서 '안 탐'(skip)
- 남은 작은 것: town_state 배 칸 '배 E로 안 탐'(고침 전에도 같음 · 하네스 쪽인지 먼저 확인) · 갈아탄 정류장 카메라(재현 시험부터) · 앉기 시험 22번째 타이밍 · 썰물섬 위 알림 셋이 한꺼번에 · 섬 겨울색 X · 도장·지갑 연출 그림 켠 캡처 X · 강·연못 물 재질 밤에 납작한 파랑
- 새 시험(이 세션): town_save(node) · town_jq · town_hours · town_xp · town_isle · town_fix · town_feel · town_xpshot(그림 켬 캡처 · V 배열만 바꿔 씀)
- 일하는 꼴(이 세션에서 잘 된 것): 팀 둘을 파일이 안 겹치게 동시에 · 팀 끝 → m1에서 apply -3 → 캐시(바뀐 모듈 ?v= · 그 모듈을 부르는 모듈도 · registry town v) → gm.sh로 check·홍보판·그 기능 → 필요하면 town_xpshot 캡처 한 번 → push → 채팅 보고

## 일하는 법(사용자 말 + 코덱스 §4 · 꼭 지킴)
- **주간 80%에서 멈춰요(78% 새 일 멈춤). 75%에서 알려요.** 줄마다 실제로 쓴 %를 `town_week_1024.md` '실제' 칸에 적어요. 표는 바닥선이라 끝내도 68%까지 '이어서'를 계속해요.
- 팀은 한 번에 하나(파일이 겹치지 않을 때만 둘)예요. 맡기는 단위 = 아이가 확인할 결과 하나예요. 고칠 파일·줄과 끝 기준을 콕 집어 줘요. 팀은 **최신 origin/main 위에서 끝내고** `git diff origin/main` 패치를 내요. town.js 연결과 캐시 번호는 메인이 해요.
- 작은 고침은 팀 없이 메인이 직접 해요.
- 합치기·시험 도구는 `tools/ops/README.md`에 있어요.
  - 합치기 폴더: `git worktree add --detach … origin/main` + node_modules 링크
  - `git apply -3` → `r5.py`로 충돌 자리만 풀기 → 캐시 올리기
  - 시험: `B1_MAIN=1 zsh tools/ops/b2.sh zsh tools/ops/gm.sh <폴더> <포트> "<하네스>"`
  - push: `git push origin HEAD:main`(rebase 먼저)
- 시험 단계:
  - push마다 = 문법 + check 17/17 + **홍보판 16/17(빠짐없이)** + 그 기능 하네스
  - 2~3시간마다 = town_state --story · town_cap 같은 긴 묶음
  - 그림 없는 시험(pw.cjs)은 동시 셋, 그림 켠 시험은 맥 전체 하나
- 보고: 20~30분마다 짧게 해요. 끝난 것 · 게임에서 확인할 곳 · 막힌 것 · 주간 %를 적어요. 내부 말(관문·패치)은 줄이고 '자동 시험'이라 불러요.
- 메인 대화가 길어지면(문맥 30~40%) 이 쪽을 고쳐 적고 새 세션으로 넘겨요.
- 늘 지킬 것: 한국어 · 판타지 X · 실명·사진 X · 홍보판 index.html 손대지 않음 · Firebase 규칙 X · 지역 비하 X · 학생 작품 X · `town_lessons.md` 먼저
