/**
 * 边境传说 — Three.js 渲染器管理
 * 管理场景、相机、渲染器、光照
 */
import * as THREE from 'three';
import { SceneConfig } from '../types';
export declare class Renderer {
    private scene;
    private camera;
    private renderer;
    private clock;
    private ambientLight;
    private directionalLight;
    private onRenderCallback;
    private animationId;
    private isRunning;
    constructor(canvas: HTMLCanvasElement);
    private onResize;
    /**
     * 设置场景环境配置
     */
    setSceneConfig(config: SceneConfig): void;
    /**
     * 添加渲染回调
     */
    addRenderCallback(callback: (delta: number) => void): void;
    /**
     * 开始渲染循环
     */
    start(): void;
    /**
     * 停止渲染循环
     */
    stop(): void;
    private animate;
    getScene(): THREE.Scene;
    getCamera(): THREE.PerspectiveCamera;
    getRenderer(): THREE.WebGLRenderer;
    getClock(): THREE.Clock;
    setBackgroundColor(color: string): void;
    setFog(color: string, density: number): void;
    clearFog(): void;
}
