import * as THREE from 'three';
import { EnemyDef, EnemyState } from '../../types/combat';

export interface EnemyWave {
  enemies: Array<{ templateId: string; spawnPosition: THREE.Vector3; delay: number }>;
  spawnInterval: number;
  respawnDelay: number;
}

export interface SpawnedEnemy {
  enemy: { id: string; templateId: string; currentHp: number; maxHp: number; state: EnemyState };
  position: THREE.Vector3;
  mesh?: THREE.Group;
  path?: THREE.Vector3[];
  pathIndex?: number;
  stateTimer?: number;
  lastAggroCheck?: number;
}

export class EnemyManager {
  private spawnedEnemies: SpawnedEnemy[] = [];
  private enemyTemplates: Map<string, EnemyDef> = new Map();
  private enemyCounter: number = 0;
  private currentWave: EnemyWave | null = null;
  private waveTimer: number = 0;
  private waveComplete: boolean = false;
  private waveCallbacks: {
    onWaveStart?: (waveIndex: number) => void;
    onWaveComplete?: (waveIndex: number) => void;
    onEnemySpawn?: (enemyId: string) => void;
    onEnemyDeath?: (enemyId: string) => void;
    onAllWavesComplete?: () => void;
  } = {};

  registerTemplate(template: EnemyDef): void {
    this.enemyTemplates.set(template.id, template);
  }

  batchRegisterTemplates(templates: EnemyDef[]): void {
    for (const t of templates) this.registerTemplate(t);
  }

  getTemplate(templateId: string): EnemyDef | undefined {
    return this.enemyTemplates.get(templateId);
  }

  getCurrentWave(): EnemyWave | null { return this.currentWave; }

  setWaveCallbacks(callbacks: Partial<typeof this.waveCallbacks>): void {
    this.waveCallbacks = { ...this.waveCallbacks, ...callbacks };
  }

  startWave(wave: EnemyWave, waveIndex: number): void {
    this.currentWave = wave;
    this.waveTimer = 0;
    this.waveComplete = false;
    this.waveCallbacks.onWaveStart?.(waveIndex);
  }

  update(dt: number): void {
    if (this.currentWave && !this.waveComplete) {
      this.waveTimer += dt;
      for (const enemy of this.spawnedEnemies) {
        if (enemy.enemy.state === EnemyState.Alive) {
          if (enemy.stateTimer !== undefined) enemy.stateTimer -= dt;
          if (enemy.path && enemy.pathIndex !== undefined && enemy.pathIndex < enemy.path.length) {
            const target = enemy.path[enemy.pathIndex];
            if (target) {
              const dx = target.x - enemy.position.x;
              const dz = target.z - enemy.position.z;
              const dist = Math.sqrt(dx * dx + dz * dz);
              if (dist > 0.1) {
                enemy.position.x += (dx / dist) * dt * 2;
                enemy.position.z += (dz / dist) * dt * 2;
              }
            }
          }
        }
      }
    }
  }

  private incrementId(): string {
    this.enemyCounter++;
    return 'enemy_' + this.enemyCounter;
  }

  getSpawnedEnemies(): SpawnedEnemy[] {
    return this.spawnedEnemies;
  }

  getAliveEnemies(): SpawnedEnemy[] {
    return this.spawnedEnemies.filter((e) => e.enemy.state === EnemyState.Alive);
  }

  getEnemyById(id: string): SpawnedEnemy | undefined {
    return this.spawnedEnemies.find((e) => e.enemy.id === id);
  }
}
