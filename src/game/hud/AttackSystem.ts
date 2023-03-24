/**
 * 边境传说 — 攻击系统 (AttackSystem)
 *
 * 职责：
 * 1. 伤害计算（基础伤害 + 属性加成 + 暴击 + 格挡 + 闪避）
 * 2. 命中判定（距离检测、视野检测、命中概率）
 * 3. 命中反馈（浮字、打击特效、击退）
 * 4. 连击系统
 * 5. 多目标攻击（AOE 判定）
 *
 * 与外部协作：
 * - CombatSystem: 注册实体、执行伤害、治疗
 * - DamageNumbersRenderer: 显示浮动伤害数字
 * - EffectManager: 触发粒子/屏幕效果
 * - KnockbackSystem: 施加击退
 */

import * as THREE from 'three';
import {
  CombatStats,
  StatusEffect,
  SkillDef,
  CombatState,
} from '../../types/combat';
import { FloatingText } from '../../types';
import { generateId } from '../../utils';

// ==================== 攻击类型 ====================
export type AttackType = 'normal' | 'skill' | 'counter' | 'crit' | 'dodge';

// ==================== 攻击事件 ====================
export interface AttackEvent {
  id: string;
  timestamp: number;

  // 攻击者信息
  attackerId: string;
  attackerName: string;
  attackerPosition: { x: number; z: number };

  // 目标信息
  targetId: string;
  targetName: string;
  targetPosition: { x: number; z: number };

  // 伤害数据
  damage: number;
  baseDamage: number;
  damageType: 'physical' | 'magic' | 'true';
  isCrit: boolean;
  isDodged: boolean;
  isBlocked: boolean;
  isMiss: boolean;

  // 特殊属性
  knockbackForce?: number;
  knockbackDirection?: { x: number; z: number };
  statusEffects?: StatusEffect[];
  comboCount?: number;

  // 视觉反馈
  floatingText: string;
  screenEffect?: 'hit' | 'damage' | 'heal' | 'death';
}

// ==================== 连击状态 ====================
interface ComboState {
  attackerId: string;
  count: number;
  lastHitTime: number;
  maxCount: number;
}

// ==================== 攻击者信息 ====================
interface AttackerInfo {
  id: string;
  name: string;
  position: { x: number; z: number };
  stats: CombatStats;
  effects: StatusEffect[];
  state: CombatState;
  isAlive: boolean;
}

// ==================== 攻击配置 ====================
export interface AttackConfig {
  // 攻击范围
  range: number;
  // 最大高度差
  maxHeightDiff?: number;
  // AOE 半径（0 表示单体）
  aoeRadius?: number;
  // 命中概率 (0~1)
  hitRate?: number;
  // 暴击概率 (0~1)
  critRate?: number;
  // 暴击倍率
  critMultiplier?: number;
  // 连击窗口（秒）
  comboWindow?: number;
}

const DEFAULT_CONFIG: Required<AttackConfig> = {
  range: 2.5,
  maxHeightDiff: 2.0,
  aoeRadius: 0,
  hitRate: 0.95,
  critRate: 0.15,
  critMultiplier: 2.0,
  comboWindow: 2.0,
};

// ==================== 攻击系统 ====================
export class AttackSystem {
  private config: Required<AttackConfig>;

  // 连击系统
  private combos: Map<string, ComboState> = new Map();
  private comboWindow: number;

  // 回调（与 HUD / 特效系统通信）
  private onDamageNumber?: (
    x: number, z: number, value: number,
    isCrit: boolean, isHeal: boolean
  ) => void;
  private onFloatingText?: (text: FloatingText) => void;
  private onScreenEffect?: (effect: 'hit' | 'damage' | 'heal' | 'death') => void;
  private onKnockback?: (
    targetId: string, force: number, direction: { x: number; z: number }
  ) => void;
  private onAttackEvent?: (event: AttackEvent) => void;

  // 注册的战斗者
  private combatants: Map<string, AttackerInfo> = new Map();

  constructor(config?: Partial<AttackConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.comboWindow = this.config.comboWindow;
  }

  // ==================== 注册 / 注销 ====================

  public registerCombatant(
    id: string,
    name: string,
    position: THREE.Vector3,
    stats: CombatStats,
    effects: StatusEffect[],
    state: CombatState,
    isAlive: boolean = true
  ): void {
    this.combatants.set(id, {
      id,
      name,
      position: { x: position.x, z: position.z },
      stats: { ...stats },
      effects: [...effects],
      state,
      isAlive,
    });
  }

  public unregisterCombatant(id: string): void {
    this.combatants.delete(id);
    this.combos.delete(id);
  }

  // ==================== 回调注册 ====================

  public setOnDamageNumber(
    cb: (x: number, z: number, value: number, isCrit: boolean, isHeal: boolean) => void
  ): void {
    this.onDamageNumber = cb;
  }

  public setOnFloatingText(cb: (text: FloatingText) => void): void {
    this.onFloatingText = cb;
  }

  public setOnScreenEffect(
    cb: (effect: 'hit' | 'damage' | 'heal' | 'death') => void
  ): void {
    this.onScreenEffect = cb;
  }

  public setOnKnockback(
    cb: (targetId: string, force: number, direction: { x: number; z: number }) => void
  ): void {
    this.onKnockback = cb;
  }

  public setOnAttackEvent(cb: (event: AttackEvent) => void): void {
    this.onAttackEvent = cb;
  }

  // ==================== 核心攻击方法 ====================

  /**
   * 执行普通攻击（单体）
   * @returns 攻击事件，null 表示未命中
   */
  public normalAttack(
    attackerId: string,
    targetId: string,
    skill?: SkillDef
  ): AttackEvent | null {
    const attacker = this.combatants.get(attackerId);
    const target = this.combatants.get(targetId);
    if (!attacker || !target || !attacker.isAlive || !target.isAlive) return null;

    // 距离检测
    if (!this.checkRange(attacker.position, target.position)) {
      return null;
    }

    // 命中判定
    if (this.config.hitRate < 1 && Math.random() > this.config.hitRate) {
      const event = this.createMissEvent(attacker, target);
      this.notify(event);
      return event;
    }

    // 计算最终伤害
    const finalDamage = this.calculateFinalDamage(attacker.stats, target.stats, skill);

    // 更新连击
    const combo = this.updateCombo(attackerId);
    const comboMultiplier = combo.count > 1 ? 1 + (combo.count - 1) * 0.1 : 1;
    const totalDamage = Math.floor(finalDamage * comboMultiplier);

    // 格挡判定
    const isBlocked = Math.random() < (target.stats.defense ?? 0) * 0.002;
    const damageAfterBlock = isBlocked ? Math.floor(totalDamage * 0.5) : totalDamage;

    const event = this.createAttackEvent(
      attacker, target, damageAfterBlock, finalDamage, 'normal',
      skill, false, false, isBlocked, combo.count
    );

    this.notify(event);
    return event;
  }

  /**
   * 执行技能攻击（可 AOE）
   * @returns 命中目标的攻击事件列表
   */
  public skillAttack(
    attackerId: string,
    targetId: string,
    skill: SkillDef
  ): AttackEvent[] {
    const attacker = this.combatants.get(attackerId);
    if (!attacker || !attacker.isAlive) return [];

    const targets = this.getTargetsInArea(attacker.position, targetId, skill);
    const events: AttackEvent[] = [];

    for (const target of targets) {
      const finalDamage = this.calculateFinalDamage(attacker.stats, target.stats, skill);
      const event = this.createAttackEvent(
        attacker, target, finalDamage, finalDamage, 'skill',
        skill, false, false, false, 0
      );
      events.push(event);
      this.notify(event);
    }

    return events;
  }

  /**
   * 执行暴击攻击
   */
  public criticalAttack(
    attackerId: string,
    targetId: string,
    skill?: SkillDef
  ): AttackEvent | null {
    const attacker = this.combatants.get(attackerId);
    const target = this.combatants.get(targetId);
    if (!attacker || !target || !attacker.isAlive) return null;

    const finalDamage = this.calculateFinalDamage(attacker.stats, target.stats, skill);
    const critMultiplier = this.config.critMultiplier;
    const totalDamage = Math.floor(finalDamage * critMultiplier);

    const event = this.createAttackEvent(
      attacker, target, totalDamage, finalDamage, 'crit',
      skill, true, false, false, 0
    );
    this.notify(event);
    this.onScreenEffect?.('damage');
    return event;
  }

  /**
   * 执行闪避反击
   */
  public dodgeAttack(
    attackerId: string,
    targetId: string,
    skill?: SkillDef
  ): AttackEvent | null {
    const attacker = this.combatants.get(attackerId);
    const target = this.combatants.get(targetId);
    if (!attacker || !target || !attacker.isAlive) return null;

    const finalDamage = this.calculateFinalDamage(attacker.stats, target.stats, skill);
    const totalDamage = Math.floor(finalDamage * 1.2);

    const event = this.createAttackEvent(
      attacker, target, totalDamage, finalDamage, 'dodge',
      skill, false, true, false, 0
    );
    this.notify(event);
    return event;
  }

  /**
   * 执行反击攻击
   */
  public counterAttack(
    attackerId: string,
    targetId: string,
    skill?: SkillDef
  ): AttackEvent | null {
    const attacker = this.combatants.get(attackerId);
    const target = this.combatants.get(targetId);
    if (!attacker || !target || !attacker.isAlive) return null;

    const finalDamage = this.calculateFinalDamage(attacker.stats, target.stats, skill);
    const totalDamage = Math.floor(finalDamage * 1.5);

    const event = this.createAttackEvent(
      attacker, target, totalDamage, finalDamage, 'counter',
      skill, false, false, false, 0
    );
    this.notify(event);
    this.onScreenEffect?.('hit');
    return event;
  }

  /**
   * 治疗目标
   */
  public healTarget(
    targetId: string,
    healAmount: number,
    isCrit: boolean = false
  ): void {
    const target = this.combatants.get(targetId);
    if (!target || !target.isAlive) return;

    const finalHeal = isCrit ? Math.floor(healAmount * 1.5) : healAmount;
    this.onDamageNumber?.(
      target.position.x,
      target.position.z,
      finalHeal,
      false,
      true
    );
  }

  // ==================== 多目标攻击 ====================

  /**
   * AOE 攻击（以 attacker 为中心、指定半径内的所有敌人）
   * @returns 命中目标的攻击事件列表
   */
  public aoeAttack(
    attackerId: string,
    center: { x: number; z: number },
    radius: number
  ): AttackEvent[] {
    const attacker = this.combatants.get(attackerId);
    if (!attacker || !attacker.isAlive) return [];

    const targets = this.getTargetsInRadius(attacker, center, radius);
    const events: AttackEvent[] = [];

    for (const target of targets) {
      const finalDamage = this.calculateFinalDamage(attacker.stats, target.stats, undefined);
      const event = this.createAttackEvent(
        attacker, target, finalDamage, finalDamage, 'normal',
        undefined, false, false, false, 0
      );
      events.push(event);
      this.notify(event);
    }

    return events;
  }

  /**
   * 获取指定范围内所有存活目标
   */
  public getTargetsInRadius(
    attacker: AttackerInfo,
    center: { x: number; z: number },
    radius: number
  ): AttackerInfo[] {
    const targets: AttackerInfo[] = [];
    this.combatants.forEach((c) => {
      if (c.id === attacker.id || !c.isAlive) return;
      const dx = c.position.x - center.x;
      const dz = c.position.z - center.z;
      if (dx * dx + dz * dz <= radius * radius) {
        targets.push(c);
      }
    });
    return targets;
  }

  /**
   * 获取技能影响范围内的所有目标
   */
  private getTargetsInArea(
    attackerPosition: { x: number; z: number },
    targetId: string,
    skill: SkillDef,
    radius: number = 0
  ): AttackerInfo[] {
    const finalRadius = radius || (skill.areaOfEffect || 0);
    if (finalRadius > 0) {
      return this.getTargetsInRadius(
        {
          id: '',
          name: '',
          position: attackerPosition,
          stats: {} as CombatStats,
          effects: [],
          state: 'idle' as CombatState,
          isAlive: true,
        },
        attackerPosition,
        finalRadius
      );
    }

    const target = this.combatants.get(targetId);
    if (!target || !target.isAlive) return [];
    return [target];
  }

  // ==================== 连击系统 ====================

  /**
   * 更新连击计数
   */
  public updateCombo(attackerId: string): ComboState {
    const now = Date.now();
    let combo = this.combos.get(attackerId);

    if (combo && (now - combo.lastHitTime) / 1000 > this.comboWindow) {
      combo = { attackerId, count: 0, lastHitTime: now, maxCount: combo.count };
    } else if (!combo) {
      combo = { attackerId, count: 0, lastHitTime: now, maxCount: 0 };
    }

    combo.count++;
    combo.lastHitTime = now;
    this.combos.set(attackerId, combo);
    return combo;
  }

  /**
   * 重置连击（目标死亡、攻击中断等）
   */
  public resetCombo(attackerId: string): void {
    this.combos.delete(attackerId);
  }

  /**
   * 获取当前连击数
   */
  public getComboCount(attackerId: string): number {
    const combo = this.combos.get(attackerId);
    return combo ? combo.count : 0;
  }

  /**
   * 获取连击倍率
   */
  public getComboMultiplier(attackerId: string): number {
    const count = this.getComboCount(attackerId);
    return count > 0 ? 1 + (count - 1) * 0.1 : 1;
  }

  // ==================== 伤害计算 ====================

  /**
   * 计算最终伤害（含暴击、格挡等修正）
   */
  private calculateFinalDamage(
    attackerStats: CombatStats,
    targetStats: CombatStats,
    skill?: SkillDef
  ): number {
    const baseDamage = skill?.damage.base || 10;
    const scaling = skill?.damage.scaling || 0;

    // 基础伤害 = 基础 + 属性加成
    let damage = baseDamage + attackerStats.attack * scaling;

    // 暴击判定
    const critRate = this.config.critRate;
    const isCrit = Math.random() < critRate;
    if (isCrit) {
      damage *= this.config.critMultiplier;
    }

    return Math.max(1, Math.floor(damage));
  }

  // ==================== 距离/范围检测 ====================

  /**
   * 检查攻击者到目标的距离是否在有效范围内
   */
  private checkRange(
    attackerPos: { x: number; z: number },
    targetPos: { x: number; z: number }
  ): boolean {
    const dx = targetPos.x - attackerPos.x;
    const dz = targetPos.z - attackerPos.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    return distance <= this.config.range;
  }

  // ==================== 攻击事件创建 & 通知 ====================

  /**
   * 将 SkillEffect 映射为 StatusEffect
   */
  private mapSkillEffectToStatusEffect(
    type: 'buff' | 'debuff' | 'damage' | 'heal' | 'status',
    duration: number | undefined,
    value: number | undefined
  ): StatusEffect | null {
    const statusTypeMap: Record<string, 'stun' | 'slow' | 'bleed' | 'burn' | 'frozen' | 'poison' | 'rage' | 'shield'> = {
      buff: 'shield',
      debuff: 'poison',
      damage: 'bleed',
      heal: 'rage',
      status: 'stun',
    };

    const status = statusTypeMap[type];
    if (!status) return null;

    return {
      type: status,
      duration: duration || 0,
      tickDamage: value,
      tickInterval: 1,
      stackCount: 1,
      sourceId: '',
    };
  }

  /**
   * 创建攻击事件
   */
  private createAttackEvent(
    attacker: AttackerInfo,
    target: AttackerInfo,
    totalDamage: number,
    baseDamage: number,
    attackType: AttackType,
    skill?: SkillDef,
    isCrit: boolean = false,
    isDodged: boolean = false,
    isBlocked: boolean = false,
    comboCount: number = 0
  ): AttackEvent {
    const dx = target.position.x - attacker.position.x;
    const dz = target.position.z - attacker.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz) || 1;
    const knockbackDir = { x: dx / dist, z: dz / dist };

    // 将 SkillEffect 转换为 StatusEffect（兼容类型差异）
    const statusEffects: StatusEffect[] = (skill?.effects ?? [])
      .map((e) => this.mapSkillEffectToStatusEffect(e.type, e.duration, e.value))
      .filter((s): s is StatusEffect => s !== null);

    return {
      id: generateId(),
      timestamp: Date.now(),
      attackerId: attacker.id,
      attackerName: attacker.name,
      attackerPosition: attacker.position,
      targetId: target.id,
      targetName: target.name,
      targetPosition: target.position,
      damage: totalDamage,
      baseDamage,
      damageType: skill?.damage.type ?? 'physical',
      isCrit,
      isDodged,
      isBlocked,
      isMiss: false,
      knockbackForce: 2.0,
      knockbackDirection: knockbackDir,
      statusEffects,
      comboCount,
      floatingText: isCrit ? `${totalDamage} CRIT!` : `${totalDamage}`,
      screenEffect: 'damage',
    };
  }

  /**
   * 创建 MISS 事件
   */
  private createMissEvent(
    attacker: AttackerInfo,
    target: AttackerInfo
  ): AttackEvent {
    return {
      id: generateId(),
      timestamp: Date.now(),
      attackerId: attacker.id,
      attackerName: attacker.name,
      attackerPosition: attacker.position,
      targetId: target.id,
      targetName: target.name,
      targetPosition: target.position,
      damage: 0,
      baseDamage: 0,
      damageType: 'physical',
      isCrit: false,
      isDodged: false,
      isBlocked: false,
      isMiss: true,
      knockbackForce: 0,
      knockbackDirection: { x: 0, z: 0 },
      statusEffects: [],
      comboCount: 0,
      floatingText: 'MISS',
      screenEffect: undefined,
    };
  }

  /**
   * 通知所有回调
   */
  private notify(event: AttackEvent): void {
    // 浮动伤害数字
    this.onDamageNumber?.(
      event.targetPosition.x,
      event.targetPosition.z,
      event.damage,
      event.isCrit,
      false
    );

    // 浮动文字
    if (event.floatingText && event.damage > 0) {
      const floatingText: FloatingText = {
        text: event.floatingText,
        position: event.targetPosition,
        color: event.isCrit ? 0xff3333 : 0xffcc00,
        lifetime: 2.0,
      };
      this.onFloatingText?.(floatingText);
    }

    // 屏幕效果
    if (event.screenEffect) {
      this.onScreenEffect?.(event.screenEffect);
    }

    // 击退
    if (event.knockbackForce && event.knockbackDirection) {
      this.onKnockback?.(
        event.targetId,
        event.knockbackForce,
        event.knockbackDirection
      );
    }

    // 攻击事件（供日志/调试使用）
    this.onAttackEvent?.(event);
  }

  // ==================== 统计信息 ====================

  /**
   * 获取所有连击状态
   */
  public getAllCombos(): Map<string, ComboState> {
    return new Map(this.combos);
  }

  /**
   * 获取已注册的战斗者数量
   */
  public getCombatantCount(): number {
    return this.combatants.size;
  }

  /**
   * 获取存活战斗者列表
   */
  public getAliveCombatants(): Array<{
    id: string;
    name: string;
    position: { x: number; z: number };
    stats: CombatStats;
  }> {
    return Array.from(this.combatants.values())
      .filter((c) => c.isAlive)
      .map((c) => ({
        id: c.id,
        name: c.name,
        position: c.position,
        stats: c.stats,
      }));
  }
}