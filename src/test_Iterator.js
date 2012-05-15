"use strict";

module("CSLEDIT.Iterator");

test("iterate tree", function () {
	var testTree,
   		iterator,
		id;

	testTree = {
		id : 0,
		children : [
			{ id : 1, children : []	},
			{
				id : 2,
				children : [
					{id : 3, children : []},
					{id : 4, children : []}
				]
			},
			{ id : 5, children : [] }
		]	
	}
	
	iterator = new CSLEDIT.Iterator(testTree);

	id = 0;
	while (iterator.hasNext()) {
		equal(iterator.next().id, id, "check node " + id);

		switch (id) {
			case 0:
				equal(iterator.parent(), null, "node 0 has no parent");
				break;
			case 1:
				equal(iterator.parent().id, 0, "parent of 1 is 0");
				break;
			case 2:
				equal(iterator.parent().id, 0);
				break;
			case 3:
				equal(iterator.parent().id, 2);
				equal(iterator.stack()[0].id, 0, "node stack");
				equal(iterator.stack()[1].id, 2, "node stack");
				equal(iterator.stack()[2].id, 3, "node stack");
				break;
			case 4:
				equal(iterator.parent().id, 2);
				break;
			case 5:
				equal(iterator.parent().id, 0);
				break;
		}

		id++;
	}
});
