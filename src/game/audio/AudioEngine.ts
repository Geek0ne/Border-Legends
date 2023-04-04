/**
 * 边境传说 — 改进版音频引擎 (Web Audio API)
 * 支持：程序化音效生成、空间音频、BGM 混音、音量控制、淡入淡出
 */

export type SoundType =
  | 'hit' | 'death' | 'levelup' | 'drop' | 'pickup'
  | 'skill' | 'menu' | 'door' | 'coin' | 'explosion' | 'spawn' | 'attack';

export interface SoundConfig {
  frequency: number;
  duration: number;
  type: 'sine' | 'square' | 'sawtooth' | 'triangle';
  volume: number;
  pitch: number;
  distance: number;
  loop: boolean;
}

export interface BGMConfig {
  id: string;
  name: string;
  url: string;
  volume: number;
  loop: boolean;
}

// 程序化音效定义
export const PROCEDURAL_SOUNDS: Record<SoundType, (ctx: AudioContext) => void> = {
  hit: (ctx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  },

  death: (ctx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  },

  levelup: (ctx) => {
    // 上升音阶
    const notes = [440, 554, 659, 880];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.1 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.1);
      osc.stop(ctx.currentTime + i * 0.1 + 0.3);
    });
  },

  pickup: (ctx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  },

  coin: (ctx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.setValueAtTime(1600, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  },

  menu: (ctx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  },

  door: (ctx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  },

  skill: (ctx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.2);
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.3);
    filter.Q.value = 5;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.connect(filter).connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  },

  drop: (ctx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  },

  explosion: (ctx) => {
    const bufferSize = ctx.sampleRate * 0.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    source.connect(gain).connect(ctx.destination);
    source.start();
  },
  spawn: (ctx) => {
    const bufferSize = ctx.sampleRate * 0.3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.sin(i / ctx.sampleRate * Math.PI * 2 * 800) * Math.pow(1 - i / bufferSize, 2);
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    source.connect(gain).connect(ctx.destination);
    source.start();
  },
  attack: (ctx) => {
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.sin(i / ctx.sampleRate * Math.PI * 2 * 200) * Math.pow(1 - i / bufferSize, 1.5);
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.6, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    source.connect(gain).connect(ctx.destination);
    source.start();
  },
};

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterVolume: number = 1.0;
  private soundVolume: number = 0.8;
  private bgmVolume: number = 0.5;
  private muted: boolean = false;
  private isInitialized: boolean = false;

  // BGM
  private currentBGM: HTMLAudioElement | null = null;
  private bgmGainNode: GainNode | null = null;

  // 音效缓存
  private soundMap: Record<SoundType, (ctx: AudioContext) => void> = PROCEDURAL_SOUNDS;

  // 事件
  private onVolumeChange?: (volume: number) => void;

  /**
   * 初始化 Web Audio API
   */
  initialize(): void {
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.isInitialized = true;
      console.log('[AudioEngine] Web Audio API initialized');
    } catch (e) {
      console.warn('[AudioEngine] Web Audio API not supported');
    }
  }

  /**
   * 播放程序化音效
   */

  /**
   * 播放音效（别名，兼容 EnemyManager 的调用方式）
   */
  play(type: SoundType): void {
    this.playSound(type);
  }
  playSound(type: SoundType): void {
    if (!this.isInitialized || this.muted || !this.ctx) return;

    const volume = this.soundVolume * this.masterVolume;
    if (volume <= 0) return;

    const synth = this.soundMap[type];
    if (synth) {
      synth(this.ctx);
    }
  }

  /**
   * 播放 BGM
   */
  playBGM(url: string, volume: number = 0.5): void {
    if (!this.isInitialized || !this.ctx) return;

    // 停止当前 BGM
    this.stopBGM();

    const audio = new Audio(url);
    audio.loop = true;
    audio.volume = volume * this.bgmVolume * this.masterVolume;

    // 淡入效果
    audio.addEventListener('canplaythrough', () => {
      audio.play().catch(() => {});
    });

    this.currentBGM = audio;
    console.log('[AudioEngine] BGM playing:', url);
  }

  /**
   * 停止 BGM（带淡出效果）
   */
  stopBGM(): void {
    if (this.currentBGM) {
      this.currentBGM.pause();
      this.currentBGM = null;
      console.log('[AudioEngine] BGM stopped');
    }
  }

  /**
   * 切换 BGM（真实交叉淡入淡出）
   * 旧曲淡出 → 停止；新曲从 0 淡入到目标音量
   */
  crossfadeBGM(newUrl: string, duration: number = 2): void {
    if (!this.currentBGM) {
      this.playBGM(newUrl);
      return;
    }

    const oldAudio = this.currentBGM;
    const targetVolume = this.bgmVolume * this.masterVolume;
    const steps = 20;
    const stepMs = (duration * 1000) / steps;
    const startVolume = oldAudio.volume;

    // 旧曲淡出
    let i = 0;
    const fadeOut = window.setInterval(() => {
      i++;
      const k = i / steps;
      oldAudio.volume = Math.max(0, startVolume * (1 - k));
      if (i >= steps) {
        window.clearInterval(fadeOut);
        oldAudio.pause();
      }
    }, stepMs);

    // 新曲淡入（重置状态，避免与旧曲重叠过响）
    this.currentBGM = null;
    const audio = new Audio(newUrl);
    audio.loop = true;
    audio.volume = 0;
    audio.addEventListener('canplaythrough', () => {
      audio.play().catch(() => {});
      let j = 0;
      const fadeIn = window.setInterval(() => {
        j++;
        audio.volume = Math.min(targetVolume, targetVolume * (j / steps));
        if (j >= steps) window.clearInterval(fadeIn);
      }, stepMs);
    }, { once: true });
    this.currentBGM = audio;
  }

  /**
   * 按主题播放 BGM（带资源映射，文件缺失时静默降级）
   */
  playTheme(theme: string, volume: number = 0.5): void {
    const tracks: Record<string, string> = {
      mountain: '/assets/audio/meadow_thoughts.ogg',
      jungle: '/assets/audio/happy_adventure.mp3',
      city: '/assets/audio/meadow_thoughts.ogg',
    };
    const url = tracks[theme];
    if (!url) return;
    if (!this.currentBGM) {
      this.playBGM(url, volume);
    } else {
      this.crossfadeBGM(url, 2);
    }
  }

  /**
   * 暂停/恢复
   */
  pauseAll(): void {
    if (this.ctx?.state === 'running') {
      this.ctx.suspend();
    }
    this.currentBGM?.pause();
  }

  resumeAll(): void {
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
    this.currentBGM?.play().catch(() => {});
  }

  /**
   * 获取状态
   */
  getStatus(): {
    muted: boolean;
    masterVolume: number;
    soundVolume: number;
    bgmVolume: number;
    isPlaying: boolean;
  } {
    return {
      muted: this.muted,
      masterVolume: this.masterVolume,
      soundVolume: this.soundVolume,
      bgmVolume: this.bgmVolume,
      isPlaying: this.isInitialized && !this.muted && this.currentBGM !== null,
    };
  }

  /**
   * 静音/取消静音
   */
  toggleMute(): void {
    this.muted = !this.muted;
    if (this.muted) {
      this.currentBGM?.pause();
    } else {
      this.resumeAll();
    }
  }

  /**
   * 设置主音量
   */
  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.currentBGM) {
      this.currentBGM.volume = this.masterVolume * this.bgmVolume;
    }
    this.onVolumeChange?.(this.masterVolume);
  }

  /**
   * 设置音效音量
   */
  setSoundVolume(volume: number): void {
    this.soundVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * 设置 BGM 音量
   */
  setBGMVolume(volume: number): void {
    this.bgmVolume = Math.max(0, Math.min(1, volume));
    if (this.currentBGM) {
      this.currentBGM.volume = this.masterVolume * this.bgmVolume;
    }
  }

  /**
   * 获取音效音量
   */
  getSoundVolume(): number {
    return this.soundVolume;
  }

  /**
   * 获取 BGM 音量
   */
  getBGMVolume(): number {
    return this.bgmVolume;
  }

  /**
   * 注册程序化音效
   */
  registerSound(type: SoundType, synth: (ctx: AudioContext) => void): void {
    this.soundMap[type] = synth;
  }

  /**
   * 设置音量变化回调
   */
  setOnVolumeChange(cb: (volume: number) => void): void {
    this.onVolumeChange = cb;
  }

  /**
   * 计算空间衰减
   */
  calculateAttenuation(
    position: { x: number; y: number; z: number },
    listenerPos: { x: number; y: number; z: number },
    distance: number,
  ): number {
    const dx = position.x - listenerPos.x;
    const dy = position.y - listenerPos.y;
    const dz = position.z - listenerPos.z;
    const actualDistance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (actualDistance >= distance) return 0;
    // 反平方衰减
    return Math.max(0, 1 - (actualDistance / distance) * (actualDistance / distance));
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.stopBGM();
    this.ctx?.close();
    this.isInitialized = false;
  }
}

