/**
 * AMD/RequireJS compatibility shim for the modernized cslStyles module
 *
 * This wraps the new ES module API to work with the existing RequireJS-based demo site.
 * The old code expects synchronous AMD modules, but the new code requires async initialization.
 *
 * Strategy: Pre-load and initialize the modern library, then provide synchronous wrappers.
 */

define(['jquery'], function($) {
	'use strict';

	// This will be populated once the modern library is loaded
	var modernCslStyles = null;
	var modernStyleLoader = null;
	var initializationPromise = null;

	// Initialize the modern library
	function ensureInitialized() {
		if (initializationPromise) {
			return initializationPromise;
		}

		initializationPromise = new Promise(function(resolve, reject) {
			// Load the UMD build which is easier to integrate with RequireJS
			var script = document.createElement('script');
			script.src = '/cslEditorLib/dist/csl-editor.umd.js';
			script.onload = function() {
				// The UMD build exposes CSLEditor globally
				if (window.CSLEditor) {
					window.CSLEditor.init().then(function() {
						modernCslStyles = window.CSLEditor.cslStyles;
						modernStyleLoader = window.CSLEditor.styleLoader;
						resolve();
					}).catch(reject);
				} else {
					reject(new Error('CSLEditor not found on window'));
				}
			};
			script.onerror = function() {
				reject(new Error('Failed to load CSL Editor library'));
			};
			document.head.appendChild(script);
		});

		return initializationPromise;
	}

	// Start loading immediately
	var initReady = ensureInitialized();

	// Expose a promise for pages that need to wait for initialization
	var module = {
		// Promise that resolves when the library is ready
		ready: initReady,

		// Default style ID
		defaultStyleId: 'http://www.zotero.org/styles/apa',

		// Top styles list
		topStyles: [
			'http://www.zotero.org/styles/apa',
			'http://www.zotero.org/styles/ieee',
			'http://www.zotero.org/styles/harvard1',
			'http://www.zotero.org/styles/nature',
			'http://www.zotero.org/styles/american-medical-association',
			'http://www.zotero.org/styles/chicago-author-date',
			'http://www.zotero.org/styles/american-political-science-association',
			'http://www.zotero.org/styles/vancouver',
			'http://www.zotero.org/styles/american-sociological-association',
			'http://www.zotero.org/styles/modern-language-association',
			'http://www.zotero.org/styles/modern-humanities-research-association',
			'http://www.zotero.org/styles/chicago-fullnote-bibliography',
			'http://www.zotero.org/styles/associacao-brasileira-de-normas-tecnicas',
			'http://www.zotero.org/styles/chicago-note-bibliography',
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
			if (!modernCslStyles) {
				console.warn('CSL Editor not yet initialized, returning basic normalization');
				return styleTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
			}
			return modernCslStyles.getNormalisedStyleTitle(styleTitle);
		},

		generateStyleId: function(styleTitle) {
			if (!modernCslStyles) {
				return "http://www.zotero.org/styles/" + this.getNormalisedStyleTitle(styleTitle);
			}
			return modernCslStyles.generateStyleId(styleTitle);
		},

		getMasterIdFromId: function(styleId) {
			if (!modernCslStyles) {
				console.warn('CSL Editor not yet initialized');
				return styleId;
			}
			return modernCslStyles.getMasterIdFromId(styleId);
		},

		getStyleTitle: function(styleId) {
			if (!modernCslStyles) {
				console.warn('CSL Editor not yet initialized');
				return 'Loading...';
			}
			return modernCslStyles.getStyleTitle(styleId);
		},

		getAllStyleIds: function() {
			if (!modernCslStyles) {
				console.warn('CSL Editor not yet initialized');
				return [];
			}
			return modernCslStyles.getAllStyleIds();
		},

		getIndependentStyleIds: function() {
			if (!modernCslStyles) {
				console.warn('CSL Editor not yet initialized');
				return [];
			}
			return modernCslStyles.getIndependentStyleIds();
		},

		searchByTitle: function(query) {
			if (!modernCslStyles) {
				console.warn('CSL Editor not yet initialized');
				return [];
			}
			return modernCslStyles.searchByTitle(query);
		},

		// Async method for loading style XML
		loadStyleXml: function(styleId, callback) {
			if (!modernCslStyles) {
				initReady.then(function() {
					modernCslStyles.loadStyleXml(styleId).then(callback);
				});
			} else {
				modernCslStyles.loadStyleXml(styleId).then(callback);
			}
		},

		// Direct access to modern modules (for pages that can handle async)
		_modern: {
			get cslStyles() { return modernCslStyles; },
			get styleLoader() { return modernStyleLoader; }
		}
	};

	return module;
});
