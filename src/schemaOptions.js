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
		// remove value "sub verbo"
		// TODO: remove this if "sub verbo" gets removed from the CSL schema						
		// TODO: check for any other list items with spaces
		$.each(nodeProperties, function (i, element) {
			$.each(element.choices, function (i2, choice) {
				$.each(choice, function (attributeName, attribute) {
					var indexToRemove = -1;
			   		$.each(attribute.values, function (index, value) {
						if (value.value === "sub verbo") {
							indexToRemove = index;
						}
					});
					if (indexToRemove !== -1) {
						attribute.values.splice(indexToRemove, 1);
					}
				});
			});
		});
	}
};
