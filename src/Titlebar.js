"use strict";

// Uses a NodeWatcher to monitor the style/info/title node for changes
// and updates the titlebar

define(['src/NodeWatcher', 'src/cslData', 'src/debug'], function (CSLEDIT_NodeWatcher, CSLEDIT_data, debug) {
	var CSLEDIT_Titlebar = function (element) {
		var that = this;

		this.element = element;
		this.element.html('<h3><span cslid="-1"/></h3>').css({cursor: "default"});

		this.nodeWatcher = new CSLEDIT_NodeWatcher("style/info/title", CSLEDIT_data, function (nodeData) {
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

	CSLEDIT_Titlebar.prototype.updateTitle = function (nodeData) {
		var title;
		if (nodeData === null) {
			title = "No title";
		} else {
			title = nodeData.textValue;
		}
		this.element.find('span[cslid]').html(title).attr('cslid', nodeData.cslId);

		debug.log("updated title to " + this.element.html());
	};

	return CSLEDIT_Titlebar;
});
