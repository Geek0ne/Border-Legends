/**
 * 边境传说 — 玩家控制器
 * 管理角色移动、跳跃、冲刺、翻滚等物理行为
 * 包含碰撞检测（地面、墙壁、障碍物）
 */

import * as THREE from 'three';
import { CharacterModel, CharacterState } from './CharacterModel';
import { InputState } from '../../types';
import { GroundDetector } from '../collision/GroundDetector';

export interface PlayerPhysics {
  velocity: THREE.Vector3;
  isGrounded: boolean;
  isJumping: boolean;
  isSprinting: boolean;
  isRolling: boolean;
}

export class PlayerController {
  private character: CharacterModel;
  private physics: PlayerPhysics;
  private groundDetector: GroundDetector | null = null;

  // 运动参数
  private walkSpeed: number = 3.0;
  private runSpeed: number = 6.0;
  private sprintSpeed: number = 10.0;
  private jumpForce: number = 8.0;
  private gravity: number = -20.0;
  private rollDuration: number = 0.6;
  private rollSpeed: number = 12.0;
  private friction: number = 0.85;
  private airFriction: number = 0.95;

  // 相机角度
  private cameraAngleY: number = 0;
  private cameraAngleX: number = 0;

  // 翻滚状态
  private rollTimer: number = 0;

  // 输入
  private currentInput: InputState = {
    forward: false, backward: false, left: false, right: false,
    sprint: false, jump: false, attack: false, interact: false, menu: false,
  };
  // 移动方向
  private moveDir: THREE.Vector3 = new THREE.Vector3();

  constructor(character: CharacterModel, groundDetector?: GroundDetector) {
    this.character = character;
    this.physics = {
      velocity: new THREE.Vector3(),
      isGrounded: true,
      isJumping: false,
      isSprinting: false,
      isRolling: false,
    };
    if (groundDetector) {
      this.groundDetector = groundDetector;
    }
  }

  /**
   * 更新玩家控制器
   */
  public update(delta: number, cameraForward: THREE.Vector3, cameraRight: THREE.Vector3): void {
    this.character.update(delta);
    this.updateMovement(delta, cameraForward, cameraRight);
    this.updatePhysics(delta);
    this.updateRoll(delta);
    this.updateAttack(delta);
    this.syncCharacter();
  }

  public setInput(input: InputState): void {
    this.currentInput = input;
  }

  /**
   * 处理移动
   */
  private updateMovement(delta: number, cameraForward: THREE.Vector3, cameraRight: THREE.Vector3): void {
    const pos = this.character.getPosition();
    let moveX = 0;
    let moveZ = 0;

    if (this.currentInput.forward) moveZ -= 1;
    if (this.currentInput.backward) moveZ += 1;
    if (this.currentInput.left) moveX -= 1;
    if (this.currentInput.right) moveX += 1;

    const moveLength = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (moveLength > 0) {
      moveX /= moveLength;
      moveZ /= moveLength;

      const moveDir = new THREE.Vector3();
      const forward = new THREE.Vector3().copy(cameraForward);
      forward.y = 0; forward.normalize();
      const right = new THREE.Vector3().copy(cameraRight);
      right.y = 0; right.normalize();

      moveDir.addScaledVector(forward, -moveZ);
      moveDir.addScaledVector(right, moveX);
      moveDir.normalize();

      // 计算目标朝向角
      const camAngle = this.cameraAngleY;
      const baseAngle = Math.atan2(forward.x, forward.z) + camAngle;
      const moveAngle = Math.atan2(moveDir.x, moveDir.z) + camAngle;

      let diff = moveAngle - baseAngle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;

      const rotSpeed = this.currentInput.sprint ? 8 : 10;
      const clampedDiff = THREE.MathUtils.clamp(diff, -rotSpeed * delta, rotSpeed * delta);
      this.character.setTargetYaw(baseAngle + clampedDiff);
    } else {
      // 无移动时，角色朝向相机前方
      const forward = new THREE.Vector3().copy(cameraForward);
      forward.y = 0; forward.normalize();
      this.character.setTargetYaw(Math.atan2(forward.x, forward.z) + this.cameraAngleY);
    }

    // 决定移动状态
    const isMoving = moveLength > 0;
    const isSprinting = this.currentInput.sprint && this.physics.isGrounded && isMoving;

    let speed: number;
    let newState: CharacterState;

    if (this.physics.isRolling) {
      speed = this.rollSpeed;
      newState = CharacterState.ROLL;
    } else if (isSprinting) {
      speed = this.sprintSpeed;
      newState = CharacterState.SPRINT;
    } else if (isMoving) {
      speed = this.currentInput.sprint ? this.runSpeed : this.walkSpeed;
      newState = speed > this.walkSpeed ? CharacterState.RUN : CharacterState.WALK;
    } else {
      speed = 0;
      newState = CharacterState.IDLE;
    }

    if (isMoving) {
      const moveVector = new THREE.Vector3(
        this.moveDir.x * speed,
        this.physics.velocity.y,
        this.moveDir.z * speed
      );
      this.physics.velocity.copy(moveVector);
    } else if (this.physics.isGrounded && !this.physics.isRolling) {
      this.physics.velocity.x *= this.friction;
      this.physics.velocity.z *= this.friction;
    }

    this.character.setState(newState);
  }

  /**
   * 处理物理（重力、跳跃）
   */
  private updatePhysics(delta: number): void {
    const pos = this.character.getPosition();

    // 地面检测
    if (this.groundDetector) {
      const groundHeight = this.groundDetector.getGroundHeight(pos);
      const minGroundY = groundHeight + this.character.getCollisionHeight() / 2 - 0.05;

      if (pos.y <= minGroundY) {
        pos.y = minGroundY;
        if (!this.physics.isGrounded) {
          this.physics.isJumping = false;
        }
        this.physics.isGrounded = true;
        this.physics.velocity.y = 0;
      } else {
        this.physics.isGrounded = false;
      }
    } else {
      // 无地面检测器时，假设地面高度为 0
      if (pos.y <= 0.05) {
        pos.y = 0;
        this.physics.isGrounded = true;
        this.physics.velocity.y = 0;
      } else {
        this.physics.isGrounded = false;
      }
    }

    // 重力
    if (!this.physics.isGrounded) {
      this.physics.velocity.y += this.gravity * delta;
    }

    // 跳跃
    if (this.currentInput.jump && this.physics.isGrounded && !this.physics.isRolling) {
      this.physics.velocity.y = this.jumpForce;
      this.physics.isGrounded = false;
      this.physics.isJumping = true;
      this.character.setState(CharacterState.JUMP);
    }

    // 更新位置
    pos.x += this.physics.velocity.x * delta;
    pos.y += this.physics.velocity.y * delta;
    pos.z += this.physics.velocity.z * delta;

    // 空中状态
    if (!this.physics.isGrounded && !this.physics.isJumping) {
      this.character.setState(this.physics.velocity.y < 0 ? CharacterState.FALL : CharacterState.JUMP);
    }

    // 空中摩擦
    if (!this.physics.isGrounded) {
      this.physics.velocity.x *= this.airFriction;
      this.physics.velocity.z *= this.airFriction;
    }
  }

  /**
   * 处理翻滚
   */
  private updateRoll(delta: number): void {
    if (this.currentInput.jump && this.physics.isGrounded && !this.physics.isRolling) {
      this.physics.isRolling = true;
      this.rollTimer = 0;
      this.physics.isGrounded = false;
      this.physics.velocity.y = 3;
      this.physics.velocity.x *= 2;
      this.physics.velocity.z *= 2;
      this.character.setState(CharacterState.ROLL);
    }

    if (this.physics.isRolling) {
      this.rollTimer += delta;
      if (this.rollTimer >= this.rollDuration) {
        this.physics.isRolling = false;
        this.physics.isGrounded = true;
        this.character.setState(CharacterState.IDLE);
      }
    }
  }

  /**
   * 处理攻击
   */
  private updateAttack(delta: number): void {
    if (this.currentInput.attack && this.character.getState() !== CharacterState.ATTACK) {
      this.character.setState(CharacterState.ATTACK);
      // 重置攻击计时器
      const model = this.character as any;
      model.stateTime = 0;
    }
  }

  /**
   * 同步角色旋转
   */
  private syncCharacter(): void {
    const root = this.character.getRoot();
    const targetYaw = this.character.getRoot().rotation.y;
    root.rotation.y = THREE.MathUtils.lerp(root.rotation.y, targetYaw, 0.15);
  }

  public setCameraAngle(angleY: number): void {
    this.cameraAngleY = angleY;
  }

  public getPhysics(): PlayerPhysics { return { ...this.physics }; }
  public getCharacter(): CharacterModel { return this.character; }
  public getCameraAngleY(): number { return this.cameraAngleY; }
  public getCameraAngleX(): number { return this.cameraAngleX; }
  public getCameraAngles(): { x: number; y: number } {
    return { x: this.cameraAngleX, y: this.cameraAngleY };
  }
}
