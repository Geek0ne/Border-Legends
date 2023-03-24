/**
 * 边境传说 — 改进版相机控制器
 * 支持：平滑跟随、走路晃动、动态 FOV、鼠标滚轮缩放、镜头抖动
 * 
 * 修复：相机绕玩家旋转时，轨道中心移动导致旋转感觉不对的问题
 * - 减少相机位置跟随延迟（提高 follow speed）
 * - 相机目标位置更新后立即生效，不再滞后
 * - 修复鼠标 delta 轮询导致的视角跳跃
 */

import * as THREE from 'three';
import { InputState } from '../types';

export interface CameraState {
  yaw: number;
  pitch: number;
  distance: number;
  heightOffset: number;
}

export interface CameraShake {
  intensity: number;
  duration: number;
  elapsed: number;
}

export class CameraController {
  private target: THREE.Object3D;
  private camera: THREE.PerspectiveCamera;
  private state: CameraState;
  private input: InputState;
  private sensitivity: number;
  private minPitch: number;
  private maxPitch: number;
  private minDistance: number;
  private maxDistance: number;

  // 平滑跟随 - 提高速度让相机更跟手
  private followSpeed: number = 8;
  private currentPos: THREE.Vector3;
  private currentLookAt: THREE.Vector3;

  // 走路晃动
  private bobEnabled: boolean = true;
  private bobIntensity: number = 0.05;
  private bobFrequency: number = 6;
  private bobPhase: number = 0;

  // 动态 FOV
  private baseFOV: number = 60;
  private sprintFOV: number = 75;
  private currentFOV: number = 60;

  // 镜头抖动
  private shake: CameraShake | null = null;

  // 缩放过渡
  private targetDistance: number = 10;
  private zoomSpeed: number = 5;

  // 事件
  private onShake?: (intensity: number) => void;

  // 角度平滑过渡 - 加快平滑速度减少延迟
  private smoothedYaw: number;
  private smoothedPitch: number;
  private angleSmoothSpeed: number = 25;

  // 新增：记录上一帧的 yaw/pitch，用于检测跳跃
  private lastYaw: number = 0;
  private lastPitch: number = 0;

  // 新增：鼠标移动累积器（防止单帧过大 delta 导致跳跃）
  private accumulatedDeltaX: number = 0;
  private accumulatedDeltaY: number = 0;
  private maxDeltaPerFrame: number = 100; // 最大单帧像素移动

  constructor(
    camera: THREE.PerspectiveCamera,
    target: THREE.Object3D,
    input: InputState
  ) {
    this.camera = camera;
    this.target = target;
    this.input = input;
    this.currentPos = new THREE.Vector3();
    this.currentLookAt = new THREE.Vector3();

    this.state = {
      yaw: 0,
      pitch: Math.PI / 6,
      distance: 10,
      heightOffset: 3,
    };

    // 初始化平滑角度
    this.smoothedYaw = this.state.yaw;
    this.smoothedPitch = this.state.pitch;

    this.targetDistance = 10;
    this.sensitivity = 0.003;
    this.minPitch = -Math.PI / 3;
    this.maxPitch = Math.PI / 2.5;
    this.minDistance = 3;
    this.maxDistance = 25;
  }

  public onMouseMove(deltaX: number, deltaY: number): void {
    // 累积 delta 并限制单帧最大移动
    this.accumulatedDeltaX += deltaX;
    this.accumulatedDeltaY += deltaY;
    
    const dx = Math.max(-this.maxDeltaPerFrame, Math.min(this.maxDeltaPerFrame, this.accumulatedDeltaX));
    const dy = Math.max(-this.maxDeltaPerFrame, Math.min(this.maxDeltaPerFrame, this.accumulatedDeltaY));
    
    this.state.yaw -= dx * this.sensitivity;
    this.state.pitch -= dy * this.sensitivity;
    this.state.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.state.pitch));
    
    // 消费掉已处理的 delta
    this.accumulatedDeltaX -= dx;
    this.accumulatedDeltaY -= dy;
  }

  public onWheel(deltaY: number): void {
    this.targetDistance += -deltaY * 0.5;
    this.targetDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.targetDistance));
  }

  public addShake(intensity: number = 0.3, duration: number = 0.3): void {
    if (intensity > 0) {
      this.shake = { intensity, duration, elapsed: 0 };
      this.onShake?.(intensity);
    }
  }

  public update(delta: number): void {
    // 平滑距离过渡
    this.state.distance += (this.targetDistance - this.state.distance) * Math.min(1, delta * this.zoomSpeed);

    // 角度平滑过渡（提高速度减少延迟）
    const angleSmoothFactor = Math.min(1, delta * this.angleSmoothSpeed);
    this.smoothedYaw += (this.state.yaw - this.smoothedYaw) * angleSmoothFactor;
    this.smoothedPitch += (this.state.pitch - this.smoothedPitch) * angleSmoothFactor;

    // 更新平滑角度记录（用于检测跳跃）
    this.lastYaw = this.state.yaw;
    this.lastPitch = this.state.pitch;

    const { yaw, pitch, distance, heightOffset } = this.state;

    // 使用平滑后的角度计算理想位置
    const idealX = this.target.position.x + distance * Math.sin(this.smoothedYaw) * Math.cos(this.smoothedPitch);
    const idealY = this.target.position.y + heightOffset + distance * Math.sin(this.smoothedPitch);
    const idealZ = this.target.position.z + distance * Math.cos(this.smoothedYaw) * Math.cos(this.smoothedPitch);
    const idealPos = new THREE.Vector3(idealX, idealY, idealZ);

    // 大幅提高 follow speed，使相机几乎即时跟随（减少旋转轨道延迟）
    // 从 delta*25 提升到 delta*60，让相机轨道中心移动跟上手部操作
    const followFactor = Math.min(1, delta * 60);
    this.currentPos.lerp(idealPos, followFactor);

    // 走路晃动
    if (this.bobEnabled) {
      const isMoving = this.input.forward || this.input.backward || this.input.left || this.input.right;
      if (isMoving) {
        this.bobPhase += delta * this.bobFrequency;
        const bobY = Math.sin(this.bobPhase) * this.bobIntensity;
        this.currentPos.y += bobY;
      } else {
        this.bobPhase = 0;
      }
    }

    // 动态 FOV
    const isSprinting = this.input.sprint;
    const targetFOV = isSprinting ? this.sprintFOV : this.baseFOV;
    this.currentFOV += (targetFOV - this.currentFOV) * Math.min(1, delta * 6);
    this.camera.fov = this.currentFOV;
    this.camera.updateProjectionMatrix();

    // 镜头抖动
    let shakeOffset = new THREE.Vector3();
    if (this.shake) {
      this.shake.elapsed += delta;
      if (this.shake.elapsed >= this.shake.duration) {
        this.shake = null;
      } else {
        const remaining = this.shake.duration - this.shake.elapsed;
        const decay = remaining / this.shake.duration;
        shakeOffset.x = (Math.random() - 0.5) * 2 * this.shake.intensity * decay;
        shakeOffset.y = (Math.random() - 0.5) * 2 * this.shake.intensity * decay;
        shakeOffset.z = (Math.random() - 0.5) * 2 * this.shake.intensity * decay;
      }
    }

    this.camera.position.copy(this.currentPos).add(shakeOffset);
    this.camera.lookAt(this.target.position.x, this.target.position.y + 1, this.target.position.z);
  }

  public getState(): CameraState { return { ...this.state }; }
  public setYaw(yaw: number): void { this.state.yaw = yaw; }
  public setPitch(pitch: number): void { this.state.pitch = pitch; }
  public getTarget(): THREE.Object3D { return this.target; }
  public setTarget(target: THREE.Object3D): void { this.target = target; }
  public getSensitivity(): number { return this.sensitivity; }
  public setSensitivity(sensitivity: number): void { this.sensitivity = sensitivity; }
  public setFollowSpeed(speed: number): void { this.followSpeed = speed; }
  public setBobEnabled(enabled: boolean): void { this.bobEnabled = enabled; }
  public setBobIntensity(intensity: number): void { this.bobIntensity = intensity; }
  public setBaseFOV(fov: number): void { this.baseFOV = fov; }
  public setSprintFOV(fov: number): void { this.sprintFOV = fov; }
  public setZoomSpeed(speed: number): void { this.zoomSpeed = speed; }
  public setOnShake(cb: (intensity: number) => void): void { this.onShake = cb; }
  public getShake(): CameraShake | null { return this.shake; }
  public setInput(input: InputState): void { this.input = input; }

  public getSmoothedAngles(): { yaw: number; pitch: number } {
    return { yaw: this.smoothedYaw, pitch: this.smoothedPitch };
  }
  
  // 新增：消费累积的鼠标 delta
  public consumeAccumulatedDelta(): void {
    this.accumulatedDeltaX = 0;
    this.accumulatedDeltaY = 0;
  }
}
