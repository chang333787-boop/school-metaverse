// 저장 칸 셋 — 이 기기 localStorage(2초 간격 상한) · 도전 하나 끝날 때마다 · 칸 = { grade, diff, ch, idx, book, inv, trust, records, t }
const KEY = (k) => 'drg-save-' + k;
let lastW = 0, pending = null;
export function readSlot(k) { try { return JSON.parse(localStorage.getItem(KEY(k))) || null; } catch (e) { return null; } }
export function writeSlot(k, data, force) {
  pending = { k, data };
  const now = performance.now(); if (!force && now - lastW < 2000) return false;
  lastW = now; try { localStorage.setItem(KEY(pending.k), JSON.stringify(Object.assign({ t: Date.now() }, pending.data))); } catch (e) { /* 저장 못 하는 창 = 그대로 놀이 */ }
  pending = null; return true;
}
export function flushSlot() { if (pending) writeSlot(pending.k, pending.data, true); }
export function clearSlot(k) { try { localStorage.removeItem(KEY(k)); } catch (e) { /* 그대로 */ } }
