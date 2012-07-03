"use strict";

var CSLEDIT = CSLEDIT || {};

CSLEDIT.CodeEditor = function (userOptions) {
	var codeTimeout,
		editor,
		diffTimeout,
		diffMatchPatch = new diff_match_patch(),
		oldFormattedCitation = "",
		newFormattedCitation = "",
		oldFormattedBibliography = "",
		newFormattedBibliography = "",
		styleURL;

	CSLEDIT.options.setUserOptions(userOptions);

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
};
