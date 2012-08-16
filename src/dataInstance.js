"use strict";

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
