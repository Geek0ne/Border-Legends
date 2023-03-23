/**
 * 边境传说 — 角色模型
 * 使用 Three.js 基本几何体构建角色（胶囊体 + 四肢）
 * 支持骨骼动画、朝向、伤害显示
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
export class CharacterModel {
  private root: THREE.Object3D;
  private body!: THREE.Mesh;
  private head!: THREE.Mesh;
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
    // ====== 身体 ======
    const bodyGeo = new THREE.CapsuleGeometry(0.3, 0.6, 4, 8);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x2c5f8a, // 蓝色外套
      roughness: 0.6,
      metalness: 0.1,
    });
    this.body = new THREE.Mesh(bodyGeo, bodyMat);
    this.body.position.y = 0.9;
    this.body.castShadow = true;
    this.root.add(this.body);
    // ====== 头部 ======
    const headGeo = new THREE.SphereGeometry(0.22, 12, 10);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0xffd4a3, // 肤色
      roughness: 0.7,
    });
    this.head = new THREE.Mesh(headGeo, headMat);
    this.head.position.y = 1.6;
    this.head.castShadow = true;
    this.root.add(this.head);
    // ====== 眼睛 ======
    const eyeGeo = new THREE.SphereGeometry(0.04, 8, 6);
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.3 });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.08, 1.63, 0.18);
    this.root.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.08, 1.63, 0.18);
    this.root.add(rightEye);
    // ====== 四肢组（用于动画）=====
    this.limbs = {
      leftArm: this.createLimb(0.07, 0.45, 0x2c5f8a),
      rightArm: this.createLimb(0.07, 0.45, 0x2c5f8a),
      leftLeg: this.createLimb(0.08, 0.5, 0x4a3728),
      rightLeg: this.createLimb(0.08, 0.5, 0x4a3728),
    };
    // 左臂位置
    this.limbs.leftArm.position.set(-0.4, 1.15, 0);
    this.limbs.leftArm.children[0].position.y = -0.22;
    this.root.add(this.limbs.leftArm);
    // 右臂（拿武器）
    this.limbs.rightArm.position.set(0.4, 1.15, 0);
    this.limbs.rightArm.children[0].position.y = -0.22;
    this.root.add(this.limbs.rightArm);
    // 左腿
    this.limbs.leftLeg.position.set(-0.15, 0.6, 0);
    this.limbs.leftLeg.children[0].position.y = -0.25;
    this.root.add(this.limbs.leftLeg);
    // 右腿
    this.limbs.rightLeg.position.set(0.15, 0.6, 0);
    this.limbs.rightLeg.children[0].position.y = -0.25;
    this.root.add(this.limbs.rightLeg);
    // ====== 武器（短剑）=====
    this.weapon = this.createWeapon();
    this.weapon.position.set(0, -0.5, 0.3);
    this.limbs.rightArm.add(this.weapon);
  }
  private createLimb(radius: number, length: number, color: number): THREE.Group {
    const group = new THREE.Group();
    const geo = new THREE.CylinderGeometry(radius * 0.8, radius, length, 8);
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.7,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    group.add(mesh);
    return group;
  }
  private createWeapon(): THREE.Group {
    // 剑身
    const bladeGeo = new THREE.BoxGeometry(0.04, 0.5, 0.01);
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0xccccdd,
      roughness: 0.2,
      metalness: 0.8,
    });
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.position.y = -0.25;
    // 护手
    const guardGeo = new THREE.BoxGeometry(0.12, 0.02, 0.04);
    const guardMat = new THREE.MeshStandardMaterial({
      color: 0xdaa520,
      roughness: 0.3,
      metalness: 0.6,
    });
    const guard = new THREE.Mesh(guardGeo, guardMat);
    // 剑柄
    const handleGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.1, 8);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x5a3a22, roughness: 0.8 });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.y = 0.05;
    const group = new THREE.Group();
    group.add(blade);
    group.add(guard);
    group.add(handle);
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
    }
  }
  private updateIdle(dt: number): void {
    const breathe = Math.sin(this.stateTime * 2) * 0.02;
    this.body.position.y = 0.9 + breathe;
    this.head.position.y = 1.6 + breathe * 1.5;
    this.root.rotation.y = THREE.MathUtils.lerp(this.root.rotation.y, this.targetYaw, 0.1);
  }
  private updateWalk(dt: number): void {
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
  private updateRun(dt: number): void {
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
  private updateSprint(dt: number): void {
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
  private updateRoll(dt: number): void {
    const duration = 0.6;
    const progress = Math.min(this.stateTime / duration, 1);
    const roll = progress * Math.PI * 2;
    this.root.rotation.x = roll;
    this.body.position.y = 0.9 * (1 - progress * 0.5);
  }
  private updateJump(dt: number): void {
    this.limbs.leftLeg.rotation.x = -0.3;
    this.limbs.rightLeg.rotation.x = -0.3;
    this.limbs.leftArm.rotation.x = -0.5;
    this.limbs.rightArm.rotation.x = -0.5;
    this.root.rotation.y = THREE.MathUtils.lerp(this.root.rotation.y, this.targetYaw, 0.05);
  }
  private updateAttack(dt: number): void {
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
