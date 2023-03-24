/**
 * 边境传说 — Three.js 游戏引擎
 * 管理渲染、输入、场景、相机
 * 
 * 更新 (v1.2):
 * - 将攻击判定从 PlayerController 中解耦，改为事件驱动
 * - GameEngine 作为中央事件处理器，负责攻击检测、伤害计算、音效触发
 * - 优化相机更新顺序（先更新玩家，再更新相机）
 */

import * as THREE from 'three';
import { Renderer } from './Renderer';
import { CameraController } from './CameraController';
import { InputHandler } from './InputHandler';
import { Scene } from '../game/scenes/Scene';
import { DefaultScene } from '../game/scenes/DefaultScene';
import { PlayerController, PlayerEvent, PlayerAttackEvent } from '../game/character/PlayerController';
import { CharacterDef } from '../types';

// 攻击判定配置
const ATTACK_CONFIG = {
  range: 3.0,
  arcAngle: Math.PI / 2, // 90度扇形
  cooldown: 0.3,
  hitCooldown: 0.15,
};

export class GameEngine {
  private renderer: Renderer;
  private cameraController: CameraController;
  private inputHandler: InputHandler;
  private currentScene: Scene | null = null;
  private player: THREE.Object3D;
  private playerController: PlayerController | null = null;
  private isRunning: boolean = false;

  // ===== v1.2: 攻击事件系统 =====
  private attackCooldownTimer: number = 0;
  private hitCooldownTimer: number = 0;
  private hitEnemies: Set<string> = new Set(); // 防止单帧重复伤害

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

    console.log('[GameEngine] 引擎已初始化');
    console.log('[GameEngine] WASD 移动 | 鼠标控制视角 | 左键攻击');
    console.log('[GameEngine] Shift 冲刺 | 空格 翻滚 | E 互动');
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

      // ===== v1.2: 订阅玩家攻击事件 =====
      this.playerController.addEventListener(this.onPlayerEvent);
    }

    // 开始渲染循环
    this.isRunning = true;
    this.renderer.start();

    console.log('[GameEngine] 场景加载完成');
    console.log('[GameEngine] 双击画布锁定鼠标 | 开始游戏');
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

  /** ===== v1.2: 玩家事件处理 ===== */
  private onPlayerEvent = (event: PlayerEvent): void => {
    switch (event.type) {
      case 'attack':
        this.handleAttack(event as PlayerAttackEvent);
        break;
      case 'hit':
        // 命中反馈（浮动文字、音效等）
        this.handleHit(event);
        break;
      default:
        break;
    }
  };

  /**
   * v1.2: 处理玩家攻击事件
   * - 在玩家前方扇形范围内检测敌人
   * - 对范围内的敌人造成攻击伤害
   */
  private handleAttack(event: PlayerAttackEvent): void {
    // 冷却检查
    if (this.attackCooldownTimer > 0) return;
    this.attackCooldownTimer = ATTACK_CONFIG.cooldown;

    const playerPos = this.player.position;
    const playerYaw = this.player.rotation.y;
    const forward = new THREE.Vector3(
      Math.sin(playerYaw), 0, Math.cos(playerYaw)
    ).normalize();

    // 获取场景中所有敌人并检测命中
    const enemies = (this.currentScene as any)?.getAliveEnemies?.() || [];
    for (const enemy of enemies) {
      const dx = enemy.mesh.position.x - playerPos.x;
      const dz = enemy.mesh.position.z - playerPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > ATTACK_CONFIG.range) continue;

      // 检查是否在攻击扇形范围内
      const dirToEnemy = new THREE.Vector3(dx, 0, dz).normalize();
      const dot = forward.dot(dirToEnemy);
      const angle = Math.acos(Math.min(1, Math.max(-1, dot)));

      if (angle > ATTACK_CONFIG.arcAngle / 2) continue;

      // 命中！
      const damage = this.calculateDamage(dist);
      const enemyKey = enemy.def.id;

      if (this.hitCooldownTimer <= 0) {
        this.applyDamageToEnemy(enemy, damage);
        this.hitEnemies.add(enemyKey);

        // 派发命中事件
        this.playerController?.emit({
          type: 'hit',
          timestamp: Date.now(),
          targetId: enemyKey,
          damage: damage,
        });
      }
    }

    // 清除已击中的敌人（允许重新攻击）
    if (this.hitCooldownTimer <= 0) {
      this.hitCooldownTimer = ATTACK_CONFIG.hitCooldown;
    }
  }

  /**
   * v1.2: 计算伤害值
   * 基于距离衰减 + 随机浮动
   */
  private calculateDamage(distance: number): number {
    const baseDamage = 10;
    const distanceFactor = 1 - (distance / ATTACK_CONFIG.range) * 0.5;
    const randomFactor = 0.8 + Math.random() * 0.4;
    return Math.round(baseDamage * distanceFactor * randomFactor);
  }

  /**
   * v1.2: 对敌人应用伤害
   */
  private applyDamageToEnemy(enemy: any, damage: number): void {
    if (!enemy || !enemy.mesh) return;
    if (!(enemy as any).isDead) {
      const hud = (this.currentScene as any)?.getHUDSystem?.();
      if (hud && typeof hud.addFloatingText === 'function') {
        hud.addFloatingText('-' + damage, enemy.position.x, enemy.position.z, 0xff4444);
      }
      (enemy as any).currentHp -= damage;
      // 击杀检测
      if ((enemy as any).currentHp <= 0) {
        (enemy as any).isDead = true;
        (enemy as any).mesh.visible = false;
        console.log('[GameEngine] 击杀敌人:', (enemy as any).def?.name);
      }
    }
  }

  /**
   * v1.2: 处理命中反馈
   */
  private handleHit(event: any): void {
    // 可以在这里添加命中音效、屏幕闪烁等反馈
    // 暂留扩展点
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
