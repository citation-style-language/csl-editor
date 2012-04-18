"use strict";

module("CSLEDIT.cslData");

// replace CSLEDIT.data with test version
CSLEDIT.data = CSLEDIT.Data("CSLEDIT.test_cslData");

test("set code", function () {
	raises(function () {
		CSLEDIT.data.setCslCode("<needs_to_start_with_style_node><\/needs_to_start_with_style_node>");
	});

	raises(function () {
		CSLEDIT.data.setCslCode("<style><mis><\/match><\/style>");
	});

	CSLEDIT.data.setCslCode("<style><\/style>");
	equal(CSLEDIT.data.get().name, "style");
});

test("add node", function () {
	CSLEDIT.data.setCslCode("<style><\/style>");

	equal(CSLEDIT.data.get().cslId, 0);

	CSLEDIT.data.addNode(0, {name: "newNode"});

	console.log("added node: " + JSON.stringify(CSLEDIT.data.get()));

	equal(CSLEDIT.data.get().children.length, 1);
	equal(CSLEDIT.data.get().children[0].name, "newNode");
});

