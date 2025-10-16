# 🎆 手势烟花 - Gesture Fireworks

一个基于AI手势识别的交互式烟花特效应用，通过摄像头实时捕捉用户手势，触发绚丽的烟花效果。支持多手同时识别，让你的双手在空中绘制出美丽的烟花盛宴！

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-MediaPipe-orange.svg)](https://www.tensorflow.org/js)
[![Version](https://img.shields.io/badge/Version-1.0.0-blue.svg)](https://github.com/your-username/Gesture-fireworks/releases)

## ✨ 核心特性

- 🤖 **AI手势识别**：基于MediaPipe的高精度手势识别，支持8种不同手势
- 🎆 **绚丽烟花特效**：8种精美烟花效果，包括爆炸、心形、星形、螺旋等
- 👥 **多手支持**：同时识别双手手势，支持多手势并发触发，独立冷却机制
- 📹 **实时摄像头**：流畅的摄像头画面，智能镜像显示
- 🚀 **高性能渲染**：优化的Canvas 2D粒子系统，支持数千粒子同时渲染
- 🎨 **增强视觉效果**：多层光晕、粒子闪烁、动态颜色、拖尾效果
- 🔧 **智能算法**：多帧平滑、稳定性检测、动态置信度、冷却机制
- 📱 **响应式设计**：自适应不同屏幕尺寸，支持移动端和桌面端

## 🎮 手势对应效果

| 手势 | 烟花效果 | 描述 | 特色 |
|------|----------|------|------|
| ✊ 拳头 | 圆形烟花 | 经典的圆形爆炸效果 | 多环扩散，渐变色彩 |
| 👌 OK手势 | 伞形烟花 | 伞状散开，带有下落雨滴效果 | 优雅下落，重力模拟 |
| 💖 比心 | 心形烟花 | 浪漫的心形粒子轨迹 | 粉色系，闪烁效果 |
| 👍 竖拇指 | 星形烟花 | 五角星形状爆炸 | 金色系，闪烁动画 |
| ✌️ 剪刀手 | 螺旋烟花 | 螺旋上升的粒子轨迹 | 彩虹色，螺旋运动 |
| 👉 指向 | 爆炸烟花 | 多层圆形爆炸效果 | 四层扩散，彩色粒子 |
| ✋ 张开手掌 | 伞形烟花 | 大范围的伞状散开效果 | 宽幅覆盖，渐变消散 |
| 🤟 摇滚手势 | 星形烟花 | 炫酷的星形爆炸 | 炫彩色，强烈闪烁 |

## 🚀 快速开始

### 环境要求

- 现代浏览器（Chrome 88+、Firefox 85+、Safari 14+、Edge 88+）
- 摄像头设备（支持WebRTC）
- 本地HTTP服务器（用于摄像头权限）
- 网络连接（首次加载MediaPipe模型）

### 安装运行

1. **克隆项目**
   ```bash
   git clone https://github.com/your-username/Gesture-fireworks.git
   cd Gesture-fireworks
   ```

2. **启动本地服务器**
   
   使用Python（推荐）：
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   ```
   
   或使用Node.js：
   ```bash
   npx http-server -p 8000 -a localhost
   ```

3. **打开浏览器**
   
   访问 `http://localhost:8000`

4. **授权摄像头**
   
   首次访问时，浏览器会请求摄像头权限，请点击"允许"

## 🎯 使用方法

1. **准备姿势**：站在摄像头前，确保手部清晰可见
2. **做出手势**：参考上方手势表格，做出对应手势
3. **观看烟花**：系统识别手势后会自动触发相应的烟花效果
4. **多手操作**：可以同时使用双手做不同手势，触发多重烟花效果

### 使用技巧

- 🔆 **光线充足**：确保环境光线良好，避免背光和强烈阴影
- 📏 **适当距离**：保持与摄像头1-2米的距离，手部占画面1/4左右
- 🤚 **手势清晰**：做手势时动作要清晰、稳定，保持1-2秒
- ⏱️ **等待识别**：每个手势有250ms冷却时间，避免过快切换
- 🎯 **居中显示**：将手部保持在画面中央区域效果最佳
- 👥 **多手操作**：双手可以同时做不同手势，创造组合烟花效果

## 🏗️ 项目结构

```
Gesture-fireworks/
├── index.html              # 主页面入口
├── LICENSE                 # MIT许可证
├── README.md              # 项目说明文档
├── src/
│   ├── main.js            # 应用入口和主循环
│   ├── config.js          # 全局配置文件
│   ├── hand/              # 手势识别模块
│   │   ├── tensorflow-hand-tracker.js  # TensorFlow.js手部追踪
│   │   ├── advanced-gesture.js         # 高级手势识别（多手支持）
│   │   ├── gesture.js                  # 基础手势识别
│   │   └── hand-tracker.js             # 手部追踪管理
│   ├── effects/           # 烟花特效系统
│   │   ├── base-effect.js             # 基础特效类
│   │   ├── effect-manager.js          # 特效管理器
│   │   ├── enhancedParticleSystem.js  # 增强粒子系统
│   │   ├── fireworkCircle.js          # 圆形烟花
│   │   ├── fireworkUmbrella.js        # 伞形烟花
│   │   ├── fireworkHeart.js           # 心形烟花
│   │   ├── fireworkStar.js            # 星形烟花
│   │   ├── fireworkSpiral.js          # 螺旋烟花
│   │   ├── fireworkBurst.js           # 爆炸烟花
│   │   ├── fireworkA.js               # 特效A
│   │   ├── fireworkB.js               # 特效B
│   │   └── particles/                 # 粒子相关
│   ├── render/            # 渲染系统
│   │   └── canvas2d.js    # Canvas 2D渲染器（增强版）
│   ├── camera/            # 摄像头模块
│   │   └── camera.js      # 摄像头管理
│   ├── ui/                # 用户界面
│   │   └── gestureDisplay.js  # 手势显示组件
│   ├── core/              # 核心模块
│   │   └── events.js      # 事件系统
│   ├── debug/             # 调试工具
│   │   └── overlay.js     # 调试覆盖层
│   └── utils/             # 工具函数
│       └── math.js        # 数学工具
└── vendor/                # 第三方库
    └── mediapipe/         # MediaPipe相关文件
        ├── hands.js       # MediaPipe Hands模型
        └── ...            # 其他模型文件
```

## 🔧 技术栈

- **手势识别**：MediaPipe Hands + TensorFlow.js
- **渲染引擎**：Canvas 2D API + 自定义粒子系统
- **摄像头**：WebRTC getUserMedia API
- **粒子系统**：高性能对象池 + 多层渲染
- **架构模式**：ES6模块化 + 面向对象设计
- **性能优化**：RAF动画循环 + 内存池管理

## ⚙️ 配置选项

可以在 `src/config.js` 和 `src/main.js` 中调整以下参数：

```javascript
// 手势识别配置
const gestureRecognizer = new AdvancedGestureRecognizer({
  stableFrames: 3,           // 稳定帧数（防抖动）
  cooldownMs: 250,           // 冷却时间(毫秒)
  confidenceThreshold: 0.7,  // 置信度阈值
  smoothingFrames: 5         // 平滑帧数
});

// 渲染配置
const renderer = new Canvas2DRenderer(effectsCanvas, {
  backgroundFade: 0.05,      // 背景淡化速度
  particleGlow: true,        // 粒子光晕效果
  trailEffect: true          // 拖尾效果
});

// 烟花效果配置
const fireworkOptions = {
  particleCount: 60,         // 粒子数量
  duration: 3.0,             // 持续时间
  colors: [...],             // 颜色配置
  size: { min: 2, max: 5 }   // 粒子大小范围
};
```

## 🎨 烟花效果详解

### 增强的视觉效果
- **多层光晕**：每个粒子都有多层渐变光晕
- **闪烁动画**：星形粒子具有动态闪烁效果
- **颜色渐变**：粒子在生命周期中颜色平滑过渡
- **拖尾效果**：快速移动的粒子留下美丽轨迹
- **重力模拟**：真实的物理重力和阻力效果

### 性能优化
- **对象池**：复用粒子对象，减少GC压力
- **批量渲染**：优化Canvas绘制调用
- **视锥剔除**：屏幕外粒子自动剔除
- **自适应质量**：根据设备性能调整粒子数量

## 🐛 故障排除

### 摄像头问题
- **黑屏**：检查摄像头权限，刷新页面重新授权
- **画面消失**：确保使用HTTP/HTTPS协议，不要直接打开HTML文件
- **镜像显示**：这是正常的，便于用户做手势
- **延迟高**：关闭其他占用摄像头的应用程序

### 手势识别问题
- **识别不准**：改善光线条件，调整手势位置到画面中央
- **反应迟钝**：降低 `confidenceThreshold` 值（0.5-0.8）
- **误触发**：增加 `cooldownMs` 时间（200-500ms）
- **多手冲突**：确保双手手势清晰分离，避免重叠

### 性能问题
- **卡顿**：降低粒子数量，关闭光晕效果
- **内存占用高**：刷新页面重置粒子池
- **加载慢**：检查网络连接，MediaPipe模型需要在线加载

### 浏览器兼容性
- **Safari**：确保版本14+，可能需要手动启用WebRTC
- **移动端**：性能较低，建议降低粒子数量
- **Firefox**：某些版本可能需要手动启用摄像头权限

## 🔄 版本历史

### v1.0.0 (2024-01-XX)
- ✨ 初始版本发布
- 🤖 集成MediaPipe手势识别
- 🎆 实现8种烟花特效
- 👥 支持多手同时识别
- 🎨 增强粒子视觉效果
- 🚀 性能优化和内存管理

## 🤝 贡献指南

欢迎提交Issue和Pull Request来改进项目！

### 开发环境设置
1. Fork本项目
2. 创建功能分支：`git checkout -b feature/new-feature`
3. 提交更改：`git commit -am 'Add new feature'`
4. 推送分支：`git push origin feature/new-feature`
5. 提交Pull Request

### 贡献方向
- 🎆 新的烟花特效
- 🤚 更多手势识别
- 🎨 视觉效果增强
- 🚀 性能优化
- 📱 移动端适配
- 🌐 国际化支持

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🎉 致谢

- [MediaPipe](https://mediapipe.dev/) 团队提供的优秀手势识别模型
- [TensorFlow.js](https://www.tensorflow.org/js) 提供的机器学习框架
- Canvas 2D API的强大渲染能力
- 开源社区的支持和贡献

## 🔗 相关链接

- [在线演示](https://your-username.github.io/Gesture-fireworks/)
- [问题反馈](https://github.com/your-username/Gesture-fireworks/issues)
- [功能建议](https://github.com/your-username/Gesture-fireworks/discussions)

---

**享受手势烟花的乐趣吧！** 🎆✨

*让AI识别你的手势，让烟花点亮你的创意！*
