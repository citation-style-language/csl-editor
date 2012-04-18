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
	
	iterator = CSLEDIT.Iterator(testTree);

	id = 0;
	while (iterator.hasNext()) {
		equal(iterator.next().id, id);

		switch (id) {
			case 0:
				equal(iterator.parent(), null);
				break;
			case 1:
				equal(iterator.parent().id, 0);
				break;
			case 2:
				equal(iterator.parent().id, 0);
				break;
			case 3:
				equal(iterator.parent().id, 2);
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
