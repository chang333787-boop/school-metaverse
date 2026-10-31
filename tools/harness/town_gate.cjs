// 🚦 마을 관문(GATE-2 · 10-31 '진짜 시험' · 비판 보고서 '이것만 하면 3' · 사용자 '2주 믿게 만들기' 넷째): node tools/harness/town_gate.cjs [마을=ourtown] [포트=8002]
//   check.cjs는 마을을 열지 않아 마을이 통째로 깨져도 17/17이 찍혔음 → 이 관문이 마을을 실제로 열고 걸어 봄 · 그림 없음(pw.cjs) · 2~3분 · 하나라도 실패하면 exit 1
//   ⑤ 홍보판(/)에 ?game=town&town=… = 마을이 안 열림(SM_PROMO · 지금 놀이 없음 · 짓는 화면 없음 · 로더 loadGame('town') = null)
//   ① 우리 학교용 /v2/?town=… = 240초 안에 다 지어짐 · 페이지 오류 0(두 쪽 모두 끝까지 셈)
//   ② 첫 아침(우리 집 현관) → 칠판 쪽지 → 프롤로그 → 1-1 첫 '해 보기'(tmap) 단계까지 순간이동 없이 걸어서 5분 안(lib_walk.cjs = town_first.cjs와 같은 걷기 · 0.12초 한 걸음 2m 넘으면 순간이동)
//   ③ E 자리 수(SD2.map.interact.list) = 짓기 끝 · 걷기 끝 · 모자 쓰고 벗은 뒤 · 새로고침 뒤 모두 기준선 E_MIN 이상 + 처음 수의 90% 이상(모자 벗기 2551 → 250처럼 마을이 무너지는 것)
//   ④ 저장 → 새로고침 → 첫 화면 '이어하기' → 그대로(날·돈·가방·이야기 장·단계·끝낸 장·모자·우리 집·세대 id)
//   서버: 저장소 뿌리에서 python3 -m http.server <포트> --bind 127.0.0.1(이 스크립트는 열기만) · 시험 저장은 시험 브라우저 안에만
const { chromium } = require('./pw.cjs'), { walker, toFirstTry } = require('./lib_walk.cjs');
const A9 = process.argv.slice(2).filter(a => !a.startsWith('--')), ID = A9[0] || 'ourtown', PORT = A9[1] || '8002', BASE = 'http://127.0.0.1:' + PORT;
const E_MIN = 2200;   /* E 자리 기준선(10-31 ourtown 첫 아침 2531~2550) — 일부러 E를 많이 뺐으면 이 숫자도 같이 */
const LIMIT = 8 * 60 * 1000; setTimeout(() => { console.log('  ✗ 시간 초과(' + LIMIT / 60000 + '분) — 멈춤'); console.log('FAIL'); process.exit(1); }, LIMIT).unref();
let fails = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const mmss = s => Math.floor(s / 60) + '분 ' + String(Math.round(s % 60)).padStart(2, '0') + '초';
const errs = [], watch = (p, tag) => { p.on('pageerror', e => errs.push(tag + ' ' + e.message.slice(0, 200))); p.on('console', m => { if (m.type() === 'error' && !/favicon|404|501|ERR_|pointer lock|WebGL|GPU stall|Failed to load resource/.test(m.text())) errs.push(tag + ' ' + m.text().slice(0, 200)); }); };
const T00 = Date.now(), el = () => ((Date.now() - T00) / 1000).toFixed(0) + '초';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  try {
    console.log('⑤ 홍보판에 ?game=town — 막혀야 함');
    { const c = await b.newContext({ viewport: { width: 1280, height: 760 } }), p = await c.newPage(); watch(p, '홍보판');
      try { await p.goto(BASE + '/?game=town&town=' + ID); await p.waitForFunction(() => window.SD2 && SD2.map && SD2.map.game, null, { timeout: 120000 }); await p.waitForTimeout(4000);
        const A = await p.evaluate(() => ({ promo: !!window.SM_PROMO, cur: SD2.map.game.current ? SD2.map.game.current.id : null, ld: !!document.querySelector('.twn-ld'), town: !!window.SM_TOWN }));
        A.load = await p.evaluate(async id => { let r9 = 'pending'; SD2.map.game.load('town', { town: id }).then(v => { r9 = v ? 'started' : 'null'; }, e => { r9 = 'err ' + String(e).slice(0, 60); }); await new Promise(r => setTimeout(r, 3000)); const g = SD2.map.game.current ? SD2.map.game.current.id : null; if (g) SD2.map.game.stop(); return g ? g + '(' + r9 + ')' : r9; }, ID);   /* 막히지 않은 판은 다 짓기까지 안 돌아오므로 3초 뒤 지금 놀이를 봄 */
        ok(A.promo && !A.cur && !A.ld && !A.town, '홍보판 /?game=town = 마을 안 열림(홍보판 ' + A.promo + ' · 지금 놀이 ' + A.cur + ' · 짓는 화면 ' + A.ld + ')');
        ok(A.load === 'null', '홍보판 로더 loadGame(town) = 막힘(' + A.load + ')'); }
      catch (e) { ok(false, '홍보판 열기 ' + String(e.message || e).slice(0, 160)); }
      await c.close(); }

    console.log('① 우리 학교용 ?town=' + ID + ' — 마을이 열림 (' + el() + ')');
    const c = await b.newContext({ viewport: { width: 1366, height: 768 } }), p = await c.newPage(); watch(p, '마을');
    const URL = BASE + '/v2/?town=' + ID + '&adapt=0';
    const ready = async () => { const t9 = Date.now(), n9 = errs.length;   /* 240초 안 · 오류가 났는데 15초가 지나도 안 열리면 기다리지 않음(깨진 판에서 4분씩 서지 않게) */
      while (Date.now() - t9 < 240000) { if (await p.evaluate(() => !!(window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.story)).catch(() => false)) { await p.waitForTimeout(1500); return; }
        if (errs.length > n9 && Date.now() - t9 > 15000) throw new Error('오류로 마을이 안 열림 — ' + errs[n9]); await p.waitForTimeout(500); }
      throw new Error('240초 안에 마을이 안 열림'); };
    const nE = () => p.evaluate(() => SD2.map.interact.list().length);
    let t9 = Date.now(), built = false; try { await p.goto(URL); await ready(); built = true; } catch (e) { console.log('    ' + String(e.message || e).slice(0, 200)); }
    ok(built, '마을이 다 지어짐(' + ((Date.now() - t9) / 1000).toFixed(1) + '초 · 마을 짓기 ' + (built ? await p.evaluate(() => (SM_TOWN.load && SM_TOWN.load.ms) | 0) : '-') + 'ms)');
    if (!built) throw new Error('마을이 안 열림');
    const E0 = await nE(); ok(E0 >= E_MIN, '③ 짓기 끝 E 자리 ' + E0 + ' ≥ ' + E_MIN);
    const eOK = (n, tag) => ok(n >= E_MIN && n >= E0 * 0.9, '③ ' + tag + ' E 자리 ' + E0 + ' → ' + n + '(기준선 ' + E_MIN + ' · 처음의 90% ' + Math.ceil(E0 * 0.9) + ')');

    console.log('② 첫 아침 → 첫 장 첫 해 보기까지 걸어서 (' + el() + ')');
    await p.evaluate(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); await p.waitForTimeout(1200);
    const T0 = Date.now(), t = () => (Date.now() - T0) / 1000, Wk = walker(p, { t }), { S, shut, st } = Wk;
    const mark = n => console.log('   ' + mmss(t()) + '  ' + n), shot = async () => {};
    const R1 = await toFirstTry(Wk, { ok, mark, shot, mmss, t, PICK: '마트' });
    ok(st.maxJ < 2.0 && st.steps > 100, '순간이동 없음(0.12초 한 걸음 최대 ' + st.maxJ.toFixed(2) + 'm · 샘플 ' + st.steps + ')'); ok(!st.selfBad.length, '데려가기 단계에 빨간 선 0 ' + st.selfBad.slice(0, 4).join(' '));
    void R1; eOK(await nE(), '걷기 끝');

    console.log('③ 모자 쓰고 벗기 — 마을이 그대로 (' + el() + ')');
    { await p.evaluate(() => SM_TOWN.rwd.take('work', 3)); await p.waitForTimeout(200);
      const wear = async v => { await shut(); await p.evaluate(() => SM_TOWN.bagOpen()); await p.waitForTimeout(350); const r = await p.evaluate(v9 => { const b9 = document.querySelector('.twn-p [data-rww="hat:' + v9 + '"]'); if (b9) b9.click(); return !!b9; }, v); await p.waitForTimeout(300); await shut(); return r; };
      const w1 = await wear('straw'), h1 = await p.evaluate(() => SM_TOWN.rwd.hat()); await p.waitForTimeout(800); const w2 = await wear('-'); await p.waitForTimeout(2500); const h2 = await p.evaluate(() => SM_TOWN.rwd.hat());
      ok(w1 && h1 === 'straw' && w2 && h2 === '', '밀짚모자 쓰고(' + h1 + ') 벗음(' + JSON.stringify(h2) + ')'); eOK(await nE(), '모자 벗은 뒤'); }

    console.log('④ 저장 → 새로고침 → 그대로 (' + el() + ')');
    { const snap = () => p.evaluate(() => { const G = SM_TOWN.game(), S9 = G.S, s = SM_TOWN.story(); return { day: S9.day, money: S9.money, bag: JSON.stringify(S9.bag), cur: s.cur || null, step: s.step ? s.step.id : null, done: Object.keys((s.S && s.S.done) || {}).sort().join(','), hat: SM_TOWN.rwd.hat(), home: S9.home && S9.home.id, gen: S9.gen && S9.gen.id }; });
      await shut(); const A = await snap(), fl = await p.evaluate(() => SM_TOWN.save().flush()), sv = await p.evaluate(() => SM_TOWN.save());
      ok(fl === true && !sv.ro && sv.at > 0, '저장됨(flush ' + fl + ' · 읽기만 ' + sv.ro + ' · ' + sv.key + ')');
      t9 = Date.now(); let re = false; try { await p.reload(); await ready(); re = true; } catch (e) { console.log('    ' + String(e.message || e).slice(0, 200)); }
      ok(re, '새로고침 뒤 마을이 다시 지어짐(' + ((Date.now() - t9) / 1000).toFixed(1) + '초)');
      if (re) { const btn = await p.evaluate(() => { const b9 = document.querySelector('.twn-ld [data-a="x"]'); return b9 ? b9.textContent.trim() : ''; }); ok(/이어하기|Continue/.test(btn), "첫 화면 첫 단추 = 이어하기('" + btn + "')");
        await p.evaluate(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); await p.waitForTimeout(1500);
        const B = await snap(), sv2 = await p.evaluate(() => SM_TOWN.save()), diff = Object.keys(A).filter(k => A[k] !== B[k]);
        ok(sv2.had && !sv2.ro, '저장 판을 읽음(had ' + sv2.had + ' · 읽기만 ' + sv2.ro + ')');
        ok(!diff.length, '그대로 — ' + (diff.length ? diff.map(k => k + ' ' + JSON.stringify(A[k]) + ' → ' + JSON.stringify(B[k])).join(' · ') : '날 ' + B.day + ' · 돈 ' + B.money + ' · 장 ' + B.cur + '.' + B.step + ' · 끝낸 장 ' + B.done + ' · 모자 ' + JSON.stringify(B.hat)));
        eOK(await nE(), '새로고침 뒤'); } }
    await c.close();
  } catch (e) { console.log('  ✗ 멈춤: ' + String(e && e.stack || e).slice(0, 300)); fails++; }
  ok(!errs.length, '페이지 오류 ' + errs.length); for (const e of errs.slice(0, 8)) console.log('   ' + e);
  await b.close(); console.log((fails ? 'FAIL ' + fails : 'PASS') + ' (' + el() + ')'); process.exit(fails ? 1 : 0);
})();
