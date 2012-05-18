"use strict";

var CSLEDIT = CSLEDIT || {};

CSLEDIT.propertyPanel = (function () {
	var onChangeTimeout,
		multiInputs,
		nodeData,
		enabledControlsOnTop = false;

	var inputAttributeRow = function (index, schemaAttribute, enabled) {
		var row, textInput;

		row = $('<tr><\/tr>');
		row.append($('<td><\/td>').append(label(index,schemaAttribute)));

		textInput = $('<input class="propertyInput"><\/input>');
		textInput.attr('id', inputId(index));

		if (!enabled) {
			textInput.attr('disabled', true);
		}
		row.append(textInput);

		return row;
	};

	var label = function (index, attribute) {
		var element = $('<label class="propertyLabel"><\/label>');
	   	element.attr('for', inputId(index));
		element.attr('id', labelId(index));
		element.html(attribute);

		return element;
	};
	
	var nodeChanged = function () {
		// TODO: assert check that persistent data wasn't changed in another tab, making
		//       this form data possibly refer to a different node

		// read user data
		$('[id^="nodeAttributeLabel"]').each( function () {
			var key, value, index;
			index = $(this).attr("id").replace(/^nodeAttributeLabel/, "");
			key = $(this).html();
			if ($("#nodeAttribute" + index).length > 0) {
				value = $("#nodeAttribute" + index).val();
			} else {
				value = multiInputs[index].val();
			}
			nodeData.attributes[index] = {
				key : key,
				value : value,
				enabled : nodeData.attributes[index].enabled
			};
		});

		CSLEDIT.controller.exec("amendNode", [nodeData.cslId, nodeData]);
	};

	var labelId = function (index) {
		return 'nodeAttributeLabel' + index;
	};

	var inputId = function (index) {
		return 'nodeAttribute' + index;
	};

	var setupPanel = function (panel, _nodeData, dataType, schemaAttributes) {
		var index,
			newAttributes = [],
			dropdownValues,
			attributes = _nodeData.attributes,
			attribute,
			schemaValues,
			valueIndex,
			intValue,
			allControls,
			enabledControls,
			disabledControls,
			thisRow,
			values,
			multiInput,
			table;

		nodeData = _nodeData;

		console.time("setupPanel");

		// remove child nodes
		panel.children().remove();

		// create new ones
		//$('<h3>' + nodeData.name + ' properties</h3><br \/>').appendTo(panel);
		// value editor (if a text or data element)
		if (dataType !== null) {
			$('<tr><td><label for="textNodeInput" id="textNodeInputLabel" class="propertyLabel">' +
				dataType + ' value<\/label><\/td>' + 
				'<td class="input"><input id="textNodeInput" class="propertyInput"><\/input><\/td><\/tr>').
				appendTo(panel);
		
			$("#textNodeInput").val(nodeData.textValue);
		}

		// TODO: data validation
		switch (dataType) {
		case null:
			// ignore - no data type
			break;
		case "anyURI":
			// text input with uri validation
			break;
		default:
			// no validation
		}

		newAttributes = [];

		enabledControls = [];
		disabledControls = [];
		allControls = [];
		values = [];
		multiInputs = {};

		// attribute editors
		index = -1;
		$.each(schemaAttributes, function (attributeName, schemaAttribute) {
			index++;
			attribute = null;
			$.each(attributes, function (i, thisAttribute) {
				if (thisAttribute.key === attributeName) {
					attribute = thisAttribute;
					if (!("enabled" in attribute)) {
						attribute["enabled"] = true;
					}
				}
			});
			if (attribute === null) {
				// create attribute if it doesn't exist
				attribute = { key : attributeName, value : "", enabled : false };
				attributes.push(attribute);
			}

			newAttributes.push(attribute);

			schemaValues = schemaAttribute.values;
			dropdownValues = [];

			if (schemaValues.length > 0) {
				for (valueIndex = 0; valueIndex < schemaValues.length; valueIndex++) {
					switch (schemaValues[valueIndex].type) {
					case "value":
						dropdownValues.push(schemaValues[valueIndex].value);
						break;
					case "data":
						switch (schemaValues[valueIndex].value) {
						case "boolean":
							dropdownValues.push("true");
							dropdownValues.push("false");
							break;
						case "integer":
							for (intValue = 0; intValue < 20; intValue++) {							
								dropdownValues.push(intValue);
							}
							break;
						case "language":
							/*
							dropdownValues.push("English");
							dropdownValues.push("etc... ");
							dropdownValues.push("(TODO: find proper list");*/
							break;
						default:
							console.log("WARNING: data type not recognised: " + 
								schemaValues[valueIndex].type);
						}
						break;
					default:
						assert(false, "attribute value type not recognised");
					}
				}
			}

			if (dropdownValues.length > 0) {
				thisRow = $('<tr><\/tr>');
				thisRow.append('<tr><td><label for=' + inputId(index) + ' id="' + labelId(index) + 
					'" class="propertyLabel">' + attributeName + '<\/label><\/td>');
				if (schemaAttribute.list) {
					multiInput = new CSLEDIT.MultiComboBox(
							$('<td class="input"><\/td>'), dropdownValues, function() {nodeChanged();});
					multiInput.val(attribute.value, true);
					
					if (!attribute.enabled) {
						multiInput.getElement().attr("disabled", true);
					}
					thisRow.append(multiInput.getElement());
					multiInputs[index] = multiInput;
				} else {
					console.log('dropdown vals = ' + JSON.stringify(dropdownValues));
					thisRow.append((function () {
						var select, cell;
						select = $('<select id="' + inputId(index) + '" class="propertySelect" attr="' + 
							index + '"><\/select>');

						$.each(dropdownValues, function (i, value) {
							select.append("<option>" + value + "<\/option>");
						});
						
						cell = $('<td class="input"><\/td>').append(select)
						if (!attribute.enabled) {
							cell.attr('disabled', true);
						}
						
						return cell;
					}()));
				}
			} else {
				thisRow = inputAttributeRow(index, attributeName, attribute.enabled);
			}

			var toggleButton;
			toggleButton = $('<button class="toggleAttrButton" attrIndex="' + index + '"></button>');
			if (attribute.enabled) {
				toggleButton.html('Disable');
			} else {
				toggleButton.html('Enable');
			}
			thisRow.append($('<td><\/td>').append(toggleButton));
			
			if (attribute.enabled) {
				enabledControls.push(thisRow);
			} else {
				disabledControls.push(thisRow);
			}
			allControls.push(thisRow);

			values[index] = attribute.value;
		});
		
		table = $('<table>');
		if (enabledControlsOnTop) {
			for (index = 0; index < enabledControls.length; index++) {
				$(enabledControls[index]).appendTo(panel);
			}

			table.append($("<tr><td><br /><\/td><td><\/td><td><\/td><\/tr>"));

			// disabled controls
			for (index = 0; index < disabledControls.length; index++) {
				table.append($(disabledControls[index]));
			}
		} else {
			$.each(allControls, function (i, control) {
				table.append(control);
			});
		}
		panel.append(table);

		// set values
		for (index = 0; index < attributes.length; index++) {
			$("#" + inputId(index)).val(values[index]);
		}

		nodeData.attributes = newAttributes;

		$('<\/table>').appendTo(panel);
	
		$(".propertyInput").on("input", function () {
			clearTimeout(onChangeTimeout);
			onChangeTimeout = setTimeout(function () { nodeChanged(); }, 500);
		});

		$(".propertySelect").on("change", function () { nodeChanged(); });

		$('.toggleAttrButton').click( function (buttonEvent) {
			index = $(buttonEvent.target).attr("attrIndex");

			if (nodeData.attributes[index].enabled) {
				nodeData.attributes[index].enabled = false;
				$("#nodeAttribute" + index).attr("disabled", "disabled");
			} else {
				nodeData.attributes[index].enabled = true;
				$("#nodeAttribute" + index).removeAttr("disabled");
			}
			setupPanel(panel, nodeData, dataType, schemaAttributes, function () { nodeChanged(); });
			clearTimeout(onChangeTimeout);
			onChangeTimeout = setTimeout(function () { nodeChanged(); }, 10);
		});
		
		console.timeEnd("setupPanel");
	};
	
	return {
		setupPanel : setupPanel
	};
}());
