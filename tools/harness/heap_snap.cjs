// 🧮 힙 스냅숏 읽기(OPT-G2 · 11-08): 지배 나무(retained · 약한 간선 뺌) 위 N과 뿌리까지 가장 짧은 사슬 · 갈래(생성자)별 self · 배열 버퍼(JSArrayBufferData) 몫
//   node --max-old-space-size=12000 tools/harness/heap_snap.cjs <파일.heapsnapshot> [N] [--kids=노드id,…(그 노드가 지배하는 자식 위 25)] [--path=노드id,…]
//   스냅숏 = tools/harness/town_mem.cjs --snap
const fs = require('fs');
const F = process.argv[2], N = +(process.argv[3] || 40);
const t0 = Date.now();
const S = JSON.parse(fs.readFileSync(F, 'utf8'));
const M = S.snapshot.meta, NF = M.node_fields.length, EF = M.edge_fields.length;
const nTypes = M.node_types[0], eTypes = M.edge_types[0];
const nodes = Int32Array.from(S.nodes), edges = Int32Array.from(S.edges), STR = S.strings; S.nodes = S.edges = null;
const NN = nodes.length / NF, NE = edges.length / EF;
const iT = M.node_fields.indexOf('type'), iN = M.node_fields.indexOf('name'), iId = M.node_fields.indexOf('id'), iS = M.node_fields.indexOf('self_size'), iEC = M.node_fields.indexOf('edge_count');
const eT = M.edge_fields.indexOf('type'), eN = M.edge_fields.indexOf('name_or_index'), eTo = M.edge_fields.indexOf('to_node');
const WEAK = eTypes.indexOf('weak'), SHORT = eTypes.indexOf('shortcut'), ELEM = eTypes.indexOf('element'), HID = eTypes.indexOf('hidden');
const first = new Int32Array(NN + 1); { let e = 0; for (let i = 0; i < NN; i++) { first[i] = e; e += nodes[i * NF + iEC]; } first[NN] = e; }
const self = i => nodes[i * NF + iS], typ = i => nTypes[nodes[i * NF + iT]], nm = i => STR[nodes[i * NF + iN]];
const ename = e => { const t = edges[e * EF + eT]; return t === ELEM || t === HID ? '[' + edges[e * EF + eN] + ']' : STR[edges[e * EF + eN]]; };
console.log('노드 ' + NN + ' · 간선 ' + NE + ' · 읽기 ' + (Date.now() - t0) + 'ms');
/* 거꾸로 간선(약한 것 X) */
const rc = new Int32Array(NN + 1); for (let i = 0; i < NN; i++) for (let e = first[i]; e < first[i + 1]; e++) { const t = edges[e * EF + eT]; if (t === WEAK) continue; rc[edges[e * EF + eTo] / NF]++; }
const rFirst = new Int32Array(NN + 1); for (let i = 0; i < NN; i++) rFirst[i + 1] = rFirst[i] + rc[i];
const rFrom = new Int32Array(rFirst[NN]), rEdge = new Int32Array(rFirst[NN]); { const fill = rFirst.slice(0, NN); for (let i = 0; i < NN; i++) for (let e = first[i]; e < first[i + 1]; e++) { const t = edges[e * EF + eT]; if (t === WEAK) continue; const to = edges[e * EF + eTo] / NF; rFrom[fill[to]] = i; rEdge[fill[to]] = e; fill[to]++; } }
/* 뿌리에서 DFS 뒤 차례(약한 것 X) */
const post = new Int32Array(NN).fill(-1), order = new Int32Array(NN); let pc = 0;
{ const stack = new Int32Array(NN), it = new Int32Array(NN), vis = new Uint8Array(NN); let sp = 0; stack[sp++] = 0; vis[0] = 1; it[0] = first[0];
  while (sp) { const v = stack[sp - 1]; let pushed = false; while (it[v] < first[v + 1]) { const e = it[v]++; const t = edges[e * EF + eT]; if (t === WEAK) continue; const w = edges[e * EF + eTo] / NF; if (!vis[w]) { vis[w] = 1; it[w] = first[w]; stack[sp++] = w; pushed = true; break; } } if (!pushed) { sp--; post[v] = pc; order[pc++] = v; } } }
console.log('닿는 노드 ' + pc);
/* 지배자(Cooper–Harvey–Kennedy) */
const idom = new Int32Array(NN).fill(-1); idom[0] = 0;
const inter = (a, b) => { while (a !== b) { while (post[a] < post[b]) a = idom[a]; while (post[b] < post[a]) b = idom[b]; } return a; };
let ch = true, it9 = 0; while (ch) { ch = false; it9++; for (let k = pc - 2; k >= 0; k--) { const v = order[k]; let nd = -1; for (let r = rFirst[v]; r < rFirst[v + 1]; r++) { const u = rFrom[r]; if (post[u] < 0 || idom[u] < 0) continue; nd = nd < 0 ? u : inter(u, nd); } if (nd >= 0 && idom[v] !== nd) { idom[v] = nd; ch = true; } } }
console.log('지배자 반복 ' + it9 + ' · ' + (Date.now() - t0) + 'ms');
const ret = new Float64Array(NN); for (let k = 0; k < pc; k++) { const v = order[k]; ret[v] += self(v); if (v !== 0) ret[idom[v]] += ret[v]; }
let tot = 0; for (let i = 0; i < NN; i++) tot += self(i);
console.log('self 합 ' + (tot / 1048576).toFixed(1) + 'MB · 뿌리 retained ' + (ret[0] / 1048576).toFixed(1) + 'MB');
/* 갈래별 self */
const cls = new Map(); for (let i = 0; i < NN; i++) { const k = typ(i) + ':' + (typ(i) === 'object' || typ(i) === 'native' || typ(i) === 'hidden' ? nm(i).slice(0, 50) : ''); const o = cls.get(k) || [0, 0]; o[0] += self(i); o[1]++; cls.set(k, o); }
console.log('\n== self 갈래 위 30'); for (const [k, o] of [...cls].sort((a, b) => b[1][0] - a[1][0]).slice(0, 30)) console.log((o[0] / 1048576).toFixed(1).padStart(7) + 'MB ' + String(o[1]).padStart(8) + '  ' + k);
/* 사슬: 뿌리까지 가장 짧은 길(BFS 거리) */
const dist = new Int32Array(NN).fill(-1); { const q = new Int32Array(NN); let h = 0, t = 0; q[t++] = 0; dist[0] = 0; while (h < t) { const v = q[h++]; for (let e = first[v]; e < first[v + 1]; e++) { const ty = edges[e * EF + eT]; if (ty === WEAK) continue; const w = edges[e * EF + eTo] / NF; if (dist[w] < 0) { dist[w] = dist[v] + 1; q[t++] = w; } } } }
const label = i => typ(i) + ' ' + JSON.stringify(nm(i).slice(0, 60)) + ' @' + nodes[i * NF + iId];
const chain = (v, k = 14) => { const out = []; let c = v; for (let s = 0; s < k && c !== 0; s++) { let best = -1, be = -1; for (let r = rFirst[c]; r < rFirst[c + 1]; r++) { const u = rFrom[r]; if (dist[u] < 0) continue; const ty = edges[rEdge[r] * EF + eT]; if (best < 0 || dist[u] < dist[best] || (dist[u] === dist[best] && ty !== SHORT && edges[be * EF + eT] === SHORT)) { best = u; be = rEdge[r]; } } if (best < 0) break; out.push('.' + ename(be) + ' ← ' + label(best)); c = best; } return out; };
console.log('\n== retained 위 ' + N + '(자식이 위 목록과 겹칠 수 있음)');
const cand = []; for (let i = 1; i < NN; i++) { if (post[i] < 0) continue; const t = typ(i); if (t === 'synthetic') continue; if (ret[i] > 512 * 1024) cand.push(i); }
cand.sort((a, b) => ret[b] - ret[a]);
const shown = new Set(); let n = 0;
for (const v of cand) { if (n >= N) break; /* 위에 이미 보인 것의 지배 자식이면 줄여 보임 */ let up = idom[v], inside = false; for (let s = 0; s < 6 && up > 0; s++) { if (shown.has(up)) { inside = true; break; } up = idom[up]; } shown.add(v); if (inside && ret[v] < 4 * 1048576) continue; n++;
  console.log('\n' + (ret[v] / 1048576).toFixed(1).padStart(7) + 'MB (self ' + (self(v) / 1048576).toFixed(2) + ') ' + label(v) + (inside ? '  [위 것 안]' : ''));
  for (const l of chain(v, 10)) console.log('        ' + l.slice(0, 220)); }
/* --kids=id,… : 그 노드가 지배하는 자식 위 25 */
const K = (process.argv.find(a => a.startsWith('--kids=')) || '').slice(7);
if (K) { const byId = new Map(); for (let i = 0; i < NN; i++) byId.set(nodes[i * NF + iId], i); const kids = new Map(); for (let k = 0; k < pc; k++) { const v = order[k]; if (v === 0) continue; const d = idom[v]; if (!kids.has(d)) kids.set(d, []); kids.get(d).push(v); }
  for (const id of K.split(',')) { const i = byId.get(+id); if (i == null) continue; console.log('\n== 자식 ' + label(i) + ' retained ' + (ret[i] / 1048576).toFixed(1) + 'MB');
    const en = new Map(); for (let e = first[i]; e < first[i + 1]; e++) en.set(edges[e * EF + eTo] / NF, ename(e));
    const L = (kids.get(i) || []).sort((a, b) => ret[b] - ret[a]); let rest = 0; L.slice(25).forEach(v => rest += ret[v]);
    for (const v of L.slice(0, 25)) console.log((ret[v] / 1048576).toFixed(2).padStart(8) + 'MB  ' + (en.get(v) || '~') + ' → ' + label(v));
    console.log('   … 나머지 ' + Math.max(0, L.length - 25) + '개 ' + (rest / 1048576).toFixed(2) + 'MB'); } }
const P = (process.argv.find(a => a.startsWith('--path=')) || '').slice(7); if (P) for (const id of P.split(',')) { const i = [...Array(NN).keys()].find(k => nodes[k * NF + iId] === +id); if (i == null) continue; console.log('\n사슬 ' + label(i)); for (const l of chain(i, 25)) console.log('   ' + l); }
