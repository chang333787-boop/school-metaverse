// 3인칭 캐릭터 (이동/중력/충돌/걷기 애니메이션)
import * as THREE from 'three';
import { faceTexture } from './textures.js';

const UP = new THREE.Vector3(0, 1, 0);
const DOWN = new THREE.Vector3(0, -1, 0);

export class Player {
  constructor(scene, world) {
    this.world = world;
    this.group = new THREE.Group();
    scene.add(this.group);

    const skin = new THREE.MeshLambertMaterial({ color: 0xf6cfa4 });
    const shirt = new THREE.MeshLambertMaterial({ color: 0x4a90d9 });
    const pants = new THREE.MeshLambertMaterial({ color: 0x2f3e5c });
    const hair = new THREE.MeshLambertMaterial({ color: 0x3a2e28 });

    // 다리 (골반 피벗)
    this.legL = this._pivot(0.11, 0.5);
    this.legR = this._pivot(-0.11, 0.5);
    [this.legL, this.legR].forEach(p => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.5, 0.2), pants);
      leg.position.y = -0.25;
      p.add(leg);
      this.group.add(p);
    });
    // 몸통
    this.body = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.55, 0.3), shirt);
    this.body.position.y = 0.775;
    this.group.add(this.body);
    // 팔 (어깨 피벗)
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
    // 머리 (앞면에만 얼굴 텍스처)
    const faceMat = new THREE.MeshLambertMaterial({ map: faceTexture() });
    const headMats = [skin, skin, skin, skin, faceMat, skin]; // +x,-x,+y,-y,+z,-z
    this.head = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.52, 0.5), headMats);
    this.head.position.y = 1.36;
    this.group.add(this.head);
    const hairTop = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.16, 0.54), hair);
    hairTop.position.y = 1.66;
    this.group.add(hairTop);
    const hairBack = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.14), hair);
    hairBack.position.set(0, 1.44, -0.22);
    this.group.add(hairBack);

    // 동그란 그림자
    this.shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.42, 20),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22 })
    );
    this.shadow.rotation.x = -Math.PI / 2;
    scene.add(this.shadow);

    this.pos = new THREE.Vector3().copy(world.spawn);
    this.yaw = Math.PI;       // 처음엔 학교(북쪽)를 바라봄
    this.vy = 0;
    this.airborne = false;
    this.phase = 0;
    this.groundY = 0;
    this.ray = new THREE.Raycaster();
    this.ray.far = 45;
    this._rayObjs = world.walkables.concat(world.colliders);
    // 충돌 박스 미리 계산 (정적 월드)
    this._boxes = world.colliders.map(m => {
      const b = new THREE.Box3().setFromObject(m);
      return { minX: b.min.x, maxX: b.max.x, minY: b.min.y, maxY: b.max.y, minZ: b.min.z, maxZ: b.max.z };
    });
    this._syncMesh();
  }

  _pivot(x, y) {
    const g = new THREE.Group();
    g.position.set(x, y, 0);
    return g;
  }

  _blockedAt(px, pz, py) {
    const r = 0.34;
    const y0 = py + 0.28, y1 = py + 1.55;
    for (const b of this._boxes) {
      if (px > b.minX - r && px < b.maxX + r &&
          pz > b.minZ - r && pz < b.maxZ + r &&
          b.minY < y1 && b.maxY > y0) return true;
    }
    return false;
  }

  _groundAt(px, py, pz) {
    this.ray.set(new THREE.Vector3(px, py + 1.7, pz), DOWN);
    const hits = this.ray.intersectObjects(this._rayObjs, false);
    return hits.length ? hits[0].point.y : -100;
  }

  update(dt, keys, camYaw) {
    const p = this.pos;
    // 입력 → 카메라 기준 이동 방향
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
      const dx = mx * speed * dt, dz = mz * speed * dt;
      if (!this._blockedAt(p.x + dx, p.z, p.y)) p.x += dx;
      if (!this._blockedAt(p.x, p.z + dz, p.y)) p.z += dz;
      const target = Math.atan2(mx, mz);
      let diff = target - this.yaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.yaw += diff * Math.min(1, dt * 14);
      this.phase += dt * speed * 2.4;
    } else {
      this.phase *= Math.max(0, 1 - dt * 10);
    }

    // 바닥/중력/점프
    const gY = this._groundAt(p.x, p.y, p.z);
    this.groundY = gY;
    if (!this.airborne) {
      if ((keys.has('Space')) && gY > -50) {
        this.vy = 5.2;
        this.airborne = true;
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
        this.vy = 0;
        this.airborne = false;
      }
      if (p.y < -20) { // 안전망
        p.set(0, 0, 38);
        this.vy = 0; this.airborne = false;
      }
    }

    // 애니메이션 (걷기/달리기 모션 구분)
    const runAnim = moving && run && !this.airborne;
    const amp = runAnim ? 0.98 : 0.6;
    const sw = Math.sin(this.phase) * Math.min(1, this.phase === 0 ? 0 : 1) * amp;
    this.legL.rotation.x = sw;
    this.legR.rotation.x = -sw;
    this.armL.rotation.x = -sw * (runAnim ? 1.05 : 0.85);
    this.armR.rotation.x = sw * (runAnim ? 1.05 : 0.85);
    this.body.rotation.x = runAnim ? 0.14 : 0;   // 달릴 땐 몸을 살짝 숙임
    if (this.airborne) {
      // 점프 자세 고정: 다리가 허공에서 허우적대던 버그 픽스
      this.armL.rotation.x = -2.6;
      this.armR.rotation.x = -2.6;
      this.legL.rotation.x = -0.55;
      this.legR.rotation.x = 0.35;
      this.body.rotation.x = 0;
    }
    this._syncMesh();
  }

  _syncMesh() {
    this.group.position.copy(this.pos);
    this.group.rotation.y = this.yaw;
    const bob = this.airborne ? 0 : Math.abs(Math.sin(this.phase)) * 0.05;
    this.group.position.y = this.pos.y + bob;
    this.shadow.position.set(this.pos.x, Math.max(this.groundY, -0.5) + 0.03, this.pos.z);
    const spread = Math.min(1.6, Math.max(0.5, 1 + (this.pos.y - this.groundY) * 0.15));
    this.shadow.scale.setScalar(1 / spread);
  }
}
