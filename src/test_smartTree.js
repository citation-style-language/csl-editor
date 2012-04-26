"use strict";

CSLEDIT = CSLEDIT || {};

module("CSLEDIT.smartTree");

// replace CSLEDIT.data with test version
CSLEDIT.data = CSLEDIT.Data("CSLEDIT.test_cslData");

asyncTest("create style tree", function () {
	var cslData,
		styleTree,
		treeElement = $("<div><\/div>");

	cslData = CSLEDIT.data.setCslCode (
		"<style>" +
		"<info><author><\/author><\/info>" +
		"<citation><layout><\/layout><\/citation>" +
		"<macro><\/macro>" +
		"<macro><text><\/text><\/macro>" +
		"<\/style>");

	styleTree = CSLEDIT.SmartTree(treeElement, ["style"]);
	styleTree.setCallbacks({
		loaded : function () {
			equal(treeElement.find('li[cslid=0]').length, 1); 
			equal(treeElement.find('li[cslid=0]').attr("rel"), "style");
			equal(treeElement.find('li[cslid=1]').attr("rel"), "info");
			equal(treeElement.find('li[cslid=2]').attr("rel"), "author");
			equal(treeElement.find('li[cslid=3]').attr("rel"), "citation");
			start();
		}
	});
	styleTree.createTree();
});

asyncTest("create macros tree", function () {
	var cslData,
		macroTree,
		treeElement = $("<div><\/div>");

	cslData = CSLEDIT.data.setCslCode (
		"<style>" +
		"<info><author><\/author><\/info>" +
		"<citation><layout><\/layout><\/citation>" +
		"<macro><\/macro>" +
		"<macro><text><\/text><\/macro>" +
		"<\/style>");

	macroTree = CSLEDIT.SmartTree(treeElement, ["style/macro"]);
	macroTree.setCallbacks({
		loaded : function () {
			equal(treeElement.find('li[cslid=0]').length, 0);
			equal(treeElement.find('li[cslid=5]').length, 1);
			equal(treeElement.find('li[cslid=5]').attr("rel"), "macro");
			equal(treeElement.find('li[cslid=6]').attr("rel"), "macro");
			equal(treeElement.find('li[cslid=7]').attr("rel"), "text");

			start();
		}
	});
	macroTree.createTree();
});

asyncTest("add/delete nodes", function () {
	var cslData,
		macroTree,
		treeElement = $("<div><\/div>");

	cslData = CSLEDIT.data.setCslCode (
		"<style>" +
		"<info><author><\/author><\/info>" +
		"<citation><layout><\/layout><\/citation>" +
		"<macro><\/macro>" +
		"<macro><text><\/text><\/macro>" +
		"<macro><inLastMacro><\/inLastMacro><\/macro>" +
		"<\/style>");

	macroTree = CSLEDIT.SmartTree(treeElement, ["style/macro"]);
	macroTree.setCallbacks({
		loaded : function () {
			equal(treeElement.find('li[cslid=0]').length, 0);
			equal(treeElement.find('li[cslid=5]').length, 1);
			equal(treeElement.find('li[cslid=5]').attr("rel"), "macro");
			equal(treeElement.find('li[cslid=6]').attr("rel"), "macro");
			equal(treeElement.find('li[cslid=7]').attr("rel"), "text");
			equal(treeElement.find('li[cslid=8]').attr("rel"), "macro");
			equal(treeElement.find('li[cslid=9]').attr("rel"), "inLastMacro");

			macroTree.addNode(6, 0, {name : "text1"}, 1);
			macroTree.addNode(6, 0, {name : "group"}, 1);

			equal(treeElement.find('li[cslid=7]').attr("rel"), "group", "add");
			equal(treeElement.find('li[cslid=8]').attr("rel"), "text1", "add");

			macroTree.addNode(7, "inside", {name : "text2", children : []}, 1);
			macroTree.addNode(7, "inside", {name : "text3", children : []}, 1);
			
			equal(treeElement.find('li[cslid=8]').attr("rel"), "text3");
			equal(treeElement.find('li[cslid=9]').attr("rel"), "text2");
			equal(treeElement.find('li[cslid=10]').attr("rel"), "text1");
			equal(treeElement.find('li[cslid=11]').attr("rel"), "text");
			equal(treeElement.find('li[cslid=12]').attr("rel"), "macro");
			equal(treeElement.find('li[cslid=13]').attr("rel"), "inLastMacro");

			// delete nodes
			macroTree.deleteNode(7, 3);
			
			equal(treeElement.find('li[cslid=6]').attr("rel"), "macro", "delete");
			equal(treeElement.find('li[cslid=7]').attr("rel"), "text1");
			equal(treeElement.find('li[cslid=8]').attr("rel"), "text");
			equal(treeElement.find('li[cslid=9]').attr("rel"), "macro");
			equal(treeElement.find('li[cslid=10]').attr("rel"), "inLastMacro");

			start();
		}
	});
	macroTree.createTree();
});

asyncTest("add node with children", function () {
	var cslData,
		macroTree,
		treeElement = $("<div><\/div>");

	cslData = CSLEDIT.data.setCslCode("<style><bibliography><\/bibliography><\/style>");

	macroTree = CSLEDIT.SmartTree(treeElement, ["style"]);
	macroTree.setCallbacks({
		loaded : function () {
			equal(treeElement.find('li[cslid=0]').attr("rel"), "style");
			equal(treeElement.find('li[cslid=1]').attr("rel"), "bibliography");

			macroTree.addNode(0, 0, {
				name : "citation",
				children : [
					{
						name : "child1",
						children : [ { name : "child1-2", children : [] } ]
					},
					{ name : "child2", children : [] }
				]
			}, 4);
			
			equal(treeElement.find('li[cslid=0]').attr("rel"), "style");
			equal(treeElement.find('li[cslid=1]').attr("rel"), "citation");
			equal(treeElement.find('li[cslid=2]').attr("rel"), "child1");
			equal(treeElement.find('li[cslid=3]').attr("rel"), "child1-2");
			equal(treeElement.find('li[cslid=4]').attr("rel"), "child2");
			equal(treeElement.find('li[cslid=5]').attr("rel"), "bibliography");

			start();
		}
	});
	macroTree.createTree();
});

