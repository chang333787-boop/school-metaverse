// 징검다리 걸어서 건너기 시험(STONES-2 · 사용자 10-18 '징검다리 퀘스트 왜 이래' · '깨면 존나 빠르게 다다다다'): node tools/harness/town_stones.cjs [마을=ourtown] [포트=8002]
//   돌다리마다 한쪽 둔치에 세우고 W로 걸어 건넘 → 건너편 도착 · 물에 안 빠짐 · '징검다리를 다 건넜어요' 배너 · 👣 도장 · 순간이동 없음 · 다시 건너도 같은 날 보상 X
const { chromium } = require('playwright');
const ID = process.argv[2] || 'ourtown', PORT = process.argv[3] || '8002', URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  try { const p = await (await b.newContext({ viewport: { width: 1366, height: 768 } })).newPage(), errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2, null, { timeout: 240000 }); await p.waitForTimeout(1500);
    await p.evaluate(() => { const b = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p button'); if (b) b.click(); }); await p.keyboard.press('Escape'); await p.waitForTimeout(1500);
    const SB = await p.evaluate(() => SM_TOWN.bridgesAll().filter(b => b.kind === '돌다리' && b.ax)); console.log('돌다리 ' + SB.length + '개'); ok(SB.length > 0, '돌다리 있음');
    for (let i = 0; i < Math.min(3, SB.length); i++) { const B = SB[i];
      for (const pass of [0, 1]) { const [A0, A1] = pass ? [B.ax[1], B.ax[0]] : B.ax;
        await p.evaluate(a => { const M = SD2.map; M.player.teleport([a[0], SM_TOWN.ground(a[0], a[1]) + 0.05, a[1]]); }, A0); await p.waitForTimeout(700);
        await p.evaluate(() => { const t = document.getElementById('hudBan'); if (t) t.textContent = ''; });
        await p.keyboard.down('KeyW'); let r = null, minY = 1e9, maxJ = 0, last = null;
        for (let k = 0; k < 80; k++) { r = await p.evaluate(a => { const M = SD2.map; M.player.lookAt(a); const q = M.player.get(); return { x: q.x, y: q.y, z: q.z, d: Math.hypot(q.x - a[0], q.z - a[1]), ban: (document.getElementById('hudBan') || {}).textContent || '' }; }, A1);
          if (last) maxJ = Math.max(maxJ, Math.hypot(r.x - last.x, r.z - last.z)); last = r; minY = Math.min(minY, r.y); if (r.d < 1.2) break; await p.waitForTimeout(200); }
        await p.keyboard.up('KeyW'); await p.waitForTimeout(600); const ban = await p.evaluate(() => (document.getElementById('hudBan') || {}).textContent || '');
        const tag = '돌다리 ' + (i + 1) + (pass ? ' 되돌아' : ' 건너');
        ok(r.d < 1.6, tag + ' — 건너편 도착(남은 ' + r.d.toFixed(1) + 'm)'); ok(maxJ < 1.5, tag + ' — 순간이동 없음(0.2초 최대 ' + maxJ.toFixed(2) + 'm)'); ok(minY > B.y1 - 0.6, tag + ' — 물에 안 빠짐(가장 낮은 y ' + minY.toFixed(2) + ' · 돌 윗면 ' + B.y1 + ')');
        if (i === 0) ok(pass ? !/징검다리를 다 건넜/.test(ban + r.ban) : /징검다리를 다 건넜/.test(ban + r.ban), tag + (pass ? ' — 같은 날 다시 = 배너 X' : ' — 배너 \'징검다리를 다 건넜어요\''));
      } }
    ok(await p.evaluate(() => !!(SM_TOWN.game.S && SM_TOWN.game.S.dex && Object.keys(SM_TOWN.game.S.dex).some(k => k.includes('👣'))) || /👣/.test((document.querySelector('.twn-bag') || {}).textContent || '')), '👣 도장(가방·도감)');
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.join(' | ') : ''));
  } finally { await b.close(); }
  console.log(fails.length ? 'FAIL ' + fails.length : 'PASS'); process.exit(fails.length ? 1 : 0); })();
