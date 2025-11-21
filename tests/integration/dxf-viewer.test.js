import DXFViewer from '../../src/DXFViewer';

// Mock canvas and context
class MockCanvasRenderingContext2D {
  constructor() {
    this.fillStyle = '';
    this.strokeStyle = '';
    this.lineWidth = 1;
    this.lineDashPattern = [];
    this.imageSmoothingEnabled = true;
    this.imageSmoothingQuality = 'high';
    this.transformMatrix = [1, 0, 0, 1, 0, 0];
  }

  scale(x, y) {}
  translate(x, y) {}
  rotate(angle) {}
  setTransform(a, b, c, d, e, f) {
    this.transformMatrix = [a, b, c, d, e, f];
  }
  save() {}
  restore() {}
  beginPath() {}
  moveTo(x, y) {}
  lineTo(x, y) {}
  arc(x, y, radius, startAngle, endAngle) {}
  closePath() {}
  stroke() {}
  fill() {}
  fillRect(x, y, width, height) {}
  fillText(text, x, y) {}
  setLineDash(pattern) {
    this.lineDashPattern = pattern;
  }
}

class MockCanvas {
  constructor() {
    this.width = 800;
    this.height = 600;
    this.clientWidth = 800;
    this.clientHeight = 600;
    this.ctx = new MockCanvasRenderingContext2D();
  }

  getContext(type) {
    if (type === '2d') {
      return this.ctx;
    }
    return null;
  }

  toDataURL(format) {
    return `data:${format};base64,mock`;
  }

  toBlob(callback, format) {
    callback(new Blob(['mock'], { type: format }));
  }
}

describe('DXFViewer Integration Tests', () => {
  let canvas;

  beforeEach(() => {
    canvas = new MockCanvas();
    global.window = {
      devicePixelRatio: 1
    };
    global.document = {
      createElement: (tag) => {
        if (tag === 'canvas') {
          return new MockCanvas();
        }
        return {};
      },
      querySelector: () => canvas,
      body: {
        appendChild: () => {}
      }
    };
  });

  afterEach(() => {
    delete global.window;
    delete global.document;
  });

  test('creates viewer instance', () => {
    const viewer = new DXFViewer({ container: canvas });
    expect(viewer).toBeDefined();
    expect(viewer.canvas).toBe(canvas);
    expect(viewer.loaded).toBe(false);
  });

  test('loads simple DXF file', async () => {
    const dxf = `0
SECTION
2
HEADER
9
$ACADVER
1
AC1015
0
ENDSEC
0
SECTION
2
ENTITIES
0
LINE
8
0
10
0
20
0
11
100
21
100
0
ENDSEC
0
EOF`;

    const viewer = new DXFViewer({ container: canvas });
    await viewer.loadString(dxf);

    expect(viewer.loaded).toBe(true);
    expect(viewer.sceneManager.getEntityCount()).toBe(1);
  });

  test('parses multiple entities', async () => {
    const dxf = `0
SECTION
2
ENTITIES
0
LINE
10
0
20
0
11
100
21
100
0
LINE
10
50
20
50
11
150
21
150
0
ENDSEC
0
EOF`;

    const viewer = new DXFViewer({ container: canvas });
    await viewer.loadString(dxf);

    expect(viewer.sceneManager.getEntityCount()).toBe(2);
    const entities = viewer.sceneManager.getEntities();
    expect(entities[0].type).toBe('LINE');
    expect(entities[1].type).toBe('LINE');
  });

  test('parses layers', async () => {
    const dxf = `0
SECTION
2
TABLES
0
TABLE
2
LAYER
0
LAYER
2
Layer1
62
1
0
LAYER
2
Layer2
62
3
0
ENDTAB
0
ENDSEC
0
SECTION
2
ENTITIES
0
LINE
8
Layer1
10
0
20
0
11
100
21
100
0
ENDSEC
0
EOF`;

    const viewer = new DXFViewer({ container: canvas });
    await viewer.loadString(dxf);

    const layerNames = viewer.getLayerNames();
    expect(layerNames).toContain('Layer1');
    expect(layerNames).toContain('Layer2');
  });

  test('calculates scene bounds', async () => {
    const dxf = `0
SECTION
2
ENTITIES
0
LINE
10
0
20
0
11
100
21
50
0
LINE
10
-50
20
-25
11
150
21
75
0
ENDSEC
0
EOF`;

    const viewer = new DXFViewer({ container: canvas });
    await viewer.loadString(dxf);

    const stats = viewer.getStats();
    expect(stats.bounds.minX).toBe(-50);
    expect(stats.bounds.minY).toBe(-25);
    expect(stats.bounds.maxX).toBe(150);
    expect(stats.bounds.maxY).toBe(75);
  });

  test('renders without errors', async () => {
    const dxf = `0
SECTION
2
ENTITIES
0
LINE
10
0
20
0
11
100
21
100
0
ENDSEC
0
EOF`;

    const viewer = new DXFViewer({ container: canvas });
    await viewer.loadString(dxf);

    expect(() => viewer.render()).not.toThrow();
  });

  test('fits view to bounds', async () => {
    const dxf = `0
SECTION
2
ENTITIES
0
LINE
10
0
20
0
11
100
21
100
0
ENDSEC
0
EOF`;

    const viewer = new DXFViewer({ container: canvas, autoFit: false });
    await viewer.loadString(dxf);

    const initialScale = viewer.canvasRenderer.transform.scale;
    viewer.fitToView();
    const newScale = viewer.canvasRenderer.transform.scale;

    expect(newScale).not.toBe(initialScale);
  });

  test('zooms in and out', async () => {
    const viewer = new DXFViewer({ container: canvas });
    const initialScale = viewer.canvasRenderer.transform.scale;

    viewer.zoomIn(2);
    expect(viewer.canvasRenderer.transform.scale).toBeGreaterThan(initialScale);

    viewer.zoomOut(2);
    expect(viewer.canvasRenderer.transform.scale).toBeCloseTo(initialScale, 5);
  });

  test('pans view', async () => {
    const viewer = new DXFViewer({ container: canvas });
    const initialOffset = {
      x: viewer.canvasRenderer.transform.offsetX,
      y: viewer.canvasRenderer.transform.offsetY
    };

    viewer.pan(50, 30);

    expect(viewer.canvasRenderer.transform.offsetX).not.toBe(initialOffset.x);
    expect(viewer.canvasRenderer.transform.offsetY).not.toBe(initialOffset.y);
  });

  test('toggles layer visibility', async () => {
    const dxf = `0
SECTION
2
TABLES
0
TABLE
2
LAYER
0
LAYER
2
TestLayer
62
1
0
ENDTAB
0
ENDSEC
0
SECTION
2
ENTITIES
0
LINE
8
TestLayer
10
0
20
0
11
100
21
100
0
ENDSEC
0
EOF`;

    const viewer = new DXFViewer({ container: canvas });
    await viewer.loadString(dxf);

    viewer.setLayerVisibility('TestLayer', false);
    const layer = viewer.tableManager.getLayer('TestLayer');
    expect(layer.visible).toBe(false);

    viewer.setLayerVisibility('TestLayer', true);
    expect(layer.visible).toBe(true);
  });

  test('gets statistics', async () => {
    const dxf = `0
SECTION
2
ENTITIES
0
LINE
8
Layer1
10
0
20
0
11
100
21
100
0
LINE
8
Layer1
10
50
20
50
11
150
21
150
0
ENDSEC
0
EOF`;

    const viewer = new DXFViewer({ container: canvas });
    await viewer.loadString(dxf);

    const stats = viewer.getStats();
    expect(stats.entities.total).toBe(2);
    expect(stats.entities.byType.LINE).toBe(2);
    expect(stats.entities.byLayer.Layer1).toBe(2);
  });

  test('exports to data URL', async () => {
    const viewer = new DXFViewer({ container: canvas });
    const dataURL = viewer.toDataURL('image/png');
    expect(dataURL).toContain('data:image/png');
  });

  test('exports to blob', async () => {
    const viewer = new DXFViewer({ container: canvas });
    const blob = await viewer.toBlob('image/png');
    expect(blob).toBeInstanceOf(Blob);
  });

  test('clears scene', async () => {
    const dxf = `0
SECTION
2
ENTITIES
0
LINE
10
0
20
0
11
100
21
100
0
ENDSEC
0
EOF`;

    const viewer = new DXFViewer({ container: canvas });
    await viewer.loadString(dxf);

    expect(viewer.sceneManager.getEntityCount()).toBe(1);

    viewer.clear();
    expect(viewer.sceneManager.getEntityCount()).toBe(0);
    expect(viewer.loaded).toBe(false);
  });

  test('resizes canvas', async () => {
    const viewer = new DXFViewer({ container: canvas });

    viewer.resize(1024, 768);
    expect(viewer.canvasRenderer.transform.canvasWidth).toBe(1024);
    expect(viewer.canvasRenderer.transform.canvasHeight).toBe(768);
  });

  test('handles empty DXF file', async () => {
    const dxf = `0
SECTION
2
ENTITIES
0
ENDSEC
0
EOF`;

    const viewer = new DXFViewer({ container: canvas });
    await viewer.loadString(dxf);

    expect(viewer.sceneManager.getEntityCount()).toBe(0);
  });

  test('handles DXF with unknown entities', async () => {
    const dxf = `0
SECTION
2
ENTITIES
0
UNKNOWN_TYPE
10
0
20
0
0
LINE
10
0
20
0
11
100
21
100
0
ENDSEC
0
EOF`;

    const originalWarn = console.warn;
    console.warn = jest.fn();

    const viewer = new DXFViewer({ container: canvas });
    await viewer.loadString(dxf);

    // Should skip unknown entity but load LINE
    expect(viewer.sceneManager.getEntityCount()).toBe(1);
    expect(viewer.sceneManager.getEntities()[0].type).toBe('LINE');

    console.warn = originalWarn;
  });

  test('auto-fits on load by default', async () => {
    const dxf = `0
SECTION
2
ENTITIES
0
LINE
10
0
20
0
11
100
21
100
0
ENDSEC
0
EOF`;

    const viewer = new DXFViewer({ container: canvas });
    const initialScale = viewer.canvasRenderer.transform.scale;

    await viewer.loadString(dxf);

    // Scale should have changed due to auto-fit
    expect(viewer.canvasRenderer.transform.scale).not.toBe(initialScale);
  });

  test('does not auto-fit when disabled', async () => {
    const dxf = `0
SECTION
2
ENTITIES
0
LINE
10
0
20
0
11
100
21
100
0
ENDSEC
0
EOF`;

    const viewer = new DXFViewer({ container: canvas, autoFit: false });
    const initialScale = viewer.canvasRenderer.transform.scale;

    await viewer.loadString(dxf);

    // Scale should not change
    expect(viewer.canvasRenderer.transform.scale).toBe(initialScale);
  });
});
