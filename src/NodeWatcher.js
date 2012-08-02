"use strict";

var CSLEDIT = CSLEDIT || {};

// Watches a CSL node represented by nodePath and calls onChange whenever it changes
//
// It's OK if no node exists at nodePath
// It's not OK if > 1 node exists at nodePath

CSLEDIT.NodeWatcher = function (nodePath, cslData, onChange) {
	var that = this;
	
	this.nodeData = null;

	this.nodePath = nodePath;
	this.cslData = cslData;
	this.onChange = onChange;

	this.updateNodeData();
	this.nodeUpdated();
}

CSLEDIT.NodeWatcher.prototype.nodeUpdated = function () {
	this.onChange(this.nodeData);
};

CSLEDIT.NodeWatcher.prototype.getSelectedNodePath = function () {
	var splitNodePath = this.nodePath.split("/"),
		nodePath = [],
		cslIdPath = [],
		nodes;

	while (splitNodePath.length > 0) {
		nodePath.push(splitNodePath.splice(0,1));
		nodes = this.cslData.getNodesFromPath(nodePath.join("/"));
		assertEqual(nodes.length, 1);
		cslIdPath.push(nodes[0].cslId);
	}

	return cslIdPath;
};

CSLEDIT.NodeWatcher.prototype.updateNodeData = function () {
	var nodes;

	this.nodeData = null;
	
	if (typeof(this.nodePath) === "undefined") {
		return;
	}

	nodes = this.cslData.getNodesFromPath(this.nodePath);

	if (nodes.length > 0) {
		this.nodeData = nodes[0];
	}
};

CSLEDIT.NodeWatcher.prototype.addNode = function (id, position, node, numAdded) {
	if (this.nodeData !== null) {
		if (node.cslId <= this.nodeData.cslId) {
			// shift the nodeData forward
			this.nodeData.cslId += numAdded;
			this.nodeUpdated();
		}
	} else {
		this.updateNodeData();
		this.nodeUpdated();
	}
};

CSLEDIT.NodeWatcher.prototype.deleteNode = function (id, numDeleted) {
	if (this.nodeData === null) {
		return;
	}

	if (this.nodeData.cslId >= id && this.nodeData.cslId < id + numDeleted) {
		// this node has been deleted
		this.updateNodeData();
		this.nodeUpdated();
		return;
	}

	if (this.nodeData.cslId >= id + numDeleted) {
		this.nodeData.cslId -= numDeleted;
		this.nodeUpdated();
	}
};

CSLEDIT.NodeWatcher.prototype.amendNode = function (id, amendedNode) {
	if (this.nodeData === null) {
		return;
	}

	if (id === this.nodeData.cslId) {
		this.nodeData = amendedNode;
		this.nodeUpdated();
	}
};
