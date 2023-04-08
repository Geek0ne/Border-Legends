/**
 * 边境传说 — 打击反馈
 * 命中火花粒子 + 斩击光环 + 相机震动（与任意相机控制器安全叠加）
 */
import * as THREE from 'three';

interface Spark {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

interface Ring {
  mesh: THREE.Mesh;
  life: number;
  maxLife: number;
}

export class CombatFeedback {
  private scene: THREE.Scene;
  private sparks: Spark[] = [];
  private rings: Ring[] = [];
  private sparkGeo = new THREE.TetrahedronGeometry(0.07);
  private sparkMat = new THREE.MeshBasicMaterial({ color: 0xffc857, transparent: true });
  private ringGeo = new THREE.RingGeometry(0.35, 0.55, 24);

  // 相机震动（偏移量对称加减，不与其他控制器打架）
  private shakeTime: number = 0;
  private shakeDuration: number = 0;
  private shakeIntensity: number = 0;
  private appliedOffset: THREE.Vector3 = new THREE.Vector3();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /** 命中反馈：火花四溅 + 斩击光环 + 震屏 */
  public hit(point: THREE.Vector3, intensity: number = 1): void {
    this.spawnSparks(point, intensity);
    this.spawnRing(point, intensity);
    this.addShake(0.22 * intensity, 0.22);
  }

  /** 轻量命中（拾取/格挡等） */
  public spark(point: THREE.Vector3): void {
    this.spawnSparks(point, 0.5);
  }

  private spawnSparks(point: THREE.Vector3, intensity: number): void {
    const count = Math.round(7 + intensity * 8);
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.sparkGeo, this.sparkMat.clone());
      mesh.position.copy(point);
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.color.setHSL(0.09 + Math.random() * 0.06, 0.95, 0.55 + Math.random() * 0.2);
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        Math.random() * 5 + 1.5,
        (Math.random() - 0.5) * 6
      ).multiplyScalar(0.6 + intensity * 0.5);
      const maxLife = 0.28 + Math.random() * 0.22;
      this.scene.add(mesh);
      this.sparks.push({ mesh, velocity, life: 0, maxLife });
    }
  }

  private spawnRing(point: THREE.Vector3, intensity: number): void {
    const mat = new THREE.MeshBasicMaterial({
      color: 0xfff2cc, transparent: true, opacity: 0.85,
      side: THREE.DoubleSide, depthWrite: false,
    });
    const mesh = new THREE.Mesh(this.ringGeo, mat);
    mesh.position.copy(point);
    mesh.position.y += 0.2;
    mesh.rotation.x = -Math.PI / 2;
    mesh.scale.setScalar(0.5 + intensity * 0.4);
    this.scene.add(mesh);
    this.rings.push({ mesh, life: 0, maxLife: 0.22 });
  }

  /** 相机震动：强度衰减的随机偏移 */
  public addShake(intensity: number, duration: number): void {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeDuration = Math.max(this.shakeDuration, duration);
    this.shakeTime = 0;
  }

  /** 每帧驱动（在相机更新之后、渲染之前调用 applyCameraShake） */
  public update(delta: number): void {
    // 火花：重力 + 寿命
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.life += delta;
      if (s.life >= s.maxLife) {
        this.scene.remove(s.mesh);
        (s.mesh.material as THREE.MeshBasicMaterial).dispose();
        this.sparks.splice(i, 1);
        continue;
      }
      s.velocity.y -= 12 * delta;
      s.mesh.position.addScaledVector(s.velocity, delta);
      const k = 1 - s.life / s.maxLife;
      (s.mesh.material as THREE.MeshBasicMaterial).opacity = k;
      s.mesh.scale.setScalar(0.4 + k * 0.8);
    }

    // 光环：扩散 + 淡出
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.life += delta;
      if (r.life >= r.maxLife) {
        this.scene.remove(r.mesh);
        (r.mesh.material as THREE.MeshBasicMaterial).dispose();
        this.rings.splice(i, 1);
        continue;
      }
      const k = r.life / r.maxLife;
      r.mesh.scale.multiplyScalar(1 + delta * 6);
      (r.mesh.material as THREE.MeshBasicMaterial).opacity = 0.85 * (1 - k);
    }
  }

  /** 把震屏偏移施加到相机（每帧渲染前调用一次） */
  public applyCameraShake(camera: THREE.PerspectiveCamera, delta: number): void {
    // 先撤销上一帧偏移
    camera.position.sub(this.appliedOffset);
    this.appliedOffset.set(0, 0, 0);

    if (this.shakeDuration <= 0) return;

    this.shakeTime += delta;
    const k = Math.max(0, 1 - this.shakeTime / this.shakeDuration);
    if (k <= 0) {
      this.shakeDuration = 0;
      this.shakeIntensity = 0;
      return;
    }
    const amp = this.shakeIntensity * k * k;
    this.appliedOffset.set(
      (Math.random() - 0.5) * 2 * amp,
      (Math.random() - 0.5) * 2 * amp,
      (Math.random() - 0.5) * 2 * amp
    );
    camera.position.add(this.appliedOffset);
  }
}
