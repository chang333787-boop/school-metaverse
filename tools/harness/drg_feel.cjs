// 드래곤 걷기·카메라 손맛 시험(11-01 조작감 팀 A): node tools/harness/drg_feel.cjs [repo=.] [--places=village,hall,arena,forest,cove] [--sec=45] [--lat=1] [--jump=1]
//   ① 장소마다(?scene=place) 이름 자리를 차례로 걸음 — A* 길(보이는 벽) · 끌기로 방향 + W · 가끔 Shift 달리기 · 가끔 Space 점프 · 실제 시간(turbo 1)
//      걸음마다: 막힘(W를 누르는데 0.6초에 0.25m도 못 감 → 좌표) · 걸림(달리다 속도가 반 밑으로 뚝 → 좌표)
//      그리기마다: 몸·카메라 높이 흔들림(위아래 속도가 0.2m/s 넘게 뒤집힌 횟수/초 · 가속 99%) · 카메라 거리 툭(한 프레임 0.3m 넘게 · 좌표)
//   ② 입력 늦음: W 누름 → 몸이 움직인 첫 그림 · 끌기 → 카메라가 돈 첫 그림 — ⚡ 부드럽게(60) / 🎨 그래픽 우선(30) 견줌
//   그리기 켬 시험 → tools/ops/b2.sh로 돌린다
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '.');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : d; };
const PLACES = arg('places', 'village,hall,arena,forest,cove').split(',').filter(Boolean), SEC = +arg('sec', 45), LAT = arg('lat', '1') === '1', JUMP = arg('jump', '1') === '1';
const types = { '.js': 'text/javascript', '.html': 'text/html', '.glb': 'model/gltf-binary', '.png': 'image/png', '.json': 'application/json', '.webp': 'image/webp' };
const srv = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]), p = path.join(root, u, u.endsWith('/') ? 'index.html' : ''); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); r.end(d); }); });
srv.listen(0, async () => {
  const base = 'http://127.0.0.1:' + srv.address().port;
  const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  const p = await (await b.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 200)));
  const V = (fs.readFileSync(path.join(root, 'dragon/index.html'), 'utf8').match(/main\.js\?v=(\d+)/) || [])[1];
  const open = async (q) => { await p.goto(base + '/dragon/?' + q); await p.waitForFunction(() => window.DRG && DRG.world && DRG.world.W && DRG.world.hic && DRG.loop && DRG.loop.n > 30, null, { timeout: 120000 }); };
  const rows = [];
  for (const name of PLACES) {
    await open(`scene=place&p=${name}&seed=1&mode=smooth`);
    const r = await p.evaluate(async ({ V, SEC, JUMP }) => {
      const { planPath } = await import('/dragon/js/bots/story_bots.js?v=' + V);
      const Wd = DRG.world, pl = Wd.place, W = () => Wd.W, C = () => Wd.C, cam = DRG.camera;
      const ob = pl.walls || [], rocks = (pl.blockers || []).map((q) => [q.x, q.z, q.r]);
      const A = Object.entries(pl.anchors || {}).map(([k, a]) => ({ k, x: a.x, z: a.z, y: a.y })).filter((a) => Number.isFinite(a.x));
      { const ms = pl.mapSketch ? pl.mapSketch() : null; if (ms && ms.path) ms.path.forEach((q, i) => { if (i % 4 === 2) A.push({ k: 'path' + i, x: q[0], z: q[1] }); }); }   // 지도 길(숲길)도 걸어 봄
      /* 가까운 차례로 한 바퀴(가장 가까운 안 간 자리) · 너무 먼(55m 넘는) 자리는 사이에 중간 점 */
      { const out = [], left = A.slice(); let cx = W().x, cz = W().z; while (left.length) { let bi = 0, bd = 1e9; left.forEach((a, i) => { const d = Math.hypot(a.x - cx, a.z - cz); if (d < bd) { bd = d; bi = i; } }); const a = left.splice(bi, 1)[0]; out.push(a); cx = a.x; cz = a.z; } A.length = 0; A.push(...out); }
      const near = (x0, z0, x1, z1, pad) => ob.filter((w) => Math.max(w[0], w[2]) > Math.min(x0, x1) - pad && Math.min(w[0], w[2]) < Math.max(x0, x1) + pad && Math.max(w[1], w[3]) > Math.min(z0, z1) - pad && Math.min(w[1], w[3]) < Math.max(z0, z1) + pad);
      const S = { stuck: [], hitch: [], camJump: [], steps: 0, moveSteps: 0, jumps: 0, path: 0, reached: 0, tried: 0 };
      /* 그리기마다 기록 */
      const F = []; const d0 = Wd.draw.bind(Wd); let lastNow = 0;
      Wd.draw = (a) => { d0(a); const w = W(), c = C(), now = performance.now(); if (!w || !c) return; const h = Wd.hic.position; F.push([now, h.y, w.dAir || 0, cam.position.y, Math.hypot(cam.position.x - h.x, cam.position.y - h.y - 1.5, cam.position.z - h.z), w.x, w.z, w.speed, w.inAir || w.rollT > 0 ? 1 : 0, c.d != null ? c.d : 0, c.ly || 0, c.by || 0, cam.position.x, cam.position.z]); lastNow = now; };
      /* 걷는 봇 — 끌기 + W(이따금 Shift · Space) */
      let ti = -1, path = null, pk = 0, tgtT = 0, lx = 0, lz = 0, chkT = 0, stuckT = 0, runOn = false, jumpCd = 2, last = null, fastT = 0, slowT = 0;
      const next = () => { ti++; if (ti >= A.length) ti = 0; const t = A[ti], w = W(); S.tried++; const far = Math.hypot(t.x - w.x, t.z - w.z); if (far > 120) { path = null; return; }
        const rk = rocks.filter((q) => Math.abs(q[0] - (w.x + t.x) / 2) < Math.abs(t.x - w.x) / 2 + 12 && Math.abs(q[1] - (w.z + t.z) / 2) < Math.abs(t.z - w.z) / 2 + 12);
        path = planPath(w.x, w.z, t.x, t.z, near(w.x, w.z, t.x, t.z, 10), 0.5, far > 55 ? 0.9 : 0.5, 10, rk) || null; pk = 0; tgtT = 0; };   // 먼 자리 = 굵은 칸
      const seenNear = (L, x, z) => L.some((q) => Math.hypot(q[0] - x, q[1] - z) < 2.5);
      const n0 = DRG.loop.n;
      DRG.bot.run((n, B) => {
        const w = W(), c = C(); if (!w || !c) return;
        const dt = 1 / 60; S.steps++;
        if (!path || pk >= path.length) { next(); if (!path || !path.length) { path = null; B.release('KeyW'); return; } }
        const t = path[pk], dx = t[0] - w.x, dz = t[1] - w.z, d = Math.hypot(dx, dz); tgtT += dt;
        if (d < (pk === path.length - 1 ? 1.2 : 0.9)) { pk++; if (pk >= path.length) S.reached++; return; }
        if (tgtT > 40) { path = null; return; }
        const want = Math.atan2(dx, dz), my = c.yaw + Math.PI, da = Math.atan2(Math.sin(want - my), Math.cos(want - my));
        if (Math.abs(da) > 0.02) B.drag(Math.max(-14, Math.min(14, -da / 0.006 * 0.35)), (0.24 - c.pitch) / 0.004 * 0.1);   // 사람 손 빠르기(초당 5 rad까지)
        const go = Math.abs(da) < 0.7; if (go) B.press('KeyW'); else B.release('KeyW');
        if ((n % 600) === 0) { runOn = !runOn; if (runOn) B.press('ShiftLeft'); else B.release('ShiftLeft'); }
        if (JUMP && (jumpCd -= dt) <= 0 && go) { jumpCd = 2.5 + (n % 7) * 0.3; B.hold('Space', 2); S.jumps++; }
        /* 막힘 · 걸림 */
        if (go) {
          S.moveSteps++;
          chkT += dt; if (chkT >= 0.6) { if (Math.hypot(w.x - lx, w.z - lz) < 0.25) { stuckT += chkT; if (!seenNear(S.stuck, w.x, w.z)) S.stuck.push([+w.x.toFixed(1), +w.z.toFixed(1), +w.y.toFixed(2)]); if (stuckT > 2.4) { path = null; stuckT = 0; } } else stuckT = 0; chkT = 0; lx = w.x; lz = w.z; }
          if (!w.inAir) { if (w.speed > 3.6) { if (slowT > 0.08 && slowT < 0.6 && fastT > 0.4 && !seenNear(S.hitch, w.x, w.z)) S.hitch.push([+w.x.toFixed(1), +w.z.toFixed(1), +slowT.toFixed(2)]); fastT += dt; slowT = 0; } else if (fastT > 0.4 && w.speed < 2.0 && Math.abs(da) < 0.25) slowT += dt; else { fastT = 0; slowT = 0; } }
        } else { chkT = 0; lx = w.x; lz = w.z; fastT = 0; slowT = 0; }
      });
      await new Promise((res) => setTimeout(res, SEC * 1000));
      DRG.bot.stop(); Wd.draw = d0;
      /* 그리기 기록 → 흔들림 · 카메라 툭 */
      const flips = { body: 0, cam: 0 }, acc = { body: [], cam: [] }; let walkSec = 0, pvb = null, pvc = null, lvb = 0, lvc = 0, cj = 0;
      for (let i = 2; i < F.length; i++) {
        const f = F[i], g = F[i - 1], dtf = (f[0] - g[0]) / 1000; if (dtf <= 0 || dtf > 0.1) continue;
        if (f[7] < 0.5 || f[8] || g[8] || f[2] > 0 || g[2] > 0) { pvb = pvc = null; continue; }   // 서 있을 때·점프 중은 뺌(흔들림 = 걸을 때 땅 따라) · 빠진 뒤 첫 그림은 빠르기만 잡음
        walkSec += dtf;
        const vb = (f[1] - g[1]) / dtf, vc = (f[3] - g[3]) / dtf;
        if (pvb != null) {
          if (Math.sign(vb) !== Math.sign(pvb) && Math.abs(vb) > 0.2 && Math.abs(pvb) > 0.2) flips.body++;
          if (Math.sign(vc) !== Math.sign(pvc) && Math.abs(vc) > 0.2 && Math.abs(pvc) > 0.2) flips.cam++;
          acc.body.push(Math.abs(vb - lvb) / dtf); acc.cam.push(Math.abs(vc - lvc) / dtf);
        }
        lvb = vb; lvc = vc; if (pvb == null || Math.abs(vb) > 0.05) pvb = vb; if (pvc == null || Math.abs(vc) > 0.05) pvc = vc;
        if (Math.abs(f[4] - g[4]) > 0.3 && Math.abs(f[4] - g[4]) / dtf > 12) { cj++; if (!seenNear(S.camJump, f[5], f[6])) S.camJump.push([+f[5].toFixed(1), +f[6].toFixed(1), +(f[4] - g[4]).toFixed(2), 'd' + (f[9] - g[9]).toFixed(2), 'ly' + (f[10] - g[10]).toFixed(2), 'xz' + Math.hypot(f[12] - g[12], f[13] - g[13]).toFixed(2), 'ms' + (dtf * 1000).toFixed(0)]); }
      }
      const p99 = (L) => { const s = L.slice().sort((a, b) => a - b); return s.length ? +s[Math.floor(s.length * 0.99)].toFixed(1) : 0; };
      return { errs: DRG.diag().errs.slice(-3), anchors: A.length, reached: S.reached, frames: F.length, walkSec: +walkSec.toFixed(1), stuck: S.stuck, hitch: S.hitch, camJump: S.camJump, camJumps: cj,
        flipB: +(flips.body / Math.max(1, walkSec)).toFixed(2), flipC: +(flips.cam / Math.max(1, walkSec)).toFixed(2), accB: p99(acc.body), accC: p99(acc.cam), jumps: S.jumps };
    }, { V, SEC, JUMP });
    rows.push([name, r]);
    console.log(`${name}: 자리 ${r.reached}/${r.anchors} · 걸은 그림 ${r.walkSec}초 · 막힘 ${r.stuck.length} ${JSON.stringify(r.stuck)} · 걸림 ${r.hitch.length} ${JSON.stringify(r.hitch)} · 카메라 툭 ${r.camJumps}번 ${JSON.stringify(r.camJump.slice(0, 6))} · 위아래 뒤집힘/초 몸 ${r.flipB} 카메라 ${r.flipC} · 가속99% 몸 ${r.accB} 카메라 ${r.accC} m/s² · 점프 ${r.jumps}${r.errs.length ? ' · 오류 ' + r.errs.join(' / ') : ''}`);
  }
  if (LAT) for (const mode of ['smooth', 'gfx']) {
    await open(`scene=place&p=arena&seed=1&mode=${mode}`);
    await p.evaluate(() => {
      const Wd = DRG.world, cam = DRG.camera; window.__L = { key: [], look: [] };
      let k0 = 0, kp = null, m0 = 0, mq = null;
      addEventListener('keydown', (e) => { if (e.code === 'KeyW' || e.code === 'KeyS') { k0 = performance.now(); kp = Wd.hic.position.clone(); } }, true);
      document.getElementById('scene').addEventListener('pointermove', (e) => { if (e.buttons && !mq) { m0 = performance.now(); mq = cam.quaternion.clone(); } }, true);
      const d0 = Wd.draw.bind(Wd);   /* 그린 뒤(렌더 직전) 몸 자리·카메라 방향이 바뀌었나 */
      Wd.draw = (a) => { d0(a); const now = performance.now();
        if (kp && Wd.hic.position.distanceTo(kp) > 0.002) { __L.key.push(now - k0); kp = null; }
        if (mq && cam.quaternion.angleTo(mq) > 1e-4) { __L.look.push(now - m0); mq = null; } };
    });
    for (let k = 0; k < 16; k++) { await p.keyboard.down(k % 2 ? 'KeyS' : 'KeyW'); await p.waitForTimeout(260); await p.keyboard.up(k % 2 ? 'KeyS' : 'KeyW'); await p.waitForTimeout(340 + (k * 37) % 50); }
    await p.mouse.move(683, 400); await p.mouse.down();
    for (let k = 0; k < 16; k++) { await p.waitForTimeout(300 + (k * 29) % 40); await p.mouse.move(683 + (k % 2 ? -30 : 30), 400, { steps: 1 }); }
    await p.mouse.up();
    const L = await p.evaluate(() => window.__L);
    const md = (a) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[s.length >> 1].toFixed(1) : '-'; }, mx = (a) => (a.length ? Math.max(...a).toFixed(1) : '-');
    console.log(`입력 늦음(${mode === 'gfx' ? '🎨 그래픽 우선 30' : '⚡ 부드럽게 60'}): 키 → 몸 가운데 ${md(L.key)}ms 최대 ${mx(L.key)}ms(${L.key.length}번) · 끌기 → 카메라 가운데 ${md(L.look)}ms 최대 ${mx(L.look)}ms(${L.look.length}번)`);
  }
  console.log(errs.length ? '페이지 오류 ' + errs.length + ': ' + errs.slice(0, 3).join(' / ') : '페이지 오류 0');
  await b.close(); srv.close();
});
