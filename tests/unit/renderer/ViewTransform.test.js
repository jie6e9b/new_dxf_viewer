import ViewTransform from '../../../src/core/renderer/ViewTransform';

describe('ViewTransform', () => {
  test('creates transform with canvas size', () => {
    const transform = new ViewTransform(800, 600);
    expect(transform.canvasWidth).toBe(800);
    expect(transform.canvasHeight).toBe(600);
    expect(transform.scale).toBe(1.0);
  });

  test('transforms world to screen coordinates', () => {
    const transform = new ViewTransform(800, 600);
    transform.scale = 1;
    transform.offsetX = 0;
    transform.offsetY = 0;

    const screen = transform.worldToScreen(10, 20);
    expect(screen.x).toBe(10);
    // Y is flipped
    expect(screen.y).toBe(600 - 20);
  });

  test('transforms screen to world coordinates', () => {
    const transform = new ViewTransform(800, 600);
    transform.scale = 1;
    transform.offsetX = 0;
    transform.offsetY = 0;

    const world = transform.screenToWorld(10, 580);
    expect(world.x).toBe(10);
    expect(world.y).toBe(20);
  });

  test('roundtrip world->screen->world', () => {
    const transform = new ViewTransform(800, 600);
    transform.scale = 2;
    transform.offsetX = 10;
    transform.offsetY = 20;

    const original = { x: 100, y: 50 };
    const screen = transform.worldToScreen(original.x, original.y);
    const world = transform.screenToWorld(screen.x, screen.y);

    expect(world.x).toBeCloseTo(original.x);
    expect(world.y).toBeCloseTo(original.y);
  });

  test('fits bounds to view', () => {
    const transform = new ViewTransform(800, 600);
    const bounds = {
      minX: 0,
      minY: 0,
      maxX: 100,
      maxY: 100
    };

    transform.fitToView(bounds, 0.1);

    // Check that bounds fit on screen
    const tl = transform.worldToScreen(bounds.minX, bounds.minY);
    const br = transform.worldToScreen(bounds.maxX, bounds.maxY);

    expect(tl.x).toBeGreaterThan(0);
    expect(br.x).toBeLessThan(800);
  });

  test('fits wide bounds', () => {
    const transform = new ViewTransform(800, 600);
    const bounds = {
      minX: 0,
      minY: 0,
      maxX: 200,
      maxY: 50
    };

    transform.fitToView(bounds, 0.1);

    // Width should be limiting factor
    expect(transform.scale).toBeLessThan(4);
  });

  test('fits tall bounds', () => {
    const transform = new ViewTransform(800, 600);
    const bounds = {
      minX: 0,
      minY: 0,
      maxX: 50,
      maxY: 200
    };

    transform.fitToView(bounds, 0.1);

    // Height should be limiting factor
    expect(transform.scale).toBeLessThan(3);
  });

  test('handles degenerate bounds', () => {
    const transform = new ViewTransform(800, 600);
    const bounds = {
      minX: 10,
      minY: 10,
      maxX: 10,
      maxY: 10
    };

    transform.fitToView(bounds);

    expect(transform.scale).toBe(1);
    expect(transform.offsetX).toBe(0);
  });

  test('zooms in at center', () => {
    const transform = new ViewTransform(800, 600);
    const initialScale = transform.scale;

    transform.zoom(2);

    expect(transform.scale).toBe(initialScale * 2);
  });

  test('zooms out at center', () => {
    const transform = new ViewTransform(800, 600);
    transform.scale = 2;

    transform.zoom(0.5);

    expect(transform.scale).toBe(1);
  });

  test('zooms at specific point', () => {
    const transform = new ViewTransform(800, 600);
    transform.scale = 1;
    transform.offsetX = 0;
    transform.offsetY = 0;

    const zoomPoint = { x: 100, y: 100 };
    const worldBefore = transform.screenToWorld(zoomPoint.x, zoomPoint.y);

    transform.zoom(2, zoomPoint.x, zoomPoint.y);

    const worldAfter = transform.screenToWorld(zoomPoint.x, zoomPoint.y);

    // Point under cursor should stay the same
    expect(worldAfter.x).toBeCloseTo(worldBefore.x, 1);
    expect(worldAfter.y).toBeCloseTo(worldBefore.y, 1);
  });

  test('clamps zoom to limits', () => {
    const transform = new ViewTransform(800, 600);

    // Zoom in very far
    transform.zoom(100000);
    expect(transform.scale).toBeLessThanOrEqual(10000);

    // Zoom out very far
    transform.zoom(0.0000001);
    expect(transform.scale).toBeGreaterThanOrEqual(0.001);
  });

  test('pans view', () => {
    const transform = new ViewTransform(800, 600);
    const initialOffset = { x: transform.offsetX, y: transform.offsetY };

    transform.pan(50, 30);

    expect(transform.offsetX).not.toBe(initialOffset.x);
    expect(transform.offsetY).not.toBe(initialOffset.y);
  });

  test('pan moves content correctly', () => {
    const transform = new ViewTransform(800, 600);
    const worldPoint = { x: 100, y: 100 };

    const screenBefore = transform.worldToScreen(worldPoint.x, worldPoint.y);
    transform.pan(50, 0);
    const screenAfter = transform.worldToScreen(worldPoint.x, worldPoint.y);

    // Point should move to the right
    expect(screenAfter.x).toBeGreaterThan(screenBefore.x);
  });

  test('resets view', () => {
    const transform = new ViewTransform(800, 600);
    transform.scale = 5;
    transform.offsetX = 100;
    transform.offsetY = 200;

    transform.reset();

    expect(transform.scale).toBe(1.0);
    expect(transform.offsetX).toBe(0);
    expect(transform.offsetY).toBe(0);
  });

  test('gets and sets state', () => {
    const transform = new ViewTransform(800, 600);
    transform.scale = 3;
    transform.offsetX = 50;
    transform.offsetY = 100;

    const state = transform.getState();

    const newTransform = new ViewTransform(400, 300);
    newTransform.setState(state);

    expect(newTransform.scale).toBe(3);
    expect(newTransform.offsetX).toBe(50);
    expect(newTransform.offsetY).toBe(100);
    expect(newTransform.canvasWidth).toBe(800);
    expect(newTransform.canvasHeight).toBe(600);
  });

  test('gets visible bounds', () => {
    const transform = new ViewTransform(800, 600);
    transform.scale = 1;
    transform.offsetX = 0;
    transform.offsetY = 0;

    const bounds = transform.getVisibleBounds();

    expect(typeof bounds.minX).toBe('number');
    expect(typeof bounds.maxX).toBe('number');
    expect(bounds.maxX).toBeGreaterThan(bounds.minX);
    expect(bounds.maxY).toBeGreaterThan(bounds.minY);
  });

  test('transforms distances', () => {
    const transform = new ViewTransform(800, 600);
    transform.scale = 2;

    const worldDistance = 10;
    const screenDistance = transform.worldToScreenDistance(worldDistance);
    expect(screenDistance).toBe(20);

    const backToWorld = transform.screenToWorldDistance(screenDistance);
    expect(backToWorld).toBe(worldDistance);
  });

  test('sets canvas size', () => {
    const transform = new ViewTransform(800, 600);
    transform.setCanvasSize(1024, 768);

    expect(transform.canvasWidth).toBe(1024);
    expect(transform.canvasHeight).toBe(768);
  });

  test('handles negative coordinates', () => {
    const transform = new ViewTransform(800, 600);
    const screen = transform.worldToScreen(-50, -30);
    const world = transform.screenToWorld(screen.x, screen.y);

    expect(world.x).toBeCloseTo(-50);
    expect(world.y).toBeCloseTo(-30);
  });
});
