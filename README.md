# 边境传说 (Border Legends)

> 一款 3D 开放世界冒险 RPG，使用 Three.js + TypeScript 构建

## 项目结构

```
GameApp/
├── index.html                  # 入口 HTML
├── package.json                # 项目依赖
├── vite.config.ts              # Vite 构建配置
├── tsconfig.json               # TypeScript 配置
├── src/
│   ├── main.ts                 # 游戏入口
│   ├── engine/                 # 引擎核心
│   │   ├── Renderer.ts         # 渲染器封装
│   │   ├── GameEngine.ts       # 游戏引擎
│   │   ├── CameraController.ts # 相机控制器
│   │   └── InputHandler.ts     # 输入处理器
│   ├── game/                   # 游戏逻辑
│   │   ├── scenes/             # 场景系统
│   │   └── components/         # 游戏组件
│   ├── types/                  # 类型定义
│   └── utils/                  # 工具函数
└── README.md
```

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 生产构建
npm run build

# 预览构建结果
npm run preview
```

## 当前阶段

### ✅ Phase 1: 基础框架（已完成）

| 子阶段 | 状态 | 内容 |
|--------|------|------|
| 1.1 | ✅ | 项目初始化：package.json, vite.config.ts, tsconfig.json |
| 1.2 | ✅ | 入口 HTML 与开发环境 |
| 1.3 | ✅ | 渲染器封装 Renderer.ts |
| 1.4 | ✅ | 相机控制器（第三人称） |
| 1.5 | ✅ | 输入处理器（键盘 + 鼠标） |
| 1.6 | ✅ | 游戏引擎核心 GameEngine |
| 1.7 | ✅ | 场景基类 Scene.ts |
| 1.8 | ✅ | 默认测试场景（山地关卡）|

### 🚧 Phase 1.9: 玩家角色控制器（进行中）

- [ ] 角色模型（简易胶囊体 + 动画骨骼）
- [ ] 移动/冲刺/翻滚/跳跃动画状态机
- [ ] 碰撞检测（与地面/障碍物的碰撞）
- [ ] 相机跟随平滑过渡

## 开发状态

- 当前运行: **http://localhost:3000**
- Vite 开发服务器正在运行
- 双击画布锁定鼠标控制视角
- WASD 移动角色，鼠标控制视角
- 左键攻击，Shift 冲刺，空格 翻滚

## 技术栈

- **渲染**: Three.js r175+
- **构建**: Vite 6.x
- **语言**: TypeScript 5.x
- **打包**: ES Modules + Tree-shaking
- **开发**: HMR 热更新

---

## 设计文档

详见 `docs/design-doc.md`，包含完整的游戏设计、场景规划、技能树、经济系统等。
