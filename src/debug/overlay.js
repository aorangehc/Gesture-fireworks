export class DebugOverlay {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.enabled = true;
    this._fps = 0;
    this._frames = 0;
    this._lastFpsTime = performance.now();
  }

  resize(width, height, dpr = 1) {
    this.canvas.width = Math.floor(width * dpr);
    this.canvas.height = Math.floor(height * dpr);
    this.canvas.style.width = `${Math.floor(width)}px`;
    this.canvas.style.height = `${Math.floor(height)}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  toggle() { this.enabled = !this.enabled; }

  update() {
    const now = performance.now();
    this._frames++;
    if (now - this._lastFpsTime >= 500) { // 半秒刷新一次
      this._fps = Math.round((this._frames * 1000) / (now - this._lastFpsTime));
      this._frames = 0;
      this._lastFpsTime = now;
    }
  }

  render(stats = {}, extrasDraw) {
    const { ctx, canvas } = this;
    if (!this.enabled) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(8, 8, 200, 70);
    ctx.fillStyle = '#8fd3ff';
    ctx.font = '12px system-ui, -apple-system, Segoe UI, Roboto, Arial';
    ctx.textBaseline = 'top';
    const lines = [
      `FPS: ${this._fps}`,
      `Instances: ${stats.instances ?? 0}`,
      `Particles: ${stats.particles ?? 0}`,
    ];
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], 16, 16 + i * 18);
    }
    ctx.restore();

    if (typeof extrasDraw === 'function') {
      extrasDraw(this.ctx, this.canvas);
    }
  }
}
