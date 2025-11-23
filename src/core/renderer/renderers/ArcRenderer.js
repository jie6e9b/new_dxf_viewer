import Layer from '../../parser/styles/Layer.js';

/**
 * ArcRenderer - renders ARC entities
 */
class ArcRenderer {
  constructor(canvasRenderer, tableManager) {
    this.canvasRenderer = canvasRenderer;
    this.tableManager = tableManager;
  }

  /**
   * Check if entity should be rendered
   * @param {ArcEntity} entity
   * @returns {boolean}
   */
  shouldRender(entity) {
    return entity.shouldRender(this.tableManager);
  }

  /**
   * Render arc entity
   * @param {ArcEntity} entity
   */
  render(entity) {
    // Get effective properties
    const color = this.getEntityColor(entity);
    const lineType = entity.getEffectiveLineType(this.tableManager);
    const lineWidth = this.getLineWidth(entity);

    // Get line pattern
    const pattern = lineType.getCanvasPattern(this.canvasRenderer.transform.scale);

    // Set style
    this.canvasRenderer.setLineStyle(color, lineWidth, pattern);

    // Draw arc (angles in radians, counterclockwise)
    this.canvasRenderer.drawArc(
      entity.center.x,
      entity.center.y,
      entity.radius,
      entity.getStartAngleRad(),
      entity.getEndAngleRad()
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
}

export default ArcRenderer;
