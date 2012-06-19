"use strict";

var CSLEDIT = CSLEDIT || {};

CSLEDIT.VisualEditor = function (editorElement, userOptions) {
	var editTimeout,
		styleURL,
		hoveredNodeStack = [],
		highlightedCss,
		selectedCss,
		unHighlightedCss,
		highlightedTreeNodes = $(),
		selectedCslId = -1,
		viewController,
		syntaxHighlighter,
		nodePathView,
		highlightTimeout,
		propertyPanel;

	CSLEDIT.options.setUserOptions(userOptions);

	editorElement = $(editorElement);
	editorElement.load(CSLEDIT.options.get("rootURL") + "/html/visualEditor.html", function () {
		CSLEDIT.schema = CSLEDIT.Schema();
		CSLEDIT.schema.callWhenReady(init);
	});

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
		var node = editorElement.find('span[cslid="' + cslId + '"]');

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
			node = editorElement.find('li[cslid="' + nodeIndex + '"]');
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
					unHighlightIfNotDescendentOf(editorElement.find('li[cslid=' + instanceNode.cslId + ']'));
				}
			}
			// highlight any remaining nodes in the call stack
			// (e.g. if a macro was called)
			highlightTree(nodeStack, null, depth);
		}
	};

	var unHighlightNode = function (nodeIndex) {
		var	node = editorElement.find('span[cslid="' + nodeIndex + '"]');

		if (node.hasClass("selected"))
		{
			// leave alone - selection takes precedence
		} else {
			node.removeClass("highlighted");
		}
	};

	var setupSyntaxHighlightForNode = function () {
		editorElement.find('span[cslid]').hover(
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
		editorElement.find('span[cslid]').click( function (event) {
			var target = $(event.target).closest("span[cslid]"),
				cslId = parseInt(target.attr('cslId'));
			reverseSelectNode(cslId);
		});

		// set up hovering over tree nodes
		editorElement.find('li[cslid] > a').unbind('mouseenter mouseleave');
		editorElement.find('li[cslid] > a').hover(
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
		editorElement.find('li[cslid] > a').hover(
			function (event) {
				var target = $(event.target),
					liElement = target.closest("li[cslid]"),
					cslId = parseInt(liElement.attr('cslId')),
					nodeAndParent = CSLEDIT.data.getNodeAndParent(cslId),
					documentation;
	   
				if (nodeAndParent.parent === null) {
					documentation = CSLEDIT.schema.documentation('root/' + nodeAndParent.node.name);
				} else {
					documentation = CSLEDIT.schema.documentation(
						nodeAndParent.parent.name + '/' + nodeAndParent.node.name);
				}

				if (documentation !== "") {
					target.attr("title", nodeAndParent.node.name + "\n\n" + documentation);
				}
			},
			function (event) {
				// no-op
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
			editorElement.find('span[cslid=' + viewController.selectedNode() + ']').addClass('selected');
		}
	};

	var createTreeView = function () {
		var nodeIndex = { index : 0 };
		var cslData = CSLEDIT.data.get(); 

		viewController.init(cslData,
		{
			formatCitations : formatExampleCitations,
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
		CSLEDIT.citationEngine.runCiteprocAndDisplayOutput(
			editorElement.find("#statusMessage"), editorElement.find("#exampleOutput"),
			editorElement.find("#formattedCitations"), editorElement.find("#formattedBibliography"),
			doSyntaxHighlighting);
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

	var showAddNodeDialog = function () {
		var dialogDiv = $('<div><\/div>'),
			node = CSLEDIT.data.getNode(viewController.selectedNode()),
			translatedCslId,
			translatedNodeInfo,
			translatedParentName,
			possibleElements,
			element,
			table = $('<table><\/table>'),
			possibleElementsExist = false;

		if (node === null) {
			alert("Please select a node in to create within first");
			return;
		}

		dialogDiv.attr('title', 'Add node within ' + CSLEDIT.uiConfig.displayNameFromNode(node));

		// populate with possible child elements based on schema
		
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


		$.each(possibleElements, function (element) {
			var img = '<td><\/td>',
				nodeIcon = CSLEDIT.uiConfig.nodeIcons[element];

			if (typeof nodeIcon !== "undefined") {
				img = '<td><img src="' + CSLEDIT.options.get('rootURL') + nodeIcon + '"><\/img><\/td>';
			}
			var displayName;

			displayName = 
				CSLEDIT.uiConfig.displayNameFromNode(new CSLEDIT.CslNode(element));

			console.log("display name = " + displayName );

			table.append($('<tr>' + img + '<td><button class="addNodeType" data-nodeName="' +
				element + '">' + 
				displayName + 
				'<\/button><\/td><\/tr>'));

			possibleElementsExist = true;
		});

		if (!possibleElementsExist) {
			alert("You can't create nodes within " + CSLEDIT.uiConfig.displayNameFromNode(node) + ".");
			return;
		}

		dialogDiv.append(table);

		dialogDiv.find('button.addNodeType').on('click', function (event) {
			var target = $(event.target),
				nodeName = target.attr('data-nodeName');

			CSLEDIT.controller.exec("addNode", [
				viewController.selectedNode(), 0, { name : nodeName, attributes : []}
			]);

			dialogDiv.dialog('destroy');
		});

		dialogDiv.dialog({modal : true});
	};

	var setupTreeEditorToolbar = function () {
		var toolbar = editorElement.find('#treeEditorToolbar'),
			addNodeButton = toolbar.find('button.add'),
			deleteNodeButton = toolbar.find('button.delete');

		assertEqual(addNodeButton.length, 1);
		assertEqual(deleteNodeButton.length, 1);

		addNodeButton.on('click', function () {
			showAddNodeDialog();

		});

		deleteNodeButton.on('click', function () {
			CSLEDIT.controller.exec("deleteNode", [viewController.selectedNode()]);
		});
	};

	var setupDropdownMenuHandler = function (selector) {
		var dropdown = $(selector),
			loadCsl;

		dropdown.filter('a.loadcsl').html(CSLEDIT.options.get('loadCSLName'));
		dropdown.filter('a.savecsl').html(CSLEDIT.options.get('saveCSLName'));

		editorElement.find(selector).click(function (event) {
			var clickedName = $(event.target).text(),
				selectedNodeId = editorElement.find('#treeEditor').jstree('get_selected'),
				parentNode = $(event.target).parent().parent(),
				parentNodeName,
				position,
				newStyle,
				styleURL;

			if (parentNode.attr("class") === "sub_menu")
			{
				parentNodeName = parentNode.siblings('a').text();

				if (/^Style/.test(parentNodeName)) {
					if (clickedName === "Revert (undo all changes)") {
						reloadPageWithNewStyle(styleURL);
					} else if ($(event.target).is('.savecsl')) {
						CSLEDIT.options.get('saveCSLFunc')(CSLEDIT.data.getCslCode());
					} else if ($(event.target).is('.loadcsl')) {
						var csl = CSLEDIT.options.get('loadCSLFunc')();
						if (csl !== null && typeof csl !== "undefined") {
							CSLEDIT.controller.exec('setCslCode', [csl]);
						}
					} else if (clickedName === "New style") {
						// fetch the URL
						$.ajax({
							url : CSLEDIT.options.get("rootURL") + "/content/newStyle.csl",
							success : function (result) {
								newStyle = result;
							},
							async: false
						});
						CSLEDIT.controller.exec('setCslCode', [newStyle]);
					} else if (clickedName === "Load Style from URL") {
						styleURL = prompt("Please enter the URL of the style you want to load"),

						// fetch the URL
						$.ajax({
							url : '../getFromOtherWebsite.php?url=' + encodeURIComponent(styleURL),
							success : function (result) {
								newStyle = result;
							},
							async: false
						});

						CSLEDIT.controller.exec("setCslCode", [newStyle]);
					} else if (clickedName === "Style Info") {
						viewController.selectNode(CSLEDIT.data.getNodesFromPath("style/info")[0].cslId);
					} else if (clickedName === "Global Formatting Options") {
						viewController.selectNode(CSLEDIT.data.getNodesFromPath("style")[0].cslId);
					}
				} else if (parentNodeName === "Edit") {
					if (clickedName === "Undo") {
						if (CSLEDIT.controller.commandHistory.length === 0) {
							alert("No commands to undo");
						} else {
							CSLEDIT.controller.undo();
						}
					}
				}
			}
		});
	};

	var init = function () {
		if (!$.browser.webkit && !$.browser.mozilla) {
			$('body').html("<h2>Please use the latest version of " +
				"Chrome or Firefox to view this page.<\/h2>").css({margin:50});
			return;
		}

		$(function(){
			editorElement.find("ul.dropdown li").hoverIntent(function(){
				$(this).addClass("hover");
				$('ul:first',this).css('visibility', 'visible');
			}, function(){
				$(this).removeClass("hover");
				$('ul:first',this).css('visibility', 'hidden');
			});
			
			editorElement.find("ul.dropdown li ul li:has(ul)").find("a:first").append(" &raquo; ");
		});

		CSLEDIT.data.initPageStyle( function () {
			var userOnChangeCallback = CSLEDIT.options.get("onChange");
			
			syntaxHighlighter = CSLEDIT.SyntaxHighlighter(editorElement);

			viewController = CSLEDIT.ViewController(
				editorElement.find("#treeEditor"),
				editorElement.find("#titlebar"),
				editorElement.find("#elementProperties"),
				editorElement.find("#nodePathView"),
				setupDropdownMenuHandler,
				syntaxHighlighter);

			CSLEDIT.controller.setCslData(CSLEDIT.data);
			CSLEDIT.data.addViewController(viewController);

			if (typeof userOnChangeCallback === "function") {
				CSLEDIT.data.addViewController({
					styleChanged : function (command) {
						if (command === "formatCitations") {
							userOnChangeCallback();
						}
					}
				});
			}

			createTreeView();
		});

		setupTreeEditorToolbar();
		setupDropdownMenuHandler(".dropdown a");

		CSLEDIT.editReferences.init(
			editorElement.find('ul.#exampleCitation1'), formatExampleCitations, 0, [0]);
		CSLEDIT.editReferences.init(
			editorElement.find('ul.#exampleCitation2'), formatExampleCitations, 1, [11], $('#exampleOutput'));

		editorElement.find('#mainContainer').layout({
			closable : false,
			resizble : true,
			livePaneResizing : true,
			west__size : CSLEDIT.storage.getItem("CSLEDIT.geometry.leftPaneWidth") || 240,
			west__minSize : 200,
			onresize : function (paneName, paneElement, paneState) {
				if (paneState.edge === "west") {
					CSLEDIT.storage.setItem("CSLEDIT.geometry.leftPaneWidth", paneState.size);
				}
			}
		});

		editorElement.find("#rightContainer").layout({
			closable : false,
			resizable : true,
			livePaneResizing : true,
			north__size : CSLEDIT.storage.getItem("CSLEDIT.geometry.topPaneWidth") || 300,
			onresize : function (paneName, paneElement, paneState) {
				if (paneState.edge === "north") {
					CSLEDIT.storage.setItem("CSLEDIT.geometry.topPaneWidth", paneState.size);
				}
			}
		});

		CSLEDIT.notificationBar.init(editorElement.find('#notificationBar'));
	};

	// public API
	return {
		setCslCode : function (cslCode) {
			CSLEDIT.controller.exec('setCslCode', [cslCode]);
		},
		getCslCode : function () {
			CSLEDIT.data.getCslCode();
		},
		getStyleName : function () {
			var styleNameNode = CSLEDIT.data.getNodesFromPath('style/info/title')[0];
			return styleNameNode.textValue;
		},
		getStyleId : function () {
			var styleIdNode = CSLEDIT.data.getNodesFromPath('style/info/id')[0];
			return styleIdNode.textValue;
		},
		setStyleId : function (styleId) {
			var styleIdNode = CSLEDIT.data.getNodesFromPath('style/info/id')[0];
			styleIdNode.textValue = styleId;
			CSLEDIT.controller.exec('amendNode', [styleIdNode.cslId, styleIdNode]);
		}
	};
};
