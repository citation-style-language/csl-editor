"use strict";

module("CSLEDIT.controller", {
	setup : function () {
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

test("undo", function () {
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
		},
		moveNode : function () {},
		amendNode : function () {},
		setCslCode : function () {},
	});

	CSLEDIT.controller.exec("addNode", [1]);
	equal(lastCommand, "addNode(1)");
	CSLEDIT.controller.exec("addNode", [2]);
	equal(lastCommand, "addNode(2)");

	CSLEDIT.controller.undo();
	equal(lastCommand, "deleteNode(2)");
	CSLEDIT.controller.undo();
	equal(lastCommand, "deleteNode(1)");

	equal(CSLEDIT.controller.commandHistory.length, 0);
});
