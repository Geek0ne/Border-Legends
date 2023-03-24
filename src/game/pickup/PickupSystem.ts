/**
 * 边境传说 - 拾取器
 * 管理掉落物品的显示、拾取、自动拾取范围
 */

import * as THREE from 'three';
import { Rarity } from "../../types";
import { LootDrop } from "../../types/combat";
import { ITEM_MAP } from '../../data';

const RARITY_COLORS: Record<Rarity, number> = {
  common: 0x888888,
  uncommon: 0x2ecc71,
  rare: 0x3498db,
  epic: 0x9b59b6,
  legendary: 0xf1c40f,
};

export class PickupSystem {
  private pickups: Map<string, { mesh: THREE.Group; drop: LootDrop; bobPhase: number }> = new Map();
  private autoPickupRange: number = 5;
  private onPickup?: (drop: LootDrop) => void;

  public setOnPickup(cb: (drop: LootDrop) => void): void { this.onPickup = cb; }

  public createPickup(drop: LootDrop, scene: THREE.Scene): void {
    const color = RARITY_COLORS[drop.rarity] || 0xffffff;
    const group = new THREE.Group();
    const baseGeom = new THREE.CylinderGeometry(0.3, 0.4, 0.05, 16);
    const baseMat = new THREE.MeshStandardMaterial({
      color, emissive: color, emissiveIntensity: 0.5, transparent: true, opacity: 0.8,
    });
    const base = new THREE.Mesh(baseGeom, baseMat);
    base.position.y = 0.025;
    group.add(base);

    const iconGeom = new THREE.SphereGeometry(0.15, 8, 8);
    const iconMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, emissive: color, emissiveIntensity: 0.8,
    });
    const icon = new THREE.Mesh(iconGeom, iconMat);
    icon.position.y = 0.6;
    group.add(icon);

    group.position.set(drop.droppedAt.x, 0.5, drop.droppedAt.z);
    scene.add(group);
    this.pickups.set(drop.itemId + '_' + drop.timestamp, {
      mesh: group, drop, bobPhase: Math.random() * Math.PI * 2,
    });
  }

  public tick(delta: number): void {
    for (const [, entry] of this.pickups) {
      entry.bobPhase += delta * 3;
      entry.mesh.position.y = 0.5 + Math.sin(entry.bobPhase) * 0.1;
      entry.mesh.rotation.y += delta;
    }
  }

  public checkAutoPickup(playerPos: { x: number; z: number }): void {
    const toRemove: string[] = [];
    for (const [key, entry] of this.pickups) {
      const dx = entry.drop.droppedAt.x - playerPos.x;
      const dz = entry.drop.droppedAt.z - playerPos.z;
      if (Math.sqrt(dx * dx + dz * dz) <= this.autoPickupRange) {
        toRemove.push(key);
        if (this.onPickup) this.onPickup(entry.drop);
        if (entry.mesh.parent) entry.mesh.parent.remove(entry.mesh);
      }
    }
    for (const key of toRemove) this.pickups.delete(key);
  }

  public clear(): void {
    for (const [, entry] of this.pickups) {
      if (entry.mesh.parent) entry.mesh.parent.remove(entry.mesh);
    }
    this.pickups.clear();
  }

  public getSize(): number { return this.pickups.size; }
}

