"use strict";
var CSLEDIT = CSLEDIT || {};

module("Create view for all nodes in top styles");

asyncTest("setup views for all popular styles", function () {
	var styles = CSLEDIT.testUtils.getStyles(40),
		fakeDropdownMenuHandler = function () {},
		fakeSyntaxHighlighter = {
			selectedNodeChanged : function () {}
		},
		updates;

	ok("schemaOptions" in CSLEDIT);
	CSLEDIT.schema = CSLEDIT.Schema(CSLEDIT.schemaOptions);
	CSLEDIT.schema.callWhenReady( function () {
		ok(true, "schema loaded");

		CSLEDIT.data = CSLEDIT.Data("CSLEDIT.testData");
		CSLEDIT.viewController = CSLEDIT.ViewController(
			$('<div/>'), $('<div/>'), $('<div/>'), $('<div/>'),
			fakeDropdownMenuHandler,
			fakeSyntaxHighlighter
		);
		
		CSLEDIT.data.addViewController(CSLEDIT.viewController);
		
		CSLEDIT.viewController.init(CSLEDIT.data.get(), {
			formatCitations : function () { 
				processNextStyle();
			},
			//deleteNode : function () {},
			//moveNode : function () {},
			//checkMove : function () {},
			viewInitialised : function () {}
		});
	});

	var processNextStyle = function () {
		var result,
			styleUrl,
			styleCode,
			title;

		$.each(styles, function (url, cslCode) {
			styleUrl = url;
			styleCode = cslCode;
			return false;
		});

		if (typeof(styleUrl) === "undefined") {
			start(); // finish this test
			return;
		}

		delete styles[styleUrl];

		result = CSLEDIT.data.setCslCode(styleCode);

		if ("error" in result) {
			// should only get dependent style errors in repo styles
			ok(result.error.indexOf("dependent style") !== -1, "dependent style: " + styleUrl);
			processNextStyle();
		} else {
			title = CSLEDIT.data.getNodesFromPath("style/info/title")[0].textValue;
			ok(true, "processing style " + title);
		}
	};
});
