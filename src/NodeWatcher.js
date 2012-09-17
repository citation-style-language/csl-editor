"use strict";

// Watches a CSL node represented by nodePath and calls onChange whenever it changes
//
// It's OK if no node exists at nodePath
// It's not OK if > 1 node exists at nodePath

define(['src/debug'], function (debug) {
	// Creates a NodeWatcher watching the given nodePath using the given
	// dataInstance
	// 
	// - nodePath     - a '/' separated string containing the full path of the node to watch
	//                  e.g. 'style/citation/layout'
	// - dataInstance - the instance of CSLEDIT_Data to watch
	// - onChange     - this function will be called after every change to the watched node
	var CSLEDIT_NodeWatcher = function (nodePath, dataInstance, onChange) {
		var that = this;
		
		this.nodeData = null;

		this.nodePath = nodePath;
		this.dataInstance = dataInstance;
		this.onChange = onChange;

		this._updateNodeData();
		this._nodeUpdated();
	};

	// Calls the onChange callback
	CSLEDIT_NodeWatcher.prototype._nodeUpdated = function () {
		this.onChange(this.nodeData);
	};

	CSLEDIT_NodeWatcher.prototype._updateNodeData = function () {
		var nodes;

		this.nodeData = null;
		
		if (typeof(this.nodePath) === "undefined") {
			return;
		}

		nodes = this.dataInstance.getNodesFromPath(this.nodePath);

		if (nodes.length > 0) {
			this.nodeData = nodes[0];
		}
	};

	// Respond to an addNode event
	CSLEDIT_NodeWatcher.prototype.addNode = function (id, position, node, numAdded) {
		if (this.nodeData !== null) {
			if (node.cslId <= this.nodeData.cslId) {
				// shift the nodeData forward
				this.nodeData.cslId += numAdded;
				this._nodeUpdated();
			}
		} else {
			this._updateNodeData();
			this._nodeUpdated();
		}
	};

	// Respond to a deleteNode event
	CSLEDIT_NodeWatcher.prototype.deleteNode = function (id, numDeleted) {
		if (this.nodeData === null) {
			return;
		}

		if (this.nodeData.cslId >= id && this.nodeData.cslId < id + numDeleted) {
			// this node has been deleted
			this._updateNodeData();
			this._nodeUpdated();
			return;
		}

		if (this.nodeData.cslId >= id + numDeleted) {
			this.nodeData.cslId -= numDeleted;
			this._nodeUpdated();
		}
	};

	// Respond to an amendNode event
	CSLEDIT_NodeWatcher.prototype.amendNode = function (id, amendedNode) {
		if (this.nodeData === null) {
			return;
		}

		if (id === this.nodeData.cslId) {
			this.nodeData = amendedNode;
			this._nodeUpdated();
		}
	};

	return CSLEDIT_NodeWatcher;
});
