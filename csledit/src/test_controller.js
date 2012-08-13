"use strict";

define(['src/controller', 'src/cslData', 'jquery.qunit'], function (CSLEDIT_controller, CSLEDIT_data) {
	module("CSLEDIT_controller", {
		setup : function () {
			CSLEDIT_controller.clearHistory();

			// TODO: use different localStorage key for data unittests
			//CSLEDIT_data = new CSLEDIT_Data("CSLEDIT_test_cslData");
		}
	});

	test("cslData must contain all the commands", function () {
		raises( function () {
			CSLEDIT_controller.setCslData({});
		});
	});

	test("can only call actual commands and macros", function () {
		CSLEDIT_controller.setCslData(CSLEDIT_data);

		CSLEDIT_controller.setCslData({
			addNode : function () {},
			deleteNode : function () {},
			moveNode : function () {},
			amendNode : function () {},
			setCslCode : function () {},
		});

		CSLEDIT_controller.exec("addNode");

		raises( function () {
			CSLEDIT_controller.exec("noSuchCommand");
		});
	});
			
	test("test exec", function () {
		var temp;

		var addToTemp = function (increment1, increment2) {
			temp += increment1 + increment2;
		};

		temp = 3;
		CSLEDIT_controller.setCslData({
			addNode : addToTemp,
			deleteNode : function () {},
			moveNode : function () {},
			amendNode : function () {},
			setCslCode : function () {},
		});

		CSLEDIT_controller.exec("addNode", [4, 5]);
		equal(temp, 12);
	});

	test("undo / redo", function () {
		// undo requires CSLEDIT_data to return the inverse function
		// for every function that's called

		var lastCommand;

		CSLEDIT_controller.setCslData({
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

		CSLEDIT_controller.exec("addNode", [1]);
		equal(lastCommand, "addNode(1)");
		CSLEDIT_controller.exec("addNode", [2]);
		equal(lastCommand, "addNode(2)");

		// the view can do this check to see if undo is possible
		equal(CSLEDIT_controller.commandHistory.length, 2);

		CSLEDIT_controller.undo();
		equal(lastCommand, "deleteNode(2)");
		CSLEDIT_controller.undo();
		equal(lastCommand, "deleteNode(1)");

		// nothing more to undo
		equal(CSLEDIT_controller.commandHistory.length, 0, "no more undos left");

		// the view can do this check to see if redo is possible
		equal(CSLEDIT_controller.undoCommandHistory.length, 2, "2 redos possible");
		CSLEDIT_controller.redo();
		equal(lastCommand, "addNode(1)", "redo performed: addNode(1)");

		// one more redo possible
		equal(CSLEDIT_controller.undoCommandHistory.length, 1, "1 redo possible");

		// perfoming any new command resets the undoCommandHistory
		CSLEDIT_controller.exec("addNode", [4]);

		// no redos allowed (need to undo again first)
		equal(CSLEDIT_controller.undoCommandHistory.length, 0, "no more redos");
	});
});
