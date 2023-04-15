/**
 * 边境传说 - HUD 系统
 * 管理状态栏、等级、金币、任务、浮动文字、战斗日志
 * 
 * 更新 (v1.2): 
 * - 添加 attackLog 用于记录最近战斗日志
 * - 添加 setCombatState 的持久化控制
 * - 添加 clearAttackLog 供外部清理
 */

import { HUDState, FloatingText, Quest } from '../../types';

export class HUDSystem {
  private state: HUDState = {
    hp: 100, maxHp: 100, mp: 50, maxMp: 50,
    xp: 0, xpToNext: 100, level: 1, gold: 0,
    enemyCount: 0, activeQuests: [], isCombat: false, isPaused: false, isMenuOpen: false,
    combo: 0, comboMax: 0,
  };
  private comboTimer: number = 0;
  private floatingTexts: FloatingText[] = [];
  private maxFloatingTexts = 20;
  private onUpdate?: (state: HUDState) => void;
  private onFloatingTextsUpdate?: (texts: FloatingText[]) => void;
  private notificationTimeout: number = 0;
  private notificationMsg: string | null = null;

  // ===== v1.2: 攻击日志 =====
  private attackLog: string[] = [];
  private maxAttackLogEntries = 50;

  public setOnUpdate(cb: (state: HUDState) => void): void { this.onUpdate = cb; }
  public setOnFloatingTextsUpdate(cb: (texts: FloatingText[]) => void): void { this.onFloatingTextsUpdate = cb; }
  public setNotification(msg: string | null): void {
    this.notificationMsg = msg;
    if (msg) this.notificationTimeout = Date.now() + 3000;
  }
  public getNotification(): string | null {
    if (this.notificationMsg && Date.now() > this.notificationTimeout) {
      this.notificationMsg = null;
    }
    return this.notificationMsg;
  }

  public updateState(updates: Partial<HUDState>): void {
    Object.assign(this.state, updates);
    if (this.onUpdate) this.onUpdate(this.state);
  }

  public getState(): HUDState { return { ...this.state }; }

  public addFloatingText(text: string, x: number, z: number, color: number = 0xffffff): void {
    this.floatingTexts.push({ text, position: { x, z }, color, lifetime: 2.0 });
    if (this.floatingTexts.length > this.maxFloatingTexts) this.floatingTexts.shift();
    if (this.onFloatingTextsUpdate) this.onFloatingTextsUpdate(this.floatingTexts);
  }

  public tick(dt: number): void {
    for (const ft of this.floatingTexts) ft.lifetime -= dt;
    this.floatingTexts = this.floatingTexts.filter(ft => ft.lifetime > 0);
    if (this.onFloatingTextsUpdate) this.onFloatingTextsUpdate(this.floatingTexts);

    // 连击衰减：2.5 秒内没有新命中则清零
    if (this.state.combo > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.clearCombo();
    }
  }

  /** 命中登记：连击 +1 并刷新衰减计时，返回伤害倍率 */
  public registerHit(): number {
    this.state.combo += 1;
    this.state.comboMax = Math.max(this.state.comboMax, this.state.combo);
    this.comboTimer = 2.5;
    if (this.onUpdate) this.onUpdate(this.state);
    return 1 + Math.min(this.state.combo, 25) * 0.04;
  }

  public getCombo(): number { return this.state.combo; }

  public clearCombo(): void {
    if (this.state.combo !== 0) {
      this.state.combo = 0;
      if (this.onUpdate) this.onUpdate(this.state);
    }
  }

  public updateHP(hp: number, maxHp: number): void { this.updateState({ hp, maxHp }); }
  public updateMP(mp: number, maxMp: number): void { this.updateState({ mp, maxMp }); }
  public updateXP(xp: number, xpToNext: number): void { this.updateState({ xp, xpToNext }); }
  public addGold(amount: number): void { this.updateState({ gold: this.state.gold + amount }); }
  public addXP(amount: number): void {
    let newXp = this.state.xp + amount;
    let leveledUp = false;
    while (newXp >= this.state.xpToNext) {
      newXp -= this.state.xpToNext;
      this.state.level++;
      this.state.xpToNext = Math.floor(this.state.xpToNext * 1.5);
      leveledUp = true;
    }
    this.updateState({ xp: newXp });
    if (leveledUp) this.setNotification('升级到 Lv.' + this.state.level + '!');
  }
  public setEnemyCount(count: number): void { this.updateState({ enemyCount: count }); }
  public setActiveQuests(quests: Quest[]): void { this.updateState({ activeQuests: quests }); }

  // ===== v1.2: 战斗日志系统 =====
  private _isCombat: boolean = false;
  public get isCombat(): boolean { return this._isCombat; }

  public setCombatState(combat: boolean): void { 
    this._isCombat = combat; 
    this.updateState({ isCombat: combat });
  }

  public getAttackLog(): ReadonlyArray<string> {
    return this.attackLog;
  }

  public addAttackLog(msg: string): void {
    this.attackLog.push(msg);
    if (this.attackLog.length > this.maxAttackLogEntries) {
      this.attackLog.shift();
    }
    // 通知 UI 更新
    if (this.onUpdate) this.updateState({});
  }

  public clearAttackLog(): void {
    this.attackLog = [];
    if (this.onUpdate) this.updateState({});
  }

  public showNotification(msg: string): void { this.setNotification(msg); }
}
