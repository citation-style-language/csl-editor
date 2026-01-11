/**
 * Initialize the CSL Editor library paths for demo site usage
 * This must be called before the library is used
 */

define(function() {
	'use strict';

	// This is a hook to configure the library for demo site paths
	// The actual configuration happens when the modern library loads
	window.__CSL_EDITOR_BASE_PATH = '/cslEditorLib/';

	return {
		basePath: '/cslEditorLib/'
	};
});
