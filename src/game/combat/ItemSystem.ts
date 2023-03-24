/**
 * 边境传说 — 物品系统
 * 管理背包、装备、消耗品、掉落物品
 */

import type { Item, ItemType, EquipmentSlot, Rarity } from '../../types/combat';

export type RarityColors = Record<Rarity, string>;

export const RARITY_COLORS: RarityColors = {
  common: '#9d9d9d',
  uncommon: '#1eff00',
  rare: '#0070dd',
  epic: '#a335ee',
  legendary: '#ff8000',
};

export class ItemSystem {
  private inventory: Map<string, ItemInstance> = new Map();
  private equipment: Map<EquipmentSlot, ItemInstance> = new Map();
  private gold: number = 0;
  private maxSlots: number = 40;
  private onInventoryUpdate?: (inventory: ItemInstance[], gold: number) => void;

  constructor(maxSlots: number = 40) {
    this.maxSlots = maxSlots;
  }

  public setOnInventoryUpdate(callback: (inventory: ItemInstance[], gold: number) => void): void {
    this.onInventoryUpdate = callback;
  }

  /**
   * 添加物品到背包
   */
  public addItem(item: Item, quantity: number = 1, source?: string): boolean {
    if (quantity <= 0) return false;

    const existing = this.inventory.get(item.id);
    if (existing && item.isStackable) {
      existing.quantity += quantity;
      this.notifyUpdate();
      return true;
    }

    if (this.getTotalItemCount() >= this.maxSlots) {
      return false;
    }

    this.inventory.set(item.id, {
      ...item,
      instanceId: `item_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      quantity,
      level: 1,
      durability: item.maxDurability ?? 100,
      enchantment: 0,
      source: source ?? 'unknown',
    });

    this.notifyUpdate();
    return true;
  }

  /**
   * 从背包移除物品
   */
  public removeItem(itemId: string, quantity: number = 1): boolean {
    const item = this.inventory.get(itemId);
    if (!item) return false;

    item.quantity -= quantity;
    if (item.quantity <= 0) {
      this.inventory.delete(itemId);
    }

    this.notifyUpdate();
    return true;
  }

  /**
   * 装备物品
   */
  public equipItem(itemId: string): boolean {
    const item = this.inventory.get(itemId);
    if (!item || !item.isEquipment) return false;

    if (item.equipSlot && item.equipSlot !== this.equipment.get(item.equipSlot)?.id) {
      // 卸下当前装备
      const current = this.equipment.get(item.equipSlot);
      if (current) {
        this.inventory.set(current.id, current);
      }
      this.equipment.set(item.equipSlot, item);
      this.inventory.delete(itemId);
      this.notifyUpdate();
      return true;
    }

    return false;
  }

  /**
   * 卸下装备
   */
  public unequipItem(slot: EquipmentSlot): boolean {
    const item = this.equipment.get(slot);
    if (!item) return false;

    if (this.getTotalItemCount() >= this.maxSlots) {
      return false;
    }

    this.inventory.set(item.id, { ...item });
    this.equipment.delete(slot);
    this.notifyUpdate();
    return true;
  }

  /**
   * 使用消耗品
   */
  public useConsumable(itemId: string): boolean {
    const item = this.inventory.get(itemId);
    if (!item || !item.isConsumable) return false;

    this.removeItem(itemId, 1);
    return true;
  }

  /**
   * 购买物品
   */
  public buyItem(item: Item, price: number, quantity: number = 1): boolean {
    if (this.gold < price * quantity) return false;

    this.gold -= price * quantity;
    return this.addItem(item, quantity);
  }

  /**
   * 出售物品
   */
  public sellItem(itemId: string, price: number, quantity: number = 1): boolean {
    const item = this.inventory.get(itemId);
    if (!item) return false;

    this.gold += price * quantity;
    this.removeItem(itemId, quantity);
    return true;
  }

  /**
   * 获得金币
   */
  public addGold(amount: number): void {
    this.gold += Math.max(0, amount);
    this.notifyUpdate();
  }

  /**
   * 消耗金币
   */
  public spendGold(amount: number): boolean {
    if (this.gold < amount) return false;
    this.gold -= amount;
    this.notifyUpdate();
    return true;
  }

  /**
   * 获取背包物品
   */
  public getInventory(): ItemInstance[] {
    return Array.from(this.inventory.values());
  }

  /**
   * 获取已装备物品
   */
  public getEquipment(): Map<EquipmentSlot, ItemInstance> {
    return new Map(this.equipment);
  }

  /**
   * 获取当前金币
   */
  public getGold(): number {
    return this.gold;
  }

  /**
   * 获取背包物品总数
   */
  private getTotalItemCount(): number {
    let total = 0;
    this.inventory.forEach((item) => {
      total += item.quantity;
    });
    return total;
  }

  /**
   * 生成掉落物品
   */
  public static generateLoot(enemyId: string, enemyLevel: number): Array<{ item: Item; quantity: number; quality: string }> {
    const drops: Array<{ item: Item; quantity: number; quality: string }> = [];

    // 金币掉落
    drops.push({
      item: {
        id: `gold_common_${enemyId}`,
        name: '金币',
        type: 'currency' as ItemType,
        rarity: 'common' as Rarity,
        isStackable: true,
      },
      quantity: Math.floor(Math.random() * 50 * enemyLevel) + 5,
      quality: 'common',
    });

    // 药水掉落
    if (Math.random() < 0.6) {
      drops.push({
        item: {
          id: `health_potion_${enemyId}`,
          name: '生命药水',
          type: 'consumable' as ItemType,
          rarity: 'common' as Rarity,
          isStackable: true,
          maxDurability: 1,
        },
        quantity: Math.floor(Math.random() * 2) + 1,
        quality: 'common',
      });
    }

    if (Math.random() < 0.4) {
      drops.push({
        item: {
          id: `mana_potion_${enemyId}`,
          name: '魔力药水',
          type: 'consumable' as ItemType,
          rarity: 'uncommon' as Rarity,
          isStackable: true,
          maxDurability: 1,
        },
        quantity: Math.floor(Math.random() * 2) + 1,
        quality: 'uncommon',
      });
    }

    // 装备掉落
    if (Math.random() < 0.15 + enemyLevel * 0.02) {
      const weaponTypes = ['sword', 'axe', 'staff', 'bow'];
      const weaponType = weaponTypes[Math.floor(Math.random() * weaponTypes.length)];
      const rarities: Rarity[] = ['common', 'uncommon', 'rare', 'epic'];
      const rarity = rarities[Math.floor(Math.random() * Math.min(3 + Math.floor(enemyLevel / 3), 4))];

      drops.push({
        item: {
          id: `${weaponType}_${enemyId}_${Date.now()}`,
          name: `${rarity === 'legendary' ? '传说' : rarity === 'epic' ? '史诗' : rarity === 'rare' ? '稀有' : '普通'} ${weaponType === 'sword' ? '剑' : weaponType === 'axe' ? '斧' : weaponType === 'staff' ? '法杖' : '弓'}`,
          type: 'equipment' as ItemType,
          rarity: rarity as Rarity,
          isEquipment: true,
          equipSlot: weaponType === 'staff' || weaponType === 'bow' ? 'mainHand' as EquipmentSlot : 'mainHand' as EquipmentSlot,
          attack: Math.floor(enemyLevel * 3 + Math.random() * 10),
          magic: weaponType === 'staff' ? Math.floor(enemyLevel * 5 + Math.random() * 15) : 0,
          defense: Math.floor(enemyLevel * 2),
          maxDurability: 100 + enemyLevel * 10,
          isStackable: false,
        },
        quantity: 1,
        quality: rarity,
      });
    }

    return drops;
  }

  private notifyUpdate(): void {
    if (this.onInventoryUpdate) {
      this.onInventoryUpdate(this.getInventory(), this.gold);
    }
  }
}

export interface ItemInstance extends Item {
  instanceId: string;
  quantity: number;
  level: number;
  durability: number | undefined;
  enchantment: number;
  source: string;
}

