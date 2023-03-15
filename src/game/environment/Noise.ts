/**
 * 边境传说 — 确定性 2D 值噪声
 * 用于地形起伏、岩石形变、山脉生成，保证每次运行结果一致
 */

export class Noise2D {
  private seed: number;

  constructor(seed: number = 1337) {
    this.seed = seed | 0;
  }

  /** 整数哈希 → [0, 1) */
  private hash(ix: number, iz: number): number {
    let h = (ix * 374761393 + iz * 668265263 + this.seed * 144665) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) & 0xffff) / 0xffff;
  }

  /** 值噪声 → [-1, 1]，平滑插值 */
  noise(x: number, z: number): number {
    const ix = Math.floor(x);
    const iz = Math.floor(z);
    const fx = x - ix;
    const fz = z - iz;

    // smoothstep 权重
    const ux = fx * fx * (3 - 2 * fx);
    const uz = fz * fz * (3 - 2 * fz);

    const a = this.hash(ix, iz);
    const b = this.hash(ix + 1, iz);
    const c = this.hash(ix, iz + 1);
    const d = this.hash(ix + 1, iz + 1);

    const v = a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
    return v * 2 - 1;
  }

  /** 分形叠加噪声 → 大致 [-1, 1] */
  fbm(x: number, z: number, octaves: number = 4, lacunarity: number = 2, gain: number = 0.5): number {
    let amp = 1;
    let freq = 1;
    let sum = 0;
    let norm = 0;
    for (let i = 0; i < octaves; i++) {
      sum += this.noise(x * freq, z * freq) * amp;
      norm += amp;
      amp *= gain;
      freq *= lacunarity;
    }
    return norm > 0 ? sum / norm : 0;
  }
}
