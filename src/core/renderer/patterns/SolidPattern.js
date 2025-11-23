import Pattern from './Pattern.js';

/**
 * Solid fill pattern (no pattern, just solid color)
 */
class SolidPattern extends Pattern {
  constructor() {
    super('SOLID', 'Solid fill');
  }

  /**
   * Create solid fill (returns color directly)
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {string} color - Fill color (hex)
   * @param {number} scale - Pattern scale (ignored)
   * @param {number} angle - Pattern angle (ignored)
   * @returns {string} Fill color
   */
  create(ctx, color, scale = 1.0, angle = 0) {
    return color;
  }
}

export default SolidPattern;
