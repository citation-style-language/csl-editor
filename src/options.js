"use strict";
var CSLEDIT = CSLEDIT || {};

CSLEDIT.Options = function (userOptions) {
	this.userOptions = userOptions || {};
	this.defaultOptions = {
		loadcsl_name : "Load CSL",
		loadcsl_func : function () {
			var url = prompt("Please enter the URL of the style you wish to load"),
				newStyle;

			// fetch the URL
			$.ajax({
				url : '../getFromOtherWebsite.php?url=' + encodeURIComponent(url),
				success : function (result) {
					newStyle = result;
				},
				async: false
			});

			// can return null here and use VisualEditor.controller.exec('setCslCode')
			// to perform async
			return newStyle;
		},
		savecsl_name : "Save CSL",
		savecsl_func : function (cslCode) {			
			window.location.href =
				"data:application/xml;charset=utf-8," +
				encodeURIComponent(cslCode);
		}
	};
};

CSLEDIT.Options.prototype.get = function (key) {
	if (this.userOptions.hasOwnProperty(key)) {
		return this.userOptions[key];
	} else {
		return this.defaultOptions[key];
	}
};
