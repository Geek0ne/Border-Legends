/**
 * 边境传说 — 改进版相机控制器
 * 支持：平滑跟随、走路晃动、动态 FOV、鼠标滚轮缩放、镜头抖动
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
  intensity: number;  // 振幅
  duration: number;   // 剩余时间
  elapsed: number;    // 已流逝
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

  // 平滑跟随
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

    this.targetDistance = 10;
    this.sensitivity = 0.003;
    this.minPitch = -Math.PI / 3;
    this.maxPitch = Math.PI / 2.5;
    this.minDistance = 3;
    this.maxDistance = 25;
  }

  /**
   * 处理鼠标输入
   */
  public onMouseMove(deltaX: number, deltaY: number): void {
    this.state.yaw -= deltaX * this.sensitivity;
    this.state.pitch -= deltaY * this.sensitivity;
    this.state.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.state.pitch));
  }

  /**
   * 处理鼠标滚轮缩放
   */
  public onWheel(deltaY: number): void {
    this.targetDistance += -deltaY * 0.5;
    this.targetDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.targetDistance));
  }

  /**
   * 添加镜头抖动
   */
  public addShake(intensity: number = 0.3, duration: number = 0.3): void {
    if (intensity > 0) {
      this.shake = { intensity, duration, elapsed: 0 };
      this.onShake?.(intensity);
    }
  }

  /**
   * 更新相机（每帧调用）
   */
  public update(delta: number): void {
    // 平滑距离过渡
    this.state.distance += (this.targetDistance - this.state.distance) * Math.min(1, delta * this.zoomSpeed);

    const { yaw, pitch, distance, heightOffset } = this.state;

    // 计算理想位置
    const idealX = this.target.position.x + distance * Math.sin(yaw) * Math.cos(pitch);
    const idealY = this.target.position.y + heightOffset + distance * Math.sin(pitch);
    const idealZ = this.target.position.z + distance * Math.cos(yaw) * Math.cos(pitch);
    const idealPos = new THREE.Vector3(idealX, idealY, idealZ);

    // 平滑跟随
    this.currentPos.lerp(idealPos, Math.min(1, delta * this.followSpeed));

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
        const freq = 20;
        shakeOffset.x = (Math.random() - 0.5) * 2 * this.shake.intensity * decay;
        shakeOffset.y = (Math.random() - 0.5) * 2 * this.shake.intensity * decay;
        this.camera.position.add(shakeOffset);
      }
    }

    // 设置相机位置
    this.camera.position.copy(this.currentPos).add(shakeOffset);
    this.camera.lookAt(this.target.position.x, this.target.position.y + 1, this.target.position.z);
  }

  // ==================== Getters / Setters ====================
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
}
