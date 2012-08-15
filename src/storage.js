"use strict";

define(['src/debug'], function (debug) {
	var CSLEDIT_Storage = function (useLocalStorageIfAvailable) {
		// Use localStorage for persistance if available, otherwise use a simple
		// session based dictionary
		var simpleStorage = {},
			simpleStorageAPI,
			localStorageAPI,
			finalAPI,
			outOfSyncCallback;

		var outOfSync = function () {
			debug.log("CSLEDIT_storage out of sync with local storage");
			if (typeof(outOfSyncCallback) === "function") {
				outOfSyncCallback();
			}
		};

		simpleStorageAPI = {
			getItem : function (key) {
				if (simpleStorage.hasOwnProperty(key)) {
					return simpleStorage[key];
				} else {
					return null;
				}
			},
			setItem : function (key, value) {
				simpleStorage[key] = value;
			},
			removeItem : function (key) {
				delete simpleStorage[key];
			},
			clear : function () {
				simpleStorage = {};
			}
		};

		localStorageAPI = {
			getItem : function (key) {
				return localStorage.getItem(key);
			},
			setItem : function (key, value) {
				localStorage.setItem(key, value);
			},
			removeItem : function (key) {
				localStorage.removeItem(key);
			},
			clear : function () {
				localStorage.clear();
			}
		};

		if (typeof(localStorage) === "undefined" || localStorage === null ||
				useLocalStorageIfAvailable !== true) {
			debug.log("Not using localStorage");
			finalAPI = simpleStorageAPI;
		} else {
			// use local storage, with simple storage to verify that nothing has changed
			finalAPI = {
				getItem : function (key) {
					var simpleValue,
						localValue;
					
					simpleValue = simpleStorageAPI.getItem(key);
					localValue = localStorageAPI.getItem(key);

					if (simpleValue !== null && simpleValue !== localValue) {
						outOfSync();
					}

					return localValue;
				},
				setItem : function (key, value) {
					simpleStorageAPI.setItem(key, value);
					localStorageAPI.setItem(key, value);
				},
				removeItem : function (key) {
					simpleStorageAPI.removeItem(key);
					localStorageAPI.removeItem(key);
				},
				clear : function () {
					simpleStorageAPI.clear();
					localStorageAPI.clear();
				},
				recreateLocalStorage : function (key) {
					localStorageAPI.clear();
					$.each(simpleStorage, function (key, value) {
						localStorageAPI.setItem(key, value);
					});
				}
			};
		}
		
		finalAPI.getItemJson = function (key) {
			var data = finalAPI.getItem(key);
			if (data === null) {
				return null;
			} else {
				try {
					return JSON.parse(data);
				} catch (err) {
					return null;
				}
			}
		};

		finalAPI.onDataInconsistency = function (callback) {
			outOfSyncCallback = callback;
		};

		return finalAPI;
	};

	var CSLEDIT_storage = new CSLEDIT_Storage(true);

	return CSLEDIT_storage;
});
