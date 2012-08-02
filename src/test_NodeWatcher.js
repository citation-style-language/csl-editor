"use strict";

var CSLEDIT = CSLEDIT || {};

module("CSLEDIT.NodeWatcher", {
	setup : function () {
		console.log("typeof NodeWatcher = " + typeof(CSLEDIT.NodeWatcher));

		CSLEDIT.NodeWatcher.FakeData = function () {
			this.nodes = {
				"style":      {name: "style", cslId: 0},
				"style/info": {name: "info", cslId: 1}
			};
		};

		CSLEDIT.NodeWatcher.FakeData.prototype.getNodesFromPath = function (nodePath) {
			var result = [];
			if (nodePath in this.nodes) {
				result.push(this.nodes[nodePath]);
			}
			return result;
		};

		console.log("created FakeData");
	}
});

test("create & amend node", function () {
	var nodeView,
		currentNode,
		viewUpdated = false,
		description,
		fakeData = new CSLEDIT.NodeWatcher.FakeData();

	description = "Create NodeWatcher";
	nodeView = new CSLEDIT.NodeWatcher("style/info", fakeData,
		function (nodeData) {
			currentNode = nodeData;
			viewUpdated = true;
		});
	equal(currentNode.name, "info", description);
	equal(currentNode.cslId, 1, description);

	description = "Amend node";
	nodeView.amendNode(1, {name: "newName"});
	equal(currentNode.name, "newName", description);

	viewUpdated = false;
	nodeView.amendNode(0, {name: "test"});
	equal(viewUpdated, false, description);
});

test("add/delete nodes", function () {
	var nodeView,
		currentNode,
		viewUpdated = false,
		description,
		fakeData = new CSLEDIT.NodeWatcher.FakeData();

	description = "Create NodeWatcher";
	nodeView = new CSLEDIT.NodeWatcher("style/info", fakeData,
		// fake update function
		function (nodeData) {
			currentNode = nodeData;
			viewUpdated = true;
		});
	equal(currentNode.name, "info", description);
	equal(currentNode.cslId, 1, description);

	description = "Add node before";
	nodeView.addNode(0, 0,
		{
			name: "new-node-before",
			cslId: 1,
			children : [
				{name: "new-node-before-within", cslId: 2}
			]
		}, 2);
	equal(currentNode.cslId, 3, description);

	description = "Add node within";
	viewUpdated = false;
	nodeView.addNode(3, 0, {name: "new-node-within", cslId: 4}, 1);
	equal(viewUpdated, false, description);

	description = "Add node after";
	viewUpdated = false;
	nodeView.addNode(0, 2, {name: "new-node-after", cslId: 5}, 1);
	equal(viewUpdated, false, description);

	// use deleteNode to undo the above addNode commands 
	description = "Delete node after";
	viewUpdated = false;
	nodeView.deleteNode(4, 1);
	equal(viewUpdated, false, description);

	description = "Delete node within";
	viewUpdated = false;
	nodeView.deleteNode(4, 1);
	equal(viewUpdated, false, description);

	description = "Delete node before";
	nodeView.deleteNode(1, 2);
	equal(currentNode.cslId, 1, description);
});

test("Delete and recreate node", function () {
	var nodeView,
		currentNode,
		viewUpdated = false,
		description,
		fakeData = new CSLEDIT.NodeWatcher.FakeData();

	description = "Create NodeWatcher";
	nodeView = new CSLEDIT.NodeWatcher("style/info", fakeData,
		// fake update function
		function (nodeData) {
			currentNode = nodeData;
			viewUpdated = true;
		});
	equal(currentNode.name, "info", description);
	equal(currentNode.cslId, 1, description);

	description = "Delete node";
	delete fakeData.nodes["style/info"];
	nodeView.deleteNode(1, 1);
	equal(currentNode, null);

	description = "Recreate node";
	fakeData.nodes["style/info"] = {name: "info", cslId: 1};
	nodeView.addNode(0, 0, {name: "info", cslId: 1});
	equal(currentNode.name, "info");
	equal(currentNode.cslId, 1);
});

test("Create and delete node", function () {
	var nodeView,
		currentNode,
		viewUpdated = false,
		description,
		fakeData = new CSLEDIT.NodeWatcher.FakeData();

	description = "Create NodeWatcher for non-existant style/citation node";
	nodeView = new CSLEDIT.NodeWatcher("style/citation", fakeData,
		// fake update function
		function (nodeData) {
			currentNode = nodeData;
			viewUpdated = true;
		});
	equal(currentNode, null, description);

	description = "Recreate node";
	fakeData.nodes["style/citation"] = {name: "citation", cslId: 2};
	nodeView.addNode(0, 1, {name: "citation", cslId: 2});
	equal(currentNode.name, "citation");
	equal(currentNode.cslId, 2);
});
