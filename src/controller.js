"use strict";

// Sends commands to the CSLEDIT_Data, and maintains the command history used by
// the undo function.
//
// The CSLEDIT_controller allows you to issue commands which alter the current
// CSL style, to do this you use the CSLEDIT_controller.exec() function, passing 
// the name of the CSLEDIT_Data function you want to call as argument 1, and the
// list of arguments to that CSLEDIT_Data function as argument 2. The list of 
// functions it's intended to execute are defined below in 'commands'.
//
// **If the controller is being used, any action which affects CSLEDIT_data
//   needs to be done using the controller**
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

	// Sets the CSL_Data instance to:
	//
	// - issue commands to
	// - get information about the current CSL style
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

	// Perform the inverse of the previous command
	//
	// Check that commandHistory is not empty before calling this
	var undo = function () {
		var command = commandHistory.pop();

		_exec(command.inverse.command, command.inverse.args, undoCommandHistory);
	};

	// Perform the inverse of the previous undo action
	//
	// Check that undoCommandHistory is not empty before calling this
	var redo = function () {
		var command = undoCommandHistory.pop();

		_exec(command.inverse.command, command.inverse.args, commandHistory);
	};

	// Issue the given command with the given arguments to the CSLEDIT_Data instance
	//
	// If silent is not true, it will display an error dialog
	var exec = function (command, args, silent /* optional, default is false */) {
		var result;

		undoCommandHistory.length = 0;
		if (command in macros) {
			result = macros[command].apply(null, args);
		} else {
			debug.assert(commands.indexOf(command) !== -1, "command doesn't exist");
			result = _exec(command, args, commandHistory);
		}
		
		if (silent !== true && "error" in result) {
			alert(result.error.message);
		}

		return result;
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
