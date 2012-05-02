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

			macroTree.addNode(6, 0, new CSLEDIT.CslNode("text1", [], [], 7), 1);
			macroTree.addNode(6, 0, new CSLEDIT.CslNode("group", [], [], 7), 1);

			equal(treeElement.find('li[cslid=7]').attr("rel"), "group", "add");
			equal(treeElement.find('li[cslid=8]').attr("rel"), "text1", "add");

			macroTree.addNode(7, "inside", new CSLEDIT.CslNode("text2", [], [], 8), 1);
			macroTree.addNode(7, "inside", new CSLEDIT.CslNode("text3", [], [], 8), 1);
			
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

			macroTree.addNode(0, 0, new CSLEDIT.CslNode(
				"citation", [], [
					new CSLEDIT.CslNode("child1", [],
						[ new CSLEDIT.CslNode("child1-2") ]
						),
					new CSLEDIT.CslNode("child2")
				], 1), 4);
			
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

CSLEDIT.fakeViewController = (function () {
	var views = [];

	return {
		addView : function (view) {
				views.push(view);
			},
		exec : function (command, args) {

			if (command === "formatCitations") {
				return;
			}
	
			$.each(views, function (i, view) {
				view[command].apply(null, args);
			});
		}
	}
}());

asyncTest("macro link", function () {
	// testing the macro link functionality requires CSLEDIT.data to be in sync with
	// the view, since it's used for macro-name lookups

	var cslData,
		citationTree,
		treeElement = $("<div><\/div>"),
		styleTreeElement = $("<div><\/div>"),
		styleTree,
		treesToLoad;

	var treeLoaded = function () {
		treesToLoad--;

		console.log("treesToLoad = " + treesToLoad);

		if (treesToLoad > 0) {
			return;
		}
		
		equal(styleTreeElement.find('li[cslid=0]').attr("rel"), "style");
		equal(styleTreeElement.find('li[cslid=5]').attr("rel"), "text");

		equal(treeElement.find('li[cslid=0]').length, 0);
		equal(treeElement.find('li[cslid=3]').length, 1);
		equal(treeElement.find('li[cslid=4]').attr("rel"), "layout");
		equal(treeElement.find('li[cslid=5]').attr("rel"), "text");

		// this is the 'text' element within 'macro1'
		equal(treeElement.find('li[cslid=5]').find(
			'li[cslid=7]').attr("rel"), "text");
		
		// the root of the macro node isn't in the tree
		equal(treeElement.find('li[cslid=8]').length, 0);

		// neither is the last macro
		equal(treeElement.find('li[cslid=9]').length, 0);

		// add a node within citation/layout before the macro
		CSLEDIT.data.addNode(4, 0, new CSLEDIT.CslNode("newnode", [], [], 5));

		// the text node should have shifted
		equal(treeElement.find('li[cslid=6]').attr("rel"), "text");
		equal(styleTreeElement.find('li[cslid=6]').attr("rel"), "text");

		// the macro text node should also have shifted
		equal(treeElement.find('li[cslid=6]').find(
			'li[cslid=8]').attr("rel"), "text");
		equal(styleTreeElement.find('li[cslid=6]').find(
			'li[cslid=8]').attr("rel"), "text");

		// add 2 nodes to info, not within this smartTree
		CSLEDIT.data.addNode(1, 0, new CSLEDIT.CslNode("newnode2", [], [
			new CSLEDIT.CslNode("newNode3")], 2));

		// the text node should have shifted 2 places
		equal(treeElement.find('li[cslid=8][macrolink!="true"]').attr("rel"),
				"text", "add before");
		// the macro text node should also have shifted 2 places
		equal(treeElement.find('li[cslid=8][macrolink!="true"]').find(
			'li[cslid=10][macrolink=true]').attr("rel"), "text", "add before");

		// check macro node is not in tree
		equal(treeElement.find('li[cslid=9]').length, 0);

		// add a node within the macro before text
		// NOTE: parent node 9 is not displayed in the smartTree,
		// but the smartTree still needs to update the instance
		CSLEDIT.data.addNode(9, 0, new CSLEDIT.CslNode("nodewithin",[],[],10));
		equal(treeElement.find('li[cslid=8][macrolink!="true"]').attr("rel"), "text");
		equal(treeElement.find('li[cslid=8]').find(
			'li[cslid=10]').attr("rel"), "nodewithin", "add within macro");
		equal(treeElement.find('li[cslid=8]').find(
			'li[cslid=11]').attr("rel"), "text", "add within macro");
		
		equal(styleTreeElement.find('li[cslid=8][macrolink!="true"]').attr("rel"), "text");
		equal(styleTreeElement.find('li[cslid=8]').find(
			'li[cslid=10]').attr("rel"), "nodewithin", "add within macro");
		equal(styleTreeElement.find('li[cslid=8]').find(
			'li[cslid=11]').attr("rel"), "text", "add within macro");

		// delete this new node
		CSLEDIT.data.deleteNode(10);
		equal(treeElement.find('li[cslid=8][macrolink!="true"]').attr("rel"), "text");
		equal(treeElement.find('li[cslid=8]').find(
			'li[cslid=10][macrolink="true"]').attr("rel"), "text", "delete within macro");
		
		// delete the info node
		CSLEDIT.data.deleteNode(1);
		equal(treeElement.find('li[cslid=4][macrolink!="true"]').attr("rel"), "text");
		equal(treeElement.find('li[cslid=4]').find(
			'li[cslid=6]').attr("rel"), "text", "delete before");

		// rename the text node to point to a different macro
		CSLEDIT.data.ammendNode(4, new CSLEDIT.CslNode(
			"text", [{key:"macro", value:"macro2", enabled: "true"}], [], 4));

		equal(treeElement.find('li[cslid=4][macrolink!="true"]').attr("rel"), "text");
		equal(treeElement.find('li[cslid=4]').find(
			'li[cslid=6]').length, 0, "rename macro, old one gone");
		equal(treeElement.find('li[cslid=4]').find(
			'li[cslid=8]').attr("rel"), "label", "rename macro, new one there");

		// rename the text node to point to a non-existent macro
		CSLEDIT.data.ammendNode(4, new CSLEDIT.CslNode(
			"text", [{key:"macro", value:"no-such-macro", enabled: "true"}], [], 4));

		equal(treeElement.find('li[cslid=4][macrolink!="true"]').attr("rel"), "text");
		equal(treeElement.find('li[cslid=4]').find('li[cslid]').length, 0, "macro instance empty");
		equal(styleTreeElement.find('li[cslid=8][macrolink!="true"]').attr("rel"), "label",
				"macro definition still in style tree");
	
		// point it back to the 1st macro, and add another one
		CSLEDIT.data.ammendNode(4, new CSLEDIT.CslNode(
			"text", [{key:"macro", value:"macro1", enabled: "true"}], []));
		CSLEDIT.data.addNode(4, "before", new CSLEDIT.CslNode(
			"text", [{key:"macro", value:"macro1", enabled: "true"}], []));
		equal(treeElement.find('li[cslid=5]').attr("rel"), "text");
		equal(treeElement.find('li[cslid=4]').find(
			'li[cslid=7]').attr("rel"), "text", "two macros");
		equal(treeElement.find('li[cslid=5]').find(
			'li[cslid=7]').attr("rel"), "text", "two macros");


		// now delete the text node in the macro - all instances should go
		CSLEDIT.data.deleteNode(6);
		equal(treeElement.find('li[cslid=6]').length, 0, "delete node in macro");
		equal(styleTreeElement.find('li[cslid=6]').attr("rel"), "macro");

		start();
	};

	cslData = CSLEDIT.data.setCslCode (
		"<style>" +
		"<info><author><\/author><\/info>" +
		'<citation><layout><text macro="macro1"><\/text><\/layout><\/citation>' +
		'<macro name="macro1"><text><\/text><\/macro>' +
		'<macro name="macro2"><label><\/label><\/macro>' +
		"<\/style>");

	styleTree = CSLEDIT.SmartTree(styleTreeElement, ["style"]);
	styleTree.setCallbacks({ loaded : treeLoaded });
	
	citationTree = CSLEDIT.SmartTree(treeElement, ["style/citation"]);
	citationTree.setCallbacks({ loaded : treeLoaded });
	
	CSLEDIT.fakeViewController.addView(citationTree);
	CSLEDIT.fakeViewController.addView(styleTree);
	
	CSLEDIT.data.setViewController(CSLEDIT.fakeViewController);

	treesToLoad = 2;

	styleTree.createTree();
	citationTree.createTree();

});
