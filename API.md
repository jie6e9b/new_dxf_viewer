# API Reference

Полное описание публичного API библиотеки DXF Viewer.

## 📋 Содержание

- [DXFViewer](#dxfviewer) - Главный класс
- [Scene](#scene) - Управление сценой
- [Layers](#layers) - Работа со слоями
- [Measurements](#measurements) - Измерения
- [Search](#search) - Поиск
- [Export](#export) - Экспорт
- [Events](#events) - События
- [Plugins](#plugins) - Плагины

---

## DXFViewer

Главный класс библиотеки. Точка входа для всех операций.

### Конструктор

```javascript
const viewer = new DXFViewer(options);
```

#### Options

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|--------------|----------|
| `container` | `string \| HTMLElement` | required | Контейнер для viewer |
| `width` | `number` | `800` | Ширина canvas |
| `height` | `number` | `600` | Высота canvas |
| `backgroundColor` | `string` | `'#ffffff'` | Цвет фона |
| `enableGrid` | `boolean` | `false` | Показать сетку |
| `enableMeasurements` | `boolean` | `true` | Включить измерения |
| `enableSearch` | `boolean` | `true` | Включить поиск |
| `autoFit` | `boolean` | `true` | Авто-масштабирование при загрузке |
| `minZoom` | `number` | `0.01` | Минимальный zoom |
| `maxZoom` | `number` | `100` | Максимальный zoom |
| `quality` | `'low' \| 'medium' \| 'high'` | `'high'` | Качество рендеринга |

#### Пример

```javascript
const viewer = new DXFViewer({
  container: '#viewer-container',
  width: 1200,
  height: 800,
  backgroundColor: '#f5f5f5',
  enableGrid: true,
  autoFit: true
});
```

### Методы загрузки

#### loadFile()

Загрузка DXF файла из URL.

```javascript
viewer.loadFile(url: string): Promise<void>
```

**Параметры:**
- `url` (string) - URL файла

**Возвращает:** Promise

**Пример:**
```javascript
await viewer.loadFile('/drawings/plan.dxf');
```

#### loadBlob()

Загрузка из Blob (например, из input[type=file]).

```javascript
viewer.loadBlob(blob: Blob): Promise<void>
```

**Пример:**
```javascript
const input = document.getElementById('file-input');
const file = input.files[0];
await viewer.loadBlob(file);
```

#### loadString()

Загрузка из строки DXF.

```javascript
viewer.loadString(dxfContent: string): Promise<void>
```

**Пример:**
```javascript
const dxfString = '0\nSECTION\n...';
await viewer.loadString(dxfString);
```

### Методы навигации

#### fitToScreen()

Масштабировать весь чертеж по размеру экрана.

```javascript
viewer.fitToScreen(padding?: number): void
```

**Параметры:**
- `padding` (number, optional) - Отступ в пикселях (default: 20)

**Пример:**
```javascript
viewer.fitToScreen(50);
```

#### zoom()

Изменить масштаб.

```javascript
viewer.zoom(factor: number, centerX?: number, centerY?: number): void
```

**Параметры:**
- `factor` (number) - Множитель масштаба (>1 приближение, <1 отдаление)
- `centerX` (number, optional) - X координата центра масштабирования
- `centerY` (number, optional) - Y координата центра масштабирования

**Пример:**
```javascript
// Увеличить в 2 раза
viewer.zoom(2);

// Увеличить относительно точки
viewer.zoom(1.5, 400, 300);
```

#### zoomIn() / zoomOut()

Быстрое масштабирование.

```javascript
viewer.zoomIn(): void
viewer.zoomOut(): void
```

**Пример:**
```javascript
viewer.zoomIn();  // Увеличить на 20%
viewer.zoomOut(); // Уменьшить на 20%
```

#### pan()

Панорамирование вида.

```javascript
viewer.pan(dx: number, dy: number): void
```

**Параметры:**
- `dx` (number) - Смещение по X (в пикселях экрана)
- `dy` (number) - Смещение по Y (в пикселях экрана)

**Пример:**
```javascript
viewer.pan(100, 50);
```

#### zoomToEntity()

Масштабировать к конкретному объекту.

```javascript
viewer.zoomToEntity(entity: Entity, padding?: number): void
```

**Пример:**
```javascript
const entity = viewer.scene.findAt(100, 100)[0];
viewer.zoomToEntity(entity, 30);
```

#### zoomToArea()

Масштабировать к области.

```javascript
viewer.zoomToArea(bounds: BoundingBox): void
```

**Пример:**
```javascript
viewer.zoomToArea({
  min: { x: 0, y: 0 },
  max: { x: 1000, y: 1000 }
});
```

#### resetView()

Сброс вида к начальному состоянию.

```javascript
viewer.resetView(): void
```

### Методы управления

#### clear()

Очистить сцену.

```javascript
viewer.clear(): void
```

#### destroy()

Уничтожить viewer и освободить ресурсы.

```javascript
viewer.destroy(): void
```

**Пример:**
```javascript
// Cleanup при размонтировании компонента
viewer.destroy();
```

#### setQuality()

Изменить качество рендеринга.

```javascript
viewer.setQuality(quality: 'low' | 'medium' | 'high'): void
```

**Пример:**
```javascript
// Понизить качество для производительности
viewer.setQuality('low');
```

#### setBackgroundColor()

Изменить цвет фона.

```javascript
viewer.setBackgroundColor(color: string): void
```

**Пример:**
```javascript
viewer.setBackgroundColor('#1a1a1a');
```

### Свойства

#### scene

Доступ к объекту сцены.

```javascript
viewer.scene: Scene
```

#### layers

Управление слоями.

```javascript
viewer.layers: LayerManager
```

#### measurements

Инструменты измерений.

```javascript
viewer.measurements: MeasurementTools
```

#### search

Поиск по чертежу.

```javascript
viewer.search: SearchEngine
```

#### export

Экспорт в различные форматы.

```javascript
viewer.export: ExportManager
```

#### viewport

Информация о видимой области.

```javascript
viewer.viewport: {
  width: number,
  height: number,
  scale: number,
  bounds: BoundingBox
}
```

---

## Scene

Управление сценой и объектами.

### Свойства

```javascript
viewer.scene.entities: Entity[]        // Все объекты
viewer.scene.bounds: BoundingBox       // Границы чертежа
viewer.scene.entityCount: number       // Количество объектов
```

### Методы

#### findAt()

Найти объекты в точке.

```javascript
scene.findAt(x: number, y: number, tolerance?: number): Entity[]
```

**Параметры:**
- `x`, `y` (number) - Координаты в мировой системе
- `tolerance` (number, optional) - Радиус поиска (default: 5)

**Пример:**
```javascript
const entities = viewer.scene.findAt(1250, 3400, 10);
console.log('Found entities:', entities.length);
```

#### findInArea()

Найти объекты в области.

```javascript
scene.findInArea(bounds: BoundingBox): Entity[]
```

**Пример:**
```javascript
const entities = viewer.scene.findInArea({
  min: { x: 0, y: 0 },
  max: { x: 1000, y: 1000 }
});
```

#### findByType()

Найти объекты по типу.

```javascript
scene.findByType(type: string): Entity[]
```

**Пример:**
```javascript
const allLines = viewer.scene.findByType('LINE');
const allTexts = viewer.scene.findByType('TEXT');
```

#### getStatistics()

Получить статистику по сцене.

```javascript
scene.getStatistics(): {
  totalEntities: number,
  byType: Record<string, number>,
  byLayer: Record<string, number>,
  bounds: BoundingBox
}
```

**Пример:**
```javascript
const stats = viewer.scene.getStatistics();
console.log('Lines:', stats.byType.LINE);
console.log('Texts:', stats.byType.TEXT);
```

---

## Layers

Управление слоями чертежа.

### Свойства

```javascript
viewer.layers.all: Layer[]              // Все слои
viewer.layers.visible: Layer[]          // Видимые слои
viewer.layers.count: number             // Количество слоев
```

### Методы

#### get()

Получить слой по имени.

```javascript
layers.get(name: string): Layer | null
```

**Пример:**
```javascript
const layer = viewer.layers.get('AR-REBAR');
if (layer) {
  console.log('Layer color:', layer.color);
}
```

#### show() / hide()

Показать/скрыть слой.

```javascript
layers.show(name: string): void
layers.hide(name: string): void
```

**Пример:**
```javascript
viewer.layers.hide('AR-OLD');
viewer.layers.show('AR-NEW');
```

#### showAll() / hideAll()

Показать/скрыть все слои.

```javascript
layers.showAll(): void
layers.hideAll(): void
```

#### isolate()

Изолировать слой (показать только его).

```javascript
layers.isolate(name: string): void
```

**Пример:**
```javascript
viewer.layers.isolate('AR-REBAR');
```

#### setOpacity()

Установить прозрачность слоя.

```javascript
layers.setOpacity(name: string, opacity: number): void
```

**Параметры:**
- `opacity` (number) - Прозрачность 0-1

**Пример:**
```javascript
viewer.layers.setOpacity('AR-OLD', 0.3);
```

#### filter()

Фильтровать слои по условию.

```javascript
layers.filter(predicate: (layer: Layer) => boolean): Layer[]
```

**Пример:**
```javascript
// Найти все слои с армированием
const rebarLayers = viewer.layers.filter(layer => 
  layer.name.startsWith('AR-')
);

// Показать только их
rebarLayers.forEach(layer => viewer.layers.show(layer.name));
```

#### savePreset()

Сохранить состояние слоев как пресет.

```javascript
layers.savePreset(name: string): void
```

**Пример:**
```javascript
viewer.layers.savePreset('only-rebars');
```

#### loadPreset()

Загрузить пресет.

```javascript
layers.loadPreset(name: string): boolean
```

**Пример:**
```javascript
if (viewer.layers.loadPreset('only-rebars')) {
  console.log('Preset loaded');
}
```

### Layer Object

```typescript
interface Layer {
  name: string
  color: string
  visible: boolean
  opacity: number
  entityCount: number
  frozen: boolean
  locked: boolean
}
```

---

## Measurements

Инструменты измерений.

### Методы

#### activateDistance()

Активировать инструмент измерения расстояний.

```javascript
measurements.activateDistance(): void
```

**События:**
- `measurementStart` - Начало измерения
- `measurementComplete` - Завершение измерения

**Пример:**
```javascript
viewer.measurements.activateDistance();

viewer.on('measurementComplete', (data) => {
  console.log('Distance:', data.distance, 'mm');
});
```

#### activateArea()

Активировать измерение площади.

```javascript
measurements.activateArea(): void
```

**Пример:**
```javascript
viewer.measurements.activateArea();

viewer.on('measurementComplete', (data) => {
  console.log('Area:', data.area, 'm²');
});
```

#### activateAngle()

Активировать измерение углов.

```javascript
measurements.activateAngle(): void
```

#### deactivate()

Отключить активный инструмент.

```javascript
measurements.deactivate(): void
```

#### clear()

Удалить все измерения.

```javascript
measurements.clear(): void
```

#### remove()

Удалить конкретное измерение.

```javascript
measurements.remove(id: string): void
```

#### getAll()

Получить все измерения.

```javascript
measurements.getAll(): Measurement[]
```

**Пример:**
```javascript
const allMeasurements = viewer.measurements.getAll();
allMeasurements.forEach(m => {
  console.log(`${m.type}: ${m.value} ${m.unit}`);
});
```

#### setUnits()

Установить единицы измерения.

```javascript
measurements.setUnits(unit: 'mm' | 'cm' | 'm'): void
```

**Пример:**
```javascript
viewer.measurements.setUnits('m');
```

### Measurement Object

```typescript
interface Measurement {
  id: string
  type: 'distance' | 'area' | 'angle'
  value: number
  unit: string
  points: Point[]
  visible: boolean
}
```

---

## Search

Поиск по чертежу.

### Методы

#### find()

Поиск текста.

```javascript
search.find(query: string, options?: SearchOptions): SearchResult[]
```

**Options:**
```typescript
interface SearchOptions {
  caseSensitive?: boolean      // Учитывать регистр
  regex?: boolean              // Использовать регулярные выражения
  layers?: string[]            // Искать только в этих слоях
  types?: string[]             // Типы объектов (TEXT, MTEXT, DIMENSION)
  limit?: number               // Максимум результатов
}
```

**Пример:**
```javascript
// Простой поиск
const results = viewer.search.find('⌀12А400');

// С опциями
const results = viewer.search.find('⌀\\d+', {
  regex: true,
  layers: ['AR-REBAR'],
  limit: 50
});

console.log(`Found ${results.length} results`);
```

#### findNext() / findPrevious()

Навигация по результатам.

```javascript
search.findNext(): SearchResult | null
search.findPrevious(): SearchResult | null
```

**Пример:**
```javascript
viewer.search.find('B25');
const firstResult = viewer.search.findNext();
viewer.zoomToEntity(firstResult.entity);
```

#### clear()

Очистить результаты поиска.

```javascript
search.clear(): void
```

#### highlight()

Подсветить результат.

```javascript
search.highlight(result: SearchResult): void
```

#### exportResults()

Экспортировать результаты поиска.

```javascript
search.exportResults(format: 'csv' | 'json'): string
```

**Пример:**
```javascript
const results = viewer.search.find('⌀');
const csv = viewer.search.exportResults('csv');
// Скачать CSV
```

### SearchResult Object

```typescript
interface SearchResult {
  entity: Entity
  text: string
  layer: string
  position: Point
  bounds: BoundingBox
  match: {
    start: number
    end: number
    value: string
  }
}
```

---

## Export

Экспорт в различные форматы.

### Методы

#### toPNG()

Экспорт в PNG.

```javascript
export.toPNG(options?: PNGOptions): Promise<Blob>
```

**Options:**
```typescript
interface PNGOptions {
  width?: number              // Ширина (default: текущая)
  height?: number             // Высота (default: текущая)
  dpi?: number                // DPI (72, 150, 300)
  background?: string         // Цвет фона или 'transparent'
  area?: 'current' | 'all'    // Текущий вид или весь чертеж
  quality?: number            // 0-1
}
```

**Пример:**
```javascript
const blob = await viewer.export.toPNG({
  dpi: 300,
  background: 'white',
  area: 'all'
});

// Скачать
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'drawing.png';
a.click();
```

#### toJPG()

Экспорт в JPG.

```javascript
export.toJPG(options?: JPGOptions): Promise<Blob>
```

**Пример:**
```javascript
const blob = await viewer.export.toJPG({
  quality: 0.9,
  dpi: 150
});
```

#### toSVG()

Экспорт в SVG.

```javascript
export.toSVG(options?: SVGOptions): Promise<string>
```

**Options:**
```typescript
interface SVGOptions {
  embedFonts?: boolean        // Встроить шрифты
  textAsPath?: boolean        // Текст как контуры
  precision?: number          // Точность координат
}
```

**Пример:**
```javascript
const svg = await viewer.export.toSVG({
  embedFonts: true,
  precision: 2
});

// Сохранить как файл
const blob = new Blob([svg], { type: 'image/svg+xml' });
```

#### toJSON()

Экспорт данных в JSON.

```javascript
export.toJSON(): string
```

**Пример:**
```javascript
const json = viewer.export.toJSON();
const data = JSON.parse(json);
console.log('Entities:', data.entities.length);
```

#### toCSV()

Экспорт данных в CSV.

```javascript
export.toCSV(dataType: 'texts' | 'layers' | 'measurements' | 'all'): string
```

**Пример:**
```javascript
// Экспорт всех текстов
const csv = viewer.export.toCSV('texts');

// CSV формат:
// Text,Layer,X,Y,Height
// "⌀12А400","AR-REBAR",1250.5,3400.2,2.5
```

---

## Events

Система событий для реакции на действия пользователя и изменения состояния.

### Методы

#### on()

Подписаться на событие.

```javascript
viewer.on(event: string, handler: Function): void
```

#### off()

Отписаться от события.

```javascript
viewer.off(event: string, handler: Function): void
```

#### once()

Подписаться на событие (одноразово).

```javascript
viewer.once(event: string, handler: Function): void
```

### События

#### Загрузка файлов

```javascript
// Начало загрузки
viewer.on('fileLoadStart', (filename) => {
  console.log('Loading:', filename);
});

// Прогресс загрузки
viewer.on('fileLoadProgress', (progress) => {
  console.log('Progress:', progress.percent);
});

// Файл загружен
viewer.on('fileLoaded', (data) => {
  console.log('Loaded:', data.entityCount, 'entities');
});

// Ошибка загрузки
viewer.on('fileLoadError', (error) => {
  console.error('Error:', error.message);
});
```

#### Рендеринг

```javascript
// Перед рендерингом
viewer.on('beforeRender', () => {
  // Можно добавить custom рендеринг
});

// После рендеринга
viewer.on('afterRender', () => {
  // Измерить производительность
});

// Изменение вида (zoom/pan)
viewer.on('viewChanged', (viewport) => {
  console.log('Scale:', viewport.scale);
});
```

#### Взаимодействие

```javascript
// Клик по объекту
viewer.on('entityClick', (data) => {
  console.log('Clicked:', data.entity.type);
  console.log('Position:', data.position);
});

// Наведение на объект
viewer.on('entityHover', (entity) => {
  // Показать tooltip
});

// Выделение объектов
viewer.on('selectionChanged', (entities) => {
  console.log('Selected:', entities.length);
});
```

#### Слои

```javascript
// Изменение видимости слоя
viewer.on('layerVisibilityChanged', (data) => {
  console.log(`Layer ${data.layer} is now ${data.visible ? 'visible' : 'hidden'}`);
});

// Изменение прозрачности
viewer.on('layerOpacityChanged', (data) => {
  console.log(`Layer ${data.layer} opacity: ${data.opacity}`);
});
```

#### Измерения

```javascript
// Начало измерения
viewer.on('measurementStart', (type) => {
  console.log('Starting measurement:', type);
});

// Завершение измерения
viewer.on('measurementComplete', (data) => {
  console.log('Result:', data.value, data.unit);
});

// Отмена измерения
viewer.on('measurementCancel', () => {
  console.log('Measurement cancelled');
});
```

#### Поиск

```javascript
// Результаты поиска
viewer.on('searchComplete', (results) => {
  console.log('Found:', results.length);
});

// Переход к результату
viewer.on('searchResultSelected', (result) => {
  console.log('Selected result:', result.text);
});
```

---

## Plugins

Система плагинов для расширения функциональности.

### Создание плагина

```javascript
class MyPlugin {
  constructor() {
    this.name = 'my-plugin';
    this.version = '1.0.0';
  }
  
  install(viewer) {
    this.viewer = viewer;
    
    // Подписка на события
    viewer.on('fileLoaded', this.onFileLoaded.bind(this));
    
    // Добавление UI
    this.createUI();
    
    // Добавление методов
    viewer.myPlugin = {
      doSomething: this.doSomething.bind(this)
    };
  }
  
  uninstall() {
    // Cleanup
    this.viewer.off('fileLoaded', this.onFileLoaded);
  }
  
  onFileLoaded(data) {
    console.log('Plugin: file loaded');
  }
  
  doSomething() {
    console.log('Plugin method called');
  }
  
  createUI() {
    // Создать UI элементы
  }
}
```

### Использование плагина

```javascript
// Регистрация
const plugin = new MyPlugin();
viewer.use(plugin);

// Использование
viewer.myPlugin.doSomething();

// Удаление
viewer.removePlugin('my-plugin');
```

### Встроенные плагины

#### GridPlugin

Отображение координатной сетки.

```javascript
import { GridPlugin } from 'dxf-viewer/plugins';

viewer.use(new GridPlugin({
  size: 100,
  color: '#cccccc',
  subdivisions: 10
}));
```

#### RulerPlugin

Линейки по краям.

```javascript
import { RulerPlugin } from 'dxf-viewer/plugins';

viewer.use(new RulerPlugin({
  position: 'top-left',
  unit: 'mm'
}));
```

#### MiniMapPlugin

Миникарта для навигации.

```javascript
import { MiniMapPlugin } from 'dxf-viewer/plugins';

viewer.use(new MiniMapPlugin({
  position: 'bottom-right',
  size: 200
}));
```

---

## Типы данных

### Point

```typescript
interface Point {
  x: number
  y: number
}
```

### BoundingBox

```typescript
interface BoundingBox {
  min: Point
  max: Point
}
```

### Entity

```typescript
interface Entity {
  id: string
  type: string
  layer: string
  color: string
  bounds: BoundingBox
  visible: boolean
  selected: boolean
}
```

### Color

Цвета могут быть заданы в форматах:
- Hex: `'#ff0000'`
- RGB: `'rgb(255, 0, 0)'`
- RGBA: `'rgba(255, 0, 0, 0.5)'`
- Named: `'red'`
- AutoCAD index: `1-255`

---

## Примеры использования

### Базовый просмотрщик

```javascript
const viewer = new DXFViewer({
  container: '#viewer',
  width: 1200,
  height: 800
});

await viewer.loadFile('drawing.dxf');
viewer.fitToScreen();
```

### С управлением слоями

```javascript
const viewer = new DXFViewer({ container: '#viewer' });

await viewer.loadFile('drawing.dxf');

// Скрыть старое армирование
viewer.layers.hide('AR-OLD');

// Сделать план полупрозрачным
viewer.layers.setOpacity('AR-PLAN', 0.3);

// Показать только армирование
const rebarLayers = viewer.layers.filter(l => 
  l.name.startsWith('AR-')
);
viewer.layers.hideAll();
rebarLayers.forEach(l => viewer.layers.show(l.name));
```

### С измерениями

```javascript
const viewer = new DXFViewer({ container: '#viewer' });
await viewer.loadFile('drawing.dxf');

// Активировать измерение расстояний
viewer.measurements.activateDistance();

viewer.on('measurementComplete', (data) => {
  alert(`Расстояние: ${data.distance} мм`);
});
```

### С поиском

```javascript
const viewer = new DXFViewer({ container: '#viewer' });
await viewer.loadFile('drawing.dxf');

// Найти все обозначения арматуры
const results = viewer.search.find('⌀\\d+А\\d+', {
  regex: true,
  layers: ['AR-TEXT']
});

console.log(`Найдено: ${results.length} обозначений`);

// Показать первое
if (results.length > 0) {
  viewer.zoomToEntity(results[0].entity);
  viewer.search.highlight(results[0]);
}
```

### Экспорт

```javascript
const viewer = new DXFViewer({ container: '#viewer' });
await viewer.loadFile('drawing.dxf');

// Экспорт в PNG высокого разрешения
const blob = await viewer.export.toPNG({
  dpi: 300,
  area: 'all'
});

// Скачать
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'drawing-300dpi.png';
a.click();
```

### Интеграция с фреймворками

#### React

```jsx
import { useEffect, useRef } from 'react';
import DXFViewer from 'dxf-viewer';

function DXFViewerComponent({ file }) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  
  useEffect(() => {
    viewerRef.current = new DXFViewer({
      container: containerRef.current,
      width: 1200,
      height: 800
    });
    
    return () => {
      viewerRef.current.destroy();
    };
  }, []);
  
  useEffect(() => {
    if (file && viewerRef.current) {
      viewerRef.current.loadBlob(file);
    }
  }, [file]);
  
  return <div ref={containerRef} />;
}
```

#### Vue

```vue
<template>
  <div ref="container"></div>
</template>

<script>
import DXFViewer from 'dxf-viewer';

export default {
  props: ['file'],
  data() {
    return {
      viewer: null
    };
  },
  mounted() {
    this.viewer = new DXFViewer({
      container: this.$refs.container,
      width: 1200,
      height: 800
    });
  },
  beforeUnmount() {
    this.viewer?.destroy();
  },
  watch: {
    file(newFile) {
      if (newFile) {
        this.viewer.loadBlob(newFile);
      }
    }
  }
};
</script>
```

#### Alpine.js

```html
<div x-data="dxfViewer()">
  <input type="file" @change="loadFile($event)" accept=".dxf">
  <div x-ref="container"></div>
</div>

<script>
function dxfViewer() {
  return {
    viewer: null,
    
    init() {
      this.viewer = new DXFViewer({
        container: this.$refs.container,
        width: 1200,
        height: 800
      });
    },
    
    loadFile(event) {
      const file = event.target.files[0];
      if (file) {
        this.viewer.loadBlob(file);
      }
    }
  };
}
</script>
```

---

## Обработка ошибок

```javascript
try {
  await viewer.loadFile('drawing.dxf');
} catch (error) {
  if (error.code === 'INVALID_DXF') {
    console.error('Неверный формат DXF');
  } else if (error.code === 'FILE_TOO_LARGE') {
    console.error('Файл слишком большой');
  } else {
    console.error('Ошибка:', error.message);
  }
}

// Или через события
viewer.on('error', (error) => {
  console.error('Error:', error);
});
```

## Производительность

### Оптимизация для больших файлов

```javascript
const viewer = new DXFViewer({
  container: '#viewer',
  quality: 'medium',  // Понизить качество
  enableLOD: true     // Включить Level of Detail
});

// При масштабировании автоматически снизится детализация
```

### Прогрессивная загрузка

```javascript
viewer.on('fileLoadProgress', (progress) => {
  updateProgressBar(progress.percent);
});

await viewer.loadFile('large-file.dxf');
```
