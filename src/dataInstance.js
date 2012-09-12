"use strict";

// The global instance of CSLEDIT_Data, which stores the currently loaded CSL style
//
// Note: Despite its name, this is always loaded as CSLEDIT_data in the rest of the code.
//       (The reason is that data.js and Data.js are the same filename on Windows)

define(['src/Data'], function (CSLEDIT_Data) {
	// global instance
	return CSLEDIT_Data("CSLEDIT.cslData", [
		"style",
		"style/info",
		"style/info/title",
		"style/info/id",
		"style/citation",
		"style/citation/layout"
	], true);
});
