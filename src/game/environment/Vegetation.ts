/**
 * 边境传说 — 植被系统
 * 松树/阔叶树/灌木/花草/风场摆动的草地
 * 所有植被位置通过 terrain.heightAt 贴合地表
 */
import * as THREE from 'three';
import { Noise2D } from './Noise';

export interface VegetationHandle {
  group: THREE.Group;
  /** 每帧驱动风场 */
  update(delta: number): void;
}

/** 共享风场时间 uniform（草叶摆动） */
const windUniform = { value: 0 };

/** 不规则岩石（噪声形变的十二面体） */
export function createBoulder(size: number, noise: Noise2D, seed: number): THREE.Mesh {
  const geo = new THREE.DodecahedronGeometry(size, 1);
  const p = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const k = 1 + noise.noise(p.getX(i) * 0.9 + seed, p.getZ(i) * 0.9 - seed) * 0.32;
    p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * 0.82, p.getZ(i) * k);
  }
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({
    color: 0x8a8478, roughness: 0.95, metalness: 0.04, flatShading: true,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** 松树：弯曲树干 + 三层不规则树冠 + 零星高光色差 */
function createPine(scale: number): THREE.Group {
  const g = new THREE.Group();

  const trunkGeo = new THREE.CylinderGeometry(0.16 * scale, 0.34 * scale, 3.4 * scale, 7);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2c, roughness: 0.95, flatShading: true });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 1.7 * scale;
  trunk.castShadow = true;
  g.add(trunk);

  const hues = [0.32, 0.34, 0.30];
  for (let i = 0; i < 3; i++) {
    const radius = (1.85 - i * 0.48) * scale;
    const h = 2.3 * scale;
    const geo = new THREE.ConeGeometry(radius, h, 8, 2);
    // 轻微形变，去掉"完美圆锥"感
    const p = geo.attributes.position as THREE.BufferAttribute;
    for (let v = 0; v < p.count; v++) {
      const k = 1 + Math.sin(v * 12.9898 + i * 78.233) * 0.07;
      p.setX(v, p.getX(v) * k);
      p.setZ(v, p.getZ(v) * k);
    }
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(hues[i], 0.52, 0.22 + i * 0.035),
      roughness: 0.88, flatShading: true,
    });
    const cone = new THREE.Mesh(geo, mat);
    cone.position.y = (3.1 + i * 1.35) * scale;
    cone.castShadow = true;
    g.add(cone);
  }
  return g;
}

/** 阔叶树：弯曲树干 + 团状树冠（多个不规则球） */
function createLeafyTree(scale: number): THREE.Group {
  const g = new THREE.Group();

  const trunkGeo = new THREE.CylinderGeometry(0.18 * scale, 0.42 * scale, 3.8 * scale, 7);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x7a5230, roughness: 0.95, flatShading: true });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 1.9 * scale;
  trunk.rotation.z = 0.06;
  trunk.castShadow = true;
  g.add(trunk);

  const blobs = 5;
  for (let i = 0; i < blobs; i++) {
    const r = (1.15 + Math.sin(i * 4.7) * 0.35) * scale;
    const geo = new THREE.IcosahedronGeometry(r, 1);
    const p = geo.attributes.position as THREE.BufferAttribute;
    for (let v = 0; v < p.count; v++) {
      const k = 1 + Math.sin(v * 7.13 + i * 3.1) * 0.16;
      p.setXYZ(v, p.getX(v) * k, p.getY(v) * k * 0.85, p.getZ(v) * k);
    }
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(0.27 + (i % 3) * 0.015, 0.55, 0.26 + (i % 2) * 0.05),
      roughness: 0.9, flatShading: true,
    });
    const blob = new THREE.Mesh(geo, mat);
    const a = (i / blobs) * Math.PI * 2;
    blob.position.set(Math.cos(a) * 0.9 * scale, (4.1 + Math.sin(i * 2.2) * 0.55) * scale, Math.sin(a) * 0.9 * scale);
    blob.castShadow = true;
    g.add(blob);
  }
  return g;
}

/** 灌木：两三个小团 */
function createBush(scale: number): THREE.Group {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const geo = new THREE.IcosahedronGeometry((0.45 + i * 0.12) * scale, 1);
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(0.3 + i * 0.012, 0.5, 0.24 + i * 0.03),
      roughness: 0.92, flatShading: true,
    });
    const blob = new THREE.Mesh(geo, mat);
    blob.position.set((Math.random() - 0.5) * 0.6 * scale, 0.32 * scale + i * 0.1, (Math.random() - 0.5) * 0.6 * scale);
    blob.scale.y = 0.72;
    blob.castShadow = true;
    g.add(blob);
  }
  return g;
}

/** 草地：实例化草叶 + 顶点风摆 */
function createGrassField(heightAt: (x: number, z: number) => number, area: number): THREE.InstancedMesh {
  const blade = new THREE.BufferGeometry();
  // 两片细长三角形构成一根草叶（十字交叉，任意角度都可见）
  const verts = new Float32Array([
    -0.045, 0, 0, 0.045, 0, 0, 0, 1, 0,
    0, 0, -0.045, 0, 0, 0.045, 0, 1, 0,
  ]);
  blade.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  blade.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    color: 0x69a34e,
    side: THREE.DoubleSide,
    roughness: 1,
  });

  // 风摆：按世界位置相位 + 高度加权
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = windUniform;
    shader.vertexShader = `uniform float uTime;\n${shader.vertexShader}`.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
       #ifdef USE_INSTANCING
       vec4 wpos = instanceMatrix * vec4(transformed, 1.0);
       float sway = sin(uTime * 1.7 + wpos.x * 0.22 + wpos.z * 0.27) * 0.22 * max(transformed.y, 0.0);
       transformed.x += sway;
       transformed.z += sway * 0.6;
       #endif`
    );
  };

  const count = 4200;
  const grass = new THREE.InstancedMesh(blade, mat, count);
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  let placed = 0;
  let guard = 0;
  while (placed < count && guard < count * 3) {
    guard++;
    const x = (Math.random() - 0.5) * area;
    const z = (Math.random() - 0.5) * area;
    const y = heightAt(x, z);
    if (y > 6.5) continue; // 高处不长草（留给岩石/雪）
    dummy.position.set(x, y, z);
    dummy.rotation.y = Math.random() * Math.PI * 2;
    const s = 0.7 + Math.random() * 0.9;
    dummy.scale.set(s, s * (0.8 + Math.random() * 0.8), s);
    dummy.updateMatrix();
    grass.setMatrixAt(placed, dummy.matrix);
    color.setHSL(0.26 + Math.random() * 0.06, 0.5 + Math.random() * 0.15, 0.3 + Math.random() * 0.14);
    grass.setColorAt(placed, color);
    placed++;
  }
  grass.count = placed;
  grass.castShadow = false;
  grass.receiveShadow = true;
  return grass;
}

/** 花草点缀 */
function createFlowers(heightAt: (x: number, z: number) => number, area: number): THREE.Group {
  const g = new THREE.Group();
  const colors = [0xe85d75, 0xf2c14e, 0xb388eb, 0xff8c42, 0xffffff];
  for (let i = 0; i < 120; i++) {
    const x = (Math.random() - 0.5) * area;
    const z = (Math.random() - 0.5) * area;
    const y = heightAt(x, z);
    if (y > 5) continue;
    const stemGeo = new THREE.CylinderGeometry(0.015, 0.02, 0.32, 4);
    const stem = new THREE.Mesh(stemGeo, new THREE.MeshStandardMaterial({ color: 0x3f7a3c, roughness: 1 }));
    const headGeo = new THREE.SphereGeometry(0.075, 6, 5);
    const head = new THREE.Mesh(headGeo, new THREE.MeshStandardMaterial({
      color: colors[i % colors.length], roughness: 0.7,
    }));
    const flower = new THREE.Group();
    stem.position.y = 0.16;
    head.position.y = 0.34;
    flower.add(stem, head);
    flower.position.set(x, y, z);
    flower.rotation.y = Math.random() * Math.PI * 2;
    g.add(flower);
  }
  return g;
}

/**
 * 撒植被：松树/阔叶树/灌木/草/花，全部贴合地形
 */
export function scatterVegetation(
  scene: THREE.Scene,
  heightAt: (x: number, z: number) => number,
  seed: number = 7
): VegetationHandle {
  const group = new THREE.Group();
  const noise = new Noise2D(seed);
  const area = 200;

  // 树木（避开中心出生点）
  for (let i = 0; i < 90; i++) {
    const x = (Math.random() - 0.5) * area;
    const z = (Math.random() - 0.5) * area;
    if (Math.sqrt(x * x + z * z) < 12) continue;
    const y = heightAt(x, z);
    if (y > 8.5) continue; // 高处不长树
    const scale = 0.75 + Math.random() * 0.85;
    const tree = Math.random() < 0.55 ? createPine(scale) : createLeafyTree(scale);
    tree.position.set(x, y - 0.05, z);
    tree.rotation.y = Math.random() * Math.PI * 2;
    group.add(tree);
  }

  // 灌木
  for (let i = 0; i < 45; i++) {
    const x = (Math.random() - 0.5) * area;
    const z = (Math.random() - 0.5) * area;
    if (Math.sqrt(x * x + z * z) < 9) continue;
    const y = heightAt(x, z);
    if (y > 7) continue;
    const bush = createBush(0.8 + Math.random() * 0.9);
    bush.position.set(x, y, z);
    group.add(bush);
  }

  group.add(createGrassField(heightAt, area * 0.92));
  group.add(createFlowers(heightAt, area * 0.7));

  scene.add(group);
  return {
    group,
    update(delta: number): void {
      windUniform.value += delta;
    },
  };
}
