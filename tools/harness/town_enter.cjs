// 🚪 거의 모든 건물에 들어가기 시험(ENTER-1 · v2/games/town_enter.js): node tools/harness/town_enter.cjs [마을=ourtown] [포트=8002] [--shots=폴더] [--render]
//   ① 셈: 건물 갈래(간판 이름 · 집 · 아파트) 가운데 들어가는 갈래 전·후(목표 90% 이상) · 건물 수 전·후
//   ② 갈래마다 하나씩: 문 E 이름표 · 들어감 · 방 E 자리 모두 닿음(indoor.check) · 할 일(부탁 → 틀린 칸 = 한 줄 → 맞는 칸 = 보이는 결과 · 퀴즈 셋 · 진열 돕기 · 게시판) · 문 E로 나옴
//   ③ 밤 잠김(집 22:00 · 가게 닫은 때) ④ 열 번 드나들기 힙(늘지 않음) ⑤ 페이지 오류 0 · ⑥ --shots = 실내 사진(그리기 켬)
const { chromium } = require('./pw.cjs');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const SHOTS = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8) || null, ONLY = (process.argv.find(a => a.startsWith('--only=')) || '').slice(7) || null;
const URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const b = await chromium.launch({ args: ['--disable-renderer-backgrounding', '--disable-background-timer-throttling', '--js-flags=--expose-gc', '--enable-precise-memory-info'] });
  try { const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(), errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|CORS|firebasedatabase|Failed to load resource/.test(t)) || /게임 tick 오류|꼬리표 없는 보상|\[실내\]/.test(t)) errs.push(t.slice(0, 200)); });
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
    const panel = () => ev(() => { const P = document.querySelector('.twn-p'); return P ? { k: P.dataset.k || '', t: P.innerText.slice(0, 600) } : null; });
    const closeAll = async () => { for (let i = 0; i < 5; i++) { if (!await ev(() => !!(document.querySelector('.twn-p') || document.querySelector('.twn-dlg')))) break; await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p [data-a="go"]'); if (b9) b9.click(); }); await W8(250); if (await ev(() => !!(document.querySelector('.twn-p') || document.querySelector('.twn-dlg')))) { await p.keyboard.press('Escape'); await W8(250); } } };
    const toastT = () => ev(() => { const t9 = document.getElementById('toast'); return t9 && t9.style.display !== 'none' ? t9.textContent : ''; });
    const waitSaid = async re => { for (let i = 0; i < 12; i++) { const t = await toastT(); if (new RegExp(re).test(t)) return t; await W8(200); } return ''; };
    const EI = () => ev(() => SM_TOWN.ent().info());
    const tpA = a => ev(a => { SD2.map.player.teleport([a[0], a[1] + 0.05, a[2]]); }, a);
    const pressAt = async at => { await closeAll(); await tpA(at); await W8(450); await p.keyboard.press('KeyE'); await W8(500); };
    const E = async (k, want) => { const I = await EI(), h = I && I.extra.find(q => q.k === k); if (!h) return false; for (let t = 0; t < 3; t++) { await pressAt(h.at); if (!want || await want()) return true; } return false; };
    const enter = async q => { await closeAll(); await ev(i => SM_TOWN.indoor.enterI(i), q.i); try { await p.waitForFunction(() => SM_TOWN.indoor.on && !SM_TOWN.indoor.busy, null, { timeout: 8000 }); } catch (e) { return false; } await W8(350); return true; };
    const leaveDoor = async () => { const R9 = await ev(() => SM_TOWN.indoor.room); if (!R9) return false; await closeAll(); await tpA([R9.at[0], R9.at[1], R9.at[2] + R9.D / 2 - 0.9]); await W8(450); await p.keyboard.press('KeyE'); for (let i = 0; i < 20; i++) { await W8(200); if (!await ev(() => SM_TOWN.indoor.on)) return true; } return false; };
    const leave = async () => { if (await ev(() => !!SM_TOWN.indoor.on)) { await ev(() => SM_TOWN.indoor.exit()); for (let i = 0; i < 20; i++) { await W8(200); if (!await ev(() => SM_TOWN.indoor.on)) break; } } await W8(250); };
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.indoor && SM_TOWN.ent, null, { timeout: 240000 }); await W8(2500); await closeAll();
    await ev(() => { const G = SM_TOWN.game().S; G.story = G.story || {}; G.story.done = Object.assign(G.story.done || {}, { p0: 1, a1_1: 1 }); G.jobs = G.jobs || {}; G.jobs.fireNo = G.day; G.min = 11 * 60; SM_TOWN.rules.wx('clear'); if (G.emerg) { G.emerg.d = G.day; G.emerg.plan = []; } });
    // ① 셈
    const C = await ev(() => SM_TOWN.indoor.census()), NB = ['green', 'park', 'play', 'pitch', 'school'];
    const bl = C.filter(q => !NB.includes(q.kind) && !q.school), gOf = q => q.name || q.sign || (q.kind === 'house' ? '집' : q.kind === 'apt' ? '아파트' : q.kind === 'public' ? '(이름 없는 공공건물)' : q.kind);
    const G = new Map(); for (const q of bl) { const g = gOf(q); const r = G.get(g) || { n: 0, b0: 0, b1: 0 }; r.n++; if (q.in0) r.b0++; if (q.in) r.b1++; G.set(g, r); }
    const gs = [...G.entries()], g0 = gs.filter(([, r]) => r.b0 > 0).length, g1 = gs.filter(([, r]) => r.b1 > 0).length, n0 = bl.filter(q => q.in0).length, n1 = bl.filter(q => q.in).length;
    console.log('    갈래 ' + gs.length + ' · 들어가는 갈래 전 ' + g0 + ' → 후 ' + g1 + ' (' + Math.round(g1 / gs.length * 100) + '%) · 건물 ' + bl.length + ' · 들어가는 건물 전 ' + n0 + ' → 후 ' + n1 + ' (' + Math.round(n1 / bl.length * 100) + '%)');
    console.log('    못 들어가는 갈래: ' + gs.filter(([, r]) => !r.b1).map(([g, r]) => g + '(' + r.n + ')').join(' · '));
    ok(g1 / gs.length >= 0.9, '갈래 기준 90% 이상이 들어감 (' + g1 + '/' + gs.length + ')');
    ok(n1 / bl.length >= 0.9, '건물 수 기준 90% 이상이 들어감 (' + n1 + '/' + bl.length + ')');
    if (process.env.ENT_CENSUS) require('fs').writeFileSync(process.env.ENT_CENSUS, JSON.stringify(gs.map(([g, r]) => [g, r.n, r.b0, r.b1, (bl.find(q => gOf(q) === g) || {}).cat || (bl.find(q => gOf(q) === g) || {}).in || null])));
    // ② 갈래마다 하나씩
    const byCat = new Map(); for (const q of C) if (q.cat && !q.school) { if (!byCat.has(q.cat)) byCat.set(q.cat, q); }
    const labs = await ev(() => SD2.map.interact.list().map(h => h.label).filter(t => /들어가기 — /.test(t || '')));
    ok(labs.some(t => / · 손님 꽃 찾아 주기|정리 돕기|주문 나르기/.test(t)), '문 E 이름표에 할 일 (' + labs.filter(t => /정리 돕기|주문 나르기|찾아 주기/.test(t)).slice(0, 3).join(' / ') + ')');
    const cats = [...byCat.keys()].filter(k => !ONLY || ONLY.split(',').includes(k)); console.log('    갈래 ' + cats.length + '곳 시험: ' + cats.join(' · '));
    const shotDir = SHOTS && require('path').resolve(SHOTS); if (shotDir) require('fs').mkdirSync(shotDir, { recursive: true });
    let nOk = 0; const bad = [];
    for (const k of cats) { const q = byCat.get(k), one = []; const t = (c, m) => { if (!c) one.push(m); };
      await ev(() => { const G9 = SM_TOWN.game().S; G9.min = 15 * 60; G9.day += 1; });   /* 갈래마다 새 날(솜씨 하루 몫·한도는 날마다) */ await closeAll();
      if (!await enter(q)) { bad.push(k + ' 들어가지 못함'); ok(false, k + ' ' + (q.name || q.sign || q.kind) + ' 들어감'); continue; }
      const c = await ev(() => SM_TOWN.indoor.check()), nf = (c && c.hots || []).filter(h => h.ok === false).map(h => h.label); t(c && c.spawnFree && !nf.length, '닿지 않는 E ' + nf.join('/'));
      const I = await EI(); t(I && I.k === k, '갈래 ' + (I && I.k));
      if (shotDir) { await closeAll(); const sp = await ev(() => SM_TOWN.indoor.spawn()); if (sp) await tpA(sp); await W8(900); await p.screenshot({ path: shotDir + '/ent_' + k + '.png' }); }
      const xp0 = await ev(() => JSON.stringify(SM_TOWN.skills().xp || {}));
      if (I.extra.some(h => h.k === 'ent:ask')) {
        await E('ent:ask', async () => ((await panel()) || {}).k === 'enttask'); const P0 = await panel(); t(P0 && P0.k === 'enttask' && /할 일/.test(P0.t), '부탁 창 「할 일」');
        await closeAll(); let I2 = await EI(); t(I2.task && I2.task.slot != null, '부탁이 정해짐'); const si = I2.task ? I2.task.slot : 0, wrong = I2.extra.filter(h => /^ent:s\d$/.test(h.k)).find(h => +h.k.slice(5) !== si);
        if (wrong) { await pressAt(wrong.at); const w = await waitSaid('아니에요|다시'); t(!!w, '틀린 칸 = 한 줄'); I2 = await EI(); t(I2.task && I2.task.slot === si, '틀려도 부탁은 그대로'); }
        const right = I2.extra.find(h => h.k === 'ent:s' + si); if (right) { await pressAt(right.at); const d = await waitSaid('✅'); t(!!d, '맞는 칸 = ✅ 한 줄'); const I3 = await EI(); t(!I3.task, '부탁 끝'); t(I3.shown.some(Boolean), '보이는 결과(봉투·접시·제자리·표)'); if (I3.mess.length) t(!I3.mess.some(Boolean), '바닥에 놓인 것이 치워짐'); }
      } else if (I.extra.some(h => h.k === 'ent:quiz')) {
        await E('ent:quiz', async () => ((await panel()) || {}).k === 'entquiz'); let P0 = await panel(); t(P0 && /1\/3/.test(P0.t), '퀴즈 창 1/3');
        const pos = []; for (let i = 0; i < 3; i++) { const ix = await ev(() => [...document.querySelectorAll('.twn-p button[data-q]')].findIndex(b9 => b9.dataset.q === '0')); pos.push(ix); if (i === 0) { await ev(() => { const b9 = document.querySelector('.twn-p button[data-q="1"]'); if (b9) b9.click(); }); await W8(150); t(/다시 생각/.test(((await panel()) || {}).t || ''), '틀린 답 = 까닭 + 다시'); } await ev(() => document.querySelector('.twn-p button[data-q="0"]').click()); await W8(200); }
        P0 = await panel(); t(P0 && /셋 다/.test(P0.t), '셋 다 = 끝 한 줄'); t(!(pos[0] === pos[1] && pos[1] === pos[2]), '정답 자리 세 번 같지 않음 (' + pos.join(',') + ')'); const I3 = await EI(); t(I3.shown.some(Boolean), '칠판 별');
      } else if (I.extra.some(h => h.k === 'ent:board')) { await E('ent:board', async () => !!(await panel())); const P0 = await panel(); t(!!P0, '게시판 창 (' + (P0 && P0.k) + ')');
      } else if (k === 'store') { const r9 = await ev(() => SM_TOWN.indoor.check()), cn = (r9.hots || []).find(h => /계산대/.test(h.label)); t(!!cn, '계산대 E');
        const H9 = await ev(() => { const h = SD2.map.interact.list().find(h9 => /계산대 \(사기 · 진열 돕기\)/.test(h9.label || '')); return h ? [h.x, h.y, h.z] : null; }); if (H9) { await pressAt(H9); let P0 = await panel(); t(P0 && P0.k === 'entstore', '계산대 = 사기 · 진열 돕기 고르기');
          await ev(() => document.querySelector('.twn-p button[data-a="sort"]').click()); await W8(300); for (let i = 0; i < 3; i++) { for (let z = 0; z < 3; z++) { const before = ((await panel()) || {}).t || ''; if (!/\/3/.test(before)) break; const m = before.match(/(\d)\/3/); await ev(z => { const b9 = document.querySelector('.twn-p button[data-z="' + z + '"]'); if (b9) b9.click(); }, z); await W8(150); const af = ((await panel()) || {}).t || '', m2 = af.match(/(\d)\/3/); if (!m2 || (m && m2[1] !== m[1])) break; } }
          P0 = await panel(); t(P0 && /진열 끝/.test(P0.t), '진열 돕기 셋 = 끝'); await closeAll(); await pressAt(H9); await ev(() => { const b9 = document.querySelector('.twn-p button[data-a="buy"]'); if (b9) b9.click(); }); await W8(300); P0 = await panel(); t(P0 && P0.k === 'shop', '사기 = 가게 창'); } }
      if (k !== 'store' && k !== 'hall') { await W8(200); const xp1 = await ev(() => JSON.stringify(SM_TOWN.skills().xp || {})); t(xp1 !== xp0, '솜씨 +'); }
      await closeAll(); const out = await leaveDoor(); t(out, '문 E = 밖으로'); if (!out) await leave();
      if (!one.length) nOk++; else bad.push(k + ' — ' + one.join(' · '));
      console.log('    ' + (one.length ? '✗ ' : '✓ ') + k + ' ' + (q.name || q.sign || q.kind) + (one.length ? ' — ' + one.join(' · ') : ''));
    }
    ok(nOk === cats.length, '갈래 ' + cats.length + '곳 모두 들어가 할 일 · 나오기 (' + nOk + ')' + (bad.length ? ' — ' + bad.slice(0, 6).join(' / ') : ''));
    // ③ 밤 잠김 · 닫은 가게
    { const h = byCat.get('home'), s9 = byCat.get('flower') || byCat.get('books'); await ev(() => { SM_TOWN.game().S.min = 22 * 60; }); await closeAll();
      if (h) { const d0 = (await ev(() => SM_TOWN.ent().dbg())).filter(t => t === 'shut home').length; await ev(i => SM_TOWN.indoor.enterI(i), h.i); const tt = await waitSaid('잠겼어요'); await W8(800); const d1 = (await ev(() => SM_TOWN.ent().dbg())).filter(t => t === 'shut home').length; ok(!(await ev(() => SM_TOWN.indoor.on)) && (!!tt || d1 > d0), '22:00 집 = 「문이 잠겼어요」 (안 들어감) — ' + (tt || '(다른 알림에 덮임 · 잠김 기록 ' + d1 + ')').slice(0, 50)); }
      if (s9) { await ev(i => SM_TOWN.indoor.enterI(i), s9.i); await W8(1200); const tt = await waitSaid('문을 닫았어요'); ok(!(await ev(() => SM_TOWN.indoor.on)) && !!tt, '22:00 가게 = 「문을 닫았어요」 — ' + tt.slice(0, 50)); }
      const cv = byCat.get('store'); if (cv) { await ev(() => { SM_TOWN.game().S.min = 9 * 60; }); ok(await enter(cv), '09:00 가게(' + (cv.sign || cv.name) + ') 들어감'); await leave(); }
      await ev(() => { SM_TOWN.game().S.min = 11 * 60; }); }
    // ④ 열 번 드나들기 힙
    { const ks = ['home', 'snack', 'flower', 'math', 'ware'].map(k => byCat.get(k)).filter(Boolean), heap = async () => { await ev(() => { if (window.gc) { window.gc(); window.gc(); } }); await W8(300); return ev(() => performance.memory ? performance.memory.usedJSHeapSize : 0); };
      const H = [], G9 = []; for (let i = 0; i < 10; i++) { for (const q of ks) { await enter(q); await leave(); } H.push(await heap()); G9.push(await ev(() => { let n = 0; SD2.scene.traverse(o => { if (o.isMesh) n++; }); return n; })); }
      const mb = v => +(v / 1048576).toFixed(1); console.log('    힙(MB) ' + H.map(mb).join(' · ') + ' · 장면 메시 ' + G9.join(' · '));
      ok(H[9] - H[2] < 6 * 1048576, '열 번 드나들기(방 ' + ks.length + '개씩) 힙이 계속 늘지 않음 (3번째 ' + mb(H[2]) + ' → 10번째 ' + mb(H[9]) + ' MB)'); ok(G9[9] <= G9[4] + 2 && G9[9] <= G9[0] + 8, '나온 뒤 장면 메시 수가 늘지 않음 (5번째 ' + G9[4] + ' → 10번째 ' + G9[9] + ' · 그리기 켬은 바깥 새·이웃이 처음 몇 개 생김)'); }
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.slice(0, 4).join(' | ') : ''));
  } catch (e) { fails.push('예외 ' + e.message); console.log(e); }
  await b.close(); console.log(fails.length ? '\n✗ ' + fails.length + '개 실패' : '\n✓ 모두 통과'); process.exit(fails.length ? 1 : 0); })();
