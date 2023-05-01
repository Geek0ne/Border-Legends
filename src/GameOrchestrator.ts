/**
 * 边境传说 - 游戏主控制器
 * 连接所有子系统并驱动游戏循环
 */

import * as THREE from 'three';
import { HUDSystem } from './game/hud/HUDSystem';
import { FloatingTextRenderer } from './game/hud/FloatingTextRenderer';
import { EnemyManager } from './game/enemies/EnemyManager';
import { EnemySpawner } from './game/enemies/EnemyFactory';
import { CollectibleSpawner } from './game/pickup/CollectibleSpawner';
import { ROCK_GIANT_DEF } from './data/enemies/EnemyDefs';
import { SkillManager } from './game/skills/SkillManager';
import { SKILL_DATABASE } from './game/skills/SkillDatabase';
import { SkillBarRenderer, SkillBarSlot } from './game/hud/SkillBarRenderer';
import { QuestManager } from './game/quest/QuestManager';
import { PickupSystem } from './game/pickup/PickupSystem';
import { SceneManager } from './game/scenes/SceneManager';
import { InventorySystem } from './systems/InventorySystem';
import { InputManager } from './input/InputManager';
import { AudioSystem } from './systems/AudioSystem';
import { AmbientAudio } from './game/audio/AmbientAudio';
import { CombatFeedback } from './game/effects/CombatFeedback';
import { MinimapRenderer, MinimapEntity } from './game/hud/MinimapRenderer';
import { QuestUpdateEvent, HUDState, FloatingText } from './types';
import { LootDrop } from './types/combat';

export class GameOrchestrator {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private clock: THREE.Clock;
  private animationId: number = 0;

  // 子系统
  private hud: HUDSystem;
  private floatingTextRenderer: FloatingTextRenderer;
  private enemyManager: EnemyManager;
  private enemySpawner: EnemySpawner;
  private collectibles: CollectibleSpawner;
  private skillManager: SkillManager = new SkillManager();
  private skillBar: SkillBarRenderer | null = null;
  private skillBarKeys: string[] = ['power_strike', 'whirlwind_strike', 'shield_bash', 'battle_cry'];
  private questManager: QuestManager;
  private pickupSystem: PickupSystem;
  private sceneManager: SceneManager;
  private inventorySystem: InventorySystem;
  private inputManager: InputManager;
  private audioSystem: AudioSystem;
  private ambientAudio: AmbientAudio = new AmbientAudio();
  private combatFeedback: CombatFeedback;
  private minimap: MinimapRenderer | null = null;
  private canvas2D: HTMLCanvasElement;

  // 状态
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private currentScene: THREE.Scene | null = null;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    canvas2D: HTMLCanvasElement,
  ) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.clock = new THREE.Clock();

    // 初始化子系统
    this.hud = new HUDSystem();
    this.floatingTextRenderer = new FloatingTextRenderer(canvas2D, canvas2D.width, canvas2D.height);
    this.floatingTextRenderer.setCamera(camera);

    this.enemyManager = new EnemyManager(this.hud);
    const heightAt = (x: number, z: number) => this.sampleGroundY(x, z);
    this.enemySpawner = new EnemySpawner(this.enemyManager, this.scene, { targetCount: 12, heightAt });
    this.collectibles = new CollectibleSpawner(this.scene, { count: 18, heightAt });
    // 山地关卡 Boss：岩巨人（固定刷新在东北高地）
    this.enemySpawner.spawnBoss(ROCK_GIANT_DEF, 42, -42);

    // 技能栏（数字键 1-4 释放）
    this.skillManager.batchRegisterSkills(
      this.skillBarKeys.map((id) => SKILL_DATABASE[id]).filter(Boolean)
    );
    for (const id of this.skillBarKeys) this.skillManager.learnSkill(id);
    const skillCanvas = document.createElement('canvas');
    this.skillBar = new SkillBarRenderer(skillCanvas, 384, 72);
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      const idx = ['Digit1', 'Digit2', 'Digit3', 'Digit4'].indexOf(e.code);
      if (idx >= 0 && this.skillBarKeys[idx]) this.castSkill(this.skillBarKeys[idx]);
    });
    this.inventorySystem = new InventorySystem(50);
    this.questManager = new QuestManager(this.hud, this.inventorySystem);
    this.pickupSystem = new PickupSystem();
    this.sceneManager = new SceneManager();
    this.inputManager = new InputManager();
    this.audioSystem = new AudioSystem();
    this.combatFeedback = new CombatFeedback(this.scene);

    // 小地图（离屏画布，合入 HUD 叠加层）
    this.canvas2D = canvas2D;
    const minimapCanvas = document.createElement('canvas');
    this.minimap = new MinimapRenderer(minimapCanvas, 180, 180);

    // 连接子系统事件
    this.hud.setOnFloatingTextsUpdate((texts: FloatingText[]) => {
      this.floatingTextRenderer.setTexts(texts);
    });

    this.pickupSystem.setOnPickup((drop: LootDrop) => {
      this.inventorySystem.addItem(drop.itemId);
      this.hud.showNotification('拾取: ' + drop.itemId);
    });

    this.hud.setOnUpdate((state: HUDState) => {
      this.updateHUD(state);
    });
  }

  /**
   * 启动游戏主循环
   */
  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.clock.start();
    this.animate();

    // 音频：主题 BGM + 环境音（首次用户手势后生效）
    this.audioSystem.playTheme('mountain');
    const engineCtx = (this.audioSystem as unknown as { engine?: { ctx?: AudioContext } }).engine?.ctx;
    if (engineCtx) {
      this.ambientAudio.start(engineCtx);
    } else {
      // 尚未初始化时，首次点击后补启环境音
      const boot = () => {
        this.audioSystem.playTheme('mountain');
        const ctx = (this.audioSystem as unknown as { engine?: { ctx?: AudioContext } }).engine?.ctx;
        if (ctx) this.ambientAudio.start(ctx);
        window.removeEventListener('pointerdown', boot);
      };
      window.addEventListener('pointerdown', boot, { once: true });
    }

    console.log('[GameOrchestrator] 游戏启动');
  }

  /**
   * 停止游戏
   */
  public stop(): void {
    this.isRunning = false;
    this.ambientAudio.stop();
    this.audioSystem.stopBgm();
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    console.log('[GameOrchestrator] 游戏停止');
  }

  /**
   * 游戏主循环
   */
  private animate = (): void => {
    if (!this.isRunning) return;
    this.animationId = requestAnimationFrame(this.animate);

    if (this.isPaused) return;

    const delta = Math.min(this.clock.getDelta(), 0.1); // 防跳帧
    const time = this.clock.getElapsedTime();

    this.tick(delta, time);
    this.render();
  };

  /**
   * 单帧更新
   */
  private tick(delta: number, time: number): void {
    // 处理输入
    const input = this.inputManager.poll();
    if (input) {
      this.handleInput(input, delta);
    }

    // 更新 HUD
    this.hud.tick(delta);

    const playerPos = this.getApproximatePlayerPosition();

    // 敌人 AI 行为（巡逻/警戒/追击/攻击/逃跑）
    if (playerPos) {
      this.enemyManager.updateAI(delta, playerPos, true);
    }
    this.enemyManager.tick(delta);
    this.enemySpawner.tick(delta, playerPos ?? null);

    // 敌人攻击 → 玩家受伤结算
    for (const mark of this.enemyManager.consumeAttackMarks()) {
      const st = this.hud.getState();
      const newHp = Math.max(0, st.hp - mark.amount);
      this.hud.updateState({ hp: newHp });
      this.hud.addFloatingText(`-${mark.amount}`, playerPos?.x ?? 0, playerPos?.z ?? 0, 0xff4444);
      this.combatFeedback.addShake(0.18, 0.2);
      this.audioSystem.playSfx('hit');
      if (newHp <= 0) {
        this.hud.updateState({ hp: st.maxHp });
        this.hud.clearCombo();
        this.hud.showNotification('你被击倒了……在营地复活');
      }
    }

    // 拾取物/特效
    this.pickupSystem.tick(delta);
    this.collectibles.tick(delta);
    this.combatFeedback.update(delta);
    this.combatFeedback.applyCameraShake(this.camera, delta);

    // 自动拾取
    if (playerPos) {
      this.pickupSystem.checkAutoPickup(playerPos);
    }

    // 检查任务目标
    this.questManager.checkObjectives();

    // 技能冷却 + MP 回复 + 技能栏状态
    this.skillManager.tickCooldowns(delta);
    const hudState = this.hud.getState();
    if (hudState.mp < hudState.maxMp) {
      this.hud.updateState({ mp: Math.min(hudState.maxMp, hudState.mp + delta * 2) });
    }
    if (this.skillBar) {
      const slots: SkillBarSlot[] = this.skillBarKeys.map((id, i) => {
        const skill = this.skillManager.getSkill(id);
        return {
          id,
          icon: skill?.icon ?? '⚔️',
          keyBind: String(i + 1),
          cooldown: this.skillManager.getCooldownRemaining(id),
          maxCooldown: skill?.cooldown ?? 1,
          isUsable: !!skill && !this.skillManager.isOnCooldown(id),
          isActive: false,
        };
      });
      this.skillBar.setSlots(slots);
      this.skillBar.tickCooldowns(delta);
    }

    // Boss 血条（存活即显示）
    const boss = this.enemyManager.getAliveEnemies().find((e) => e.def.type === 'boss');
    const bossBar = document.getElementById('boss-bar');
    const bossFill = document.getElementById('boss-hp-fill');
    const bossName = document.getElementById('boss-name');
    if (bossBar && bossFill) {
      if (boss) {
        bossBar.classList.remove('hidden');
        bossFill.style.width = Math.max(0, (boss.currentHp / boss.maxHp) * 100) + '%';
        if (bossName) bossName.textContent = boss.def.name;
      } else {
        bossBar.classList.add('hidden');
      }
    }

    // 小地图数据
    if (this.minimap && playerPos) {
      const dir = new THREE.Vector3();
      this.camera.getWorldDirection(dir);
      const angle = Math.atan2(dir.x, dir.z);
      const entities: MinimapEntity[] = [
        { x: playerPos.x, z: playerPos.z, type: 'player' },
        ...this.enemyManager.getEnemiesInRange(playerPos).map((e: any) => ({
          x: e.position.x, z: e.position.z, type: 'enemy' as const,
        })),
      ];
      this.minimap.setEntities(entities);
      this.minimap.setPlayerPosition(playerPos.x, playerPos.z, angle);
    }
  }

  /**
   * 渲染
   */
  private render(): void {
    // 主场景
    this.renderer.render(this.scene, this.camera);
    // 浮动文字层（通过 Canvas2D 渲染）
    this.floatingTextRenderer.render();
    // 小地图叠加到 HUD 右上角
    if (this.minimap) {
      const ctx2d = this.canvas2D.getContext('2d');
      if (ctx2d) {
        ctx2d.drawImage(this.minimap.getCanvas(), this.canvas2D.width - 196, 16);
      }
    }
    // 技能栏叠加到 HUD 底部居中
    if (this.skillBar) {
      const ctx2d = this.canvas2D.getContext('2d');
      if (ctx2d) {
        ctx2d.drawImage(
          this.skillBar.getCanvas(),
          (this.canvas2D.width - 384) / 2,
          this.canvas2D.height - 88
        );
      }
    }
  }

  /** 释放技能：消耗 MP，对范围内的敌人造成伤害 */
  private castSkill(skillId: string): void {
    const playerPos = this.getApproximatePlayerPosition();
    if (!playerPos) return;
    const st = this.hud.getState();
    const skill = this.skillManager.getSkill(skillId);
    if (!skill) return;
    const paid = this.skillManager.useSkill(skillId, st.mp, st.maxMp);
    if (paid === null) return;

    this.hud.updateState({ mp: Math.max(0, st.mp - paid) });
    this.audioSystem.playSfx('skill');
    this.hud.addFloatingText(skill.name, playerPos.x, playerPos.z, 0x66ccff);

    const radius = skill.areaOfEffect > 0 ? skill.areaOfEffect : 6;
    for (const enemy of this.enemyManager.getEnemiesInRange(playerPos)) {
      const d = Math.hypot(enemy.position.x - playerPos.x, enemy.position.z - playerPos.z);
      if (d > radius) continue;
      const damage = Math.max(
        1,
        Math.round(skill.damage.base + skill.damage.scaling * st.level - enemy.def.defense)
      );
      const killed = this.enemyManager.applyDamage(enemy, damage, this.hud);
      this.hud.addFloatingText(String(damage), enemy.position.x, enemy.position.z, 0x66ccff);
      this.combatFeedback.hit(
        new THREE.Vector3(enemy.position.x, 1.1, enemy.position.z), killed ? 1.4 : 0.9
      );
    }
  }

  /**
   * 处理输入事件
   */
  private handleInput(input: any, delta: number): void {
    // TODO: 将输入传递给玩家控制器
    if (input.attack) {
      this.performAttack();
    }
    if (input.interact) {
      this.attemptInteract();
    }
    if (input.inventory) {
      this.toggleInventory();
    }
    if (input.map) {
      this.toggleMap();
    }
    if (input.menu) {
      this.toggleMenu();
    }
  }

  /**
   * 攻击逻辑
   */
  private performAttack(): void {
    const playerPos = this.getApproximatePlayerPosition();
    if (!playerPos) return;

    this.audioSystem.playSfx('attack');
    const enemiesInRange = this.enemyManager.getEnemiesInRange(playerPos);
    let hitAny = false;
    for (const enemy of enemiesInRange) {
      const dx = enemy.position.x - playerPos.x;
      const dz = enemy.position.z - playerPos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist <= 5) {
        // 连击伤害倍率（每次命中 +4%，上限 +100%）
        const multiplier = this.hud.registerHit();
        const damage = Math.max(1, Math.round((10 - enemy.def.defense) * multiplier));
        const killed = this.enemyManager.applyDamage(enemy, damage, this.hud);
        this.hud.addFloatingText(damage.toString(), playerPos.x + dx, playerPos.z + dz, 0xffdd44);
        hitAny = true;

        // 里程碑连击提示
        const combo = this.hud.getCombo();
        if (combo > 1 && combo % 5 === 0) {
          this.hud.addFloatingText(`连击 x${combo}`, playerPos.x, playerPos.z, 0xff8833);
        }

        // 打击反馈：火花 + 斩击光环 + 震屏 + 命中音效
        const hitPoint = new THREE.Vector3(
          playerPos.x + dx * 0.7, 1.1, playerPos.z + dz * 0.7
        );
        this.combatFeedback.hit(hitPoint, killed ? 1.5 : 1);
        this.audioSystem.playSfx(killed ? 'death' : 'hit');

        if (killed) {
          // 获得经验
          this.hud.addXP(enemy.def.hp / 10);
          this.hud.addGold(Math.floor(enemy.def.hp / 20));
          this.hud.showNotification('消灭 ' + enemy.def.name);

          // 生成掉落物
          this.generateLoot(enemy);
        }
      }
    }
    if (hitAny) {
      this.hud.setCombatState(true);
    }
  }

  /**
   * 生成掉落物
   */
  private generateLoot(enemy: any): void {
    if (!enemy.def.drops || !enemy.def.drops.items) return;
    for (const drop of enemy.def.drops.items) {
      if (Math.random() < drop.chance) {
        const loot: LootDrop = {
          itemId: drop.itemId,
          itemName: drop.itemId,
          quantity: 1,
          rarity: 'common',
          quality: 'common',
          droppedAt: { x: enemy.position.x, z: enemy.position.z },
          timestamp: Date.now(),
        };
        this.pickupSystem.createPickup(loot, this.scene);
      }
    }
  }

  /**
   * 交互逻辑
   */
  private attemptInteract(): void {
    const playerPos = this.getApproximatePlayerPosition();
    if (!playerPos) return;

    // 采集
    const collectible = this.collectibles.findNearby(playerPos, 3.2);
    if (collectible) {
      this.collectibles.gather(collectible);
      this.inventorySystem.addItem(collectible.itemId);
      this.hud.addFloatingText('+' + collectible.name, playerPos.x, playerPos.z, 0x66ff99);
      this.audioSystem.playSfx('pickup');
      this.hud.showNotification('采集: ' + collectible.name);
      return;
    }

    // 检查附近的敌人
    const enemiesInRange = this.enemyManager.getEnemiesInRange(playerPos);
    for (const enemy of enemiesInRange) {
      const dx = enemy.position.x - playerPos.x;
      const dz = enemy.position.z - playerPos.z;
      if (Math.sqrt(dx * dx + dz * dz) <= 3) {
        this.hud.showNotification('与 ' + enemy.def.name + ' 交互');
        return;
      }
    }
  }

  /**
   * 获取玩家近似位置
   */
  private getApproximatePlayerPosition(): { x: number; z: number } | null {
    // 简化：从相机位置推断
    const pos = this.camera.position;
    return { x: pos.x, z: pos.z };
  }

  /** 射线采样地表高度（怪物/采集物贴地放置） */
  private sampleGroundY(x: number, z: number): number {
    const ray = new THREE.Raycaster(
      new THREE.Vector3(x, 60, z), new THREE.Vector3(0, -1, 0), 0.1, 120
    );
    const hits = ray.intersectObjects(this.scene.children, true);
    return hits.length > 0 ? hits[0].point.y : 0;
  }

  /**
   * 更新 HUD DOM 元素
   */
  private updateHUD(state: HUDState): void {
    // HP 条
    const hpBar = document.getElementById('hp-fill') as HTMLElement;
    if (hpBar) hpBar.style.width = (state.hp / state.maxHp * 100) + '%';
    const hpText = document.getElementById('hp-text') as HTMLElement;
    if (hpText) hpText.textContent = state.hp + '/' + state.maxHp;

    // MP 条
    const mpBar = document.getElementById('mp-fill') as HTMLElement;
    if (mpBar) mpBar.style.width = (state.mp / state.maxMp * 100) + '%';
    const mpText = document.getElementById('mp-text') as HTMLElement;
    if (mpText) mpText.textContent = state.mp + '/' + state.maxMp;

    // 等级
    const levelText = document.getElementById('level-text') as HTMLElement;
    if (levelText) levelText.textContent = 'Lv.' + state.level;

    // 经验条
    const xpBar = document.getElementById('xp-bar-fill') as HTMLElement;
    if (xpBar) xpBar.style.width = (state.xp / state.xpToNext * 100) + '%';

    // 金币
    const goldText = document.getElementById('gold-text') as HTMLElement;
    if (goldText) goldText.textContent = '金币: ' + state.gold;

    // 战斗状态
    const statusBars = document.getElementById('status-bars') as HTMLElement;
    if (statusBars) {
      statusBars.style.borderColor = state.isCombat ? '#e74c3c' : 'transparent';
    }
  }

  /**
   * 切换背包
   */
  private toggleInventory(): void {
    this.hud.setCombatState(!this.hud.getState().isCombat);
  }

  /**
   * 切换小地图
   */
  private toggleMap(): void {
    const minimap = document.getElementById('minimap');
    if (minimap) minimap.classList.toggle('hidden');
  }

  /**
   * 切换菜单
   */
  private toggleMenu(): void {
    this.hud.setCombatState(!this.hud.getState().isCombat);
  }

  // 快捷访问方法
  public getHUD(): HUDSystem { return this.hud; }
  public getEnemyManager(): EnemyManager { return this.enemyManager; }
  public getQuestManager(): QuestManager { return this.questManager; }
  public getPickupSystem(): PickupSystem { return this.pickupSystem; }
  public getSceneManager(): SceneManager { return this.sceneManager; }
  public getInventorySystem(): InventorySystem { return this.inventorySystem; }
  public getInputManager(): InputManager { return this.inputManager; }
  public getAudioSystem(): AudioSystem { return this.audioSystem; }
  public setPaused(p: boolean): void { this.isPaused = p; }
  public isGameRunning(): boolean { return this.isRunning; }
}
