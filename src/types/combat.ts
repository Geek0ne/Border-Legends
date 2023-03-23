/**
 * 边境传说 - 战斗类型定义
 */

// ==================== 战斗数据 ====================
export interface CombatStats {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  attack: number;
  defense: number;
  magic: number;
  magicDefense: number;
  speed: number;
  critRate: number;
  critDamage: number;
  dodgeRate: number;
  knockbackResist: number;
}

// ==================== 伤害计算 ====================
export interface DamageCalculation {
  damage: number;
  isCrit: boolean;
  isBlocked: boolean;
  isDodged: boolean;
  damageType: 'physical' | 'magic' | 'true';
  element: 'none' | 'fire' | 'ice' | 'lightning' | 'nature';
}

// ==================== 伤害事件 ====================
export interface DamageEvent {
  source: Combatant;
  target: Combatant;
  calculation: DamageCalculation;
  damageType: 'damage' | 'heal' | 'shield' | 'execute';
  timestamp: number;
  position?: { x: number; y: number; z: number };
  floatingText?: string;
}

// ==================== 战斗实体 ====================
export interface Combatant {
  id: string;
  name: string;
  stats: CombatStats;
  isAlive: boolean;
  position: { x: number; y: number; z: number };
  state: CombatState;
}

export type CombatState =
  | 'idle'
  | 'moving'
  | 'attacking'
  | 'casting'
  | 'hit'
  | 'dead'
  | 'stunned'
  | 'fleeing';

// ==================== 技能 ====================
export interface SkillDef {
  id: string;
  name: string;
  description: string;
  cost: number;
  cooldown: number;
  duration: number;
  range: number;
  areaOfEffect: number;
  damage: {
    base: number;
    scaling: number;
    type: 'physical' | 'magic' | 'true';
    element: 'none' | 'fire' | 'ice' | 'lightning' | 'nature';
  };
  heal?: {
    base: number;
    scaling: number;
  };
  effects: SkillEffect[];
  icon: string;
}

export interface SkillEffect {
  type: 'buff' | 'debuff' | 'damage' | 'heal' | 'status';
  target: 'self' | 'enemy' | 'allies' | 'all_enemies';
  duration?: number;
  value?: number;
  status?: StatusType;
  statusDuration?: number;
}

export type StatusType =
  | 'stun'
  | 'slow'
  | 'bleed'
  | 'burn'
  | 'frozen'
  | 'poison'
  | 'rage'
  | 'shield';

// ==================== 状态效果 ====================
export interface StatusEffect {
  type: StatusType;
  duration: number;
  tickDamage?: number;
  tickInterval?: number;
  stackCount: number;
  sourceId?: string;
}

// ==================== 战斗日志 ====================
export interface CombatLogEntry {
  timestamp: number;
  type: 'damage' | 'heal' | 'kill' | 'skill' | 'levelup' | 'loot';
  message: string;
  source?: string;
  target?: string;
  value?: number;
}

// ==================== 掉落 ====================
export interface LootDrop {
  itemId: string;
  itemName: string;
  quantity: number;
  quality: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  droppedAt: { x: number; z: number };
}

// ==================== 击杀统计 ====================
export interface KillRecord {
  enemyId: string;
  enemyName: string;
  timestamp: number;
  timeToKill: number;
  skillsUsed: string[];
}

// ==================== 敌人状态 ====================
export enum EnemyAIState {
  IDLE = 'idle',
  PATROL = 'patrol',
  CHASE = 'chase',
  ATTACK = 'attack',
  FLEE = 'flee',
  DEAD = 'dead',
}

export interface EnemyAI {
  state: EnemyAIState;
  targetId: string | null;
  patrolPoints: { x: number; z: number }[];
  currentPatrolIndex: number;
  detectionRange: number;
  attackRange: number;
  aggression: number;
  fleeThreshold: number;
  lastSeenPlayer: { x: number; z: number } | null;
}
