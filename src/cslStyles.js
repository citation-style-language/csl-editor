"use strict";

define(['src/options', function (CSLEDIT_options) {
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
					cache[path] = data;
				},
				error : function () {
					console.log("WARNING: error fetching " + url);
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
