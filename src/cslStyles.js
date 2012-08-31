"use strict";

define(['src/urlUtils', 'src/debug'], function (CSLEDIT_urlUtils, debug) {
	var cache = {},
		defaultStyleId = 'http://www.zotero.org/styles/apa';

	var getJSONData = function (path) {
		var url;
		if (!(path in cache)) {
			url = CSLEDIT_urlUtils.getResourceUrl(path);
			$.ajax({
				url : url,
				dataType : "json",
				async : false,
				success : function (data) {
					debug.log("fetched json: " + path);
					cache[path] = data;
				},
				error : function () {
					debug.log("WARNING: error fetching " + url);
				},
				cache : true
			});
		}
		return cache[path];
	};

	// used to generate the ids in the Zotero style repository
	var getNormalisedStyleTitle = function (styleTitle) {
		return styleTitle.
			replace(/&/g, "and").
			replace(/\(.*\)/g, ""). // remove everything in parentheses
			replace(/[\(\)\[\]]/g, ""). // remove any unmatches parentheses ,'\.
			replace(/[,'\.]/g, ""). // remove other chars
			replace(/[\\\/:"*?<>\| ]+/g, "-").
			replace(/--+/g, "-").
			replace(/-$/, "").
			toLowerCase().
			replace(/[‡·‰‚]|√£|√°|√†/g, "a").
			replace(/[ËÈÎÍ]|√©|√®/g, "e").
			replace(/[ÏÌÔÓ]/g, "i").
			replace(/[ÚÛˆÙ]/g, "o").
			replace(/[˘˙¸˚]/g, "u").
			replace(/[Ò]/g, "n").
			replace(/[Á]|√ß/g, "c");
	};

	var generateStyleId = function (styleTitle) {
		return "http://www.zotero.org/styles/" + getNormalisedStyleTitle(styleTitle);
	};

	var localURLFromZoteroId = function (styleId) {
		return CSLEDIT_urlUtils.getResourceUrl(
			styleId.replace("http://www.zotero.org/styles/", "external/csl-styles/") + ".csl");
	};

	return {
		styles : function () {
			return getJSONData('generated/cslStyles.json');
		},
		exampleCitations : function () {
			return getJSONData('generated/preGeneratedExampleCitations.json');
		},
		defaultStyleId : defaultStyleId,
		defaultStyleURL : function () {
			return localURLFromZoteroId(defaultStyleId)
		},
		generateStyleId : generateStyleId,
		fetchRepoStyle: function (styleId, success, error) {
			var url = localURLFromZoteroId(styleId);

			$.ajax({
				url: url,
				dataType: "text",
				success: success,
				error: error
			});
		}
	};
});
