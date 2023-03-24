import * as THREE from 'three';
import {
  BehaviorNode,
  BehaviorTree,
  BehaviorNodeType,
} from './types';

export class BehaviorTreeEngine {
  private activeTrees: Map<string, BehaviorTree> = new Map();
  private nodeStates: Map<string, number> = new Map(); // node id -> tick count
  private entityContext: Map<string, any> = new Map(); // entityId -> context

  registerTree(tree: BehaviorTree): void {
    this.activeTrees.set(tree.id, tree);
  }

  executeTree(
    treeId: string,
    entityId: string,
    deltaTime: number
  ): {
    action?: string;
    params?: Record<string, any>;
    completed: boolean;
  } {
    const tree = this.activeTrees.get(treeId);
    if (!tree) return { completed: true };

    const ctx = this.getContext(entityId);
    const root = tree.nodes[tree.rootNodeId];
    if (!root) return { completed: true };

    return this.evaluateNode(root, ctx, deltaTime);
  }

  private getContext(entityId: string): Map<string, any> {
    if (!this.entityContext.has(entityId)) {
      this.entityContext.set(entityId, new Map());
    }
    return this.entityContext.get(entityId) as Map<string, any>;
  }

  setContext(entityId: string, key: string, value: any): void {
    const ctx = this.getContext(entityId);
    ctx.set(key, value);
  }

  getContextValue(entityId: string, key: string): any {
    const ctx = this.getContext(entityId);
    return ctx.get(key);
  }

  private evaluateNode(
    node: BehaviorNode,
    ctx: Map<string, any>,
    deltaTime: number
  ): { action?: string; params?: Record<string, any>; completed: boolean } {
    switch (node.type) {
      case BehaviorNodeType.ROOT:
        if (node.children?.length) {
          return this.evaluateNode(ctx.get(node.children[0]) ?? {}, ctx, deltaTime);
        }
        return { completed: true };

      case BehaviorNodeType.SEQUENCE:
        return this.evaluateSequence(node, ctx, deltaTime);

      case BehaviorNodeType.SELECTOR:
        return this.evaluateSelector(node, ctx, deltaTime);

      case BehaviorNodeType.PRIORITY:
        return this.evaluatePriority(node, ctx, deltaTime);

      case BehaviorNodeType.CONDITION:
        return this.evaluateCondition(node, ctx);

      case BehaviorNodeType.ACTION:
        return this.evaluateAction(node, ctx, deltaTime);

      case BehaviorNodeType.WAIT:
        return this.evaluateWait(node, ctx, deltaTime);

      case BehaviorNodeType.REPEATER:
        return this.evaluateRepeater(node, ctx, deltaTime);

      case BehaviorNodeType.RANDOM:
        return this.evaluateRandom(node, ctx, deltaTime);

      case BehaviorNodeType.MOVE_TO:
        return { action: 'move_to', params: node.params ?? {}, completed: false };

      case BehaviorNodeType.ATTACK:
        return { action: 'attack', params: node.params ?? {}, completed: false };

      case BehaviorNodeType.FLEE:
        return { action: 'flee', params: node.params ?? {}, completed: false };

      case BehaviorNodeType.CHASE:
        return { action: 'chase', params: node.params ?? {}, completed: false };

      case BehaviorNodeType.PATROL:
        return { action: 'patrol', params: node.params ?? {}, completed: false };

      case BehaviorNodeType.IDLE:
        return { action: 'idle', completed: true };

      case BehaviorNodeType.USE_SKILL:
        return {
          action: 'use_skill',
          params: node.params ?? {},
          completed: false,
        };

      case BehaviorNodeType.SUMMON:
        return { action: 'summon', params: node.params ?? {}, completed: false };

      case BehaviorNodeType.INTERRUPT:
        return { action: 'interrupt', completed: false };

      default:
        return { completed: true };
    }
  }

  private evaluateSequence(
    node: BehaviorNode,
    ctx: Map<string, any>,
    deltaTime: number
  ): { action?: string; params?: Record<string, any>; completed: boolean } {
    if (!node.children?.length) return { completed: true };
    for (const childId of node.children) {
      const child = ctx.get(childId) as BehaviorNode;
      if (!child) continue;
      const result = this.evaluateNode(child, ctx, deltaTime);
      if (!result.completed) return result;
    }
    return { completed: true };
  }

  private evaluateSelector(
    node: BehaviorNode,
    ctx: Map<string, any>,
    deltaTime: number
  ): { action?: string; params?: Record<string, any>; completed: boolean } {
    if (!node.children?.length) return { completed: true };
    for (const childId of node.children) {
      const child = ctx.get(childId) as BehaviorNode;
      if (!child) continue;
      const result = this.evaluateNode(child, ctx, deltaTime);
      if (!result.completed) return result;
    }
    return { completed: true };
  }

  private evaluatePriority(
    node: BehaviorNode,
    ctx: Map<string, any>,
    deltaTime: number
  ): { action?: string; params?: Record<string, any>; completed: boolean } {
    if (!node.children?.length) return { completed: true };
    // 按优先级排序
    const sorted = [...node.children].sort((a, b) => {
      const na = ctx.get(a) as BehaviorNode;
      const nb = ctx.get(b) as BehaviorNode;
      return (nb?.priority ?? 0) - (na?.priority ?? 0);
    });
    for (const childId of sorted) {
      const child = ctx.get(childId) as BehaviorNode;
      if (!child) continue;
      const result = this.evaluateNode(child, ctx, deltaTime);
      if (!result.completed) return result;
    }
    return { completed: true };
  }

  private evaluateCondition(
    node: BehaviorNode,
    ctx: Map<string, any>
  ): { action?: string; params?: Record<string, any>; completed: boolean } {
    if (!node.condition) return { completed: true };
    // 简化：条件满足即通过
    return { completed: true };
  }

  private evaluateAction(
    node: BehaviorNode,
    ctx: Map<string, any>,
    deltaTime: number
  ): { action?: string; params?: Record<string, any>; completed: boolean } {
    if (!node.action) return { completed: true };
    return { action: node.action, params: node.params ?? {}, completed: false };
  }

  private evaluateWait(
    node: BehaviorNode,
    ctx: Map<string, any>,
    deltaTime: number
  ): { action?: string; params?: Record<string, any>; completed: boolean } {
    const nodeId = ctx.get('__current_node_id__') ?? 'default';
    let count = this.nodeStates.get(nodeId) ?? 0;
    count += deltaTime;
    this.nodeStates.set(nodeId, count);

    const waitTime = node.params?.waitTime ?? 1;
    return count >= waitTime ? { completed: true } : { completed: false };
  }

  private evaluateRepeater(
    node: BehaviorNode,
    ctx: Map<string, any>,
    deltaTime: number
  ): { action?: string; params?: Record<string, any>; completed: boolean } {
    const nodeId = ctx.get('__current_node_id__') ?? 'default';
    let count = this.nodeStates.get(nodeId) ?? 0;
    const maxCount = node.repeatCount ?? 1;
    return count >= maxCount ? { completed: true } : { completed: false };
  }

  private evaluateRandom(
    node: BehaviorNode,
    ctx: Map<string, any>,
    deltaTime: number
  ): { action?: string; params?: Record<string, any>; completed: boolean } {
    if (!node.children?.length) return { completed: true };
    const idx = Math.floor(Math.random() * node.children.length);
    const childId = node.children[idx];
    const child = ctx.get(childId) as BehaviorNode;
    if (!child) return { completed: true };
    return this.evaluateNode(child, ctx, deltaTime);
  }

  resetContext(entityId: string): void {
    this.entityContext.delete(entityId);
    this.nodeStates.clear();
  }

  destroy(): void {
    this.activeTrees.clear();
    this.entityContext.clear();
    this.nodeStates.clear();
  }
}

// ==================== 预置行为树 ====================
export const DEFAULT_ENEMY_BEHAVIOR: BehaviorTree = {
  id: 'default_enemy',
  name: '默认敌人AI',
  description: '标准的敌人行为树：巡逻→索敌→追击→攻击→撤退',
  rootNodeId: 'root',
  nodes: {
    root: {
      id: 'root',
      type: BehaviorNodeType.ROOT,
      name: '根节点',
      description: '',
      children: ['selector_1'],
    },
    selector_1: {
      id: 'selector_1',
      type: BehaviorNodeType.SELECTOR,
      name: '决策选择器',
      description: '选择第一个满足条件的行为',
      children: ['attack_action', 'chase_action', 'patrol_action', 'idle_action'],
    },
    attack_action: {
      id: 'attack_action',
      type: BehaviorNodeType.ACTION,
      name: '攻击',
      description: '对目标进行攻击',
      action: 'attack',
      params: { damageMultiplier: 1.0 },
      priority: 3,
    },
    chase_action: {
      id: 'chase_action',
      type: BehaviorNodeType.ACTION,
      name: '追击',
      description: '追击目标到攻击范围',
      action: 'chase',
      params: { speedMultiplier: 1.2 },
      priority: 2,
    },
    patrol_action: {
      id: 'patrol_action',
      type: BehaviorNodeType.ACTION,
      name: '巡逻',
      description: '在巡逻区域内移动',
      action: 'patrol',
      params: { patrolRadius: 10 },
      priority: 1,
    },
    idle_action: {
      id: 'idle_action',
      type: BehaviorNodeType.ACTION,
      name: '待机',
      description: '等待指令',
      action: 'idle',
      priority: 0,
    },
  },
};

export const BOSS_BEHAVIOR: BehaviorTree = {
  id: 'boss_default',
  name: 'Boss AI',
  description: 'Boss专用行为树，包含特殊技能和召唤逻辑',
  rootNodeId: 'root',
  nodes: {
    root: {
      id: 'root',
      type: BehaviorNodeType.ROOT,
      name: '根节点',
      description: '',
      children: ['priority_1'],
    },
    priority_1: {
      id: 'priority_1',
      type: BehaviorNodeType.PRIORITY,
      name: '优先级决策',
      description: '按优先级选择行为',
      children: ['ultimate_skill', 'special_skill', 'attack_action', 'chase_action', 'idle_action'],
    },
    ultimate_skill: {
      id: 'ultimate_skill',
      type: BehaviorNodeType.ACTION,
      name: '终极技能',
      description: '使用终极技能',
      action: 'use_skill',
      params: { skillId: 'meteor' },
      priority: 10,
    },
    special_skill: {
      id: 'special_skill',
      type: BehaviorNodeType.ACTION,
      name: '特殊技能',
      description: '使用特殊技能',
      action: 'use_skill',
      params: { skillId: 'fireball' },
      priority: 5,
    },
    attack_action: {
      id: 'attack_action',
      type: BehaviorNodeType.ACTION,
      name: '攻击',
      description: '对目标进行攻击',
      action: 'attack',
      params: { damageMultiplier: 1.5 },
      priority: 3,
    },
    chase_action: {
      id: 'chase_action',
      type: BehaviorNodeType.ACTION,
      name: '追击',
      description: '追击目标',
      action: 'chase',
      params: { speedMultiplier: 1.0 },
      priority: 2,
    },
    idle_action: {
      id: 'idle_action',
      type: BehaviorNodeType.ACTION,
      name: '待机',
      description: '等待',
      action: 'idle',
      priority: 0,
    },
  },
};