/**
 * DXF Reader - reads and parses DXF file content
 *
 * DXF files consist of group code-value pairs:
 * - Group code (0-999) indicates the data type
 * - Value is the actual data
 *
 * Group code ranges:
 * - 0-9: Text/string values
 * - 10-59: Floating point (coordinates, dimensions)
 * - 60-99: Integer values
 * - 210-239: Floating point (direction vectors)
 */
class DXFReader {
  constructor(content) {
    this.content = content;
    this.lines = content.split(/\r?\n/);
    this.position = 0;
  }

  /**
   * Read all group codes and values from the file
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
   * @returns {Object|null} {code, value} or null if EOF
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
   * Parse value based on group code type
   * @param {number} code - Group code
   * @param {string} value - Raw string value
   * @returns {string|number} Parsed value
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

    // Integer values (60-99, 170-179)
    if ((code >= 60 && code <= 99) || (code >= 170 && code <= 179)) {
      return parseInt(value, 10);
    }

    // 100-109: String values
    if (code >= 100 && code <= 109) {
      return value;
    }

    // Default: string
    return value;
  }

  /**
   * Read single line from file
   * @returns {string|null} Line content or null if EOF
   */
  readLine() {
    if (this.isEOF()) {
      return null;
    }
    return this.lines[this.position++];
  }

  /**
   * Check if end of file reached
   * @returns {boolean} True if EOF
   */
  isEOF() {
    return this.position >= this.lines.length;
  }

  /**
   * Reset position to beginning
   */
  reset() {
    this.position = 0;
  }

  /**
   * Get current position in file
   * @returns {number} Current line number
   */
  getPosition() {
    return this.position;
  }

  /**
   * Skip to specific position
   * @param {number} position - Target position
   */
  setPosition(position) {
    this.position = Math.max(0, Math.min(position, this.lines.length));
  }
}

export default DXFReader;
