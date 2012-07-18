"use strict";

CSLEDIT = CSLEDIT || {};

CSLEDIT.SmartTree = function (treeElement, nodePaths, enableMacroLinks /*optional*/, leafNodes /*optional*/) {
	var ranges,
		macroLinks, // like symlinks for macros
		            // [{ instanceCslId: ?, macroRange: ?}]
		callbacks,
		verifyAllChanges = false, // does a complete check against CSLEDIT.data after
		                          // every change for debugging
		oldSelectedNode = -1,
		leafNodes = leafNodes || [];

	var setCallbacks = function (_callbacks) {
		callbacks = _callbacks;
	};
	
	var pathContainsLeafNode = function (nodePath) {
		// NOTE: this doesn't use the parent element, so "contributor/name" and "names/name"
		//       would *both* be leaf nodes if "name" is given
		var result = false,
			path = nodePath.split("/");
		$.each(leafNodes, function (i, leafNode) {
			if (path.indexOf(leafNode) !== -1) {
				result = true;
				return false;
			}
		});
		return result;
	};

	// Check the tree matches the data - for testing and debugging
	var verifyTree = function () {
		var cslData = CSLEDIT.data.get();

		if (verifyAllChanges) {
			console.time("verifyTree");
			// Check for inconsistencies with CSLEDIT.data
			treeElement.find('li[cslid]').each(function () {
				var $this = $(this),
					cslId;

				cslId = parseInt($this.attr('cslid'));
				assertEqual(CSLEDIT.data.getNode(cslId, cslData).name, $this.attr('rel'));
			});

			// Can't have non-macrolink nodes as children of a text node
			assertEqual(treeElement.find('li[cslid][rel=text] li[macrolink!=true]').length, 0);
			console.timeEnd("verifyTree");
		}
	};
	
	var createTree = function () {
		var jsTreeData,
			nodeTypes;

		jsTreeData = jsTreeDataFromCslData(nodePaths);

		treeElement.on("loaded.jstree", function () {
			// set up range root nodes
			$.each(ranges, function (index, range) {
				range.rootNode = treeElement.children('ul').children(
					'li[cslid=' + range.first + ']');
				assertEqual(range.rootNode.length, 1);
			});
			callbacks.loaded();

			verifyTree();
		});
		treeElement.on("select_node.jstree", function (event, ui) {
			treeElement.jstree("set_focus");

			if (selectedNode() === oldSelectedNode) {
				treeElement.jstree("toggle_node", ui.rslt.obj);
			} else {
				treeElement.jstree("open_node", ui.rslt.obj);
			}
			oldSelectedNode = selectedNode();

			callbacks.selectNode(event, ui);
		});
		
		// build the node types from the uiConfig data		
		nodeTypes = {};
		$.each(CSLEDIT.uiConfig.nodeIcons, function (type, icon) {
			nodeTypes[type] = { icon : { image : CSLEDIT.options.get("rootURL") + icon } };
		});

		treeElement.jstree({
			"json_data" : { data : jsTreeData },
			"types" : { types : nodeTypes },
			"plugins" : ["themes","json_data","ui", "crrm", "dnd", /*"contextmenu",*/
				"types", "hotkeys"],
			//"core" : { "initially_open" : [ "node1" ] },
			"core" : { "animation" : 200 },
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

		if (!pathContainsLeafNode(cslData.name)) {
			for (index = 0; index < cslData.children.length; index++) {
				children.push(jsTreeDataFromCslData_inner(
					cslData.children[index], lastCslId, macroLink));
			}
		}

		var jsTreeData = {
			data : CSLEDIT.uiConfig.displayNameFromNode(cslData),
			attr : {
				rel : cslData.name,
				cslid : cslData.cslId
			},
			children : children
		};

		if (typeof macroLink !== "undefined") {
			jsTreeData.attr.macrolink = macroLink;
		}

		if (enableMacroLinks) {
			// Add 'symlink' to Macro
			macro = new CSLEDIT.CslNode(cslData).getAttr("macro");
			if (cslData.name === "text" && macro !== "") {
				addMacro(jsTreeData, cslData, macro);
			}
		}

		return jsTreeData;
	};

	var addMacro = function (jsTreeData, cslNode, macroName) {
		var macroNodes,
			macroNode,
			lastCslId,
			index;

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
			if (new CSLEDIT.CslNode(node).getAttr("name") === macroName) {
				macroNode = node;
				return false;
			}
		});

		if (typeof macroNode === "undefined") {
			console.log('WARNING: macro "' + macroName + '" doesn\'t exist');
			return;
		}
		
		lastCslId = [macroNode.cslId];
		
		// add the macro's children to this node
		$.each(macroNode.children, function (i, childNode) {
			jsTreeData.children.push(jsTreeDataFromCslData_inner(childNode, lastCslId, true));
		});

		macroLinks.push({
			instanceCslId : cslNode.cslId, 
			first: macroNode.cslId, last: lastCslId[0] });
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

		// Shift references to the macro definition
		macroLinksShiftCslIds(id, nodesAdded);

		// TODO: check if new node is a macro instance
		parentNodes = treeElement.find('li[cslid=' + parentId + '][macrolink="true"]');

		// shift references to the instance cslIds
		$.each(macroLinks, function (i, macroLink) {
			if (macroLink.instanceCslId >= id) {
				macroLink.instanceCslId += nodesAdded;
			}
		});

		// Add macro node children to all instances
		$.each(macroLinks, function(i, macroLink) {
			if (macroLink.first === parentId) {
				parentNodes = parentNodes.add(
					treeElement.find('li[cslid=' + macroLink.instanceCslId + ']'));
				assert(parentNodes.length > 0);
			}
		});

		
		parentNodes.each(function () {
			createSubTree($(this), position,
				jsTreeDataFromCslData_inner(newNode, [id], true));
		});
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
				break;
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

	var macroLinksUpdateNode = function (id, _amendedNode) {
		var amendedNode = new CSLEDIT.CslNode(_amendedNode),
			macroName,
			jsTreeData = {children: [], attr: [], data: ""},
			removeChildren = false,
			addNewChildren = false;

		if (amendedNode.name !== "text") {
			return;
		}
		
		macroName = amendedNode.getAttr("macro");
		if (macroName === "") {
			removeChildren = true;
		} else if (amendedNode.name === "text") {
			addMacro(jsTreeData, amendedNode, macroName);
			removeChildren = true;
			addNewChildren = true;
		}

		if (removeChildren || addNewChildren) {
			treeElement.find('[cslid=' + amendedNode.cslId + ']').each( function () {
				var $this = $(this);
				if (removeChildren) {
					$.jstree._reference(treeElement)._get_children($this).each(function () {
						treeElement.jstree('remove', $(this));
					});
				}
				if (addNewChildren) {
					$.each(jsTreeData.children, function (i, child) {
						createSubTree($this, i, child);
					});
				}
			});
		}
	};

	var addNode = function (parentId, position, newNode, nodesAdded) {
		var id,	parentNode,	thisRangeIndex,	currentCslId, range,
			matchingCslNodes, newTreeNode;

		id = newNode.cslId;

		// note: no two ranges are expected to have the same parent id
		thisRangeIndex = rangeIndex(parentId);

		// shift ranges
		$.each(ranges, function (index, range) {
			shiftCslIds(range, id, nodesAdded);
			
			// if adding to the end of a range, expand the range
			if (thisRangeIndex === index && id > range.last) {
				range.last += nodesAdded;
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
					createSubTree(-1, "last", newJsTreeNode);
					
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

		
		if (!pathContainsLeafNode(CSLEDIT.data.getNodePath(newNode.cslId))) {
			parentNode = treeElement.find('li[cslid="' + parentId + '"][macrolink!="true"]');
			assertEqual(parentNode.length, 1);
			createSubTree(parentNode, position, jsTreeDataFromCslData_inner(newNode, [id]));
			macroLinksUpdateNode(newNode.cslId, newNode);
		}
		verifyTree();
	};

	var totalCreateNodeTime = 0;

	// needed because "create_node" doesn't allow adding nodes with children
	var createSubTree = function (parentNode, position, jsTreeData) {
		var newNode;

		newNode = treeElement.jstree('create_node', parentNode, position, 
			{
				data : jsTreeData.data
				// attr : jsTreeData.attr
				// Don't know why, but 'create_node' fails if including a
				// 'ref' attribute on a root node. It works to just add the
				// attribute later though
			});
		newNode.attr(jsTreeData.attr);

		$.each(jsTreeData.children, function (i, child) {
			createSubTree(newNode, i, child);
		});
	};

	var shiftCslIds = function (range, fromId, amount) {
		var cslId;

		if (range.first >= fromId) {
			range.rootNode.attr("cslid", parseInt(range.rootNode.attr("cslid")) + amount);
			range.rootNode.find('li[cslid][macroLink!="true"]').each( function () {
				cslId = parseInt($(this).attr("cslid"));
				assert(cslId <= range.last);
				if (cslId >= range.first) {
					$(this).attr("cslid", cslId + amount);
				}
			});
			
			range.first += amount;
			range.last += amount;
		} else if (range.last >= fromId) {
			range.rootNode.find('li[cslid][macroLink!="true"]').each( function () {
				cslId = parseInt($(this).attr("cslid"));
				assert(cslId <= range.last);
				if (cslId >= fromId) {
					$(this).attr("cslid", cslId + amount);
				}
			});
			range.last += amount;
		}
	};

	var deleteNode = function (id, nodesDeleted) {
		var node,
			thisRangeIndex = rangeIndex(id),
			allNodes,
			currentCslId,
			range;

		// shift ranges, except for ones containing the deleted node
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
			ranges.splice(thisRangeIndex, 1);

			treeElement.jstree("remove", range.rootNode);

		} else { // update range
			node = treeElement.find('li[cslid="' + id + '"][macrolink!="true"]');
			assert(node.length > 0);
			assert(id !== 0);

			treeElement.jstree("remove", node);

			// shift this range
			shiftCslIds(range, id, -nodesDeleted);
		}

		verifyTree();
	};

	var amendNode = function (id, amendedNode) {
		var thisRangeIndex = rangeIndex(id),
			nodes = treeElement.find('li[cslid="' + id + '"]');

		nodes.each(function () {
			treeElement.jstree('rename_node', $(this), CSLEDIT.uiConfig.displayNameFromNode(amendedNode));
		});
		
		if (thisRangeIndex === -1) {
			return;
		}

		if (enableMacroLinks) {
			macroLinksUpdateNode(amendedNode.cslId, amendedNode);
		}
		
		verifyTree();
	};

	var getSelectedNodePath = function () {
		var selectedNodes = [],
			treeNode,
			cslId;

		treeNode = treeElement.jstree('get_selected'),
		cslId = treeNode.attr("cslid");

		while (typeof cslId !== "undefined") {
			selectedNodes.splice(0,0,parseInt(cslId));
			
			treeNode = treeNode.parent().parent();
			cslId = treeNode.attr("cslid");
		}

		return selectedNodes;
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
		amendNode : amendNode,

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
		},
		getSelectedNodePath : getSelectedNodePath,

		collapseAll : function () {
			treeElement.jstree("close_all");
		}
	};
};
