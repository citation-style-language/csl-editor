<!doctype html>
<html>
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/> 

	<title>Visual Editor</title>

	<script src="http://code.jquery.com/jquery-latest.min.js" type="text/javascript"></script>
	<script src="http://code.jquery.com/ui/1.8.18/jquery-ui.min.js"></script>
	<link rel="stylesheet" type="text/css" href="http://code.jquery.com/ui/1.8.18/themes/ui-lightness/jquery-ui.css">

	<script type="text/javascript" src="../external/citeproc/loadabbrevs.js"></script>
	<script type="text/javascript" src="../external/citeproc/xmldom.js"></script>
	<script type="text/javascript" src="../external/citeproc/citeproc.js"></script>
	<script type="text/javascript" src="../external/citeproc/loadlocale.js"></script>
	<script type="text/javascript" src="../external/citeproc/loadsys.js"></script>
	<script type="text/javascript" src="../external/citeproc/runcites.js"></script>
	<script type="text/javascript" src="../external/diff-match-patch/diff_match_patch.js"></script>

	<script type="text/javascript" src="../external/jstree/_lib/jquery.hotkeys.js"></script>
	<script type="text/javascript" src="../external/jstree/jquery.jstree.js"></script>
	<link type="text/css" rel="stylesheet" href="../external/jstree/themes/default/style.css" />

	<script type="text/javascript" src="../src/citationEngine.js"></script>
	<script type="text/javascript" src="../src/exampleData.js"></script>
	<script type="text/javascript" src="../src/diff.js"></script>
	<script type="text/javascript" src="../src/debug.js"></script>
	<script type="text/javascript" src="../src/cslJSON.js"></script>
	<script type="text/javascript" src="../src/cslCode.js"></script>

	<link type="text/css" rel="stylesheet" href="../css/dropdown.css" />

	<link rel="stylesheet" href="../css/base.css" />
<style type="text/css">
html, body {
	overflow: hidden;
}
#mainContainer {
	height: 100%;
	margin: 10px;
	clear: both;
}
.searched {
	background: yellow;
}
#treeEditor {
	font-size: 14px;

	height: 100%;
	width: 100%;
	overflow: auto;
	padding-top: 5px;
}
#leftPane {
	float: left;
	width: 35%;
	height: 100%;
}
ul.dropdown {
/*	float: left;*/
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
#elementProperties {
	font-size: 14px;
	background-color: #F5F5DC;
	width: 100%;
	height: 40%;
	overflow: auto;
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
button {
	padding-left: 3px;
	padding-right: 3px;
	padding-top: 0;
	padding-bottom: 0;
	margin: 0;
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

<body id="visualEditor">

<?php include '../html/navigation.html'; ?>

<div id="dialog-confirm-delete" title="Delete?">
	<p>
	<span class="ui-icon ui-icon-alert" style="float:left; margin:0 7px 20px 0;"></span>
	Are you sure you want to delete this attribute?
	</p>
</div>

<ul class="dropdown">
	<li>
		<a href="#">Style</a>
		<ul class="sub_menu">
			<li><a href="#">New style</a></li>
			<li><a href="#">Load from URL</a></li>
			<!--li><a href="#">Revert (undo all changes)</a></li-->
			<li><a href="#">Export CSL</a></li>
		</ul>
	</li>
	<li>
		<a href="#">Edit</a>
		<ul class="sub_menu">
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
			<li>
				<a href="#">Delete node</a>
			</li>
		</ul>
	</li>
</ul>
<div id="mainContainer">
<div id="leftPane">
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
	var editTimeout,
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
			"background-color" : normalisedColor("#bbffbb"),
			"cursor" : "pointer"
		};
	selectedCss = {
			"color" : normalisedColor("white"),
			"background-color" : normalisedColor("#009900"),
			"cursor" : "default"
		};
	unHighlightedCss = {
			"color" : "",
			"background-color" : "",
			"cursor" : "default"
		};

	// resizing that can't be done with CSS
	var setSizes = function () {
		var mainContent = $('#mainContainer');
		var treeEditor = $('#treeEditor');

		mainContent.height(mainContent.parent().height() - 60);
		treeEditor.height(treeEditor.parent().height());
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
	};

	var reverseSelectNode = function () {
		assert(hoveredNodeStack.length > 0);

		var cslid = hoveredNodeStack[hoveredNodeStack.length - 1];

		// expand jstree
		$('#treeEditor').jstree("open_node", 'li[cslid="' + cslid + '"]');
		$('li[cslid="' + cslid + '"] > a').click();
	};

	var unHighlightTree = function () {
		var node;

		while (highlightedTreeNodes.length > 0) {
			node = highlightedTreeNodes.pop();
			node.css(unHighlightedCss);
			node.css("cursor", "");
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
			highlightedNode.css("cursor", "");
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
				var target = $(event.target).closest("span");
				
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
		var jsonData = CSLEDIT.parser.jsonFromCslXml(CSLEDIT.code.get(), nodeIndex);

		numCslNodes = nodeIndex.index + 1;

		console.log("updateTreeView");

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
				
			"plugins" : ["themes","json_data","ui", "crrm", "dnd", /*"contextmenu",*/
				"types", "hotkeys"],
			// each plugin you have included can have its own config object
			"core" : { "initially_open" : [ "node1" ] },
			"ui" : { "initially_select" : [ "cslTreeNode0" ] }
		});

		$("#treeEditor").on("move_node.jstree", function () {
			treeViewChanged();
		});
		$("#treeEditor").on("select_node.jstree", nodeSelected);
		$("#treeEditor").on("delete_node.jstree", function () {
			if (confirm("Are you sure you want to delete this node?")) {
				treeViewChanged();
			} else {
				updateCslData(CSLEDIT.code.get());
			}
		});

		CSLEDIT.citationEngine.runCiteprocAndDisplayOutput(
			$("#statusMessage"), $("#exampleOutput"),
			$("#formattedCitations"), $("#formattedBibliography"),
			doSyntaxHighlighting);
	};

	var treeViewChanged = function () {
		var jsonData = $("#treeEditor").jstree("get_json", -1, [], []);
		console.log("treeViewChanged");
		updateCslIds();
		console.log("updating local stored style");
		CSLEDIT.code.set(CSLEDIT.parser.cslXmlFromJson(jsonData));

		CSLEDIT.citationEngine.runCiteprocAndDisplayOutput(
			$("#statusMessage"), $("#exampleOutput"),
			$("#formattedCitations"), $("#formattedBibliography"),
			doSyntaxHighlighting);
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
		$('<h3>' + jsonData.metadata.name + ' properites</h3><br \/>').appendTo(propertyPanel);
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
			if (newAttribute === "")
			{
				alert('Please enter the attribute name first\ne.g. "text", "variable", "et-al-min"');
			} else {
				jsonData.metadata.attributes.push({
					key : newAttribute,
					value : ""
				});
				nodeSelected(event, ui);
				treeViewChanged();
			}
		});

		$(".propertyInput").on("input", function () {
			clearTimeout(editTimeout);
			editTimeout = setTimeout(nodeChanged, 500);
		});

		$('.deleteAttrButton').click( function (buttonEvent) {
			if (confirm("Are you sure you want to delete this attribute?")) {
				index = $(buttonEvent.target).attr("attrIndex");

				jsonData.metadata.attributes.splice(index, 1);
				$("#treeEditor").jstree("rename_node", ui.rslt.obj,
					CSLEDIT.parser.displayNameFromMetadata(jsonData.metadata));
				nodeSelected(event, ui);
				treeViewChanged();
			}
		});

		$('span[cslid="' + oldSelectedNode + '"]').css(unHighlightedCss);
		oldSelectedNode = cslId;

		console.log("selecting node " + cslId);
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

		for (index = 0; index < numAttributes; index++) {
			key = $("#nodeAttributeLabel" + index).html();
			value = $("#nodeAttribute" + index).val();
			attributes.push({
				key : key,
				value : value
			});
		}
		jsonData.metadata.attributes = attributes;

		$("#treeEditor").jstree("rename_node", selectedNode,
			CSLEDIT.parser.displayNameFromMetadata(jsonData.metadata));
		treeViewChanged();
	};

	var updateCslIds = function () {
		var jsonData = $("#treeEditor").jstree("get_json", -1, [], [])[0];
		CSLEDIT.parser.updateCslIds(jsonData, {index:0});
	};

	var reloadPageWithNewStyle = function (newURL) {
		var reloadURL = window.location.href;
		reloadURL = reloadURL.replace(/#/, "");
		reloadURL = reloadURL.replace(/\?.*$/, "");
		window.location.href = reloadURL + "?styleURL=" + newURL;
	};

	var updateCslData = function (data) {
		// strip comments from style
		data = data.replace(/<!--.*?-->/g, "");

		CSLEDIT.code.set(data);
		updateTreeView();
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

			CSLEDIT.code.initPageStyle( updateTreeView );

			$(".propertyInput").on("change", nodeChanged);

			$(".dropdown a").click(function (event) {
				var clickedName = $(event.target).text(),
					selectedNode = $('#treeEditor').jstree('get_selected'),
					parentNode = $(event.target).parent().parent(),
					parentNodeName,
					jsonData,
					position;

				console.log("clicked node = " + clickedName);

				if (parentNode.attr("class") === "sub_menu")
				{
					parentNodeName = parentNode.siblings('a').text();

					if (/^Edit/.test(parentNodeName)) {
						if (clickedName === "Delete node") {
							$('#treeEditor').jstree('remove', selectedNode);
						}
					} else if ((/^Add node/).test(parentNodeName)) {
						console.log("parent node = " + parentNode.siblings('a').text());
						$(event.target).parent().parent().css('visibility', 'hidden');

						jsonData = $("#treeEditor").jstree("get_json", selectedNode, [], [])[0];
						// if current node is the root "style" node, create within instead of after
						if (jsonData.metadata.name === "style") {
							position = "inside";
						} else {
							position = "after";
						}

						// create new node after the selected one
						$('#treeEditor').jstree('create_node', selectedNode, position,
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
						treeViewChanged();
					} else if ((/^Style/).test(parentNodeName)) {
						if (clickedName === "Revert (undo all changes)") {
							reloadPageWithNewStyle(styleURL);
						} else if (clickedName === "Export CSL") {
							window.location.href =
								"data:application/xml;charset=utf-8," +
								encodeURIComponent(CSLEDIT.code.get());
						} else if (clickedName === "Load from URL") {
							reloadPageWithNewStyle(
								prompt("Please enter the URL of the style you wish to load")
							);
						} else if (clickedName === "New style") {
							reloadPageWithNewStyle(
								window.location.protocol + "//" + window.location.hostname + "/csl/content/newStyle.csl");
						}
					}
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
