/**
 * 边境传说 - 音频系统（统一入口）
 * 薄封装层：内部委托 AudioEngine（程序化音效 + BGM 主题/交叉淡化）
 * 旧 API 完全兼容，修复了 SFX 指向不存在文件路径的问题
 */
import { AudioEngine, SoundType } from '../game/audio/AudioEngine';

export interface AudioConfig {
    bgmVolume: number;
    sfxVolume: number;
    muted: boolean;
}

const SFX_ALIASES: Record<string, SoundType> = {
    hit: 'hit', damage: 'hit', attack: 'attack', death: 'death', die: 'death',
    levelup: 'levelup', level_up: 'levelup', drop: 'drop', pickup: 'pickup',
    skill: 'skill', menu: 'menu', click: 'menu', door: 'door', coin: 'coin',
    explosion: 'explosion', spawn: 'spawn',
};

export class AudioSystem {
    private engine: AudioEngine = new AudioEngine();
    private bgmVolume: number = 0.7;
    private sfxVolume: number = 0.8;
    private muted: boolean = false;
    private initialized: boolean = false;

    /** 确保 Web Audio 就绪（浏览器要求用户手势后才能出声） */
    private ensureInitialized(): AudioEngine | null {
        if (!this.initialized) {
            this.engine.initialize();
            this.initialized = true;
        }
        // 首次手势后 resume（Chrome 自动播放策略）
        const ctx = (this.engine as unknown as { ctx?: AudioContext }).ctx;
        if (ctx && ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }
        return this.engine;
    }

    /** 播放 BGM 文件（兼容旧接口） */
    public playBgm(url: string, loop: boolean = true): void {
        const engine = this.ensureInitialized();
        if (!engine) return;
        void loop;
        engine.playBGM(url, this.bgmVolume);
    }

    /** 播放主题 BGM（自动映射曲库，曲目切换时交叉淡化） */
    public playTheme(theme: string): void {
        const engine = this.ensureInitialized();
        if (!engine) return;
        engine.playTheme(theme, this.bgmVolume);
    }

    /** 播放音效（程序化合成，无需音频文件） */
    public playSfx(sfxName: string): void {
        if (this.muted) return;
        const engine = this.ensureInitialized();
        if (!engine) return;
        const type = SFX_ALIASES[sfxName] ?? 'menu';
        engine.playSound(type);
    }

    public stopBgm(): void {
        this.engine.stopBGM();
    }

    public setBgmVolume(volume: number): void {
        this.bgmVolume = Math.max(0, Math.min(1, volume));
    }

    public setSfxVolume(volume: number): void {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    }

    public toggleMute(): void {
        this.muted = !this.muted;
        if (this.muted) {
            this.engine.stopBGM();
        }
    }

    public isMuted(): boolean {
        return this.muted;
    }

    public getAudioConfig(): AudioConfig {
        return {
            bgmVolume: this.bgmVolume,
            sfxVolume: this.sfxVolume,
            muted: this.muted,
        };
    }
}
