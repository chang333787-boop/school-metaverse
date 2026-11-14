// 🎮 게임 첫 화면 시험(TITLE-2 · 11-14 교사 '주소 누르고 접속하면 온라인 게임 첫 화면처럼 · 처음하기 이어하기 같이하기 · 같이하기는 방 만들고 들어가기')
//   node tools/harness/town_title2.cjs [마을=ourtown] [포트=8002] [--shots=폴더] [--nomp]   (서버: 저장소 뿌리에서 python3 -m http.server <포트> --bind 127.0.0.1)
//   ① 저장 없음 = 큰 제목 + 단추 셋(이어하기 흐림 · 처음하기 먼저) · 흐린 이어하기 = 한 줄 · 처음하기 → 하는 법 → ◀ 뒤로 → 처음하기 → ▶ 첫날 시작 = 우리 집 앞(첫 화면 닫힘)
//   ② 저장 하나 = 새로고침 → ▶ 이어하기 = 바로(같은 날·돈)   ③ 처음하기(저장 있음 · 빈 칸 있음) = 빈 칸 ②로 → 하는 법 → 첫날 시작 = 칸 ② 1일째(칸 ① 그대로)
//   ④ 저장 둘 = 이어하기 → 칸 고르기(카드 셋) → ① = 칸 ① 그대로   ⑤ 칸 셋 다 참 = 처음하기 → 새로 할 칸 고르기 → ③ → 확인(30일) → 네 → 칸 ③ 1일째 · 지난 판 :old
//   ⑥ 같이하기 = 두 갈래(🏠 방 만들기 · 🚪 방 들어가기 · 🔒 선생님 방) → A(저장 없음) zz 방 만들기 → 번호 4자리 크게 → 하는 법 → 첫날 시작 → 방 칩 「👥 … 방 · n명 · 내가 방장」
//      → B(저장 있음) 🚪 방 들어가기 → 목록에서 고르기 + 이름 + 번호 → 내 판으로 이어하기(같은 날) → A ☰ 「👥 함께하기」(2장 잠금과 상관없이) → 방 창(대기실·다 같이 놀이 X · 📺 · 🔒) → 🔒 방 닫기   (--nomp = 두 갈래까지만 · 방을 만들지 않음)
//   ⑦ login=1(반 번호 · 반 코드 없음 = 서버 X) = 로그인 창 → 같은 첫 화면(칸 카드 X) · 처음하기(저장 있음) = 확인 한 번(30일)   ⑧ 홍보판(/) = 마을·첫 화면 없음(예전 그대로)
//   ⑥-2 마을 안에서는 학교 맵 🏠 대기실(학교 놀이 고르기) X   ⑨ 학교 맵 함께하기 창 = 예전 그대로(👥 칩 → 「👥 함께하기」 · 🏠 내 방 만들기 · 🔒 선생님 방 · 마을 결 X)   ⑩ 페이지 오류 0
const { chromium } = require('./pw.cjs');
const A9 = process.argv.slice(2).filter(a => !a.startsWith('--')), ID = A9[0] || 'ourtown', PORT = A9[1] || '8002', BASE = 'http://127.0.0.1:' + PORT;
const SHOTS = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8), NOMP = process.argv.includes('--nomp');
const URL = BASE + '/v2/?town=' + ID + '&adapt=0', BLANK = BASE + '/tools/', KEY = 'sm-town-game:' + ID;
const LIMIT = 25 * 60 * 1000; setTimeout(() => { console.log('  ✗ 시간 초과 — 멈춤'); console.log('FAIL'); process.exit(1); }, LIMIT).unref();
let fails = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const errs = [], watch = (p, tag) => { p.on('pageerror', e => errs.push(tag + ' ' + e.message.slice(0, 200))); p.on('console', m => { if (m.type() === 'error' && !/favicon|404|501|ERR_|pointer lock|WebGL|GPU stall|Failed to load resource/.test(m.text())) errs.push(tag + ' ' + m.text().slice(0, 200)); }); };
const shot = async (p, n) => { if (SHOTS) { await p.waitForTimeout(300); await p.screenshot({ path: SHOTS + '/' + n + '.png' }); console.log('    📷 ' + SHOTS + '/' + n + '.png'); } };
const ready = p => p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && SM_TOWN.save, null, { timeout: 240000, polling: 200 }).then(() => p.waitForTimeout(1200));
const T = p => p.evaluate(() => { const el = document.querySelector('.twn-ld'); if (!el || !el.isConnected) return null; return { on: window.SM_TOWN && SM_TOWN.title ? SM_TOWN.title() : null, top: el.classList.contains('top9'), name: (el.querySelector('.tt9n') || {}).textContent || '', en: (el.querySelector('.tt9e') || {}).textContent || '', hd: (el.querySelector('.hd9') || {}).textContent || '',
  btn: [...el.querySelectorAll('.stp9 button')].map(b => (b.dataset.a || (b.dataset.s9 ? 's' + b.dataset.s9 : '')) + (b.classList.contains('dim9') ? '~dim' : '') + (b.classList.contains('pri9') ? '~pri' : '') + ':' + b.textContent.replace(/\s+/g, ' ').trim()), msg: (el.querySelector('.msg9') || {}).textContent || '', nt: (el.querySelector('.nt9') || {}).textContent || '', sv: (el.querySelector('.sv9') || {}).textContent || '', slots: el.querySelectorAll('.slot9').length, how: !!el.querySelector('.how3') }; });
const ck = (p, sel) => p.evaluate(s => { const b = document.querySelector('.twn-ld ' + s); if (b) b.click(); return !!b; }, sel);
const st = p => p.evaluate(() => { const S = SM_TOWN.game().S, q = SD2.map.player.get(), H = SM_TOWN.home(); return { day: S.day, money: S.money, slot: SM_TOWN.slot().n, save: SM_TOWN.save(), title: SM_TOWN.title(), dHome: H && H.e ? +Math.hypot(q.x - H.e[0], q.z - H.e[1]).toFixed(1) : null }; });
const navClick = async (p, sel) => { await Promise.all([p.waitForNavigation({ timeout: 90000 }), ck(p, sel)]); await ready(p); };
const has = (B, re) => B.some(s => re.test(s));
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  let ROOM = null;
  try {
    console.log('① 저장 없음 — 단추 셋');
    let ctx = await b.newContext({ viewport: { width: 1366, height: 768 } }), p = await ctx.newPage(); watch(p, 'A');
    await p.goto(URL);
    { let pre = null; try { await p.waitForFunction(() => document.querySelector('.twn-ld.ttl9 .tt9b') && !window.SM_TOWN, null, { timeout: 120000, polling: 50 }); pre = await T(p); } catch (e) { void e; }
      if (pre) { ok(pre.top && pre.btn.length >= 3, '짓는 동안에도 첫 화면 단추(' + pre.btn.length + ')'); await shot(p, 't2_0_pre_desktop'); } else console.log('    (짓기가 먼저 끝나 짓는 동안 화면은 못 봄)'); }
    await ready(p); let A = await T(p);
    ok(A && A.on && A.top && /우리 마을/.test(A.name) && /Our Town/.test(A.en), '큰 제목 「' + (A && A.name) + '」 + ' + (A && A.en));
    ok(A && A.btn.length === 3 && /^cont~dim:▶ 이어하기/.test(A.btn[0]) && /^x~pri:✨ 처음하기/.test(A.btn[1]) && /^mp:👥 같이하기/.test(A.btn[2]), '단추 셋 = ' + (A && A.btn.join(' | ')));
    ok(!(await p.evaluate(() => /정림/.test(document.querySelector('.twn-ld').innerText))), '첫 화면에 실제 학교 이름 X');
    await shot(p, 't2_1_top_nosave_desktop');
    await ck(p, '[data-a="cont"]'); A = await T(p); ok(A.on && A.top && /아직 저장이 없어요/.test(A.msg), '흐린 이어하기 = 한 줄(' + A.msg + ')');
    await ck(p, '[data-a="x"]'); A = await T(p); ok(!A.top && A.how && /처음하기/.test(A.hd) && has(A.btn, /^x:▶ 첫날 시작/) && has(A.btn, /^back9:/), '처음하기 → 하는 법 한 장(' + A.btn.join(' | ') + ')'); await shot(p, 't2_2_how_desktop');
    await ck(p, '[data-a="back9"]'); A = await T(p); ok(A.top && A.btn.length === 3, '◀ 뒤로 = 첫 화면');
    await ck(p, '[data-a="x"]'); await ck(p, '[data-a="x"]'); await p.waitForTimeout(1600); let S = await st(p);
    ok(!S.title && !(await p.evaluate(() => !!document.querySelector('.twn-ld'))) && S.dHome != null && S.dHome < 7, '▶ 첫날 시작 = 첫 화면 닫힘 · 우리 집 앞(문에서 ' + S.dHome + 'm)');
    console.log('② 저장 하나 — 이어하기 = 바로');
    await p.evaluate(() => { const G = SM_TOWN.game(); G.S.day = 4; G.S.money = 4400; G.mark(); SM_TOWN.save().flush(); });
    await p.reload(); await ready(p); A = await T(p);
    ok(A.top && /^x~pri:▶ 이어하기/.test(A.btn[0]) && /^new:✨ 처음하기.*빈 칸 ②/.test(A.btn[1]) && /4일째/.test(A.sv), '저장 있음 = 이어하기 먼저 · 처음하기 「빈 칸 ②에서」(' + A.btn.slice(0, 2).join(' | ') + ' · ' + A.sv + ')');
    await shot(p, 't2_3_top_save_desktop');
    await ck(p, '[data-a="x"]'); await p.waitForTimeout(1500); S = await st(p); ok(!S.title && S.day === 4 && S.money === 4400 && S.slot === 1, '이어하기 = 바로 칸 ① 4일째 · 4400원');
    console.log('③ 처음하기(저장 있음 · 빈 칸 있음) = 빈 칸 ②');
    await p.reload(); await ready(p); await navClick(p, '[data-a="new"]'); A = await T(p);
    ok(A && A.how && /②/.test(A.nt), '빈 칸 ②로 다시 지은 뒤 = 하는 법 한 장(' + (A && A.nt) + ')');
    await ck(p, '[data-a="x"]'); await p.waitForTimeout(1500); S = await st(p); ok(!S.title && S.slot === 2 && S.day === 1, '칸 ② 1일째로 시작(' + S.slot + ' · ' + S.day + '일째)');
    await p.evaluate(() => { const G = SM_TOWN.game(); G.S.day = 2; G.S.money = 22; G.mark(); SM_TOWN.save().flush(); });
    console.log('④ 저장 둘 — 이어하기 = 칸 고르기');
    await p.reload(); await ready(p); A = await T(p); ok(/칸 고르기/.test(A.btn[0]), '이어하기 단추 = 「칸 고르기」(' + A.btn[0] + ')');
    await ck(p, '[data-a="x"]'); A = await T(p); ok(!A.top && A.slots === 3 && /이어하기/.test(A.hd), '칸 카드 셋(' + A.hd + ')'); await shot(p, 't2_4_pick_desktop');
    await navClick(p, '[data-s9="1"]'); S = await st(p); ok(!S.title && S.slot === 1 && S.day === 4 && S.money === 4400, '① 카드 = 칸 ① 4일째(첫 화면 다시 X)');
    console.log('⑤ 칸 셋 다 참 — 처음하기 = 새로 할 칸 고르기');
    await p.evaluate(k => { localStorage.setItem(k + '#3', JSON.stringify({ v: 2, day: 6, min: 600, bag: {}, money: 60 })); }, KEY);
    await p.reload(); await ready(p); A = await T(p); ok(/새로 할 칸/.test(A.btn[1]), '처음하기 단추 = 「새로 할 칸 고르기」(' + A.btn[1] + ')');
    await ck(p, '[data-a="new"]'); A = await T(p); ok(A.slots === 3 && !A.btn.some(s => /지우기|되살리기/.test(s)), '새로 할 칸 고르기 = 카드 셋(지우기 X)');
    await ck(p, '[data-s9="3"]'); A = await T(p); ok(/③ 칸\(6일째\)/.test(A.sv) && /30일/.test(A.sv) && /되살리기/.test(A.sv) && has(A.btn, /^ok9:/), '확인 한 번 = ' + A.sv); await shot(p, 't2_5_over_desktop');
    await navClick(p, '[data-a="ok9"]'); A = await T(p); ok(A && A.how, '네 → 다시 지은 뒤 하는 법 한 장');
    await ck(p, '[data-a="x"]'); await p.waitForTimeout(1500); S = await st(p); ok(S.slot === 3 && S.day === 1 && S.save.old && S.save.old.day === 6, '칸 ③ 1일째 · 지난 판 :old(' + (S.save.old && S.save.old.day) + '일째)');
    await ctx.close();

    console.log('⑥ 같이하기 — 두 갈래' + (NOMP ? '(--nomp: 방 만들지 않음)' : ' → zz 방'));
    ctx = await b.newContext({ viewport: { width: 1366, height: 768 } }); p = await ctx.newPage(); watch(p, 'MA'); p.on('dialog', d => d.accept());
    await p.goto(URL); await ready(p); await ck(p, '[data-a="mp"]'); A = await T(p);
    ok(!A.top && /같이하기/.test(A.hd) && has(A.btn, /^mpmk:🏠 방 만들기/) && has(A.btn, /^mpin:🚪 방 들어가기/) && has(A.btn, /^mpt:🔒 선생님 방/) && /처음 시작/.test(A.nt), '두 갈래 + 선생님 방 + 「' + A.nt + '」');
    await shot(p, 't2_6_mp_desktop');
    await ck(p, '[data-a="mpin"]'); await p.waitForTimeout(2500); let L = await p.evaluate(() => { const P = document.querySelector('.lb-pop'); return P ? { h: (P.querySelector('h4') || {}).textContent, tw: P.classList.contains('tw9'), mine: !!P.querySelector('[data-l="mine"]'), tx: P.innerText.slice(0, 200) } : null; });
    ok(L && /방 들어가기/.test(L.h) && L.tw && !L.mine && /처음 시작/.test(L.tx), '🚪 방 들어가기 = 목록 창(마을 결 · 만들기 단추 X · 내 판 한 줄)'); await shot(p, 't2_7_join_desktop');
    await p.keyboard.press('Escape'); await p.waitForTimeout(300); ok((await T(p)).on, 'Esc = 방 창만 닫힘(첫 화면 그대로)');
    if (!NOMP) {
      await ck(p, '[data-a="mpmk"]'); await p.waitForTimeout(500); L = await p.evaluate(() => { const P = document.querySelector('.lb-pop'); return P ? { h: (P.querySelector('h4') || {}).textContent, list: !!P.querySelector('.rooms') } : null; });
      ok(L && /방 만들기/.test(L.h) && !L.list, '🏠 방 만들기 = 이름 칸 하나(목록 X)'); await shot(p, 't2_8_mine_desktop');
      await p.fill('.lb-pop input.nm', 'zz시험'); await p.click('.lb-pop [data-l="mine"]');
      await p.waitForFunction(() => document.querySelector('.lb-big .code'), null, { timeout: 30000 }).catch(() => null);
      ROOM = await p.evaluate(() => (window.SM_MP && SM_MP.info()) || null); const code = await p.evaluate(() => (document.querySelector('.lb-big .code') || {}).textContent || '');
      ok(ROOM && /^\d{4}$/.test(code) && code === ROOM.c, '방이 생김 · 번호 4자리 크게(' + code + ' · ' + (ROOM && ROOM.n) + ')'); await shot(p, 't2_9_bigcode_desktop');
      ok(/같이하기/.test(await p.evaluate(() => (document.querySelector('.lb-big') || {}).innerText || '')), '큰 번호 창 안내 = 첫 화면 👥 같이하기 길');
      await p.evaluate(() => { const b9 = document.querySelector('.lb-big button'); if (b9) b9.click(); }); await p.waitForTimeout(400);
      A = await T(p); ok(A && A.how && /방에 들어왔어요/.test(A.nt), '저장 없는 방장 = 하는 법 한 장(' + (A && A.nt) + ')');
      await ck(p, '[data-a="x"]'); await p.waitForTimeout(2500); S = await st(p);
      let chip = await p.evaluate(() => { const c = document.getElementById('mpChip'); return c ? { tx: c.textContent, vis: !!c.getClientRects().length } : null; });
      ok(!S.title && chip && chip.vis && /zz시험의 방 · \d+명 · 내가 방장/.test(chip.tx), '첫날 시작 · 방 칩 = ' + (chip && chip.tx)); await shot(p, 't2_10_chip_desktop');
      { await p.waitForTimeout(1200); const wr = await p.evaluate(() => { const w = document.getElementById('mpWR'); return !!(w && w.getClientRects().length); }); ok(!wr, '학교 맵 🏠 대기실(물총·숨바꼭질 고르기) = 마을에선 안 보임'); }
      console.log('   B(저장 있음) — 방 들어가기 → 내 판으로');
      const c2 = await b.newContext({ viewport: { width: 1366, height: 768 } }), q = await c2.newPage(); watch(q, 'MB');
      await q.goto(BLANK); await q.evaluate(k => localStorage.setItem(k, JSON.stringify({ v: 2, day: 5, min: 600, bag: { '🍐': 1 }, money: 55 })), KEY);
      await q.goto(URL); await ready(q); await ck(q, '[data-a="mp"]'); const nB = (await T(q)).nt; ok(/내 판 ①로 이어해요/.test(nB), 'B 같이하기 한 줄 = 「' + nB + '」');
      await ck(q, '[data-a="mpin"]'); await q.waitForFunction(rid => !!document.querySelector('.lb-pop [data-r="' + rid + '"]'), ROOM.r, { timeout: 40000 }).catch(() => null);
      const got = await q.evaluate(rid => { const b9 = document.querySelector('.lb-pop [data-r="' + rid + '"]'); if (b9) b9.click(); return !!b9; }, ROOM.r); ok(got, 'B 목록에 「' + ROOM.n + '」');
      if (got) { await q.fill('.lb-pop input.nm', 'zz둘'); await q.fill('.lb-pop input.cd', ROOM.c); await q.click('.lb-pop [data-l="go"]'); await q.waitForTimeout(2500);
        const SB = await st(q), cB = await q.evaluate(() => (document.getElementById('mpChip') || {}).textContent || '');
        ok(!SB.title && SB.day === 5 && SB.money === 55 && /zz시험의 방/.test(cB) && !/내가 방장/.test(cB), 'B = 내 판 ①로 이어하기(5일째 · 55원) · 칩 「' + cB + '」'); }
      await c2.close();
      console.log('   A ☰ 함께하기 → 방 창 → 방 닫기');
      await p.evaluate(() => SM_TOWN.menu()); await p.waitForTimeout(400); const mq = await p.evaluate(() => { const b9 = document.querySelector('.twn-p [data-tq="mp"]'); return b9 ? b9.textContent : null; });
      ok(mq && /함께하기/.test(mq), '☰ 바로 쓰기 「' + mq + '」(1장 · 방 안)');
      await p.evaluate(() => { const b9 = document.querySelector('.twn-p [data-tq="mp"]'); if (b9) b9.click(); }); await p.waitForTimeout(800);
      L = await p.evaluate(() => { const P = document.querySelector('.lb-pop'); return P ? { tw: P.classList.contains('tw9'), wr: /대기실|다 같이 놀이/.test(P.innerText), big: !!P.querySelector('[data-l="big"]'), shut: !!P.querySelector('[data-l="shut"]'), out: !!P.querySelector('[data-l="out"]') } : null; });
      ok(L && L.tw && !L.wr && L.big && L.shut && L.out, '방 창 = 마을 결 · 대기실·다 같이 놀이 X · 📺 번호 크게 · 🔒 방 닫기 · 🚪 나가기 ' + JSON.stringify(L)); await shot(p, 't2_11_room_desktop');
      await p.evaluate(() => document.querySelector('.lb-pop [data-l="shut"]').click()); await p.waitForTimeout(2500);
      const gone = await p.evaluate(() => ({ room: window.SM_MP && SM_MP.room(), mpin: document.body.classList.contains('mp-in') })); ok(!gone.room && !gone.mpin, '🔒 방 닫기 = 방 나옴(' + JSON.stringify(gone) + ')'); if (!gone.room) ROOM = null;
    }
    await ctx.close();

    console.log('⑦ login=1 — 로그인 창 뒤 같은 첫 화면');
    ctx = await b.newContext({ viewport: { width: 1366, height: 768 } }); p = await ctx.newPage(); watch(p, 'V4');
    const login = async (pins) => { await p.waitForSelector('button[data-n="3"]', { timeout: 120000 }); await p.click('button[data-n="3"]'); for (const pin of pins) { for (const d of pin) await p.click('button[data-p="' + d + '"]'); await p.waitForTimeout(1200); } };
    await p.goto(URL + '&login=1'); await login(['1234', '1234']); await ready(p); A = await T(p);
    ok(A && A.top && A.btn.length === 3 && /^cont~dim/.test(A.btn[0]) && /^x~pri/.test(A.btn[1]), '로그인 뒤 첫 화면 단추 셋(' + (A && A.btn.join(' | ')) + ')'); await shot(p, 't2_12_v4_desktop');
    await ck(p, '[data-a="x"]'); await ck(p, '[data-a="x"]'); await p.waitForTimeout(1500); await p.evaluate(() => { const G = SM_TOWN.game(); G.S.day = 3; G.mark(); SM_TOWN.save().flush(); });
    await p.reload(); if (await p.waitForSelector('button[data-n="3"]', { timeout: 15000 }).catch(() => null)) await login(['1234']); await ready(p); A = await T(p);
    ok(A && /^x~pri:▶ 이어하기/.test(A.btn[0]) && !A.slots && /새 판으로/.test(A.btn[1]), '저장 있음 = 이어하기 · 칸 카드 X · 처음하기 「새 판으로」');
    await ck(p, '[data-a="new"]'); A = await T(p); ok(/30일/.test(A.sv) && has(A.btn, /^ok9:/), '처음하기 = 확인 한 번(' + A.sv.slice(0, 30) + '…)');
    await ck(p, '[data-a="back9"]'); await ck(p, '[data-a="x"]'); await p.waitForTimeout(1500); S = await st(p); ok(!S.title && S.day === 3, '이어하기 = 내 판 3일째');
    await ctx.close();

    console.log('⑧ 홍보판(/) — 예전 그대로');
    ctx = await b.newContext({ viewport: { width: 1280, height: 760 } }); p = await ctx.newPage(); watch(p, '홍보판');
    await p.goto(BASE + '/?game=town&town=' + ID); await p.waitForFunction(() => window.SD2 && SD2.map && SD2.map.game, null, { timeout: 120000 }); await p.waitForTimeout(3000);
    const PR = await p.evaluate(() => ({ promo: !!window.SM_PROMO, ld: !!document.querySelector('.twn-ld'), tt: !!document.querySelector('.tt9b'), town: !!window.SM_TOWN }));
    ok(PR.promo && !PR.ld && !PR.tt && !PR.town, '홍보판 = 마을·첫 화면 없음 ' + JSON.stringify(PR)); await ctx.close();

    console.log('⑨ 학교 맵 함께하기 창 — 예전 그대로');
    ctx = await b.newContext({ viewport: { width: 1366, height: 768 } }); p = await ctx.newPage(); watch(p, '학교');
    await p.goto(BASE + '/v2/?adapt=0'); await p.waitForFunction(() => window.SM_MP && document.getElementById('mpChip'), null, { timeout: 120000 }); await p.waitForTimeout(1500);
    const ct = await p.evaluate(() => document.getElementById('mpChip').textContent); await p.evaluate(() => document.getElementById('mpChip').click()); await p.waitForTimeout(1500);
    L = await p.evaluate(() => { const P = document.querySelector('.lb-pop'); return P ? { h: (P.querySelector('h4') || {}).textContent, tw: P.classList.contains('tw9'), mine: (P.querySelector('[data-l="mine"]') || {}).textContent || '', t: (P.querySelector('[data-l="new"]') || {}).textContent || '', rooms: !!P.querySelector('.rooms') } : null; });
    ok(/함께하기 \(방 들어가기\)/.test(ct) && L && /👥 함께하기/.test(L.h) && !L.tw && /내 방 만들기/.test(L.mine) && /선생님 방/.test(L.t) && L.rooms, '학교 맵 = 칩 「' + ct + '」 · 창 「' + (L && L.h) + '」 · 목록 + 🏠 내 방 만들기 + 🔒 선생님 방 · 마을 결 X');
    await shot(p, 't2_13_school_lobby'); await ctx.close();

    if (SHOTS) { console.log('📷 휴대폰 가로·세로');
      for (const [w, h, tg] of [[844, 390, 'land'], [390, 844, 'port']]) { const c = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true }), q = await c.newPage(); watch(q, tg);
        await q.goto(URL); await ready(q); const R = await q.evaluate(() => { const r = [...document.querySelectorAll('.twn-ld .tt9b')].map(e => e.getBoundingClientRect()); return { n: r.length, inV: r.every(x => x.left >= 0 && x.right <= innerWidth + 0.5 && x.top >= 0 && x.bottom <= innerHeight + 0.5), minH: Math.min(...r.map(x => x.height)), sw: document.documentElement.scrollWidth <= innerWidth }; });
        ok(R.n === 3 && R.inV && R.minH >= 44 && R.sw, tg + ' ' + w + '×' + h + ' 단추 셋이 화면 안 · 44px 넘게 ' + JSON.stringify(R)); await shot(q, 't2_' + tg + '_top');
        await ck(q, '[data-a="mp"]'); await shot(q, 't2_' + tg + '_mp'); await ck(q, '[data-a="back9"]'); await ck(q, '[data-a="x"]'); await shot(q, 't2_' + tg + '_how'); await c.close(); } }
  } catch (e) { console.log('  ✗ 멈춤: ' + String(e && e.stack || e).slice(0, 400)); fails++; }
  if (ROOM && ROOM.k) { console.log('   (남은 시험 방 닫기 ' + ROOM.c + ')'); try { const DB = 'https://class-rpg-6f409-default-rtdb.asia-southeast1.firebasedatabase.app/metaverse'; for (const pt of ['/chat', '/ctl']) await fetch(DB + '/rooms/c' + ROOM.c + pt + '.json', { method: 'DELETE' }).catch(() => null); const r = await fetch(DB + '/lobby/' + ROOM.r + '/x/' + ROOM.k + '.json', { method: 'PUT', body: 'true' }); ok(r.ok, '남은 시험 방 닫음(' + r.status + ')'); } catch (e) { ok(false, '남은 시험 방 닫기 ' + e.message); } }
  ok(!errs.length, '페이지 오류 ' + errs.length); for (const e of errs.slice(0, 8)) console.log('   ' + e);
  await b.close(); console.log(fails ? 'FAIL ' + fails : 'PASS'); process.exit(fails ? 1 : 0);
})();
