// 📏 PERF-E 나무 셰이더 전후 견주기(perf.md 11-08 PERF-E 근거 · 스크래치 perfe/cmp.cjs에서 옮김) — PERF-G(11-08 토론 판정 10 ④): 근거로 쓴 도구를 저장소에(town_critique_1031.md:192 같은 실수 X) · 쓰는 법은 아래 원래 머리말 그대로
// PERF-E 견주기: 같은 코드 ?ti=0(예전 길) ↔ 켬 — GPU 지오메트리 바이트 · 그리기·삼각형(자리마다 k9) · 스크린숏 · 계절 다섯 번(시간·가장 긴 프레임·힙)
//   zsh tools/ops/b2.sh node cmp.cjs <서빙 폴더> <포트> <태그> [--vars=ti=0|] [--noshots] [--noseason]
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const pos = process.argv.slice(2).filter(a => !a.startsWith('--'));
const root = path.resolve(pos[0]), PORT = +pos[1], TAG = pos[2] || 'x';
const ONLYS = ((process.argv.find(a => a.startsWith('--spots=')) || '').slice(8)).split(',').filter(Boolean), SETTLE = +((process.argv.find(a => a.startsWith('--settle=')) || '--settle=3500').slice(9)), want = nm => !ONLYS.length || ONLYS.includes(nm);
const SHOTS = !process.argv.includes('--noshots'), SEAS = !process.argv.includes('--noseason');
const OUT = process.env.OUT || path.join(require('os').tmpdir(), 'sm-perf_ti_cmp');   /* 결과·사진 = OUT(기본 임시 폴더 · 저장소에 안 남김) */ fs.mkdirSync(OUT, { recursive: true });
const types = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.woff2': 'font/woff2', '.glb': 'model/gltf-binary' };
const srv = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]), p = path.join(root, u, u.endsWith('/') ? 'index.html' : ''); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); r.end(d); }); });
const UA = 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const GPU = ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'];
const MEASURE = () => {
  const seen = new Map(), lab = o => { let k = null; for (let q = o; q; q = q.parent) { if (!k && q.userData && q.userData.k9) k = String(q.userData.k9); } return k ? k.replace(/\d+/g, '#') : 'other'; };
  const L = new Map(), A = new Map(); let tot = 0, posV = 0;
  const bump = (M, k, b, v) => { const o = M.get(k) || { b: 0, v: 0, n: 0 }; o.b += b; o.v += v; o.n++; M.set(k, o); };
  const add = (a, nm, lb) => { if (!a) return; const k = a.isInterleavedBufferAttribute ? a.data : a; if (seen.has(k)) return; seen.set(k, 1); const arr = k.array, bpe = arr && arr.BYTES_PER_ELEMENT ? arr.BYTES_PER_ELEMENT : (a.normalized ? 1 : (a.q16 ? 2 : 4)), n = k.isInterleavedBuffer ? k.count * k.stride : a.count * a.itemSize, b = n * bpe; tot += b; bump(L, lb, b, nm === 'position' ? a.count : 0); bump(A, nm + ':' + (arr ? arr.constructor.name.replace('Array', '') : '?') + 'x' + a.itemSize, b, 0); if (nm === 'position') posV += a.count; };
  SD2.scene.traverse(o => { const g = o.geometry; if (!g || !g.attributes) return; const lb = lab(o); for (const k in g.attributes) add(g.attributes[k], k, lb); if (g.index) add(g.index, 'index', lb); if (o.isInstancedMesh) { add(o.instanceMatrix, 'instM', lb); add(o.instanceColor, 'instC', lb); } });
  let texB = 0; const ti = SM_TOWN.ti ? SM_TOWN.ti() : null;
  const top = (M, k = 14) => [...M].sort((a, b) => b[1].b - a[1].b).slice(0, k).map(([kk, o]) => [kk, Math.round(o.b / 1048576 * 10) / 10, o.v, o.n]);
  return { MB: Math.round(tot / 1048576 * 10) / 10, posV, byLabel: top(L), byAttr: top(A), geos: SD2.renderer.info.memory.geometries, tex: SD2.renderer.info.memory.textures, ti };
};
const VARS = (process.argv.find(a => a.startsWith('--vars=')) || '--vars=ti=0|').slice(7).split('|');
srv.listen(PORT, async () => {
  const base = 'http://127.0.0.1:' + PORT;
  const b = await chromium.launch({ args: GPU.concat('--js-flags=--expose-gc') });
  for (const vq of VARS) { const VT = TAG + '_' + (vq ? vq.replace(/[^a-z0-9]/gi, '') : 'on'), errs = [], R = { tag: VT, q: vq };
    try {
      const ctx = await b.newContext({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1, userAgent: UA });
      const p = await ctx.newPage();
      p.on('pageerror', e => errs.push('PE ' + e.message.slice(0, 300)));
      p.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !/favicon|404|ERR_|pointer lock|GPU stall|Failed to load resource|예산/.test(m.text())) errs.push(m.type() + ' ' + m.text().slice(0, 300)); });
      const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
      const closeAll = async () => { for (let i = 0; i < 10; i++) { if (await ev(() => !!(SM_TOWN.dlgOn && SM_TOWN.dlgOn()))) { await p.keyboard.press('Escape'); await W8(250); continue; } if (!(await ev(() => !!document.querySelector('.twn-p')))) break; await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p button.sub') || document.querySelector('.twn-p button'); if (b9) b9.click(); }); await W8(300); } };
      const calm = async () => { await ev(() => { const G = SM_TOWN.game(); if (G.setClock) G.setClock(false); G.S.clock = false; G.S.story = G.S.story || {}; G.S.story.done = Object.assign(G.S.story.done || {}, { p0: 1, a1_1: 1 }); G.S.story.p0auto = 1; G.S.jobs = G.S.jobs || {}; G.S.jobs.fireNo = G.S.day; if (G.S.emerg) { G.S.emerg.d = G.S.day; G.S.emerg.plan = []; } if (G.rwOff) G.rwOff(true); try { SM_TOWN.storyOff(); } catch (e) { void e; } SM_TOWN.rules.wx('clear'); }); };
      const t0 = Date.now();
      await p.goto(base + '/v2/?town=ourtown' + (vq ? '&' + vq : ''));
      await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.load && SM_TOWN.game && window.SD2 && SD2.renderer, null, { timeout: 400000, polling: 100 });
      R.buildS = Math.round((Date.now() - t0) / 100) / 10; R.loadMs = await ev(() => SM_TOWN.load.ms);
      await ev(() => { const b9 = document.querySelector('.twn-ld [data-a="x"]') || document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); await W8(1200);
      for (let i = 0; i < 4; i++) { await p.keyboard.press('Escape'); await W8(150); } await closeAll(); await calm(); await W8(600); await closeAll();
      /* 흔들림 시계 멈춤(두 판 같은 위상) — 나무 재질 uniforms의 uWT 값을 고정 */
      R.frozen = await ev(() => { let n = 0; SD2.scene.traverse(o => { if (n || !o.isMesh || !o.material || !o.material.customProgramCacheKey) return; const k = o.material.customProgramCacheKey(); if (!/townSway|townTreeI/.test(k)) return; const pr = SD2.renderer.properties.get(o.material), U = pr && pr.uniforms; if (U && U.uWT) { Object.defineProperty(U.uWT, 'value', { get: () => 7.3, set: () => {}, configurable: true }); n = 1; } }); return n; });
      await W8(3000);
      R.geo = await ev(MEASURE); R.progs = await ev(() => (SD2.renderer.info.programs || []).length); R.heap = await ev(() => { if (window.gc) window.gc(); return Math.round(performance.memory.usedJSHeapSize / 1048576); });
      console.log('[' + VT + '] 짓기 ' + R.buildS + '초 · load.ms ' + R.loadMs + ' · GPU ' + R.geo.MB + 'MB · 정점 ' + R.geo.posV + ' · 텍스처 ' + R.geo.tex + ' · 힙 ' + R.heap + ' · 셰이더 ' + R.progs + ' · ti ' + JSON.stringify(R.geo.ti) + ' · 흔들림 고정 ' + R.frozen);
      console.log('   갈래 ' + R.geo.byLabel.slice(0, 9).map(r => r[0] + ' ' + r[1] + 'MB/' + r[2]).join(' · '));
      console.log('   속성 ' + R.geo.byAttr.slice(0, 9).map(r => r[0] + ' ' + r[1]).join(' · '));
      await ev(() => { const R9 = SD2.renderer, o = R9.renderBufferDirect.bind(R9); window.__DC = null; R9.renderBufferDirect = function (cam, sc, g, m, ob, grp) { const D = window.__DC; if (D) { let k = null; for (let q = ob; q; q = q.parent) if (q.userData && q.userData.k9) { k = String(q.userData.k9); break; } k = k || 'x'; const e = D[k] || (D[k] = [0, 0]); e[0]++; const dr = g.drawRange, ix = g.index; let n = ix ? ix.count : g.attributes.position ? g.attributes.position.count : 0; if (dr && dr.count !== Infinity) n = Math.min(n, dr.count); e[1] += Math.round(n / 3 * (ob.isInstancedMesh ? ob.count : 1)); } return o(cam, sc, g, m, ob, grp); }; });
      const SF = path.join(OUT, 'sites.json'), site = fs.existsSync(SF) ? JSON.parse(fs.readFileSync(SF, 'utf8')) : await ev(() => { const L0 = SM_TOWN.ti(true).trees || [], T = { round: [], pine: [], poplar: [], fruit: [] }; for (const [x, z, sp] of L0) if (T[sp]) T[sp].push({ x, z }); const hs = SM_TOWN.homeSpot ? SM_TOWN.homeSpot() : null, tw = SM_TOWN.tower && SM_TOWN.tower() && SM_TOWN.tower().info ? SM_TOWN.tower().info().site : null;
        const G = new Map(); for (const sp of ['round', 'pine', 'poplar']) for (const t of T[sp]) { const k = Math.floor(t.x / 25) + ':' + Math.floor(t.z / 25); G.set(k, (G.get(k) || 0) + 1); }
        let best = null, bn = 0; for (const [k, n] of G) { const [i, j] = k.split(':').map(Number), x = i * 25 + 12, z = j * 25 + 12; if (hs && Math.hypot(x - hs[0], z - hs[1]) > 700) continue; if (n > bn) { bn = n; best = [x, z]; } }
        const FG = new Map(); for (const t of T.fruit) { const k = Math.floor(t.x / 30) + ':' + Math.floor(t.z / 30); FG.set(k, (FG.get(k) || 0) + 1); } let fo = null, fn = 0; for (const [k, n] of FG) if (n > fn) { fn = n; const [i, j] = k.split(':').map(Number); fo = [i * 30 + 15, j * 30 + 15]; }
        const sm = SM_TOWN.summit ? SM_TOWN.summit() : null, keys = Object.keys(SM_TOWN).filter(k => /trail|summit|view|range/i.test(k));
        return { home: hs, forest: best, forestN: bn, orchard: fo, orchardN: fn, summit: sm, tower: tw && tw.x != null ? tw : null, keys }; });
      if (!fs.existsSync(SF) && site.forest) fs.writeFileSync(SF, JSON.stringify(site));
      R.site = site; console.log('   자리 ' + JSON.stringify(site));
      const free = (x, z) => ev(([x, z]) => { const bl = SD2.map.q.blocked || SD2.map.q.blockedAt, okp = (a, c) => { const g = SM_TOWN.ground(a, c); return !bl(a, c, g + 0.6) && !bl(a + 0.5, c, g + 0.6) && !bl(a, c + 0.5, g + 0.6) && !bl(a - 0.5, c, g + 0.6) && !bl(a, c - 0.5, g + 0.6); };
        for (let r = 0; r <= 60; r += 1.5) for (let k = 0; k < (r ? 16 : 1); k++) { const an = k * Math.PI / 8, px = x + Math.cos(an) * r, pz = z + Math.sin(an) * r; if (okp(px, pz)) return [px, pz]; } return [x, z]; }, [x, z]);
      R.spots = {};
      const go = async (nm, mn, x, z, y, look) => { if (!want(nm)) return; await ev(mn => { SM_TOWN.game().S.min = mn; }, mn); const a = y == null ? await free(x, z) : [x, z]; await ev(([x, z, y, lk]) => { SD2.map.player.teleport([x, y != null ? y + 0.05 : SM_TOWN.ground(x, z) + 0.05, z]); SD2.map.player.lookAt(lk); }, [a[0], a[1], y, look || [a[0] + 30, a[1] - 12]]); await W8(SETTLE); await closeAll(); await W8(800);
        const r = await ev(async () => { window.__DC = {}; await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); const D = window.__DC; window.__DC = null; const i = SD2.renderer.info.render; return { D, calls: i.calls, tri: i.triangles }; });
        const tr = Object.entries(r.D).filter(([k]) => /^tree/.test(k)); R.spots[nm] = { calls: r.calls, tri: r.tri, tree: tr };
        console.log('   ' + nm + ' 그리기 ' + r.calls + ' · 삼각형 ' + r.tri + ' · 나무 ' + tr.map(([k, v]) => k + ' ' + v[0] + '/' + v[1]).join(' '));
        if (SHOTS) await p.screenshot({ path: path.join(OUT, VT + '_' + nm + '.png') }); };
      const SP = [['home', 8 * 60, site.home], ['forest', 10 * 60, site.forest], ['orchard', 11 * 60, site.orchard]];
      for (const [nm, mn, xz] of SP) if (xz) await go(nm, mn, xz[0], xz[1]);
      if (site.tower) await go('tower', 12 * 60, site.tower.x + 9, site.tower.z + 3, site.tower.Yd, [17, 50]);
      if (site.summit) await go('summit', 12 * 60, site.summit[0], site.summit[1], null, site.home || [0, 0]);
      if (site.forest) await go('night', 22 * 60, site.forest[0], site.forest[1]);
      if (SEAS) {
        const seas = async s9 => ev(async s9 => { const t0 = performance.now(); let lt = t0, long = 0, run = true; const f = () => { const t = performance.now(); long = Math.max(long, t - lt); lt = t; if (run) requestAnimationFrame(f); }; requestAnimationFrame(f); await SM_TOWN.rules.season(s9); run = false; return { ms: Math.round(performance.now() - t0), long: Math.round(long) }; }, s9);
        R.wint = await seas('winter'); await W8(2500); console.log('   겨울로 ' + JSON.stringify(R.wint));
        for (const [nm, mn, xz] of [['whome', 8 * 60, site.home], ['wforest', 10 * 60, site.forest], ['worchard', 11 * 60, site.orchard]]) if (xz) await go(nm, mn, xz[0], xz[1]);
        R.aut = await seas('autumn'); await W8(2500); console.log('   가을로 ' + JSON.stringify(R.aut));
        for (const [nm, mn, xz] of [['aforest', 10 * 60, site.forest], ['aorchard', 11 * 60, site.orchard]]) if (xz) await go(nm, mn, xz[0], xz[1]);
        const hs = [], ts = []; for (const s9 of ['spring', 'summer', 'autumn', 'winter', 'now']) { ts.push(await seas(s9)); await W8(1500); hs.push(await ev(() => { if (window.gc) window.gc(); return Math.round(performance.memory.usedJSHeapSize / 1048576); })); }
        R.seasT = ts; R.seasHeap = hs; R.geoS = await ev(MEASURE); console.log('   계절 다섯 번 ' + ts.map(t => t.ms + 'ms/' + t.long).join(' · ') + ' · 힙 ' + hs.join(' → ') + ' · GPU ' + R.geoS.MB + 'MB');
        await go('spring_home', 8 * 60, site.home[0], site.home[1]);
      }
      await ctx.close();
    } catch (e) { R.fail = String(e && e.stack || e).slice(0, 600); console.log('실패 ' + R.fail); }
    R.errs = errs; fs.writeFileSync(path.join(OUT, 'cmp_' + VT + '.json'), JSON.stringify(R, null, 1));
    console.log('[' + VT + '] 오류 ' + errs.length + (errs.length ? ' · ' + errs.slice(0, 6).join(' | ') : '')); }
  await b.close(); srv.close(); process.exit(0);
});
