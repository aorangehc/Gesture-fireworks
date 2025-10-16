// 手势分类与去抖动：
// - ONE: 仅食指伸直
// - TWO: 食指与中指伸直（优先级高于 ONE）

function fingerIsUp(landmarks, tipIndex, pipIndex) {
  // 在前置摄像头里，y 向下；手指伸直时 tip.y 明显小于 pip.y
  const tip = landmarks[tipIndex];
  const pip = landmarks[pipIndex];
  if (!tip || !pip) return false;
  const threshold = 0.02; // 经验阈值，配合稳定窗口
  return (pip.y - tip.y) > threshold;
}

export function classifyHand(landmarks) {
  if (!landmarks || landmarks.length < 21) return { label: null, fingers: {} };
  const indexUp = fingerIsUp(landmarks, 8, 6);
  const middleUp = fingerIsUp(landmarks, 12, 10);
  const ringUp = fingerIsUp(landmarks, 16, 14);
  const pinkyUp = fingerIsUp(landmarks, 20, 18);
  let label = null;
  if (indexUp && middleUp && !ringUp && !pinkyUp) label = 'TWO';
  else if (indexUp && !middleUp && !ringUp && !pinkyUp) label = 'ONE';
  return { label, fingers: { indexUp, middleUp, ringUp, pinkyUp } };
}

export function indexTip(landmarks) {
  return landmarks && landmarks[8] ? landmarks[8] : null;
}

// 简易稳定/冷却调度器（按手别 Left/Right 区分）
export class GestureDispatcher {
  constructor({ stableFrames = 3, cooldownMs = 250 } = {}) {
    this.stableFrames = stableFrames;
    this.cooldownMs = cooldownMs;
    this.state = new Map(); // key: handKey -> { counters:{ONE,TWO}, active:{ONE,TWO}, last:{ONE,TWO} }
  }

  _ensure(handKey) {
    if (!this.state.has(handKey)) {
      this.state.set(handKey, {
        counters: { ONE: 0, TWO: 0 },
        active: { ONE: false, TWO: false },
        last: { ONE: 0, TWO: 0 },
      });
    }
    return this.state.get(handKey);
  }

  // hands: [{handedness:'Left'|'Right'|null, landmarks:[{x,y}] }]
  // onTrigger: ({gesture, hand, tip}) => void
  update(hands, nowMs, onTrigger) {
    for (const h of hands) {
      const key = h.handedness || 'Unknown';
      const s = this._ensure(key);
      const { label } = classifyHand(h.landmarks);
      // 只允许 ONE 或 TWO 一次成立
      const flags = { ONE: label === 'ONE', TWO: label === 'TWO' };
      for (const g of ['ONE', 'TWO']) {
        if (flags[g]) s.counters[g]++; else s.counters[g] = 0;
        const stable = s.counters[g] >= this.stableFrames;
        if (stable && !s.active[g] && (nowMs - s.last[g] > this.cooldownMs)) {
          s.active[g] = true;
          s.last[g] = nowMs;
          onTrigger({ gesture: g, hand: key, tip: indexTip(h.landmarks) });
        }
        if (!flags[g]) s.active[g] = false;
      }
    }
  }
}

