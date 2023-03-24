/**
 * 边境传说 — 战斗系统
 * 管理战斗生命周期、技能释放、战斗日志、战斗状态
 */

import * as THREE from 'three';
import { DamageCalculator } from './DamageCalculator';
import { CombatLogEntry, CombatState, DamageEvent, SkillDef, StatusEffect, CombatStats, EnemyAIState } from '../../types/combat';
import { generateId } from '../../utils';
import type { SkillManager } from '../skills/SkillManager';

export interface CombatantEntity {
  id: string;
  name: string;
  position: THREE.Vector3;
  stats: CombatStats;
  effects: StatusEffect[];
  isAlive: boolean;
  state: CombatState;
  mesh?: THREE.Object3D;
}

export class CombatSystem {
  private combatants: Map<string, CombatantEntity> = new Map();
  private log: CombatLogEntry[] = [];
  private skills: SkillDef[] = [];
  private maxLogEntries = 200;
  private onLogUpdate?: (entries: CombatLogEntry[]) => void;
  private onCombatantUpdate?: (id: string, stats: CombatStats) => void;

  constructor(skills: SkillDef[], maxLogEntries: number = 200) {
    this.skills = skills;
    this.maxLogEntries = maxLogEntries;
  }

  public setOnLogUpdate(callback: (entries: CombatLogEntry[]) => void): void {
    this.onLogUpdate = callback;
  }

  public setOnCombatantUpdate(callback: (id: string, stats: CombatStats) => void): void {
    this.onCombatantUpdate = callback;
  }

  /**
   * 注册战斗实体
   */
  public registerCombatant(entity: CombatantEntity): void {
    this.combatants.set(entity.id, entity);
    this.addLog('skill', `${entity.name} 加入战斗`, entity.id);
  }

  /**
   * 注销战斗实体
   */
  public unregisterCombatant(id: string): void {
    const entity = this.combatants.get(id);
    if (entity) {
      this.addLog('skill', `${entity.name} 离开战斗`, id);
      this.combatants.delete(id);
    }
  }

  /**
   * 执行普通攻击
   */
  public basicAttack(attackerId: string, targetId: string, skill?: SkillDef): DamageEvent | null {
    const attacker = this.combatants.get(attackerId);
    const target = this.combatants.get(targetId);
    if (!attacker || !target || !attacker.isAlive || !target.isAlive) return null;

    const calc = DamageCalculator.calculateDamage(
      attacker.stats,
      target.stats,
      skill ?? null,
      skill?.damage.base ?? 10,
      skill?.damage.type ?? 'physical',
      skill?.damage.element ?? 'none'
    );

    if (calc.isDodged) {
      this.addLog('damage', `${attacker.name} 攻击 ${target.name} — 闪避`, attackerId, targetId, 0);
      return {
        source: attacker,
        target,
        calculation: calc,
        damageType: 'damage',
        timestamp: Date.now(),
      };
    }

    target.stats.hp = Math.max(0, target.stats.hp - calc.damage);
    if (calc.isCrit) {
      this.addLog('damage', `💥 ${attacker.name} 暴击攻击 ${target.name}！-${calc.damage}`, attackerId, targetId, calc.damage);
    } else {
      this.addLog('damage', `${attacker.name} 攻击 ${target.name} — ${calc.damage}`, attackerId, targetId, calc.damage);
    }

    if (calc.isBlocked) {
      this.addLog('damage', `${attacker.name} 的攻击被 ${target.name} 格挡`, attackerId, targetId, calc.damage);
    }

    if (target.stats.hp <= 0) {
      this.onKill(attackerId, targetId);
    }

    this.notifyCombatantUpdate(targetId);

    return {
      source: attacker,
      target,
      calculation: calc,
      damageType: 'damage',
      timestamp: Date.now(),
      floatingText: `${calc.damage}`,
    };
  }

  /**
   * 释放技能
   */
  public useSkill(
    skillId: string,
    casterId: string,
    targetId: string | null = null
  ): DamageEvent[] | null {
    const skill = this.skills.find((s) => s.id === skillId);
    if (!skill) return null;

    const caster = this.combatants.get(casterId);
    if (!caster || !caster.isAlive) return null;

    // 检查 MP
    if (caster.stats.mp < skill.cost) {
      this.addLog('skill', `${caster.name} MP 不足，无法释放 ${skill.name}`, casterId);
      return null;
    }

    // 检查冷却
    // （简化：实际项目中需要在 SkillManager 中管理）

    // 扣除 MP
    caster.stats.mp -= skill.cost;
    this.notifyCombatantUpdate(casterId);

    const results: DamageEvent[] = [];

    if (targetId && skill.areaOfEffect > 0 && (skill.damage.base > 0 || skill.damage.scaling > 0)) {
      // AOE 技能
      const targets = Array.from(this.combatants.values())
        .filter((t) => t.isAlive && t.id !== casterId)
        .map((t) => ({ stats: t.stats as CombatStats, position: { x: t.position.x, z: t.position.z } }));

      const aoeResults = DamageCalculator.calculateAOE(
        caster.stats as CombatStats,
        targets,
        skill,
        { x: caster.position.x, z: caster.position.z }
      );

      for (const result of aoeResults) {
        if (result.calculation.damage > 0) {
          const targetEntity = this.combatants.get(result.targetId);
          if (targetEntity) {
            targetEntity.stats.hp = Math.max(0, targetEntity.stats.hp - result.calculation.damage);
            if (result.calculation.isCrit) {
              this.addLog('damage', `💥 ${caster.name} ${skill.name} 暴击 ${result.targetId} — ${result.calculation.damage}`, casterId, result.targetId, result.calculation.damage);
            }
            if (targetEntity.stats.hp <= 0) {
              this.onKill(casterId, result.targetId);
            }
            this.notifyCombatantUpdate(targetEntity.id);
            results.push({
              source: caster,
              target: targetEntity,
              calculation: result.calculation,
              damageType: 'damage',
              timestamp: Date.now(),
              floatingText: `${result.calculation.damage}`,
            });
          }
        }
      }
    } else if (targetId && (skill.damage.base > 0 || skill.damage.scaling > 0)) {
      // 单体技能
      const event = this.basicAttack(casterId, targetId, skill);
      if (event) results.push(event);
    }

    // 治疗技能处理
    if (skill.heal && (targetId || skill.areaOfEffect > 0)) {
      if (skill.areaOfEffect > 0) {
        // AOE 治疗
        const targets = Array.from(this.combatants.values())
          .filter((t) => t.isAlive && t.id !== casterId);
        const casterPos = { x: caster.position.x, z: caster.position.z };
        
        for (const targetEntity of targets) {
          const dist = Math.sqrt(
            (targetEntity.position.x - casterPos.x) ** 2 +
            (targetEntity.position.z - casterPos.z) ** 2
          );
          if (dist <= skill.areaOfEffect) {
            const healValue = DamageCalculator.calculateHeal(caster.stats, skill.heal.base, skill.heal.scaling);
            targetEntity.stats.hp = Math.min(targetEntity.stats.maxHp, targetEntity.stats.hp + healValue);
            this.addLog('heal', `${caster.name} 使用 ${skill.name} 治疗 ${targetEntity.name} +${healValue}`, casterId, targetEntity.id, healValue);
            this.notifyCombatantUpdate(targetEntity.id);
            results.push({
              source: caster,
              target: targetEntity,
              calculation: {
                damage: healValue,
                isCrit: false,
                isBlocked: false,
                isDodged: false,
                damageType: 'magic',
                element: 'none',
              },
              damageType: 'heal',
              timestamp: Date.now(),
              floatingText: `+${healValue}`,
            });
          }
        }
      } else if (targetId) {
        // 单体治疗
        const targetEntity = this.combatants.get(targetId);
        if (targetEntity) {
          const healValue = DamageCalculator.calculateHeal(caster.stats, skill.heal.base, skill.heal.scaling);
          targetEntity.stats.hp = Math.min(targetEntity.stats.maxHp, targetEntity.stats.hp + healValue);
          this.addLog('heal', `${caster.name} 使用 ${skill.name} 治疗 ${targetEntity.name} +${healValue}`, casterId, targetId, healValue);
          this.notifyCombatantUpdate(targetEntity.id);
          results.push({
            source: caster,
            target: targetEntity,
            calculation: {
              damage: healValue,
              isCrit: false,
              isBlocked: false,
              isDodged: false,
              damageType: 'magic',
              element: 'none',
            },
            damageType: 'heal',
            timestamp: Date.now(),
            floatingText: `+${healValue}`,
          });
        }
      }
    }

    // 应用技能效果
    for (const effect of skill.effects) {
      if (effect.target === 'self' && effect.status) {
        const eff: StatusEffect = {
          type: effect.status,
          duration: effect.duration ?? 5,
          tickDamage: effect.value,
          stackCount: 1,
        };
        caster.effects.push(eff);
        this.addLog('skill', `${caster.name} 获得 ${effect.status} 效果`, casterId);
      }
    }

    this.addLog('skill', `${caster.name} 释放 ${skill.name}`, casterId, targetId ?? undefined, skill.cost);
    return results;
  }

  /**
   * 治疗
   */
  public heal(targetId: string, healerId: string, healAmount: number, scaling: number = 0): boolean {
    const target = this.combatants.get(targetId);
    const healer = this.combatants.get(healerId);
    if (!target || !healer || !target.isAlive) return false;

    const healValue = DamageCalculator.calculateHeal(healer.stats, healAmount, scaling);
    target.stats.hp = Math.min(target.stats.maxHp, target.stats.hp + healValue);

    this.addLog('heal', `${healer.name} 治疗 ${target.name} +${healValue}`, healerId, targetId, healValue);
    this.notifyCombatantUpdate(targetId);
    return true;
  }

  /**
   * 击杀处理
   */
  private onKill(killerId: string, victimId: string): void {
    const killer = this.combatants.get(killerId);
    const victim = this.combatants.get(victimId);
    if (!killer || !victim) return;

    victim.isAlive = false;
    victim.state = 'dead';
    victim.stats.hp = 0;

    this.addLog('kill', `${killer.name} 击杀了 ${victim.name}`, killerId, victimId);

    // 掉落
    const drops = this.generateLoot(victimId);
    for (const drop of drops) {
      this.addLog('loot', `${victim.name} 掉落: ${drop.itemName} x${drop.quantity}`, victimId, undefined, 0);
    }
  }

  /**
   * 生成掉落
   */
  private generateLoot(enemyId: string): Array<{ itemName: string; quantity: number; quality: string }> {
    const gold = Math.floor(Math.random() * 50) + 10;
    const items: Array<{ itemName: string; quantity: number; quality: string }> = [
      { itemName: '金币', quantity: gold, quality: 'common' },
    ];

    if (Math.random() < 0.3) {
      const itemRoll = Math.random();
      if (itemRoll < 0.5) {
        items.push({ itemName: '生命药水', quantity: Math.floor(Math.random() * 2) + 1, quality: 'common' });
      } else if (itemRoll < 0.8) {
        items.push({ itemName: '魔力药水', quantity: Math.floor(Math.random() * 2) + 1, quality: 'uncommon' });
      } else {
        items.push({ itemName: '稀有武器碎片', quantity: 1, quality: 'rare' });
      }
    }

    return items;
  }

  /**
   * 更新状态效果
   */
  public tickStatusEffects(dt: number): void {
    this.combatants.forEach((entity) => {
      const expired: StatusEffect[] = [];
      for (const eff of entity.effects) {
        eff.duration -= dt;
        if (eff.duration <= 0) {
          expired.push(eff);
        } else if (eff.tickDamage && eff.tickInterval && eff.duration % eff.tickInterval < dt) {
          entity.stats.hp = Math.max(0, entity.stats.hp - Math.floor(eff.tickDamage));
          if (entity.stats.hp <= 0) {
            entity.isAlive = false;
            entity.state = 'dead';
          }
        }
      }
      entity.effects = entity.effects.filter((e) => !expired.includes(e));
    });
  }

  /**
   * 获取战斗日志
   */
  public getLog(): CombatLogEntry[] {
    return this.log.slice(-this.maxLogEntries);
  }

  /**
   * 清除日志
   */
  public clearLog(): void {
    this.log = [];
  }

  /**
   * 获取战斗实体列表
   */
  public getCombatants(): CombatantEntity[] {
    return Array.from(this.combatants.values());
  }

  /**
   * 获取特定战斗实体
   */
  public getCombatant(id: string): CombatantEntity | undefined {
    return this.combatants.get(id);
  }

  /**
   * 获取存活战斗实体
   */
  public getAliveCombatants(): CombatantEntity[] {
    return Array.from(this.combatants.values()).filter((c) => c.isAlive);
  }

  /**
   * 添加日志条目
   */
  private addLog(type: CombatLogEntry['type'], message: string, source?: string, target?: string, value?: number): void {
    this.log.push({
      timestamp: Date.now(),
      type,
      message,
      source,
      target,
      value,
    });
    if (this.log.length > this.maxLogEntries * 2) {
      this.log = this.log.slice(-this.maxLogEntries);
    }
    if (this.onLogUpdate) {
      this.onLogUpdate(this.log.slice(-this.maxLogEntries));
    }
  }

  /**
   * 通知战斗实体更新
   */
  private notifyCombatantUpdate(id: string): void {
    const entity = this.combatants.get(id);
    if (entity && this.onCombatantUpdate) {
      this.onCombatantUpdate(id, entity.stats);
    }
  }
}


