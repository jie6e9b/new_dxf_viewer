/**
 * Base Entity class
 * All DXF entities inherit from this class
 */
class Entity {
  constructor(type) {
    this.type = type;
    this.layer = '0';
    this.color = null; // null = BYLAYER
    this.lineType = null; // null = BYLAYER
    this.lineWeight = null; // null = BYLAYER
    this.handle = null;
    this.visible = true;
  }

  /**
   * Parse common entity properties
   * @param {Array} data - Group code-value pairs
   */
  parseCommon(data) {
    for (const group of data) {
      switch (group.code) {
        case 5: // Handle
          this.handle = group.value;
          break;
        case 8: // Layer name
          this.layer = group.value;
          break;
        case 62: // Color number
          this.color = group.value;
          break;
        case 6: // Linetype name
          this.lineType = group.value;
          break;
        case 370: // Lineweight
          this.lineWeight = group.value;
          break;
        case 60: // Visibility (1 = invisible)
          this.visible = group.value === 0;
          break;
      }
    }
  }

  /**
   * Get effective color (considering BYLAYER)
   * @param {TableManager} tables - Table manager
   * @returns {number} Color index
   */
  getEffectiveColor(tables) {
    if (this.color !== null) {
      return this.color;
    }
    const layer = tables.getLayer(this.layer);
    return layer.color;
  }

  /**
   * Get effective linetype (considering BYLAYER)
   * @param {TableManager} tables - Table manager
   * @returns {LineType}
   */
  getEffectiveLineType(tables) {
    if (this.lineType !== null) {
      return tables.getLineType(this.lineType);
    }
    const layer = tables.getLayer(this.layer);
    return tables.getLineType(layer.lineType);
  }

  /**
   * Check if entity should be rendered
   * @param {TableManager} tables - Table manager
   * @returns {boolean}
   */
  shouldRender(tables) {
    if (!this.visible) {
      return false;
    }
    const layer = tables.getLayer(this.layer);
    return layer.isActive();
  }

  /**
   * Get bounding box
   * @returns {Object} {minX, minY, maxX, maxY}
   */
  getBounds() {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
}

export default Entity;
