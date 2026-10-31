# 마을 이어받기(10-31 · 예약 세션 → 메타버스 세션)

사용자 10-31: "그 세션에게 인수인계하라 하고 너(메타버스 세션)가 이어받아". 까닭은 예약 세션이 사이드바에 고정되지 않아서예요. 옛 이어받기 쪽(`town_handoff_1024.md`)의 '일하는 법'은 그대로 써요. 이 쪽은 10-28 ~ 10-31 상태만 적어요.

## 지금 상태
- **main 마지막 커밋** = `af8e29b`(코덱스 심층 B 문서) · 10-28 ~ 10-31 사이 코드 커밋은 없음(97% 규칙으로 고침을 미룸)
- 10-28에 올린 코드: `e9bc745` WEAR-1(보상 옷·장비 가방에) · SAVE-CLS(학급 계정 저장 열쇠에 반 코드) · `4dbfd9d` HOME-2(우리 집에 간호사 이웃 문) · `b3352d2` GFX-2(예지네 마당 떠 보임 · 배추밭 검은 막 = 먼 산 안개)
- 코덱스 심층 분석 A·B·C = `docs/systems/town_codex_deep_1028.md` 한 문서(A 처음 30분 + 저장 · C 잠재 버그 20 + 게임성 · B 돈·보상 + 성능). 교육 설계·차시는 사용자 10-28 '필요 없어'로 뺌

## 이번 주 사용량 규칙(사용자가 정한 것)
- 10-27 "97퍼까지만 하자": **95%에서 새 팀 X · 96%에서 돌던 팀 마무리 · 97% 멈춤 · 보고마다 주간 %**
- 10-31 새 주(리셋 0%) · 사용자 "토큰 리셋됐으니 이어서 진행" — 새 상한 말씀은 없어서 97% 규칙을 그대로 씀(메모리 feedback-weekly-cap-80)

## 10-31 돌다 멈춘 팀(인수인계로 멈춤 · 패치 = 메타버스 세션 scratchpad)
패치 폴더 = `/private/tmp/claude-501/-Users-dobuk-Projects-school-metaverse/a063b03f-4643-4d07-bd16-abaaedbd0dbe/scratchpad/patches/`
| 패치 | 일 | 시작 근거 |
|---|---|---|
| `handoff_typh2.patch` | 🌀 TYPH-2 태풍 날 — 사용자 10-31 "태풍날 아무것도 못 하고 시간도 못 보내고 이벤트가 뭔가 이상해" · ⏩ 기다리기가 늘 되게 · 집·대피소 안 할 일 셋 안팎 · 집으로 끌려가는 순간이동 부드럽게 | `town_typhoon.js` stormSec(277줄 근처)·stormPanel → `A.sleep()` = town.js sleepNow |
| `handoff_save3.patch` | 💾 SAVE-3 저장 지키기 — ① PIN `sm-town-login`·클라우드 `sm-town-cloud:`를 반까지 넣은 키로(옛 `id@sN` 자동 옮기기는 위험 — 반이 맞을 때만) ② 클라우드 세대 번호 ③ delSave 전 readSave + :old ④ flush 실패면 탭 소유권 안 넘김(C E3) ⑤ 홍보판 `?game=town` 차단(v2 로더에서 · 루트 index.html X · C E1) ⑥ 로드 취소 정리(C E4) ⑦ 하루 넘김 한 번에 저장 | 코덱스 A·C |
| `handoff_rwfix1.patch` | 🎁 RWFIX-1 보상·재료·행사 — 요리 취소 출처(B1) · 지급량 = 표시(B3·E11·E15) · 교환·위탁 규칙(B4) · 미지급 시도 횟수 차감(E18) · 잔치 두 번 반영·완성 갈래 기부(E12·E13) · 제빵 종료(E5) · 옷 geometry(E6) · 김장 두 번 누름·timer(E7·E8) · 설·추석 완료 조건(E9) · 김치 안내(E10) · 밤 낚시 미끼(E14) · 06시 경매 진행 중(E16) · 계절 캐시(E17) · 잔치 식사 취소(E19) | 코덱스 B·C |

각 팀 보고(어디까지 했나)는 아래 '팀 보고' 칸에 붙임. 패치는 **최신 origin/main 위에서 `git apply -3`** → `tools/ops/r5.py` → 캐시 올리기(`bump.py`는 옛 scratchpad에서 사라짐 — 손으로: 바뀐 모듈의 `?v=`를 부르는 쪽까지 · registry.js town v +1 · main.js면 v2·v3 index.html) → 자동 시험.

## 남은 차례(위부터)
1. 위 세 패치 마무리·합치기(태풍 먼저 — 사용자 신고)
2. PERF-3 다시(코덱스 B: 그리기 생략이 충돌 갱신까지 멈춘 것이 town_trap 모퉁이 끼임 원인 후보 → ①행렬 ②모양 통일 ③원거리 갱신 생략을 나눠 비교 · 물리 갱신은 그리기와 떼기) · 동적 충돌체 누적(B5 · collider.remove가 배열에서 안 빼냄 → 고정 슬롯)
3. 코덱스 C 게임성: 하루 추천에 '오늘만 되는 일' 한 자리 · 나의 길 기존 성과 한 번에 인정 · 잔치 결과물 하나 마을에 영구 · 길 끝에 새 행동 하나(F1·F7·F8 · 설계안은 사용자에게 한 쪽으로 먼저가 아니라 '묻지 말고 해' 메모리대로 정해서)
4. 코덱스 B 경제: 튼튼한 씨앗 손해 · 돈 쓸 곳 약함 · 은행 이자 · RW_DAY 이름(20000)과 실제(실제 날짜 6만) 어긋남
5. 코덱스 A 남은 것: 25m 넘게 떨어진 곳에서 이어하면 프롤로그 자동 열림 · 기능 열림이 3.6초 setTimeout 기다림 · 잔치 첫 알림 lv1 → lv2 · day-plan 길이 이야기 길을 덮음

## 알려진 버그(안 고침)
- 시아네 집(자10) 앞에서 집이 안 보임 · 마당 잘림 의심(GFX-1 clipExt) · 지원이네(자9)·시아네(자10) 칸에서 구역 배너 '출렁포'(반짝시 칸) 어긋남
- town_case '소식판 줄에 실림' 두 칸 실패(27cf82a 전에도) · town_deco '칠판 답례 줄' 실패 · town_route 마을회관 → 전망대 5.5m 못 지남 @ -542.9,-42.3
- 버섯 따도 그대로 보임 · 가린 간판 7 · 같은 칸에 같은 이름 병원 둘 · 투명+양면 재질 108개 셰이더 비용
- 휴대폰 세로 '첫 마을 잔치' 줄 ↔ 나침반 띠 6px · town_judge 투호 점수 null 가끔
- 코덱스 C의 E20(같은 id 장소 둘 → 여권 공유)은 지금 자료엔 없음 — 자료 바꿀 때 주의

## 꼭 지킬 것(요약)
한국어·높임말 · 묻지 말기 · 권한 창 도구 X · 홍보판 루트 index.html 손대지 않음 · 판타지·전투 X · 실명·사진 X · 학생 작품 X · 지역 비하 X · Firebase 규칙 X(시험은 zz) · 줄 가운데 // X · 새 Light X · :has() X · 윈도10 깨지는 이모지 X · 시험 브라우저 GPU 플래그(`--use-gl=angle --enable-gpu --ignore-gpu-blocklist --disable-renderer-backgrounding --disable-background-timer-throttling`) 한 번에 하나 · 하네스 시작 Escape 넷 + `S.story.done.p0 = 1` · '관문' 대신 '자동 시험' · push마다 한국어 보고 · `town_lessons.md` 먼저

## 팀 보고(10-31 · 세 팀 모두 코드 고침 0 · 패치 셋은 '변경 없음' 빈 파일 · 읽어서 찾은 것만)
옛 PERF-3 패치도 같은 폴더에 `handoff_perf3_old.patch`로 옮겨 둠(town_trap 모퉁이 끼임 11판 중 5 — 그대로 합치지 말 것).

**🌀 TYPH-2(브라우저 재현은 못 함 · 코드 읽기로 찾은 것)**
1. 태풍 창(stormPanel)은 `s.said.k7=1`로 하루 한 번 — 닫으면 ⏩ 기다리기를 다시 열 길이 없음. 할 일 줄 '태풍 수첩 보기'는 수첩만 열고 7일째 수첩엔 기다리기 단추 없음(`open()`) → 메뉴 잠·집 침대뿐 = 사용자 "시간도 못 보내고"
2. 7일째 할 거리 0: 부탁·물품 탁자·소문이 `k<=6`에서만 · town.js 5080·5086·5097·5104·5111의 `busy()`에 `TYP.storm()` → MYP·BUN2·RGN·FEAST·SSN 하루 내내 쉼 · EMG·RD도 쉼
3. 문가 6m 밖이면 1초마다 바로 순간이동 + 알림 · 기준이 집 문이 아니라 `homeSpot()` · 학교 안에서 시작해도 밖 몇 m면 학교가 아니라 집으로
4. 같은 아침 잔치(town_feast.js:252)·계절 행사(town_season.js:323) '태풍이라 미뤄요' + 태풍 창 + 순간이동 알림 + 하루 마무리 창이 겹침(확인 전)
5. 메뉴 잠 `sleepNow(false,true)` = 마무리 창 먼저 · ⏩ = `sleepNow(false,false)` 마무리 창 없음 — 흐름이 다름
- 할 일: 재현 → ⏩를 할 일 줄·수첩·집 안에서 언제든 · 안에서 할 일 셋(rwCheck `case:typhoon`) · 순간이동 = 문가 허용 + 한 번 알림 + 몇 초 뒤 · town_typhoon.cjs 시나리오 · 문서·lessons 한 줄
- ⚠️ 팀의 재현 스크립트(typh2/repro.cjs)는 남지 않음 · 하네스 명령은 `RENDER=1 zsh tools/ops/b2.sh node …`를 다른 명령과 합치지 말고 단독으로(worktree 검사에 막혔다 함)

**💾 SAVE-3**
1. 게임 판 키·`:bak/:old/:own`·`sm-town-cloud:`는 b5ce6a2(SAVE-CLS)로 이미 반별 · **남은 것 = PIN `sm-town-login`이 `'s'+번호`만(town.js 4218·4226) + 옛 키 옮기기(town.js:237)가 출처 확인 없이 지금 반으로 복사** → PIN 키 `반:s번호` · 옛 PIN은 그 반 새 키 판이 이 기기에 있을 때만 · 옛 `@s03` 판은 자동으로 안 옮기고 옛 PIN = 방금 PIN일 때만 '이전 저장 불러오기' 단추
2. 서버(cf-rooms)는 조건 없이 덮어씀 · 클라는 날짜·번 돈만 견줌 → `S.gen={id,t,dead:[]}`(옛 판 모두 'L0') · 처음부터 = 새 id + 버린 id를 dead에 · cloudPull은 dead 세대가 못 이김 · cloudSync는 첫 올림 전·3분마다 서버 세대 확인 · 서버 코드는 안 바꿈
3. delSave(town_game.js:27)가 readSave 없이 지움 → readSave 판을 `:old`에 먼저 · 다른 창이 쓰는 칸은 안 지움 · 내 칸이 다른 창에서 지워지면 읽기 전용 + 알림
4. E3 진짜(town_game.js:141) → flush 실패면 '안 넘김' 답 · claimSave는 그때 새 창을 읽기 전용으로
5. E1 진짜 → main.js 끝 로더 + mapapi.js loadGame 두 곳에서 SM_PROMO면 town 막기(루트 index.html X)
6. E4 코드상 진짜(취소 갈래 town.js:5714 근처는 아직 안 읽음) → stop과 같은 정리(dead·GAME.dispose·cloud interval·자동 저장 timer)
7. 하루 넘김(town_game.js:180) 저장이 day 처리보다 먼저 → day 뒤 한 번 · potGrew·farmGrew를 S에(town.js 6693·town_news.js 아직 안 읽음)
- 하네스: town_save.cjs · town_save2.cjs · town_cloud.cjs

**🎁 RWFIX-1(1~4만 읽음 · 5~14는 코덱스 근거만)**
1. 진짜 — openCook·takeMore의 GAME.take가 bought를 줄이고 취소(town.js:4705)는 `GAME.add(…,'mv:cook')`만 → 쓰기 전·뒤 botN 차이를 `w.bt`에 · 취소 때 botSet으로 되돌림
2. 진짜(둘) — 두 번째 그릇(town.js:4708) 꼬리표 없는 `GAME.add(e2,1)`인데 bagPop 2개 · 꾸러미(6716)가 earn 반환값 안 보고 B.money 배너 · TEV(4838)는 t.rew로 💰 팝 → 둘째 그릇 'mv:cook' · lastN 0이면 알림 X · taskEv에 `t.got=r9` · 꾸러미 실제 받은 돈 · 사진·밤 낚시·장구·길 도움은 아직
3. 물물교환 진짜(town.js:4571 값 안 견주고 BAG 직접) → 값 있는 상품만·가까운 값 · GAME.take + `GAME.add(loc,1,'mv:trade')` · 판매대 올릴 때 `MKT().n[mkKey(w,e)]` · town_econ 하네스 영향 주의
4. 진짜 — rwCheck가 C[ck]를 먼저 올림 → 줄 양 > 0일 때만
5~14: town_feast.js(5·14) · town.js:7490 종료 목록에 BAKE.abort/dispose(6) · town_reward.js(7) · town_season.js(8·9·10·13) · town_night.js(11·12) · town_day.js(12)
