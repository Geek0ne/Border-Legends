/**
 * 边境传说 — 场景基类
 * 所有场景继承此类
 */

import * as THREE from 'three';
import { SceneConfig } from '../../types';

export abstract class Scene {
  protected scene: THREE.Scene;
  protected camera: THREE.PerspectiveCamera;
  protected config: SceneConfig;
  public clock: THREE.Clock = new THREE.Clock();
  protected groundMesh: THREE.Mesh | null = null;

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, config: SceneConfig) {
    this.scene = scene;
    this.camera = camera;
    this.config = config;
  }

  /**
   * 加载场景（异步）
   */
  public abstract load(): Promise<void>;

  /**
   * 卸载场景
   */
  public async unload(): Promise<void> {
    // 子类可重写以清理资源
  }

  /**
   * 更新场景（每帧）
   */
  public update(delta: number): void {
    // 子类可重写
  }

  /**
   * 创建地面
   */
  protected createGround(size: number = 100): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(size, size);
    const material = new THREE.MeshStandardMaterial({
      color: 0x4a6741,
      roughness: 0.9,
      metalness: 0.0,
    });
    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.groundMesh = ground;
    return ground;
  }

  /**
   * 创建网格地面辅助线
   */
  protected createGridHelper(size: number = 100, divisions: number = 50): THREE.GridHelper {
    const helper = new THREE.GridHelper(size, divisions, 0x888888, 0x666666);
    helper.position.y = 0.01;
    this.scene.add(helper);
    return helper;
  }

  /**
   * 创建简单障碍物（用于测试碰撞）
   */
  protected createObstacle(
    x: number,
    y: number,
    z: number,
    width: number,
    height: number,
    depth: number,
    color: number = 0x888888
  ): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.7,
      metalness: 0.1,
    });
    const obstacle = new THREE.Mesh(geometry, material);
    obstacle.position.set(x, y, z);
    obstacle.castShadow = true;
    obstacle.receiveShadow = true;
    this.scene.add(obstacle);
    return obstacle;
  }

  /**
   * 创建装饰性树木（用圆柱+圆锥）
   */
  protected createTree(x: number, z: number, scale: number = 1): THREE.Group {
    const group = new THREE.Group();

    // 树干
    const trunkGeo = new THREE.CylinderGeometry(0.1 * scale, 0.15 * scale, 2 * scale, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 1 * scale;
    trunk.castShadow = true;
    group.add(trunk);

    // 树冠
    const foliageGeo = new THREE.ConeGeometry(1.5 * scale, 3 * scale, 8);
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x2d5a27, roughness: 0.8 });
    const foliage = new THREE.Mesh(foliageGeo, foliageMat);
    foliage.position.y = 3.5 * scale;
    foliage.castShadow = true;
    group.add(foliage);

    group.position.set(x, 0, z);
    this.scene.add(group);
    return group;
  }

  // ==================== Getters ====================
  public getScene(): THREE.Scene { return this.scene; }
  public getCamera(): THREE.PerspectiveCamera { return this.camera; }
  public getConfig(): SceneConfig { return this.config; }
  public getGroundMesh(): THREE.Mesh | null { return this.groundMesh; }
}
