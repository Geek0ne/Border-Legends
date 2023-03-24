/**
 * 边境传说 - NPC 数据定义
 */

export interface NPCDef {
  id: string;
  name: string;
  dialogue: string[];
  icon?: string;
  position: { x: number; y: number; z: number };
  quests?: string[];
  shopItems?: string[];
}

export const NPC_CHIEF: NPCDef = {
  id: 'village_chief',
  name: '村长',
  icon: '/assets/icons/npc_chief.png',
  position: { x: 0, y: 0, z: -5 },
  dialogue: [
    '欢迎来到边境小镇，年轻人。',
    '最近矿洞里的骷髅越来越多了，你能去看看吗？',
    '注意安全，不要深入太多。',
  ],
  quests: ['main_ch1_start', 'daily_exploration'],
};

export const NPC_ALCHEMIST: NPCDef = {
  id: 'alchemist',
  name: '药剂师',
  icon: '/assets/icons/npc_alchemist.png',
  position: { x: 3, y: 0, z: -3 },
  dialogue: [
    '哦，需要一些药水吗？',
    '你可以帮我收集史莱姆凝胶和铁矿。',
  ],
  shopItems: ['small_health_potion', 'small_mana_potion'],
  quests: ['side_potion_materials'],
};

export const NPC_HUNTER: NPCDef = {
  id: 'hunter_guild_leader',
  name: '猎人公会会长',
  icon: '/assets/icons/npc_hunter.png',
  position: { x: -3, y: 0, z: -3 },
  dialogue: [
    '狼群越来越猖狂了。',
    '我需要你帮我去清理狼穴。',
  ],
  quests: ['side_wolf_hunt'],
};

export const NPC_EXPLORER: NPCDef = {
  id: 'explorer',
  name: '探险家',
  icon: '/assets/icons/npc_explorer.png',
  position: { x: 6, y: 0, z: -2 },
  dialogue: [
    '边境有很多未知的秘密，你想探索吗？',
  ],
  quests: ['daily_exploration'],
};

export const ALL_NPCS: NPCDef[] = [NPC_CHIEF, NPC_ALCHEMIST, NPC_HUNTER, NPC_EXPLORER];
export const NPC_MAP: Record<string, NPCDef> = {};
for (const npc of ALL_NPCS) NPC_MAP[npc.id] = npc;
