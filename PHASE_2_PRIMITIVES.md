# Фаза 2: Базовые примитивы

**Длительность:** 1 неделя  
**Цель:** Поддержка всех основных геометрических примитивов

---

## Задача 2.1: Polyline Entity

**Время:** 6 часов

### Описание
Реализовать поддержку POLYLINE и LWPOLYLINE с bulge (дугами).

### Структура POLYLINE в DXF

```
0
POLYLINE
8
LayerName
66          # Vertices follow flag
1
70          # Closed flag (1 = closed)
1
0
VERTEX
10          # X coordinate
0.0
20          # Y coordinate
0.0
42          # Bulge (optional, for arcs)
0.5
0
VERTEX
10
100.0
20
0.0
0
SEQEND
```

### Код реализации

**src/core/parser/entities/PolylineEntity.js:**
```javascript
import Entity from './Entity';

class PolylineEntity extends Entity {
  constructor(data) {
    super(data);
    this.vertices = [];
    this.closed = false;
    this.parseData(data);
  }

  parseData(groups) {
    for (const group of groups) {
      switch (group.code) {
        case 70: // Flags
          this.closed = (group.value & 1) === 1;
          break;
        case 10: // X coordinate
          if (!this.currentVertex) {
            this.currentVertex = {};
          }
          this.currentVertex.x = group.value;
          break;
        case 20: // Y coordinate
          this.currentVertex.y = group.value;
          break;
        case 42: // Bulge
          this.currentVertex.bulge = group.value;
          break;
      }
      
      // If we have complete vertex, add it
      if (this.currentVertex && 
          this.currentVertex.x !== undefined && 
          this.currentVertex.y !== undefined) {
        this.vertices.push({ ...this.currentVertex });
        this.currentVertex = null;
      }
    }
  }

  getBoundingBox() {
    if (this.vertices.length === 0) {
      return null;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const vertex of this.vertices) {
      minX = Math.min(minX, vertex.x);
      minY = Math.min(minY, vertex.y);
      maxX = Math.max(maxX, vertex.x);
      maxY = Math.max(maxY, vertex.y);
    }

    return {
      min: { x: minX, y: minY },
      max: { x: maxX, y: maxY }
    };
  }
}

export default PolylineEntity;
```

**src/core/renderer/renderers/PolylineRenderer.js:**
```javascript
class PolylineRenderer {
  static render(ctx, entity, transform) {
    if (entity.vertices.length < 2) return;

    ctx.beginPath();
    
    // First vertex
    const v0 = entity.vertices[0];
    const p0 = transform.worldToScreen(v0.x, v0.y);
    ctx.moveTo(p0.x, p0.y);

    // Subsequent vertices
    for (let i = 1; i < entity.vertices.length; i++) {
      const v = entity.vertices[i];
      const vPrev = entity.vertices[i - 1];
      
      if (vPrev.bulge && Math.abs(vPrev.bulge) > 0.001) {
        // Draw arc segment
        this.drawBulgeArc(ctx, vPrev, v, vPrev.bulge, transform);
      } else {
        // Draw straight line
        const p = transform.worldToScreen(v.x, v.y);
        ctx.lineTo(p.x, p.y);
      }
    }

    // Close path if needed
    if (entity.closed) {
      ctx.closePath();
    }

    ctx.strokeStyle = entity.color;
    ctx.lineWidth = entity.lineWidth || 1;
    ctx.stroke();
  }

  /**
   * Draw arc using bulge value
   * Bulge = tan(angle/4)
   */
  static drawBulgeArc(ctx, v1, v2, bulge, transform) {
    // Calculate arc parameters from bulge
    const dx = v2.x - v1.x;
    const dy = v2.y - v1.y;
    const chord = Math.sqrt(dx * dx + dy * dy);
    
    const angle = 4 * Math.atan(bulge);
    const radius = chord / (2 * Math.sin(angle / 2));
    
    // Center point
    const midX = (v1.x + v2.x) / 2;
    const midY = (v1.y + v2.y) / 2;
    
    const h = Math.sqrt(radius * radius - (chord / 2) * (chord / 2));
    const sign = bulge > 0 ? 1 : -1;
    
    const centerX = midX - sign * h * dy / chord;
    const centerY = midY + sign * h * dx / chord;
    
    // Transform to screen coordinates
    const center = transform.worldToScreen(centerX, centerY);
    const screenRadius = radius * transform.scale;
    
    // Calculate start and end angles
    const startAngle = Math.atan2(v1.y - centerY, v1.x - centerX);
    const endAngle = Math.atan2(v2.y - centerY, v2.x - centerX);
    
    // Draw arc
    ctx.arc(
      center.x,
      center.y,
      screenRadius,
      -startAngle,  // Canvas Y is inverted
      -endAngle,
      bulge < 0
    );
  }
}

export default PolylineRenderer;
```

### Тесты

```javascript
describe('PolylineEntity', () => {
  test('parses vertices', () => {
    const groups = [
      { code: 10, value: 0 },
      { code: 20, value: 0 },
      { code: 10, value: 100 },
      { code: 20, value: 100 }
    ];
    
    const entity = new PolylineEntity({ data: groups });
    expect(entity.vertices).toHaveLength(2);
    expect(entity.vertices[0]).toEqual({ x: 0, y: 0 });
  });

  test('handles closed flag', () => {
    const groups = [
      { code: 70, value: 1 },  // Closed
      { code: 10, value: 0 },
      { code: 20, value: 0 }
    ];
    
    const entity = new PolylineEntity({ data: groups });
    expect(entity.closed).toBe(true);
  });

  test('handles bulge', () => {
    const groups = [
      { code: 10, value: 0 },
      { code: 20, value: 0 },
      { code: 42, value: 0.5 }  // Bulge
    ];
    
    const entity = new PolylineEntity({ data: groups });
    expect(entity.vertices[0].bulge).toBe(0.5);
  });
});
```

### Критерии выполнения
- [ ] PolylineEntity парсит vertices
- [ ] Обработка closed флага
- [ ] Обработка bulge для дуг
- [ ] Рендеринг прямых сегментов
- [ ] Рендеринг дуговых сегментов
- [ ] Тесты проходят

---

## Задача 2.2: Circle и Arc

**Время:** 6 часов

### CIRCLE структура

```
0
CIRCLE
8
LayerName
10          # Center X
50.0
20          # Center Y
50.0
40          # Radius
25.0
```

### ARC структура

```
0
ARC
8
LayerName
10          # Center X
50.0
20          # Center Y
50.0
40          # Radius
25.0
50          # Start angle (degrees)
0.0
51          # End angle (degrees)
90.0
```

### Код реализации

**src/core/parser/entities/CircleEntity.js:**
```javascript
import Entity from './Entity';

class CircleEntity extends Entity {
  constructor(data) {
    super(data);
    this.center = { x: 0, y: 0 };
    this.radius = 0;
    this.parseData(data);
  }

  parseData(groups) {
    for (const group of groups) {
      switch (group.code) {
        case 10:
          this.center.x = group.value;
          break;
        case 20:
          this.center.y = group.value;
          break;
        case 40:
          this.radius = group.value;
          break;
      }
    }
  }

  getBoundingBox() {
    return {
      min: {
        x: this.center.x - this.radius,
        y: this.center.y - this.radius
      },
      max: {
        x: this.center.x + this.radius,
        y: this.center.y + this.radius
      }
    };
  }
}

export default CircleEntity;
```

**src/core/parser/entities/ArcEntity.js:**
```javascript
import Entity from './Entity';

class ArcEntity extends Entity {
  constructor(data) {
    super(data);
    this.center = { x: 0, y: 0 };
    this.radius = 0;
    this.startAngle = 0;
    this.endAngle = 0;
    this.parseData(data);
  }

  parseData(groups) {
    for (const group of groups) {
      switch (group.code) {
        case 10:
          this.center.x = group.value;
          break;
        case 20:
          this.center.y = group.value;
          break;
        case 40:
          this.radius = group.value;
          break;
        case 50:
          this.startAngle = group.value;
          break;
        case 51:
          this.endAngle = group.value;
          break;
      }
    }
  }

  getBoundingBox() {
    // Simplified - for full implementation need to consider arc angles
    return {
      min: {
        x: this.center.x - this.radius,
        y: this.center.y - this.radius
      },
      max: {
        x: this.center.x + this.radius,
        y: this.center.y + this.radius
      }
    };
  }
}

export default ArcEntity;
```

**src/core/renderer/renderers/CircleRenderer.js:**
```javascript
class CircleRenderer {
  static render(ctx, entity, transform) {
    const center = transform.worldToScreen(entity.center.x, entity.center.y);
    const radius = entity.radius * transform.scale;

    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = entity.color;
    ctx.lineWidth = entity.lineWidth || 1;
    ctx.stroke();
  }

  static renderArc(ctx, entity, transform) {
    const center = transform.worldToScreen(entity.center.x, entity.center.y);
    const radius = entity.radius * transform.scale;
    
    // Convert angles to radians
    // Note: DXF angles are in degrees, counterclockwise from X-axis
    // Canvas angles are in radians, clockwise from X-axis
    const startAngle = -entity.startAngle * Math.PI / 180;
    const endAngle = -entity.endAngle * Math.PI / 180;

    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, startAngle, endAngle, true);
    ctx.strokeStyle = entity.color;
    ctx.lineWidth = entity.lineWidth || 1;
    ctx.stroke();
  }
}

export default CircleRenderer;
```

### Критерии выполнения
- [ ] CircleEntity парсит center и radius
- [ ] ArcEntity парсит angles
- [ ] Рендеринг окружностей
- [ ] Рендеринг дуг с правильными углами
- [ ] Правильный bounding box
- [ ] Тесты проходят

---

## Задача 2.3: Geometry Math

**Время:** 8 часов

### Описание
Создать математические утилиты для работы с 2D геометрией.

### Код реализации

**src/core/geometry/Vector2D.js:**
```javascript
class Vector2D {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  add(v) {
    return new Vector2D(this.x + v.x, this.y + v.y);
  }

  subtract(v) {
    return new Vector2D(this.x - v.x, this.y - v.y);
  }

  multiply(scalar) {
    return new Vector2D(this.x * scalar, this.y * scalar);
  }

  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  normalize() {
    const len = this.length();
    if (len === 0) return new Vector2D(0, 0);
    return new Vector2D(this.x / len, this.y / len);
  }

  dot(v) {
    return this.x * v.x + this.y * v.y;
  }

  cross(v) {
    return this.x * v.y - this.y * v.x;
  }

  angle() {
    return Math.atan2(this.y, this.x);
  }

  rotate(angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Vector2D(
      this.x * cos - this.y * sin,
      this.x * sin + this.y * cos
    );
  }

  distanceTo(v) {
    const dx = v.x - this.x;
    const dy = v.y - this.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  clone() {
    return new Vector2D(this.x, this.y);
  }

  equals(v, tolerance = 0.0001) {
    return Math.abs(this.x - v.x) < tolerance && 
           Math.abs(this.y - v.y) < tolerance;
  }
}

export default Vector2D;
```

**src/core/geometry/BoundingBox.js:**
```javascript
import Vector2D from './Vector2D';

class BoundingBox {
  constructor(min = null, max = null) {
    this.min = min || new Vector2D(Infinity, Infinity);
    this.max = max || new Vector2D(-Infinity, -Infinity);
  }

  contains(point) {
    return point.x >= this.min.x &&
           point.x <= this.max.x &&
           point.y >= this.min.y &&
           point.y <= this.max.y;
  }

  intersects(box) {
    return !(box.max.x < this.min.x ||
             box.min.x > this.max.x ||
             box.max.y < this.min.y ||
             box.min.y > this.max.y);
  }

  expand(box) {
    this.min.x = Math.min(this.min.x, box.min.x);
    this.min.y = Math.min(this.min.y, box.min.y);
    this.max.x = Math.max(this.max.x, box.max.x);
    this.max.y = Math.max(this.max.y, box.max.y);
  }

  expandByPoint(point) {
    this.min.x = Math.min(this.min.x, point.x);
    this.min.y = Math.min(this.min.y, point.y);
    this.max.x = Math.max(this.max.x, point.x);
    this.max.y = Math.max(this.max.y, point.y);
  }

  center() {
    return new Vector2D(
      (this.min.x + this.max.x) / 2,
      (this.min.y + this.max.y) / 2
    );
  }

  width() {
    return this.max.x - this.min.x;
  }

  height() {
    return this.max.y - this.min.y;
  }

  isEmpty() {
    return this.min.x === Infinity || this.max.x === -Infinity;
  }

  clone() {
    return new BoundingBox(
      this.min.clone(),
      this.max.clone()
    );
  }
}

export default BoundingBox;
```

### Тесты

```javascript
describe('Vector2D', () => {
  test('basic operations', () => {
    const v1 = new Vector2D(1, 2);
    const v2 = new Vector2D(3, 4);
    
    const sum = v1.add(v2);
    expect(sum.x).toBe(4);
    expect(sum.y).toBe(6);
    
    const diff = v2.subtract(v1);
    expect(diff.x).toBe(2);
    expect(diff.y).toBe(2);
  });

  test('calculates length', () => {
    const v = new Vector2D(3, 4);
    expect(v.length()).toBe(5);
  });

  test('normalizes vector', () => {
    const v = new Vector2D(3, 4);
    const normalized = v.normalize();
    expect(normalized.length()).toBeCloseTo(1, 5);
  });
});

describe('BoundingBox', () => {
  test('checks if contains point', () => {
    const box = new BoundingBox(
      new Vector2D(0, 0),
      new Vector2D(100, 100)
    );
    
    expect(box.contains(new Vector2D(50, 50))).toBe(true);
    expect(box.contains(new Vector2D(150, 50))).toBe(false);
  });

  test('expands by another box', () => {
    const box1 = new BoundingBox(
      new Vector2D(0, 0),
      new Vector2D(50, 50)
    );
    const box2 = new BoundingBox(
      new Vector2D(25, 25),
      new Vector2D(100, 100)
    );
    
    box1.expand(box2);
    expect(box1.max.x).toBe(100);
    expect(box1.max.y).toBe(100);
  });
});
```

### Критерии выполнения
- [ ] Vector2D с всеми операциями
- [ ] BoundingBox с всеми методами
- [ ] Все методы протестированы
- [ ] Покрытие > 90%

---

## Milestone Фазы 2

После завершения проверьте:

### Функциональность
- [ ] Отображаются LINE, POLYLINE, CIRCLE, ARC
- [ ] Полилинии с bulge (дугами) работают
- [ ] Типы линий отображаются правильно
- [ ] Цвета AutoCAD корректно маппятся

### Тесты
- [ ] Все тесты проходят
- [ ] Покрытие > 75%

### Пример работает
```javascript
const viewer = new DXFViewer({ container: '#viewer' });
await viewer.loadFile('test-primitives.dxf');
viewer.fitToScreen();

// Должны отображаться все примитивы
```

**Фаза 2 завершена** ✅
