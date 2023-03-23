/**
 * 边境传说 — 相机控制器（第三人称跟随）
 * 支持鼠标转向 + WASD 控制相机角度
 */
import * as THREE from 'three';
import { InputState } from '../types';
export interface CameraState {
    yaw: number;
    pitch: number;
    distance: number;
    heightOffset: number;
}
export declare class CameraController {
    private target;
    private camera;
    private state;
    private input;
    private sensitivity;
    private minPitch;
    private maxPitch;
    private minDistance;
    private maxDistance;
    constructor(camera: THREE.PerspectiveCamera, target: THREE.Object3D, input: InputState);
    /**
     * 处理鼠标输入，更新相机角度
     */
    onMouseMove(deltaX: number, deltaY: number): void;
    /**
     * 处理鼠标滚轮，调整相机距离
     */
    onWheel(deltaY: number): void;
    /**
     * 更新相机位置（每帧调用）
     */
    update(): void;
    getState(): CameraState;
    setYaw(yaw: number): void;
    setPitch(pitch: number): void;
    getTarget(): THREE.Object3D;
    setTarget(target: THREE.Object3D): void;
    getSensitivity(): number;
    setSensitivity(sensitivity: number): void;
}
