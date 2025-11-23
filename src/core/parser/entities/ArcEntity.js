import Entity from './Entity.js';

/**
 * ARC entity
 * Represents a circular arc with center, radius, start and end angles
 */
class ArcEntity extends Entity {
  constructor() {
    super('ARC');
    this.center = { x: 0, y: 0, z: 0 };
    this.radius = 0;
    this.startAngle = 0; // In degrees (DXF format)
    this.endAngle = 360; // In degrees (DXF format)
  }

  /**
   * Parse ARC entity data
   * @param {Array} data - Group code-value pairs
   * @returns {ArcEntity}
   */
  static fromData(data) {
    const arc = new ArcEntity();
    arc.parseCommon(data);

    for (const group of data) {
      switch (group.code) {
        case 10: // Center X
          arc.center.x = group.value;
          break;
        case 20: // Center Y
          arc.center.y = group.value;
          break;
        case 30: // Center Z
          arc.center.z = group.value;
          break;
        case 40: // Radius
          arc.radius = group.value;
          break;
        case 50: // Start angle (degrees)
          arc.startAngle = group.value;
          break;
        case 51: // End angle (degrees)
          arc.endAngle = group.value;
          break;
      }
    }

    return arc;
  }

  /**
   * Get start angle in radians
   * @returns {number}
   */
  getStartAngleRad() {
    return this.startAngle * Math.PI / 180;
  }

  /**
   * Get end angle in radians
   * @returns {number}
   */
  getEndAngleRad() {
    return this.endAngle * Math.PI / 180;
  }

  /**
   * Get arc sweep angle in radians
   * @returns {number}
   */
  getSweepAngleRad() {
    let sweep = this.endAngle - this.startAngle;

    // Normalize to 0-360 range
    while (sweep < 0) sweep += 360;
    while (sweep > 360) sweep -= 360;

    return sweep * Math.PI / 180;
  }

  /**
   * Get bounding box
   * @returns {Object} {minX, minY, maxX, maxY}
   */
  getBounds() {
    // Start with endpoints
    const startRad = this.getStartAngleRad();
    const endRad = this.getEndAngleRad();

    const startX = this.center.x + this.radius * Math.cos(startRad);
    const startY = this.center.y + this.radius * Math.sin(startRad);
    const endX = this.center.x + this.radius * Math.cos(endRad);
    const endY = this.center.y + this.radius * Math.sin(endRad);

    let minX = Math.min(startX, endX);
    let maxX = Math.max(startX, endX);
    let minY = Math.min(startY, endY);
    let maxY = Math.max(startY, endY);

    // Check if arc crosses cardinal directions (0°, 90°, 180°, 270°)
    // and include those extreme points in bounds
    const angles = [0, 90, 180, 270];

    for (const angle of angles) {
      if (this.containsAngle(angle)) {
        const rad = angle * Math.PI / 180;
        const x = this.center.x + this.radius * Math.cos(rad);
        const y = this.center.y + this.radius * Math.sin(rad);
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }

    return { minX, minY, maxX, maxY };
  }

  /**
   * Check if arc contains a specific angle (in degrees)
   * @param {number} angle - Angle in degrees
   * @returns {boolean}
   */
  containsAngle(angle) {
    // Normalize all angles to 0-360
    const normalizeAngle = (a) => {
      a = a % 360;
      if (a < 0) a += 360;
      return a;
    };

    const start = normalizeAngle(this.startAngle);
    const end = normalizeAngle(this.endAngle);
    const test = normalizeAngle(angle);

    if (start <= end) {
      // Normal case: arc doesn't wrap around
      return test >= start && test <= end;
    } else {
      // Arc wraps around 0°
      return test >= start || test <= end;
    }
  }

  /**
   * Get arc length
   * @returns {number}
   */
  getLength() {
    return this.radius * this.getSweepAngleRad();
  }

  /**
   * Get start point
   * @returns {Object} {x, y}
   */
  getStartPoint() {
    const rad = this.getStartAngleRad();
    return {
      x: this.center.x + this.radius * Math.cos(rad),
      y: this.center.y + this.radius * Math.sin(rad)
    };
  }

  /**
   * Get end point
   * @returns {Object} {x, y}
   */
  getEndPoint() {
    const rad = this.getEndAngleRad();
    return {
      x: this.center.x + this.radius * Math.cos(rad),
      y: this.center.y + this.radius * Math.sin(rad)
    };
  }

  /**
   * Get midpoint of arc
   * @returns {Object} {x, y}
   */
  getMidPoint() {
    const midAngle = (this.startAngle + this.endAngle) / 2;
    const rad = midAngle * Math.PI / 180;
    return {
      x: this.center.x + this.radius * Math.cos(rad),
      y: this.center.y + this.radius * Math.sin(rad)
    };
  }
}

export default ArcEntity;
