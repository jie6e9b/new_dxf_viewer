import Entity from './Entity.js';

/**
 * HATCH entity
 * Represents filled or hatched regions with patterns
 */
class HatchEntity extends Entity {
  constructor() {
    super('HATCH');
    this.patternName = 'SOLID'; // Pattern name (SOLID, ANSI31, etc.)
    this.solidFill = true; // True for solid fill, false for pattern
    this.associative = false; // Associativity flag
    this.boundaryPaths = []; // Array of boundary paths
    this.patternScale = 1.0; // Pattern scale
    this.patternAngle = 0; // Pattern angle in degrees
    this.patternDouble = false; // Double pattern flag
    this.elevationPoint = { x: 0, y: 0, z: 0 }; // Elevation point

    // Seed points for gradient fills (not implemented yet)
    this.seedPoints = [];
  }

  /**
   * Parse HATCH entity data
   * @param {Array} data - Group code-value pairs
   * @returns {HatchEntity}
   */
  static fromData(data) {
    const hatch = new HatchEntity();
    hatch.parseCommon(data);

    let currentPath = null;
    let currentEdge = null;
    let vertexCount = 0;
    let vertices = [];

    for (let i = 0; i < data.length; i++) {
      const group = data[i];

      switch (group.code) {
        case 2: // Pattern name
          hatch.patternName = group.value.toUpperCase();
          break;
        case 10: // Elevation point X
          hatch.elevationPoint.x = group.value;
          break;
        case 20: // Elevation point Y
          hatch.elevationPoint.y = group.value;
          break;
        case 30: // Elevation point Z
          hatch.elevationPoint.z = group.value;
          break;
        case 41: // Pattern scale
          hatch.patternScale = group.value;
          break;
        case 52: // Pattern angle
          hatch.patternAngle = group.value;
          break;
        case 70: // Solid fill flag (1 = solid, 0 = pattern)
          hatch.solidFill = group.value === 1;
          break;
        case 71: // Associativity flag
          hatch.associative = group.value === 1;
          break;
        case 77: // Pattern double flag
          hatch.patternDouble = group.value === 1;
          break;
        case 91: // Number of boundary paths
          // Start reading boundary paths
          break;
        case 92: // Boundary path type flag
          // Start new path
          currentPath = {
            type: group.value,
            edges: [],
            vertices: []
          };
          hatch.boundaryPaths.push(currentPath);
          break;
        case 93: // Number of edges in path (for polyline path type)
          if (currentPath && (currentPath.type & 2)) {
            vertexCount = group.value;
            vertices = [];
          }
          break;
        case 72: // Edge type (1=line, 2=circular arc, 3=elliptic arc, 4=spline)
          if (currentPath) {
            currentEdge = {
              type: group.value,
              data: {}
            };
            currentPath.edges.push(currentEdge);
          }
          break;
        case 10: // Vertex/start point X or seed point X
          if (currentPath && (currentPath.type & 2)) {
            // Polyline vertex
            if (!vertices[vertices.length - 1] || vertices[vertices.length - 1].y !== undefined) {
              vertices.push({ x: group.value });
            } else {
              vertices[vertices.length - 1].x = group.value;
            }
          } else if (currentEdge) {
            currentEdge.data.startX = group.value;
          }
          break;
        case 20: // Vertex/start point Y
          if (currentPath && (currentPath.type & 2)) {
            // Polyline vertex
            if (vertices.length > 0 && vertices[vertices.length - 1].x !== undefined) {
              vertices[vertices.length - 1].y = group.value;
              if (vertices.length === vertexCount) {
                currentPath.vertices = vertices;
                vertices = [];
              }
            }
          } else if (currentEdge) {
            currentEdge.data.startY = group.value;
          }
          break;
        case 11: // End point X
          if (currentEdge) {
            currentEdge.data.endX = group.value;
          }
          break;
        case 21: // End point Y
          if (currentEdge) {
            currentEdge.data.endY = group.value;
          }
          break;
        case 40: // Radius (for circular arc)
          if (currentEdge && currentEdge.type === 2) {
            currentEdge.data.radius = group.value;
          }
          break;
        case 50: // Start angle (for circular arc)
          if (currentEdge && currentEdge.type === 2) {
            currentEdge.data.startAngle = group.value;
          }
          break;
        case 51: // End angle (for circular arc)
          if (currentEdge && currentEdge.type === 2) {
            currentEdge.data.endAngle = group.value;
          }
          break;
        case 73: // Counterclockwise flag (for circular arc)
          if (currentEdge && currentEdge.type === 2) {
            currentEdge.data.counterclockwise = group.value === 1;
          }
          break;
      }
    }

    return hatch;
  }

  /**
   * Get bounding box from boundary paths
   * @returns {Object} {minX, minY, maxX, maxY}
   */
  getBounds() {
    if (this.boundaryPaths.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const path of this.boundaryPaths) {
      // Process vertices (polyline path)
      if (path.vertices && path.vertices.length > 0) {
        for (const vertex of path.vertices) {
          minX = Math.min(minX, vertex.x);
          minY = Math.min(minY, vertex.y);
          maxX = Math.max(maxX, vertex.x);
          maxY = Math.max(maxY, vertex.y);
        }
      }

      // Process edges
      for (const edge of path.edges) {
        if (edge.type === 1) { // Line
          minX = Math.min(minX, edge.data.startX, edge.data.endX);
          minY = Math.min(minY, edge.data.startY, edge.data.endY);
          maxX = Math.max(maxX, edge.data.startX, edge.data.endX);
          maxY = Math.max(maxY, edge.data.startY, edge.data.endY);
        } else if (edge.type === 2) { // Circular arc
          // Approximate with center ± radius
          const centerX = edge.data.startX || 0;
          const centerY = edge.data.startY || 0;
          const radius = edge.data.radius || 0;
          minX = Math.min(minX, centerX - radius);
          minY = Math.min(minY, centerY - radius);
          maxX = Math.max(maxX, centerX + radius);
          maxY = Math.max(maxY, centerY + radius);
        }
      }
    }

    return { minX, minY, maxX, maxY };
  }

  /**
   * Check if hatch is solid fill
   * @returns {boolean}
   */
  isSolid() {
    return this.solidFill || this.patternName === 'SOLID';
  }

  /**
   * Get simplified polygon for rendering (from first boundary path)
   * @returns {Array<{x, y}>} Array of points
   */
  getPolygon() {
    if (this.boundaryPaths.length === 0) {
      return [];
    }

    const path = this.boundaryPaths[0];
    const points = [];

    // Get vertices from polyline path
    if (path.vertices && path.vertices.length > 0) {
      return path.vertices;
    }

    // Convert edges to points
    for (const edge of path.edges) {
      if (edge.type === 1) { // Line
        points.push({ x: edge.data.startX, y: edge.data.startY });
        points.push({ x: edge.data.endX, y: edge.data.endY });
      }
      // For arcs, we'd need to tessellate - simplified for now
    }

    return points;
  }
}

export default HatchEntity;
