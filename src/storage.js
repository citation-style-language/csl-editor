"use strict";

var CSLEDIT = CSLEDIT || {};

// Use localStorage for persistance if available, otherwise use a simple
// session based dictionary

CSLEDIT.storage = localStorage || (function () {
	var storage = {};
	return {
		getItem : function (key) {
			if (storage.hasOwnProperty(key)) {
				return storage[key];
			} else {
				return null;
			}
		},
		setItem : function (key, value) {
			storage[key] = value;
		}
	};
}());
