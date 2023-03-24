/**
 * 边境传说 - 物品/背包系统
 * 管理物品的拾取、装备、使用、堆叠
 */

import { ItemDef, InventorySlot, Equipment, Rarity, QuestObjectiveType } from '../types';
import { ITEM_MAP, ALL_ITEMS } from '../data';

export class InventorySystem {
  private slots: Map<string, InventorySlot> = new Map();
  private maxSize: number;

  constructor(maxSlots: number = 30) {
    this.maxSize = maxSlots;
  }

  /** 获取物品 */
  private getItem(itemId: string): ItemDef | null {
    return ITEM_MAP[itemId] || null;
  }

  /** 检查空间是否足够 */
  private hasSpace(itemId: string): boolean {
    const item = this.getItem(itemId);
    if (!item) return false;
    if (item.isStackable) {
      const slot = this.slots.get(itemId);
      return slot ? slot.quantity < 99 : true; // 堆叠上限99
    }
    return this.slots.size < this.maxSize;
  }

  /** 添加物品到背包 */
  public addItem(itemId: string, quantity: number = 1): boolean {
    const item = this.getItem(itemId);
    if (!item) return false;
    if (!this.hasSpace(itemId)) return false;

    if (item.isStackable) {
      const existing = this.slots.get(itemId);
      if (existing) {
        existing.quantity = Math.min(existing.quantity + quantity, 99);
      } else {
        this.slots.set(itemId, { itemId, quantity: Math.min(quantity, 99) });
      }
    } else {
      this.slots.set(itemId, { itemId, quantity: 1 });
    }
    return true;
  }

  /** 移除物品 */
  public removeItem(itemId: string, quantity: number = 1): boolean {
    const slot = this.slots.get(itemId);
    if (!slot) return false;
    if (slot.quantity < quantity) return false;

    slot.quantity -= quantity;
    if (slot.quantity <= 0) this.slots.delete(itemId);
    return true;
  }

  /** 使用消耗品 */
  public useConsumable(itemId: string): { success: boolean; healAmount: number; manaAmount: number } {
    const slot = this.slots.get(itemId);
    const item = this.getItem(itemId);
    if (!slot || !item || item.type !== 'consumable') {
      return { success: false, healAmount: 0, manaAmount: 0 };
    }

    this.removeItem(itemId, 1);
    return {
      success: true,
      healAmount: item.healAmount || 0,
      manaAmount: item.manaAmount || 0,
    };
  }

  /** 检查是否有物品 */
  public hasItem(itemId: string, quantity: number = 1): boolean {
    const slot = this.slots.get(itemId);
    return slot ? slot.quantity >= quantity : false;
  }

  /** 获取物品数量 */
  public getItemQuantity(itemId: string): number {
    return this.slots.get(itemId)?.quantity || 0;
  }

  /** 获取所有背包物品 */
  public getAllItems(): InventorySlot[] {
    return Array.from(this.slots.values());
  }

  /** 获取背包大小信息 */
  public getSize(): { current: number; max: number } {
    return { current: this.slots.size, max: this.maxSize };
  }

  /** 获取背包总价值 */
  public getTotalValue(): number {
    let total = 0;
    for (const slot of this.slots.values()) {
      const item = this.getItem(slot.itemId);
      if (item) total += (item.baseValue || 0) * slot.quantity;
    }
    return total;
  }

  /** 保存背包状态 */
  public saveState(): InventorySlot[] {
    return Array.from(this.slots.values());
  }

  /** 加载背包状态 */
  public loadState(slots: InventorySlot[]): void {
    this.slots.clear();
    for (const slot of slots) {
      if (slot.quantity > 0) this.slots.set(slot.itemId, slot);
    }
  }

  /** 根据任务目标类型查找符合条件的物品 */
  public findItemsForObjective(objectiveType: QuestObjectiveType, targetId: string | undefined): string[] {
    if (objectiveType === 'collect' && targetId) {
      return this.hasItem(targetId) ? [targetId] : [];
    }
    return [];
  }
}

