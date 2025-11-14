// 高级手势识别系统 - 支持多种手势类型

export class AdvancedGestureRecognizer {
  constructor(options = {}) {
    this.stableFrames = options.stableFrames || 5; // 增加稳定帧数
    this.cooldownMs = options.cooldownMs || 300; // 减少冷却时间，提高响应性
    this.confidenceThreshold = options.confidenceThreshold || 0.7; // 提高基础置信度
    this.holdToRepeat = options.holdToRepeat || false;
    
    // 新增：多帧平滑和噪声过滤
    this.smoothingFrames = options.smoothingFrames || 8; // 平滑帧数
    this.noiseThreshold = options.noiseThreshold || 0.15; // 噪声阈值
    
    // 修复：为每只手单独维护缓冲区
    this.handBuffers = new Map(); // 每只手的缓冲区 handIndex -> {gestureBuffer, confidenceBuffer}
    
    // 动态置信度阈值
    this.dynamicThresholds = {
      'FIST': 0.85,
      'OK': 0.85,
      'HEART': 0.75,
      'THUMBS_UP': 0.85,
      'PEACE': 0.85,
      'POINTING': 0.85,
      'OPEN_PALM': 0.8
    };
    
    this.history = [];
    this.lastTrigger = new Map();
    this._lastStableByIndex = []; // 每只手的上一个稳定手势
    
    // 新增：手势稳定性跟踪
    this.gestureStability = new Map(); // 跟踪每个手势的稳定性
    
    // 手势历史记录（为每只手单独维护）
    this.gestureHistory = new Map(); // key: handKey, value: gesture history array
    this.historyLength = 10; // 历史记录长度
    
    // 稳定性检测参数
    this.stabilityFrames = options.stabilityFrames || 6;
    
    // 冷却机制
    this.cooldownTime = this.cooldownMs;
    this.lastTriggerTime = new Map(); // 记录每个手势的最后触发时间
    this.lastStableGesture = new Map(); // 记录每只手的最后稳定手势（用于上升沿检测）
  }

  // 识别单个手的手势
  recognizeGesture(landmarks, handIndex = 0) {
    if (!landmarks || landmarks.length < 21) {
      return { gesture: 'NONE', confidence: 0 };
    }

    const gestures = [
      this._detectFist(landmarks),
      this._detectOK(landmarks),
      this._detectHeart(landmarks),
      this._detectThumbsUp(landmarks),
      this._detectPeace(landmarks),
      this._detectPointing(landmarks),
      this._detectOpenPalm(landmarks)
    ];

    // 找到置信度最高的手势
    const bestGesture = gestures.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );
    const secondGesture = gestures
      .filter(g => g.gesture !== bestGesture.gesture)
      .reduce((best, current) => current.confidence > best.confidence ? current : best, { gesture: 'NONE', confidence: 0 });
    const margin = 0.12;
    if (bestGesture.confidence - secondGesture.confidence < margin) {
      return { gesture: 'NONE', confidence: 0 };
    }

    // 使用动态置信度阈值
    const threshold = this.dynamicThresholds[bestGesture.gesture] || this.confidenceThreshold;
    
    // 应用多帧平滑（为每只手单独处理）
    const smoothedGesture = this._applySmoothingFilter(bestGesture, handIndex);
    
    // 只有置信度超过动态阈值才返回识别结果
    if (smoothedGesture.confidence >= threshold) {
      return smoothedGesture;
    }

    return { gesture: 'NONE', confidence: 0 };
  }

  // 新增：多帧平滑滤波器（为每只手单独处理）
  _applySmoothingFilter(currentGesture, handIndex) {
    // 确保该手的缓冲区存在
    if (!this.handBuffers.has(handIndex)) {
      this.handBuffers.set(handIndex, {
        gestureBuffer: [],
        confidenceBuffer: []
      });
    }
    
    const buffers = this.handBuffers.get(handIndex);
    
    // 添加到缓冲区
    buffers.gestureBuffer.push(currentGesture.gesture);
    buffers.confidenceBuffer.push(currentGesture.confidence);
    
    // 保持缓冲区大小
    if (buffers.gestureBuffer.length > this.smoothingFrames) {
      buffers.gestureBuffer.shift();
      buffers.confidenceBuffer.shift();
    }
    
    // 如果缓冲区未满，返回当前手势
    if (buffers.gestureBuffer.length < this.smoothingFrames) {
      return currentGesture;
    }
    
    // 统计手势频率
    const gestureCount = {};
    buffers.gestureBuffer.forEach(gesture => {
      gestureCount[gesture] = (gestureCount[gesture] || 0) + 1;
    });
    
    // 找到最频繁的手势
    const mostFrequentGesture = Object.keys(gestureCount).reduce((a, b) => 
      gestureCount[a] > gestureCount[b] ? a : b
    );
    
    // 计算该手势的平均置信度
    const gestureIndices = buffers.gestureBuffer
      .map((gesture, index) => gesture === mostFrequentGesture ? index : -1)
      .filter(index => index !== -1);
    
    const avgConfidence = gestureIndices.reduce((sum, index) => 
      sum + buffers.confidenceBuffer[index], 0) / gestureIndices.length;
    
    // 稳定性检查：如果最频繁手势占比低于阈值，认为不稳定
    const stability = gestureCount[mostFrequentGesture] / buffers.gestureBuffer.length;
    if (stability < 0.6) {
      return { gesture: 'NONE', confidence: 0 };
    }
    
    return {
      gesture: mostFrequentGesture,
      confidence: avgConfidence * stability // 置信度乘以稳定性
    };
  }

  // 更新手势状态并触发回调
  update(handsData, timestamp) {
    if (!handsData || handsData.length === 0) {
      // 清空所有手的缓冲区和历史记录
      this.handBuffers.clear();
      this.gestureHistory.clear();
      return;
    }

    // 处理每只手的手势识别
    for (let handIndex = 0; handIndex < handsData.length; handIndex++) {
      const landmarks = handsData[handIndex];
      const result = this.recognizeGesture(landmarks, handIndex);
      
      if (result.gesture !== 'NONE') {
        // 为每只手单独维护手势历史
        const handKey = `hand_${handIndex}`;
        if (!this.gestureHistory.has(handKey)) {
          this.gestureHistory.set(handKey, []);
        }
        
        const history = this.gestureHistory.get(handKey);
        history.push(result);
        
        // 保持历史记录长度
        if (history.length > this.historyLength) {
          history.shift();
        }
        
        // 检查稳定手势
        const stableGestures = this._findStableGestures(handKey);
        
        // 触发稳定手势的回调
        for (const stableGesture of stableGestures) {
          // 使用更稳定的冷却键格式
          const cooldownKey = `${stableGesture.gesture}_${handIndex}`;
          
          // 检查冷却时间
          const now = Date.now();
          const lastTrigger = this.lastTriggerTime.get(cooldownKey) || 0;
          
          if (now - lastTrigger >= this.cooldownTime) {
            // 检查是否为上升沿（手势状态改变）
            const lastStableKey = `lastStable_${handKey}`;
            const lastStable = this.lastStableGesture.get(lastStableKey);
            
            if (lastStable !== stableGesture.gesture) {
              // 触发回调
              if (this.onGestureDetected) {
                this.onGestureDetected(stableGesture.gesture, stableGesture.confidence, handIndex);
              }
              
              // 更新触发时间和最后稳定手势
              this.lastTriggerTime.set(cooldownKey, now);
              this.lastStableGesture.set(lastStableKey, stableGesture.gesture);
            }
          }
        }
      } else {
        // 如果当前手势为NONE，清除该手的最后稳定手势
        const handKey = `hand_${handIndex}`;
        const lastStableKey = `lastStable_${handKey}`;
        this.lastStableGesture.set(lastStableKey, 'NONE');
      }
    }
  }

  // 增强的拳头检测
  _detectFist(landmarks) {
    const fingerTips = [8, 12, 16, 20]; // 食指、中指、无名指、小指指尖
    const fingerMCPs = [5, 9, 13, 17]; // 对应的掌指关节
    const fingerPIPs = [6, 10, 14, 18]; // 近端指间关节
    
    let bentFingers = 0;
    let totalBendScore = 0;
    
    // 检查四个手指的弯曲程度
    for (let i = 0; i < 4; i++) {
      const tip = landmarks[fingerTips[i]];
      const pip = landmarks[fingerPIPs[i]];
      const mcp = landmarks[fingerMCPs[i]];
      
      // 计算弯曲度：指尖到掌指关节的距离 vs 近端关节到掌指关节的距离
      const tipToMcp = this._distance(tip, mcp);
      const pipToMcp = this._distance(pip, mcp);
      const bendRatio = tipToMcp / pipToMcp;
      
      if (bendRatio < 1.2) { // 更严格的弯曲判断
        bentFingers++;
        totalBendScore += (1.2 - bendRatio); // 弯曲程度评分
      }
    }
    
    // 拇指检查：拇指应该收起
    const thumbTip = landmarks[4];
    const thumbMCP = landmarks[2];
    const indexMCP = landmarks[5];
    const thumbToIndex = this._distance(thumbTip, indexMCP);
    const thumbToMCP = this._distance(thumbTip, thumbMCP);
    const thumbBent = thumbToIndex < thumbToMCP * 1.5;
    
    // 综合评分
    let confidence = 0;
    if (bentFingers >= 3) {
      confidence = (bentFingers / 4) * 0.6 + (totalBendScore / 4) * 0.3 + (thumbBent ? 0.1 : 0);
    }
    
    return {
      gesture: 'FIST',
      confidence: Math.min(confidence, 1.0)
    };
  }

  // 增强的OK手势检测
  _detectOK(landmarks) {
    const thumbTip = landmarks[4];
    const thumbIP = landmarks[3];
    const indexTip = landmarks[8];
    const indexPIP = landmarks[6];
    const indexMCP = landmarks[5];
    
    // 检查拇指和食指是否形成圆圈
    const thumbIndexDistance = this._distance(thumbTip, indexTip);
    const circleSize = this._distance(indexMCP, thumbIP);
    const circleRatio = thumbIndexDistance / circleSize;
    
    // 圆圈应该相对较小
    if (circleRatio > 0.8) {
      return { gesture: 'OK', confidence: 0 };
    }
    
    // 检查其他三个手指是否伸直
    const otherFingers = [12, 16, 20]; // 中指、无名指、小指指尖
    const otherMCPs = [9, 13, 17];
    let straightFingers = 0;
    
    for (let i = 0; i < 3; i++) {
      const tip = landmarks[otherFingers[i]];
      const mcp = landmarks[otherMCPs[i]];
      const wrist = landmarks[0];
      
      // 检查手指是否伸直（指尖距离手腕比掌指关节距离手腕远）
      const tipToWrist = this._distance(tip, wrist);
      const mcpToWrist = this._distance(mcp, wrist);
      
      if (tipToWrist > mcpToWrist * 1.3) {
        straightFingers++;
      }
    }
    
    // 计算置信度
    const circleScore = Math.max(0, 1 - circleRatio * 2); // 圆圈越小分数越高
    const fingerScore = straightFingers / 3; // 伸直手指比例
    const confidence = circleScore * 0.6 + fingerScore * 0.4;
    
    return {
      gesture: 'OK',
      confidence: confidence
    };
  }

  // 增强的爱心检测（双手）
  _detectHeart(landmarks) {
    // 这里简化为单手检测，实际应该检测双手配合
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const wrist = landmarks[0];
    
    // 检查拇指和食指是否接近（形成心形的一部分）
    const thumbIndexDistance = this._distance(thumbTip, indexTip);
    const handSize = this._distance(wrist, landmarks[9]);
    const proximityRatio = thumbIndexDistance / handSize;
    
    // 检查中指是否参与形成心形
    const thumbMiddleDistance = this._distance(thumbTip, middleTip);
    const indexMiddleDistance = this._distance(indexTip, middleTip);
    
    let confidence = 0;
    if (proximityRatio < 0.3) { // 拇指食指接近
      confidence += 0.4;
    }
    
    if (thumbMiddleDistance < handSize * 0.4 && indexMiddleDistance < handSize * 0.4) {
      confidence += 0.3;
    }
    
    // 检查手的整体形状
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];
    const ringPinkyDistance = this._distance(ringTip, pinkyTip);
    
    if (ringPinkyDistance < handSize * 0.2) { // 无名指小指收拢
      confidence += 0.3;
    }
    
    return {
      gesture: 'HEART',
      confidence: Math.min(confidence, 1.0)
    };
  }

  // 增强的点赞检测
  _detectThumbsUp(landmarks) {
    const thumbTip = landmarks[4];
    const thumbIP = landmarks[3];
    const thumbMCP = landmarks[2];
    const wrist = landmarks[0];
    const indexMCP = landmarks[5];
    
    // 检查拇指是否向上伸直
    const thumbDirection = thumbTip.y - thumbMCP.y; // Y轴向下为正
    const thumbLength = this._distance(thumbTip, thumbMCP);
    const handHeight = Math.abs(landmarks[12].y - wrist.y);
    
    // 拇指应该向上（Y值更小）
    if (thumbDirection > -thumbLength * 0.5) {
      return { gesture: 'THUMBS_UP', confidence: 0 };
    }
    
    // 检查其他四个手指是否弯曲
    const otherFingers = [8, 12, 16, 20];
    const otherMCPs = [5, 9, 13, 17];
    let bentFingers = 0;
    
    for (let i = 0; i < 4; i++) {
      const tip = landmarks[otherFingers[i]];
      const mcp = landmarks[otherMCPs[i]];
      
      // 检查手指是否弯曲（指尖Y坐标大于掌指关节）
      if (tip.y > mcp.y + 0.02) { // 添加小的容差
        bentFingers++;
      }
    }
    
    // 计算置信度
    const thumbScore = Math.abs(thumbDirection) / thumbLength; // 拇指向上程度
    const fingerScore = bentFingers / 4; // 其他手指弯曲程度
    const confidence = thumbScore * 0.6 + fingerScore * 0.4;
    
    return {
      gesture: 'THUMBS_UP',
      confidence: Math.min(confidence, 1.0)
    };
  }

  // 增强的胜利手势检测
  _detectPeace(landmarks) {
    const indexTip = landmarks[8];
    const indexPIP = landmarks[6];
    const indexMCP = landmarks[5];
    const middleTip = landmarks[12];
    const middlePIP = landmarks[10];
    const middleMCP = landmarks[9];
    const wrist = landmarks[0];
    
    // 检查食指和中指是否伸直
    const indexStraight = this._distance(indexTip, wrist) > this._distance(indexMCP, wrist) * 1.4;
    const middleStraight = this._distance(middleTip, wrist) > this._distance(middleMCP, wrist) * 1.4;
    
    if (!indexStraight || !middleStraight) {
      return { gesture: 'PEACE', confidence: 0 };
    }
    
    // 检查食指和中指是否分开
    const fingerSeparation = this._distance(indexTip, middleTip);
    const handSize = this._distance(wrist, landmarks[9]);
    const separationRatio = fingerSeparation / handSize;
    
    // 检查其他手指是否弯曲
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];
    const thumbTip = landmarks[4];
    
    const ringBent = ringTip.y > landmarks[13].y + 0.02;
    const pinkyBent = pinkyTip.y > landmarks[17].y + 0.02;
    const thumbBent = this._distance(thumbTip, landmarks[5]) < handSize * 0.4;
    
    // 计算置信度
    let confidence = 0;
    if (separationRatio > 0.15) { // 手指分开
      confidence += 0.4;
    }
    
    const bentCount = (ringBent ? 1 : 0) + (pinkyBent ? 1 : 0) + (thumbBent ? 1 : 0);
    confidence += (bentCount / 3) * 0.6;
    
    return {
      gesture: 'PEACE',
      confidence: Math.min(confidence, 1.0)
    };
  }

  // 增强的指向检测
  _detectPointing(landmarks) {
    const indexTip = landmarks[8];
    const indexPIP = landmarks[6];
    const indexMCP = landmarks[5];
    const wrist = landmarks[0];
    
    // 检查食指是否伸直
    const indexLength = this._distance(indexTip, indexMCP);
    const indexToWrist = this._distance(indexTip, wrist);
    const mcpToWrist = this._distance(indexMCP, wrist);
    
    if (indexToWrist < mcpToWrist * 1.5) {
      return { gesture: 'POINTING', confidence: 0 };
    }
    
    // 检查其他手指是否弯曲
    const otherFingers = [4, 12, 16, 20]; // 拇指、中指、无名指、小指
    const otherMCPs = [2, 9, 13, 17];
    let bentFingers = 0;
    
    for (let i = 0; i < 4; i++) {
      const tip = landmarks[otherFingers[i]];
      const mcp = landmarks[otherMCPs[i]];
      
      if (i === 0) { // 拇指特殊处理
        const thumbBent = this._distance(tip, landmarks[5]) < this._distance(wrist, landmarks[5]) * 0.5;
        if (thumbBent) bentFingers++;
      } else {
        if (tip.y > mcp.y + 0.02) {
          bentFingers++;
        }
      }
    }
    
    // 计算置信度
    const straightScore = (indexToWrist / mcpToWrist - 1.5) / 0.5; // 食指伸直程度
    const bentScore = bentFingers / 4; // 其他手指弯曲程度
    const confidence = Math.min(straightScore, 1) * 0.5 + bentScore * 0.5;
    
    return {
      gesture: 'POINTING',
      confidence: Math.min(confidence, 1.0)
    };
  }

  // 增强的张开手掌检测
  _detectOpenPalm(landmarks) {
    const fingerTips = [4, 8, 12, 16, 20]; // 所有手指指尖
    const fingerMCPs = [2, 5, 9, 13, 17]; // 对应的掌指关节
    const wrist = landmarks[0];
    
    let straightFingers = 0;
    let totalStraightness = 0;
    
    // 检查所有手指是否伸直
    for (let i = 0; i < 5; i++) {
      const tip = landmarks[fingerTips[i]];
      const mcp = landmarks[fingerMCPs[i]];
      
      const tipToWrist = this._distance(tip, wrist);
      const mcpToWrist = this._distance(mcp, wrist);
      const straightnessRatio = tipToWrist / mcpToWrist;
      
      if (straightnessRatio > 1.3) { // 手指伸直
        straightFingers++;
        totalStraightness += Math.min(straightnessRatio - 1.3, 0.7); // 限制最大贡献
      }
    }
    
    // 检查手指间的分离度
    let separationScore = 0;
    const handSize = this._distance(wrist, landmarks[9]);
    
    for (let i = 0; i < 4; i++) {
      const finger1 = landmarks[fingerTips[i + 1]]; // 从食指开始
      const finger2 = landmarks[fingerTips[i + 1 === 4 ? 0 : i + 2]]; // 相邻手指
      const separation = this._distance(finger1, finger2) / handSize;
      separationScore += Math.min(separation, 0.3); // 限制最大贡献
    }
    
    // 计算置信度
    const fingerScore = straightFingers / 5; // 伸直手指比例
    const straightnessScore = totalStraightness / 5; // 平均伸直程度
    const separationNormalized = separationScore / 1.2; // 归一化分离度
    
    const confidence = fingerScore * 0.5 + straightnessScore * 0.3 + separationNormalized * 0.2;
    
    return {
      gesture: 'OPEN_PALM',
      confidence: Math.min(confidence, 1.0)
    };
  }

  // 获取手势对应的指尖位置
  _getFingerTip(landmarks, gesture) {
    const tipMap = {
      'FIST': landmarks[9], // 中指掌指关节作为拳头中心
      'OK': landmarks[8], // 食指指尖
      'HEART': landmarks[8], // 食指指尖
      'THUMBS_UP': landmarks[4], // 拇指指尖
      'PEACE': landmarks[8], // 食指指尖
      'POINTING': landmarks[8], // 食指指尖
      'OPEN_PALM': landmarks[9] // 手掌中心
    };
    
    return tipMap[gesture] || landmarks[8];
  }

  // 查找稳定手势（为特定手查找）
  _findStableGestures(handKey) {
    const history = this.gestureHistory.get(handKey) || [];
    
    if (history.length < this.stabilityFrames) {
      return [];
    }
    
    // 获取最近的稳定帧数
    const recentGestures = history.slice(-this.stabilityFrames);
    
    // 统计手势频率
    const gestureCount = {};
    recentGestures.forEach(result => {
      const gesture = result.gesture;
      if (!gestureCount[gesture]) {
        gestureCount[gesture] = { count: 0, totalConfidence: 0 };
      }
      gestureCount[gesture].count++;
      gestureCount[gesture].totalConfidence += result.confidence;
    });
    
    // 找到稳定的手势（出现频率 >= 80%）
    const stableGestures = [];
    for (const [gesture, data] of Object.entries(gestureCount)) {
      const frequency = data.count / recentGestures.length;
      if (frequency >= 0.8 && gesture !== 'NONE') {
        const avgConfidence = data.totalConfidence / data.count;
        stableGestures.push({
          gesture: gesture,
          confidence: avgConfidence,
          frequency: frequency
        });
      }
    }
    
    return stableGestures;
  }

  // 计算两点间距离
  _distance(p1, p2) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const dz = (p1.z || 0) - (p2.z || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  // 计算角度
  _angle(p1, center, p2) {
    const v1 = { x: p1.x - center.x, y: p1.y - center.y };
    const v2 = { x: p2.x - center.x, y: p2.y - center.y };
    
    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
    
    return Math.acos(Math.max(-1, Math.min(1, dot / (mag1 * mag2))));
  }
}
