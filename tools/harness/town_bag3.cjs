// 🎒 가방 갈래 + 게임 가방 시험(BAG-3 · 사용자 11-02 '인벤토리하고 장비? 분류가 잘 안 되는 것 같아' · 11-07 '게임처럼 보이는 기능은 무시?') — 설계 docs/systems/town_bag3.md
//   ① 탭 넷 · 수첩 줄과 따로  ② 모든 물건이 한 갈래에만(가방 글자 + 도구 + 보상)  ③ 네모 칸(같은 크기 · 빈 칸 · ×n 오른쪽 아래)  ④ 크게 보기 카드 단추 = 예전과 같은 결과(먹기 · 선물 · 팔기)
//   ⑤ 인형 + 장비 칸(입히면 바뀜)  ⑥ 도구 띠 끌어 놓기 · 누르고 고르기 · 숫자 키  ⑦ 꼬리표(저장 · 지도 조각 · 되돌림은 안 바꿈)  ⑧ 새 점  ⑨ 정렬·거르기  ⑩ 키보드(I · ←→ · Esc)
//   ⑪ 이야기 '주기' 단계 = 🎒 탭 + 코치 줄  ⑫ 옛 저장(칸 없음) = 점 홍수 X  ⑬ 휴대폰 세로·가로(가로 넘침 X · 탭 한 줄 · 단추 44px)  ⑭ 페이지 오류 0
//   쓰는 법: zsh tools/ops/b2.sh node tools/harness/town_bag3.cjs ourtown <포트> [--shots=폴더]
const { chromium, devices, RENDER } = require('./pw.cjs');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const SHOTS = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8) || null, BASE = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0';
const ONLY = (process.argv.find(a => a.startsWith('--only=')) || '').slice(7);   /* --only=phone = 휴대폰만(사진 다시 볼 때) */
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
const ARGS = ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'];
const SEED = [['🍙', 2], ['🍲', 1], ['🥬', 3], ['🥔', 5], ['🍓', 4], ['🍯', 1], ['🥚', 2], ['🌾', 1], ['🍦', 1], ['🍂', 6], ['⚪', 2], ['✉', 1], ['⛰', 1], ['🗼', 1], ['🧸', 1], ['🧩', 1]];
const RWDS = [['work', 2], ['work', 3], ['work', 4], ['work', 6], ['farm', 2], ['farm', 3], ['farm', 4], ['look', 2], ['look', 4], ['explore', 2], ['explore', 3], ['explore', 7], ['cook', 2], ['cook', 3], ['trade', 2], ['trade', 3], ['work', 8]];
async function boot(ctx) { const p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 200)));
  await p.goto(BASE); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.rwd && SM_TOWN.bag3 && SM_TOWN.bag3(), null, { timeout: 240000 }); await p.waitForTimeout(2500);
  await p.evaluate(() => { for (let i = 0; i < 5; i++) { const x = document.querySelector('.twn-p .twn-x'); if (x) x.click(); } const G = SM_TOWN.game(); if (G.setClock) G.setClock(false); G.S.clock = false; G.S.min = 11 * 60; if (SM_TOWN.storyOff) SM_TOWN.storyOff(); try { localStorage.removeItem('sm-bag3-ui'); } catch (e) { /* */ } });
  return { p, errs }; }
const PK = () => { const e = document.querySelector('.twn-p'); return e && e.getClientRects().length ? (e.dataset.k || '?') : ''; };
(async () => {
  const b = await chromium.launch({ args: ARGS });
  try {
    // ───────────────── 데스크톱(크롬북 가로) ─────────────────
    if (ONLY !== 'phone') { const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } }), { p, errs } = await boot(ctx), ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms), pk = () => ev(PK);
      const shot = async n => { if (!SHOTS) return; await W8(300); await p.screenshot({ path: SHOTS + '/bag3_' + n + '.png' }); console.log('    📷 ' + SHOTS + '/bag3_' + n + '.png'); };
      const closeAll = async () => { for (let i = 0; i < 5 && await pk(); i++) { await ev(() => { const x = document.querySelector('.twn-p .twn-x'); if (x) x.click(); }); await W8(200); } };
      const tp = async (x, z) => { await ev(([x9, z9]) => { SD2.map.player.teleport([x9, SD2.map.q.groundAt(x9, z9, SM_TOWN.ground(x9, z9) + 3) + 0.05, z9]); }, [x, z]); await W8(500); };
      const open = async t => { await closeAll(); await ev(t9 => SM_TOWN.bagOpen(t9), t || null); await W8(450); };
      // ⑫ 옛 저장(칸 없음): 가진 것 = 모두 본 것
      console.log('⑫ 옛 저장');
      const old = await ev(() => { const G = SM_TOWN.game(); G.S.bag['🍓'] = 2; delete G.S.bag3; const B3 = SM_TOWN.bag3(), st = B3.state(), ids = B3.ids(); return { all: ids.every(id => st.seen[id]), n: ids.length, v: st.v }; });
      ok(old.v === 1 && old.all && old.n > 0, '칸이 없던 저장 = 새 칸을 만들며 가진 것 ' + old.n + '개를 모두 본 것으로(점 홍수 X)');
      // 씨앗: 바다·들 어딘가에서 얻은 것처럼 · 보상 · 도구
      const spot = await ev(() => { const w = SM_TOWN.bag2().wk('cabbage') || SM_TOWN.bag2().wk('potato') || SM_TOWN.bag2().wk('strawberry'); return w ? [w.x + 6, w.z + 6] : null; });
      if (spot) await tp(spot[0], spot[1]);
      const seedAt = await ev(([S9, R9]) => { const q = SD2.map.player.pos(), at = [q.x, q.z]; const G = SM_TOWN.game(); G.rwOff(true); for (const [e, n] of S9) G.add(e, n, 'zz:bag3'); G.rwOff(false); const R = SM_TOWN.rwd; for (const [k, l] of R9) R.take(k, l); R.take('look', 5, 0); const T = SM_TOWN.tools; if (T) { T.own('rod'); T.own('lens'); T.own('broom'); } return at; }, [SEED, RWDS]);
      // ① 탭 넷
      console.log('① 탭 넷');
      await open(); const t1 = await ev(() => { const P = document.querySelector('.twn-p'), tabs = [...P.querySelectorAll('.b3-t')].map(b => b.textContent.trim()), nb = P.querySelector('.nb-tabs'); return { k: P.dataset.k, tabs, nbHasB3: !!(nb && nb.querySelector('.b3-t')), nbLabel: nb ? (nb.querySelector('.b3-nbl') || {}).textContent || '' : '', sepRow: !!(nb && P.querySelector('.b3-tabs') && !nb.contains(P.querySelector('.b3-tabs'))), w: Math.round(P.querySelector('.bx').getBoundingClientRect().width), h: Math.round(P.querySelector('.bx').getBoundingClientRect().height), sw: P.querySelector('.bx').scrollWidth - P.querySelector('.bx').clientWidth }; });
      ok(t1.k === 'I' && t1.tabs.length === 4 && /물건/.test(t1.tabs[0]) && /도구/.test(t1.tabs[1]) && /옷/.test(t1.tabs[2]) && /모은/.test(t1.tabs[3]), '갈래 탭 넷: ' + t1.tabs.join(' | '));
      ok(t1.sepRow && !t1.nbHasB3 && /수첩/.test(t1.nbLabel), '수첩 탭 줄(「📒 수첩」)과 가방 갈래 줄이 따로');
      ok(t1.sw <= 1 && t1.h <= 768 * 0.9 + 2, '창 ' + t1.w + '×' + t1.h + ' · 가로 넘침 없음');
      await shot('desk_item');
      // ② 모든 물건이 한 갈래에만
      console.log('② 한 갈래에만');
      const t2 = await ev(() => { const B3 = SM_TOWN.bag3(), ids = B3.ids(), P = document.querySelector('.twn-p'), C = {}, where = {}; for (const el of P.querySelectorAll('[data-pane] [data-b3]')) { const pane = el.closest('[data-pane]').dataset.pane; for (const id of el.dataset.b3.split(' ')) { C[id] = (C[id] || 0) + 1; where[id] = pane; } }
        const miss = ids.filter(id => !C[id]), dup = Object.keys(C).filter(id => C[id] > 1), extra = Object.keys(C).filter(id => !ids.includes(id)), wrong = ids.filter(id => C[id] && where[id] !== B3.tabOf(id)); const per = {}; for (const id of ids) per[where[id]] = (per[where[id]] || 0) + 1; return { n: ids.length, miss, dup, extra, wrong, per, toy: where['🧸'], st: where['⛰'], hat: where['h:straw'], gl: where['gloves'], rod2: C['rod2'] ? where['rod2'] : '' }; });
      ok(t2.n >= 30 && !t2.miss.length && !t2.dup.length, '가진 것 ' + t2.n + '개 = 화면에 각각 한 번(빠짐 ' + t2.miss.join('') + ' · 두 번 ' + t2.dup.join('') + ')');
      ok(!t2.extra.length && !t2.wrong.length, '화면에만 있는 것 X · 갈래가 표와 같음(' + JSON.stringify(t2.per) + ')');
      ok(t2.toy === 'wear' && t2.st === 'col' && t2.hat === 'wear' && t2.gl === 'tool' && t2.rod2 === 'tool', '산 곰 인형(예전엔 안 보임) = 👕 · 도장 = 🏅 · 모자 = 👕 · 목장갑 = 🧰 · 튼튼한 낚싯대 = 낚싯대 카드 안');
      // ③ 네모 칸
      console.log('③ 네모 칸');
      const t3 = await ev(() => { const g = document.querySelector('[data-grid="item"]'), C = [...g.querySelectorAll('.b3s')], R = C.map(c => c.getBoundingClientRect()), full = C.filter(c => !c.classList.contains('e')), em = C.length - full.length, cols = getComputedStyle(g).gridTemplateColumns.split(' ').length;
        const cnt = full.map(c => { const i = c.querySelector('i'), r = c.getBoundingClientRect(), q = i ? i.getBoundingClientRect() : null; return q ? [r.right - q.right, r.bottom - q.bottom, i.textContent] : null; }).filter(Boolean); return { n: C.length, full: full.length, em, cols, same: R.every(r => Math.abs(r.width - R[0].width) < 0.6 && Math.abs(r.height - R[0].height) < 0.6), w: Math.round(R[0].width), h: Math.round(R[0].height), cnt: cnt.slice(0, 3), br: cnt.every(q => q[0] >= 0 && q[0] < 10 && q[1] >= 0 && q[1] < 8 && /^×\d+$/.test(q[2])), rows: C.length % cols === 0 }; });
      ok(t3.same && t3.w >= 60 && t3.w === t3.h, '칸 ' + t3.n + '개 모두 같은 크기 ' + t3.w + '×' + t3.h);
      ok(t3.em > 0 && t3.rows, '빈 칸 ' + t3.em + '개(줄 끝까지 · ' + t3.cols + '칸 줄)'); ok(t3.br, '개수 = 칸 오른쪽 아래 작게(' + t3.cnt.map(q => q[2]).join(' ') + ')');
      // ⑦ 꼬리표 · ④ 크게 보기 카드
      console.log('⑦ 꼬리표 · ④ 크게 보기');
      const t7 = await ev(() => { const st = SM_TOWN.bag3().state(); return { o: st.o['🥬'] || null }; }); t7.me = seedAt;
      ok(t7.o && Math.hypot(t7.o[0] - t7.me[0], t7.o[1] - t7.me[1]) < 3 && t7.o[2] === (await ev(() => SM_TOWN.game().S.day)), '얻을 때 꼬리표 저장 [x, z, 날, 차례] = ' + JSON.stringify(t7.o));
      const c1 = await ev(() => { document.querySelector('.twn-p [data-b3s="🥬"]').click(); const C = document.querySelector('.b3-card'), f = C.querySelector('.b3-from'); return { big: (C.querySelector('.b3-big') || {}).textContent, nm: (C.querySelector('.b3-nm') || {}).textContent, from: f ? f.textContent : '', use: !!C.querySelector('.bg-use'), sel: !!document.querySelector('.b3s.sel[data-b3s="🥬"]') }; });
      ok(c1.big === '🥬' && c1.nm === '배추' && c1.sel, '칸 누름 = 크게 보기(' + c1.big + ' ' + c1.nm + ') · 고른 칸 표시');
      ok(/일째/.test(c1.from), '꼬리표 「' + c1.from + '」');
      const sn = await ev(() => { document.querySelector('.twn-p .b3-from').click(); const cv = document.querySelector('.b3-snip'); if (!cv || cv.style.display === 'none') return null; const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let n = 0; for (let i = 3; i < d.length; i += 16) if (d[i] > 0) n++; return n; });
      ok(sn > 1000, '꼬리표 누름 = 카드 안 지도 조각(그린 칸 ' + sn + ')'); await shot('desk_card');
      const mv = await ev(() => { const G = SM_TOWN.game(), o0 = JSON.stringify(SM_TOWN.bag3().state().o['🥬']); G.take('🥬', 1); G.add('🥬', 1, 'mv:deco'); return o0 === JSON.stringify(SM_TOWN.bag3().state().o['🥬']); });
      ok(mv, '되돌림(mv:deco)은 꼬리표를 안 바꿈');
      // ④ 먹기(카드 단추 = 예전 eatDish와 같은 결과)
      const e0 = await ev(() => ({ n: SM_TOWN.game().S.bag['🍙'] | 0, ate: SM_TOWN.game().S.ate['🍙'] | 0 }));
      await open('item'); const hasEat = await ev(() => { document.querySelector('.twn-p [data-b3s="🍙"]').click(); const C = document.querySelector('.b3-card'); return { eat: !!C.querySelector('[data-eat="🍙"]'), share: !!C.querySelector('[data-share="🍙"]') }; });
      ok(hasEat.eat && hasEat.share, '요리 카드 = 😋 먹기 + 🍽 나눠 주기 단추');
      await ev(() => document.querySelector('.b3-card [data-eat="🍙"]').click()); await W8(500);
      const e1 = await ev(() => ({ n: SM_TOWN.game().S.bag['🍙'] | 0, fx: SM_TOWN.bag2().state().fx, pk: !!document.querySelector('.twn-p') }));
      ok(e1.n === e0.n - 1 && e1.fx.x === 1 && e1.fx.e === '🍙' && !e1.pk, '먹기 = 가방 −1 · 숨 한 칸 더 · 창 닫힘(예전 eatDish와 같음)');
      // ⑤ 인형 + 장비 칸
      console.log('⑤ 인형');
      await open('wear'); const d0 = await ev(() => { const cv = document.querySelector('.b3-cv'), d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let n = 0, hsh = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200) { n++; hsh = (hsh * 31 + d[i] + d[i + 1] * 7 + d[i + 2] * 13) | 0; } const D = SM_TOWN.bag3().doll(); return { n, hsh, ok: D.ok, cnt: D.n, ms: D.ms, head: document.querySelector('[data-b3eq="head"] i').textContent }; });
      ok(RENDER ? d0.ok && d0.n > 8000 : d0.n > 3000, (RENDER ? '인형 = 진짜 내 캐릭터를 한 번 그림' : '인형(그리기 끔 = 평평한 그림)') + '(채운 화소 ' + d0.n + ' · ' + d0.ms + 'ms)');
      await ev(() => { const b = document.querySelector('.twn-p [data-rww="hat:straw"]') || document.querySelector('.twn-p [data-rww^="hat:"]:not([data-rww="hat:-"])'); if (b) b.click(); }); await W8(500);
      const d1 = await ev(() => { const cv = document.querySelector('.b3-cv'), d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let n = 0, hsh = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200) { n++; hsh = (hsh * 31 + d[i] + d[i + 1] * 7 + d[i + 2] * 13) | 0; } const D = SM_TOWN.bag3().doll(); return { n, hsh, cnt: D.n, head: document.querySelector('[data-b3eq="head"] i').textContent, hat: SM_TOWN.rwd.hat(), tab: SM_TOWN.bag3().ui().tab }; });
      ok(d1.hat && d1.head !== d0.head && d1.hsh !== d0.hsh && (!RENDER || d1.cnt === d0.cnt + 1), '모자를 쓰면 = 머리 칸 ' + d0.head + ' → ' + d1.head + ' · 인형 다시 그림' + (RENDER ? '(1번 더)' : ''));
      ok(d1.tab === 'wear', '입은 뒤에도 👕 탭 그대로'); await shot('desk_wear');
      if (RENDER) { const d2 = await ev(() => { SM_TOWN.bagOpen('wear'); return SM_TOWN.bag3().doll().n; }); ok(d2 === d1.cnt, '같은 모습으로 다시 열면 = 캐시 그림(새로 그리지 않음)'); }
      const eqc = await ev(() => { document.querySelector('[data-b3eq="foot"]').click(); return SM_TOWN.bag3().ui().tab; }); ok(eqc === 'tool', '발 칸 누름 = 🧰 탭(장화)');
      const fx = await ev(() => [...document.querySelectorAll('.b3-fx li')].map(l => l.textContent)); ok(fx.some(t => /35%/.test(t)) && fx.some(t => /1\.5배/.test(t)), '지금 켜진 효과: ' + fx.join(' / '));
      // ⑥ 도구 띠
      console.log('⑥ 도구 띠');
      await open('tool'); await shot('desk_tool');
      const o0 = await ev(() => SM_TOWN.tools.order()); const rr = await ev(() => { const a = document.querySelector('[data-b3drag="rod"]').getBoundingClientRect(), b = document.querySelector('[data-b3belt="0"]').getBoundingClientRect(); return [a.left + 30, a.top + a.height / 2, b.left + b.width / 2, b.top + b.height / 2]; });
      await p.mouse.move(rr[0], rr[1]); await p.mouse.down(); await p.mouse.move(rr[0] + 20, rr[1] + 10, { steps: 3 }); await p.mouse.move(rr[2], rr[3], { steps: 8 }); await p.mouse.up(); await W8(500);
      const o1 = await ev(() => SM_TOWN.tools.order()); ok(o1[0] === 'rod' && o1[2] === o0[0], '마우스로 🎣 카드를 1번 칸에 끌어 놓음 → 띠 ' + o1.map(k => k).join(','));
      await ev(() => { document.querySelector('.twn-p [data-b3a="put"][data-k="lens"]').click(); }); await W8(150); const pk1 = await ev(() => !!document.querySelector('.b3-beltw.pick')); await ev(() => document.querySelector('[data-b3belt="5"]').click()); await W8(500);
      const o2 = await ev(() => SM_TOWN.tools.order()); ok(pk1 && o2[5] === 'lens', '누르고 고르기(「띠에 놓기」 → 6번 칸) → ' + o2.join(','));
      await ev(() => { document.querySelector('.twn-p [data-b3a="put"][data-k="broom"]').click(); }); await W8(150); await p.keyboard.press('Digit2'); await W8(500);
      const o3 = await ev(() => SM_TOWN.tools.order()); ok(o3[1] === 'broom', '「띠에 놓기」 뒤 숫자 키 2 → ' + o3.join(','));
      await closeAll(); await W8(300); await p.keyboard.press('Digit1'); await W8(400); const held = await ev(() => SM_TOWN.tools.info().cur); ok(held === 'rod', '가방을 닫고 숫자 1 = 새 차례 1번(' + held + ')');
      const bar = await ev(() => [...document.querySelectorAll('.twn-tools button')].map(b => b.dataset.t).join(',')); ok(bar.startsWith('rod,broom'), '화면 아래 도구 띠도 같은 차례(' + bar + ')');
      await ev(() => { SM_TOWN.tools.hold(null); }); await ev(o => { for (let j = 0; j < o.length; j++) SM_TOWN.tools.place(o[j], j); }, o0);
      // ⑧ 새 점
      console.log('⑧ 새 점');
      await ev(() => { SM_TOWN.game().rwOff(true); SM_TOWN.game().add('🐟', 1, 'zz:bag3'); SM_TOWN.game().rwOff(false); SM_TOWN.rwd.take('farm', 8); });
      await open('col'); await shot('desk_col'); const n1 = await ev(() => ({ item: !!document.querySelector('[data-b3t="item"] .b3-dot'), wear: !!document.querySelector('[data-b3t="wear"] .b3-dot'), col: !!document.querySelector('[data-b3t="col"] .b3-dot') }));
      ok(n1.item && n1.wear && !n1.col, '새것이 있는 탭에 빨간 점(🎒 물건 · 👕 옷) · 보고 있는 탭은 X');
      await ev(() => document.querySelector('[data-b3t="item"]').click()); await W8(200); const n2 = await ev(() => ({ tab: !!document.querySelector('[data-b3t="item"] .b3-dot'), cell: !!document.querySelector('[data-b3s="🐟"] .b3-dot') }));
      ok(!n2.tab && n2.cell, '🎒 탭을 열면 탭 점은 사라지고 새 물고기 칸 점은 이번 창에선 보임');
      await open(); const n3 = await ev(() => ({ cell: !!document.querySelector('[data-b3s="🐟"] .b3-dot'), seen: SM_TOWN.bag3().seen('🐟') })); ok(!n3.cell && n3.seen, '다시 열면 = 한 번 본 점은 사라짐');
      await ev(() => { const G = SM_TOWN.game(); G.S.bag['🥚'] = 0; delete G.S.bag['🥚']; G.add('🥚', 1, 'zz:bag3'); }); await open('item'); ok(await ev(() => !!document.querySelector('[data-b3s="🥚"] .b3-dot')), '다 쓴 것을 다시 얻으면 = 다시 새 점');
      // ⑨ 정렬 · 거르기
      console.log('⑨ 정렬·거르기');
      await open('item'); const first = () => ev(() => (document.querySelector('[data-grid="item"] .b3s:not(.e)') || {}).dataset.b3s);
      await ev(() => document.querySelector('[data-b3o="val"]').click()); await W8(150); const v1 = await first(); const vmax = await ev(() => { const B = SM_TOWN.game().S.bag, I = []; for (const e of [...document.querySelectorAll('[data-grid="item"] .b3s:not(.e)')].map(c => c.dataset.b3s)) I.push(e); return I[0]; });
      await ev(() => document.querySelector('[data-b3o="new"]').click()); await W8(150); const n9 = await first();
      await ev(() => document.querySelector('[data-b3o="kind"]').click()); await W8(150); const k9 = await first();
      ok(v1 === '🍯' && n9 === '🥚' && /🍲|🍙/.test(k9 || ''), '정렬: 값 = ' + v1 + '(꿀 500원) · 얻은 순 = ' + n9 + '(방금) · 종류 = ' + k9 + '(요리 먼저)'); void vmax;
      await ev(() => document.querySelector('[data-b3f="dish"]').click()); await W8(150); const fl = await ev(() => [...document.querySelectorAll('[data-grid="item"] .b3s:not(.e)')].map(c => c.dataset.b3s).join(''));
      ok(/^(🍲|🍙)+$/u.test(fl), '거르기 🍳 요리 = ' + fl); await ev(() => document.querySelector('[data-b3f="all"]').click());
      const pref = await ev(() => JSON.parse(localStorage.getItem('sm-bag3-ui') || '{}')); ok(pref.sort === 'kind' && pref.flt === 'all', '정렬·거르기·탭 = 이 기기에 기억(' + JSON.stringify(pref) + ')');
      // ⑩ 키보드
      console.log('⑩ 키보드');
      await closeAll(); await W8(200); await p.keyboard.press('KeyI'); await W8(450); const k1 = await pk(); const tb0 = await ev(() => SM_TOWN.bag3().ui().tab);
      await p.keyboard.press('ArrowRight'); await W8(150); const tb1 = await ev(() => SM_TOWN.bag3().ui().tab); await p.keyboard.press('ArrowLeft'); await p.keyboard.press('ArrowLeft'); await W8(150); const tb2 = await ev(() => SM_TOWN.bag3().ui().tab);
      await p.keyboard.press('Escape'); await W8(300); const k2 = await pk();
      ok(k1 === 'I' && tb1 !== tb0 && tb2 !== tb1 && !k2, 'I = 열기 · → ' + tb0 + '→' + tb1 + ' · ←← → ' + tb2 + ' · Esc = 닫기');
      await p.keyboard.press('KeyI'); await W8(400); await p.keyboard.press('KeyI'); await W8(300); ok(!(await pk()), 'I 한 번 더 = 닫기');
      // ④ 선물(곁의 일꾼) · 팔기(장터 상인)
      console.log('④ 선물·팔기');
      const wk = await ev(() => { for (const k of ['cabbage', 'potato', 'strawberry', 'pear', 'paddy', 'pasture', 'lumber', 'beehive']) { const w = SM_TOWN.bag2().wk(k); if (w) return { k, ...w }; } return null; });
      if (wk) { await tp(wk.x + 1.3, wk.z + 0.8); await W8(800); await open(); const g0 = await ev(() => ({ tab: SM_TOWN.bag3().ui().tab, row: [...document.querySelectorAll('.b3-giftr [data-gift]')].map(b => b.dataset.gift).join(''), n: SM_TOWN.game().S.bag['🍓'] | 0 }));
        ok(g0.tab === 'item' && g0.row.length > 0, '일꾼 곁에서 열면 = 🎒 탭 + 🎁 줄(' + g0.row + ')'); await shot('desk_gift');
        const gift = g0.row.includes('🍓') ? '🍓' : [...g0.row][0]; const h0 = await ev(() => JSON.stringify(SM_TOWN.game().S.hearts || {}));
        await ev(e => document.querySelector('.b3-giftr [data-gift="' + e + '"]').click(), gift); await W8(700);
        const g1 = await ev(e => ({ n: SM_TOWN.game().S.bag[e] | 0, h: JSON.stringify(SM_TOWN.game().S.hearts || {}) }), gift);
        ok(g1.h !== h0, '🎁 줄 누름 = 선물(마음이 오름 · 예전 giveGift와 같은 길)'); } else ok(false, '선물 시험할 일꾼이 없음');
      const stl = await ev(() => (SM_TOWN.stallsAt() || [])[0] || null);
      if (stl) { await tp(stl.x + 1.6, stl.z + 0.6); await W8(700); await open('item'); const s0 = await ev(() => { const c = document.querySelector('[data-b3s="🥔"]'); if (!c) return null; c.click(); return !!document.querySelector('.b3-card [data-b3a="sell"]'); });
        ok(s0 === true, '장터 상인 곁 = 감자 카드에 🛒 팔기'); await ev(() => { const b = document.querySelector('.b3-card [data-b3a="sell"]'); if (b) b.click(); }); await W8(500); const sk = await pk(); const st = await ev(() => (document.querySelector('.twn-p h3') || {}).textContent || '');
        ok(sk && sk !== 'I' && /🛒/.test(st), '🛒 팔기 = 장터 창으로(' + st.slice(0, 20) + ')'); } else console.log('  (장터 상인 없음 — 건너뜀)');
      // ⑪ 이야기 '주기' 단계
      console.log('⑪ 이야기 주기 단계');
      await closeAll(); await ev(() => { localStorage.setItem('sm-bag3-ui', JSON.stringify({ tab: 'wear', flt: 'all', sort: 'kind' })); }); await ev(() => SM_TOWN.bagOpen()); await W8(300); await ev(() => document.querySelector('[data-b3t="wear"]').click()); await closeAll();
      const gs = await ev(() => { const L9 = SM_TOWN.storySteps('give') || [], ty = () => { const s9 = SM_TOWN.story(), st = s9 && s9.step; return st && st.do ? st.do.type : st && st.type; }; for (const [c, i] of L9) if (SM_TOWN.storyAt(c, i) && ty() === 'give') return [c, i]; return null; }); await W8(800); await closeAll();
      if (gs) { await ev(() => SM_TOWN.bagOpen()); await W8(400); const g2 = await ev(() => { const P = document.querySelector('.twn-p'); return { tab: SM_TOWN.bag3().ui().tab, coach: /곁의 일꾼|일꾼 바로 곁|사고팔기만/.test(P.innerText) }; });
        ok(g2.tab === 'item' && g2.coach, '「주기」 단계(' + gs.join(':') + ') = 기억한 👕 대신 🎒 탭 + 코치 줄'); await closeAll(); await ev(() => SM_TOWN.storyOff && SM_TOWN.storyOff()); } else ok(false, '주기 단계를 못 엶');
      // 창 단추 44px(데스크톱은 34 이상) · 이모지 줄
      await open('item'); const sm = await ev(() => [...document.querySelectorAll('.twn-p button')].filter(e => e.offsetParent).map(e => { const r = e.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height), e.textContent.trim().slice(0, 8)]; }).filter(q => q[1] < 32)); ok(!sm.length, '데스크톱 단추 높이 32px 이상(' + JSON.stringify(sm.slice(0, 3)) + ')');
      ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.slice(0, 2).join(' | ') : ''));
      await ctx.close(); }
    // ───────────────── ⑬ 휴대폰 세로·가로 ─────────────────
    for (const [nm, dev] of [['port', devices['iPhone 13']], ['land', devices['iPhone 13 landscape']]]) {
      console.log('⑬ 휴대폰 ' + (nm === 'port' ? '세로' : '가로'));
      const ctx = await b.newContext({ ...dev }), { p, errs } = await boot(ctx), ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
      await ev(([S9, R9]) => { const G = SM_TOWN.game(); G.rwOff(true); for (const [e, n] of S9) G.add(e, n, 'zz:bag3'); G.rwOff(false); const R = SM_TOWN.rwd; for (const [k, l] of R9) R.take(k, l); }, [SEED, RWDS]);
      for (const t of ['item', 'tool', 'wear', 'col']) { await ev(t9 => { for (let i = 0; i < 4; i++) { const x = document.querySelector('.twn-p .twn-x'); if (x) x.click(); } SM_TOWN.bagOpen(t9); }, t); await W8(450);
        const r = await ev(() => { const P = document.querySelector('.twn-p'), bx = P.querySelector('.bx'), T = [...P.querySelectorAll('.b3-t')].map(b => Math.round(b.getBoundingClientRect().top)), small = [...P.querySelectorAll('button,.twn-x')].filter(e => e.offsetParent && getComputedStyle(e).visibility !== 'hidden').map(e => { const q = e.getBoundingClientRect(); return [Math.round(q.width), Math.round(q.height), (e.textContent || '✕').trim().slice(0, 8)]; }).filter(q => q[0] < 44 || q[1] < 44);
          const cell = P.querySelector('.b3-pane:not([style*="none"]) .b3s'), cv = P.querySelector('.b3-cv').getBoundingClientRect(); return { over: bx.scrollWidth - bx.clientWidth, row1: T.every(t => t === T[0]), small, cell: cell ? Math.round(cell.getBoundingClientRect().width) : 0, doll: [Math.round(cv.width), Math.round(cv.height)], vw: innerWidth }; });
        ok(r.over <= 1 && r.row1 && !r.small.length, nm + ' ' + t + ': 가로 넘침 ' + r.over + ' · 탭 한 줄 · 작은 단추 ' + r.small.length + (r.small.length ? ' ' + JSON.stringify(r.small.slice(0, 3)) : '') + ' · 칸 ' + r.cell + 'px · 인형 ' + r.doll.join('×'));
        if (SHOTS && (t === 'item' || t === 'tool')) { await W8(250); await p.screenshot({ path: SHOTS + '/bag3_' + nm + '_' + t + '.png' }); console.log('    📷 ' + SHOTS + '/bag3_' + nm + '_' + t + '.png'); } }
      const tap = await ev(() => { const c = document.querySelector('[data-b3s]'); if (!c) return null; SM_TOWN.bagOpen('item'); const c2 = document.querySelector('[data-pane="item"] [data-b3s]'); c2.click(); const C = document.querySelector('.b3-card'); return !!C.querySelector('.b3-big'); });
      ok(tap, nm + ' 칸 누름 = 크게 보기 카드(격자 밑)'); if (SHOTS) { await W8(500); await p.screenshot({ path: SHOTS + '/bag3_' + nm + '_card.png' }); console.log('    📷 ' + SHOTS + '/bag3_' + nm + '_card.png'); }
      ok(!errs.length, nm + ' 페이지 오류 0' + (errs.length ? ' — ' + errs.slice(0, 2).join(' | ') : ''));
      await ctx.close(); }
  } finally { await b.close(); }
  console.log(fails.length ? '✗ ' + fails.length + '개 실패' : '✓ 모두 통과');
  process.exit(fails.length ? 1 : 0);
})();
