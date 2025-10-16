// 雨伞形烟花特效

import { BaseEffect } from './base-effect.js';

export class FireworkUmbrella extends BaseEffect {
  constructor(x, y, startTime, pool, options = {}) {
    super(x, y, startTime);
    this.pool = pool;
    this.particleCount = options.particleCount || 35; // 适中的粒子数量
    this.duration = options.duration || 3.0; // 延长持续时间
    // 使用蓝色系配色，营造雨伞效果
    this.colors = options.colors || [
      [50, 150, 255],  // 天蓝色
      [100, 200, 255], // 浅蓝色
      [0, 100, 200],   // 深蓝色
      [150, 220, 255], // 淡蓝色
      [80, 180, 255],  // 中蓝色
    ];
    
    this.particles = [];
    this.time = 0;
    this.explosionDelay = 0.12;
  }

  init() {
    // 创建上升的火箭
    const rocket = this.pool.alloc();
    if (rocket) {
      rocket.x = this.x;
      rocket.y = this.y + 100;
      rocket.vx = 0;
      rocket.vy = -280;
      rocket.life = this.explosionDelay;
      rocket.maxLife = this.explosionDelay;
      rocket.size = 3;
      rocket.r = 100;
      rocket.g = 200;
      rocket.b = 255; // 蓝色火箭
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
      p.vy += 150 * dt; // 较轻的重力，模拟雨伞缓慢下落
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
    // 创建雨伞形爆炸效果
    for (let i = 0; i < this.particleCount; i++) {
      const particle = this.pool.alloc();
      if (!particle) break;
      
      // 雨伞形状：上半圆弧形分布
      const angle = Math.PI + (i / this.particleCount) * Math.PI; // 只在下半圆
      const speed = 80 + Math.random() * 60; // 较慢的速度
      
      particle.x = this.x;
      particle.y = this.y;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed * 0.5; // 减少垂直速度，增强雨伞效果
      particle.life = 2.0 + Math.random() * 1.5; // 更长的生命周期
      particle.maxLife = particle.life;
      particle.size = 2.5 + Math.random() * 1.5;
      
      // 随机选择蓝色系颜色
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