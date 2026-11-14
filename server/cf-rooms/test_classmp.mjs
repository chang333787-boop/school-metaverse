// 우리 반 함께(CLASS-MP · 11-14) 서버 흉내 시험 — node 하나로: node server/cf-rooms/test_classmp.mjs
//   보는 것: /save·/load 답의 mp(반 방·입장표·번호) · 판이 없으면 표 X · 핀이 틀리면 표 X · 반 방 이름은 반 코드를 거꾸로 알 수 없음(해시)
//            입장표 확인(그날·다음 날 · 이틀 뒤 X · 다른 방·다른 번호·꼴이 틀림 X) · 「우리 반 함께 보기」 /tset(교사 열쇠 · 끄면 mp 0 · /class에 mp)
//   웹소켓 반 방(들이기·4004·4005·이모트 번호만)은 wrangler dev가 있어야 해서 tools/harness/town_classmp.cjs가 봄
//   배포 서버 확인(짧게 · 시험 반 zzcmp1 · 끝나면 판을 지움 — 교사 열쇠 해시 한 줄은 남음): node server/cf-rooms/test_classmp.mjs https://<배포 주소>
import { M, makeEnv } from './mock.mjs';

let fails = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const ORIGIN = 'http://127.0.0.1:8613', TK_RX = /^\d{1,2}\.\d{5,6}\.[0-9a-f]{24}$/, R_RX = /^c[0-9a-f]{7}$/;
const kid = n => ({ v: 2, day: 3 + n, money: 100, story: { cur: 'a1_1', i: 0, done: {}, v: {} } });

const LIVE = /^https?:\/\//.test(process.argv[2] || '') ? process.argv[2].replace(/\/+$/, '') : '';
if (LIVE) {
  const C = 'zzcmp1', N = 33, KEY = 'zz-test-key-2', PIN = '5913';
  const live = async (path, body) => { try { const r = await fetch(LIVE + path, { method: 'POST', headers: { Origin: ORIGIN, 'content-type': 'application/json' }, body: JSON.stringify(body) }); const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch (e) { j = null; } return { st: r.status, j, t }; } catch (e) { return { st: 0, j: null, t: '' }; } };
  console.log('배포 서버 확인 — 시험 반 ' + C + ' · ' + N + '번');
  let r = await live('/tclaim/' + C, { tkey: KEY }); ok(r.st === 200 && r.j && r.j.ok, '시험 반 교사 열쇠(처음이면 정함) ' + r.st);
  r = await live('/tset/' + C, { tkey: KEY, mp: 1 }); ok(r.st === 200 && r.j && r.j.mp === 1, '/tset 켬 ' + r.st);
  r = await live('/save/' + C + '/' + N, { pin: PIN, data: kid(N) }); const mp = r.j && r.j.mp; ok(r.st === 200 && mp && R_RX.test(mp.r) && TK_RX.test(mp.tk) && mp.u === N, '/save 답에 입장표 ' + r.st);
  r = await live('/load/' + C + '/' + N, { pin: PIN }); ok(r.st === 200 && r.j.mp && r.j.mp.tk === mp.tk && r.j.mp.r === mp.r, '/load 답에도 같은 표');
  r = await live('/tset/' + C, { tkey: KEY, mp: 0 }); r = await live('/load/' + C + '/' + N, { pin: PIN }); ok(r.st === 200 && r.j.mp === 0, '끄면 /load mp 0');
  r = await live('/class/' + C, { tkey: KEY }); ok(r.st === 200 && r.j.mp === 0, '/class에 mp 0');
  r = await live('/tset/' + C, { tkey: 'zz-wrong-key-9', mp: 1 }); ok(r.st === 403, '틀린 열쇠로 /tset = 403');
  r = await live('/tset/' + C, { tkey: KEY, mp: 1 }); ok(r.st === 200 && r.j.mp === 1, '다시 켬');
  r = await live('/drop/' + C + '/' + N, { pin: PIN }); ok(r.st === 200 && r.j && r.j.dropped === 1, '시험 판 지움');
  console.log(fails ? '✗ 실패 ' + fails : '✓ 배포 서버 통과'); process.exit(fails ? 1 : 0);
}

async function call(env, path, body) { const r = await M.default.fetch(new Request('https://sm-rooms.test' + path, { method: 'POST', headers: { Origin: ORIGIN, 'content-type': 'application/json' }, body: JSON.stringify(body) }), env); const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch (e) { j = null; } return { st: r.status, j, t }; }
const env = makeEnv();

console.log('① /save·/load 답의 입장표');
let r = await call(env, '/load/zzcls1/7', { pin: '1234' }); ok(r.st === 200 && r.j.none && !('mp' in r.j), '판이 없으면(핀 확인 안 됨) 표 X');
r = await call(env, '/save/zzcls1/7', { pin: '1234', data: kid(7) }); const A = r.j.mp; ok(r.st === 200 && A && R_RX.test(A.r) && TK_RX.test(A.tk) && A.u === 7, '저장 답 = 반 방 ' + (A && A.r) + ' · 번호 7');
r = await call(env, '/load/zzcls1/7', { pin: '1234' }); ok(r.j.mp && r.j.mp.r === A.r && r.j.mp.tk === A.tk, '불러오기 답에도 같은 표(그날은 같은 표)');
r = await call(env, '/load/zzcls1/7', { pin: '9999' }); ok(r.st === 403 && !r.j.mp, '핀이 틀리면 표 X');
r = await call(env, '/save/zzcls1/8', { pin: '4321', data: kid(8) }); const B = r.j.mp; ok(B.r === A.r && B.u === 8 && B.tk !== A.tk, '같은 반 8번 = 같은 방 · 다른 표');
r = await call(env, '/save/zzcls2/7', { pin: '1234', data: kid(7) }); ok(r.j.mp.r !== A.r, '다른 반 = 다른 방');
ok(!A.r.includes('zzcls1') && !/[g-z]/.test(A.r.slice(1)), '방 이름에 반 코드가 안 보임(16진 해시)');
ok((await M.mpOf('test-pepper', 'zzcls1', 7, Date.now())).r === A.r && (await M.mpOf('other-pepper', 'zzcls1', 7, Date.now())).r !== A.r, 'PEPPER가 다르면 방 이름도 다름(반 코드만으로는 못 셈)');

console.log('② 입장표 확인');
const now = Date.now(), day = 86400000, P = 'test-pepper';
ok(await M.tkCheck(P, A.r, A.tk, now) === 7, '그날 = 번호 7');
ok(await M.tkCheck(P, A.r, A.tk, now + day) === 7, '다음 날도 됨');
ok(await M.tkCheck(P, A.r, A.tk, now + 2 * day) === null, '이틀 뒤 = 안 됨');
ok(await M.tkCheck(P, A.r, A.tk, now - day) === null, '앞날(시계가 틀린 표) = 안 됨');
ok(await M.tkCheck(P, 'c0000000', A.tk, now) === null, '다른 방 = 안 됨');
ok(await M.tkCheck(P, A.r, A.tk.replace(/^7\./, '9.'), now) === null, '번호를 바꾼 표 = 안 됨');
ok(await M.tkCheck(P, A.r, A.tk.slice(0, -1) + (A.tk.endsWith('0') ? '1' : '0'), now) === null, '서명 한 글자 바꿈 = 안 됨');
ok(await M.tkCheck(P, A.r, '', now) === null && await M.tkCheck(P, A.r, null, now) === null && await M.tkCheck(P, A.r, '41.' + A.tk.split('.')[1] + '.' + 'a'.repeat(24), now) === null, '빈 표·없는 표·번호 41 = 안 됨');
ok(await M.tkCheck('other', A.r, A.tk, now) === null, 'PEPPER가 다르면 안 됨');

console.log('③ 「우리 반 함께 보기」 스위치');
r = await call(env, '/tset/zzcls1', { tkey: 'teach123', mp: 0 }); ok(r.st === 404 && r.j.nokey, '교사 열쇠가 없는 반 = 404(처음 = 켬 그대로)');
await call(env, '/tclaim/zzcls1', { tkey: 'teach123' });
r = await call(env, '/class/zzcls1', { tkey: 'teach123' }); ok(r.j.mp === 1, '/class에 mp 1(처음 = 켬)');
r = await call(env, '/tset/zzcls1', { tkey: 'wrong123', mp: 0 }); ok(r.st === 403, '틀린 열쇠 = 403');
r = await call(env, '/tset/zzcls1', { tkey: 'teach123', mp: 0 }); ok(r.st === 200 && r.j.mp === 0, '끔');
r = await call(env, '/load/zzcls1/7', { pin: '1234' }); ok(r.j.ok && r.j.mp === 0 && r.j.data, '끄면 /load mp 0(판은 그대로)');
r = await call(env, '/save/zzcls1/7', { pin: '1234', data: kid(7) }); ok(r.j.ok && r.j.mp === 0, '끄면 /save mp 0');
r = await call(env, '/class/zzcls1', { tkey: 'teach123' }); ok(r.j.mp === 0, '/class에 mp 0');
r = await call(env, '/tset/zzcls1', { tkey: 'teach123', mp: 1 }); r = await call(env, '/load/zzcls1/7', { pin: '1234' }); ok(r.j.mp && r.j.mp.tk === A.tk, '다시 켜면 표');
r = await call(env, '/save/zzcls2/7', { pin: '1234', data: kid(7) }); ok(!!r.j.mp, '다른 반은 그대로');

console.log(fails ? '✗ 실패 ' + fails : '✓ 모두 통과');
process.exit(fails ? 1 : 0);
