import Pattern from './Pattern.js';

/**
 * ANSI31 pattern - 45-degree diagonal lines
 * Standard hatching pattern used in technical drawings
 */
class ANSI31Pattern extends Pattern {
  constructor() {
    super('ANSI31', '45-degree diagonal lines');
  }

  /**
   * Create ANSI31 pattern
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {string} color - Pattern color (hex)
   * @param {number} scale - Pattern scale
   * @param {number} angle - Pattern rotation angle in degrees
   * @returns {CanvasPattern} Canvas pattern
   */
  create(ctx, color, scale = 1.0, angle = 0) {
    const size = this.getTileSize(scale);
    const spacing = size / 4; // Line spacing

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

    // Draw diagonal lines at 45 degrees
    pctx.strokeStyle = color;
    pctx.lineWidth = Math.max(0.5, scale * 0.5);
    pctx.lineCap = 'butt';

    // Draw multiple diagonal lines to fill the tile
    const numLines = Math.ceil(size / spacing) + 1;
    for (let i = -numLines; i <= numLines; i++) {
      const offset = i * spacing;

      pctx.beginPath();
      pctx.moveTo(offset, 0);
      pctx.lineTo(offset + size, size);
      pctx.stroke();
    }

    return ctx.createPattern(patternCanvas, 'repeat');
  }
}

export default ANSI31Pattern;
