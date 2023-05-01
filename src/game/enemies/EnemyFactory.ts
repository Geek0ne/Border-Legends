/**
 * 边境传说 — 敌人工厂与生成器
 * 六种程序化怪物模型（骷髅/灰狼/史莱姆/食尸鬼/骷髅骑士/狼王）
 * 波次刷新：维持场上敌人数量，自动补怪、贴地放置、待机动画
 */
import * as THREE from 'three';
import { EnemyDef } from '../../types';
import {
  SKELETON_DEF, WOLF_DEF, SLIME_DEF, GHOUL_DEF,
  ELITE_SKELETON_KNIGHT_DEF, WOLF_ALPHA_DEF,
} from '../../data/enemies/EnemyDefs';
import { EnemyManager, EnemyInstance } from './EnemyManager';

const M = {
  bone: new THREE.MeshStandardMaterial({ color: 0xe6e0cf, roughness: 0.85, flatShading: true }),
  rust: new THREE.MeshStandardMaterial({ color: 0x8a5a3a, roughness: 0.8, metalness: 0.4, flatShading: true }),
  darkArmor: new THREE.MeshStandardMaterial({ color: 0x3a3f4a, roughness: 0.5, metalness: 0.65, flatShading: true }),
  fur: new THREE.MeshStandardMaterial({ color: 0x6b6258, roughness: 0.95, flatShading: true }),
  furDark: new THREE.MeshStandardMaterial({ color: 0x4a4038, roughness: 0.95, flatShading: true }),
  slime: new THREE.MeshStandardMaterial({
    color: 0x4dbf6a, roughness: 0.25, metalness: 0.1,
    transparent: true, opacity: 0.82, flatShading: true,
  }),
  ghoulSkin: new THREE.MeshStandardMaterial({ color: 0x7a6a88, roughness: 0.9, flatShading: true }),
  eyeRed: new THREE.MeshStandardMaterial({ color: 0xff3b30, emissive: 0xff2211, emissiveIntensity: 0.7 }),
  eyeDark: new THREE.MeshStandardMaterial({ color: 0x1a1a22, roughness: 0.4 }),
};

function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

/** 骷髅兵 */
function buildSkeleton(): THREE.Group {
  const g = new THREE.Group();
  // 脊柱 + 肋骨
  g.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.62, 6), M.bone, 0, 1.02, 0));
  for (let i = 0; i < 4; i++) {
    const rib = mesh(new THREE.TorusGeometry(0.17 - i * 0.012, 0.022, 5, 10), M.bone, 0, 0.86 + i * 0.11, 0);
    rib.rotation.x = Math.PI / 2;
    rib.scale.z = 0.72;
    g.add(rib);
  }
  // 骨盆
  g.add(mesh(new THREE.BoxGeometry(0.26, 0.1, 0.14), M.bone, 0, 0.66, 0));
  // 头骨 + 眼窝
  const skull = mesh(new THREE.SphereGeometry(0.155, 8, 7), M.bone, 0, 1.47, 0.01);
  skull.scale.set(0.92, 1.05, 1);
  g.add(skull);
  g.add(mesh(new THREE.BoxGeometry(0.1, 0.05, 0.06), M.bone, 0, 1.36, 0.11)); // 下巴
  for (const sx of [-1, 1]) {
    g.add(mesh(new THREE.SphereGeometry(0.038, 6, 5), M.eyeDark, sx * 0.062, 1.49, 0.125));
  }
  // 四肢（细骨）
  for (const sx of [-1, 1]) {
    const arm = mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.52, 5), M.bone, sx * 0.24, 1.0, 0);
    arm.rotation.z = sx * 0.18;
    g.add(arm);
    const leg = mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.62, 5), M.bone, sx * 0.1, 0.33, 0);
    g.add(leg);
  }
  // 锈剑
  const sword = new THREE.Group();
  sword.add(mesh(new THREE.BoxGeometry(0.045, 0.5, 0.012), M.rust, 0, -0.26, 0));
  sword.add(mesh(new THREE.BoxGeometry(0.12, 0.025, 0.035), M.rust, 0, -0.01, 0));
  sword.position.set(0.38, 0.9, 0.1);
  sword.rotation.z = -0.5;
  g.add(sword);
  return g;
}

/** 灰狼 / 狼王 */
function buildWolf(alpha: boolean = false): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = alpha ? M.furDark : M.fur;
  const scale = alpha ? 1.35 : 1;
  // 躯干
  const body = mesh(new THREE.CapsuleGeometry(0.26, 0.62, 4, 8), bodyMat, 0, 0.55, 0);
  body.rotation.x = Math.PI / 2;
  g.add(body);
  // 头 + 吻部 + 耳朵
  const head = mesh(new THREE.BoxGeometry(0.26, 0.24, 0.3), bodyMat, 0, 0.68, 0.56);
  g.add(head);
  g.add(mesh(new THREE.BoxGeometry(0.13, 0.12, 0.22), bodyMat, 0, 0.62, 0.78));
  for (const sx of [-1, 1]) {
    const ear = mesh(new THREE.ConeGeometry(0.06, 0.14, 4), bodyMat, sx * 0.1, 0.86, 0.5);
    g.add(ear);
    g.add(mesh(new THREE.SphereGeometry(0.032, 6, 5), alpha ? M.eyeRed : M.eyeDark, sx * 0.085, 0.72, 0.7));
  }
  // 四腿
  for (const sx of [-1, 1]) {
    for (const fz of [0.3, -0.32]) {
      const leg = mesh(new THREE.CylinderGeometry(0.052, 0.042, 0.5, 5), bodyMat, sx * 0.18, 0.25, fz);
      g.add(leg);
    }
  }
  // 尾巴
  const tail = mesh(new THREE.CylinderGeometry(0.045, 0.015, 0.42, 5), bodyMat, 0, 0.68, -0.62);
  tail.rotation.x = -0.9;
  g.add(tail);
  g.scale.setScalar(scale);
  return g;
}

/** 史莱姆 */
function buildSlime(): THREE.Group {
  const g = new THREE.Group();
  const blob = mesh(new THREE.SphereGeometry(0.42, 12, 9), M.slime, 0, 0.36, 0);
  blob.scale.y = 0.78;
  g.add(blob);
  // 高光斑 + 眼睛
  g.add(mesh(new THREE.SphereGeometry(0.12, 6, 5), M.slime, -0.13, 0.55, 0.22));
  for (const sx of [-1, 1]) {
    g.add(mesh(new THREE.SphereGeometry(0.05, 6, 5), M.eyeDark, sx * 0.13, 0.42, 0.36));
  }
  return g;
}

/** 食尸鬼（佝偻人形） */
function buildGhoul(): THREE.Group {
  const g = new THREE.Group();
  // 佝偻躯干
  const torso = mesh(new THREE.CapsuleGeometry(0.2, 0.42, 4, 8), M.ghoulSkin, 0, 1.02, 0.06);
  torso.rotation.x = 0.42;
  g.add(torso);
  // 头（前伸）
  const head = mesh(new THREE.SphereGeometry(0.16, 8, 7), M.ghoulSkin, 0, 1.32, 0.3);
  head.scale.set(0.9, 1, 1.1);
  g.add(head);
  for (const sx of [-1, 1]) {
    g.add(mesh(new THREE.SphereGeometry(0.036, 6, 5), M.eyeRed, sx * 0.065, 1.35, 0.43));
  }
  // 长臂垂地 + 爪
  for (const sx of [-1, 1]) {
    const arm = mesh(new THREE.CylinderGeometry(0.045, 0.038, 0.72, 6), M.ghoulSkin, sx * 0.26, 0.78, 0.16);
    arm.rotation.x = 0.28;
    g.add(arm);
    for (let c = 0; c < 3; c++) {
      const claw = mesh(new THREE.ConeGeometry(0.016, 0.1, 4), M.bone, sx * 0.26 + (c - 1) * 0.035, 0.42, 0.3);
      claw.rotation.x = Math.PI;
      g.add(claw);
    }
    const leg = mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.56, 6), M.ghoulSkin, sx * 0.11, 0.28, -0.04);
    g.add(leg);
  }
  return g;
}

/** 骷髅骑士（精英：骨架 + 暗甲 + 大剑） */
function buildSkeletonKnight(): THREE.Group {
  const g = buildSkeleton();
  // 胸甲/肩甲/头盔
  g.add(mesh(new THREE.BoxGeometry(0.34, 0.32, 0.22), M.darkArmor, 0, 1.04, 0));
  for (const sx of [-1, 1]) {
    g.add(mesh(new THREE.SphereGeometry(0.12, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.55), M.darkArmor, sx * 0.26, 1.22, 0));
    g.add(mesh(new THREE.BoxGeometry(0.1, 0.3, 0.1), M.darkArmor, sx * 0.1, 0.32, 0));
  }
  const helm = mesh(new THREE.SphereGeometry(0.175, 8, 7), M.darkArmor, 0, 1.49, 0.01);
  helm.scale.y = 1.12;
  g.add(helm);
  g.add(mesh(new THREE.BoxGeometry(0.045, 0.11, 0.05), M.eyeRed, 0, 1.5, 0.15)); // 目缝红光
  g.scale.setScalar(1.15);
  return g;
}

/** 岩巨人（山地 Boss）：巨岩构成，熔岩裂缝发光 */
function buildRockGiant(): THREE.Group {
  const g = new THREE.Group();
  const rock = new THREE.MeshStandardMaterial({ color: 0x6d675e, roughness: 1, flatShading: true });
  const rockDark = new THREE.MeshStandardMaterial({ color: 0x554f47, roughness: 1, flatShading: true });
  const magma = new THREE.MeshStandardMaterial({
    color: 0xff7733, emissive: 0xff5511, emissiveIntensity: 1.2, roughness: 0.5,
  });
  const moss = new THREE.MeshStandardMaterial({ color: 0x4a7a3c, roughness: 1, flatShading: true });

  const boulder = (r: number, mat: THREE.Material, x: number, y: number, z: number, sy = 1) => {
    const m = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 1), mat);
    const pos = m.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const k = 1 + Math.sin(i * 7.3 + r * 13) * 0.14;
      pos.setXYZ(i, pos.getX(i) * k, pos.getY(i) * k, pos.getZ(i) * k);
    }
    m.geometry.computeVertexNormals();
    m.position.set(x, y, z);
    m.scale.y = sy;
    m.castShadow = true;
    g.add(m);
    return m;
  };

  // 腿
  boulder(0.55, rockDark, -0.62, 0.55, 0, 1.15);
  boulder(0.55, rockDark, 0.62, 0.55, 0, 1.15);
  // 躯干（主岩）
  boulder(1.25, rock, 0, 1.95, 0, 1.1);
  boulder(0.75, rock, -1.15, 2.35, 0);   // 左肩岩
  boulder(0.75, rock, 1.15, 2.35, 0);    // 右肩岩
  // 手臂 + 拳
  boulder(0.5, rock, -1.35, 1.55, 0.1);
  boulder(0.62, rockDark, -1.42, 0.85, 0.22); // 左拳
  boulder(0.5, rock, 1.35, 1.55, 0.1);
  boulder(0.62, rockDark, 1.42, 0.85, 0.22);  // 右拳
  // 头 + 熔岩眼
  boulder(0.55, rock, 0, 3.15, 0.12);
  for (const sx of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), magma);
    eye.position.set(sx * 0.22, 3.22, 0.55);
    g.add(eye);
  }
  // 熔岩裂缝（胸前/手臂）
  const cracks: Array<[number, number, number, number]> = [
    [0, 2.1, 1.18, 0], [-0.55, 1.8, 1.05, 0.6], [0.6, 2.4, 1.0, -0.5],
    [-1.3, 1.6, 0.55, 0.3], [1.35, 1.2, 0.6, -0.3],
  ];
  for (const [x, y, z, rot] of cracks) {
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.55, 0.05), magma);
    c.position.set(x, y, z);
    c.rotation.z = rot;
    g.add(c);
  }
  // 苔藓斑块
  for (let i = 0; i < 4; i++) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.3, 7, 5), moss);
    m.position.set((Math.random() - 0.5) * 2, 1.4 + Math.random() * 1.4, (Math.random() - 0.4) * 1.2);
    m.scale.y = 0.25;
    g.add(m);
  }
  return g;
}

/** 按定义构建怪物模型 */
export function buildEnemyMesh(def: EnemyDef): THREE.Group {
  let g: THREE.Group;
  switch (def.id) {
    case 'wolf': g = buildWolf(false); break;
    case 'wolf_alpha': g = buildWolf(true); break;
    case 'slime': g = buildSlime(); break;
    case 'ghoul': g = buildGhoul(); break;
    case 'skeleton_knight': g = buildSkeletonKnight(); break;
    case 'rock_giant': g = buildRockGiant(); break;
    case 'skeleton':
    default: g = buildSkeleton(); break;
  }
  // 待机动画句柄（呼吸/晃动），由生成器每帧驱动
  const phase = Math.random() * Math.PI * 2;
  g.userData.animate = (t: number) => {
    const bob = Math.sin(t * 2 + phase);
    if (def.id === 'slime') {
      g.scale.y = 0.78 + bob * 0.08;
    } else {
      g.position.y = (g.userData.baseY ?? g.position.y) + bob * 0.025;
    }
  };
  return g;
}

// ==================== 生成器 ====================

const SPAWN_TABLE: Array<{ def: EnemyDef; weight: number }> = [
  { def: SKELETON_DEF, weight: 30 },
  { def: WOLF_DEF, weight: 25 },
  { def: SLIME_DEF, weight: 20 },
  { def: GHOUL_DEF, weight: 15 },
  { def: ELITE_SKELETON_KNIGHT_DEF, weight: 7 },
  { def: WOLF_ALPHA_DEF, weight: 3 },
];

export interface SpawnerOptions {
  targetCount?: number;
  minRadius?: number;
  maxRadius?: number;
  heightAt?: (x: number, z: number) => number;
}

export class EnemySpawner {
  private manager: EnemyManager;
  private scene: THREE.Scene;
  private targetCount: number;
  private minRadius: number;
  private maxRadius: number;
  private heightAt: ((x: number, z: number) => number) | null;
  private spawnTimer: number = 0;
  private clock: number = 0;

  constructor(manager: EnemyManager, scene: THREE.Scene, opts: SpawnerOptions = {}) {
    this.manager = manager;
    this.scene = scene;
    this.targetCount = opts.targetCount ?? 12;
    this.minRadius = opts.minRadius ?? 18;
    this.maxRadius = opts.maxRadius ?? 60;
    this.heightAt = opts.heightAt ?? null;
  }

  /** 每帧：补怪 + 网格同步 + 待机动画 */
  public tick(delta: number, playerPos: { x: number; z: number } | null): void {
    this.clock += delta;
    this.spawnTimer -= delta;

    // 维持数量（每 2.5 秒补一只）
    if (this.spawnTimer <= 0 && this.manager.getAliveEnemies().length < this.targetCount) {
      this.spawnOne(playerPos);
      this.spawnTimer = 2.5;
    }

    // 网格同步 + 待机动画
    for (const e of this.manager.getAliveEnemies()) {
      e.mesh.position.x = e.position.x;
      e.mesh.position.z = e.position.z;
      const anim = e.mesh.userData.animate as ((t: number) => void) | undefined;
      if (anim) anim(this.clock);
    }
  }

  private pickDef(): EnemyDef {
    const total = SPAWN_TABLE.reduce((s, e) => s + e.weight, 0);
    let roll = Math.random() * total;
    for (const entry of SPAWN_TABLE) {
      roll -= entry.weight;
      if (roll <= 0) return entry.def;
    }
    return SKELETON_DEF;
  }

  private spawnOne(playerPos: { x: number; z: number } | null): void {
    const def = this.pickDef();
    this.spawn(def, playerPos);
  }

  /** 指定位置生成（Boss 等） */
  public spawnBoss(def: EnemyDef, x: number, z: number): void {
    this.spawn(def, null, x, z);
  }

  private spawn(def: EnemyDef, playerPos: { x: number; z: number } | null, fixedX?: number, fixedZ?: number): void {
    const mesh = buildEnemyMesh(def);

    // 位置：围绕出生点环带，避开玩家贴脸
    let x = fixedX ?? 0;
    let z = fixedZ ?? 0;
    if (fixedX === undefined || fixedZ === undefined) {
      for (let tries = 0; tries < 8; tries++) {
        const angle = Math.random() * Math.PI * 2;
        const r = this.minRadius + Math.random() * (this.maxRadius - this.minRadius);
        x = Math.cos(angle) * r;
        z = Math.sin(angle) * r;
        if (!playerPos || Math.hypot(x - playerPos.x, z - playerPos.z) > 12) break;
      }
    }

    const y = this.heightAt ? this.heightAt(x, z) : 0;
    mesh.position.set(x, y, z);
    mesh.userData.baseY = y;
    this.scene.add(mesh);
    this.manager.addEnemy(def, mesh, { x, z });
  }
}
