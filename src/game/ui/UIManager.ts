/**
 * 边境传说 - UI管理器
 */
import * as THREE from "three";
import { CombatLogEntry } from "../../types/combat";

export interface UIManagerState {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  level: number;
  gold: number;
  enemyCount: number;
  combatLog: CombatLogEntry[];
  combatLogMax: number;
}

export type StateChangeListener = (state: Partial<UIManagerState>) => void;

export class UIManager {
  private container: THREE.Object3D;
  private listeners: StateChangeListener[] = [];
  private currentState: Partial<UIManagerState> = {};

  constructor(camera: THREE.Camera) {
    this.container = new THREE.Object3D();
  }

  registerListener(listener: StateChangeListener): void {
    this.listeners.push(listener);
  }

  unregisterListener(listener: StateChangeListener): void {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  updateState(newState: Partial<UIManagerState>): void {
    this.currentState = { ...this.currentState, ...newState };
    for (const listener of this.listeners) {
      listener(newState);
    }
  }

  getState(): Partial<UIManagerState> {
    return { ...this.currentState };
  }

  getContainer(): THREE.Object3D {
    return this.container;
  }
}
