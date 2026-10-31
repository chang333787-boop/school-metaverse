// 👀 묻기 전에 보여 주기(STORY-AUDIT · 사용자 10-31 '양몰기는 했는데 우유가 오는 과정을 본 적이 없어 · 힌트가 목장에서 본 걸 고르라니 엥?'): node tools/harness/town_story_see.cjs [마을=ourtown] [포트=8002]
//   전수 조사 표 = docs/systems/town_story_audit_1031.md · 고친 장을 차례로 따라가며 '묻기 전에 그 사실이 화면(쪽지·끝 배너)에 나왔나'와 막힘 0을 봄
//   ⓪ 자료: 본 것·들은 것을 가리키는 힌트 수(눈으로 볼 목록) · 목장 장 차례 ① 목장(양몰이 끝 → 일꾼 말 '우유 가는 길' → 만드는 일 고르기 → 우유가 오는 길 → 장 끝) ② 팬케이크(쪽지 요리법 → 재료 고르기 · 버터 반응)
//   단계 잇기(덧붙임 10-31): 맞힌 뒤 한 줄로 다음 할 일의 까닭(팬케이크 → 자전거 · 더운 날 → 마실 것 · 갯벌 → 염전) · 벼 베기 차례
//   ③ 더운 날(일 끝 글 → 약속 고르기) ④ 갯벌(가만히 6초 → 끝 글 → 갯벌이 하는 일) ⑤ 나무·큰비·소금 의뢰 쪽지 글 ⑥ 옛 저장(목장 '만드는 일' 앞) → 새로고침 → '우유 가는 길'로(한 번만) · 페이지 오류 0
//   COVER-1(10-31 메인이 기능·지역을 덮게): ⓪-2 장마다 처음 기능 하나(차례) ⑦ 1-4 돋보기 → 짐작(아까 본 자료) ⑧ 1-3 잠 → 우리 집 칠판 → 싹 → 씨감자 실험 ⑨ 2-1 가방 우유 · 우리 집 부엌 E ⑩ 2-4 바다 장터 바꾸기
//   COVER-2(10-31 3막 나머지·4막·피날레·에필로그): ⓪-3 장 차례(새 단계 갈래) ⑪ 3-1 노선도 고르기 ⑫ 3-2 물때표 → 썰물에만 지켜보기 ⑬ 3-3 날씨 전선 ⑭ 3-4 야생동물(실제 솜씨 꼬리표) ⑮ 3-5 관광 안내소 → 더 높은 산 ⑯ 4-1 한 표 → 잔치 마당이 그 자리로 · 걸어 재기 → 창구
//     ⑰ 4-3 집배원(실제 기록) ⑱ 4-5 층층골 화석 → 까망봉 ⑲ 4-6 장구 ⑳ 피날레 = 잔치 엔진 첫 잔치(내일로 당김 · 10시 · 잔치 마당 · 무대 · 모인 이웃) ㉑ 에필로그 마디탑 ㉒ 옛 저장(게시판의 q_contour · 피날레 '밤' 단계)
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const { chromium } = require('./pw.cjs'), { walker } = require('./lib_walk.cjs');
let fails = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
(async () => {
  { const M = await import(require('path').resolve(__dirname, '../../v2/games/town_story.js')), ko = v => (Array.isArray(v) ? v[0] : typeof v === 'string' ? v : ''), RE = /본 |봤|들은|들려|떠올려|아까|오늘|방금|만난/; let n = 0; for (const c of M.CHAPTERS) for (const st of c.steps) for (const h of st.hint || []) if (RE.test(ko(h))) n++;
    console.log('⓪ 본 것·들은 것을 가리키는 힌트 ' + n + '줄(새로 쓰면 그 장 안에서 먼저 보여 줬는지 눈으로)'); const a = M.CHAPTERS.find(q => q.id === 'a1_3').steps.map(q => q.id); ok(a.indexOf('milk') >= 0 && a.indexOf('milk') < a.indexOf('make'), '목장 장 차례 ' + a.join(' → '));
    const r = M.CHAPTERS.find(q => q.id === 'a2_2').steps.map(q => q.id); ok(r.indexOf('sea') < r.indexOf('first'), '벼 베기 차례(가을 기다리기 → 논 고르기) ' + r.join(' → '));
    console.log('⓪-2 COVER-1(10-31 메인이 기능·지역을 덮게) — 장마다 처음 기능 하나');
    const ord = id => M.CHAPTERS.find(q => q.id === id).steps.map(q => q.id + ':' + q.do.type), has = (id, re) => re.test(ord(id).join(' '));
    ok(has('p0', /lib:go bed:tool first:line/), '프롤로그 = 도서관 → 꽃에 물(물뿌리개) → 고르기 ' + ord('p0').join(' → '));
    ok(has('a1_1', /tmap:tmap lost:lost/) && !has('a1_1', /post:/), '1-1 = 지도 조각 → 112 길 잃은 새 친구 ' + ord('a1_1').join(' → '));
    ok(has('a1_3', /^n:note bike:bike work:work milk:note/), '1-2 = 쪽지 → 자전거 → 양몰이 → 일꾼 말 ' + ord('a1_3').join(' → '));
    ok(has('c3', /sow:sow news:news sprout:sprout law:law plan:choose/), '1-3 = 심기 → 칠판 → 싹 → 실험 → 쓰임 ' + ord('c3').join(' → '));
    ok(has('a1_6', /^n:note lens:tool clean:choose sea:season ff:ff line:line$/), '1-4 = 돋보기 → 짐작 → 여름 → 밤에 확인 ' + ord('a1_6').join(' → '));
    ok(!has('c1', /bike:/) && M.CHAPTERS.find(q => q.id === 'c1').steps.find(q => q.id === 'cook').do.home === 1, '2-1 = 자전거 단계 X · 우리 집 부엌 ' + ord('c1').join(' → '));
    ok((M.CHAPTERS.find(q => q.id === 'c2').steps.find(q => q.id === 'work').intro || {}).key === 'skill', '2-2 일 거들기 = 솜씨 칩');
    { const c9 = M.CHAPTERS.find(q => q.id === 'a2_2'); ok(c9.steps.find(q => q.id === 'sea').do.ok.includes('spring') && /논일/.test(c9.t[0]), '2-3 = 봄(모내기)·가을(벼 베기) ' + c9.t[0]); }
    { const c9 = M.CHAPTERS.find(q => q.id === 'a2_1'), sl = c9.steps.find(q => q.id === 'sell').do, gt = c9.steps.find(q => q.id === 'get'); ok(sl.get && sl.get['🧂'] === 1 && !(gt.intro && gt.intro.key === 'jump'), '2-4 = 팔기 또는 소금과 바꾸기 · 바로 가기 소개 X'); }
    ok(has('a1_5', /salt:work dry:law line:line/), '3-2 = 염전 → 생선 햇볕에 널기(실험 표 둘째) ' + ord('a1_5').join(' → '));
    console.log('⓪-3 COVER-2 — 3막 나머지·4막·피날레·에필로그 차례');
    ok(has('a1_4', /^n:note bline:choose bus:ride work:work/), '3-1 = 쪽지 → 노선도 고르기 → 버스 → 배추밭 ' + ord('a1_4').join(' → '));
    ok(has('a1_5', /^n:note tide:choose line9:choose/) && M.CHAPTERS.find(q => q.id === 'a1_5').steps.find(q => q.id === 'watch').do.low === 1, '3-2 = 쪽지 → 물때표 → 지하철 · 지켜보기 = 썰물에만 ' + ord('a1_5').join(' → '));
    ok(has('a2_4', /sea:season rain:front safe:choose/), '3-3 = 계절 → 날씨 전선(배추밭에서 비) → 약속 ' + ord('a2_4').join(' → '));
    ok(has('a2_5', /plant:plant wild:sk line:line/), '3-4 = 심기 → 야생동물 살펴보기 → 한 줄 ' + ord('a2_5').join(' → '));
    { const c9 = M.CHAPTERS.find(q => q.id === 'q_contour'), ix9 = M.CHAPTERS.findIndex(q => q.id === 'q_contour'); ok(c9.act === 3 && !c9.quest && c9.lamp === 1 && ix9 > M.CHAPTERS.findIndex(q => q.id === 'a2_5') && ix9 < M.CHAPTERS.findIndex(q => q.id === 'a3_1'), '3-5 = 의뢰 q_contour → 메인 3막(장 id 그대로 · 등불)'); ok(has('q_contour', /^n:note desk:go go:go map:contour why:choose steep:contour top:pace real:line$/), '3-5 = 관광 안내소 → 전망대 → 등고선 → 꼭대기까지 걸어 재기 ' + ord('q_contour').join(' → ')); }
    ok(has('a3_1', /sign:go pace:pace desk:go line:line$/), '4-1 = 예정지 → 정류장까지 걸어 재기 → 창구 → 의견서 ' + ord('a3_1').join(' → '));
    ok(has('a3_3', /^n:note post:rec first:choose give:invite/), '4-3 = 쪽지 → 집배원 체험 → 동네 고르기 → 초대 ' + ord('a3_3').join(' → '));
    ok(has('a3_5', /^n:note fos:sk crater:sk b1:line/), '4-5 = 쪽지 → 층층골 화석 → 까망봉 → 자랑 ' + ord('a3_5').join(' → '));
    ok(has('a3_6', /walk:go jg:rec line:line$/), '4-6 = 등불 길 → 장구 → 한 줄 ' + ord('a3_6').join(' → '));
    ok(has('f1', /^n:note night:fnight go:go play:fplay greet:greet line:line$/), '피날레 = 단계 id 그대로 · 잔치 엔진 갈래 ' + ord('f1').join(' → '));
    ok(has('c5', /go:go tower:rec$/), '에필로그 = 쪽지 전하기 → 마디탑 ' + ord('c5').join(' → '));
    { const BODY = /^(tool|lost|bike|work|plant|have|buy|cook|give|sow|sprout|law|harvest|sell|swap|ride|metro|pace|sk|rec|fplay|watch|tmap)$/, none = M.CHAPTERS.filter(c => !c.quest && !c.hold && !c.old && !c.steps.some(q => BODY.test(q.do.type))).map(c => c.id); ok(!none.length, '몸·놀이 단계 0인 장 = ' + (none.join(', ') || '없음')); }
    { let nAi = 0; for (const c of M.CHAPTERS) for (const st of c.steps) if (/아이 집/.test(JSON.stringify(st))) nAi++; ok(nAi === 0, '이야기 글에 「아이 집」 부엌 0(' + nAi + ')'); } }
  const M2 = await import(require('path').resolve(__dirname, '../../v2/games/town_story.js')), ix = (c, id) => M2.CHAPTERS.find(q => q.id === c).steps.findIndex(q => q.id === id);
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
    await shut(); await ev(i9 => SM_TOWN.storyAt('a1_3', i9), ix('a1_3', 'work')); await W8(900); await shut();
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
    await pickAns(); { const s = await S(), ban = await ev(() => (document.getElementById('hudBan') || {}).textContent || ''); ok(s.id === 'look', '맞히면 가게 둘(자전거 단계는 1-2로 · ' + s.id + ')'); ok(/자전거로 가요/.test(ban), '이음 한 줄 「' + ban.slice(0, 60) + '」'); }
    await shut(); await ev(() => { SM_TOWN.storyOff(); SM_TOWN.game().S.story.autoNext = null; });

    console.log('③ 더운 날 — 일꾼이 하는 모습(끝 글) → 약속 고르기');
    await ev(() => SM_TOWN.storyAt('c2', 1)); ok(await panel(), '언제? 고르기 창'); await pickAns(); { const s = await S(), ban = await ev(() => (document.getElementById('hudBan') || {}).textContent || ''); ok(s.id === 'water', '맞히면 마실 것 사기(' + s.id + ')'); ok(/마실 것을 하나 챙겨/.test(ban), '이음 한 줄(일꾼 부탁) 「' + ban.slice(0, 60) + '」'); }
    await shut(); await ev(() => SM_TOWN.storyAt('c2', 4)); await W8(900); await shut();
    await ev(() => { const G = SM_TOWN.game().S; G.min = 8 * 60; SM_TOWN.storyEv('work', { k: G.story.v.who, x: 0, z: 0 }); }); await W8(500);
    { const ban = await ev(() => (document.getElementById('hudBan') || {}).textContent || ''); ok(/모자를 쓰고 그늘에서 쉬며/.test(ban), '일 끝 배너 「' + ban.slice(0, 50) + '」'); }
    { const s = await waitStep(q => q.id === 'rule', 5000); ok(s.id === 'rule', '약속 고르기(' + s.id + ')'); } ok(await panel(), '고르기 창'); await pickAns(); { const s = await S(); ok(s.id === 'why', '맞히면 다음(' + s.id + ')'); }
    await shut(); await ev(() => { SM_TOWN.storyOff(); SM_TOWN.game().S.story.autoNext = null; });

    console.log('④ 갯벌 — 가만히 6초 → 갯벌이 물을 깨끗하게 → 묻기');
    await ev(i9 => SM_TOWN.storyAt('a1_5', i9), ix('a1_5', 'watch')); await W8(900); await shut();
    { const a = await ev(() => { const G9 = SM_TOWN.game().S, c9 = 300 + (((G9.day | 0) * 50 + 250) % 745); G9.min = [c9, c9 + 745, c9 - 745].find(m => m > 370 && m < 1430) || c9;   /* COVER-2: 숨구멍은 썰물에만(town_shore.js lowAt) */ const v = SM_TOWN.game().S.story.v, a9 = v && v.at; if (a9) SD2.map.player.teleport([a9.x + 3, SM_TOWN.ground(a9.x + 3, a9.z) + 1.5, a9.z]); return a9 ? [Math.round(a9.x), Math.round(a9.z)] : null; }); ok(!!a, '갯벌 쉼터 곁(' + a + ')'); }
    { let ban = ''; for (let i = 0; i < 24; i++) { await W8(500); ban = await ev(() => (document.getElementById('hudBan') || {}).textContent || ''); if (/깨끗해지도록/.test(ban)) break; } ok(/게는 갯벌 흙 속 찌꺼기를 먹고 조개는 물을 걸러 먹어서/.test(ban), '지켜보기 끝 배너 「' + ban.slice(0, 60) + '」'); }
    { const s = await waitStep(q => q.id === 'why', 5000); ok(s.id === 'why', '갯벌이 하는 일 고르기(' + s.id + ')'); } ok(await panel(), '고르기 창'); await pickAns(); { const s = await S(), ban = await ev(() => (document.getElementById('hudBan') || {}).textContent || ''); ok(s.id === 'salt', '맞히면 염전(' + s.id + ')'); ok(/옆 염전에서 소금도/.test(ban), '이음 한 줄 「' + ban.slice(0, 60) + '」'); }
    await shut(); await ev(() => { SM_TOWN.storyOff(); SM_TOWN.game().S.story.autoNext = null; });

    console.log('⑤ 쪽지 글 — 나무(물길) · 큰비(개울) · 소금 의뢰(말려서)');
    for (const [id, re, nm] of [['a2_5', /물길을 내어/, '흙을 붙잡는 나무'], ['a2_4', /개울물도 갑자기 불어나니/, '큰비 사흘'], ['q_salt', /햇볕과 바람에 말려서 소금을 얻어요/, '소금 의뢰']]) {
      await ev(i9 => SM_TOWN.storyAt(i9, 0), id); const t = await dlgAll(); ok(re.test(t), nm + ' 쪽지에 묻기 전 사실(' + t.slice(0, 70) + '…)'); await W8(400); await shut(); await ev(() => { SM_TOWN.storyOff(); SM_TOWN.game().S.story.autoNext = null; }); }

    console.log('⑦ COVER-1 1-4 돋보기 — 낮에 물가 들여다보기 → 그 글이 짐작 고르기의 자료');
    await ev(() => { const G = SM_TOWN.game().S; G.tools = G.tools || {}; }); await ev(i9 => SM_TOWN.storyAt('a1_6', i9), ix('a1_6', 'lens')); await W8(1500); await shut();
    { const r = await ev(() => ({ have: SM_TOWN.tools.info().have, st: SM_TOWN.story().step, tgt: SM_TOWN.storyTarget() })); ok(r.have.includes('lens'), '돋보기가 없으면 새 친구가 빌려줌(' + r.have.join(',') + ')'); ok(!!r.tgt && /생태 하천/.test(r.tgt.name || ''), '목적지 = 생태 하천(' + (r.tgt && r.tgt.name) + ')');
      if (r.tgt) { await ev(t => { const x = t.x + 3, z = t.z + 2; SD2.map.player.teleport([x, SM_TOWN.ground(x, z) + 1.5, z]); }, r.tgt); await W8(800); await ev(() => SM_TOWN.storyEv('tool', { k: 'lens-soil' })); await W8(700); }
      const s = await S(), ban = await ev(() => (document.getElementById('hudBan') || {}).textContent || ''); ok(s.id === 'clean', '돋보기로 보면 → 반딧불이 물가 짐작(' + s.id + ')'); ok(/물이 맑아 바닥 돌이 보이고/.test(ban), '끝 글 = 맑은 물·풀숲 「' + ban.slice(0, 40) + '」'); }
    ok(await panel(), '고르기 창'); for (let i = 0; i < 3; i++) { await ev(() => { for (const q of document.querySelectorAll('.twn-p button.pri[data-k]')) q.click(); const b9 = document.querySelector('.twn-p button[data-k="trash"]'); if (b9 && !b9.classList.contains('pri')) b9.click(); const o9 = document.querySelector('.twn-p [data-a="ok"]'); if (o9) o9.click(); }); await W8(600); }
    { const see = await ev(() => (document.querySelector('.twn-p .twn-see') || {}).innerText || ''); ok(/물이 맑아/.test(see), '세 번 틀림 = 아까 본 자료에 돋보기로 본 물가(' + see.replace(/\s+/g, ' ').slice(0, 70) + ')'); }
    await pickAns(); { const s = await S(); ok(s.id === 'sea' || s.id === 'ff', '맞히면 여름·밤 확인(' + s.id + ')'); }
    await shut(); await ev(() => { SM_TOWN.storyOff(); SM_TOWN.game().S.story.autoNext = null; });

    console.log('⑧ COVER-1 1-3 하루 한 바퀴 — 잠 → 우리 집 칠판 → 싹 → 씨감자 실험');
    await ev(i9 => SM_TOWN.storyAt('c3', i9), ix('c3', 'news')); await W8(1200); await shut();
    { const r = await ev(() => ({ st: SM_TOWN.story().step, tgt: SM_TOWN.storyTarget() })); ok(!!r.tgt && /칠판/.test(r.tgt.name), '목적지 = 우리 집 앞 칠판(' + (r.tgt && r.tgt.name) + ')');
      await ev(t => { const x = t.x + 1, z = t.z + 1; SD2.map.player.teleport([x, SM_TOWN.ground(x, z) + 1.5, z]); }, r.tgt); await W8(2500); ok((await S()).id === 'news', '같은 날 칠판 앞 = 아직(잠을 자야)');
      await ev(() => { const G = SM_TOWN.game().S; G.day = (G.day | 0) + 1; G.min = 7 * 60; }); await W8(2600); const s = await S(), ban = await ev(() => (document.getElementById('hudBan') || {}).textContent || ''); ok(s.id === 'sprout', '하룻밤 뒤 칠판 앞 → 싹 살피기(' + s.id + ' · 「' + ban.slice(0, 40) + '」)'); }
    await ev(() => SM_TOWN.storyEv('sprout')); await W8(800); { const s = await S(), r = await ev(() => SM_TOWN.game().S.bag ? null : null); void r; ok(s.id === 'law', '싹 → 씨감자 실험(' + s.id + ')'); }
    { const n = await ev(() => SM_TOWN.game().count ? SM_TOWN.game().count('🥔') : -1); ok(n >= 1, '씨감자가 가방에(' + n + ')'); await ev(() => SM_TOWN.storyEv('law', { e: '🥕', at: 'soil' })); await W8(300); ok((await S()).id === 'law', '다른 물건 = 아직'); await ev(() => SM_TOWN.storyEv('law', { e: '🥔', at: 'soil' })); await W8(700); ok((await S()).id === 'plan', '🥔 × 흙 = 넘어감(실험 표 첫 줄)'); }
    await shut(); await ev(() => { SM_TOWN.storyOff(); SM_TOWN.game().S.story.autoNext = null; });

    console.log('⑨ COVER-1 2-1 — 1-2 우유는 산 것으로 · 우리 집 부엌');
    await ev(() => { const G = SM_TOWN.game(); if (G.count('🥛') < 1) G.add('🥛', 1, 'test'); }); await ev(i9 => SM_TOWN.storyAt('c1', i9), ix('c1', 'buy')); await W8(1500); await shut();
    { const v = await ev(() => SM_TOWN.story().step.v); ok(v.got && v.got['🥛'] === 1, '가방 우유 = 산 것(' + JSON.stringify(v.got) + ')'); }
    await ev(i9 => SM_TOWN.storyAt('c1', i9), ix('c1', 'cook')); await W8(900); await shut();
    { const t = await ev(() => SM_TOWN.storyTarget()); ok(!!t && /우리 집/.test(t.name), '굽기 목적지 = 우리 집(' + (t && t.name) + ')');
      const i9 = await ev(() => { const c = SM_TOWN.indoor.census().find(q => q.mine); return c ? c.i : -1; }); if (i9 >= 0) { await ev(i => SM_TOWN.indoor.enterI(i), i9); await W8(2500); const hs = await ev(() => SD2.map.interact.list().filter(h => !h.off && /요리하기/.test(h.label || '')).length); ok(hs >= 1, '우리 집 안 = 🍳 요리하기 E(' + hs + ')'); await ev(() => SM_TOWN.indoor.exit()); await W8(1500); } }
    await shut(); await ev(() => { SM_TOWN.storyOff(); SM_TOWN.game().S.story.autoNext = null; });

    console.log('⑩ COVER-1 2-4 — 바다 장터에서 하나씩 바꾸기(소금은 가방에)');
    await ev(() => { const G = SM_TOWN.game(); if (G.count('🍓') < 1) G.add('🍓', 1, 'test'); }); await ev(i9 => SM_TOWN.storyAt('a2_1', i9), ix('a2_1', 'sell')); await W8(1200); await shut();
    { const t = await ev(() => SM_TOWN.storyTarget()); ok(!!t, '바다 장터 목적지'); if (t) { const s0 = await ev(() => SM_TOWN.game().count('🧂')); await ev(t9 => { const x = t9.x + 1.5, z = t9.z + 1; SD2.map.player.teleport([x, SM_TOWN.ground(x, z) + 1.5, z]); }, t); let d = ''; for (let i = 0; i < 20 && !/소금이랑 하나씩/.test(d); i++) { await W8(400); d = await ev(() => (document.querySelector('.twn-dlg') || {}).innerText || ''); if (/▼/.test(d) && !/소금이랑 하나씩/.test(d)) { await p.keyboard.press('KeyE'); } }
      ok(/소금이랑 하나씩/.test(d), '상인 말 = 팔기 또는 바꾸기(' + d.replace(/\s+/g, ' ').slice(0, 60) + ')'); const ch = await ev(() => [...document.querySelectorAll('.twn-dlg button, .twn-dlg [data-k]')].map(b9 => b9.textContent.trim())); console.log('    고르기: ' + ch.join(' / '));
      await ev(() => { const b9 = [...document.querySelectorAll('.twn-dlg button, .twn-dlg [data-k]')].find(q => /🍓/.test(q.textContent)); if (b9) b9.click(); }); await W8(1200); const s1 = await ev(() => SM_TOWN.game().count('🧂')), s = await S(); ok(s1 === s0 + 1 && s.id === 'line', '🍓 주고 🧂 받음 → 수첩(' + s0 + '→' + s1 + ' · ' + s.id + ')'); } }
    await shut(); await ev(() => { SM_TOWN.storyOff(); SM_TOWN.game().S.story.autoNext = null; });

    console.log('⑪ COVER-2 3-1 — 노선도에서 번호 고르기(노선 그림이 창 안에)');
    await ev(i9 => SM_TOWN.storyAt('a1_4', i9), ix('a1_4', 'bline')); await W8(900);
    { const s = await S(); if (s.id !== 'bline') console.log('    (노선이 없거나 학교 앞이면 건너뜀 · ' + s.id + ')'); else { ok(await panel(), '노선도 고르기 창'); const r = await ev(() => ({ lb: [...document.querySelectorAll('.twn-p button[data-k]')].map(b9 => b9.textContent.trim()), cv: !!document.querySelector('.twn-p canvas.twn-qsnip'), A: SM_TOWN.storyAns() })); ok(r.cv && r.lb.length >= 2 && r.lb.every(t => /번\(/.test(t)), '보기 = 번호(색) ' + r.lb.join(' / ') + ' · 그림 ' + r.cv + ' · 답 ' + r.A);
      await pickAns(); const s2 = await S(), ban = await ev(() => (document.getElementById('hudBan') || {}).textContent || ''); ok(s2.id === 'bus' && /갈아타요/.test(ban), '맞히면 버스 타기 · 한 줄에 갈아타기(' + s2.id + ' · 「' + ban.slice(0, 60) + '」)'); } }
    await shut(); await ev(() => { SM_TOWN.storyOff(); SM_TOWN.game().S.story.autoNext = null; });

    console.log('⑫ COVER-2 3-2 — 물때표(창 안) → 썰물에만 지켜보기'); const tideM = { hi: null, lo: null };
    const waitLbl = async () => { await shut(); await ev(() => SM_TOWN.storyOpen()); await W8(500); const t = await ev(() => { const b9 = document.querySelector('.twn-p [data-a="wait"]'); return b9 ? b9.textContent.trim() : ''; }); await shut(); return t; };
    await ev(() => { SM_TOWN.game().S.min = 7 * 60; }); await ev(i9 => SM_TOWN.storyAt('a1_5', i9), ix('a1_5', 'tide')); await W8(900); ok(await panel(), '물때 고르기 창');
    { const r = await ev(() => ({ tx: (document.querySelector('.twn-p') || {}).innerText || '', lb: [...document.querySelectorAll('.twn-p button[data-k]')].map(b9 => b9.dataset.k + '=' + b9.textContent.trim()) })); ok(/물때표\(오늘\)/.test(r.tx) && /썰물/.test(r.tx) && r.lb.length >= 2 && !r.lb.some(t => /썰물|밀물/.test(t)), '창 안 물때표 + 보기는 시각만(' + r.lb.join(' / ') + ')');
      for (const t of r.lb) { const [k, lab] = t.split('='), m9 = (lab.match(/(\d\d):(\d\d)/) || []).slice(1).map(Number); if (m9.length < 2) continue; const mm = m9[0] * 60 + m9[1]; if (/^H/.test(k) && tideM.hi == null) tideM.hi = mm; if (/^L/.test(k) && mm + 20 > 7 * 60 && tideM.lo == null) tideM.lo = mm + 20; }
      const hk = r.lb.map(t => t.split('=')[0]).find(k => /^H/.test(k)); if (hk) { await ev(k => { const b9 = document.querySelector('.twn-p button[data-k="' + k + '"]'); if (b9) b9.click(); const o9 = document.querySelector('.twn-p [data-a="ok"]'); if (o9) o9.click(); }, hk); await W8(600); const t = await ev(() => (document.querySelector('.twn-p .twn-chr') || {}).textContent || ''); ok(/밀물이라/.test(t), '밀물 시각 = 반응 「' + t.slice(0, 40) + '」'); } }
    await pickAns(); { const s = await S(), ban = await ev(() => (document.getElementById('hudBan') || {}).textContent || ''); ok(s.id !== 'tide' && /물이 빠져 갯벌이 드러나요/.test(ban), '맞히면 다음(' + s.id + ' · 「' + ban.slice(0, 50) + '」)'); }
    await shut(); await ev(i9 => SM_TOWN.storyAt('a1_5', i9), ix('a1_5', 'watch')); await W8(900); await shut();
    { const TM = tideM; if (!TM.hi || !TM.lo) console.log('    (물때 보기 없음 · ' + JSON.stringify(TM) + ')'); else {
      await ev(m => { const G = SM_TOWN.game().S, a9 = G.story.v.at; G.min = m; if (a9) SD2.map.player.teleport([a9.x + 2, SM_TOWN.ground(a9.x + 2, a9.z) + 1.5, a9.z]); }, TM.hi); await W8(2600); const ban = await ev(() => (document.getElementById('hudBan') || {}).textContent || '');
      ok(/밀물이라 갯벌이 물에 잠겼어요/.test(ban) && (await S()).id === 'watch', '밀물(' + TM.hi + '분) = 아직(「' + ban.slice(0, 40) + '」)'); const wt = await waitLbl(); ok(/썰물/.test(wt), '기다리기 단추 = ' + wt);
      await ev(m => { SM_TOWN.game().S.min = m; }, TM.lo); let s = null; for (let i = 0; i < 16; i++) { await W8(700); s = await S(); if (s.id !== 'watch') break; } ok(s.id === 'why', '썰물(' + TM.lo + '분) + 가만히 6초 → 갯벌이 하는 일(' + s.id + ')'); } }
    await shut(); await ev(() => { SM_TOWN.storyOff(); SM_TOWN.game().S.story.autoNext = null; });

    console.log('⑬ COVER-2 3-3 — 날씨 전선: 비 오는 날 배추밭 곁에서');
    await ev(i9 => SM_TOWN.storyAt('a2_4', i9), ix('a2_4', 'rain')); await W8(900); await shut();
    { const s0 = await ev(() => SM_TOWN.story().step || {}); ok(s0.id === 'rain' && s0.type === 'front', '단계 = 날씨 전선(' + s0.id + ':' + s0.type + ')'); await W8(1500); ok((await S()).id === 'rain', '맑은 날 = 그대로');
      await ev(() => SM_TOWN.rules.wx('rain')); await W8(1500); const t = await ev(() => SM_TOWN.storyTarget()); ok(!!t, '비 오는 날 목적지 = ' + (t && t.name));
      if (t) { await ev(t9 => { const x = t9.x + 3, z = t9.z + 3; SD2.map.player.teleport([x, SM_TOWN.ground(x, z) + 1.5, z]); SM_TOWN.game().S.min = 20 * 60; }, t); let s = null; for (let i = 0; i < 10; i++) { await W8(600); s = await S(); if (s.id !== 'rain') break; } const ban = await ev(() => (document.getElementById('hudBan') || {}).textContent || ''); ok(s.id === 'safe', '배추밭 곁 = 산길 약속으로(' + s.id + ' · 「' + ban.slice(0, 50) + '」)'); }
      await ev(() => SM_TOWN.rules.wx('clear')); }
    await shut(); await ev(() => { SM_TOWN.storyOff(); SM_TOWN.game().S.story.autoNext = null; });

    console.log('⑭ COVER-2 3-4 — 야생동물(마을 솜씨 꼬리표 wild:)');
    await ev(i9 => SM_TOWN.storyAt('a2_5', i9), ix('a2_5', 'wild')); await W8(900); await shut();
    { const t = await ev(() => SM_TOWN.storyTarget()); ok(!!t && /천연기념물/.test(t.name), '목적지 = ' + (t && t.name)); await ev(() => SM_TOWN.skUp('look', 1, 'shore:x')); await W8(400); ok((await S()).id === 'wild', '다른 꼬리표 = 아직'); await ev(() => SM_TOWN.skUp('look', 1, 'wild:deer')); await W8(700); const s = await S(), ban = await ev(() => (document.getElementById('hudBan') || {}).textContent || ''); ok(s.id === 'line' && /숲이 우거지면/.test(ban), 'wild: → 한 줄(' + s.id + ')'); }
    await shut(); await ev(() => { SM_TOWN.storyOff(); SM_TOWN.game().S.story.autoNext = null; });

    console.log('⑮ COVER-2 3-5 — 관광 안내소(나들터) → 전망대 → 더 높은 산');
    await ev(i9 => SM_TOWN.storyAt('q_contour', i9), ix('q_contour', 'desk')); await W8(900); await shut();
    { const t = await ev(() => { const t9 = SM_TOWN.storyTarget(); return t9 ? { ...t9, reg: SM_TOWN.regionAt ? SM_TOWN.regionAt(t9.x, t9.z) : '' } : null; }); ok(!!t && /관광 안내소/.test(t.name) && t.reg === '관광', '목적지 = ' + (t && t.name) + ' (' + (t && t.reg) + ')'); if (t) { await ev(t9 => { const x = t9.x + 1, z = t9.z + 1; SD2.map.player.teleport([x, SM_TOWN.ground(x, z) + 1.5, z]); }, t); let s = null; for (let i = 0; i < 8; i++) { await W8(500); s = await S(); if (s.id !== 'desk') break; } ok(s.id === 'go', '안내소 → 전망대(' + s.id + ')'); } }
    await ev(i9 => SM_TOWN.storyAt('q_contour', i9), ix('q_contour', 'top')); await W8(900); await shut();
    { const t = await ev(() => SM_TOWN.storyTarget()); ok(!!t && /꼭대기/.test(t.name), '꼭대기 목적지(' + (t && [Math.round(t.x), Math.round(t.z)]) + ')'); if (t) { await ev(t9 => { SD2.map.player.teleport([t9.x, SM_TOWN.ground(t9.x, t9.z) + 1.5, t9.z]); }, t); let s = null; for (let i = 0; i < 8; i++) { await W8(500); s = await S(); if (s.id !== 'top') break; } const ban = await ev(() => (document.getElementById('hudBan') || {}).textContent || ''); ok(s.id === 'real' && /꼭대기까지 걸어서 약 \d+초/.test(ban), '꼭대기 = 걸어 잰 시간 → 우리 동네(' + s.id + ' · 「' + ban.slice(0, 50) + '」)'); } }
    await shut(); await ev(() => { SM_TOWN.storyOff(); SM_TOWN.game().S.story.autoNext = null; });

    console.log('⑯ COVER-2 4-1 — 한 표 → 잔치 마당이 그 자리로 · 정류장까지 걸어 재기 → 창구(시내)');
    { const r = await ev(() => { const F = SM_TOWN.feast(), s0 = F.info().site; SM_TOWN.game().S.story.fest.site = '축구장'; F.sec(true); const s1 = F.info().site, P = SM_TOWN.places().find(q => q.name === '축구장'); return { s0, s1, P: P ? [P.x, P.z] : null }; }); const d1 = r.P && r.s1 ? Math.hypot(r.s1[0] - r.P[0], r.s1[1] - r.P[1]) : 1e9; ok(d1 < 160, '잔치 마당 → 축구장 둘레(' + JSON.stringify(r.s0) + ' → ' + JSON.stringify(r.s1) + ' · ' + Math.round(d1) + 'm)'); }
    await ev(i9 => SM_TOWN.storyAt('a3_1', i9), ix('a3_1', 'pace')); await W8(900); await shut();
    { const t = await ev(() => SM_TOWN.storyTarget()); ok(!!t && /정류장/.test(t.name), '걸어 잴 곳 = ' + (t && t.name)); if (t) { await W8(3200); await ev(t9 => { SD2.map.player.teleport([t9.x + 1, SM_TOWN.ground(t9.x + 1, t9.z) + 1.5, t9.z]); }, t); let s = null; for (let i = 0; i < 8; i++) { await W8(500); s = await S(); if (s.id !== 'pace') break; } const ban = await ev(() => (document.getElementById('hudBan') || {}).textContent || ''); ok(s.id === 'desk' && /걸어서 약 \d+초/.test(ban), '잰 시간이 수첩에 → 창구(' + s.id + ' · 「' + ban.slice(0, 60) + '」)'); } }
    { const t = await ev(() => { const t9 = SM_TOWN.storyTarget(); return t9 ? { ...t9, reg: SM_TOWN.regionAt ? SM_TOWN.regionAt(t9.x, t9.z) : '' } : null; }); ok(!!t && /행정복지센터/.test(t.name) && t.reg === '시내', '창구 = ' + (t && t.name) + ' (' + (t && t.reg) + ')'); if (t) { await ev(t9 => { SD2.map.player.teleport([t9.x + 1, SM_TOWN.ground(t9.x + 1, t9.z) + 1.5, t9.z]); }, t); let s = null; for (let i = 0; i < 8; i++) { await W8(500); s = await S(); if (s.id !== 'desk') break; } ok(s.id === 'line', '창구 → 의견서(' + s.id + ')'); ok(await panel(), '의견서 문장 틀'); const nb = await ev(() => (document.querySelector('.twn-p') || {}).innerText || ''); ok(/걸어서 약 \d+초/.test(nb), '의견서 창에 잰 것(수첩)'); } }
    await shut(); await ev(() => { SM_TOWN.storyOff(); SM_TOWN.game().S.story.autoNext = null; });

    console.log('⑰ COVER-2 4-3 — 집배원 체험(마을 기록 job)');
    await ev(i9 => SM_TOWN.storyAt('a3_3', i9), ix('a3_3', 'post')); await W8(900); await shut();
    { const t = await ev(() => SM_TOWN.storyTarget()); ok(!!t && /우체국/.test(t.name), '목적지 = ' + (t && t.name)); await ev(() => SM_TOWN.rec().add('job', { k: 'fire', done: 1, pr: 0 })); await W8(400); ok((await S()).id === 'post', '다른 체험 = 아직'); await ev(() => SM_TOWN.rec().add('job', { k: 'post', done: 1, pr: 0 })); await W8(700); ok((await S()).id === 'first', '집배원 끝 → 동네 고르기'); }
    await shut(); await ev(() => { SM_TOWN.storyOff(); SM_TOWN.game().S.story.autoNext = null; });

    console.log('⑱ COVER-2 4-5 — 판 밖 층층골 화석 → 까망봉 분화구(솜씨 꼬리표 xp:)');
    await ev(i9 => SM_TOWN.storyAt('a3_5', i9), ix('a3_5', 'fos')); await W8(900); await shut();
    { const s0 = await S(); if (s0.id !== 'fos') console.log('    (판 밖이 없는 마을 = 건너뜀 · ' + s0.id + ')'); else { const t = await ev(() => SM_TOWN.storyTarget()); ok(!!t && /층층골/.test(t.name), '목적지 = ' + (t && t.name)); await ev(() => SM_TOWN.skUp('look', 2, 'xp:fos')); await W8(700); const t2 = await ev(() => SM_TOWN.storyTarget()); ok((await S()).id === 'crater' && /까망봉/.test((t2 || {}).name || ''), '화석 → 까망봉'); await ev(() => SM_TOWN.skUp('look', 2, 'xp:crater')); await W8(700); ok((await S()).id === 'b1', '분화구 → 자랑 쓰기'); } }
    await shut(); await ev(() => { SM_TOWN.storyOff(); SM_TOWN.game().S.story.autoNext = null; });

    console.log('⑲ COVER-2 4-6 — 장구 선생님께 장단(마을 기록 janggu)');
    await ev(i9 => SM_TOWN.storyAt('a3_6', i9), ix('a3_6', 'jg')); await W8(900); await shut();
    { const s0 = await S(); if (s0.id !== 'jg') console.log('    (장구 선생님이 없는 마을 = 건너뜀)'); else { const t = await ev(() => SM_TOWN.storyTarget()); ok(!!t && /장구/.test(t.name), '목적지 = ' + (t && t.name)); await ev(() => SM_TOWN.rec().add('janggu', { open: 'learn', lv: 0 })); await W8(400); ok((await S()).id === 'jg', '창만 열면 = 아직'); await ev(() => SM_TOWN.rec().add('janggu', { lv: 0, s: 2, up: null })); await W8(700); ok((await S()).id === 'line', '한 판 끝 → 한 줄'); } }
    await shut(); await ev(() => { SM_TOWN.storyOff(); SM_TOWN.game().S.story.autoNext = null; });

    console.log('⑳ COVER-2 피날레 = 잔치 엔진 첫 잔치(내일로 당김 → 10시 → 잔치 마당 → 무대 → 모인 이웃)');
    { const d0 = await ev(() => SM_TOWN.game().S.day); await ev(() => SM_TOWN.storyAt('f1', 0)); const t = await dlgAll(); const I = await ev(() => SM_TOWN.feast().info()); ok(I.fd === d0 + 1 && I.n === 0, '잔치 날 = 내일(' + I.fd + ' · 오늘 ' + d0 + ' · 첫 잔치 n ' + I.n + ')'); ok(/우리 마을 첫 잔치 날이 내일로/.test(t), '쪽지 = 엔진 판(' + t.slice(0, 50) + '…)');
      const s1 = await waitStep(q => q.id !== 'n', 6000); ok(s1.id === 'night', '쪽지 → 잔치 날 기다리기(' + s1.id + ')'); const w1 = await waitLbl(); ok(/잔치 날 아침/.test(w1), '기다리기 = ' + w1);
      await ev(fd => { const G = SM_TOWN.game().S; G.day = fd; G.min = 10 * 60 + 30; SM_TOWN.feast().sec(true); }, I.fd); let s = null; for (let i = 0; i < 10; i++) { await W8(600); s = await S(); if (s.id !== 'night') break; } ok(s.id === 'go', '잔치 날 10시 → 잔치 마당 가기(' + s.id + ')');
      const ty = await ev(() => { const t9 = SM_TOWN.storyTarget(), y = SM_TOWN.feast().yard(); return { t: t9, y }; }); ok(!!ty.t && !!ty.y && Math.hypot(ty.t.x - ty.y.door[0], ty.t.z - ty.y.door[1]) < 2, '목적지 = 엔진 잔치 마당(' + (ty.t && ty.t.name) + ')');
      if (ty.t) { await ev(t9 => { SD2.map.player.teleport([t9.x, SM_TOWN.ground(t9.x, t9.z) + 1.5, t9.z]); }, ty.t); for (let i = 0; i < 10; i++) { await W8(600); s = await S(); if (s.id !== 'go') break; } ok(s.id === 'play', '잔치 마당 → 무대·잔칫상(' + s.id + ')'); }
      await ev(() => { const f = SM_TOWN.game().S.feast; f.fx.show = 1; }); for (let i = 0; i < 6; i++) { await W8(600); s = await S(); if (s.id !== 'play') break; } ok(s.id === 'greet', '무대 장단(fx.show) → 인사(' + s.id + ')');
      let G9 = []; for (let i = 0; i < 8 && G9.length < 2; i++) { await W8(800); await ev(() => SM_TOWN.feast().sec(true)); G9 = await ev(() => SM_TOWN.feastP ? SM_TOWN.feastP() : []); } ok(G9.length >= 2, '모인 이웃 ' + G9.length); for (const g of G9.slice(0, 3)) { await ev(g9 => { SD2.map.player.teleport([g9[1] + 0.6, SM_TOWN.ground(g9[1] + 0.6, g9[2]) + 1.5, g9[2]]); }, g); await W8(1600); s = await S(); if (s.id !== 'greet') break; } ok(s.id === 'line', '이웃 둘 인사 → 한 줄(' + s.id + ')');
      const tents = await ev(() => { const m = SM_TOWN.fest ? SM_TOWN.fest() : null; return m ? m.pot : 'na'; }); ok(!tents, '이야기 천막·투호 항아리 X(잔치 마당 = 엔진 · ' + JSON.stringify(tents) + ')'); }
    await shut(); await ev(() => { SM_TOWN.storyOff(); SM_TOWN.game().S.story.autoNext = null; });

    console.log('⑳-2 COVER-2 피날레 도중 잔치 날을 놓치면 → 다음 잔치를 내일로 · 잔치 날 기다리기부터');
    { await ev(() => { const G = SM_TOWN.game().S, f = G.feast; G.day = (f.fd | 0) + 1; G.min = 8 * 60; SM_TOWN.feast().sec(true); }); await ev(i9 => SM_TOWN.storyAt('f1', i9), ix('f1', 'play')); let s = null; for (let i = 0; i < 10; i++) { await W8(600); s = await S(); if (s.id === 'night') break; } const I = await ev(() => SM_TOWN.feast().info()); ok(s.id === 'night' && I.fd === I.day + 1, '놓친 잔치 = 잔치 날 기다리기로 · 다음 잔치 내일(' + s.id + ' · ' + I.fd + '/' + I.day + ')'); }
    await shut(); await ev(() => { SM_TOWN.storyOff(); SM_TOWN.game().S.story.autoNext = null; });

    console.log('㉑ COVER-2 에필로그 — 쪽지 전하기 → 마디탑(마을 기록 tower)');
    await ev(i9 => SM_TOWN.storyAt('c5', i9), ix('c5', 'tower')); await W8(900); await shut();
    { const s0 = await S(); if (s0.id !== 'tower') console.log('    (마디탑이 없는 마을 = 건너뜀)'); else { const t = await ev(() => SM_TOWN.storyTarget()); ok(!!t && /마디탑/.test(t.name), '목적지 = ' + (t && t.name)); await ev(() => SM_TOWN.rec().add('tower', { n: 1 })); await W8(900); const dn = await ev(() => !!SM_TOWN.game().S.story.done.c5); ok(dn, '마디탑 → 에필로그 끝'); } }
    await shut(); await ev(() => { SM_TOWN.storyOff(); SM_TOWN.game().S.story.autoNext = null; });

    console.log('㉒ COVER-2 옛 저장 — 게시판에 붙은 q_contour · 피날레 \'밤\' 단계');
    { const r = await ev(() => { const s = SM_TOWN.game().S.story; s.board = s.board || { day: 0, list: [], took: {} }; s.board.list.push('q_contour'); s.board.took.q_contour = 1; return SM_TOWN.storyCan('q_contour'); }); console.log('    q_contour 열림(3막 열림에 따름) = ' + r); await ev(() => SM_TOWN.storyOpen && SM_TOWN.storyOpen()); await W8(700); const tx = await ev(() => (document.querySelector('.twn-p') || {}).innerText || ''); ok(!/본부 의뢰[\s\S]*측량 도우미[\s\S]*이어 하기|맡기/.test(tx.split('3막')[0] || ''), '목록 창 = 오류 없음 · 게시판 칸에 측량 도우미 X'); }
    await shut();
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
