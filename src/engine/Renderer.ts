/**
 * 边境传说 — Three.js 渲染器管理
 * 管理场景、相机、渲染器、光照
 */

import * as THREE from 'three';
import { SceneConfig } from '../types';

export class Renderer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;
  private ambientLight: THREE.AmbientLight | null = null;
  private directionalLight: THREE.DirectionalLight | null = null;
  private onRenderCallback: ((delta: number) => void) | null = null;
  private animationId: number | null = null;
  private isRunning: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    // 创建场景
    this.scene = new THREE.Scene();

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 5, 10);
    this.camera.lookAt(0, 0, 0);

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    // 时钟
    this.clock = new THREE.Clock();

    // 窗口大小调整
    window.addEventListener('resize', this.onResize);
  }

  private onResize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  /**
   * 设置场景环境配置
   */
  public setSceneConfig(config: SceneConfig): void {
    // 设置雾效
    if (config.environment.fogColor && config.environment.fogDensity) {
      const color = new THREE.Color(config.environment.fogColor);
      this.scene.fog = new THREE.FogExp2(color, config.environment.fogDensity);
    }

    // 设置背景色
    this.scene.background = new THREE.Color(config.environment.backgroundColor);

    // 移除旧的光照
    if (this.ambientLight) this.scene.remove(this.ambientLight);
    if (this.directionalLight) this.scene.remove(this.directionalLight);

    // 添加环境光
    const ambientColor = new THREE.Color(config.environment.ambientColor);
    this.ambientLight = new THREE.AmbientLight(ambientColor, config.environment.ambientLight);
    this.scene.add(this.ambientLight);

    // 添加方向光
    const dirColor = new THREE.Color(config.environment.directionalLight.color);
    this.directionalLight = new THREE.DirectionalLight(dirColor, config.environment.directionalLight.intensity);
    this.directionalLight.position.set(
      config.environment.directionalLight.position[0],
      config.environment.directionalLight.position[1],
      config.environment.directionalLight.position[2]
    );
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 500;
    this.directionalLight.shadow.camera.left = -50;
    this.directionalLight.shadow.camera.right = 50;
    this.directionalLight.shadow.camera.top = 50;
    this.directionalLight.shadow.camera.bottom = -50;
    this.scene.add(this.directionalLight);
  }

  /**
   * 添加渲染回调
   */
  public addRenderCallback(callback: (delta: number) => void): void {
    this.onRenderCallback = callback;
  }

  /**
   * 开始渲染循环
   */
  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.clock.start();
    this.animate();
  }

  /**
   * 停止渲染循环
   */
  public stop(): void {
    this.isRunning = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private animate = () => {
    if (!this.isRunning) return;

    this.animationId = requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    // 调用渲染回调
    if (this.onRenderCallback) {
      this.onRenderCallback(delta);
    }

    // 渲染场景
    this.renderer.render(this.scene, this.camera);
  };

  // ==================== Getters ====================
  public getScene(): THREE.Scene { return this.scene; }
  public getCamera(): THREE.PerspectiveCamera { return this.camera; }
  public getRenderer(): THREE.WebGLRenderer { return this.renderer; }
  public getClock(): THREE.Clock { return this.clock; }

  // ==================== 便捷方法 ====================
  public setBackgroundColor(color: string): void {
    this.scene.background = new THREE.Color(color);
  }

  public setFog(color: string, density: number): void {
    this.scene.fog = new THREE.FogExp2(new THREE.Color(color), density);
  }

  public clearFog(): void {
    this.scene.fog = null;
  }
}
