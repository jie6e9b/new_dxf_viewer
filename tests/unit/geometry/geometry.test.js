import Vector2D from '../../../src/core/geometry/Vector2D';
import BoundingBox from '../../../src/core/geometry/BoundingBox';

describe('Vector2D', () => {
  test('creates vector', () => {
    const v = new Vector2D(3, 4);
    expect(v.x).toBe(3);
    expect(v.y).toBe(4);
  });

  test('creates from object', () => {
    const v = Vector2D.from({ x: 5, y: 10 });
    expect(v.x).toBe(5);
    expect(v.y).toBe(10);
  });

  test('adds vectors', () => {
    const v1 = new Vector2D(1, 2);
    const v2 = new Vector2D(3, 4);
    const result = v1.add(v2);
    expect(result.x).toBe(4);
    expect(result.y).toBe(6);
  });

  test('subtracts vectors', () => {
    const v1 = new Vector2D(5, 8);
    const v2 = new Vector2D(2, 3);
    const result = v1.subtract(v2);
    expect(result.x).toBe(3);
    expect(result.y).toBe(5);
  });

  test('multiplies by scalar', () => {
    const v = new Vector2D(2, 3);
    const result = v.multiply(3);
    expect(result.x).toBe(6);
    expect(result.y).toBe(9);
  });

  test('divides by scalar', () => {
    const v = new Vector2D(6, 9);
    const result = v.divide(3);
    expect(result.x).toBe(2);
    expect(result.y).toBe(3);
  });

  test('calculates length', () => {
    const v = new Vector2D(3, 4);
    expect(v.length()).toBe(5);
  });

  test('calculates squared length', () => {
    const v = new Vector2D(3, 4);
    expect(v.lengthSquared()).toBe(25);
  });

  test('normalizes vector', () => {
    const v = new Vector2D(3, 4);
    const normalized = v.normalize();
    expect(normalized.length()).toBeCloseTo(1);
  });

  test('calculates dot product', () => {
    const v1 = new Vector2D(1, 2);
    const v2 = new Vector2D(3, 4);
    expect(v1.dot(v2)).toBe(11); // 1*3 + 2*4
  });

  test('calculates cross product', () => {
    const v1 = new Vector2D(1, 2);
    const v2 = new Vector2D(3, 4);
    expect(v1.cross(v2)).toBe(-2); // 1*4 - 2*3
  });

  test('calculates distance', () => {
    const v1 = new Vector2D(0, 0);
    const v2 = new Vector2D(3, 4);
    expect(v1.distanceTo(v2)).toBe(5);
  });

  test('calculates angle', () => {
    const v = new Vector2D(1, 0);
    expect(v.angle()).toBe(0);

    const v2 = new Vector2D(0, 1);
    expect(v2.angle()).toBeCloseTo(Math.PI / 2);
  });

  test('rotates vector', () => {
    const v = new Vector2D(1, 0);
    const rotated = v.rotate(Math.PI / 2);
    expect(rotated.x).toBeCloseTo(0);
    expect(rotated.y).toBeCloseTo(1);
  });

  test('clones vector', () => {
    const v = new Vector2D(3, 4);
    const clone = v.clone();
    expect(clone.x).toBe(3);
    expect(clone.y).toBe(4);
    expect(clone).not.toBe(v);
  });

  test('checks equality', () => {
    const v1 = new Vector2D(1, 2);
    const v2 = new Vector2D(1, 2);
    const v3 = new Vector2D(1.0001, 2);

    expect(v1.equals(v2)).toBe(true);
    expect(v1.equals(v3, 0.001)).toBe(true);
    expect(v1.equals(v3, 0.00001)).toBe(false);
  });
});

describe('BoundingBox', () => {
  test('creates empty bounding box', () => {
    const box = new BoundingBox();
    expect(box.isEmpty()).toBe(true);
  });

  test('creates from points', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 10, y: 5 },
      { x: -5, y: 15 }
    ];
    const box = BoundingBox.fromPoints(points);

    expect(box.minX).toBe(-5);
    expect(box.minY).toBe(0);
    expect(box.maxX).toBe(10);
    expect(box.maxY).toBe(15);
  });

  test('expands to include point', () => {
    const box = new BoundingBox();
    box.expand(10, 20);
    box.expand(-5, 30);

    expect(box.minX).toBe(-5);
    expect(box.minY).toBe(20);
    expect(box.maxX).toBe(10);
    expect(box.maxY).toBe(30);
  });

  test('expands by another box', () => {
    const box1 = new BoundingBox(0, 0, 10, 10);
    const box2 = { minX: -5, minY: 5, maxX: 15, maxY: 20 };

    box1.expandByBox(box2);

    expect(box1.minX).toBe(-5);
    expect(box1.minY).toBe(0);
    expect(box1.maxX).toBe(15);
    expect(box1.maxY).toBe(20);
  });

  test('calculates width and height', () => {
    const box = new BoundingBox(0, 0, 100, 50);
    expect(box.getWidth()).toBe(100);
    expect(box.getHeight()).toBe(50);
  });

  test('calculates center', () => {
    const box = new BoundingBox(0, 0, 100, 50);
    const center = box.getCenter();
    expect(center.x).toBe(50);
    expect(center.y).toBe(25);
  });

  test('calculates area', () => {
    const box = new BoundingBox(0, 0, 10, 20);
    expect(box.getArea()).toBe(200);
  });

  test('checks if contains point', () => {
    const box = new BoundingBox(0, 0, 100, 50);

    expect(box.contains(50, 25)).toBe(true);
    expect(box.contains(0, 0)).toBe(true);
    expect(box.contains(100, 50)).toBe(true);
    expect(box.contains(-1, 25)).toBe(false);
    expect(box.contains(101, 25)).toBe(false);
  });

  test('checks intersection', () => {
    const box1 = new BoundingBox(0, 0, 100, 100);
    const box2 = new BoundingBox(50, 50, 150, 150);
    const box3 = new BoundingBox(200, 200, 300, 300);

    expect(box1.intersects(box2)).toBe(true);
    expect(box1.intersects(box3)).toBe(false);
  });

  test('adds padding', () => {
    const box = new BoundingBox(10, 10, 20, 20);
    const padded = box.pad(5);

    expect(padded.minX).toBe(5);
    expect(padded.minY).toBe(5);
    expect(padded.maxX).toBe(25);
    expect(padded.maxY).toBe(25);
  });

  test('clones box', () => {
    const box = new BoundingBox(0, 0, 100, 50);
    const clone = box.clone();

    expect(clone.minX).toBe(box.minX);
    expect(clone.maxX).toBe(box.maxX);
    expect(clone).not.toBe(box);
  });

  test('converts to object', () => {
    const box = new BoundingBox(0, 0, 100, 50);
    const obj = box.toObject();

    expect(obj.minX).toBe(0);
    expect(obj.width).toBe(100);
    expect(obj.height).toBe(50);
    expect(obj.center.x).toBe(50);
  });
});
