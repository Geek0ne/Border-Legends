/**
 * 边境传说 - 场景管理器
 * 管理多场景切换、场景配置、场景资源
 */

import * as THREE from 'three';
import { SceneConfig } from '../../types';

export interface SceneTransition {
  fromScene: string;
  toScene: string;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
}

export class SceneManager {
  private scenes: Map<string, SceneConfig> = new Map();
  private currentSceneId: string | null = null;
  private onSceneChange?: (sceneId: string) => void;

  public registerScene(config: SceneConfig): void {
    this.scenes.set(config.id, config);
  }

  public switchScene(sceneId: string, cameraPos?: [number, number, number], cameraTarget?: [number, number, number]): void {
    const config = this.scenes.get(sceneId);
    if (!config) throw new Error('Scene not found: ' + sceneId);

    const oldSceneId = this.currentSceneId;
    this.currentSceneId = sceneId;

    // 应用场景光照和环境
    this.applySceneConfig(config);

    // 更新相机
    if (cameraPos) {
      console.log('[SceneManager] 相机位置: ' + JSON.stringify(cameraPos));
    }
    if (cameraTarget) {
      console.log('[SceneManager] 相机目标: ' + JSON.stringify(cameraTarget));
    }

    if (this.onSceneChange) this.onSceneChange(sceneId);
  }

  private applySceneConfig(config: SceneConfig): void {
    const env = config.environment;
    // 雾
    THREE.Fog && (new THREE.Fog(
      new THREE.Color(env.fogColor).getHex(),
      1 / env.fogDensity * 10,
      1 / env.fogDensity * 50
    ));

    // 环境光
    const ambient = new THREE.AmbientLight(
      new THREE.Color(env.ambientColor).getHex(),
      env.ambientLight
    );
    ambient.name = 'sceneAmbient';

    // 方向光
    const dirLight = new THREE.DirectionalLight(
      new THREE.Color(env.directionalLight.color).getHex(),
      env.directionalLight.intensity
    );
    dirLight.position.set(
      env.directionalLight.position[0],
      env.directionalLight.position[1],
      env.directionalLight.position[2]
    );
    dirLight.name = 'sceneDirLight';

    console.log('[SceneManager] 场景切换: ' + config.name);
  }

  public setOnSceneChange(cb: (sceneId: string) => void): void { this.onSceneChange = cb; }

  public getCurrentSceneId(): string | null { return this.currentSceneId; }

  public getAllScenes(): SceneConfig[] {
    return Array.from(this.scenes.values());
  }

  public getScene(id: string): SceneConfig | undefined {
    return this.scenes.get(id);
  }
}
