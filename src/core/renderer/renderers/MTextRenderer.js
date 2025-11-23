import Layer from '../../parser/styles/Layer.js';

/**
 * MTextRenderer - renders MTEXT entities on canvas
 */
class MTextRenderer {
  constructor(canvasRenderer, tableManager, fontManager) {
    this.canvasRenderer = canvasRenderer;
    this.tableManager = tableManager;
    this.fontManager = fontManager;

    // LOD threshold: minimum text height in pixels to render
    this.minTextHeightPx = 3;
  }

  /**
   * Check if entity should be rendered
   * @param {MTextEntity} entity
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
   * Render mtext entity
   * @param {MTextEntity} entity
   */
  render(entity) {
    if (entity.lines.length === 0) {
      return; // Skip empty text
    }

    const ctx = this.canvasRenderer.ctx;

    // Get effective properties
    const color = this.getEntityColor(entity);
    const textStyle = this.tableManager.getTextStyle(entity.style) || {};

    // Save context state
    ctx.save();

    // Transform to text position with rotation
    ctx.translate(entity.position.x, entity.position.y);

    // Rotate (convert degrees to radians)
    if (entity.rotation !== 0) {
      ctx.rotate(entity.rotation * Math.PI / 180);
    }

    // Set font
    const fontFamily = textStyle.fontFamily || 'STANDARD';
    const cssFont = this.fontManager.getCSSFont(fontFamily, entity.height);
    ctx.font = cssFont;

    // Set color
    ctx.fillStyle = color;

    // Calculate line height
    const lineHeight = entity.height * 1.5;

    // Get alignment based on attachment point
    const align = this.getAlignment(entity.attachmentPoint);
    ctx.textAlign = align.horizontal;
    ctx.textBaseline = 'top';

    // Calculate starting y offset based on attachment
    let yOffset = this.getVerticalOffset(entity, lineHeight);

    // Render each line
    for (let i = 0; i < entity.lines.length; i++) {
      const line = entity.lines[i];
      const y = yOffset + i * lineHeight;

      // Calculate x offset based on horizontal alignment
      const x = this.getHorizontalOffset(entity, line.length);

      ctx.fillText(line, x, y);
    }

    // Restore context state
    ctx.restore();
  }

  /**
   * Get horizontal and vertical alignment from attachment point
   * @param {number} attachmentPoint - 1-9 grid point
   * @returns {Object} {horizontal, vertical}
   */
  getAlignment(attachmentPoint) {
    const hAlign = ((attachmentPoint - 1) % 3);
    const vAlign = Math.floor((attachmentPoint - 1) / 3);

    const horizontal = ['left', 'center', 'right'][hAlign] || 'left';
    const vertical = ['top', 'middle', 'bottom'][vAlign] || 'top';

    return { horizontal, vertical };
  }

  /**
   * Get vertical offset for text based on attachment point
   * @param {MTextEntity} entity
   * @param {number} lineHeight
   * @returns {number} Vertical offset
   */
  getVerticalOffset(entity, lineHeight) {
    const vAlign = Math.floor((entity.attachmentPoint - 1) / 3);
    const totalHeight = entity.lines.length * lineHeight;

    switch (vAlign) {
      case 0: // Top
        return 0;
      case 1: // Middle
        return -totalHeight / 2;
      case 2: // Bottom
        return -totalHeight;
      default:
        return 0;
    }
  }

  /**
   * Get horizontal offset for text based on attachment point and width
   * @param {MTextEntity} entity
   * @param {number} lineLength - Length of the line in characters
   * @returns {number} Horizontal offset
   */
  getHorizontalOffset(entity, lineLength) {
    const hAlign = ((entity.attachmentPoint - 1) % 3);

    // If column width is specified, use it; otherwise estimate
    const textWidth = entity.width > 0 ? entity.width : lineLength * entity.height * 0.6;

    switch (hAlign) {
      case 0: // Left
        return 0;
      case 1: // Center
        return entity.width > 0 ? entity.width / 2 : 0;
      case 2: // Right
        return entity.width > 0 ? entity.width : 0;
      default:
        return 0;
    }
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

export default MTextRenderer;
