import { ArrowType } from '../parser/entities/DimensionEntity.js';

/**
 * ArrowRenderer - renders dimension arrows
 * Supports various arrow types: closed, open, dot, tick, none
 */
class ArrowRenderer {
  /**
   * Render arrow at specified position and direction
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} x - Arrow tip X position
   * @param {number} y - Arrow tip Y position
   * @param {number} angle - Arrow direction angle in radians
   * @param {number} size - Arrow size
   * @param {string} type - Arrow type (closed, open, dot, tick, none)
   * @param {string} color - Arrow color
   */
  static renderArrow(ctx, x, y, angle, size, type = ArrowType.CLOSED, color = '#000000') {
    ctx.save();

    // Move to arrow tip and rotate
    ctx.translate(x, y);
    ctx.rotate(angle);

    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.5;

    switch (type) {
      case ArrowType.CLOSED:
        this.renderClosedArrow(ctx, size);
        break;
      case ArrowType.OPEN:
        this.renderOpenArrow(ctx, size);
        break;
      case ArrowType.DOT:
        this.renderDot(ctx, size);
        break;
      case ArrowType.TICK:
        this.renderTick(ctx, size);
        break;
      case ArrowType.NONE:
        // No arrow
        break;
    }

    ctx.restore();
  }

  /**
   * Render closed filled arrow (standard AutoCAD arrow)
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} size - Arrow size
   */
  static renderClosedArrow(ctx, size) {
    const width = size * 0.3;  // Arrow width
    const length = size;       // Arrow length

    ctx.beginPath();
    ctx.moveTo(0, 0);                    // Arrow tip
    ctx.lineTo(-length, width / 2);      // Upper point
    ctx.lineTo(-length, -width / 2);     // Lower point
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Render open arrow (two lines forming V shape)
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} size - Arrow size
   */
  static renderOpenArrow(ctx, size) {
    const width = size * 0.3;
    const length = size;

    ctx.beginPath();
    ctx.moveTo(-length, width / 2);
    ctx.lineTo(0, 0);
    ctx.lineTo(-length, -width / 2);
    ctx.stroke();
  }

  /**
   * Render dot arrow (filled circle)
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} size - Arrow size
   */
  static renderDot(ctx, size) {
    const radius = size * 0.2;

    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Render tick arrow (short diagonal line, architectural style)
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} size - Arrow size
   */
  static renderTick(ctx, size) {
    const length = size * 0.5;

    ctx.save();
    ctx.rotate(Math.PI / 4); // 45 degrees

    ctx.beginPath();
    ctx.moveTo(-length / 2, 0);
    ctx.lineTo(length / 2, 0);
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Render arrow pointing from start to end
   * Calculates angle automatically
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} fromX - Start X
   * @param {number} fromY - Start Y
   * @param {number} toX - End X (arrow tip)
   * @param {number} toY - End Y (arrow tip)
   * @param {number} size - Arrow size
   * @param {string} type - Arrow type
   * @param {string} color - Arrow color
   */
  static renderArrowFromTo(ctx, fromX, fromY, toX, toY, size, type = ArrowType.CLOSED, color = '#000000') {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);

    this.renderArrow(ctx, toX, toY, angle, size, type, color);
  }

  /**
   * Get arrow offset distance (distance from tip to base)
   * Used to position dimension lines correctly
   * @param {number} size - Arrow size
   * @param {string} type - Arrow type
   * @returns {number} Offset distance
   */
  static getArrowOffset(size, type = ArrowType.CLOSED) {
    switch (type) {
      case ArrowType.CLOSED:
      case ArrowType.OPEN:
        return size;
      case ArrowType.DOT:
        return size * 0.2;
      case ArrowType.TICK:
        return size * 0.25;
      case ArrowType.NONE:
        return 0;
      default:
        return size;
    }
  }
}

export default ArrowRenderer;
