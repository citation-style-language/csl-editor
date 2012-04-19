CSLEDIT = CSLEDIT || {};

// Allows clients to:
// - broadcast events
// - subscribe to events
//
// ** Any action which affects the data should go through the controller **
// 
CSLEDIT.Controller = function () {
	var commandSubscribers = {
			"addNode" : [],
			"deleteNode" : [],
			"moveNode" : [],
			"ammendNode" : [],
			"setCslCode" : []
		},
		commandHistory = [];

	var addSubscriber = function (command, callback) {
		assert(command in commandSubscribers, "command doesn't exist");
		
		// note: we don't check whether the callback has already been added
		commandSubscribers[command].push(callback);
	};

	var exec = function (command, args) {
		var index;

		assert(command in commandSubscribers, "command doesn't exist");
		console.log("executing command " + command + "(" + JSON.stringify(args) + ")");
		commandHistory.push(command, args);

		for (index = 0; index < commandSubscribers[command].length; index++) {
			commandSubscribers[command][index].apply(null, args);
		}
	};

	return {
		addSubscriber : addSubscriber,
		exec : exec
	};
};

