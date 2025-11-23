import ArrowRenderer from '../ArrowRenderer.js';
import { DimensionType, ArrowType } from '../../parser/entities/DimensionEntity.js';
import Layer from '../../parser/styles/Layer.js';

/**
 * DimensionRenderer - renders DIMENSION entities
 * Supports linear, aligned, angular, radial, and diameter dimensions
 */
class DimensionRenderer {
  constructor(canvasRenderer, tableManager, fontManager) {
    this.canvasRenderer = canvasRenderer;
    this.tableManager = tableManager;
    this.fontManager = fontManager;
  }

  /**
   * Check if entity should be rendered
   * @param {DimensionEntity} entity
   * @returns {boolean}
   */
  shouldRender(entity) {
    return entity.shouldRender(this.tableManager);
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
   * Render dimension entity
   * @param {DimensionEntity} entity - Dimension entity to render
   */
  render(entity) {
    const ctx = this.canvasRenderer.ctx;
    const color = this.getEntityColor(entity);

    ctx.save();

    // Render based on dimension type
    switch (entity.dimensionType) {
      case DimensionType.LINEAR:
        this.renderLinearDimension(entity, color);
        break;
      case DimensionType.ALIGNED:
        this.renderAlignedDimension(entity, color);
        break;
      case DimensionType.ANGULAR:
      case DimensionType.ANGULAR3P:
        this.renderAngularDimension(entity, color);
        break;
      case DimensionType.RADIUS:
        this.renderRadialDimension(entity, color);
        break;
      case DimensionType.DIAMETER:
        this.renderDiameterDimension(entity, color);
        break;
      default:
        console.warn(`Unsupported dimension type: ${entity.dimensionType}`);
    }

    ctx.restore();
  }

  /**
   * Render linear dimension (horizontal, vertical, or rotated)
   * @param {DimensionEntity} entity - Dimension entity
   * @param {string} color - Line color
   */
  renderLinearDimension(entity, color) {
    const ctx = this.canvasRenderer.ctx;

    // Get extension line origins
    const p1 = entity.defPoint2;  // First extension line origin
    const p2 = entity.defPoint3;  // Second extension line origin
    const dimLine = entity.defPoint;  // Point on dimension line

    // Calculate dimension line angle
    let angle = entity.angle * Math.PI / 180;

    // Calculate dimension line endpoints
    // Project p1 and p2 onto dimension line
    const dimLineDir = { x: Math.cos(angle), y: Math.sin(angle) };
    const dimLinePerpDir = { x: -Math.sin(angle), y: Math.cos(angle) };

    // Distance from p1 to dimension line
    const v1 = { x: dimLine.x - p1.x, y: dimLine.y - p1.y };
    const dist1 = v1.x * dimLinePerpDir.x + v1.y * dimLinePerpDir.y;

    // Dimension line endpoints
    const dimP1 = {
      x: p1.x + dimLinePerpDir.x * dist1,
      y: p1.y + dimLinePerpDir.y * dist1
    };

    const v2 = { x: dimLine.x - p2.x, y: dimLine.y - p2.y };
    const dist2 = v2.x * dimLinePerpDir.x + v2.y * dimLinePerpDir.y;

    const dimP2 = {
      x: p2.x + dimLinePerpDir.x * dist2,
      y: p2.y + dimLinePerpDir.y * dist2
    };

    // Draw extension lines
    this.drawExtensionLine(ctx, p1, dimP1, color, entity.extLineOffset, entity.extLineExtend);
    this.drawExtensionLine(ctx, p2, dimP2, color, entity.extLineOffset, entity.extLineExtend);

    // Draw dimension line
    this.drawDimensionLine(ctx, dimP1, dimP2, color);

    // Draw arrows
    const arrowSize = entity.arrowSize;
    ArrowRenderer.renderArrowFromTo(ctx, dimP2.x, dimP2.y, dimP1.x, dimP1.y, arrowSize, entity.arrowType, color);
    ArrowRenderer.renderArrowFromTo(ctx, dimP1.x, dimP1.y, dimP2.x, dimP2.y, arrowSize, entity.arrowType, color);

    // Draw text
    const textPos = entity.textMidPoint;
    this.drawDimensionText(ctx, entity.getDisplayText(), textPos, entity.textRotation, entity.textHeight, color);
  }

  /**
   * Render aligned dimension (parallel to extension line origins)
   * @param {DimensionEntity} entity - Dimension entity
   * @param {string} color - Line color
   */
  renderAlignedDimension(entity, color) {
    const ctx = this.canvasRenderer.ctx;

    const p1 = entity.defPoint2;
    const p2 = entity.defPoint3;
    const dimLine = entity.defPoint;

    // Calculate angle between p1 and p2
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const angle = Math.atan2(dy, dx);

    // Perpendicular direction
    const perpAngle = angle + Math.PI / 2;
    const perpDir = { x: Math.cos(perpAngle), y: Math.sin(perpAngle) };

    // Find dimension line position
    const v = { x: dimLine.x - p1.x, y: dimLine.y - p1.y };
    const dist = v.x * perpDir.x + v.y * perpDir.y;

    // Dimension line endpoints
    const dimP1 = {
      x: p1.x + perpDir.x * dist,
      y: p1.y + perpDir.y * dist
    };

    const dimP2 = {
      x: p2.x + perpDir.x * dist,
      y: p2.y + perpDir.y * dist
    };

    // Draw extension lines
    this.drawExtensionLine(ctx, p1, dimP1, color, entity.extLineOffset, entity.extLineExtend);
    this.drawExtensionLine(ctx, p2, dimP2, color, entity.extLineOffset, entity.extLineExtend);

    // Draw dimension line
    this.drawDimensionLine(ctx, dimP1, dimP2, color);

    // Draw arrows
    const arrowSize = entity.arrowSize;
    ArrowRenderer.renderArrowFromTo(ctx, dimP2.x, dimP2.y, dimP1.x, dimP1.y, arrowSize, entity.arrowType, color);
    ArrowRenderer.renderArrowFromTo(ctx, dimP1.x, dimP1.y, dimP2.x, dimP2.y, arrowSize, entity.arrowType, color);

    // Draw text
    const textPos = entity.textMidPoint;
    const textAngle = entity.textRotation || (angle * 180 / Math.PI);
    this.drawDimensionText(ctx, entity.getDisplayText(), textPos, textAngle, entity.textHeight, color);
  }

  /**
   * Render angular dimension (angle between two lines)
   * @param {DimensionEntity} entity - Dimension entity
   * @param {string} color - Line color
   */
  renderAngularDimension(entity, color) {
    const ctx = this.canvasRenderer.ctx;

    const center = entity.arcPoint;
    const p1 = entity.defPoint2;
    const p2 = entity.defPoint3;
    const arcPoint = entity.defPoint;

    // Calculate angles
    const angle1 = Math.atan2(p1.y - center.y, p1.x - center.x);
    const angle2 = Math.atan2(p2.y - center.y, p2.x - center.x);

    // Calculate radius from center to arc point
    const dx = arcPoint.x - center.x;
    const dy = arcPoint.y - center.y;
    const radius = Math.sqrt(dx * dx + dy * dy);

    // Draw extension lines
    const extLineLength = radius * 1.5;
    const ext1End = {
      x: center.x + Math.cos(angle1) * extLineLength,
      y: center.y + Math.sin(angle1) * extLineLength
    };
    const ext2End = {
      x: center.x + Math.cos(angle2) * extLineLength,
      y: center.y + Math.sin(angle2) * extLineLength
    };

    ctx.strokeStyle = color;
    ctx.lineWidth = 0.5;

    // Extension line 1
    ctx.beginPath();
    ctx.moveTo(center.x, center.y);
    ctx.lineTo(ext1End.x, ext1End.y);
    ctx.stroke();

    // Extension line 2
    ctx.beginPath();
    ctx.moveTo(center.x, center.y);
    ctx.lineTo(ext2End.x, ext2End.y);
    ctx.stroke();

    // Draw arc
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, angle1, angle2, false);
    ctx.stroke();

    // Draw arrows at arc endpoints
    const arrowSize = entity.arrowSize;
    const arc1 = { x: center.x + Math.cos(angle1) * radius, y: center.y + Math.sin(angle1) * radius };
    const arc2 = { x: center.x + Math.cos(angle2) * radius, y: center.y + Math.sin(angle2) * radius };

    ArrowRenderer.renderArrow(ctx, arc1.x, arc1.y, angle1 - Math.PI / 2, arrowSize, entity.arrowType, color);
    ArrowRenderer.renderArrow(ctx, arc2.x, arc2.y, angle2 + Math.PI / 2, arrowSize, entity.arrowType, color);

    // Draw text
    const textPos = entity.textMidPoint;
    const middleAngle = (angle1 + angle2) / 2;
    const textAngle = entity.textRotation || (middleAngle * 180 / Math.PI);
    this.drawDimensionText(ctx, entity.getDisplayText() + '°', textPos, textAngle, entity.textHeight, color);
  }

  /**
   * Render radial dimension (radius with "R" prefix)
   * @param {DimensionEntity} entity - Dimension entity
   * @param {string} color - Line color
   */
  renderRadialDimension(entity, color) {
    const ctx = this.canvasRenderer.ctx;

    const center = entity.defPoint;
    const radiusPoint = entity.defPoint4;

    // Draw radius line
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(center.x, center.y);
    ctx.lineTo(radiusPoint.x, radiusPoint.y);
    ctx.stroke();

    // Draw arrow at radius point
    const angle = Math.atan2(radiusPoint.y - center.y, radiusPoint.x - center.x);
    ArrowRenderer.renderArrow(ctx, radiusPoint.x, radiusPoint.y, angle, entity.arrowSize, entity.arrowType, color);

    // Draw text with "R" prefix
    const textPos = entity.textMidPoint;
    const text = 'R' + entity.getDisplayText();
    this.drawDimensionText(ctx, text, textPos, entity.textRotation, entity.textHeight, color);
  }

  /**
   * Render diameter dimension (diameter with "Ø" prefix)
   * @param {DimensionEntity} entity - Dimension entity
   * @param {string} color - Line color
   */
  renderDiameterDimension(entity, color) {
    const ctx = this.canvasRenderer.ctx;

    const center = entity.defPoint;
    const diameterPoint = entity.defPoint4;

    // Calculate opposite point
    const dx = diameterPoint.x - center.x;
    const dy = diameterPoint.y - center.y;
    const oppositePoint = {
      x: center.x - dx,
      y: center.y - dy
    };

    // Draw diameter line
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(oppositePoint.x, oppositePoint.y);
    ctx.lineTo(diameterPoint.x, diameterPoint.y);
    ctx.stroke();

    // Draw arrows at both ends
    const angle = Math.atan2(dy, dx);
    ArrowRenderer.renderArrow(ctx, diameterPoint.x, diameterPoint.y, angle, entity.arrowSize, entity.arrowType, color);
    ArrowRenderer.renderArrow(ctx, oppositePoint.x, oppositePoint.y, angle + Math.PI, entity.arrowSize, entity.arrowType, color);

    // Draw text with "Ø" prefix
    const textPos = entity.textMidPoint;
    const text = 'Ø' + entity.getDisplayText();
    this.drawDimensionText(ctx, text, textPos, entity.textRotation, entity.textHeight, color);
  }

  /**
   * Draw extension line from origin to dimension line
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} origin - Extension line origin {x, y}
   * @param {Object} dimPoint - Point on dimension line {x, y}
   * @param {string} color - Line color
   * @param {number} offset - Offset from origin
   * @param {number} extend - Extension beyond dimension line
   */
  drawExtensionLine(ctx, origin, dimPoint, color, offset, extend) {
    const dx = dimPoint.x - origin.x;
    const dy = dimPoint.y - origin.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) return;

    const dirX = dx / length;
    const dirY = dy / length;

    // Start point (with offset from origin)
    const startX = origin.x + dirX * offset;
    const startY = origin.y + dirY * offset;

    // End point (extended beyond dimension line)
    const endX = dimPoint.x + dirX * extend;
    const endY = dimPoint.y + dirY * extend;

    ctx.strokeStyle = color;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }

  /**
   * Draw dimension line between two points
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} p1 - Start point {x, y}
   * @param {Object} p2 - End point {x, y}
   * @param {string} color - Line color
   */
  drawDimensionLine(ctx, p1, p2, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }

  /**
   * Draw dimension text
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {string} text - Text to draw
   * @param {Object} position - Text position {x, y}
   * @param {number} rotation - Text rotation angle in degrees
   * @param {number} height - Text height
   * @param {string} color - Text color
   */
  drawDimensionText(ctx, text, position, rotation, height, color) {
    ctx.save();

    ctx.translate(position.x, position.y);
    ctx.rotate((rotation * Math.PI) / 180);

    // Set font
    const font = this.fontManager.getFont('STANDARD');
    ctx.font = `${height}px ${font}`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Draw text
    ctx.fillText(text, 0, 0);

    ctx.restore();
  }
}

export default DimensionRenderer;
