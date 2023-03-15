/**
 * 边境传说 — 远景山脉环
 * 噪声形变的锥体山峰 + 雪顶，围在可玩区域之外制造纵深
 */
import * as THREE from 'three';
import { Noise2D } from './Noise';

export function createMountainRing(scene: THREE.Scene, seed: number = 99): THREE.Group {
  const group = new THREE.Group();
  const noise = new Noise2D(seed);

  const rockPalette = ['#5a6472', '#4c5563', '#66717f', '#525b68'];
  const snowColor = new THREE.Color('#dfe8ee');

  const count = 30;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + noise.noise(i * 3.1, 7.7) * 0.12;
    const dist = 175 + (noise.noise(i * 1.7, 2.3) * 0.5 + 0.5) * 130;
    const height = 55 + (noise.noise(i * 2.9, 5.1) * 0.5 + 0.5) * 85;
    const radius = 38 + (noise.noise(i * 1.3, 9.7) * 0.5 + 0.5) * 34;

    const peak = new THREE.Group();

    // 山体：低分段锥体 + 噪声形变（有棱角感）
    const geo = new THREE.ConeGeometry(radius, height, 9, 4);
    const p = geo.attributes.position as THREE.BufferAttribute;
    for (let v = 0; v < p.count; v++) {
      const vx = p.getX(v);
      const vy = p.getY(v);
      const vz = p.getZ(v);
      const jitter = noise.noise(vx * 0.06 + i * 10, vz * 0.06 - i * 4) * radius * 0.16;
      const k = 1 + jitter / Math.max(Math.abs(vx) + Math.abs(vz), 1);
      p.setX(v, vx * k);
      p.setZ(v, vz * k);
      p.setY(v, vy + noise.noise(vx * 0.03, vz * 0.03 + i) * height * 0.06);
    }
    geo.computeVertexNormals();

    const rockMat = new THREE.MeshStandardMaterial({
      color: rockPalette[i % rockPalette.length],
      roughness: 1,
      flatShading: true,
    });
    const body = new THREE.Mesh(geo, rockMat);
    body.position.y = height / 2 - 8;
    peak.add(body);

    // 雪顶：小锥体盖在山顶
    const snowH = height * 0.32;
    const snowGeo = new THREE.ConeGeometry(radius * 0.34, snowH, 9, 1);
    const snowMat = new THREE.MeshStandardMaterial({
      color: snowColor, roughness: 0.85, flatShading: true,
    });
    const snow = new THREE.Mesh(snowGeo, snowMat);
    snow.position.y = height - 8 - snowH * 0.42;
    peak.add(snow);

    peak.position.set(Math.cos(angle) * dist, -6, Math.sin(angle) * dist);
    peak.rotation.y = Math.random() * Math.PI * 2;
    group.add(peak);
  }

  scene.add(group);
  return group;
}
