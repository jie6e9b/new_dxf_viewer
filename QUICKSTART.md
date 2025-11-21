# Быстрый старт: DXF Viewer Library

Руководство для начала разработки библиотеки.

## 🎯 Что вы получите

После завершения всех этапов у вас будет:
- ✅ Легковесная (50-100KB) JavaScript библиотека
- ✅ Просмотр DXF файлов в браузере
- ✅ Работа с армированием и измерениями
- ✅ Экспорт в PNG, SVG, JSON
- ✅ Полное API для интеграции

## 📋 Предварительные требования

### Знания
- JavaScript (ES6+)
- Canvas API
- Базовое понимание DXF формата (изучим по ходу)
- Git

### Инструменты
- Node.js 16+ и npm
- VS Code или WebStorm
- Git
- Браузер с DevTools (Chrome/Firefox)

## 🚀 Шаг 1: Настройка окружения

### 1.1 Создание проекта

```bash
# Создать папку проекта
mkdir dxf-viewer-lib
cd dxf-viewer-lib

# Инициализировать git
git init

# Инициализировать npm
npm init -y
```

### 1.2 Установка зависимостей

```bash
# Development dependencies
npm install --save-dev \
  rollup \
  @rollup/plugin-node-resolve \
  @rollup/plugin-commonjs \
  @rollup/plugin-babel \
  @babel/core \
  @babel/preset-env \
  rollup-plugin-terser \
  jest \
  eslint \
  eslint-config-airbnb-base \
  prettier
```

### 1.3 Структура проекта

```bash
mkdir -p src/{core/{parser/{entities,styles},renderer/{renderers,patterns,fonts},scene,geometry},features,ui,utils,workers}
mkdir -p tests/{unit,integration,performance,fixtures}
mkdir -p examples dist docs
```

Результат:
```
dxf-viewer-lib/
├── src/
│   ├── core/
│   ├── features/
│   ├── ui/
│   ├── utils/
│   └── index.js
├── tests/
├── examples/
├── dist/
├── docs/
├── package.json
└── README.md
```

## 📚 Шаг 2: Изучение документации

Прочитайте в следующем порядке:

1. **README.md** - общее представление
2. **ARCHITECTURE.md** - понимание структуры
3. **API.md** - целевое API (что создаём)
4. **DEVELOPMENT_PLAN.md** - план работ
5. **TASKS_SUMMARY.md** - список всех задач

## 🎬 Шаг 3: Начало разработки

### Фаза 1, Задача 1.1: Настройка (4 часа)

Откройте `TASKS/PHASE_1_CORE.md` и следуйте инструкциям.

**Создайте конфигурационные файлы:**

**package.json** - добавьте scripts:
```json
{
  "scripts": {
    "build": "rollup -c",
    "dev": "rollup -c -w",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src/**/*.js"
  }
}
```

**rollup.config.js:**
```javascript
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/dxf-viewer.js',
    format: 'umd',
    name: 'DXFViewer',
    sourcemap: true
  },
  plugins: [
    resolve(),
    commonjs(),
    babel({
      babelHelpers: 'bundled',
      exclude: 'node_modules/**'
    }),
    terser()
  ]
};
```

**.eslintrc.js:**
```javascript
module.exports = {
  env: {
    browser: true,
    es2021: true,
    jest: true
  },
  extends: 'airbnb-base',
  rules: {
    'no-console': 'off',
    'class-methods-use-this': 'off'
  }
};
```

**jest.config.js:**
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  collectCoverageFrom: ['src/**/*.js']
};
```

**Проверка:** `npm run build` должна работать (пока без ошибок с пустым src)

### Фаза 1, Задача 1.2: DXF Reader (8 часов)

**Создайте первый файл:**

**src/core/parser/DXFReader.js:**
```javascript
class DXFReader {
  constructor(content) {
    this.content = content;
    this.lines = content.split(/\r?\n/);
    this.position = 0;
  }

  readGroups() {
    const groups = [];
    while (!this.isEOF()) {
      const group = this.readGroup();
      if (group) groups.push(group);
    }
    return groups;
  }

  readGroup() {
    const codeLine = this.readLine();
    const valueLine = this.readLine();
    if (!codeLine || !valueLine) return null;
    
    const code = parseInt(codeLine.trim(), 10);
    const value = this.parseValue(code, valueLine.trim());
    return { code, value };
  }

  parseValue(code, value) {
    if (code >= 0 && code <= 9) return value;
    if ((code >= 10 && code <= 59) || (code >= 210 && code <= 239)) {
      return parseFloat(value);
    }
    if (code >= 60 && code <= 99) return parseInt(value, 10);
    return value;
  }

  readLine() {
    if (this.isEOF()) return null;
    return this.lines[this.position++];
  }

  isEOF() {
    return this.position >= this.lines.length;
  }

  reset() {
    this.position = 0;
  }
}

export default DXFReader;
```

**Создайте тест:**

**tests/unit/parser/DXFReader.test.js:**
```javascript
import DXFReader from '../../../src/core/parser/DXFReader';

describe('DXFReader', () => {
  test('parses simple groups', () => {
    const dxf = '0\nLINE\n10\n0.0';
    const reader = new DXFReader(dxf);
    const groups = reader.readGroups();
    
    expect(groups).toHaveLength(2);
    expect(groups[0]).toEqual({ code: 0, value: 'LINE' });
    expect(groups[1]).toEqual({ code: 10, value: 0.0 });
  });
});
```

**Запустите тест:**
```bash
npm test
```

Тест должен пройти ✅

**Продолжайте по заданиям из PHASE_1_CORE.md**

## 📊 Шаг 4: Отслеживание прогресса

### Используйте чеклисты

Откройте TASKS_SUMMARY.md и отмечайте завершенные задачи:

```markdown
| 1.1 | Настройка проекта | 4ч | 🔴 | - | ✅ |  <-- Отметили как готово
| 1.2 | DXF Reader | 8ч | 🔴 | 1.1 | 🔄 |  <-- В работе
```

### Коммитьте регулярно

```bash
git add .
git commit -m "feat: implement DXF Reader with tests"
```

### Запускайте тесты часто

```bash
npm test -- --watch  # В отдельном терминале
```

## 🎓 Шаг 5: Изучение DXF формата

### Ресурсы

**Официальная документация:**
- AutoCAD DXF Reference (Google: "AutoCAD DXF Reference")
- Формат простой: пары "group code - value"

**Пример простого DXF:**
```
0
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
Layer1
10
0.0
20
0.0
11
100.0
21
100.0
0
ENDSEC
0
EOF
```

**Разбор:**
- `0` - код группы (начало entity)
- `SECTION` - значение (тип: секция)
- `2` - код группы (имя)
- `HEADER` - значение (имя секции)
- и т.д.

### Тестовые файлы

Создайте простые DXF для тестирования:

**tests/fixtures/simple-line.dxf:**
```
0
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
EOF
```

## 🛠️ Шаг 6: Полезные команды

### Разработка

```bash
# Запустить dev сборку (watch mode)
npm run dev

# Запустить тесты в watch mode
npm test -- --watch

# Линтинг
npm run lint

# Production сборка
npm run build
```

### Отладка

**В браузере:**
```html
<!-- examples/debug.html -->
<!DOCTYPE html>
<html>
<head>
  <script src="../dist/dxf-viewer.js"></script>
</head>
<body>
  <div id="viewer" style="width: 800px; height: 600px;"></div>
  <script>
    const viewer = new DXFViewer({
      container: '#viewer'
    });
    
    // Откройте DevTools и смотрите console
    console.log('Viewer:', viewer);
  </script>
</body>
</html>
```

**VS Code launch.json для дебага:**
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Tests",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal"
}
```

## 📈 Шаг 7: Milestone проверки

После каждой фазы проверяйте:

### Фаза 1 - Ядро
```javascript
const viewer = new DXFViewer({ container: '#viewer' });
await viewer.loadString(simpleDXF);
// Должна отобразиться линия
```

### Фаза 2 - Примитивы
```javascript
// Должны отображаться LINE, POLYLINE, CIRCLE, ARC
```

### Фаза 3 - Текст
```javascript
// Текст должен быть читаемым
```

И так далее по плану.

## 🐛 Шаг 8: Если что-то пошло не так

### Проблемы с парсингом

**Проблема:** DXF не парсится
**Решение:**
1. Проверьте формат файла (должен быть ASCII DXF)
2. Добавьте логирование:
```javascript
console.log('Groups:', reader.readGroups());
```
3. Сравните с примерами в TASKS/

### Проблемы с рендерингом

**Проблема:** Ничего не отображается
**Решение:**
1. Проверьте canvas:
```javascript
console.log('Canvas:', viewer.canvas);
console.log('Context:', viewer.ctx);
```
2. Проверьте bounds:
```javascript
console.log('Scene bounds:', viewer.scene.bounds);
```
3. Проверьте transform:
```javascript
console.log('Transform scale:', viewer.transform.scale);
```

### Проблемы с тестами

**Проблема:** Тесты не проходят
**Решение:**
1. Запустите отдельный тест:
```bash
npm test -- DXFReader
```
2. Добавьте console.log в тест
3. Проверьте fixtures

## 📅 Рекомендуемый график

### Неделя 1-2: Фундамент
- Пн-Вт: Задачи 1.1-1.3 (Настройка + Парсинг)
- Ср-Чт: Задачи 1.4-1.7 (Entities + Renderer)
- Пт: Задачи 1.8-1.11 (Интеграция + Тесты)

### Неделя 3: Геометрия
- Следуйте PHASE_2_PRIMITIVES.md

### Недели 4-9: 
- По фазам согласно плану

### Неделя 10:
- Финализация и релиз

## 🎯 Цели и мотивация

**Помните:**
- Это ваша библиотека - вы контролируете архитектуру
- Это ценный IP - можете коммерциализировать
- Это специализированный продукт - нет прямых конкурентов для ваших задач
- Это итеративный процесс - начните просто, улучшайте постепенно

## 📞 Следующие шаги

1. ✅ Прочитайте эту документацию
2. ✅ Настройте окружение
3. ✅ Начните с Фазы 1, Задачи 1.1
4. ✅ Коммитьте прогресс регулярно
5. ✅ Обращайтесь к документации при вопросах

## 🚀 Готовы начать?

```bash
# Создайте проект
mkdir dxf-viewer-lib && cd dxf-viewer-lib

# Инициализируйте
npm init -y

# Откройте в VS Code
code .

# Следуйте инструкциям из PHASE_1_CORE.md
```

**Удачи в разработке! 🎉**

---

## 📚 Полный набор документации

После прочтения этого гайда у вас есть:

- ✅ **README.md** - Обзор проекта
- ✅ **ARCHITECTURE.md** - Архитектура библиотеки
- ✅ **API.md** - Полное API reference
- ✅ **DEVELOPMENT_PLAN.md** - Детальный план разработки
- ✅ **TASKS_SUMMARY.md** - Сводный список задач
- ✅ **QUICKSTART.md** (этот файл) - Быстрый старт
- ✅ **TASKS/PHASE_*.md** - Детальные задания по фазам

Вся информация для успешной разработки! 🎯
