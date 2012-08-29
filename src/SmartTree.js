"use strict";

define([	'src/uiConfig',
			'src/CslNode',
			'src/options',
			'src/dataInstance',
			'src/urlUtils',
			'src/notificationBar',
			'src/debug',
			'jquery.jstree-patched',
			'jquery.hotkeys'
		], function (
			CSLEDIT_uiConfig,
			CSLEDIT_CslNode,
			CSLEDIT_options,
			CSLEDIT_data,
			CSLEDIT_urlUtils,
			CSLEDIT_notificationBar,
			debug,
			jstree
		) {
	var CSLEDIT_SmartTree = function (treeElement, nodePaths, options) {
		var ranges,
			macroLinks, // like symlinks for macros
						// [{ instanceCslId: ?, macroRange: ?}]
			callbacks,
			verifyAllChanges = false, // does a complete check against CSLEDIT_data after
									  // every change for debugging
			oldSelectedNode = -1,
			leafNodes = [];

		if (options && options.data) {
			CSLEDIT_data = options.data;
		}
		if (options && options.leafNodes) {
			leafNodes = options.leafNodes;
		}

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
			var cslData = CSLEDIT_data.get();

			if (verifyAllChanges) {
				debug.time("verifyTree");
				// Check for inconsistencies with CSLEDIT_data
				treeElement.find('li[cslid]').each(function () {
					var $this = $(this),
						cslId;

					cslId = parseInt($this.attr('cslid'), 10);
					debug.assertEqual(CSLEDIT_data.getNode(cslId, cslData).name, $this.attr('rel'));
				});

				// Can't have non-macrolink nodes as children of a text node
				debug.assertEqual(treeElement.find('li[cslid][rel=text] li[macrolink!=true]').length, 0);
				debug.timeEnd("verifyTree");
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
					debug.assertEqual(range.rootNode.length, 1);
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
			$.each(CSLEDIT_uiConfig.nodeIcons, function (type, icon) {
				nodeTypes[type] = { icon : { image : CSLEDIT_urlUtils.getResourceUrl(icon) } };
			});

			treeElement.jstree({
				"json_data" : { data : jsTreeData },
				"types" : { types : nodeTypes },
				"plugins" : ["themes", "json_data", "ui", "crrm", "dnd", /*"contextmenu",*/
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
								parseInt(move.o.attr("cslid"), 10),
								parseInt(move.r.attr("cslid"), 10), move.p);
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
				cslData = CSLEDIT_data.get();

			ranges = [];
			macroLinks = [];

			$.each(nodePaths, function (i, path) {
				var nodes = CSLEDIT_data.getNodesFromPath(path, cslData);
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

		var jsTreeDataFromCslData_inner = function (cslData, lastCslId, macroLink, parentMacros) {
			var index,
				children = [],
				cslNodes = [],
				thisCslNode,
				rel;

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
						cslData.children[index], lastCslId, macroLink, parentMacros));
				}
			}

			var jsTreeData = {
				data : CSLEDIT_uiConfig.displayNameFromNode(cslData),
				attr : {
					rel : cslData.name,
					cslid : cslData.cslId
				},
				children : children
			};

			if (cslData.name === "text") {
				thisCslNode = new CSLEDIT_CslNode(cslData);
				if (thisCslNode.hasAttr("macro")) {
					jsTreeData.attr["data-mode"] = "macro";
				}
			}

			if (typeof macroLink !== "undefined") {
				jsTreeData.attr.macrolink = macroLink;
			}

			if (options && options.enableMacroLinks) {
				// Add 'symlink' to Macro
				if (cslData.name === "text" && jsTreeData.attr["data-mode"] === "macro") {
					addMacro(jsTreeData, cslData, thisCslNode.getAttr("macro"), parentMacros);
				}
			}

			return jsTreeData;
		};

		var addMacro = function (jsTreeData, cslNode, macroName, parentMacros) {
			var macroNodes,
				macroNode,
				lastCslId,
				index,
				treeElements;

			if (typeof(parentMacros) === "undefined") {
			   parentMacros = [];
			} else {
				parentMacros = JSON.parse(JSON.stringify(parentMacros));
			}

			if (parentMacros.indexOf(macroName) === -1) {
				debug.assertEqual(macroName, new CSLEDIT_CslNode(cslNode).getAttr("macro"));
				parentMacros.push(macroName);
			} else {
				CSLEDIT_notificationBar.showMessage("Infinite loop detected in macro: " + macroName);
				debug.log("infinite loop macro parent: " + JSON.stringify(parentMacros));
				jsTreeData.attr["data-error"] = "Infinite loop";
				return;
			}

			// delete any existing macroLinks
			for (index = 0; index < macroLinks.length; index++) {
				if (macroLinks[index].instanceCslId === cslNode.cslId) {
					macroLinks.splice(index, 1);
					index--;
				}
			}

			// find the macro node:
			macroNodes = CSLEDIT_data.getNodesFromPath("style/macro");

			$.each(macroNodes, function (i, node) {
				if (new CSLEDIT_CslNode(node).getAttr("name") === macroName) {
					macroNode = node;
					return false;
				}
			});

			if (typeof macroNode === "undefined") {
				debug.log('WARNING: macro "' + macroName + '" doesn\'t exist');
				return;
			}
			
			lastCslId = [macroNode.cslId];
			
			// add the macro's children to this node
			$.each(macroNode.children, function (i, childNode) {
				jsTreeData.children.push(
					jsTreeDataFromCslData_inner(childNode, lastCslId, true, parentMacros));
			});

			macroLinks.push({
				instanceCslId : cslNode.cslId, 
				first: macroNode.cslId,
				last: lastCslId[0]
			});
		};

		var selectedNode = function () {
			var selected,
				cslid;

			selected = treeElement.jstree('get_selected'),
			cslid = parseInt(selected.attr("cslid"), 10);
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
				
				cslId = parseInt($this.attr('cslid'), 10);
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
			$.each(macroLinks, function (i, macroLink) {
				if (macroLink.first === parentId) {
					parentNodes = parentNodes.add(
						treeElement.find('li[cslid=' + macroLink.instanceCslId + ']'));
					debug.assert(parentNodes.length > 0);
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
			
			treeElement.find('li[cslid=' + nodeId + '][macrolink="true"]').each(function () {
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
					debug.log("WARNING: macro deleted, leaving broken instance links");
					// remove all children
					treeElement.find('li[cslid=' + macroLink.instanceCslId + '][macrolink!=true]').each(
						function () {
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
			var amendedNode = new CSLEDIT_CslNode(_amendedNode),
				macroName,
				jsTreeData = {children: [], attr: [], data: ""},
				removeChildren = false,
				updateNode = false;

			console.log("macroLinksUpdateNode in " + JSON.stringify(nodePaths));

			if (amendedNode.name !== "text") {
				return;
			}
			
			macroName = amendedNode.getAttr("macro");
			if (macroName === "") {
				removeChildren = true;
			} else if (amendedNode.name === "text") {
				addMacro(jsTreeData, amendedNode, macroName);
				removeChildren = true;
				updateNode = true;
			}

			if (removeChildren || updateNode) {
				treeElement.find('[cslid=' + amendedNode.cslId + ']').each(function () {
					var $this = $(this);
					if (removeChildren) {
						$.jstree._reference(treeElement)._get_children($this).each(function () {
							treeElement.jstree('remove', $(this));
						});
					}
					if (updateNode) {
						console.log("updating node in " + JSON.stringify(nodePaths));
						// update attributes
						if ("data-error" in jsTreeData.attr) {
							$this.attr("data-error", jsTreeData.attr["data-error"]);
						} else {
							$this.removeAttr("data-error");
						}

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

			if (options && options.enableMacroLinks) {
				macroLinksAddNode(parentId, position, newNode, nodesAdded);
			}

			if (thisRangeIndex === -1) {
				matchingCslNodes = [];
				// check if the new node belongs to this smartTree
				$.each(nodePaths, function (i, path) {
					matchingCslNodes = matchingCslNodes.concat(CSLEDIT_data.getNodesFromPath(path));
				});

				$.each(matchingCslNodes, function (i, node) {
					var lastCslId = [-1];
					if (node.cslId >= newNode.cslId && node.cslId < newNode.cslId + nodesAdded) {
						var newJsTreeNode;
						newJsTreeNode = jsTreeDataFromCslData_inner(node, lastCslId);
						createSubTree(-1, "last", newJsTreeNode);
						
						var newTreeNode = treeElement.find('li[cslid="' + node.cslId + '"]');
						ranges.push({
							first : node.cslId,
							last : node.cslId + CSLEDIT_data.numNodes(node) - 1,
							rootNode : newTreeNode
						});
						
						return false;
					}
				});

				return;
			}
			range = ranges[thisRangeIndex];

			
			if (!pathContainsLeafNode(CSLEDIT_data.getNodePath(newNode.cslId))) {
				parentNode = treeElement.find('li[cslid="' + parentId + '"][macrolink!="true"]');
				debug.assertEqual(parentNode.length, 1);
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
				range.rootNode.attr("cslid", parseInt(range.rootNode.attr("cslid"), 10) + amount);
				range.rootNode.find('li[cslid][macroLink!="true"]').each(function () {
					cslId = parseInt($(this).attr("cslid"), 10);
					debug.assert(cslId <= range.last);
					if (cslId >= range.first) {
						$(this).attr("cslid", cslId + amount);
					}
				});
				
				range.first += amount;
				range.last += amount;
			} else if (range.last >= fromId) {
				range.rootNode.find('li[cslid][macroLink!="true"]').each(function () {
					cslId = parseInt($(this).attr("cslid"), 10);
					debug.assert(cslId <= range.last);
					if (cslId >= fromId) {
						$(this).attr("cslid", cslId + amount);
					}
				});
				range.last += amount;
			}
		};

		var removeTreesWithin = function (firstId, lastId) {
			var rangesToRemove = {};
			
			// TODO: write unit test for this
			$.each(ranges, function (index, range) {
				if (range.first >= firstId && range.first <= lastId) {
					rangesToRemove[index] = range;
				}
			});
			
			$.each(rangesToRemove, function (index, range) {
				debug.log("deleting range " + index);
				ranges.splice(index, 1);
				treeElement.jstree("remove", range.rootNode);
			});
		};

		var deleteNode = function (id, nodesDeleted) {
			var node,
				thisRangeIndex,
				allNodes,
				currentCslId,
				range;

			debug.log("delete node " + id + ", amount = " + nodesDeleted);

			removeTreesWithin(id, id + nodesDeleted - 1);
		
			thisRangeIndex = rangeIndex(id),

			// shift ranges, except for ones containing the deleted node
			$.each(ranges, function (index, range) {
				if (thisRangeIndex !== index) {
					shiftCslIds(range, id + nodesDeleted, -nodesDeleted);
				}
			});

			if (options && options.enableMacroLinks) {
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
				debug.assert(node.length > 0);
				debug.assert(id !== 0);

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
				treeElement.jstree('rename_node', $(this), CSLEDIT_uiConfig.displayNameFromNode(amendedNode));
			});

			console.log("amendNode in " + JSON.stringify(nodePaths) + " : " + thisRangeIndex);
			
			if (nodes.length === 0) {
				return;
			}

			if (options && options.enableMacroLinks) {
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
				selectedNodes.splice(0, 0, parseInt(cslId, 10));
				
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

	return CSLEDIT_SmartTree;
});
