"use strict";

var CSLEDIT = CSLEDIT || {};

CSLEDIT.propertyPanel = (function () {
	var onChangeTimeout;

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
			enabledControls,
			disabledControls,
			thisControl,
			controlDisabledAttr,
			toggleControlText,
			values;

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
		values = [];

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
							dropdownValues.push("English");
							dropdownValues.push("etc... ");
							dropdownValues.push("(TODO: find proper list");
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
				thisControl = '<tr><td><label for=' + inputId + ' id="' + labelId + 
					'" class="propertyLabel">' +
					schemaAttribute + '<\/label><\/td>' + 
					'<td><select id="' + inputId + '" class="propertySelect" attr="' + index + '"' +
					controlDisabledAttr + ' >';

				for (index2 = 0; index2 < dropdownValues.length; index2++) {
					thisControl += "<option>" + dropdownValues[index2] + "</option>";
				}

				thisControl += '<\/select><\/td>' +
					'<td><button class="toggleAttrButton" attrIndex="' + index + '">' + 
					toggleControlText + '</button>' +
					'<\/td><\/tr>';

			} else {
				thisControl = inputAttributeControl(
					index, inputId, labelId, schemaAttribute, controlDisabledAttr, toggleControlText);
			}
			
			if (attribute.enabled) {
				enabledControls.push(thisControl);
			} else {
				disabledControls.push(thisControl);
			}

			values[index] = attribute.value;
		}

		// enabled controls at the top
		for (index = 0; index < enabledControls.length; index++) {
			$(enabledControls[index]).appendTo(panel);
		}

		$("<tr><td><br /><\/td><td><\/td><td><\/td><\/tr>").appendTo(panel);

		// disabled controls
		for (index = 0; index < disabledControls.length; index++) {
			$(disabledControls[index]).appendTo(panel);
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
		setupPanel : setupPanel
	};
}());
