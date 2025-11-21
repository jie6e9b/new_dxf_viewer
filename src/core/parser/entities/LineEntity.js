import Entity from './Entity.js';

/**
 * LINE entity
 * Represents a simple straight line from start point to end point
 */
class LineEntity extends Entity {
  constructor() {
    super('LINE');
    this.start = { x: 0, y: 0, z: 0 };
    this.end = { x: 0, y: 0, z: 0 };
  }

  /**
   * Parse LINE entity data
   * @param {Array} data - Group code-value pairs
   * @returns {LineEntity}
   */
  static fromData(data) {
    const line = new LineEntity();
    line.parseCommon(data);

    for (const group of data) {
      switch (group.code) {
        case 10: // Start point X
          line.start.x = group.value;
          break;
        case 20: // Start point Y
          line.start.y = group.value;
          break;
        case 30: // Start point Z
          line.start.z = group.value;
          break;
        case 11: // End point X
          line.end.x = group.value;
          break;
        case 21: // End point Y
          line.end.y = group.value;
          break;
        case 31: // End point Z
          line.end.z = group.value;
          break;
      }
    }

    return line;
  }

  /**
   * Get bounding box
   * @returns {Object} {minX, minY, maxX, maxY}
   */
  getBounds() {
    return {
      minX: Math.min(this.start.x, this.end.x),
      minY: Math.min(this.start.y, this.end.y),
      maxX: Math.max(this.start.x, this.end.x),
      maxY: Math.max(this.start.y, this.end.y)
    };
  }

  /**
   * Get line length
   * @returns {number}
   */
  getLength() {
    const dx = this.end.x - this.start.x;
    const dy = this.end.y - this.start.y;
    const dz = this.end.z - this.start.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Check if line is vertical
   * @param {number} tolerance - Tolerance for comparison
   * @returns {boolean}
   */
  isVertical(tolerance = 0.0001) {
    return Math.abs(this.end.x - this.start.x) < tolerance;
  }

  /**
   * Check if line is horizontal
   * @param {number} tolerance - Tolerance for comparison
   * @returns {boolean}
   */
  isHorizontal(tolerance = 0.0001) {
    return Math.abs(this.end.y - this.start.y) < tolerance;
  }

  /**
   * Get line angle in radians
   * @returns {number}
   */
  getAngle() {
    return Math.atan2(this.end.y - this.start.y, this.end.x - this.start.x);
  }
}

export default LineEntity;
