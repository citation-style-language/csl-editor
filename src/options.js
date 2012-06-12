"use strict";
var CSLEDIT = CSLEDIT || {};

CSLEDIT.options = (function () {
	var userOptions = {};
	var defaultOptions = {
			loadCSLName : "Load CSL",
			loadCSLFunc : function () {
				var url = prompt("Please enter the URL of the style you want to load"),
					newStyle;

				// fetch the URL
				$.ajax({
					url : '../getFromOtherWebsite.php?url=' + encodeURIComponent(url),
					success : function (result) {
						newStyle = result;
					},
					async: false
				});

				// can return null here and use VisualEditor.controller.exec('setCslCode')
				// to perform async
				return newStyle;
			},
			saveCSLName : "Save CSL",
			saveCSLFunc : function (cslCode) {			
				window.location.href =
					"data:application/xml;charset=utf-8," +
					encodeURIComponent(cslCode);
			},
			rootURL : "/CSLEDIT",
			editStyleName : "Edit Style",
			editStyleFunc : function (url) {
				alert("Edit style not avaiable.\n\n" +
					"For implementers: You need to add an editStyle_func to the options.");
			}
		};

	// create the default options which are a function of user options
	var createExtraDefaults = function () {
		defaultOptions.cslSchema_mainURL = get('rootURL') + "/external/csl-schema/csl.rng"
		defaultOptions.cslSchema_childURLs = [];
		$.each([
				"/external/csl-schema/csl-categories.rng",
				"/external/csl-schema/csl-terms.rng",
				"/external/csl-schema/csl-types.rng",
				"/external/csl-schema/csl-variables.rng"], function (i, path) {
			defaultOptions.cslSchema_childURLs.push(get('rootURL') + path);
		});
	};

	var get = function (key) {
		if (userOptions.hasOwnProperty(key)) {
			return userOptions[key];
		} else {
			return defaultOptions[key];
		}
	};

	createExtraDefaults();

	return {
		get : get,
		setUserOptions : function (_userOptions) {
			userOptions = _userOptions;
			createExtraDefaults();
		}
	}
}());
