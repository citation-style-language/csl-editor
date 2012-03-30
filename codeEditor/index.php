<!doctype html>
<html>
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/> 

	<title>Code Editor</title>

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
#exampleOutput {
	margin-left: 20px;
	margin-right: 20px;
	height: 60%;
	overflow: auto;
	cursor: default;
	font-family:Verdana,Geneva,'DejaVu Sans',sans-serif;
	line-height: 1.3;
}
#exampleOutput p {
	margin-top: 0;
	margin-bottom: 0.2em;
}
#exampleOutput h3 {
	margin-top: 0.5em;
	margin-bottom: 0.1em;
}
</style>
</head>
<body id="codeEditor">

<?php include '../html/navigation.html'; ?>

<form name="codeForm">
	<textarea id="code" name="code">
	</textarea>
</form>

<div id="exampleOutput">
	<div id="statusMessage"></div>

	<h3>Formatted Citations</h3>	
	<div id="formattedCitations"></div>

	<h3>Formatted Bibliography</h3>
	<div id="formattedBibliography"></div>
</div>

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

	return {
		init : function () {
			CodeMirror.defaults.onChange = function()
			{
				clearTimeout(codeTimeout);
				codeTimeout = setTimeout( function () {
					CSLEDIT.code.set(editor.getValue());
					CSLEDIT.citationEngine.runCiteprocAndDisplayOutput(
						$("#statusMessage"), $("#exampleOutput"),
						$("#formattedCitations"), $("#formattedBibliography"));
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
