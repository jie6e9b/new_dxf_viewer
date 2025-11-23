import MTextEntity from '../../../src/core/parser/entities/MTextEntity';

describe('MTextEntity', () => {
  test('creates mtext entity', () => {
    const mtext = new MTextEntity();
    expect(mtext.type).toBe('MTEXT');
    expect(mtext.position).toEqual({ x: 0, y: 0, z: 0 });
    expect(mtext.height).toBe(1.0);
    expect(mtext.text).toBe('');
  });

  test('parses mtext from data', () => {
    const data = [
      { code: 0, value: 'MTEXT' },
      { code: 1, value: 'First line\\PSecond line' },
      { code: 10, value: 100 },
      { code: 20, value: 50 },
      { code: 40, value: 5.0 },
      { code: 50, value: 45 },
      { code: 7, value: 'ARIAL' }
    ];

    const mtext = MTextEntity.fromData(data);
    expect(mtext.text).toContain('First line');
    expect(mtext.lines).toHaveLength(2);
    expect(mtext.lines[0]).toBe('First line');
    expect(mtext.lines[1]).toBe('Second line');
  });

  test('parses special characters', () => {
    const data = [
      { code: 0, value: 'MTEXT' },
      { code: 1, value: 'Angle: 90%%d\\PDiameter: %%c100' },
      { code: 10, value: 0 },
      { code: 20, value: 0 },
      { code: 40, value: 2.0 }
    ];

    const mtext = MTextEntity.fromData(data);
    expect(mtext.plainText).toContain('90°');
    expect(mtext.plainText).toContain('⌀100');
  });

  test('removes formatting codes', () => {
    const data = [
      { code: 0, value: 'MTEXT' },
      { code: 1, value: '\\H5.0;Large Text\\H2.5;Small Text' },
      { code: 10, value: 0 },
      { code: 20, value: 0 },
      { code: 40, value: 3.0 }
    ];

    const mtext = MTextEntity.fromData(data);
    expect(mtext.plainText).toBe('Large TextSmall Text');
    expect(mtext.plainText).not.toContain('\\H');
  });

  test('handles multiple text fragments', () => {
    const data = [
      { code: 0, value: 'MTEXT' },
      { code: 3, value: 'Part1 ' },
      { code: 3, value: 'Part2 ' },
      { code: 1, value: 'Part3' },
      { code: 10, value: 0 },
      { code: 20, value: 0 },
      { code: 40, value: 1.0 }
    ];

    const mtext = MTextEntity.fromData(data);
    expect(mtext.text).toBe('Part1 Part2 Part3');
  });

  test('parses attachment point', () => {
    const data = [
      { code: 0, value: 'MTEXT' },
      { code: 1, value: 'Centered' },
      { code: 10, value: 100 },
      { code: 20, value: 50 },
      { code: 40, value: 3.0 },
      { code: 71, value: 5 } // Middle-center
    ];

    const mtext = MTextEntity.fromData(data);
    expect(mtext.attachmentPoint).toBe(5);
  });

  test('calculates bounds for top-left attachment', () => {
    const mtext = new MTextEntity();
    mtext.position = { x: 100, y: 50, z: 0 };
    mtext.height = 5;
    mtext.lines = ['Line 1', 'Line 2', 'Line 3'];
    mtext.attachmentPoint = 1; // Top-left

    const bounds = mtext.getBounds();
    expect(bounds.minX).toBe(100);
    expect(bounds.minY).toBe(50);
    expect(bounds.maxX).toBeGreaterThan(100);
    expect(bounds.maxY).toBeGreaterThan(50);
  });

  test('calculates bounds for center attachment', () => {
    const mtext = new MTextEntity();
    mtext.position = { x: 100, y: 50, z: 0 };
    mtext.height = 5;
    mtext.lines = ['Center'];
    mtext.attachmentPoint = 5; // Middle-center

    const bounds = mtext.getBounds();
    expect(bounds.minX).toBeLessThan(100);
    expect(bounds.maxX).toBeGreaterThan(100);
    expect(bounds.minY).toBeLessThan(50);
    expect(bounds.maxY).toBeGreaterThan(50);
  });

  test('handles column width', () => {
    const data = [
      { code: 0, value: 'MTEXT' },
      { code: 1, value: 'Text' },
      { code: 10, value: 0 },
      { code: 20, value: 0 },
      { code: 40, value: 2.0 },
      { code: 41, value: 100 } // Column width
    ];

    const mtext = MTextEntity.fromData(data);
    expect(mtext.width).toBe(100);
  });

  test('gets line count', () => {
    const mtext = new MTextEntity();
    mtext.lines = ['Line 1', 'Line 2', 'Line 3'];
    expect(mtext.getLineCount()).toBe(3);
  });

  test('handles empty text', () => {
    const data = [
      { code: 0, value: 'MTEXT' },
      { code: 1, value: '' },
      { code: 10, value: 0 },
      { code: 20, value: 0 },
      { code: 40, value: 1.0 }
    ];

    const mtext = MTextEntity.fromData(data);
    expect(mtext.text).toBe('');
    expect(mtext.lines).toHaveLength(0);
  });

  test('handles cyrillic text', () => {
    const data = [
      { code: 0, value: 'MTEXT' },
      { code: 1, value: 'Первая строка\\PВторая строка' },
      { code: 10, value: 0 },
      { code: 20, value: 0 },
      { code: 40, value: 5.0 }
    ];

    const mtext = MTextEntity.fromData(data);
    expect(mtext.lines[0]).toBe('Первая строка');
    expect(mtext.lines[1]).toBe('Вторая строка');
  });
});
