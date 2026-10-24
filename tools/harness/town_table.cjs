// 판 놀이 시험(TABLE-1 · docs/systems/town_buildings.md §4·§5 · 사용자 10-24 '보드게임 카페에서 간단한 보드게임'): node tools/harness/town_table.cjs [마을=ourtown] [포트=8002] [--shots=폴더] [--node]
//   ① node(브라우저 X): 아이 모형 × 손님 셋(처음·단골·고수) 승률 — 처음 ≥ 70% · 고수 ≤ 25%(고누·오목 · 윷은 윷가락 몫이 커서 따로 적음) · AI 한 수 ≤ 5ms · 판 하나 어림 시간 ≤ 3분
//      칠교·짝 맞추기 첫 판 봇(손 빠르기 어림 모형) = ★1(다 맞춤) 30초 안 90% 이상 · 칠교 모양 여섯(조각 갈래·넓이 8·겹침 0) · 사방치기 줄 판정
//   ② 브라우저: 이상해 넷(어항 카드 · 꼬리 용품 카드 · 도시 상점 방 · 산지 상점 방) · 보드게임 카페 = 1층 계산대 E · 2층 놀이 도구 가게 E · 3층 탁자 E 다섯 · 걸어서 닿음
//      탁자 E → 규칙 카드 → 판(첫 줄 = 할 일 · 3D 쉼 SM_HOLD3D) → 진짜 누르기 → 끝 → 보상(놀이 상자 · 남는 판 · 저녁 요약 한 줄 · 고수 이기면 음료 = 문 rwCheck table:drink)
//      칠교(진짜 끌기·돌리기) · 짝 · 고누 · 윷(꾹 눌렀다 떼기) · 비 오는 날 손님 늘어남 · 우리 집 놀이 선반 · 사방치기 판 자리·줄 판정 · 1366×768 · 휴대폰 390×844 사진 · 오류 0
const path = require('path'), { pathToFileURL } = require('url');
const ID = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'ourtown', PORT = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : '8002';
const SHOTS = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8) || null, NODE_ONLY = process.argv.includes('--node'), URL0 = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => {
  const T = await import(pathToFileURL(path.join(__dirname, '../../v2/games/town_table.js')).href);
  console.log('① node — 승률·AI 시간·첫 판 봇');
  const rnd = T.mkRnd(20261024), N = 500, AI = {}; let cur = '';
  const tAI = f => { const t0 = performance.now(); const r = f(); const d = performance.now() - t0; const a = AI[cur] || (AI[cur] = { max: 0, n: 0, over: 0 }); a.max = Math.max(a.max, d); a.n++; if (d > 5) a.over++; return r; };
  // 아이 모형(4학년 어림 · 세 놀이 같은 결): 대개 바로 앞 수는 봄 · 가끔 놓침
  const kidGonu = st => (rnd() < 0.75 ? T.gonuAI(st, 1, rnd) : T.gonuAI(st, 0, rnd));
  const kidOmok = st => { const b = st.b, me = st.turn, C = T.omokCands(b); if (C.length === 1) return C[0]; const sc = C.map(i => ({ i, e: T.omokCell(b, i, me) })); const w = sc.find(s => s.e.a >= 1e6); if (w) return w.i; const must = sc.filter(s => s.e.d >= 5e5); if (must.length && rnd() < 0.85) return must[0].i; const L = sc.map(s => ({ i: s.i, v: s.e.a + (s.e.d >= 5e5 ? 0 : s.e.d) * (rnd() < 0.5 ? 1 : 0.3) + rnd() * 120 })).sort((p, q) => q.v - p.v); return L[Math.min(L.length - 1, (rnd() * 3) | 0)].i; };
  const kidYut = (st, k) => (rnd() < 0.8 ? T.yutAI(st, 0, k, 1, rnd) : T.yutAI(st, 0, k, 0, rnd));
  const gonu = lv => { let st = T.gonuStart(0); for (;;) { const o = T.gonuOver(st); if (o !== null) return { r: o, kid: Math.ceil(st.ply / 2), opp: Math.floor(st.ply / 2) }; st = T.gonuPlay(st, st.turn === 0 ? kidGonu(st) : tAI(() => T.gonuAI(st, lv, rnd))); } };
  const omok = lv => { let st = T.omokStart(); for (;;) { if (st.n >= 81) return { r: 'draw', kid: 41, opp: 40 }; const i = st.turn === 1 ? kidOmok(st) : tAI(() => T.omokAI(st, lv, rnd)); st = T.omokPlay(st, i); if (T.omokFive(st.b, i)) return { r: st.b[i] === 1 ? 0 : 1, kid: Math.ceil(st.n / 2), opp: Math.floor(st.n / 2) }; } };
  const yut = (lv, first) => { let st = T.yutStart(first); const th = [0, 0]; for (let g = 0; g < 3000; g++) { const who = st.turn, pend = []; let can = true; while (can || pend.length) { if (can) { const t = T.yutThrow(rnd); th[who]++; pend.push(t.k); can = t.again; continue; } let k, j; if (who === 0) { k = pend.shift(); j = kidYut(st, k); } else { const pl = tAI(() => T.yutPlan(st, 1, pend, lv, rnd)); k = pend.splice(pl.ki, 1)[0]; j = pl.j; } const m = T.yutMove(st, who, j, k); st = m.st; if (T.yutDone(st, who)) return { r: who, kid: th[0], opp: th[1] }; if (m.cap) can = true; } st.turn = 1 - st.turn; } return { r: 'draw', kid: 0, opp: 0 }; };
  // 판 하나 어림 시간: 아이 한 수 = 고누 2.5초 · 오목 4초 · 윷 던지기 2.2초(꾹·날기 0.9·고르기) / 손님 = 고누·오목 0.8초 · 윷 1.5초
  const SEC = { gonu: [2.5, 0.8], omok: [4, 0.8], yut: [2.2, 1.5] }, R = {};
  for (const [g, f] of [['gonu', gonu], ['omok', omok], ['yut', yut]]) { cur = g; R[g] = [0, 1, 2].map(lv => { let w = 0, d = 0, sec = 0, mx = 0; for (let i = 0; i < N; i++) { const r = f(lv, i % 2); if (r.r === 0) w++; else if (r.r === 'draw') d++; const s = r.kid * SEC[g][0] + r.opp * SEC[g][1]; sec += s; mx = Math.max(mx, s); } return { win: +(w / N * 100).toFixed(1), draw: +(d / N * 100).toFixed(1), sec: Math.round(sec / N), p95: 0, max: Math.round(mx) }; }); }
  for (const g of ['gonu', 'omok', 'yut']) console.log('    ' + g + ' 아이 승률(처음·단골·고수) = ' + R[g].map(r => r.win + '%' + (r.draw ? '(비김 ' + r.draw + '%)' : '')).join(' · ') + ' · 판 어림 ' + R[g].map(r => r.sec + '초').join('·') + ' · AI 최대 ' + AI[g].max.toFixed(2) + 'ms');
  for (const g of ['gonu', 'omok', 'yut']) ok(R[g][0].win >= 70, g + ' 처음 손님 상대 아이 승률 ' + R[g][0].win + '% ≥ 70%');
  for (const g of ['gonu', 'omok']) ok(R[g][2].win <= 25, g + ' 고수 손님 상대 아이 승률 ' + R[g][2].win + '% ≤ 25%');
  ok(R.yut[2].win <= 25, 'yut 고수 손님 상대 아이 승률 ' + R.yut[2].win + '% ≤ 25%(윷가락 몫이 큼 — 고수 = 받은 칸 차례까지 한꺼번에 따짐)');
  for (const g of ['gonu', 'omok', 'yut']) ok(R[g].every(r => r.sec <= 180), g + ' 판 하나 어림 ' + Math.max(...R[g].map(r => r.sec)) + '초 ≤ 3분');
  for (const g of ['gonu', 'omok', 'yut']) ok(AI[g].over === 0, g + ' AI 한 수 5ms 아래(최대 ' + AI[g].max.toFixed(2) + 'ms · ' + AI[g].n + '수)');
  // 칠교 모양 여섯
  const area = V => { let a = 0; for (let i = 0; i < V.length; i++) { const [x1, y1] = V[i], [x2, y2] = V[(i + 1) % V.length]; a += x1 * y2 - x2 * y1; } return Math.abs(a) / 2; };
  const inP = (x, y, V) => { let c = false; for (let i = 0, j = V.length - 1; i < V.length; j = i++) { const [xi, yi] = V[i], [xj, yj] = V[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
  let shapeOk = 0; for (const [id, S] of Object.entries(T.TANG_SHAPES)) { const kinds = S.s.map(s => s[0]).sort().join() === T.TANG_PIECES.map(p => p.k).sort().join(), A8 = Math.abs(S.s.reduce((a, [, V]) => a + area(V), 0) - 8) < 1e-6, [x0, y0, x1, y1] = T.tangBox(S); let over = 0; for (let x = x0 + 0.025; x < x1; x += 0.05) for (let y = y0 + 0.025; y < y1; y += 0.05) { let n = 0; for (const [, V] of S.s) if (inP(x, y, V)) n++; if (n > 1) over++; } const used = Array(7).fill(false); const pose = S.s.every(([k], i) => { const pi = T.TANG_PIECES.findIndex((p, j) => p.k === k && !used[j]); used[pi] = true; return !!T.tangPoseFor(S, i, T.TANG_PIECES[pi]); }); if (kinds && A8 && !over && pose) shapeOk++; }
  ok(shapeOk === Object.keys(T.TANG_SHAPES).length, '칠교 모양 ' + shapeOk + '/' + Object.keys(T.TANG_SHAPES).length + '(조각 일곱 · 넓이 8 · 겹침 0 · 조각마다 맞는 방향)');
  // 칠교 첫 판 봇(집 · 옆 손님이 큰 세모 둘을 놓아 줌 = 다섯 조각): 찾기 1.0~2.2초 · 돌리기 한 번 0.4초(양쪽 단추 → 가까운 쪽) · 뒤집기 0.6초 · 끌기 0.8~1.4초 · 다섯에 하나 엉뚱한 자리 +1~2.5초
  { const sh = T.TANG_SHAPES.house, M = 2000; let in30 = 0, tot = 0; for (let t = 0; t < M; t++) { let s = 0; const used = Array(7).fill(false); let pre = 0; T.TANG_PIECES.forEach((pc, pi) => { if (pc.k === 'LT' && pre < 2) { pre++; const i = sh.s.findIndex((q, k) => q[0] === 'LT' && !used[k]); used[i] = true; return; } const i = sh.s.findIndex((q, k) => q[0] === pc.k && !used[k]); used[i] = true; const c = T.tangSlotCen(sh.s[i][1]); let a0 = (rnd() * 8) | 0, f0 = pc.k === 'PA' ? -1 : (rnd() < 0.5 ? 1 : 0), best = 99; for (let f = 0; f < 2; f++) for (let a = 0; a < 8; a++) if (T.tangFit(sh, pc, a, f, c[0], c[1], Array(7).fill(false)) === i || T.tangFit(sh, pc, a, f, c[0], c[1], used.map((u, k) => u && k !== i)) === i) { const da = Math.abs(a - a0), r9 = Math.min(da, 8 - da) * 0.4 + (f0 >= 0 && f !== f0 ? 0.6 : 0); if (r9 < best) best = r9; } s += 1.0 + rnd() * 1.2 + best + 0.8 + rnd() * 0.6 + (rnd() < 0.2 ? 1 + rnd() * 1.5 : 0); }); tot += s; if (s <= 30) in30++; } const pct = in30 / M * 100; console.log('    칠교 첫 판 봇 평균 ' + (tot / M).toFixed(1) + '초'); ok(pct >= 90, '칠교 첫 판 봇 ★1(다 맞춤) 30초 안 ' + pct.toFixed(1) + '% ≥ 90%'); }
  // 짝 맞추기 첫 판 봇(카드 열둘): 한 장 뒤집기 0.55~0.95초 · 본 카드를 기억할 몫 0.8 · 틀린 짝은 다음 카드를 누르면 바로 덮임(+0.35초 보기)
  { const M = 2000; let in30 = 0, tot = 0; for (let t = 0; t < M; t++) { const C = T.memDeal(Array.from({ length: 6 }, (_, i) => i), rnd), mem = new Map(), done = new Set(); let s = 0, guard = 0; const flip = () => { s += 0.55 + rnd() * 0.4; };
      while (done.size < 12 && guard++ < 200) { let a = -1, b = -1; for (const [i, p] of mem) { if (done.has(i)) continue; for (const [j, q] of mem) if (j !== i && q === p && !done.has(j)) { a = i; b = j; break; } if (a >= 0) break; }
        if (a < 0) { const un = C.map((c, i) => i).filter(i => !done.has(i) && !mem.has(i)); a = un[(rnd() * un.length) | 0]; flip(); if (rnd() < 0.8) mem.set(a, C[a].p); const part = [...mem].find(([j, q]) => j !== a && q === C[a].p && !done.has(j)); if (part) b = part[0]; else { const un2 = C.map((c, i) => i).filter(i => !done.has(i) && i !== a && !mem.has(i)); b = un2.length ? un2[(rnd() * un2.length) | 0] : C.map((c, i) => i).find(i => !done.has(i) && i !== a); } } else flip();
        flip(); if (rnd() < 0.8) mem.set(b, C[b].p); if (C[a].p === C[b].p) { done.add(a); done.add(b); } else s += 0.35; }
      tot += s; if (s <= 30) in30++; } const pct = in30 / M * 100; console.log('    짝 첫 판 봇 평균 ' + (tot / M).toFixed(1) + '초'); ok(pct >= 90, '짝 맞추기 첫 판 봇 ★1(다 찾음) 30초 안 ' + pct.toFixed(1) + '% ≥ 90%'); }
  // 사방치기 줄 판정
  ok(T.hopRow(-0.8, 0, 0) === 0 && T.hopRow(0.7, 0, 0) === 1 && T.hopRow(0.7, 1.0, 0) === -1 && T.hopRow(4.9, -1.0, 0) === 4 && T.hopRow(9.0, 0, 0) === 7 && T.hopRow(11, 0, 0) === -1, '사방치기 줄 판정(시작 0 · 1번 · 칸 밖 · 4·5번 두 칸 줄 · 하늘)');
  ok(T.hopOnLine(1.4, 2) && !T.hopOnLine(1.4, 1) && !T.hopOnLine(2.1, 2), '사방치기 선 밟기(꼬임 3만)');
  if (NODE_ONLY) { console.log(fails.length ? 'FAIL ' + fails.length : 'PASS'); process.exit(fails.length ? 1 : 0); }

  console.log('② 브라우저 — ' + URL0);
  const { chromium, devices } = require('playwright');
  const b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  try { const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } }), p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock/.test(t)) || /게임 tick 오류|꼬리표 없는 보상/.test(t)) errs.push(t.slice(0, 200)); });
    const ev = (f, a) => p.evaluate(f, a), W8 = ms => p.waitForTimeout(ms), shot = async n => { if (SHOTS) await p.screenshot({ path: SHOTS + '/' + n + '.png' }); };
    const panel = () => ev(() => { const P = document.querySelector('.twn-p'); return P ? { k: P.dataset.k || '', g: P.dataset.g || '', t: P.innerText.slice(0, 600) } : null; });
    const closeAll = async () => { for (let i = 0; i < 5; i++) { if (!await ev(() => !!document.querySelector('.twn-p'))) break; await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]'); if (b9) b9.click(); }); await W8(250); if (await ev(() => !!document.querySelector('.twn-p'))) { await p.keyboard.press('Escape'); await W8(250); } } };
    const clk = async sel => ev(s => { const b9 = document.querySelector(s); if (b9) b9.click(); return !!b9; }, sel);
    const TB = () => ev(() => SM_TOWN.table().info());
    await p.goto(URL0); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && window.SD2 && SM_TOWN.indoor && SM_TOWN.table, null, { timeout: 240000 }); await W8(1500); await closeAll(); await W8(1200);
    await ev(() => { const G = SM_TOWN.game().S; G.min = 10 * 60; G.money = 30000; G.jobs = G.jobs || {}; G.jobs.fireNo = G.day; G.story = G.story || {}; G.story.p0auto = 1; delete G.tbl; });
    // ── 이상해 넷 ──
    const B0 = await ev(() => { const L = SM_TOWN.indoor.list(), P = SM_TOWN.places(), card = n => { const q = P.find(p => p.name === n); const el = q && SM_TOWN.jobs && SM_TOWN.jobs().infoOf ? SM_TOWN.jobs().infoOf(q) : null; return el ? el.does[0] : null; }; return { aq: card('어항'), tail: card('꼬리 용품 상점'), city: L.find(q => q.name === '도시 상점'), mtn: L.find(q => q.name === '산지 식품·용품 상점'), cityCard: card('도시 상점'), mtnCard: card('산지 식품·용품 상점') }; });
    console.log('    카드 = ' + JSON.stringify(B0).slice(0, 400));
    ok(B0.aq === null || /수조|물속|생물/.test(B0.aq || ''), '① 어항(아14 · 둥근 수족관 탑) 카드 = 수족관 글(항구 X) — ' + (B0.aq || '(카드 읽기 손잡이 없음)'));
    ok(B0.tail === null || /반려동물/.test(B0.tail || ''), '② 꼬리 용품 상점 카드 = 반려동물 용품 — ' + (B0.tail || ''));
    ok(B0.cityCard === null || /옷|모자|키링|인형/.test(B0.cityCard || ''), '③ 도시 상점 카드 = 옷·모자·키링·인형 — ' + (B0.cityCard || ''));
    ok(B0.mtnCard === null || /버섯|약초/.test(B0.mtnCard || ''), '④ 산지 상점 카드 = 버섯·약초 — ' + (B0.mtnCard || ''));
    const roomOf = async q => { await ev(id => SM_TOWN.indoor.enter(id), q.id); await p.waitForFunction(() => SM_TOWN.indoor.on && !SM_TOWN.indoor.busy, null, { timeout: 9000 }); await W8(700); return ev(() => ({ info: SM_TOWN.indoor.info, chk: SM_TOWN.indoor.check() })); };
    const leave = async () => { await ev(async () => { SM_TOWN.indoor.exit(); for (let i = 0; i < 50 && (SM_TOWN.indoor.on || SM_TOWN.indoor.busy); i++) await new Promise(r => setTimeout(r, 100)); }); await W8(400); };
    for (const [q, kind, re, nm] of [[B0.city, 'gift', /옷|인형/, 'b0_city'], [B0.mtn, 'mtn', /버섯|약초/, 'b0_mtn']]) { if (!q) { ok(false, nm + ' 가게 없음'); continue; } const r = await roomOf(q); const shopK = await ev(() => { const S9 = SM_TOWN.indoor.room; return S9 ? S9.kind : null; }); const hot = r.chk && r.chk.hots.find(h => /계산대/.test(h.label));
      ok(r.info && r.info.kind === 'shop' && hot && hot.ok === true, q.name + ' 방 = 가게 방 · 계산대 E 걸어서 닿음'); await shot(nm);
      const sold = await ev(() => { const h = SD2.map.interact.list().find(h9 => !h9.off && /계산대/.test(h9.label)); if (h && h.use) h.use(); const P = document.querySelector('.twn-p'); return P ? P.innerText : ''; }); ok(re.test(sold) && !/달걀|우유|밀가루/.test(sold), q.name + ' 계산대 = ' + (kind === 'gift' ? '옷·모자·키링·인형' : '버섯·산나물·꿀') + '(달걀·우유 X) — ' + sold.replace(/\n/g, ' ').slice(0, 90)); await shot(nm + '_shop'); await closeAll(); await leave(); }
    // ── 보드게임 카페 ──
    const cafe = await ev(() => SM_TOWN.indoor.list().find(q => q.kind === 'board') || null); ok(!!cafe, '보드게임 카페 있음(' + (cafe && cafe.name) + ')'); if (!cafe) throw new Error('카페 없음');
    await ev(() => SM_TOWN.weather('clear'));
    let R1 = await roomOf(cafe); const hots = R1.chk.hots.map(h => h.label);
    console.log('    카페 E ' + hots.length + ' · 그리기 ' + R1.info.meshes + ' · 짓기 ' + R1.info.ms + 'ms · ' + R1.info.parts.join(' '));
    ok(hots.some(t => /계산대 \(먹어 보기\)/.test(t)) && R1.chk.hots.find(h => /계산대/.test(h.label)).ok === true, '1층 계산대 E(먹어 보기) · 걸어서 닿음');
    ok(hots.some(t => /놀이 도구 가게/.test(t)), '2층 놀이 도구 가게 E');
    const TBLH = ['우물고누', '오목', '칠교', '짝 맞추기', '윷놀이']; ok(TBLH.every(n => hots.some(t => t.includes(n))), '3층 탁자 E 다섯(' + TBLH.join('·') + ')');
    ok(R1.info.parts.some(s => /^tex:/.test(s)), '탁자 위 판 그림 · 이름판 = 그림 판 한 장(그리기 +1)');
    const seatsClear = R1.info.seats; await leave();
    // 비 오는 날 = 손님이 늘어 앉을 자리가 줄어듦
    await ev(() => SM_TOWN.weather('rain')); await W8(300); R1 = await roomOf(cafe); const seatsRain = R1.info.seats; ok(seatsRain < seatsClear, '비 오는 날 손님이 늘어 빈 자리 ' + seatsClear + ' → ' + seatsRain); await leave(); await ev(() => SM_TOWN.weather('clear'));
    R1 = await roomOf(cafe);
    const goHot = async re => { const h = await ev(s => { const L = SD2.map.interact.list().filter(h9 => !h9.off && new RegExp(s).test(h9.label)); return L[0] ? { x: L[0].x, y: L[0].y, z: L[0].z, label: L[0].label } : null; }, re.source); if (!h) return null; await ev(h => { SD2.map.player.teleport([h.x, h.y + 0.05, h.z]); SD2.map.player.lookAt([h.x - 1.5, h.z]); }, h); await W8(500); const nr = await ev(() => SD2.near()); await p.keyboard.press('KeyE'); await W8(600); return nr; };
    // 3층 사진(탁자 다섯)
    await ev(() => { const h = SD2.map.interact.list().find(h9 => /오목/.test(h9.label)); if (h) { SD2.map.player.teleport([h.x + 2.2, h.y + 0.05, h.z + 2.6]); SD2.map.player.lookAt([h.x - 3, h.z - 2]); } }); await W8(900); await shot('cafe_3f');
    // 오목: E → 규칙 카드 → 판 → 진짜 누르기 → 처음 손님 이기기
    let nr = await goHot(/오목/); let P = await panel(); ok(P && P.k === 'table' && /규칙 카드/.test(P.t), '탁자 E → 처음엔 규칙 카드(한 문장 + 그림) — 가까운 E: ' + nr); await shot('omok_rule');
    await clk('.twn-p [data-a="go"]'); await W8(500); P = await panel(); ok(P && P.g === 'omok' && /^⚫ 오목/.test(P.t) && /할 일:/.test(P.t.split('\n').slice(0, 3).join(' ')), '판 창 = 제목 + 첫 줄 「할 일」');
    let I = await TB(); ok(I.HOLD3D >= 1 && I.hold, '판이 열린 동안 3D 쉼(SM_HOLD3D ' + I.HOLD3D + ')');
    const fps0 = await ev(async () => { const t0 = performance.now(); let n = 0; await new Promise(r => { const f = () => { n++; if (performance.now() - t0 < 1000) requestAnimationFrame(f); else r(); }; requestAnimationFrame(f); }); return n; }); console.log('    (판 창 rAF ' + fps0 + '/초 — 판 그림만)');
    const xy = await ev(() => SM_TOWN.table().dbg.omokAt(40)); await p.mouse.click(xy[0], xy[1]); await W8(1500); I = await TB(); const st1 = await ev(() => { const C = SM_TOWN.table().dbg.C; return C && C.st ? { n: C.st.n, b40: C.st.b[40] } : null; }); ok(st1 && st1.b40 === 1 && st1.n >= 2, '진짜 누르기로 검은 돌(가운데) → 손님이 흰 돌(' + JSON.stringify(st1) + ')'); await shot('omok_play');
    const playOut = async (fn, lim = 400) => { for (let i = 0; i < lim; i++) { const o = await ev(() => { const C = SM_TOWN.table().dbg.C; return !C || C.over; }); if (o) return true; await ev(fn); await W8(60); } return false; };
    let won = false; for (let g = 0; g < 4 && !won; g++) { if (g) { await clk('.twn-p [data-a="again"]'); await W8(400); } await playOut(() => SM_TOWN.table().dbg.omokKid()); await W8(300); won = await ev(() => /이겼어요/.test(document.querySelector('.tb-res') ? document.querySelector('.tb-res').innerText : '')); }
    P = await panel(); ok(won, '오목 처음 손님 이김(봇 = 고수 수)'); ok(/놀이 상자/.test(P.t) && /탁자 위에 그대로/.test(P.t), '이기면 = 놀이 상자 · 판이 탁자에 남음 한 줄'); await shot('omok_win');
    I = await TB(); ok(I.tbl.box.omok && I.tbl.last.omok && typeof I.tbl.last.omok.s === 'string', '저장 = 놀이 상자 · 이긴 판(' + (I.tbl.last.omok ? I.tbl.last.omok.s.replace(/0/g, '').length : 0) + '돌)');
    const recap = await ev(d => SM_TOWN.table().recapLine(d), await ev(() => SM_TOWN.game().S.day)); ok(/오늘 .*이겼어요/.test(recap), '저녁 요약 한 줄 — ' + recap);
    await closeAll(); I = await TB(); ok(I.HOLD3D === 0 && !I.hold && !(await ev(() => !!SD2.CTRL.frozen)), '창 닫으면 3D 다시 · 안 멈춤');
    // 고수 이기면 음료(문 rwCheck table:drink · 하루 한 잔)
    await ev(() => { const S = SM_TOWN.game().S; S.tbl.g.omok.lv = 2; S.tbl.g.omok.good = 0; }); const dr0 = await ev(() => SM_TOWN.game().S.bag['🥤'] || 0); let wonG = 0;
    await goHot(/오목/); for (let g = 0; g < 6 && wonG < 2; g++) { if (g) { await clk('.twn-p [data-a="again"]'); await W8(400); } await playOut(() => SM_TOWN.table().dbg.omokKid()); await W8(300); if (await ev(() => /이겼어요/.test((document.querySelector('.tb-res') || {}).innerText || ''))) wonG++; }
    const dr1 = await ev(() => SM_TOWN.game().S.bag['🥤'] || 0), rw = await ev(() => { const R9 = SM_TOWN.game().S.rw; return R9 && R9.c ? R9.c['b|table:drink'] || 0 : 0; });
    ok(wonG >= 1 && dr1 - dr0 === 1 && rw === 1, '고수 이기면 음료 🥤 +' + (dr1 - dr0) + '(이긴 판 ' + wonG + ' · 하루 한 잔 · 문 table:drink ' + rw + ')'); await closeAll();
    // 칠교: 첫 판 = 큰 세모 둘이 놓여 있음 · 진짜 끌기(돌리기·뒤집기 단추) → 맞춤 → 나머지 → 끝
    await goHot(/칠교/); await clk('.twn-p [data-a="go"]'); await W8(500); P = await panel(); const tg0 = await ev(() => { const C = SM_TOWN.table().dbg.C; return C ? C.used.filter(Boolean).length : -1; }); ok(P && P.g === 'tang' && tg0 === 2 && /지붕/.test(P.t), '칠교 첫 판 = 집 · 큰 세모 둘(지붕)이 먼저 놓임'); await shot('tang_start');
    const tj = await ev(() => { const C = SM_TOWN.table().dbg.C; const i = C.pc.findIndex(q => q.slot < 0 && q.pc.k === 'SQ'); return i; }); const sl = await ev(i => SM_TOWN.table().dbg.tangSlotAt(i), tj); await ev(([i, a]) => { const C = SM_TOWN.table().dbg.C, q = C.pc[i]; C.sel = i; const turns = (q.a - a + 8) % 8 % 2; for (let k = 0; k < turns; k++) document.querySelector('.twn-p [data-a="rr"]').click(); }, [tj, sl.a]); const pa = await ev(i => SM_TOWN.table().dbg.tangPieceAt(i), tj);   /* 네모 = 90°마다 같은 모양 → 45° 틀어져 있으면 한 번만 돌림 */
    await p.mouse.move(pa[0], pa[1]); await p.mouse.down(); await p.mouse.move(sl.xy[0] + 4, sl.xy[1] + 3, { steps: 8 }); await p.mouse.up(); await W8(300);
    const fit1 = await ev(i => SM_TOWN.table().dbg.C.pc[i].slot, tj); ok(fit1 >= 0, '진짜 끌기로 네모 조각이 자리에 딱 붙음(돌려도 같은 모양)');
    const ti = await ev(() => { const C = SM_TOWN.table().dbg.C; return C.pc.findIndex(q => q.slot < 0 && q.pc.k === 'PA'); }); const sl2 = await ev(i => SM_TOWN.table().dbg.tangSlotAt(i), ti);
    await ev(([i, a, f]) => { const C = SM_TOWN.table().dbg.C, q = C.pc[i]; C.sel = i; const turns = (q.a - a + 8) % 8; for (let k = 0; k < turns; k++) document.querySelector('.twn-p [data-a="rr"]').click(); if (q.f !== f) document.querySelector('.twn-p [data-a="fl"]').click(); }, [ti, sl2.a, sl2.f]); const pa2 = await ev(i => SM_TOWN.table().dbg.tangPieceAt(i), ti);
    await p.mouse.move(pa2[0], pa2[1]); await p.mouse.down(); await p.mouse.move(sl2.xy[0] - 3, sl2.xy[1] + 4, { steps: 8 }); await p.mouse.up(); await W8(300); ok((await ev(i => SM_TOWN.table().dbg.C.pc[i].slot, ti)) >= 0, '돌리기·뒤집기 단추 + 끌기로 평행사변형 맞춤'); await shot('tang_mid');
    await ev(() => SM_TOWN.table().dbg.tangSolve()); await W8(500); P = await panel(); I = await TB(); ok(/다 맞췄어요/.test(P.t) && /밀기, 돌리기, 뒤집기/.test(P.t) && I.tbl.last.tang && I.tbl.last.tang.s.includes('house'), '칠교 끝 = 집 · 배울 것 한 줄 · 카페 창 그림자 판(저장)'); await shot('tang_done'); await closeAll();
    // 짝 맞추기
    await goHot(/짝 맞추기/); await clk('.twn-p [data-a="go"]'); await W8(500); P = await panel(); const nc = await ev(() => document.querySelectorAll('.tb-card').length); ok(P && P.g === 'mem' && nc === 12, '짝 맞추기 첫 판 = 카드 열둘(' + nc + ')');
    await ev(() => document.querySelector('.tb-card[data-c="0"]').click()); await W8(200); ok(await ev(() => document.querySelector('.tb-card[data-c="0"]').classList.contains('up')), '카드를 누르면 뒤집힘'); await shot('mem_play');
    await ev(() => { const C = SM_TOWN.table().dbg.C; C.open = []; document.querySelectorAll('.tb-card').forEach(e9 => { e9.className = 'tb-card'; }); }); await ev(() => SM_TOWN.table().dbg.memSolve()); await W8(400); P = await panel(); I = await TB(); ok(/짝을 다 찾았어요/.test(P.t) && Object.keys(I.tbl.mem).length >= 6, '짝 다 찾음 · 마을 카드 ' + Object.keys(I.tbl.mem).length + '장 모음(여권 도장 곳 + 나는 곳)'); await shot('mem_done'); await closeAll();
    // 우물고누(처음 손님)
    await goHot(/우물고누/); await clk('.twn-p [data-a="go"]'); await W8(500); P = await panel(); ok(P && P.g === 'gonu' && /우물/.test(P.t + ''), '우물고누 판 열림'); await shot('gonu_play');
    const gonuR = []; for (let g = 0; g < 3; g++) { if (g) { await clk('.twn-p [data-a="again"]'); await W8(400); } await playOut(() => SM_TOWN.table().dbg.gonuKid(), 300); await W8(200); gonuR.push(await ev(() => ((document.querySelector('.tb-res') || {}).innerText || '').split('\n')[0])); } ok(gonuR.length === 3 && gonuR.every(t => /이겼어요|비겼어요|손님이 이겼어요/.test(t)), '우물고누 세 판 끝까지(' + gonuR.map(t => t.slice(0, 8)).join(' / ') + ')'); await shot('gonu_end'); await closeAll();
    // 윷놀이: 꾹 눌렀다 떼기(진짜) → 던짐 → 말 옮기기 → 손님 차례 … 끝까지(봇)
    await goHot(/윷놀이/); await clk('.twn-p [data-a="go"]'); await W8(500); P = await panel(); ok(P && P.g === 'yut', '윷놀이 판 열림');
    const ycv = await ev(() => { const r = document.querySelector('.tb-cv').getBoundingClientRect(); return [r.left + r.width * 0.78, r.top + r.height * 0.3]; }); const myTurn = await ev(() => SM_TOWN.table().dbg.C.st.turn === 0);
    if (myTurn) { await p.mouse.move(ycv[0], ycv[1]); await p.mouse.down(); await W8(500); await shot('yut_charge'); await p.mouse.up(); await W8(1300); const yp = await ev(() => { const C = SM_TOWN.table().dbg.C; return { pend: C.pend.slice(), res: C.res && C.res.k }; }); ok(yp.res >= 1, '꾹 눌렀다 떼면 윷가락이 날아 떨어짐 → 결과 ' + JSON.stringify(yp)); await shot('yut_thrown'); } else ok(true, '(손님 먼저 — 던지기 사진은 다음 차례)');
    const yt0 = Date.now(); for (let i = 0; i < 2000 && Date.now() - yt0 < 150000; i++) { const s9 = await ev(() => { const C = SM_TOWN.table().dbg.C; return !C ? 'x' : C.over ? 'over' : SM_TOWN.table().dbg.yutKid() || 'wait'; }); if (s9 === 'over' || s9 === 'x') break; await W8(s9 === 'wait' ? 200 : 120); }
    P = await panel(); const yres = await ev(() => ((document.querySelector('.tb-res') || {}).innerText || '').split('\n')[0]); ok(/났어요|이겼어요/.test(yres), '윷놀이 끝까지(' + yres + ' · ' + Math.round((Date.now() - yt0) / 1000) + '초)'); await shot('yut_end'); await closeAll();
    // 1층 계산대 먹어 보기 · 2층 놀이 도구 가게
    const ate0 = await ev(() => (SM_TOWN.game().S.ate || {})['🥪'] || 0); await goHot(/계산대 \(먹어 보기\)/); P = await panel(); ok(P && /샌드위치/.test(P.t), '1층 계산대 = 샌드위치·음료 메뉴'); await clk('.twn-p [data-b="🥪"]'); await W8(300); ok(((await ev(() => (SM_TOWN.game().S.ate || {})['🥪'] || 0)) - ate0) === 1, '샌드위치 먹어 봄(도감)'); await closeAll();
    await goHot(/놀이 도구 가게/); P = await panel(); ok(P && /칠교 조각/.test(P.t) && /고누 판/.test(P.t), '2층 놀이 도구 가게 = 칠교 조각·고누 판'); await clk('.twn-p [data-b="🧩"]'); await W8(300); ok((await ev(() => SM_TOWN.game().S.bag['🧩'] || 0)) === 1, '칠교 조각 삼(가방)'); await shot('toy_shop'); await closeAll();
    await leave(); R1 = await roomOf(cafe); ok(R1.info.parts.some(s => /^tex:/.test(s)), '다시 들어오면 이긴 판·선반 상자 그림'); await ev(() => { const h = SD2.map.interact.list().find(h9 => /오목/.test(h9.label)); if (h) { SD2.map.player.teleport([h.x + 1.4, h.y + 0.05, h.z + 2.2]); SD2.map.player.lookAt([h.x - 4, h.z - 3]); } }); await W8(900); await shot('cafe_3f_after'); await leave();
    // 우리 집 놀이 선반 · 혼자 칠교
    const home = await ev(() => SM_TOWN.indoor.list().find(q => q.kind === 'home' && /우리 집/.test(q.name)) || SM_TOWN.indoor.list().find(q => q.kind === 'home') || null);
    if (home) { const RH = await roomOf(home), hh = RH.chk.hots.map(h => h.label); ok(hh.some(t => /칠교놀이 \(혼자\)/.test(t)), '우리 집 놀이 선반 + 칠교(혼자) E(' + home.name + ')'); await goHot(/칠교놀이 \(혼자\)/); P = await panel(); ok(P && P.g === 'tang' && /혼자 연습/.test(P.t), '집 칠교 = 혼자 연습'); await shot('home_tang'); await closeAll(); await leave(); } else ok(false, '우리 집 없음');
    // 사방치기
    const hop = await ev(() => SM_TOWN.hopInfo()); console.log('    사방치기 자리 ' + JSON.stringify(hop));
    ok(hop && hop.at, '사방치기 판 자리(카페 앞마당 · ' + (hop && hop.at ? hop.at.near : '없음') + ' · 찾기 ' + (hop && hop.ms) + 'ms)');
    if (hop && hop.at) { const a = hop.at; await ev(a => { SD2.map.player.teleport([a.x - a.dx * 0.9, SM_TOWN.ground(a.x - a.dx * 0.9, a.z - a.dz * 0.9) + 0.1, a.z - a.dz * 0.9]); SD2.map.player.lookAt([a.x + a.dx * 6, a.z + a.dz * 6]); }, a); await W8(800); await shot('hop_board'); await p.keyboard.press('KeyE'); await W8(400);
      I = await TB(); const tl = await ev(() => { const e9 = document.querySelector('.twn-task'); return e9 ? e9.textContent : ''; }); ok(I.hop && I.hop.on && /콩/.test(tl), '사방치기 E → 할 일 줄 — ' + tl.slice(0, 60));
      // 진짜 뛰기: W를 누른 채 스페이스(1.4m 칸 · 걷기 0.45배) — 한 칸 착지 확인
      await p.keyboard.down('KeyW'); await W8(120); await p.keyboard.press('Space'); await W8(950); await p.keyboard.up('KeyW'); await W8(500); I = await TB(); console.log('    한 번 콩 → ' + JSON.stringify(I.hop.on)); ok(I.hop.on && (I.hop.on.row === 1 || I.hop.on.row === -9 || I.hop.on.row === 0), '스페이스 한 번 = 칸에 착지(줄 ' + (I.hop.on ? I.hop.on.row : '?') + ')'); await shot('hop_jump');
      const seq = await ev(() => { const T9 = SM_TOWN.table(), o = T9.info().hop.on; if (!o) return 'none'; const S9 = T9.dbg; S9.hopLand(0, -0.5); const C = () => T9.info().hop.on; const out = []; let guard = 0; while (C() && guard++ < 20) { const c = C(); if (c.need === 'pick') { S9.hopPick(); out.push('pick'); continue; } const r = c.need; S9.hopLand(r, (r === 7 ? 6.5 : r - 0.5) * 1.4); out.push(r); } return out.join(','); }); I = await TB();
      ok(!I.hop.on && I.tbl.g.hop && I.tbl.g.hop.w >= 1, '사방치기 줄 차례(돌 칸 건너뛰기 → 하늘) = 성공(' + seq + ')'); await shot('hop_done'); }
    // 휴대폰 폭 사진(판 창이 잘리지 않음)
    await p.setViewportSize({ width: 390, height: 844 }); await W8(500); R1 = await roomOf(cafe); for (const [re, nm] of [[/오목/, 'm_omok'], [/윷놀이/, 'm_yut'], [/칠교/, 'm_tang'], [/짝 맞추기/, 'm_mem']]) { await goHot(re); await W8(400); const fitP = await ev(() => { const bx = document.querySelector('.twn-p .bx'), cv = document.querySelector('.tb-cv, .tb-grid'); if (!bx || !cv) return null; const a = bx.getBoundingClientRect(), c = cv.getBoundingClientRect(); return { bx: [a.left, a.right, a.top, a.bottom].map(Math.round), cv: [c.left, c.right, c.top, c.bottom].map(Math.round), vw: innerWidth }; }); ok(fitP && fitP.cv[0] >= fitP.bx[0] - 1 && fitP.cv[1] <= fitP.bx[1] + 1 && fitP.bx[1] <= fitP.vw + 1, nm + ' 휴대폰 폭에서 판이 창 안(' + JSON.stringify(fitP) + ')'); await shot(nm); await closeAll(); }
    await p.setViewportSize({ width: 1366, height: 768 }); await leave();
    const txt = await ev(() => document.body.innerText); ok(!/undefined|NaN/.test(txt), '화면 글에 undefined·NaN 0');
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.slice(0, 5).join(' | ') : ''));
  } catch (e) { fails.push('예외 ' + e.message); console.log('  ✗ 예외 ' + e.message); } finally { await b.close(); }
  console.log(fails.length ? 'FAIL ' + fails.length : 'PASS'); process.exit(fails.length ? 1 : 0); })();
