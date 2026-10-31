// 🧪 크롬북 한 줄 성능(BENCH-1 · 10-31 '진짜 시험' — 아이들 크롬북에서 잰 숫자가 0개라서): 마을 주소 끝에 &bench=1
//   town.js가 ?bench=1일 때만 불러옴(없으면 이 파일은 읽히지도 않음) · 시험 판 = 따로 열쇠(<마을>#bench) · 읽기만 → 아이 저장을 건드리지 않음
//   다 지으면 첫 화면을 닫고(처음부터) → 정해진 길을 60초 동안 저절로 걸음(우리 집 앞 → 행정복지센터 문까지 길 따라 · 60초면 약 250m · 다른 마을 = 장소 셋)
//   → 화면 위에 한 줄: 짓기 초 · 하위 5% fps · 가장 긴 프레임 · 힙 MB · 그리기 수 · 걸은 거리 · 화면 모드 · 기기(UA 짧게 · 코어 · 메모리 · GPU) · 해상도 · 마을 판 번호 + 「복사」 단추
//   프레임 = 실제로 그린 프레임 사이 시간(renderer.info.render.frame이 바뀐 rAF의 시각 차 — 30fps 모드도 그린 것만 셈) · 매 프레임 새 객체 X(미리 잡은 배열에 씀)
//   걷기 = 길(routeXY)을 걷기 전에 다 구해 둠(재는 동안 길 찾기 렉이 섞이지 않게) · 걸리면 옆으로 반 걸음 · 창이 뜨면 닫음 · 키를 누르면 사람 입력이 먼저(엔진 규칙)
const ROUTES = { ourtown: { start: [-38.3, 133], to: [[8.7, 631.4]] } };   /* 10-31 ourtown 첫 아침 자리 → 행정복지센터 문(길 한 줄 · 중간 목표를 문으로 두면 문 앞에서 멈춤) */
const WALK_S = 60, SPEED = 4.2, MAXF = 8000;

/* GPU 이름 짧게: 'ANGLE (Intel, Mesa Intel(R) UHD Graphics 600 (GLK 2), OpenGL ES 3.2)' → 'Intel UHD Graphics 600 (GLK 2)' · 'ANGLE (Apple, ANGLE Metal Renderer: Apple M5, Unspecified Version)' → 'Apple M5' */
function gpuShort(s) { s = String(s || ''); const m = s.match(/^ANGLE \((.*)\)$/);
  if (m) { const seg = []; let d = 0, cur = ''; for (const ch of m[1]) { if (ch === '(') d++; if (ch === ')') d--; if (ch === ',' && d === 0) { seg.push(cur.trim()); cur = ''; } else cur += ch; } seg.push(cur.trim()); s = seg[1] || seg[0] || ''; }
  const v = s.match(/^Vulkan [\d.]+ \((.*)\)$/); if (v) s = v[1];
  return s.replace(/ANGLE Metal Renderer:\s*/, '').replace(/\s*\(0x[0-9a-f]+\)/ig, '').replace(/\s*Direct3D.*$/, '').replace(/^Mesa\s+/, '').replace(/\((R|TM)\)/g, '').replace(/\s+/g, ' ').trim().slice(0, 40); }

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
  /* 3) 걷기 + 재기 */
  function go(pts) { if (!alive()) return;
    const dts = new Float32Array(MAXF), dcs = new Uint16Array(MAXF); let n = 0, k = 0, lastF = -1, lastTs = 0, maxDt = 0, heap = 0, t0 = 0, j = 0, sideT = 0, sideN = 0, stuckT = 0, chkT = 0, chkX = 0, chkZ = 0, prevX = 0, prevZ = 0, dist = 0, pan = 0, sayT = -1, done = false;
    const mem = () => (performance.memory && performance.memory.usedJSHeapSize) || 0;
    const p0 = map.player.get(); prevX = chkX = p0.x; prevZ = chkZ = p0.z;
    function frame(ts) { if (done) return; if (!alive()) { done = true; map.player.steer(null); box.remove(); return; }
      if (!t0) { t0 = ts; lastTs = ts; lastF = R.info.render.frame; }
      const f = R.info.render.frame; if (f !== lastF) { const dt = ts - lastTs; if (lastF >= 0 && n < MAXF && dt > 0) { dts[n] = dt; dcs[n] = Math.min(65535, R.info.render.calls); n++; if (dt > maxDt) maxDt = dt; } lastF = f; lastTs = ts; }
      const el = (ts - t0) / 1000, q = map.player.get(), mv = Math.hypot(q.x - prevX, q.z - prevZ); if (mv < 5) dist += mv; prevX = q.x; prevZ = q.z;
      if ((++k & 31) === 0) { const h = mem(); if (h > heap) heap = h;   /* 힙·창은 32 rAF마다 한 번(재는 일이 프레임을 먹지 않게) */
        if (document.querySelector('.twn-dlg')) { pan++; const b = document.querySelector('.twn-dlg button, .twn-dlg'); if (b && b.click) b.click(); }
        else { const b = document.querySelector('.twn-p:not(.twn-ld) [data-a="x"]'); if (b) { pan++; b.click(); } } }
      /* 걸음: 다음 점 쪽으로 · 1초에 0.4m도 못 가면 옆으로 0.5초 · 6초 넘게 못 가면 다음 점 */
      while (j < pts.length - 1 && Math.hypot(pts[j][0] - q.x, pts[j][1] - q.z) < 1.6) j++;
      const tg = pts[Math.min(j, pts.length - 1)]; let dx = tg[0] - q.x, dz = tg[1] - q.z; const dd = Math.hypot(dx, dz) || 1;
      if (el - chkT > 1) { if (Math.hypot(q.x - chkX, q.z - chkZ) < 0.4) { stuckT += el - chkT; sideT = el + 0.5; sideN++; if (stuckT > 3 && j < pts.length - 1) { j++; stuckT = 0; } } else stuckT = 0; chkT = el; chkX = q.x; chkZ = q.z; }
      if (el < sideT) { const s = sideN % 2 ? 1 : -1; const nx = -dz / dd * s + dx / dd * 0.2, nz = dx / dd * s + dz / dd * 0.2; dx = nx; dz = nz; }
      if (j >= pts.length - 1 && dd < 1.6) map.player.steer(null); else map.player.steer(dx, dz, SPEED, true);
      if ((el | 0) !== sayT) { sayT = el | 0; say((en ? '🧪 Measuring — ' : '🧪 성능 재는 중 — ') + Math.min(WALK_S, Math.floor(el)) + ' / ' + WALK_S + (en ? ' s · please don’t touch' : '초 · 손대지 말고 기다려요')); }
      if (el >= WALK_S) { done = true; map.player.steer(null); const h = mem(); if (h > heap) heap = h; finish(dts.subarray(0, n), dcs.subarray(0, n), maxDt, heap, h, dist, pan, el, sideN); return; }
      requestAnimationFrame(frame); }
    requestAnimationFrame(frame); }
  /* 4) 한 줄 */
  function finish(dts, dcs, maxDt, heap, heapEnd, dist, pan, secs, stuck) {
    const sd = Array.from(dts).sort((a, b) => a - b), sc = Array.from(dcs).sort((a, b) => a - b), pct = (A, p) => A.length ? A[Math.min(A.length - 1, Math.floor(A.length * p))] : 0;
    const p95 = pct(sd, 0.95), low5 = p95 > 0 ? 1000 / p95 : 0, avg = sd.length / Math.max(1, secs);
    const ld = (T.load && T.load.ms) || 0, pf = SD2.perf ? SD2.perf() : {}, gl = R.getContext && R.getContext();
    let gpu = ''; try { const x = gl && gl.getExtension('WEBGL_debug_renderer_info'); gpu = x ? String(gl.getParameter(x.UNMASKED_RENDERER_WEBGL) || '') : ''; } catch (e) { gpu = ''; }
    gpu = gpuShort(gpu);
    const ua = navigator.userAgent, os = /CrOS\s+(\S+)/.test(ua) ? 'CrOS ' + ua.match(/CrOS\s+(\S+)/)[1] : /Windows NT [\d.]+/.test(ua) ? ua.match(/Windows NT [\d.]+/)[0] : /Mac OS X/.test(ua) ? 'Mac' : /Android [\d.]+/.test(ua) ? ua.match(/Android [\d.]+/)[0] : /iPhone|iPad/.test(ua) ? 'iOS' : /Linux/.test(ua) ? 'Linux' : 'etc';
    const br = (ua.match(/(Edg|Chrome|Firefox|Version)\/(\d+)/) || []).slice(1, 3).join(' ').replace(/^Version/, 'Safari');
    const dev = [os, br, navigator.hardwareConcurrency ? navigator.hardwareConcurrency + (en ? ' cores' : '코어') : '', navigator.deviceMemory ? navigator.deviceMemory + 'GB' : '', gpu].filter(Boolean).join(' ');
    const dpr = Math.round((window.devicePixelRatio || 1) * 100) / 100, bw = gl ? gl.drawingBufferWidth : 0, bh = gl ? gl.drawingBufferHeight : 0;
    const v = (String(o.url || '').match(/[?&]v=(\d+)/) || [])[1] || '';
    const r1 = x => Math.round(x * 10) / 10;
    const line = (en
      ? ['🧪 build ' + r1(ld / 1000) + 's (open ' + r1(tOpen / 1000) + 's)', 'low 5% ' + Math.round(low5) + 'fps (avg ' + Math.round(avg) + ')', 'longest ' + Math.round(maxDt) + 'ms', 'heap ' + (heap ? Math.round(heapEnd / 1048576) + '/' + Math.round(heap / 1048576) + 'MB' : '?'), 'draws ' + pct(sc, 0.5) + ' (max ' + (sc.length ? sc[sc.length - 1] : 0) + ')', 'walked ' + Math.round(dist) + 'm', 'mode ' + (pf.target || '?') + '·' + (pf.gfxMode || '?'), dev, innerWidth + '×' + innerHeight + ' ×' + dpr + ' (draw ' + bw + '×' + bh + ')', 'town v' + v + (pan ? ' · panels ' + pan : '')]
      : ['🧪 짓기 ' + r1(ld / 1000) + '초(열기부터 ' + r1(tOpen / 1000) + '초)', '하위5% ' + Math.round(low5) + 'fps(평균 ' + Math.round(avg) + ')', '가장 긴 프레임 ' + Math.round(maxDt) + 'ms', '힙 ' + (heap ? Math.round(heapEnd / 1048576) + '/' + Math.round(heap / 1048576) + 'MB(끝/최대)' : '?'), '그리기 ' + pct(sc, 0.5) + '(최대 ' + (sc.length ? sc[sc.length - 1] : 0) + ')', '걸음 ' + Math.round(dist) + 'm', '모드 ' + (pf.target || '?') + '·' + (pf.gfxMode || '?'), dev, innerWidth + '×' + innerHeight + ' ×' + dpr + '(그림 ' + bw + '×' + bh + ')', '마을 v' + v + (pan ? ' · 닫은 창 ' + pan : '')]).join(' · ');
    window.SM_BENCH = { line, data: { buildMs: ld, openMs: Math.round(tOpen), low5: r1(low5), avg: r1(avg), p95: r1(p95), maxDt: Math.round(maxDt), heapMB: heapEnd ? Math.round(heapEnd / 1048576) : null, heapMaxMB: heap ? Math.round(heap / 1048576) : null, stuck, dcMed: pct(sc, 0.5), dcMax: sc.length ? sc[sc.length - 1] : 0, frames: sd.length, secs: r1(secs), walked: Math.round(dist), panels: pan, mode: pf.mode, target: pf.target, gfx: pf.gfxMode, dev, ua, gpu, w: innerWidth, h: innerHeight, dpr, bw, bh, v } };
    console.log('🧪 BENCH ' + line);
    say(line);
    const btn = (t, f) => { const b = document.createElement('button'); b.textContent = t; b.style.cssText = 'flex:none;font:700 14px system-ui,sans-serif;padding:6px 12px;border:3px solid #2b2420;border-radius:9px;background:#ffe7a3;color:#2b2420;box-shadow:0 3px 0 #2b2420;cursor:pointer;min-height:40px'; b.onclick = f; box.appendChild(b); return b; };
    const cp = btn(en ? '📋 Copy' : '📋 복사', () => { const okd = () => { cp.textContent = en ? 'Copied' : '복사했어요'; };
      const old = () => { try { const ta = document.createElement('textarea'); ta.value = line; ta.style.cssText = 'position:fixed;left:-9999px;top:0'; document.body.appendChild(ta); ta.select(); const r = document.execCommand('copy'); ta.remove(); if (r) { okd(); return; } } catch (e) { /* 아래로 */ } const s = getSelection(), rg = document.createRange(); rg.selectNodeContents(tx); s.removeAllRanges(); s.addRange(rg); cp.textContent = en ? 'Selected — press Ctrl+C' : '골랐어요 — Ctrl+C'; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(line).then(okd, old); else old(); });
    btn(en ? 'Close' : '닫기', () => box.remove());
  }
}
