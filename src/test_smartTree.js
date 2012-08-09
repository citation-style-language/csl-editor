"use strict";



module("CSLEDIT_smartTree");

asyncTest("create style tree", function () {
	var styleTree,
		treeElement = $("<div></div>");

	CSLEDIT_data = CSLEDIT_Data("CSLEDIT_test_cslData", []);
	CSLEDIT_data.setCslCode (
		"<style>" +
		"<info><author></author></info>" +
		"<citation><layout></layout></citation>" +
		"<macro></macro>" +
		"<macro><text></text></macro>" +
		"</style>");

	styleTree = CSLEDIT_SmartTree(treeElement, ["style"]);
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
		treeElement = $("<div></div>");

	CSLEDIT_data = CSLEDIT_Data("CSLEDIT_test_cslData", []);

	cslData = CSLEDIT_data.setCslCode (
		"<style>" +
		"<info><author></author></info>" +
		"<citation><layout></layout></citation>" +
		"<macro></macro>" +
		"<macro><text></text></macro>" +
		"</style>");

	macroTree = CSLEDIT_SmartTree(treeElement, ["style/macro"]);
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
		treeElement = $("<div></div>");

	CSLEDIT_data = CSLEDIT_Data("CSLEDIT_test_cslData", []);

	cslData = CSLEDIT_data.setCslCode (
		"<style>" +
		"<info><author></author></info>" +
		"<citation><layout></layout></citation>" +
		"<macro></macro>" +
		"<macro><text></text></macro>" +
		"<macro><inLastMacro></inLastMacro></macro>" +
		"</style>");

	macroTree = CSLEDIT_SmartTree(treeElement, ["style/macro"]);
	macroTree.setCallbacks({
		loaded : function () {
			equal(treeElement.find('li[cslid=0]').length, 0);
			equal(treeElement.find('li[cslid=5]').length, 1);
			equal(treeElement.find('li[cslid=5]').attr("rel"), "macro");
			equal(treeElement.find('li[cslid=6]').attr("rel"), "macro");
			equal(treeElement.find('li[cslid=7]').attr("rel"), "text");
			equal(treeElement.find('li[cslid=8]').attr("rel"), "macro");
			equal(treeElement.find('li[cslid=9]').attr("rel"), "inLastMacro");

			macroTree.addNode(6, 0, new CSLEDIT_CslNode("text1", [], [], 7), 1);
			macroTree.addNode(6, 0, new CSLEDIT_CslNode("group", [], [], 7), 1);

			equal(treeElement.find('li[cslid=7]').attr("rel"), "group", "add");
			equal(treeElement.find('li[cslid=8]').attr("rel"), "text1", "add");

			macroTree.addNode(7, "inside", new CSLEDIT_CslNode("text2", [], [], 8), 1);
			macroTree.addNode(7, "inside", new CSLEDIT_CslNode("text3", [], [], 8), 1);
			
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

asyncTest("move subtree", function () {
	var cslData,
		citationTree,
		bibliographyTree,
		citationTreeElement = $("<div></div>"),
		bibliographyTreeElement = $("<div></div>"),
		fakeViewController = new CSLEDIT_FakeViewController(),
		description;

	CSLEDIT_data = CSLEDIT_Data("CSLEDIT_test_cslData", []);
	CSLEDIT_data.addViewController(fakeViewController);

	cslData = CSLEDIT_data.setCslCode (
		"<style>" +
		"<info><author></author></info>" +
		"<citation><layout><group><text></text></group></layout></citation>" +
		"<bibliography><layout></layout></bibliography>" +
		"</style>");

	citationTree = CSLEDIT_SmartTree(citationTreeElement, ["style/citation/layout"]);
	bibliographyTree = CSLEDIT_SmartTree(bibliographyTreeElement, ["style/bibliography/layout"]);
	
	fakeViewController.addView(citationTree);
	fakeViewController.addView(bibliographyTree);

	citationTree.setVerifyAllChanges(true);
	bibliographyTree.setVerifyAllChanges(true);

	citationTree.setCallbacks({
		loaded : function () {
			description = "before move";
			equal(citationTreeElement.find('li[cslid=0]').length, 0, description);
			equal(citationTreeElement.find('li[cslid=4]').attr("rel"), "layout", description);
			equal(citationTreeElement.find('li[cslid=5]').attr("rel"), "group", description);
			equal(citationTreeElement.find('li[cslid=6]').attr("rel"), "text", description);
			equal(citationTreeElement.find('li[cslid=7]').length, 0, description);
			equal(bibliographyTreeElement.find('li[cslid=8]').attr("rel"), "layout", description);

			// move group node from citation/layout to bibliography/layout
			CSLEDIT_data.moveNode(5, 8, 0);

			description = "after move";
			equal(citationTreeElement.find('li[cslid=0]').length, 0, description);
			equal(citationTreeElement.find('li[cslid=4]').attr("rel"), "layout", description);
			equal(citationTreeElement.find('li[cslid=5]').length, 0, description);
			equal(bibliographyTreeElement.find('li[cslid=6]').attr("rel"), "layout", description);
			equal(bibliographyTreeElement.find('li[cslid=7]').attr("rel"), "group", description);
			equal(bibliographyTreeElement.find('li[cslid=8]').attr("rel"), "text", description);

			start();
		}
	});
	bibliographyTree.setCallbacks({
		loaded : function () {
			citationTree.createTree();
		}
	});
	bibliographyTree.createTree();
});

asyncTest("add node with children", function () {
	var cslData,
		macroTree,
		treeElement = $("<div></div>");

	CSLEDIT_data = CSLEDIT_Data("CSLEDIT_test_cslData", []);

	cslData = CSLEDIT_data.setCslCode("<style><bibliography></bibliography></style>");

	macroTree = CSLEDIT_SmartTree(treeElement, ["style"]);
	macroTree.setCallbacks({
		loaded : function () {
			equal(treeElement.find('li[cslid=0]').attr("rel"), "style");
			equal(treeElement.find('li[cslid=1]').attr("rel"), "bibliography");

			macroTree.addNode(0, 0, new CSLEDIT_CslNode(
				"citation", [], [
					new CSLEDIT_CslNode("child1", [],
						[ new CSLEDIT_CslNode("child1-2", [], [], 3) ], 2
						),
					new CSLEDIT_CslNode("child2", [], [], 4)
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

var CSLEDIT_FakeViewController = function () {
	var views = [];

	return {
		addView : function (view) {
				views.push(view);
			},
		styleChanged : function (command, args) {

			debug.log("Fake view exec: " + command + ": " + JSON.stringify(args));
			if (command === "formatCitations") {
				return;
			}
	
			$.each(views, function (i, view) {
				view[command].apply(null, args);
			});
		}
	}
};

asyncTest("macro link", function () {
	// testing the macro link functionality requires CSLEDIT_data to be in sync with
	// the view, since it's used for macro-name lookups

	var cslData,
		citationTree,
		treeElement = $("<div></div>"),
		styleTreeElement = $("<div></div>"),
		styleTree,
		treesToLoad,
		fakeViewController = new CSLEDIT_FakeViewController();

	CSLEDIT_data = CSLEDIT_Data("CSLEDIT_test_cslData", ["style/citation/layout"]);

	var treeLoaded = function () {
		treesToLoad--;

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
		CSLEDIT_data.addNode(4, 0, new CSLEDIT_CslNode("newnode", [], [], 5));

		// the text node should have shifted
		equal(treeElement.find('li[cslid=6]').attr("rel"), "text");
		equal(styleTreeElement.find('li[cslid=6]').attr("rel"), "text");

		// the macro text node should also have shifted
		equal(treeElement.find('li[cslid=6]').find(
			'li[cslid=8]').attr("rel"), "text");
		equal(styleTreeElement.find('li[cslid=6]').find(
			'li[cslid=8]').attr("rel"), "text");

		// add 2 nodes to info, not within this smartTree
		CSLEDIT_data.addNode(1, 0, new CSLEDIT_CslNode("newnode2", [], [
			new CSLEDIT_CslNode("newNode3")], 2));

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
		equal(citationTree.getRanges()[0].last, 8);
		CSLEDIT_data.addNode(9, 0, new CSLEDIT_CslNode("nodewithin",[],[],10));
		equal(citationTree.getRanges()[0].last, 8, "range size not changed");
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
		CSLEDIT_data.deleteNode(10);
		equal(treeElement.find('li[cslid=8][macrolink!="true"]').attr("rel"), "text");
		equal(treeElement.find('li[cslid=8]').find(
			'li[cslid=10][macrolink="true"]').attr("rel"), "text", "delete within macro");
		
		// delete the info node
		CSLEDIT_data.deleteNode(1);
		equal(treeElement.find('li[cslid=4][macrolink!="true"]').attr("rel"), "text");
		equal(treeElement.find('li[cslid=4]').find(
			'li[cslid=6]').attr("rel"), "text", "delete before");

		// rename the text node to point to a different macro
		CSLEDIT_data.amendNode(4, new CSLEDIT_CslNode(
			"text", [{key:"macro", value:"macro2", enabled: "true"}], [], 4));

		equal(treeElement.find('li[cslid=4][macrolink!="true"]').attr("rel"), "text");
		equal(treeElement.find('li[cslid=4]').find(
			'li[cslid=6]').length, 0, "rename macro, old one gone");
		equal(treeElement.find('li[cslid=4]').find(
			'li[cslid=8]').attr("rel"), "label", "rename macro, new one there");

		// rename the text node to point to a non-existent macro
		CSLEDIT_data.amendNode(4, new CSLEDIT_CslNode(
			"text", [{key:"macro", value:"no-such-macro", enabled: "true"}], [], 4));

		equal(treeElement.find('li[cslid=4][macrolink!="true"]').attr("rel"), "text");
		equal(treeElement.find('li[cslid=4]').find('li[cslid]').length, 0, "macro instance empty");
		equal(styleTreeElement.find('li[cslid=8][macrolink!="true"]').attr("rel"), "label",
				"macro definition still in style tree");
	
		// point it back to the 1st macro, and add another one
		CSLEDIT_data.amendNode(4, new CSLEDIT_CslNode(
			"text", [{key:"macro", value:"macro1", enabled: "true"}], []));
		CSLEDIT_data.addNode(4, "before", new CSLEDIT_CslNode(
			"text", [{key:"macro", value:"macro1", enabled: "true"}], []));
		equal(treeElement.find('li[cslid=5]').attr("rel"), "text");
		equal(treeElement.find('li[cslid=4]').find(
			'li[cslid=7]').attr("rel"), "text", "two macros");
		equal(treeElement.find('li[cslid=5]').find(
			'li[cslid=7]').attr("rel"), "text", "two macros");

		// now delete the text node in the macro - all instances should go
		CSLEDIT_data.deleteNode(7);
		equal(treeElement.find('li[cslid=7]').length, 0, "delete node in macro");
		equal(treeElement.find('li[cslid=7]').length, 0, "delete node in macro");
		equal(styleTreeElement.find('li[cslid=6]').attr("rel"), "macro");
		equal(styleTreeElement.find('li[cslid=6]').find("li[cslid]").length, 0,
			"macro def now empty");

		// add a node back to the empty macro
		CSLEDIT_data.addNode(6, 0, new CSLEDIT_CslNode("newnode"));
		equal(styleTreeElement.find('li[cslid=7][macrolink=true]').attr("rel"), "newnode");
		equal(styleTreeElement.find('li[cslid=7][macrolink!=true]').attr("rel"), "newnode");
		equal(treeElement.find('li[cslid=7][macrolink=true]').attr("rel"), "newnode");

		// now delete the macro itself - all instances should go
		CSLEDIT_data.deleteNode(6);
		equal(treeElement.find('li[cslid=6]').length, 0, "delete node in macro");
		equal(styleTreeElement.find('li[cslid=6]').attr("rel"), "macro");
		equal(citationTree.getMacroLinks().length, 0);
		equal(styleTree.getMacroLinks().length, 0, "no macro links in style tree");

		start();
	};

	cslData = CSLEDIT_data.setCslCode (
		"<style>" +
		"<info><author></author></info>" +
		'<citation><layout><text macro="macro1"></text></layout></citation>' +
		'<macro name="macro1"><text></text></macro>' +
		'<macro name="macro2"><label></label></macro>' +
		"</style>");

	styleTree = CSLEDIT_SmartTree(styleTreeElement, ["style"], true);
	styleTree.setCallbacks({ loaded : treeLoaded });
	styleTree.setVerifyAllChanges(true);
	
	citationTree = CSLEDIT_SmartTree(treeElement, ["style/citation"], true);
	citationTree.setCallbacks({ loaded : treeLoaded });
	citationTree.setVerifyAllChanges(true);
	
	fakeViewController.addView(citationTree);
	fakeViewController.addView(styleTree);
	
	CSLEDIT_data.addViewController(fakeViewController);

	treesToLoad = 2;

	styleTree.createTree();
	citationTree.createTree();

});

asyncTest("add to instance after macro", function () {
	// testing the macro link functionality requires CSLEDIT_data to be in sync with
	// the view, since it's used for macro-name lookups

	var cslData,
		citationTree,
		treeElement = $("<div></div>"),
		styleTreeElement = $("<div></div>"),
		styleTree,
		treesToLoad,
		newNode,
		description,
		fakeViewController = new CSLEDIT_FakeViewController();

	CSLEDIT_data = CSLEDIT_Data("CSLEDIT_test_cslData", []);

	var treeLoaded = function () {
		treesToLoad--;

		if (treesToLoad > 0) {
			return;
		}
		
		equal(styleTreeElement.find('li[cslid=0]').attr("rel"), "style");
		equal(styleTreeElement.find('li[cslid=1]').attr("rel"), "info");
		equal(styleTreeElement.find('li[cslid=2]').attr("rel"), "author");
		equal(styleTreeElement.find('li[cslid=3]').attr("rel"), "macro");
		equal(styleTreeElement.find('li[cslid=4]').attr("rel"), "text");
		equal(styleTreeElement.find('li[cslid=5]').attr("rel"), "macro");
		equal(styleTreeElement.find('li[cslid=6]').attr("rel"), "label");
		equal(styleTreeElement.find('li[cslid=7]').attr("rel"), "citation");
		equal(styleTreeElement.find('li[cslid=8]').attr("rel"), "layout");
		equal(styleTreeElement.find('li[cslid=9]').attr("rel"), "text");
		equal(styleTreeElement.find('li[cslid=9]').find(
			'li[cslid=4][macrolink=true]').attr("rel"), "text");

		// add to the macro instance directly (will add to macro definition behind the scenes)
		CSLEDIT_data.addNode(9, 0, new CSLEDIT_CslNode("newnode"));
		
		equal(styleTreeElement.find('li[cslid=3]').
			find('li[cslid=4][macrolink!=true]').attr("rel"), "newnode");
		equal(styleTreeElement.find('li[cslid=10]').
			find('li[cslid=4][macrolink=true]').attr("rel"), "newnode");
		equal(styleTreeElement.find('li[cslid=10]').
			find('li[cslid=5][macrolink=true]').attr("rel"), "text", "added to instance");

		// add another macro instance at the end
		var newNode = new CSLEDIT_CslNode("text");
		newNode.setAttr("macro", "macro1");

		equal(citationTree.getRanges()[0].last, 10);
		CSLEDIT_data.addNode(10, "after", newNode);
		
		equal(citationTree.getRanges()[0].last, 11);

		equal(styleTreeElement.find('li[cslid=11]').attr('rel'), "text");
		equal(styleTreeElement.find('li[cslid=11]').
			find('li[cslid=4][macrolink=true]').attr("rel"), "newnode");
		equal(styleTreeElement.find('li[cslid=11]').
			find('li[cslid=5][macrolink=true]').attr("rel"), "text");
		
		// add a node to the second instance
		CSLEDIT_data.addNode(10, 0, new CSLEDIT_CslNode("newnode2"));

		equal(styleTreeElement.find('li[cslid=11]').attr('rel'), "text");
		equal(styleTreeElement.find('li[cslid=12]').attr('rel'), "text");

		description = "check contents of first instance";
		equal(styleTreeElement.find('li[cslid=11]').
			find('li[cslid=4][macrolink=true]').attr("rel"), "newnode2", description);
		equal(styleTreeElement.find('li[cslid=11]').
			find('li[cslid=5][macrolink=true]').attr("rel"), "newnode", description);
		equal(styleTreeElement.find('li[cslid=11]').
			find('li[cslid=6][macrolink=true]').attr("rel"), "text", description);

		description = "check contents of second instance";
		equal(styleTreeElement.find('li[cslid=12]').
			find('li[cslid=4][macrolink=true]').attr("rel"), "newnode2", description);
		equal(styleTreeElement.find('li[cslid=12]').
			find('li[cslid=5][macrolink=true]').attr("rel"), "newnode", description);
		equal(styleTreeElement.find('li[cslid=12]').
			find('li[cslid=6][macrolink=true]').attr("rel"), "text", description);

		// delete "newnode" from macro definition
		CSLEDIT_data.deleteNode(5);

		description = "instances shifted back one";
		equal(styleTreeElement.find('li[cslid=10]').attr('rel'), "text", description);
		equal(styleTreeElement.find('li[cslid=11]').attr('rel'), "text", description);

		description = "check contents of first instance";
		equal(styleTreeElement.find('li[cslid=10]').
			find('li[cslid=4][macrolink=true]').attr("rel"), "newnode2", description);
		equal(styleTreeElement.find('li[cslid=10]').
			find('li[cslid=5][macrolink=true]').attr("rel"), "text", description);
		equal(styleTreeElement.find('li[cslid=10]').find('li[cslid]').length, 2);

		description = "check contents of second instance";
		equal(styleTreeElement.find('li[cslid=11]').
			find('li[cslid=4][macrolink=true]').attr("rel"), "newnode2", description);
		equal(styleTreeElement.find('li[cslid=11]').
			find('li[cslid=5][macrolink=true]').attr("rel"), "text", description);
		equal(styleTreeElement.find('li[cslid=11]').find('li[cslid]').length, 2);

		// delete first macro instance
		CSLEDIT_data.deleteNode(10);

		description = "second instance shifted back one";
		equal(styleTreeElement.find('li[cslid=10]').attr('rel'), "text", description);
		equal(styleTreeElement.find('li[cslid=11]').length, 0, description);

		description = "check contents of second instance";
		equal(styleTreeElement.find('li[cslid=10]').
			find('li[cslid=4][macrolink=true]').attr("rel"), "newnode2", description);
		equal(styleTreeElement.find('li[cslid=10]').
			find('li[cslid=5][macrolink=true]').attr("rel"), "text", description);
		equal(styleTreeElement.find('li[cslid=10]').find('li[cslid]').length, 2);

		start();
	};

	cslData = CSLEDIT_data.setCslCode (
		"<style>" +
		"<info><author></author></info>" +
		'<macro name="macro1"><text></text></macro>' +
		'<macro name="macro2"><label></label></macro>' +
		'<citation><layout><text macro="macro1"></text></layout></citation>' +
		"</style>");

	styleTree = CSLEDIT_SmartTree(styleTreeElement, ["style"], true);
	styleTree.setCallbacks({ loaded : treeLoaded });
	styleTree.setVerifyAllChanges(true);
	
	citationTree = CSLEDIT_SmartTree(treeElement, ["style/citation"], true);
	citationTree.setCallbacks({ loaded : treeLoaded });
	citationTree.setVerifyAllChanges(true);
	
	fakeViewController.addView(citationTree);
	fakeViewController.addView(styleTree);
	
	CSLEDIT_data.addViewController(fakeViewController);

	treesToLoad = 2;

	styleTree.createTree();
	citationTree.createTree();

});

asyncTest("macros within macros", function () {
	// testing the macro link functionality requires data to be in sync with
	// the view, since it's used for macro-name lookups

	var cslData,
		citationTree,
		treeElement = $("<div></div>"),
		styleTreeElement = $("<div></div>"),
		styleTree,
		treesToLoad,
		newNode,
		description,
		fakeViewController = new CSLEDIT_FakeViewController();

	CSLEDIT_data = CSLEDIT_Data("CSLEDIT_test_cslData", []);

	var treeLoaded = function () {
		treesToLoad--;

		if (treesToLoad > 0) {
			return;
		}
		
		equal(styleTreeElement.find('li[cslid=0]').attr("rel"), "style");
		equal(styleTreeElement.find('li[cslid=3]').attr("rel"), "macro");
		equal(styleTreeElement.find('li[cslid=4]').attr("rel"), "text");
		equal(styleTreeElement.find('li[cslid=5]').attr("rel"), "macro");
		equal(styleTreeElement.find('li[cslid=6]').attr("rel"), "label");
		equal(styleTreeElement.find('li[cslid=7]').attr("rel"), "citation");
		equal(styleTreeElement.find('li[cslid=8]').attr("rel"), "layout");
		equal(styleTreeElement.find('li[cslid=9]').attr("rel"), "text");
		equal(styleTreeElement.find('li[cslid=9]').find(
			'li[cslid=4][macrolink=true]').attr("rel"), "text");
		
		equal(styleTree.getMacroLinks().length, 1, "check macro links");

		description = "add reference to macro2 within macro1";
		newNode = new CSLEDIT_CslNode("text");
		newNode.setAttr("macro", "macro2");
		CSLEDIT_data.addNode(3, 0, newNode);
		
		equal(styleTree.getMacroLinks().length, 2, "check macro links");
		
		equal(styleTreeElement.find('li[cslid=3]').
			find('li[cslid=4][macrolink!=true]').attr("rel"), "text", description);
		equal(styleTreeElement.find('li[cslid=3]').
			find('li[cslid=5][macrolink!=true]').attr("rel"), "text", description);
		equal(styleTreeElement.find('li[cslid=6]').
			find('li[cslid=7][macrolink!=true]').attr("rel"), "label", description);

		description = "check overall length";
		equal(styleTreeElement.find('li[cslid][macrolink!=true]').length, 11, description);
		equal(styleTreeElement.find('li[cslid][macrolink=true]').length, 4, description);

		description = "check a link was made to macro2 instance in macro1";
		equal(styleTreeElement.
			find('li[cslid=3]').
			find('li[cslid=4][macrolink!=true]').
			find('li[cslid=7][macrolink=true]').attr("rel"), "label", description);

		description = "check a link was made to macro2 instance in citation/layout";
		equal(styleTreeElement.
			find('li[cslid=10][macrolink!=true]').attr('rel'),
			"text", description);
		equal(styleTreeElement.
			find('li[cslid=10][macrolink!=true]').
			find('li[cslid=4][macrolink=true]').attr("rel"), "text", description);
		equal(styleTreeElement.
			find('li[cslid=10][macrolink!=true]').
			find('li[cslid=4][macrolink=true]').
			find('li[cslid=7][macrolink=true]').
				attr("rel"), "label", description);

		description = "node 5 is a normal text node and shouldn't have children (before)";
		equal(styleTreeElement.
			find('li[cslid=5][macrolink!=true]').attr("rel"), "text", description);
		equal(styleTreeElement.
			find('li[cslid=5][macrolink!=true]').find('li[cslid]').length, 0, description);

		description = "add to within macro 2 by the instance in macro 1";
		CSLEDIT_data.addNode(4, "last", new CSLEDIT_CslNode("newnode"));

		equal(styleTree.getMacroLinks().length, 2, "check macro links");
		
		description = "node 5 is a normal text node and shouldn't have children (after)";
		equal(styleTreeElement.
			find('li[cslid=5][macrolink!=true]').attr("rel"), "text", description);
		equal(styleTreeElement.
			find('li[cslid=5][macrolink!=true]').find('li[cslid]').length, 0, description);

		description = "check overall length";
		equal(styleTreeElement.find('li[cslid][macrolink!=true]').length, 12, description);
		equal(styleTreeElement.find('li[cslid][macrolink=true]').length, 6, description);

		equal(styleTreeElement.
			find('li[cslid=6][macrolink!=true]').attr("rel"), "macro", description);
		equal(styleTreeElement.
			find('li[cslid=6][macrolink!=true]').
			find('li[cslid=7][macrolink!=true]').attr("rel"), "label", description);
		equal(styleTreeElement.
			find('li[cslid=6][macrolink!=true]').
			find('li[cslid=8][macrolink!=true]').attr("rel"), "newnode", description);

		description = "check updated in citation/layout";
		equal(styleTreeElement.
			find('li[cslid=11][macrolink!=true]').attr('rel'), "text", description);
		equal(styleTreeElement.
			find('li[cslid=11][macrolink!=true]').
			find('li[cslid=4][macrolink=true]').attr("rel"), "text", description);
		equal(styleTreeElement.
			find('li[cslid=11][macrolink!=true]').
			find('li[cslid=4][macrolink=true]').
			find('li[cslid=8][macrolink=true]').attr("rel"), "newnode", description);
/*
		description = "delete label from macro2";
		CSLEDIT_data.deleteNode(7);

		description = "check updated in citation/layout";
		equal(styleTreeElement.
			find('li[cslid=10][macrolink!=true]').attr('rel'), "text", description);
		equal(styleTreeElement.
			find('li[cslid=10][macrolink!=true]').
			find('li[cslid=4][macrolink=true]').attr("rel"), "text", description);

		description = "newnode should have shifted back to 7";
		equal(styleTreeElement.
			find('li[cslid=10][macrolink!=true]').
			find('li[cslid=4][macrolink=true]').
			find('li[cslid=7][macrolink=true]').attr("rel"), "newnode", description);
*/
		start();
	};

	cslData = CSLEDIT_data.setCslCode (
		"<style>" +
		"<info><author></author></info>" +
		'<macro name="macro1"><text></text></macro>' +
		'<macro name="macro2"><label></label></macro>' +
		'<citation><layout><text macro="macro1"></text></layout></citation>' +
		"</style>");

	styleTree = CSLEDIT_SmartTree(styleTreeElement, ["style"], true);
	styleTree.setCallbacks({ loaded : treeLoaded });
	styleTree.setVerifyAllChanges(true);
	
	citationTree = CSLEDIT_SmartTree(treeElement, ["style/citation"], true);
	citationTree.setCallbacks({ loaded : treeLoaded });
	citationTree.setVerifyAllChanges(true);
	
	fakeViewController.addView(citationTree);
	fakeViewController.addView(styleTree);
	
	CSLEDIT_data.addViewController(fakeViewController);

	treesToLoad = 2;

	styleTree.createTree();
	citationTree.createTree();

});

asyncTest("move macro instance 1 from macro instance 2 to macro instance 3", function () {
	var cslData,
		citationTree,
		treeElement = $("<div></div>"),
		styleTreeElement = $("<div></div>"),
		styleTree,
		treesToLoad,
		newNode,
		description,
		fakeViewController = new CSLEDIT_FakeViewController();

	CSLEDIT_data = CSLEDIT_Data("CSLEDIT_test_cslData", []);

	var treeLoaded = function () {
		treesToLoad--;

		if (treesToLoad > 0) {
			return;
		}
		
		equal(styleTreeElement.find('li[cslid=0]').attr("rel"), "style");
		equal(styleTreeElement.find('li[cslid=3]').attr("rel"), "macro", "macro 1 def");
		equal(styleTreeElement.find('li[cslid=3]').find('li[cslid=4]').attr("rel"), "label");
		equal(styleTreeElement.find('li[cslid=5]').attr("rel"), "macro", "macro 2 def");
		equal(styleTreeElement.find('li[cslid=5]').find('li[cslid=6]').attr("rel"), "text", "macro 1 instance");
		equal(styleTreeElement.find('li[cslid=7]').attr("rel"), "macro", "macro 3 def");
		equal(styleTreeElement.find('li[cslid=8]').attr("rel"), "citation");
		equal(styleTreeElement.find('li[cslid=9]').attr("rel"), "layout");
		equal(styleTreeElement.find('li[cslid=10]').attr("rel"), "text", "macro2 instance");
		equal(styleTreeElement.find('li[cslid=10]').find('li[cslid=6][macrolink=true]').attr("rel"), "text");
		equal(styleTreeElement.find('li[cslid=10]').find('li[cslid=6][macrolink=true]').
		                                            find('li[cslid=4][macrolink=true]').attr("rel"), "label");
		equal(styleTreeElement.find('li[cslid=11]').attr("rel"), "text", "macro3 instance");
		
		equal(styleTree.getMacroLinks().length, 3, "check macro links");


		//CSLEDIT_data.moveNode(6, 11, 0);
		CSLEDIT_data.deleteNode(6);
		CSLEDIT_data.addNode(10, 0, new CSLEDIT_CslNode(
			"text", [{key:"macro", value:"macro1", enabled: "true"}]));
		
		equal(styleTree.getMacroLinks().length, 3, "check macro links");
		
		description = "macro 2 and 3 instances stay where they are";
		equal(styleTreeElement.find('li[cslid=10]').attr("rel"), "text", "macro2 instance");
		equal(styleTreeElement.find('li[cslid=11]').attr("rel"), "text", "macro3 instance");

		description = "macro 2 definition no longer has macro 1";
		equal(styleTreeElement.find('li[cslid=5]').find('li[cslid=6]').length, 0, description);

		description = "macro 3 definition now has macro 1";
		equal(styleTreeElement.find('li[cslid=6]').attr("rel"), "macro", description);
		equal(styleTreeElement.find('li[cslid=6]').find('li[cslid=7]').attr("rel"), "text", description);
		equal(styleTreeElement.find('li[cslid=6]').find('li[cslid=7]').
		                       find('li[cslid=4][macrolink=true]').attr("rel"), "label", description);

		description = "macro 2 instance no longer has macro 1";
		equal(styleTreeElement.find('li[cslid=10]').find('li[cslid=6]').length, 0, description);

		description = "macro 3 instance now has macro 1";
		equal(styleTreeElement.find('li[cslid=11]').
		                       find('li[cslid=7][macrolink=true]').attr("rel"), "text", description);
		equal(styleTreeElement.find('li[cslid=11]').
		                       find('li[cslid=7][macrolink=true]').
							   find('li[cslid=4][macrolink=true]').attr("rel"), "label", description);
		start();
	};

	cslData = CSLEDIT_data.setCslCode (
		"<style>" +
		"<info><author></author></info>" +
		'<macro name="macro1"><label></label></macro>' +
		'<macro name="macro2"><text macro="macro1"></text></macro>' +
		'<macro name="macro3"></macro>' +
		'<citation><layout>' +
		'<text macro="macro2"></text>' +
		'<text macro="macro3"></text>' +
		'</layout></citation>' +
		"</style>");

	styleTree = CSLEDIT_SmartTree(styleTreeElement, ["style"], true);
	styleTree.setCallbacks({ loaded : treeLoaded });
	styleTree.setVerifyAllChanges(true);
	
	citationTree = CSLEDIT_SmartTree(treeElement, ["style/citation"], true);
	citationTree.setCallbacks({ loaded : treeLoaded });
	citationTree.setVerifyAllChanges(true);
	
	fakeViewController.addView(citationTree);
	fakeViewController.addView(styleTree);
	
	CSLEDIT_data.addViewController(fakeViewController);

	treesToLoad = 2;

	styleTree.createTree();
	citationTree.createTree();

});

asyncTest("macros within macros on creation", function () {
	// testing the macro link functionality requires data to be in sync with
	// the view, since it's used for macro-name lookups

	var cslData,
		citationTree,
		treeElement = $("<div></div>"),
		styleTreeElement = $("<div></div>"),
		styleTree,
		treesToLoad,
		newNode,
		description,
		fakeViewController = new CSLEDIT_FakeViewController();

	CSLEDIT_data = CSLEDIT_Data("CSLEDIT_test_cslData", []);

	var treeLoaded = function () {
		treesToLoad--;

		if (treesToLoad > 0) {
			return;
		}
		
		equal(styleTreeElement.find('li[cslid=0]').attr("rel"), "style");
		equal(styleTreeElement.find('li[cslid=3]').attr("rel"), "macro");
		equal(styleTreeElement.find('li[cslid=4]').attr("rel"), "text");
		equal(styleTreeElement.find('li[cslid=5]').attr("rel"), "macro");
		equal(styleTreeElement.find('li[cslid=6]').attr("rel"), "group");
		equal(styleTreeElement.find('li[cslid=7]').attr("rel"), "label");
		equal(styleTreeElement.find('li[cslid=8]').attr("rel"), "citation");
		equal(styleTreeElement.find('li[cslid=9]').attr("rel"), "layout");
		equal(styleTreeElement.find('li[cslid=10]').attr("rel"), "text");
		equal(styleTreeElement.find('li[cslid=10]').find(
			'li[cslid=4][macrolink=true]').attr("rel"), "text");

		description = "macro1 should contain a macrolink to macro2";
		equal(styleTreeElement.find('li[cslid=4]').
			find('li[cslid=6][macrolink=true]').attr("rel"), "group", description);
		equal(styleTreeElement.find('li[cslid=4]').
			find('li[cslid=7][macrolink=true]').attr("rel"), "label", description);
		
		description = "citation/layout should contain a macrolink to macro1, " + 
			"and within that to macro2";
		equal(styleTreeElement.find('li[cslid=9]').
			find('li[cslid=4][macrolink=true]').attr("rel"), "text", description);
		equal(styleTreeElement.find('li[cslid=9]').
			find('li[cslid=4][macrolink=true]').
			find('li[cslid=7][macrolink=true]').attr("rel"), "label", description);

		description = "check overall length";
		equal(styleTreeElement.find('li[cslid][macrolink!=true]').length, 11, description);
		equal(styleTreeElement.find('li[cslid][macrolink=true]').length, 5, description);

		start();
	};

	cslData = CSLEDIT_data.setCslCode (
		"<style>" +
		"<info><author></author></info>" +
		'<macro name="macro1"><text macro="macro2"></text></macro>' +
		'<macro name="macro2"><group><label></label></group></macro>' +
		'<citation><layout><text macro="macro1"></text></layout></citation>' +
		"</style>");

	styleTree = CSLEDIT_SmartTree(styleTreeElement, ["style"], true);
	styleTree.setCallbacks({ loaded : treeLoaded });
	styleTree.setVerifyAllChanges(true);
	
	citationTree = CSLEDIT_SmartTree(treeElement, ["style/citation"], true);
	citationTree.setCallbacks({ loaded : treeLoaded });
	citationTree.setVerifyAllChanges(true);
	
	fakeViewController.addView(citationTree);
	fakeViewController.addView(styleTree);
	
	treesToLoad = 2;

	styleTree.createTree();
	citationTree.createTree();

});

