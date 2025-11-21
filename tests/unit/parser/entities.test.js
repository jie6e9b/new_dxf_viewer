import Entity from '../../../src/core/parser/entities/Entity';
import LineEntity from '../../../src/core/parser/entities/LineEntity';
import EntityFactory from '../../../src/core/parser/entities/EntityFactory';
import TableManager from '../../../src/core/parser/styles/TableManager';
import Layer from '../../../src/core/parser/styles/Layer';

describe('Entity', () => {
  test('creates base entity', () => {
    const entity = new Entity('TEST');
    expect(entity.type).toBe('TEST');
    expect(entity.layer).toBe('0');
    expect(entity.visible).toBe(true);
  });

  test('parses common properties', () => {
    const entity = new Entity('TEST');
    const data = [
      { code: 5, value: 'A1' }, // Handle
      { code: 8, value: 'Layer1' }, // Layer
      { code: 62, value: 3 }, // Color
      { code: 6, value: 'DASHED' }, // Linetype
      { code: 370, value: 5 } // Lineweight
    ];

    entity.parseCommon(data);

    expect(entity.handle).toBe('A1');
    expect(entity.layer).toBe('Layer1');
    expect(entity.color).toBe(3);
    expect(entity.lineType).toBe('DASHED');
    expect(entity.lineWeight).toBe(5);
  });

  test('handles visibility flag', () => {
    const entity = new Entity('TEST');

    entity.parseCommon([{ code: 60, value: 0 }]);
    expect(entity.visible).toBe(true);

    entity.parseCommon([{ code: 60, value: 1 }]);
    expect(entity.visible).toBe(false);
  });

  test('gets effective color (BYLAYER)', () => {
    const tables = new TableManager();
    const layer = new Layer('TestLayer');
    layer.color = 5;
    tables.layers.set('TestLayer', layer);

    const entity = new Entity('TEST');
    entity.layer = 'TestLayer';
    entity.color = null; // BYLAYER

    expect(entity.getEffectiveColor(tables)).toBe(5);
  });

  test('gets effective color (explicit)', () => {
    const tables = new TableManager();
    const entity = new Entity('TEST');
    entity.color = 3;

    expect(entity.getEffectiveColor(tables)).toBe(3);
  });

  test('checks if should render', () => {
    const tables = new TableManager();
    const entity = new Entity('TEST');

    expect(entity.shouldRender(tables)).toBe(true);

    entity.visible = false;
    expect(entity.shouldRender(tables)).toBe(false);

    entity.visible = true;
    entity.layer = 'TestLayer';
    const layer = new Layer('TestLayer');
    layer.frozen = true;
    tables.layers.set('TestLayer', layer);

    expect(entity.shouldRender(tables)).toBe(false);
  });
});

describe('LineEntity', () => {
  test('creates line entity', () => {
    const line = new LineEntity();
    expect(line.type).toBe('LINE');
    expect(line.start).toEqual({ x: 0, y: 0, z: 0 });
    expect(line.end).toEqual({ x: 0, y: 0, z: 0 });
  });

  test('parses line from data', () => {
    const data = [
      { code: 8, value: 'Layer1' },
      { code: 10, value: 10 },
      { code: 20, value: 20 },
      { code: 30, value: 0 },
      { code: 11, value: 100 },
      { code: 21, value: 50 },
      { code: 31, value: 0 }
    ];

    const line = LineEntity.fromData(data);

    expect(line.layer).toBe('Layer1');
    expect(line.start).toEqual({ x: 10, y: 20, z: 0 });
    expect(line.end).toEqual({ x: 100, y: 50, z: 0 });
  });

  test('calculates bounding box', () => {
    const line = new LineEntity();
    line.start = { x: 10, y: 20, z: 0 };
    line.end = { x: 100, y: 50, z: 0 };

    const bounds = line.getBounds();

    expect(bounds.minX).toBe(10);
    expect(bounds.minY).toBe(20);
    expect(bounds.maxX).toBe(100);
    expect(bounds.maxY).toBe(50);
  });

  test('calculates bounding box with negative coordinates', () => {
    const line = new LineEntity();
    line.start = { x: -10, y: -20, z: 0 };
    line.end = { x: 100, y: 50, z: 0 };

    const bounds = line.getBounds();

    expect(bounds.minX).toBe(-10);
    expect(bounds.minY).toBe(-20);
    expect(bounds.maxX).toBe(100);
    expect(bounds.maxY).toBe(50);
  });

  test('calculates line length', () => {
    const line = new LineEntity();
    line.start = { x: 0, y: 0, z: 0 };
    line.end = { x: 3, y: 4, z: 0 };

    expect(line.getLength()).toBe(5); // 3-4-5 triangle
  });

  test('calculates 3D line length', () => {
    const line = new LineEntity();
    line.start = { x: 0, y: 0, z: 0 };
    line.end = { x: 1, y: 1, z: 1 };

    expect(line.getLength()).toBeCloseTo(Math.sqrt(3));
  });

  test('detects vertical lines', () => {
    const line = new LineEntity();
    line.start = { x: 10, y: 0, z: 0 };
    line.end = { x: 10, y: 100, z: 0 };

    expect(line.isVertical()).toBe(true);
    expect(line.isHorizontal()).toBe(false);
  });

  test('detects horizontal lines', () => {
    const line = new LineEntity();
    line.start = { x: 0, y: 10, z: 0 };
    line.end = { x: 100, y: 10, z: 0 };

    expect(line.isHorizontal()).toBe(true);
    expect(line.isVertical()).toBe(false);
  });

  test('calculates line angle', () => {
    const line = new LineEntity();
    line.start = { x: 0, y: 0, z: 0 };
    line.end = { x: 1, y: 0, z: 0 };

    expect(line.getAngle()).toBe(0); // Horizontal right

    line.end = { x: 0, y: 1, z: 0 };
    expect(line.getAngle()).toBeCloseTo(Math.PI / 2); // Vertical up
  });

  test('handles near-vertical lines with tolerance', () => {
    const line = new LineEntity();
    line.start = { x: 10, y: 0, z: 0 };
    line.end = { x: 10.00001, y: 100, z: 0 };

    expect(line.isVertical(0.001)).toBe(true);
    expect(line.isVertical(0.000001)).toBe(false);
  });
});

describe('EntityFactory', () => {
  test('creates factory with default parsers', () => {
    const factory = new EntityFactory();
    expect(factory.isSupported('LINE')).toBe(true);
  });

  test('creates LINE entity', () => {
    const factory = new EntityFactory();
    const entityData = {
      type: 'LINE',
      data: [
        { code: 10, value: 0 },
        { code: 20, value: 0 },
        { code: 11, value: 100 },
        { code: 21, value: 100 }
      ]
    };

    const entity = factory.createEntity(entityData);

    expect(entity).toBeInstanceOf(LineEntity);
    expect(entity.start).toEqual({ x: 0, y: 0, z: 0 });
    expect(entity.end).toEqual({ x: 100, y: 100, z: 0 });
  });

  test('returns null for unknown entity type', () => {
    const factory = new EntityFactory();
    const entityData = {
      type: 'UNKNOWN',
      data: []
    };

    // Mock console.warn to avoid cluttering test output
    const originalWarn = console.warn;
    console.warn = jest.fn();

    const entity = factory.createEntity(entityData);

    expect(entity).toBeNull();
    expect(console.warn).toHaveBeenCalledWith('Unknown entity type: UNKNOWN');

    console.warn = originalWarn;
  });

  test('creates multiple entities', () => {
    const factory = new EntityFactory();
    const entitiesData = [
      {
        type: 'LINE',
        data: [
          { code: 10, value: 0 },
          { code: 20, value: 0 },
          { code: 11, value: 10 },
          { code: 21, value: 10 }
        ]
      },
      {
        type: 'LINE',
        data: [
          { code: 10, value: 20 },
          { code: 20, value: 20 },
          { code: 11, value: 30 },
          { code: 21, value: 30 }
        ]
      }
    ];

    const entities = factory.createEntities(entitiesData);

    expect(entities).toHaveLength(2);
    expect(entities[0]).toBeInstanceOf(LineEntity);
    expect(entities[1]).toBeInstanceOf(LineEntity);
  });

  test('skips unsupported entity types', () => {
    const factory = new EntityFactory();
    const entitiesData = [
      { type: 'LINE', data: [{ code: 10, value: 0 }] },
      { type: 'UNKNOWN', data: [] },
      { type: 'LINE', data: [{ code: 10, value: 10 }] }
    ];

    const originalWarn = console.warn;
    console.warn = jest.fn();

    const entities = factory.createEntities(entitiesData);

    expect(entities).toHaveLength(2); // Only 2 LINE entities
    expect(entities.every(e => e.type === 'LINE')).toBe(true);

    console.warn = originalWarn;
  });

  test('registers custom parser', () => {
    const factory = new EntityFactory();

    class CustomEntity extends Entity {
      constructor() {
        super('CUSTOM');
      }
      static fromData() {
        return new CustomEntity();
      }
    }

    factory.registerParser('CUSTOM', CustomEntity.fromData);

    expect(factory.isSupported('CUSTOM')).toBe(true);

    const entity = factory.createEntity({ type: 'CUSTOM', data: [] });
    expect(entity).toBeInstanceOf(CustomEntity);
  });

  test('gets supported types', () => {
    const factory = new EntityFactory();
    const types = factory.getSupportedTypes();

    expect(Array.isArray(types)).toBe(true);
    expect(types).toContain('LINE');
  });

  test('gets entity statistics', () => {
    const factory = new EntityFactory();
    const entities = [
      new LineEntity(),
      new LineEntity(),
      new LineEntity()
    ];

    const stats = factory.getStats(entities);

    expect(stats.total).toBe(3);
    expect(stats.byType.LINE).toBe(3);
  });

  test('handles errors during parsing', () => {
    const factory = new EntityFactory();

    // Register a parser that throws an error
    factory.registerParser('ERROR', () => {
      throw new Error('Parse error');
    });

    const originalError = console.error;
    console.error = jest.fn();

    const entity = factory.createEntity({ type: 'ERROR', data: [] });

    expect(entity).toBeNull();
    expect(console.error).toHaveBeenCalled();

    console.error = originalError;
  });
});
