import Layer from '../../parser/styles/Layer.js';

/**
 * PolylineRenderer - renders POLYLINE entities
 */
class PolylineRenderer {
  constructor(canvasRenderer, tableManager) {
    this.canvasRenderer = canvasRenderer;
    this.tableManager = tableManager;
  }

  /**
   * Check if entity should be rendered
   * @param {PolylineEntity} entity
   * @returns {boolean}
   */
  shouldRender(entity) {
    return entity.shouldRender(this.tableManager);
  }

  /**
   * Render polyline entity
   * @param {PolylineEntity} entity
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

    // Get segments (line and arc segments)
    const segments = entity.getSegments();

    // Render each segment
    for (const segment of segments) {
      if (segment.type === 'line') {
        this.canvasRenderer.drawLine(
          segment.start.x,
          segment.start.y,
          segment.end.x,
          segment.end.y
        );
      } else if (segment.type === 'arc') {
        // Draw arc segment
        this.renderArcSegment(segment);
      }
    }
  }

  /**
   * Render arc segment from polyline bulge
   * @param {Object} segment - Arc segment with center, radius, startAngle, endAngle
   */
  renderArcSegment(segment) {
    const ctx = this.canvasRenderer.ctx;

    ctx.beginPath();
    ctx.arc(
      segment.center.x,
      segment.center.y,
      segment.radius,
      segment.startAngle,
      segment.endAngle,
      !segment.counterclockwise
    );
    ctx.stroke();
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

export default PolylineRenderer;
