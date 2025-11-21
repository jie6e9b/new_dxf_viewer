# Фаза 1: Ядро библиотеки

**Длительность:** 2 недели  
**Цель:** Создать базовую инфраструктуру для парсинга DXF и рендеринга

---

## Задача 1.1: Настройка проекта

**Время:** 4 часа  
**Приоритет:** Критичный

### Описание
Инициализировать структуру проекта с необходимыми инструментами и конфигурациями.

### Шаги выполнения

1. **Инициализация npm проекта**
```bash
mkdir dxf-viewer-lib
cd dxf-viewer-lib
npm init -y
```

2. **Создание структуры папок**
```bash
mkdir -p src/{core/{parser/{entities,styles},renderer/{renderers,patterns,fonts},scene,geometry},features/{layers,measurements,search,export,reinforcement},ui,utils,workers}
mkdir -p tests/{unit,integration,performance,fixtures}
mkdir -p examples
mkdir -p dist
mkdir -p docs
```

3. **Установка зависимостей**
```bash
# Dev dependencies
npm install --save-dev \
  rollup \
  @rollup/plugin-node-resolve \
  @rollup/plugin-commonjs \
  @rollup/plugin-babel \
  @babel/core \
  @babel/preset-env \
  rollup-plugin-terser \
  jest \
  @babel/preset-env \
  eslint \
  eslint-config-airbnb-base \
  eslint-plugin-import \
  prettier
```

4. **Конфигурация package.json**
```json
{
  "name": "dxf-viewer-lib",
  "version": "0.1.0",
  "description": "Lightweight DXF viewer for construction drawings",
  "main": "dist/dxf-viewer.js",
  "module": "dist/dxf-viewer.esm.js",
  "scripts": {
    "build": "rollup -c",
    "dev": "rollup -c -w",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src/**/*.js",
    "format": "prettier --write src/**/*.js"
  },
  "keywords": ["dxf", "viewer", "cad", "construction", "reinforcement"],
  "author": "Your Name",
  "license": "MIT"
}
```

5. **Создание rollup.config.js**
```javascript
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';

export default [
  // UMD build
  {
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
        exclude: 'node_modules/**',
        presets: ['@babel/preset-env']
      })
    ]
  },
  // UMD minified
  {
    input: 'src/index.js',
    output: {
      file: 'dist/dxf-viewer.min.js',
      format: 'umd',
      name: 'DXFViewer',
      sourcemap: true
    },
    plugins: [
      resolve(),
      commonjs(),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**',
        presets: ['@babel/preset-env']
      }),
      terser()
    ]
  },
  // ESM build
  {
    input: 'src/index.js',
    output: {
      file: 'dist/dxf-viewer.esm.js',
      format: 'esm',
      sourcemap: true
    },
    plugins: [
      resolve(),
      commonjs(),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**',
        presets: ['@babel/preset-env']
      })
    ]
  }
];
```

6. **Создание .eslintrc.js**
```javascript
module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true
  },
  extends: 'airbnb-base',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
    'no-console': 'off',
    'class-methods-use-this': 'off',
    'no-underscore-dangle': 'off'
  }
};
```

7. **Создание jest.config.js**
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
```

8. **Создание .gitignore**
```
node_modules/
dist/
coverage/
.DS_Store
*.log
.env
```

9. **Создание README.md** (базовый)
```markdown
# DXF Viewer Library

Work in progress...

## Development

npm install
npm run dev
npm test
```

### Критерии выполнения
- [ ] Проект инициализирован
- [ ] Структура папок создана
- [ ] Все зависимости установлены
- [ ] Конфигурация сборки работает
- [ ] ESLint настроен
- [ ] Jest настроен
- [ ] `npm run build` выполняется без ошибок

---

## Задача 1.2: DXF Reader

**Время:** 8 часов  
**Приоритет:** Критичный

### Описание
Создать класс для чтения и парсинга DXF файлов построчно.

### Техническая спецификация

DXF файл состоит из пар "group code - value":
```
0
SECTION
2
HEADER
9
$ACADVER
1
AC1015
```

Group code (0-999) указывает тип данных:
- 0: Начало entity
- 1-9: Текст
- 10-39: Числа с плавающей точкой (координаты)
- 40-59: Числа с плавающей точкой (другие параметры)
- 60-79: Целые числа
- 210-239: Числа с плавающей точкой (направления)

### Код реализации

**src/core/parser/DXFReader.js:**
```javascript
/**
 * DXF Reader - reads and parses DXF file content
 */
class DXFReader {
  constructor(content) {
    this.content = content;
    this.lines = content.split(/\r?\n/);
    this.position = 0;
  }

  /**
   * Read all group codes and values
   * @returns {Array} Array of {code, value} objects
   */
  readGroups() {
    const groups = [];
    
    while (!this.isEOF()) {
      const group = this.readGroup();
      if (group) {
        groups.push(group);
      }
    }
    
    return groups;
  }

  /**
   * Read single group (code-value pair)
   * @returns {Object} {code, value}
   */
  readGroup() {
    const codeLine = this.readLine();
    const valueLine = this.readLine();
    
    if (codeLine === null || valueLine === null) {
      return null;
    }
    
    const code = parseInt(codeLine.trim(), 10);
    const value = this.parseValue(code, valueLine.trim());
    
    return { code, value };
  }

  /**
   * Parse value based on group code
   */
  parseValue(code, value) {
    // Text values (0-9)
    if (code >= 0 && code <= 9) {
      return value;
    }
    
    // Float values (10-59, 210-239)
    if ((code >= 10 && code <= 59) || (code >= 210 && code <= 239)) {
      return parseFloat(value);
    }
    
    // Integer values (60-99)
    if (code >= 60 && code <= 99) {
      return parseInt(value, 10);
    }
    
    // Default: string
    return value;
  }

  /**
   * Read single line
   */
  readLine() {
    if (this.isEOF()) {
      return null;
    }
    return this.lines[this.position++];
  }

  /**
   * Check if end of file
   */
  isEOF() {
    return this.position >= this.lines.length;
  }

  /**
   * Reset position
   */
  reset() {
    this.position = 0;
  }

  /**
   * Get current position
   */
  getPosition() {
    return this.position;
  }
}

export default DXFReader;
```

### Тесты

**tests/unit/parser/DXFReader.test.js:**
```javascript
import DXFReader from '../../../src/core/parser/DXFReader';

describe('DXFReader', () => {
  test('parses simple group codes', () => {
    const dxf = `0
LINE
8
Layer1
10
0.0
20
0.0`;
    
    const reader = new DXFReader(dxf);
    const groups = reader.readGroups();
    
    expect(groups).toHaveLength(5);
    expect(groups[0]).toEqual({ code: 0, value: 'LINE' });
    expect(groups[1]).toEqual({ code: 8, value: 'Layer1' });
    expect(groups[2]).toEqual({ code: 10, value: 0.0 });
  });

  test('parses different value types', () => {
    const dxf = `0
TEXT
1
Hello
10
123.45
70
1`;
    
    const reader = new DXFReader(dxf);
    const groups = reader.readGroups();
    
    expect(groups[0].value).toBe('TEXT');           // String
    expect(groups[1].value).toBe('Hello');          // String
    expect(groups[2].value).toBe(123.45);           // Float
    expect(typeof groups[2].value).toBe('number');
    expect(groups[3].value).toBe(1);                // Integer
  });

  test('handles EOF correctly', () => {
    const dxf = `0
LINE`;
    
    const reader = new DXFReader(dxf);
    expect(reader.isEOF()).toBe(false);
    
    reader.readGroups();
    expect(reader.isEOF()).toBe(true);
  });

  test('can reset position', () => {
    const dxf = `0
LINE`;
    
    const reader = new DXFReader(dxf);
    reader.readGroups();
    expect(reader.isEOF()).toBe(true);
    
    reader.reset();
    expect(reader.isEOF()).toBe(false);
    expect(reader.getPosition()).toBe(0);
  });

  test('handles empty file', () => {
    const reader = new DXFReader('');
    const groups = reader.readGroups();
    expect(groups).toHaveLength(0);
  });

  test('handles Windows line endings', () => {
    const dxf = "0\r\nLINE\r\n8\r\nLayer1";
    const reader = new DXFReader(dxf);
    const groups = reader.readGroups();
    
    expect(groups).toHaveLength(3);
    expect(groups[0].value).toBe('LINE');
  });
});
```

### Критерии выполнения
- [ ] DXFReader класс создан
- [ ] Парсинг group codes работает
- [ ] Правильное определение типов данных
- [ ] Обработка различных line endings (LF, CRLF)
- [ ] Все тесты проходят
- [ ] Покрытие тестами > 90%

---

## Задача 1.3: Section Parser

**Время:** 8 часов  
**Приоритет:** Критичный

### Описание
Разбить DXF файл на секции (HEADER, TABLES, ENTITIES и т.д.).

### Структура DXF файла

```
0
SECTION
2
HEADER
  ... header content ...
0
ENDSEC
0
SECTION
2
TABLES
  ... tables content ...
0
ENDSEC
0
SECTION
2
ENTITIES
  ... entities content ...
0
ENDSEC
0
EOF
```

### Код реализации

**src/core/parser/SectionParser.js:**
```javascript
import DXFReader from './DXFReader';

/**
 * Section Parser - splits DXF into sections
 */
class SectionParser {
  constructor(reader) {
    this.reader = reader;
  }

  /**
   * Parse all sections
   * @returns {Object} Object with section names as keys
   */
  parse() {
    const sections = {};
    const groups = this.reader.readGroups();
    
    let i = 0;
    while (i < groups.length) {
      const group = groups[i];
      
      // Look for SECTION start
      if (group.code === 0 && group.value === 'SECTION') {
        // Next group should be section name (code 2)
        if (i + 1 < groups.length && groups[i + 1].code === 2) {
          const sectionName = groups[i + 1].value;
          const sectionData = this.extractSection(groups, i + 2);
          
          sections[sectionName] = sectionData.groups;
          i = sectionData.endIndex;
        } else {
          i++;
        }
      } else {
        i++;
      }
    }
    
    return sections;
  }

  /**
   * Extract section content until ENDSEC
   */
  extractSection(groups, startIndex) {
    const sectionGroups = [];
    let i = startIndex;
    
    while (i < groups.length) {
      const group = groups[i];
      
      if (group.code === 0 && group.value === 'ENDSEC') {
        break;
      }
      
      sectionGroups.push(group);
      i++;
    }
    
    return {
      groups: sectionGroups,
      endIndex: i + 1
    };
  }

  /**
   * Parse HEADER section
   */
  parseHeader(groups) {
    const header = {};
    
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      
      // Header variables start with $
      if (group.code === 9 && group.value.startsWith('$')) {
        const varName = group.value;
        
        // Next group(s) contain the value
        if (i + 1 < groups.length) {
          header[varName] = groups[i + 1].value;
          i++;
        }
      }
    }
    
    return header;
  }

  /**
   * Parse TABLES section
   */
  parseTables(groups) {
    const tables = {};
    let i = 0;
    
    while (i < groups.length) {
      const group = groups[i];
      
      // Look for TABLE start
      if (group.code === 0 && group.value === 'TABLE') {
        if (i + 1 < groups.length && groups[i + 1].code === 2) {
          const tableName = groups[i + 1].value;
          const tableData = this.extractTable(groups, i + 2);
          
          tables[tableName] = tableData.entries;
          i = tableData.endIndex;
        } else {
          i++;
        }
      } else {
        i++;
      }
    }
    
    return tables;
  }

  /**
   * Extract table entries until ENDTAB
   */
  extractTable(groups, startIndex) {
    const entries = [];
    let currentEntry = null;
    let i = startIndex;
    
    while (i < groups.length) {
      const group = groups[i];
      
      if (group.code === 0) {
        if (group.value === 'ENDTAB') {
          if (currentEntry) {
            entries.push(currentEntry);
          }
          break;
        } else {
          // Start new entry
          if (currentEntry) {
            entries.push(currentEntry);
          }
          currentEntry = { type: group.value, data: [] };
        }
      } else if (currentEntry) {
        currentEntry.data.push(group);
      }
      
      i++;
    }
    
    return {
      entries,
      endIndex: i + 1
    };
  }

  /**
   * Parse ENTITIES section
   */
  parseEntities(groups) {
    const entities = [];
    let currentEntity = null;
    
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      
      if (group.code === 0) {
        // Start new entity
        if (currentEntity) {
          entities.push(currentEntity);
        }
        currentEntity = {
          type: group.value,
          data: []
        };
      } else if (currentEntity) {
        currentEntity.data.push(group);
      }
    }
    
    if (currentEntity) {
      entities.push(currentEntity);
    }
    
    return entities;
  }
}

export default SectionParser;
```

### Тесты

**tests/unit/parser/SectionParser.test.js:**
```javascript
import DXFReader from '../../../src/core/parser/DXFReader';
import SectionParser from '../../../src/core/parser/SectionParser';

describe('SectionParser', () => {
  test('splits DXF into sections', () => {
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
0
ENDSEC
0
EOF`;
    
    const reader = new DXFReader(dxf);
    const parser = new SectionParser(reader);
    const sections = parser.parse();
    
    expect(sections.HEADER).toBeDefined();
    expect(sections.ENTITIES).toBeDefined();
    expect(sections.HEADER.length).toBeGreaterThan(0);
  });

  test('parses HEADER section', () => {
    const groups = [
      { code: 9, value: '$ACADVER' },
      { code: 1, value: 'AC1015' },
      { code: 9, value: '$INSUNITS' },
      { code: 70, value: 4 }
    ];
    
    const reader = new DXFReader('');
    const parser = new SectionParser(reader);
    const header = parser.parseHeader(groups);
    
    expect(header.$ACADVER).toBe('AC1015');
    expect(header.$INSUNITS).toBe(4);
  });

  test('parses ENTITIES section', () => {
    const groups = [
      { code: 0, value: 'LINE' },
      { code: 8, value: 'Layer1' },
      { code: 10, value: 0 },
      { code: 0, value: 'CIRCLE' },
      { code: 8, value: 'Layer2' },
      { code: 10, value: 100 }
    ];
    
    const reader = new DXFReader('');
    const parser = new SectionParser(reader);
    const entities = parser.parseEntities(groups);
    
    expect(entities).toHaveLength(2);
    expect(entities[0].type).toBe('LINE');
    expect(entities[1].type).toBe('CIRCLE');
  });
});
```

### Критерии выполнения
- [ ] SectionParser класс создан
- [ ] Разбиение на секции работает
- [ ] Парсинг HEADER работает
- [ ] Парсинг TABLES работает
- [ ] Парсинг ENTITIES работает
- [ ] Все тесты проходят
- [ ] Покрытие тестами > 80%

---

## Задача 1.4-1.5: Layer Tables и Entity Factory

См. аналогичную структуру для следующих задач...

---

## Milestone проверка

После завершения всех задач Фазы 1 проверьте:

### Функциональность
- [ ] Можно загрузить простой DXF файл
- [ ] Файл корректно парсится
- [ ] LINE примитив корректно рендерится на canvas
- [ ] Работает базовый zoom и pan

### Тесты
- [ ] Все unit тесты проходят
- [ ] Покрытие > 70%
- [ ] Нет критичных ESLint ошибок

### Пример использования работает
```javascript
const viewer = new DXFViewer({
  container: '#viewer',
  width: 800,
  height: 600
});

await viewer.loadString(`0
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
EOF`);

// Линия должна отобразиться на canvas
```

Если все проверки пройдены - **Фаза 1 завершена** ✅
