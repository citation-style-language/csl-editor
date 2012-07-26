"use strict";
var CSLEDIT = CSLEDIT || {};

module("Property panels for all nodes in top styles", {
	setup : function () {
		CSLEDIT.schema = CSLEDIT.Schema(CSLEDIT.schemaOptions);
	}
});

CSLEDIT.test_propertyPanel = {};
CSLEDIT.test_propertyPanel.generateAllPropertyPanels = function (cslData) {
	var propertyPanelElement = $("<div/>"),
		iterator,
		node,
		parent,
		elementName;

	iterator = new CSLEDIT.Iterator(cslData);

	while (iterator.hasNext()) {
		node = iterator.next();

		parent = iterator.parent();

		if (parent === null) {
			elementName = "root/" + node.name;
		} else {
			elementName = parent.name + '/' + node.name;
		}

		CSLEDIT.propertyPanel.setup(propertyPanelElement, node, elementName);
		ok(true, "set up property panel for " + elementName);
	}
};
CSLEDIT.test_propertyPanel.times = {};

asyncTest("property panels", function () {
	CSLEDIT.schema.callWhenReady( function () {
		var styles = CSLEDIT.testUtils.getStyles(2);

		CSLEDIT.data = CSLEDIT.Data("CSLEDIT.testData");
		ok("schema" in CSLEDIT, "CSLEDIT.schema is there");
		$.each(styles, function (url, cslCode) {
			var result;

			result = CSLEDIT.data.setCslCode(cslCode);

			if ("error" in result) {
				// should only get dependent style errors in repo styles
				ok(result.error.indexOf("dependent style") !== -1, "dependent style: " + url);
			} else {
				CSLEDIT.test_propertyPanel.generateAllPropertyPanels(CSLEDIT.data.get());
			}
		});
		start();
	});
});
