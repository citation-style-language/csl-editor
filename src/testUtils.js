"use strict";
var CSLEDIT = CSLEDIT || {};

CSLEDIT.testUtils = {};

// returns a list of complete CSL styles from the repository
//
// returns only top styles at present
CSLEDIT.testUtils.getStyles = function (maxNumberOfStyles) {
	var styles = {};

	$.each(CSLEDIT.exampleData.topStyles, function (i, style) {
		var url = CSLEDIT.options.get("rootURL") + '/external/csl-styles/' +
				style.replace(/^.*\//, "") + ".csl",
			cslCode;

		if (i >= maxNumberOfStyles) {
			// we've got enough
			return false;
		}

		console.log("style url = " + url);

		$.ajax({
			url : url,
			dataType : "text",
			success : function (data) {
				cslCode = data;
			},
			async : false
		});

		if (typeof(cslCode) === "undefined") {
			// try dependent style
			 url = CSLEDIT.options.get("rootURL") + '/external/csl-styles/dependent/' +
				style.replace(/^.*\//, "") + ".csl";
	
			$.ajax({
				url : url,
				dataType : "text",
				success : function (data) {
					cslCode = data;
				},
				async : false
			});
		}

		ok(typeof(cslCode) !== "undefined", "loaded " + url);
		styles[url] = cslCode;
	});

	return styles;
};

