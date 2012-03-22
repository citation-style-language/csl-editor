<!doctype html>
<html>
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/> 

	<title>CSL IDE</title>

	<script src="http://code.jquery.com/jquery-latest.min.js" type="text/javascript"></script>
	<script src="http://code.jquery.com/ui/1.8.18/jquery-ui.min.js"></script>
	<link rel="stylesheet" type="text/css" href="http://code.jquery.com/ui/1.8.18/themes/ui-lightness/jquery-ui.css">

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

	<!--script type="text/javascript" src="../external/jstree/_lib/jquery.hotkeys.js"></script-->
	<script type="text/javascript" src="../external/jstree/jquery.jstree.js"></script>
	<link type="text/css" rel="stylesheet" href="../external/jstree/themes/default/style.css"/>

	<script type="text/javascript" src="../src/citationEngine.js"></script>
	<script type="text/javascript" src="exampleData.js"></script>
	<script type="text/javascript" src="../src/diff.js"></script>
	<script type="text/javascript" src="../src/cslJSON.js"></script>

	<style type="text/css">
		html, body {
			width: 98%;
			height: 98%;
		}
		#code {
			border: 1px solid #eee;
			overflow: auto;
		}
		.searched {
			background: yellow;
		}
		#treeEditor {
			font-size: 14px;
			height: 86%;
			width: 90%;
			overflow: auto;
		}
		#editorTabs {
			float: left;
			width: 35%;
			height: 90%;
			/*overflow: auto;*/
		}
		#output {
			float: right;
			width: 63%;
			height: 95%;
			overflow: auto;
		}
	</style>
</head>
<body>
<!--<h1>CSL IDE</h1>-->
<!--<input type="file" id="files" name="files[]" />-->
<output id="list"></output>

<div id="editorTabs">
	<ul>
		<li><a href="#treeEditor">Tree editor</a></li>
		<li><a href="#codeEditor">Code view</a></li>
	</ul>
	<div id="treeEditor">
		<!--div id="innerTreeEdit">
		</div-->
	</div>
	<div id="codeEditor"-->
		<form name="codeForm">
			<textarea id="code" name="code">
			</textarea>
		</form>
	</div>
</div>

<div id="output">
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

	var runCiteproc = function () {
		var style = editor.getValue();
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

	var assertEqual = function (actual, expected, place) {
		if (actual !== expected) {
			alert("assert fail at " + place + "\n" +
				actual + " !== " + expected);
		}
	};

	var updateTreeView = function (xmlData) {
		var parser = new DOMParser();
		var xmlDoc = parser.parseFromString(xmlData, "application/xml");

		var styleNode = xmlDoc.childNodes[0];
		assertEqual(styleNode.localName, "style");

		var jsonData = parseNode(styleNode);

		$("#treeEditor").jstree({
			"json_data" : { data : [ jsonData ] },
			"types" : {
				"valid_children" : [ "root" ],
				"types" : {
					"text" : {
						"icon" : {
							"image" : "http://static.jstree.com/v.1.0rc/_docs/_drive.png"
						}
					}
				}
			},
				
			"plugins" : ["themes","json_data","ui", "crrm", "dnd", "contextmenu", "types"],
			// each plugin you have included can have its own config object
			"core" : { "initially_open" : [ "node1" ] }
			// it makes sense to configure a plugin only if overriding the defaults
		});

	};

	var parseNode = function (node) {
		var children = [],
			index,
			jsonData,
			childNode;

		for (index = 0; index < node.childNodes.length; index++) {
			childNode = node.childNodes[index];

			if (childNode.localName !== null) {
				children.push(parseNode(node.childNodes[index]));
			}
		}

		var attributesString = "";
		var attributesList = [];

		if (node.attributes !== null && node.attributes.length > 0) {
			for (index = 0; index < node.attributes.length; index++) {
				attributesList.push(
					node.attributes.item(index).localName + " = " +
					node.attributes.item(index).nodeValue);
			}
			attributesString = ": " + attributesList.join(", ");
		}

		return {
			"data" : (node.localName + attributesString),
			"attr" : { "rel" : node.localName },
			"children" : children
		};
	};

	return {
		init : function () {
			// parse CSL file
			var jsonData = [],
				createNode = function (id) {
					return {
						"data" : "node " + id,
						"attr" : {"rel" : "generic"}
					};
				},
				index;

			for (index = 0; index < 30; index++) {
				jsonData.push(createNode(index));
			}
/*
			$("#treeEditor").jstree({
				"json_data" : { data : jsonData },
				"types" : {
					"valid_children" : [ "root" ],
					"types" : {
						"text" : {
							"icon" : {
								"image" : "http://static.jstree.com/v.1.0rc/_docs/_drive.png"
							}
						}
					}
				},
					
				"plugins" : ["themes","json_data","ui", "crrm", "dnd", "contextmenu", "types"],
				// each plugin you have included can have its own config object
				"core" : { "initially_open" : [ "node1" ] }
				// it makes sense to configure a plugin only if overriding the defaults
			});
 */
			CodeMirror.defaults.onChange = function()
			{
				clearTimeout(codeTimeout);
				codeTimeout = setTimeout(runCiteproc, 500);
			};

			editor = CodeMirror.fromTextArea(document.getElementById("code"), {
					mode: { name: "xml", htmlMode: true},
					lineNumbers: true
			});

			styleURL = getUrlVar("styleURL");
			if (styleURL == "" || typeof styleURL === 'undefined') {
				styleURL = "../external/csl-styles/apa.csl";
			} else {
				styleURL = "../getFromOtherWebsite.php?url=" + encodeURIComponent(styleURL);
			}

			$.get(
					styleURL, {}, function(data) { 
					editor.setValue(data);
					updateTreeView(data);
				}
			);

			$("#editorTabs").tabs();
		}
	};
}());

CSLEDIT.editorPage.init();

</script>
  </body>
</html>
