/**
 * 边境传说 — 伤害数字渲染器
 * 在击中位置上方显示浮动伤害数字，带弹跳和渐隐动画
 */

import { FloatingText } from '../../types';

export interface DamageNumber {
  id: number;
  value: number;
  isCrit: boolean;
  isHeal: boolean;
  position: { x: number; z: number };
  lifetime: number;
  color: number;
}

let nextDamageId = 0;

export class DamageNumberRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private numbers: DamageNumber[] = [];
  private maxNumbers: number = 30;

  // 配置
  private readonly baseFontSize: number = 18;
  private readonly critFontSize: number = 26;
  private readonly healFontSize: number = 20;
  private readonly bounceHeight: number = 60;
  private readonly fadeDuration: number = 1.5;  // 秒
  private readonly lifetime: number = 2.0;  // 秒

  constructor(canvas: HTMLCanvasElement, width: number, height: number) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    this.draw();
  }

  /**
   * 添加伤害数字
   */
  public addDamage(
    x: number, z: number, value: number,
    isCrit: boolean = false, isHeal: boolean = false,
  ): void {
    const number: DamageNumber = {
      id: nextDamageId++,
      value,
      isCrit,
      isHeal,
      position: { x, z },
      lifetime: this.lifetime,
      color: this.getColor(isCrit, isHeal),
    };
    this.numbers.push(number);
    if (this.numbers.length > this.maxNumbers) {
      this.numbers.shift();
    }
    this.draw();
  }

  /**
   * 更新并渲染
   */
  public tickAndRender(dt: number): void {
    for (const num of this.numbers) {
      num.lifetime -= dt;
    }
    this.numbers = this.numbers.filter(n => n.lifetime > 0);
    this.draw();
  }

  /**
   * 渲染
   */
  public draw(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    for (const num of this.numbers) {
      // 进度 (1 -> 0)
      const progress = 1 - (num.lifetime / this.lifetime);
      const alpha = num.lifetime <= this.fadeDuration
        ? num.lifetime / this.fadeDuration
        : 1;

      // 弹跳曲线（先上后下）
      const bounce = Math.sin(progress * Math.PI) * this.bounceHeight;
      const offsetY = (1 - progress) * 30;

      // 缩放（出现时放大再缩小）
      let scale = 1;
      if (progress < 0.1) {
        scale = 0.5 + (progress / 0.1) * 0.5;  // 0.5 -> 1
      }

      ctx.save();
      ctx.globalAlpha = alpha;

      const fontSize = (num.isCrit ? this.critFontSize : num.isHeal ? this.healFontSize : this.baseFontSize) * scale;
      ctx.font = num.isCrit ? 'bold 30px Segoe UI, sans-serif' : 'bold 18px Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // 文本颜色
      const displayColor = num.isCrit ? '#ff3333' : num.isHeal ? '#33ff33' : '#ffcc00';
      ctx.fillStyle = displayColor;

      // 描边
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.lineWidth = 3;
      ctx.strokeText(num.value.toString(), this.width / 2, this.height / 2 - bounce - offsetY);
      ctx.fillText(num.value.toString(), this.width / 2, this.height / 2 - bounce - offsetY);

      // 暴击标记
      if (num.isCrit) {
        ctx.font = 'bold 14px Segoe UI, sans-serif';
        ctx.fillStyle = '#ff0000';
        ctx.fillText('CRIT!', this.width / 2, this.height / 2 - bounce - offsetY - fontSize * 0.8);
      }

      ctx.restore();
    }
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
}
