/**
 * 边境传说 - 游戏引擎核心
 */
import * as THREE from "three";
import { Renderer } from "./Renderer";
import { CameraController } from "./CameraController";
import { InputHandler } from "./InputHandler";
import { Scene } from "../game/scenes/Scene";
import { PlayerController } from "../game/character/PlayerController";
import { UIManager } from "../game/ui/UIManager";
import { EnemyController } from "../game/ai/EnemyController";
import { SkillManager } from "../game/skills/SkillManager";
export declare class GameEngine {
    private renderer;
    private cameraController;
    private inputHandler;
    private currentScene;
    private player;
    private playerController;
    private isRunning;
    private pollMouseDelta;
    private uiManager;
    private enemyController;
    private skillManager;
    constructor(canvas: HTMLCanvasElement);
    init(): Promise<void>;
    private createDemoEnemies;
    private updateHUD;
    private processPlayerAttack;
    processPlayerSkill(skillId: string): void;
    private onRender;
    loadScene(scene: Scene): Promise<void>;
    stop(): void;
    getRenderer(): Renderer;
    getCameraController(): CameraController;
    getInputHandler(): InputHandler;
    getCurrentScene(): Scene | null;
    getPlayer(): THREE.Object3D;
    getPlayerController(): PlayerController | null;
    getUIManager(): UIManager;
    getEnemyController(): EnemyController;
    getSkillManager(): SkillManager;
    getCameraForward(): THREE.Vector3;
    getCameraRight(): THREE.Vector3;
}
