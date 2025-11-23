import SolidPattern from './SolidPattern.js';
import ANSI31Pattern from './ANSI31Pattern.js';
import ANSI32Pattern from './ANSI32Pattern.js';
import ARCONCPattern from './ARCONCPattern.js';
import ARSANDPattern from './ARSANDPattern.js';
import STEELPattern from './STEELPattern.js';
import INSULPattern from './INSULPattern.js';

/**
 * PatternFactory - creates and manages hatch patterns
 * Provides caching for better performance
 */
class PatternFactory {
  constructor() {
    // Register built-in patterns
    this.patterns = new Map();
    this.registerDefaultPatterns();

    // Pattern cache: key = "patternName_color_scale_angle"
    this.cache = new Map();
    this.maxCacheSize = 50; // LRU cache size
  }

  /**
   * Register default AutoCAD patterns
   */
  registerDefaultPatterns() {
    this.register(new SolidPattern());
    this.register(new ANSI31Pattern());
    this.register(new ANSI32Pattern());
    this.register(new ARCONCPattern());
    this.register(new ARSANDPattern());
    this.register(new STEELPattern());
    this.register(new INSULPattern());

    // Register aliases
    this.patterns.set('SOLID', this.patterns.get('SOLID'));
    this.patterns.set('ANSI31', this.patterns.get('ANSI31'));
    this.patterns.set('ANSI32', this.patterns.get('ANSI32'));
    this.patterns.set('AR-CONC', this.patterns.get('AR-CONC'));
    this.patterns.set('AR-SAND', this.patterns.get('AR-SAND'));
    this.patterns.set('STEEL', this.patterns.get('STEEL'));
    this.patterns.set('INSUL', this.patterns.get('INSUL'));
  }

  /**
   * Register a pattern
   * @param {Pattern} pattern - Pattern instance
   */
  register(pattern) {
    this.patterns.set(pattern.name.toUpperCase(), pattern);
  }

  /**
   * Get pattern by name
   * @param {string} name - Pattern name
   * @returns {Pattern|null} Pattern instance or null
   */
  getPattern(name) {
    const normalizedName = name.toUpperCase();
    return this.patterns.get(normalizedName) || null;
  }

  /**
   * Create canvas pattern with caching
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {string} patternName - Pattern name
   * @param {string} color - Pattern color (hex)
   * @param {number} scale - Pattern scale
   * @param {number} angle - Pattern angle in degrees
   * @returns {CanvasPattern|string|null} Canvas pattern, solid color, or null
   */
  createPattern(ctx, patternName, color, scale = 1.0, angle = 0) {
    const pattern = this.getPattern(patternName);

    if (!pattern) {
      console.warn(`Pattern not found: ${patternName}, using SOLID`);
      return color; // Fallback to solid color
    }

    // Check cache
    const cacheKey = this.getCacheKey(patternName, color, scale, angle);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Create pattern
    const canvasPattern = pattern.create(ctx, color, scale, angle);

    // Cache it (LRU)
    this.cachePattern(cacheKey, canvasPattern);

    return canvasPattern;
  }

  /**
   * Get cache key for pattern
   * @param {string} name - Pattern name
   * @param {string} color - Color
   * @param {number} scale - Scale
   * @param {number} angle - Angle
   * @returns {string} Cache key
   */
  getCacheKey(name, color, scale, angle) {
    // Round scale and angle to reduce cache variations
    const roundedScale = Math.round(scale * 10) / 10;
    const roundedAngle = Math.round(angle);
    return `${name}_${color}_${roundedScale}_${roundedAngle}`;
  }

  /**
   * Cache pattern with LRU eviction
   * @param {string} key - Cache key
   * @param {*} value - Pattern value
   */
  cachePattern(key, value) {
    // If cache is full, remove oldest entry
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, value);
  }

  /**
   * Clear pattern cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Check if pattern is supported
   * @param {string} name - Pattern name
   * @returns {boolean}
   */
  isSupported(name) {
    return this.patterns.has(name.toUpperCase());
  }

  /**
   * Get list of all registered patterns
   * @returns {Array<string>} Pattern names
   */
  getPatternNames() {
    return Array.from(this.patterns.keys());
  }
}

export default PatternFactory;
