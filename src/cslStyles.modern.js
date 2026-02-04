/**
 * Modern replacement for cslStyles.js
 * Provides backward-compatible API while using the new styleLoader internally
 */

import { styleLoader } from './styleLoader.js';

// Cache for loaded data
let initialized = false;

// This is the style to load in the Visual Editor on first run,
// or if the settings are reset
const defaultStyleId = 'http://www.zotero.org/styles/american-medical-association';

// A list of popular styles
const topStyles = [
  'http://www.zotero.org/styles/american-medical-association',
  'http://www.zotero.org/styles/apa',
  'http://www.zotero.org/styles/ieee',
  'http://www.zotero.org/styles/harvard-cite-them-right',
  'http://www.zotero.org/styles/nature',
  'http://www.zotero.org/styles/chicago-author-date',
  'http://www.zotero.org/styles/american-political-science-association',
  'http://www.zotero.org/styles/nlm-citation-sequence',
  'http://www.zotero.org/styles/american-sociological-association',
  'http://www.zotero.org/styles/modern-language-association',
  'http://www.zotero.org/styles/mhra-notes',
  'http://www.zotero.org/styles/chicago-shortened-notes-bibliography',
  'http://www.zotero.org/styles/associacao-brasileira-de-normas-tecnicas',
  'http://www.zotero.org/styles/chicago-notes-bibliography',
  'http://www.zotero.org/styles/american-chemical-society',
  'http://www.zotero.org/styles/cell',
  'http://www.zotero.org/styles/science',
  'http://www.zotero.org/styles/elsevier-with-titles',
  'http://www.zotero.org/styles/ecology',
  'http://www.zotero.org/styles/elsevier-harvard',
  'http://www.zotero.org/styles/royal-society-of-chemistry',
  'http://www.zotero.org/styles/pnas'
];

/**
 * Initialize the style system
 * Must be called before using other functions
 */
async function init() {
  if (initialized) {
    return;
  }

  await styleLoader.init();
  initialized = true;
}

/**
 * Returns a normalised style title for use in generated style ID and filename
 * Matches the current practice in the CSL style repository
 */
function getNormalisedStyleTitle(styleTitle) {
  return styleTitle
    .replace(/&/g, "and")
    .replace(/\([A-Z]*\)/g, "") // remove upper case text (acronyms) in parentheses
    .replace(/\([^(]*\)$/, "") //remove content between last set of parentheses
    .replace(/\[[^\[]*\]$/, "") //remove content between last set of square parentheses
    .replace(/[()[\]]/g, "") // remove other parentheses
    .replace(/[,'.]/g, "")     // remove other chars
    .replace(/[\\/:\"*?<>| ]+/g, "-")
    .replace(/--+/g, "-")
    .replace(/-$/, "")
    .toLowerCase()
    .replace(/[àáäâãáà]/g, "a")
    .replace(/[èéëêéè]/g, "e")
    .replace(/[ìíïî]/g, "i")
    .replace(/[òóöô]/g, "o")
    .replace(/[ùúüû]/g, "u")
    .replace(/[ñ]/g, "n")
    .replace(/[çç]/g, "c");
}

/**
 * Returns a style ID based on the given styleTitle
 */
function generateStyleId(styleTitle) {
  return "http://www.zotero.org/styles/" + getNormalisedStyleTitle(styleTitle);
}

/**
 * Get the master ID for a style (resolves dependent styles)
 */
function getMasterIdFromId(styleId) {
  if (!initialized) {
    throw new Error('CSL Styles not initialized. Call init() first.');
  }

  return styleLoader.getMasterId(styleId);
}

/**
 * Get the title for a style ID
 */
function getStyleTitle(styleId) {
  if (!initialized) {
    throw new Error('CSL Styles not initialized. Call init() first.');
  }

  return styleLoader.getStyleTitle(styleId);
}

/**
 * Load a style's CSL XML content
 */
async function loadStyleXml(styleId) {
  if (!initialized) {
    await init();
  }

  const styleData = await styleLoader.loadStyle(styleId);
  return styleData.csl;
}

/**
 * Get all style IDs
 */
function getAllStyleIds() {
  if (!initialized) {
    throw new Error('CSL Styles not initialized. Call init() first.');
  }

  return styleLoader.getAllStyleIds();
}

/**
 * Get all independent style IDs
 */
function getIndependentStyleIds() {
  if (!initialized) {
    throw new Error('CSL Styles not initialized. Call init() first.');
  }

  return styleLoader.getIndependentStyleIds();
}

/**
 * Search for styles by title
 */
function searchByTitle(query) {
  if (!initialized) {
    throw new Error('CSL Styles not initialized. Call init() first.');
  }

  return styleLoader.searchByTitle(query);
}

/**
 * Get statistics about the style repository
 */
function getStats() {
  if (!initialized) {
    throw new Error('CSL Styles not initialized. Call init() first.');
  }

  return styleLoader.getStats();
}

// Export the API
export default {
  init,
  getNormalisedStyleTitle,
  generateStyleId,
  getMasterIdFromId,
  getStyleTitle,
  loadStyleXml,
  getAllStyleIds,
  getIndependentStyleIds,
  searchByTitle,
  getStats,
  defaultStyleId,
  topStyles
};

// Named exports for modern imports
export {
  init,
  getNormalisedStyleTitle,
  generateStyleId,
  getMasterIdFromId,
  getStyleTitle,
  loadStyleXml,
  getAllStyleIds,
  getIndependentStyleIds,
  searchByTitle,
  getStats,
  defaultStyleId,
  topStyles
};
