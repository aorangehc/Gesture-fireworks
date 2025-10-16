export class Canvas2DRenderer {
  constructor(canvas, { backgroundFade = 0.2 } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: true });
    this.backgroundFade = backgroundFade;
    this.ctx.globalCompositeOperation = 'source-over';
    this.clear(true);
    this.ctx.globalCompositeOperation = 'lighter';
  }

  resize(width, height, dpr = 1) {
    this.canvas.width = Math.floor(width * dpr);
    this.canvas.height = Math.floor(height * dpr);
    this.canvas.style.width = `${Math.floor(width)}px`;
    this.canvas.style.height = `${Math.floor(height)}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  clear(immediate = false) {
    const { ctx, canvas } = this;
    if (immediate) {
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
      return;
    }
    // 使用透明擦除保持摄像头可见，同时创建拖尾效果
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.globalAlpha = this.backgroundFade;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = 'rgba(255,255,255,1)'; // 使用白色进行透明擦除
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  // 粒子绘制
  // 兼容两种调用形式：
  // 1) drawParticle(x, y, radius, r, g, b, alpha)
  // 2) drawParticle(particleObject) // 从粒子对象推导半径与透明度
  drawParticle(a, b, c, d, e, f, g) {
    const { ctx } = this;
    let x, y, radius, r, gch, bch, alpha;

    if (typeof a === 'object' && a !== null) {
      const p = a;
      x = p.x;
      y = p.y;
      radius = p.size ?? 1;
      r = p.r ?? 255;
      gch = p.g ?? 255;
      bch = p.b ?? 255;
      const lifeMax = (p.lifeMax ?? p.maxLife ?? 1) || 1;
      const life = p.life ?? lifeMax;
      alpha = Math.max(0, Math.min(1, lifeMax ? life / lifeMax : 1));
    } else {
      x = a; y = b; radius = c; r = d; gch = e; bch = f; alpha = g;
    }

    if (!(alpha > 0) || !(radius > 0)) return;
    
    ctx.save();
    
    // 增强效果：绘制多层光晕
    // 外层光晕 - 最大最淡
    ctx.globalAlpha = alpha * 0.15;
    ctx.fillStyle = `rgb(${Math.min(255, r + 50)},${Math.min(255, gch + 50)},${Math.min(255, bch + 50)})`;
    ctx.beginPath();
    ctx.arc(x, y, radius * 3.5, 0, Math.PI * 2, false);
    ctx.fill();
    
    // 中层光晕
    ctx.globalAlpha = alpha * 0.3;
    ctx.fillStyle = `rgb(${Math.min(255, r + 30)},${Math.min(255, gch + 30)},${Math.min(255, bch + 30)})`;
    ctx.beginPath();
    ctx.arc(x, y, radius * 2.2, 0, Math.PI * 2, false);
    ctx.fill();
    
    // 内层光晕
    ctx.globalAlpha = alpha * 0.6;
    ctx.fillStyle = `rgb(${r},${gch},${bch})`;
    ctx.beginPath();
    ctx.arc(x, y, radius * 1.4, 0, Math.PI * 2, false);
    ctx.fill();
    
    // 核心粒子 - 最亮最小
    ctx.globalAlpha = alpha;
    ctx.fillStyle = `rgb(${Math.min(255, r + 80)},${Math.min(255, gch + 80)},${Math.min(255, bch + 80)})`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2, false);
    ctx.fill();
    
    // 添加闪烁的白色高光
    if (Math.random() < 0.3) {
      ctx.globalAlpha = alpha * 0.8;
      ctx.fillStyle = 'rgb(255,255,255)';
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.4, 0, Math.PI * 2, false);
      ctx.fill();
    }
    
    ctx.restore();
  }
}
