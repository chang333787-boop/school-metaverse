// 🎓 학원 문제 은행 검산(ACAD-1 · v2/games/town_acad_bank.js · 설계 docs/systems/town_acad.md §8) — 노드만: node tools/harness/acad_bank.mjs [판 수=1000]
//   과목 × 단계(1~5)마다 수업(다섯) N판 + 자습(셋) N/4판을 만들어
//   ① 정답 검산: 수학은 물음 글(분수 꾸밈·소수·각도)을 이 시험이 다시 읽어 따로 계산 · 사각형 = 이 시험의 '이름 포함 표' · 로봇 = 이 시험의 칸 흉내 · 사실 문제 = 은행 표의 정답 글
//   ② 보기: 정답이 보기 안에 꼭 하나 · 같은 글 보기 X · 보기 2~4개 · 수학 보기 값이 정답과 같은 것 하나뿐
//   ③ 자리: 같은 자리 정답 연속 X(한 판 안 고르기 문제끼리) · 자리 고르게(4지선다 자리마다 15~35%)
//   ④ 수준 사다리: 한 판 수준 = [s-1, s, s, s, s+1] · 길이 꼴(리듬·동작·로봇 블록·큰 수 자리) 평균이 단계 따라 줄지 않음
//   ⑤ 글: 물음·힌트 둘·까닭·오늘 배운 것이 비지 않음 · 길이 · 그림 SVG에 <script 없음 · 윈도 10에서 깨지는 이모지 X · 같은 판 같은 문제 X
import { lesson, SUBJ, SUBJ_ORDER, SCI, robotRun, levelsOf, goodRun, QUAD_NAMES, ST_PASS, PAINT, lum, NOTE, MOVES } from '../../v2/games/town_acad_bank.js';
const N = +(process.argv[2] || 1000);
let fails = 0, checks = 0; const bad = new Map();
const ok = (c, m) => { checks++; if (!c) { fails++; bad.set(m, (bad.get(m) || 0) + 1); } };
const report = (c, m) => { console.log((c ? '  ✓ ' : '  ✗ ') + m); if (!c) fails++; };
// 윈도 10에서 깨지는 이모지(이모지 12.0 이후 · U+1F58x · 1F5BC) — textlint.cjs와 같은 경계
const BADCP = [[0x1F6D5, 0x1F6D7], [0x1F6DD, 0x1F6DF], [0x1F6D8, 0x1F6DC], [0x1F6FA, 0x1F6FC], [0x1F7E0, 0x1F7F0], [0x1F90C, 0x1F90F], [0x1F93F, 0x1F93F], [0x1F971, 0x1F972], [0x1F977, 0x1F979], [0x1F97B, 0x1F97B], [0x1F9A3, 0x1F9AF], [0x1F9BA, 0x1F9BF], [0x1F9C3, 0x1F9CF], [0x1FA70, 0x1FAFF], [0x1F580, 0x1F58F], [0x1F5BC, 0x1F5BC], [0x26A7, 0x26A7]];
const badEmo = s => { for (const ch of String(s)) { const c = ch.codePointAt(0); if (BADCP.some(([a, b]) => c >= a && c <= b)) return ch; } return null; };
// ── 독립 계산 도구 ──
const unFr = t => { const m = String(t).match(/⟦(?:(\d+) )?(\d+)\/(\d+)⟧/); if (!m) return null; const w = +(m[1] || 0), a = +m[2], b = +m[3]; return [w * b + a, b]; };
const frs = t => [...String(t).matchAll(/⟦(?:(\d+) )?(\d+)\/(\d+)⟧/g)].map(m => [+(m[1] || 0) * +m[3] + +m[2], +m[3]]);
const nat = t => { const m = String(t).match(/(\d+)\s*[−-]\s*⟦/); return m ? +m[1] : null; };
const eqR = (p, q) => p[0] * q[1] === q[0] * p[1];
const dec100 = s => Math.round(parseFloat(s) * 100);
const nums = s => [...String(s).matchAll(/\d+(?:\.\d+)?/g)].map(m => m[0]);
const bigN = s => +String(s).replace(/[\s ,]/g, '');
const ISA = { trap: ['사다리꼴'], para: ['사다리꼴', '평행사변형'], rhom: ['사다리꼴', '평행사변형', '마름모'], rect: ['사다리꼴', '평행사변형', '직사각형'] };
const IS = (X, Y) => ({ 정사각형: ['직사각형', '마름모', '평행사변형', '사다리꼴'], 직사각형: ['평행사변형', '사다리꼴'], 마름모: ['평행사변형', '사다리꼴'], 평행사변형: ['사다리꼴'], 사다리꼴: [] }[X] || []).includes(Y);
function sim(prog, st, rocks) { const D = [[0, -1], [1, 0], [0, 1], [-1, 0]]; let [x, y, d] = st; const R = new Set(rocks.map(p => p.join(','))); const one = b => { if (b === 'F') { x += D[d][0]; y += D[d][1]; return x >= 0 && y >= 0 && x < 5 && y < 5 && !R.has(x + ',' + y); } d = b === 'L' ? (d + 3) % 4 : (d + 1) % 4; return true; };
  for (const b of prog) { const L = typeof b === 'object' ? Array(b.n).fill(b.b).flat() : [b]; for (const c of L) if (!one(c)) return null; } return [x, y]; }
const DIGK = ['영', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
const MIXT = { '빨강+노랑': '주황', '노랑+파랑': '초록', '빨강+파랑': '보라' };
// 문제 하나 검산 → 정답 보기 번호(독립 계산) · null = 이 꼴은 글 검사만
function expect(p) { const t = p.t.split(':')[1], C = p.ch || [], T = C.map(c => c.t), find = f => { const ix = []; C.forEach((c, i) => { if (f(c, i)) ix.push(i); }); return ix; };
  switch (t) {
    case 'angle_kind': { const d = p.a.deg, nm = d < 90 ? '예각' : d === 90 ? '직각' : '둔각'; return find(c => c.t === nm); }
    case 'big_place': { const s = String(p.a.n), q = bigN(p.q.split('에서')[0]); if (q !== p.a.n) return []; const pos = s.length - 1 - p.a.p, PL = ['일', '십', '백', '천', '만', '십만', '백만', '천만', '억', '십억', '백억', '천억', '조', '십조']; if (+s[pos] !== p.a.d || [...s].filter(x => +x === p.a.d).length !== 1) return []; return find(c => c.t === PL[p.a.p] + '의 자리'); }
    case 'big_cmp': { const v = T.map(bigN), mx = Math.max(...v); return find(c => bigN(c.t) === mx); }
    case 'big_skip': { const n = bigN(p.q.split('에서')[0]), m = p.q.match(/에서 (\d+)(만|억|조)?씩/), S = +m[1] * ({ 만: 1e4, 억: 1e8, 조: 1e12 }[m[2]] || 1); return find(c => bigN(c.t) === n + S); }
    case 'frac_add': case 'frac_sub': { const F = frs(p.q), w = nat(p.q); let x, y; if (w != null) { x = [w * F[0][1], F[0][1]]; y = F[0]; } else { x = F[0]; y = F[1]; } const add = p.q.includes('+'), v = add ? [x[0] * y[1] + y[0] * x[1], x[1] * y[1]] : [x[0] * y[1] - y[0] * x[1], x[1] * y[1]]; return find(c => { const r = unFr(c.t); return r && eqR(r, v); }); }
    case 'dec_read': { const h = p.a.h; if (p.a.read) { const s = String(h).padStart(2, '0'); return find(c => c.t === '영 점 ' + DIGK[+s[0]] + DIGK[+s[1]]); } return find(c => Math.round(parseFloat(c.t) * 1000) === h * 10); }
    case 'dec_cmp': { const v = T.map(dec100), mx = Math.max(...v); return find(c => dec100(c.t) === mx); }
    case 'dec_add': case 'dec_sub': { const [a, b] = nums(p.q.split('봐요.')[1]).map(dec100), v = t === 'dec_add' ? a + b : a - b; return find(c => dec100(c.t) === v); }
    case 'angle_calc': { const [a, b] = nums(p.q).map(Number), v = p.q.includes('+') ? a + b : a - b; return find(c => parseInt(c.t) === v); }
    case 'tri_side': { const s = p.a.sides, u = new Set(s).size, nm = u === 1 ? '정삼각형' : u === 2 ? '이등변삼각형' : null; if (s[0] + s[1] <= s[2] || s[1] + s[2] <= s[0] || s[0] + s[2] <= s[1]) return []; return find(c => c.t === nm); }
    case 'tri_third': { const [a, b] = nums(p.q).map(Number), c3 = 180 - a - b; if (p.a.kind) { const mx = Math.max(a, b, c3), nm = mx < 90 ? '예각삼각형' : mx === 90 ? '직각삼각형' : '둔각삼각형'; return find(c => c.t === nm); } return find(c => parseInt(c.t) === c3); }
    case 'quad_fourth': { const [a, b, c] = nums(p.q).map(Number); return find(x => parseInt(x.t) === 360 - a - b - c); }
    case 'quad_pic': return find(c => ISA[p.a.shape].includes(c.t));
    case 'quad_isa': { const m = p.q.match(/^(\S+?)[은는] (\S+?)(이라고|라고) /), yes = IS(m[1], m[2]); return find(c => c.t.startsWith(yes ? '네' : '아니요')); }
    case 'line_read': { const v = p.a.v; if (p.a.max) { const mx = Math.max(...v); return find(c => v[c.v] === mx); } return find(c => parseInt(c.t) === v[p.a.k]); }
    case 'line_change': { const v = p.a.v; if (p.a.rise) { const d = [0, 1, 2, 3].map(i => v[i + 1] - v[i]), mx = Math.max(...d); return find(c => d[c.v] === mx); } return find(c => parseInt(c.t) === Math.abs(v[p.a.j] - v[p.a.i])); }
    case 'robot': return find(c => { const e = sim(c.prog, p.a.st, p.a.rocks); return !!e && e[0] === p.a.goal[0] && e[1] === p.a.goal[1]; });
    case 'fact': { const f = SCI.find(x => x.id === p.a.fact); return f && !f.order ? find(c => c.t === f.right) : null; }
    case 'art_mix': { const m = p.a.mix; return p.q.includes('어떤 두 색') ? find(c => MIXT[c.t.replace(/ /g, '')] === m[2] || MIXT[c.t.split(' + ').reverse().join('+')] === m[2]) : find(c => c.t === MIXT[m[0] + '+' + m[1]]); }
    case 'art_tint': { if (p.a.sws) { const L = C.map(c => lum(c.sw)), mx = Math.max(...L); return find(c => lum(c.sw) === mx); } const base = lum(PAINT[p.a.base]); return find(c => (p.a.white ? lum(c.sw) > base + 20 : lum(c.sw) < base - 20) && c.t.includes(p.a.base)); }
    case 'art_temp': { const W = ['빨강', '주황', '노랑'], Cc = ['파랑', '청록', '남색']; return find(c => (p.a.warm ? W : Cc).includes(c.t)); }
    case 'art_pat': { const s = p.a.seq, h = p.a.hole, per = [2, 3, 4, 6].find(k => s.every((x, i) => i + k >= s.length || x === s[i + k])); if (!per) return []; const want = h >= per ? s[h - per] : s[h + per]; return find(c => c.shp.join(':') === want); }
    case 'art_three': return find(c => c.t.startsWith('검정에 가까운'));
    case 'pi_hilo': { const k = p.a.b > p.a.a ? '높아요' : p.a.b < p.a.a ? '낮아요' : '같아요'; return find(c => c.t.endsWith(k)); }
    case 'pi_name': return find(c => c.t === NOTE[p.a.n]);
    case 'pi_dir': { const n = p.a.ns, up = n[1] > n[0] && n[2] > n[1], dn = n[1] < n[0] && n[2] < n[1], same = n[0] === n[1] && n[1] === n[2], ud = n[1] > n[0] && n[2] < n[1]; const k = up ? '점점 올라가요' : dn ? '점점 내려가요' : same ? '같은 음이 되풀이돼요' : ud ? '올라갔다가 내려와요' : null; return find(c => c.t === k); }
    default: return null; } }
// ── 돌리기 ──
const lenStat = {};
for (const subj of SUBJ_ORDER) { for (let st = 1; st <= 5; st++) { const key = subj + st; lenStat[key] = { rhy: [], tk: [], rob: [], big: [], lv: [] };
  for (let i = 0; i < N + Math.floor(N / 4); i++) { const self = i >= N, n = self ? 3 : 5, L = lesson(subj, st, 7919 * i + st * 131 + subj.length, { n }), lv = levelsOf(st, n);
    ok(L.length === n, subj + ' ' + st + '단계 ' + (self ? '자습' : '수업') + ' 문제 수 = ' + n);
    let last = -1; const keys = new Set();
    L.forEach((p, j) => { const tag = subj + ' ' + p.t + ' L' + p.lv;
      ok(p.lv === lv[j], subj + ' 수준 사다리 [s-1,s,s,s,s+1]'); ok(!keys.has(p.key), subj + ' 같은 판 같은 문제 X'); keys.add(p.key);
      ok(typeof p.q === 'string' && p.q.length >= 4 && p.q.length <= 120, tag + ' 물음 길이 4~120 (' + (p.q || '').length + ')');
      ok(Array.isArray(p.h) && p.h.length === 2 && p.h.every(x => typeof x === 'string' && x.length >= 4), tag + ' 힌트 둘');
      ok(typeof p.why === 'string' && p.why.length >= 8 && p.why.length <= 220, tag + ' 까닭 8~220자');
      ok(typeof p.learn === 'string' && p.learn.length >= 4 && p.learn.length <= 60, tag + ' 오늘 배운 것 4~60자');
      ok(!p.vis || ((!p.vis.sw || (Array.isArray(p.vis.sw) && p.vis.sw.every(c => /^#[0-9a-f]{6}$/.test(c)))) && (!p.vis.pat || Array.isArray(p.vis.pat))), tag + ' 그림 정보 꼴(색 칸 = 배열 · 무늬 = 배열)');
      ok(!p.pic || (/^<svg[\s\S]*<\/svg>$/.test(p.pic) && !/<script|on\w+=/i.test(p.pic)), tag + ' 그림 = SVG만');
      const all = [p.q, p.why, p.learn, ...p.h, p.text || '', ...(p.ch || []).map(c => c.t), ...(p.items || []).map(c => c.t + (c.sub || ''))].join(' ');
      ok(!badEmo(all), tag + ' 윈도 10에서 깨지는 이모지 X (' + badEmo(all) + ')'); ok(!/undefined|NaN|null|\[object/.test(all), tag + ' 글에 undefined·NaN X');
      if (p.kind === 'pick') { const T = p.ch.map(c => c.t); ok(p.ch.length >= 2 && p.ch.length <= 4, tag + ' 보기 2~4'); ok(new Set(T).size === T.length, tag + ' 같은 글 보기 X'); ok(p.ans >= 0 && p.ans < p.ch.length, tag + ' 정답 번호');
        ok(p.ans !== last, subj + ' 같은 자리 정답 연속 X'); last = p.ans; ok(T.every(x => x.length <= 60), tag + ' 보기 글 길이 60 이하');
        const e = expect(p); if (e) { ok(e.length === 1, tag + ' 독립 계산으로 정답 보기 정확히 하나 (' + e.length + ')'); ok(e[0] === p.ans, tag + ' 독립 계산 정답 = 은행 정답'); }
        const vs = p.ch.map(c => c.v).filter(v => v != null && typeof v !== 'object'); if (vs.length === p.ch.length) ok(new Set(vs).size === vs.length, tag + ' 보기 값 서로 다름');
        if (p.ch.every(c => unFr(c.t))) { const R = p.ch.map(c => unFr(c.t)); ok(R.every((x, a) => R.every((y, b) => a === b || !eqR(x, y))), tag + ' 분수 보기 값 서로 다름'); }
        if (p.t.endsWith('robot')) lenStat[key].rob.push(p.ch[p.ans].prog.reduce((x, b) => x + (typeof b === 'object' ? b.n * b.b.length : 1), 0));
        if (p.t.endsWith('big_place')) lenStat[key].big.push(String(p.a.n).length);
      } else if (p.kind === 'order') { ok(p.items.length >= 3 && p.items.length <= 5, tag + ' 차례 칸 3~5'); ok(Array.isArray(p.perm) && p.perm.length === p.items.length && !p.perm.every((v, k) => v === k), tag + ' 보이는 차례가 정답 차례와 다름');
        if (p.a.fact) { const f = SCI.find(x => x.id === p.a.fact); ok(!!f && f.order.join('|') === p.items.map(c => c.t).join('|'), tag + ' 차례 = 은행 표'); }
      } else if (p.kind === 'seq') { ok(Array.isArray(p.seq) && p.seq.length >= 3 && p.seq.every(k => p.keys.includes(k)), tag + ' 리듬·동작 차례 = 단추 열쇠'); if (p.demo.rhy) { lenStat[key].rhy.push(p.seq.length); ok(p.seq[0] !== 'r', tag + ' 리듬 첫 박 = 쉼 X'); } if (p.demo.tk) { lenStat[key].tk.push(p.seq.length); ok(p.seq.length === p.lv + 2, tag + ' 동작 수 = 수준 + 2'); ok(p.seq.every(k => MOVES[k]), tag + ' 동작 열쇠'); } }
      else ok(false, tag + ' 문제 꼴');
      lenStat[key].lv.push(p.lv); });
    if (!self) { ok(L[4] && L[4].star, subj + ' 다섯째 = ★도전'); } } } }
// ── 묶음 결과 ──
console.log('① ~ ⑤ 문제 하나씩 검사 ' + checks.toLocaleString() + '번');
if (bad.size) { for (const [m, c] of [...bad.entries()].slice(0, 25)) console.log('  ✗ ' + m + ' — ' + c + '번'); } else console.log('  ✓ 모두 통과(과목 7 × 단계 5 × 수업 ' + N + '판 + 자습 ' + Math.floor(N / 4) + '판)');
// ③ 자리 고르게
{ const cnt = [0, 0, 0, 0]; let n4 = 0; for (const subj of SUBJ_ORDER) for (let st = 1; st <= 5; st++) for (let i = 0; i < 200; i++) for (const p of lesson(subj, st, 104729 * i + st, {})) if (p.kind === 'pick' && p.ch.length === 4) { cnt[p.ans]++; n4++; }
  const pc = cnt.map(c => Math.round(c / n4 * 100)); report(pc.every(x => x >= 15 && x <= 35), '③ 4지선다 정답 자리 고르게(15~35%) — ' + pc.join('% · ') + '%'); }
// ④ 길이 사다리
{ const mean = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0), up = (subj, k) => { const m = [1, 2, 3, 4, 5].map(st => mean(lenStat[subj + st][k])); return { m, ok: m.every((v, i) => i === 0 || v >= m[i - 1] - 0.05) }; };
  for (const [subj, k, nm] of [['piano', 'rhy', '리듬 박 수'], ['taekwondo', 'tk', '동작 수'], ['science', 'rob', '로봇 길(앞으로 칸 + 돌기)'], ['math', 'big', '큰 수 자리 수']]) { const r = up(subj, k); report(r.ok, '④ ' + SUBJ[subj].t + ' ' + nm + ' 평균이 단계 따라 줄지 않음 — ' + r.m.map(v => v.toFixed(1)).join(' → ')); }
  for (const subj of SUBJ_ORDER) { const m = [1, 2, 3, 4, 5].map(st => mean(lenStat[subj + st].lv)); report(m.every((v, i) => i === 0 || v > m[i - 1]), '④ ' + SUBJ[subj].t + ' 평균 수준 ' + m.map(v => v.toFixed(2)).join(' → ')); } }
// 잘한 판 판정 · 틀 수
report(goodRun([0, 0, 1, 1, 2]) && !goodRun([0, 0, 2, 2, 1]) && !goodRun([0, 0, 0, 0]), '잘한 판 = 다섯 가운데 넷 이상을 까닭 보기 전에');
{ let nt = 0; const per = SUBJ_ORDER.map(s => { const k = Object.keys(SUBJ[s].tpl).length + (s === 'science' ? SCI.length - 1 : 0); nt += k; return SUBJ[s].t + ' ' + k; }); console.log('  문제 틀 ' + nt + '개(' + per.join(' · ') + ') · 사실 문제 과학 ' + SCI.length + ' · 짧은 글 ' + ST_PASS.length + ' · 사각형 이름 ' + QUAD_NAMES.length); }
console.log(fails ? '\n✗ ' + fails + '개 실패' : '\n✓ 모두 통과'); process.exit(fails ? 1 : 0);
