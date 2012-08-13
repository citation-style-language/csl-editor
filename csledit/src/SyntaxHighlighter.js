"use strict";

define(['src/CslNode', 'src/cslData', 'src/debug'], function (CSLEDIT_CslNode, CSLEDIT_data, debug) {
	return function (editorElement) {
		var selectedCslId = -1,
			hoveredNodeStack = [],
			highlightedCss,
			selectedCss,
			unHighlightedCss,
			highlightedTreeNodes = $(),
			highlightTimeout;

		var selectedNodeChanged = function (newSelectedCslId) {
			selectedCslId = newSelectedCslId;

			editorElement.find('span[cslid].highlighted').removeClass("highlighted");
			editorElement.find('span[cslid].selected').removeClass("selected");

			editorElement.find('span[cslid="' + selectedCslId + '"]').removeClass("highlighted");
			editorElement.find('span[cslid="' + selectedCslId + '"]').addClass("selected");
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
		};

		var removeFromHoveredNodeStack = function (cslidElements, removeAll) {
			// pop one node, or all nodes, from hoveredNodeStack
			var poppedNode;

			if (hoveredNodeStack.length > 0) {
				poppedNode = hoveredNodeStack.pop();
				unHighlightNode(poppedNode, cslidElements);

				if (removeAll) {
					removeFromHoveredNodeStack(cslidElements, removeAll);
				}
			}
		};

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

		var reverseSelectNode = function (clickedCslId) {
			var index,
				cslId = parseInt(hoveredNodeStack[hoveredNodeStack.length - 1], 10),
				selectedNode;

			if (hoveredNodeStack.length === 0) {
				cslId = clickedCslId;
			} else {
				// skip the macro definition nodes, jump to the referencing 'text' node instead
				selectedNode = CSLEDIT_data.getNode(cslId);
				if (selectedNode.name === "macro") {
				debug.assert(hoveredNodeStack.length > 1);
					cslId = hoveredNodeStack[hoveredNodeStack.length - 2];
				}
			}

			if (selectedCslId !== cslId) {
				CSLEDIT_viewController.selectNode(cslId, highlightedTreeNodes);
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
			var nodeIndex, parentNode, parentIndex, highlightedNode;

			if (node === null) {
				nodeIndex = nodeStack.pop();
				if (typeof nodeIndex === "undefined") {
					return;
				}
				node = editorElement.find('li[cslid="' + nodeIndex + '"]');
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
						unHighlightIfNotDescendentOf(editorElement.find('li[cslid=' + instanceNode.cslId + ']'));
					}
				}
				// highlight any remaining nodes in the call stack
				// (e.g. if a macro was called)
				highlightTree(nodeStack, null, depth);
			}
		};

		var unHighlightNode = function (nodeIndex, cslidElements) {
			var	node;
			if (typeof(cslidElements) === "undefined") {
				node = editorElement.find('span[cslid="' + nodeIndex + '"]');
			} else {
				node = cslidElements.filter('span[cslid="' + nodeIndex + '"]');
			}

			if (node.hasClass("selected"))
			{
				// leave alone - selection takes precedence
			} else {
				node.removeClass("highlighted");
			}
		};

		var hover = function (event) {
			var cslidElements = $('span[cslid]'),
				target = $(event.target).closest("span[cslid]");
			
			// remove all
			removeFromHoveredNodeStack(cslidElements, true);

			// populate hovered node stack
			addToHoveredNodeStack(target);

			var lastNode = hoveredNodeStack[hoveredNodeStack.length - 1];
		debug.assertEqual(lastNode, target.attr("cslid"), "applySyntax");

			if (hoveredNodeStack.length > 0) {
				highlightNode(hoveredNodeStack.slice());
			}
		};

		var unhover = function () {
			var cslidElements = $('span[cslid]');

			removeFromHoveredNodeStack(cslidElements);
			
			if (hoveredNodeStack.length > 0) {
				highlightNode(hoveredNodeStack.slice());
			} else {
				unHighlightTree();
			}
		};

		var setupEventHandlers = function () {
			editorElement.find('span[cslid]').hover(hover, unhover);

			// set up click handling
			editorElement.find('span[cslid]').click(function (event) {
				var target = $(event.target).closest("span[cslid]"),
					cslId = parseInt(target.attr('cslId'), 10);
				reverseSelectNode(cslId);
			});

			// set up hovering over tree nodes
			editorElement.find('li[cslid] > a').unbind('mouseenter mouseleave');
			editorElement.find('li[cslid] > a').hover(
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
			editorElement.find('li[cslid] > a').hover(
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

		var setupSyntaxHighlighting = function () {
			var numCslNodes = CSLEDIT_data.numCslNodes();

			// clear the hovered node stack
			hoveredNodeStack.length = 0;
			selectedCslId = -1;

			setupEventHandlers();

			// highlight the selected node if there is one
			if (CSLEDIT_viewController.selectedNode() !== -1) {
				editorElement.find(
					'span[cslid=' + CSLEDIT_viewController.selectedNode() + ']').addClass('selected');
			}
		};

		return {
			selectedNodeChanged : selectedNodeChanged,
			setupSyntaxHighlighting : setupSyntaxHighlighting,
			hover : hover,
			unhover : unhover,
			reverseSelectNode : reverseSelectNode
		};
	};
});
