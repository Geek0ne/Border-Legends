/**
 * 边境传说 - 任务管理器
 * 管理任务进度、目标更新、任务完成、奖励发放
 */

import { Quest, QuestSaveEntry, QuestObjectiveType } from '../../types';
import { QUEST_MAP } from '../../data';
import { HUDSystem } from '../hud/HUDSystem';
import { InventorySystem } from '../../systems/InventorySystem';

export class QuestManager {
  private quests: Map<string, Quest> = new Map();
  private completedQuests: Set<string> = new Set();
  private hud: HUDSystem;
  private inventory: InventorySystem;

  constructor(hud: HUDSystem, inventory: InventorySystem) {
    this.hud = hud;
    this.inventory = inventory;
  }

  public addQuest(questId: string): Quest {
    const def = QUEST_MAP[questId];
    if (!def) throw new Error('Quest not found: ' + questId);
    const quest: Quest = {
      ...def,
      stage: 0,
      isCompleted: false,
      isActive: true,
      isDaily: false,
    };
    this.quests.set(questId, quest);
    this.hud.showNotification('新任务: ' + quest.title);
    this.updateActiveQuests();
    return quest;
  }

  public advanceStage(questId: string): boolean {
    const quest = this.quests.get(questId);
    if (!quest) return false;
    if (quest.stage >= quest.stages.length - 1) return false;
    quest.stage++;
    if (quest.stage === quest.stages.length - 1 && this.isObjectiveComplete(quest)) {
      this.completeQuest(questId);
    }
    this.updateActiveQuests();
    return true;
  }

  public completeQuest(questId: string): void {
    const quest = this.quests.get(questId);
    if (!quest) return;
    quest.isCompleted = true;
    this.completedQuests.add(questId);
    if (quest.rewards) {
      if (quest.rewards.experience) this.hud.addXP(quest.rewards.experience);
      if (quest.rewards.gold) this.hud.addGold(quest.rewards.gold);
      if (quest.rewards.items) {
        for (const itemId of quest.rewards.items) {
          this.inventory.addItem(itemId);
        }
      }
      this.hud.showNotification('任务完成: ' + quest.title);
    }
    this.updateActiveQuests();
  }

  public checkObjectives(): void {
    for (const [id, quest] of this.quests) {
      if (quest.isCompleted || !quest.isActive) continue;
      const stageData = quest.stages[quest.stage];
      if (!stageData) continue;
      if (this.isObjectiveComplete(quest)) {
        this.hud.showNotification('目标完成: ' + stageData.description);
        if (quest.stage < quest.stages.length - 1) {
          quest.stage++;
        } else {
          this.completeQuest(id);
        }
        this.updateActiveQuests();
      }
    }
  }

  private isObjectiveComplete(quest: Quest): boolean {
    const stageData = quest.stages[quest.stage];
    if (!stageData) return false;
    const obj = stageData.objective;
    if (obj.type === 'kill') {
      return (obj.currentCount || 0) >= (obj.targetCount || 0);
    }
    if (obj.type === 'collect' && obj.itemId) {
      return this.inventory.hasItem(obj.itemId);
    }
    return true;
  }

  private updateActiveQuests(): void {
    const active = Array.from(this.quests.values())
      .filter(q => q.isActive && !q.isCompleted);
    this.hud.setActiveQuests(active);
  }

  public getQuest(id: string): Quest | undefined {
    return this.quests.get(id);
  }

  public getActiveQuests(): Quest[] {
    return Array.from(this.quests.values())
      .filter(q => q.isActive && !q.isCompleted);
  }

  public saveState(): QuestSaveEntry[] {
    const entries: QuestSaveEntry[] = [];
    for (const [id, quest] of this.quests) {
      entries.push({ questId: id, stage: quest.stage, isCompleted: quest.isCompleted });
    }
    return entries;
  }

  public loadState(entries: QuestSaveEntry[]): void {
    for (const entry of entries) {
      const quest = this.quests.get(entry.questId);
      if (quest) {
        quest.stage = entry.stage;
        quest.isCompleted = entry.isCompleted;
      }
    }
  }

  public getCompletedCount(): number { return this.completedQuests.size; }
}
