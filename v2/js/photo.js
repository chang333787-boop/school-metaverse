// 📷 사진관(PHOTO-1 · 10-17 함께·표현 팀 #50): 화면 글·칩을 숨기고 3·2·1 → 다 그린 프레임 하나를 320×180 JPEG(약 15KB)로 → 이 기기 IndexedDB 30장(넘으면 가장 오래된 것부터)
//   잡는 법 = preserveDrawingBuffer 없이: main.js가 renderer.render 바로 뒤에 afterRender(canvas)를 부름(평소엔 null 확인 하나) → 찍을 때 그 한 번만 2D 캔버스로 drawImage(같은 작업 안이라 그림판이 아직 살아 있음) → toBlob
//   서버에 올리지 않음(아이 기록이 밖으로 나가지 않음) · '💾 기기에 저장' = 내려받기 · 방 안이면 정해진 말 '📷 3초 뒤 찍어요!'를 이미 있는 방 채팅으로(새 가지 X) · 홍보판 없음
//   앨범 = 마을 '📷 앨범'(요리 사진) 안 '마을 사진' 쪽 · 학교 = ⏸ 멈춤 창 '📷 사진'
import { schoolPop } from './settings.js?v=3';
const DBN = 'sm-photos', ST = 'p', MAX = 30, W9 = 320, H9 = 180;
let shotQ = null, busy = false, URLS = [];
export const lastShot = { ms: 0, kb: 0, n: 0 };
// main.js가 매 프레임 렌더 바로 뒤에 부름 — 찍을 때만 일함
export function afterRender(canvas) { if (!shotQ) return; const q = shotQ; shotQ = null; q(canvas); }
function idb() { return new Promise((res, rej) => { try { const r = indexedDB.open(DBN, 1); r.onupgradeneeded = () => { const d = r.result; if (!d.objectStoreNames.contains(ST)) d.createObjectStore(ST, { keyPath: 'id', autoIncrement: true }); }; r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); } catch (e) { rej(e); } }); }
const tx = (d, mode, fn) => new Promise((res, rej) => { const t = d.transaction(ST, mode), s = t.objectStore(ST); let out; Promise.resolve(fn(s)).then((v) => { out = v; }); t.oncomplete = () => res(out); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error); });
const req = (r) => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
export async function listPhotos() { try { const d = await idb(); const L = await tx(d, 'readonly', (s) => req(s.getAll())); d.close(); return (L || []).sort((a, b) => b.t - a.t); } catch (e) { return []; } }
async function addPhoto(rec) { const d = await idb(); await tx(d, 'readwrite', async (s) => { const r9 = s.add(rec); r9.onsuccess = () => { rec.id = r9.result; };   /* HEAL-1 엽서가 사진 번호를 기억 */ const keys = await req(s.getAllKeys()); keys.sort((a, b) => a - b); for (const k of keys.slice(0, Math.max(0, keys.length - MAX))) s.delete(k); }); d.close(); }
export async function delPhoto(id) { try { const d = await idb(); await tx(d, 'readwrite', (s) => { s.delete(id); }); d.close(); } catch (e) { /* */ } }
export async function countPhotos() { try { const d = await idb(); const n = await tx(d, 'readonly', (s) => req(s.count())); d.close(); return n || 0; } catch (e) { return 0; } }
const pad = (n) => String(n).padStart(2, '0');
export function savePhoto(p) { const d = new Date(p.t), a = document.createElement('a'), u = URL.createObjectURL(p.b); a.href = u; a.download = '우리학교_사진_' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '_' + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds()) + '.jpg'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); }
const CSS = 'body.ph-on>*:not(#scene):not(#phCd):not(#phFlash):not(#phHint):not(script):not(style){visibility:hidden!important}#phCd{position:fixed;inset:0;z-index:90;display:flex;align-items:center;justify-content:center;pointer-events:none;font:900 min(34vw,190px)/1 system-ui,sans-serif;color:#fff;text-shadow:0 6px 0 #1d3557,0 0 30px rgba(0,0,0,.35)}#phCd small{position:absolute;bottom:12%;font-size:20px;text-shadow:0 2px 0 #1d3557}#phFlash{position:fixed;inset:0;z-index:91;background:#fff;pointer-events:none;opacity:.85;transition:opacity .45s}';
export function photoCss() { addCss(); }   /* HEAL-1 마을 사진 모드: 들어가자마자 화면 표시 숨김(첫 찰칵 전에도) */
function addCss() { if (document.getElementById('ph-css')) return; const st = document.createElement('style'); st.id = 'ph-css'; st.textContent = CSS; document.head.appendChild(st); }
// 찍기: o = { tone(f,t0,dur,type,vol), net(), toast(msg,sec), label(), en, onDone(rec), cd(세는 수 · 기본 [3,2,1]), onFrame(canvas)(찍는 그 프레임 한 번 · 렌더 바로 뒤) · keep(찍은 뒤 ph-on 그대로 — 마을 사진 모드) } → Promise(rec | null)
export function takePhoto(o = {}) {
  if (busy || window.SM_PROMO) return Promise.resolve(null); busy = true; addCss(); document.exitPointerLock?.();
  const CD = Array.isArray(o.cd) ? o.cd : [3, 2, 1];   /* PHOTO-2 사진 기자: cd = [] = 셔터를 누른 그 다음 프레임(동물은 기다려 주지 않음) */
  const N = CD.length && o.net && o.net(); try { if (N && N.say && !(N.ctlData && N.ctlData.chat && N.ctlData.chat.off)) N.say('📷 3초 뒤 찍어요!'); } catch (e) { /* */ }   // 방 친구들이 포즈를 잡게(이미 있는 채팅 길)
  document.body.classList.add('ph-on'); const cd = document.createElement('div'); cd.id = 'phCd'; document.body.appendChild(cd);
  const T = o.tone || (() => {}), sl = (ms) => new Promise((r) => setTimeout(r, ms));
  return (async () => {
    for (const n of CD) { cd.innerHTML = n + '<small>' + (o.en ? 'Strike a pose! 😀 = emotes' : '포즈! 😀 이모트도 돼요') + '</small>'; T(n === 1 ? 880 : 660, 0, 0.09, 'triangle', 0.12); await sl(1000); }
    cd.remove();
    const blob = await new Promise((res) => { shotQ = (cv) => { const t0 = performance.now(); if (o.onFrame) { try { o.onFrame(cv); } catch (e) { console.warn('photo onFrame', e); } } try { const w = cv.width, h = cv.height, port = h > w, ow = port ? H9 : W9, oh = port ? W9 : H9, sc = Math.max(ow / w, oh / h), sw = ow / sc, sh = oh / sc;   // 가운데를 꽉 채워 자름(가로 320×180 · 세로 180×320)
          const c2 = document.createElement('canvas'); c2.width = ow; c2.height = oh; const g = c2.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(cv, (w - sw) / 2, (h - sh) / 2, sw, sh, 0, 0, ow, oh); lastShot.ms = +(performance.now() - t0).toFixed(2);
          c2.toBlob((b) => res(b), 'image/jpeg', 0.72); } catch (e) { lastShot.ms = +(performance.now() - t0).toFixed(2); res(null); } }; });
    if (!o.keep) document.body.classList.remove('ph-on');   /* HEAL-1 사진 모드(keep) = 찍은 뒤에도 화면 표시 숨김 그대로 */
    const fl = document.createElement('div'); fl.id = 'phFlash'; document.body.appendChild(fl); requestAnimationFrame(() => { fl.style.opacity = '0'; }); setTimeout(() => fl.remove(), 600);
    T(1600, 0, 0.05, 'square', 0.05); T(1200, 0.05, 0.08, 'square', 0.04);
    if (!blob) { busy = false; if (o.toast) o.toast(o.en ? '📷 Could not take a photo here' : '📷 여기서는 사진을 못 찍었어요', 2.4); return null; }
    const rec = { t: Date.now(), b: blob, w: String((o.label && o.label()) || '').slice(0, 30) };
    try { await addPhoto(rec); } catch (e) { busy = false; if (o.toast) o.toast(o.en ? '📷 Could not save (storage blocked)' : '📷 이 기기에 저장하지 못했어요', 2.4); return null; }
    lastShot.kb = +(blob.size / 1024).toFixed(1); lastShot.n++; busy = false;
    if (o.toast) o.toast(o.en ? '📷 Snap! Saved in this device’s album' : '📷 찰칵! 이 기기 앨범에 남았어요', 2.4); if (o.onDone) o.onDone(rec); return rec;
  })().finally(() => { busy = false; if (!o.keep) document.body.classList.remove('ph-on'); const c9 = document.getElementById('phCd'); if (c9) c9.remove(); });
}
// 앨범 칸 채우기(마을 앨범 '마을 사진' · 학교 사진 창) — el = 빈 .bagg · 새로 채울 때 지난 그림 주소는 돌려줌
export async function fillAlbum(el, o = {}) {
  for (const u of URLS) URL.revokeObjectURL(u); URLS = [];
  const L = await listPhotos(), en = o.en; if (!el.isConnected) return L.length;
  if (!L.length) { el.innerHTML = '<div class="sm" style="grid-column:1/-1">' + (en ? 'No photos yet — press 📷 to take one!' : '아직 사진이 없어요 — 📷 찍기를 눌러 봐요!') + '</div>'; return 0; }
  el.innerHTML = L.map((p) => { const u = URL.createObjectURL(p.b); URLS.push(u); const d = new Date(p.t);
    return '<div data-id="' + p.id + '"><img src="' + u + '" alt="' + (en ? 'photo' : '사진') + '" style="width:100%;border-radius:8px;display:block"><div class="sm" style="margin:3px 0">' + (d.getMonth() + 1) + '/' + d.getDate() + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + (p.w ? ' · ' + String(p.w).replace(/[<>&"]/g, '') : '') + '</div><button type="button" class="sub" data-ph="save" style="min-height:36px;padding:3px 8px">💾 ' + (en ? 'Save' : '기기에 저장') + '</button> <button type="button" class="sub" data-ph="del" style="min-height:36px;padding:3px 8px">✕</button></div>'; }).join('');
  if (!el.dataset.ph) { el.dataset.ph = '1'; el.addEventListener('click', async (e) => { const b = e.target.closest('[data-ph]'); if (!b) return; e.stopPropagation(); const id = +b.closest('[data-id]').dataset.id;
    if (b.dataset.ph === 'save') { const p = (await listPhotos()).find((q) => q.id === id); if (p) savePhoto(p); }
    else if (b.dataset.ph === 'del') { if (b.dataset.ok) { await delPhoto(id); fillAlbum(el, o); if (o.onChange) o.onChange(); } else { b.dataset.ok = '1'; b.textContent = en ? '✕ Delete?' : '✕ 지울까요?'; } } }); }
  return L.length;
}
// 학교 쪽 사진 창(⏸ 멈춤 창 '📷 사진')
export function openPhotoPanel(o = {}) { if (window.SM_PROMO) return null;
  const P = schoolPop('phPop', '<h3>📷 사진관</h3><div class="sm">3·2·1 뒤에 지금 화면을 찍어요(화면 글은 빼고) · 이 기기에만 30장 · 서버에 올리지 않아요</div><div class="row" style="justify-content:flex-start"><button type="button" data-a="shot">📷 지금 찍기 (3·2·1)</button></div><div class="grp">🗂 이 기기 앨범 <span class="cnt"></span></div><div class="bagg"></div><div class="row"><button type="button" class="sub" data-a="x">닫기</button></div>', o.onClose);
  const G = P.box.querySelector('.bagg'), cnt = P.box.querySelector('.cnt'); fillAlbum(G, { onChange: () => countPhotos().then((n) => { cnt.textContent = n + ' / ' + MAX; }) }).then((n) => { cnt.textContent = n + ' / ' + MAX; });
  P.box.addEventListener('click', (e) => { const b = e.target.closest('[data-a]'); if (!b) return; if (b.dataset.a === 'x') P.close(); else if (b.dataset.a === 'shot') { P.close(); if (o.shoot) o.shoot(); } });
  return P;
}
export const PHOTO_MAX = MAX;
