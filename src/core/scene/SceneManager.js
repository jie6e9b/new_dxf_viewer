import BoundingBox from '../geometry/BoundingBox.js';

/**
 * SceneManager - manages all entities in the scene
 */
class SceneManager {
  constructor() {
    this.entities = [];
    this.bounds = new BoundingBox();
    this.dirty = true;
  }

  /**
   * Add entity to scene
   * @param {Entity} entity - Entity to add
   */
  addEntity(entity) {
    this.entities.push(entity);
    this.dirty = true;
  }

  /**
   * Add multiple entities
   * @param {Array<Entity>} entities - Entities to add
   */
  addEntities(entities) {
    this.entities.push(...entities);
    this.dirty = true;
  }

  /**
   * Clear all entities
   */
  clear() {
    this.entities = [];
    this.bounds = new BoundingBox();
    this.dirty = true;
  }

  /**
   * Get all entities
   * @returns {Array<Entity>}
   */
  getEntities() {
    return this.entities;
  }

  /**
   * Get entities by type
   * @param {string} type - Entity type
   * @returns {Array<Entity>}
   */
  getEntitiesByType(type) {
    return this.entities.filter(e => e.type === type);
  }

  /**
   * Get entities by layer
   * @param {string} layer - Layer name
   * @returns {Array<Entity>}
   */
  getEntitiesByLayer(layer) {
    return this.entities.filter(e => e.layer === layer);
  }

  /**
   * Get visible entities
   * @param {TableManager} tableManager - Table manager
   * @returns {Array<Entity>}
   */
  getVisibleEntities(tableManager) {
    return this.entities.filter(e => e.shouldRender(tableManager));
  }

  /**
   * Calculate scene bounding box
   * @param {boolean} force - Force recalculation
   * @returns {BoundingBox}
   */
  calculateBounds(force = false) {
    if (!this.dirty && !force) {
      return this.bounds;
    }

    this.bounds = BoundingBox.fromEntities(this.entities);
    this.dirty = false;

    return this.bounds;
  }

  /**
   * Get scene bounds
   * @returns {BoundingBox}
   */
  getBounds() {
    if (this.dirty) {
      this.calculateBounds();
    }
    return this.bounds;
  }

  /**
   * Get entities in bounding box (for culling)
   * @param {BoundingBox} viewBounds - View bounding box
   * @returns {Array<Entity>}
   */
  getEntitiesInBounds(viewBounds) {
    return this.entities.filter(entity => {
      const entityBounds = entity.getBounds();
      return viewBounds.intersects(entityBounds);
    });
  }

  /**
   * Get entity count
   * @returns {number}
   */
  getEntityCount() {
    return this.entities.length;
  }

  /**
   * Get statistics
   * @returns {Object}
   */
  getStats() {
    const stats = {
      total: this.entities.length,
      byType: {},
      byLayer: {}
    };

    for (const entity of this.entities) {
      // Count by type
      stats.byType[entity.type] = (stats.byType[entity.type] || 0) + 1;

      // Count by layer
      stats.byLayer[entity.layer] = (stats.byLayer[entity.layer] || 0) + 1;
    }

    return stats;
  }

  /**
   * Find entity by handle
   * @param {string} handle - Entity handle
   * @returns {Entity|null}
   */
  findByHandle(handle) {
    return this.entities.find(e => e.handle === handle) || null;
  }

  /**
   * Remove entity
   * @param {Entity} entity - Entity to remove
   * @returns {boolean} True if removed
   */
  removeEntity(entity) {
    const index = this.entities.indexOf(entity);
    if (index !== -1) {
      this.entities.splice(index, 1);
      this.dirty = true;
      return true;
    }
    return false;
  }

  /**
   * Remove entities by layer
   * @param {string} layer - Layer name
   * @returns {number} Number of entities removed
   */
  removeByLayer(layer) {
    const initialCount = this.entities.length;
    this.entities = this.entities.filter(e => e.layer !== layer);
    const removed = initialCount - this.entities.length;

    if (removed > 0) {
      this.dirty = true;
    }

    return removed;
  }

  /**
   * Sort entities by layer
   * @param {Array<string>} layerOrder - Layer names in order
   */
  sortByLayer(layerOrder) {
    const layerMap = new Map();
    layerOrder.forEach((layer, index) => {
      layerMap.set(layer, index);
    });

    this.entities.sort((a, b) => {
      const orderA = layerMap.get(a.layer) ?? Number.MAX_SAFE_INTEGER;
      const orderB = layerMap.get(b.layer) ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });
  }
}

export default SceneManager;
