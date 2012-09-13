"use strict";

// Provides information about the CSL styles repository

define(['src/urlUtils', 'src/debug'], function (CSLEDIT_urlUtils, debug) {
	var cache = {},
		defaultStyleId = 'http://www.zotero.org/styles/apa';

	var topStyles = [
		'http://www.zotero.org/styles/apa',
		'http://www.zotero.org/styles/ieee',
		'http://www.zotero.org/styles/harvard1',
		'http://www.zotero.org/styles/nature',
		'http://www.zotero.org/styles/american-medical-association', /* manually updated from styles/ama */
		'http://www.zotero.org/styles/chicago-author-date',
		'http://www.zotero.org/styles/apsa',
		'http://www.zotero.org/styles/vancouver',
		'http://www.zotero.org/styles/asa',
		'http://www.zotero.org/styles/mla',
		'http://www.zotero.org/styles/mhra',
		'http://www.zotero.org/styles/chicago-fullnote-bibliography',
		'http://www.zotero.org/styles/associacao-brasileira-de-normas-tecnicas', /* manually updated from styles/abnt */
		'http://www.zotero.org/styles/chicago-note-bibliography',
		'http://www.zotero.org/styles/national-library-of-medicine', /* manually updated from styles/nlm */
		'http://www.zotero.org/styles/american-chemical-society',
		'http://www.zotero.org/styles/cell',
		'http://www.zotero.org/styles/science',
		'http://www.zotero.org/styles/elsevier-with-titles',
		'http://www.zotero.org/styles/ecology',
		'http://www.zotero.org/styles/elsevier-harvard',
		'http://www.zotero.org/styles/royal-society-of-chemistry',
		'http://www.zotero.org/styles/journal-of-the-american-chemical-society',
		'http://www.zotero.org/styles/pnas'
	];

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

	// used to generate the ids in the CSL style repository
	var getNormalisedStyleTitle = function (styleTitle) {
		return styleTitle.
			replace(/&/g, "and").
			replace(/\([A-Z]*\)/g, ""). // remove upper case text (acronyms) in parentheses
			replace(/[\(\)\[\]]/g, ""). // remove other parentheses
			replace(/[,'\.]/g, "").     // remove other chars
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
		var baseUrl = "external/csl-styles/";
		if (styles().masterIdFromId[styleId] !== styleId) {
			baseUrl += "dependent/";
		}

		return CSLEDIT_urlUtils.getResourceUrl(
			styleId.replace("http://www.zotero.org/styles/", baseUrl) + ".csl");
	};

	var fetchCslCode = function (styleId, success, error) {
		var localURL = localURLFromZoteroId(styleId);
		
		$.ajax({
			url : localURL,
			dataType : "text",
			success : success,
			error : error
		});
	};

	var styles = function () {
		return getJSONData('generated/cslStyles.json');
	};
	var exampleCitations = function () {
		return getJSONData('generated/preGeneratedExampleCitations.json');
	};

	return {
		styles : styles,
		exampleCitations : exampleCitations,
		defaultStyleId : defaultStyleId,
		defaultStyleURL : function () {
			return localURLFromZoteroId(defaultStyleId)
		},
		generateStyleId : generateStyleId,
		fetchCslCode : fetchCslCode,
		localURLFromZoteroId : localURLFromZoteroId,
		topStyles : topStyles
	};
});
