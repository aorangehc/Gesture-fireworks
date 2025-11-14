import { Config } from './config.js';
import { Canvas2DRenderer } from './render/canvas2d.js';
import { ParticlePool } from './effects/particles/pool.js';
import { EffectManager } from './effects/effect-manager.js';
import { FireworkA } from './effects/fireworkA.js';
import { FireworkB } from './effects/fireworkB.js';
import { FireworkCircle } from './effects/fireworkCircle.js';
import { FireworkUmbrella } from './effects/fireworkUmbrella.js';
import { FireworkHeart } from './effects/fireworkHeart.js';
import { FireworkStar } from './effects/fireworkStar.js';
import { FireworkSpiral } from './effects/fireworkSpiral.js';
import { FireworkBurst } from './effects/fireworkBurst.js';
import { DebugOverlay } from './debug/overlay.js';
import { Camera } from './camera/camera.js';
import { createHandTracker } from './hand/hand-tracker.js';
import { AdvancedGestureRecognizer } from './hand/advanced-gesture.js';
import { GestureDisplay } from './ui/gestureDisplay.js';

const app = {
  start() {
    this.effectsCanvas = document.getElementById('effects');
    this.debugCanvas = document.getElementById('debug');
    this.video = document.getElementById('video');

    this.renderer = new Canvas2DRenderer(this.effectsCanvas, { backgroundFade: Config.backgroundFade });
    this.overlay = new DebugOverlay(this.debugCanvas);

    this.pool = new ParticlePool(Config.poolSize);
    this.manager = new EffectManager({ pool: this.pool });

    // 摄像头与手势
    this.camera = new Camera(this.video, { mirror: true });
    this.gestureRecognizer = new AdvancedGestureRecognizer({ 
      stableFrames: 6, 
      cooldownMs: 350,
      confidenceThreshold: 0.8,
      smoothingFrames: 10,
      holdToRepeat: false,
      stabilityFrames: 6
    });
    
    // 设置手势检测回调
    this.gestureRecognizer.onGestureDetected = (gesture, confidence, handIndex) => {
      // 获取手势对应的指尖位置
      const hands = this._latestHands || [];
      if (handIndex >= hands.length) return;
      
      const landmarks = hands[handIndex].landmarks;
      if (!landmarks) return;
      
      // 根据手势类型获取对应的指尖位置
      let tipIndex = 8; // 默认使用食指指尖
      switch (gesture) {
        case 'THUMBS_UP':
          tipIndex = 4; // 拇指指尖
          break;
        case 'POINTING':
          tipIndex = 8; // 食指指尖
          break;
        case 'PEACE':
          tipIndex = 12; // 中指指尖
          break;
        default:
          tipIndex = 9; // 中指中间关节作为手掌中心
          break;
      }
      
      const tip = landmarks[tipIndex];
      if (!tip) return;
      
      const cw = this.effectsCanvas.width / (window.devicePixelRatio || 1);
      const ch = this.effectsCanvas.height / (window.devicePixelRatio || 1);
      const pt = this.camera.mapNormToCanvas(tip.x, tip.y, cw, ch);
      
      // 根据不同手势触发不同特效
      switch (gesture) {
        case 'FIST':
          this.triggerEffectBurst(pt.x, pt.y, { particleCount: 140, duration: 4.0, colors: [[255, 220, 0],[255, 180, 50],[255, 240, 150]] });
          break;
        case 'OK':
          this.triggerEffectCircle(pt.x, pt.y, { rings: 2, count: 140, colors: [ { r: 255, g: 80, b: 80 }, { r: 255, g: 140, b: 60 }, { r: 255, g: 200, b: 80 } ] });
          break;
        case 'HEART':
          this.triggerEffectHeart(pt.x, pt.y, { particleCount: 90 });
          break;
        case 'THUMBS_UP':
          this.triggerEffectStar(pt.x, pt.y, { particleCount: 70, colors: [[255,255,120],[255,230,80],[255,255,255]] });
          break;
        case 'PEACE':
          this.triggerEffectSpiral(pt.x, pt.y, { particleCount: 110, colors: [[160,120,255],[120,80,220],[200,160,255]] });
          break;
        case 'POINTING':
          this.triggerEffectUmbrella(pt.x, pt.y, { particleCount: 45, colors: [[40,140,255],[0,100,200],[80,180,255]] });
          break;
        case 'OPEN_PALM':
          this.triggerEffectA(pt.x, pt.y);
          break;
        default:
          // 保持原有的ONE/TWO手势兼容性
          if (gesture === 'ONE') this.triggerEffectA(pt.x, pt.y);
          else if (gesture === 'TWO') this.triggerEffectB(pt.x, pt.y);
          break;
      }
      
      // 更新手势显示
      this.gestureDisplay.updateGesture(handIndex, gesture, confidence, pt);
    };
    
    // 初始化手势显示系统
    this.gestureDisplay = new GestureDisplay(this.effectsCanvas);
    
    this.hands = null;

    this._resize = this._resize.bind(this);
    window.addEventListener('resize', this._resize);
    this._resize();

    this._bindInputs();

    this._lastTime = performance.now();
    this._lastDetect = 0;
    this._detectInterval = 1000 / 30; // 30 FPS 手势推理
    this._loop = this._loop.bind(this);

    this._initIO().then(() => {
      requestAnimationFrame(this._loop);
    });
  },

  async _initIO() {
    try {
      await this.camera.start({ fps: 30, width: 1280, height: 720 });
    } catch (e) {
      console.warn('摄像头开启失败:', e);
    }
    this.hands = await createHandTracker(this.video, { maxHands: 2, modelComplexity: 1, minDetectionConfidence: 0.8, minTrackingConfidence: 0.7 });
  },

  _resize() {
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.renderer.resize(width, height, dpr);
    this.overlay.resize(width, height, dpr);
  },

  _bindInputs() {
    const canvas = this.effectsCanvas;
    canvas.addEventListener('pointerdown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const x = (e.clientX - rect.left) * dpr;
      const y = (e.clientY - rect.top) * dpr;
      this.triggerEffectA(x / dpr, y / dpr); // 坐标按 CSS 像素传入，renderer 内部有 dpr 变换
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'd' || e.key === 'D') {
        this.overlay.toggle();
      }
    });
  },

  triggerEffectA(x, y, options = {}) {
    this.manager.spawn(new FireworkA(x, y, performance.now(), this.pool, options));
  },
  triggerEffectB(x, y, options = {}) {
    this.manager.spawn(new FireworkB(x, y, performance.now(), this.pool, options));
  },
  triggerEffectCircle(x, y, options = {}) {
    this.manager.spawn(new FireworkCircle(x, y, performance.now(), this.pool, options));
  },
  triggerEffectUmbrella(x, y, options = {}) {
    this.manager.spawn(new FireworkUmbrella(x, y, performance.now(), this.pool, options));
  },
  triggerEffectHeart(x, y, options = {}) {
    this.manager.spawn(new FireworkHeart(x, y, performance.now(), this.pool, options));
  },
  triggerEffectStar(x, y, options = {}) {
    this.manager.spawn(new FireworkStar(x, y, performance.now(), this.pool, options));
  },
  triggerEffectSpiral(x, y, options = {}) {
    this.manager.spawn(new FireworkSpiral(x, y, performance.now(), this.pool, options));
  },
  triggerEffectBurst(x, y, options = {}) {
    this.manager.spawn(new FireworkBurst(x, y, performance.now(), this.pool, options));
  },

  _loop(now) {
    const dt = Math.min(0.05, (now - this._lastTime) / 1000); // 限制最大步长，防止切换标签导致爆发
    this._lastTime = now;

    // 更新
    this.manager.update(dt, now);
    this.overlay.update();

    // 手势检测（降频）
    const needDetect = (now - this._lastDetect) >= this._detectInterval;
    if (needDetect && this.hands) {
      this._lastDetect = now;
      this.hands.update().then((hands) => {
        // 更新手势显示
        if (hands && hands.length > 0) {
          hands.forEach((hand, index) => {
            const gesture = this.gestureRecognizer.recognizeGesture(hand.landmarks);
            if (gesture.gesture !== 'NONE') {
              // 计算手的中心位置
              const centerX = hand.landmarks.reduce((sum, p) => sum + p.x, 0) / hand.landmarks.length;
              const centerY = hand.landmarks.reduce((sum, p) => sum + p.y, 0) / hand.landmarks.length;
              
              // 转换到画布坐标
              const cw = this.effectsCanvas.width / (window.devicePixelRatio || 1);
              const ch = this.effectsCanvas.height / (window.devicePixelRatio || 1);
              const canvasPos = this.camera.mapNormToCanvas(centerX, centerY, cw, ch);
              
              this.gestureDisplay.updateGesture(index, gesture.gesture, gesture.confidence, canvasPos);
            }
          });
        }
        
        // 触发逻辑（更新手势识别器）
        const handsData = hands.map(hand => hand.landmarks);
        this.gestureRecognizer.update(handsData, performance.now());
        this._latestHands = hands; // 调试绘制
      });
    }

    // 更新手势显示
    this.gestureDisplay.update();

    // 渲染
    this.renderer.clear(false);
    this.manager.render(this.renderer);
    
    // 渲染手势显示 - 暂时注释掉，不显示标签
    // this.gestureDisplay.render();
    
    this.overlay.render({
      instances: this.manager.instanceCount(),
      particles: this.pool.activeCount(),
    }, (ctx) => {
      // 调试：绘制关键点
      const hands = this._latestHands || [];
      const cw = this.effectsCanvas.width / (window.devicePixelRatio || 1);
      const ch = this.effectsCanvas.height / (window.devicePixelRatio || 1);
      ctx.save();
      for (const h of hands) {
        for (let i = 0; i < (h.landmarks?.length || 0); i++) {
          const lm = h.landmarks[i];
          const p = this.camera.mapNormToCanvas(lm.x, lm.y, cw, ch);
          ctx.fillStyle = '#44f6';
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    });

    requestAnimationFrame(this._loop);
  }
};

window.addEventListener('DOMContentLoaded', () => app.start());
// 便于控制台调试
window.__app = app;
