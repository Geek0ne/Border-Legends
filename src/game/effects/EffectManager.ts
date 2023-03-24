import * as THREE from 'three';

// ==================== 粒子效果管理器 ====================
export class ParticleEffectManager {
  private effects: Array<{
    positions: THREE.Vector3[];
    velocity: THREE.Vector3;
    life: number;
    maxLife: number;
    color: number;
    size: number;
    isDead: boolean;
  }> = [];

  createExplosion(
    position: THREE.Vector3,
    count: number = 20,
    speed: number = 5,
    color: number = 0xff4444,
    size: number = 0.2,
    life: number = 1.5
  ): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const elevation = (Math.random() - 0.5) * Math.PI;
      const speedMult = 0.5 + Math.random() * 0.5;
      const vel = new THREE.Vector3(
        Math.cos(angle) * Math.cos(elevation) * speed * speedMult,
        Math.sin(elevation) * speed * speedMult,
        Math.sin(angle) * Math.cos(elevation) * speed * speedMult
      );
      this.effects.push({
        positions: [position.clone()],
        velocity: vel,
        life: life,
        maxLife: life,
        color,
        size,
        isDead: false,
      });
    }
  }

  createHealEffect(position: THREE.Vector3, count: number = 10, life: number = 2): void {
    for (let i = 0; i < count; i++) {
      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 1,
        (Math.random() - 0.5) * 2
      );
      const pos = position.clone().add(offset);
      this.effects.push({
        positions: [pos.clone()],
        velocity: new THREE.Vector3(0, 2, 0),
        life: life,
        maxLife: life,
        color: 0x44ff44,
        size: 0.15,
        isDead: false,
      });
    }
  }

  createSparkEffect(position: THREE.Vector3, count: number = 15, color: number = 0xffff44): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      this.effects.push({
        positions: [position.clone()],
        velocity: new THREE.Vector3(
          Math.cos(angle) * 3,
          Math.random() * 4,
          Math.sin(angle) * 3
        ),
        life: 0.8,
        maxLife: 0.8,
        color,
        size: 0.1,
        isDead: false,
      });
    }
  }

  update(dt: number): void {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const eff = this.effects[i];
      if (eff.isDead) continue;
      eff.life -= dt;
      if (eff.life > 0) {
        const newPos = eff.positions[eff.positions.length - 1].clone().addScaledVector(eff.velocity, dt);
        eff.velocity.y -= 9.8 * dt;
        eff.positions.push(newPos);
        if (eff.positions.length > 20) eff.positions.shift();
      }
      if (eff.life <= 0) {
        this.effects.splice(i, 1);
      }
    }
  }

  getActiveCount(): number {
    return this.effects.filter((e) => !e.isDead).length;
  }

  clear(): void {
    this.effects = [];
  }
}

// ==================== 屏幕效果 ====================
export interface ScreenEffect {
  type: 'hit' | 'damage' | 'heal' | 'levelup' | 'death';
  intensity: number;
  duration: number;
  timer: number;
  color?: number;
}

export class ScreenEffectManager {
  private activeEffects: ScreenEffect[] = [];
  private flashColors: Map<string, { color: THREE.Color; opacity: number }> = new Map();

  triggerHit(): void {
    this.activeEffects.push({
      type: 'hit',
      intensity: 1.0,
      duration: 0.2,
      timer: 0.2,
      color: 0xffffff,
    });
  }

  triggerDamage(): void {
    this.activeEffects.push({
      type: 'damage',
      intensity: 0.8,
      duration: 0.3,
      timer: 0.3,
      color: 0xff0000,
    });
  }

  triggerHeal(): void {
    this.activeEffects.push({
      type: 'heal',
      intensity: 0.6,
      duration: 0.5,
      timer: 0.5,
      color: 0x00ff00,
    });
  }

  triggerLevelUp(): void {
    this.activeEffects.push({
      type: 'levelup',
      intensity: 1.0,
      duration: 1.0,
      timer: 1.0,
      color: 0xffff00,
    });
  }

  triggerDeath(): void {
    this.activeEffects.push({
      type: 'death',
      intensity: 1.0,
      duration: 2.0,
      timer: 2.0,
      color: 0x000000,
    });
  }

  update(dt: number): void {
    for (let i = this.activeEffects.length - 1; i >= 0; i--) {
      const eff = this.activeEffects[i];
      eff.timer -= dt;
      if (eff.timer <= 0) {
        this.activeEffects.splice(i, 1);
      }
    }
  }

  getActiveEffects(): ScreenEffect[] {
    return [...this.activeEffects];
  }

  clear(): void {
    this.activeEffects = [];
  }
}

export type EffectManager = ParticleEffectManager;
