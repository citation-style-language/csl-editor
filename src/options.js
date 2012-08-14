"use strict";

define(['jquery', 'src/exampleData', 'src/getUrl'], function ($, CSLEDIT_exampleData, getUrlPlugin) {
	var userOptions = {};
	var defaultOptions = {
			loadCSLName : "Load CSL",
			loadCSLFunc : function () {
				alert("load CSL function not implemented");
			},
			saveCSLName : "Save CSL",
			saveCSLFunc : function (cslCode) {			
				window.location.href =
					"data:application/xml;charset=utf-8," +
					encodeURIComponent(cslCode);
			},
			editStyleName : "Edit Style",
			editStyleFunc : function (url) {
				alert("Edit style not avaiable.\n\n" +
					"For implementers: You need to add an editStyle_func to the options.");
			},
			exampleReferences : CSLEDIT_exampleData.jsonDocumentList,
			exampleCitations : [[0], [10], []]
		};

	// TODO: doesn't really belong here, move to other module
	var getUrl = function (resourcePath) {
		var url;
		require(['src/getUrl!' + resourcePath], function (newUrl) {
			url = newUrl;
		});
		return url;
	};

	// create the default options which are a function of user options
	var createExtraDefaults = function () {
		defaultOptions.cslSchema_mainURL = getUrl("generated/csl-schema/csl.rng");
		defaultOptions.cslSchema_childURLs = [];
		$.each([
				"generated/csl-schema/csl-categories.rng",
				"generated/csl-schema/csl-terms.rng",
				"generated/csl-schema/csl-types.rng",
				"generated/csl-schema/csl-variables.rng"
			], function (i, path) {
				defaultOptions.cslSchema_childURLs.push(getUrl(path));
			}
		);
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
		getUrl : getUrl,
		get : get,
		setUserOptions : function (_userOptions) {
			userOptions = _userOptions;
			createExtraDefaults();
		}
	};
});

