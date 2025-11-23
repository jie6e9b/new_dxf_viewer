import Entity from './Entity.js';

/**
 * MTEXT entity
 * Represents multi-line text with inline formatting
 */
class MTextEntity extends Entity {
  constructor() {
    super('MTEXT');
    this.position = { x: 0, y: 0, z: 0 }; // Insertion point
    this.height = 1.0; // Text height (nominal)
    this.text = ''; // Raw text content with formatting codes
    this.width = 0; // Column width (0 = no column)
    this.rotation = 0; // Rotation angle in degrees
    this.style = 'STANDARD'; // Text style name
    this.attachmentPoint = 1; // 1=top-left, 2=top-center, 3=top-right, etc. (3x3 grid)
    this.drawingDirection = 1; // 1=left-to-right, 3=top-to-bottom, 5=by-style

    // Parsed content (plain text without formatting)
    this.plainText = '';

    // Parsed lines for rendering
    this.lines = [];
  }

  /**
   * Parse MTEXT entity data
   * @param {Array} data - Group code-value pairs
   * @returns {MTextEntity}
   */
  static fromData(data) {
    const mtext = new MTextEntity();
    mtext.parseCommon(data);

    let textBuffer = '';

    for (const group of data) {
      switch (group.code) {
        case 1: // Text content (main)
          textBuffer += group.value;
          break;
        case 3: // Additional text content (for long text)
          textBuffer += group.value;
          break;
        case 7: // Text style name
          mtext.style = group.value;
          break;
        case 10: // Insertion point X
          mtext.position.x = group.value;
          break;
        case 20: // Insertion point Y
          mtext.position.y = group.value;
          break;
        case 30: // Insertion point Z
          mtext.position.z = group.value;
          break;
        case 40: // Nominal text height
          mtext.height = group.value;
          break;
        case 41: // Column width
          mtext.width = group.value;
          break;
        case 50: // Rotation angle
          mtext.rotation = group.value;
          break;
        case 71: // Attachment point
          mtext.attachmentPoint = group.value;
          break;
        case 72: // Drawing direction
          mtext.drawingDirection = group.value;
          break;
      }
    }

    // Store raw text and parse it
    mtext.text = textBuffer;
    mtext.parseText();

    return mtext;
  }

  /**
   * Parse MTEXT formatting codes and extract plain text
   */
  parseText() {
    let text = this.text;

    // Replace special characters
    text = this.replaceSpecialChars(text);

    // Replace formatting codes
    text = this.removeFormatting(text);

    // Split into lines
    const lines = text.split('\\P');
    this.lines = lines.map(line => line.trim()).filter(line => line.length > 0);

    // Store plain text
    this.plainText = this.lines.join('\n');
  }

  /**
   * Replace AutoCAD special characters
   * @param {string} text - Text with special chars
   * @returns {string} Text with replacements
   */
  replaceSpecialChars(text) {
    const replacements = {
      '%%d': '°',  // Degree symbol
      '%%D': '°',
      '%%p': '±',  // Plus-minus
      '%%P': '±',
      '%%c': '⌀',  // Diameter
      '%%C': '⌀',
      '%%u': '',   // Underscore toggle (start/end)
      '%%U': '',
      '%%o': '',   // Overscore toggle (start/end)
      '%%O': '',
      '%%%': '%',  // Percent sign
    };

    for (const [code, replacement] of Object.entries(replacements)) {
      text = text.replace(new RegExp(code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement);
    }

    return text;
  }

  /**
   * Remove MTEXT formatting codes
   * @param {string} text - Text with formatting
   * @returns {string} Plain text
   */
  removeFormatting(text) {
    // Remove font changes: \f<fontname>|<options>;
    text = text.replace(/\\f[^;]*;/g, '');

    // Remove font height: \H<value>x or \H<value>; (with semicolon)
    text = text.replace(/\\H[\d.]+x?;?/g, '');

    // Remove color changes: \C<index>; or \c<truecolor>;
    text = text.replace(/\\[Cc][\d]+;/g, '');

    // Remove width factor: \W<value>;
    text = text.replace(/\\W[\d.]+;/g, '');

    // Remove tracking: \T<value>;
    text = text.replace(/\\T[\d.]+;/g, '');

    // Remove oblique angle: \Q<value>;
    text = text.replace(/\\Q[\d.]+;/g, '');

    // Remove stacking: \S<text>^<text>;
    text = text.replace(/\\S([^^;]*)\^([^;]*);/g, '$1/$2');

    // Remove alignment: \A<value>;
    text = text.replace(/\\A\d;/g, '');

    // Remove line spacing: \L or \l
    text = text.replace(/\\[Ll]/g, '');

    // Remove paragraph properties: \p<props>;
    text = text.replace(/\\p[^;]*;/g, '');

    // Remove unicode: \U+<code>
    text = text.replace(/\\U\+[\dA-Fa-f]+/g, (match) => {
      const code = parseInt(match.substring(3), 16);
      return String.fromCharCode(code);
    });

    // Remove other escapes
    text = text.replace(/\\~/g, ' '); // Non-breaking space
    text = text.replace(/\\\\/g, '\\'); // Backslash
    text = text.replace(/\\{/g, '{');
    text = text.replace(/\\}/g, '}');

    return text;
  }

  /**
   * Get bounding box (approximate)
   * @returns {Object} {minX, minY, maxX, maxY}
   */
  getBounds() {
    // Approximate based on text dimensions
    const charWidth = this.height * 0.6;
    const lineHeight = this.height * 1.5; // Line spacing

    // Calculate text dimensions
    const maxLineLength = Math.max(...this.lines.map(line => line.length), 1);
    const textWidth = this.width > 0 ? this.width : maxLineLength * charWidth;
    const textHeight = this.lines.length * lineHeight;

    // Attachment point determines where text is anchored
    // Grid: 1=top-left, 2=top-center, 3=top-right
    //       4=mid-left, 5=mid-center, 6=mid-right
    //       7=bot-left, 8=bot-center, 9=bot-right
    let minX = this.position.x;
    let maxX = this.position.x + textWidth;
    let minY = this.position.y;
    let maxY = this.position.y + textHeight;

    // Adjust for horizontal attachment
    const hAlign = ((this.attachmentPoint - 1) % 3); // 0=left, 1=center, 2=right
    if (hAlign === 1) { // Center
      minX = this.position.x - textWidth / 2;
      maxX = this.position.x + textWidth / 2;
    } else if (hAlign === 2) { // Right
      minX = this.position.x - textWidth;
      maxX = this.position.x;
    }

    // Adjust for vertical attachment
    const vAlign = Math.floor((this.attachmentPoint - 1) / 3); // 0=top, 1=middle, 2=bottom
    if (vAlign === 1) { // Middle
      minY = this.position.y - textHeight / 2;
      maxY = this.position.y + textHeight / 2;
    } else if (vAlign === 2) { // Bottom
      minY = this.position.y - textHeight;
      maxY = this.position.y;
    }

    return { minX, minY, maxX, maxY };
  }

  /**
   * Get number of lines
   * @returns {number}
   */
  getLineCount() {
    return this.lines.length;
  }
}

export default MTextEntity;
