# v2 게임용 기초 맵 API + 맵 건강 검진 (MAP-API-1 · MAP-HEALTH-1 · 2026-09-24)

학교 맵을 **간단한 게임(보물찾기·장소 찾기·퀴즈 스테이션·술래 없는 술래잡기 등)의 기초 맵**으로 쓰기 위한 '지도 계약'과,
게임을 깨는 맵 결함을 플레이어와 같은 물리로 재는 '건강 검진'의 정본 문서다.
세 설계안(엔진/API 우선 · 게임 역산 · 견고성 우선)을 합쳐 정했다. 첫 예제 게임은 아직 만들지 않았다 — API가 게임을 받을 준비까지.

## 1. 한눈에

| 파일 | 역할 | 불러오는 때 |
|---|---|---|
| `v2/js/nav.js` | 0.3m 길격자·A*·경로 펴기·무작위 칸·거리장(순수 함수·타입 배열) | 항상(main.js import) |
| `v2/js/mapmeta.js` | 구역 계약표(라벨→id·kind·건물·tags) · 덧붙인 넓은 구역 · 출발점 · 표지점 | 항상 |
| `v2/js/mapapi.js` | 지도 API(`SD2.map`) — 구역·지점·이벤트·질의·플레이어·상호작용·트리거·충돌·HUD·표식·길찾기·미니맵 데이터·게임 로더 | 항상 |
| `v2/js/health.js` | 맵 건강 검진(`SD2.health()`) | `?check=1`(빠른 판)·`?health=1`·호출할 때만(학생 접속 0바이트) |
| `v2/games/registry.js` | 게임 허용 목록(`?game=<id>`) | 게임을 켤 때만 |
| `v2/games/_template.js` | 새 게임 틀(개발용 수용 시험) | `?game=_template` |

- **단일 출처**: 길격자는 main.js의 `groundAt`·`blockedAt`(플레이어 물리와 같은 함수)를 주입받아 짓는다. 도달성 게이트 `reach()`도 이 격자를 쓴다 → "게이트는 통과인데 게임 격자는 다름"이 없다.
- **world.js는 거의 안 건드린다**: 구역·충돌·문·hotspots는 buildWorld가 돌려준 것을 읽기만 한다(구역은 제자리에서 id 등을 덧붙임). 실제 맵 버그 수정만 world.js에 따로 커밋했다(§8).
- 좌표: x = 동(+), z = 남(+), m. y = 발 높이. **방위 h(°)**: 0 = 북(-z), 90 = 동(+x) — 촬영 규약과 같다. `camYaw = -h·π/180`.

## 2. 구역(zones)

`world.zones` 원소마다 `{ id, kind, bldg, floor, indoor, tags, y0, y1, area, cx, cz }`가 붙는다(제자리 — 참조 유지).

- kind: classroom·special·office·corridor·hall·stair·toilet·storage·service·gym·stage·yard·path·field·play·garden
- bldg: main·west·cafe·link·east·gym·null(바깥) · floor: y ≥ 3 → 2 · tags: `staff`(교직원 공간 — 보물·술래 기본 제외)·`entry`·`covered`·`kinder`·`water`·`car`
- 높이 띠 기본 y±1.2 (`계단`은 -0.3~3.35 — 반층 참도 '계단')
- **판정 = 반열린 구간(x0 ≤ x < x1) + 높이 띠, 여럿이면 가장 좁은 구역.** 겹침 순서에 흔들리지 않는다(위치 칩 `📍`도 이 규칙).
- **덧붙인 넓은 구역(EXTRA_ZONES 19개)**: 앞뜰 잔디 둔덕·서쪽 대지·북쪽 둘레길·뒷길(북)·급식동 뒤·노란 창고 옆·텃밭 앞 길·텃밭 동쪽·본관 동쪽 끝·동쪽 통학로(철망 옆 띠)·동쪽 가장자리·운동장 서쪽 띠·남쪽 마당·정문·체육관 화장실 2칸·조리실 앞·2층 계단홀. 학교 안 걷는 칸 중 구역 없는 칸 **29.4% → 0%**.
- 월드 라벨이 바뀌거나 새 구역이 생기면 `mapmeta.js` 표를 같이 고친다. 안 고치면 월드는 뜨고(`id = 'z-라벨'`, tags `nometa`) `check()`가 ⚠️로 알린다(병행 작업본 합칠 때 확인).

## 3. 지점(POI) — 게임이 문자열로 부른다

| id | 뜻 |
|---|---|
| `zone:<id>` (또는 `zone:<라벨>`) | 구역 입구점 — 중심에서 나선으로 찾은 '가구에 안 걸리는 칸', 길격자가 서면 구역 안 가장 가까운 칸으로 다듬음 |
| `lm:<id>` | 표지점 15곳(정문·셔틀버스·큰 나무·게양대·운동장 개수대·놀이터·텃밭 쉼터·노란 창고·무지개 쉼터·구령대·숲놀이터·유치원 놀이터·남쪽 놀이 마당·텃밭·주차장) — `stand` = 사람이 서는 칸 |
| `spawn:<id>` | 출발점 12곳(default·gate·front-walk·field-center·center-lobby·gym·corridor-2f·playground·red·blue·garden·corridor-main) — 방위 포함 |
| `hot:<kind>:<zoneId>:<n>` | 기존 상호작용(E키) 77곳 |
| `door:<n>` | 문 57개 — `zones:[한쪽, 다른쪽]` |
| `game:<owner>:<n>` | 게임이 더한 지점 |

## 4. API — `SD2.map` (게임은 범위 파사드 `map`을 받는다)

```js
map.zones · map.zone(id|라벨) · map.zoneAt(x,y,z) · map.zonesWhere({kind,kinds,tags,notTags,indoor,floor,bldg,zones}) · map.inZone(z,x,y,z)
map.poi(id) · map.pois({src,zone,tag}) · map.resolve(대상) → {x,y,z}      // 대상 = 노드|[x,z]|[x,y,z]|{x,y,z}|'spawn:…'|'zone:…'|'lm:…'|'hot:…'|'door:…'
map.findEntry(cx,cz,바닥y,[x0,z0,x1,z1]?)                                 // 가구에 안 걸리는 칸(수 ms, 길격자 불필요)
map.q.groundAt / blocked / ceilAt / floorY(x,z,층) / ray(a,b,{ignoreNc,minH}) / los / inSchool(x,z) / indoor(x,y,z) / moveBody(p,dx,dz)
map.player.get() → {x,y,z,h,ground,zone} · teleport(대상,{h,floor}) · face(h) · lookAt(대상) · freeze(on) · speed(0.5~2) · unstick()(3m 안 걷는 칸으로)
map.on(type,fn) → off · map.once(type,fn)       // 'zone'{prev,next}(10Hz·2표본 확정·경계 0.25m 머묾) · 'interact'{hot} · 'tick'{dt} · 'time' · 'teleport' · 'stuck'{x,y,z} · 'gamestart' · 'gamestop'
map.interact.add({x,y,z,r,label,use(h),once}) → {remove} · interact.enable(kind|fn, on) · interact.list({kind,zone})
map.trigger.add({x,y,z,r} | {rect:[x0,z0,x1,z1],y0,y1}, {enter,exit,once}) → {remove}   // 10Hz — r ≥ 0.8 권장(달리기 7.5m/s)
map.collider.add({x0,x1,y0,y1,z0,z1},{ns}) → {remove}   // 길격자엔 안 들어감 → nav.block을 같이
map.arena.set('school' | {rect} | {poly} | null)        // 소프트 경계: 밖에 0.25초 넘게 있으면 마지막 안전 지점으로(게임 중 기본 'school')
map.hud.toast(글, 초) · banner(글, 초) · chip(키, 글|null) · ask(제목, 보기[]) → Promise<번호>   // 문항은 교사 승인 데이터만
map.mk.marker(x,y,z,{color,beam}) · mk.trail(pts,{color,width}) · mk.many(kind,n,{color}) · mk.add(obj)
map.nav(opt) → Promise<Nav> (크롬북용 6ms씩 나눠 짓기·캐시) · map.navSync(opt)
   Nav: path(a,b,{forbidTags,avoidTags,avoidMul,allowOutside,smooth,maxExp}) → {ok,len,pts,nodes,reason} · random({kinds,tags,notTags,indoor,floor,bldg,zones,minClear,farFrom,rng}) → [x,y,z]
        snap(x,y,z,r) · node(대상) · pos(i) · zoneOf(i) · distField(a,maxLen) · block(rect|구역id) → {remove} · export()
map.mapData(층) → {bounds, boundary, buildings, zones, landmarks, spawns} · map.drawMap(ctx2d, {floor,scale,x0,z0,labels,player,marks}) · map.coverage()
map.rng(seed) (mulberry32) · map.store.get/set (localStorage 'sm2.game.<id>.' · 쓰기 2초마다 몰아서)
map.play = { field, ball, track:{c,a,b,half,gates}, redlight:{startZ,finish}, y }   // 운동장 놀이판(달리기·공·무궁화 신호등) — SCHOOL 운동장 사각형에서 계산, check()가 트랙·출발선이 전부 걷는 칸인지 본다
SD2.map.stuckLog — 이동키를 누른 채 1.5초 못 움직이고 몸이 충돌 상자 속이던 자리(최대 50) · map.spawns
SD2.map.check() → {ok, zonesNoMeta, metaNoZone, dupIds, extraBad, spawnsBad, poisBad, hotUnreachable, playBad, traps, outsidePct, noZoneInSchoolPct}
SD2.map.game.load(id, params) / stop() / current   ·  SD2.camPose(…) (3인칭 카메라 식) · SD2.phys{groundAt,blockedAt,ceilAt,camHit} · SD2.CTRL{frozen,speed}
```

- 표식(marker)은 **InstancedMesh 풀 2개**(다이아몬드·빛기둥, 64개까지)라 몇 개를 띄워도 드로우콜 +2. `many`는 종류마다 +1. 게임 몫은 합쳐 **+15콜 이하**(지금 최대 181/200).
- 게임 소품은 월드 면과 같은 평면에 두지 않는다(5cm 이상 띄움 — 깜빡임). 조명은 새로 만들지 않는다(표식은 MeshBasic).

## 5. 게임 계약(`?game=<id>`)

```js
// v2/games/registry.js
export const GAMES = { _template: { title: '게임 틀(개발용)', v: 1, dev: true } };   // v = 게임 파일 버스터(이 파일은 매번 새로 받는다)
// v2/games/<id>.js
export const meta = { id, title, api: 1 };
export default async function start(map, params) { …; return { tick(dt) {}, stop() {} }; }
```
- id 규칙 `/^[a-z_][a-z0-9-]{0,31}$/` · 레지스트리에 없으면 거절 · `meta.api !== 1`이면 거절.
- `map` = 그 게임 전용 **범위 파사드**: 게임이 만든 이벤트·지점·트리거·충돌·표식·HUD·막기·경계·멈춤을 기록했다가 `stop` 때 자동 정리(DOM 리스너처럼 파사드 밖 자원만 게임이 직접).
- `start`·`tick` 예외 → 게임만 멈추고 토스트 '게임에 문제가 생겨 멈췄어요' — 월드 루프는 계속. tick 평균이 2초 창에서 1ms를 넘으면 `console.warn('게임 예산 초과')`. fps 칩에 `game x.xxms`.
- **게임 파일은 import 금지**(three 포함 — `map.three`로): 버스터가 다르면 모듈이 두 벌이 된다. 사람 NPC·인물 대사 금지(술래·목표는 장소·물건·공·신호등). 문항·안내문은 교사 승인 데이터만.
- 수용 시험(09-24 통과): `?game=_template` → 칩·표식 뜸 → 목표로 teleport + `SD2.step(20)` → 도착 처리 → `stop()` 뒤 HOT 길이·칩 원래대로(표식 풀 메시 2개만 숨김 상태로 남음).

## 6. 맵 건강 검진 — `SD2.health(opt)` → Promise<보고서>

플레이어와 같은 함수·같은 길격자로 잰다. `?check=1`이면 **빠른 판**이 자동으로 돌아 한 줄(🩺)을 남긴다.

| 항목 | 빠른 | 전체 | 게이트/래칫 |
|---|---|---|---|
| 걷기·점프 그래프, 갇힘(점프로도 못 돌아옴) | ✓ | ✓ | 게이트 0 |
| 울타리 밖 걷는 칸(학교 둘레 다각형 밖) | ✓ | ✓ | 게이트 0 |
| 옥상(점프 포함 그래프) | ✓ | ✓ | 게이트 0 |
| 문 그래프(문 양쪽 0.9m 칸 사이 6m 안 경로 ≤ 4m) | ✓ | ✓ | 게이트 0 |
| 상호작용 지점(닿는 칸·앉았다 일어날 때 끼임·미끄럼틀 끝) | ✓ | ✓ | 게이트 0 |
| 구역 없는 칸 % · 월드 구역 겹침 · 가려진 구역(자기 칸 < 40) | ✓ | ✓ | 게이트 ≤5% · 래칫 |
| 올라서기 금지 무력화(점프로만 닿는 NS 윗면) · 올라앉는 곳 · 계단 턱 | ✓ | ✓ | 래칫 |
| 보이는 기하 복셀화 → 보이지 않는 벽 · 뚫림(ghost) · 발 묻힘 · 떠 있음 · 바닥 없음 |  | ✓ | 게이트 0 / 래칫 |
| 3인칭 카메라 벽 뚫림(SD2.camPose — 실제 카메라와 같은 식) |  | ✓ | 게이트 ≤0.3%(기본 피치) |
| 문 직진(진짜 SD2.step, 플레이어 되돌림) |  | ✓ | 보고 |
| 구역 닻 3인칭 4방향 렌더 성능(1366×610) |  | ✓(`perf:false`로 끔) | 삼각형 ≤15만 · 콜 ≤200 |
| 그림(위에서 본 지도 walk·issues PNG dataURL) |  | `img:true` | — |

- 기준선(`BASELINE`)·허용목록(`ALLOW` — 항목마다 why 필수)은 `health.js` 맨 위. **합친 뒤 다시 재서 갱신**한다.
- 실행: `node …/harness.mjs --url "http://localhost:8001/v2/?check=1" --out <폴더> --eval "(async()=>JSON.stringify((await SD2.health({img:true})).counts))()"` (전체 판 ≈2초)

## 7. 지금 값(09-24 · impl-gamemap)

- 길격자 216,267칸(0.3m) · 빌드 ≈0.4초(맥 헤드리스) · 운동장 출발 → 2층 6학년 A* 길이 108m·펴진 점 20개 · 도달성 80구역 통과(월드 61 + 덧붙인 19 — 체육관 화장실 2칸은 한 라벨).
- 🩺 빠른 판: 갇힘 0 · 옥상 0 · 구역 없음 0% · 올라서기 금지 무력화 **25 → 0** · 문 그래프 1(급식 조리실 뒷문) · 지점 1(나래반 가운데 자리 앉기) · 울타리 밖 54,186칸(정문).
- 전체 판: 카메라 벽 뚫림(기본 피치) **1.06% → 0.46%**(벽 뒤 214 → 27) · 보이지 않는 벽 514간선(대각 울타리 통짜 AABB 430 + 골대·나무 줄기) · 최악 구역 14.4만 삼각형/177콜.

## 8. 이번에 고친 실제 맵 버그 / 남긴 것(담당 구간)

고침:
- **CAM-3(main.js)**: 3인칭 카메라가 벽 0.8m 안에서 0.5m 하한 때문에 벽 뒤로 가던 것 → 벽 앞 0.12까지만 당기고 캐릭터 숨김, 옆벽은 근평면 반폭+8cm만큼 비켜 섬(시선도 같이). 검진과 실제 카메라가 `camPose` 한 식을 쓴다. 지터(프레임 간 이동량)는 복도·문·계단·체육관 9개 동선에서 예전과 같은 수준(최대 0.07→0.10m 1곳).
- **NS-RAISE(world.js 끝 패스)**: NS 상자(1.6)가 옆의 낮은 딛을 곳(벤치·계단·턱)을 밟고 점프하면 올라서지던 25곳 → 1m 안 딛을 곳 윗면 + 1.6까지 보이지 않는 윗부분을 올린다(nc — 카메라 무시). 새 NS에도 자동 적용. `noStand()`에 `ns` 표시 한 줄.
  - 막이 3개(리뷰 09-24 — 합치면 매단 TV 머리 막이가 2층 슬래브를 뚫고 2층 바닥에 0.4m 턱): ① 밑을 받치는 바닥·윗면보다 0.6 넘게 뜬 매단 상자는 건너뜀 ② 새 윗면 ≤ 발자국 위 천장·슬래브·지붕 밑면 − 0.01 ③ 딛을 곳은 층 바닥에서 점프로 닿는 윗면만(`d.y1 − floorOf(d) ≤ 1.52`, floorOf = main.js gndOf 규칙).
- **보건실 책상(world.js 1줄)**: 책상이 문 바로 뒤를 막아 보건실에 걸어 들어갈 수 없었다(걷는 칸 2개). 책상을 문 서쪽으로 1.8m 비킴.

남김(다른 구간 담당 — 합친 뒤 이 검진으로 다시 잰다):
- 정문 틈으로 학교 밖 도로·동네로 걸어 나감(걷는 칸 19%) · 대각 남쪽 울타리 충돌이 통짜 AABB라 보이지 않는 벽 최대 6m → **south_plaza_gate** 과제 0·1번. 게임 중에는 `arena('school')`가 막는다.
- 급식 조리실 뒷문(-4.5,-54) 안쪽 조리대가 문을 막음 → **backyard**(급식동 북벽 z 이동 과제와 함께).
- 화장실 문 2곳 직진 끼임(16.5·22.25, 그래프 경로는 있음) → **main_corridor**(화장실 문 4개 재배치 과제).
- 나래반 가운데 자리 '앉기'(-30.8,-41.5): 책상 줄 사이 틈 0.18m라 0.3m 격자로는 못 닿음 → **classrooms**(westClass 책상 간격).
- 뚫리는 회양목·소나무·놀이기구(ghost 461칸)·골대 그물·나무 줄기 충돌 크기 → 각 구간(앞뜰·놀이터·운동장).
- 카메라 남은 0.46%: 가는 기둥(쉼터·나무 줄기) 옆 근평면 모서리 — 모서리 광선 당기기는 떨림 위험이 있어 보류.
