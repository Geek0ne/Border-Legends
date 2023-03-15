/**
 * 边境传说 — 天空系统
 * 渐变天穹（自定义着色器）+ 太阳光晕 + 漂移云层
 */
import * as THREE from 'three';

export interface SkyOptions {
  horizonColor?: string;   // 地平线颜色
  zenithColor?: string;    // 天顶颜色
  sunColor?: string;       // 太阳颜色
  sunDirection?: THREE.Vector3;
}

export class SkySystem {
  public readonly group: THREE.Group = new THREE.Group();
  private clouds: THREE.Sprite[] = [];
  private sunDir: THREE.Vector3;

  constructor(opts: SkyOptions = {}) {
    const horizon = new THREE.Color(opts.horizonColor ?? '#b8d4e8');
    const zenith = new THREE.Color(opts.zenithColor ?? '#4a7fc1');
    const sunColor = new THREE.Color(opts.sunColor ?? '#fff2d0');
    this.sunDir = (opts.sunDirection ?? new THREE.Vector3(0.55, 0.62, 0.55)).clone().normalize();

    this.buildDome(horizon, zenith, sunColor);
    this.buildSun(sunColor);
    this.buildClouds();
  }

  /** 渐变天穹：背面渲染的大球，按高度混合地平线/天顶色，叠加太阳光晕 */
  private buildDome(horizon: THREE.Color, zenith: THREE.Color, sunColor: THREE.Color): void {
    const geo = new THREE.SphereGeometry(480, 32, 16);
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        uHorizon: { value: horizon },
        uZenith: { value: zenith },
        uSun: { value: sunColor },
        uSunDir: { value: this.sunDir },
      },
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uHorizon;
        uniform vec3 uZenith;
        uniform vec3 uSun;
        uniform vec3 uSunDir;
        varying vec3 vDir;
        void main() {
          float h = clamp(vDir.y, -1.0, 1.0);
          // 地平线 → 天顶 渐变，低空略暖
          vec3 sky = mix(uHorizon, uZenith, smoothstep(0.0, 0.55, h));
          sky = mix(sky * 1.05, sky, smoothstep(-0.2, 0.05, h));
          // 太阳光晕 + 光盘
          float d = max(dot(normalize(vDir), normalize(uSunDir)), 0.0);
          float glow = pow(d, 32.0) * 0.35 + pow(d, 8.0) * 0.12;
          float disc = smoothstep(0.9992, 0.9997, d);
          sky += uSun * (glow + disc * 1.6);
          gl_FragColor = vec4(sky, 1.0);
        }
      `,
    });
    const dome = new THREE.Mesh(geo, mat);
    dome.renderOrder = -10;
    this.group.add(dome);
  }

  /** 太阳光晕贴片（柔和径向渐变） */
  private buildSun(sunColor: THREE.Color): void {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
      const c = sunColor;
      g.addColorStop(0, `rgba(${(c.r * 255) | 0},${(c.g * 255) | 0},${(c.b * 255) | 0},0.9)`);
      g.addColorStop(0.35, `rgba(${(c.r * 255) | 0},${(c.g * 255) | 0},${(c.b * 255) | 0},0.25)`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 128, 128);
    }
    const tex = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: tex, transparent: true, depthWrite: false, fog: false,
      blending: THREE.AdditiveBlending,
    }));
    sprite.position.copy(this.sunDir).multiplyScalar(430);
    sprite.scale.setScalar(120);
    this.group.add(sprite);
  }

  /** 云层：软块状贴片，缓慢漂移 */
  private buildClouds(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // 若干柔边椭圆叠成一朵云
      const blobs: Array<[number, number, number, number]> = [
        [128, 130, 95, 42], [78, 140, 60, 30], [180, 138, 62, 32],
        [110, 112, 55, 26], [150, 116, 50, 24],
      ];
      for (const [cx, cy, rx, ry] of blobs) {
        const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, Math.max(rx, ry));
        g.addColorStop(0, 'rgba(255,255,255,0.85)');
        g.addColorStop(0.6, 'rgba(255,255,255,0.35)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(1, ry / rx);
        ctx.translate(-cx, -cy);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, rx, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    const tex = new THREE.CanvasTexture(canvas);

    for (let i = 0; i < 14; i++) {
      const mat = new THREE.SpriteMaterial({
        map: tex,
        transparent: true,
        opacity: 0.55 + Math.random() * 0.3,
        depthWrite: false,
        fog: true,
      });
      const cloud = new THREE.Sprite(mat);
      const angle = Math.random() * Math.PI * 2;
      const dist = 160 + Math.random() * 220;
      cloud.position.set(Math.cos(angle) * dist, 75 + Math.random() * 75, Math.sin(angle) * dist);
      const s = 70 + Math.random() * 90;
      cloud.scale.set(s, s * 0.42, 1);
      cloud.userData.drift = 0.8 + Math.random() * 1.6;
      this.clouds.push(cloud);
      this.group.add(cloud);
    }
  }

  /** 每帧：云层漂移 + 位置回绕 */
  public update(delta: number): void {
    for (const cloud of this.clouds) {
      cloud.position.x += (cloud.userData.drift as number) * delta;
      if (cloud.position.x > 420) cloud.position.x = -420;
    }
  }
}
