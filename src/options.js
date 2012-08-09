"use strict";

define(['jquery', 'src/exampleData'], function ($, CSLEDIT_exampleData) {
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
			rootURL : "/CSLEDIT",
			editStyleName : "Edit Style",
			editStyleFunc : function (url) {
				alert("Edit style not avaiable.\n\n" +
					"For implementers: You need to add an editStyle_func to the options.");
			},
			exampleReferences : CSLEDIT_exampleData.jsonDocumentList,
			exampleCitations : [[0],[10],[]]
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
});

