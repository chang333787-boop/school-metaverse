# 이어받기(10-24 저녁 · 메인 세션 바꿈) — 새 메인 세션은 이 쪽부터 읽어요

**정본 차례** = `docs/systems/town_week_1024.md`의 '★ 이번 주 확정 차례' 표(바닥선) → 그다음 '이어서' 열 줄. 근거는 `docs/systems/town_codex_1024.md`(코덱스 종합 검토)예요.

**⚠️ 10-25 11:50 — 예약 세션(11:01)이 권한 창에서 멈춰 있어 원래 메인 세션(52a18de9)이 다시 맡았어요. 예약 세션이 나중에 풀리면 코드는 고치지 말고 끝내요(겹침 X).**

## 지금 상태(10-25 밤 · main = b6deb8a · 주간 67% · 멈춤선 80%(75% 알림 · 78% 새 일 멈춤))
- **방향(정본) = docs/systems/town_achieve.md 네 기둥**(계획하는 하루 · 알아내야 열리는 길 · 몸으로 자라는 능력 · 내 결과가 남는 마을) · 새 넓이(새 건물·새 놀이)는 멈춤 · 메모리 feedback-productive-struggle(E 누르기·막대 X · 시간 비용 · 본 것만 근거)
- 10-25 올린 것(이어서 ①~⑩ · 미룬 것 모두 · 사용자 요청): 썰물섬 · 산불 · 빈 건물(경찰서·병원·보호센터·은행·우체국·영화관·공장·노인정·박물관) · 손맛·E 반응 전수 · 땅 결 · 숨은 놀람 · 칸 키트 시내 · 밀물·강아지 · 스키 기문 · 도전 사다리 · 마당·선물 · 이웃 일과(출퇴근·점심·장보기·정자) · 물 변화 · 공장 → 장터 · 레벨 보상 칩 · 아이 눈 고침 · 탐험 체력(1c11649) · 하루 한 바퀴(c53e7ff) · 발견 길잡이 + 멀리서 단서(b6deb8a)
- **팀이 짓는 중(패치가 scratchpad에 생기면 합침)**: case1.patch(사건 수첩 엔진 + 흐려진 강) · fire5.patch(소방 다섯 겹 + docs/systems/town_depth.md 깊이 감사) · why1.patch(왜 있어? 감사 docs/systems/town_why.md + 상호작용 10~15)
  - scratchpad = /private/tmp/claude-501/-Users-dobuk-Projects-school-metaverse/52a18de9-e78e-4006-be4f-f54f6909d405/scratchpad · 합치기 폴더 m1·m2·m3(detached · `git fetch && git checkout --detach origin/main` → `git add` → `git apply -3`) · 캐시 = `python3 scratchpad/bump.py <폴더> <바뀐 모듈.js…>`(부르는 모듈까지 거슬러 올리고 registry +1 · main.js·mapapi 고치면 v2·v3 index main.js?v= · main.js mapapi?v=도)
- **다음 차례**: 🌀 태풍이 온다(7일 한 판 · town_achieve.md 표) → 나의 길(여섯 길 · 길이 자라면 마을이 바뀜) → 가방·부탁(먹으면 힘 · 이웃 부탁이 물건 · 쓸 곳 한 줄 · 꾸러미 = 마을이 바뀜) → 막대 놀이 바꾸기(깊이 감사 표 ⑥) → 도전 모드 → (나중) 남은 건물 · 바다 4칸
- 남은 작은 것: 자전거 21m/s 모퉁이 [-336,472] 2.8초(town_stam F · 예전과 같은 움직임) · town_state 전체는 30분 한도 넘음(gm.sh alarm 1800 → 나눠 돌리기) · 휴대폰 세로 영화관 시간표 왼쪽 두 줄이 할 일 칩 뒤

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
