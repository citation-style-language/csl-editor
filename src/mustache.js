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
		var template;
		if (templateName in templateCache) {
			template = templateCache[template];
		} else {
			$.ajax({
				url : CSLEDIT_urlUtils.getResourceUrl("html/" + templateName + ".mustache"),
				dataType : "text",
				success : function (data) {
					template = data;
				},
				error : function () {
					debug.assert(false, "Couldn't fetch mustache template: " + templateName);
				},
				async: false
			});
		}

		return Mustache.to_html(template, data);
	};

	return {
		toHtml : toHtml
	};
});
