"use strict";

// This fetches and caches the mustache templates, and
// runs mustache on them

define(
		[	'src/urlUtils',
			'src/debug',
			'external/Mustache'
		],
		function (
			CSLEDIT_urlUtils,
			debug,
			Mustache
		) {

	// map of filename (minus .mustache extension) to contents
	var templateCache = {};

	var toHtml = function (templateName, data) {
		if (!(templateName in templateCache)) {
			$.ajax({
				url : CSLEDIT_urlUtils.getResourceUrl("html/" + templateName + ".mustache"),
				dataType : "text",
				success : function (data) {
					templateCache[templateName] = data;
				},
				error : function () {
					debug.assert(false, "Couldn't fetch mustache template: " + templateName);
				},
				async: false
			});
		}

		return Mustache.to_html(templateCache[templateName], data);
	};

	return {
		toHtml : toHtml
	};
});
