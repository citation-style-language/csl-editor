"use strict";

// Creates the Sys object required by citeproc-js
// 
// Provides citeproc with:
//
// - Metadata for all the JSON references used in the citation clusters
// - Locale data
// - Abbreviation data

define([	'src/urlUtils',
			'src/debug'
		],
		function (
			CSLEDIT_urlUtils,
			debug
		) {

	// Sys constructor
	var Sys = function () {
		this.locale = {}; // lazily fetched from server
		this.abbreviations = {}; // no journal abbreviations at the moment
								// see demo/loadabbres.js in citeproc-js repo for an example
	};

	// Fetches and returns the locale for the given language,
	// or falls back to "en-US" if not available
	Sys.prototype.retrieveLocale = function (lang) {
		var that = this,
			locale = this.locale[lang],
			localePath;

		if (typeof(locale) === "undefined") {
			localePath = CSLEDIT_urlUtils.getResourceUrl("external/locales/locales-" + lang + ".xml");

			// try to fetch from server
			$.ajax({
				url : localePath,
				success : function (data) {
					debug.log("fetched locale data for " + lang);
					that.locale[lang] = data;
					locale = data;
				},
				error : function (jqXHR, textStatus) {
					debug.log("ERROR retrieving locale data for " + lang);
					debug.log("Falling back to en-US");

					locale = that.retrieveLocale("en-US");
				},
				dataType : "text",
				async : false
			});
		}
		
		return locale;
	};

	// Set the list of abbreviations
	Sys.prototype.setAbbreviations = function (abbreviations) {
		this.abbreviations = abbreviations;
	};

	// Set the list of JSON documents (all the references used in the citation clusters)
	Sys.prototype.setJsonDocuments = function (jsonDocuments) {
		this.jsonDocuments = jsonDocuments;
	};

	// Returns the JSON document at the given index
	Sys.prototype.retrieveItem = function (index) {
		return this.jsonDocuments[index];
	};

	// Returns the appropriate abbreviation
	Sys.prototype.getAbbreviations = function (name, vartype) {
		return this.abbreviations[name][vartype];
	};

	return new Sys();
});
