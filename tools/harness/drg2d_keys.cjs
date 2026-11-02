// 드래곤 2D판 키 점검: node tools/harness/drg2d_keys.cjs [repo=.]
//   한글 입력기가 켜진 크롬북처럼 key = 'ㅌ'·'Process'(keyCode 229)로 와도 e.code로 먹히는지 · Space = 쓰기/대화 넘기기 · X = 차례 동작(점프 · 꾹 살금살금) · 누르고 있으면 대화가 한 칸만 넘어가는지
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '.');
const types = { '.js': 'text/javascript', '.html': 'text/html' };
const srv = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]), p = path.join(root, u, u.endsWith('/') ? 'index.html' : ''); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); r.end(d); }); });
srv.listen(0, async () => {
  const base = 'http://127.0.0.1:' + srv.address().port, out = [];
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
  const ime = (type, code, key) => p.evaluate(([type, code, key]) => window.dispatchEvent(new KeyboardEvent(type, { code, key, keyCode: 229, bubbles: true, cancelable: true })), [type, code, key]);
  const open = async (ch, st) => { await p.goto(`${base}/dragon2d/?ch=${ch}&step=${st}&chain=0&card=0&seed=1`); await p.waitForFunction(() => window.DRG2 && DRG2.sense().id, null, { timeout: 30000 }); await p.waitForTimeout(300); };
  // ① 1-1 처음 대화: Space를 누른 채 1초 → 한 칸만 넘어감 · 떼고 다시 누르면 다음 칸
  await open(1, 0);
  const d0 = await p.evaluate(() => DRG2.sense().dialog);
  await ime('keydown', 'Space', ' '); await p.waitForTimeout(1000);
  const d1 = await p.evaluate(() => DRG2.sense().dialog);
  await ime('keyup', 'Space', ' '); await p.waitForTimeout(150); await ime('keydown', 'Space', ' '); await p.waitForTimeout(120); await ime('keyup', 'Space', ' '); await p.waitForTimeout(150);
  const d2 = await p.evaluate(() => DRG2.sense().dialog);
  out.push(['Space 누른 채 = 한 칸만', d0 && d1 && d0 !== d1 && d1 !== d2 ? '✓' : '✗', [d0, d1, d2].map((s) => (s || '').slice(0, 14)).join(' → ')]);
  // ② 1-3(점프 차례): 한글 입력 중인 X(key 'ㅌ') → 점프
  await open(1, 2);
  for (let i = 0; i < 12 && await p.evaluate(() => !!DRG2.sense().dialog); i++) { await ime('keydown', 'Enter', 'Enter'); await p.waitForTimeout(120); await ime('keyup', 'Enter', 'Enter'); await p.waitForTimeout(120); }
  await ime('keydown', 'KeyX', 'ㅌ'); await p.waitForTimeout(120);
  const z = await p.evaluate(() => DRG2.sense().me.z); await ime('keyup', 'KeyX', 'ㅌ');
  out.push(['한글 입력기 X(ㅌ) = 점프', z > 0.1 ? '✓' : '✗', 'z ' + z]);
  // ③ 한글 입력기 W·D(ㅈ·ㅇ) = 걷기
  await p.waitForTimeout(700); const x0 = await p.evaluate(() => DRG2.sense().me.x);
  await ime('keydown', 'KeyD', 'ㅇ'); await p.waitForTimeout(500); await ime('keyup', 'KeyD', 'ㅇ');
  const x1 = await p.evaluate(() => DRG2.sense().me.x);
  out.push(['한글 입력기 D(ㅇ) = 오른쪽', x1 - x0 > 0.5 ? '✓' : '✗', (x1 - x0).toFixed(2) + 'm']);
  // ④ 2-3(살금살금 차례): X 꾹 = 살금살금 · 떼면 풀림
  await open(2, 2);
  for (let i = 0; i < 12 && await p.evaluate(() => !!DRG2.sense().dialog); i++) { await ime('keydown', 'Space', ' '); await p.waitForTimeout(120); await ime('keyup', 'Space', ' '); await p.waitForTimeout(120); }
  await ime('keydown', 'KeyX', 'ㅌ'); await p.waitForTimeout(200); const s1 = await p.evaluate(() => DRG2.sense().me.sneak);
  await ime('keyup', 'KeyX', 'ㅌ'); await p.waitForTimeout(150); const s2 = await p.evaluate(() => DRG2.sense().me.sneak);
  out.push(['X 꾹 = 살금살금(떼면 풀림)', s1 && !s2 ? '✓' : '✗', s1 + ' → ' + s2]);
  for (const r of out) console.log(r.join(' | '));
  const bad = out.filter((r) => r[1] !== '✓').length; console.log(bad ? '실패 ' + bad : '모두 통과');
  await b.close(); srv.close(); process.exit(bad ? 1 : 0);
});
