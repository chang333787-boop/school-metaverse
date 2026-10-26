// 🌾 농사 놀이 상황 겹 시험(DEPTH-2 · 10-26 · docs/systems/town_depth.md 합 2 줄): node tools/harness/town_farm.cjs [마을=ourtown] [포트=8002]
//   딸기·표고(주문·젖은 땅) · 배추(주문 크기) · 배 봉지(벌레 오는 쪽) · 벼 베기(비구름 쪽) · 소금(구름 조짐 보고 거둘 때) — v2/games/town_minigame.js · town_salt.js
//   놀이마다: ① 상황 두 갈래에서 정답이 바뀜 ② 맞게 하면 결과가 좋고 틀리면 세상 쪽 결과(다른 바구니·벌레 먹은 배·젖은 벼·덜 영근·녹은 소금) ③ 세상 상태(비·계절)가 갈래를 정함
//   ④ 열 판 = 바로 앞 판과 같은 갈래 X · 날이 바뀌면 어제 마지막 갈래 X ⑤ 단서가 창 안에 보임(쪽지·깃발·구름·젖은 땅) ⑥ 페이지 오류 0
//   브라우저 하나 · 그리기 끔(pw.cjs) · b2.sh 자리로
const { chromium } = require('./pw.cjs');
const pos = process.argv.slice(2).filter(a => !a.startsWith('--')), ID = pos[0] || 'ourtown', PORT = pos[1] || '8002', URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const T0 = Date.now(), b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }); const errs = [];
  try { const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(); p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(t)) || /게임 tick 오류|기록 오류|모르는 놀이 갈래/.test(t)) errs.push(t.slice(0, 200)); });
    const W8 = ms => p.waitForTimeout(ms), ev = (f, a) => p.evaluate(f, a); await p.addInitScript(() => { window.__SURP_OFF = 1; });
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.lad && SM_TOWN.rules && SM_TOWN.mgDbg && SM_TOWN.salt && window.SD2, null, { timeout: 240000 }); await W8(1500);
    await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p button'); if (b9) b9.click(); }); await p.keyboard.press('Escape'); await W8(500);
    await ev(() => { const G = SM_TOWN.game(); window.__G = G; G.setClock(false); G.S.min = 11 * 60; if (SD2.map.time) SD2.map.time('day'); SM_TOWN.rules.wx('clear'); if (G.S.wx) G.S.wx.auto = false; SM_TOWN.rules.season('spring'); G.S.mgj = {};
      window.__clean = () => { for (let k = 0; k < 4; k++) { if (SM_TOWN.rules.play()) SM_TOWN.rules.playEnd(0); const P = document.querySelector('.twn-p'); if (!P) break; const b9 = P.querySelector('[data-a="x"]'); if (b9) b9.click(); else break; } }; });
    const has = await ev(L => L.filter(k => SM_TOWN.workers().some(w => w[4] === k)), ['strawberry', 'shiitake', 'cabbage', 'pear', 'paddy', 'saltpan']); console.log('이 판의 농사 놀이: ' + has.join(', '));
    const D = () => ev(() => SM_TOWN.mgDbg());
    const setSea = async s9 => { await ev(() => __clean()); for (let i = 0; i < 100; i++) { if (await ev(q => SM_TOWN.seasonNow === q, s9)) break; if (i % 5 === 0) await ev(q => SM_TOWN.rules.season(q), s9); await W8(200); }   /* 다른 장면을 짓는 중이면 계절 바꾸기가 무시됨 → 될 때까지 다시 */ await W8(300); };   /* 계절 바꾸기는 다시 짓느라 시간이 걸림 */
    /* 열기: sit = 이번 판 갈래를 정함(window.__SIT · 없으면 씨앗) · lvK = 사다리 갈래 이름 */
    const open = (k, sit, lv, lvK) => ev(([k9, s9, lv9, lk]) => { __clean(); const S = __G.S; S.uses = {}; S.rw = {}; S.min = 11 * 60; if (!S.lad) S.lad = {}; if (!S.lad.mg) S.lad.mg = {}; S.lad.mg[lk || k9] = { lv: lv9 || 1, z: 0, n: 0, best: null, last: null };
      window.__SIT = s9 || null; const r = SM_TOWN.play(k9); window.__SIT = null; if (!r || !SM_TOWN.mgDbg()) return null; const el = [...document.querySelectorAll('.twn-play')].pop();
      return { dbg: SM_TOWN.mgDbg(), note: (el.querySelector('.ordn') || {}).textContent || '', sit: (el.querySelector('.rsit') || {}).textContent || '', flag: !!el.querySelector('.fl9,.fg9 svg'), cloud: el.querySelectorAll('.ccl,.sp .cl svg').length, wetG: !!el.querySelector('.rg.wet'), msg: (el.querySelector('.msg') || {}).textContent || '', head: (el.querySelector('small') || {}).textContent || '', bars: el.querySelectorAll('.zone,.pg,.mk').length }; }, [k, sit, lv, lvK]);
    const call = (fn, a) => ev(([f, a9]) => { const d = SM_TOWN.mgDbg(); if (!d) return null; const r = f === 'salt' ? null : d[f](...a9); return r === undefined ? true : r; }, [fn, a]);
    const ended = k => ev(k9 => { const L = SM_TOWN.lad().play; if (L && !L.done) return null; const R = __G.S.lad && __G.S.lad.mg && __G.S.lad.mg[k9]; return R && R.last ? { g: R.last.g } : null; }, k);   /* 판 끝 = 사다리 기록(이번 판)의 점수 */
    const waitEnd = async (k, ms = 9000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const e = await ended(k); if (e) return e; await W8(150); } return null; };
    const msg = () => ev(() => { const el = [...document.querySelectorAll('.twn-play')].pop(); return el ? (el.querySelector('.msg') || {}).textContent || '' : ''; });
    const ten = async (k, key, tag, lvK, day) => { const seq = []; for (let i = 0; i < 10; i++) { if (i === 5) await ev(() => { __G.S.day++; }); const o = await open(k, null, 1, lvK); if (!o) { seq.push('?'); continue; } seq.push(String(o.dbg[key])); }
      let same = 0; for (let i = 1; i < 10; i++) if (seq[i] === seq[i - 1]) same++; ok(same === 0 && new Set(seq).size >= 2, tag + ' 열 판 = ' + seq.join(' ') + ' (바로 앞과 같은 판 ' + same + ')'); ok(seq[5] !== seq[4], tag + ' 날이 바뀐 첫 판(' + seq[5] + ') ≠ 어제 마지막(' + seq[4] + ')'); await ev(() => __clean()); };

    // ── 🍓 딸기 · 🍄 표고 ──
    for (const k of has.filter(q => q === 'strawberry' || q === 'shiitake')) { const nm = k === 'strawberry' ? '🍓 딸기' : '🍄 표고', HI = k === 'strawberry' ? 'jam' : 'soup'; console.log(nm + ' — 주문 쪽지 · 젖은 땅');
      await ev(() => { __G.S.mgj = {}; SM_TOWN.rules.wx('clear'); });
      let a = await open(k, { ord: 'mkt' }); ok(!!a && a.bars === 0, nm + ' 창 열림 · 막대 없음 · 「' + (a && a.head) + '」'); if (!a) continue;
      ok(a.dbg.first && /쪽지/.test(a.msg), nm + ' 첫 판 = 하는 법 한 줄 「' + a.msg.slice(0, 50) + '」');
      let b2 = await open(k, { ord: HI }); ok(a.dbg.want === 'r' && b2.dbg.want === 'o' && a.note !== b2.note, nm + ' 정답이 바뀜: 장터 = ' + a.dbg.want + '(「' + a.note.trim().slice(0, 30) + '」) · ' + HI + ' = ' + b2.dbg.want + '(「' + b2.note.trim().slice(0, 30) + '」)');
      { const d = b2.dbg, iR = d.st.indexOf('r'), iO = d.st.indexOf('o'); if (iR >= 0) await call('pick', [iR]); const m1 = await msg(); if (iO >= 0) await call('pick', [iO]); const d2 = await D();
        ok(iR >= 0 && iO >= 0 && d2.P === 1 && d2.bk.r === 1, nm + ' ' + HI + ' 주문에서 알맞게 익은 것 = 장터 바구니로(주문 상자 X) · 아주 익은 것 = 주문 상자 「' + m1.slice(0, 44) + '」'); }
      a = await open(k, { ord: 'mkt' }); { const d = a.dbg, iO = d.st.indexOf('o'), iR = d.st.indexOf('r'); let m1 = ''; if (iO >= 0) { await call('pick', [iO]); m1 = await msg(); } if (iR >= 0) await call('pick', [iR]); const d2 = await D();
        ok(iR >= 0 && d2.P === 1 && (iO < 0 || d2.bk.o === 1), nm + ' 장터 주문에서 무른 것 = 다른 바구니 · 알맞게 익은 것 = 주문 상자' + (m1 ? ' 「' + m1.slice(0, 40) + '」' : '(무른 것 없음)')); }
      await ev(() => SM_TOWN.rules.wx('rain')); const w = await open(k, { ord: 'far' }); const wO = w.dbg.st.filter(s => s === 'o').length;
      ok(w.dbg.wet && w.wetG && /젖/.test(w.sit) && wO >= 2 && w.dbg.want === 'h', nm + ' 비 = 젖은 땅 그림 · 무른 것 ' + wO + '개 섞임 · 「' + w.sit + '」 · 먼 곳 주문 = ' + w.dbg.want);
      await ev(() => SM_TOWN.rules.wx('clear')); const c2 = await open(k, { ord: 'far' }); ok(!c2.dbg.wet || c2.dbg.wet === true, nm + ' 맑음 = 젖은 땅 ' + c2.dbg.wet + '(어제 비 예보면 젖음) · 「' + c2.sit + '」');
      await ten(k, 'ord', nm, k); }

    // ── 🥬 배추 ──
    if (has.includes('cabbage')) { console.log('🥬 배추 — 주문 크기'); await ev(() => { __G.S.mgj = {}; }); await setSea('autumn');
      const a = await open('cabbage', { ord: 'shop' }), b2 = await open('cabbage', { ord: 'kim' });
      ok(a && b2 && a.dbg.want === 0 && b2.dbg.want === 2, '정답이 바뀜: 동네 가게 = 작은(' + (a && a.dbg.want) + ') · 김장 = 큰(' + (b2 && b2.dbg.want) + ') · 「' + (b2 && b2.note.trim().slice(0, 34)) + '」');
      if (b2) { const d = b2.dbg, iW = d.sz.indexOf(2), iX = d.sz.indexOf(0); await call('pick', [iX]); const m1 = await msg(); await call('pick', [iW]); const d2 = await D(); ok(d2.ok === 1 && d2.miss === 1 && /장터/.test(m1), '김장 주문에 작은 배추 = 장터 바구니(「' + m1.slice(0, 40) + '」) · 큰 배추 = 주문 상자'); }
      { const q = await open('cabbage', { ord: 'kim' }); for (const i of q.dbg.sz.map((s, i) => (s === 2 ? i : -1)).filter(i => i >= 0).slice(0, 4)) await call('pick', [i]); const e = await waitEnd('cabbage'); ok(e && e.g === 3, '김장 주문 = 큰 배추 넷만 = 점수 ' + (e && e.g)); }
      await setSea('spring'); const sp = []; for (let i = 0; i < 6; i++) { const o = await open('cabbage'); sp.push(o ? o.dbg.ord : '?'); } ok(!sp.includes('kim'), '봄 = 김장 주문 없음(' + sp.join(' ') + ')');
      await setSea('autumn'); await ten('cabbage', 'ord', '🥬 배추', 'cabbage'); await setSea('spring'); }

    // ── 🍐 배 봉지 ──
    if (has.includes('pear')) { console.log('🍐 배 봉지 — 벌레가 오는 쪽');
      const L = await open('pear', { cov: 'L' }, 3), R = await open('pear', { cov: 'R' }, 3);
      ok(L && R && L.flag && L.dbg.ent === 'L' && R.dbg.ent === 'R' && L.dbg.order[0] !== R.dbg.order[0], '정답이 바뀜: 바람 ' + (L && L.dbg.k) + ' = 왼쪽 먼저(' + (L && L.dbg.order.join(',')) + ') · 바람 ' + (R && R.dbg.k) + ' = 오른쪽 먼저(' + (R && R.dbg.order.join(',')) + ') · 깃발 보임 ' + (L && L.flag));
      const F = await open('pear', { cov: 'F' }, 3); ok(F && F.dbg.ent === F.dbg.fs && (F.dbg.k === 0 || F.dbg.k === 4), '바람이 남북 = 숲 쪽(' + (F && F.dbg.fs) + ')에서 옴 · 깃발 ' + (F && F.dbg.k));
      { const q = await open('pear', { cov: 'L' }, 3); for (const i of q.dbg.order) await call('bagT', [i]); const e = await waitEnd('pear'); const d = await D(); ok(e && e.g === 3, '오는 쪽부터 차례로 = 벌레 먹은 나무 0 · 점수 ' + (e && e.g)); void d; }
      { const q = await open('pear', { cov: 'L' }, 3); for (const i of q.dbg.order.slice().reverse()) { const d = await D(); if (!d) break; if (!d.eat[i] && !d.bag[i]) await call('bagT', [i]); } const d = await D(); const m1 = await msg(); const e = await waitEnd('pear');
        ok(d && d.ate >= 1 && e && e.g != null && e.g < 3, '반대쪽부터 = 벌레 먹은 나무 ' + (d && d.ate) + ' · 점수 ' + (e && e.g) + ' 「' + m1.slice(0, 36) + '」'); }
      await ten('pear', 'ty', '🍐 배', 'pear'); }

    // ── 🌾 벼 베기 ──
    if (has.includes('paddy')) { console.log('🌾 벼 베기 — 비구름 쪽부터'); await setSea('autumn');
      const path = (cs, rev) => { const C9 = 6, R9 = 4, out = []; if (cs === 'N' || cs === 'S') { let ys = [0, 1, 2, 3]; if ((cs === 'S') !== !!rev) ys = ys.reverse(); ys.forEach((y, j) => { const xs = [0, 1, 2, 3, 4, 5]; if (j % 2) xs.reverse(); for (const x of xs) out.push(y * C9 + x); }); }
        else { let xs = [0, 1, 2, 3, 4, 5]; if ((cs === 'E') !== !!rev) xs = xs.reverse(); xs.forEach((x, j) => { const ys = [0, 1, 2, 3]; if (j % 2) ys.reverse(); for (const y of ys) out.push(y * C9 + x); }); } return out; };
      const run = async (cs, rev, lv) => { const q = await open('paddy', { cut: cs }, lv, 'cut'); if (!q) return null; const P = path(q.dbg.cs, rev); await call('enter', [P[0]]); for (let i = 1; i < P.length; i++) await call('go', [P[i]]); const d = await D(); const e = await waitEnd('cut'); return { q, d, e }; };
      const n = await open('paddy', { cut: 'N' }, 4, 'cut'), w = await open('paddy', { cut: 'W' }, 4, 'cut');
      ok(n && w && n.dbg.cs === 'N' && n.dbg.rows && w.dbg.cs === 'W' && !w.dbg.rows && n.cloud >= 2 && n.flag, '정답이 바뀜: 구름 북 = 가로줄(바람 ' + (n && n.dbg.k) + ') · 구름 서 = 세로줄(바람 ' + (w && w.dbg.k) + ') · 4칸 구름 ' + (n && n.cloud) + '개 · 깃발 보임');
      for (const cs of ['N', 'W']) { const g = await run(cs, false, 4); ok(g && g.d.wet === 0 && g.d.dry === 24 && g.e && g.e.g === 3, '구름 ' + cs + ' 쪽부터 줄 따라 = 젖은 벼 ' + (g && g.d.wet) + ' · 점수 ' + (g && g.e && g.e.g));
        const r = await run(cs, true, 4); ok(r && r.d.wet >= 6 && r.e && r.e.g != null && r.e.g < 3, '구름 ' + cs + ' 반대쪽부터 = 젖은 벼 ' + (r && r.d.wet) + '칸 · 점수 ' + (r && r.e && r.e.g)); }
      { const x = await open('paddy', { cut: 'N' }, 1, 'cut'); const e9 = await call('enter', [8]); const d = await D(); ok(d && d.ph === 'enter', '가운데 칸으로는 못 들어감(가장자리만) · ' + e9); }
      await ten('paddy', 'cs', '🌾 벼 베기', 'cut'); await setSea('spring'); }

    // ── 🧂 소금(천일염) ──
    if (has.includes('saltpan')) { console.log('🧂 소금 — 구름 조짐 보고 거둘 때');
      const so = async sit => { await ev(() => SM_TOWN.salt.set({ lv: 1, good: 0, n: 0, nw: 9 })); return open('saltpan', { salt: sit }, 1); };
      await ev(() => { SM_TOWN.rules.wx('clear'); SM_TOWN.salt.set({ lv: 1, good: 0, n: 0, nw: 9 }); });
      const st = () => ev(() => { const d = SM_TOWN.salt.dbg(); return d && d.st; });
      const salt = (f, a) => ev(([f9, a9]) => { const d = SM_TOWN.salt.dbg(); return d ? d[f9](...(a9 || [])) : null; }, [f, a]);
      let c1 = await so('clear'); await salt('sit', ['clear']); let s1 = await st(); ok(c1 && s1 && s1.lv === 1 && s1.ph === 'watch' && c1.flag, '천일염 = 지켜보기로 시작 · 깃발 보임 · 「' + (c1 && c1.msg.slice(0, 40)) + '」');
      await salt('sit', ['come', 2]); const s2 = await st(); ok(s1.best === 2 && s2.best === 1, '정답이 바뀜: 맑음 = 두 시간 기다려 굵게(' + s1.best + ') · 먹구름이 바람 불어오는 쪽 두 칸 = 한 시간 뒤 거둠(' + s2.best + ')');
      await salt('wait'); await salt('take'); let s3 = await st(); ok(s3.ph === 'rake' && s3.cap === 3 && s3.why === '', '먹구름: 한 시간 뒤 거둠 = 알맞음(최고 3)');
      c1 = await so('clear'); await salt('sit', ['come', 2]); await salt('wait'); await salt('wait'); s3 = await st(); const vis = await ev(() => { const w9 = [...document.querySelectorAll('.twn-play')].pop(), b9 = w9 && w9.querySelector('.sst'); return !!b9 && b9.style.display !== 'none'; });
      ok(s3.ph === 'rain' && s3.asked && vis, '먹구름: 두 시간 기다림 = 비에 녹음 · 「소금물 창고에 들이기」 보임 「' + (await msg()).slice(0, 40) + '」');
      c1 = await so('clear'); await salt('sit', ['clear']); await salt('take'); s3 = await st(); ok(s3.ph === 'rake' && s3.cap === 2 && s3.why === 'early' && s3.N < 16, '맑음: 바로 거둠 = 덜 영근 소금(양 ' + s3.N + ' · 최고 2)');
      c1 = await so('away'); await salt('sit', ['away']); s3 = await st(); await salt('wait'); await salt('wait'); const s4 = await st(); ok(s3.best === 2 && s4.ph === 'watch' && s4.g === 2, '구름이 바람 가는 쪽 = 멀어짐 · 두 시간 기다려도 비 X(알갱이 ' + s4.g + ')');
      await ev(() => SM_TOWN.rules.wx('rain')); await ev(() => SM_TOWN.salt.set({ lv: 1, good: 0, n: 0, nw: 9 })); c1 = await open('saltpan', null, 1); s3 = await st(); ok(s3 && s3.sit === 'come' && s3.best === 0, '지금 비 = 먹구름 바로 옆(거둘 때 = 지금 · ' + (s3 && s3.sit) + ' ' + (s3 && s3.d) + ')');
      await ev(() => SM_TOWN.rules.wx('clear'));
      { const seq = []; for (let i = 0; i < 10; i++) { if (i === 5) await ev(() => { __G.S.day++; }); await ev(() => SM_TOWN.salt.set({ lv: 1, good: 0, n: 0, nw: 9 })); await open('saltpan', null, 1); const s = await st(); seq.push(s ? s.sid : '?'); }
        let same = 0; for (let i = 1; i < 10; i++) if (seq[i] === seq[i - 1]) same++; ok(same === 0, '🧂 소금 열 판 = ' + seq.join(' ') + ' (바로 앞과 같은 판 ' + same + ')'); ok(seq[5] !== seq[4], '🧂 날이 바뀐 첫 판 ≠ 어제 마지막'); }
      await ev(() => __clean()); }
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' · ' + errs.slice(0, 4).join(' / ') : ''));
  } catch (e) { fails.push('예외 ' + e.message); console.log('  ✗ 예외 ' + e.stack); } finally { await b.close(); }
  console.log((fails.length ? '✗ 실패 ' + fails.length : '✓ 모두 통과') + ' · ' + Math.round((Date.now() - T0) / 1000) + '초'); process.exit(fails.length ? 1 : 0); })();
