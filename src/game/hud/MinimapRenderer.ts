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
   * 渲染小地图
   */
  public draw(): void {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const cx = w / 2;
    const cy = h / 2;

    // 清除
    ctx.fillStyle = 'rgba(20, 30, 20, 0.92)';
    ctx.fillRect(0, 0, w, h);

    // 边框
    ctx.strokeStyle = 'rgba(100, 180, 100, 0.6)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, w - 2, h - 2);

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

      // 发光效果
      ctx.beginPath();
      ctx.arc(sx, sy, r + 3, 0, Math.PI * 2);
      ctx.fillStyle = (typeof color === 'string' ? color : String(color)) + '33';
      ctx.fill();

      // 主体
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fillStyle = (typeof color === 'string' ? color : '#' + color.toString(16).padStart(6, '0'));
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

    // 绘制玩家（朝上箭头）
    const px = cx;
    const py = cy;
    const dirX = Math.sin(this.playerAngle);
    const dirZ = Math.cos(this.playerAngle);

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
