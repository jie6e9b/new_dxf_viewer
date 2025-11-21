/**
 * DXF Viewer Library
 * Main entry point
 */

import DXFViewer from './DXFViewer.js';

// Export main class
export default DXFViewer;

// Also export for CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DXFViewer;
  module.exports.default = DXFViewer;
}
