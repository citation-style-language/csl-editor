<!doctype html>
<html>
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/> 

	<title>CSL IDE</title>

	<script src="http://code.jquery.com/jquery-latest.min.js" type="text/javascript"></script>

	<link rel="stylesheet" href="./codemirror.css">
	<script src="../external/codemirror2/lib/codemirror.js"></script>
	<script src="../external/codemirror2/mode/xml/xml.js"></script>
	<link rel="stylesheet" href="./docs.css">

	<script type="text/javascript" src="../external/citeproc/loadabbrevs.js"></script>
	<script type="text/javascript" src="../external/citeproc/xmldom.js"></script>
	<script type="text/javascript" src="../external/citeproc/citeproc.js"></script>
	<script type="text/javascript" src="../external/citeproc/loadlocale.js"></script>
	<script type="text/javascript" src="../external/citeproc/loadsys.js"></script>
	<script type="text/javascript" src="../external/citeproc/runcites.js"></script>
	<script type="text/javascript" src="../external/diff-match-patch/diff_match_patch.js"></script>

	<script type="text/javascript" src="../src/citationEngine.js"></script>
	<script type="text/javascript" src="../src/exampleData.js"></script>
	<script type="text/javascript" src="../src/diff.js"></script>
	<script type="text/javascript" src="../src/cslJSON.js"></script>
	<script type="text/javascript" src="../src/cslCode.js"></script>

	<link rel="stylesheet" href="../css/base.css" />

<style type="text/css">
#code {
	border: 1px solid #eee;
	overflow: auto;
}
.searched {
	background: yellow;
}
</style>
</head>
<body id="codeEditor">

<?php include '../html/navigation.html'; ?>

<form name="codeForm">
	<textarea id="code" name="code">
	</textarea>
</form>

<div id="statusMessage"></div>

<h3>Formatted Citations</h3>	
<div id="formattedCitations"></div>

<h3>Formatted Bibliography</h3>
<div id="formattedBibliography"></div>

<script>

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

	var runCiteproc = function () {
		var style = CSLEDIT.code.get();
		var inLineCitations = "";
		var citations = [];
		var formattedResult;
		
		document.getElementById("statusMessage").innerHTML = "";

		formattedResult = citationEngine.formatCitations(
			style, cslEditorExampleData.jsonDocuments, cslEditorExampleData.citationsItems);

		oldFormattedCitation = newFormattedCitation;
		newFormattedCitation = formattedResult.formattedCitations.join("<br />");

		oldFormattedBibliography = newFormattedBibliography;
		newFormattedBibliography = formattedResult.formattedBibliography;

		var dmp = diffMatchPatch;
		var diffs = dmp.diff_main(oldFormattedCitation, newFormattedCitation);
		dmp.diff_cleanupSemantic(diffs);
		var diffFormattedCitation = unescape(CSLEDIT.diff.prettyHtml(diffs));

		diffs = dmp.diff_main(oldFormattedBibliography, newFormattedBibliography);
		dmp.diff_cleanupSemantic(diffs);
		var diffFormattedBibliography = unescape(CSLEDIT.diff.prettyHtml(diffs));

		// display the diff
		$("#formattedCitations").html(diffFormattedCitation);
		$("#formattedBibliography").html(diffFormattedBibliography);

		// display the new version in 1000ms
		clearTimeout(diffTimeout);
		diffTimeout = setTimeout(
			function () {
			$("#formattedCitations").html(newFormattedCitation);
			$("#formattedBibliography").html(newFormattedBibliography);}
		, 1000);

		document.getElementById("statusMessage").innerHTML = formattedResult.statusMessage;
	};

	return {
		init : function () {
			CodeMirror.defaults.onChange = function()
			{
				clearTimeout(codeTimeout);
				codeTimeout = setTimeout( function () {
					CSLEDIT.code.set(editor.getValue());
					runCiteproc();
				}, 500);
			};

			editor = CodeMirror.fromTextArea(document.getElementById("code"), {
					mode: { name: "xml", htmlMode: true},
					lineNumbers: true
			});

			CSLEDIT.code.initPageStyle( function () {
				editor.setValue(CSLEDIT.code.get());
			});
		}
	};
}());

CSLEDIT.editorPage.init();

</script>
  </body>
</html>
