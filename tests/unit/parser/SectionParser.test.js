import DXFReader from '../../../src/core/parser/DXFReader';
import SectionParser from '../../../src/core/parser/SectionParser';

describe('SectionParser', () => {
  describe('Section splitting', () => {
    test('splits DXF into multiple sections', () => {
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
10
0
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
      expect(sections.ENTITIES.length).toBeGreaterThan(0);
    });

    test('handles empty sections', () => {
      const dxf = `0
SECTION
2
HEADER
0
ENDSEC
0
SECTION
2
ENTITIES
0
ENDSEC`;

      const reader = new DXFReader(dxf);
      const parser = new SectionParser(reader);
      const sections = parser.parse();

      expect(sections.HEADER).toEqual([]);
      expect(sections.ENTITIES).toEqual([]);
    });

    test('handles DXF without sections', () => {
      const dxf = `0
LINE
8
Layer1`;

      const reader = new DXFReader(dxf);
      const parser = new SectionParser(reader);
      const sections = parser.parse();

      expect(Object.keys(sections).length).toBe(0);
    });
  });

  describe('HEADER section parsing', () => {
    test('parses header variables', () => {
      const groups = [
        { code: 9, value: '$ACADVER' },
        { code: 1, value: 'AC1015' },
        { code: 9, value: '$INSUNITS' },
        { code: 70, value: 4 },
        { code: 9, value: '$EXTMIN' },
        { code: 10, value: 0.0 }
      ];

      const reader = new DXFReader('');
      const parser = new SectionParser(reader);
      const header = parser.parseHeader(groups);

      expect(header.$ACADVER).toBe('AC1015');
      expect(header.$INSUNITS).toBe(4);
      expect(header.$EXTMIN).toBe(0.0);
    });

    test('handles empty header', () => {
      const reader = new DXFReader('');
      const parser = new SectionParser(reader);
      const header = parser.parseHeader([]);

      expect(Object.keys(header).length).toBe(0);
    });

    test('ignores non-variable groups', () => {
      const groups = [
        { code: 0, value: 'SECTION' },
        { code: 2, value: 'HEADER' },
        { code: 9, value: '$ACADVER' },
        { code: 1, value: 'AC1015' }
      ];

      const reader = new DXFReader('');
      const parser = new SectionParser(reader);
      const header = parser.parseHeader(groups);

      expect(Object.keys(header).length).toBe(1);
      expect(header.$ACADVER).toBe('AC1015');
    });
  });

  describe('ENTITIES section parsing', () => {
    test('parses multiple entities', () => {
      const groups = [
        { code: 0, value: 'LINE' },
        { code: 8, value: 'Layer1' },
        { code: 10, value: 0 },
        { code: 20, value: 0 },
        { code: 0, value: 'CIRCLE' },
        { code: 8, value: 'Layer2' },
        { code: 10, value: 100 },
        { code: 40, value: 50 }
      ];

      const reader = new DXFReader('');
      const parser = new SectionParser(reader);
      const entities = parser.parseEntities(groups);

      expect(entities).toHaveLength(2);
      expect(entities[0].type).toBe('LINE');
      expect(entities[0].data).toHaveLength(3);
      expect(entities[1].type).toBe('CIRCLE');
      expect(entities[1].data).toHaveLength(3);
    });

    test('handles single entity', () => {
      const groups = [
        { code: 0, value: 'LINE' },
        { code: 8, value: 'Layer1' },
        { code: 10, value: 0 }
      ];

      const reader = new DXFReader('');
      const parser = new SectionParser(reader);
      const entities = parser.parseEntities(groups);

      expect(entities).toHaveLength(1);
      expect(entities[0].type).toBe('LINE');
      expect(entities[0].data).toHaveLength(2);
    });

    test('handles empty entities section', () => {
      const reader = new DXFReader('');
      const parser = new SectionParser(reader);
      const entities = parser.parseEntities([]);

      expect(entities).toHaveLength(0);
    });

    test('preserves entity data order', () => {
      const groups = [
        { code: 0, value: 'LINE' },
        { code: 8, value: 'Layer1' },
        { code: 10, value: 0 },
        { code: 20, value: 10 },
        { code: 11, value: 100 },
        { code: 21, value: 110 }
      ];

      const reader = new DXFReader('');
      const parser = new SectionParser(reader);
      const entities = parser.parseEntities(groups);

      expect(entities[0].data[0]).toEqual({ code: 8, value: 'Layer1' });
      expect(entities[0].data[1]).toEqual({ code: 10, value: 0 });
      expect(entities[0].data[2]).toEqual({ code: 20, value: 10 });
    });
  });

  describe('TABLES section parsing', () => {
    test('parses multiple tables', () => {
      const groups = [
        { code: 0, value: 'TABLE' },
        { code: 2, value: 'LAYER' },
        { code: 0, value: 'LAYER' },
        { code: 2, value: 'Layer1' },
        { code: 70, value: 0 },
        { code: 0, value: 'ENDTAB' },
        { code: 0, value: 'TABLE' },
        { code: 2, value: 'LTYPE' },
        { code: 0, value: 'LTYPE' },
        { code: 2, value: 'CONTINUOUS' },
        { code: 0, value: 'ENDTAB' }
      ];

      const reader = new DXFReader('');
      const parser = new SectionParser(reader);
      const tables = parser.parseTables(groups);

      expect(tables.LAYER).toBeDefined();
      expect(tables.LTYPE).toBeDefined();
      expect(tables.LAYER).toHaveLength(1);
      expect(tables.LTYPE).toHaveLength(1);
    });

    test('parses table entries', () => {
      const groups = [
        { code: 0, value: 'TABLE' },
        { code: 2, value: 'LAYER' },
        { code: 0, value: 'LAYER' },
        { code: 2, value: 'Layer1' },
        { code: 62, value: 7 },
        { code: 70, value: 0 },
        { code: 0, value: 'LAYER' },
        { code: 2, value: 'Layer2' },
        { code: 62, value: 1 },
        { code: 0, value: 'ENDTAB' }
      ];

      const reader = new DXFReader('');
      const parser = new SectionParser(reader);
      const tables = parser.parseTables(groups);

      expect(tables.LAYER).toHaveLength(2);
      expect(tables.LAYER[0].type).toBe('LAYER');
      expect(tables.LAYER[0].data).toHaveLength(3);
      expect(tables.LAYER[1].type).toBe('LAYER');
      expect(tables.LAYER[1].data).toHaveLength(2);
    });

    test('handles empty tables section', () => {
      const reader = new DXFReader('');
      const parser = new SectionParser(reader);
      const tables = parser.parseTables([]);

      expect(Object.keys(tables).length).toBe(0);
    });

    test('handles table with no entries', () => {
      const groups = [
        { code: 0, value: 'TABLE' },
        { code: 2, value: 'LAYER' },
        { code: 0, value: 'ENDTAB' }
      ];

      const reader = new DXFReader('');
      const parser = new SectionParser(reader);
      const tables = parser.parseTables(groups);

      expect(tables.LAYER).toEqual([]);
    });
  });

  describe('BLOCKS section parsing', () => {
    test('parses block definitions', () => {
      const groups = [
        { code: 0, value: 'BLOCK' },
        { code: 2, value: 'MyBlock' },
        { code: 10, value: 0 },
        { code: 20, value: 0 },
        { code: 0, value: 'LINE' },
        { code: 10, value: 0 },
        { code: 20, value: 0 },
        { code: 0, value: 'ENDBLK' }
      ];

      const reader = new DXFReader('');
      const parser = new SectionParser(reader);
      const blocks = parser.parseBlocks(groups);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('BLOCK');
      expect(blocks[0].data.length).toBeGreaterThan(0);
      expect(blocks[0].entities).toHaveLength(1);
      expect(blocks[0].entities[0].type).toBe('LINE');
    });

    test('handles multiple blocks', () => {
      const groups = [
        { code: 0, value: 'BLOCK' },
        { code: 2, value: 'Block1' },
        { code: 0, value: 'LINE' },
        { code: 10, value: 0 },
        { code: 0, value: 'ENDBLK' },
        { code: 0, value: 'BLOCK' },
        { code: 2, value: 'Block2' },
        { code: 0, value: 'CIRCLE' },
        { code: 10, value: 50 },
        { code: 0, value: 'ENDBLK' }
      ];

      const reader = new DXFReader('');
      const parser = new SectionParser(reader);
      const blocks = parser.parseBlocks(groups);

      expect(blocks).toHaveLength(2);
      expect(blocks[0].entities[0].type).toBe('LINE');
      expect(blocks[1].entities[0].type).toBe('CIRCLE');
    });

    test('handles empty blocks section', () => {
      const reader = new DXFReader('');
      const parser = new SectionParser(reader);
      const blocks = parser.parseBlocks([]);

      expect(blocks).toHaveLength(0);
    });
  });

  describe('Integration tests', () => {
    test('parses complete DXF file', () => {
      const dxf = `0
SECTION
2
HEADER
9
$ACADVER
1
AC1015
9
$INSUNITS
70
4
0
ENDSEC
0
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
0
62
7
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
CIRCLE
8
0
10
50
20
50
40
25
0
ENDSEC
0
EOF`;

      const reader = new DXFReader(dxf);
      const parser = new SectionParser(reader);
      const sections = parser.parse();

      // Check all sections are present
      expect(sections.HEADER).toBeDefined();
      expect(sections.TABLES).toBeDefined();
      expect(sections.ENTITIES).toBeDefined();

      // Parse each section
      const header = parser.parseHeader(sections.HEADER);
      expect(header.$ACADVER).toBe('AC1015');
      expect(header.$INSUNITS).toBe(4);

      const tables = parser.parseTables(sections.TABLES);
      expect(tables.LAYER).toHaveLength(1);

      const entities = parser.parseEntities(sections.ENTITIES);
      expect(entities).toHaveLength(2);
      expect(entities[0].type).toBe('LINE');
      expect(entities[1].type).toBe('CIRCLE');
    });
  });
});
