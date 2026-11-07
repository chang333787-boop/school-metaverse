// 🧩 건물마다 다른 할 일 시험(ENTER-3 · v2/games/town_enter2.js · docs/systems/town_enter3.md): node tools/harness/town_enter3.cjs [마을=ourtown] [포트=8002] [--shots=폴더] [--only=갈래,…] [--homes=n]
//   ① 틀 전수표: 갈래마다 틀(같은 틀 최대 갈래 수 · 틀 가짓수) ② 가게·식당·사무실·창고 갈래마다 하나씩: 들어감 → E → 판 창 → 틀린 누름 = 까닭 한 줄 → 풀기 → 끝 글 · 방 안 결과(봉투·접시·상자·초록 표) · 솜씨 + · (식당·터미널 = 걸어서 탁자·타는 곳 E) · '할 일' 첫 줄이 갈래마다 다름
//   ③ 집: 여러 동네·이웃 일 집 → 오늘의 부탁 풀기(정리 = 걸어서 · 찾기 = 헛걸음 한 줄 → 진짜 자리) · 결과 · 답례(엽서·물건) · 같은 날 다시 = 기억 말만 · 다음 날 = 다른 부탁 · 다시 들어가면 기억 말
//   ④ 집 안 모습이 이웃 일·동네로 달라짐(일 구석 · 벽 색) ⑤ 그 집만의 일(생일·이사·손님) 하나 ⑥ 모음(도운 집 n/전체 · 엽서) · 가방 🏅 글 ⑦ 페이지 오류 0 · --shots = 판·방 사진
const { chromium } = require('./pw.cjs');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const arg = k => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').slice(k.length + 3) || null;
const SHOTS = arg('shots'), ONLY = arg('only'), NH = +(arg('homes') || 8);
const URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const b = await chromium.launch({ args: ['--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  try { const p = await (await b.newContext({ viewport: { width: 1366, height: 768 } })).newPage(), errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|CORS|firebasedatabase|Failed to load resource/.test(t)) || /게임 tick 오류|꼬리표 없는 보상|\[실내\]|\[ENTER-3\]/.test(t)) errs.push(t.slice(0, 200)); });
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms), shotDir = SHOTS && require('path').resolve(SHOTS); if (shotDir) require('fs').mkdirSync(shotDir, { recursive: true });
    const panel = () => ev(() => { const P = document.querySelector('.twn-p'); return P ? { k: P.dataset.k || '', t: P.innerText.slice(0, 900) } : null; });
    const closeAll = async () => { for (let i = 0; i < 6; i++) { if (!await ev(() => !!document.querySelector('.twn-p'))) break; await ev(() => { const P = document.querySelector('.twn-p'); const b9 = P.querySelector('[data-a="x"]') || P.querySelector('[data-a="go"]') || P.querySelector('.twn-x'); if (b9) b9.click(); else document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); }); await W8(200); } };
    const toastT = () => ev(() => { const t9 = document.getElementById('toast'); return t9 && t9.style.display !== 'none' ? t9.textContent : ''; });
    const waitSaid = async re => { for (let i = 0; i < 14; i++) { const t = await toastT(); if (new RegExp(re).test(t)) return t; await W8(200); } return ''; };
    const EI = () => ev(() => SM_TOWN.ent().info()), PS = () => ev(() => SM_TOWN.ent().play.st);
    const tpA = a => ev(a => { SD2.map.player.teleport([a[0], a[1] + 0.05, a[2]]); }, a);
    const pressAt = async at => { await closeAll(); await tpA(at); await W8(420); await p.keyboard.press('KeyE'); await W8(450); };
    const E = async (k, want) => { const I = await EI(), h = I && I.extra.find(q => q.k === k); if (!h) return false; for (let t = 0; t < 3; t++) { await pressAt(h.at); if (!want || await want()) return true; } return false; };
    const enter = async i => { await closeAll(); await ev(i => SM_TOWN.indoor.enterI(i), i); try { await p.waitForFunction(() => SM_TOWN.indoor.on && !SM_TOWN.indoor.busy, null, { timeout: 9000 }); } catch (e) { return false; } await W8(350); return true; };
    const leave = async () => { await closeAll(); if (await ev(() => !!SM_TOWN.indoor.on)) { await ev(() => SM_TOWN.indoor.exit()); for (let i = 0; i < 20; i++) { await W8(200); if (!await ev(() => SM_TOWN.indoor.on)) break; } } await W8(200); };
    const solve = async () => { for (let k = 0; k < 60; k++) { const st = await PS(); if (!st || st.done) return st; await ev(() => SM_TOWN.ent().play.auto()); await W8(40); } return PS(); };
    const xp = () => ev(() => JSON.stringify(SM_TOWN.skills().xp || {}));
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.indoor && SM_TOWN.ent, null, { timeout: 480000 }); await W8(2500); await closeAll();
    await ev(() => { const G = SM_TOWN.game().S; G.story = G.story || {}; G.story.done = Object.assign(G.story.done || {}, { p0: 1, a1_1: 1 }); G.jobs = G.jobs || {}; G.jobs.fireNo = G.day; G.min = 11 * 60; SM_TOWN.rules.wx('clear'); if (G.emerg) { G.emerg.d = G.day; G.emerg.plan = []; } });
    // ① 틀 전수표
    const FR = await ev(() => SM_TOWN.ent().frames()), byF = {}; for (const [k, st, f] of FR) for (const f1 of f.split('|')) (byF[f1] = byF[f1] || []).push(k);
    const maxF = Math.max(...Object.entries(byF).filter(([f]) => f !== 'board').map(([, L]) => L.length)); console.log('    틀 ' + Object.keys(byF).length + '가지 — ' + Object.entries(byF).map(([f, L]) => f + ' ' + L.length).join(' · '));
    ok(Object.keys(byF).length >= 9, '틀 아홉 가지 이상 (' + Object.keys(byF).length + ')'); ok(maxF <= 10, '같은 틀을 쓰는 갈래 최대 10 이하 (전 30 → ' + maxF + ')');
    // ② 가게·식당·사무실·창고 갈래마다
    const C = await ev(() => SM_TOWN.indoor.census()), byCat = new Map(); for (const q of C) if (q.cat && !q.school && q.in === 'ent') { if (!byCat.has(q.cat)) byCat.set(q.cat, q); }
    const fOf = Object.fromEntries(FR.map(q => [q[0], q[2]])), cats = [...byCat.keys()].filter(k => fOf[k] && !['walk', 'board'].includes(fOf[k].split('|')[0]) && (!ONLY || ONLY.split(',').includes(k)));
    console.log('    판단 틀 갈래 ' + cats.length + '곳 시험: ' + cats.join(' · ')); const hows = new Map(); let nOk = 0, alt = 0; const bad = [], altBad = []; let shotN = 0;
    for (const k of cats) { const q = byCat.get(k), one = [], t = (c, m) => { if (!c) one.push(m); };
      await ev(() => { const G9 = SM_TOWN.game().S; G9.min = 15 * 60; G9.day += 1; }); if (!await enter(q.i)) { bad.push(k + ' 못 들어감'); console.log('    ✗ ' + k + ' 못 들어감'); continue; }
      await ev(k => { const c = SM_TOWN.ent().s().c; (c[k] = c[k] || { n: 0, last: [] }).lf = 'walk'; }, k);   /* 번갈아 내기: 바로 앞 = 걷기 → 이번 = 판단 판 */
      const x0 = await xp(), I0 = await EI(); t(I0 && I0.k === k, '갈래 ' + (I0 && I0.k));
      await E('ent:ask', async () => !!(await PS())); const P0 = await panel(); t(P0 && P0.k === 'ent3', '판 창(ent3) (' + (P0 && P0.k) + ')');
      if (P0 && P0.k === 'ent3') { const how = (P0.t.match(/할 일: ([^\n]+)/) || [])[1] || ''; hows.set(k, how); t(!!how, '「할 일」 첫 줄');
        if (shotDir && shotN < 14) { await W8(150); await p.screenshot({ path: shotDir + '/enter3_' + k + '.png' }); shotN++; }
        const w = await ev(() => SM_TOWN.ent().play.wrong()); if (w) { await W8(80); const P1 = await panel(); t(/다시|아니에요|달라요|어려워요|위험|그 전에|잘렸|밖|작게|너무|봐요/.test((P1 && P1.t) || ''), '틀린 누름 = 까닭 한 줄'); }
        const st = await solve(); t(st && st.done, '판 끝 (' + JSON.stringify(st) + ')'); const P2 = await panel(); t(P2 && /고마워요|나왔어요|같이 가/.test(P2.t), '끝 글(' + ((P2 && P2.t) || '').replace(/\s+/g, ' ').slice(0, 60) + ')'); await closeAll();
        const I2 = await EI(); if (I2.task && I2.task.slot != null) { const h = I2.extra.find(x => x.k === 'ent:s' + I2.task.slot); if (h) { const sl = I2.task.slot; await pressAt(h.at); const d = await waitSaid('✅'); t(!!d || (await ev(() => SM_TOWN.ent().dbg())).slice(-3).includes('done ' + sl), '걸어서 탁자·타는 곳 E = ✅'); } }
        const I3 = await EI(); t(I3.late > 0 || I3.shown.some(Boolean), '방 안 결과(봉투·접시·상자·초록 표) late=' + I3.late); t(!I3.task, '부탁 끝');
        await W8(150); t((await xp()) !== x0, '솜씨 +');
        if (fOf[k] !== 'tray') { await E('ent:ask', async () => !!(await panel())); const P4 = await panel(); if (P4 && P4.k === 'enttask') alt++; else altBad.push(k + ':' + (P4 && P4.k)); await closeAll(); } }
      await leave(); if (!one.length) nOk++; else bad.push(k + ' — ' + one.join(' · ')); console.log('    ' + (one.length ? '✗ ' : '✓ ') + k + ' ' + (q.name || q.sign) + ' [' + fOf[k] + ']' + (one.length ? ' — ' + one.join(' · ') : ''));
    }
    ok(nOk === cats.length, '판단 틀 갈래 ' + cats.length + '곳 모두 풀림 (' + nOk + ')' + (bad.length ? ' — ' + bad.slice(0, 5).join(' / ') : ''));
    const nAlt = cats.filter(k => fOf[k] !== 'tray').length; ok(alt === nAlt, '같은 가게에서 다음 부탁 = 다른 판 꼴(판단 판 → 걸어서 칸 찾기) (' + alt + '/' + nAlt + ')' + (altBad.length ? ' — ' + altBad.slice(0, 5).join(' ') : ''));
    const hv = [...hows.values()], dup = hv.length - new Set(hv).size; console.log('    「할 일」 첫 줄이 다른 갈래 ' + new Set(hv).size + ' / ' + hv.length); ok(dup <= 2, '「할 일」 첫 줄이 같은 갈래 2 이하 (' + dup + ')');
    // ③④ 집: 동네·이웃 일 고르게 고름 → 오늘 부탁 → 다음 날 다른 부탁
    const homes = C.filter(q => (q.cat === 'home' || q.cat === 'apt') && q.in === 'ent' && !q.school), pickH = []; { const seen = new Set(); for (const q of homes) { const key = q.reg + q.kind; if (!seen.has(key)) { seen.add(key); pickH.push(q); } } for (const q of homes) { if (pickH.length >= NH) break; if (!pickH.includes(q) && (homes.indexOf(q) % 37 === 0)) pickH.push(q); } pickH.length = Math.min(pickH.length, NH); }
    const look = new Map(), kinds = {}, R2 = []; let homeOk = 0, memOk = 0, sameDay = 0, again = 0;
    const doHome = async (q, tag) => { const one = []; const t = (c, m) => { if (!c) one.push(m); }; if (!await enter(q.i)) return { one: ['못 들어감'] }; const I = await EI(); look.set(q.i, [I.jk, I.reg]); kinds[I.plan.kind] = (kinds[I.plan.kind] || 0) + 1; const x0 = await xp(), pc0 = await ev(() => Object.keys((SM_TOWN.ent().s().pc) || {}).length), hv0 = await ev(() => Object.keys((SM_TOWN.ent().s().hv) || {}).length);
      if (shotDir && shotN < 22) { const sp = await ev(() => SM_TOWN.indoor.spawn()); if (sp) await tpA(sp); await W8(700); await p.screenshot({ path: shotDir + '/enter3_home_' + I.plan.kind + '_' + I.jk + '.png' }); shotN++; }
      const k = I.plan.kind; await E('ent:ask', async () => !!(await panel()));
      if (k === 'tidy') { await closeAll(); const I2 = await EI(); const h = I2.task && I2.extra.find(x => x.k === 'ent:s' + I2.task.slot); if (h) { await pressAt(h.at); t(!!await waitSaid('✅'), '정리 = 걸어서 제자리 E ✅'); } else t(false, '정리 부탁 없음'); }
      else if (k === 'find') { await closeAll(); const I2 = await EI(); t(I2.task && I2.task.find, '찾기 부탁'); const sp = I2.extra.filter(x => /^ent:f\d$/.test(x.k)), right = sp.find(x => +x.k.slice(5) === I2.find.at), wr = sp.find(x => x !== right); if (wr) { await pressAt(wr.at); t(!!await waitSaid('여기는 없어요'), '헛걸음 = 「여기는 없어요 · 귀띔」 한 줄'); } if (right) { await pressAt(right.at); t(!!await waitSaid('✅'), '찾음 ✅'); } }
      else { const P0 = await panel(); t(P0 && P0.k === 'ent3', '부탁 판 창 (' + (P0 && P0.k) + ')'); if (shotDir && shotN < 26) { await W8(120); await p.screenshot({ path: shotDir + '/enter3_homeplay_' + k + '.png' }); shotN++; } const st = await solve(); t(st && st.done, '판 끝'); const P2 = await panel(); t(P2 && /고마워요/.test(P2.t), '끝 글'); await closeAll(); }
      const I3 = await EI(); t(I3.late > 0 || (I3.shown || []).some(Boolean), '방 안 결과(그릇·화분·상·찾은 물건)'); await W8(120); t((await xp()) !== x0 || tag !== 'first', '솜씨 +');
      const pc1 = await ev(() => Object.keys((SM_TOWN.ent().s().pc) || {}).length), hv1 = await ev(() => Object.keys((SM_TOWN.ent().s().hv) || {}).length); t(hv1 >= hv0, '도운 집 셈'); if (tag === 'first') t(hv1 === hv0 + 1 || hv0 > 0, '도운 집 +1 (' + hv0 + '→' + hv1 + ')');
      await E('ent:ask', async () => true); const said = await waitSaid('끝났어요|충분'); if (said) sameDay++; await leave(); return { one, k, pc: pc1 - pc0 }; };
    for (const q of pickH) { await ev(() => { const G9 = SM_TOWN.game().S; G9.day += 1; G9.min = 15 * 60; }); const r1 = await doHome(q, 'first'); await ev(() => { const G9 = SM_TOWN.game().S; G9.day += 1; G9.min = 9 * 60 + 30; });
      if (!await enter(q.i)) { console.log('    ✗ 다음 날 못 들어감'); continue; } const I = await EI(); await W8(1100); const gl = (await ev(() => SM_TOWN.ent().dbg())).filter(x => /^greet /.test(x)).pop() || ''; if (/지난번|생일|이삿짐|손님/.test(gl)) memOk++; R2.push([r1.k, I.plan.kind]); if (I.plan.kind !== r1.k) again++; await leave();
      const r1ok = !r1.one.length; if (r1ok) homeOk++; console.log('    ' + (r1ok ? '✓' : '✗') + ' 집 ' + (q.name || q.sign || q.kind) + ' · ' + (look.get(q.i) || []).join('/') + ' · 첫날 ' + r1.k + ' → 다음 날 ' + I.plan.kind + (r1.pc ? ' · 엽서 +' + r1.pc : '') + (r1.one.length ? ' — ' + r1.one.join(' · ') : '')); }
    ok(homeOk === pickH.length, '집 ' + pickH.length + '채 오늘 부탁 풀림 (' + homeOk + ') · 부탁 갈래 ' + JSON.stringify(kinds));
    ok(again === R2.length, '같은 집 다음 날 = 다른 부탁 (' + again + '/' + R2.length + ')'); ok(sameDay >= Math.ceil(pickH.length * 0.7), '같은 날 다시 E = 「오늘은 끝났어요」 (' + sameDay + '/' + pickH.length + ')');
    ok(memOk === R2.length, '다음 날 들어가면 지난번 일 기억 말 (' + memOk + '/' + R2.length + ')');
    const jks = new Set([...look.values()].map(v => v[0])), regs = new Set([...look.values()].map(v => v[1])); ok(jks.size >= 3 && regs.size >= 2, '집 안 모습이 이웃 일·동네로 다름 (일 ' + [...jks].join('·') + ' · 동네 ' + [...regs].join('·') + ')');
    // ③-2 부탁 갈래 열(일곱 + 그 집만의 일 셋)을 한 번씩 — 오늘 부탁을 정해 두고(기록 pk·pd) 들어가 풂 · 이웃 일 돕기는 일이 다른 집 넷
    { const KS = ['tidy', 'cook', 'water', 'fix', 'table', 'job', 'find', 'bday', 'move', 'guest'], res = []; let jobs = new Set(), hi = 0;
      const force = async (q, kind) => { await enter(q.i); const id = (await EI()).id; await leave(); await ev(([id, kind]) => { const G = SM_TOWN.game().S; G.day += 1; G.min = 10 * 60; const s = SM_TOWN.ent().s(); const r = s.b[id] || (s.b[id] = { n: 1, d: -1, t: 0 }); r.pk = kind; r.pd = G.day; r.dd = -1; r.n = Math.max(1, r.n | 0); }, [id, kind]); };
      const run = async (q, kind) => { await force(q, kind); if (!await enter(q.i)) return 'enter'; const I = await EI(); if (!I.plan || I.plan.kind !== kind) return 'plan ' + (I.plan && I.plan.kind); if (kind === 'job') jobs.add(I.jk);
        await E('ent:ask', async () => !!(await panel())); if (kind === 'tidy') { await closeAll(); const I2 = await EI(); const h = I2.task && I2.extra.find(x => x.k === 'ent:s' + I2.task.slot); if (!h) return 'notask'; await pressAt(h.at); }
        else if (kind === 'find') { await closeAll(); const I2 = await EI(); const h = I2.extra.find(x => x.k === 'ent:f' + I2.find.at); if (!h) return 'nospot'; await pressAt(h.at); }
        else { if (shotDir && shotN < 34) { await W8(120); await p.screenshot({ path: shotDir + '/enter3_force_' + kind + '.png' }); shotN++; } const st = await solve(); if (!st || !st.done) return 'unsolved'; await closeAll(); }
        await W8(250); const I3 = await EI(), sd = await ev(id => (SM_TOWN.ent().s().b[id] || {}).dd, I3.id), dd = await ev(() => SM_TOWN.game().S.day); await leave(); return sd === dd && (I3.late > 0 || (I3.shown || []).some(Boolean)) ? '' : 'nores'; };
      for (const kind of KS) { const q = homes[(37 + hi * 53) % homes.length]; hi++; res.push([kind, await run(q, kind)]); }
      { const seenR = new Set(), JH = []; for (const q of homes) { if (JH.length >= 4) break; if (!seenR.has(q.reg)) { seenR.add(q.reg); JH.push(q); } } for (let j = 0; j < JH.length; j++) res.push(['job+' + JH[j].reg, await run(JH[j], 'job')]); }
      const badK = res.filter(r => r[1]); console.log('    부탁 갈래 풀기: ' + res.map(r => r[0] + (r[1] ? '✗' + r[1] : '✓')).join(' · ') + ' · 이웃 일 ' + [...jobs].join('·'));
      ok(!badK.length, '부탁 갈래 열(일곱 + 그 집만의 일 셋) + 이웃 일 넷 모두 풀림 · 결과 남음' + (badK.length ? ' — ' + badK.map(r => r.join(':')).join(' ') : '')); }
    // ⑤ 그 집만의 일 하나(날을 골라 생일·이사·손님이 되는 날)
    { const q = homes[3] || homes[0]; await enter(q.i); const id = (await EI()).id; await leave();
      const day = await ev(async id => { const M9 = await import('/v2/games/town_enter2.js'); const G = SM_TOWN.game().S; for (let d = G.day + 1; d < G.day + 400; d++) { const P = M9.homePlan({ id, day: d, min: 600, n: 1, pk: null, pd: -1 }); if (P.ev) return [d, P.ev]; } return null; }, id).catch(e => 'ERR ' + e.message);
      if (Array.isArray(day)) { await ev(([d, id]) => { const G = SM_TOWN.game().S; G.day = d; G.min = 10 * 60; const r = SM_TOWN.ent().s().b[id]; if (r) { r.pd = -1; r.pk = null; r.n = Math.max(1, r.n); } }, [day[0], id]); await enter(q.i); const I = await EI(); ok(I.plan && I.plan.ev === day[1], '그 집만의 일 = ' + day[1] + ' (들어가면 소품 · ' + (I.plan && I.plan.kind) + ')');
        if (shotDir) { const sp = await ev(() => SM_TOWN.indoor.spawn()); if (sp) await tpA(sp); await W8(800); await p.screenshot({ path: shotDir + '/enter3_event_' + day[1] + '.png' }); }
        await E('ent:ask', async () => !!(await panel())); const st = await solve(); ok(st && st.done, '그 집만의 일 판 풀림'); await closeAll(); await leave(); } else ok(false, '그 집만의 일 날 찾기 (' + day + ')'); }
    // ⑥ 모음
    { const s9 = await ev(() => { const s = SM_TOWN.ent().s(); return { hv: Object.keys(s.hv || {}).length, pc: Object.keys(s.pc || {}).length, ck: Object.keys(s.ck || {}).length }; }), h = await ev(() => SM_TOWN.ent().colHtml());
      ok(s9.hv >= homeOk && /도운 집 \d+<\/b> \/ \d+/.test(h), '모음 도운 집 ' + s9.hv + ' · 엽서 ' + s9.pc + ' · 가게 갈래 ' + s9.ck + ' — 가방 글에 n / 전체'); ok(s9.pc >= 1, '엽서 하나 이상'); }
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.slice(0, 4).join(' | ') : ''));
  } catch (e) { fails.push('예외 ' + e.message); console.log(e); }
  await b.close(); console.log(fails.length ? '\n✗ ' + fails.length + '개 실패' : '\n✓ 모두 통과'); process.exit(fails.length ? 1 : 0); })();
