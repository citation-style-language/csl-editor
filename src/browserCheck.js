"use strict";

// Test to check that we are running on a supported browser
//
// Note: This could be improved by checking for the features used instead of the
//       browser type. Or if we are checking the browser type, we should also check
//       the version.

define({
	// Returns true if the browser is compatible with the editor, false otherwise
	isCompatible : function () {
		return $.browser.webkit || $.browser.mozilla || $.browser.chrome;
	}
});
