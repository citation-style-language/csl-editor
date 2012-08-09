"use strict";

define(['src/CslNode', 'src/cslData', 'src/debug'], function (CSLEDIT_CslNode, CSLEDIT_data, debug) {
	var onChangeTimeout, setupPanel, list, nodeData, panel, executeCommand,
		namesAttributeNames = [
			"names-min",
			"names-use-first",
			"names-use-last"
		];
	
	// TODO: put into a common place - copied from src/smartTree.js
	var getAttr = function (attribute, attributes) {
		var index;

		for (index = 0; index < attributes.length; index++) {
			if (attributes[index].enabled && attributes[index].key === attribute) {
				return attributes[index].value;
			}
		}
		return "";
	};

	var sortableListUpdated = function () {
		// iterate through nodeData and the UI element noting the changes
		
		var index = 0,
			dragDirection = "unknown", // the direction the user dragged
			fromId,
			toPosition;

		list.children().each(function () {
			var variable, macro, childNode, visibleKey;

			if (index >= nodeData.children.length) {
				assertEqual(dragDirection, "down");
				toPosition = nodeData.children.length - 1;
				return false;
			}

			visibleKey = $(this).find('select.sortKey').val();
			childNode = nodeData.children[index];
			assertEqual(childNode.name, "key");

			if (visibleFieldName(
					getAttr("macro", childNode.attributes),
					getAttr("variable", childNode.attributes)) !==
				visibleKey) {

				if (dragDirection === "up") {
					fromId = childNode.cslId;
					return false;
				} else if (dragDirection === "down") {
					toPosition = index - 1;
					return false;
				} else if (visibleFieldName(
					getAttr("macro", nodeData.children[index + 1].attributes),
					getAttr("variable", nodeData.children[index + 1].attributes)) ===
					visibleKey)
				{
					// The next data element matches, so this is an deletion,
					// and the user dragged down.
					dragDirection = "down";
					fromId = childNode.cslId;
					index++;
				} else {
					// The next data element doesn't match, so this is an addition,
					// and the user dragged up.
					dragDirection = "up";
					toPosition = index;
					index--;
				}
			}
		
			index++;
		});

		if (dragDirection === "up" && typeof fromId === "undefined") {
			fromId = nodeData.children[index].cslId;
		}

		CSLEDIT_viewController.setSuppressSelectNode(true);
		executeCommand("moveNode", [fromId, nodeData.cslId, toPosition]);
		CSLEDIT_viewController.setSuppressSelectNode(false);
		nodeData = CSLEDIT_data.getNode(nodeData.cslId);
	};

	var visibleFieldName = function (macro, variable) {
		if (macro !== "" && typeof macro !== "undefined") {
			return "Macro: " + macro;
		} else {
			return variable;
		}
	};

	var attributesFromVisibleFieldName = function (visibleName) {
		var attributes = [];

		if (visibleName.indexOf("Macro: ") === 0) {
			attributes.push({
				key : "macro",
				value : visibleName.slice("Macro: ".length),
				enabled : true
			});
		} else {
			attributes.push({
				key : "variable",
				value : visibleName,
				enabled : true
			});
		}

		return attributes;
	};

	var getNamesAttributes = function () {
		var attributes = [];

		$.each(namesAttributeNames, function (i, name) {
			var val = panel.find("select." + name).val();

			if (val !== "0") {
				attributes.push({
					key : name,
					value : val,
					enabled : true
				});
			}
		});

		return attributes;
	};

	var getKeyNodeData = function (index) {
		var keyNode = new CSLEDIT_CslNode("key");

		keyNode.attributes = attributesFromVisibleFieldName(
			list.find('select.sortKey').eq(index).val());

		keyNode.attributes = keyNode.attributes.concat(getNamesAttributes());
		return keyNode;
	};

	var onInput = function () {
		var listElements = list.find('li'),
			childIndex,
			keyNode;
	
		childIndex = listElements.index($(this).parent());
		keyNode = nodeData.children[childIndex];
		assertEqual(keyNode.name, "key");

		executeCommand("amendNode", [keyNode.cslId, 
			getKeyNodeData(childIndex)]);
	};

	var onDelete = function () {
		var listElements = list.find('li'),
			childIndex,
			cslId;
		
		childIndex = listElements.index($(this).parent());

		cslId = CSLEDIT_data.getNode(nodeData.cslId).children[childIndex].cslId;
		listElements.eq(childIndex).remove();
		executeCommand('deleteNode', [cslId]);
	};

	setupPanel = function (_panel, _nodeData, _executeCommand) {
		var table, macros, variables, index, addKeyButton, sortKeyHtml;

		panel = _panel;
		nodeData = _nodeData;
		executeCommand = _executeCommand;

		// clear panel 
		panel.children().remove();

		// sortable list
		list = $('<ul class="sortKeys"></ul>');
		list.appendTo(panel);
		list.sortable({
			update : sortableListUpdated
		});

		variables = [];
		$.each(CSLEDIT_schema.choices("sort/key")[0].attributes.variable.values, function (i, variable) {
			variables.push(variable.value);
		});

		macros = [];
		$.each(CSLEDIT_data.getNodesFromPath("style/macro"), function (i, node) {
			assertEqual(node.attributes[0].key, "name");
			macros.push(node.attributes[0].value);
		});

		sortKeyHtml = '<li class="ui-state-default">';
		sortKeyHtml += '<span class="ui-icon ui-icon-arrowthick-2-n-s"></span> ';
		sortKeyHtml += '<select class="sortKey">';
		$.each(macros, function (i, macro) {
			sortKeyHtml += '<option macro="' + macro + '">Macro: ' + macro + '</option>';
		});
		$.each(variables, function (i, variable) {
			sortKeyHtml += '<option variable="' + variable + '">' + variable + '</option>';
		});
		sortKeyHtml += '</select>';
		sortKeyHtml += ' <button class="deleteSortKey">Delete</button>';
		sortKeyHtml += '</li>';

		$.each(nodeData.children, function (i, child) {
			var row = $(sortKeyHtml),
				select,
				macro,
				variable;
			
			select = row.find("select.sortKey");
			assertEqual(select.length, 1);

			select.val(visibleFieldName(
				getAttr("macro", child.attributes),
				getAttr("variable", child.attributes)));

			list.append(row);
		});

		list.find('button.deleteSortKey').on('click', onDelete);

		list.find('select').on('change', onInput /*function () {
			var listElements = list.find('li'),
				childIndex,
				keyNode;
		
			childIndex = listElements.index($(this).parent());
			keyNode = nodeData.children[childIndex];
			assertEqual(keyNode.name, "key");

			executeCommand("amendNode", [keyNode.cslId, 
				getKeyNodeData(childIndex)]);
		}*/);

		addKeyButton = $('<button>Add key</button>');
		addKeyButton.on('click', function () {
			var selectNodes;

			CSLEDIT_viewController.setSuppressSelectNode(true);
			executeCommand('addNode', [nodeData.cslId, "last",
				new CSLEDIT_CslNode('key', [
					{
						key : "variable",
						value : "author",
						enabled : true
					}
				])]);
			CSLEDIT_viewController.setSuppressSelectNode(false);

			nodeData = CSLEDIT_data.getNode(nodeData.cslId);

			list.append(sortKeyHtml);
			selectNodes = list.find('select');
			selectNodes.on('change', onInput);
			selectNodes.last().val("author");

			list.find('button.deleteSortKey').last().on('click', onDelete);
		});
		panel.append(addKeyButton);
		panel.append('<br /><br />');

		(function () {
			var select;

			// TODO: only enable if sort keys contain a names element
			select = $('<select class="names-min"></select>');
			for (index = 0; index < 20; index++) {
				$('<option>' + index + '</option>').appendTo(select);
			}
			$('<label>Names-min: </label>').appendTo(panel);
			select.appendTo(panel);
			panel.append(' ');

			select = $('<select class="names-use-first"></select>');
			for (index = 0; index < 20; index++) {
				$('<option>' + index + '</option>').appendTo(select);
			}
			$('<label>Names-use-first: </label>').appendTo(panel);
			select.appendTo(panel);
			panel.append(' ');
			
			select = $('<select class="names-use-last"></select>');
			for (index = 0; index < 20; index++) {
				$('<option>' + index + '</option>').appendTo(select);
			}
			$('<label>Names-use-last: </label>').appendTo(panel);
			select.appendTo(panel);

			panel.find('select[class^="names"]').on('change', function () {
				// update all keys with names attrs
				// TODO: only add names attrs to keys containing names
				var namesAttributes = getNamesAttributes(),
					index;

				for (index = 0; index < nodeData.children.length; index++) {

				}

				$.each(nodeData.children, function (index, keyNode) {
					assertEqual(keyNode.name, "key");
					executeCommand("amendNode", [keyNode.cslId, getKeyNodeData(index)]);
				});
			});
		}());
	};

	return {
		setupPanel : setupPanel
	};
});
