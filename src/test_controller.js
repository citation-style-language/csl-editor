"use strict";

module("CSLEDIT.controller", {
	setup : function () {
		CSLEDIT.controller.clearHistory();
		CSLEDIT.data = new CSLEDIT.Data("CSLEDIT.test_cslData");
	}
});

test("cslData must contain all the commands", function () {
	raises( function () {
		CSLEDIT.controller.setCslData({});
	});
});

test("can only call actual commands and macros", function () {
	CSLEDIT.controller.setCslData(CSLEDIT.data);

	CSLEDIT.controller.setCslData({
		addNode : function () {},
		deleteNode : function () {},
		moveNode : function () {},
		amendNode : function () {},
		setCslCode : function () {},
	});

	CSLEDIT.controller.exec("addNode");

	raises( function () {
		CSLEDIT.controller.exec("noSuchCommand");
	});
});
		
test("test exec", function () {
	var temp;

	var addToTemp = function (increment1, increment2) {
		temp += increment1 + increment2;
	};

	temp = 3;
	CSLEDIT.controller.setCslData({
		addNode : addToTemp,
		deleteNode : function () {},
		moveNode : function () {},
		amendNode : function () {},
		setCslCode : function () {},
	});

	CSLEDIT.controller.exec("addNode", [4, 5]);
	equal(temp, 12);
});

test("undo / redo", function () {
	// undo requires CSLEDIT.data to return the inverse function
	// for every function that's called

	var lastCommand;

	CSLEDIT.controller.setCslData({
		addNode : function (arg) {
			lastCommand = "addNode(" + arg + ")";
			// return inverse of addNode(id)
			return {
				command : "deleteNode",
				args : [arg]
			}
		},
		deleteNode : function (arg) {
			lastCommand = "deleteNode(" + arg + ")";
			// return inverse
			return {
				command : "addNode",
				args : [arg]
			}
		},
		moveNode : function () {},
		amendNode : function () {},
		setCslCode : function () {},
	});

	CSLEDIT.controller.exec("addNode", [1]);
	equal(lastCommand, "addNode(1)");
	CSLEDIT.controller.exec("addNode", [2]);
	equal(lastCommand, "addNode(2)");

	// the view can do this check to see if undo is possible
	equal(CSLEDIT.controller.commandHistory.length, 2);

	CSLEDIT.controller.undo();
	equal(lastCommand, "deleteNode(2)");
	CSLEDIT.controller.undo();
	equal(lastCommand, "deleteNode(1)");

	// nothing more to undo
	equal(CSLEDIT.controller.commandHistory.length, 0, "no more undos left");

	// the view can do this check to see if redo is possible
	equal(CSLEDIT.controller.undoCommandHistory.length, 2, "2 redos possible");
	CSLEDIT.controller.redo();
	equal(lastCommand, "addNode(1)", "redo performed: addNode(1)");

	// one more redo possible
	equal(CSLEDIT.controller.undoCommandHistory.length, 1, "1 redo possible");

	// perfoming any new command resets the undoCommandHistory
	CSLEDIT.controller.exec("addNode", [4]);

	// no redos allowed (need to undo again first)
	equal(CSLEDIT.controller.undoCommandHistory.length, 0, "no more redos");
});
