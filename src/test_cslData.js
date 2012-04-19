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
	CSLEDIT.data.ammendNode(1, {
		name : "ammendedName",
		attributes : ["attr1"],
		textValue : "textVal",
		cslId : "999",
		arbitraryKey : "newValue"
	});
	cslData = CSLEDIT.data.get();
	equal(cslData.children[0].name, "ammendedName");
	equal(cslData.children[0].attributes[0], "attr1");
	equal(cslData.children[0].textValue, "textVal");
	equal(cslData.children[0].cslId, 1); // this should remain consitent with position in the tree
	equal(typeof cslData.children[0].arbitraryKey, "undefined"); // not allowed to add arbitrary keys
});

test("move nodes", function () {
	var testCsl = "<style><info><author><\/author><\/info><citation><layout><\/layout><\/citation><\/style>";

	// move info inside citation
	CSLEDIT.data.setCslCode(testCsl);
	CSLEDIT.data.moveNode(1, 3, "inside");
	equal(CSLEDIT.data.get().children[0].name, "citation");
	equal(CSLEDIT.data.get().children[0].children[1].name, "info");

	// move info before citation (should stay where it is)
	CSLEDIT.data.setCslCode(testCsl);
	CSLEDIT.data.moveNode(1, 3, "before");
	equal(CSLEDIT.data.get().children[1].name, "citation");
	equal(CSLEDIT.data.get().children[0].name, "info");
	
	// move info after citation
	CSLEDIT.data.setCslCode(testCsl);
	CSLEDIT.data.moveNode(1, 3, "after");
	equal(CSLEDIT.data.get().children[0].name, "citation");
	equal(CSLEDIT.data.get().children[1].name, "info");
	
	// move info to first child of citation
	CSLEDIT.data.setCslCode(testCsl);
	CSLEDIT.data.moveNode(1, 3, "first");
	equal(CSLEDIT.data.get().children[0].name, "citation");
	equal(CSLEDIT.data.get().children[0].children[0].name, "info");
	
	// move info to last child of citation
	CSLEDIT.data.setCslCode(testCsl);
	CSLEDIT.data.moveNode(1, 3, "last");
	equal(CSLEDIT.data.get().children[0].name, "citation");
	equal(CSLEDIT.data.get().children[0].children[1].name, "info");

	// move citation to before info 
	CSLEDIT.data.setCslCode(testCsl);
	CSLEDIT.data.moveNode(3, 1, "before");
	equal(CSLEDIT.data.get().children[0].name, "citation");
	equal(CSLEDIT.data.get().children[1].name, "info");

});

test("find nodes", function () {
	var cslData;

	cslData = CSLEDIT.data.setCslCode(
		"<style><info><author><\/author><\/info><citation><layout><\/layout><\/citation><\/style>");

	console.log("cslData = " + JSON.stringify(cslData));

	equal(CSLEDIT.data.getFirstCslId(cslData, "citation"), 3);
	equal(CSLEDIT.data.getFirstCslId(cslData, "layout"), 4);
	equal(CSLEDIT.data.getFirstCslId(cslData, "noSuchNode"), -1);
});

test("get node", function () {
	CSLEDIT.data.setCslCode(
		"<style><info><author><\/author><\/info><citation><layout><\/layout><\/citation><\/style>");

	equal(CSLEDIT.data.getNode(0).name, "style");
	equal(CSLEDIT.data.getNode(4).name, "layout");
	equal(CSLEDIT.data.getNodeAndParent(4).node.name, "layout");
	equal(CSLEDIT.data.getNodeAndParent(4).parent.name, "citation");
});

test("on change", function () {
	var numCalls;

	CSLEDIT.data.setCslCode("<style><\/style>");
	CSLEDIT.data.onChanged(function () {numCalls++;});

	numCalls = 0;
	CSLEDIT.data.addNode(0, 0, {});
	equal(numCalls, 1);

	// add another callback
	CSLEDIT.data.onChanged(function () {numCalls++;});

	numCalls = 0;
	CSLEDIT.data.addNode(0, 0, {});
	CSLEDIT.data.addNode(0, 0, {});
	equal(numCalls, 4);
});

