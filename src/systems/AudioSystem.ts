/**
 * 边境传说 - 音频系统
 * 管理背景音乐、音效、音量控制
 */

export interface AudioConfig {
    bgmVolume: number;
    sfxVolume: number;
    muted: boolean;
}

export class AudioSystem {
    private bgmVolume: number = 0.7;
    private sfxVolume: number = 0.8;
    private muted: boolean = false;
    private currentBgm: HTMLAudioElement | null = null;
    private sfxMap: Map<string, HTMLAudioElement> = new Map();

    public playBgm(url: string, loop: boolean = true): void {
        const audio = new Audio(url);
        audio.volume = this.muted ? 0 : this.bgmVolume;
        audio.loop = loop;
        audio.play().catch(() => {
            // Autoplay blocked, will play on user interaction
            console.log('[AudioSystem] BGM autoplay blocked');
        });
        this.currentBgm?.pause();
        this.currentBgm = audio;
    }

    public playSfx(sfxName: string): void {
        if (this.muted) return;
        const sfxPath = '/assets/sfx/' + sfxName + '.mp3';
        const audio = new Audio(sfxPath);
        audio.volume = this.sfxVolume;
        audio.play().catch(() => {});
    }

    public stopBgm(): void {
        this.currentBgm?.pause();
        this.currentBgm = null;
    }

    public setBgmVolume(volume: number): void {
        this.bgmVolume = Math.max(0, Math.min(1, volume));
        if (this.currentBgm) {
            this.currentBgm.volume = this.muted ? 0 : this.bgmVolume;
        }
    }

    public setSfxVolume(volume: number): void {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    }

    public toggleMute(): void {
        this.muted = !this.muted;
        if (this.currentBgm) {
            this.currentBgm.volume = this.muted ? 0 : this.bgmVolume;
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
