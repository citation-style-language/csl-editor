"use strict";

// Sends commands to the data module, and maintains the command history used by
// the undo function
//
// ** Any action which affects the data should go through the controller **
// 
define(['src/cslData', 'src/debug'], function (CSLEDIT_data, debug) {
	var commands = [
			"addNode",
			"deleteNode",
			"moveNode",
			"amendNode",
			"setCslCode"
		],
		commandHistory = [],
		undoCommandHistory = [],
		cslData;

	var setCslData = function (_cslData) {
		$.each(commands, function (index, command) {
			debug.assertEqual(typeof _cslData[command], "function", "cslData must contain: " + command);
		});
		
		cslData = _cslData;
	};

	// These can be called like regular commands, but can't be subscribed to.
	// They use the regular commands to perform more complicated tasks.
	var macros = {
		addPath : function ( path ) {
			var splitPath = path.split("/"),
				index,
				currentPath = "",
				nodes,
				parentCslId;

			for (index = 0; index < splitPath.length; index++) {
				if (index > 0) {
					currentPath += "/";
				}
				currentPath += splitPath[index];
				nodes = CSLEDIT_data.getNodesFromPath(currentPath)
				if (nodes.length === 0) {
					if (index === 0) {
						// add root node
						_exec("addNode", [0, "before", {name: splitPath[index]}], commandHistory);
						parentCslId = 0;
					} else {
						_exec("addNode",
							[parentCslId, "first", {name: splitPath[index]}], commandHistory);
						parentCslId++;
					}
				} else {
					parentCslId = nodes[0].cslId;
				}
			}
		}
	};

	var undo = function () {
		var command = commandHistory.pop();

		_exec(command.inverse.command, command.inverse.args, undoCommandHistory);
	};

	var redo = function () {
		var command = undoCommandHistory.pop();

		_exec(command.inverse.command, command.inverse.args, commandHistory);
	};

	var exec = function (command, args) {
		undoCommandHistory.length = 0;
		if (command in macros) {
			macros[command].apply(null, args);
		} else {
			debug.assert(commands.indexOf(command) !== -1, "command doesn't exist");
			_exec(command, args, commandHistory);
		}
	};

	var _exec = function(command, args, history) {
		var inverseCommand;

		debug.log("executing command " + command + "(" + JSON.stringify(args) + ")");
		inverseCommand = cslData[command].apply(null, args);
		
		if (typeof inverseCommand !== "undefined" && inverseCommand.hasOwnProperty("error")) {
			alert(inverseCommand.error);
			return;
		}

		if (command === "setCslCode") {
			// no undo available for this yet, wipe command history
			history.length = 0;
		} else {
			history.push({command:command, args:args, inverse:inverseCommand});
		}
	};

	return {
		setCslData : setCslData,
		exec : exec,
		commandHistory : commandHistory,
		undoCommandHistory : undoCommandHistory,
		undo : undo,
		redo : redo,
		clearHistory : function () {
			commandHistory.length = 0;
		}
	};
});
