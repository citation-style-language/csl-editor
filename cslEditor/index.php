<!doctype html>
<html>
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/> 

	<title>CSL IDE</title>

	<script src="http://code.jquery.com/jquery-latest.min.js" type="text/javascript"></script>
	<script src="http://code.jquery.com/ui/1.8.18/jquery-ui.min.js"></script>
	<link rel="stylesheet" type="text/css" href="http://code.jquery.com/ui/1.8.18/themes/ui-lightness/jquery-ui.css">

	<link rel="stylesheet" href="./docs.css" />

	<script type="text/javascript" src="../external/citeproc/loadabbrevs.js"></script>
	<script type="text/javascript" src="../external/citeproc/xmldom.js"></script>
	<script type="text/javascript" src="../external/citeproc/citeproc.js"></script>
	<script type="text/javascript" src="../external/citeproc/loadlocale.js"></script>
	<script type="text/javascript" src="../external/citeproc/loadsys.js"></script>
	<script type="text/javascript" src="../external/citeproc/runcites.js"></script>
	<script type="text/javascript" src="../external/diff-match-patch/diff_match_patch.js"></script>

	<script type="text/javascript" src="../external/jstree/_lib/jquery.hotkeys.js"></script>
	<script type="text/javascript" src="../external/jstree/jquery.jstree.js"></script>
	<link type="text/css" rel="stylesheet" href="../external/jstree/themes/default/style.css"/>

	<script type="text/javascript" src="../src/citationEngine.js"></script>
	<script type="text/javascript" src="exampleData.js"></script>
	<script type="text/javascript" src="../src/diff.js"></script>
	<script type="text/javascript" src="../src/debug.js"></script>
	<script type="text/javascript" src="../src/cslJSON.js"></script>

	<link type="text/css" rel="stylesheet" href="../external/SimplejQueryDropdowns/css/style.css"/>

<style type="text/css">

* {
	margin: 0;
	padding: 0;
}
html, body {
	height: 100%;
	overflow: hidden;
}
#mainContainer {
	height: 100%;
}
.searched {
	background: yellow;
}
#treeEditor {
	font-size: 14px;

	height: 100%;
	width: 100%;
	overflow: auto;
}
#leftPane {
	float: left;
	width: 35%;
	height: 100%;
	background-color: #F5F5DC;
}
ul.dropdown {
	float: right;
}
#treeEditorTitle {
	float: left;
}
#rightPane {
	float: right;
	width: 63%;
	height: 100%;
}
#exampleOutput {
/*	margin-top: 50%:*/
	height: 65%;
	overflow: auto;
}
#elementProperties {
	font-size: 14px;
	background-color: #F5F5DC;
	width: 100%;
	height: 30%;
	overflow: auto;
}
table {
	width: 100%;
	margin: 10px, 0;
}
#elementProperties > table,
#elementProperties > table > tr,
#elementProperties > table > tr > td
{
	width: 100%;
}
label.> tr
{
	width: 800px;
}
input.propertyInput {
	min-width: 250px;
}
label.propertyLabel {
	min-width: 150px;
	display: block;
}

/** Very hacky fix for jstree move between nodes bug:
 *  https://github.com/vakata/jstree/issues/174
 *
 *  TODO: Delve into jstree code and do a better fix
 */
.jstree li {
position: relative;
z-index: 20 !important;
}

#jstree-marker-line {
z-index: 10 !important;
}

ul.dropdown {
z-index: 30 !important;
}

</style>
</head>

<body>

<div id="dialog-confirm-delete" title="Delete?">
	<p>
	<span class="ui-icon ui-icon-alert" style="float:left; margin:0 7px 20px 0;"></span>
	Are you sure you want to delete this attribute?
	</p>
</div>

<div id="mainContainer">
<div id="leftPane">
	<h3 id="treeEditorTitle">CSL Structure</h3>
		<ul class="dropdown">
        	<li><a href="#">Add node</a>
        		<ul class="sub_menu">
        			 <li><a href="#">info</a></li>
        			 <li><a href="#">macro</a></li>
        			 <li><a href="#">locale</a></li>
        			 <li><a href="#">citation</a></li>
        			 <li><a href="#">bibliography</a></li>
        			 <li><a href="#">text</a></li>
        			 <li><a href="#">sort</a></li>
        			 <li><a href="#">layout</a></li>
        			 <li><a href="#">group</a></li>
        			 <li><a href="#">choose</a></li>
        			 <li><a href="#">if</a></li>
        			 <li><a href="#">else</a></li>
        			 <li><a href="#">names</a></li>
        			 <li><a href="#">name</a></li>
        			 <li><a href="#">substitute</a></li>
        			 <li><a href="#">label</a></li>
        		</ul>
			</li>
		</ul>
	<div id="treeEditor">
	</div>
</div>

<div id="rightPane">
	<div id="elementProperties">
	</div>
	<div id="exampleOutput">
		<div id="statusMessage"></div>

		<h3>Formatted Citations</h3>	
		<div id="formattedCitations"></div>

		<h3>Formatted Bibliography</h3>
		<div id="formattedBibliography"></div>
	</div>
</div>
</div>
</div>

<script>
"use strict";

var CSLEDIT = CSLEDIT || {};

CSLEDIT.editorPage = (function () {
	var cslCode,
		editTimeout,
		diffTimeout,
		diffMatchPatch = new diff_match_patch(),
		oldFormattedCitation = "",
		newFormattedCitation = "",
		oldFormattedBibliography = "",
		newFormattedBibliography = "",
		styleURL,
		oldSelectedNode,
		numCslNodes,
		hoveredNodeStack = [],
		highlightedCss,
		selectedCss,
		unHighlightedCss,
		highlightedTreeNodes = [];

	var normalisedColor = function (color) {
		return $('<pre>').css({"color" : color}).css("color");
	};

	highlightedCss = {
			"color" : normalisedColor("black"),
			"background-color" : normalisedColor("#bbffbb")
		};
	selectedCss = {
			"color" : normalisedColor("white"),
			"background-color" : normalisedColor("#009900")
		};
	unHighlightedCss = {
			"color" : "",
			"background-color" : ""
		};

	// resizing that can't be done with CSS
	var setSizes = function () {
		var treeEditor = $('#treeEditor');
		treeEditor.height(treeEditor.parent().height() - $('#treeEditorTitle').outerHeight() - 32);
	};

	// from https://gist.github.com/1771618
	var getUrlVar = function (key) {
		var result = new RegExp(key + "=([^&]*)", "i").exec(window.location.search); 
		return result && unescape(result[1]) || "";
	};

	var runCiteproc = function () {
		var style = cslCode;
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
				$("#formattedBibliography").html(newFormattedBibliography);
				doSyntaxHighlighting();	
			}
		, 1000);

		document.getElementById("statusMessage").innerHTML = formattedResult.statusMessage;
	};

	var addToHoveredNodeStack = function (target) {
		// build stack 'backwards' from the inner node outwards
		var parentNode;
		
		if (typeof target.attr("cslid") !== "undefined") {
			hoveredNodeStack.unshift(target.attr("cslid"));
		}

		parentNode = target.parent();
		if (parentNode.length > 0) {
			addToHoveredNodeStack(parentNode);
		}
	}

	var removeFromHoveredNodeStack = function (nodeIndex) {
		// pop all nodes up to and including the target node
		var poppedNode;

		if (hoveredNodeStack.length > 0) {
			poppedNode = hoveredNodeStack.pop();
			unHighlightNode(poppedNode);

			if (poppedNode == nodeIndex) {
				return;
			}
			removeFromHoveredNodeStack (nodeIndex);
		}
	}

	var highlightNode = function (nodeIndex) {
		var node;

		// expand jstree
		//$('#treeEditor').jstree("open_node", 'li[cslid="' + nodeIndex + '"]');
		
		node = $('span[cslid="' + nodeIndex + '"]');

		if (node.css("background-color") == selectedCss["background-color"])
		{
			// leave alone - selection takes precedence
		} else {
			node.css(highlightedCss);
		}

		// undo previous highlighting
		unHighlightTree();
		highlightTree($('li[cslid="' + nodeIndex + '"]'), 0);

		// TODO: scroll to correct element
	};

	var reverseSelectNode = function () {
		assert(hoveredNodeStack.length > 0);

		var cslid = hoveredNodeStack[hoveredNodeStack.length - 1];

		console.log("clicked " + cslid);

		// expand jstree
		$('#treeEditor').jstree("open_node", 'li[cslid="' + cslid + '"]');
		$('li[cslid="' + cslid + '"] > a').click();
	};

	var unHighlightTree = function () {
		var node;
		while (highlightedTreeNodes.length > 0) {
			node = highlightedTreeNodes.pop();
			node.css(unHighlightedCss);
		}
	};

	// highlight node and all parents, stopping at the "style" node
	var highlightTree = function (node, depth) {
		var node, parentNode, parentIndex, highlightedNode;

		depth++;
		assert(depth < 20, "stack overflow!");

		if (node.is('li')) {
			highlightedNode = node.children('a');
			highlightedTreeNodes.push(highlightedNode);
			highlightedNode.css(highlightedCss);
		}

		parentNode = node.parent();
		assert(parentNode != false, "no parent node");

		parentIndex = parentNode.attr("cslid");

		if (parentIndex != "0") {
			highlightTree(parentNode, depth);
		}
	};

	var unHighlightNode = function (nodeIndex) {
		var	node = $('span[cslid="' + nodeIndex + '"]');

		if (node.css("background-color") == selectedCss["background-color"])
		{
			// leave alone - selection takes precedence
		} else {
			node.css(unHighlightedCss);
		}
//		$('[cslid="' + nodeIndex + '"]').css(unHighlightedCss);
	};

	var setupSyntaxHighlightForNode = function (nodeIndex) {
		$('span[cslid="' + nodeIndex + '"]').hover(
			function (event) {
				var target = $(event.target);
				
				// remove all
				removeFromHoveredNodeStack(-1);

				// populate hovered node stack
				addToHoveredNodeStack(target);

				var lastNode = hoveredNodeStack[hoveredNodeStack.length - 1];
				assertEqual(lastNode, target.attr("cslid"), "applySyntax");

				if (hoveredNodeStack.length > 0) {
					highlightNode(lastNode);
				}
			},
			function () {
				removeFromHoveredNodeStack(nodeIndex);
				
				if (hoveredNodeStack.length > 0) {
					highlightNode(hoveredNodeStack[hoveredNodeStack.length - 1]);
				} else {
					unHighlightTree();
				}
			}
		);

		// set up click handling
		$('span[cslid="' + nodeIndex + '"]').click( function () {
			reverseSelectNode(nodeIndex);
		});
	};

	var doSyntaxHighlighting = function () {
		// syntax highlighting
		for (var index = 0; index < numCslNodes; index++) {
			setupSyntaxHighlightForNode(index);
		}
	};

	var updateTreeView = function () {
		var nodeIndex = { index : 0 };
		var jsonData = CSLEDIT.parser.jsonFromCslXml(cslCode, nodeIndex);

		numCslNodes = nodeIndex.index + 1;

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
				
			"plugins" : ["themes","json_data","ui", "crrm", "dnd", "contextmenu", "types", "hotkeys"],
			// each plugin you have included can have its own config object
			"core" : { "initially_open" : [ "node1" ] }
			// it makes sense to configure a plugin only if overriding the defaults
		});

		//$("#leftPane").resizable({handles : 'e'});

		runCiteproc();
	};

	var treeViewChanged = function () {
		var jsonData = $("#treeEditor").jstree("get_json", -1, [], []);
		cslCode = CSLEDIT.parser.cslXmlFromJson(jsonData);

		runCiteproc();
	};

	var nodeSelected = function(event, ui) {
		var jsonData = $("#treeEditor").jstree("get_json", ui.rslt.obj, [], [])[0];
		var attributes = jsonData.metadata.attributes;
		var cslId = jsonData.metadata.cslId;

		var propertyPanel = $("#elementProperties");
		var index;
		var inputId;
		var labelId;
		var attribute;

		// remove child nodes
		$("#elementProperties > *").remove();
		
		// create new ones
		$('<h3>' + jsonData.metadata.name + ' properites</h3>').appendTo(propertyPanel);
		$('<table>').appendTo(propertyPanel);

		// title editor (if a text element)
		if (typeof jsonData.metadata.textValue !== "undefined" || attributes.length === 0) {
			$('<tr><td><label for="textNodeInput" id="textNodeInputLabel" class="propertyLabel">text value<\/label><\/td>' + 
				'<td><input id="textNodeInput" class="propertyInput"' + 'type="text"><\/input><\/td><\/tr>').
				appendTo(propertyPanel);
			
			$("#textNodeInput").val(jsonData.metadata.textValue);
		}

		// attribute editors
		for (index = 0; index < attributes.length; index++)
		{
			inputId = 'nodeAttribute' + index;
			labelId = 'nodeAttributeLabel' + index;
			attribute = attributes[index];

			$('<tr><td><label for=' + inputId + ' id="' + labelId + '" class="propertyLabel">' +
				attribute.key + '<\/label><\/td>' + 
				'<td><input id="' + inputId + '" class="propertyInput" attr="' + index + '"' +
				'type="text"><\/input><\/td>' +
				'<td><button class="deleteAttrButton" attrIndex="' + index + '">Delete</button><\/td>' +
				'<\/tr>').appendTo(propertyPanel);

			$("#" + inputId).val(attribute.value);
		}

		$('<\/table>').appendTo(propertyPanel);
	
		// Add attribute button
		$('<br \/><input id="newAttributeKey" placeholder="New attribute name"></input>' +
			'<button id="addAttributeButton">Add attribute<\/button>'
			).appendTo(propertyPanel);

		$('#addAttributeButton').click( function () {
			var newAttribute = $('#newAttributeKey').val();
			jsonData.metadata.attributes.push({
				key : newAttribute,
				value : ""
			});
			nodeSelected(event, ui);
		});

		$(".propertyInput").on("input", function () {
			clearTimeout(editTimeout);
			editTimeout = setTimeout(nodeChanged, 500);
		});

		$('.deleteAttrButton').click( function (buttonEvent) {
			index = $(buttonEvent.target).attr("attrIndex");

			$( "#dialog-confirm-delete" ).dialog({
				resizable: false,
				modal: true,
				buttons: {
					"Delete attribute": function() {
						$( this ).dialog( "close" );
						jsonData.metadata.attributes.splice(index, 1);
						$("#treeEditor").jstree("rename_node", ui.rslt.obj,
							CSLEDIT.parser.displayNameFromMetadata(jsonData.metadata));
						nodeSelected(event, ui);
						treeViewChanged();
					},
					Cancel: function() {
						$( this ).dialog( "close" );
					}
				},
				autoOpen:true
			});
			

//			$('[class=propertyInput][attr="' + index + '"]').val("");
//			console.log("delete attr " + index);
//			treeViewChanged();
		});

		$('span[cslid="' + oldSelectedNode + '"]').css(unHighlightedCss);
		oldSelectedNode = cslId;

		$('span[cslid="' + cslId + '"]').css(selectedCss);
	};

	var nodeChanged = function () {
		var selectedNode = $("#treeEditor").jstree("get_selected");
		
		var jsonData = $("#treeEditor").jstree("get_json", selectedNode, [], [])[0];
		var attributes = [];

		// read user data
		var numAttributes = $('[id^="nodeAttributeLabel"]').length;
		var index;
		var key, value;

		//alert("num attrs = " + numAttributes);

		for (index = 0; index < numAttributes; index++) {
			key = $("#nodeAttributeLabel" + index).html();
			value = $("#nodeAttribute" + index).val();
			attributes.push({
				key : key,
				value : value
			});
		}
		jsonData.metadata.attributes = attributes;

		treeViewChanged();
	};

	var updateCslIds = function () {
		var jsonData = $("#treeEditor").jstree("get_json", -1, [], [])[0];
		CSLEDIT.parser.updateCslIds(jsonData, {index:0});
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

			$("#dialog-confirm-delete").dialog({autoOpen : false});

			$(function(){
				$("ul.dropdown li").hover(function(){
				
					$(this).addClass("hover");
					$('ul:first',this).css('visibility', 'visible');
				
				}, function(){
				
					$(this).removeClass("hover");
					$('ul:first',this).css('visibility', 'hidden');
				
				});
				
				$("ul.dropdown li ul li:has(ul)").find("a:first").append(" &raquo; ");
			});

			for (index = 0; index < 30; index++) {
				jsonData.push(createNode(index));
			}
			
			styleURL = getUrlVar("styleURL");
			if (styleURL == "" || typeof styleURL === 'undefined') {
				styleURL = "../external/custom-styles/apa.csl";
			} else {
				styleURL = "../getFromOtherWebsite.php?url=" + encodeURIComponent(styleURL);
			}

			$.get(
					styleURL, {}, function(data) {
					cslCode = data;
					updateTreeView();
				}
			);

			$("#treeEditor").on("move_node.jstree", function () {
				updateCslIds();
				treeViewChanged();
			});
			$("#treeEditor").on("select_node.jstree", nodeSelected);

			$(".propertyInput").on("change", nodeChanged);

			$(".dropdown a").click(function (event) {
				var clickedName = $(event.target).text();
				console.log("clicked " + clickedName);
				if ($(event.target).parent().parent().attr("class") === "sub_menu") {
					$(event.target).parent().parent().css('visibility', 'hidden');
					
					// create new node after the selected one
					var selectedNode = $('#treeEditor').jstree('get_selected');

					$('#treeEditor').jstree('create_node', selectedNode, "after",
					{
						"data" : clickedName,
						"attr" : { "rel" : clickedName, "cslid" : 0 },
						"metadata" : {
							"name" : clickedName,
							"attributes" : [],
							"textValue" : undefined,
							"cslId" : 0
						},
						"children" : []
					});
					updateCslIds();
				}
			});

			setSizes();
			$(window).resize(setSizes);
		}
	};
}());

CSLEDIT.editorPage.init();

</script>
  </body>
</html>
