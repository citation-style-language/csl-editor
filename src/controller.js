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
		commandHistory = [],
		execStackDepth = 0,
		refreshCitationsCallback,
		refreshQueued = false;

	var addSubscriber = function (command, callback) {
		assert(command in commandSubscribers, "command doesn't exist");
		
		// note: we don't check whether the callback has already been added
		commandSubscribers[command].push(callback);
	};

	var exec = function (command, args) {
		var index;

		execStackDepth++;

		assert(command in commandSubscribers, "command doesn't exist");
		console.log("executing command " + command + "(" + JSON.stringify(args) + ")");
		commandHistory.push(command, args);

		for (index = 0; index < commandSubscribers[command].length; index++) {
			commandSubscribers[command][index].apply(null, args);
		}

		execStackDepth--;

		if (execStackDepth === 0 && refreshQueued) {
			refreshQueued = false;
			refreshCitationsCallback();
		}
	};

	return {
		addSubscriber : addSubscriber,
		exec : exec,

		// This callback is used to avoid re-calculating the example citations
		// until all subscribers have been informed of the recent change
		setRefreshCitationsCallback : function (callback) {
			refreshCitationsCallback = callback;
		},
		refreshWhenReady : function () {
			console.log("refresh when ready. stack depth = " + execStackDepth);
			if (execStackDepth > 0) {
				refreshQueued = true;
			} else {
				refreshCitationsCallback();
			}
		}
	};
};

