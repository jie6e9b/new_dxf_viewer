import Layer from '../../parser/styles/Layer.js';

/**
 * TextRenderer - renders TEXT entities on canvas
 */
class TextRenderer {
  constructor(canvasRenderer, tableManager, fontManager) {
    this.canvasRenderer = canvasRenderer;
    this.tableManager = tableManager;
    this.fontManager = fontManager;

    // LOD threshold: minimum text height in pixels to render
    this.minTextHeightPx = 3;
  }

  /**
   * Check if entity should be rendered
   * @param {TextEntity} entity
   * @returns {boolean}
   */
  shouldRender(entity) {
    if (!entity.shouldRender(this.tableManager)) {
      return false;
    }

    // LOD: Skip very small text
    const heightPx = entity.height * this.canvasRenderer.transform.scale;
    return heightPx >= this.minTextHeightPx;
  }

  /**
   * Render text entity
   * @param {TextEntity} entity
   */
  render(entity) {
    if (!entity.text || entity.text.trim() === '') {
      return; // Skip empty text
    }

    const ctx = this.canvasRenderer.ctx;

    // Get effective properties
    const color = this.getEntityColor(entity);
    const textStyle = this.tableManager.getTextStyle(entity.style) || {};

    // Save context state
    ctx.save();

    // Get insertion point
    const point = entity.getInsertionPoint();

    // Transform to text position with rotation
    ctx.translate(point.x, point.y);

    // Rotate (convert degrees to radians)
    if (entity.rotation !== 0) {
      ctx.rotate(entity.rotation * Math.PI / 180);
    }

    // Scale for width factor
    if (entity.widthFactor !== 1.0) {
      ctx.scale(entity.widthFactor, 1.0);
    }

    // Apply oblique (shear)
    if (entity.obliqueAngle !== 0) {
      const shear = Math.tan(entity.obliqueAngle * Math.PI / 180);
      ctx.transform(1, 0, shear, 1, 0, 0);
    }

    // Set font
    const fontFamily = textStyle.fontFamily || 'STANDARD';
    const cssFont = this.fontManager.getCSSFont(fontFamily, entity.height);
    ctx.font = cssFont;

    // Set alignment
    ctx.textAlign = entity.getCanvasAlign();
    ctx.textBaseline = entity.getCanvasBaseline();

    // Set color
    ctx.fillStyle = color;

    // Draw text
    ctx.fillText(entity.text, 0, 0);

    // Restore context state
    ctx.restore();
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
   * Set minimum text height threshold for LOD
   * @param {number} minHeightPx - Minimum height in pixels
   */
  setLODThreshold(minHeightPx) {
    this.minTextHeightPx = minHeightPx;
  }
}

export default TextRenderer;
