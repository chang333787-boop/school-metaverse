// 우리 학교 견학(TOUR-1 · 09-27 사용자 "학교홍보로 써도될거같아 메타버스 견학 느낌으로 npc누르면 npc가 우리학교 설명해주고 도장도 찍어주고") — 정본 문서 = docs/map_api.md §11
// PROMO-1(09-29 교사 "견학 모드를 홍보용으로"): 루트 주소(홍보판)는 ▶ 시작하기 → 바로 이 견학. 지점 = 버스·놀이터·숲놀이터·운동장·큰 나무·텃밭·체육관·컴퓨터실·각 반·급식실·돌봄·유치원·보건실·도서관·교장실
//   ① 이야기 창의 [🎬 관련 영상 보기] = 유튜브를 화면 안 창(iframe)으로 재생(링크로 나가지 않음) · 📷 사진 = 사진 넘겨 보기 — 둘 다 tour_data.js의 videos·photos
//   ② 📖 정림초 도감(칩·C키) = 도장 모음 — 받은 곳은 눌러 다시 읽기(영상 포함) · 안 간 곳은 눌러 길 안내
//   ③ 교감선생님(hub: true) = 도장 대신 [📖 학교 정보 모두 보기] — 돌지 않아도 모든 곳의 이야기·영상을 도감에서 바로 읽기
// 흐름: 스쿨버스 앞 교감선생님 곁에서 시작 → 환영 창(tour_data.js welcome + 조작 안내) → 선생님(guide)·안내판(board)을 찾아가
//   E / ✋ / 클릭(사람·안내판을 직접 눌러도 됨)으로 이야기 듣기(여러 쪽 · [다음]) → 마지막 쪽 [도장 받기] → 도감 칸이 찬다 → 모두 모으면 '견학 완주! 🎉'
// 규칙(_template.js 예외 두 가지 — 사용자 09-27 결정):
//   ① 사람 NPC가 말한다: 견학 안내 선생님만(world.js가 놓은 자리 = map.tour) · **말하는 글은 전부 교사가 쓴 tour_data.js**(여기엔 UI 문구만 — 학교에 대한 사실·자랑을 지어 넣지 않는다)
//   ② 데이터 파일 하나는 동적 import(tour_data.js?t=지금 — 상태 없는 글 묶음이라 두 벌이어도 무해 · 교사가 고친 뒤 버스터 없이 새로고침만)
// 저장: 도장 = localStorage 'sm2.game.tour.stamps'(홍보판은 'sm2.promo.tour.stamps' — 같은 주소 아래라 칸을 나눈다 · 도장이 바뀔 때만 곧바로 · try/catch) · 다른 저장 없음
// 성능: 매 프레임 일 없음(길 리본 시간만) · 표식 = 다이아몬드 풀(+2콜) · 길 리본(H) +1 · DOM·영상 창은 열 때만(닫으면 iframe을 지워 재생·메모리 정지) · 새 조명 없음
export const meta = { id: 'tour', title: '우리 학교 견학', api: 1 };

const TYPE_MS = 32;   // 타자 글자 간격(ms) — 한 쪽 60자 ≈ 2초
const GUIDE_R = 2.3, BOARD_R = 1.8, HIDE_R = 1.9, TRAIL_T = 6, PICK_M = 22;
const CSS = `
#tour-ui{position:fixed;inset:0;pointer-events:none;z-index:40;font-family:inherit}
#tour-ui .tp{pointer-events:auto;position:absolute;background:rgba(255,251,240,.97);color:#3a2e22;border-radius:16px;box-shadow:0 6px 24px rgba(0,0,0,.28);border:3px solid #e8c77a}
#tour-talk{left:50%;bottom:14px;transform:translateX(-50%);width:min(600px,94vw);padding:14px 16px 12px;display:flex;gap:12px;align-items:flex-start}
#tour-talk .av{flex:0 0 58px;height:58px;border-radius:50%;background:#fff;border:3px solid #e8c77a;display:flex;align-items:center;justify-content:center;font-size:30px}
#tour-talk .bd{flex:1;min-width:0}
#tour-talk .nm{font-weight:800;font-size:16px;color:#8a5a1e;margin-bottom:4px}
#tour-talk .nm small{font-weight:700;font-size:13px;color:#a08462;margin-left:6px}
#tour-talk .tx{font-size:17px;line-height:1.5;min-height:52px;max-height:38vh;overflow:auto}
#tour-talk .tx .ln{min-height:1.5em;text-wrap:pretty;word-break:keep-all;overflow-wrap:anywhere}
#tour-talk .tx .ln.bl{padding-left:.75em;text-indent:-.75em}
#tour-talk .tx.done > .ln:last-child::after{content:'▼';display:inline-block;margin-left:6px;font-size:13px;color:#d9463a;animation:tourBlink .7s steps(2,start) infinite}
@keyframes tourBlink{to{visibility:hidden}}
#tour-talk .tx .rest{visibility:hidden}
#tour-talk .pg{font-size:12px;color:#8a7a66;margin-top:4px;min-height:1em}
#tour-ui #tour-talk button.x{position:absolute;right:6px;top:6px;min-width:36px;min-height:36px;padding:0;background:transparent;color:#a08462;font-size:18px}
#tour-talk .tmenu{position:absolute;right:10px;bottom:calc(100% + 8px);margin:0;padding:6px;list-style:none;background:rgba(255,251,240,.98);border:3px solid #e8c77a;border-radius:14px;box-shadow:0 6px 20px rgba(0,0,0,.25);min-width:210px;transform-origin:bottom right;animation:tmPop .22s cubic-bezier(.2,1.5,.4,1) both}
#tour-talk .tmenu[data-title]::before{content:attr(data-title);display:block;grid-column:1/-1;font-size:13px;font-weight:800;color:#8a5a1e;padding:2px 8px 4px}
#tour-talk .tmenu li{position:relative;padding:8px 16px 8px 32px;border-radius:9px;font-size:17px;font-weight:800;color:#3a2e22;cursor:pointer;white-space:nowrap}
#tour-talk .tmenu li.on{background:#fff1c6}
#tour-talk .tmenu li.on::before{content:'▶';position:absolute;left:11px;color:#d9463a;animation:tmNudge .45s ease-in-out infinite alternate}
@keyframes tmPop{from{transform:scale(.6);opacity:0}}
@keyframes tmNudge{to{transform:translateX(4px)}}
#tour-ui button{pointer-events:auto;min-height:44px;min-width:44px;padding:6px 16px;border:0;border-radius:10px;background:#2f6fd0;color:#fff;font-size:16px;font-weight:700;cursor:pointer;font-family:inherit}
#tour-ui button.sub{background:#e9e1cf;color:#5a4632}
#tour-ui button:focus-visible{outline:3px solid #ffb400}
#tour-card{left:50%;top:50%;transform:translate(-50%,-50%);width:min(680px,94vw);max-height:88vh;overflow:auto;padding:14px 16px}
#tour-card .hd{display:flex;align-items:center;gap:8px}
#tour-card h3{margin:0 0 2px;font-size:19px;flex:1}
#tour-ui #tour-card button.x{padding:4px 12px;font-size:18px}
#tour-card .ct{font-size:14px;color:#6a5a46;margin-bottom:10px}
#tour-card .gr{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:10px 6px}
#tour-ui #tour-card button.sl{display:block;background:none;color:#5a4a36;text-align:center;font-size:12px;font-weight:700;line-height:1.25;padding:4px 2px;border-radius:12px;position:relative}
#tour-ui #tour-card button.sl:hover{background:#f6ecd4}
#tour-card .ci{width:62px;height:62px;margin:0 auto 4px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:28px;border:3px dashed #cdbf9f;background:#fffdf7;filter:grayscale(1);opacity:.45}
#tour-card .on .ci,#tour-card .all .ci{filter:none;opacity:1}
#tour-card .on .ci{border:3px solid #d9463a;background:#fff0ec;transform:rotate(-12deg);box-shadow:inset 0 0 0 3px #fff,inset 0 0 0 5px #d9463a}
#tour-card .all:not(.on) .ci{border-style:solid;border-color:#e8c77a}
#tour-card .mi{position:absolute;right:8px;top:2px;font-size:14px}
#tour-card .rw{display:flex;gap:8px;justify-content:flex-end;margin-top:12px;flex-wrap:wrap}
#tour-media{inset:0;margin:auto;height:fit-content;max-height:96vh;max-height:96dvh;box-sizing:border-box;overflow:auto;width:min(900px,96vw,calc((92vh - 120px) * 16 / 9));width:min(900px,96vw,calc((92dvh - 120px) * 16 / 9));padding:10px 12px 12px;z-index:2}   /* 09-30 교사 '폰에서 영상 볼 때 검은 부분': 아이폰 사파리는 transform 안의 iframe(유튜브)을 어긋나게 그린다 → transform 없이 가운데(inset 0 + margin auto) · 높이는 보이는 화면(dvh) */
#tour-media .hd{display:flex;align-items:center;gap:8px;margin-bottom:8px}
#tour-media h3{margin:0;font-size:17px;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#tour-ui #tour-media button.x{padding:4px 12px;font-size:18px}
#tour-media .tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}
#tour-ui #tour-media .tabs button{min-height:36px;padding:4px 12px;font-size:14px;background:#e9e1cf;color:#5a4632}
#tour-ui #tour-media .tabs button.on{background:#8a5a1e;color:#fff}
#tour-media .vw{position:relative;width:100%;aspect-ratio:16/9;background:#111;border-radius:10px;overflow:hidden}
#tour-media .vw iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
#tour-media .ph{position:relative;display:flex;align-items:center;justify-content:center;background:#111;border-radius:10px;min-height:200px;overflow:hidden}
#tour-media .ph img{display:block;max-width:100%;max-height:calc(92vh - 170px);max-height:calc(92dvh - 170px);object-fit:contain}
#tour-ui #tour-media .ph button{position:absolute;top:50%;transform:translateY(-50%);background:rgba(0,0,0,.45);font-size:22px;padding:4px 14px}
#tour-media .ph .pv{left:6px}#tour-media .ph .nx{right:6px}
#tour-media .em{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;color:#f4ecd8;text-align:center;font-size:19px;font-weight:800;padding:12px}
#tour-media .em small{font-size:14px;font-weight:600;color:#c9bfa8}
#tour-media .ph .em{position:static;min-height:220px}
#tour-card .sh{margin:14px 0 8px;font-weight:800;font-size:15px;color:#8a5a1e}
#tour-media.det{width:min(660px,94vw)}
#tour-media .dt{max-height:calc(88vh - 80px);overflow:auto;font-size:16px;line-height:1.65;padding:0 4px 4px;overscroll-behavior:contain}
#tour-media .dt h4{margin:14px 0 4px;font-size:17px;color:#8a5a1e}
#tour-media .dt h4:first-child{margin-top:2px}
#tour-media .dt p{margin:6px 0}
#tour-media .dt ul{margin:4px 0 8px;padding-left:22px}
#tour-media .dt li{margin:3px 0}
#tour-media .cp{font-size:14px;color:#5a4a36;margin-top:6px;text-align:center;min-height:1em}
.tour-stamp{position:absolute;left:12px;top:-78px;width:86px;height:86px;border-radius:50%;border:4px solid #d9463a;background:#fff0ec;display:flex;align-items:center;justify-content:center;font-size:40px;box-shadow:inset 0 0 0 4px #fff,inset 0 0 0 7px #d9463a;animation:tourStamp .5s cubic-bezier(.2,1.6,.4,1) both}
@keyframes tourStamp{0%{transform:scale(2.6) rotate(20deg);opacity:0}100%{transform:scale(1) rotate(-12deg);opacity:1}}
.tour-cf{position:absolute;top:-20px;width:10px;height:14px;border-radius:2px;animation:tourFall 3.2s linear forwards}
@keyframes tourFall{to{transform:translateY(110vh) rotate(720deg)}}
body.touch #tour-talk{bottom:8px}
@media (max-height:520px){#tour-card{padding:8px 12px}#tour-card .ct{margin-bottom:6px}#tour-card .gr{grid-template-columns:repeat(auto-fill,minmax(74px,1fr));gap:6px 4px}#tour-card .ci{width:44px;height:44px;font-size:21px;margin-bottom:2px}#tour-ui #tour-card button.sl{font-size:11px}#tour-card .rw{margin-top:8px}
  #tour-media{padding:6px 8px 8px}#tour-media .hd{margin-bottom:4px}#tour-media .tabs{margin-bottom:4px}}
`;

// 유튜브 주소 → 영상 id(11자). youtu.be · watch?v= · shorts · embed · live · id 그대로 모두
const ytId = u => { u = String(u || '').trim(); if (!u) return null; if (/^[\w-]{11}$/.test(u)) return u;
  const m = u.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/)([\w-]{11})/); return m ? m[1] : null; };

export default async function start(map, params = {}) {
  let dead = false;
  const PROMO = !!window.SM_PROMO;
  map.player.freeze(true);
  map.hud.banner('견학 준비 중…', 30);
  map.sfx('warm');
  // ---------- 글(교사 작성) ----------
  let DATA = {};
  const DATA_URL = new URL('./tour_data.js', import.meta.url);   // 사진 상대 주소('tour_media/…')의 기준
  try { DATA = (await import(new URL('./tour_data.js?t=' + Date.now(), import.meta.url))).TOUR || {}; }
  catch (e) { console.error('[견학] tour_data.js를 읽지 못했어요', e); map.hud.toast('견학 글 파일(tour_data.js)을 읽지 못했어요 — 따옴표·쉼표를 확인해 주세요', 6); }
  if (dead || map.gone) return {};
  const nav = await map.nav();
  if (dead || map.gone) return {};
  map.hud.banner('', 0.01);

  // ---------- 견학 지점: world.js 자리(map.tour) × tour_data.js 글 ----------
  const DIR = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  const SP = DATA.spots || {}, SPOTS = [];
  // 영상 칸 = 적어 둔 칸 전부(주소가 빈 칸도 — showEmpty면 '준비 중' 화면) · id = 유튜브 영상 id(없으면 null)
  const SHOW_EMPTY = DATA.showEmpty !== false;
  const vids = d => [].concat(d.videos || [], d.video ? [d.video] : []).map(v => typeof v === 'string' ? { url: v } : v || {})
    .map(v => ({ title: String(v.title || ''), group: String(v.group || ''), id: ytId(v.url) })).filter(v => v.id || SHOW_EMPTY);
  const phos = d => [].concat(d.photos || []).map(p => typeof p === 'string' ? { src: p } : p || {}).filter(p => p.src)
    .map(p => { let src = ''; try { src = new URL(String(p.src).trim(), DATA_URL).href; } catch (e) { /* 이상한 주소 — 뺀다 */ } return { src, caption: String(p.caption || '') }; }).filter(p => p.src);
  for (const a of map.tour) {
    const d = SP[a.key] || SP[a.key.replace(/-\d+$/, '')] || {}; if (d.on === false) continue;   // 같은 이름 선생님이 여럿(admin-2 …) = 같은 글
    const [fx, fz] = DIR[a.face & 3], fd = a.kind === 'board' ? (a.wall ? 0.9 : 1.0) : 0.9;
    const hx = a.x + fx * fd, hz = a.z + fz * fd;
    const pages = Array.isArray(d.pages) && d.pages.length ? d.pages.map(String) : ['(tour_data.js에 이곳 설명을 써 주세요 — 키: ' + a.key + ')'];
    const mx = a.wall ? a.x + (fz ? 0.95 : 0) + fx * 0.35 : a.x, mz = a.wall ? a.z + (fx ? 0.95 : 0) + fz * 0.35 : a.z;   // 표식 자리(벽 게시판은 제목 팻말 옆·벽 앞 — 판을 가리지 않게)
    const name = d.name || (a.kind === 'board' ? a.place || a.label : a.label);
    SPOTS.push({ key: a.key, kind: a.kind, hub: !!d.hub, intro: d.stamp === false, x: a.x, y: a.y, z: a.z, top: a.top, hx, hz, mx, mz, my: a.kind === 'board' ? a.y + (a.wall ? 1.2 : 1.45) : a.y + 1.2,
      label: a.label, who: a.kind === 'guide' ? a.label : '', face: a.face, name, where: d.where || '', stamp: d.stamp || (d.stamp === false ? '🏫' : a.kind === 'board' ? '📋' : '⭐'), pages,
      videos: vids(d), photos: phos(d), detail: Array.isArray(d.detail) ? d.detail.map(String) : [], node: -1 });
  }
  // 표식 자리(리뷰 09-27): 선생님 위 ◆가 이름 팻말(머리 위 +0.28)을 가렸다 — 천장(실내 ≈3m) 때문에 더 올릴 수 없어 팻말 옆으로 비킨다(벽·가구가 없는 쪽).
  //   안내판은 지붕(+1.9) 위로(◆ 아래 끝 = 가운데 - 0.53 · 흔들림 포함).
  { const g = document.createElement('canvas').getContext('2d'); g.font = '900 84px sans-serif';
    for (const s of SPOTS) { if (s.kind !== 'guide') continue;
      const [fx, fz] = DIR[s.face & 3], half = 0.22 * (g.measureText(s.label).width + 56) / 128 / 2, a = half + 0.42, Y = s.my + 1.1;
      let best = null, bt = -1;
      for (const sd of [1, -1]) { const px = -fz * sd, pz = fx * sd, t = map.q.ray([s.x, Y, s.z], [s.x + px * (a + 0.35), Y, s.z + pz * (a + 0.35)]);
        const tt = t === null ? 2 : t; if (tt > bt) { bt = tt; best = [px, pz]; } }
      s.mx = s.x + best[0] * a; s.mz = s.z + best[1] * a; } }
  for (const k of Object.keys(SP)) if (!map.tour.some(a => a.key === k)) console.warn('[견학] tour_data.js의 "' + k + '"는 맵에 자리가 없어 빠졌어요(키 이름 확인)');
  const ORD = Array.isArray(DATA.order) ? DATA.order : [];
  SPOTS.sort((a, b) => { const i = ORD.indexOf(a.key), j = ORD.indexOf(b.key); return (i < 0 ? 999 : i) - (j < 0 ? 999 : j); });
  // ALL = 도장 받는 곳 · INTRO = 소개만(stamp: false — 각 반 담임선생님: 도장 없이 반 소개 · 교사 09-29) · 교감선생님(hub)은 둘 다 아님
  const ALL = SPOTS.filter(s => !s.hub && !s.intro), INTRO = SPOTS.filter(s => s.intro && !/-\d+$/.test(s.key)), N = ALL.length, BY = new Map(SPOTS.map(s => [s.key, s]));
  for (const s of SPOTS) {   // 말 거는 자리 = 앞 0.9~1m에서 가장 가까운 걷는 칸(책상·실험대 너머 선생님도 — 지점 가운데가 가구 속이면 그 자리에 설 수 없다) · 길 안내 도착 칸도 같은 칸
    s.node = nav.snap(s.hx, s.y, s.hz, 2.6);
    if (s.node >= 0) { const p = nav.pos(s.node); s.hx = p[0]; s.hz = p[2]; }
  }

  // ---------- 도장(저장) ----------
  const KEY = PROMO ? 'sm2.promo.tour.stamps' : 'sm2.game.tour.stamps';
  let saved = []; try { saved = JSON.parse(localStorage.getItem(KEY) || '[]') || []; } catch (e) { saved = []; }
  const stamps = new Set((Array.isArray(saved) ? saved : []).filter(k => BY.has(k) && !BY.get(k).hub && !BY.get(k).intro));
  // 바뀔 때만 곧바로 쓴다(도장은 이야기 창을 다 넘겨야 하나씩 — 2초에 한 번보다 드묾) · 막힌 환경(비공개 창)은 조용히 이번 판만
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify([...stamps])); } catch (e) { /* 저장 막힘 — 무시 */ } };

  // ---------- DOM ----------
  let css = document.getElementById('tour-css'); if (!css) { css = document.createElement('style'); css.id = 'tour-css'; css.textContent = CSS; document.head.appendChild(css); }
  const ui = document.createElement('div'); ui.id = 'tour-ui'; document.body.appendChild(ui);
  const mk = (tag, cls, txt, parent) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; (parent || ui).appendChild(e); return e; };
  const btn = (txt, cls, fn, parent) => { const b = mk('button', cls, txt, parent); b.type = 'button'; b.addEventListener('click', e => { e.stopPropagation(); fn(); }); return b; };
  const focus = b => setTimeout(() => { try { b && b.isConnected && b.focus({ preventScroll: true }); } catch (e) { /* 무시 */ } }, 0);

  // ---------- 사진 자동 찾기: tour_data.js에 photos를 안 적어도 tour_media/<키>-1.jpg, -2.jpg …(jpg·jpeg·png·webp)를 올리면 나온다 ----------
  //   그곳 이야기 창을 처음 열 때 한 번만(HEAD 요청 · 번호가 끊기면 멈춤 · 최대 12장). photos를 적어 둔 곳은 찾지 않는다
  const EXT = ['jpg', 'jpeg', 'png', 'webp'];
  const exists = u => fetch(u, { method: 'HEAD', cache: 'no-cache' }).then(r => r.ok, () => false);
  function probePhotos(s) {
    if (s.probe) return s.probe;
    if (s.photos.length) return (s.probe = Promise.resolve(s.photos.length));
    return (s.probe = (async () => {
      for (let i = 1; i <= 12; i++) {
        const urls = EXT.map(e => new URL('tour_media/' + s.key + '-' + i + '.' + e, DATA_URL).href), ok = await Promise.all(urls.map(exists)), k = ok.indexOf(true);
        if (k < 0) break; s.photos.push({ src: urls[k], caption: '' });
      }
      return s.photos.length; })());
  }
  const hasVid = s => s.videos.some(v => v.id);

  // ---------- 영상·사진 창(유튜브 = 화면 안 iframe · 링크로 나가지 않음) ----------
  let media = null;   // { el, s, tab }
  function closeMedia() { if (!media) return; media.el.remove(); media = null; if (talk && talk.menu) buildMenu(); }   // iframe째 지운다 = 재생 멈춤 · 목록의 ✔(본 것)를 새로
  // 📄 자세히 볼래요(교사 09-29 "자세히 설명해야 하는 곳"): tour_data.js detail — '## 소제목' · '• 항목' · 나머지 = 문단. 영상 창과 같은 자리·같은 닫기(Esc·✕)
  function openDetail(s) {
    if (media) media.el.remove();
    const el = mk('div', 'tp det'); el.id = 'tour-media'; el.setAttribute('role', 'dialog');
    const hd = mk('div', 'hd', null, el); mk('h3', '', '📄 ' + s.name, hd);
    const x = btn('✕', 'sub x', () => closeMedia(), hd); x.setAttribute('aria-label', '닫기');
    const dt = mk('div', 'dt', null, el); let ul = null;
    for (const line of s.detail) {
      const L = line.trim(); if (!L) { ul = null; continue; }
      if (L.startsWith('## ')) { ul = null; mk('h4', '', L.slice(3), dt); }
      else if (/^[•·\-] /.test(L)) { if (!ul) ul = mk('ul', '', null, dt); mk('li', '', L.slice(2), ul); }
      else { ul = null; mk('p', '', L, dt); }
    }
    media = { el, s, pi: 0 }; (s.seen || (s.seen = new Set())).add('d');
    focus(x); map.sfx('pick');
  }
  function openMedia(s, kind, i = 0) {   // 목록에서 고른 영상 하나 / 사진 하나(사진은 ‹ › 로 넘겨 보기)
    if (media) media.el.remove();
    const el = mk('div', 'tp'); el.id = 'tour-media'; el.setAttribute('role', 'dialog');
    const hd = mk('div', 'hd', null, el); const h = mk('h3', '', '', hd);
    const x = btn('✕', 'sub x', () => closeMedia(), hd); x.setAttribute('aria-label', '닫기');
    const body = mk('div', '', null, el), cap = mk('div', 'cp', '', el);
    const soon = (parent, ico, what) => { const e = mk('div', 'em', null, parent); mk('div', '', ico + ' ' + what + ' 준비 중이에요', e); mk('small', '', '곧 우리 학교 ' + what + '이 올라와요!', e); };
    media = { el, s, pi: i };
    (s.seen || (s.seen = new Set())).add(kind + i);
    if (kind === 'v') {
      const v = s.videos[i] || {}; h.textContent = s.name + (v.title && v.title !== s.name ? ' · ' + v.title : '');
      const vw = mk('div', 'vw', null, body);
      if (!v.id) soon(vw, '🎬', '영상');
      else { const f = document.createElement('iframe');
        f.src = 'https://www.youtube-nocookie.com/embed/' + v.id + '?autoplay=1&rel=0&playsinline=1&modestbranding=1';
        f.title = s.name + ' 영상'; f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        f.allowFullscreen = true; f.referrerPolicy = 'strict-origin-when-cross-origin'; vw.appendChild(f); }
    } else {
      h.textContent = s.name + ' · 사진';
      if (!s.photos.length) soon(mk('div', 'ph', null, body), '📷', '사진');
      else {
        const n = s.photos.length, ph = mk('div', 'ph', null, body), img = mk('img', '', null, ph);
        const show = () => { const p = s.photos[media.pi]; s.seen.add('p' + media.pi); img.src = p.src; img.alt = p.caption || s.name + ' 사진'; cap.textContent = (n > 1 ? (media.pi + 1) + ' / ' + n + (p.caption ? ' · ' : '') : '') + p.caption; };
        img.addEventListener('error', () => { cap.textContent = '사진을 불러오지 못했어요 — 사진 파일 이름·주소를 확인해 주세요'; });
        media.flip = d => { if (n > 1) { media.pi = (media.pi + n + d) % n; show(); } };
        if (n > 1) { btn('‹', 'pv', () => media.flip(-1), ph).setAttribute('aria-label', '앞 사진'); btn('›', 'nx', () => media.flip(1), ph).setAttribute('aria-label', '다음 사진'); }
        show();
      }
    }
    focus(x); map.sfx('pick');
  }

  // ---------- 타자 효과(게임처럼 한 글자씩 · 다다다 소리) — 누르면 먼저 끝까지, 다 나오면 ▼ ----------
  //   자리는 미리 잡아 둔다(아직 안 나온 글자 = 보이지 않는 span) — 창 높이가 글자마다 출렁이지 않게. setInterval(창이 열린 동안만 · 매 프레임 루프 밖)
  const muted = () => { try { return JSON.parse(localStorage.getItem('sm2.title.mute') || 'false'); } catch (e) { return false; } };
  function typeText(t, txt, done) {
    clearInterval(t.tm); const ch = [...txt]; t.tx.textContent = ''; t.tx.classList.remove('done');
    // 줄마다 한 칸(교사 09-29 '줄을 여기 맞춰 깔끔하게'): '· '·'• '로 시작하는 줄은 넘어가도 점 뒤 글자에 맞춘다(.bl 내어쓰기)
    const LN = txt.split('\n').map(s => { const d = mk('div', 'ln' + (/^[·•]\s/.test(s) ? ' bl' : ''), null, t.tx);
      return { c: [...s], a: mk('span', '', '', d), r: mk('span', 'rest', s, d) }; });
    const paint = n => { for (const l of LN) { const k = Math.max(0, Math.min(n, l.c.length)); l.a.textContent = l.c.slice(0, k).join(''); l.r.textContent = l.c.slice(k).join(''); n -= l.c.length + 1; } };
    const low = t.o.spot && t.o.spot.kind === 'guide', quiet = muted();
    let i = 0; const t0 = performance.now(), per = Math.min(TYPE_MS, 4000 / Math.max(1, ch.length)); t.typing = true;   // 긴 쪽도 4초 안에   // 글자 수 = 지난 시간으로(느린 PC에서 타이머가 프레임마다 한 번만 돌아도 같은 빠르기)
    t.fin = () => { if (!t.typing) return; clearInterval(t.tm); paint(ch.length); t.typing = false; t.tx.classList.add('done'); if (done && talk === t) done(); };
    t.tm = setInterval(() => {
      if (talk !== t) { clearInterval(t.tm); return; }
      const j = Math.min(ch.length, Math.floor((performance.now() - t0) / per) + 1); if (j === i) return;
      const beep = !quiet && Math.floor(j / 2) !== Math.floor(i / 2) && /\S/.test(ch[j - 1]); i = j;
      paint(i);
      if (beep) map.tone((low ? 420 : 560) + Math.random() * 90, 0, 0.035, 'square', 0.03);
      if (i >= ch.length) t.fin();
    }, TYPE_MS);
  }

  // ---------- 이야기 창(RPG 선택 목록 · 교사 09-29 '1번 — 가벼운 느낌') ----------
  //   대사는 타자로 · 쪽 넘김 = E/Enter/Space/✋/창 누르기 · 마지막 쪽이 다 나오면 창 오른쪽 위에 선택 목록(▶ 커서)
  //   ↑↓(W·S) 이동 · E/Enter/Space/✋ 고르기 · 마우스·터치는 바로 누르기 · Esc/✕ 닫기. 고를 것: 🎬 영상(여러 개면 목록) · 📷 사진(목록) · ⭐ 도장 · 📖 모두 보기(교감) · ◀ 도감 · 👋 인사
  let talk = null;   // { el, o, i, openedAt, typing, fin, tm, menu, items, cur, menuAt, … }
  let closedAt = -1e9;
  function closeTalk(toBook) {
    if (!talk) return; const t = talk; talk = null; clearInterval(t.tm); closeMedia(); t.el.remove(); closedAt = performance.now(); map.player.freeze(false); refresh();
    if (t.allDone) celebrate(); else if (toBook && t.o.back) t.o.back();   // 도감에서 연 글이면 도감으로 · 마지막 도장 창을 닫으면(어느 쪽이든) 완주 창
  }
  function openTalk(o) {   // o = { spot?, name, sub?, icon, pages, review?, back?, end? }
    if (talk) { clearInterval(talk.tm); closeMedia(); talk.el.remove(); }
    if (card) closeCard();
    document.exitPointerLock?.(); map.player.freeze(true);
    const el = mk('div', 'tp'); el.id = 'tour-talk';
    const av = mk('div', 'av', o.icon, el), bd = mk('div', 'bd', null, el);
    const nm = mk('div', 'nm', o.name, bd); if (o.sub) mk('small', '', o.sub, nm);
    const tx = mk('div', 'tx', '', bd), pg = mk('div', 'pg', '', bd);
    btn('✕', 'x', () => closeTalk(), el).setAttribute('aria-label', '닫기');
    talk = { el, o, i: 0, sub: null, openedAt: performance.now(), tx, pg, av, stamped: false, typing: false, tm: 0, fin: null, menu: null, items: [], cur: 0, menuAt: 0 };
    el.addEventListener('click', e => { e.stopPropagation(); if (talk && !talk.menu) next(); });   // 창을 누르면 다음(글자가 나오는 중이면 끝까지)
    show(); map.sfx('pick');
    const s = o.spot; if (s && !s.hub) probePhotos(s).then(() => { if (talk && talk.o.spot === s && talk.menu) buildMenu(); });   // 찾은 사진 수를 목록 글자에
  }
  const canStamp = t => { const s = t.o.spot; return !!(s && !s.hub && !s.intro && !t.o.review && !stamps.has(s.key)); };
  function show() {
    const t = talk, P = t.o.pages, last = t.i >= P.length - 1;
    if (t.menu) { t.menu.remove(); t.menu = null; } t.sub = null; t.vg = null;
    t.pg.textContent = P.length > 1 ? (t.i + 1) + ' / ' + P.length : '';
    typeText(t, P[t.i], last ? () => buildMenu() : null);
  }
  const blipOK = () => !muted();
  // 목록 두 단계(교사 09-29 "영상이 하나가 아니야 — 여러 개 중 하나 고르는 느낌, 사진도"): 🎬 영상 볼래요 → 영상 제목 목록 · 📷 사진 볼래요 → 사진 목록 · ◀ 뒤로(Esc)
  //   본 것은 ✔ · 하나뿐이면 바로 연다 · 빈 영상 칸은 '(준비 중)'
  //   영상 묶음(09-29 교사 "체육관 = 체육 활동 / 체육관 행사"): videos에 group을 두 가지 이상 쓰면 🎬 → 묶음 목록(vg) → 그 묶음의 영상(v)
  const vGroups = s => s ? [...new Set(s.videos.map(v => v.group).filter(Boolean))] : [];
  function subBack(t) {   // 두 번째(세 번째) 목록에서 한 칸 뒤로 — ◀ 뒤로 · Esc
    const g = t.vg, gs = vGroups(t.o.spot);
    if (t.sub === 'v' && g && gs.length > 1) { t.sub = 'vg'; t.vg = null; buildMenu('g' + gs.indexOf(g)); return; }
    const k = t.sub === 'p' ? 'p' : 'v'; t.sub = null; t.vg = null; buildMenu(k);
  }
  function menuItems(t) {
    const s = t.o.spot, L = [], seen = k => (s && s.seen && s.seen.has(k) ? ' ✔' : ''), up = () => ({ k: 'up', t: '◀ 뒤로', f: () => subBack(t) });
    const gs = vGroups(s);
    if (!t.sub && t.o.choices) return t.o.choices.map(c => ({ k: c.k, t: c.t, f: c.f }));   // 견학 시작 선택(안내 · 혼자)
    if (t.sub === 'vg') {
      gs.forEach((g, gi) => { const ix = s.videos.map((v, i) => v.group === g ? i : -1).filter(i => i >= 0);
        L.push({ k: 'g' + gi, t: g + ' (' + ix.length + ')' + (ix.every(i => seen('v' + i)) ? ' ✔' : ''), f: () => { t.sub = 'v'; t.vg = g; buildMenu(); } }); });
      L.push(up()); return L;
    }
    if (t.sub === 'v') {
      s.videos.forEach((v, i) => { if (t.vg && v.group !== t.vg) return;
        L.push({ k: 'v' + i, t: '🎬 ' + (v.title || '영상 ' + (i + 1)) + (v.id ? '' : ' (준비 중)') + seen('v' + i), f: () => openMedia(s, 'v', i) }); });
      L.push(up()); return L;
    }
    if (t.sub === 'p') {
      if (s.photos.length) s.photos.forEach((p, i) => L.push({ k: 'p' + i, t: '📷 ' + (p.caption || '사진 ' + (i + 1)) + seen('p' + i), f: () => openMedia(s, 'p', i) }));
      else L.push({ k: 'p0', t: '📷 사진 (준비 중)', f: () => openMedia(s, 'p', 0) });
      L.push(up()); return L;
    }
    if (G && t.o.guide) { const ni = guideNextIndex(G.i + 1);   // 🧑‍🏫 안내 모드: 맨 위 = 다음 장소로
      L.push({ k: 'gnext', t: '🧑‍🏫 다 봤어요 — 교감선생님께', f: () => { closeTalk(); viceTalk(); } }); void ni; }   // 09-30 교사: 다음 장소는 교감선생님께 말을 걸어서
    if (s && s.detail.length) L.push({ k: 'd', t: '📄 자세히 볼래요' + seen('d'), f: () => openDetail(s) });
    if (s && (!s.hub || s.videos.some(v => v.id))) {   // 교감선생님(안내)은 채운 영상만
      if (s.videos.length) L.push({ k: 'v', t: '🎬 영상 볼래요' + (s.videos.length > 1 ? ' (' + s.videos.length + ')' : ''),
        f: () => { if (s.videos.length === 1) openMedia(s, 'v', 0); else { t.sub = gs.length > 1 ? 'vg' : 'v'; t.vg = null; buildMenu(); } } });
      if (!s.hub && (s.photos.length || SHOW_EMPTY)) L.push({ k: 'p', t: '📷 사진 볼래요' + (s.photos.length ? ' (' + s.photos.length + ')' : ''),
        f: () => probePhotos(s).then(() => { if (talk !== t) return; if (s.photos.length <= 1) openMedia(s, 'p', 0); else { t.sub = 'p'; buildMenu(); } }) });
    }
    if (canStamp(t)) L.push({ k: 's', t: '⭐ 도장 받을래요', f: stampIt });
    if (s && s.hub) L.push({ k: 'hub', t: '📖 학교 정보 모두 볼래요', f: () => { closeTalk(); openCard(true); } });
    if (s && s.hub && !G && GORDER.length) L.push({ k: 'gstart', t: '🧑‍🏫 안내해 주세요 (따라가기)', f: () => { closeTalk(); startGuide(); } });
    if (G && t.o.guide) {   // 안내 중엔 👋 대신 — 👀 = 교감선생님은 여기서 기다리고 나는 주변 구경(09-30 교사) · 🚶 = 안내 끝
      L.push({ k: 'gbrowse', t: '👀 여기 좀 둘러볼게요', f: () => { closeTalk(); guideBrowse(); } }); return L; }
    if (t.o.back) L.push({ k: 'back', t: '◀ 도감으로 돌아가기', f: () => closeTalk(true) });
    L.push({ k: 'bye', t: t.o.end || '👋 안녕히 계세요', f: () => closeTalk() });
    return L;
  }
  function buildMenu(want) {
    const t = talk; if (!t || t.typing || t.i < t.o.pages.length - 1) return;
    if (t.o.guide && G && canStamp(t)) { stampIt(); return; }   // 안내 모드: 다 읽으면 도장은 저절로(stampIt이 목록을 다시 짓는다)
    const was = t.menu && t.items[t.cur] ? t.items[t.cur].k : null;
    if (t.menu) t.menu.remove();
    t.items = menuItems(t);
    const m = t.menu = mk('ul', 'tmenu', null, t.el); m.setAttribute('role', 'listbox');
    if (t.sub) m.dataset.title = t.sub === 'vg' ? '🎬 어떤 영상을 볼까요?' : t.sub === 'v' ? (t.vg || '🎬 어떤 영상을 볼까요?') : '📷 어떤 사진을 볼까요?';
    t.items.forEach((it, k) => { const li = mk('li', '', it.t, m); li.setAttribute('role', 'option');
      li.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') sel(k); });
      li.addEventListener('click', e => { e.stopPropagation(); sel(k, true); pick(true); }); });
    // 커서 기본 자리: 방금 있던 것 → 도장 받기 → 모두 보기 → 맨 위
    const at = k => t.items.findIndex(it => it.k === k), c = [t.o.guide && want === 'bye' ? 'gnext' : want, was, 's', 'gnext', 'hub'].map(at).find(n => n >= 0);
    t.cur = c ?? 0; paintMenu(); t.menuAt = performance.now();
    const s = t.o.spot; let note = t.o.pages.length > 1 ? t.o.pages.length + ' / ' + t.o.pages.length : '';
    if (s && !s.hub && !s.intro && stamps.has(s.key) && !t.stamped) note = (note ? note + ' · ' : '') + '✔ 도장 받은 곳';
    else if (t.o.review && s && !s.hub && !s.intro && !stamps.has(s.key)) note = (note ? note + ' · ' : '') + '도장은 그곳에 가면 받아요';
    if (!t.stamped) t.pg.textContent = note;
  }
  function paintMenu() { const t = talk; if (!t || !t.menu) return; [...t.menu.children].forEach((li, k) => { li.classList.toggle('on', k === t.cur); li.setAttribute('aria-selected', k === t.cur ? 'true' : 'false'); }); }
  function sel(k, quiet) {
    const t = talk; if (!t || !t.menu) return; const n = t.items.length, c = ((k % n) + n) % n; if (c === t.cur) return;
    t.cur = c; paintMenu(); if (!quiet && blipOK()) map.tone(760, 0, 0.03, 'square', 0.025);
  }
  function pick(direct) {
    const t = talk; if (!t || !t.menu) return;
    if (!direct && performance.now() - t.menuAt < 220) return;   // 마지막 글자를 넘기던 E가 바로 고르지 않게
    const it = t.items[t.cur]; if (!it) return; if (blipOK()) map.tone(980, 0, 0.05, 'square', 0.03); it.f();
  }
  function stampIt() {   // 도장!
    const t = talk, s = t.o.spot;
    stamps.add(s.key); save(); t.stamped = true; map.sfx('ding');
    mk('div', 'tour-stamp', s.stamp, t.el); t.pg.textContent = '도장 받았어요! (' + stamps.size + '/' + N + ') · 📖 도감에 모였어요';
    refresh(); if (stamps.size === N && !(G && t.o.guide)) t.allDone = true;   // 안내 모드 = 버스 앞으로 돌아가서 완주 창(guideHome)
    buildMenu('bye'); t.menuAt = performance.now() + 250;
  }
  function next() {
    const t = talk; if (!t) return;
    if (t.typing) { t.fin(); return; }   // 글자가 나오는 중이면 먼저 끝까지(게임처럼)
    if (t.i < t.o.pages.length - 1) { t.i++; show(); map.sfx('tick'); return; }
    if (t.menu) pick(); else buildMenu();
  }
  function talkTo(s, o = {}) {
    openTalk({ spot: s, name: s.who || s.name, sub: s.who && s.who !== s.name ? s.name : '', icon: s.kind === 'board' ? '📋' : '🙋', pages: s.pages, ...o });
  }

  // ---------- 📖 정림초 도감(도장 모음 · all = 교감선생님이 연 '학교 정보 모두 보기' — 안 간 곳도 읽기) ----------
  let card = null, cardAll = false, resetArm = 0;
  function openCard(all) {
    if (talk) return; if (card && !all) { closeCard(); return; }
    if (card) card.remove();
    document.exitPointerLock?.(); map.player.freeze(true);
    cardAll = !!all; card = mk('div', 'tp'); card.id = 'tour-card'; card.setAttribute('role', 'dialog'); resetArm = 0; drawCard();
  }
  function drawCard() {
    card.textContent = '';
    const hd = mk('div', 'hd', null, card); mk('h3', '', cardAll ? '📖 우리 학교 정보 모아 보기' : '📖 정림초 도감', hd);
    const x = btn('✕', 'sub x', () => closeCard(), hd); x.setAttribute('aria-label', '닫기');   // 휴대폰 가로(높이 ≈390)에선 아래 [닫기]가 화면 밖 — 위에도 닫기(리뷰 09-27)
    mk('div', 'ct', cardAll ? '보고 싶은 곳을 누르면 이야기와 영상을 볼 수 있어요 · 도장 ' + stamps.size + ' / ' + N
      : '도장 ' + stamps.size + ' / ' + N + (stamps.size === N ? ' — 견학 완주! 🎉' : ' · 받은 곳을 누르면 다시 볼 수 있어요 · 안 간 곳을 누르면 길 안내'), card);
    const gr = mk('div', 'gr', null, card);
    for (const s of ALL) {
      const on = stamps.has(s.key), sl = btn('', 'sl' + (on ? ' on' : '') + (cardAll ? ' all' : ''), () => pickCard(s), gr);
      mk('div', 'ci', s.stamp, sl); mk('div', '', s.name, sl);
      if (hasVid(s) || s.photos.length) mk('span', 'mi', hasVid(s) ? '🎬' : '📷', sl);
      sl.title = s.where + (on ? ' · ✔ 도장' : '');
    }
    if (INTRO.length) {   // 각 반 소개(도장 없음) — 언제든 눌러 읽기
      mk('div', 'sh', '🏫 선생님 소개 — 반과 하는 일을 소개해요(도장 없음)', card);
      const g2 = mk('div', 'gr', null, card);
      for (const s of INTRO) { const sl = btn('', 'sl all', () => { const all = cardAll; closeCard(); talkTo(s, { review: true, back: () => openCard(all) }); }, g2);
        mk('div', 'ci', s.stamp, sl); mk('div', '', s.name, sl); if (hasVid(s) || s.photos.length) mk('span', 'mi', hasVid(s) ? '🎬' : '📷', sl); sl.title = s.where; }
    }
    const rw = mk('div', 'rw', null, card);
    if (!cardAll) btn(resetArm ? '정말 지울까요? 한 번 더 누르세요' : '도장 모두 지우기', 'sub', () => {
      if (!resetArm) { resetArm = 1; drawCard(); return; }
      stamps.clear(); save(); resetArm = 0; map.hud.toast('🧽 도장을 모두 지웠어요 — 처음부터 견학해요'); drawCard(); refresh(); }, rw);
    btn('닫기', '', () => closeCard(), rw);
    focus(x);
  }
  function pickCard(s) {
    const all = cardAll;
    if (all || stamps.has(s.key)) { closeCard(); talkTo(s, { review: true, back: () => openCard(all) }); return; }
    closeCard(); guide(s);
  }
  function closeCard() { if (!card) return; card.remove(); card = null; map.player.freeze(false); }

  // ---------- 완주 ----------
  // ---------- 🧑‍🏫 안내 모드(GUIDE-1 · 09-30 교사 '어르신들이 WASD·마우스를 어려워해 — 교감선생님이 앞장서면 자동으로 따라가게') ----------
  //   순서 = tour_data.js guide.order(길격자 실제 걷는 거리로 짠 최단 동선 — 되돌아가기 최소) · 교감선생님(대역)이 그곳 말 거는 자리로 걸어가고,
  //   나는 교감선생님이 지나간 자리(흔적)를 2m 뒤에서 따라 걷는다(map.player.steer — 키·조이스틱을 누르면 그쪽이 먼저) · 도착하면 이야기 창 → 도장 저절로 → ➡️ 다음 장소로
  //   1.5초 동안 따라가는 점에 못 다가가면(끼임 — 교장실·유치원·도서관 가구 사이) 조금 앞 흔적으로 옮긴다 · 그만두면 교감선생님은 버스 앞 제자리로
  const GD = DATA.guide || {}, GSPD = Math.max(1.5, Math.min(4.5, +GD.speed || 3));
  const GORDER = (Array.isArray(GD.order) ? GD.order : DATA.order || []).filter(k => BY.has(k) && !BY.get(k).hub && !BY.get(k).intro);
  let G = null;   // { i, spot, trail:[x,z,…], ti, moving, npcDone, stuck, best }
  const guideNextIndex = from => { for (let i = Math.max(0, from); i < GORDER.length; i++) if (!stamps.has(GORDER[i])) return i; return -1; };
  function startGuide() {
    const i = guideNextIndex(0); if (i < 0) { map.hud.toast('도장을 모두 모았어요! 🎉', 2.5); return; }
    if (!map.npc || !map.npc.get('vice')) { map.hud.toast('안내 선생님을 찾지 못했어요', 2.5); return; }
    G = { i: -1, spot: null, trail: [], ti: 0, moving: false, npcDone: false, stuck: 0, best: 1e9 };
    goLeg(i);
  }
  function stopGuide(msg) {
    if (!G) return; if (G.hot) G.hot.remove(); G = null; map.player.steer(null); map.npc.home('vice'); map.hud.chip('guide', null); refresh();
    if (msg) map.hud.toast(msg, 3);
  }
  const VH = BY.get('vice');   // 교감선생님 제자리(버스 앞) — 안내가 끝나면 여기로 돌아와 완주 창
  function sideOf(s) {   // 교감선생님 설 자리 = 이야기 자리(hx,hz) 옆 1.2m(사람·안내판 쪽을 가리지 않게 · 걷는 칸만)
    const dx = s.x - s.hx, dz = s.z - s.hz, L = Math.hypot(dx, dz) || 1, nx = -dz / L, nz = dx / L;
    const bx = -dx / L, bz = -dz / L;   // 뒤쪽(이야기 자리에서 사람·안내판 반대쪽)
    if (s.kind === 'board') for (const sd of [1, -1]) {   // 09-30 교사: 표지판은 교감선생님이 표지판 옆까지 들어가야 내가 표지판 앞에 선다
      const x = s.x + nx * 1.15 * sd + bx * 0.35, z = s.z + nz * 1.15 * sd + bz * 0.35, k = nav.snap(x, s.y, z, 0.5);
      if (k != null && k >= 0) { const q = nav.pos(k); if (Math.hypot(q[0] - s.hx, q[2] - s.hz) > 0.9) return { x: q[0], y: q[1], z: q[2] }; } }
    for (const [ox, oz] of [[nx * 1.2, nz * 1.2], [-nx * 1.2, -nz * 1.2], [nx * 1.8, nz * 1.8], [-nx * 1.8, -nz * 1.8], [nx + bx, nz + bz], [-nx + bx, -nz + bz], [bx * 1.6, bz * 1.6]]) {
      const x = s.hx + ox, z = s.hz + oz, k = nav.snap(x, s.y, z, 0.8);
      if (k != null && k >= 0) { const q = nav.pos(k); if (Math.hypot(q[0] - s.hx, q[2] - s.hz) > 0.9) return { x: q[0], y: q[1], z: q[2] }; } }
    return { x: s.hx + bx * 1.5, y: s.y, z: s.hz + bz * 1.5 };   // 이야기 자리 위엔 서지 않는다(내가 그 자리에 못 들어가 끼였다)
  }
  function goLeg(i) {
    if (!G) return; const home = i < 0, s = home ? VH : BY.get(GORDER[i]), tok = {};
    if (G.hot) { G.hot.remove(); G.hot = null; }
    Object.assign(G, { i: home ? G.i : i, home, spot: s, tok, ti: 0, moving: true, npcDone: false, fin: null, stuck: 0, best: 1e9 }); G.trail.length = 0;
    const v = map.npc.get('vice'), p = map.player.pos();
    if (v && Math.hypot(v.x - p.x, v.z - p.z) > 4) {   // 둘러보다 멀리 갔으면: 길격자로 교감선생님 자리까지 먼저(벽을 곧장 가로지르지 않게)
      const r = nav.path([p.x, p.y, p.z], [v.x, v.y, v.z], { maxExp: 60000 }); if (r.ok) for (const q of r.pts) G.trail.push(q[0], q[2]); }
    if (v) G.trail.push(v.x, v.z);
    map.hud.banner(home ? '🧑‍🏫 스쿨버스 앞으로 돌아가요' : '🧑‍🏫 교감선생님을 따라가요 → ' + s.name, 2.4); refresh(); guideChip();
    const to = home ? { x: VH.x, y: VH.y, z: VH.z } : sideOf(s);
    map.npc.move('vice', to, { walk: true, speed: GSPD, pass: true }).then(() => { if (G && G.tok === tok) G.npcDone = true; });
  }
  function guideChip() {   // 칩 = 지금 할 일(걷는 중: 어디로 · 둘러보는 중: 누르면 다음 장소로)
    if (!G) return; const ni = G.moving ? G.i : guideNextIndex(G.i + 1), s = ni >= 0 ? BY.get(GORDER[ni]) : null;
    if (G.moving) map.hud.chip('guide', G.home ? '🧑‍🏫 스쿨버스 앞으로 돌아가는 중' : '🧑‍🏫 안내 ' + (G.i + 1) + '/' + GORDER.length + ' → ' + G.spot.name, { onClick: () => {} });
    else map.hud.chip('guide', '🧑‍🏫 교감선생님께 (다음: ' + (s ? s.name : '스쿨버스 앞') + ')', { onClick: () => { if (!G || G.moving) return; viceTalk(); } });
  }
  function guideBrowse() {   // 👀 교감선생님은 그 자리에서 기다림 · 다 보면 교감선생님께 말 걸기(E · 칩)
    if (!G) return; map.hud.toast('천천히 둘러보세요! 다 보면 교감선생님께 말을 걸어요 (E · 오른쪽 칩)', 3.5); guideChip();
  }
  function viceTalk() {   // 교감선생님: '이제 다음 장소로 갈까요?'
    if (!G || G.moving) return; if (talk) closeTalk();
    const ni = guideNextIndex(G.i + 1), nx = ni >= 0 ? BY.get(GORDER[ni]) : null;
    openTalk({ name: '교감선생님', icon: '🧑‍🏫', pages: [nx ? '다 둘러보셨나요?\n다음은 「' + nx.name + '」예요. 이제 가 볼까요?' : '모든 곳을 다 둘러봤어요! 정말 멋져요.\n이제 스쿨버스 앞으로 돌아갈까요?'],
      choices: [{ k: 'go', t: nx ? '➡️ 네, 가요!' : '🚌 네, 돌아가요!', f: () => { closeTalk(); goLeg(nx ? ni : -1); } },
        { k: 'more', t: '👀 조금 더 둘러볼게요', f: () => { closeTalk(); guideBrowse(); } },
        { k: 'stop', t: '🚶 안내 그만할래요', f: () => { closeTalk(); stopGuide('이제 마음껏 둘러보세요! 교감선생님은 버스 앞으로 돌아가요'); } }] });
  }
  function guideHome() {   // 안내 끝: 버스 앞 — 교감선생님 인사 → 완주 창
    const v = map.npc.get('vice'), p = map.player.pos();
    G.moving = false; map.player.steer(null); if (v) { map.player.lookAt([v.x, v.z]); map.npc.pose('vice', 'wave', (Math.atan2(p.x - v.x, -(p.z - v.z)) * 180 / Math.PI + 360) % 360); }
    const G0 = G; G = null; map.hud.chip('guide', null); refresh();
    setTimeout(() => { map.npc.home('vice'); if (stamps.size === N) celebrate(); else map.hud.toast('안내가 끝났어요! 못 받은 도장은 혼자 찾아가 보세요', 3.5); }, 1600);
    void G0;
  }
  function guideArrive() {
    const s = G.spot, v = map.npc.get('vice'), p = map.player.pos();
    G.moving = false; map.player.steer(null); map.player.lookAt([s.x, s.z]); guideChip();
    if (v) map.npc.pose('vice', 'explain', (Math.atan2(p.x - v.x, -(p.z - v.z)) * 180 / Math.PI + 360) % 360);
    if (G.hot) G.hot.remove(); G.hot = v ? map.interact.add({ x: v.x, y: v.y, z: v.z, r: 1.9, label: '💬 교감선생님 — 다음 장소로', use: () => { if (!talk && !card && !media) viceTalk(); } }) : null;
    if (talk) closeTalk();
    talkTo(s, { guide: true });
  }
  function guideTick(dt) {
    if (!G || !G.moving) return;
    const v = map.npc.get('vice'), p = map.player.pos(), T = G.trail;
    if (v) { const n = T.length; if (!n || Math.hypot(v.x - T[n - 2], v.z - T[n - 1]) > 0.25) T.push(v.x, v.z); }
    while (G.ti < T.length - 2 && Math.hypot(T[G.ti] - p.x, T[G.ti + 1] - p.z) < 0.3) { G.ti += 2; G.best = 1e9; G.stuck = 0; }   // 0.3 = 문틀 사이로 교감선생님 길 그대로(0.7이면 모퉁이를 질러 문틀에 걸렸다)
    const dv = v ? Math.hypot(v.x - p.x, v.z - p.z) : 0;
    if (G.npcDone && !G.fin) {   // 교감선생님이 섰다 → 마지막 몇 걸음은 이야기 자리(방 안쪽)까지 길격자로(예전엔 2m 뒤 문밖 복도에서 멈췄다 — 09-30 교사 '도서관 안쪽으로')
      const s = G.spot, gx = G.home ? VH.hx : s.hx, gz = G.home ? VH.hz : s.hz, r = nav.path([p.x, p.y, p.z], [gx, s.y, gz], { maxExp: 60000 });
      G.fin = [gx, gz]; T.length = 0; if (r.ok) for (const q of r.pts) T.push(q[0], q[2]); T.push(gx, gz); G.ti = 0; G.best = 1e9; G.stuck = 0; }
    if (G.fin && Math.hypot(G.fin[0] - p.x, G.fin[1] - p.z) < 0.7) { if (G.home) guideHome(); else guideArrive(); return; }
    if (talk || card || media || (!G.fin && dv < 2.2)) { map.player.steer(null); G.stuck = 0; G.best = 1e9; return; }   // 걷는 교감선생님 바로 뒤면 기다림 · 창을 열었으면 멈춤
    const tx = T[G.ti], tz = T[G.ti + 1], d = Math.hypot(tx - p.x, tz - p.z);
    map.player.steer(tx - p.x, tz - p.z, G.fin ? GSPD : dv > 6 ? GSPD * 1.6 : GSPD * 1.1, true);
    if (d < G.best - 0.15) { G.best = d; G.stuck = 0; } else if (G.fin && G.stuck + dt > 1.5 && (G.ti >= T.length - 4 || Math.hypot(G.fin[0] - p.x, G.fin[1] - p.z) < 2.5)) { if (G.home) guideHome(); else guideArrive(); return; }   // 마지막 몇 걸음에서 막히면 거기서 도착
    else if ((G.stuck += dt) > 1.5) { const k = Math.min(T.length - 2, G.ti + 4); map.player.teleport([T[k], T[k + 1]]); G.ti = k; G.stuck = 0; G.best = 1e9; }   // 끼임(가구 사이 — 걷는 교감선생님은 몸 충돌이 없다) → 조금 앞 흔적으로
  }
  function celebrate() {
    map.sfx('done');
    const fin = Array.isArray(DATA.finish) && DATA.finish.length ? DATA.finish.map(String) : [];
    openTalk({ name: '견학 완주! 🎉', icon: '🏆', end: '🎉 좋아요!', pages: ['도장 ' + N + '개를 모두 모았어요! 🎉', ...fin] });
    const cols = ['#ff6b6b', '#ffd23c', '#4dabf7', '#69db7c', '#b197fc', '#ffa94d'];
    for (let i = 0; i < 44; i++) { const c = mk('div', 'tour-cf'); c.style.left = (Math.random() * 100) + 'vw'; c.style.background = cols[i % cols.length]; c.style.animationDelay = (Math.random() * 0.9) + 's'; setTimeout(() => c.remove(), 4300); }
  }

  // ---------- 지점(E · ✋ · 힌트 누름) + 가까운 다른 지점 끄기(견학 중에만 — 끝나면 원래대로) ----------
  const hotOf = new Map();
  for (const s of SPOTS) {
    const r = s.kind === 'board' ? BOARD_R : GUIDE_R, ypt = s.y;
    const h = map.interact.add({ x: s.hx, y: ypt, z: s.hz, r, label: '', use: () => {
      if (media) return;
      if (talk) { if (performance.now() - talk.openedAt > 250) next(); return; }   // ✋ 버튼이 창을 넘김(E는 아래 keydown이 먼저 받는다)
      if (card || performance.now() - closedAt < 350) return;
      talkTo(s); } });
    hotOf.set(s.key, h);
  }
  map.interact.enable(h => h.kind !== 'game' && SPOTS.some(s => (h.x - s.hx) ** 2 + (h.z - s.hz) ** 2 < HIDE_R * HIDE_R && Math.abs(h.y - s.y) < 1.6), false);
  function labelHots() { for (const s of SPOTS) { const h = hotOf.get(s.key).hot;
    h.label = s.hub ? '💬 ' + s.who + ' — 학교 정보 모아 보기' : s.intro ? '💬 ' + (s.who || s.name) + '과 이야기하기' : (s.kind === 'board' ? '📋 ' + s.name + ' 안내판 읽기' : '💬 ' + s.who + '과 이야기하기') + (stamps.has(s.key) ? ' ✔' : ''); } }

  // ---------- 사람·안내판을 직접 누르기(클릭·탭) — 화면에 비친 머리/판 가까이를 누르면(포인터 잠금 중이면 화면 가운데) ----------
  const cam = map.camera, V = new map.three.Vector3();
  let downX = 0, downY = 0, downT = 0, swallow = false;
  function pickAt(px, py) {
    let best = null, bd = 1e9; const W = innerWidth, H = innerHeight, cx = cam.position.x, cy = cam.position.y, cz = cam.position.z;
    for (const s of SPOTS) {
      const ty = s.kind === 'board' ? s.top - 0.6 : s.top - 0.3, L = Math.hypot(s.x - cx, ty - cy, s.z - cz); if (L > PICK_M) continue;
      V.set(s.x, ty, s.z).project(cam); if (V.z > 1 || V.z < -1) continue;
      const sx = (V.x + 1) / 2 * W, sy = (1 - V.y) / 2 * H, tol = Math.max(34, Math.min(110, 420 / Math.max(1, L))), d = Math.hypot(sx - px, sy - py);
      if (d > tol || d >= bd) continue;
      const t = map.q.ray([cx, cy, cz], [s.x, ty, s.z]); if (t !== null && t * L < L - 0.9) continue;   // 벽 너머는 안 됨(자기 몸·판 충돌 0.9m 안은 괜찮음)
      best = s; bd = d;
    }
    return best;
  }
  const onDown = e => { swallow = false; if (e.target && e.target.tagName === 'CANVAS') { downX = e.clientX; downY = e.clientY; downT = performance.now(); } else downT = 0; };
  const onUp = e => {
    if (!downT || talk || card || media || !e.target || e.target.tagName !== 'CANVAS') return;
    if (performance.now() - downT > 450 || Math.hypot(e.clientX - downX, e.clientY - downY) > 12) return;
    const locked = !!document.pointerLockElement, s = locked ? pickAt(innerWidth / 2, innerHeight / 2) : pickAt(e.clientX, e.clientY);
    if (!s) return;
    swallow = !locked && e.pointerType === 'mouse'; talkTo(s);   // 잠기지 않은 마우스 클릭이면 뒤따르는 click(= 포인터 잠금 요청)을 삼킨다(터치는 click이 안 온다 — 삼키면 다음 버튼 탭을 먹었다)
  };
  const onClick = e => { if (swallow || ((talk || card || media) && e.target && e.target.tagName === 'CANVAS')) { swallow = false; e.stopPropagation(); e.preventDefault(); } };   // 창이 열린 동안 화면 클릭 = 포인터 잠금 안 함(잠기면 창 버튼을 못 누른다)
  // 창이 열린 동안 E·Enter·Space = 다음, Esc = 닫기(창 밖 E가 주변 지점을 또 부르지 않게 여기서 멈춘다) · C = 도감 · H = 길 안내 · 영상 창: Esc 닫기 · ←→ 사진 넘기기
  const onKey = e => {
    if (media) {
      if (e.code === 'Escape') { e.stopPropagation(); e.preventDefault(); closeMedia(); }
      else if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') { e.stopPropagation(); e.preventDefault(); media.flip && media.flip(e.code === 'ArrowLeft' ? -1 : 1); }
      else if (!/^(Tab|Enter|Space|NumpadEnter)$/.test(e.code)) e.stopPropagation();   // 버튼 누르기(Enter·Space·Tab)는 창 안에서
      return;
    }
    if (talk) {
      if (talk.menu && ['ArrowUp', 'ArrowDown', 'KeyW', 'KeyS'].includes(e.code)) { e.stopPropagation(); e.preventDefault(); sel(talk.cur + (e.code === 'ArrowUp' || e.code === 'KeyW' ? -1 : 1)); return; }
      if (['KeyE', 'Enter', 'Space', 'NumpadEnter'].includes(e.code)) {
        e.stopPropagation(); e.preventDefault(); if (!e.repeat && performance.now() - talk.openedAt > 200) next(); return; }
      if (e.code === 'Escape') { e.stopPropagation(); if (talk.sub) subBack(talk); else closeTalk(); return; }   // 두 번째 목록이면 뒤로
      return;
    }
    if (card) { if (e.code === 'Escape' || e.code === 'KeyC') { e.stopPropagation(); closeCard(); } return; }
    if (e.repeat) return;
    if (e.code === 'KeyC') openCard(); else if (e.code === 'KeyH') guide();
  };
  addEventListener('pointerdown', onDown, true); addEventListener('pointerup', onUp, true); addEventListener('click', onClick, true); addEventListener('keydown', onKey, true);

  // ---------- 다음 추천 · 표식 · 미니맵 · 길 안내 ----------
  let nextS = null, trail = null, trailT = 0;
  const marks = new Map();   // key → 표식(아직 도장 없는 곳 위 다이아몬드 · 추천 = 주황)
  function pickNext() { if (G) { const i = guideNextIndex(G.i); if (i >= 0) return BY.get(GORDER[i]); }   // 안내 모드 = 안내 순서
    for (const s of ALL) if (!stamps.has(s.key)) return s; return null; }
  function refresh() {
    labelHots();
    nextS = pickNext();
    map.hud.chip('tour', '📖 정림초 도감 ' + stamps.size + '/' + N + ' (C)', { onClick: () => openCard() });
    const wh = nextS && nextS.where ? (nextS.where.length > 12 ? nextS.where.slice(0, 11) + '…' : nextS.where) : '';   // 목표 줄은 한 줄(휴대폰에서 미니맵과 안 겹치게 짧게)
    map.hud.goal(nextS ? '다음: ' + nextS.name + (wh ? ' · ' + wh : '') : '🎉 견학 완주! (C: 정림초 도감)');
    for (const s of ALL) {
      const want = !stamps.has(s.key), m = marks.get(s.key);
      if (want && !m) marks.set(s.key, map.mk.marker(s.mx, s.my, s.mz, { color: s === nextS ? 0xff8a3c : 0xffd23c, beam: false }));
      else if (!want && m) { m.remove(); marks.delete(s.key); }
      else if (m) m.color(s === nextS ? 0xff8a3c : 0xffd23c);
    }
    map.minimap.setMarks([...ALL.map(s => stamps.has(s.key) ? { x: s.x, z: s.z, color: '#3cb46e', shape: 'dot', r: 3.2 } : { x: s.x, z: s.z, color: s === nextS ? '#ff7a2c' : '#f5b400', shape: 'star', blink: s === nextS }),
      ...SPOTS.filter(s => s.hub).map(s => ({ x: s.x, z: s.z, color: '#2f6fd0', shape: 'dot', r: 3.6 })),
      ...INTRO.map(s => ({ x: s.x, z: s.z, color: '#8a6ad8', shape: 'dot', r: 2.6 }))]);
  }
  function clearTrail() { if (trail) { trail.remove(); trail = null; } trailT = 0; }
  function guide(to) {
    const s = to || nextS; if (!s) { map.hud.toast('🎉 모든 곳을 다 가 봤어요!'); return; }
    const me = map.player.get(), r = nav.path([me.x, me.y, me.z], s.node >= 0 ? s.node : [s.hx, s.y, s.hz], { maxExp: 400000 });
    if (!r.ok) { map.hud.toast('여기서는 길을 찾지 못했어요 — 조금 움직여 보세요'); return; }
    clearTrail(); trail = map.mk.trail(r.pts, { color: 0xff9a3c, width: 0.45 }); trailT = TRAIL_T;
    map.hud.toast('🧭 ' + s.name + '까지 ' + Math.round(r.len) + 'm');
  }
  map.hud.chip('tour-h', '💡 길 안내 (H)', { onClick: () => guide() });
  map.minimap.show();

  // ---------- 시작: 스쿨버스 앞 교감선생님 곁(앞 2.6m · 선생님 오른손 쪽 0.8m — 선생님이 내 캐릭터에 가리지 않게 살짝 비껴 본다) ----------
  const va = map.tour.find(a => a.key === 'vice');
  function goStart() {   // 스쿨버스 앞 교감선생님 곁(처음 자리)
    if (!va) return; const [fx, fz] = DIR[va.face & 3], e = map.findEntry(va.x + fx * 2.6 + fz * 0.8, va.z + fz * 2.6 - fx * 0.8, va.y, null, 3);
    if (e) { map.player.teleport([e.x, e.y, e.z]); map.player.face((Math.atan2(va.x - e.x, -(va.z - e.z)) * 180 / Math.PI + 12 + 360) % 360); }
  }
  if (va && params.spawn == null) goStart();
  else if (params.spawn) map.player.teleport('spawn:' + params.spawn);
  refresh();
  map.player.freeze(false);
  const hub = SPOTS.find(s => s.hub);
  const introChoices = [{ k: 'gstart', t: '🧑‍🏫 교감선생님 따라가기 (안내)', f: () => { closeTalk(); startGuide(); } }, { k: 'free', t: '🚶 혼자 둘러보기', f: () => closeTalk() }];
  function openIntro() { openTalk({ name: '우리 학교 견학', icon: '🏫', end: '🏁 견학 시작!', pages: [
    ...(Array.isArray(DATA.welcome) ? DATA.welcome.map(String) : []),
    '선생님(🙋)과 안내판(📋)을 찾아가 이야기를 듣고 도장을 모아요.\n· 가까이 가서 E(터치 ✋) 또는 사람·안내판을 눌러요 · 고를 때는 ↑↓\u00a0+\u00a0E\n· 떠 있는 ◆ · 미니맵 ⭐ = 아직 못 간 곳(주황 = 다음 추천)\n· H = 다음 곳 길 안내 · C = 📖 정림초 도감(' + N + '칸)'
      + (INTRO.length ? '\n· 각 반·교무실·행정실 선생님들도 한마디씩 해 줘요(도장 없음)' : '')
      + (hub ? '\n· 바로 앞 ' + hub.who + '께 말을 걸면 모든 곳의 이야기·영상을 한눈에 볼 수 있어요' : ''),
    '어떻게 둘러볼까요?\n🧑‍🏫 교감선생님 따라가기 — 교감선생님이 앞장서면 저절로 따라가요. 조작이 어려우면 이쪽!\n🚶 혼자 둘러보기 — 마음 가는 곳부터 직접 찾아가요.'], choices: GORDER.length ? introChoices : null }); }

  // ---------- ☰ 견학 메뉴(09-30 교사 '처음부터 하기가 있어야 — 메뉴도') — 오른쪽 칩 · RPG 선택 목록 그대로 ----------
  function openMenu() {
    if (media) closeMedia(); if (card) closeCard();
    const L = [];
    if (G) L.push({ k: 'mstop', t: '⏸ 안내 멈추고 혼자 다니기', f: () => { closeTalk(); stopGuide('이제 마음껏 둘러보세요! 교감선생님은 버스 앞으로 돌아가요'); } });
    else if (GORDER.length && stamps.size < N) L.push({ k: 'mguide', t: stamps.size ? '🧑‍🏫 교감선생님 따라가기 (이어서)' : '🧑‍🏫 교감선생님 따라가기', f: () => { closeTalk(); startGuide(); } });
    L.push({ k: 'mbook', t: '📖 정림초 도감 (' + stamps.size + '/' + N + ')', f: () => { closeTalk(); openCard(); } });
    if (map.minimap) L.push({ k: 'mmap', t: '🗺 학교 지도', f: () => { closeTalk(); map.minimap.show(); map.minimap.toggle(true); } });
    if (stamps.size === N) L.push({ k: 'mend', t: '🏆 엔딩 다시 보기', f: () => { closeTalk(); celebrate(); } });
    L.push({ k: 'mre', t: '🔄 처음부터 다시 하기', f: () => openTalk({ name: '처음부터 다시', icon: '🔄', pages: ['도장이 모두 지워지고, 스쿨버스 앞에서 처음 인사부터 다시 시작해요.\n괜찮을까요?'],
      choices: [{ k: 'y', t: '🔄 네, 처음부터 할래요', f: restart }, { k: 'n', t: '◀ 아니요', f: openMenu }] }) });
    L.push({ k: 'mx', t: '✕ 닫기', f: () => closeTalk() });
    openTalk({ name: '견학 메뉴', icon: '☰', pages: ['무엇을 할까요?' + (G ? '\n지금은 교감선생님 안내 중이에요.' : '')], choices: L });
  }
  function restart() {
    closeTalk(); if (G) { G = null; map.player.steer(null); map.npc.home('vice'); map.hud.chip('guide', null); }
    stamps.clear(); save(); refresh(); goStart(); map.hud.toast('🔄 처음부터 다시 시작해요', 2); openIntro();
  }
  map.hud.chip('tmenu', '☰ 견학 메뉴', { onClick: () => { if (!talk || !G || !G.moving) openMenu(); } });

  if (params.ending === '1') celebrate();
  else if (params.guide === '1') startGuide();   // 어르신용 링크: ?tour=1&guide=1 — 처음부터 안내 모드
  else if (params.intro !== '0') openIntro();

  return {
    tick(dt) {
      guideTick(dt);
      if (trail && (trailT -= dt) <= 0) clearTrail();   // 매 프레임 할 일은 이것뿐(표식·미니맵·목표 줄은 도장이 바뀔 때만 refresh)
    },
    stop() {
      dead = true;
      removeEventListener('pointerdown', onDown, true); removeEventListener('pointerup', onUp, true); removeEventListener('click', onClick, true); removeEventListener('keydown', onKey, true);
      ui.remove(); if (css.isConnected) css.remove(); talk = null; card = null; media = null;   // 지점·표식·리본·칩·목표 줄·미니맵·멈춤은 범위 파사드가 정리
    },
    // 시험·교사용 읽기
    get spots() { return SPOTS.map(s => ({ key: s.key, kind: s.kind, hub: s.hub, intro: s.intro, name: s.name, x: +s.x.toFixed(2), y: +s.y.toFixed(2), z: +s.z.toFixed(2), hot: [+s.hx.toFixed(2), +s.hz.toFixed(2)], node: s.node, videos: s.videos.filter(v => v.id).length, vslots: s.videos.length, photos: s.photos.length })); },
    get stamps() { return [...stamps]; }, get total() { return N; }, get open() { return media ? 'media' : talk ? 'talk' : card ? 'card' : null; }, get talking() { return talk && talk.o.spot ? talk.o.spot.key : null; }, get nextKey() { return nextS && nextS.key; },
    talkTo: key => { const s = BY.get(key); if (s) talkTo(s); }, next, closeTalk, openCard, closeCard, openMedia: (key, k) => { const s = BY.get(key); if (s) openMedia(s, k); }, closeMedia, guide: key => guide(key ? BY.get(key) : null), pickAt: (x, y) => { const s = pickAt(x, y); return s && s.key; },
  };
}
