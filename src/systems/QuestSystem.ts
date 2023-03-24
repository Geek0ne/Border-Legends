/**
 * 边境传说 - 任务系统
 * 管理任务的激活、进度追踪和完成
 */

import { Quest, QuestSaveEntry, QuestStageData, QuestStage, QuestObjectiveType, QuestRewards } from '../types';
import { QUEST_MAP, ALL_QUESTS } from '../data';

export class QuestSystem {
  private activeQuests: Map<string, Quest> = new Map();
  private completedQuests: Set<string> = new Set();
  private dailyResetTime: number = 0;

  /** 激活任务 */
  public activateQuest(questId: string, stage: number = 0): boolean {
    const quest = QUEST_MAP[questId];
    if (!quest) return false;

    const questCopy = { ...quest, stage, isCompleted: false, isActive: true };
    this.activeQuests.set(questId, questCopy);
    return true;
  }

  /** 更新任务进度 */
  public updateProgress(questId: string, objectiveType: QuestObjectiveType, targetId?: string, increment: number = 1): Quest | null {
    const quest = this.activeQuests.get(questId);
    if (!quest) return null;

    const stageData = quest.stages[quest.stage];
    if (!stageData) return null;

    // 检查目标类型是否匹配当前阶段
    const matchesCurrentStage = stageData.objective.type === objectiveType;
    if (!matchesCurrentStage) {
      // 尝试找匹配的阶段
      const matchingStageIndex = quest.stages.findIndex(
        s => s.objective.type === objectiveType && s.objective.currentCount! < s.objective.targetCount!
      );
      if (matchingStageIndex >= 0) {
        quest.stage = matchingStageIndex;
      } else {
        return null;
      }
    }

    const currentStage = quest.stages[quest.stage];
    const obj = currentStage.objective!;
    obj.currentCount! = Math.min((obj.currentCount || 0) + increment, obj.targetCount!);;

    // 检查是否完成当前阶段
    if ((currentStage.objective.currentCount || 0) >= (currentStage.objective.targetCount || 0)) {
      // 尝试进入下一阶段
      const nextStage = quest.stage + 1;
      if (nextStage < quest.stages.length) {
        quest.stage = nextStage;
        // 检查是否所有阶段都完成了
        if (quest.stage === quest.stages.length - 1 &&
            (quest.stages[quest.stage].objective.currentCount || 0) >= (quest.stages[quest.stage].objective.targetCount || 0)) {
          this.completeQuest(questId);
        }
      } else {
        this.completeQuest(questId);
      }
    }

    return quest;
  }

  /** 完成任务 */
  private completeQuest(questId: string): void {
    const quest = this.activeQuests.get(questId);
    if (!quest) return;
    quest.isCompleted = true;
    quest.isActive = false;
    this.completedQuests.add(questId);
    this.activeQuests.delete(questId);
  }

  /** 获取任务奖励 */
  public getRewards(questId: string): QuestRewards | null {
    const quest = QUEST_MAP[questId];
    return quest ? quest.rewards : null;
  }

  /** 检查任务是否可接取 */
  public isQuestAvailable(questId: string): boolean {
    const quest = QUEST_MAP[questId];
    if (!quest) return false;
    if (this.completedQuests.has(questId)) return false;
    if (this.activeQuests.has(questId)) return false;
    if (quest.isDaily) {
      const now = Date.now();
      return now - this.dailyResetTime > 86400000;
    }
    return true;
  }

  /** 获取所有活动任务 */
  public getActiveQuests(): Quest[] {
    return Array.from(this.activeQuests.values());
  }

  /** 获取已完成任务 */
  public getCompletedQuests(): string[] {
    return Array.from(this.completedQuests);
  }

  /** 获取可接取任务 */
  public getAvailableQuests(): string[] {
    return ALL_QUESTS
      .filter(q => this.isQuestAvailable(q.id))
      .map(q => q.id);
  }

  /** 重置每日任务 */
  public resetDailyQuests(): void {
    this.dailyResetTime = Date.now();
    ALL_QUESTS
      .filter(q => q.isDaily && this.completedQuests.has(q.id))
      .forEach(q => this.completedQuests.delete(q.id));
  }

  /** 保存任务状态 */
  public saveState(): QuestSaveEntry[] {
    const entries: QuestSaveEntry[] = [];
    for (const [id, quest] of this.activeQuests) {
      entries.push({ questId: id, stage: quest.stage, isCompleted: quest.isCompleted });
    }
    for (const id of this.completedQuests) {
      if (!this.activeQuests.has(id)) {
        entries.push({ questId: id, stage: 0, isCompleted: true });
      }
    }
    return entries;
  }

  /** 加载任务状态 */
  public loadState(entries: QuestSaveEntry[]): void {
    this.activeQuests.clear();
    this.completedQuests.clear();
    for (const entry of entries) {
      const quest = QUEST_MAP[entry.questId];
      if (!quest) continue;
      if (entry.isCompleted) {
        this.completedQuests.add(entry.questId);
      } else {
        const questCopy = { ...quest, stage: entry.stage, isCompleted: false, isActive: true };
        this.activeQuests.set(entry.questId, questCopy);
      }
    }
  }
}

