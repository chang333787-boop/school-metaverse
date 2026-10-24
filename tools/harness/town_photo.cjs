// 마을 사진 기자 시험(PHOTO-2 · docs/systems/town_jobs2.md 「다음 다섯 — 사진 기자」): node tools/harness/town_photo.cjs [마을=ourtown] [포트=8002] [--shots=폴더]
//   동물 곁으로 가서 K(📷 기사 사진) → 기사 쪽지(담긴 것 · 알아 두기 · 다음에 해 볼 것) · 쉬는 모습과 놀라 달아나는 모습 = 다른 말 · 행동 아홉 갈래 글이 모두 다름
//   · 작은 도서관 소식지 편집장 E → 기사 내기 = 기사료·솜씨 · 같은 동물 같은 날 다시 = 막힘(문 rwCheck 'photo:<동물>') · 다음 날 = 다시 실림 · 앨범 '내 기사' · 셔터 비용 ms · 페이지 오류 0
//   브라우저는 한 자리로 돌림(brun.sh · 맥 과열 X)
const { chromium } = require('./pw.cjs');   /* FAST-1: 기본 그리기 끔(norender) · 사진·프레임은 --render(docs/systems/town_gates.md) */
const pos = process.argv.slice(2).filter(a => !a.startsWith('--')), ID = pos[0] || 'ourtown', PORT = pos[1] || '8002', URL = 'http://127.0.0.1:' + PORT + '/v2/?town=' + ID + '&adapt=0&all=1';
const SHOTS = (process.argv.find(a => a.startsWith('--shots=')) || '').slice(8);
const fails = [], ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '  ✓ ' : '  ✗ ') + m); };
(async () => { const T0 = Date.now(), b = await chromium.launch({ args: ['--use-gl=angle', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] }); const errs = [];
  try { const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage(); p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { const t = m.text(); if ((m.type() === 'error' && !/favicon|404|ERR_|pointer lock|WebGL|GPU stall/.test(t)) || /게임 tick 오류|photo onFrame/.test(t)) errs.push(t.slice(0, 200)); });
    const W8 = ms => p.waitForTimeout(ms), ev = (f, a) => p.evaluate(f, a), shot = async n => { if (SHOTS) await p.screenshot({ path: SHOTS.replace(/\/$/, '') + '/' + n + '.png' }); };
    const pic = async n => { if (!SHOTS) return; const b64 = await ev(async () => { const d = await new Promise((res, rej) => { const r = indexedDB.open('sm-photos', 1); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); const L = await new Promise(res => { const q = d.transaction('p').objectStore('p').getAll(); q.onsuccess = () => res(q.result); }); d.close(); L.sort((a, b) => b.t - a.t); if (!L.length) return null; const buf = await L[0].b.arrayBuffer(); let s = ''; const u = new Uint8Array(buf); for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return btoa(s); });
      if (b64) require('fs').writeFileSync(SHOTS.replace(/\/$/, '') + '/' + n + '.jpg', Buffer.from(b64, 'base64')); };   /* 찍힌 사진 그대로(320×180) */
    await p.goto(URL); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.wild && SM_TOWN.wild() && SM_TOWN.press && window.SD2, null, { timeout: 240000 }); await W8(1500);
    await ev(() => { const b9 = document.querySelector('.twn-p [data-a="x"]') || document.querySelector('.twn-p button'); if (b9) b9.click(); }); await p.keyboard.press('Escape'); await W8(800);
    await ev(() => { const G = typeof SM_TOWN.game === 'function' ? SM_TOWN.game() : SM_TOWN.game; window.__G = G.S ? G : { S: G }; if (window.__G.setClock) window.__G.setClock(false); });
    const at = (min, ph) => ev(([m, k]) => { __G.S.min = m; if (SD2.map.time) SD2.map.time(k); SM_TOWN.rules.wx('clear'); }, [min, ph]);
    const sec = () => ev(() => SM_TOWN.wild().sec()), reset = () => ev(() => SM_TOWN.wild().reset()), PI = () => ev(() => SM_TOWN.press().info());
    const shut = () => ev(() => { for (let i = 0; i < 3; i++) { const P = document.querySelector('.twn-p'); if (!P) return; const b9 = P.querySelector('[data-a="x"]') || [...P.querySelectorAll('button')].find(e => /그대로|닫기|Keep|Close/.test(e.textContent)); if (b9) b9.click(); else return; } });
    const near = (j, d, look = true) => ev(([j9, d9, lk]) => { const s = SM_TOWN.wild().info().spots[j9], fl9 = /mallard|spotbill/.test(s.id), ok9 = (x, z) => SM_TOWN.sd(x, z) > 0.4 && !SD2.map.q.blocked(x, z, SM_TOWN.ground(x, z) + 0.3);
      for (let k = 0; k < 48; k++) { const a = k * 0.7854 * 0.5 + (k >= 16 ? 0.2 : 0), dd = d9 + (k >= 32 ? 1.5 : 0), x = s.hx + Math.cos(a) * dd, z = s.hz + Math.sin(a) * dd; if (!ok9(x, z)) continue; let clear = true; if (!fl9) for (let i = 1; i < 10; i++) { const u = i / 10, xx = x + (s.hx - x) * u * 0.8, zz = z + (s.hz - z) * u * 0.8; if (SD2.map.q.blocked(xx, zz, SM_TOWN.ground(xx, zz) + 0.3) || Math.abs(SM_TOWN.ground(xx, zz) - SM_TOWN.ground(x, z)) > 1.2) { clear = false; break; } } if (!clear) continue;
        SD2.map.player.teleport([x, SM_TOWN.ground(x, z) + 0.05, z]); if (lk) SD2.map.player.lookAt([s.hx, s.hz]); return { x, z, d: dd }; } return null; }, [j, d, look]);
    const spot = j => ev(j9 => SM_TOWN.wild().info().spots[j9], j);
    // K 한 번 → 기사 쪽지가 생겼는가 · 창 글
    const shootK = async () => { const n0 = (await PI()).n; await p.keyboard.press('KeyK'); for (let i = 0; i < 20; i++) { await W8(100); if ((await PI()).n > n0) break; } await W8(350); const I = await PI(); const t = await ev(() => { const P = document.querySelector('.twn-p'); return P ? P.textContent : ''; }); return { made: I.n > n0, a: I.last, t, I }; };
    await at(11 * 60, 'day'); const I0 = await ev(() => SM_TOWN.wild().info()), SP = I0.spots, by = id => SP.filter(s => s.id === id);
    console.log('야생동물 자리 ' + I0.n + ' · ' + [...new Set(SP.map(s => s.id))].map(id => id + ' ' + by(id).length).join(' · '));
    // ── 1. 쉬는 모습: 동물 곁 7m에 서서 K → 기사 쪽지 ──
    console.log('1. 쉬는 모습 찍기');
    let calm = null;
    for (const id of ['heron', 'waterdeer', 'egret', 'chipmunk', 'spotbill', 'mallard', 'frog']) { for (const s of by(id).slice(0, 3)) { await reset(); const r = await near(s.j, 6.5); if (!r) continue; await W8(1400); await sec(); await W8(300); await sec();
        let ch = false; for (let i = 0; i < 15 && !(ch = (await PI()).chip); i++) await W8(100); const q = await spot(s.j); if (!q.act || q.st >= 2) continue; const R = await shootK(); console.log('    ' + id + '#' + s.j + ' ' + r.d.toFixed(1) + 'm → ' + (R.made ? R.a.id + ' ' + R.a.act + ' 화면 ' + R.a.fr : '기사 X') + ' · 칩 ' + ch);
        if (!R.made || R.a.id !== id) { await shut(); continue; }
        calm = { id, j: s.j, a: R.a }; ok(ch === true, '동물 곁 = 📷 기사 사진 칩'); ok(['rest', 'alert', 'walk', 'swim'].includes(R.a.act), id + ': 쉬는 모습으로 담김(' + R.a.act + ')');
        ok(/담긴 것/.test(R.t) && /알아 두기/.test(R.t) && /다음에 해 볼 것/.test(R.t), '기사 쪽지 = 담긴 것 · 알아 두기 · 다음에 해 볼 것'); ok(!/[★⭐]/.test(R.t), '별 점수 없음(말로만)'); ok(/먹이를 주지|멀리서|쫓아가|물러나|둥지/.test(R.t), '지키는 법 한 줄');
        await shot('photo_note_' + id); await pic('photo_pic_' + id); calm.t = R.t; await shut(); await W8(300);
        const R2 = await shootK(); await shut(); await W8(200); const R3 = await shootK(); await shut(); ok(R2.made && R3.made && R2.a.id === id && R3.a.id === id, '같은 동물 두 장 더(같은 날 되풀이 시험용)');
        break; } if (calm) break; }
    ok(!!calm, '쉬는 동물을 찍어 기사 쪽지가 생김');
    // 셔터 비용(그 한 프레임만)
    { const I = await PI(); console.log('    셔터 셈 ' + I.shotMs + 'ms · 가장 큰 ' + I.shotMax + 'ms'); ok(I.shotMax < 3, '셔터 셈(투영 상자) ' + I.shotMax + 'ms < 3ms'); }
    // 동물 없는 곳 = 기사 X(보통 사진)
    { await reset(); await ev(() => { SD2.map.player.teleport([15.4, -1.3, 50]); SD2.map.player.lookAt([15.4, 0]); }); await W8(1200); await sec(); const n0 = (await PI()).n; await ev(() => SM_TOWN.shoot(true)); await W8(900); ok((await PI()).n === n0, '동물이 화면에 없으면 기사 쪽지 X(보통 사진)'); await shut(); }
    // ── 2. 놀라 달아나는 모습: 뛰어서 다가가 달아나는 그 순간 K ──
    console.log('2. 달아나는 모습 찍기');
    let scared = null;
    for (const id of ['heron', 'egret', 'spotbill', 'mallard', 'waterdeer', 'frog']) { for (const s of by(id).slice(0, 3)) { await reset(); const r = await near(s.j, 15); if (!r) continue; await W8(1400); await sec(); await W8(300);
        await p.keyboard.down('ShiftLeft'); await p.keyboard.down('KeyW'); let fled = false; const t0 = Date.now(); while (Date.now() - t0 < 5000) { await W8(40); const q = await spot(s.j); if (q.st >= 2) { fled = true; break; } await ev(j9 => { const s9 = SM_TOWN.wild().info().spots[j9]; SD2.map.player.lookAt([s9.x, s9.z]); }, s.j); }
        await p.keyboard.up('KeyW'); await p.keyboard.up('ShiftLeft'); if (!fled) continue; await W8(id === 'frog' ? 60 : 200); await ev(j9 => { const s9 = SM_TOWN.wild().info().spots[j9]; SD2.map.player.lookAt([s9.x, s9.z]); }, s.j);
        const R = await shootK(); console.log('    ' + id + '#' + s.j + ' 달아남 → ' + (R.made ? R.a.id + ' ' + R.a.act + ' 화면 ' + R.a.fr : '기사 X'));
        if (!R.made || R.a.id !== id || !['fly', 'dive', 'run', 'climb'].includes(R.a.act)) { await shut(); continue; }
        scared = { id, a: R.a, t: R.t }; await shot('photo_note_' + id + '_' + R.a.act); await pic('photo_pic_' + id + '_' + R.a.act); await shut(); break; } if (scared) break; }
    ok(!!scared, '놀라 달아나는 모습(날아오름·물에 뛰어듦·달아남)이 담긴 기사' + (scared ? ' — ' + scared.id + ' ' + scared.a.act : ''));
    if (calm && scared) { ok(calm.t !== scared.t, '쉬는 모습과 달아나는 모습 = 다른 말'); ok(/쪼그려 살금살금/.test(scared.t), '달아난 사진 → 다음엔 쪼그려 살금살금(멀리서 보기)'); }
    // ── 3. 행동마다 다른 말(아홉 갈래 × 종) ──
    console.log('3. 행동마다 다른 말');
    { const R = await ev(() => { const P = SM_TOWN.press(), acts = ['rest', 'alert', 'walk', 'swim', 'come', 'fly', 'dive', 'climb', 'run'], out = {}; for (const id of ['heron', 'waterdeer', 'frog', 'mallard', 'chipmunk', 'otter', 'owl', 'egret', 'spotbill']) { const H = new Set(), Wd = new Set(); for (const act of acts) { const Q = P.lines({ id, act, fr: 0.12, n: 1, o: '', tm: '', wx: '', sea: 'summer', reed: 0 }, false); H.add(Q.head); Wd.add(Q.words[1]); } out[id] = [H.size, Wd.size]; } return { out, ex: P.lines({ id: 'heron', act: 'fly', fr: 0.25, n: 2, o: '', tm: 'dusk', wx: 'rain', sea: 'autumn', reed: 0 }, false), ex2: P.lines({ id: 'frog', act: 'rest', fr: 0.03, n: 1, o: 'egret', tm: '', wx: '', sea: 'summer', reed: 1 }, false) }; });
      ok(Object.values(R.out).every(([h, w]) => h === 9 && w === 9), '종마다 행동 아홉 = 제목·행동 말 아홉 가지(' + Object.entries(R.out).map(([k, v]) => k + ' ' + v.join('/')).join(' · ') + ')');
      console.log('    예: ' + R.ex.head + ' — ' + R.ex.words.join(' · ') + ' / ' + R.ex2.head + ' — ' + R.ex2.words.join(' · '));
      ok(R.ex.words.includes('가까이에서 크게') && R.ex.words.includes('두 마리가 함께') && R.ex.words.some(w => /노을/.test(w) && /비 오는 날/.test(w)), '가까이 · 둘이 함께 · 때·날씨 말'); ok(R.ex2.words.includes('멀리서 작게') && R.ex2.words.some(w => /백로/.test(w)) && /갈대/.test(R.ex2.head), '멀리서 작게 · 다른 동물과 함께 · 갈대 물가'); }
    // ── 4. 소식지 편집장(작은 도서관) · 기사료 · 같은 동물 같은 날 한도 · 다음 날 ──
    console.log('4. 편집장에게 기사 내기');
    { const lib = await ev(() => { const L = SM_TOWN.indoor.list().filter(q => q.kind === 'lib'); return L.length ? L[0].id : null; }); ok(!!lib, '작은 도서관 있음');
      if (lib) { const okE = await ev(id => SM_TOWN.indoor.enter(id), lib); try { await p.waitForFunction(() => SM_TOWN.indoor.on && !SM_TOWN.indoor.busy, null, { timeout: 8000 }); } catch (e) { /* 아래에서 셈 */ } await W8(400);
        const h = await ev(() => SD2.map.interact.list().find(q => !q.off && /편집장/.test(q.label)) || null); ok(okE && !!h, '도서관 안 「소식지 편집장」 E' + (h ? ' — ' + h.label : ''));
        const desk = async () => { await shut(); await W8(200); await ev(h9 => { SD2.map.player.teleport([h9.x, h9.y + 0.05, h9.z]); SD2.map.player.lookAt([h9.x + 1, h9.z - 1]); }, h); await W8(450); const nr = await ev(() => SD2.near && SD2.near()); await p.keyboard.press('KeyE'); await W8(700); return { nr, t: await ev(() => { const P = document.querySelector('.twn-p'); return P ? P.textContent : ''; }) }; };
        const send = async () => { const m0 = await ev(() => __G.S.money), x0 = await ev(() => JSON.stringify(__G.S.skill || {})); const did = await ev(id => { const L = __G.S.press.list.filter(q => q.id === id && !q.sent); const b9 = L.length && document.querySelector('.twn-p [data-a="send"][data-t="' + L[L.length - 1].t + '"]'); if (b9) { b9.click(); window.__PT = L[L.length - 1].t; } return !!b9; }, calm ? calm.id : ''); await W8(500); const t = await ev(() => { const r = document.querySelector('.twn-p [data-t="' + window.__PT + '"] .res'); return r ? r.textContent : ''; }); return { did, t, dm: (await ev(() => __G.S.money)) - m0, dx: (await ev(() => JSON.stringify(__G.S.skill || {}))) !== x0 }; };
        if (h) { const D = await desk(); console.log('    가까운 E: ' + D.nr); ok(/소식지 편집장/.test(D.t) && /이 기사 내기/.test(D.t), '편집장 창 = 낼 기사 줄 + 「이 기사 내기」'); await shot('photo_desk');
          const s1 = await send(); console.log('    첫 기사: ' + s1.t + ' · 돈 +' + s1.dm); ok(s1.did && s1.dm > 0 && /실렸어요/.test(s1.t), '기사 내기 = 실림 + 기사료 +' + s1.dm + '원'); ok(s1.dx, '관찰 솜씨가 오름');
          const s2 = await send(); console.log('    같은 동물 둘째: ' + s2.t + ' · 돈 +' + s2.dm); ok(s2.did && s2.dm === 0 && /벌써/.test(s2.t) && !s2.dx, '같은 동물 같은 날 둘째 기사 = 기사료·솜씨 없음(벌써 실었어요)');
          ok((await PI()).news === 1, '마을 소식지 한 줄');
          await shut(); await ev(() => { __G.S.day++; }); const D2 = await desk(); const s3 = await send(); console.log('    다음 날: ' + s3.t + ' · 돈 +' + s3.dm); ok(s3.did && s3.dm > 0, '다음 날 = 같은 동물 기사도 다시 실림(+' + s3.dm + ')');
          ok(/다음 호 주제/.test(D2.t) || !(await ev(() => SM_TOWN.wild().dexList().some(q => SM_TOWN.wild().can(q.id) && !SM_TOWN.press().info().got[q.id]))), '기사를 낸 뒤 = 편집장 주제(안 찍은 동물 · 도감 귀띔)');
          const tx = await ev(() => { const P = document.querySelector('.twn-p'); return P ? P.textContent : ''; }); ok(/마을 소식지/.test(tx), '편집장 창 = 마을 소식지 목록'); await shot('photo_desk2'); await shut(); }
        await ev(async () => { SM_TOWN.indoor.exit(); for (let i = 0; i < 40 && (SM_TOWN.indoor.on || SM_TOWN.indoor.busy); i++) await new Promise(r => setTimeout(r, 100)); }); await W8(400); } }
    // ── 5. 앨범 '내 기사'(찍은 것만) ──
    console.log('5. 앨범');
    { await p.keyboard.press('KeyI'); await W8(600); await ev(() => { const t9 = [...document.querySelectorAll('.twn-p [data-nb]')].find(b9 => /앨범|Album/.test(b9.textContent)); if (t9) t9.click(); }); await W8(900);
      const A = await ev(() => { const P = document.querySelector('.twn-p'), L = P ? P.querySelectorAll('.pr-alb [data-pt]') : []; return { t: P ? P.textContent : '', n: L.length, img: P ? P.querySelectorAll('.pr-alb img').length : 0 }; }), I = await PI();
      ok(/내 기사/.test(A.t) && A.n === Math.min(12, I.n) && A.n > 0, '앨범 「내 기사」 = 찍은 기사 ' + A.n + '장(빈칸 X) · 사진 ' + A.img); await shot('photo_album'); await shut(); await p.keyboard.press('Escape'); await W8(300); }
    ok(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.slice(0, 4).join(' | ') : ''));
  } finally { await b.close(); }
  console.log((fails.length ? 'FAIL ' + fails.length : 'PASS') + ' · ' + ((Date.now() - T0) / 1000).toFixed(0) + '초'); process.exit(fails.length ? 1 : 0); })();
