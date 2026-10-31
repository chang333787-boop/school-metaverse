# 단계 3 수직 조각 — 팀 약속(계약) · 누가 어느 파일을 맡나 (2026-10-31)

정본: `goal_prompt.md` → `design.md` v2.1(장 번호는 설계 기준 · 2~6장) → `reference.md`. 이 문서는 **팀 넷 + 메인이 서로 맞물리는 자리**만 적는다. 바꿀 땐 메인이 고친다.

## 0. 늘 지킬 것(모든 팀)
- 한국어로만(보고·주석). 홍보판(루트 `index.html`)·`v2/`는 건드리지 않는다. `CLAUDE.md`의 v2 지오메트리 규칙은 이 게임에 쓰지 않는다(goal §1).
- **저작권**: 영화 그림·모델·음악·대사 원문 X. 알아볼 신호만 빌리고 모양은 새로. 외부 내려받기 X(goal §1 허락 목록 밖).
- **결 = 시안 A**(`look/kit.js`): 재질은 `toon()`만 · 빛은 해 하나 + 하늘빛 · 불빛은 `flameMesh()` + `glowSprite()`(Light 추가 X) · 상자 쌓기 대신 깎은 모양(Lathe·Tube·Extrude·메타볼·노이즈로 흔든 정점) · 정점색으로 색 얼룩 · v2 학교·마을의 상자·블록 결과 `imagine/wizard` 결 X.
- **성능(크롬북)**: 매 프레임 `new` X(모듈 위 스크래치) · 매 프레임 전체 순회 X · 같은 모양 여럿 = `InstancedMesh` 또는 `BufferGeometryUtils.mergeGeometries`로 한 메시 · 장소 하나 그리기 ≤ 110(사람·드래곤·UI 몫 40 남김) · 보이는 삼각형 ≤ 25만 · 텍스처는 캔버스로 직접 그린 것만(장소당 ≤ 4장 · ≤ 512²) · 반투명 겹 ≤ 4.
- **캐시 번호**: import는 지금처럼 `?v=14`로 둔다. 번호 올리기는 메인이 `zsh tools/dragon_ver.sh`로 한 번에.
- **브라우저 시험**: `B1_MAIN=1`을 쓰지 말고 `zsh tools/ops/b2.sh <명령>` 한 자리로. 사진은 playwright 헤드리스로 찍고 바로 닫는다. 미리보기 탭을 열었으면 보고 바로 닫는다.
- **worktree**: 자기 worktree에서 일하고 그 브랜치에 커밋한다(push X). node_modules가 없으면 `ln -s /Users/dobuk/Projects/school-metaverse/node_modules node_modules`. 끝 보고 = 브랜치 이름 · 커밋 · 바꾼 파일 · 사진 경로 · 남은 것.
- 맡은 파일 밖은 고치지 않는다. 꼭 필요하면 보고에 '메인이 고칠 것'으로 적는다.

## 1. 누가 무엇을
| 팀 | 맡은 파일(새로 만들거나 고침) | 끝난 모습 |
|---|---|---|
| **M 모델** | `tools/dragon_blender/*` · `dragon/assets/models/*` · `dragon/js/look/models.js` · `dragon_rig.js` · `human_rig.js` · `dragon/js/scenes/silhouette.js` | 드래곤 여섯(투슬리스 고침 + 그롱클·내더·지플백·나이트메어·테러) · 사람 열둘(덩어리감 그림책 비례 + 얼굴) + 양 · 자세 함수 넓힘(§4) · 64px 실루엣 사진 |
| **F 비행·바다** | `dragon/js/play/flight.js` · `dragon/js/play/boat.js` · `dragon/js/places/sea.js` · `dragon/js/bots/flight_bot.js` · `dragon/js/stages/flight_test.js` | 아케이드 비행(design §3-3) + 쉬움 꼬리 한 키 + 떨어짐·다시 붙기 · 노 박자 배 · 바다 돌기둥 장소 · 비행 봇 쉬움·보통 |
| **W1 마을** | `dragon/js/places/village.js` · `hall.js` · `arena.js` · `dragon/js/look/props.js` | 버크 마을 · 큰 회관 실내 · 훈련장 — 계약 §2·§3 |
| **W2 자연** | `dragon/js/places/forest.js` · `cove.js` · `dragon/js/look/nature.js` | 안개 숲(추적 단서) · 코브 — 계약 §2·§3 |
| **메인** | `core/*` · `main.js` · `play/walker.js` · `play/mind.js` · `play/actors.js` · `ui/*` · `story/*` · `bots/*`(비행 봇 빼고) · `kit.js` · 하네스 | 무대 틀 · 마음 엔진 · 화면 글·책 · 장 2~6 · 저장 · 봇 · 시험 · 합치기·push |

## 2. 장소 모듈 계약 (W1·W2·F)
```js
// dragon/js/places/<이름>.js
export async function buildPlace(ctx) { ... return place; }
// ctx = { scene, group, camera, gfx, env, rng, opt: { time, variant } }
//   group: 이 장소의 물건은 모두 여기에 add(scene에 바로 add X) — 메인이 지울 때 group째 GPU까지 비움(core/stage.js disposeTree · kit SHARED는 남김)
//   env: 늘 있는 하늘·바다·해·하늘빛(kit createEnv) — 장소는 setTime(env, 때, 덮어쓸 값) · env.sea.visible 만 만짐(지우지 않음)
//   rng: 씨앗 난수(Math.random X) · opt.time: 그 장의 때(아래 표) · opt.variant: 장마다 다른 차림(예: 'charred' 그을린 지붕)
place = {
  name,
  height(x, z),              // 걷는 땅 높이(m) — 걸음마다 여러 번 부름 → 해석식 또는 Float32Array 격자 + 쌍선형(전체 순회 X)
  blockers: [{ x, z, r }],   // 원기둥 장애물(나무 밑동·통·기둥·바위) — 사람 반지름 0.35는 메인이 더함
  walls: [[ax, az, bx, bz]], // 얇은 벽 선분(집 벽·울타리·돌벽 둘레·칸막이) — 메인 walker가 미끄러지게 밀어냄 · 카메라도 이 선분 안쪽에 둠
  bound: { x, z, r } | null, // 걷기 바깥 경계(원) — 없으면 walls로 막음
  anchors: { 이름: { x, y, z, yaw } },   // §3 표의 이름을 꼭 · yaw = 앞(+Z)에서 돈 각(라디안) — 사람·드래곤을 거기 세움
  lists: { 이름: [{ x, y, z, ... }] },  // §3 표의 목록(횃불·단서·우리 문…)
  step(dt, t),               // 움직이는 것(불꽃·깃발·물결·문) — new X
  draw(a),                   // 카메라 따라가는 것 — env.follow()는 메인이 부름
  dispose(),                 // group 밖에 만든 것이 있으면 여기서 정리(없으면 빈 함수)
  benchPath(t),              // 0~60초 카메라 길(이 장소를 한 바퀴) — camera.position·lookAt을 직접 놓음
  fly?: { ground(x, z), pillars: [{ x, z, r, top }], ceil, bounds: { x, z, r } },   // 날 수 있는 장소만(코브·바다)
};
```
- **크기**: 걷는 장소는 반지름 ≤ 130m(숲 ≤ 160m). 멀리 보이는 것은 낮은 해상도 한 장(섬 실루엣 · 먼 산)으로.
- **좌표**: 단위 m · y 위 · 원점 = 장소 가운데 근처 · 사람 키 1.5~2.2m · 투슬리스 몸길이 ≈ 7.5m(꼬리 포함) · 높이 ≈ 2m.
- 장소 파일은 `?scene=place&p=<이름>&time=<때>`로 혼자 열려 걸어 볼 수 있어야 한다(메인이 main.js에 붙임 — 팀은 `buildPlace`만 내보내면 됨). 맡은 장소를 메인 걷기(`play/walker.js` createWalker · walls는 메인이 붙이기 전이라 blockers·bound만 먹음)로 시험해도 된다.
- 문·우리 문처럼 움직이는 것은 `lists`의 항목에 `open(k)`(0 닫힘 ~ 1 열림) 같은 함수를 단다. 판자에 글을 쓰는 것(순위판)은 `setLines(['…'])`.

## 3. 장소마다 꼭 있어야 할 이름(장 2~6이 씀)
때 이름은 `kit.js TIMES`: day · sunset · night · nest · overcast · fog · sleet · dawn · clear.

### village(W1) — 버크 마을: 바다 위 가파른 바위 비탈 끝 · 늘 새로 고쳐 짓는 나무집(가파른 지붕 · 지붕 끝 장식) · 때 overcast/sleet/night/dawn/day
- anchors: `plaza` · `hall_stairs` · `hall_door` · `forge_front` · `forge_anvil` · `forge_bellows` · `forge_grind`(숫돌) · `forge_bench`(히컵 작업대 · 뒷방) · `forge_wall`(설계도 붙일 벽) · `tower_base` · `tower_top`(망루 위 · 횃불 옆) · `dock_top` · `dock_end` · `dock_ship`(정박한 큰 배 — 6장 스토이크 귀환 때 고칠 배) · `house_hiccup` · `arena_bridge`(훈련장 가는 다리 끝) · `forest_gate`(숲 가는 길 끝) · `sheep_pen`
- lists: `torches`(밤에 켜질 횃불 · `{x,y,z, set(on)}`) · `npc`(마을 사람 설 자리 ≥ 12 · `{x,z,yaw,kind:'work'|'talk'|'idle'}`) · `patched`(1장 뒤 덧댄 새 판자 자리 — variant 'charred'일 때 그을음 + 새 판자)
- 대장간은 앞이 트인 지붕 집(모루·풀무·숫돌·화로·도구 벽·뒷방 작업대) — 안에 들어가 걸을 수 있게. 화로 불 = flameMesh + glowSprite.
- 망루 = 벼랑 끝 나무 탑(사다리 대신 계단 · 위에 올라설 수 있음 · 횃불 바구니).
- 선착장 = 비탈 아래 나무 다리 + 큰 배 둘(돛 · 용머리 뱃머리 · 방패 줄)·작은 고기잡이배.

### hall(W1) — 큰 회관 실내 · 때 night(비 오는 밤 · 문틈으로 비) / overcast(낮 회의)
- 긴 직사각 실내 ≈ 50×24m · 높은 지붕 서까래 · 큰 기둥 두 줄 · 긴 탁자·의자 · 가운데 큰 화로 · 벽 횃불 받침 여섯 · 벽 방패 · 한쪽 끝 큰 문 · 다른 끝 단(족장 자리)
- anchors: `door` · `dais` · `firepit` · `table_main`(회의 탁자 · 스토이크·어른들 둘러섬) · `table_book`(책 놓인 탁자 · 화로 옆)
- lists: `torches`(여섯 · `{x,y,z,id, set(level 0~1)}` — 2장 ① 꺼지려는 횃불: 메인이 level을 내렸다 올림 · 불꽃 크기·빛 판이 level 따라) · `seats`(사람 앉을 자리 ≥ 10)
- 카메라가 지붕 밖으로 나가지 않게 천장 높이 `ceil`을 place에 적는다.

### arena(W1) — 훈련장 · 때 day / overcast
- 둥근 돌 구덩이(반지름 ≈ 22m · 바닥은 가장자리보다 6m 아래 · 돌벽은 깎은 돌 결) · 쇠사슬 그물 지붕(둥근 격자) · 벽 안 큰 우리 문 여섯(나무 + 쇠띠) · 가장자리 관중석 난간 · 문으로 내려가는 계단 · 순위판(나무 판 · 캔버스 글) · 무기·방패 걸이 · 물통 셋
- anchors: `gate`(안으로 들어선 곳) · `center` · `board`(순위판 앞)
- lists: `cages`(여섯 · `{x,z,yaw, open(k)}`) · `barrels`(물통 · `{x,y,z}`) · `racks` · `crowd`(관중 설 자리 ≥ 16 · 가장자리 위)
- `place.board.setLines(['1 아스트리드', …])`(캔버스 글 · 한글) · `place.setMaze(segs)`(나무 칸막이 판 — segs = [[ax,az,bx,bz],…] 를 판(높이 2.6m)으로 세우고 walls에도 넣음 · 빈 배열 = 치움) — 4장 내더 미로
- 지붕 그물 때문에 비행은 안 함(fly 없음).

### forest(W2) — 안개 숲 · 때 fog / overcast
- 울퉁불퉁 비탈 숲 ≈ 반지름 140m · 전나무·자작나무·고사리·쓰러진 통나무·바위·개울 · 안개(fog 때)로 20~40m만 보임
- **추적 길**: `spawn`(마을 쪽 들머리)에서 `crash`(움푹 팬 곳 · 쓰러진 나이트 퓨리 자리)까지 구불구불 140~200m · 갈림 셋(틀린 쪽은 20~40m 가다 막힘 · 막다른 곳에 '아니구나' 단서 없음)
- lists: `clues`(참 길 위 ≥ 9 · `{kind:'broken'|'furrow'|'scorch', x,z,yaw}` — 부러진 나무 / 파인 땅 고랑 / 그을린 바위·나무) · `landmarks`(손그림 지도에 그릴 큰 것 ≥ 7 · `{kind:'rock'|'stream'|'deadtree'|'cliff'|'boulders'|'bigtree'|'log', x,z,r, label}`) · `decoys`(틀린 갈래 끝 자리)
- anchors: `spawn` · `crash`(투슬리스 묶인 자리 · yaw = 머리 방향) · `crash_rock`(볼라 끈이 걸린 바위) · `fin`(찢긴 꼬리날개 조각 · crash에서 10~20m 앞 길 위)
- `place.mapSketch()` = 지도용 자료 { bounds, path(참 길 점들), landmarks } — 메인이 손그림 지도로 그림(지도엔 내 위치 X)

### cove(W2) — 숨은 호수 · 때 day / sunset / overcast
- 타원 움푹한 땅 ≈ 90×70m · 깎아지른 돌벽 18~25m · 한쪽에 호수(지름 ≈ 30m · 물은 kit 바다와 따로 — 잔잔한 물 판 하나 · 반사 X) · 평평한 흙·모래 마당(모래 그림 자리 · 반지름 ≈ 8m) · 자작나무 몇 · 바위 · 땅 높이의 좁은 입구 틈(돌 틈 + 쓰러진 나무) · 위 가장자리 길(1/3 둘레 · 숨을 바위 셋) · 드래곤 풀 덤불(푸른빛 풀 · 4장 이후) · 미끄러진 자국 벽(투슬리스가 넘으려다 미끄러지는 곳)
- anchors: `rim_start`(숲에서 가장자리에 닿는 곳) · `gap_out` · `gap_in` · `floor` · `sand`(모래 마당 가운데) · `lake`(가운데) · `lake_shore` · `climb_wall`(미끄러지는 벽 밑 · yaw = 벽을 봄) · `nip`(드래곤 풀) · `rest_rock`(투슬리스 쉬는 바위) · `tree_low`
- lists: `rim_watch`(가장자리 숨을 바위 셋 · `{x,y,z,yaw}` = 바위 뒤에서 코브 안을 보는 자리)
- `lake: { x, z, r, y }` 물 높이(5장 첨벙 판정) · `fly: { ground, pillars:[], ceil: 벽 위 + 8, bounds: 타원 → { x,z,rx,rz } }` — 5장 첫 들림·6장 코브 연습 비행
- 가장자리 길(위)과 바닥(아래)은 둘 다 height가 돌려줘야 한다 → **층 둘**: `height(x, z, yHint)` = yHint에 가까운 층(위 가장자리 / 바닥). 가장자리 밖으로 떨어지지 않게 walls로 막음. 바닥 ↔ 가장자리는 걸어서 못 오가고 메인이 장면을 바꿔 옮김(입구 틈 = 바닥 출입).

### sea(F) — 바다 돌기둥 · 때 clear / day / sunset
- 넓은 바다 + 멀리 버크 섬 실루엣(마을 불빛) + 돌기둥 무리 20~40(아치 몇) + 꼭대기가 평평한 '점심 돌기둥'(걸을 수 있음) + 고기잡이 자리
- anchors: `dock`(배 출발 · 버크 쪽) · `fishing`(배 멈출 자리 · 돌기둥 옆) · `lunch`(점심 돌기둥 위 가운데) · `spawn_air`(비행 시작)
- lists: `course`(6장 바다 비행 관문 10~14 · `{x,y,z,r, tail}` — tail = 그 관문을 지나기 좋은 꼬리 자리 1~4(쪽지 그림에 씀)) · `boatPath`(배 길 점들)
- `fly: { ground(x,z), pillars:[{x,z,r,top}], ceil: 400, bounds:{x,z,r} }` · `height(x,z)` = 점심 돌기둥 위 걷기

## 4. 모델·자세 계약(M)
- **드래곤 뼈 이름**(모든 종 같게 — 없는 것은 빼도 됨): `root` · `chest` · `hips` · `neck1` `neck2` · `head` · `jaw` · `earL/R`(귀 판·볏) · `pupilL/R`(동공 크기 = scale.x) · `wing1~3L/R` · `tail1~6` · `finL/R`(꼬리날개) · `legFL/FR/BL/BR`(+ `…2` 아래 마디) · 종마다 덤: 지플백 = `neckA1 neckA2 headA jawA` + `neckB… headB jawB` · 내더 = `spines`(머리·꼬리 가시 세움) · 그롱클 = `belly`(볼·배 부풂).
- **자세 함수**(`createDragonRig(bones, root, species)` → R): 지금 값(flapRate · glide · fold · ear · look · pupil) + 더할 것: `walk`(0~1 걸음 속도 · 네 발 걸음새) · `crouch`(0~1 웅크림 · 경계) · `pounce`(덮치기 앞 몸 낮춤) · `jaw`(0~1 입 벌림 — 울부짖기·불·먹기) · `teeth`(0 들어감 ~ 1 나옴 · 투슬리스 '이빨 쏙') · `tilt`(고개 갸웃) · `headUp`(−1 숙임 ~ 1 듦) · `lie`(0~1 옆으로 털썩 — 턱 긁기) · `roll`(뒹굴기 박자 — 드래곤 풀) · `tailCurl`(0~1 꼬리 말아 감춤 — 겁) · `spines`(내더) · `puff`(그롱클 볼) · `blaze`(나이트메어 몸 불 — 발광 세기) · `struggle`(0~1 묶여 버둥) · `sniff`(킁킁).
  모두 0이 기본 자세. 메인이 마음 엔진 값으로 이 수를 넣는다.
- **사람**(`viking.py` 표 한 줄 = 사람): 지금 막대 사람 → **그림책 덩어리감**(큰 머리 · 굵은 몸통 · 짧은 다리 아이 / 산 같은 어른 · 손 = 벙어리장갑 · 얼굴 = 눈·눈썹·코(코는 큰 덩어리) · 머리카락 덩어리). 열둘: hiccup · hiccup_hel(투구) · astrid · fishlegs · snotlout · ruffnut · tuffnut · stoick · gobber · villager1~3 + `sheep`(양 · 털 덩어리).
- **사람 자세**(`createHumanRig` → R): 지금 값(speed · low · reach · away · throw) + `hammer`(망치 박자) · `carry`(두 손 들기) · `pet`(쓰다듬기) · `ride`(드래곤 탄 자세) · `talk`(손짓) · `stumble`(비틀) · `rollDodge`(구르기) · `sit` · `point`(가리키기) · `cheer`(두 팔 번쩍) · `cower`(움찔).
- **손에 드는 것**: 오른손 뼈 `handR`에 붙일 작은 물건 모델 하나 파일 `props_hand.glb`(칼 · 방패 · 생선 · 뱀장어 · 망치 · 볼라 · 횃불 · 물통 · 공책 — 이름 = 메시 이름).
- 64px 실루엣 시험: `?scene=sil` → 회색 실루엣 사람 다섯(히컵·스토이크·고버·아스트리드·피시레그) + 드래곤 다섯(투슬리스·그롱클·내더·지플백·나이트메어 · 테러 덤)을 64px 칸에 → 사진 `docs/dragon/shots/silhouette.png`.

## 5. 비행 계약(F)
```js
// play/flight.js
export function createFlight({ world, mode, dragon, rider }) // world = place.fly · mode 'easy'|'normal'|'hard' · dragon = { root, rig } · rider = { root, rig } | null
F.step(dt, I)   // I = 입력(core/input.js) — 행동 이름(fwd back left right jump use t1~t4)만 읽음
F.draw(a)       // 보간해 dragon.root·rider.root를 놓음 + rig 값(flapRate·glide·fold·tilt…)
F.state         // { x,y,z, vx,vy,vz, yaw,pitch,roll, speed, tail(1~4), flapPh, stall, fallen, gates, grazes }
F.on(ev, fn)    // 'splash' 'graze'(돌기둥 1m 안 스침) 'gate'(관문 통과 · i) 'fall'(히컵이 떨어짐) 'regrab' 'crash'
F.setGates(list) F.setOpts({ autoForward, assist, ceil, noFlap, tailAuto, liftOnly })  // 5장 첫 들림 = liftOnly(낮게만 · 앞으로 저절로)
export function createFlightCam(camera)   // 뒤따르는 3인칭 · 빠를 때 시야각 60 → 70 · 흔들림 적게
```
- 보통 = 방향키·WASD 몸 · Space 날갯짓(날개가 다 올라간 박자에 누르면 힘 다 실림 · 연타 = 절반) · 1~4 꼬리 자리(1 곧게 · 2 왼 · 3 오른 · 4 급강하·브레이크) · F 쏘기. 동시 키 셋 이하.
- 쉬움 = 앞으로 저절로 + 방향키 · Space 누르고 있기 = 꼬리 펴기(날카롭게 돎) · 숫자 X · 떨어지지 않게만 돕는 도움.
- 떨어짐·다시 붙기(6장 ⑤): 실속이나 큰 부딪힘 → 히컵이 떨어짐 → 투슬리스가 따라 내려옴 → 가까워진 박자에 Space(쉬움 = 저절로).
- 봇(`bots/flight_bot.js`): `DRG.sense()`가 주는 것(관문 자리·내 자리·속도)만 읽고 키를 누름 · 반응 늦음 쉬움 0.6초 · 보통 0.35초 · 초당 6타 상한.

## 6. 메인이 맡은 것(참고)
- `core/stage.js` 무대 그릇(load → compileAsync → dispose + renderLists.dispose) · 장소 열 번 오가기 힙 시험
- `play/walker.js` walls 선분 + 8m 격자 · 카메라 벽 안쪽
- `play/mind.js` 마음 엔진(10Hz · design §3-1 반응 표) → 자세 함수 값
- `ui/*` 지금 할 일 · 하는 법 창(그림 세 줄) · 그림 말풍선 · 힌트 단계 · F 키 표시(쉬움) · 드래곤 책 · 쪽지 · 저장 칸 셋 · 학년 단추
- `story/ch2~ch6.js` 도전 표 · `bots/*` 쉬움·보통·가만히·연타·누른 채 봇 · `tools/harness/drg_story.cjs`
