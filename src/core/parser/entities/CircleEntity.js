import Entity from './Entity.js';

/**
 * CIRCLE entity
 * Represents a circle with center point and radius
 */
class CircleEntity extends Entity {
  constructor() {
    super('CIRCLE');
    this.center = { x: 0, y: 0, z: 0 };
    this.radius = 0;
  }

  /**
   * Parse CIRCLE entity data
   * @param {Array} data - Group code-value pairs
   * @returns {CircleEntity}
   */
  static fromData(data) {
    const circle = new CircleEntity();
    circle.parseCommon(data);

    for (const group of data) {
      switch (group.code) {
        case 10: // Center X
          circle.center.x = group.value;
          break;
        case 20: // Center Y
          circle.center.y = group.value;
          break;
        case 30: // Center Z
          circle.center.z = group.value;
          break;
        case 40: // Radius
          circle.radius = group.value;
          break;
      }
    }

    return circle;
  }

  /**
   * Get bounding box
   * @returns {Object} {minX, minY, maxX, maxY}
   */
  getBounds() {
    return {
      minX: this.center.x - this.radius,
      minY: this.center.y - this.radius,
      maxX: this.center.x + this.radius,
      maxY: this.center.y + this.radius
    };
  }

  /**
   * Get circumference
   * @returns {number}
   */
  getCircumference() {
    return 2 * Math.PI * this.radius;
  }

  /**
   * Get area
   * @returns {number}
   */
  getArea() {
    return Math.PI * this.radius * this.radius;
  }

  /**
   * Check if point is inside circle
   * @param {number} x - Point X
   * @param {number} y - Point Y
   * @returns {boolean}
   */
  containsPoint(x, y) {
    const dx = x - this.center.x;
    const dy = y - this.center.y;
    const distanceSquared = dx * dx + dy * dy;
    return distanceSquared <= this.radius * this.radius;
  }

  /**
   * Get point on circle at angle
   * @param {number} angle - Angle in radians
   * @returns {Object} {x, y}
   */
  getPointAtAngle(angle) {
    return {
      x: this.center.x + this.radius * Math.cos(angle),
      y: this.center.y + this.radius * Math.sin(angle)
    };
  }
}

export default CircleEntity;
