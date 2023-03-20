/**
 * 边境传说 — 游戏入口
 * 初始化引擎并开始游戏
 */

import { GameEngine } from './engine/GameEngine';

async function main() {
  console.log('%c🎮 边境传说 — Border Legends', 'font-size: 24px; font-weight: bold; color: #f0a500;');
  console.log('%c阶段 1.1-1.8: Vite + Three.js + TypeScript 项目搭建', 'font-size: 14px; color: #4a90d9;');
  console.log('---');

  // 获取画布元素
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('[Main] 未找到 #game-canvas 元素');
    return;
  }

  // 创建游戏引擎
  const engine = new GameEngine(canvas);

  // 初始化（加载场景 + 开始渲染）
  await engine.init();

  console.log('[Main] 游戏已启动!');
  console.log('[Main] WASD 移动角色 | 鼠标控制视角 | 左键攻击');
  console.log('[Main] Shift 冲刺 | 空格 翻滚 | E 互动');
  console.log('[Main] 双击画布锁定/解锁鼠标');
}

// 启动游戏
main().catch((error) => {
  console.error('[Main] 游戏启动失败:', error);
});
