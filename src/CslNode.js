"use strict";

define(['src/debug'], function (debug) {
	var CSLEDIT_CslNode = function (nameOrNode, attributes, children, cslId) {
		assert(this instanceof CSLEDIT_CslNode);

		if (nameOrNode.hasOwnProperty("name")) {
			this.copy(nameOrNode);
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

	// performs a shallow copy of source
	CSLEDIT_CslNode.prototype.copy = function (source) {
		this.name = source.name;
		this.attributes = source.attributes;
		this.children = source.children;
		this.textValue = source.textValue;
		this.cslId = source.cslId;
	};

	CSLEDIT_CslNode.prototype.setAttr = function (attr, value) {
		var index;

		index = this._indexOfAttr(attr);

		if (index === -1) {
			this.attributes.push({key: attr, value: value, enabled: true});
		} else {
			this.attributes[index].value = value;
			this.attributes[index].enabled = true;
		}
	};

	CSLEDIT_CslNode.prototype.setAttrEnabled = function (attr, enabled, defaultValue) {
		var index;

		defaultValue = defaultValue || "";

		index = this._indexOfAttr(attr);
		if (index === -1) {
			if (enabled) {
				this.attributes.push({
					key: attr,
					value: defaultValue, /* TODO: get default value */
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

	CSLEDIT_CslNode.prototype.hasAttr = function (attr) {
		var index = this._indexOfAttr(attr);
		return index !== -1 && this.attributes[index].enabled;
	};

	CSLEDIT_CslNode.prototype.getAttr = function (attr) {
		var index;

		index = this._indexOfAttr(attr);

		if (index === -1 ||
				(this.attributes[index].hasOwnProperty('enabled') && !this.attributes[index].enabled)) {
			return "";
		} else {
			return this.attributes[index].value;
		}
	};

	// private methods

	// returns -1 if can't find
	CSLEDIT_CslNode.prototype._indexOfAttr = function (attrName) {
		var index = -1;
		$.each(this.attributes, function (i, attr) {
			if (attr.key === attrName) {
				index = i;
				return false;
			}
		});
		return index;
	};

	return CSLEDIT_CslNode;
});
