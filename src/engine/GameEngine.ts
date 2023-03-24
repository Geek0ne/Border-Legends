/**
 * 边境传说 — Three.js 游戏引擎
 * 管理渲染、输入、场景、相机
 * 
 * 修复：相机绕玩家旋转时感觉不对的问题
 * - 先更新玩家位置，再更新相机（消除帧延迟）
 * - 相机目标跟随使用直接赋值而非 lerp（消除轨道滞后）
 * - 优化鼠标 delta 轮询逻辑
 */

import * as THREE from "three";
import { Renderer } from "./Renderer";
import { CameraController } from "./CameraController";
import { InputHandler } from "./InputHandler";
import { Scene } from "../game/scenes/Scene";
import { DefaultScene } from "../game/scenes/DefaultScene";
import { PlayerController } from "../game/character/PlayerController";
import { CharacterDef } from "../types";

export class GameEngine {
  private renderer: Renderer;
  private cameraController: CameraController;
  private inputHandler: InputHandler;
  private currentScene: Scene | null = null;
  private player: THREE.Object3D;
  private playerController: PlayerController | null = null;
  private isRunning: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new Renderer(canvas);

    // 创建玩家对象
    this.player = new THREE.Object3D();
    this.player.position.set(0, 0.5, 0);
    this.renderer.getScene().add(this.player);

    // 创建输入处理器
    this.inputHandler = new InputHandler();

    // 创建相机控制器
    this.cameraController = new CameraController(
      this.renderer.getCamera(),
      this.player,
      this.inputHandler.getState()
    );

    // 添加渲染回调
    this.renderer.addRenderCallback((delta) => {
      this.onRender(delta);
    });

    console.log("[GameEngine] 引擎已初始化");
    console.log("[GameEngine] WASD 移动 | 鼠标控制视角 | 左键攻击");
    console.log("[GameEngine] Shift 冲刺 | 空格 翻滚 | E 互动");
  }

  /**
   * 初始化游戏引擎（异步加载场景）
   */
  async init(): Promise<void> {
    // 创建默认场景
    this.currentScene = new DefaultScene(
      this.renderer.getScene(),
      this.renderer.getCamera()
    );

    // 加载场景
    await this.currentScene.load();

    // 获取角色并创建控制器
    const character = (this.currentScene as any)?.getCharacter?.() as any;
    if (character) {
      this.playerController = new PlayerController(character);
    }

    // 开始渲染循环
    this.isRunning = true;
    this.renderer.start();

    console.log("[GameEngine] 场景加载完成");
    console.log("[GameEngine] 双击画布锁定鼠标 | 开始游戏");
  }

  /**
   * 每帧更新
   * 修复关键：先更新玩家位置，再更新相机
   */
  onRender(delta: number): void {
    // 1. 先更新输入和玩家控制器
    this.cameraController.setInput(this.inputHandler.getState());
    
    if (this.playerController) {
      this.playerController.setInput(this.inputHandler.getState());
      
      // 计算相机方向向量
      const angles = this.cameraController.getSmoothedAngles();
      const cameraForward = new THREE.Vector3(Math.sin(angles.yaw), 0, Math.cos(angles.yaw)).normalize();
      const cameraRight = new THREE.Vector3(0, 0, 0);
      cameraRight.crossVectors(cameraForward, new THREE.Vector3(0, 1, 0)).normalize();
      
      // 更新玩家（在相机之前！）
      this.playerController.update(delta, cameraForward, cameraRight);
    }

    // 2. 先更新玩家位置（在相机 update 之前）
    if (this.playerController) {
      const charPos = this.playerController.getCharacter().getPosition();
      this.player.position.copy(charPos);
    }

    // 3. 相机目标跟随玩家位置（直接赋值，不滞后）
    this.cameraController.getTarget().position.copy(this.player.position);

    // 4. 最后更新相机（此时目标位置已是最新的）
    this.cameraController.update(delta);

    // 5. 更新场景
    if (this.currentScene) {
      this.currentScene.update(delta);
    }
  }

  /**
   * 加载新场景
   */
  async loadScene(scene: Scene): Promise<void> {
    if (this.currentScene) {
      await this.currentScene.unload();
    }
    this.currentScene = scene;
    await scene.load();
  }

  /**
   * 停止引擎
   */
  stop(): void {
    this.isRunning = false;
    this.renderer.stop();
  }

  // ==================== Getters ====================
  getRenderer(): Renderer { return this.renderer; }
  getCameraController(): CameraController { return this.cameraController; }
  getInputHandler(): InputHandler { return this.inputHandler; }
  getCurrentScene(): Scene | null { return this.currentScene; }
  getPlayer(): THREE.Object3D { return this.player; }
  getPlayerController(): PlayerController | null { return this.playerController; }

  /**
   * 获取相机前方方向（用于角色移动）
   */
  getCameraForward(): THREE.Vector3 {
    const angles = this.cameraController.getSmoothedAngles();
    return new THREE.Vector3(Math.sin(angles.yaw), 0, Math.cos(angles.yaw)).normalize();
  }

  /**
   * 获取相机右方方向（用于角色移动）
   */
  getCameraRight(): THREE.Vector3 {
    const angles = this.cameraController.getSmoothedAngles();
    const forward = new THREE.Vector3(Math.sin(angles.yaw), 0, Math.cos(angles.yaw));
    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
    return right;
  }
}
