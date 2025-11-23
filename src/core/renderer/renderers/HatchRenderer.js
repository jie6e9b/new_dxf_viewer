import Layer from '../../parser/styles/Layer.js';

/**
 * HatchRenderer - renders HATCH entities with patterns
 */
class HatchRenderer {
  constructor(canvasRenderer, tableManager, patternFactory) {
    this.canvasRenderer = canvasRenderer;
    this.tableManager = tableManager;
    this.patternFactory = patternFactory;
  }

  /**
   * Check if entity should be rendered
   * @param {HatchEntity} entity
   * @returns {boolean}
   */
  shouldRender(entity) {
    return entity.shouldRender(this.tableManager);
  }

  /**
   * Render hatch entity
   * @param {HatchEntity} entity
   */
  render(entity) {
    if (entity.boundaryPaths.length === 0) {
      return; // Skip empty hatch
    }

    const ctx = this.canvasRenderer.ctx;

    // Get effective properties
    const color = this.getEntityColor(entity);

    // Save context state
    ctx.save();

    // Render each boundary path
    for (const path of entity.boundaryPaths) {
      this.renderBoundaryPath(entity, path, color);
    }

    // Restore context state
    ctx.restore();
  }

  /**
   * Render single boundary path
   * @param {HatchEntity} entity - Hatch entity
   * @param {Object} path - Boundary path
   * @param {string} color - Fill/pattern color
   */
  renderBoundaryPath(entity, path, color) {
    const ctx = this.canvasRenderer.ctx;

    // Begin path
    ctx.beginPath();

    // Draw polyline vertices
    if (path.vertices && path.vertices.length > 0) {
      ctx.moveTo(path.vertices[0].x, path.vertices[0].y);
      for (let i = 1; i < path.vertices.length; i++) {
        ctx.lineTo(path.vertices[i].x, path.vertices[i].y);
      }
      ctx.closePath();
    }

    // Draw edges
    if (path.edges && path.edges.length > 0) {
      let firstPoint = true;
      for (const edge of path.edges) {
        this.renderEdge(edge, firstPoint);
        firstPoint = false;
      }
      ctx.closePath();
    }

    // Fill with pattern or solid color
    if (entity.isSolid()) {
      // Solid fill
      ctx.fillStyle = color;
      ctx.fill();
    } else {
      // Pattern fill
      const pattern = this.patternFactory.createPattern(
        ctx,
        entity.patternName,
        color,
        entity.patternScale,
        entity.patternAngle
      );

      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fill();
      } else {
        // Fallback to solid if pattern not found
        ctx.fillStyle = color;
        ctx.fill();
      }
    }

    // Optionally draw boundary outline
    if (!entity.isSolid()) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 0.5 / this.canvasRenderer.transform.scale;
      ctx.stroke();
    }
  }

  /**
   * Render boundary edge
   * @param {Object} edge - Edge data
   * @param {boolean} firstPoint - Is this the first point?
   */
  renderEdge(edge, firstPoint) {
    const ctx = this.canvasRenderer.ctx;

    switch (edge.type) {
      case 1: // Line
        if (firstPoint) {
          ctx.moveTo(edge.data.startX, edge.data.startY);
        }
        ctx.lineTo(edge.data.endX, edge.data.endY);
        break;

      case 2: // Circular arc
        if (firstPoint) {
          ctx.moveTo(edge.data.startX, edge.data.startY);
        }
        // For circular arc, we need center point
        // Simplified: draw arc using start/end points and radius
        this.renderArcEdge(edge);
        break;

      case 3: // Elliptic arc
        // Not fully implemented yet - draw as line
        if (firstPoint) {
          ctx.moveTo(edge.data.startX, edge.data.startY);
        }
        ctx.lineTo(edge.data.endX, edge.data.endY);
        break;

      case 4: // Spline
        // Not fully implemented yet - draw as line
        if (firstPoint) {
          ctx.moveTo(edge.data.startX, edge.data.startY);
        }
        ctx.lineTo(edge.data.endX, edge.data.endY);
        break;

      default:
        console.warn(`Unknown edge type: ${edge.type}`);
        break;
    }
  }

  /**
   * Render circular arc edge
   * @param {Object} edge - Arc edge data
   */
  renderArcEdge(edge) {
    const ctx = this.canvasRenderer.ctx;

    // Use center, radius, and angles if available
    if (edge.data.radius && edge.data.startAngle !== undefined) {
      const centerX = edge.data.startX;
      const centerY = edge.data.startY;
      const startAngle = (edge.data.startAngle * Math.PI) / 180;
      const endAngle = (edge.data.endAngle * Math.PI) / 180;
      const counterclockwise = !edge.data.counterclockwise;

      ctx.arc(
        centerX,
        centerY,
        edge.data.radius,
        startAngle,
        endAngle,
        counterclockwise
      );
    } else {
      // Fallback: draw as line
      ctx.lineTo(edge.data.endX, edge.data.endY);
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
}

export default HatchRenderer;
