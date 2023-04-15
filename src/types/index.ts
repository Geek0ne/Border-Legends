/**
 * 边境传说 - 类型定义（完整版）
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

export interface PlayerState {
  characterId: string;
  characterName: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  hp: number;
  mp: number;
  isAlive: boolean;
  position: [number, number, number];
  unlockedScenes: string[];
  stats: CharacterStats;
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
  position?: { x: number; y: number; z: number };
}

export interface DropTable {
  items: DropEntry[];
}

export interface DropEntry {
  itemId: string;
  name?: string;
  quantity?: number;
  chance: number; // 0-1
}

// ==================== 物品 ====================
export type ItemType = 'weapon' | 'armor' | 'consumable' | 'currency' | 'material' | 'quest';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type EquipmentSlot = 'mainHand' | 'offHand' | 'head' | 'chest' | 'legs' | 'boots' | 'gloves' | 'ring' | 'amulet';

export interface ItemDef {
  id: string;
  name: string;
  type: ItemType;
  rarity: Rarity;
  description?: string;
  icon?: string;
  isStackable: boolean;
  isEquipment?: boolean;
  isConsumable?: boolean;
  equipSlot?: EquipmentSlot;
  // 属性加成
  attack?: number;
  defense?: number;
  magic?: number;
  magicDefense?: number;
  speed?: number;
  dodgeRate?: number;
  critRate?: number;
  critDamage?: number;
  // 装备耐久
  maxDurability?: number;
  // 消耗品效果
  healAmount?: number;
  manaAmount?: number;
  // 需求等级
  requiredLevel?: number;
  // 基础价值
  baseValue?: number;
}

export interface InventorySlot {
  itemId: string;
  quantity: number;
}

export interface Inventory {
  slots: InventorySlot[];
  maxSize: number;
}

export interface Equipment {
  head: ItemDef | null;
  chest: ItemDef | null;
  legs: ItemDef | null;
  boots: ItemDef | null;
  gloves: ItemDef | null;
  mainHand: ItemDef | null;
  offHand: ItemDef | null;
  ring: ItemDef | null;
  amulet: ItemDef | null;
}

// ==================== 任务 ====================
export enum QuestType {
  MAIN = 'main',
  SIDE = 'side',
  DAILY = 'daily',
}

export enum QuestStage {
  TALK = 'talk',
  EXPLORATION = 'exploration',
  COMBAT = 'combat',
  COLLECTION = 'collection',
  DELIVERY = 'delivery',
}

export enum QuestObjectiveType {
  KILL = 'kill',
  COLLECT = 'collect',
  TALK = 'talk',
  TRAVEL = 'travel',
  FIND = 'find',
}

export interface QuestObjective {
  type: QuestObjectiveType;
  currentCount?: number;
  targetCount?: number;
  targetId?: string;
  itemId?: string;
  npcId?: string;
  locationId?: string;
}

export interface Quest {
  id: string;
  title: string;
  type: QuestType;
  chapter?: number;
  description: string;
  stages: QuestStageData[];
  requirements: QuestRequirements;
  rewards: QuestRewards;
  stage: number;
  // 运行时数据
  isCompleted: boolean;
  isActive: boolean;
  isDaily: boolean;
  lastDailyReset?: number;
}

export interface QuestStageData {
  stage: QuestStage;
  description: string;
  objective: QuestObjective;
}

export interface QuestRequirements {
  level: number;
  items: string[];
}

export interface QuestRewards {
  experience: number;
  gold: number;
  items: string[];
}

// ==================== NPC ====================
export interface NPCDef {
  id: string;
  name: string;
  icon?: string;
  position: { x: number; y: number; z: number };
  dialogue: string[];
  quests?: string[];
  shopItems?: string[];
}

// ==================== BOSS ====================
export interface BossDef extends EnemyDef {
  phaseCount: number;
  phaseHPThresholds: number[];
  specialAbilities: string[];
  arenaId?: string;
}

// ==================== 场景 ====================
export interface SceneConfig {
  id: string;
  name: string;
  unlockCondition?: string;
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
  music?: string;
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
export interface QuestSaveEntry {
  questId: string;
  stage: number;
  isCompleted: boolean;
}

export interface SaveData {
  playerId: string;
  playerState: PlayerState;
  equipment: Equipment;
  inventory: InventorySlot[];
  quests: QuestSaveEntry[];
  unlockedScenes: string[];
  timestamp: number;
  version: number;
}

// ==================== HUD ====================
export interface HUDState {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  xp: number;
  xpToNext: number;
  level: number;
  gold: number;
  enemyCount: number;
  activeQuests: Quest[];
  isCombat: boolean;
  isPaused: boolean;
  isMenuOpen: boolean;
  combo: number;
  comboMax: number;
}

export interface FloatingText {
  text: string;
  position: { x: number; z: number };
  color: number;
  lifetime: number;
}

// ==================== 经验/升级 ====================
export interface XPConfig {
  baseXP: number;
  multiplier: number;
}


// ==================== 任务系统 ====================
export interface QuestUpdateEvent {
  questId: string;
  stage: number;
  currentCount: number;
  targetCount: number;
  isCompleted: boolean;
}



// ==================== 成就系统 ====================
export enum AchievementType {
  COMBAT = 'combat',
  EXPLORATION = 'exploration',
  COLLECTION = 'collection',
  QUEST = 'quest',
  SPECIAL = 'special',
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  type: AchievementType;
  icon: string;
  requirement: AchievementRequirement;
  rewards: AchievementRewards;
  hidden?: boolean;
}

export interface AchievementRequirement {
  type: string;
  target: number;
  itemId?: string;
  questId?: string;
  enemyId?: string;
}

export interface AchievementRewards {
  experience: number;
  gold: number;
  items?: string[];
  achievementPoints: number;
}

export interface AchievementProgress {
  id: string;
  currentProgress: number;
  isCompleted: boolean;
  completedAt?: number;
}

// ==================== 天气系统 ====================
export enum WeatherState {
  CLEAR = 'clear',
  CLOUDY = 'cloudy',
  RAIN = 'rain',
  STORM = 'storm',
  SNOW = 'snow',
  FOG = 'fog',
}

export enum TimeOfDay {
  DAWN = 'dawn',
  DAY = 'day',
  DUSK = 'dusk',
  NIGHT = 'night',
}

export interface WeatherConfig {
  state: WeatherState;
  intensity: number; // 0-1
  particleRate: number;
  duration: number;
}

export interface DayNightCycle {
  timeOfDay: TimeOfDay;
  sunAngle: number;
  ambientIntensity: number;
  fogDensity: number;
  moonPhase: number; // 0-1
}

// ==================== 事件系统 ====================
export enum GameEventType {
  PLAYER_LEVEL_UP = 'player_level_up',
  ENEMY_DEFEATED = 'enemy_defeated',
  ITEM_PICKED_UP = 'item_picked_up',
  QUEST_STARTED = 'quest_started',
  QUEST_COMPLETED = 'quest_completed',
  BOSS_SPAWNED = 'boss_spawned',
  WEATHER_CHANGED = 'weather_changed',
  ACHIEVEMENT_UNLOCKED = 'achievement_unlocked',
  SHOP_PURCHASED = 'shop_purchased',
  NPC_INTERACTED = 'npc_interacted',
}

export interface GameEvent {
  type: GameEventType;
  timestamp: number;
  source?: string;
  data: Record<string, any>;
}

export interface EventListener {
  eventType: GameEventType;
  callback: (event: GameEvent) => void;
}

// ==================== 多人联机基础 ====================
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  SYNCING = 'syncing',
}

export interface PlayerSyncData {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  state: string;
  hp: number;
  mp: number;
  timestamp: number;
}

export interface NetworkRoom {
  id: string;
  hostId: string;
  maxPlayers: number;
  currentPlayers: number;
  state: 'waiting' | 'playing' | 'finished';
  players: Array<{ id: string; name: string; characterId: string }>;
}

// ==================== 配置 ====================
export interface GameConfig {
  version: number;
  debug: boolean;
  physics: {
    gravity: number;
    timestep: number;
    maxSubSteps: number;
  };
  rendering: {
    shadowMapSize: number;
    renderDistance: number;
    antiAliasing: boolean;
    postProcessing: boolean;
  };
  audio: {
    masterVolume: number;
    sfxVolume: number;
    musicVolume: number;
  };
  input: {
    mouseSensitivity: number;
    keyRepeatDelay: number;
    keyRepeatInterval: number;
  };
}

export const DEFAULT_CONFIG: GameConfig = {
  version: 1,
  debug: false,
  physics: {
    gravity: -20,
    timestep: 1 / 60,
    maxSubSteps: 4,
  },
  rendering: {
    shadowMapSize: 2048,
    renderDistance: 100,
    antiAliasing: true,
    postProcessing: true,
  },
  audio: {
    masterVolume: 0.8,
    sfxVolume: 0.7,
    musicVolume: 0.5,
  },
  input: {
    mouseSensitivity: 0.5,
    keyRepeatDelay: 500,
    keyRepeatInterval: 50,
  },
};

export interface StatModification {
  type: 'flat' | 'percentage' | 'additive';
  value: number;
  source: string;
  duration?: number;
}

export interface CharacterBuffs {
  activeBuffs: Array<{ id: string; statMods: StatModification[]; duration: number; expiresAt: number }>;
  activeDebuffs: Array<{ id: string; statMods: StatModification[]; duration: number; expiresAt: number }>;
}

// ==================== 战斗系统 ====================
export { EnemyAIState } from './combat';
export type { EnemyAI, SkillDef, SkillEffect, SkillCategory } from './combat';


