"use strict";

CSLEDIT = CSLEDIT || {};

CSLEDIT.ViewController = function (treeView) {
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
				buttons : [
				{
					icon : "../external/fugue-icons/sort-alphabet.png",
					node : "style/citation/sort"
				},
				{
					icon : "../external/famfamfam-icons/cog.png",
					node : "style/citation"
				}
				]
			},
			{
				id : "bibliography",
				name : "Bibliography",
				nodePaths : ["style/bibliography/layout"],
				buttons : [
				{
					icon : "../external/fugue-icons/sort-alphabet.png",
					node : "style/bibliography/sort"
				},
				{
					icon : "../external/famfamfam-icons/cog.png",
					node : "style/bibliography"
				}
				]
			},
			{
				id : "macro",
				name : "Macros",
				nodePaths : ["style/macro"]
			}
		],
		smartTrees = [],
		treesLoaded = 0,
		treesToLoad = 0,
		callbacks,
		selectedTree = null,
		formatCitationsCallback,
		selectedNodeId = 0;

	var treeLoaded = function () {
		treesLoaded++;

		if (treesLoaded === treesToLoad) {
			callbacks.loaded();
		};
	};

	var createTree = function (cslData, _callbacks) {
		var eventName,
			jsTreeData,
			citationNodeId,
			citationNodeData,
			citationTree,
			html = "",
			cslId,
			nodes;

		callbacks = _callbacks;

		$.each(smartTreeSchema, function (index, value) {
			html += '<table><tr>';
			html += '<td><h3>%1<\/h3>'.replace('%1', value.name) + '<\/td>';
			if (typeof value.buttons !== "undefined") {
				html += '<td>&nbsp;&nbsp;&nbsp;<\/td>';

				$.each(value.buttons, function (i, button) {
					nodes = CSLEDIT.data.getNodesFromPath(cslData, button.node);
					assert(nodes.length > 0);
					cslId = nodes[0].cslId;
					html += '<td><img class="cslPropertyButton" cslId="' + cslId +
						'" src="' + button.icon + '" \/><\/td>';
				});
			}
			html += '<\/tr><\/table>';
			html += '<div id="%1"><\/div>'.replace('%1', value.id);
		});

		// create html nodes
		treeView.html(html);

		treeView.find(".cslPropertyButton").click(function (event) {
			console.log("clicked property button");
			cslId = parseInt($(event.target).attr("cslid"));
			selectNode(cslId);
		});

		console.log("creating citation tree");

		$.each(smartTreeSchema, function (index, value) {
			var tree;
			treesToLoad++;
			tree = CSLEDIT.SmartTree(treeView.children("#" + value.id), value.nodePaths);
			tree.setCallbacks({
				loaded : treeLoaded,
				selectNode : selectNodeInTree(tree),
				moveNode : callbacks.moveNode,
				deleteNode : callbacks.deleteNode,
				checkMove : callbacks.checkMove
			});
			tree.createTree();
			smartTrees.push(tree);
		});
	};

	var selectNodeInTree = function (tree) {
		return function (event, ui) {
			// deselect nodes in other trees
			$.each(smartTrees, function (i, thisTree) {
				if (thisTree !== tree) {
					thisTree.deselectAll();
				}
			});

			selectedTree = tree;
			selectedNodeId = tree.selectedNode();
	
			return callbacks.selectNode(/*event, ui*/);
		};
	};

	var addNode = function (id, position, newNode, nodesAdded) {
		$.each(smartTrees, function (i, smartTree) {
			smartTree.addNode(id, position, newNode, nodesAdded);
		});
	};

	var deleteNode = function (id, nodesDeleted) {
		$.each(smartTrees, function (i, smartTree) {
			smartTree.deleteNode(id, nodesDeleted);
		});
	};

	var ammendNode = function (id, ammendedNode) {
		$.each(smartTrees, function (i, smartTree) {
			smartTree.ammendNode(id, ammendedNode);
		});
	};

	var selectNode = function (id) {
		var treeNode = treeView.find('li[cslid=' + id + '] > a');

		if (treeNode.length > 0) {
			treeNode.first().click();
		} else {
			selectedNodeId = id;
			callbacks.selectNode();
		}
	};

	var selectedNode = function () {
		return selectedNodeId;
	};

	var expandNode = function (id) {
		$.each(smartTrees, function (i, tree) {
			tree.expandNode(id);
		});
	};
	
	var exec = function (command, args) {
		args = args || [];
		console.log("executing view update: " + command + "(" + args.join(", ") + ")");
		this[command].apply(null, args);
	};

	// public:
	return {
		createTree : createTree,

		addNode : addNode,
		deleteNode : deleteNode,
		ammendNode : ammendNode,

		selectNode : selectNode,
		selectedNode : selectedNode,

		expandNode : expandNode,

		formatCitations : function () {
			formatCitationsCallback();
		},
			
		// This callback is used to avoid re-calculating the example citations
		// until all subscribers have been informed of the recent change
		exec : exec,

		setFormatCitationsCallback : function (callback) {
			formatCitationsCallback = callback;
		}
	}
};

