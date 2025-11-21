/**
 * ViewTransform - handles coordinate transformation from DXF space to screen space
 *
 * DXF coordinates are in world space (potentially any scale)
 * Screen coordinates are in pixels
 */
class ViewTransform {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    // View parameters
    this.scale = 1.0;
    this.offsetX = 0;
    this.offsetY = 0;

    // Flip Y axis (DXF uses bottom-left origin, canvas uses top-left)
    this.flipY = true;
  }

  /**
   * Set canvas size
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   */
  setCanvasSize(width, height) {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  /**
   * Transform point from world to screen coordinates
   * @param {number} x - World X coordinate
   * @param {number} y - World Y coordinate
   * @returns {Object} {x, y} in screen coordinates
   */
  worldToScreen(x, y) {
    let screenX = (x + this.offsetX) * this.scale;
    let screenY = (y + this.offsetY) * this.scale;

    if (this.flipY) {
      screenY = this.canvasHeight - screenY;
    }

    return { x: screenX, y: screenY };
  }

  /**
   * Transform point from screen to world coordinates
   * @param {number} screenX - Screen X coordinate
   * @param {number} screenY - Screen Y coordinate
   * @returns {Object} {x, y} in world coordinates
   */
  screenToWorld(screenX, screenY) {
    let y = screenY;
    if (this.flipY) {
      y = this.canvasHeight - screenY;
    }

    const x = (screenX / this.scale) - this.offsetX;
    const worldY = (y / this.scale) - this.offsetY;

    return { x, y: worldY };
  }

  /**
   * Fit bounding box to canvas with padding
   * @param {Object} bounds - {minX, minY, maxX, maxY}
   * @param {number} padding - Padding as fraction of canvas (0-1)
   */
  fitToView(bounds, padding = 0.1) {
    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;

    if (width === 0 || height === 0) {
      // Empty or degenerate bounds
      this.scale = 1;
      this.offsetX = 0;
      this.offsetY = 0;
      return;
    }

    // Calculate scale to fit with padding
    const paddingPx = Math.min(this.canvasWidth, this.canvasHeight) * padding;
    const scaleX = (this.canvasWidth - 2 * paddingPx) / width;
    const scaleY = (this.canvasHeight - 2 * paddingPx) / height;

    // Use smaller scale to fit both dimensions
    this.scale = Math.min(scaleX, scaleY);

    // Center the content
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;

    this.offsetX = (this.canvasWidth / (2 * this.scale)) - centerX;
    this.offsetY = (this.canvasHeight / (2 * this.scale)) - centerY;
  }

  /**
   * Zoom by factor at a specific point
   * @param {number} factor - Zoom factor (>1 = zoom in, <1 = zoom out)
   * @param {number} centerX - Screen X coordinate of zoom center
   * @param {number} centerY - Screen Y coordinate of zoom center
   */
  zoom(factor, centerX = null, centerY = null) {
    // Default to canvas center
    if (centerX === null) centerX = this.canvasWidth / 2;
    if (centerY === null) centerY = this.canvasHeight / 2;

    // Convert center to world coordinates
    const worldCenter = this.screenToWorld(centerX, centerY);

    // Apply zoom
    this.scale *= factor;

    // Clamp scale to reasonable limits
    this.scale = Math.max(0.001, Math.min(this.scale, 10000));

    // Adjust offset to keep the zoom center fixed
    const newScreenCenter = this.worldToScreen(worldCenter.x, worldCenter.y);
    const dx = (centerX - newScreenCenter.x) / this.scale;
    const dy = this.flipY ?
      (newScreenCenter.y - centerY) / this.scale :
      (centerY - newScreenCenter.y) / this.scale;

    this.offsetX += dx;
    this.offsetY += dy;
  }

  /**
   * Pan view by screen pixels
   * @param {number} dx - Delta X in screen pixels
   * @param {number} dy - Delta Y in screen pixels
   */
  pan(dx, dy) {
    this.offsetX += dx / this.scale;
    this.offsetY += (this.flipY ? -dy : dy) / this.scale;
  }

  /**
   * Reset view to default
   */
  reset() {
    this.scale = 1.0;
    this.offsetX = 0;
    this.offsetY = 0;
  }

  /**
   * Get view state
   * @returns {Object} View state
   */
  getState() {
    return {
      scale: this.scale,
      offsetX: this.offsetX,
      offsetY: this.offsetY,
      canvasWidth: this.canvasWidth,
      canvasHeight: this.canvasHeight
    };
  }

  /**
   * Set view state
   * @param {Object} state - View state
   */
  setState(state) {
    this.scale = state.scale;
    this.offsetX = state.offsetX;
    this.offsetY = state.offsetY;
    if (state.canvasWidth) this.canvasWidth = state.canvasWidth;
    if (state.canvasHeight) this.canvasHeight = state.canvasHeight;
  }

  /**
   * Get visible world bounds
   * @returns {Object} {minX, minY, maxX, maxY}
   */
  getVisibleBounds() {
    const topLeft = this.screenToWorld(0, 0);
    const bottomRight = this.screenToWorld(this.canvasWidth, this.canvasHeight);

    return {
      minX: Math.min(topLeft.x, bottomRight.x),
      minY: Math.min(topLeft.y, bottomRight.y),
      maxX: Math.max(topLeft.x, bottomRight.x),
      maxY: Math.max(topLeft.y, bottomRight.y)
    };
  }

  /**
   * Transform distance from world to screen
   * @param {number} distance - World distance
   * @returns {number} Screen distance in pixels
   */
  worldToScreenDistance(distance) {
    return distance * this.scale;
  }

  /**
   * Transform distance from screen to world
   * @param {number} pixels - Screen distance in pixels
   * @returns {number} World distance
   */
  screenToWorldDistance(pixels) {
    return pixels / this.scale;
  }
}

export default ViewTransform;
