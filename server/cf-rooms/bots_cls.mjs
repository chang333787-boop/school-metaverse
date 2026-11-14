// 반 방 봇 시험(CLASS-MP-C · 11-14) — 시험 반 zz…에 번호 1~N 판을 /save로 만들고 답의 입장표로 반 방에 들어가 걸음을 잼 · 끝나면 /drop으로 모두 지움
// 쓰는 법: node bots_cls.mjs <주소 https://…> [반 코드=zzcmp30] [봇 수=30] [초=180] [초당 보내는 수=4]
//   봇은 이름을 보내지 않음(n = 빈 글) · 핀은 가짜 · 판은 최소({zz:1}) · 교사 열쇠는 만들지 않음(스위치 처음 = 켬)
//   잼: 들어감(n/n · {t:'w'}) · 닫는 코드 4003/4004/4005 · 보임(마지막 2초 안에 서로의 걸음을 받은 짝) · 지연(보낸 때 → 받은 때 · s 칸에 보낸 시각) · 멈칫(같은 친구 걸음 사이가 보내는 간격 + 250ms 넘음 · 30초마다)
//        오차(받은 자리와 그 순간 진짜 자리 · m) · 도중 끊김 · /save·/drop 답 오류 · 이 맥 부하 → 끝에 같은 번호 다른 연결(4005 + 나머지가 {t:'l'})
import WebSocket from 'ws';
import os from 'node:os';
import { performance } from 'node:perf_hooks';

const [, , baseArg = '', clsArg = 'zzcmp30', nArg = '30', secArg = '180', hzArg = '4'] = process.argv;
if (!/^https?:\/\//.test(baseArg) || !/^zz[a-z0-9]{2,6}$/.test(clsArg)) { console.log('쓰는 법: node bots_cls.mjs <https://주소> [zz반코드] [봇 수] [초] [초당]'); process.exit(2); }
const BASE = baseArg.replace(/\/+$/, ''), WSB = BASE.replace(/^http/, 'ws'), CLS = clsArg, N = Math.max(2, Math.min(40, +nArg || 30)), SEC = Math.max(10, +secArg || 180), HZ = Math.max(1, Math.min(10, +hzArg || 4));
const ORIGIN = 'http://localhost', PIN = n => String(1000 + n * 7).slice(-4), IVL = 1000 / HZ, STALL = IVL + 250, T0 = performance.now();
const api = async (p, body) => { try { const r = await fetch(BASE + p, { method: 'POST', headers: { Origin: ORIGIN, 'content-type': 'application/json' }, body: JSON.stringify(body) }); let j = null; try { j = await r.json(); } catch (e) { j = null; } return { st: r.status, j }; } catch (e) { return { st: 0, j: null }; } };
const pct = (a, p) => { if (!a.length) return NaN; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p / 100 * s.length))]; };
const mx = a => a.reduce((m, v) => (v > m ? v : m), -Infinity);   /* 큰 배열에 Math.max(...a)는 스택이 넘침 */
const f1 = v => (Number.isFinite(v) ? v.toFixed(1) : '-');
const truePos = (i, t) => { const a = (i / N) * Math.PI * 2 + t * (0.6 + (i % 7) * 0.1), r = 6 + (i % 5) * 3; return [Math.cos(a) * r, Math.sin(a) * r]; };   /* t = T0부터 초 */

let apiErr = 0, measuring = false, ending = false, mStart = 0; const lat = [], err = [], codes = {}, stallBy = [], loads = [];
console.log(`반 방 봇 ${N}명 · ${SEC}초 · 초당 ${HZ}번 · 시험 반 ${CLS}`);
const T = [];
for (let n = 1; n <= N; n++) { const r = await api('/save/' + CLS + '/' + n, { pin: PIN(n), data: { zz: 1 } }); if (r.st !== 200 || !r.j || !r.j.mp || !r.j.mp.tk) { apiErr++; T.push(null); } else T.push(r.j.mp); }
const RN = T.find(Boolean) && T.find(Boolean).r;
console.log(`입장표 ${T.filter(Boolean).length}/${N} · 반 방 ${RN ? RN.slice(0, 2) + '…' : '없음'} · /save 오류 ${apiErr}`);

function bot(i, tk, id) {
  const b = { i, id, ws: new WebSocket(WSB + '/room/' + RN, { origin: ORIGIN }), ok: false, last: new Map(), timers: [], code: 0, l: [] };
  b.ws.on('open', () => b.ws.send(JSON.stringify({ t: 'j', id, n: '', k: 'kid', c: i % 10, a: 't:다7', tk })));
  b.ws.on('message', (buf) => { const now = performance.now(); let d; try { d = JSON.parse(buf.toString()); } catch (e) { return; }
    if (d.t === 'w') { b.ok = true; setTimeout(() => b.timers.push(setInterval(() => { if (b.ws.readyState !== 1) return; const t = (performance.now() - T0) / 1000, [x, z] = truePos(i, t); b.ws.send('{"t":"p","x":' + (x / 4).toFixed(2) + ',"y":0,"z":' + (z / 4).toFixed(2) + ',"h":100,"s":' + (Math.round(performance.now()) % 100000000) + '}'); }, IVL)), Math.random() * IVL); }
    else if (d.t === 's' && measuring) { const nowI = Math.round(now) % 100000000, slot = Math.floor((now - mStart) / 30000);
      for (const p of d.P) { if (p[0] === id) continue; const j = +String(p[0]).replace(/\D/g, '') - 1, pv = b.last.get(p[0]);
        if (pv && now - pv > STALL) stallBy[slot] = (stallBy[slot] || 0) + 1; b.last.set(p[0], now);
        let L = nowI - p[5]; if (L < 0) L += 100000000; if (L < 10000) lat.push(L);
        const [tx, tz] = truePos(j, (now - T0) / 1000); err.push(Math.hypot(p[1] * 4 - tx, p[3] * 4 - tz)); } }
    else if (d.t === 'l') b.l.push(d.id); });
  b.ws.on('close', (c) => { b.code = c; codes[c] = (codes[c] || 0) + 1; b.timers.forEach(clearInterval); if (!ending && !b.expect) console.log(`봇${i + 1} 닫힘 ${c}`); });
  b.ws.on('error', () => {});
  return b;
}
const bots = [];
for (let i = 0; i < N; i++) { if (T[i]) bots.push(bot(i, T[i].tk, 'cb' + (i + 1))); await new Promise(r => setTimeout(r, 40)); }
for (let k = 0; k < 150 && bots.filter(b => b.ok).length < bots.length; k++) await new Promise(r => setTimeout(r, 100));
const joined = bots.filter(b => b.ok).length;
await new Promise(r => setTimeout(r, 2000));
measuring = true; mStart = performance.now();
const ld = setInterval(() => loads.push(os.loadavg()[0]), 5000);
await new Promise(r => setTimeout(r, SEC * 1000));
const now = performance.now(); let seen = 0, pairs = 0;
for (const b of bots) for (const o of bots) if (o !== b) { pairs++; const t = b.last.get(o.id); if (t && now - t < 2000) seen++; }
measuring = false; clearInterval(ld);
const CM = { ...codes }, dropsMid = Object.entries(codes).reduce((a, [c, n]) => a + n, 0);
/* 같은 번호 다른 연결 — 1번 표로 새 id가 들어옴 → 옛 1번 4005 · 나머지가 {t:'l', id:'cb1'} */
const old = bots[0]; old.expect = true; const nb = bot(0, T[0].tk, 'cb1x'); nb.expect = true;
for (let k = 0; k < 50 && !old.code; k++) await new Promise(r => setTimeout(r, 100));
await new Promise(r => setTimeout(r, 800));
const gotL = bots.slice(1).filter(b => b.l.includes('cb1')).length;
ending = true; for (const b of [...bots, nb]) { b.timers.forEach(clearInterval); try { b.ws.close(1000); } catch (e) { /* */ } }
await new Promise(r => setTimeout(r, 800));
/* 지우기 */
let dropped = 0, left = 0;
for (let n = 1; n <= N; n++) { const r = await api('/drop/' + CLS + '/' + n, { pin: PIN(n) }); if (r.st === 200 && r.j && r.j.ok) dropped += r.j.dropped ? 1 : 0; else apiErr++; }
for (let n = 1; n <= N; n++) { const r = await api('/load/' + CLS + '/' + n, { pin: PIN(n) }); if (!(r.st === 200 && r.j && r.j.none)) left++; }
const st30 = []; for (let s = 0; s < Math.ceil(SEC / 30); s++) st30.push(stallBy[s] || 0);
console.log('──────── 결과 ────────');
console.log(`들어감 ${joined}/${N} · 재는 동안 닫힘 ${dropsMid} · 4003 ${CM[4003] || 0} · 4004 ${CM[4004] || 0} · 4005 ${CM[4005] || 0}(재는 동안)`);
console.log(`보임 ${seen}/${pairs}(마지막 2초 안) · 지연 중앙 ${f1(pct(lat, 50))}ms · 90% ${f1(pct(lat, 90))}ms · 최대 ${f1(mx(lat))}ms(${lat.length}개)`);
console.log(`멈칫(같은 친구 걸음 사이 > ${STALL}ms) 30초마다 ${st30.join(' · ')} · 짝 하나 1분에 ${f1(st30.reduce((a, b) => a + b, 0) / Math.max(1, pairs) / (SEC / 60))}번`);
console.log(`오차(받은 자리 ↔ 받은 순간 진짜 자리) 중앙 ${f1(pct(err, 50))}m · 90% ${f1(pct(err, 90))}m · 이 맥 부하 평균 ${f1(loads.reduce((a, b) => a + b, 0) / Math.max(1, loads.length))} · 최대 ${f1(mx(loads))}`);
console.log(`같은 번호 다른 연결: 옛 1번 닫는 코드 ${old.code} · {t:'l'} 받은 봇 ${gotL}/${bots.length - 1}`);
console.log(`지움 ${dropped}/${N} · 남은 판 ${left} · 서버 답 오류 ${apiErr}`);
const pass = joined === N && dropsMid === 0 && old.code === 4005 && gotL === bots.length - 1 && dropped === N && left === 0 && apiErr === 0;
console.log(pass ? 'PASS' : 'FAIL'); setTimeout(() => process.exit(pass ? 0 : 1), 300);
