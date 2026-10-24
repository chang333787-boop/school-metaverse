// 🥁 장구 장단 놀이 시험(JANGGU-1 · docs/systems/town_jobs2.md 「리듬·장구·버스킹」): node tools/harness/town_janggu.cjs [마을=ourtown] [포트=8002] [--shots=폴더]
//   ① 장구 선생님(있는 일꾼 · 새 사람 X) 곁 E = 창 · 첫 줄 '할 일:' · 배경 곡 멈춤 · 선생님 장단 연주 예약(playBars 소리 수 = 칸 소리 수)
//   ② 칸 짜기: 틀린 차례 = 빨간 칸(통과 X) → 고치면 통과 · 아이 장단을 반주와 함께 두 번 연주(소리 수 · 반주 수) · 판 뒤 '됐어요 … 다음엔' 한 줄
//   ③ 잘한 판 셋 = 다음 꼬임(덩) · ←+→ 거의 같이 = 덩 · ↓ = 덩 · ④ 셋잇단(한 박 셋) 칸 길이 = 60/bpm/3 · 긴 장단 12칸 · ⑤ 솜씨 하루 한도
//   ⑥ 창 닫으면 배경 곡 다시 · ⑦ 내 장단 짓기 → 저장 → 버스킹: 보이는 일꾼 손뼉(cheer) · 돈 하루 한 번 · ⑧ 병원·집 앞 = 이웃이 싫어하는 말 · ☰ 메뉴 단추 · 페이지 오류 0
const { chromium } = require('./pw.cjs');   /* FAST-1: 기본 그리기 끔(norender) · 사진·프레임은 --render(docs/systems/town_gates.md) */
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const SHOTS = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8) || null, URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
const KEY = { k: 'ArrowLeft', d: 'ArrowRight', D: 'ArrowDown', '-': 'ArrowUp' }, INV = { k: 'ArrowRight', d: 'ArrowLeft', D: 'ArrowLeft' };
(async () => { const T0 = Date.now(), b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling', '--autoplay-policy=no-user-gesture-required'] });
  try { const p = await b.newPage({ viewport: { width: 1366, height: 768 } }), errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall|CORS|firebasedatabase|Failed to load resource/.test(t)) || /게임 tick 오류/.test(t)) errs.push(t.slice(0, 200)); });
    const W8 = ms => p.waitForTimeout(ms), ev = (f, a) => p.evaluate(f, a), info = () => ev(() => SM_TOWN.janggu().info()), mus = () => ev(() => SM_TOWN.music);
    const until = async (fn, arg, ms = 8000) => { const t = Date.now(); for (;;) { const r = await p.evaluate(fn, arg); if (r || Date.now() - t > ms) return r; await W8(150); } };
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.janggu && SM_TOWN.janggu() && SM_TOWN.game, null, { timeout: 240000 }); await W8(1500);
    await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p button'); if (b9) b9.click(); }); await p.keyboard.press('Escape'); await W8(500); await p.keyboard.press('Shift');
    await ev(() => { window.__J = { tp(x, z, lx, lz) { const M = SD2.map, g = M.q.groundAt(x, z, SM_TOWN.ground(x, z) + 2); M.player.teleport([x, g + 0.05, z]); if (lx != null) M.player.lookAt([lx, lz]); }, txt: () => { const q = document.querySelector('.twn-p'); return q ? q.textContent : ''; }, q: s => { const q = document.querySelector('.twn-p ' + s); return q ? q.textContent : null; }, click: a => { const q = document.querySelector('.twn-p [data-a="' + a + '"]'); if (q) q.click(); return !!q; } };
      const G = SM_TOWN.game().S; G.min = 11 * 60; delete G.jg; SM_TOWN.weather('clear'); });
    if (SHOTS) require('fs').mkdirSync(SHOTS, { recursive: true });
    const shot = async n => { if (!SHOTS) return; await W8(350); await p.screenshot({ path: SHOTS + '/' + n + '.png' }); };
    const clr = async () => { for (let k = 0; k < 4; k++) { if (!await ev(() => !!document.querySelector('.twn-p'))) return; await p.keyboard.press('Escape'); await W8(300); } };
    const demoEnd = () => until(() => { const R = SM_TOWN.janggu().info().R; return !!R && R.demo === 2; }, null, 12000);
    const press = async (cells) => { for (const c of cells) { if (c === '-') continue; await p.keyboard.press(KEY[c]); await W8(170); } };
    const sounds = pat => [...pat].reduce((a, c) => a + (c === 'D' ? 2 : c === '-' ? 0 : 1), 0);
    const roundOK = async () => { await demoEnd(); const R = (await info()).R; await press(R.pat); await until(() => SM_TOWN.janggu().info().R.done, null, 3000); return (await info()).R; };

    // ① 선생님 · E · 창 · 배경 곡 멈춤 · 선생님 장단 예약
    console.log('① 장구 선생님'); let I = await info(); ok(I.on && I.teacher && I.hot, '장구 선생님 = 있는 일꾼(' + (I.teacher && I.teacher.role + ':' + I.teacher.k + ' ' + I.teacher.cell + ' (' + I.teacher.x + ', ' + I.teacher.z + ')') + ') · E 자리 ' + (I.hot && I.hot.x + ', ' + I.hot.z));
    const nW = await ev(() => SM_TOWN.workers().length); ok(nW >= 1, '일꾼 수 그대로 ' + nW + '(새 사람 X)');
    await ev(([h, t]) => __J.tp(h.x, h.z, t.x, t.z), [I.hot, I.teacher]); await W8(1200); await clr();
    const m0 = await mus(); console.log('   음악 전: ' + JSON.stringify({ on: m0.on, ctx: m0.ctx, song: m0.song, held: m0.held }));
    const nr = await ev(() => SD2.near && SD2.near()); ok(/장구 배우기/.test(nr || ''), '선생님 곁 E = 장구 배우기(' + nr + ')');
    await p.keyboard.press('KeyE'); await W8(900); I = await info();
    ok(I.open && I.mode === 'learn', 'E → 장구 창 열림'); const task = await ev(() => __J.q('[data-r="task"]')); ok(/^할 일:/.test(task || ''), '창 첫 줄 = ' + task);
    const m1 = await mus(); ok(m1.held && !m1.song, '장구 창 = 배경 곡 멈춤(held ' + m1.held + ' · 곡 ' + m1.song + ')');
    ok(I.last && I.last.n === sounds(I.R.pat) && I.R.pat.length === 4, '선생님 장단 예약 — 칸 ' + I.R.pat + ' · 소리 ' + (I.last && I.last.n) + ' = ' + sounds(I.R.pat));
    ok(!/[←→]/.test((await ev(() => __J.q('.jg-c[data-c^="t"]'))) || ''), '칸에 글자 = 구음(쿵·덕)'); await shot('jg_1_open');

    // ② 틀린 차례 → 빨간 칸 → 고치기 → 통과 · 아이 장단 + 반주
    console.log('② 칸 짜기'); await demoEnd(); let R = (await info()).R; const pat0 = R.pat;
    for (const c of pat0) { await p.keyboard.press(INV[c]); await W8(170); } await W8(500); R = (await info()).R;
    ok(!R.done && R.bad.length === pat0.length, '차례가 다 틀리면 통과 X · 빨간 칸 ' + R.bad.length); ok(/달라요/.test(await ev(() => __J.q('[data-r="res"]')) || ''), '빨간 칸 안내 한 줄'); await shot('jg_2_bad');
    await W8(600); for (const i of R.bad) { await p.keyboard.press(KEY[pat0[i]]); await W8(170); } await until(() => SM_TOWN.janggu().info().R.done, null, 3000); I = await info(); R = I.R;
    ok(R.done && R.bad.length === 0, '고치면 통과(별 ' + R.s + ')'); const res = await ev(() => __J.q('[data-r="res"]')); ok(/^됐어요: .+다음엔/.test(res || ''), '판 뒤 한 줄 = ' + res);
    ok(I.last && I.last.n === sounds(pat0) * 2 && I.last.acc > 0, '아이 장단 연주 = 두 번(소리 ' + (I.last && I.last.n) + ') + 반주 ' + (I.last && I.last.acc));
    const mj = await mus(); ok(mj.jg >= sounds(pat0) * 4 && mj.voicesMax <= 6, '장구 소리 예약 누적 ' + mj.jg + ' · 동시 소리 최대 ' + mj.voicesMax + '(6 이하)'); await shot('jg_3_done');

    // ③ 잘한 판 셋 = 덩 꼬임
    console.log('③ 꼬임 사다리'); const xp0 = await ev(() => SM_TOWN.skills().xp.work || 0), mo0 = await ev(() => SM_TOWN.game().S.money);
    for (let k = 0; k < 5 && (await info()).S.lv < 1; k++) { await ev(() => __J.click('next')); await W8(300); await roundOK(); }
    I = await info(); ok(I.S.lv === 1 && I.R.up === 'lv', '잘한 판 셋 → 「덩 더하기」(lv ' + I.S.lv + ' · up ' + I.R.up + ')'); ok(/덩/.test(await ev(() => __J.q('[data-r="res"]')) || ''), '꼬임 오를 때 다음 배울 것 한 줄');
    const xp1 = await ev(() => SM_TOWN.skills().xp.work || 0), mo1 = await ev(() => SM_TOWN.game().S.money); ok(xp1 > xp0, '일솜씨 오름 ' + xp0 + ' → ' + xp1); ok(mo1 - mo0 >= 200, '꼬임 오름 돈 ' + (mo1 - mo0));
    await ev(() => __J.click('next')); await W8(300); await demoEnd(); R = (await info()).R; ok(/D/.test(R.pat), '덩 칸이 있는 장단 ' + R.pat);
    const iD = [...R.pat].indexOf('D'); for (let i = 0; i < R.pat.length; i++) { const c = R.pat[i]; if (i === iD) { await p.keyboard.press('ArrowLeft'); await p.keyboard.press('ArrowRight'); } else await p.keyboard.press(KEY[c]); await W8(200); }
    await until(() => SM_TOWN.janggu().info().R.done, null, 3000); R = (await info()).R; ok(R.done && R.mine.split(',')[iD] === 'D', '←+→ 거의 같이 = 덩 · ↓ = 덩 → 통과(' + R.mine + ')');

    // ④ 셋잇단 · 긴 장단
    console.log('④ 셋잇단'); await ev(() => SM_TOWN.janggu().dbg.stage(2)); await ev(() => __J.click('next')); await W8(400); I = await info();
    ok(I.R.pat.length === 9 && Math.abs(I.last.cellMs - 1000 / 3) < 1, '한 박을 셋으로 — 9칸 · 칸 ' + I.last.cellMs + 'ms(60/60/3 = 333.3)'); await shot('jg_4_triplet'); R = await roundOK(); ok(R.done, '셋잇단 장단 통과(쉼 칸은 건너뜀)');
    await ev(() => SM_TOWN.janggu().dbg.stage(3)); await ev(() => __J.click('next')); await W8(400); I = await info(); ok(I.R.pat.length === 12 && Math.abs(I.last.cellMs - 60000 / 56 / 3) < 1, '긴 장단 12칸 · 칸 ' + I.last.cellMs + 'ms');
    // ⑤ 솜씨 하루 한도
    await ev(() => { SM_TOWN.game().S.uses['jg:xp'] = 4; }); const xp2 = await ev(() => SM_TOWN.skills().xp.work || 0); await roundOK(); const xp3 = await ev(() => SM_TOWN.skills().xp.work || 0); ok(xp3 === xp2, '하루 넷 넘으면 솜씨 그대로(' + xp2 + ' → ' + xp3 + ')');

    // ⑥ 창 닫기 → 배경 곡 다시
    console.log('⑥ 창 닫기'); await p.keyboard.press('Escape'); await W8(300); ok(!(await info()).open, 'Esc = 창 닫힘');
    const back = await until(() => { const m = SM_TOWN.music; return !m.held && !!m.song; }, null, 4000), m2 = await mus(); ok(back || !m2.on, '창 닫으면 배경 곡 다시(held ' + m2.held + ' · 곡 ' + m2.song + ' · 켜짐 ' + m2.on + ')');

    // ⑦ 내 장단 짓기 → 저장 → 버스킹
    console.log('⑦ 내 장단 · 버스킹'); await ev(() => SM_TOWN.janggu().dbg.stage(1)); I = await info(); await ev(([h, t]) => __J.tp(h.x, h.z, t.x, t.z), [I.hot, I.teacher]); await W8(900); await clr(); await p.keyboard.press('KeyE'); await W8(800); await roundOK();
    ok(await ev(() => __J.click('mine')), '판 뒤 「내 장단 짓기」 단추'); await W8(300); I = await info(); ok(I.mode === 'mine' && I.R.mine.split(',').length === 4, '짓기 칸 ' + I.R.mine.split(',').length);
    for (const c of 'kd-k') { await p.keyboard.press(KEY[c]); await W8(200); } await W8(500); I = await info(); ok(I.last && I.last.n === 6 && I.last.acc > 0, '지은 장단을 반주와 함께 들어 보기(소리 ' + (I.last && I.last.n) + ')'); await shot('jg_5_mine');
    ok(await ev(() => __J.click('save')), '저장하기'); await W8(200); I = await info(); ok(I.S.mine && I.S.mine.c === 'kd-k', '저장 = ' + JSON.stringify(I.S.mine));
    const mo2 = await ev(() => SM_TOWN.game().S.money); ok(await ev(() => __J.click('busk')), '「여기서 들려주기」'); await W8(900); I = await info();
    ok(!I.open && I.busk && I.busk.why === 'ok' && I.busk.aud.includes(I.teacher.i), '장터 = 보이는 일꾼이 몸을 돌려 손뼉(' + (I.busk && I.busk.aud.length) + '명 · 선생님 포함)'); const mb = await mus(); ok(mb.held, '버스킹 동안 배경 곡 멈춤'); await shot('jg_6_busk');
    await until(() => !SM_TOWN.janggu().info().busk, null, 12000); await W8(300); const mo3 = await ev(() => SM_TOWN.game().S.money); ok(mo3 - mo2 === 100, '손뼉 = 하루 한 번 100원(' + (mo3 - mo2) + ')');
    await ev(() => SM_TOWN.janggu().busk()); await until(() => !SM_TOWN.janggu().info().busk, null, 12000); await W8(300); ok(await ev(() => SM_TOWN.game().S.money) === mo3, '같은 날 두 번째 = 돈 X'); ok(await until(() => !SM_TOWN.music.held, null, 3000), '버스킹 끝 = 배경 곡 다시');

    // ⑧ 자리 규칙 · 메뉴
    console.log('⑧ 자리 규칙'); const spots = await ev(() => { const J = SM_TOWN.janggu(), P = SM_TOWN.places(), out = {}; for (const q of P) { const d = q.door || [q.x, q.z]; for (const [ox, oz] of [[3, 0], [-3, 0], [0, 3], [0, -3]]) { const x = d[0] + ox, z = d[1] + oz, w = J.dbg.place(x, z); if (!out[w]) out[w] = [x, z, q.name]; } } return out; });
    for (const [why, re] of [['hosp', /아픈 사람이 쉬는 곳/], ['home', /쉬는 이웃이 힘들어요/]]) { const s9 = spots[why]; if (!s9) { ok(false, why + ' 자리 없음'); continue; }
      await ev(s => __J.tp(s[0], s[1]), s9); await W8(600); await clr(); const st = await ev(() => SM_TOWN.janggu().busk()); I = await info(); ok(st && I.busk && I.busk.why === why && I.busk.aud.length === 0, s9[2] + ' 앞 = ' + why + ' · 손뼉 0');
      await until(() => !SM_TOWN.janggu().info().busk, null, 8000); const body = await ev(() => document.body.innerText); ok(re.test(body), why + ' = 이웃이 싫어하는 말 한 줄'); if (why === 'hosp') await shot('jg_7_hosp'); await W8(400); }
    const menu = await ev(() => { const c = [...document.querySelectorAll('.chip.gchip')].find(e => /^☰/.test((e.textContent || '').trim()) && getComputedStyle(e).display !== 'none'); if (!c) return 'chip'; c.click(); return !!document.querySelector('.twn-p button[data-a="jg"]'); }); ok(menu === true, '☰ 메뉴 「내 장단 치기」 단추(' + menu + ')'); await clr();
    ok(errs.length === 0, '페이지 오류 0' + (errs.length ? ' — ' + errs.slice(0, 4).join(' | ') : ''));
  } catch (e) { fails.push('하네스 예외: ' + e.message.split('\n')[0]); console.log('  ✗ 하네스 예외 ' + e.message.split('\n')[0]); }
  console.log('— ' + ((Date.now() - T0) / 1000).toFixed(0) + '초 · ' + (fails.length ? 'FAIL ' + fails.length + ': ' + fails.join(' / ') : 'PASS')); await b.close(); process.exit(fails.length ? 1 : 0); })();
