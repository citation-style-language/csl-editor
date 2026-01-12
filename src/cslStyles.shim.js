/**
 * AMD/RequireJS compatibility shim for the modernized cslStyles module
 *
 * This is a simpler approach: We'll dynamically import the ES module using
 * a script tag with type="module", then expose it through AMD.
 */

define(['jquery'], function($) {
	'use strict';

	// This will be populated once the modern library is loaded
	var modernCslStyles = null;
	var modernStyleLoader = null;
	var initializationPromise = null;
	var initialized = false;

	// Create a unique global namespace to receive the module
	var NAMESPACE = '__CSLEditorModern_' + Date.now();

	// Cache for legacy data (loaded on-demand)
	var exampleCitationsCache = null;
	var exampleCitationsLoading = false;
	var stylesDataCache = null;

	// Initialize the modern library by loading the ES module
	function ensureInitialized() {
		if (initializationPromise) {
			return initializationPromise;
		}

		initializationPromise = new Promise(function(resolve, reject) {
			// Determine the base path from the current script location or window.location
			// For demo sites, the base path should include the baseurl (e.g., /csl-editor-site-beta/)
			var basePath = window.CSL_EDITOR_BASE_PATH || '';

			// Create an inline module script that imports the ES module
			var script = document.createElement('script');
			script.type = 'module';
			script.textContent = `
				import { init, cslStyles, styleLoader } from '${basePath}/cslEditorLib/dist/csl-editor.es.js';

				// Configure paths for demo site
				styleLoader.setBasePath('${basePath}/cslEditorLib/');

				// Initialize the library
				await init();

				// Expose on window using our unique namespace
				window['${NAMESPACE}'] = {
					cslStyles: cslStyles,
					styleLoader: styleLoader
				};

				// Signal that we're ready
				window.dispatchEvent(new CustomEvent('csl-editor-ready'));
			`;

			// Listen for the ready event
			var handleReady = function() {
				var lib = window[NAMESPACE];
				if (lib && lib.cslStyles && lib.styleLoader) {
					modernCslStyles = lib.cslStyles;
					modernStyleLoader = lib.styleLoader;
					initialized = true;
					resolve();
				} else {
					reject(new Error('Library loaded but structure is wrong'));
				}
			};

			var handleError = function(event) {
				reject(new Error('Failed to load ES module: ' + (event.message || 'Unknown error')));
			};

			window.addEventListener('csl-editor-ready', handleReady, { once: true });
			window.addEventListener('error', handleError, { once: true });

			script.onerror = function() {
				window.removeEventListener('csl-editor-ready', handleReady);
				window.removeEventListener('error', handleError);
				reject(new Error('Failed to load ES module script'));
			};

			document.head.appendChild(script);
		});

		return initializationPromise;
	}

	// Start loading immediately
	var initReady = ensureInitialized();

	// Expose a shim that provides the old API
	var module = {
		// Promise that resolves when the library is ready
		ready: initReady,

		// Default style ID
		defaultStyleId: 'http://www.zotero.org/styles/apa',

		// Top styles list
		topStyles: [
			'http://www.zotero.org/styles/apa',
			'http://www.zotero.org/styles/ieee',
			'http://www.zotero.org/styles/harvard-cite-them-right',
			'http://www.zotero.org/styles/nature',
			'http://www.zotero.org/styles/american-medical-association',
			'http://www.zotero.org/styles/chicago-author-date',
			'http://www.zotero.org/styles/american-political-science-association',
			'http://www.zotero.org/styles/vancouver',
			'http://www.zotero.org/styles/american-sociological-association',
			'http://www.zotero.org/styles/modern-language-association',
			'http://www.zotero.org/styles/mhra-notes',
			'http://www.zotero.org/styles/chicago-shortened-notes-bibliography',
			'http://www.zotero.org/styles/associacao-brasileira-de-normas-tecnicas',
			'http://www.zotero.org/styles/chicago-notes-bibliography',
			'http://www.zotero.org/styles/national-library-of-medicine',
			'http://www.zotero.org/styles/american-chemical-society',
			'http://www.zotero.org/styles/cell',
			'http://www.zotero.org/styles/science',
			'http://www.zotero.org/styles/elsevier-with-titles',
			'http://www.zotero.org/styles/ecology',
			'http://www.zotero.org/styles/elsevier-harvard',
			'http://www.zotero.org/styles/royal-society-of-chemistry',
			'http://www.zotero.org/styles/journal-of-the-american-chemical-society',
			'http://www.zotero.org/styles/pnas'
		],

		// Synchronous methods (these will work after initialization)
		getNormalisedStyleTitle: function(styleTitle) {
			if (!initialized) {
				console.warn('CSL Editor not yet initialized, returning basic normalization');
				return styleTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
			}
			return modernCslStyles.getNormalisedStyleTitle(styleTitle);
		},

		generateStyleId: function(styleTitle) {
			if (!initialized) {
				return "http://www.zotero.org/styles/" + this.getNormalisedStyleTitle(styleTitle);
			}
			return modernCslStyles.generateStyleId(styleTitle);
		},

		getMasterIdFromId: function(styleId) {
			if (!initialized) {
				console.warn('CSL Editor not yet initialized');
				return styleId;
			}
			return modernCslStyles.getMasterIdFromId(styleId);
		},

		getStyleTitle: function(styleId) {
			if (!initialized) {
				console.warn('CSL Editor not yet initialized');
				return 'Loading...';
			}
			return modernCslStyles.getStyleTitle(styleId);
		},

		getAllStyleIds: function() {
			if (!initialized) {
				console.warn('CSL Editor not yet initialized');
				return [];
			}
			return modernCslStyles.getAllStyleIds();
		},

		getIndependentStyleIds: function() {
			if (!initialized) {
				console.warn('CSL Editor not yet initialized');
				return [];
			}
			return modernCslStyles.getIndependentStyleIds();
		},

		searchByTitle: function(query) {
			if (!initialized) {
				console.warn('CSL Editor not yet initialized');
				return [];
			}
			return modernCslStyles.searchByTitle(query);
		},

		// Async method for loading style XML
		loadStyleXml: function(styleId, callback) {
			if (!initialized) {
				initReady.then(function() {
					modernCslStyles.loadStyleXml(styleId).then(callback);
				});
			} else {
				modernCslStyles.loadStyleXml(styleId).then(callback);
			}
		},

		// Legacy API methods for backward compatibility

		// Returns style metadata (cached to avoid rebuilding)
		styles: function() {
			if (!initialized) {
				console.warn('CSL Editor not yet initialized');
				return { styleTitleFromId: {}, masterIdFromId: {} };
			}

			// Return cached version if available
			if (stylesDataCache) {
				return stylesDataCache;
			}

			// Build the structure once
			var styleIds = modernCslStyles.getAllStyleIds();
			var result = {
				styleTitleFromId: {},
				masterIdFromId: {}
			};

			styleIds.forEach(function(id) {
				result.styleTitleFromId[id] = modernCslStyles.getStyleTitle(id);
				result.masterIdFromId[id] = modernCslStyles.getMasterIdFromId(id);
			});

			// Cache it
			stylesDataCache = result;
			return result;
		},

		// Returns example citations (loads legacy file on-demand)
		exampleCitations: function() {
			// If already loaded, return from cache
			if (exampleCitationsCache) {
				return exampleCitationsCache;
			}

			// If currently loading, return empty object and let it load in background
			if (exampleCitationsLoading) {
				return { exampleCitationsFromMasterId: {} };
			}

			// Load the legacy file synchronously (since the old code expects sync)
			exampleCitationsLoading = true;
			var data = null;
			var basePath = window.CSL_EDITOR_BASE_PATH || '';

			$.ajax({
				url: basePath + '/cslEditorLib/generated/preGeneratedExampleCitations.json',
				dataType: 'json',
				async: false,  // Synchronous for compatibility
				success: function(result) {
					exampleCitationsCache = result;
					data = result;
				},
				error: function() {
					console.error('Failed to load example citations');
					exampleCitationsCache = { exampleCitationsFromMasterId: {} };
					data = exampleCitationsCache;
				}
			});

			exampleCitationsLoading = false;
			return data || { exampleCitationsFromMasterId: {} };
		},

		// Returns URL to default style
		defaultStyleURL: function() {
			return this.localURLFromZoteroId(this.defaultStyleId);
		},

		// Converts style ID to local URL
		localURLFromZoteroId: function(styleId) {
			// Handle undefined or null styleId
			if (!styleId) {
				console.warn('localURLFromZoteroId called with undefined/null styleId');
				return "";
			}

			var basePath = window.CSL_EDITOR_BASE_PATH || '';
			var baseUrl = basePath + "/cslEditorLib/external/csl-styles/";

			// Check if this is a dependent style
			if (initialized) {
				var masterId = modernCslStyles.getMasterIdFromId(styleId);
				if (masterId !== styleId) {
					baseUrl += "dependent/";
				}
			}

			return styleId.replace("http://www.zotero.org/styles/", baseUrl) + ".csl";
		},

		// Fetches CSL code for given style ID
		fetchCslCode: function(styleId, success, error, async) {
			if (typeof async === 'undefined') {
				async = true;
			}

			// Check if styleId is already a URL/path (contains .csl)
			var localURL;
			if (styleId.indexOf('.csl') !== -1) {
				// Already a path, use as-is
				localURL = styleId;
			} else {
				// Convert style ID to path
				localURL = this.localURLFromZoteroId(styleId);
			}

			console.log('fetchCslCode: Loading style from:', localURL);

			$.ajax({
				url: localURL,
				dataType: "text",
				success: function(data) {
					console.log('fetchCslCode: Successfully loaded', styleId);
					if (success) success(data);
				},
				error: function(xhr, status, err) {
					console.error('fetchCslCode: Failed to load', styleId, 'from', localURL, 'Status:', status, 'Error:', err, 'HTTP Status:', xhr.status);
					if (error) error(xhr, status, err);
				},
				async: async
			});
		},

		// Direct access to modern modules (for pages that can handle async)
		_modern: {
			get cslStyles() { return modernCslStyles; },
			get styleLoader() { return modernStyleLoader; }
		}
	};

	return module;
});
