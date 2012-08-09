"use strict";

define(['src/options', 'src/debug'], function (CSLEDIT_options, debug) {
	var cache = {};

	var getJSONData = function (path) {
		var url;
		if (!(path in cache)) {
			url = CSLEDIT_options.get('rootURL') + '/' + path;
			$.ajax({
				url : url,
				dataType : "json",
				async : false,
				success : function (data) {
					console.log("fetched json: " + path);
					cache[path] = data;
				},
				error : function () {
					debug.log("WARNING: error fetching " + url);
				}
			});
		}
		return cache[path];
	};

	return {
		styles : function () {
			return getJSONData('generated/cslStyles.json');
		},
		exampleCitations : function () {
			return getJSONData('generated/preGeneratedExampleCitations.json');
		}
	};
});
