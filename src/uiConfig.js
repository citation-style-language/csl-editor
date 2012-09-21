"use strict";

// Hard-coded configuration data used to populate the UI

define(
		[	'src/CslNode',
			'src/debug'
		], function (
			CSLEDIT_CslNode,
			debug
		) {
	var CSLEDIT_uiConfig = {};

	// Defines the contents of the Visual Editor tree view
	CSLEDIT_uiConfig.smartTreeSchema = [
		{
			id : "info",
			name : "Style Info",
			// TODO: Fix src/SmartTree so that the locale node can be added.
			//       At present there's a bug where adding a locale node doesn't
			//       put it in the tree because it's a child of the "style" node, and
			//       therefore part of that range.
			//       (note - not an issue for 'style/info' since the bug only affects
			//       nodes added during a session, and 'style/info' is a required node)
			//headingNodePath : "style",
			//headingNodePossibleChildren : {
			//	"locale" : "one"
			//},
			//headingNodeShowPropertyPanel : false,
			nodePaths : ["style/info", "style", /* "style/locale" */],
			macroLinks : false,
			leafNodes : ["info", "style"]
		},
		{
			id : "citations",
			name : "Inline Citations",
			headingNodePath : "style/citation",
			headingNodePossibleChildren : {
				"layout" : "one",
				"sort" : "one"
			},
			nodePaths : ["style/citation/layout", "style/citation/sort"],
			//leafNodes : ["sort"],
			macroLinks : true
		},
		{
			id : "bibliography",
			name : "Bibliography",
			headingNodePath : "style/bibliography",
			headingNodePossibleChildren : {
				"layout" : "one",
				"sort" : "one"
			},
			nodePaths : ["style/bibliography/layout", "style/bibliography/sort"],
			//leafNodes : ["sort"],
			macroLinks : true
		},
		{
			id : "macro",
			name : "Macros",
			headingNodePath : "style",
			headingNodePossibleChildren : {
				"macro" : "zeroOrMore"
			},
			headingNodeShowPropertyPanel : false,
			nodePaths : ["style/macro"],
			macroLinks : true,
		},
		{
			id : "locale",
			name : "Advanced",
			headingNodePath : "",
			macroLinks : false,
			nodePaths : ["style"]
		}
	];

	// If creating an empty node, populate with these attributes
	CSLEDIT_uiConfig.defaultAttributes = {
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
		},
		"date-part" : {
			"name" : "year"
		},
		"key" : {
			"variable" : "author"
		}
	};

	// If creating an empty node, populate with these children
	CSLEDIT_uiConfig.defaultChildren = {
		"bibliography" : [
			{
				name: "layout",
				attributes: [],
				children: []
			}
		]
	};

	// Defines the different fieldsets within the genericPropertyPanel
	CSLEDIT_uiConfig.attributeGroups = {
		"Text formatting" : [
			"fontFormattingControls",
			"display",
			"text-case"
		],
		"Affixes" : [
			"prefix",
			"suffix",
			"delimiter"
		]
	};

	// For displaying the example metadata in Search by Example page
	CSLEDIT_uiConfig.fieldOrder = [
		"type",
		"title",
		"author",
		"editor",
		"translator",
		"issued",
		"container-title",
		"volume",
		"issue",
		"chapter",
		"page",
		"number-of-pages",
		"publisher"
	];

	// Add classes to the <input> or <select> elements for various attributes
	CSLEDIT_uiConfig.attributeClasses = {
		"delimiter" : "short",
		"display" : "exampleClass1 exampleClass2"
	};

	// The icons to use in the Visual Editor tree view
	CSLEDIT_uiConfig.nodeIcons = {
		"default" : "external/famfamfam-icons/bullet_black.png",
		"text" : "external/famfamfam-icons/style.png",
		"macro" : "external/famfamfam-icons/brick.png",
		"info" : "external/famfamfam-icons/information.png",
		"choose" : "external/fugue-icons/question-white.png",
		"date" : "external/famfamfam-icons/date.png",
		"style" : "external/famfamfam-icons/cog.png",
		"citation" : "external/famfamfam-icons/page_white_edit.png",
		"bibliography" : "external/famfamfam-icons/text_list_numbers.png",
		"sort" : "external/fugue-icons/sort-alphabet.png",
		"number" : "external/fugue-icons/edit-number.png",
		"layout" : "external/famfamfam-icons/page_white_stack.png",
		"group" : "external/famfamfam-icons/page_white_stack.png"
	};

	// Returns the given string with the first letter capitalised
	CSLEDIT_uiConfig.capitaliseFirstLetter = function (string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
	};

	// Returns the display name to use to represent the given node
	// in the UI
	CSLEDIT_uiConfig.displayNameFromNode = function (node) {
		if (node.name in CSLEDIT_uiConfig.displayNames) {
			return CSLEDIT_uiConfig.displayNames[node.name](node);
		}

		// fall back to using the node name
		return CSLEDIT_uiConfig.capitaliseFirstLetter(node.name);
	};

	// generates display names for 'if' and 'else-if' tree view nodes
	//   e.g. If article OR book
	CSLEDIT_uiConfig.conditionalDisplayName = function (node) {
		var displayName = "",
			elideLimit = 30,
			match,
			terms = [],
			join = "";

		match = CSLEDIT_schema.attributes("choose/if").match.defaultValue;
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
		debug.assert(false);
		}

		if (displayName.length > elideLimit) {
			displayName = displayName.substr(0, elideLimit - 3) + "...";
		}

		return displayName;
	};

	// A map of node names to the function used to generate its display name
	CSLEDIT_uiConfig.displayNames = {
		"macro" : function (node) {
			return "Macro: " + new CSLEDIT_CslNode(node).getAttr("name");
		},
		"text" : function (node) {
			var cslNode = new CSLEDIT_CslNode(node),
				macro = cslNode.getAttr("macro"),
				term = cslNode.getAttr("term"),
				value = cslNode.getAttr("value"),
				variable = cslNode.getAttr("variable");

			if (macro !== "") {
				return macro + " (macro)";
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
			var variable = new CSLEDIT_CslNode(node).getAttr("variable"),
				displayName = "Label";

			if (variable !== "") {
				displayName = variable + " (label)";
			}
			return displayName;
		},
		"number" : function (node) {
			var variable = new CSLEDIT_CslNode(node).getAttr("variable");

			if (variable !== "") {
				return variable;
			}
			return "Number";
		},
		"if" : CSLEDIT_uiConfig.conditionalDisplayName,
		"else-if" : CSLEDIT_uiConfig.conditionalDisplayName,
		"citation" : function () {
			return "Inline Citations";
		},
		"bibliography" : function () {
			return "Bibliography";
		},
		"choose" : function () {
			return "Conditional";
		},
		"style" : function () {
			return "Global Formatting Options";
		},
		"key" : function (node) {
			var variable = new CSLEDIT_CslNode(node).getAttr("variable"),
				macro = new CSLEDIT_CslNode(node).getAttr("macro");

			if (macro !== "") {
				return "Sort by " + macro;
			} else if (variable !== "") {
				return "Sort by " + variable;
			}

			return "Sort key";
		}
	};
	return CSLEDIT_uiConfig;
});
