// 무대 틀(design §12) — 장소 하나 = 무대 모듈 { load → step·draw → dispose } · 바꿀 때 덮개 아래에서 짓고 셰이더를 미리 굽고(compileAsync) 옛 것은 GPU까지 비움
// 장소 모듈 계약 = docs/dragon/stage3_plan.md §2 · 지울 때 kit의 공유 자원(SHARED)은 남김 · renderLists.dispose()로 그리기 목록 캐시도 비움
import * as THREE from 'three';
import { SHARED } from '../look/kit.js?v=17';

/* 장면에서 뺀 묶음의 기하·재질·텍스처를 GPU까지 비움(공유 것은 건너뜀) */
export function disposeTree(root) {
  const seen = new Set();
  const tex = (m) => { for (const k in m) { const v = m[k]; if (v && v.isTexture && !SHARED.has(v) && !seen.has(v)) { seen.add(v); v.dispose(); } } };
  root.traverse((o) => {
    if (o.geometry && !SHARED.has(o.geometry) && !seen.has(o.geometry)) { seen.add(o.geometry); o.geometry.dispose(); }
    const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
    for (const m of ms) {
      if (SHARED.has(m) || seen.has(m)) continue;
      seen.add(m); tex(m); if (m.uniforms) for (const k in m.uniforms) { const v = m.uniforms[k].value; if (v && v.isTexture && !SHARED.has(v) && !seen.has(v)) { seen.add(v); v.dispose(); } }
      m.dispose();
    }
    if (o.isInstancedMesh && o.dispose) o.dispose();
    if (o.isSkinnedMesh && o.skeleton && o.skeleton.boneTexture) o.skeleton.dispose();
  });
}

/* 장소 그릇 — 장소 모듈은 자기 물건을 모두 group에 넣는다(scene에 바로 넣지 않음) → 지울 때 group 하나만 */
export function createStageHost({ gfx, scene, camera, veil }) {
  const H = { cur: null, name: '', loads: 0, lastMs: 0, busy: false };
  /* load(name, builder, opt) — builder(ctx) → place(계약 §2) · 끝나면 place를 돌려줌 */
  H.load = async (name, builder, opt = {}) => {
    H.busy = true;
    if (veil) veil.show(opt.title || '');
    const t0 = performance.now();
    H.unload();
    const group = new THREE.Group(); group.name = 'place:' + name; scene.add(group);
    const place = await builder({ scene, group, camera, gfx, opt });
    place.group = place.group || group;
    try { await gfx.renderer.compileAsync(scene, camera); } catch (e) { /* 굽기 실패 = 첫 그리기 때 구움 */ }
    H.cur = place; H.name = name; H.loads++; H.lastMs = Math.round(performance.now() - t0);
    H.busy = false;
    if (veil) veil.hide();
    return place;
  };
  H.unload = () => {
    const p = H.cur; if (!p) return;
    try { if (p.dispose) p.dispose(); } catch (e) { console.warn('place dispose', e); }
    if (p.group) { p.group.removeFromParent(); disposeTree(p.group); }
    scene.fog = scene.fog || null;
    gfx.renderer.renderLists.dispose();
    H.cur = null; H.name = '';
  };
  return H;
}
