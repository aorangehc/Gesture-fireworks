// 螺旋烟花特效

import { BaseEffect } from './base-effect.js';

export class FireworkSpiral extends BaseEffect {
  constructor(x, y, startTime, pool, options = {}) {
    super(x, y, startTime);
    this.pool = pool;
    this.particleCount = options.particleCount || 100; // 增加粒子数量
    this.duration = options.duration || 4.5; // 延长持续时间
    this.colors = options.colors || [
      [100, 255, 255], // 青色
      [100, 200, 255], // 浅蓝色
      [150, 255, 200], // 薄荷绿
      [200, 150, 255], // 淡紫色
      [255, 200, 100], // 橙色
      [255, 255, 150], // 浅黄色
      [200, 255, 200], // 浅绿色
      [255, 150, 200], // 粉色
      [150, 200, 255], // 天蓝色
      [200, 200, 255], // 薰衣草色
    ];
    
    this.particles = [];
    this.time = 0;
    this.explosionDelay = 0.06; // 减少延迟
  }

  init() {
    // 创建上升的火箭
    const rocket = this.pool.alloc();
    if (rocket) {
      rocket.x = this.x;
      rocket.y = this.y + 100;
      rocket.vx = 0;
      rocket.vy = -300;
      rocket.life = this.explosionDelay;
      rocket.maxLife = this.explosionDelay;
      rocket.size = 3.5;
      rocket.r = 138;
      rocket.g = 43;
      rocket.b = 226; // 紫色火箭
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
      p.vy += 160 * dt; // 适中的重力
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
    // 创建螺旋爆炸效果
    const spiralTurns = 4; // 增加螺旋圈数
    
    for (let i = 0; i < this.particleCount; i++) {
      const particle = this.pool.alloc();
      if (!particle) break;
      
      // 螺旋参数方程
      const t = (i / this.particleCount) * spiralTurns * Math.PI * 2;
      const radius = 100 + (i / this.particleCount) * 80; // 增大螺旋半径
      const spiralX = Math.cos(t) * radius;
      const spiralY = Math.sin(t) * radius;
      
      // 添加速度和随机性
      const speed = 90 + Math.random() * 70; // 增加速度
      const distance = Math.sqrt(spiralX * spiralX + spiralY * spiralY);
      
      particle.x = this.x;
      particle.y = this.y;
      particle.vx = (spiralX / distance) * speed;
      particle.vy = (spiralY / distance) * speed;
      particle.life = 3.2 + Math.random() * 1.5; // 延长生命周期
      particle.maxLife = particle.life;
      particle.size = 3.5 + Math.random() * 3.5; // 增大粒子尺寸
      
      // 随机选择颜色
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