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
		localStorage.setItem(CSL_DATA, JSON.stringify(cslData));
		return cslData;
	};
	var setCslCode = function (cslCode) {
		return set(CSLEDIT.cslParser.cslDataFromCslCode(cslCode));
	};

	var spliceNode = function (id, position, nodesToDelete, newNode) {
		var iter,
			cslData,
			index,
			node;

		cslData = get();

		// Find the id of the node to add
		iter = CSLEDIT.Iterator(cslData);

		index = 0;
		while (iter.hasNext()) {
			node = iter.next();
			
			if (index === id) {
				assertEqual(node.cslId, index);
				assert(position + nodesToDelete <= node.children.length);

				if (typeof newNode === "undefined") {
					node.children.splice(position, nodesToDelete);
				} else {
					node.children.splice(position, nodesToDelete, newNode);
				}
				break;
			}
			index++;
		}

		// correct the cslId numbering
		iter = CSLEDIT.Iterator(cslData);
		index = 0;
		while (iter.hasNext()) {
			node = iter.next();
			node.cslId = index;
			index++;
		}

		set(cslData);
	};

	var getNode = function (id) {
		var iter = CSLEDIT.Iterator(cslData),
			node;

		while (iter.hasNext()) {
			node = iter.next();

			if (node.cslId === id) {
				return node;
			}
		}

		// not found
		return null;
	};

	var getFirstCslId = function (cslData, nodeName) {
		var index,
			result;

		if (cslData.name === nodeName) {
			return cslData.cslId;
		} else {
			for (index = 0; index < cslData.children.length; index++) {
				result = getFirstCslId(cslData.children[index], nodeName);
				if (result > -1) {
					return result;
				}
			}
		}
		// couldn't find it
		return -1;
	};

	return {
		setCslCode : setCslCode,
		get : get,
		addNode : function (id, position, newNode) {
			newNode.cslId = -1;
			newNode.children = newNode.children || [];

			spliceNode(id, position, 0, newNode);
		},
		deleteNode : function (id) {
			var iter = CSLEDIT.Iterator(get()),
				index,
				node,
				parentId;

			assert(id !== 0); // can't delete the style node

			index = 0;
			while (iter.hasNext()) {
				node = iter.next();

				if (index === id) {
					parentId = iter.parent().cslId;
					break;
				}
				index++;
			}

			assert(typeof parentId !== "undefined");

			spliceNode(parentId, id - parentId - 1, 1);
		},
		ammendNode : function (id, ammendedNode) {
			// replace everything of the original node except the children and the cslId
			var cslData = get(),
				iter,
				node,
				index;
		   
			iter = CSLEDIT.Iterator(cslData);
			index = 0;

			while (iter.hasNext()) {
				node = iter.next();
				if (index === id) {
					assertEqual(node.cslId, id);

					node.name = ammendedNode.name;
					node.attributes = ammendedNode.attributes;
					node.textValue = ammendedNode.textValue;

					break;
				}
			}
			set(cslData);
		},
		getNode : getNode,
		getFirstCslId : getFirstCslId
	};
};

// global instance, this is overwritten for unit tests
CSLEDIT.data = CSLEDIT.Data("CSLEDIT.cslData");
