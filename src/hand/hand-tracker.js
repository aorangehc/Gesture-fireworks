// 手部追踪封装：优先尝试 MediaPipe Hands（本地 vendor/mediapipe/），否则回退为空实现

async function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = (e) => reject(e);
    document.head.appendChild(s);
  });
}

class NullTracker {
  constructor() { this.available = false; }
  async init() { return false; }
  async update() { return []; }
}

export class MediaPipeHandsTracker {
  constructor(videoEl, { maxHands = 2, modelComplexity = 1, minDetectionConfidence = 0.6, minTrackingConfidence = 0.5 } = {}) {
    this.video = videoEl;
    this.options = { maxHands, modelComplexity, minDetectionConfidence, minTrackingConfidence };
    this.hands = null;
    this.available = false;
    this.latest = null;
    this._busy = false;
  }

  async init() {
    // 尝试加载 vendor 内的 hands.js（旧版 Solutions API）
    if (!window.Hands) {
      try {
        await loadScript('./vendor/mediapipe/hands.js');
      } catch (e) {
        console.warn('未找到 vendor/mediapipe/hands.js，手势追踪不可用');
        this.available = false;
        return false;
      }
    }
    try {
      this.hands = new window.Hands({
        locateFile: (file) => `./vendor/mediapipe/${file}`,
      });
      this.hands.setOptions({
        maxNumHands: this.options.maxHands,
        modelComplexity: this.options.modelComplexity,
        minDetectionConfidence: this.options.minDetectionConfidence,
        minTrackingConfidence: this.options.minTrackingConfidence,
      });
      this.hands.onResults((res) => {
        this.latest = res;
      });
      this.available = true;
      return true;
    } catch (e) {
      console.error('初始化 MediaPipe Hands 失败:', e);
      this.available = false;
      return false;
    }
  }

  async update() {
    if (!this.available || !this.hands) return [];
    if (this._busy) return this._normalize(this.latest);
    this._busy = true;
    try {
      await this.hands.send({ image: this.video });
    } catch (e) {
      // 忽略帧级错误，避免中断
    } finally {
      this._busy = false;
    }
    return this._normalize(this.latest);
  }

  _normalize(res) {
    if (!res || !res.multiHandLandmarks) return [];
    const hands = [];
    const landmarksArr = res.multiHandLandmarks;
    const handedArr = res.multiHandedness || [];
    for (let i = 0; i < landmarksArr.length; i++) {
      const lm = landmarksArr[i];
      const handed = handedArr[i] && handedArr[i].label ? handedArr[i].label : null;
      hands.push({ handedness: handed, landmarks: lm });
    }
    return hands;
  }
}

export async function createHandTracker(videoEl, opts) {
  const tracker = new MediaPipeHandsTracker(videoEl, opts);
  const ok = await tracker.init();
  if (!ok) return new NullTracker();
  return tracker;
}

