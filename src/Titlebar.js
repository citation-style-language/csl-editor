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
	this.element.html('<h3><span cslid=' + this.cslId + '/></h3>').css({cursor: "default"});
	this.updateTitle();
};

CSLEDIT.Titlebar.prototype.updateTitle = function () {
	var title;

	if (this.titleNode === null) {
		title = "No title";
	} else {
		title = this.titleNode.textValue;
		// TODO: Elide text
	}
	this.element.find('span[cslid]').html(title).attr('cslid', this.cslId);
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
		this.updateTitle();
	}
};

CSLEDIT.Titlebar.prototype.deleteNode = function (id, numDeleted) {
	this.titleNode = this.getTitleNode();
	this.updateTitle();

	if (this.titleNode === null) {
		this.cslId = -1;
	}
};

CSLEDIT.Titlebar.prototype.amendNode = function (id, amendedNode) {
	if (id === this.cslId) {
		this.titleNode = amendedNode;
		this.updateTitle();
	}
};
