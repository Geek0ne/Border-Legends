/**
 * 边境传说 - HUD 系统
 * 管理状态栏、等级、金币、任务、浮动文字、战斗日志
 */

import { HUDState, FloatingText, Quest } from '../../types';

export class HUDSystem {
  private state: HUDState = {
    hp: 100, maxHp: 100, mp: 50, maxMp: 50,
    xp: 0, xpToNext: 100, level: 1, gold: 0,
    enemyCount: 0, activeQuests: [], isCombat: false, isPaused: false, isMenuOpen: false,
  };
  private floatingTexts: FloatingText[] = [];
  private maxFloatingTexts = 20;
  private onUpdate?: (state: HUDState) => void;
  private onFloatingTextsUpdate?: (texts: FloatingText[]) => void;
  private notificationTimeout: number = 0;
  private notificationMsg: string | null = null;

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
  public setCombatState(combat: boolean): void { this.updateState({ isCombat: combat }); }
  public showNotification(msg: string): void { this.setNotification(msg); }
}