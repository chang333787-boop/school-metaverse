// 🎁 RWFIX-1 시험(보상 알림 = 실제로 들어온 양 · 사용자 10-31 '2주 동안 새 기능 X · 믿을 수 있게' · 근거 docs/systems/town_codex_deep_1028.md B1·B3·B4·E5~E19)
//   node tools/harness/town_rwfix.cjs [마을=ourtown] [포트=8002] [--node(브라우저 없이 앞 칸만)] [--root=폴더(node 칸이 읽을 코드 · 고치기 전 판과 견줄 때)]
//   고치기 전 판과 견주기: 옛 코드를 다른 폴더에 풀고 그 폴더로 서버를 띄운 뒤 → node tools/harness/town_rwfix.cjs ourtown <옛 포트> --root=<옛 폴더> (✗ = 재현)
//   ① node(그림 없음): rwCheck 횟수는 준 뒤에만(E18) · 한 번뿐인 상의 막힌 몫(earn once · payOwe) · 할 일 실제 받은 돈(t.got) · 잔치 srcOf 부엌(E12)
//   ② 브라우저(pw.cjs · 그리기 끔): 요리 그만두기 = 산 재료는 산 것(B1) · 둘째 그릇 + 잔치 한 번(E11·E12) · 꾸러미 배너·남은 몫(B3) · 할 일 💰 팝(B3) · 일 끝 글(B3)
//     · 주고받기 값 견주기(B4) · 사진 기사료(B3) · 옷 모양 버리기(E6) · 다 선 잔치 갈래·식사 취소(E13·E19) · 아침 경매 진행 중(E16) · 밤 낚시 미끼·받은 수(E14·E15)
//     · 김장 두 번 누름·창 닫기(E7·E8) · 설날 끝 조건(E9) · 김치 안내(E10) · 달력 바꾸면 행사 다시(E17) · 제빵 판이 마을을 나간 뒤 안 열림(E5) · 페이지 오류 0
//   하루 총량 막힘 = S.rw.r.v를 상한(60000)으로 채워 흉내 · 시험 저장은 새 브라우저(빈 저장)라 아이 판에 닿지 않음
const path = require('path'), url = require('url');
const pos = process.argv.slice(2).filter(a => !a.startsWith('--')), ID = pos[0] || 'ourtown', PORT = pos[1] || '8002', URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const ROOT = path.resolve((process.argv.find(a => a.startsWith('--root=')) || '').slice(7) || path.join(__dirname, '..', '..')), NODE_ONLY = process.argv.includes('--node');
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
const imp = f => import(url.pathToFileURL(path.join(ROOT, f)).href);

async function nodePart() {
  console.log('① node — ' + ROOT);
  const mem = new Map(); globalThis.localStorage = { getItem: k => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => { mem.set(k, String(v)); }, removeItem: k => { mem.delete(k); }, key: i => [...mem.keys()][i] ?? null, get length() { return mem.size; } };
  const M = await imp('v2/games/town_game.js'), rd = M.rdNow(), full = (S, said) => { S.rw = { d: S.day, c: {}, rd, r: { v: M.RW_DAY.v * M.RW_RD, x: {}, h: {}, said: said || {} } }; };
  { const S = { day: 3 }; full(S); let g = 0; for (let i = 0; i < 6; i++) g += M.rwCheck(S, 'bag', 'job:pasture', 1, '🥛');
    const c = S.rw.c['b|job:pasture'] | 0; ok(g === 0, '[E18] 하루 총량을 다 쓴 채 일 여섯 판 = 받은 것 0');
    ok(c === 0, '[E18] 못 받은 시도는 출처 횟수를 안 먹음 (횟수 ' + c + ' · 고치기 전 = 6)');
    S.rw.rd = rd - 1; const a = M.rwCheck(S, 'bag', 'job:pasture', 1, '🥛'); ok(a === 1, '[E18] 실제 자정이 지나면 같은 게임 날에도 다시 받음 (받은 수 ' + a + ')');
    const S2 = { day: 3 }; S2.rw = {}; let n2 = 0; for (let i = 0; i < 9; i++) n2 += M.rwCheck(S2, 'bag', 'job:pasture', 1, '🥛'); ok(n2 === M.RW_GEN.job, '[E18] 총량이 남은 날 = 하루 한도 그대로 ' + M.RW_GEN.job + '번 (' + n2 + ')'); }
  { const G = M.createGame('zzrwfix'), S = G.S; full(S, { money: 1 }); const m0 = S.money, r = G.earn(1500, 'bundle:spring', true);
    ok(r === 0 && S.money === m0, '[B3] 총량에 막힌 꾸러미 상 = 지갑 그대로(earn이 0을 돌려줌)');
    ok(((S.owe || {})['bundle:spring'] | 0) === 1500, '[B3] 한 번뿐인 상의 막힌 몫이 남음 (S.owe ' + JSON.stringify(S.owe || null) + ')');
    S.rw.rd = rd - 1; const v = typeof G.payOwe === 'function' ? G.payOwe() : 0; ok(v === 1500 && S.money === m0 + 1500 && !(typeof G.owed === 'function' && G.owed()), '[B3] 실제 날짜가 바뀌면 남은 몫이 들어옴 (' + v + '원)');
    full(S, { money: 1 }); S.tasks = { day: S.day, list: [{ id: 'bus', ev: 'bus', need: 1, n: 0, rew: 300, done: false }], all: false }; const m1 = S.money, out = G.taskEv('bus');
    ok(out && out[0] && out[0].done && S.money === m1, '[B3] 할 일은 끝남 · 돈은 총량에 막힘');
    ok(out && out[0] && out[0].got === 0, '[B3] 할 일에 실제로 받은 돈(t.got = ' + (out && out[0] ? out[0].got : '-') + ') — 팝·할 일 창은 이 값');
    S.rw = {}; S.tasks = { day: S.day, list: [{ id: 'bus', ev: 'bus', need: 1, n: 0, rew: 300, done: false }], all: false }; const o2 = G.taskEv('bus'); ok(o2 && o2[0].got === 300, '[B3] 총량이 남은 날 = 할 일 돈 그대로 300 (' + (o2 && o2[0].got) + ')');
    G.dispose(); }
  { const F = await imp('v2/games/town_feast.js'); ok(F.srcOf('job', { k: 'kitchen' }) == null && F.srcOf('tally:cooked') === 'food', '[E12] 잔치 음식 = 잘 된 요리(tally:cooked) 한 길만 · 부엌 기록은 따로 안 셈 (' + F.srcOf('job', { k: 'kitchen' }) + ')'); }
}

async function browserPart() {
  console.log('② 브라우저 — ' + URL);
  const { chromium } = require('./pw.cjs');   /* FAST-1 그리기 끔 */
  const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }), errs = [];
  try { const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(); p.on('pageerror', e => errs.push(e.message.slice(0, 200)));
    p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall|CORS|firebasedatabase|Failed to load resource/.test(t)) || /게임 tick 오류/.test(t)) errs.push(t.slice(0, 200)); });
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && SM_TOWN.rules && SM_TOWN.rw && window.SD2, null, { timeout: 240000 }); await W8(1500);
    const closeAll = async () => { for (let i = 0; i < 8; i++) { const any = await ev(() => !!(document.querySelector('.twn-p') || document.querySelector('.twn-dlg'))); if (!any) break; await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); await W8(200); if (await ev(() => !!(document.querySelector('.twn-p') || document.querySelector('.twn-dlg')))) { await p.keyboard.press('Escape'); await W8(200); } } };
    for (let i = 0; i < 4; i++) { await p.keyboard.press('Escape'); await W8(150); } await closeAll();
    await ev(() => { const G = SM_TOWN.game(), S = G.S; S.story = S.story || {}; S.story.done = S.story.done || {}; S.story.done.p0 = 1; S.story.p0auto = 1; S.jobs = S.jobs || {}; S.jobs.fireNo = 9999; G.setClock(false); S.min = 11 * 60; SM_TOWN.rules.wx('clear'); G.mark();
      window.__pops = []; new MutationObserver(L => { for (const r of L) for (const n of r.addedNodes) if (n.classList && n.classList.contains('twn-pop')) window.__pops.push(n.textContent); }).observe(document.body, { childList: true }); });
    const capRd = () => ev(() => { const G = SM_TOWN.game(), d = new Date(), rd = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); G.S.rw = { d: G.S.day, c: {}, rd, r: { v: 60000, x: {}, h: {}, said: { bag: 1, money: 1, xp: 1, heart: 1 } } }; });
    const uncap = () => ev(() => { SM_TOWN.game().S.rw = {}; });
    const bag = () => ev(() => ({ ...SM_TOWN.game().S.bag })), money = () => ev(() => SM_TOWN.game().S.money | 0);
    const toast = () => ev(() => ((document.getElementById('toast') || {}).textContent || ''));
    const pops = () => ev(() => window.__pops.splice(0));
    const step = async (tag, fn) => { try { await fn(); } catch (e) { ok(false, tag + ' 시험 중 오류 — ' + String(e && e.message || e).slice(0, 160)); } await closeAll();
      if (process.env.RWDBG) console.log('    · ' + tag + ' 뒤 ' + JSON.stringify(await ev(() => !window.SM_TOWN ? { town: false } : ({ hots: SD2.map.interact.list().length, inb: !!(SM_TOWN.indoor && SM_TOWN.indoor.on), game: SD2.map.game.current && SD2.map.game.current.id, town: !!window.SM_TOWN, ssd: (SM_TOWN.game().S.season || {}).d, day: SM_TOWN.game().S.day, body: document.body.className.slice(0, 80) })))); };
    const setBag = o => ev(o9 => { const G = SM_TOWN.game(), B = G.S.bag; for (const k of Object.keys(B)) delete B[k]; Object.assign(B, o9); G.S.bought = {}; SM_TOWN.bagRefresh(); }, o);
    const openCookPlay = async () => { await ev(() => SM_TOWN.cook()); await W8(300); await ev(() => { const b9 = document.querySelector('.twn-p button[data-r="0"]'); if (b9) b9.click(); }); await W8(500); return ev(() => !!document.querySelector('.twn-play')); };

    // ── B1 요리 그만두기 ──
    await step('[B1]', async () => { await uncap(); await setBag({ '🌾': 1, '🥚': 1, '🥛': 1 }); await ev(() => { SM_TOWN.game().S.bought = { '🥛': 1 }; });
      const on = await openCookPlay(), mid = await bag(); ok(on && !mid['🥛'], '[B1] 레시피북 → 팬케이크 = 재료 셋을 쓰고 부엌 놀이');
      await ev(() => { const x = document.querySelector('.twn-play .x'); if (x) x.click(); }); await W8(600);
      const B = await bag(), bt = await ev(() => ({ ...(SM_TOWN.game().S.bought || {}) }));
      ok(B['🥛'] === 1 && B['🌾'] === 1, '[B1] 그만두기 = 재료가 가방에 그대로');
      ok(bt['🥛'] === 1, '[B1] 산 우유는 「산 것」으로 돌아옴(되팔면 싼 값) — bought ' + JSON.stringify(bt)); });

    // ── E11·E12 둘째 그릇(총량을 다 쓴 날) · 잔치 음식 한 번 ──
    await step('[E11]', async () => { await uncap(); await ev(() => { const F = SM_TOWN.feast && SM_TOWN.feast(); if (F && F.sec) F.sec(true); }); const F0 = await ev(() => { const F = SM_TOWN.feast && SM_TOWN.feast(); return F ? F.info() : null; });
      await setBag({ '🌾': 2, '🥚': 2, '🥛': 2 }); const on = await openCookPlay(); if (!on) { ok(false, '[E11] 부엌 놀이가 안 열림'); return; }
      await ev(() => SM_TOWN.kitchen().play.dbg.more()); const k0 = await ev(() => SM_TOWN.kitchen().play.dbg.cfg); ok(k0 && k0.pots.length === 2, '[E11] 냄비 하나 더 = 재료 한 벌 더 씀 (냄비 ' + (k0 && k0.pots.length) + ')');
      await capRd(); await pops();
      for (let i = 0; i < k0.pots.length; i++) await ev(i => SM_TOWN.kitchen().play.dbg.ff(i, 'ok'), i); await W8(200);
      for (let i = 0; i < k0.pots.length; i++) await ev(i => SM_TOWN.kitchen().play.dbg.plate(i), i); await W8(200);
      { const st = await ev(() => SM_TOWN.kitchen().play.dbg.state()); for (let i = 0; i < st.length; i++) if (st[i].wantSalt) await ev(i => SM_TOWN.kitchen().play.dbg.salt(i, 1), i); }
      for (let i = 0; i < 60 && await ev(() => !!document.querySelector('.twn-play .kc')); i++) await W8(250); await W8(1200);
      const B = await bag(), P = await pops(); ok((B['🥞'] | 0) === 2 && !(B['🌾'] | 0), '[E11] 하루 총량을 다 쓴 날도 두 그릇 = 🥞 ' + (B['🥞'] | 0) + '개(재료 두 벌 → 두 그릇 · 고치기 전 = 둘째 재료만 사라짐)');
      ok(P.includes('+🥞×' + (B['🥞'] | 0)) || ((B['🥞'] | 0) === 1 && P.includes('+🥞')), '[E11] 팝 = 실제로 들어온 그릇 수 (' + P.filter(t => /🥞/.test(t)).join(' ') + ')');
      const F1 = await ev(() => { const F = SM_TOWN.feast && SM_TOWN.feast(); return F ? F.info() : null; });
      if (F0 && F0.prep) { const a = (F0.dc && F0.dc.d === F0.day ? F0.dc.b.food | 0 : 0), z = (F1.dc && F1.dc.b ? F1.dc.b.food | 0 : 0); ok(z - a === 1, '[E12] 한 번 요리(두 그릇) = 잔치 음식 보탬 한 번 (' + a + ' → ' + z + ' · 고치기 전 = 두 번)'); }
      else console.log('    (잔치 준비 기간이 아니라 E12 브라우저 칸 건너뜀 — node 칸이 봄)'); await uncap(); });

    // ── B3 꾸러미 ──
    await step('[B3 꾸러미]', async () => { await uncap(); const BN = await ev(async () => { const M = await import('/v2/games/town_bundle.js'), r = SM_TOWN.bundles().find(q => !q.done); if (!r) return null; const B = M.BUNDLES.find(q => q.id === r.id); return { id: r.id, need: r.need, put: r.put, money: B ? B.money : 0 }; });
      if (!BN || !BN.money) { ok(false, '[B3] 채울 꾸러미가 없음'); return; }
      await ev(o => { const G = SM_TOWN.game(); for (const [e, n] of Object.entries(o.need)) { const k = n - ((o.put || {})[e] || 0); if (k > 0) G.add(e, k, 'mv:test'); } SM_TOWN.bagRefresh(); }, BN);
      await capRd(); const m0 = await money();
      for (let i = 0; i < 12; i++) { const done = await ev(id => (SM_TOWN.bundles().find(q => q.id === id) || {}).done, BN.id); if (done) break; await ev(() => SM_TOWN.openBundles()); await W8(200); await ev(id => { const b9 = document.querySelector('.twn-p [data-b="' + id + '"]'); if (b9) b9.click(); }, BN.id); await W8(250); }
      const ban = await ev(() => (document.getElementById('hudBan') || {}).textContent || ''), m1 = await money(), owe = await ev(() => ({ ...(SM_TOWN.game().S.owe || {}) })), w = BN.money.toLocaleString('ko-KR') + '원';
      ok(/채웠어요/.test(ban) && m1 === m0, '[B3] 총량을 다 쓴 날 꾸러미를 채움 = 지갑 그대로 · 배너 「' + ban.slice(0, 70) + '」');
      ok(!ban.includes('채웠어요! ' + w), '[B3] 배너에 못 받은 돈(' + w + ')을 받은 것처럼 쓰지 않음');
      ok((owe['bundle:' + BN.id] | 0) === BN.money && /나머지/.test(ban), '[B3] 못 받은 몫은 남겨 두고 「나머지 … 내일」 한 줄 (owe ' + JSON.stringify(owe) + ')');
      await ev(() => { SM_TOWN.game().S.rw.rd = 1; }); const v = await ev(() => { const G = SM_TOWN.game(); return typeof G.payOwe === 'function' ? G.payOwe() : 0; }); ok(v === BN.money && (await money()) === m0 + BN.money, '[B3] 다음 날짜 = 남은 몫이 들어옴 (' + v + '원)'); await uncap(); });

    // ── B3 할 일 💰 팝 ──
    await step('[B3 할 일]', async () => { await uncap(); await ev(() => SM_TOWN.rw.tev('__zz')); const T = await ev(() => { const L = (SM_TOWN.game().S.tasks || {}).list || []; const t = L.find(q => !q.done); return t ? { ev: t.ev, need: t.need, id: t.id, rew: t.rew } : null; });
      if (!T) { ok(false, '[B3] 남은 할 일 없음'); return; } await capRd(); await pops(); const m0 = await money(); await ev(o => SM_TOWN.rw.tev(o.ev, o.need), T); await W8(400);
      const P = await pops(), m1 = await money(), t1 = await ev(id => ((SM_TOWN.game().S.tasks || {}).list || []).find(q => q.id === id), T.id);
      ok(t1 && t1.done && m1 === m0, '[B3] 할 일 「' + T.id + '」 끝 · 총량에 막혀 돈 0');
      ok(!P.some(t => /원/.test(t)), '[B3] 받은 돈 0 = 💰 팝 없음 (팝: ' + (P.join(' ') || '-') + ' · 고치기 전 = +' + T.rew + '원)'); await uncap(); });

    // ── B3 일 끝 글 ──
    await step('[B3 일]', async () => { await uncap(); await ev(() => { SM_TOWN.game().S.uses = {}; }); const W = await ev(() => SM_TOWN.rw.wk().filter(w => !['stall', 'pasture', 'cook'].includes(w.k)));
      let got = null; for (const w of W) { const r = await ev(i => SM_TOWN.rw.play(i), w.i); if (r && !r.pr && !r.st) { got = w; break; } if (r) { await ev(() => SM_TOWN.rules.playEnd(0)); await W8(300); await closeAll(); } }
      if (!got) { ok(false, '[B3] 진짜 판이 되는 일터 없음'); return; } const emo = await ev(() => (SM_TOWN.rules.play() || {}).emo); await capRd(); const b0 = await bag();
      await ev(() => SM_TOWN.rules.playEnd(3)); await W8(500); const t = await toast(), b1 = await bag();
      ok((b1[emo] | 0) === (b0[emo] | 0), '[B3] 일(' + got.k + ') 잘함 · 총량에 막혀 ' + emo + ' 그대로');
      ok(!/가방에 .*×\d+ 넣었어요/.test(t) && /충분히/.test(t), '[B3] 끝 글이 「가방에 넣었어요」라 하지 않음 — 「' + t.slice(0, 60) + '」'); await uncap(); });

    // ── B4 주고받기 ──
    await step('[B4]', async () => { await uncap(); const ST = await ev(() => SM_TOWN.mk.stalls()); if (!ST.length) { ok(false, '[B4] 장터 없음'); return; }
      const LOCAL = { 바다: '🐟', 산: '🍯', 들: '🍚', 강: '🥒', 시내: '🍞', 읍내: '🍞', 관광: '🍦' }, loc = LOCAL[ST[0].reg] || '🍞';
      const fair = await ev(async loc9 => { const M = await import('/v2/games/town_game.js'), vl = M.ITEMS[loc9][3]; return Object.keys(M.ITEMS).find(e => e !== loc9 && ['food', 'treat'].includes(M.ITEMS[e][2]) && M.ITEMS[e][3] / vl >= 0.75 && M.ITEMS[e][3] / vl <= 1.34); }, loc);
      const trade = async () => { await ev(() => SM_TOWN.mk.open(0)); await W8(300); await ev(() => { const b9 = document.querySelector('.twn-p [data-a="tr"]'); if (b9) b9.click(); }); await W8(400); };
      await setBag({ '🍂': 3, '👣': 1 }); await trade(); let B = await bag();
      ok(!(B[loc] | 0) && B['🍂'] === 3 && B['👣'] === 1, '[B4] 나뭇가지(50원)·도장으로는 ' + loc + '를 못 받음 (가방 ' + JSON.stringify(B) + ' · 고치기 전 = 바꿈)');
      if (!fair) { ok(false, '[B4] 값이 비슷한 물건을 못 찾음'); return; } await setBag({ '🍂': 3, [fair]: 20 }); await trade(); B = await bag();   /* 20개 = 꾸러미에 남길 몫(bunKeep) 밖이 넉넉하게 */
      ok((B[loc] | 0) === 1 && B[fair] === 19 && B['🍂'] === 3, '[B4] 값이 비슷한 ' + fair + ' 하나 → ' + loc + ' 하나 (가방 ' + JSON.stringify(B) + ')');
      await setBag({ [fair]: 20 }); await ev(e => { SM_TOWN.game().S.bought = { [e]: 20 }; }, fair); await trade(); B = await bag(); ok(B[fair] === 20 && !(B[loc] | 0), '[B4] 가게에서 산 것은 안 바꿈'); });

    // ── B3 사진 기사료 ──
    await step('[B3 사진]', async () => { await uncap(); const wid = await ev(async () => { const M = await import('/v2/games/town_wild.js'); return M.WILD[0].id; });
      await ev(id => { SM_TOWN.game().S.press = { v: 1, list: [{ t: 777001, id, act: 'rest', n: 1, fr: 0.3 }], news: [], got: {}, th: null }; }, wid); await capRd(); const m0 = await money();
      const r = await ev(() => SM_TOWN.press().send(777001)), a = await ev(() => SM_TOWN.game().S.press.list[0]);
      ok(r && !r.ok && (await money()) === m0, '[B3] 총량에 막힌 기사 = 기사료 0');
      ok(!a.sent && /충분히/.test(r.msg), '[B3] 기사를 쓰지 않고 남김(내일 냄) — 「' + (r && r.msg || '').slice(0, 50) + '」 · 고치기 전 = 「벌써 실었어요」로 써 버림'); await uncap(); });

    // ── E13·E19 잔치 ──
    await step('[E13]', async () => { const F0 = await ev(() => SM_TOWN.feast().info()); if (!F0.prep) { console.log('    (잔치 준비 기간이 아님 — E13 건너뜀)'); }
      else { await ev(() => { const s = SM_TOWN.game().S.feast; s.lv.food = 6; s.dc = null; SM_TOWN.game().mark(); }); await setBag({ '🥞': 2, '🥔': 2 }); await ev(() => SM_TOWN.feast().open(true)); await W8(300);
        const n = await ev(() => document.querySelectorAll('.twn-p [data-gb="food"]').length); await ev(() => { const b9 = document.querySelector('.twn-p [data-gb="food"]'); if (b9) b9.click(); }); await W8(300); const B = await bag();
        ok(n === 0 && B['🥞'] === 2 && B['🥔'] === 2, '[E13] 셋 다 선 잔치 음식 = 드리기 단추 없음 · 가방 그대로 (단추 ' + n + ' · 고치기 전 = 물건만 사라짐)'); await closeAll(); }
      await setBag({}); await ev(() => { SM_TOWN.game().S.feast.fx = {}; SM_TOWN.feast().dbg.share(); }); await W8(500); await p.keyboard.press('Escape'); await W8(400);
      const fx = await ev(() => SM_TOWN.feast().info().fx); ok(!fx.ate, '[E19] 음식 나누기 대화를 닫으면(Esc) 먹은 것으로 안 적음 (fx ' + JSON.stringify(fx) + ')'); });

    // ── E16 아침 경매 ──
    await step('[E16]', async () => { await ev(() => { SM_TOWN.night(); const G = SM_TOWN.game(); G.S.min = 6 * 60 + 5; G.mark(); }); await W8(300);
      const L = await ev(() => (SM_TOWN.dayx().list() || []).filter(q => q.g === 'nauc').map(q => ({ m: q.m, e: q.e })));
      if (!L.length) { console.log('    (이 마을엔 아침 경매가 없음 — E16 건너뜀)'); return; }
      await ev(() => SM_TOWN.dayx().openToday()); await W8(300); const r = await ev(() => { const P = document.querySelector('.twn-p'); if (!P) return null; const sp = [...P.querySelectorAll('.dy-t > span')].find(s => /경매/.test(s.textContent)); if (!sp) return null; const nx = sp.nextElementSibling; return { past: sp.classList.contains('past'), go: !!(nx && nx.tagName === 'BUTTON') }; });
      ok(L[0].e === 510, '[E16] 경매 줄에 끝나는 때(08:30) — ' + JSON.stringify(L[0]));
      ok(r && !r.past && r.go, '[E16] 06:05에 연 시간표 = 경매가 「하는 중」(흐림 X · 🧭 있음) — ' + JSON.stringify(r)); await ev(() => { SM_TOWN.game().S.min = 11 * 60; }); });

    // ── E14·E15 밤 낚시 ──
    await step('[E14]', async () => { await ev(() => { const G = SM_TOWN.game(); G.S.min = 21 * 60; SM_TOWN.rules.wx('clear'); G.mark(); }); await W8(1500); const I = await ev(() => SM_TOWN.night().info());
      const FS = I.site && I.site.fish; if (!FS || !FS.length) { console.log('    (이 마을엔 밤 낚시 자리가 없음 — E14·E15 건너뜀)'); return; } const li = FS.findIndex(f => f[3]); const i = li >= 0 ? li : 0;
      await capRd(); const b0 = (await bag())['🐟'] | 0;
      await ev(([x, z]) => { SD2.map.player.teleport([x, SM_TOWN.ground(x, z) + 0.05, z]); }, [FS[i][0], FS[i][1]]); await W8(400);
      await ev(([x, z]) => { let b9 = null, bd = 9; for (const h of SD2.map.interact.list()) { if (!/밤 낚시/.test(h.label) || h.off) continue; const d = Math.hypot(h.x - x, h.z - z); if (d < bd) { bd = d; b9 = h; } } if (b9) SD2.actOn(b9); }, [FS[i][0], FS[i][1]]); await W8(5600);
      const P = await ev(() => (document.querySelector('.twn-p') || {}).innerText || ''), b1 = (await bag())['🐟'] | 0; await closeAll();
      if (li >= 0) ok(b1 === b0 && !/\d+마리!/.test(P), '[E15] 총량에 막힌 밤 낚시 = 🐟 그대로 · 「n마리!」라 쓰지 않음 — 「' + P.replace(/\s+/g, ' ').slice(0, 50) + '」');
      const c1 = await ev(() => SM_TOWN.night().info().fishP.casts); if (!c1) console.log('    밤 낚시 진단 ' + JSON.stringify(await ev(([x, z]) => ({ min: SM_TOWN.game().S.min, me: (() => { const m = SD2.map.player.get(); return [+m.x.toFixed(1), +m.z.toFixed(1)]; })(), frozen: !!(SD2.CTRL && SD2.CTRL.frozen), panel: !!document.querySelector('.twn-p'), dlg: !!document.querySelector('.twn-dlg'), hots: SD2.map.interact.list().filter(h => Math.hypot(h.x - x, h.z - z) < 4).map(h => [h.label, h.off]) }), [FS[i][0], FS[i][1]]))); await ev(() => SM_TOWN.night().dbg.rebuildDay()); const c2 = await ev(() => SM_TOWN.night().info().fishP.casts);
      ok(c1 === 1 && c2 === 1, '[E14] 다시 지어도(다시 열기) 그날 밤 쓴 미끼 수 그대로 (' + c1 + ' → ' + c2 + ' · 고치기 전 = 0)'); await uncap(); await ev(() => { SM_TOWN.game().S.min = 11 * 60; }); });

    // ── 계절 행사(E7·E8·E9·E10·E17) ──
    const D = (k, ...a) => ev(([k9, a9]) => SM_TOWN.seasonEv().dbg[k9](...a9), [k, a]), I9 = () => ev(() => SM_TOWN.seasonEv().info());
    const ssec = async (n = 2) => { for (let i = 0; i < n; i++) { await ev(() => SM_TOWN.seasonEv().sec()); await W8(60); } };
    const use = async id => { await ssec(1); await ev(id9 => SM_TOWN.seasonEv().dbg.use(id9), id); await W8(150); await ssec(1); };
    const setDay = async (d, m) => { await closeAll(); await ev(([d9, m9]) => { const G = SM_TOWN.game(); G.S.day = d9; G.S.min = m9; G.mark(); }, [d, m]); await ssec(2); await W8(500); };
    let DAYS = null;
    await step('[계절]', async () => { await ev(() => { const S = SM_TOWN.game().S; S.cal = { d0: 1, on: true, s: 'now' }; if (S.feast) S.feast.fd = 200; SM_TOWN.game().mark(); }); DAYS = {}; for (const id of ['chu', 'kim', 'seol']) DAYS[id] = await D('dayOf', id, 1); console.log('    행사 날 ' + JSON.stringify(DAYS)); });
    await step('[E9]', async () => { await setDay(DAYS.seol, 9 * 60); let S9 = await I9(); if (S9.id !== 'seol') { ok(false, '[E9] 설날이 안 됨 ' + JSON.stringify(await ev(() => { const S = SM_TOWN.game().S, s = S.season || {}; return { day: S.day, cal: S.cal, d: s.d, id: s.id, sk: s.sk, mv: s.mv, fd: S.feast && S.feast.fd, base: SM_TOWN.seasonEv().dbg.base(S.day), typh: SM_TOWN.typhoon && SM_TOWN.typhoon.info && SM_TOWN.typhoon.info() }; }))); return; } const el = S9.st.sp;
      await D('q', 'ok'); await use('h' + el); for (const i of [0, 1, 2]) if (i !== el) await use('h' + i); await closeAll(); await D('q', null); await use('dd'); await closeAll(); S9 = await I9();
      ok(S9.st.dd && !S9.st.done, '[E9] 세배·떡국만 = 아직 「다 했어요」 아님(윷놀이가 남음 · 고치기 전 = 끝으로 적음)');
      await use('yut'); await W8(400); await closeAll(); S9 = await I9(); ok(S9.st.done === 1, '[E9] 윷놀이까지 = 설날 할 일 셋 끝'); });
    await step('[E7]', async () => { await setDay(DAYS.kim, 9 * 60); let S9 = await I9(); if (S9.id !== 'kim') { ok(false, '[E7] 김장 날이 안 됨'); return; }
      let r = null; for (let k = 0; k < 5; k++) r = await D('kim', k); let err = ''; try { await D('kim', 4); } catch (e) { err = String(e.message || e).slice(0, 80); }
      ok(r && r.all && !err, '[E7] 김장 마지막 단추를 한 번 더 = 오류 없음' + (err ? ' — ' + err : ''));
      const sp = (await I9()).st.sp; await D('q', null); await use('h' + sp); await closeAll(); const H = await D('house', sp); await ev(h => SD2.map.player.teleport([h.at[0], SM_TOWN.ground(h.at[0], h.at[1]) + 0.05, h.at[1]]), H); await W8(300);
      await use('kim'); await W8(300); await closeAll(); const cl = await ev(() => { const c = [...document.querySelectorAll('.chip.gchip')].find(q => /김치 전할 집|share with/.test(q.textContent)); if (c) c.click(); return !!c; }); await W8(500);
      const rt = await ev(() => SM_TOWN.routeNow && SM_TOWN.routeNow()), dd = rt && rt.to ? Math.hypot(rt.to[0] - H.hot[0], rt.to[1] - H.hot[1]) : -1;
      ok(cl && rt && dd > 1, '[E10] 이미 김장했다고 들은 집 곁에서 안내를 눌러도 다른 집으로 (그 집까지 ' + (dd >= 0 ? dd.toFixed(1) : '-') + 'm · 고치기 전 = 그 집)'); });
    await step('[E8]', async () => { await setDay(DAYS.kim + 1, 9 * 60); await setDay(DAYS.kim, 9 * 60); const S9 = await I9(); if (S9.id !== 'kim' || (S9.st.ko | 0)) { ok(false, '[E8] 새 김장 판이 안 됨 ' + JSON.stringify(S9.st)); return; }
      await use('kim'); await W8(300); for (let k = 0; k < 5; k++) { await ev(k9 => { const b9 = document.querySelector('.twn-p [data-k="' + k9 + '"]'); if (b9) b9.click(); }, k); await W8(k < 4 ? 350 : 60); }
      await ev(() => { const x = document.querySelector('.twn-p [data-a="x"]'); if (x) x.click(); }); await W8(80); await ev(() => SM_TOWN.bagOpen()); await W8(1800);
      const pk = await ev(() => { const P = document.querySelector('.twn-p'); return P ? P.textContent.slice(0, 20) : ''; }); ok(!!pk, '[E8] 김장 창을 닫고 바로 연 가방 창이 1.4초 뒤에도 그대로 (' + (pk || '닫힘') + ' · 고치기 전 = 닫힘)'); });
    await step('[E17]', async () => { await setDay(DAYS.chu, 9 * 60); let S9 = await I9(); ok(S9.id === 'chu', '[E17] 추석 날(달력대로)');
      await ev(() => SM_TOWN.game().setCal(false, 'winter')); await ssec(2); S9 = await I9(); ok(!S9.id && !S9.vis.length, '[E17] 계절을 겨울로 고정 = 그날 추석 마당이 걷힘 (id ' + S9.id + ' · 고치기 전 = 그대로)');
      await ev(() => SM_TOWN.game().setCal(true)); await ssec(2); S9 = await I9(); ok(S9.id === 'chu', '[E17] 다시 달력대로 = 같은 날 추석이 돌아옴 (id ' + S9.id + ')'); });

    // ── E6 옷 모양 버리기(고치기 전 판은 모자를 벗으면 마을이 깨지므로 뒤쪽에) ──
    await step('[E6]', async () => { await ev(() => { const R = SM_TOWN.rwd; R.take('work', 3); R.take('cook', 4); }); await W8(200);
      const wear = async v => { await closeAll(); await ev(() => SM_TOWN.bagOpen()); await W8(300); return ev(v9 => { const b9 = document.querySelector('.twn-p [data-rww="hat:' + v9 + '"]'); if (b9) b9.click(); return !!b9; }, v); };
      const w1 = await wear('straw'); await W8(200); const h1 = await ev(() => { const K = SD2.map.player.rig, m = K && K.head && K.head.children.find(o => o.userData && o.userData.rwd && o.userData.k === 'straw'); window.__g1d = 0; if (m) m.geometry.addEventListener('dispose', () => { window.__g1d = 1; }); return !!m; });
      ok(w1 && h1, '[E6] 밀짚모자를 씀(머리에 모자 메시)'); const w2 = await wear('chef'); await W8(200); const d = await ev(() => window.__g1d), hk = await ev(() => SM_TOWN.rwd.hat());
      ok(w2 && hk === 'chef', '[E6] 요리사 모자로 바꿈'); ok(d === 1, '[E6] 벗은 모자의 모양을 버림(dispose · 고치기 전 = 마을을 나갈 때까지 쌓임)');
      const n0 = await ev(() => SD2.map.interact.list().length); await wear('-'); await W8(2500); const n1 = await ev(() => SD2.map.interact.list().length), hk2 = await ev(() => SM_TOWN.rwd.hat());
      ok(hk2 === '' && n1 >= n0 * 0.9, '[E6+] 모자를 벗어도 마을은 그대로(E 자리 ' + n0 + ' → ' + n1 + ' · 고치기 전 = 내 모습 칠하기가 마을 setLook을 불러 마을을 다시 지음)'); });

    // ── E5 제빵 판 · 마을 나가기(마지막) ──
    await step('[E5]', async () => { await ev(() => { const G = SM_TOWN.game(); G.S.min = 9 * 60; G.mark(); }); await closeAll(); await ev(() => SM_TOWN.bake().use()); await W8(300);
      await ev(() => { const B = SM_TOWN.bake(); B.dbg.ord('milk', []); if (B.open === 'order') { const c = B.info().ord.cur; if (c) B.dbg.pickOrd(c.w); } }); await W8(300);
      const ph = await ev(() => SM_TOWN.bake().open); if (ph !== 'knead') { ok(false, '[E5] 반죽 판이 안 열림 (' + ph + ')'); return; }
      await ev(() => { window.__BK = SM_TOWN.bake(); window.__BK.dbg.stroke(11); SD2.map.game.stop('test'); }); await W8(900);
      const left = await ev(() => [...document.querySelectorAll('.twn-p')].map(q => q.textContent.slice(0, 30)).join(' | ')), ph2 = await ev(() => window.__BK.open);
      ok(!/부풀|rise/.test(left) && ph2 !== 'spot', '[E5] 마지막 반죽 직후 마을을 나가면 제빵 판이 정리됨 — 350ms 예약이 나간 뒤에 부풀 자리 판을 열지 않음 (판 ' + ph2 + ' · 창 ' + (left || '없음') + ' · 고치기 전 = 나간 뒤 spot으로 넘어감)'); });
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.slice(0, 3).join(' / ') : ''));
  } finally { await b.close(); }
}

(async () => { const T0 = Date.now(); try { await nodePart(); if (!NODE_ONLY) await browserPart(); } catch (e) { ok(false, '시험 멈춤 — ' + String(e && e.stack || e).slice(0, 300)); }
  console.log((fails.length ? '✗ ' + fails.length + '개 실패' : '✓ 모두 통과') + ' · ' + ((Date.now() - T0) / 1000).toFixed(0) + '초'); process.exit(fails.length ? 1 : 0); })();
