export interface SaveGame {
  version: number;
  timestamp: number;
  player: {
    name: string;
    level: number;
    xp: number;
    hp: number;
    mp: number;
    position: [number, number, number];
    skills: string[];
    inventory: Array<{ id: string; quantity: number }>;
  };
  worldState: {
    currentScene: string;
    enemiesDefeated: number;
    dropsCollected: number;
    flags: Map<string, boolean>;
  };
}

export interface SaveMetadata {
  fileName: string;
  timestamp: number;
  playerName: string;
  level: number;
  playtime: number;
}

const SAVE_VERSION = 1;
const MAX_SAVE_SLOTS = 5;

export class SaveSystem {
  private saveDirectory: string = 'saves';
  private onBeforeSave?: (save: SaveGame) => void;
  private onAfterSave?: (metadata: SaveMetadata) => void;
  private onBeforeLoad?: (save: SaveGame) => boolean;

  generateSaveFileName(slot?: number): string {
    const now = new Date();
    const slotStr = String(slot ?? 0).padStart(2, '0');
    const dateStr = now.getFullYear().toString() + (now.getMonth() + 1).toString().padStart(2, '0') + now.getDate().toString().padStart(2, '0');
    const timeStr = now.getHours().toString().padStart(2, '0') + now.getMinutes().toString().padStart(2, '0') + now.getSeconds().toString().padStart(2, '0');
    return 'save_' + slotStr + '_' + dateStr + '_' + timeStr + '.json';
  }

  serializeSave(
    playerName: string,
    level: number,
    xp: number,
    hp: number,
    mp: number,
    position: [number, number, number],
    currentScene: string,
    skills: string[],
    inventory: Array<{ id: string; quantity: number }>,
    enemiesDefeated: number,
    dropsCollected: number,
    flags: Map<string, boolean>,
    playtime: number
  ): SaveGame {
    return {
      version: SAVE_VERSION,
      timestamp: Date.now(),
      player: { name: playerName, level, xp, hp, mp, position, skills, inventory },
      worldState: { currentScene, enemiesDefeated, dropsCollected, flags },
    };
  }

  createSaveMetadata(save: SaveGame): SaveMetadata {
    return {
      fileName: this.generateSaveFileName(),
      timestamp: save.timestamp,
      playerName: save.player.name,
      level: save.player.level,
      playtime: 0,
    };
  }

  validateSave(save: SaveGame): boolean {
    if (save.version !== SAVE_VERSION) return false;
    if (!save.player?.name) return false;
    if (!Array.isArray(save.player.skills)) return false;
    if (!save.worldState?.currentScene) return false;
    return true;
  }

  static isVersionCompatible(saveVersion: number): boolean {
    return saveVersion >= 1;
  }

  setOnBeforeSave(cb: (save: SaveGame) => void): void { this.onBeforeSave = cb; }
  setOnAfterSave(cb: (metadata: SaveMetadata) => void): void { this.onAfterSave = cb; }
  setOnBeforeLoad(cb: (save: SaveGame) => boolean): void { this.onBeforeLoad = cb; }
  getSavePath(fileName: string): string { return this.saveDirectory + '/' + fileName; }
  listSaves(): Promise<SaveMetadata[]> { return Promise.resolve([]); }
}
