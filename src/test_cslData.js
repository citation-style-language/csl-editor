"use strict";

module("CSLEDIT_cslData", {
	setup : function () {
		// replace CSLEDIT_data with test version
		CSLEDIT_data = CSLEDIT_Data("CSLEDIT_test_cslData", []);
	}
});

test("set code", function () {
	var cslData,
		result;

	result = CSLEDIT_data.setCslCode("<needs_to_start_with_style_node></needs_to_start_with_style_node>");
	debug.log(result.error);
	ok(result.error.length > 0);

	result = CSLEDIT_data.setCslCode("<style><mis></match></style>");
	ok(result.error.length > 0);

	result = CSLEDIT_data.setCslCode("<style><citation><layout /></citation>" +
		"<bibliography><layout /></bibliography></style>");
	ok(!result.hasOwnProperty('error'));
	equal(CSLEDIT_data.get().name, "style");
});

test("add/delete/ammed nodes", function () {
	var cslData;

	CSLEDIT_data.setCslCode("<style></style>");

	equal(CSLEDIT_data.get().cslId, 0);

	CSLEDIT_data.addNode(0, 0, {name: "newNode1"});
	CSLEDIT_data.addNode(1, 0, {name: "newNode2"});
	CSLEDIT_data.addNode(0, 1, {name: "newNode3"});

	equal(CSLEDIT_data.get().children.length, 2);
	equal(CSLEDIT_data.get().children[0].name, "newNode1");
	equal(CSLEDIT_data.get().children[1].name, "newNode3");
	equal(CSLEDIT_data.get().children[1].cslId, 3);
	
	equal(CSLEDIT_data.get().children[0].children.length, 1);
	equal(CSLEDIT_data.get().children[0].children[0].name, "newNode2");
	equal(CSLEDIT_data.get().children[0].children[0].cslId, 2, "final cslId check");

	// delete "newNode1", which will also delete child "newNode2"
	CSLEDIT_data.deleteNode(1);
	equal(CSLEDIT_data.get().children.length, 1, "deleteNode");
	equal(CSLEDIT_data.get().children[0].name, "newNode3", "deleteNode");
	equal(CSLEDIT_data.get().children[0].cslId, 1, "deleteNode");

	// amend
	CSLEDIT_data.amendNode(1, {
		name : "amendedName",
		attributes : ["attr1"],
		textValue : "textVal",
		cslId : "999",
		arbitraryKey : "newValue"
	});
	cslData = CSLEDIT_data.get();
	equal(cslData.children[0].name, "amendedName");
	equal(cslData.children[0].attributes[0], "attr1");
	equal(cslData.children[0].textValue, "textVal");
	equal(cslData.children[0].cslId, 1); // this should remain consitent with position in the tree
	equal(typeof cslData.children[0].arbitraryKey, "undefined"); // not allowed to add arbitrary keys
});

test("move nodes", function () {
	var testCsl = "<style><info><author></author></info><citation><layout></layout></citation></style>";

	// move info inside citation
	CSLEDIT_data.setCslCode(testCsl);
	CSLEDIT_data.moveNode(1, 3, "inside");
	equal(CSLEDIT_data.get().children[0].name, "citation");
	equal(CSLEDIT_data.get().children[0].children[1].name, "info");

	// move info before citation (should stay where it is)
	CSLEDIT_data.setCslCode(testCsl);
	CSLEDIT_data.moveNode(1, 3, "before");
	equal(CSLEDIT_data.get().children[1].name, "citation");
	equal(CSLEDIT_data.get().children[0].name, "info");
	
	// move info after citation
	CSLEDIT_data.setCslCode(testCsl);
	CSLEDIT_data.moveNode(1, 3, "after");
	equal(CSLEDIT_data.get().children[0].name, "citation");
	equal(CSLEDIT_data.get().children[1].name, "info");
	
	// move info to first child of citation
	CSLEDIT_data.setCslCode(testCsl);
	CSLEDIT_data.moveNode(1, 3, "first");
	equal(CSLEDIT_data.get().children[0].name, "citation");
	equal(CSLEDIT_data.get().children[0].children[0].name, "info");
	
	// move info to last child of citation
	CSLEDIT_data.setCslCode(testCsl);
	CSLEDIT_data.moveNode(1, 3, "last");
	equal(CSLEDIT_data.get().children[0].name, "citation");
	equal(CSLEDIT_data.get().children[0].children[1].name, "info");

	// move citation to before info 
	CSLEDIT_data.setCslCode(testCsl);
	CSLEDIT_data.moveNode(3, 1, "before");
	equal(CSLEDIT_data.get().children[0].name, "citation");
	equal(CSLEDIT_data.get().children[1].name, "info");

});

test("find nodes", function () {
	var cslData;

	CSLEDIT_data.setCslCode(
		"<style><info><author></author></info><citation><layout></layout></citation></style>");

	cslData = CSLEDIT_data.get();

	equal(CSLEDIT_data.getFirstCslId(cslData, "citation"), 3);
	equal(CSLEDIT_data.getFirstCslId(cslData, "layout"), 4);
	equal(CSLEDIT_data.getFirstCslId(cslData, "noSuchNode"), -1);
});

test("get node", function () {
	CSLEDIT_data.setCslCode(
		"<style><info><author></author></info><citation><layout></layout></citation></style>");

	equal(CSLEDIT_data.getNode(0).name, "style");
	equal(CSLEDIT_data.getNode(4).name, "layout");
	equal(CSLEDIT_data.getNodeAndParent(4).node.name, "layout");
	equal(CSLEDIT_data.getNodeAndParent(4).parent.name, "citation");
});
/*
test("on change", function () {
	var numCalls;

	CSLEDIT_data.setCslCode("<style></style>");
	CSLEDIT_data.onChanged(function () {numCalls++;});

	numCalls = 0;
	CSLEDIT_data.addNode(0, 0, {});
	equal(numCalls, 1);

	// add another callback
	CSLEDIT_data.onChanged(function () {numCalls++;});

	numCalls = 0;
	CSLEDIT_data.addNode(0, 0, {});
	CSLEDIT_data.addNode(0, 0, {});
	equal(numCalls, 4);
});
*/
test("find by path", function () {
	var testCsl = "<style><info><author></author></info><citation><layout></layout></citation><macro></macro><macro></macro></style>",
		cslData;

	CSLEDIT_data.setCslCode(testCsl);
	cslData = CSLEDIT_data.get();

	equal(CSLEDIT_data.getNodesFromPath("", cslData).length, 0);
	equal(CSLEDIT_data.getNodesFromPath("style/notThere", cslData).length, 0);

	equal(CSLEDIT_data.getNodesFromPath("style", cslData)[0].cslId, 0);
	equal(CSLEDIT_data.getNodesFromPath("style/info", cslData)[0].cslId, 1);
	equal(CSLEDIT_data.getNodesFromPath("style/citation/layout", cslData)[0].cslId, 4);

	equal(CSLEDIT_data.getNodesFromPath("style/macro", cslData)[0].cslId, 5);
	equal(CSLEDIT_data.getNodesFromPath("style/macro", cslData)[1].cslId, 6);

	equal(CSLEDIT_data.getNodesFromPath("style/*", cslData)[0].cslId, 1);
	equal(CSLEDIT_data.getNodesFromPath("style/*", cslData)[1].cslId, 3);
	equal(CSLEDIT_data.getNodesFromPath("style/*", cslData)[2].cslId, 5);
	equal(CSLEDIT_data.getNodesFromPath("style/*", cslData)[3].cslId, 6);
});

test("find macro definition", function () {
	var testCsl = "<style><info><author></author></info>" +
		'<citation><layout><text macro="m1"></text></layout></citation>' + 
		'<macro name="m1"></macro><macro></macro></style>';

	CSLEDIT_data.setCslCode(testCsl);

	equal(CSLEDIT_data.getNode(5).name, "text");
	equal(CSLEDIT_data.getNode(6).name, "macro");

	equal(CSLEDIT_data.macroDefinitionIdFromInstanceId(5), 6, "text goes to macro");
	equal(CSLEDIT_data.macroDefinitionIdFromInstanceId(6), 6, "macro stays the same");
	equal(CSLEDIT_data.macroDefinitionIdFromInstanceId(4), 4, "any other id stays the same");
});

test("get node stack", function () {
	var testCsl = "<style><info><author></author></info>" +
		'<citation><layout><text macro="m1"></text></layout></citation>' + 
		'<macro name="m1"></macro><macro></macro></style>',
		nodeStack;

	CSLEDIT_data.setCslCode(testCsl);

	equal(CSLEDIT_data.getNode(5).name, "text");

	nodeStack = CSLEDIT_data.getNodeStack(5);

	equal(nodeStack[0].name, "style");
	equal(nodeStack[1].name, "citation");
	equal(nodeStack[2].name, "layout");
	equal(nodeStack[3].name, "text");
});

test("required nodes", function () {
	var result;

	// require nodes (note: style node is always required, regardless of arguments)
	CSLEDIT_data = CSLEDIT_Data("CSLEDIT_test_cslData", ["style/parent1", "style/parent2/child1"]);
	
	result = CSLEDIT_data.setCslCode("<style><parent1></parent1></style>");
	ok(result.error.length > 0);
	debug.log(result.error);

	result = CSLEDIT_data.setCslCode("<style><parent1></parent1>" +
		"<parent2><child1></child1></parent2></style>");
	ok(!result.hasOwnProperty('error'));
});
