"use strict";

module("CSLEDIT.schema", {
	setup : function () {
		CSLEDIT.schema = new CSLEDIT.Schema();
	},
	teardown : function () {
		delete CSLEDIT.schema;
	}
});

asyncTest("child elements", function () {
	CSLEDIT.schema.callWhenReady( function () {
		ok("style" in CSLEDIT.schema.childElements("root"));
		ok("locale" in CSLEDIT.schema.childElements("root"));
		ok("info" in CSLEDIT.schema.childElements("root/style"));
		ok("citation" in CSLEDIT.schema.childElements("root/style"));
		ok("bibliography" in CSLEDIT.schema.childElements("root/style"));
		start();
	});
});

asyncTest("element type", function () {
	CSLEDIT.schema.callWhenReady( function () {
		equal(CSLEDIT.schema.elementDataType("contributor/uri"), "anyURI");
		equal(CSLEDIT.schema.elementDataType("root/style"), null);
		start();
	});
});

asyncTest("attributes", function () {
	CSLEDIT.schema.callWhenReady( function () {
		var styleAttributes = CSLEDIT.schema.attributes("root/style"),
			index;

		ok("default-locale" in styleAttributes);
		equal(styleAttributes["default-locale"].values.length, 1);
		equal(styleAttributes["default-locale"].values[0].type, "data");
		equal(styleAttributes["default-locale"].values[0].value, "language");

		equal(styleAttributes["delimiter-precedes-et-al"].values[0].value, "contextual");
		equal(styleAttributes["delimiter-precedes-et-al"].defaultValue, "contextual");
		
		ok("font-weight" in CSLEDIT.schema.attributes("layout/text"));
		start();
	});
});
	
asyncTest("list", function () {
	CSLEDIT.schema.callWhenReady( function () {
		console.log(CSLEDIT);
		equal(CSLEDIT.schema.choices("layout/text")[3].attributes["variable"].list, false);
		equal(CSLEDIT.schema.attributes("choose/if")["variable"].list, true);
		start();
	});
});

asyncTest("all data integrity check", function () {
	CSLEDIT.schema.callWhenReady( function () {
		var allData = CSLEDIT.schema.allData(),
			elementName;

		for(elementName in allData) {
			ok(allData[elementName].attributeValues.length <= 1);
		}
		start();
	});
});

asyncTest("choices", function () {
	CSLEDIT.schema.callWhenReady( function () {
		equal(CSLEDIT.schema.choices("layout/text").length, 4, "length");
		ok("macro" in CSLEDIT.schema.choices("layout/text")[0].attributes);
		ok("term" in CSLEDIT.schema.choices("layout/text")[1].attributes);
		ok("form" in CSLEDIT.schema.choices("layout/text")[1].attributes);
		ok("plural" in CSLEDIT.schema.choices("layout/text")[1].attributes);
		ok("value" in CSLEDIT.schema.choices("layout/text")[2].attributes);
		ok("variable" in CSLEDIT.schema.choices("layout/text")[3].attributes);
		ok("form" in CSLEDIT.schema.choices("layout/text")[3].attributes);

		// shouldn't have the choices in the normal nodes
		ok(!("macro" in CSLEDIT.schema.attributes("layout/text")));
		start();
	});
});

asyncTest("child element quantifiers", function () {
	CSLEDIT.schema.callWhenReady( function () {
		// TODO: get quantifiers working properly

		//equal(CSLEDIT.schema.childElements("layout/choose")['if'], "one");
		equal(CSLEDIT.schema.childElements("layout/choose")['else-if'], "zeroOrMore");
		//equal(CSLEDIT.schema.childElements("layout/choose")['else'], "optional");
		start();
	});
});

