// 셰이더 지킴이(팀 C · 11-01) — 놀이 도중 장소에 새로 들어온 물건(배우 모델 · 맞을 때 연기 · 표시 고리 · 대장 …)의 셰이더가 아직 없으면
// 짓기만 맡기고(renderer.compile = KHR_parallel_shader_compile · 막지 않음) 다 지어질 때까지 그 물건만 안 그림(layers 0) → 다 되면 보이게
// 전에는 처음 그리는 프레임이 셰이더를 지으며 멈춤(CPU 4× 흉내 100~150ms · 크롬북 인텔 GPU는 셰이더 하나에 수십 ms)
// 쓰는 곳: game.js loadPlace가 장소 group.add를 감쌈(watch) · 그리기마다 tick · runner warmStep이 차례 첫 토막 뒤 idle()을 기다림(덮개 아래)
// 이미 지은 셰이더(같은 열쇠)면 아무것도 안 함 · 2초 넘게 안 되면 그냥 보임(첫 그리기 때 지음) · 매 프레임 new X(기다리는 것만 봄)
export function createShaderGuard(renderer, camera, scene) {
  const pend = [];                                  // { o, wait: [재질], masks: [물건, mask, …], t0 }
  const ready = (m) => { const p = renderer.properties.get(m).currentProgram; return !p || p.isReady(); };
  const S = {
    pending: () => pend.length,
    watch(group) {
      const add0 = group.add;
      group.add = function (...objs) { const r = add0.apply(this, objs); for (const o of objs) S.check(o); return r; };
    },
    check(o) {
      if (!o || !o.isObject3D || pend.some((P) => P.o === o)) return;
      let mats; try { mats = renderer.compile(o, camera, scene); } catch (e) { return; }
      const wait = []; for (const m of mats) { try { if (!ready(m)) wait.push(m); } catch (e) { /* 그대로 */ } }
      if (!wait.length) return;
      const masks = []; o.traverse((x) => { masks.push(x, x.layers.mask); x.layers.mask = 0; });
      pend.push({ o, wait, masks, t0: performance.now() });
    },
    tick() {
      if (!pend.length) return;
      const now = performance.now();
      for (let i = pend.length - 1; i >= 0; i--) {
        const P = pend[i]; let ok = true;
        try { for (let k = 0; k < P.wait.length; k++) if (!ready(P.wait[k])) { ok = false; break; } } catch (e) { ok = true; }
        if (ok || !P.o.parent || now - P.t0 > 2000) { for (let k = 0; k < P.masks.length; k += 2) P.masks[k].layers.mask = P.masks[k + 1]; pend.splice(i, 1); }
      }
    },
    /* 기다리는 것이 다 될 때까지(덮개 아래 · 최대 ms) */
    idle(max = 2000) { const t0 = performance.now(); return new Promise((res) => { const f = () => { S.tick(); if (!pend.length || performance.now() - t0 > max) res(); else setTimeout(f, 10); }; f(); }); },
  };
  return S;
}
