// 📒 현장 기록(PERF-G · 11-08 최적화 적대 토론 판정 1 — 진짜 크롬북 숫자가 0개 · 교사가 1~2주 손을 떼도 '저절로 쌓이는 기록')
//   localStorage 'sm-diag' = 이 기기에서 연 판(페이지 한 번)마다 한 칸 · 고리 20칸 · 칸마다 분 기록은 첫 1분 + 끝 39분
//   쓰는 때 = 첫 화면 뒤 한 번 · 마을 짓기 끝 · 5분마다 · 탭 숨김(30초에 한 번까지) · pagehide · webglcontextlost — 매 프레임 X(프레임마다는 숫자 몇 개를 미리 잡은 배열에만) · 쓰기 사이 2초 상한
//   칸 = 화면 판(GFX mode) · 화면 모드 · 코어 · 메모리 · GPU 이름 · 주소 갈래(마을·놀이 이름과 성능 스위치만) · 열기부터 첫 화면 · 첫 조작 · 마을 받기 끝 · 짓기 시작/끝
//        · 분마다 그린 프레임 간격(중앙 · 95% · 가장 긴 것 · 100ms 넘은 수 · 게임 속도 = dt 상한 0.05에 잘리고 남은 몫) · 화면 단계(FM)·자동 해상도(ADAPT) 기록 끝 10줄
//        · 문맥 잃음 · 나무 셰이더 실패(sm-gfx-safe) · 마을 저장 통계 · 힙(참고 — 크롬이 뭉개서 알림) · 판 길이 · 끝난 까닭
//   이름·저장 내용·반 코드·번호·네트워크 X · 홍보판(SM_PROMO)은 main.js가 부르지 않음 · 저장 공간이 모자라면 이 기록을 먼저 지움(아이 저장이 먼저)
//   SD.diag() · SD.diagClear() · SD.diagText()(= 마을 선생님 칸 「화면 기록 복사」) — docs/systems/perf.md '11-08 PERF-G 현장 기록'
const KEY = 'sm-diag', RING = 20, MINS = 40, V = 1;
const r1 = x => Math.round(x * 10) / 10, sec = ms => (ms == null || !(ms > 0) ? null : Math.round(ms / 100) / 10);

/* GPU 이름 짧게(BENCH-1에서 옮김 · town_bench.js도 여기서 씀): 'ANGLE (Intel, Mesa Intel(R) UHD Graphics 600 (GLK 2), OpenGL ES 3.2)' → 'Intel UHD Graphics 600 (GLK 2)' · 'ANGLE (Apple, ANGLE Metal Renderer: Apple M5, Unspecified Version)' → 'Apple M5' */
export function gpuShort(s) { s = String(s || ''); const m = s.match(/^ANGLE \((.*)\)$/);
  if (m) { const seg = []; let d = 0, cur = ''; for (const ch of m[1]) { if (ch === '(') d++; if (ch === ')') d--; if (ch === ',' && d === 0) { seg.push(cur.trim()); cur = ''; } else cur += ch; } seg.push(cur.trim()); s = seg[1] || seg[0] || ''; }
  const v = s.match(/^Vulkan [\d.]+ \((.*)\)$/); if (v) s = v[1];
  return s.replace(/ANGLE Metal Renderer:\s*/, '').replace(/\s*\(0x[0-9a-f]+\)/ig, '').replace(/\s*Direct3D.*$/, '').replace(/^Mesa\s+/, '').replace(/\((R|TM)\)/g, '').replace(/\s+/g, ' ').trim().slice(0, 40); }
export function gpuName(renderer) { try { const gl = renderer && renderer.getContext && renderer.getContext(), x = gl && gl.getExtension('WEBGL_debug_renderer_info'); return gpuShort(x ? gl.getParameter(x.UNMASKED_RENDERER_WEBGL) : ''); } catch (e) { return ''; } }
/* 운영체제·브라우저 짧게(BENCH-1에서 옮김) */
export function osBr() { const ua = navigator.userAgent || '';
  const os = /CrOS\s/.test(ua) ? 'CrOS ' + ((ua.match(/CrOS\s+\S+\s+([\d.]+)/) || [])[1] || '') : /Windows NT [\d.]+/.test(ua) ? ua.match(/Windows NT [\d.]+/)[0] : /Mac OS X/.test(ua) ? 'Mac' : /Android [\d.]+/.test(ua) ? ua.match(/Android [\d.]+/)[0] : /iPhone|iPad/.test(ua) ? 'iOS' : /Linux/.test(ua) ? 'Linux' : 'etc';
  const br = (ua.match(/(Edg|Chrome|Firefox|Version)\/(\d+)/) || []).slice(1, 3).join(' ').replace(/^Version/, 'Safari');
  return [os, br]; }

function readRing() { try { const a = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(a) ? a.filter(o => o && typeof o === 'object' && o.v === V && o.id) : []; } catch (e) { return []; } }
const hm = at => { const d = new Date(at), p = n => String(n).padStart(2, '0'); return p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()); };
const ENDK = { hide: '닫음', hid: '숨긴 채 끝', ctx: '화면 멈춤(문맥 잃음)', open: '끊김', start: '끊김', build: '끊김', '5m': '끊김', err: '끊김(오류 뒤)', look: '지금 판' };
const CRASH = new Set(['open', 'start', 'build', '5m', 'err']);   /* pagehide도 숨김도 없이 끝 = 놀다가 탭이 죽었거나 브라우저·전원이 꺼짐(추정) */

// 한 판 요약(분 기록에서) — 사람이 읽는 한 줄과 SD.diag() 칸이 같은 수를 씀
function sumRun(r) { const M = Array.isArray(r.min) ? r.min : [], med = A => { if (!A.length) return null; const S = A.slice().sort((a, b) => a - b); return S[Math.floor(S.length / 2)]; };
  const first = M[0] || null, last = M.length > 1 ? M[M.length - 1] : null;
  return { p50: med(M.map(m => m[2])), p95: med(M.map(m => m[3])), max: M.reduce((a, m) => Math.max(a, m[4] || 0), 0), n100: M.reduce((a, m) => a + (m[5] || 0), 0), spd: M.length ? Math.min(...M.map(m => m[6])) : null,
    first95: first ? first[3] : null, last95: last ? last[3] : null, mins: M.length }; }
function lineOf(r, i) { const s = sumRun(r), t = r.t || {}, kind = r.pg === 'school' ? '학교' : String(r.pg || '').startsWith('town:') ? '마을' : String(r.pg || '').replace(/^game:/, '놀이 ');
  const L = [(i != null ? (i + 1) + ') ' : '') + hm(r.at) + ' ' + kind + ' ' + Math.round((r.len || 0) / 60) + '분'];
  const rdy = t.rdy != null ? t.rdy : t.ff; if (rdy != null) L.push('첫 조작 ' + rdy + '초');
  if (r.bms) L.push('짓기 ' + r1(r.bms / 1000) + '초' + (t.net != null ? '(받기 끝 ' + t.net + '초)' : ''));
  if (s.p50 != null) L.push('프레임 중앙 ' + s.p50 + 'ms · 느린 5% ' + s.p95 + 'ms' + (s.last95 != null ? '(첫 1분 ' + s.first95 + ' → 끝 1분 ' + s.last95 + ')' : '') + ' · 가장 긴 ' + s.max + 'ms · 100ms 넘음 ' + s.n100 + '번 · 게임 속도 ' + s.spd + '%');
  if (r.gm || r.dpr) L.push((r.gm ? r.gm + ' · ' : '') + '해상도 ' + (r.dpr || '?') + (r.lv ? ' · 단계 ' + r.lv : ''));
  if (r.ctx && (r.ctx[0] || r.ctx[1])) L.push('문맥 잃음 ' + r.ctx[0] + '(이 탭 10분 ' + r.ctx[1] + ')');
  if (r.err && r.err[0]) L.push('오류 ' + r.err[0] + '번(첫: ' + r.err[1] + ')');
  if (r.disc) L.push('메모리로 버려졌다 다시 열림');
  if (r.mem) L.push('힙 ' + r.mem[0] + 'MB(참고)');
  L.push('끝: ' + (ENDK[r.end] || r.end));
  return L.join(' · '); }

export function createDiag(o) {
  const canvas = o.canvas, env = o.env;   /* env() = { renderer, GFX, FM, ADAPT, TIMING } — 학교 짓는 중(main.js 위쪽 await)에 부르면 아직 선언 전일 수 있어 늘 try */
  const T0 = Date.now(), id = (T0 % 1e9).toString(36) + Math.random().toString(36).slice(2, 5), q = new URLSearchParams(location.search);
  let prev = readRing();
  const nav = (() => { try { const e = performance.getEntriesByType('navigation')[0]; return e ? e.type : ''; } catch (e) { return ''; } })();
  const okName = s => /^[a-z0-9_-]{1,24}$/i.test(s || '');
  const pg = q.get('town') ? 'town:' + (okName(q.get('town')) ? q.get('town') : '?') : q.get('game') ? 'game:' + (okName(q.get('game')) ? q.get('game') : '?') : q.get('tour') === '1' ? 'tour' : 'school';
  const sw = ['ti', 'q8', 'g3', 'sg8', 'g3fl', 'dpr', 'hq', 'lq', 'aa', 'adapt', 'bench', 'tifail'].filter(k => q.has(k)).map(k => k + '=' + String(q.get(k)).slice(0, 6)).join('&');   /* 성능 스위치만(반 코드·번호·이름 X) */
  try { if (performance.setResourceTimingBufferSize) performance.setResourceTimingBufferSize(600); } catch (e) { /* */ }   /* 마을 모듈 114개 + 학교 = 기본 250칸이 차면 받기 끝 시각을 못 읽음 */
  const R = { v: V, id, at: T0, pg, sw, nav, disc: !!document.wasDiscarded, hw: null, mode: '', gm: '', t: { ff: null, rdy: null, in1: null, net: null, b0: null, b1: null }, bms: null, nres: 0,
    min: [], fm: [], ad: [], dpr: null, lv: 0, ctx: [0, 0], err: [0, ''], safe: null, st: null, mem: null, len: 0, end: 'open', n: 0 };
  // ---- 프레임(그린 프레임마다 · 숫자만 · 새 객체 X) ----
  const FB = new Float32Array(9000); let fn = 0, fmx = 0, n100 = 0, fgame = 0, freal = 0, lastTs = 0, mStart = 0, hidAt = 0, bld = 0;
  function frame(ts, rd, dt) {
    if (window.SM_BUILD > 0) { bld = 1; lastTs = 0; return; }   /* 짓는 동안은 짓기 ms로 따로(90ms 쉼 프레임은 기기 탓이 아님) */
    if (bld) { bld = 0; setTimeout(built, 2500); }   /* 깃발이 내려간 뒤 SM_TOWN.load가 붙을 때까지 */
    if (!ts || window.SM_HOLD3D > 0) { lastTs = 0; return; }   /* 견학 영상 창 = 3D 쉼(250ms) */
    if (!lastTs || lastTs < hidAt) { lastTs = ts; if (!mStart) mStart = ts; return; }   /* 탭 숨김에서 돌아온 첫 프레임은 간격에 안 넣음 */
    const g = ts - lastTs; lastTs = ts;
    if (fn < FB.length) FB[fn++] = g; if (g > fmx) fmx = g; if (g > 100) n100++;
    if (rd < 1) { freal += rd; fgame += dt; }
    if (ts - mStart >= 60000) roll(ts);
  }
  function roll(ts) { const n = fn;
    if (n >= 20) { const S = FB.subarray(0, n).sort(), p = k => S[Math.min(n - 1, Math.floor(n * k))]; let E = null; try { E = env(); } catch (e) { E = null; }
      R.min.push([Math.round((Date.now() - T0) / 60000), n, r1(p(0.5)), r1(p(0.95)), Math.round(fmx), n100, freal > 0 ? Math.round(fgame / freal * 100) : 100, E ? E.GFX.dpr : null, E ? E.FM.lv : 0]);
      if (R.min.length > MINS) R.min.splice(1, 1); }   /* 첫 1분은 남김(처음 ↔ 끝 견주기 · 열·메모리로 느려지는지) */
    fn = 0; fmx = 0; n100 = 0; fgame = freal = 0; mStart = ts; }
  // ---- 시각 ----
  const in1 = () => { if (R.t.in1 == null) R.t.in1 = sec(performance.now()); removeEventListener('keydown', in1, true); removeEventListener('pointerdown', in1, true); };
  addEventListener('keydown', in1, { capture: true, passive: true }); addEventListener('pointerdown', in1, { capture: true, passive: true });
  function built() { const T = window.SM_TOWN, now = performance.now(); if (!T || !T.load || !(T.load.ms > 0)) return;
    R.bms = Math.round(T.load.ms); R.t.b1 = sec(now - 2500); R.t.b0 = sec(now - 2500 - T.load.ms);
    R.t.rdy = sec(window.SM_T_RDY > 0 && window.SM_T_RDY < now ? window.SM_T_RDY : now - 2500);   /* 첫 조작 = 짓는 덮개 단추가 눌리는 때(OPT-G1 ②) · 덮개 단추가 없는 판은 다 지은 때 */
    try { const E = performance.getEntriesByType('resource'); let mx = 0; for (const e of E) if (/\/games\//.test(e.name) && e.responseEnd > mx) mx = e.responseEnd; R.t.net = sec(mx); R.nres = E.length; } catch (e) { /* */ }
    save('build'); }
  // ---- 채우기·쓰기 ----
  function fill(why) { R.end = why; R.len = Math.round((Date.now() - T0) / 1000);
    let E = null; try { E = env(); } catch (e) { E = null; }
    if (E) { const { GFX, FM, ADAPT, renderer, TIMING } = E;
      if (!R.hw) { const [os, br] = osBr(); R.hw = { c: navigator.hardwareConcurrency || 0, m: navigator.deviceMemory || 0, gpu: gpuName(renderer), os, br, w: innerWidth, h: innerHeight, dev: Math.round((window.devicePixelRatio || 1) * 100) / 100 }; }
      R.mode = GFX.mode; R.gm = FM.mode + (FM.on ? (FM.q ? '30' : '60') : ''); R.dpr = GFX.dpr; R.lv = FM.lv; R.fm = FM.log.slice(-10); R.ad = ADAPT.log.slice(-10);
      if (TIMING && TIMING.firstFrameMs) R.t.ff = sec(TIMING.firstFrameMs); }
    try { R.ctx[1] = JSON.parse(sessionStorage.getItem('sm-ctxlost') || '[]').filter(t => Date.now() - t < 600000).length; } catch (e) { /* */ }
    try { R.safe = JSON.parse(localStorage.getItem('sm-gfx-safe') || 'null'); } catch (e) { R.safe = null; }
    try { const T = window.SM_TOWN, G = T && T.game && T.game(); if (G && G.st) R.st = { n: G.st.n, ms: Math.round(G.st.ms || 0), max: Math.round(G.st.max || 0), len: G.st.len }; } catch (e) { /* */ }
    try { const m = performance.memory; if (m) R.mem = [Math.round(m.usedJSHeapSize / 1048576), Math.round(m.totalJSHeapSize / 1048576), Math.round(m.jsHeapSizeLimit / 1048576)]; } catch (e) { /* */ }
  }
  let lastW = 0, hidW = 0, gone = false;   /* gone = pagehide를 씀(그 뒤 오는 visibilitychange 'hid'가 '닫음'을 덮지 않게 — 크롬 차례 = pagehide → visibilitychange) */
  function save(why) { const now = performance.now();
    if (gone && why !== 'hide') return;
    if (why === 'hid') { if (now - hidW < 30000) return; hidW = now; } else if (why !== 'hide' && why !== 'ctx' && now - lastW < 2000) return;
    lastW = now; R.n++;
    try { fill(why); const L = readRing().filter(x => x.id !== id); L.push(R); while (L.length > RING) L.shift();
      try { localStorage.setItem(KEY, JSON.stringify(L)); } catch (e) { try { localStorage.removeItem(KEY); localStorage.setItem(KEY, JSON.stringify([R])); } catch (e2) { try { localStorage.removeItem(KEY); } catch (e3) { /* */ } } }   /* 가득 참 = 지난 판을 버리고 이번 판만 · 그래도 안 되면 기록을 비움(아이 저장 몫을 먹지 않게) */
    } catch (e) { /* 사파리 사생활 모드 */ } }
  document.addEventListener('visibilitychange', () => { hidAt = performance.now(); if (document.hidden) save('hid'); });
  addEventListener('pagehide', () => { save('hide'); gone = true; }); addEventListener('pageshow', e => { if (e && e.persisted) gone = false; });   /* 뒤로 가기 캐시에서 돌아오면 다시 */
  if (canvas) canvas.addEventListener('webglcontextlost', () => { R.ctx[0]++; save('ctx'); }, false);
  const onErr = e => { R.err[0]++; if (R.err[0] === 1) { const m = e && (e.message || (e.reason && (e.reason.message || String(e.reason)))) || '?'; R.err[1] = String(m).slice(0, 90); save('err'); } };   /* 화면이 얼어붙음(루프 예외) = 첫 오류 글 한 줄(코드 글 · 이름 X) + 수 */
  addEventListener('error', onErr); addEventListener('unhandledrejection', onErr);
  setInterval(() => save('5m'), 300000);
  // ---- 읽기(SD.diag) ----
  function get() { fill('look');
    const runs = readRing().filter(x => x.id !== id), last = runs.length ? runs[runs.length - 1] : null;
    const crashes = runs.filter(r => CRASH.has(r.end) || r.end === 'ctx' || (r.ctx && r.ctx[0])).map(r => ({ at: hm(r.at), pg: r.pg, why: ENDK[r.end] || r.end, len: r.len, mem: r.mem ? r.mem[0] : null, ctx: r.ctx ? r.ctx[0] : 0, err: r.err ? r.err[1] : '' }));
    if (R.disc) crashes.push({ at: hm(R.at), pg: R.pg, why: '앞 판이 메모리 부족으로 버려짐(이번 판이 다시 연 것)', len: 0, mem: null, ctx: 0 });
    let town = []; try { town = (JSON.parse(localStorage.getItem('sm-town-stuck') || '[]') || []).slice(-10); } catch (e) { town = []; }
    const SD2 = window.SD2, school = SD2 && SD2.map && SD2.map.stuckLog ? SD2.map.stuckLog.slice(-10) : [];
    return { now: { ...R, sum: sumRun(R) }, last: last ? { ...last, sum: sumRun(last) } : null, runs: runs.map((r, i) => lineOf(r, i)), crashes, stuck: { school, town }, line: lineOf(R) }; }
  function text() { fill('look'); const runs = readRing().filter(x => x.id !== id).concat([R]), hw = R.hw || {};
    const head = '📒 화면 기록(이 기기) · ' + hm(Date.now()) + ' · ' + runs.length + '판\n기기: ' + [hw.os, hw.br, hw.c ? hw.c + '코어' : '', hw.m ? hw.m + 'GB' : '', hw.gpu, (hw.w || '') + '×' + (hw.h || '') + ' ×' + (hw.dev || 1), R.mode].filter(Boolean).join(' · ');
    return head + '\n' + runs.map((r, i) => lineOf(r, i)).join('\n') + '\n---\n' + JSON.stringify(runs); }
  function clear() { prev = []; try { localStorage.removeItem(KEY); localStorage.removeItem('sm-town-stuck'); } catch (e) { /* */ } const SD2 = window.SD2; if (SD2 && SD2.map && SD2.map.stuckLog) SD2.map.stuckLog.length = 0; R.min.length = 0; R.disc = false; R.ctx[0] = 0; return '📒 기록을 비웠어요(이번 판은 다음 쓰기부터 다시 쌓여요)'; }
  return { frame, boot: () => setTimeout(() => save('start'), 2000), get, text, clear, save, R, prevN: () => prev.length };
}
