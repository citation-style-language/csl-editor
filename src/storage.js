"use strict";

// Provides persistent key/value storage if localStorage is available,
// otherwise falls back to a simple session based storage
//
// Triggers a callback when getItem() is called if the localStorage value has been
// changed since the last time it was read during this session
//
// The following functions work just like the localStorage equivalents:
//
// - getItem
// - setItem
// - removeItem
// - clear
//
// Additionally:
// 
// - onDataInconsistency - this allows setting a callback function which gets
//                         called whenever an inconsistency between persistent
//                         and session storage is detected

define(['src/debug'], function (debug) {
	var CSLEDIT_Storage = function (useLocalStorageIfAvailable) {
		var simpleStorage = {}, // duplicates the data in localStorage to use to verify that the
		                        // localStorage hasn't been changed in another tab, or acts as
								// the only storage if localStorage isn't available
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

					if (simpleValue === null && localValue !== null) {
						simpleStorageAPI.setItem(key, localValue);
					} else if (simpleValue !== localValue) {
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
