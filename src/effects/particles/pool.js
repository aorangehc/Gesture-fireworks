export class ParticlePool {
  constructor(capacity = 1000) {
    this.capacity = capacity;
    this.free = [];
    this.store = new Array(capacity);
    for (let i = 0; i < capacity; i++) {
      const p = {
        x: 0, y: 0,
        vx: 0, vy: 0,
        life: 0, lifeMax: 0,
        size: 1,
        r: 255, g: 255, b: 255,
        damping: 0.98,
        gravity: 0,
      };
      this.store[i] = p;
      this.free.push(p);
    }
  }

  alloc() {
    if (this.free.length === 0) return null;
    const p = this.free.pop();
    return p;
  }

  release(p) {
    // 轻量重置，避免大量写操作
    p.life = 0;
    this.free.push(p);
  }

  activeCount() {
    return this.capacity - this.free.length;
  }
}

