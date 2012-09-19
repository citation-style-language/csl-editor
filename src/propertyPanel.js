"use strict";

// Creates property panels, chooses which property panel module to use for each node

define(
		[	'src/genericPropertyPanel',
			'src/ConditionalPropertyPanel',
			'src/infoPropertyPanel',
			'src/sortPropertyPanel',
			'src/controller',
			'src/mustache'
		],
		function (
			CSLEDIT_genericPropertyPanel,
			CSLEDIT_ConditionalPropertyPanel,
			CSLEDIT_infoPropertyPanel,
			CSLEDIT_sortPropertyPanel,
			CSLEDIT_controller,
			CSLEDIT_mustache
		) {
	var suppressUpdates = false; // used to prevent panel updates triggered the panel itself

	// property panels should use this instead of calling CSLEDIT_controller.exec
	// directly to prevent updates to the panel
	var executeCommand = function (command, args) {
		suppressUpdates = true;
		CSLEDIT_controller.exec(command, args);
		suppressUpdates = false;
	};

	var setup = function (propertyPanelElement, node, elementString) {
		var dataType,
			schemaAttributes;

		if (suppressUpdates) {
			return;
		}

		// show appropriate property panel
		switch (node.name) {
		case "sort":
			propertyPanelElement.html(CSLEDIT_mustache.toHtml("sortPropertyPanel"));

		/* TODO: Re-enable sort property panel if:
		 *         1. bug is fixed where re-ordering the sort keys causes crash
		 *         2. ascending/descending option is added for each sort key
		 *
			CSLEDIT_sortPropertyPanel.setupPanel(propertyPanelElement, node, executeCommand);
		*/
			break;
		case "info":
			CSLEDIT_infoPropertyPanel.setupPanel(propertyPanelElement, executeCommand);
			break;
		case "if":
		case "else-if":
			new CSLEDIT_ConditionalPropertyPanel(propertyPanelElement, node, executeCommand);
			break;
		case "choose":
			propertyPanelElement.html(CSLEDIT_mustache.toHtml("choosePropertyPanel"));
			break;
		default:
			dataType = CSLEDIT_schema.elementDataType(elementString);
			schemaAttributes = CSLEDIT_schema.attributes(elementString);

			CSLEDIT_genericPropertyPanel.setupPanel(
				propertyPanelElement, node, dataType, schemaAttributes,
				CSLEDIT_schema.choices(elementString), executeCommand);
		}
	};

	return {
		setup : setup
	};
});
