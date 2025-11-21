import Layer from '../../parser/styles/Layer.js';

/**
 * LineRenderer - renders LINE entities
 */
class LineRenderer {
  constructor(canvasRenderer, tableManager) {
    this.canvasRenderer = canvasRenderer;
    this.tableManager = tableManager;
  }

  /**
   * Render LINE entity
   * @param {LineEntity} entity - LINE entity
   */
  render(entity) {
    // Get effective properties
    const color = this.getEntityColor(entity);
    const lineType = entity.getEffectiveLineType(this.tableManager);
    const lineWidth = this.getLineWidth(entity);

    // Get dash pattern
    const dashPattern = lineType.getCanvasPattern(
      this.canvasRenderer.transform.scale
    );

    // Set style
    this.canvasRenderer.setLineStyle(color, lineWidth, dashPattern);

    // Draw line
    this.canvasRenderer.drawLine(
      entity.start.x,
      entity.start.y,
      entity.end.x,
      entity.end.y
    );
  }

  /**
   * Get entity color as RGB hex
   * @param {Entity} entity - Entity
   * @returns {string} RGB hex color
   */
  getEntityColor(entity) {
    const colorIndex = entity.getEffectiveColor(this.tableManager);
    return Layer.aciToRgb(colorIndex);
  }

  /**
   * Get line width in world units
   * @param {Entity} entity - Entity
   * @returns {number} Line width
   */
  getLineWidth(entity) {
    // Convert lineweight to pixels
    // DXF lineweight is in 1/100mm, we'll use a simplified conversion
    if (entity.lineWeight !== null && entity.lineWeight > 0) {
      return entity.lineWeight * 0.01;
    }

    const layer = this.tableManager.getLayer(entity.layer);
    if (layer.lineWeight > 0) {
      return layer.lineWeight * 0.01;
    }

    // Default thin line
    return 0.5 / this.canvasRenderer.transform.scale;
  }

  /**
   * Check if entity should be rendered
   * @param {Entity} entity - Entity
   * @returns {boolean}
   */
  shouldRender(entity) {
    return entity.shouldRender(this.tableManager);
  }
}

export default LineRenderer;
