// 🌀 태풍·폭염 동안에도 이야기 줄이 그대로(TYSIDE-1 · 사용자 11-02 '태풍 예보 때문에 메인퀘가 갑자기 사라져서 애들이 당황할 듯')
//   ① 이야기 하는 중 태풍 예보 → 할 일 줄 = 📖 이야기 그대로 · 그 밑 🌀 단추(겹치지 않음)  ② 🌀 단추 = 태풍 수첩 열림
//   ③ 이야기가 없으면 할 일 줄 = 🌀 태풍 줄(예전대로) · 밑 단추 없음  ④ 휴대폰 세로도 겹침 X · 페이지 오류 0
const { chromium, devices } = require('./pw.cjs');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const SHOTS = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8) || null, BASE = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
async function run(b, ctxOpt, tag) {
  const ctx = await b.newContext(ctxOpt), p = await ctx.newPage(), errs = [];
  p.on('pageerror', e => errs.push(e.message.slice(0, 200)));
  const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
  const shot = async n => { if (!SHOTS) return; await W8(250); await p.screenshot({ path: SHOTS + '/' + tag + '_' + n + '.png' }); console.log('    📷 ' + SHOTS + '/' + tag + '_' + n + '.png'); };
  await p.goto(BASE); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.storyAt && SM_TOWN.typhoon, null, { timeout: 240000 }); await W8(2500);
  let closeAll = async () => { for (let i = 0; i < 10; i++) { const n = await ev(() => { const g = [...document.querySelectorAll('button')].find(q => q.offsetParent && /처음부터|이어서 하기|이어 하기/.test(q.textContent)); if (g) { g.click(); return 1; } const d = document.querySelector('.twn-dlg .dbox'); if (d) { d.click(); return 1; } const x = document.querySelector('.twn-p .x, .twn-p [data-close]'); if (x) { x.click(); return 1; } return 0; }); if (!n) break; await W8(300); } };
  await closeAll(); await W8(1500); await closeAll(); await ev(() => { const G = SM_TOWN.game(); if (G.setClock) G.setClock(false); G.S.clock = false; G.S.min = 9 * 60; G.S.story = G.S.story || {}; G.S.story.done = Object.assign(G.S.story.done || {}, { p0: 1, a1_1: 1 }); G.S.story.p0auto = 1; G.S.jobs = G.S.jobs || {}; G.S.jobs.fireNo = G.S.day; if (G.S.emerg) { G.S.emerg.d = G.S.day; G.S.emerg.plan = []; } SM_TOWN.rules.wx('clear'); });
  ok(await ev(() => SM_TOWN.storyAt('c3', 1)), tag + ' 이야기 장 열기(텃밭 거두기)'); await W8(1500); await closeAll();
  await ev(() => SM_TOWN.typhoon.start()); await W8(1800); await closeAll(); await W8(1500);
  const R = await ev(() => { const t = document.querySelector('.twn-task'), y = document.querySelector('.twn-tyb'); const rt = t && t.getBoundingClientRect(), ry = y && y.style.display !== 'none' ? y.getBoundingClientRect() : null; return { task: t ? t.textContent : '', ty: ry ? y.textContent : '', tb: rt ? rt.bottom : 0, yt: ry ? ry.top : 0, yh: ry ? ry.height : 0, line: SM_TOWN.typhoon.info().line }; });
  console.log('    할 일 줄:', R.task.slice(0, 60), '| 밑 단추:', R.ty.slice(0, 50), '| 태풍 줄:', R.line);
  ok(/^📖/.test(R.task), tag + ' 태풍 예보 중에도 할 일 줄 = 📖 이야기');
  ok(/🌀/.test(R.ty), tag + ' 그 밑에 🌀 태풍 단추');
  ok(R.yt >= R.tb - 0.5 && R.yh > 20, tag + ' 단추가 할 일 줄과 안 겹침(' + Math.round(R.tb) + ' → ' + Math.round(R.yt) + ')');
  await shot('story');
  await ev(() => document.querySelector('.twn-tyb').click()); await W8(800);
  ok(await ev(() => !!document.querySelector('.twn-p') && /태풍/.test(document.querySelector('.twn-p').innerText)), tag + ' 🌀 단추 = 태풍 수첩 열림');
  await shot('note'); await closeAll(); await p.keyboard.press('Escape'); await W8(400);
  await ev(() => SM_TOWN.storyOff()); await W8(1500);
  const R2 = await ev(() => { const t = document.querySelector('.twn-task'), y = document.querySelector('.twn-tyb'); return { task: t ? t.textContent : '', ty: y && y.style.display !== 'none' ? y.textContent : '' }; });
  ok(/🌀/.test(R2.task) && !R2.ty, tag + ' 이야기가 없으면 할 일 줄 = 🌀 태풍(밑 단추 없음 · ' + R2.task.slice(0, 30) + ')');
  ok(errs.length === 0, tag + ' 페이지 오류 0' + (errs.length ? ' — ' + errs.join(' / ') : ''));
  await ctx.close();
}
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  try { await run(b, { viewport: { width: 1366, height: 768 } }, 'pc'); await run(b, { ...devices['iPhone 13'] }, 'phone'); } finally { await b.close(); }
  console.log(fails.length ? 'TYSIDE FAIL ' + fails.length : 'TYSIDE PASS'); process.exit(fails.length ? 1 : 0);
})();
