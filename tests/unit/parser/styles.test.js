import Layer from '../../../src/core/parser/styles/Layer';
import LineType from '../../../src/core/parser/styles/LineType';
import TextStyle from '../../../src/core/parser/styles/TextStyle';
import TableManager from '../../../src/core/parser/styles/TableManager';

describe('Layer', () => {
  test('creates default layer', () => {
    const layer = new Layer('MyLayer');
    expect(layer.name).toBe('MyLayer');
    expect(layer.color).toBe(7);
    expect(layer.visible).toBe(true);
    expect(layer.locked).toBe(false);
    expect(layer.frozen).toBe(false);
  });

  test('parses layer from table entry', () => {
    const data = [
      { code: 2, value: 'Layer1' },
      { code: 62, value: 3 }, // Green
      { code: 6, value: 'DASHED' },
      { code: 70, value: 0 }
    ];

    const layer = Layer.fromTableEntry(data);
    expect(layer.name).toBe('Layer1');
    expect(layer.color).toBe(3);
    expect(layer.lineType).toBe('DASHED');
  });

  test('handles negative color (layer off)', () => {
    const data = [
      { code: 2, value: 'Layer1' },
      { code: 62, value: -5 } // Negative = off
    ];

    const layer = Layer.fromTableEntry(data);
    expect(layer.visible).toBe(false);
    expect(layer.color).toBe(5); // Absolute value
  });

  test('parses layer flags correctly', () => {
    const layer = new Layer();

    layer.parseFlags(1); // Frozen
    expect(layer.frozen).toBe(true);
    expect(layer.locked).toBe(false);

    layer.parseFlags(4); // Locked
    expect(layer.frozen).toBe(false);
    expect(layer.locked).toBe(true);

    layer.parseFlags(5); // Both frozen and locked
    expect(layer.frozen).toBe(true);
    expect(layer.locked).toBe(true);
  });

  test('checks if layer is active', () => {
    const layer = new Layer();
    expect(layer.isActive()).toBe(true);

    layer.visible = false;
    expect(layer.isActive()).toBe(false);

    layer.visible = true;
    layer.frozen = true;
    expect(layer.isActive()).toBe(false);
  });

  test('converts ACI colors to RGB', () => {
    expect(Layer.aciToRgb(1)).toBe('#FF0000'); // Red
    expect(Layer.aciToRgb(2)).toBe('#FFFF00'); // Yellow
    expect(Layer.aciToRgb(3)).toBe('#00FF00'); // Green
    expect(Layer.aciToRgb(7)).toBe('#FFFFFF'); // White
  });

  test('gets layer color', () => {
    const layer = new Layer();
    layer.color = 1;
    expect(layer.getColor()).toBe('#FF0000'); // Red
  });
});

describe('LineType', () => {
  test('creates default linetype', () => {
    const lt = new LineType('CUSTOM');
    expect(lt.name).toBe('CUSTOM');
    expect(lt.pattern).toEqual([]);
  });

  test('parses linetype from table entry', () => {
    const data = [
      { code: 2, value: 'DASHED' },
      { code: 3, value: 'Dashed __ __ __' },
      { code: 40, value: 0.75 },
      { code: 49, value: 0.5 },
      { code: 49, value: -0.25 }
    ];

    const lt = LineType.fromTableEntry(data);
    expect(lt.name).toBe('DASHED');
    expect(lt.description).toBe('Dashed __ __ __');
    expect(lt.patternLength).toBe(0.75);
    expect(lt.pattern).toEqual([0.5, -0.25]);
  });

  test('identifies continuous linetype', () => {
    const continuous = new LineType('CONTINUOUS');
    expect(continuous.isContinuous()).toBe(true);

    const dashed = new LineType('DASHED');
    dashed.pattern = [0.5, -0.25];
    expect(dashed.isContinuous()).toBe(false);
  });

  test('converts to canvas pattern', () => {
    const lt = new LineType('DASHED');
    lt.pattern = [0.5, -0.25];

    const canvasPattern = lt.getCanvasPattern(10);
    expect(canvasPattern).toEqual([5, 2.5]); // Scaled and absolute values
  });

  test('returns empty array for continuous linetype', () => {
    const continuous = LineType.CONTINUOUS;
    expect(continuous.getCanvasPattern()).toEqual([]);
  });

  test('provides predefined linetypes', () => {
    expect(LineType.CONTINUOUS.name).toBe('CONTINUOUS');
    expect(LineType.DASHED.name).toBe('DASHED');
    expect(LineType.DOTTED.name).toBe('DOTTED');
    expect(LineType.DASHDOT.name).toBe('DASHDOT');
  });
});

describe('TextStyle', () => {
  test('creates default text style', () => {
    const style = new TextStyle('CUSTOM');
    expect(style.name).toBe('CUSTOM');
    expect(style.fontName).toBe('Arial');
    expect(style.height).toBe(0);
    expect(style.widthFactor).toBe(1.0);
  });

  test('parses text style from table entry', () => {
    const data = [
      { code: 2, value: 'MyStyle' },
      { code: 3, value: 'arial.ttf' },
      { code: 40, value: 12 },
      { code: 41, value: 0.8 },
      { code: 50, value: 15 }
    ];

    const style = TextStyle.fromTableEntry(data);
    expect(style.name).toBe('MyStyle');
    expect(style.fontName).toBe('arial.ttf');
    expect(style.height).toBe(12);
    expect(style.widthFactor).toBe(0.8);
    expect(style.obliqueAngle).toBe(15);
  });

  test('removes .shx extension from font name', () => {
    const data = [
      { code: 3, value: 'txt.shx' }
    ];

    const style = TextStyle.fromTableEntry(data);
    expect(style.fontName).toBe('txt');
  });

  test('parses text generation flags', () => {
    const style = new TextStyle();

    style.parseFlags(2); // Backward
    expect(style.isBackward).toBe(true);
    expect(style.isUpsideDown).toBe(false);

    style.parseFlags(4); // Upside down
    expect(style.isBackward).toBe(false);
    expect(style.isUpsideDown).toBe(true);
  });

  test('maps font to CSS font', () => {
    const style = new TextStyle();

    style.fontName = 'simplex';
    expect(style.getCSSFont()).toBe('Arial');

    style.fontName = 'romans';
    expect(style.getCSSFont()).toBe('Times New Roman');

    style.fontName = 'unknown';
    expect(style.getCSSFont()).toBe('Arial, sans-serif');
  });

  test('gets font size', () => {
    const style = new TextStyle();

    // Variable height (0)
    expect(style.getFontSize(15)).toBe(15);

    // Fixed height
    style.height = 20;
    expect(style.getFontSize(15)).toBe(20);
  });

  test('generates CSS transform', () => {
    const style = new TextStyle();

    style.widthFactor = 0.5;
    expect(style.getTransform()).toContain('scaleX(0.5)');

    style.obliqueAngle = 15;
    expect(style.getTransform()).toContain('skewX(15deg)');

    style.isBackward = true;
    expect(style.getTransform()).toContain('scaleX(-1)');
  });

  test('provides standard style', () => {
    const standard = TextStyle.STANDARD;
    expect(standard.name).toBe('STANDARD');
  });
});

describe('TableManager', () => {
  test('initializes with defaults', () => {
    const manager = new TableManager();

    expect(manager.layers.size).toBeGreaterThan(0);
    expect(manager.lineTypes.size).toBeGreaterThan(0);
    expect(manager.textStyles.size).toBeGreaterThan(0);

    expect(manager.getLayer('0')).toBeDefined();
    expect(manager.getLineType('CONTINUOUS')).toBeDefined();
    expect(manager.getTextStyle('STANDARD')).toBeDefined();
  });

  test('parses LAYER table', () => {
    const manager = new TableManager();
    const tables = {
      LAYER: [
        {
          type: 'LAYER',
          data: [
            { code: 2, value: 'Layer1' },
            { code: 62, value: 1 }
          ]
        },
        {
          type: 'LAYER',
          data: [
            { code: 2, value: 'Layer2' },
            { code: 62, value: 2 }
          ]
        }
      ]
    };

    manager.parseTables(tables);

    expect(manager.layers.size).toBeGreaterThanOrEqual(3); // 0 + Layer1 + Layer2
    expect(manager.getLayer('Layer1')).toBeDefined();
    expect(manager.getLayer('Layer2')).toBeDefined();
    expect(manager.getLayer('Layer1').color).toBe(1);
  });

  test('parses LTYPE table', () => {
    const manager = new TableManager();
    const tables = {
      LTYPE: [
        {
          type: 'LTYPE',
          data: [
            { code: 2, value: 'DASHED' },
            { code: 49, value: 0.5 }
          ]
        }
      ]
    };

    manager.parseTables(tables);

    expect(manager.lineTypes.size).toBeGreaterThanOrEqual(2);
    expect(manager.getLineType('DASHED')).toBeDefined();
  });

  test('parses STYLE table', () => {
    const manager = new TableManager();
    const tables = {
      STYLE: [
        {
          type: 'STYLE',
          data: [
            { code: 2, value: 'MyStyle' },
            { code: 3, value: 'arial' }
          ]
        }
      ]
    };

    manager.parseTables(tables);

    expect(manager.textStyles.size).toBeGreaterThanOrEqual(2);
    expect(manager.getTextStyle('MyStyle')).toBeDefined();
  });

  test('returns default for unknown names', () => {
    const manager = new TableManager();

    expect(manager.getLayer('NonExistent').name).toBe('0');
    expect(manager.getLineType('NonExistent').name).toBe('CONTINUOUS');
    expect(manager.getTextStyle('NonExistent').name).toBe('STANDARD');
  });

  test('gets layer names', () => {
    const manager = new TableManager();
    const names = manager.getLayerNames();

    expect(Array.isArray(names)).toBe(true);
    expect(names).toContain('0');
  });

  test('gets visible layers', () => {
    const manager = new TableManager();
    const layer1 = new Layer('Layer1');
    const layer2 = new Layer('Layer2');
    layer2.visible = false;

    manager.layers.set('Layer1', layer1);
    manager.layers.set('Layer2', layer2);

    const visible = manager.getVisibleLayers();
    expect(visible.length).toBeGreaterThan(0);
    expect(visible.find(l => l.name === 'Layer1')).toBeDefined();
    expect(visible.find(l => l.name === 'Layer2')).toBeUndefined();
  });

  test('sets layer visibility', () => {
    const manager = new TableManager();
    manager.setLayerVisibility('0', false);

    expect(manager.getLayer('0').visible).toBe(false);
  });

  test('shows all layers', () => {
    const manager = new TableManager();
    manager.setLayerVisibility('0', false);
    manager.showAllLayers();

    expect(manager.getLayer('0').visible).toBe(true);
  });

  test('hides all layers except specified', () => {
    const manager = new TableManager();
    const layer1 = new Layer('Layer1');
    const layer2 = new Layer('Layer2');

    manager.layers.set('Layer1', layer1);
    manager.layers.set('Layer2', layer2);

    manager.hideAllLayersExcept(['Layer1']);

    expect(manager.getLayer('Layer1').visible).toBe(true);
    expect(manager.getLayer('Layer2').visible).toBe(false);
  });

  test('provides statistics', () => {
    const manager = new TableManager();
    const stats = manager.getStats();

    expect(stats.layerCount).toBeGreaterThan(0);
    expect(stats.lineTypeCount).toBeGreaterThan(0);
    expect(stats.textStyleCount).toBeGreaterThan(0);
    expect(typeof stats.visibleLayerCount).toBe('number');
  });
});
