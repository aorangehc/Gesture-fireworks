import { BaseEffect } from './base-effect.js';
import { Config } from '../config.js';

// 圆形烟花（标准环形爆炸）——与粒子池/渲染器保持一致接口
export class FireworkCircle extends BaseEffect {
  constructor(x, y, startTime, pool, options = {}) {
    super(x, y, startTime);
    this.pool = pool;
    this.duration = options.duration || 3.5; // 延长持续时间
    this.rings = options.rings || 2; // 增加环数
    this.count = options.count || 120; // 增加粒子数量
    this.speedMin = options.speedMin || 160;
    this.speedMax = options.speedMax || 280;
    
    // 增强颜色配置 - 使用渐变色彩
    this.colors = [
      { r: 255, g: 100, b: 100 }, // 红色
      { r: 255, g: 150, b: 50 },  // 橙色
      { r: 255, g: 200, b: 100 }, // 黄色
      { r: 100, g: 255, b: 100 }, // 绿色
      { r: 100, g: 200, b: 255 }, // 蓝色
      { r: 200, g: 100, b: 255 }, // 紫色
      { r: 255, g: 100, b: 200 }, // 粉色
    ];
    
    this.particles = [];
    this._spawned = false;
  }

  init() {
    // 立即在起点生成环状爆裂
    if (!this._spawned) {
      for (let ring = 0; ring < this.rings; ring++) {
        const baseAngle = ring * (Math.PI / this.rings);
        const ringCount = this.count;
        for (let i = 0; i < ringCount; i++) {
          const p = this.pool.alloc();
          if (!p) break;
          const t = i / ringCount;
          const angle = t * Math.PI * 2 + baseAngle;
          const speed = this.speedMin + Math.random() * (this.speedMax - this.speedMin);
          p.x = this.x; p.y = this.y;
          p.vx = Math.cos(angle) * speed;
          p.vy = Math.sin(angle) * speed;
          p.life = 2.0 + Math.random() * 1.5; // 延长生命周期
          p.lifeMax = p.life;
          p.size = 3 + Math.random() * 3; // 增大粒子尺寸
          
          // 使用多彩颜色配置
          const color = this.colors[Math.floor(Math.random() * this.colors.length)];
          p.r = color.r; p.g = color.g; p.b = color.b;
          
          p.damping = 0.985; // 减少阻尼，让粒子飞得更远
          p.gravity = Config.gravity * 0.8; // 减少重力影响
          this.particles.push(p);
        }
      }
      this._spawned = true;
    }
  }

  update(dt, now) {
    // 粒子物理更新
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.vx *= p.damping;
      p.vy = p.vy * p.damping + p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        const last = this.particles.pop();
        if (last !== p) this.particles[i] = last;
        this.pool.release(p);
      }
    }

    if (this.particles.length === 0) this.alive = false;
  }

  render(renderer) {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const alpha = Math.max(0, p.life / (p.lifeMax || p.maxLife || 1));
      const radius = p.size * (0.6 + 0.7 * alpha);
      renderer.drawParticle(p.x, p.y, radius, p.r, p.g, p.b, alpha);
    }
  }

  particleCount() { return this.particles.length; }
}