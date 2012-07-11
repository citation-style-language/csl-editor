"use strict";

var CSLEDIT = CSLEDIT || {};

CSLEDIT.genericPropertyPanel = (function () {
	var onChangeTimeout,
		multiInputs,
		nodeData,
		newAttributes,
		toolbar,
		panel,
		checkboxControlIndex,
		checkboxControls,
		checkboxControlSchema = {
			'font-weight' : {
				'normal' : 'default',
				'bold' : { text : '<strong>B</strong>' }
				// 'light' not supported
			},
			'font-style' : {
				'italic' : { text : '<i>I</i>' },
				'normal' : 'default'
				// "oblique" not supported
			},
			'text-decoration' : {
				'none' : 'default',
				'underline' : { text : '<u>U</u>' }
			},
			'font-variant' : {
				'small-caps' : {
					text : '<span style="font-variant: small-caps;">Small Caps</span>'
				},
				'normal' : 'default'
			},
			'vertical-align' : {
				'baseline' : 'default',
				'sup' : { text : 'x<sup>2</sup>' },
				'sub' : { text : 'x<sub>2</sub>' }
			},
			'quotes' : {
				'false' : 'default',
				'true' : { text : '&#8220;&#8221;' }
			},
			'strip-periods' : {
				'false' : 'default',
				'true' : { text : 'Strip Periods' }
			}
		},
		choicePanel,
		schemaChoices,
		schemaChoiceIndexes,
		schemaAttributes,
		executeCommand;

	var inputAttributeRow = function (index, attributeName, schemaAttribute, enabled) {
		var row, textInput;

		row = $('<tr></tr>');
		row.append($('<td></td>').append(label(index,attributeName)));

		textInput = $('<input class="propertyInput"></input>');
		textInput.attr('id', inputId(index));

		if (schemaAttribute.documentation !== "") {
			textInput.attr('title', schemaAttribute.documentation);
		}

		if (!enabled && !schemaAttribute.hasOwnProperty("defaultValue")) {
			textInput.attr('disabled', true);
		}

		row.append($('<td></td>').append(textInput));

		return row;
	};

	var label = function (index, attribute) {
		var element = $('<label class="propertyLabel"></label>');
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

	var indexesOfAttribute = function (attributeName, attributes) {
		var indexes = [],
			index;
		for (index = 0; index < attributes.length; index++) {
			if (attributes[index].key === attributeName) {
				indexes.push(index);
			}
		}
		return indexes;
	};

	var positionInSchema = function (attributeName) {
		var index = 0,
			position = -1;

		$.each(checkboxControlSchema, function (key, value) {
			if (key === attributeName) {
				position = index;
				return false;
			}
			index++;
		});

		return position;
	};

	var isValidValue = function (value, schemaAttribute) {
		var containsValueType = false,
			isValid = false;

		$.each(schemaAttribute.values, function (i, schemaValue) {
			if (schemaValue.type === "value") {
				containsValueType = true;
				return false;
			}
		});

		if (containsValueType) {
			if (schemaAttribute.list) {
				// Note: doesn't check validity of list contents at present
				isValid = true;
			} else {
				$.each(schemaAttribute.values, function (i, schemaValue) {
					if (value === schemaValue.value) {
						isValid = true;
						return false;
					}
				});
			}
		} else {
			isValid = true;
		}

		return isValid;
	};

	var checkboxChanged = function (event) {
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

		executeCommand("amendNode", [nodeData.cslId, stripChildren(nodeData)]);
	};

	var stripChildren = function (nodeData) {
		return {
			name : nodeData.name,
			cslId : nodeData.cslId,
			attributes : nodeData.attributes,
			textValue : nodeData.textValue
		};
	};
	
	var nodeChanged = function () {
		// read user data
		$('[id^="nodeAttributeLabel"]').each( function () {
			var key, value, index, enabled;
			index = $(this).attr("id").replace(/^nodeAttributeLabel/, "");
			key = $(this).html();

			if ($("#nodeAttribute" + index).length > 0) {
				value = $("#nodeAttribute" + index).val();
			} else {
				value = multiInputs[index].val();
			}

			if (schemaAttributes.hasOwnProperty(key) &&
					schemaAttributes[key].hasOwnProperty("defaultValue")) {
				enabled = (value !== schemaAttributes[key].defaultValue);
			} else {
				enabled = nodeData.attributes[index].enabled;
			}

			nodeData.attributes[index] = {
				key : key,
				value : value,
				enabled : enabled
			};
		});
		nodeData.textValue = $('#textNodeInput').val();
		executeCommand("amendNode", [nodeData.cslId, stripChildren(nodeData)]);
	};

	var labelId = function (index) {
		return 'nodeAttributeLabel' + index;
	};

	var inputId = function (index) {
		return 'nodeAttribute' + index;
	};

	var defaultValueForCustomControl = function (attributeName) {
		var defaultValue;
		$.each(checkboxControlSchema[attributeName], function (value, control) {
			if (control === 'default') {
				defaultValue = value;
				return false;
			}
		});
		return defaultValue;
	}

	var createButton = function (attributeName, cslSchemaAttribute, index, attribute) {
		assert(typeof defaultValueForCustomControl(attributeName) !== "undefined");

		$.each(checkboxControlSchema[attributeName], function (attributeValue, control) {
			var button, buttonLabel, checkboxControlId;
			checkboxControlId = "checkboxControl" + checkboxControlIndex;

			if (control !== 'default') {
				buttonLabel = $('<label for="' + checkboxControlId + '">' + control.text + '</label>');
				button = $('<input type="checkbox" id="' + checkboxControlId + '" data-attribute="' +
					attributeName + '" data-value="' + attributeValue + '" />');

				if (cslSchemaAttribute.documentation !== "") {
					button.attr("title", cslSchemaAttribute.documentation);
				}

				checkboxControls.push({
					position : positionInSchema(attributeName),
					control : button,
					label : buttonLabel
				});

				if (attribute.value === attributeValue) {
					button.attr('checked', 'checked');
				}
				checkboxControlIndex++;
			}
		});
	};

	var createAttributeEditor = function (attributeName, schemaAttribute, index) {
		var attribute,
			schemaValues,
			dropdownValues,
			dropdownDocumentation,
			valueIndex,
			thisRow,
			multiInput,
			intValue,
			value;

		attribute = null;

		$.each(nodeData.attributes, function (i, thisAttribute) {
			var existingAttributeIndex;
			
			if (thisAttribute.key === attributeName &&
				isValidValue(thisAttribute.value, schemaAttribute)) {

				// do deep copy if one already exists
				existingAttributeIndex = indexOfAttribute(attributeName, newAttributes);
				if (existingAttributeIndex !== -1) {
					attribute = {
						key : thisAttribute.key,
						value : thisAttribute.value,
						enabled : thisAttribute.enabled
					};
				} else {
					attribute = thisAttribute;
				}
				
				if (!("enabled" in attribute)) {
					attribute["enabled"] = true;
				}
			}
		});
		if (attribute === null) {
			if (!schemaAttribute.hasOwnProperty("defaultValue")) {
				value = "";
			} else {
				value = schemaAttribute.defaultValue;
			}
			// create attribute if it doesn't exist
			attribute = { key : attributeName, value : value, enabled : false };
		}

		newAttributes.push(attribute);

		if (typeof checkboxControlSchema[attributeName] !== "undefined") {
			createButton(attributeName, schemaAttribute, index, attribute);
			return;
		}

		schemaValues = schemaAttribute.values;
		dropdownValues = [];
		dropdownDocumentation = {};

		// add macro dropdown values, they aren't in the schema
		if (attributeName === "macro") {
			$.each(CSLEDIT.data.getNodesFromPath("style/macro"), function (i, node) {
				dropdownValues.push(node.attributes[indexOfAttribute("name", node.attributes)].value);
			});
		}

		if (schemaValues.length > 0) {
			for (valueIndex = 0; valueIndex < schemaValues.length; valueIndex++) {
				switch (schemaValues[valueIndex].type) {
				case "novalue":
					dropdownValues.push(schemaValues[valueIndex].value);
					dropdownDocumentation[schemaValues[valueIndex].value] =
						schemaValues[valueIndex].documentation;
					break;
				case "value":
					dropdownValues.push(schemaValues[valueIndex].value);
					if (schemaValues[valueIndex].documention !== "") {
						dropdownDocumentation[schemaValues[valueIndex].value] =
							schemaValues[valueIndex].documentation;
					}
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

		if (dropdownValues.length > 1 /* 1 because it includes the default value */) {
			thisRow = $('<tr></tr>');
			thisRow.append($('<td></td>').append(label(index, attributeName)));
			if (schemaAttribute.list) {
				multiInput = new CSLEDIT.MultiComboBox(
						$('<td class="input"></td>'), dropdownValues, function() {nodeChanged();});
				multiInput.val(attribute.value, true);
				
				if (!attribute.enabled && !schemaAttribute.hasOwnProperty("defaultValue")) {
					multiInput.getElement().attr("disabled", true);
				}
				thisRow.append(multiInput.getElement());
				multiInputs[index] = multiInput;
			} else {
				thisRow.append((function () {
					var select, cell;
					select = $('<select id="' + inputId(index) + '" class="propertySelect" attr="' + 
						index + '"></select>');

					$.each(dropdownValues, function (i, value) {
						var option = $("<option>" + value + "</option>");
						if (value in dropdownDocumentation) {
							option.attr("title", dropdownDocumentation[value]);
						}
						select.append(option);
					});

					cell = $('<td class="input"></td>').append(select)
					if (!attribute.enabled && !schemaAttribute.hasOwnProperty("defaultValue")) {
						cell.attr('disabled', true);
					}
					
					return cell;
				}()));
			}
		} else {
			thisRow = inputAttributeRow(index, attributeName, schemaAttribute, attribute.enabled);
		}

		var toggleButton;

		if (!schemaAttribute.hasOwnProperty("defaultValue")) {
			toggleButton = $('<button class="toggleAttrButton" attrIndex="' + index + '"></button>');
			if (attribute.enabled) {
				toggleButton.html('Disable');
			} else {
				toggleButton.html('Enable');
			}
			thisRow.append($('<td></td>').append(toggleButton));
		}
		thisRow.find("#" + inputId(index)).val(attribute.value);
			
		if (schemaAttribute.documentation !== "") {
			thisRow.attr('title', schemaAttribute.documentation);
		}

		return thisRow;
	};

	var setupChoiceTabs = function () {
		var possibleSelectedChoices = [], // choices with some attributes enabled
			definiteSelectedChoices = []; // choices with all attributes enabled

		if (typeof choicePanel === "undefined") {
			return;
		}

		// select the enabled mode
		$.each(schemaChoices, function (choiceIndex, choice) {
			// check against the first attribute in each schemaChoice list to determine 
			// which mode we are in
			var definitelySelected = false,
				possiblySelected = false;
			
			$.each(choice.attributes, function (attributeName, attribute) {
				definitelySelected = true;
				return false;
			});

			$.each(choice.attributes, function (attributeName, schemaAttribute) {
				var attributeIndexes = indexesOfAttribute(attributeName, nodeData.attributes),
					thisAttribute;
				
				$.each(attributeIndexes, function (i, attributeIndex) {
					if (isValidValue(nodeData.attributes[attributeIndex].value, schemaAttribute)) {
						thisAttribute = nodeData.attributes[attributeIndex];
						return false;
					}
				});

				if (typeof thisAttribute !== "undefined" && thisAttribute.enabled) {
					possiblySelected = true;
				} else {
					definitelySelected = false;
				}
			});

			if (definitelySelected) {
				definiteSelectedChoices.push(choiceIndex);
			}
			if (possiblySelected) {
				possibleSelectedChoices.push(choiceIndex);
			}
		});

		if (definiteSelectedChoices.length > 0) {
			if (definiteSelectedChoices.length > 1) {
				console.log("WARNING: not clear which mode the node is in.\n" + 
					"more than 1 definite selected choice");
			}

			choicePanel.select(definiteSelectedChoices[0]);
			enableControlsInTab(definiteSelectedChoices[0]);
		} else if (possibleSelectedChoices.length > 0) {
			if (possibleSelectedChoices.length > 1) {
				console.log('WARNING: not clear which mode this node is in');
			}
			choicePanel.select(possibleSelectedChoices[0]);
			enableControlsInTab(possibleSelectedChoices[0]);
		} else {
			// just select the first one
			choicePanel.select(0);
			enableControlsInTab(0);
		}
		
		choicePanel.onChange(function(index) {
			enableControlsInTab(index);
			nodeChanged();
		});
	};

	var enableControlsInTab = function (index) {
		// enable all controls in selected tab and disable the rest
		$.each(schemaChoiceIndexes, function (choiceIndex, choice) {
			$.each(choice, function (i, attributeIndex) {
				nodeData.attributes[attributeIndex].enabled = (choiceIndex === index);
				panel.find('#' + inputId(attributeIndex)).val(nodeData.attributes[attributeIndex].value);
			});
		});
	};

	var setupPanel = function (_panel, _nodeData, dataType, _schemaAttributes, _schemaChoices,
			_executeCommand) {
		var table,
			attrIndex;
		
		schemaChoices = _schemaChoices;
		schemaAttributes = _schemaAttributes;
		executeCommand = _executeCommand;

		panel = _panel;
		nodeData = _nodeData;

		// remove child nodes
		panel.children().remove();

		toolbar = $('<div class="propertyToolbar"></div>');
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

		checkboxControls = [];
		newAttributes = [];
		multiInputs = {};
		schemaChoiceIndexes = [];

		checkboxControlIndex = 0;

		// start with attribute editors in choice tabs
		attrIndex = -1;
		if (schemaChoices.length > 0) {

			choicePanel = new CSLEDIT.MultiPanel('multiPanel');
			panel.append(choicePanel.element);

			$.each(schemaChoices, function (choiceIndex, choice) {
				var addedToTab = false;
				schemaChoiceIndexes[choiceIndex] = [];

				$.each(choice.attributes, function (attributeName, attribute) {
					var editor;
					if (!addedToTab) {
						// exception for date-part node
						if (nodeData.name === "date-part") {
							choicePanel.addPanel(attribute.values[attribute.values.length - 1].value);
						} else {
							choicePanel.addPanel(attributeName);
						}
						addedToTab = true;
					}
					
					attrIndex++;
					editor = createAttributeEditor(attributeName, attribute, attrIndex);
					schemaChoiceIndexes[choiceIndex].push(attrIndex);

					editor.find('button.toggleAttrButton').remove();
					editor.find('*').removeAttr('disabled');
					choicePanel.contentPanels[choiceIndex].append(editor);
				});

				if (!addedToTab) {
					choicePanel.addPanel("No attributes for this option");
				}
			});
		}

		table = $('<table></table>');
		// create value editor (if a text or data element)
		if (dataType !== null) {
			$('<tr><td><label for="textNodeInput" id="textNodeInputLabel" class="propertyLabel">' +
				dataType + ' value</label></td>' + 
				'<td class="input"><input id="textNodeInput" class="propertyInput"></input></td></tr>').
				appendTo(panel);
		
			$("#textNodeInput").val(nodeData.textValue);
		}

		// other attribute editors
		$.each(schemaAttributes, function (attributeName, schemaAttribute) {
			attrIndex++;
			table.append(createAttributeEditor(attributeName, schemaAttribute, attrIndex));
		});
		
		panel.append(table);

		nodeData.attributes = newAttributes;

		$(".propertyInput").on("input", function () {
			clearTimeout(onChangeTimeout);
			onChangeTimeout = setTimeout(function () { nodeChanged(); }, 500);
		});

		$(".propertySelect").on("change", function () { nodeChanged(); });

		$('.toggleAttrButton').click( function (buttonEvent) {
			var index = $(buttonEvent.target).attr("attrIndex");

			if (nodeData.attributes[index].enabled) {
				nodeData.attributes[index].enabled = false;
				$("#nodeAttribute" + index).attr("disabled", "disabled");
			} else {
				nodeData.attributes[index].enabled = true;
				$("#nodeAttribute" + index).removeAttr("disabled");
			}

			setupPanel(panel, nodeData, dataType, schemaAttributes, schemaChoices,
				executeCommand);
			clearTimeout(onChangeTimeout);
			onChangeTimeout = setTimeout(function () { nodeChanged(); }, 10);
		});

		checkboxControls.sort(function (a, b) {
			return a.position - b.position;
		});

		$.each(checkboxControls, function (i, control) {
			if (control.hasOwnProperty('control')) {
				toolbar.append(control.control);
				toolbar.append(control.label);
				
				control.control.button();

				if (typeof control.control.attr("title") !== "undefined") {
					control.control.button('widget').attr("title", control.control.attr("title"));
				}
			}
		});

		toolbar.find('input[id^=checkboxControl]').on('change', checkboxChanged);

		setupChoiceTabs();
	};
	
	return {
		setupPanel : setupPanel
	};
}());
