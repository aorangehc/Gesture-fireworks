// 爆炸烟花特效

import { BaseEffect } from './base-effect.js';

export class FireworkBurst extends BaseEffect {
  constructor(x, y, startTime, pool, options = {}) {
    super(x, y, startTime);
    this.pool = pool;
    this.particleCount = options.particleCount || 120; // 大幅增加粒子数量
    this.duration = options.duration || 4.2; // 延长持续时间
    this.colors = options.colors || [
      [255, 100, 100], // 红色
      [100, 255, 100], // 绿色
      [100, 100, 255], // 蓝色
      [255, 255, 100], // 黄色
      [255, 100, 255], // 洋红色
      [100, 255, 255], // 青色
      [255, 150, 100], // 橙色
      [150, 100, 255], // 紫色
      [255, 200, 150], // 桃色
      [150, 255, 200], // 薄荷绿
    ];
    
    this.particles = [];
    this.time = 0;
    this.explosionDelay = 0.05; // 减少延迟，更快爆炸
  }

  init() {
    // 创建上升的火箭
    const rocket = this.pool.alloc();
    if (rocket) {
      rocket.x = this.x;
      rocket.y = this.y + 100;
      rocket.vx = 0;
      rocket.vy = -310;
      rocket.life = this.explosionDelay;
      rocket.maxLife = this.explosionDelay;
      rocket.size = 4;
      rocket.r = 255;
      rocket.g = 215;
      rocket.b = 0; // 金色火箭
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
      p.vy += 170 * dt; // 适中的重力
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
    // 创建爆裂效果 - 多层爆炸
    const layers = 4; // 增加层数
    const particlesPerLayer = Math.floor(this.particleCount / layers);
    
    for (let layer = 0; layer < layers; layer++) {
      const layerRadius = 80 + layer * 50; // 增大每层半径
      const layerSpeed = 100 + layer * 40;  // 增加每层速度
      
      for (let i = 0; i < particlesPerLayer; i++) {
        const particle = this.pool.alloc();
        if (!particle) break;
        
        // 均匀分布在圆周上
        const angle = (i / particlesPerLayer) * Math.PI * 2 + (layer * 0.3); // 每层稍微偏移
        const speed = layerSpeed + Math.random() * 60; // 增加速度随机性
        
        particle.x = this.x;
        particle.y = this.y;
        particle.vx = Math.cos(angle) * speed;
        particle.vy = Math.sin(angle) * speed;
        particle.life = 2.8 + Math.random() * 1.5; // 延长生命周期
        particle.maxLife = particle.life;
        particle.size = 4 + Math.random() * 3.5; // 增大粒子尺寸
        
        // 随机选择颜色
        const color = this.colors[Math.floor(Math.random() * this.colors.length)];
        particle.r = color[0];
        particle.g = color[1];
        particle.b = color[2];
        
        this.particles.push(particle);
      }
    }
  }

  render(renderer) {
    for (const particle of this.particles) {
      renderer.drawParticle(particle);
    }
  }
}