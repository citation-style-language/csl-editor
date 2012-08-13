"use strict";



module("CSLEDIT_editNodeButton");

// replace CSLEDIT_data with test version
var CSLEDIT_data = CSLEDIT_Data("CSLEDIT_test_cslData");

test("object test", function () {
	var button;

	// need to use new
	raises(function () {
		button = CSLEDIT_EditNodeButton($("<div></div"), "style", 4, "noicon");
	});
	button = new CSLEDIT_EditNodeButton($("<div></div"), "style", 4, "noicon");
});

test("add / delete nodes", function () {
	var button = new CSLEDIT_EditNodeButton($("<div></div"), "style", 4, "noicon");

	equal(button.cslId, 4);
	button.addNode("", "", {cslId:4}, 2);
	equal(button.cslId, 6);
	button.addNode("", "", {cslId:7}, 3);
	equal(button.cslId, 6);
	
	button.deleteNode(7, 2);
	equal(button.cslId, 6);
	button.deleteNode(4, 2);
	equal(button.cslId, 4);

	button.deleteNode(2, 3);
	equal(button.cslId, -1);
});
