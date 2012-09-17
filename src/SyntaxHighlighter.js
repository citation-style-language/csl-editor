"use strict";

// Implements:
//
// - Syntax highlighting when hovering over a) the tree view and b) the example output
//
// - Reverse selecting of the relevant CSL node when clicking on the example output

define(['src/CslNode', 'src/dataInstance', 'src/debug'], function (CSLEDIT_CslNode, CSLEDIT_data, debug) {
	return function (highlightableElements, treeView) {
		var selectedCslId = -1,
			hoveredNodeStack = [],
			highlightedCss,
			selectedCss,
			unHighlightedCss,
			highlightedTreeNodes = $(),
			highlightTimeout;

		// Returns all spans and divs with the given cslId, and optionally
		// with the given className
		var spansAndDivs = function (cslId, className) {
			var attribute;
			if (typeof(cslId) === "undefined" || cslId === null) {
				attribute = "[cslid]";
			} else {
				attribute = "[cslid=" + cslId + "]";
			}
			if (typeof(className) !== "undefined" && className !== null) {
				attribute += "." + className;
			}

			return highlightableElements.find('div' + attribute + ', ' + 'span' + attribute);
		};

		// Called after every time the selected node changes
		var selectedNodeChanged = function (newSelectedCslId) {
			selectedCslId = newSelectedCslId;

			spansAndDivs(null, 'highlighted').removeClass("highlighted");
			spansAndDivs(null, 'selected').removeClass("selected");

			spansAndDivs(selectedCslId)
				.removeClass("highlighted")
				.addClass("selected");
		};

		// build stack starting at the innermost node (the last in the hoveredNodeStack list)
		// and successively prepending the outer nodes to the start of the list with unshift()
		var addToHoveredNodeStack = function (target) {
			var parentNode;
			
			if (typeof target.attr("cslid") !== "undefined") {
				hoveredNodeStack.unshift(target.attr("cslid"));
			}

			parentNode = target.parent();
			if (parentNode.length > 0) {
				addToHoveredNodeStack(parentNode);
			}
		};

		// Pop one node from the hoveredNodeStack
		// Or, if removeAll is true, empty the hoveredNodeStack
		//
		// Un-highlight all popped nodes which are found within the cslIdElements jQuery selection
		var removeFromHoveredNodeStack = function (cslIdElements, removeAll /* optional */) {
			var poppedNode;

			if (hoveredNodeStack.length > 0) {
				poppedNode = hoveredNodeStack.pop();
				unHighlightNode(poppedNode, cslIdElements);

				if (removeAll) {
					removeFromHoveredNodeStack(cslIdElements, removeAll);
				}
			}
		};

		// Add highlighting to the top node in the nodeStack
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

		// Add highlighting to the cslId node
		var highlightOutput = function (cslId)
		{
			var node = spansAndDivs(cslId);

			if (node.hasClass("selected"))
			{
				// leave alone - selection takes precedence
			} else {
				node.addClass("highlighted");
			}
		};

		// Selects the node which the user is currently hovered over
		//
		// (called reverseSelect because it maps from the output representation to the 
		// node in the original CSL tree)
		var reverseSelectNode = function (clickedCslId) {
			var index,
				cslId = parseInt(hoveredNodeStack[hoveredNodeStack.length - 1], 10),
				selectedNode;

			if (hoveredNodeStack.length === 0) {
				cslId = clickedCslId;
			} else {
				selectedNode = CSLEDIT_data.getNode(cslId);
				if (selectedNode.name === "macro") {
					if (hoveredNodeStack.length > 1) {
						// Skip the macro definition nodes, jump to the referencing 'text' node instead
						cslId = hoveredNodeStack[hoveredNodeStack.length - 2];
					} else {
						// The macro node is the outermost one, this happens in the
						// NodePathView when selecting a Macro definition within the
						// 'Macros' tree
						cslId = clickedCslId;
					}
				}
			}

			if (selectedCslId !== cslId) {
				CSLEDIT_viewController.selectNode(cslId, highlightedTreeNodes);
			}
		};

		// Un-highlight all tree nodes
		var unHighlightTree = function () {
			var node;

			clearTimeout(highlightTimeout);
			highlightedTreeNodes.children('a').removeClass("highlighted");
		};

		// Un-highlight any tree node which isn't a descendent of the
		// instanceNode jQuery element
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
			var nodeIndex, parentNode, parentIndex, highlightedNode;

			if (node === null) {
				nodeIndex = nodeStack.pop();
				if (typeof nodeIndex === "undefined") {
					return;
				}
				node = treeView.find('li[cslid="' + nodeIndex + '"]');
			}

			depth++;
			debug.assert(depth < 150, "stack overflow!");

			if (node.is('li')) {
				highlightedNode = node.children('a');
				highlightedTreeNodes = highlightedTreeNodes.add(node);
				highlightedNode.addClass("highlighted");
			}

			parentNode = node.parent().closest("li[cslid]");

			if (parentNode.length !== 0) {
				parentIndex = parentNode.attr("cslid");
				if (nodeStack[nodeStack.length - 1] === parentIndex) {
					nodeStack.pop();
				}
				highlightTree(nodeStack, parentNode, depth);
			} else {
				if (nodeStack.length > 1) {
					// Look for a possible macro instance "text" node in the nodeStack,
					// if found, clear the highlighting for all macros not within this
					// instance or the definition
					var instanceNode;
					instanceNode = new CSLEDIT_CslNode(
						CSLEDIT_data.getNode(parseInt(nodeStack[nodeStack.length - 2], 10)));
					if (instanceNode.name === "text" && instanceNode.getAttr("macro") !== "") {
						unHighlightIfNotDescendentOf(treeView.find('li[cslid=' + instanceNode.cslId + ']'));
					}
				}
				// highlight any remaining nodes in the call stack
				// (e.g. if a macro was called)
				highlightTree(nodeStack, null, depth);
			}
		};

		// Un-highlight the node with the given cslId
		var unHighlightNode = function (cslId, cslIdElements) {
			var	node;
			if (typeof(cslIdElements) === "undefined") {
				node = spansAndDivs(cslId);
			} else {
				node = cslIdElements.filter('[cslid="' + cslId + '"]');
			}

			if (node.hasClass("selected"))
			{
				// leave alone - selection takes precedence
			} else {
				node.removeClass("highlighted");
			}
		};

		// Respond to hover event in the example output spans
		var hover = function (event) {
			var cslIdElements = spansAndDivs(),
				target = $(event.target).closest("[cslid]");
			
			// remove all
			removeFromHoveredNodeStack(cslIdElements, true);

			// populate hovered node stack
			addToHoveredNodeStack(target);

			var lastNode = hoveredNodeStack[hoveredNodeStack.length - 1];
			debug.assertEqual(lastNode, target.attr("cslid"), "applySyntax");

			if (hoveredNodeStack.length > 0) {
				highlightNode(hoveredNodeStack.slice());
			}
		};

		// Respond to unhover event in the example output spans
		var unhover = function () {
			var cslIdElements = spansAndDivs();

			removeFromHoveredNodeStack(cslIdElements);
			
			if (hoveredNodeStack.length > 0) {
				highlightNode(hoveredNodeStack.slice());
			} else {
				unHighlightTree();
			}
		};

		// Setup event handlers for
		// - Hovering over example output
		// - Clicking example output
		// - Hovering over tree view
		var setupEventHandlers = function () {
			spansAndDivs().hover(hover, unhover);

			// set up click handling
			spansAndDivs().click(function (event) {
				var target = $(event.target).closest("[cslid]"),
					cslId = parseInt(target.attr('cslId'), 10);
				reverseSelectNode(cslId);
			});

			// set up hovering over tree nodes
			treeView.find('li[cslid] > a').unbind('mouseenter mouseleave');
			treeView.find('li[cslid] > a').hover(
				function (event) {
					var target = $(event.target).closest("li[cslid]"),
						cslId = parseInt(target.attr('cslId'), 10);
					highlightOutput(cslId);
				},
				function (event) {
					var target = $(event.target).closest("li[cslid]"),
						cslId = parseInt(target.attr('cslId'), 10);
					unHighlightNode(cslId);
				}
			);
			treeView.find('li[cslid] > a').hover(
				function (event) {
					var target = $(event.target),
						liElement = target.closest("li[cslid]"),
						cslId = parseInt(liElement.attr('cslId'), 10),
						nodeAndParent = CSLEDIT_data.getNodeAndParent(cslId),
						documentation;
					
					if (nodeAndParent.parent === null) {
						documentation = CSLEDIT_schema.documentation('root/' + nodeAndParent.node.name);
					} else {
						documentation = CSLEDIT_schema.documentation(
							nodeAndParent.parent.name + '/' + nodeAndParent.node.name);
					}

					if (documentation !== "") {
						target.attr("title", nodeAndParent.node.name + "\n\n" + documentation);
					}
				},
				function (event) { /* no-op */ }
			);
		};

		// Setup event handlers and other initialisation
		var setupSyntaxHighlighting = function () {
			// clear the hovered node stack
			hoveredNodeStack.length = 0;
			selectedCslId = -1;

			setupEventHandlers();

			// highlight the selected node if there is one
			if (CSLEDIT_viewController.selectedNode() !== -1) {
				spansAndDivs(CSLEDIT_viewController.selectedNode()).addClass('selected');
			}
		};
		
		// Add elements to the jQuery selection of elements to apply syntax highlighting
		//
		// The elements must contain span[cslid] and/or div[cslid] descendent elements
		// for this to work
		var addHighlightableElements = function (newElements) {
			highlightableElements = highlightableElements.add(newElements);
		}

		return {
			selectedNodeChanged : selectedNodeChanged,
			setupSyntaxHighlighting : setupSyntaxHighlighting,
			hover : hover,
			unhover : unhover,
			reverseSelectNode : reverseSelectNode,
			addHighlightableElements : addHighlightableElements
		};
	};
});
