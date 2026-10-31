// 인트로 카메라 자리 고르기(살펴보기용): node tools/export/test/uri_probe.cjs [포트=8655] --shots=폴더 [--cams=JSON 파일]
//   첫 화면이 뜨면 집·장소 자리를 적고, cams 파일의 자리마다 카메라를 옮겨 사진을 찍음 — 화면 위 창·칩은 숨김
const { chromium } = require('./pw.cjs');
const fs = require('fs');
const PORT = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '8655';
const arg = k => { const a = process.argv.find(s => s.startsWith('--' + k)); return a ? (a.includes('=') ? a.slice(a.indexOf('=') + 1) : true) : null; };
const SHOTS = arg('shots'), CAMS = arg('cams') ? JSON.parse(fs.readFileSync(arg('cams'), 'utf8')) : [];
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  try {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } }), p = await ctx.newPage();
    p.on('pageerror', e => console.log('ERR', e.message.slice(0, 200)));
    await p.goto('http://127.0.0.1:' + PORT + '/?intro=0');
    await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.title && SM_TOWN.title(), null, { timeout: 240000 });
    await p.waitForTimeout(1500);
    const info = await p.evaluate(() => {
      const H = SM_TOWN.home(), hs = SM_TOWN.homeSpot();
      const P = (SM_TOWN.places ? SM_TOWN.places() : []).filter(q => !q.nat).map(q => [q.name, Math.round(q.x), Math.round(q.z), q.kind]);
      const fog = SD2.scene.fog ? [Math.round(SD2.scene.fog.near), Math.round(SD2.scene.fog.far)] : null;
      const G = SM_TOWN.game().S;
      return { H: H && { e: H.e, board: H.board, fw: H.fw, id: H.id, name: H.name }, hs, nP: P.length, P, fog, far: SD2.camera.far, min: G.min, day: G.day, me: SD2.map.player.get() };
    });
    console.log(JSON.stringify({ ...info, P: undefined }));
    fs.writeFileSync((SHOTS || '.') + '/places.json', JSON.stringify(info.P));
    await p.addStyleTag({ content: 'body > *:not(#scene){visibility:hidden!important}' });
    for (const [i, c] of CAMS.entries()) {
      await p.evaluate(c9 => { const C = SD2.camera; let ax = 0, az = 0, ay = 0;
        if (c9.rel) { let a = null; if (c9.rel === 'home') { const h = SM_TOWN.homeSpot(); a = Array.isArray(h) ? h : [h.x, h.z]; } else if (c9.rel === 'gate') a = [15.4, 50]; else { const q = SM_TOWN.places().find(q9 => q9.name === c9.rel); a = q ? [q.x, q.z] : [0, 0]; } ax = a[0]; az = a[1]; ay = SM_TOWN.ground(ax, az); }
        const P = [ax + c9.p[0], ay + c9.p[1], az + c9.p[2]], L = [ax + c9.l[0], ay + c9.l[1], az + c9.l[2]];
        SD2.camOvr(() => { C.position.set(P[0], P[1], P[2]); C.lookAt(L[0], L[1], L[2]); }); }, c);
      await p.waitForTimeout(c.wait || 2500);
      const fog = await p.evaluate(() => SD2.scene.fog ? [Math.round(SD2.scene.fog.near), Math.round(SD2.scene.fog.far), SD2.camera.far] : null);
      if (SHOTS) await p.screenshot({ path: SHOTS + '/cam_' + (c.n || i) + '.png' });
      console.log('cam', c.n || i, JSON.stringify(c.p), 'fog', JSON.stringify(fog));
    }
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exit(2); });
