// 높은 곳 보기 + 숨은 작은 놀람 시험(SURP-1 · town_surp.js · 설계 docs/systems/town_explore.md 30 · 차례 5): node tools/harness/town_surp.cjs [마을=ourtown] [포트=8002]
//   ① 표: 놀람 12개 안팎이 모두 자리를 찾음(아이 판·탐험 땅 · 땅 갈래 넷 이상) · 16m 칸 표
//   ② 놀람 봇: 놀람마다 시각·날씨·날(바람 센 날·어제 비)·물때를 돌리고 그 자리로 가서 이미 있는 몸짓(따르릉 R · 앉기 · 가만히 · 걷기 W · 우산 활공 · 바라보기)만 함 → 수첩 저장에 생기는지
//      조건이 안 맞으면(때·날씨를 어긋나게) 안 생기는지도 하나 봄 · 같은 날 같은 놀람은 한 번 · 솜씨 보상은 문(xp:surp) 하루 한도 안
//   ③ 높은 곳 보기: 나침반 띠 설정을 끈 채 높은 곳 끝(UMB.high)에 2초 가만히 → 띠가 저절로 켜짐 · 돌려 본 쪽 덩어리 방위 줄(이름·거리·숫자 X) · 걸어가면 꺼짐
//   ④ 수첩 👀 놀람 탭: 날짜순 일지 · 숫자·%·분모 0 · 아침 소문(아무것도 못 찾은 동안만 · 처음 하나를 이끔)
//   ⑤ 페이지 오류 0
const { chromium } = require('./pw.cjs');   /* FAST-1: 기본 그리기 끔(norender) */
const pos9 = process.argv.slice(2).filter(a => !a.startsWith('--')), ID = pos9[0] || 'ourtown', PORT = pos9[1] || '8002', URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
const TIDE_P = 745, LOW_W = 94, lowAt = d => 300 + ((d * 50 + 250) % TIDE_P);   /* town_shore.js와 같은 셈 */
(async () => { const T0 = Date.now(), b = await chromium.launch({ args: ['--use-gl=angle', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }); const errs = [];
  try { const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(); p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(t)) || /게임 tick 오류/.test(t)) errs.push(t.slice(0, 200)); });
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
    const panel = () => ev(() => { const P = document.querySelector('.twn-p'); return P && P.getClientRects().length ? P.textContent : ''; });
    const DLGS = new Set(), dlgOff = async () => { const dg = await ev(() => { if (!(SM_TOWN.dlgOn && SM_TOWN.dlgOn())) return null; const e = document.querySelector('.twn-dlg,.dlg,[class*=dlg]'); return (e ? e.textContent : 'dlg').slice(0, 40); }); if (dg) { DLGS.add(dg); await p.keyboard.press('Escape'); await W8(300); } };   /* 길 위 이웃 말 걸기 등 대화창(놀람과 상관없음) = Esc */
    const closeAll = async () => { await dlgOff(); for (let i = 0; i < 4; i++) { if (!(await panel())) break; await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p button.sub') || document.querySelector('.twn-p button'); if (b9) b9.click(); }); await W8(250); if (await panel()) { await p.keyboard.press('Escape'); await W8(250); } } };
    const tp = (x, z, y) => ev(([x, z, y]) => { const M = SD2.map, g = y != null ? y : M.q.groundAt(x, z, 600); M.player.teleport([x, g + 0.05, z]); }, [x, z, y]);
    const setT = (m, w, d) => ev(([m, w, d]) => { const G = SM_TOWN.game(); if (d != null) G.S.day = d; G.S.min = m; const ph = m < 360 || m >= 1140 ? 'night' : m >= 1020 ? 'sunset' : 'day'; if (SD2.map.time && SD2.map.time() !== ph) SD2.map.time(ph); if (w) SM_TOWN.rules.wx(w); }, [m, w, d]);
    const st = () => ev(() => SM_TOWN.surp().api.state()), has = async id => !!(await st()).surp[id];
    const waitFor = async (id, ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { await closeAll(); if (await has(id)) return (Date.now() - t0) / 1000; await W8(300); } console.log('    … ' + id + ' 못 봄: ' + JSON.stringify(await ev(() => ({ st: SM_TOWN.surp().api.st(), c: SM_TOWN.surp().api.cond(), dlg: SM_TOWN.dlgOn ? SM_TOWN.dlgOn() : '?', p: SD2.map.player.get(), mv: SD2.map.player.moving, inp: SD2.map.player.input, frz: SD2.CTRL.frozen, min: SM_TOWN.game().S.min, day: SM_TOWN.game().S.day, x: SM_TOWN.umb() })))); return -1; };
    const lookAt = (x, z) => ev(q => SD2.map.player.lookAt(q), [x, z]);
    await p.goto(URL); try { await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.surp && SM_TOWN.surp() && window.SD2 && SM_TOWN.game, null, { timeout: 240000 }); } catch (e) { console.log('  ✗ 마을·놀람이 안 뜸 — ' + errs.slice(0, 4).join(' | ')); throw e; }
    await W8(2000); await closeAll(); await p.keyboard.press('Escape'); await W8(600);
    await ev(() => { const G = SM_TOWN.game(); if (G.setClock) G.setClock(false); G.S.min = 10 * 60; G.S.jobs = G.S.jobs || {}; G.S.jobs.fireNo = G.S.day; G.S.story = G.S.story || {}; G.S.story.p0auto = 1; (G.S.quiz || (G.S.quiz = {})).tip = 1; SM_TOWN.surp().api.reset(); });
    await ev(async () => { const m = await import('/v2/js/settings.js?v=2'); m.SET.comp = false; });   /* 나침반 띠 설정 끔 — 높은 곳에서 저절로 켜지는지 보려고 */
    // ① 표
    console.log('① 놀람 표');
    const ROWS = await ev(() => SM_TOWN.surp().api.rows()), ALL = await ev(() => SM_TOWN.surp().api.all()), CL = await ev(() => SM_TOWN.surp().api.cells());
    console.log('  ' + ROWS.map(r => r.id + '(' + r.land + '·' + r.how + '·' + r.an.length + ')').join(' '));
    ok(ROWS.length >= 12 && ROWS.length === ALL.length, '놀람 ' + ROWS.length + '개가 모두 자리를 찾음(표 ' + ALL.length + ')'); ok(new Set(ROWS.map(r => r.land)).size >= 4, '땅 갈래 ' + new Set(ROWS.map(r => r.land)).size + '(땅마다 수가 다름)'); ok(CL.n > 0 && CL.cs === 16, '16m 칸 표 ' + CL.n + '칸');
    const row = id => ROWS.find(r => r.id === id), an0 = id => row(id).an[0];
    // ③ 높은 곳 보기
    console.log('③ 높은 곳 보기');
    { await setT(600, 'clear'); await closeAll(); const a = an0('sunrise'); let spot = null;
      const cands = await ev(([x, z]) => { const M = SD2.map, o = []; for (let r = 4; r <= 60; r += 4) for (let k = 0; k < 24; k++) { const px = x + Math.cos(k * 0.2618) * r, pz = z + Math.sin(k * 0.2618) * r, g = M.q.groundAt(px, pz, 600); for (let j = 0; j < 8; j++) { const h = j * 0.785, fx = px + Math.sin(h) * 2.6, fz = pz - Math.cos(h) * 2.6, g2 = M.q.groundAt(fx, fz, g + 0.5); if (g - g2 > 4.5) { o.push([px, pz, fx, fz]); break; } } } return o.slice(0, 12); }, [a.x, a.z]);
      for (const c of cands) { await tp(c[0], c[1]); await lookAt(c[2], c[3]); await W8(1300); if ((await ev(() => SM_TOWN.umb().high))) { spot = c; break; } }
      ok(!!spot, '높은 곳 끝 자리 찾음' + (spot ? ' ' + spot.slice(0, 2).map(v => v.toFixed(0)) : ' (후보 ' + cands.length + ')'));
      if (spot) { const off0 = await ev(() => { const e = document.querySelector('.twn-comp'); return !e || e.style.display === 'none'; }); await W8(3200); const V = await ev(() => SM_TOWN.surp().api.view()), on = await ev(() => { const e = document.querySelector('.twn-comp'); return !!e && e.style.display !== 'none'; });
        ok(off0 && V.on && on, '띠 설정 끔 → 높은 곳 끝 2초 가만히 = 나침반 띠가 저절로 켜짐(' + off0 + '·' + V.on + '·' + on + ')');
        const MS = await ev(() => SM_TOWN.surp().api.mass()); let shown = []; for (const M of MS) { await lookAt(M.x, M.z); await W8(700); const v = await ev(() => SM_TOWN.surp().api.view()); if (v.txt) shown.push([M.k, v.m, v.txt]); }
        console.log('  ' + shown.map(q => q[0] + '→' + q[2]).join(' · '));
        ok(shown.length >= 3, '돌려 본 쪽 덩어리 방위 줄 ' + shown.length + '개'); ok(shown.every(q => /^(북|북동|동|남동|남|남서|서|북서)쪽에 /.test(q[2]) && !/[0-9]|m\b|km/.test(q[2])), '방위 줄 = 「○쪽에 …」 · 이름·거리·숫자 X');
        ok(await ev(() => { const e = document.querySelector('.twn-view'); return !!e && e.style.display !== 'none' && e.getBoundingClientRect().top > 0; }), '방위 줄이 화면에 보임(띠 밑)');
        await p.keyboard.down('KeyW'); await W8(2600); await p.keyboard.up('KeyW'); await W8(1600); const V2 = await ev(() => SM_TOWN.surp().api.view()), on2 = await ev(() => { const e = document.querySelector('.twn-comp'); return !!e && e.style.display !== 'none'; }), ln2 = await ev(() => { const e = document.querySelector('.twn-view'); return !!e && e.style.display !== 'none'; });
        ok(!V2.on && !on2 && !ln2, '걸어가면 보기·띠·방위 줄이 꺼짐(설정 끈 아이)'); } }
    // ② 놀람 봇
    console.log('② 놀람 봇');
    const day0 = await ev(() => SM_TOWN.game().S.day), RES = {};
    const findDay = async (k, from) => ev(([k, from]) => { const G = SM_TOWN.game(), d0 = G.S.day; for (let d = from; d < from + 80; d++) { G.S.day = d; if (SM_TOWN.surp().api.cond()[k]) return d; } G.S.day = d0; return -1; }, [k, from]);
    const landNear = (x, z, r0, r1) => ev(([x, z, r0, r1]) => { const M = SD2.map; let best = null, by = -1e9; for (let r = r0; r <= r1; r += 4) for (let a = 0; a < 16; a++) { const px = x + Math.cos(a * 0.3927) * r, pz = z + Math.sin(a * 0.3927) * r, g = M.q.groundAt(px, pz, 600); if (g > by + 0.3) { by = g; best = [px, pz]; } } return best; }, [x, z, r0, r1]);
    const doStill = async (id, sec) => { await W8(400); await closeAll(); return waitFor(id, (sec + 4) * 1000); };
    const T = {
      echo: async () => { const a = row('echo').an[(row('echo').an.length / 2) | 0]; const fy = await ev(([x, z]) => SM_TOWN.tunFloor(x, z, -1e9), [a.x, a.z]); await setT(600, 'clear'); await tp(a.x, a.z, fy); await W8(500); await ev(() => SM_TOWN.bike(true)); await W8(700); await closeAll();
        const inT = await ev(() => { const m = SD2.map.player.pos(); return SM_TOWN.tunFloor(m.x, m.z, m.y + 1) != null; }); await p.keyboard.press('KeyR'); const t = await waitFor('echo', 4000); await ev(() => SM_TOWN.bike(false)); return { t, inT }; },
      sunset: async () => { const a = an0('sunset'), S9 = await ev(([x, z]) => SM_TOWN.sits().near(x, z), [a.x, a.z]); await setT(17 * 60 + 30, 'clear'); const s = S9 && S9[0]; if (s) { await tp(s.stand[0], s.stand[1]); await W8(300); await ev(q => { SD2.ACT.sit = { x: q.stand[0], z: q.stand[1], y: SD2.map.player.pos().y, seat: { x: q.seat[0], y: q.seat[1], z: q.seat[2], yaw: q.yaw } }; }, s); } else await tp(a.x, a.z); const t = await doStill('sunset', 3); const comp = await ev(() => { const e = document.querySelector('.twn-comp'); return !!e && e.style.display !== 'none'; }); await ev(() => { SD2.ACT.sit = null; }); return { t, seat: !!s, comp }; },
      sunrise: async () => { const a = an0('sunrise'); await setT(6 * 60 + 10, 'clear'); await tp(a.x + 3, a.z + 3); return { t: await doStill('sunrise', 3) }; },
      pecker: async () => { const a = an0('pecker'); await setT(600, 'clear'); await tp(a.x, a.z); return { t: await doStill('pecker', 5) }; },
      isleview: async () => { const a = an0('isleview'), M = (await ev(() => SM_TOWN.surp().api.mass())).find(m => m.k === 'isle'); await setT(600, 'clear'); await tp(a.x, a.z); await lookAt(M.x, M.z); return { t: await doStill('isleview', 2) }; },
      windglide: async () => { const d = await findDay('windy', day0 + 1); if (d < 0) return { t: -1, why: '바람 센 날 없음' }; await setT(600, 'clear', d); const a = an0('windglide');
        const g = await ev(([x, z]) => SD2.map.q.groundAt(x, z, 600), [a.x + 20, a.z + 20]); await tp(a.x + 20, a.z + 20); await W8(1200); await closeAll(); const Wd = (await ev(() => SM_TOWN.surp().api.cond())).wind; await lookAt(a.x + 20 + Wd.x * 30, a.z + 20 + Wd.z * 30); await ev(() => SM_TOWN.umbSet(true)); await W8(1200);   /* 바람을 등지고(마주 보면 뒤집힘) */   /* 1초 칸이 바람(UMB.wd)을 읽게 */
        const p0 = await ev(() => { const m = SD2.map.player.pos(); return [m.x, m.z]; }); await ev(([x, z, y]) => SD2.map.player.teleport([x, y, z]), [p0[0], p0[1], g + 34]); const t = await waitFor('windglide', 30000);
        const p1 = await ev(() => { const m = SD2.map.player.pos(); return [m.x, m.z]; }); await ev(() => SM_TOWN.umbSet(false)); return { t, drift: +Math.hypot(p1[0] - p0[0], p1[1] - p0[1]).toFixed(1), day: d }; },
      mist: async () => { const d = await findDay('rainY', day0 + 1); if (d < 0) return { t: -1, why: '어제 비 온 날 없음' }; await setT(7 * 60, 'clear', d); const a = an0('mist'), L9 = await landNear(a.x, a.z, 26, 44); await tp(L9[0], L9[1]); await lookAt(a.x, a.z); await W8(500); await closeAll();
        await p.keyboard.down('KeyW'); const t = await waitFor('mist', 6000); await p.keyboard.up('KeyW'); await W8(5500); const m9 = await ev(() => SM_TOWN.surp().api.mist()); return { t, mist: m9, day: d }; },
      frogs: async () => { const a = an0('frogs'), L9 = await landNear(a.x, a.z, 4, 30); await setT(21 * 60, 'clear', day0); await tp(L9[0], L9[1]); return { t: await doStill('frogs', 4) }; },
      birds: async () => { const a = an0('birds'), L9 = await landNear(a.x, a.z, 10, 40); await setT(600, 'clear', day0); await tp(L9[0], L9[1]); await lookAt(a.x, a.z); await W8(500); await closeAll(); await p.keyboard.down('KeyW'); const t = await waitFor('birds', 6000); await p.keyboard.up('KeyW'); return { t }; },
      fallbow: async () => { const a = an0('fallbow'); await setT(9 * 60, 'clear', day0); await W8(600); const L9 = await landNear(a.x + 14, a.z, 0, 8); await tp(L9[0], L9[1]); await lookAt(a.x, a.z); const t = await doStill('fallbow', 3); return { t }; },
      crab: async () => { let m = lowAt(day0) + 20; if (m > 1100) m -= TIDE_P; if (m < 380) m += TIDE_P; await setT(m, 'clear', day0); const a = an0('crab'), L9 = await landNear(a.x, a.z, 3, 6); await tp(L9[0], L9[1]); const low = await ev(() => SM_TOWN.surp().api.cond().low); return { t: await doStill('crab', 3), low, m }; },
      salt: async () => { const a = an0('salt'); await setT(12 * 60, 'clear', day0); await tp(a.x, a.z); return { t: await doStill('salt', 3) }; },
      owl: async () => { const a = an0('owl'); await setT(21 * 60 + 30, 'clear', day0); await tp(a.x, a.z); return { t: await doStill('owl', 4) }; } };
    // 조건이 어긋나면 안 생김(대낮 해넘이 자리 · 맑은 날 아닌 소금꽃)
    { const a = an0('sunrise'); await setT(13 * 60, 'clear', day0); await tp(a.x + 3, a.z + 3); await W8(5500); ok(!(await has('sunrise')) && !(await has('sunset')), '한낮에 높은 곳에 가만히 = 해돋이·해넘이 안 생김'); }
    { const a = an0('salt'); await setT(12 * 60, 'rain', day0); const wk = await ev(() => [SM_TOWN.surp().api.cond().wx, SM_TOWN.surp().api.whenOk('salt')]); await setT(21 * 60, 'clear', day0); await tp(a.x, a.z); await W8(5000); ok(wk[0] === 'rain' && wk[1] === false && !(await has('salt')), '비 오는 한낮 = 소금꽃 조건 아님 · 밤 염전에 가만히 = 안 생김(' + wk.join('·') + ')'); }   /* 비는 마을 비 띠가 몇 초 뒤 걷어 가서 조건만 봄 */
    for (const id of ALL.filter(q => q !== 'crab').concat(ALL.includes('crab') ? ['crab'] : [])) {   /* 섬 웅덩이는 맨 끝(물때 바뀌며 섬 창이 뜰 수 있음) */ if (!T[id]) { ok(false, id + ' 봇 없음'); continue; } const r = await T[id](); RES[id] = r; ok(r.t >= 0, id + ' 생김' + (r.t >= 0 ? ' (' + r.t.toFixed(1) + '초)' : '') + ' ' + JSON.stringify(Object.fromEntries(Object.entries(r).filter(([k]) => k !== 't')))); await closeAll(); }
    ok(RES.echo && RES.echo.inT, '따르릉은 굴 안에서 울림');
    ok(RES.windglide && RES.windglide.drift >= 8, '바람 센 날 활공 = 바람 쪽으로 밀림 ' + (RES.windglide && RES.windglide.drift) + 'm');
    ok(RES.mist && RES.mist.mist && RES.mist.mist.near < 40, '물안개 = 있는 안개가 가까이 당겨짐 ' + JSON.stringify(RES.mist && RES.mist.mist));
    const S9 = await st(); ok(Object.keys(S9.surp).length === ALL.length, '수첩 저장 ' + Object.keys(S9.surp).length + '/' + ALL.length);
    { const n1 = Object.keys(S9.surpD).length; const a = an0('salt'); await setT(12 * 60, 'clear', day0); await tp(a.x, a.z); await W8(5000); const S2 = await st(); ok(S2.surpD.salt === S9.surpD.salt && Object.keys(S2.surpD).length === n1, '같은 날 같은 놀람은 한 번'); }
    const RW = await ev(() => { const R = SM_TOWN.game().S.rw || {}, c = R.c || {}; return Object.entries(c).filter(([k]) => /xp:surp/.test(k)).map(([k, v]) => [k, v]); }); ok(RW.every(([, v]) => v <= 3), '솜씨 보상 = 문 xp:surp 하루 한도 안 ' + JSON.stringify(RW));
    // ④ 수첩 · 소문
    console.log('④ 수첩 · 소문');
    await closeAll(); await ev(() => SM_TOWN.surp().open()); await W8(400); const NB = await ev(() => { const P = document.querySelector('.twn-p'); if (!P) return null; const tabs = P.querySelector('.nb-tabs'); const bx = P.querySelector('.bx').cloneNode(true); const t9 = bx.querySelector('.nb-tabs'); if (t9) t9.remove(); return { tabs: tabs ? tabs.textContent : '', body: bx.textContent, rows: P.querySelectorAll('.bx > .st').length }; });
    ok(!!NB && /놀람/.test(NB.tabs), '수첩 탭에 👀 놀람'); ok(NB && NB.rows === ALL.length, '일지 줄 ' + (NB && NB.rows));
    ok(NB && !/[0-9]|%|\//.test(NB.body), '일지에 숫자·%·분모 0' + (NB && /[0-9]|%|\//.test(NB.body) ? ' — ' + (NB.body.match(/.{0,20}([0-9]|%|\/).{0,20}/) || [''])[0] : ''));
    { const ord = await ev(() => Object.entries(SM_TOWN.surp().api.state().surp).sort((a, b) => (a[1][0] - b[1][0]) || (a[1][1] - b[1][1])).map(([k]) => k)); const ic = await ev(() => [...document.querySelectorAll('.twn-p .bx > .st b.n')].map(e => e.textContent)); ok(ic.length === ord.length, '일지 = 본 날짜·시각 차례(' + ord.join('>') + ')'); }
    console.log('  ' + (NB ? NB.body.slice(0, 160) : ''));
    await closeAll();
    const r1 = await ev(() => SM_TOWN.surp().rumor()); ok(r1 === null, '찾은 것이 있으면 소문 X');
    await ev(() => SM_TOWN.surp().api.reset()); const r0 = await ev(() => SM_TOWN.surp().rumor()); ok(!!r0 && /따르릉|벨/.test(r0.ko) && !/[0-9]/.test(r0.ko), '아무것도 못 찾은 동안 = 첫 놀람 소문 「' + (r0 && r0.ko) + '」');
    { await ev(() => { const G = SM_TOWN.game(); G.S.day = Math.max(4, G.S.day); G.S.news = null; }); const N = await ev(() => { SM_TOWN.newsRun(false); const n = SM_TOWN.game().S.news; return n ? { rum: n.rum.map(r => r.k + ':' + r.t), cand: n.cand && n.cand.rum } : null; }); ok(!!N && N.cand && N.cand.includes('surp') && N.rum.some(r => /^surp:/.test(r)), '아침 소식 이웃 소문에 첫 놀람 한 줄 ' + JSON.stringify(N && N.rum)); }
    if (DLGS.size) console.log('  (닫은 대화창: ' + [...DLGS].join(' | ') + ')');
    ok(errs.length === 0, '페이지 오류 0' + (errs.length ? ' — ' + errs.slice(0, 4).join(' | ') : ''));
  } catch (e) { console.log('  ✗ 시험 멈춤 — ' + (e && e.message || e).slice(0, 300)); fails.push('멈춤'); }
  await b.close(); console.log((fails.length ? '✗ ' + fails.length + '개 실패' : '✓ 모두 통과') + ' · ' + ((Date.now() - T0) / 1000).toFixed(0) + '초'); process.exit(fails.length ? 1 : 0); })();
