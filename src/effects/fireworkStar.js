// 星形烟花特效

import { BaseEffect } from './base-effect.js';

export class FireworkStar extends BaseEffect {
  constructor(x, y, startTime, pool, options = {}) {
    super(x, y, startTime);
    this.pool = pool;
    this.particleCount = options.particleCount || 60; // 增加粒子数量
    this.duration = options.duration || 3.8; // 延长持续时间
    this.colors = options.colors || [
      [255, 255, 100], // 金黄色
      [255, 200, 50],  // 橙黄色
      [255, 255, 200], // 浅黄色
      [200, 200, 255], // 浅蓝色
      [255, 255, 255], // 白色
      [255, 150, 100], // 橙红色
      [100, 255, 255], // 青色
      [255, 100, 255], // 洋红色
    ];
    
    this.particles = [];
    this.time = 0;
    this.explosionDelay = 0.08; // 减少延迟
  }

  init() {
    // 创建上升的火箭
    const rocket = this.pool.alloc();
    if (rocket) {
      rocket.x = this.x;
      rocket.y = this.y + 110;
      rocket.vx = 0;
      rocket.vy = -300;
      rocket.life = this.explosionDelay;
      rocket.maxLife = this.explosionDelay;
      rocket.size = 3;
      rocket.r = 255;
      rocket.g = 255;
      rocket.b = 100;
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
      
      if (p.isStar) {
        p.vy += 180 * dt; // 重力
        p.vx *= 0.98; // 阻力
        
        // 星形粒子的闪烁效果
        p.twinklePhase = (p.twinklePhase || 0) + dt * 8;
      } else {
        p.vy += 200 * dt; // 普通重力
      }
      
      p.life -= dt;
      
      if (p.life <= 0) {
        this.pool.release(p);
        this.particles.splice(i, 1);
      }
    }
    
    // 爆炸时刻
    if (this.time >= this.explosionDelay && this.particles.length === 1) {
      this._explode();
    }
    if (this.time >= this.duration && this.particles.length === 0) {
      this.alive = false;
    }
  }

  _explode() {
    // 移除火箭
    if (this.particles.length > 0) {
      this.pool.release(this.particles[0]);
      this.particles.splice(0, 1);
    }
    
    // 创建五角星形爆炸
    const starPoints = this._generateStarPoints(5, 120, 60); // 增大星形尺寸
    
    // 主要星形射线
    for (let i = 0; i < starPoints.length; i++) {
      const point = starPoints[i];
      const isOuterPoint = i % 2 === 0; // 外角点
      const particlesPerRay = isOuterPoint ? 6 : 3; // 增加每条射线的粒子数
      
      for (let j = 0; j < particlesPerRay; j++) {
        const particle = this.pool.alloc();
        if (!particle) break;
        
        const color = this.colors[Math.floor(Math.random() * this.colors.length)];
        const distance = Math.sqrt(point.x * point.x + point.y * point.y);
        const speed = (80 + Math.random() * 60) * (1 + j * 0.3); // 增加速度
        
        particle.x = this.x;
        particle.y = this.y;
        particle.vx = (point.x / distance) * speed;
        particle.vy = (point.y / distance) * speed;
        particle.life = 2.8 + Math.random() * 1.2; // 延长生命周期
        particle.maxLife = particle.life;
        particle.size = isOuterPoint ? 5 + Math.random() * 3 : 3 + Math.random() * 2; // 增大粒子尺寸
        particle.r = color[0];
        particle.g = color[1];
        particle.b = color[2];
        particle.isStar = true;
        particle.twinklePhase = Math.random() * Math.PI * 2;
        
        this.particles.push(particle);
      }
    }
    
    // 添加中心爆炸效果
    const centerParticles = 8;
    for (let i = 0; i < centerParticles; i++) {
      const particle = this.pool.alloc();
      if (!particle) break;
      
      const angle = (i / 8) * Math.PI * 2;
      const speed = 30 + Math.random() * 30;
      const color = this.colors[Math.floor(Math.random() * this.colors.length)];
      
      particle.x = this.x;
      particle.y = this.y;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
      particle.life = 1.5 + Math.random() * 0.5;
      particle.maxLife = particle.life;
      particle.size = 2 + Math.random() * 2;
      particle.r = color[0];
      particle.g = color[1];
      particle.b = color[2];
      particle.isStar = false;
      
      this.particles.push(particle);
    }
  }

  // 生成五角星轮廓点
  _generateStarPoints(numPoints, outerRadius, innerRadius) {
    const points = [];
    const angleStep = Math.PI / numPoints;
    
    for (let i = 0; i < numPoints * 2; i++) {
      const angle = i * angleStep - Math.PI / 2; // 从顶部开始
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      
      points.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius
      });
    }
    
    return points;
  }

  render(renderer) {
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      
      if (p.isStar) {
        // 星形粒子的闪烁效果
        const twinkle = 0.6 + 0.4 * Math.sin(p.twinklePhase);
        const finalAlpha = alpha * twinkle;
        
        // 绘制主粒子
        renderer.drawParticle(p.x, p.y, p.size, p.r, p.g, p.b, finalAlpha);
        
        // 绘制光晕效果
        if (finalAlpha > 0.3) {
          renderer.drawParticle(p.x, p.y, p.size * 2, p.r, p.g, p.b, finalAlpha * 0.3);
        }
      } else {
        renderer.drawParticle(p.x, p.y, p.size, p.r, p.g, p.b, alpha);
      }
    }
  }
}