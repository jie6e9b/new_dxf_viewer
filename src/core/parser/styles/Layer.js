/**
 * Layer class - represents a DXF layer
 *
 * Layers organize drawing entities and control visibility, color, and linetype
 */
class Layer {
  constructor(name = '0') {
    this.name = name;
    this.color = 7; // White by default
    this.lineType = 'CONTINUOUS';
    this.lineWeight = 0;
    this.visible = true;
    this.locked = false;
    this.frozen = false;
  }

  /**
   * Parse layer from table entry data
   * @param {Array} data - Group code-value pairs
   * @returns {Layer}
   */
  static fromTableEntry(data) {
    const layer = new Layer();

    for (const group of data) {
      switch (group.code) {
        case 2: // Layer name
          layer.name = group.value;
          break;
        case 62: // Color number
          layer.color = group.value;
          if (layer.color < 0) {
            // Negative means layer is off
            layer.visible = false;
            layer.color = Math.abs(layer.color);
          }
          break;
        case 6: // Linetype name
          layer.lineType = group.value;
          break;
        case 70: // Standard flags
          layer.parseFlags(group.value);
          break;
        case 370: // Lineweight
          layer.lineWeight = group.value;
          break;
      }
    }

    return layer;
  }

  /**
   * Parse layer flags
   * @param {number} flags - Bitwise flags
   */
  parseFlags(flags) {
    // Bit 0: Layer is frozen
    this.frozen = (flags & 1) !== 0;
    // Bit 2: Layer is locked
    this.locked = (flags & 4) !== 0;
  }

  /**
   * Check if layer is active (visible and not frozen)
   * @returns {boolean}
   */
  isActive() {
    return this.visible && !this.frozen;
  }

  /**
   * Get AutoCAD Color Index (ACI) color as RGB
   * @returns {string} RGB hex color
   */
  getColor() {
    return Layer.aciToRgb(this.color);
  }

  /**
   * Convert AutoCAD Color Index to RGB
   * @param {number} aci - AutoCAD Color Index (1-255)
   * @returns {string} RGB hex color
   */
  static aciToRgb(aci) {
    // AutoCAD color table (first 10 colors)
    const colors = {
      0: '#000000', // ByBlock
      1: '#FF0000', // Red
      2: '#FFFF00', // Yellow
      3: '#00FF00', // Green
      4: '#00FFFF', // Cyan
      5: '#0000FF', // Blue
      6: '#FF00FF', // Magenta
      7: '#FFFFFF', // White/Black
      8: '#414141', // Gray
      9: '#808080'  // Light gray
    };

    if (colors[aci]) {
      return colors[aci];
    }

    // For colors 10-255, use a simplified mapping
    // In real implementation, you'd use full ACI color table
    if (aci >= 10 && aci <= 249) {
      // Simplified: map to grayscale or use a color palette
      const value = Math.floor(((aci - 10) / 240) * 255);
      return `#${value.toString(16).padStart(2, '0')}${value.toString(16).padStart(2, '0')}${value.toString(16).padStart(2, '0')}`;
    }

    return '#FFFFFF'; // Default white
  }
}

export default Layer;
