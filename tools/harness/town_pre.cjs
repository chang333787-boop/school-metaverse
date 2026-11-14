// 🏗 짓는 동안 첫 화면 예약(OPT-G1 ② · 11-08 심판 판정 '덮개에 칸 카드와 이어하기/처음부터를 바로 · 고른 것은 다 지으면 바로 시작'): node tools/harness/town_pre.cjs [마을=ourtown] [포트=8002] [--shots=폴더]
//   ① 새 판: 짓는 동안 '✨ 처음하기'가 눌림 + 둘러보기 단추 → 하는 법 한 장 → ▶ 첫날 시작 = 예약 → 다 지으면 첫 화면 없이 첫 아침(TITLE-2 11-14)
//   ② 저장 있는 판: 짓는 동안 이어하기 · 처음하기(칸 카드·하는 법은 다음 단계) → 이어하기 예약 → 다 지으면 바로
//   ③ 짓는 동안 처음하기(빈 칸 ②) 예약 → 다 지은 뒤 칸 ②로 다시 열림 = 하는 법 한 장  ④ 저장 둘 = 이어하기 → 칸 카드(지우기·되살리기 흐림) → 칸 ① 예약 → 칸 ①로 다시 열림
//   서버: 저장소 뿌리에서 python3 -m http.server <포트> --bind 127.0.0.1(이 스크립트는 열기만) · 그림 없음(pw.cjs) · 시험 저장은 시험 브라우저 안에만
const { chromium } = require('./pw.cjs'), fs = require('fs'), path = require('path');
const A9 = process.argv.slice(2).filter(a => !a.startsWith('--')), ID = A9[0] || 'ourtown', PORT = A9[1] || '8002';
const SH = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8);
let fail = 0; const ok = (c, m) => { console.log('  ' + (c ? '✓ ' : '✗ ') + m); if (!c) fail++; };
(async () => {
  const b = await chromium.launch(); const errs = [];
  try {
    const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } });
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message.slice(0, 200)));
    const U = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID;
    const building = () => p.waitForFunction(() => document.querySelector('.twn-ld') && !window.SM_TOWN, null, { timeout: 120000, polling: 50 });
    const built = () => p.waitForFunction(() => window.SM_TOWN && SM_TOWN.load, null, { timeout: 300000, polling: 100 });
    const titled = () => p.waitForFunction(() => !!document.querySelector('.twn-ld.ttl9 .row button') || !!window.SM_TOWN, null, { timeout: 120000, polling: 50 });   /* FIX-5: 짓는 덮개(.twn-ld)는 짓기 처음부터 있고, 칸 카드·이어하기/처음부터 줄은 짓기 중간(titleShow(true))에 그려짐 — 덮개만 보고 바로 누르면 부하 큰 때 단추가 아직 없음(null.click) */
    const ui = () => p.evaluate(() => { const el = document.querySelector('.twn-ld'); if (!el) return null; return { cls: el.className, row: [...el.querySelectorAll('.stp9 button')].map(x => (x.dataset.a || (x.dataset.s9 ? 's' + x.dataset.s9 : '')) + ':' + (x.disabled ? 'off' : 'on') + ':' + x.textContent.trim()), cards: el.querySelectorAll('.slot9').length, tools: [...el.querySelectorAll('.tl9 button')].map(x => x.disabled ? 'off' : 'on'), how: !!el.querySelector('.how3'), sv: (el.querySelector('.sv9') || {}).textContent || '', nt: (el.querySelector('.nt9') || {}).textContent || '' }; });   /* TITLE-2: 단추 = 단계 칸(.stp9) 안 모두 */
    const shot = async n => { if (SH) { fs.mkdirSync(SH, { recursive: true }); await p.screenshot({ path: path.join(SH, n + '.png') }); } };
    /* ① 새 판 */
    await p.goto(U); await building(); await titled(); let A = await ui(); await shot('pre_1_new');
    ok(A && A.row.some(x => /^x:on:.*처음하기/.test(x)), '① 새 판 짓는 동안 처음하기 눌림 ' + JSON.stringify(A && A.row));
    ok(A && A.row.some(x => /^look9:on:/.test(x)), '① 둘러보기 단추');
    await p.evaluate(() => document.querySelector('.twn-ld [data-a="x"]').click()); A = await ui(); ok(A && A.how && A.row.some(x => /^x:on:.*첫날 시작/.test(x)), '① 처음하기 = 하는 법 한 장(짓는 동안에도)');
    await p.evaluate(() => document.querySelector('.twn-ld [data-a="x"]').click()); A = await ui(); ok(A && A.row.some(x => /다 지으면 바로 시작/.test(x)), '① 첫날 시작 = 예약 표시 ' + JSON.stringify(A && A.row));
    await built(); await p.waitForTimeout(1500); A = await ui(); const t1 = await p.evaluate(() => ({ title: SM_TOWN.title ? SM_TOWN.title() : null, open: !!(SM_TOWN.game().S.open) }));
    ok(!A && !t1.title, '① 다 지으면 첫 화면 없이 바로 마을 ' + JSON.stringify(t1));
    await p.evaluate(() => SM_TOWN.save().flush());
    /* ② 저장 있는 판 = 이어하기 예약 */
    await p.goto(U); await building(); await titled(); A = await ui(); await shot('pre_2_saved');
    ok(A && A.row.some(x => /^x:on:.*이어하기/.test(x)) && A.row.some(x => /^new:on:.*처음하기/.test(x)), '② 이어하기·처음하기 ' + JSON.stringify(A && A.row)); ok(A && !A.cards && !A.how, '② 첫 화면엔 칸 카드·하는 법 X(이어하기·처음하기 다음 단계)'); ok(A && /일째/.test(A.sv), '② 지난번 줄 ' + (A && A.sv));
    await p.evaluate(() => document.querySelector('.twn-ld [data-a="x"]').click()); await built(); await p.waitForTimeout(1500); A = await ui(); const t2 = await p.evaluate(() => SM_TOWN.title ? SM_TOWN.title() : null);
    ok(!A && !t2, '② 이어하기 예약 → 다 지으면 바로');
    /* ③ 처음하기(저장 있음 · 빈 칸 ②) 예약 → 다 지은 뒤 칸 ②로 다시 열림 → 하는 법 한 장 */
    await p.goto(U); await building(); await titled(); await p.evaluate(() => document.querySelector('.twn-ld [data-a="new"]').click()); A = await ui(); ok(A && A.row.some(x => /^new.*다 지으면/.test(x)), '③ 처음하기 = 예약 ' + JSON.stringify(A && A.row));
    await Promise.all([p.waitForNavigation({ timeout: 300000 }), built()]); await building().catch(() => null); await titled(); A = await ui(); ok(A && A.how && /②/.test(A.nt), '③ 다 지은 뒤 칸 ②로 다시 열림 = 하는 법 한 장(' + (A && A.nt) + ')');
    await built(); await p.waitForTimeout(800); await p.evaluate(() => { const b9 = document.querySelector('.twn-ld [data-a="x"]'); if (b9) b9.click(); }); await p.waitForTimeout(1500); await p.evaluate(() => SM_TOWN.save().flush());
    /* ④ 저장 둘 = 이어하기 → 칸 고르기 → 칸 ① 카드 예약 */
    await p.goto(U); await building(); await titled(); await p.evaluate(() => document.querySelector('.twn-ld [data-a="x"]').click()); A = await ui();
    if (A && A.cards === 3) { ok(A.tools.length && A.tools.every(x => x === 'off'), '④ 칸 카드 셋 · 지우기·되살리기는 다 지은 뒤 ' + JSON.stringify(A.tools)); await p.evaluate(() => document.querySelector('.twn-ld [data-s9="1"]').click()); ok(await p.evaluate(() => !!document.querySelector('.twn-ld [data-s9="1"] .rsv9t')), '④ 칸 ① 카드 예약 표시');
      await Promise.all([p.waitForNavigation({ timeout: 300000 }), built()]); await built(); await p.waitForTimeout(1500); const sl = await p.evaluate(() => SM_TOWN.slot ? SM_TOWN.slot() : null); ok(sl && sl.n === 1, '④ 칸 ①로 다시 열림 ' + (sl && sl.n)); }
    else ok(false, '④ 칸 카드 없음 ' + JSON.stringify(A));
  } catch (e) { ok(false, '오류 ' + String(e).slice(0, 300)); }
  ok(!errs.length, '페이지 오류 0 ' + JSON.stringify(errs.slice(0, 3)));
  console.log(fail ? 'FAIL ' + fail : 'PASS'); await b.close(); process.exit(fail ? 1 : 0);
})();
