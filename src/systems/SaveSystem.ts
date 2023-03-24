/**
 * 边境传说 - 存档系统
 * 管理游戏存档的保存、加载和版本管理
 */

import { SaveData, QuestSaveEntry, InventorySlot, Equipment, PlayerState } from '../types';

export class SaveSystem {
  private static readonly SAVE_VERSION = 1;
  private static readonly SAVE_KEY = 'borderland_save';
  private static readonly MAX_SAVES = 5;

  /** 创建新的存档 */
  public createSave(playerState: PlayerState, inventory: InventorySlot[], quests: QuestSaveEntry[], equipment: Equipment, unlockedScenes: string[]): SaveData {
    return {
      playerId: playerState.characterId,
      playerState,
      inventory,
      quests,
      equipment,
      unlockedScenes: [...unlockedScenes],
      timestamp: Date.now(),
      version: SaveSystem.SAVE_VERSION,
    };
  }

  /** 序列化存档数据 */
  public serialize(saveData: SaveData): string {
    try {
      return JSON.stringify(saveData);
    } catch (e) {
      console.error('Save serialization failed:', e);
      return '';
    }
  }

  /** 反序列化存档数据 */
  public deserialize(json: string): SaveData | null {
    try {
      const data = JSON.parse(json) as SaveData;
      if (!data.playerId || !data.playerState || !data.version) return null;
      return data;
    } catch (e) {
      console.error('Save deserialization failed:', e);
      return null;
    }
  }

  /** 保存到本地存储 */
  public saveToLocalStorage(saveData: SaveData): boolean {
    try {
      const serialized = this.serialize(saveData);
      if (!serialized) return false;

      // 保存自动存档
      localStorage.setItem(SaveSystem.SAVE_KEY + '_auto', serialized);
      return true;
    } catch (e) {
      console.error('Save to localStorage failed:', e);
      return false;
    }
  }

  /** 从本地存储加载 */
  public loadFromLocalStorage(): SaveData | null {
    try {
      const json = localStorage.getItem(SaveSystem.SAVE_KEY + '_auto');
      if (!json) return null;
      return this.deserialize(json);
    } catch (e) {
      console.error('Load from localStorage failed:', e);
      return null;
    }
  }

  /** 保存自动存档 */
  public saveAuto(playerState: PlayerState, inventory: InventorySlot[], quests: QuestSaveEntry[], equipment: Equipment, unlockedScenes: string[]): boolean {
    const saveData = this.createSave(playerState, inventory, quests, equipment, unlockedScenes);
    return this.saveToLocalStorage(saveData);
  }

  /** 获取存档时间 */
  public getSaveTimestamp(saveData: SaveData | null): string {
    if (!saveData || !saveData.timestamp) return '暂无存档';
    return new Date(saveData.timestamp).toLocaleString('zh-CN');
  }

  /** 生成存档文件名 */
  public generateSaveFileName(saveData: SaveData): string {
    const date = new Date(saveData.timestamp);
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const level = saveData.playerState.level;
    const name = saveData.playerState.characterName || saveData.playerState.characterId || "player";
    return `${name}_lv${level}_${dateStr}.json`;
  }

  /** 检查存档版本是否兼容 */
  public isVersionCompatible(saveData: SaveData): boolean {
    // 当前版本号兼容
    return saveData.version >= 1;
  }
}


