import CircleEntity from '../../../src/core/parser/entities/CircleEntity';
import ArcEntity from '../../../src/core/parser/entities/ArcEntity';

describe('CircleEntity', () => {
  test('creates circle entity', () => {
    const circle = new CircleEntity();
    expect(circle.type).toBe('CIRCLE');
    expect(circle.radius).toBe(0);
  });

  test('parses circle from data', () => {
    const data = [
      { code: 10, value: 50 },
      { code: 20, value: 100 },
      { code: 40, value: 25 }
    ];

    const circle = CircleEntity.fromData(data);

    expect(circle.center).toEqual({ x: 50, y: 100, z: 0 });
    expect(circle.radius).toBe(25);
  });

  test('calculates bounds', () => {
    const circle = new CircleEntity();
    circle.center = { x: 100, y: 100, z: 0 };
    circle.radius = 50;

    const bounds = circle.getBounds();

    expect(bounds).toEqual({
      minX: 50,
      minY: 50,
      maxX: 150,
      maxY: 150
    });
  });

  test('calculates circumference', () => {
    const circle = new CircleEntity();
    circle.radius = 10;

    const circumference = circle.getCircumference();

    expect(circumference).toBeCloseTo(2 * Math.PI * 10);
  });

  test('calculates area', () => {
    const circle = new CircleEntity();
    circle.radius = 10;

    const area = circle.getArea();

    expect(area).toBeCloseTo(Math.PI * 100);
  });

  test('checks if point is inside', () => {
    const circle = new CircleEntity();
    circle.center = { x: 0, y: 0, z: 0 };
    circle.radius = 10;

    expect(circle.containsPoint(0, 0)).toBe(true); // Center
    expect(circle.containsPoint(5, 0)).toBe(true); // Inside
    expect(circle.containsPoint(10, 0)).toBe(true); // On edge
    expect(circle.containsPoint(11, 0)).toBe(false); // Outside
  });

  test('gets point at angle', () => {
    const circle = new CircleEntity();
    circle.center = { x: 0, y: 0, z: 0 };
    circle.radius = 10;

    const point0 = circle.getPointAtAngle(0);
    expect(point0.x).toBeCloseTo(10);
    expect(point0.y).toBeCloseTo(0);

    const point90 = circle.getPointAtAngle(Math.PI / 2);
    expect(point90.x).toBeCloseTo(0);
    expect(point90.y).toBeCloseTo(10);
  });
});

describe('ArcEntity', () => {
  test('creates arc entity', () => {
    const arc = new ArcEntity();
    expect(arc.type).toBe('ARC');
    expect(arc.radius).toBe(0);
  });

  test('parses arc from data', () => {
    const data = [
      { code: 10, value: 50 },
      { code: 20, value: 100 },
      { code: 40, value: 25 },
      { code: 50, value: 0 },
      { code: 51, value: 90 }
    ];

    const arc = ArcEntity.fromData(data);

    expect(arc.center).toEqual({ x: 50, y: 100, z: 0 });
    expect(arc.radius).toBe(25);
    expect(arc.startAngle).toBe(0);
    expect(arc.endAngle).toBe(90);
  });

  test('converts angles to radians', () => {
    const arc = new ArcEntity();
    arc.startAngle = 0;
    arc.endAngle = 180;

    expect(arc.getStartAngleRad()).toBe(0);
    expect(arc.getEndAngleRad()).toBeCloseTo(Math.PI);
  });

  test('calculates sweep angle', () => {
    const arc = new ArcEntity();
    arc.startAngle = 0;
    arc.endAngle = 90;

    const sweep = arc.getSweepAngleRad();

    expect(sweep).toBeCloseTo(Math.PI / 2);
  });

  test('calculates arc length', () => {
    const arc = new ArcEntity();
    arc.radius = 10;
    arc.startAngle = 0;
    arc.endAngle = 90;

    const length = arc.getLength();

    // Quarter circle: (π/2) * 10
    expect(length).toBeCloseTo(Math.PI * 10 / 2);
  });

  test('gets start and end points', () => {
    const arc = new ArcEntity();
    arc.center = { x: 0, y: 0, z: 0 };
    arc.radius = 10;
    arc.startAngle = 0;
    arc.endAngle = 90;

    const start = arc.getStartPoint();
    expect(start.x).toBeCloseTo(10);
    expect(start.y).toBeCloseTo(0);

    const end = arc.getEndPoint();
    expect(end.x).toBeCloseTo(0);
    expect(end.y).toBeCloseTo(10);
  });

  test('gets midpoint', () => {
    const arc = new ArcEntity();
    arc.center = { x: 0, y: 0, z: 0 };
    arc.radius = 10;
    arc.startAngle = 0;
    arc.endAngle = 90;

    const mid = arc.getMidPoint();

    // 45° angle
    expect(mid.x).toBeCloseTo(10 * Math.cos(Math.PI / 4));
    expect(mid.y).toBeCloseTo(10 * Math.sin(Math.PI / 4));
  });

  test('checks if contains angle', () => {
    const arc = new ArcEntity();
    arc.startAngle = 0;
    arc.endAngle = 90;

    expect(arc.containsAngle(45)).toBe(true);
    expect(arc.containsAngle(0)).toBe(true);
    expect(arc.containsAngle(90)).toBe(true);
    expect(arc.containsAngle(180)).toBe(false);
  });

  test('handles wrapped arc (crossing 0°)', () => {
    const arc = new ArcEntity();
    arc.startAngle = 270;
    arc.endAngle = 90;

    expect(arc.containsAngle(0)).toBe(true);
    expect(arc.containsAngle(45)).toBe(true);
    expect(arc.containsAngle(315)).toBe(true);
    expect(arc.containsAngle(180)).toBe(false);
  });

  test('calculates bounds', () => {
    const arc = new ArcEntity();
    arc.center = { x: 0, y: 0, z: 0 };
    arc.radius = 10;
    arc.startAngle = 0;
    arc.endAngle = 90;

    const bounds = arc.getBounds();

    expect(bounds.minX).toBeCloseTo(0);
    expect(bounds.maxX).toBeCloseTo(10);
    expect(bounds.minY).toBeCloseTo(0);
    expect(bounds.maxY).toBeCloseTo(10);
  });

  test('calculates bounds for arc crossing cardinal points', () => {
    const arc = new ArcEntity();
    arc.center = { x: 0, y: 0, z: 0 };
    arc.radius = 10;
    arc.startAngle = 45;
    arc.endAngle = 135;

    const bounds = arc.getBounds();

    // Should include point at 90° (0, 10)
    expect(bounds.maxY).toBeCloseTo(10);
  });
});
