/**
 * 边境传说 - 浮动文字渲染器
 * 将 HUDSystem 的浮动文字渲染为 Canvas 上的 3D 投影文字
 * 扩展：支持伤害数字
 */

import { FloatingText } from '../../types';
import * as THREE from 'three';
import { DamageNumberRenderer } from './DamageNumberRenderer';

export class FloatingTextRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private texts: FloatingText[] = [];
  private camera!: THREE.PerspectiveCamera;
  private damageRenderer: DamageNumberRenderer | null = null;
  private onTextsUpdate?: (texts: FloatingText[]) => void;

  // 伤害数字相关
  private showDamageNumbers: boolean = false;
  private damageCanvas: HTMLCanvasElement | null = null;

  constructor(canvas: HTMLCanvasElement, width: number, height: number) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
  }

  /**
   * 设置伤害数字 Canvas
   */
  public setDamageCanvas(canvas: HTMLCanvasElement, width: number, height: number): void {
    this.damageCanvas = canvas;
    this.damageRenderer = new DamageNumberRenderer(canvas, width, height);
  }

  /**
   * 开启/关闭伤害数字显示
   */
  public setShowDamageNumbers(show: boolean): void {
    this.showDamageNumbers = show;
  }

  public setCamera(camera: THREE.PerspectiveCamera): void {
    this.camera = camera;
  }

  public setOnUpdate(cb: (texts: FloatingText[]) => void): void {
    this.onTextsUpdate = cb;
  }

  public setTexts(texts: FloatingText[]): void {
    this.texts = texts;
  }

  /**
   * 添加伤害数字
   */
  public addDamageNumber(
    x: number, z: number, value: number,
    isCrit: boolean = false, isHeal: boolean = false,
  ): void {
    if (!this.damageRenderer) return;
    this.damageRenderer.addDamage(x, z, value, isCrit, isHeal);
  }

  /**
   * 更新并渲染
   */
  public tickAndRender(dt: number): void {
    // 更新伤害数字
    if (this.damageRenderer && this.showDamageNumbers) {
      this.damageRenderer.tickAndRender(dt);
    }
    this.render();
  }

  public render(): void {
    this.ctx.clearRect(0, 0, this.width, this.height);
    if (!this.camera) return;

    for (const text of this.texts) {
      const screenPos = this.projectToScreen(text.position.x, text.position.z);
      if (!screenPos || screenPos.z < 0) continue;

      const alpha = Math.min(1, text.lifetime);
      const offsetY = (2 - text.lifetime) * 40;
      const y = screenPos.y - offsetY;

      this.ctx.globalAlpha = alpha;
      this.ctx.font = 'bold 20px Segoe UI, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';

      // 描边
      this.ctx.strokeStyle = 'rgba(0,0,0,0.8)';
      this.ctx.lineWidth = 4;
      this.ctx.strokeText(text.text, screenPos.x, y);

      // 填充
      this.ctx.fillStyle = '#' + text.color.toString(16).padStart(6, '0');
      this.ctx.fillText(text.text, screenPos.x, y);

      this.ctx.globalAlpha = 1;
    }
  }

  private projectToScreen(x: number, z: number): { x: number; y: number; z: number } | null {
    const vector = new THREE.Vector3(x, this.camera.position.y, z);
    vector.project(this.camera);
    if (vector.z > 1) return null;
    return {
      x: (vector.x + 1) / 2 * this.width,
      y: (-vector.y + 1) / 2 * this.height,
      z: vector.z,
    };
  }
}
