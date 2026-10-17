// 글 검사기(TEXTLINT-1 · 엔진 팀 10-17): node tools/harness/textlint.cjs [파일·폴더 …] [--diff=<커밋>] [--warn] [--json]
//   기본 대상 = v2/games/town*.js · v2/js/*.js · v2/*.css (인자를 주면 그것만 — 폴더면 안의 .js·.css)
//   ① 윈도 10에서 깨지는 이모지(CLAUDE.md '유니코드 13 이상·U+1F58x 계열' · 교사 09-29) — 문자열·템플릿 글자 속만(주석은 화면에 안 나오므로 뺌)
//      = 이모지 12.0 이후에 생긴 코드 포인트 전부(윈도 10 1809 글꼴 = 이모지 11까지 · 교사가 본 🪁·🩳가 12.0) + U+1F580~1F58F·U+1F5BC(🖌🖍🖼 — 교사 확인)
//   ② CSS `:has(` — 아이폰 사파리에서 '맞다'면서 적용 안 됨(mobile.md HAS-1) · JS 문자열 속 CSS·querySelector와 .css 파일
//   ③ 줄 가운데 // 주석 뒤에 다시 코드가 오는 줄 — `a(); // 설명 b();`면 b()가 주석이 되어 안 돎(메모리 '줄 가운데 // 주석 금지' · 조각 설명은 /* */)
//   --slop = 경고만(종료 코드와 무관 · town_lessons.md B '슬롭티'): ④ 한 줄 화면 글(문자열)에 이모지 셋 이상(이모지 하나뿐인 문자열 = 자료 표 열쇠는 뺌) ⑤ '·'로 이은 조각 넷 이상('·' 셋 이상)
//   SMFix 글꼴(tools/fonts/smfix.py · v2/index.html /*SMFIX*/)에 든 글자는 고침으로 셈
//   --diff=<커밋> = 그 커밋 뒤 새로 쓰거나 고친 줄만(관문용) · --warn = 찾아도 종료 코드 0 · 종료 코드 1 = 하나라도 찾음
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..', '..');
const args = process.argv.slice(2), opt = k => { const a = args.find(s => s.startsWith('--' + k)); return a ? (a.includes('=') ? a.slice(a.indexOf('=') + 1) : true) : null; };
const DIFF = opt('diff'), WARN = !!opt('warn'), JSONOUT = !!opt('json'), SLOP = !!opt('slop');

// ── ① 깨지는 이모지 표(코드 포인트 · 처음 나온 이모지 판) ──
const R = (a, b, v) => ({ a, b, v });
const BAD = [
  // 이모지 12.0(2019)
  R(0x1F6D5, 0x1F6D5, 12), R(0x1F6FA, 0x1F6FA, 12), R(0x1F7E0, 0x1F7EB, 12), R(0x1F90D, 0x1F90F, 12), R(0x1F93F, 0x1F93F, 12), R(0x1F971, 0x1F971, 12), R(0x1F97B, 0x1F97B, 12),
  R(0x1F9A5, 0x1F9AA, 12), R(0x1F9AE, 0x1F9AF, 12), R(0x1F9BA, 0x1F9BF, 12), R(0x1F9C3, 0x1F9CA, 12), R(0x1F9CD, 0x1F9CF, 12),
  // 이모지 13.0(2020)
  R(0x1F6D6, 0x1F6D7, 13), R(0x1F6FB, 0x1F6FC, 13), R(0x1F90C, 0x1F90C, 13), R(0x1F972, 0x1F972, 13), R(0x1F977, 0x1F978, 13), R(0x1F9A3, 0x1F9A4, 13), R(0x1F9AB, 0x1F9AD, 13), R(0x1F9CB, 0x1F9CB, 13), R(0x26A7, 0x26A7, 13),
  // 이모지 14.0(2021) — 1F6DD~1F6DF(🛝🛞🛟) · 🟰 · 🥹 · 🧌
  R(0x1F6DD, 0x1F6DF, 14), R(0x1F7F0, 0x1F7F0, 14), R(0x1F979, 0x1F979, 14), R(0x1F9CC, 0x1F9CC, 14),
  // 이모지 15.0~(2022~) — 🛜 · 앞으로 생길 1F6D8~1F6DB 자리까지
  R(0x1F6D8, 0x1F6DC, 15),
  // 1FA70~1FAFF(기호·그림 확장-A) = 블록 전체가 이모지 12.0 이후(🩰🩳🪀🪁🪐 12 · 🪃🪄🪜🪨🫐 13 · 🪩🫠🫧 14 · 🩷🪿🫏 15 · 🫩🪾 16 …)
  R(0x1FA70, 0x1FAFF, 12),
];
const TEACHER = [R(0x1F580, 0x1F58F, 7), R(0x1F5BC, 0x1F5BC, 7)];   // 🖊🖋🖌🖍·🖼 — 교사 09-29 '사진 아이콘 윈도우에서 깨진다'
const FIXED = (() => { const S = new Set(); try { const h = fs.readFileSync(path.join(ROOT, 'v2/index.html'), 'utf8'), m = h.match(/\/\*SMFIX\*\/@font-face\{[^}]*unicode-range:([^};]*)/); if (m) for (const r of m[1].split(',')) { const q = r.trim().replace(/^U\+/i, '').split('-').map(v => parseInt(v, 16)); for (let c = q[0]; c <= (q[1] || q[0]); c++) S.add(c); } } catch (e) { /* 없음 */ } return S; })();   // tools/fonts/smfix.py가 그린 글자 = 고침(HTML 글자 · 캔버스 글씨는 SMEmoji를 안 쓰면 그대로 깨짐)
let nFixed = 0;
const badOf = cp => { if (FIXED.has(cp)) { nFixed++; return null; } for (const r of TEACHER) if (cp >= r.a && cp <= r.b) return 'U+1F58x·1F5BC 계열(교사 확인)'; for (const r of BAD) if (cp >= r.a && cp <= r.b) return '이모지 ' + (r.a >= 0x1FA70 && r.b === 0x1FAFF ? '12.0+' : r.v + '.0'); return null; };

// ── JS 토큰 나누기: 글자마다 code·str(문자열·템플릿 글자)·cmt(주석)·re(정규식) ──
const KW = new Set(['return', 'typeof', 'case', 'do', 'else', 'in', 'of', 'new', 'delete', 'void', 'throw', 'yield', 'await', 'instanceof']);
function classify(src) {
  const K = new Uint8Array(src.length);   // 0 code · 1 str · 2 cmt · 3 re
  let i = 0, st = []; const n = src.length; let lastSig = '', lastWord = '';
  const reOK = () => !lastSig || '(,=:[!&|?{};+-*%<>~^'.includes(lastSig) || KW.has(lastWord);
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (st.length && st[st.length - 1] === 'tpl') {   // 템플릿 글자 안
      if (c === '\\') { K[i] = K[i + 1] = 1; i += 2; continue; }
      if (c === '`') { K[i] = 1; st.pop(); i++; lastSig = '`'; lastWord = ''; continue; }
      if (c === '$' && d === '{') { K[i] = K[i + 1] = 1; st.push('${'); i += 2; lastSig = '{'; lastWord = ''; continue; }
      K[i] = 1; i++; continue;
    }
    if (c === '/' && d === '/') { const e = src.indexOf('\n', i); const j = e < 0 ? n : e; K.fill(2, i, j); i = j; continue; }
    if (c === '/' && d === '*') { const e = src.indexOf('*/', i + 2); const j = e < 0 ? n : e + 2; K.fill(2, i, j); i = j; continue; }
    if (c === '\'' || c === '"') { K[i] = 1; let j = i + 1; while (j < n && src[j] !== c && src[j] !== '\n') { if (src[j] === '\\') { K[j] = 1; j++; } K[j] = 1; j++; } K[j] = 1; i = j + 1; lastSig = c; lastWord = ''; continue; }
    if (c === '`') { K[i] = 1; st.push('tpl'); i++; continue; }
    if (c === '/' && reOK()) { let j = i + 1, cls = false; K[i] = 3; while (j < n && src[j] !== '\n') { const q = src[j]; K[j] = 3; if (q === '\\') { K[j + 1] = 3; j += 2; continue; } if (q === '[') cls = true; else if (q === ']') cls = false; else if (q === '/' && !cls) { j++; break; } j++; } while (j < n && /[a-z]/.test(src[j])) { K[j] = 3; j++; } i = j; lastSig = '/'; lastWord = ''; continue; }
    if (c === '{') { if (st.length) st.push('{'); }
    else if (c === '}') { if (st.length) { const t = st.pop(); if (t === '${') { K[i] = 1; i++; lastSig = '}'; continue; } } }
    if (/\s/.test(c)) { i++; continue; }
    if (/[A-Za-z_$0-9]/.test(c)) { let j = i; while (j < n && /[A-Za-z_$0-9]/.test(src[j])) j++; lastWord = src.slice(i, j); lastSig = 'w'; i = j; continue; }
    lastSig = c; lastWord = ''; i++;
  }
  return K;
}

// ── 대상 파일 ──
function listFiles() {
  const pos = args.filter(a => !a.startsWith('--'));
  const out = [];
  const addDir = (d, re) => { for (const f of fs.readdirSync(d)) if (re.test(f)) out.push(path.join(d, f)); };
  if (!pos.length) { addDir(path.join(ROOT, 'v2/games'), /^town.*\.js$/); addDir(path.join(ROOT, 'v2/js'), /\.js$/); addDir(path.join(ROOT, 'v2'), /\.css$/); }
  for (const p of pos) { const a = path.resolve(p); if (fs.statSync(a).isDirectory()) addDir(a, /\.(js|css)$/); else out.push(a); }
  return out.sort();
}
function changedLines(file) {   // --diff: 그 커밋 뒤 더하거나 고친 줄 번호
  let txt = ''; try { txt = execSync('git diff -U0 ' + DIFF + ' -- "' + path.relative(ROOT, file) + '"', { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 }); } catch (e) { return null; }
  if (!txt) { try { execSync('git ls-files --error-unmatch "' + path.relative(ROOT, file) + '"', { cwd: ROOT, stdio: 'ignore' }); return new Set(); } catch (e) { return null; } }   /* 새 파일(추적 안 됨) = 전부 */
  const S = new Set(); for (const m of txt.matchAll(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/gm)) { const a = +m[1], c = m[2] == null ? 1 : +m[2]; for (let k = 0; k < c; k++) S.add(a + k); } return S;
}

// ── ③ 주석 글이 코드처럼 생겼나(줄 가운데 // 뒤) ──
const CODEISH = [
  /;\s*(?:if|for|while|const|let|var|return|await|else)\b[\s(]/,                  // ; 다음 문장
  /;\s*[A-Za-z_$][\w$.]*(?:\[[^\]]*\])?\s*(?:\(|=[^=]|\+=|-=|\+\+|--)/,            // ; foo( · ; a.b = · ; x++
  /;\s*\}/,                                                                     // ; }
  /(?:^|\s)[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*\([^()]*\)\s*;\s*\S/,               // foo(x); 다음에 또 무언가
  /\)\s*\{\s*[A-Za-z_$][\w$.]*\s*(?:\(|=)/,                                        // ) { foo( — 블록 시작
  /(?:^|\s)[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*\([^()]*\)\s*;\s*$/,                // 줄 끝이 foo(x); 로 끝남
];
function lint(file) {
  const src = fs.readFileSync(file, 'utf8'), css = file.endsWith('.css'), rel = path.relative(ROOT, file);
  const K = css ? null : classify(src); const lines = src.split('\n'); const starts = []; { let o = 0; for (const L of lines) { starts.push(o); o += L.length + 1; } }
  const only = DIFF ? changedLines(file) : null; const F = [];
  const lineOf = (() => { let li = 0; return idx => { while (li + 1 < starts.length && starts[li + 1] <= idx) li++; while (li > 0 && starts[li] > idx) li--; return li; }; })();
  const snip = (li, col) => { const L = lines[li]; const a = Math.max(0, col - 40); return (a ? '…' : '') + L.slice(a, col + 50).replace(/\s+/g, ' ') + (col + 50 < L.length ? '…' : ''); };
  const push = (li, col, kind, msg) => { if (only && !only.has(li + 1)) return; F.push({ file: rel, line: li + 1, col: col + 1, kind, msg, at: snip(li, col) }); };
  // ① 이모지
  for (let i = 0; i < src.length; i++) { const cp = src.codePointAt(i); const w = cp > 0xFFFF ? 2 : 1; if (cp >= 0x2600) { const why = badOf(cp); if (why && (css ? !inCssComment(src, i) : K[i] === 1 || K[i] === 3)) { const li = lineOf(i); push(li, i - starts[li], 'emoji', String.fromCodePoint(cp) + ' U+' + cp.toString(16).toUpperCase() + ' · ' + why); } } i += w - 1; }
  // ② :has(
  for (const m of src.matchAll(/:has\(/g)) { const i = m.index; if (css ? inCssComment(src, i) : K[i] !== 1) continue; const li = lineOf(i); push(li, i - starts[li], 'has', 'CSS :has( — 아이폰 사파리 함정(body h-<이름> 꼬리표로)'); }
  // ③ 줄 가운데 // 뒤 코드
  if (!css) for (let li = 0; li < lines.length; li++) { const L = lines[li], s0 = starts[li]; let j = -1; for (let c = 0; c + 1 < L.length; c++) if (L[c] === '/' && L[c + 1] === '/' && K[s0 + c] === 2 && (c === 0 || K[s0 + c - 1] !== 2)) { j = c; break; }
    if (j <= 0 || !/\S/.test(L.slice(0, j))) continue; let pre = false; for (let c = 0; c < j; c++) if (K[s0 + c] === 0 && /\S/.test(L[c])) { pre = true; break; } if (!pre) continue;
    const t = L.slice(j + 2); if (CODEISH.some(re => re.test(t))) push(li, j, 'midline', '줄 가운데 // 뒤에 코드처럼 보이는 글 — 정말 주석이면 /* */로, 코드면 // 앞으로'); }
  // ④⑤ 슬롭티(--slop · 경고)
  if (SLOP && !css) for (let li = 0; li < lines.length; li++) { const L = lines[li], s0 = starts[li]; let emo = 0, dots = 0, piece = '';
    const flush = () => { const t = piece.replace(/[\s\uFE0F\u200D]/g, ''); const cps = [...t].filter(ch => isEmo(ch.codePointAt(0))); if (!(cps.length === 1 && [...t].length === 1)) emo += cps.length; dots += (piece.match(/·/g) || []).length; piece = ''; };
    for (let c = 0; c < L.length; c++) { if (K[s0 + c] === 1) piece += L[c]; else if (piece) flush(); } if (piece) flush();
    if (emo >= 3) push(li, 0, 'slopEmo', '한 줄 화면 글에 이모지 ' + emo + '개(제목 앞 하나까지)');
    if (dots >= 3) push(li, 0, 'slopDot', "'·'로 이은 조각 " + (dots + 1) + '개(짧은 문장으로)'); }
  return F;
}
const isEmo = cp => (cp >= 0x1F000 && cp <= 0x1FAFF) || (cp >= 0x2600 && cp <= 0x27BF) || cp === 0x2B50 || cp === 0x2B06 || cp === 0x2934 || cp === 0x2935 || cp === 0x23F0 || cp === 0x23F3 || cp === 0x231B;
function inCssComment(src, i) { const a = src.lastIndexOf('/*', i), b = src.lastIndexOf('*/', i); return a > b; }

const files = listFiles(); const found = []; for (const f of files) found.push(...lint(f)); const all = found.filter(f => !f.kind.startsWith('slop')), slop = found.filter(f => f.kind.startsWith('slop'));
if (JSONOUT) console.log(JSON.stringify({ files: files.length, n: all.length, findings: all, slop }, null, 1));
else {
  const by = k => all.filter(f => f.kind === k);
  const head = { emoji: '① 윈도 10에서 깨지는 이모지(글자 속)', has: '② CSS :has(', midline: '③ 줄 가운데 // 뒤 코드' };
  console.log('글 검사 — 파일 ' + files.length + '개' + (DIFF ? ' · ' + DIFF + ' 뒤 바뀐 줄만' : ''));
  for (const k of ['emoji', 'has', 'midline']) { const L = by(k); console.log('\n' + head[k] + ': ' + L.length); for (const f of L) console.log('  ' + f.file + ':' + f.line + ':' + f.col + '  ' + f.msg + '\n      ' + f.at); }
  if (FIXED.size) console.log('\n(SMFix 글꼴이 그린 글자 ' + FIXED.size + '종 — 글자 속 ' + nFixed + '곳은 고침으로 셈 · 캔버스 글씨는 따로 확인)');
  if (SLOP) { const byF = {}; for (const f of slop) { const k = f.file; (byF[k] = byF[k] || { emo: 0, dot: 0 }); byF[k][f.kind === 'slopEmo' ? 'emo' : 'dot']++; }
    console.log('\n④⑤ 슬롭티(경고 · 고치지 않고 목록만): 이모지 셋 이상 ' + slop.filter(f => f.kind === 'slopEmo').length + '줄 · \'·\' 조각 넷 이상 ' + slop.filter(f => f.kind === 'slopDot').length + '줄');
    for (const [k, v] of Object.entries(byF).sort((a, b) => (b[1].emo + b[1].dot) - (a[1].emo + a[1].dot))) console.log('  ' + k + '  이모지 ' + v.emo + ' · 조각 ' + v.dot);
    for (const f of slop) console.log('  ' + f.file + ':' + f.line + '  ' + f.msg + '\n      ' + f.at); }
  console.log('\n' + (all.length ? '찾음 ' + all.length : '깨끗함'));
}
process.exit(all.length && !WARN ? 1 : 0);
