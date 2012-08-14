"use strict";

define([	'src/Schema',
			'src/Iterator',
			'src/propertyPanel',
			'src/schemaOptions',
			'src/testUtils',
			'src/dataInstance'
		],
		function (
			CSLEDIT_Schema,
			CSLEDIT_Iterator,
			CSLEDIT_propertyPanel,
			CSLEDIT_schemaOptions,
			CSLEDIT_testUtils,
			CSLEDIT_data
		) {
	module("Property panels for all nodes in top styles", {
		setup : function () {
			window.CSLEDIT_schema = CSLEDIT_Schema(CSLEDIT_schemaOptions);
		}
	});

	var CSLEDIT_test_propertyPanel = {};
	CSLEDIT_test_propertyPanel.generateAllPropertyPanels = function (cslData) {
		var propertyPanelElement = $("<div/>"),
			iterator,
			node,
			parent,
			elementName;

		iterator = new CSLEDIT_Iterator(cslData);

		while (iterator.hasNext()) {
			node = iterator.next();

			parent = iterator.parent();

			if (parent === null) {
				elementName = "root/" + node.name;
			} else {
				elementName = parent.name + '/' + node.name;
			}

			CSLEDIT_propertyPanel.setup(propertyPanelElement, node, elementName);
			ok(true, "set up property panel for " + elementName);
		}
	};
	CSLEDIT_test_propertyPanel.times = {};

	asyncTest("property panels", function () {
		CSLEDIT_schema.callWhenReady( function () {
			var styles = CSLEDIT_testUtils.getStyles(2);

			$.each(styles, function (url, cslCode) {
				var result;

				result = CSLEDIT_data.setCslCode(cslCode);

				if ("error" in result) {
					// should only get dependent style errors in repo styles
					ok(result.error.indexOf("dependent style") !== -1, "dependent style: " + url);
				} else {
					CSLEDIT_test_propertyPanel.generateAllPropertyPanels(CSLEDIT_data.get());
				}
			});
			start();
		});
	});
});
