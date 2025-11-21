/**
 * TextStyle class - represents a DXF text style definition
 *
 * Text styles define font, height, width factor, and oblique angle for text
 */
class TextStyle {
  constructor(name = 'STANDARD') {
    this.name = name;
    this.fontName = 'Arial';
    this.height = 0; // 0 means variable height
    this.widthFactor = 1.0;
    this.obliqueAngle = 0;
    this.isBackward = false;
    this.isUpsideDown = false;
    this.isVertical = false;
  }

  /**
   * Parse text style from table entry data
   * @param {Array} data - Group code-value pairs
   * @returns {TextStyle}
   */
  static fromTableEntry(data) {
    const style = new TextStyle();

    for (const group of data) {
      switch (group.code) {
        case 2: // Style name
          style.name = group.value;
          break;
        case 3: // Primary font file name
          style.fontName = group.value || 'Arial';
          // Remove .shx extension if present
          style.fontName = style.fontName.replace(/\.shx$/i, '');
          break;
        case 40: // Fixed text height (0 = not fixed)
          style.height = group.value;
          break;
        case 41: // Width factor
          style.widthFactor = group.value;
          break;
        case 50: // Oblique angle
          style.obliqueAngle = group.value;
          break;
        case 71: // Text generation flags
          style.parseFlags(group.value);
          break;
      }
    }

    return style;
  }

  /**
   * Parse text generation flags
   * @param {number} flags - Bitwise flags
   */
  parseFlags(flags) {
    // Bit 0: Text is backward (mirrored in X)
    this.isBackward = (flags & 2) !== 0;
    // Bit 1: Text is upside down (mirrored in Y)
    this.isUpsideDown = (flags & 4) !== 0;
  }

  /**
   * Map DXF font to web-safe font
   * @returns {string} CSS font family
   */
  getCSSFont() {
    const fontMap = {
      'txt': 'monospace',
      'simplex': 'Arial',
      'standard': 'Arial',
      'romans': 'Times New Roman',
      'italic': 'Arial Italic',
      'bold': 'Arial Bold'
    };

    const fontKey = this.fontName.toLowerCase();
    return fontMap[fontKey] || 'Arial, sans-serif';
  }

  /**
   * Get CSS font size
   * @param {number} textHeight - Text height from entity
   * @returns {number} Font size in pixels
   */
  getFontSize(textHeight) {
    // If style has fixed height, use it
    if (this.height > 0) {
      return this.height;
    }
    // Otherwise use entity's height
    return textHeight || 12;
  }

  /**
   * Get CSS transform for text styling
   * @returns {string} CSS transform string
   */
  getTransform() {
    const transforms = [];

    if (this.widthFactor !== 1.0) {
      transforms.push(`scaleX(${this.widthFactor})`);
    }

    if (this.obliqueAngle !== 0) {
      transforms.push(`skewX(${this.obliqueAngle}deg)`);
    }

    if (this.isBackward) {
      transforms.push('scaleX(-1)');
    }

    if (this.isUpsideDown) {
      transforms.push('scaleY(-1)');
    }

    return transforms.join(' ');
  }

  /**
   * Default standard style
   */
  static get STANDARD() {
    return new TextStyle('STANDARD');
  }
}

export default TextStyle;
