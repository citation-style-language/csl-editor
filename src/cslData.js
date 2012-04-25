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
	var viewControllers = [],
		callbacksEnabled = true;

	var get = function () {
		return JSON.parse(localStorage.getItem(CSL_DATA));
	};
	var set = function (cslData) {
		localStorage.setItem(CSL_DATA, JSON.stringify(cslData));
		return cslData;
	};
	var setCslCode = function (cslCode) {
		return set(CSLEDIT.cslParser.cslDataFromCslCode(cslCode));
		if (callbacksEnabled) {
			emit("createTree", []);
		}
	};
	var getCslCode = function () {
		return CSLEDIT.cslParser.cslCodeFromCslData(get());
	};

	var spliceNode = function (id, position, nodesToDelete, newNode) {
		var iter,
			cslData,
			index,
			node,
			nodesBefore;

		cslData = get();

		nodesBefore = numNodes(cslData);

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

		return index - nodesBefore; // difference in number of nodes
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

	// Returns the first matching node in a depth first search or
	// null if it couldn't find a match
	var getNodesFromPath = function (path) {
		var splitPath = path.split("/"),
			rootNode,
			result = [];

		rootNode = splitPath.splice(0,1);

		if (rootNode[0] !== "style") {
			return result;
		}

		getNodesFromPath_inner(splitPath, get(), result);
		return result;
	};

	var getNodesFromPath_inner = function (path, nodeData, result) {
		var index,
			rootNode,
			regExp;

		if (path.length === 0) {
			result.push(nodeData);
			return;
		}

		rootNode = path.splice(0, 1);
		assertEqual(rootNode.length, 1);

		// convert '*' wildcard to regexp equivalent
		regExp = new RegExp(rootNode[0].replace("*", ".*"));

		for (index = 0; index < nodeData.children.length; index++) {
			if (regExp.test(nodeData.children[index].name)) {
				getNodesFromPath_inner(path, nodeData.children[index], result);
			}
		}
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

	var emit = function (event, args) {
		$.each(viewControllers, function(index, controller) {
			controller.exec(event, args);
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
			positionIndex,
			nodesAdded;
		newNode.cslId = -1;
		newNode.children = newNode.children || [];

		if (typeof position === "number") {
			nodesAdded = spliceNode(id, position, 0, newNode);
			emit("addNode", [id, position, newNode, nodesAdded]);
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
			parentNode,
			nodesDeleted;

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
		nodesDeleted = -spliceNode(parentNode.cslId, indexOfChild(node, parentNode), 1);
		assertEqual(node.cslId, id);
		
		emit("deleteNode", [id, nodesDeleted]);
		
		return node;
	};

	return {
		setCslCode : setCslCode,
		getCslCode : getCslCode,
		get : get,
		addNode : function (id, position, newNode) {
			addNode(id, position, newNode);
			emit("formatCitations");
		},
		deleteNode : function (id) {
			deleteNode(id);
			emit("formatCitations");
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
				index++;
			}
			set(cslData);
			emit("formatCitations");
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

			emit("formatCitations");
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
		setViewController : function (_viewController) {
			viewControllers.push(_viewController);
		},
		getNodesFromPath : getNodesFromPath
	};
};

// global instance, this is overwritten for unit tests
CSLEDIT.data = CSLEDIT.Data("CSLEDIT.cslData");
