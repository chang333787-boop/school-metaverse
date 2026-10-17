// (옥상 모드판 · 아트 팀 10-18 · 실내 고친 판은 town_flicker.cjs) 반짝임(같은 방향 면이 같은 평면에서 겹침) 감사 — 마을 감사(SM_TOWN.check)가 못 보는 메시까지(사용자 10-18 '열차 반짝임 · 상점도 반짝이')
//   실내 방(들어갈 때 짓는 메시) 전부 + 가게 앞 바깥(반경 R m 안 · 지금 보이는 메시 전부 = 병합 덩어리·인스턴스·간판·먼 판/가까운 판이 같이 보이는 경우)
//   node tools/harness/town_flicker.cjs [마을=ourtown] [포트=8002] [--rooms=all|N] [--out=N(가게 앞 몇 곳)]
// 판정: 두 삼각형이 같은 축 방향·같은 평면(1mm)·겹친 넓이 > 4cm² → 반짝임 후보. 한 면의 두 삼각형은 대각선만 닿아 넓이 0이라 걸리지 않음.
const { chromium } = require('playwright');
const A = process.argv.slice(2), TOWN = A.find(a => !a.startsWith('--') && !/^\d+$/.test(a)) || 'ourtown', PORT = A.find(a => /^\d+$/.test(a)) || '8002';
const opt = k => { const a = A.find(x => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : null; };
const ROOMS = opt('rooms') || 'all', OUTN = +(opt('out') || 6), R = 40, ROOFN = +(opt('roof') || 0);   // --roof=N: 옥상 모드(평지붕 N곳 · 정원·태양광 먼저 · 길에서 서서 · 옥상 위 · 위에서 내려다봄)
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal'] }); const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message.slice(0, 200)));
  await p.goto(`http://127.0.0.1:${PORT}/v2/?town=${TOWN}&adapt=0&dpr=1&keeparr=1`); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.indoor && window.SD2 && SD2.scene, null, { timeout: 180000 }); await p.waitForTimeout(1500);
  await p.evaluate(() => { const b = document.querySelector('.twn-p button'); if (b) b.click(); }); await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  await p.evaluate(() => {
    // 메시 → 세계 좌표 삼각형(축에 맞는 면만) → 평면 칸 → 겹친 넓이
    const area2 = P => { let s = 0; for (let i = 0; i < P.length; i++) { const a = P[i], c = P[(i + 1) % P.length]; s += a[0] * c[1] - c[0] * a[1]; } return Math.abs(s) / 2; };
    const clip = (subj, clipT) => { let out = subj; const cw = (() => { const [a, b2, c] = clipT; return (b2[0] - a[0]) * (c[1] - a[1]) - (b2[1] - a[1]) * (c[0] - a[0]) > 0; })();
      for (let i = 0; i < 3 && out.length; i++) { const A0 = clipT[i], B0 = clipT[(i + 1) % 3], inside = q => { const v = (B0[0] - A0[0]) * (q[1] - A0[1]) - (B0[1] - A0[1]) * (q[0] - A0[0]); return cw ? v >= -1e-9 : v <= 1e-9; }, inp = out; out = [];
        for (let k = 0; k < inp.length; k++) { const P0 = inp[k], Q = inp[(k + 1) % inp.length], pi = inside(P0), qi = inside(Q); if (pi) out.push(P0); if (pi !== qi) { const dx = Q[0] - P0[0], dy = Q[1] - P0[1], ex = B0[0] - A0[0], ey = B0[1] - A0[1], den = dx * ey - dy * ex; if (Math.abs(den) > 1e-12) { const t = ((A0[0] - P0[0]) * ey - (A0[1] - P0[1]) * ex) / den; out.push([P0[0] + dx * t, P0[1] + dy * t]); } } } }
      return out; };
    window.__flick = (roots, near, rad, tol) => { const B = new Map();   /* tol(m) = 먼 자리에서 '거의 같은 평면'(깊이 정밀도보다 가까운 두 면)도 봄 */ let tri = 0, mid = 0; const OT = [[1, 2], [0, 2], [0, 1]];
      const addTri = (a, b2, c, tag, col) => { const ux = b2[0] - a[0], uy = b2[1] - a[1], uz = b2[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2]; let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const L = Math.hypot(nx, ny, nz); if (L < 2e-6) return; nx /= L; ny /= L; nz /= L;
        const n = [nx, ny, nz], k = [0, 1, 2].reduce((m, i) => Math.abs(n[i]) > Math.abs(n[m]) ? i : m, 0); if (Math.abs(n[k]) < 0.999) return; const dm = (a[k] + b2[k] + c[k]) / 3, d = tol ? Math.floor(dm / tol) : Math.round(dm * 1000), key = k + (n[k] > 0 ? '+' : '-') + d, [i, j] = OT[k];
        const T = [[a[i], a[j]], [b2[i], b2[j]], [c[i], c[j]]], bb = [Math.min(T[0][0], T[1][0], T[2][0]), Math.min(T[0][1], T[1][1], T[2][1]), Math.max(T[0][0], T[1][0], T[2][0]), Math.max(T[0][1], T[1][1], T[2][1])];
        let L9 = B.get(key); if (!L9) B.set(key, L9 = []); L9.push({ T, bb, tag, col, dm, kk: k + (n[k] > 0 ? '+' : '-'), dq: d, c: [(a[0] + b2[0] + c[0]) / 3, (a[1] + b2[1] + c[1]) / 3, (a[2] + b2[2] + c[2]) / 3] }); tri++; };
      const e9 = new Float64Array(16), wv = (m, arr, i) => { const x = arr[i], y = arr[i + 1], z = arr[i + 2]; return [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]]; };
      const mul = (A9, B9) => { const o = new Array(16); for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { let s = 0; for (let k = 0; k < 4; k++) s += A9[k * 4 + r] * B9[c * 4 + k]; o[c * 4 + r] = s; } return o; };
      const visible = o => { for (let q = o; q; q = q.parent) if (!q.visible) return false; return true; };
      for (const root of roots) root.traverse(o => { if (!o.isMesh || !o.geometry || !visible(o)) return; if (o.material && o.material.polygonOffset && o.material.depthWrite === false) return;   /* 바닥에 얹는 빛 웅덩이(앞당김 + 깊이 안 씀) = 반짝이지 않음 */ const g = o.geometry, pos = g.attributes.position; if (!pos) return; const arr = pos.array, st = pos.itemSize || 3; if (!arr || st !== 3 || pos.isInterleavedBufferAttribute || (g.index && !g.index.array)) return; mid++; const tagBase = (o.name || o.userData.k9 || o.material && o.material.type || 'mesh') + '#' + mid;
        const ix = g.index ? g.index.array : null, dr = g.drawRange || { start: 0, count: Infinity }, n0 = ix ? ix.length : arr.length / 3, s0 = dr.start || 0, s1 = Math.min(n0, s0 + (isFinite(dr.count) ? dr.count : n0));
        const mats = o.isInstancedMesh ? Array.from({ length: o.count }, (_, q) => mul(o.matrixWorld.elements, o.instanceMatrix.array.slice(q * 16, q * 16 + 16))) : [o.matrixWorld.elements];
        const CA = g.attributes.color && g.attributes.color.array, mc = o.material && !Array.isArray(o.material) && o.material.color ? o.material.color.getHexString() : 'x', mt = o.material && !Array.isArray(o.material) && o.material.map ? 'T' + o.material.map.id : '', colOf = i => (CA ? [0, 1, 2].map(k => Math.round(CA[i * 3 + k] * 40)).join(',') : '') + '|' + mc + mt;
        mats.forEach((M, mi) => { for (let t = s0; t + 2 < s1; t += 3) { const ia = ix ? ix[t] : t, ib = ix ? ix[t + 1] : t + 1, ic = ix ? ix[t + 2] : t + 2, a = wv(M, arr, ia * 3), b2 = wv(M, arr, ib * 3), c = wv(M, arr, ic * 3); if (near && Math.hypot(a[0] - near[0], a[2] - near[1]) > rad) continue; addTri(a, b2, c, tagBase + (o.isInstancedMesh ? ':' + mi : ''), colOf(ia)); } }); });
      const hits = []; for (const [key, L0] of B) { const nb = tol && L0.length ? B.get(L0[0].kk + (L0[0].dq + 1)) || [] : [], L9 = nb.length ? L0.concat(nb) : L0, n0 = L0.length; if (L9.length < 2) continue; for (let x = 0; x < n0; x++) for (let y = x + 1; y < L9.length; y++) { const P = L9[x], Q = L9[y]; if (tol && (Math.abs(P.dm - Q.dm) > tol || P.tag.split(':')[0] === Q.tag.split(':')[0])) continue;   /* 먼 자리 = 서로 다른 메시(먼 판·가까운 판·덩어리)끼리만 — 한 메시 안 2~3cm 띄운 꾸밈은 가까이서 보는 판정(tol 0)이 맡음 */ if (P.bb[2] <= Q.bb[0] || Q.bb[2] <= P.bb[0] || P.bb[3] <= Q.bb[1] || Q.bb[3] <= P.bb[1]) continue; if (P.col === Q.col) continue;   /* 같은 색끼리 겹치면 눈에 안 보임 */ const poly = clip(P.T, Q.T); if (poly.length < 3) continue; const ar = area2(poly); if (ar > 0.0004) hits.push({ key, area: +ar.toFixed(4), at: P.c.map(v => +v.toFixed(2)), a: P.tag, b: Q.tag, ca: P.col, cb: Q.col }); } }
      hits.sort((p, q) => q.area - p.area); return { tri, meshes: mid, n: hits.length, top: hits.slice(0, 8) }; };
  });
  const out = { rooms: [], outside: [], roofs: [], errs };
  // 1) 실내 방
  const list = await p.evaluate(() => SM_TOWN.indoor.list());
  const pick = ROOMS === 'all' ? list : ROOMS === '0' ? [] : list.slice(0, +ROOMS);
  for (const q of pick) { const r = await p.evaluate(async q => { const before = new Set(SD2.scene.children); try { SM_TOWN.indoor.enter(q.id); } catch (e) { return { name: q.name, err: String(e).slice(0, 120) }; } await new Promise(r => setTimeout(r, 700)); const add = SD2.scene.children.filter(o => !before.has(o)); const res = window.__flick(add); SM_TOWN.indoor.exit(); await new Promise(r => setTimeout(r, 400)); return { name: q.name, kind: q.kind, look: q.look || null, ...res }; }, q); out.rooms.push(r); }
  // 2) 가게 앞 바깥(보이는 것 전부 · 반경 R)
  const shops = await p.evaluate(n => { const L = SM_TOWN.indoor.list().filter(q => q.kind === 'shop'); const st = Math.max(1, Math.floor(L.length / n)); return L.filter((_, i) => i % st === 0).slice(0, n); }, OUTN);
  for (const q of shops) { const r = await p.evaluate(async q => { const x = q.at && q.at[0], z = q.at && q.at[1]; if (x == null) return { name: q.name, err: 'no pos' }; SD2.map.player.teleport([x + 6, SM_TOWN.ground(x + 6, z + 6) + 0.3, z + 6]); SD2.map.player.lookAt([x, z]); await new Promise(r => setTimeout(r, 1500)); return { name: q.name, at: [Math.round(x), Math.round(z)], ...window.__flick([SD2.scene], [x, z], 40) }; }, q); out.outside.push(r); }
  // 3) 옥상(사용자 10-18 '옥상에서도 반짝임'): 평지붕 위 정원·태양광·물탱크·계단실·난간 + 먼 판/가까운 판이 같이 보이는지 — 세 자리(길에서 서서 · 옥상 위에 서서 · 30m 위)
  if (ROOFN) { const RL = await p.evaluate(n => { const L = (SM_TOWN.roofs && SM_TOWN.roofs()) || []; const A = L.filter(r => r.deco), B = L.filter(r => !r.deco); const st = Math.max(1, Math.floor(A.length / Math.ceil(n * 0.7))); return [...A.filter((_, i) => i % st === 0).slice(0, Math.ceil(n * 0.7)), ...B.filter((_, i) => i % 7 === 0)].slice(0, n); }, ROOFN);
    for (const rf of RL) for (const view of ['street', 'deck', 'above', 'far190', 'far230', 'far270']) { const r = await p.evaluate(async ([rf, view]) => { const c = Math.cos(rf.ry || 0), s = Math.sin(rf.ry || 0), off = Math.max(rf.w, rf.d) / 2 + 12; SD2.map.player.freeze(true);
        if (view === 'street') { const x = rf.cx + off * 0.7, z = rf.cz + off * 0.7; SD2.map.player.teleport([x, SM_TOWN.ground(x, z) + 0.3, z]); }
        else if (view === 'deck') SD2.map.player.teleport([rf.cx + c * Math.min(1.2, rf.w / 4), rf.y + 0.15, rf.cz - s * Math.min(1.2, rf.w / 4)]);
        else if (view === 'above') SD2.map.player.teleport([rf.cx + 6, rf.y + 30, rf.cz + 6]);
        else { const D = +view.slice(3), x = rf.cx + D * 0.8, z = rf.cz + D * 0.6; SD2.map.player.teleport([x, SM_TOWN.ground(x, z) + 6, z]); }   /* 먼 판/가까운 판이 바뀌는 거리(구역 경계에서 둘이 같이 보이는지) */
        SD2.map.player.lookAt([rf.cx, rf.cz]); await new Promise(r => setTimeout(r, 1300)); const res = window.__flick([SD2.scene], [rf.cx, rf.cz], Math.max(rf.w, rf.d) / 2 + 3, view.startsWith('far') ? 0.03 : 0); SD2.map.player.freeze(false); return { at: [rf.cx, rf.cz], deco: rf.deco, view, ...res }; }, [rf, view]); out.roofs.push(r); } }
  const bad = out.rooms.filter(r => r.n).length + out.outside.filter(r => r.n).length + out.roofs.filter(r => r.n).length;
  console.log(JSON.stringify(out, null, 1)); console.log(bad ? 'FLICKER ' + bad : 'PASS'); await b.close();
})();
