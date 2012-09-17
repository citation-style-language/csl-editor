"use strict";

// Uses a NodeWatcher to monitor the style/info/title node for changes
// and updates the titlebar

define(
		[	'src/NodeWatcher',
			'src/dataInstance',
			'src/xmlUtility',
			'src/debug'
		], function (
			CSLEDIT_NodeWatcher,
			CSLEDIT_data,
			CSLEDIT_xmlUtility,
			debug
		) {
	// Creates a titlebar within the given jQuery element
	var CSLEDIT_Titlebar = function (element) {
		var that = this;

		this.element = element;
		this.element.html('<h3><span cslid="-1"/></h3>').css({cursor: "default"});

		this.nodeWatcher = new CSLEDIT_NodeWatcher("style/info/title", CSLEDIT_data, function (nodeData) {
			that._updateTitle(nodeData);
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

	CSLEDIT_Titlebar.prototype._updateTitle = function (nodeData) {
		var title;
		if (nodeData === null) {
			title = "No title";
		} else {
			title = nodeData.textValue;
		}
		this.element.find('span[cslid]').html(CSLEDIT_xmlUtility.htmlEscape(title)).attr('cslid', nodeData.cslId);
	};

	return CSLEDIT_Titlebar;
});
