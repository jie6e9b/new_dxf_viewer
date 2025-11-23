import DXFReader from './core/parser/DXFReader.js';
import SectionParser from './core/parser/SectionParser.js';
import TableManager from './core/parser/styles/TableManager.js';
import EntityFactory from './core/parser/entities/EntityFactory.js';
import SceneManager from './core/scene/SceneManager.js';
import CanvasRenderer from './core/renderer/CanvasRenderer.js';
import LineRenderer from './core/renderer/renderers/LineRenderer.js';
import PolylineRenderer from './core/renderer/renderers/PolylineRenderer.js';
import CircleRenderer from './core/renderer/renderers/CircleRenderer.js';
import ArcRenderer from './core/renderer/renderers/ArcRenderer.js';

/**
 * DXFViewer - Main class for DXF viewer
 */
class DXFViewer {
  constructor(options = {}) {
    // Get or create canvas
    this.canvas = this.getCanvas(options.container);
    if (!this.canvas) {
      throw new Error('Canvas element not found');
    }

    // Set canvas size
    const width = options.width || this.canvas.clientWidth || 800;
    const height = options.height || this.canvas.clientHeight || 600;
    this.canvas.width = width;
    this.canvas.height = height;

    // Initialize components
    this.tableManager = new TableManager();
    this.entityFactory = new EntityFactory();
    this.sceneManager = new SceneManager();
    this.canvasRenderer = new CanvasRenderer(this.canvas);

    // Initialize renderers
    this.lineRenderer = new LineRenderer(this.canvasRenderer, this.tableManager);
    this.polylineRenderer = new PolylineRenderer(this.canvasRenderer, this.tableManager);
    this.circleRenderer = new CircleRenderer(this.canvasRenderer, this.tableManager);
    this.arcRenderer = new ArcRenderer(this.canvasRenderer, this.tableManager);

    // State
    this.loaded = false;
    this.rendering = false;

    // Options
    this.options = {
      autoFit: options.autoFit !== false,
      backgroundColor: options.backgroundColor || '#FFFFFF',
      ...options
    };

    this.canvasRenderer.backgroundColor = this.options.backgroundColor;
  }

  /**
   * Get canvas element
   * @param {string|HTMLElement} container - Container selector or element
   * @returns {HTMLCanvasElement}
   */
  getCanvas(container) {
    if (!container) {
      // Create new canvas
      const canvas = document.createElement('canvas');
      document.body.appendChild(canvas);
      return canvas;
    }

    if (typeof container === 'string') {
      // Selector
      const element = document.querySelector(container);
      if (element && element.getContext) {
        // It's already a canvas
        return element;
      }
      // Create canvas inside container
      const canvas = document.createElement('canvas');
      element.appendChild(canvas);
      return canvas;
    }

    // Check if it's a canvas-like object (has getContext method)
    if (container.getContext && typeof container.getContext === 'function') {
      return container;
    }

    // Assume it's a container element
    const canvas = document.createElement('canvas');
    if (container.appendChild) {
      container.appendChild(canvas);
    }
    return canvas;
  }

  /**
   * Load DXF from string
   * @param {string} dxfContent - DXF file content
   * @returns {Promise<void>}
   */
  async loadString(dxfContent) {
    return new Promise((resolve, reject) => {
      try {
        // Parse DXF
        const reader = new DXFReader(dxfContent);
        const parser = new SectionParser(reader);
        const sections = parser.parse();

        // Parse tables
        if (sections.TABLES) {
          const tables = parser.parseTables(sections.TABLES);
          this.tableManager.parseTables(tables);
        }

        // Parse header
        if (sections.HEADER) {
          this.header = parser.parseHeader(sections.HEADER);
        }

        // Parse entities
        if (sections.ENTITIES) {
          const entitiesData = parser.parseEntities(sections.ENTITIES);
          const entities = this.entityFactory.createEntities(entitiesData);
          this.sceneManager.addEntities(entities);
        }

        this.loaded = true;

        // Auto-fit to view
        if (this.options.autoFit) {
          this.fitToView();
        }

        // Render
        this.render();

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Load DXF from file
   * @param {File|string} file - File object or URL
   * @returns {Promise<void>}
   */
  async loadFile(file) {
    let content;

    if (typeof file === 'string') {
      // URL
      const response = await fetch(file);
      content = await response.text();
    } else {
      // File object
      content = await file.text();
    }

    return this.loadString(content);
  }

  /**
   * Render scene
   */
  render() {
    if (this.rendering) return;
    this.rendering = true;

    try {
      this.canvasRenderer.beginFrame();
      this.canvasRenderer.applyTransform();

      // Get visible entities
      const visibleEntities = this.sceneManager.getVisibleEntities(this.tableManager);

      // Render each entity
      for (const entity of visibleEntities) {
        this.renderEntity(entity);
      }

      this.canvasRenderer.endFrame();
    } finally {
      this.rendering = false;
    }
  }

  /**
   * Render single entity
   * @param {Entity} entity - Entity to render
   */
  renderEntity(entity) {
    switch (entity.type) {
      case 'LINE':
        if (this.lineRenderer.shouldRender(entity)) {
          this.lineRenderer.render(entity);
        }
        break;
      case 'POLYLINE':
      case 'LWPOLYLINE':
        if (this.polylineRenderer.shouldRender(entity)) {
          this.polylineRenderer.render(entity);
        }
        break;
      case 'CIRCLE':
        if (this.circleRenderer.shouldRender(entity)) {
          this.circleRenderer.render(entity);
        }
        break;
      case 'ARC':
        if (this.arcRenderer.shouldRender(entity)) {
          this.arcRenderer.render(entity);
        }
        break;
      default:
        // Unknown entity type
        break;
    }
  }

  /**
   * Fit view to scene bounds
   * @param {number} padding - Padding as fraction (0-1)
   */
  fitToView(padding = 0.1) {
    const bounds = this.sceneManager.getBounds();
    if (!bounds.isEmpty()) {
      this.canvasRenderer.transform.fitToView(bounds, padding);
      this.render();
    }
  }

  /**
   * Zoom in
   * @param {number} factor - Zoom factor
   */
  zoomIn(factor = 1.5) {
    this.canvasRenderer.transform.zoom(factor);
    this.render();
  }

  /**
   * Zoom out
   * @param {number} factor - Zoom factor
   */
  zoomOut(factor = 1.5) {
    this.canvasRenderer.transform.zoom(1 / factor);
    this.render();
  }

  /**
   * Pan view
   * @param {number} dx - Delta X in pixels
   * @param {number} dy - Delta Y in pixels
   */
  pan(dx, dy) {
    this.canvasRenderer.transform.pan(dx, dy);
    this.render();
  }

  /**
   * Reset view
   */
  resetView() {
    this.canvasRenderer.transform.reset();
    this.fitToView();
  }

  /**
   * Show/hide layer
   * @param {string} layerName - Layer name
   * @param {boolean} visible - Visibility
   */
  setLayerVisibility(layerName, visible) {
    this.tableManager.setLayerVisibility(layerName, visible);
    this.render();
  }

  /**
   * Get layer names
   * @returns {Array<string>}
   */
  getLayerNames() {
    return this.tableManager.getLayerNames();
  }

  /**
   * Get scene statistics
   * @returns {Object}
   */
  getStats() {
    return {
      entities: this.sceneManager.getStats(),
      tables: this.tableManager.getStats(),
      bounds: this.sceneManager.getBounds().toObject()
    };
  }

  /**
   * Export to image
   * @param {string} format - Image format (png, jpeg)
   * @returns {string} Data URL
   */
  toDataURL(format = 'image/png') {
    return this.canvasRenderer.toDataURL(format);
  }

  /**
   * Export to blob
   * @param {string} format - Image format
   * @returns {Promise<Blob>}
   */
  toBlob(format = 'image/png') {
    return this.canvasRenderer.toBlob(format);
  }

  /**
   * Clear scene
   */
  clear() {
    this.sceneManager.clear();
    this.tableManager = new TableManager();
    this.loaded = false;
    this.canvasRenderer.clear();
  }

  /**
   * Resize canvas
   * @param {number} width - New width
   * @param {number} height - New height
   */
  resize(width, height) {
    this.canvasRenderer.resize(width, height);
    this.render();
  }

  /**
   * Destroy viewer
   */
  destroy() {
    this.clear();
    // Remove canvas if we created it
    if (this.canvas && this.canvas.parentElement) {
      this.canvas.parentElement.removeChild(this.canvas);
    }
  }
}

export default DXFViewer;
