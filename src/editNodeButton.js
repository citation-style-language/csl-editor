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

	element.click(function () {
		console.log("button clicked");
		selectNodeCallback(that.cslId);
	});
	this.updateButton();
};

CSLEDIT.EditNodeButton.prototype.updateButton = function ()
{
	this._element.html('<img class="cslPropertyButton" src="' + this.icon + '" \/>');
};

CSLEDIT.EditNodeButton.prototype.addNode = function (id, position, newNode, nodesAdded) {
	// shift the id if neccessary
	if (this.cslId >= id) {
		this.cslId += nodesAdded;
	}
	this.updateButton();
};

CSLEDIT.EditNodeButton.prototype.deleteNode = function (id, nodesDeleted) {
	if (this.cslId >= id + nodesDeleted) {
		// shift the id 
		this.cslId -= nodesDeleted;
	} else if (this.cslId >= id && this.cslId < id + nodesDeleted) {
		// this node falls within the deleted block
		assert(false, "shouldn't be allowed to delete an EditNodeButton node");
	}
	this.updateButton();
};
