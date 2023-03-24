/**
 * 边境传说 — 技能数据库
 * 预定义所有可用技能的配置
 */

import type { SkillDef } from '../../types/combat';

// ==================== Skill Database Types ====================
export interface PassiveSkillDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  effectType: string;
  value: number;
  statBonus?: Record<string, number>;
  triggerCondition?: string;
  stackable?: boolean;
  maxStacks?: number;
}

export interface SkillTreeNode {
  id: string;
  name: string;
  description: string;
  icon?: string;
  nodeType: 'root' | 'branch' | 'passive' | 'skill' | 'reward';
  prerequisites?: string[];
  unlocksPassiveId?: string;
  unlocksSkillId?: string;
  cost?: number;
  position?: { x: number; y: number };
  maxLevel: number;
  currentLevel?: number;
  children?: string[];
}

export interface SkillTreeConfig {
  id: string;
  name: string;
  description: string;
  icon?: string;
  class: string;
  maxPoints: number;
  nodes: SkillTreeNode[];
}

export const SKILL_DATABASE: Record<string, SkillDef> = {
  // ===== 基础攻击 =====
  basic_attack: {
    id: 'basic_attack',
    name: '普通攻击',
    description: '基础的物理攻击',
    cost: 0,
    cooldown: 0,
    duration: 0,
    range: 3,
    areaOfEffect: 0,
    damage: {
      base: 10,
      scaling: 1.0,
      type: 'physical',
      element: 'none',
    },
    effects: [],
    icon: 'sword',
  },

  // ===== 战士技能 =====
  power_strike: {
    id: 'power_strike',
    name: '强力打击',
    description: '凝聚力量的一次重击，造成高额物理伤害',
    cost: 15,
    cooldown: 4,
    duration: 0,
    range: 3,
    areaOfEffect: 0,
    damage: {
      base: 30,
      scaling: 1.5,
      type: 'physical',
      element: 'none',
    },
    effects: [],
    icon: 'strike',
  },

  whirlwind_strike: {
    id: 'whirlwind_strike',
    name: '旋风斩',
    description: '旋转武器攻击周围所有敌人',
    cost: 25,
    cooldown: 8,
    duration: 0,
    range: 5,
    areaOfEffect: 4,
    damage: {
      base: 15,
      scaling: 0.8,
      type: 'physical',
      element: 'none',
    },
    effects: [],
    icon: 'whirlwind',
  },

  shield_bash: {
    id: 'shield_bash',
    name: '盾击',
    description: '用盾牌猛击敌人，可能造成眩晕',
    cost: 12,
    cooldown: 6,
    duration: 0,
    range: 3,
    areaOfEffect: 0,
    damage: {
      base: 12,
      scaling: 0.6,
      type: 'physical',
      element: 'none',
    },
    effects: [
      {
        type: 'debuff',
        target: 'enemy',
        duration: 3,
        value: 0.5,
        status: 'stun',
      },
    ],
    icon: 'shield',
  },

  battle_cry: {
    id: 'battle_cry',
    name: '战吼',
    description: '鼓舞士气，提升自身攻击力',
    cost: 20,
    cooldown: 15,
    duration: 10,
    range: 0,
    areaOfEffect: 0,
    damage: {
      base: 0,
      scaling: 0,
      type: 'physical',
      element: 'none',
    },
    effects: [
      {
        type: 'buff',
        target: 'self',
        duration: 10,
        value: 50,
      },
    ],
    icon: 'cry',
  },

  // ===== 法师技能 =====
  fireball: {
    id: 'fireball',
    name: '火球术',
    description: '发射一团火焰，对目标造成火焰伤害',
    cost: 20,
    cooldown: 3,
    duration: 0,
    range: 12,
    areaOfEffect: 0,
    damage: {
      base: 25,
      scaling: 1.8,
      type: 'magic',
      element: 'fire',
    },
    effects: [
      {
        type: 'debuff',
        target: 'enemy',
        duration: 3,
        value: 5,
        status: 'burn',
      },
    ],
    icon: 'fireball',
  },

  ice_shard: {
    id: 'ice_shard',
    name: '冰晶术',
    description: '发射冰锥，造成冰霜伤害并减速',
    cost: 18,
    cooldown: 4,
    duration: 0,
    range: 10,
    areaOfEffect: 0,
    damage: {
      base: 20,
      scaling: 1.6,
      type: 'magic',
      element: 'ice',
    },
    effects: [
      {
        type: 'debuff',
        target: 'enemy',
        duration: 4,
        value: 0.4,
        status: 'slow',
      },
    ],
    icon: 'ice',
  },

  lightning_bolt: {
    id: 'lightning_bolt',
    name: '闪电术',
    description: '召唤闪电劈向敌人，造成高额雷元素伤害',
    cost: 30,
    cooldown: 6,
    duration: 0,
    range: 15,
    areaOfEffect: 0,
    damage: {
      base: 40,
      scaling: 2.0,
      type: 'magic',
      element: 'lightning',
    },
    effects: [],
    icon: 'lightning',
  },

  frost_nova: {
    id: 'frost_nova',
    name: '霜冻新星',
    description: '释放寒冰能量，冻结周围所有敌人',
    cost: 35,
    cooldown: 12,
    duration: 0,
    range: 8,
    areaOfEffect: 5,
    damage: {
      base: 18,
      scaling: 1.4,
      type: 'magic',
      element: 'ice',
    },
    effects: [
      {
        type: 'debuff',
        target: 'all_enemies',
        duration: 2,
        value: 0,
        status: 'frozen',
      },
    ],
    icon: 'nova',
  },

  // ===== 治疗技能 =====
  heal: {
    id: 'heal',
    name: '治疗术',
    description: '恢复目标生命值',
    cost: 20,
    cooldown: 5,
    duration: 0,
    range: 8,
    areaOfEffect: 0,
    heal: {
      base: 40,
      scaling: 1.2,
    },
    damage: {
      base: 0,
      scaling: 0,
      type: 'magic',
      element: 'none',
    },
    effects: [],
    icon: 'heal',
  },

  great_heal: {
    id: 'great_heal',
    name: '大治疗术',
    description: '强力治疗，恢复大量生命值',
    cost: 45,
    cooldown: 15,
    duration: 0,
    range: 10,
    areaOfEffect: 0,
    heal: {
      base: 100,
      scaling: 1.5,
    },
    damage: {
      base: 0,
      scaling: 0,
      type: 'magic',
      element: 'none',
    },
    effects: [],
    icon: 'heal_big',
  },

  group_heal: {
    id: 'group_heal',
    name: '群体治疗',
    description: '治疗范围内所有友方单位',
    cost: 40,
    cooldown: 12,
    duration: 0,
    range: 10,
    areaOfEffect: 6,
    heal: {
      base: 25,
      scaling: 0.8,
    },
    damage: {
      base: 0,
      scaling: 0,
      type: 'magic',
      element: 'none',
    },
    effects: [],
    icon: 'group_heal',
  },

  // ===== 辅助技能 =====
  mana_shield: {
    id: 'mana_shield',
    name: '魔力护盾',
    description: '消耗 MP 形成护盾，抵挡伤害',
    cost: 25,
    cooldown: 10,
    duration: 8,
    range: 0,
    areaOfEffect: 0,
    damage: {
      base: 0,
      scaling: 0,
      type: 'magic',
      element: 'lightning',
    },
    effects: [
      {
        type: 'buff',
        target: 'self',
        duration: 8,
        value: 30,
        status: 'shield',
      },
    ],
    icon: 'mana_shield',
  },

  rage: {
    id: 'rage',
    name: '狂怒',
    description: '进入狂怒状态，提升攻击速度和暴击率',
    cost: 15,
    cooldown: 20,
    duration: 6,
    range: 0,
    areaOfEffect: 0,
    damage: {
      base: 0,
      scaling: 0,
      type: 'physical',
      element: 'none',
    },
    effects: [
      {
        type: 'buff',
        target: 'self',
        duration: 6,
        value: 40,
        status: 'rage',
      },
    ],
    icon: 'rage',
  },

  // ===== 终极技能 =====
  meteor: {
    id: 'meteor',
    name: '陨石术',
    description: '召唤陨石从天而降，对大范围敌人造成毁灭性伤害',
    cost: 60,
    cooldown: 30,
    duration: 0,
    range: 15,
    areaOfEffect: 6,
    damage: {
      base: 80,
      scaling: 2.5,
      type: 'magic',
      element: 'fire',
    },
    effects: [
      {
        type: 'debuff',
        target: 'all_enemies',
        duration: 3,
        value: 10,
        status: 'burn',
      },
    ],
    icon: 'meteor',
  },

  earth_shock: {
    id: 'earth_shock',
    name: '大地之怒',
    description: '引发地震，对前方扇形区域造成物理伤害并击退',
    cost: 35,
    cooldown: 15,
    duration: 0,
    range: 10,
    areaOfEffect: 8,
    damage: {
      base: 35,
      scaling: 1.2,
      type: 'physical',
      element: 'none',
    },
    effects: [],
    icon: 'earth',
  },
};

export function getSkillById(id: string): SkillDef | undefined {
  return SKILL_DATABASE[id];
}

export function getAllSkills(): SkillDef[] {
  return Object.values(SKILL_DATABASE);
}





// ==================== 被动技能数据库 ====================
export const PASSIVE_SKILL_DATABASE: Record<string, PassiveSkillDef> = {
  // 战士被动
  warrior_might: {
    id: 'warrior_might',
    name: '战士之力',
    description: '每损失10%生命值，攻击力提升5%',
    icon: 'warrior_might',
    effectType: 'statBonus',
    value: 5,
    statBonus: { attack: 5 },
    triggerCondition: 'hp_below_percent',
    stackable: true,
    maxStacks: 10,
  },
  iron_skin: {
    id: 'iron_skin',
    name: '铁壁',
    description: '提升20%防御力',
    icon: 'iron_skin',
    effectType: 'statBonus',
    value: 20,
    statBonus: { defense: 20 },
  },
  fury_genesis: {
    id: 'fury_genesis',
    name: '狂怒起源',
    description: '每次攻击有15%概率获得1层狂怒，每层增加3%攻击力',
    icon: 'fury',
    effectType: 'critChance',
    value: 15,
    statBonus: { attack: 3 },
    stackable: true,
    maxStacks: 5,
  },
  // 法师被动
  arcane_mastery: {
    id: 'arcane_mastery',
    name: '奥术掌控',
    description: '提升15%法术伤害，减少5%技能消耗',
    icon: 'arcane',
    effectType: 'damageModifier',
    value: 15,
    statBonus: { magic: 15, mpCostReduction: 5 },
  },
  mana_flow: {
    id: 'mana_flow',
    name: '魔力流动',
    description: '每秒恢复1%最大MP',
    icon: 'mana_flow',
    effectType: 'mpRegen',
    value: 1,
  },
  frost_affinity: {
    id: 'frost_affinity',
    name: '冰霜亲和',
    description: '冰霜技能额外造成10%伤害并延长减速效果1秒',
    icon: 'frost',
    effectType: 'damageModifier',
    value: 10,
  },
  // 辅助被动
  empathy: {
    id: 'empathy',
    name: '共情',
    description: '治疗技能效果提升20%',
    icon: 'empathy',
    effectType: 'healModifier',
    value: 20,
  },
  vitality_link: {
    id: 'vitality_link',
    name: '生命链接',
    description: '每秒恢复1%最大HP',
    icon: 'vitality',
    effectType: 'hpRegen',
    value: 1,
  },
  // 通用被动
  keen_eye: {
    id: 'keen_eye',
    name: '锐眼',
    description: '暴击率提升5%',
    icon: 'keen_eye',
    effectType: 'critChance',
    value: 5,
  },
  agile_feet: {
    id: 'agile_feet',
    name: '敏捷',
    description: '闪避率提升3%',
    icon: 'agile',
    effectType: 'dodgeChance',
    value: 3,
  },
  lucky_find: {
    id: 'lucky_find',
    name: '幸运发现',
    description: '掉落率提升10%，金币获取提升15%',
    icon: 'lucky',
    effectType: 'xpBonus',
    value: 10,
    statBonus: { goldBonus: 15 },
  },
  quick_learning: {
    id: 'quick_learning',
    name: '快速学习',
    description: '经验获取提升20%',
    icon: 'quick_learning',
    effectType: 'xpBonus',
    value: 20,
  },
  cooldown_mastery: {
    id: 'cooldown_mastery',
    name: '冷却掌控',
    description: '所有技能冷却时间减少10%',
    icon: 'cooldown',
    effectType: 'cooldownReduction',
    value: 10,
  },
};

export function getPassiveSkillById(id: string): PassiveSkillDef | undefined {
  return PASSIVE_SKILL_DATABASE[id];
}

export function getAllPassiveSkills(): PassiveSkillDef[] {
  return Object.values(PASSIVE_SKILL_DATABASE);
}

// ==================== 技能树配置 ====================
export const WARRIOR_SKILL_TREE: SkillTreeConfig = {
  id: 'warrior_tree',
  name: '战士技能树',
  description: '专注近战物理伤害与生存能力的技能树',
  icon: 'warrior_tree',
  class: 'warrior',
  maxPoints: 50,
  nodes: [
    {
      id: 'w_root',
      name: '战士之心',
      description: '战士技能树的核心节点',
      icon: 'heart',
      nodeType: 'branch',
      prerequisites: [],
      cost: 0,
      position: { x: 400, y: 50 },
      maxLevel: 1,
      currentLevel: 0,
    },
    {
      id: 'w_power',
      name: '力量训练',
      description: '提升攻击力10%',
      icon: 'strength',
      nodeType: 'passive',
      unlocksPassiveId: 'warrior_might',
      prerequisites: ['w_root'],
      cost: 5,
      position: { x: 200, y: 120 },
      maxLevel: 5,
      currentLevel: 0,
    },
    {
      id: 'w_tough',
      name: '坚韧',
      description: '提升最大HP20%',
      icon: 'tough',
      nodeType: 'passive',
      unlocksPassiveId: 'iron_skin',
      prerequisites: ['w_root'],
      cost: 5,
      position: { x: 600, y: 120 },
      maxLevel: 5,
      currentLevel: 0,
    },
    {
      id: 'w_whirlwind',
      name: '旋风斩精通',
      description: '解锁旋风斩技能',
      icon: 'whirlwind',
      nodeType: 'skill',
      unlocksSkillId: 'whirlwind_strike',
      prerequisites: ['w_power'],
      cost: 8,
      position: { x: 100, y: 220 },
      maxLevel: 1,
      currentLevel: 0,
    },
    {
      id: 'w_shield',
      name: '盾牌精通',
      description: '解锁盾击技能，提升格挡率15%',
      icon: 'shield',
      nodeType: 'skill',
      unlocksSkillId: 'shield_bash',
      prerequisites: ['w_tough'],
      cost: 8,
      position: { x: 700, y: 220 },
      maxLevel: 1,
      currentLevel: 0,
    },
    {
      id: 'w_battle_cry',
      name: '战吼大师',
      description: '解锁战吼技能，提升战吼效果30%',
      icon: 'battle_cry',
      nodeType: 'skill',
      unlocksSkillId: 'battle_cry',
      prerequisites: ['w_power', 'w_tough'],
      cost: 10,
      position: { x: 400, y: 220 },
      maxLevel: 3,
      currentLevel: 0,
    },
    {
      id: 'w_fury',
      name: '狂怒起源',
      description: '解锁狂怒被动',
      icon: 'fury',
      nodeType: 'passive',
      unlocksPassiveId: 'fury_genesis',
      prerequisites: ['w_battle_cry'],
      cost: 12,
      position: { x: 400, y: 320 },
      maxLevel: 5,
      currentLevel: 0,
    },
    {
      id: 'w_ultimate',
      name: '终极力量',
      description: '终极节点：解锁旋风斩终极形态',
      icon: 'ultimate',
      nodeType: 'reward',
      prerequisites: ['w_fury', 'w_whirlwind', 'w_shield'],
      cost: 15,
      position: { x: 400, y: 420 },
      maxLevel: 1,
      currentLevel: 0,
    },
  ],
};

export const MAGE_SKILL_TREE: SkillTreeConfig = {
  id: 'mage_tree',
  name: '法师技能树',
  description: '专注法术伤害与控制能力的技能树',
  icon: 'mage_tree',
  class: 'mage',
  maxPoints: 50,
  nodes: [
    {
      id: 'm_root',
      name: '奥术之源',
      description: '法师技能树的核心节点',
      icon: 'arcane',
      nodeType: 'branch',
      prerequisites: [],
      cost: 0,
      position: { x: 400, y: 50 },
      maxLevel: 1,
      currentLevel: 0,
    },
    {
      id: 'm_fire',
      name: '火焰精通',
      description: '火焰技能伤害提升15%',
      icon: 'fire_mastery',
      nodeType: 'passive',
      unlocksPassiveId: 'frost_affinity',
      prerequisites: ['m_root'],
      cost: 5,
      position: { x: 200, y: 120 },
      maxLevel: 5,
      currentLevel: 0,
    },
    {
      id: 'm_mana',
      name: '魔力源泉',
      description: '提升最大MP30%，MP回复提升10%',
      icon: 'mana_source',
      nodeType: 'passive',
      unlocksPassiveId: 'mana_flow',
      prerequisites: ['m_root'],
      cost: 5,
      position: { x: 600, y: 120 },
      maxLevel: 5,
      currentLevel: 0,
    },
    {
      id: 'm_fireball',
      name: '火球精通',
      description: '解锁火球术技能',
      icon: 'fireball',
      nodeType: 'skill',
      unlocksSkillId: 'fireball',
      prerequisites: ['m_fire'],
      cost: 8,
      position: { x: 100, y: 220 },
      maxLevel: 1,
      currentLevel: 0,
    },
    {
      id: 'm_ice',
      name: '冰霜掌控',
      description: '解锁冰霜新星技能',
      icon: 'frost_nova',
      nodeType: 'skill',
      unlocksSkillId: 'frost_nova',
      prerequisites: ['m_mana'],
      cost: 8,
      position: { x: 700, y: 220 },
      maxLevel: 1,
      currentLevel: 0,
    },
    {
      id: 'm_arcane',
      name: '奥术掌控',
      description: '解锁奥术掌控被动',
      icon: 'arcane_mastery',
      nodeType: 'passive',
      unlocksPassiveId: 'arcane_mastery',
      prerequisites: ['m_fireball', 'm_ice'],
      cost: 10,
      position: { x: 400, y: 220 },
      maxLevel: 3,
      currentLevel: 0,
    },
    {
      id: 'm_meteor',
      name: '陨石术',
      description: '解锁陨石术终极技能',
      icon: 'meteor',
      nodeType: 'skill',
      unlocksSkillId: 'meteor',
      prerequisites: ['m_arcane'],
      cost: 15,
      position: { x: 400, y: 320 },
      maxLevel: 1,
      currentLevel: 0,
    },
    {
      id: 'm_ultimate',
      name: '奥术终极',
      description: '终极节点：解锁奥术终极形态',
      icon: 'ultimate',
      nodeType: 'reward',
      prerequisites: ['m_meteor'],
      cost: 15,
      position: { x: 400, y: 420 },
      maxLevel: 1,
      currentLevel: 0,
    },
  ],
};

export const DEFAULT_SKILL_TREES: SkillTreeConfig[] = [
  WARRIOR_SKILL_TREE,
  MAGE_SKILL_TREE,
];
