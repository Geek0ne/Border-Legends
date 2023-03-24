import type { CombatStats, DamageCalculation, SkillDef } from '../../types/combat';

/**
 * 边境传说 — 增强版伤害计算器
 * 新增: 抗性系统、伤害类型表、战斗日志、暴击链、连击加成
 */

export interface ResistanceRecord {
  fire: number;
  ice: number;
  lightning: number;
  nature: number;
  physical: number;
  magic: number;
  true: number;
}

export interface DamageLogEntry {
  timestamp: number;
  source: string;
  target: string;
  damage: number;
  isCrit: boolean;
  isDodged: boolean;
  isBlocked: boolean;
  damageType: string;
  element: string;
  rawDamage: number;
  finalDamage: number;
  targetId?: string;
}

export class DamageCalculator {
  static readonly DAMAGE_TYPES: Record<string, string[]> = {
    physical: ['sword', 'axe', 'spear', 'bow', 'dagger'],
    magic: ['fireball', 'ice_shard', 'lightning_bolt', 'heal'],
    true: ['pierce', 'slash'],
  };

  static readonly ELEMENT_COLORS: Record<string, number> = {
    fire: 0xff4444,
    ice: 0x44aaff,
    lightning: 0xffee44,
    nature: 0x44ff44,
    none: 0xffffff,
  };

  static calculateDamage(
    attackerStats: CombatStats,
    defenderStats: CombatStats,
    skill: SkillDef | null,
    baseDamage: number,
    damageType: 'physical' | 'magic' | 'true' = 'physical',
    element: 'none' | 'fire' | 'ice' | 'lightning' | 'nature' = 'none',
    isMelee: boolean = true
  ): DamageCalculation {
    const calc: DamageCalculation = {
      damage: 0,
      isCrit: false,
      isBlocked: false,
      isDodged: false,
      damageType,
      element,
      isMelee,
    };

    // 闪避判定
    const dodgeRate = Math.min(defenderStats.dodgeRate, 0.6);
    if (Math.random() < dodgeRate) {
      calc.isDodged = true;
      calc.damage = 0;
      return calc;
    }

    // 格挡判定
    if (Math.random() < (defenderStats.blockRate ?? 0)) {
      calc.isBlocked = true;
      const blockedDamage = Math.floor(baseDamage * 0.3);
      calc.damage = Math.max(1, blockedDamage);
      return calc;
    }

    // 暴击判定 - 支持暴击链
    const effectiveCritRate = Math.min(attackerStats.critRate, 0.75);
    let critMultiplier = attackerStats.critDamage;

    if (this.isComboActive(attackerStats)) {
      calc.isCrit = Math.random() < effectiveCritRate * 1.5;
      critMultiplier *= 1.2;
    } else {
      calc.isCrit = Math.random() < effectiveCritRate;
    }

    // 基础伤害计算
    let rawDamage = baseDamage;
    if (skill) {
      rawDamage += skill.damage.base;
      const statKey = damageType === 'magic' ? 'magic' : 'attack';
      const statValue = (attackerStats as any)[statKey] || 0;
      rawDamage += statValue * skill.damage.scaling;
    } else {
      rawDamage += (attackerStats.attack || 0) * 0.5;
    }

    // 暴击应用
    if (calc.isCrit) {
      rawDamage *= critMultiplier;
    }

    // 近战/远程修正
    if (!isMelee) {
      rawDamage *= 0.85;
    }

    // 元素加成
    if (element !== 'none') {
      const elementBonus = this.getElementBonus(element, damageType);
      rawDamage *= (1 + elementBonus);
    }

    // 抗性系统
    const resistance = (defenderStats as any).resistance || {};
    const damageReduction = this.calculateDamageReduction(rawDamage, damageType, element, resistance);
    rawDamage *= damageReduction;

    // 真实伤害额外系数
    if (damageType === 'true') {
      rawDamage *= 1.2;
    }

    calc.damage = Math.max(1, Math.floor(rawDamage));
    calc.rawDamage = Math.floor(rawDamage);
    calc.isMelee = isMelee;
    return calc;
  }

  static calculateHeal(casterStats: CombatStats, healBase: number, scaling: number): number {
    return Math.floor(healBase + (casterStats.magic || 0) * scaling);
  }

  static calculateAOE(
    attackerStats: CombatStats,
    targets: Array<{ stats: CombatStats; position: { x: number; z: number } }>,
    skill: SkillDef,
    casterPosition: { x: number; z: number }
  ): Array<{ targetId: string; calculation: DamageCalculation }> {
    return targets.map((t) => {
      const dist = Math.sqrt(
        (t.position.x - casterPosition.x) ** 2 + (t.position.z - casterPosition.z) ** 2
      );
      if (dist > skill.areaOfEffect) {
        return { targetId: t.stats.id ?? 'unknown', calculation: { damage: 0, isCrit: false, isBlocked: false, isDodged: false, damageType: skill.damage.type, element: skill.damage.element } };
      }
      const decay = 1 - (dist / skill.areaOfEffect) * 0.5;
      const calc = this.calculateDamage(
        attackerStats, t.stats, skill, skill.damage.base * decay,
        skill.damage.type, skill.damage.element, true
      );
      return { targetId: t.stats.id ?? 'unknown', calculation: calc };
    });
  }

  static getElementBonus(element: string, damageType: string): number {
    const bonuses: Record<string, number> = {
      'fire|physical': 0.1, 'fire|magic': 0.2,
      'ice|magic': 0.2, 'ice|physical': 0.05,
      'lightning|magic': 0.15, 'lightning|physical': 0.08,
      'nature|magic': 0.25, 'nature|physical': 0.1,
    };
    return bonuses[element + '|' + damageType] || 0;
  }

  static calculateDamageReduction(
    rawDamage: number,
    damageType: string,
    element: string,
    resistance: ResistanceRecord
  ): number {
    let resistValue = 0;
    if (element !== 'none') {
      resistValue = (resistance as any)[element] || 0;
    } else {
      resistValue = (resistance as any)[damageType] || 0;
    }
    const reduction = resistValue / (resistValue + 100);
    return Math.max(0.1, 1 - reduction);
  }

  static isComboActive(stats: CombatStats): boolean {
    return (stats as any).comboCount >= 3;
  }

  static getTypeForSkill(skillId: string): { type: 'physical' | 'magic' | 'true'; element: string } {
    for (const [type, skills] of Object.entries(this.DAMAGE_TYPES)) {
      if (skills.includes(skillId)) {
        return { type: type as 'physical' | 'magic' | 'true', element: 'none' };
      }
    }
    return { type: 'physical', element: 'none' };
  }

  static getDamageTypeForSkill(skillId: string): string {
    return this.getTypeForSkill(skillId).type;
  }

  static getDamageColor(element: string): number {
    return this.ELEMENT_COLORS[element] || 0xffffff;
  }
}
