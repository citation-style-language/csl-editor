CSLEDIT = CSLEDIT || {};

// Allows clients to:
// - broadcast events
// - subscribe to events
//
// ** Any action which affects the data should go through the controller **
// 
CSLEDIT.controller = (function () {
	var commandSubscribers = {
			"addNode" : [],
			"deleteNode" : [],
			"moveNode" : [],
			"amendNode" : [],
			"setCslCode" : []
		},
		commandHistory = [];

	var addSubscriber = function (command, callback) {
		assert(command in commandSubscribers, "command doesn't exist");
		
		// note: we don't check whether the callback has already been added
		commandSubscribers[command].push(callback);
	};

	var subscribeToAllCommands = function (object) {
		$.each(commandSubscribers, function (k, v) {
			assert(typeof object[k] === "function", "function " + k + " doesn't exist in subscriber");
		});

		$.each(commandSubscribers, function (k, v) {
			v.push(object[k]);
		});
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

	var exec = function (command, args) {
		var index;

		assert(command in commandSubscribers || command in macros, "command doesn't exist");
		console.log("executing command " + command + "(" + JSON.stringify(args) + ")");
		commandHistory.push(command, args);

		if (command in macros) {
			macros[command].apply(null, args);
		} else {
			_exec(command, args);
		}
	};

	var _exec = function(command, args) {
		for (index = 0; index < commandSubscribers[command].length; index++) {
			commandSubscribers[command][index].apply(null, args);
		}
	};

	return {
		addSubscriber : addSubscriber,
		subscribeToAllCommands : subscribeToAllCommands,
		exec : exec,
		commandHistory : commandHistory
	};
}());

