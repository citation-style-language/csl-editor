"use strict";

CSLEDIT = CSLEDIT || {};

CSLEDIT.infoPropertyPanel = (function () {
	var panel, infoNode, inputTimeout;

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
	var multipleNodes = ["link","author","contributor","category"];
	var attributeNodes = ["link", "category"];
	var nameNodes = ["author", "contributor"];

	var attributeEditorRow = function (item, node, attributes) {
		var thisRow = $('<div><\/div>');
		$.each(attributes, function (name, value) {
			var input, attribute, value;
			thisRow.append(' <label>' + name + '<\/label> ');

			attribute = CSLEDIT.data.getAttrByName(node.attributes, name);

			value = "";
			if (attribute !== null) {
				value = attribute.value;
			}
			
			input = createInput(item.node, node, name, value);
			thisRow.append(input);
		});
		return thisRow;
	};

	var createInput = function (nodeName, node, type, value, parentCslId) {
		var input = $('<input><\/input>');
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
				numNodesInParent;

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
				CSLEDIT.controller.exec('addNode', [parentId, "last", thisNode]);
				parentNode = CSLEDIT.data.getNode(parentId);
				numNodesInParent = CSLEDIT.data.numNodes(parentNode);

				//setupPanel(panel);
				// update all cslids
				$.each(["cslid", "parentcslid"], function (i, attribute) {
					panel.find('input[' + attribute + ']').each(function() {
						var $this = $(this),
							cslId;
					
						cslId = parseInt($this.attr(attribute));

						if (cslId >= parentId + numNodesInParent) {
							$this.attr(attribute, cslId + 1);
						}
					});
				});

				// set added node cslid
				$this.removeAttr("parentcslid");
				$this.attr("cslid", parentId + numNodesInParent);
			} else {
				CSLEDIT.controller.exec('ammendNode', [cslId, thisNode]);
			}
		}, 500);
	};

	var textValueEditorRow = function (item, node) {
		var thisRow, value = "";

		thisRow = $('<div><\/div>');
		thisRow.append(' <label>' + item.name + '<\/label> ');

		if (typeof node !== "undefined") {
			value = node.textValue;
		}
		thisRow.append(createInput(item.node, node, "textValue", value));
		return thisRow;
	};

	var nameEditorRow = function (item, cslNode) {
		var thisRow, children, input, cslChildren;
	   
		thisRow = $('<div><\/div>');
		children = CSLEDIT.schema.childElements("info/author");

		cslChildren = {};
		$.each(cslNode.children, function (i, actualChild) {
			cslChildren[actualChild.name] = actualChild;
		});

		$.each(children, function (child, unused) {
			var value = "";

			thisRow.append(' <label>' + child + '<\/label> ');
			//input = $('<input class="' + item.node + '-' + child + '"><\/input>');

			if (child in cslChildren) {
				value = cslChildren[child].textValue;
			}
			input = createInput(child, cslChildren[child], "textValue", value, cslNode.cslId);
			thisRow.append(input);
		});
		return thisRow;
	};

	var editorRow = function (item, node, attributes) {
		if (attributeNodes.indexOf(item.node) >= 0) {
			return attributeEditorRow(item, node, attributes);
		} else if (nameNodes.indexOf(item.node) >=0) {
			return nameEditorRow(item, node);
		} else {
			return textValueEditorRow(item, node);
		}
	};

	// It's assumed that infoNode will always refer to the correct node
	// while the panel is visible
	var setupPanel = function (_panel) {
		panel = _panel;
		infoNode = CSLEDIT.data.getNodesFromPath("style/info");
		assertEqual(infoNode.length, 1);
		infoNode = infoNode[0];

		panel.children().remove();
		//panel.append('<h3>Style Info<\/h3>');

		$.each(layout, function (i, item) {
			var nodes = CSLEDIT.data.getNodesFromPath("info/" + item.node, infoNode);;
			var attributes, deleteButton, addButton, value, thisRow,
				table,
				titleRow, inputRow;
			
			if (multipleNodes.indexOf(item.node) >= 0) {
				attributes = CSLEDIT.schema.attributes("info/" + item.node);
				panel.append('<h4>' + pluralise(item.name) + '<\/h4>');
				table = $("<table><\/table>");
				$.each(nodes, function (i, node) {
					thisRow = editorRow(item, node, attributes);
					console.log("thisRow = " + thisRow.html());

					// convert 1st thisRow into table title
					if (typeof titleRow === "undefined") {
						titleRow = $('<tr><\/tr>');
						thisRow.find('label').each(function () {
							titleRow.append($('<td><\/td>').append($(this)));
						});
						table.append(titleRow);
					}
					
					// convert thisRow into table row
					inputRow = $('<tr><\/tr>');
					thisRow.find('input').each(function () {
						inputRow.append($('<td><\/td>').append($(this)));
					});

					deleteButton = $('<button>Delete<\/button>');
					deleteButton.on('click', function () {
						CSLEDIT.controller.exec("deleteNode", [node.cslId]);
						setupPanel(panel);
					});

					inputRow.append($('<td><\/td>').append(deleteButton));
					table.append(inputRow);
				});

				panel.append(table);
				
				addButton = $('<button>Add ' + item.name + '<\/button>');
				panel.append(addButton);

				addButton.on('click', function () {
					CSLEDIT.controller.exec("addNode",
						[infoNode.cslId, "last", new CSLEDIT.CslNode(item.node)]);
					setupPanel(panel);
				});
				panel.append('<br \/><br \/>');
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
