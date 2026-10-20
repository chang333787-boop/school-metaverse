// 봇 부하 시험 — 봇 여럿이 원을 그리며 초당 15번 위치를 보내고, 지연·끊김을 잼.
// 쓰는 법: node bots.mjs <주소> <방 이름> <봇 수> [초]
//   예) node bots.mjs ws://127.0.0.1:8787 test 30
//       node bots.mjs wss://sm-rooms.<이름>.workers.dev test 30
import WebSocket from 'ws';
import { performance } from 'node:perf_hooks';

const [, , base = 'ws://127.0.0.1:8787', room = 'test', nArg = '30', secArg = '30'] = process.argv;
const N = Math.max(1, Math.min(40, Number(nArg) || 30));
const SEC = Math.max(5, Number(secArg) || 30);
const URL_ = base.replace(/\/+$/, '') + '/room/' + room;
const ORIGIN = 'http://localhost';    /* 서버가 받아 주는 Origin(시험용) */
const POS_HZ = 15;
const PING_MS = 500;
const WARM_MS = 2000;                 /* 다 들어온 뒤 이만큼은 재지 않음 */
const HITCH_MS = 150;                 /* 스냅샷 간격이 이보다 길면 '끊김'(보간 100ms + 박자 50ms를 넘김) */

const rtts = [], gaps = [];
let hitches = 0, snaps = 0, snapBytes = 0, sent = 0, drops = 0, fulls = 0, joined = 0;
let measuring = false, ending = false;
const bots = [];

function pct(a, p) {
  if (!a.length) return NaN;
  const s = [...a].sort((x, y) => x - y);
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))];
}
const f1 = (v) => (Number.isFinite(v) ? v.toFixed(1) : '-');

function makeBot(i) {
  const b = { i, ws: null, lastS: 0, timers: [], ok: false };
  const ws = new WebSocket(URL_, { origin: ORIGIN });
  b.ws = ws;
  const send = (o) => { if (ws.readyState === 1) { ws.send(JSON.stringify(o)); if (measuring) sent++; } };
  ws.on('open', () => send({ t: 'j', id: 'bot' + i, n: '봇' + i }));
  ws.on('message', (buf) => {
    const now = performance.now();
    let d; try { d = JSON.parse(buf.toString()); } catch (e) { return; }
    if (d.t === 'w') {
      b.ok = true; joined++;
      const phase = (i / N) * Math.PI * 2;
      const r = 6 + (i % 5) * 3;
      const w = 0.6 + (i % 7) * 0.1;      /* 봇마다 도는 빠르기가 조금씩 다름 */
      const t0 = performance.now();
      /* 보내는 때를 봇마다 흩어 한꺼번에 몰리지 않게 */
      setTimeout(() => {
        b.timers.push(setInterval(() => {
          const t = (performance.now() - t0) / 1000;
          const a = phase + t * w;
          send({ t: 'p', x: Math.cos(a) * r, y: 0, z: Math.sin(a) * r, h: a + Math.PI / 2, s: 1 });
        }, 1000 / POS_HZ));
        b.timers.push(setInterval(() => send({ t: 'ping', c: performance.now() }), PING_MS));
      }, Math.random() * (1000 / POS_HZ));
    } else if (d.t === 's') {
      if (measuring) {
        snaps++; snapBytes += buf.length;
        if (b.lastS) { const g = now - b.lastS; gaps.push(g); if (g > HITCH_MS) hitches++; }
      }
      b.lastS = now;
    } else if (d.t === 'pong') {
      if (measuring) rtts.push(now - d.c);
    } else if (d.t === 'full') {
      fulls++; console.log(`봇${i}: ${d.m}`);
    }
  });
  ws.on('close', (code) => {
    b.timers.forEach(clearInterval);
    if (!ending) { drops++; console.log(`봇${i} 연결 끊김(코드 ${code})`); }
  });
  ws.on('error', (e) => { if (!ending) console.log(`봇${i} 오류: ${e.message}`); });
  return b;
}

console.log(`봇 ${N}명 · ${SEC}초 · ${URL_}`);
for (let i = 0; i < N; i++) setTimeout(() => bots.push(makeBot(i)), i * 40);

const startWait = performance.now();
const waitAll = setInterval(() => {
  const waited = performance.now() - startWait;
  if (joined >= N || waited > 15000) {
    clearInterval(waitAll);
    if (joined < N) console.log(`들어온 봇 ${joined}/${N}명으로 잼`);
    setTimeout(() => {
      for (const b of bots) b.lastS = 0;
      measuring = true;
      const t0 = performance.now();
      setTimeout(() => finish(performance.now() - t0), SEC * 1000);
    }, WARM_MS);
  }
}, 100);

function finish(ms) {
  measuring = false; ending = true;
  for (const b of bots) { b.timers.forEach(clearInterval); try { b.ws.close(1000); } catch (e) { /* 이미 닫힘 */ } }
  const s = ms / 1000;
  const reqs = Math.round(sent / 20) + N;
  console.log('──────── 결과 ────────');
  console.log(`RTT        중앙값 ${f1(pct(rtts, 50))}ms · 95% ${f1(pct(rtts, 95))}ms · 최대 ${f1(Math.max(...rtts))}ms (${rtts.length}번)`);
  console.log(`스냅샷 간격 중앙값 ${f1(pct(gaps, 50))}ms · 95% ${f1(pct(gaps, 95))}ms · 최대 ${f1(Math.max(...gaps))}ms`);
  console.log(`끊김(간격 > ${HITCH_MS}ms) ${hitches}번 · 봇 한 명 1분에 ${f1(hitches / N / (s / 60))}번`);
  console.log(`받은 스냅샷 ${snaps}개(봇 한 명 초당 ${f1(snaps / N / s)}개 · 평균 ${Math.round(snapBytes / Math.max(1, snaps))}바이트)`);
  console.log(`보낸 메시지 ${sent}개(초당 ${Math.round(sent / s)}개) → 요청 어림 ${reqs}건(20개 = 1건 + 연결 ${N}건)`);
  console.log(`도중 끊긴 연결 ${drops} · 꽉 참 ${fulls}`);
  setTimeout(() => process.exit(0), 300);
}
