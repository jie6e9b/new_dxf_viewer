import DXFReader from './DXFReader.js';

/**
 * Section Parser - splits DXF file into sections
 *
 * DXF file structure:
 * - HEADER section: File metadata and drawing variables
 * - TABLES section: Layer definitions, linetypes, styles, etc.
 * - BLOCKS section: Block definitions (reusable components)
 * - ENTITIES section: Drawing entities (lines, circles, etc.)
 * - OBJECTS section: Non-graphical objects
 */
class SectionParser {
  constructor(reader) {
    this.reader = reader;
  }

  /**
   * Parse all sections from DXF file
   * @returns {Object} Object with section names as keys and their content as values
   */
  parse() {
    const sections = {};
    const groups = this.reader.readGroups();

    let i = 0;
    while (i < groups.length) {
      const group = groups[i];

      // Look for SECTION start (code 0, value SECTION)
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
   * @param {Array} groups - All groups
   * @param {number} startIndex - Start index in groups array
   * @returns {Object} {groups: Array, endIndex: number}
   */
  extractSection(groups, startIndex) {
    const sectionGroups = [];
    let i = startIndex;

    while (i < groups.length) {
      const group = groups[i];

      // Stop at ENDSEC
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
   * Parse HEADER section into key-value pairs
   * @param {Array} groups - Section groups
   * @returns {Object} Header variables
   */
  parseHeader(groups) {
    const header = {};

    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];

      // Header variables start with $ (code 9)
      if (group.code === 9 && group.value.startsWith('$')) {
        const varName = group.value;

        // Next group(s) contain the value
        if (i + 1 < groups.length) {
          const valueGroup = groups[i + 1];
          header[varName] = valueGroup.value;
          i++; // Skip value group
        }
      }
    }

    return header;
  }

  /**
   * Parse TABLES section
   * @param {Array} groups - Section groups
   * @returns {Object} Tables by name (LAYER, LTYPE, STYLE, etc.)
   */
  parseTables(groups) {
    const tables = {};
    let i = 0;

    while (i < groups.length) {
      const group = groups[i];

      // Look for TABLE start (code 0, value TABLE)
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
   * @param {Array} groups - All groups
   * @param {number} startIndex - Start index
   * @returns {Object} {entries: Array, endIndex: number}
   */
  extractTable(groups, startIndex) {
    const entries = [];
    let currentEntry = null;
    let i = startIndex;

    while (i < groups.length) {
      const group = groups[i];

      if (group.code === 0) {
        if (group.value === 'ENDTAB') {
          // End of table - save last entry
          if (currentEntry) {
            entries.push(currentEntry);
          }
          break;
        } else {
          // Start new entry (except control records)
          if (currentEntry) {
            entries.push(currentEntry);
          }
          currentEntry = { type: group.value, data: [] };
        }
      } else if (currentEntry) {
        // Add data to current entry
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
   * @param {Array} groups - Section groups
   * @returns {Array} Array of entities
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

    // Don't forget last entity
    if (currentEntity) {
      entities.push(currentEntity);
    }

    return entities;
  }

  /**
   * Parse BLOCKS section
   * @param {Array} groups - Section groups
   * @returns {Array} Array of block definitions
   */
  parseBlocks(groups) {
    const blocks = [];
    let currentBlock = null;
    let inBlock = false;

    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];

      if (group.code === 0) {
        if (group.value === 'BLOCK') {
          // Start new block
          if (currentBlock) {
            blocks.push(currentBlock);
          }
          currentBlock = {
            type: 'BLOCK',
            data: [],
            entities: []
          };
          inBlock = true;
        } else if (group.value === 'ENDBLK') {
          // End of block
          if (currentBlock) {
            blocks.push(currentBlock);
            currentBlock = null;
          }
          inBlock = false;
        } else if (inBlock && currentBlock) {
          // Entity inside block
          currentBlock.entities.push({
            type: group.value,
            data: []
          });
        }
      } else if (currentBlock) {
        if (currentBlock.entities.length > 0) {
          // Add to last entity in block
          const lastEntity = currentBlock.entities[currentBlock.entities.length - 1];
          lastEntity.data.push(group);
        } else {
          // Add to block definition
          currentBlock.data.push(group);
        }
      }
    }

    return blocks;
  }
}

export default SectionParser;
