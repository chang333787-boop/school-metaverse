// 내 집 꾸미기 · 선물 귀띔 시험(COZY-1 · v2/games/town_cozy.js): node tools/harness/town_deco.cjs [마을=ourtown] [포트=8002]
//   ① 마당 자리 셋 · 창에서 놓기(가방 −1 · 모형 · 부딪힘) · 바꾸기(옛것은 가방으로) · 행적 한 줄
//   ② 새로고침 뒤 그대로(자리 · 모형 수 · 가방 수)
//   ③ 지나가는 이웃 한마디(몸 있는 사람 · 하루 한 번)
//   ④ 좋아하는 선물 → 들은 말 · 다음 날 문 앞 답례(칠판 줄 · 줍기) · 같은 이웃 하루 한 번(두 번째 = 그대로)
//   ⑤ 싫어하는 선물 → 돌려받음(+0) · 1.9초 뒤 귀띔(대신 반가운 것) · 가방 선물 창에 '이 이웃이 한 말' · 표시(💖 · 못 먹어요)
//   ⑥ 돌려놓기 = 가방으로(생김 X) · 페이지 오류 0
const { chromium } = require('./pw.cjs');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  try { const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(), errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 160))); p.on('console', m => { const t = m.text(); if (/게임 tick 오류/.test(t)) errs.push(t.slice(0, 160)); });
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
    const closeAll = async () => { for (let i = 0; i < 4; i++) { const o = await ev(() => !!document.querySelector('.twn-p')); if (!o) break; await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); await W8(250); if (await ev(() => !!document.querySelector('.twn-p'))) { await p.keyboard.press('Escape'); await W8(250); } } };
    const tp = (x, z) => ev(([x, z]) => { const M = SD2.map, g = M.q.groundAt(x, z, SM_TOWN.ground(x, z) + 2); M.player.teleport([x, g + 0.05, z]); }, [x, z]);
    const load = async () => { await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.home && SM_TOWN.cozy && SM_TOWN.cozy() && SM_TOWN.cozy().info().on, null, { timeout: 240000 }); await W8(1500); await closeAll(); await W8(1500); await closeAll();
      await ev(() => { const G = SM_TOWN.game().S; G.min = 10 * 60; G.jobs = G.jobs || {}; G.jobs.fireNo = G.day; G.story = G.story || {}; G.story.p0auto = 1; }); };
    await p.goto(URL); await load();
    // ① 놓기
    console.log('① 마당 자리 · 놓기');
    const H = await ev(() => SM_TOWN.home()), I0 = await ev(() => SM_TOWN.cozy().info());
    console.log('  자리 ' + JSON.stringify(I0.slots) + ' · 문 ' + JSON.stringify(H.door && H.door.map(v => +v.toFixed(1))));
    ok(I0.slots.length === 3, '마당 자리 셋(' + I0.slots.length + ')'); ok(I0.n === 0 && I0.hots.every(h => h.off), '빈 자리 = 안 보임 · 놓을 것 없으면 E도 꺼짐');
    const sp = I0.slots[0]; await ev(() => { const S = SM_TOWN.game().S; S.bag['🧸'] = 1; S.bag['🌰'] = 2; S.bag['🧩'] = 1; }); await tp(sp[0] + 0.9, sp[2]); await W8(1300);
    const lab = await ev(() => SM_TOWN.cozy().info().hots); ok(lab.every(h => !h.off) && /마당 꾸미기/.test(lab[0].label), '놓을 것이 생기면 E(' + lab[0].label + ')');
    await ev(() => SM_TOWN.cozy().open(0)); await W8(300);
    const pn = await ev(() => { const P = document.querySelector('.twn-p'); return P ? { btn: [...P.querySelectorAll('[data-put]')].map(b => b.dataset.put), txt: P.textContent.slice(0, 120) } : null; });
    ok(pn && pn.btn.includes('🧸') && pn.btn.includes('🌰'), '창에 놓을 것 단추(' + (pn && pn.btn.join(' ')) + ')');
    await ev(() => { const b9 = document.querySelector('.twn-p [data-put="🧸"]'); if (b9) b9.click(); }); await W8(300);
    await ev(() => SM_TOWN.cozy().put(1, '🌰')); await ev(() => SM_TOWN.cozy().put(2, '🧩')); await W8(200);
    let I1 = await ev(() => SM_TOWN.cozy().info()); const bag1 = await ev(() => { const S = SM_TOWN.game().S; return { b: S.bag['🧸'] || 0, c: S.bag['🌰'] || 0, t: S.bag['🧩'] || 0, deed: (S.deeds || []).filter(d => d.t === 'deco').length }; });
    console.log('  ' + JSON.stringify({ yard: I1.yard, n: I1.n, cols: I1.cols, bag: bag1 }));
    ok(I1.yard[0] === '🧸' && I1.yard[1] === '🌰' && I1.yard[2] === '🧩', '세 자리에 놓음'); ok(bag1.b === 0 && bag1.c === 1 && bag1.t === 0, '가방에서 하나씩 빠짐'); ok(I1.n > 10 && I1.cols === 3, '모형(상자 ' + I1.n + ') · 부딪힘 셋');
    ok(bag1.deed >= 1, '행적 한 줄(기억하는 이웃이 말할 거리 · ' + bag1.deed + ')');
    const sw = await ev(() => { SM_TOWN.cozy().put(2, '🌰'); const S = SM_TOWN.game().S; return { y: SM_TOWN.cozy().info().yard[2], t: S.bag['🧩'] || 0, c: S.bag['🌰'] || 0 }; }); ok(sw.y === '🌰' && sw.t === 1 && sw.c === 0, '바꿔 놓기 = 옛것은 가방으로(' + JSON.stringify(sw) + ')');
    // ② 새로고침
    console.log('② 새로고침 뒤 그대로');
    const before = await ev(() => { SM_TOWN.game().flush(); const i = SM_TOWN.cozy().info(), S = SM_TOWN.game().S; return { yard: i.yard, n: i.n, b: S.bag['🧸'] || 0, c: S.bag['🌰'] || 0 }; });
    await p.reload(); await load();
    const after = await ev(() => { const i = SM_TOWN.cozy().info(), S = SM_TOWN.game().S; return { yard: i.yard, n: i.n, b: S.bag['🧸'] || 0, c: S.bag['🌰'] || 0 }; });
    console.log('  전 ' + JSON.stringify(before) + ' · 뒤 ' + JSON.stringify(after)); ok(JSON.stringify(before) === JSON.stringify(after), '새로고침 뒤 마당·모형·가방 그대로');
    // ③ 지나가는 이웃
    console.log('③ 지나가는 이웃 한마디');
    { const d = H.door; await ev(() => { SM_TOWN.game().S.home.yc = 0; }); let said = null; const spots = [[d[0], d[1]], ...I0.slots.map(s => [s[0], s[2]])];
      for (let k = 0; k < 40 && !said; k++) { const q = spots[k % spots.length]; if (k % 8 === 0) { await tp(q[0] + 0.6, q[1] + 0.6); } await W8(1000); said = await ev(() => SM_TOWN.cozy().info().say); }
      if (!said) said = await ev(() => { const m = SD2.map.player.get(); return SM_TOWN.cozy().talk({ x: m.x, y: m.y, z: m.z }, true); });   /* 40초 동안 아무도 안 지나감 = 가장 가까운 일꾼(18m)까지 */
      console.log('  ' + JSON.stringify(said)); ok(!!said && !!said.who && /곰 인형|솔방울|칠교/.test(said.t), '몸 있는 이웃이 놓은 것을 두고 한마디(' + (said && said.who) + ')');
      const tw = await ev(() => { const m = SD2.map.player.get(); return SM_TOWN.cozy().talk({ x: m.x, y: m.y, z: m.z }, false); }); ok(!tw, '같은 날 또 = 말 X'); }
    await closeAll();
    // ④ 좋아하는 선물 → 다음 날 답례
    console.log('④ 좋아하는 선물 → 다음 날 답례 · 하루 한도');
    const pick = await ev(() => { const N = SM_TOWN.nb(), R = N.reps().filter(r => N.likes(r.k).length >= 2 && r.k !== 'stall'); const r = R[0]; if (!r) return null; const ry = r.ry || 0, px = r.x + 2.4 * Math.sin(ry), pz = r.z + 2.4 * Math.cos(ry); return { hk: r.hk, k: r.k, x: r.x, z: r.z, g: r.g, px, pz, no: r.no, likes: N.likes(r.k) }; });
    ok(!!pick, '선물 받을 이웃(' + (pick && pick.k + ' ' + pick.hk) + ')');
    if (pick) { const go = async () => { await ev(o => { const g = SM_TOWN.ground(o.px, o.pz); SD2.map.player.teleport([o.px, SD2.map.q.groundAt(o.px, o.pz, g + 2) + 0.05, o.pz]); SD2.map.player.lookAt([o.x, o.z]); }, pick); await W8(600); await closeAll(); };
      await go(); const lk = pick.likes.filter(e => e !== pick.no), e1 = lk[0], e2 = lk[1] || lk[0];
      const g1 = await ev(([o, e1, e2]) => { const S = SM_TOWN.game().S; S.uses = {}; S.rw = {}; S.bag[e1] = 1; S.bag[e2] = (S.bag[e2] || 0) + 1; const h0 = S.hearts[o.hk] || 0; SM_TOWN.rules.gift(e1); const h1 = S.hearts[o.hk] || 0; return { h0, h1, kn: (S.nbk || {})[o.hk] || null, nb: S.today && S.today.nb, left: S.bag[e1] || 0 }; }, [pick, e1, e2]);
      console.log('  ' + JSON.stringify(g1)); ok(g1.h1 - g1.h0 === 2 && g1.left === 0, '좋아하는 것 = 하트 +2 · 가방 −1'); ok(g1.kn && g1.kn.l.includes(e1), '들은 말로 남음(좋아함 ' + e1 + ')'); ok(g1.nb && g1.nb.why === 'like' && g1.nb.e === e1, '오늘 답례할 이웃 = 이 이웃(like)');
      await W8(1700); await closeAll();
      const g2 = await ev(([o, e2]) => { const S = SM_TOWN.game().S, b0 = S.bag[e2] || 0, h0 = S.hearts[o.hk] || 0; SM_TOWN.rules.gift(e2); return { kept: (S.bag[e2] || 0) === b0, same: (S.hearts[o.hk] || 0) === h0 }; }, [pick, e2]); ok(g2.kept && g2.same, '같은 이웃 하루 두 번째 선물 = 그대로(가방·하트)');
      const day0 = await ev(() => SM_TOWN.game().S.day); await ev(() => SM_TOWN.sleep()); let N1 = null; for (let k = 0; k < 20; k++) { await W8(500); N1 = await ev(d => { const S = SM_TOWN.game().S; return S.day === d + 1 && S.news && S.news.d === S.day ? { g: S.home.gift, lines: S.news.lines.map(l => l.t) } : null; }, day0); if (N1) break; } await closeAll();
      console.log('  다음 날 ' + JSON.stringify(N1)); ok(N1 && N1.g && N1.g.why === 'like' && N1.g.g === e1 && N1.g.k === pick.k, '다음 날 문 앞 답례(' + (N1 && N1.g && N1.g.e) + ')'); ok(N1 && N1.lines.some(t => /답례/.test(t)), '칠판에 답례 줄');
      const pk = await ev(e => { const S = SM_TOWN.game().S, b0 = S.bag[e] || 0; SM_TOWN.cozy().giftPick(); return { got: (S.bag[e] || 0) - b0, gone: !S.home.gift, rec: SM_TOWN.cozy().info().rec }; }, N1 && N1.g ? N1.g.e : ''); ok(pk.got === 1 && pk.gone && pk.rec['pick:like'] === 1, '답례 줍기 = 가방 +1 · 하루 하나');
      // ⑤ 싫어하는 선물 → 귀띔
      console.log('⑤ 싫어하는 선물 → 귀띔 · 선물 창');
      await ev(() => { SM_TOWN.game().S.min = 10 * 60; }); await W8(1500);   /* 이웃 일과(ROUTINE-1): 잠 뒤 6시엔 일꾼이 아직 집 — 일하는 때로 */
      await go(); const g3 = await ev(o => { const S = SM_TOWN.game().S; S.uses = {}; S.bag[o.no] = 1; const h0 = S.hearts[o.hk] || 0; SM_TOWN.rules.gift(o.no); return { kept: S.bag[o.no] === 1, same: (S.hearts[o.hk] || 0) === h0, n: ((S.nbk || {})[o.hk] || {}).n }; }, pick);
      ok(g3.kept && g3.same && g3.n === pick.no, '싫어하는 것(' + pick.no + ') = 돌려받음 · 하트 그대로 · 들은 말로 남음'); await W8(2400);
      const tip = await ev(() => SM_TOWN.cozy().info().tip); console.log('  귀띔 ' + JSON.stringify(tip)); ok(tip && tip.no === pick.no && tip.like && tip.like !== pick.no && pick.likes.includes(tip.like), '1.9초 뒤 대신 반가운 것 귀띔(' + (tip && tip.like) + ')');
      await closeAll(); await ev(([o, e1]) => { const S = SM_TOWN.game().S; S.bag[e1] = 1; }, [pick, e1]); await p.keyboard.press('KeyI'); await W8(500);
      const bp = await ev(([no, e1]) => { const P = document.querySelector('.twn-p'); if (!P) return null; const nt = P.querySelector('[data-cz="note"]'), bn = q => { const b = P.querySelector('[data-gift="' + q + '"]'); return b ? b.textContent : null; }; return { note: nt ? nt.textContent : null, no: bn(no), like: bn(e1) }; }, [pick.no, e1]);
      console.log('  선물 창 ' + JSON.stringify(bp)); ok(bp && bp.note && /이 이웃이 한 말/.test(bp.note), "가방 선물 창에 '이 이웃이 한 말'"); ok(bp && /못 먹어요/.test(bp.no || '') && /💖/.test(bp.like || ''), '고를 때 표시(싫어함 = 못 먹어요 · 들은 좋아함 = 💖)');
      await closeAll();
      const fresh = await ev(() => { const N = SM_TOWN.nb(), S = SM_TOWN.game().S, R = N.reps().filter(r => !(S.nbk || {})[r.hk] && N.likes(r.k).length); return R.length ? SM_TOWN.cozy().note({ k: R[0].k, x: R[0].x, z: R[0].z }, R[0].hk) : 'none'; }); ok(/반가워할지 몰라요/.test(fresh), '아직 못 들은 이웃 = 고르는 기준 한 줄(' + fresh.replace(/<[^>]+>/g, '').slice(0, 40) + ')'); }
    // ⑥ 돌려놓기
    console.log('⑥ 돌려놓기');
    const bk = await ev(() => { const S = SM_TOWN.game().S, b0 = S.bag['🧸'] || 0; SM_TOWN.cozy().back(0); const i = SM_TOWN.cozy().info(); return { got: (S.bag['🧸'] || 0) - b0, y: i.yard[0], cols: i.cols }; }); ok(bk.got === 1 && bk.y === null && bk.cols === 2, '돌려놓기 = 가방 +1 · 자리 빔(' + JSON.stringify(bk) + ')');
    const bk2 = await ev(() => { const S = SM_TOWN.game().S, b0 = S.bag['🧸'] || 0; SM_TOWN.cozy().back(0); return (S.bag['🧸'] || 0) - b0; }); ok(bk2 === 0, '빈 자리 돌려놓기 = 생김 X');
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.join(' | ') : ''));
  } catch (e) { fails.push('하네스 예외 ' + e.message.split('\n')[0]); console.log('  ✗ 하네스 예외 ' + e.message.split('\n')[0]); } finally { await b.close(); }
  console.log(fails.length ? 'FAIL ' + fails.length : 'PASS'); process.exit(fails.length ? 1 : 0); })();
