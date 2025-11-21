/**
 * LineType class - represents a DXF linetype definition
 *
 * Linetypes define the pattern of dashes, dots, and spaces for lines
 */
class LineType {
  constructor(name = 'CONTINUOUS') {
    this.name = name;
    this.description = '';
    this.pattern = []; // Array of dash/space lengths
    this.patternLength = 0;
  }

  /**
   * Parse linetype from table entry data
   * @param {Array} data - Group code-value pairs
   * @returns {LineType}
   */
  static fromTableEntry(data) {
    const lineType = new LineType();
    let dashLengths = [];

    for (const group of data) {
      switch (group.code) {
        case 2: // Linetype name
          lineType.name = group.value;
          break;
        case 3: // Description
          lineType.description = group.value;
          break;
        case 40: // Total pattern length
          lineType.patternLength = group.value;
          break;
        case 49: // Dash, dot or space length
          dashLengths.push(group.value);
          break;
        case 73: // Number of dash length items
          // This tells us how many pattern elements to expect
          break;
      }
    }

    lineType.pattern = dashLengths;
    return lineType;
  }

  /**
   * Check if this is a continuous line
   * @returns {boolean}
   */
  isContinuous() {
    return this.name === 'CONTINUOUS' || this.pattern.length === 0;
  }

  /**
   * Get canvas-compatible dash pattern
   * Converts DXF pattern to format usable with ctx.setLineDash()
   * @param {number} scale - Scale factor
   * @returns {Array<number>}
   */
  getCanvasPattern(scale = 1) {
    if (this.isContinuous()) {
      return [];
    }

    // Convert DXF pattern (positive = dash, negative = space) to canvas format
    return this.pattern.map(length => Math.abs(length) * scale);
  }

  /**
   * Common predefined linetypes
   */
  static get CONTINUOUS() {
    const lt = new LineType('CONTINUOUS');
    lt.description = 'Solid line';
    return lt;
  }

  static get DASHED() {
    const lt = new LineType('DASHED');
    lt.description = 'Dashed _ _ _ _ _';
    lt.pattern = [0.5, -0.25];
    lt.patternLength = 0.75;
    return lt;
  }

  static get DOTTED() {
    const lt = new LineType('DOTTED');
    lt.description = 'Dotted . . . . .';
    lt.pattern = [0, -0.25];
    lt.patternLength = 0.25;
    return lt;
  }

  static get DASHDOT() {
    const lt = new LineType('DASHDOT');
    lt.description = 'Dash dot _ . _ . _';
    lt.pattern = [0.5, -0.25, 0, -0.25];
    lt.patternLength = 1.0;
    return lt;
  }
}

export default LineType;
