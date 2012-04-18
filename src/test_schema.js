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

	test("all data integrity check", function () {
		var allData = CSLEDIT.schema.allData(),
			element;

		for(elementName in allData) {
			ok(allData[elementName].attributeValues.length <= 1);
		}
	});
});
