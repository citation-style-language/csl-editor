"use strict";

// A custom property panel for the 'style/info' node
//
// This could do with a redesign (see long standing minor bug #129)
//
// Migrating to use mustache for most of the HTML generation may help

define(
		[	'src/CslNode',
			'src/dataInstance',
			'src/options',
			'src/debug'
		], function (
			CSLEDIT_CslNode,
			CSLEDIT_data,
			CSLEDIT_options,
			debug
		) {
	var panel, infoNode, inputTimeout, executeCommand;

	var layout = [
		{ name : "Title", node : "title" },
		{ name : "Title (short)", node : "title-short" },
		{ name : "ID", node : "id" },
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
	var multipleNodes = ["link", "author", "contributor", "category", "issn"];
	var attributeNodes = ["link", "category"];
	var nameNodes = ["author", "contributor"];

	var attributeEditorRow = function (item, node, schemaAttributes) {
		var thisRow = $('<div/>');
		$.each(schemaAttributes, function (name) {
			var input, attributeValue;
			thisRow.append(' ').append($('<label/>').text(name));

			attributeValue = new CSLEDIT_CslNode(node).getAttr(name);

			input = createInput(item.node, node, name, attributeValue);
			thisRow.append(input);
		});
		return thisRow;
	};

	var createInput = function (nodeName, node, type, value, parentCslId) {
		var input = $('<input/>');
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

			cslId = parseInt($this.attr("cslid"), 10);
			parentId = parseInt($this.attr("parentcslid"), 10);
			type = $this.attr("type");
			nodeName = $this.attr("nodename");

			thisNode = new CSLEDIT_CslNode(nodeName);
			if (!isNaN(cslId)) {
				thisNode = new CSLEDIT_CslNode(CSLEDIT_data.getNode(cslId));
			}

			if (type === "textValue") {
				thisNode.textValue = $this.val();
				if (thisNode.textValue === "") {
					// TODO: deleting in this way redraws the whole panel, losing the
					//       cursor position, which would be nice to retain.
					deleteNode(cslId);
					return;
				}
			} else {
				thisNode.setAttr(type, $this.val());
				thisNode.setAttrEnabled(type, $this.val() !== "");
			}

			if (isNaN(cslId)) {
				CSLEDIT_viewController.setSuppressSelectNode(true);
				executeCommand('addNode', [parentId, "last", thisNode]);
				CSLEDIT_viewController.setSuppressSelectNode(false);
				parentNode = CSLEDIT_data.getNode(parentId);
				numChildNodes = CSLEDIT_data.numNodes(parentNode) - 1;

				// update all cslids
				$.each(["cslid", "parentcslid"], function (i, attribute) {
					panel.find('input[' + attribute + ']').each(function () {
						var $this = $(this),
							cslId;
					
						cslId = parseInt($this.attr(attribute), 10);

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

		thisRow = $('<div/>');
		thisRow.append(' ').append($('<label/>').text(item.name)).append(' '); 
		if (typeof node !== "undefined") {
			value = node.textValue;
		}
		thisRow.append(createInput(item.node, node, "textValue", value));
		return thisRow;
	};

	var nameEditorRow = function (item, cslNode) {
		var thisRow, children, input, cslChildren;
	   
		thisRow = $('<div/>');
		children = CSLEDIT_schema.childElements("info/author");

		cslChildren = {};
		$.each(cslNode.children, function (i, actualChild) {
			cslChildren[actualChild.name] = actualChild;
		});

		$.each(children, function (child, unused) {
			var value = "";

			thisRow.append(' ').append($('<label/>').text(child)).append(' ');

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
		} else if (nameNodes.indexOf(item.node) >= 0) {
			return nameEditorRow(item, node);
		} else {
			row = textValueEditorRow(item, node);
			row.find("input").css({width:"400px"});
			return row;
		}
	};

	// deletes a child node of style/info
	var deleteNode = function (cslId) {
		CSLEDIT_viewController.setSuppressSelectNode(true);
		executeCommand("deleteNode", [cslId]);
		CSLEDIT_viewController.setSuppressSelectNode(false);
		CSLEDIT_viewController.selectNode(infoNode.cslId);
	};

	// Set up a property panel for the style/info node
	//
	// - _panel - the jQuery element to create the panel within
	// - _executeCommand - the function to call to issue commands (e.g. CSLEDIT_controller.exec)
	var setupPanel = function (_panel, _executeCommand) {
		var simpleTextNodesTable = $('<table/>');
		
		panel = _panel;
		executeCommand = _executeCommand;
		infoNode = CSLEDIT_data.getNodesFromPath("style/info");
		debug.assertEqual(infoNode.length, 1); // fail in error.log
		infoNode = infoNode[0];

		panel.children().remove();

		panel.append(simpleTextNodesTable);

		$.each(layout, function (i, item) {
			var nodes = CSLEDIT_data.getNodesFromPath("info/" + item.node, infoNode),
				schemaAttributes, deleteButton, addButton, value, thisRow,
				table,
				titleRow, inputRow;
			
			if (multipleNodes.indexOf(item.node) >= 0) {
				schemaAttributes = {};
				$.each(CSLEDIT_schema.attributes("info/" + item.node), function (attrName, attr) {
					schemaAttributes[attrName] = attr;
				});
				
				// add choices to attributes
				// TODO: correct this to treat choices as mutaully exclusive
				//       as they should be
				$.each(CSLEDIT_schema.choices("info/" + item.node), function (i, choice) {
					$.each(choice.attributes, function (attrName, attr) {
						schemaAttributes[attrName] = attr;
					});
				});

				panel.append($('<h4/>').text(pluralise(item.name)));
				table = $("<table/>");
				$.each(nodes, function (i, node) {
					thisRow = editorRow(item, node, schemaAttributes);

					// convert 1st thisRow into table title
					if (typeof titleRow === "undefined") {
						titleRow = $('<tr/>');
						thisRow.find('label').each(function () {
							titleRow.append($('<td/>').append($(this)));
						});
						table.append(titleRow);
					}
					
					// convert thisRow into table row
					inputRow = $('<tr/>');
					thisRow.find('input').each(function () {
						inputRow.append($('<td/>').append($(this)));
					});

					deleteButton = $('<button>Delete</button>');
					deleteButton.on('click', function () {
						deleteNode(node.cslId);
					});

					inputRow.append($('<td/>').append(deleteButton));
					table.append(inputRow);
				});

				panel.append(table);
				
				addButton = $('<button/>').text('Add ' + item.name);
				panel.append(addButton);

				addButton.on('click', function () {
					CSLEDIT_viewController.setSuppressSelectNode(true);
					executeCommand("addNode",
						[infoNode.cslId, "last", new CSLEDIT_CslNode(item.node)]);
					CSLEDIT_viewController.setSuppressSelectNode(false);
					setupPanel(panel, executeCommand);
				});
				panel.append('<br /><br />');
			} else {
				debug.assert(nodes.length < 2);
				thisRow = editorRow(item, nodes[0], null);

				panel.append(thisRow);

				var configuration = CSLEDIT_options.get('propertyPanelOptions');
				var description = '';

				if (typeof(configuration) !== 'undefined' && typeof(configuration[item.node]) !== 'undefined') {
					description = $('<div/>').html(configuration[item.node].description);
					
					if (configuration[item.node].readonly) {
						thisRow.children('input').attr('readonly','readonly');
					}
				}
				simpleTextNodesTable.append($('<tr/>')
					.append($('<td/>').append(thisRow.children('label')))
					.append($('<td/>').append(thisRow.children('input')).append(description)));
			}
		});

	};

	return {
		setupPanel : setupPanel
	};
});
