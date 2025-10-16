// 心形烟花特效

import { BaseEffect } from './base-effect.js';

export class FireworkHeart extends BaseEffect {
  constructor(x, y, startTime, pool, options = {}) {
    super(x, y, startTime);
    this.pool = pool;
    this.particleCount = options.particleCount || 80; // 增加粒子数量
    this.duration = options.duration || 3.5; // 延长持续时间
    // 使用更丰富的粉色系配色，营造浪漫效果
    this.colors = options.colors || [
      [255, 100, 150], // 粉红色
      [255, 150, 200], // 浅粉色
      [255, 50, 100],  // 深粉色
      [255, 200, 220], // 淡粉色
      [255, 120, 180], // 玫瑰色
      [255, 80, 160],  // 鲜粉色
      [255, 180, 210], // 樱花粉
      [255, 60, 120],  // 洋红色
    ];
    
    this.particles = [];
    this.time = 0;
    this.explosionDelay = 0.1; // 减少延迟，更快爆炸
  }

  init() {
    // 创建上升的火箭
    const rocket = this.pool.alloc();
    if (rocket) {
      rocket.x = this.x;
      rocket.y = this.y + 100;
      rocket.vx = 0;
      rocket.vy = -290;
      rocket.life = this.explosionDelay;
      rocket.maxLife = this.explosionDelay;
      rocket.size = 3;
      rocket.r = 255;
      rocket.g = 150;
      rocket.b = 200; // 粉色火箭
      this.particles.push(rocket);
    }
  }

  update(dt, now) {
    this.time += dt;
    
    // 更新现有粒子
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 180 * dt; // 适中的重力
      p.life -= dt;
      
      // 检查是否需要爆炸
      if (p.life <= 0 && this.particles.length === 1) {
        this._explode();
        this.pool.release(p);
        this.particles.splice(i, 1);
      } else if (p.life <= 0) {
        this.pool.release(p);
        this.particles.splice(i, 1);
      }
    }
    
    // 检查效果是否结束
    if (this.time > this.duration) {
      this.alive = false;
    }
  }

  _explode() {
    // 创建心形爆炸效果
    for (let i = 0; i < this.particleCount; i++) {
      const particle = this.pool.alloc();
      if (!particle) break;
      
      // 心形参数方程：x = 16sin³(t), y = 13cos(t) - 5cos(2t) - 2cos(3t) - cos(4t)
      const t = (i / this.particleCount) * Math.PI * 2;
      const heartX = 16 * Math.pow(Math.sin(t), 3);
      const heartY = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      
      // 缩放心形并添加随机性
      const scale = 4 + Math.random() * 3; // 增大缩放
      const speed = 80 + Math.random() * 60; // 增加速度
      const distance = Math.sqrt(heartX * heartX + heartY * heartY);
      
      particle.x = this.x;
      particle.y = this.y;
      particle.vx = (heartX / distance) * speed;
      particle.vy = (heartY / distance) * speed;
      particle.life = 2.8 + Math.random() * 1.2; // 延长生命周期
      particle.maxLife = particle.life;
      particle.size = 4 + Math.random() * 3; // 增大粒子尺寸
      
      // 随机选择粉色系颜色
      const color = this.colors[Math.floor(Math.random() * this.colors.length)];
      particle.r = color[0];
      particle.g = color[1];
      particle.b = color[2];
      
      this.particles.push(particle);
    }
  }

  render(renderer) {
    for (const particle of this.particles) {
      renderer.drawParticle(particle);
    }
  }
}