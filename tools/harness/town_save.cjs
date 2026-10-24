// 💾 저장 손실 막기 시험(SAVE-2 · 코덱스 10-24) — 브라우저 없이 node만: localStorage·fetch를 흉내 내 town_cloud.js·town_game.js를 직접 부름
//   ① 이 기기 8일차 · 서버 2일차(서버 시각이 더 새것) → 이 기기 것을 지키고 서버 것은 :cloud-bak  ② 서버가 더 진행 → 받고 이 기기 것은 :local-bak
//   ③ 저장 실패(가득 참) 뒤에도 dirty가 남아 다시 시도  ④ 탭 닫을 때(pagehide) = 이 기기 저장을 먼저 끝낸 뒤 서버로(마지막 몫이 빠지지 않음)
//   node tools/harness/town_save.cjs
const path = require('path'), { pathToFileURL } = require('url');
let fails = 0; const ok = (c, t) => { console.log((c ? '  ✓ ' : '  ✗ ') + t); if (!c) fails++; };
const mem = new Map(); let full = false;
global.localStorage = { getItem: k => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => { if (full) throw new Error('QuotaExceeded'); mem.set(k, String(v)); }, removeItem: k => mem.delete(k) };
global.location = { search: '?cf=http://127.0.0.1:9' };
const L = {}; global.addEventListener = (k, f) => { (L[k] = L[k] || []).push(f); }; global.removeEventListener = (k, f) => { L[k] = (L[k] || []).filter(x => x !== f); };
let srv = null, sent = []; global.fetch = async (url, o) => { const b = JSON.parse(o.body); if (/\/load\//.test(url)) return { status: 200, json: async () => srv }; sent.push(b.data); return { status: 200, json: async () => ({ ok: true, at: 999 }) }; };
(async () => {
  const C = await import(pathToFileURL(path.join(__dirname, '../../v2/games/town_cloud.js')).href), K = 'sm-town-game:t@s3';
  console.log('① 이 기기가 더 진행(8일차) · 서버는 시각만 새것(2일차)');
  mem.set(K, JSON.stringify({ v: 9, day: 8, earned: 500 })); mem.set('sm-town-cloud:' + K, JSON.stringify({ at: 100 })); srv = { ok: true, at: 200, data: { v: 9, day: 2, earned: 10 } };
  let r = await C.cloudPull(K, 'abcd', 3, '1234'); ok(r === 'more', '결과 = more (' + r + ')'); ok(JSON.parse(mem.get(K)).day === 8, '이 기기 8일차 그대로'); ok(JSON.parse(mem.get(K + ':cloud-bak') || '{}').data.day === 2, '서버 2일차는 :cloud-bak에 보관');
  console.log('② 서버가 더 진행(12일차)'); srv = { ok: true, at: 300, data: { v: 9, day: 12, earned: 900 } };
  r = await C.cloudPull(K, 'abcd', 3, '1234'); ok(r === 'pulled', '결과 = pulled (' + r + ')'); ok(JSON.parse(mem.get(K)).day === 12, '서버 12일차를 받음'); ok(JSON.parse(mem.get(K + ':local-bak') || '{}').day === 8, '덮기 전 이 기기 8일차는 :local-bak');
  console.log('③ 저장 실패 뒤 다시 시도'); const G = await import(pathToFileURL(path.join(__dirname, '../../v2/games/town_game.js')).href), GM = G.createGame('zz');
  GM.S.money = 77; GM.mark(); full = true; ok(GM.flush() === false, '가득 참 = flush false'); full = false; ok(GM.flush() === true && JSON.parse(mem.get('sm-town-game:zz')).money === 77, '다음 flush에서 저장됨(dirty가 남아 있었음)');
  console.log('④ 탭 닫을 때 = 이 기기 먼저 → 서버'); const KG = 'sm-town-game:zz'; let order = []; sent = [];
  const sy = C.cloudSync({ key: KG, code: 'abcd', num: 3, pin: '1234', alive: () => true, flush: () => { order.push('local'); return GM.flush(); } });
  GM.S.money = 88; GM.mark(); for (const f of L.pagehide || []) f(); await new Promise(r9 => setTimeout(r9, 30)); sy.stop();
  ok(order[0] === 'local', '먼저 이 기기 저장'); ok(sent.length === 1 && sent[0].money === 88, '서버로 간 것 = 마지막 몫(돈 88) (' + JSON.stringify(sent.map(s => s.money)) + ')');
  console.log(fails ? 'FAIL ' + fails : 'PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
