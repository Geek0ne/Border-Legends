/**
 * 边境传说 — 输入处理器
 * 管理键盘输入、鼠标输入
 */

import { InputState } from '../types';

export class InputHandler {
  private keys: Map<string, boolean> = new Map();
  private mouse: { x: number; y: number; dx: number; dy: number; buttons: number } = {
    x: 0,
    y: 0,
    dx: 0,
    dy: 0,
    buttons: 0,
  };
  private state: InputState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
    jump: false,
    attack: false,
    interact: false,
    menu: false,
  };

  constructor() {
    this.bindEvents();
    this.updateState();
  }

  private bindEvents(): void {
    window.addEventListener('keydown', (e) => {
      this.keys.set(e.code, true);
      this.updateState();
    });

    window.addEventListener('keyup', (e) => {
      this.keys.set(e.code, false);
      this.updateState();
    });

    window.addEventListener('mousemove', (e) => {
      this.mouse.dx = e.movementX || 0;
      this.mouse.dy = e.movementY || 0;
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    window.addEventListener('mousedown', (e) => {
      this.mouse.buttons |= (1 << e.button);
      this.updateState();
    });

    window.addEventListener('mouseup', (e) => {
      this.mouse.buttons &= ~(1 << e.button);
      this.updateState();
    });

    window.addEventListener('dblclick', () => {
      const canvas = document.getElementById('game-canvas');
      if (canvas && !document.pointerLockElement) {
        canvas.requestPointerLock();
      } else if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    });
  }

  private updateState(): void {
    this.state.forward = this.keys.has('KeyW') || this.keys.has('ArrowUp');
    this.state.backward = this.keys.has('KeyS') || this.keys.has('ArrowDown');
    this.state.left = this.keys.has('KeyA') || this.keys.has('ArrowLeft');
    this.state.right = this.keys.has('KeyD') || this.keys.has('ArrowRight');
    this.state.sprint = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    this.state.jump = this.keys.has('Space');
    this.state.attack = (this.mouse.buttons & 1) !== 0;
    this.state.interact = this.keys.has('KeyE');
    this.state.menu = this.keys.has('Escape') || this.keys.has('Tab');
  }

  public getState(): InputState {
    return { ...this.state };
  }

  public resetMouseDelta(): void {
    this.mouse.dx = 0;
    this.mouse.dy = 0;
  }

  public getMouseDelta(): { dx: number; dy: number } {
    return { dx: this.mouse.dx, dy: this.mouse.dy };
  }

  public isPointerLocked(): boolean {
    return document.pointerLockElement !== null;
  }

  public requestPointerLock(): void {
    const canvas = document.getElementById('game-canvas');
    if (canvas) {
      canvas.requestPointerLock();
    }
  }
}
