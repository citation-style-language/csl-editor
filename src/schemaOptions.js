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
		// add an xmlns attribute to the style node
		nodeProperties["root/style"].attributes["xmlns"] = {
			defaultValue : "http://purl.org/net/xbiblio/csl",
			documentation : "",
			list : 0,
			values : [{
				documentation : "",
				type : "value",
				value : "http://purl.org/net/xbiblio/csl"
			}],
			alwaysOutput : true
		};

		nodeProperties["root/style"].attributes["version"].alwaysOutput = true;

		// remove empty default values from date-part choice elements
		$.each(nodeProperties["date/date-part"].choices, function (i, choice) {
			$.each(choice.attributes, function (attributeName, attribute) {
				if (attribute.values.length === 2 && attribute.values[0].type === "novalue") {
					attribute.values.splice(0,1);
					attribute.defaultValue = attribute.values[0].value;
					attribute.alwaysOutput = true;
				}
			});
		});
		
		// change style node description
		nodeProperties["root/style"].documentation = "Set global formatting options";
		
		// add default for all delimiter attributes
		$.each(nodeProperties, function (i, node) {
			if ("delimiter" in node.attributes) {
				if (!("defaultValue" in node.attributes.delimiter)) {
					node.attributes.delimiter.defaultValue = ""; 
				}
			}
		});
	}
};
