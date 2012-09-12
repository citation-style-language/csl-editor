"use strict";

define(['src/options', 'src/Schema', 'jquery.qunit'], function (CSLEDIT_options, CSLEDIT_Schema) {
	module("CSLEDIT_schema", {
		setup : function () {
			window.CSLEDIT_schema = new CSLEDIT_Schema();
		},
		teardown : function () {
			delete window.CSLEDIT_schema;
		}
	});

	asyncTest("child elements", function () {
		CSLEDIT_schema.callWhenReady( function () {
			ok("style" in CSLEDIT_schema.childElements("root"));
			ok("locale" in CSLEDIT_schema.childElements("root"));
			ok("info" in CSLEDIT_schema.childElements("root/style"));
			ok("citation" in CSLEDIT_schema.childElements("root/style"));
			ok("bibliography" in CSLEDIT_schema.childElements("root/style"));
			start();
		});
	});

	asyncTest("element type", function () {
		CSLEDIT_schema.callWhenReady( function () {
			equal(CSLEDIT_schema.elementDataType("contributor/uri"), "anyURI");
			equal(CSLEDIT_schema.elementDataType("root/style"), null);
			start();
		});
	});

	asyncTest("attributes", function () {
		CSLEDIT_schema.callWhenReady( function () {
			var styleAttributes = CSLEDIT_schema.attributes("root/style"),
				index;

			ok("default-locale" in styleAttributes);
			equal(styleAttributes["default-locale"].values.length, 1);
			equal(styleAttributes["default-locale"].values[0].type, "data");
			equal(styleAttributes["default-locale"].values[0].value, "language");

			equal(styleAttributes["delimiter-precedes-et-al"].values[0].value, "contextual");
			equal(styleAttributes["delimiter-precedes-et-al"].defaultValue, "contextual");
			
			ok("font-weight" in CSLEDIT_schema.attributes("layout/text"));
			start();
		});
	});
		
	asyncTest("list", function () {
		CSLEDIT_schema.callWhenReady( function () {
			equal(CSLEDIT_schema.choices("layout/text")[3].attributes["variable"].list, false);
			equal(CSLEDIT_schema.attributes("choose/if")["variable"].list, true);
			start();
		});
	});

	asyncTest("all data integrity check", function () {
		CSLEDIT_schema.callWhenReady( function () {
			var allData = CSLEDIT_schema.allData(),
				elementName;

			for(elementName in allData) {
				ok(allData[elementName].attributeValues.length <= 1);
			}
			start();
		});
	});

	asyncTest("choices", function () {
		CSLEDIT_schema.callWhenReady( function () {
			equal(CSLEDIT_schema.choices("layout/text").length, 4, "length");
			ok("macro" in CSLEDIT_schema.choices("layout/text")[0].attributes);
			ok("term" in CSLEDIT_schema.choices("layout/text")[1].attributes);
			ok("form" in CSLEDIT_schema.choices("layout/text")[1].attributes);
			ok("plural" in CSLEDIT_schema.choices("layout/text")[1].attributes);
			ok("value" in CSLEDIT_schema.choices("layout/text")[2].attributes);
			ok("variable" in CSLEDIT_schema.choices("layout/text")[3].attributes);
			ok("form" in CSLEDIT_schema.choices("layout/text")[3].attributes);

			// shouldn't have the choices in the normal nodes
			ok(!("macro" in CSLEDIT_schema.attributes("layout/text")));
			start();
		});
	});

	asyncTest("child element quantifiers", function () {
		CSLEDIT_schema.callWhenReady( function () {
			// TODO: get quantifiers working properly, so we can use them
			//       to restrict the number of child elements as appropriate

			//equal(CSLEDIT_schema.childElements("layout/choose")['if'], "one");
			equal(CSLEDIT_schema.childElements("layout/choose")['else-if'], "zeroOrMore");
			//equal(CSLEDIT_schema.childElements("layout/choose")['else'], "optional");
			start();
		});
	});
});
