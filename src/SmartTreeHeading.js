"use strict";

// Heading for a smart tree
//
// Can use a NodeWatcher to associate the heading with a specific CSL node path

define(
		[	'src/NodeWatcher',
			'src/dataInstance',
			'src/debug'
		],
		function (
			CSLEDIT_NodeWatcher,
			CSLEDIT_data,
			debug
		) {
	var CSLEDIT_SmartTreeHeading = function (element, nodePath, title, possibleChildren, showPropertyPanel) {
		var that = this;
			
		this.element = element;
		this.title = title;

		this.possibleChildren = possibleChildren;
		this.showPropertyPanel = showPropertyPanel;

		if (typeof(nodePath) === "undefined" || nodePath === "") {
			this.updateHtml(false);
		} else {
			this.nodeWatcher = new CSLEDIT_NodeWatcher(nodePath, CSLEDIT_data, function (nodeData) {
				that.updateHtml(true, nodeData);
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

			this.element.click(function () {
				if (that.nodeWatcher.nodeData === null) {
					that.element.find('span').addClass('selected');
					that.callbacks.selectNode(-1, [], that.nodeWatcher.nodePath);
				} else {
					that.callbacks.selectNode(that.nodeWatcher.nodeData.cslId);
				}
			});
		}
	};

	CSLEDIT_SmartTreeHeading.prototype.deselectAll = function () {
		this.element.find('span').removeClass('selected');
	};

	CSLEDIT_SmartTreeHeading.prototype.updateHtml = function (dynamicNode, nodeData) {
		var that = this,
			cslidAttribute,
			span;

		span = $('<span/>').html(this.title);

		if (dynamicNode) {
			if (nodeData === null) {
				span.addClass('missingNode').removeAttr('cslid');
			} else {
				span.removeClass('missingNode').attr('cslid', nodeData.cslId);
			}
		}

		this.element.html('');
		this.element.append($('<h3 class="smartTreeHeading"/>').append(span));

		debug.log("updated smart tree to " + this.element.html());
	};

	CSLEDIT_SmartTreeHeading.prototype.setCallbacks = function (callbacks) {
		this.callbacks = callbacks;
	};

	CSLEDIT_SmartTreeHeading.prototype.selectedNode = function () {
		if (this.nodeWatcher.nodeData !== null) {
			return this.nodeWatcher.nodeData.cslId;
		} else {
			return -1;
		}
	};

	CSLEDIT_SmartTreeHeading.prototype.getMissingNodePath = function () {
		debug.assertEqual(this.nodeWatcher.nodeData, null);
		return this.nodeWatcher.nodePath;
	};		

	CSLEDIT_SmartTreeHeading.prototype.getSelectedNodePath = function () {
		var splitNodePath = this.nodeWatcher.nodePath.split("/"),
			nodePath = [],
			cslIdPath = [],
			nodes;

		if (this.nodeWatcher.nodeData === null) {
			return [];
		}

		while (splitNodePath.length > 0) {
			nodePath.push(splitNodePath.splice(0, 1));
			nodes = CSLEDIT_data.getNodesFromPath(nodePath.join("/"));
			debug.assertEqual(nodes.length, 1);
			cslIdPath.push(nodes[0].cslId);
		}

		return cslIdPath;
	};

	return CSLEDIT_SmartTreeHeading;
});
