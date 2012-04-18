var CSLEDIT = CSLEDIT || {};

/* Uses localStorage to store current csl data object
 *
 * Supports the following actions:
 * - New style
 * - Load from CSL XML
 * - Add node
 * - Delete node
 * - Ammend node
 */

CSLEDIT.Data = function (CSL_DATA) {
	var get = function () {
		return JSON.parse(localStorage.getItem(CSL_DATA));
	};
	var set = function (cslData) {
		return localStorage.setItem(CSL_DATA, JSON.stringify(cslData));
	};
	var setCslCode = function (cslCode) {
		set(CSLEDIT.cslParser.cslDataFromCslCode(cslCode));
	};

	var addNode = function (id, nodeData) {
		var iter,
			cslData,
			index,
			node;

		nodeData.cslId = -1;

		cslData = get();

		// Find the id of the node to add
		iter = CSLEDIT.Iterator(cslData);

		index = 0;
		while (iter.hasNext()) {
			node = iter.next();
			
			if (index === id) {
				assertEqual(node.cslId, index);
				node.children.push(nodeData);
			} else if (index > id) {
				assertEqual(node.cslId + 1, index);
				node.cslId++;
			}
			index++;
		}

		set(cslData);
	};

	return {
		setCslCode : setCslCode,
		get : get,
		addNode : addNode
	};
};

// not using anonymous function to create
CSLEDIT.data = CSLEDIT.Data("CSLEDIT.cslData");
