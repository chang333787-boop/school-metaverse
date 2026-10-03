const MATS = new Map();
export function mergeMeshes(THREE, root, o = {}) {
  const keep = new Set(o.keep || []), AIM = o.aim;
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert(), m = new THREE.Matrix4(), c = new THREE.Color();
  const P = [], N = [], C = [], gone = [];
  let on = null;
  const walk = (obj) => {
    for (const ch of [...obj.children]) {
      if (keep.has(ch)) continue;
      if (ch.isMesh && !ch.isInstancedMesh && ch.material && !ch.material.transparent && !Array.isArray(ch.material)) {
        m.multiplyMatrices(inv, ch.matrixWorld);
        const g = ch.geometry.index ? ch.geometry.toNonIndexed() : ch.geometry.clone(); g.applyMatrix4(m);
        if (!g.attributes.normal) g.computeVertexNormals();
        const p = g.attributes.position.array, n = g.attributes.normal.array; c.copy(ch.material.color || c.setHex(0xffffff));
        for (let i = 0; i < p.length; i++) { P.push(p[i]); N.push(n[i]); }
        for (let i = 0; i < p.length / 3; i++) C.push(c.r, c.g, c.b);
        g.dispose(); if (ch.userData.on) on = ch.userData.on; gone.push(ch);
      }
      walk(ch);
    }
  };
  walk(root);
  if (!P.length) return null;
  for (const ch of gone) { ch.parent.remove(ch); if (AIM) { const i = AIM.indexOf(ch); if (i >= 0) AIM.splice(i, 1); } }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  const side = o.double ? THREE.DoubleSide : THREE.FrontSide;
  if (!MATS.has(side)) MATS.set(side, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, side }));
  const mesh = new THREE.Mesh(geo, o.own ? new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true, side }) : MATS.get(side));
  if (on && AIM) { mesh.userData.on = on; AIM.push(mesh); }
  root.add(mesh); return mesh;
}
