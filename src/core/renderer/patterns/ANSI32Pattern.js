import Pattern from './Pattern.js';

/**
 * ANSI32 pattern - Crosshatch (45-degree lines in both directions)
 * Standard crosshatch pattern used in technical drawings
 */
class ANSI32Pattern extends Pattern {
  constructor() {
    super('ANSI32', 'Crosshatch (45-degree both directions)');
  }

  /**
   * Create ANSI32 pattern
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

    // Draw diagonal lines
    pctx.strokeStyle = color;
    pctx.lineWidth = Math.max(0.5, scale * 0.5);
    pctx.lineCap = 'butt';

    const numLines = Math.ceil(size / spacing) + 1;

    // Draw 45-degree lines (/)
    for (let i = -numLines; i <= numLines; i++) {
      const offset = i * spacing;

      pctx.beginPath();
      pctx.moveTo(offset, 0);
      pctx.lineTo(offset + size, size);
      pctx.stroke();
    }

    // Draw -45-degree lines (\)
    for (let i = -numLines; i <= numLines; i++) {
      const offset = i * spacing;

      pctx.beginPath();
      pctx.moveTo(offset, size);
      pctx.lineTo(offset + size, 0);
      pctx.stroke();
    }

    return ctx.createPattern(patternCanvas, 'repeat');
  }
}

export default ANSI32Pattern;
