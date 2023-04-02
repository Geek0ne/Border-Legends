/**
 * 边境传说 — 角色模型
 * 高细节程序化角色：分层护甲 / 头发五官 / 披风 / 金属武器
 * 支持骨骼动画、朝向、伤害显示（公开接口与旧版一致）
 */
import * as THREE from 'three';

export enum CharacterState {
  IDLE = 'idle',
  WALK = 'walk',
  RUN = 'run',
  SPRINT = 'sprint',
  JUMP = 'jump',
  FALL = 'fall',
  ROLL = 'roll',
  ATTACK = 'attack',
  HIT = 'hit',
  DEAD = 'dead',
}

/** 常用材质（带金属质感的护甲 / 皮革 / 布料） */
const MATS = {
  armor: new THREE.MeshStandardMaterial({ color: 0x2e5f92, roughness: 0.42, metalness: 0.55 }),
  armorDark: new THREE.MeshStandardMaterial({ color: 0x1d3c5e, roughness: 0.5, metalness: 0.5 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xd8a842, roughness: 0.32, metalness: 0.85 }),
  leather: new THREE.MeshStandardMaterial({ color: 0x6b4a2c, roughness: 0.85, metalness: 0.05 }),
  cloth: new THREE.MeshStandardMaterial({ color: 0x8c2f39, roughness: 0.95, metalness: 0, side: THREE.DoubleSide }),
  skin: new THREE.MeshStandardMaterial({ color: 0xf0c896, roughness: 0.62, metalness: 0 }),
  hair: new THREE.MeshStandardMaterial({ color: 0x3a2a1c, roughness: 0.8, metalness: 0.05 }),
  steel: new THREE.MeshStandardMaterial({ color: 0xc9ccd6, roughness: 0.22, metalness: 0.9 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x1a1a22, roughness: 0.35, metalness: 0.2 }),
};

export class CharacterModel {
  private root: THREE.Group;
  private body!: THREE.Group;
  private head!: THREE.Group;
  private cape: THREE.Mesh | null = null;
  private limbs: {
    leftArm: THREE.Group;
    rightArm: THREE.Group;
    leftLeg: THREE.Group;
    rightLeg: THREE.Group;
  } = { leftArm: new THREE.Group(), rightArm: new THREE.Group(), leftLeg: new THREE.Group(), rightLeg: new THREE.Group() };
  private weapon: THREE.Group | null = null;
  // 动画状态
  private state: CharacterState = CharacterState.IDLE;
  private animTime: number = 0;
  private stateTime: number = 0;
  // 朝向
  private yaw: number = 0;
  private targetYaw: number = 0;
  // 碰撞体
  private collisionRadius: number = 0.5;
  private collisionHeight: number = 1.8;

  constructor() {
    this.root = new THREE.Group();
    this.buildModel();
    this.setupColors();
  }

  private buildModel(): void {
    // ====== 躯干（锚点 y=0.9，动画整体起伏） ======
    this.body = new THREE.Group();
    this.body.position.y = 0.9;
    this.root.add(this.body);

    // 内衬躯干（锥台）
    const torsoGeo = new THREE.CylinderGeometry(0.24, 0.19, 0.62, 10);
    const torso = new THREE.Mesh(torsoGeo, MATS.armorDark);
    torso.castShadow = true;
    this.body.add(torso);

    // 胸甲（前后两片，略鼓）
    const chestGeo = new THREE.CylinderGeometry(0.285, 0.235, 0.42, 10);
    const chest = new THREE.Mesh(chestGeo, MATS.armor);
    chest.position.y = 0.07;
    chest.scale.z = 0.82;
    chest.castShadow = true;
    this.body.add(chest);

    // 胸口金色纹饰（斜十字带）
    for (const rot of [0.7, -0.7]) {
      const strap = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.055, 0.02), MATS.gold);
      strap.position.set(0, 0.08, 0.2);
      strap.rotation.z = rot;
      this.body.add(strap);
    }

    // 肩甲上缘（连接臂部）
    const collarGeo = new THREE.CylinderGeometry(0.3, 0.29, 0.09, 10);
    const collar = new THREE.Mesh(collarGeo, MATS.gold);
    collar.position.y = 0.32;
    this.body.add(collar);

    // 腰带 + 带扣
    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.215, 0.215, 0.11, 10), MATS.leather);
    belt.position.y = -0.3;
    this.body.add(belt);
    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.08, 0.03), MATS.gold);
    buckle.position.set(0, -0.3, 0.2);
    this.body.add(buckle);

    // 战裙（裙甲两片）
    for (const sx of [-1, 1]) {
      const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.34, 0.05), MATS.armorDark);
      skirt.position.set(sx * 0.12, -0.5, 0.12);
      skirt.rotation.z = sx * -0.12;
      skirt.rotation.x = -0.12;
      skirt.castShadow = true;
      this.body.add(skirt);
    }

    // ====== 披风（挂在躯干，行走时摆动） ======
    const capeGeo = new THREE.PlaneGeometry(0.62, 0.95, 4, 6);
    // 下摆微扩
    const cpos = capeGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < cpos.count; i++) {
      const y = cpos.getY(i);
      cpos.setX(i, cpos.getX(i) * (1 + (-y) * 0.22));
      cpos.setZ(i, Math.cos(cpos.getX(i) * 4) * 0.045);
    }
    capeGeo.computeVertexNormals();
    this.cape = new THREE.Mesh(capeGeo, MATS.cloth);
    this.cape.position.set(0, 0.12, -0.27);
    this.cape.rotation.x = 0.12;
    this.cape.castShadow = true;
    this.body.add(this.cape);

    // ====== 头部（锚点 y=1.6） ======
    this.head = new THREE.Group();
    this.head.position.y = 1.6;
    this.root.add(this.head);

    // 颈
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.1, 0.12, 8), MATS.skin);
    neck.position.y = -0.18;
    this.head.add(neck);

    // 头颅
    const skullGeo = new THREE.SphereGeometry(0.21, 14, 12);
    const skull = new THREE.Mesh(skullGeo, MATS.skin);
    skull.scale.set(0.92, 1.08, 0.98);
    skull.castShadow = true;
    this.head.add(skull);

    // 头发（顶壳 + 后枕 + 刘海）
    const hairTop = new THREE.Mesh(new THREE.SphereGeometry(0.225, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), MATS.hair);
    hairTop.position.y = 0.035;
    hairTop.scale.set(0.95, 1.05, 1.02);
    hairTop.castShadow = true;
    this.head.add(hairTop);
    const hairBack = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), MATS.hair);
    hairBack.position.set(0, -0.02, -0.09);
    hairBack.scale.set(1, 1.25, 0.8);
    this.head.add(hairBack);
    const fringe = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.075, 0.1), MATS.hair);
    fringe.position.set(0, 0.135, 0.165);
    fringe.rotation.x = 0.35;
    this.head.add(fringe);

    // 眼睛（眼白 + 瞳孔）
    for (const sx of [-1, 1]) {
      const white = new THREE.Mesh(new THREE.SphereGeometry(0.042, 8, 6), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 }));
      white.position.set(sx * 0.082, 0.015, 0.178);
      white.scale.set(1, 1.15, 0.6);
      this.head.add(white);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.021, 8, 6), MATS.dark);
      pupil.position.set(sx * 0.082, 0.012, 0.207);
      this.head.add(pupil);
      // 眉毛
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.018, 0.02), MATS.hair);
      brow.position.set(sx * 0.085, 0.075, 0.185);
      brow.rotation.z = sx * -0.16;
      this.head.add(brow);
    }
    // 鼻与嘴
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.06, 6), MATS.skin);
    nose.position.set(0, -0.025, 0.205);
    nose.rotation.x = Math.PI * 0.52;
    this.head.add(nose);
    const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.012, 0.012), new THREE.MeshStandardMaterial({ color: 0xa5654f, roughness: 0.8 }));
    mouth.position.set(0, -0.095, 0.183);
    this.head.add(mouth);

    // ====== 四肢（锚点保持旧版动画坐标） ======
    this.limbs.leftArm = this.createArm();
    this.limbs.rightArm = this.createArm();
    this.limbs.leftLeg = this.createLeg();
    this.limbs.rightLeg = this.createLeg();

    this.limbs.leftArm.position.set(-0.4, 1.15, 0);
    this.limbs.rightArm.position.set(0.4, 1.15, 0);
    this.limbs.leftLeg.position.set(-0.15, 0.6, 0);
    this.limbs.rightLeg.position.set(0.15, 0.6, 0);
    this.root.add(this.limbs.leftArm, this.limbs.rightArm, this.limbs.leftLeg, this.limbs.rightLeg);

    // ====== 武器（双手剑） ======
    this.weapon = this.createWeapon();
    this.weapon.position.set(0, -0.5, 0.3);
    this.limbs.rightArm.add(this.weapon);
  }

  /** 手臂：肩甲 + 上臂 + 护腕 + 手 */
  private createArm(): THREE.Group {
    const group = new THREE.Group();

    const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.075, 0.3, 8), MATS.armorDark);
    upper.position.y = -0.16;
    upper.castShadow = true;
    group.add(upper);

    // 肩甲（半球扣在肩上）
    const pauldron = new THREE.Mesh(new THREE.SphereGeometry(0.125, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), MATS.armor);
    pauldron.position.y = -0.015;
    pauldron.rotation.x = Math.PI;
    pauldron.castShadow = true;
    group.add(pauldron);
    const trim = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.016, 6, 12), MATS.gold);
    trim.position.y = -0.055;
    trim.rotation.x = Math.PI * 0.5;
    group.add(trim);

    // 前臂 + 护腕
    const fore = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.058, 0.26, 8), MATS.leather);
    fore.position.y = -0.42;
    fore.castShadow = true;
    group.add(fore);
    const bracer = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.058, 0.12, 8), MATS.armor);
    bracer.position.y = -0.48;
    group.add(bracer);

    // 手
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.062, 8, 6), MATS.leather);
    hand.position.y = -0.585;
    hand.scale.y = 1.25;
    group.add(hand);

    return group;
  }

  /** 腿：大腿 + 护膝 + 小腿 + 靴子 */
  private createLeg(): THREE.Group {
    const group = new THREE.Group();

    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.095, 0.3, 8), MATS.armorDark);
    thigh.position.y = -0.16;
    thigh.castShadow = true;
    group.add(thigh);

    const knee = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 6), MATS.armor);
    knee.position.set(0, -0.32, 0.02);
    group.add(knee);

    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.075, 0.26, 8), MATS.leather);
    shin.position.y = -0.46;
    shin.castShadow = true;
    group.add(shin);

    // 靴子（筒 + 鞋头）
    const boot = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.088, 0.16, 8), MATS.dark);
    boot.position.y = -0.62;
    boot.castShadow = true;
    group.add(boot);
    const toe = new THREE.Mesh(new THREE.BoxGeometry(0.125, 0.075, 0.16), MATS.dark);
    toe.position.set(0, -0.675, 0.055);
    toe.castShadow = true;
    group.add(toe);

    return group;
  }

  /** 武器：精工长剑（刃/尖/护手/缠柄/配重球） */
  private createWeapon(): THREE.Group {
    const group = new THREE.Group();

    // 剑刃（渐窄）
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.58, 0.016), MATS.steel);
    blade.position.y = -0.32;
    blade.castShadow = true;
    group.add(blade);
    // 血槽
    const fuller = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.5, 0.018), MATS.dark);
    fuller.position.y = -0.32;
    group.add(fuller);
    // 剑尖（四棱锥）
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0, 0.038, 0.12, 4), MATS.steel);
    tip.position.y = -0.67;
    tip.rotation.y = Math.PI * 0.25;
    tip.castShadow = true;
    group.add(tip);

    // 弧形护手
    const guardArc = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.017, 6, 14, Math.PI), MATS.gold);
    guardArc.position.y = -0.035;
    guardArc.rotation.x = Math.PI * 0.5;
    group.add(guardArc);
    const guardBlock = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.028, 0.048), MATS.gold);
    group.add(guardBlock);

    // 缠柄
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.019, 0.12, 8), MATS.leather);
    handle.position.y = 0.075;
    group.add(handle);
    for (let i = 0; i < 3; i++) {
      const wrap = new THREE.Mesh(new THREE.TorusGeometry(0.019, 0.006, 5, 10), MATS.gold);
      wrap.position.y = 0.035 + i * 0.038;
      wrap.rotation.x = Math.PI * 0.5;
      group.add(wrap);
    }

    // 配重球
    const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), MATS.gold);
    pommel.position.y = 0.155;
    group.add(pommel);

    return group;
  }

  private setupColors(): void {
    this.root.rotation.y = 0;
    this.yaw = 0;
  }

  /**
   * 更新角色动画
   */
  public update(delta: number): void {
    this.stateTime += delta;
    this.animTime += delta;

    // 披风随状态摆动
    if (this.cape) {
      const speedFactor =
        this.state === CharacterState.SPRINT ? 1.0 :
        this.state === CharacterState.RUN ? 0.7 :
        this.state === CharacterState.WALK ? 0.4 : 0.12;
      this.cape.rotation.x = 0.12 + speedFactor * 0.35 + Math.sin(this.animTime * 5) * 0.06 * speedFactor;
    }

    switch (this.state) {
      case CharacterState.IDLE:
        this.updateIdle(delta);
        break;
      case CharacterState.WALK:
        this.updateWalk(delta);
        break;
      case CharacterState.RUN:
        this.updateRun(delta);
        break;
      case CharacterState.SPRINT:
        this.updateSprint(delta);
        break;
      case CharacterState.ROLL:
        this.updateRoll(delta);
        break;
      case CharacterState.JUMP:
      case CharacterState.FALL:
        this.updateJump(delta);
        break;
      case CharacterState.ATTACK:
        this.updateAttack(delta);
        break;
      case CharacterState.HIT:
      case CharacterState.DEAD:
        break;
    }
  }

  private updateIdle(_dt: number): void {
    const breathe = Math.sin(this.stateTime * 2) * 0.02;
    this.body.position.y = 0.9 + breathe;
    this.head.position.y = 1.6 + breathe * 1.5;
    this.root.rotation.y = THREE.MathUtils.lerp(this.root.rotation.y, this.targetYaw, 0.1);
  }

  private updateWalk(_dt: number): void {
    const speed = 4;
    const swing = Math.sin(this.stateTime * speed) * 0.5;
    this.limbs.leftArm.rotation.x = swing;
    this.limbs.rightArm.rotation.x = -swing;
    this.limbs.leftLeg.rotation.x = -swing * 0.7;
    this.limbs.rightLeg.rotation.x = swing * 0.7;
    this.body.position.y = 0.9 + Math.abs(Math.sin(this.stateTime * speed)) * 0.03;
    this.head.position.y = 1.6 + Math.abs(Math.sin(this.stateTime * speed)) * 0.045;
    this.root.rotation.y = THREE.MathUtils.lerp(this.root.rotation.y, this.targetYaw, 0.1);
  }

  private updateRun(_dt: number): void {
    const speed = 7;
    const swing = Math.sin(this.stateTime * speed) * 0.7;
    this.limbs.leftArm.rotation.x = swing;
    this.limbs.rightArm.rotation.x = -swing;
    this.limbs.leftLeg.rotation.x = -swing * 0.8;
    this.limbs.rightLeg.rotation.x = swing * 0.8;
    this.body.position.y = 0.9 + Math.abs(Math.sin(this.stateTime * speed)) * 0.06;
    this.head.position.y = 1.6 + Math.abs(Math.sin(this.stateTime * speed)) * 0.09;
    const tilt = THREE.MathUtils.lerp(this.body.rotation.x, 0.15, 0.1);
    this.body.rotation.x = tilt;
    this.root.rotation.y = THREE.MathUtils.lerp(this.root.rotation.y, this.targetYaw, 0.12);
  }

  private updateSprint(_dt: number): void {
    const speed = 10;
    const swing = Math.sin(this.stateTime * speed) * 0.9;
    this.limbs.leftArm.rotation.x = swing;
    this.limbs.rightArm.rotation.x = -swing;
    this.limbs.leftLeg.rotation.x = -swing * 0.9;
    this.limbs.rightLeg.rotation.x = swing * 0.9;
    this.body.position.y = 0.9 + Math.abs(Math.sin(this.stateTime * speed)) * 0.08;
    this.head.position.y = 1.6 + Math.abs(Math.sin(this.stateTime * speed)) * 0.12;
    this.body.rotation.x = THREE.MathUtils.lerp(this.body.rotation.x, 0.25, 0.1);
    this.root.rotation.y = THREE.MathUtils.lerp(this.root.rotation.y, this.targetYaw, 0.15);
  }

  private updateRoll(_dt: number): void {
    const duration = 0.6;
    const progress = Math.min(this.stateTime / duration, 1);
    const roll = progress * Math.PI * 2;
    this.root.rotation.x = roll;
    this.body.position.y = 0.9 * (1 - progress * 0.5);
  }

  private updateJump(_dt: number): void {
    this.limbs.leftLeg.rotation.x = -0.3;
    this.limbs.rightLeg.rotation.x = -0.3;
    this.limbs.leftArm.rotation.x = -0.5;
    this.limbs.rightArm.rotation.x = -0.5;
    this.root.rotation.y = THREE.MathUtils.lerp(this.root.rotation.y, this.targetYaw, 0.05);
  }

  private updateAttack(_dt: number): void {
    const duration = 0.4;
    const progress = Math.min(this.stateTime / duration, 1);
    const swingAngle = Math.sin(progress * Math.PI) * 2.5;
    this.limbs.rightArm.rotation.x = -swingAngle;
    this.limbs.rightArm.rotation.z = swingAngle * 0.5;
    this.limbs.leftArm.rotation.x = -0.3;
    this.root.rotation.y = THREE.MathUtils.lerp(this.root.rotation.y, this.targetYaw, 0.2);
  }

  public setTargetYaw(yaw: number): void {
    this.targetYaw = yaw;
  }
  public getTargetYaw(): number {
    return this.targetYaw;
  }
  public resetStateTime(): void {
    this.stateTime = 0;
  }
  public setState(state: CharacterState): void {
    if (this.state !== state) {
      this.state = state;
      this.stateTime = 0;
      switch (state) {
        case CharacterState.IDLE:
        case CharacterState.WALK:
        case CharacterState.RUN:
        case CharacterState.SPRINT:
          this.limbs.leftArm.rotation.x = 0;
          this.limbs.rightArm.rotation.x = 0;
          this.limbs.leftLeg.rotation.x = 0;
          this.limbs.rightLeg.rotation.x = 0;
          this.body.rotation.x = 0;
          break;
        case CharacterState.ROLL:
          this.root.rotation.x = 0;
          break;
        default:
          break;
      }
    }
  }
  public isAttackActive(): boolean {
    if (this.state === CharacterState.ATTACK && this.stateTime < 0.4) {
      return this.stateTime >= 0.1 && this.stateTime <= 0.25;
    }
    return false;
  }
  public getAttackRange(): { origin: THREE.Vector3; direction: THREE.Vector3; radius: number; angle: number } {
    const origin = new THREE.Vector3();
    this.root.getWorldPosition(origin);
    origin.y += 1;
    const direction = new THREE.Vector3(0, 0, 1);
    direction.applyQuaternion(this.root.quaternion);
    return { origin, direction, radius: 2.0, angle: Math.PI / 3 };
  }
  public getRoot(): THREE.Object3D { return this.root; }
  public getPosition(): THREE.Vector3 { return this.root.position; }
  public getCollisionRadius(): number { return this.collisionRadius; }
  public getCollisionHeight(): number { return this.collisionHeight; }
  public getState(): CharacterState { return this.state; }
  public getWeapon(): THREE.Object3D { return this.weapon!; }
  public getRotation(): { y: number; setYaw(yaw: number): void } {
    return {
      y: this.root.rotation.y,
      setYaw: (yaw: number) => { this.targetYaw = yaw; },
    };
  }
}
