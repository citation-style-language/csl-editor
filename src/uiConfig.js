"use strict";

var CSLEDIT = CSLEDIT || {};

CSLEDIT.uiConfig = {};

// if creating an empty node, populate with these attributes
CSLEDIT.uiConfig.defaultAttributes = {
	"text" : {
		"value" : ""
	},
	"if" : {
		"type" : ""
	},
	"else-if" : {
		"type" : ""
	},
	"date" : {
		"form" : "text",
		"date-parts" : "year-month-day",
		"variable" : "issued"
	}
}

// for jstree
CSLEDIT.uiConfig.nodeTypes = {
		"default" : {
			"icon" : {
				"image" : "../external/famfamfam-icons/bullet_black.png"
			}
		},
		"text" : {
			"icon" : {
				"image" : "../external/famfamfam-icons/style.png"
			}
		},
		"macro" : {
			"icon" : {
				"image" : "../external/famfamfam-icons/brick.png"
			}
		},
		"info" : {
			"icon" : {
				"image" : "../external/famfamfam-icons/information.png"
			}
		},
		"choose" : {
			"icon" : {
				"image" : "../external/fugue-icons/question-white.png"
			}
		},
		"date" : {
			"icon" : {
				"image" : "../external/famfamfam-icons/date.png"
			}
		},
		"style" : {
			"icon" : {
				"image" : "../external/famfamfam-icons/cog.png"
			}
		},
		"citation" : {
			"icon" : {
				"image" : "../external/famfamfam-icons/page_white_edit.png"
			}
		},
		"bibliography" : {
			"icon" : {
				"image" : "../external/famfamfam-icons/text_list_numbers.png"
			}
		},
		"sort" : {
			"icon" : {
				"image" : "../external/fugue-icons/sort-alphabet.png"
			}
		},
		"number" : {
			"icon" : {
				"image" : "../external/fugue-icons/edit-number.png"
			}
		},
		"layout" : {
			"icon" : {
				"image" : "../external/famfamfam-icons/page_white_stack.png"
			}
		},
		"group" : {
			"icon" : {
				"image" : "../external/famfamfam-icons/page_white_stack.png"
			}
		}
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
		match = "any",
		terms = [],
		variable = "",
		join = "";

	$.each(node.attributes, function (i, attribute) {
		if (attribute.enabled) {
		   if (attribute.key === "match") {
				match = attribute.value;
			} else {
				assertEqual(terms.length, 0);
				console.log(node);
				terms = attribute.value.split(" ");

				// type is so common, don't bother displaying it
				if (attribute.key !== "type") {
					variable = attribute.key;
				}
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
		}
	};
