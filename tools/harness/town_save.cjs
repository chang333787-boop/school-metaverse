// 💾 저장 손실 막기 시험(SAVE-2 · 코덱스 10-24 · SAVE-3b 10-31) — 브라우저 없이 node만: localStorage·fetch를 흉내 내 town_cloud.js·town_game.js를 직접 부름
//   ① 이 기기 8일차 · 서버 2일차(서버 시각이 더 새것) → 이 기기 것을 지키고 서버 것은 :cloud-bak  ② 서버가 더 진행 → 받고 이 기기 것은 :local-bak
//   ③ 저장 실패(가득 참) 뒤에도 dirty가 남아 다시 시도  ④ 탭 닫을 때(pagehide) = 이 기기 저장을 먼저 끝낸 뒤 서버로(마지막 몫이 빠지지 않음)
//   SAVE-3b(10-31 · 코덱스 A·C): ⑤ 세대(gen) — 옛 판 'L0' · 처음부터 = 새 id + 버린 id를 dead · 서버 받기·올리기가 버린 세대에 지지 않음 · 3분 확인
//     ⑥ 지우기(delSave) = readSave 판(:bak까지)을 :old에 먼저 · 다른 창이 쓰는 칸 X · 내 칸이 다른 창에서 지워지면 읽기만
//     ⑦ 창 넘기기(코덱스 C E3) — 저장이 실패하면 넘기지 않고 새 창은 읽기만  ⑧ 하루 넘김 저장 = day 처리 뒤 한 번 · 밤사이 자란 칸이 소식 근거
//   창 둘 흉내: 같은 모듈을 다른 주소(?tab=A·B)로 두 번 읽어 TAB_ID가 다른 '창' 둘 · storage 알림은 쓴 창 말고 다른 창에만(브라우저와 같게)
//   node tools/harness/town_save.cjs [--root=<v2가 있는 폴더>](고치기 전 판과 견줄 때)
const path = require('path'), { pathToFileURL } = require('url');
const ROOT = (process.argv.find(a => a.startsWith('--root=')) || '').slice(7) || path.join(__dirname, '../..');
const mod = (f, q) => pathToFileURL(path.join(ROOT, 'v2/games', f)).href + (q ? '?' + q : '');
let fails = 0; const ok = (c, t) => { console.log((c ? '  ✓ ' : '  ✗ ') + t); if (!c) fails++; };
const mem = new Map(); let full = false, CUR = 'A';
const L = {}, TAG = new Map();
const fire = (key, newValue) => { const w = CUR; for (const f of (L.storage || []).slice()) { const t = TAG.get(f); if (t === w) continue; setTimeout(() => { const p = CUR; CUR = t; try { f({ key, newValue }); } finally { CUR = p; } }, 0); } };   /* storage 알림 = 다른 창에만 */
global.localStorage = { getItem: k => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => { if (full && !/:own$/.test(k)) throw new Error('QuotaExceeded'); mem.set(k, String(v)); fire(k, String(v)); }, removeItem: k => { if (!mem.has(k)) return; mem.delete(k); fire(k, null); }, get length() { return mem.size; }, key: i => [...mem.keys()][i] || null };
global.location = { search: '?cf=http://127.0.0.1:9' };
global.addEventListener = (k, f) => { (L[k] = L[k] || []).push(f); TAG.set(f, CUR); }; global.removeEventListener = (k, f) => { L[k] = (L[k] || []).filter(x => x !== f); };
let srv = null, sent = [], loads = 0; global.fetch = async (url, o) => { const b = JSON.parse(o.body); if (/\/load\//.test(url)) { loads++; return { status: 200, json: async () => srv }; } sent.push(b.data); return { status: 200, json: async () => ({ ok: true, at: 999 }) }; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const J = k => { try { return JSON.parse(mem.get(k) || 'null'); } catch (e) { return null; } };
(async () => {
  const C = await import(mod('town_cloud.js')), K = 'sm-town-game:t@s3';
  console.log('① 이 기기가 더 진행(8일차) · 서버는 시각만 새것(2일차)');
  mem.set(K, JSON.stringify({ v: 9, day: 8, earned: 500 })); mem.set('sm-town-cloud:' + K, JSON.stringify({ at: 100 })); srv = { ok: true, at: 200, data: { v: 9, day: 2, earned: 10 } };
  let r = await C.cloudPull(K, 'abcd', 3, '1234'); ok(r === 'more', '결과 = more (' + r + ')'); ok(JSON.parse(mem.get(K)).day === 8, '이 기기 8일차 그대로'); ok(JSON.parse(mem.get(K + ':cloud-bak') || '{}').data.day === 2, '서버 2일차는 :cloud-bak에 보관');
  console.log('② 서버가 더 진행(12일차)'); srv = { ok: true, at: 300, data: { v: 9, day: 12, earned: 900 } };
  r = await C.cloudPull(K, 'abcd', 3, '1234'); ok(r === 'pulled', '결과 = pulled (' + r + ')'); ok(JSON.parse(mem.get(K)).day === 12, '서버 12일차를 받음'); ok(JSON.parse(mem.get(K + ':local-bak') || '{}').day === 8, '덮기 전 이 기기 8일차는 :local-bak');
  console.log('③ 저장 실패 뒤 다시 시도'); const G = await import(mod('town_game.js')), GM = G.createGame('zz');
  GM.S.money = 77; GM.mark(); full = true; ok(GM.flush() === false, '가득 참 = flush false'); full = false; ok(GM.flush() === true && JSON.parse(mem.get('sm-town-game:zz')).money === 77, '다음 flush에서 저장됨(dirty가 남아 있었음)');
  console.log('④ 탭 닫을 때 = 이 기기 먼저 → 서버'); const KG = 'sm-town-game:zz'; let order = []; sent = [];
  srv = { ok: true, none: 1 }; await C.cloudPull(KG, 'abcd', 3, '1234');   /* 들어올 때 서버 판을 봄(SAVE-3b: 이것이 첫 세대 확인 — 확인 없이 창 닫을 때 올리지 않음) */
  const sy = C.cloudSync({ key: KG, code: 'abcd', num: 3, pin: '1234', alive: () => true, flush: () => { order.push('local'); return GM.flush(); } });
  GM.S.money = 88; GM.mark(); for (const f of L.pagehide || []) f(); await wait(30); sy.stop();
  ok(order[0] === 'local', '먼저 이 기기 저장'); ok(sent.length === 1 && sent[0].money === 88, '서버로 간 것 = 마지막 몫(돈 88) (' + JSON.stringify(sent.map(s => s.money)) + ')');
  GM.dispose(); for (const f of (L.pagehide || []).slice()) removeEventListener('pagehide', f);

  console.log('⑤ 세대(gen · SAVE-3b)');
  { const K5 = 'sm-town-game:zz5'; mem.set(K5, JSON.stringify({ v: 2, day: 5, min: 600, bag: {}, money: 50, earned: 500 }));
    const g1 = G.createGame('zz5'); ok(g1.S.gen && g1.S.gen.id === 'L0', 'gen 없는 옛 판 = L0 (' + JSON.stringify(g1.S.gen) + ')');
    ok(g1.newGame() === true, '처음부터(newGame) = 보관 뒤 지움'); g1.dispose();
    const g2 = G.createGame('zz5'); const gid2 = g2.S.gen && g2.S.gen.id; ok(!!gid2 && gid2 !== 'L0' && g2.S.gen.dead.includes('L0'), '새로고침 뒤 새 판 = 새 세대 · 버린 L0는 dead (' + JSON.stringify(g2.S.gen) + ')');
    g2.S.money = 1; g2.mark(); g2.flush(); ok(!mem.has(K5 + ':gen'), '첫 저장 뒤 :gen 표시는 치움');
    const rs2 = g2.reset(), gg = g2.S.gen || { dead: [] }; ok(rs2 === true && !!gid2 && gg.id !== gid2 && gg.dead.includes(gid2) && gg.dead.includes('L0'), '메뉴 처음부터(reset) = 또 새 세대(버린 둘 다 dead · ' + JSON.stringify(g2.S.gen && g2.S.gen.dead) + ')'); g2.dispose(); }
  { const K5 = 'sm-town-game:t@abcd:s05'; mem.set(K5, JSON.stringify({ v: 2, day: 5, earned: 900 })); mem.set('sm-town-cloud:' + K5, JSON.stringify({ at: 100 }));
    srv = { ok: true, at: 200, data: { v: 2, day: 1, earned: 0, gen: { id: 'gA', dead: ['L0'] } } };
    r = await C.cloudPull(K5, 'abcd', 5, '1234'); ok(r === 'pulled' && J(K5).day === 1 && J(K5 + ':local-bak').day === 5, '다른 기기에서 처음부터 한 판(gA · dead L0)이 서버에 = 옛 5일차(L0) 대신 받음 (' + r + ' · ' + (J(K5) || {}).day + '일차)');
    mem.set(K5, JSON.stringify({ v: 2, day: 1, earned: 0, gen: { id: 'gB', dead: ['L0'] } })); mem.set('sm-town-cloud:' + K5, JSON.stringify({ at: 100 })); srv = { ok: true, at: 300, data: { v: 2, day: 5, earned: 900 } };
    r = await C.cloudPull(K5, 'abcd', 5, '1234'); ok(r === 'more' && J(K5).day === 1 && J(K5 + ':cloud-bak').data.day === 5, '이 기기에서 처음부터(gB · dead L0) · 서버엔 옛 5일차 = 이 기기 것을 지킴 (' + r + ' · ' + (J(K5) || {}).day + '일차)');
    mem.delete(K5); mem.set(K5 + ':gen', JSON.stringify({ dead: ['L0'] })); mem.delete('sm-town-cloud:' + K5); srv = { ok: true, at: 300, data: { v: 2, day: 5, earned: 900 } };
    r = await C.cloudPull(K5, 'abcd', 5, '1234'); ok(r === 'fresh' && !mem.has(K5) && (J(K5 + ':cloud-bak') || { data: {} }).data.day === 5, '처음부터 누른 바로 뒤 새로고침(판 지움 · :gen dead L0) = 서버 옛 5일차를 다시 받지 않음 · 서버 판은 :cloud-bak (' + r + ')'); mem.delete(K5 + ':gen'); }
  { const K6 = 'sm-town-game:t@abcd:s06'; mem.set(K6, JSON.stringify({ v: 2, day: 3, earned: 30, gen: { id: 'gL', dead: [] } })); mem.set('sm-town-cloud:' + K6, JSON.stringify({ at: 400 }));
    srv = { ok: true, at: 500, data: { v: 2, day: 1, earned: 0, gen: { id: 'gN', dead: ['gL'] } } }; sent = []; loads = 0; let why = '';
    const s6 = C.cloudSync({ key: K6, code: 'abcd', num: 6, pin: '1234', alive: () => true, more: true, onGen: c => { why = c; } }); await s6.now(); s6.stop();
    ok(sent.length === 0 && why === 'dead', '놀이 중 다른 기기가 처음부터(서버 gN · dead gL) = 올리기 전 확인에서 막음 · 알림 dead (올림 ' + sent.length + ' · 확인 ' + loads + ' · ' + why + ')');
    srv = { ok: true, at: 600, data: { v: 2, day: 9, earned: 900, gen: { id: 'gL', dead: [] } } }; sent = []; why = '';
    const s7 = C.cloudSync({ key: K6, code: 'abcd', num: 6, pin: '1234', alive: () => true, more: true, onGen: c => { why = c; } }); await s7.now(); s7.stop();
    ok(sent.length === 0 && why === 'behind', '내 마지막 올림 뒤 다른 기기가 더 진행한 판(9일차)을 올림 = 덮지 않음 (올림 ' + sent.length + ' · ' + why + ')');
    srv = { ok: true, at: 400, data: { v: 2, day: 2, earned: 20, gen: { id: 'gL', dead: [] } } }; sent = []; why = ''; loads = 0;
    const s8 = C.cloudSync({ key: K6, code: 'abcd', num: 6, pin: '1234', alive: () => true, more: true, onGen: c => { why = c; } }); await s8.now(); mem.set(K6, JSON.stringify({ v: 2, day: 3, earned: 31, gen: { id: 'gL', dead: [] } })); await s8.now(); s8.stop();
    ok(sent.length === 2 && !why && loads === 1, '같은 세대 · 내가 마지막으로 올린 판 = 그대로 올림 · 3분 안 두 번째 올림은 다시 확인 X (올림 ' + sent.length + ' · 확인 ' + loads + ')'); }
  { const K10 = 'sm-town-game:t@abcd:s10'; mem.set(K10, JSON.stringify({ v: 2, day: 1, earned: 0, gen: { id: 'gX', dead: [] } })); sent = []; srv = { ok: true, at: 50, data: { v: 2, day: 7, earned: 700 } };
    const s10 = C.cloudSync({ key: K10, code: 'abcd', num: 10, pin: '1234', alive: () => true, more: true }); for (const f of (L.pagehide || []).slice()) f(); await wait(20); s10.stop();
    ok(sent.length === 0, '세대를 한 번도 확인 못 한 채(짓기 전 받기 실패) 창을 닫음 = 올리지 않음 · 이 기기엔 남고 서버 7일차를 덮지 않음 (올림 ' + sent.length + ')'); }

  console.log('⑥ 지우기(delSave · SAVE-3b)');
  const GA = await import(mod('town_game.js', 'tab=A')), GB = await import(mod('town_game.js', 'tab=B'));
  { const K7 = 'sm-town-game:zz6#2'; mem.delete(K7); mem.set(K7 + ':bak', JSON.stringify({ v: 2, day: 4, min: 600, bag: {}, money: 40 }));
    CUR = 'B'; const d1 = GB.delSave(K7); CUR = 'A'; const o7 = GB.oldSave(K7);
    ok(d1 && o7 && o7.day === 4, '본 저장 없고 :bak(4일째)만 있는 칸을 지움 = :old에 4일째 보관 (' + (o7 ? o7.day + '일째' : '보관 없음') + ')');
    ok(GB.restoreSave(K7) && J(K7) && J(K7).day === 4, '되살리기 = 4일째 그대로'); }
  { const K8 = 'zz6#3', KK = 'sm-town-game:' + K8; mem.set(KK, JSON.stringify({ v: 2, day: 6, min: 600, bag: {}, money: 60 }));
    CUR = 'A'; const gA = GA.createGame(K8); let ev = ''; gA.on(t => { ev = t; }); gA.S.money = 61; gA.mark(); gA.flush();
    CUR = 'B'; const d2 = GB.delSave(KK); CUR = 'A';
    ok(!d2 && (GB.delSave.why || '') === 'ro' && J(KK) && J(KK).money === 61, '다른 창(A)이 쓰는 칸을 B에서 지우기 = 안 지움 (' + (GB.delSave.why || '?') + ' · ' + (J(KK) || {}).money + '원)');
    const own = J(KK + ':own'); own.at = Date.now() - 60000; mem.set(KK + ':own', JSON.stringify(own));   /* A가 오래 저장하지 않음(창 위 창 등) */
    CUR = 'B'; const d3 = GB.delSave(KK); CUR = 'A'; await wait(10);
    gA.S.money = 62; gA.mark(); gA.flush();
    ok(d3 && !mem.has(KK) && gA.readOnly && ev === 'save-del', 'B가 지운 뒤 A = 읽기만 + 알림 · 지운 판을 다시 쓰지 않음 (본 저장 ' + (mem.has(KK) ? '다시 생김' : '없음') + ' · ' + ev + ')');
    gA.dispose(); }
  { const KC = 'sm-town-game:zz6#4'; CUR = 'A'; const gC = GA.createGame('zz6#4'); gC.S.money = 5; gC.mark(); gC.flush(); gC.dispose();   /* 칸 바꾸기(slotGo) = 저장 → dispose → 새로고침 */
    CUR = 'B'; const d4 = GB.delSave(KC); CUR = 'A'; ok(d4 && !mem.has(KC) && GB.oldSave(KC), '칸을 떠난 창(dispose) = 손을 뗌 → 곧바로 다른 창 첫 화면에서 그 칸 지우기 됨(:old 보관)'); }

  console.log('⑦ 창 넘기기(코덱스 C E3)');
  { const K9 = 'zz7', KK = 'sm-town-game:' + K9; mem.delete(KK);
    CUR = 'A'; const gA = GA.createGame(K9); gA.S.money = 70; gA.mark(); gA.flush(); gA.S.money = 71; gA.mark(); full = true;
    CUR = 'B'; const cl = await GB.claimSave(KK); CUR = 'A'; full = false;
    ok(!gA.readOnly && cl === 'ro', '저장이 가득 찬 앞 창(A) = 넘기지 않음(계속 주인) · 새 창 claimSave = ro (A 읽기만 ' + gA.readOnly + ' · ' + cl + ')');
    ok(gA.flush() === true && J(KK).money === 71, '자리가 나면 A가 마지막 몫(71원)을 저장');
    CUR = 'B'; const gB = GB.createGame(K9, { ro: cl === 'ro' }); let evB = ''; gB.on(t => { evB = t; }); await wait(5); gB.S.money = 1; gB.mark(); gB.flush(); CUR = 'A';
    ok(gB.readOnly && evB === 'save-ro' && J(KK).money === 71, '새 창(B) = 읽기만 + 알림 · A 판을 덮지 않음 (' + evB + ' · ' + J(KK).money + '원)');
    gB.dispose();
    CUR = 'B'; const cl2 = await GB.claimSave(KK); CUR = 'A';
    ok(cl2 === 'own' && gA.readOnly, '저장이 되면 넘김(B 주인 · A 읽기만) (' + cl2 + ')'); gA.dispose(); }

  console.log('⑧ 하루 넘김(코덱스 A)');
  { const KD = 'sm-town-game:zz8'; mem.delete(KD); CUR = 'A'; const gD = G.createGame('zz8'); gD.S.money = 3; gD.mark(); gD.flush(); let n = 0; const s0 = global.localStorage.setItem; global.localStorage.setItem = (k, v) => { if (k === KD) n++; return s0(k, v); };
    gD.on(t => { if (t === 'day') { gD.S.grew = { d: gD.S.day, r: 0, p: [true, false], f: [] }; gD.mark(); } }); gD.sleep(); global.localStorage.setItem = s0;
    const j = J(KD); ok(j && j.day === 2 && j.grew && j.grew.d === 2, '잠 저장 = day 처리(밤사이 자란 칸) 뒤 · 저장된 판에 grew 2일째 (' + JSON.stringify(j && j.grew) + ')'); ok(n === 1, '잠 한 번에 저장 한 번 (' + n + ')'); gD.dispose();
    const NW = await import(mod('town_news.js'));
    const base = { en: false, day: 2, S: { news: {} }, pots: [{ c: 'x', w: 1, g: 2, d: 1 }], farm: [], plotState: () => 'grow', CROPS: { x: 1 }, crop: () => '상추', item: e => e, rainY: false, yday: null };
    const no = NW.newsMake({ ...base, potGrew: null }), yes = NW.newsMake({ ...base, potGrew: (j && j.grew && j.grew.p) || null });
    ok(!no.lines.some(L0 => L0.k === 'pot') && yes.lines.some(L0 => L0.k === 'pot'), '소식 근거: 자란 칸 없음(null) = 화분 줄 빠짐 · 저장된 grew = 화분 줄 (' + no.lines.map(q => q.k).join(',') + ' → ' + yes.lines.map(q => q.k).join(',') + ')'); }

  console.log(fails ? 'FAIL ' + fails : 'PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
