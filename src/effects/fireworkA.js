import { BaseEffect } from "./base-effect.js";
import { Config } from "../config.js";
import { randRange, hsvToRgb } from "../utils/math.js";

// FireworkA：单次爆裂 + 拖尾 + 消散（4s 时间线）
export class FireworkA extends BaseEffect {
  constructor(x, y, startTime, pool) {
    super(x, y, startTime);
    this.pool = pool;
    this.elapsed = 0;

    this.stageTimes = {
      lift: 0.6,
      preburst: 1.2,
      burst: 2.2,
      end: Config.lifetimeSec,
    };

    // 选一组主色（HSV 颜色轮随机）
    const hue = Math.random();
    const { r, g, b } = hsvToRgb(hue, 0.85, 1.0);
    this.color = { r, g, b };

    // 火箭（上升体）
    this.rocket = {
      x, y,
      vx: randRange(-40, 40),
      vy: randRange(-380, -280), // 向上
      life: this.stageTimes.preburst,
      size: 2.5,
    };

    this.sparks = []; // 爆裂粒子
    this.didBurst = false;
  }

  spawnSpark(x, y, speed, angle, life, size) {
    const p = this.pool.alloc();
    if (!p) return;
    p.x = x; p.y = y;
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed;
    p.life = life;
    p.lifeMax = life;
    p.size = size;
    p.r = this.color.r; p.g = this.color.g; p.b = this.color.b;
    p.damping = 0.985;
    p.gravity = Config.gravity;
    this.sparks.push(p);
  }

  burstAt(x, y) {
    // 环形爆裂 + 少量随机度
    const count = 140;
    const minSpeed = 60;
    const maxSpeed = 240;
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const angle = t * Math.PI * 2 + randRange(-0.06, 0.06);
      const speed = randRange(minSpeed, maxSpeed);
      const life = randRange(1.2, 2.0);
      const size = randRange(1.2, 2.8);
      this.spawnSpark(x, y, speed, angle, life, size);
    }
  }

  update(dt, now) {
    this.elapsed = (now - this.startTime) / 1000;
    const t = this.elapsed;

    // 更新火箭
    if (t < this.stageTimes.preburst && this.rocket) {
      const r = this.rocket;
      r.vy += Config.gravity * dt * 0.25; // 轻微重力，逐渐上升到顶点
      r.x += r.vx * dt;
      r.y += r.vy * dt;
      r.life -= dt;
    }

    // 进入爆裂
    if (!this.didBurst && t >= this.stageTimes.preburst) {
      const rx = this.rocket ? this.rocket.x : this.x;
      const ry = this.rocket ? this.rocket.y : this.y;
      this.burstAt(rx, ry);
      this.didBurst = true;
      this.rocket = null; // 移除火箭
    }

    // 更新火花
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const p = this.sparks[i];
      // 物理
      p.vx *= p.damping;
      p.vy = p.vy * p.damping + p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        // 回收到池
        const last = this.sparks.pop();
        if (last !== p) {
          this.sparks[i] = last;
        }
        this.pool.release(p);
      }
    }

    if (t >= this.stageTimes.end && this.sparks.length === 0) {
      this.alive = false;
    }
  }

  render(renderer) {
    // 绘制火箭（小点）
    if (this.rocket) {
      const r = this.rocket;
      const alpha = Math.max(0, Math.min(1, r.life / this.stageTimes.preburst));
      renderer.drawParticle(r.x, r.y, r.size, this.color.r, this.color.g, this.color.b, alpha * 0.9);
    }
    // 绘制火花
    for (let i = 0; i < this.sparks.length; i++) {
      const p = this.sparks[i];
      const alpha = Math.max(0, p.life / p.lifeMax);
      const radius = p.size * (0.6 + 0.8 * alpha); // 逐渐缩小
      renderer.drawParticle(p.x, p.y, radius, p.r, p.g, p.b, alpha);
    }
  }

  particleCount() {
    return this.sparks.length + (this.rocket ? 1 : 0);
  }
}

