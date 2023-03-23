/**
 * 边境传说 — 默认测试场景（阶段 1.7-1.8，含 1.9 玩家角色）
 * 包含：地面 + 光照 + 树木 + 障碍物 + 玩家角色控制器
 */

import * as THREE from 'three';
import { Scene } from './Scene';
import { SceneConfig } from '../../types';
import { CharacterModel, CharacterState } from '../character/CharacterModel';
import { PlayerController } from '../character/PlayerController';
import { GroundDetector } from '../collision/GroundDetector';
import { DefaultScene as MainScene } from './DefaultScene';

// 山地关卡场景配置
export const mountainSceneConfig: SceneConfig = {
  id: 'mountain_pass',
  name: '🏔️ 山地关卡',
  unlockCondition: 'none',
  environment: {
    fogColor: '#8faabe',
    fogDensity: 0.008,
    ambientLight: 0.4,
    ambientColor: '#8899aa',
    directionalLight: {
      intensity: 1.2,
      color: '#fff5e6',
      position: [20, 30, 20],
    },
    backgroundColor: '#87CEEB',
  },
  music: 'mountain',
};

export class DefaultScene extends Scene {
  private trees: THREE.Group[] = [];
  private obstacles: THREE.Mesh[] = [];
  private groundDetector: GroundDetector = new GroundDetector();
  private character: CharacterModel = new CharacterModel();
  private playerController: PlayerController | null = null;
  private groundMeshes: THREE.Mesh[] = [];

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    super(scene, camera, mountainSceneConfig);
  }

  async load(): Promise<void> {
    this.setSceneConfig();
    this.createGround(200);
    this.createObstacles();
    this.createTrees();
    this.createRocks();
    this.createCollectibleMarkers();

    // 注册碰撞体到地面检测器
    this.groundDetector.setColliders(this.groundMeshes);

    // 创建玩家角色
    this.setupPlayer();

    console.log('[DefaultScene] 场景加载完成（含玩家角色）');
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
   * 创建地面（可碰撞）
   */
  protected createGround(size: number = 200): THREE.Mesh {
    // size from parameter
    const geo = new THREE.PlaneGeometry(size, size, 50, 50);
    geo.rotateX(-Math.PI / 2);

    // 添加一些地形起伏
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      // 简单起伏
      const height = Math.sin(x * 0.05) * Math.cos(z * 0.05) * 1.5
        + Math.sin(x * 0.02 + 1) * Math.cos(z * 0.03 + 2) * 3;
      pos.setY(i, height);
    }
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      color: 0x4a7a4a,
      roughness: 0.9,
      metalness: 0.05,
    });
    const ground = new THREE.Mesh(geo, mat);
    ground.receiveShadow = true;
    ground.position.y = -0.1;
    this.scene.add(ground);
    this.groundMeshes.push(ground);

    // 网格辅助线
    const grid = new THREE.GridHelper(200, 40, 0x3a6a3a, 0x2a5a2a);
    grid.position.y = 0.01;
    this.scene.add(grid);
    return ground;
  }

  /**
   * 创建障碍物（岩石）
   */
  private createObstacles(): void {
    const rockPositions = [
      { x: 20, z: 15, w: 4, h: 3, d: 3 },
      { x: -15, z: 25, w: 5, h: 2, d: 4 },
      { x: 30, z: -20, w: 3, h: 4, d: 3 },
      { x: -25, z: -15, w: 6, h: 1.5, d: 3 },
      { x: 10, z: -35, w: 4, h: 2.5, d: 5 },
    ];

    for (const pos of rockPositions) {
      const geo = new THREE.BoxGeometry(pos.w, pos.h, pos.d);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x6b6b6b, roughness: 0.9, metalness: 0.05,
      });
      const rock = new THREE.Mesh(geo, mat);
      rock.position.set(pos.x, pos.h / 2, pos.z);
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.scene.add(rock);
      this.groundMeshes.push(rock);
      this.obstacles.push(rock);
    }
  }

  /**
   * 创建装饰树木
   */
  private createTrees(): void {
    const count = 60;
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 180;
      const z = (Math.random() - 0.5) * 180;
      if (Math.abs(x) < 8 && Math.abs(z) < 8) continue;

      const scale = 0.8 + Math.random() * 0.8;
      const tree = this.createTree(x, 0, scale);
      this.trees.push(tree);
    }
  }

  protected createTree(x: number, y: number, scale: number): THREE.Group {
    const group = new THREE.Group();

    // 树干
    const trunkGeo = new THREE.CylinderGeometry(0.15 * scale, 0.25 * scale, 3 * scale, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3a22, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 1.5 * scale;
    trunk.castShadow = true;
    group.add(trunk);

    // 树冠（多层圆锥）
    const layers = 3;
    for (let i = 0; i < layers; i++) {
      const radius = (1.5 - i * 0.35) * scale;
      const height = 2 * scale;
      const coneGeo = new THREE.ConeGeometry(radius, height, 8);
      const coneMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(0.28 + Math.random() * 0.05, 0.6, 0.25 + Math.random() * 0.1),
        roughness: 0.8,
      });
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.y = (3 + i * 1.2) * scale;
      cone.castShadow = true;
      group.add(cone);
    }

    group.position.set(x, y, 0);
    this.scene.add(group);
    return group;
  }

  /**
   * 创建岩石装饰
   */
  private createRocks(): void {
    for (let i = 0; i < 30; i++) {
      const x = (Math.random() - 0.5) * 160;
      const z = (Math.random() - 0.5) * 160;
      if (Math.abs(x) < 10 && Math.abs(z) < 10) continue;

      const size = 0.3 + Math.random() * 0.8;
      const geo = new THREE.DodecahedronGeometry(size, 0);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x777777, roughness: 0.9, metalness: 0.05,
      });
      const rock = new THREE.Mesh(geo, mat);
      rock.position.set(x, size * 0.4, z);
      rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.scene.add(rock);
      this.groundMeshes.push(rock);
    }
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

    for (const m of markers) {
      const geo = new THREE.CylinderGeometry(0.15, 0.15, 2, 16);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 0.5,
        transparent: true, opacity: 0.7,
      });
      const marker = new THREE.Mesh(geo, mat);
      marker.position.set(m.x, 1, m.z);
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
      const spriteMat = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.position.set(m.x, 3, m.z);
      sprite.scale.set(3, 0.75, 1);
      this.scene.add(sprite);
    }
  }

  /**
   * 设置玩家角色
   */
  private setupPlayer(): void {
    // 创建角色模型
    const character = new CharacterModel();
    character.getRoot().position.set(0, 0.5, 0);
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
    // 收集品标记上下浮动动画
    const time = this.clock.getElapsedTime() || 0;
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.material instanceof THREE.MeshStandardMaterial) {
        if (obj.material.emissive && obj.material.emissive.getHex() === 0xffff00) {
          obj.position.y = 1 + Math.sin(time * 2 + obj.position.x) * 0.3;
          obj.material.opacity = 0.5 + Math.sin(time * 3 + obj.position.z) * 0.2;
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

