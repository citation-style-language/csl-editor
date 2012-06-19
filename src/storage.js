"use strict";

var CSLEDIT = CSLEDIT || {};

// Use localStorage for persistance if available, otherwise use a simple
// session based dictionary
if (typeof localStorage !== "undefined") {
	CSLEDIT.storage = {};
	CSLEDIT.storage.getItem = function (key) { return localStorage.getItem(key); };
	CSLEDIT.storage.setItem = function (key, value) { localStorage.setItem(key, value); };
	CSLEDIT.storage.removeItem = function (key) { localStorage.removeItem(key); };
} else {
	CSLEDIT.storage = (function () {
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
			},
			removeItem : function (key) {
				delete storage[key];
			}
		};
	}());
}

CSLEDIT.storage.getItemJson = function (key) {
	var data = CSLEDIT.storage.getItem(key);
	if (data === null) {
		return null;
	} else {
		return JSON.parse(data);
	}
};
