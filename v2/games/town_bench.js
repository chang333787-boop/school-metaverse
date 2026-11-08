// 🧪 크롬북 한 줄 성능(BENCH-1 · 10-31 '진짜 시험' — 아이들 크롬북에서 잰 숫자가 0개라서): 마을 주소 끝에 &bench=1
//   town.js가 ?bench=1일 때만 불러옴(없으면 이 파일은 읽히지도 않음) · 시험 판 = 따로 열쇠(<마을>#bench) · 읽기만 → 아이 저장을 건드리지 않음
//   다 지으면 첫 화면을 닫고(처음부터) → 정해진 길을 저절로 걸음(우리 집 앞 → 행정복지센터 문까지 길 따라 · 60초면 약 250m · 다른 마을 = 장소 셋)
//   PERF-G(11-08 토론 판정 1 · 예전 판은 2코어에서 30 잠금이 걸린 채 재서 '30fps = 괜찮다'로 잘못 읽힘) — 판 여섯 = 약 3분 30초:
//     ① 자동 60초(아이가 겪는 그대로 · 30 잠금·자동 해상도·단계 · 그 사이 FM·ADAPT 기록을 시각과 함께)
//     ②~⑤ 잠금 끔(SD2.fmLock) 배율 1 → 0.5 → 1 → 0.5 각 20초(같은 길 처음부터 · 배율 0.5가 크게 빠르면 채움(화소) 병목 · 같으면 정점·CPU 병목 = 미해결 '사다리 차례'의 근거)
//     ⑥ 자동 60초(①과 같은 길 · 처음 1분 ↔ 마지막 1분 하위 5% = 열·메모리로 느려지는지) · 힙은 크롬이 뭉개 알려 '참고'로만
//   끝에 「🌲 나무 예전 길로 한 번 더」 = 같은 주소 + &ti=0(PERF-E 나무 셰이더 비용 · 미해결 판정) → 두 판을 한 줄에 견줌
//   → 화면 위에 한 줄: 짓기 초 · 하위 5% fps · 가장 긴 프레임 · 힙 MB · 그리기 수 · 걸은 거리 · 화면 모드 · 기기(UA 짧게 · 코어 · 메모리 · GPU) · 해상도 · 마을 판 번호 + 「복사」 단추
//   프레임 = 실제로 그린 프레임 사이 시간(renderer.info.render.frame이 바뀐 rAF의 시각 차 — 30fps 모드도 그린 것만 셈) · 매 프레임 새 객체 X(미리 잡은 배열에 씀)
//   걷기 = 길(routeXY)을 걷기 전에 다 구해 둠(재는 동안 길 찾기 렉이 섞이지 않게) · 걸리면 옆으로 반 걸음 · 창이 뜨면 닫음 · 키를 누르면 사람 입력이 먼저(엔진 규칙)
import { gpuName, osBr } from '../js/diag.js?v=4';   /* PERF-G: GPU 이름·기기 줄은 현장 기록과 같은 함수 */
const ROUTES = { ourtown: { start: [-38.3, 133], to: [[8.7, 631.4]] } };   /* 10-31 ourtown 첫 아침 자리 → 행정복지센터 문(길 한 줄 · 중간 목표를 문으로 두면 문 앞에서 멈춤) */
const SPEED = 4.2, MAXF = 16000, SETTLE = 1.5;   /* SETTLE = 처음 자리로 옮긴 뒤 재지 않고 쉬는 초(순간이동·배율 바꿈 멈칫을 빼려고) */
const PH = [{ k: 'a1', s: 60 }, { k: 'd1', s: 20, dpr: 1 }, { k: 'd5', s: 20, dpr: 0.5 }, { k: 'd1', s: 20, dpr: 1 }, { k: 'd5', s: 20, dpr: 0.5 }, { k: 'a2', s: 60 }];
const PREVK = 'sm-bench-prev';   /* 나무 예전 길 견줌 = 이 탭 sessionStorage에 앞 판 숫자 */

export function runBench(o) {
  const map = o.map, id = o.id || '', T = window.SM_TOWN, SD2 = window.SD2, R = SD2 && SD2.renderer;
  if (!T || !R || !map) return;
  const tOpen = performance.now(), en = (document.documentElement.lang || '').startsWith('en');
  const alive = () => window.SM_TOWN === T;
  const box = document.createElement('div');
  box.style.cssText = 'position:fixed;left:50%;top:10px;transform:translateX(-50%);z-index:99999;max-width:min(980px,calc(100vw - 32px));background:#fff8ea;color:#2b2420;border:3px solid #2b2420;border-radius:10px;box-shadow:0 3px 0 #2b2420;padding:8px 10px;font:600 14px/1.45 system-ui,sans-serif;display:flex;gap:8px;align-items:flex-start;flex-wrap:wrap';
  const tx = document.createElement('div'); tx.style.cssText = 'flex:1 1 320px;min-width:0;word-break:keep-all;overflow-wrap:anywhere;user-select:text;-webkit-user-select:text';
  tx.textContent = en ? '🧪 Getting ready to measure…' : '🧪 성능 잴 준비 중이에요…'; box.appendChild(tx); document.body.appendChild(box);
  const say = s => { tx.textContent = s; };
  /* 1) 첫 화면 닫기(= 처음부터 · 시험 판은 저장이 없음) */
  let tries = 0; const shut = () => { const b = document.querySelector('.twn-ld [data-a="x"]'); if (b && !b.disabled) { b.click(); return true; } return !document.querySelector('.twn-ld'); };
  const wait1 = () => { if (!alive()) return; if (shut() || ++tries > 40) setTimeout(prep, 1500); else setTimeout(wait1, 250); };
  setTimeout(wait1, 300);
  /* 2) 길 미리 구하기 */
  function prep() { if (!alive()) return;
    const cfg = ROUTES[id], me = map.player.get(); let start = [me.x, me.z], to;
    if (cfg) { start = cfg.start; to = cfg.to; if (Math.hypot(me.x - start[0], me.z - start[1]) > 3) { map.player.teleport([start[0], T.ground(start[0], start[1]) + 0.3, start[1]]); } }
    else { const P = (T.places ? T.places() : []).filter(q => q && q.door && !/school/.test(q.kind || '')); to = P.slice(0, 3).map(q => [q.door[0], q.door[1]]); }
    const pts = []; let a = start;
    for (const b of to || []) { let L = null; try { const r = T.routeXY(a, b); L = r && r.ok && r.pts && r.pts.length ? r.pts.map(v => [v[0], v[1]]) : null; } catch (e) { L = null; } for (const q of (L || [b])) pts.push(q); a = b; }
    if (!pts.length) pts.push([start[0] + 200, start[1]]);
    setTimeout(() => go(pts), 600); }
  /* 3) 걷기 + 재기 — 판 여섯(PH) · 판마다 다른 칸(ph)에 프레임 간격을 씀 · 매 프레임 새 객체 X(미리 잡은 배열) */
  function go(pts) { if (!alive()) return;
    const dts = new Float32Array(MAXF), dcs = new Uint16Array(MAXF), phs = new Uint8Array(MAXF), cpu = new Float32Array(PH.length), logs = PH.map(() => null), secsOf = new Float32Array(PH.length);
    let n = 0, k = 0, lastF = -1, lastTs = 0, heap = 0, j = 0, sideT = 0, sideN = 0, stuckT = 0, chkT = 0, chkX = 0, chkZ = 0, prevX = 0, prevZ = 0, dist = 0, pan = 0, sayT = -1, done = false;
    let pi = 0, pT0 = 0, rec = false, pS0 = 0, el = 0, locked = false, dpr0 = 0;
    const mem = () => (performance.memory && performance.memory.usedJSHeapSize) || 0, FM = SD2.gfx.fm, AD = SD2.gfx.auto, TOT = PH.reduce((a, P) => a + P.s, 0);
    const toStart = () => { const st = pts[0]; map.player.steer(null); map.player.teleport([st[0], T.ground(st[0], st[1]) + 0.3, st[1]]); j = 0; stuckT = 0; sideT = 0; chkT = 0; const q = map.player.get(); prevX = chkX = q.x; prevZ = chkZ = q.z; };
    function phaseIn(ts) { const P = PH[pi];   /* 판 시작: 자리·잠금·배율 맞추고 SETTLE초 쉼 */
      if (P.dpr) { if (!dpr0) dpr0 = SD2.gfx.dpr; if (!locked) locked = SD2.fmLock ? SD2.fmLock(true) : false; if (SD2.setDpr) SD2.setDpr(P.dpr); }
      else unlock();
      if (pi > 0) toStart(); pT0 = ts; rec = false; }
    function phaseRec(ts) { rec = true; pS0 = ts; lastF = R.info.render.frame; lastTs = ts; logs[pi] = performance.now() / 1000; if (SD2.timing && SD2.timing.reset) SD2.timing.reset(); }
    function phaseOut(ts) { secsOf[pi] = (ts - pS0) / 1000; if (SD2.timing) cpu[pi] = +SD2.timing.frameCpuP50 || 0;
      const t0 = logs[pi]; if (!PH[pi].dpr) logs[pi] = { t0, fm: FM.log.filter(e => e[0] >= t0 - 0.05), ad: AD.log.filter(e => (e[0] === 'cap' ? e[2] : e[0]) >= t0 - 0.05) }; else logs[pi] = null; }
    const unlock = () => { if (locked) { SD2.fmLock(false); locked = false; } else if (dpr0 && SD2.setDpr) SD2.setDpr(dpr0); dpr0 = 0; };   /* 시험 주소(잠금 없음)도 배율은 되돌림 */
    const p0 = map.player.get(); prevX = chkX = p0.x; prevZ = chkZ = p0.z;
    function frame(ts) { if (done) return; if (!alive()) { done = true; map.player.steer(null); unlock(); box.remove(); return; }
      if (!pT0) phaseIn(ts);
      if (!rec) { if ((ts - pT0) / 1000 < SETTLE) { requestAnimationFrame(frame); return; } phaseRec(ts); }
      const f = R.info.render.frame; if (f !== lastF) { const dt = ts - lastTs; if (lastF >= 0 && n < MAXF && dt > 0) { dts[n] = dt; dcs[n] = Math.min(65535, R.info.render.calls); phs[n] = pi; n++; } lastF = f; lastTs = ts; }
      el = (ts - pS0) / 1000; const q = map.player.get(), mv = Math.hypot(q.x - prevX, q.z - prevZ); if (mv < 5) dist += mv; prevX = q.x; prevZ = q.z;
      if ((++k & 31) === 0) { const h = mem(); if (h > heap) heap = h;   /* 힙·창은 32 rAF마다 한 번(재는 일이 프레임을 먹지 않게) */
        if (document.querySelector('.twn-dlg')) { pan++; const b = document.querySelector('.twn-dlg button, .twn-dlg'); if (b && b.click) b.click(); }
        else { const b = document.querySelector('.twn-p:not(.twn-ld) [data-a="x"]'); if (b) { pan++; b.click(); } } }
      /* 걸음: 다음 점 쪽으로 · 1초에 0.4m도 못 가면 옆으로 0.5초 · 6초 넘게 못 가면 다음 점 */
      while (j < pts.length - 1 && Math.hypot(pts[j][0] - q.x, pts[j][1] - q.z) < 1.6) j++;
      const tg = pts[Math.min(j, pts.length - 1)]; let dx = tg[0] - q.x, dz = tg[1] - q.z; const dd = Math.hypot(dx, dz) || 1;
      if (el - chkT > 1) { if (Math.hypot(q.x - chkX, q.z - chkZ) < 0.4) { stuckT += el - chkT; sideT = el + 0.5; sideN++; if (stuckT > 3 && j < pts.length - 1) { j++; stuckT = 0; } } else stuckT = 0; chkT = el; chkX = q.x; chkZ = q.z; }
      if (el < sideT) { const s = sideN % 2 ? 1 : -1; const nx = -dz / dd * s + dx / dd * 0.2, nz = dx / dd * s + dz / dd * 0.2; dx = nx; dz = nz; }
      if (j >= pts.length - 1 && dd < 1.6) map.player.steer(null); else map.player.steer(dx, dz, SPEED, true);
      let tot = Math.min(PH[pi].s, el); for (let i = 0; i < pi; i++) tot += PH[i].s;
      if ((tot | 0) !== sayT) { sayT = tot | 0; say((en ? '🧪 Measuring ' : '🧪 성능 재는 중 ') + (pi + 1) + '/' + PH.length + ' — ' + Math.floor(tot) + ' / ' + TOT + (en ? ' s · please don’t touch' : '초 · 손대지 말고 기다려요')); }
      if (el >= PH[pi].s) { phaseOut(ts); pi++; pT0 = 0;
        if (pi >= PH.length) { done = true; map.player.steer(null); unlock(); const h = mem(); if (h > heap) heap = h; finish(dts.subarray(0, n), dcs.subarray(0, n), phs.subarray(0, n), secsOf, cpu, logs, heap, h, dist, pan, sideN); return; } }
      requestAnimationFrame(frame); }
    requestAnimationFrame(frame); }
  /* 4) 한 줄 */
  function finish(dts, dcs, phs, secsOf, cpu, logs, heap, heapEnd, dist, pan, stuck) {
    const pct = (A, p) => A.length ? A[Math.min(A.length - 1, Math.floor(A.length * p))] : 0, r1 = x => Math.round(x * 10) / 10;
    const st = keys => { const A = [], C = []; let secs = 0; keys.forEach(i => { secs += secsOf[i]; }); for (let i = 0; i < dts.length; i++) if (keys.includes(phs[i])) { A.push(dts[i]); C.push(dcs[i]); } A.sort((a, b) => a - b); C.sort((a, b) => a - b);
      const p50 = pct(A, 0.5), p95 = pct(A, 0.95); return { n: A.length, secs: r1(secs), avg: r1(A.length / Math.max(1, secs)), fps50: p50 > 0 ? r1(1000 / p50) : 0, low5: p95 > 0 ? r1(1000 / p95) : 0, p50: r1(p50), p95: r1(p95), max: Math.round(A.length ? A[A.length - 1] : 0), dc: pct(C, 0.5), dcMax: C.length ? C[C.length - 1] : 0, cpu: r1(keys.reduce((a, i) => a + cpu[i], 0) / keys.length) }; };
    const idx = k => PH.map((P, i) => (P.k === k ? i : -1)).filter(i => i >= 0);
    const A1 = st(idx('a1')), A2 = st(idx('a2')), D1 = st(idx('d1')), D5 = st(idx('d5')), ALL = st(PH.map((_, i) => i));
    const ratio = D1.fps50 > 0 ? D5.fps50 / D1.fps50 : 0;
    const bott = D1.fps50 >= 57 ? (en ? 'headroom (60 at ×1)' : '여유(배율 1도 60)') : ratio >= 1.5 ? (en ? 'fill-bound (pixels)' : '채움(화소) 병목') : ratio <= 1.15 ? (en ? 'vertex/CPU-bound' : '정점·CPU 병목') : (en ? 'mixed' : '섞임');
    const lg = L => { if (!L) return ''; const out = []; for (const e of L.ad) out.push(e[0] === 'cap' ? Math.round(e[2] - L.t0) + (en ? 's res-lock' : '초 해상도 잠금') : Math.round(e[0] - L.t0) + (en ? 's res ' : '초 해상도 ') + e[1]); for (const e of L.fm) out.push(Math.round(e[0] - L.t0) + (en ? 's ' : '초 ') + (e[1] === 'down' ? '↓' + e[2] : e[1] === 'up' ? '↑' + e[2] : e[1] === 'nohelp' ? (en ? 'undo ' : '되돌림 ') + e[2] : e[1] + ' ' + e[2])); return out.length ? out.join(', ') : (en ? 'none' : '없음'); };
    const ld = (T.load && T.load.ms) || 0, pf = SD2.perf ? SD2.perf() : {}, gl = R.getContext && R.getContext(), gpu = gpuName(R), [os, br] = osBr();
    const dev = [os, br, navigator.hardwareConcurrency ? navigator.hardwareConcurrency + (en ? ' cores' : '코어') : '', navigator.deviceMemory ? navigator.deviceMemory + 'GB' : '', gpu].filter(Boolean).join(' ');
    const dpr = Math.round((window.devicePixelRatio || 1) * 100) / 100, bw = gl ? gl.drawingBufferWidth : 0, bh = gl ? gl.drawingBufferHeight : 0;
    const v = (String(o.url || '').match(/[?&]v=(\d+)/) || [])[1] || '', ti0 = /[?&]ti=0/.test(location.search);
    let prev = null; try { prev = JSON.parse(sessionStorage.getItem(PREVK) || 'null'); } catch (e) { prev = null; }
    const cmp = ti0 && prev && !prev.ti0 ? (en ? 'vs new trees: auto low5% ' + prev.a1 + '→' + A1.low5 + ' · ×1 median ' + prev.d1 + '→' + D1.fps50 + 'fps' : '나무 새 길 견줌: 자동 하위5% ' + prev.a1 + '→' + A1.low5 + ' · 배율1 중앙 ' + prev.d1 + '→' + D1.fps50 + 'fps') : '';
    const line = (en
      ? ['🧪 build ' + r1(ld / 1000) + 's (open ' + r1(tOpen / 1000) + 's)' + (ti0 ? ' · OLD TREES ti=0' : ''), 'auto low5% ' + A1.low5 + 'fps (avg ' + A1.avg + ') first min → last min ' + A2.low5 + 'fps (avg ' + A2.avg + ')', 'auto log [' + lg(logs[0]) + ']', 'unlocked ×1 median ' + D1.fps50 + 'fps low5% ' + D1.low5 + ' · ×0.5 median ' + D5.fps50 + 'fps low5% ' + D5.low5 + ' → ' + bott + ' · cpu ' + D1.cpu + 'ms', 'longest ' + ALL.max + 'ms', 'draws ' + ALL.dc + ' (max ' + ALL.dcMax + ')', 'walked ' + Math.round(dist) + 'm', 'mode ' + (pf.mode || '?') + '·' + (pf.gfxMode || '?') + ' ×' + (pf.dpr || '?'), dev, innerWidth + '×' + innerHeight + ' ×' + dpr + ' (draw ' + bw + '×' + bh + ')', 'heap ' + (heapEnd ? Math.round(heapEnd / 1048576) + 'MB (ref only)' : '?'), 'town v' + v + (pan ? ' · panels ' + pan : ''), cmp]
      : ['🧪 짓기 ' + r1(ld / 1000) + '초(열기부터 ' + r1(tOpen / 1000) + '초)' + (ti0 ? ' · 나무 예전 길(ti=0)' : ''), '자동 하위5% ' + A1.low5 + 'fps(평균 ' + A1.avg + ') 처음 1분 → 마지막 1분 ' + A2.low5 + 'fps(평균 ' + A2.avg + ')', '자동 단계 기록 [' + lg(logs[0]) + ']', '잠금 끔 배율1 중앙 ' + D1.fps50 + 'fps 하위5% ' + D1.low5 + ' · 배율0.5 중앙 ' + D5.fps50 + 'fps 하위5% ' + D5.low5 + ' → ' + bott + ' · CPU ' + D1.cpu + 'ms', '가장 긴 프레임 ' + ALL.max + 'ms', '그리기 ' + ALL.dc + '(최대 ' + ALL.dcMax + ')', '걸음 ' + Math.round(dist) + 'm', '모드 ' + (pf.mode || '?') + '·' + (pf.gfxMode || '?') + ' ×' + (pf.dpr || '?'), dev, innerWidth + '×' + innerHeight + ' ×' + dpr + '(그림 ' + bw + '×' + bh + ')', '힙 ' + (heapEnd ? Math.round(heapEnd / 1048576) + 'MB(참고)' : '?'), '마을 v' + v + (pan ? ' · 닫은 창 ' + pan : ''), cmp]).filter(Boolean).join(' · ');
    window.SM_BENCH = { line, data: { buildMs: ld, openMs: Math.round(tOpen), a1: A1, a2: A2, d1: D1, d5: D5, all: ALL, ratio: r1(ratio * 100) / 100, bott, logs: logs.map(L => L && { fm: L.fm, ad: L.ad }), ti0, cmp, heapMB: heapEnd ? Math.round(heapEnd / 1048576) : null, heapMaxMB: heap ? Math.round(heap / 1048576) : null, stuck, frames: dts.length, walked: Math.round(dist), panels: pan, mode: pf.mode, target: pf.target, gfx: pf.gfxMode, dev, ua: navigator.userAgent, gpu, w: innerWidth, h: innerHeight, dpr, bw, bh, v } };
    try { if (!ti0) sessionStorage.setItem(PREVK, JSON.stringify({ a1: A1.low5, d1: D1.fps50, ti0 })); } catch (e) { /* */ }
    console.log('🧪 BENCH ' + line);
    say(line);
    const btn = (t, f) => { const b = document.createElement('button'); b.textContent = t; b.style.cssText = 'flex:none;font:700 14px system-ui,sans-serif;padding:6px 12px;border:3px solid #2b2420;border-radius:9px;background:#ffe7a3;color:#2b2420;box-shadow:0 3px 0 #2b2420;cursor:pointer;min-height:40px'; b.onclick = f; box.appendChild(b); return b; };
    const cp = btn(en ? '📋 Copy' : '📋 복사', () => { const okd = () => { cp.textContent = en ? 'Copied' : '복사했어요'; };
      const old = () => { try { const ta = document.createElement('textarea'); ta.value = line; ta.style.cssText = 'position:fixed;left:-9999px;top:0'; document.body.appendChild(ta); ta.select(); const r = document.execCommand('copy'); ta.remove(); if (r) { okd(); return; } } catch (e) { /* 아래로 */ } const s = getSelection(), rg = document.createRange(); rg.selectNodeContents(tx); s.removeAllRanges(); s.addRange(rg); cp.textContent = en ? 'Selected — press Ctrl+C' : '골랐어요 — Ctrl+C'; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(line).then(okd, old); else old(); });
    if (!ti0) btn(en ? '🌲 Again with old trees' : '🌲 나무 예전 길로 한 번 더', () => { const u = new URL(location.href); u.searchParams.set('ti', '0'); location.href = u.toString(); });
    btn(en ? 'Close' : '닫기', () => box.remove());
  }
}
