# 이어받기(10-24 저녁 · 메인 세션 바꿈) — 새 메인 세션은 이 쪽부터 읽어요

**정본 차례** = `docs/systems/town_week_1024.md`의 '★ 이번 주 확정 차례' 표(바닥선) → 그다음 '이어서' 열 줄. 근거는 `docs/systems/town_codex_1024.md`(코덱스 종합 검토)예요.

## 지금 상태(10-24 23:40 · main = 9421124 · 주간 52% · 멈춤선 80%(75% 알림 · 78% 새 일 멈춤 · 사용자 18:05 'ㄱㄱ'))
- 이 세션에서 올린 것: a8fbd9e(진행 손실 막기 · table1b · J 두 단추 · 보물 지도 단추) · 3e3172e(일 시간 HOURS-1) · 9421124(까망봉·층층골 + 벤치 보상 창)
- 확정 차례 1·2·3·4 ✅ · 5 🔨
- 팀이 짓는 중(패치가 생기면 합침):
  - `scratchpad/fix1.patch` — 행정복지센터 고장 신고 → 다음 날 수리(town_fix.js · 하네스 town_fix.cjs)
  - `scratchpad/isle1.patch` — 이어서 ① 썰물섬(town_xp.js에 섬 · 하네스 town_isle.cjs)
  - scratchpad = /private/tmp/claude-501/-Users-dobuk-Projects-school-metaverse/52a18de9-e78e-4006-be4f-f54f6909d405/scratchpad
- 다음: 이어서 ② 긴급 산불 감시(town_emerg.js 사건 표 7번 줄 · 바람 쪽 보고 연기 자리 찾기 → 신고 → 다음 날 '산불 조심' 판) → ③ 빈 건물 2~3곳 → ④ 첫 30분 동작 소리 → … ⑩ 스키 기문 → 그다음 미룬 것(도전 사다리·내 최고 기록 → 동작 반응 → 빈 건물·직업 → 꾸미기·선물 → 탐험 체력 day_stam → 이웃 일과·먹이·물 연쇄)
- 남은 작은 것: 갈아탄 정류장 카메라(재현 시험 없음 → 시험부터) · 앉기 시험 22번째 타이밍(보상 창) · 마을 강·연못 물 재질이 밤에 납작한 파랑
- 새 시험: town_save(node) · town_jq · town_hours · town_xp · town_xpshot(그림 켬 캡처)

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
