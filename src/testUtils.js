"use strict";


var CSLEDIT_testUtils = {};

/*global ok:true*/

// returns a list of complete CSL styles from the repository
//
// returns only top styles at present
CSLEDIT_testUtils.getStyles = function (maxNumberOfStyles) {
	var styles = {};

	$.each(CSLEDIT_exampleData.topStyles, function (i, style) {
		var url = CSLEDIT_options.getUrl('/external/csl-styles/' +
				style.replace(/^.*\//, "") + ".csl"),
			cslCode;

		if (i >= maxNumberOfStyles) {
			// we've got enough
			return false;
		}

		debug.log("style url = " + url);

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
			url = CSLEDIT_options.getUrl('external/csl-styles/dependent/' +
				style.replace(/^.*\//, "") + ".csl");
	
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

