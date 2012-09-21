"use strict";

// Miscellaneous functions for manipulating XML (e.g. stripping tags)

define(function () {
	// Returns the given xml, but with all elements *not* within the
	// supportedTags list removed
	//
	// This removes both the tags and the contents within
	var stripUnsupportedTagsAndContents = function (xml, supportedTags) {
		var element;

		element = $("<all>" + xml + "</all>");		
		element.find("*").not(supportedTags.join(", ")).remove();

		return element.xml();
	};

	// Returns the given xml, but with all tags *not* within the
	// supportedTags list removed, the contents of the tags are kept
	var stripUnsupportedTags = function (xml, supportedTags) {
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
	};

	// Remove all attributes from all the matching tags within the given xml
	// and return the result
	var stripAttributesFromTags = function (xml, tags) {
		var regExp = new RegExp("<(" + tags.join("|") + ")[^<>]*>", "g");

		// remove any attributes the tags may have
		xml = xml.replace(regExp, "<$1>");
		return xml;
	};

	// Strip all single line comments from the given xml and return the result
	var stripComments = function (xml) {
		return xml.replace(/<!--[\s\S]*?-->/g, "");
	};

	// Remove certain tags from the given input and return the result
	var cleanInput = function (input, allowCharacters) {
		var supportedTags = [ 'b', 'i', 'u', 'sup', 'sub' ];

		// we want the contents of these but not the actual tags
		var invisibleTags = [ 'p', 'span', 'div', 'second-field-align', 'table', 'tr', 'td', 'tbody' ]; 

		input = stripComments(input);
		input = stripUnsupportedTagsAndContents(input, supportedTags.concat(invisibleTags));
		input = stripUnsupportedTags(input, supportedTags);
		input = stripAttributesFromTags(input, supportedTags);
		
		if (typeof(allowCharacters) === "undefined" || !allowCharacters) {
			input = input.replace(/&nbsp;/g, " ");
			input = input.replace("\n", "");
			input = input.replace(/&amp;/g, "&#38;");
			input = input.replace(/&lt;/g, "&#60;");
			input = input.replace(/&gt;/g, "&#62;");
			input = input.replace(/&quot;/g, "&#34;");
			input = $.trim(input);
		}

		if (input[input.length - 1] === " ") {
			input = $.trim(input) + "&nbsp;";
		}

		return input;
	};

	// Escape characters within text for html and return the result
	var htmlEscape = function (text) {
		var escaped = text;

		escaped = escaped.replace(/&/g, "&amp;");
		escaped = escaped.replace(/</g, "&lt;");
		escaped = escaped.replace(/>/g, "&gt;");
		escaped = escaped.replace(/"/g, "&quot;");

		return escaped;
	};

	return {
		stripUnsupportedTagsAndContents : stripUnsupportedTagsAndContents,
		stripUnsupportedTags : stripUnsupportedTags,
		stripAttributesFromTags : stripAttributesFromTags,
		stripComments : stripComments,
		cleanInput : cleanInput,
		htmlEscape : htmlEscape
	};	
});

