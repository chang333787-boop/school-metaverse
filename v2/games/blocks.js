// v2 블록 놀이(BLOCK-1 · 10-03 교사 "우리 학교에 블록 — 지금 퀄리티 그대로" · "가구까지 부숴야 예쁘다")
//  지금 학교는 그대로 두고 그 위에 0.5m 블록을 놓고 부순다. 가구(책상·책장·사물함…)는 통째로 퍽 부서진다(map.world.furn — 게임이 멈추면 처음대로).
//  판 = metaverse/blockList/<판> {t 이름, n 순서, lock 잠금, open 모두 고치기} · 블록 = metaverse/blocks/<판>/b/<x_z_q> {t 종류, b 놓은 사람} · 부순 가구 = metaverse/blocks/<판>/f/<id> {b, t}
//  듣기 = 판 하나에 연결 하나(blocks/<판> — 학교 와이파이 연결 수 아끼기) · 잠금·모두 고치기는 들어갈 때 한 번 + 6초마다 확인(작은 GET — 연결을 붙잡지 않음)
//  🏠 나만의 판 = 이 기기에만(map.store — 2초에 한 번 저장). 같은 판 친구 블록은 바로 보인다(EventSource) · 함께하기 방이면 친구 모습도(net.js).
//  조작(BLOCK-2 · 10-04 리뷰): 누르기 = 놓기(🔨 모드면 부수기) · 오른쪽 '톡' = 부수기(오른쪽으로 끌면 둘러보기만) · 1~0·휠 = 블록 · Q = 놓기/부수기 · Z = 되돌리기(내가 한 것만 · 잠긴 판은 안 됨) · Esc = 판 창 닫기
//   터치 = 화면 톡 + 오른쪽 아래 🧱/🔨 단추 · 끼이면(되살아난 가구·친구 블록) 저절로 옆 빈자리로 · 선생님 🧹 비우기 → ↩️ 비운 블록 되돌리기(휴지통 한 번)
//  시제품 실측(10-03): 블록 5,170개 = 화면 삼각형 +3.4만·그리기 +26·걷기 계산 +0.1ms · 한 칸 다시 짓기 ≤0.6ms → 판마다 4,000개까지 · 64m 밖 블록 칸은 안 그림.
//  🗺️ 위에서 짓기(TOP-2 · 10-04 교사 '탑뷰로 할 만한 것 — 위에서 블록 짓기 · 이야기 무대 구역'): 칩 → 하늘에서 보기(map.top) + 도구 = 🧱 벽 긋기(누른 칸 → 뗀 칸 곧은 줄 · 거의 가로·세로면 똑바로 · 높이 1~4칸) ·
//   🔨 지우기(긋는 줄의 칸 기둥 통째 — 내가 놓은 것만) · ✋ 옮기기 · 오른쪽 끌기·두 손가락 = 화면 옮기기 · 무대 구역(STAGES — 노란 네모) 안에만(나만의 판·선생님은 학교 어디든) · 📍 여기로 내려가기 = 화면 가운데 땅
//  블록 좌표: x·z = 0.5m 격자(ix, iz) · 높이 q = 5cm 단위(놓인 땅 높이를 따른다 — 운동장 -1.35 · 바닥 0 · 2층) · 블록은 그림자를 받기만(굽기 없음).
import { teacherPin } from '../js/lobby.js?v=12';   // 선생님 비밀번호 창(●로 가림 — 메모장·함께하기와 같은 것 · main.js와 같은 ?v=라야 한 벌)
export const meta = { id: 'blocks', title: '블록 놀이', api: 1 };
const DB = 'https://class-rpg-6f409-default-rtdb.asia-southeast1.firebasedatabase.app/metaverse';
const S = 0.5, CK = 8, MAXB = 4000, FAR = 64, REACH = 9;
export const TYPES = [
  { n: '흰 블록', c: '#f2ede2' }, { n: '빨강', c: '#e04a3f' }, { n: '주황', c: '#f39233' }, { n: '노랑', c: '#f5cf3d' },
  { n: '연두', c: '#9ccf4a' }, { n: '나뭇잎', c: '#3f8f45', tex: 'leaf' }, { n: '하늘', c: '#7ec8f2' }, { n: '파랑', c: '#2f6fd6' },
  { n: '보라', c: '#8d5ad8' }, { n: '분홍', c: '#f39cc2' }, { n: '나무판', c: '#b98550', tex: 'plank' }, { n: '벽돌', c: '#b5553f', tex: 'brick' },
  { n: '돌', c: '#9b9b97', tex: 'stone' }, { n: '유리', c: '#cfeefe', glass: true }, { n: '검정', c: '#33363b' }, { n: '빛 블록', c: '#fff1a6', glow: true },
];
const WHY = { full: '이 판은 블록이 가득 찼어요(4,000개) — 몇 개 부수고 놓아요', out: '학교 밖에는 못 놓아요', high: '너무 높아요', ground: '땅속에는 못 놓아요', have: '여기는 이미 블록이 있어요',
  wall: '벽·가구와 겹쳐요 — 한 칸 옆에 놓아요', door: '🚪 문 자리예요 — 문 앞 한 칸은 비워 둬요(문이 닫히며 블록을 뚫지 않게)', me: '내 몸 자리예요 — 한 걸음 비켜서 놓아요', far: '너무 멀어요 — 가까이 가서 놓아요', farB: '너무 멀어요 — 가까이 가서 부숴요', lock: '🔒 선생님이 잠근 판이에요 — 보기만 할 수 있어요' };
const WHYS = { have: '그 자리에 블록이 있어요', full: '판이 가득 찼어요', wall: '벽·가구와 겹쳐요', door: '문 자리예요', out: '학교 밖이에요', high: '너무 높아요', ground: '땅속이에요', lock: '잠긴 판이에요' };   // 되돌리기 알림용 짧은 까닭
// 아래 가운데 쌓기(데스크톱): 도움말 줄 #help(bottom 10) → 블록 줄 46 → 안내 96 → E 안내 #hint 132(main.js가 56을 직접 적어서 !important · 이 스타일은 놀이가 멈추면 빠짐)
const STYLE = `
#bk-bar{position:fixed;left:50%;bottom:46px;transform:translateX(-50%);display:flex;gap:4px;padding:5px;background:rgba(20,28,40,.62);border-radius:12px;z-index:30}
#bk-bar .s{width:34px;height:34px;border-radius:7px;border:2px solid rgba(255,255,255,.25);background-size:800% 200%;image-rendering:pixelated;cursor:pointer;position:relative;padding:0}
#bk-bar .s.on{border-color:#ffd43b;box-shadow:0 0 0 2px #ffd43b}
#bk-bar .s i{position:absolute;right:2px;bottom:1px;font:700 10px/1 sans-serif;color:#fff;text-shadow:0 1px 2px #000;font-style:normal}
#bk-cross{position:fixed;left:50%;top:50%;width:22px;height:22px;margin:-11px 0 0 -11px;pointer-events:none;z-index:25;display:none;background:linear-gradient(#fff,#fff) center/2px 22px no-repeat,linear-gradient(#fff,#fff) center/22px 2px no-repeat;filter:drop-shadow(0 0 2px #000)}
#bk-tip{position:fixed;left:50%;bottom:96px;transform:translateX(-50%);background:rgba(20,28,40,.72);color:#fff;font:13px/1.4 sans-serif;padding:5px 12px;border-radius:8px;z-index:30;pointer-events:none;white-space:nowrap;max-width:94vw;overflow:hidden;text-overflow:ellipsis}
#bk-tip:empty{display:none}
body:not(.touch) #hint{bottom:132px!important}
body.touch #bk-tip{bottom:calc(166px + env(safe-area-inset-bottom));white-space:normal;word-break:keep-all;overflow-wrap:anywhere;text-align:center;max-width:min(560px,80vw)}
#bk-tb{position:fixed;right:calc(90px + env(safe-area-inset-right));bottom:calc(100px + env(safe-area-inset-bottom));display:none;z-index:30;gap:6px}
body:has(.bk-panel) #bk-tb,body:has(.bk-panel) #bk-bar,body:has(.bk-panel) #bk-tip{display:none!important}
body.bk-top #bk-tb,body.bk-top #bk-bar,body.bk-top #bk-tip,body.bk-top #bk-cross{display:none!important}
#bk-topui{position:fixed;right:calc(12px + env(safe-area-inset-right));top:50%;transform:translateY(-50%);z-index:26;display:flex;flex-direction:column;gap:6px;padding:6px;background:rgba(15,25,45,.82);border-radius:14px}
#bk-topui .g{display:flex;flex-direction:column;gap:2px;background:rgba(255,255,255,.08);border-radius:10px;padding:2px}
#bk-topui .g.h{flex-direction:row;align-items:center}
#bk-topui .g.h b{color:#fff;font:700 12px/1 sans-serif;padding:0 4px}
#bk-topui button{min-width:44px;min-height:44px;border:0;border-radius:9px;background:transparent;color:#fff;font:700 14px/1 sans-serif;cursor:pointer;padding:0 10px;text-align:left;white-space:nowrap}
#bk-topui .g.h button{min-width:34px;padding:0;text-align:center}
#bk-topui button.on{background:#ffd23f;color:#1d3557}
#bk-topui button.go{background:#3fb37f;text-align:center}
#bk-topui #bkTopCol{background-size:800% 200%;image-rendering:pixelated;border:2px solid rgba(255,255,255,.4);min-width:44px}
body.small #bk-topui span{display:none}
body.small #bk-topui{top:calc(96px + env(safe-area-inset-top));transform:none;flex-direction:row;flex-wrap:wrap;width:196px;gap:4px;padding:4px}
body.small #bk-topui .g{flex-direction:row}
body.small #bk-topui .g.h b{display:none}
body.small #bk-topui button{padding:0 6px;text-align:center}
body.small #bk-topui #bkTopUndo{min-width:44px!important}
#bk-tb button{font:600 15px/1 sans-serif;border:0;border-radius:12px;background:rgba(20,28,40,.72);color:#fff;min-width:48px;height:48px;padding:0 10px;cursor:pointer}
#bk-tb button.on{background:#e8590c}
#bk-pal{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);display:none;grid-template-columns:repeat(4,58px);gap:8px;padding:12px;background:rgba(20,28,40,.88);border-radius:14px;z-index:62}
#bk-pal .s{width:58px;height:58px;border-radius:10px;border:3px solid rgba(255,255,255,.25);background-size:800% 200%;image-rendering:pixelated;padding:0}
#bk-pal .s.on{border-color:#ffd43b}
.bk-panel{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:min(440px,92vw);max-height:86vh;overflow:auto;background:#fffdf8;color:#1d2b3a;border-radius:16px;box-shadow:0 10px 40px rgba(0,0,0,.35);padding:16px 18px;z-index:60;font:15px/1.5 sans-serif;word-break:keep-all;overflow-wrap:anywhere}
.bk-panel h3{margin:0 0 6px;font-size:19px}.bk-panel .sm{font-size:13px;color:#5b6675}
.bk-panel .bl{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:10px 0}
.bk-panel button{font:inherit;border:0;border-radius:10px;padding:8px 10px;background:#e8eef6;color:#1d3557;cursor:pointer;text-align:left}
.bk-panel button.pri{background:#2f6fd6;color:#fff;text-align:center}.bk-panel button.cur{outline:3px solid #ffd43b}
.bk-panel .row{display:flex;gap:6px;justify-content:flex-end;flex-wrap:wrap;position:sticky;bottom:-16px;z-index:1;background:#fffdf8;margin:10px -18px -16px;padding:8px 18px 12px;border-top:1px solid #e9edf2}
.bk-panel button.x{float:right;width:44px;height:44px;margin:-6px -8px 4px 8px;padding:0;text-align:center;font-size:18px;background:#eef1f5}
@media (max-height:520px){.bk-panel{max-height:calc(100vh - 16px);padding:10px 14px 16px;font-size:14px}.bk-panel h3{font-size:17px;margin:0 0 2px}.bk-panel .hlp{display:none}.bk-panel .bl{grid-template-columns:repeat(3,1fr);gap:5px;margin:6px 0}.bk-panel .bl button{padding:6px 8px}.bk-panel .row{margin:8px -14px -16px;padding:6px 14px 10px}}
.bk-panel input{font:inherit;border:2px solid #c9d3df;border-radius:10px;padding:5px 8px}
`;

// ── 블록 그림(아틀라스 8×2 칸 · 칸 64px — 둘레 4px는 가장자리 색을 늘려 밉맵 번짐 막기)
function makeAtlas() {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128; const g = cv.getContext('2d');
  let sd = 7; const rnd = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
  const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16), f = (v) => Math.max(0, Math.min(255, Math.round(v * k))); return 'rgb(' + f(n >> 16) + ',' + f((n >> 8) & 255) + ',' + f(n & 255) + ')'; };
  TYPES.forEach((T, i) => {
    const x0 = (i % 8) * 64, y0 = Math.floor(i / 8) * 64, X = x0 + 4, Y = y0 + 4, W = 56;
    g.save(); g.beginPath(); g.rect(x0, y0, 64, 64); g.clip();
    if (T.glass) { g.clearRect(x0, y0, 64, 64); g.fillStyle = 'rgba(207,238,254,0.30)'; g.fillRect(x0, y0, 64, 64); g.strokeStyle = 'rgba(255,255,255,0.95)'; g.lineWidth = 6; g.strokeRect(X + 3, Y + 3, W - 6, W - 6);
      g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 3; g.beginPath(); g.moveTo(X + 12, Y + 30); g.lineTo(X + 30, Y + 12); g.moveTo(X + 16, Y + 42); g.lineTo(X + 42, Y + 16); g.stroke(); g.restore(); return; }
    g.fillStyle = T.c; g.fillRect(x0, y0, 64, 64);
    if (T.tex === 'plank') { for (let r = 0; r < 4; r++) { g.fillStyle = shade(T.c, 0.94 + 0.08 * ((r * 37) % 3) / 2); g.fillRect(X, Y + r * 14, W, 14); g.fillStyle = shade(T.c, 0.68); g.fillRect(X, Y + r * 14 + 13, W, 2);
        const cut = X + ((r * 23) % 40) + 8; g.fillRect(cut, Y + r * 14, 2, 13); }
      for (let k = 0; k < 26; k++) { g.fillStyle = shade(T.c, 0.82); g.fillRect(X + rnd() * W, Y + rnd() * W, 6 + rnd() * 10, 1); } }
    else if (T.tex === 'brick') { g.fillStyle = '#d8cfc4'; g.fillRect(X, Y, W, W);
      for (let r = 0; r < 4; r++) for (let c = -1; c < 3; c++) { const bx = X + c * 28 + (r % 2 ? 14 : 0), by = Y + r * 14; g.fillStyle = shade(T.c, 0.88 + rnd() * 0.24); g.fillRect(bx + 1, by + 1, 26, 12); } }
    else if (T.tex === 'stone') { for (let k = 0; k < 22; k++) { g.fillStyle = shade(T.c, 0.78 + rnd() * 0.4); const s = 6 + rnd() * 12; g.fillRect(X + rnd() * (W - s), Y + rnd() * (W - s), s, s); } }
    else if (T.tex === 'leaf') { for (let yy = 0; yy < 8; yy++) for (let xx = 0; xx < 8; xx++) { const v = rnd(); if (v < 0.45) continue; g.fillStyle = shade(T.c, v < 0.75 ? 0.78 : 1.22); g.fillRect(X + xx * 7, Y + yy * 7, 7, 7); } }
    else if (T.glow) { const gr = g.createRadialGradient(x0 + 32, y0 + 32, 4, x0 + 32, y0 + 32, 34); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, T.c); g.fillStyle = gr; g.fillRect(x0, y0, 64, 64); }
    else { for (let k = 0; k < 70; k++) { g.fillStyle = rnd() < 0.5 ? 'rgba(0,0,0,0.045)' : 'rgba(255,255,255,0.07)'; g.fillRect(X + rnd() * (W - 4), Y + rnd() * (W - 4), 4, 4); } }
    g.strokeStyle = T.glow ? 'rgba(160,120,20,0.35)' : 'rgba(0,0,0,0.22)'; g.lineWidth = 3; g.strokeRect(X + 1.5, Y + 1.5, W - 3, W - 3);   // 블록 테두리(한 칸씩 보이게)
    g.restore();
  });
  return cv;
}

export default async function start(map, params = {}) {
  const THREE = map.three, cam = map.camera;
  let dead = false, board = null, name = '', teacher = false, cur = 0, mode = 'put', es = null;
  try { name = localStorage.getItem('mp.name') || ''; teacher = sessionStorage.getItem('sm.t') === '1'; cur = +(map.store.get('cur', 0)) || 0; } catch (e) { /* */ }
  const css = document.createElement('style'); css.textContent = STYLE; document.head.appendChild(css);
  const ui = document.createElement('div'); ui.id = 'bk-ui'; document.body.appendChild(ui);
  const el = (tag, id, html, parent = ui) => { const d = document.createElement(tag); if (id) d.id = id; if (html != null) d.innerHTML = html; parent.appendChild(d); return d; };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const toast = (s, t = 2.2) => map.hud.toast(s, t);
  const req = (path, method = 'GET', data, keep) => fetch(DB + path + '.json', { method, body: data == null ? undefined : JSON.stringify(data), keepalive: !!keep }).then((r) => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)));   // keep = 페이지를 떠나는 중에도 보냄
  const keyStop = (n) => { for (const t of ['keydown', 'keyup']) n.addEventListener(t, (e) => e.stopPropagation()); };
  // LOCK-2(10-04 교사 '마우스를 눌러야 화면이 돌아가는 건 불편'): 마우스 잠금이 기본 — 가운데 ＋(조준점)를 보고 왼쪽 = 놓기 · 오른쪽 = 부수기(마인크래프트처럼) · Tab = 마우스 보이기(블록 줄·칩 누르기) · 창이 열리면 마우스가 보임
  const SOLO = !!params.solo;   // 🧍 혼자 하기(blocks_solo) = 판 고르기 없이 🏠 나만의 판
  window.SM_ACT = '🧱 블록 놀이';
  if (map.lego) map.lego(true);   // LEGO-2(10-04 교사 '추천으로'): 블록 놀이 동안만 학교 전체가 레고(벽 줄눈·바닥·땅 돌기) — 놀이가 멈추면 지금 모습

  // ── 그림·재질(게임이 멈추면 버림)
  const atlas = makeAtlas(), atlasURL = atlas.toDataURL();
  const tex = new THREE.CanvasTexture(atlas); tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.anisotropy = 4;
  const MAT = { s: new THREE.MeshLambertMaterial({ map: tex, vertexColors: true }), g: new THREE.MeshLambertMaterial({ map: tex, vertexColors: true, transparent: true, depthWrite: false }), l: new THREE.MeshBasicMaterial({ map: tex, vertexColors: true }) };
  const root = new THREE.Group(); root.name = 'blocks'; map.add(root);
  const tileUV = (t) => { const c = t % 8, r = Math.floor(t / 8); return [(c * 64 + 4) / 512, (c * 64 + 60) / 512, 1 - (r * 64 + 60) / 128, 1 - (r * 64 + 4) / 128]; };

  // ── 블록 자료
  const B = new Map(), COLQ = new Map(), CHK = new Map(), MESH = new Map(), DIRTY = new Set(), COLP = new Map(); let hudDirty = false;
  const key = (ix, iz, q) => ix + '_' + iz + '_' + q;
  const ckOf = (ix, iz) => Math.floor(ix * S / CK) + ':' + Math.floor(iz * S / CK);
  const ckey = (ix, iz) => (ix + 20000) * 40000 + (iz + 20000);   // 기둥(x·z 칸) 숫자 이름
  const isGlass = (b) => !!(b && TYPES[b.t] && TYPES[b.t].glass);
  const at = (ix, iz, q) => B.get(key(ix, iz, q));
  function markDirty(b) { hudDirty = true; for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) DIRTY.add(ckOf(b.ix + dx, b.iz + dz)); }
  function apply(k, v) {   // v = {t, b} | null — 받은 것·내가 한 것 모두 여기로(같으면 아무 일 없음)
    const old = B.get(k);
    if (!v) { if (!old) return false; B.delete(k); const cq = COLQ.get(ckey(old.ix, old.iz)); if (cq) cq.delete(old.q); const ch = CHK.get(old.ck); if (ch) ch.delete(k); markDirty(old); colUpdate(old.ix, old.iz); return true; }
    const p = k.split('_'), ix = +p[0], iz = +p[1], q = +p[2], t = Math.max(0, Math.min(TYPES.length - 1, v.t | 0)), by = String(v.b || '').slice(0, 8);
    if (!Number.isFinite(ix) || !Number.isFinite(iz) || !Number.isFinite(q)) return false;
    if (old && old.t === t && old.b === by) return false;
    const b = { ix, iz, q, t, b: by, ck: ckOf(ix, iz), in: old ? old.in : map.q.indoor((ix + 0.5) * S, q / 20, (iz + 0.5) * S) };
    B.set(k, b); let cq = COLQ.get(ckey(ix, iz)); if (!cq) COLQ.set(ckey(ix, iz), cq = new Set()); cq.add(q);
    let ch = CHK.get(b.ck); if (!ch) CHK.set(b.ck, ch = new Set()); ch.add(k); markDirty(b); if (!old) colUpdate(ix, iz); return true;
  }
  // 충돌: 기둥마다 이어진 블록 묶음(run) = 상자 하나 · 상자는 다시 쓴다(높이만 바꿈 — 월드 충돌 배열이 늘지 않게)
  function colUpdate(ix, iz) {
    const ck = ckey(ix, iz), qs = [...(COLQ.get(ck) || [])].sort((a, b) => a - b), runs = [];
    for (const q of qs) { const r = runs[runs.length - 1]; if (r && q === r[1]) r[1] = q + 10; else runs.push([q, q + 10]); }
    let P = COLP.get(ck); if (!P) { if (!runs.length) return; COLP.set(ck, P = []); }
    while (P.length < runs.length) P.push(map.collider.add({ x0: ix * S, x1: (ix + 1) * S, y0: -1e6, y1: -1e6, z0: iz * S, z1: (iz + 1) * S }));
    P.forEach((h, i) => { const r = runs[i]; h.box.y0 = r ? r[0] / 20 : -1e6; h.box.y1 = r ? r[1] / 20 : -1e6; });
  }
  // ── 칸 짓기(보이는 면만 · 칸 8m · 면마다 블록 그늘(AO) — 블록끼리 맞닿은 모서리를 살짝 어둡게)
  const AOF = [1, 0.84, 0.7, 0.58], SH = [0.9, 0.9, 1, 0.66, 0.84, 0.84];
  function build(ck) {
    const old = MESH.get(ck); if (old) for (const m of old) { root.remove(m); m.geometry.dispose(); } MESH.delete(ck);
    const ks = CHK.get(ck); if (!ks || !ks.size) return;
    const BK = new Map();   // 'kind|in' → {p,n,c,u,i}
    const get9 = (kind, inn) => { const k9 = kind + (inn ? 1 : 0); let L = BK.get(k9); if (!L) BK.set(k9, L = { kind, inn, p: [], n: [], c: [], u: [], i: [] }); return L; };
    const solidAt = (ix, iz, q) => { const n = at(ix, iz, q); return n && !isGlass(n); };
    for (const k of ks) { const b = B.get(k); if (!b) continue; const T = TYPES[b.t], gl = !!T.glass, [u0, u1, v0, v1] = tileUV(b.t), L = get9(gl ? 'g' : T.glow ? 'l' : 's', b.in);
      for (let d = 0; d < 6; d++) {
        const a = d >> 1, s = d & 1 ? -1 : 1, D = [0, 0, 0]; D[a] = s;
        const nb = at(b.ix + D[0], b.iz + D[2], b.q + D[1] * 10); if (nb && (!isGlass(nb) || gl)) continue;
        const ua = (a + 1) % 3, va = (a + 2) % 3, base = L.p.length / 3, cs = s > 0 ? [[0, 0], [1, 0], [1, 1], [0, 1]] : [[0, 0], [0, 1], [1, 1], [1, 0]], ao = [];
        for (const [cu, cv] of cs) {
          const o = [0, 0, 0]; o[a] = s > 0 ? 1 : 0; o[ua] = cu; o[va] = cv;
          L.p.push((b.ix + o[0]) * S, b.q / 20 + o[1] * S, (b.iz + o[2]) * S); L.n.push(D[0], D[1], D[2]);
          // 그늘: 바깥 층(D)에서 이 꼭짓점 쪽 옆 둘·모서리
          const U = [0, 0, 0], V = [0, 0, 0]; U[ua] = cu ? 1 : -1; V[va] = cv ? 1 : -1;
          const s1 = solidAt(b.ix + D[0] + U[0], b.iz + D[2] + U[2], b.q + (D[1] + U[1]) * 10), s2 = solidAt(b.ix + D[0] + V[0], b.iz + D[2] + V[2], b.q + (D[1] + V[1]) * 10);
          const cc = solidAt(b.ix + D[0] + U[0] + V[0], b.iz + D[2] + U[2] + V[2], b.q + (D[1] + U[1] + V[1]) * 10), lv = s1 && s2 ? 3 : (s1 ? 1 : 0) + (s2 ? 1 : 0) + (cc ? 1 : 0);
          ao.push(lv); const f = (T.glow ? 1 : SH[d]) * AOF[lv]; L.c.push(f, f, f);
          // 무늬 방향: 옆면은 위가 +y(줄무늬·벽돌이 눕게)
          const hu = a === 2 ? cu : cv, hv = a === 2 ? cv : cu; L.u.push(hu ? u1 : u0, hv ? v1 : v0);
        }
        if (ao[0] + ao[2] > ao[1] + ao[3]) L.i.push(base + 1, base + 2, base + 3, base + 1, base + 3, base); else L.i.push(base, base + 1, base + 2, base, base + 2, base + 3);   // 그늘이 대각선으로 고르게
      }
    }
    const ms = [], cx = (+ck.split(':')[0] + 0.5) * CK, cz = (+ck.split(':')[1] + 0.5) * CK;
    for (const L of BK.values()) { if (!L.i.length) continue;
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(L.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(L.n, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(L.c, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(L.u, 2)); g.setIndex(L.i); g.computeBoundingSphere();
      const m = new THREE.Mesh(g, MAT[L.kind]); m.receiveShadow = L.kind !== 'l' && !L.inn; m.castShadow = false; m.matrixAutoUpdate = false; m.userData.c = [cx, cz]; if (L.kind === 'g') m.renderOrder = 3;
      root.add(m); ms.push(m); }
    MESH.set(ck, ms);
  }
  function flushBuild(max = 6) { let n = 0; for (const ck of DIRTY) { DIRTY.delete(ck); build(ck); if (++n >= max) break; } }

  // ── 겨누기: 화면 점 → 맞은 것(블록 · 가구 · 벽 · 땅) + 놓을 칸
  const RC = new THREE.Raycaster(), V2 = new THREE.Vector2(), O = new THREE.Vector3(), Dv = new THREE.Vector3();
  const isObjCol = (c) => !!map.world.furn.idOf(c);   // 물건(가구·나무) 충돌 상자 — 물건은 삼각형으로 고른다
  // 부술 때 '퍽! ○○' 이름 — world.js objWrap·objScope의 kind마다(OBJ-2로 늘어난 것까지 · 빠지면 시작할 때 콘솔에 알림)
  const KN = { desk: '책상', chair: '의자', shelf: '책장', locker: '사물함', cab: '수납장', board: '게시판', plant: '화분', tree: '나무', bush: '덤불', car: '자동차', goal: '골대', tv: 'TV', ac: '에어컨', fan: '선풍기', ext: '소화기', case: '진열장', cart: '책 수레', printer: '복합기', table: '탁자', beanbag: '빈백', cushion: '방석', purifier: '공기청정기',
    monitor: '모니터', labtable: '실험대', umbrella: '우산꽂이', screen: '칸막이', sofa: '소파', bed: '침대', bench: '벤치', fountain: '음수대', fridge: '냉장고', sink: '개수대', bin: '쓰레기통', box: '상자', mat: '매트', trolley: '수레',
    counter: '배식대', cook: '조리 기구', stand: '보면대', banner: '배너', clock: '시계', aed: '심장충격기', bucket: '대야', cone: '라바콘', piano: '피아노', drum: '북', basket: '공 바구니', slide: '미끄럼틀', swing: '그네',
    climb: '오르기 틀', rocker: '흔들 말', post: '말뚝', seesaw: '시소', statue: '조각상', rack: '거치대' };
  try { const W = window.SD2 && window.SD2.world, miss = new Set(); if (W && W.objects) for (const o of W.objects) if (!KN[o.kind]) miss.add(o.kind);   // 시작할 때 한 번(새 kind가 '물건'으로 새지 않게)
    if (miss.size) console.warn('[blocks] 부술 때 이름(KN)이 없는 물건 종류 — "퍽! 물건"으로 나와요: ' + [...miss].join(', ')); } catch (e) { /* */ }
  function slab(o, d, x0, y0, z0, x1, y1, z1) { let t0 = 0, t1 = 1e9, ax9 = -1; const lo = [x0, y0, z0], hi = [x1, y1, z1], oo = [o.x, o.y, o.z], dd = [d.x, d.y, d.z];
    for (let ax = 0; ax < 3; ax++) { if (Math.abs(dd[ax]) < 1e-9) { if (oo[ax] < lo[ax] || oo[ax] > hi[ax]) return null; continue; } let p = (lo[ax] - oo[ax]) / dd[ax], r = (hi[ax] - oo[ax]) / dd[ax]; if (p > r) { const s9 = p; p = r; r = s9; } if (p > t0) { t0 = p; ax9 = ax; } if (r < t1) t1 = r; if (t0 > t1) return null; }
    if (ax9 < 0) return null; const n = [0, 0, 0]; n[ax9] = -Math.sign(dd[ax9]); return { t: t0, n }; }
  // 닫힌 문 = 겨누기에서 벽처럼(10-04 재시험: 문은 충돌 상자가 없어 3~9m 떨어진 닫힌 교실 문을 누르면 그 뒤 책상이 '퍽!' 부서지고 블록이 교실 안에 놓였다)
  //   문 자리 = 문 폭 × 벽 두께(±0.15) × 문 높이 · 8m 칸 숫자 이름으로(누를 때·20번/초 겨눔에서 가까운 칸만) · 열림 = main.js doorTick과 같은 규칙(몸이 3m 안 · 잠긴 문은 늘 닫힘)
  const DG = new Map(), dkey = (gx, gz) => (gx + 2048) * 4096 + (gz + 2048);
  for (const p of map.pois({ src: 'door' })) { const d = p.door; if (!d) continue; const X = d.ax === 'x', hw = d.w / 2;
    const r = { n: +String(p.id).slice(5), cx: d.cx, cz: d.cz, y0: d.y0, y1: d.y0 + (d.dh ?? 2.6), x0: X ? d.cx - hw : d.cx - 0.15, x1: X ? d.cx + hw : d.cx + 0.15, z0: X ? d.cz - 0.15 : d.cz - hw, z1: X ? d.cz + 0.15 : d.cz + hw };
    for (let gx = Math.floor(r.x0 / 8); gx <= Math.floor(r.x1 / 8); gx++) for (let gz = Math.floor(r.z0 / 8); gz <= Math.floor(r.z1 / 8); gz++) { const k = dkey(gx, gz); let L = DG.get(k); if (!L) DG.set(k, L = []); if (!L.includes(r)) L.push(r); } }
  const doorShut = (r) => { const me = map.player.pos(), dx = me.x - r.cx, dz = me.z - r.cz; return !(dx * dx + dz * dz < 9 && Math.abs(me.y - r.y0) < 2) || !!(map.door && map.door.locked && map.door.locked(r.n)); };
  function doorRay(tMax) {   // O + Dv·t(0~tMax)가 처음 맞는 닫힌 문 { t, n, r } 또는 null
    const ex = O.x + Dv.x * tMax, ez = O.z + Dv.z * tMax; let hit = null;
    for (let gx = Math.floor(Math.min(O.x, ex) / 8); gx <= Math.floor(Math.max(O.x, ex) / 8); gx++) for (let gz = Math.floor(Math.min(O.z, ez) / 8); gz <= Math.floor(Math.max(O.z, ez) / 8); gz++) {
      const L = DG.get(dkey(gx, gz)); if (!L) continue;
      for (let i = 0; i < L.length; i++) { const r = L[i]; const h = slab(O, Dv, r.x0, r.y0, r.z0, r.x1, r.y1, r.z1); if (h && h.t < (hit ? hit.t : tMax) && doorShut(r)) hit = { t: h.t, n: h.n, r }; } }
    return hit;
  }
  // 블록 칸이 문 자리(벽 두께 안)와 겹치나 — 열린 문 자리에 놓으면 문이 블록을 뚫고 닫힌다
  function inDoor(x0, x1, y0, y1, z0, z1) {
    for (let gx = Math.floor(x0 / 8); gx <= Math.floor(x1 / 8); gx++) for (let gz = Math.floor(z0 / 8); gz <= Math.floor(z1 / 8); gz++) { const L = DG.get(dkey(gx, gz)); if (!L) continue;
      for (let i = 0; i < L.length; i++) { const r = L[i]; if (r.x0 < x1 && r.x1 > x0 && r.z0 < z1 && r.z1 > z0 && r.y0 < y1 && r.y1 > y0) return true; } }
    return false;
  }
  // 스쿨버스(차는 부서지는데 버스는 학교에 붙어 있음 — 누르면 '버스'라고 알려 주게) = '버스 안' 구역 둘레 0.5m
  const BUSZ = map.zones.find((z) => /버스/.test(z.label)) || null;
  const onBus = (p) => !!BUSZ && p[0] > BUSZ.x0 - 0.5 && p[0] < BUSZ.x1 + 0.5 && p[2] > BUSZ.z0 - 0.5 && p[2] < BUSZ.z1 + 0.5 && p[1] < (BUSZ.y ?? 0) + 4.5;
  function aimAt(sx, sy) {
    V2.set(sx / innerWidth * 2 - 1, -(sy / innerHeight) * 2 + 1); RC.setFromCamera(V2, cam); O.copy(RC.ray.origin); Dv.copy(RC.ray.direction);
    const me = map.player.pos(), mx = me.x, my = me.y + 1, mz = me.z, maxT = Math.hypot(O.x - mx, O.y - my, O.z - mz) + REACH;
    let best = null;
    // 1) 블록(4cm 걸음으로 칸을 훑고 맞은 블록은 정확히)
    for (let t = 0; t < maxT; t += 0.04) { const x = O.x + Dv.x * t, y = O.y + Dv.y * t, z = O.z + Dv.z * t, ix = Math.floor(x / S), iz = Math.floor(z / S), cq = COLQ.get(ckey(ix, iz)); if (!cq) continue;
      let hitQ = null; for (const q of cq) if (y >= q / 20 && y < q / 20 + S) { hitQ = q; break; } if (hitQ == null) continue;
      const h = slab(O, Dv, ix * S, hitQ / 20, iz * S, (ix + 1) * S, hitQ / 20 + S, (iz + 1) * S); if (h) best = { kind: 'block', t: h.t, n: h.n, ix, iz, q: hitQ }; break; }
    // 2) 학교 충돌 상자(벽·바닥판·사람 — 물건 충돌·블록 상자는 빼고)
    const F = map.world.furn, tEnd = best ? best.t : maxT, w = map.q.rayHit([O.x, O.y, O.z], [O.x + Dv.x * tEnd, O.y + Dv.y * tEnd, O.z + Dv.z * tEnd], { skipDyn: true, skip: isObjCol });
    if (w) best = { kind: 'wall', t: w.t * tEnd, n: w.n, box: w.box };
    // 2½) 닫힌 문(충돌 상자가 없어 광선이 지나가던 것)
    const dh = doorRay(best ? best.t : maxT); if (dh) best = { kind: 'door', t: dh.t, n: dh.n, door: dh.r.n };
    // 3) 물건(가구·나무·소품 — 보이는 삼각형까지 · OBJ-1)
    const tF = best ? best.t : maxT, f = F.pick([O.x, O.y, O.z], [O.x + Dv.x * tF, O.y + Dv.y * tF, O.z + Dv.z * tF]);
    if (f) { const ax = Math.abs(f.n[0]) >= Math.abs(f.n[1]) && Math.abs(f.n[0]) >= Math.abs(f.n[2]) ? 0 : Math.abs(f.n[1]) >= Math.abs(f.n[2]) ? 1 : 2, n = [0, 0, 0]; n[ax] = Math.sign(f.n[ax]) || 1;
      best = { kind: 'furn', t: f.t * tF, n, furn: f.id, fk: f.kind }; }
    // 4) 땅·1층 바닥(충돌 상자가 아닌 높이)
    const tEnd2 = best ? best.t : maxT;
    for (let t = 0.2; t < tEnd2; t += 0.1) { const y = O.y + Dv.y * t, gb = map.q.baseAt(O.x + Dv.x * t, O.z + Dv.z * t); if (y > gb) continue;
      let a = t - 0.1, c = t; for (let k = 0; k < 6; k++) { const m = (a + c) / 2; if (O.y + Dv.y * m > map.q.baseAt(O.x + Dv.x * m, O.z + Dv.z * m)) a = m; else c = m; }
      best = { kind: 'ground', t: c, n: [0, 1, 0] }; break; }
    if (!best) return null;
    const p = [O.x + Dv.x * best.t, O.y + Dv.y * best.t, O.z + Dv.z * best.t]; best.p = p;
    best.far = Math.hypot(p[0] - mx, p[1] - my, p[2] - mz) > REACH;
    // 놓을 칸
    if (best.kind === 'block') best.put = { ix: best.ix + best.n[0], iz: best.iz + best.n[2], q: best.q + best.n[1] * 10 };
    else { const n = best.n, ix = Math.floor((p[0] + n[0] * 0.25) / S), iz = Math.floor((p[2] + n[2] * 0.25) / S); let y;
      if (n[1] > 0) y = best.kind === 'ground' ? map.q.baseAt(p[0], p[2]) : p[1];
      else if (n[1] < 0) y = p[1] - S;
      else { const cx = (ix + 0.5) * S, cz = (iz + 0.5) * S, base = p[1] > 3.2 ? map.q.floorY(cx, cz, 2) : map.q.baseAt(cx, cz); y = base + S * Math.max(0, Math.floor((p[1] - base) / S)); }
      best.put = { ix, iz, q: Math.round(y * 20) }; }
    return best;
  }
  function canPut(ix, iz, q) {
    if (board && board.lock && !teacher) return 'lock';
    if (B.size >= MAXB) return 'full';
    const cx = (ix + 0.5) * S, cz = (iz + 0.5) * S, y = q / 20;
    if (!map.q.inSchool(cx, cz)) return 'out';
    if (y > 28) return 'high';
    if (y < map.q.baseAt(cx, cz) - 0.04) return 'ground';
    const cq = COLQ.get(ckey(ix, iz)); if (cq) for (const q2 of cq) if (Math.abs(q2 - q) < 10) return 'have';
    const hit = cellHit(ix, iz, q); if (hit) return hit;
    const me = map.player.pos(); if (ix * S < me.x + 0.27 && (ix + 1) * S > me.x - 0.27 && iz * S < me.z + 0.27 && (iz + 1) * S > me.z - 0.27 && y < me.y + 1.5 && y + S > me.y + 0.05) return 'me';
    return null;
  }
  // 칸이 학교(벽·가구 — 부순 가구는 빼고)나 문 자리와 겹치나: 'wall' | 'door' | null — 놓기·휴지통 되돌리기 같이
  function cellHit(ix, iz, q) { const y = q / 20, x0 = ix * S + 0.02, x1 = (ix + 1) * S - 0.02, z0 = iz * S + 0.02, z1 = (iz + 1) * S - 0.02;
    if (map.q.overlap({ x0, x1, y0: y + 0.02, y1: y + S - 0.02, z0, z1 }, { skipDyn: true })) return 'wall';
    return inDoor(x0, x1, y + 0.02, y + S - 0.02, z0, z1) ? 'door' : null; }
  const canBreak = (b) => !board || board.local || teacher || board.open || (b.b && b.b === (name || '익명'));
  // 내 몸(±0.27 · 발+0.05~발+1.5 — canPut 'me'와 같은 몸)이 상자 bx{x0,x1,y0,top,z0,z1}와 겹치나
  const meIn = (bx) => { const me = map.player.pos(); return bx.x0 < me.x + 0.27 && bx.x1 > me.x - 0.27 && bx.z0 < me.z + 0.27 && bx.z1 > me.z - 0.27 && bx.y0 < me.y + 1.5 && bx.top > me.y + 0.05; };
  // 가구 상자 안에 블록이 있나(되살리기 전에 — 블록과 가구가 겹쳐 보이지 않게 · 누를 때만)
  function blocksIn(bx) {
    if (!bx) return false; const q0 = Math.round(bx.y0 * 20) + 1, q1 = Math.round(bx.top * 20) - 1;
    for (let ix = Math.floor((bx.x0 + 0.05) / S); ix <= Math.floor((bx.x1 - 0.05) / S); ix++) for (let iz = Math.floor((bx.z0 + 0.05) / S); iz <= Math.floor((bx.z1 - 0.05) / S); iz++) {
      const cq = COLQ.get(ckey(ix, iz)); if (cq) for (const q of cq) if (q + 10 > q0 && q < q1) return true; }
    return false;
  }
  // 맞은 상자가 사람 몸인가(사람 충돌 = 작은 상자가 그 사람 자리에 — 선 사람 0.44각·바닥에 앉은 사람은 다리까지 · 누를 때만 58명을 훑는다)
  function isPerson(bx, p) { if (Math.max(bx.x1 - bx.x0, bx.z1 - bx.z0) > 1.4) return false; const cx = (bx.x0 + bx.x1) / 2, cz = (bx.z0 + bx.z1) / 2;
    for (const r of map.npc.list()) if (!r.hidden && Math.hypot(r.x - cx, r.z - cz) < 0.8 && p[1] > r.y - 0.1 && p[1] < r.y + 2.2) return true; return false; }

  // ── 손대기(놓기·부수기·되돌리기)
  const UNDO = [];
  const pushUndo = (u) => { UNDO.push(u); if (UNDO.length > 60) UNDO.shift(); };
  function doPut(A) {
    if (!A || A.far) return toast(WHY.far, 1.6); if (!A.put) return;   // 아무것도 못 맞힘(9m 밖·하늘) = 너무 멀어요(예전엔 조용히 끝나 왜 안 되는지 몰랐다)
    const { ix, iz, q } = A.put, why = canPut(ix, iz, q); if (why) return toast(WHY[why], 2.4);
    const k = key(ix, iz, q), v = { t: cur, b: name || '익명' }; apply(k, v); send(k, v); pushUndo({ k, put: true, by: v.b, t: v.t }); flushBuild(9);
    map.tone(330 + cur * 18, 0, 0.06, 'triangle', 0.14, 240); ghostOff();
  }
  function doBreak(A) {
    if (!A || A.far) return toast(WHY.farB, 1.6);
    if (board && board.lock && !teacher) return toast(WHY.lock, 2.4);
    if (A.kind === 'block') { const k = key(A.ix, A.iz, A.q), b = B.get(k); if (!b) return;
      if (!canBreak(b)) return toast('친구(' + b.b + ')가 놓은 블록이에요 — 선생님이 「모두 고치기」를 켜면 부술 수 있어요', 3);
      apply(k, null); send(k, null); pushUndo({ k, del: { t: b.t, b: b.b } }); flushBuild(9);
      burst((A.ix + 0.5) * S, A.q / 20 + 0.25, (A.iz + 0.5) * S, TYPES[b.t].c, 10, 0.5); map.tone(200, 0, 0.1, 'square', 0.1, 90); ghostOff(); return; }
    if (A.kind === 'furn' && A.furn) { const r = map.world.furn.hide(A.furn);
      if (!r.ok) return toast('이건 부술 수 없어요', 2);
      if (!r.already) { sendF(A.furn, { b: name || '익명', t: Date.now() }); pushUndo({ furn: A.furn }); const bx = r.box; toast('퍽! ' + (KN[r.kind] || '물건') + (r.with && r.with.length ? ' + 위에 있던 것' : ''), 1.1);
        burst((bx.x0 + bx.x1) / 2, (bx.y0 + bx.top) / 2, (bx.z0 + bx.z1) / 2, r.color, 22, Math.max(0.6, Math.min(2.2, Math.max(bx.x1 - bx.x0, bx.z1 - bx.z0) / 2)));
        map.tone(150, 0, 0.22, 'sawtooth', 0.12, 55); map.tone(420, 0.05, 0.12, 'triangle', 0.08, 200); }
      ghostOff(); return; }
    // 그 밖(학교에 붙은 것) — 무엇을 눌렀는지에 맞게(10-04 재시험: 스쿨버스를 눌러도 '벽·바닥은 못 부숴요'였다)
    const tail = ' — 블록 · 가구 · 나무를 부숴 봐요';
    ghostOff();
    if (A.kind === 'door') return toast('🚪 문은 못 부숴요' + tail, 2.4);
    if (A.kind === 'ground') return toast('땅은 못 부숴요' + tail, 2.4);
    if (A.kind === 'wall' && A.box && isPerson(A.box, A.p)) return toast('사람은 부술 수 없어요' + tail, 2.4);
    if (A.kind === 'wall' && onBus(A.p)) return toast('🚌 스쿨버스는 학교 차라 못 부숴요' + tail, 2.4);
    if (A.kind === 'wall' && A.box && A.box.vy1 != null) return toast('이건 학교에 붙어 있어서 못 부숴요' + tail, 2.4);   // 올라서기 금지 붙박이(울타리·칸막이…)
    const ny = A.n ? A.n[1] : 0;
    toast((ny > 0.5 ? '바닥·계단은' : ny < -0.5 ? '천장은' : '벽은') + ' 못 부숴요' + tail, 2.4);
  }
  // 되돌리기 = 내가 한 것만 하나씩. 잠긴 판이면 기록은 그대로 두고(풀리면 이어서) · 내 몸 자리면 기록을 다시 쌓고(비키면 됨) ·
  //   그 밖에 못 되돌리는 것(친구가 그 칸을 바꿈·판이 가득·블록이 가구 자리에)은 알리고 버린다(예전엔 같은 기록에 걸려 Z가 영영 멈췄다)
  function undo() {
    if (board && board.lock && !teacher) return toast(WHY.lock, 2.4);
    const u = UNDO.pop(); if (!u) return toast('되돌릴 것이 없어요', 1.4);
    const skip = (why) => toast('그건 되돌릴 수 없어요(' + why + ') — 되돌리기를 한 번 더 누르면 그 전 것을 되돌려요', 2.8);
    if (u.batch) {   // 🗺️ 위에서 짓기 한 줄(여러 칸) — 그사이 친구가 바꾼 칸·내 몸 자리는 건너뜀
      let n = 0; for (const e of [...u.batch].reverse()) {
        if (e.put) { const b = B.get(e.k); if (b && b.b === e.by && b.t === e.t) { apply(e.k, null); send(e.k, null); n++; } }
        else if (e.del && !B.has(e.k)) { const p = e.k.split('_'); if (canPut(+p[0], +p[1], +p[2])) continue; apply(e.k, e.del); send(e.k, e.del); n++; } }
      flushBuild(12); map.tone(520, 0, 0.05, 'sine', 0.1, 700); return toast('↩ ' + n + '개 되돌렸어요', 1.6); }
    if (u.put) { const b = B.get(u.k); if (b) { if (b.b !== u.by || b.t !== u.t) return skip('친구가 그 자리를 바꿨어요'); apply(u.k, null); send(u.k, null); } }
    else if (u.del) { if (B.has(u.k)) return skip(WHYS.have);
      const p = u.k.split('_'), why = canPut(+p[0], +p[1], +p[2]);
      if (why === 'me') { UNDO.push(u); return toast(WHY.me, 2); }
      if (why) return skip(WHYS[why] || WHY[why]);
      apply(u.k, u.del); send(u.k, u.del); }
    else if (u.furn) { const F = map.world.furn;
      if (F.isHidden(u.furn)) { const bx = F.box(u.furn);
        if (bx && meIn(bx)) { UNDO.push(u); return toast((KN[bx.kind] || '물건') + ' 자리에 서 있어요 — 한 걸음 비켜서 되돌려요', 2.2); }
        if (blocksIn(bx)) return skip('그 자리에 블록이 있어요');
        F.show(u.furn); sendF(u.furn, null); } }
    flushBuild(9); map.tone(520, 0, 0.05, 'sine', 0.1, 700);
  }

  // ── 부서지는 조각(작은 정육면체 48개 한 메시 · 쉬는 동안 일 0)
  const PN = 48, pMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.11, 0.11, 0.11), new THREE.MeshLambertMaterial(), PN), PS = [];
  pMesh.count = 0; pMesh.frustumCulled = false; root.add(pMesh);
  const _m = new THREE.Matrix4(), _c = new THREE.Color(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _p = new THREE.Vector3();
  function burst(x, y, z, col, n, r) { if (Array.isArray(col)) _c.setRGB(col[0], col[1], col[2]); else _c.set(col);
    for (let i = 0; i < n; i++) { if (PS.length >= PN) PS.shift(); const a = Math.random() * 6.283, sp = 1.4 + Math.random() * 2.2;
      PS.push({ x: x + (Math.random() - 0.5) * r, y: y + (Math.random() - 0.3) * r * 0.6, z: z + (Math.random() - 0.5) * r, vx: Math.cos(a) * sp, vy: 2 + Math.random() * 2.8, vz: Math.sin(a) * sp, t: 0, life: 0.55 + Math.random() * 0.35, rx: Math.random() * 6, c: _c.clone().multiplyScalar(0.8 + Math.random() * 0.35) }); } }
  function pTick(dt) { if (!PS.length) { if (pMesh.count) pMesh.count = 0; return; }
    for (let i = PS.length - 1; i >= 0; i--) { const p = PS[i]; p.t += dt; if (p.t >= p.life) { PS.splice(i, 1); continue; } p.vy -= 12 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.rx += dt * 8; }
    pMesh.count = PS.length; PS.forEach((p, i) => { const k = 1 - p.t / p.life; _s.setScalar(Math.max(0.05, k)); _q.setFromEuler(_e.set(p.rx, p.rx * 0.7, 0)); _m.compose(_p.set(p.x, p.y, p.z), _q, _s); pMesh.setMatrixAt(i, _m); pMesh.setColorAt(i, p.c); });
    pMesh.instanceMatrix.needsUpdate = true; if (pMesh.instanceColor) pMesh.instanceColor.needsUpdate = true; }

  // ── 미리 보기 테(놓을 칸 = 흰 테 · 부술 것 = 빨간 테)
  const ghost = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95 }));
  ghost.visible = false; ghost.renderOrder = 5; root.add(ghost);
  function ghostOff() { ghost.visible = false; }
  function ghostShow(A) {
    if (!A || A.far) return ghostOff();
    if (mode === 'put') { if (!A.put) return ghostOff(); const { ix, iz, q } = A.put, bad = canPut(ix, iz, q);
      ghost.material.color.setHex(bad ? 0xff6b6b : 0xffffff); ghost.scale.set(S + 0.02, S + 0.02, S + 0.02); ghost.position.set((ix + 0.5) * S, q / 20 + S / 2, (iz + 0.5) * S); ghost.visible = true; return; }
    if (A.kind === 'block') { ghost.material.color.setHex(0xff4d4d); ghost.scale.set(S + 0.04, S + 0.04, S + 0.04); ghost.position.set((A.ix + 0.5) * S, A.q / 20 + S / 2, (A.iz + 0.5) * S); ghost.visible = true; return; }
    if (A.kind === 'furn') { const bx = map.world.furn.box(A.furn); if (!bx) return ghostOff(); ghost.material.color.setHex(0xff4d4d);
      ghost.scale.set(bx.x1 - bx.x0 + 0.08, bx.top - bx.y0 + 0.08, bx.z1 - bx.z0 + 0.08); ghost.position.set((bx.x0 + bx.x1) / 2, (bx.y0 + bx.top) / 2, (bx.z0 + bx.z1) / 2); ghost.visible = true; return; }
    ghostOff();
  }

  // ── 같은 판 친구와(Firebase) · 나만의 판(이 기기)
  const pend = new Map(), pendF = new Map(), MINE = new Map(), MINEF = new Map(); let flushT = 0, localT = 0, chkMe = false;   // MINE = 내가 막 바꾼 것(서버가 같은 값을 돌려줄 때까지 · 8초) · chkMe = 가구가 되살아남·친구 블록 → 다음 틱에 내 몸이 끼었나 한 번 봄
  const fresh = (M, k) => { const e = M.get(k); if (!e) return false; if (performance.now() - e > 8000) { M.delete(k); return false; } return true; };
  function send(k, v) { if (!board) return; if (board.local) return saveLocal(); pend.set(k, v); MINE.set(k, performance.now()); if (!flushT) flushT = setTimeout(flush, 140); }
  function sendF(id, v) { if (!board) return; if (board.local) return saveLocal(); pendF.set(id, v); MINEF.set(id, performance.now()); if (!flushT) flushT = setTimeout(flush, 140); }
  async function flush(keep) {
    flushT = 0; if (!board || board.local || (!pend.size && !pendF.size)) return;
    const o = {}; for (const [k, v] of pend) o['b/' + k] = v; for (const [k, v] of pendF) o['f/' + k] = v; pend.clear(); pendF.clear();
    try { await req('/blocks/' + board.id, 'PATCH', o, keep); } catch (e) { if (!keep) toast('저장하지 못했어요 — 인터넷을 확인해 주세요', 2.5); }
  }
  function saveNow(hard) { clearTimeout(localT); localT = 0; if (!board || !board.local) return; const o = {}; for (const [k, b] of B) o[k] = [b.t]; map.store.set('mine', { b: o, f: map.world.furn.hidden() }); if (hard && map.store.flush) map.store.flush(); }   // hard = 지금 바로 기기에(페이지를 떠날 때)
  function saveLocal() { clearTimeout(localT); localT = setTimeout(saveNow, 300); }
  // 기다리던 저장을 지금(판을 바꾸기 전·그만두기 전 — 예전엔 0.3초 안에 그만두면 마지막 블록이 사라지고, 다음 판 자료가 앞 판에 섞일 수 있었다)
  function settle() { if (localT) saveNow(); if (flushT) { clearTimeout(flushT); flush(); } }
  // 새로고침·탭 닫기·다른 앱으로(10-04 재시험: 나만의 판에서 놓고 0.4초 안에 Ctrl+Shift+R 하면 그 블록이 사라졌다 — 0.3초 기다림 + map.store 2초 몰아 쓰기) → 기다리던 것을 지금 바로
  const onLeave = () => { if (dead || !board) return; if (board.local) saveNow(true); else if (flushT) { clearTimeout(flushT); flush(true); } };
  const onVis = () => { if (document.visibilityState === 'hidden') onLeave(); };
  addEventListener('pagehide', onLeave); document.addEventListener('visibilitychange', onVis);
  function clearAll() { for (const k of [...B.keys()]) apply(k, null); const hid = map.world.furn.hidden(); for (const id of hid) map.world.furn.show(id); if (hid.length) chkMe = true; UNDO.length = 0; flushBuild(999); }
  function norm(v) { return Array.isArray(v) ? { t: v[0] | 0, b: '' } : v && typeof v === 'object' ? { t: v.t | 0, b: v.b || '' } : null; }   // 나만의 판 = [t] 배열 — 배열도 object라 먼저 본다(예전엔 다시 들어오면 모두 흰 블록)
  function onBlocks(path, data, patch) {
    const one = (k, v) => { const b = B.get(k), same = v ? !!b && b.t === v.t && b.b === v.b : !b; if (same) { MINE.delete(k); return; } if (fresh(MINE, k)) return; apply(k, v); if (v) chkMe = true; };   // 내가 막 바꾼 칸은 서버가 같은 값을 줄 때까지 내 것 그대로 · 친구 블록이 내 몸 자리에 오면 다음 틱에 비킴
    if (path === '/') { if (!patch) { const want = data || {}; for (const k of [...B.keys()]) if (!(k in want)) one(k, null); for (const k in want) one(k, norm(want[k])); }
      else for (const k in (data || {})) one(k, data[k] ? norm(data[k]) : null); }
    else { const seg = path.split('/').filter(Boolean); if (seg.length === 1) one(seg[0], data ? norm(data) : null); }
    hudLine();
  }
  function onFurn(path, data, patch) {
    const F = map.world.furn, setH = (id, on) => { if (!!F.isHidden(id) === on) { MINEF.delete(id); return; } if (fresh(MINEF, id)) return; if (on) F.hide(id); else { F.show(id); chkMe = true; } };   // 되살아난 가구 자리에 내가 있으면 다음 틱에 비킴
    if (path === '/') { if (!patch) { const want = data || {}; for (const id of F.hidden()) if (!(id in want)) { F.show(id); chkMe = true; } for (const id in want) setH(id, true); }
      else for (const id in (data || {})) setH(id, !!data[id]); }
    else { const seg = path.split('/').filter(Boolean); if (seg.length === 1) setH(seg[0], !!data); }
  }
  function stream(path, fn) { const s = new EventSource(DB + path + '.json'); const h = (ev) => { try { const m = JSON.parse(ev.data); fn(m.path, m.data, ev.type === 'patch'); } catch (e) { /* */ } };
    s.addEventListener('put', h); s.addEventListener('patch', h); return s; }
  // blocks/<판> 한 줄기: '/'(전체 {b, f}) · '/b'·'/f'(통째) · '/b/<k>'·'/f/<id>'(하나) · patch = 열쇠가 'b/<k>'처럼 경로일 수 있음
  function onBoard(path, data, patch) {
    const seg = path.split('/').filter(Boolean);
    if (patch) { for (const k in (data || {})) { const s2 = seg.concat(k.split('/').filter(Boolean)), v = data[k];
        if (s2.length === 1 && (s2[0] === 'b' || s2[0] === 'f')) (s2[0] === 'b' ? onBlocks : onFurn)('/', v, true);
        else if (s2.length === 2) (s2[0] === 'b' ? onBlocks : onFurn)('/' + s2[1], v, false); }
      return; }
    if (!seg.length) { onBlocks('/', data && data.b, false); onFurn('/', data && data.f, false); return; }
    const fn = seg[0] === 'b' ? onBlocks : seg[0] === 'f' ? onFurn : null; if (!fn) return;
    fn(seg.length === 1 ? '/' : '/' + seg[1], data, false);
  }
  // 잠금·모두 고치기 확인(작은 GET — 판 줄기에 넣으려면 규칙을 바꿔야 해서 따로) · 들어갈 때 바로 한 번 + 6초마다(예전 15초 — 선생님이 잠근 뒤에도 한참 놓을 수 있었다)
  let cfgT = 0; const CFG_MS = 6000;
  async function cfgPoll() { clearTimeout(cfgT); cfgT = 0; if (dead || !board || board.local) return; const bd = board;
    try { const c = await req('/blockList/' + bd.id);
      if (c && board === bd) { const lk = !!c.lock !== !!bd.lock, op = !!c.open !== !!bd.open; bd.lock = !!c.lock; bd.open = !!c.open;
        if (lk || op) { chips(); if (!teacher) toast(lk ? (bd.lock ? '🔒 선생님이 판을 잠갔어요 — 이제 보기만 해요' : '🔓 선생님이 잠금을 풀었어요') : (bd.open ? '🤝 이제 친구 블록도 부술 수 있어요' : '🙅 이제 내 블록만 부술 수 있어요'), 2.6); } } } catch (e) { /* */ }
    if (!dead && board === bd) cfgT = setTimeout(cfgPoll, CFG_MS); }   // 그사이 판을 바꿨으면 새 판이 따로 돈다(겹쳐 돌지 않게)
  function enter(b) {
    settle();   // 앞 판에 기다리던 저장을 먼저(앞 판 이름으로)
    if (es) { es.close(); es = null; } clearTimeout(cfgT);
    closePanel(); clearAll(); MINE.clear(); MINEF.clear(); board = b; map.store.set('last', b.id);
    if (b.local) { const m = map.store.get('mine', null); if (m && m.b) for (const k in m.b) apply(k, norm(m.b[k])); if (m && m.f) for (const id of m.f) map.world.furn.hide(id); flushBuild(999); chkMe = true; }
    else { es = stream('/blocks/' + b.id, onBoard); cfgT = setTimeout(cfgPoll, 0); }
    chips(); hudLine(); tip(true);
  }

  // ── 판 고르기 · 선생님
  let panel = null;
  const closePanel = () => { if (panel) panel.remove(); panel = null; };
  function onTeacher() {   // 이 탭에서 선생님 비밀번호를 맞힘(여기 🔒 · 함께하기 방 만들기 · 메모장 — 'sm-teacher') → 바로 선생님 모드
    if (teacher || dead) return; teacher = true; chips();
    if (panel && panel.id === 'bk-pick') { const v = panel.querySelector('#bkName').value; pick(); panel.querySelector('#bkName').value = v; }   // 적던 이름은 그대로
  }
  addEventListener('sm-teacher', onTeacher);
  async function teacherLogin() {
    const r = await teacherPin((m) => toast(m, 2)); if (!r || dead) return;
    onTeacher(); toast(r === 'new' ? '🔒 비밀번호를 정했어요 — 선생님 모드' : '🔓 선생님 모드', 2);
  }
  async function pick() {
    if (SOLO) return soloMenu();
    document.exitPointerLock?.(); closePanel(); panel = el('div', 'bk-pick'); panel.className = 'bk-panel'; keyStop(panel);
    panel.innerHTML = (board ? '<button class="x" id="bkX" title="닫기">✕</button>' : '') + '<h3>🧱 블록 놀이' + (teacher ? ' <span class="sm">· 🔓 선생님</span>' : '') + '</h3><div class="sm">우리 학교 곳곳에 블록을 놓고 부숴요. 책상·의자·책장·사물함·나무도 🔨로 통째로 퍽! 같은 판에 들어온 친구들 블록이 바로 보여요.</div>'
      + '<div class="sm hlp" style="margin-top:4px">' + (touchy() ? '화면을 톡 = 놓기 · 오른쪽 아래 🧱 단추를 누르면 🔨 부수기로 바뀌어요' : '가운데 ＋를 보고 누르기 = 놓기 · 오른쪽 = 부수기 · Q = 놓기/부수기 바꾸기 · Z = 되돌리기 · Tab = 마우스 보이기') + '</div>'
      + '<div style="margin:8px 0">내 이름 <input id="bkName" maxlength="8" style="width:140px;margin-left:6px" placeholder="이름"></div><div class="sm">선생님이 알려 준 판에 들어가요.</div><div class="bl">불러오는 중…</div>'
      + '<div class="row">' + (teacher ? '' : '<button id="bkT">🔒 선생님</button>') + '<button id="bkQuit">그만하기</button>' + (board ? '<button class="pri" id="bkBack">▶ 계속하기</button>' : '') + '</div>';   // 놀이 중에 판 칩으로 열었으면 닫기(Esc도 — onEsc) · 처음엔 판을 골라야 해서 없음
    const nm = panel.querySelector('#bkName'); nm.value = name;
    panel.querySelector('#bkQuit').onclick = () => map.quit && map.quit();
    if (board) { panel.querySelector('#bkBack').onclick = () => closePanel(); panel.querySelector('#bkX').onclick = () => closePanel(); }   // ✕ = 휴대폰엔 Esc가 없어서
    if (!teacher) panel.querySelector('#bkT').onclick = teacherLogin;
    const P = panel; let list = {};
    try { list = (await req('/blockList')) || {}; } catch (e) { list = {}; P.querySelector('.bl').textContent = '판 목록을 불러오지 못했어요 — 🏠 나만의 판은 쓸 수 있어요'; }
    if (dead || panel !== P) return;
    const ids = Object.keys(list).sort((a, b) => (list[a].n ?? 99) - (list[b].n ?? 99) || a.localeCompare(b)), last = map.store.get('last', null);
    const btn = (id, label, sub) => '<button data-id="' + esc(id) + '"' + (board && board.id === id || (!board && last === id) ? ' class="cur"' : '') + '>' + label + (sub ? '<div class="sm">' + sub + '</div>' : '') + '</button>';
    P.querySelector('.bl').innerHTML = ids.map((id) => btn(id, esc(list[id].t || id), list[id].lock ? '🔒 보기만' : list[id].open ? '🤝 모두 함께 고치기' : '')).join('') + btn('@mine', '🏠 나만의 판', '이 기기에만 저장');
    P.querySelectorAll('.bl button').forEach((x) => x.onclick = () => {
      const nv = nm.value.trim().replace(/[.#$[\]/]/g, '').slice(0, 8), id = x.dataset.id;
      if (id !== '@mine' && !nv) { nm.focus(); return toast('이름을 먼저 적어요', 2); }
      const renamed = !!nv && nv !== name;
      if (nv) { name = nv; try { localStorage.setItem('mp.name', nv); } catch (e) { /* */ } dispatchEvent(new CustomEvent('sm-name', { detail: nv })); }
      if (board && board.id === id) {   // 지금 판을 다시 누름 = 창만 닫기(다시 불러오지 않음 — 블록·↩ 되돌리기 기록 그대로)
        if (!board.local && list[id]) { board.lock = !!list[id].lock; board.open = !!list[id].open; board.t = list[id].t || id; }
        closePanel(); chips(); if (renamed) toast('✏️ 이름을 「' + name + '」(으)로 바꿨어요', 2); return; }
      closePanel(); enter(id === '@mine' ? { id: '@mine', local: true, t: '🏠 나만의 판' } : { id, t: list[id].t || id, lock: !!list[id].lock, open: !!list[id].open });
    });
  }
  // 휴지통 보관본(🧹 비우기 때 한 번 — trash/bk_<판> {t, d: 블록 JSON 글}) — 관리 창을 처음 열 때·비운 뒤에만 받는다
  let TR = null;
  const KEYRE = /^-?\d{1,5}_-?\d{1,5}_-?\d{1,4}$/;
  async function trashGet(id) { let bak = null; try { bak = await req('/trash/bk_' + id); } catch (e) { return null; }
    let old = null; try { old = bak && bak.d ? JSON.parse(bak.d) : null; } catch (e) { old = null; }   // 망가진 글이면 없는 것으로
    return { id, t: bak ? bak.t : 0, old: old && typeof old === 'object' ? old : null }; }
  async function admin(refetch) {
    if (!board || board.local) return; document.exitPointerLock?.(); closePanel(); const P = panel = el('div', 'bk-admin'); P.className = 'bk-panel'; keyStop(P);
    const bd = board, no = (bd.t.match(/\d+/) || [''])[0], F = map.world.furn;
    P.innerHTML = '<button class="x" data-a="x" title="닫기">✕</button><h3>🧑‍🏫 ' + esc(bd.t) + ' 관리</h3><div class="sm">블록 ' + B.size + '개 · 부순 가구 ' + F.hidden().length + '개</div><div class="bl">'
      + '<button data-a="lock">' + (bd.lock ? '🔓 잠금 풀기' : '🔒 잠그기(보기만)') + '</button><button data-a="open">' + (bd.open ? '🙅 내 블록만 고치기로' : '🤝 모두 함께 고치기') + '</button>'
      + '<button data-a="furn">🏫 가구 모두 되살리기</button><button data-a="wipe">🧹 이 판 비우기<div class="sm">블록을 지우고 가구도 처음대로</div></button></div>'
      + '<div class="bk-tr sm">휴지통 확인 중…</div><div class="row"><button class="pri" data-a="x">닫기</button></div>';
    const showTr = () => { if (panel !== P || dead) return; const d = P.querySelector('.bk-tr'), n = TR && TR.id === bd.id && TR.old ? Object.keys(TR.old).length : 0;
      d.innerHTML = n ? '<button data-a="undo" style="width:100%">↩️ 비운 블록 되돌리기<div class="sm">' + n + '개 · ' + esc(new Date(TR.t).toLocaleString('ko-KR')) + '에 비움 · 지금 판에 더해요(블록이 있는 칸은 그대로)</div></button>' : '휴지통: 보관된 블록이 없어요'; };
    if (refetch || !TR || TR.id !== bd.id) trashGet(bd.id).then((T) => { if (T) TR = T; showTr(); }); else showTr();
    P.onclick = async (e) => {   // 단추가 나중에 생겨도(↩️) 한 곳에서
      const x = e.target.closest('button[data-a]'); if (!x || panel !== P) return; const a = x.dataset.a;
      try {
        if (a === 'x') return closePanel();
        if (a === 'lock') { await req('/blockList/' + bd.id + '/lock', 'PUT', !bd.lock); bd.lock = !bd.lock; toast(bd.lock ? '🔒 잠갔어요 — 아이들은 보기만 해요' : '🔓 잠금을 풀었어요'); }
        if (a === 'open') { await req('/blockList/' + bd.id + '/open', 'PUT', !bd.open); bd.open = !bd.open; toast(bd.open ? '🤝 이제 친구 블록도 부술 수 있어요' : '🙅 이제 내 블록만 부술 수 있어요'); }
        if (a === 'furn') {   // 그 자리에 블록이 있는 가구는 그대로 둔다(블록과 가구가 겹쳐 보이지 않게) · 되살아난 자리에 서 있던 아이는 저절로 비킨다(chkMe)
          const hid = F.hidden(); if (!hid.length) return toast('부순 가구가 없어요', 2);
          const ok = [], keep = []; for (const id of hid) (blocksIn(F.box(id)) ? keep : ok).push(id);
          if (!ok.length) return toast('부순 가구 ' + keep.length + '개 자리에 모두 블록이 있어요 — 블록을 먼저 부숴 주세요', 3);
          if (!confirm('부순 가구 ' + ok.length + '개를 되살릴까요?' + (keep.length ? '\n(' + keep.length + '개는 그 자리에 블록이 있어서 그대로 둬요)' : ''))) return;
          if (!keep.length) await req('/blocks/' + bd.id + '/f', 'DELETE'); else { const o = {}; for (const id of ok) o[id] = null; await req('/blocks/' + bd.id + '/f', 'PATCH', o); }
          toast('🏫 가구 ' + ok.length + '개를 되살렸어요' + (keep.length ? ' · ' + keep.length + '개는 블록이 있어 그대로예요' : ''), 3); }
        if (a === 'wipe') { const fN = F.hidden().length; if (!B.size && !fN) return toast('비울 것이 없어요 — 블록도 부순 가구도 없어요', 2.5);
          const ans = prompt('「' + bd.t + '」의 블록 ' + B.size + '개를 모두 지우고' + (fN ? ' 부순 가구 ' + fN + '개도 처음대로 되살려요' : '요') + '(블록은 휴지통에 한 번 남아요).\n지우려면 판 번호' + (no ? '(' + no + ')' : '') + '를 적어 주세요'); if (ans == null) return;
          if (ans.trim() !== (no || bd.t)) return toast('번호가 달라요 — 지우지 않았어요', 2.5);
          if (B.size) { const o = {}; for (const [k, b] of B) o[k] = { t: b.t, b: b.b }; const t = Date.now(); await req('/trash/bk_' + bd.id, 'PUT', { t, d: JSON.stringify(o) }); TR = { id: bd.id, t, old: o }; }   // 빈 판을 비울 때는 보관본을 덮지 않음
          await req('/blocks/' + bd.id, 'DELETE'); toast('🧹 비웠어요 — 🧑‍🏫 판 관리의 ↩️로 블록을 되돌릴 수 있어요', 3.2); }
        if (a === 'undo') { const T = TR && TR.id === bd.id ? TR.old : null; if (!T) return;
          const add = {}; let n = 0, skip = 0, cut = 0, bump = 0;   // bump = 되살아난 가구·벽·문 자리와 겹치는 칸(비우기 때 가구가 처음대로 돌아옴 — 그 안에 블록이 박히지 않게 · 10-04 재시험)
          for (const k in T) { if (!KEYRE.test(k)) continue; if (B.has(k)) { skip++; continue; } if (B.size + n >= MAXB) { cut++; continue; }
            { const p9 = k.split('_'); if (cellHit(+p9[0], +p9[1], +p9[2])) { bump++; continue; } }
            const v = T[k] || {}; add[k] = { t: Math.max(0, Math.min(TYPES.length - 1, v.t | 0)), b: String(v.b || '').slice(0, 8) }; n++; }
          if (!n) return toast('되돌릴 블록이 없어요 — ' + (bump ? '가구·벽·문 자리와 겹치거나 ' : '') + '그 칸마다 이미 블록이 있어요', 2.6);
          if (!confirm('휴지통의 블록 ' + n + '개를 「' + bd.t + '」에 되돌릴까요?(지금 있는 블록은 그대로)')) return;
          await req('/blocks/' + bd.id + '/b', 'PATCH', add);   // 판 줄기(onBoard)가 받아 바로 보인다 · 보관본은 그대로(다시 눌러도 있는 칸은 건너뜀)
          toast('↩️ 블록 ' + n + '개를 되돌렸어요' + (skip ? ' · 이미 블록이 있는 ' + skip + '칸은 그대로' : '') + (bump ? ' · 가구·벽·문 자리와 겹치는 ' + bump + '개는 빼요' : '') + (cut ? ' · 판이 가득 차서 ' + cut + '개는 못 넣었어요' : ''), 3.5); }
      } catch (err) { toast('하지 못했어요 — 인터넷을 확인해 주세요', 2.5); }
      chips(); if (panel === P) admin(false);
    };
  }

  // ── 화면(칩 · 블록 줄 · 안내)
  const bar = el('div', 'bk-bar'), tipEl = el('div', 'bk-tip'), tb = el('div', 'bk-tb'), pal = el('div', 'bk-pal');
  keyStop(bar);
  const sw = (i) => { const c = i % 8, r = Math.floor(i / 8); return 'background-image:url(' + atlasURL + ');background-position:' + (c / 7 * 100) + '% ' + (r * 100) + '%'; };
  bar.innerHTML = TYPES.map((T, i) => '<button class="s" data-i="' + i + '" title="' + esc(T.n) + '" style="' + sw(i) + '"><i>' + (i < 9 ? i + 1 : i === 9 ? 0 : '') + '</i></button>').join('');
  pal.innerHTML = TYPES.map((T, i) => '<button class="s" data-i="' + i + '" title="' + esc(T.n) + '" style="' + sw(i) + '"></button>').join('');
  tb.innerHTML = '<button id="bkMode">🧱 놓기</button><button id="bkCur" style="' + sw(cur) + ';background-size:800% 200%;width:48px"></button><button id="bkUndo">↩</button>';
  const mBtn = tb.querySelector('#bkMode');
  const setCur = (i) => { cur = (i + TYPES.length) % TYPES.length; map.store.set('cur', cur); bar.querySelectorAll('.s').forEach((x) => x.classList.toggle('on', +x.dataset.i === cur)); pal.querySelectorAll('.s').forEach((x) => x.classList.toggle('on', +x.dataset.i === cur));
    const cb = tb.querySelector('#bkCur'); cb.style.backgroundPosition = ((cur % 8) / 7 * 100) + '% ' + (Math.floor(cur / 8) * 100) + '%'; if (mode !== 'put') setMode('put'); tip(true); if (setCur.top) setCur.top(); };
  bar.onclick = (e) => { const s = e.target.closest('.s'); if (s) setCur(+s.dataset.i); };
  pal.onclick = (e) => { const s = e.target.closest('.s'); if (s) setCur(+s.dataset.i); pal.style.display = 'none'; };
  mBtn.onclick = () => setMode(mode === 'put' ? 'break' : 'put');
  tb.querySelector('#bkCur').onclick = () => { pal.style.display = pal.style.display === 'grid' ? 'none' : 'grid'; };
  tb.querySelector('#bkUndo').onclick = () => undo();
  const touchy = () => document.body.classList.contains('touch');
  let lastTouch = touchy(), tipT = 0;
  function layout(flash) { const t = touchy(); bar.style.display = t ? 'none' : 'flex'; tb.style.display = t ? 'flex' : 'none'; tip(flash); }   // 터치 = 오른쪽 아래 단추 · 아니면 아래 블록 줄
  function setMode(m) { mode = m; mBtn.textContent = m === 'put' ? '🧱 놓기' : '🔨 부수기'; mBtn.classList.toggle('on', m === 'break'); chips(); tip(true); ghostOff(); }   // 단추에 글자도(터치 아이가 지금 무엇인지 알게)
  // 안내 한 줄: 데스크톱 = 늘(키 안내) · 터치 = 들어갈 때·바꿀 때 7초만(휴대폰 화면 가운데를 늘 덮지 않게 · 눌리지 않음 — 조이스틱·버튼을 막지 않음)
  function tip(flash) {
    const t = touchy();
    tipEl.textContent = !board ? '' : t ? (mode === 'put' ? '🧱 화면을 톡 = ' + TYPES[cur].n + ' 놓기 · 🧱 놓기 단추를 누르면 🔨 부수기로 · ↩ = 되돌리기' : '🔨 블록·가구·나무를 톡 = 부수기 · 🔨 부수기 단추를 누르면 🧱 놓기로')
      : mode === 'put' ? '🧱 ' + TYPES[cur].n + ' 놓기 — 가운데 ＋를 보고 누르기 · 오른쪽 = 부수기 · 1~0·휠 = 블록 · Q = 놓기/부수기 · Z = 되돌리기 · Tab = 마우스 보이기' : '🔨 부수기 — 블록·가구·나무에 ＋를 대고 누르기 · Q = 놓기로 · Z = 되돌리기 · Tab = 마우스 보이기';
    if (!t) { clearTimeout(tipT); tipT = 0; tipEl.style.display = ''; return; }
    if (flash && board) { tipEl.style.display = ''; clearTimeout(tipT); tipT = setTimeout(() => { tipT = 0; if (touchy()) tipEl.style.display = 'none'; }, 7000); }
    else if (!tipT) tipEl.style.display = 'none';
  }
  function hudLine() { if (!board) return; map.hud.chip('bk-b', '🧱 ' + board.t + ' · ' + B.size + '개' + (board.lock ? ' · 🔒' : ''), { onClick: () => pick() }); }
  function soloMenu() {   // 🧍 혼자 하기: 판 고르기 대신 작은 창 — 계속하기 · 다 지우기 · 그만하기
    document.exitPointerLock?.(); closePanel(); const P = panel = el('div', 'bk-solo'); P.className = 'bk-panel'; keyStop(P);
    P.innerHTML = '<h3>🧱 블록 놀이 — 🏠 나만의 판</h3><div class="sm">이 기기에만 저장돼요 · 블록 ' + B.size + '개</div><div class="row"><button id="bkWipe">🧹 다 지우기</button><button id="bkQuit">그만하기</button><button class="pri" id="bkBack">▶ 계속하기</button></div>';
    P.querySelector('#bkBack').onclick = () => closePanel(); P.querySelector('#bkQuit').onclick = () => map.quit && map.quit();
    P.querySelector('#bkWipe').onclick = () => { if (!confirm('나만의 판의 블록을 모두 지우고 부순 가구도 되살릴까요?')) return; clearAll(); saveLocal(); toast('🧹 다 지웠어요', 2); closePanel(); };
  }
  function chips() {
    if (!board) return; hudLine(); const k = touchy() ? '' : ' (Q)', kz = touchy() ? '' : ' (Z)';   // 터치(태블릿 포함)엔 키 안내를 뺀다
    map.hud.chip('bk-m', topOn ? null : (mode === 'put' ? '🧱 놓기' : '🔨 부수기') + k, { onClick: () => setMode(mode === 'put' ? 'break' : 'put') });   // 위에서 짓기 = 오른쪽 도구 줄이 대신
    map.hud.chip('bk-u', topOn ? null : '↩ 되돌리기' + kz, { onClick: () => undo() });   // 위에서 짓기 = 도구 줄에 ↩
    map.hud.chip('bk-x', topOn ? null : '🚪 빠져나오기', { onClick: () => unstuck() });
    map.hud.chip('bk-v', map.top && !topOn ? '🗺️ 위에서 짓기' : null, { onClick: () => topEnter() });
    map.hud.chip('bk-t', teacher && !board.local ? '🧑‍🏫 판 관리' : null, { onClick: () => admin(true) });
    layout();
  }
  // 블록·되살아난 가구에 갇혔을 때 — 가까운 빈자리로. 2층(서관 위)에 있으면 2층에서 먼저 찾는다(예전엔 늘 1층 땅으로 떨어졌다) · 블록 탑 위·1층은 땅으로
  function unstuck(msg) {
    const me = map.player.get(), f2 = map.q.floorY(me.x, me.z, 2), up = me.y > 2.5 && f2 > map.q.baseAt(me.x, me.z) + 2;   // f2 = 발밑 2층 바닥(블록은 안 셈) — 2층 사각형 밖이면 땅 높이
    for (const on2 of up ? [true, false] : [false]) for (let r = 1; r <= 14; r++) for (let a = 0; a < 16; a++) {
      const x = me.x + Math.cos(a / 16 * 6.283) * r, z = me.z + Math.sin(a / 16 * 6.283) * r, y = on2 ? map.q.floorY(x, z, 2) : map.q.baseAt(x, z);
      if (on2 && Math.abs(y - f2) > 1.2) continue;   // 2층 밖(창 너머)·계단 구멍은 건너뜀
      if (!map.q.inSchool(x, z) || map.q.overlap({ x0: x - 0.3, x1: x + 0.3, y0: y + 0.05, y1: y + 1.6, z0: z - 0.3, z1: z + 0.3 })) continue;
      map.player.teleport(on2 ? [x, y, z] : { x, z }); return toast(msg || '🚪 빠져나왔어요', 2); }
    toast('빈 자리를 못 찾았어요 — 선생님께 말해요', 2.5); }
  const freeMe = () => { const me = map.player.pos(); if (map.q.blocked(me.x, me.z, me.y)) unstuck('🚪 몸이 끼어서 옆 빈자리로 옮겼어요'); };   // 되살아난 가구·친구 블록 속이면(한 번만 봄)
  map.on('stuck', () => { if (board && !dead && !panel) unstuck('🚪 몸이 끼어서 옆 빈자리로 옮겼어요'); });   // 그래도 끼어 1.5초 못 움직이면(엔진 'stuck')
  const crossEl = el('div', 'bk-cross', '', document.body);
  setCur(cur); layout();

  // ── 입력
  //  Shift(달리기)+누르기 부수기는 없앴다(달리며 놓으려다 친구 블록·가구를 부수고 · 창을 바꾸면 Shift가 눌린 채 굳었다) — 부수기 = 오른쪽 톡 · Q · 🔨
  let hoverT = 0, mx = -1, my = -1, RT = null, wAcc = 0, wLast = 0, wStep = 0;   // RT = 오른쪽 누름 {t, m 움직인 양} — 끌지 않은 '톡'만 부수기
  const onCanvas = (e) => !!e.target && e.target.id === 'scene';   // 3D 화면만(미니맵 캔버스 위 휠·오른쪽 누르기는 제외)
  function onClick(e) { if (!board || panel || dead) return; const d = e.detail || {}; pal.style.display = 'none'; const A = aimAt(d.x, d.y); if (mode === 'break') doBreak(A); else doPut(A); }
  // 오른쪽 = 메뉴만 막고, 부수기는 '톡'일 때만(main.js DRAG와 같은 6px·0.45초) — 크롬은 누르는 순간·윈도는 뗄 때 contextmenu가 와서 오른쪽으로 끌어 둘러보기만 해도 부서졌다
  function onCtx(e) { if (board && !dead && onCanvas(e)) e.preventDefault(); }
  function onDown(e) { if (e.button === 2 && board && !panel && !dead && onCanvas(e) && !touchy() && !document.pointerLockElement) RT = { t: performance.now(), m: 0 }; }   // 잠긴 채 오른쪽 = sm-rclick(가운데)
  function onRClick(e) { if (!board || panel || dead) return; const d = e.detail || {}; pal.style.display = 'none'; doBreak(aimAt(d.x, d.y)); }
  function onUp(e) { if (e.button !== 2 || !RT) return; const r = RT; RT = null;
    if (!board || panel || dead || !onCanvas(e) || r.m >= 6 || performance.now() - r.t >= 450) return;
    pal.style.display = 'none'; doBreak(aimAt(e.clientX, e.clientY)); }
  function onMove(e) { if (RT) RT.m += Math.abs(e.movementX || 0) + Math.abs(e.movementY || 0);   // 화면 밖으로 끌어도 센다
    if (!onCanvas(e)) { if (ghost.visible) ghostOff(); mx = -1; return; } mx = e.clientX; my = e.clientY; }
  function onBlur() { RT = null; }
  const onResize = () => layout();
  // 휠 = 블록 한 칸씩: 쉬었다가 처음 = 늘 한 칸(마우스 휠은 한 칸도 안 놓침) · 이어지는 작은 이벤트(크롬북 터치패드 쓸기 = 20~40개)는 모아서 200px·0.15초마다 한 칸
  function onWheel(e) {
    if (!board || panel || !onCanvas(e) || e.ctrlKey) return;   // ctrl = 터치패드 집기(확대)
    const now = performance.now(), d = e.deltaY * (e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? 400 : 1);
    if (!d || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;   // 옆으로 쓸기는 무시
    const fresh = now - wLast > 220; wLast = now;
    if (fresh) { wAcc = 0; wStep = now; return setCur(cur + (d > 0 ? 1 : -1)); }
    if ((d > 0) !== (wAcc > 0)) wAcc = 0;   // 방향이 바뀌면 새로
    wAcc += d;
    if (Math.abs(wAcc) >= 200 && now - wStep >= 150) { setCur(cur + (wAcc > 0 ? 1 : -1)); wAcc = 0; wStep = now; }
  }
  // Esc = 판 고르기·관리 창 닫기(창 밖에 포커스가 있어도 — 창문 붙잡기 단계라 main.js의 멈춤 창(버블·defaultPrevented 확인)보다 먼저) · 처음 판 고르기는 닫지 않음
  //   처음 판 고르기(아직 판 없음)는 닫지 않고 Esc만 삼킨다(10-04 재시험: 창 뒤에 '⏸ 잠깐 멈춤'이 몰래 열려, 판을 고르면 화면 가운데 '🏠 메뉴로'를 눌러 첫 화면으로 나갔다) · 비밀번호 창(.lb-ask)이 떠 있으면 그 창 몫
  function onEsc(e) { if (e.code !== 'Escape' || e.repeat || !panel || dead || document.querySelector('.lb-ask')) return; e.preventDefault(); e.stopPropagation();
    if (board || panel.id === 'bk-admin') closePanel(); else toast('🧱 판을 먼저 골라요 — 그만하려면 「그만하기」', 2.2); }
  function onKey(e) {
    if (!board || panel || e.repeat) return; const tg = e.target; if (tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA')) return;
    if (e.code === 'KeyQ') setMode(mode === 'put' ? 'break' : 'put');
    else if (e.code === 'KeyZ') undo();
    else { const m = /^(?:Digit|Numpad)(\d)$/.exec(e.code); if (m) { const n = +m[1]; setCur(n === 0 ? 9 : n - 1); } }
  }
  addEventListener('sm-click', onClick); addEventListener('sm-rclick', onRClick); addEventListener('contextmenu', onCtx); addEventListener('mousedown', onDown); addEventListener('mouseup', onUp); addEventListener('mousemove', onMove); addEventListener('wheel', onWheel, { passive: true });
  addEventListener('keydown', onKey); addEventListener('keydown', onEsc, true); addEventListener('blur', onBlur); addEventListener('resize', onResize);

  // ── 🗺️ 위에서 짓기(TOP-2) ─────────────────────────────────────────
  const STAGES = [   // 이야기 무대 구역(학교 공용 판에서 위에서 짓는 곳 — 나만의 판·선생님은 어디든) · [x0, z0, x1, z1]
    { n: '🎭 운동장 무대 1', r: [-36, 0, -14, 20] },
    { n: '🎭 운동장 무대 2', r: [2, 0, 24, 20] },
    { n: '🎭 가운데 마당', r: [16, -40.3, 44, -34.6] },
  ];
  let topOn = false, TT = 'put', TH = 3, topUI = null, stroke = null, stageMk = [];
  const anywhere = () => !!(board && board.local) || teacher;
  const stageOf = (x, z) => STAGES.find((st) => x > st.r[0] && x < st.r[2] && z > st.r[1] && z < st.r[3]);
  const stageOK = (ix, iz) => { const x = (ix + 0.5) * S, z = (iz + 0.5) * S; return anywhere() ? map.q.inSchool(x, z) : !!stageOf(x, z); };
  const PV_MAX = 640, pv = new THREE.InstancedMesh(new THREE.BoxGeometry(S * 0.96, S * 0.96, S * 0.96).translate(0, S / 2, 0), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.55, depthWrite: false }), PV_MAX);
  pv.count = 0; pv.frustumCulled = false; pv.renderOrder = 4; root.add(pv);
  const _pm = new THREE.Matrix4(), _pc = new THREE.Color();
  // 화면 점 → 그 아래 칸(땅 또는 블록 기둥 꼭대기) — 땅 위 6m에서부터 10cm씩 훑는다
  function topCell(sx, sy) {
    V2.set(sx / innerWidth * 2 - 1, -(sy / innerHeight) * 2 + 1); RC.setFromCamera(V2, cam); const o = RC.ray.origin, d = RC.ray.direction;
    if (d.y > -0.05) return null;
    let t = Math.max(0, (o.y - 6) / -d.y); const tEnd = (o.y + 3) / -d.y;
    for (; t < tEnd; t += 0.1) { const x = o.x + d.x * t, y = o.y + d.y * t, z = o.z + d.z * t, ix = Math.floor(x / S), iz = Math.floor(z / S);
      const cq = COLQ.get(ckey(ix, iz)); let top = -1e9; if (cq) for (const q of cq) top = Math.max(top, q / 20 + S);
      if (y <= Math.max(map.q.baseAt(x, z), top)) return { ix, iz }; }
    return null;
  }
  // 누른 칸 → 뗀 칸: 거의 가로·세로(2.5배)면 똑바로 · 아니면 비스듬한 줄 · 160칸까지
  function lineCells(a, b) {
    let bx = b.ix, bz = b.iz; const ax = Math.abs(bx - a.ix), az = Math.abs(bz - a.iz);
    if (ax > az * 2.5) bz = a.iz; else if (az > ax * 2.5) bx = a.ix;
    const out = []; let x = a.ix, z = a.iz; const dx = Math.abs(bx - x), dz = Math.abs(bz - z), sx = x < bx ? 1 : -1, sz = z < bz ? 1 : -1; let err = dx - dz;
    for (let n = 0; n < 160; n++) { out.push([x, z]); if (x === bx && z === bz) break; const e2 = 2 * err; if (e2 > -dz) { err -= dz; x += sx; } if (e2 < dx) { err += dx; z += sz; } }
    return out;
  }
  const baseQ = (ix, iz) => Math.round(map.q.baseAt((ix + 0.5) * S, (iz + 0.5) * S) * 20);
  function pvShow(cells) {   // 미리 보기: 놓을 칸 = 고른 색(못 놓는 칸 = 빨강) · 지울 칸 = 빨강
    let n = 0; const ok = TYPES[cur].c;
    for (const [ix, iz] of cells) {
      if (TT === 'del') { const cq = COLQ.get(ckey(ix, iz)); if (cq) for (const q of cq) { if (n >= PV_MAX) break; pv.setMatrixAt(n, _pm.makeTranslation((ix + 0.5) * S, q / 20 + 0.01, (iz + 0.5) * S)); pv.setColorAt(n, _pc.set('#ff4040')); n++; } continue; }
      const zOK = stageOK(ix, iz), q0 = baseQ(ix, iz);
      for (let k = 0; k < TH && n < PV_MAX; k++) { const q = q0 + k * 10, why = zOK ? canPut(ix, iz, q) : 'zone'; if (why === 'have') continue;
        pv.setMatrixAt(n, _pm.makeTranslation((ix + 0.5) * S, q / 20 + 0.01, (iz + 0.5) * S)); pv.setColorAt(n, _pc.set(why ? '#ff4040' : ok)); n++; } }
    pv.count = n; pv.instanceMatrix.needsUpdate = true; if (pv.instanceColor) pv.instanceColor.needsUpdate = true;
  }
  const RS = { zone: '무대 구역 밖', wall: '벽·가구', door: '문 자리', me: '내 몸 자리', out: '학교 밖', full: '판이 가득', high: '너무 높음', ground: '땅속', lock: '잠긴 판' };
  const reasons = (w) => Object.entries(w).map(([k, n]) => (RS[k] || k) + ' ' + n + '칸').join(' · ');
  function commitBuild(cells) {
    if (board && board.lock && !teacher) return toast(WHY.lock, 2.4);
    const done = [], why = {};
    for (const [ix, iz] of cells) { if (!stageOK(ix, iz)) { why.zone = (why.zone || 0) + 1; continue; }
      const q0 = baseQ(ix, iz);
      for (let k = 0; k < TH; k++) { const q = q0 + k * 10, w = canPut(ix, iz, q); if (w) { if (w !== 'have') why[w] = (why[w] || 0) + 1; if (w === 'full') break; continue; }
        const kk = key(ix, iz, q), v = { t: cur, b: name || '익명' }; apply(kk, v); send(kk, v); done.push({ k: kk, put: true, by: v.b, t: v.t }); } }
    if (done.length) { pushUndo({ batch: done }); flushBuild(12); map.tone(330 + cur * 18, 0, 0.08, 'triangle', 0.14, 240); }
    const r = Object.keys(why).length ? ' — 못 놓은 곳: ' + reasons(why) : '';
    toast(done.length ? '🧱 ' + done.length + '개 놓았어요' + r : why.zone && !anywhere() ? '노란 네모(🎭 무대 구역) 안에 그어요' : '놓을 수 있는 칸이 없어요' + r, 2.4);
  }
  function commitErase(cells) {
    if (board && board.lock && !teacher) return toast(WHY.lock, 2.4);
    const done = []; let deny = 0;
    for (const [ix, iz] of cells) { const cq = COLQ.get(ckey(ix, iz)); if (!cq) continue;
      for (const q of [...cq]) { const kk = key(ix, iz, q), b = B.get(kk); if (!b) continue; if (!canBreak(b)) { deny++; continue; }
        apply(kk, null); send(kk, null); done.push({ k: kk, del: { t: b.t, b: b.b } }); } }
    if (done.length) { pushUndo({ batch: done }); flushBuild(12); map.tone(200, 0, 0.1, 'square', 0.1, 90); }
    toast(done.length ? '🔨 ' + done.length + '개 지웠어요' + (deny ? ' · 친구 블록 ' + deny + '개는 그대로' : '') : deny ? '친구가 놓은 블록이에요 — 선생님이 「모두 고치기」를 켜면 지울 수 있어요' : '지울 블록이 없어요', 2.2);
  }
  const tool = {
    down(sx, sy) { const c = topCell(sx, sy); if (!c) return; stroke = { a: c, b: c }; pvShow(lineCells(c, c)); },
    move(sx, sy) { if (!stroke) return; const c = topCell(sx, sy); if (c && (c.ix !== stroke.b.ix || c.iz !== stroke.b.iz)) { stroke.b = c; pvShow(lineCells(stroke.a, stroke.b)); } },
    up() { if (!stroke) return; const cells = lineCells(stroke.a, stroke.b); stroke = null; pv.count = 0; if (TT === 'del') commitErase(cells); else commitBuild(cells); },
    cancel() { stroke = null; pv.count = 0; },
    hover(sx, sy) { if (stroke) return; const c = topCell(sx, sy); if (c) pvShow([[c.ix, c.iz]]); else pv.count = 0; },
  };
  function topPaint() {
    if (!topUI) return;
    topUI.querySelectorAll('[data-t]').forEach((b) => b.classList.toggle('on', b.dataset.t === TT));
    topUI.querySelectorAll('[data-h]').forEach((b) => b.classList.toggle('on', +b.dataset.h === TH));
    const cb = topUI.querySelector('#bkTopCol'); cb.style.cssText = sw(cur) + ';background-size:800% 200%'; cb.title = TYPES[cur].n + ' — 눌러서 색 바꾸기';
  }
  function topEnter() {
    if (!map.top || topOn || !board || dead) return; closePanel(); pal.style.display = 'none'; ghostOff();
    const me = map.player.get(), st = stageOf(me.x, me.z) || STAGES.slice().sort((a, b) => Math.hypot((a.r[0] + a.r[2]) / 2 - me.x, (a.r[1] + a.r[3]) / 2 - me.z) - Math.hypot((b.r[0] + b.r[2]) / 2 - me.x, (b.r[1] + b.r[3]) / 2 - me.z))[0];
    topOn = true; document.body.classList.add('bk-top');
    map.top.enter({ floor: 1, at: anywhere() && !stageOf(me.x, me.z) ? [me.x, me.z] : [(st.r[0] + st.r[2]) / 2, (st.r[1] + st.r[3]) / 2], d: 34, floorKeys: false, tool: TT === 'pan' ? null : tool,
      help: '🧱 끌어서 벽 긋기 · 오른쪽 끌기·두 손가락 = 화면 옮기기 · 휠 = 확대' + (anywhere() ? '' : ' · 노란 네모 = 🎭 무대 구역'), onExit: () => topExit(), onLeave: () => topExit(true) });
    map.top.marks(STAGES.map((q) => ({ x: (q.r[0] + q.r[2]) / 2, y: map.q.baseAt((q.r[0] + q.r[2]) / 2, (q.r[1] + q.r[3]) / 2) + 0.3, z: q.r[1] + 1.2, t: q.n })));
    stageMk = STAGES.map((q) => { const y = map.q.baseAt((q.r[0] + q.r[2]) / 2, (q.r[1] + q.r[3]) / 2); return map.mk.trail([[q.r[0], y, q.r[1]], [q.r[2], y, q.r[1]], [q.r[2], y, q.r[3]], [q.r[0], y, q.r[3]], [q.r[0], y, q.r[1]]], { color: 0xffd23f, width: 0.3 }); });
    topUI = el('div', 'bk-topui'); keyStop(topUI);
    topUI.innerHTML = '<div class="g"><button data-t="put">🧱<span> 벽 긋기</span></button><button data-t="del">🔨<span> 지우기</span></button><button data-t="pan">✋<span> 옮기기</span></button></div>'
      + '<div class="g h"><b>높이</b>' + [1, 2, 3, 4].map((h) => '<button data-h="' + h + '">' + h + '</button>').join('') + '</div>'
      + '<div class="g h"><button id="bkTopCol"></button><button id="bkTopUndo" style="min-width:60px">↩<span> 되돌리기</span></button></div>'
      + '<button class="go" id="bkTopDown">📍<span> 여기로 내려가기</span></button>';
    topUI.onclick = (e) => { const b = e.target.closest('button'); if (!b) return; e.stopPropagation();
      if (b.dataset.t) { TT = b.dataset.t; map.top.setTool(TT === 'pan' ? null : tool); pv.count = 0; }
      else if (b.dataset.h) TH = +b.dataset.h;
      else if (b.id === 'bkTopCol') pal.style.display = pal.style.display === 'grid' ? 'none' : 'grid';
      else if (b.id === 'bkTopUndo') undo();
      else if (b.id === 'bkTopDown') topDown();
      topPaint(); };
    topPaint(); chips();
  }
  function topExit(left) {   // left = 엔진이 이미 나옴(놀이 멈춤 등)
    if (!topOn) return; topOn = false; stroke = null; pv.count = 0;
    if (!left && map.top && map.top.on) map.top.exit();
    if (topUI) { topUI.remove(); topUI = null; } stageMk.forEach((m) => m.remove()); stageMk = [];
    document.body.classList.remove('bk-top'); pal.style.display = 'none'; if (!dead) { chips(); layout(); }
  }
  function topDown() {   // 화면 가운데 땅(가까운 빈자리)으로 내려가 3인칭
    const c = topCell(innerWidth / 2, innerHeight / 2); if (!c) return toast('여기는 내려갈 수 없어요', 1.6);
    const x = (c.ix + 0.5) * S, z = (c.iz + 0.5) * S, e = map.findEntry(x, z, map.q.baseAt(x, z));
    if (!e) return toast('빈자리가 없어요 — 다른 곳으로 옮겨 봐요', 2);
    topExit(); map.player.teleport([e.x, e.y, e.z]);
  }
  setCur.top = topPaint;

  // ── 시작: 지난번 판 → 없으면 고르기 · 혼자 하기 = 바로 나만의 판
  if (SOLO) enter({ id: '@mine', local: true, t: '🏠 나만의 판' }); else pick();

  let cullT = 0;
  return {
    tick(dt) {
      if (dead) return;
      if (DIRTY.size) flushBuild(4);
      pTick(dt);
      if ((hoverT += dt) >= 0.05) { hoverT = 0; const L = !!document.pointerLockElement, cOn = L && !!board && !panel;   // 잠김 = 가운데 ＋ · 마우스 보임 = 커서 자리
        if (crossEl.style.display !== (cOn ? 'block' : 'none')) crossEl.style.display = cOn ? 'block' : 'none';
        if ((L || mx >= 0) && board && !panel && !touchy() && !topOn) ghostShow(L ? aimAt(innerWidth / 2, innerHeight / 2) : aimAt(mx, my)); else if (ghost.visible && (touchy() || panel)) ghostOff(); }
      if (chkMe) { chkMe = false; if (board) freeMe(); }
      if ((cullT += dt) >= 0.25) { cullT = 0; const t = touchy(); if (t !== lastTouch) { lastTouch = t; layout(t); chips(); }   // 터치 크롬북이 처음 터치(또는 마우스로 돌아옴)하면 단추·안내도 따라 바뀜
        if (hudDirty) { hudDirty = false; hudLine(); } const cp = cam.position, FR2 = topOn ? 600 * 600 : FAR * FAR; /* 위에서 짓기 = 멀리서 내려다봄 */ for (const ms of MESH.values()) for (const m of ms) { const c = m.userData.c, dx = cp.x - c[0], dz = cp.z - c[1]; m.visible = dx * dx + dz * dz < FR2; } }
    },
    stop() {
      settle(); dead = true; window.SM_ACT = null; clearTimeout(tipT); topExit(); pv.geometry.dispose(); pv.material.dispose(); pv.dispose();   // 기다리던 저장 먼저(나만의 판은 부순 가구 목록이 아직 맞을 때)
      if (es) es.close(); clearTimeout(cfgT);
      removeEventListener('sm-click', onClick); removeEventListener('sm-rclick', onRClick); removeEventListener('contextmenu', onCtx); crossEl.remove(); removeEventListener('mousedown', onDown); removeEventListener('mouseup', onUp); removeEventListener('mousemove', onMove); removeEventListener('wheel', onWheel);
      removeEventListener('keydown', onKey); removeEventListener('keydown', onEsc, true); removeEventListener('blur', onBlur); removeEventListener('resize', onResize); removeEventListener('sm-teacher', onTeacher); removeEventListener('pagehide', onLeave); document.removeEventListener('visibilitychange', onVis);
      // 놀이가 멈추면 부순 가구가 돌아온다(FX.reset) — 그 자리에 서 있던 아이가 갇히지 않게 지금 되살리고 비켜 준다(블록이 아직 있어 그 자리도 피함)
      try { const F = map.world.furn, hid = F.hidden(); if (hid.length) { for (const id of hid) F.show(id); const me = map.player.pos(); if (map.q.blocked(me.x, me.z, me.y)) unstuck('🏫 가구가 돌아와서 옆으로 비켜났어요'); } } catch (e) { /* */ }
      for (const ms of MESH.values()) for (const m of ms) m.geometry.dispose(); MESH.clear();
      pMesh.geometry.dispose(); pMesh.material.dispose(); pMesh.dispose(); ghost.geometry.dispose(); ghost.material.dispose();
      for (const k in MAT) MAT[k].dispose(); tex.dispose(); ui.remove(); css.remove(); closePanel();
    },
    // 시험·디버그(읽기 위주)
    board: () => board && { ...board }, count: () => B.size, blocks: () => [...B.keys()], at: (k) => { const b = B.get(k); return b ? { t: b.t, b: b.b } : null; }, aim: aimAt, put: (ix, iz, q, t = cur) => { const why = canPut(ix, iz, q); if (why) return why; const k = key(ix, iz, q), v = { t, b: name || '익명' }; apply(k, v); send(k, v); pushUndo({ k, put: true, by: v.b, t: v.t }); flushBuild(99); return 'ok'; },
    brk: (A) => doBreak(A), place: (A) => doPut(A), undo, undoLen: () => UNDO.length, unstuck: (m) => unstuck(m), admin: () => admin(true), panel: () => panel && panel.id, mode: (m) => { if (m) setMode(m); return mode; }, cur: (i) => { if (i != null) setCur(i); return cur; },
    enter: (id) => enter(id === '@mine' ? { id: '@mine', local: true, t: '🏠 나만의 판' } : { id, t: id }), pick, stats: () => ({ blocks: B.size, chunks: MESH.size, meshes: [...MESH.values()].reduce((s, a) => s + a.length, 0), tris: [...MESH.values()].reduce((s, a) => s + a.reduce((x, m) => x + m.geometry.index.count / 3, 0), 0), cols: [...COLP.values()].reduce((s, a) => s + a.length, 0), furn: map.world.furn.hidden().length }),
  };
}
