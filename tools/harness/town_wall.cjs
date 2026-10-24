// 마을 옹벽 전수·찍기(WALL-1 · 교사 10-24 '옹벽이 망친 그래픽이 너무 많아'): node tools/harness/town_wall.cjs [마을=ourtown] [포트=8002] [--census=파일.json] [--shots=폴더 --views=보기.json] [--walk]
//   --census = 고갯길 옹벽 표본(2.5m마다)·석축 단(비탈 위 건물 터)·돌계단·물가 석축 조각 수를 파일로(SM_TOWN.walls · 읽기만)
//   --shots + --views = 보기 목록([{n, at:[x,z], cam:[x,dy,z], look:[x,dy,z]}] · dy = 그 자리 땅 위 높이)마다 낮 맑음으로 한 장씩(카메라 고정 · 사람은 at에)
//   --walk = 보기마다 at에서 look 쪽으로 6초 걸어 막힘·떨어짐 기록(비탈로 바꾼 곳은 올라가지는지)
//   브라우저는 한 자리로(b1.sh · 맥 과열 X) · 끝나면 바로 닫음
const { chromium } = require('playwright');
const fs = require('fs');
const pos = process.argv.slice(2).filter(a => !a.startsWith('--')), ID = pos[0] || 'ourtown', PORT = pos[1] || '8002';
const arg = k => { const a = process.argv.find(s => s.startsWith('--' + k)); return a ? (a.includes('=') ? a.slice(a.indexOf('=') + 1) : true) : null; };
const CEN = arg('census'), SHOTS = arg('shots'), VIEWS = arg('views'), WALK = !!arg('walk');
(async () => { const T0 = Date.now(), b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }); const errs = [];
  try { const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
    p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(t)) errs.push(t.slice(0, 200)); });
    await p.goto('http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1'); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.walls && SM_TOWN.game && window.SD2, null, { timeout: 240000 }); await p.waitForTimeout(1500);
    await p.evaluate(() => { const b9 = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p button'); if (b9) b9.click(); }); await p.keyboard.press('Escape'); await p.waitForTimeout(600);
    const load = await p.evaluate(() => SM_TOWN.load);
    if (CEN) { const W = await p.evaluate(() => SM_TOWN.walls()); fs.writeFileSync(CEN, JSON.stringify({ ...W, load })); console.log('전수 → ' + CEN + ' · 옹벽 표본 ' + W.mw.length + ' · 석축 단 ' + W.terr.length + ' · 돌계단 ' + W.stairs + ' · 물가 석축 조각 ' + W.bank); }
    if (SHOTS && VIEWS) { const V = JSON.parse(fs.readFileSync(VIEWS, 'utf8')); fs.mkdirSync(SHOTS, { recursive: true });
      await p.addStyleTag({ content: '.chip,.gchip,.twn-mini,.twn-cellb,.twn-bag,.twn-task,.twn-comp,.twn-keys,#hudGoal,#toast,#hudBan,.twn-p{display:none!important}' });
      await p.evaluate(() => { const G = typeof SM_TOWN.game === 'function' ? SM_TOWN.game() : SM_TOWN.game; const g = G.S ? G : { S: G }; if (g.setClock) g.setClock(false); g.S.min = 11 * 60; if (SD2.map.time) SD2.map.time('day'); SM_TOWN.rules.wx('clear'); });
      const walk = [];
      for (const v0 of V) { let v = v0;
        if (v0.place || v0.wk) { const T = await p.evaluate(v9 => { if (v9.wk) { const w = SM_TOWN.rules.wk(v9.wk); return w && [w.x, w.z]; } const q = SM_TOWN.places().find(q9 => q9.name && q9.name.includes(v9.place)); return q && (q.door || [q.x, q.z]); }, v0); if (!T) { console.log('  찾지 못함: ' + v0.n); continue; } const [dx, dy, dz] = v0.rel || [10, 3, 10]; v = { n: v0.n, at: [T[0] + dx * 0.6, T[1] + dz * 0.6], cam: [T[0] + dx, dy, T[1] + dz], look: [T[0], 1.5, T[1]] }; }
        await p.evaluate(v9 => { const g = (x, z) => SM_TOWN.ground(x, z); SD2.camOvr(null); SD2.map.player.teleport([v9.at[0], g(v9.at[0], v9.at[1]) + 0.1, v9.at[1]]); if (v9.look) SD2.map.player.lookAt([v9.look[0], v9.look[2]]); }, v); await p.waitForTimeout(900);
        if (v.cam) await p.evaluate(v9 => { const g = (x, z) => SM_TOWN.ground(x, z), C = v9.cam, Lk = v9.look, cy = (C[3] != null ? C[3] : g(C[0], C[2])) + C[1], ly = (Lk[3] != null ? Lk[3] : g(Lk[0], Lk[2])) + Lk[1]; SD2.camOvr(() => { SD2.camera.position.set(C[0], cy, C[2]); SD2.camera.lookAt(Lk[0], ly, Lk[2]); }); }, v);
        await p.waitForTimeout(1300); await p.screenshot({ path: SHOTS.replace(/\/$/, '') + '/' + v.n + '.png' });
        if (WALK && v.look) { await p.evaluate(() => SD2.camOvr(null)); const r = await p.evaluate(async v9 => { const g = (x, z) => SM_TOWN.ground(x, z), P = () => SD2.map.player.pos(); SD2.map.player.teleport([v9.at[0], g(v9.at[0], v9.at[1]) + 0.1, v9.at[1]]); SD2.map.player.lookAt([v9.look[0], v9.look[2]]); await new Promise(r9 => setTimeout(r9, 300)); const a = P(), y0 = a.y; let mx = 0; return { a: [a.x, a.y, a.z], y0, mx }; }, v);
          await p.keyboard.down('KeyW'); await p.waitForTimeout(6000); await p.keyboard.up('KeyW'); const e = await p.evaluate(() => { const q = SD2.map.player.pos(); return [q.x, q.y, q.z]; }); const dist = Math.hypot(e[0] - r.a[0], e[2] - r.a[2]); walk.push({ n: v.n, dist: +dist.toFixed(1), dy: +(e[1] - r.a[1]).toFixed(2) }); }
      }
      await p.evaluate(() => SD2.camOvr(null)); if (WALK) { console.log('걷기(6초 앞으로): ' + JSON.stringify(walk)); fs.writeFileSync(SHOTS.replace(/\/$/, '') + '/walk.json', JSON.stringify(walk)); }
      console.log('찍음 ' + V.length + '장 → ' + SHOTS); }
  } catch (e) { errs.push('하네스: ' + String(e.message || e).slice(0, 300)); }
  console.log('페이지 오류 ' + errs.length + (errs.length ? ' · ' + errs.slice(0, 4).join(' | ') : '') + ' · ' + ((Date.now() - T0) / 1000).toFixed(0) + '초'); await b.close(); process.exit(errs.length ? 1 : 0); })();
