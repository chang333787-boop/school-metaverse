// usage: [PAGE=/] node check.cjs [repoDir] [--full]   (PAGE 기본 /v2/ · PAGE=/ = 홍보판)
//   GATE-2(10-31 '진짜 시험'): 기준선보다 나빠지면 exit 1 — 예전엔 무엇이 찍히든 exit 0이었음
//   기준선(BASE) = 감사 0 · 도달 전 구역(112 이상) · 점프 옥상 0 · 문 간섭 0(문 65 이상) · 지도 계약 0 · 빠른 검진 10/10 · 전체 검진 17/17 · 페이지 오류 0
//   홍보판(PAGE=/)만 예외 하나: 전체 검진 '한 화면 삼각형(구역 닻)'(1학년 닻 15.5만 · 예전부터) = 156000까지는 기준선 · 넘으면 실패
//   학교 맵을 일부러 바꿔 구역·문 수가 줄었으면 아래 BASE 숫자도 같이 고친다
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = process.argv[2] || '/home/user/school-metaverse';
const full = process.argv.includes('--full');
const PROMO = (process.env.PAGE || '/v2/') === '/';
const BASE = { zones: 112, doors: 65, quick: 10, full: 17, allowFail: PROMO ? { '한 화면 삼각형(구역 닻)': 156000 } : {} };
const types = {'.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.json':'application/json'};
const srv = http.createServer((q, r) => { const p = path.join(root, decodeURIComponent(q.url.split('?')[0])); const u = q.url.split('?')[0]; fs.readFile(u.endsWith('/') ? path.join(p, 'index.html') : p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, {'Content-Type': types[path.extname(u.endsWith('/') ? 'x.html' : p)] || 'application/octet-stream'}); r.end(d); }); });
const bad = [], keep = [], errs = [];
srv.listen(0, async () => {
  const port = srv.address().port;
  let b = null;
  try {
    b = await chromium.launch({ args: process.env.SWGL ? ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] : ['--use-gl=angle','--enable-gpu','--ignore-gpu-blocklist'] });   /* GPU-1(교사 10-16 'gpu 써야 할 때 좀 쓰라고'): 기본 = GPU(맥 Metal · 윈도 D3D) · SWGL=1 = 예전 소프트웨어(SwiftShader — 맥 860% 열) */
    const pg = await b.newPage({ viewport: { width: 960, height: 540 } });
    const lines = [];
    pg.on('console', m => { const t = m.text(); lines.push(t); if (!/THREE\.|GPU stall|WebGL/.test(t)) console.log('[c]', t.slice(0, 400)); });
    pg.on('pageerror', e => { errs.push(e.message); console.log('[ERR]', e.message); });
    await pg.goto('http://localhost:' + port + (process.env.PAGE || '/v2/') + '?check=1');   /* PAGE=/ = 홍보판(루트 index.html) */
    const t0 = Date.now();
    while (Date.now() - t0 < 240000) { if (lines.some(l => /🩺/.test(l) && /빠른|quick|\/10|통과/.test(l))) break;
      if (errs.length && Date.now() - t0 > 20000 && !(await pg.evaluate(() => !!window.SD2).catch(() => false))) break;   /* 페이지가 오류로 멈춰 SD2가 없으면 240초를 다 기다리지 않음 */
      await new Promise(r => setTimeout(r, 1000)); }
    await new Promise(r => setTimeout(r, 1500));
    // ── 판정(GATE-2) ──
    const has = re => lines.find(l => re.test(l));
    if (!has(/헌법③ 감사: 동일평면 겹침 0/) || has(/헌법③ 위반/)) bad.push('헌법③ 감사 0 아님');
    { const m = (has(/✅ 도달성: 전 구역 \d+곳 통과/) || '').match(/전 구역 (\d+)곳/); if (!m || has(/🚫 도달 불가/)) bad.push('도달 불가 있음'); else if (+m[1] < BASE.zones) bad.push('도달 구역 ' + m[1] + ' < 기준선 ' + BASE.zones); else keep.push('도달 ' + m[1]); }
    if (!has(/✅ 점프로 옥상 도달 0/)) bad.push('점프로 옥상 도달');
    { const m = (has(/✅ 문 경로 간섭 0 \(문 \d+개\)/) || '').match(/문 (\d+)개/); if (!m || has(/🚪 문 경로 간섭/)) bad.push('문 경로 간섭'); else if (+m[1] < BASE.doors) bad.push('문 ' + m[1] + ' < 기준선 ' + BASE.doors); else keep.push('문 ' + m[1]); }
    if (!has(/✅ 지도 계약 0/) || has(/🚫 지도 계약/)) bad.push('지도 계약');
    { const m = (has(/🩺 맵 건강 검진\(빠른\): 게이트 \d+\/\d+/) || '').match(/게이트 (\d+)\/(\d+)/); if (!m) bad.push('빠른 검진 줄 없음'); else if (m[1] !== m[2] || +m[2] < BASE.quick) bad.push('빠른 검진 ' + m[1] + '/' + m[2]); else keep.push('빠른 ' + m[1] + '/' + m[2]); }
    if (has(/🩺 검진 실패/)) bad.push('검진 예외');
    if (full) {
      const R = await pg.evaluate(() => window.SD2.health().then(r => ({ c: JSON.stringify(r.counts || r).slice(0, 800), g: r.gates || {} })));
      console.log('FULL', R.c);
      const gs = Object.entries(R.g), fl = gs.filter(([, g]) => !g.pass), old = [];
      for (const [n, g] of fl) { const lim = BASE.allowFail[n]; if (lim != null && g.value <= lim) old.push(n + ' ' + g.value); else bad.push('전체 검진 ' + n + ' ' + g.value + '>' + g.limit); }
      if (gs.length < BASE.full) bad.push('전체 검진 게이트 수 ' + gs.length + ' < ' + BASE.full);
      keep.push('전체 ' + (gs.length - fl.length) + '/' + gs.length + (old.length ? '(예전부터: ' + old.join(' · ') + ')' : ''));
    }
    const tm = await pg.evaluate(() => JSON.stringify(window.SD2 && window.SD2.timing)); console.log('TIMING', tm);
  } catch (e) { bad.push('예외 ' + String(e && e.message || e).split('\n')[0].slice(0, 160)); }
  if (errs.length) bad.push('페이지 오류 ' + errs.length + ' — ' + errs[0].split('\n')[0].slice(0, 120));
  if (b) await b.close().catch(() => {}); srv.close();
  console.log(bad.length ? 'CHECK FAIL ' + bad.length + ' (' + (PROMO ? '홍보판' : 'v2') + ') — ' + bad.join(' · ') : 'CHECK PASS (' + (PROMO ? '홍보판' : 'v2') + ') — 감사 0 · ' + keep.join(' · '));
  process.exit(bad.length ? 1 : 0);
});
