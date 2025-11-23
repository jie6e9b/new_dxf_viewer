import TextEntity from '../../../src/core/parser/entities/TextEntity';

describe('TextEntity', () => {
  test('creates text entity', () => {
    const text = new TextEntity();
    expect(text.type).toBe('TEXT');
    expect(text.position).toEqual({ x: 0, y: 0, z: 0 });
    expect(text.height).toBe(1.0);
    expect(text.text).toBe('');
    expect(text.rotation).toBe(0);
  });

  test('parses text from data', () => {
    const data = [
      { code: 0, value: 'TEXT' },
      { code: 1, value: 'Hello World' },
      { code: 10, value: 100 },
      { code: 20, value: 50 },
      { code: 40, value: 5.0 },
      { code: 50, value: 45 },
      { code: 7, value: 'ARIAL' }
    ];

    const text = TextEntity.fromData(data);
    expect(text.text).toBe('Hello World');
    expect(text.position.x).toBe(100);
    expect(text.position.y).toBe(50);
    expect(text.height).toBe(5.0);
    expect(text.rotation).toBe(45);
    expect(text.style).toBe('ARIAL');
  });

  test('parses text with alignment', () => {
    const data = [
      { code: 0, value: 'TEXT' },
      { code: 1, value: 'Centered' },
      { code: 10, value: 100 },
      { code: 20, value: 50 },
      { code: 40, value: 3.0 },
      { code: 72, value: 1 }, // Horizontal: center
      { code: 73, value: 2 }, // Vertical: middle
      { code: 11, value: 100 },
      { code: 21, value: 50 }
    ];

    const text = TextEntity.fromData(data);
    expect(text.text).toBe('Centered');
    expect(text.horizontalAlign).toBe(1);
    expect(text.verticalAlign).toBe(2);
    expect(text.alignmentPoint).toEqual({ x: 100, y: 50, z: 0 });
  });

  test('parses text with width factor and oblique', () => {
    const data = [
      { code: 0, value: 'TEXT' },
      { code: 1, value: 'Wide Text' },
      { code: 10, value: 0 },
      { code: 20, value: 0 },
      { code: 40, value: 2.0 },
      { code: 41, value: 1.5 }, // Width factor
      { code: 51, value: 15 } // Oblique angle
    ];

    const text = TextEntity.fromData(data);
    expect(text.widthFactor).toBe(1.5);
    expect(text.obliqueAngle).toBe(15);
  });

  test('calculates bounds for left-aligned text', () => {
    const text = new TextEntity();
    text.position = { x: 100, y: 50, z: 0 };
    text.height = 5;
    text.text = 'Test';
    text.widthFactor = 1.0;

    const bounds = text.getBounds();
    expect(bounds.minX).toBe(100);
    expect(bounds.minY).toBe(50);
    expect(bounds.maxX).toBeGreaterThan(100);
    expect(bounds.maxY).toBe(55);
  });

  test('calculates bounds for center-aligned text', () => {
    const text = new TextEntity();
    text.position = { x: 100, y: 50, z: 0 };
    text.height = 5;
    text.text = 'Test';
    text.horizontalAlign = 1; // Center

    const bounds = text.getBounds();
    expect(bounds.minX).toBeLessThan(100);
    expect(bounds.maxX).toBeGreaterThan(100);
    expect(bounds.minY).toBe(50);
  });

  test('calculates bounds for right-aligned text', () => {
    const text = new TextEntity();
    text.position = { x: 100, y: 50, z: 0 };
    text.height = 5;
    text.text = 'Test';
    text.horizontalAlign = 2; // Right

    const bounds = text.getBounds();
    expect(bounds.maxX).toBe(100);
    expect(bounds.minX).toBeLessThan(100);
  });

  test('calculates bounds for middle-vertical-aligned text', () => {
    const text = new TextEntity();
    text.position = { x: 100, y: 50, z: 0 };
    text.height = 10;
    text.text = 'Test';
    text.verticalAlign = 2; // Middle

    const bounds = text.getBounds();
    expect(bounds.minY).toBe(45);
    expect(bounds.maxY).toBe(55);
  });

  test('calculates bounds for top-aligned text', () => {
    const text = new TextEntity();
    text.position = { x: 100, y: 50, z: 0 };
    text.height = 10;
    text.text = 'Test';
    text.verticalAlign = 3; // Top

    const bounds = text.getBounds();
    expect(bounds.minY).toBe(40);
    expect(bounds.maxY).toBe(50);
  });

  test('gets insertion point without alignment', () => {
    const text = new TextEntity();
    text.position = { x: 100, y: 50, z: 0 };

    const point = text.getInsertionPoint();
    expect(point).toEqual({ x: 100, y: 50 });
  });

  test('gets insertion point with alignment point', () => {
    const text = new TextEntity();
    text.position = { x: 100, y: 50, z: 0 };
    text.horizontalAlign = 1;
    text.alignmentPoint = { x: 150, y: 75, z: 0 };

    const point = text.getInsertionPoint();
    expect(point).toEqual({ x: 150, y: 75 });
  });

  test('gets canvas align for different alignments', () => {
    const text = new TextEntity();

    text.horizontalAlign = 0;
    expect(text.getCanvasAlign()).toBe('left');

    text.horizontalAlign = 1;
    expect(text.getCanvasAlign()).toBe('center');

    text.horizontalAlign = 2;
    expect(text.getCanvasAlign()).toBe('right');
  });

  test('gets canvas baseline for different alignments', () => {
    const text = new TextEntity();

    text.verticalAlign = 0;
    expect(text.getCanvasBaseline()).toBe('alphabetic');

    text.verticalAlign = 1;
    expect(text.getCanvasBaseline()).toBe('bottom');

    text.verticalAlign = 2;
    expect(text.getCanvasBaseline()).toBe('middle');

    text.verticalAlign = 3;
    expect(text.getCanvasBaseline()).toBe('top');
  });

  test('gets baseline offset for different alignments', () => {
    const text = new TextEntity();

    text.verticalAlign = 0;
    expect(text.getBaselineOffset()).toBe(0);

    text.verticalAlign = 1;
    expect(text.getBaselineOffset()).toBe(0.2);

    text.verticalAlign = 2;
    expect(text.getBaselineOffset()).toBe(0.5);

    text.verticalAlign = 3;
    expect(text.getBaselineOffset()).toBe(1.0);
  });

  test('parses common entity properties', () => {
    const data = [
      { code: 0, value: 'TEXT' },
      { code: 1, value: 'Test' },
      { code: 8, value: 'TextLayer' },
      { code: 62, value: 3 },
      { code: 10, value: 0 },
      { code: 20, value: 0 },
      { code: 40, value: 1.0 }
    ];

    const text = TextEntity.fromData(data);
    expect(text.layer).toBe('TextLayer');
    expect(text.color).toBe(3);
  });

  test('handles empty text', () => {
    const data = [
      { code: 0, value: 'TEXT' },
      { code: 1, value: '' },
      { code: 10, value: 0 },
      { code: 20, value: 0 },
      { code: 40, value: 1.0 }
    ];

    const text = TextEntity.fromData(data);
    expect(text.text).toBe('');

    const bounds = text.getBounds();
    expect(bounds.minX).toBe(0);
    expect(bounds.maxX).toBe(0); // Empty text has zero width
  });

  test('handles cyrillic text', () => {
    const data = [
      { code: 0, value: 'TEXT' },
      { code: 1, value: 'Привет мир' },
      { code: 10, value: 0 },
      { code: 20, value: 0 },
      { code: 40, value: 5.0 }
    ];

    const text = TextEntity.fromData(data);
    expect(text.text).toBe('Привет мир');
    expect(text.text.length).toBe(10);
  });
});
