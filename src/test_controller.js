module("CSLEDIT.controller");

test("can only subscribe to actual events", function () {
	var testController = CSLEDIT.Controller();

	raises( function () {
		testController.addSubscriber("noSuchCommand", function (){} );
	});
	raises( function () {
		testController.exec("noSuchCommand", []);
	});
	
	testController.addSubscriber("addNode", function (){} );
	testController.exec("addNode", [] );
});
		
test("test subscribe to controller", function () {
	var testController = CSLEDIT.Controller(),
		temp,
		temp2;

	var addToTemp = function (increment1, increment2) {
		temp += increment1 + increment2;
	};

	temp = 3;
	testController.addSubscriber("addNode", addToTemp);
	testController.exec("addNode", [4, 5]);
	equal(temp, 12);

	// it's allowed to add duplicate subscribers, they'll get called multiple times
	temp = 3
	testController.addSubscriber("addNode", addToTemp);
	testController.exec("addNode", [4, 5]);
	equal(temp, 21, "duplicate subscriber");

	// add a different anonymous function
	temp = 3;
	temp2 = 3;
	testController.addSubscriber("addNode", function (a, b) {temp2 += a - b});
	testController.exec("addNode", [6, 1]);
	equal(temp, 17, "multiple subscribers");
	equal(temp2, 8, "multiple subscribers");	
});

test("test subscribe to all", function () {
	var testController = CSLEDIT.Controller(),
		invalidSubscriber,
		subscriber,
		temp = 0;

	subscriber = {
		addNode : function () {},
		deleteNode : function () {},
		moveNode : function () {},
		ammendNode : function () {},
		shiftCslIds : function () {},
		setCslCode : 5
	};

	// setCslCode isn't a function, so throw error
	raises( function () {
		testController.subscribeToAllCommands(subscriber);
	});

	// test simple dummy command 
	subscriber.setCslCode = function () { temp++; };
	testController.subscribeToAllCommands(subscriber);
	testController.exec("setCslCode", []);
	equal(temp, 1);
});
