/**
 * 边境传说 — 类型定义
 * src/types/index.ts
 */

// ==================== 角色定义 ====================
export interface CharacterStats {
  maxHp: number;
  maxMp: number;
  attack: number;
  defense: number;
  speed: number;
  magic: number;
}

export interface CharacterDef {
  id: string;
  name: string;
  icon: string;
  className: string;
  description: string;
  stats: CharacterStats;
  startingWeapon: string;
  startingSkills: string[];
}

// ==================== 玩家状态 ====================
export interface PlayerState {
  characterId: string;
  level: number;
  xp: number;
  hp: number;
  mp: number;
  isAlive: boolean;
}

// ==================== 敌人 ====================
export interface EnemyDef {
  id: string;
  name: string;
  type: 'normal' | 'elite' | 'boss';
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  drops: DropTable;
}

export interface DropTable {
  items: DropEntry[];
}

export interface DropEntry {
  itemId: string;
  chance: number; // 0-1
}

// ==================== 物品 ====================
export interface ItemDef {
  id: string;
  name: string;
  type: 'material' | 'weapon' | 'armor' | 'consumable' | 'quest';
  icon: string;
  description: string;
  value: number;
}

export interface InventorySlot {
  itemId: string;
  quantity: number;
}

export interface Inventory {
  slots: InventorySlot[];
  maxSize: number;
}

// ==================== 任务 ====================
export interface Quest {
  id: string;
  title: string;
  description: string;
  steps: QuestStep[];
  currentStep: number;
  completed: boolean;
  rewards: QuestRewards;
}

export interface QuestStep {
  description: string;
  objective: string;
  completed: boolean;
}

export interface QuestRewards {
  xp: number;
  gold: number;
  items: string[];
}

// ==================== 场景 ====================
export interface SceneConfig {
  id: string;
  name: string;
  unlockCondition: string;
  environment: {
    fogColor: string;
    fogDensity: number;
    ambientLight: number;
    ambientColor: string;
    directionalLight: {
      intensity: number;
      color: string;
      position: [number, number, number];
    };
    backgroundColor: string;
  };
  music: string;
}

// ==================== 输入 ====================
export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  sprint: boolean;
  jump: boolean;
  attack: boolean;
  interact: boolean;
  menu: boolean;
}

// ==================== 存档 ====================
export interface SaveData {
  playerId: string;
  playerState: PlayerState;
  inventory: InventorySlot[];
  quests: QuestSaveEntry[];
  currentSceneId: string;
  playerPosition: [number, number, number];
  cameraRotation: [number, number];
  unlockedScenes: string[];
  timestamp: number;
}

export interface QuestSaveEntry {
  questId: string;
  currentStep: number;
  completed: boolean;
}


/**

 * 输入状态

 */

export interface InputState {

  forward: boolean;

  backward: boolean;

  left: boolean;

  right: boolean;

  sprint: boolean;

  jump: boolean;

  attack: boolean;

  interact: boolean;

  menu: boolean;

}
