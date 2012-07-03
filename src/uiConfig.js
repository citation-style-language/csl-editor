"use strict";

var CSLEDIT = CSLEDIT || {};

CSLEDIT.uiConfig = {};

// if creating an empty node, populate with these attributes
CSLEDIT.uiConfig.defaultAttributes = {
	"text" : {
		"value" : ""
	},
	"if" : {
		"type" : "article",
		"match" : "any"
	},
	"else-if" : {
		"type" : "article",
		"match" : "any"
	},
	"date" : {
		"form" : "text",
		"date-parts" : "year-month-day",
		"variable" : "issued"
	}
}

// for jstree
CSLEDIT.uiConfig.nodeIcons = {
		"default" : "/external/famfamfam-icons/bullet_black.png",
		"text" : "/external/famfamfam-icons/style.png",
		"macro" : "/external/famfamfam-icons/brick.png",
		"info" : "/external/famfamfam-icons/information.png",
		"choose" : "/external/fugue-icons/question-white.png",
		"date" : "/external/famfamfam-icons/date.png",
		"style" : "/external/famfamfam-icons/cog.png",
		"citation" : "/external/famfamfam-icons/page_white_edit.png",
		"bibliography" : "/external/famfamfam-icons/text_list_numbers.png",
		"sort" : "/external/fugue-icons/sort-alphabet.png",
		"number" : "/external/fugue-icons/edit-number.png",
		"layout" : "/external/famfamfam-icons/page_white_stack.png",
		"group" : "/external/famfamfam-icons/page_white_stack.png"
	};

CSLEDIT.uiConfig.capitaliseFirstLetter = function (string)
	{
	    return string.charAt(0).toUpperCase() + string.slice(1);
	};

CSLEDIT.uiConfig.displayNameFromNode = function (node) {
		if (node.name in CSLEDIT.uiConfig.displayNames) {
			return CSLEDIT.uiConfig.displayNames[node.name](node);
		}

		// fall back to using the node name
		return CSLEDIT.uiConfig.capitaliseFirstLetter(node.name);
	};

CSLEDIT.uiConfig.conditionalDisplayName = function (node) {
	var displayName = "",
		elideLimit = 30,
		match,
		terms = [],
		join = "";

	match = CSLEDIT.schema.attributes("choose/if").match.defaultValue;
	if (match === "") {
		match = "all"; // becuase it's not specified in MLZ schema, TODO: ask Frank
	}

	$.each(node.attributes, function (i, attribute) {
		if (attribute.enabled) {
		   if (attribute.key === "match") {
				match = attribute.value;
			} else {
				$.each(attribute.value.split(" "), function (i, val) {
					terms.push(val);
				});
			}
		}
	});

	if (node.name === "if") {
		displayName = "If ";
	} else {
		displayName = "Else-If ";
	}

	if (match === "any") {
		displayName += terms.join(" OR ");
	} else if (match === "all") {
		displayName += terms.join(" AND ");
	} else if (match === "none") {
		displayName += "NOT (" + terms.join(" OR ") + ")";
	} else {
		assert(false);
	}

	if (displayName.length > elideLimit) {
		displayName = displayName.substr(0, elideLimit-3) + "...";
	}

	return displayName;
};

CSLEDIT.uiConfig.displayNames = {
		"macro" : function (node) {
			return "Macro: " + new CSLEDIT.CslNode(node).getAttr("name");
		},
		"text" : function (node) {
			var cslNode = new CSLEDIT.CslNode(node),
				macro = cslNode.getAttr("macro"),
				term = cslNode.getAttr("term"),
				value = cslNode.getAttr("value"),
				variable = cslNode.getAttr("variable");

			if (macro !== "") {
				return  macro + " (macro)";
			} else if (term !== "") {
				return term + " (term)";
			} else if (value !== "") {
				return value + " (value)";
			} else if (variable !== "") {
				return variable + " (variable)";
			}
			return "Text";
		},
		"label" : function (node) {
			var variable = new CSLEDIT.CslNode(node).getAttr("variable"),
				displayName = "Label";

			if (variable !== "") {
				displayName = variable + " (Label)";
			}
			return displayName;
		},
		"number" : function (node) {
			var variable = new CSLEDIT.CslNode(node).getAttr("variable");

			if (variable !== "") {
				return variable;
			}
			return "Number";
		},
		"if" : CSLEDIT.uiConfig.conditionalDisplayName,
		"else-if" : CSLEDIT.uiConfig.conditionalDisplayName,
		"citation" : function () {
			return "Inline Citations";
		},
		"bibliography" : function () {
			return "Bibliography";
		},
		"choose" : function () {
			return "Conditional";
		}
	};
