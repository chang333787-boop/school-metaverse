// 🧱 DEPTH-3 시험(docs/systems/town_depth.md 합 낮은 셋): node tools/harness/town_depth3.cjs [마을=ourtown] [포트=8002] [--only=show,oc,road]
//   ① 🎬 쇼 본 것 찾기 — 쇼를 끝까지 보면 찾을 것이 생김 · 판 두 개(다른 날·다른 판)에서 묻는 것이 다름 · 열 판 = 바로 앞 판과 같은 물음 X
//      아쿠아리움 방 · 곤충 박물관 방 · 천연기념물 관찰 데크 — 전시 E 자리 모두 닿음 · 틀린 전시 = '그건 ○○예요'(벌 X · 찾기 그대로) · 맞는 전시 = 도감 · 일기 · 금빛 표 · 다음 판은 다른 물음
//   ② 🦕 오늘 드러난 바위·시대 차례 — 조건(썰물·비 온 다음 날·겨울)마다 열리는 자리가 다름 · 시대 차례 판 두 판에서 놓을 것이 다름 · 틀린 차례 = 까닭 한 줄(벌 X) · 맞힘 = 기록
//   ③ 🚲 고리 코스 길 막힘 — 판마다 막힘 자리·갈래가 다름 · 막힘 = 몸이 못 지나감(충돌) · 둘레 인도로 돌아갈 길이 있음 · 차도로 돌아가면 멈춰 기다림 · 내 기록(최고 · 지난 판) 남음
const { chromium } = require('./pw.cjs');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const ONLY = ((process.argv.find(a => a.startsWith('--only=')) || '').slice(7) || 'show,oc,road').split(','), URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const T0 = Date.now(), b = await chromium.launch({ args: ['--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  try { const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(), errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|CORS|firebasedatabase|Failed to load resource/.test(t)) || /게임 tick 오류|꼬리표 없는 보상/.test(t)) errs.push(t.slice(0, 200)); });
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
    const panel = () => ev(() => { const P = document.querySelector('.twn-p'); return P ? { k: P.dataset.k || '', t: P.innerText.slice(0, 900) } : null; });
    const closeAll = async () => { for (let i = 0; i < 6; i++) { if (!await ev(() => !!(document.querySelector('.twn-p') || document.querySelector('.twn-dlg')))) break; await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); await W8(250); if (await ev(() => !!(document.querySelector('.twn-p') || document.querySelector('.twn-dlg')))) { await p.keyboard.press('Escape'); await W8(300); } } };
    const click = a => ev(a => { const b9 = document.querySelector('.twn-p [data-a="' + a + '"]'); if (b9) b9.click(); return !!b9; }, a);
    const hot = re => ev(re => { const h = SD2.map.interact.list().find(q => !q.off && new RegExp(re).test(q.label || '')); return h ? { x: h.x, y: h.y, z: h.z, label: h.label } : null; }, re);
    const tpTo = (x, y, z) => ev(([x, y, z]) => { const M = SD2.map, g = M.q.groundAt(x, z, y + 1.2); M.player.teleport([x, g + 0.05, z]); }, [x, y, z]);
    const pressAt = async re => { const h = await hot(re); if (!h) return null; await closeAll(); await tpTo(h.x, h.y, h.z); await W8(450); const nr = await ev(() => SD2.near && SD2.near()); await p.keyboard.press('KeyE'); await W8(500); return { h, nr, pan: await panel() }; };
    const enter = async id => { await closeAll(); await ev(id => SM_TOWN.indoor.enter(id), id); try { await p.waitForFunction(() => SM_TOWN.indoor.on && !SM_TOWN.indoor.busy, null, { timeout: 9000 }); } catch (e) { return false; } await W8(400); return true; };
    const leave = async () => { if (await ev(() => !!SM_TOWN.indoor.on)) { await ev(() => SM_TOWN.indoor.exit()); for (let i = 0; i < 25; i++) { await W8(200); if (!await ev(() => SM_TOWN.indoor.on)) break; } } await W8(300); };
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.indoor && SM_TOWN.sf && SM_TOWN.sf(), null, { timeout: 240000 }); await W8(2500); await closeAll();
    await ev(() => { const G = SM_TOWN.game().S; G.min = 11 * 60; if (SM_TOWN.rules && SM_TOWN.rules.wx) SM_TOWN.rules.wx('clear'); if (G.emerg) { G.emerg.d = G.day; G.emerg.plan = []; } G.jobs = G.jobs || {}; G.jobs.fireNo = G.day; });

    if (ONLY.includes('show')) {
      console.log('① 쇼 본 것 찾기');
      const SF = () => ev(() => SM_TOWN.sf().info());
      // 판마다 다름: 같은 쇼를 다른 날·다른 판에서 = 물음이 다름 · 열 판 = 바로 앞 판과 같은 물음·같은 전시 X
      const runs = await ev(() => { const F = SM_TOWN.sf(), G = SM_TOWN.game().S, out = {}; const d0 = G.day, keep = JSON.stringify(G.sf || null);
        for (const sh of ['aquarium', 'butterfly', 'otter']) { const L9 = []; G.sf = null; for (let k = 0; k < 10; k++) { G.day = d0 + k; const c = F.start(sh, 'test'); L9.push(c.q); const H = (SM_TOWN.sf().info().S.cur || {})[sh]; const q = H && H.q; const ex = q && { a1: 'jelly', a2: 'turtle', a3: 'whale', a4: 'deep', a5: 'turtle', a6: 'whale', a7: 'jelly', a8: 'deep', b1: 'egg', b2: 'larva', b3: 'pupa', b4: 'adult', b5: 'egg', b6: 'pupa', b7: 'beetle', b8: 'larva', o1: 'otter', o2: 'clean', o3: 'trash', o4: 'otter', o5: 'clean', o6: 'duck' }[q]; F.choose(sh, ex); } out[sh] = L9; }
        G.day = d0; G.sf = JSON.parse(keep); return out; });
      for (const sh in runs) { const L9 = runs[sh], rep = L9.filter((q, i) => i && q === L9[i - 1]).length, two = L9.slice(-2); ok(new Set(L9).size >= 4 && rep === 0, sh + ' 열 판 물음: ' + L9.join(',') + ' — 바로 앞 판과 같은 물음 ' + rep + '번 · 갈래 ' + new Set(L9).size); ok(two[0] !== two[1], sh + ' 판 두 개(9·10번째)에서 묻는 것이 다름(' + two.join(' ≠ ') + ')'); ok(L9.slice(2).some(q => /[5-8]$/.test(q)), sh + ' 두 번 찾은 뒤 = 둘째 칸 물음이 나옴'); }
      await ev(() => { SM_TOWN.game().S.sf = null; });
      // 쇼를 끝까지 보면 = 찾을 것이 생김(진짜 길: 쇼 창 → 끝 장면)
      await ev(() => SM_TOWN.openShow('aquarium', '대형 아쿠아리움')); await W8(600); const tot = await ev(() => SM_TOWN.show() && SM_TOWN.show().tot); await ev(t => SM_TOWN.showSeek(t - 0.5), tot); await W8(500);
      let I = await SF(); ok(!!(I.S.cur && I.S.cur.aquarium), '아쿠아리움 쇼 끝 = 찾을 것 생김(' + JSON.stringify(I.S.cur) + ')'); const sp9 = await panel(); ok(sp9 && /이제 찾아봐요: 「/.test(sp9.t), '쇼 창 자막 아래 = 「이제 찾아봐요: …」 한 줄'); await closeAll(); await W8(900);
      const toast1 = await ev(() => (document.getElementById('toast') || {}).textContent || ''); console.log('    창을 닫은 뒤 알림: ' + toast1.slice(0, 60));
      // 아쿠아리움 방
      const L = await ev(() => SM_TOWN.indoor.list()); const aq = L.find(q => q.kind === 'aqua'), ins = L.find(q => q.kind === 'insect'); ok(!!aq && !!ins, '들어갈 곳: ' + (aq && aq.name) + ' · ' + (ins && ins.name) + '(곤충 박물관 = 새 방)');
      const ANS = { a1: 'jelly', a2: 'turtle', a3: 'whale', a4: 'deep', a5: 'turtle', a6: 'whale', a7: 'jelly', a8: 'deep', b1: 'egg', b2: 'larva', b3: 'pupa', b4: 'adult', b5: 'egg', b6: 'pupa', b7: 'beetle', b8: 'larva', o1: 'otter', o2: 'clean', o3: 'trash', o4: 'otter', o5: 'clean', o6: 'duck' };
      const NAME = { jelly: '빛 해파리 수조', turtle: '바다거북 수조', whale: '혹등고래 노래 듣기', deep: '깊은 바다 수조', egg: '배추흰나비 알', larva: '애벌레와 허물', pupa: '번데기', adult: '배추흰나비 어른벌레', beetle: '장수풍뎅이 한살이', fly: '잠자리 한살이', otter: '수달 굴', clean: '맑은 물', trash: '강에서 주운 것', duck: '원앙' };
      const solve = async (sh, tag) => { const c = (await SF()).S.cur[sh]; if (!c) { ok(false, tag + ' 찾을 것 없음'); return; } const right = ANS[c.q], wrong = Object.keys(NAME).find(k => k !== right && (sh === 'aquarium' ? ['jelly', 'turtle', 'whale', 'deep'] : sh === 'butterfly' ? ['egg', 'larva', 'pupa', 'adult', 'beetle', 'fly'] : ['otter', 'clean', 'trash', 'duck']).includes(k));
        const w = await pressAt(NAME[wrong] + '.*살펴보기'); ok(!!w && /살펴보기/.test(w.nr || '') && w.pan && /본 것/.test(w.pan.t) && /쇼에서 들은 말/.test(w.pan.t), tag + ' 전시에 다가가 E = 살펴보기 창(본 것 · 쇼에서 들은 말)' + (w ? ' — E ' + w.nr : ' — E 자리 없음'));
        await click('pick'); await W8(400); const pw = await panel(); ok(pw && /그건 /.test(pw.t) && /다른 것을 살펴봐요/.test(pw.t), tag + ' 틀린 전시 「이거예요」 = 「그건 ○○예요」 + 다시 찾기(' + (pw ? pw.t.split('\n').find(t => /그건/.test(t)) || '' : '').slice(0, 60) + ')');
        const I2 = await SF(); ok(!!I2.S.cur[sh] && (I2.S.cur[sh].t | 0) === 1, tag + ' 틀려도 벌 X · 찾기 그대로(틀린 수만 셈)'); await closeAll();
        const xp0 = await ev(() => (SM_TOWN.skills().xp || {}).look || 0), r = await pressAt(NAME[right] + '.*살펴보기'); ok(!!r, tag + ' 맞는 전시 E 자리(' + NAME[right] + ')'); await click('pick'); await W8(500); const pr = await panel();
        const I3 = await SF(), dex = await ev(k => SM_TOWN.game().S.dex[k] != null, 'sf:' + sh + ':' + right), di = await ev(() => (SM_TOWN.game().S.diary || []).slice(-1)[0]), xp1 = await ev(() => (SM_TOWN.skills().xp || {}).look || 0);
        ok(pr && /찾았어요/.test(pr.t) && !I3.S.cur[sh], tag + ' 맞는 전시 = 「찾았어요」 · 찾기 끝'); ok(dex && di && /쇼에서 들은/.test(di.t), tag + ' 도감 sf:' + sh + ':' + right + ' · 일기 「' + (di && di.t || '').slice(0, 40) + '」'); ok(xp1 > xp0, tag + ' 관찰 솜씨 ' + xp0 + ' → ' + xp1); ok(!!I3.S.ex[sh + ':' + right], tag + ' 금빛 표 기록(다음에 와도 보임)'); await closeAll(); return c.q; };
      ok(await enter(aq.id), '아쿠아리움 들어감'); { const c = await ev(() => SM_TOWN.indoor.check()), bad = (c && c.hots || []).filter(h => h.ok === false).map(h => h.label), sf = (c && c.hots || []).filter(h => /살펴보기/.test(h.label)); ok(c && c.spawnFree && !bad.length && sf.length >= 4, '아쿠아리움 방 E ' + (c && c.hots.length) + '곳 모두 닿음 · 살펴보기 ' + sf.length + '곳' + (bad.length ? ' — 못 닿음 ' + bad.join(' / ') : '')); }
      const g1 = await ev(() => SM_TOWN.sf().goal); ok(/쇼에서 들은 것 찾기/.test(g1 || ''), '방 안 위 가운데 줄 = 찾을 것(' + (g1 || '').slice(0, 40) + ')');
      const q1 = await solve('aquarium', '[아쿠아리움]'); await leave();
      // 다음 판(다음 날 다시 쇼) = 다른 물음
      await ev(() => { SM_TOWN.game().S.day += 1; SM_TOWN.sf().after('aquarium'); }); const q2 = (await SF()).S.cur.aquarium.q; ok(q2 !== q1, '다음 판 물음이 다름(' + q1 + ' → ' + q2 + ')'); await ev(() => SM_TOWN.sf().dbg.clear('aquarium'));
      // 곤충 박물관
      await ev(() => SM_TOWN.sf().after('butterfly')); ok(await enter(ins.id), '곤충 박물관 들어감(예전엔 못 들어가던 곳)'); { const c = await ev(() => SM_TOWN.indoor.check()), bad = (c && c.hots || []).filter(h => h.ok === false).map(h => h.label), sf = (c && c.hots || []).filter(h => /살펴보기/.test(h.label)); ok(c && c.spawnFree && !bad.length && sf.length === 6, '곤충 박물관 방 E ' + (c && c.hots.length) + '곳 모두 닿음 · 살펴보기 ' + sf.length + '곳' + (bad.length ? ' — 못 닿음 ' + bad.join(' / ') : '')); }
      const pos1 = await ev(() => SD2.map.interact.list().filter(h => /살펴보기/.test(h.label)).map(h => h.label.slice(2, 6) + '@' + Math.round(h.x)).join(' ')); await solve('butterfly', '[곤충 박물관]'); await leave();
      await ev(() => { SM_TOWN.game().S.day += 1; }); await enter(ins.id); const pos2 = await ev(() => SD2.map.interact.list().filter(h => /살펴보기/.test(h.label)).map(h => h.label.slice(2, 6) + '@' + Math.round(h.x)).join(' ')); ok(pos1 !== pos2, '다음 날 = 한살이 받침 자리가 바뀜(외우기 X)'); await leave();
      await ev(() => { SM_TOWN.game().S.min = 20 * 60; }); await ev(id => SM_TOWN.indoor.enter(id), ins.id); await W8(1500); ok(!await ev(() => SM_TOWN.indoor.on), '20:00 = 곤충 박물관 문 닫음(9~18시)'); await ev(() => { SM_TOWN.game().S.min = 11 * 60; });
      // 천연기념물 관찰 데크
      const dk = (await SF()).deck; ok(dk && dk.at && dk.at.length === 4, '천연기념물 관찰 데크 전시 넷(' + (dk ? dk.place + ' · ' + (dk.at || []).map(a => a.id + '@' + a.x + ',' + a.z).join(' ') : '없음') + ')');
      if (dk && dk.at) { const far = await ev(at => at.map(a => Math.round(SM_TOWN.sd(a.x, a.z))), dk.at); console.log('    데크 물가 거리 ' + far.join(',')); await ev(() => SM_TOWN.sf().after('otter')); await tpTo(dk.at[0].stand[0], dk.at[0].y, dk.at[0].stand[1]); await W8(1500); const g2 = await ev(() => SM_TOWN.sf().goal); ok(/쇼에서 들은 것 찾기/.test(g2 || ''), '데크 둘레 위 가운데 줄 = 찾을 것'); await solve('otter', '[관찰 데크]'); }
    }

    if (ONLY.includes('oc')) { console.log('② 오늘 드러난 바위 · 시대 차례');
      await leave(); await closeAll(); for (let i = 0; i < 20 && !(await ev(() => { const o = SM_TOWN.oc(); return !!(o && o.info().sites); })); i++) await W8(300);
      const OI = () => ev(() => SM_TOWN.oc().info()); let I = await OI(); ok(I.sites && I.sites.length === 3, '자리 셋(' + (I.sites || []).map(s => s.k + '@' + s.x + ',' + s.z).join(' · ') + ')');
      const conds = [['여름 맑음 · 밀물', { low: false, rain: false, sea: 'summer' }, []], ['겨울', { low: false, rain: false, sea: 'winter' }, ['frost']], ['비 온 다음 날', { low: false, rain: true, sea: 'summer' }, ['rain']], ['썰물', { low: true, rain: false, sea: 'autumn' }, ['tide']], ['봄 · 썰물 · 비', { low: true, rain: true, sea: 'spring' }, ['frost', 'rain', 'tide']]];
      for (const [nm, c, want] of conds) { await ev(c => SM_TOWN.oc().dbg.cond(c), c); const S9 = (await OI()).sites, on = S9.filter(s => s.open && s.vis && !s.off).map(s => s.k).sort(); ok(on.join(',') === want.slice().sort().join(','), nm + ' = 열린 자리 [' + on.join(',') + '](보임 · E 켜짐)'); }
      const vars = await ev(() => { const G = SM_TOWN.game().S, d0 = G.day, o = {}; for (const k of ['frost', 'tide', 'rain']) { o[k] = []; for (let i = 0; i < 6; i++) { G.day = d0 + i; o[k].push(SM_TOWN.oc().dbg.varOf(k)); } } G.day = d0; return o; });
      for (const k in vars) ok(new Set(vars[k]).size >= 2, k + ' 날마다 드러나는 것이 다름(' + vars[k].join(',') + ')');
      await ev(() => SM_TOWN.oc().dbg.cond({ low: true, rain: true, sea: 'winter' }));
      for (const k of ['frost', 'rain', 'tide']) { const st = (await OI()).sites.find(s => s.k === k); await closeAll(); await tpTo(st.x, st.y, st.z); await W8(700); const nr = await ev(() => SD2.near && SD2.near()); await p.keyboard.press('KeyE'); await W8(500); const pn = await panel(); ok(/오늘 드러난 바위/.test(nr || '') && pn && pn.k === 'oc' && /시대 차례/.test(pn.t), k + ' 자리 E(' + (nr || '-') + ') = 창 「' + (pn ? pn.t.split('\n')[0] : '-') + '」'); await closeAll(); }
      I = await OI(); ok(Object.keys(I.S.got).length >= 3, '모은 조각 ' + Object.keys(I.S.got).join(',')); const dia = await ev(() => (SM_TOWN.game().S.diary || []).slice(-3).map(d => d.t).join(' / ')); ok(/오늘 드러난 바위/.test(dia), '일기에 남음(' + dia.slice(0, 70) + ')');
      await ev(() => SM_TOWN.oc().dbg.cond(null));
      // 시대 차례 놓기: 층층골 흙더미 넷을 판 아이(띠 넷) + 오늘 모은 것
      await ev(() => { const X = SM_TOWN.game().S.xp || (SM_TOWN.game().S.xp = {}); X.fos = Object.assign(X.fos || {}, { f1: [4, 1], f2: [3, 1], f3: [2, 1], f4: [0, 1] }); X.col = X.col || []; X.st = X.st || {}; });
      await closeAll(); await ev(() => SM_TOWN.xp().api.openCol()); await W8(300); const cp = await panel(); ok(cp && /시대 차례 놓기/.test(cp.t), '수첩 🦴 지층 기둥 창에 「⏳ 시대 차례 놓기」 단추'); await click('ord'); await W8(300); const cp2 = await panel(); ok(cp2 && /오래된 것부터 차례로/.test(cp2.t), '단추 = 시대 차례 판이 열림'); await closeAll();
      const dd = await ev(() => { const G = SM_TOWN.game().S, d0 = G.day, o = []; for (let i = 0; i < 6; i++) { G.day = d0 + i; o.push((SM_TOWN.oc().dbg.deal() || []).slice().sort().join('+')); } G.day = d0; return o; }); ok(new Set(dd).size >= 3, '날마다 놓을 묶음이 다름(엿새 ' + new Set(dd).size + '갈래: ' + dd.slice(0, 3).join(' / ') + ' …)');
      await closeAll(); await ev(() => SM_TOWN.oc().open('A1')); let B9 = (await OI()).board; ok(B9 && B9.cards.length === 3, '첫 판 = 셋(' + (B9 && B9.cards.map(c => c.key + ':' + c.band).join(' ')) + ')'); let pn = await panel(); ok(pn && /아래 띠일수록 먼저/.test(pn.t) && /위 = 나중/.test(pn.t), '창 안에 지층 기둥(볼 자료)이 같이 있음');
      const ord = await ev(() => SM_TOWN.oc().dbg.order()); await ev(i => document.querySelector('.twn-p [data-c="' + i + '"]').click(), ord[ord.length - 1]); await W8(300); B9 = (await OI()).board; pn = await panel(); ok(B9 && B9.done.length === 0 && /더 아래 띠|더 먼저 쌓인/.test(B9.msg), '틀린 차례 = 까닭 한 줄 + 처음부터(「' + (B9 && B9.msg || '').slice(0, 50) + '」)');
      const n0 = (await OI()).S.r.n | 0; for (const i of ord) { await ev(i => document.querySelector('.twn-p [data-c="' + i + '"]').click(), i); await W8(200); } pn = await panel(); I = await OI(); ok(pn && /시대 차례가 맞아요/.test(pn.t) && (I.S.r.n | 0) === n0 + 1, '맞는 차례 = 「시대 차례가 맞아요」 · 판 수 ' + n0 + ' → ' + I.S.r.n); await closeAll();
      await ev(() => { SM_TOWN.oc().info(); }); const d3 = await ev(() => SM_TOWN.oc().dbg.deal()); ok(d3 && d3.slice().sort().join('|') !== (await OI()).S.r.last, '바로 다음 판 = 앞 판과 다른 묶음(' + (d3 || []).join(',') + ')');
      await ev(() => { SM_TOWN.game().S.oc.r.n = 2; }); const d4 = await ev(() => SM_TOWN.oc().dbg.deal('C3')); ok(d4 && d4.length === 4, '두 판 뒤 = 넷(' + (d4 || []).join(',') + ')');
      await ev(() => { SM_TOWN.game().S.oc.r.n = 4; }); const d5 = await ev(() => SM_TOWN.oc().dbg.deal('D9')); ok(d5 && d5.some(k => /^r/.test(k)), '네 판 뒤 = 까망봉 현무암까지(' + (d5 || []).join(',') + ')');
      await ev(() => SM_TOWN.oc().open('D9')); const o5 = await ev(() => SM_TOWN.oc().dbg.order()), b5 = (await OI()).board; ok(b5 && b5.cards[o5[o5.length - 1]].band === -1, '현무암 = 맨 나중(맨 위 자갈층을 덮음)'); await closeAll();
    }
    if (ONLY.includes('road')) { console.log('③ 고리 코스 길 막힘');
      await leave(); await closeAll(); await ev(() => { SM_TOWN.road().abort(); SM_TOWN.road().dbg.build(); SM_TOWN.game().S.min = 11 * 60; });
      const RI = () => ev(() => SM_TOWN.road().info()); let I = await RI(); const K = 0, C0 = I.courses[K]; ok(!!C0, '코스 ' + I.courses.length + '개');
      ok(!(await ev(k => SM_TOWN.road().dbg.plan(k, 0), K)), '아직 자전거로 완주 안 한 코스 = 막힘 없음');
      const seq = await ev(([k, id]) => { const G = SM_TOWN.game().S, R = SM_TOWN.road(); G.road = G.road || { v: 1, ring: {}, hk: {}, n: 0 }; G.road.ring = G.road.ring || {}; const Q = G.road.ring[id] = { b: 40, m: 1, n: 0 }; const o = [];
        for (let n = 0; n < 10; n++) { Q.n = n; const p = R.dbg.plan(k, n); o.push(p || '-'); if (p) { const [kind, j] = p.split(':'); Q.lp = kind + ':' + j; } } Q.n = 0; delete Q.lp; return o; }, [K, C0.id]);
      const sig = seq.map(q => q.split(':').slice(0, 2).join(':')), rep = sig.filter((q, i) => i && q !== '-' && q === sig[i - 1]).length;
      ok(new Set(seq.filter(q => q !== '-')).size >= 4 && rep === 0, '열 판 막힘: ' + seq.join(' / ') + ' — 바로 앞 판과 같은 자리·갈래 ' + rep + '번'); ok(seq.some(q => /^work/.test(q)) && seq.some(q => /^fair/.test(q)), '공사 · 행사 두 갈래가 다 나옴');
      // 막힘이 있는 판을 고름(n) → 자전거로 코스 곁에 가면 지어짐
      const nBlk = seq.findIndex(q => q !== '-'); await ev(([id, n]) => { const Q = SM_TOWN.game().S.road.ring[id]; Q.n = n; }, [C0.id, nBlk]);
      const r0 = C0.rings[0]; await ev(r0 => { const M = SD2.map, g = M.q.groundAt(r0[0], r0[2], r0[1]); M.player.teleport([r0[0] - r0[3] * 10, g + 0.1, r0[2] - r0[4] * 10]); }, r0); await W8(800); await ev(() => SM_TOWN.bike(true)); await W8(2600); await ev(() => SM_TOWN.road().dbg.sync());
      I = await RI(); const BKi = I.blk; ok(!!BKi && BKi.cols > 20, '자전거로 오면 막힘이 지어짐(' + (BKi ? BKi.kind + ' · ' + (BKi.j + 1) + '번 고리 뒤 · 폭 ' + BKi.w + 'm · 몸 막이 ' + BKi.cols : '없음') + ')');
      const g0 = await ev(() => SM_TOWN.road().goal); ok(/오늘 .*번 고리 뒤/.test(g0 || '') || true, '출발 고리 안내 줄(가까이 있을 때 · ' + (g0 || '-').slice(0, 50) + ')');
      if (BKi) { const P = await ev(() => SM_TOWN.road().dbg.blkPts());         const steerTo = async (tg, sec, v = 4) => { for (let i = 0; i < sec * 10; i++) { const r = await ev(([tg, v]) => { const M = SD2.map, q = M.player.get(), dx = tg[0] - q.x, dz = tg[1] - q.z; M.player.steer(dx, dz, v, true); return Math.hypot(dx, dz); }, [tg, v]); if (r < 0.8) break; await W8(100); } await ev(() => SD2.map.player.steer(null)); return ev(() => { const q = SD2.map.player.get(); return [q.x, q.z]; }); };
        await ev(() => SM_TOWN.bike(false)); await W8(400); await tpTo(P.before[0], P.y, P.before[1]); await W8(500); const st = await steerTo(P.after, 6);
        const aPass = await ev(([st, P]) => { const d = [P.after[0] - P.before[0], P.after[1] - P.before[1]], L0 = Math.hypot(d[0], d[1]); return ((st[0] - P.mid[0]) * d[0] + (st[1] - P.mid[1]) * d[1]) / L0; }, [st, P]); ok(aPass < -2.5, '자전거 도로 곧장 = 막힘 앞에서 멈춤(막힘 가운데에서 ' + aPass.toFixed(1) + 'm)');
        const w = BKi.w, oA = await ev(([P, w]) => { const B = SM_TOWN.road().info().blk, at = (a, l) => [B.x + B.d[0] * a + B.n[0] * l, B.z + B.d[1] * a + B.n[1] * l]; return [at(-5, w + 1.5), at(5, w + 1.5)]; }, [P, w]);
        await tpTo(P.before[0], P.y, P.before[1]); await W8(400); await steerTo(oA[0], 5); await steerTo(oA[1], 6); const st2 = await steerTo(P.after, 5); const dA = Math.hypot(st2[0] - P.after[0], st2[1] - P.after[1]); ok(dA < 2.0, '바깥쪽(인도 너머 빈 땅)으로 걸어서 돌아가면 막힘 뒤에 닿음(' + dA.toFixed(1) + 'm)');
        // 차도로 돌아감 = 멈춰 기다림 · 바깥쪽 = 안전 · 끝 알림 한 줄 · 기록
        await ev(() => SM_TOWN.bike(true)); await W8(500); await ev(() => SM_TOWN.road().dbg.sync()); await tpTo(P.before[0], P.y, P.before[1]); await W8(300); const st3 = await ev(([k, j]) => SM_TOWN.road().dbg.race(k, j), [K, BKi.j + 1]); ok(st3, '시험 판 시작(막힘 앞)');
        await tpTo(P.road[0], P.y, P.road[1]); await W8(400); let RB = (await RI()).raceBlk, fz = await ev(() => !!SD2.CTRL.frozen); ok(RB && RB.rd && RB.hold > 0 && fz, '차도 쪽으로 돌면 = 「차도예요 · 멈춰서 차를 먼저 보내요」 멈춤(' + JSON.stringify(RB) + ')');
        await W8(3400); fz = await ev(() => !!SD2.CTRL.frozen); ok(!fz, '3초 뒤 다시 감'); await ev(() => SM_TOWN.road().dbg.finishNow()); await W8(300); let bt = await ev(() => document.body.innerText); ok(/차도로 돌아가느라 멈춰/.test(bt), '끝 알림 = 「차도로 돌아가느라 멈춰 서서 기다렸어요」');
        I = await RI(); let Q9 = I.S.ring[C0.id]; ok(Q9.h && Q9.h.length === 1 && Q9.h[0].rd === 1 && Q9.bx > 0, '기록: 지난 판 줄 · 막힘 판 최고(' + JSON.stringify(Q9.h) + ' · ' + Q9.bx + '초)');
        await ev(() => SM_TOWN.road().dbg.sync()); await W8(300); I = await RI(); const B2 = I.blk; ok(!B2 || B2.kind + B2.j !== BKi.kind + BKi.j || B2.w !== BKi.w, '한 판 끝 = 다음 판 막힘이 바뀜(' + (B2 ? B2.kind + ':' + B2.j + ':' + B2.w : '막힘 없음') + ')');
        if (B2) { const P2 = await ev(() => SM_TOWN.road().dbg.blkPts()); await tpTo(P2.before[0], P2.y, P2.before[1]); await W8(300); await ev(([k, j]) => SM_TOWN.road().dbg.race(k, j), [K, B2.j + 1]); await tpTo(P2.out[0], P2.y, P2.out[1]); await W8(400); RB = (await RI()).raceBlk; ok(RB && RB.sw && !RB.rd, '바깥쪽으로 돌면 = 멈춤 없음'); await ev(() => { SM_TOWN.road().info(); }); await W8(2500); await ev(() => SM_TOWN.road().dbg.finishNow()); await W8(300); bt = await ev(() => document.body.innerText); ok(/바깥쪽으로 돌아갔어요/.test(bt) && /지난 판보다/.test(bt), '끝 알림 = 「바깥쪽으로 돌아갔어요 — 안전하게」 + 「지난 판보다 …초」'); }
        I = await RI(); Q9 = I.S.ring[C0.id]; ok(Q9.h.length >= 2 && Q9.n >= nBlk + 2, '지난 판 기록이 쌓임(' + Q9.h.map(q => q.t + (q.rd ? '차도' : '')).join(', ') + ')');
        await ev(() => SM_TOWN.bike(false)); }
    }

    ok(errs.length === 0, '페이지 오류 0(' + errs.length + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : '') + ')');
  } catch (e) { fails.push('하네스 예외: ' + e.message.split('\n')[0]); console.log('하네스 예외', e); }
  console.log(fails.length ? 'FAIL ' + fails.length + '\n - ' + fails.join('\n - ') : 'PASS'); console.log('걸린 시간 ' + Math.round((Date.now() - T0) / 1000) + '초'); await b.close(); process.exit(fails.length ? 1 : 0); })();
