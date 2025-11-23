import Entity from './Entity.js';

/**
 * Dimension types enumeration
 */
export const DimensionType = {
  LINEAR: 0,      // Rotated, horizontal, or vertical
  ALIGNED: 1,     // Aligned with extension line origins
  ANGULAR: 2,     // Angular dimension
  DIAMETER: 3,    // Diameter dimension
  RADIUS: 4,      // Radius dimension
  ANGULAR3P: 5,   // Angular 3-point
  ORDINATE: 6     // Ordinate dimension
};

/**
 * Arrow types for dimension rendering
 */
export const ArrowType = {
  CLOSED: 'closed',           // Closed filled arrow
  OPEN: 'open',               // Open arrow
  DOT: 'dot',                 // Dot
  TICK: 'tick',               // Architectural tick
  NONE: 'none'                // No arrow
};

/**
 * DimensionEntity - represents a dimension in the drawing
 * Supports linear, aligned, angular, radial, and diameter dimensions
 */
class DimensionEntity extends Entity {
  constructor() {
    super('DIMENSION');

    // Dimension type (0-6, see DimensionType enum)
    this.dimensionType = DimensionType.LINEAR;

    // Block name (reference to dimension geometry block)
    this.blockName = '';

    // Dimension style name
    this.styleName = 'STANDARD';

    // Definition points (depend on dimension type)
    this.defPoint = { x: 0, y: 0, z: 0 };           // Base definition point (10, 20, 30)
    this.textMidPoint = { x: 0, y: 0, z: 0 };       // Text middle point (11, 21, 31)
    this.defPoint2 = { x: 0, y: 0, z: 0 };          // Second definition point (13, 23, 33)
    this.defPoint3 = { x: 0, y: 0, z: 0 };          // Third definition point (14, 24, 34)
    this.defPoint4 = { x: 0, y: 0, z: 0 };          // Fourth definition point (15, 25, 35)
    this.arcPoint = { x: 0, y: 0, z: 0 };           // Arc center for angular (16, 26, 36)

    // Dimension text and measurement
    this.text = '';              // Dimension text (1) - empty means auto-generated
    this.actualMeasurement = 0;  // Actual measurement value (42)

    // Angles and rotation
    this.angle = 0;              // Angle of rotated dimensions (50)
    this.horizontalDirection = 0; // Horizontal direction (51)
    this.obliqueAngle = 0;       // Oblique angle (52)
    this.textRotation = 0;       // Text rotation angle (53)

    // Dimension line position (for linear/aligned)
    this.dimLinePosition = { x: 0, y: 0 };

    // Arrow properties (can be overridden by dimension style)
    this.arrowSize = 2.5;
    this.arrowType = ArrowType.CLOSED;

    // Text properties
    this.textHeight = 2.5;
    this.textGap = 0.625;        // Gap between text and dimension line

    // Extension line properties
    this.extLineOffset = 0.625;  // Offset from origin
    this.extLineExtend = 1.25;   // Extension beyond dimension line
  }

  /**
   * Parse DIMENSION entity from DXF data
   * @param {Array} data - Array of {code, value} pairs
   * @returns {DimensionEntity}
   */
  static fromData(data) {
    const dimension = new DimensionEntity();
    dimension.parseCommon(data);

    for (const group of data) {
      switch (group.code) {
        // Block and style names
        case 2:
          dimension.blockName = group.value;
          break;
        case 3:
          dimension.styleName = group.value;
          break;

        // Definition points
        case 10:
          dimension.defPoint.x = parseFloat(group.value);
          break;
        case 20:
          dimension.defPoint.y = parseFloat(group.value);
          break;
        case 30:
          dimension.defPoint.z = parseFloat(group.value);
          break;

        // Text middle point
        case 11:
          dimension.textMidPoint.x = parseFloat(group.value);
          break;
        case 21:
          dimension.textMidPoint.y = parseFloat(group.value);
          break;
        case 31:
          dimension.textMidPoint.z = parseFloat(group.value);
          break;

        // Second definition point (extension line 1)
        case 13:
          dimension.defPoint2.x = parseFloat(group.value);
          break;
        case 23:
          dimension.defPoint2.y = parseFloat(group.value);
          break;
        case 33:
          dimension.defPoint2.z = parseFloat(group.value);
          break;

        // Third definition point (extension line 2)
        case 14:
          dimension.defPoint3.x = parseFloat(group.value);
          break;
        case 24:
          dimension.defPoint3.y = parseFloat(group.value);
          break;
        case 34:
          dimension.defPoint3.z = parseFloat(group.value);
          break;

        // Fourth definition point (for diameter/radius)
        case 15:
          dimension.defPoint4.x = parseFloat(group.value);
          break;
        case 25:
          dimension.defPoint4.y = parseFloat(group.value);
          break;
        case 35:
          dimension.defPoint4.z = parseFloat(group.value);
          break;

        // Arc center point (for angular dimensions)
        case 16:
          dimension.arcPoint.x = parseFloat(group.value);
          break;
        case 26:
          dimension.arcPoint.y = parseFloat(group.value);
          break;
        case 36:
          dimension.arcPoint.z = parseFloat(group.value);
          break;

        // Dimension type
        case 70:
          dimension.dimensionType = parseInt(group.value);
          break;

        // Dimension text
        case 1:
          dimension.text = group.value;
          break;

        // Actual measurement
        case 42:
          dimension.actualMeasurement = parseFloat(group.value);
          break;

        // Angles
        case 50:
          dimension.angle = parseFloat(group.value);
          break;
        case 51:
          dimension.horizontalDirection = parseFloat(group.value);
          break;
        case 52:
          dimension.obliqueAngle = parseFloat(group.value);
          break;
        case 53:
          dimension.textRotation = parseFloat(group.value);
          break;
      }
    }

    // Calculate dimension line position for linear/aligned dimensions
    dimension.calculateDimLinePosition();

    return dimension;
  }

  /**
   * Calculate dimension line position based on definition points
   */
  calculateDimLinePosition() {
    // For linear and aligned dimensions, dimension line passes through defPoint
    // and is parallel to the line between defPoint2 and defPoint3

    if (this.dimensionType === DimensionType.LINEAR ||
        this.dimensionType === DimensionType.ALIGNED) {
      // defPoint is the point on the dimension line
      // defPoint2 and defPoint3 are the extension line origins
      this.dimLinePosition.x = this.defPoint.x;
      this.dimLinePosition.y = this.defPoint.y;
    }
  }

  /**
   * Get dimension text to display
   * If text is empty or '<>', use actual measurement
   * @returns {string}
   */
  getDisplayText() {
    if (!this.text || this.text === '<>') {
      // Auto-generate from actual measurement
      return this.actualMeasurement.toFixed(2);
    }
    return this.text;
  }

  /**
   * Get bounds of dimension entity
   * @returns {Object} {minX, minY, maxX, maxY}
   */
  getBounds() {
    const points = [
      this.defPoint,
      this.textMidPoint,
      this.defPoint2,
      this.defPoint3,
      this.defPoint4,
      this.arcPoint
    ].filter(p => p.x !== 0 || p.y !== 0);

    if (points.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }

    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);

    return {
      minX: Math.min(...xs),
      minY: Math.min(...ys),
      maxX: Math.max(...xs),
      maxY: Math.max(...ys)
    };
  }

  /**
   * Check if this is a linear dimension
   * @returns {boolean}
   */
  isLinear() {
    return this.dimensionType === DimensionType.LINEAR;
  }

  /**
   * Check if this is an aligned dimension
   * @returns {boolean}
   */
  isAligned() {
    return this.dimensionType === DimensionType.ALIGNED;
  }

  /**
   * Check if this is an angular dimension
   * @returns {boolean}
   */
  isAngular() {
    return this.dimensionType === DimensionType.ANGULAR ||
           this.dimensionType === DimensionType.ANGULAR3P;
  }

  /**
   * Check if this is a radial dimension
   * @returns {boolean}
   */
  isRadial() {
    return this.dimensionType === DimensionType.RADIUS;
  }

  /**
   * Check if this is a diameter dimension
   * @returns {boolean}
   */
  isDiameter() {
    return this.dimensionType === DimensionType.DIAMETER;
  }
}

export default DimensionEntity;
