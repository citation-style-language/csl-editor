"use strict";

CSLEDIT = CSLEDIT || {};

CSLEDIT.infoPropertyPanel = (function () {
	var panel, infoNode, inputTimeout, executeCommand;

	var layout = [
		{ name : "Title", node : "title" },
		{ name : "Title (short)", node : "title-short" },
		{ name : "Id", node : "id" },
		{ name : "Summary", node : "summary" },
		{ name : "Rights", node : "rights" },
		{ name : "Published", node : "published" },
		{ name : "ISSNL", node : "issnl" },
		{ name : "eISSN", node : "eissn" },
		{ name : "ISSN", node : "issn" },
		// hiding "Updated" for now
		// if it goes back, it needs updating on each change
		// { name : "Updated", node : "updated" },
		{ name : "Link", node : "link" },
		{ name : "Author", node : "author" },
		{ name : "Contributor", node : "contributor" },
		{ name : "Category", node : "category" }
	];

	var pluralise = function (noun) {
		if (noun[noun.length - 1] === "y") {
			return noun.replace(/y$/, "ies");
		} else {
			return noun + "s";
		}
	};

	// TODO: could probably get some of this info from the schema
	var multipleNodes = ["link","author","contributor","category","issn"];
	var attributeNodes = ["link", "category"];
	var nameNodes = ["author", "contributor"];

	var attributeEditorRow = function (item, node, schemaAttributes) {
		var thisRow = $('<div></div>');
		$.each(schemaAttributes, function (name) {
			var input, attributeValue;
			thisRow.append(' <label>' + name + '</label> ');

			attributeValue = new CSLEDIT.CslNode(node).getAttr(name);

			input = createInput(item.node, node, name, attributeValue);
			thisRow.append(input);
		});
		return thisRow;
	};

	var createInput = function (nodeName, node, type, value, parentCslId) {
		var input = $('<input></input>');
		if (typeof node === "undefined" || node === null) {
			if (typeof parentCslId === "undefined") {
				input.attr("parentcslid", infoNode.cslId);
			} else {
				input.attr("parentcslid", parentCslId);
			}
		} else {
			input.attr("cslid", node.cslId);
		}
		input.attr("type", type);
		input.attr("nodename", nodeName);
		input.val(value);
		input.on('input', onInput);

		return input;
	};

	var onInput = function () {
		var $this = $(this);

		clearTimeout(inputTimeout);
		inputTimeout = setTimeout(function () {
			var cslId,
				parentId,
				type,
				nodeName,
				thisNode,
				index,
				parentNode,
				numChildNodes;

			cslId = parseInt($this.attr("cslid"));
			parentId = parseInt($this.attr("parentcslid"));
			type = $this.attr("type");
			nodeName = $this.attr("nodename");

			thisNode = new CSLEDIT.CslNode(nodeName);
			if (!isNaN(cslId)) {
				thisNode.copy(CSLEDIT.data.getNode(cslId));
			}

			if (type === "textValue") {
				thisNode.textValue = $this.val();
			} else {
				thisNode.setAttr(type, $this.val()); 
			}

			if (isNaN(cslId)) {
				CSLEDIT.viewController.setSuppressSelectNode(true);
				executeCommand('addNode', [parentId, "last", thisNode]);
				CSLEDIT.viewController.setSuppressSelectNode(false);
				parentNode = CSLEDIT.data.getNode(parentId);
				numChildNodes = CSLEDIT.data.numNodes(parentNode) - 1;

				// update all cslids
				$.each(["cslid", "parentcslid"], function (i, attribute) {
					panel.find('input[' + attribute + ']').each(function() {
						var $this = $(this),
							cslId;
					
						cslId = parseInt($this.attr(attribute));

						if (cslId >= parentId + numChildNodes) {
							$this.attr(attribute, cslId + 1);
						}
					});
				});

				// set added node cslid
				$this.removeAttr("parentcslid");
				$this.attr("cslid", parentId + numChildNodes);
			} else {
				executeCommand('amendNode', [cslId, thisNode]);
			}
		}, 500);
	};

	var textValueEditorRow = function (item, node) {
		var thisRow, value = "";

		thisRow = $('<div></div>');
		thisRow.append(' <label>' + item.name + '</label> ');

		if (typeof node !== "undefined") {
			value = node.textValue;
		}
		thisRow.append(createInput(item.node, node, "textValue", value));
		return thisRow;
	};

	var nameEditorRow = function (item, cslNode) {
		var thisRow, children, input, cslChildren;
	   
		thisRow = $('<div></div>');
		children = CSLEDIT.schema.childElements("info/author");

		cslChildren = {};
		$.each(cslNode.children, function (i, actualChild) {
			cslChildren[actualChild.name] = actualChild;
		});

		$.each(children, function (child, unused) {
			var value = "";

			thisRow.append(' <label>' + child + '</label> ');
			//input = $('<input class="' + item.node + '-' + child + '"></input>');

			if (child in cslChildren) {
				value = cslChildren[child].textValue;
			}
			input = createInput(child, cslChildren[child], "textValue", value, cslNode.cslId);
			thisRow.append(input);
		});
		return thisRow;
	};

	var editorRow = function (item, node, schemaAttributes) {
		var row;
		if (attributeNodes.indexOf(item.node) >= 0) {
			return attributeEditorRow(item, node, schemaAttributes);
		} else if (nameNodes.indexOf(item.node) >=0) {
			return nameEditorRow(item, node);
		} else {
			row = textValueEditorRow(item, node);
			row.find("input").css({width:"400px"});
			return row;
		}
	};

	// It's assumed that infoNode will always refer to the correct node
	// while the panel is visible
	var setupPanel = function (_panel, _executeCommand) {
		panel = _panel;
		executeCommand = _executeCommand;
		infoNode = CSLEDIT.data.getNodesFromPath("style/info");
		assertEqual(infoNode.length, 1);
		infoNode = infoNode[0];

		panel.children().remove();

		$.each(layout, function (i, item) {
			var nodes = CSLEDIT.data.getNodesFromPath("info/" + item.node, infoNode),
				schemaAttributes, deleteButton, addButton, value, thisRow,
				table,
				titleRow, inputRow;
			
			if (multipleNodes.indexOf(item.node) >= 0) {
				schemaAttributes = {};
				$.each(CSLEDIT.schema.attributes("info/" + item.node), function (attrName, attr) {
					schemaAttributes[attrName] = attr;
				});
				
				// add choices to attributes
				// TODO: correct this to treat choices as mutaully exclusive
				//       as they should be
				$.each(CSLEDIT.schema.choices("info/" + item.node), function (i, choice) {
					$.each(choice.attributes, function (attrName, attr) {
						schemaAttributes[attrName] = attr;
					});
				});

				panel.append('<h4>' + pluralise(item.name) + '</h4>');
				table = $("<table></table>");
				$.each(nodes, function (i, node) {
					thisRow = editorRow(item, node, schemaAttributes);

					// convert 1st thisRow into table title
					if (typeof titleRow === "undefined") {
						titleRow = $('<tr></tr>');
						thisRow.find('label').each(function () {
							titleRow.append($('<td></td>').append($(this)));
						});
						table.append(titleRow);
					}
					
					// convert thisRow into table row
					inputRow = $('<tr></tr>');
					thisRow.find('input').each(function () {
						inputRow.append($('<td></td>').append($(this)));
					});

					deleteButton = $('<button>Delete</button>');
					deleteButton.on('click', function () {
						executeCommand("deleteNode", [node.cslId]);
						setupPanel(panel, executeCommand);
					});

					inputRow.append($('<td></td>').append(deleteButton));
					table.append(inputRow);
				});

				panel.append(table);
				
				addButton = $('<button>Add ' + item.name + '</button>');
				panel.append(addButton);

				addButton.on('click', function () {
					CSLEDIT.viewController.setSuppressSelectNode(true);
					executeCommand("addNode",
						[infoNode.cslId, "last", new CSLEDIT.CslNode(item.node)]);
					CSLEDIT.viewController.setSuppressSelectNode(false);
					setupPanel(panel, executeCommand);
				});
				panel.append('<br /><br />');
			} else {
				assert(nodes.length < 2);
				thisRow = editorRow(item, nodes[0], null);

				// TODO: do this in less hacky way
				panel.css("position", "relative");
				thisRow.children('input').eq(0).css("position", "absolute");
				thisRow.children('input').eq(0).css("left", "100px");
				thisRow.children('label').eq(0).css("line-height", "1.5");
				panel.append(thisRow);
			}
		});

	};

	return {
		setupPanel : setupPanel
	};
}());
