/**
 * 边境传说 — 相机控制器（第三人称跟随）
 * 支持鼠标转向 + WASD 控制相机角度
 */

import * as THREE from 'three';
import { InputState } from '../types';

export interface CameraState {
  yaw: number;     // 水平旋转 (弧度)
  pitch: number;   // 垂直旋转 (弧度)
  distance: number; // 相机到目标的距离
  heightOffset: number; // 相机高度偏移
}

export class CameraController {
  private target: THREE.Object3D;       // 相机跟随的目标
  private camera: THREE.PerspectiveCamera;
  private state: CameraState;
  private input: InputState;
  private sensitivity: number;
  private minPitch: number;
  private maxPitch: number;
  private minDistance: number;
  private maxDistance: number;

  constructor(
    camera: THREE.PerspectiveCamera,
    target: THREE.Object3D,
    input: InputState
  ) {
    this.camera = camera;
    this.target = target;
    this.input = input;

    this.state = {
      yaw: 0,
      pitch: Math.PI / 6,
      distance: 10,
      heightOffset: 3,
    };

    this.sensitivity = 0.003;
    this.minPitch = -Math.PI / 3;
    this.maxPitch = Math.PI / 2.5;
    this.minDistance = 3;
    this.maxDistance = 25;
  }

  /**
   * 处理鼠标输入，更新相机角度
   */
  public onMouseMove(deltaX: number, deltaY: number): void {
    this.state.yaw -= deltaX * this.sensitivity;
    this.state.pitch -= deltaY * this.sensitivity;
    // 限制 pitch 范围
    this.state.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.state.pitch));
  }

  /**
   * 处理鼠标滚轮，调整相机距离
   */
  public onWheel(deltaY: number): void {
    this.state.distance += deltaY * 0.01;
    this.state.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.state.distance));
  }

  /**
   * 更新相机位置（每帧调用）
   */
  public update(): void {
    const { yaw, pitch, distance, heightOffset } = this.state;

    // 计算相机在球面坐标中的位置
    const x = this.target.position.x + distance * Math.sin(yaw) * Math.cos(pitch);
    const y = this.target.position.y + heightOffset + distance * Math.sin(pitch);
    const z = this.target.position.z + distance * Math.cos(yaw) * Math.cos(pitch);

    this.camera.position.set(x, y, z);
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
}
