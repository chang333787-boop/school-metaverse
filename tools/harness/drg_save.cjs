// 드래곤 저장·이어하기 시험(goal §9-4): node tools/harness/drg_save.cjs [repo=.] [--case=new,1,4,7,11] [--turbo=4]
//   장마다 ① 봇(보통 · 입력만)이 한 차례를 깸 → 저장 칸(localStorage drg-save-1)에 장·차례·드래곤 책·가방·flags가 놀이 상태 그대로 들어갔나
//   ② 새로고침 → 첫 화면(학년 → 저장 칸) → 같은 칸 → 그 장까지만 열림 → 이어서 하면 다음 차례부터 · 책·가방·flags가 되살아났나
//   ③ 이어서 한 차례를 더 깸 → 저장이 다음 차례로 · 앞의 것(책 글·가방·flags 이름)이 그대로 남나 · 페이지 오류 0
//   놀이 상태는 DRG.world.G를 읽기만(봇은 키만 · goal §6) — tools/ops/b2.sh로 돌린다
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '.');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : d; };
const CASES = arg('case', 'new,1,4,7,11').split(','), TURBO = +arg('turbo', 4);
const types = { '.js': 'text/javascript', '.html': 'text/html', '.glb': 'model/gltf-binary', '.png': 'image/png', '.json': 'application/json' };
const srv = http.createServer((q, r) => { const u = decodeURIComponent(q.url.split('?')[0]), p = path.join(root, u, u.endsWith('/') ? 'index.html' : ''); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); r.end(d); }); });
const fails = [], rows = [];
const ok = (c, m) => { rows.push((c ? '  ✓ ' : '  ✗ ') + m); console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails.push(m); return c; };
const J = (x) => JSON.stringify(x);
const keysIn = (a, b) => Object.keys(a || {}).every((k) => k in (b || {}));                   // a의 이름이 b에 다 있나
const notesIn = (a, b) => Object.keys(a || {}).every((sp) => Object.keys(a[sp]).every((c) => b && b[sp] && b[sp][c] === a[sp][c]));
srv.listen(0, async () => {
  const base = 'http://127.0.0.1:' + srv.address().port, Q = `&chain=0&turbo=${TURBO}&seed=1&mode=smooth`;
  const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } });
  const p = await ctx.newPage();
  let errs = [];
  p.on('pageerror', e => errs.push(e.message.slice(0, 200)));
  p.on('console', m => { if (m.type() === 'error' && !/favicon|GPU stall|Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 200)); });
  const V = (fs.readFileSync(path.join(root, 'dragon/index.html'), 'utf8').match(/main\.js\?v=(\d+)/) || [])[1];
  const ready = () => p.waitForFunction(() => window.DRG && DRG.sense && DRG.sense() && DRG.sense().id && !DRG.sense().busy, null, { timeout: 90000 });
  const slot = () => p.evaluate(() => { try { return JSON.parse(localStorage.getItem('drg-save-1')); } catch (e) { return null; } });
  const live = () => p.evaluate(() => { const G = DRG.world.G, s = DRG.sense(); return { ch: s.ch, idx: s.idx, id: s.id, book: JSON.parse(JSON.stringify(G.book.state())), inv: JSON.parse(JSON.stringify(G.inv)), flags: JSON.parse(JSON.stringify(G.flags)), records: JSON.parse(JSON.stringify(G.records)), grade: G.grade, helm: !!G.player.helmOn }; });
  /* 봇이 차례를 n개 깰 때까지(장이 끝나면 멈춤) — 놀이 시간 limit초 */
  async function play(n, limitSec) {                     // 끝 = runner 기록의 'ok' 수(sense().done은 비행 끝 같은 차례 안 값일 수 있음)
    return p.evaluate(async ({ n, limitSec, V }) => {
      const m = await import('/dragon/js/bots/story_bots.js?v=' + V), R = DRG.world.G.runner;
      const n0 = DRG.loop.n, k0 = R.log.filter((l) => l[1] === 'ok').length;
      DRG.bot.run(m.storyBot('normal'));
      return await new Promise((res) => { const iv = setInterval(() => { const sec = (DRG.loop.n - n0) / 60, oks = R.log.filter((l) => l[1] === 'ok').slice(k0);
        if (oks.length >= n || R.done) { clearInterval(iv); DRG.bot.stop(); res({ ok: !R.err, sec: +sec.toFixed(1), ids: oks.map((l) => l[0]), done: R.done, at: R.err || '' }); }
        else if (sec > limitSec) { clearInterval(iv); DRG.bot.stop(); res({ ok: false, sec: +sec.toFixed(1), ids: oks.map((l) => l[0]), at: DRG.sense().id, errs: DRG.diag().errs.slice(-2) }); } }, 100); });
    }, { n, limitSec, V });
  }
  /* 첫 화면 → 학년 4(주소) → 1번 칸 → 장 단추 */
  async function title(expectLabel, ch, maxOpen) {
    await p.goto(`${base}/dragon/?grade=4${Q}`);
    await p.waitForSelector('#title .slot', { timeout: 60000 });
    const lab = await p.$eval('#title .slot[data-k="1"]', (e) => e.textContent);
    ok(lab.includes(expectLabel), `첫 화면 1번 칸 글 '${lab.trim()}'에 '${expectLabel}'`);
    await p.click('#title .slot[data-k="1"]');
    await p.waitForSelector('#title .ch', { timeout: 10000 });
    const open = await p.$$eval('#title .ch', (L) => L.filter((b) => !b.disabled).map((b) => +b.dataset.c));
    ok(J(open) === J(Array.from({ length: maxOpen }, (_, i) => i + 1)), `장 단추 열림 ${J(open)} = 1~${maxOpen}장까지만`);
    await p.click(`#title .ch[data-c="${ch}"]`);
    await ready();
  }
  /* 저장 칸 = 지금 놀이 상태 그대로인가 */
  async function sameAsLive(tag, expCh, expIdx) {
    const s = await slot(), L = await live();
    if (!ok(!!s, tag + ' 저장 칸이 있음' + (s ? '' : ' — ' + J(await p.evaluate(() => ({ keys: Object.keys(localStorage), slot: DRG.world.G.slot, best: DRG.world.G.best, done: DRG.sense().done, log: DRG.world.G.runner.log.slice(-3), err: DRG.world.G.runner.err || '' })))))) return null;
    ok(s.ch === expCh && s.idx === expIdx, `${tag} 저장 = ${s.ch}장 ${s.idx}번째 차례(기대 ${expCh}장 ${expIdx})`);
    ok(J(s.book) === J(L.book) && J(s.inv) === J(L.inv) && J(s.flags) === J(L.flags) && J(s.records) === J(L.records), `${tag} 책·가방·flags·기록이 놀이 상태와 같음 (가방 ${J(s.inv)} · flags ${Object.keys(s.flags).join(',') || '-'} · 책 글 ${Object.keys(s.book.notes || {}).length}종)`);
    return s;
  }
  /* 이어서 연 뒤 = 저장 칸이 되살아났나 */
  async function restored(tag, s, expId) {
    const L = await live();
    ok(L.ch === s.ch && L.idx === s.idx && (!expId || L.id === expId), `${tag} 이어서 = ${L.ch}장 ${L.id}(${L.idx}번째)부터`);
    ok(notesIn(s.book.notes, L.book.notes) && J(s.book.sketch) === J(L.book.sketch) && s.book.have === L.book.have, `${tag} 드래곤 책 되살아남(글 ${Object.keys(s.book.notes || {}).length}종 · 그림 ${J(s.book.sketch)} · 책 ${s.book.have ? '있음' : '없음'})`);
    ok(J(s.inv) === J(L.inv), `${tag} 가방 되살아남 ${J(L.inv)}`);
    ok(keysIn(s.flags, L.flags) && Object.keys(s.flags).every((k) => J(s.flags[k]) === J(L.flags[k])), `${tag} flags 되살아남 ${Object.keys(L.flags).join(',') || '-'}`);
    return L;
  }
  /* 한 차례 더 깬 뒤 = 앞의 것이 그대로 남나 */
  async function kept(tag, s0, expCh, expIdx) {
    const s = await slot();
    ok(s && s.ch === expCh && s.idx === expIdx, `${tag} 이어서 깬 뒤 저장 = ${s && s.ch}장 ${s && s.idx}(기대 ${expCh}장 ${expIdx})`);
    ok(s && notesIn(s0.book.notes, s.book.notes) && keysIn(s0.inv, s.inv) && keysIn(s0.flags, s.flags), `${tag} 앞의 책 글·가방·flags 이름이 그대로 남음`);
    return s;
  }
  const fresh = async () => { await p.goto(`${base}/__blank`).catch(() => {});   /* 같은 출처의 빈 쪽(404)에서 저장 칸을 비움 */ await p.evaluate(() => { try { localStorage.clear(); } catch (e) { /* */ } }); errs = []; };
  const stepIdx = async (ch, id) => p.evaluate(async ({ ch, id, V }) => (await import('/dragon/js/story/ch' + ch + '.js?v=' + V)).chapter.steps.findIndex((s) => s.id === id), { ch, id, V });
  const playOk = (tag, r) => ok(r.ok, `${tag} 봇이 ${J(r.ids)} 깸 · 놀이 ${r.sec}초${r.ok ? '' : ' — 막힘 ' + r.at + ' ' + J(r.errs)}`);

  try {
    for (const c of CASES) {
      console.log('\n[' + c + ']');
      await fresh();
      if (c === 'new') {                                   /* 새로 하기 → 오프닝(0) → 장 끝 저장 = 1장 처음 → 이어서 1장 */
        await p.goto(`${base}/dragon/?grade=4${Q}`);
        await p.waitForSelector('#title .slot', { timeout: 60000 });
        ok((await p.$eval('#title .slot[data-k="1"]', (e) => e.textContent)).includes('새로 하기'), '빈 칸 = 새로 하기');
        await p.click('#title .slot[data-k="1"]'); await p.waitForSelector('#title .ch');
        await p.click('#title .ch[data-c="1"]'); await ready();
        ok((await live()).ch === 0, '새로 하면 오프닝(0장)부터');
        playOk('오프닝', await play(1, 120));
        const s = await sameAsLive('오프닝 끝', 1, 0);
        if (s) { await title('1장까지', 1, 1); await restored('1장', s, '1-0'); playOk('1장', await play(1, 60)); await kept('1장', s, 1, 1); }
      } else {
        const plan = { 1: [1, '1-2', '1-3'], 4: [4, '4-2', '4-3'], 7: [7, '7-2', '7-3'], 11: [11, '11-4', '11-5'] }[c];
        if (!plan) { ok(false, '모르는 경우 ' + c); continue; }
        await p.goto(`${base}/dragon/?grade=4${Q}`); await p.waitForSelector('#title .slot', { timeout: 60000 });   // 장 파일을 읽으려면 import map이 있는 쪽에서
        const [ch, a, bId] = plan, ia = await stepIdx(ch, a);
        await p.goto(`${base}/dragon/?ch=${ch}&step=${ia}&diff=normal&slot=1${Q}`); await ready();
        playOk(a, await play(1, 400));
        const s = await sameAsLive(a + ' 끝', ch, ia + 1);
        if (!s) continue;
        if (c === '1') ok(Array.isArray(s.flags.burnt), '1장 탄 집 목록(flags.burnt)이 저장됨 ' + J(s.flags.burnt));
        if (c === '4') ok(s.inv.fishCaught != null, '4장 낚은 생선 수(inv.fishCaught) 저장됨');
        if (c === '7') ok(s.inv.helmet === 1, '7장 투구(inv.helmet) 저장됨');
        if (c === '11') ok((s.inv.salmon || 0) > 0, '종장 잡은 물고기(inv.salmon) 저장됨');
        await title(ch + '장까지', ch, ch);
        await restored(ch + '장', s, bId);
        if (c === '7') {                                   /* 7장 나머지를 다 깨면 → 8장 처음 저장 · 투구·짐 보따리가 8장까지 */
          const r = await play(9, 1500); playOk('7장 나머지', r);
          const s8 = await sameAsLive('7장 끝', 8, 0);
          if (s8) {
            ok(s8.inv.helmet === 1 && s8.flags.pack === true, '7장 끝 저장에 투구·짐 보따리(flags.pack)');
            await title('8장까지', 8, 8);
            const L8 = await restored('8장', s8, '8-1');
            ok(L8.helm === true, '8장 이어서 = 히컵이 투구를 쓰고 있음');
            playOk('8장', await play(1, 200)); await kept('8장', s8, 8, 1);
          }
        } else {
          playOk(bId, await play(1, 400));
          const s2 = await kept(ch + '장', s, ch, ia + 2);
          if (c === '4' && s2) ok(s2.flags.named === true && s2.book.notes.nightfury && s2.book.notes.nightfury.likes, '4장 ③ 뒤 = 이름(flags.named) · 책 나이트 퓨리 좋아함 칸');
          if (c === '4' && s2) {                           /* 앞 장 다시 하기 → 가장 멀리 간 곳은 그대로 · 선생님 장 고르기 → 빈 칸에만 */
            await title('4장까지', 2, 4);
            ok((await live()).id === '2-1', '앞 장(2장)을 고르면 그 장 처음부터');
            playOk('2장 다시', await play(1, 200));
            const s3 = await slot();
            ok(s3 && s3.ch === 2 && s3.best === 4 && s3.bestIdx === ia + 2, `앞 장을 다시 해도 가장 멀리 간 곳 = ${s3 && s3.best}장 ${s3 && s3.bestIdx}(기대 4장 ${ia + 2})`);
            await title('4장까지', 4, 4);
            const L4 = await live(); ok(L4.id === '4-4', '다시 4장을 고르면 멈춘 차례(4-4)부터 — ' + L4.id);
            const before = J(await slot());
            await p.goto(`${base}/dragon/?grade=4${Q}`); await p.waitForSelector('#title .slot', { timeout: 60000 });
            await p.click('#title [data-t]'); await p.waitForSelector('#title .ch'); await p.click('#title .ch[data-c="3"]'); await ready();
            playOk('선생님 3장', await play(1, 300));
            const s2b = await p.evaluate(() => { try { return JSON.parse(localStorage.getItem('drg-save-2')); } catch (e) { return null; } });
            ok(J(await slot()) === before, '선생님 장 고르기가 1번 칸을 덮지 않음');
            ok(!!s2b && s2b.ch === 3, '선생님이 고른 장은 빈 2번 칸에 저장 — ' + (s2b ? s2b.ch + '장 ' + s2b.idx : '없음'));
          }
          if (c === '11' && s2) ok(Object.keys(s2.book.notes || {}).length >= 3 && s2.book.have, '종장 ⑤ 뒤 = 책 글 셋 이상 · 책 있음');
        }
      }
      ok(errs.length === 0, `페이지 오류 0${errs.length ? ' — ' + errs.slice(0, 3).join(' / ') : ''}`);
    }
  } catch (e) { fails.push('예외 ' + e.message.slice(0, 300)); console.log('예외', e.message); }
  await b.close(); srv.close();
  console.log('\n' + (fails.length ? '실패 ' + fails.length + ':\n  ' + fails.join('\n  ') : '모두 통과'));
  process.exit(fails.length ? 1 : 0);
});
