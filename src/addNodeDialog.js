"use strict";

// The add node dialog
//
// This allows the user to add from a list of possible child nodes
// to add to the currently selected element

define(
		[	'src/dataInstance',
			'src/uiConfig',
			'src/controller',
			'src/CslNode',
			'src/urlUtils',
			'src/mustache'
		],
		function (
			CSLEDIT_data,
			CSLEDIT_uiConfig,
			CSLEDIT_controller,
			CSLEDIT_CslNode,
			CSLEDIT_urlUtils,
			CSLEDIT_mustache
		) {	

	var show = function () {
		var node = CSLEDIT_data.getNode(CSLEDIT_viewController.selectedNode()),
			translatedCslId,
			translatedNodeInfo,
			translatedParentName,
			possibleElements,
			element,
			possibleElementsExist = false,
			dialogDiv,
			mustacheData = {};

		if (node === null) {
			alert("Please select a node in to create within first");
			return;
		}

		mustacheData.parentDisplayName = CSLEDIT_uiConfig.displayNameFromNode(node);

		// If the user is selecting a macro instance, add a node within
		// the corresponding macro definition
		translatedCslId = CSLEDIT_data.macroDefinitionIdFromInstanceId(node.cslId);
		translatedNodeInfo = CSLEDIT_data.getNodeAndParent(translatedCslId);

		if (translatedNodeInfo.parent === null) {
			translatedParentName = "root";
		} else {
			translatedParentName = translatedNodeInfo.parent.name;
		}

		// populate with possible child elements based on schema
		possibleElements = CSLEDIT_viewController.selectedViewProperty("possibleChildren");
		if (possibleElements === null) {
			possibleElements = {};

			$.each(CSLEDIT_schema.childElements(translatedParentName + "/" + translatedNodeInfo.node.name),
				function (element, quantifier) {
					possibleElements[element] = quantifier;
				}
			);
		}

		// hard-coded constraint for 'choose' node
		// TODO: generalise this to more nodes, using the schema if not too difficult
		if (translatedNodeInfo.node.name === "choose") {
			// better order than schema:
			possibleElements = {
				"if" : "one",
				"else-if" : "zeroOrMore",
				"else" : "optional"
			};

			// only allowed one 'if' and one 'else' node
			$.each(translatedNodeInfo.node.children, function (i, childNode) {
				if (childNode.name === "if" && "if" in possibleElements) {
					delete possibleElements["if"];
				} else if (childNode.name === "else" && "else" in possibleElements) {
					delete possibleElements["else"];
				}
			});

			// if doesn't yet contain 'if' node, only allow adding that
			if ("if" in possibleElements) {
				delete possibleElements["else-if"];
				delete possibleElements["else"];
			}
		}

		mustacheData.childNodes = [];
		$.each(possibleElements, function (element) {
			var documentation,
				nodeData = {
					nodeName: element,
					displayName: CSLEDIT_uiConfig.displayNameFromNode(new CSLEDIT_CslNode(element))
				};

			if (element in CSLEDIT_uiConfig.nodeIcons) {
				nodeData.imageUrl =
					CSLEDIT_urlUtils.getResourceUrl(CSLEDIT_uiConfig.nodeIcons[element]);
			}

			documentation = CSLEDIT_schema.documentation(translatedNodeInfo.node.name + "/" + element);
			if (typeof(documentation) !== "undefined") {
				nodeData.documentation = documentation;
			}
			mustacheData.childNodes.push(nodeData);
			possibleElementsExist = true;
		});

		if (!possibleElementsExist) {
			alert("You can't create nodes within " + CSLEDIT_uiConfig.displayNameFromNode(node) + ".");
			return;
		}

		dialogDiv = $(CSLEDIT_mustache.toHtml('addNodeDialog', mustacheData));
		dialogDiv.find('button.addNodeType').on('click', function (event) {
			var target = $(event.target),
				nodeName = target.attr('data-nodeName'),
				position,
				children = CSLEDIT_data.getNode(CSLEDIT_viewController.selectedNode()).children;

			dialogDiv.dialog('destroy');

			position = "last";

			// override position for certain nodes
			// TODO: generalise
			if (nodeName === 'if' || nodeName === 'sort') {
				position = "first";
			} else if (nodeName === 'else-if' && children[children.length - 1].name === "else") {
				position = children.length - 1;
			} else if (nodeName === 'macro') {
				position = "last";
				// put it before the citation node:
				$.each(children, function (i, child) {
					if (child.name === "citation") {
						position = i;
						return false;
					}
				});
			}

			CSLEDIT_controller.exec("addNode", [
				CSLEDIT_viewController.selectedNode(), position, { name : nodeName, attributes : []}
			]);
		});
		dialogDiv.dialog({
			modal : true,
			width : "650px"
		});
	};

	return {
		show : show
	};
});
