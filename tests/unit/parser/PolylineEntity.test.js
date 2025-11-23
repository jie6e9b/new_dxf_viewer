import PolylineEntity from '../../../src/core/parser/entities/PolylineEntity';

describe('PolylineEntity', () => {
  test('creates polyline entity', () => {
    const poly = new PolylineEntity();
    expect(poly.type).toBe('POLYLINE');
    expect(poly.vertices).toEqual([]);
    expect(poly.closed).toBe(false);
  });

  test('parses simple polyline', () => {
    const data = [
      { code: 90, value: 3 }, // Number of vertices
      { code: 10, value: 0 },
      { code: 20, value: 0 },
      { code: 10, value: 100 },
      { code: 20, value: 0 },
      { code: 10, value: 100 },
      { code: 20, value: 100 }
    ];

    const poly = PolylineEntity.fromData(data);

    expect(poly.vertices).toHaveLength(3);
    expect(poly.vertices[0]).toEqual({ x: 0, y: 0, z: 0, bulge: 0 });
    expect(poly.vertices[1]).toEqual({ x: 100, y: 0, z: 0, bulge: 0 });
    expect(poly.vertices[2]).toEqual({ x: 100, y: 100, z: 0, bulge: 0 });
  });

  test('parses closed polyline', () => {
    const data = [
      { code: 70, value: 1 }, // Closed flag
      { code: 10, value: 0 },
      { code: 20, value: 0 },
      { code: 10, value: 100 },
      { code: 20, value: 100 }
    ];

    const poly = PolylineEntity.fromData(data);

    expect(poly.closed).toBe(true);
    expect(poly.vertices).toHaveLength(2);
  });

  test('parses polyline with bulge', () => {
    const data = [
      { code: 10, value: 0 },
      { code: 20, value: 0 },
      { code: 42, value: 0.5 }, // Bulge
      { code: 10, value: 100 },
      { code: 20, value: 0 }
    ];

    const poly = PolylineEntity.fromData(data);

    expect(poly.vertices).toHaveLength(2);
    expect(poly.vertices[0].bulge).toBe(0.5);
    expect(poly.vertices[1].bulge).toBe(0);
  });

  test('calculates bounds for straight polyline', () => {
    const poly = new PolylineEntity();
    poly.vertices = [
      { x: 0, y: 0, z: 0, bulge: 0 },
      { x: 100, y: 50, z: 0, bulge: 0 },
      { x: -20, y: 80, z: 0, bulge: 0 }
    ];

    const bounds = poly.getBounds();

    expect(bounds.minX).toBe(-20);
    expect(bounds.minY).toBe(0);
    expect(bounds.maxX).toBe(100);
    expect(bounds.maxY).toBe(80);
  });

  test('calculates bounds for empty polyline', () => {
    const poly = new PolylineEntity();
    const bounds = poly.getBounds();

    expect(bounds.minX).toBe(0);
    expect(bounds.maxX).toBe(0);
  });

  test('converts bulge to arc parameters', () => {
    const poly = new PolylineEntity();
    const v1 = { x: 0, y: 0 };
    const v2 = { x: 100, y: 0 };
    const bulge = 0.5; // Some arc

    const arc = poly.bulgeToArc(v1, v2, bulge);

    expect(arc.center).toBeDefined();
    expect(arc.radius).toBeGreaterThan(0);
    expect(arc.startAngle).toBeDefined();
    expect(arc.endAngle).toBeDefined();
    expect(arc.counterclockwise).toBe(true); // Positive bulge
  });

  test('bulge arc with negative value is clockwise', () => {
    const poly = new PolylineEntity();
    const v1 = { x: 0, y: 0 };
    const v2 = { x: 100, y: 0 };
    const bulge = -0.5;

    const arc = poly.bulgeToArc(v1, v2, bulge);

    expect(arc.counterclockwise).toBe(false);
  });

  test('bulge of 1 creates semicircle', () => {
    const poly = new PolylineEntity();
    const v1 = { x: 0, y: 0 };
    const v2 = { x: 100, y: 0 };
    const bulge = 1.0;

    const arc = poly.bulgeToArc(v1, v2, bulge);

    // Radius should be half the chord length
    expect(arc.radius).toBeCloseTo(50, 1);

    // Angle should be approximately 180° (π)
    const angle = 4 * Math.atan(bulge);
    expect(Math.abs(angle)).toBeCloseTo(Math.PI, 2);
  });

  test('bulge of 0 is treated as straight line in segments', () => {
    const poly = new PolylineEntity();
    poly.vertices = [
      { x: 0, y: 0, z: 0, bulge: 0 },
      { x: 100, y: 0, z: 0, bulge: 0 }
    ];

    const segments = poly.getSegments();

    expect(segments).toHaveLength(1);
    expect(segments[0].type).toBe('line');
    expect(segments[0].start).toEqual({ x: 0, y: 0 });
    expect(segments[0].end).toEqual({ x: 100, y: 0 });
  });

  test('getSegments returns arc for bulge', () => {
    const poly = new PolylineEntity();
    poly.vertices = [
      { x: 0, y: 0, z: 0, bulge: 0.5 },
      { x: 100, y: 0, z: 0, bulge: 0 }
    ];

    const segments = poly.getSegments();

    expect(segments).toHaveLength(1);
    expect(segments[0].type).toBe('arc');
    expect(segments[0].center).toBeDefined();
    expect(segments[0].radius).toBeGreaterThan(0);
  });

  test('getSegments handles closed polyline', () => {
    const poly = new PolylineEntity();
    poly.closed = true;
    poly.vertices = [
      { x: 0, y: 0, z: 0, bulge: 0 },
      { x: 100, y: 0, z: 0, bulge: 0 },
      { x: 100, y: 100, z: 0, bulge: 0 }
    ];

    const segments = poly.getSegments();

    // Should have 3 segments including closing segment
    expect(segments).toHaveLength(3);
    expect(segments[2].start).toEqual({ x: 100, y: 100 });
    expect(segments[2].end).toEqual({ x: 0, y: 0 });
  });

  test('getSegments handles closed polyline with bulge on last vertex', () => {
    const poly = new PolylineEntity();
    poly.closed = true;
    poly.vertices = [
      { x: 0, y: 0, z: 0, bulge: 0 },
      { x: 100, y: 0, z: 0, bulge: 0 },
      { x: 100, y: 100, z: 0, bulge: 0.5 } // Bulge on closing segment
    ];

    const segments = poly.getSegments();

    expect(segments).toHaveLength(3);
    expect(segments[2].type).toBe('arc');
  });

  test('calculates length for straight polyline', () => {
    const poly = new PolylineEntity();
    poly.vertices = [
      { x: 0, y: 0, z: 0, bulge: 0 },
      { x: 100, y: 0, z: 0, bulge: 0 },
      { x: 100, y: 100, z: 0, bulge: 0 }
    ];

    const length = poly.getLength();

    expect(length).toBe(200); // 100 + 100
  });

  test('calculates length for polyline with arcs', () => {
    const poly = new PolylineEntity();
    poly.vertices = [
      { x: 0, y: 0, z: 0, bulge: 1 }, // Semicircle
      { x: 100, y: 0, z: 0, bulge: 0 }
    ];

    const length = poly.getLength();

    // Arc length should be greater than straight line (100)
    expect(length).toBeGreaterThan(70);
    expect(length).toBeLessThan(100);
  });

  test('handles polyline with single vertex', () => {
    const poly = new PolylineEntity();
    poly.vertices = [
      { x: 50, y: 50, z: 0, bulge: 0 }
    ];

    const segments = poly.getSegments();
    expect(segments).toHaveLength(0);

    const length = poly.getLength();
    expect(length).toBe(0);
  });

  test('handles degenerate bulge (zero chord length)', () => {
    const poly = new PolylineEntity();
    const v1 = { x: 50, y: 50 };
    const v2 = { x: 50, y: 50 }; // Same point
    const bulge = 0.5;

    const arc = poly.bulgeToArc(v1, v2, bulge);

    expect(arc.radius).toBe(0);
    expect(arc.center).toEqual({ x: 50, y: 50 });
  });

  test('parses polyline with 3D coordinates', () => {
    const data = [
      { code: 10, value: 0 },
      { code: 20, value: 0 },
      { code: 30, value: 5 },
      { code: 10, value: 100 },
      { code: 20, value: 100 },
      { code: 30, value: 10 }
    ];

    const poly = PolylineEntity.fromData(data);

    expect(poly.vertices[0].z).toBe(5);
    expect(poly.vertices[1].z).toBe(10);
  });
});
