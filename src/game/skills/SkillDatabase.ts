export interface SkillRecord {
  id: string;
  name: string;
  mpCost: number;
  cooldown: number;
  type: string;
  description: string;
}

export const skillDB: Record<string, SkillRecord> = {
  fireball: {
    id: "fireball",
    name: "火球术",
    mpCost: 8,
    cooldown: 2,
    type: "attack",
    description: "发射一颗火球，造成火焰伤害",
  },
  ice_shard: {
    id: "ice_shard",
    name: "冰刺",
    mpCost: 6,
    cooldown: 1.5,
    type: "attack",
    description: "发射冰刺，造成冰冻伤害",
  },
  heal: {
    id: "heal",
    name: "治疗术",
    mpCost: 15,
    cooldown: 5,
    type: "support",
    description: "恢复生命值",
  },
};
