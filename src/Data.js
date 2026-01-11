"use strict";

// Uses CSLEDIT_storage to store the current csl style
//
// Supports the following actions:
// 
// - New style
// - Load from CSL XML
// - Add node
// - Delete node
// - Amend node
// - Move node

define([	'src/uiConfig', // TODO: remove this dependency
			'src/CslNode',
			'src/Iterator',
			'src/cslParser',
			'src/storage',
			'src/options',
			'src/urlUtils',
			'src/cslStyles',
			'src/debug'
		],
		function (
			CSLEDIT_uiConfig,
			CSLEDIT_CslNode,
			CSLEDIT_Iterator,
			CSLEDIT_cslParser,
			CSLEDIT_storage,
			CSLEDIT_options,
			CSLEDIT_urlUtils,
			CSLEDIT_cslStyles,
			debug
		) {
	return function (CSL_DATA, _requiredNodes /*optional*/, updateTime /*optional*/) {
		var viewControllers = [],
			callbacksEnabled = true,
			requiredNodes = _requiredNodes || [],
			
			// TODO: decide better place to put styleInfoOrder.
			//       Maybe add this general functionality to the schema for
			//       other nodes too and place the hard-coded list(s) in schemaOptions.
			//
			//       Currently only used when converting to/from CSL code, not as a
			//       constraint while using the editor, due to difficulty of
			//       implementation.
			styleInfoOrder = [
				"title",
				"title-short",
				"id",
				'link rel="self"',
				'link rel="independent-parent"',
				'link rel="template"',
				'link rel="documentation"',
				"author",
				"contributor",
				"category citation-format",
				"category field",
				"issn",
				"eissn",
				"issnl",
				"summary",
				"published",
				"updated",
				"rights"
			];

		// This returns a JSON object representing the whole CSL tree
		// exactly as it's stored in local storage
		//
		// Each node of the tree contains the same member variables as CSLEDIT_CslNode
		var get = function () {
			return CSLEDIT_storage.getItemJson(CSL_DATA);
		};

		// This sets the JSON object representing the whole CSL tree
		// as it's stored in local storage
		//
		// Each node of the tree contains the same member variables as CSLEDIT_CslNode
		var set = function (cslData) {
			var updatedNode,
				iter,
				index,
				node;

			if (updateTime) {
				// update 'style/info/updated'
				updatedNode = getNodesFromPath('style/info/updated', cslData)[0];
				if (typeof(updatedNode) === "undefined") {
					debug.log("WARNING: no style/info/updated node");
				} else {
					// write timestamp to updated node
					iter = new CSLEDIT_Iterator(cslData);
					index = 0;
					while (iter.hasNext()) {
						node = iter.next();
						if (index === updatedNode.cslId) {	
							node.textValue = (new Date()).toISOString().replace(/\.[0-9]{3}Z$/, "+00:00");
							break;
						}
						index++;
					}
				}
			}

			CSLEDIT_storage.setItem(CSL_DATA, JSON.stringify(cslData));
			return cslData;
		};

		var nodeMatch = function (nodeData, nodeString) {
			var nodeInfo = nodeString.split(" "),
				nodeName = nodeInfo[0],
				attribute,
				attributeName,
				attributeValue,
				cslNode = new CSLEDIT_CslNode(nodeData);

			if (nodeInfo.length > 1) {
				attribute = nodeInfo[1].split("=");
				attributeName = attribute[0];
				if (attribute.length > 1) {
					attributeValue = attribute[1].replace(/"/g, "");
				}
			}

			if (nodeName !== nodeData.name) {
				return false;
			}
			
			if (typeof(attributeName) !== "undefined" && !cslNode.hasAttr(attributeName)) {
				return false;
			}

			if (typeof(attributeValue) !== "undefined" &&
					cslNode.getAttr(attributeName) !== attributeValue) {
				return false;
			}

			return true;
		};

		var reorderStyleInfoNode = function (cslData /*optional*/) {
			var styleInfoNode;

			cslData = cslData || get();

			// re-order the style/info child nodes:
			$.each(getNodesFromPath('style/info', cslData), function (i, infoNode) {
				var iterator,
					cslId = infoNode.cslId;

				styleInfoNode = infoNode;

				// re-order
				infoNode.children.sort(function (a, b) {
					var orderA = styleInfoOrder.length,
						orderB = styleInfoOrder.length;

					$.each(styleInfoOrder, function (i, nodeString) {
						if (nodeMatch(a, nodeString)) {
							orderA = i;
						}
						if (nodeMatch(b, nodeString)) {
							orderB = i;
						}
					});

					return orderA - orderB;
				});

				// set cslIds
				iterator = new CSLEDIT_Iterator(infoNode);
				while (iterator.hasNext()) {
					iterator.next().cslId = cslId;
					cslId++;
				}

				return false;
			});

			return styleInfoNode;
		};

		// Sets the current CSL style from the given string containing XML
		var setCslCode = function (cslCode, allowDependentStyle, skipLargeStyleWarning /* optional */) {
			var cslData,
				error;
			
			try {
				cslData = CSLEDIT_cslParser.cslDataFromCslCode(cslCode);
			} catch (err) {
				return { error: {
					type: "cslParsing",
					message: "Error parsing CSL Code"
				}};
			}

			if (!allowDependentStyle) {
				// check if this is a dependent style:
				$.each(getNodesFromPath('style/info/link', cslData), function (i, node) {
					var linkNode = new CSLEDIT_CslNode(node);
					if (linkNode.getAttr("rel") === "independent-parent") {
						error = {
							type: "dependentStyle",
							parentURL: linkNode.getAttr("href"),
							message: "Editing of dependent styles not yet supported.\n\n" + 
								"Please find and edit this master style instead:\n\n" +
								linkNode.getAttr("href")
						};
					}
				});
			}

			// check it contains required nodes
			if (typeof error === "undefined") {
				$.each(requiredNodes, function (i, requiredNode) {
					if (getNodesFromPath(requiredNode, cslData).length === 0) {
						error = {
							type: "nodeMissing",
							node: requiredNode,
							message: "CSL code is missing essential node: " + requiredNode
						};
						return false;
					}
				});
			}

			reorderStyleInfoNode(cslData);

			if (error) {
				return { error: error };
			}

			// Performance warning for large styles (unless bypassed)
			if (!skipLargeStyleWarning && cslCode.length > 150000) {
				console.warn("Large CSL style detected:", cslCode.length, "bytes");
				console.warn("Visual Editor may experience performance issues");
				console.warn("Consider using Code Editor for better performance");

				return { error: {
					type: "largeStyle",
					styleSize: cslCode.length,
					message: "Performance Warning: This style is very large (" +
						Math.round(cslCode.length / 1024) + "KB).\n\n" +
						"The Visual Editor may become unresponsive with styles this large.\n\n" +
						"Recommendation: Use the Code Editor instead for better performance."
				}};
			}

			if (updateTime) {
				// add a style/info/updated node if not present
				// (this will be written to on every edit, create here
				//  to avoid doing on every change which would complicate
				//  undo/redo code in CSLEDIT_controller)
				updateTime = false;
				set(cslData);
				if (getNodesFromPath('style/info/updated').length === 0) {
					debug.log("creating required updated node");
					_addNode(getNodesFromPath('style/info')[0].cslId, "last",
							new CSLEDIT_CslNode("updated", [], [], -1), true);
				}
				cslData = get();
				updateTime = true;
			}

			set(cslData);

			emit("newStyle", []);
			return {};
		};

		// Returns a string with the CSL style in XML format ready for output
		var getCslCode = function (comment /* optional */) {
			var cslData = get();
			reorderStyleInfoNode(cslData);
		
			return CSLEDIT_cslParser.cslCodeFromCslData(cslData, comment);
		};

		var spliceNode = function (cslId, position, nodesToDelete, newNode) {
			var iter,
				cslData,
				index,
				node,
				nodesBefore;

			cslData = get();

			nodesBefore = numNodes(cslData);

			// Find the id of the node to add
			iter = new CSLEDIT_Iterator(cslData);

			index = 0;
			while (iter.hasNext()) {
				node = iter.next();
				
				if (index === cslId) {
					debug.assertEqual(node.cslId, index);
					debug.assert(position + nodesToDelete <= node.children.length);

					if (typeof newNode === "undefined") {
						node.children.splice(position, nodesToDelete);
					} else {
						node.children.splice(position, nodesToDelete, newNode);
					}
				}
				index++;
			}

			// correct the cslId numbering
			iter = new CSLEDIT_Iterator(cslData);
			index = 0;
			while (iter.hasNext()) {
				node = iter.next();
				node.cslId = index;
				index++;
			}

			set(cslData);

			return index - nodesBefore; // difference in number of nodes
		};

		// Returns an object containing:
		//
		// node - the CSL node with the given cslId,
		// parent - it's parent
		var getNodeAndParent = function (cslId) {
			var iter = new CSLEDIT_Iterator(get()),
				node;

			while (iter.hasNext()) {
				node = iter.next();

				if (node.cslId === cslId) {
					return {
						node : node,
						parent : iter.parent()
					};
				}
			}

			// not found
			return { node : null, parent : null };
		};

		// Returns a list containing the node at cslId, and all it's parents
		//
		// The first element will be the root 'style' node
		// The last element will be the node with the given cslId
		var getNodeStack = function (cslId) {
			var iter = new CSLEDIT_Iterator(get()),
				nodeStack,
				node;

			while (iter.hasNext()) {
				node = iter.next();

				if (node.cslId === cslId) {
					return iter.stack();
				}
			}
		};

		// Returns a list of node names correspoding to the current node stack
		// (see getNodeStack())
		var getNodePath = function (cslId) {
			var nodeNames = [];
			$.each(getNodeStack(cslId), function (i, node) {
				nodeNames.push(node.name);
			});
			return nodeNames.join('/');
		};

		// Returns CSL node JSON of the node with the given cslId
		var getNode = function (cslId, cslData /* optional */) {
			if (typeof cslData !== "undefined") {
				return getNodeAndParent(cslId, cslData).node;
			} else {
				return getNodeAndParent(cslId).node;
			}
		};

		// Returns all matching nodes with the given path or
		// null if it couldn't find a match
		//
		// path is a '/' delimited string of the node stack you are searching for.
		//
		// e.g. 'style/citation/layout'
		var getNodesFromPath = function (path, cslData /* optional */) {
			var splitPath = path.split("/"),
				rootNode,
				result = [];

			if (typeof cslData === "undefined") {
				cslData = get();
			}

			rootNode = splitPath.splice(0, 1);

			if (rootNode[0] === "") {
				return result;
			}

			getNodesFromPath_inner(splitPath, cslData, result);
			return result;
		};

		var getNodesFromPath_inner = function (path, nodeData, result) {
			var index,
				rootNode,
				regExp,
				newPath;

			if (path.length === 0) {
				result.push(nodeData);
				return;
			}

			rootNode = path[0];
			newPath = path.slice(1, path.length);

			// convert '*' wildcard to regexp equivalent
			regExp = new RegExp("^" + rootNode.replace("*", ".*") + "$");

			for (index = 0; index < nodeData.children.length; index++) {
				if (regExp.test(nodeData.children[index].name)) {
					getNodesFromPath_inner(newPath, nodeData.children[index], result);
				}
			}
		};

		// Returns the cslId of the first node within the given cslData tree
		// with the name nodeName
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
		
		// Returns the number of nodes in the given CSL node tree
		var numNodes = function (cslNode) {
			// use the whole tree if none specified
			cslNode = cslNode || get();

			var iter = new CSLEDIT_Iterator(cslNode),
				index = 0;

			while (iter.hasNext()) {
				iter.next();
				index++;
			}

			return index;
		};

		var emit = function (event, args) {
			$.each(viewControllers, function (index, controller) {
				controller.styleChanged(event, args);
			});
		};
		
		// Get the index of the given childNode within the given parentNode
		// or -1 if childNode is not a child of parentNode
		var indexOfChild = function (childNode, parentNode) {
			var index;
			for (index = 0; index < parentNode.children.length; index++) {
				if (childNode.cslId === parentNode.children[index].cslId) {
					return index;
				}
			}
			return -1;
		};
		
		// If the node 'cslId' is a macro instance, return the cslId of the 
		// corresponding macro definition
		//
		// Else, return 'cslId'
		var macroDefinitionIdFromInstanceId = function (cslId) {
			var node = new CSLEDIT_CslNode(getNode(cslId)),
				macroName,
				macroNodes,
				macroNode;

			macroName = node.getAttr("macro");
			if (node.name === "text" && macroName !== "") {
				macroNodes = getNodesFromPath("style/macro");

				$.each(macroNodes, function (i, macroNode) {
					var thisMacroNode = new CSLEDIT_CslNode(macroNode);
					if (thisMacroNode.getAttr("name") === macroName) {
						cslId = thisMacroNode.cslId;
						return false;
					}
				});
			}
			return cslId;
		};
		
		// Adds a CSL node
		//
		// cslId - The existing CSL node cslId to create within or next to
		// position - Where to place the new node relative to the exitsing one.
		//            Can be one of the following positions:
		// 
		//   - integer  - the child index within the existing node
		//   - "first"  - the first child of the existing node
		//   - "last"   - the last child of the existing node
		//   - "inside" - same as "last"
		//   - "before" - the sibling before the existing node
		//   - "after"  - the sibling after the existing node
		//
		// newNode - the new CSL node to add (follows the CSL node JSON described in src/CslNode.js)
		var addNode = function (cslId, position, newNode) {
			var newCslId = _addNode(cslId, position, newNode),
				inverse;
			emit("updateFinished");

			// return the inverse command for undo functionality
			return {
				command : "deleteNode",
				args : [ newCslId ]
			};
		};

		var _addNode = function (cslId, position, newNode, suppressViewUpdate /*optional*/) {
			var nodeInfo,
				positionIndex,
				nodesAdded,
				defaultAttributes,
				defaultChildren;
			
			newNode.cslId = -1;
			newNode.children = newNode.children || [];
			newNode.attributes = newNode.attributes || [];

			defaultAttributes = CSLEDIT_uiConfig.defaultAttributes[newNode.name];

			// populate with default attributes
			if (newNode.attributes.length === 0 && typeof defaultAttributes !== "undefined") {
				$.each(defaultAttributes, function (attribute, value) {
					newNode.attributes.push({key: attribute, value: value, enabled: true});
				});
			}

			defaultChildren = CSLEDIT_uiConfig.defaultChildren[newNode.name];

			// populate with default children
			if (newNode.children.length === 0 && typeof defaultChildren !== "undefined") {
				newNode.children = defaultChildren;
			}

			if (typeof position === "number") {
				// change parent cslId from macro instances to macro definitions
				cslId = macroDefinitionIdFromInstanceId(cslId);

				nodesAdded = spliceNode(cslId, position, 0, newNode);
				if (!suppressViewUpdate) {
					emit("addNode", [cslId, position, newNode, nodesAdded]);
				}
			} else {
				switch (position) {
				case "first":
					// change parent cslId from macro instances to macro definitions
					cslId = macroDefinitionIdFromInstanceId(cslId);

					return _addNode(cslId, 0, newNode, suppressViewUpdate);
				case "inside":
				case "last":
					// change parent cslId from macro instances to macro definitions
					cslId = macroDefinitionIdFromInstanceId(cslId);
					
					return _addNode(cslId, getNode(cslId).children.length, newNode, suppressViewUpdate);
				case "before":
				case "after":
					debug.assert(cslId !== 0);
					nodeInfo = getNodeAndParent(cslId);
					positionIndex = indexOfChild(nodeInfo.node, nodeInfo.parent);
					if (position === "after") {
						positionIndex++;
					}
					return _addNode(nodeInfo.parent.cslId, positionIndex, newNode, suppressViewUpdate);
				case "default":
					debug.assert(false, "position: " + position + " not recognised");
				}
			}
			return newNode.cslId;
		};
		
		// Deletes the CSL node with the given cslId
		var deleteNode = function (cslId) {
			var deletedNode,
				nodeAndParent = getNodeAndParent(cslId),
				parentNode,
				position,
				nodePath = getNodePath(cslId),
				error;

			// can't delete required nodes
			$.each(requiredNodes, function (i, requiredNodePath) {
				if (nodePath === requiredNodePath) {
					error = {
						type: "requiredNode",
						message: "Cannot delete required node: " + nodePath
					};
					return false;
				}
			});

			// can't delete the updated node
			// (this isn't in requiredNodes because it's OK to load a style without it)
			if (nodePath === "style/info/updated") {
				error = {
					type: "requiredNode",
					message: "Cannot delete required node: " + nodePath
				};
			}

			if (error) {
				return { error : error };
			}

			parentNode = nodeAndParent.parent.cslId;
			position = indexOfChild(nodeAndParent.node, nodeAndParent.parent);

			deletedNode = _deleteNode(cslId);

			emit("updateFinished");

			// return the inverse command for undo functionality
			return {
				command : "addNode",
				args : [ parentNode, position, deletedNode ]
			};
		};

		var _deleteNode = function (cslId) {
			var iter = new CSLEDIT_Iterator(get()),
				index,
				node,
				parentNode,
				nodesDeleted;

			debug.assert(cslId !== 0); // can't delete the style node

			index = 0;
			while (iter.hasNext()) {
				node = iter.next();

				if (index === cslId) {
					parentNode = iter.parent();
					break;
				}
				index++;
			}

			debug.assert(typeof parentNode !== "undefined");
			nodesDeleted = -spliceNode(parentNode.cslId, indexOfChild(node, parentNode), 1);
			debug.assertEqual(node.cslId, cslId);
			
			emit("deleteNode", [cslId, nodesDeleted]);
			
			return node;
		};

		// Replaces the CSL node at the given cslId, with the given ammendedNode
		//
		// Note: This leaves the list of children intact, so that the whole ammendedNode
		//       sub-tree doesn't need to be passed
		var amendNode = function (cslId, amendedNode) {
			var cslData = get(),
				iter,
				node,
				index,
				result,
				oldNode;
			
			iter = new CSLEDIT_Iterator(cslData);
			index = 0;

			while (iter.hasNext()) {
				node = iter.next();
				if (index === cslId) {
					debug.assertEqual(node.cslId, cslId);
					
					oldNode = new CSLEDIT_CslNode(node.name, node.attributes, [], node.cslId);
					oldNode.textValue = node.textValue;

					node.name = amendedNode.name;
					node.attributes = amendedNode.attributes;
					node.textValue = amendedNode.textValue;

					break;
				}
				index++;
			}
			debug.assert(typeof node !== "undefined");
			set(cslData);
			emit("amendNode", [cslId, node]);
			emit("updateFinished");
			// return inverse command
			return {
				command : "amendNode",
				args : [cslId, oldNode]
			};
		};

		// This deletes the node with the given fromCslId, and adds it near the toCslId
		// at the given position.
		//
		// position accepts the same values as addNode()
		var moveNode = function (fromCslId, toCslId, position) {
			var deletedNode, fromNode,
				inverseFromCslId,
				inverseToNodeAndParent = getNodeAndParent(fromCslId),
				inverseToCslId,
				inverseToPosition;

			callbacksEnabled = false;

			inverseToCslId = inverseToNodeAndParent.parent.cslId;
			inverseToPosition = indexOfChild(inverseToNodeAndParent.node, inverseToNodeAndParent.parent);

			deletedNode = _deleteNode(fromCslId);

			debug.log("deletedNode = " + deletedNode.cslId);
			if (toCslId > fromCslId) {
				toCslId -= numNodes(deletedNode);
			}

			inverseFromCslId = _addNode(toCslId, position, deletedNode);
			if (inverseToCslId > inverseFromCslId) {
				inverseToCslId += numNodes(deletedNode);
			}

			callbacksEnabled = true;

			emit("updateFinished");
			// return inverse command
			return {
				command : "moveNode",
				args : [inverseFromCslId, inverseToCslId, inverseToPosition]
			};
		};

		// Tries in the following order to initialise the CSL style, if one fails
		// try the next
		//
		// - Get the one specified in CSLEDIT_options("initialCslCode")
		// - Get the one in CSLEDIT_storage.getItem("CSLEDIT.data")
		// - Get the default style specified in CSLEDIT_cslStyles.defaultStyleURL()
		//
		// Then call the given callback function
		var initPageStyle = function (callback) {
			var cslData, styleURL, result;
			cslData = get(); 
			
			// First try loading the style specified in options
			if (typeof CSLEDIT_options.get("initialCslCode") !== "undefined") {
				result = setCslCode(CSLEDIT_options.get("initialCslCode"));
				if (result.hasOwnProperty('error')) {
					alert(result.error.message);
				} else {
					if (typeof callback !== "undefined") {
						callback();
					}
					return;
				}
			}
			
			// Next try the 
			if (cslData === null || cslData === "") {
				styleURL = CSLEDIT_cslStyles.defaultStyleURL();
				$.get(styleURL, {}, function (cslCode) {
					var result;
					cslCode = cslCode.replace(/<!--.*?-->/g, "");
					result = setCslCode(cslCode);
					if (result.hasOwnProperty('error')) {
						alert(result.error);
					}
					if (typeof callback !== "undefined") {
						callback();
					}
				}, "text");
			} else {
				if (typeof callback !== "undefined") {
					callback();
				}
			}
		};

		// remove all view controllers
		var clearViewControllers = function () {
			viewControllers = [];
		};

		// add a view controller which will get notified by calling the relevant
		// function (addNode, deleteNode, etc...) whenever the CSL style is changed
		var addViewController = function (viewController) {
			viewControllers.push(viewController);
		};

		return {
			// Write functions (if CSLEDIT_controller is being used on this page,
			//                  use the equivalent CSLEDIT_controller commands
			//                  instead of these)
			setCslCode : setCslCode,
			addNode : addNode,
			deleteNode : deleteNode,
			amendNode : amendNode,
			moveNode : moveNode,

			// Read-only functions (safe to use anywhere)
			getCslCode : getCslCode,
			get : get,
			getNode : getNode,
			getNodeAndParent : getNodeAndParent,
			getNodeStack : getNodeStack,
			getNodePath : getNodePath,
			getFirstCslId : getFirstCslId,

			initPageStyle : initPageStyle,
			numNodes : numNodes,
			clearViewControllers : clearViewControllers,
			addViewController : addViewController,
			getNodesFromPath : getNodesFromPath,
			indexOfChild : indexOfChild,
			macroDefinitionIdFromInstanceId : macroDefinitionIdFromInstanceId
		};
	};
});
