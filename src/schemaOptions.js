"use strict";
var CSLEDIT = CSLEDIT || {};

/* Options for modifying the Schema for use in the CSL Editor
 */

CSLEDIT.schemaOptions = {
	defaultDefaultAttribute : {
		documentation: "No value",
		type: "novalue",
		value: ""
	},
	documentationFilter : function (documentation) {
		return documentation
			.replace(/\n/g, " ")
			.replace(/The font-formatting attributes are based on those of CSS and XSL-FO\./g, "");
	},
	processNodeProperties : function (nodeProperties) {
		// can put schema modification code here
	}
};
