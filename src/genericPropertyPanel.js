"use strict";

// A property panel that for editing *any* arbitrary CSL node
//
// setupPanel() presents all the information within the CSL node, except it's children
//
// It uses the lists in CSLEDIT_uiConfig.attributeGroups to group attributes into fieldsets
//
// If the node contains choices (I use 'choices' and 'modes' interchangably) then a
// CSLEDIT_MultiPanel is created which allows switching between them and contains all
// the attribute editors specific to the current mode.
//
// Note: Some of HTML here may be nice to generate using mustache, but the dynamic nature
//       makes it difficult to do unless it's refactored to redraw the entire panel
//       whenever the HTML needs changing.

define([	'src/MultiPanel',
			'src/MultiComboBox',
			'src/uiConfig',
			'src/CslNode',
			'src/dataInstance',
			'src/xmlUtility',
			'src/debug',
			'jquery.ui',
			'external/mustache'
		], function (
			CSLEDIT_MultiPanel,
			CSLEDIT_MultiComboBox,
			CSLEDIT_uiConfig,
			CSLEDIT_CslNode,
			CSLEDIT_data,
			CSLEDIT_xmlUtility,
			debug,
			jquery_ui,
			Mustache
		) {
	var onChangeTimeout,
		multiInputs,
		nodeData,
		newAttributes,
		toolbar,
		panel,
		toolbarButtonIndex,
		toolbarButtons,
		toolbarButtonSchema = {
			'font-weight' : {
				'normal' : 'default',
				'bold' : { html : '<strong>B</strong>' }
				// 'light' not supported
			},
			'font-style' : {
				'italic' : { html : '<i>I</i>' },
				'normal' : 'default'
				// "oblique" not supported
			},
			'text-decoration' : {
				'none' : 'default',
				'underline' : { html : '<u>U</u>' }
			},
			'font-variant' : {
				'small-caps' : {
					html : '<span style="font-variant: small-caps;">Small Caps</span>'
				},
				'normal' : 'default'
			},
			'vertical-align' : {
				'baseline' : 'default',
				'sup' : { html : 'x<sup>s</sup>' },
				'sub' : { html : 'x<sub>s</sub>' }
			},
			'quotes' : {
				'false' : 'default',
				'true' : { html : '&#8220;&#8221;' }
			},
			'strip-periods' : {
				'false' : 'default',
				'true' : { html : 'Strip Periods' }
			}
		},
		choicePanel,
		schemaChoices,
		schemaChoiceIndexes,
		schemaAttributes,
		executeCommand,
		fieldsets,
		selectedChoice;

	var addCustomClasses = function (element, attributeName) {
		var classes = CSLEDIT_uiConfig.attributeClasses[attributeName];
		if (typeof(classes) !== "undefined") {
			element.addClass(classes);
		}
	};

	var inputAttributeRow = function (index, attributeName, schemaAttribute, enabled) {
		var row, textInput;

		row = $('<tr/>');
		row.append($('<td align="right" />').append(label(index, attributeName)));

		textInput = $('<input class="propertyInput" />');
		textInput.attr('id', inputId(index));
		addCustomClasses(textInput, attributeName);

		if (schemaAttribute.documentation !== "") {
			textInput.attr('title', schemaAttribute.documentation);
		}

		if (!enabled && !schemaAttribute.hasOwnProperty("defaultValue")) {
			textInput.attr('disabled', true);
		}

		row.append($('<td/>').append(textInput));

		return row;
	};

	var label = function (index, attribute) {
		var element = $('<label class="propertyLabel" />');
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

		$.each(toolbarButtonSchema, function (key, value) {
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

	var toolbarButtonClicked = function (event) {
		var target = $(event.target).closest('a'),
			attribute = target.attr('data-attribute'),
			value,
			index = indexOfAttribute(attribute, nodeData.attributes),
			siblingControls = $(event.target).siblings('[data-attribute="' + attribute + '"]');
		
		// disable any other buttons for this attribute
		siblingControls.removeClass('selected');

		target.toggleClass('selected');

		if (target.hasClass('selected')) {
			value = target.attr('data-value');
		} else {
			value = defaultValueForToolbarButton(attribute);
		}

		nodeData.attributes[index] = {
			key : attribute,
			value : value,
			enabled : true
		};

		executeCommand("amendNode", [nodeData.cslId, stripChildren(nodeData)]);
		
		event.preventDefault();
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
		$('[id^="nodeAttributeLabel"]').each(function () {
			var key, value, index, enabled, attributes;
			index = $(this).attr("id").replace(/^nodeAttributeLabel/, "");
			key = $(this).html();

			if ($("#nodeAttribute" + index).length > 0) {
				value = $("#nodeAttribute" + index).val();
			} else {
				debug.assert(index in multiInputs);
				value = multiInputs[index].val();
			}

			if (selectedChoice !== null && key in schemaChoices[selectedChoice].attributes) {
				attributes = schemaChoices[selectedChoice].attributes;
			} else {
				attributes = schemaAttributes;
			}

			if (attributes.hasOwnProperty(key) && attributes[key].alwaysOutput === true) {
				enabled = true;
			} else if (key in attributes && "defaultValue" in attributes[key]) {
				enabled = (value !== attributes[key].defaultValue);
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

	var defaultValueForToolbarButton = function (attributeName) {
		var defaultValue;
		$.each(toolbarButtonSchema[attributeName], function (value, control) {
			if (control === 'default') {
				defaultValue = value;
				return false;
			}
		});
		return defaultValue;
	};

	var createButton = function (attributeName, cslSchemaAttribute, index, attribute) {
		debug.assert(typeof defaultValueForToolbarButton(attributeName) !== "undefined");

		$.each(toolbarButtonSchema[attributeName], function (attributeValue, control) {
			var button, buttonLabel;

			if (control !== 'default') {
				button = $('<a/>')
					.attr('href', '#')
					.attr('data-attribute', attributeName)
					.attr('data-value', attributeValue)
					.addClass('toolbarButton')
					.html(control.html);

				if (cslSchemaAttribute.documentation !== "") {
					button.attr("title", cslSchemaAttribute.documentation);
				}

				toolbarButtons.push({
					position : positionInSchema(attributeName),
					control : button
				});

				if (attribute.value === attributeValue) {
					button.addClass('selected');
				}
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

		if (typeof toolbarButtonSchema[attributeName] !== "undefined") {
			createButton(attributeName, schemaAttribute, index, attribute);
			return;
		}

		schemaValues = schemaAttribute.values;
		dropdownValues = [];
		dropdownDocumentation = {};

		// add macro dropdown values, they aren't in the schema
		if (attributeName === "macro") {
			$.each(CSLEDIT_data.getNodesFromPath("style/macro"), function (i, node) {
				var cslNode = new CSLEDIT_CslNode(node);
				if (cslNode.hasAttr("name")) {
					dropdownValues.push(cslNode.getAttr("name"));
				}
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
						// TODO: restrict input to language codes
						break;
					default:
						debug.log("WARNING: data type not recognised: " + 
							schemaValues[valueIndex].type);
					}
					break;
				default:
					debug.assert(false, "attribute value type not recognised");
				}
			}
		}

		if (dropdownValues.length === 1) {
			// if only 1 one value is possible, put it in a label
			thisRow = $('<tr/>');
			thisRow.append($('<td align="right"/>').append(label(index, attributeName)));
			thisRow.append($('<td/>').append(
				$('<label/>').attr('id', "nodeAttribute" + index).text(dropdownValues[0])));
		} else if (dropdownValues.length > 1) {
			thisRow = $('<tr/>');
			thisRow.append($('<td align="right" />').append(label(index, attributeName)));
			if (schemaAttribute.list) {
				multiInput = new CSLEDIT_MultiComboBox(
						$('<td class="input" />'), dropdownValues, function () {nodeChanged(); });
				multiInput.val(attribute.value, true);
				
				if (!attribute.enabled && !schemaAttribute.hasOwnProperty("defaultValue")) {
					multiInput.getElement().attr("disabled", true);
				}
				thisRow.append(multiInput.getElement());
				multiInputs[index] = multiInput;
			} else {
				thisRow.append((function () {
					var select, cell;
					select = $('<select class="propertySelect" />')
						.attr('id', inputId(index))
						.attr('attr', index);
					addCustomClasses(select, attributeName);
					
					$.each(dropdownValues, function (i, value) {
						var option = $($("<option/>").text(value));
						if (value in dropdownDocumentation) {
							option.attr("title", dropdownDocumentation[value]);
						}
						select.append(option);
					});

					cell = $('<td class="input" />').append(select);
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
			toggleButton = $('<button class="toggleAttrButton" />').attr('attrIndex', index);
			if (attribute.enabled) {
				toggleButton.text('Disable');
			} else {
				toggleButton.text('Enable');
			}
			thisRow.append($('<td/>').append(toggleButton));
		}
		thisRow.find("#" + inputId(index)).val(attribute.value);
			
		if (schemaAttribute.documentation !== "") {
			thisRow.attr('title', schemaAttribute.documentation);
		}

		return thisRow;
	};

	var setupChoiceTabs = function () {
		var possibleSelectedChoices = [], // choices with some attributes enabled
			definiteSelectedChoice,       // the best choice with all attributes enabled
			mostMatchingAttributes = 0; // the highest number of matching attributes from all the choices

		if (typeof choicePanel === "undefined" || choicePanel === null) {
			return;
		}

		// select the enabled mode
		$.each(schemaChoices, function (choiceIndex, choice) {
			// check against the first attribute in each schemaChoice list to determine 
			// which mode we are in
			var definitelySelected = false,
				possiblySelected = false,
				numMatchingAttributes = 0;
			
			$.each(choice.attributes, function (attributeName, attribute) {
				definitelySelected = true;
				return false;
			});

			$.each(choice.attributes, function (attributeName, schemaAttribute) {
				var attributeIndexes = indexesOfAttribute(attributeName, nodeData.attributes),
					thisAttribute;
				
				$.each(attributeIndexes, function (i, attributeIndex) {
					if (nodeData.attributes[attributeIndex].enabled &&
							isValidValue(nodeData.attributes[attributeIndex].value, schemaAttribute)) {
						thisAttribute = nodeData.attributes[attributeIndex];
						return false;
					}
				});

				if (typeof thisAttribute !== "undefined" && thisAttribute.enabled) {
					numMatchingAttributes++;
					possiblySelected = true;
				} else {
					definitelySelected = false;
				}
			});

			if (definitelySelected) {
				if (numMatchingAttributes > mostMatchingAttributes) {
					mostMatchingAttributes = numMatchingAttributes;
					definiteSelectedChoice = choiceIndex;
				}
			}
			if (possiblySelected) {
				possibleSelectedChoices.push(choiceIndex);
			}
		});

		if (typeof(definiteSelectedChoice) !== "undefined") {
			choicePanel.select(definiteSelectedChoice);
			enableControlsInTab(definiteSelectedChoice);
		} else if (possibleSelectedChoices.length > 0) {
			if (possibleSelectedChoices.length > 1) {
				debug.log('WARNING: not clear which mode this node is in');
			}
			choicePanel.select(possibleSelectedChoices[0]);
			enableControlsInTab(possibleSelectedChoices[0]);
		} else {
			// just select the first one
			choicePanel.select(0);
			enableControlsInTab(0);
		}
		
		choicePanel.onChange(function (index) {
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

		selectedChoice = index;
	};

	var drawFieldsets = function (attributeEditors) {
		var groupTables = {},
			fieldsets = [],
			miscTable = $('<table/>'),
			miscFieldset = $('<fieldset class="float" />').append(
				$('<legend/>').text(CSLEDIT_uiConfig.displayNameFromNode(nodeData)));

		$.each(CSLEDIT_uiConfig.attributeGroups, function (name, attributes) {
			var fieldset;

			groupTables[name] = $('<table/>');
			fieldset = $('<fieldset class="float" />').append(
				$('<legend/>').text(name));

			if (attributes.indexOf("fontFormattingControls") !== -1) {
				fieldset.append(toolbar);
			}
			fieldset.append(groupTables[name]);

			fieldsets.push(fieldset);
		});

		miscTable = $('<table/>');
		
		$.each(attributeEditors, function (attributeName, editor) {
			var foundGroup = false;
			$.each(CSLEDIT_uiConfig.attributeGroups, function (groupName, attributes) {
				if (attributes.indexOf(attributeName) !== -1) {
					groupTables[groupName].append(editor);
					foundGroup = true;
				}
			});
			if (!foundGroup) {
				miscTable.append(editor);
			}
		});

		// only display fieldsets with non-empty tables
		$.each(fieldsets, function (i, fieldset) {
			if (fieldset.find('tr').length > 0 || fieldset.find('input').length > 0 ||
					fieldset.find('.toolbar a').length > 0) {
				panel.append(fieldset);
			}
		});

		if (miscTable.find('tr').length > 0) {
			miscFieldset.append(miscTable);
			panel.append(miscFieldset);
		}
	};

	// Sets up a generic property panel
	//
	// - _panel - the jQuery element to create the panel within
	// - _nodeData - the CSL node to create the panel for
	// - dataType - the data type of this CSL node, e.g. "text" if it contains text.
	//              (all CSL nodes that contain child nodes have dataType null)
	// - _schemaAttributes - map of attributes for this CSL node
	// - _schemaChoices - list of choices (mutually exclusive modes) that the node can
	//                    be in, each choice has a list of attributes
	// - _executeCommand - the function to call to issue commands (e.g. CSLEDIT_controller.exec)
	var setupPanel = function (_panel, _nodeData, dataType, _schemaAttributes, _schemaChoices,
			_executeCommand) {
		var table,
			attrIndex,
			attributeEditors = {};
		
		schemaChoices = _schemaChoices;
		schemaAttributes = _schemaAttributes;
		executeCommand = _executeCommand;

		panel = _panel;
		nodeData = _nodeData;

		selectedChoice = null; // will be set to >= 0 if the node contains choices

		// remove child nodes
		panel.children().remove();

		toolbar = $('<div class="toolbar" />');

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

		toolbarButtons = [];
		newAttributes = [];
		multiInputs = {};
		schemaChoiceIndexes = [];

		toolbarButtonIndex = 0;

		choicePanel = null;

		// start with attribute editors in choice tabs
		attrIndex = -1;
		if (schemaChoices.length > 0) {

			choicePanel = new CSLEDIT_MultiPanel('multiPanel');
			choicePanel.element.addClass("float");
			panel.append(choicePanel.element);

			$.each(schemaChoices, function (choiceIndex, choice) {
				var addedToTab = false,
					table = $('<table/>');
				schemaChoiceIndexes[choiceIndex] = [];

				$.each(choice.attributes, function (attributeName, attribute) {
					var editor;
					if (!addedToTab) {
						// exceptions for some nodes
						// TODO: put these in uiConfig, or better yet, embed in schema somehow
						if (nodeData.name === "date-part") {
							choicePanel.addPanel(attribute.values[attribute.values.length - 1].value);
						} else if (nodeData.name === "term") {
							// Warning: this depends on the order in the schema which may change in future
							choicePanel.addPanel(
								["normal", "ordinals", "long ordinals", "gender assignable"][choiceIndex]);
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
					table.append(editor);
				});

				if (addedToTab) {
					choicePanel.contentPanels[choiceIndex].append(table);
				} else {
					choicePanel.addPanel("No attributes for this option");
				}
			});
		}

		table = $('<table/>');
		// create value editor (if a text or data element)
		if (dataType !== null) {
			$(Mustache.to_html(
				'<tr><td align="right"><label for="textNodeInput" id="textNodeInputLabel" class="propertyLabel">' +
				'{{dataType}} value</label></td>' + 
				'<td class="input"><input id="textNodeInput" class="propertyInput"></input></td></tr>',
				{ dataType : dataType })
			).appendTo(panel);
		
			$("#textNodeInput").val(nodeData.textValue);
		}

		// other attribute editors
		$.each(schemaAttributes, function (attributeName, schemaAttribute) {
			attrIndex++;
			attributeEditors[attributeName] = createAttributeEditor(attributeName, schemaAttribute, attrIndex);
		});

		toolbarButtons.sort(function (a, b) {
			return a.position - b.position;
		});

		$.each(toolbarButtons, function (i, control) {
			if (control.hasOwnProperty('control')) {
				toolbar.append(control.control);
			}
		});

		drawFieldsets(attributeEditors);

		nodeData.attributes = newAttributes;

		$(".propertyInput").on("input", function () {
			clearTimeout(onChangeTimeout);
			onChangeTimeout = setTimeout(function () { nodeChanged(); }, 500);
		});

		$(".propertySelect").on("change", function () { nodeChanged(); });

		$('.toggleAttrButton').click(function (buttonEvent) {
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

		toolbar.find('a.toolbarButton').on('click', toolbarButtonClicked);

		setupChoiceTabs();
	};
	
	return {
		setupPanel : setupPanel
	};
});
