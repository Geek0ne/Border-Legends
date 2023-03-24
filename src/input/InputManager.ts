/**
 * 边境传说 - 输入管理器
 * 处理键盘和鼠标输入，转换为游戏事件
 */

export interface InputState {
    keys: Set<string>;
    mousePos: { x: number; y: number };
    mouseButton: number;
    mousePressed: boolean;
    attack: boolean;
    interact: boolean;
    inventory: boolean;
    map: boolean;
    menu: boolean;
}

export class InputManager {
    private keys: Set<string> = new Set();
    private mousePos: { x: number; y: number } = { x: 0, y: 0 };
    private mouseButton: number = -1;
    private mousePressed: boolean = false;
    private pressedThisFrame: Set<string> = new Set();
    private mousePressedThisFrame: boolean = false;

    constructor() {
        this.bindEvents();
    }

    private bindEvents(): void {
        window.addEventListener('keydown', (e: KeyboardEvent) => {
            this.keys.add(e.code);
            this.pressedThisFrame.add(e.code);
            e.preventDefault();
        });

        window.addEventListener('keyup', (e: KeyboardEvent) => {
            this.keys.delete(e.code);
            e.preventDefault();
        });

        window.addEventListener('mousemove', (e: MouseEvent) => {
            this.mousePos = { x: e.clientX, y: e.clientY };
        });

        window.addEventListener('mousedown', (e: MouseEvent) => {
            this.mouseButton = e.button;
            this.mousePressed = true;
            this.mousePressedThisFrame = true;
        });

        window.addEventListener('mouseup', (e: MouseEvent) => {
            if (this.mouseButton === e.button) {
                this.mouseButton = -1;
                this.mousePressed = false;
            }
        });
    }

    public poll(): InputState | null {
        if (this.pressedThisFrame.size === 0 && !this.mousePressedThisFrame) {
            return null;
        }

        const state: InputState = {
            keys: new Set(this.keys),
            mousePos: { ...this.mousePos },
            mouseButton: this.mouseButton,
            mousePressed: this.mousePressed,
            attack: this.mousePressedThisFrame || this.keys.has('KeyZ') || this.keys.has('KeyX'),
            interact: this.pressedThisFrame.has('KeyE') || this.mousePressedThisFrame,
            inventory: this.pressedThisFrame.has('KeyI'),
            map: this.pressedThisFrame.has('KeyM'),
            menu: this.pressedThisFrame.has('KeyP') || this.pressedThisFrame.has('Escape'),
        };

        this.pressedThisFrame.clear();
        this.mousePressedThisFrame = false;
        return state;
    }

    public isKeyJustPressed(code: string): boolean {
        return this.pressedThisFrame.has(code);
    }

    public isMousePressed(): boolean {
        return this.mousePressedThisFrame;
    }

    public getMousePos(): { x: number; y: number } {
        return { ...this.mousePos };
    }
}
