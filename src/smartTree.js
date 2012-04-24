"use strict";

CSLEDIT = CSLEDIT || {};

CSLEDIT.SmartTree = function (treeElement) {
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
		ranges;
	
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

	var createTree = function (nodePaths, callbacks) {
		var jsTreeData;

		jsTreeData = jsTreeDataFromCslData(nodePaths);

		//console.log("jsTreeData = " + JSON.stringify(jsTreeData));

		treeElement.on("loaded.jstree", callbacks.loaded);
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
			jsTreeData = [];

		ranges = [];

		console.log("paths = " + nodePaths.join(", "));
		$.each(nodePaths, function (i, path) {
			var nodes = CSLEDIT.data.getNodesFromPath(path);
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

	var addNode = function (id, position, newNode) {
		var parentNode,
			thisRangeIndex = rangeIndex(id);

		console.log("checking to add " + id);
		if (thisRangeIndex === -1) {
			return null;
		}

		console.log("adding to node " + id);
		parentNode = treeElement.find('li[cslid="' + id + '"]');
		assertEqual(parentNode.length, 1);

		treeElement.jstree('create_node', parentNode, position,
		{
			"data" : displayNameFromMetadata(newNode),
			"attr" : { "rel" : newNode.name, "cslid" : -1 },
			"children" : []
		});

		ranges[thisRangeIndex].last++;

		// sort the cslids
		var allNodes;
		allNodes = treeElement.children().first().children().eq(thisRangeIndex).find('li[cslid]');

		assertEqual(allNodes.length, ranges[thisRangeIndex].last - ranges[thisRangeIndex].first);

		allNodes.each(function (index) {
			$(this).attr('cslid', ranges[thisRangeIndex].first + 1 + index);
		});

		// shift rest of ids one forward
		return {
			fromId : ranges[thisRangeIndex].last,
			amount : 1
		};
	};

	var shiftCslIds = function (fromId, amount) {
		var index = 0;

		console.log("shifting cslids " + fromId + " by " + amount);

		$.each(ranges, function (rangeIndex, range) {
			var rootNode;

			if (range.first >= fromId) {
				console.log("shifting cslids for range starting " + range.first);
				range.first += amount;
				range.last += amount;

				rootNode = treeElement.children().first().children().eq(rangeIndex);

				rootNode.attr("cslid", parseInt(rootNode.attr("cslid")) + amount);
				rootNode.find('li[cslid]').each( function () {
					$(this).attr("cslid", parseInt($(this).attr("cslid")) + amount);
				});
			}

			index++;
		});
	};

	var deleteNode = function (id) {
		var node,
			thisRangeIndex = rangeIndex(id),
			oldLastCslId,
			allNodes,
			currentCslId;

		console.log("checking to delete node " + id);

		if (thisRangeIndex === -1) {
			return null;
		}

		node = treeElement.find('li[cslid="' + id + '"]');
		assertEqual(node.length, 1);
		assert(id !== 0);

		assert(id !== ranges[thisRangeIndex].first, "TODO: implement");

		console.log("removing node " + id);

		treeElement.jstree("remove", node);

		oldLastCslId = ranges[thisRangeIndex];

		// sort the cslids
		allNodes = treeElement.children().first().children().eq(thisRangeIndex).find('li[cslid]');

		currentCslId = ranges[thisRangeIndex].first;
		allNodes.each(function (index) {
			currentCslId = ranges[thisRangeIndex].first + 1 + index;
			$(this).attr('cslid', currentCslId);
		});

		ranges[thisRangeIndex].last = currentCslId;

		assertEqual(allNodes.length, ranges[thisRangeIndex].last - ranges[thisRangeIndex].first);

		// shift rest of ids one forward
		return {
			fromId : oldLastCslId,
			amount : currentCslId - oldLastCslId
		};
	};

	var moveNode = function (fromNode, toNode, position) {

		treeElement.jstree('move_node', fromNode, toNode, position, false, false, true);
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
		moveNode : moveNode,

		shiftCslIds : shiftCslIds
	};
};
