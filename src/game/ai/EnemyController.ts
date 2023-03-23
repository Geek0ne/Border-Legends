import * as THREE from "three";

export interface EnemyData {
  id: string;
  name: string;
  mesh: THREE.Object3D;
  hp: number;
  maxHp: number;
  speed: number;
  isAlive: boolean;
  position: THREE.Vector3;
}

export interface PlayerRef {
  id: string;
  mesh: THREE.Object3D;
  position: THREE.Vector3;
}

export class EnemyController {
  private enemies: Map<string, EnemyData> = new Map();
  private playerRef: PlayerRef | null = null;
  private lastUpdate: number = 0;

  registerEnemy(enemy: EnemyData): void {
    this.enemies.set(enemy.id, enemy);
  }

  markEnemyDead(enemyId: string): void {
    const enemy = this.enemies.get(enemyId);
    if (enemy) {
      enemy.isAlive = false;
      enemy.mesh.visible = false;
    }
  }

  setPlayer(player: PlayerRef): void {
    this.playerRef = player;
  }

  getEnemies(): EnemyData[] {
    return Array.from(this.enemies.values()).filter((e) => e.isAlive);
  }

  getAliveCount(): number {
    let count = 0;
    this.enemies.forEach((e) => {
      if (e.isAlive) count++;
    });
    return count;
  }

  update(delta: number): void {
    const now = Date.now();
    if (now - this.lastUpdate < 100) return;
    this.lastUpdate = now;

    if (!this.playerRef) return;

    for (const enemy of this.enemies.values()) {
      if (!enemy.isAlive) continue;

      const dx = this.playerRef.position.x - enemy.position.x;
      const dz = this.playerRef.position.z - enemy.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 2 && dist < 20) {
        const moveX = (dx / dist) * enemy.speed * delta;
        const moveZ = (dz / dist) * enemy.speed * delta;
        enemy.mesh.position.x += moveX;
        enemy.mesh.position.z += moveZ;
        enemy.position.x += moveX;
        enemy.position.z += moveZ;
      }
    }
  }
}
