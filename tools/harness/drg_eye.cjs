// 드래곤 눈높이 점검(goal §9-8 · 팀 G): node tools/harness/drg_eye.cjs [repo=.] [--ch=0,1,...] [--out=<폴더>] [--diffs=easy,normal] [--wait=2]
//   도전 차례마다 ?ch=N&step=I&diff= 시작 2초 뒤 화면 사진(jpg) + 화면 글(지금 할 일 · 하는 법 줄 · 말풍선 · F 표시 수) + 장 파일의 hints 1·2 → <out>/eye.json
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '.');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : d; };
const CHS = arg('ch', '0,1,2,3,4,5,6,7,8,9,10,11').split(',').map(Number), OUT = path.resolve(arg('out', '/tmp/drg_eye')), DIFFS = arg('diffs', 'easy,normal').split(','), WAIT = +arg('wait', 2), ONLY = arg('only', '');
fs.mkdirSync(OUT, { recursive: true });
const types = { '.js': 'text/javascript', '.html': 'text/html', '.glb': 'model/gltf-binary', '.png': 'image/png', '.json': 'application/json' };
const srv = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]), p = path.join(root, u, u.endsWith('/') ? 'index.html' : ''); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); r.end(d); }); });
srv.listen(0, async () => {
  const base = 'http://127.0.0.1:' + srv.address().port;
  const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } });
  const p = await ctx.newPage(); let errs = [];
  p.on('pageerror', e => errs.push(e.message.slice(0, 200)));
  const V = (fs.readFileSync(path.join(root, 'dragon/index.html'), 'utf8').match(/main\.js\?v=(\d+)/) || [])[1];
  const all = [];
  for (const ch of CHS) {
    await p.goto(`${base}/dragon/?ch=${ch}&step=0&diff=normal&chain=0&seed=1&mode=smooth`);
    await p.waitForFunction(() => window.DRG && DRG.sense && DRG.sense() && DRG.sense().id, null, { timeout: 90000 });
    const steps = await p.evaluate(async ({ ch, V }) => (await import('/dragon/js/story/ch' + ch + '.js?v=' + V)).chapter.steps.map(s => ({ id: s.id || '', verb: s.verb || '', howtoVerb: s.howtoVerb || '', easy: s.easy, goal: s.goal || '', h1: s.hints ? s.hints[1] || '' : '', h2: s.hints ? s.hints[2] || '' : '' })), { ch, V });
    for (let i = 0; i < steps.length; i++) {
      const st = steps[i]; if (!st.verb && st.id !== '0-0') continue; if (ONLY && !ONLY.split(',').includes(st.id)) continue;
      for (const diff of DIFFS) {
        if (diff === 'easy' && st.easy === false) { all.push(Object.assign({ diff, skip: '쉬움 책 쪽' }, st)); continue; }
        errs = [];
        await p.goto(`${base}/dragon/?ch=${ch}&step=${i}&diff=${diff}&chain=0&seed=1&mode=smooth`);
        await p.waitForFunction(() => window.DRG && DRG.sense && DRG.sense() && DRG.sense().id && !DRG.sense().busy, null, { timeout: 90000 });
        await p.waitForTimeout(WAIT * 1000);
        const scr = await p.evaluate(() => {
          const q = (s) => document.querySelector(s), vis = (el) => el && !el.classList.contains('gone') && !el.classList.contains('off') && !el.classList.contains('hide');
          const howto = vis(q('#howto')) ? [...document.querySelectorAll('#howto .row')].map(r => r.querySelector('.w').textContent) : [];
          const bub = vis(q('#bubble')) ? (q('#bubble .nm').textContent + '|' + q('#bubble .tx').textContent + '|ic' + document.querySelectorAll('#bubble .ic svg').length) : '';
          const fk = [...document.querySelectorAll('#fks .fk')].filter(d => d.style.display !== 'none').length;
          return { goalNow: vis(q('#goal')) ? q('#goal').textContent : '', howto, bub, fk, hint: vis(q('#hint')) ? q('#hint').textContent : '', log: (window.DRG_HUDLOG || []) };
        });
        const file = `${st.id}_${diff}.jpg`;
        await p.screenshot({ path: path.join(OUT, file), type: 'jpeg', quality: 60 });
        const row = Object.assign({ diff, file, errs: errs.slice(0, 2) }, st, scr);
        all.push(row); console.log(JSON.stringify(row));
      }
    }
  }
  fs.writeFileSync(path.join(OUT, 'eye.json'), JSON.stringify(all, null, 1));
  await b.close(); srv.close();
});
