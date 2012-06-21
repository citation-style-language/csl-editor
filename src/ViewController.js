"use strict";

CSLEDIT = CSLEDIT || {};

CSLEDIT.ViewController = function ( 
		treeView, titlebarElement, propertyPanelElement, nodePathElement,
		setupDropdownMenuHandler, syntaxHighlighter) {
	var	// smartTrees display a subset of the proper CSL tree
		// and allow transformations of the data
		//
		// name : visible name
		// nodeData : displayed in property panel
		// children : displayed in tree view as children
		smartTreeSchema = [
			{
				id : "citations",
				name : "Inline Citations",
				nodePaths : ["style/citation/layout"],
				macroLinks : true,
				buttons : [
				{
					type : "cslNode",
					icon : "/external/famfamfam-icons/cog.png",
					node : "style/citation"
				},
				{
					type : "cslNode",
					icon : "/external/fugue-icons/sort-alphabet.png",
					node : "style/citation/sort"
				}
				]
			},
			{
				id : "bibliography",
				name : "Bibliography",
				nodePaths : ["style/bibliography/layout"],
				macroLinks : true,
				buttons : [
				{
					type : "cslNode",
					icon : "/external/famfamfam-icons/cog.png",
					node : "style/bibliography"
				},
				{
					type : "cslNode",
					icon : "/external/fugue-icons/sort-alphabet.png",
					node : "style/bibliography/sort"
				}
				]
			},/*
			{
				id : "macro",
				name : "Macros",
				nodePaths : ["style/macro"],
				buttons : [
				{
					type : "custom",
					text : "Add macro",
					onClick : function () {
						// add after the last macro
						var macroNodes = CSLEDIT.data.getNodesFromPath("style/macro"),
							position;

						position = CSLEDIT.data.indexOfChild(macroNodes[macroNodes.length - 1],
							CSLEDIT.data.getNodesFromPath("style")[0]);
						
						CSLEDIT.controller.exec("addNode",
							[
								0, position + 1, 
								new CSLEDIT.CslNode("macro", [{
									key: "name",
									value: "New Macro",
									enabled: true
								}])
							]);
					}
				}
				]
			},*/
			{
				id : "locale",
				name : "Advanced",
				macroLinks : false,
				nodePaths : ["style"]
			}
		],
		views = [],
		treesLoaded = 0,
		treesToLoad = 0,
		callbacks,
		selectedTree = null,
		selectedNodeId = -1,
		nodeButtons,
		recentlyEditedMacro = -1,
		nodePathView,
		suppressSelectNode = false;

	var treeLoaded = function () {
		treesLoaded++;

		if (treesLoaded === treesToLoad) {
			if (selectedNode() === -1) {
				selectNode(CSLEDIT.data.getNodesFromPath('style/info')[0].cslId);
			}
			callbacks.formatCitations();
		};
	};

	var newStyle = function () {
		init(CSLEDIT.data.get(), callbacks);
	};

	var init = function (cslData, _callbacks) {
		var eventName,
			jsTreeData,
			citationNodeId,
			citationNodeData,
			citationTree,
			cslId,
			nodes,
			table,
			row;

		selectedNodeId = -1;
		views = [];

		views.push(new CSLEDIT.Titlebar(titlebarElement));

		callbacks = _callbacks;

		nodeButtons = [];
		
		treeView.html('');
		$.each(smartTreeSchema, function (index, value) {
			table = $('');//<table></table>');
			row = $('');//<tr></tr>');
			if (typeof value.buttons !== "undefined") {
				$.each(value.buttons, function (i, button) {
					var buttonElement;
					switch (button.type) {
						case "cslNode":
							nodes = CSLEDIT.data.getNodesFromPath(button.node, cslData);
							if (nodes.length > 0) {
								cslId = nodes[0].cslId;
							} else {
								cslId = -1;
							}
				
							buttonElement = $('<div class="cslNodeButton"></div>');
							views.push(new CSLEDIT.EditNodeButton(buttonElement, button.node, cslId,
								CSLEDIT.options.get("rootURL") + button.icon, function (cslId, selectedView) {
									selectedTree = selectedView;
									selectedNodeId = cslId;

									// deselect nodes in trees
									$.each(views, function (i, view) {
										if ("deselectAll" in view) {
											view.deselectAll();
										}
									});

									selectedNodeChanged();
								}));
							break;
						case "custom":
							buttonElement = $('<button class="customButton">' + 
									button.text + '</button>');
							buttonElement.on('click', button.onClick);
							break;
						default:
							assert(false);
					}
					buttonElement.appendTo(treeView);
				});
			}
			$('<h3>%1</h3>'.replace('%1', value.name)).appendTo(treeView);
			row = $('<div id="%1"></div>'.replace('%1', value.id));
			row.appendTo(treeView);
			treeView.append($('<div class=spacer></div>'));
		});

		$.each(smartTreeSchema, function (index, value) {
			var tree;
			treesToLoad++;
			tree = CSLEDIT.SmartTree(treeView.children("#" + value.id), value.nodePaths, 
				value.macroLinks);

			// Use this for debugging if you're not sure the view accurately reflects the data
			//tree.setVerifyAllChanges(true);
			tree.setCallbacks({
				loaded : treeLoaded,
				selectNode : selectNodeInTree(tree),
				moveNode : callbacks.moveNode,
				deleteNode : callbacks.deleteNode,
				checkMove : callbacks.checkMove
			});
			tree.createTree();
			views.push(tree);
		});

		nodePathView = new CSLEDIT.NodePathView(nodePathElement, {
			selectNodeFromPath : selectNodeFromPath
		});
		

	};
	
	var selectedNodeChanged = function() {
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

		if (selectedNode() === -1) {
			// clear property panel if nothing selected
			propertyPanelElement.children().remove();
			return;
		}

		nodeAndParent = CSLEDIT.data.getNodeAndParent(selectedNode());
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

		// reregister dropdown handler after changes
		setupDropdownMenuHandler("#possibleChildNodes a");

		dataType = CSLEDIT.schema.elementDataType(parentNodeName + "/" + node.name);
		schemaAttributes = CSLEDIT.schema.attributes(parentNodeName + "/" + node.name);

		switch (node.name) {
			case "sort":
				CSLEDIT.sortPropertyPanel.setupPanel(propertyPanelElement, node);
				break;
			case "info":
				CSLEDIT.infoPropertyPanel.setupPanel(propertyPanelElement, node);
				break;
			case "if":
			case "else-if":
				new CSLEDIT.conditionalPropertyPanel(propertyPanelElement, node);
				break;
			default:
			CSLEDIT.propertyPanel.setupPanel(
				propertyPanelElement, node, dataType, schemaAttributes,
				CSLEDIT.schema.choices(parentNodeName + "/" + node.name));
		}

		syntaxHighlighter.selectedNodeChanged(node.cslId);		
	};

	var selectNodeInTree = function (tree) {
		return function (event, ui) {
			// deselect nodes in other trees
			$.each(views, function (i, view) {
				if (view !== tree) {
					if ("deselectAll" in view) {
						view.deselectAll();
					}
				}
			});

			selectedTree = tree;
			selectedNodeId = tree.selectedNode();
	
			selectedNodeChanged();
		};
	};

	var getSelectedNodePath = function () {
		if (selectedTree === null) {
			return "no selected tree";
		}

		return selectedTree.getSelectedNodePath();
	};

	var macroEditNotification = function (id) {
		var nodeStack = CSLEDIT.data.getNodeStack(id),
			node,
			iter,
			next,
			macroName,
			timesUsed;

		while (nodeStack.length > 0) {
			node = nodeStack.pop();
			if (node.name === "macro" && recentlyEditedMacro !== node.cslId) {
				macroName = new CSLEDIT.CslNode(node).getAttr("name");
				if (macroName === "") {
					return;
				}

				// check how many places this macro is used
				iter = new CSLEDIT.Iterator(CSLEDIT.data.get());
				timesUsed = 0;

				while (iter.hasNext()) {
					next = new CSLEDIT.CslNode(iter.next());

					if (next.name === "text" && next.getAttr("macro") === macroName) {
						timesUsed++;

						if (timesUsed > 1) {
							recentlyEditedMacro = node.cslId;
							CSLEDIT.notificationBar.showMessage(
								'You just edited a macro which is used in multiple places');
						}
					}
				}
			}
		}
	};

	var setSuppressSelectNode = function (suppress) {
		suppressSelectNode = suppress;
	};

	var addNode = function (id, position, newNode, nodesAdded) {
		macroEditNotification (id);	
		$.each(views, function (i, view) {
			if ("addNode" in view) {
				view.addNode(id, position, newNode, nodesAdded);
			}
		});
		if (!suppressSelectNode) {
			selectNode(newNode.cslId);
		}
	};

	var deleteNode = function (id, nodesDeleted) {
		macroEditNotification(id - 1);
		$.each(views, function (i, view) {
			if ("deleteNode" in view) {
				view.deleteNode(id, nodesDeleted);
			}
		});
	};

	var amendNode = function (id, amendedNode) {
		macroEditNotification(id);
		$.each(views, function (i, view) {
			if ("amendNode" in view) {
				view.amendNode(id, amendedNode);
			}
		});
	};

	var selectNode = function (id, highlightedNodes) {
		var treeNode;
	   
		if (typeof highlightedNodes === "undefined") {
			treeNode = treeView.find('li[cslid=' + id + '] > a');
		} else {
			treeNode = highlightedNodes.filter('li[cslid=' + id + ']').children('a');
		}

		if (treeNode.length > 0) {
			clickNode(treeNode.first());
		} else {
			selectedNodeId = id;
			selectedNodeChanged();
		}
	};

	var selectNodeFromPath = function (nodePath) {
		var treeNode = treeView,
			cslId;

		$.each(nodePath, function (i, cslId) {
			treeNode = treeNode.find('li[cslId="' + cslId + '"]');
		});

		treeNode = treeNode.children('a');

		if (treeNode.length > 0) {
			clickNode(treeNode.first());
		} else {
			selectedNodeId = id;
			selectedNodeChanged();
		}		
	};

	var clickNode = function (node) {
		node.click();

		// to ensure the node isn't toggled closed if already open
		//expandNode(parseInt(node.parent().attr('cslid')));
		
		treeView.scrollTo(node, 200, {
			offset:{left: -treeView.width() + 80, top: -treeView.height() * 0.4}
		});
	};

	var selectedNode = function () {
		return selectedNodeId;
	};

	var expandNode = function (id) {
		$.each(views, function (i, view) {
			if ('expandNode' in view) {
				view.expandNode(id);
			}
		});
	};

	var styleChanged = function (command, args) {
		args = args || [];
		console.log("executing view update: " + command + "(" + args.join(", ") + ")");
		this[command].apply(null, args);
	};

	// public:
	return {
		init : init,

		addNode : addNode,
		deleteNode : deleteNode,
		amendNode : amendNode,
		newStyle : newStyle,

		selectNode : selectNode,
		selectedNode : selectedNode,

		expandNode : expandNode,

		formatCitations : function () {
			callbacks.formatCitations();
		},
			
		styleChanged : styleChanged,

		getSelectedNodePath : getSelectedNodePath,

		selectNodeFromPath : selectNodeFromPath,

		setSuppressSelectNode : setSuppressSelectNode
	}
};

