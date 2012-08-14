"use strict";

define(['src/CslNode', 'jquery.qunit'], function (CSLEDIT_CslNode) {
	module("CSLEDIT_CslNode");

	test("constructor", function () {
		var testNode,
			description;

		description = "construct with args";
		testNode = new CSLEDIT_CslNode("test", [{key:"attr1", value:"attr1_val"}]);

		equal(testNode.name, "test", description);
		equal(testNode.attributes[0].key, "attr1", description);

		description = "construct with object";
		testNode = new CSLEDIT_CslNode({name: "test2", attributes : [{key: "one", value: "1"}]});

		equal(testNode.name, "test2", description);
		equal(testNode.getAttr("one"), "1", description);
	});

	test("get/set attrs", function () {
		var testNode;

		testNode = new CSLEDIT_CslNode("test", [{key:"attr1", value:"attr1_val"}]);

		equal(testNode.getAttr("attr1"), "attr1_val");
		equal(testNode.getAttr("attr2"), "");

		testNode.setAttr("attr2", "attr2_val");
		equal(testNode.getAttr("attr2"), "attr2_val");
	});
});
