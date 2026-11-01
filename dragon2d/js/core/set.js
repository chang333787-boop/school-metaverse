// 이 기기 설정(소리·화면 모드) — 3D판과 따로 'drg2-set'
const LS = 'drg2-set';
export function loadSet() { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch (e) { return {}; } }
export function saveSet(o) { try { localStorage.setItem(LS, JSON.stringify(Object.assign(loadSet(), o))); } catch (e) { /* 저장 못 하는 창 = 그대로 */ } }
