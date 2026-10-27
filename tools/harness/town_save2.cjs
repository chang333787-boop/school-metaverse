// 💾 저장 확실하게(SAVE-2 · 사용자 10-27 '로컬에서 저장 제대로 되는 처음하기 이어하기 확실하게') — node tools/harness/town_save2.cjs [마을=ourtown] [포트=8002]
//   ① 저장 없음 = 첫 화면에 '처음부터'만  ② 진행 → 새로고침 → 첫 화면 '이어하기(지난번: n일째 · 곳 · 시각 저장)' → 같은 자리·가방·날
//   ③ 옛 판 번호(v:1) 저장 → 옮겨 읽음(버리지 않음)  ④ 저장 글 깨뜨림 → :bak에서  ⑤ 처음부터(확인 한 번) → 새 판 · :old → 메뉴 되살리기 → 지난 판
//   ⑥ 창 둘 = 나중 창이 앞 창의 마지막 몫을 받아 읽고, 앞 창은 저장을 멈춤(덮어쓰지 않음)  ⑦ 저장 칸 셋
//   ⑧ SAVE-3(코덱스 10-27 표 1): 저장 공간 가득 참(setItem이 throw) = 처음부터·칸 바꾸기·칸 지우기가 원본을 안 잃고 막힘(까닭 한 줄) · 본 저장 없고 :bak만 = bak에서 · {} 저장 = 깨진 판(새로 · 글은 따로 남김)
//   페이지 오류 0 · 브라우저는 GPU 옵션 · 끝나면 닫음
const { chromium } = require('./pw.cjs');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const SHOTS = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8), shot = async (p, n) => { if (SHOTS) { await p.screenshot({ path: SHOTS + '/' + n + '.png' }); console.log('    📷 ' + SHOTS + '/' + n + '.png'); } };
const URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0', BLANK = 'http://127.0.0.1:' + PORT + '/tools/', KEY = 'sm-town-game:' + ID;
const GPU = ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'];
let fails = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const errs = []; const watch = (p, tag) => { p.on('pageerror', e => errs.push(tag + ' ' + e.message.slice(0, 160))); p.on('console', m => { if (m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(m.text())) errs.push(tag + ' ' + m.text().slice(0, 160)); }); };
const ready = p => p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && SM_TOWN.save, null, { timeout: 240000 }).then(() => p.waitForTimeout(1200));
const title = p => p.evaluate(() => { const el = document.querySelector('.twn-ld'); return { on: !!(el && el.isConnected && SM_TOWN.title()), btn: el ? [...el.querySelectorAll('.row button')].map(b => (b.dataset.a || '') + ':' + b.textContent.trim()) : [], line: el && el.querySelector('.sv9') ? el.querySelector('.sv9').textContent : '' }; });
const click = (p, a) => p.evaluate(a9 => { const b = document.querySelector('.twn-p [data-a="' + a9 + '"]'); if (b) b.click(); return !!b; }, a);
const st = p => p.evaluate(() => { const S = SM_TOWN.game().S, q = SD2.map.player.get(); return { day: S.day, money: S.money, bag: JSON.stringify(S.bag), x: +q.x.toFixed(1), z: +q.z.toFixed(1), save: SM_TOWN.save() }; });
(async () => {
  const b = await chromium.launch({ args: GPU }); const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } });
  try {
    let p = await ctx.newPage(); watch(p, 'A'); await p.goto(URL); await ready(p);
    console.log('① 저장 없음'); let T = await title(p); ok(T.on && T.btn.length === 1 && /처음부터/.test(T.btn[0]), '첫 화면 단추 = 처음부터 하나 (' + T.btn.join(' | ') + ')');
    await click(p, 'x'); await p.waitForTimeout(1500);
    console.log('② 진행 → 새로고침 → 이어하기');
    const spot = await p.evaluate(() => { const P = SM_TOWN.places().find(q => /마트|우체국|소방서/.test(q.name)); const x = P.x + 6, z = P.z + 6; SD2.map.player.teleport([x, SM_TOWN.ground(x, z) + 1.5, z]); const G = SM_TOWN.game(); G.S.day = 4; G.S.money = 1234; G.S.bag['🍓'] = 3; G.mark(); return P.name; });
    await p.waitForTimeout(4500); await p.evaluate(() => SM_TOWN.save().flush()); const A0 = await st(p); ok(A0.save.at > 0, '저장 시각이 남음(' + new Date(A0.save.at).toLocaleTimeString('ko-KR') + ')');
    await p.reload(); await ready(p); T = await title(p);
    ok(T.btn.some(s => /^x:▶ (① )?이어하기/.test(s)) && T.btn.some(s => /^new:✨ 처음부터/.test(s)), '이어하기 · 처음부터 둘 (' + T.btn.join(' | ') + ')'); ok(/4일째/.test(T.line) && /저장/.test(T.line), '지난번 한 줄 = ' + T.line);
    await click(p, 'x'); await p.waitForTimeout(1500); const A1 = await st(p);
    ok(A1.day === 4 && A1.money === 1234 && A1.bag === A0.bag, '같은 날·돈·가방 (' + A1.day + '일 · ' + A1.money + ' · ' + A1.bag + ')'); ok(Math.hypot(A1.x - A0.x, A1.z - A0.z) < 3, '같은 자리(' + spot + ' 곁 · ' + [A0.x, A0.z] + ' → ' + [A1.x, A1.z] + ')');
    console.log('③ 옛 판 번호(v:1) 저장 → 옮겨 읽음');
    await p.goto(BLANK); await p.evaluate(k => { const j = JSON.parse(localStorage.getItem(k)); j.v = 1; delete j.sv; j.day = 6; j.money = 777; localStorage.setItem(k, JSON.stringify(j)); }, KEY); await p.goto(URL); await ready(p);   /* 마을 쪽을 떠난 뒤(닫을 때 저장이 끝난 뒤) 같은 출처 빈 쪽에서 고침 */
    let B = await st(p); ok(B.day === 6 && B.money === 777 && B.save.mig === 1, '옛 판 그대로 이어짐(6일째 · 777원 · 옮긴 판 ' + B.save.mig + ' → 2)'); await click(p, 'x'); await p.waitForTimeout(800); await p.evaluate(() => SM_TOWN.save().flush());
    ok(await p.evaluate(k => JSON.parse(localStorage.getItem(k)).v === 2, KEY), '다시 쓴 판 번호 = 2');
    console.log('④ 저장 글이 깨지면 :bak에서');
    await p.goto(BLANK); await p.evaluate(k => { const j = JSON.parse(localStorage.getItem(k)); j.day = 9; localStorage.setItem(k + ':bak', JSON.stringify(j)); localStorage.setItem(k, '{"v":2,"day":12,"bag":{'); }, KEY); await p.goto(URL); await ready(p);
    B = await st(p); ok(B.save.src === 'bak' && B.day === 9, '깨진 판 대신 직전 판(' + B.save.src + ' · ' + B.day + '일째)'); ok(await p.evaluate(id => !!localStorage.getItem('sm-town-game-bak:' + id), ID), '깨진 글은 따로 남김(sm-town-game-bak)');
    await click(p, 'x'); await p.waitForTimeout(800);
    console.log('⑤ 처음부터(확인 한 번) → 되살리기');
    await p.evaluate(() => SM_TOWN.save().flush()); await p.reload(); await ready(p); await click(p, 'new'); T = await title(p);
    ok(T.btn.some(s => /^ok9:/.test(s)) && /30일/.test(T.line) && /되살리기/.test(T.line), '확인 한 번(' + T.line + ')');
    await Promise.all([p.waitForNavigation({ timeout: 60000 }), click(p, 'ok9')]); await ready(p); T = await title(p); B = await st(p);
    ok(!B.save.had && B.day === 1 && B.money === 0, '새 판(1일째 · 0원)'); ok(B.save.old && B.save.old.day === 9, '지난 판 보관(:old · ' + (B.save.old && B.save.old.day) + '일째)'); ok(T.btn.length === 1 && /첫날 시작/.test(T.btn[0]), '다시 지은 뒤 단추 = ' + T.btn.join(' | '));
    await click(p, 'x'); await p.waitForTimeout(800); await p.evaluate(() => { SM_TOWN.game().S.money = 5; SM_TOWN.game().mark(); SM_TOWN.save().flush(); });
    await p.keyboard.press('Escape'); await p.evaluate(() => document.querySelectorAll('.twn-p').forEach(e => e.remove()));
    const menu = await p.evaluate(() => { SM_TOWN.menu(); const el = document.querySelector('.twn-p'); return el ? { sv: (el.querySelector('.sv8') || {}).textContent || '', rs: (el.querySelector('[data-a="restore"]') || {}).textContent || '' } : null; });
    ok(menu && /마지막 저장/.test(menu.sv), '메뉴 저장 상태 = ' + (menu && menu.sv)); ok(menu && /되살리기/.test(menu.rs) && /9일째/.test(menu.rs), '메뉴 되살리기 = ' + (menu && menu.rs));
    await click(p, 'restore'); await Promise.all([p.waitForNavigation({ timeout: 60000 }), click(p, 'restore')]); await ready(p); B = await st(p);
    ok(B.day === 9 && B.save.old && B.save.old.day === 1, '되살림(9일째) · 지금 판도 :old로(1일째 · ' + (B.save.old && B.save.old.day) + ')');
    await click(p, 'x'); await p.waitForTimeout(800);
    console.log('⑥ 창 둘');
    await p.evaluate(() => { SM_TOWN.game().S.money = 4321; SM_TOWN.game().mark(); });   /* 아직 안 씀(2초 안) */
    const p2 = await ctx.newPage(); watch(p2, 'D'); await p2.goto(URL); await ready(p2); const B2 = await st(p2), B1 = await st(p);
    ok(B2.money === 4321, '나중 창이 앞 창의 마지막 몫까지 읽음(' + B2.money + ')'); ok(B1.save.ro && !B2.save.ro, '앞 창 = 저장 멈춤 · 나중 창 = 주인');
    await p.evaluate(() => { SM_TOWN.game().S.money = 1; SM_TOWN.game().mark(); SM_TOWN.save().flush(); }); await click(p2, 'x'); await p2.waitForTimeout(600); await p2.evaluate(() => { SM_TOWN.game().S.money = 4400; SM_TOWN.game().mark(); SM_TOWN.save().flush(); });
    ok(await p.evaluate(k => JSON.parse(localStorage.getItem(k)).money === 4400, KEY), '앞 창이 나중 창 판을 덮지 않음(저장 = 4400)');
    const toast = await p.evaluate(() => (document.getElementById('toast') || {}).textContent || ''); console.log('    앞 창 알림: ' + toast.slice(0, 80));
    await p2.close(); await p.close();
    console.log('⑦ 저장 칸 셋(SLOT-1)');
    const c2 = await b.newContext({ viewport: { width: 1366, height: 768 } }); p = await c2.newPage(); watch(p, 'E'); await p.goto(BLANK);
    await p.evaluate(k => localStorage.setItem(k, JSON.stringify({ v: 1, day: 7, min: 600, bag: { '🍐': 2 }, money: 70 })), KEY); await p.goto(URL); await ready(p);
    const cards = () => p.evaluate(() => [...document.querySelectorAll('.twn-ld .slot9')].map(e => e.innerText.replace(/\s+/g, ' ').trim()));
    let C = await cards(); ok(C.length === 3 && /7일째/.test(C[0]) && /빈 칸/.test(C[1]) && /빈 칸/.test(C[2]), '옛 한 칸 저장 = 칸 ①(' + C.join(' / ') + ')');
    await click(p, 'x'); await p.waitForTimeout(800); B = await st(p); ok(B.day === 7 && B.money === 70, '칸 ① 이어하기 = 7일째 · 70원');
    await p.evaluate(() => { SM_TOWN.game().S.money = 71; SM_TOWN.game().mark(); }); await p.evaluate(() => SM_TOWN.menu()); ok(await p.evaluate(() => !!document.querySelector('.twn-p [data-a="slot9"]')), '메뉴에 저장 칸 바꾸기');
    await Promise.all([p.waitForNavigation({ timeout: 60000 }), click(p, 'slot9')]); await ready(p); C = await cards(); ok(/7일째/.test(C[0]), '칸 바꾸기 = 지금 칸 저장 → 처음 화면(' + C[0] + ')');
    await Promise.all([p.waitForNavigation({ timeout: 60000 }), p.evaluate(() => document.querySelector('.twn-ld [data-s9="2"]').click())]); await ready(p); await p.waitForTimeout(600);
    B = await st(p); let SL = await p.evaluate(() => SM_TOWN.slot().n); ok(SL === 2 && B.day === 1 && B.money === 0 && !(await p.evaluate(() => SM_TOWN.title())), '빈 칸 ② = 바로 처음부터(1일째 · 첫 화면 다시 X)');
    await p.evaluate(() => { const G = SM_TOWN.game(); G.S.money = 22; G.S.day = 2; G.mark(); SM_TOWN.save().flush(); });
    await p.reload(); await ready(p); C = await cards(); ok(/7일째/.test(C[0]) && /2일째/.test(C[1]), '두 칸 따로(' + C.slice(0, 2).join(' / ') + ')'); await shot(p, 'slots_desktop'); if (SHOTS) { await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(500); await shot(p, 'slots_phone'); await p.setViewportSize({ width: 1366, height: 768 }); }
    await Promise.all([p.waitForNavigation({ timeout: 60000 }), p.evaluate(() => document.querySelector('.twn-ld [data-s9="1"]').click())]); await ready(p); await p.waitForTimeout(600); B = await st(p);
    ok(B.day === 7 && B.money === 71 && (await p.evaluate(() => SM_TOWN.slot().n)) === 1, '칸 ① 다시 = 7일째 · 71원(칸 ②와 섞이지 않음)');
    await p.reload(); await ready(p); await p.evaluate(() => document.querySelector('.twn-ld [data-del9="2"]').click()); C = await cards(); ok(/정말 지울까요/.test(C[1]), '지우기 = 확인 한 번');
    await p.evaluate(() => document.querySelector('.twn-ld [data-del9="2"]').click()); C = await cards(); ok(/빈 칸/.test(C[1]) && /되살릴/.test(C[1]), '칸 ② 지움 → 30일 되살리기(' + C[1] + ')');
    await p.evaluate(() => document.querySelector('.twn-ld [data-rs9="2"]').click()); C = await cards(); ok(/2일째/.test(C[1]), '칸 ② 되살림(' + C[1] + ')');
    const sz = await p.evaluate(() => SM_TOWN.slot().all.map(q => q.size || 0)); ok(sz[0] > 0 && sz[1] > 0 && !sz[2], '칸 크기 잼(' + sz.join(' · ') + '자)');
    await c2.close();
    console.log('⑧ 가득 참 · bak만 · {} (SAVE-3)');
    const c3 = await b.newContext({ viewport: { width: 1366, height: 768 } });
    await c3.addInitScript(() => { const o = Storage.prototype.setItem; Storage.prototype.setItem = function (k, v) { if (this === window.localStorage && /^sm-town-game/.test(k) && window.sessionStorage.getItem('__full') === '1') throw new DOMException('full', 'QuotaExceededError'); return o.call(this, k, v); }; });   /* 가득 참 흉내: 마을 저장 쓰기만 throw */
    p = await c3.newPage(); watch(p, 'F'); await p.goto(BLANK);
    await p.evaluate(k => { localStorage.setItem(k, JSON.stringify({ v: 2, day: 5, min: 600, bag: { '🍐': 1 }, money: 500 })); localStorage.setItem(k + '#2', JSON.stringify({ v: 2, day: 3, min: 600, bag: {}, money: 30 })); }, KEY); await p.goto(URL); await ready(p);
    await click(p, 'x'); await p.waitForTimeout(800); await p.evaluate(() => { sessionStorage.setItem('__full', '1'); const G = SM_TOWN.game(); G.S.money = 555; G.mark(); window.__stay = 1; });
    const raw0 = await p.evaluate(k => localStorage.getItem(k), KEY), stay = () => p.evaluate(() => window.__stay === 1).catch(() => false), main = () => p.evaluate(k => JSON.parse(localStorage.getItem(k) || 'null'), KEY), oldOf = k2 => p.evaluate(k => localStorage.getItem(k + ':old'), k2);
    await p.evaluate(() => SM_TOWN.menu()); await click(p, 'reset'); await click(p, 'reset'); await p.waitForTimeout(2500);
    let M = await main(), sv8 = await p.evaluate(() => (document.querySelector('.twn-p .sv8') || {}).textContent || '');
    ok(await stay() && M && M.day === 5 && M.money === 500 && !(await oldOf(KEY)) && !(await p.evaluate(() => SM_TOWN.save().ro)), '가득 참 + 메뉴 처음부터 = 새로고침 X · 본 저장 그대로(5일째 500원) · 이 창도 계속 저장 시도');
    ok(/저장 공간이 모자라 지우지 않았어요/.test(sv8), '메뉴 안 까닭 한 줄 = ' + sv8);
    await p.evaluate(() => SM_TOWN.menu()); await click(p, 'slot9'); await p.waitForTimeout(2500); sv8 = await p.evaluate(() => (document.querySelector('.twn-p .sv8') || {}).textContent || '');
    ok(await stay() && /칸을 바꾸지 않았어요/.test(sv8), '가득 참 + 저장 칸 바꾸기 = 막힘(' + sv8 + ')');
    ok(await p.evaluate(() => SM_TOWN.game().S.money === 555), '메모리 판도 그대로(555원 · 저장되면 이어서 씀)');
    await p.reload(); await ready(p); await p.evaluate(() => { window.__stay = 1; });
    await click(p, 'new'); await click(p, 'ok9'); await p.waitForTimeout(2500);
    let W = await p.evaluate(() => (document.querySelector('.twn-ld .svf9') || {}).textContent || ''); M = await main();
    ok(await stay() && M && M.day === 5 && !(await oldOf(KEY)) && /지우지 않았어요/.test(W), '가득 참 + 첫 화면 처음부터 = 막힘 · 원본 그대로(' + W + ')');
    await p.evaluate(() => document.querySelector('.twn-ld [data-s9="2"]').click()); await p.waitForTimeout(2500); W = await p.evaluate(() => (document.querySelector('.twn-ld .svf9') || {}).textContent || '');
    ok(await stay() && (await p.evaluate(() => SM_TOWN.slot().n)) === 1 && /칸을 바꾸지 않았어요/.test(W), '가득 참 + 칸 ② 고르기 = 막힘(' + W + ')');
    await p.evaluate(() => document.querySelector('.twn-ld [data-del9="2"]').click()); await p.evaluate(() => document.querySelector('.twn-ld [data-del9="2"]').click()); await p.waitForTimeout(400);
    C = await cards(); const m2 = await p.evaluate(k => JSON.parse(localStorage.getItem(k + '#2') || 'null'), KEY);
    ok(m2 && m2.day === 3 && /3일째/.test(C[1]) && !(await oldOf(KEY + '#2')), '가득 참 + 칸 ② 지우기 = 안 지움(3일째 그대로 · ' + C[1] + ')');
    ok(await p.evaluate(k => localStorage.getItem(k), KEY) === raw0, '본 저장 글자 하나 안 바뀜');
    await p.evaluate(() => sessionStorage.removeItem('__full'));
    await p.goto(BLANK); await p.evaluate(k => { const j = JSON.parse(localStorage.getItem(k)); j.day = 8; localStorage.setItem(k + ':bak', JSON.stringify(j)); localStorage.removeItem(k); }, KEY); await p.goto(URL); await ready(p);
    B = await st(p); ok(B.save.src === 'bak' && B.day === 8 && B.save.had, '본 저장 없음 + :bak만 = 직전 판(' + B.save.src + ' · ' + B.day + '일째)'); T = await title(p); ok(T.btn.some(s9 => /이어하기/.test(s9)), '첫 화면 = 이어하기');
    await p.goto(BLANK); await p.evaluate(k => { localStorage.removeItem(k + ':bak'); localStorage.setItem(k, '{}'); }, KEY); await p.goto(URL); await ready(p);
    B = await st(p); T = await title(p); ok(!B.save.had && B.day === 1 && T.btn.length === 1 && /처음부터/.test(T.btn[0]), '{} 저장 = 판으로 안 받음(새 판 · 단추 ' + T.btn.join(' | ') + ')');
    ok(await p.evaluate(id => localStorage.getItem('sm-town-game-bak:' + id) === '{}', ID), '{} 글은 따로 남김(sm-town-game-bak)');
    await p.goto(BLANK); await p.evaluate(k => { localStorage.setItem(k + ':bak', JSON.stringify({ v: 2, day: 6, min: 600, bag: {}, money: 60 })); localStorage.setItem(k, '{"v":2}'); }, KEY); await p.goto(URL); await ready(p);
    B = await st(p); ok(B.save.src === 'bak' && B.day === 6, '날 없는 판 + :bak = 직전 판(' + B.day + '일째)');
    await c3.close();
  } catch (e) { console.error(e); fails++; }
  console.log('페이지 오류 ' + errs.length); for (const e of errs.slice(0, 8)) console.log('   ' + e); if (errs.length) fails++;
  await b.close(); console.log(fails ? 'FAIL ' + fails : 'PASS'); process.exit(fails ? 1 : 0);
})();
