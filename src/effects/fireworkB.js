import { BaseEffect } from "./base-effect.js";
import { Config } from "../config.js";
import { randRange, hsvToRgb } from "../utils/math.js";

// FireworkB：环形/分层爆裂 + 二次脉冲（4s）
export class FireworkB extends BaseEffect {
  constructor(x, y, startTime, pool) {
    super(x, y, startTime);
    this.pool = pool;
    this.elapsed = 0;
    this.stageTimes = {
      burst1: 0.2,
      burst2: 1.0,
      end: Config.lifetimeSec,
    };
    this.sparks = [];
    this.did1 = false;
    this.did2 = false;
    // 多彩配色
    this.palette = new Array(5).fill(0).map((_, i) => {
      const { r, g, b } = hsvToRgb((Math.random() + i * 0.18) % 1, 0.9, 1.0);
      return { r, g, b };
    });
  }

  spawn(x, y, speed, angle, life, size, color) {
    const p = this.pool.alloc();
    if (!p) return;
    p.x = x; p.y = y;
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed;
    p.life = life;
    p.lifeMax = life;
    p.size = size;
    p.r = color.r; p.g = color.g; p.b = color.b;
    p.damping = 0.986;
    p.gravity = Config.gravity * 0.9;
    this.sparks.push(p);
  }

  ringBurst(x, y, count, speedMin, speedMax, lifeMin, lifeMax, jitter = 0.05) {
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const angle = t * Math.PI * 2 + randRange(-jitter, jitter);
      const speed = randRange(speedMin, speedMax);
      const life = randRange(lifeMin, lifeMax);
      const size = randRange(1.0, 2.2);
      const color = this.palette[i % this.palette.length];
      this.spawn(x, y, speed, angle, life, size, color);
    }
  }

  starBurst(x, y, branches = 6) {
    const base = randRange(140, 220);
    for (let k = 0; k < branches; k++) {
      const baseAngle = (k / branches) * Math.PI * 2;
      for (let i = -2; i <= 2; i++) {
        const a = baseAngle + i * 0.05;
        const sp = base + Math.abs(i) * 20 + randRange(-10, 10);
        const life = randRange(1.0, 1.8);
        const size = randRange(1.2, 2.0);
        const color = this.palette[(k + i + this.palette.length) % this.palette.length];
        this.spawn(x, y, sp, a, life, size, color);
      }
    }
  }

  update(dt, now) {
    this.elapsed = (now - this.startTime) / 1000;
    const t = this.elapsed;
    if (!this.did1 && t >= this.stageTimes.burst1) {
      this.did1 = true;
      this.ringBurst(this.x, this.y, 120, 100, 220, 1.2, 1.8);
    }
    if (!this.did2 && t >= this.stageTimes.burst2) {
      this.did2 = true;
      this.starBurst(this.x, this.y, 7);
    }

    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const p = this.sparks[i];
      p.vx *= p.damping;
      p.vy = p.vy * p.damping + p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        const last = this.sparks.pop();
        if (last !== p) this.sparks[i] = last;
        this.pool.release(p);
      }
    }
    if (t >= this.stageTimes.end && this.sparks.length === 0) this.alive = false;
  }

  render(renderer) {
    for (let i = 0; i < this.sparks.length; i++) {
      const p = this.sparks[i];
      const alpha = Math.max(0, p.life / p.lifeMax);
      const radius = p.size * (0.5 + 0.9 * alpha);
      renderer.drawParticle(p.x, p.y, radius, p.r, p.g, p.b, alpha);
    }
  }

  particleCount() { return this.sparks.length; }
}

