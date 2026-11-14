// PATH-1D(가) 처음 15분 길 — 남겨 둔 것 닫기(2차 평가 R2A·R2B에서 남긴 것 · 순간이동으로 그 자리만)
//   node tools/harness/town_path1d.cjs ourtown 8871 [--only=g,d,p,e,s,a,f,t,c,x] [--shots=폴더]
//   g 도서관 남쪽 집 앞 얕은 마당 띠 — 옆 담 토막에 안 갇히고 지나감(1 가)
//   d 6초 넘게 같은 곳에서 밀고만 있으면 알림 한 줄 — 낮은 담 = 「Space로 뛰어넘기」 · 막다른 곳(학교 유치원 놀이터 북쪽 띠) = 「온 길로 · 바로 가기」(1 다)
//   p 저절로 뜬 창은 뜬 직후(0.4초) 바깥 누름에 안 닫힘 · 그 뒤 바깥 누름·Esc는 그대로 · 아이가 연 창(가방)은 바로 닫힘(2)
//   e 이웃 집 문 글 = 그날 그 집 부탁 이름(안에서 받는 부탁과 같음 · 날·아침·낮·저녁 칸이 바뀌면 다시 씀)(3)
//   s 꽃 무더기 하나(4 m 안)는 「1곳에 물 줌」 · 보물 상자에서 나온 것이 하루 마무리 「모은 것」에 보임 · 상자가 나오면 「삽으로」 귀띔이 내려감(4 · 10)
//   a 「놀이터 — 왔어요」는 놀이터가 보이는 자리에서만(안경점 문 앞 X · 도착 반지름 값은 그대로)(5)
//   f 소방서 안 소방관 앞에 서면 E = 「소방관에게 묻기」 → 장소 카드(6)
//   t 112 단계의 따라가는 중 줄 이름 = 할 일 줄과 같은 대상(우체국·도서관으로 안 바뀜)(7)
//   c 아침 엽서 카드가 오른쪽 칩들과 안 겹침(1366×768 · 칩을 다 켠 판)(9)
//   x 도구를 안 든 채 F = 「도구를 먼저 들어요」 · 물뿌리개는 등 뒤 2 m 안 꽃도 겨눔(10)
const { chromium, RENDER } = require('./pw.cjs');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const arg = k => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').slice(k.length + 3) || null;
const OUT = arg('shots'), ONLY = arg('only') ? arg('only').split(',') : null, URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0';
const fs = require('fs'); if (OUT) fs.mkdirSync(OUT, { recursive: true });
let fails = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
const want = k => !ONLY || ONLY.includes(k);
const HK = { tidy: '정리 돕기', cook: '부엌 거들기', water: '화분 물 주기', fix: '고장 난 것 고치기', table: '상 차리기', job: '이웃 일 돕기', find: '물건 찾기', bday: '생일 준비', move: '이삿짐 나누기', guest: '손님상 차리기' };

(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  const errs = [];
  const fresh = async q9 => { const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } }), p = await ctx.newPage();
    p.on('pageerror', e => errs.push(e.message.slice(0, 240))); p.on('console', m => { if (m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(m.text())) errs.push(m.text().slice(0, 240)); });
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms), shot = async n => { if (!OUT || !RENDER) return; await p.screenshot({ path: OUT + '/' + n + '.jpg', type: 'jpeg', quality: 72 }); console.log('    📷 ' + OUT + '/' + n + '.jpg'); };
    await p.goto(URL + (q9 || '')); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.story && SM_TOWN.emerg && SM_TOWN.emerg(), null, { timeout: 240000 }); await W8(1500);
    const tp = (x, z, lx, lz) => ev(([x, z, lx, lz]) => { const M = SD2.map; M.player.teleport([x, M.q.groundAt(x, z, SM_TOWN.ground(x, z) + 2) + 0.05, z]); if (lx != null) M.player.lookAt([lx, lz]); }, [x, z, lx, lz]);
    /* 낮은 담 곁(담 윗면이 땅 + 1.0 — 위 2 m에서 물으면 담 위에 섬): 땅 + 0.6에서 물음 */
    const tpLow = (x, z, lx, lz) => ev(([x, z, lx, lz]) => { const M = SD2.map; M.player.teleport([x, M.q.groundAt(x, z, SM_TOWN.ground(x, z) + 0.6) + 0.05, z]); if (lx != null) M.player.lookAt([lx, lz]); }, [x, z, lx, lz]);
    const closeDlg = async () => { for (let i = 0; i < 16 && await ev(() => !!document.querySelector('.twn-dlg')); i++) { await p.keyboard.press('KeyE'); await W8(350); } };
    const shut = async () => { for (let i = 0; i < 5; i++) { const n = await ev(() => { if (document.querySelector('.twn-dlg')) return 'dlg'; const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) { b9.click(); return 'x'; } return document.querySelector('.twn-p') ? 'p' : ''; }); if (!n) return; if (n === 'dlg') await closeDlg(); if (n === 'p') await p.keyboard.press('Escape'); await W8(300); } };
    const start = async () => { await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); await W8(2200); };
    const goal = () => ev(() => { const g = document.getElementById('hudGoal'); return g && g.style.display !== 'none' ? (g.textContent || '') : ''; });
    const me = () => ev(() => { const q = SD2.map.player.pos(); return [q.x, q.z]; });
    const toastT = () => ev(() => { const e = document.getElementById('toast'); return e && e.style.display !== 'none' ? (e.textContent || '') : ''; });
    const see = async (ms, re) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { await W8(350); const t = await toastT(); if (re.test(t)) return t; } return ''; };
    const quiet = () => ev(() => { const G = SM_TOWN.game(); if (SM_TOWN.storyOff) SM_TOWN.storyOff(); if (G.setClock) G.setClock(false); G.S.min = 11 * 60; });   /* 이야기·시계를 멈춤(걷는 동안 창이 안 뜨게) */
    return { ctx, p, ev, W8, shot, tp, tpLow, closeDlg, shut, start, goal, me, toastT, see, quiet }; };
  const open112 = async T => { await T.ev(() => SM_TOWN.storyAt('a1_1', 2)); await T.W8(1500); await T.shut(); let E = null; for (let i = 0; i < 40 && !E; i++) { E = await T.ev(() => SM_TOWN.emerg().info().ev); if (!E) await T.W8(500); } await T.shut(); await T.W8(600); return E; };

  try {
    // ───────── g 얕은 앞마당 띠(1 가) ─────────
    if (want('g')) { console.log('g 도서관 남쪽 집 앞 띠 — 옆 담 토막에 안 갇히고 남쪽으로 지나감(R2A #12 · 사진 049 ~ 072)');
      const T = await fresh(), { ev, W8, p } = T; await T.start(); await T.shut(); await T.quiet(); await T.shut();
      await T.tpLow(-113.2, 112, -113.2, 200); await W8(900); await T.shot('g1_strip');
      await p.keyboard.down('KeyW'); await W8(14000); await p.keyboard.up('KeyW'); await W8(300);
      const q = await T.me(), N = await ev(() => SM_TOWN.ntf().map(o => o.t || '').join(' | '));
      ok(q[1] > 156, '집 문 앞 띠 (-113.2, 112)에서 남쪽으로 14초 걸음 → z ' + q[1].toFixed(1) + ' (옆 담 자리 z 122.9 · 138.2 · 153.2를 다 지남)');
      ok(!/낮은 담|막혀 있어요/.test(N), '지나가는 동안 「갇힘」 알림이 안 뜸'); await T.shot('g2_after');
      await T.ctx.close(); }

    // ───────── d 밀고만 있을 때 알림(1 다) ─────────
    if (want('d')) { console.log('d 6초 넘게 같은 곳에서 밀고만 있으면 할 일 줄 자리에 한 번(낮은 담 · 막다른 곳)');
      const T = await fresh(), { ev, W8, p } = T; await T.start(); await T.shut(); await T.quiet(); await T.shut();
      await T.tpLow(-113.4, 127, -100, 127); await W8(600);
      const t0 = await T.see(7500, /낮은 담|막혀 있어요/); ok(!t0, '담 앞에 가만히 서 있는 7초 동안은 알림 없음' + (t0 ? ' — 「' + t0 + '」' : ''));
      await p.keyboard.down('KeyW'); const t1 = await T.see(11000, /낮은 담/); const q1 = await T.me();
      ok(/Space/.test(t1), '낮은 담 (' + q1[0].toFixed(1) + ', ' + q1[1].toFixed(1) + ')에 대고 걷기만 → 「' + t1 + '」'); await T.shot('d1_low');
      await p.keyboard.press('Space'); await W8(1600); await p.keyboard.up('KeyW'); const q2 = await T.me();
      ok(q2[0] > q1[0] + 1.2, '알림대로 Space 한 번 → 담을 넘음(x ' + q1[0].toFixed(2) + ' → ' + q2[0].toFixed(2) + ')');
      await T.tpLow(-45, -0.05, -60, -0.05); await W8(600); await p.keyboard.down('KeyW'); const t2 = await T.see(13000, /막혀 있어요/); await p.keyboard.up('KeyW'); const q3 = await T.me();
      ok(/온 길로/.test(t2) && /바로 가기/.test(t2), '학교 유치원 놀이터 북쪽 막다른 띠 끝 (' + q3[0].toFixed(1) + ', ' + q3[1].toFixed(1) + ') → 「' + t2 + '」'); await T.shot('d2_dead');
      await W8(300); await p.keyboard.press('KeyJ'); await W8(900); const jp = await ev(() => { const P = document.querySelector('.twn-p'); return P ? (P.dataset.k || 'p') + ' · ' + ((P.querySelector('h3') || {}).textContent || '').slice(0, 24) : ''; });
      ok(!!jp, '알림에 적힌 J = 바로 가기 창이 열림(' + jp + ')'); await T.shot('d3_jump'); await T.shut();
      await T.ctx.close(); }

    // ───────── p 저절로 뜬 창(2) ─────────
    if (want('p')) { console.log('p 저절로 뜬 창은 뜬 직후 바깥 누름에 안 닫힘 · 아이가 연 창은 그대로');
      const T = await fresh(), { ev, W8, p } = T; await T.start(); await T.shut(); await T.quiet(); await T.shut(); await W8(900);
      const out = () => ev(() => { const P = document.querySelector('.twn-p'); if (!P) return null; for (const [x, y] of [[1320, 420], [1340, 740], [26, 740], [26, 420]]) if (document.elementFromPoint(x, y) === P) return [x, y]; return null; });
      const poke = () => ev(() => { const P = document.querySelector('.twn-p'); if (!P) return null; const au = P.dataset.au || '', k = P.dataset.k || ''; P.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 1320, clientY: 420 })); P.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 1320, clientY: 420 })); return { au, k, still: !!document.querySelector('.twn-p') }; });
      const click = async (x, y) => { await p.mouse.move(x, y, { steps: 4 }); await W8(80); await p.mouse.down(); await W8(60); await p.mouse.up(); await W8(700); };
      const r1 = await ev(() => { SM_TOWN.openDiary(); const P = document.querySelector('.twn-p'); if (!P) return null; const au = P.dataset.au || ''; P.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 1320, clientY: 420 })); P.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 1320, clientY: 420 })); return { au, k: P.dataset.k || '', still: !!document.querySelector('.twn-p') }; });
      ok(!!r1 && r1.au === '1' && r1.still, '조작 없이 뜬 창(' + (r1 ? r1.k : '없음') + ')을 뜨자마자 바깥에서 눌러도 그대로 떠 있음'); await T.shot('p1_keep');
      await W8(700); const o1 = await out(); if (o1) await click(o1[0], o1[1]); ok(!!o1 && !await ev(() => !!document.querySelector('.twn-p')), '0.7초 뒤 바깥을 누르면 그대로 닫힘' + (o1 ? ' (' + o1 + ')' : ' — 바깥 자리를 못 찾음'));
      await ev(() => { SM_TOWN.openDiary(); }); await W8(600); await p.keyboard.press('Escape'); await W8(500); ok(!await ev(() => !!document.querySelector('.twn-p')), '저절로 뜬 창도 Esc는 그대로 닫힘');
      await W8(500); await p.keyboard.press('KeyI'); await W8(60); const r2 = await poke(); await W8(200);
      ok(!!r2 && r2.au !== '1' && !r2.still, '아이가 I로 연 가방 창(' + (r2 ? r2.k : '안 열림') + ')은 뜨자마자 바깥을 눌러도 닫힘(예전 그대로)');
      await T.shut(); await T.ctx.close(); }

    // ───────── e 이웃 집 문 글(3) ─────────
    if (want('e')) { console.log('e 이웃 집 문 글 = 그날 그 집 부탁(안에서 받는 부탁과 같은 이름)');
      const T = await fresh(), { ev, W8, p } = T; await T.start(); await T.shut();
      await p.waitForFunction(() => SM_TOWN.indoor && SM_TOWN.ent, null, { timeout: 60000 });
      await ev(() => { const G = SM_TOWN.game().S; G.story = G.story || {}; G.story.done = Object.assign(G.story.done || {}, { p0: 1, a1_1: 1 }); G.min = 11 * 60 + 9; if (G.emerg) { G.emerg.d = G.day; G.emerg.plan = []; } }); await T.shut(); await W8(2200);   /* 아침 → 낮 칸: 시계 알림은 10분마다 — 11:10 알림에 문 글이 다시 써짐 */
      const enter = async i => { await ev(i => SM_TOWN.indoor.enterI(i), i); try { await p.waitForFunction(() => SM_TOWN.indoor.on && !SM_TOWN.indoor.busy, null, { timeout: 9000 }); } catch (e) { return false; } await W8(350); return true; };
      const leave = async () => { await T.shut(); if (await ev(() => !!SM_TOWN.indoor.on)) { await ev(() => SM_TOWN.indoor.exit()); for (let i = 0; i < 20; i++) { await W8(200); if (!await ev(() => SM_TOWN.indoor.on)) break; } } await W8(300); };
      const doorLab = nm => ev(nm => { const q = SD2.map.player.pos(), H = SD2.map.interact.list().filter(h => !h.off && /들어가기/.test(h.label || '') && Math.hypot(h.x - q.x, h.z - q.z) < 12).sort((a, b9) => Math.hypot(a.x - q.x, a.z - q.z) - Math.hypot(b9.x - q.x, b9.z - q.z)); const h = H.find(h => nm && h.label.includes(nm)) || H[0]; return h ? h.label : ''; }, nm);
      const homes = (await ev(() => SM_TOWN.indoor.census())).filter(q => q.cat === 'home' && q.in === 'ent' && !q.school); let same = 0, seen = 0, forced = 0, tried = 0, eve = null; const notes = [], WANT = ['water', 'cook', 'table'];
      for (const q of homes.slice(0, 12)) { if (tried >= 3) break; if (!await enter(q.i)) continue; const I0 = await ev(() => SM_TOWN.ent().info()); await leave(); if (!I0 || !I0.plan) continue; tried++;
        /* ① 오늘 그대로: 문 글 끝 = 안에서 받은 부탁 이름 */
        const l0 = await doorLab(I0.nm); seen++; if (l0.endsWith(' · ' + HK[I0.plan.kind])) same++; notes.push('「' + l0.slice(0, 44) + '」 ↔ 안 ' + I0.plan.kind);
        /* ② 다음 날 부탁을 정해 두면(화분·부엌·상) 곧(다음 시계 칸) 문 글이 그 이름으로 · 들어가면 그 부탁 */
        const k = WANT[(tried - 1) % WANT.length];
        await ev(([id, k]) => { const G = SM_TOWN.game().S; G.day += 1; G.min = 10 * 60 + 29; const s9 = SM_TOWN.ent().s(), r = s9.b[id] || (s9.b[id] = { n: 0, d: -1, t: 0 }); r.pk = k; r.pd = G.day; r.dd = -1; r.n = 0; r.lk = null; }, [I0.id, k]);
        let l1 = ''; for (let i = 0; i < 12; i++) { await W8(500); l1 = await doorLab(I0.nm); if (l1.endsWith(' · ' + HK[k])) break; }
        if (tried === 1) await T.shot('e1_door');
        const in1 = await enter(q.i), I1 = in1 ? await ev(() => SM_TOWN.ent().info()) : null; await leave();
        if (l1.endsWith(' · ' + HK[k]) && I1 && I1.plan && I1.plan.kind === k) forced++; else notes.push('✗ ' + k + ' → 문 「' + l1.slice(0, 44) + '」 · 안 ' + (I1 && I1.plan ? I1.plan.kind : '?'));
        /* ③ 첫 집만: 정해 둔 부탁 없이 저녁 칸(17시)을 넘기면 문 글도 저녁 부탁으로 · 들어가면 그 부탁 */
        if (tried === 1) { await ev(([id]) => { const G = SM_TOWN.game().S, r = SM_TOWN.ent().s().b[id]; G.day += 1; G.min = 16 * 60 + 57; if (r) { r.pd = -1; r.dd = -1; } }, [I0.id]); await W8(1200); const la = await doorLab(I0.nm); await W8(3600); const lb = await doorLab(I0.nm), m9 = await ev(() => SM_TOWN.game().S.min);
          const in2 = await enter(q.i), I2 = in2 ? await ev(() => SM_TOWN.ent().info()) : null; await leave(); eve = { la: la.replace(/^.* · /, ''), lb: lb.replace(/^.* · /, ''), min: m9, kind: I2 && I2.plan ? I2.plan.kind : '?' }; } }
      console.log('    ' + notes.join('\n    '));
      ok(seen >= 2 && same === seen, '문 글 끝 = 안에서 받는 부탁 이름 (' + same + ' / ' + seen + '집)');
      ok(tried >= 2 && forced === tried, '부탁이 바뀌면 곧 문 글도 그 이름 · 들어가면 그 부탁 (' + forced + ' / ' + tried + '집 · ' + WANT.slice(0, tried).map(k => HK[k]).join(' · ') + ')');
      ok(!!eve && eve.min >= 17 * 60 && eve.lb === HK[eve.kind], '저녁 칸(17시)을 넘기면 문 글이 저녁 부탁으로(' + (eve ? '16:58 「' + eve.la + '」 → ' + Math.floor(eve.min / 60) + ':' + String(eve.min % 60).padStart(2, '0') + ' 「' + eve.lb + '」 · 안 ' + eve.kind : '안 됨') + ')');
      await T.ctx.close(); }

    // ───────── s 하루 마무리 셈(4) + 삽 귀띔(10) ─────────
    if (want('s')) { console.log('s 하루 마무리 — 꽃 무더기 하나 = 한 곳 · 보물 상자에서 나온 것이 「모은 것」에');
      const T = await fresh(), { ev, W8, p } = T; await T.start(); await T.shut();
      await ev(() => SM_TOWN.storyAt('p0', 2)); await W8(1500); await T.closeDlg();
      const T0 = await ev(() => SM_TOWN.storyTarget());
      if (!T0) ok(false, '물 줄 꽃 목표가 없음');
      else { const cp = await T.me(), dx = cp[0] - T0.x, dz = cp[1] - T0.z, l = Math.hypot(dx, dz) || 1; await T.tp(T0.x + dx / l * 2.6, T0.z + dz / l * 2.6, T0.x, T0.z); await W8(1500);
        const pour = async () => { await ev(([x, z]) => { SD2.map.player.lookAt([x, z]); SM_TOWN.tools.aim(x, z); }, [T0.x, T0.z]); await W8(200); await p.keyboard.down('KeyF'); await W8(2300); await p.keyboard.up('KeyF'); await ev(() => SM_TOWN.tools.aim(null)); await W8(600); };
        const cnt = () => ev(() => { const S = SM_TOWN.game().S; return { fw: (S.today || {}).flowW | 0, bl: Object.keys((S.tools || {}).bloom || {}).filter(k => S.tools.bloom[k].w === S.day).length }; });
        await p.keyboard.press('Digit1'); await W8(400); await pour(); const c1 = await cnt();
        ok(c1.fw === 1 && c1.bl >= 1, '꽃에 물 → 오늘 물 준 곳 ' + c1.fw + ' (물 준 꽃 ' + c1.bl + '송이)');
        /* 곁의 꽃(1.5 m)에 방금 물이 간 것으로 두고 같은 꽃에 다시: 꽃은 +1 · '곳'은 그대로 */
        await ev(([x, z]) => { const S = SM_TOWN.game().S, B = S.tools.bloom; for (const k in B) if (Math.hypot(B[k].x - x, B[k].z - z) < 0.6) delete B[k]; B.zz9 = { x: x + 1.5, y: 0, z, c: 1, w: S.day }; SM_TOWN.tools.fill(); }, [T0.x, T0.z]);
        await pour(); const c2 = await cnt(); ok(c2.fw === 1 && c2.bl >= 2, '곁의 꽃(1.5 m)까지 물이 가도 「곳」은 1 그대로 (곳 ' + c2.fw + ' · 꽃 ' + c2.bl + '송이)');
        /* 멀리(9 m) 다른 꽃 무더기에 준 것이면 한 곳 더 */
        await ev(([x, z]) => { const S = SM_TOWN.game().S, B = S.tools.bloom; for (const k in B) if (k === 'zz9' || Math.hypot(B[k].x - x, B[k].z - z) < 6) delete B[k]; B.zz8 = { x: x + 9, y: 0, z, c: 1, w: S.day }; SM_TOWN.tools.fill(); }, [T0.x, T0.z]);
        await pour(); const c3 = await cnt(); ok(c3.fw === 2, '다른 꽃 무더기(9 m 밖)에 준 뒤 이 무더기에 주면 한 곳 더(곳 ' + c3.fw + ')');
        await ev(() => { const S = SM_TOWN.game().S; delete S.tools.bloom.zz8; S.today.flowW = 1; }); }
      /* 보물 상자 → 그날 「모은 것」 */
      await T.shut(); await ev(() => { const G = SM_TOWN.game(); if (G.setClock) G.setClock(false); G.S.min = 11 * 60; SM_TOWN.storyAt('p0', 1); }); await W8(1500); await T.shut();
      const g0 = await ev(() => Object.keys((SM_TOWN.game().S.today || {}).got || {}).length);
      const g = await ev(() => { const TR = SM_TOWN.treasure(), sp = TR && TR.spots()[0]; if (!sp) return null; const r = TR.give(sp.k), c9 = TR.info().cur; return { r, k: sp.k, x: c9 && c9.x, z: c9 && c9.z }; }); await W8(400);
      if (g && g.x != null) { await T.tp(g.x + 0.8, g.z + 0.6, g.x, g.z); await W8(1200); }
      await ev(() => { const e = document.getElementById('toast'); if (e) { e.textContent = '⛏ 삽으로 파 봐요(시험 글)'; e.style.display = 'block'; } });
      let s = false; for (let i = 0; i < 10 && !s; i++) { s = await ev(() => SM_TOWN.treasure().shovel()); if (!s) await W8(400); }
      let t = ''; for (let i = 0; i < 20 && !/지도를/.test(t); i++) { await W8(400); t = await ev(() => (document.querySelector('.twn-p') || {}).innerText || ''); }
      const tt = await T.toastT(), got = await ev(() => ({ ...((SM_TOWN.game().S.today || {}).got || {}) }));
      ok(!!g && g.r === 'new' && s && /지도를/.test(t), '보물 지도 받기 → 삽으로 파서 상자가 나옴(' + (g ? g.k : '?') + ')');
      ok(!/^⛏/.test(tt), '상자가 나온 순간 「삽으로 파 봐요」 귀띔이 내려감' + (tt ? ' (지금 「' + tt.slice(0, 30) + '」)' : ''));
      ok(Object.keys(got).length > g0, '상자에서 나온 것이 그날 「모은 것」에 셈(' + JSON.stringify(got) + ')'); await T.shut();
      await ev(() => { const G = SM_TOWN.game(); SM_TOWN.storyOff(); if (G.setClock) G.setClock(false); G.S.min = 21 * 60; }); await W8(900); await T.shut();
      await ev(() => { SM_TOWN.sleep({ ask: true }); }); await W8(1200);   /* 돌려주는 약속을 기다리지 않음(창이 닫혀야 끝남) */
      const R = await ev(() => { const P = document.querySelector('.twn-p'), st = P && P.querySelector('.st[data-left]'), rw = P && [...P.querySelectorAll('.st')].find(q => /모은 것/.test(q.textContent)); return P ? { left: st ? +st.dataset.left : -1, t: st ? st.textContent.trim() : '', got: rw ? ((rw.querySelector('b:last-child') || {}).textContent || '').trim() : '(줄 없음)' } : null; });
      console.log('    ' + JSON.stringify(R));
      ok(!!R && /1곳에 물 줌/.test(R.t), '하루 마무리 「오늘 세상에 남긴 것」 = ' + (R ? R.t.slice(0, 44) : '창 없음'));
      ok(!!R && !!R.got && R.got !== '—' && R.got !== '(줄 없음)', '하루 마무리 「모은 것」 = ' + (R ? R.got : '창 없음')); await T.shot('s1_recap');
      await T.shut(); await T.ctx.close(); }

    // ───────── a 놀이터 도착 판정(5) ─────────
    if (want('a')) { console.log('a 「놀이터 — 왔어요」는 놀이터가 보이는 자리에서만(R2A #14 · 사진 084 안경점 앞)');
      const T = await fresh(), { ev, W8 } = T; await T.start(); await T.shut();
      const A = await ev(() => { const H = SD2.map.interact.list().filter(h => /들어가기/.test(h.label || '') && Math.hypot(h.x + 148.5, h.z - 409.5) < 70 && h.z < 372), o = H.find(h => /안경/.test(h.label)), P = SM_TOWN.places().find(q => q.name === '놀이터' && Math.abs(q.x + 149.4) < 4);
        return { o: o ? [+o.x.toFixed(1), +o.z.toFixed(1)] : null, shops: H.map(h => [h.label.replace(/^.*— /, '').slice(0, 12), SM_TOWN.atPlace('놀이터', h.x, h.z)]), door: P && P.door ? [P.door[0], P.door[1]] : null, atDoor: P && P.door ? SM_TOWN.atPlace('놀이터', P.door[0], P.door[1]) : null, atMid: P ? SM_TOWN.atPlace('놀이터', P.x, P.z) : null, atStone: SM_TOWN.atPlace('놀이터', -114.2, 409.5) }; });
      console.log('    ' + JSON.stringify(A));
      ok(!!A.o && A.shops.length >= 3 && A.shops.every(q => !q[1]), '놀이터 북쪽 가게 줄 문 앞(안경점 ' + A.o + ' 등 ' + A.shops.length + '곳)은 「왔어요」가 아님');
      ok(A.atDoor === true && A.atMid === true && A.atStone === true, '놀이터 문 · 가운데 · 이름 돌 곁은 「왔어요」');
      /* 이야기에서: 놀이터를 고른 뒤 안경점 문 앞에 서 있어도 그대로 → 놀이터 문 곁에서 도착 */
      await ev(() => SM_TOWN.storyAt('p0', 3)); let n = 0; for (; n < 40 && !(await ev(() => !!document.querySelector('.twn-p [data-card]'))); n++) await W8(300);
      const k = await ev(() => { const L9 = [...document.querySelectorAll('.twn-p [data-card]')], b9 = L9.find(q => q.textContent.includes('놀이터')) || L9[0]; if (b9) b9.click(); return b9 ? b9.textContent.trim().slice(0, 16) : ''; }); await W8(300); await ev(() => { const b9 = document.querySelector('.twn-p [data-card]'); if (b9) b9.click(); }); await W8(2500);
      const st = () => ev(() => { const s = SM_TOWN.story(); return s.cur + '/' + ((s.step && s.step.id) || (s.S && s.S.i)) + (s.done && s.done.includes && s.done.includes('p0') ? ' · p0 끝' : ''); });
      const s0 = await st(), tg = await ev(() => { const t = SM_TOWN.storyTarget(); return t ? t.name : ''; });
      if (!/show/.test(s0) || tg !== '놀이터' || !A.o) console.log('    (이야기 걸음 시험은 건너뜀 — 걸음 ' + s0 + ' · 고른 곳 ' + k + ' · 목표 ' + tg + ')');
      else { await T.tp(A.o[0], A.o[1] + 1.2, A.o[0], A.o[1] - 6); await W8(2800); const s1 = await st(), tt = await T.toastT(); ok(s1 === s0 && !/왔어요/.test(tt), '새 친구와 안경점 문 앞에 3초 서 있어도 「왔어요」가 안 뜸(걸음 ' + s1 + ')'); await T.shot('a1_optician');
        await T.tp(A.door[0] + 1.5, A.door[1], A.door[0] - 6, A.door[1]); let s2 = s1; for (let i = 0; i < 24 && s2 === s0; i++) { await W8(400); s2 = await st(); } ok(s2 !== s0, '놀이터 문 곁에 서면 도착(걸음 ' + s0 + ' → ' + s2 + ')'); await T.shot('a2_playground'); }
      await T.shut(); await T.ctx.close(); }

    // ───────── f 소방서 안(6) ─────────
    if (want('f')) { console.log('f 소방서 안 — 소방관 앞에 서면 E = 「소방관에게 묻기」 → 장소 카드(R2B)');
      const T = await fresh(), { ev, W8, p } = T; await T.start(); await T.shut();
      await p.waitForFunction(() => SM_TOWN.indoor && SM_TOWN.ent, null, { timeout: 60000 });
      await ev(() => { const G = SM_TOWN.game().S; G.story = G.story || {}; G.story.done = Object.assign(G.story.done || {}, { p0: 1, a1_1: 1 }); G.min = 11 * 60; if (G.emerg) { G.emerg.d = G.day; G.emerg.plan = []; } }); await T.shut();
      const F = (await ev(() => SM_TOWN.indoor.census())).find(q => q.kind === 'fire');
      if (!F) ok(false, '소방서가 실내 목록에 없음');
      else { await ev(i => SM_TOWN.indoor.enterI(i), F.i); let inn = true; try { await p.waitForFunction(() => SM_TOWN.indoor.on && !SM_TOWN.indoor.busy, null, { timeout: 12000 }); } catch (e) { inn = false; } await W8(600); await T.shut();
        const H = await ev(() => { const sp = SM_TOWN.indoor.spawn(), L = SD2.map.interact.list().filter(h => !h.off && Math.abs(h.y - sp[1]) < 3 && Math.hypot(h.x - sp[0], h.z - sp[2]) < 24).map(h => ({ x: h.x, y: h.y, z: h.z, r: h.r, label: h.label })); return { sp, L, ask: L.find(h => /소방관에게 묻기/.test(h.label)) || null }; });
        console.log('    안 E 자리 ' + H.L.map(h => h.label.slice(0, 16) + '(r ' + h.r + ')').join(' / '));
        ok(inn && !!H.ask, '소방서 안에 「소방관에게 묻기」 E 자리가 있음' + (H.ask ? ' (r ' + H.ask.r + ')' : ''));
        if (H.ask) { let hit = 0; const tries = [[0, 0], [0.9, 0], [-0.9, 0], [0, 0.9], [0, -0.9], [1.2, 1.2]]; const labs = [];
          for (const [dx, dz] of tries) { await ev(([a, dx, dz, s]) => { SD2.map.player.teleport([a.x + dx, s[1] + 0.05, a.z + dz]); SD2.map.player.lookAt([a.x, a.z]); }, [H.ask, dx, dz, H.sp]); await W8(450); const l9 = await ev(() => { const h = SD2.hotNow && SD2.hotNow(); return h ? h.label : ''; }); labs.push(l9.slice(0, 14)); if (/소방관에게 묻기/.test(l9)) hit++; }
          ok(hit >= 5, '소방관 둘레(0.9 m 네 쪽 · 비스듬히 1.7 m)에 서면 E 글 = 소방관에게 묻기 (' + hit + ' / ' + tries.length + ' · ' + labs.join(' | ') + ')'); await T.shot('f1_ask');
          await ev(([a, s]) => { SD2.map.player.teleport([a.x + 0.6, s[1] + 0.05, a.z + 0.6]); SD2.map.player.lookAt([a.x, a.z]); }, [H.ask, H.sp]); await W8(500); await p.keyboard.press('KeyE'); await W8(900);
          const P = await ev(() => { const P = document.querySelector('.twn-p'), D = document.querySelector('.twn-dlg'); return P ? 'p:' + (P.dataset.k || '') + ' ' + ((P.querySelector('h3') || {}).textContent || '').slice(0, 20) : D ? 'dlg:' + (D.textContent || '').slice(0, 30) : ''; });
          ok(!!P, 'E를 누르면 반응이 있음(' + (P || '무반응') + ')'); await T.shot('f2_card'); } }
      await T.shut(); await T.ctx.close(); }

    // ───────── t 따라가는 중 줄 이름(7) ─────────
    if (want('t')) { console.log('t 112 단계 — 따라가는 중 줄의 이야기 이름이 할 일 줄과 같은 대상(R2A 122 ~ 125)');
      const T = await fresh(), { ev, W8 } = T; await T.start(); await ev(() => { const G = SM_TOWN.game().S; G.story = G.story || {}; G.story.done = Object.assign(G.story.done || {}, { p0: 1 }); });
      const E = await open112(T); const names = []; let bad = '';
      for (let i = 0; i < 10; i++) { const c = await ev(() => { const L = SM_TOWN.track.cands(), s = L.find(q => q.k === 'story'); return s ? { name: s.name, at: s.at, self: s.self } : null; }); if (c) { if (!names.includes(c.name)) names.push(c.name); if (/우체국|도서관/.test(c.name)) bad = c.name; } await W8(1200); if (await ev(() => !!document.querySelector('.twn-dlg'))) await T.closeDlg(); }
      const gl = await T.goal(); console.log('    사건 ' + (E ? E.k + ' ' + E.st : '없음') + ' · 줄 이름 ' + JSON.stringify(names) + ' · 할 일 줄 「' + gl.slice(0, 50) + '」');
      ok(!!E && names.length > 0 && !bad, '112 단계 12초 동안 따라가는 중 이름이 우체국·도서관으로 안 바뀜(' + names.join(' → ') + ')');
      ok(names.length <= 2 && names.every(n => /새 친구/.test(n)), '이름 = 「새 친구」 쪽 하나(많아야 둘 — 배웅 중 → 찾는 중)');
      await T.shut(); await T.ctx.close(); }

    // ───────── c 엽서 카드 자리(9) ─────────
    if (want('c')) { console.log('c 아침 엽서 카드가 오른쪽 칩과 안 겹침(1366×768 · 칩을 다 켠 판 — 1차 A #28)');
      const T = await fresh('&all=1'), { ev, W8 } = T; await T.start(); await T.shut(); await T.quiet(); await T.shut();
      const r = await ev(() => { const S = SM_TOWN.game().S; if (S.disc) S.disc.pc = 0; const okp = SM_TOWN.disc().postcard(true), pc = document.querySelector('.twn-pc'), R = e => { const q = e.getBoundingClientRect(); return [Math.round(q.left), Math.round(q.top), Math.round(q.right), Math.round(q.bottom)]; };
        const chips = [...document.querySelectorAll('.gchip')].filter(c => { const q = c.getBoundingClientRect(); return q.width > 0 && q.height > 0 && getComputedStyle(c).display !== 'none' && getComputedStyle(c).visibility !== 'hidden'; }).map(c => [c.textContent.trim().slice(0, 10), ...R(c)]);
        return { okp, pc: pc ? R(pc) : null, chips, vh: innerHeight }; });
      await W8(1300); const r2 = await ev(() => { const pc = document.querySelector('.twn-pc'); if (!pc) return null; const q = pc.getBoundingClientRect(); return [Math.round(q.left), Math.round(q.top), Math.round(q.right), Math.round(q.bottom)]; });
      const pc = r2 || r.pc, hit = pc ? r.chips.filter(c => c[1] < pc[2] && c[3] > pc[0] && c[2] < pc[3] && c[4] > pc[1]) : [];
      console.log('    엽서 ' + JSON.stringify(pc) + ' · 칩 ' + r.chips.length + '개 · 오른쪽 맨 아래 칩 밑 ' + Math.max(0, ...r.chips.filter(c => c[3] > 1366 - 320 && c[2] < r.vh * 0.62).map(c => c[4])));
      ok(!!pc, '엽서 카드가 뜸'); ok(!!pc && !hit.length, '엽서 카드가 칩과 안 겹침' + (hit.length ? ' — ' + hit.map(c => c[0]).join(' · ') : '')); ok(!!pc && pc[3] <= r.vh, '엽서 카드가 화면 안(아래 ' + (pc ? pc[3] : '?') + ' / ' + r.vh + ')'); await T.shot('c1_postcard');
      await T.shut(); await T.ctx.close(); }

    // ───────── x 작은 것(10) ─────────
    if (want('x')) { console.log('x 도구를 안 든 채 F · 물뿌리개가 곁의 꽃을 겨눔');
      const T = await fresh(), { ev, W8, p } = T; await T.start(); await T.shut();
      await ev(() => SM_TOWN.storyAt('p0', 2)); await W8(1500); await T.closeDlg(); await T.shut();
      const i0 = await ev(() => SM_TOWN.tools.info()); await p.keyboard.press('KeyF'); await W8(500); const t1 = await T.toastT();
      ok(!i0.shown && /도구를 먼저 들어요/.test(t1), '도구를 안 든 채 F → 「' + t1 + '」(예전 「이야기를 따라가면 열려요」)'); await T.shot('x1_tool');
      /* 이야기의 마른 꽃(곁 3.6 m에서 붙음 — PATH-1A)이 아닌 보통 꽃: 이야기 꽃에서 8 m 넘게 떨어진 꽃을 고리로 훑어 찾음 */
      const T0 = await ev(() => SM_TOWN.storyTarget());
      if (!T0) ok(false, '꽃 목표가 없음');
      else { await T.tp(T0.x + 14, T0.z + 14, T0.x + 30, T0.z + 30); await W8(700); await p.keyboard.press('Digit1'); await W8(700);
        const F = await ev(([x0, z0]) => { const out = []; for (let x = x0 - 36; x <= x0 + 36 && out.length < 6; x += 1.5) for (let z = z0 - 36; z <= z0 + 36 && out.length < 6; z += 1.5) { if (Math.hypot(x - x0, z - z0) < 8) continue; const a = SM_TOWN.tools.aim(x, z); if (a.lock === 'flower' && Math.hypot(a.x - x, a.z - z) > 0.05 && !out.some(q => Math.hypot(q[0] - a.x, q[1] - a.z) < 4)) out.push([a.x, a.z]); } SM_TOWN.tools.aim(null); return out; }, [T0.x, T0.z]);
        let hit = null; const seenA = [];
        for (const f of F) { const dx = f[0] - T0.x, dz = f[1] - T0.z, l = Math.hypot(dx, dz) || 1, sx = f[0] + dx / l * 1.3, sz = f[1] + dz / l * 1.3;
          await T.tp(sx, sz, sx + dx / l * 8, sz + dz / l * 8); await W8(900);   /* 꽃을 등지고 1.3 m 곁 */
          const r = await ev(() => { const a = SM_TOWN.tools.info().aim, q = SD2.map.player.pos(); return { lock: a.lock, d: Math.hypot(a.x - q.x, a.z - q.z), me: [q.x, q.z] }; }), dm = Math.hypot(r.me[0] - f[0], r.me[1] - f[1]); seenA.push((r.lock || '없음') + ' ' + r.d.toFixed(2));
          if (dm > 2.0) continue;   /* 순간이동이 밀려난 자리 */ if (r.lock === 'flower' && r.d <= 2.05) { hit = { f, r }; break; } }
        ok(F.length > 0 && !!hit, '보통 꽃을 등지고 1.3 m 곁에 서도 물뿌리개 고리가 그 꽃에 붙음(' + (hit ? '꽃 (' + hit.f[0].toFixed(1) + ', ' + hit.f[1].toFixed(1) + ') · 내게서 ' + hit.r.d.toFixed(2) + ' m' : '꽃 ' + F.length + '송이 · ' + seenA.join(' | ')) + ')'); await T.shot('x2_aim'); }
      await T.shut(); await T.ctx.close(); }
  } catch (e) { console.log('  ✗ 하네스 오류 ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : e)); fails++; }
  if (errs.length) { console.log('  ✗ 콘솔 오류 ' + errs.length + ' — ' + errs.slice(0, 3).join(' | ')); fails++; } else console.log('  ✓ 콘솔 오류 0');
  await b.close();
  console.log(fails ? 'PATH-1D ✗ ' + fails : 'PATH-1D ✓ 통과');
  process.exit(fails ? 1 : 0);
})();
