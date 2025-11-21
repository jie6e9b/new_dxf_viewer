# Архитектура DXF Viewer Library

## 🏛️ Общая структура

```
┌─────────────────────────────────────────────────────┐
│                  Public API Layer                    │
│              (DXFViewer, Events, Plugins)            │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────┐
│                  Feature Layer                       │
│  ┌──────────┬──────────┬──────────┬──────────────┐ │
│  │ Layers   │ Measure  │ Search   │ Export       │ │
│  │ Manager  │ Tools    │ Engine   │ Manager      │ │
│  └──────────┴──────────┴──────────┴──────────────┘ │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────┐
│                   Core Layer                         │
│  ┌──────────┬──────────┬──────────┬──────────────┐ │
│  │ DXF      │ Scene    │ Renderer │ Geometry     │ │
│  │ Parser   │ Manager  │ Engine   │ Math         │ │
│  └──────────┴──────────┴──────────┴──────────────┘ │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────┐
│                  Utils Layer                         │
│  ┌──────────┬──────────┬──────────┬──────────────┐ │
│  │ Cache    │ Events   │ Workers  │ Helpers      │ │
│  └──────────┴──────────┴──────────┴──────────────┘ │
└─────────────────────────────────────────────────────┘
```

## 📦 Модули

### Core Layer (Ядро)

#### 1. DXF Parser
**Назначение**: Парсинг DXF файлов в внутренний формат

**Структура**:
```
core/parser/
├── DXFParser.js           # Главный парсер
├── DXFReader.js           # Чтение и разбор строк DXF
├── SectionParser.js       # Парсинг секций
├── entities/              # Обработчики примитивов
│   ├── EntityFactory.js
│   ├── LineEntity.js
│   ├── PolylineEntity.js
│   ├── CircleEntity.js
│   ├── ArcEntity.js
│   ├── TextEntity.js
│   ├── MTextEntity.js
│   ├── HatchEntity.js
│   ├── DimensionEntity.js
│   └── InsertEntity.js
└── styles/                # Стили и настройки
    ├── LayerTable.js
    ├── TextStyleTable.js
    ├── DimStyleTable.js
    └── BlockTable.js
```

**Основные классы**:

```javascript
class DXFParser {
  parse(dxfContent: string): ParsedDXF
  parseAsync(dxfContent: string): Promise<ParsedDXF>
  parseStream(stream: ReadableStream): AsyncIterator<Entity>
}

class ParsedDXF {
  header: Header
  layers: Layer[]
  textStyles: TextStyle[]
  dimStyles: DimStyle[]
  blocks: Block[]
  entities: Entity[]
  bounds: BoundingBox
}
```

#### 2. Scene Manager
**Назначение**: Управление сценой и объектами

**Структура**:
```
core/scene/
├── Scene.js              # Главная сцена
├── SceneObject.js        # Базовый объект сцены
├── LayerManager.js       # Управление слоями
├── SelectionManager.js   # Выделение объектов
└── SpatialIndex.js       # Пространственный индекс (QuadTree)
```

**Основные классы**:

```javascript
class Scene {
  entities: Entity[]
  layers: LayerManager
  spatialIndex: QuadTree
  bounds: BoundingBox
  
  add(entity: Entity): void
  remove(entity: Entity): void
  clear(): void
  findAt(x: number, y: number, tolerance: number): Entity[]
  findInArea(bounds: BoundingBox): Entity[]
  update(): void
}

class LayerManager {
  layers: Map<string, Layer>
  
  get(name: string): Layer
  show(name: string): void
  hide(name: string): void
  isolate(name: string): void
  setOpacity(name: string, opacity: number): void
  filter(predicate: (layer: Layer) => boolean): Layer[]
}
```

#### 3. Renderer Engine
**Назначение**: Рендеринг графики на Canvas

**Структура**:
```
core/renderer/
├── CanvasRenderer.js     # Главный рендерер
├── ViewTransform.js      # Трансформации вида
├── RenderContext.js      # Контекст рендеринга
├── renderers/            # Рендереры примитивов
│   ├── LineRenderer.js
│   ├── PolylineRenderer.js
│   ├── CircleRenderer.js
│   ├── TextRenderer.js
│   ├── HatchRenderer.js
│   └── DimensionRenderer.js
├── patterns/             # Паттерны заливок
│   ├── PatternFactory.js
│   ├── SolidPattern.js
│   ├── ANSI31Pattern.js
│   └── ConcretePattern.js
└── fonts/                # Управление шрифтами
    ├── FontManager.js
    └── FontMapper.js     # SHX -> Web fonts
```

**Основные классы**:

```javascript
class CanvasRenderer {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  transform: ViewTransform
  
  render(scene: Scene): void
  renderEntity(entity: Entity): void
  clear(): void
  setQuality(quality: 'low' | 'medium' | 'high'): void
}

class ViewTransform {
  scale: number
  offsetX: number
  offsetY: number
  rotation: number
  
  worldToScreen(x: number, y: number): Point
  screenToWorld(x: number, y: number): Point
  zoom(factor: number, centerX?: number, centerY?: number): void
  pan(dx: number, dy: number): void
  fitToRect(bounds: BoundingBox): void
}
```

#### 4. Geometry Math
**Назначение**: Геометрические вычисления

**Структура**:
```
core/geometry/
├── Vector2D.js           # 2D векторы
├── Matrix2D.js           # 2D трансформации
├── BoundingBox.js        # Ограничивающие прямоугольники
├── Intersection.js       # Пересечения
├── Distance.js           # Расстояния
└── Area.js               # Площади
```

**Основные классы**:

```javascript
class Vector2D {
  x: number
  y: number
  
  add(v: Vector2D): Vector2D
  subtract(v: Vector2D): Vector2D
  multiply(scalar: number): Vector2D
  length(): number
  normalize(): Vector2D
  dot(v: Vector2D): number
  cross(v: Vector2D): number
  angle(): number
  rotate(angle: number): Vector2D
}

class BoundingBox {
  min: Vector2D
  max: Vector2D
  
  contains(point: Vector2D): boolean
  intersects(box: BoundingBox): boolean
  expand(box: BoundingBox): void
  center(): Vector2D
  width(): number
  height(): number
}
```

### Feature Layer (Функции)

#### 1. Layers Feature
**Назначение**: Расширенное управление слоями

```javascript
class LayersFeature {
  panel: LayerPanel
  filters: LayerFilters
  
  createPanel(): HTMLElement
  applyFilter(filter: string): void
  savePreset(name: string): void
  loadPreset(name: string): void
}
```

#### 2. Measurement Tools
**Назначение**: Инструменты измерений

```javascript
class MeasurementTools {
  activeTool: Tool | null
  measurements: Measurement[]
  
  activateDistance(): void
  activateArea(): void
  activateAngle(): void
  clear(): void
  export(): MeasurementData[]
}

class DistanceMeasurement {
  start: Point
  end: Point
  
  calculate(): number
  render(ctx: CanvasRenderingContext2D): void
}
```

#### 3. Search Engine
**Назначение**: Поиск по чертежу

```javascript
class SearchEngine {
  index: SearchIndex
  
  indexDocument(scene: Scene): void
  search(query: string, options?: SearchOptions): SearchResult[]
  searchByRegex(pattern: RegExp): SearchResult[]
  highlight(result: SearchResult): void
}
```

#### 4. Export Manager
**Назначение**: Экспорт в различные форматы

```javascript
class ExportManager {
  toPNG(options?: PNGOptions): Promise<Blob>
  toJPG(options?: JPGOptions): Promise<Blob>
  toSVG(options?: SVGOptions): Promise<string>
  toJSON(): string
  toCSV(dataType: 'texts' | 'layers' | 'measurements'): string
}
```

#### 5. Reinforcement Feature
**Назначение**: Специализированные функции для армирования

```javascript
class ReinforcementFeature {
  detector: RebarDetector
  analyzer: RebarAnalyzer
  
  detectRebars(): Rebar[]
  analyzeSpacing(): SpacingData
  buildEnvelope(): Envelope
  extractSpecification(): Specification
}
```

### Utils Layer (Утилиты)

#### 1. Cache System

```javascript
class Cache {
  private storage: Map
  maxSize: number
  
  get(key: string): any
  set(key: string, value: any): void
  has(key: string): boolean
  clear(): void
  evict(): void  // LRU eviction
}
```

#### 2. Event System

```javascript
class EventEmitter {
  private listeners: Map
  
  on(event: string, handler: Function): void
  off(event: string, handler: Function): void
  once(event: string, handler: Function): void
  emit(event: string, data: any): void
}
```

#### 3. Web Workers

```javascript
class WorkerPool {
  workers: Worker[]
  queue: Task[]
  
  execute(task: Task): Promise<any>
  terminate(): void
}
```

## 🔄 Поток данных

```
User Action
    │
    ↓
┌─────────────┐
│ Public API  │
└──────┬──────┘
       │
       ↓
┌─────────────┐      ┌──────────┐
│  Features   │ ←──→ │  Scene   │
└──────┬──────┘      └────┬─────┘
       │                  │
       ↓                  ↓
┌─────────────┐      ┌──────────┐
│  Renderer   │ ←──→ │ Entities │
└─────────────┘      └──────────┘
```

### Пример потока: Загрузка файла

```
1. user.loadFile('file.dxf')
2. DXFParser.parse(content)
3. EntityFactory.create(primitives)
4. Scene.add(entities)
5. SpatialIndex.build(entities)
6. Renderer.render(scene)
7. Events.emit('fileLoaded')
```

### Пример потока: Поиск текста

```
1. user.search('⌀12')
2. SearchEngine.search(query)
3. Scene.filter(predicate)
4. Results → UI
5. user.click(result)
6. Renderer.highlight(entity)
7. ViewTransform.zoomTo(entity.bounds)
```

## 🎨 Стратегия рендеринга

### Level of Detail (LOD)

```javascript
function getLOD(scale) {
  if (scale < 0.1) return 'LOW';
  if (scale < 0.5) return 'MEDIUM';
  return 'HIGH';
}

// LOW: упрощенные объекты, без текста
// MEDIUM: базовый рендеринг
// HIGH: полный рендеринг с деталями
```

### Culling (отсечение)

```javascript
class Viewport {
  getVisibleEntities() {
    const bounds = this.getVisibleBounds();
    return scene.spatialIndex.query(bounds);
  }
}
```

### Кэширование

```javascript
class RenderCache {
  // Кэш для паттернов
  patterns: Map<string, CanvasPattern>
  
  // Кэш для отрендеренных объектов
  offscreenCanvas: Map<string, OffscreenCanvas>
  
  // Инвалидация при изменении
  invalidate(entityId: string): void
}
```

## 🔌 Расширяемость

### Plugin System

```javascript
class PluginManager {
  plugins: Map<string, Plugin>
  
  register(plugin: Plugin): void
  unregister(name: string): void
  get(name: string): Plugin
}

interface Plugin {
  name: string
  version: string
  
  install(viewer: DXFViewer): void
  uninstall(): void
}

// Пример плагина
class GridPlugin implements Plugin {
  name = 'grid'
  
  install(viewer) {
    viewer.on('render', this.renderGrid);
  }
  
  renderGrid(ctx) {
    // Рисуем сетку
  }
}
```

## 📊 Управление памятью

### Стратегии оптимизации

1. **Object Pooling** для часто создаваемых объектов
```javascript
class PointPool {
  pool: Point[] = []
  
  acquire(): Point {
    return this.pool.pop() || new Point();
  }
  
  release(point: Point): void {
    this.pool.push(point);
  }
}
```

2. **Lazy Loading** для больших файлов
```javascript
class LazyScene {
  loadedChunks: Set<string>
  
  loadChunk(bounds: BoundingBox): void {
    // Загружаем только нужную часть
  }
}
```

3. **Progressive Rendering**
```javascript
class ProgressiveRenderer {
  renderPass(entities: Entity[], maxTime: number): void {
    const start = Date.now();
    for (const entity of entities) {
      if (Date.now() - start > maxTime) break;
      entity.render();
    }
  }
}
```

## 🧪 Тестирование

### Структура тестов

```
tests/
├── unit/
│   ├── parser/
│   ├── renderer/
│   ├── geometry/
│   └── features/
├── integration/
│   ├── load-file.test.js
│   ├── render-scene.test.js
│   └── export.test.js
├── performance/
│   ├── large-files.test.js
│   └── rendering.bench.js
└── fixtures/
    └── test-drawings/
```

### Примеры тестов

```javascript
describe('DXFParser', () => {
  test('parses simple line', () => {
    const dxf = `0\nLINE\n10\n0\n20\n0\n11\n100\n21\n100`;
    const result = parser.parse(dxf);
    expect(result.entities).toHaveLength(1);
    expect(result.entities[0].type).toBe('LINE');
  });
});

describe('ViewTransform', () => {
  test('zooms to center', () => {
    const transform = new ViewTransform();
    transform.zoom(2, 100, 100);
    expect(transform.scale).toBe(2);
  });
});
```

## 🚀 Сборка и деплой

### Конфигурация сборки

```javascript
// rollup.config.js
export default {
  input: 'src/index.js',
  output: [
    {
      file: 'dist/dxf-viewer.js',
      format: 'umd',
      name: 'DXFViewer'
    },
    {
      file: 'dist/dxf-viewer.esm.js',
      format: 'esm'
    }
  ],
  plugins: [
    resolve(),
    commonjs(),
    babel(),
    terser()
  ]
};
```

### Минимальная сборка

```javascript
// Только парсер + рендерер
import { DXFParser, CanvasRenderer } from 'dxf-viewer/core';

// Полная сборка
import DXFViewer from 'dxf-viewer';
```

## 📈 Метрики производительности

### Целевые показатели

- **Парсинг**: 1 MB/sec
- **Рендеринг**: 60 FPS для 10k объектов
- **Поиск**: < 100ms для 5k текстов
- **Экспорт PNG**: < 2 sec для чертежа 2000x2000px
- **Память**: < 50MB для файла 5MB

### Мониторинг

```javascript
class PerformanceMonitor {
  measure(name: string, fn: Function): any {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    console.log(`${name}: ${duration}ms`);
    return result;
  }
}
```

## 🔐 Безопасность

### Валидация входных данных

```javascript
class DXFValidator {
  validate(content: string): ValidationResult {
    // Проверка размера
    if (content.length > MAX_SIZE) {
      return { valid: false, error: 'File too large' };
    }
    
    // Проверка формата
    if (!this.isDXF(content)) {
      return { valid: false, error: 'Invalid DXF format' };
    }
    
    return { valid: true };
  }
}
```

### Sanitization

```javascript
// Очистка текста от потенциально опасных символов
function sanitizeText(text: string): string {
  return text
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '');
}
```
