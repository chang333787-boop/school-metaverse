// 📏 PERF-D GPU 지오메트리 바이트 재기(perf.md 11-08 PERF-D 근거 · 스크래치 perfd/geo2.cjs에서 옮김) — PERF-G(11-08 토론 판정 10 ④): 근거로 쓴 도구를 저장소에(town_critique_1031.md:192 같은 실수 X) · 쓰는 법은 아래 원래 머리말 그대로
// PERF-D 재기: 마을 GPU 지오메트리 바이트 — 갈래(k9)·속성별 · 공유 버퍼 한 번
//   node geo.cjs <서빙 폴더> <포트> <태그> [--shots] [--season]  (b2.sh 안에서)
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const pos = process.argv.slice(2).filter(a => !a.startsWith('--'));
const root = path.resolve(pos[0]), PORT = +pos[1], TAG = pos[2] || 'x';
const SHOTS = process.argv.includes('--shots'), SEAS = process.argv.includes('--season');
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'sm-perf_geo');   /* 결과·사진 = OUT(기본 임시 폴더 · 저장소에 안 남김) */ fs.mkdirSync(OUT, { recursive: true });
const types = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.woff2': 'font/woff2' };
const srv = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]), p = path.join(root, u, u.endsWith('/') ? 'index.html' : ''); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); r.end(d); }); });
const UA = 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const GPU = ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'];

const MEASURE = () => {
  const seen = new Map(), lab = o => { let fx = false, k = null; for (let q = o; q; q = q.parent) { if (q.userData && q.userData.fx) fx = true; if (!k && q.userData && q.userData.k9) k = String(q.userData.k9); } if (k) return k.replace(/\d+/g, '#'); return (fx ? 'town?' : 'other?') + ':' + (o.isInstancedMesh ? 'inst' : o.isPoints ? 'pts' : o.isLine ? 'line' : 'mesh') + ':' + (o.material && o.material.type || '?'); };
  const L = new Map(), A = new Map(), LA = new Map(); let tot = 0, posV = 0, nIdx = 0, idxB = 0, nonIdxV = 0, idxV = 0;
  const bump = (M, k, b, v) => { const o = M.get(k) || { b: 0, v: 0, n: 0 }; o.b += b; o.v += v; o.n++; M.set(k, o); };
  const add = (a, nm, lb, isIdx) => { if (!a) return 0; const k = a.isInterleavedBufferAttribute ? a.data : a; if (seen.has(k)) return 0; seen.set(k, 1); const arr = k.array, bpe = arr && arr.BYTES_PER_ELEMENT ? arr.BYTES_PER_ELEMENT : (a.normalized ? 1 : 4), n = k.isInterleavedBuffer ? k.count * k.stride : a.count * a.itemSize, b = n * bpe; tot += b; bump(L, lb, b, nm === 'position' ? a.count : 0); bump(A, isIdx ? 'index' : nm + ':' + (arr ? arr.constructor.name.replace('Array', '') : (a.normalized ? 'q8' : 'f32?')) + 'x' + a.itemSize, b, 0); bump(LA, lb + '|' + (isIdx ? 'index' : nm), b, 0); if (nm === 'position') posV += a.count; return b; };
  SD2.scene.traverse(o => { const g = o.geometry; if (!g || !g.attributes) return; const lb = lab(o); for (const k in g.attributes) add(g.attributes[k], k, lb); if (g.index) { const pb = add(g.index, 'index', lb, true); if (pb) { nIdx++; idxB += pb; } } if (o.isInstancedMesh) { add(o.instanceMatrix, 'instM', lb); add(o.instanceColor, 'instC', lb); } });
  const top = (M, k = 40) => [...M].sort((a, b) => b[1].b - a[1].b).slice(0, k).map(([kk, o]) => [kk, Math.round(o.b / 1048576 * 10) / 10, o.v, o.n]);
  return { MB: Math.round(tot / 1048576 * 10) / 10, posV, idxMB: Math.round(idxB / 1048576 * 10) / 10, byLabel: top(L), byAttr: top(A), byLA: top(LA, 50), geos: SD2.renderer.info.memory.geometries };
};


const VARS = (process.argv.find(a => a.startsWith('--vars=')) || '--vars=').slice(7).split('|');   /* 쿼리 덧붙임 목록 · 판마다 새 저장소 */
srv.listen(PORT, async () => {
  const base = 'http://127.0.0.1:' + PORT, ALL = {};
  const b = await chromium.launch({ args: GPU.concat('--js-flags=--expose-gc') });
  for (const vq of VARS) { const VT = TAG + (vq ? '_' + vq.replace(/[^a-z0-9]/gi, '') : ''), errs = [], R = { tag: VT, q: vq };
  try {
    const ctx = await b.newContext({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1, userAgent: UA });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push('PE ' + e.message.slice(0, 300)));
    p.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !/favicon|404|ERR_|pointer lock|GPU stall|Failed to load resource/.test(m.text())) errs.push(m.type() + ' ' + m.text().slice(0, 300)); });
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
    const closeAll = async () => { for (let i = 0; i < 10; i++) { if (await ev(() => !!(SM_TOWN.dlgOn && SM_TOWN.dlgOn()))) { await p.keyboard.press('Escape'); await W8(250); continue; } if (!(await ev(() => !!document.querySelector('.twn-p')))) break; await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p button.sub') || document.querySelector('.twn-p button'); if (b9) b9.click(); { const h9 = typeof document !== 'undefined' && document.querySelector('.twn-ld .how3') && document.querySelector('.twn-ld [data-a="x"]'); if (h9) h9.click(); } }); await W8(300); } };
    const calm = async () => { await ev(() => { const G = SM_TOWN.game(); if (G.setClock) G.setClock(false); G.S.clock = false; G.S.story = G.S.story || {}; G.S.story.done = Object.assign(G.S.story.done || {}, { p0: 1, a1_1: 1 }); G.S.story.p0auto = 1; G.S.jobs = G.S.jobs || {}; G.S.jobs.fireNo = G.S.day; if (G.S.emerg) { G.S.emerg.d = G.S.day; G.S.emerg.plan = []; } if (G.rwOff) G.rwOff(true); try { SM_TOWN.storyOff(); } catch (e) { void e; } SM_TOWN.rules.wx('clear'); }); };
    const t0 = Date.now();
    await p.goto(base + '/v2/?town=ourtown' + (vq ? '&' + vq : ''));
    await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.load && SM_TOWN.game && window.SD2 && SD2.renderer, null, { timeout: 400000, polling: 100 });
    R.buildS = Math.round((Date.now() - t0) / 100) / 10; R.loadMs = await ev(() => SM_TOWN.load.ms); R.q8 = await ev(() => SM_TOWN.q8 ? SM_TOWN.q8() : null);
    await ev(() => { const b9 = document.querySelector('.twn-ld [data-a="x"]') || document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); { const h9 = typeof document !== 'undefined' && document.querySelector('.twn-ld .how3') && document.querySelector('.twn-ld [data-a="x"]'); if (h9) h9.click(); } }); await W8(1200);
    for (let i = 0; i < 4; i++) { await p.keyboard.press('Escape'); await W8(150); } await closeAll(); await calm(); await W8(600); await closeAll();
    await W8(4000);
    R.geo = await ev(MEASURE); R.progs = await ev(() => (SD2.renderer.info.programs || []).length);
    R.heap = await ev(() => Math.round(performance.memory.usedJSHeapSize / 1048576));
    console.log('[' + VT + '] 짓기 ' + R.buildS + '초 · load.ms ' + R.loadMs + ' · GPU 지오메트리 ' + R.geo.MB + 'MB · 정점 ' + R.geo.posV + ' · 색인 ' + R.geo.idxMB + 'MB · 힙 ' + R.heap + ' · 셰이더 ' + R.progs + ' · q8 ' + JSON.stringify(R.q8));
    if (SHOTS) {
      const site = await ev(() => { const hs = SM_TOWN.homeSpot ? SM_TOWN.homeSpot() : null, bt = SM_TOWN.find ? SM_TOWN.find('해수욕장') : null, tw = SM_TOWN.tower ? SM_TOWN.tower().info().site : null; return { home: hs || [-38.3, 133], beach: bt ? (bt.door || [bt.x, bt.z]) : [0, 0], tower: tw ? { x: tw.x, z: tw.z, Yd: tw.Yd } : null }; });
      const free = (x, z) => ev(([x, z]) => { const bl = SD2.map.q.blocked || SD2.map.q.blockedAt, okp = (a, c) => { const g = SM_TOWN.ground(a, c); return !bl(a, c, g + 0.6) && !bl(a + 0.5, c, g + 0.6) && !bl(a, c + 0.5, g + 0.6) && !bl(a - 0.5, c, g + 0.6) && !bl(a, c - 0.5, g + 0.6); };
        for (let r = 0; r <= 60; r += 1.5) for (let k = 0; k < (r ? 16 : 1); k++) { const an = k * Math.PI / 8, px = x + Math.cos(an) * r, pz = z + Math.sin(an) * r; if (okp(px, pz)) return [px, pz]; } return [x, z]; }, [x, z]);
      const go = async (nm, mn, x, z, y, look) => { await ev(mn => { SM_TOWN.game().S.min = mn; }, mn); const a = y == null ? await free(x, z) : [x, z]; await ev(([x, z, y, lk]) => { SD2.map.player.teleport([x, y != null ? y + 0.05 : SM_TOWN.ground(x, z) + 0.05, z]); SD2.map.player.lookAt(lk); }, [a[0], a[1], y, look || [a[0] + 30, a[1] - 12]]); await W8(3500); await closeAll(); await W8(600); await p.screenshot({ path: path.join(OUT, VT + '_' + nm + '.png') }); };
      await go('home', 8 * 60, site.home[0], site.home[1]);
      await go('city', 12 * 60, 123, 785);
      await go('beach', 13 * 60, site.beach[0], site.beach[1]);
      if (site.tower) await go('tower', 12 * 60, site.tower.x + 9, site.tower.z + 3, site.tower.Yd, [17, 50]);
      await go('night', 22 * 60, 123, 785);
      if (SEAS) { await ev(() => SM_TOWN.season('winter')); await W8(12000); R.geoW = await ev(MEASURE); R.heapW = await ev(() => Math.round(performance.memory.usedJSHeapSize / 1048576)); await go('wcity', 12 * 60, 123, 785); await go('whome', 8 * 60, site.home[0], site.home[1]); if (site.tower) await go('wtower', 12 * 60, site.tower.x + 9, site.tower.z + 3, site.tower.Yd, [17, 50]);
        const hs = []; for (const s9 of ['spring', 'summer', 'autumn', 'winter', 'now']) { await ev(s9 => SM_TOWN.season(s9), s9); await W8(10000); hs.push(await ev(() => { if (window.gc) window.gc(); return Math.round(performance.memory.usedJSHeapSize / 1048576); })); }
        R.seasHeap = hs; R.geoS = await ev(MEASURE); console.log('[' + VT + '] 계절 다섯 번 힙 ' + hs.join(' → ') + ' · GPU ' + R.geoS.MB + 'MB · 겨울 GPU ' + R.geoW.MB); }
    }
    await ctx.close();
  } catch (e) { R.fail = String(e && e.stack || e).slice(0, 600); console.log('실패 ' + R.fail); }
  R.errs = errs; ALL[VT] = R; fs.writeFileSync(path.join(OUT, 'geo_' + VT + '.json'), JSON.stringify(R, null, 1));
  console.log('[' + VT + '] 오류 ' + errs.length + (errs.length ? ' · ' + errs.slice(0, 6).join(' | ') : '')); }
  await b.close(); srv.close(); process.exit(0);
});
