/**
 * 边境传说 - 战斗类型定义
 */
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
export interface DamageCalculation {
    damage: number;
    isCrit: boolean;
    isBlocked: boolean;
    isDodged: boolean;
    damageType: 'physical' | 'magic' | 'true';
    element: 'none' | 'fire' | 'ice' | 'lightning' | 'nature';
}
export interface DamageEvent {
    source: Combatant;
    target: Combatant;
    calculation: DamageCalculation;
    damageType: 'damage' | 'heal' | 'shield' | 'execute';
    timestamp: number;
    position?: {
        x: number;
        y: number;
        z: number;
    };
    floatingText?: string;
}
export interface Combatant {
    id: string;
    name: string;
    stats: CombatStats;
    isAlive: boolean;
    position: {
        x: number;
        y: number;
        z: number;
    };
    state: CombatState;
}
export type CombatState = 'idle' | 'moving' | 'attacking' | 'casting' | 'hit' | 'dead' | 'stunned' | 'fleeing';
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
export type StatusType = 'stun' | 'slow' | 'bleed' | 'burn' | 'frozen' | 'poison' | 'rage' | 'shield';
export interface StatusEffect {
    type: StatusType;
    duration: number;
    tickDamage?: number;
    tickInterval?: number;
    stackCount: number;
    sourceId?: string;
}
export interface CombatLogEntry {
    timestamp: number;
    type: 'damage' | 'heal' | 'kill' | 'skill' | 'levelup' | 'loot';
    message: string;
    source?: string;
    target?: string;
    value?: number;
}
export interface KillRecord {
    enemyId: string;
    enemyName: string;
    timestamp: number;
    timeToKill: number;
    skillsUsed: string[];
}
export declare enum EnemyAIState {
    IDLE = "idle",
    PATROL = "patrol",
    CHASE = "chase",
    ATTACK = "attack",
    FLEE = "flee",
    DEAD = "dead"
}
export interface EnemyAI {
    state: EnemyAIState;
    targetId: string | null;
    patrolPoints: {
        x: number;
        z: number;
    }[];
    currentPatrolIndex: number;
    detectionRange: number;
    attackRange: number;
    aggression: number;
    fleeThreshold: number;
    lastSeenPlayer: {
        x: number;
        z: number;
    } | null;
}
