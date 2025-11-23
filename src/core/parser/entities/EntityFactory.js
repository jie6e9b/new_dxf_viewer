import LineEntity from './LineEntity.js';
import PolylineEntity from './PolylineEntity.js';
import CircleEntity from './CircleEntity.js';
import ArcEntity from './ArcEntity.js';
import TextEntity from './TextEntity.js';
import MTextEntity from './MTextEntity.js';
import HatchEntity from './HatchEntity.js';

/**
 * Entity Factory - creates entity objects from parsed DXF data
 */
class EntityFactory {
  constructor() {
    // Register entity parsers
    this.parsers = new Map([
      ['LINE', LineEntity.fromData],
      ['POLYLINE', PolylineEntity.fromData],
      ['LWPOLYLINE', PolylineEntity.fromData], // Lightweight polyline uses same parser
      ['CIRCLE', CircleEntity.fromData],
      ['ARC', ArcEntity.fromData],
      ['TEXT', TextEntity.fromData],
      ['MTEXT', MTextEntity.fromData],
      ['HATCH', HatchEntity.fromData]
    ]);
  }

  /**
   * Create entity from parsed data
   * @param {Object} entityData - {type: string, data: Array}
   * @returns {Entity|null} Entity instance or null if unsupported
   */
  createEntity(entityData) {
    const parser = this.parsers.get(entityData.type);

    if (!parser) {
      // Unknown entity type - skip with warning
      console.warn(`Unknown entity type: ${entityData.type}`);
      return null;
    }

    try {
      return parser(entityData.data);
    } catch (error) {
      console.error(`Error parsing ${entityData.type} entity:`, error);
      return null;
    }
  }

  /**
   * Create multiple entities from array
   * @param {Array} entitiesData - Array of entity data objects
   * @returns {Array<Entity>} Array of entity instances
   */
  createEntities(entitiesData) {
    const entities = [];

    for (const entityData of entitiesData) {
      const entity = this.createEntity(entityData);
      if (entity) {
        entities.push(entity);
      }
    }

    return entities;
  }

  /**
   * Register custom entity parser
   * @param {string} type - Entity type name
   * @param {Function} parser - Parser function
   */
  registerParser(type, parser) {
    this.parsers.set(type, parser);
  }

  /**
   * Check if entity type is supported
   * @param {string} type - Entity type name
   * @returns {boolean}
   */
  isSupported(type) {
    return this.parsers.has(type);
  }

  /**
   * Get list of supported entity types
   * @returns {Array<string>}
   */
  getSupportedTypes() {
    return Array.from(this.parsers.keys());
  }

  /**
   * Get statistics about parsed entities
   * @param {Array<Entity>} entities - Array of entities
   * @returns {Object} Statistics
   */
  getStats(entities) {
    const stats = {
      total: entities.length,
      byType: {}
    };

    for (const entity of entities) {
      const type = entity.type;
      stats.byType[type] = (stats.byType[type] || 0) + 1;
    }

    return stats;
  }
}

export default EntityFactory;
