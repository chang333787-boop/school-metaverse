// 🧭 첫 장 봇(FIRST-1 · 10-31 첫 장 다시 짜기 · 비판 G1 '첫 13단계에 놀이 0' · G4 'show:ans 45곳'): node tools/harness/town_first.cjs [마을=ourtown] [포트=8002] [--pick=마트] [--shots=폴더]
//   ① 새 아이 = 우리 집 현관 → 칠판 E → 프롤로그 → 1-1 끝까지 · 순간이동 없이 걸어서(자동 걷기 steer 4.2m/s · 0.12초마다 2m 넘게 튀면 실패)
//   ② 첫 5분 안에 '해 보기' 단계 도착(1-1 보물 지도 첫 장 · 시작 = 첫 화면을 닫은 때) · 그 단계는 삽(2 → 겨눔 → F)으로 파야 넘어감
//   ③ 스스로 찾는 단계(노란 ❗ 데려가기 · 지도 조각 ✕ · 우체국) = 셋째 힌트 전엔 빨간 선 X · 지도 조각 ✕·우체국은 둘째 힌트 전엔 나침반 띠 목적지도 X
//   ④ 자료 셈: 처음 13단계(장 차례 그대로) 고르기·빈칸 셋 이하 · 해 보기 하나 이상 · 'show:ans' 0
//   ⑤ 자료 다시 보기(SEE-1)·보기 줄이기(CUT-1): 1-2 '만드는 일 둘' 세 번 틀림 → 아까 본 자료 상자(STORY-AUDIT: 목장 일꾼의 '우유 가는 길' 말이 그 안에) · 노란 테두리 0 · 다섯 번 → 틀린 보기가 지워짐(맞는 보기는 남음) · 맞히면 넘어감 / 문장 틀(우유가 오는 길) 다섯 번 → 틀린 카드 지움
//   ⑥ 페이지 오류 0 · --shots = 첫 카드·노란 ❗·지도 조각·파기·우체국·자료 상자 사진
const { chromium } = require('./pw.cjs'), { walker, toFirstTry } = require('./lib_walk.cjs');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const arg = k => { const a = process.argv.find(s => s.startsWith('--' + k)); return a ? (a.includes('=') ? a.slice(a.indexOf('=') + 1) : true) : null; };
const SHOTS = arg('shots'), PICK = arg('pick') || '마트', URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0';
let fails = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const mmss = s => Math.floor(s / 60) + '분 ' + String(Math.round(s % 60)).padStart(2, '0') + '초';
(async () => {
  const fs = require('fs'); if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
  const M = await import(require('path').resolve(__dirname, '../../v2/games/town_story.js'));
  console.log('④ 자료 셈(장 차례 그대로)');
  { const verb = t => (t === 'note' ? '쪽지' : t === 'go' ? '가기' : t === 'choose' ? '고르기' : t === 'line' ? '빈칸' : ['tmap', 'work', 'harvest', 'sow', 'try', 'plant', 'watch', 'cook', 'play'].includes(t) ? '해 보기' : t);
    const seq = []; for (const id of ['p0', 'a1_1', 'a1_3', 'c3']) { const c = M.CHAPTERS.find(q => q.id === id); if (c) for (const st of c.steps) seq.push([id + '.' + st.id, verb(st.do.type)]); }
    const cnt = L => L.reduce((o, q) => ((o[q[1]] = (o[q[1]] || 0) + 1), o), {}), f13 = seq.slice(0, 13), c13 = cnt(f13), pa = seq.filter(q => /^(p0|a1_1)\./.test(q[0])), cpa = cnt(pa);
    console.log('   처음 13: ' + f13.map(q => q[0] + '(' + q[1] + ')').join(' → ')); console.log('   처음 13 셈 ' + JSON.stringify(c13) + ' · 첫 장(프롤로그+1-1) ' + pa.length + '단계 ' + JSON.stringify(cpa));
    ok((c13['고르기'] || 0) + (c13['빈칸'] || 0) <= 3, '처음 13단계 고르기·빈칸 ' + ((c13['고르기'] || 0) + (c13['빈칸'] || 0)) + ' ≤ 3'); ok((cpa['해 보기'] || 0) >= 1, '첫 장에 해 보기 ' + (cpa['해 보기'] || 0));
    let ans = 0, see = 0; for (const c of M.CHAPTERS) for (const st of c.steps) for (const h of st.hint || []) { if (h === 'show:ans') ans++; if (h === 'show:see') see++; } ok(ans === 0 && see > 30, "힌트 'show:ans' " + ans + ' · show:see ' + see); }
  const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  const errs = [];
  try {
    const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } }), p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { if (m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(m.text())) errs.push(m.text().slice(0, 200)); });
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
    const shot = async n => { if (!SHOTS) return; await W8(350); await p.screenshot({ path: SHOTS + '/' + n + '.png' }); console.log('    📷 ' + SHOTS + '/' + n + '.png'); };
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.story, null, { timeout: 240000 }); await W8(1500);
    await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); await W8(1200);
    const T0 = Date.now(), t = () => (Date.now() - T0) / 1000, LOG = [];
    const Wk = walker(p, { t }), { S, closeDlg, shut, walk, waitStep, st } = Wk;   /* 걷기 = lib_walk.cjs(town_gate.cjs와 같이 씀) */
    const mark = (n, extra) => { LOG.push([n, t()]); console.log('   ' + mmss(t()) + '  ' + n + (extra ? ' — ' + extra : '')); };

    let { s } = await toFirstTry(Wk, { ok, mark, shot, mmss, t, PICK });   /* ① 현관 칠판 → 프롤로그 → 1-1 해 보기 단계 도착(lib_walk.cjs) */
    { let n = 0; for (; n < 50 && !(await ev(() => !!document.querySelector('.twn-p .tm-cv'))); n++) await W8(300); const tx9 = await ev(() => (document.querySelector('.twn-p') || {}).innerText || ''); ok(/지도 조각/.test(tx9) && !/빨간 선을 따라/.test(tx9), '지도 조각 창(빨간 선 X) — ' + tx9.replace(/\s+/g, ' ').slice(0, 70)); await shot('first_3_map');
      await shut(); const I = await ev(() => SM_TOWN.treasure().info()), c = I.cur; ok(!!(c && c.st && c.k === 'fire'), '이야기 조각 = 소방서 곁 ✕(' + (c && c.id) + ')'); ok(I.card, '왼쪽 지도 조각 카드');
      if (c) { const r = await walk(c.x, c.z, { self: 1, noComp: 1, r: 2.0, tag: 'tmap', lim: 420 }); const I2 = await ev(() => SM_TOWN.treasure().info()); ok(I2.mound, '✕ 가까이 = 흙더미 보임'); ok(r && r.d < 2.6, '걸어서 ✕ 도착(남은 ' + (r ? r.d.toFixed(1) : '?') + 'm)'); await shot('first_4_mound');
        await p.keyboard.press('Digit2'); await W8(500); await ev(([x, z]) => { SD2.map.player.lookAt([x, z]); SM_TOWN.tools.aim(x, z); }, [c.x, c.z]); await W8(200); await p.keyboard.press('KeyF'); await W8(600); await ev(() => SM_TOWN.tools.aim(null));
        s = await waitStep(q => q.id !== 'tmap', 8000); ok(s.id === 'post', '삽으로 파서 넘어감 → 우체국(' + s.id + ')'); mark('📦 보물 상자 찾음'); let n2 = 0; for (; n2 < 20 && !(await ev(() => /보물 상자를 찾았어요/.test((document.querySelector('.twn-p') || {}).innerText || ''))); n2++) await W8(300); ok(n2 < 20, '보상 창(작은 종 · 사실 한 줄)'); await shot('first_5_chest'); await shut(); await p.keyboard.press('Digit2'); } }
    mark('📮 우체국은 지도만 보고(빨간 선 X)');
    { await W8(800); const r0 = await S(); ok(!r0.route && !r0.comp, '우체국 단계 = 빨간 선·나침반 목적지 없음(둘째 힌트 전)'); const T = await ev(() => SM_TOWN.storyTarget()); await shot('first_6_post'); await walk(T.x, T.z, { self: 1, noComp: 1, r: 10, until: r => r.cur !== 'a1_1' || r.sid !== 'post', tag: 'post' }); }
    s = await waitStep(q => q.done.includes('a1_1'), 8000); ok(s.done.includes('a1_1'), '1-1 끝(' + mmss(t()) + ')'); mark('1-1 끝');
    ok(st.maxJ < 2.0, '순간이동 없음(0.12초 한 걸음 최대 ' + st.maxJ.toFixed(2) + 'm · 샘플 ' + st.steps + ')'); ok(!st.selfBad.length, '스스로 찾는 단계에 빨간 선 0(셋째 힌트 전) ' + st.selfBad.slice(0, 4).join(' ')); ok(!st.compBad.length, '지도 조각·우체국 단계 나침반 목적지 0(둘째 힌트 전) ' + st.compBad.slice(0, 4).join(' '));
    s = await waitStep(q => q.cur === 'a1_3', 16000); ok(s.cur === 'a1_3', '다음 장(목장의 아침 · 양몰이)이 저절로(' + s.cur + ')');
    { const rec = await ev(() => { const R = SM_TOWN.game().S.story.rec; return { p0: R.p0 && R.p0.st, a1: R.a1_1 && R.a1_1.st }; }); console.log('   기록 ' + JSON.stringify(rec).slice(0, 300)); }

    console.log('⑤ 자료 다시 보기(SEE-1)·보기 줄이기(CUT-1) — 1-2 고르기·문장 틀');
    await shut(); { const iMk = M.CHAPTERS.find(q => q.id === 'a1_3').steps.findIndex(q => q.id === 'make'), iMl = M.CHAPTERS.find(q => q.id === 'a1_3').steps.findIndex(q => q.id === 'milk'); ok(iMl >= 0 && iMl < iMk, '1-2 묻기 전에 우유 가는 길 말(milk ' + iMl + ' → make ' + iMk + ')'); await ev(i9 => SM_TOWN.storyAt('a1_3', i9), iMk); }   /* STORY-AUDIT 10-31: 번호 대신 단계 id로 */ let n = 0; for (; n < 40 && !(await ev(() => !!document.querySelector('.twn-p button[data-k]'))); n++) await W8(300);
    { const A = await ev(() => SM_TOWN.storyAns()); const wrong = await ev(A9 => [...document.querySelectorAll('.twn-p button[data-k]')].map(b9 => b9.dataset.k).filter(k => !A9.includes(k)), A); console.log('   답 ' + A.join(',') + ' · 틀린 보기 ' + wrong.join(','));
      const tryWrong = () => ev(W9 => { const L9 = [...document.querySelectorAll('.twn-p button[data-k]')].filter(b9 => !b9.disabled), w = L9.filter(b9 => W9.includes(b9.dataset.k)).slice(0, 2); if (w.length < 2) return 'few'; for (const b9 of document.querySelectorAll('.twn-p button.pri[data-k]')) if (!w.includes(b9)) b9.click(); for (const b9 of w) if (!document.querySelector('.twn-p button[data-k="' + b9.dataset.k + '"]').classList.contains('pri')) document.querySelector('.twn-p button[data-k="' + b9.dataset.k + '"]').click(); document.querySelector('.twn-p [data-a="ok"]').click(); return 'ok'; }, wrong);
      for (let i = 0; i < 3; i++) { await tryWrong(); await W8(500); }
      const v3 = await ev(() => { const P = document.querySelector('.twn-p'); return { see: !!(P && P.querySelector('.twn-see')), seeT: P && P.querySelector('.twn-see') ? P.querySelector('.twn-see').innerText : '', yellow: [...document.querySelectorAll('.twn-p button')].some(b9 => /f2c230|242, 194, 48/.test(b9.getAttribute('style') || '')), off: document.querySelectorAll('.twn-p button[data-k][disabled]').length }; });
      ok(v3.see && /우유 공장/.test(v3.seeT), '세 번 틀림 = 아까 본 자료 상자 · 목장 일꾼이 들려준 우유 가는 길이 들어 있음(' + v3.seeT.replace(/\s+/g, ' ').slice(0, 80) + ')'); ok(!v3.yellow, '정답 노란 테두리 0'); ok(v3.off === 0, '아직 보기는 그대로(지운 것 ' + v3.off + ')'); await shot('first_7_see');
      for (let i = 0; i < 2; i++) { await tryWrong(); await W8(500); }
      const v5 = await ev(A9 => ({ off: [...document.querySelectorAll('.twn-p button[data-k][disabled]')].map(b9 => b9.dataset.k), on: [...document.querySelectorAll('.twn-p button[data-k]:not([disabled])')].map(b9 => b9.dataset.k), msg: (document.querySelector('.twn-chr') || {}).textContent || '' }), A);
      ok(v5.off.length === 1 && !v5.off.some(k => A.includes(k)) && A.every(k => v5.on.includes(k)) && v5.on.length > A.length, '다섯 번 틀림 = 틀린 보기 하나 지움(' + v5.off.join(',') + ' · 남은 ' + v5.on.join(',') + ') · ' + v5.msg.slice(0, 60)); await shot('first_8_cut');
      await ev(A9 => { for (const b9 of document.querySelectorAll('.twn-p button.pri[data-k]')) b9.click(); for (const k of A9) document.querySelector('.twn-p button[data-k="' + k + '"]').click(); document.querySelector('.twn-p [data-a="ok"]').click(); }, A); await W8(1500);
      s = await S(); ok(s.id === 'line', '맞히면 다음 단계(' + s.id + ')'); }
    { n = 0; for (; n < 40 && !(await ev(() => !!document.querySelector('.twn-p [data-card]'))); n++) await W8(300);
      const fill = async ks => { for (const k of ks) { await ev(k9 => { const b9 = document.querySelector('.twn-p [data-card="' + k9 + '"]'); if (b9 && !b9.disabled) b9.click(); }, k); await W8(160); } };
      await fill([1, 0, 2, 3]); await W8(700); for (let i = 0; i < 4; i++) { await fill([await ev(() => { const L9 = [...document.querySelectorAll('.twn-p [data-card]')].filter(b9 => !b9.disabled).map(b9 => +b9.dataset.card); return L9.find(k => k !== 0) ?? L9[0]; })]); await W8(700); }
      const f5 = await ev(() => ({ off: [...document.querySelectorAll('.twn-p [data-card][disabled]')].map(b9 => b9.textContent), see: !!document.querySelector('.twn-p .twn-see'), msg: (document.querySelector('.twn-p .twn-frm') || {}).textContent || '', yellow: [...document.querySelectorAll('.twn-p [data-card]')].some(b9 => /f2c230|box-shadow/.test(b9.getAttribute('style') || '')) }));
      ok(f5.see && !f5.yellow, '문장 틀 = 아까 본 자료 상자 · 정답 카드 테두리 0'); ok(f5.off.length >= 1, '문장 틀 다섯 번 틀림 = 틀린 카드 지움(' + f5.off.join(', ') + ') · ' + f5.msg.slice(0, 50));
      for (let i = 0; i < 4; i++) { await ev(i9 => { const sl = document.querySelector('.twn-p button[data-slot="' + i9 + '"]'); if (sl) sl.click(); }, i); await W8(120); await ev(i9 => { const b9 = document.querySelector('.twn-p [data-card="' + i9 + '"]'); if (b9) b9.click(); }, i); await W8(200); }
      s = await waitStep(q => q.id !== 'line', 6000); ok(s.id !== 'line', '맞게 채우면 넘어감(' + (s.id || s.cur || '장 끝') + ')'); }
    console.log('\n걸린 때: ' + LOG.map(([k, v]) => mmss(v) + ' ' + k).join(' · '));
  } catch (e) { console.error(e); fails++; }
  console.log('페이지 오류 ' + errs.length); for (const e of errs.slice(0, 8)) console.log('   ' + e); if (errs.length) fails++;
  await b.close(); console.log(fails ? 'FAIL ' + fails : 'PASS'); process.exit(fails ? 1 : 0);
})();
