/**
 * 边境传说 — 技能栏渲染器
 * 在屏幕底部渲染可拖拽的技能快捷栏
 */

import * as THREE from 'three';

export interface SkillBarSlot {
  id: string;
  icon: string;
  keyBind: string;
  cooldown: number;  // 秒
  maxCooldown: number;
  isUsable: boolean;
  isActive: boolean;
}

export class SkillBarRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private slots: SkillBarSlot[] = [];
  private onSelect?: (skillId: string) => void;

  // 配置
  private readonly slotSize: number = 56;
  private readonly gap: number = 4;
  private readonly padding: number = 8;
  private readonly cornerRadius: number = 6;
  private readonly keyFontSize: number = 11;
  private readonly iconFontSize: number = 24;
  private readonly cooldownFontSize: number = 14;

  // 鼠标状态
  private hoveredSlot: string | null = null;
  private pressedSlot: string | null = null;

  constructor(canvas: HTMLCanvasElement, width: number, height: number) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;

    // 默认技能栏（10 个槽位）
    this.slots = [
      { id: 'skill_1', icon: '⚔️', keyBind: '1', cooldown: 0, maxCooldown: 3, isUsable: true, isActive: false },
      { id: 'skill_2', icon: '🛡️', keyBind: '2', cooldown: 0, maxCooldown: 8, isUsable: true, isActive: false },
      { id: 'skill_3', icon: '🔥', keyBind: '3', cooldown: 0, maxCooldown: 5, isUsable: true, isActive: false },
      { id: 'skill_4', icon: '⚡', keyBind: '4', cooldown: 0, maxCooldown: 10, isUsable: true, isActive: false },
      { id: 'skill_5', icon: '💨', keyBind: '5', cooldown: 0, maxCooldown: 2, isUsable: true, isActive: false },
      { id: 'skill_6', icon: '🌀', keyBind: '6', cooldown: 0, maxCooldown: 12, isUsable: true, isActive: false },
      { id: 'skill_7', icon: '✨', keyBind: '7', cooldown: 0, maxCooldown: 15, isUsable: true, isActive: false },
      { id: 'skill_8', icon: '🗡️', keyBind: '8', cooldown: 0, maxCooldown: 6, isUsable: true, isActive: false },
      { id: 'skill_9', icon: '🌊', keyBind: '9', cooldown: 0, maxCooldown: 20, isUsable: true, isActive: false },
      { id: 'skill_0', icon: '🌟', keyBind: '0', cooldown: 0, maxCooldown: 30, isUsable: true, isActive: false },
    ];

    this.draw();
  }

  /**
   * 设置技能列表
   */
  public setSlots(slots: SkillBarSlot[]): void {
    this.slots = slots;
    this.draw();
  }

  /**
   * 获取当前技能
   */
  public getSlot(skillId: string): SkillBarSlot | undefined {
    return this.slots.find(s => s.id === skillId);
  }

  /**
   * 更新冷却时间
   */
  public tickCooldowns(dt: number): void {
    let changed = false;
    for (const slot of this.slots) {
      if (slot.cooldown > 0) {
        slot.cooldown = Math.max(0, slot.cooldown - dt);
        changed = true;
        if (slot.cooldown <= 0) {
          slot.isUsable = true;
          changed = true;
        }
      }
    }
    if (changed) this.draw();
  }

  /**
   * 激活技能（按下键）
   */
  public activateSkill(keyBind: string): void {
    const slot = this.slots.find(s => s.keyBind === keyBind);
    if (slot && slot.isUsable) {
      slot.cooldown = slot.maxCooldown;
      slot.isUsable = false;
      this.onSelect?.(slot.id);
      this.draw();
    }
  }

  /**
   * 鼠标悬停
   */
  public onMouseMove(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const mx = event.clientX - rect.left;
    const my = event.clientY - rect.top;

    const totalWidth = this.slots.length * (this.slotSize + this.gap) - this.gap;
    const startX = (this.width - totalWidth) / 2;
    const startY = this.height - this.slotSize - this.padding;

    this.hoveredSlot = null;
    for (let i = 0; i < this.slots.length; i++) {
      const sx = startX + i * (this.slotSize + this.gap);
      if (mx >= sx && mx <= sx + this.slotSize &&
          my >= startY && my <= startY + this.slotSize) {
        this.hoveredSlot = this.slots[i].id;
        break;
      }
    }
    this.draw();
  }

  /**
   * 鼠标点击
   */
  public onMouseDown(event: MouseEvent): void {
    if (this.hoveredSlot) {
      this.onSelect?.(this.hoveredSlot);
    }
  }

  /**
   * 渲染技能栏
   */
  public draw(): void {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const totalWidth = this.slots.length * (this.slotSize + this.gap) - this.gap;
    const startX = (w - totalWidth) / 2;
    const startY = h - this.slotSize - this.padding;

    // 背景条
    const barWidth = totalWidth + this.padding * 2;
    const barHeight = this.slotSize + this.padding * 2;
    const barX = startX - this.padding;
    const barY = startY - this.padding;

    ctx.fillStyle = 'rgba(10, 15, 10, 0.85)';
    this.drawRoundedRect(ctx, barX, barY, barWidth, barHeight, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(100, 180, 100, 0.5)';
    ctx.lineWidth = 1.5;
    this.drawRoundedRect(ctx, barX, barY, barWidth, barHeight, 10);
    ctx.stroke();

    // 绘制每个槽位
    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      const sx = startX + i * (this.slotSize + this.gap);
      const sy = startY;
      const isHovered = this.hoveredSlot === slot.id;

      // 槽位背景
      ctx.fillStyle = isHovered ? 'rgba(60, 80, 60, 0.9)' : 'rgba(30, 40, 30, 0.8)';
      this.drawRoundedRect(ctx, sx, sy, this.slotSize, this.slotSize, this.cornerRadius);
      ctx.fill();

      // 边框
      ctx.strokeStyle = isHovered ? 'rgba(150, 220, 150, 0.8)' : 'rgba(80, 120, 80, 0.5)';
      ctx.lineWidth = isHovered ? 2 : 1;
      this.drawRoundedRect(ctx, sx, sy, this.slotSize, this.slotSize, this.cornerRadius);
      ctx.stroke();

      // 快捷键标签
      ctx.font = `${this.cooldownFontSize}px monospace`;

      ctx.fillStyle = 'rgba(200, 200, 200, 0.7)';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(slot.keyBind, sx + 3, sy + 2);

      // 图标
      ctx.font = `${this.iconFontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(slot.icon, sx + this.slotSize / 2, sy + this.slotSize / 2 - 4);

      // 冷却遮罩
      if (slot.cooldown > 0) {
        const ratio = slot.cooldown / slot.maxCooldown;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.drawRoundedRect(ctx, sx, sy, this.slotSize * ratio, this.slotSize, this.cornerRadius);
        ctx.fill();

        // 冷却时间文字
      ctx.font = `${this.cooldownFontSize}px monospace`;

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(Math.ceil(slot.cooldown).toString(), sx + this.slotSize / 2, sy + this.slotSize - 2);
      }

      // 可用指示
      if (slot.isUsable && !isHovered) {
        ctx.beginPath();
        ctx.arc(sx + 4, sy + 4, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#69f0ae';
        ctx.fill();
      }
    }
  }

  private drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    w: number, h: number,
    r: number,
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  /**
   * 设置选择回调
   */
  public setOnSelect(cb: (skillId: string) => void): void {
    this.onSelect = cb;
  }

  /**
   * 获取 Canvas
   */
  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
}