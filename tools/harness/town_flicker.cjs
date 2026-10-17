// 반짝임(같은 방향 면이 같은 평면에서 겹침) 감사 — 마을 감사(SM_TOWN.check)가 못 보는 메시까지(사용자 10-18 '열차 반짝임 · 상점도 반짝이')
//   실내 방(들어갈 때 짓는 메시) 전부 + 가게 앞 바깥(반경 R m 안 · 지금 보이는 메시 전부 = 병합 덩어리·인스턴스·간판·먼 판/가까운 판이 같이 보이는 경우)
//   node tools/harness/town_flicker.cjs [마을=ourtown] [포트=8002] [--rooms=all|N] [--out=N(가게 앞 몇 곳)]
// 판정: 두 삼각형이 같은 축 방향·같은 평면(1mm)·겹친 넓이 > 4cm² → 반짝임 후보. 한 면의 두 삼각형은 대각선만 닿아 넓이 0이라 걸리지 않음.
// 실내(FLICK-IN 10-18): 낮 11시(닫힌 가게 X)에 방이 다 들어간 뒤 셈 · 못 들어간 방·빈 방 = 실패 · 보이지 않는 면은 뺌(방 상자 밖 = 벽·바닥 속 · 벽·바닥·천장에 붙어 바깥을 보는 면) · 깊이를 안 쓰는 빛 자국끼리 겹침은 뺌(가산 — 번갈아 찍히지 않음) · 페이지가 다시 열리면 다시 준비
const { chromium } = require('playwright');
const A = process.argv.slice(2), TOWN = A.find(a => !a.startsWith('--') && !/^\d+$/.test(a)) || 'ourtown', PORT = A.find(a => /^\d+$/.test(a)) || '8002';
const opt = k => { const a = A.find(x => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : null; };
const ROOMS = opt('rooms') || 'all', OUTN = +(opt('out') || 6), R = 40, ROOFN = +(opt('roof') || 0);   // --roof=N: 옥상 모드(평지붕 N곳 · 정원·태양광 먼저 · 길에서 서서 · 옥상 위 · 위에서 내려다봄)
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=metal'] }); const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); const errs = [];
  p.on('pageerror', e => errs.push(e.message.slice(0, 200))); p.on('console', m => { if (m.type() === 'error' && !/favicon|404|ERR_|pointer lock|CORS|firebasedatabase|Failed to load resource/.test(m.text())) errs.push(m.text().slice(0, 200)); });
  const boot = async () => { await p.goto(`http://127.0.0.1:${PORT}/v2/?town=${TOWN}&adapt=0&dpr=1&keeparr=1`); await p.waitForFunction(() => window.SM_TOWN && SM_TOWN.indoor && window.SD2 && SD2.scene, null, { timeout: 180000 }); await p.waitForTimeout(1500);
  await p.evaluate(() => { const b = document.querySelector('.twn-p button'); if (b) b.click(); const G = SM_TOWN.game && SM_TOWN.game().S; if (G) { G.min = 11 * 60; G.clock = false; } }); await p.keyboard.press('Escape'); await p.waitForTimeout(400);   /* 가게가 여는 낮 11시 · 시계 멈춤(닫힌 가게는 못 들어감) · 이야기 상태는 건드리지 않음(빈 story = 게시판 tick 오류로 놀이가 멈춤) */
  await p.evaluate(() => {
    // 메시 → 세계 좌표 삼각형(축에 맞는 면만) → 평면 칸 → 겹친 넓이
    const area2 = P => { let s = 0; for (let i = 0; i < P.length; i++) { const a = P[i], c = P[(i + 1) % P.length]; s += a[0] * c[1] - c[0] * a[1]; } return Math.abs(s) / 2; };
    const clip = (subj, clipT) => { let out = subj; const cw = (() => { const [a, b2, c] = clipT; return (b2[0] - a[0]) * (c[1] - a[1]) - (b2[1] - a[1]) * (c[0] - a[0]) > 0; })();
      for (let i = 0; i < 3 && out.length; i++) { const A0 = clipT[i], B0 = clipT[(i + 1) % 3], inside = q => { const v = (B0[0] - A0[0]) * (q[1] - A0[1]) - (B0[1] - A0[1]) * (q[0] - A0[0]); return cw ? v >= -1e-9 : v <= 1e-9; }, inp = out; out = [];
        for (let k = 0; k < inp.length; k++) { const P0 = inp[k], Q = inp[(k + 1) % inp.length], pi = inside(P0), qi = inside(Q); if (pi) out.push(P0); if (pi !== qi) { const dx = Q[0] - P0[0], dy = Q[1] - P0[1], ex = B0[0] - A0[0], ey = B0[1] - A0[1], den = dx * ey - dy * ex; if (Math.abs(den) > 1e-12) { const t = ((A0[0] - P0[0]) * ey - (A0[1] - P0[1]) * ex) / den; out.push([P0[0] + dx * t, P0[1] + dy * t]); } } } }
      return out; };
    window.__flick = (roots, near, rad, box) => {   /* box = 방 안 상자 {at, W, D, H}: 그 밖(벽·바닥·천장 속) 면과 경계에 붙어 바깥을 보는 면은 뺌(방 카메라는 방 안에만 — 보이지 않는 면끼리 겹침은 반짝임 X) */ const B = new Map(); let tri = 0, mid = 0; const OT = [[1, 2], [0, 2], [0, 1]];
      const addTri = (a, b2, c, tag, col) => { const ux = b2[0] - a[0], uy = b2[1] - a[1], uz = b2[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2]; let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const L = Math.hypot(nx, ny, nz); if (L < 2e-6) return; nx /= L; ny /= L; nz /= L;
        const n = [nx, ny, nz], k = [0, 1, 2].reduce((m, i) => Math.abs(n[i]) > Math.abs(n[m]) ? i : m, 0); if (Math.abs(n[k]) < 0.999) return;
        if (box) { const ce = [(a[0] + b2[0] + c[0]) / 3, (a[1] + b2[1] + c[1]) / 3, (a[2] + b2[2] + c[2]) / 3], lo = [box.at[0] - box.W / 2, box.at[1], box.at[2] - box.D / 2], hi = [box.at[0] + box.W / 2, box.at[1] + box.H, box.at[2] + box.D / 2], pl = (a[k] + b2[k] + c[k]) / 3;
          if (n[k] < 0 && pl <= lo[k] + 0.0015) return; if (n[k] > 0 && pl >= hi[k] - 0.0015) return; for (let q = 0; q < 3; q++) if (ce[q] < lo[q] - 0.002 || ce[q] > hi[q] + 0.002) return; } const d = Math.round((a[k] + b2[k] + c[k]) / 3 * 1000), key = k + (n[k] > 0 ? '+' : '-') + d, [i, j] = OT[k];
        const T = [[a[i], a[j]], [b2[i], b2[j]], [c[i], c[j]]], bb = [Math.min(T[0][0], T[1][0], T[2][0]), Math.min(T[0][1], T[1][1], T[2][1]), Math.max(T[0][0], T[1][0], T[2][0]), Math.max(T[0][1], T[1][1], T[2][1])];
        let L9 = B.get(key); if (!L9) B.set(key, L9 = []); L9.push({ T, bb, tag, col, dm, kk: k + (n[k] > 0 ? '+' : '-'), dq: d, c: [(a[0] + b2[0] + c[0]) / 3, (a[1] + b2[1] + c[1]) / 3, (a[2] + b2[2] + c[2]) / 3] }); tri++; };
      const e9 = new Float64Array(16), wv = (m, arr, i) => { const x = arr[i], y = arr[i + 1], z = arr[i + 2]; return [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]]; };
      const mul = (A9, B9) => { const o = new Array(16); for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { let s = 0; for (let k = 0; k < 4; k++) s += A9[k * 4 + r] * B9[c * 4 + k]; o[c * 4 + r] = s; } return o; };
      const visible = o => { for (let q = o; q; q = q.parent) if (!q.visible) return false; return true; };
      for (const root of roots) root.traverse(o => { if (!o.isMesh || !o.geometry || !visible(o) || (o.material && !Array.isArray(o.material) && o.material.polygonOffset && o.material.polygonOffsetFactor < 0)) return;   /* 앞으로 당겨 그리는 재질(문 표시 고리·가로등 빛 웅덩이) = 같은 평면이어도 깜빡이지 않음 */ const g = o.geometry, pos = g.attributes.position; if (!pos) return; const arr = pos.array, st = pos.itemSize || 3; if (!arr || st !== 3 || pos.isInterleavedBufferAttribute || (g.index && !g.index.array)) return; mid++; const tagBase = (o.name || o.userData.k9 || o.material && o.material.type || 'mesh') + '#' + mid;
        const ix = g.index ? g.index.array : null, dr = g.drawRange || { start: 0, count: Infinity }, n0 = ix ? ix.length : arr.length / 3, s0 = dr.start || 0, s1 = Math.min(n0, s0 + (isFinite(dr.count) ? dr.count : n0));
        const mats = o.isInstancedMesh ? Array.from({ length: o.count }, (_, q) => mul(o.matrixWorld.elements, o.instanceMatrix.array.slice(q * 16, q * 16 + 16))) : [o.matrixWorld.elements];
        const CA = g.attributes.color && g.attributes.color.array, mc = o.material && !Array.isArray(o.material) && o.material.color ? o.material.color.getHexString() : 'x', mt = o.material && !Array.isArray(o.material) && o.material.map ? 'T' + o.material.map.id : '', nw = o.material && !Array.isArray(o.material) && o.material.depthWrite === false ? '~' : '', colOf = i => (CA ? [0, 1, 2].map(k => Math.round(CA[i * 3 + k] * 40)).join(',') : '') + '|' + mc + mt + nw;   /* ~ = 깊이를 안 쓰는 재질(빛 자국·햇빛 띠 — 가산 · 서로 겹쳐도 번갈아 찍히지 않음) */
        mats.forEach((M, mi) => { for (let t = s0; t + 2 < s1; t += 3) { const ia = ix ? ix[t] : t, ib = ix ? ix[t + 1] : t + 1, ic = ix ? ix[t + 2] : t + 2, a = wv(M, arr, ia * 3), b2 = wv(M, arr, ib * 3), c = wv(M, arr, ic * 3); if (near && Math.hypot(a[0] - near[0], a[2] - near[1]) > rad) continue; addTri(a, b2, c, tagBase + (o.isInstancedMesh ? ':' + mi : ''), colOf(ia)); } }); });
      const hits = []; for (const [key, L9] of B) { if (L9.length < 2) continue; for (let x = 0; x < L9.length; x++) for (let y = x + 1; y < L9.length; y++) { const P = L9[x], Q = L9[y]; if (P.bb[2] <= Q.bb[0] || Q.bb[2] <= P.bb[0] || P.bb[3] <= Q.bb[1] || Q.bb[3] <= P.bb[1]) continue; if (P.col === Q.col) continue; if (P.col.endsWith('~') && Q.col.endsWith('~')) continue;   /* 같은 색끼리 겹치면 눈에 안 보임 */ const poly = clip(P.T, Q.T); if (poly.length < 3) continue; const ar = area2(poly); if (ar > 0.0004) hits.push({ key, area: +ar.toFixed(4), at: P.c.map(v => +v.toFixed(2)), a: P.tag, b: Q.tag, ca: P.col, cb: Q.col }); } }
      hits.sort((p, q) => q.area - p.area); return { tri, meshes: mid, n: hits.length, top: hits.slice(0, 8) }; };
  }); };   // boot 끝
  await boot(); let boots = 1;
  const out = { rooms: [], outside: [], errs };
  // 1) 실내 방
  const list = await p.evaluate(() => SM_TOWN.indoor.list());
  const pick = ROOMS === 'all' ? list : list.slice(0, +ROOMS);
  for (const q of pick) { if (!await p.evaluate(() => !!window.SM_TOWN).catch(() => false)) { boots++; await boot(); }   /* 페이지가 다시 열렸으면(멈춤·메모리) 다시 준비 */
    const r = await p.evaluate(async q => { const sl = ms => new Promise(r => setTimeout(r, ms)), I = SM_TOWN.indoor; for (let i = 0; i < 60 && (I.on || I.busy); i++) { if (I.on && !I.busy) I.exit(); await sl(150); }   /* 앞 방이 다 나간 뒤에(덮개 도는 동안 enter는 무시됨) */
      const before = new Set(SD2.scene.children); try { I.enter(q.id); } catch (e) { return { name: q.name, err: String(e).slice(0, 120) }; } for (let i = 0; i < 60 && !(I.on && !I.busy); i++) await sl(150); if (!I.on) return { name: q.name, kind: q.kind, err: '못 들어감(닫힘·덮개)' }; await sl(300);
      const add = SD2.scene.children.filter(o => !before.has(o)); const I9 = SM_TOWN.indoor.info, res = window.__flick(add, null, 0, I9 && I9.at ? { at: I9.at, W: I9.W, D: I9.D, H: I9.H || 9 } : null); I.exit(); for (let i = 0; i < 60 && (I.on || I.busy); i++) await sl(150); return { name: q.name, kind: q.kind, look: q.look || null, ...res, ...(res.tri ? {} : { err: '삼각형 0(방 메시를 못 찾음)' }) }; }, q); out.rooms.push(r); process.stderr.write((r.err ? '? ' : r.n ? '✗ ' : '✓ ') + r.name + ' (' + (r.kind || '') + ') 겹침 ' + (r.n ?? '-') + ' · 삼각형 ' + (r.tri ?? '-') + (r.err ? ' · ' + r.err : '') + '\n'); }
  // 2) 가게 앞 바깥(보이는 것 전부 · 반경 R)
  const shops = await p.evaluate(n => { const L = SM_TOWN.indoor.list().filter(q => q.kind === 'shop'); const st = Math.max(1, Math.floor(L.length / n)); return L.filter((_, i) => i % st === 0).slice(0, n); }, OUTN);
  for (const q of shops) { const r = await p.evaluate(async q => { const x = q.at && q.at[0], z = q.at && q.at[1]; if (x == null) return { name: q.name, err: 'no pos' }; SD2.map.player.teleport([x + 6, SM_TOWN.ground(x + 6, z + 6) + 0.3, z + 6]); SD2.map.player.lookAt([x, z]); await new Promise(r => setTimeout(r, 1500)); return { name: q.name, at: [Math.round(x), Math.round(z)], ...window.__flick([SD2.scene], [x, z], 40) }; }, q); out.outside.push(r); }
  const bad = out.rooms.filter(r => r.n || r.err).length + out.outside.filter(r => r.n).length;   /* 못 들어간 방·빈 방도 실패(검사 못 한 것 = 통과 아님) */
  out.boots = boots; console.log(JSON.stringify(out, null, 1)); console.log(bad ? 'FLICKER ' + bad : 'PASS'); await b.close();
})();
