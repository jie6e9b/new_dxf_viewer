/**
 * Base Pattern class for hatch patterns
 * All pattern implementations should extend this class
 */
class Pattern {
  constructor(name, description = '') {
    this.name = name;
    this.description = description;
  }

  /**
   * Create canvas pattern
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {string} color - Pattern color (hex)
   * @param {number} scale - Pattern scale
   * @param {number} angle - Pattern rotation angle in degrees
   * @returns {CanvasPattern|string} Canvas pattern or solid color
   */
  create(ctx, color, scale = 1.0, angle = 0) {
    throw new Error('Pattern.create() must be implemented by subclass');
  }

  /**
   * Get pattern tile size
   * @param {number} scale - Pattern scale
   * @returns {number} Tile size in pixels
   */
  getTileSize(scale) {
    return Math.max(8, 32 * scale);
  }

  /**
   * Rotate canvas context
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} angle - Angle in degrees
   * @param {number} centerX - Center X
   * @param {number} centerY - Center Y
   */
  rotateContext(ctx, angle, centerX, centerY) {
    if (angle !== 0) {
      ctx.translate(centerX, centerY);
      ctx.rotate((angle * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);
    }
  }
}

export default Pattern;
