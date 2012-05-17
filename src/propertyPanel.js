"use strict";

var CSLEDIT = CSLEDIT || {};

CSLEDIT.propertyPanel = (function () {
	var onChangeTimeout,
		multiInputs;

	var inputAttributeControl = function (
			index, inputId, labelId, schemaAttribute, controlDisabledAttr, toggleControlText) {
		return '<tr><td><label for=' + inputId + ' id="' + labelId + '" class="propertyLabel">' +
			schemaAttribute + '<\/label><\/td>' + 
			'<td><input id="' + inputId + '" class="propertyInput" attr="' + index + '"' +
			'type="text" ' + controlDisabledAttr + ' ><\/input><\/td>' +
			'<td><button class="toggleAttrButton" attrIndex="' + index + '">' + toggleControlText + 
			'</button><\/td>' +	'<\/tr>'
	};

	var setupPanel = function (panel, nodeData, dataType, schemaAttributes, onChange) {
		var index,
			index2,
			newAttributes = [],
			dropdownValues,
			attributes = nodeData.attributes,
			attribute,
			schemaAttribute,
			schemaValues,
			inputId,
			labelId,
			valueIndex,
			intValue,
			allControls,
			enabledControls,
			disabledControls,
			thisRow,
			controlDisabledAttr,
			toggleControlText,
			values,
			multiInput;

		console.log("start setupPanel: " + nodeData.name);
		console.time("setupPanel");

		// remove child nodes
		panel.children().remove();

		// create new ones
		//$('<h3>' + nodeData.name + ' properties</h3><br \/>').appendTo(panel);
		$('<table>').appendTo(panel);
		
		// value editor (if a text or data element)
		if (dataType !== null) {
			$('<tr><td><label for="textNodeInput" id="textNodeInputLabel" class="propertyLabel">' +
				dataType + ' value<\/label><\/td>' + 
				'<td><input id="textNodeInput" class="propertyInput"' + 'type="text"><\/input><\/td><\/tr>').
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
		index = -1;

		enabledControls = [];
		disabledControls = [];
		allControls = [];
		values = [];
		multiInputs = {};

		// attribute editors
		for (schemaAttribute in schemaAttributes) {
			index++;
			inputId = 'nodeAttribute' + index;
			labelId = 'nodeAttributeLabel' + index;

			attribute = null;
			for (index2 = 0; index2 < attributes.length; index2++) {
				if (attributes[index2].key === schemaAttribute) {
					attribute = attributes[index2];
					if (!("enabled" in attribute)) {
						attribute["enabled"] = true;
					}
				}
			}
			if (attribute === null) {
				// create attribute if it doesn't exist
				attribute = { key : schemaAttribute, value : "", enabled : false };
				attributes.push(attribute);
			}

			newAttributes.push(attribute);

			schemaValues = schemaAttributes[schemaAttribute].values;
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

			if (attribute.enabled) {
				controlDisabledAttr = "";
				toggleControlText = "Disable";
			} else {
				controlDisabledAttr = ' disabled="disabled"';
				toggleControlText = "Enable";
			}

			if (dropdownValues.length > 0) {
				thisRow = $('<tr><\/tr>');
				thisRow.append('<tr><td><label for=' + inputId + ' id="' + labelId + 
					'" class="propertyLabel">' + schemaAttribute + '<\/label><\/td>');
				if (schemaAttributes[schemaAttribute].list) {
					multiInput = new CSLEDIT.MultiComboBox(
							$('<td><\/td>'), dropdownValues, function() {onChange(nodeData);});
					multiInput.val(attribute.value, true);
					
					if (!attribute.enabled) {
						multiInput.getElement().attr("disabled", "disabled");
					}
					thisRow.append(multiInput.getElement());
					multiInputs[index] = { attr : schemaAttribute, input : multiInput };
				} else {
					thisRow.append((function () {
						var html = '<td><select id="' + inputId + '" class="propertySelect" attr="' + 
							index + '"' + controlDisabledAttr + ' >';
						for (index2 = 0; index2 < dropdownValues.length; index2++) {
							html += "<option>" + dropdownValues[index2] + "</option>";
						}
						html += '<\/select><\/td>';
						return html;
					}()));
				}
				thisRow.append('<td><button class="toggleAttrButton" attrIndex="' + index + '">' + 
					toggleControlText + '</button>' +
					'<\/td><\/tr>');

			} else {
				thisRow = $(inputAttributeControl(index, inputId, labelId,
					schemaAttribute, controlDisabledAttr, toggleControlText));
			}
			
			if (attribute.enabled) {
				enabledControls.push(thisRow);
			} else {
				disabledControls.push(thisRow);
			}
			allControls.push(thisRow);

			values[index] = attribute.value;
		}
		
		if (false /* enabled controls move to top */) {
			// enabled controls at the top
			for (index = 0; index < enabledControls.length; index++) {
				$(enabledControls[index]).appendTo(panel);
			}

			$("<tr><td><br /><\/td><td><\/td><td><\/td><\/tr>").appendTo(panel);

			// disabled controls
			for (index = 0; index < disabledControls.length; index++) {
				$(disabledControls[index]).appendTo(panel);
			}
		} else {
			$.each(allControls, function (i, control) {
				panel.append(control);
			});
		}

		// set values
		for (index = 0; index < attributes.length; index++) {
			inputId = 'nodeAttribute' + index;
			$("#" + inputId).val(values[index]);
		}

		nodeData.attributes = newAttributes;

		$('<\/table>').appendTo(panel);
	
		$(".propertyInput").on("input", function () {
			clearTimeout(onChangeTimeout);
			onChangeTimeout = setTimeout(function () { onChange(nodeData); }, 500);
		});

		$(".propertySelect").on("change", function () { onChange(nodeData); });

		$('.toggleAttrButton').click( function (buttonEvent) {
			index = $(buttonEvent.target).attr("attrIndex");

			if (nodeData.attributes[index].enabled) {
				nodeData.attributes[index].enabled = false;
				$("#nodeAttribute" + index).attr("disabled", "disabled");
			} else {
				nodeData.attributes[index].enabled = true;
				$("#nodeAttribute" + index).removeAttr("disabled");
			}
			setupPanel(panel, nodeData, dataType, schemaAttributes, function () { onChange(nodeData); });
			clearTimeout(onChangeTimeout);
			onChangeTimeout = setTimeout(function () { onChange(nodeData); }, 10);
		});
		
		console.timeEnd("setupPanel");
	};
	
	return {
		setupPanel : setupPanel,
		getMultiInput : function (index) {
			return multiInputs[index];
		}
	};
}());
