/**
 * 边境传说 — 摄像机控制器
 * 支持轨道旋转、平移、缩放，平滑过渡，鼠标/键盘双模式
 */

import * as THREE from 'three';

export interface CameraTarget {
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
}

export interface CameraState {
  distance: number;
  angleX: number;  // 垂直角度
  angleY: number;  // 水平角度
  targetDistance: number;
  targetAngleX: number;
  targetAngleY: number;
  isOrbiting: boolean;
  isPanning: boolean;
  panStart: THREE.Vector2;
  panOffset: THREE.Vector3;
}

export type CameraMode = 'thirdPerson' | 'freeLook' | 'cutscene';

export class CameraController {
  private camera: THREE.PerspectiveCamera;
  private target: CameraTarget;
  private state: CameraState;
  private mode: CameraMode;
  private targetLookAt: THREE.Vector3;

  // 参数
  private readonly orbitSpeed: number = 0.005;
  private readonly panSpeed: number = 0.02;
  private readonly zoomSpeed: number = 0.5;
  private readonly minDistance: number = 3;
  private readonly maxDistance: number = 30;
  private readonly minXAngle: number = -Math.PI / 4;
  private readonly maxXAngle: number = Math.PI / 3;
  private readonly lerpFactor: number = 0.1;

  // 事件
  private onStateChange?: (state: CameraState, lookAt: THREE.Vector3) => void;

  constructor(
    camera: THREE.PerspectiveCamera,
    targetPosition: THREE.Vector3,
    targetLookAt: THREE.Vector3,
  ) {
    this.camera = camera;
    this.target = {
      position: targetPosition.clone(),
      lookAt: targetLookAt.clone(),
    };
    this.targetLookAt = targetLookAt.clone();
    this.mode = 'thirdPerson';
    this.state = {
      distance: 10,
      angleX: -0.3,
      angleY: 0,
      targetDistance: 10,
      targetAngleX: -0.3,
      targetAngleY: 0,
      isOrbiting: false,
      isPanning: false,
      panStart: new THREE.Vector2(),
      panOffset: new THREE.Vector3(),
    };
    this.updateCameraPosition();
  }

  /**
   * 更新摄像机
   */
  public update(delta: number): void {
    // 平滑过渡
    this.state.distance += (this.state.targetDistance - this.state.distance) * this.lerpFactor;
    this.state.angleX += (this.state.targetAngleX - this.state.angleX) * this.lerpFactor;
    this.state.angleY += (this.state.targetAngleY - this.state.angleY) * this.lerpFactor;

    // 确保 lookAt 位置正确
    if (this.mode === 'thirdPerson') {
      this.target.lookAt.copy(this.targetLookAt);
    }

    this.updateCameraPosition();

    if (this.onStateChange) {
      this.onStateChange(this.state, this.target.lookAt);
    }
  }

  /**
   * 更新摄像机位置
   */
  private updateCameraPosition(): void {
    const { distance, angleX, angleY } = this.state;
    const lookAt = this.target.lookAt;

    const xOffset = distance * Math.cos(angleX) * Math.sin(angleY);
    const yOffset = distance * Math.sin(angleX);
    const zOffset = distance * Math.cos(angleX) * Math.cos(angleY);

    this.camera.position.set(
      lookAt.x + xOffset,
      lookAt.y + yOffset,
      lookAt.z + zOffset,
    );

    this.camera.lookAt(lookAt);
  }

  /**
   * 鼠标轨道旋转
   */
  public onPointerDown(event: MouseEvent): void {
    if (this.mode !== 'thirdPerson') return;

    if (event.button === 0) {  // 左键 — 轨道
      this.state.isOrbiting = true;
      this.state.panStart.set(event.clientX, event.clientY);
    } else if (event.button === 2) {  // 右键 — 平移
      this.state.isPanning = true;
      this.state.panStart.set(event.clientX, event.clientY);
    }
  }

  /**
   * 鼠标移动
   */
  public onPointerMove(event: MouseEvent): void {
    if (this.mode !== 'thirdPerson') return;

    if (this.state.isOrbiting) {
      const dx = event.clientX - this.state.panStart.x;
      const dy = event.clientY - this.state.panStart.y;
      this.state.targetAngleY += dx * this.orbitSpeed;
      this.state.targetAngleX += dy * this.orbitSpeed;
      this.state.targetAngleX = THREE.MathUtils.clamp(
        this.state.targetAngleX,
        this.minXAngle,
        this.maxXAngle,
      );
      this.state.panStart.set(event.clientX, event.clientY);
    }

    if (this.state.isPanning) {
      const dx = event.clientX - this.state.panStart.x;
      const dy = event.clientY - this.state.panStart.y;
      const panRight = new THREE.Vector3();
      const panUp = new THREE.Vector3();
      this.camera.getWorldDirection(new THREE.Vector3());
      panRight.crossVectors(
        this.camera.up,
        new THREE.Vector3().subVectors(this.camera.position, this.target.lookAt),
      ).normalize();
      panUp.copy(this.camera.up);

      this.targetLookAt.addScaledVector(panRight, -dx * this.panSpeed);
      this.targetLookAt.addScaledVector(panUp, dy * this.panSpeed);
      this.state.panStart.set(event.clientX, event.clientY);
    }
  }

  /**
   * 鼠标释放
   */
  public onPointerUp(event: MouseEvent): void {
    if (event.button === 0) this.state.isOrbiting = false;
    if (event.button === 2) this.state.isPanning = false;
  }

  /**
   * 滚轮缩放
   */
  public onWheel(event: WheelEvent): void {
    if (this.mode !== 'thirdPerson') return;
    event.preventDefault();
    this.state.targetDistance += event.deltaY * 0.01 * this.zoomSpeed;
    this.state.targetDistance = THREE.MathUtils.clamp(
      this.state.targetDistance,
      this.minDistance,
      this.maxDistance,
    );
  }

  /**
   * 键盘控制
   */
  public onKeyDown(key: string): void {
    if (this.mode !== 'thirdPerson') return;

    switch (key.toLowerCase()) {
      case 'q':
        this.state.targetAngleX -= 0.15;
        break;
      case 'e':
        this.state.targetAngleX += 0.15;
        break;
      case 'arrowup':
      case 'w':
        this.state.targetDistance -= 1;
        break;
      case 'arrowdown':
      case 's':
        this.state.targetDistance += 1;
        break;
    }
    this.state.targetDistance = THREE.MathUtils.clamp(
      this.state.targetDistance,
      this.minDistance,
      this.maxDistance,
    );
    this.state.targetAngleX = THREE.MathUtils.clamp(
      this.state.targetAngleX,
      this.minXAngle,
      this.maxXAngle,
    );
  }

  /**
   * 设置摄像机跟随目标
   */
  public setTarget(position: THREE.Vector3, lookAt: THREE.Vector3): void {
    this.target.position.copy(position);
    this.targetLookAt.copy(lookAt);
  }

  /**
   * 切换到第三人称模式
   */
  public setThirdPersonMode(): void {
    this.mode = 'thirdPerson';
  }

  /**
   * 切换到自由观察模式
   */
  public setFreeLookMode(): void {
    this.mode = 'freeLook';
  }

  /**
   * 切换到过场模式
   */
  public setCutsceneMode(cutsceneCamera: THREE.PerspectiveCamera): void {
    this.mode = 'cutscene';
    // TODO: 实现过场摄像机切换
  }

  /**
   * 获取摄像机状态
   */
  public getState(): CameraState {
    return { ...this.state };
  }

  /**
   * 获取摄像机
   */
  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  /**
   * 设置状态变化回调
   */
  public setOnStateChange(cb: (state: CameraState, lookAt: THREE.Vector3) => void): void {
    this.onStateChange = cb;
  }

  /**
   * 重置摄像机
   */
  public reset(): void {
    this.state.targetDistance = 10;
    this.state.targetAngleX = -0.3;
    this.state.targetAngleY = 0;
    this.targetLookAt.set(0, 0, 0);
  }

  /**
   * 获取摄像机方向向量
   */
  public getCameraDirection(): {
    forward: THREE.Vector3;
    right: THREE.Vector3;
    up: THREE.Vector3;
  } {
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();
    const up = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    right.crossVectors(forward, this.camera.up).normalize();
    up.copy(this.camera.up);
    return { forward, right, up };
  }
}
