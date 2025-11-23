import Pattern from './Pattern.js';

/**
 * AR-CONC pattern - Concrete material pattern
 * Random dots pattern simulating concrete texture
 */
class ARCONCPattern extends Pattern {
  constructor() {
    super('AR-CONC', 'Concrete material');
  }

  /**
   * Create AR-CONC pattern
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {string} color - Pattern color (hex)
   * @param {number} scale - Pattern scale
   * @param {number} angle - Pattern rotation angle in degrees
   * @returns {CanvasPattern} Canvas pattern
   */
  create(ctx, color, scale = 1.0, angle = 0) {
    const size = this.getTileSize(scale);

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

    // Draw random dots to simulate concrete texture
    pctx.fillStyle = color;

    // Use seeded random for consistent pattern
    const seed = 12345;
    let random = seed;
    const nextRandom = () => {
      random = (random * 9301 + 49297) % 233280;
      return random / 233280;
    };

    const numDots = Math.floor(size / 2);
    for (let i = 0; i < numDots; i++) {
      const x = nextRandom() * size;
      const y = nextRandom() * size;
      const radius = nextRandom() * scale * 1.5 + 0.5;

      pctx.beginPath();
      pctx.arc(x, y, radius, 0, Math.PI * 2);
      pctx.fill();
    }

    return ctx.createPattern(patternCanvas, 'repeat');
  }
}

export default ARCONCPattern;
