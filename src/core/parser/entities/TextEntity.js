import Entity from './Entity.js';

/**
 * TEXT entity
 * Represents single-line text with position, height, rotation, and alignment
 */
class TextEntity extends Entity {
  constructor() {
    super('TEXT');
    this.position = { x: 0, y: 0, z: 0 }; // Insertion point
    this.height = 1.0; // Text height
    this.text = ''; // Text content
    this.rotation = 0; // Rotation angle in degrees
    this.widthFactor = 1.0; // Width scale factor
    this.obliqueAngle = 0; // Oblique angle in degrees
    this.style = 'STANDARD'; // Text style name

    // Alignment
    this.horizontalAlign = 0; // 0=left, 1=center, 2=right, 3=aligned, 4=middle, 5=fit
    this.verticalAlign = 0; // 0=baseline, 1=bottom, 2=middle, 3=top
    this.alignmentPoint = null; // Second alignment point (for aligned/fit)
  }

  /**
   * Parse TEXT entity data
   * @param {Array} data - Group code-value pairs
   * @returns {TextEntity}
   */
  static fromData(data) {
    const text = new TextEntity();
    text.parseCommon(data);

    for (const group of data) {
      switch (group.code) {
        case 1: // Text content
          text.text = group.value;
          break;
        case 7: // Text style name
          text.style = group.value;
          break;
        case 10: // Insertion point X
          text.position.x = group.value;
          break;
        case 20: // Insertion point Y
          text.position.y = group.value;
          break;
        case 30: // Insertion point Z
          text.position.z = group.value;
          break;
        case 11: // Alignment point X
          if (!text.alignmentPoint) {
            text.alignmentPoint = { x: 0, y: 0, z: 0 };
          }
          text.alignmentPoint.x = group.value;
          break;
        case 21: // Alignment point Y
          if (!text.alignmentPoint) {
            text.alignmentPoint = { x: 0, y: 0, z: 0 };
          }
          text.alignmentPoint.y = group.value;
          break;
        case 31: // Alignment point Z
          if (!text.alignmentPoint) {
            text.alignmentPoint = { x: 0, y: 0, z: 0 };
          }
          text.alignmentPoint.z = group.value;
          break;
        case 40: // Text height
          text.height = group.value;
          break;
        case 41: // Width factor
          text.widthFactor = group.value;
          break;
        case 50: // Rotation angle
          text.rotation = group.value;
          break;
        case 51: // Oblique angle
          text.obliqueAngle = group.value;
          break;
        case 72: // Horizontal alignment
          text.horizontalAlign = group.value;
          break;
        case 73: // Vertical alignment
          text.verticalAlign = group.value;
          break;
      }
    }

    return text;
  }

  /**
   * Get bounding box (approximate based on text metrics)
   * @returns {Object} {minX, minY, maxX, maxY}
   */
  getBounds() {
    // Approximate text width based on character count and height
    const charWidth = this.height * 0.6 * this.widthFactor;
    const textWidth = this.text.length * charWidth;
    const textHeight = this.height;

    // Simple axis-aligned bounding box (rotation not considered for now)
    let minX = this.position.x;
    let minY = this.position.y;
    let maxX = this.position.x + textWidth;
    let maxY = this.position.y + textHeight;

    // Adjust for horizontal alignment
    if (this.horizontalAlign === 1) { // Center
      minX = this.position.x - textWidth / 2;
      maxX = this.position.x + textWidth / 2;
    } else if (this.horizontalAlign === 2) { // Right
      minX = this.position.x - textWidth;
      maxX = this.position.x;
    }

    // Adjust for vertical alignment
    if (this.verticalAlign === 2) { // Middle
      minY = this.position.y - textHeight / 2;
      maxY = this.position.y + textHeight / 2;
    } else if (this.verticalAlign === 3) { // Top
      minY = this.position.y - textHeight;
      maxY = this.position.y;
    }

    return { minX, minY, maxX, maxY };
  }

  /**
   * Get actual insertion point considering alignment
   * @returns {Object} {x, y}
   */
  getInsertionPoint() {
    // If alignment point exists, use it for certain alignments
    if (this.alignmentPoint && (this.horizontalAlign > 0 || this.verticalAlign > 0)) {
      return {
        x: this.alignmentPoint.x,
        y: this.alignmentPoint.y
      };
    }
    return {
      x: this.position.x,
      y: this.position.y
    };
  }

  /**
   * Get text baseline offset based on vertical alignment
   * @returns {number} Offset multiplier (0-1)
   */
  getBaselineOffset() {
    switch (this.verticalAlign) {
      case 0: // Baseline
        return 0;
      case 1: // Bottom
        return 0.2; // Approximate descender height
      case 2: // Middle
        return 0.5;
      case 3: // Top
        return 1.0;
      default:
        return 0;
    }
  }

  /**
   * Get text align value for canvas context
   * @returns {string} Canvas text align value
   */
  getCanvasAlign() {
    switch (this.horizontalAlign) {
      case 0: return 'left';
      case 1: return 'center';
      case 2: return 'right';
      case 4: return 'center'; // Middle
      default: return 'left';
    }
  }

  /**
   * Get text baseline value for canvas context
   * @returns {string} Canvas text baseline value
   */
  getCanvasBaseline() {
    switch (this.verticalAlign) {
      case 0: return 'alphabetic';
      case 1: return 'bottom';
      case 2: return 'middle';
      case 3: return 'top';
      default: return 'alphabetic';
    }
  }
}

export default TextEntity;
