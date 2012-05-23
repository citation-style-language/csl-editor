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
		highlightedTreeNodes = $(),
		selectedCslId = -1,
		viewController,
		nodePathView,
		highlightTimeout;

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

	var removeFromHoveredNodeStack = function (removeAll) {
		// pop one node, or all nodes, from hoveredNodeStack
		var poppedNode;

		if (hoveredNodeStack.length > 0) {
			poppedNode = hoveredNodeStack.pop();
			unHighlightNode(poppedNode);

			if (removeAll) {
				removeFromHoveredNodeStack (removeAll);
			}
		}
	}

	var highlightNode = function (nodeStack) {
		var cslId = nodeStack[nodeStack.length - 1];

		highlightOutput(cslId);

		// undo previous highlighting
		clearTimeout(highlightTimeout);
		highlightTimeout = setTimeout(function () {
			unHighlightTree();
			highlightTree(nodeStack, null, 0);
		}, 100);
	};

	var highlightOutput = function (cslId)
	{
		var node = $('span[cslid="' + cslId + '"]');

		if (node.hasClass("selected"))
		{
			// leave alone - selection takes precedence
		} else {
			node.addClass("highlighted");
		}
	};

	var reverseSelectNode = function () {
		var index,
			cslId = parseInt(hoveredNodeStack[hoveredNodeStack.length - 1]),
			selectedNode;

		assert(hoveredNodeStack.length > 0);

		// skip the macro definition nodes, jump to the referencing 'text' node instead
		selectedNode = CSLEDIT.data.getNode(cslId);
		if (selectedNode.name === "macro") {
			assert(hoveredNodeStack.length > 1);
			cslId = hoveredNodeStack[hoveredNodeStack.length - 2];
		}

		if (selectedCslId !== cslId) {
			selectedCslId = cslId;
			viewController.selectNode(cslId, highlightedTreeNodes);
		}
	};

	var unHighlightTree = function () {
		var node;

		clearTimeout(highlightTimeout);
		highlightedTreeNodes.children('a').removeClass("highlighted");
	};

	var unHighlightIfNotDescendentOf = function (instanceNode) {
		var index, nodes;

		$.each(highlightedTreeNodes, function () {
			var $this = $(this);
			if (instanceNode.find($this).length === 0) {
				$this.children('a').removeClass("highlighted");
				highlightedTreeNodes = highlightedTreeNodes.not($this);
			}
		});
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
			highlightedTreeNodes = highlightedTreeNodes.add(node);
			highlightedNode.addClass("highlighted");
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
			if (nodeStack.length > 0) {
				// Look for a possible macro instance "text" node in the nodeStack,
				// if found, clear the highlighting for all macros not within this
				// instance or the definition
				var instanceNode;
				instanceNode = new CSLEDIT.CslNode(
					CSLEDIT.data.getNode(parseInt(nodeStack[nodeStack.length - 2])));
				if (instanceNode.name === "text" && instanceNode.getAttr("macro") !== "") {
					unHighlightIfNotDescendentOf($('li[cslid=' + instanceNode.cslId + ']'));
				}
			}
			// highlight any remaining nodes in the call stack
			// (e.g. if a macro was called)
			highlightTree(nodeStack, null, depth);
		}
	};

	var unHighlightNode = function (nodeIndex) {
		var	node = $('span[cslid="' + nodeIndex + '"]');

		if (node.hasClass("selected"))
		{
			// leave alone - selection takes precedence
		} else {
			node.removeClass("highlighted");
		}
	};

	var setupSyntaxHighlightForNode = function () {
		$('span[cslid]').hover(
			function (event) {
				var target = $(event.target).closest("span[cslid]");
				
				// remove all
				removeFromHoveredNodeStack(true);

				// populate hovered node stack
				addToHoveredNodeStack(target);

				var lastNode = hoveredNodeStack[hoveredNodeStack.length - 1];
				assertEqual(lastNode, target.attr("cslid"), "applySyntax");

				if (hoveredNodeStack.length > 0) {
					highlightNode(hoveredNodeStack.slice());
				}
			},
			function () {
				removeFromHoveredNodeStack();
				
				if (hoveredNodeStack.length > 0) {
					highlightNode(hoveredNodeStack.slice());
				} else {
					unHighlightTree();
				}
			}
		);

		// set up click handling
		$('span[cslid]').click( function (event) {
			var target = $(event.target).closest("span[cslid]"),
				cslId = parseInt(target.attr('cslId'));
			reverseSelectNode(cslId);
		});

		// set up hovering over tree nodes
		$('li[cslid] > a').unbind('mouseenter mouseleave');
		$('li[cslid] > a').hover(
			function (event) {
				var target = $(event.target).closest("li[cslid]"),
					cslId = parseInt(target.attr('cslId'));
				highlightOutput(cslId);
			},
			function (event) {
				var target = $(event.target).closest("li[cslid]"),
					cslId = parseInt(target.attr('cslId'));
				unHighlightNode(cslId);
			}
		);
	};

	var doSyntaxHighlighting = function () {
		var numCslNodes = CSLEDIT.data.numCslNodes();
			
		// clear the hovered node stack
		hoveredNodeStack.length = 0;
		selectedCslId = -1;

		setupSyntaxHighlightForNode();

		// highlight the selected node if there is one
		if (viewController.selectedNode() != -1) {
			$('span[cslid=' + viewController.selectedNode() + ']').addClass('selected');
		}
	};

	var createTreeView = function () {
		var nodeIndex = { index : 0 };
		var cslData = CSLEDIT.data.get(); 

		viewController.init(cslData,
		{
			loaded : formatExampleCitations,
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
				result = (fromNode.name in CSLEDIT.schema.childElements(parentNodeName + "/" + toNodeInfo.node.name));
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

		// hack to stop parent of style being style
		if (node.name === "style") {
			parentNodeName = "root";
		} else if (parentNode !== false) {
			parentNodeName = parentNode.name;
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

		nodePathView.selectNode(viewController.getSelectedNodePath());

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
				$("#elementProperties"), node, dataType, schemaAttributes);
		}

		$('span[cslid="' + oldSelectedNode + '"]').removeClass("highlighted");
		$('span[cslid="' + oldSelectedNode + '"]').removeClass("selected");
		oldSelectedNode = node.cslId;

		$('span[cslid="' + node.cslId + '"]').removeClass("highlighted");
		$('span[cslid="' + node.cslId + '"]').addClass("selected");
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

				if ((/^Add Node/).test(parentNodeName)) {
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
			} else if (clickedName === "Delete Node") {
				CSLEDIT.controller.exec("deleteNode", [viewController.selectedNode()]);
			}
		});
	};

	return {
		init : function () {
			if (!$.browser.webkit && !$.browser.mozilla) {
				$('body').html("<h2>Please use the latest version of " +
					"Chrome or Firefox to view this page.<\/h2>").css({margin:50});
				return;
			}

			$("#dialog-confirm-delete").dialog({autoOpen : false});

			$(function(){
				$("ul.dropdown li").hoverIntent(function(){
				
					$(this).addClass("hover");
					$('ul:first',this).css('visibility', 'visible');
				
				}, function(){
				
					$(this).removeClass("hover");
					$('ul:first',this).css('visibility', 'hidden');
				
				});
				
				$("ul.dropdown li ul li:has(ul)").find("a:first").append(" &raquo; ");
			});

			CSLEDIT.data.initPageStyle( function () {
				viewController = CSLEDIT.ViewController($("#treeEditor"), $("#titlebar"), $("#nodePath"));

				CSLEDIT.controller.addSubscriber("addNode", CSLEDIT.data.addNode);
				CSLEDIT.controller.addSubscriber("deleteNode", CSLEDIT.data.deleteNode);
				CSLEDIT.controller.addSubscriber("moveNode", CSLEDIT.data.moveNode);
				CSLEDIT.controller.addSubscriber("amendNode", CSLEDIT.data.amendNode);
				CSLEDIT.controller.addSubscriber("setCslCode", CSLEDIT.data.setCslCode);	

				viewController.setFormatCitationsCallback(formatExampleCitations);
				CSLEDIT.data.setViewController(viewController);

				createTreeView();

				nodePathView = new CSLEDIT.NodePathView($("#nodePathView"), {
					selectNodeFromPath : viewController.selectNodeFromPath
				});
			});

			setupDropdownMenuHandler(".dropdown a");

			CSLEDIT.editReferences.init($('ul.#exampleCitation1'), formatExampleCitations, 0, [0]);
			CSLEDIT.editReferences.init($('ul.#exampleCitation2'), formatExampleCitations, 1, [11]);

			$("#mainContainer").layout({
				closable : false,
				resizble : true,
				livePaneResizing : true,
				west__size : 240,
				west__minSize : 200
			});
			$("#rightContainer").layout({
				closable : false,
				resizable : true,
				livePaneResizing : true,
				north__size : 250
			});
		}
	};
}());

$("document").ready( function () {
	CSLEDIT.schema.callWhenReady( CSLEDIT.editorPage.init );
});

