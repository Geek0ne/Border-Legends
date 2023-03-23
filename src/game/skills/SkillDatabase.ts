/**
 * 边境传说 — 技能数据库
 * 预定义所有可用技能的配置
 */

import type { SkillDef } from '../../types/combat';

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




