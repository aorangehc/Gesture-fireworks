// 增强粒子系统 - 支持发光、拖尾、渐变等高级效果

export class EnhancedParticle {
  constructor(x, y, vx, vy, options = {}) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    
    // 基础属性
    this.life = options.life || 1.0;
    this.maxLife = this.life;
    this.size = options.size || 3;
    this.maxSize = this.size;
    this.gravity = options.gravity || 0.1;
    this.friction = options.friction || 0.98;
    
    // 颜色和视觉效果
    this.color = options.color || { r: 255, g: 255, b: 255 };
    this.glowColor = options.glowColor || this.color;
    this.glowSize = options.glowSize || 10;
    this.alpha = options.alpha || 1.0;
    
    // 拖尾效果
    this.trail = options.trail || false;
    this.trailLength = options.trailLength || 5;
    this.trailHistory = [];
    
    // 闪烁效果
    this.sparkle = options.sparkle || false;
    this.sparkleFreq = options.sparkleFreq || 0.1;
    
    // 旋转效果
    this.rotation = options.rotation || 0;
    this.rotationSpeed = options.rotationSpeed || 0;
    
    // 缩放动画
    this.scaleAnimation = options.scaleAnimation || false;
    this.scalePhase = 0;
    
    // 物理属性
    this.bounce = options.bounce || 0;
    this.mass = options.mass || 1;
  }

  update(deltaTime) {
    // 保存历史位置用于拖尾
    if (this.trail) {
      this.trailHistory.push({ x: this.x, y: this.y, alpha: this.alpha });
      if (this.trailHistory.length > this.trailLength) {
        this.trailHistory.shift();
      }
    }

    // 物理更新
    this.vy += this.gravity * deltaTime;
    this.vx *= this.friction;
    this.vy *= this.friction;
    
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;

    // 边界碰撞检测
    if (this.bounce > 0) {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        if (this.x <= 0 || this.x >= canvas.width) {
          this.vx *= -this.bounce;
          this.x = Math.max(0, Math.min(canvas.width, this.x));
        }
        if (this.y >= canvas.height) {
          this.vy *= -this.bounce;
          this.y = canvas.height;
        }
      }
    }

    // 生命周期更新
    this.life -= deltaTime * 0.016; // 假设60fps
    const lifeRatio = this.life / this.maxLife;
    
    // 透明度渐变
    this.alpha = Math.max(0, lifeRatio);
    
    // 大小变化
    if (this.scaleAnimation) {
      this.scalePhase += deltaTime * 0.1;
      this.size = this.maxSize * (0.8 + 0.2 * Math.sin(this.scalePhase)) * lifeRatio;
    } else {
      this.size = this.maxSize * lifeRatio;
    }
    
    // 旋转更新
    this.rotation += this.rotationSpeed * deltaTime;
    
    return this.life > 0;
  }

  render(ctx) {
    if (this.alpha <= 0) return;

    ctx.save();
    
    // 绘制拖尾
    if (this.trail && this.trailHistory.length > 1) {
      this.renderTrail(ctx);
    }
    
    // 绘制发光效果
    if (this.glowSize > 0) {
      this.renderGlow(ctx);
    }
    
    // 绘制主粒子
    this.renderParticle(ctx);
    
    ctx.restore();
  }

  renderTrail(ctx) {
    ctx.globalCompositeOperation = 'lighter';
    
    for (let i = 0; i < this.trailHistory.length - 1; i++) {
      const current = this.trailHistory[i];
      const next = this.trailHistory[i + 1];
      const trailAlpha = (i / this.trailHistory.length) * current.alpha * 0.5;
      
      ctx.strokeStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${trailAlpha})`;
      ctx.lineWidth = this.size * (i / this.trailHistory.length);
      ctx.lineCap = 'round';
      
      ctx.beginPath();
      ctx.moveTo(current.x, current.y);
      ctx.lineTo(next.x, next.y);
      ctx.stroke();
    }
    
    ctx.globalCompositeOperation = 'source-over';
  }

  renderGlow(ctx) {
    const gradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, this.glowSize
    );
    
    gradient.addColorStop(0, `rgba(${this.glowColor.r}, ${this.glowColor.g}, ${this.glowColor.b}, ${this.alpha * 0.8})`);
    gradient.addColorStop(0.5, `rgba(${this.glowColor.r}, ${this.glowColor.g}, ${this.glowColor.b}, ${this.alpha * 0.3})`);
    gradient.addColorStop(1, `rgba(${this.glowColor.r}, ${this.glowColor.g}, ${this.glowColor.b}, 0)`);
    
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.glowSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }

  renderParticle(ctx) {
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    
    // 闪烁效果
    let currentAlpha = this.alpha;
    if (this.sparkle && Math.random() < this.sparkleFreq) {
      currentAlpha *= 0.3;
    }
    
    ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${currentAlpha})`;
    
    // 绘制粒子形状
    ctx.beginPath();
    ctx.arc(0, 0, this.size, 0, Math.PI * 2);
    ctx.fill();
    
    // 添加高光
    if (this.size > 2) {
      ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha * 0.6})`;
      ctx.beginPath();
      ctx.arc(-this.size * 0.3, -this.size * 0.3, this.size * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export class EnhancedParticleSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.lastTime = performance.now();
    
    // 屏幕震动效果
    this.screenShake = {
      intensity: 0,
      duration: 0,
      offsetX: 0,
      offsetY: 0
    };
    
    // 音效系统
    this.audioContext = null;
    this.initAudio();
  }

  initAudio() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }

  // 播放音效
  playSound(frequency = 440, duration = 0.2, type = 'sine') {
    if (!this.audioContext) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // 触发屏幕震动
  shake(intensity = 10, duration = 300) {
    this.screenShake.intensity = intensity;
    this.screenShake.duration = duration;
  }

  // 更新屏幕震动
  updateScreenShake(deltaTime) {
    if (this.screenShake.duration > 0) {
      this.screenShake.duration -= deltaTime;
      
      const shakeAmount = this.screenShake.intensity * (this.screenShake.duration / 300);
      this.screenShake.offsetX = (Math.random() - 0.5) * shakeAmount;
      this.screenShake.offsetY = (Math.random() - 0.5) * shakeAmount;
    } else {
      this.screenShake.offsetX = 0;
      this.screenShake.offsetY = 0;
    }
  }

  // 添加粒子
  addParticle(particle) {
    this.particles.push(particle);
  }

  // 创建爆炸效果
  createExplosion(x, y, options = {}) {
    const particleCount = options.particleCount || 30;
    const colors = options.colors || [
      { r: 255, g: 100, b: 100 },
      { r: 255, g: 200, b: 100 },
      { r: 100, g: 255, b: 100 },
      { r: 100, g: 100, b: 255 },
      { r: 255, g: 255, b: 100 }
    ];
    
    // 播放爆炸音效
    this.playSound(200 + Math.random() * 400, 0.3, 'sawtooth');
    
    // 触发屏幕震动
    this.shake(15, 200);
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
      const speed = 2 + Math.random() * 4;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      const particle = new EnhancedParticle(x, y, vx, vy, {
        life: 1.5 + Math.random() * 1.5,
        size: 3 + Math.random() * 4,
        color: color,
        glowColor: color,
        glowSize: 8 + Math.random() * 12,
        trail: true,
        trailLength: 8,
        sparkle: true,
        sparkleFreq: 0.15,
        scaleAnimation: true,
        gravity: 0.05,
        friction: 0.99
      });
      
      this.addParticle(particle);
    }
  }

  // 创建火箭轨迹
  createRocketTrail(x, y, targetX, targetY, options = {}) {
    const color = options.color || { r: 255, g: 255, b: 255 };
    const trailCount = options.trailCount || 15;
    
    // 播放火箭音效
    this.playSound(800, 0.1, 'square');
    
    for (let i = 0; i < trailCount; i++) {
      const progress = i / trailCount;
      const currentX = x + (targetX - x) * progress;
      const currentY = y + (targetY - y) * progress;
      
      const particle = new EnhancedParticle(
        currentX + (Math.random() - 0.5) * 10,
        currentY + (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        {
          life: 0.5 + Math.random() * 0.5,
          size: 2 + Math.random() * 3,
          color: color,
          glowColor: color,
          glowSize: 6,
          trail: true,
          trailLength: 5,
          gravity: 0.02,
          friction: 0.95
        }
      );
      
      this.addParticle(particle);
    }
  }

  update() {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    // 更新屏幕震动
    this.updateScreenShake(deltaTime);
    
    // 更新所有粒子
    this.particles = this.particles.filter(particle => particle.update(deltaTime));
  }

  render() {
    this.ctx.save();
    
    // 应用屏幕震动
    this.ctx.translate(this.screenShake.offsetX, this.screenShake.offsetY);
    
    // 设置混合模式以增强发光效果
    this.ctx.globalCompositeOperation = 'source-over';
    
    // 渲染所有粒子
    this.particles.forEach(particle => particle.render(this.ctx));
    
    this.ctx.restore();
  }

  // 清理所有粒子
  clear() {
    this.particles = [];
  }

  // 获取粒子数量
  getParticleCount() {
    return this.particles.length;
  }
}