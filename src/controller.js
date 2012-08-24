"use strict";

// Sends commands to the data module, and maintains the command history used by
// the undo function
//
// ** Any action which affects the data should go through the controller **
// 
define(['src/dataInstance', 'src/debug'], function (CSLEDIT_data, debug) {
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

	// set the default data instance (can be changed by the unit tests):
	setCslData(CSLEDIT_data);

	// These can be called like regular commands, but can't be subscribed to.
	// They use the regular commands to perform more complicated tasks.
	var macros = {
		addPath : function ( path ) {
			var splitPath = path.split("/"),
				index,
				currentPath = "",
				nodes,
				parentCslId,
				result,
				errors = [];

			for (index = 0; index < splitPath.length; index++) {
				if (index > 0) {
					currentPath += "/";
				}
				currentPath += splitPath[index];
				nodes = cslData.getNodesFromPath(currentPath)
				if (nodes.length === 0) {
					if (index === 0) {
						// add root node
						result = _exec("addNode", [0, "before", {name: splitPath[index]}], commandHistory);
						if ("error" in result) {
							errors.push(result.error);
						}
						parentCslId = 0;
					} else {
						result = _exec("addNode",
							[parentCslId, "first", {name: splitPath[index]}], commandHistory);
						if ("error" in result) {
							errors.push(result.error);
						}
						parentCslId++;
					}
				} else {
					parentCslId = nodes[0].cslId;
				}
			}

			if (errors.length > 0) {
				return {
					error:
					{
						type: "macroError",
						message: "These errors occurred: " + JSON.stringify(errors)
					}
				};
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
			return macros[command].apply(null, args);
		} else {
			debug.assert(commands.indexOf(command) !== -1, "command doesn't exist");
			return _exec(command, args, commandHistory);
		}
	};

	var _exec = function(command, args, history) {
		var inverseCommand;

		debug.log("executing command " + command + "(" + JSON.stringify(args) + ")");
		inverseCommand = cslData[command].apply(null, args);
		
		if (typeof inverseCommand !== "undefined" && inverseCommand.hasOwnProperty("error")) {
			return inverseCommand;
		}

		if (command === "setCslCode") {
			// no undo available for this yet, wipe command history
			history.length = 0;
		} else {
			history.push({command:command, args:args, inverse:inverseCommand});
		}
		return {};
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
