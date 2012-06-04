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
				return  "Text (macro): " + macro;
			} else if (term !== "") {
				return "Text (term): " + term;
			} else if (value !== "") {
				return "Text (value): " + value;
			} else if (variable !== "") {
				return "Text (variable): " + variable;
			}
			return "Text";
		},
		"label" : function (node) {
			var variable = new CSLEDIT.CslNode(node).getAttr("variable"),
				displayName = "Label";

			if (variable !== "") {
				displayName += ": " + variable;
			}
			return displayName;
		},
		"citation" : function () {
			return "Inline Citations";
		},
		"bibliography" : function () {
			return "Bibliography";
		}
	};
