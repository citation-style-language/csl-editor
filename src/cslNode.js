"use strict";

CSLEDIT = CSLEDIT || {};

CSLEDIT.CslNode = function (name, attributes, children, cslId) {
	assert(this instanceof CSLEDIT.CslNode);

	this.name = name;
	this.attributes = attributes || [];
	this.children = children || [];
	if (typeof cslId === "undefined") {
		this.cslId = -1;
	} else {
		this.cslId = cslId;
	}
};
