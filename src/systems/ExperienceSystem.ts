/**
 * 边境传说 - 经验/升级系统
 * 管理角色经验获取、等级提升、属性成长
 */

import { XPConfig, PlayerState, CharacterStats } from '../types';

export class ExperienceSystem {
  private xpConfig: XPConfig = {
    baseXP: 50,
    multiplier: 1.3, // 每级所需经验 × 1.3
  };

  /** 获取当前等级达到下一级所需的经验 */
  public getXPTOReachNext(level: number): number {
    return Math.floor(this.xpConfig.baseXP * Math.pow(this.xpConfig.multiplier, level - 1));
  }

  /** 添加经验，返回是否升级 */
  public addXP(playerState: PlayerState, xp: number): boolean {
    let leveledUp = false;
    playerState.xp += xp;

    while (playerState.xp >= this.getXPTOReachNext(playerState.level)) {
      playerState.xp -= this.getXPTOReachNext(playerState.level);
      playerState.level++;
      leveledUp = true;
    }

    return leveledUp;
  }

  /** 根据敌人类型计算击杀经验奖励 */
  public calculateKillXP(enemyType: 'normal' | 'elite' | 'boss'): number {
    const baseMultipliers = { normal: 1, elite: 3, boss: 10 };
    return this.getXPTOReachNext(1) * baseMultipliers[enemyType];
  }

  /** 根据敌人等级动态计算经验 */
  public calculateDynamicKillXP(enemyLevel: number, enemyType: 'normal' | 'elite' | 'boss'): number {
    const typeMultiplier = enemyType === 'elite' ? 3 : enemyType === 'boss' ? 10 : 1;
    return this.calculateKillXP(enemyType) * (1 + enemyLevel * 0.1);
  }
}

/**
 * 边境传说 - 角色属性/升级系统
 * 管理角色属性成长、装备加成、临时Buff
 */

export class AttributeSystem {
  // 每级属性成长系数
  private growthRate: CharacterStats = {
    maxHp: 8,
    maxMp: 3,
    attack: 2,
    defense: 1.5,
    speed: 0.5,
    magic: 1.5,
  };

  /** 计算角色的基础属性（不含装备和Buff） */
  public calculateBaseStats(baseStats: CharacterStats, level: number): CharacterStats {
    return {
      maxHp: baseStats.maxHp + Math.floor((level - 1) * this.growthRate.maxHp),
      maxMp: baseStats.maxMp + Math.floor((level - 1) * this.growthRate.maxMp),
      attack: Math.floor(baseStats.attack + (level - 1) * this.growthRate.attack),
      defense: Math.floor(baseStats.defense + (level - 1) * this.growthRate.defense),
      speed: baseStats.speed + Math.floor((level - 1) * this.growthRate.speed),
      magic: Math.floor(baseStats.magic + (level - 1) * this.growthRate.magic),
    };
  }

  /** 计算装备加成 */
  public calculateEquipmentBonus(equipment: {
    head: { attack?: number; defense?: number; magic?: number; speed?: number } | null;
    chest: { attack?: number; defense?: number; magic?: number; speed?: number } | null;
    legs: { attack?: number; defense?: number; magic?: number; speed?: number } | null;
    boots: { attack?: number; defense?: number; magic?: number; speed?: number } | null;
    gloves: { attack?: number; defense?: number; magic?: number; speed?: number } | null;
    mainHand: { attack?: number; defense?: number; magic?: number; speed?: number; dodgeRate?: number; critRate?: number; critDamage?: number } | null;
    offHand: { attack?: number; defense?: number; magic?: number; speed?: number } | null;
    ring: { attack?: number; defense?: number; magic?: number } | null;
    amulet: { attack?: number; defense?: number; magic?: number } | null;
  }): CharacterStats {
    let bonus: CharacterStats = { maxHp: 0, maxMp: 0, attack: 0, defense: 0, speed: 0, magic: 0 };

    const applyBonus = (item: { attack?: number; defense?: number; magic?: number; speed?: number } | null) => {
      if (!item) return;
      bonus.attack += item.attack || 0;
      bonus.defense += item.defense || 0;
      bonus.magic += item.magic || 0;
      bonus.speed += item.speed || 0;
    };

    applyBonus(equipment.head);
    applyBonus(equipment.chest);
    applyBonus(equipment.legs);
    applyBonus(equipment.boots);
    applyBonus(equipment.gloves);
    applyBonus(equipment.mainHand);
    applyBonus(equipment.offHand);
    applyBonus(equipment.ring);
    applyBonus(equipment.amulet);

    return bonus;
  }

  /** 计算最终属性 */
  public calculateFinalStats(
    baseStats: CharacterStats,
    level: number,
    equipmentBonus: CharacterStats,
    buffStats: CharacterStats
  ): CharacterStats {
    const base = this.calculateBaseStats(baseStats, level);
    return {
      maxHp: base.maxHp + equipmentBonus.maxHp + buffStats.maxHp,
      maxMp: base.maxMp + equipmentBonus.maxMp + buffStats.maxMp,
      attack: base.attack + equipmentBonus.attack + buffStats.attack,
      defense: base.defense + equipmentBonus.defense + buffStats.defense,
      speed: base.speed + equipmentBonus.speed + buffStats.speed,
      magic: base.magic + equipmentBonus.magic + buffStats.magic,
    };
  }

  /** 角色升级时的属性恢复 */
  public calculateLevelUpRecovery(levelUp: boolean): { hpRecovery: number; mpRecovery: number } {
    if (!levelUp) return { hpRecovery: 0, mpRecovery: 0 };
    // 升级恢复 50% HP 和 30% MP
    return { hpRecovery: 0.5, mpRecovery: 0.3 };
  }
}
