"use strict";

// Wraps CSL node JSON objects and provides helpful functions to access thier attributes
//
// # CSL node JSON schema
//
// The CSL node JSON as used throughout the code has the following
// members, and is one-to-one map of the XML tree in the corresponding *.csl file:
//
// - name       - string, name of the XML node e.g. 'text', 'macro', 'layout', 'style'
// - textValue  - string, text contents of a childless XML node. e.g. the 'style/info/title' node
// - attributes - list, each element corresponds to an XML attribute and has the following members:
//     - key     - string
//     - value   - string
//     - enabled - boolean (optional, default is true), should the attribute be used in the output CSL
// - children   - list of child nodes, all of which follow this schema
// - cslId      - the zero-based index of this node within the whole tree, when traversed depth first

define(['src/debug'], function (debug) {
	// CSLEDIT_CslNode constructor
	//
	// You can pass in a valid CSL node object, e.g.
	//     var node = new CSLEDIT_CslNode({
	//         name : "macro",
	//         attributes : [
	//             {
	//                 key : "name",
	//                 value : "author-short"
	//             }
	//         ],
	//         children : [],
	//         cslId : 54
	//     });
	//
	// or pass separate arguments, e.g.
	//     var node2 = new CSLEDIT_CslNode("macro", [{key: "name", value: "author-short"], [], 54);
	//
	// both are equivalent
	var CSLEDIT_CslNode = function (nameOrNode, attributes, children, cslId) {
		debug.assert(this instanceof CSLEDIT_CslNode);

		if (nameOrNode.hasOwnProperty("name")) {
			this._copy(nameOrNode);
			return;
		}

		this.name = nameOrNode;
		this.attributes = attributes || [];
		this.children = children || [];
		if (typeof cslId === "undefined") {
			this.cslId = -1;
		} else {
			this.cslId = cslId;
		}
	};

	// Creates a shallow copy of source
	CSLEDIT_CslNode.prototype._copy = function (source) {
		this.name = source.name;
		this.attributes = source.attributes;
		this.children = source.children;
		this.textValue = source.textValue;
		this.cslId = source.cslId;
	};

	// Set the given attribute to the given value
	CSLEDIT_CslNode.prototype.setAttr = function (attributeName, value) {
		var index;

		index = this._indexOfAttr(attributeName);

		if (index === -1) {
			this.attributes.push({key: attributeName, value: value, enabled: true});
		} else {
			this.attributes[index].value = value;
			this.attributes[index].enabled = true;
		}
	};

	// Enable the given attribute
	//
	// The reason to store the enabled state is so that the editor can remember the previous
	// value after the user either:
	//
	// 1. Clicks 'Disable'
	// 2. Changes the mode (CSLEDIT_schema.choices) of the node to one where a previously enabled
	//    attribute is no longer present
	//
	// In both these cases, the user can now change their mind and have the old attribute retained
	CSLEDIT_CslNode.prototype.setAttrEnabled = function (attributeName, enabled, defaultValue) {
		var index;

		defaultValue = defaultValue || "";

		index = this._indexOfAttr(attributeName);
		if (index === -1) {
			if (enabled) {
				this.attributes.push({
					key: attributeName,
					value: defaultValue,
					enabled: true
				});
				return;
			} else {
				// a non-existant attribute is equivalent to a disabled one
				return;
			}
		}
		this.attributes[index].enabled = enabled;
	};

	// Is the attribute with the given name present
	CSLEDIT_CslNode.prototype.hasAttr = function (attributeName) {
		var index = this._indexOfAttr(attributeName);
		return index !== -1 && this.attributes[index].enabled;
	};

	// Gets the attribute with the given attribute name
	CSLEDIT_CslNode.prototype.getAttr = function (attributeName) {
		var index;

		index = this._indexOfAttr(attributeName);

		if (index === -1 ||
				(this.attributes[index].hasOwnProperty('enabled') && !this.attributes[index].enabled)) {
			return "";
		} else {
			return this.attributes[index].value;
		}
	};

	// private function, returns -1 if can't find the attribute
	CSLEDIT_CslNode.prototype._indexOfAttr = function (attributeName) {
		var index = -1;
		$.each(this.attributes, function (i, attr) {
			if (attr.key === attributeName) {
				index = i;
				return false;
			}
		});
		return index;
	};

	return CSLEDIT_CslNode;
});
