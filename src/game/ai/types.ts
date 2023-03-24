// ==================== AI 行为树类型 ====================
export enum BehaviorNodeType {
  ROOT = 'root',
  SEQUENCE = 'sequence',
  SELECTOR = 'selector',
  CONDITION = 'condition',
  ACTION = 'action',
  PRIORITY = 'priority',
  REPEATER = 'repeater',
  RANDOM = 'random',
  WAIT = 'wait',
  MOVE_TO = 'move_to',
  ATTACK = 'attack',
  FLEE = 'flee',
  CHASE = ' Chase',
  PATROL = 'patrol',
  IDLE = 'idle',
  USE_SKILL = 'use_skill',
  SUMMON = 'summon',
  INTERRUPT = 'interrupt',
}

export interface BehaviorNode {
  id: string;
  type: BehaviorNodeType;
  name: string;
  description: string;
  children?: string[];
  // 条件节点特有字段
  condition?: string;
  // 动作节点特有字段
  action?: string;
  params?: Record<string, any>;
  priority?: number;
  // 重试/循环
  maxRetries?: number;
  repeatCount?: number;
  tickInterval?: number;
}

export interface BehaviorTree {
  id: string;
  name: string;
  description: string;
  rootNodeId: string;
  nodes: Record<string, BehaviorNode>;
}

// ==================== AI 状态枚举 ====================
export enum AIState {
  IDLE = 'idle',
  PATROL = 'patrol',
  CHASE = ' Chase',
  ATTACK = 'attack',
  FLEE = 'flee',
  USING_SKILL = 'using_skill',
  STUNNED = 'stunned',
  DEAD = 'dead',
  AGGRO = 'aggro',
  RETURNING = 'returning',
  SUMMONING = 'summoning',
}

// ==================== AI 决策配置 ====================
export interface AIDecisionConfig {
  // 感知范围
  perceptionRadius: number;
  // 索敌范围
  aggroRange: number;
  // 战斗范围
  combatRange: number;
  // 撤退距离
  fleeDistance: number;
  // 索敌优先级
  targetPriority: 'lowest_hp' | 'highest_attack' | 'closest' | 'random';
  // 技能使用阈值
  skillUsageThresholds: Record<string, number>;
  // 路径查找间隔（秒）
  pathRecalcInterval: number;
  // 最大寻路尝试次数
  maxPathAttempts: number;
}

export const DEFAULT_AI_DECISION: AIDecisionConfig = {
  perceptionRadius: 30,
  aggroRange: 20,
  combatRange: 5,
  fleeDistance: 15,
  targetPriority: 'lowest_hp',
  skillUsageThresholds: {
    heal: 0.3,
    burst: 0.5,
    cc: 0.8,
    ultimate: 0.9,
  },
  pathRecalcInterval: 1.5,
  maxPathAttempts: 3,
};

// ==================== AI 记忆系统 ====================
export interface AIEntry {
  entityId: string;
  timestamp: number;
  type: 'player_attack' | 'player_flee' | 'skill_used' | 'death' | 'summon';
  data: Record<string, any>;
}

export interface AIBrain {
  entityId: string;
  state: AIState;
  memory: AIEntry[];
  maxMemory: number;
  // 当前目标
  currentTarget?: string;
  // 战斗策略
  combatStrategy: 'aggressive' | 'defensive' | 'balanced';
  // 技能使用偏好
  skillPreference: 'random' | 'cooldown' | 'damage';
  // 智能难度
  difficulty: 'easy' | 'normal' | 'hard' | 'brutal';
}

// ==================== Boss AI 专用 ====================
export enum BossPhase {
  PHASE_1 = 'phase_1',
  PHASE_2 = 'phase_2',
  PHASE_3 = 'phase_3',
  ENRAGE = 'enrage',
}

export interface BossBehaviorPhase {
  phase: BossPhase;
  hpThreshold: number; // 触发该阶段的生命值百分比
  behaviorTree?: string;
  enabledSkills: string[];
  spawnTriggers: Array<{
    condition: string;
    enemyId: string;
    count: number;
    interval: number;
  }>;
  specialAbilities: Array<{
    skillId: string;
    triggerChance: number;
    cooldown: number;
    targetCount: number;
  }>;
}
