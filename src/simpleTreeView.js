"use strict";

CSLEDIT = CSLEDIT || {};

CSLEDIT.SimpleTreeView = function (treeView) {
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
				nodePaths : ["style/citation/layout"]
			},
			{
				id : "bibliography",
				name : "Bibliography",
				nodePaths : ["style/bibliography/layout"]
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
		selectedTree = null;

	var treeLoaded = function () {
		treesLoaded++;

		if (treesLoaded === treesToLoad) {
			callbacks.loaded();
		};
	};

	var createFromCslData = function (cslData, _callbacks) {
		var eventName,
			jsTreeData,
			citationNodeId,
			citationNodeData,
			citationTree,
			html = "";

		callbacks = _callbacks;

		$.each(smartTreeSchema, function (index, value) {
			html += '<h3>%1<\/h3>'.replace('%1', value.name) +
					'<div id="%1"><\/div>'.replace('%1', value.id);
		});

		// create html nodes
		treeView.html(html);

		console.log("creating citation tree");

		$.each(smartTreeSchema, function (index, value) {
			var tree;
			treesToLoad++;
			tree = CSLEDIT.SmartTree(treeView.children("#" + value.id));
			tree.createTree(value.nodePaths, {
				loaded : treeLoaded,
				selectNode : selectNodeInTree(tree),
				moveNode : callbacks.moveNode,
				deleteNode : function () {},
				checkMove : callbacks.checkMove
			});
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
	
			return callbacks.selectNode(event, ui);
		};
	};

	var addNode = function (id, position, newNode) {
		var shift = null;

		$.each(smartTrees, function (i, smartTree) {
			shift = smartTree.addNode(id, position, newNode);
			if (shift !== null) {
				return false;
			}
		});

		assert(shift !== null, "node added, but no view");

		$.each(smartTrees, function (i, smartTree) {
			smartTree.shiftCslIds(shift.fromId, shift.amount);
		});
	};

	var deleteNode = function (id) {
		var shift = null;

		$.each(smartTrees, function (i, smartTree) {
			shift = smartTree.deleteNode(id);
			if (shift !== null) {
				return false;
			}
		});

		assert(shift !== null, "node deleted, but no view");

		$.each(smartTrees, function (i, smartTree) {
			smartTree.shiftCslIds(shift.fromId, shift.amount);
		});
	};

	var ammendNode = function (id, ammendedNode) {
		/*
		var node = thisElement.find('li[cslid="' + id + '"]');
		thisElement.jstree('rename_node', node, displayNameFromMetadata(ammendedNode));
		*/
	};

	var moveNode = function (fromId, toId, position) {
		var fromNode = treeView.find('li[cslid="' + fromId + '"]'),
			toNode = treeView.find('li[cslid="' + toId + '"]');

		console.log("move from " + fromId + " to " + toId);
	
		smartTrees[0].moveNode(fromNode, toNode, position);

		/*
		if (fromId < toId) {
			// do add first
		} else {
			// do delete first
		}
*/
		/*
		var fromNode = thisElement.find('li[cslid="' + fromId + '"]'),
			toNode = thisElement.find('li[cslid="' + toId + '"]');

		assertEqual(fromNode.length, 1);
		assertEqual(toNode.length, 1);

		console.log("CslTreeView.moveNode: " + fromId + " to " + toId + ", position: " + position);
		console.log("CslTreeView.moveNode: " + thisElement.jstree("get_text", fromNode) + " to " + thisElement.jstree("get_text", toNode));
		thisElement.jstree('move_node', fromNode, toNode, position, false, false, true);
		
		// sort the cslids
		var allNodes;
		allNodes = thisElement.find('li[cslid]');
		assert(allNodes.length > 0);
		allNodes.each(function (index) {
			$(this).attr('cslid', index);
		});
		*/
	};

	var selectNode = function (id) {
		treeView.find('li[cslid=' + id + '] > a').click();
	};

	var selectedNode = function () {
		var selected,
			cslid;
		
		assert(selectedTree !== null);

		return selectedTree.selectedNode();
	};

	var expandNode = function (id) {
		$.each(smartTrees, function (i, tree) {
			tree.expandNode(id);
		});
	};

	// public:
	return {
		createFromCslData : createFromCslData,

		addNode : addNode,
		deleteNode : deleteNode,
		moveNode : moveNode,
		ammendNode : ammendNode,

		selectNode : selectNode,
		selectedNode : selectedNode,

		expandNode : expandNode
	}
};

