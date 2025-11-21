import ViewTransform from './ViewTransform.js';

/**
 * CanvasRenderer - manages canvas and coordinates rendering
 */
class CanvasRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.transform = new ViewTransform(canvas.width, canvas.height);

    // Rendering settings
    this.backgroundColor = '#FFFFFF';
    this.antialias = true;

    // Setup canvas
    this.setupCanvas();
  }

  /**
   * Setup canvas with high DPI support
   */
  setupCanvas() {
    const dpr = window.devicePixelRatio || 1;

    // Store display size
    const displayWidth = this.canvas.clientWidth || this.canvas.width;
    const displayHeight = this.canvas.clientHeight || this.canvas.height;

    // Set actual canvas size to account for DPI
    this.canvas.width = displayWidth * dpr;
    this.canvas.height = displayHeight * dpr;

    // Scale context to match DPI
    this.ctx.scale(dpr, dpr);

    // Update transform
    this.transform.setCanvasSize(displayWidth, displayHeight);

    // Enable antialiasing
    if (this.antialias) {
      this.ctx.imageSmoothingEnabled = true;
      this.ctx.imageSmoothingQuality = 'high';
    }
  }

  /**
   * Resize canvas
   * @param {number} width - New width
   * @param {number} height - New height
   */
  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.canvas.clientWidth = width;
    this.canvas.clientHeight = height;
    this.transform.setCanvasSize(width, height);
    this.setupCanvas();
  }

  /**
   * Clear canvas
   */
  clear() {
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Begin rendering frame
   */
  beginFrame() {
    this.clear();
    this.ctx.save();
  }

  /**
   * End rendering frame
   */
  endFrame() {
    this.ctx.restore();
  }

  /**
   * Apply view transform to context
   */
  applyTransform() {
    const state = this.transform.getState();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset

    if (this.transform.flipY) {
      this.ctx.translate(0, this.canvas.height);
      this.ctx.scale(1, -1);
    }

    this.ctx.scale(state.scale, state.scale);
    this.ctx.translate(state.offsetX, state.offsetY);
  }

  /**
   * Set line style
   * @param {string} color - Color hex string
   * @param {number} width - Line width in world units
   * @param {Array} dashPattern - Dash pattern
   */
  setLineStyle(color, width = 1, dashPattern = []) {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = width;
    this.ctx.setLineDash(dashPattern);
  }

  /**
   * Set fill style
   * @param {string} color - Color hex string
   */
  setFillStyle(color) {
    this.ctx.fillStyle = color;
  }

  /**
   * Draw line from world coordinates
   * @param {number} x1 - Start X
   * @param {number} y1 - Start Y
   * @param {number} x2 - End X
   * @param {number} y2 - End Y
   */
  drawLine(x1, y1, x2, y2) {
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();
  }

  /**
   * Draw circle from world coordinates
   * @param {number} cx - Center X
   * @param {number} cy - Center Y
   * @param {number} radius - Radius
   * @param {boolean} fill - Fill circle
   */
  drawCircle(cx, cy, radius, fill = false) {
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    if (fill) {
      this.ctx.fill();
    }
    this.ctx.stroke();
  }

  /**
   * Draw arc from world coordinates
   * @param {number} cx - Center X
   * @param {number} cy - Center Y
   * @param {number} radius - Radius
   * @param {number} startAngle - Start angle in radians
   * @param {number} endAngle - End angle in radians
   */
  drawArc(cx, cy, radius, startAngle, endAngle) {
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, radius, startAngle, endAngle);
    this.ctx.stroke();
  }

  /**
   * Draw polyline
   * @param {Array} points - Array of {x, y} points
   * @param {boolean} closed - Close the path
   */
  drawPolyline(points, closed = false) {
    if (points.length < 2) return;

    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y);
    }

    if (closed) {
      this.ctx.closePath();
    }

    this.ctx.stroke();
  }

  /**
   * Draw text
   * @param {string} text - Text to draw
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} height - Text height
   * @param {string} font - Font family
   */
  drawText(text, x, y, height, font = 'Arial') {
    this.ctx.save();

    // Text is rendered upright even with flipped Y
    if (this.transform.flipY) {
      this.ctx.scale(1, -1);
      y = -y;
    }

    this.ctx.font = `${height}px ${font}`;
    this.ctx.fillText(text, x, y);

    this.ctx.restore();
  }

  /**
   * Get canvas as data URL
   * @param {string} format - Image format (png, jpeg)
   * @returns {string} Data URL
   */
  toDataURL(format = 'image/png') {
    return this.canvas.toDataURL(format);
  }

  /**
   * Export canvas to blob
   * @param {string} format - Image format
   * @returns {Promise<Blob>}
   */
  toBlob(format = 'image/png') {
    return new Promise((resolve) => {
      this.canvas.toBlob(resolve, format);
    });
  }
}

export default CanvasRenderer;
