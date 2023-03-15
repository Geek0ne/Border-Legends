/**
 * 边境传说 — 地形系统
 * FBM 噪声起伏 + 顶点着色（草/岩/雪按高度与坡度混合）
 * 提供 heightAt() 供植被、岩石、角色落点采样
 */
import * as THREE from 'three';
import { Noise2D } from './Noise';

export class Terrain {
  public readonly mesh: THREE.Mesh;
  private noise: Noise2D;

  constructor(size: number = 260, segments: number = 128, seed: number = 1337) {
    this.noise = new Noise2D(seed);

    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);

    // ====== 起伏 ======
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, this.heightAt(x, z));
    }
    geo.computeVertexNormals();

    // ====== 顶点着色：草 → 岩 → 雪 ======
    const colors = new Float32Array(pos.count * 3);
    const normals = geo.attributes.normal as THREE.BufferAttribute;
    const grassLow = new THREE.Color('#3f7a3c');
    const grassHigh = new THREE.Color('#5c9450');
    const rockCol = new THREE.Color('#7d7468');
    const snowCol = new THREE.Color('#e8eef2');
    const dirtCol = new THREE.Color('#7a6a4f');
    const tmp = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const slope = 1 - normals.getY(i); // 0 平坦 → 1 峭壁

      // 基础草色随高度变浅，混一点泥土色制造斑驳
      const t = THREE.MathUtils.clamp((y + 4) / 12, 0, 1);
      tmp.copy(grassLow).lerp(grassHigh, t);
      const patch = this.noise.noise(pos.getX(i) * 0.08, pos.getZ(i) * 0.08) * 0.5 + 0.5;
      tmp.lerp(dirtCol, patch * 0.28);

      // 陡坡露岩
      tmp.lerp(rockCol, THREE.MathUtils.smoothstep(slope, 0.18, 0.55));
      // 高处积雪
      tmp.lerp(snowCol, THREE.MathUtils.smoothstep(y, 7.5, 11));

      colors[i * 3] = tmp.r;
      colors[i * 3 + 1] = tmp.g;
      colors[i * 3 + 2] = tmp.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.95,
      metalness: 0.0,
    });

    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.receiveShadow = true;
    this.mesh.position.y = 0;
  }

  /**
   * 地形高度采样（与生成时完全一致的公式）
   * 中心活动区压平，远处起伏加大
   */
  public heightAt(x: number, z: number): number {
    const rolling = this.noise.fbm(x * 0.013, z * 0.013, 4) * 7.0;
    const detail = this.noise.fbm(x * 0.06 + 31.7, z * 0.06 + 11.3, 2) * 1.1;
    const dist = Math.sqrt(x * x + z * z);
    const flat = THREE.MathUtils.smoothstep(dist, 16, 60); // 0=中心平地 1=野外
    return (rolling + detail) * (0.12 + 0.88 * flat);
  }
}
