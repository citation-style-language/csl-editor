"use strict";

// An CSLEDIT_ViewController instance ensures that all the views are notified
// whenever one of the following functions is called:
//  
//   addNode
//   deleteNode
//   amendNode
//   newStyle

define(
		[	'src/Titlebar',
			'src/SmartTree',
			'src/SmartTreeHeading',
			'src/propertyPanel',
			'src/NodePathView',
			'src/notificationBar',
			'src/CslNode',
			'src/Iterator',
			'src/dataInstance',
			'src/uiConfig',
			'external/mustache',
			'src/debug',
			'jquery.scrollTo'
		],
		function (
			CSLEDIT_Titlebar,
			CSLEDIT_SmartTree,
			CSLEDIT_SmartTreeHeading,
			CSLEDIT_propertyPanel,
			CSLEDIT_NodePathView,
			CSLEDIT_notificationBar,
			CSLEDIT_CslNode,
			CSLEDIT_Iterator,
			CSLEDIT_data,
			CSLEDIT_uiConfig,
			Mustache,
			debug,
			jquery_scrollTo
		) {
	// Creates a ViewController responsible for adding and maintaining the content
	// in all the given jQuery elements
	var CSLEDIT_ViewController = function ( 
		treeView, titlebarElement, propertyPanelElement, nodePathElement,
		syntaxHighlighter) {
	
		var views = [],
			treesLoaded,
			treesToLoad,
			callbacks,
			selectedView = null,
			selectedNodeId = -1,
			recentlyEditedMacro = -1,
			nodePathView,
			suppressSelectNode = false;

		// Called every time one of the jsTrees have finished loading
		var treeLoaded = function () {
			treesLoaded++;

			if (treesLoaded === treesToLoad) {
				if (selectedNode() === -1) {
					selectNode(CSLEDIT_data.getNodesFromPath('style/info')[0].cslId);
				}
				propagateErrors();
				callbacks.formatCitations();
				callbacks.viewInitialised();
			}
		};

		// Sets up all the views, including:
		//
		// - SmartTree views
		// - SmartTreeHeading views
		// - TitleBar
		// - NodePathView
		var init = function (cslData, _callbacks) {
			var eventName,
				jsTreeData,
				citationNodeId,
				citationNodeData,
				citationTree,
				cslId,
				nodes,
				row;

			treesLoaded = 0;
			treesToLoad = 0;

			selectedNodeId = -1;
			views = [];

			views.push(new CSLEDIT_Titlebar(titlebarElement));

			callbacks = _callbacks;

			treeView.html('');
			$.each(CSLEDIT_uiConfig.smartTreeSchema, function (index, value) {
				row = $('');
				row = $('<div id="%1"><div class="heading"/><div class="tree"/></div>'.replace(
					'%1', value.id));
				row.appendTo(treeView);
				treeView.append($('<div class=spacer></div>'));
			});

			$.each(CSLEDIT_uiConfig.smartTreeSchema, function (index, value) {
				var tree, heading;
				treesToLoad++;
				
				heading = new CSLEDIT_SmartTreeHeading(
					treeView.find('#' + value.id + ' .heading'), value.headingNodePath,
					value.name, value.headingNodePossibleChildren, value.headingNodeShowPropertyPanel);
				heading.setCallbacks({
					selectNode : selectNodeInView(heading)
				});
				views.push(heading);
				syntaxHighlighter.addHighlightableElements(heading.element);

				tree = new CSLEDIT_SmartTree(treeView.find('#' + value.id + ' .tree'), value.nodePaths, 
					{
						enableMacroLinks : value.macroLinks,
						leafNodes : value.leafNodes
					});

				// Use this for debugging if you're not sure the view accurately reflects the data
				//tree._setVerifyAllChanges(true);
				tree.setCallbacks({
					loaded : treeLoaded,
					selectNode : selectNodeInView(tree),
					moveNode : callbacks.moveNode,
					deleteNode : callbacks.deleteNode,
					checkMove : callbacks.checkMove
				});
				tree.createTree();
				views.push(tree);
			});

			nodePathView = new CSLEDIT_NodePathView(nodePathElement, {
				selectNodeFromPath : selectNodeFromPath
			});
			syntaxHighlighter.addHighlightableElements(nodePathElement);
		};
		
		// Called after selecting a node
		var selectedNodeChanged = function () {
			var nodeAndParent,
				node,
				parentNode,
				parentNodeName,
				possibleElements,
				element,
				possibleChildNodesDropdown,
				schemaAttributes,
				dataType,
				translatedCslId,
				translatedNodeInfo,
				translatedParentName;

			if (selectedView !== null &&
					selectedNode() === -1 && "getMissingNodePath" in selectedView) {
				propertyPanelElement.html(Mustache.to_html(
					'<h3>The {{missingNode}} node doesn\'t exist</h3>' + 
					'<p>Use the "+" Add Node button at the top left to add it.</p>',
					{ missingNode : selectedView.getMissingNodePath() }
				));
				nodePathView.nodeMissing(selectedView.getMissingNodePath());
				syntaxHighlighter.selectedNodeChanged(selectedNode());		
				return;
			}

			nodeAndParent = CSLEDIT_data.getNodeAndParent(selectedNode());
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

			nodePathView.selectNode(getSelectedNodePath());

			if (selectedViewProperty("showPropertyPanel") === false) {
				propertyPanelElement.children().remove();
			} else {
				CSLEDIT_propertyPanel.setup(propertyPanelElement, node, parentNodeName + '/' + node.name);
			}

			syntaxHighlighter.selectedNodeChanged(node.cslId);		
		};

		// Returns a function to select a node in the given view
		var selectNodeInView = function (thisView) {
			return function (event, ui) {
				// deselect nodes in other views
				$.each(views, function (i, view) {
					if (view !== thisView) {
						if ("deselectAll" in view) {
							view.deselectAll();
						}
					}
				});

				selectedView = thisView;
				selectedNodeId = parseInt(thisView.selectedNode(), 10);

				if (/"/.test(thisView.selectedNode())) {
					debug.log("WARNING!!!!! view: " + JSON.stringify(Object.keys(thisView)) +
							" returned cslId with quotes");
				}
		
				selectedNodeChanged();
			};
		};

		// Returns a list of the currently selected node stack cslIds,
		// or "no selected tree" if no view is currently selected
		var getSelectedNodePath = function () {
			if (selectedView === null) {
				return "no selected tree";
			}

			return selectedView.getSelectedNodePath();
		};

		var macroEditNotification = function (id) {
			var nodeStack = CSLEDIT_data.getNodeStack(id),
				node,
				iter,
				next,
				macroName,
				timesUsed;

			while (nodeStack.length > 0) {
				node = nodeStack.pop();
				if (node.name === "macro" && recentlyEditedMacro !== node.cslId) {
					macroName = new CSLEDIT_CslNode(node).getAttr("name");
					if (macroName === "") {
						return;
					}

					// check how many places this macro is used
					iter = new CSLEDIT_Iterator(CSLEDIT_data.get());
					timesUsed = 0;

					while (iter.hasNext()) {
						next = new CSLEDIT_CslNode(iter.next());

						if (next.name === "text" && next.getAttr("macro") === macroName) {
							timesUsed++;

							if (timesUsed > 1) {
								recentlyEditedMacro = node.cslId;
								CSLEDIT_notificationBar.showMessage(
									'You just edited a macro which is used in multiple places');
							}
						}
					}
				}
			}
		};

		// If suppress is true, an addNode event won't change the selection
		// If suppress is false, an addNode event select the newly added node
		var setSuppressSelectNode = function (suppress) {
			suppressSelectNode = suppress;
		};

		// Responds to an addNode event
		var addNode = function (id, position, newNode, nodesAdded) {
			macroEditNotification(id);	
			$.each(views, function (i, view) {
				if ("addNode" in view) {
					view.addNode(id, position, newNode, nodesAdded);
				}
			});
			if (!suppressSelectNode) {
				selectNode(newNode.cslId);
			}
		};

		// Responds to a deleteNode event
		var deleteNode = function (id, nodesDeleted) {
			propertyPanelElement.html('');
			nodePathView.selectNode([]);

			macroEditNotification(id - 1);
			$.each(views, function (i, view) {
				if ("deleteNode" in view) {
					view.deleteNode(id, nodesDeleted);
				}
			});
		};

		// Responds to an amendNode event
		var amendNode = function (id, amendedNode) {
			macroEditNotification(id);
			$.each(views, function (i, view) {
				if ("amendNode" in view) {
					view.amendNode(id, amendedNode);
				}
			});
			debug.log("amendNode - calling selectedNodeChanged");
			selectedNodeChanged();
		};

		// Responds to an updateFinished event
		var updateFinished = function () {
			propagateErrors();
			callbacks.formatCitations();
		};

		// Responds to the newStyle event,
		// Uses the nuclear option and re-builds everything
		var newStyle = function () {
			init(CSLEDIT_data.get(), callbacks);
		};

		// Select the given cslId node from within the given highlighted nodes
		var selectNode = function (
				cslId,
				highlightedNodes,
				missingNodePath // optional: if selection represents a missing node
				) {
			var treeNode,
				headingNode;

			// ensure it's a number
			cslId = parseInt(cslId, 10);

			if (cslId === -1) {
				selectedNodeId = cslId;
				selectedNodeChanged(missingNodePath);
				return;
			}

			headingNode = treeView.find('span[cslid=' + cslId + ']');

			if (typeof(highlightedNodes) === "undefined") {
				treeNode = treeView.find('li[cslid=' + cslId + '] > a');
			} else {
				treeNode = highlightedNodes.filter('li[cslid=' + cslId + ']').children('a');
			}

			if (headingNode.length === 0 && treeNode.length > 0) {
				clickNode(treeNode.first());
			} else {
				selectedNodeId = cslId;
				selectedNodeChanged();
			}
		};

		// Selects the first occurance of the given nodePath
		// within the tree view
		var selectNodeFromPath = function (nodePath) {
			var treeNode = treeView,
				cslId;

			debug.log("select node from path");
			$.each(nodePath, function (i, cslId) {
				treeNode = treeNode.find('li[cslId="' + cslId + '"]');
			});

			treeNode = treeNode.children('a');

			if (treeNode.length > 0) {
				clickNode(treeNode.first());
			}
		};

		var clickNode = function (node) {
			node.click();

			treeView.scrollTo(node, 200, {
				offset: {left: -treeView.width() + 80, top: -treeView.height() * 0.4}
			});
		};

		// Returns the cslId of the currently selected node
		var selectedNode = function () {
			return selectedNodeId;
		};

		// Returns the given member variable of the currently selected view,
		// or null if it doesn't exist
		var selectedViewProperty = function (property) {
			if (selectedView === null) {
				return null;
			}
			if (property in selectedView) {
				return selectedView[property];
			}
			return null;
		};

		// Expand the node with the given cslId if it exists in a tree view
		var expandNode = function (cslId) {
			$.each(views, function (i, view) {
				if ('expandNode' in view) {
					view.expandNode(cslId);
				}
			});
		};

		// Will execute the CSLEDIT_ViewController member function with name 'command'
		// and pass it the given arguments
		var styleChanged = function (command, args) {
			args = args || [];
			debug.log("executing view update: " + command + "(" + args.join(", ") + ")");
			this[command].apply(null, args);
		};
		
		// Collapses all collapsable views
		var collapseAll = function () {
			$.each(views, function (i, view) {
				if ('collapseAll' in view) {
					view.collapseAll();
				}
			});
		};

		// For tree 'li' elements nodes with attr 'data-error',
		// add an errorParent class to all 'li' parents
		var propagateErrors = function () {
			// propagate data-error to parent elements
			treeView.find('li.errorParent').removeClass('errorParent');
			treeView.find('li[data-error]').each(function (i, element) {
				var parents = $(element).parents('li');
				parents.addClass('errorParent');
			});
		};

		// Returns the node path ('/' separated list of node names) of a node
		// which is currently selected in the view, but doesn't exist in the
		// current CSL style
		//
		// (e.g. after clicking on the "Bibliography" SmartTreeHeading for a style
		// without a bibliography)
		var selectedMissingNodePath = function () {
			if (selectedView !== null && "getMissingNodePath" in selectedView) {
				return selectedView.getMissingNodePath();
			}
		};

		// public:
		return {
			init : init,

			addNode : addNode,
			deleteNode : deleteNode,
			amendNode : amendNode,
			newStyle : newStyle,
			updateFinished : updateFinished,

			selectNode : selectNode,
			selectedNode : selectedNode,
			selectedMissingNodePath : selectedMissingNodePath,

			expandNode : expandNode,
			collapseAll : collapseAll,
				
			styleChanged : styleChanged,
			getSelectedNodePath : getSelectedNodePath,
			selectNodeFromPath : selectNodeFromPath,
			setSuppressSelectNode : setSuppressSelectNode,
			selectedViewProperty : selectedViewProperty
		};
	};

	return CSLEDIT_ViewController;
});

