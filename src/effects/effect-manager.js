import { Config } from "../config.js";

export class EffectManager {
  constructor({ pool }) {
    this.effects = [];
    this.pool = pool;
  }

  spawn(effect) {
    // 并发上限控制
    if (this.effects.length >= Config.maxInstances) {
      // 移除最早的一个实例
      this.effects.shift();
    }
    // 兼容新老特效：如有 init，则在加入前初始化
    if (typeof effect.init === 'function') {
      try { effect.init(); } catch (e) { /* 忽略初始化错误以不阻塞 */ }
    }
    this.effects.push(effect);
  }

  update(dt, now) {
    const list = this.effects;
    for (let i = list.length - 1; i >= 0; i--) {
      const e = list[i];
      e.update(dt, now);
      if (!e.isAlive()) {
        list.splice(i, 1);
      }
    }
  }

  render(renderer) {
    const list = this.effects;
    for (let i = 0; i < list.length; i++) {
      list[i].render(renderer);
    }
  }

  instanceCount() { return this.effects.length; }
  particleCount() {
    let sum = 0;
    for (let i = 0; i < this.effects.length; i++) sum += this.effects[i].particleCount();
    return sum;
  }
}

