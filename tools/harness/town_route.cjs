// 길 안내 빨간 선 시험(ROUTE-2 · 이야기 팀 10-18 '2-1 빨간 선이 마트 뒤에서 건물을 뚫고 문으로'): node tools/harness/town_route.cjs [마을=ourtown] [포트=8002]
//   장소 문 → 다른 장소 문 길(guide route)을 0.5m마다 짚어 몸이 못 지나가는 곳(map.q.blocked · 양옆 0.6m도 막힘 = 뚫음)이 2m 넘게 이어지면 셈 · 양 끝 1.5m(문 자리)는 뺌 · 0이어야 통과
const { chromium } = require('playwright');
const ID = process.argv[2] || 'ourtown', PORT = process.argv[3] || '8002', URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }); let bad = 0;
  try { const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(), errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160)));
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.routePts, null, { timeout: 240000 }); await p.waitForTimeout(2500);
    const R = await p.evaluate(() => { const M = SD2.map, P = SM_TOWN.places().filter(q => q.door), out = [], n = P.length, step = Math.max(1, Math.round(n / 9));
      for (let i = 0; i < n; i++) { const A = P[i], B = P[(i + step) % n]; if (!SM_TOWN.path(A.door, B.door, B.name)) continue; const pts = SM_TOWN.routePts(); SM_TOWN.pathOff(); if (!pts || pts.length < 2) continue; let L = 0; const seg = []; for (let k = 1; k < pts.length; k++) { const l = Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]); seg.push(l); L += l; }
        let s = 0, hits = [], run = 0, worst = 0, seg9 = ''; for (let k = 1; k < pts.length; k++) { const l = seg[k - 1]; for (let t = 0; t < l; t += 0.5) { const d = s + t; if (d < 1.5 || d > L - 1.5) continue; const x = pts[k - 1][0] + (pts[k][0] - pts[k - 1][0]) * t / l, z = pts[k - 1][1] + (pts[k][1] - pts[k - 1][1]) * t / l, y = M.q.groundAt(x, z, SM_TOWN.ground(x, z) + 4), nx = -(pts[k][1] - pts[k - 1][1]) / l * 0.6, nz = (pts[k][0] - pts[k - 1][0]) / l * 0.6, bk = (x9, z9) => M.q.blocked(x9, z9, M.q.groundAt(x9, z9, SM_TOWN.ground(x9, z9) + 4) + 0.05); if (M.q.blocked(x, z, y + 0.05) && bk(x + nx, z + nz) && bk(x - nx, z - nz)) {   /* 양옆 0.6m도 막혀야 = 뚫음(벽을 스치는 길은 셈 X) */ run += 0.5; if (run > worst) { worst = run; hits = [+x.toFixed(1), +z.toFixed(1)]; seg9 = k === 1 ? '첫 토막' : k === pts.length - 1 ? '끝 토막' : '가운데 ' + k + '/' + (pts.length - 1); } } else run = 0; } s += l; }
        if (worst >= 2) out.push({ from: A.name, to: B.name, len: Math.round(L), wall: worst, at: hits, seg: seg9 }); }
      return { n, out }; });
    console.log('길 ' + R.n + '개 확인'); for (const o of R.out.sort((a, c) => c.wall - a.wall)) console.log('  ✗ ' + o.from + ' → ' + o.to + ' (' + o.len + 'm) · 몸이 못 지나가는 곳 ' + o.wall + 'm 연속 @ ' + o.at.join(',') + ' · ' + o.seg);
    bad = R.out.length; if (errs.length) { console.log('  ✗ 페이지 오류 ' + errs.join(' | ')); bad++; }
  } finally { await b.close(); }
  console.log(bad ? 'FAIL ' + bad : 'PASS'); process.exit(bad ? 1 : 0); })();
