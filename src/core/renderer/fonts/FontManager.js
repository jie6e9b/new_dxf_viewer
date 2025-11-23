/**
 * FontManager - Maps AutoCAD SHX fonts to web fonts
 * Provides fallback mechanism for missing fonts
 */
class FontManager {
  constructor() {
    // Mapping of SHX font names to web-safe fonts
    this.fontMap = {
      // Standard AutoCAD fonts
      'txt': 'Arial, sans-serif',
      'txt.shx': 'Arial, sans-serif',
      'standard': 'Arial, sans-serif',
      'standard.shx': 'Arial, sans-serif',

      // Roman fonts
      'romans': 'Times New Roman, serif',
      'romans.shx': 'Times New Roman, serif',
      'romand': 'Times New Roman, serif',
      'romand.shx': 'Times New Roman, serif',
      'romanc': 'Times New Roman, serif',
      'romanc.shx': 'Times New Roman, serif',
      'romant': 'Times New Roman, serif',
      'romant.shx': 'Times New Roman, serif',

      // ISO fonts
      'iso': 'Arial, sans-serif',
      'iso.shx': 'Arial, sans-serif',
      'isocpeur': 'Arial, sans-serif',
      'isocpeur.shx': 'Arial, sans-serif',
      'isocp': 'Arial, sans-serif',
      'isocp.shx': 'Arial, sans-serif',
      'isocp2': 'Arial, sans-serif',
      'isocp2.shx': 'Arial, sans-serif',
      'isocp3': 'Arial, sans-serif',
      'isocp3.shx': 'Arial, sans-serif',
      'isocteur': 'Arial, sans-serif',
      'isocteur.shx': 'Arial, sans-serif',

      // Cyrillic fonts (GOST)
      'gost': 'PT Sans, Arial, sans-serif',
      'gost.shx': 'PT Sans, Arial, sans-serif',
      'gost common': 'PT Sans, Arial, sans-serif',
      'gost type a': 'PT Sans, Arial, sans-serif',
      'gost type b': 'PT Sans, Arial, sans-serif',
      'gosttypeа': 'PT Sans, Arial, sans-serif',
      'gosttypeб': 'PT Sans, Arial, sans-serif',

      // Simplex fonts
      'simplex': 'Arial, sans-serif',
      'simplex.shx': 'Arial, sans-serif',

      // Complex fonts
      'complex': 'Arial, sans-serif',
      'complex.shx': 'Arial, sans-serif',

      // Italic fonts
      'italic': 'Arial Italic, sans-serif',
      'italic.shx': 'Arial Italic, sans-serif',
      'italict': 'Times New Roman Italic, serif',
      'italict.shx': 'Times New Roman Italic, serif',
      'italicc': 'Times New Roman Italic, serif',
      'italicc.shx': 'Times New Roman Italic, serif',

      // Script fonts
      'script': 'Brush Script MT, cursive',
      'script.shx': 'Brush Script MT, cursive',
      'scriptc': 'Brush Script MT, cursive',
      'scriptc.shx': 'Brush Script MT, cursive',

      // Gothic fonts
      'gothic': 'Century Gothic, sans-serif',
      'gothic.shx': 'Century Gothic, sans-serif',
      'gothice': 'Century Gothic, sans-serif',
      'gothice.shx': 'Century Gothic, sans-serif',
      'gothicg': 'Century Gothic, sans-serif',
      'gothicg.shx': 'Century Gothic, sans-serif',
      'gothici': 'Century Gothic, sans-serif',
      'gothici.shx': 'Century Gothic, sans-serif',

      // Monospace fonts
      'monotxt': 'Courier New, monospace',
      'monotxt.shx': 'Courier New, monospace',

      // Arial and True Type fonts
      'arial': 'Arial, sans-serif',
      'arial.ttf': 'Arial, sans-serif',
      'times': 'Times New Roman, serif',
      'times.ttf': 'Times New Roman, serif',
      'courier': 'Courier New, monospace',
      'courier.ttf': 'Courier New, monospace',
    };

    // Default fallback font
    this.defaultFont = 'Arial, sans-serif';

    // Font cache for loaded fonts
    this.loadedFonts = new Set();
  }

  /**
   * Get web font for DXF font name
   * @param {string} dxfFont - DXF font name (e.g., 'romans.shx', 'GOST')
   * @returns {string} Web font family
   */
  getWebFont(dxfFont) {
    if (!dxfFont) {
      return this.defaultFont;
    }

    // Normalize font name (lowercase, trim)
    const normalized = dxfFont.toLowerCase().trim();

    // Look up in map
    const webFont = this.fontMap[normalized];

    if (webFont) {
      return webFont;
    }

    // Try without .shx extension
    if (normalized.endsWith('.shx')) {
      const withoutExt = normalized.slice(0, -4);
      if (this.fontMap[withoutExt]) {
        return this.fontMap[withoutExt];
      }
    }

    // Try without .ttf extension
    if (normalized.endsWith('.ttf')) {
      const withoutExt = normalized.slice(0, -4);
      if (this.fontMap[withoutExt]) {
        return this.fontMap[withoutExt];
      }
    }

    // Fallback to default
    return this.defaultFont;
  }

  /**
   * Register custom font mapping
   * @param {string} dxfFont - DXF font name
   * @param {string} webFont - Web font family
   */
  registerFont(dxfFont, webFont) {
    this.fontMap[dxfFont.toLowerCase().trim()] = webFont;
  }

  /**
   * Check if font is available
   * @param {string} fontFamily - Font family name
   * @returns {Promise<boolean>} True if font is available
   */
  async isFontAvailable(fontFamily) {
    if (!document || !document.fonts) {
      return true; // Assume available if Font API not supported
    }

    try {
      // Extract first font from family list
      const firstFont = fontFamily.split(',')[0].trim().replace(/['"]/g, '');
      await document.fonts.load(`12px ${firstFont}`);
      return document.fonts.check(`12px ${firstFont}`);
    } catch (error) {
      console.warn(`Font check failed for ${fontFamily}:`, error);
      return false;
    }
  }

  /**
   * Load font if not already loaded
   * @param {string} fontFamily - Font family to load
   * @returns {Promise<void>}
   */
  async loadFont(fontFamily) {
    if (this.loadedFonts.has(fontFamily)) {
      return; // Already loaded
    }

    if (!document || !document.fonts) {
      return; // Font API not supported
    }

    try {
      const firstFont = fontFamily.split(',')[0].trim().replace(/['"]/g, '');
      await document.fonts.load(`12px ${firstFont}`);
      this.loadedFonts.add(fontFamily);
    } catch (error) {
      console.warn(`Failed to load font ${fontFamily}:`, error);
    }
  }

  /**
   * Get CSS font string for canvas context
   * @param {string} dxfFont - DXF font name
   * @param {number} height - Font height
   * @param {number} widthFactor - Width factor (default 1.0)
   * @returns {string} CSS font string
   */
  getCSSFont(dxfFont, height, widthFactor = 1.0) {
    const fontFamily = this.getWebFont(dxfFont);

    // Apply width factor using font-stretch (limited browser support)
    // For better compatibility, we'll handle width factor in transform
    return `${height}px ${fontFamily}`;
  }

  /**
   * Get list of all registered DXF fonts
   * @returns {Array<string>} List of DXF font names
   */
  getRegisteredFonts() {
    return Object.keys(this.fontMap).sort();
  }

  /**
   * Clear font cache
   */
  clearCache() {
    this.loadedFonts.clear();
  }

  /**
   * Set default fallback font
   * @param {string} fontFamily - Default font family
   */
  setDefaultFont(fontFamily) {
    this.defaultFont = fontFamily;
  }
}

export default FontManager;
