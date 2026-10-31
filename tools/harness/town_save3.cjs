// 💾 SAVE-3b 저장 지키기 브라우저 시험(10-31 · 코덱스 A·C) — node tools/harness/town_save3.cjs <포트> [--old=<고치기 전 판 포트>]
//   A 홍보판(PAGE=/)에 ?game=town을 붙여도 마을이 안 열림(E1 · main.js 로더 + mapapi loadGame)
//   B 비밀번호 열쇠 = '반:s번호' — 다른 반 같은 번호는 '처음이에요' · 옛 's번호'는 그 반 새 열쇠 판이 있을 때만 옮김 · 옛 id@s03 판은 저절로 안 옮기고 '이전 저장 불러오기'를 물음
//   C 짓는 동안 그만하기(E4) = 서버 올리기 45초 interval · 저장 듣기(storage·pagehide·beforeunload)가 남지 않음
//   D 잠 = day 처리 뒤 한 번 저장 — 저장된 판에 밤사이 자란 칸(S.grew)
//   서버: 빈 포트 python3 -m http.server <포트> --bind 127.0.0.1 · 반 코드는 zz… · 서버 저장(cf)은 같은 출처 정적 서버로 돌려 실제 서버에 안 씀 · 페이지 오류 0
const { chromium } = require('./pw.cjs');
const A9 = process.argv.slice(2), PORT = A9.find(a => /^\d+$/.test(a)) || '8002', OLD = (A9.find(a => a.startsWith('--old=')) || '').slice(6);
const GPU = ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'];
const wait = ms => new Promise(r => setTimeout(r, ms));
const errs = []; const watch = (p, tag) => { p.on('pageerror', e => errs.push(tag + ' ' + e.message.slice(0, 160))); p.on('console', m => { if (m.type() === 'error' && !/favicon|404|501|ERR_|pointer lock|WebGL|GPU stall|Failed to load resource/.test(m.text())) errs.push(tag + ' ' + m.text().slice(0, 160)); }); };
const txt = p => p.evaluate(() => document.body.innerText);
const pins = async (p, d) => { for (const c of d) await p.click('button[data-p="' + c + '"]'); };
async function run(b, port, tag) {
  const base = 'http://127.0.0.1:' + port, R = { tag };
  { const c = await b.newContext({ viewport: { width: 1280, height: 760 } }), p = await c.newPage(); watch(p, tag + ':A');
    await p.goto(base + '/?game=town&town=ourtown'); await p.waitForFunction(() => window.SD2 && SD2.map && SD2.map.game, null, { timeout: 120000 }); await wait(5000);
    R.A = await p.evaluate(() => ({ promo: !!window.SM_PROMO, cur: SD2.map.game.current ? SD2.map.game.current.id : null, ld: !!document.querySelector('.twn-ld') }));
    R.A.load = await p.evaluate(async () => { let r9 = 'pending'; SD2.map.game.load('town', { town: 'ourtown' }).then(v => { r9 = v ? 'started' : 'null'; }); await new Promise(r => setTimeout(r, 3000)); const id = SD2.map.game.current ? SD2.map.game.current.id : null; SD2.map.game.stop(); return id ? id + '(' + r9 + ')' : r9; });   /* 고치기 전 판은 마을을 다 짓기까지 안 돌아오므로 기다리지 않고 3초 뒤 지금 놀이를 봄 */
    await c.close(); }
  { const c = await b.newContext({ viewport: { width: 1280, height: 760 } }), p = await c.newPage(); watch(p, tag + ':B');
    await p.goto(base + '/tools/'); await p.evaluate(() => { localStorage.setItem('sm-town-login', JSON.stringify({ s3: '1111' })); localStorage.setItem('sm-town-game:ourtown@zzpina:s03', JSON.stringify({ v: 2, day: 4, min: 600, bag: {}, money: 40 })); localStorage.setItem('sm-town-game:ourtown@s03', JSON.stringify({ v: 2, day: 6, min: 600, bag: {}, money: 60 })); });
    const U = cls => base + '/v2/?town=ourtown&login=1&adapt=0&cls=' + cls + '&cf=' + encodeURIComponent(base);
    await p.goto(U('zzpinb')); await p.waitForSelector('button[data-n="3"]', { timeout: 120000 }); await p.click('button[data-n="3"]'); await wait(300);
    R.B = { otherCls: /처음이에요/.test(await txt(p)) ? '처음이에요' : /비밀번호 네 자리를 눌러요/.test(await txt(p)) ? '비밀번호 물음' : '?' };
    await p.goto(U('zzpina')); await p.waitForSelector('button[data-n="3"]', { timeout: 120000 }); await p.click('button[data-n="3"]'); await wait(300);
    R.B.sameCls = /비밀번호 네 자리를 눌러요/.test(await txt(p)) ? '비밀번호 물음' : /처음이에요/.test(await txt(p)) ? '처음이에요' : '?'; R.B.pinMap = await p.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('sm-town-login') || '{}')).sort().join(','));
    await p.goto(U('zzpinb')); await p.waitForSelector('button[data-n="3"]', { timeout: 120000 }); await p.click('button[data-n="3"]'); await wait(300); await pins(p, '1111'); await wait(1500);
    if (/한 번 더 눌러요/.test(await txt(p))) { await pins(p, '1111'); await wait(1500); }
    R.B.offer = await p.evaluate(() => { const b9 = document.querySelector('button[data-a="imp"]'); const t = b9 ? b9.closest('div').parentElement.innerText.replace(/\s+/g, ' ').slice(0, 80) : ''; return t; });
    if (R.B.offer) { await p.click('button[data-a="imp"]'); await wait(500); } else await wait(3000);
    R.B.moved = await p.evaluate(() => { const j = JSON.parse(localStorage.getItem('sm-town-game:ourtown@zzpinb:s03') || 'null'); return { day: j ? j.day : null, mark: localStorage.getItem('sm-town-game:ourtown@s03:moved') }; });
    await c.close(); }
  { const c = await b.newContext({ viewport: { width: 1280, height: 760 } });
    await c.addInitScript(() => { window.__iv = {}; const si = window.setInterval, ci = window.clearInterval; window.setInterval = function (f, ms, ...a) { const id = si.call(window, f, ms, ...a); if (ms === 45000) window.__iv[id] = 1; return id; }; window.clearInterval = function (id) { delete window.__iv[id]; return ci.call(window, id); };
      window.__ls = { storage: 0, pagehide: 0, beforeunload: 0 }; const ae = window.addEventListener, re = window.removeEventListener; window.addEventListener = function (k, f, o) { if (k in window.__ls) window.__ls[k]++; return ae.call(this, k, f, o); }; window.removeEventListener = function (k, f, o) { if (k in window.__ls) window.__ls[k]--; return re.call(this, k, f, o); }; });
    const p = await c.newPage(); watch(p, tag + ':C'); await p.goto(base + '/v2/?town=ourtown&login=1&adapt=0&cls=zzcan&cf=' + encodeURIComponent(base));
    await p.waitForSelector('button[data-n="5"]', { timeout: 120000 }); const L0 = await p.evaluate(() => ({ ...window.__ls }));
    await p.click('button[data-n="5"]'); await wait(200); await pins(p, '1234'); await wait(1500); if (/한 번 더 눌러요/.test(await txt(p))) { await pins(p, '1234'); await wait(500); }
    await p.waitForFunction(() => Object.keys(window.__iv).length >= 1 && document.querySelector('.twn-ld'), null, { timeout: 120000 });
    const L1 = await p.evaluate(() => ({ ...window.__ls, iv: Object.keys(window.__iv).length }));
    await p.evaluate(() => SD2.map.game.stop('button')); const t0 = Date.now();
    await p.waitForFunction(() => !document.querySelector('.twn-ld'), null, { timeout: 300000 }); await wait(1500);
    const L2 = await p.evaluate(() => ({ ...window.__ls, iv: Object.keys(window.__iv).length, cur: SD2.map.game.current ? SD2.map.game.current.id : null }));
    R.C = { before: L0, building: L1, after: L2, waitS: Math.round((Date.now() - t0) / 1000) }; await c.close(); }
  { const c = await b.newContext({ viewport: { width: 1280, height: 760 } }), p = await c.newPage(); watch(p, tag + ':D');
    await p.goto(base + '/v2/?town=ourtown&adapt=0'); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && SM_TOWN.save, null, { timeout: 300000 }); await wait(1200);
    await p.evaluate(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); await wait(1500);
    R.D = await p.evaluate(() => { const G = SM_TOWN.game(), d0 = G.S.day; G.sleep(); const j = JSON.parse(localStorage.getItem(SM_TOWN.save().key) || 'null'); return { d0, day: G.S.day, saved: j ? j.day : null, grew: j && j.grew ? j.grew : null, gen: j && j.gen ? j.gen.id : null }; });
    await wait(3000); await c.close(); }
  return R; }
(async () => {
  const b = await chromium.launch({ args: GPU }); const out = [];
  try { if (OLD) out.push(await run(b, OLD, '고치기 전')); out.push(await run(b, PORT, '고친 뒤')); } catch (e) { console.error(e); errs.push('하네스 ' + e.message.slice(0, 200)); }
  await b.close(); let fails = 0;
  for (const R of out) { const nw = R.tag === '고친 뒤', ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c && nw) fails++; }; console.log('── ' + R.tag + ' (' + (nw ? PORT : OLD) + ')');
    if (R.A) { ok(R.A.promo && !R.A.cur && !R.A.ld, 'A 홍보판 /?game=town&town=ourtown = 마을 안 열림 (지금 놀이 ' + R.A.cur + ' · 짓는 화면 ' + R.A.ld + ')'); ok(R.A.load === 'null', 'A 홍보판 로더 loadGame(town) = 막힘 (' + R.A.load + ')'); }
    if (R.B) { ok(R.B.otherCls === '처음이에요', 'B 다른 반(zzpinb) 3번 = 처음이에요 (' + R.B.otherCls + ')'); ok(R.B.sameCls === '비밀번호 물음' && /zzpina:s3/.test(R.B.pinMap) && !/zzpinb:s3/.test(R.B.pinMap), 'B 새 열쇠 판이 있는 반(zzpina)만 옛 비밀번호를 옮김 (' + R.B.sameCls + ' · ' + R.B.pinMap + ')');
      ok(!!R.B.offer && R.B.moved.day === 6 && R.B.moved.mark === 'zzpinb', 'B 옛 id@s03 판 = 옛 비밀번호와 같을 때 물어보고(이전 저장 불러오기) 옮김 (물음 「' + R.B.offer + '」 · 옮긴 판 ' + R.B.moved.day + '일째)'); }
    if (R.C) { const a = R.C.after, z = R.C.before; ok(a.iv === 0, 'C 짓는 동안 그만하기 → 서버 올리기 45초 interval 남음 ' + a.iv + ' (짓는 중 ' + R.C.building.iv + ')'); ok(a.storage === z.storage && a.pagehide === z.pagehide && a.beforeunload === z.beforeunload, 'C 저장 듣기 남음 = storage ' + (a.storage - z.storage) + ' · pagehide ' + (a.pagehide - z.pagehide) + ' · beforeunload ' + (a.beforeunload - z.beforeunload) + ' (짓는 중 ' + (R.C.building.storage - z.storage) + '·' + (R.C.building.pagehide - z.pagehide) + '·' + (R.C.building.beforeunload - z.beforeunload) + ' · ' + R.C.waitS + '초)'); }
    if (R.D) ok(R.D.saved === R.D.day && R.D.grew && R.D.grew.d === R.D.day, 'D 잠 저장에 밤사이 자란 칸(grew) = ' + JSON.stringify(R.D.grew) + ' (' + R.D.d0 + ' → ' + R.D.day + '일째 · 저장 ' + R.D.saved + '일째 · 세대 ' + R.D.gen + ')'); }
  const eN = errs.filter(e => e.startsWith('고친 뒤') || e.startsWith('하네스')); console.log('페이지 오류(고친 뒤) ' + eN.length); for (const e of errs.slice(0, 10)) console.log('   ' + e); if (eN.length) fails++;
  console.log(fails ? 'FAIL ' + fails : 'PASS'); process.exit(fails ? 1 : 0);
})();
