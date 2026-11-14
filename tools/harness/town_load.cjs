// ⏱ 처음 열기 재기(LOAD-1 · 11-13 '주소를 누르고 걸을 수 있을 때까지가 길 것' 추정을 숫자로) — 재기만(게임 코드 X)
//   zsh tools/ops/b2.sh node tools/harness/town_load.cjs [마을=ourtown] [포트=8831] [--reps=3] [--nets=free,4m,1m5] [--cpus=1,4] [--visits=3] [--out=폴더] [--h2] [--soon] [--trace]
//   문서의 본 표 = `ourtown 8831 --h2`(배포와 같은 HTTP/2 · 망 셋 × CPU 둘 × 방문 셋 × 세 판 = 14분쯤)
//   결과 표 = docs/systems/town_load.md · 결과 JSON = <out>/town_load[_h2|_trace].json(기본 out = 임시 폴더)
//   흉내(진짜 크롬북 X): CrOS UA · 1366×768 ×1 · GPU ANGLE · CPU 4×(CDP setCPUThrottlingRate = 주 스레드만) · 망(CDP Network.emulateNetworkConditions = 받는 양은 압축된 바이트 기준 · 지연은 요청마다)
//   서버 = 이 파일 안(저장소 뿌리를 그 포트로) — GitHub Pages와 같은 꼴로 gzip · ETag/304 · Cache-Control
//        (11-13 배포본 머리말 확인: HTTP/2 · content-encoding gzip · cache-control max-age=600 · 약한 ETag · town.js 800,364바이트 = 여기 gzip 6단계와 0.1% 차)
//        --h2 = 그 자리에서 만든 인증서로 HTTP/2(배포 꼴 = 본 표) · 없으면 HTTP/1.1(한 주소에 연결 여섯 · openssl이 없는 곳에서 · 차는 첫 화면 0.2초쯤)
//   방문 셋(같은 크롬 프로필 폴더 · 방문마다 크롬을 껐다 켬 = 메모리 캐시 X · 디스크 캐시만):
//        ① 처음 = 캐시 빈 새 프로필(모두 200) ② 다시 = 캐시 있음 · 10분 지남(= 다음 차시 · 모두 304로 다시 확인) ③ 또 다시 = ②와 같고 V8 코드 캐시가 데워진 뒤
//        (서버가 max-age=0으로 줘서 10분을 기다리지 않고 '지남'을 만듦 — 처음 방문의 초는 이 머리말과 상관없음)
//   조건 = 망 셋(free 제한 없음 · 4m 4Mbps·40ms · 1m5 1.5Mbps·80ms) × CPU 둘(1 그대로 · 4 네 배 느리게) · 한 판(rep)마다 조건을 차례로 돌고 시작 자리를 바꿈(번갈아) → 가운데 값
//   신호(쪽 안 · performance.now 기준 = 주소를 누른 때부터): 첫 그림(FCP = 로딩 막) · main.js 시작(미리 받기 link) · 학교 끝(SD2) · 마을 모듈 다 받음(resource timing) · 마을 시작(SM_BUILD=1)
//        · 첫 화면(SM_T_RDY = 칸 카드·이어하기/처음부터 — 여기서 단추를 눌러 예약) · 다 지음(SM_BUILD=0) · 걸을 수 있음(짓는 덮개가 걷힘)
//   몫 넷: 받기 = 같은 CPU에서 (조인 망 − 제한 없는 망 · 우리 파일) · 바깥 = 짓기 첫 단계가 아이 집 마당(바깥 서버 Firebase)을 기다린 초
//        · 짓기 = 학교 buildMs + 마을 load.ms − 바깥(쪽 안에서 잰 것 · 그 가운데 '그림 데우기'는 GPU라 못 믿음) · 컴파일·그 밖 = 나머지
//   저장 손 표시: 앞 방문이 남긴 `:own`(쥠)을 60초 묵혀 '다음 시간에 다시 엶' 꼴로 잼 · --soon = 그대로 둠(새로고침·닫고 20초 안에 다시 엶 = 첫 화면 +1.5초 — town_game.js claimSave)
//        TL_EV=1 = 쪽을 떠날 때 사건 차례와 그때의 손 표시를 다음 방문 결과(ev0)에 남김(위 1.5초의 까닭을 볼 때)
//   --trace = 한 조건(기본 4m × CPU 4 · --nets·--cpus로 바꿈)의 방문들을 트레이스로 → 이름별 컴파일·평가 ms 합(늦게 받기 후보 표의 '덜 초' 근거 · 모듈별 열은 뒤 스레드 파싱 bg만 믿음)
const { chromium } = require('playwright');
const http = require('http'), http2 = require('http2'), fs = require('fs'), path = require('path'), zlib = require('zlib'), os = require('os'), crypto = require('crypto'), cp = require('child_process');
const pos = process.argv.slice(2).filter(a => !a.startsWith('--'));
const arg = k => { const a = process.argv.find(s => s.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : null; };
const ID = pos[0] || 'ourtown', PORT = +(pos[1] || 8831), ROOT = path.resolve(__dirname, '../..');
const REPS = +(arg('reps') || 3), VISITS = +(arg('visits') || 3), OUT = arg('out') || os.tmpdir(), H2 = process.argv.includes('--h2'), TRACE = process.argv.includes('--trace'), SOON = process.argv.includes('--soon');
const NETDEF = { free: null, '4m': { down: 4e6 / 8, up: 1e6 / 8, lat: 40 }, '1m5': { down: 1.5e6 / 8, up: 0.75e6 / 8, lat: 80 } };
const NETNAME = { free: '제한 없음', '4m': '4Mbps·40ms', '1m5': '1.5Mbps·80ms' }, VNAME = ['처음', '다시(304)', '또 다시(304)'];
const NETS = (arg('nets') || 'free,4m,1m5').split(',').filter(k => k in NETDEF), CPUS = (arg('cpus') || '1,4').split(',').map(Number).filter(Boolean);
const UA = 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const GPU = ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'];
const r1 = v => Math.round(v * 10) / 10, r2 = v => Math.round(v * 100) / 100, sec = ms => ms == null ? null : r2(ms / 1000);
const med = a => { const s = a.filter(v => v != null && isFinite(v)).sort((x, y) => x - y); return s.length ? s[Math.floor((s.length - 1) / 2 + 0.5)] : null; };

/* ── 서버: gzip · ETag/304 · Cache-Control(Pages 꼴) ── */
const types = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.woff2': 'font/woff2', '.glb': 'model/gltf-binary' };
const TEXT = /\.(m?js|html|css|json|svg|txt)$/, FILES = new Map(), SRV = { maxAge: 0, n: 0, n304: 0, bytes: 0 };
const entry = p => { const st = fs.statSync(p); let o = FILES.get(p); if (o && o.mt === st.mtimeMs) return o; const raw = fs.readFileSync(p);
  o = { mt: st.mtimeMs, raw, gz: TEXT.test(p) ? zlib.gzipSync(raw, { level: 6 }) : null, etag: 'W/"' + crypto.createHash('sha1').update(raw).digest('hex').slice(0, 16) + '"' }; FILES.set(p, o); return o; };
const serve = (q, r) => { const u = decodeURIComponent((q.url || '/').split('?')[0]), p = path.join(ROOT, u, u.endsWith('/') ? 'index.html' : ''); let o = null;
  if (p.startsWith(ROOT)) { try { o = entry(p); } catch (e) { o = null; } }
  if (!o) { r.writeHead(404); r.end(); return; }
  const h = { 'content-type': types[path.extname(p)] || 'application/octet-stream', etag: o.etag, 'cache-control': 'max-age=' + SRV.maxAge, vary: 'Accept-Encoding' }; SRV.n++;
  if (q.headers['if-none-match'] === o.etag) { SRV.n304++; r.writeHead(304, h); r.end(); return; }
  const gz = o.gz && /\bgzip\b/.test(String(q.headers['accept-encoding'] || '')), body = gz ? o.gz : o.raw; if (gz) h['content-encoding'] = 'gzip'; h['content-length'] = body.length; SRV.bytes += body.length;
  r.writeHead(200, h); r.end(body); };
const warm = d => { for (const n of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, n.name); if (n.isDirectory()) warm(p); else if (/\.(m?js|html|css)$/.test(n.name)) entry(p); } };   /* 압축은 서버를 열기 전에 다 해 둠(재는 초에 안 섞이게) */
let SPKI = '', srv;
if (H2) { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'tlcert-')), key = path.join(d, 'k.pem'), crt = path.join(d, 'c.pem');
  cp.execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', key, '-out', crt, '-days', '2', '-subj', '/CN=127.0.0.1'], { stdio: 'ignore' });
  const pem = fs.readFileSync(crt); SPKI = crypto.createHash('sha256').update(new crypto.X509Certificate(pem).publicKey.export({ type: 'spki', format: 'der' })).digest('base64');
  srv = http2.createSecureServer({ key: fs.readFileSync(key), cert: pem, allowHTTP1: true }, serve); fs.rmSync(d, { recursive: true, force: true }); }
else srv = http.createServer(serve);

/* ── 쪽 안 기록기(주소를 누른 때 = 0) ── */
const PROBE = cfg => { if (window.top !== window || window.__TL) return; const L = window.__TL = { t: {}, clicked: 0, btn: '' }, now = () => performance.now();
  try { performance.setResourceTimingBufferSize(3000); } catch (e) { /* */ }
  try { L.own0 = Object.keys(localStorage).filter(k => /:own$/.test(k)).map(k => { const v = JSON.parse(localStorage.getItem(k) || 'null') || {}, age = Math.round((Date.now() - (v.at || 0)) / 100) / 10;
    if (v.id && !(cfg && cfg.soon)) { v.at = (v.at || 0) - 60000; localStorage.setItem(k, JSON.stringify(v)); }   /* '다음 시간에 다시 엶' 꼴 = 손 표시를 60초 묵힘(게임은 20초 안의 표시만 기다림) · --soon = 그대로(새로고침 꼴) */
    return (v.id ? 'held' : v.rel ? 'rel' : v.req ? 'req' : '?') + ' ' + age + 's'; }).join(' | '); } catch (e) { L.own0 = 'x'; }   /* 앞 방문이 남긴 저장 손 표시(held = 안 뗌 → 20초 안이면 claimSave가 1.5초 기다림) */
  const trap = (k, on) => { let v; Object.defineProperty(window, k, { configurable: true, enumerable: true, get() { return v; }, set(x) { v = x; try { on(x); } catch (e) { /* */ } } }); };
  trap('SD2', x => { if (x && L.t.school == null) L.t.school = now(); });
  trap('SM_BUILD', x => { if (x === 1 && L.t.townStart == null) L.t.townStart = now(); else if (x === 0 && L.t.townStart != null && L.t.built == null) L.t.built = now(); });
  trap('SM_T_RDY', x => { if (!(x > 0) || L.t.title != null) return; L.t.title = now();
    requestAnimationFrame(() => { const c = new MessageChannel(); c.port1.onmessage = () => { L.t.titlePaint = now(); const b = document.querySelector('.twn-ld [data-a="x"]'); if (b) { L.btn = b.textContent.trim().slice(0, 24); b.click(); { const h9 = document.querySelector('.twn-ld .how3') && document.querySelector('.twn-ld [data-a="x"]'); if (h9) h9.click(); } L.clicked = 1; }   /* TITLE-2: 처음하기 다음 하는 법 한 장이면 ▶ 첫날 시작도(예약) */ }; c.port2.postMessage(0); }); });   /* 첫 화면이 한 번 그려진 뒤 이어하기/처음부터를 눌러 예약(= 다 지으면 바로 시작) */
  trap('SM_TOWN', x => { if (x && L.t.ready == null) L.t.ready = now(); });
  const mo = new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.tagName === 'LINK' && n.rel === 'modulepreload') { if (L.t.mainStart == null) L.t.mainStart = now(); mo.disconnect(); return; } });
  mo.observe(document, { childList: true, subtree: true });
  const f = () => { if (L.t.built != null && window.SM_TOWN && !document.querySelector('.twn-ld')) { L.t.walk = now(); return; } requestAnimationFrame(f); }; requestAnimationFrame(f); };
const EVLOG = () => { if (window.top !== window) return; const K = '__tl_ev', st = () => { try { return Object.keys(localStorage).filter(k => /:own$/.test(k)).map(k => { const v = JSON.parse(localStorage.getItem(k) || 'null') || {}; return v.id ? 'held' : v.rel ? 'rel' : '?'; }).join(','); } catch (e) { return 'x'; } };   /* TL_EV=1: 쪽을 떠날 때 사건 차례와 그때의 손 표시(사건 앞 값)를 남겨 다음 방문이 읽음 */
  try { window.__TL_EV0 = localStorage.getItem(K) || ''; localStorage.removeItem(K); } catch (e) { /* */ }
  const log = n => { try { localStorage.setItem(K, (localStorage.getItem(K) || '') + ' ' + n + '[' + st() + ']'); } catch (e) { /* */ } };
  for (const ev of ['beforeunload', 'pagehide']) addEventListener(ev, () => log(ev)); document.addEventListener('visibilitychange', () => log('vis:' + document.visibilityState)); };
const COLLECT = () => { const L = window.__TL, rs = performance.getEntriesByType('resource'), nv = performance.getEntriesByType('navigation')[0] || {}, fcp = performance.getEntriesByType('paint').find(e => e.name === 'first-contentful-paint');
  const kind = u => /\/(games|towns)\//.test(u) ? 'town' : /\.m?js(\?|$)/.test(u) ? 'core' : 'etc', o = { town: { n: 0, s: Infinity, e: 0 }, core: { n: 0, s: Infinity, e: 0 }, etc: { n: 0, s: Infinity, e: 0 } };
  for (const r of rs) { const k = o[kind(r.name)]; k.n++; k.s = Math.min(k.s, r.startTime); k.e = Math.max(k.e, r.responseEnd); }
  const sv = (() => { try { return Object.keys(localStorage).filter(k => /town/.test(k)).length; } catch (e) { return -1; } })();
  return { t: L.t, own0: L.own0 || '', ev0: window.__TL_EV0 || '', clicked: L.clicked, btn: L.btn, fcp: fcp ? fcp.startTime : null, html: nv.responseEnd || null, res: o, timing: window.SD2 && SD2.timing, loadMs: SM_TOWN.load && SM_TOWN.load.ms, steps: SM_TOWN.load && SM_TOWN.load.steps, saves: sv }; };

/* ── 트레이스(--trace) ── */
const TRCATS = ['v8', 'v8.compile', 'devtools.timeline', 'disabled-by-default-v8.compile', 'loading'];
const traceStop = async cdp => { const done = new Promise(r => cdp.once('Tracing.tracingComplete', r)); await cdp.send('Tracing.end'); const { stream } = await done; let s = '';
  for (;;) { const c = await cdp.send('IO.read', { handle: stream, size: 1 << 20 }); s += c.base64Encoded ? Buffer.from(c.data, 'base64').toString() : c.data; if (c.eof) break; } await cdp.send('IO.close', { handle: stream });
  const j = JSON.parse(s); return Array.isArray(j) ? j : j.traceEvents || []; };
const traceSum = evs => { const by = {}, mod = {}, open = {};   /* 이름별 합(ms) · 모듈별(파일) 컴파일·평가 — X(한 덩이) · B/E(짝) 둘 다 */
  const add = (e, dur) => { const n = e.name; if (!/compile|parse|evaluateModule|EvaluateScript|deserialize|produce|CodeCache|ModuleRecord|v8\.run|FunctionCall|ParseHTML/i.test(n)) return; by[n] = (by[n] || 0) + dur / 1000;
    const a = e.args || {}, f = a.fileName || (a.data && (a.data.url || a.data.fileName)) || ''; if (f && /compileModule|evaluateModule|parseOnBackground$|produceModuleCache/i.test(n)) { const k = f.replace(/^https?:\/\/[^/]+/, '').split('?')[0], m = mod[k] || (mod[k] = { compile: 0, evaluate: 0, bg: 0, cache: 0 });
      if (/evaluateModule/.test(n)) m.evaluate += dur / 1000; else if (/parseOnBackground/.test(n)) m.bg += dur / 1000; else if (/produce/i.test(n)) m.cache += dur / 1000; else m.compile += dur / 1000; } };
  for (const e of evs) { if (e.ph === 'X') add(e, e.dur || 0); else if (e.ph === 'B') (open[e.tid + '|' + e.name] || (open[e.tid + '|' + e.name] = [])).push(e); else if (e.ph === 'E') { const st = open[e.tid + '|' + e.name], b = st && st.pop(); if (b) add(b, e.ts - b.ts); } }
  return { by: Object.fromEntries(Object.entries(by).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, r1(v)])), mod }; };

/* ── 방문 한 번 ── */
async function visit(dir, netK, cpu, vi, trace) {
  const base = (H2 ? 'https' : 'http') + '://127.0.0.1:' + PORT, o = { net: netK, cpu, visit: vi, load1: r2(os.loadavg()[0]) }, errs = [];
  const ctx = await chromium.launchPersistentContext(dir, { args: GPU.concat(H2 ? ['--ignore-certificate-errors-spki-list=' + SPKI] : []), viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1, userAgent: UA });
  try {
    await ctx.addInitScript(PROBE, { soon: SOON }); if (process.env.TL_EV) await ctx.addInitScript(EVLOG);
    const p = ctx.pages()[0] || await ctx.newPage(); p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
    const cdp = await ctx.newCDPSession(p); await cdp.send('Performance.enable'); await cdp.send('Network.enable');
    if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
    const nd = NETDEF[netK]; if (nd) await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: nd.lat, downloadThroughput: nd.down, uploadThroughput: nd.up });
    const NET = new Map();
    cdp.on('Network.responseReceived', e => NET.set(e.requestId, { url: e.response.url, st: e.response.status, disk: !!e.response.fromDiskCache, proto: e.response.protocol }));
    cdp.on('Network.loadingFinished', e => { const x = NET.get(e.requestId); if (x) x.bytes = e.encodedDataLength; });
    const s0 = { n: SRV.n, n304: SRV.n304, bytes: SRV.bytes };
    if (trace) await cdp.send('Tracing.start', { transferMode: 'ReturnAsStream', traceConfig: { includedCategories: TRCATS } });
    await p.goto(base + '/v2/?town=' + ID, { waitUntil: 'commit', timeout: 120000 });
    await p.waitForFunction(() => window.__TL && window.__TL.t.walk > 0, null, { timeout: 420000, polling: 250 });
    if (trace) o.trace = traceSum(await traceStop(cdp));
    await p.waitForTimeout(1200);
    const D = await p.evaluate(COLLECT), M = {}; for (const x of (await cdp.send('Performance.getMetrics')).metrics) M[x.name] = x.value;
    let reqN = 0, bytes = 0, disk = 0, jsN = 0, jsB = 0, townN = 0, townB = 0; const proto = {}, ext = {};
    for (const x of NET.values()) { if (/^data:|^blob:/.test(x.url)) continue; reqN++; bytes += x.bytes || 0; if (x.disk) disk++; proto[x.proto] = (proto[x.proto] || 0) + 1; if (x.url.indexOf(base + '/') !== 0) { const h = x.url.split('/').slice(0, 3).join('/'); ext[h] = (ext[h] || 0) + 1; }
      if (/\.m?js(\?|$)/.test(x.url)) { jsN++; jsB += x.bytes || 0; if (/\/(games|towns)\//.test(x.url)) { townN++; townB += x.bytes || 0; } } }
    const t = D.t, bm = D.timing && D.timing.buildMs || 0, stp = Array.isArray(D.steps) ? D.steps : [], sumS = re => stp.reduce((a, x) => a + (re.test(x[0]) ? x[1] : 0), 0);
    Object.assign(o, { reqN, kB: Math.round(bytes / 1024), n304: SRV.n304 - s0.n304, disk, ext, jsN, jsKB: Math.round(jsB / 1024), townN, townKB: Math.round(townB / 1024), proto, srvN: SRV.n - s0.n, srv304: SRV.n304 - s0.n304, srvKB: Math.round((SRV.bytes - s0.bytes) / 1024),
      fcp: sec(D.fcp), mainStart: sec(t.mainStart), school: sec(t.school), coreGot: sec(D.res.core.e), townGot: sec(D.res.town.e), townStart: sec(t.townStart), title: sec(t.title), titlePaint: sec(t.titlePaint), built: sec(t.built), walk: sec(t.walk),
      schoolBuild: sec(bm), townBuild: sec(D.loadMs), build: sec(bm + (D.loadMs || 0)), yard: sec(sumS(/마당/)), gwarm: sec(sumS(/그림 데우는/)),   /* yard = 짓기 첫 단계가 바깥 서버(아이 집 마당)를 기다린 초 · gwarm = 그림 데우기(GPU — 머리 없는 크롬 숫자는 못 믿음) */
      clicked: D.clicked, btn: D.btn, saves: D.saves, own0: D.own0, ev0: D.ev0 || undefined,
      task: r2(M.TaskDuration || 0), script: r2(M.ScriptDuration || 0), v8c: M.V8CompileDuration != null ? r2(M.V8CompileDuration) : null, heapMB: Math.round((M.JSHeapUsedSize || 0) / 1048576), steps: D.steps });
    await p.evaluate(() => { try { SM_TOWN.save().flush(); } catch (e) { /* */ } });   /* 다음 방문 = 이어하기(진짜 두 번째 방문 꼴) */
    if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    await p.goto('about:blank').catch(() => {}); await p.waitForTimeout(500);   /* 탭을 닫듯 쪽을 떠남(저장이 디스크에 내려가게) — 손 표시는 그래도 '쥠'으로 남음(pagehide의 손 떼기를 바로 뒤 visibilitychange의 flush가 다시 덮음) → 다음 방문의 PROBE가 묵힘 */
  } catch (e) { o.err = String(e && e.message || e).split('\n')[0].slice(0, 200); }
  if (errs.length) o.pageErr = errs.slice(0, 3);
  await ctx.close().catch(() => {});
  return o;
}

/* ── 돌리기 ── */
const COLS = ['reqN', 'kB', 'n304', 'disk', 'jsN', 'jsKB', 'townN', 'townKB', 'fcp', 'mainStart', 'school', 'coreGot', 'townGot', 'townStart', 'title', 'titlePaint', 'built', 'walk', 'schoolBuild', 'townBuild', 'build', 'yard', 'gwarm', 'task', 'script', 'v8c', 'load1'];
const pad = (s, n) => { s = String(s == null ? '-' : s); let w = 0; for (const ch of s) w += ch.charCodeAt(0) > 0x2e80 ? 2 : 1; return s + ' '.repeat(Math.max(0, n - w)); };
warm(path.join(ROOT, 'v2')); warm(path.join(ROOT, 'lib'));
srv.listen(PORT, '127.0.0.1', async () => {
  const T00 = Date.now(), el = () => ((Date.now() - T00) / 1000).toFixed(0) + 's', runs = [], tmp = [];
  const conds = []; for (const n of NETS) for (const c of CPUS) conds.push([n, c]);
  const R = { at: new Date().toISOString(), town: ID, h2: H2, reps: REPS, visits: VISITS, host: os.cpus()[0].model + ' ×' + os.cpus().length, load0: os.loadavg().map(r2) };
  console.log('⏱ 처음 열기 재기 — ' + ID + ' · ' + (H2 ? 'HTTP/2' : 'HTTP/1.1') + ' · 조건 ' + conds.length + ' × 방문 ' + VISITS + ' × ' + REPS + '판 · 부하 ' + R.load0.join(' '));
  try {
    if (TRACE) { const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tlprof-')); tmp.push(dir);
      for (let v = 0; v < Math.min(VISITS, 3); v++) { const o = await visit(dir, NETS.includes('4m') ? '4m' : NETS[0], CPUS.includes(4) ? 4 : CPUS[0], v, true); runs.push(o); console.log('  [' + el() + '] 트레이스 ' + VNAME[v] + ' 걸음 ' + o.walk + '초' + (o.err ? ' ✗ ' + o.err : '')); if (o.trace) console.log('    이름별 ms ' + JSON.stringify(o.trace.by)); } }
    else for (let rep = 0; rep < REPS; rep++) for (let i = 0; i < conds.length; i++) { const [n, c] = conds[(i + rep * 2) % conds.length], dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tlprof-')); tmp.push(dir);
      for (let v = 0; v < VISITS; v++) { const o = await visit(dir, n, c, v, false); o.rep = rep; runs.push(o);
        console.log('  [' + el() + '] ' + (rep + 1) + '판 ' + pad(NETNAME[n], 13) + ' CPU ' + c + '× ' + pad(VNAME[v], 12) + (o.err ? '✗ ' + o.err : '요청 ' + pad(o.reqN, 4) + pad(o.kB + 'KB', 8) + '304 ' + pad(o.n304, 4) + '첫그림 ' + pad(o.fcp, 6) + '첫화면 ' + pad(o.title, 6) + '걸음 ' + pad(o.walk, 6) + '짓기 ' + pad(o.build, 6) + '부하 ' + o.load1 + (o.clicked ? '' : ' ⚠ 단추 못 누름') + (Object.keys(o.ext).length ? ' 바깥 ' + JSON.stringify(o.ext) : '') + (o.pageErr ? ' ⚠ ' + o.pageErr[0] : ''))); }
      fs.rmSync(dir, { recursive: true, force: true }); }
  } catch (e) { console.log('✗ ' + String(e && e.stack || e).slice(0, 600)); }
  /* 가운데 값 */
  const M = {}; for (const [n, c] of conds) for (let v = 0; v < VISITS; v++) { const rs = runs.filter(o => o.net === n && o.cpu === c && o.visit === v && !o.err); if (!rs.length) continue; const m = { net: n, cpu: c, visit: v, n: rs.length, loadMax: Math.max(...rs.map(o => o.load1)), walkAll: rs.map(o => o.walk) }; for (const k of COLS) m[k] = med(rs.map(o => o[k])); M[n + '|' + c + '|' + v] = m; }
  if (!TRACE) {
    console.log('\n■ 가운데 값(초 · 주소를 누른 때부터) — 요청·전송(압축 KB) · 첫 그림(로딩 막) · 첫 화면(칸 카드·이어하기) · 걸을 수 있음');
    console.log(pad('망', 14) + pad('CPU', 5) + pad('방문', 13) + pad('요청', 6) + pad('전송KB', 8) + pad('304', 5) + pad('첫그림', 8) + pad('첫화면', 8) + pad('걸음', 8) + pad('(세 판)', 20) + pad('부하 최대', 8));
    for (const m of Object.values(M)) console.log(pad(NETNAME[m.net], 14) + pad(m.cpu + '×', 5) + pad(VNAME[m.visit], 13) + pad(m.reqN, 6) + pad(m.kB, 8) + pad(m.n304, 5) + pad(m.fcp, 8) + pad(m.title, 8) + pad(m.walk, 8) + pad(m.walkAll.join(' '), 20) + pad(m.loadMax, 8));
    console.log('\n■ 길 위 표시(처음 방문 · 초) — main.js 시작 · 학교 끝 · 마을 모듈 다 받음 · 마을 시작 · 첫 화면 · 다 지음 · 걸음');
    console.log(pad('망', 14) + pad('CPU', 5) + ['main', '학교끝', '마을받음', '마을시작', '첫화면', '다지음', '걸음'].map(s => pad(s, 9)).join(''));
    for (const m of Object.values(M)) if (m.visit === 0) console.log(pad(NETNAME[m.net], 14) + pad(m.cpu + '×', 5) + [m.mainStart, m.school, m.townGot, m.townStart, m.title, m.built, m.walk].map(s => pad(s, 9)).join(''));
    console.log('\n■ 몫(초) — 받기 = 같은 CPU의 제한 없는 망과의 차(우리 파일) · 바깥 = 짓기 첫 단계가 아이 집 마당(바깥 서버)을 기다림 · 짓기 = 학교 + 마을 − 바깥(그 가운데 그림 데우기) · 컴파일·그 밖 = 나머지');
    console.log(pad('망', 14) + pad('CPU', 5) + pad('방문', 13) + pad('걸음', 8) + pad('받기', 8) + pad('바깥', 7) + pad('컴파일·밖', 10) + pad('짓기', 8) + pad('(데우기)', 9) + '가장 큰 몫');
    R.split = [];
    for (const m of Object.values(M)) { const f = M['free|' + m.cpu + '|' + m.visit]; if (!f) continue; const yd = m.yard || 0, net = Math.max(0, r2(m.walk - f.walk - (yd - (f.yard || 0)))), bld = r2(m.build - yd), rest = Math.max(0, r2(m.walk - net - yd - bld)), top = [['받기', net], ['바깥', yd], ['컴파일·그 밖', rest], ['짓기', bld]].sort((a, b) => b[1] - a[1])[0];
      R.split.push({ net: m.net, cpu: m.cpu, visit: m.visit, walk: m.walk, title: m.title, fetch: net, yard: yd, rest, build: bld, gwarm: m.gwarm, top: top[0] });
      console.log(pad(NETNAME[m.net], 14) + pad(m.cpu + '×', 5) + pad(VNAME[m.visit], 13) + pad(m.walk, 8) + pad(net, 8) + pad(yd, 7) + pad(rest, 10) + pad(bld, 8) + pad(m.gwarm, 9) + top[0] + ' ' + Math.round(top[1] / m.walk * 100) + '%'); }
    console.log('\n■ 마을 짓기에서 긴 단계(처음 방문 · 제한 없는 망 · 가운데 값 초)'); R.steps = {};
    for (const c of CPUS) { const rs = runs.filter(o => o.net === NETS[0] && o.cpu === c && o.visit === 0 && !o.err && Array.isArray(o.steps)); if (!rs.length) continue; const lab = {};
      for (const o of rs) { const mm = {}; for (const [l, ms] of o.steps) { const k = l.replace(/\s*\(.*\)$/, ''); mm[k] = (mm[k] || 0) + ms; } for (const k in mm) (lab[k] || (lab[k] = [])).push(mm[k]); }
      const top = Object.entries(lab).map(([k, a]) => [k, sec(med(a))]).sort((a, b) => b[1] - a[1]).slice(0, 8); R.steps[c] = top; console.log('  CPU ' + c + '× · ' + top.map(x => x[0] + ' ' + x[1]).join(' · ')); }
  }
  R.median = M; R.runs = runs; R.took = el();
  const f = path.join(OUT, 'town_load' + (H2 ? '_h2' : '') + (TRACE ? '_trace' : '') + '.json'); try { fs.mkdirSync(OUT, { recursive: true }); fs.writeFileSync(f, JSON.stringify(R)); console.log('\n결과 → ' + f + ' · ' + el()); } catch (e) { console.log('결과 파일 못 씀 ' + e.message); }
  for (const d of tmp) fs.rmSync(d, { recursive: true, force: true });
  if (srv.closeAllConnections) srv.closeAllConnections(); srv.close(); const bad = runs.filter(o => o.err).length; console.log(bad ? 'LOAD FAIL ' + bad : 'LOAD DONE'); process.exit(bad ? 1 : 0);
});
