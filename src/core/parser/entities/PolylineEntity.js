import Entity from './Entity.js';

/**
 * POLYLINE entity
 * Represents a polyline with vertices (can include arcs via bulge)
 *
 * Bulge:
 * - 0 = straight line
 * - positive = arc counterclockwise
 * - negative = arc clockwise
 * - 1 = semicircle (180°)
 * - bulge = tan(angle/4)
 */
class PolylineEntity extends Entity {
  constructor() {
    super('POLYLINE');
    this.vertices = []; // Array of {x, y, z, bulge}
    this.closed = false;
    this.flags = 0;
  }

  /**
   * Parse POLYLINE entity data
   * @param {Array} data - Group code-value pairs
   * @returns {PolylineEntity}
   */
  static fromData(data) {
    const polyline = new PolylineEntity();
    polyline.parseCommon(data);

    let currentVertex = null;

    for (const group of data) {
      switch (group.code) {
        case 70: // Polyline flag
          polyline.flags = group.value;
          polyline.closed = (group.value & 1) !== 0;
          break;

        // Legacy POLYLINE uses VERTEX entities
        // Modern LWPOLYLINE includes vertices inline
        case 90: // Number of vertices (LWPOLYLINE)
          // Just informational
          break;

        case 10: // Vertex X (LWPOLYLINE)
          if (currentVertex) {
            polyline.vertices.push(currentVertex);
          }
          currentVertex = { x: group.value, y: 0, z: 0, bulge: 0 };
          break;

        case 20: // Vertex Y (LWPOLYLINE)
          if (currentVertex) {
            currentVertex.y = group.value;
          }
          break;

        case 30: // Vertex Z (LWPOLYLINE, rare)
          if (currentVertex) {
            currentVertex.z = group.value;
          }
          break;

        case 42: // Bulge (LWPOLYLINE)
          if (currentVertex) {
            currentVertex.bulge = group.value;
          }
          break;
      }
    }

    // Don't forget last vertex
    if (currentVertex) {
      polyline.vertices.push(currentVertex);
    }

    return polyline;
  }

  /**
   * Get bounding box
   * @returns {Object} {minX, minY, maxX, maxY}
   */
  getBounds() {
    if (this.vertices.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (let i = 0; i < this.vertices.length; i++) {
      const v = this.vertices[i];
      minX = Math.min(minX, v.x);
      minY = Math.min(minY, v.y);
      maxX = Math.max(maxX, v.x);
      maxY = Math.max(maxY, v.y);

      // For bulge segments, we need to account for the arc
      if (v.bulge !== 0 && i < this.vertices.length - 1) {
        const next = this.vertices[i + 1];
        const arcBounds = this.getArcBounds(v, next, v.bulge);
        minX = Math.min(minX, arcBounds.minX);
        minY = Math.min(minY, arcBounds.minY);
        maxX = Math.max(maxX, arcBounds.maxX);
        maxY = Math.max(maxY, arcBounds.maxY);
      }
    }

    // Handle closed polyline
    if (this.closed && this.vertices.length > 0) {
      const first = this.vertices[0];
      const last = this.vertices[this.vertices.length - 1];
      if (last.bulge !== 0) {
        const arcBounds = this.getArcBounds(last, first, last.bulge);
        minX = Math.min(minX, arcBounds.minX);
        minY = Math.min(minY, arcBounds.minY);
        maxX = Math.max(maxX, arcBounds.maxX);
        maxY = Math.max(maxY, arcBounds.maxY);
      }
    }

    return { minX, minY, maxX, maxY };
  }

  /**
   * Get approximate bounds for arc segment
   * @param {Object} v1 - Start vertex {x, y}
   * @param {Object} v2 - End vertex {x, y}
   * @param {number} bulge - Bulge value
   * @returns {Object} {minX, minY, maxX, maxY}
   */
  getArcBounds(v1, v2, bulge) {
    const arc = this.bulgeToArc(v1, v2, bulge);

    // Simple bounds: include center and endpoints
    // For more accurate bounds, we'd check if quadrant points are on the arc
    const minX = Math.min(v1.x, v2.x, arc.center.x - arc.radius);
    const maxX = Math.max(v1.x, v2.x, arc.center.x + arc.radius);
    const minY = Math.min(v1.y, v2.y, arc.center.y - arc.radius);
    const maxY = Math.max(v1.y, v2.y, arc.center.y + arc.radius);

    return { minX, minY, maxX, maxY };
  }

  /**
   * Convert bulge to arc parameters
   * @param {Object} v1 - Start vertex {x, y}
   * @param {Object} v2 - End vertex {x, y}
   * @param {number} bulge - Bulge value
   * @returns {Object} {center: {x, y}, radius, startAngle, endAngle, counterclockwise}
   */
  bulgeToArc(v1, v2, bulge) {
    // Calculate arc from bulge
    // bulge = tan(angle / 4)
    const angle = 4 * Math.atan(bulge);

    // Chord vector
    const dx = v2.x - v1.x;
    const dy = v2.y - v1.y;
    const chordLength = Math.sqrt(dx * dx + dy * dy);

    if (chordLength === 0) {
      // Degenerate case
      return {
        center: { x: v1.x, y: v1.y },
        radius: 0,
        startAngle: 0,
        endAngle: 0,
        counterclockwise: bulge > 0
      };
    }

    // Radius from bulge and chord length
    const radius = chordLength * (1 + bulge * bulge) / (4 * Math.abs(bulge));

    // Midpoint of chord
    const midX = (v1.x + v2.x) / 2;
    const midY = (v1.y + v2.y) / 2;

    // Distance from midpoint to center
    const sagitta = chordLength * Math.abs(bulge) / 2;

    // Perpendicular direction (rotated 90°)
    const perpX = -dy / chordLength;
    const perpY = dx / chordLength;

    // Center of arc
    const sign = bulge > 0 ? 1 : -1;
    const centerX = midX + sign * sagitta * perpX;
    const centerY = midY + sign * sagitta * perpY;

    // Start and end angles
    const startAngle = Math.atan2(v1.y - centerY, v1.x - centerX);
    const endAngle = Math.atan2(v2.y - centerY, v2.x - centerX);

    return {
      center: { x: centerX, y: centerY },
      radius: Math.abs(radius),
      startAngle,
      endAngle,
      counterclockwise: bulge > 0
    };
  }

  /**
   * Get segments (for rendering)
   * Returns array of segments, each is either:
   * - {type: 'line', start, end}
   * - {type: 'arc', center, radius, startAngle, endAngle, counterclockwise}
   */
  getSegments() {
    const segments = [];

    for (let i = 0; i < this.vertices.length - 1; i++) {
      const v1 = this.vertices[i];
      const v2 = this.vertices[i + 1];

      if (Math.abs(v1.bulge) < 0.0001) {
        // Straight line
        segments.push({
          type: 'line',
          start: { x: v1.x, y: v1.y },
          end: { x: v2.x, y: v2.y }
        });
      } else {
        // Arc
        const arc = this.bulgeToArc(v1, v2, v1.bulge);
        segments.push({
          type: 'arc',
          ...arc
        });
      }
    }

    // Closing segment if polyline is closed
    if (this.closed && this.vertices.length > 1) {
      const last = this.vertices[this.vertices.length - 1];
      const first = this.vertices[0];

      if (Math.abs(last.bulge) < 0.0001) {
        segments.push({
          type: 'line',
          start: { x: last.x, y: last.y },
          end: { x: first.x, y: first.y }
        });
      } else {
        const arc = this.bulgeToArc(last, first, last.bulge);
        segments.push({
          type: 'arc',
          ...arc
        });
      }
    }

    return segments;
  }

  /**
   * Get total length
   * @returns {number}
   */
  getLength() {
    const segments = this.getSegments();
    return segments.reduce((total, seg) => {
      if (seg.type === 'line') {
        const dx = seg.end.x - seg.start.x;
        const dy = seg.end.y - seg.start.y;
        return total + Math.sqrt(dx * dx + dy * dy);
      } else {
        // Arc length = radius * angle
        let angle = seg.endAngle - seg.startAngle;
        if (!seg.counterclockwise && angle > 0) {
          angle -= 2 * Math.PI;
        } else if (seg.counterclockwise && angle < 0) {
          angle += 2 * Math.PI;
        }
        return total + seg.radius * Math.abs(angle);
      }
    }, 0);
  }
}

export default PolylineEntity;
