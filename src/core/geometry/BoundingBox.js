/**
 * BoundingBox - Axis-aligned bounding box
 */
class BoundingBox {
  constructor(minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity) {
    this.minX = minX;
    this.minY = minY;
    this.maxX = maxX;
    this.maxY = maxY;
  }

  /**
   * Create from array of points
   * @param {Array} points - Array of {x, y} objects
   * @returns {BoundingBox}
   */
  static fromPoints(points) {
    const box = new BoundingBox();
    for (const point of points) {
      box.expand(point.x, point.y);
    }
    return box;
  }

  /**
   * Create from entities
   * @param {Array<Entity>} entities - Array of entities
   * @returns {BoundingBox}
   */
  static fromEntities(entities) {
    const box = new BoundingBox();
    for (const entity of entities) {
      const entityBounds = entity.getBounds();
      box.expandByBox(entityBounds);
    }
    return box;
  }

  /**
   * Expand box to include point
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  expand(x, y) {
    this.minX = Math.min(this.minX, x);
    this.minY = Math.min(this.minY, y);
    this.maxX = Math.max(this.maxX, x);
    this.maxY = Math.max(this.maxY, y);
  }

  /**
   * Expand box to include another box
   * @param {Object} box - {minX, minY, maxX, maxY}
   */
  expandByBox(box) {
    this.minX = Math.min(this.minX, box.minX);
    this.minY = Math.min(this.minY, box.minY);
    this.maxX = Math.max(this.maxX, box.maxX);
    this.maxY = Math.max(this.maxY, box.maxY);
  }

  /**
   * Get width
   * @returns {number}
   */
  getWidth() {
    return this.maxX - this.minX;
  }

  /**
   * Get height
   * @returns {number}
   */
  getHeight() {
    return this.maxY - this.minY;
  }

  /**
   * Get center point
   * @returns {Object} {x, y}
   */
  getCenter() {
    return {
      x: (this.minX + this.maxX) / 2,
      y: (this.minY + this.maxY) / 2
    };
  }

  /**
   * Get area
   * @returns {number}
   */
  getArea() {
    return this.getWidth() * this.getHeight();
  }

  /**
   * Check if box is empty (not initialized)
   * @returns {boolean}
   */
  isEmpty() {
    return this.minX === Infinity || this.maxX === -Infinity;
  }

  /**
   * Check if box contains point
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {boolean}
   */
  contains(x, y) {
    return x >= this.minX && x <= this.maxX &&
           y >= this.minY && y <= this.maxY;
  }

  /**
   * Check if box intersects with another box
   * @param {BoundingBox} box - Other box
   * @returns {boolean}
   */
  intersects(box) {
    return !(box.maxX < this.minX ||
             box.minX > this.maxX ||
             box.maxY < this.minY ||
             box.minY > this.maxY);
  }

  /**
   * Add padding to box
   * @param {number} padding - Padding amount
   * @returns {BoundingBox} New padded box
   */
  pad(padding) {
    return new BoundingBox(
      this.minX - padding,
      this.minY - padding,
      this.maxX + padding,
      this.maxY + padding
    );
  }

  /**
   * Clone box
   * @returns {BoundingBox}
   */
  clone() {
    return new BoundingBox(this.minX, this.minY, this.maxX, this.maxY);
  }

  /**
   * Convert to object
   * @returns {Object}
   */
  toObject() {
    return {
      minX: this.minX,
      minY: this.minY,
      maxX: this.maxX,
      maxY: this.maxY,
      width: this.getWidth(),
      height: this.getHeight(),
      center: this.getCenter()
    };
  }

  /**
   * Convert to string
   * @returns {string}
   */
  toString() {
    return `BoundingBox(${this.minX}, ${this.minY}, ${this.maxX}, ${this.maxY})`;
  }
}

export default BoundingBox;
