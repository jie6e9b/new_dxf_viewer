# DXF Viewer Examples

Примеры использования библиотеки DXF Viewer.

## Запуск примеров

### Вариант 1: Простой HTTP сервер

```bash
# В корне проекта
npm run build
cd examples
python3 -m http.server 8000
```

Откройте браузер: http://localhost:8000/basic.html

### Вариант 2: Live Server (VS Code)

1. Установите расширение "Live Server"
2. Откройте `basic.html`
3. Нажмите "Go Live"

## Примеры

### basic.html

Базовый пример с:
- Загрузкой DXF из файла
- Загрузкой встроенного примера
- Zoom In/Out
- Fit to View
- Экспорт в PNG
- Отображение статистики

## Использование библиотеки

```javascript
// Создание viewer
const viewer = new DXFViewer({
    container: '#viewer-container',  // CSS selector или HTMLElement
    width: 800,                       // Ширина canvas
    height: 600,                      // Высота canvas
    backgroundColor: '#FFFFFF',       // Цвет фона
    autoFit: true                     // Автоматическая подгонка по размеру
});

// Загрузка из строки
await viewer.loadString(dxfContent);

// Загрузка из файла
await viewer.loadFile(file);

// Загрузка по URL
await viewer.loadFile('path/to/file.dxf');

// Управление видом
viewer.zoomIn(1.5);
viewer.zoomOut(1.5);
viewer.fitToView();
viewer.resetView();
viewer.pan(dx, dy);

// Работа со слоями
viewer.setLayerVisibility('Layer1', false);
const layers = viewer.getLayerNames();

// Получение статистики
const stats = viewer.getStats();
console.log(stats.entities.total);
console.log(stats.bounds);

// Экспорт
const dataURL = viewer.toDataURL('image/png');
const blob = await viewer.toBlob('image/jpeg');
```

## Текущие возможности (Фаза 1)

✅ Парсинг DXF файлов (R12-R2018+)
✅ Рендеринг LINE примитивов
✅ Управление слоями
✅ Поддержка цветов и типов линий
✅ Zoom, Pan, Fit to View
✅ Экспорт в PNG/JPEG
✅ Статистика по чертежу

## Планируемые возможности

Фаза 2:
- POLYLINE, CIRCLE, ARC
- Bulge дуги в polyline

Фаза 3:
- TEXT, MTEXT, DIMENSION

Фаза 4:
- HATCH (штриховки)

Фазы 5-8:
- Измерения
- Оптимизация
- Специальные функции для армирования
