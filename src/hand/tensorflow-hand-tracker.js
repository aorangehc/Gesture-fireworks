// TensorFlow.js HandPose 手势追踪器 - 更稳定的手势识别方案

export class TensorFlowHandTracker {
  constructor(videoEl, options = {}) {
    this.video = videoEl;
    this.options = {
      maxHands: options.maxHands || 2,
      flipHorizontal: options.flipHorizontal !== false, // 默认水平翻转
      ...options
    };
    this.model = null;
    this.available = false;
    this.latest = [];
    this._busy = false;
  }

  async init() {
    try {
      // 动态加载 TensorFlow.js 和 HandPose 模型
      if (!window.tf) {
        await this._loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.15.0/dist/tf.min.js');
      }
      if (!window.handPoseDetection) {
        await this._loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/hand-pose-detection@2.1.0/dist/hand-pose-detection.min.js');
      }

      // 创建 MediaPipe Hands 检测器
      this.model = await window.handPoseDetection.createDetector(
        window.handPoseDetection.SupportedModels.MediaPipeHands,
        {
          runtime: 'mediapipe',
          solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915',
          maxHands: this.options.maxHands,
          modelComplexity: 1
        }
      );

      this.available = true;
      console.log('TensorFlow.js HandPose 模型加载成功');
      return true;
    } catch (error) {
      console.warn('TensorFlow.js HandPose 加载失败:', error);
      this.available = false;
      return false;
    }
  }

  async update() {
    if (!this.available || !this.model || this._busy) {
      return this.latest;
    }

    try {
      this._busy = true;
      const predictions = await this.model.estimateHands(this.video, {
        flipHorizontal: this.options.flipHorizontal
      });

      // 转换为统一格式
      this.latest = predictions.map(hand => ({
        landmarks: hand.keypoints.map(kp => ({
          x: kp.x / this.video.videoWidth,
          y: kp.y / this.video.videoHeight,
          z: kp.z || 0
        })),
        handedness: hand.handedness || 'Unknown',
        score: hand.score || 0
      }));

      return this.latest;
    } catch (error) {
      console.warn('手势检测失败:', error);
      return this.latest;
    } finally {
      this._busy = false;
    }
  }

  _loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
}

// 空实现作为后备
class NullTracker {
  constructor() { 
    this.available = false; 
    this.latest = [];
  }
  async init() { return false; }
  async update() { return []; }
}

// 工厂函数
export async function createHandTracker(videoEl, options = {}) {
  const tracker = new TensorFlowHandTracker(videoEl, options);
  const success = await tracker.init();
  
  if (success) {
    return tracker;
  } else {
    console.warn('回退到空手势追踪器');
    return new NullTracker();
  }
}