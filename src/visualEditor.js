"use strict";

var CSLEDIT = CSLEDIT || {};

CSLEDIT.editorPage = (function () {
	var editTimeout,
		styleURL,
		oldSelectedNode,
		hoveredNodeStack = [],
		highlightedCss,
		selectedCss,
		unHighlightedCss,
		highlightedTreeNodes = [],
		selectedCslId = -1,
		viewController;

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

		mainContent.height(mainContent.parent().height() - 60);
		$("#treeEditor").height($("#treeEditor").parent().height());
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

	var highlightNode = function (nodeStack) {
		var cslId = nodeStack[nodeStack.length - 1];

		highlightOutput(cslId);

		// undo previous highlighting
		unHighlightTree();
		highlightTree(nodeStack, null, 0);
	};

	var highlightOutput = function (cslId)
	{
		var node = $('span[cslid="' + cslId + '"]');
		if (node.css("background-color") == selectedCss["background-color"])
		{
			// leave alone - selection takes precedence
		} else {
			node.css(highlightedCss);
		}
	};

	var reverseSelectNode = function () {
		var index,
			cslId = hoveredNodeStack[hoveredNodeStack.length - 1];

		assert(hoveredNodeStack.length > 0);

		for (index = 0; index < hoveredNodeStack.length; index++) {
			viewController.expandNode(hoveredNodeStack[index]);
		}

		if (selectedCslId !== cslId) {
			selectedCslId = cslId;
			viewController.selectNode(cslId);
		}
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
	var highlightTree = function (nodeStack, node, depth) {
		var nodeIndex, node, parentNode, parentIndex, highlightedNode;

		if (node === null) {
			nodeIndex = nodeStack.pop();
			if (typeof nodeIndex === "undefined") {
				return;
			}
			node = $('li[cslid="' + nodeIndex + '"]');
		}

		depth++;
		assert(depth < 50, "stack overflow!");

		if (node.is('li')) {
			highlightedNode = node.children('a');
			highlightedTreeNodes.push(highlightedNode);
			highlightedNode.css(highlightedCss);
			highlightedNode.css("cursor", "");
		}

		parentNode = node.parent().closest("li[cslid]");
		assert(parentNode != false, "no parent node");

		if (parentNode.length !== 0) {
        		parentIndex = parentNode.attr("cslid");
			if (nodeStack[nodeStack.length - 1] === parentIndex) {
				nodeStack.pop();
			}
			highlightTree(nodeStack, parentNode, depth);
		} else {
			// highlight any remaining nodes in the call stack
			// (e.g. if a macro was called)
			highlightTree(nodeStack, null, depth);
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
	};

	var setupSyntaxHighlightForNode = function (cslId) {
		$('span[cslid="' + cslId + '"]').hover(
			function (event) {
				var target = $(event.target).closest("span[cslid]");
				
				// remove all
				removeFromHoveredNodeStack(-1);

				// populate hovered node stack
				addToHoveredNodeStack(target);

				var lastNode = hoveredNodeStack[hoveredNodeStack.length - 1];
				assertEqual(lastNode, target.attr("cslid"), "applySyntax");

				if (hoveredNodeStack.length > 0) {
					highlightNode(hoveredNodeStack.slice());
				}
			},
			function () {
				removeFromHoveredNodeStack(cslId);
				
				if (hoveredNodeStack.length > 0) {
					highlightNode(hoveredNodeStack.slice());
				} else {
					unHighlightTree();
				}
			}
		);

		// set up click handling
		$('span[cslid="' + cslId + '"]').click( function () {
			reverseSelectNode(cslId);
		});

		// set up hovering over tree nodes
		$('li[cslid="' + cslId + '"] > a').unbind('mouseenter mouseleave');
		$('li[cslid="' + cslId + '"] > a').hover(
			function () {
				highlightOutput(cslId);
			},
			function () {
				unHighlightNode(cslId);
			}
		);
	};

	var doSyntaxHighlighting = function () {
		var numCslNodes = CSLEDIT.data.numCslNodes();
			
		console.log("syntax Higlight! " + numCslNodes);
		console.time("syntaxHighlighting");
		// clear the hovered node stack
		hoveredNodeStack.length = 0;
		selectedCslId = -1;

		// syntax highlighting
		for (var index = 0; index < numCslNodes; index++) {
			setupSyntaxHighlightForNode(index);
		}
		console.timeEnd("syntaxHighlighting");
	};

	var createTreeView = function () {
		var nodeIndex = { index : 0 };
		var cslData = CSLEDIT.data.get(); 

		viewController.createTree(cslData,
		{
			loaded : function (event, data) {
				console.log("tree loaded");

				var cslData = CSLEDIT.data.get();

				CSLEDIT.citationEngine.runCiteprocAndDisplayOutput(
					$("#statusMessage"), $("#exampleOutput"),
					$("#formattedCitations"), $("#formattedBibliography"),
					doSyntaxHighlighting,
					CSLEDIT.data.getNodesFromPath("style/citation/layout", cslData)[0].cslId,
					CSLEDIT.data.getNodesFromPath("style/bibliography/layout", cslData)[0].cslId);
			},
			selectNode : nodeSelected,
			deleteNode : function () {
				CSLEDIT.controller.exec("deleteNode", [viewController.selectedNode()]);
			},
			moveNode : function (move) {
				var temp,
					fromId,
					toId,
					toParentNode,
					index;

				fromId = parseInt(move.o.attr("cslid"));
				toId = parseInt(move.r.attr("cslid"));
				toParentNode = CSLEDIT.data.getNodeAndParent(toId).parent;

				if (move.last_pos !== false) {
					CSLEDIT.controller.exec("moveNode", [fromId, toId, move.last_pos]);
				}
			},
			checkMove : function (fromId, toId, position) {
				var fromNode = CSLEDIT.data.getNode(fromId),
					toNodeInfo = CSLEDIT.data.getNodeAndParent(toId),
					parentNodeName,
					result,
					toCslId;

				if (position === "before" || position === "after") {
					if (toNodeInfo.parent === null) {
						return false;
					}
					// go up a level
					toNodeInfo = CSLEDIT.data.getNodeAndParent(toNodeInfo.parent.cslId);
				}

				// for moving to a macro instance, note that if the move goes ahead,
				// this translation is done in CSLEDIT.data.addNode, so it's fine to
				// give the macro instance id to the addNode controller command
				toCslId = CSLEDIT.data.macroDefinitionIdFromInstanceId(toNodeInfo.node.cslId);
				if (toCslId !== toNodeInfo.node.cslId) {
					toNodeInfo = CSLEDIT.data.getNodeAndParent(toCslId);
				}

				if (toNodeInfo.parent === null) {
					parentNodeName = "root";
				} else {
					parentNodeName = toNodeInfo.parent.name;
				}
				console.log("check if " + fromNode.name + " in " + parentNodeName + "/" + toNodeInfo.node.name);
				result = (fromNode.name in CSLEDIT.schema.childElements(parentNodeName + "/" + toNodeInfo.node.name));
				console.log("result = " + result);
				return result;
			}
		});
	};

	var formatExampleCitations = function () {
		var cslData = CSLEDIT.data.get();

		CSLEDIT.citationEngine.runCiteprocAndDisplayOutput(
			$("#statusMessage"), $("#exampleOutput"),
			$("#formattedCitations"), $("#formattedBibliography"),
			doSyntaxHighlighting,
			CSLEDIT.data.getNodesFromPath("style/citation/layout", cslData)[0].cslId,
			CSLEDIT.data.getNodesFromPath("style/bibliography/layout", cslData)[0].cslId);
	};

	var nodeSelected = function(event, ui) {
		var nodeAndParent,
			node,
			parentNode,
			parentNodeName,
			propertyPanel = $("#elementProperties"),
			possibleElements,
			element,
			possibleChildNodesDropdown,
			schemaAttributes,
			dataType,
			translatedCslId,
			translatedNodeInfo,
			translatedParentName;

		nodeAndParent = CSLEDIT.data.getNodeAndParent(viewController.selectedNode());
		node = nodeAndParent.node;
		parentNode = nodeAndParent.parent;

		console.log("selected node : " + node.name);
		console.log("parent node : " + parent.name);

		// hack to stop parent of style being style
		if (node.name === "style") {
			parentNodeName = "root";
		} else if (parentNode !== false) {
			console.time("get parent");
			parentNodeName = parentNode.name;
			console.timeEnd("get parent");
		} else {
			parentNodeName = "root";
		}

		// update possible child elements based on schema
		if (typeof CSLEDIT.schema !== "undefined") {
			// in case the user is selecting a macro instance:
			translatedCslId = CSLEDIT.data.macroDefinitionIdFromInstanceId(node.cslId);
			translatedNodeInfo = CSLEDIT.data.getNodeAndParent(translatedCslId);
		
			if (translatedNodeInfo.parent === null) {
				translatedParentName = "root";
			} else {
				translatedParentName = translatedNodeInfo.parent.name;
			}

			possibleElements = CSLEDIT.schema.childElements(
				translatedParentName + "/" + translatedNodeInfo.node.name);

			possibleChildNodesDropdown = $("#possibleChildNodes").html("");

			for (element in possibleElements) {
				$('<li><a href="#">' + element + '</a></li>').appendTo(possibleChildNodesDropdown);
			}
		}

		// reregister dropdown handler after changes
		setupDropdownMenuHandler("#possibleChildNodes a");

		dataType = CSLEDIT.schema.elementDataType(parentNodeName + "/" + node.name);
		schemaAttributes = CSLEDIT.schema.attributes(parentNodeName + "/" + node.name);

		switch (node.name) {
			case "sort":
				CSLEDIT.sortPropertyPanel.setupPanel($("#elementProperties"), node);
				break;
			case "info":
				CSLEDIT.infoPropertyPanel.setupPanel($("#elementProperties"), node);
				break;
			default:
			CSLEDIT.propertyPanel.setupPanel(
				$("#elementProperties"), node, dataType, schemaAttributes, nodeChanged);
		}

		$('span[cslid="' + oldSelectedNode + '"]').css(unHighlightedCss);
		oldSelectedNode = node.cslId;

		$('span[cslid="' + node.cslId + '"]').css(selectedCss);
	};

	var nodeChanged = function (node) {
		var selectedNodeId = viewController.selectedNode(),
			attributes = [];

		//node = CSLEDIT.data.getNode(selectedNodeId);

		// TODO: assert check that persistent data wasn't changed in another tab, making
		//       this form data possibly refer to a different node

		// read user data
		var numAttributes = $('[id^="nodeAttributeLabel"]').length,
			index,
			key, value;

		console.time("readingUserInput");
		for (index = 0; index < numAttributes; index++) {
			key = $("#nodeAttributeLabel" + index).html();
			value = $("#nodeAttribute" + index).val();
			attributes.push({
				key : key,
				value : value,
				enabled : node.attributes[index].enabled
			});
		}
		console.timeEnd("readingUserInput");
		node.attributes = attributes;

		CSLEDIT.controller.exec("ammendNode", [selectedNodeId, node]);
	};

	var reloadPageWithNewStyle = function (newURL) {
		var reloadURL = window.location.href;
		reloadURL = reloadURL.replace(/#/, "");
		reloadURL = reloadURL.replace(/\?.*$/, "");
		window.location.href = reloadURL + "?styleURL=" + newURL;
	};

	var updateCslData = function (cslCode) {
		// strip comments from style
		data = data.replace(/<!--.*?-->/g, "");

		CSLEDIT.data.setCslCode(cslCode);
		createTreeView();
	};

	var setupDropdownMenuHandler = function (selector) {
		$(selector).click(function (event) {
			var clickedName = $(event.target).text(),
				selectedNodeId = $('#treeEditor').jstree('get_selected'),
				parentNode = $(event.target).parent().parent(),
				parentNodeName,
				position;	

			if (parentNode.attr("class") === "sub_menu")
			{
				parentNodeName = parentNode.siblings('a').text();

				if (/^Edit/.test(parentNodeName)) {
					if (clickedName === "Delete node") {
						CSLEDIT.controller.exec("deleteNode", [viewController.selectedNode()]);
					}
				} else if ((/^Add node/).test(parentNodeName)) {
					$(event.target).parent().parent().css('visibility', 'hidden');

					CSLEDIT.controller.exec("addNode", [
						viewController.selectedNode(), 0, { name : clickedName, attributes : []}
					]);
				} else if ((/^Style/).test(parentNodeName)) {
					if (clickedName === "Revert (undo all changes)") {
						reloadPageWithNewStyle(styleURL);
					} else if (clickedName === "Export CSL") {
						window.location.href =
							"data:application/xml;charset=utf-8," +
							encodeURIComponent(CSLEDIT.data.getCslCode());
					} else if (clickedName === "Load from URL") {
						reloadPageWithNewStyle(
							prompt("Please enter the URL of the style you wish to load")
						);
					} else if (clickedName === "New style") {
						reloadPageWithNewStyle(
							window.location.protocol + "//" + window.location.hostname + "/csl/content/newStyle.csl");
					} else if (clickedName === "Style Info") {
						viewController.selectNode(CSLEDIT.data.getNodesFromPath("style/info")[0].cslId);
					} else if (clickedName === "Global Formatting Options") {
						viewController.selectNode(CSLEDIT.data.getNodesFromPath("style")[0].cslId);
					}
				}
			}
		});
	};

	return {
		init : function () {
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

			CSLEDIT.data.initPageStyle( function () {

				//viewController = CSLEDIT.CslTreeView($("#treeEditor"))

				viewController = CSLEDIT.ViewController($("#treeEditor"));

				CSLEDIT.controller.addSubscriber("addNode", CSLEDIT.data.addNode);
				CSLEDIT.controller.addSubscriber("deleteNode", CSLEDIT.data.deleteNode);
				CSLEDIT.controller.addSubscriber("moveNode", CSLEDIT.data.moveNode);
				CSLEDIT.controller.addSubscriber("ammendNode", CSLEDIT.data.ammendNode);
				CSLEDIT.controller.addSubscriber("setCslCode", CSLEDIT.data.setCslCode);	

				viewController.setFormatCitationsCallback(formatExampleCitations);
				CSLEDIT.data.setViewController(viewController);

				createTreeView();
			});

			setupDropdownMenuHandler(".dropdown a");

			$(".propertyInput").on("change", nodeChanged);

			setSizes();
			$(window).resize(setSizes);
		}
	};
}());

$("document").ready( function () {
	CSLEDIT.schema.callWhenReady( CSLEDIT.editorPage.init );
});

