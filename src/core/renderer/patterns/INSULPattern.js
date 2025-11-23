import Pattern from './Pattern.js';

/**
 * INSUL pattern - Insulation material pattern
 * Wavy lines simulating insulation texture
 */
class INSULPattern extends Pattern {
  constructor() {
    super('INSUL', 'Insulation material');
  }

  /**
   * Create INSUL pattern
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {string} color - Pattern color (hex)
   * @param {number} scale - Pattern scale
   * @param {number} angle - Pattern rotation angle in degrees
   * @returns {CanvasPattern} Canvas pattern
   */
  create(ctx, color, scale = 1.0, angle = 0) {
    const size = this.getTileSize(scale);
    const spacing = size / 6; // Line spacing

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

    // Draw wavy lines
    pctx.strokeStyle = color;
    pctx.lineWidth = Math.max(0.5, scale * 0.5);
    pctx.lineCap = 'round';
    pctx.lineJoin = 'round';

    const numLines = Math.ceil(size / spacing);
    const waveAmplitude = spacing * 0.4;
    const waveLength = size / 4;

    for (let i = 0; i <= numLines; i++) {
      const y = i * spacing;

      pctx.beginPath();
      pctx.moveTo(0, y);

      // Draw sine wave
      for (let x = 0; x <= size; x += 2) {
        const waveY = y + Math.sin((x / waveLength) * Math.PI * 2) * waveAmplitude;
        pctx.lineTo(x, waveY);
      }

      pctx.stroke();
    }

    return ctx.createPattern(patternCanvas, 'repeat');
  }
}

export default INSULPattern;
