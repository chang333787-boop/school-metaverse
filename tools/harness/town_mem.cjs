// 🧮 마을 메모리 재기(OPT-G2 · 11-08 교사 '크롬북 말고도 일반 게임 자체에서도 최적화') — 다 지은 뒤 GC → JS 힙(V8 + 배열 버퍼)·GL 텍스처 바이트·셰이더 · 장면 메시가 아직 쥔 형식 배열(마을 T · 학교 S) · 큰 텍스처 · 고아 GL 텍스처
//   zsh tools/ops/b2.sh node tools/harness/town_mem.cjs <서빙할 폴더> <포트> <태그> [--out=폴더] [--snap] [--leak] [--shots] [--mesh] [--texuse] [--dup] [--stack] [--life] [--low] [--cpu=4] [--buildonly] [--promo] [--q=sg8=0…]
//   --snap = 힙 스냅숏(<out>/<태그>.heapsnapshot) → node --max-old-space-size=12000 tools/harness/heap_snap.cjs <파일> 40 [--kids=노드id,…] (지배 나무 retained 위 N · 사슬)
//   --leak = 실내 드나들기 10 · 계절 5 · Y 판 모습 세 번 오가기 뒤 힙(배열 포함) · --shots = 집 앞 8시 · 시내 · 간판 가까이/멀리/밤 · 시내 밤 · 겨울 집 앞(흔들림 시계 고정 · 픽셀 견주기는 perf.md PERF-D 꼴)
//   --life = 잠 · 마당 다시 읽기 · WebGL 문맥 잃음 → 되찾음 → 새로고침 뒤 다시 지음 · --low = 2코어(hardwareConcurrency 2) · --cpu=4 = 짓는 동안 CPU 4× · --buildonly = 열기 → 다 지음만 · --promo = 홍보판(/) 휴대폰 세로 사진
//   전·후는 같은 시각에 번갈아 두 번(재기 흔들림 · perf.md 11-08) · 전 판은 origin/main을 따로 꺼낸 폴더(worktree)를 다른 포트로
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const pos = process.argv.slice(2).filter(a => !a.startsWith('--'));
const root = path.resolve(pos[0]), PORT = +pos[1], TAG = pos[2] || 'x';
const has = k => process.argv.includes('--' + k), arg = k => { const a = process.argv.find(s => s.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : null; };
const OUT = arg('out') || '/tmp/sm-mem'; fs.mkdirSync(OUT, { recursive: true });
const types = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.woff2': 'font/woff2', '.glb': 'model/gltf-binary' };
const srv = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]), p = path.join(root, u, u.endsWith('/') ? 'index.html' : ''); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); r.end(d); }); });
const UA = 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const GPU = ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling', '--js-flags=--expose-gc'];

/* GL 텍스처 바이트 기록기(쪽 열기 전) — 텍스처마다 [level·face] → 바이트 */
const GLT = () => {
  const BPP = { 0x8058: 4, 0x8C43: 4, 0x8814: 16, 0x8D70: 16, 0x8D82: 16, 0x881A: 8, 0x8229: 1, 0x822B: 2, 0x822E: 4, 0x8230: 8, 0x8051: 3, 0x8C41: 3, 0x81A6: 4, 0x88F0: 4, 0x81A5: 2, 0x8CAC: 4, 0x1908: 4, 0x1907: 3, 0x1909: 1, 0x190A: 2, 0x1906: 1, 0x8D62: 2, 0x8C3A: 4, 0x8C3D: 4, 0x8059: 4, 0x8D7C: 4, 0x8D8E: 4, 0x8232: 1, 0x8236: 4, 0x823C: 8, 0x8D94: 4, 0x8D88: 8 };
  const T = window.__GLT = new Map(); let cur = new Map();
  const typeB = t => (t === 0x1406 ? 4 : t === 0x140B || t === 0x8D61 ? 2 : 1);
  const fmtC = f => (f === 0x1908 || f === 0x8D99 ? 4 : f === 0x1907 || f === 0x8D98 ? 3 : f === 0x8227 || f === 0x8228 ? 2 : 1);
  const tgtKey = t => (t >= 0x8515 && t <= 0x851A ? t : 0x0DE1);
  for (const C of [window.WebGL2RenderingContext, window.WebGLRenderingContext]) { if (!C) continue; const P = C.prototype;
    const oc = P.createTexture, od = P.deleteTexture, ob = P.bindTexture, ti = P.texImage2D, ts = P.texStorage2D, ti3 = P.texImage3D, ts3 = P.texStorage3D, gm = P.generateMipmap;
    P.createTexture = function () { const t = oc.call(this); T.set(t, { lv: new Map(), t0: performance.now(), st: 0 }); return t; };
    P.deleteTexture = function (t) { T.delete(t); return od.call(this, t); };
    P.bindTexture = function (tg, t) { cur.set(tg, t); return ob.call(this, tg, t); };
    const bound = tg => { const t = cur.get(tg >= 0x8515 && tg <= 0x851A ? 0x8513 : tg); return t && T.get(t); };
    P.texImage2D = function (...a) { try { const o = bound(a[0]); if (o) { const lvl = a[1], ifmt = a[2]; let w, h, bpp; if (a.length >= 8) { w = a[3]; h = a[4]; bpp = BPP[ifmt] || fmtC(a[6]) * typeB(a[7]); } else { const src = a[5]; w = src.width || src.videoWidth || 0; h = src.height || src.videoHeight || 0; bpp = BPP[ifmt] || fmtC(a[3]) * typeB(a[4]); } o.lv.set(tgtKey(a[0]) + ':' + lvl, w * h * bpp); o.w = o.w || w; o.h = o.h || h; o.f = ifmt; } } catch (e) { void e; } return ti.apply(this, a); };
    if (ts) P.texStorage2D = function (tg, levels, ifmt, w, h) { try { const o = bound(tg); if (o) { const bpp = BPP[ifmt] || 4, faces = tg === 0x8513 ? 6 : 1; let b = 0; for (let l = 0; l < levels; l++) b += Math.max(1, w >> l) * Math.max(1, h >> l) * bpp * faces; o.st = b; o.w = w; o.h = h; o.f = ifmt; o.levels = levels; } } catch (e) { void e; } return ts.call(this, tg, levels, ifmt, w, h); };
    if (ti3) P.texImage3D = function (...a) { try { const o = bound(a[0]); if (o) { const bpp = BPP[a[2]] || 4; o.lv.set('3d:' + a[1], a[3] * a[4] * a[5] * bpp); o.w = a[3]; o.h = a[4]; o.d = a[5]; o.f = a[2]; } } catch (e) { void e; } return ti3.apply(this, a); };
    if (ts3) P.texStorage3D = function (tg, levels, ifmt, w, h, d) { try { const o = bound(tg); if (o) { const bpp = BPP[ifmt] || 4; let b = 0; for (let l = 0; l < levels; l++) b += Math.max(1, w >> l) * Math.max(1, h >> l) * (tg === 0x806F ? Math.max(1, d >> l) : d) * bpp; o.st = b; o.w = w; o.h = h; o.d = d; o.f = ifmt; o.levels = levels; } } catch (e) { void e; } return ts3.call(this, tg, levels, ifmt, w, h, d); };
    P.generateMipmap = function (tg) { try { const o = bound(tg); if (o && !o.st) { const b0 = o.lv.get(tgtKey(tg) + ':0') || 0; o.mip = Math.round(b0 / 3); } } catch (e) { void e; } return gm.call(this, tg); };
  }
  window.__GLTsum = () => { let n = 0, b = 0; for (const o of T.values()) { const x = (o.st || 0) + [...o.lv.values()].reduce((s, v) => s + v, 0) + (o.mip || 0); n++; b += x; } return { n, MB: Math.round(b / 1048576 * 10) / 10 }; };
  window.__GLTof = wt => { const o = T.get(wt); return o ? (o.st || 0) + [...o.lv.values()].reduce((s, v) => s + v, 0) + (o.mip || 0) : 0; };
};

/* JS가 아직 쥔 형식 배열(장면 속 지오메트리) · 텍스처 갈래 */
const CENSUS = () => {
  const R9 = SD2.renderer, PR = R9.properties;
  const lab = o => { let k = null, nm = null; for (let q = o; q; q = q.parent) { if (!k && q.userData && q.userData.k9) k = String(q.userData.k9); if (!nm && q.name) nm = q.name; } return (k ? k.replace(/\d+/g, '#') : 'other') + (o.material && o.material.type ? '/' + o.material.type.replace('Mesh', '').replace('Material', '') : ''); };
  const seen = new Set(), L = new Map(), A = new Map(); let held = 0, heldN = 0, gpuArr = 0;
  const bump = (M, k, b, n) => { const o = M.get(k) || { b: 0, n: 0, v: 0 }; o.b += b; o.n++; o.v += n || 0; M.set(k, o); };
  const add = (a, nm, lb, g) => { if (!a) return; const k = a.isInterleavedBufferAttribute ? a.data : a; if (seen.has(k)) return; seen.add(k); const arr = k.array; if (!arr || !arr.byteLength) return; held += arr.byteLength; heldN++; const flag = (a.g9 ? 'g9' : '') + (a.usage === 35048 ? 'dyn' : '') + (g && g.userData && g.userData.keep ? 'keep' : ''); bump(L, lb, arr.byteLength, nm === 'position' ? a.count : 0); bump(A, nm + ':' + arr.constructor.name.replace('Array', '') + 'x' + a.itemSize + (flag ? ':' + flag : ''), arr.byteLength); };
  const objs = []; SD2.scene.traverse(o => objs.push(o));
  for (const o of objs) { const g = o.geometry; if (!g || !g.attributes) continue; const lb = lab(o); for (const k in g.attributes) add(g.attributes[k], k, lb, g); if (g.index) add(g.index, 'index', lb, g); if (o.isInstancedMesh) { add(o.instanceMatrix, 'instM', lb); add(o.instanceColor, 'instC', lb); } }
  /* 텍스처: 재질 속성·uniforms·장면 배경 */
  const TX = new Map(); const tadd = (t, where) => { if (!t || !t.isTexture) return; const e = TX.get(t) || { w: new Set() }; e.w.add(where); TX.set(t, e); };
  const mats = new Set(), mUse = new Map(); for (const o of objs) { const m = o.material; if (!m) continue; for (const mm of Array.isArray(m) ? m : [m]) { mats.add(mm); if (!mUse.has(mm)) mUse.set(mm, o); } }
  const useOf = t => { for (const [mm, o] of mUse) { let hit = false; for (const k in mm) if (mm[k] === t) hit = true; const pp = PR.get(mm); if (pp && pp.uniforms) for (const k in pp.uniforms) if (pp.uniforms[k] && pp.uniforms[k].value === t) hit = true; if (hit) { let st = ''; for (let q = o; q && !st; q = q.parent) st = window.__ST ? (window.__ST.get(q) || '') : ''; return '#' + o.id + ' ' + (o.name || '') + ' k9=' + ((o.userData && o.userData.k9) || '') + ' ' + st.slice(0, 260); } } return ''; };
  for (const m of mats) { for (const k in m) { const v = m[k]; if (v && v.isTexture) tadd(v, m.type + '.' + k + (m.name ? '#' + m.name : '')); } if (m.uniforms) for (const k in m.uniforms) { const v = m.uniforms[k] && m.uniforms[k].value; if (v && v.isTexture) tadd(v, m.type + '.u.' + k); } const pp = PR.get(m); if (pp && pp.uniforms) for (const k in pp.uniforms) { const v = pp.uniforms[k] && pp.uniforms[k].value; if (v && v.isTexture) tadd(v, m.type + '.pu.' + k); } }
  if (SD2.scene.background && SD2.scene.background.isTexture) tadd(SD2.scene.background, 'bg');
  const tl = []; let tb = 0; const glKnown = new Set();
  for (const [t, e] of TX) { const p = PR.get(t), wt = p && p.__webglTexture; const b = wt ? window.__GLTof(wt) : 0; if (wt) glKnown.add(wt); tb += b; const im = t.image || {}; const src = im.tagName || (im.constructor && im.constructor.name) || '?'; tl.push({ b, w: im.width || 0, h: im.height || 0, src, mip: !!(t.generateMipmaps && t.minFilter >= 1004 && t.minFilter !== 1006), name: t.name || '', where: [...e.w].slice(0, 3).join(','), up: !!wt, uuid: t.uuid.slice(0, 6), canvasNode: im.tagName === 'CANVAS' ? 1 : 0 }); }
  tl.sort((a, b) => b.b - a.b);
  if (window.__WANTDUP) { const H = new Map(); for (const [t] of TX) { const im = t.image; let k = null; try { if (im && im.getContext && im.width * im.height <= 4194304 && im.width > 1) { const d = im.getContext('2d').getImageData(0, 0, im.width, im.height).data; let h1 = 0, h2 = 0; for (let i = 0; i < d.length; i += 3) { h1 = (h1 * 31 + d[i]) | 0; h2 = (h2 + d[i] * (i % 251)) | 0; } k = im.width + 'x' + im.height + ':' + h1 + ':' + h2; } else if (im && im.data && im.data.length) { const d = im.data; let h1 = 0; for (let i = 0; i < d.length; i += 7) h1 = (h1 * 31 + d[i]) | 0; k = 'D' + im.width + 'x' + im.height + ':' + h1; } } catch (e) { void e; } if (!k) continue; const p = PR.get(t), wt = p && p.__webglTexture, b = wt ? window.__GLTof(wt) : 0; const e = H.get(k) || { n: 0, b: 0, ws: new Set() }; e.n++; e.b += b; for (const w of TX.get(t).w) e.ws.add(w); H.set(k, e); }
    window.__DUP = [...H].filter(([, e]) => e.n > 1).sort((a, b) => b[1].b - a[1].b).slice(0, 20).map(([k, e]) => [k.split(':')[0], e.n, Math.round(e.b / 1048576 * 100) / 100, [...e.ws].slice(0, 3).join(',')]); }
  if (window.__WANTUSE) { const byU = new Map(); for (const [t] of TX) byU.set(t.uuid.slice(0, 6), t); for (const r of tl.slice(0, 14)) r.use = useOf(byU.get(r.uuid)); }
  /* 장면 밖(재질을 못 찾은) GL 텍스처 */
  let orphanB = 0, orphanN = 0; const orph = []; for (const [wt, o] of window.__GLT) { if (glKnown.has(wt)) continue; const b = window.__GLTof(wt); orphanB += b; orphanN++; orph.push([b, o.w, o.h, o.d || 0, o.f, o.levels || 0]); } orph.sort((a, b) => b[0] - a[0]);
  const top = (M, k = 18) => [...M].sort((a, b) => b[1].b - a[1].b).slice(0, k).map(([kk, o]) => [kk, Math.round(o.b / 1048576 * 10) / 10, o.n, o.v]);
  /* 메시마다(마을 ROOT 아래 = T · 아니면 S) */
  const RT = SM_TOWN.root, per = []; const seen2 = new Set(); let tHeld = 0, sHeld = 0;
  for (const o of objs) { const g = o.geometry; if (!g || !g.attributes) continue; let b9 = 0; const ks = []; for (const k in g.attributes) { const a = g.attributes[k], kk = a.isInterleavedBufferAttribute ? a.data : a; if (seen2.has(kk)) continue; seen2.add(kk); if (kk.array && kk.array.byteLength) { b9 += kk.array.byteLength; ks.push(k + (a.g9 ? '*' : '') + (a.usage === 35048 ? 'd' : '')); } } if (g.index && g.index.array && !seen2.has(g.index)) { seen2.add(g.index); b9 += g.index.array.byteLength; ks.push('idx'); }
    if (!b9) continue; let inT = false, chainN = []; for (let q = o; q; q = q.parent) { if (q === RT) inT = true; if (chainN.length < 4 && (q.name || (q.userData && q.userData.k9))) chainN.push(q.name || ('k9:' + q.userData.k9)); } if (inT) tHeld += b9; else sHeld += b9;
    per.push({ b: b9, T: inT ? 'T' : 'S', v: g.attributes.position ? g.attributes.position.count : 0, mt: o.material && o.material.type, nm: chainN.join('<'), ud: Object.keys(o.userData || {}).join(','), gud: Object.keys(g.userData || {}).join(','), ks: ks.join(' '), r: g.boundingSphere ? Math.round(g.boundingSphere.radius) : -1, vis: o.visible, inst: !!o.isInstancedMesh, uuid: o.uuid.slice(0, 8), id: o.id, st: window.__ST ? (window.__ST.get(o) || (o.parent && window.__ST.get(o.parent)) || '') : '', par: o.parent === SD2.scene ? 'scene' : (o.parent && (o.parent.name || o.parent.type)) }); }
  per.sort((a, b) => b.b - a.b);
  const progs = (R9.info.programs || []).map(p => p.name || p.cacheKey.slice(0, 40));
  const pc = new Map(); for (const n of progs) pc.set(n, (pc.get(n) || 0) + 1);
  return { heldMB: Math.round(held / 1048576 * 10) / 10, heldN, byLabel: top(L), byAttr: top(A), tex: R9.info.memory.textures, geos: R9.info.memory.geometries, gl: window.__GLTsum(), texScene: tl.length, texSceneMB: Math.round(tb / 1048576 * 10) / 10, texTop: tl.slice(0, 40), orphanN, orphanMB: Math.round(orphanB / 1048576 * 10) / 10, orphTop: orph.slice(0, 25), progN: progs.length, progTop: [...pc].sort((a, b) => b[1] - a[1]).slice(0, 30), mats: mats.size, objs: objs.length, tHeldMB: Math.round(tHeld / 1048576 * 10) / 10, sHeldMB: Math.round(sHeld / 1048576 * 10) / 10, perTop: per.slice(0, 60), perN: per.length };
};

srv.listen(PORT, async () => {
  const base = 'http://127.0.0.1:' + PORT, R = { tag: TAG, at: new Date().toISOString() }, errs = [];
  const b = await chromium.launch({ args: GPU });
  try {
    if (has('promo')) { const ctx9 = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1' }); const p9 = await ctx9.newPage(); p9.on('pageerror', e => errs.push('PE ' + e.message.slice(0, 200))); p9.on('console', m => { if (m.type() === 'error' && !/favicon|404|ERR_|Failed to load|youtube/i.test(m.text())) errs.push(m.text().slice(0, 200)); });
      await p9.goto(base + '/'); await p9.waitForFunction(() => window.SD2 && SD2.renderer && SD2.renderer.info.render.frame > 30, null, { timeout: 120000 }); await p9.waitForTimeout(6000); await p9.screenshot({ path: path.join(OUT, TAG + '_promo.png') });
      const sp = await p9.evaluate(() => { const me = SD2.map && SD2.map.player && SD2.map.player.get ? SD2.map.player.get() : null; return me; }); console.log('[' + TAG + '] 홍보판 휴대폰 세로 사진 · 자리 ' + JSON.stringify(sp)); throw 'done'; }
    const ctx = await b.newContext({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1, userAgent: UA });
    if (has('low')) await ctx.addInitScript(() => { Object.defineProperty(Navigator.prototype, 'hardwareConcurrency', { get: () => 2 }); Object.defineProperty(Navigator.prototype, 'deviceMemory', { get: () => 4 }); });
    await ctx.addInitScript(GLT);
    if (has('stack')) await ctx.addInitScript(() => { const ST = window.__ST = new Map(); const iv = setInterval(() => { const s = window.SD2 && SD2.scene; if (!s) return; clearInterval(iv); const P = Object.getPrototypeOf(Object.getPrototypeOf(s)), oa = P.add; P.add = function (...os) { for (const o of os) if (o && (o.isMesh || o.isGroup)) { try { ST.set(o, new Error().stack.split('\n').slice(2, 7).map(l => l.replace(/https?:\/\/[^/]+\/v2\//, '').replace(/\?v=\d+/, '').trim()).join(' / ')); } catch (e) { void e; } } return oa.apply(this, os); }; }, 5); });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push('PE ' + e.message.slice(0, 300)));
    p.on('console', m => { if ((m.type() === 'error') && !/favicon|404|ERR_|pointer lock|GPU stall|Failed to load resource|예산/.test(m.text())) errs.push(m.type() + ' ' + m.text().slice(0, 300)); });
    const cdp = await ctx.newCDPSession(p); await cdp.send('Performance.enable'); await cdp.send('HeapProfiler.enable');
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
    const closeAll = async () => { for (let i = 0; i < 10; i++) { if (await ev(() => !!(SM_TOWN.dlgOn && SM_TOWN.dlgOn()))) { await p.keyboard.press('Escape'); await W8(250); continue; } if (!(await ev(() => !!document.querySelector('.twn-p')))) break; await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p button.sub') || document.querySelector('.twn-p button'); if (b9) b9.click(); { const h9 = typeof document !== 'undefined' && document.querySelector('.twn-ld .how3') && document.querySelector('.twn-ld [data-a="x"]'); if (h9) h9.click(); } }); await W8(300); } };
    const calm = async () => { await ev(() => { const G = SM_TOWN.game(); if (G.setClock) G.setClock(false); G.S.clock = false; G.S.story = G.S.story || {}; G.S.story.done = Object.assign(G.S.story.done || {}, { p0: 1, a1_1: 1 }); G.S.story.p0auto = 1; G.S.jobs = G.S.jobs || {}; G.S.jobs.fireNo = G.S.day; if (G.S.emerg) { G.S.emerg.d = G.S.day; G.S.emerg.plan = []; } if (G.rwOff) G.rwOff(true); try { SM_TOWN.storyOff(); } catch (e) { void e; } SM_TOWN.rules.wx('clear'); }); };
    const heap = async () => { for (let i = 0; i < 3; i++) { await cdp.send('HeapProfiler.collectGarbage'); await W8(150); } const u = await cdp.send('Runtime.getHeapUsage'); const m = await cdp.send('Performance.getMetrics'), o = {}; for (const x of m.metrics) o[x.name] = x.value; const pm = await ev(() => Math.round(performance.memory.usedJSHeapSize / 1048576 * 10) / 10); return { used: Math.round(u.usedSize / 1048576 * 10) / 10, total: Math.round(u.totalSize / 1048576 * 10) / 10, emb: u.embedderHeapUsedSize != null ? Math.round(u.embedderHeapUsedSize / 1048576 * 10) / 10 : null, back: u.backingStorageSize != null ? Math.round(u.backingStorageSize / 1048576 * 10) / 10 : null, met: Math.round(o.JSHeapUsedSize / 1048576 * 10) / 10, pm, ub: Math.round((u.usedSize + (u.backingStorageSize || 0)) / 1048576 * 10) / 10 }; };
    if (arg('cpu')) await cdp.send('Emulation.setCPUThrottlingRate', { rate: +arg('cpu') });
    const t0 = Date.now();
    await p.goto(base + '/v2/?town=ourtown' + (arg('q') ? '&' + arg('q') : ''));
    await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.load && SM_TOWN.game && window.SD2 && SD2.renderer, null, { timeout: 400000, polling: 100 });
    R.buildS = Math.round((Date.now() - t0) / 100) / 10; R.sg8 = await ev(() => SM_TOWN.sg8 ? SM_TOWN.sg8() : null); R.loadMs = await ev(() => SM_TOWN.load && SM_TOWN.load.ms); console.log('[' + TAG + '] 짓기 ' + R.buildS + '초 · load.ms ' + R.loadMs + ' · 글자 덮개 ' + JSON.stringify(R.sg8)); if (arg('cpu')) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 }); if (has('buildonly')) throw 'done';
    await ev(() => { const b9 = document.querySelector('.twn-ld [data-a="x"]') || document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); { const h9 = typeof document !== 'undefined' && document.querySelector('.twn-ld .how3') && document.querySelector('.twn-ld [data-a="x"]'); if (h9) h9.click(); } }); await W8(1200);
    for (let i = 0; i < 4; i++) { await p.keyboard.press('Escape'); await W8(150); } await closeAll(); await calm(); await W8(600); await closeAll();
    await W8(8000); await closeAll();
    if (has('texuse')) await ev(() => { window.__WANTUSE = 1; });
    if (has('dup')) await ev(() => { window.__WANTDUP = 1; });
    R.h0 = await heap(); R.c0 = await ev(CENSUS);
    const pr = (k, c, h) => { console.log('[' + TAG + '] ' + k + ' 힙 ' + JSON.stringify(h) + ' · JS 쥔 배열 ' + c.heldMB + 'MB/' + c.heldN + ' · 텍스처 ' + c.tex + ' (GL ' + c.gl.n + '장 ' + c.gl.MB + 'MB · 장면 ' + c.texScene + '장 ' + c.texSceneMB + 'MB · 고아 ' + c.orphanN + '장 ' + c.orphanMB + 'MB) · 셰이더 ' + c.progN + ' · 재질 ' + c.mats + ' · 지오 ' + c.geos + ' · 물체 ' + c.objs); };
    pr('짓기 끝', R.c0, R.h0);
    console.log('  갈래 ' + R.c0.byLabel.map(r => r[0] + ' ' + r[1] + 'MB/' + r[2] + '/' + r[3]).join(' · '));
    console.log('  속성 ' + R.c0.byAttr.map(r => r[0] + ' ' + r[1]).join(' · '));
    if (has('dup')) { R.dup = await ev(() => window.__DUP); console.log('  같은 그림 여러 장 ' + JSON.stringify(R.dup)); }
    if (has('texuse')) for (const t of R.c0.texTop.slice(0, 14)) console.log('    T ' + (t.b / 1048576).toFixed(2) + 'MB ' + t.w + 'x' + t.h + ' ' + t.src + ' ' + t.where + ' ← ' + (t.use || ''));
    console.log('  텍스처 위 ' + R.c0.texTop.slice(0, 25).map(t => (t.b / 1048576).toFixed(2) + 'MB ' + t.w + 'x' + t.h + ' ' + t.src + (t.mip ? ' mip' : '') + ' ' + t.where).join(' | '));
    console.log('  고아 GL 위 ' + R.c0.orphTop.map(o => (o[0] / 1048576).toFixed(2) + 'MB ' + o[1] + 'x' + o[2] + (o[3] ? 'x' + o[3] : '') + ' f' + o[4].toString(16) + ' L' + o[5]).join(' | '));
    console.log('  셰이더 ' + R.c0.progTop.map(r => r[0] + '×' + r[1]).join(' · '));
    console.log('  메시 쥔 배열: 마을 T ' + R.c0.tHeldMB + 'MB · 학교 S ' + R.c0.sHeldMB + 'MB · 메시 ' + R.c0.perN);
    if (has('mesh')) for (const m of R.c0.perTop) console.log('    ' + (m.b / 1048576).toFixed(2) + 'MB ' + m.T + ' v' + m.v + ' r' + m.r + ' ' + m.mt + ' [' + m.nm + '] ud{' + m.ud + '} gud{' + m.gud + '} ' + m.ks + (m.vis ? '' : ' 숨김') + (m.inst ? ' inst' : '') + ' #' + m.id + ' ⊂' + m.par + (m.st ? '\n        ' + m.st.slice(0, 400) : ''));
    if (has('snap')) {
      const F = path.join(OUT, TAG + '.heapsnapshot'), ws = fs.createWriteStream(F); let sz = 0;
      const on = e => { ws.write(e.chunk); sz += e.chunk.length; }; cdp.on('HeapProfiler.addHeapSnapshotChunk', on);
      await cdp.send('HeapProfiler.takeHeapSnapshot', { reportProgress: false, captureNumericValue: false });
      cdp.off('HeapProfiler.addHeapSnapshotChunk', on); await new Promise(r => ws.end(r)); console.log('  스냅숏 ' + F + ' ' + Math.round(sz / 1048576) + 'MB');
    }
    if (has('leak')) {
      const hs = [];
      const L = await ev(() => SM_TOWN.indoor.list().filter(q => q.kind === 'shop' || q.kind === 'home').slice(0, 5).map(q => q.id));
      for (let i = 0; i < 10; i++) { const id = L[i % L.length]; await ev(id => SM_TOWN.indoor.enter(id), id); try { await p.waitForFunction(() => SM_TOWN.indoor.on && !SM_TOWN.indoor.busy, null, { timeout: 8000 }); } catch (e) { void e; } await W8(600); await ev(() => SM_TOWN.indoor.exit()); try { await p.waitForFunction(() => !SM_TOWN.indoor.on && !SM_TOWN.indoor.busy, null, { timeout: 8000 }); } catch (e) { void e; } await W8(500); await closeAll(); if (i === 0 || i === 4 || i === 9) hs.push((await heap()).ub); }
      R.indoor = hs; console.log('  실내 10번 힙(배열 포함) ' + R.h0.ub + ' → ' + hs.join(' → '));
      const ss = []; for (const s9 of ['winter', 'spring', 'summer', 'autumn', 'now']) { await ev(s9 => SM_TOWN.rules.season(s9), s9); await W8(2500); ss.push((await heap()).ub); }
      R.seas = ss; console.log('  계절 5번 힙 ' + ss.join(' → '));
      const ys = []; for (let k = 0; k < 6; k++) { await p.keyboard.press('KeyY'); await W8(400); try { await p.waitForFunction(() => !SM_TOWN.cal().busy, null, { timeout: 60000 }); } catch (e) { errs.push('Y 60초+'); } await W8(1500); await closeAll(); if (k % 2 === 1) ys.push((await heap()).ub); }
      R.ys = ys; console.log('  Y 세 번 오가기 힙 ' + ys.join(' → '));
      R.c1 = await ev(CENSUS); pr('드나든 뒤', R.c1, await heap());
    }
    if (has('life')) { const L9 = {};
      await ev(() => SM_TOWN.sleep()); await W8(1500); try { await p.waitForFunction(() => !SM_TOWN.cal().busy && !document.querySelector('.twn-sleep, .twn-ld'), null, { timeout: 30000 }); } catch (e) { void e; } await W8(1500); await closeAll(); L9.day = await ev(() => SM_TOWN.game().S.day); L9.sleepHeap = (await heap()).ub;
      await ev(() => SM_TOWN.yardsReload()); await W8(2500); L9.yards = await ev(() => SM_TOWN.yards().map(y => [y.n, y.vis, y.busy])); L9.yardHeap = (await heap()).ub;
      const e0 = errs.length; await ev(() => { const ext = SD2.renderer.getContext().getExtension('WEBGL_lose_context'); window.__LC = ext; ext.loseContext(); setTimeout(() => ext.restoreContext(), 800); }); try { await p.waitForEvent('load', { timeout: 20000 }); } catch (e) { errs.push('문맥 되찾은 뒤 새로고침 X'); }
      await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.load && SM_TOWN.game && window.SD2 && SD2.renderer, null, { timeout: 400000, polling: 200 }); await ev(() => { const b9 = document.querySelector('.twn-ld [data-a="x"]') || document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); { const h9 = typeof document !== 'undefined' && document.querySelector('.twn-ld .how3') && document.querySelector('.twn-ld [data-a="x"]'); if (h9) h9.click(); } }); await W8(1500); for (let i = 0; i < 4; i++) { await p.keyboard.press('Escape'); await W8(150); } await closeAll(); await calm(); await W8(5000); await closeAll();
      L9.ctxReload = true; L9.ctxErr = errs.length - e0; L9.ctxSg8 = await ev(() => SM_TOWN.sg8()); L9.ctxGL = await ev(() => window.__GLTsum()); R.life = L9; console.log('  잠·마당·문맥 ' + JSON.stringify(L9)); }
    if (has('shots')) { /* 같은 자리 스크린숏: 집 앞 8시 · 시내 12시 · 밤 22시 · 겨울 집 앞 */
      const frz = await ev(() => { let n = 0; SD2.scene.traverse(o => { if (!o.isMesh || !o.material || !o.material.customProgramCacheKey) return; const pp = SD2.renderer.properties.get(o.material), U = pp && pp.uniforms; if (U && U.uWT && !U.uWT.__f) { Object.defineProperty(U.uWT, 'value', { get: () => 7.3, set: () => {}, configurable: true }); U.uWT.__f = 1; n++; } }); return n; });
      const hs = await ev(() => SM_TOWN.homeSpot ? SM_TOWN.homeSpot() : null);
      const free = (x, z) => ev(([x, z]) => { const bl = SD2.map.q.blocked || SD2.map.q.blockedAt, okp = (a, c) => { const g = SM_TOWN.ground(a, c); return !bl(a, c, g + 0.6) && !bl(a + 0.5, c, g + 0.6) && !bl(a, c + 0.5, g + 0.6) && !bl(a - 0.5, c, g + 0.6) && !bl(a, c - 0.5, g + 0.6); }; for (let r = 0; r <= 60; r += 1.5) for (let k = 0; k < (r ? 16 : 1); k++) { const an = k * Math.PI / 8, px = x + Math.cos(an) * r, pz = z + Math.sin(an) * r; if (okp(px, pz)) return [px, pz]; } return [x, z]; }, [x, z]);
      const go = async (nm, mn, x, z, look) => { await ev(mn => { SM_TOWN.game().S.min = mn; }, mn); const a = await free(x, z); await ev(([x, z, lk]) => { SD2.map.player.teleport([x, SM_TOWN.ground(x, z) + 0.05, z]); SD2.map.player.lookAt(lk); }, [a[0], a[1], look || [a[0] + 30, a[1] - 12]]); await W8(3500); await closeAll(); await W8(800); await p.screenshot({ path: path.join(OUT, TAG + '_' + nm + '.png') }); console.log('  사진 ' + nm); };
      if (hs) await go('home', 8 * 60, hs[0], hs[1]);
      await go('city', 12 * 60, 123, 785);
      { const sg = await ev(() => { const A9 = SM_TOWN.signq ? SM_TOWN.signq() : [], L = A9.filter(s => !s[7] && s[5] > 1.4 && s[1] > 0 && Math.hypot(s[1] - 123, s[3] - 785) < 300); L.sort((a, b) => Math.hypot(a[1] - 123, a[3] - 785) - Math.hypot(b[1] - 123, b[3] - 785)); const o = L.slice(0, 3); for (const re of [/^지하철$|^Subway$/, /갯벌 모습/, /^↕/]) { const f = A9.find(s => re.test(s[0])); if (f) o.push(f); } return o; });
        await ev(() => { const cv = SD2.renderer.domElement; for (const e of document.body.querySelectorAll('*')) if (e !== cv && !e.contains(cv)) e.style.visibility = 'hidden'; });
        for (const [i, s] of sg.entries()) { const nx = Math.sin(s[4]), nz = Math.cos(s[4]); for (const [nm, dd, mn9] of [['sign' + i, 9, 720], ['signfar' + i, 22, 720]].concat(i ? [] : [['signnight', 9, 1320]])) { await ev(mn => { SM_TOWN.game().S.min = mn; }, mn9); await ev(([x, z, lx, lz]) => { SD2.map.player.teleport([x, SM_TOWN.ground(x, z) + 0.05, z]); SD2.map.player.lookAt([lx, lz]); }, [s[1] + nx * dd, s[3] + nz * dd, s[1], s[3]]); await W8(2500); await closeAll(); await W8(600); await p.screenshot({ path: path.join(OUT, TAG + '_' + nm + '.png') }); console.log('  사진 ' + nm + ' ' + s[0]); } } }
      await go('night', 22 * 60, 123, 785);
      await ev(() => SM_TOWN.rules.season('winter')); await W8(3000);
      if (hs) await go('whome', 8 * 60, hs[0], hs[1]);
      console.log('  흔들림 고정 ' + frz);
    }
  } catch (e) { if (e !== 'done') errs.push('X ' + String(e && e.stack || e).slice(0, 500)); }
  R.errs = errs; fs.writeFileSync(path.join(OUT, TAG + '.json'), JSON.stringify(R, null, 1));
  console.log('[' + TAG + '] 오류 ' + errs.length + (errs.length ? ' ' + errs.slice(0, 5).join(' | ') : ''));
  await b.close(); srv.close(); process.exit(0);
});
