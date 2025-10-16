export class Camera {
  constructor(videoEl, { mirror = true } = {}) {
    this.video = videoEl;
    this.stream = null;
    this.mirror = mirror;
    // 与页面保持一致的展示策略
    this.objectFit = 'cover';
  }

  async start({ width = 1280, height = 720, fps = 30 } = {}) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('不支持摄像头访问（缺少 mediaDevices.getUserMedia）');
    }
    const constraints = {
      audio: false,
      video: {
        width: { ideal: width },
        height: { ideal: height },
        frameRate: { ideal: fps, max: fps },
        facingMode: 'user',
      }
    };
    this.stream = await navigator.mediaDevices.getUserMedia(constraints);
    this.video.srcObject = this.stream;
    await this.video.play();
    return true;
  }

  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    if (this.video) this.video.srcObject = null;
  }

  getSize() {
    const vw = this.video.videoWidth || this.video.clientWidth || 0;
    const vh = this.video.videoHeight || this.video.clientHeight || 0;
    return { vw, vh };
  }

  // 将 MediaPipe 归一化坐标（0..1）映射到画布坐标（考虑 object-fit: cover 与镜像）
  mapNormToCanvas(nx, ny, canvasWidth, canvasHeight) {
    const { vw, vh } = this.getSize();
    if (!vw || !vh) return { x: nx * canvasWidth, y: ny * canvasHeight };
    const scale = Math.max(canvasWidth / vw, canvasHeight / vh);
    const drawW = vw * scale;
    const drawH = vh * scale;
    const offX = (canvasWidth - drawW) / 2;
    const offY = (canvasHeight - drawH) / 2;
    const xVideo = (this.mirror ? (1 - nx) : nx) * vw;
    const yVideo = ny * vh;
    const x = offX + xVideo * scale;
    const y = offY + yVideo * scale;
    return { x, y };
  }
}

