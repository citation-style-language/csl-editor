"use strict";

define([	'src/options'
		],
		function (
			CSLEDIT_options
		) {

	var Sys = function () {
		this.locale = {}; // lazily fetched from server
		this.abbreviations = {}; // no journal abbreviations at the moment
								// see demo/loadabbres.js in citeproc-js repo for an example
	};

	Sys.prototype.retrieveLocale = function (lang) {
		var that = this,
			locale = this.locale[lang],
			localePath;

		if (typeof(locale) === "undefined") {
			localePath = CSLEDIT_options.get("rootURL") + "/external/locales/locales-" + lang + ".xml";

			// try to fetch from server
			$.ajax({
				url : localePath,
				success : function (data) {
					console.log("fetched locale data for " + lang);
					that.locale[lang] = data;
					locale = data;
				},
				error : function (jqXHR, textStatus) {
					console.log("ERROR retrieving locale data for " + lang);
					console.log("Falling back to en-US");

					locale = that.retrieveLocale("en-US");
				},
				dataType : "text",
				async : false
			});
		}
		
		return locale;
	};

	Sys.prototype.setAbbreviations = function (abbreviations) {
		this.abbreviations = abbreviations;
	};

	Sys.prototype.setJsonDocuments = function (jsonDocuments) {
		this.jsonDocuments = jsonDocuments;
	};

	Sys.prototype.retrieveItem = function (id) {
		return this.jsonDocuments[id];
	};

	Sys.prototype.getAbbreviations = function (name, vartype) {
		return this.abbreviations[name][vartype];
	};

	return new Sys();
});
