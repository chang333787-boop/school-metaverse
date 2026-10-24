// 아침 소식판 시험(MORNING-1 · 설계 docs/systems/town_phase1.md 「아침 소식판」 · 조각 3): node tools/harness/town_news.cjs [마을=ourtown] [포트=8002] [--shots=폴더]
//   ① 1일째: 화분 심고 물 + 이웃에게 선물 → 스스로 잠 → 아침: 칠판 ①번 줄 = 화분 결과 · 문 앞 선물 보임 · E로 주우면 가방 · 아침 자동 창 0 · 아침 알림 ≤ 2
//   ② 줄 근거 100%(줄마다 그 자리·상태에 실제로 있음) · 소문 = 뽑힌 일꾼 둘이 실제로 서 있음 · 6m 안에 가면 말풍선 · newsMake ≤ 5ms
//   ③ 2일째: 비 오는 날 화분에 물 → 아침 '빗물로 넉넉했어요'(우와 ①) · 3일째 아무것도 안 함 → 빈 날 0
//   ④ 봇 3일(차례표 8줄 측정): 아침마다 고를 거리(할 일 · 소문 · 화분 · 선물 — 동사·칸이 다른 것) ≥ 3 · 어제와 다른 것 ≥ 2 · 빈 날 0 · 숫자를 결과로
//   ⑤ 해 질 녘: 종 + 배너 한 줄 · 문 앞 등 · 페이지 오류 0
const { chromium } = require('./pw.cjs');   /* FAST-1: 기본 그리기 끔(norender) · 사진·프레임은 --render(docs/systems/town_gates.md) */
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const SHOTS = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8) || null, URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  try { const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(), errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160))); p.on('console', m => { const t = m.text(); if (/게임 tick 오류/.test(t)) errs.push(t.slice(0, 160)); });
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
    const shot = async n => { if (!SHOTS) return; await p.screenshot({ path: SHOTS + '/' + n + '.png' }); };
    const closeAll = async () => { for (let i = 0; i < 4; i++) { const o = await ev(() => !!document.querySelector('.twn-p')); if (!o) break; await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); await W8(250); if (await ev(() => !!document.querySelector('.twn-p'))) { await p.keyboard.press('Escape'); await W8(250); } } };
    const tp = (x, z) => ev(([x, z]) => { const M = SD2.map, g = M.q.groundAt(x, z, SM_TOWN.ground(x, z) + 2); M.player.teleport([x, g + 0.05, z]); }, [x, z]);
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.home && SM_TOWN.news, null, { timeout: 240000 }); await W8(1500); await closeAll(); await W8(2500);
    await ev(() => { const G = SM_TOWN.game().S; G.min = 9 * 60; G.jobs = G.jobs || {}; G.jobs.fireNo = G.day; G.story = G.story || {}; G.story.p0auto = 1; SM_TOWN.weather('clear'); });
    await ev(() => { window.__NL = []; new MutationObserver(L => { for (const r of L) { const t = r.target.nodeType === 3 ? r.target.parentNode : r.target; if (!t || (t.id !== 'toast' && t.id !== 'hudBan')) continue; const m = t.textContent || ''; if (m) window.__NL.push({ k: t.id === 'toast' ? 'toast' : 'banner', m, t: performance.now() }); } }).observe(document.body, { subtree: true, childList: true, characterData: true }); });   /* 화면에 실제로 뜬 알림 글(토스트·배너 칸)을 셈 */
    const H = await ev(() => SM_TOWN.home()); if (!H.id) throw new Error('우리 집 없음'); const fw = H.fw || [0, 1], D = H.door;
    const N0 = await ev(() => SM_TOWN.news()); ok(!!N0.at && !!N0.at.board, '현관 칠판 있음 ' + JSON.stringify(N0.at));
    const water = async rain => { await ev(r => { const G9 = SM_TOWN.game().S; G9.min = 10 * 60; SM_TOWN.weather(r ? 'rain' : 'clear'); }, rain); await W8(500);
      const st = await ev(() => SM_TOWN.home().pots[0]); if (!st) { await ev(() => SM_TOWN.potUse(0)); await W8(300); await ev(() => { const b9 = document.querySelector('.twn-p button[data-c]'); if (b9) b9.click(); }); await W8(300); }
      await ev(() => SM_TOWN.potUse(0)); await W8(300); return ev(() => SM_TOWN.home().pots[0]); };
    // 잠(스스로 · 하루 마무리 창 → 닫기) → 아침 9초 동안 창·알림 지켜보기
    const sleepWatch = async () => { await tp(D[0] + fw[0] * 4, D[1] + fw[1] * 4); await W8(300); await ev(() => { SM_TOWN.sleep({ ask: true }); return null; }); await W8(900); await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); const t0 = await ev(() => performance.now()); await W8(2000);
      let auto = 0; const seen = []; for (let i = 0; i < 24; i++) { const o = await ev(() => { const P = document.querySelector('.twn-p'); return P ? (P.querySelector('h3') || P).textContent.slice(0, 40) : null; }); if (o) { auto++; seen.push(o); await closeAll(); } await W8(300); }
      const NL = await ev(t => window.__NL.filter(q => q.t > t && !/잘 자요|쿨쿨|Good night/.test(q.m)).map(q => q.k + ':' + q.m.slice(0, 60)), t0); return { auto, seen, NL, N: await ev(() => SM_TOWN.news()), day: await ev(() => SM_TOWN.game().S.day) }; };
    const proof = async N => ev(N => { const T = SM_TOWN, G = T.game(), S = G.S, d = S.day, Hm = T.home(), bad = [], W = T.workers().map(a => ({ x: a[1], z: a[2], k: a[4] })), nearW = (a, r) => a && W.some(w => Math.hypot(w.x - a[0], w.z - a[1]) < r);
      const wxOf = { '비': 'rain', '눈': 'snow' };
      for (const L of N.lines) { const c = L.ck || {}; let y = true;
        if (/^pot|^rainw/.test(L.k)) y = Hm.pots.some(q => q && (!c.c || q.c === c.c) && (c.pot === 'ripe' ? q.st === 'ripe' : c.pot === 'grow' ? q.g === c.g : c.pot === 'water' ? q.st === 'water' : q.g >= 1));
        else if (L.k === 'gift') y = !!(N.gift && N.giftVis && !N.giftOff);
        else if (L.k === 'farm') y = (S.farm || []).some(q => q && q.c === c.c);
        else if (L.k === 'pol') y = S.pol === d; else if (L.k === 'jang') y = T.jangNow(); else if (L.k === 'jang1') y = (d + 1) % 5 === 0;
        else if (L.k === 'sea') y = G.seasonAt(d + 1) !== G.season(); else if (L.k === 'board') y = !!(S.story && S.story.board && S.story.board.nw && S.story.board.nw.d === d);
        else if (L.k === 'twig') y = S.resRain === d; else if (L.k === 'mush') y = N.mush; else if (L.k === 'wx') y = (wxOf[c.wx] || 'clear') === N.wx;
        else if (L.k === 'sold') y = S.yday && S.yday.sold > 0; else if (L.k === 'shared') y = S.yday && S.yday.shared > 0; else if (L.k === 'sap') y = (S.sap || []).some(q => q && q[3] === d - 1);
        if (!y) bad.push('줄 ' + L.k + ': ' + L.t); }
      const HB = T.ask && T.ask.hubs ? T.ask.hubs() : []; for (const r of N.rum || []) { let y = r.hub != null ? !!HB[r.hub] && Math.hypot(HB[r.hub].x - r.wx, HB[r.hub].z - r.wz) < 2 : nearW([r.wx, r.wz], 1.5);   /* HUB-1: 모이는 곳 소문 = 그곳을 지나는 사람이 말함(일꾼 자리 대신 모이는 곳 자리) */
        if (r.k === 'jang') y = y && T.jangNow() && nearW(r.at, 3); else if (r.k === 'pol' || r.k === 'nb') y = y && nearW(r.at, 3); else if (r.k === 'tide') y = y && N.shore && !!r.at; else if (r.k === 'ripe') y = y && (S.farm || []).some(q => q && q.g >= 3); else y = y && !!r.at;
        if (!y) bad.push('소문 ' + r.k + ': ' + r.t); }
      return { n: N.lines.length + (N.rum || []).length, bad }; }, N);
    // 아침 고를 거리(동사 · 칸) — route로 갈 수 있는 것만
    const choices = async () => ev(() => { const T = SM_TOWN, S = T.game().S, N = T.news(), Hm = T.home(), out = [], ck = a => a ? Math.round(a[0] / 40) + ':' + Math.round(a[1] / 40) : '-';
      const L = S.tasks && S.tasks.day === S.day ? S.tasks.list : T.tasksNow(); for (const t of L) if (!t.done) out.push({ v: 'task:' + t.ev, c: t.cell || ck(t.at), at: t.at });
      for (const r of N.rum || []) out.push({ v: 'rumor:' + r.k.split(':')[0], c: ck(r.at), at: r.at });
      for (const q of Hm.pots) if (q) out.push({ v: q.st === 'ripe' ? 'pick' : q.st === 'water' ? 'water' : 'look', c: 'home', at: Hm.e }); else out.push({ v: 'plant', c: 'home', at: Hm.e });
      if (N.gift && N.giftVis) out.push({ v: 'pickup', c: 'home', at: Hm.e });
      const keep = [], K = new Set(); for (const o of out) { const k = o.v + '@' + o.c; if (K.has(k) || o.v === 'look') continue; const r = !o.at || T.path(Hm.e, o.at, '시험'); T.pathOff(); if (!r) continue; K.add(k); keep.push(k); } return keep; });
    const days = [];
    // ── 1일째: 화분 + 선물 ──
    const pz = await water(false); ok(pz && pz.st === 'grow', '1일째 화분 심고 물(' + JSON.stringify(pz) + ')');
    const wk = await ev(() => { const W = SM_TOWN.workers().map(a => ({ role: a[0], x: a[1], z: a[2], k: a[4] })).filter(w => ['pear', 'strawberry', 'potato', 'cabbage', 'beehive', 'shiitake', 'saltpan', 'fisher', 'clam', 'pasture', 'paddy'].includes(w.k)); const h = SM_TOWN.home().e; W.sort((a, b) => Math.hypot(a.x - h[0], a.z - h[1]) - Math.hypot(b.x - h[0], b.z - h[1])); return W[0] || null; });
    ok(!!wk, '선물 줄 일꾼 ' + JSON.stringify(wk));
    if (wk) { await tp(wk.x + 1.5, wk.z); await W8(500); await ev(() => { SM_TOWN.game().add('🍞', 1); SM_TOWN.rules.gift('🍞'); }); await W8(400); await closeAll(); }
    const nb1 = await ev(() => SM_TOWN.game().S.today.nb); ok(!!nb1 && nb1.why === 'gift', '어제 이웃 기록(선물) ' + JSON.stringify(nb1));
    let M = await sleepWatch(); console.log('  2일째 아침 칠판: ' + M.N.lines.map(L => L.t).join(' / ') + ' · 소문: ' + (M.N.rum || []).map(r => r.t).join(' / ') + ' · 알림: ' + JSON.stringify(M.NL));
    ok(M.N.d === M.day, '아침 소식을 만듦(' + M.day + '일째)'); ok(M.N.lines.length === 1, '처음 사흘 = 칠판 한 줄 (' + M.N.lines.length + ')');
    ok(M.N.lines[0] && /^pot|^rainw/.test(M.N.lines[0].k), "①번 줄 = 어제 물 준 화분 결과 ('" + (M.N.lines[0] && M.N.lines[0].t) + "')");
    ok(M.auto === 0, '아침에 저절로 뜨는 창 0' + (M.seen.length ? ' — ' + M.seen.join(' | ') : '')); ok(M.NL.length <= 2, '아침 알림 ≤ 2 (' + M.NL.length + ')');
    ok(M.N.gift && M.N.giftVis && !M.N.giftOff, '문 앞 선물 보임 ' + JSON.stringify(M.N.gift));
    let P1 = await proof(M.N); ok(!P1.bad.length, '줄·소문 근거 ' + (P1.n - P1.bad.length) + '/' + P1.n + (P1.bad.length ? ' — ' + P1.bad.join(' | ') : ''));
    ok(M.N.ms <= 5, 'newsMake ' + M.N.ms + 'ms ≤ 5 (모으기 포함 ' + M.N.all + 'ms)');
    days.push({ day: M.day, lines: M.N.lines.map(L => L.k), rum: (M.N.rum || []).map(r => r.k), ch: await choices() });
    // 칠판 · 선물 캡처
    { const bd = M.N.at.board; await tp(bd[0] + fw[0] * 3.2, bd[1] + fw[1] * 3.2); await ev(a => SD2.map.player.lookAt(a), bd); await W8(900); await shot('01_morning_board'); const g9 = M.N.at.gift; await tp(g9[0] + fw[0] * 2.6, g9[1] + fw[1] * 2.6); await ev(a => SD2.map.player.lookAt(a), g9); await W8(700); await shot('02_door_gift'); }
    // E로 줍기
    { const g9 = M.N.at.gift, e0 = M.N.gift.e, n0 = await ev(e => SM_TOWN.game().count(e), e0); await tp(g9[0], g9[1]); await W8(500); const lab = await ev(() => { const h = SD2.map.interact.list().filter(h => !h.off && /선물 줍기/.test(h.label)); return h.length ? h[0].label : null; }); ok(!!lab, "E '" + lab + "'");
      await p.keyboard.press('KeyE'); await W8(600); const n1 = await ev(e => SM_TOWN.game().count(e), e0), N1 = await ev(() => SM_TOWN.news()); ok(n1 === n0 + 1 && !N1.gift && !N1.giftVis, 'E로 주움 → 가방 ' + e0 + ' ' + n0 + '→' + n1 + ' · 문 앞 비움'); }
    // 소문 말풍선
    { const N = await ev(() => SM_TOWN.news()); if (N.rum && N.rum.length) { const ri = N.rum.findIndex(q => q.hub == null), r = N.rum[ri < 0 ? 0 : ri]; if (r.hub == null) { await tp(r.wx + fw[0] * 3.5, r.wz + fw[1] * 3.5); await ev(a => SD2.map.player.lookAt(a), [r.wx, r.wz]); await W8(2300); } else for (let k = 0; k < 12 && !(await ev(i9 => SM_TOWN.news().rum[i9].said, ri < 0 ? 0 : ri)); k++) { const q = await ev(h => SM_TOWN.ask.pedAt(h), r.hub); if (q) await tp(q[0] + 2, q[1] + 2); else await tp(r.wx + 4, r.wz + 4); await W8(1500); }   /* 모이는 곳 소문 = 그곳 사람에게 다가감 */ const s9 = await ev(i9 => SM_TOWN.news().rum[i9].said, ri < 0 ? 0 : ri); ok(s9 === M.day, "소문 말풍선(6m 안) '" + r.t + "'"); await W8(300); await shot('03_rumor_bubble'); } else ok(false, '소문 일꾼 없음'); }
    // CPU 4× newsMake
    { const cdp = await p.context().newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 }); const ms = []; for (let i = 0; i < 3; i++) ms.push(await ev(() => { const S = SM_TOWN.game().S, keep = JSON.stringify(S.news), kg = JSON.stringify(S.home.gift); S.news.d = 0; S.news.gd = S.day; SM_TOWN.newsRun(false); const N = SM_TOWN.news(), o = [N.ms, N.all]; S.news = JSON.parse(keep); S.home.gift = JSON.parse(kg); return o; })); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
      ms.sort((a, c) => a[1] - c[1]); console.log('  CPU 4× newsMake ' + ms.map(q => q[0]).join(' / ') + 'ms · 모으기 포함 ' + ms.map(q => q[1]).join(' / ') + 'ms'); ok(ms[1][0] <= 5, 'CPU 4× newsMake 가운데값 ' + ms[1][0] + 'ms ≤ 5'); }
    // ── 2일째: 비 오는 날 물 주기 + 장터 팔기(셈만) ──
    const pz2 = await water(true); ok(pz2 && pz2.w === M.day, '2일째 비 오는 날 화분에 물(' + JSON.stringify(pz2) + ')'); await ev(() => SM_TOWN.game().tally('sold', 3));
    M = await sleepWatch(); console.log('  3일째 아침 칠판: ' + M.N.lines.map(L => L.t).join(' / ') + ' · 소문: ' + (M.N.rum || []).map(r => r.t).join(' / ') + ' · 알림: ' + JSON.stringify(M.NL));
    ok(M.N.lines[0] && M.N.lines[0].k === 'rainw', "비 온 날 물 → '빗물로 넉넉했어요'('" + (M.N.lines[0] && M.N.lines[0].t) + "')"); ok(M.auto === 0 && M.NL.length <= 2, '3일째 아침 창 ' + M.auto + ' · 알림 ' + M.NL.length);
    P1 = await proof(M.N); ok(!P1.bad.length, '3일째 근거 ' + (P1.n - P1.bad.length) + '/' + P1.n + (P1.bad.length ? ' — ' + P1.bad.join(' | ') : ''));
    days.push({ day: M.day, lines: M.N.lines.map(L => L.k), rum: (M.N.rum || []).map(r => r.k), ch: await choices() });
    // ── 3일째: 아무것도 안 함 ──
    await ev(() => SM_TOWN.weather('clear')); M = await sleepWatch(); console.log('  4일째 아침 칠판: ' + M.N.lines.map(L => L.t).join(' / ') + ' · 소문: ' + (M.N.rum || []).map(r => r.t).join(' / ') + ' · 알림: ' + JSON.stringify(M.NL));
    ok(M.N.lines.length >= 1, '아무것도 안 한 다음 날도 칠판 줄 ' + M.N.lines.length); ok(M.day < 4 || M.N.lines.length === 2, '나흘째부터 두 줄'); ok(M.auto === 0 && M.NL.length <= 2, '4일째 아침 창 ' + M.auto + ' · 알림 ' + M.NL.length);
    P1 = await proof(M.N); ok(!P1.bad.length, '4일째 근거 ' + (P1.n - P1.bad.length) + '/' + P1.n + (P1.bad.length ? ' — ' + P1.bad.join(' | ') : ''));
    const L2 = M.N.lines.map(L => L.k); ok(L2.every(k => !days[days.length - 1].lines.includes(k) || /^pot|^farm|^gift/.test(k)), '같은 갈래 이틀 연속 X (' + days[days.length - 1].lines.join(',') + ' → ' + L2.join(',') + ')');
    days.push({ day: M.day, lines: L2, rum: (M.N.rum || []).map(r => r.k), ch: await choices() });
    { const bd = M.N.at.board; await tp(bd[0] + fw[0] * 3.2, bd[1] + fw[1] * 3.2); await ev(a => SD2.map.player.lookAt(a), bd); await W8(900); await shot('04_board_two_lines'); }
    // 봇 3일 숫자
    let empty = 0, minN = 99, minD = 99; days.forEach((D9, i) => { const n = D9.ch.length, dif = i ? D9.ch.filter(k => !days[i - 1].ch.includes(k)).length : n; minN = Math.min(minN, n); if (i) minD = Math.min(minD, dif); if (!n || !D9.lines.length) empty++; console.log('  · ' + D9.day + '일째 아침 고를 거리 ' + n + ' (어제와 다른 것 ' + dif + ') ' + D9.ch.join(' ') + ' · 칠판 ' + D9.lines.join(',') + ' · 소문 ' + D9.rum.join(',')); });
    console.log('  봇3일 결과 ' + JSON.stringify({ minChoices: minN, minNew: minD, emptyDays: empty }));
    ok(minN >= 3, '아침마다 고를 거리 ≥ 3 (가장 적은 날 ' + minN + ')'); ok(minD >= 2, '어제와 다른 것 ≥ 2 (가장 적은 날 ' + minD + ')'); ok(empty === 0, '빈 날 0 (' + empty + ')');
    // 해 질 녘
    await ev(() => { SM_TOWN.game().S.home.dk = 0; window.__NL.length = 0; }); await tp(D[0] + fw[0] * 6, D[1] + fw[1] * 6); await ev(a => SD2.map.player.lookAt(a), D); await ev(() => SD2.map.time && SD2.map.time('sunset')); await W8(1600);
    const dk = await ev(() => ({ lit: SM_TOWN.home().lit, NL: window.__NL.map(q => q.k + ':' + q.m) })); ok(dk.lit === true && dk.NL.some(m => /^banner:.*해가 져요/.test(m)), "해 질 녘 = 등 + 배너 '" + (dk.NL.find(m => /해가 져요/.test(m)) || '') + "'"); await W8(300); await shot('05_dusk'); await ev(() => SD2.map.time && SD2.map.time('day'));
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.join(' | ') : ''));
  } catch (e) { fails.push('하네스 예외 ' + e.message.split('\n')[0]); console.log('  ✗ 하네스 예외 ' + e.message.split('\n')[0]); } finally { await b.close(); }
  console.log(fails.length ? 'FAIL ' + fails.length : 'PASS'); process.exit(fails.length ? 1 : 0); })();
