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
	/*	var 
		// can put schema modification code here

		// change date/date-part choices:
		// 1. give names to the choices
		// 2. remove extra items from the "year" choice (TODO: fix in schema parser)
		nodeProperties["date/date-part"].choices = {
			day : {
				name : {
					defaultValue : "day",
					documentation : "",
					list : 0,
					values : {
						documentation : "",
						type : "value",
						value : "day"
					}
				},
				form : {
					defaultValue : "numeric",
					
						   
			},
		};*/
	}
};
