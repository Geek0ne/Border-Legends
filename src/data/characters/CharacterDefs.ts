/**
 * 边境传说 - 角色数据定义
 * 5个可选角色，各有独特属性、技能和定位
 */
import { CharacterDef } from '../../types';

export type { CharacterDef } from '../../types';

// 战士 - 高攻高防，近战输出
export const WARRIOR_DEF: CharacterDef = {
  id: 'warrior',
  name: '战士',
  icon: '/assets/icons/class-warrior.png',
  className: '战士',
  description: '身披重甲的勇猛战士，擅长近战攻击和高防御战斗',
  stats: { maxHp: 150, maxMp: 40, attack: 25, defense: 20, speed: 8, magic: 5 },
  startingWeapon: 'iron_sword',
  startingSkills: ['slash', 'power_strike', 'fortify'],
};

// 游侠 - 高攻高速度，远程输出
export const RANGER_DEF: CharacterDef = {
  id: 'ranger',
  name: '游侠',
  icon: '/assets/icons/class-ranger.png',
  className: '游侠',
  description: '敏捷的森林猎手，擅长远程攻击和陷阱布置',
  stats: { maxHp: 100, maxMp: 60, attack: 20, defense: 12, speed: 18, magic: 12 },
  startingWeapon: 'hunter_bow',
  startingSkills: ['aimed_shot', 'trap', 'swift_strike'],
};

// 法师 - 高魔法，AOE输出
export const MAGE_DEF: CharacterDef = {
  id: 'mage',
  name: '法师',
  icon: '/assets/icons/class-mage.png',
  className: '法师',
  description: '精通元素魔法的学者，擅长群体伤害和控制',
  stats: { maxHp: 80, maxMp: 100, attack: 8, defense: 8, speed: 10, magic: 28 },
  startingWeapon: 'staff',
  startingSkills: ['fireball', 'ice_shard', 'lightning_bolt'],
};

// 牧师 - 治疗支援，团队核心
export const PRIEST_DEF: CharacterDef = {
  id: 'priest',
  name: '牧师',
  icon: '/assets/icons/class-priest.png',
  className: '牧师',
  description: '神圣的治愈者，能为队友恢复生命并驱散负面效果',
  stats: { maxHp: 110, maxMp: 120, attack: 10, defense: 15, speed: 10, magic: 22 },
  startingWeapon: 'mace',
  startingSkills: ['heal', 'holy_strike', 'purify'],
};

// 暗影刺客 - 高暴击，潜行暗杀
export const ASSASSIN_DEF: CharacterDef = {
  id: 'assassin',
  name: '暗影刺客',
  icon: '/assets/icons/class-assassin.png',
  className: '暗影刺客',
  description: '来自暗影的杀手中，擅长潜行和暴击暗杀',
  stats: { maxHp: 90, maxMp: 50, attack: 22, defense: 10, speed: 22, magic: 8 },
  startingWeapon: 'shadow_blade',
  startingSkills: ['backstab', 'shadow_step', 'poison_dart'],
};

// 所有角色
export const ALL_CHARACTERS: CharacterDef[] = [
  WARRIOR_DEF,
  RANGER_DEF,
  MAGE_DEF,
  PRIEST_DEF,
  ASSASSIN_DEF,
];

// 角色选择 UI 配置
export interface CharacterSelectConfig {
  cardWidth: number;
  cardHeight: number;
  cardSpacing: number;
  cardPositions: { x: number; y: number; scale: number }[];
  selectedScale: number;
  hoverScale: number;
  cardColors: {
    background: number;
    border: number;
    selectedBorder: number;
    hoverBorder: number;
    text: number;
    selectedText: number;
  };
}

export const CHARACTER_SELECT_CONFIG: CharacterSelectConfig = {
  cardWidth: 3,
  cardHeight: 4.5,
  cardSpacing: 4,
  cardPositions: [
    { x: -8, y: 0, scale: 0.85 },
    { x: -3, y: 0, scale: 0.95 },
    { x: 3, y: 0, scale: 1.0 },
    { x: 8, y: 0, scale: 0.95 },
    { x: 13, y: 0, scale: 0.85 },
  ],
  selectedScale: 1.15,
  hoverScale: 1.05,
  cardColors: {
    background: 0x1a1a2e,
    border: 0x4a4a6a,
    selectedBorder: 0xffd700,
    hoverBorder: 0x7a7aaa,
    text: 0xcccccc,
    selectedText: 0xffffff,
  },
};
