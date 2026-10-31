// 🧭 따라가는 목표 하나 시험(TRACK-1 · 사용자 11-01 '퀘스트나 여러 개 할 수 있을 때 길 찾기 변동이 직관적이지 않음'): node tools/harness/town_track.cjs [마을=ourtown] [포트=8002] [--shots=폴더]
//   ① 이야기 + 오늘 할 일(부탁) + 사건 + 고른 곳이 함께 있어도 따라가는 목표는 하나 — 나침반 띠·위 가운데 줄·작은 지도 별·머리 위 ❗·빨간 선이 모두 그것
//   ② 사건이 새로 생겨도 안 빼앗음(칩 '— 안내 받기' · 위 가운데 줄·띠는 그대로)
//   ③ 🧭 바꾸기로 고르면 그것만 가리킴(사건 → 이야기 → 할 일) · 바꾸기는 빨간 선을 새로 만들지 않음 · 이야기로 돌아오면 이야기 선이 다시 · 할 일 줄 방향 꼬리는 이야기를 따라갈 때만
//   ④ 아이가 고름 = 바뀜 + 한 줄(사건 '안내 받기' · J·F 길 안내) · 끝나면 다음 목표(이야기 먼저) + 한 줄(고른 곳에 닿음 · 사건 끝)
//   ⑤ 새로고침해도 그대로(할 일 · 고른 곳 + 빨간 선) ⑥ 휴대폰 세로·가로: 따라가는 중 줄 · [바꾸기] 44px · 다른 화면 조각과 안 겹침 · 눌러서 고르기 ⑦ 조작 안내 '🧭 바꾸기' 한 줄 · 페이지 오류 0
//   한 대상에 수 하나: 띠·따라가는 중 줄·위 가운데 줄의 거리 수가 같음(KIDEYE-1)
const { chromium, devices } = require('./pw.cjs');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const SHOTS = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8) || null, URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
async function page(b, ctxOpt, touch) {
  const ctx = await b.newContext(ctxOpt), p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(t)) || /게임 tick 오류|꼬리표 없는 보상/.test(t)) errs.push(t.slice(0, 200)); });
  const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms);
  const shot = async n => { if (!SHOTS) return; await W8(250); await p.screenshot({ path: SHOTS + '/' + n + '.png' }); console.log('    📷 ' + SHOTS + '/' + n + '.png'); };
  const dlgClick = async () => { for (let i = 0; i < 20; i++) { await W8(220); const r = await ev(() => { const B = [...document.querySelectorAll('.twn-dlg .ch button')]; if (B.length) { B[0].click(); return 1; } const d = document.querySelector('.twn-dlg .dbox'); if (d) { d.click(); return 1; } return 0; }); if (!r && i > 2) return; } };
  const closeAll = async () => { for (let i = 0; i < 6; i++) { if (await ev(() => !!document.querySelector('.twn-dlg'))) { await dlgClick(); continue; } if (!await ev(() => !!document.querySelector('.twn-p'))) break; await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p .twn-x'); if (b9) b9.click(); }); await W8(220); if (await ev(() => !!document.querySelector('.twn-p'))) { await p.keyboard.press('Escape'); await W8(220); } } };
  const boot = async () => { await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.emerg && SM_TOWN.emerg() && SM_TOWN.track, null, { timeout: 240000 }); await W8(2200); await closeAll(); if (touch) await p.touchscreen.tap(200, 320); await W8(400); };
  await p.goto(URL); await boot();
  const tp = (x, z) => ev(([x, z]) => { const M = SD2.map; M.player.teleport([x, M.q.groundAt(x, z, SM_TOWN.ground(x, z) + 2) + 0.05, z]); }, [x, z]);
  const st = () => ev(() => { const g = document.getElementById('hudGoal'), t = document.querySelector('.twn-task'), cg = document.querySelector('.twn-comp'), tg = cg && cg.lastChild, T = SM_TOWN.track;
    return { key: T.key(), by: T.by(), drawn: T.drawn(), row: T.row(), rowOn: T.rowOn(), goal: g && g.style.display !== 'none' ? g.innerText : '', task: t && t.style.display !== 'none' ? t.innerText : '', comp: SM_TOWN.compTgt(), compTag: tg && tg.style.display !== 'none' ? tg.textContent : '', cands: T.cands(), notes: T.dbg().notes, gsp: SM_TOWN.goalSp(), me: (() => { const m = SD2.map.player.pos(); return [m.x, m.z]; })(), emEv: SM_TOWN.emerg().info().ev ? [SM_TOWN.emerg().info().ev.x, SM_TOWN.emerg().info().ev.z] : null, chips: [...document.querySelectorAll('.gchip')].filter(c => getComputedStyle(c).display !== 'none').map(c => c.textContent) }; });
  /* 작은 지도 별(#ffd23a)이 그 자리에 있나 — 5×5 칸 안에 노란 별 화소 */
  const starAt = (x, z) => ev(([x, z]) => { const cv = document.querySelector('.twn-mini canvas'); if (!cv) return null; const [px, py] = SM_TOWN.miniPt(x, z), g = cv.getContext('2d'), d = g.getImageData(Math.round(px) - 3, Math.round(py) - 3, 7, 7).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] > 235 && d[i + 1] > 190 && d[i + 1] < 225 && d[i + 2] < 90) n++; return n; }, [x, z]);
  const near = (a, b, r) => !!(a && b && Math.hypot(a[0] - b[0], a[1] - b[1]) < (r || 3));
  const openTrk = async () => { await ev(() => document.querySelector('.twn-trk button').click()); await W8(500); return ev(() => { const P = document.querySelector('.twn-p'); return P ? { k: P.dataset.k || '', rows: [...P.querySelectorAll('.trk-r')].map(e => ({ k: e.dataset.k, on: e.classList.contains('on'), t: e.innerText.replace(/\s+/g, ' ').trim() })) } : null; }); };
  const pickRow = async k => { await ev(k => { const b9 = [...document.querySelectorAll('.twn-p .trk-r')].find(e => e.dataset.k === k); if (b9) b9.click(); }, k); await W8(1400); };
  return { p, ctx, ev, W8, shot, closeAll, boot, tp, st, starAt, near, openTrk, pickRow, errs };
}
// 마을 밖 길 + 이야기 a1_3 '목장 일꾼' 걸어가기 단계 + 오늘 할 일
async function setup(P) { const { ev, W8, tp } = P;
  await ev(() => { const G = SM_TOWN.game().S; G.story = G.story || {}; G.story.done = Object.assign(G.story.done || {}, { p0: 1, a1_1: 1 }); G.jobs = G.jobs || {}; G.jobs.fireNo = G.day; G.min = 10 * 60; SM_TOWN.rules.wx('clear'); if (G.emerg) { G.emerg.d = G.day; G.emerg.plan = []; } });
  const R = await ev(() => SM_TOWN.schRect()); await tp((R[0] + R[2]) / 2, R[3] + 28); await W8(800);
  await ev(() => SM_TOWN.tasksNow()); await W8(1200); await ev(() => SM_TOWN.storyAt('a1_3', 2)); await W8(2600); }
async function spawnEm(P) { const { ev, W8 } = P; await ev(() => { const G = SM_TOWN.game().S; G.min = Math.max(G.min, 10 * 60 + 30); G.emerg.d = G.day; G.emerg.plan = [{ k: 'lost', at: G.min, until: G.min + 300, st: 0 }]; SM_TOWN.emerg().dbg.walk(100); });
  for (let i = 0; i < 14; i++) { await W8(500); if (await ev(() => !!SM_TOWN.emerg().info().ev)) break; } await W8(1500); return ev(() => SM_TOWN.emerg().info().ev); }
const numsOf = t => (String(t || '').match(/\d+(?:\.\d)?\s?k?m\b/g) || []).map(s => s.replace(/\s/g, ''));
(async () => { const T0 = Date.now(), fs = require('fs'); if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  try {
    // ───── 데스크톱 ─────
    { const P = await page(b, { viewport: { width: 1280, height: 720 } }), { ev, W8, shot, closeAll, st, starAt, near, openTrk, pickRow, tp, p } = P;
      await setup(P);
      console.log('① 이야기 + 할 일 + 사건 + 고른 곳 = 따라가는 목표 하나');
      let S = await st(); const story0 = S.cands.find(c => c.k === 'story');
      ok(S.key === 'story' && story0 && story0.at, '이야기가 열리면 이야기를 따라감(대신 고른 할 일 → 이야기 · ' + S.key + ' · by ' + S.by + ')');
      ok(S.cands.some(c => c.src === 'task') && S.cands.length >= 3, '후보 = 이야기 + 할 일 ' + S.cands.filter(c => c.src === 'task').length + '개');
      ok(S.drawn === 'story' && near(S.comp, story0.at, 4), '빨간 선·나침반 띠 = 이야기 목적지(' + story0.name + ')');
      ok(S.rowOn && /따라가는 중/.test(S.row) && S.row.includes(story0.name), '따라가는 중 줄 「' + S.row + '」');
      ok(S.gsp && near([S.gsp.x, S.gsp.z], story0.at, 4), '머리 위 ❗ = 이야기 목적지');
      { const e9 = await ev(() => { const P9 = SM_TOWN.routePts(); return P9 && P9.length ? P9[P9.length - 1] : null; }), n = await starAt(S.comp[0], S.comp[1]); ok(n > 0, '작은 지도 별 = 이야기 목적지(노란 화소 ' + n + ' · 선 끝 ' + JSON.stringify(e9) + ' · 목적지 ' + JSON.stringify(S.comp.slice(0, 2).map(Math.round)) + ')'); }
      { const a = numsOf(S.row), c = numsOf(S.compTag), g = numsOf(S.goal); ok(a.length && c.length && a[0] === c[0] && (!g.length || g[0] === a[0]), '한 대상에 수 하나: 줄 ' + a[0] + ' · 띠 ' + c[0] + ' · 위 줄 ' + (g[0] || '-')); }
      ok(/쪽/.test(S.task), '할 일 줄 = 이야기 방향 꼬리(이야기를 따라감) 「' + S.task + '」');
      await shot('trk_desk_story');
      console.log('② 사건이 새로 생겨도 안 빼앗음');
      const E0 = await spawnEm(P); ok(!!E0 && E0.k === 'lost', '👮 길 잃은 어린이 생김(' + (E0 && E0.cell) + ')');
      S = await st(); ok(S.key === 'story' && S.drawn === 'story' && near(S.comp, story0.at, 4), '따라가는 목표 그대로 = 이야기(빨간 선·띠)');
      ok(!/길 잃은/.test(S.goal), '위 가운데 줄을 사건이 가져가지 않음 「' + S.goal + '」');
      ok(S.chips.some(t => /👮/.test(t) && /안내 받기/.test(t)), '사건 칩 = 「' + (S.chips.find(t => /👮/.test(t)) || '-') + '」');
      ok(S.cands.some(c => c.k === 'em:emerg') && S.cands.length >= 4, '후보에 사건이 더해짐(' + S.cands.map(c => c.k).join(' · ') + ')');
      ok(S.gsp && near([S.gsp.x, S.gsp.z], story0.at, 4), '머리 위 ❗ 그대로 = 이야기');
      await shot('trk_desk_em_new');
      console.log('③ 🧭 바꾸기로 고르기');
      let O = await openTrk(); ok(O && O.k === 'trk' && O.rows.length >= 4 && O.rows[0].k === 'story' && O.rows.filter(r => r.on).length === 1 && O.rows.find(r => r.on).k === 'story', '바꾸기 창 = ' + (O ? O.rows.length : 0) + '줄(이야기 먼저 · 따라가는 중 하나)');
      { const tip = await ev(() => SM_TOWN.tips.info()); ok(!!tip.seen.track, '조작 안내 🧭 바꾸기 = 창을 열면 봤음'); }
      await shot('trk_desk_open');
      await pickRow('em:emerg'); S = await st();
      ok(S.key === 'em:emerg' && near(S.comp, S.emEv, 3), '사건을 고름 = 나침반 띠가 사건 자리');
      ok(/길 잃은/.test(S.goal) && /\d+m/.test(S.goal), '위 가운데 줄 = 사건 칸·방향·거리 「' + S.goal + '」');
      ok(S.drawn === null, '바꾸기는 빨간 선을 새로 만들지 않음(사건 선은 「안내 받기」를 눌렀을 때)');
      ok(S.notes.some(t => /이제 👮 길 잃은 어린이로 안내해요/.test(t)), '바뀔 때 한 줄 「' + S.notes[S.notes.length - 1] + '」');
      { const n = await starAt(S.emEv[0], S.emEv[1]), n2 = await starAt(story0.at[0], story0.at[1]); ok(n > 0 && n2 === 0, '작은 지도 별 = 사건 자리 하나(이야기 자리 별 X · ' + n + '/' + n2 + ')'); }
      ok(!/쪽$/.test(S.task.trim()), '할 일 줄 = 이야기 방향 꼬리 X(사건을 따라감) 「' + S.task + '」');
      { const a = numsOf(S.row), c = numsOf(S.compTag), g = numsOf(S.goal); ok(a[0] && a[0] === c[0] && a[0] === g[0], '한 대상에 수 하나(사건): 줄 ' + a[0] + ' · 띠 ' + c[0] + ' · 위 줄 ' + g[0]); }
      await shot('trk_desk_em');
      await ev(() => { const c9 = [...document.querySelectorAll('.gchip')].find(c => /👮/.test(c.textContent)); if (c9) c9.click(); }); await W8(500);
      ok(await ev(() => !!document.querySelector('.twn-p [data-a="way"]') && /안내 받기/.test(document.querySelector('.twn-p [data-a="way"]').textContent)), '사건 칩 → 창의 「🧭 안내 받기」');
      await ev(() => document.querySelector('.twn-p [data-a="way"]').click()); await W8(1300); S = await st();
      ok(S.key === 'em:emerg' && S.drawn === 'em:emerg', '안내 받기 = 사건 빨간 선(사건의 규칙 그대로)');
      O = await openTrk(); await pickRow('story'); S = await st();
      ok(S.key === 'story' && S.drawn === 'story' && near(S.comp, story0.at, 4), '이야기로 돌아옴 = 이야기 빨간 선이 지금 자리에서 다시');
      ok(S.gsp && near([S.gsp.x, S.gsp.z], story0.at, 4), '머리 위 ❗ = 이야기');
      ok(!/길 잃은/.test(S.goal) && /목장/.test(S.goal + S.row), '위 가운데 줄 = 이야기 길 안내 「' + S.goal + '」');
      const task0 = S.cands.filter(c => c.src === 'task' && c.at).sort((a, c) => Math.hypot(a.at[0] - S.me[0], a.at[1] - S.me[1]) - Math.hypot(c.at[0] - S.me[0], c.at[1] - S.me[1]))[0];
      O = await openTrk(); await pickRow(task0.k); S = await st();
      ok(S.key === task0.k && near(S.comp, task0.at, 3) && S.drawn === null, '할 일을 고름 = 띠가 할 일 자리 · 빨간 선 X(할 일 창의 「빨간 선 보기」 규칙 그대로)');
      ok(S.gsp && near([S.gsp.x, S.gsp.z], task0.at, 3), '머리 위 ❗ = 할 일 자리');
      ok(!/길 잃은|목장 일꾼까지/.test(S.goal), '위 가운데 줄에 다른 목표 글 X 「' + S.goal + '」');
      { const n = await starAt(task0.at[0], task0.at[1]); ok(n > 0, '작은 지도 별 = 할 일 자리'); }
      await shot('trk_desk_task');
      console.log('④ 아이가 고름(J·F 길 안내) · 끝나면 다음 목표 + 한 줄');
      const pickPl = me0 => ev(me => { const L = SM_TOWN.places().filter(q => q.door && !/학교/.test(q.name) && !SM_TOWN.inSchool(q.door[0], q.door[1])).map(q => ({ q, d: Math.hypot(q.door[0] - me[0], q.door[1] - me[1]) })).filter(o => o.d > 50 && o.d < 220).sort((a, c) => a.d - c.d); return L.length ? { name: L[0].q.name, door: L[0].q.door } : null; }, me0);   /* 지금 자리에서 50~220m 떨어진 곳(학교 X) */
      const pl = await pickPl(S.me);
      ok(!!pl, '찾을 곳 = ' + (pl && pl.name));
      if (pl) { pl.door = await ev(nm => { const p9 = SM_TOWN.find(nm); SM_TOWN.showRoute(p9); return p9.door; }, pl.name); await W8(1300); S = await st();
        ok(S.key === 'pin:find' && S.drawn === 'pin:find' && near(S.comp, pl.door, 3), 'J·F 길 안내 = 그곳을 따라감(빨간 선·띠)');
        ok(S.notes.some(t => t.includes('이제') && t.includes(pl.name)), '한 줄 「' + S.notes[S.notes.length - 1] + '」');
        await tp(pl.door[0], pl.door[1]); await W8(4600); S = await st();
        ok(S.key === 'story' && S.drawn === 'story', '고른 곳에 닿음 = 다음 목표는 이야기 먼저(' + S.key + ')');
        ok(/이제 📖/.test(S.notes[S.notes.length - 1] || ''), '끝나면 한 줄 「' + S.notes[S.notes.length - 1] + '」'); }
      O = await openTrk(); await pickRow('em:emerg'); S = await st(); ok(S.key === 'em:emerg', '다시 사건을 따라감');
      await ev(() => SM_TOWN.emerg().dbg.end(true)); await W8(3800); await closeAll(); S = await st();
      ok(S.key === 'story', '사건이 끝남 = 이야기로(' + S.key + ')'); ok(/이제 📖/.test(S.notes[S.notes.length - 1] || ''), '한 줄 「' + S.notes[S.notes.length - 1] + '」');
      console.log('⑤ 새로고침해도 그대로');
      O = await openTrk(); await pickRow(task0.k); S = await st(); ok(S.key === task0.k, '할 일을 따라감');
      await ev(() => SM_TOWN.save().flush()); await p.reload(); await P.boot(); await W8(1800); S = await st();
      ok(S.key === task0.k && near(S.comp, task0.at, 3), '새로고침 뒤 = 그 할 일 그대로(' + S.key + ' · by ' + S.by + ')');
      { const pl2 = await pickPl(S.me); if (pl2) { pl2.door = await ev(nm => { const p9 = SM_TOWN.find(nm); SM_TOWN.showRoute(p9); return p9.door; }, pl2.name); await W8(1200); const k0 = (await st()).key; await ev(() => SM_TOWN.save().flush()); await p.reload(); await P.boot(); await W8(4200); S = await st();
        ok(k0 === 'pin:find' && S.key === 'pin:find' && S.drawn === 'pin:find' && near(S.comp, pl2.door, 3), '새로고침 뒤 = 고른 곳(' + pl2.name + ') + 빨간 선 그대로(' + k0 + ' → ' + S.key + ' · 선 ' + S.drawn + ')'); } else ok(false, '새로고침 시험용 찾을 곳 X'); }
      await shot('trk_desk_reload');
      ok(!P.errs.length, '데스크톱 오류 0 ' + P.errs.join(' | ')); await P.ctx.close(); }
    // ───── 휴대폰(터치) ─────
    { const P = await page(b, { ...devices['iPhone 13'], deviceScaleFactor: 1 }, true), { ev, W8, shot, st, p } = P;
      await setup(P); await spawnEm(P); let S = await st();
      console.log('⑥ 휴대폰 세로·가로');
      const box = async () => ev(() => { const r = SM_TOWN.track.rowBox(); if (!r) return null; const hit = []; for (const e of document.querySelectorAll('.gchip,.twn-task,.twn-comp,#hudGoal,.twn-mini,.twn-day,.twn-bag,.twn-waitb,.twn-keys,#tJoy,.tbtn,.twn-cellb')) { if (!e.getClientRects().length) continue; const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue; const q = e.getBoundingClientRect(); if (q.width < 2 || q.height < 2) continue; if (r.x < q.right - 1 && r.x + r.w > q.left + 1 && r.y < q.bottom - 1 && r.y + r.h > q.top + 1) hit.push((e.id || e.className).slice(0, 24)); } return { ...r, hit, inV: r.x >= 0 && r.y >= 0 && r.x + r.w <= innerWidth && r.y + r.h <= innerHeight }; });
      let B = await box(); ok(!!B && S.rowOn, '세로: 따라가는 중 줄 보임 「' + S.row + '」');
      if (B) { ok(B.bw >= 44 && B.bh >= 44, '세로: [바꾸기] ' + Math.round(B.bw) + '×' + Math.round(B.bh) + 'px'); ok(!B.hit.length && B.inV, '세로: 다른 화면 조각과 안 겹침 ' + (B.hit.join(',') || '0')); }
      await shot('trk_phone_row');
      if (B) { await p.touchscreen.tap(B.bx + B.bw / 2, B.by + B.bh / 2); await W8(600); }
      const O = await ev(() => { const P9 = document.querySelector('.twn-p'); return P9 ? { k: P9.dataset.k, rows: [...P9.querySelectorAll('.trk-r')].map(e => { const r = e.getBoundingClientRect(); return { k: e.dataset.k, h: r.height, w: r.width, x: r.left + r.width / 2, y: r.top + r.height / 2 }; }) } : null; });
      ok(O && O.k === 'trk' && O.rows.length >= 3 && O.rows.every(r => r.h >= 44), '터치로 바꾸기 창 · 줄 ' + (O ? O.rows.length : 0) + '개 높이 ' + (O ? Math.round(Math.min(...O.rows.map(r => r.h))) : 0) + 'px 이상');
      await shot('trk_phone_open');
      if (O) { const r = O.rows.find(q => q.k === 'em:emerg') || O.rows[1]; await ev(k => { const e = [...document.querySelectorAll('.twn-p .trk-r')].find(q => q.dataset.k === k); if (e) e.scrollIntoView({ block: 'center' }); }, r.k); await W8(300); const r2 = await ev(k => { const e = [...document.querySelectorAll('.twn-p .trk-r')].find(q => q.dataset.k === k), q = e.getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height / 2 }; }, r.k); await p.touchscreen.tap(r2.x, r2.y); await W8(1400); S = await st(); ok(S.key === r.k, '터치로 고름 = ' + S.key + ' 「' + S.row + '」'); }
      await shot('trk_phone_em');
      await p.setViewportSize({ width: 844, height: 390 }); await W8(1600); B = await box();
      ok(!!B && B.bw >= 44 && B.bh >= 44 && !B.hit.length && B.inV, '가로: 줄 보임 · [바꾸기] ' + (B ? Math.round(B.bw) + '×' + Math.round(B.bh) : '-') + ' · 겹침 ' + (B ? B.hit.join(',') || '0' : '-'));
      await shot('trk_phone_land');
      ok(!P.errs.length, '휴대폰 오류 0 ' + P.errs.join(' | ')); await P.ctx.close(); }
  } catch (e) { console.error(e); fails.push('예외 ' + e.message); } finally { await b.close(); }
  console.log('\n요약: 실패 ' + fails.length + ' · ' + Math.round((Date.now() - T0) / 1000) + '초'); for (const f of fails) console.log('   ✗ ' + f);
  process.exit(fails.length ? 1 : 0); })();
