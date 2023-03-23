/**
 * 边境传说 — 游戏引擎核心
 * 统一管理渲染器、相机、输入、场景、玩家控制器
 */

import * as THREE from 'three';
import { Renderer } from './Renderer';
import { CameraController } from './CameraController';
import { InputHandler } from './InputHandler';
import { InputState } from '../types';
import { Scene } from '../game/scenes/Scene';
import { DefaultScene } from '../game/scenes/DefaultScene';
import { PlayerController } from '../game/character/PlayerController';

export class GameEngine {
  private renderer: Renderer;
  private cameraController: CameraController;
  private inputHandler: InputHandler;
  private currentScene: Scene | null = null;
  private player: THREE.Object3D;
  private playerController: PlayerController | null = null;
  private isRunning: boolean = false;
  private pollMouseDelta: (() => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new Renderer(canvas);
    this.player = new THREE.Object3D();
    this.player.position.set(0, 0, 0);
    this.renderer.getScene().add(this.player);

    this.inputHandler = new InputHandler();
    this.cameraController = new CameraController(
      this.renderer.getCamera(),
      this.player,
      this.inputHandler.getState()
    );

    // 监听鼠标 delta
    const pollMouse = () => {
      const delta = this.inputHandler.getMouseDelta();
      if (delta.dx !== 0 || delta.dy !== 0) {
        this.cameraController.onMouseMove(delta.dx, delta.dy);
        this.inputHandler.resetMouseDelta();
      }
    };
    this.pollMouseDelta = pollMouse;

    this.renderer.addRenderCallback((delta) => {
      if (this.pollMouseDelta) this.pollMouseDelta();
    });
  }

  public async init(): Promise<void> {
    this.currentScene = new DefaultScene(this.renderer.getScene(), this.renderer.getCamera());
    await this.currentScene.load();

    // 获取玩家角色
    const character = (this.currentScene as any).getCharacter?.();
    if (character) {
      this.playerController = new PlayerController(character);
    }

    this.isRunning = true;
    this.renderer.start();

    console.log('[GameEngine] 场景加载完成，双击画布锁定鼠标');
    console.log('[GameEngine] WASD 移动 | 鼠标控制视角 | 左键攻击');
    console.log('[GameEngine] Shift 冲刺 | 空格 翻滚 | E 互动');
  }

  private onRender(delta: number): void {
    this.cameraController.update();
    if (this.currentScene) {
      this.currentScene.update(delta);
    }
    this.cameraController.getTarget().position.copy(this.player.position);

    // 更新玩家控制器
    if (this.playerController) {
      const cameraForward = this.getCameraForward();
      const cameraRight = this.getCameraRight();
      this.playerController.update(delta, cameraForward, cameraRight);
    }
  }

  public async loadScene(scene: Scene): Promise<void> {
    if (this.currentScene) {
      await this.currentScene.unload();
    }
    this.currentScene = scene;
    await scene.load();
  }

  public stop(): void {
    this.isRunning = false;
    this.renderer.stop();
  }

  public getRenderer(): Renderer { return this.renderer; }
  public getCameraController(): CameraController { return this.cameraController; }
  public getInputHandler(): InputHandler { return this.inputHandler; }
  public getCurrentScene(): Scene | null { return this.currentScene; }
  public getPlayer(): THREE.Object3D { return this.player; }
  public getPlayerController(): PlayerController | null { return this.playerController; }

  public getCameraForward(): THREE.Vector3 {
    const forward = new THREE.Vector3();
    this.renderer.getCamera().getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    return forward;
  }

  public getCameraRight(): THREE.Vector3 {
    const right = new THREE.Vector3();
    const forward = new THREE.Vector3();
    this.renderer.getCamera().getWorldDirection(forward);
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
    return right;
  }
}
