/**
 * 边境传说 - 游戏入口
 * 初始化引擎并开始游戏
 */

import { GameEngine } from './engine/GameEngine';
import { CharacterSelectUI } from './ui/CharacterSelectUI';
import { CharacterDef, PlayerState, HUDState } from './types';

let engine: GameEngine | null = null;
let characterSelectUI: CharacterSelectUI | null = null;
let playerState: PlayerState | null = null;

function createPlayerState(character: CharacterDef): PlayerState {
  return {
    characterId: character.id,
    characterName: character.name,
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    hp: character.stats.maxHp,
    mp: character.stats.maxMp,
    isAlive: true,
    position: [0, 0, 0] as [number, number, number],
    unlockedScenes: ['default'],
    stats: { ...character.stats },
  };
}

function updateHUD(state: PlayerState): void {
  const hpFill = document.getElementById('hp-fill');
  const hpText = document.getElementById('hp-text');
  const mpFill = document.getElementById('mp-fill');
  const mpText = document.getElementById('mp-text');
  const levelInfo = document.getElementById('level-info');
  const levelText = document.getElementById('level-text');
  const xpFill = document.getElementById('xp-fill');
  const xpText = document.getElementById('xp-text');
  const goldText = document.getElementById('gold-text');

  if (hpFill) {
    const hpPercent = (state.hp / state.stats.maxHp) * 100;
    hpFill.style.width = hpPercent + '%';
  }
  if (hpText) hpText.textContent = Math.max(0, state.hp) + ' / ' + state.stats.maxHp;

  if (mpFill) {
    const mpPercent = (state.mp / state.stats.maxMp) * 100;
    mpFill.style.width = mpPercent + '%';
  }
  if (mpText) mpText.textContent = Math.max(0, state.mp) + ' / ' + state.stats.maxMp;

  if (levelInfo && levelText) {
    levelInfo.classList.remove('hidden');
    levelText.textContent = 'Lv.' + state.level;
  }
  if (xpFill) {
    const xpPercent = (state.xp / state.xpToNextLevel) * 100;
    xpFill.style.width = Math.min(100, xpPercent) + '%';
  }
  if (xpText) xpText.textContent = state.xp + ' / ' + state.xpToNextLevel;
  if (goldText) goldText.textContent = '\ud83d\udcb0 0';
}

function onCharacterSelected(character: CharacterDef): void {
  console.log('[CharacterSelect] 选择了角色:', character.name);
}

function onGameStart(character: CharacterDef): void {
  if (!engine) return;

  playerState = createPlayerState(character);

  // 隐藏角色选择界面
  if (characterSelectUI) {
    characterSelectUI.hide();
  }

  // 让游戏画布获取焦点
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (canvas) {
    canvas.focus();
    console.log('[GameStart] 画布已获取焦点');
    
    // 尝试进入 pointer lock（让鼠标移动能驱动视角控制）
    canvas.requestPointerLock?.();
    console.log('[GameStart] 已请求 pointer lock');
  }

  // 更新 HUD
  updateHUD(playerState);

  console.log('[GameStart] 开始冒险! 角色:', character.name);
  console.log('[GameStart] HP:', playerState.hp, '| MP:', playerState.mp);
  console.log('[GameStart] 双击画布锁定鼠标 | WASD 移动 | 左键攻击');
}

async function main() {
  console.log('%c\u26a1 \u8fb9\u5883\u4f20\u8bf4 - Border Legends', 'font-size: 24px; font-weight: bold; color: #f0a500;');
  console.log('%c\u9636\u6bb5 1.1-1.8: Vite + Three.js + TypeScript \u9879\u76ee\u642d\u5efa', 'font-size: 14px; color: #4a90d9;');
  console.log('---');

  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('[Main] \u672a\u627e\u5230 #game-canvas \u5143\u7d20');
    return;
  }

  // 创建游戏引擎
  engine = new GameEngine(canvas);
  await engine.init();

  // 创建角色选择 UI（默认显示）
  characterSelectUI = new CharacterSelectUI({
    onCharacterSelected,
    onGameStart,
  });
  
  // 确保角色选择界面显示
  characterSelectUI.show();

  console.log('[Main] \u6e38\u620f\u6846\u67b6\u5df2\u521d\u59cb\u5316\u5b8c\u6210');
  console.log('[Main] \u89d2\u8272\u9009\u62e9\u754c\u9762\u5df2\u663e\u793a\u3002\u9009\u62e9\u89d2\u8272\u540e\u70b9\u51fb\u5f00\u59cb\u5192\u9669');
}

// 启动
main().catch((error) => {
  console.error('[Main] \u6e38\u620f\u542f\u52a8\u5931\u8d25:', error);
});
