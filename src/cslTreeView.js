"use strict";

CSLEDIT = CSLEDIT || {};

CSLEDIT.CslTreeView = function (treeView) {
	var createFromCslData = function (cslData, callbacks) {
		var eventName,
			jsTreeData;

		jsTreeData = jsTreeDataFromCslData(cslData);

		treeView.on("loaded.jstree", callbacks.loaded);
		treeView.on("select_node.jstree", callbacks.selectNode);

		// override drag_stop function
		//$.vakata.dnd.drag_stop = function () {alert("drag stop");};

		treeView.jstree({
			"json_data" : { data : [ jsTreeData ] },
			"types" : {
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
				
			// each plugin you have included can have its own config object
			//"core" : { "initially_open" : [ "node1" ] },
			"ui" : { /*"initially_select" : [ "cslTreeNode0" ],*/ "select_limit" : 1 },
			"dnd" : {
				/*
				"drop_target" : false,
				"drag_target" : function () {alert("drag!");},
				"drop_finish" : function () {alert("drop!");},
				"drag_finish" : function () {alert("drop!");},*/
				"open_timeout" : 800
			},
			"plugins" : ["themes","json_data","ui", "crrm", "dnd", /*"contextmenu",*/
				"types", "hotkeys"],
			"crrm" : {
				"move" : {
					// only allow re-ordering, not moving to different nodes
					"check_move" : function (move) {

						return true;

						var	newGrandParent = this._get_parent(move.np),
							newGrandParentName,
							nodePath,
							thisNodeName = move.o.data().name;

						if (typeof newGrandParent.data !== "function") {
							newGrandParentName = "root";
						} else {
							newGrandParentName = newGrandParent.data().name;
						}
						nodePath =
							newGrandParentName + "/" + move.np.data().name;

						if (thisNodeName in CSLEDIT.schema.childElements(nodePath)) {
							return true;
						}
						return false;
					}
				}
			},
			"hotkeys" : {
				"del" : callbacks.deleteNode,
				"f2" : false
			}
			
		});
	};

	var addNode = function (id, position, newNode) {
		var parentNode;
		console.log("adding to node " + id);
		parentNode = treeView.find('li[cslid="' + id + '"]');
		assertEqual(parentNode.length, 1);

		treeView.jstree('create_node', parentNode, position,
		{
			"data" : displayNameFromMetadata(newNode),
			"attr" : { "rel" : newNode.name, "cslid" : -1 },
			"children" : []
		});

		// sort the cslids
		var allNodes;
		allNodes = treeView.find('li[cslid]');

		assert(allNodes.length > 1);

		allNodes.each(function (index) {
			var oldId = parseInt($(this).attr('cslid'));

			if (oldId === -1) {
				$(this).attr('cslid', id + position + 1);
			} else if (oldId > id + position) {
				$(this).attr('cslid', oldId + 1);
			}

			// TODO: remove when confident that this always holds,
			//       if it doesn't, need to alter deleteNode
			assertEqual(parseInt($(this).attr('cslid')), index);
		});
	};

	var deleteNode = function (id) {
		var node = treeView.find('li[cslid="' + id + '"]');
		assertEqual(node.length, 1);
		assert(id !== 0);

		treeView.jstree("remove", node);

		// sort the cslids
		var allNodes;
		allNodes = treeView.find('li[cslid]');
		assert(allNodes.length > 0);
		allNodes.each(function (index) {
			$(this).attr('cslid', index);
		});
	};

	var ammendNode = function (id, ammendedNode) {
		var node = treeView.find('li[cslid="' + id + '"]');
		
		treeView.jstree('rename_node', node, displayNameFromMetadata(ammendedNode));
	};

	var selectNode = function (id) {
		treeView.find('li[cslid=' + id + '] > a').click();
	};

	var selectedNode = function () {
		var selected,
			cslid;
		
		selected = treeView.jstree('get_selected'),
		cslid = parseInt(selected.attr("cslid"));
		console.log("selected cslid = " + cslid);
		return cslid;
	};

	var expandNode = function (id) {
		treeView.jstree("open_node", 'li[cslid=' + id + ']');
	};

	var jsTreeDataFromCslData = function (cslData) {
		var jsTreeData = jsTreeDataFromCslData_inner(cslData);

		// make root node open
		jsTreeData["state"] = "open";

		return jsTreeData;
	};

	var jsTreeDataFromCslData_inner = function (cslData) {
		var index;
		var children = [];

		for (index = 0; index < cslData.children.length; index++) {
			children.push(jsTreeDataFromCslData_inner(cslData.children[index]));
		}

		var jsTreeData = {
			data : displayNameFromMetadata(cslData),
			attr : {
				rel : cslData.name,
				cslid : cslData.cslId //,
				//id : "cslTreeNode" + cslData.cslId
			},
			// TODO: remove this
			/*metadata : {
				name : cslData.name,
				attributes: cslData.attributes,
				cslId : cslData.cslId,
				textValue : cslData.textValue
			},*/
			children : children
		};

		return jsTreeData;
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

	// public:
	return {
		createFromCslData : createFromCslData,

		addNode : addNode,
		deleteNode : deleteNode,
		ammendNode : ammendNode,

		selectNode : selectNode,
		selectedNode : selectedNode,

		expandNode : expandNode,

		jQueryElement : treeView
	}
};
