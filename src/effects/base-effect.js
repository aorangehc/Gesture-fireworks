export class BaseEffect {
  constructor(x, y, startTime, opts = {}) {
    this.x = x;
    this.y = y;
    this.startTime = startTime;
    this.alive = true;
    this.opts = opts;
  }

  update(dt, now) {}
  render(renderer) {}
  isAlive() { return this.alive; }
  particleCount() { return 0; }
}

