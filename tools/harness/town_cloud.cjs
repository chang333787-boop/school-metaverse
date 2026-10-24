// 이어 하기(SAVE-CF · 10-24) 시험: node tools/harness/town_cloud.cjs [포트=8002] [반코드=zz+임의]
//   기기 A(새 브라우저 저장소): v4 번호 3 + 비밀번호 1234 두 번 → 돈·날을 바꿈 → 창을 떠남(올림) · 기기 B(빈 저장소): 3 + 1234 한 번 → 서버 것을 이어 받나
//   틀린 비밀번호 = 들어가지 못함 · 끝나면 시험 판을 지움(zz)
const { chromium } = require('./pw.cjs');   /* FAST-1: 기본 그리기 끔(norender) · 사진·프레임은 --render(docs/systems/town_gates.md) */
const PORT = process.argv[2] || '8002', CLS = process.argv[3] || 'zz' + Math.random().toString(36).slice(2, 6), CF = 'https://sm-rooms.sm-rooms.workers.dev';
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--disable-renderer-backgrounding'] }); const errs = [], R = {};
  const U = 'http://127.0.0.1:' + PORT + '/v2/?town=ourtown&login=1&adapt=0&cls=' + CLS;
  const login = async (p, pins) => { await p.waitForSelector('button[data-n="3"]', { timeout: 120000 }); await p.click('button[data-n="3"]'); for (const pin of pins) { for (const d of pin) await p.click('button[data-p="' + d + '"]'); await p.waitForTimeout(1500); } };
  const A = await (await b.newContext()).newPage(); A.on('pageerror', e => errs.push('A ' + e.message.slice(0, 150)));
  await A.goto(U); await login(A, ['1234', '1234']); await A.waitForFunction(() => window.SM_TOWN && SM_TOWN.game, null, { timeout: 180000 }); await A.waitForTimeout(2000);
  R.a = await A.evaluate(() => { const G = SM_TOWN.game(); G.S.money = 4321; G.S.day = 5; G.mark(); G.flush(); return { money: G.S.money, day: G.S.day }; });
  await A.goto('about:blank'); await A.waitForTimeout(2500);   /* pagehide → 올림 */
  const B = await (await b.newContext()).newPage(); B.on('pageerror', e => errs.push('B ' + e.message.slice(0, 150)));
  await B.goto(U); await login(B, ['9999']); R.badMsg = await B.evaluate(() => document.body.innerText.includes('다른 컴퓨터에서 정한 비밀번호와 달라요'));
  for (const d of '1234') await B.click('button[data-p="' + d + '"]'); await B.waitForFunction(() => window.SM_TOWN && SM_TOWN.game, null, { timeout: 180000 }); await B.waitForTimeout(1500);
  R.b = await B.evaluate(() => { const G = SM_TOWN.game(); return { money: G.S.money, day: G.S.day }; });
  R.cleanup = await B.evaluate(async ([cf, c]) => { const r = await fetch(cf + '/drop/' + c + '/3', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ pin: '1234' }) }); return r.status + ' ' + await r.text(); }, [CF, CLS]);
  const ok = R.b.money === 4321 && R.b.day === 5 && R.badMsg && !errs.length; console.log(JSON.stringify({ cls: CLS, ...R, errs }, null, 1)); console.log(ok ? 'PASS' : 'FAIL'); await b.close(); process.exit(ok ? 0 : 1); })();
