"use strict";

var CSLEDIT = CSLEDIT || {};

CSLEDIT.editorPage = (function () {
	var codeTimeout,
		editor,
		diffTimeout,
		diffMatchPatch = new diff_match_patch(),
		oldFormattedCitation = "",
		newFormattedCitation = "",
		oldFormattedBibliography = "",
		newFormattedBibliography = "",
		styleURL;

	// from https://gist.github.com/1771618
	var getUrlVar = function (key) {
		var result = new RegExp(key + "=([^&]*)", "i").exec(window.location.search); 
		return result && unescape(result[1]) || "";
	};

	return {
		init : function () {
			CodeMirror.defaults.onChange = function()
			{
				clearTimeout(codeTimeout);
				codeTimeout = setTimeout( function () {
					CSLEDIT.data.setCslCode(editor.getValue());
					CSLEDIT.citationEngine.runCiteprocAndDisplayOutput(
						$("#statusMessage"), $("#exampleOutput"),
						$("#formattedCitations"), $("#formattedBibliography"));
				}, 500);
			};

			editor = CodeMirror.fromTextArea(document.getElementById("code"), {
					mode: { name: "xml", htmlMode: true},
					lineNumbers: true
			});

			CSLEDIT.data.initPageStyle( function () {
				editor.setValue(CSLEDIT.data.getCslCode());
			});
		}
	};
}());

$("document").ready( function() {
	CSLEDIT.editorPage.init();
});
