import FontManager from '../../../src/core/renderer/fonts/FontManager';

describe('FontManager', () => {
  let fontManager;

  beforeEach(() => {
    fontManager = new FontManager();
  });

  test('creates font manager with default mappings', () => {
    expect(fontManager).toBeDefined();
    expect(fontManager.defaultFont).toBe('Arial, sans-serif');
    expect(fontManager.fontMap).toBeDefined();
  });

  test('maps standard fonts', () => {
    expect(fontManager.getWebFont('txt')).toBe('Arial, sans-serif');
    expect(fontManager.getWebFont('txt.shx')).toBe('Arial, sans-serif');
    expect(fontManager.getWebFont('standard')).toBe('Arial, sans-serif');
  });

  test('maps roman fonts', () => {
    expect(fontManager.getWebFont('romans')).toBe('Times New Roman, serif');
    expect(fontManager.getWebFont('romans.shx')).toBe('Times New Roman, serif');
    expect(fontManager.getWebFont('romand')).toBe('Times New Roman, serif');
  });

  test('maps ISO fonts', () => {
    expect(fontManager.getWebFont('iso')).toBe('Arial, sans-serif');
    expect(fontManager.getWebFont('isocpeur')).toBe('Arial, sans-serif');
  });

  test('maps GOST fonts (Cyrillic)', () => {
    expect(fontManager.getWebFont('gost')).toBe('PT Sans, Arial, sans-serif');
    expect(fontManager.getWebFont('gost.shx')).toBe('PT Sans, Arial, sans-serif');
    expect(fontManager.getWebFont('gost type a')).toBe('PT Sans, Arial, sans-serif');
  });

  test('maps gothic fonts', () => {
    expect(fontManager.getWebFont('gothic')).toBe('Century Gothic, sans-serif');
    expect(fontManager.getWebFont('gothice')).toBe('Century Gothic, sans-serif');
  });

  test('maps monospace fonts', () => {
    expect(fontManager.getWebFont('monotxt')).toBe('Courier New, monospace');
    expect(fontManager.getWebFont('courier')).toBe('Courier New, monospace');
  });

  test('handles case insensitivity', () => {
    expect(fontManager.getWebFont('ROMANS')).toBe('Times New Roman, serif');
    expect(fontManager.getWebFont('Romans')).toBe('Times New Roman, serif');
    expect(fontManager.getWebFont('RoMaNs.ShX')).toBe('Times New Roman, serif');
  });

  test('handles whitespace', () => {
    expect(fontManager.getWebFont('  romans  ')).toBe('Times New Roman, serif');
    expect(fontManager.getWebFont(' txt.shx ')).toBe('Arial, sans-serif');
  });

  test('removes .shx extension when mapping', () => {
    expect(fontManager.getWebFont('txt.shx')).toBe('Arial, sans-serif');
    expect(fontManager.getWebFont('txt')).toBe('Arial, sans-serif');
  });

  test('removes .ttf extension when mapping', () => {
    expect(fontManager.getWebFont('arial.ttf')).toBe('Arial, sans-serif');
    expect(fontManager.getWebFont('arial')).toBe('Arial, sans-serif');
  });

  test('returns default font for unknown fonts', () => {
    expect(fontManager.getWebFont('unknown_font')).toBe('Arial, sans-serif');
    expect(fontManager.getWebFont('xyz.shx')).toBe('Arial, sans-serif');
  });

  test('returns default font for null/undefined', () => {
    expect(fontManager.getWebFont(null)).toBe('Arial, sans-serif');
    expect(fontManager.getWebFont(undefined)).toBe('Arial, sans-serif');
    expect(fontManager.getWebFont('')).toBe('Arial, sans-serif');
  });

  test('registers custom font mapping', () => {
    fontManager.registerFont('myFont.shx', 'Verdana, sans-serif');
    expect(fontManager.getWebFont('myFont.shx')).toBe('Verdana, sans-serif');
    expect(fontManager.getWebFont('MYFONT.SHX')).toBe('Verdana, sans-serif');
  });

  test('gets CSS font string', () => {
    const cssFont = fontManager.getCSSFont('romans', 12);
    expect(cssFont).toBe('12px Times New Roman, serif');
  });

  test('gets CSS font string with width factor', () => {
    const cssFont = fontManager.getCSSFont('txt', 10, 1.5);
    // Width factor handling is simplified, just check font is returned
    expect(cssFont).toContain('10px');
    expect(cssFont).toContain('Arial');
  });

  test('gets list of registered fonts', () => {
    const fonts = fontManager.getRegisteredFonts();
    expect(Array.isArray(fonts)).toBe(true);
    expect(fonts.length).toBeGreaterThan(0);
    expect(fonts).toContain('txt');
    expect(fonts).toContain('romans');
    expect(fonts).toContain('gost');
  });

  test('fonts list is sorted', () => {
    const fonts = fontManager.getRegisteredFonts();
    const sorted = [...fonts].sort();
    expect(fonts).toEqual(sorted);
  });

  test('clears font cache', () => {
    fontManager.loadedFonts.add('Arial');
    fontManager.loadedFonts.add('Times New Roman');
    expect(fontManager.loadedFonts.size).toBe(2);

    fontManager.clearCache();
    expect(fontManager.loadedFonts.size).toBe(0);
  });

  test('sets default font', () => {
    fontManager.setDefaultFont('Helvetica, sans-serif');
    expect(fontManager.defaultFont).toBe('Helvetica, sans-serif');
    expect(fontManager.getWebFont('unknown')).toBe('Helvetica, sans-serif');
  });

  test('handles script fonts', () => {
    expect(fontManager.getWebFont('script')).toBe('Brush Script MT, cursive');
    expect(fontManager.getWebFont('scriptc.shx')).toBe('Brush Script MT, cursive');
  });

  test('handles italic fonts', () => {
    expect(fontManager.getWebFont('italic')).toBe('Arial Italic, sans-serif');
    expect(fontManager.getWebFont('italict')).toBe('Times New Roman Italic, serif');
  });

  test('handles simplex and complex fonts', () => {
    expect(fontManager.getWebFont('simplex')).toBe('Arial, sans-serif');
    expect(fontManager.getWebFont('complex')).toBe('Arial, sans-serif');
  });
});
