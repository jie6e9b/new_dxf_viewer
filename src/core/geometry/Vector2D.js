/**
 * Vector2D - 2D vector math
 */
class Vector2D {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  /**
   * Create from object with x, y properties
   * @param {Object} obj - Object with x, y
   * @returns {Vector2D}
   */
  static from(obj) {
    return new Vector2D(obj.x, obj.y);
  }

  /**
   * Add another vector
   * @param {Vector2D} v - Vector to add
   * @returns {Vector2D} New vector
   */
  add(v) {
    return new Vector2D(this.x + v.x, this.y + v.y);
  }

  /**
   * Subtract another vector
   * @param {Vector2D} v - Vector to subtract
   * @returns {Vector2D} New vector
   */
  subtract(v) {
    return new Vector2D(this.x - v.x, this.y - v.y);
  }

  /**
   * Multiply by scalar
   * @param {number} scalar - Multiplier
   * @returns {Vector2D} New vector
   */
  multiply(scalar) {
    return new Vector2D(this.x * scalar, this.y * scalar);
  }

  /**
   * Divide by scalar
   * @param {number} scalar - Divisor
   * @returns {Vector2D} New vector
   */
  divide(scalar) {
    return new Vector2D(this.x / scalar, this.y / scalar);
  }

  /**
   * Get vector length
   * @returns {number}
   */
  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /**
   * Get squared length (faster, no sqrt)
   * @returns {number}
   */
  lengthSquared() {
    return this.x * this.x + this.y * this.y;
  }

  /**
   * Normalize vector (length = 1)
   * @returns {Vector2D} New normalized vector
   */
  normalize() {
    const len = this.length();
    if (len === 0) return new Vector2D(0, 0);
    return this.divide(len);
  }

  /**
   * Dot product
   * @param {Vector2D} v - Other vector
   * @returns {number}
   */
  dot(v) {
    return this.x * v.x + this.y * v.y;
  }

  /**
   * Cross product (returns scalar in 2D)
   * @param {Vector2D} v - Other vector
   * @returns {number}
   */
  cross(v) {
    return this.x * v.y - this.y * v.x;
  }

  /**
   * Distance to another vector
   * @param {Vector2D} v - Other vector
   * @returns {number}
   */
  distanceTo(v) {
    return this.subtract(v).length();
  }

  /**
   * Angle in radians
   * @returns {number}
   */
  angle() {
    return Math.atan2(this.y, this.x);
  }

  /**
   * Rotate by angle
   * @param {number} angle - Angle in radians
   * @returns {Vector2D} New rotated vector
   */
  rotate(angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Vector2D(
      this.x * cos - this.y * sin,
      this.x * sin + this.y * cos
    );
  }

  /**
   * Clone vector
   * @returns {Vector2D}
   */
  clone() {
    return new Vector2D(this.x, this.y);
  }

  /**
   * Check equality
   * @param {Vector2D} v - Other vector
   * @param {number} tolerance - Tolerance for comparison
   * @returns {boolean}
   */
  equals(v, tolerance = 0.0001) {
    return Math.abs(this.x - v.x) < tolerance &&
           Math.abs(this.y - v.y) < tolerance;
  }

  /**
   * Convert to string
   * @returns {string}
   */
  toString() {
    return `Vector2D(${this.x}, ${this.y})`;
  }
}

export default Vector2D;
