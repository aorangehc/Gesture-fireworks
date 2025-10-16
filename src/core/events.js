// 预留轻量事件总线（当前仅用于手势触发→特效）
export class EventBus {
  constructor() { this.listeners = new Map(); }
  on(type, fn) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(fn);
    return () => this.off(type, fn);
  }
  off(type, fn) { this.listeners.get(type)?.delete(fn); }
  emit(type, payload) {
    const set = this.listeners.get(type); if (!set) return;
    for (const fn of set) fn(payload);
  }
}

