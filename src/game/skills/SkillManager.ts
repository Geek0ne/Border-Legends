/**
 * 边境传说 — 技能管理器
 * 管理技能冷却、释放权限、技能槽位
 */

import type { SkillDef, StatusType } from '../../types/combat';
import { SKILL_DATABASE, getSkillById } from './SkillDatabase';

export interface ActiveSkill {
  skillId: string;
  cooldownRemaining: number;
  isOnCooldown: boolean;
  lastUsed: number;
}

export interface SkillSlot {
  slotIndex: number;
  skillId: string;
  isLocked: boolean;
}

export class SkillManager {
  private skillCooldowns: Map<string, ActiveSkill> = new Map();
  private skillSlots: SkillSlot[] = [];
  private unlockedSkills: Set<string> = new Set();
  private maxSlots: number = 8;

  constructor(unlockedSkillIds: string[] = []) {
    this.maxSlots = 8;
    this.initializeSlots();
    for (const id of unlockedSkillIds) {
      this.unlockedSkills.add(id);
      this.skillCooldowns.set(id, {
        skillId: id,
        cooldownRemaining: 0,
        isOnCooldown: false,
        lastUsed: 0,
      });
    }
  }

  /**
   * 初始化技能槽位
   */
  private initializeSlots(): void {
    for (let i = 0; i < this.maxSlots; i++) {
      this.skillSlots.push({
        slotIndex: i,
        skillId: '',
        isLocked: false,
      });
    }
  }

  /**
   * 解锁新技能
   */
  public unlockSkill(skillId: string): boolean {
    const skill = getSkillById(skillId);
    if (!skill) return false;

    this.unlockedSkills.add(skillId);

    // 如果还有空槽位，自动装备
    const emptySlot = this.skillSlots.find((s) => !s.isLocked && !s.skillId);
    if (emptySlot) {
      this.assignSkillToSlot(emptySlot.slotIndex, skillId);
    }

    this.skillCooldowns.set(skillId, {
      skillId,
      cooldownRemaining: 0,
      isOnCooldown: false,
      lastUsed: 0,
    });

    return true;
  }

  /**
   * 将技能分配到槽位
   */
  public assignSkillToSlot(slotIndex: number, skillId: string): boolean {
    const slot = this.skillSlots[slotIndex];
    if (!slot) return false;

    if (!this.unlockedSkills.has(skillId)) {
      return false;
    }

    // 如果槽位已有技能，先移除
    if (slot.skillId) {
      this.skillCooldowns.delete(slot.skillId);
    }

    slot.skillId = skillId;

    // 确保冷却记录存在
    if (!this.skillCooldowns.has(skillId)) {
      this.skillCooldowns.set(skillId, {
        skillId,
        cooldownRemaining: 0,
        isOnCooldown: false,
        lastUsed: 0,
      });
    }

    return true;
  }

  /**
   * 检查是否可以释放技能
   */
  public canCast(skillId: string, currentMp: number): boolean {
    const skill = getSkillById(skillId);
    if (!skill) return false;

    const cd = this.skillCooldowns.get(skillId);
    if (cd?.isOnCooldown) return false;

    return currentMp >= skill.cost;
  }

  /**
   * 开始冷却
   */
  public startCooldown(skillId: string): void {
    const skill = getSkillById(skillId);
    if (!skill) return;

    let cd = this.skillCooldowns.get(skillId);
    if (!cd) {
      cd = { skillId, cooldownRemaining: 0, isOnCooldown: false, lastUsed: 0 };
      this.skillCooldowns.set(skillId, cd);
    }

    cd.isOnCooldown = true;
    cd.cooldownRemaining = skill.cooldown;
    cd.lastUsed = Date.now();
  }

  /**
   * 更新冷却
   */
  public tickCooldowns(dt: number): void {
    this.skillCooldowns.forEach((cd) => {
      if (cd.isOnCooldown && cd.cooldownRemaining > 0) {
        cd.cooldownRemaining -= dt;
        if (cd.cooldownRemaining <= 0) {
          cd.cooldownRemaining = 0;
          cd.isOnCooldown = false;
        }
      }
    });
  }

  /**
   * 获取技能冷却剩余时间
   */
  public getCooldownRemaining(skillId: string): number {
    const cd = this.skillCooldowns.get(skillId);
    return cd?.cooldownRemaining ?? 0;
  }

  /**
   * 获取技能详情
   */
  public getSkill(skillId: string): SkillDef | undefined {
    return getSkillById(skillId);
  }

  /**
   * 获取已解锁技能列表
   */
  public getUnlockedSkills(): SkillDef[] {
    return Array.from(this.unlockedSkills)
      .map((id) => getSkillById(id))
      .filter((s): s is SkillDef => s !== undefined);
  }

  /**
   * 获取槽位状态
   */
  public getSkillSlots(): SkillSlot[] {
    return this.skillSlots.map((slot) => ({ ...slot }));
  }

  /**
   * 获取所有冷却状态
   */
  public getAllCooldowns(): Map<string, ActiveSkill> {
    return new Map(this.skillCooldowns);
  }

  /**
   * 检查技能是否在冷却中
   */
  public isOnCooldown(skillId: string): boolean {
    const cd = this.skillCooldowns.get(skillId);
    return cd?.isOnCooldown ?? false;
  }

  /**
   * 检查技能可用
   */
  public isSkillAvailable(skillId: string, currentMp: number): boolean {
    return this.canCast(skillId, currentMp) && !this.isOnCooldown(skillId);
  }

  /**
   * 检查状态效果
   */
  public hasStatusEffect(
    entityId: string,
    statusType: StatusType
  ): boolean {
    // 简化实现：实际项目中需要结合战斗系统
    return false;
  }

  /**
   * 设置槽位锁定
   */
  public lockSlot(slotIndex: number, locked: boolean): void {
    const slot = this.skillSlots[slotIndex];
    if (slot) {
      slot.isLocked = locked;
    }
  }
}

// ==================== 技能组合系统 ====================
export interface SkillCombo {
  id: string;
  name: string;
  description: string;
  sequence: string[]; // 技能ID序列
  maxTimeWindow: number; // 最大时间窗口（秒）
  activationCooldown: number;
  effect: {
    type: 'buff' | 'debuff' | 'damage' | 'heal' | 'special';
    value: number;
    duration?: number;
    statusType?: StatusType;
  };
  icon: string;
}

export interface ActiveCombo {
  comboId: string;
  sequenceIndex: number;
  lastUsedAt: number;
  isActive: boolean;
}

export class SkillComboManager {
  private combos: Map<string, SkillCombo> = new Map();
  private activeCombos: Map<string, ActiveCombo> = new Map();
  private recentSkills: Array<{ skillId: string; timestamp: number }> = [];
  private maxRecentSkills: number = 10;

  addCombo(combo: SkillCombo): void {
    this.combos.set(combo.id, combo);
  }

  recordSkillUsage(skillId: string): void {
    const now = Date.now();
    this.recentSkills.push({ skillId, timestamp: now });
    // 保持最近技能列表大小
    if (this.recentSkills.length > this.maxRecentSkills) {
      this.recentSkills.shift();
    }
    // 清理超时记录
    const cutoff = now - 5000;
    this.recentSkills = this.recentSkills.filter((s) => s.timestamp > cutoff);
    // 检查触发组合
    this.checkCombos();
  }

  private checkCombos(): void {
    const recentIds = this.recentSkills.map((s) => s.skillId);
    for (const [comboId, combo] of this.combos) {
      const sequence = combo.sequence;
      const seqLen = sequence.length;
      const recentLen = recentIds.length;
      if (recentLen < seqLen) continue;

      const tail = recentIds.slice(-seqLen);
      const matches = tail.every((s, i) => s === sequence[i]);
      if (matches) {
        this.activateCombo(comboId);
      }
    }
  }

  private activateCombo(comboId: string): void {
    const combo = this.combos.get(comboId);
    if (!combo) return;
    this.activeCombos.set(comboId, {
      comboId,
      sequenceIndex: 0,
      lastUsedAt: Date.now(),
      isActive: true,
    });
  }

  getActiveCombo(comboId: string): ActiveCombo | undefined {
    return this.activeCombos.get(comboId);
  }

  getAllCombos(): SkillCombo[] {
    return Array.from(this.combos.values());
  }
}

// ==================== 被动技能系统 ====================
export interface PassiveSkillDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  // 被动效果类型
  effectType:
    | 'statBonus'
    | 'damageModifier'
    | 'healModifier'
    | 'critChance'
    | 'dodgeChance'
    | 'xpBonus'
    | 'goldBonus'
    | 'cooldownReduction'
    | 'mpRegen'
    | 'hpRegen';
  // 效果值
  value: number;
  // 百分比加成（如果是 statBonus）
  statBonus?: Record<string, number>;
  // 触发条件
  triggerCondition?: string;
  // 层数
  stackable?: boolean;
  maxStacks?: number;
}

export interface PassiveSkillActive {
  skillId: string;
  currentStacks: number;
  isActive: boolean;
}

// ==================== 技能树系统 ====================
export interface SkillTreeNode {
  id: string;
  name: string;
  description: string;
  icon: string;
  // 节点类型：解锁技能/被动/组合
  nodeType: 'skill' | 'passive' | 'combo' | 'branch' | 'reward';
  // 解锁的技能ID
  unlocksSkillId?: string;
  unlocksPassiveId?: string;
  unlocksComboId?: string;
  // 前置节点
  prerequisites: string[];
  // 升级所需点数
  cost: number;
  // 节点位置（用于 UI 渲染）
  position: { x: number; y: number };
  // 最大等级
  maxLevel: number;
  // 当前等级
  currentLevel?: number;
}

export interface SkillTreeConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  nodes: SkillTreeNode[];
  // 可分配的最大点数
  maxPoints: number;
  // 树分类：战士/法师/辅助
  class: 'warrior' | 'mage' | 'support' | 'hybrid';
}
