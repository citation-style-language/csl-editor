"use strict";

var CSLEDIT = CSLEDIT || {};

CSLEDIT.propertyPanel = (function () {
	var onChangeTimeout,
		multiInputs,
		nodeData,
		enabledTableControlsOnTop = false,
		allTableControls,
		enabledTableControls,
		disabledTableControls,
		newAttributes,
		toolbar,
		panel,
		customControlIndex,
		customControls,
		customControlSchema = {
			'font-weight' : {
				'normal' : 'default',
				'bold' : { text : 'B' }
				// 'light' not supported
			},
			'font-style' : {
				'italic' : { text : 'i' },
				'normal' : 'default'
				// "oblique" not supported
			},
			'text-decoration' : {
				'none' : 'default',
				'underline' : { text : 'u' }
			},
			'font-variant' : {
				'small-caps' : { text : 'All Caps' },
				'normal' : 'default'
			},
			'vertical-align' : {
				'baseline' : 'default',
				'sup' : { text : 'sup' },
				'sub' : { text : 'sub' }
			},
			'quotes' : {
				'false' : 'default',
				'true' : { text : '""' }
			},
			'strip-periods' : {
				'false' : 'default',
				'true' : { text : 'Strip Periods' }
			}
	};

	var inputAttributeRow = function (index, schemaAttribute, enabled) {
		var row, textInput;

		row = $('<tr><\/tr>');
		row.append($('<td><\/td>').append(label(index,schemaAttribute)));

		textInput = $('<input class="propertyInput"><\/input>');
		textInput.attr('id', inputId(index));

		if (!enabled) {
			textInput.attr('disabled', true);
		}

		row.append($('<td><\/td>').append(textInput));

		return row;
	};

	var label = function (index, attribute) {
		var element = $('<label class="propertyLabel"><\/label>');
	   	element.attr('for', inputId(index));
		element.attr('id', labelId(index));
		element.html(attribute);

		return element;
	};

	var indexOfAttribute = function (attributeName, attributes) {
		var index;
		for (index = 0; index < attributes.length; index++) {
			if (attributes[index].key === attributeName) {
				return index;
			}
		}
		// couldn't find
		return -1;
	};

	var positionInSchema = function (attributeName) {
		var index = 0,
			position = -1;

		$.each(customControlSchema, function (key, value) {
			if (key === attributeName) {
				position = index;
				return false;
			}
			index++;
		});

		return position;
	};

	var customControlChanged = function (event) {
		var target = $(event.target),
			attribute = target.attr('data-attribute'),
			value,
			index = indexOfAttribute(attribute, nodeData.attributes),
			siblingControls = $(event.target).siblings('[data-attribute="' + attribute + '"]');
		
		// disable any other buttons for this attribute
		siblingControls.removeAttr('checked').button('refresh');

		if (target.is(':checked')) {
			value = target.attr('data-value');
		} else {
			value = defaultValueForCustomControl(attribute);
		}

		nodeData.attributes[index] = {
			key : attribute,
			value : value,
			enabled : true
		}

		CSLEDIT.controller.exec("amendNode", [nodeData.cslId, nodeData]);
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

	var defaultValueForCustomControl = function (attributeName) {
		var defaultValue;
		$.each(customControlSchema[attributeName], function (value, control) {
			if (control === 'default') {
				defaultValue = value;
				return false;
			}
		});
		return defaultValue;
	}

	var createButton = function (attributeName, schemaAttribute, index, attribute) {
		assert(typeof defaultValueForCustomControl(attributeName) !== "undefined");

		$.each(customControlSchema[attributeName], function (attributeValue, control) {
			var button, buttonLabel, customControlId;
			customControlId = "customControl" + customControlIndex;

			if (control !== 'default') {
				buttonLabel = $('<label for="' + customControlId + '">' + control.text + '<\/label>');
				button = $('<input type="checkbox" id="' + customControlId + '" data-attribute="' +
					attributeName + '" data-value="' + attributeValue + '" \/>');

				customControls.push({
					position : positionInSchema(attributeName),
					control : button,
					label : buttonLabel
				});

				if (attribute.value === attributeValue) {
					button.attr('checked', 'checked');
				}
				customControlIndex++;
			}
		});
	};

	var createAttributeEditor = function (attributeName, schemaAttribute, index) {
		var attribute,
			schemaValues,
			dropdownValues,
			valueIndex,
			thisRow,
			multiInput,
			intValue;

		attribute = null;

		$.each(nodeData.attributes, function (i, thisAttribute) {
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
			nodeData.attributes.push(attribute);
		}

		newAttributes.push(attribute);

		if (typeof customControlSchema[attributeName] !== "undefined") {
			createButton(attributeName, schemaAttribute, index, attribute);
			return;
		}

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
			thisRow.append($('<td><\/td>').append(label(index, attributeName)));
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
			enabledTableControls.push(thisRow);
		} else {
			disabledTableControls.push(thisRow);
		}
		allTableControls.push(thisRow);

		thisRow.find("#" + inputId(index)).val(attribute.value);
	};

	var setupPanel = function (_panel, _nodeData, dataType, schemaAttributes) {
		var index,
			table;

		panel = _panel;
		nodeData = _nodeData;

		// remove child nodes
		panel.children().remove();

		toolbar = $('<div class="propertyToolbar"><\/div>');
		panel.append(toolbar);

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

		customControls = [];
		newAttributes = [];
		enabledTableControls = [];
		disabledTableControls = [];
		allTableControls = [];
		multiInputs = {};

		customControlIndex = 0;

		table = $('<table><\/table>');
		// create value editor (if a text or data element)
		if (dataType !== null) {
			$('<tr><td><label for="textNodeInput" id="textNodeInputLabel" class="propertyLabel">' +
				dataType + ' value<\/label><\/td>' + 
				'<td class="input"><input id="textNodeInput" class="propertyInput"><\/input><\/td><\/tr>').
				appendTo(panel);
		
			$("#textNodeInput").val(nodeData.textValue);
		}

		// attribute editors
		index = -1;
		$.each(schemaAttributes, function (attributeName, schemaAttribute) {
			index++;
			createAttributeEditor(attributeName, schemaAttribute, index);
		});
		
		if (enabledTableControlsOnTop) {
			for (index = 0; index < enabledTableControls.length; index++) {
				$(enabledTableControls[index]).appendTo(panel);
			}

			table.append($("<tr><td><br /><\/td><td><\/td><td><\/td><\/tr>"));

			// disabled controls
			for (index = 0; index < disabledTableControls.length; index++) {
				table.append($(disabledTableControls[index]));
			}
		} else {
			$.each(allTableControls, function (i, control) {
				table.append(control);
			});
		}
		panel.append(table);

		nodeData.attributes = newAttributes;

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

		customControls.sort(function (a, b) {
			return a.position - b.position;
		});

		$.each(customControls, function (i, control) {
			if (control.hasOwnProperty('control')) {
				toolbar.append(control.control);
				toolbar.append(control.label);
				
				control.control.button();
			}
		});

		toolbar.find('input[id^=customControl]').on('change', customControlChanged);
	};
	
	return {
		setupPanel : setupPanel
	};
}());
