/**
 * 边境传说 — 输入处理器
 * 管理键盘输入、鼠标输入
 */
import { InputState } from '../types';
export declare class InputHandler {
    private keys;
    private mouse;
    private state;
    constructor();
    private bindEvents;
    private updateState;
    getState(): InputState;
    resetMouseDelta(): void;
    getMouseDelta(): {
        dx: number;
        dy: number;
    };
    isPointerLocked(): boolean;
    requestPointerLock(): void;
}
