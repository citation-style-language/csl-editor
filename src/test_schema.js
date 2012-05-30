"use strict";

CSLEDIT.schema.callWhenReady( function () {
	module("CSLEDIT.schema");

	test("child elements", function () {
			ok("style" in CSLEDIT.schema.childElements("root"));
			ok("locale" in CSLEDIT.schema.childElements("root"));
			ok("info" in CSLEDIT.schema.childElements("root/style"));
			ok("citation" in CSLEDIT.schema.childElements("root/style"));
			ok("bibliography" in CSLEDIT.schema.childElements("root/style"));
		});

	test("element type", function () {
		equal(CSLEDIT.schema.elementDataType("contributor/uri"), "anyURI");
		equal(CSLEDIT.schema.elementDataType("root/style"), null);
	});
	
	test("attributes", function () {
		var styleAttributes = CSLEDIT.schema.attributes("root/style"),
			index;

		ok("default-locale" in styleAttributes);
		equal(styleAttributes["default-locale"].values.length, 1);
		equal(styleAttributes["default-locale"].values[0].type, "data");
		equal(styleAttributes["default-locale"].values[0].value, "language");
	});
		
	test("list", function () {
		equal(CSLEDIT.schema.attributes("layout/text")["variable"].list, false);
		equal(CSLEDIT.schema.attributes("choose/if")["variable"].list, true);
	});

	test("all data integrity check", function () {
		var allData = CSLEDIT.schema.allData(),
			elementName;

		for(elementName in allData) {
			ok(allData[elementName].attributeValues.length <= 1);
		}
	});

	test("choices", function () {
		equal(CSLEDIT.schema.choices("layout/text").length, 4, "length");
		equal(CSLEDIT.schema.choices("layout/text")[0][0], "macro");
		equal(CSLEDIT.schema.choices("layout/text")[1][0], "term");
		equal(CSLEDIT.schema.choices("layout/text")[1][1], "form");
		equal(CSLEDIT.schema.choices("layout/text")[1][2], "plural");
		equal(CSLEDIT.schema.choices("layout/text")[2][0], "value");
		equal(CSLEDIT.schema.choices("layout/text")[3][0], "variable");
		equal(CSLEDIT.schema.choices("layout/text")[3][1], "form");
	});
});
