/**
 * 边境传说 — 浮动伤害数字渲染器
 * 在 3D 世界空间上方显示浮动伤害/治疗数字
 * 特性：弹跳弧线、渐隐、颜色编码、缩放动画、多目标投射
 */

import * as THREE from 'three';

// ==================== 浮动文字类型 ====================
export interface FloatingText {
  id: string;
  text: string;
  position: { x: number; z: number };
  lifetime: number;
  maxLifetime: number;
  color: number;
  fontSize: number;
  isCrit: boolean;
}

// ==================== 伤害数字配置 ====================
export interface DamageNumberConfig {
  fontSize?: number;
  critFontSize?: number;
  healFontSize?: number;
  bounceHeight?: number;
  fadeDuration?: number;
  lifetime?: number;
  maxNumbers?: number;
}

const DEFAULT_CONFIG: Required<DamageNumberConfig> = {
  fontSize: 18,
  critFontSize: 26,
  healFontSize: 20,
  bounceHeight: 60,
  fadeDuration: 1.5,
  lifetime: 2.0,
  maxNumbers: 30,
};

/**
 * 伤害数字渲染器
 * 使用 Canvas 2D 将 3D 坐标投影到屏幕空间后渲染
 */
export class DamageNumbersRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private numbers: FloatingText[] = [];
  private maxNumbers: number;

  // 配置
  private fontSize: number;
  private critFontSize: number;
  private healFontSize: number;
  private bounceHeight: number;
  private fadeDuration: number;
  private lifetime: number;

  // 3D -> 屏幕投射
  private camera?: THREE.PerspectiveCamera;
  private worldMatrix = new THREE.Matrix4();

  // ID 计数器
  private static nextId = 0;
  private getNextId(): string {
    return 'dn_' + (DamageNumbersRenderer.nextId++);
  }

  constructor(
    canvas: HTMLCanvasElement,
    width: number,
    height: number,
    config: Partial<DamageNumberConfig> = {}
  ) {
    const merged = { ...DEFAULT_CONFIG, ...config };
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    this.fontSize = merged.fontSize!;
    this.critFontSize = merged.critFontSize!;
    this.healFontSize = merged.healFontSize!;
    this.bounceHeight = merged.bounceHeight!;
    this.fadeDuration = merged.fadeDuration!;
    this.lifetime = merged.lifetime!;
    this.maxNumbers = merged.maxNumbers!;

    this.draw();
  }

  /**
   * 设置摄像机用于 3D->2D 投影
   */
  public setCamera(camera: THREE.PerspectiveCamera): void {
    this.camera = camera;
  }

  /**
   * 添加伤害数字
   */
  public addDamage(
    x: number,
    z: number,
    value: number,
    isCrit: boolean = false,
    isHeal: boolean = false
  ): void {
    const fontSize = isCrit ? this.critFontSize : isHeal ? this.healFontSize : this.fontSize;
    const color = this.getColor(isCrit, isHeal);
    const text = isCrit
      ? `${value}`
      : value.toString();

    const number: FloatingText = {
      id: this.getNextId(),
      text,
      position: { x, z },
      lifetime: this.lifetime,
      maxLifetime: this.lifetime,
      color,
      fontSize,
      isCrit,
    };
    this.numbers.push(number);
    if (this.numbers.length > this.maxNumbers) {
      this.numbers.shift();
    }
    this.draw();
  }

  /**
   * 添加治疗数字
   */
  public addHeal(x: number, z: number, value: number): void {
    this.addDamage(x, z, value, false, true);
  }

  /**
   * 添加MISS文字
   */
  public addMiss(x: number, z: number, text: string = 'MISS'): void {
    const number: FloatingText = {
      id: this.getNextId(),
      text,
      position: { x, z },
      lifetime: 1.0,
      maxLifetime: 1.0,
      color: 0x888888,
      fontSize: 14,
      isCrit: false,
    };
    this.numbers.push(number);
    this.draw();
  }

  /**
   * 添加格挡文字
   */
  public addBlock(x: number, z: number): void {
    const number: FloatingText = {
      id: this.getNextId(),
      text: 'BLOCKED',
      position: { x, z },
      lifetime: 1.0,
      maxLifetime: 1.0,
      color: 0xaaaaaa,
      fontSize: 14,
      isCrit: false,
    };
    this.numbers.push(number);
    this.draw();
  }

  /**
   * 更新并渲染
   */
  public tickAndRender(dt: number): void {
    for (const num of this.numbers) {
      num.lifetime -= dt;
    }
    this.numbers = this.numbers.filter((n) => n.lifetime > 0);
    this.draw();
  }

  /**
   * 渲染
   */
  public draw(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    if (!this.camera) return;

    for (const num of this.numbers) {
      // 投影到屏幕空间
      const screenPos = this.projectToScreen(num.position.x, num.position.z);
      if (!screenPos || screenPos.z < 0 || screenPos.x < -100 || screenPos.x > this.width + 100 ||
          screenPos.y < -100 || screenPos.y > this.height + 100) {
        continue;
      }

      // 进度 (1 -> 0)
      const progress = 1 - num.lifetime / num.maxLifetime;
      const alpha = num.lifetime <= this.fadeDuration
        ? num.lifetime / this.fadeDuration
        : 1;

      // 弹跳曲线（先上后下）
      const bounce = Math.sin(progress * Math.PI) * this.bounceHeight;
      const offsetY = (1 - progress) * 30;

      // 缩放（出现时放大再缩小）
      let scale = 1;
      if (progress < 0.1) {
        scale = 0.5 + (progress / 0.1) * 0.5; // 0.5 -> 1
      } else if (progress > 0.8) {
        scale = 1 - ((progress - 0.8) / 0.2) * 0.3; // 1 -> 0.7
      }

      const finalY = screenPos.y - bounce - offsetY;
      const finalX = screenPos.x;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(finalX, finalY);
      ctx.scale(scale, scale);

      const displayColor = `#${num.color.toString(16).padStart(6, '0')}`;
      ctx.font = `bold ${num.fontSize}px "Segoe UI", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // 描边
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.lineWidth = 3;
      ctx.strokeText(num.text, 0, 0);

      // 填充
      ctx.fillStyle = displayColor;
      ctx.fillText(num.text, 0, 0);

      // 暴击标记
      if (num.isCrit) {
        ctx.font = 'bold 13px "Segoe UI", sans-serif';
        ctx.fillStyle = '#ff0000';
        ctx.fillText('CRIT!', 0, -num.fontSize * 0.7);
      }

      ctx.restore();
    }
  }

  /**
   * 将 3D 世界坐标投影到屏幕空间
   */
  private projectToScreen(x: number, z: number): { x: number; y: number; z: number } | null {
    if (!this.camera) return null;

    this.worldMatrix.identity();

    const vector = new THREE.Vector3(x, 1.5, z); // y=1.5 为敌人头顶高度
    vector.project(this.camera);

    if (vector.z > 1) return null;

    const sx = (vector.x + 1) / 2 * this.width;
    const sy = (-vector.y + 1) / 2 * this.height;

    return { x: sx, y: sy, z: vector.z };
  }

  private getColor(isCrit: boolean, isHeal: boolean): number {
    if (isCrit) return 0xff3333;
    if (isHeal) return 0x33ff33;
    return 0xffcc00;
  }

  /**
   * 获取 Canvas
   */
  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  /**
   * 清除所有数字
   */
  public clear(): void {
    this.numbers = [];
    this.draw();
  }

  /**
   * 获取当前活跃数量
   */
  public getActiveCount(): number {
    return this.numbers.length;
  }
}