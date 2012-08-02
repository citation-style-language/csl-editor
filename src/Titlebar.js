"use strict";

CSLEDIT = CSLEDIT || {};

// Uses a NodeWatcher to monitor the style/info/title node for changes
// and updates the titlebar

CSLEDIT.Titlebar = function (element) {
	var that = this;

	this.element = element;
	this.element.html('<h3><span cslid="-1"/></h3>').css({cursor: "default"});

	this.nodeWatcher = new CSLEDIT.NodeWatcher("style/info/title", CSLEDIT.data, function (nodeData) {
		that.updateTitle(nodeData);
	});
	
	this.addNode = function (id, position, nodeData, numNodes) {
		that.nodeWatcher.addNode(id, position, nodeData, numNodes);
	};
	this.deleteNode = function (id, numNodes) {
		that.nodeWatcher.deleteNode(id, numNodes);
	};
	this.amendNode = function (id, nodeData) {
		that.nodeWatcher.amendNode(id, nodeData);
	};
};

CSLEDIT.Titlebar.prototype.updateTitle = function (nodeData) {
	var title;
	if (nodeData === null) {
		title = "No title";
	} else {
		title = nodeData.textValue;
	}
	this.element.find('span[cslid]').html(title).attr('cslid', nodeData.cslId);

	console.log("updated title to " + this.element.html());
};

