/**
 * 边境传说 - 物品数据定义
 * 包含所有可装备物品、消耗品、材料和任务物品的数据
 */

import { ItemDef, ItemType, Rarity, EquipmentSlot } from '../../types';

// ==================== 武器 ====================

export const IRON_SWORD: ItemDef = {
  id: 'iron_sword',
  name: '铁剑',
  type: 'weapon',
  rarity: 'common',
  description: '一把普通的铁制短剑，适合初学者使用。',
  icon: '/assets/icons/iron_sword.png',
  isStackable: false,
  isEquipment: true,
  isConsumable: false,
  equipSlot: 'mainHand',
  attack: 5,
  defense: 0,
  magic: 0,
  speed: 0,
  dodgeRate: 0,
  critRate: 0,
  critDamage: 0,
  maxDurability: 100,
  requiredLevel: 1,
  baseValue: 20,
};

export const HUNTER_BOW: ItemDef = {
  id: 'hunter_bow',
  name: '猎手之弓',
  type: 'weapon',
  rarity: 'common',
  description: '猎人使用的木制长弓。',
  icon: '/assets/icons/hunter_bow.png',
  isStackable: false,
  isEquipment: true,
  isConsumable: false,
  equipSlot: 'mainHand',
  attack: 6,
  defense: 0,
  magic: 0,
  speed: 2,
  dodgeRate: 0,
  critRate: 2,
  critDamage: 0,
  maxDurability: 80,
  requiredLevel: 1,
  baseValue: 30,
};

export const WARRIOR_SWORD: ItemDef = {
  id: 'warrior_sword',
  name: '勇士之剑',
  type: 'weapon',
  rarity: 'uncommon',
  description: '经过锻造强化的战士之剑。',
  icon: '/assets/icons/warrior_sword.png',
  isStackable: false,
  isEquipment: true,
  isConsumable: false,
  equipSlot: 'mainHand',
  attack: 12,
  defense: 2,
  magic: 0,
  speed: 0,
  dodgeRate: 0,
  critRate: 3,
  critDamage: 0,
  maxDurability: 150,
  requiredLevel: 10,
  baseValue: 150,
};

export const KNIGHT_SWORD: ItemDef = {
  id: 'knight_sword',
  name: '骑士之剑',
  type: 'weapon',
  rarity: 'rare',
  description: '骑士团传承的长剑，闪烁着淡淡的光芒。',
  icon: '/assets/icons/knight_sword.png',
  isStackable: false,
  isEquipment: true,
  isConsumable: false,
  equipSlot: 'mainHand',
  attack: 20,
  defense: 5,
  magic: 0,
  speed: 1,
  dodgeRate: 0,
  critRate: 5,
  critDamage: 150,
  maxDurability: 200,
  requiredLevel: 20,
  baseValue: 500,
};

export const DRAGON_SLAYER_BLADE: ItemDef = {
  id: 'dragon_slayer_blade',
  name: '屠龙刀',
  type: 'weapon',
  rarity: 'legendary',
  description: '传说中能屠戮巨龙的神兵，刀身流转着暗红色的光芒。',
  icon: '/assets/icons/dragon_slayer.png',
  isStackable: false,
  isEquipment: true,
  isConsumable: false,
  equipSlot: 'mainHand',
  attack: 40,
  defense: 10,
  magic: 0,
  speed: 3,
  dodgeRate: 5,
  critRate: 15,
  critDamage: 200,
  maxDurability: 500,
  requiredLevel: 40,
  baseValue: 2000,
};

export const LICH_STAFF: ItemDef = {
  id: 'lich_staff',
  name: '巫妖法杖',
  type: 'weapon',
  rarity: 'legendary',
  description: '由黑暗巫妖的核心打造的法杖，蕴含强大的魔力。',
  icon: '/assets/icons/lich_staff.png',
  isStackable: false,
  isEquipment: true,
  isConsumable: false,
  equipSlot: 'mainHand',
  attack: 15,
  defense: 5,
  magic: 45,
  speed: 2,
  dodgeRate: 0,
  critRate: 10,
  critDamage: 180,
  maxDurability: 400,
  requiredLevel: 45,
  baseValue: 2500,
};

// ==================== 护甲 ====================

export const IRON_HELM: ItemDef = {
  id: 'iron_helm',
  name: '铁头盔',
  type: 'armor',
  rarity: 'common',
  description: '简单的铁制头盔。',
  icon: '/assets/icons/iron_helm.png',
  isStackable: false,
  isEquipment: true,
  isConsumable: false,
  equipSlot: 'head',
  attack: 0,
  defense: 5,
  magic: 0,
  speed: 0,
  dodgeRate: 0,
  critRate: 0,
  critDamage: 0,
  maxDurability: 100,
  requiredLevel: 1,
  baseValue: 25,
};

export const DRAGON_SCALE_ARMOR: ItemDef = {
  id: 'dragon_scale_armor',
  name: '龙鳞甲',
  type: 'armor',
  rarity: 'legendary',
  description: '用龙鳞打造的传说级铠甲，提供近乎无敌的防御。',
  icon: '/assets/icons/dragon_scale_armor.png',
  isStackable: false,
  isEquipment: true,
  isConsumable: false,
  equipSlot: 'chest',
  attack: 5,
  defense: 50,
  magic: 10,
  speed: -3,
  dodgeRate: 5,
  critRate: 0,
  critDamage: 0,
  maxDurability: 500,
  requiredLevel: 45,
  baseValue: 3000,
};

// ==================== 消耗品 ====================

export const SMALL_HEALTH_POTION: ItemDef = {
  id: 'small_health_potion',
  name: '初级生命药水',
  type: 'consumable',
  rarity: 'common',
  description: '恢复 30 点生命值的药水。',
  icon: '/assets/icons/small_health_potion.png',
  isStackable: true,
  isEquipment: false,
  isConsumable: true,
  healAmount: 30,
  manaAmount: 0,
  requiredLevel: 1,
  baseValue: 10,
};

export const LARGE_HEALTH_POTION: ItemDef = {
  id: 'large_health_potion',
  name: '高级生命药水',
  type: 'consumable',
  rarity: 'uncommon',
  description: '恢复 100 点生命值的药水。',
  icon: '/assets/icons/large_health_potion.png',
  isStackable: true,
  isEquipment: false,
  isConsumable: true,
  healAmount: 100,
  manaAmount: 0,
  requiredLevel: 5,
  baseValue: 50,
};

export const SMALL_MANA_POTION: ItemDef = {
  id: 'small_mana_potion',
  name: '初级魔力药水',
  type: 'consumable',
  rarity: 'common',
  description: '恢复 20 点魔力的药水。',
  icon: '/assets/icons/small_mana_potion.png',
  isStackable: true,
  isEquipment: false,
  isConsumable: true,
  healAmount: 0,
  manaAmount: 20,
  requiredLevel: 1,
  baseValue: 8,
};

// ==================== 材料 ====================

export const BONE_SHARD: ItemDef = {
  id: 'bone_shard',
  name: '骨片',
  type: 'material',
  rarity: 'common',
  description: '从骷髅身上获取的骨片。',
  icon: '/assets/icons/bone_shard.png',
  isStackable: true,
  isEquipment: false,
  isConsumable: false,
  requiredLevel: 1,
  baseValue: 2,
};

export const IRON_ORE: ItemDef = {
  id: 'iron_ore',
  name: '铁矿',
  type: 'material',
  rarity: 'common',
  description: '可以用来锻造武器的铁矿。',
  icon: '/assets/icons/iron_ore.png',
  isStackable: true,
  isEquipment: false,
  isConsumable: false,
  requiredLevel: 1,
  baseValue: 5,
};

export const RARE_GEM: ItemDef = {
  id: 'rare_gem',
  name: '稀有宝石',
  type: 'material',
  rarity: 'rare',
  description: '闪烁着光芒的稀有宝石，可用于制作高级装备。',
  icon: '/assets/icons/rare_gem.png',
  isStackable: true,
  isEquipment: false,
  isConsumable: false,
  requiredLevel: 15,
  baseValue: 100,
};

// ==================== 货币 ====================

export const GOLD: ItemDef = {
  id: 'gold',
  name: '金币',
  type: 'currency',
  rarity: 'common',
  description: '王国通用的金币。',
  icon: '/assets/icons/gold.png',
  isStackable: true,
  isEquipment: false,
  isConsumable: false,
  requiredLevel: 1,
  baseValue: 1,
};

// ==================== 物品映射表 ====================

export const ALL_ITEMS: ItemDef[] = [
  IRON_SWORD, HUNTER_BOW, WARRIOR_SWORD, KNIGHT_SWORD, DRAGON_SLAYER_BLADE, LICH_STAFF,
  IRON_HELM, DRAGON_SCALE_ARMOR,
  SMALL_HEALTH_POTION, LARGE_HEALTH_POTION, SMALL_MANA_POTION,
  BONE_SHARD, IRON_ORE, RARE_GEM,
  GOLD,
];

export const ITEM_MAP: Record<string, ItemDef> = {};
for (const item of ALL_ITEMS) {
  ITEM_MAP[item.id] = item;
}

