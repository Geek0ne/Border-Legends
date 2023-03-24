/**
 * 边境传说 — 存档/读档系统
 * 负责游戏数据序列化、存储、加载
 */

export interface SaveData {
  version: number;
  timestamp: number;
  player: PlayerSaveData;
  inventory: InventorySaveData[];
  equipment: Record<string, number>;
  gold: number;
  worldState: WorldSaveData;
  settings: GameSettingsSaveData;
}

export interface PlayerSaveData {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number; w: number };
  level: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  xp: number;
  xpToNextLevel: number;
  stats: {
    attack: number;
    magic: number;
    defense: number;
    magicDefense: number;
    speed: number;
    dodgeRate: number;
    critRate: number;
    critDamage: number;
  };
  skills: string[];
  currentScene: string;
  scenePosition: { x: number; y: number; z: number };
}

export interface InventorySaveData {
  itemId: string;
  instanceId: string;
  quantity: number;
  level: number;
  durability: number | undefined;
  enchantment: number;
}

export interface WorldSaveData {
  enemiesDefeated: string[];
  questProgress: Record<string, number>;
  collectiblesCollected: string[];
  unlockedAreas: string[];
  worldEventTriggers: Record<string, boolean>;
}

export interface GameSettingsSaveData {
  volume: number;
  mouseSensitivity: number;
  showHealthBar: boolean;
  showManaBar: boolean;
  showMiniMap: boolean;
  showQuestLog: boolean;
  cameraDistance: number;
  cameraPitch: number;
}

const SAVE_VERSION = 1;
const SAVE_KEY = 'border_legends_save';
const QUICKSAVE_KEY = 'border_legends_quicksave';

export class SaveSystem {
  private static instance: SaveSystem | null = null;

  constructor() {
    SaveSystem.instance = this;
  }

  static createSaveData(
    playerData: PlayerSaveData,
    inventory: InventorySaveData[],
    equipment: Record<string, number>,
    gold: number,
    worldState: WorldSaveData,
    settings: GameSettingsSaveData
  ): SaveData {
    return {
      version: SAVE_VERSION,
      timestamp: Date.now(),
      player: playerData,
      inventory,
      equipment,
      gold,
      worldState,
      settings,
    };
  }

  static saveGame(data: SaveData, key: string = SAVE_KEY): boolean {
    try {
      data.timestamp = Date.now();
      data.version = SAVE_VERSION;
      const json = JSON.stringify(data);
      localStorage.setItem(key, json);
      console.log(`[SaveSystem] 游戏已保存: ${data.player.name} - Lv.${data.player.level}`);
      return true;
    } catch (e) {
      console.error('[SaveSystem] 保存失败:', e);
      return false;
    }
  }

  static quickSave(data: SaveData): boolean {
    return this.saveGame(data, QUICKSAVE_KEY);
  }

  static loadGame(key: string = SAVE_KEY): SaveData | null {
    try {
      const json = localStorage.getItem(key);
      if (!json) return null;
      const data = JSON.parse(json) as SaveData;
      if (!data.version || data.version !== SAVE_VERSION) {
        console.warn('[SaveSystem] 存档版本不匹配:', data.version, '期望:', SAVE_VERSION);
        return null;
      }
      console.log(`[SaveSystem] 游戏已加载: ${data.player.name} - Lv.${data.player.level} - ${new Date(data.timestamp).toLocaleString()}`);
      return data;
    } catch (e) {
      console.error('[SaveSystem] 读取失败:', e);
      return null;
    }
  }

  static quickLoad(): SaveData | null {
    return this.loadGame(QUICKSAVE_KEY);
  }

  static hasSave(key: string = SAVE_KEY): boolean {
    return localStorage.getItem(key) !== null;
  }

  static hasQuickSave(): boolean {
    return this.hasSave(QUICKSAVE_KEY);
  }

  static deleteSave(key: string = SAVE_KEY): boolean {
    try {
      localStorage.removeItem(key);
      console.log('[SaveSystem] 存档已删除');
      return true;
    } catch (e) {
      console.error('[SaveSystem] 删除失败:', e);
      return false;
    }
  }

  static getSaveInfo(key: string = SAVE_KEY): { timestamp: number; playerName: string; level: number } | null {
    const json = localStorage.getItem(key);
    if (!json) return null;
    try {
      const data = JSON.parse(json) as SaveData;
      return {
        timestamp: data.timestamp,
        playerName: data.player.name,
        level: data.player.level,
      };
    } catch {
      return null;
    }
  }

  static getQuickSaveInfo(): { timestamp: number; playerName: string; level: number } | null {
    return this.getSaveInfo(QUICKSAVE_KEY);
  }

  static getSaveCount(): number {
    let count = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('border_legends_save_')) {
        count++;
      }
    }
    return count;
  }

  static listSaves(): Array<{ key: string; info: { timestamp: number; playerName: string; level: number } }> {
    const saves: Array<{ key: string; info: { timestamp: number; playerName: string; level: number } }> = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('border_legends_save_')) {
        const info = this.getSaveInfo(key);
        if (info) {
          saves.push({ key, info });
        }
      }
    }
    return saves.sort((a, b) => b.info.timestamp - a.info.timestamp);
  }
}
