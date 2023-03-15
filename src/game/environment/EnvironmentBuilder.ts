/**
 * 边境传说 — 环境构建器
 * 一键装配：天空 / 地形 / 远山 / 岩石 / 植被
 * 返回高度采样函数与碰撞体列表，供场景与角色系统使用
 */
import * as THREE from 'three';
import { Noise2D } from './Noise';
import { SkySystem } from './SkySystem';
import { Terrain } from './Terrain';
import { createMountainRing } from './Mountains';
import { scatterVegetation, createBoulder, VegetationHandle } from './Vegetation';

export interface EnvironmentHandle {
  terrain: Terrain;
  sky: SkySystem;
  /** 需要参与碰撞检测的网格（地形 + 大岩石） */
  colliders: THREE.Mesh[];
  /** 地形高度采样 */
  heightAt(x: number, z: number): number;
  /** 每帧驱动云层/风场 */
  update(delta: number): void;
}

export interface EnvironmentOptions {
  size?: number;
  seed?: number;
  skyHorizon?: string;
  skyZenith?: string;
  sunDirection?: THREE.Vector3;
}

export function buildEnvironment(scene: THREE.Scene, opts: EnvironmentOptions = {}): EnvironmentHandle {
  const seed = opts.seed ?? 1337;
  const size = opts.size ?? 260;
  const noise = new Noise2D(seed + 5);

  // ====== 地形 ======
  const terrain = new Terrain(size, 128, seed);
  scene.add(terrain.mesh);

  // ====== 天空 ======
  const sky = new SkySystem({
    horizonColor: opts.skyHorizon ?? '#b9d2e6',
    zenithColor: opts.skyZenith ?? '#4478b8',
    sunColor: '#fff2d0',
    sunDirection: opts.sunDirection ?? new THREE.Vector3(0.55, 0.62, 0.55),
  });
  scene.add(sky.group);

  // ====== 远山 ======
  createMountainRing(scene, seed + 17);

  // ====== 大岩石（碰撞体）======
  const colliders: THREE.Mesh[] = [terrain.mesh];
  const boulderSpots = [
    { x: 20, z: 15, s: 2.6 },
    { x: -15, z: 25, s: 3.1 },
    { x: 30, z: -20, s: 2.2 },
    { x: -25, z: -15, s: 3.4 },
    { x: 10, z: -35, s: 2.4 },
    { x: -34, z: 32, s: 2.8 },
  ];
  for (const spot of boulderSpots) {
    const rock = createBoulder(spot.s, noise, spot.x * 3.7 + spot.z);
    rock.position.set(spot.x, terrain.heightAt(spot.x, spot.z) + spot.s * 0.32, spot.z);
    rock.rotation.y = spot.x * 0.7;
    scene.add(rock);
    colliders.push(rock);
  }

  // ====== 散布小岩石（装饰）======
  for (let i = 0; i < 26; i++) {
    const x = (Math.random() - 0.5) * 190;
    const z = (Math.random() - 0.5) * 190;
    if (Math.sqrt(x * x + z * z) < 10) continue;
    const rock = createBoulder(0.3 + Math.random() * 0.8, noise, i * 13.1);
    rock.position.set(x, terrain.heightAt(x, z) + 0.15, z);
    rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    scene.add(rock);
  }

  // ====== 植被 ======
  const vegetation: VegetationHandle = scatterVegetation(scene, (x, z) => terrain.heightAt(x, z), seed + 31);

  return {
    terrain,
    sky,
    colliders,
    heightAt: (x: number, z: number) => terrain.heightAt(x, z),
    update(delta: number): void {
      sky.update(delta);
      vegetation.update(delta);
    },
  };
}
