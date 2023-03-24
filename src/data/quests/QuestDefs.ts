/**
 * 边境传说 - 任务数据定义（已适配新类型）
 */

import { Quest, QuestType, QuestStage, QuestObjectiveType, QuestRequirements, QuestRewards, QuestStageData } from '../../types';

// ==================== 主线任务 ====================

const makeRequirements = (level: number, items: string[]): QuestRequirements => ({ level, items });

const makeRewards = (xp: number, gold: number, items: string[]): QuestRewards => ({ experience: xp, gold, items });

const mainCh1Stages: QuestStageData[] = [
  {
    stage: QuestStage.TALK,
    description: '与村长对话',
    objective: { type: QuestObjectiveType.TALK, npcId: 'village_chief', targetCount: 1, currentCount: 0 },
  },
  {
    stage: QuestStage.EXPLORATION,
    description: '前往废弃矿洞入口',
    objective: { type: QuestObjectiveType.TRAVEL, locationId: 'mine_entrance', targetCount: 1, currentCount: 0 },
  },
  {
    stage: QuestStage.COMBAT,
    description: '消灭矿洞中的骷髅兵（0/5）',
    objective: { type: QuestObjectiveType.KILL, targetId: 'skeleton', targetCount: 5, currentCount: 0 },
  },
  {
    stage: QuestStage.EXPLORATION,
    description: '在矿洞中找到矿洞日志',
    objective: { type: QuestObjectiveType.FIND, targetId: 'mine_log', targetCount: 1, currentCount: 0 },
  },
  {
    stage: QuestStage.TALK,
    description: '返回村庄向村长报告',
    objective: { type: QuestObjectiveType.TALK, npcId: 'village_chief', targetCount: 1, currentCount: 0 },
  },
];

export const MAIN_QUEST_CHAPTER1_START: Quest = {
  id: 'main_ch1_start',
  title: '边境的召唤',
  type: QuestType.MAIN,
  chapter: 1,
  description: '边境小镇传来消息，附近的村落出现了不明生物的袭击。村长希望你能前去调查。',
  stages: mainCh1Stages,
  requirements: makeRequirements(1, []),
  rewards: makeRewards(100, 50, ['iron_sword', 'small_health_potion']),
  stage: 0,
  isCompleted: false,
  isActive: false,
  isDaily: false,
};

const mainCh1EndStages: QuestStageData[] = [
  {
    stage: QuestStage.EXPLORATION,
    description: '深入矿洞底层',
    objective: { type: QuestObjectiveType.TRAVEL, locationId: 'mine_bottom', targetCount: 1, currentCount: 0 },
  },
  {
    stage: QuestStage.COMBAT,
    description: '击败骷髅骑士（0/1）',
    objective: { type: QuestObjectiveType.KILL, targetId: 'elite_skeleton_knight', targetCount: 1, currentCount: 0 },
  },
  {
    stage: QuestStage.TALK,
    description: '返回村庄报告',
    objective: { type: QuestObjectiveType.TALK, npcId: 'village_chief', targetCount: 1, currentCount: 0 },
  },
];

export const MAIN_QUEST_CHAPTER1_END: Quest = {
  id: 'main_ch1_end',
  title: '矿洞深处的秘密',
  type: QuestType.MAIN,
  chapter: 1,
  description: '矿洞深处似乎有什么东西在召唤着你。你需要深入探索，揭开矿洞的秘密。',
  stages: mainCh1EndStages,
  requirements: makeRequirements(5, ['bone_shard']),
  rewards: makeRewards(500, 200, ['knight_sword', 'knight_shield', 'rare_gem']),
  stage: 0,
  isCompleted: false,
  isActive: false,
  isDaily: false,
};

// ==================== 支线任务 ====================

const sideWolfHuntStages: QuestStageData[] = [
  {
    stage: QuestStage.COMBAT,
    description: '击杀灰狼（0/10）',
    objective: { type: QuestObjectiveType.KILL, targetId: 'wolf', targetCount: 10, currentCount: 0 },
  },
  {
    stage: QuestStage.EXPLORATION,
    description: '在狼穴发现狼王',
    objective: { type: QuestObjectiveType.TRAVEL, locationId: 'wolf_nest', targetCount: 1, currentCount: 0 },
  },
  {
    stage: QuestStage.COMBAT,
    description: '击败狼王（0/1）',
    objective: { type: QuestObjectiveType.KILL, targetId: 'wolf_alpha', targetCount: 1, currentCount: 0 },
  },
  {
    stage: QuestStage.TALK,
    description: '向猎人公会回报',
    objective: { type: QuestObjectiveType.TALK, npcId: 'hunter_guild_leader', targetCount: 1, currentCount: 0 },
  },
];

export const SIDE_QUEST_WOLF_HUNT: Quest = {
  id: 'side_wolf_hunt',
  title: '狼群之患',
  type: QuestType.SIDE,
  chapter: 1,
  description: '附近的狼群越来越频繁地袭击放牧的村民，猎人公会委托你清理狼群。',
  stages: sideWolfHuntStages,
  requirements: makeRequirements(3, []),
  rewards: makeRewards(300, 150, ['alpha_collar', 'thick_pelt']),
  stage: 0,
  isCompleted: false,
  isActive: false,
  isDaily: false,
};

const sidePotionStages: QuestStageData[] = [
  {
    stage: QuestStage.COMBAT,
    description: '收集史莱姆凝胶（0/5）',
    objective: { type: QuestObjectiveType.COLLECT, targetId: 'slime_gel', targetCount: 5, currentCount: 0 },
  },
  {
    stage: QuestStage.EXPLORATION,
    description: '收集铁矿（0/3）',
    objective: { type: QuestObjectiveType.COLLECT, targetId: 'iron_ore', targetCount: 3, currentCount: 0 },
  },
  {
    stage: QuestStage.TALK,
    description: '将材料交给药剂师',
    objective: { type: QuestObjectiveType.TALK, npcId: 'alchemist', targetCount: 1, currentCount: 0 },
  },
];

export const SIDE_QUEST_POTION_MATERIALS: Quest = {
  id: 'side_potion_materials',
  title: '药水材料收集',
  type: QuestType.SIDE,
  chapter: 1,
  description: '药剂师需要一些史莱姆凝胶和铁矿来制作药水。',
  stages: sidePotionStages,
  requirements: makeRequirements(1, []),
  rewards: makeRewards(150, 80, ['small_health_potion', 'small_health_potion', 'small_mana_potion']),
  stage: 0,
  isCompleted: false,
  isActive: false,
  isDaily: false,
};

// ==================== 日常任务 ====================

export const DAILY_QUEST_SLIME_CLEAN: Quest = {
  id: 'daily_slime_clean',
  title: '史莱姆清理（每日）',
  type: QuestType.DAILY,
  chapter: 1,
  description: '清除村庄附近的史莱姆（0/5）',
  stages: [
    {
      stage: QuestStage.COMBAT,
      description: '击杀史莱姆（0/5）',
      objective: { type: QuestObjectiveType.KILL, targetId: 'slime', targetCount: 5, currentCount: 0 },
    },
    {
      stage: QuestStage.TALK,
      description: '向村长汇报',
      objective: { type: QuestObjectiveType.TALK, npcId: 'village_chief', targetCount: 1, currentCount: 0 },
    },
  ],
  requirements: makeRequirements(1, []),
  rewards: makeRewards(50, 20, ['small_health_potion']),
  stage: 0,
  isCompleted: false,
  isActive: false,
  isDaily: true,
};

export const DAILY_QUEST_EXPLORATION: Quest = {
  id: 'daily_exploration',
  title: '边境探索（每日）',
  type: QuestType.DAILY,
  chapter: 1,
  description: '探索边境区域的三个地点',
  stages: [
    {
      stage: QuestStage.EXPLORATION,
      description: '探索矿洞入口',
      objective: { type: QuestObjectiveType.TRAVEL, locationId: 'mine_entrance', targetCount: 1, currentCount: 0 },
    },
    {
      stage: QuestStage.EXPLORATION,
      description: '探索狼穴',
      objective: { type: QuestObjectiveType.TRAVEL, locationId: 'wolf_nest', targetCount: 1, currentCount: 0 },
    },
    {
      stage: QuestStage.EXPLORATION,
      description: '探索史莱姆沼泽',
      objective: { type: QuestObjectiveType.TRAVEL, locationId: 'slime_swamp', targetCount: 1, currentCount: 0 },
    },
    {
      stage: QuestStage.TALK,
      description: '向探险家汇报',
      objective: { type: QuestObjectiveType.TALK, npcId: 'explorer', targetCount: 1, currentCount: 0 },
    },
  ],
  requirements: makeRequirements(5, []),
  rewards: makeRewards(100, 40, ['large_health_potion', 'rare_gem']),
  stage: 0,
  isCompleted: false,
  isActive: false,
  isDaily: true,
};

// ==================== 任务汇总 ====================

export const MAIN_QUESTS: Quest[] = [MAIN_QUEST_CHAPTER1_START, MAIN_QUEST_CHAPTER1_END];
export const SIDE_QUESTS: Quest[] = [SIDE_QUEST_WOLF_HUNT, SIDE_QUEST_POTION_MATERIALS];
export const DAILY_QUESTS: Quest[] = [DAILY_QUEST_SLIME_CLEAN, DAILY_QUEST_EXPLORATION];

export const ALL_QUESTS: Quest[] = [...MAIN_QUESTS, ...SIDE_QUESTS, ...DAILY_QUESTS];

export const QUEST_MAP: Record<string, Quest> = {};
for (const quest of ALL_QUESTS) {
  QUEST_MAP[quest.id] = quest;
}
