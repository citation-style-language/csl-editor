/**
 * Modern style loader with IndexedDB caching
 * Replaces the monolithic JSON file approach with on-demand loading
 */

import { get, set, del, clear } from 'idb-keyval';

const CACHE_VERSION = '2.0.0';
const CACHE_KEY_PREFIX = 'csl-style-';
const INDEX_CACHE_KEY = 'csl-style-index';

// Default paths (can be overridden via setBasePath)
let STYLES_BASE_URL = './generated/styles/';
let INDEX_URL = './generated/styleIndex.json';

class StyleLoader {
  constructor() {
    this.styleIndex = null;
    this.loadingPromises = new Map();
  }

  /**
   * Set the base path for loading styles
   * Useful when the library is used in different contexts
   * @param {string} basePath - e.g., '/cslEditorLib/' or './'
   */
  setBasePath(basePath) {
    STYLES_BASE_URL = basePath + 'generated/styles/';
    INDEX_URL = basePath + 'generated/styleIndex.json';
  }

  /**
   * Initialize the style loader by loading the style index
   */
  async init() {
    if (this.styleIndex) {
      return this.styleIndex;
    }

    // Try to load from cache first
    const cached = await get(INDEX_CACHE_KEY);
    if (cached && cached.version === CACHE_VERSION) {
      this.styleIndex = cached.data;
      return this.styleIndex;
    }

    // Load from network
    try {
      const response = await fetch(INDEX_URL);
      if (!response.ok) {
        throw new Error(`Failed to load style index: ${response.statusText}`);
      }

      const data = await response.json();
      this.styleIndex = data;

      // Cache for future use
      await set(INDEX_CACHE_KEY, {
        version: CACHE_VERSION,
        data: data,
        timestamp: Date.now()
      });

      return this.styleIndex;
    } catch (err) {
      console.error('Error loading style index:', err);
      throw err;
    }
  }

  /**
   * Get the master (independent) style ID for any style ID
   */
  getMasterId(styleId) {
    if (!this.styleIndex) {
      throw new Error('Style index not loaded. Call init() first.');
    }

    return this.styleIndex.masterIdFromId[styleId] || styleId;
  }

  /**
   * Get the title for a style ID
   */
  getStyleTitle(styleId) {
    if (!this.styleIndex) {
      throw new Error('Style index not loaded. Call init() first.');
    }

    return this.styleIndex.styleTitleFromId[styleId] || 'Unknown Style';
  }

  /**
   * Check if a style is dependent (has a different master ID)
   */
  isDependent(styleId) {
    const masterId = this.getMasterId(styleId);
    return masterId !== styleId;
  }

  /**
   * Load a style's CSL content
   * Returns the actual CSL XML content for independent styles
   */
  async loadStyle(styleId) {
    // If this is a dependent style, load the master instead
    const masterId = this.getMasterId(styleId);

    // Check if we're already loading this style
    if (this.loadingPromises.has(masterId)) {
      return this.loadingPromises.get(masterId);
    }

    // Create a loading promise
    const loadingPromise = this._loadStyleInternal(masterId);
    this.loadingPromises.set(masterId, loadingPromise);

    try {
      const result = await loadingPromise;
      return result;
    } finally {
      this.loadingPromises.delete(masterId);
    }
  }

  async _loadStyleInternal(styleId) {
    const cacheKey = CACHE_KEY_PREFIX + styleId;

    // Try to load from cache first
    const cached = await get(cacheKey);
    if (cached && cached.version === CACHE_VERSION) {
      return cached.data;
    }

    // Get the filename for this style
    const fileName = this.styleIndex.styleFileFromId[styleId];
    if (!fileName) {
      throw new Error(`Style not found: ${styleId}`);
    }

    // Load from network
    const url = `${STYLES_BASE_URL}${fileName}.json`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load style: ${response.statusText}`);
      }

      const styleData = await response.json();

      // Cache for future use
      await set(cacheKey, {
        version: CACHE_VERSION,
        data: styleData,
        timestamp: Date.now()
      });

      return styleData;
    } catch (err) {
      console.error(`Error loading style ${styleId}:`, err);
      throw err;
    }
  }

  /**
   * Load multiple styles in parallel
   */
  async loadStyles(styleIds) {
    const promises = styleIds.map(id => this.loadStyle(id));
    return Promise.all(promises);
  }

  /**
   * Search for styles by title
   */
  searchByTitle(query) {
    if (!this.styleIndex) {
      throw new Error('Style index not loaded. Call init() first.');
    }

    const normalizedQuery = query.toLowerCase();
    const results = [];

    for (const [styleId, title] of Object.entries(this.styleIndex.styleTitleFromId)) {
      if (title.toLowerCase().includes(normalizedQuery)) {
        results.push({
          id: styleId,
          title: title,
          masterId: this.getMasterId(styleId),
          isDependent: this.isDependent(styleId)
        });
      }
    }

    return results;
  }

  /**
   * Get all style IDs
   */
  getAllStyleIds() {
    if (!this.styleIndex) {
      throw new Error('Style index not loaded. Call init() first.');
    }

    return Object.keys(this.styleIndex.styleTitleFromId);
  }

  /**
   * Get all independent (master) style IDs
   */
  getIndependentStyleIds() {
    if (!this.styleIndex) {
      throw new Error('Style index not loaded. Call init() first.');
    }

    const independent = [];
    for (const [styleId, masterId] of Object.entries(this.styleIndex.masterIdFromId)) {
      if (styleId === masterId) {
        independent.push(styleId);
      }
    }

    return independent;
  }

  /**
   * Clear all cached styles
   */
  async clearCache() {
    await clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    if (!this.styleIndex) {
      return null;
    }

    return {
      totalStyles: this.styleIndex.totalStyles,
      independentStyles: this.styleIndex.independentStyles,
      dependentStyles: this.styleIndex.dependentStyles,
      generatedAt: this.styleIndex.generatedAt
    };
  }
}

// Export a singleton instance
export const styleLoader = new StyleLoader();

// Also export the class for testing
export { StyleLoader };
