module("CSLEDIT.controller");

test("can only subscribe to actual events", function () {
	raises( function () {
		CSLEDIT.controller.addSubscriber("noSuchCommand", function (){} );
	});
	
	CSLEDIT.controller.addSubscriber("addNode", function (){} );
});

test("can only call actual commands and macros", function () {
	raises(function () {
		CSLEDIT.controller.exec("fakeCommand", [] );
	});

	CSLEDIT.controller.exec("addNode", [] );
	CSLEDIT.controller.exec("addPath", ["style"] );
});
		
test("test subscribe to controller", function () {
	var temp,
		temp2;

	var addToTemp = function (increment1, increment2) {
		temp += increment1 + increment2;
	};

	temp = 3;
	CSLEDIT.controller.addSubscriber("addNode", addToTemp);
	CSLEDIT.controller.exec("addNode", [4, 5]);
	equal(temp, 12);

	// it's allowed to add duplicate subscribers, they'll get called multiple times
	temp = 3
	CSLEDIT.controller.addSubscriber("addNode", addToTemp);
	CSLEDIT.controller.exec("addNode", [4, 5]);
	equal(temp, 21, "duplicate subscriber");

	// add a different anonymous function
	temp = 3;
	temp2 = 3;
	CSLEDIT.controller.addSubscriber("addNode", function (a, b) {temp2 += a - b});
	CSLEDIT.controller.exec("addNode", [6, 1]);
	equal(temp, 17, "multiple subscribers");
	equal(temp2, 8, "multiple subscribers");	
});

test("test subscribe to all", function () {
	var invalidSubscriber,
		subscriber,
		temp = 0;

	subscriber = {
		addNode : function () {},
		deleteNode : function () {},
		moveNode : function () {},
		amendNode : function () {},
		shiftCslIds : function () {},
		setCslCode : 5
	};

	// setCslCode isn't a function, so throw error
	raises( function () {
		CSLEDIT.controller.subscribeToAllCommands(subscriber);
	});

	// test simple dummy command 
	subscriber.setCslCode = function () { temp++; };
	CSLEDIT.controller.subscribeToAllCommands(subscriber);
	CSLEDIT.controller.exec("setCslCode", []);
	equal(temp, 1);
});
