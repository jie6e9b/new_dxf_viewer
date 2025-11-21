import DXFReader from '../../../src/core/parser/DXFReader';

describe('DXFReader', () => {
  describe('Basic parsing', () => {
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

      expect(groups).toHaveLength(4);
      expect(groups[0]).toEqual({ code: 0, value: 'LINE' });
      expect(groups[1]).toEqual({ code: 8, value: 'Layer1' });
      expect(groups[2]).toEqual({ code: 10, value: 0.0 });
      expect(groups[3]).toEqual({ code: 20, value: 0.0 });
    });

    test('parses different value types correctly', () => {
      const dxf = `0
TEXT
1
Hello World
10
123.45
70
1
8
Layer0`;

      const reader = new DXFReader(dxf);
      const groups = reader.readGroups();

      expect(groups[0].value).toBe('TEXT'); // String (code 0)
      expect(groups[1].value).toBe('Hello World'); // String (code 1)
      expect(groups[2].value).toBe(123.45); // Float (code 10)
      expect(typeof groups[2].value).toBe('number');
      expect(groups[3].value).toBe(1); // Integer (code 70)
      expect(typeof groups[3].value).toBe('number');
      expect(groups[4].value).toBe('Layer0'); // String (code 8)
    });

    test('handles empty file', () => {
      const reader = new DXFReader('');
      const groups = reader.readGroups();
      expect(groups).toHaveLength(0);
    });

    test('handles Windows line endings (CRLF)', () => {
      const dxf = "0\r\nLINE\r\n8\r\nLayer1\r\n10\r\n100.5";
      const reader = new DXFReader(dxf);
      const groups = reader.readGroups();

      expect(groups).toHaveLength(3);
      expect(groups[0].value).toBe('LINE');
      expect(groups[1].value).toBe('Layer1');
      expect(groups[2].value).toBe(100.5);
    });

    test('handles Unix line endings (LF)', () => {
      const dxf = "0\nLINE\n8\nLayer1";
      const reader = new DXFReader(dxf);
      const groups = reader.readGroups();

      expect(groups).toHaveLength(2);
      expect(groups[0].value).toBe('LINE');
      expect(groups[1].value).toBe('Layer1');
    });
  });

  describe('Value type parsing', () => {
    test('parses string values (codes 0-9)', () => {
      const dxf = `0
SECTION
1
TextValue
2
Name
8
Layer`;

      const reader = new DXFReader(dxf);
      const groups = reader.readGroups();

      groups.forEach(group => {
        expect(typeof group.value).toBe('string');
      });
    });

    test('parses float values (codes 10-59)', () => {
      const dxf = `10
100.5
20
-50.25
40
3.14159`;

      const reader = new DXFReader(dxf);
      const groups = reader.readGroups();

      expect(groups[0].value).toBe(100.5);
      expect(groups[1].value).toBe(-50.25);
      expect(groups[2].value).toBeCloseTo(3.14159);
      groups.forEach(group => {
        expect(typeof group.value).toBe('number');
      });
    });

    test('parses float values (codes 210-239)', () => {
      const dxf = `210
1.0
220
0.0
230
0.0`;

      const reader = new DXFReader(dxf);
      const groups = reader.readGroups();

      expect(groups[0].value).toBe(1.0);
      expect(groups[1].value).toBe(0.0);
      expect(groups[2].value).toBe(0.0);
    });

    test('parses integer values (codes 60-99)', () => {
      const dxf = `60
1
70
256
90
42`;

      const reader = new DXFReader(dxf);
      const groups = reader.readGroups();

      expect(groups[0].value).toBe(1);
      expect(groups[1].value).toBe(256);
      expect(groups[2].value).toBe(42);
      groups.forEach(group => {
        expect(Number.isInteger(group.value)).toBe(true);
      });
    });

    test('handles whitespace in values', () => {
      const dxf = `0
  LINE
8
  Layer1
10
  123.45  `;

      const reader = new DXFReader(dxf);
      const groups = reader.readGroups();

      expect(groups[0].value).toBe('LINE');
      expect(groups[1].value).toBe('Layer1');
      expect(groups[2].value).toBe(123.45);
    });
  });

  describe('Position management', () => {
    test('tracks position correctly', () => {
      const dxf = `0
LINE
8
Layer1`;

      const reader = new DXFReader(dxf);
      expect(reader.getPosition()).toBe(0);

      reader.readGroup();
      expect(reader.getPosition()).toBe(2); // Read 2 lines

      reader.readGroup();
      expect(reader.getPosition()).toBe(4); // Read 2 more lines
    });

    test('detects EOF correctly', () => {
      const dxf = `0
LINE`;

      const reader = new DXFReader(dxf);
      expect(reader.isEOF()).toBe(false);

      reader.readGroups();
      expect(reader.isEOF()).toBe(true);
    });

    test('can reset position', () => {
      const dxf = `0
LINE
8
Layer1`;

      const reader = new DXFReader(dxf);
      reader.readGroups();
      expect(reader.isEOF()).toBe(true);

      reader.reset();
      expect(reader.isEOF()).toBe(false);
      expect(reader.getPosition()).toBe(0);

      // Should be able to read again
      const groups = reader.readGroups();
      expect(groups).toHaveLength(2);
    });

    test('can set position manually', () => {
      const dxf = `0
LINE
8
Layer1
10
100`;

      const reader = new DXFReader(dxf);
      reader.setPosition(2); // Skip first group

      const groups = reader.readGroups();
      expect(groups).toHaveLength(2); // Should read remaining 2 groups
      expect(groups[0]).toEqual({ code: 8, value: 'Layer1' });
    });

    test('setPosition handles out of bounds', () => {
      const dxf = `0
LINE`;

      const reader = new DXFReader(dxf);

      // Negative position
      reader.setPosition(-5);
      expect(reader.getPosition()).toBe(0);

      // Beyond file length
      reader.setPosition(1000);
      expect(reader.getPosition()).toBe(reader.lines.length);
    });
  });

  describe('Edge cases', () => {
    test('handles file with only whitespace', () => {
      const reader = new DXFReader('   \n  \n   ');
      const groups = reader.readGroups();

      // Should parse but values might be empty/invalid
      expect(Array.isArray(groups)).toBe(true);
    });

    test('handles incomplete group (odd number of lines)', () => {
      const dxf = `0
LINE
8`;

      const reader = new DXFReader(dxf);
      const groups = reader.readGroups();

      // Should only get complete groups (last incomplete group is ignored)
      expect(groups).toHaveLength(1);
      expect(groups[0]).toEqual({ code: 0, value: 'LINE' });
    });

    test('handles zero values', () => {
      const dxf = `10
0
20
0.0
70
0`;

      const reader = new DXFReader(dxf);
      const groups = reader.readGroups();

      expect(groups[0].value).toBe(0);
      expect(groups[1].value).toBe(0.0);
      expect(groups[2].value).toBe(0);
    });

    test('handles negative numbers', () => {
      const dxf = `10
-100.5
70
-42`;

      const reader = new DXFReader(dxf);
      const groups = reader.readGroups();

      expect(groups[0].value).toBe(-100.5);
      expect(groups[1].value).toBe(-42);
    });

    test('handles scientific notation', () => {
      const dxf = `10
1.23e-5
20
-4.56E+10`;

      const reader = new DXFReader(dxf);
      const groups = reader.readGroups();

      expect(groups[0].value).toBeCloseTo(1.23e-5);
      expect(groups[1].value).toBeCloseTo(-4.56e+10);
    });
  });
});
