# 관문 단계표(GATES-1) — 그리기 끄기 시험(FAST-1)

교사 10-24: "진도가 느린데 어쩔 수 없는 거야? 주간 사용량 다 써도 이번 주 큰 변화가 없을 것 같은 불안감"

느린 가장 큰 까닭은 시험이었어요. 패치 하나마다 3D 헤드리스 브라우저 시험을 여러 번 돌리는데, 그때마다 마을을 짓고 GPU로 그려 맥이 뜨거워졌어요. 그래서 '맥 전체에서 한두 대'로 묶었고, 팀들이 시험 차례를 30~45분씩 기다렸어요.
그래서 **논리 시험은 그리지 않고** 돌게 했어요. 게임(주소에 norender가 없을 때)은 그대로예요.

## 1. 그리기 끄기 시험 모드
- 켜는 법: 주소에 `?norender=1` 또는 페이지가 뜨기 전 `window.SM_NORENDER = 1`(하네스 공용 `tools/harness/pw.cjs`가 init script로 넣어서 새로고침에도 남아요).
- 정하는 곳은 `v2/js/main.js` 시작의 `NORENDER` 한 곳뿐이에요. 없으면 예전 코드가 한 줄도 다르지 않게 돌아요(덧붙인 줄은 모두 `if (NORENDER)` 안).
- 꺼지는 것
  - `renderer.render`: 그리기를 건너뛰어요. three render가 하던 **장면·카메라 행렬 갱신은 그대로** 해요(레이·투영·말풍선 자리·getWorldPosition이 그리는 판과 같게).
  - '올림' 흉내: 카메라 안에 드는 메시(three와 같은 보임·층·절두체 검사)는 GPU에 올린 것처럼 `onUploadCallback`·`onAfterRender`를 불러요. 마을이 올린 뒤 비우는 정적 배열(GEOS·armFree)이 그리는 판과 같은 때 비워져요.
  - `renderer.compile`·`compileAsync`·`prewarm`: 셰이더를 짓지 않아요.
  - 캔버스: 그리는 판을 가로 64px쯤(1280 창 = 배율 0.05)으로 줄이고 자동 해상도·MSAA를 꺼요.
- 그대로인 것: rAF 루프(초당 60번)와 dt, 시뮬레이션·물리·HUD·DOM·2D 캔버스(작은 지도·M 지도)·소리·`SM_TOWN`·`SD2` 시험 API, 판 갈래(`SD2.gfx.mode`)·그림자 값.
  - 시험이 기대는 시간: 게임 시계(초당 1.4분)·W 2초 걷기(8.4m)·rAF 초당 60회가 켬·끔에서 같아요(탐침 `scratchpad/fast1/probe.cjs`). 시험은 실제 시간(`waitForTimeout`)·rAF 수·`SD2.step`(1/60 고정)에 기대는데, 끔은 프레임이 짧아 dt 상한(0.05초)에 걸리는 일이 오히려 적어요.
  - 힙: 켬 304MB · 끔 322MB(올림 흉내 전에는 949MB — 정적 배열이 안 비워졌음).
  - 확인: `SD2.gfx.norender === true` · `SD2.renderer.info.render.calls === 0`.
- 못 보는 것(그래서 묶음 관문에서 그리기를 켜고 봐요): 사진·눈 캡처, 프레임 시간·긴 프레임, 그리기 수·삼각형, 셰이더 오류, 반짝임, 그림자 굽기 때의 올림.

## 2. 하네스 분류(48개)
`pw.cjs`를 쓰는 하네스 = 기본 그리기 끔. `--render`(또는 `RENDER=1`)를 주면 켜요. `--shots=…`·`--perf`·`--gpu`·`--before`를 주면 저절로 켜요.
늘 사진을 찍던 다섯(econ·fish·minis2·salt·nb)은 그리기 끔이면 사진만 건너뛰어요(통과 판정과 상관없음).
애매하면 켰어요.

| 하네스 | 무엇을 재나 | 그리기 | 까닭 |
|---|---|---|---|
| `check.cjs` (v2 · `PAGE=/` 홍보판) | `?check=1` 감사·도달·문·지도 계약 + 건강 검진(구역별 그리기 수·삼각형·ms) | 켬 | 그리기 수·삼각형 = 시각 · 커밋 게이트 |
| `combine.cjs` · `shot.cjs` · `shot2.cjs` · `mob2.cjs` | 사진 격자·휴대폰 사진 | 켬 | 사진 |
| `net_cf.cjs` | 함께하기 실시간(자리 지연·흔들림·끊긴 프레임) | 켬 | 프레임 |
| `town_check` | 마을 감사(반짝임·뚫림·걸어서 닿기) + 나갔다 들어오기 + **긴 프레임** | 켬 | 프레임 |
| `town_tour` | 크롬북 조건 순회 프레임 p50·p95 | 켬 | 프레임·GPU |
| `town_chem` | 화학 규칙 + **그리기 수 차이** + 1초 칸 ms | 켬 | 그리기 수 |
| `town_wild` | 야생동물 + **그리기 수 차이** | 켬 | 그리기 수 |
| `town_flicker` · `town_flicker_roof` | 실내·가게 앞 반짝임(보이는 메시 · metal · dpr=1) | 켬 | 시각 감사(애매 → 켬) |
| `town_herd` | 양몰이 봇(`--perf`면 프레임 p95·그리기 수) | 끔 | `--perf`면 저절로 켬 |
| `town_meshhash` | 마을 지문(메시 종류·정점·경계·자리 해시) | 켬 | 켬·끔 해시를 아직 못 견줌(애매 → 켬) · 견주어 같으면 끔으로 |
| `town_photo` | 사진 기자(K 셔터 = 화면 안 동물 셈 · 기사·앨범) | 끔 | 셈은 투영 상자 — 사진 그림은 안 봄 · `--shots`면 켬 |
| `town_econ` · `town_fish` · `town_minis2` · `town_salt` · `town_nb` | 장터·낚시·김/굴·염전·이웃(늘 사진을 찍던 판) | 끔 | 판정은 상태 · 끔이면 사진만 건너뜀 |
| `town_ask` · `town_bake` · `town_home` · `town_hud` · `town_janggu` · `town_kitchen` · `town_lost` · `town_news` · `town_post` · `town_road` · `town_sim` | `--shots`가 있을 때만 사진 | 끔 | `--shots`면 켬 |
| `town_board` · `town_cap` · `town_cloud` · `town_eaudit` · `town_indoor` · `town_loop7` · `town_music` · `town_portal` · `town_route` · `town_rules` · `town_seats` · `town_state` · `town_stones` · `town_tools` · `town_trap` · `town_treasure` | 상태·규칙·걸어서 닿기·끼임·보상 | 끔 | 논리만 |
| `textlint.cjs` | 글 검사 | — | 브라우저 없음 |

- `town_seats`·`town_trap`의 'frames'는 rAF 수를 세는 지킴이(그 동안 매 프레임 상태를 봄)라 성능이 아니에요. 끔에서도 rAF가 초당 60번이에요.
- `town_chem`·`town_wild`는 그리기 수 칸 하나 때문에 켬이에요. 그 칸을 `RENDER`일 때만 돌게 나누면 끔으로 옮길 수 있어요(다음 일).
- `town_check`도 긴 프레임 칸 하나 때문에 켬이에요. 감사·나갔다 들어오기만 끔으로 나누면 패치마다 돌릴 수 있어요(다음 일).

## 3. 켬·끔 견줌(10-24 · 이 맥 M5 · 한 번에 한 대 · `scratchpad/fast1/out`)
같은 작업 폴더·같은 서버(8731)에서 하네스 여섯 + 탐침 둘을(자리 기다림이 길어 eaudit·route·stones·meshhash·board·portal은 못 돌림) `--render`(켬) → 기본(끔) 차례로 돌렸어요. CPU = 그 하네스가 띄운 헤드리스 크롬(본체·GPU·렌더러) 합 · ps로 2초마다 · 'CPU초' = 다 쓴 CPU 시간.
맥 GPU 사용률(ioreg)은 맥 전체 값이라 다른 세션의 브라우저·화면이 섞여 있어 참고만 해요. GPU 프로세스 CPU가 GPU 일의 대신 값이에요.

| 하네스 | 켬 결과 | 끔 결과 | 같은가 | 걸린 시간 켬/끔 | CPU초 켬/끔 | GPU 프로세스 CPU 켬/끔 | 크롬 메모리 최대 켬/끔 |
|---|---|---|---|---|---|---|---|
| `town_photo` | PASS | PASS | 같음(왜가리 상태 글 alert/rest만 다름 = 동물 움직임) | 25/24초 | 13/10 | 13%/3% | 2392/1941MB |
| `town_home` | PASS | PASS | 같음(ms 숫자만) | 86/86초 | 27/16 | 9%/1% | 2459/2175MB |
| `town_treasure` | FAIL 11 | FAIL 11 | 같음(✓✗ 줄 모두 같음 · 남은 거리 ±0.3m) | 156/156초 | 57/35 | 11%/2% | 2537/1956MB |
| `town_indoor` | FAIL(같은 곳들) | FAIL | 같음(움직인 거리 1.89↔1.96만) | 310/311초 | 63/36 | 6%/1% | 2098/1655MB |
| `town_trap` 1차 · 2차 | PASS · FAIL(갇힘 3) | FAIL(갇힘 2) · PASS | 무작위(아래) | 182·195/189·181초 | 63·53/34·33 | 12·8%/1·1% | 3039·2572/1205·1660MB |
| `town_seats`(앞 25곳) | 20 ✓ · 21번째 '못 일어남' 뒤 연쇄 ✗ | 똑같음 | 같음 | (12분 넘어 멈춤) | — | 9%/— | 2410/— |
| 탐침(`probe.cjs`) | fps 60 · 게임 시계 1.4분/초 · W 2초 8.4m | 같음 | 같음 | 18/17초 | 11/8 | 18%/1% | 2644/2167MB |
| 갇힌 자리 직접(`trapprobe.cjs`) | 8방향 모두 2.4m | 같음 | 같음 | 34/33초 | 13/10 | 10%/2% | 2546/1985MB |

- 걸린 시간은 거의 같아요. 하네스가 실제 시간으로 기다리는 곳(`waitForTimeout`·걷기 몇 초)이 대부분이라서예요. 줄어드는 것은 **열**(CPU 약 40% · GPU 프로세스 약 85%)이고, 그래서 **동시에 여러 대**를 돌릴 수 있게 돼요(5절).
- 크롬 CPU 최대(150~210%)는 켬·끔이 비슷해요. 마을 짓기(CPU) 몫이라서예요. 짓기 시간을 줄이는 일은 따로예요.
- 실패가 있는 하네스(보물 FAIL 11 · 실내 FAIL · 앉기 21번째부터 연쇄 실패)는 켬에서도 똑같이 실패해요. 그리기와 상관없이 원래 있던 실패예요.
- `town_trap`은 차가 지나가는 때에 따라 갈려요. 켬 1차 PASS · 2차 FAIL(갇힘 3) · 끔 1차 FAIL(갇힘 2) · 2차 PASS. 끔에서 갇혔던 두 자리에 직접 세워 보면 켬·끔 모두 8방향 2.4m씩 걸어 나와요(`scratchpad/fast1/trapprobe.cjs`). 차와 만나는 때가 무작위라서 생기는 흔들림이에요.

### 게임 모드(그리기 켬)가 그대로인지 — 기준(HEAD 사본 · 8732) ↔ 고친 판(8731)
| 시험 | 기준 | 고친 판 |
|---|---|---|
| `check.cjs --full`(v2) | 게이트 17/17 · 최악 14.9만/191콜 · 감사 0 · 도달 112 · 문 65 · 지점 441 | 같음(로그가 ms 숫자 말고 한 글자도 안 다름) |
| `town_check` frames | worst 33ms · 긴 프레임 0 | worst 27ms · 긴 프레임 0(감사·뚫림·닿기·나갔다 들어오기 결과는 한 글자도 안 다름 · 검사 ms만 5019 → 4757) |
| 탐침(켬) | — | fps 60 · 그리기 179 · 셰이더 140 · 지오메트리 2385 · 힙 304MB(끔 줄과 견줌용) |

## 4. 관문 단계표(제안)
예전에는 패치 하나마다 `check`·홍보판·`town_hud`·`town_state --story`·`town_rules`·`town_chem`·`town_cap`(+그 패치 것)을 모두 그리기 켬으로 돌렸어요. 메인 관문 기록(10-24 오전 g_1~g_4)을 보면 한 바퀴 **14~32분**이고(`town_state --story` 3~18분 · `town_cap` 8분), 그 앞에 자리 기다림 30~45분이 붙었어요.

| 단계 | 언제 | 돌리는 것 | 그리기 | 한 바퀴(브라우저 시간) |
|---|---|---|---|---|
| **패치마다** | 조각 하나 push 전 | ① 문법 `node --input-type=module --check < 고친 파일` ② `check.cjs . --full`(v2 · 10초) — 학교 쪽(`v2/js`·layout·world)을 고쳤으면 `PAGE=/` 홍보판도(10초) ③ **그 패치의 하네스**(끔) — 사진·프레임을 바꾼 패치면 그 하네스만 `--shots`/`--render` | ②만 켬 | **2~6분**(예전 14~32분) |
| **묶음마다**(2~3시간) | 묶음 push·코덱스 점검 때 | 예전 관문 다섯(`town_hud` · `town_state --story` · `town_rules` · `town_cap` = 끔 · `town_chem` = 켬) + 그 사이 고친 기능의 `town_*` 모두(끔) + `town_check`(켬) + 바뀐 기능의 `--shots` 아이 눈 한 바퀴(켬) + 짓기를 바꿨으면 `town_meshhash` 전·후(켬) + 동물을 바꿨으면 `town_wild`(켬) | 끔 + 켬 | 30~45분 · 끔을 셋씩 함께 돌리면(5절) **15~25분** |
| **밤·수업 전** | 하루 한 번 | `town_tour`(크롬북 프레임 p95) · `town_flicker`·`town_flicker_roof` · `town_herd --perf` · `town_seats`(209곳 · 12분 넘음) · `town_indoor --all` · `town_state`(모든 조합) · 학교 지도를 바꿨으면 `shot`·`mob2` · 함께하기를 바꿨으면 `net_cf` | 켬 | 1~2시간 |

하네스마다 단계
- 패치마다(그 기능일 때): 끔 하네스 전부 — `town_ask` `town_bake` `town_board` `town_cloud` `town_econ` `town_fish` `town_home` `town_janggu` `town_kitchen` `town_loop7` `town_lost` `town_minis2` `town_music` `town_nb` `town_news` `town_photo` `town_portal` `town_post` `town_road` `town_route` `town_salt` `town_sim` `town_stones` `town_tools` `town_trap` `town_treasure` `town_herd` `town_eaudit` `town_indoor`
- 묶음마다 늘: `town_hud` `town_state --story` `town_rules` `town_cap` `town_eaudit`(끔) · `town_chem` `town_check`(켬)
- 묶음마다 바뀌었을 때: `town_meshhash`(짓기 · 켬) · `town_wild`(동물 · 켬) · `town_route`(길·건물)
- 밤: `town_tour` `town_flicker` `town_flicker_roof` `town_herd --perf` `town_seats` `town_indoor --all` `town_state` · `shot` `shot2` `mob2` `combine` · `net_cf` · `check.cjs`(홍보판)

## 5. 자리 스크립트(b1.sh) 제안 — 고치지 않았어요
이번에 시험을 돌리며 본 것
- **기다림이 길어요**: 이 일의 첫 묶음은 2시간 동안 한 번도 자리를 못 잡았어요. 새로 온 일은 바로 조건을 보고, 기다리던 일은 10초마다 보니 **새로 온 일이 먼저 들어가요**(줄 순서 없음).
- **브라우저 수를 잘못 세요**: `pgrep -f chrome-headless-shell`이 다른 세션의 기다리는 셸(명령 줄에 그 글자가 든 `grep`·`until` 줄)까지 한 대로 세어, 브라우저가 하나뿐인데도 '두 대'로 막힌 때가 여러 번 있었어요(10-24 실측 71558·27101).

제안(견본 `scratchpad/fast1/b1_proposal.sh` · 아직 안 씀)
1. 브라우저 셈은 진짜 크롬만: `pgrep -f '^[^ ]*/chrome-headless-shell( |$)'`(명령 줄이 크롬 실행 파일로 시작) · 본체만(`--type=` 없는 것).
2. **끔 시험(가벼운 일) = 자리 셋**(`nr1~3.lock`) · 부하 8 아래 · 켬 브라우저 하나 이하일 때. 가벼운 일 = `pw.cjs`를 쓰는 하네스 + `--render`·`--shots`·`--perf`·`--gpu`·`--before`·`RENDER=1`이 없음. 가벼운 브라우저는 `pw.cjs`가 붙이는 이름표 `--sm-norender`로 따로 세요.
3. 켬 시험(무거운 일)은 지금 규칙 그대로(자리 하나 · 부하 6 아래 · 맥 전체 켬 브라우저 한 대 이하).
4. (덤) 줄 순서: 기다리는 일마다 번호표 파일(`queue/<시각>-<pid>`)을 두고 가장 앞 번호만 들어가게 하면 굶는 일이 없어요.
- 근거: 끔 한 대는 켬 한 대보다 CPU를 약 40%, GPU 프로세스를 약 85% 덜 써요. 끔 셋을 함께 돌려도 평균 CPU는 켬 1.5~2대 몫이고, 짓기가 겹치는 순간만 코어 6개쯤이에요(10코어 · 부하 8 문턱).

## 6. 그리기 끔에서 조심할 것
- 사진 기자(`town_photo`)의 셔터는 끔에서도 돌아요. 앨범 사진은 빈 그림(320×180)이고, 기사 판정(화면 안 동물 셈)은 투영 상자라 같아요.
- 그리기 수(`renderer.info.render.calls`)는 늘 0이에요. 그리기 수를 재는 칸은 켬에서만 의미가 있어요.
- 그림자 굽기(`bakeShadows`) 때의 올림은 흉내 내지 않아요. 그림자만 드리우는 메시의 배열은 그리는 판보다 늦게 비워질 수 있어요(힙 몇 MB · 판정과 상관없음).
- 앉기 시험 `town_seats`는 21번째 벤치(차1 [-823.9, 878.7])에서 'E로 못 일어남' 뒤로 188곳이 연쇄 실패해요(켬·끔 같음 · 원래 있던 일).
