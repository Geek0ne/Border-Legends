import * as THREE from 'three';
import { EnemyDef, EnemyDrop } from '../../types';

export interface DropItem {
  itemId: string;
  itemName: string;
  quantity: number;
  quality: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  position: THREE.Vector3;
  mesh?: THREE.Group;
  isCollected: boolean;
  spawnTime: number;
  despawnTime: number;
  floatOffset: number;
  bobTimer: number;
}

export class DropItemManager {
  private dropItems: DropItem[] = [];
  private despawnDuration: number = 60;
  private spawnDuration: number = 5;

  spawnDrop(
    dropDef: EnemyDrop,
    position: THREE.Vector3,
    quality: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' = 'common'
  ): DropItem {
    const drop: DropItem = {
      itemId: dropDef.itemId,
      itemName: dropDef.name || dropDef.itemId,
      quantity: dropDef.quantity || 1,
      quality,
      position: position.clone(),
      isCollected: false,
      spawnTime: Date.now(),
      despawnTime: Date.now() + this.despawnDuration * 1000,
      floatOffset: Math.random() * Math.PI * 2,
      bobTimer: 0,
    };
    this.dropItems.push(drop);
    return drop;
  }

  spawnMultiple(
    drops: EnemyDrop[],
    position: THREE.Vector3
  ): DropItem[] {
    const spawned: DropItem[] = [];
    for (const drop of drops) {
      if (Math.random() < (drop.chance ?? 1)) {
        const quality = this.rollQuality();
        spawned.push(this.spawnDrop(drop, position, quality));
      }
    }
    return spawned;
  }

  spawnLootTable(
    lootTable: Array<{ item: EnemyDrop; chance: number; qualities?: Array<{ quality: string; weight: number }> }>,
    position: THREE.Vector3
  ): DropItem[] {
    const spawned: DropItem[] = [];
    for (const entry of lootTable) {
      if (Math.random() < (entry.chance ?? 1)) {
        let quality: string = 'common';
        if (entry.qualities) {
          quality = this.rollWeightedQuality(entry.qualities);
        }
        spawned.push(this.spawnDrop(entry.item, position, quality as any));
      }
    }
    return spawned;
  }

  update(dt: number): void {
    const now = Date.now();
    for (let i = this.dropItems.length - 1; i >= 0; i--) {
      const item = this.dropItems[i];
      if (item.isCollected) {
        this.dropItems.splice(i, 1);
        continue;
      }
      item.bobTimer += dt;
      if (now > item.despawnTime && item.bobTimer > this.spawnDuration) {
        this.dropItems.splice(i, 1);
      }
    }
  }

  getNearbyDrops(
    position: THREE.Vector3,
    range: number = 3
  ): DropItem[] {
    return this.dropItems.filter((item) => {
      if (item.isCollected) return false;
      const dx = item.position.x - position.x;
      const dz = item.position.z - position.z;
      return Math.sqrt(dx * dx + dz * dz) <= range;
    });
  }

  collectDrop(index: number): DropItem | null {
    const item = this.dropItems[index];
    if (!item || item.isCollected) return null;
    item.isCollected = true;
    return item;
  }

  collectAllNearby(
    position: THREE.Vector3,
    range: number = 3
  ): DropItem[] {
    const collected: DropItem[] = [];
    for (let i = this.dropItems.length - 1; i >= 0; i--) {
      const item = this.dropItems[i];
      if (item.isCollected) continue;
      const dx = item.position.x - position.x;
      const dz = item.position.z - position.z;
      if (Math.sqrt(dx * dx + dz * dz) <= range) {
        item.isCollected = true;
        collected.push(item);
      }
    }
    return collected;
  }

  getAllDrops(): DropItem[] {
    return this.dropItems.filter((i) => !i.isCollected);
  }

  getDropCount(): number {
    return this.dropItems.filter((i) => !i.isCollected).length;
  }

  clear(): void {
    this.dropItems = [];
  }

  private rollQuality(): 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' {
    const r = Math.random();
    if (r < 0.50) return 'common';
    if (r < 0.80) return 'uncommon';
    if (r < 0.95) return 'rare';
    if (r < 0.99) return 'epic';
    return 'legendary';
  }

  private rollWeightedQuality(
    qualities: Array<{ quality: string; weight: number }>
  ): string {
    const totalWeight = qualities.reduce((s, q) => s + q.weight, 0);
    let r = Math.random() * totalWeight;
    for (const q of qualities) {
      r -= q.weight;
      if (r <= 0) return q.quality;
    }
    return qualities[qualities.length - 1].quality;
  }
}
