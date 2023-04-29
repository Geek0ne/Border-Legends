/**
 * 边境传说 — 采集物生成系统
 * 矿石/草药/松果三类采集点：贴地放置、待机浮动、采集后定时重生
 */
import * as THREE from 'three';

export interface Collectible {
  id: number;
  itemId: string;
  name: string;
  mesh: THREE.Group;
  baseY: number;
  respawnTimer: number; // >0 表示已采集，计时重生
}

export interface CollectibleSpawnerOptions {
  count?: number;
  area?: number;
  heightAt?: (x: number, z: number) => number;
  respawnSeconds?: number;
}

interface CollectibleDef {
  itemId: string;
  name: string;
  weight: number;
  build: () => THREE.Group;
}

const crystal = new THREE.MeshStandardMaterial({
  color: 0x66e0ff, emissive: 0x2288cc, emissiveIntensity: 0.6,
  roughness: 0.25, metalness: 0.2, flatShading: true,
});
const ore = new THREE.MeshStandardMaterial({ color: 0x77726a, roughness: 0.95, flatShading: true });
const herbLeaf = new THREE.MeshStandardMaterial({
  color: 0x4fbe5a, emissive: 0x114422, emissiveIntensity: 0.35, roughness: 0.8, flatShading: true,
});
const herbGlow = new THREE.MeshStandardMaterial({
  color: 0xaaffcc, emissive: 0x44ff88, emissiveIntensity: 0.9, roughness: 0.4,
});
const pine = new THREE.MeshStandardMaterial({ color: 0x8a5a32, roughness: 0.9, flatShading: true });

function buildOreVein(): THREE.Group {
  const g = new THREE.Group();
  // 岩基
  for (let i = 0; i < 3; i++) {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22 + Math.random() * 0.12, 0), ore);
    rock.position.set((Math.random() - 0.5) * 0.4, 0.12, (Math.random() - 0.5) * 0.4);
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    rock.castShadow = true;
    g.add(rock);
  }
  // 发光晶簇
  for (let i = 0; i < 4; i++) {
    const shard = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.34 + Math.random() * 0.2, 5), crystal);
    shard.position.set((Math.random() - 0.5) * 0.35, 0.28, (Math.random() - 0.5) * 0.35);
    shard.rotation.set((Math.random() - 0.5) * 0.7, Math.random() * Math.PI, (Math.random() - 0.5) * 0.7);
    shard.castShadow = true;
    g.add(shard);
  }
  return g;
}

function buildHerb(): THREE.Group {
  const g = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.38, 4), herbLeaf);
    const a = (i / 5) * Math.PI * 2;
    leaf.position.set(Math.cos(a) * 0.12, 0.19, Math.sin(a) * 0.12);
    leaf.rotation.set(Math.sin(a) * 0.55, 0, -Math.cos(a) * 0.55);
    leaf.castShadow = true;
    g.add(leaf);
  }
  const glow = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 6), herbGlow);
  glow.position.y = 0.42;
  g.add(glow);
  return g;
}

function buildPineCone(): THREE.Group {
  const g = new THREE.Group();
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.3, 7), pine);
  cone.position.y = 0.15;
  cone.castShadow = true;
  g.add(cone);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.035, 5, 8), pine);
  ring.position.y = 0.13;
  ring.rotation.x = Math.PI / 2;
  g.add(ring);
  return g;
}

const DEFS: CollectibleDef[] = [
  { itemId: 'iron_ore', name: '铁矿石', weight: 35, build: buildOreVein },
  { itemId: 'herb', name: '草药', weight: 40, build: buildHerb },
  { itemId: 'pinecone', name: '松果', weight: 25, build: buildPineCone },
];

export class CollectibleSpawner {
  private scene: THREE.Scene;
  private items: Collectible[] = [];
  private nextId: number = 1;
  private clock: number = 0;
  private heightAt: (x: number, z: number) => number;
  private respawnSeconds: number;

  constructor(scene: THREE.Scene, opts: CollectibleSpawnerOptions = {}) {
    this.scene = scene;
    this.heightAt = opts.heightAt ?? (() => 0);
    this.respawnSeconds = opts.respawnSeconds ?? 30;

    const count = opts.count ?? 18;
    const area = opts.area ?? 120;
    for (let i = 0; i < count; i++) {
      this.spawnOne(area);
    }
  }

  private spawnOne(area: number): void {
    const total = DEFS.reduce((s, d) => s + d.weight, 0);
    let roll = Math.random() * total;
    let def = DEFS[0];
    for (const d of DEFS) {
      roll -= d.weight;
      if (roll <= 0) { def = d; break; }
    }
    const x = (Math.random() - 0.5) * area;
    const z = (Math.random() - 0.5) * area;
    const y = this.heightAt(x, z);
    const mesh = def.build();
    mesh.position.set(x, y, z);
    mesh.rotation.y = Math.random() * Math.PI * 2;
    this.scene.add(mesh);
    this.items.push({
      id: this.nextId++,
      itemId: def.itemId,
      name: def.name,
      mesh,
      baseY: y,
      respawnTimer: 0,
    });
  }

  /** 每帧：浮动动画 + 重生计时 */
  public tick(delta: number): void {
    this.clock += delta;
    for (const item of this.items) {
      if (item.respawnTimer > 0) {
        item.respawnTimer -= delta;
        if (item.respawnTimer <= 0) {
          item.mesh.visible = true;
        }
        continue;
      }
      item.mesh.position.y = item.baseY + Math.sin(this.clock * 1.8 + item.id) * 0.06;
      item.mesh.rotation.y += delta * 0.35;
    }
  }

  /** 找最近的可采集物 */
  public findNearby(pos: { x: number; z: number }, radius: number = 3.2): Collectible | null {
    let best: Collectible | null = null;
    let bestDist = radius;
    for (const item of this.items) {
      if (item.respawnTimer > 0) continue;
      const d = Math.hypot(item.mesh.position.x - pos.x, item.mesh.position.z - pos.z);
      if (d < bestDist) {
        bestDist = d;
        best = item;
      }
    }
    return best;
  }

  /** 采集：隐藏并启动重生计时 */
  public gather(item: Collectible): void {
    item.mesh.visible = false;
    item.respawnTimer = this.respawnSeconds;
  }
}
