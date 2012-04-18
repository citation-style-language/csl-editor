"use strict";

module("CSLEDIT.cslData");

// replace CSLEDIT.data with test version
CSLEDIT.data = CSLEDIT.Data("CSLEDIT.test_cslData");

test("set code", function () {
	var cslData;

	raises(function () {
		CSLEDIT.data.setCslCode("<needs_to_start_with_style_node><\/needs_to_start_with_style_node>");
	});

	raises(function () {
		CSLEDIT.data.setCslCode("<style><mis><\/match><\/style>");
	});

	cslData = CSLEDIT.data.setCslCode("<style><\/style>");
	equal(JSON.stringify(cslData), JSON.stringify(CSLEDIT.data.get()));
	equal(CSLEDIT.data.get().name, "style");
});

test("add/delete/ammed nodes", function () {
	var cslData;

	CSLEDIT.data.setCslCode("<style><\/style>");

	equal(CSLEDIT.data.get().cslId, 0);

	CSLEDIT.data.addNode(0, 0, {name: "newNode1"});
	CSLEDIT.data.addNode(1, 0, {name: "newNode2"});
	CSLEDIT.data.addNode(0, 1, {name: "newNode3"});

	console.log("added node: " + JSON.stringify(CSLEDIT.data.get()));

	equal(CSLEDIT.data.get().children.length, 2);
	equal(CSLEDIT.data.get().children[0].name, "newNode1");
	equal(CSLEDIT.data.get().children[1].name, "newNode3");
	equal(CSLEDIT.data.get().children[1].cslId, 3);
	
	equal(CSLEDIT.data.get().children[0].children.length, 1);
	equal(CSLEDIT.data.get().children[0].children[0].name, "newNode2");
	equal(CSLEDIT.data.get().children[0].children[0].cslId, 2, "final cslId check");

	// delete "newNode1", which will also delete child "newNode2"
	CSLEDIT.data.deleteNode(1);
	equal(CSLEDIT.data.get().children.length, 1, "deleteNode");
	equal(CSLEDIT.data.get().children[0].name, "newNode3", "deleteNode");
	equal(CSLEDIT.data.get().children[0].cslId, 1, "deleteNode");

	// ammend
	CSLEDIT.data.ammendNode(0, {
		name : "ammendedName",
		attributes : ["attr1"],
		textValue : "textVal",
		cslId : "999",
		arbitraryKey : "newValue"
	});
	cslData = CSLEDIT.data.get();
	equal(cslData.name, "ammendedName");
	equal(cslData.attributes[0], "attr1");
	equal(cslData.textValue, "textVal");
	equal(cslData.cslId, 0); // this should remain consitent with position in the tree
	equal(typeof cslData.arbitraryKey, "undefined"); // not allowed to add arbitrary keys
});

test("find nodes", function () {
	var cslData;

	cslData = CSLEDIT.data.setCslCode(
		"<style><info><author><\/author><\/info><citation><layout><\/layout><\/citation><\/style>");

	console.log("cslData = " + JSON.stringify(cslData));

	equal(CSLEDIT.data.getFirstCslId(cslData, "citation"), 3);
	equal(CSLEDIT.data.getFirstCslId(cslData, "layout"), 4);
});
