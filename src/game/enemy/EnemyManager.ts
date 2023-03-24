/**
 * 边境传说 - 敌人管理器
 * 管理场景中所有敌人的生成、状态、死亡和掉落
 */

import * as THREE from 'three';
import { EnemyDef } from '../../types';
import { HUDSystem } from '../hud/HUDSystem';

export interface EnemyInstance {
  def: EnemyDef;
  mesh: THREE.Group;
  currentHp: number;
  maxHp: number;
  isDead: boolean;
  position: { x: number; z: number };
  attackTimer: number;
  aggroRange: number;
  attackRange: number;
}

export class EnemyManager {
  private enemies: EnemyInstance[] = [];
  private hud: HUDSystem;

  constructor(hud: HUDSystem) {
    this.hud = hud;
  }

  public addEnemy(def: EnemyDef, mesh: THREE.Group, position: { x: number; z: number }): EnemyInstance {
    const enemy: EnemyInstance = {
      def, mesh, currentHp: def.hp, maxHp: def.hp,
      isDead: false, position, attackTimer: 0,
      aggroRange: 15, attackRange: 3,
    };
    this.enemies.push(enemy);
    this.hud.setEnemyCount(this.enemies.filter(e => !e.isDead).length);
    return enemy;
  }

  public removeEnemy(index: number): void {
    const enemy = this.enemies[index];
    if (!enemy) return;
    enemy.isDead = true;
    enemy.mesh.visible = false;
    this.hud.setEnemyCount(this.enemies.filter(e => !e.isDead).length);

    // 掉落物品
    this.handleDrops(enemy);
  }

  public getAliveEnemies(): EnemyInstance[] {
    return this.enemies.filter(e => !e.isDead);
  }

  public getEnemyCount(): number {
    return this.enemies.filter(e => !e.isDead).length;
  }

  public tick(delta: number): void {
    for (const enemy of this.enemies) {
      if (enemy.isDead) continue;
      enemy.attackTimer -= delta;
    }
  }

  public getEnemiesInAttackRange(playerPos: { x: number; z: number }): EnemyInstance[] {
    return this.getAliveEnemies().filter(e => {
      const dx = e.position.x - playerPos.x;
      const dz = e.position.z - playerPos.z;
      return Math.sqrt(dx * dx + dz * dz) <= e.attackRange;
    });
  }

  public getEnemiesInRange(playerPos: { x: number; z: number }): EnemyInstance[] {
    return this.getAliveEnemies().filter(e => {
      const dx = e.position.x - playerPos.x;
      const dz = e.position.z - playerPos.z;
      return Math.sqrt(dx * dx + dz * dz) <= e.aggroRange;
    });
  }

  private handleDrops(enemy: EnemyInstance): void {
    const drops = enemy.def.drops?.items || [];
    for (const drop of drops) {
      if (Math.random() < drop.chance) {
        // 掉落物会在场景中被拾取
        console.log(`[EnemyManager] ${enemy.def.name} 掉落 ${drop.itemId}`);
      }
    }
  }

  public applyDamage(enemy: EnemyInstance, damage: number, hud: HUDSystem): boolean {
    enemy.currentHp -= damage;
    hud.addFloatingText('-' + damage, enemy.position.x, enemy.position.z, 0xff4444);
    if (enemy.currentHp <= 0) {
      enemy.currentHp = 0;
      this.removeEnemy(this.enemies.indexOf(enemy));
      return true; // killed
    }
    return false; // still alive
  }

  public clear(): void {
    for (const e of this.enemies) {
      if (e.mesh.parent) e.mesh.parent.remove(e.mesh);
    }
    this.enemies = [];
    this.hud.setEnemyCount(0);
  }
}
