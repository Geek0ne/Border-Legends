/**
 * 边境传说 — 环境音层（程序化）
 * 风声（滤波噪声 + 缓慢起伏）+ 鸟鸣（随机音符点缀）
 * 无需音频素材文件，零下载体积
 */
export class AmbientAudio {
  private ctx: AudioContext | null = null;
  private windGain: GainNode | null = null;
  private windSource: AudioBufferSourceNode | null = null;
  private birdTimer: number | null = null;
  private volume: number = 0.35;
  private running: boolean = false;

  /** 启动环境音（重复调用无副作用） */
  public start(ctx: AudioContext): void {
    if (this.running) return;
    this.ctx = ctx;
    this.running = true;
    this.startWind();
    this.scheduleBird();
  }

  /** 风：白噪声 → 低通滤波 → 缓慢音量起伏 */
  private startWind(): void {
    if (!this.ctx) return;
    const ctx = this.ctx;

    // 2 秒噪声缓冲（循环播放）
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      // 褒性噪声：比白噪声更像风声
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;

    const gain = ctx.createGain();
    gain.gain.value = this.volume * 0.5;

    // 风力起伏（LFO 调制音量）
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.11;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = this.volume * 0.22;
    lfo.connect(lfoGain).connect(gain.gain);

    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start();
    lfo.start();

    this.windSource = source;
    this.windGain = gain;
  }

  /** 鸟鸣：每 4~11 秒随机一串高频短音 */
  private scheduleBird(): void {
    if (!this.ctx || !this.running) return;
    const delay = 4000 + Math.random() * 7000;
    this.birdTimer = window.setTimeout(() => {
      this.playChirp();
      this.scheduleBird();
    }, delay);
  }

  private playChirp(): void {
    if (!this.ctx || !this.running) return;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;
    const notes = 2 + Math.floor(Math.random() * 3);
    const base = 2200 + Math.random() * 1600;

    for (let i = 0; i < notes; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const start = t0 + i * 0.12;
      osc.frequency.setValueAtTime(base * (1 + Math.random() * 0.15), start);
      osc.frequency.exponentialRampToValueAtTime(base * 1.25, start + 0.05);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(this.volume * 0.16, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.1);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.12);
    }
  }

  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.windGain) {
      this.windGain.gain.value = this.volume * 0.5;
    }
  }

  public stop(): void {
    this.running = false;
    if (this.birdTimer !== null) {
      window.clearTimeout(this.birdTimer);
      this.birdTimer = null;
    }
    try {
      this.windSource?.stop();
    } catch {
      /* 已停止 */
    }
    this.windSource = null;
    this.windGain = null;
  }

  public isRunning(): boolean {
    return this.running;
  }
}
