"use strict";

CSLEDIT = CSLEDIT || {};

CSLEDIT.Titlebar = function (element) {
	this.element = element;

	this.titleNode = this.getTitleNode();
	if (this.titleNode === null) {
		this.cslId = -1;
	} else {
		this.cslId = this.titleNode.cslId;
	}
	this.displayTitle();
};

CSLEDIT.Titlebar.prototype.displayTitle = function () {
	var title;

	if (this.titleNode === null) {
		title = "No title";
	} else {
		title = this.titleNode.textValue;
		// TODO: Elide text
	}
	this.element.html('<h3><span cslid=' + this.cslId + '>' + title + '</span></h3>');
};

CSLEDIT.Titlebar.prototype.getTitleNode = function () {
	var titleNode;

	titleNode = CSLEDIT.data.getNodesFromPath("style/info/title");

	if (titleNode.length > 0) {
		assert (titleNode.length < 2);
		return titleNode[0];
	}
	
	return null;
};

CSLEDIT.Titlebar.prototype.addNode = function (id, position, node, numAdded) {
	if (this.cslId > -1) {
		return;
	}

	this.titleNode = this.getTitleNode();
	if (this.titleNode !== null) {
		this.cslId = this.titleNode.cslId;
		this.displayTitle();
	}
};

CSLEDIT.Titlebar.prototype.deleteNode = function (id, numDeleted) {
	this.titleNode = this.getTitleNode();
	this.displayTitle();

	if (this.titleNode === null) {
		this.cslId = -1;
	}
};

CSLEDIT.Titlebar.prototype.amendNode = function (id, amendedNode) {
	if (id === this.cslId) {
		this.titleNode = amendedNode;
		this.displayTitle();
	}
};
