# **边境传说** -- Border Legends

> **一款基于 Three.js 的 3D 开放世界冒险动作 RPG**
> 技术栈：Three.js + TypeScript + Vite + Rapier.js

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-%233178C6)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-0.170-000000?logo=three.js)](https://threejs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite)](https://vitejs.dev/)
[![Rapier](https://img.shields.io/badge/Rapier-0.14-FF6B35)](https://rapier.rs/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 项目简介

**边境传说（Border Legends）** 是一款使用纯 Three.js + TypeScript 构建的浏览器端 3D 冒险动作游戏。

游戏包含 **3 个主题关卡**（山地、丛林、城市废墟），玩家扮演冒险者探索开放世界、战斗怪物、收集资源、解锁技能，最终击败关卡 BOSS 推进剧情。

### 为什么用 Vanilla Three.js？

- 不需要 React 生态的声明式组件树，直接控制渲染循环
- 游戏逻辑（状态机、AI、战斗）放在模拟层，渲染层只负责视图
- 避免 React 状态和 Three.js 场景之间的同步复杂度
- 对 GPU 渲染管线和物理模拟有完全控制权
---

## 关卡概览

| 关卡 | 主题 | 核心机制 | BOSS |
|------|------|----------|------|
| **第一关** | Mountain Pass | 基础移动、战斗、探索 | 岩巨人 |
| **第二关** | Emerald Jungle | 攀爬、潜行、毒属性 | 远古树灵 |
| **第三关** | Ruined Metropolis | 平台跳跃、能量核心 | 暗影领主 |

---

## 技术栈

| 层级 | 技术 | 用途 |
|------|------|------|
| 3D 渲染 | Three.js r0.170+ | 场景、相机、渲染管线、光源 |
| 物理引擎 | Rapier.js | 碰撞检测、刚体模拟、怪物 AI 移动 |
| 语言 | TypeScript 5.x | 类型安全、更好的开发体验 |
| 构建工具 | Vite 6.x | 快速 HMR、ESM 原生支持、Tree-shaking |
| UI | DOM 覆盖层 | HUD、菜单、任务面板（比 Canvas 更清晰、可访问性更好） |
| 存档 | IndexedDB + localStorage | 浏览器端持久化存档 |
| 调试 | SpectorJS | GPU 和帧性能分析（可选） |
---

## 项目结构

```
GameApp/
+-- index.html                    # Entry HTML
+-- package.json                  # Project dependencies
+-- tsconfig.json                 # TypeScript config
+-- vite.config.ts                # Vite build config
+-- DESIGN.md                     # Game design document
+-- README.md                     # This file
+-- public/                       # Static assets (TBD)
|   +-- assets/                   # 3D models, textures, audio
+-- src/
|   +-- main.ts                   # Game entry point
|   +-- engine/                   # Engine core layer
|   |   +-- GameEngine.ts         # Game loop scheduling
|   |   +-- Renderer.ts           # Three.js renderer wrapper
|   |   +-- CameraController.ts   # Third-person camera controller
|   |   +-- InputHandler.ts       # Keyboard + mouse input
|   +-- game/                     # Game logic layer
|   |   +-- character/            # Character system
|   |   +-- collision/            # Collision detection
|   |   +-- scenes/               # Scene system
|   +-- types/                    # Type definitions
|   +-- utils/                    # Utilities
|   +-- ui/                       # UI layer
+-- dist/                         # Production build output
```
---

## 快速开始

### 环境要求

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0（推荐用 npm，也可用 yarn/pnpm）

### 安装与运行

```bash
# 1. 克隆项目
git clone <repository-url>
cd GameApp

# 2. 安装依赖
npm install

# 3. 启动开发服务器（热更新）
npm run dev
# -> 浏览器打开 http://localhost:3000

# 4. 生产构建
npm run build
# -> 输出到 dist/ 目录

# 5. 预览构建产物
npm run preview
# -> 本地预览生产版本
```
### 开发服务器配置

| 配置项 | 值 | 说明 |
|--------|------|------|
| 端口 | 3000 | 可通过 --port 参数修改 |
| 严格模式 | true | 端口不冲突 |
| 自动打开浏览器 | false | 需手动访问 |
| HMR | 开启 | 文件修改自动刷新 |

---

## 操作指南

| 按键 | 功能 |
|------|------|
| **W / A / S / D** | 前后左右移动 |
| **鼠标移动** | 控制视角（需点击画布锁定） |
| **双击画布** | 锁定/释放鼠标指针 |
| **左键** | 攻击 |
| **Shift** | 冲刺 |
| **空格** | 跳跃 / 翻滚 |
| **ESC** | 释放鼠标指针 |

---

## 开发阶段

### Phase 1: 基础框架（已完成）

| 子阶段 | 状态 | 内容 |
|--------|------|------|
| 1.1 | DONE | 项目初始化 |
| 1.2 | DONE | 入口 HTML 与开发环境 |
| 1.3 | DONE | 渲染器封装 Renderer.ts |
| 1.4 | DONE | 相机控制器（第三人称跟随） |
| 1.5 | DONE | 输入处理器（键盘 + 鼠标） |
| 1.6 | DONE | 游戏引擎核心 GameEngine.ts |
| 1.7 | DONE | 场景基类 Scene.ts |
| 1.8 | DONE | 默认测试场景（山地环境） |
| 1.9 | WIP | 玩家角色控制器（进行中） |
### Phase 2: 角色与战斗（待开发）

- [ ] 5 个角色数据定义（属性/技能/武器）
- [ ] 角色选择界面
- [ ] 玩家实体类（状态机/升级系统）
- [ ] 基础攻击系统
- [ ] 敌人 AI（巡逻 -> 追击 -> 攻击）
- [ ] Rapier 物理引擎集成
- [ ] 碰撞检测与伤害响应
- [ ] 血条 + 伤害数字显示
- [ ] 技能系统框架
- [ ] 翻滚/闪避机制

### Phase 3-5: 关卡开发（待开发）

- [ ] Mountain Pass 第一关：山地（任务5个，敌人3种，BOSS: 岩巨人）
- [ ] Emerald Jungle 第二关：丛林（攀爬/潜行/毒属性，BOSS: 远古树灵）
- [ ] Ruined Metropolis 第三关：城市废墟（平台跳跃/能量核心，BOSS: 暗影领主）

### Phase 6: 打磨与发布（待开发）

- [ ] 背包 + 合成系统 UI
- [ ] 技能树 UI
- [ ] 音效 + BGM
- [ ] 性能优化（Draw Call、纹理压缩、LOD）
- [ ] 移动端适配
- [ ] Bug 修复
---

## 设计文档

详细的**游戏设计文档**包含完整内容：

- 关卡地图设计
- 角色与战斗系统
- 技能树与装备系统
- 经济系统与合成
- NPC 与剧情线
- UI/UX 规范

请查看 [DESIGN.md](./DESIGN.md) 了解完整设计。

---

## 里程碑

| 里程碑 | 阶段 | 预计完成 | 状态 |
|--------|------|----------|------|
| **M1** 基础框架跑通 | Phase 1 | 第 2 天 | DONE |
| **M2** 角色+战斗系统 | Phase 2 | 第 5 天 | TODO |
| **M3** 山地关卡完成 | Phase 3 | 第 8 天 | TODO |
| **M4** 丛林关卡完成 | Phase 4 | 第 11 天 | TODO |
| **M5** 城市关卡完成 | Phase 5 | 第 14 天 | TODO |
| **M6** 打磨发布 | Phase 6 | 第 16 天 | TODO |

---

## 技术债务与风险

| 风险 | 影响 | 应对策略 |
|------|------|----------|
| GLB 模型资产需外部创建 | 影响视觉效果 | 先用 Three.js 基础几何体做占位 |
| 3 个关卡场景切换加载性能 | 影响流畅度 | 实施资源预加载 + 异步场景切换 |
| Rapier 物理引擎调试 | 影响碰撞手感 | 预留调试时间，使用可视调试器 |
| 移动端触摸控制 | 影响多平台覆盖 | 后期单独实现触控层 |
---

## 下一步

1. 基础框架已就绪
2. 开始 Phase 2：角色与战斗系统
3. 实现 Phase 3：山地关卡完整流程
4. 依次完成丛林、城市关卡
5. 打磨细节、性能优化、发布

---

## 贡献

欢迎提交 Issue 和 Pull Request！

---

## 许可证

MIT License

---

> **文档版本**：v1.1
> **最后更新**：2026-10-29
> **项目状态**：基础框架已完成，进入角色与战斗开发阶段