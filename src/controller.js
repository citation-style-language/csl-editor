"use strict";

CSLEDIT = CSLEDIT || {};

// Sends commands to the data module, and maintains the command history used by
// the undo function
//
// ** Any action which affects the data should go through the controller **
// 
CSLEDIT.controller = (function () {
	var commands = [
			"addNode",
			"deleteNode",
			"moveNode",
			"amendNode",
			"setCslCode"
		],
		commandHistory = [],
		cslData;

	var setCslData = function (_cslData) {
		$.each(commands, function (index, command) {
			assertEqual(typeof _cslData[command], "function", "cslData must contain: " + command);
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
				nodes = CSLEDIT.data.getNodesFromPath(currentPath)
				if (nodes.length === 0) {
					if (index === 0) {
						// add root node
						_exec("addNode", [0, "before", {name: splitPath[index]}]);
						parentCslId = 0;
					} else {
						_exec("addNode",
							[parentCslId, "first", {name: splitPath[index]}]);
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

		cslData[command.inverse.command].apply(null, command.inverse.args);
	};

	var exec = function (command, args) {
		if (command in macros) {
			macros[command].apply(null, args);
		} else {
			assert(commands.indexOf(command) !== -1, "command doesn't exist");
			_exec(command, args);
		}
	};

	var _exec = function(command, args) {
		var inverseCommand;

		console.log("executing command " + command + "(" + JSON.stringify(args) + ")");
		inverseCommand = cslData[command].apply(null, args);
		
		if (command === "setCslCode") {
			// no undo available for this yet, wipe command history
			commandHistory = [];
		} else {
			commandHistory.push({command:command, args:args, inverse:inverseCommand});
		}
	};

	return {
		setCslData : setCslData,
		exec : exec,
		commandHistory : commandHistory,
		undo : undo,
		clearHistory : function () {
			commandHistory = [];
		}
	};
}());

