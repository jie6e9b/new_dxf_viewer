import Pattern from './Pattern.js';

/**
 * STEEL pattern - Steel material pattern
 * Parallel vertical lines simulating steel texture
 */
class STEELPattern extends Pattern {
  constructor() {
    super('STEEL', 'Steel material');
  }

  /**
   * Create STEEL pattern
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {string} color - Pattern color (hex)
   * @param {number} scale - Pattern scale
   * @param {number} angle - Pattern rotation angle in degrees
   * @returns {CanvasPattern} Canvas pattern
   */
  create(ctx, color, scale = 1.0, angle = 0) {
    const size = this.getTileSize(scale);
    const spacing = size / 8; // Line spacing

    // Create pattern canvas
    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = size;
    patternCanvas.height = size;
    const pctx = patternCanvas.getContext('2d');

    // Set background (transparent)
    pctx.clearRect(0, 0, size, size);

    // Rotate if needed
    const center = size / 2;
    this.rotateContext(pctx, angle, center, center);

    // Draw vertical lines
    pctx.strokeStyle = color;
    pctx.lineWidth = Math.max(0.5, scale * 0.5);
    pctx.lineCap = 'butt';

    const numLines = Math.ceil(size / spacing);
    for (let i = 0; i <= numLines; i++) {
      const x = i * spacing;

      pctx.beginPath();
      pctx.moveTo(x, 0);
      pctx.lineTo(x, size);
      pctx.stroke();
    }

    return ctx.createPattern(patternCanvas, 'repeat');
  }
}

export default STEELPattern;
