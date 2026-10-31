// 👀 묻기 전에 보여 주기(STORY-AUDIT · 사용자 10-31 '양몰기는 했는데 우유가 오는 과정을 본 적이 없어 · 힌트가 목장에서 본 걸 고르라니 엥?'): node tools/harness/town_story_see.cjs [마을=ourtown] [포트=8002]
//   전수 조사 표 = docs/systems/town_story_audit_1031.md · 고친 장을 차례로 따라가며 '묻기 전에 그 사실이 화면(쪽지·끝 배너)에 나왔나'와 막힘 0을 봄
//   ⓪ 자료: 본 것·들은 것을 가리키는 힌트 수(눈으로 볼 목록) · 목장 장 차례 ① 목장(양몰이 끝 → 일꾼 말 '우유 가는 길' → 만드는 일 고르기 → 우유가 오는 길 → 장 끝) ② 팬케이크(쪽지 요리법 → 재료 고르기 · 버터 반응)
//   단계 잇기(덧붙임 10-31): 맞힌 뒤 한 줄로 다음 할 일의 까닭(팬케이크 → 자전거 · 더운 날 → 마실 것 · 갯벌 → 염전) · 벼 베기 차례
//   ③ 더운 날(일 끝 글 → 약속 고르기) ④ 갯벌(가만히 6초 → 끝 글 → 갯벌이 하는 일) ⑤ 나무·큰비·소금 의뢰 쪽지 글 ⑥ 옛 저장(목장 '만드는 일' 앞) → 새로고침 → '우유 가는 길'로(한 번만) ⑦ 페이지 오류 0
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const { chromium } = require('./pw.cjs'), { walker } = require('./lib_walk.cjs');
let fails = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
(async () => {
  { const M = await import(require('path').resolve(__dirname, '../../v2/games/town_story.js')), ko = v => (Array.isArray(v) ? v[0] : typeof v === 'string' ? v : ''), RE = /본 |봤|들은|들려|떠올려|아까|오늘|방금|만난/; let n = 0; for (const c of M.CHAPTERS) for (const st of c.steps) for (const h of st.hint || []) if (RE.test(ko(h))) n++;
    console.log('⓪ 본 것·들은 것을 가리키는 힌트 ' + n + '줄(새로 쓰면 그 장 안에서 먼저 보여 줬는지 눈으로)'); const a = M.CHAPTERS.find(q => q.id === 'a1_3').steps.map(q => q.id); ok(a.indexOf('milk') >= 0 && a.indexOf('milk') < a.indexOf('make'), '목장 장 차례 ' + a.join(' → '));
    const r = M.CHAPTERS.find(q => q.id === 'a2_2').steps.map(q => q.id); ok(r.indexOf('sea') < r.indexOf('first'), '벼 베기 차례(가을 기다리기 → 논 고르기) ' + r.join(' → ')); }
  const b = await chromium.launch({ args: ['--use-gl=angle', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  const errs = [];
  try {
    const p = await (await b.newContext({ viewport: { width: 1366, height: 768 } })).newPage();
    p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { if (m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(m.text())) errs.push(m.text().slice(0, 200)); });
    const URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0';
    const boot = async () => { await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.story, null, { timeout: 240000 }); await p.waitForTimeout(1500); await p.evaluate(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); await p.waitForTimeout(800); };
    await boot();
    const Wk = walker(p, {}), { ev, W8, shut, waitStep } = Wk;
    const S = () => ev(() => { const s = SM_TOWN.story(); return { cur: s.cur, id: s.step && s.step.id, done: Object.keys((SM_TOWN.game().S.story || {}).done || {}) }; });
    const dlgAll = async () => { let t = ''; for (let i = 0; i < 40; i++) { const d = await ev(() => (document.querySelector('.twn-dlg') || {}).innerText || ''); if (d) break; await W8(250); } for (let i = 0; i < 16; i++) { const d = await ev(() => (document.querySelector('.twn-dlg') || {}).innerText || ''); if (!d) break; t += ' ' + d; await p.keyboard.press('KeyE'); await W8(380); } return t.replace(/\s+/g, ' '); };
    const panel = async () => { for (let i = 0; i < 40; i++) { if (await ev(() => !!document.querySelector('.twn-p button[data-k], .twn-p [data-card]'))) return true; await W8(250); } return false; };
    const pickAns = async () => { const A = await ev(() => SM_TOWN.storyAns()); await ev(A9 => { for (const b9 of document.querySelectorAll('.twn-p button.pri[data-k]')) b9.click(); for (const k of A9) { const b9 = document.querySelector('.twn-p button[data-k="' + k + '"]'); if (b9) b9.click(); } const o9 = document.querySelector('.twn-p [data-a="ok"]'); if (o9) o9.click(); }, A); await W8(1400); return A; };
    const prep = () => ev(() => { const G = SM_TOWN.game().S; G.story = G.story || {}; G.story.done = Object.assign(G.story.done || {}, { p0: { d: 1 }, a1_1: { d: 1 } }); G.story.autoNext = null; });
    await prep();

    console.log('① 목장의 아침 — 양몰이 끝 → 우유 가는 길 → 묻기');
    await shut(); await ev(() => SM_TOWN.storyAt('a1_3', 1)); await W8(900); await shut();
    { const r = await ev(() => { const s = SM_TOWN.game().S.story, w = SM_TOWN.story().step && SM_TOWN.story().step.v; const who = s.v && s.v.who; SM_TOWN.storyEv('work', { k: who || 'pasture', x: 0, z: 0 }); return who; }); ok(r === 'pasture', '쪽지 준 일꾼 = 목장 일꾼(' + r + ')'); }
    await W8(500); { const ban = await ev(() => (document.getElementById('hudBan') || {}).textContent || ''); ok(/양들이 우리에 다 들어갔어요/.test(ban), '양몰이 끝 배너 「' + ban.slice(0, 40) + '」'); }
    { const s = await S(); ok(s.id === 'milk', '다음 = 우유 가는 길(' + s.id + ')'); }
    { const t = await dlgAll(); ok(/차가운 우유 통/.test(t) && /냉장 트럭/.test(t) && /우유 공장/.test(t) && /마트 냉장 칸/.test(t), '일꾼 말에 젖 짜기 → 우유 통 → 냉장 트럭 → 우유 공장 → 마트(' + t.slice(0, 120) + '…)'); }
    { const s = await waitStep(q => q.id !== 'milk', 6000); ok(s.id === 'make', '알겠어요 → 만드는 일 고르기(' + s.id + ')'); }
    ok(await panel(), '고르기 창 열림'); { const lb = await ev(() => [...document.querySelectorAll('.twn-p button[data-k]')].map(b9 => b9.textContent.trim()).join(' / ')); ok(/소와 양을 기르고 돌보기/.test(lb), '보기 = ' + lb); }
    await pickAns(); { const s = await S(); ok(s.id === 'line', '맞히면 우유가 오는 길(' + s.id + ')'); }
    ok(await panel(), '문장 틀 열림'); { const cd = await ev(() => [...document.querySelectorAll('.twn-p [data-card]')].map(b9 => b9.textContent.trim()).join(' / ')); ok(/냉장 트럭/.test(cd) && /우유 공장/.test(cd), '카드 = ' + cd); }
    for (let i = 0; i < 4; i++) { await ev(i9 => { const sl = document.querySelector('.twn-p button[data-slot="' + i9 + '"]'); if (sl) sl.click(); }, i); await W8(150); await ev(i9 => { const b9 = document.querySelector('.twn-p [data-card="' + i9 + '"]'); if (b9) b9.click(); }, i); await W8(220); }
    { const s = await waitStep(q => q.done.includes('a1_3') || q.cur !== 'a1_3', 8000); ok(s.done.includes('a1_3'), '목장 장 끝(막힘 0)'); }
    await W8(600); await shut(); await ev(() => { SM_TOWN.storyOff && SM_TOWN.storyOff(); SM_TOWN.game().S.story.autoNext = null; });

    console.log('② 팬케이크 — 요리법을 먼저 보여 주고 묻기');
    await ev(() => SM_TOWN.storyAt('c1', 0)); { const t = await dlgAll(); ok(/밀가루와 달걀, 우유를 섞어 반죽/.test(t) && /시럽이나 버터를 올리면/.test(t), '쪽지 요리법(' + (t.match(/팬케이크는[^.]*\./) || [''])[0] + ')'); }
    { const s = await waitStep(q => q.id !== 'n', 6000); ok(s.id === 'pick', '재료 고르기(' + s.id + ')'); } ok(await panel(), '고르기 창');
    await ev(() => { for (const k of ['🧈', '🌾', '🥚']) { const b9 = document.querySelector('.twn-p button[data-k="' + k + '"]'); if (b9) b9.click(); } const o9 = document.querySelector('.twn-p [data-a="ok"]'); if (o9) o9.click(); }); await W8(700);
    { const tx = await ev(() => (document.querySelector('.twn-p') || {}).innerText || ''); ok(/다 구운 뒤 올리면/.test(tx), '버터 반응 = 요리법 쪽지와 같은 말'); }
    await pickAns(); { const s = await S(), ban = await ev(() => (document.getElementById('hudBan') || {}).textContent || ''); ok(s.id === 'bike', '맞히면 자전거(' + s.id + ')'); ok(/자전거를 꺼내요/.test(ban), '이음 한 줄 「' + ban.slice(0, 60) + '」'); }
    await shut(); await ev(() => { SM_TOWN.storyOff(); SM_TOWN.game().S.story.autoNext = null; });

    console.log('③ 더운 날 — 일꾼이 하는 모습(끝 글) → 약속 고르기');
    await ev(() => SM_TOWN.storyAt('c2', 1)); ok(await panel(), '언제? 고르기 창'); await pickAns(); { const s = await S(), ban = await ev(() => (document.getElementById('hudBan') || {}).textContent || ''); ok(s.id === 'water', '맞히면 마실 것 사기(' + s.id + ')'); ok(/마실 것을 하나 챙겨/.test(ban), '이음 한 줄(일꾼 부탁) 「' + ban.slice(0, 60) + '」'); }
    await shut(); await ev(() => SM_TOWN.storyAt('c2', 4)); await W8(900); await shut();
    await ev(() => { const G = SM_TOWN.game().S; G.min = 8 * 60; SM_TOWN.storyEv('work', { k: G.story.v.who, x: 0, z: 0 }); }); await W8(500);
    { const ban = await ev(() => (document.getElementById('hudBan') || {}).textContent || ''); ok(/모자를 쓰고 그늘에서 쉬며/.test(ban), '일 끝 배너 「' + ban.slice(0, 50) + '」'); }
    { const s = await waitStep(q => q.id === 'rule', 5000); ok(s.id === 'rule', '약속 고르기(' + s.id + ')'); } ok(await panel(), '고르기 창'); await pickAns(); { const s = await S(); ok(s.id === 'why', '맞히면 다음(' + s.id + ')'); }
    await shut(); await ev(() => { SM_TOWN.storyOff(); SM_TOWN.game().S.story.autoNext = null; });

    console.log('④ 갯벌 — 가만히 6초 → 갯벌이 물을 깨끗하게 → 묻기');
    await ev(() => SM_TOWN.storyAt('a1_5', 4)); await W8(900); await shut();
    { const a = await ev(() => { const v = SM_TOWN.game().S.story.v, a9 = v && v.at; if (a9) SD2.map.player.teleport([a9.x + 3, SM_TOWN.ground(a9.x + 3, a9.z) + 1.5, a9.z]); return a9 ? [Math.round(a9.x), Math.round(a9.z)] : null; }); ok(!!a, '갯벌 쉼터 곁(' + a + ')'); }
    { let ban = ''; for (let i = 0; i < 24; i++) { await W8(500); ban = await ev(() => (document.getElementById('hudBan') || {}).textContent || ''); if (/깨끗해지도록/.test(ban)) break; } ok(/게는 갯벌 흙 속 찌꺼기를 먹고 조개는 물을 걸러 먹어서/.test(ban), '지켜보기 끝 배너 「' + ban.slice(0, 60) + '」'); }
    { const s = await waitStep(q => q.id === 'why', 5000); ok(s.id === 'why', '갯벌이 하는 일 고르기(' + s.id + ')'); } ok(await panel(), '고르기 창'); await pickAns(); { const s = await S(), ban = await ev(() => (document.getElementById('hudBan') || {}).textContent || ''); ok(s.id === 'salt', '맞히면 염전(' + s.id + ')'); ok(/옆 염전에서 소금도/.test(ban), '이음 한 줄 「' + ban.slice(0, 60) + '」'); }
    await shut(); await ev(() => { SM_TOWN.storyOff(); SM_TOWN.game().S.story.autoNext = null; });

    console.log('⑤ 쪽지 글 — 나무(물길) · 큰비(개울) · 소금 의뢰(말려서)');
    for (const [id, re, nm] of [['a2_5', /물길을 내어/, '흙을 붙잡는 나무'], ['a2_4', /개울물도 갑자기 불어나니/, '큰비 사흘'], ['q_salt', /햇볕과 바람에 말려서 소금을 얻어요/, '소금 의뢰']]) {
      await ev(i9 => SM_TOWN.storyAt(i9, 0), id); const t = await dlgAll(); ok(re.test(t), nm + ' 쪽지에 묻기 전 사실(' + t.slice(0, 70) + '…)'); await W8(400); await shut(); await ev(() => { SM_TOWN.storyOff(); SM_TOWN.game().S.story.autoNext = null; }); }

    console.log('⑥ 옛 저장 — 목장 \'만드는 일\' 앞에 서 있던 판 → 새로고침 → 우유 가는 길부터');
    await ev(() => { const s = SM_TOWN.game().S.story; s.cur = 'a1_3'; s.i = 2; s.sid = 'make'; s.v = { who: 'pasture' }; delete s.mv31; s.paused = null; SM_TOWN.game().mark && SM_TOWN.game().mark(); return SM_TOWN.save && SM_TOWN.save().flush && SM_TOWN.save().flush(); });
    await W8(1500); await boot(); await W8(2500);
    { const r = await ev(() => { const s = SM_TOWN.game().S.story; return { cur: s.cur, sid: s.sid, i: s.i, mv: s.mv31 }; }); ok(r.cur === 'a1_3' && r.sid === 'milk' && r.mv === 1, '옛 저장 → 우유 가는 길(' + JSON.stringify(r) + ')'); }
    await ev(() => { const s = SM_TOWN.game().S.story; s.cur = 'a1_3'; s.i = 3; s.sid = 'make'; SM_TOWN.game().mark && SM_TOWN.game().mark(); return SM_TOWN.save && SM_TOWN.save().flush && SM_TOWN.save().flush(); });
    await W8(1500); await boot(); await W8(2500);
    { const r = await ev(() => { const s = SM_TOWN.game().S.story; return { cur: s.cur, sid: s.sid }; }); ok(r.cur === 'a1_3' && r.sid === 'make', '한 번 옮긴 뒤(mv31)엔 그대로 — 새 저장의 만드는 일 고르기는 그 자리(' + JSON.stringify(r) + ')'); }
  } catch (e) { console.error(e); fails++; }
  console.log('페이지 오류 ' + errs.length); for (const e of errs.slice(0, 8)) console.log('   ' + e); if (errs.length) fails++;
  await b.close(); console.log(fails ? 'FAIL ' + fails : 'PASS'); process.exit(fails ? 1 : 0);
})();
