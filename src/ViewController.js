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
		selectedTree = null,
		formatCitationsCallback;

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
	
			return callbacks.selectNode(event, ui);
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
		/*
		var node = thisElement.find('li[cslid="' + id + '"]');
		thisElement.jstree('rename_node', node, displayNameFromMetadata(ammendedNode));
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

