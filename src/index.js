/**
 * CSL Editor Library - Main Entry Point
 * Modern ES module version
 */

// Core modules
import * as cslStyles from './cslStyles.modern.js';
import { styleLoader } from './styleLoader.js';

// Re-export for backward compatibility
export { cslStyles, styleLoader };

// Create a namespace object for UMD builds
export default {
  cslStyles,
  styleLoader,
  version: '2.0.0'
};

/**
 * Initialize the library
 * This should be called before using any other functionality
 */
export async function init() {
  await cslStyles.init();
}
