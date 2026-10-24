# sm-rooms — 실시간 방 서버 시험판(NET-CF 1단계)

학교 메타버스 함께하기·별빛 아레나 대전이 '순간이동'처럼 보이지 않게, Firebase 실시간 DB 대신 쓸 **Cloudflare Workers + Durable Objects 웹소켓 방 서버**예요. 방 하나 = Durable Object 하나예요. 정본 설계는 `docs/systems/town_kickoff_1024.md` §2-2예요.

## 파일
| 파일 | 하는 일 |
|---|---|
| `src/index.js` | Worker(문지기) + `Room` Durable Object(방) |
| `wrangler.toml` | 이름 `sm-rooms` · DO 묶음 `ROOMS` · SQLite 방식 migration · 자체 한도 값 |
| `test.html` | 시험 쪽. 내 점(방향키·누르기)과 다른 사람 점 · 지연·끊김 숫자 |
| `bots.mjs` | 봇 부하 시험. `node bots.mjs <주소> <방> <봇 수> [초]` |

## 로컬에서 돌리기(로그인 필요 없음)
```sh
cd server/cf-rooms
npm install
npx wrangler dev --port 8787              # ws://127.0.0.1:8787/room/<방이름>
node bots.mjs ws://127.0.0.1:8787 test 30 # 다른 창에서 · 30초 재고 숫자 출력
python3 -m http.server 8011               # 또 다른 창 → http://127.0.0.1:8011/test.html
```
시험 쪽 주소 꼬리: `?s=서버주소&r=방이름&n=내이름&auto=1`

## 배포
```sh
npx wrangler login    # 브라우저 승인 창 → 선생님이 '허용'(비밀번호를 코드에 넣지 않음)
npx wrangler deploy   # → https://sm-rooms.<이름>.workers.dev
node bots.mjs wss://sm-rooms.<이름>.workers.dev test 30
```
지금 주소: **https://sm-rooms.sm-rooms.workers.dev**(10-20 첫 배포 · workers.dev 하위 이름 `sm-rooms`는 첫 배포 때 wrangler가 저절로 등록 · 대시보드 Workers > Subdomain에서 바꿀 수 있음).
비밀값은 저장소에 넣지 않아요(로그인 정보는 `~/Library/Preferences/.wrangler`에만 · `.dev.vars`는 `.gitignore`에 있음).

## 잰 숫자(10-20 · 봇 30명 · 30초 · 초당 15번 보내기)
| | RTT 중앙값 | RTT 95% | 스냅샷 간격 95% | 간격 최대 | 끊김(>150ms) |
|---|---|---|---|---|---|
| 로컬(`wrangler dev`) | 1.1ms | 5.1ms | 51.9ms | 68.4ms | 0 |
| 배포(도쿄 엣지 · 이 맥의 엣지 왕복 약 50ms) | 48.7ms | 91.8ms | 52.7ms | 149.9ms | 0 |

봇 한 명만 재면 RTT 중앙값 47.8ms · 95% 50ms로 엣지까지 왕복과 같아요(서버가 더하는 지연은 거의 없음). 30명일 때 95%가 92ms로 느는 까닭(방 하나가 초당 510개를 받아 바쁨인지 망 흔들림인지)은 아직 가르지 못했어요. 로컬 30명은 95%가 5ms라 봇 프로그램 몫은 작아요. 교실 와이파이에서 크롬북으로 한 번 더 재야 해요.

## 주고받기(JSON · 짧은 키)
| 보내는 쪽 | 모양 | 뜻 |
|---|---|---|
| 나 → 서버 | `{t:'j', id, n}` | 들어오기(id 영문·숫자·`_-` 16자 · 이름 12자) |
| 나 → 서버 | `{t:'p', x, y, z, h, s}` | 내 자리·방향·상태 |
| 나 → 서버 | `{t:'e', ...}` | 사건. 다른 사람에게 그대로 가고 서버가 보낸 이 `f`를 붙여요(`all:1`이면 나도 받음) |
| 나 → 서버 | `{t:'ping', c}` | 지연 재기 → `{t:'pong', c, ts}` |
| 서버 → 나 | `{t:'w', id, ts, L, P}` | 들어온 나에게 방 전체(`L` 이름 목록 · `P` 자리 목록) |
| 서버 → 나 | `{t:'s', ts, P:[[id,x,y,z,h,s],…]}` | 초당 20번. 그사이 움직인 사람만. 아무도 안 움직이면 안 보냄 |
| 서버 → 나 | `{t:'j', id, n}` · `{t:'l', id}` | 누가 들어옴 · 나감 |
| 서버 → 나 | `{t:'full', m}` | 꽉 참(곧 닫힘 · 코드 4002 하루 상한 · 4003 40명) |

## 무료 한도와 자체 한도
**Cloudflare Free(하루 · UTC 0시 = 한국 아침 9시에 새로 시작 · 넘으면 그날만 막히고 0원)**
- Durable Objects 요청 10만 건. 들어오는 웹소켓 메시지는 **20개 = 1건**, 연결 1번 = 1건, 나가는 메시지는 공짜예요.
- 시간 13,000 GB-s(DO 하나 128MB 기준 약 29시간). 휴면 중엔 안 쌓여요.
- SQLite 쓰기 10만 줄 · 읽기 500만 줄 · 저장 5GB. Worker 요청 10만 건.

**이 서버가 스스로 지키는 것**
- Origin: `https://chang333787-boop.github.io`, `http://localhost:*`, `http://127.0.0.1:*`만 받아요. 나머지 403.
- 방 이름: 영문·숫자 4~8자(대소문자는 같은 방). 한 isolate가 10분에 받아 주는 방 이름 50개(대략 막기).
- 방당 40명. 한 사람 초당 메시지 30개(넘으면 버림 · 90개 넘으면 끊음). 메시지 하나 1KB.
- 방 하나 하루 메시지 150만 개(= 요청 7만 5천 건 · 무료의 75%). 넘으면 '오늘은 꽉 찼어요'로 닫아요. 메모리에 세고 10초마다 한 번만 저장해요.
- 박자(50ms)는 `setAlarm`이 아니라 DO 안 타이머로 돌려요. 알람은 한 번마다 요청 1건이라 30명 한 시간에 7만 2천 건을 먹어요. 3초 동안 아무도 안 움직이면 박자를 멈추고 휴면해요.

**30명이 한 시간 놀면(어림)**: 초당 15번 보내기 + 1초 핑이면 메시지 172만 8천 개 = 요청 약 8만 6천 건(하루 무료의 86%) · 시간 450 GB-s(3.5%) · 쓰기 360줄(0.4%). 요청 수가 먼저 닳아요. 움직일 때만 초당 10번 보내면 한 시간 2~3만 건으로 하루 서너 시간까지 돼요.

## 브라우저에서 쓰는 법(조각)
```js
const ws = new WebSocket('wss://sm-rooms.<이름>.workers.dev/room/ban4');
ws.onopen = () => ws.send(JSON.stringify({ t: 'j', id: myId, n: '이름' }));
ws.onmessage = (ev) => {
  const d = JSON.parse(ev.data);
  if (d.t === 's') {
    for (const [id, x, y, z, h, s] of d.P) if (id !== myId) addSample(id, d.ts, x, z, h);
  } else if (d.t === 'l') {
    removePerson(d.id);
  }
};
// 내 몸은 바로 움직이고(예측) 서버에는 움직였을 때만 초당 10~15번 보냄
setInterval(() => { if (moved()) ws.send(JSON.stringify({ t: 'p', x, y, z, h, s: 1 })); }, 1000 / 15);
// 어림한 서버 시각보다 100ms 늦게, 받은 두 자리 사이를 섞어 그림(보간) — test.html의 sampleAt 참고
```

## 마을 함께하기 연결(NET-CF2 · 10-24)
- `v2/js/net.js`가 방에 들어가면 이 서버 방 `m` + 방 이름 해시(영문·숫자 8자)에 웹소켓으로 붙어요. **이름은 보내지 않아요**(`{t:'j', id, n:''}`) — 이름·채팅·선생님 칸·방 번호는 Firebase 그대로예요.
- 움직일 때만 초당 10번 `{t:'p'}`를 보내요. 받은 자리는 서버 시각 100ms 전 자리를 앞뒤 둘 사이에서 섞어 그려요(보간). 웹소켓이 열려 있는 동안 Firebase에는 5초마다 박동만 가요. 끊기면 2·4·8…30초 뒤 다시 붙고, 그사이엔 예전 Firebase 길로 저절로 돌아가요.
- 끄기: 주소 꼬리 `?cf=off` · 로컬 서버: `?cf=http://127.0.0.1:8788` · 홍보판(`SM_PROMO`)은 늘 꺼요.
- 시험: `node tools/harness/net_cf.cjs <포트> deploy` — 두 화면(가짜 Firebase) · 10-24 배포: 보이는 지연 220ms · 오차 0.18m · 튐 0.
- 봇 30명(10-24 · 배포): RTT 중앙 70.4ms · 95% 99.7ms · 스냅샷 간격 95% 57ms · 끊김 2번(30초) · 도중 끊긴 연결 0.

## 이어 하기 저장(SAVE-CF · 10-24)
| 주소(POST · JSON 본문) | 본문 | 답 |
|---|---|---|
| `/load/<반코드>/<번호>` | `{pin}` | `{ok, at, data}` · 없으면 `{ok, none:1}` |
| `/save/<반코드>/<번호>` | `{pin, data}` | `{ok, at}` |
| `/drop/<반코드>/<번호>` | `{pin}` | 내 저장 지우기 |
- 반 코드 = 영문·숫자 4~8자 · 번호 1~40 · 핀 = 숫자 넷(주소에 넣지 않고 본문으로만).
- 반 코드 하나 = Durable Object `Saves` 하나(SQLite 표). 핀은 **소금(비밀값 `PEPPER` + 반 코드 + 번호) + SHA-256 해시만** 둬요. 처음 저장한 핀이 그 번호의 핀이 돼요. 5번 틀리면 1분 잠겨요.
- **이름은 두지 않아요**: 저장 JSON의 `name`·`nick`·`realName` 글 칸은 빼고 받아요(마을 저장에는 원래 이름이 없어요).
- 한도: 저장 하나 256KB · 반 하나 하루 2만 번(넘으면 '오늘은 저장이 꽉 찼어요 — 이 기기에는 남아 있어요').
- 비밀값 넣기: `openssl rand -hex 24 | npx wrangler secret put PEPPER`(10-24에 넣음 · 바꾸면 모든 핀이 틀리게 되니 바꾸지 않아요).
- 마을 쪽: v4 주소에 `?cls=반코드`를 한 번 붙여 열면(예: `…/v4/?cls=ban4a`) 그 기기에 반 코드가 남아요. 번호 + 비밀번호로 들어오면 서버 것이 더 새것일 때 받아 이어 하고, 45초마다·창을 닫을 때 올려요(`v2/games/town_cloud.js`). 서버가 안 되면 이 기기 저장으로 그대로 놀아요.
- 시험: `node tools/harness/town_cloud.cjs <포트>` — 기기 A에서 놀고 → 빈 기기 B에서 같은 번호·비밀번호로 이어지나 · 틀린 비밀번호 막힘 · 끝나면 시험 판(zz) 지움.
- Firebase DB 규칙은 바꾸지 않았어요.
