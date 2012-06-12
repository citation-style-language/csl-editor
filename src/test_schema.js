"use strict";

CSLEDIT.schema = CSLEDIT.Schema();

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
		
		ok("font-weight" in CSLEDIT.schema.attributes("layout/text"));
	});
		
	test("list", function () {
		equal(CSLEDIT.schema.choices("layout/text")[3]["variable"].list, false);
		equal(CSLEDIT.schema.choices("choose/if")[6]["variable"].list, true);
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
		ok("macro" in CSLEDIT.schema.choices("layout/text")[0]);
		ok("term" in CSLEDIT.schema.choices("layout/text")[1]);
		ok("form" in CSLEDIT.schema.choices("layout/text")[1]);
		ok("plural" in CSLEDIT.schema.choices("layout/text")[1]);
		ok("value" in CSLEDIT.schema.choices("layout/text")[2]);
		ok("variable" in CSLEDIT.schema.choices("layout/text")[3]);
		ok("form" in CSLEDIT.schema.choices("layout/text")[3]);

		// shouldn't have the choices in the normal nodes
		ok(!("macro" in CSLEDIT.schema.attributes("layout/text")));
	});
});
