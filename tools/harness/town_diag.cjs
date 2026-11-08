// 📒 현장 기록 시험(PERF-G · diag.js · SD.diag) — zsh tools/ops/b2.sh node tools/harness/town_diag.cjs [마을=ourtown] [포트=8002] [--quick]
//   2코어 크롬북 흉내(low 판 · CrOS UA · hardwareConcurrency 2 · deviceMemory 4) · 그리기 끔(pw.cjs) · 새 맥락(빈 저장)
//   ① 마을 한 판: 짓기 끝 → 칸이 참(코어 · 메모리 · 화면 판 low · 첫 화면 · 첫 조작 · 받기 끝 · 짓기 시작/끝/ms) · 65초 뒤 분 기록 한 줄(중앙 · 95% · 게임 속도) · FM·ADAPT 기록 칸
//      localStorage 'sm-diag' 쓰기 = 정해진 때만(첫 화면 뒤 · 짓기 끝 · 숨김) · 쓰기 사이 2초 넘음 · 매 프레임 X
//   ② pagehide(다른 쪽으로 이동) → 다시 열면 last.end = 'hide' · last.mem · crashes 0
//   ③ 탭 죽음 흉내(CDP Page.crash = pagehide 없음) → 다시 열면 crashes 1('끊김') · SD.diagClear() → crashes 0
//   ④ SD.diagText() = '📒'로 시작 · 이름·반 코드 X(주소에 cls·sid를 넣어도 기록에 안 남음)
//   ⑤ 홍보판(/) = SD.diag().off · 'sm-diag' 안 생김
const { chromium } = require('./pw.cjs');
const A = process.argv.slice(2), TOWN = A.find(a => !a.startsWith('--') && !/^\d+$/.test(a)) || 'ourtown', PORT = A.find(a => /^\d+$/.test(a)) || '8002', QUICK = A.includes('--quick');
const UA = 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
let fail = 0; const ok = (c, m) => { if (!c) fail++; console.log((c ? '✓ ' : '✗ ') + m); };
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle'] });
  const ctx = await b.newContext({ viewport: { width: 1366, height: 768 }, userAgent: UA });
  await ctx.addInitScript(() => { Object.defineProperty(Navigator.prototype, 'hardwareConcurrency', { get: () => 2 }); Object.defineProperty(Navigator.prototype, 'deviceMemory', { get: () => 4 });
    const S0 = Storage.prototype.setItem; window.__dw = []; Storage.prototype.setItem = function (k, v) { if (k === 'sm-diag') window.__dw.push([Math.round(performance.now()), (JSON.parse(v).slice(-1)[0] || {}).end]); return S0.call(this, k, v); }; });
  const base = 'http://127.0.0.1:' + PORT, url = base + '/v2/?town=' + TOWN + '&cls=zzname&sid=07';
  let p = await ctx.newPage(); const errs = []; const hook = pg => pg.on('pageerror', e => errs.push(e.message.slice(0, 160)));
  hook(p);
  const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
  const built = () => p.waitForFunction(() => window.SM_TOWN && SM_TOWN.load && window.SD && SD.diag && !window.SM_BUILD, null, { timeout: 400000, polling: 300 });
  console.log('① 마을 한 판');
  await p.goto(url); await built(); await W8(3500);
  await ev(() => { const b9 = document.querySelector('.twn-ld [data-a="x"]') || document.querySelector('.twn-p button'); if (b9) b9.click(); }); await p.keyboard.press('KeyW'); await W8(400);
  let D = await ev(() => SD.diag());
  const n = D.now, t = n.t || {};
  ok(n.hw && n.hw.c === 2 && n.hw.m === 4 && n.mode === 'low', '기기 칸: 코어 ' + (n.hw && n.hw.c) + ' · 메모리 ' + (n.hw && n.hw.m) + ' · 판 ' + n.mode + ' · GPU ' + JSON.stringify(n.hw && n.hw.gpu));
  ok(t.ff > 0 && t.rdy > 0 && t.b0 > 0 && t.b1 > t.b0 && n.bms > 0, '시각: 첫 화면 ' + t.ff + ' · 첫 조작 ' + t.rdy + ' · 짓기 ' + t.b0 + '→' + t.b1 + '초 · ' + n.bms + 'ms');
  ok(t.net > 0 && t.net <= t.b1 + 1, '마을 받기 끝 ' + t.net + '초(자원 기록 ' + n.nres + '개)');
  ok(t.in1 > 0, '첫 키 누름 시각 ' + t.in1 + '초');
  ok(/^town:/.test(n.pg) && !/zzname|sid|07/.test(JSON.stringify({ pg: n.pg, sw: n.sw })), '주소 갈래 ' + n.pg + ' · 스위치 ' + JSON.stringify(n.sw) + '(반 코드·번호 X)');
  ok(Array.isArray(n.fm) && Array.isArray(n.ad) && /^(auto|fixed)/.test(n.gm), '화면 모드(그리기 끔 = fixed) ' + n.gm + ' · FM 기록 ' + n.fm.length + ' · ADAPT 기록 ' + n.ad.length);
  let W = await ev(() => window.__dw.slice());
  ok(W.some(w => w[1] === 'start') && W.some(w => w[1] === 'build'), '쓰기: ' + W.map(w => w[1] + '@' + Math.round(w[0] / 100) / 10).join(', '));
  if (!QUICK) { await W8(66000); D = await ev(() => SD.diag()); const M = D.now.min || [];
    ok(M.length >= 1 && M[0][1] > 20 && M[0][2] > 0 && M[0][3] >= M[0][2] && M[0][6] > 0 && M[0][6] <= 100, '분 기록: ' + JSON.stringify(M[0]) + '(분 · 프레임 · 중앙 · 95% · 가장 긴 · >100 · 게임 속도% · 배율 · 단계)');
    W = await ev(() => window.__dw.slice()); let gap = 1e9; for (let i = 1; i < W.length; i++) gap = Math.min(gap, W[i][0] - W[i - 1][0]);
    ok(W.length <= 4 && (W.length < 2 || gap >= 2000), '66초 더 걸어도 쓰기 ' + W.length + '번(매 프레임 X · 사이 최소 ' + (W.length > 1 ? gap : '-') + 'ms)'); }
  const T1 = await ev(() => SD.diagText());
  ok(/^📒/.test(T1) && !/zzname/.test(T1) && T1.includes('---'), 'diagText ' + T1.split('\n').slice(0, 3).join(' / ').slice(0, 200));
  console.log('② pagehide → 다시 열기');
  await p.goto(base + '/v2/?title=0'); await p.waitForFunction(() => window.SD && SD.diag, null, { timeout: 120000 }); await W8(1500);
  D = await ev(() => SD.diag());
  ok(D.last && D.last.end === 'hide' && D.last.pg === 'town:' + TOWN, '지난 판 끝 = ' + (D.last && D.last.end) + ' · ' + (D.last && D.last.pg));
  ok(D.last && Array.isArray(D.last.mem) && D.last.mem[0] > 0, 'last.mem = ' + JSON.stringify(D.last && D.last.mem) + 'MB(참고)');
  ok(D.crashes.length === 0, 'crashes ' + D.crashes.length);
  console.log('③ 탭 죽음 흉내');
  await p.waitForFunction(() => window.__dw.some(w => w[1] === 'start'), null, { timeout: 60000 });   /* 학교 판의 첫 쓰기(첫 화면 + 2초) */
  const cdp = await ctx.newCDPSession(p); cdp.send('Page.crash').catch(() => {}); await new Promise(r => setTimeout(r, 1500));   /* Page.crash는 답이 안 옴 = 기다리지 않음 */
  await Promise.race([p.close().catch(() => {}), new Promise(r => setTimeout(r, 3000))]);
  p = await ctx.newPage(); hook(p);
  await p.goto(base + '/v2/?title=0'); await p.waitForFunction(() => window.SD && SD.diag, null, { timeout: 120000 }); await W8(1200);
  D = await ev(() => SD.diag());
  ok(D.crashes.length === 1 && /끊김/.test(D.crashes[0].why), 'crashes ' + D.crashes.length + ' ' + JSON.stringify(D.crashes[0] || null));
  ok(D.runs.length >= 2 && Array.isArray(D.stuck.school) && Array.isArray(D.stuck.town), '지난 판 ' + D.runs.length + '줄 · stuck 칸 ' + Object.keys(D.stuck).join(','));
  const cl = await ev(() => SD.diagClear()); D = await ev(() => SD.diag());
  ok(D.crashes.length === 0 && D.runs.length === 0, 'diagClear → crashes 0 · 지난 판 0(' + cl + ')');
  console.log('⑤ 홍보판');
  await p.goto(base + '/?title=0'); await p.waitForFunction(() => window.SD && SD.diag, null, { timeout: 120000 }); await ev(() => localStorage.removeItem('sm-diag')); await W8(4000);
  const pr = await ev(() => ({ d: SD.diag(), ls: localStorage.getItem('sm-diag'), promo: !!window.SM_PROMO }));
  ok(pr.promo && pr.d && pr.d.off && pr.ls === null, '홍보판: ' + JSON.stringify(pr.d) + ' · sm-diag ' + pr.ls);
  ok(errs.length === 0, '페이지 오류 ' + errs.length + (errs.length ? ' ' + errs.slice(0, 3).join(' | ') : ''));
  await b.close();
  console.log(fail ? 'DIAG FAIL ' + fail : 'PASS'); process.exit(fail ? 1 : 0);
})().catch(e => { console.error('✗ 하네스 멈춤', e); console.log('DIAG FAIL harness'); process.exit(2); });
