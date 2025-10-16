// 手势识别反馈显示系统

export class GestureDisplay {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.gestures = new Map(); // 存储每只手的手势信息
    this.fadeTime = 2000; // 手势显示淡出时间（毫秒）
    
    // 手势名称映射
    this.gestureNames = {
      'FIST': '拳头',
      'OK': 'OK手势',
      'HEART': '爱心',
      'THUMBS_UP': '点赞',
      'PEACE': '胜利',
      'POINTING': '指向',
      'OPEN_PALM': '张开手掌',
      'NONE': '无手势'
    };
    
    // 手势颜色映射
    this.gestureColors = {
      'FIST': { r: 255, g: 100, b: 100 },
      'OK': { r: 100, g: 255, b: 100 },
      'HEART': { r: 255, g: 100, b: 255 },
      'THUMBS_UP': { r: 100, g: 100, b: 255 },
      'PEACE': { r: 255, g: 255, b: 100 },
      'POINTING': { r: 255, g: 150, b: 100 },
      'OPEN_PALM': { r: 150, g: 255, b: 150 },
      'NONE': { r: 128, g: 128, b: 128 }
    };
  }

  // 更新手势信息
  updateGesture(handIndex, gesture, confidence, position) {
    const now = performance.now();
    
    this.gestures.set(handIndex, {
      gesture: gesture,
      confidence: confidence,
      position: position,
      timestamp: now,
      displayTime: now
    });
  }

  // 更新显示
  update() {
    const now = performance.now();
    
    // 清理过期的手势
    for (const [handIndex, gestureInfo] of this.gestures.entries()) {
      if (now - gestureInfo.timestamp > this.fadeTime) {
        this.gestures.delete(handIndex);
      }
    }
  }

  // 渲染手势信息
  render() {
    const now = performance.now();
    
    this.ctx.save();
    
    // 设置字体
    this.ctx.font = 'bold 16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // 渲染每只手的手势信息
    for (const [handIndex, gestureInfo] of this.gestures.entries()) {
      if (gestureInfo.gesture === 'NONE') continue;
      
      const fadeProgress = Math.max(0, 1 - (now - gestureInfo.timestamp) / this.fadeTime);
      const alpha = fadeProgress * 0.9;
      
      if (alpha <= 0) continue;
      
      // 位置已在主循环从归一化映射为画布坐标（CSS像素），此处直接使用
      const x = gestureInfo.position.x;
      const y = gestureInfo.position.y;
      
      // 获取手势颜色
      const color = this.gestureColors[gestureInfo.gesture] || this.gestureColors['NONE'];
      
      // 绘制背景圆圈
      this.ctx.globalAlpha = alpha * 0.3;
      this.ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 1)`;
      this.ctx.beginPath();
      this.ctx.arc(x, y - 40, 35, 0, Math.PI * 2);
      this.ctx.fill();
      
      // 绘制边框
      this.ctx.globalAlpha = alpha * 0.8;
      this.ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 1)`;
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.arc(x, y - 40, 35, 0, Math.PI * 2);
      this.ctx.stroke();
      
      // 绘制手势名称
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = 'white';
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      this.ctx.shadowBlur = 4;
      this.ctx.shadowOffsetX = 1;
      this.ctx.shadowOffsetY = 1;
      
      const gestureName = this.gestureNames[gestureInfo.gesture] || gestureInfo.gesture;
      this.ctx.fillText(gestureName, x, y - 50);
      
      // 绘制置信度
      this.ctx.font = 'bold 12px Arial';
      const confidenceText = `${Math.round(gestureInfo.confidence * 100)}%`;
      this.ctx.fillText(confidenceText, x, y - 30);
      
      // 绘制手的索引
      this.ctx.font = 'bold 10px Arial';
      this.ctx.fillText(`手 ${handIndex + 1}`, x, y - 15);
      
      // 重置阴影
      this.ctx.shadowColor = 'transparent';
      this.ctx.shadowBlur = 0;
      this.ctx.shadowOffsetX = 0;
      this.ctx.shadowOffsetY = 0;
      
      // 绘制置信度条
      this.renderConfidenceBar(x, y + 10, gestureInfo.confidence, color, alpha);
      
      // 绘制脉冲效果
      if (now - gestureInfo.displayTime < 500) {
        this.renderPulseEffect(x, y - 40, now - gestureInfo.displayTime, color, alpha);
      }
    }
    
    this.ctx.restore();
  }

  // 渲染置信度条
  renderConfidenceBar(x, y, confidence, color, alpha) {
    const barWidth = 60;
    const barHeight = 6;
    
    // 背景条
    this.ctx.globalAlpha = alpha * 0.3;
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.fillRect(x - barWidth / 2, y, barWidth, barHeight);
    
    // 置信度条
    this.ctx.globalAlpha = alpha * 0.8;
    const confidenceWidth = barWidth * confidence;
    
    // 渐变填充
    const gradient = this.ctx.createLinearGradient(x - barWidth / 2, y, x + barWidth / 2, y);
    gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, 0.8)`);
    gradient.addColorStop(1, `rgba(${Math.min(255, color.r + 50)}, ${Math.min(255, color.g + 50)}, ${Math.min(255, color.b + 50)}, 1)`);
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(x - barWidth / 2, y, confidenceWidth, barHeight);
    
    // 边框
    this.ctx.globalAlpha = alpha;
    this.ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 1)`;
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x - barWidth / 2, y, barWidth, barHeight);
  }

  // 渲染脉冲效果
  renderPulseEffect(x, y, elapsed, color, alpha) {
    const maxRadius = 50;
    const duration = 500;
    const progress = elapsed / duration;
    
    if (progress >= 1) return;
    
    const radius = maxRadius * progress;
    const pulseAlpha = alpha * (1 - progress) * 0.5;
    
    this.ctx.globalAlpha = pulseAlpha;
    this.ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 1)`;
    this.ctx.lineWidth = 3 * (1 - progress);
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.stroke();
  }

  // 渲染统计信息
  renderStats() {
    const activeGestures = Array.from(this.gestures.values())
      .filter(g => g.gesture !== 'NONE');
    
    if (activeGestures.length === 0) return;
    
    this.ctx.save();
    
    // 背景
    this.ctx.globalAlpha = 0.7;
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(10, 10, 200, 30 + activeGestures.length * 20);
    
    // 标题
    this.ctx.globalAlpha = 1;
    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('当前识别手势:', 20, 30);
    
    // 手势列表
    this.ctx.font = '12px Arial';
    activeGestures.forEach((gestureInfo, index) => {
      const y = 50 + index * 20;
      const gestureName = this.gestureNames[gestureInfo.gesture] || gestureInfo.gesture;
      const confidenceText = `${Math.round(gestureInfo.confidence * 100)}%`;
      
      this.ctx.fillText(`手${Array.from(this.gestures.keys())[index] + 1}: ${gestureName} (${confidenceText})`, 20, y);
    });
    
    this.ctx.restore();
  }

  // 清除所有手势显示
  clear() {
    this.gestures.clear();
  }

  // 获取当前活跃手势数量
  getActiveGestureCount() {
    return Array.from(this.gestures.values())
      .filter(g => g.gesture !== 'NONE').length;
  }
}