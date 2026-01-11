/**
 * RequireJS compatibility shim for modernized CSL Editor
 *
 * This module allows the old RequireJS-based demo site to use the new
 * ES module version of the library. It provides a bridge between the
 * old AMD module system and the new ES modules.
 */

define(function(require) {
	'use strict';

	// We'll dynamically import the ES module and expose it as an AMD module
	// Since RequireJS doesn't support dynamic imports directly, we need to
	// load it via a script tag and then expose the global

	var initialized = false;
	var cslEditorModule = null;
	var initPromise = null;

	/**
	 * Load the ES module version of the library
	 */
	function loadModernLibrary() {
		if (initPromise) {
			return initPromise;
		}

		initPromise = new Promise(function(resolve, reject) {
			// Create a script tag to load the ES module
			var script = document.createElement('script');
			script.type = 'module';
			script.textContent = `
				import CSLEditor from '/cslEditorLib/dist/csl-editor.es.js';

				// Initialize the library
				CSLEditor.init().then(function() {
					// Expose on window for RequireJS to access
					window.__CSLEditorModern = CSLEditor;
					window.dispatchEvent(new CustomEvent('csl-editor-loaded'));
				}).catch(function(err) {
					console.error('Failed to initialize CSL Editor:', err);
					window.dispatchEvent(new CustomEvent('csl-editor-error', { detail: err }));
				});
			`;

			// Listen for load event
			window.addEventListener('csl-editor-loaded', function() {
				cslEditorModule = window.__CSLEditorModern;
				initialized = true;
				resolve(cslEditorModule);
			}, { once: true });

			// Listen for error event
			window.addEventListener('csl-editor-error', function(event) {
				reject(event.detail);
			}, { once: true });

			document.head.appendChild(script);
		});

		return initPromise;
	}

	return {
		/**
		 * Initialize the modern library
		 * Returns a promise that resolves when the library is ready
		 */
		init: function() {
			return loadModernLibrary();
		},

		/**
		 * Get the modern cslStyles module
		 */
		getCslStyles: function() {
			if (!initialized) {
				throw new Error('CSL Editor not initialized. Call init() first.');
			}
			return cslEditorModule.cslStyles;
		},

		/**
		 * Get the modern styleLoader module
		 */
		getStyleLoader: function() {
			if (!initialized) {
				throw new Error('CSL Editor not initialized. Call init() first.');
			}
			return cslEditorModule.styleLoader;
		},

		/**
		 * Check if initialized
		 */
		isInitialized: function() {
			return initialized;
		}
	};
});
