import Layer from './Layer.js';
import LineType from './LineType.js';
import TextStyle from './TextStyle.js';

/**
 * TableManager - manages all DXF tables (layers, linetypes, styles, etc.)
 */
class TableManager {
  constructor() {
    this.layers = new Map();
    this.lineTypes = new Map();
    this.textStyles = new Map();

    // Initialize with defaults
    this.initializeDefaults();
  }

  /**
   * Initialize default layer, linetype, and text style
   */
  initializeDefaults() {
    // Default layer "0"
    const defaultLayer = new Layer('0');
    this.layers.set('0', defaultLayer);

    // Default continuous linetype
    const continuous = LineType.CONTINUOUS;
    this.lineTypes.set('CONTINUOUS', continuous);

    // Default standard text style
    const standard = TextStyle.STANDARD;
    this.textStyles.set('STANDARD', standard);
  }

  /**
   * Parse TABLES section and populate all tables
   * @param {Object} tables - Parsed tables from SectionParser
   */
  parseTables(tables) {
    // Parse LAYER table
    if (tables.LAYER) {
      for (const entry of tables.LAYER) {
        if (entry.type === 'LAYER') {
          const layer = Layer.fromTableEntry(entry.data);
          this.layers.set(layer.name, layer);
        }
      }
    }

    // Parse LTYPE (linetype) table
    if (tables.LTYPE) {
      for (const entry of tables.LTYPE) {
        if (entry.type === 'LTYPE') {
          const lineType = LineType.fromTableEntry(entry.data);
          this.lineTypes.set(lineType.name, lineType);
        }
      }
    }

    // Parse STYLE (text style) table
    if (tables.STYLE) {
      for (const entry of tables.STYLE) {
        if (entry.type === 'STYLE') {
          const textStyle = TextStyle.fromTableEntry(entry.data);
          this.textStyles.set(textStyle.name, textStyle);
        }
      }
    }
  }

  /**
   * Get layer by name
   * @param {string} name - Layer name
   * @returns {Layer} Layer object or default layer
   */
  getLayer(name) {
    return this.layers.get(name) || this.layers.get('0');
  }

  /**
   * Get linetype by name
   * @param {string} name - Linetype name
   * @returns {LineType} LineType object or continuous linetype
   */
  getLineType(name) {
    return this.lineTypes.get(name) || this.lineTypes.get('CONTINUOUS');
  }

  /**
   * Get text style by name
   * @param {string} name - Text style name
   * @returns {TextStyle} TextStyle object or standard style
   */
  getTextStyle(name) {
    return this.textStyles.get(name) || this.textStyles.get('STANDARD');
  }

  /**
   * Get all layer names
   * @returns {Array<string>}
   */
  getLayerNames() {
    return Array.from(this.layers.keys());
  }

  /**
   * Get all visible layers
   * @returns {Array<Layer>}
   */
  getVisibleLayers() {
    return Array.from(this.layers.values()).filter(layer => layer.isActive());
  }

  /**
   * Show/hide layer
   * @param {string} name - Layer name
   * @param {boolean} visible - Visibility state
   */
  setLayerVisibility(name, visible) {
    const layer = this.layers.get(name);
    if (layer) {
      layer.visible = visible;
    }
  }

  /**
   * Show all layers
   */
  showAllLayers() {
    for (const layer of this.layers.values()) {
      layer.visible = true;
    }
  }

  /**
   * Hide all layers except specified
   * @param {Array<string>} exceptNames - Layer names to keep visible
   */
  hideAllLayersExcept(exceptNames) {
    for (const [name, layer] of this.layers.entries()) {
      layer.visible = exceptNames.includes(name);
    }
  }

  /**
   * Get statistics about tables
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      layerCount: this.layers.size,
      lineTypeCount: this.lineTypes.size,
      textStyleCount: this.textStyles.size,
      visibleLayerCount: this.getVisibleLayers().length
    };
  }
}

export default TableManager;
