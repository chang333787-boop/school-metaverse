// 3인칭 캐릭터 (이동/중력/충돌/걷기 애니메이션)
// v0.7: 무릎 관절(앉기 자세), 8m 격자 조회(성능), 끼임 자동감지+기록
import * as THREE from 'three';
import { faceTexture } from './textures.js';

const DOWN = new THREE.Vector3(0, -1, 0);
const _origin = new THREE.Vector3();   // 매 프레임 할당 금지 — 스크래치 재사용

export class Player {
  constructor(scene, world) {
    this.world = world;
    this.group = new THREE.Group();
    scene.add(this.group);

    const skin = new THREE.MeshLambertMaterial({ color: 0xf6cfa4 });
    this.shirtMat = new THREE.MeshLambertMaterial({ color: 0x4a90d9 });
    const shirt = this.shirtMat;
    const pants = new THREE.MeshLambertMaterial({ color: 0x2f3e5c });
    const hair = new THREE.MeshLambertMaterial({ color: 0x3a2e28 });

    // 다리: 허벅지(골반 피벗) + 정강이(무릎 피벗) — 앉을 때 접힘
    const makeLeg = (x) => {
      const hip = this._pivot(x, 0.5);
      const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.27, 0.2), pants);
      thigh.position.y = -0.135;
      hip.add(thigh);
      const knee = this._pivot(0, -0.27);
      const shin = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.25, 0.18), pants);
      shin.position.y = -0.125;
      knee.add(shin);
      hip.add(knee);
      this.group.add(hip);
      return { hip, knee };
    };
    const L = makeLeg(0.11), R = makeLeg(-0.11);
    this.legL = L.hip; this.kneeL = L.knee;
    this.legR = R.hip; this.kneeR = R.knee;

    this.body = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.55, 0.3), shirt);
    this.body.position.y = 0.775;
    this.group.add(this.body);
    this.armL = this._pivot(0.33, 1.0);
    this.armR = this._pivot(-0.33, 1.0);
    [this.armL, this.armR].forEach(p => {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.48, 0.16), shirt);
      arm.position.y = -0.24;
      const hand = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.16), skin);
      hand.position.y = -0.5;
      p.add(arm); p.add(hand);
      this.group.add(p);
    });
    const faceMat = new THREE.MeshLambertMaterial({ map: faceTexture() });
    const headMats = [skin, skin, skin, skin, faceMat, skin];
    this.head = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.52, 0.5), headMats);
    this.head.position.y = 1.36;
    this.group.add(this.head);
    const hairTop = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.16, 0.54), hair);
    hairTop.position.y = 1.66;
    this.group.add(hairTop);
    const hairBack = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.14), hair);
    hairBack.position.set(0, 1.44, -0.22);
    this.group.add(hairBack);
    // 여자 캐릭터 선택 시 보이는 긴 머리
    this.girlHair = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.62, 0.14), hair);
    this.girlHair.position.set(0, 1.22, -0.28);
    this.girlHair.visible = false;
    this.group.add(this.girlHair);

    this.shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.42, 20),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22 })
    );
    this.shadow.rotation.x = -Math.PI / 2;
    scene.add(this.shadow);

    this.pos = new THREE.Vector3().copy(world.spawn);
    this.yaw = Math.PI;
    this.vy = 0;
    this.airborne = false;
    this.phase = 0;
    this.groundY = 0;
    this.sitting = null;
    this.speedK = 0;    // 가속 램프 (0→1)
    this.squash = 0;    // 착지 찌그러짐 / 점프 스트레치
    this.lean = 0;      // 코너 기울임
    this.ray = new THREE.Raycaster();
    this.ray.far = 45;
    // 격자 캐시 (셀이 바뀔 때만 후보 갱신)
    this._cellKey = null;
    this._nearRay = [];
    this._nearBoxes = [];
    this._nearSolid = [];
    // 끼임 감지
    this._stillT = 0;
    this._refreshNear();
    this._syncMesh();
  }

  applyLook(girl, shirtColor) {
    this.shirtMat.color.set(shirtColor);
    this.girlHair.visible = !!girl;
  }

  _pivot(x, y) {
    const g = new THREE.Group();
    g.position.set(x, y, 0);
    return g;
  }

  _refreshNear() {
    const CELL = this.world.CELL;
    const cx = Math.floor(this.pos.x / CELL), cz = Math.floor(this.pos.z / CELL);
    const key = cx + ':' + cz;
    if (key === this._cellKey) return;
    this._cellKey = key;
    this._nearRay.length = 0;
    this._nearBoxes.length = 0;
    this._nearSolid.length = 0;
    const seen = new Set();
    const seenRay = new Set();   // 병합 청크 메시는 여러 엔트리가 공유 — 레이 목록엔 1번만
    const seenSolid = new Set();
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const arr = this.world.grid.get((cx + dx) + ':' + (cz + dz));
        if (!arr) continue;
        for (const e of arr) {
          if (seen.has(e)) continue;
          seen.add(e);
          if (!seenRay.has(e.m)) {
            seenRay.add(e.m);
            this._nearRay.push(e.m);
          }
          if (e.solid) {
            this._nearBoxes.push(e.aabb);
            if (!seenSolid.has(e.m)) {
              seenSolid.add(e.m);
              this._nearSolid.push(e.m);
            }
          }
        }
      }
    }
  }

  _blockedAt(px, pz, py, r = 0.32) {
    // 낮은 턱(0.55m 이하)은 밟고 올라감 — 계단·이랑·무대단
    const y0 = py + 0.55, y1 = py + 1.55;
    for (const b of this._nearBoxes) {
      if (px > b.minX - r && px < b.maxX + r &&
          pz > b.minZ - r && pz < b.maxZ + r &&
          b.minY < y1 && b.maxY > y0) return true;
    }
    for (const d of this.world.doors) {
      if (d.open) continue;
      const b = d.aabb;
      if (px > b.minX - r && px < b.maxX + r &&
          pz > b.minZ - r && pz < b.maxZ + r &&
          b.minY < y1 && b.maxY > y0) return true;
    }
    return false;
  }

  _groundAt(px, py, pz) {
    _origin.set(px, py + 1.7, pz);
    this.ray.set(_origin, DOWN);
    const hits = this.ray.intersectObjects(this._nearRay, false);
    return hits.length ? hits[0].point.y : -100;
  }

  sit(chair) {
    this.sitting = chair;
    this.pos.set(chair.x, chair.y + 0.12, chair.z);
    this.yaw = chair.yaw;
    this.vy = 0;
    this.airborne = false;
  }

  escapeTo(pt) {
    this.pos.set(pt.x, pt.y, pt.z);
    this.vy = 0;
    this.airborne = false;
    this.sitting = null;
    this._cellKey = null;
    this._refreshNear();
  }

  update(dt, keys, camYaw) {
    const p = this.pos;
    // 앉아있는 동안: 이동키를 누르면 의자 뒤(동쪽)로 일어남
    if (this.sitting) {
      const wantMove = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].some(k => keys.has(k));
      if (wantMove) {
        const ch = this.sitting;
        this.sitting = null;
        this.pos.set(ch.x + 0.7, ch.y, ch.z);
      } else {
        this.legL.rotation.x = -1.5; this.kneeL.rotation.x = 1.5;
        this.legR.rotation.x = -1.5; this.kneeR.rotation.x = 1.5;
        this.armL.rotation.x = -0.45;
        this.armR.rotation.x = -0.45;
        this.body.rotation.x = 0;
        this._syncMesh();
        return;
      }
    }
    this._refreshNear();

    let ix = 0, iz = 0;
    if (keys.has('KeyW') || keys.has('ArrowUp')) iz += 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) iz -= 1;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) ix -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) ix += 1;
    const moving = ix !== 0 || iz !== 0;
    const run = keys.has('ShiftLeft') || keys.has('ShiftRight');
    const speed = run ? 6.6 : 4.2;

    if (moving) {
      const fx = -Math.sin(camYaw), fz = -Math.cos(camYaw);
      const rx = -fz, rz = fx;
      let mx = fx * iz + rx * ix, mz = fz * iz + rz * ix;
      const len = Math.hypot(mx, mz);
      mx /= len; mz /= len;
      this.speedK = Math.min(1, this.speedK + dt * 6);
      const eff = speed * (0.35 + 0.65 * this.speedK);
      const dx = mx * eff * dt, dz = mz * eff * dt;
      const x0 = p.x, z0 = p.z;
      if (!this._blockedAt(p.x + dx, p.z, p.y)) p.x += dx;
      else if (!this._blockedAt(p.x + dx, p.z, p.y, 0.2)) p.x += dx;   // 모서리 완화
      if (!this._blockedAt(p.x, p.z + dz, p.y)) p.z += dz;
      else if (!this._blockedAt(p.x, p.z + dz, p.y, 0.2)) p.z += dz;
      const target = Math.atan2(mx, mz);
      let diff = target - this.yaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.yaw += diff * Math.min(1, dt * 14);
      const leanT = Math.max(-0.24, Math.min(0.24, diff * 0.45)) * (run ? 1.25 : 1);
      this.lean += (leanT - this.lean) * Math.min(1, dt * 9);
      this.phase += dt * eff * 2.4;
      // 끼임 자동 감지: 입력이 있는데 제자리면 기록하고 살짝 밀어냄
      if (Math.hypot(p.x - x0, p.z - z0) < 0.005) {
        this._stillT += dt;
        if (this._stillT > 1) {
          this._stillT = 0;
          const diag = window.__sdDiag;
          if (diag) {
            diag.stuck.push([Math.round(p.x * 10) / 10, Math.round(p.y * 10) / 10, Math.round(p.z * 10) / 10]);
            if (diag.stuck.length > 40) diag.stuck.shift();
            try { localStorage.setItem('sd_diag', JSON.stringify(diag)); } catch (e) { /* 무시 */ }
          }
          p.x += (Math.random() - 0.5) * 0.5;
          p.z += (Math.random() - 0.5) * 0.5;
        }
      } else {
        this._stillT = 0;
      }
    } else {
      this.phase *= Math.max(0, 1 - dt * 10);
      this._stillT = 0;
      this.speedK = Math.max(0, this.speedK - dt * 9);
      this.lean *= Math.max(0, 1 - dt * 8);
    }
    this.squash *= Math.max(0, 1 - dt * 8.5);

    const gY = this._groundAt(p.x, p.y, p.z);
    this.groundY = gY;
    if (!this.airborne) {
      if ((keys.has('Space')) && gY > -50) {
        this.vy = 5.2;
        this.airborne = true;
        this.squash = -0.16;   // 점프 스트레치
        p.y += this.vy * dt;
      } else if (gY > p.y - 1.0 && gY < p.y + 0.7) {
        p.y = gY;
      } else if (gY <= p.y - 1.0) {
        this.airborne = true;
        this.vy = 0;
      }
    }
    if (this.airborne) {
      this.vy -= 13 * dt;
      p.y += this.vy * dt;
      if (this.vy <= 0 && p.y <= gY) {
        p.y = gY;
        this.squash = Math.min(0.3, Math.abs(this.vy) * 0.04);   // 착지 찌그러짐
        this.vy = 0;
        this.airborne = false;
      }
      if (p.y < -20) {
        p.set(0, 0, 38);
        this.vy = 0; this.airborne = false;
        this._cellKey = null;
        this._refreshNear();
      }
    }

    // 애니메이션 (걷기/달리기 구분 + 무릎)
    const runAnim = moving && run && !this.airborne;
    const amp = runAnim ? 0.98 : 0.6;
    const sw = Math.sin(this.phase) * Math.min(1, this.phase === 0 ? 0 : 1) * amp;
    this.legL.rotation.x = sw;
    this.legR.rotation.x = -sw;
    this.kneeL.rotation.x = Math.max(0, -sw) * 0.9;
    this.kneeR.rotation.x = Math.max(0, sw) * 0.9;
    this.armL.rotation.x = -sw * (runAnim ? 1.05 : 0.85);
    this.armR.rotation.x = sw * (runAnim ? 1.05 : 0.85);
    this.body.rotation.x = runAnim ? 0.14 : 0;
    if (this.airborne) {
      this.armL.rotation.x = -2.6;
      this.armR.rotation.x = -2.6;
      this.legL.rotation.x = -0.55; this.kneeL.rotation.x = 0.9;
      this.legR.rotation.x = 0.35; this.kneeR.rotation.x = 0.5;
      this.body.rotation.x = 0;
    }
    this._syncMesh();
  }

  _syncMesh() {
    this.group.position.copy(this.pos);
    this.group.rotation.y = this.yaw;
    this.group.rotation.z = this.lean;
    const sq = this.squash;
    this.group.scale.set(1 + sq * 0.5, 1 - sq, 1 + sq * 0.5);
    const bob = (this.airborne || this.sitting) ? 0 : Math.abs(Math.sin(this.phase)) * 0.05;
    this.group.position.y = this.pos.y + bob;
    this.shadow.position.set(this.pos.x, Math.max(this.groundY, -0.5) + 0.03, this.pos.z);
    const spread = Math.min(1.6, Math.max(0.5, 1 + (this.pos.y - this.groundY) * 0.15));
    this.shadow.scale.setScalar(1 / spread);
  }
}
