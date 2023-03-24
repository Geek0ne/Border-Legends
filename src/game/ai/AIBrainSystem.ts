import * as THREE from 'three';
import type {
  AIBrain,
  AIDecisionConfig,
  AIState,
  BehaviorTree,
  BossBehaviorPhase,
  BossPhase,
} from './types';
import { DEFAULT_AI_DECISION } from './types';

export class AIBrainSystem {
  private brains: Map<string, AIBrain> = new Map();
  private decisionConfigs: Map<string, AIDecisionConfig> = new Map();
  private currentStates: Map<string, AIState> = new Map();
  private lastPathUpdate: Map<string, number> = new Map();
  private lastSkillCheck: Map<string, number> = new Map();
  private pathRecalcInterval: number = 1.5;
  private skillCheckInterval: number = 0.5;

  registerBrain(
    entityId: string,
    config: Partial<AIBrain> = {}
  ): AIBrain {
    const brain: AIBrain = {
      entityId,
      state: AIState.IDLE,
      memory: [],
      maxMemory: 50,
      currentTarget: undefined,
      combatStrategy: 'balanced',
      skillPreference: 'cooldown',
      difficulty: 'normal',
      ...config,
    };
    this.brains.set(entityId, brain);
    return brain;
  }

  updateBrain(
    entityId: string,
    position: THREE.Vector3,
    playerPositions: THREE.Vector3[],
    deltaTime: number
  ): void {
    const brain = this.brains.get(entityId);
    if (!brain) return;
    this.currentStates.set(entityId, brain.state);

    // 状态机更新
    switch (brain.state) {
      case AIState.IDLE:
        this.updateIdle(entityId, position, playerPositions, deltaTime);
        break;
      case AIState.PATROL:
        this.updatePatrol(entityId, position, playerPositions, deltaTime);
        break;
      case AIState.CHASE:
        this.updateChase(entityId, position, playerPositions, deltaTime);
        break;
      case AIState.ATTACK:
        this.updateAttack(entityId, position, playerPositions, deltaTime);
        break;
      case AIState.FLEE:
        this.updateFlee(entityId, position, playerPositions, deltaTime);
        break;
    }
  }

  private updateIdle(
    entityId: string,
    position: THREE.Vector3,
    playerPositions: THREE.Vector3[],
    deltaTime: number
  ): void {
    const brain = this.brains.get(entityId);
    if (!brain) return;
    const config = this.decisionConfigs.get(entityId) ?? DEFAULT_AI_DECISION;

    // 检测玩家进入感知范围
    const detected = playerPositions.some((pp) =>
      pp.distanceTo(position) < config.aggroRange
    );
    if (detected) {
      brain.state = AIState.AGGRO;
      this.recordMemory(entityId, {
        entityId,
        timestamp: Date.now(),
        type: 'player_attack',
        data: { trigger: 'aggro' },
      });
    }
  }

  private updatePatrol(
    entityId: string,
    position: THREE.Vector3,
    playerPositions: THREE.Vector3[],
    deltaTime: number
  ): void {
    const brain = this.brains.get(entityId);
    if (!brain) return;
    const config = this.decisionConfigs.get(entityId) ?? DEFAULT_AI_DECISION;

    const detected = playerPositions.some((pp) =>
      pp.distanceTo(position) < config.aggroRange
    );
    if (detected) {
      brain.state = AIState.AGGRO;
    }
  }

  private updateChase(
    entityId: string,
    position: THREE.Vector3,
    playerPositions: THREE.Vector3[],
    deltaTime: number
  ): void {
    const brain = this.brains.get(entityId);
    if (!brain) return;
    const config = this.decisionConfigs.get(entityId) ?? DEFAULT_AI_DECISION;

    if (!brain.currentTarget) {
      brain.currentTarget = this.selectTarget(playerPositions);
    }

    if (!brain.currentTarget) return;

    const playerPos = playerPositions[0];
    if (!playerPos) return;

    const dist = playerPos.distanceTo(position);
    if (dist > config.combatRange) {
      this.currentStates.set(entityId, AIState.CHASE);
      // 返回运动数据
      return;
    } else {
      this.currentStates.set(entityId, AIState.ATTACK);
    }
  }

  private updateAttack(
    entityId: string,
    position: THREE.Vector3,
    playerPositions: THREE.Vector3[],
    deltaTime: number
  ): void {
    const brain = this.brains.get(entityId);
    if (!brain) return;
    const config = this.decisionConfigs.get(entityId) ?? DEFAULT_AI_DECISION;

    // 检查是否应该使用技能
    const now = Date.now();
    const lastCheck = this.lastSkillCheck.get(entityId) ?? 0;
    if (now - lastCheck > this.skillCheckInterval * 1000) {
      this.lastSkillCheck.set(entityId, now);
      // 技能使用逻辑
    }

    // 检查是否应该撤退
    if (brain.currentTarget) {
      const targetDist = position.distanceTo(playerPositions[0] ?? new THREE.Vector3());
      if (targetDist > config.fleeDistance) {
        this.currentStates.set(entityId, AIState.FLEE);
      }
    }
  }

  private updateFlee(
    entityId: string,
    position: THREE.Vector3,
    playerPositions: THREE.Vector3[],
    deltaTime: number
  ): void {
    const brain = this.brains.get(entityId);
    if (!brain) return;
    const config = this.decisionConfigs.get(entityId) ?? DEFAULT_AI_DECISION;

    // 撤退逻辑
    if (!brain.currentTarget) return;
    const targetPos = playerPositions[0] ?? new THREE.Vector3();
    const dist = targetPos.distanceTo(position);
    if (dist < config.combatRange * 1.5) {
      this.currentStates.set(entityId, AIState.CHASE);
    }
  }

  private selectTarget(playerPositions: THREE.Vector3[]): string | undefined {
    // 简化：返回第一个玩家位置
    return playerPositions[0]?.x.toString();
  }

  recordMemory(
    entityId: string,
    entry: {
      entityId: string;
      timestamp: number;
      type: 'player_attack' | 'player_flee' | 'skill_used' | 'death' | 'summon';
      data: Record<string, any>;
    }
  ): void {
    const brain = this.brains.get(entityId);
    if (!brain) return;
    brain.memory.push(entry);
    if (brain.memory.length > brain.maxMemory) {
      brain.memory.shift();
    }
  }

  getBrain(entityId: string): AIBrain | undefined {
    return this.brains.get(entityId);
  }

  setState(entityId: string, state: AIState): void {
    const brain = this.brains.get(entityId);
    if (brain) {
      brain.state = state;
      this.currentStates.set(entityId, state);
    }
  }

  getState(entityId: string): AIState {
    return this.currentStates.get(entityId) ?? AIState.IDLE;
  }

  setDecisionConfig(entityId: string, config: AIDecisionConfig): void {
    this.decisionConfigs.set(entityId, config);
  }

  getDecisionConfig(entityId: string): AIDecisionConfig {
    return this.decisionConfigs.get(entityId) ?? DEFAULT_AI_DECISION;
  }

  changeCombatStrategy(entityId: string, strategy: AIBrain['combatStrategy']): void {
    const brain = this.brains.get(entityId);
    if (brain) brain.combatStrategy = strategy;
  }

  changeSkillPreference(entityId: string, pref: AIBrain['skillPreference']): void {
    const brain = this.brains.get(entityId);
    if (brain) brain.skillPreference = pref;
  }
}

// ==================== Boss AI 管理器 ====================
export class BossAISystem {
  private bossData: Map<
    string,
    {
      currentPhase: BossPhase;
      phases: BossBehaviorPhase[];
      enabledSkills: string[];
      summonCooldowns: Map<string, number>;
      lastPhaseTransition: number;
    }
  > = new Map();

  registerBoss(
    entityId: string,
    phases: BossBehaviorPhase[]
  ): void {
    this.bossData.set(entityId, {
      currentPhase: phases[0]?.phase ?? BossPhase.PHASE_1,
      phases,
      enabledSkills: phases[0]?.enabledSkills ?? [],
      summonCooldowns: new Map(),
      lastPhaseTransition: Date.now(),
    });
  }

  updateBoss(
    entityId: string,
    currentHpPercent: number,
    deltaTime: number
  ): void {
    const boss = this.bossData.get(entityId);
    if (!boss) return;

    // 检查阶段转换
    for (const phase of boss.phases) {
      if (
        currentHpPercent <= phase.hpThreshold &&
        boss.currentPhase !== phase.phase
      ) {
        this.transitionPhase(entityId, phase);
        break;
      }
    }

    // 更新技能冷却
    for (const [skillId, cooldown] of boss.summonCooldowns) {
      if (cooldown > 0) {
        boss.summonCooldowns.set(skillId, cooldown - deltaTime);
      }
    }
  }

  private transitionPhase(
    entityId: string,
    newPhase: BossBehaviorPhase
  ): void {
    const boss = this.bossData.get(entityId);
    if (!boss) return;
    boss.currentPhase = newPhase.phase;
    boss.enabledSkills = newPhase.enabledSkills;
    boss.lastPhaseTransition = Date.now();
  }

  getEnabledSkills(entityId: string): string[] {
    const boss = this.bossData.get(entityId);
    return boss?.enabledSkills ?? [];
  }

  getBossPhase(entityId: string): BossPhase {
    const boss = this.bossData.get(entityId);
    return boss?.currentPhase ?? BossPhase.PHASE_1;
  }

  canUseSkill(entityId: string, skillId: string): boolean {
    const boss = this.bossData.get(entityId);
    if (!boss) return false;
    const cooldown = boss.summonCooldowns.get(skillId) ?? 0;
    return cooldown <= 0;
  }

  setSkillCooldown(entityId: string, skillId: string, duration: number): void {
    const boss = this.bossData.get(entityId);
    if (boss) {
      boss.summonCooldowns.set(skillId, duration);
    }
  }
}
