// 🎮 놀이 판 크게 시험(PLAY-2 판 크게 · 교사 11-07 '미니게임이 왜 왼아래에 고정되어 있지? 이왕이면 크게 보여도 되지 않나' · 설계 docs/systems/town_play2.md)
//   node tools/harness/town_play2.cjs [마을=ourtown] [포트=8002] [--shots=폴더] [--only=id,id] [--survey] [--nophone]
//   놀이마다 열어서 잰다(크롬북 1366×768 · 휴대폰 세로 390×844 · 가로 844×390):
//     판 놀이(.twn-play) = 가운데 · 큰 판(너비 ≥ 55% 또는 높이 ≥ 80% · 너비 ≤ 80% · 높이 ≤ 92% · 위 알림 띠 비움) · 판을 덮는 것 0 · 뒤 어둡게 · 제목 띠 ✕ · 보이는 글 ≥ 16px · 단추 ≥ 44px · Esc 닫기
//     판 창 놀이(openP) = 가운데 · 글 ≥ 16px · 단추 ≥ 44px · 덮임 0 · 세상 놀이 = 놀이 줄·카드가 위 가운데 · 글 ≥ 20px(카드 ≥ 16px) · 칩·작은 지도와 안 겹침 · 위 목표 줄 숨김
//     덤(크롬북): ✕ = 그만 · 끝 = 결과 한 줄이 크게(≥ 22px) + 다 읽을 만큼 머묾 + E로 바로 닫힘 · 알림은 판 위 띠에(판과 안 겹침) · 가운데 띠는 판이 닫힌 뒤
//     휴대폰: 판이 화면 안 · 가운데 · 조이스틱·행동 단추 숨김(겹침 0) · 글 ≥ 13px(확대 X) · 단추 ≥ 44px · 누워 뜨기 = 세로는 아래·가로는 위 카드(칩·조이스틱 숨김)
//   --survey = 재기만(✗ 없이 표) · --shots = 사진(그리기 켬 · play2_<화면>_<놀이>.png) · 페이지 오류 0
const { chromium, RENDER } = require('./pw.cjs');
const fs = require('fs'), path = require('path');
const pos = process.argv.slice(2).filter(a => !a.startsWith('--')), ID = pos[0] || 'ourtown', PORT = pos[1] || '8002';
const arg = k => { const a = process.argv.find(s => s.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : null; };
const SURVEY = process.argv.includes('--survey'), PHONE = !process.argv.includes('--nophone'), SHOT = arg('shots'), ONLY = arg('only') ? arg('only').split(',') : null;
const URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
if (SHOT) fs.mkdirSync(SHOT, { recursive: true });
/* 글 크기 16px 판정은 15.7부터(offsetWidth가 정수로 반올림돼 생기는 0.3px 어긋남) */
const fails = [], ok = (c, m) => { if (SURVEY) { console.log('  · ' + m); return; } if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };

// 놀이 목록 — open = 페이지 안에서 여는 식(문자열 · 거짓이면 '못 엶') · sel = 판(또는 놀이 줄) · cat = board(판 놀이) | panel(판 창 놀이) | world(세상 놀이)
const W = (k, extra) => `(() => { __clean(); ${extra || ''} return !!SM_TOWN.play('${k}'); })()`;
const K = k => `(() => { __clean(); return !!SM_TOWN.playK('${k}'); })()`;
const RF = k => `(() => { __clean(); const R = SM_TOWN.rf(); if (!R) return false; R.play('${k}'); return !!document.querySelector('.twn-play'); })()`;
const GAMES = [
  { id: 'strawberry', nm: '딸기 따기', cat: 'board', open: W('strawberry') },
  { id: 'shiitake', nm: '표고 따기', cat: 'board', open: W('shiitake') },
  { id: 'cabbage', nm: '배추 거두기', cat: 'board', open: W('cabbage') },
  { id: 'potato', nm: '감자 캐기', cat: 'board', open: W('potato') },
  { id: 'clam', nm: '조개 캐기', cat: 'board', open: '(() => { __clean(); __low(); return !!SM_TOWN.playK("clam"); })()' },
  { id: 'beehive', nm: '꿀 뜨기', cat: 'board', open: W('beehive') },
  { id: 'pear', nm: '배 봉지', cat: 'board', open: W('pear') },
  { id: 'lumber', nm: '어린 나무 심기', cat: 'board', open: W('lumber') },
  { id: 'seaweed', nm: '김 펴기', cat: 'board', open: K('seaweed') },
  { id: 'oyster', nm: '굴 크기 재기', cat: 'board', open: K('oyster') },
  { id: 'plant', nm: '모내기(못줄)', cat: 'board', open: W('paddy', "SM_TOWN.rules.season('spring');") },
  { id: 'cut', nm: '벼 베기', cat: 'board', open: W('paddy', "SM_TOWN.rules.season('autumn');"), after: "SM_TOWN.rules.season('spring')" },
  { id: 'fisher', nm: '부두 줄 낚시', cat: 'board', open: W('fisher') },
  { id: 'saltpan', nm: '염전 소금', cat: 'board', open: W('saltpan') },
  { id: 'tuho', nm: '투호', cat: 'board', open: K('tuho') },
  { id: 'rod', nm: '도구 낚싯대 줄다리기', cat: 'board', open: K('rod') },
  { id: 'cook', nm: '바쁜 부엌', cat: 'board', open: `(async () => { __clean(); const G = SM_TOWN.game(); for (const e of ['🌾', '🥚', '🥛']) G.add(e, 20); SM_TOWN.cook(); await new Promise(r => setTimeout(r, 400)); const b = document.querySelector('.twn-p button[data-r="0"]'); if (b) b.click(); await new Promise(r => setTimeout(r, 400)); return !!document.querySelector('.twn-play'); })()` },
  { id: 'stream', nm: '🔬 물 맑기 살펴보기', cat: 'board', open: RF('stream') },
  { id: 'bend', nm: '굽은 강', cat: 'board', open: RF('bend') },
  { id: 'paddylife', nm: '논 생물', cat: 'board', open: RF('paddylife') },
  { id: 'terrace', nm: '다랑이 논 물꼬', cat: 'board', open: RF('terrace') },
  // 판 창(openP) 놀이 — 원래 가운데 창 · 남는 자리가 있으면 키움(그림 판 든 창은 제 맞춤)
  ...[['omok', '오목'], ['gonu', '우물고누'], ['tang', '칠교'], ['mem', '짝 맞추기'], ['yut', '윷놀이']].map(([g, n]) => ({ id: 'tb_' + g, nm: '보드게임 카페 ' + n, cat: 'panel', sel: '.twn-p', open: `(async () => { __clean(); const T = SM_TOWN.table(); if (!T) return 'no table'; T.open('${g}', {}); await new Promise(r => setTimeout(r, 300)); const b = document.querySelector('.twn-p [data-a="go"]'); if (b) b.click(); await new Promise(r => setTimeout(r, 400)); return !!document.querySelector('.twn-p'); })()` })),
  { id: 'janggu', nm: '장구 배우기', cat: 'panel', sel: '.twn-p', open: '(() => { __clean(); const J = SM_TOWN.janggu(); return J ? J.open("learn") !== false : "no janggu"; })()' },
  { id: 'bake', nm: '제빵(주문 쪽지)', cat: 'panel', sel: '.twn-p', open: '(() => { __clean(); const B = SM_TOWN.bake(); if (!B) return "no bake"; B.use(); return !!document.querySelector(".twn-p"); })()' },
  // 세상 놀이 — 세상은 보이고 놀이 줄(위 가운데)·단추가 큼
  { id: 'herd', nm: '양몰이', cat: 'world', sel: '.twn-wcard', open: '(() => { __clean(); return SM_TOWN.herdGo(1, "") !== false; })()', wait: 2500 },
  { id: 'rhy', nm: '모내기 소리(노동요)', cat: 'world', sel: '.twn-wcard', open: '(() => { __clean(); const L = SM_TOWN.rhyW(); return L.length ? SM_TOWN.rhyGo(L[0].i, {}) !== false : false; })()', wait: 2500 },
  { id: 'float', nm: '누워 뜨기', cat: 'world', sel: '.twn-play', open: `(async () => { __clean(); const B = SM_TOWN.beach(), pt = B && B.swimPt(), h = SD2.map.interact.list().find(q => /누워 뜨기|Float on/.test(q.label)); if (!pt || !h) return 'no swim'; SD2.map.player.teleport([pt[0], SM_TOWN.ground(pt[0], pt[1]) + 0.05, pt[1]]); await new Promise(r => setTimeout(r, 700)); h.use(); await new Promise(r => setTimeout(r, 300)); return !!document.querySelector('.twn-play'); })()` },
  { id: 'boat', nm: '배 노 젓기', cat: 'world', sel: '.twn-row', open: `(async () => { __clean(); const h = SD2.map.interact.list().find(q => /^⛵ 배 타기|^⛵ Board/.test(q.label)); if (!h) return 'no boat'; const M = SD2.map; M.player.teleport([h.x, M.q.groundAt(h.x, h.z, SM_TOWN.ground(h.x, h.z) + 2) + 0.05, h.z]); await new Promise(r => setTimeout(r, 600)); SM_TOWN.boatGo(true); await new Promise(r => setTimeout(r, 700)); return !!document.querySelector('.twn-row'); })()`, close: '(() => { try { SM_TOWN.boatGo(false); } catch (e) { /* */ } })()' },
];
const PH = ['strawberry', 'potato', 'tuho', 'cook', 'stream', 'terrace', 'tb_mem', 'janggu', 'herd', 'float'];   /* 휴대폰에서 볼 것(판 · 끌기 · 큰 판 · 그림 판 · 판 창 · 세상 놀이) */

(async () => {
  const T0 = Date.now(), b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }); const errs = [];
  const rows = [];
  try {
    const views = [{ nm: 'cb', w: 1366, h: 768 }].concat(PHONE ? [{ nm: 'ph-p', w: 390, h: 844, m: 1 }, { nm: 'ph-l', w: 844, h: 390, m: 1 }] : []);
    for (const V of views) {
      console.log('── ' + V.nm + ' ' + V.w + '×' + V.h);
      const ctx = await b.newContext({ viewport: { width: V.w, height: V.h }, ...(V.m ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : {}) });
      const p = await ctx.newPage(); p.on('pageerror', e => errs.push(V.nm + ' ' + e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(t)) || /게임 tick 오류|모르는 놀이 갈래/.test(t)) errs.push(V.nm + ' ' + t.slice(0, 200)); });
      const W8 = ms => p.waitForTimeout(ms), ev = (f, a) => p.evaluate(f, a);
      await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.game && SM_TOWN.rules && window.SD2 && SM_TOWN.play && SM_TOWN.pbox, null, { timeout: 240000 }); await W8(1500);
      await ev(() => { const G = SM_TOWN.game(); window.__G = G; if (G.setClock) G.setClock(false); G.S.min = 11 * 60; if (SD2.map.time) SD2.map.time('day'); SM_TOWN.rules.wx('clear'); if (G.S.wx) G.S.wx.auto = false; SM_TOWN.rules.season('spring');
        window.__clean = () => { try { const H9 = SM_TOWN.herd && SM_TOWN.herd(); if (H9 && H9.stop && H9.busy) H9.stop('reset'); const R9 = SM_TOWN.rhy && SM_TOWN.rhy(); if (R9 && R9.busy && R9.stop) R9.stop('reset'); } catch (e) { /* 없음 */ } for (let k = 0; k < 4; k++) { if (SM_TOWN.rules.play()) SM_TOWN.rules.playEnd(0); const P = document.querySelector('.twn-p'); if (!P) break; const b9 = P.querySelector('[data-a="x"]') || P.querySelector('.twn-x'); if (b9) { b9.click(); { const h9 = typeof document !== 'undefined' && document.querySelector('.twn-ld .how3') && document.querySelector('.twn-ld [data-a="x"]'); if (h9) h9.click(); } } else break; } for (const e of document.querySelectorAll('.twn-play')) { const s = e.querySelector('[data-a="x"],.x'); if (s) { s.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); s.click(); } if (e.isConnected) e.remove(); } __G.S.uses = {}; __G.S.min = 11 * 60; };
        window.__low = () => { const sh = SM_TOWN.shore && SM_TOWN.shore(); if (!sh || !sh.low) return true; for (let m = 0; m < 24 * 60; m += 20) { __G.S.min = m; if (sh.low()) return true; } return false; };
        window.__vis = e => { if (!e) return false; const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < 0.05) return false; const q = e.getBoundingClientRect(); return q.width > 1 && q.height > 1; };
        window.__meas = (sel) => { const vw = innerWidth, vh = innerHeight, box = [...document.querySelectorAll(sel)].filter(e => __vis(e)).pop(); if (!box) return null; const pb = box.querySelector('.pb') || box.querySelector('.bx') || box, r = pb.getBoundingClientRect();
          const sc = e => (e.offsetWidth ? e.getBoundingClientRect().width / e.offsetWidth : 1), nm9 = e => (e.className && typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/)[0] : e.tagName.toLowerCase());
          let fMin = 99, fWho = '', sMin = 99; for (const e of [pb, ...pb.querySelectorAll('*')]) { if (!__vis(e)) continue; const t = [...e.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join(''); if (!t) continue;
            if (e instanceof SVGElement) { const f9 = e.getBoundingClientRect().height * 0.8; if (f9 < sMin) sMin = f9; continue; }   /* 그림 속 글(SVG 방위 글자 같은 그림 표지)은 따로 */
            const f = parseFloat(getComputedStyle(e).fontSize) * sc(e); if (f < fMin) { fMin = f; fWho = nm9(e) + ' 「' + t.slice(0, 14) + '」'; } }
          let bMin = 999, bWho = ''; for (const e of pb.querySelectorAll('button,[role=button]')) { if (!__vis(e)) continue; const q = e.getBoundingClientRect(), m = Math.min(q.width, q.height); if (m < bMin) { bMin = m; bWho = (e.textContent || '').trim().slice(0, 10) || nm9(e); } }
          let cov = 0; const who = []; if (getComputedStyle(box).pointerEvents !== 'none') for (let i = 1; i <= 5; i++) for (let j = 1; j <= 5; j++) { const x = r.left + r.width * i / 6, y = r.top + r.height * j / 6; if (x < 0 || y < 0 || x >= vw || y >= vh) { cov++; who.push('화면 밖'); continue; } const t = document.elementFromPoint(x, y); if (t && !box.contains(t) && t !== box) { cov++; who.push(t.id || nm9(t)); } }
          const hud = [...document.querySelectorAll('.gchip,.twn-task,.twn-mini,#loc,#mpEmo,#timeChip')].filter(e => __vis(e) && !box.contains(e)).filter(e => { const q = e.getBoundingClientRect(); return q.left < r.right && q.right > r.left && q.top < r.bottom && q.bottom > r.top; }).map(e => e.id || nm9(e));
          const tch = [...document.querySelectorAll('#tJoyHint,#tJump,#tAct,#tView,#tCrouch')].filter(e => __vis(e)).map(e => e.id);
          const bg = getComputedStyle(box).backgroundColor, al = /rgba\([^)]*,\s*([0-9.]+)\)/.exec(bg);
          return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), r: Math.round(r.right), bt: Math.round(r.bottom), vw, vh, wp: Math.round(r.width / vw * 100), hp: Math.round(r.height / vh * 100), cx: Math.round((r.left + r.width / 2) / vw * 100), cy: Math.round((r.top + r.height / 2) / vh * 100), fMin: +fMin.toFixed(1), fWho, sMin: +sMin.toFixed(1), bMin: Math.round(bMin), bWho, cov, who: [...new Set(who)].slice(0, 4).join(','), hud, tch, x9: !!pb.querySelector('.twn-x'), dim: al ? +al[1] : (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent' ? 0 : 1), goalVis: __vis(document.getElementById('hudGoal')) }; }; });
      for (const G of GAMES) { if (ONLY && !ONLY.includes(G.id)) continue; if (V.m && !PH.includes(G.id)) continue;
        const opened = await ev(G.open).catch(e => 'ERR ' + e.message.slice(0, 120)); await W8(G.wait || 900);
        const sel = G.sel || '.twn-play', m = await ev(s => __meas(s), sel), tag = V.nm + ' ' + G.nm;
        if (!m) { rows.push([V.nm, G.id, G.nm, '못 엶 ' + opened]); ok(false, tag + ' — 판이 안 열림(' + opened + ')'); await ev(() => __clean()); continue; }
        if (SHOT && RENDER) await p.screenshot({ path: path.join(SHOT, 'play2_' + V.nm + '_' + G.id + '.png') });
        rows.push([V.nm, G.id, G.nm, m]);
        const geo = m.x + ',' + m.y + ' ' + m.w + '×' + m.h + '(' + m.wp + '%×' + m.hp + '%)';
        if (G.cat === 'board' && !V.m) {
          ok(Math.abs(m.cx - 50) <= 2 && m.cy >= 48 && m.cy <= 58 && m.y >= 50 && m.bt <= m.vh - 6, tag + ' — 가운데 · 위 알림 띠 비움 ' + geo);
          ok((m.wp >= 55 || m.hp >= 80) && m.wp <= 80 && m.hp <= 92, tag + ' — 큰 판(너비 ≥55% 또는 높이 ≥80%)');
          ok(m.cov === 0 && !m.hud.length, tag + ' — 판을 덮는 것 0' + (m.cov ? ' (' + m.who + ')' : '') + (m.hud.length ? ' HUD ' + m.hud.join(',') : ''));
          ok(m.dim >= 0.25, tag + ' — 뒤 세상 어둡게(' + m.dim + ')');
          ok(m.x9, tag + ' — 제목 띠 ✕');
          ok(m.fMin >= 15.7, tag + ' — 가장 작은 글 ' + m.fMin + 'px ' + m.fWho + (m.sMin < 99 ? ' · 그림 속 글 ' + m.sMin + 'px' : ''));
          ok(m.bMin >= 44, tag + ' — 가장 작은 단추 ' + m.bMin + 'px ' + m.bWho);
        } else if (G.cat === 'board') {
          ok(m.x >= 0 && m.r <= m.vw && m.y >= 0 && m.bt <= m.vh && Math.abs(m.cx - 50) <= 3, tag + ' — 화면 안 · 가운데 ' + geo);
          ok(!m.tch.length, tag + ' — 조이스틱·행동 단추 숨김' + (m.tch.length ? ' (보임: ' + m.tch.join(',') + ')' : ''));
          ok(m.cov === 0, tag + ' — 판을 덮는 것 0' + (m.cov ? ' (' + m.who + ')' : ''));
          ok(m.fMin >= 13, tag + ' — 가장 작은 글 ' + m.fMin + 'px ' + m.fWho);
          ok(m.bMin >= 44, tag + ' — 가장 작은 단추 ' + m.bMin + 'px ' + m.bWho);
        } else if (G.cat === 'panel') {
          ok(Math.abs(m.cx - 50) <= 2 && Math.abs(m.cy - 50) <= 3 && m.cov === 0, tag + ' — 가운데 · 덮임 0 ' + geo);
          if (!V.m) { ok(m.fMin >= 15.7, tag + ' — 가장 작은 글 ' + m.fMin + 'px ' + m.fWho); ok(m.bMin >= 44, tag + ' — 가장 작은 단추 ' + m.bMin + 'px ' + m.bWho); }
          else ok(m.x >= 0 && m.r <= m.vw && m.y >= 0 && m.bt <= m.vh, tag + ' — 화면 안');
        } else if (G.id === 'float') {
          const port = V.m && V.h > V.w; ok(Math.abs(m.cx - 50) <= 3 && (port ? m.cy >= 60 : m.cy <= 32) && m.dim === 0, tag + ' — ' + (port ? '아래' : '위') + ' 가운데 카드(내 몸이 보이게) · 어둡게 X ' + geo);
          ok(m.fMin >= (V.m ? 13 : 15.7) && !m.goalVis, tag + ' — 글 ' + m.fMin + 'px · 위 목표 줄 숨김(' + !m.goalVis + ')');
          ok(!m.hud.length && !m.tch.length, tag + ' — 칩·작은 지도·조이스틱과 안 겹침' + (m.hud.length || m.tch.length ? ' (' + m.hud.concat(m.tch).join(',') + ')' : ''));
        } else if (G.cat === 'world' && G.id !== 'boat') {
          ok(Math.abs(m.cx - 50) <= 3 && m.cy <= (V.m ? 18 : 10), tag + ' — 놀이 줄 = 위 가운데 ' + geo);
          ok(m.fMin >= (V.m ? 14 : 20), tag + ' — 놀이 줄 글 ' + m.fMin + 'px');
          ok(!m.hud.length, tag + ' — 칩·작은 지도·할 일 줄과 안 겹침' + (m.hud.length ? ' (' + m.hud.join(',') + ')' : ''));
          ok(!m.goalVis, tag + ' — 위 목표 줄 잠깐 숨김(놀이 줄이 그 자리)');
        } else if (G.id === 'boat') ok(m.fMin >= 16 && Math.abs(m.cx - 50) <= 3, tag + ' — 노 젓기 띠 가운데 · 글 ' + m.fMin + 'px');
        console.log('    ' + JSON.stringify({ geo, f: m.fMin, s: m.sMin, b: m.bMin, z: await ev(() => SM_TOWN.pbox()) }));
        // 덤(크롬북 · 판 놀이 몇 개): ✕ · 끝 결과 · 알림 띠 · 가운데 띠
        if (!V.m && G.id === 'strawberry') {
          const tb = await ev(() => { SM_TOWN.read.toast('🧪 시험 알림 — 판 위 띠', 3); const t = document.getElementById('toast'), pb = document.querySelector('.twn-play .pb'); const a = t.getBoundingClientRect(), c = pb.getBoundingClientRect(); return { tb: Math.round(a.bottom), pt: Math.round(c.top), zt: +getComputedStyle(t).zIndex || 0, zb: +getComputedStyle(document.querySelector('.twn-play')).zIndex || 0, vis: __vis(t) }; });
          ok(tb.vis && tb.tb <= tb.pt + 2 && tb.zt > tb.zb, V.nm + ' 알림 = 판 위 띠(알림 아래 ' + tb.tb + ' ≤ 판 위 ' + tb.pt + ' · z ' + tb.zt + ' > ' + tb.zb + ')');
          await ev(() => SM_TOWN.read.ban('🧪 시험 가운데 띠', 2)); await W8(500); const b1 = await ev(() => { const e = document.getElementById('hudBan'); return !!(e && e.style.display !== 'none' && /시험 가운데 띠/.test(e.textContent)); });
          await ev(() => { const x = document.querySelector('.twn-play .twn-x'); if (x) x.click(); }); await W8(700); const xGone = await ev(() => !document.querySelector('.twn-play'));
          ok(xGone, V.nm + ' 제목 띠 ✕ = 그만(판 닫힘)');
          let b2 = false; for (let i = 0; i < 16 && !b2; i++) { await W8(250); await ev(() => { const P = document.querySelector('.twn-p'); if (P) { const x = P.querySelector('[data-a="x"],.twn-x'); if (x) x.click(); { const h9 = typeof document !== 'undefined' && document.querySelector('.twn-ld .how3') && document.querySelector('.twn-ld [data-a="x"]'); if (h9) h9.click(); } } }); b2 = await ev(() => { const e = document.getElementById('hudBan'); return !!(e && e.style.display !== 'none' && /시험 가운데 띠/.test(e.textContent)); }); }   /* 판 뒤에 다른 창(쪽지 등)이 열리면 그 창이 닫힌 뒤(원래 규칙) */
          ok(!b1 && b2, V.nm + ' 가운데 띠 = 판이 떠 있는 동안 기다렸다가 닫힌 뒤에(판 동안 ' + b1 + ' · 닫힌 뒤 ' + b2 + ')' + (b2 ? '' : ' ' + JSON.stringify(await ev(() => SM_TOWN.read.stat()))));
          await ev(() => __clean()); await W8(300); continue;
        }
        if (!V.m && (G.id === 'potato' || G.id === 'lumber')) {
          const fin = await ev(() => SM_TOWN.lad().finish(3, 5)); await W8(400);
          const R = await ev(() => { const e = document.querySelector('.twn-play .msg .mgres'); if (!e || !__vis(e)) return null; const f = parseFloat(getComputedStyle(e).fontSize) * (e.getBoundingClientRect().width / (e.offsetWidth || 1)); return { f: +f.toFixed(1), t: document.querySelector('.twn-play .msg').textContent.slice(0, 60) }; });
          if (SHOT && RENDER) await p.screenshot({ path: path.join(SHOT, 'play2_' + V.nm + '_' + G.id + '_end.png') });
          ok(fin && R && R.f >= 22, V.nm + ' ' + G.nm + ' 끝 = 결과 한 줄이 크게(' + (R ? R.f + 'px 「' + R.t + '」' : '없음') + ')');
          await W8(2300); const still = await ev(() => !!document.querySelector('.twn-play .pb.mg-end'));
          ok(still, V.nm + ' ' + G.nm + ' 끝 글이 다 읽을 만큼 머묾(2.7초 뒤에도 그대로)');
          await p.keyboard.press('KeyE'); let gone = false; for (let i = 0; i < 6 && !gone; i++) { await W8(250); gone = await ev(() => !document.querySelector('.twn-play')); }
          ok(gone, V.nm + ' ' + G.nm + ' 끝 글을 읽은 뒤 E = 바로 닫힘');
          await ev(() => __clean()); await W8(300); continue;
        }
        await p.keyboard.press('Escape'); let gone = false; for (let i = 0; i < 8 && !gone; i++) { await W8(200); gone = await ev(s => ![...document.querySelectorAll(s)].some(e => __vis(e)), sel); }
        if (G.cat === 'board') ok(gone, tag + ' — Esc = 그만(판 닫힘)'); else if (!gone) console.log('    (Esc로 안 닫힘 — ' + G.cat + ')');
        if (G.close) await ev(G.close); await ev(() => __clean()); if (G.after) await ev(G.after); await W8(300);
        if (G.cat === 'world' && G.id !== 'boat') { const left = await ev(() => ({ card: SM_TOWN.pbox().card, wp: document.body.classList.contains('h-wplay'), goal: getComputedStyle(document.getElementById('hudGoal') || document.body).visibility })); ok(!left.card && !left.wp, tag + ' — 끝나면 놀이 줄 사라지고 위 목표 줄 돌아옴'); }
        if (G.cat === 'board') { const left = await ev(() => ({ pb: document.body.classList.contains('h-pbox') })); if (left.pb) { await W8(700); } const l2 = await ev(() => document.body.classList.contains('h-pbox')); ok(!l2, tag + ' — 판이 닫히면 꼬리표(h-pbox) 풀림'); }
      }
      await ctx.close();
    }
  } catch (e) { fails.push('예외 ' + e.message.slice(0, 160)); console.log('  ✗ 예외 ' + e.message.slice(0, 300)); }
  finally {
    console.log('\n| 화면 | 놀이 | 자리(x,y) | 크기(w×h) | 너비% | 높이% | 가운데(x%,y%) | 가장 작은 글 | 가장 작은 단추 |');
    for (const r of rows) { const m = r[3]; if (typeof m === 'string') { console.log('| ' + r[0] + ' | ' + r[2] + ' | ' + m + ' |'); continue; } console.log('| ' + r[0] + ' | ' + r[2] + ' | ' + m.x + ',' + m.y + ' | ' + m.w + '×' + m.h + ' | ' + m.wp + ' | ' + m.hp + ' | ' + m.cx + ',' + m.cy + ' | ' + m.fMin + 'px ' + m.fWho + ' | ' + m.bMin + 'px ' + m.bWho + ' |'); }
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.slice(0, 4).join(' | ') : ''));
    await b.close(); console.log((fails.length ? '❌ ' + fails.length + '개 실패' : '✅ 통과') + ' · ' + ((Date.now() - T0) / 1000).toFixed(0) + '초'); process.exit(fails.length ? 1 : 0); }
})();
