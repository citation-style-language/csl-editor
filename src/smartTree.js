"use strict";

CSLEDIT = CSLEDIT || {};

CSLEDIT.SmartTree = function (treeElement, nodePaths, enableMacroLinks /*optional*/) {
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
		macroLinks, // like symlinks for macros
		            // [{ instanceCslId: ?, macroRange: ?}]
		callbacks,
		verifyAllChanges = false; // does a complete check against CSLEDIT.data after
		                          // every change for debugging

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

	// Check the tree matches the data - for testing and debugging
	var verifyTree = function () {
		var cslData = CSLEDIT.data.get();

		console.time("verifyTree");
		if (verifyAllChanges) {
			// Check for inconsistencies with CSLEDIT.data
			treeElement.find('li[cslid]').each(function () {
				var $this = $(this),
					cslId;

				cslId = parseInt($this.attr('cslid'));
				assertEqual(CSLEDIT.data.getNode(cslId, cslData).name, $this.attr('rel'));
			});

			// Can't have non-macrolink nodes as children of a text node
			assertEqual(treeElement.find('li[cslid][rel=text] li[macrolink!=true]').length, 0);
		}
		console.timeEnd("verifyTree");
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
				range.rootNode = treeElement.children('ul').children(
					'li[cslid=' + range.first + ']');
				assertEqual(range.rootNode.length, 1);
			});
			callbacks.loaded();

			verifyTree();
			$.each(ranges, function (i, range) {
				console.log("range(" + i + ") = " + range.first + "-" + range.last);
			});
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
		macroLinks = [];

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

	var jsTreeDataFromCslData_inner = function (cslData, lastCslId, macroLink) {
		var index,
			children = [],
			cslNodes = [],
			thisCslData,
			macro;

		if (typeof cslData.cslId === "undefined") {
			cslData.cslId = -1;
		}
		cslData.children = cslData.children || [];

		if (cslData.cslId > lastCslId[0]) {
			lastCslId[0] = cslData.cslId;
		}

		for (index = 0; index < cslData.children.length; index++) {
			children.push(jsTreeDataFromCslData_inner(
				cslData.children[index], lastCslId, macroLink));
		}

		var jsTreeData = {
			data : displayNameFromMetadata(cslData),
			attr : {
				rel : cslData.name,
				cslid : cslData.cslId,
			},
			children : children
		};

		if (typeof macroLink !== "undefined") {
			jsTreeData.attr.macrolink = macroLink;
		}

		if (enableMacroLinks) {
			// Add 'symlink' to Macro
			macro = getAttr("macro", cslData.attributes);
			if (cslData.name === "text" && macro !== "") {
				addMacro(jsTreeData, cslData, macro);
			}
		}

		return jsTreeData;
	};

	var addMacro = function (jsTreeData, cslNode, macroName) {
		var macroNodes,
			macroNode,
			lastCslId = [0],
			index;

		console.time("addMacro");

		// delete any existing macroLinks
		for (index = 0; index < macroLinks.length; index++) {
			if (macroLinks[index].instanceCslId === cslNode.cslId) {
				macroLinks.splice(index, 1);
				index--;
			}
		};

		// find the macro node:
		macroNodes = CSLEDIT.data.getNodesFromPath("style/macro");

		$.each(macroNodes, function (i, node) {
			if (getAttr("name", node.attributes) === macroName) {
				macroNode = node;
				return false;
			}
		});

		if (typeof macroNode === "undefined") {
			console.log('WARNING: macro "' + macroName + '" doesn\'t exist');
			return;
		}
		
		// add the macro's children to this node
		$.each(macroNode.children, function (i, childNode) {
			jsTreeData.children.push(jsTreeDataFromCslData_inner(childNode, lastCslId, true));
		});

		console.log("adding to macroLinks, instance = " + cslNode.cslId);
		macroLinks.push({
			instanceCslId : cslNode.cslId, 
			first: macroNode.cslId, last: lastCslId[0] });

		console.timeEnd("addMacro");
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

	var macroLinksShiftCslIds = function (id, nodesAdded) {
		console.log("shifting macrolinks by " + nodesAdded);
		treeElement.find('li[cslid][macrolink="true"]').each(function () {
			var $this = $(this),
				cslId;
			
			cslId = parseInt($this.attr('cslid'));
			if (cslId >= id) {
				$this.attr('cslid', cslId + nodesAdded);
			}
		});

		$.each(macroLinks, function (i, macroLink) {
			if (macroLink.first >= id) {
				macroLink.first += nodesAdded;
			}
			if (macroLink.last >= id) {
				macroLink.last += nodesAdded;
			}
		});
	};
		
	var macroLinksAddNode = function (parentId, position, newNode, nodesAdded) {
		var id = newNode.cslId,
			parentNodes;

		console.time("macroLinksAddNode");

		// Shift references to the macro definition
		macroLinksShiftCslIds(id, nodesAdded);

		// TODO: check if new node is a macro instance

		parentNodes = treeElement.find('li[cslid=' + parentId + '][macrolink="true"]');

		console.log("macro links add to " + parentId + ", length = " + macroLinks.length);
		// Add macro node children to all instances
		$.each(macroLinks, function(i, macroLink) {
			console.log("macroLink: " + JSON.stringify(macroLink));
			if (macroLink.first === parentId) {
				parentNodes = parentNodes.add(
					treeElement.find('li[cslid=' + macroLink.instanceCslId + ']'));
				assert(parentNodes.length > 0);
				console.log("adding " + parentNodes.length + " to macro instance");
			}
		});

		// shift references to the instance cslIds
		$.each(macroLinks, function (i, macroLink) {
			if (macroLink.instanceCslId >= id) {
				macroLink.instanceCslId += nodesAdded;
			}
		});
		
		parentNodes.each(function () {
			createSubTree($(this), position,
				jsTreeDataFromCslData_inner(newNode, [id], true));
		});

		console.timeEnd("macroLinksAddNode");
	};

	var macroLinksDeleteNode = function (nodeId, nodesDeleted) {
		var index,
			macroLink;
		
		treeElement.find('li[cslid=' + nodeId + '][macrolink="true"]').each( function () {
			treeElement.jstree('remove', $(this));
		});

		// Delete macro node children from all instances
		for (index = 0; index < macroLinks.length; index++) {
			macroLink = macroLinks[index];

			if (macroLink.instanceCslId === nodeId) {
				macroLinks.splice(index, 1);
				return false;
			}
			if (macroLink.first === nodeId) {
				console.log("WARNING: macro deleted, leaving broken instance links");
				// remove all children
				treeElement.find('li[cslid=' + macroLink.instanceCslId + '][macrolink!=true]').
					each(function () {
						$.jstree._reference(treeElement)._get_children($(this)).each(function () {
							treeElement.jstree('remove', $(this));
						});
				});

				// clean up macroLinks array:
				macroLinks.splice(index, 1);
				index--;
			}
		}
		
		macroLinksShiftCslIds(nodeId + nodesDeleted, -nodesDeleted);
		// shift references to the instance cslIds
		$.each(macroLinks, function (i, macroLink) {
			if (macroLink.instanceCslId >= nodeId + nodesDeleted + 1) {
				macroLink.instanceCslId -= nodesDeleted;
			}
		});
	};

	var macroLinksUpdateNode = function (id, _ammendedNode) {
		var ammendedNode = new CSLEDIT.CslNode(""),
			macroName,
			jsTreeData = {children: [], attr: [], data: ""};
			
		ammendedNode.copy(_ammendedNode);

		macroName = ammendedNode.getAttr("macro");
		if (ammendedNode.name === "text" && macroName !== "") {
			addMacro(jsTreeData, ammendedNode, macroName);

			console.log("ammending macro instance : " + ammendedNode.cslId);
			treeElement.find('[cslid=' + ammendedNode.cslId + ']').each( function () {
				var $this = $(this);
				// remove all children
				$.jstree._reference(treeElement)._get_children($this).each(function () {
					treeElement.jstree('remove', $(this));
				});
				// create new children
				$.each(jsTreeData.children, function (i, child) {
					createSubTree($this, i, child);
				});
			});
		}
	};

	var addNode = function (parentId, position, newNode, nodesAdded) {
		var id,	parentNode,	thisRangeIndex,	currentCslId, range,
			matchingCslNodes, newTreeNode;

		id = newNode.cslId;

		// note: no two ranges are expected to have the same parent id
		thisRangeIndex = rangeIndex(parentId);

		// TODO: I think this can be done the same way as the macroLink shifting,
		//       just do it all in one treeElement.find('li[cslid]').each(...)
		// shift ranges
		$.each(ranges, function (index, range) {
			if (thisRangeIndex !== index) {
				shiftCslIds(range, id, nodesAdded);
			}
		});

		if (enableMacroLinks) {
			macroLinksAddNode(parentId, position, newNode, nodesAdded);
		}

		if (thisRangeIndex === -1) {
			matchingCslNodes = [];
			// check if the new node belongs to this smartTree
			$.each(nodePaths, function (i, path) {
				matchingCslNodes = matchingCslNodes.concat(CSLEDIT.data.getNodesFromPath(path));
			});

			$.each(matchingCslNodes, function (i, node) {
				var lastCslId = [-1];
				if (node.cslId === newNode.cslId) {
					var newJsTreeNode;
					newJsTreeNode = jsTreeDataFromCslData_inner(newNode, lastCslId);
					createSubTree(ranges[ranges.length-1].rootNode, "after", newJsTreeNode);

					var newTreeNode = treeElement.find('li[cslid="' + newNode.cslId + '"]');
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
		parentNode = treeElement.find('li[cslid="' + parentId + '"][macrolink!="true"]');
		assertEqual(parentNode.length, 1);
		
		createSubTree(parentNode, position, jsTreeDataFromCslData_inner(newNode, [id]));

		// sort the cslids
		sortRange(range);

		macroLinksUpdateNode(newNode.cslId, newNode);
		
		verifyTree();
	};

	var totalCreateNodeTime = 0;

	// needed because "create_node" doesn't allow adding nodes with children
	var createSubTree = function (parentNode, position, jsTreeData) {
		var newNode;

		console.time("createNode");
		newNode = treeElement.jstree('create_node', parentNode, position, 
			{
				data : jsTreeData.data
				// attr : jsTreeData.attr
				// Don't know why, but 'create_node' fails if including a
				// 'ref' attribute on a root node. It works to just add the
				// attribute later though
			});
		newNode.attr(jsTreeData.attr);

		console.timeEnd("createNode");

		$.each(jsTreeData.children, function (i, child) {
			createSubTree(newNode, i, child);
		});
	};

	var shiftCslIds = function (range, fromId, amount) {
		var cslId;

		if (range.first >= fromId) {
			console.log("shifting cslids for range starting " + range.first + " by " + amount);

			range.rootNode.attr("cslid", parseInt(range.rootNode.attr("cslid")) + amount);
			range.rootNode.find('li[cslid][macroLink!="true"]').each( function () {
				cslId = parseInt($(this).attr("cslid"));
				if (cslId >= range.first && cslId <= range.last) {
					$(this).attr("cslid", cslId + amount);
					assert (cslId + amount < 250);
				}
			});
			
			range.first += amount;
			range.last += amount;
		}
	};

	var deleteNode = function (id, nodesDeleted) {
		var node,
			thisRangeIndex = rangeIndex(id),
			allNodes,
			currentCslId,
			range;

		// shift ranges
		$.each(ranges, function (index, range) {
			if (thisRangeIndex !== index) {
				shiftCslIds(range, id + nodesDeleted, -nodesDeleted);
			}
		});

		if (enableMacroLinks) {
			macroLinksDeleteNode(id, nodesDeleted);
		}

		if (thisRangeIndex === -1) {
			return;
		}
		range = ranges[thisRangeIndex];

		if (id === range.first) {
			console.log("deleting range / rootNode");
			ranges.splice(thisRangeIndex, 1);

			treeElement.jstree("remove", range.rootNode);

		} else { // update range
			node = treeElement.find('li[cslid="' + id + '"][macrolink!="true"]');
			assert(node.length > 0);
			assert(id !== 0);

			console.log("removing node " + id);
			treeElement.jstree("remove", node);

			console.log("range before: " + range.first + "-" + range.last);
			// sort the cslids
			sortRange(range);
			console.log("range after: " + range.first + "-" + range.last);
		}

		verifyTree();
	};

	var sortRange = function (range) {
		var allNodes, currentCslId;

		allNodes = range.rootNode.find('li[cslid][macrolink!="true"]');

		currentCslId = range.first;
		allNodes.each(function (index) {
			//assertEqual($(this).attr('cslid'), range.first + 1 + index);
			$(this).attr('cslid', range.first + 1 + index);
			currentCslId++;
		});

		range.last = currentCslId;
		assertEqual(allNodes.length, range.last - range.first);
	};

	var ammendNode = function (id, ammendedNode) {
		var thisRangeIndex = rangeIndex(id),
			node;

		if (thisRangeIndex === -1) {
			return;
		}

		var node = treeElement.find('li[cslid="' + id + '"]');
		treeElement.jstree('rename_node', node, displayNameFromMetadata(ammendedNode));
		
		if (enableMacroLinks) {
			macroLinksUpdateNode(ammendedNode.cslId, ammendedNode);
		}
		
		verifyTree();
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

		setCallbacks : setCallbacks,

		setVerifyAllChanges : function (verify) {
			verifyAllChanges = verify;
		},

		getRanges : function () {
			return ranges;
		},
		getMacroLinks : function () {
			return macroLinks;
		}
	};
};
