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
	<script type="text/javascript" src="exampleData.js"></script>

	<style type="text/css">
	  #code {
		border: 1px solid #eee;
		overflow: auto;
		resize: both;
	  }
	  .searched {background: yellow;}
	</style>
</head>
<body>
<h1>CSL IDE</h1>
<!--<input type="file" id="files" name="files[]" />-->
<output id="list"></output>

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

// -- global variables --

var timeout,
	urlParams = <?php echo json_encode($_GET)); ?>,
	editor,
	lastPos = null, lastQuery = null, marked = [],
	diffTimeout,
	availableIds = [],
	global_tags = new Object,
	diffMatchPatch = new diff_match_patch(),
	oldFormattedCitation = "",
	newFormattedCitation = "",
	oldFormattedBibliography = "",
	newFormattedBibliography = "",
	styleURL;

// -- init --

CodeMirror.defaults.onChange = function()
{
	clearTimeout(timeout);
	timeout = setTimeout("runCiteproc()", 500);
};

editor = CodeMirror.fromTextArea(document.getElementById("code"), {
		mode: { name: "xml", htmlMode: true},
		lineNumbers: true
});

styleURL = urlParams["styleURL"];
if (styleURL == "" || typeof styleURL === 'undefined') {
	styleURL = "http://www.zotero.org/styles/apa";
}

$.get(
		"../getFromOtherWebsite.php?url=" + encodeURIComponent(styleURL), {}, function(data) { 
		editor.setValue(data);
	}
);

/**
 * Modified version of the diff-match-patch function which
 * doesn't escape the original HTML tags
 * (There's a risk now of mangling the tags, but it's a risk I'm willing to take)
 *  
 * Convert a diff array into a pretty HTML report.
 * @param {!Array.<!diff_match_patch.Diff>} diffs Array of diff tuples.
 * @return {string} HTML representation.
 */
var diff_myPrettyHtml = function(diffs) {
  var html = [];
  var pattern_amp = /&/g;
  var pattern_lt = /</g;
  var pattern_gt = />/g;
  var pattern_para = /\n/g;
  for (var x = 0; x < diffs.length; x++) {
    var op = diffs[x][0];    // Operation (insert, delete, equal)
    var data = diffs[x][1];  // Text of change.
    var text = data;//.replace(pattern_amp, '&amp;').replace(pattern_lt, '&lt;').replace(pattern_gt, '&gt;').replace(pattern_para, '&para;<br>');
    switch (op) {
      case DIFF_INSERT:
        html[x] = '<ins style="background:#e6ffe6;">' + text + '</ins>';
        break;
      case DIFF_DELETE:
        html[x] = '<del style="background:#ffe6e6;">' + text + '</del>';
        break;
      case DIFF_EQUAL:
        html[x] = '<span>' + text + '</span>';
        break;
    }
  }
  return html.join('');
};

function runCiteproc() {
	var style = editor.getValue();
	var inLineCitations = "";
	var citations = [];
	var formattedResult;
	
	document.getElementById("statusMessage").innerHTML = "";

	formattedResult = citationEngine.formatCitations(style, cslEditorExampleData.jsonDocuments, cslEditorExampleData.citationsItems);

	oldFormattedCitation = newFormattedCitation;
	newFormattedCitation = formattedResult.formattedCitations.join("<br />");

	oldFormattedBibliography = newFormattedBibliography;
	newFormattedBibliography = formattedResult.formattedBibliography;

	var dmp = diffMatchPatch;
	var diffs = dmp.diff_main(oldFormattedCitation, newFormattedCitation);
	dmp.diff_cleanupSemantic(diffs);
	var diffFormattedCitation = unescape(diff_myPrettyHtml(diffs));

	diffs = dmp.diff_main(oldFormattedBibliography, newFormattedBibliography);
	dmp.diff_cleanupSemantic(diffs);
	var diffFormattedBibliography = unescape(diff_myPrettyHtml(diffs));

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
}

</script>
  </body>
</html>
