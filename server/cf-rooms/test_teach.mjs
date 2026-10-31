// 교사 표 서버 흉내 시험(TEACH-1 · 10-31) — 배포·로그인·wrangler 없이 node 하나로: node server/cf-rooms/test_teach.mjs
//   흉내 = mock.mjs(cloudflare:workers 대역 · node:sqlite 메모리 DB) · Worker fetch를 그대로 부름
//   보는 것: 아이 저장 → 요약 칸 · 열쇠 없음 404 · 처음 정하기 · 다른 열쇠 409 · 틀림 다섯 번 = 10분 잠금 · 잠금 풀린 뒤 표 · 요약만(판·핀·이름 X)
//            예전 판(요약 없음) 채우기 · 관리 열쇠 없으면 바꾸기 X · 다른 곳(Origin) 막힘 · 25명 표 크기
import { M, makeEnv, DBS } from './mock.mjs';

let fails = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const ORIGIN = 'http://127.0.0.1:8613';
async function call(env, path, body, origin = ORIGIN) { const r = await M.default.fetch(new Request('https://sm-rooms.test' + path, { method: 'POST', headers: { Origin: origin, 'content-type': 'application/json' }, body: JSON.stringify(body) }), env); const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch (e) { j = null; } return { st: r.status, j, t }; }

/* 아이 판 흉내(마을 GAME.S 꼴 · 이름 칸은 서버가 빼야 함) */
function kidSave(n, o = {}) {
  const st = []; for (let i = 0; i < (o.steps || 6); i++) st.push({ c: 'a1_3', s: 's' + i, h: i === 2 ? 3 : 0, tr: i === 2 ? 4 : 0 });
  st.push({ c: 'a1_1', s: 'why', h: 1, t: n + '번이 쓴 한 줄 — 소방서가 가까우면 빨리 와요' });
  st.push({ c: 'q_park', s: 'jg', h: 0, p: ['b'], w: ['차가 많아요', '아이들이 걸어요'], l: '가게 주인' });
  const big = {}; for (let i = 0; i < (o.pad || 0); i++) big['k' + i] = 'x'.repeat(40);
  return { v: 2, day: 10 + n, money: 1200, name: '진짜이름' + n, nick: '별명', sv: { at: 1761900000000 + n * 1000, n: 40 }, story: { cur: 'a1_3', i: 2, done: { p0: { d1: 1 }, a1_1: { d1: 3 } }, v: {}, paused: null },
    rec: { v: 1, days: { '2026-10-30': { g0: 9, g1: 10, st: [{ c: 'p0', s: 'first', h: 0, p: ['마트'] }], cd: [{ c: 'p0', star: 0 }] }, '2026-10-31': { g0: 11, g1: 12, st, cd: [{ c: 'a1_1', star: 1 }], q: [{ id: 'q1', ok: 1 }, { id: 'q2', ok: 0 }, { id: 'q3', ok: 1 }], help: [{ k: 'paddy', g: 2 }], job: [{ k: 'fire', done: 1 }] } } }, big };
}

console.log('① 아이 저장 → 요약 칸');
const env = makeEnv();
for (const n of [3, 7]) { const r = await call(env, '/save/zzteach/' + n, { pin: '1111', data: kidSave(n) }); ok(r.st === 200 && r.j && r.j.ok, n + '번 저장 ' + r.st); }
{ const row = DBS.get('zzteach').prepare('SELECT num, sum, data FROM s ORDER BY num').all(); ok(row.length === 2 && row.every(q => q.sum && JSON.parse(q.sum).cur[0] === 'a1_3'), '요약 칸이 저장할 때 생김(지금 장 a1_3)'); ok(row.every(q => !/진짜이름|별명/.test(q.data)), '저장에서 이름 칸(name·nick) 빠짐'); }

console.log('② 교사 열쇠');
{ let r = await call(env, '/class/zzteach', { tkey: 'teach123' }); ok(r.st === 404 && r.j && r.j.nokey, '열쇠를 정하기 전 = 404 nokey'); }
{ let r = await call(env, '/tclaim/zzteach', { tkey: '123' }); ok(r.st === 400, '짧은 열쇠(3자) = 400'); r = await call(env, '/tclaim/zzteach', { tkey: 'has space1' }); ok(r.st === 400, '띄어쓰기 든 열쇠 = 400'); }
{ let r = await call(env, '/tclaim/zzteach', { tkey: 'teach123' }); ok(r.st === 200 && r.j.made === 1, '처음 정하기 = made 1'); r = await call(env, '/tclaim/zzteach', { tkey: 'teach123' }); ok(r.st === 200 && r.j.made === 0, '같은 열쇠로 다시 = made 0'); }
{ const h = DBS.get('zzteach').prepare('SELECT h FROM t').get().h; ok(/^[0-9a-f]{64}$/.test(h) && !h.includes('teach123'), '열쇠는 해시로만(64자)'); }
{ let r = await call(env, '/tclaim/zzteach', { tkey: 'kidguess1' }); ok(r.st === 409 && r.j.taken, '다른 열쇠로 정하기 = 409(틀림 1)');
  for (let i = 0; i < 3; i++) { r = await call(env, '/class/zzteach', { tkey: 'wrong00' + i }); ok(r.st === 403 && r.j.bad, '틀린 열쇠 ' + (i + 2) + '번째 = 403'); }
  r = await call(env, '/class/zzteach', { tkey: 'wrong009' }); ok(r.st === 403, '다섯 번째 틀림 = 403(이제 잠금)');
  r = await call(env, '/class/zzteach', { tkey: 'teach123' }); ok(r.st === 423 && r.j.lock, '잠긴 동안은 맞는 열쇠도 423');
  const now0 = Date.now; Date.now = () => now0() + 11 * 60 * 1000; r = await call(env, '/class/zzteach', { tkey: 'teach123' }); Date.now = now0; ok(r.st === 200 && r.j.ok, '10분 뒤 맞는 열쇠 = 200'); }

console.log('③ 표 = 요약만');
{ const r = await call(env, '/class/zzteach', { tkey: 'teach123' }); const L = r.j.L || [];
  ok(L.length === 2 && L[0].n === 3 && L[1].n === 7, '번호 3·7 두 줄');
  const s = L[0].s; ok(!!s && s.cur[0] === 'a1_3' && s.cur[1] === 2 && s.nd === 2 && s.day === 13, '지금 장·끝낸 장 수·게임 날(' + JSON.stringify(s && s.cur) + ' · ' + (s && s.nd) + ')');
  ok(s.rd === '2026-10-31' && s.td.st === 8 && s.td.h3 === 1 && s.td.q === 3 && s.td.qok === 2 && s.td.cd === 1, '마지막 기록 날 한 일(단계 8 · 막힘 1 · 문제 2/3 · 장 1)');
  ok(s.out.length === 2 && s.out[0].l === '가게 주인' && /한 줄/.test(s.out[1].t), '남긴 결과물 = 새것부터(까닭·불편해질 사람 → 한 줄)');
  ok(!/"data"|"pin"|진짜이름|별명|1111/.test(r.t), '답에 판 전체·핀·이름 없음');
  ok(r.t.length < 4000, '두 명 표 크기 ' + r.t.length + '바이트'); }

console.log('④ 예전 판(요약 없음) · 관리 열쇠 · Origin');
{ const db = DBS.get('zzteach'); db.prepare('INSERT INTO s (num, pin, data, at, fails, lock) VALUES (?, ?, ?, ?, 0, 0)').run(12, 'x', JSON.stringify(kidSave(12)), 1761900000000);
  const r = await call(env, '/class/zzteach', { tkey: 'teach123' }); const L12 = (r.j.L || []).find(q => q.n === 12); ok(!!(L12 && L12.s && L12.s.cur), '요약 없던 12번 = 표를 열 때 채움'); ok(!!db.prepare('SELECT sum FROM s WHERE num = 12').get().sum, '채운 요약을 저장해 둠'); }
{ let r = await call(env, '/treset/zzteach', { tkey: 'newkey99', admin: 'anything' }); ok(r.st === 403, '관리 열쇠(ADMIN)를 안 넣은 서버 = 바꾸기 403');
  const env2 = makeEnv({ ADMIN: 'adm-secret-1' }); r = await call(env2, '/treset/zzteach', { tkey: 'newkey99', admin: 'wrong' }); ok(r.st === 403, '틀린 관리 열쇠 = 403');
  r = await call(env2, '/treset/zzteach', { tkey: 'newkey99', admin: 'adm-secret-1' }); ok(r.st === 200 && r.j.reset, '맞는 관리 열쇠 = 교사 열쇠 바꿈');
  r = await call(env2, '/class/zzteach', { tkey: 'teach123' }); ok(r.st === 403, '옛 열쇠는 이제 안 됨'); r = await call(env2, '/class/zzteach', { tkey: 'newkey99' }); ok(r.st === 200, '새 열쇠로 표'); }
{ const r = await call(env, '/class/zzteach', { tkey: 'teach123' }, 'https://evil.example'); ok(r.st === 403, '다른 곳(Origin)에서 = 403'); }
{ const r = await call(env, '/class/x', { tkey: 'teach123' }); ok(r.st === 400, '반 코드 꼴이 틀림 = 400'); }

console.log('⑤ 25명 표 크기·시간(판 하나 약 100KB)');
{ const env3 = makeEnv(); for (let n = 1; n <= 25; n++) await call(env3, '/save/zzbig/' + n, { pin: '2222', data: kidSave(n, { steps: 70, pad: 2200 }) });
  await call(env3, '/tclaim/zzbig', { tkey: 'teach456' }); const t0 = performance.now(), r = await call(env3, '/class/zzbig', { tkey: 'teach456' }), ms = performance.now() - t0;
  const row = DBS.get('zzbig').prepare('SELECT length(data) AS n, length(sum) AS m FROM s WHERE num = 5').get();
  ok(r.j.L.length === 25, '25줄'); ok(r.t.length < 40000, '표 답 ' + (r.t.length / 1024).toFixed(1) + 'KB(판 하나 ' + (row.n / 1024).toFixed(0) + 'KB · 요약 하나 ' + row.m + '바이트)'); ok(row.m < 2048, '요약 하나 2KB 아래'); console.log('    표 읽기 ' + ms.toFixed(1) + 'ms(흉내 · 요약 칸만 읽음)'); }

console.log(fails ? '✗ 실패 ' + fails : '✓ 모두 통과');
process.exit(fails ? 1 : 0);
