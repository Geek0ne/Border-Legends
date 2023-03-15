/**
 * 边境传说 — 山地关卡场景
 * 环境系统：渐变天空 + 太阳/云层 + FBM 地形 + 远景雪山 + 植被/风场
 * 含玩家角色控制器与收集品
 */

import * as THREE from 'three';
import { Scene } from './Scene';
import { SceneConfig } from '../../types';
import { CharacterModel, CharacterState } from '../character/CharacterModel';
import { PlayerController } from '../character/PlayerController';
import { GroundDetector } from '../collision/GroundDetector';
import { buildEnvironment, EnvironmentHandle } from '../environment/EnvironmentBuilder';

// 山地关卡场景配置（与 SkySystem 暖色调匹配）
export const mountainSceneConfig: SceneConfig = {
  id: 'mountain_pass',
  name: '🏔️ 山地关卡',
  unlockCondition: 'none',
  environment: {
    fogColor: '#b9d2e6',
    fogDensity: 0.0045,
    ambientLight: 0.45,
    ambientColor: '#9ab3c8',
    directionalLight: {
      intensity: 1.7,
      color: '#fff0d8',
      position: [60, 80, 60],
    },
    backgroundColor: '#b9d2e6',
  },
  music: 'mountain',
};

export class DefaultScene extends Scene {
  private groundDetector: GroundDetector = new GroundDetector();
  private playerController: PlayerController | null = null;
  private groundMeshes: THREE.Mesh[] = [];
  private env: EnvironmentHandle | null = null;

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    super(scene, camera, mountainSceneConfig);
  }

  async load(): Promise<void> {
    this.setSceneConfig();

    // 环境：天空 + 地形 + 远山 + 岩石 + 植被（含风场）
    this.env = buildEnvironment(this.scene, { size: 260, seed: 1337 });
    this.groundMeshes.push(...this.env.colliders);

    this.createCollectibleMarkers();

    // 注册碰撞体到地面检测器
    this.groundDetector.setColliders(this.groundMeshes);

    // 创建玩家角色
    this.setupPlayer();

    console.log('[DefaultScene] 场景加载完成（环境系统 + 玩家角色）');
  }

  private setSceneConfig(): void {
    const config = this.config;
    const fogColor = new THREE.Color(config.environment.fogColor);
    this.scene.fog = new THREE.FogExp2(fogColor, config.environment.fogDensity);
    this.scene.background = new THREE.Color(config.environment.backgroundColor);

    const ambientColor = new THREE.Color(config.environment.ambientColor);
    const ambientLight = new THREE.AmbientLight(ambientColor, config.environment.ambientLight);
    this.scene.add(ambientLight);

    const dirColor = new THREE.Color(config.environment.directionalLight.color);
    const dirLight = new THREE.DirectionalLight(dirColor, config.environment.directionalLight.intensity);
    dirLight.position.set(
      config.environment.directionalLight.position[0],
      config.environment.directionalLight.position[1],
      config.environment.directionalLight.position[2]
    );
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 200;
    dirLight.shadow.camera.left = -80;
    dirLight.shadow.camera.right = 80;
    dirLight.shadow.camera.top = 80;
    dirLight.shadow.camera.bottom = -80;
    this.scene.add(dirLight);

    const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x4a6741, 0.3);
    this.scene.add(hemiLight);
  }



  /**
   * 创建收集品标记
   */
  private createCollectibleMarkers(): void {
    const markers = [
      { x: 10, z: 10, label: '矿石' },
      { x: -12, z: 8, label: '草药' },
      { x: 8, z: -15, label: '松果' },
      { x: -20, z: -10, label: '矿石' },
      { x: 25, z: -25, label: '草药' },
    ];

    const groundY = (x: number, z: number): number => (this.env ? this.env.heightAt(x, z) : 0);

    for (const m of markers) {
      // 发光水晶体（保留 0xffff00 emissive 语义，供 update() 浮动动画识别）
      const geo = new THREE.OctahedronGeometry(0.38, 0);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xffe066, emissive: 0xffff00, emissiveIntensity: 0.7,
        transparent: true, opacity: 0.85, roughness: 0.25, metalness: 0.1,
      });
      const marker = new THREE.Mesh(geo, mat);
      marker.position.set(m.x, groundY(m.x, m.z) + 1, m.z);
      marker.scale.y = 1.6;
      this.scene.add(marker);

      // 标签
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, 256, 64);
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 28px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`[E] ${m.label}`, 128, 32);
      }

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.position.set(m.x, groundY(m.x, m.z) + 2.6, m.z);
      sprite.scale.set(3, 0.75, 1);
      this.scene.add(sprite);
    }
  }

  /**
   * 设置玩家角色
   */
  private setupPlayer(): void {
    // 创建角色模型（落在地形表面）
    const spawnY = this.env ? this.env.heightAt(0, 0) : 0;
    const character = new CharacterModel();
    character.getRoot().position.set(0, spawnY + 0.1, 0);
    this.scene.add(character.getRoot());

    // 创建地面检测器
    this.groundDetector.setColliders(this.groundMeshes);

    // 创建玩家控制器
    this.playerController = new PlayerController(character, this.groundDetector);
  }

  /**
   * 获取玩家位置（供其他系统使用）
   */
  public getPlayerPosition(): THREE.Vector3 | null {
    if (!this.playerController) return null;
    return this.playerController.getCharacter().getPosition();
  }

  /**
   * 获取角色模型
   */
  public getCharacter(): CharacterModel {
    return this.playerController?.getCharacter() || new CharacterModel();
  }

  public getGroundDetector(): GroundDetector | null {
    return this.groundDetector;
  }

  update(delta: number): void {
    // 环境动画（云层漂移 + 草地风场）
    this.env?.update(delta);

    // 收集品标记上下浮动动画
    const time = this.clock.getElapsedTime() || 0;
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.material instanceof THREE.MeshStandardMaterial) {
        if (obj.material.emissive && obj.material.emissive.getHex() === 0xffff00) {
          const baseY = this.env ? this.env.heightAt(obj.position.x, obj.position.z) + 1 : 1;
          obj.position.y = baseY + Math.sin(time * 2 + obj.position.x) * 0.3;
          obj.rotation.y += delta * 1.2;
          obj.material.opacity = 0.7 + Math.sin(time * 3 + obj.position.z) * 0.15;
        }
      }
    });
  }

  /**
   * 检查玩家是否与收集品标记相邻
   */
  public getNearbyCollectibles(playerPos: THREE.Vector3, radius: number = 3): string[] {
    const nearby: string[] = [];
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Sprite) {
        const dist = obj.position.distanceTo(playerPos);
        if (dist < radius) {
          nearby.push(`${obj.position.x.toFixed(1)},${obj.position.z.toFixed(1)}`);
        }
      }
    });
    return nearby;
  }
}

