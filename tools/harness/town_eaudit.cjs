// E 자리 전수 검사(POLISH-1 · 10-24 최종 차례 4 '완성도'): node tools/harness/town_eaudit.cjs [마을=ourtown] [포트=8002]
//   모든 E(게임 지점)가 벽 속·땅 속·떠 있음·가까운 길에서 걸어서 못 닿음이 아닌지 · 일꾼 몸이 벽 속이 아닌지 — 실패 0이어야 PASS
const { chromium } = require('./pw.cjs');   /* FAST-1: 기본 그리기 끔(norender) · 사진·프레임은 --render(docs/systems/town_gates.md) */
const ID = process.argv[2] || 'ourtown', PORT = process.argv[3] || '8002';
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--disable-renderer-backgrounding'] }); const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message.slice(0, 200)));
  await p.goto('http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0'); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.eAudit, null, { timeout: 120000 }); await p.waitForTimeout(6000);
  await p.evaluate(() => { const b = document.querySelector('.twn-p button'); if (b) b.click(); });
  const R = await p.evaluate(() => SM_TOWN.eAudit());
  console.log(JSON.stringify({ ...R, errs }, null, 1)); const ok = !R.bad && !R.wkBad && !errs.length; console.log(ok ? 'PASS' : 'FAIL'); await b.close(); process.exit(ok ? 0 : 1); })();
