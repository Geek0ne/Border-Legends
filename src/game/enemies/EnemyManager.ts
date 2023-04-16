import * as THREE from "three";
import { EnemyDef } from "../../types";
import { HUDSystem } from "../hud/HUDSystem";
import { EffectManager } from "../effects/EffectManager";
import { AudioEngine } from "../audio/AudioEngine";

export type PatrolWaypoint = { x: number; z: number; dwellTime?: number };

export interface EnemyAIStateData {
  state: string;
  targetId: string | null;
  patrolPoints: PatrolWaypoint[];
  currentPatrolIndex: number;
  detectionRange: number;
  attackRange: number;
  aggression: number;
  fleeThreshold: number;
  lastSeenPlayer: { x: number; z: number } | null;
  patrolTimer: number;
  attackCooldown: number;
  stateTimer: number;
  aggroCooldown: number;
  aggroRange: number;
  isAggro: boolean;
}

export interface EnemyInstance {
  def: EnemyDef;
  mesh: THREE.Group;
  currentHp: number;
  maxHp: number;
  isDead: boolean;
  position: { x: number; z: number };
  ai: EnemyAIStateData;
  attackTimer: number;
  aggroRange: number;
  attackRange: number;
}

export interface DamageMark {
  enemyIndex: number;
  amount: number;
  timestamp: number;
}

export interface EnemyManagerConfig {
  defaultAggroRange?: number;
  defaultAttackRange?: number;
  defaultDetectionRange?: number;
  fleeHpThreshold?: number;
  maxEnemies?: number;
  autoDespawnTime?: number;
}

const DEFAULT_CONFIG: Required<EnemyManagerConfig> = {
  defaultAggroRange: 15,
  defaultAttackRange: 3,
  defaultDetectionRange: 20,
  fleeHpThreshold: 0.3,
  maxEnemies: 50,
  autoDespawnTime: 10,
};

export class EnemyManager {
  private enemies: EnemyInstance[] = [];
  private hud: HUDSystem;
  private config: Required<EnemyManagerConfig>;
  private effectManager?: EffectManager;
  private audioEngine?: AudioEngine;
  private damageMarks: Map<number, DamageMark[]> = new Map();
  private onEnemyDeath?: (enemy: EnemyInstance, drops: any[]) => void;
  private onEnemySpawn?: (enemy: EnemyInstance) => void;

  constructor(hud: HUDSystem, config?: EnemyManagerConfig) {
    this.hud = hud;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  public setEffectManager(em: EffectManager): void { this.effectManager = em; }
  public setAudioEngine(audio: AudioEngine): void { this.audioEngine = audio; }
  public setOnEnemyDeath(cb: (enemy: EnemyInstance, drops: any[]) => void): void { this.onEnemyDeath = cb; }
  public setOnEnemySpawn(cb: (enemy: EnemyInstance) => void): void { this.onEnemySpawn = cb; }

  public addEnemy(
    def: EnemyDef, mesh: THREE.Group, position: { x: number; z: number },
    patrolPoints?: PatrolWaypoint[]
  ): EnemyInstance {
    if (this.enemies.length >= (this.config.maxEnemies ?? 50)) {
      console.warn("[EnemyManager] Max enemies reached");
      return null!;
    }
    const enemy: EnemyInstance = {
      def, mesh, currentHp: def.hp, maxHp: def.hp, isDead: false,
      position, attackTimer: 0,
      aggroRange: this.config.defaultAggroRange,
      attackRange: this.config.defaultAttackRange,
      ai: {
        state: "idle", targetId: null,
        patrolPoints: patrolPoints || [], currentPatrolIndex: 0,
        detectionRange: this.config.defaultDetectionRange,
        attackRange: this.config.defaultAttackRange,
        aggression: def.type === "elite" ? 0.8 : def.type === "boss" ? 1.0 : 0.4,
        fleeThreshold: this.config.fleeHpThreshold,
        lastSeenPlayer: null, patrolTimer: 0, attackCooldown: 0,
        aggroRange: this.config.defaultDetectionRange, stateTimer: 0, aggroCooldown: 0, isAggro: false,
      },
    };
    this.enemies.push(enemy);
    this.hud.setEnemyCount(this.enemies.filter((e) => !e.isDead).length);
    this.onEnemySpawn?.(enemy);
    this.audioEngine?.play("spawn");
    return enemy;
  }

  public removeEnemy(index: number): void {
    const enemy = this.enemies[index];
    if (!enemy) return;
    enemy.isDead = true;
    enemy.ai.state = "dead";
    this.handleDrops(enemy);
    this.hud.setEnemyCount(this.enemies.filter((e) => !e.isDead).length);
  }

  public despawnDeadEnemies(delta: number): void {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (e.isDead && e.mesh.parent) {
        e.attackTimer -= delta;
        if (e.attackTimer <= -(this.config.autoDespawnTime ?? 10)) {
          e.mesh.parent.remove(e.mesh);
          this.enemies.splice(i, 1);
        }
      }
    }
    this.hud.setEnemyCount(this.enemies.filter((e) => !e.isDead).length);
  }

  /** 兼容旧调用：回收死亡敌人 */
  public tick(delta: number): void {
    this.despawnDeadEnemies(delta);
  }

  /** 取走并清空敌人攻击的待结算伤害（供玩家侧扣血） */
  public consumeAttackMarks(): Array<{ amount: number; timestamp: number }> {
    const marks: Array<{ amount: number; timestamp: number }> = [];
    for (const list of this.damageMarks.values()) {
      for (const m of list) marks.push({ amount: m.amount, timestamp: m.timestamp });
    }
    this.damageMarks.clear();
    return marks;
  }

  public getAliveEnemies(): EnemyInstance[] { return this.enemies.filter((e) => !e.isDead); }
  public getEnemyCount(): number { return this.enemies.filter((e) => !e.isDead).length; }
  public getEnemyByIndex(index: number): EnemyInstance | undefined { return this.enemies[index]; }

  public getEnemiesInAttackRange(playerPos: { x: number; z: number }): EnemyInstance[] {
    return this.getAliveEnemies().filter((e) => {
      return Math.hypot(e.position.x - playerPos.x, e.position.z - playerPos.z) <= e.attackRange;
    });
  }
  public getEnemiesInRange(playerPos: { x: number; z: number }): EnemyInstance[] {
    return this.getAliveEnemies().filter((e) => {
      return Math.hypot(e.position.x - playerPos.x, e.position.z - playerPos.z) <= e.aggroRange;
    });
  }
  public getClosestEnemyTo(playerPos: { x: number; z: number }): EnemyInstance | null {
    let closest: EnemyInstance | null = null;
    let minDist = Infinity;
    for (const e of this.getAliveEnemies()) {
      const d = Math.hypot(e.position.x - playerPos.x, e.position.z - playerPos.z);
      if (d < minDist) { minDist = d; closest = e; }
    }
    return closest;
  }

  public updateAI(delta: number, playerPos: { x: number; z: number }, playerAlive: boolean = true): void {
    for (const enemy of this.getAliveEnemies()) {
      this.updateEnemyAI(enemy, delta, playerPos, playerAlive);
    }
  }

  private updateEnemyAI(enemy: EnemyInstance, delta: number, playerPos: { x: number; z: number }, playerAlive: boolean): void {
    const ai = enemy.ai;
    ai.stateTimer += delta;
    const dx = enemy.position.x - playerPos.x;
    const dz = enemy.position.z - playerPos.z;
    const dist = Math.hypot(dx, dz);
    const hpRatio = enemy.currentHp / enemy.maxHp;
    switch (ai.state) {
      case "idle":   this.handleIdle(enemy, delta, dist, playerPos, hpRatio); break;
      case "patrol": this.handlePatrol(enemy, delta, dist, playerPos, hpRatio); break;
      case "chase":  this.handleChase(enemy, delta, dist, playerPos); break;
      case "attack": this.handleAttack(enemy, delta, dist, playerPos); break;
      case "flee":   this.handleFlee(enemy, delta, dist, playerPos); break;
    }
    if (ai.attackCooldown > 0) ai.attackCooldown -= delta;
    if (ai.aggroCooldown > 0) ai.aggroCooldown -= delta;
  }

  private handleIdle(enemy: EnemyInstance, _delta: number, dist: number, playerPos: {x:number;z:number}, hpRatio: number): void {
    const ai = enemy.ai;
    if (dist <= ai.detectionRange && !ai.isAggro && Math.random() < ai.aggression * 0.02) {
      ai.state = "chase"; ai.targetId = "player";
      ai.lastSeenPlayer = { x: playerPos.x, z: playerPos.z };
      ai.isAggro = true; this.notifyAlert(enemy); return;
    }
    if (ai.isAggro && dist > ai.detectionRange * 2) {
      ai.isAggro = false; ai.aggroCooldown = 5; ai.state = "idle"; return;
    }
    if (hpRatio <= ai.fleeThreshold) ai.state = "flee";
  }

  private handlePatrol(enemy: EnemyInstance, delta: number, dist: number, playerPos: {x:number;z:number}, hpRatio: number): void {
    const ai = enemy.ai;
    if (ai.patrolPoints.length === 0) { ai.state = "idle"; return; }
    const tgt = ai.patrolPoints[ai.currentPatrolIndex];
    const d = Math.hypot(tgt.x - enemy.position.x, tgt.z - enemy.position.z);
    if (d < 0.5) {
      const dw = ai.patrolPoints[ai.currentPatrolIndex].dwellTime;
      if (dw) { ai.patrolTimer += delta; if (ai.patrolTimer >= dw) { ai.patrolTimer = 0; this.nextPatrolPoint(enemy); }}
      else this.nextPatrolPoint(enemy);
      return;
    }
    const s = 1.5;
    enemy.position.x += ((tgt.x - enemy.position.x) / d) * s * delta;
    enemy.position.z += ((tgt.z - enemy.position.z) / d) * s * delta;
    if (enemy.mesh) enemy.mesh.rotation.y = Math.atan2(tgt.x - enemy.position.x, tgt.z - enemy.position.z);
    if (dist <= ai.detectionRange && !ai.isAggro && Math.random() < ai.aggression * 0.02) {
      ai.state = "chase"; ai.targetId = "player";
      ai.lastSeenPlayer = { x: playerPos.x, z: playerPos.z };
      ai.isAggro = true; this.notifyAlert(enemy); return;
    }
    if (hpRatio <= ai.fleeThreshold) ai.state = "flee";
  }

  private handleChase(enemy: EnemyInstance, delta: number, dist: number, playerPos: {x:number;z:number}): void {
    const ai = enemy.ai;
    if (dist > ai.detectionRange * 3) { ai.state = "idle"; ai.isAggro = false; return; }
    ai.lastSeenPlayer = { x: playerPos.x, z: playerPos.z };
    if (dist <= ai.attackRange) { ai.state = "attack"; return; }
    const dx = playerPos.x - enemy.position.x;
    const dz = playerPos.z - enemy.position.z;
    const d = Math.hypot(dx, dz) || 1;
    enemy.position.x += (dx / d) * 2.5 * delta;
    enemy.position.z += (dz / d) * 2.5 * delta;
    if (enemy.mesh) enemy.mesh.rotation.y = Math.atan2(dx, dz);
  }

  private handleAttack(enemy: EnemyInstance, _delta: number, dist: number, playerPos: {x:number;z:number}): void {
    const ai = enemy.ai;
    if (dist > ai.aggroRange) { ai.state = "flee"; return; }
    if (dist <= ai.attackRange) {
      const dx = playerPos.x - enemy.position.x;
      const dz = playerPos.z - enemy.position.z;
      if (enemy.mesh) enemy.mesh.rotation.y = Math.atan2(dx, dz);
      if (ai.attackCooldown <= 0 && enemy.attackTimer <= 0) {
        this.triggerAttack(enemy, playerPos);
        ai.attackCooldown = 1.0;
      }
    } else { ai.state = "chase"; }
  }

  private handleFlee(enemy: EnemyInstance, delta: number, _dist: number, playerPos: {x:number;z:number}): void {
    const ai = enemy.ai;
    if (ai.stateTimer > 5) { ai.state = "idle"; ai.isAggro = false; return; }
    const dx = enemy.position.x - playerPos.x;
    const dz = enemy.position.z - playerPos.z;
    const d = Math.hypot(dx, dz) || 1;
    enemy.position.x += (dx / d) * 3.0 * delta;
    enemy.position.z += (dz / d) * 3.0 * delta;
    if (enemy.mesh) enemy.mesh.rotation.y = Math.atan2(dx, dz);
  }

  private triggerAttack(enemy: EnemyInstance, _playerPos: {x:number;z:number}): void {
    enemy.attackTimer = 0.5;
    const idx = this.enemies.indexOf(enemy);
    if (idx >= 0) {
      if (!this.damageMarks.has(idx)) this.damageMarks.set(idx, []);
      this.damageMarks.get(idx)!.push({ enemyIndex: idx, amount: enemy.def.attack, timestamp: Date.now() });
    }
    this.audioEngine?.play("attack");
    this.hud.addFloatingText(enemy.def.name + " 攻击!", enemy.position.x, enemy.position.z, 0xff6600);
  }

  private nextPatrolPoint(enemy: EnemyInstance): void {
    enemy.ai.currentPatrolIndex = (enemy.ai.currentPatrolIndex + 1) % enemy.ai.patrolPoints.length;
  }

  private notifyAlert(enemy: EnemyInstance): void {
    this.hud.showNotification(enemy.def.name + " 注意到你了!");
  }

  private handleDrops(enemy: EnemyInstance): void {
    const drops = enemy.def.drops?.items || [];
    const dropList: any[] = [];
    for (const drop of drops) {
      if (Math.random() < drop.chance) {
        dropList.push({ itemId: drop.itemId, name: drop.name || drop.itemId, quantity: drop.quantity || 1, chance: drop.chance });
        console.log("[EnemyManager] " + enemy.def.name + " dropped " + drop.name || drop.itemId);
      }
    }
    this.onEnemyDeath?.(enemy, dropList);
  }

  public applyDamage(enemy: EnemyInstance, damage: number, hud: HUDSystem): boolean {
    const isBlocked = Math.random() < 0.05;
    const finalDamage = isBlocked ? Math.floor(damage * 0.3) : damage;
    enemy.currentHp -= finalDamage;
    hud.addFloatingText("-" + finalDamage, enemy.position.x, enemy.position.z, isBlocked ? 0x888888 : 0xff4444);
    this.audioEngine?.play("hit");
    if (enemy.currentHp <= 0) { enemy.currentHp = 0; this.removeEnemy(this.enemies.indexOf(enemy)); return true; }
    return false;
  }

  public applyHeal(enemy: EnemyInstance, healAmount: number, hud: HUDSystem): void {
    const oldHp = enemy.currentHp;
    enemy.currentHp = Math.min(enemy.maxHp, enemy.currentHp + healAmount);
    hud.addFloatingText("+" + (enemy.currentHp - oldHp), enemy.position.x, enemy.position.z, 0x44ff44);
  }

  public clear(): void {
    for (const e of this.enemies) { if (e.mesh.parent) e.mesh.parent.remove(e.mesh); }
    this.enemies = []; this.damageMarks.clear();
    this.hud.setEnemyCount(0);
  }

  public logState(): void {
    console.log("[EnemyManager] Enemies:", this.enemies.length);
    for (const e of this.enemies) {
      console.log("  - " + e.def.name + ": hp=" + e.currentHp + "/" + e.maxHp + " ai=" + e.ai.state);
    }
  }
}

