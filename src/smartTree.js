"use strict";

CSLEDIT = CSLEDIT || {};

CSLEDIT.SmartTree = function (treeElement, nodePaths) {
	var nodeTypes = {
			"valid_children" : [ "root" ],
			"types" : {
				"text" : {
					"icon" : {
						"image" : "../external/famfamfam-icons/style.png"
					}
				},
				"macro" : {
					"icon" : {
						"image" : "../external/famfamfam-icons/brick.png"
					}
				},
				"info" : {
					"icon" : {
						"image" : "../external/famfamfam-icons/information.png"
					}
				},
				"choose" : {
					"icon" : {
						"image" : "../external/fugue-icons/question-white.png"
					}
				},
				"date" : {
					"icon" : {
						"image" : "../external/famfamfam-icons/date.png"
					}
				},
				"style" : {
					"icon" : {
						"image" : "../external/famfamfam-icons/cog.png"
					}
				},
				"citation" : {
					"icon" : {
						"image" : "../external/famfamfam-icons/page_white_edit.png"
					}
				},
				"bibliography" : {
					"icon" : {
						"image" : "../external/famfamfam-icons/text_list_numbers.png"
					}
				},
				"sort" : {
					"icon" : {
						"image" : "../external/fugue-icons/sort-alphabet.png"
					}
				},
				"number" : {
					"icon" : {
						"image" : "../external/fugue-icons/edit-number.png"
					}
				},
				"layout" : {
					"icon" : {
						"image" : "../external/famfamfam-icons/page_white_stack.png"
					}
				},
				"group" : {
					"icon" : {
						"image" : "../external/famfamfam-icons/page_white_stack.png"
					}
				}
			}
		},
		ranges,
		callbacks;

	var setCallbacks = function (_callbacks) {
		callbacks = _callbacks;
	};
	
	var getAttr = function (attribute, attributes) {
		var index;

		for (index = 0; index < attributes.length; index++) {
			if (attributes[index].enabled && attributes[index].key === attribute) {
				return attributes[index].value;
			}
		}
		return "";
	};

	var displayNameFromMetadata = function (metadata) {
		var index,
			attributesString = "",
			attributesStringList = [],
			displayName,
			macro;

		switch (metadata.name) {
			case "macro":
				displayName = "Macro: " + getAttr("name", metadata.attributes);
				break;
			case "text":
				macro = getAttr("macro", metadata.attributes);
				if (macro !== "") {
					displayName = "Text (macro): " + macro;
				} else {
					displayName = "Text";
				}
				break;
			case "citation":
				displayName = "Inline Citations";
				break;
			case "bibliography":
				displayName = "Bibliography";
				break;
			default:
				displayName = metadata.name;
		}

		return displayName;
	};

	var createTree = function () {
		var jsTreeData;

		jsTreeData = jsTreeDataFromCslData(nodePaths);

		//console.log("jsTreeData = " + JSON.stringify(jsTreeData));

		treeElement.on("loaded.jstree", function () {
			// set up range root nodes
			$.each(ranges, function (index, range) {
				range.rootNode = treeElement.find('li[cslid=' + range.first + ']');
				assertEqual(range.rootNode.length, 1);
			});
			callbacks.loaded();
		});
		treeElement.on("select_node.jstree", callbacks.selectNode);

		treeElement.jstree({
			"json_data" : { data : jsTreeData },
			"types" : nodeTypes,
			"plugins" : ["themes","json_data","ui", "crrm", "dnd", /*"contextmenu",*/
				"types", "hotkeys"],
			//"core" : { "initially_open" : [ "node1" ] },
			"ui" : { /*"initially_select" : [ "cslTreeNode0" ],*/ "select_limit" : 1 },
			"dnd" : {
				"open_timeout" : 800,
				"move_requested" : callbacks.moveNode
			},
			"crrm" : {
				"move" : {
					// only allow re-ordering, not moving to different nodes
					"check_move" : function (move) {
						return callbacks.checkMove(
							parseInt(move.o.attr("cslid")), parseInt(move.r.attr("cslid")), move.p);
					}
				}
			},
			"hotkeys" : {
				"del" : callbacks.deleteNode,
				"f2" : false
			}
			
		});
	};
	
	var jsTreeDataFromCslData = function (nodePaths) {
		var cslNodes = [],
			jsTreeData = [],
			cslData = CSLEDIT.data.get();

		ranges = [];

		console.log("paths = " + nodePaths.join(", "));
		$.each(nodePaths, function (i, path) {
			var nodes = CSLEDIT.data.getNodesFromPath(path, cslData);
			cslNodes = cslNodes.concat(nodes);
		});

		$.each(cslNodes, function (i, node) {
			var lastCslId = [ -1 ],
				firstCslId = node.cslId;
			jsTreeData.push(jsTreeDataFromCslData_inner(node, lastCslId));
			ranges.push({
				first : firstCslId,
				last : lastCslId[0]
			});
		});

		console.log("ranges: " + JSON.stringify(ranges));
		return jsTreeData;
	};

	var jsTreeDataFromCslData_inner = function (cslData, lastCslId) {
		var index,
			children = [],
			cslNodes = [],
			thisCslData;

		if (typeof cslData.cslId === "undefined") {
			cslData.cslId = -1;
		}
		cslData.children = cslData.children || [];

		if (cslData.cslId > lastCslId[0]) {
			lastCslId[0] = cslData.cslId;
		}

		for (index = 0; index < cslData.children.length; index++) {
			children.push(jsTreeDataFromCslData_inner(cslData.children[index], lastCslId));
		}

		var jsTreeData = {
			data : displayNameFromMetadata(cslData),
			attr : {
				rel : cslData.name,
				cslid : cslData.cslId,
			},
			children : children
		};

		return jsTreeData;
	};

	var selectedNode = function () {
		var selected,
			cslid;

		selected = treeElement.jstree('get_selected'),
		cslid = parseInt(selected.attr("cslid"));
		return cslid;
	};

	var expandNode = function (id) {
		treeElement.jstree("open_node", 'li[cslid=' + id + ']');
	};

	var rangeIndex = function (id) {
		var result = -1,
			index = 0;	

		$.each(ranges, function (i, range) {
			if (id >= range.first && id <= range.last) {
				result = index;
				return false; // to jump out of the $.each() loop
			}
			index++;
		});

		return result;
	};

	var addNode = function (parentId, position, newNode, nodesAdded) {
		var id,	parentNode,	thisRangeIndex,	currentCslId, range,
			matchingCslNodes, newTreeNode;

		id = newNode.cslId;

		// note: no two ranges are expected to have the same parent id
		thisRangeIndex = rangeIndex(parentId);

		// shift ranges
		$.each(ranges, function (index, range) {
			if (thisRangeIndex !== index) {
				shiftCslIds(range, id + 1, nodesAdded);
			}
		});

		if (thisRangeIndex === -1) {
			matchingCslNodes = [];
			// check if the new node belongs to this smartTree
			$.each(nodePaths, function (i, path) {
				matchingCslNodes = matchingCslNodes.concat(CSLEDIT.data.getNodesFromPath(path));
			});

			$.each(matchingCslNodes, function (i, node) {
				var lastCslId = [-1];
				if (node.cslId === newNode.cslId) {
					// TODO: would be nicer not to re-create the entire tree
					//createTree();
					
					createSubTree(ranges[ranges.length-1].rootNode, "after", jsTreeDataFromCslData_inner(
							newNode, lastCslId));

					var newTreeNode = treeElement.find('li[cslid="' + newNode.cslId + '"]');
					//assertEqual(newTreeNode.length, 1);
					
					ranges.push({
						first : newNode.cslId,
						last : newNode.cslId + CSLEDIT.data.numNodes(newNode) - 1,
						rootNode : newTreeNode
					});
					
					return false;
				}
			});

			return;
		}
		range = ranges[thisRangeIndex];

		console.log("adding to node " + parentId);
		parentNode = treeElement.find('li[cslid="' + parentId + '"]');
		assertEqual(parentNode.length, 1);
			
		createSubTree(parentNode, position, jsTreeDataFromCslData_inner(newNode, [id]));

		// sort the cslids
		var allNodes;
		allNodes = range.rootNode.find('li[cslid]');

		currentCslId = range.first;
		allNodes.each(function (index) {
			$(this).attr('cslid', range.first + 1 + index);
			currentCslId++;
		});
		
		assertEqual(currentCslId - range.last, nodesAdded);
		
		range.last += nodesAdded;
	};

	// needed because "create_node" doesn't allow adding nodes with children
	var createSubTree = function (parentNode, position, jsTreeData) {
		var newNode;

		newNode = treeElement.jstree('create_node', parentNode, position, 
			{
				data : jsTreeData.data,
				attr : jsTreeData.attr
			});
		
		$.each(jsTreeData.children, function (i, child) {
			createSubTree(newNode, i, child);
		});
	};

	var shiftCslIds = function (range, fromId, amount) {
		var cslId;

		if (range.first >= fromId) {
			console.log("shifting cslids for range starting " + range.first + " by " + amount);

			range.rootNode.attr("cslid", parseInt(range.rootNode.attr("cslid")) + amount);
			range.rootNode.find('li[cslid]').each( function () {
				cslId = parseInt($(this).attr("cslid"));
				if (cslId >= range.first && cslId <= range.last) {
					$(this).attr("cslid", cslId + amount);
				}
			});
			
			range.first += amount;
			range.last += amount;
		}
	};

	var deleteNode = function (id, nodesDeleted) {
		var node,
			thisRangeIndex = rangeIndex(id),
			oldLastCslId,
			allNodes,
			currentCslId,
			range;

		// shift ranges
		$.each(ranges, function (index, range) {
			if (thisRangeIndex !== index) {
				shiftCslIds(range, id + nodesDeleted, -nodesDeleted);
			}
		});

		if (thisRangeIndex === -1) {
			return;
		}
		range = ranges[thisRangeIndex];

		if (id === range.first) {
			console.log("deleting range / rootNode");
			ranges.splice(thisRangeIndex, 1);

			treeElement.jstree("remove", range.rootNode);

		} else { // update range
			node = treeElement.find('li[cslid="' + id + '"]');
			assertEqual(node.length, 1);
			assert(id !== 0);

			console.log("removing node " + id);
			treeElement.jstree("remove", node);

			oldLastCslId = range;

			// sort the cslids
			allNodes = range.rootNode.find('li[cslid]');

			currentCslId = range.first;
			allNodes.each(function (index) {
				currentCslId = range.first + 1 + index;
				$(this).attr('cslid', currentCslId);
			});

			assertEqual(range.last - currentCslId, nodesDeleted);

			range.last = currentCslId;

			assertEqual(allNodes.length, range.last - range.first);
		}
	};

	var ammendNode = function (id, ammendedNode) {
		var thisRangeIndex = rangeIndex(id),
			node;

		if (thisRangeIndex === -1) {
			return;
		}

		var node = treeElement.find('li[cslid="' + id + '"]');
		treeElement.jstree('rename_node', node, displayNameFromMetadata(ammendedNode));
	};

	return {
		createTree : createTree,
		deselectAll : function () {
			treeElement.jstree("deselect_all");
		},
		selectedNode : selectedNode,
		expandNode : expandNode,
		addNode : addNode,
		deleteNode : deleteNode,
		ammendNode : ammendNode,

		shiftCslIds : shiftCslIds,

		setCallbacks : setCallbacks
	};
};
