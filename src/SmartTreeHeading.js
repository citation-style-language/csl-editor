"use strict";

CSLEDIT = CSLEDIT || {};

// TODO: refactor into NodeView to be used by this and the title node.
//       and add unit tests

CSLEDIT.SmartTreeHeading = function (element, nodePath, title, possibleChildren, showPropertyPanel) {
	var that = this;
		
	this.element = element;
	this.nodePath = nodePath;
	this.title = title;

	this.possibleChildren = possibleChildren;
	this.showPropertyPanel = showPropertyPanel;

	console.log("creating smart tree heading " + title + ": " + this.nodePath);

	this.updateNodeData();
	this.updateHtml();

	this.element.click(function () {
		if (that.nodeData !== null) {
			console.log("selecting node " + that.nodeData.cslId);
			that.callbacks.selectNode(that.nodeData.cslId);
		}
	});
}

CSLEDIT.SmartTreeHeading.prototype.updateNodeData = function () {
	var nodes;

	this.nodeData = null;
	
	if (typeof(this.nodePath) === "undefined") {
		return;
	}

	nodes = CSLEDIT.data.getNodesFromPath(this.nodePath);

	if (nodes.length > 0) {
		this.nodeData = nodes[0];
	}
};

CSLEDIT.SmartTreeHeading.prototype.updateHtml = function () {
	var cslidAttribute;

	if (this.nodeData !== null) {
		cslidAttribute = 'cslid="' + this.nodeData.cslId + '"';
	}
	this.element.html('<h3 class="smartTreeHeading"><span ' + cslidAttribute + '>' +
	   this.title + '</span></h3>');
};

CSLEDIT.SmartTreeHeading.prototype.setCallbacks = function (callbacks) {
	this.callbacks = callbacks;
};

CSLEDIT.SmartTreeHeading.prototype.selectedNode = function () {
	if (this.nodeData !== null) {
		return this.nodeData.cslId;
	} else {
		return null;
	}
};

CSLEDIT.SmartTreeHeading.prototype.addNode = function (id, position, node, numAdded) {
	if (this.nodeData !== null) {
		if (node.cslId <= this.nodeData.cslId) {
			// shift the nodeData forward
			this.nodeData.cslId += numAdded;
		}
	} else {
		this.updateNodeData();
		if (this.nodeData !== null) {
			this.drawHeading();
		}
	}
};

CSLEDIT.SmartTreeHeading.prototype.getSelectedNodePath = function () {
	var splitNodePath = this.nodePath.split("/"),
		nodePath = [],
		cslIdPath = [],
		nodes;

	while (splitNodePath.length > 0) {
		nodePath.push(splitNodePath.splice(0,1));
		nodes = CSLEDIT.data.getNodesFromPath(nodePath.join("/"));
		assertEqual(nodes.length, 1);
		cslIdPath.push(nodes[0].cslId);
	}

	return cslIdPath;
};

CSLEDIT.SmartTreeHeading.prototype.deleteNode = function (id, numDeleted) {
	if (this.nodeData === null) {
		return;
	}

	if (this.nodeData.cslId >= id && this.nodeData.cslId < id + numDeleted) {
		// this node has been deleted
		this.updateNodeData();
		this.updateHtml();
		return;
	}

	if (this.nodeData.cslId >= id + numDeleted) {
		this.nodeData.cslId -= numDeleted;
	}
};

CSLEDIT.SmartTreeHeading.prototype.amendNode = function (id, amendedNode) {
	if (this.nodeData === null) {
		return;
	}

	if (id === this.nodeData.cslId) {
		this.nodeData = amendedNode;
		this.updateHtml();
	}
};
