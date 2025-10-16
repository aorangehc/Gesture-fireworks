export const Config = {
  // 渲染与画布
  targetFPS: 60,
  backgroundFade: 0.2, // 每帧以该透明度擦除背景，形成拖影
  maxInstances: 12,
  // 粒子与效果
  lifetimeSec: 4.0,
  globalParticleCap: 3000,
  poolSize: 3000, // 预分配粒子池容量
  gravity: 350, // px/s^2
};

