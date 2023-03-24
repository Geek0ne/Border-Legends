/**
 * 边境传说 - 敌人数据定义
 * 包含普通敌人、精英敌人和 BOSS 的数据定义
 */

import { EnemyDef, DropTable } from '../../types';

// ==================== 普通敌人 ====================

export const SKELETON_DEF: EnemyDef = {
  id: 'skeleton',
  name: '骷髅兵',
  type: 'normal',
  hp: 50,
  attack: 10,
  defense: 5,
  speed: 4,
  drops: {
    items: [
      { itemId: 'bone_shard', chance: 0.5 },
      { itemId: 'iron_ore', chance: 0.2 },
      { itemId: 'small_health_potion', chance: 0.3 },
    ],
  },
};

export const WOLF_DEF: EnemyDef = {
  id: 'wolf',
  name: '灰狼',
  type: 'normal',
  hp: 35,
  attack: 14,
  defense: 3,
  speed: 8,
  drops: {
    items: [
      { itemId: 'wolf_pelt', chance: 0.4 },
      { itemId: 'wolf_fang', chance: 0.25 },
    ],
  },
};

export const SLIME_DEF: EnemyDef = {
  id: 'slime',
  name: '史莱姆',
  type: 'normal',
  hp: 20,
  attack: 6,
  defense: 2,
  speed: 2,
  drops: {
    items: [
      { itemId: 'slime_gel', chance: 0.6 },
      { itemId: 'small_mana_potion', chance: 0.15 },
    ],
  },
};

export const GHOUL_DEF: EnemyDef = {
  id: 'ghoul',
  name: '食尸鬼',
  type: 'normal',
  hp: 70,
  attack: 16,
  defense: 8,
  speed: 5,
  drops: {
    items: [
      { itemId: 'rotten_flesh', chance: 0.4 },
      { itemId: 'iron_ore', chance: 0.15 },
      { itemId: 'small_health_potion', chance: 0.2 },
    ],
  },
};

// ==================== 精英敌人 ====================

export const ELITE_SKELETON_KNIGHT_DEF: EnemyDef = {
  id: 'elite_skeleton_knight',
  name: '骷髅骑士',
  type: 'elite',
  hp: 200,
  attack: 30,
  defense: 20,
  speed: 5,
  drops: {
    items: [
      { itemId: 'knight_sword', chance: 0.15 },
      { itemId: 'knight_shield', chance: 0.12 },
      { itemId: 'rare_gem', chance: 0.08 },
      { itemId: 'gold', chance: 1.0 },
    ],
  },
};

export const WOLF_ALPHA_DEF: EnemyDef = {
  id: 'wolf_alpha',
  name: '狼王',
  type: 'elite',
  hp: 150,
  attack: 28,
  defense: 12,
  speed: 10,
  drops: {
    items: [
      { itemId: 'alpha_collar', chance: 0.2 },
      { itemId: 'thick_pelt', chance: 0.3 },
      { itemId: 'rare_gem', chance: 0.1 },
    ],
  },
};

// ==================== BOSS 敌人 ====================

export interface BossDef extends EnemyDef {
  phaseCount: number;
  phaseHPThresholds: number[]; // 百分比阈值
  specialAbilities: string[];
  arenaId?: string;
}

export const DRAGON_DEF: BossDef = {
  id: 'dragon',
  name: '远古巨龙',
  type: 'boss',
  hp: 1000,
  attack: 50,
  defense: 35,
  speed: 6,
  drops: {
    items: [
      { itemId: 'dragon_slayer_blade', chance: 1.0 },
      { itemId: 'dragon_scale_armor', chance: 1.0 },
      { itemId: 'dragon_heart', chance: 1.0 },
      { itemId: 'legendary_gem', chance: 0.5 },
    ],
  },
  phaseCount: 3,
  phaseHPThresholds: [0.66, 0.33],
  specialAbilities: ['fire_breath', 'wing_burst', 'tail_sweep'],
  arenaId: 'dragon_lair',
};

export const DARK_LICH_DEF: BossDef = {
  id: 'dark_lich',
  name: '黑暗巫妖',
  type: 'boss',
  hp: 800,
  attack: 45,
  defense: 25,
  speed: 7,
  drops: {
    items: [
      { itemId: 'lich_staff', chance: 1.0 },
      { itemId: 'soul_gem', chance: 1.0 },
      { itemId: 'legendary_gem', chance: 0.5 },
    ],
  },
  phaseCount: 2,
  phaseHPThresholds: [0.5],
  specialAbilities: ['summon_skeletons', 'freeze', 'life_drain'],
  arenaId: 'lich_tomb',
};

export const WYVERN_DEF: BossDef = {
  id: 'wyvern',
  name: '双足飞龙',
  type: 'boss',
  hp: 1200,
  attack: 55,
  defense: 30,
  speed: 12,
  drops: {
    items: [
      { itemId: 'wyvern_blade', chance: 1.0 },
      { itemId: 'wyvern_wing', chance: 1.0 },
      { itemId: 'legendary_gem', chance: 0.5 },
    ],
  },
  phaseCount: 3,
  phaseHPThresholds: [0.7, 0.35],
  specialAbilities: ['poison_breath', 'aerial_strike', 'earthquake'],
  arenaId: 'wyvern_nest',
};

// ==================== 汇总 ====================

export const NORMAL_ENEMIES: EnemyDef[] = [SKELETON_DEF, WOLF_DEF, SLIME_DEF, GHOUL_DEF];
export const ELITE_ENEMIES: EnemyDef[] = [ELITE_SKELETON_KNIGHT_DEF, WOLF_ALPHA_DEF];
export const BOSS_DEFS: BossDef[] = [DRAGON_DEF, DARK_LICH_DEF, WYVERN_DEF];

export const ALL_ENEMIES: (EnemyDef | BossDef)[] = [...NORMAL_ENEMIES, ...ELITE_ENEMIES, ...BOSS_DEFS];

// ==================== 掉落物品映射 ====================

export const DROP_ITEM_MAP: Record<string, string> = {
  bone_shard: '骨片',
  iron_ore: '铁矿',
  small_health_potion: '初级生命药水',
  wolf_pelt: '狼皮',
  wolf_fang: '狼牙',
  slime_gel: '史莱姆凝胶',
  small_mana_potion: '初级魔力药水',
  rotten_flesh: '腐肉',
  knight_sword: '骑士之剑',
  knight_shield: '骑士之盾',
  rare_gem: '稀有宝石',
  gold: '金币',
  alpha_collar: '狼王项圈',
  thick_pelt: '厚皮',
  dragon_slayer_blade: '屠龙刀',
  dragon_scale_armor: '龙鳞甲',
  dragon_heart: '龙之心',
  legendary_gem: '传说宝石',
  lich_staff: '巫妖法杖',
  soul_gem: '灵魂宝石',
  wyvern_blade: '飞龙之刃',
  wyvern_wing: '飞龙翼',
};
