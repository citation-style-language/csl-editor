"use strict";

// Sets up handlers or hides buttons to perfom actions on a style, e.g. install/edit/view

define(
		[	'src/options'
		],
		function (
			CSLEDIT_options
		) {

	var setupButtonHandler = function (button, func) {
		if (typeof(func) === "undefined") {
			button.css("display", "none");
		} else {
			button.click(function (event) {
				func($(event.target).attr("data-styleId"));
			});
		}
	};

	// Setup the event handlers or disable all appropriate buttons within the given element
	var setup = function (containerElement) {
		setupButtonHandler(containerElement.find('button.installStyle'), CSLEDIT_options.get('installStyle_func'));
		setupButtonHandler(containerElement.find('button.editStyle'), CSLEDIT_options.get('editStyle_func'));
		setupButtonHandler(containerElement.find('button.viewCode'), CSLEDIT_options.get('viewCode_func'));
	};

	return {
		setup : setup
	};
});
