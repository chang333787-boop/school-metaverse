// 기억하는 이웃 시험(NB-0·1·2 · 설계 = 단계 3 PHASE3 「친해지기 다섯 단계」「이웃 성격·취향·기억」): node tools/harness/town_nb.cjs [마을=ourtown] [포트=8002] [--shots=폴더]
//   ① 고정 캐스트: 새로고침 · 저장 지운 뒤 새로고침에도 같은 이웃 열쇠(hk) = 같은 말투 · 같은 색 · 같은 싫어함 · 대표 몸 하나
//   ② Math.random 0: 말 고르기·몸 반응·행적·말하기(town_nb.js 길)에서 뽑기를 한 번도 부르지 않음
//   ③ 행적과 소식: 12일 동안 행적을 남기고 이웃마다 하루 한 번 말 → 말한 행적이 실제 있는 비율 100% · 퍼짐 규칙(그날 = 같은 칸 · 다음 날 = 같은 지역 · 장날 다음 날 = 모든 지역) 위반 0 · 같은 일 두 번 0
//   ④ 하루 한 단계 이하(잠 20번) · 오늘 오른 이웃은 문턱 밑에서 멈춤 · 이야기 보상은 한도 밖
//   ⑤ 말하는 때: 4m 안 · 걷기 빠르기 이하 · 하루 한 이웃 한 번 · 말풍선 하나(떠 있으면 기다림)
//   ⑥ 몸: 선물 순간(끄덕·깡충) · ❤3 바구니 곁 선물 · ❤1 손 인사 — 캡처 · 페이지 오류 0
//   브라우저는 brun.sh 한 자리로 돌림(동시에 하나)
const { chromium, RENDER } = require('./pw.cjs');   /* FAST-1: 기본 그리기 끔(norender) · 사진·프레임은 --render(docs/systems/town_gates.md) */
const path = require('path'), fs = require('fs');
const pos = process.argv.slice(2).filter(a => !a.startsWith('--')), ID = pos[0] || 'ourtown', PORT = pos[1] || '8002', URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const SHOT = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8) || path.join('/private/tmp/claude-501/-Users-dobuk-Projects-school-metaverse/3596a208-fd90-4cd5-b160-00ac62075cec/scratchpad', 'nb_shots');
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const T0 = Date.now(), b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }); const errs = [];
  try { fs.mkdirSync(SHOT, { recursive: true }); } catch (e) { /* 캡처 없이 */ }
  try { const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(); p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(t)) || /게임 tick 오류/.test(t)) errs.push(t.slice(0, 200)); });
    const W8 = ms => p.waitForTimeout(ms), ev = (f, a) => p.evaluate(f, a);
    const close = async () => { await ev(() => { for (let k = 0; k < 4; k++) { const P = document.querySelector('.twn-p'); if (!P) break; const b9 = P.querySelector('[data-a="x"]') || [...P.querySelectorAll('button')].find(e => /닫기|그대로|나가기|Close|Keep|Leave/.test(e.textContent)) || P.querySelector('button'); if (b9) b9.click(); else break; } }); await p.keyboard.press('Escape'); await W8(300); };
    const load = async () => { await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.nb && SM_TOWN.nb() && SM_TOWN.nb().reps().length && window.SD2, null, { timeout: 240000 }); await W8(1500); await close(); };
    const sig = () => ev(() => { const N = SM_TOWN.nb(); return N.reps().map(r => [r.hk, r.voice, r.ch, JSON.stringify(r.pal), r.no, N.say('greet', r.hk), N.say('like', r.hk, { e: '감자' }), N.say('no', r.hk, { e: '오이' })].join('|')).sort(); });
    await load();
    // ── ① 고정 캐스트 ──
    console.log('① 고정 캐스트(새로고침 · 저장 지움)');
    const s1 = await sig(), R0 = await ev(() => SM_TOWN.nb().reps()), BODY = await ev(() => SM_TOWN.rw.wk().length);
    const vc = {}; for (const r of R0) vc[r.voice] = (vc[r.voice] || 0) + 1;
    console.log('    이웃 ' + R0.length + ' (몸 ' + BODY + ') · 말투 ' + JSON.stringify(vc) + ' · 예: ' + (R0[0] ? R0[0].hk + ' ' + R0[0].voice : '-'));
    ok(R0.length > 0 && new Set(R0.map(r => r.hk)).size === R0.length, '이웃 열쇠 ' + R0.length + '개 모두 다름 · 대표 몸 하나씩');
    ok(R0.every(r => /^nb:[a-z]+:@/.test(r.hk)), '열쇠 = 일터 id(칸 X)');
    ok(Object.keys(vc).length >= 2, '말투가 여럿으로 나뉨(' + Object.keys(vc).length + '가지)');
    await p.reload(); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.nb && SM_TOWN.nb() && SM_TOWN.nb().reps().length, null, { timeout: 240000 }); await W8(1200); await close();
    const s2 = await sig();
    await ev(() => { try { localStorage.clear(); } catch (e) { /* 막힘 */ } }); await load(); const s3 = await sig();
    const same = (a, z) => a.length === z.length && a.every((x, i) => x === z[i]);
    ok(same(s1, s2), '새로고침 뒤 같은 hk = 같은 말투·색·싫어함·말(' + s2.length + '명)');
    ok(same(s1, s3), '저장 지운 뒤 같은 hk = 같은 말투·색·싫어함·말(' + s3.length + '명)');
    // 옛 열쇠 옮기기('nb:<갈래>:<칸>' → 일터 열쇠)
    { const m = await ev(() => { const S = SM_TOWN.game().S, w = SM_TOWN.rw.wk().find(q => SM_TOWN.nb().reps().some(r => r.i === q.i)), R = SM_TOWN.nb().reps().find(r => r.i === w.i); S.hearts = { ['nb:' + w.k + ':' + w.cell]: 7 }; SM_TOWN.nb().init(); return { old: S.hearts['nb:' + w.k + ':' + w.cell], nw: S.hearts[R.hk] }; }); ok(m.old == null && m.nw === 7, '옛 칸 열쇠 하트 7 → 일터 열쇠로 옮김(' + JSON.stringify(m) + ')'); }
    // 틀 32개(말투 넷 × 상황 여덟) 모두 글이 있음
    { const n = await ev(async () => { const M = await import('/v2/games/town_nb.js?v=1'); let c = 0; for (const v of M.VOICE) for (const k of M.NB_SITS) if (v[k] && v[k][0] && v[k][1]) c++; return c; }); ok(n === 32, '말 틀 ' + n + '/32'); }
    // ── 준비(낮 · 맑음 · 시계 멈춤) ──
    await ev(() => { const G = SM_TOWN.game(); G.setClock(false); G.S.min = 11 * 60; if (SD2.map.time) SD2.map.time('day'); SM_TOWN.rules.wx('clear'); });
    // ── ② Math.random 0 ──
    console.log('② Math.random 0');
    { const n = await ev(() => { const N = SM_TOWN.nb(), G = SM_TOWN.game(), S = G.S, R = N.reps(), W = SM_TOWN.rw.wk(); let c = 0; const MR = Math.random, WH = {}; Math.random = () => { const L = (new Error().stack || '').split('\n')[2] || '', f = (L.match(/\/([\w.-]+\.js)/) || [])[1] || '?'; WH[f] = (WH[f] || 0) + 1; if (f === 'town_nb.js') c++; return MR(); };   /* 바로 부른 곳이 town_nb.js일 때만 셈(말풍선 그리기·소리 같은 남의 길은 따로 적음) */
        try { for (const r of R) { for (const k of ['greet', 'mem', 'tip', 'like', 'ok', 'no', 'up', 'rest']) N.say(k, r.hk, { e: '감자', m: '어제 일.', t: '귀띔.', l: '단계.' }); for (let n9 = 1; n9 <= 5; n9++) N.upLine(n9, r); N.dislike(r); N.knows({ i: 0, t: 'summit', c: r.cell, r: r.reg, d: S.day - 1 }, r, S.day); }
          const r = R[0], w = { x: r.x, z: r.z, k: r.k, hk: r.hk }; N.deed('summit', r.x, r.z); N.deed('gift', r.x, r.z, r.hk, '🥔'); S.hearts[r.hk] = 6; N.react(w, '🥔', 'like'); N.react(w, '🥔', 'ok'); N.react(w, '🥔', 'no'); N.react(w, '🥔', 'again'); const T = (S.nbt || {})[r.hk]; if (T) T.day = 0; N.talk(w); N.choose(w); N.sec({ x: r.x + 1, y: r.g, z: r.z }); N.sec({ x: r.x + 1, y: r.g, z: r.z }); N.basketSync(); void W;
        } finally { Math.random = MR; } return { c, WH }; }); console.log('    부른 곳: ' + JSON.stringify(n.WH)); ok(n.c === 0, 'town_nb.js에서 Math.random ' + n.c + '번'); }
    await W8(3600);
    // ── ③ 행적과 소식(12일) ──
    console.log('③ 행적과 소식 12일');
    const sim = await ev(() => { const N = SM_TOWN.nb(), G = SM_TOWN.game(), S = G.S, R = N.reps(); S.deeds = []; S.nbt = {}; S.hd = {}; S.hearts = {}; for (const r of R) S.hearts[r.hk] = 6; const L0 = N.log.length, ALL = {}, days = [], MK = N.market();
      const keep = q => { if (q) ALL[q.i] = { ...q }; };
      for (let d = 0; d < 12; d++) { const day = S.day, n = R.length, a = R[(d * 3) % n], b = R[(d * 5 + 1) % n], c = R[(d * 7 + 2) % n];
        keep(N.deed('gift', a.x, a.z, a.hk, '🥔')); keep(N.deed('share', b.x, b.z, b.hk, '🍲')); keep(N.deed('summit', c.x + 3, c.z + 2)); keep(N.deed('wild', b.x - 4, b.z + 1, null, 'w:chipmunk')); if (d % 3 === 0) keep(N.deed('sell', a.x + 1, a.z));
        let said = 0; for (const r of R) { const t = N.talk({ x: r.x, z: r.z, k: r.k, hk: r.hk, g: r.g }); if (t) said++; } days.push([day, said, MK && N.jang(day) ? '장날' : '']);
        S.rw = {}; G.sleep(); S.min = 11 * 60; }
      return { log: N.log.slice(L0), all: ALL, reps: R.map(r => ({ hk: r.hk, cell: r.cell, reg: r.reg })), market: MK, days, jang: Object.fromEntries(Array.from({ length: 40 }, (_, j) => [S.day - 39 + j, N.jang(S.day - 39 + j)])) }; });
    const RP = {}; for (const r of sim.reps) RP[r.hk] = r; const how = {}; let real = 0, bad = [], dup = 0; const seen = new Set();
    for (const [hk, id, h, day] of sim.log) { how[h] = (how[h] || 0) + 1; const D = sim.all[id], r = RP[hk]; if (D) real++; if (seen.has(hk + '#' + id)) dup++; seen.add(hk + '#' + id); if (!D || !r) { bad.push(hk + ' ' + id + ' 없음'); continue; }
      let mk = false; if (sim.market) for (let j = D.d; j < day; j++) if (sim.jang[j]) mk = true;
      const rule = (D.k === hk && D.d < day) || (D.d <= day && D.c === r.cell) || (D.d < day && ((D.r && D.r === r.reg) || mk));
      const why = h === 'me' ? D.k === hk && D.d < day : h === 'seen' ? D.c === r.cell && D.d <= day : h === 'reg' ? !!D.r && D.r === r.reg && D.d < day : h === 'mkt' ? mk : false;
      if (!rule || !why) bad.push(hk.slice(3) + ' ' + h + ' 행적 ' + D.t + '@' + D.c + '/' + D.r + ' ' + D.d + '일 → ' + day + '일 (이웃 ' + r.cell + '/' + r.reg + ')'); }
    console.log('    날마다 말한 이웃: ' + sim.days.map(d => d[0] + '일 ' + d[1] + (d[2] ? '(' + d[2] + ')' : '')).join(' · ') + ' · 장터 ' + (sim.market ? '있음' : '없음'));
    console.log('    말한 행적 ' + sim.log.length + ' · 어떻게 앎 ' + JSON.stringify(how));
    ok(sim.log.length > 0 && real === sim.log.length, '말한 행적이 실제 있는 비율 ' + (sim.log.length ? Math.round(real / sim.log.length * 100) : 0) + '% (' + real + '/' + sim.log.length + ')');
    ok(!bad.length, '퍼짐 규칙 위반 ' + bad.length + (bad.length ? ' — ' + bad.slice(0, 4).join(' / ') : ''));
    ok(dup === 0, '같은 일 두 번 ' + dup);
    ok((how.me || 0) > 0 && ((how.reg || 0) + (how.seen || 0) + (how.mkt || 0)) > 0, '직접 한 일과 전해 들은 소식이 모두 나옴');
    { const ln = await ev(() => { const N = SM_TOWN.nb(), S = SM_TOWN.game().S, R = N.reps(), r = R[0]; S.nbt[r.hk] = { day: 0, wv: 0, said: {} }; N.deed('summit', r.x + 2, r.z + 1); S.day++; const t = N.talk({ x: r.x, z: r.z, k: r.k, hk: r.hk, g: r.g }); S.day--; return t; }); console.log('    말 예: ' + ln); ok(!!ln && /[가-힣][0-9]|[0-9][가-힣]/.test(ln) && !/\?/.test(ln), '소식 말에 자리(칸) · 물음꼴 X'); }
    // ── ④ 하루 한 단계 이하 ──
    console.log('④ 하루 한 단계 이하(잠 20번)');
    { const r = await ev(() => { const G = SM_TOWN.game(), S = G.S, hk = SM_TOWN.nb().reps()[0].hk; S.hearts[hk] = 0; S.hd = {}; const lv = [G.hearts(hk)];
        for (let d = 0; d < 20; d++) { S.rw = {}; for (let k = 0; k < 10; k++) { G.heart(hk, 2, 'gift'); G.heart(hk, 3, 'share'); G.heart(hk, 1, 'job:x'); } lv.push(G.hearts(hk)); G.sleep(); S.min = 11 * 60; }
        S.rw = {}; S.hearts[hk] = 5; S.hd[hk] = S.day; const a = G.heart(hk, 3, 'gift'), h1 = S.hearts[hk]; const st = G.heart(hk, 3, 'story'), h2 = S.hearts[hk]; return { lv, a, h1, st, h2 }; });
      let jump = 0; for (let i = 1; i < r.lv.length; i++) jump = Math.max(jump, r.lv[i] - r.lv[i - 1]);
      console.log('    단계: ' + r.lv.join(' '));
      ok(jump <= 1, '하루에 오른 단계 최대 ' + jump);
      ok(r.a === 0 && r.h1 === 5, '오늘 오른 이웃 = 문턱 밑(5)에서 멈춤(' + r.h1 + ')');
      ok(r.h2 > 5, '이야기 보상은 한도 밖(' + r.h2 + ')'); }
    // ── ⑤ 말하는 때(sec) ──
    console.log('⑤ 말하는 때');
    { await W8(3600); const r = await ev(() => { const N = SM_TOWN.nb(), S = SM_TOWN.game().S, R = N.reps(), a = R[0], b = R[1] || R[0]; for (const q of [a, b]) { S.hearts[q.hk] = 6; S.nbt[q.hk] = { day: 0, wv: S.day, said: {} }; } N.deed('summit', a.x + 1, a.z); N.deed('summit', b.x + 1, b.z); S.day++; S.nbt[a.hk].wv = S.day; S.nbt[b.hk].wv = S.day;
        const at = (q, d) => ({ x: q.x + d, y: q.g, z: q.z }), n0 = N.said; const out = {};
        N.sec(at(a, 5)); N.sec(at(a, 5)); out.far = N.said - n0;   /* 5m = 말 X */
        N.sec(at(a, 14)); N.sec(at(a, 2)); out.fast = N.said - n0;   /* 12m/초 = 자전거 빠르기 = 말 X */
        N.sec(at(a, 2)); out.near = N.said - n0;   /* 멈춤 · 2m = 말 */
        N.sec(at(a, 2)); out.twice = N.said - n0;   /* 같은 날 또 = X */
        N.sec(at(b, 2)); N.sec(at(b, 2)); out.busy = N.said - n0;   /* 말풍선이 떠 있음 = 기다림 */
        return out; });
      await W8(3600); const r2 = await ev(() => { const N = SM_TOWN.nb(), R = N.reps(), b = R[1] || R[0], n0 = N.said; N.sec({ x: b.x + 2, y: b.g, z: b.z }); N.sec({ x: b.x + 2, y: b.g, z: b.z }); const n = N.said - n0; SM_TOWN.game().S.day--; return n; });
      console.log('    ' + JSON.stringify(r) + ' · 말풍선 사라진 뒤 ' + r2);
      ok(r.far === 0, '4m 밖 = 말 X'); ok(r.fast === 0, '걷기보다 빠름 = 말 X'); ok(r.near === 1, '멈춰 2m = 말 한 번'); ok(r.twice === 1, '같은 이웃 하루 한 번'); ok(r.busy === 1 && (r2 === 1 || r.near === 1), '말풍선 하나(떠 있으면 다음 이웃은 기다림 → 사라진 뒤 말함 ' + r2 + ')'); }
    // ── ⑥ 몸 반응 · 캡처 ──
    console.log('⑥ 몸 반응 · 캡처');
    { const go = async (fn) => { const q = await ev(fn); if (!q) return null; await ev(o => { SD2.map.player.teleport([o.px, o.py + 0.05, o.pz]); SD2.map.player.lookAt([o.x, o.z]); }, q); await W8(700); return q; };
      const pickRep = () => { const N = SM_TOWN.nb(), R = N.reps().filter(r => N.likes(r.k).length), r = R[0] || N.reps()[0]; if (!r) return null; const ry = r.ry || 0, px = r.x + 2.6 * Math.sin(ry), pz = r.z + 2.6 * Math.cos(ry); return { hk: r.hk, k: r.k, x: r.x, z: r.z, g: r.g, px, pz, py: SM_TOWN.ground(px, pz) }; };
      const q = await go(pickRep);
      if (q) { const g = await ev(o => { const N = SM_TOWN.nb(), G = SM_TOWN.game(), S = G.S, e = N.likes(o.k)[0]; S.uses = {}; S.rw = {}; S.bag[e] = (S.bag[e] || 0) + 1; const h0 = S.hearts[o.hk] || 0; SM_TOWN.rules.gift(e); return { e, h0, h1: S.hearts[o.hk] || 0, g: (S.nbt[o.hk] || {}).g }; }, q); await W8(500);
        if (RENDER) try { await p.screenshot({ path: path.join(SHOT, 'nb_gift.png') }); } catch (e) { /* 캡처 실패 */ }
        ok(g.h1 > g.h0 && g.g === g.e, '좋아하는 선물(' + g.e + ') = 하트 ' + g.h0 + ' → ' + g.h1 + ' · 받은 선물 기억');
        const no = await ev(o => { const N = SM_TOWN.nb(), S = SM_TOWN.game().S, r = N.reps().find(x => x.hk === o.hk); S.uses = {}; const e = r.no; S.bag[e] = 1; const h0 = S.hearts[o.hk]; SM_TOWN.rules.gift(e); return { e, kept: S.bag[e] === 1, same: S.hearts[o.hk] === h0 }; }, q);
        ok(no.kept && no.same, '싫어하는 것(' + no.e + ') = 돌려줌 · 하트 그대로');
        await W8(2600);
        await ev(o => { const N = SM_TOWN.nb(), S = SM_TOWN.game().S; S.hearts[o.hk] = 9; N.basketSync(); }, q); await W8(500);
        const nb3 = await ev(() => SM_TOWN.nb().baskets);
        if (RENDER) try { await p.screenshot({ path: path.join(SHOT, 'nb_basket.png') }); } catch (e) { /* 캡처 실패 */ }
        ok(nb3 >= 1, '❤3 바구니 곁 선물 ' + nb3 + '곳');
        const wv = await ev(o => { const N = SM_TOWN.nb(), S = SM_TOWN.game().S; S.hearts[o.hk] = 3; S.nbt[o.hk].wv = 0; S.nbt[o.hk].day = 0; const me = { x: o.px, y: o.g, z: o.pz }; const a = (S.nbt[o.hk] || {}).wv; N.sec(me); N.sec({ x: o.x + 1.6, y: o.g, z: o.z + 1.2 }); N.sec({ x: o.x + 1.6, y: o.g, z: o.z + 1.2 }); return { a, b: S.nbt[o.hk].wv, day: S.day }; }, q);
        await W8(600); if (RENDER) try { await p.screenshot({ path: path.join(SHOT, 'nb_wave.png') }); } catch (e) { /* 캡처 실패 */ }
        ok(wv.b === wv.day, '❤1 2.5m 안 = 그날 처음 손 인사'); }
      else ok(false, '선물 줄 이웃 없음'); }
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.slice(0, 3).join(' | ') : ''));
  } catch (e) { fails.push('시험 오류 ' + e.message); console.log('  ✗ 시험 오류 ' + e.message.slice(0, 300)); }
  await b.close(); console.log((fails.length ? '❌ 실패 ' + fails.length : '✅ 통과') + ' · ' + ((Date.now() - T0) / 1000).toFixed(0) + '초'); process.exit(fails.length ? 1 : 0); })();
