"use strict";



module("CSLEDIT_storage");

test("clear/set/get/remove items", function () {

	var doTests = function (storage, description) {
		storage.clear();

		equal(storage.getItem("item1"), null, description);
		storage.setItem("item1", "value1");
		equal(storage.getItem("item1"), "value1", description);

		storage.setItem("item2", "value2");
		equal(storage.getItem("item2"), "value2", description);

		storage.setItem("item1", "value1_changed");
		equal(storage.getItem("item1"), "value1_changed", description);

		storage.removeItem("item2");
		equal(storage.getItem("item2"), null, description);
	};

	doTests(new CSLEDIT_Storage(false), "with simple storage");
	doTests(new CSLEDIT_Storage(true), "with local storage");
});

test("sync checking", function () {
	var message = "",
		storage = new CSLEDIT_Storage(true, function () {
			message = "out of sync";
		});

	storage.clear();
	storage.setItem("item1", "set by this tab");

	// use localStorage directly to simulate "item1" being set by a different tab
	localStorage.setItem("item1", "set by different tab");

	equal(message, "");

	// now this should trigger the callback
	storage.getItem("item1");

	equal(message, "out of sync");
});
