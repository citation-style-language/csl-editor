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
	var onChangedCallbacks = [],
		callbacksEnabled = true;

	var get = function () {
		return JSON.parse(localStorage.getItem(CSL_DATA));
	};
	var set = function (cslData) {
		localStorage.setItem(CSL_DATA, JSON.stringify(cslData));
		if (callbacksEnabled) {
			changed();
		}
		return cslData;
	};
	var setCslCode = function (cslCode) {
		return set(CSLEDIT.cslParser.cslDataFromCslCode(cslCode));
	};
	var getCslCode = function () {
		return CSLEDIT.cslParser.cslCodeFromCslData(get());
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

	var getNodeAndParent = function (id) {
		var iter = CSLEDIT.Iterator(get()),
			node;

		while (iter.hasNext()) {
			node = iter.next();

			if (node.cslId === id) {
				return {
					node : node,
					parent : iter.parent()
				}
			}
		}

		// not found
		return { node : null, parent : null };
	};

	var getNode = function (id) {
		return getNodeAndParent(id).node;
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
	
	// Load new style without reloading page
	var loadStyleFromURL = function (newURL, callback) {
		styleURL = newURL;
		$.get(styleURL, {}, function(cslCode) {
			cslCode = cslCode.replace(/<!--.*?-->/g, "");
			console.log("loaded style from " + styleURL);
			setCslCode(cslCode);
			if (typeof callback !== "undefined") {
				callback();
			}
		});
	};

	// from https://gist.github.com/1771618
	var getUrlVar = function (key) {
		var result = new RegExp(key + "=([^&]*)", "i").exec(window.location.search); 
		return result && unescape(result[1]) || "";
	};

	var numNodes = function (tree) {
		var iter = CSLEDIT.Iterator(tree),
			index = 0;

		while (iter.hasNext()) {
			iter.next();
			index++;
		}

		return index;
	};

	var changed = function () {
		$.each(onChangedCallbacks, function(index, callback) {
			callback();
		});
	};
	
	var indexOfChild = function (childNode, parentNode) {
		var index;
		for (index = 0; index < parentNode.children.length; index++) {
			if (childNode.cslId === parentNode.children[index].cslId) {
				return index;
			}
		}
		return -1;
	};

	var addNode = function (id, position, newNode) {
		var nodeInfo,
			positionIndex;
		newNode.cslId = -1;
		newNode.children = newNode.children || [];

		if (typeof position === "number") {
			spliceNode(id, position, 0, newNode);
		} else {
			switch (position) {
				case "first":
					return addNode(id, 0, newNode);
					break;
				case "inside":
				case "last":
					return addNode(id, getNode(id).children.length, newNode);
					break;
				case "before":
				case "after":
					assert(id !== 0);
					nodeInfo = getNodeAndParent(id);
					positionIndex = indexOfChild(nodeInfo.node, nodeInfo.parent);
					if (position === "after") {
						positionIndex++;
					}
					return addNode(nodeInfo.parent.cslId, positionIndex, newNode);
					break;
				case "default":
					assert(false, "position: " + position + " not recognised");
			}
		}
	};

	var deleteNode = function (id) {
		var iter = CSLEDIT.Iterator(get()),
			index,
			node,
			parentNode;

		assert(id !== 0); // can't delete the style node

		index = 0;
		while (iter.hasNext()) {
			node = iter.next();

			if (index === id) {
				parentNode = iter.parent();
				break;
			}
			index++;
		}

		assert(typeof parentNode !== "undefined");
		spliceNode(parentNode.cslId, indexOfChild(node, parentNode), 1);

		assertEqual(node.cslId, id);
		return node;
	};

	return {
		setCslCode : setCslCode,
		getCslCode : getCslCode,
		get : get,
		addNode : addNode,
		deleteNode : deleteNode,

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
				index++;
			}
			set(cslData);
		},
		moveNode : function (fromId, toId, position) {
			var deletedNode;
			callbacksEnabled = false;

			assert(typeof position !== "number");

			deletedNode = deleteNode(fromId);

			if (toId > fromId) {
				toId -= numNodes(deletedNode);
			}

			addNode(toId, position, deletedNode);
			callbacksEnabled = true;
			changed();
		},
		getNode : getNode,
		getNodeAndParent : getNodeAndParent,
		getFirstCslId : getFirstCslId,

		loadStyleFromURL : loadStyleFromURL,

		initPageStyle : function (callback) {
			var cslData;
			cslData = get(); 
			/*
			if (cslData !== null && cslData !== "" && !CSLEDIT.parser.isCslValid(cslCode)) {
				alert("Warning: couldn't recover CSL from previous session");
				cslCode = "";
				CSLEDIT.code.set(cslCode);
			}*/
			styleURL = getUrlVar("styleURL");
			console.log("url from url: " + styleURL);

			if (styleURL != "" && typeof styleURL !== 'undefined') {
				console.log("loading given URL");
				styleURL = "../getFromOtherWebsite.php?url=" + encodeURIComponent(styleURL);
				loadStyleFromURL(styleURL, callback);
			} else if (cslData !== null && cslData !== "") {
				console.log("loading previous style");
				callback();
			} else {
				console.log("loading default style - apa.csl");
				styleURL = "../external/csl-styles/apa.csl";
				loadStyleFromURL(styleURL, callback);
			}
		},
		numCslNodes : function () { return numNodes(get()); },
		onChanged : function (callback) {
			onChangedCallbacks.push(callback);
		}
	};
};

// global instance, this is overwritten for unit tests
CSLEDIT.data = CSLEDIT.Data("CSLEDIT.cslData");
