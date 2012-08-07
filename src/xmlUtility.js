"use strict";

var CSLEDIT = CSLEDIT || {};

CSLEDIT.xmlUtility = {
	stripUnsupportedTagsAndContents : function (html, supportedTags) {
		var element;

		element = $("<all>" + html + "</all>");		
		element.find("*").not(supportedTags.join(", ")).remove();

		return element.html();
	},

	stripUnsupportedTags : function (xml, supportedTags) {
		var regExpText = "</?(?:" + supportedTags.join("|") + ")[^<>]*>|(</?[^<>]*>)",
			stripUnsupportedTags,
			match,
			matches = [];

		// will only contain a captured group for unsupported tags
		stripUnsupportedTags = new RegExp(regExpText, "g");

		match = stripUnsupportedTags.exec(xml);
		while (match !== null) {
			if (match.length > 1 && typeof match[1] !== "undefined") {
				matches.push(match[1]);
			}
			match = stripUnsupportedTags.exec(xml);
		}

		$.each(matches, function (index, value) {
			xml = xml.replace(value, "");
		});

		return xml;
	},
	stripAttributesFromTags : function (xml, tags) {
		var regExp = new RegExp("<(" + tags.join("|") + ")[^<>]*>", "g");

		// remove any attributes the tags may have
		xml = xml.replace(regExp, "<$1>");
		return xml;
	},
	stripComments : function (xml) {
		return xml.replace(/<!--[\s\S]*?-->/g, "");
	}
};

