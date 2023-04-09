/**
 * 边境传说 — 小地图渲染器
 * 以俯视视角渲染玩家周围区域，显示玩家、敌人、NPC、收集品
 */

import * as THREE from 'three';
import { EnemyDef } from '../../types';

export interface MinimapEntity {
  x: number;
  z: number;
  type: 'player' | 'enemy' | 'npc' | 'collectible' | 'quest';
  label?: string;
  color?: number;
  radius?: number;
}

export class MinimapRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private entities: MinimapEntity[] = [];
  private playerPos: { x: number; z: number } = { x: 0, z: 0 };
  private playerAngle: number = 0;
  private terrainSampler: ((x: number, z: number) => number) | null = null;
  private bgPattern: HTMLCanvasElement | null = null;
  private pulse: number = 0;

  // 配置
  private readonly scale: number = 8;  // 像素/单位
  private readonly playerRadius: number = 4;
  private readonly entityRadius: number = 3;

  constructor(canvas: HTMLCanvasElement, width: number, height: number) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;

    // 初始样式
    this.draw();
  }

  /**
   * 设置实体列表
   */
  public setEntities(entities: MinimapEntity[]): void {
    this.entities = entities;
  }

  /**
   * 设置玩家位置
   */
  public setPlayerPosition(x: number, z: number, angle: number = 0): void {
    this.playerPos = { x, z };
    this.playerAngle = angle;
    this.draw();
  }

  /**
   * 设置地形高度采样器（可选，用于真实地形着色）
   */
  public setTerrainSampler(sampler: (x: number, z: number) => number): void {
    this.terrainSampler = sampler;
    this.bgPattern = null; // 重建底图
    this.draw();
  }

  /** 构建地形底图（带高度采样器用真实地形，否则用程序化纹理） */
  private buildBackground(): HTMLCanvasElement {
    const off = document.createElement('canvas');
    off.width = this.width;
    off.height = this.height;
    const octx = off.getContext('2d')!;
    const cx = this.width / 2;
    const cy = this.height / 2;

    octx.fillStyle = '#16241a';
    octx.fillRect(0, 0, this.width, this.height);

    // 逐像素地形着色（分辨率减半后放大，开销可控）
    const step = 4;
    for (let py = 0; py < this.height; py += step) {
      for (let px = 0; px < this.width; px += step) {
        const wx = this.playerPos.x + (px - cx) / this.scale;
        const wz = this.playerPos.z + (py - cy) / this.scale;
        const h = this.terrainSampler
          ? this.terrainSampler(wx, wz)
          : Math.sin(wx * 0.11) * Math.cos(wz * 0.13) * 2 + Math.sin(wx * 0.05 + wz * 0.07) * 3;
        // 草 → 岩 → 雪 三段渐变（与地形配色一致）
        const t = Math.max(0, Math.min(1, (h + 4) / 12));
        const r = Math.round(52 + t * 60 + Math.max(0, h - 7) * 18);
        const g = Math.round(82 + t * 42 + Math.max(0, h - 7) * 16);
        const b = Math.round(52 + t * 30 + Math.max(0, h - 7) * 22);
        octx.fillStyle = `rgb(${Math.min(r, 210)},${Math.min(g, 205)},${Math.min(b, 215)})`;
        octx.fillRect(px, py, step, step);
      }
    }
    return off;
  }

  /**
   * 渲染小地图
   */
  public draw(): void {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const cx = w / 2;
    const cy = h / 2;
    this.pulse += 0.15;

    // 地形底图
    if (!this.bgPattern) {
      this.bgPattern = this.buildBackground();
    }
    ctx.drawImage(this.bgPattern, 0, 0);

    // 网格 + 中心十字
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 1;
    for (let gx = cx % 32; gx < w; gx += 32) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke();
    }
    for (let gy = cy % 32; gy < h; gy += 32) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
    }

    // 视野锥（朝向扇形）
    const dirX = Math.sin(this.playerAngle);
    const dirZ = Math.cos(this.playerAngle);
    const coneAngle = Math.PI / 3.2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, 64, Math.atan2(dirZ, dirX) - coneAngle, Math.atan2(dirZ, dirX) + coneAngle);
    ctx.closePath();
    const cone = ctx.createRadialGradient(cx, cy, 4, cx, cy, 64);
    cone.addColorStop(0, 'rgba(120,200,255,0.28)');
    cone.addColorStop(1, 'rgba(120,200,255,0)');
    ctx.fillStyle = cone;
    ctx.fill();

    // 绘制实体
    for (const entity of this.entities) {
      const dx = entity.x - this.playerPos.x;
      const dz = entity.z - this.playerPos.z;
      const sx = cx + dx * this.scale;
      const sy = cy + dz * this.scale;

      // 是否在视口内（带余量）
      const margin = 20;
      if (sx < -margin || sx > w + margin || sy < -margin || sy > h + margin) continue;

      const color = entity.color || this.getDefaultColor(entity.type);
      const r = entity.radius || this.entityRadius;
      const colorStr = typeof color === 'string' ? color : '#' + color.toString(16).padStart(6, '0');

      // 任务目标脉冲光环
      if (entity.type === 'quest') {
        const pr = r + 5 + Math.sin(this.pulse) * 2.5;
        ctx.beginPath();
        ctx.arc(sx, sy, pr, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(64,196,255,0.25)';
        ctx.fill();
      }

      // 发光效果
      ctx.beginPath();
      ctx.arc(sx, sy, r + 3, 0, Math.PI * 2);
      ctx.fillStyle = colorStr + '33';
      ctx.fill();

      // 主体
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fillStyle = colorStr;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // 标签
      if (entity.label) {
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(entity.label, sx, sy - r - 4);
      }
    }

    // 绘制玩家（朝向箭头）
    const px = cx;
    const py = cy;

    ctx.beginPath();
    ctx.arc(px, py, this.playerRadius + 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(100, 200, 255, 0.3)';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(px + dirX * 10, py + dirZ * 10);
    ctx.lineTo(px - dirZ * 5, py - dirX * 5);
    ctx.lineTo(px + dirZ * 5, py + dirX * 5);
    ctx.closePath();
    ctx.fillStyle = '#4fc3f7';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 方向指示环
    ctx.beginPath();
    ctx.arc(px, py, 14, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(100, 200, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 指北标记 + 边框
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.textAlign = 'center';
    ctx.fillText('N', cx, 13);
    ctx.beginPath();
    ctx.moveTo(cx, 16); ctx.lineTo(cx - 4, 22); ctx.lineTo(cx + 4, 22);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fill();

    const border = ctx.createLinearGradient(0, 0, 0, h);
    border.addColorStop(0, 'rgba(140,200,255,0.75)');
    border.addColorStop(1, 'rgba(80,140,200,0.45)');
    ctx.strokeStyle = border;
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, w - 2, h - 2);
  }

  private getDefaultColor(type: string): string {
    switch (type) {
      case 'player': return '#4fc3f7';
      case 'enemy': return '#ff5252';
      case 'npc': return '#ffd740';
      case 'collectible': return '#69f0ae';
      case 'quest': return '#40c4ff';
      default: return '#ffffff';
    }
  }

  /**
   * 获取 Canvas
   */
  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
}
