"use strict";

CSLEDIT = CSLEDIT || {};

// A button which opens the property panel for a given CSL node,
// or if the node doesn't yet exist, creates it

CSLEDIT.EditNodeButton = function (element, nodePath, cslId, icon, selectNodeCallback) {
	var that = this;
	assert(this instanceof CSLEDIT.EditNodeButton);

	this._element = element;
	this.nodePath = nodePath;
	this.cslId = cslId; // if -1, means the node doesn't yet exist, in which case clicking the button
	                    // will trigger creation of the relevant nodePath
	this.icon = icon;
	this.selectNodeCallback = selectNodeCallback;

	element.click(function () {
		console.log("button clicked");
		if (that.cslId === -1) {
			CSLEDIT.controller.exec("addPath", [nodePath]);
		} else {
			selectNodeCallback(that.cslId);
		}
	});
	this.updateButton();
};

CSLEDIT.EditNodeButton.prototype.updateButton = function (){
	this._element.html('<img class="cslPropertyButton" src="' + this.icon + '" \/>');
};

CSLEDIT.EditNodeButton.prototype.addNode = function (parentId, position, newNode, nodesAdded) {
	var pathNodes;

	// shift the id if neccessary
	if (this.cslId >= newNode.cslId) {
		this.cslId += nodesAdded;
	} else if (this.cslId === -1) {
		// check if this node has been added and if so link it
		pathNodes = CSLEDIT.data.getNodesFromPath(this.nodePath);
		if (pathNodes.length > 0) {
			assertEqual(pathNodes.length, 1);
			this.cslId = pathNodes[0].cslId;
			this.selectNodeCallback(this.cslId);
		}
	} else {
		return;
	}
	this.updateButton();
};

CSLEDIT.EditNodeButton.prototype.deleteNode = function (id, nodesDeleted) {
	if (this.cslId >= id + nodesDeleted) {
		// shift the id 
		this.cslId -= nodesDeleted;
	} else if (this.cslId >= id && this.cslId < id + nodesDeleted) {
		// this node falls within the deleted block
		//assert(false, "shouldn't be allowed to delete an EditNodeButton node");
		this.cslId = -1;
	} else {
		return;
	}
	this.updateButton();
};
