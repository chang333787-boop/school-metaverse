// 🧪 놀다가 '툭' 멈칫 재기(OPT-G4 · 교사 11-08 '크롬북 말고도 일반 게임 자체에서도 최적화') — 무언가 바뀌는 순간 앞뒤의 가장 긴 프레임
//   zsh tools/ops/b2.sh node tools/harness/town_hitch.cjs <태그>=<서빙할 폴더> [<태그2>=<폴더2> …] [--rounds=5] [--rate=4] [--hi] [--nr] [--prof] [--only=first,panel,indoor,time,wx,season,ride,jump,feast,emerg] [--port=8933] [--out=폴더]
//   폴더 여럿 = 같은 시각에 번갈아(전 → 후 → 전 → 후 · 11-08 재기 규칙) · 결과 = <out>/hitch_<태그>_<판>.json + 표 한 장(순간마다 가장 긴 프레임 · >50ms · >100ms 수)
//   흉내 = CrOS UA · 1366×768 ×1 · GPU ANGLE · 그리기 켬 · **기본 2코어 크롬북(low 판 · hardwareConcurrency 2 · deviceMemory 4)** · CPU rate×(CDP · 열기 전부터) · 판마다 새 저장소(새 아이) · --hi = 4코어(cb 판) · --nr = 그리기 끔(DOM·JS 멈칫만 · 빠른 확인용)
//   판마다 5번(기본) → 순간마다 가장 긴 프레임의 중앙과 범위 · >50·>100 수 · 새 셰이더 프로그램 수(renderer.info.programs 늘어난 수) · 짓기 ms·글자 데우기 ms
//   재는 법 = 페이지 안 rAF 기록기(늘 켬) → 순간마다 rAF 하나를 기다린 그 시각(t0 · 프레임 경계)에서 일을 시키고 창(초) 끝까지 rAF 간격 · 앞 1.2초 = 바탕(그 자리 보통 프레임) · 표시 함수(12ms 바쁜 기다림)는 --prof에서만(숫자 판을 부풀리지 않게)
//   --prof = 순간마다 CPU 프로파일(1ms 표본 — 0.2ms면 긴 창에서 앞 표본이 잘려 표시를 못 찾음) 자기 시간 위 10(파일:줄) — 프로파일이 프레임을 늘리므로 숫자 판과 따로 돌림
//   순간: 첫 화면 닫고 첫 걸음 · 가방·큰 지도·놀이 판 열고 닫기 · 실내 들어가기·나오기(두 번) · 학원 수업 · 노을·밤(시계로 넘어감) · 잠 → 아침(하루 넘김 저장)
//         비·맑음·눈 · 계절 넷 · 자전거 타고 내리기 · 버스 타기·내리기 · 배 타기 · 지하철 · 처음 가는 동네(순간 이동 셋) · 가 본 곳 바로 가기 · 잔치 날 아침 · 긴급 출동 시작
const { chromium } = require('playwright');   /* 그리기 켬이 기본(셰이더·올리기까지) — b2.sh 무거운 자리 */
const NR = process.argv.includes('--nr'), RENDER = !NR, LOW = !process.argv.includes('--hi');
const http = require('http'), fs = require('fs'), path = require('path');
const arg = k => { const a = process.argv.find(s => s.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : null; };
const SETS = process.argv.slice(2).filter(a => !a.startsWith('--') && a.includes('=')).map(a => { const i = a.indexOf('='); return { tag: a.slice(0, i), root: path.resolve(a.slice(i + 1)) }; });
if (!SETS.length) SETS.push({ tag: 'x', root: path.resolve('.') });
const PORT0 = +(arg('port') || 8933), ROUNDS = +(arg('rounds') || 5), RATE = +(arg('rate') || 4), PROF = process.argv.includes('--prof'), OUT = arg('out') || '/tmp';
const ONLY = (arg('only') || '').split(',').filter(Boolean), on = k => !ONLY.length || ONLY.includes(k);
const types = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.woff2': 'font/woff2', '.glb': 'model/gltf-binary' };
const UA = 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const GPU = ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'];
const r1 = v => Math.round(v * 10) / 10;
const serve = (root, port) => new Promise(res => { const s = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]), p = path.join(root, u, u.endsWith('/') ? 'index.html' : ''); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'max-age=600' }); r.end(d); }); }); s.listen(port, () => res(s)); });
/* 페이지 안 rAF 기록기(시험 쪽 코드) — 프레임 시각만 쌓음 */
const REC = () => { if (window.__HR) return true; const H = window.__HR = { t: [] }; const f = () => { H.t.push(performance.now()); if (H.t.length > 30000) H.t.splice(0, 15000); requestAnimationFrame(f); }; requestAnimationFrame(f); return true; };
const top = (prof, k = 10) => { const N = new Map(); for (const n of prof.nodes) N.set(n.id, n); const self = new Map(); let tot = 0;
  for (let i = 0; i < prof.samples.length; i++) { const dt = prof.timeDeltas[i] || 0; tot += dt; self.set(prof.samples[i], (self.get(prof.samples[i]) || 0) + dt); }
  const agg = new Map(); for (const [id, t] of self) { const c = N.get(id).callFrame, f = c.url ? c.url.replace(/^.*\/v2\//, 'v2/').replace(/\?.*$/, '') : '', key = (c.functionName || '(anon)') + (f ? ' ' + f + ':' + (c.lineNumber + 1) : ''); agg.set(key, (agg.get(key) || 0) + t); }
  return [...agg].filter(x => !/^\(idle\)/.test(x[0])).sort((a, b) => b[1] - a[1]).slice(0, k).map(([kk, t]) => [kk, r1(t / 1000)]); };

/* 긴 프레임 구간(표시 함수 끝 = t0 기준 ms)의 표본만 자기 시간으로 */
const spike = (prof, a, b, endBack) => { const N = new Map(); for (const n of prof.nodes) N.set(n.id, n); const par = new Map(); for (const n of prof.nodes) for (const c of n.children || []) par.set(c, n.id);
  const inMark = id => { for (let q = id; q != null; q = par.get(q)) if (N.get(q).callFrame.functionName === '__G4MARK') return true; return false; };
  let t = prof.startTime, tm = null; const T = []; for (let i = 0; i < prof.samples.length; i++) { t += prof.timeDeltas[i] || 0; T.push(t); if (inMark(prof.samples[i])) tm = t; }
  if (tm == null && endBack != null) tm = prof.endTime - endBack * 1000;   /* 표시를 못 찾으면 끝 시각으로 맞춤(프로파일 끝 ≈ t1) */
  if (tm == null) return [['표시 못 찾음', prof.nodes.filter(n => n.callFrame.functionName === '__G4MARK').length, prof.samples.length, Math.round((t - prof.startTime) / 1000)]]; const agg = new Map(), stk = new Map(); let tot = 0;
  for (let i = 1; i < prof.samples.length; i++) { const ms = (T[i] - tm) / 1000; if (ms < a || ms > b) continue; const dt = (T[i] - T[i - 1]) / 1000; tot += dt; const id = prof.samples[i], c = N.get(id).callFrame, f = c.url ? c.url.replace(/^.*\/v2\//, 'v2/').replace(/^.*\/lib\//, 'lib/').replace(/\?.*$/, '') : '', key = (c.functionName || '(anon)') + (f ? ' ' + f + ':' + (c.lineNumber + 1) : ''); agg.set(key, (agg.get(key) || 0) + dt);
    /* 부른 쪽 사슬(우리 코드만 셋) */ const ch = []; for (let q = par.get(id); q != null && ch.length < 3; q = par.get(q)) { const cf = N.get(q).callFrame; if (/\/v2\//.test(cf.url || '')) ch.push((cf.functionName || '?') + ':' + (cf.lineNumber + 1)); } const sk = key.split(' ')[0] + ' ← ' + ch.join(' ← '); stk.set(sk, (stk.get(sk) || 0) + dt); }
  return { tot: r1(tot), self: [...agg].filter(x => !/^\(idle\)/.test(x[0])).sort((x, y) => y[1] - x[1]).slice(0, 10).map(([k, v]) => [k, r1(v)]), chain: [...stk].sort((x, y) => y[1] - x[1]).slice(0, 6).map(([k, v]) => [k, r1(v)]) }; };
async function run(S, port, round) {
  const srv = await serve(S.root, port), base = 'http://127.0.0.1:' + port, R = { tag: S.tag, root: S.root, round, rate: RATE, render: RENDER, low: LOW, at: new Date().toISOString(), m: {} }, errs = [];
  const b = await chromium.launch({ args: NR ? [...GPU, '--sm-norender'] : GPU });
  try {
    const ctx = await b.newContext({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1, userAgent: UA });
    if (NR) await ctx.addInitScript('window.SM_NORENDER = 1;');
    if (LOW) await ctx.addInitScript(() => { Object.defineProperty(Navigator.prototype, 'hardwareConcurrency', { get: () => 2 }); Object.defineProperty(Navigator.prototype, 'deviceMemory', { get: () => 4 }); });   /* 2코어 셀러론 크롬북(4GB) = main.js 'low' 판 */
    if (PROF) await ctx.addInitScript(() => { window.__G4M = function __G4MARK() { const t = performance.now(); while (performance.now() - t < 12); }; });   /* 프로파일 표시 = --prof에서만 */
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(e.message.slice(0, 200)));
    p.on('console', m => { if (m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall|Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 200)); });
    const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
    if (PROF) { await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 1000 }); }
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
    const built = () => p.waitForFunction(() => window.SM_TOWN && SM_TOWN.load && SM_TOWN.game && window.SD2 && SD2.renderer && !window.SM_BUILD, null, { timeout: 400000, polling: 200 });
    const closeAll = async () => { for (let i = 0; i < 12; i++) { if (await ev(() => !!(SM_TOWN.dlgOn && SM_TOWN.dlgOn()))) { await p.keyboard.press('Escape'); await W8(200); continue; } if (!(await ev(() => !!document.querySelector('.twn-p')))) break; await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p button.sub') || document.querySelector('.twn-p button'); if (b9) b9.click(); }); await W8(250); } };
    const calm = () => ev(() => { const G = SM_TOWN.game(); if (G.setClock) G.setClock(false); G.S.clock = false; G.S.story = G.S.story || {}; G.S.story.done = Object.assign(G.S.story.done || {}, { p0: 1, a1_1: 1 }); G.S.story.p0auto = 1; G.S.jobs = G.S.jobs || {}; G.S.jobs.fireNo = G.S.day; if (G.S.emerg) { G.S.emerg.d = G.S.day; G.S.emerg.plan = []; } if (G.rwOff) G.rwOff(true); try { SM_TOWN.storyOff(); } catch (e) { void e; } SM_TOWN.rules.wx('clear'); });
    const setMin = mn => ev(mn => { SM_TOWN.game().S.min = mn; }, mn);
    const free = (x, z) => ev(([x, z]) => { const bl = SD2.map.q.blocked, okp = (a, c) => { const g = SM_TOWN.ground(a, c); return !bl(a, c, g + 0.6) && !bl(a + 0.5, c, g + 0.6) && !bl(a, c + 0.5, g + 0.6) && !bl(a - 0.5, c, g + 0.6) && !bl(a, c - 0.5, g + 0.6); };
      for (let r = 0; r <= 60; r += 1.5) for (let k = 0; k < (r ? 16 : 1); k++) { const an = k * Math.PI / 8, px = x + Math.cos(an) * r, pz = z + Math.sin(an) * r; if (okp(px, pz)) return [px, pz]; } return [x, z]; }, [x, z]);
    const tp = (x, z) => ev(([x, z]) => { SD2.map.player.teleport([x, SM_TOWN.ground(x, z) + 0.05, z]); }, [x, z]);
    /* 순간 하나: 앞 pre ms 쉬고 → t0 → act → win ms → 그 사이 rAF 간격 */
    const mo = async (key, nm, act, o = {}) => { const win = o.win || 2200; await W8(o.pre || 1300);
      if (PROF && !o.profAt) { await cdp.send('Profiler.start'); await W8(900); }   /* 프로파일 켜는 멈춤(약 0.4초)이 지나간 뒤 */
      const P0 = await ev(() => (SD2.renderer.info.programs || []).length);
      const t0 = await ev(pf => { if (pf) window.__G4M(); return new Promise(r => requestAnimationFrame(() => r(performance.now()))); }, PROF); let r = null;   /* t0 = 프레임 경계(rAF 하나 기다림) — 그 뒤 프레임부터 잼 */
      try { r = await act(); } catch (e) { r = 'err ' + String(e.message || e).slice(0, 80); }
      let tM = t0; if (PROF && o.profAt) { await W8(o.profAt); await cdp.send('Profiler.start'); await W8(900); tM = await ev(() => { window.__G4M(); return performance.now(); }); }   /* 늦게 오는 멈칫(잠 → 아침) = 그 앞에서 켬(긴 프로파일은 앞 표본이 잘림) */
      await W8(win); const t1 = await ev(() => performance.now()); const P1 = await ev(() => (SD2.renderer.info.programs || []).length), PN = P1 > P0 ? await ev(n => (SD2.renderer.info.programs || []).slice(n).map(q => q.name + ':' + String(q.cacheKey || '').slice(0, 60)), P0) : undefined;   /* 새 프로그램 이름(재질 type + 열쇠 앞) */ const prof0 = PROF ? (await cdp.send('Profiler.stop')).profile : null;
      const iv = await ev(([t0, t1]) => { const T = window.__HR.t, a = [], pre = []; for (let i = 1; i < T.length; i++) { const d = T[i] - T[i - 1]; if (T[i - 1] >= t0 - 1 && T[i] <= t1) a.push([Math.round(T[i] - t0), Math.round(d * 10) / 10]); else if (T[i] > t0 - 1200 && T[i] <= t0) pre.push(d); } return { a, pre: pre.length ? Math.max(...pre) : 0 }; }, [t0, t1]);
      const d = iv.a.map(x => x[1]), mx = d.length ? Math.max(...d) : 0, at = iv.a.find(x => x[1] === mx);
      const aft = iv.a.filter(x => x[0] > tM - t0 + 30), mxP = aft.length ? Math.max(...aft.map(x => x[1])) : 0, atP = aft.find(x => x[1] === mxP);   /* 프로파일을 늦게 켠 판 = 표시 뒤 가장 긴 프레임 */
      const prof = prof0 && atP ? spike(prof0, atP[0] - (tM - t0) - mxP - 2, atP[0] - (tM - t0) + 1, t1 - tM) : null; if (prof && prof.self) prof.at = [atP[0], mxP];
      const out = { nm, max: r1(mx), at: at ? at[0] : null, n50: d.filter(v => v > 50).length, n100: d.filter(v => v > 100).length, frames: d.length, prog: P1 - P0, progN: PN, pre: r1(iv.pre), long: iv.a.filter(x => x[1] > 50).slice(0, 8), r: r == null ? undefined : r, prof: prof || undefined };
      R.m[key] = out; console.log('[' + S.tag + '#' + round + '] ' + key.padEnd(10) + ' 가장 긴 ' + String(out.max).padStart(6) + 'ms(@' + out.at + ') · >50 ' + out.n50 + ' · >100 ' + out.n100 + ' · 새 셰이더 ' + out.prog + ' · 바탕 ' + out.pre + (r != null ? ' · ' + JSON.stringify(r).slice(0, 80) : '') + (prof && prof.self ? '\n      구간 ' + prof.tot + 'ms · ' + prof.self.map(x => x[0] + ' ' + x[1]).join(' | ') + '\n      사슬 ' + prof.chain.map(x => x[0] + ' ' + x[1]).join(' | ') : prof ? ' ' + JSON.stringify(prof) : ''));
      return out; };

    /* ── A. 새 아이: 첫 화면 닫고 첫 걸음 ── */
    await p.goto(base + '/v2/?town=ourtown'); await built(); await ev(REC); await W8(2500);
    if (on('first')) await mo('first', '첫 화면 닫고 첫 걸음', async () => { await ev(() => { const b9 = document.querySelector('.twn-ld [data-a="x"]'); if (b9) b9.click(); }); await W8(600); await p.keyboard.down('KeyW'); await W8(2200); await p.keyboard.up('KeyW'); }, { win: 1500, pre: 1500 });
    /* ── B. 몇 차시 논 아이(&all=1 · HUD 다 열림) ── */
    await p.goto(base + '/v2/?town=ourtown&all=1'); await built(); await ev(REC); R.load = await ev(() => ({ ms: SM_TOWN.load ? SM_TOWN.load.ms : null, warm: SM_TOWN.warmText ? SM_TOWN.warmText().ms : null, mode: SD2.gfx && SD2.gfx.mode })); console.log('[' + S.tag + '#' + round + '] 짓기 ' + JSON.stringify(R.load)); await W8(1500);
    await ev(() => { const b9 = document.querySelector('.twn-ld [data-a="x"]'); if (b9) b9.click(); }); await W8(1500); for (let i = 0; i < 3; i++) { await p.keyboard.press('Escape'); await W8(150); } await closeAll(); await calm(); await W8(800); await closeAll();
    await setMin(12 * 60); const dn = await free(123, 785); await tp(dn[0], dn[1]); await W8(5000); await closeAll(); await calm();
    const esc = async () => { await p.keyboard.press('Escape'); await W8(150); await closeAll(); };
    if (on('panel')) {
      await mo('bag', '가방 열기', () => ev(() => SM_TOWN.bagOpen())); await mo('bag_x', '가방 닫기', esc, { win: 1200 });
      await mo('map', '큰 지도 열기', () => ev(() => SM_TOWN.openBig())); await mo('map_x', '큰 지도 닫기', esc, { win: 1200 });
      await mo('play', '놀이 판(투호) 열기', () => ev(() => SM_TOWN.playK('tuho'))); await mo('play_x', '놀이 판 닫기', async () => { await ev(() => { if (SM_TOWN.playEnd) SM_TOWN.playEnd(false); }); await esc(); }, { win: 1500 });
    }
    if (on('indoor')) {
      const shop = await ev(() => { const C = SM_TOWN.indoor.census(); let bi = -1, bd = 1e18; for (const c of C) { if (c.in !== 'shop' || !c.door || c.school || c.home) continue; const pl = SM_TOWN.shops().find(s => s.name === c.name); if (!pl) continue; const dd = (pl.door[0] - 123) ** 2 + (pl.door[1] - 785) ** 2; if (dd < bd) { bd = dd; bi = c.i; } } return bi; });
      const home = await ev(() => { const C = SM_TOWN.indoor.census(); const c = C.find(x => x.home && x.in); return c ? c.i : -1; });
      for (const [k9, i9] of [['in1', shop], ['in2', shop], ['inH', home]]) { if (i9 < 0) continue; await closeAll(); await mo(k9, '실내 들어가기(' + k9 + ')', () => ev(i => SM_TOWN.indoor.enterI(i), i9), { win: 3200 }); await closeAll(); await mo('out' + k9.slice(2), '실내 나오기(' + k9 + ')', () => ev(() => SM_TOWN.indoor.exit()), { win: 2200 }); await closeAll(); }
      await tp(dn[0], dn[1]); await W8(1500);
      const ai = await ev(() => { const C = SM_TOWN.indoor.census(); const c = C.find(x => !x.school && ['math', 'english', 'science', 'study', 'art', 'piano', 'taekwondo'].includes(x.cat)); return c ? c.i : -1; });
      if (ai >= 0) { await setMin(15 * 60); await closeAll(); await mo('inA', '학원 들어가기', () => ev(i => SM_TOWN.indoor.enterI(i), ai), { win: 3200 }); await closeAll(); await W8(1500);
        await mo('acad', '학원 수업 열기', () => ev(() => SM_TOWN.ent().use('ent:acad')), { win: 2500 }); await mo('acad_x', '학원 수업 닫기', esc, { win: 1200 });
        await mo('outA', '학원 나오기', () => ev(() => SM_TOWN.indoor.exit()), { win: 2200 }); await closeAll(); await setMin(12 * 60); }
      await tp(dn[0], dn[1]); await W8(2500); await closeAll();
    }
    if (on('ride')) {
      await mo('bike_on', '자전거 타기', () => p.keyboard.press('KeyB'), { win: 1500 }); await mo('bike_off', '자전거 내리기', () => p.keyboard.press('KeyB'), { win: 1500 });
      const bus = await ev(() => { try { const n = SM_TOWN.busData().stops.length; for (let b = 1; b < n; b++) { const P = SM_TOWN.busPlanI(0, b); if (P && P[0] && P[0].legs.length === 1) return { a: 0, b, s: SM_TOWN.busData().stops[0] }; } return null; } catch (e) { return null; } });
      if (bus) { await ev(s => { SD2.map.player.teleport([s.x, SM_TOWN.ground(s.x, s.z) + 0.1, s.z]); }, bus.s); await W8(2500); await mo('bus', '버스 타기', () => ev(([a, b]) => SM_TOWN.busTripI(a, b, 0), [bus.a, bus.b]), { win: 3500 }); await mo('bus_x', '버스 내리기(건너뛰기)', () => ev(() => SM_TOWN.busSkip()), { win: 3500 }); await W8(1500); await closeAll(); }
      await mo('subway', '지하철 타기', () => ev(() => SM_TOWN.subGo(0, 1)), { win: 4500 }); await W8(6000); await closeAll();
      await mo('boat', '배 타기', () => ev(() => SM_TOWN.boatGo(true)), { win: 3000 }); await mo('boat_x', '배 내리기', () => ev(() => SM_TOWN.boatGo(false)), { win: 2500 }); await closeAll();
      await tp(dn[0], dn[1]); await W8(2500); await closeAll();
    }
    if (on('wx')) {
      await mo('rain', '비 옴', () => ev(() => SM_TOWN.weather('rain'))); await mo('clear', '맑음', () => ev(() => SM_TOWN.weather('clear')));
      await mo('rain2', '비 옴(두 번째)', () => ev(() => SM_TOWN.weather('rain'))); await mo('clear2', '맑음(두 번째)', () => ev(() => SM_TOWN.weather('clear')));
    }
    if (on('season')) {
      for (const s9 of ['summer', 'autumn', 'winter']) await mo('s_' + s9, '계절 ' + s9, () => ev(s => SM_TOWN.season(s), s9), { win: 3000 });
      await mo('snow', '눈 옴(겨울)', () => ev(() => SM_TOWN.weather('snow'))); await mo('snow_x', '눈 그침', () => ev(() => SM_TOWN.weather('clear')));
      await mo('s_now', '계절 지금', () => ev(() => SM_TOWN.season('now')), { win: 3000 });
    }
    if (on('jump')) {
      const far = await ev(() => { const P = SM_TOWN.places(), pick = re => { const q = P.find(p => re.test(p.name || '')); return q ? (q.door || [q.x, q.z]) : null; }; return [pick(/해수욕장/), pick(/과수원|목장/), pick(/염전|갯벌|항구|선착장/), pick(/역$|터미널/)].filter(Boolean); });
      let k = 0; for (const f of far) { const a = await free(f[0], f[1]); await mo('new' + (++k), '처음 가는 동네 ' + k, () => tp(a[0], a[1]), { win: 3000 }); await closeAll(); }
      await mo('back', '가 본 곳으로(시내)', () => tp(dn[0], dn[1]), { win: 2500 }); await closeAll();
    }
    if (on('time')) {
      await ev(() => { const G = SM_TOWN.game(); G.S.clock = true; }); await W8(300);
      await mo('sunset', '노을(17시)', async () => { await ev(() => { SM_TOWN.game().S.min = 17 * 60 - 1; }); }, { win: 2500 });
      await mo('night', '밤(19시)', async () => { await ev(() => { SM_TOWN.game().S.min = 19 * 60 - 1; }); }, { win: 2500 });
      await mo('sleep', '잠 → 아침(하루 넘김)', () => ev(() => { SM_TOWN.sleep(); }), { win: 4500, profAt: 1200 }); R.m.sleep.news = await ev(() => { try { const n = SM_TOWN.news(); return { ms: n.ms, all: n.all }; } catch (e) { return null; } }); console.log('   아침 소식판 newsRun ms ' + JSON.stringify(R.m.sleep.news)); await W8(800); await closeAll(); await calm();
    }
    if (on('feast')) {
      const fd = await ev(() => { try { return SM_TOWN.feast().info().fd | 0; } catch (e) { return 0; } }); console.log('   잔치 날 ' + fd);
      if (fd > 1) { await ev(fd => { const G = SM_TOWN.game(); G.S.day = fd - 1; G.S.min = 20 * 60; G.mark && G.mark(); }, fd); await W8(1500); await closeAll();
        await mo('feast', '잔치 날 아침(잠)', () => ev(() => { SM_TOWN.sleep(); }), { win: 4500 }); await W8(800); await closeAll(); await calm(); }
    }
    if (on('emerg')) {
      await setMin(10 * 60 + 30); await tp(dn[0], dn[1]); await W8(1500); await closeAll();
      await mo('emerg', '긴급 출동 시작(112)', async () => { await ev(() => SM_TOWN.emerg().dbg.spawn('lost')); for (let i = 0; i < 12; i++) { await W8(400); if (await ev(() => !!(SM_TOWN.emerg().info().ev))) return 'ev'; } return 'none'; }, { win: 2500 });
    }
    if (on('typh')) { await closeAll(); await mo('typh', '태풍 예보 시작', () => ev(() => { const T = SM_TOWN.typhoon; if (T) T.start(); return !!T; }), { win: 3000 }); await closeAll(); }
  } catch (e) { console.log('실패 ' + (e && e.stack || e)); R.fail = String(e && e.message || e).slice(0, 300); }
  R.errs = errs.slice(0, 10); fs.mkdirSync(OUT, { recursive: true }); const fn = path.join(OUT, 'hitch_' + S.tag + '_' + round + (RENDER ? '' : '_nr') + (PROF ? '_prof' : '') + '.json'); fs.writeFileSync(fn, JSON.stringify(R, null, 1)); console.log('→ ' + fn + ' · 페이지 오류 ' + errs.length + (errs.length ? ' ' + JSON.stringify(errs.slice(0, 3)) : ''));
  await b.close(); srv.close(); return R;
}
(async () => {
  const all = [];
  for (let r = 1; r <= ROUNDS; r++) for (let i = 0; i < SETS.length; i++) all.push(await run(SETS[i], PORT0 + i, r));
  /* 표: 순간마다 판(태그)별 가장 긴 프레임 중앙 [범위] · >50 수(판 합/번) · >100 · 새 셰이더(중앙) */
  const keys = [...new Set(all.flatMap(R => Object.keys(R.m)))], tags = SETS.map(S => S.tag), med = a => { const s = a.slice().sort((x, y) => x - y); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : 0; };
  console.log('\n순간 | ' + tags.map(t => t + ' 가장 긴 중앙[범위] · >50/번 · >100 · 새 셰이더').join(' | '));
  const sum = {}; for (const k of keys) console.log(k.padEnd(10) + ' | ' + tags.map(t => { const L = all.filter(R => R.tag === t && R.m[k]).map(R => R.m[k]); if (!L.length) return '-'; const mx = L.map(m => m.max), n5 = L.reduce((a, m) => a + m.n50, 0) / L.length, n1 = L.reduce((a, m) => a + m.n100, 0) / L.length; const S9 = sum[t] || (sum[t] = { n50: 0, n100: 0 }); S9.n50 += n5; S9.n100 += n1; return r1(med(mx)) + '[' + r1(Math.min(...mx)) + '~' + r1(Math.max(...mx)) + '] · ' + r1(n5) + ' · ' + r1(n1) + ' · ' + med(L.map(m => m.prog || 0)); }).join(' | '));
  for (const t of tags) { const L = all.filter(R => R.tag === t); console.log(t + ' (' + L.length + '번) 한 번에 >50 ' + r1(sum[t] ? sum[t].n50 : 0) + ' · >100 ' + r1(sum[t] ? sum[t].n100 : 0) + ' · 짓기 ms 중앙 ' + med(L.map(R => (R.load && R.load.ms) || 0)) + ' · 글자 데우기 ms 중앙 ' + med(L.map(R => (R.load && R.load.warm) || 0)) + ' · 그림 모드 ' + ((L[0] && L[0].load && L[0].load.mode) || '?')); }
  process.exit(0);
})();
