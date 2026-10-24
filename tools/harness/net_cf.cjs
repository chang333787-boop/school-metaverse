// 함께하기 실시간(NET-CF2 · 10-24) 시험: node tools/harness/net_cf.cjs [포트=8002] [방서버=http://127.0.0.1:8788]
//   두 화면 A(움직임 · 반지름 20m 원)·B(가만히) — Firebase는 가짜 · 자리는 방 서버로만 → B가 본 A의 자리가 A의 실제 자리와 얼마나 가까운지(지연·흔들림) · 끊긴 프레임
//   방 서버 = wrangler dev(로컬) 또는 배포 주소(?cf= 로 넘김 · 로컬만 받음 → 배포 주소는 net.js 기본값을 씀: 'deploy')
const { chromium } = require('playwright');
const PORT = process.argv[2] || '8002', CF = process.argv[3] || 'http://127.0.0.1:8788';
(async () => { const b = await chromium.launch({ args: ['--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }); const ctx = await b.newContext(); const r = Math.random().toString(36).slice(2, 5);
  const cfq = CF === 'deploy' ? '' : '&cf=' + encodeURIComponent(CF), U = (me, peer, mv) => 'http://127.0.0.1:' + PORT + '/tools/harness/net_cf.html?me=' + me + '&peer=' + peer + '&r=' + r + '&move=' + mv + cfq;
  const A = await ctx.newPage(), B = await ctx.newPage(); const errs = []; for (const p of [A, B]) p.on('pageerror', e => errs.push(e.message));
  await A.goto(U('aaaa' + r, 'bbbb' + r, 1)); await B.goto(U('bbbb' + r, 'aaaa' + r, 0)); await A.waitForTimeout(12000);
  const cfA = await A.evaluate(() => window.N.cf), cfB = await B.evaluate(() => window.N.cf), L = await B.evaluate(() => window.LOG.slice(-600));
  // A의 실제 자리(같은 식) 대 B가 그린 자리 → 몇 ms 늦은 자리와 가장 가까운가(지연 어림) · 오차
  const P = (ms, tA) => { const t = ms / 1000; return [Math.sin(t * 0.8) * 20, Math.cos(t * 0.8) * 20]; };
  const t0 = await A.evaluate(() => performance.timeOrigin), good = L.filter(q => q[1] === q[1]);
  let best = null; for (let lag = 0; lag <= 600; lag += 10) { let e = 0; for (const [now, x, z] of good) { const tA = now - t0 - lag, q = [Math.sin(tA / 1000 * 0.8) * 20, Math.cos(tA / 1000 * 0.8) * 20]; e += Math.hypot(q[0] - x, q[1] - z); } e /= Math.max(1, good.length); if (!best || e < best.e) best = { lag, e: +e.toFixed(3) }; }
  let jump = 0; for (let i = 1; i < good.length; i++) if (Math.hypot(good[i][1] - good[i - 1][1], good[i][2] - good[i - 1][2]) > 1.2) jump++;
  const out = { A: cfA, B: cfB, seen: good.length + '/' + L.length, lagMs: best && best.lag, errM: best && best.e, jumps: jump, errs };
  console.log(JSON.stringify(out, null, 1)); const ok = cfA.ok && cfB.ok && good.length > L.length * 0.9 && best.lag <= 300 && best.e < 0.6 && jump === 0 && !errs.length; console.log(ok ? 'PASS' : 'FAIL'); await b.close(); process.exit(ok ? 0 : 1); })();
